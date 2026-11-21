const express = require('express')
const { dataSource } = require('../db/data-source')
const { isValidString, isInteger } = require('../utils/validUtils')
const verifyToken = require('../middleware/tokenVerify')
const verifyCoach = require('../middleware/isCoachVerify')
const appError = require('../utils/appError')

const router = express.Router()

// 升級為教練
router.post('/:id', async (req, res, next) => {
  const { id } = req.params
  if (id === 'courses') {
    return next()
  }
  const { experience_years, description, profile_image_url } = req.body
  
  if (
    !isValidString(description) ||
    !isInteger(experience_years) ||
    experience_years < 0
  ) {
    return next(appError(400, '欄位未填寫正確'))
  }
  if (
    profile_image_url &&
    profile_image_url !== '' &&
    (typeof profile_image_url !== 'string' ||
      !profile_image_url.startsWith('https'))
  ) {
    return next(appError(400, '欄位未填寫正確'))
  }
  const userRepository = dataSource.getRepository('User')
  const coachRepository = dataSource.getRepository('Coach')
  const user = await userRepository.findOneBy({
    id
  })
  const existCoach = await coachRepository.findOneBy({ user_id: id })

  if (!user) {
    return next(appError(400, '使用者不存在'))
  }
  
  if (existCoach) {
    return next(appError(409, '使用者已經是教練'))
  }

  user.role = 'COACH'
  await userRepository.save(user)

  // 建立 coach
  const newCoach = coachRepository.create({
    user_id: id,
    experience_years,
    description: description.trim(),
    profile_image_url: profile_image_url || null
  })
  await coachRepository.save(newCoach)

  return res.status(201).json({
    status: 'success',
    data: {
      user: {
        name: user.name,
        role: user.role
      },
      coach: {
        id: newCoach.id,
        user_id: newCoach.user_id,
        experience_years,
        description,
        profile_image_url,
        created_at: newCoach.created_at,
        updated_at: newCoach.updated_at
      }
    }
  })
})

// 取得教練後台資料
router.get('/', verifyToken, verifyCoach, async (req, res, next) => {
  const coachRepository = dataSource.getRepository('Coach')
  const coach = await coachRepository.findOneBy({
    user_id: req.user.id
  })
  if (!coach) {
    return next(appError(401, '使用者尚未成為教練'))
  }
  const coachSkill = dataSource.getRepository('CoachLinkSkill')
  const links = await coachSkill.find({ where: { coach_id: coach.id } })
 
  return res.status(200).json({
    status: 'success',
    data: {
      id: coach.id,
      experience_years: coach.experience_years,
      description: coach.description.trim(),
      profile_image_url: coach.profile_image_url,
      skill_ids: links.map((l) => l.skill_id)
    }
  })
})

// 更新教練後台資料
router.put('/', verifyToken, verifyCoach, async (req, res, next) => {
  const { experience_years, description, profile_image_url, skill_ids } =
    req.body

  if (
    !isValidString(profile_image_url) ||
    !profile_image_url.startsWith('https') ||
    !isValidString(description) ||
    !isInteger(experience_years) ||
    experience_years < 0 ||
    !Array.isArray(skill_ids) ||
    skill_ids.length === 0
  ) {
    return next(appError(400, '欄位未填寫正確'))
  }

  const coachRepository = dataSource.getRepository('Coach')
  const coach = await coachRepository.findOneBy({
    user_id: req.user.id
  })

  if (!coach) {
    return next(appError(401, '使用者尚未成為教練'))
  }

  const result = await coachRepository.update(
    { id: coach.id },
    {
      experience_years,
      description,
      profile_image_url
    }
  )

  const cls = dataSource.getRepository('CoachLinkSkill')
  await cls.delete({ coach_id: coach.id })

  const newLinks = skill_ids.map((skillId) =>
    cls.create({
      coach_id: coach.id,
      skill_id: skillId
    })
  )
  await cls.save(newLinks)

  return res.status(200).json({
    status: 'success',
    data: {
      id: coach.id,
      experience_years,
      description,
      profile_image_url,
      skill_ids
    }
  })
})

const getCoachStatus = (course) => {
  const now = new Date()
  const startAt = new Date(course.start_at)
  const endAt = new Date(course.end_at)
  if (now < startAt) return '尚未開始'
  if (now > endAt) return '已結束'
  return '進行中'
}

