const express = require("express")
const cors = require("cors")
const coachRoutes = require("./routes/coachs")
const userRoutes = require("./routes/users")
const adminCoachRoutes = require("./routes/adminCoachs")
const courseRoutes = require("./routes/courses")

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/coaches', coachRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin/coaches', adminCoachRoutes)
app.use('/api/courses', courseRoutes)

app.get('/healthcheck', (req, res) => {
  res.status(200).json({
    status: 'success',
    statusCode: 200,
    message: 'ok'
  })
})

app.use('/api/credit-package', require('./routes/creditPackage'))

app.use((err, req, res, next) => {
  const status = err.status || 500
  res.status(status).json({
    status: 'failed',
    message: err.message || '伺服器錯誤'
  })
})

module.exports = app