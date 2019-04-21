const fs = require('fs');
const mkdirp = require('mkdirp');
const { ncp } = require('ncp');
const path = require('path');
const rimraf = require('rimraf');

const kebabCase = require('./src/lib/kebab-case');
const createProductDb = require('./src/create-product-db');
const processBannerImages = require('./src/process-banner-images');
const createUserDb = require('./src/create-user-db');
const createCommentDb = require('./src/create-comment-db');
const { imagePublicPath, numOfUsers } = require('./src/constants');

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

function copyPublicFolder() {
  return new Promise((fulfill, reject) => {
    mkdirp('build/public', function afterCreatePublicFolder(error) {
      if (error) return reject(error);

      ncp('public', path.join(__dirname, 'build', 'public'), copyError => {
        if (copyError) return reject(copyError);

        fulfill();
      });
    });
  });
}

function createFilesAndData(products) {
  function writeFileToImgFolder(fileName, data) {
    const writeStream = fs.createWriteStream(
      path.resolve(__dirname, 'build', 'public', 'images', fileName)
    );
    writeStream.write(data);
    writeStream.end();
  }

  function mapImagePath(imageName) {
    return `${imagePublicPath}${imageName}`;
  }

  return new Promise(function(fulfill, reject) {
    mkdirp('build/public/images', function afterCreateImageFolder(error) {
      if (error) {
        return reject(error);
      }
      const productImages = [];
      products.forEach(product => {
        const images = {};
        product.imgs.forEach(function createImg(imgData) {
          const imgName = `${kebabCase(product.name)}.${imgData.size}.${imgData.img.info.height}x${
            imgData.img.info.width
          }.${imgData.img.info.format}`;
          writeFileToImgFolder(imgName, imgData.img.data);

          images[imgData.size] = imgName;
        });

        productImages.push(product.imgs.length > 0 ? images : null);
      });

      const productsWithImages = products.map((product, index) => {
        const { imgs: _, ...productData } = product;
        return Object.assign({}, productData, { images: productImages[index] });
      });

      processBannerImages()
        .then(function creatingBannerImages(bannerImages) {
          const bannerImageNames = [];
          bannerImages.forEach((bannerImage, bannerImgIndex) => {
            const imageMap = {};
            bannerImage.images.forEach(image => {
              const imgName = `banner-${bannerImgIndex}.${image.info.height}x${image.info.width}.${
                image.info.format
              }`;

              writeFileToImgFolder(imgName, image.data);

              imageMap[image.info.width] = mapImagePath(imgName);
            });
            bannerImageNames.push(imageMap);
          });
          return bannerImageNames;
        })
        .then(bannerImages => {
          fulfill({ bannerImages, productsWithImages });
        })
        .catch(reject);
    });
  });
}

function buildDb({ products, banners, users, comments }) {
  return new Promise(function(fulfill, reject) {
    fs.writeFile(
      path.resolve(__dirname, 'build', 'db.json'),
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
    await copyPublicFolder();
    const [products, users] = await Promise.all([createProductDb(), createUserDb(numOfUsers)]);
    const comments = createCommentDb(products, users);
    const { bannerImages, productsWithImages } = await createFilesAndData(products);
    await buildDb({ banners: bannerImages, products: productsWithImages, users, comments });
  } catch (err) {
    console.error(err);
  }
}

build();
