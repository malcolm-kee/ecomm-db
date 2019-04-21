const fs = require('fs');
const mkdirp = require('mkdirp');
const { ncp } = require('ncp');
const path = require('path');
const rimraf = require('rimraf');

const { createProductDb } = require('./create-product-db');
const processBannerImages = require('./process-banner-images');
const createUserDb = require('./create-user-db');
const createCommentDb = require('./create-comment-db');
const writeImageFiles = require('./write-images-files');
const {
  numOfUsers,
  outputFolder,
  publicSrcPath,
  publicPath,
  imageOutputFolder
} = require('./constants');

function clean() {
  return new Promise(function(fulfill, reject) {
    rimraf(outputFolder, function afterRimraf(rimrafErr) {
      if (rimrafErr) {
        console.error('rimraf error');
        return reject(rimrafErr);
      }
      mkdirp(outputFolder, function afterMkdirP(mkdirErr) {
        if (mkdirErr) {
          console.error('create build folder error');
          reject(mkdirErr);
        }
        fulfill();
      });
    });
  });
}

function setupPublicFolder() {
  return new Promise((fulfill, reject) => {
    mkdirp(publicPath, function afterCreatePublicFolder(error) {
      if (error) {
        console.error('create publicFolder error');
        return reject(error);
      }

      ncp(publicSrcPath, publicPath, copyError => {
        if (copyError) {
          console.error('copy publicFolder error');
          return reject(copyError);
        }

        mkdirp(imageOutputFolder, function afterCreateImageFolder(createImageFolderError) {
          if (createImageFolderError) {
            console.error('copy image publicFolder error');
            return reject(createImageFolderError);
          }
          fulfill();
        });
      });
    });
  });
}

function buildDb({ products, banners, users, comments }) {
  return new Promise(function(fulfill, reject) {
    fs.writeFile(
      path.resolve(outputFolder, 'db.json'),
      JSON.stringify({
        banners,
        comments,
        users,
        products
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

async function build() {
  try {
    await clean();
    await setupPublicFolder();
    const [products, users, bannerImageData] = await Promise.all([
      createProductDb(),
      createUserDb(numOfUsers),
      processBannerImages()
    ]);
    const comments = createCommentDb(products, users);

    const { bannerImages, productsWithImages } = writeImageFiles(products, bannerImageData);

    await buildDb({ banners: bannerImages, products: productsWithImages, users, comments });
  } catch (err) {
    console.error(err);
  }
}

build();
