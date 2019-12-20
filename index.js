const fs = require('fs');
const path = require('path');
const jsonServer = require('json-server');
const express = require('express');
const formidableMiddleware = require('express-formidable');
const server = express();
const expressWs = require('express-ws')(server);
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, 'build', 'public'),
});

const APP_NAME = process.env.HEROKU_APP_NAME;
const PORT = process.env.PORT || 6366;
const app_base = APP_NAME ? `https://${APP_NAME}.herokuapp.com` : `http://localhost:${PORT}`;

const uploadFolder = path.resolve(__dirname, 'build', 'public', 'uploads');

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

server.use(middlewares);
server.put(
  '/upload',
  formidableMiddleware({
    uploadDir: uploadFolder,
    keepExtensions: true,
    multiples: true,
  }),
  (req, res) => {
    return res.json({
      files: Object.values(req.files).map(file => {
        const { name, ext } = path.parse(file.path);
        return `${app_base}/uploads/${name}${ext}`;
      }),
    });
  }
);

server.use('/api', jsonServer.router(path.join(__dirname, 'build', 'db.json')));

server.ws('/chat', ws => {
  ws.on('message', msg => {
    broadcast(msg);
  });

  ws.on('open', () => console.log(`New connection`));

  ws.on('close', () => console.log(`Socket client disconnected`));
});

const broadcast = msg => {
  expressWs.getWss().clients.forEach(client => {
    client.send(msg);
  });
};

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
