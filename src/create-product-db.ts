import faker from 'faker';
import fs from 'fs';
import path from 'path';
import { numOfProducts } from './constants';
import { getId } from './lib/get-id';
import { isUrl } from './lib/is-url';
import { processImage } from './process-image';
import { products } from './products';
import { ProcessedProduct, Product } from './type';

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
        return `https://placeimg.com/700/700/people`;

      case 1:
        return `https://placeimg.com/700/700/tech`;

      default:
        return `https://placeimg.com/700/700/nature`;
    }
  }

  return getImage(getRandomInteger(1));
}

function createFakeProduct(): Product {
  return {
    id: getId(),
    name: faker.commerce.productName(),
    descriptions: [faker.commerce.productAdjective(), faker.commerce.productAdjective()],
    image: getProductImage(),
    department: faker.commerce.department(),
    price: faker.commerce.price()
  };
}

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
  ]).then(([stdImg, webpImg, stdImgSmall, webpImgSmall, imgBlur, imgBlurSm]) => [
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

export function createProductDb(): Promise<ProcessedProduct[]> {
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
