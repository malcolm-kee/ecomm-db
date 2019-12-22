const fs = require('fs');
const path = require('path');
const jsonServer = require('json-server');
const express = require('express');
const formidableMiddleware = require('express-formidable');
const { format } = require('date-fns');
const server = express();
const expressWs = require('express-ws')(server);
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, 'build', 'public'),
  bodyParser: true,
});

const APP_NAME = process.env.HEROKU_APP_NAME;
const PORT = process.env.PORT || 6366;
const app_base = APP_NAME ? `https://${APP_NAME}.herokuapp.com` : `http://localhost:${PORT}`;

const dbFile = path.join(__dirname, 'build', 'db.json');
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

server.use('/api', jsonServer.router(dbFile));

/**
 * @typedef {Object} ChatMessage
 * @property {number} userId
 * @property {string} message
 */

server.ws('/chat', ws => {
  heartbeat.call(ws);

  let user = null;

  /**
   *
   * @param {number} userId
   */
  const getUser = userId =>
    new Promise((fulfill, reject) => {
      if (user) {
        return fulfill(user);
      }

      fs.readFile(dbFile, (err, data) => {
        if (err) {
          return reject(err);
        }
        const db = JSON.parse(data);
        const storedUser = db.users.find(user => user.id === userId);
        if (storedUser) {
          user = storedUser;
          fulfill(storedUser);
        } else {
          return reject(new Error('Invalid user'));
        }
      });
    });

  const reply = data => ws.send(JSON.stringify(data));

  broadcast({
    type: 'System',
    message: 'New user joined',
  });

  reply({
    type: 'System',
    message: `There are ${expressWs.getWss().clients.size} users online.`,
  });

  ws.on('message', rawData => {
    /**
     * @type ChatMessage
     */
    const data = JSON.parse(rawData);
    if (typeof data.userId === 'number' && data.message) {
      getUser(data.userId)
        .then(sender => {
          const date = new Date();

          broadcast({
            type: 'User',
            message: data.message,
            userName: sender.name,
            userId: data.userId,
            dateTimestamp: date.getTime(),
            displayedDate: format(date, 'HH:mm'),
          });
        })
        .catch(err => {
          reply({
            type: 'System',
            message: 'Invalid user',
            payload: err,
          });
        });
    } else {
      reply({
        type: 'System',
        message: 'Invalid message',
        payload: rawData,
      });
    }
  });

  ws.on('close', () => {
    console.log(`Socket client disconnected`);
    const userName = user ? user.name : 'Somebody';
    broadcast({ type: 'System', message: `${userName} left.` });
  });

  ws.on('pong', heartbeat);
});

const broadcast = msg => {
  const msgPayload = JSON.stringify(msg);
  expressWs.getWss().clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(msgPayload);
    }
  });
};

function heartbeat() {
  this.isAlive = true;
}
function noop() {}
setInterval(function pingClientsToEnsureAlive() {
  expressWs.getWss().clients.forEach(function(client) {
    if (client.isAlive === false) {
      console.info(`Client dead`);
      return client.terminate();
    }

    client.isAlive = false;
    client.ping(noop);
  });
}, 30000);

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
