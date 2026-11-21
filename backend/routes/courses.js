const express = require('express')
const { LessThanOrEqual, MoreThan } = require('typeorm')
const { dataSource } = require('../db/data-source')
const verifyToken = require('../middleware/tokenVerify')
const appError = require('../utils/appError')

const router = express.Router()

router.get('/', async (req, res) => {
  const now = new Date()
  const courses = await dataSource.getRepository('Course').find({
    where: {
      start_at: LessThanOrEqual(now),
      end_at: MoreThan(now)
    }
  })

  const userRepository = dataSource.getRepository('User')
  const skillRepository = dataSource.getRepository('Skill')
  const result = []

  for (const course of courses) {
    const coach = await userRepository.findOneBy({ id: course.user_id })
    const skill = await skillRepository.findOneBy({ id: course.skill_id })
    
    if (!coach || !skill) continue

    result.push({
      id: course.id,
      name: course.name,
      description: course.description,
      start_at: course.start_at,
      end_at: course.end_at,
      max_participants: course.max_participants,
      meeting_url: course.meeting_url,
      coach_name: coach.name,
      skill_name: skill.name
    })
  }

  return res.status(200).json({ status: 'success', data: result })
})

router.post('/:courseId', verifyToken, async (req, res, next) => {
  const courseRepository = dataSource.getRepository('Course')
  const course = await courseRepository.findOneBy({ id: req.params.courseId })
  if (!course) {
    return next(appError(400, 'ID錯誤'))
  }

  const bookingRepository = dataSource.getRepository('CourseBooking')
  const existing = await bookingRepository.findOneBy({
    user_id: req.user.id,
    course_id: course.id
  })
  if (existing) {
    return next(appError(400, '已經報名過此課程'))
  }

  const purchaseRepository = dataSource.getRepository('CreditPackagePurchase')
  const purchases = await purchaseRepository.find({
    where: { user_id: req.user.id }
  })
  const totalCredits = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.purchased_credits),
    0
  )
  const activeBookings = await bookingRepository.find({
    where: { user_id: req.user.id }
  })
  const activeCount = activeBookings.filter(
    (booking) => booking.cancelled_at === null
  ).length
  if (totalCredits - activeCount <= 0) {
    return next(appError(400, '已無可使用堂數'))
  }

  const courseActiveBookings = await bookingRepository.find({
    where: { course_id: course.id }
  })
  const activeParticipants = courseActiveBookings.filter(
    (booking) => booking.cancelled_at === null
  ).length
  if (activeParticipants >= course.max_participants) {
    return next(appError(400, '已達最大參加人數，無法參加'))
  }

  await bookingRepository.save({
    user_id: req.user.id,
    course_id: course.id,
    cancelled_at: null
  })
  return res.status(201).json({ status: 'success', data: null })
})

router.delete('/:courseId', verifyToken, async (req, res, next) => {
  const bookingRepository = dataSource.getRepository('CourseBooking')
  const booking = await bookingRepository.findOneBy({
    user_id: req.user.id,
    course_id: req.params.courseId
  })
  if (!booking || booking.cancelled_at !== null) {
    return next(appError(400, 'ID錯誤'))
  }

  await bookingRepository.update(
    { id: booking.id },
    { cancelled_at: new Date() }
  )
  return res.status(200).json({ status: 'success', data: null })
})

module.exports = router
