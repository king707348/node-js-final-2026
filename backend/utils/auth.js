const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// 密碼加密
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10)
}
// 比對密碼
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}
// 產生 token
const generatedToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_DAY || '30d'
  })
}

module.exports = {
  hashPassword,
  comparePassword,
  generatedToken
}