router.post('/courses', verifyToken, verifyCoach, async (req, res, next) => {
  const {
    skill_id,
    name,
    description,
    start_at,
    end_at,
    max_participants,
    meeting_url
  } = req.body

  const startAt = new Date(start_at)
  const endAt = new Date(end_at)
  if (
    !isValidString(skill_id) ||
    !isValidString(name) ||
    !isValidString(description) ||
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime()) ||
    endAt <= startAt ||
    !isInteger(max_participants) ||
    max_participants <= 0 ||
    !isValidString(meeting_url) ||
    !meeting_url.startsWith('https')
  ) {
    return next(appError(400, '欄位未填寫正確'))
  }

  const skill = await dataSource
    .getRepository('Skill')
    .findOneBy({ id: skill_id })
  if (!skill) {
    return next(appError(400, '欄位未填寫正確'))
  }

  const coach = await dataSource
    .getRepository('Coach')
    .findOneBy({ user_id: req.user.id })
  if (!coach) {
    return next(appError(401, '使用者尚未成為教練'))
  }

  const course = await dataSource.getRepository('Course').save({
    user_id: req.user.id,
    skill_id,
    name: name.trim(),
    description: description.trim(),
    start_at: startAt,
    end_at: endAt,
    max_participants,
    meeting_url
  })
  return res.status(201).json({
    status: 'success',
    data: { course: { id: course.id } }
  })
})

router.get('/courses', verifyToken, verifyCoach, async (req, res) => {
  const courses = await dataSource.getRepository('Course').find({
    where: { user_id: req.user.id },
    order: { created_at: 'DESC' }
  })
  return res.status(200).json({
    status: 'success',
    data: courses.map((course) => ({
      id: course.id,
      skill_id: course.skill_id,
      name: course.name,
      description: course.description,
      start_at: course.start_at,
      end_at: course.end_at,
      max_participants: course.max_participants,
      meeting_url: course.meeting_url,
      status: getCoachStatus(course),
      participants: 0
    }))
  })
})

router.get('/courses/:courseId', verifyToken, verifyCoach, async (req, res, next) => {
  const course = await dataSource
    .getRepository('Course')
    .findOneBy({ id: req.params.courseId })
  if (!course || course.user_id !== req.user.id) {
    return next(appError(400, '課程不存在'))
  }
  return res.status(200).json({
    status: 'success',
    data: {
      id: course.id,
      user_id: course.user_id,
      skill_id: course.skill_id,
      name: course.name,
      description: course.description,
      start_at: course.start_at,
      end_at: course.end_at,
      max_participants: course.max_participants,
      meeting_url: course.meeting_url,
      created_at: course.created_at,
      updated_at: course.updated_at
    }
  })
})

router.put('/courses/:courseId', verifyToken, verifyCoach, async (req, res, next) => {
  const repository = dataSource.getRepository('Course')
  const course = await repository.findOneBy({ id: req.params.courseId })
  if (!course || course.user_id !== req.user.id) {
    return next(appError(400, '課程不存在'))
  }

  const {
    skill_id,
    name,
    description,
    start_at,
    end_at,
    max_participants,
    meeting_url
  } = req.body
  const startAt = new Date(start_at)
  const endAt = new Date(end_at)
  if (
    !isValidString(skill_id) ||
    !isValidString(name) ||
    !isValidString(description) ||
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime()) ||
    endAt <= startAt ||
    !isInteger(max_participants) ||
    max_participants <= 0 ||
    !isValidString(meeting_url) ||
    !meeting_url.startsWith('https')
  ) {
    return next(appError(400, '欄位未填寫正確'))
  }

  await repository.update(
    { id: course.id },
    {
      skill_id,
      name: name.trim(),
      description: description.trim(),
      start_at: startAt,
      end_at: endAt,
      max_participants,
      meeting_url
    }
  )
  return res.status(200).json({
    status: 'success',
    data: { id: course.id }
  })
})

router.get('/revenue', verifyToken, verifyCoach, async (req, res, next) => {
  const { month } = req.query
  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december'
  ]
  const foundIndex = months.indexOf(month)
  if (foundIndex === -1) {
    return next(appError(400, '欄位未填寫正確'))
  }

  const coachRepository = dataSource.getRepository('Coach')
  const coach = await coachRepository.findOneBy({
    user_id: req.user.id
  })

  if (!coach) {
    return next(appError(401, '使用者尚未成為教練'))
  }

  const year = new Date().getFullYear()
  const monthIndex = foundIndex + 1

  const bookings = await dataSource.query(
    `SELECT cb.user_id FROM course_bookings cb
    JOIN courses c ON c.id = cb.course_id
    WHERE c.user_id = $1 AND cb.cancelled_at IS NULL
    AND EXTRACT(YEAR FROM cb.created_at) = $2
    AND EXTRACT(MONTH FROM cb.created_at) = $3`,
    [req.user.id, year, monthIndex]
  )

  const creditPackageRepo = dataSource.getRepository('CreditPackage')
  const creditData = await creditPackageRepo.find({
    select: { price: true, credit_amount: true }
  })
  const totalPrice = creditData.reduce((sum, p) => sum + Number(p.price), 0)
  const totalAmount = creditData.reduce(
    (sum, p) => sum + Number(p.credit_amount),
    0
  )
  const perCreditPrice = totalAmount > 0 ? totalPrice / totalAmount : 0
  const revenue = Math.floor(bookings.length * perCreditPrice)
  const total = {
    revenue,
    participants: bookings.length,
    course_count: bookings.length
  }

  return res.status(200).json({
    status: 'success',
    data: { total }
  })
})

module.exports = router