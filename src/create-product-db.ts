import _ from 'lodash';
import faker from 'faker';
import path from 'path';
import { numOfProducts, imageOutputFolder, imagePublicPath } from './constants';
import { getId } from './lib/get-id';
import { isUrl } from './lib/is-url';
import { products } from './products';
import { Product, GenerateImageOption, ProductImageInfo, DbProduct } from './type';
import { ImageProcessor } from './image-processor';

function getRandomInteger(max: number) {
  return faker.random.number({
    max,
    min: 0,
    precision: 1,
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
    price: faker.commerce.price(),
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
    related: relatedProducts.filter((p, index, array) => array.indexOf(p) === index),
  });
}

const Image_Size = {
  standard: {
    w: 600,
    h: 600,
  },
  thumb: {
    w: 188,
    h: 188,
  },
};

function getProductImageData(product: Product) {
  return {
    imagePath:
      product.image &&
      (isUrl(product.image)
        ? product.image
        : path.resolve(__dirname, '..', 'images', product.image)),
    options: [
      {
        name: 'standard',
        width: Image_Size.standard.w,
        height: Image_Size.standard.h,
        format: 'jpg',
      },
      {
        name: 'webp',
        width: Image_Size.standard.w,
        height: Image_Size.standard.h,
        format: 'webp',
      },
      {
        name: 'thumbStandard',
        width: Image_Size.thumb.w,
        height: Image_Size.thumb.h,
        format: 'jpg',
      },
      {
        name: 'thumbWebp',
        width: Image_Size.thumb.w,
        height: Image_Size.thumb.h,
        format: 'webp',
      },
      {
        name: 'blur',
        width: Image_Size.standard.w,
        height: Image_Size.standard.h,
        format: 'jpg',
        blur: true,
      },
      {
        name: 'thumbBlur',
        width: Image_Size.thumb.w,
        height: Image_Size.thumb.h,
        format: 'jpg',
        blur: true,
      },
    ] as Array<GenerateImageOption & { name: string }>,
  };
}

export function createProductDb(imageProcessor: ImageProcessor): DbProduct[] {
  const allProducts = products
    .concat(createFakeProducts(numOfProducts))
    .map(associateRelatedProducts);
  console.info('Created all products.');

  const result: DbProduct[] = [];
  for (const product of allProducts) {
    const imageData = getProductImageData(product);
    const imageInfo: ProductImageInfo = {};
    imageData.options.forEach(option => {
      const imageFileName = `${_.kebabCase(product.name)}.${option.blur ? 'blur' : 'ori'}.${
        option.height
      }x${option.width}.${option.format}`;

      imageProcessor.addImage({
        imagePath: imageData.imagePath,
        outputPath: `${imageOutputFolder}/${imageFileName}`,
        option,
      });
      imageInfo[option.name] = `${imagePublicPath}${imageFileName}`;
    });
    result.push({
      ...product,
      images: imageInfo,
    });
  }

  allProducts.forEach(product => {
    const imageData = getProductImageData(product);
    imageData.options.forEach(option => {
      imageProcessor.addImage({
        imagePath: imageData.imagePath,
        outputPath: `${imageOutputFolder}/${_.kebabCase(product.name)}.${
          option.blur ? 'blur' : 'ori'
        }.${option.height}x${option.width}.${option.format}`,
        option: option,
      });
    });
  });

  return result;
}
