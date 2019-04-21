import faker from 'faker';
import fs from 'fs';
import path from 'path';
import { getId } from './lib/get-id';
import { isUrl } from './lib/is-url';
import products from './products';

const { numOfProducts } = require('./constants');
const processImage = require('./process-image');

/**
 *
 * @typedef {Object} Product
 * @property {number} id
 * @property {string} name
 * @property {string[]} descriptions
 * @property {string} image
 * @property {string} department
 * @property {string} price
 */

interface Product {
  id: number;
  name: string;
  descriptions: string[];
  image: string;
  department: string;
  price: string;
}

function getRandomInteger(max: number) {
  return faker.random.number({
    max,
    min: 0,
    precision: 1
  });
}

function getProductImage() {
  function getImage(id: number) {
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

/**
 * @returns {Product}
 */
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
function createFakeProducts(count: number) {
  const products = [];

  for (let index = 0; index < count; index++) {
    products.push(createFakeProduct());
  }

  return products;
}

function associateRelatedProducts(product: Product, _: any, products: Product[]) {
  const productsInSameDepartment = products.filter(
    p => p.department === product.department && p !== product
  );
  const relatedProducts = Array.from(
    { length: getRandomInteger(Math.min(productsInSameDepartment.length, 5)) },
    () => productsInSameDepartment[getRandomInteger(productsInSameDepartment.length - 1)].id
  );
  return Object.assign({}, product, {
    related: relatedProducts.filter((p, index, array) => array.indexOf(p) === index)
  });
}

function isFileExist(filePath: string) {
  return new Promise(fulfill => {
    if (!filePath) return fulfill(false);
    if (isUrl(filePath)) return fulfill(true);

    fs.access(filePath, fs.constants.R_OK, err => {
      if (err) return fulfill(false);
      fulfill(true);
    });
  });
}

const Image_Size = {
  standard: {
    w: 600,
    h: 600
  },
  thumb: {
    w: 188,
    h: 188
  }
};

function processProductImage(imagePath: string) {
  return processImage(imagePath, [
    {
      width: Image_Size.standard.w,
      height: Image_Size.standard.h,
      format: 'jpg'
    },
    {
      width: Image_Size.standard.w,
      height: Image_Size.standard.h,
      format: 'webp'
    },
    {
      width: Image_Size.thumb.w,
      height: Image_Size.thumb.h,
      format: 'jpg'
    },
    {
      width: Image_Size.thumb.w,
      height: Image_Size.thumb.h,
      format: 'webp'
    },
    {
      width: Image_Size.standard.w,
      height: Image_Size.standard.h,
      format: 'jpg',
      blur: true
    },
    {
      width: Image_Size.thumb.w,
      height: Image_Size.thumb.h,
      format: 'jpg',
      blur: true
    }
  ]).then(([stdImg, webpImg, stdImgSmall, webpImgSmall, imgBlur, imgBlurSm]: string[]) => [
    { size: 'standard', img: stdImg },
    { size: 'webp', img: webpImg },
    {
      size: 'thumbStandard',
      img: stdImgSmall
    },
    { size: 'thumbWebp', img: webpImgSmall },
    { size: 'blur', img: imgBlur },
    { size: 'thumbBlur', img: imgBlurSm }
  ]);
}

function processImages(product: Product) {
  const imagePath =
    product.image &&
    (isUrl(product.image) ? product.image : path.resolve(__dirname, '..', 'images', product.image));

  return isFileExist(imagePath).then(imageExist => {
    if (imageExist) {
      return processProductImage(imagePath);
    } else {
      return [];
    }
  });
}

export function createProductDb() {
  const allProducts = products
    .concat(createFakeProducts(numOfProducts))
    .map(associateRelatedProducts);
  console.info('Created all products.');
  console.info('Processing product images...');
  return Promise.all(allProducts.map(processImages)).then(images =>
    images.map((processedImgs, index) =>
      Object.assign({}, allProducts[index], { imgs: processedImgs })
    )
  );
}
