import fs from 'fs';
import path from 'path';

import { imageOutputFolder, imagePublicPath } from './constants';
import { kebabCase } from './lib/kebab-case';

function writeFileToImgFolder(fileName, data) {
  const writeStream = fs.createWriteStream(path.resolve(imageOutputFolder, fileName));
  writeStream.write(data);
  writeStream.end();
}

function mapImagePath(imageName) {
  return `${imagePublicPath}${imageName}`;
}

export function writeImageFiles(products, bannerImages) {
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

  return { bannerImages: bannerImageNames, productsWithImages };
}
