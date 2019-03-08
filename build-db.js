const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const rimraf = require('rimraf');

const createProductDb = require('./src/create-product-db');
const kebabCase = require('./src/kebab-case');

function clean() {
  return new Promise(function(fulfill, reject) {
    rimraf('build', function afterRimraf(rimrafErr) {
      if (rimrafErr) {
        return reject(rimrafErr);
      }
      mkdirp('build', function afterMkdirP(mkdirErr) {
        if (mkdirErr) {
          reject(mkdirErr);
        }
        fulfill();
      });
    });
  });
}

function createFilesAndData(products) {
  return new Promise(function(fulfill, reject) {
    mkdirp('build/images', function afterCreateImageFolder(error) {
      if (error) {
        return reject(error);
      }
      const productImages = [];
      products.forEach(product => {
        const images = {};
        product.imgs.forEach(function createImg(imgData) {
          const imgName = `${kebabCase(product.name)}.${imgData.size}.${imgData.img.info.format}`;
          const writeStream = fs.createWriteStream(
            path.resolve(__dirname, 'build', 'images', imgName)
          );
          writeStream.write(imgData.img.data);
          writeStream.end();

          images[imgData.size] = imgName;
        });

        productImages.push(images);
      });

      const productsWithImages = products.map((product, index) => {
        const { imgs: _, ...productData } = product;
        return Object.assign({}, productData, { images: productImages[index] });
      });

      fulfill(productsWithImages);
    });
  });
}

function buildDb(productDb) {
  return new Promise(function(fulfill, reject) {
    fs.writeFile(
      path.resolve(__dirname, 'build', 'db.json'),
      JSON.stringify({
        productDb
      }),
      'utf8',
      function afterBuildDb(err) {
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

clean()
  .then(createProductDb)
  .then(createFilesAndData)
  .then(buildDb);
