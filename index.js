const fs = require('fs');
const path = require('path');
const jsonServer = require('json-server');
const formidableMiddleware = require('express-formidable');
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'build', 'db.json'));
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
// TODO: make this works so it will not breaks POST request
/* server.use(
  formidableMiddleware({
    uploadDir: uploadFolder,
    keepExtensions: true,
    multiples: true,
  })
); */
server.put('/upload', (req, res) => {
  return res.json({
    files: Object.values(req.files).map(file => {
      const { name, ext } = path.parse(file.path);
      return `${app_base}/uploads/${name}${ext}`;
    }),
  });
});

server.use(router);
server.listen(PORT, () => {
  console.log(`JSON Server is running at http://localhost:${PORT}`);
});
