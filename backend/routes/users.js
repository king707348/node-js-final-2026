const express = require('express')
const { dataSource } = require('../db/data-source')
const {
  isValidString,
  isValidPassword
} = require('../utils/validUtils')
const appError = require('../utils/appError')
const {
  hashPassword,
  comparePassword,
  generatedToken
} = require('../utils/auth')
const verifyToken = require('../middleware/tokenVerify')

const router = express.Router()

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!isValidString(name) || !isValidString(email) || !isValidString(password)) {
      return next(appError(400, '欄位未填寫正確'))
    }
    if (!isValidPassword(password)) {
      return next(appError(
        400,
        '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
      ))
    }

    const repository = dataSource.getRepository('User')
    const existing = await repository.findOneBy({ email: email.trim() })
    if (existing) {
      return next(appError(409, 'Email 已被使用'))
    }

    const user = await repository.save({
      name: name.trim(),
      email: email.trim(),
      password: await hashPassword(password),
      role: 'USER'
    })
    return res.status(201).json({
      status: 'success',
      data: { user: { id: user.id, name: user.name } }
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!isValidString(email) || !isValidString(password)) {
      return next(appError(400, '欄位未填寫正確'))
    }
    if (!isValidPassword(password)) {
      return next(appError(
        400,
        '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
      ))
    }

    const user = await dataSource
      .getRepository('User')
      .findOneBy({ email: email.trim() })
    if (!user || !(await comparePassword(password, user.password))) {
      return next(appError(400, '使用者不存在或密碼輸入錯誤'))
    }

    const token = generatedToken({ id: user.id, role: user.role })
    return res.status(201).json({
      status: 'success',
      data: { token, user: { name: user.name } }
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/profile', verifyToken, async (req, res) => {
  return res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    }
  })
})

router.put('/profile', verifyToken, async (req, res, next) => {
  try {
    const { name } = req.body
    if (!isValidString(name)) {
      return next(appError(400, '欄位未填寫正確'))
    }

    req.user.name = name.trim()
    await dataSource.getRepository('User').save(req.user)
    return res.status(200).json({
      status: 'success',
      data: { user: { id: req.user.id, name: req.user.name } }
    })
  } catch (error) {
    return next(error)
  }
})

router.put('/password', verifyToken, async (req, res, next) => {
  try {
    const { password, new_password, confirm_new_password } = req.body
    if (
      !isValidString(password) ||
      !isValidString(new_password) ||
      !isValidString(confirm_new_password)
    ) {
      return next(appError(400, '欄位未填寫正確'))
    }
    if (!isValidPassword(new_password)) {
      return next(appError(
        400,
        '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
      ))
    }
    if (new_password !== confirm_new_password) {
      return next(appError(400, '新密碼與確認密碼不一致'))
    }
    if (!(await comparePassword(password, req.user.password))) {
      return next(appError(400, '密碼輸入錯誤'))
    }

    req.user.password = await hashPassword(new_password)
    await dataSource.getRepository('User').save(req.user)
    return res.status(200).json({
      status: 'success',
      data: { message: '密碼更新成功' }
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/credit-package', verifyToken, async (req, res) => {
  const purchaseRepository = dataSource.getRepository('CreditPackagePurchase')
  const packageRepository = dataSource.getRepository('CreditPackage')
  const purchases = await purchaseRepository.find({
    where: { user_id: req.user.id },
    order: { purchase_at: 'DESC' }
  })

  const result = []
  for (const purchase of purchases) {
    const creditPackage = await packageRepository.findOneBy({
      id: purchase.credit_package_id
    })
    if (!creditPackage) continue
    result.push({
      name: creditPackage.name,
      purchased_credits: purchase.purchased_credits,
      price_paid: Number(purchase.price_paid),
      purchase_at: purchase.purchase_at
    })
  }
  return res.status(200).json({ status: 'success', data: result })
})

router.get('/courses', verifyToken, async (req, res) => {
  const purchaseRepository = dataSource.getRepository('CreditPackagePurchase')
  const purchases = await purchaseRepository.find({
    where: { user_id: req.user.id }
  })
  const totalCredits = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.purchased_credits),
    0
  )

  const bookingRepository = dataSource.getRepository('CourseBooking')
  const bookings = await bookingRepository.find({
    where: { user_id: req.user.id }
  })
  const activeCount = bookings.filter(
    (booking) => booking.cancelled_at === null
  ).length

  const courseRepository = dataSource.getRepository('Course')
  const userRepository = dataSource.getRepository('User')
  const courseBooking = []
  for (const booking of bookings) {
    const course = await courseRepository.findOneBy({ id: booking.course_id })
    if (!course) continue
    const coach = await userRepository.findOneBy({ id: course.user_id })
    courseBooking.push({
      course_id: course.id,
      name: course.name,
      coach_name: coach ? coach.name : null,
      start_at: course.start_at,
      end_at: course.end_at,
      cancelled_at: booking.cancelled_at
    })
  }

  return res.status(200).json({
    status: 'success',
    data: {
      credit_remain: totalCredits - activeCount,
      course_booking: courseBooking
    }
  })
})

module.exports = router
