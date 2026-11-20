require('../db/data-source');

const app = require('../app');

const port = Number(process.env.PORT || 8080);
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`伺服器啟動成功 server port: ${port}`);
});

server.on('error', (error) => {
  console.error('伺服器啟動失敗', error);
  process.exit(1);
});