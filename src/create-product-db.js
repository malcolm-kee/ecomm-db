const sharp = require('sharp');
const products = require('./products');
const path = require('path');

function processImages(product) {
  const img = sharp(path.resolve(__dirname, 'images', product.image));
  const imgLarge = img.clone().resize(600, 600, {
    fit: 'inside'
  });
  const imgSmall = img.clone().resize(188, 188, {
    fit: 'inside'
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
    { size: 'thumb-standard', img: stdImgSmall },
    { size: 'thumb-webp', img: webpImgSmall }
  ]);
}

module.exports = function createProductDb() {
  return Promise.all(products.map(processImages)).then(images =>
    images.map((processedImgs, index) =>
      Object.assign({}, products[index], { imgs: processedImgs })
    )
  );
};
