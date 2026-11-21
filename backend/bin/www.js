require('dotenv').config()

const app = require('../app')
const { dataSource } = require('../db/data-source')

const port = Number(process.env.PORT || 8080);

const server = async () => {
  try {
    await dataSource.initialize()
     
    console.log('資料庫連線成功')

    app.listen(port, () => {
      console.log(`伺服器啟動成功 server port: ${port}`)
    })
  } catch (error) {
      console.error('伺服器啟動失敗', error)
      process.exit(1)
  } 
}

server()