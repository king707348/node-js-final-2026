const jwt = require('jsonwebtoken')
const appError = require('../utils/appError')
const { dataSource } = require('../db/data-source')

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(appError(401, '請先登入'))
  }
  const token = authHeader.split(' ')[1]
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userRepository = dataSource.getRepository('User')
    const user = await userRepository.findOneBy({ id: decoded.id })
    
    if (!user) {
      return next(appError(401, '使用者不存在'))
    }
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(appError(401, 'Token 已過期'))
    }
    if (error.name === 'JsonWebTokenError') {
      return next(appError(401, '無效的 token'))
    }

    return next(appError(401, 'Token 驗證失敗'))
  }
}

module.exports = verifyToken