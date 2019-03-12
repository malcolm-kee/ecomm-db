const faker = require('faker');
const fs = require('fs');
const path = require('path');
const request = require('request');
const sharp = require('sharp');

const getId = require('./get-id');
const isUrl = require('./is-url');
const products = require('./products');

function getRandomInteger(max) {
  return faker.random.number({
    max,
    min: 0,
    precision: 1
  });
}

function getProductImage() {
  function getImage(id) {
    switch (id) {
      case 0:
        return faker.image.fashion(700, 700);

      case 1:
        return faker.image.technics(700, 700);

      default:
        return faker.image.abstract(700, 700);
    }
  }

  return getImage(getRandomInteger(1));
}

function createFakeProduct() {
  return {
    id: getId(),
    name: faker.commerce.productName(),
    descriptions: [faker.commerce.productAdjective(), faker.commerce.productAdjective()],
    image: getProductImage(),
    department: faker.commerce.department(),
    price: faker.commerce.price()
  };
}

/**
 *
 * @param {number} count
 */
function createFakeProducts(count) {
  const products = [];

  for (let index = 0; index < count; index++) {
    products.push(createFakeProduct());
  }

  return products;
}

function associateRelatedProducts(product, _, products) {
  const productsInSameDepartment = products.filter(p => p.department === product.department);
  const relatedProducts = Array.from(
    { length: getRandomInteger(5) },
    () => productsInSameDepartment[getRandomInteger(productsInSameDepartment.length - 1)].id
  );
  return Object.assign({}, product, {
    related: relatedProducts.filter((p, index, array) => array.indexOf(p) === index)
  });
}

function isFileExist(filePath) {
  return new Promise(fulfill => {
    if (!filePath) return fulfill(false);
    if (isUrl(filePath)) return fulfill(true);

    fs.access(filePath, fs.constants.R_OK, err => {
      if (err) return fulfill(false);
      fulfill(true);
    });
  });
}

function getSharp(imagePath) {
  return new Promise((fulfill, reject) => {
    if (isUrl(imagePath)) {
      request({ url: imagePath, encoding: null }, function afterRequest(err, res, bodyBuffer) {
        if (err) return reject(err);

        return fulfill(sharp(bodyBuffer));
      });
    } else {
      return fulfill(sharp(imagePath));
    }
  });
}

function procesProductImage(imagePath) {
  return new Promise((fulfill, reject) => {
    getSharp(imagePath)
      .then(img => {
        const imgLarge = img.clone().resize(600, 600, {
          fit: 'contain',
          background: 'rgb(255,255,255)'
        });
        const imgSmall = img.clone().resize(188, 188, {
          fit: 'contain',
          background: 'rgb(255,255,255)'
        });
        return Promise.all([
          imgLarge
            .clone()
            .jpeg()
            .toBuffer({
              resolveWithObject: true
            }),
          imgLarge
            .clone()
            .webp()
            .toBuffer({
              resolveWithObject: true
            }),
          imgSmall
            .clone()
            .jpeg()
            .toBuffer({
              resolveWithObject: true
            }),
          imgSmall
            .clone()
            .webp()
            .toBuffer({
              resolveWithObject: true
            })
        ]).then(([stdImg, webpImg, stdImgSmall, webpImgSmall]) => [
          { size: 'standard', img: stdImg },
          { size: 'webp', img: webpImg },
          {
            size: 'thumb-standard',
            img: stdImgSmall
          },
          { size: 'thumb-webp', img: webpImgSmall }
        ]);
      })
      .then(fulfill)
      .catch(reject);
  });
}

function processImages(product) {
  const imagePath =
    product.image &&
    (isUrl(product.image) ? product.image : path.resolve(__dirname, 'images', product.image));

  return isFileExist(imagePath).then(imageExist => {
    if (imageExist) {
      return procesProductImage(imagePath);
    } else {
      return [];
    }
  });
}

module.exports = function createProductDb() {
  const allProducts = products.concat(createFakeProducts(100)).map(associateRelatedProducts);
  console.info('Created all products.');
  console.info('Processing product images...');
  return Promise.all(allProducts.map(processImages)).then(images =>
    images.map((processedImgs, index) =>
      Object.assign({}, allProducts[index], { imgs: processedImgs })
    )
  );
};
