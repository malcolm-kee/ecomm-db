const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'build', 'db.json');

exports.getData = function getDbData() {
  return new Promise((fulfill, reject) => {
    fs.readFile(dbPath, function afterReadFile(err, data) {
      if (err) {
        console.error(err);
        return reject(err);
      }
      fulfill(JSON.parse(data));
    });
  });
};

exports.saveData = function saveToDb(data) {
  return new Promise((fulfill, reject) => {
    fs.writeFile(dbPath, JSON.stringify(data), 'utf8', function afterWriteFile(err) {
      if (err) {
        console.error(err);
        return reject(err);
      }
      fulfill();
    });
  });
};
