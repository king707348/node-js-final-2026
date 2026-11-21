const express = require('express')
const { dataSource } = require('../db/data-source')
const { isValidString, isInteger } = require('../utils/validUtils')
const appError = require('../utils/appError')

const router = express.Router()
const verifyToken = require('../middleware/tokenVerify')

router.get('/', async (req, res, next) => {
  const packages = await dataSource.getRepository('CreditPackage').find({
    select: {
      id: true,
      name: true,
      credit_amount: true,
      price: true
    }
  })
  return res.status(200).json({ status: 'success', data: packages })
})

router.post('/', async (req, res, next) => {
  const { name, credit_amount, price } = req.body
  if (
    !isValidString(name) ||
    !isInteger(credit_amount) ||
    credit_amount < 0 ||
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return next(appError(400, '欄位未填寫正確'))
  }

  const repository = dataSource.getRepository('CreditPackage')
  const trimmedName = name.trim()
  const existing = await repository.findOneBy({ name: trimmedName })
  if (existing) {
    return next(appError(409, '資料重複'))
  }

  const created = await repository.save({
    name: trimmedName,
    credit_amount,
    price
  })
  return res.status(200).json({ status: 'success', data: created })
})

router.post('/:id', verifyToken, async (req, res, next) => {
  const packageRepository = dataSource.getRepository('CreditPackage')
  const creditPackage = await packageRepository.findOneBy({ id: req.params.id })
  if (!creditPackage) {
    return next(appError(400, 'ID錯誤'))
  }

  const purchase = await dataSource
    .getRepository('CreditPackagePurchase')
    .save({
      user_id: req.user.id,
      credit_package_id: creditPackage.id,
      purchased_credits: creditPackage.credit_amount,
      price_paid: creditPackage.price
    })
  return res.status(201).json({
    status: 'success',
    data: { purchase_id: purchase.id }
  })
})

router.delete('/:id', async (req, res, next) => {
  const result = await dataSource
    .getRepository('CreditPackage')
    .delete(req.params.id)

  if (!result.affected) {
    return next(appError(400, 'ID錯誤'))
  }
  return res.status(200).json({ status: 'success', data: result })
})

module.exports = router
