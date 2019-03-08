const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const rimraf = require('rimraf');

const products = require('./src/products');

function clean() {
  return new Promise(function(fulfill, reject) {
    rimraf('build', function afterRimraf(error) {
      if (error) {
        return reject(error);
      }
      mkdirp('build', function afterMkdirP(err) {
        if (err) {
          reject(err);
        }
        fulfill();
      });
    });
  });
}

function buildDb() {
  return new Promise(function(fulfill, reject) {
    fs.writeFile(
      path.resolve(__dirname, 'build', 'db.json'),
      JSON.stringify({
        products
      }),
      'utf8',
      function afterBuildDb(err, data) {
        if (err) {
          console.error('Error build db');
          console.error(err);
          return reject(err);
        }

        console.log('Success build db');
        fulfill();
      }
    );
  });
}

clean().then(buildDb);
