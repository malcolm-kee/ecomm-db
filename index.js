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
const db = require('./db');

const APP_NAME = process.env.HEROKU_APP_NAME;
const PORT = process.env.PORT || 6366;
const app_base = APP_NAME ? `https://${APP_NAME}.herokuapp.com` : `http://localhost:${PORT}`;

const dbFile = path.join(__dirname, 'build', 'db.json');
const uploadFolder = path.resolve(__dirname, 'build', 'public', 'uploads');

/*
  instead of each message will invoke independent save operation,
  we will queue them in a buffer which only invokes every 100ms.
*/
let chatMessageBuffer = [];
const queueChatMessage = (function() {
  /**
   * @type NodeJS.Timeout
   */
  let flushTimerId;
  return function queue(message) {
    chatMessageBuffer.push(message);
    clearTimeout(flushTimerId);
    flushTimerId = setTimeout(flushChatMessageBuffer, 100);
  };
})();
const flushChatMessageBuffer = (function() {
  let isIdle = true;
  return async function flush() {
    if (isIdle) {
      isIdle = false;
      const data = await db.getData();
      let currentId = data.chats.length;
      data.chats = data.chats.concat(
        chatMessageBuffer.map(message => Object.assign({}, { id: ++currentId }, message))
      );
      chatMessageBuffer = [];
      await db.saveData(data);
      // undocumented json server feature, refer https://github.com/typicode/json-server/issues/177#issuecomment-429209894
      jsonServerRouter.db.read(dbFile);
      isIdle = true;
    }
  };
})();

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

const jsonServerRouter = jsonServer.router(dbFile);

server.use('/api', jsonServerRouter);

server.get('/latestChat', (_, res) => {
  db.getData()
    .then(db => res.json(db.chats.slice(-10)))
    .catch(error =>
      res.status(500).json({
        message: 'Internal Server Error',
        error,
      })
    );
});

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

      db.getData()
        .then(db => {
          const storedUser = db.users.find(user => user.id === userId);
          if (storedUser) {
            user = storedUser;
            fulfill(storedUser);
          } else {
            return reject(new Error('Invalid user'));
          }
        })
        .catch(reject);
    });

  const reply = data => ws.send(JSON.stringify(data));

  broadcast(
    {
      type: 'System',
      message: 'New user joined',
    },
    ws
  );

  reply({
    type: 'System',
    message: `There are ${expressWs.getWss().clients.size - 1} users online.`,
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

          broadcast(
            {
              type: 'User',
              message: data.message,
              userName: sender.name,
              userId: data.userId,
              dateTimestamp: date.getTime(),
              displayedDate: format(date, 'HH:mm'),
            },
            undefined,
            true
          );
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

const broadcast = (msg, exclude, shouldSave = false) => {
  const msgPayload = JSON.stringify(msg);
  expressWs.getWss().clients.forEach(client => {
    if (client !== exclude && client.readyState === 1) {
      client.send(msgPayload);
    }
  });

  if (shouldSave) {
    queueChatMessage(msg);
  }
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
