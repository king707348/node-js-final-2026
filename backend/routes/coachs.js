const express = require('express')
const { dataSource } = require('../db/data-source')
const { isValidString, isInteger } = require('../utils/validUtils')
const appError = require('../utils/appError')

const router = express.Router()

router.get('/skill', async (req, res, next) => {
  const skills = await dataSource.getRepository('Skill').find({
    select: {
      id: true,
      name: true
    }
  })
  res.status(200).json({ 
    status: 'success', 
    data: skills 
  })

  return
})

router.post('/skill', async (req, res, next) => {
  const { name } = req.body
  if (!isValidString(name)) {
    return next(appError(400, '欄位未填寫正確'))
  }

  const skills = dataSource.getRepository('Skill')
  const trimmedName = name.trim()
  const isExisting = await skills.findOneBy({ name: trimmedName })
  if (isExisting) {
    return next(appError(409, '資料重複'))
  }

  const skill = await skills.save({ name: trimmedName })
  return res.status(200).json({
    status: 'success', 
    data: skill 
  })

  return
})

router.delete('/skill/:id', async (req, res, next) => {
  const { id } = req.params
  const skills = dataSource.getRepository('Skill')
  const result = await skills.delete(id)

  if (!result.affected) {
    next(appError(400, 'ID錯誤'))

    return
  }
  
  res.status(200).json({ 
    status: 'success', 
    data: result 
  })

  return
})

router.get('/', async (req, res, next) => {
  const { per, page } = req.query
  const perNum = Number(per)
  const pageNum = Number(page)

  if (
    !isInteger(perNum) ||
    !isInteger(pageNum) ||
    !(perNum >= 1) ||
    !(pageNum >= 1)
  ) {
    return next(appError(400, '欄位未填寫正確'))
  }
  const offset = (pageNum - 1) * perNum
  const coachRepository = dataSource.getRepository('Coach')
  const coaches = await coachRepository.find({
    relations: { user: true },
    order: { created_at: 'ASC' },
    take: perNum,
    skip: offset
  })

  const result = coaches.map((coach) => {
    return {
      id: coach.id,
      user_id: coach.user_id,
      name: coach.user.name
    }
  })
  return res.status(200).json({ status: 'success', data: result })
})

router.get('/:coachId', async (req, res, next) => {
  const { coachId } = req.params
  const coachRepository = dataSource.getRepository('Coach')
  const coach = await coachRepository.findOne({
    where: { id: coachId },
    relations: { user: true }
  })

  if (!coach) {
    return next(appError(400, '找不到該教練'))
  }
  const cls = dataSource.getRepository('CoachLinkSkill')
  const skillLinks = await cls.find({
    where: { coach_id: coachId }
  })
  const skillRepository = dataSource.getRepository('Skill')
  const skillArray = []
  for (const link of skillLinks) {
    const skill = await skillRepository.findOneBy({ id: link.skill_id })
    if (skill) skillArray.push(skill.name)
  }

  const result = {
    user: {
      name: coach.user.name,
      role: coach.user.role
    },
    coach: {
      id: coach.id,
      user_id: coach.user_id,
      experience_years: coach.experience_years,
      description: coach.description,
      profile_image_url: coach.profile_image_url,
      created_at: coach.created_at,
      updated_at: coach.updated_at,
      skills: skillArray
    }
  }

  return res.status(200).json({ status: 'success', data: result })
})

router.get('/:coachId/courses', async (req, res, next) => {
  const { coachId } = req.params
  if (!isValidString(coachId)) {
    return next(appError(400, '欄位未填寫正確'))
  }
  const coachRepository = dataSource.getRepository('Coach')
  const coach = await coachRepository.findOneBy({ id: coachId })

  if (!coach) {
    return next(appError(400, '找不到該教練'))
  }
  const courseRepository = dataSource.getRepository('Course')
  const { MoreThan } = require('typeorm')
  const coachCourses = await courseRepository.find({
    where: { user_id: coach.user_id, end_at: MoreThan(new Date()) }
  })

  const userRepository = dataSource.getRepository('User')
  const skillRepository = dataSource.getRepository('Skill')
  const courseOwner = await userRepository.findOneBy({ id: coach.user_id })
  const result = []
  for (const course of coachCourses) {
    const skill = await skillRepository.findOneBy({ id: course.skill_id })
    if (!courseOwner || !skill) continue
    result.push({
      id: course.id,
      name: course.name,
      description: course.description,
      start_at: course.start_at,
      end_at: course.end_at,
      max_participants: course.max_participants,
      coach_name: courseOwner.name,
      skill_name: skill.name
    })
  }

  return res.status(200).json({ status: 'success', data: result })
})

module.exports = router