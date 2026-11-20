const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

app.get('/healthcheck', (req, res) => {
  res.status(200).json({
    status: 'success',
    statusCode: 200,
    message: 'ok'
  })
})

module.exports = app