import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { imageOutputFolder, imagePublicPath } from './constants';
import { kebabCase } from './lib/kebab-case';
import { BannerInfo, ImageInfo, ProcessedProduct, ProductImageInfo } from './type';
import { Sharp } from 'sharp';

function writeFileToImgFolder(fileName: string, sharp: Sharp, buffer: Buffer | null) {
  return new Promise((fulfill, reject) => {
    const writeStream = fs.createWriteStream(path.resolve(imageOutputFolder, fileName));
    writeStream.once('error', reject);
    writeStream.once('finish', fulfill);

    if (buffer) {
      writeStream.write(buffer);
      writeStream.end();
    } else {
      sharp.pipe(writeStream);
    }
  });
}

function mapImagePath(imageName: string) {
  return `${imagePublicPath}${imageName}`;
}

async function writeImagesForProduct(product: ProcessedProduct) {
  const images: ProductImageInfo = {};
  const writeFilesPromises: Promise<unknown>[] = [];

  product.imgs.forEach(function createImg(imgData) {
    const imgName = `${kebabCase(product.name)}.${imgData.size}.${imgData.img.height}x${
      imgData.img.width
    }.${imgData.img.format}`;
    images[imgData.size] = mapImagePath(imgName);

    writeFilesPromises.push(writeFileToImgFolder(imgName, imgData.img.sharp, imgData.img.buffer));
  });

  await Promise.all(writeFilesPromises);

  return product.imgs.length > 0 ? images : null;
}

async function writeAllProductImages(products: ProcessedProduct[]) {
  const chunks = _.chunk(products, 20);
  let allImages: Array<ProductImageInfo | null> = [];

  for (const chunk of chunks) {
    const images = await Promise.all(chunk.map(writeImagesForProduct));
    allImages = allImages.concat(images);
  }

  return allImages.map((images, index) => {
    const { imgs: _, ...productData } = products[index];
    return {
      ...productData,
      images,
    };
  });
}

async function writeImagesForBanner(banner: ImageInfo, index: number) {
  const imageMap: BannerInfo = {};

  for (const image of banner.images) {
    const imgName = `banner-${index}${image.blur ? '-blur' : ''}.${image.height}x${image.width}.${
      image.format
    }`;
    await writeFileToImgFolder(imgName, image.sharp, image.buffer);

    const key = image.blur ? image.width + 'Blur' : image.width;
    imageMap[key] = mapImagePath(imgName);
  }

  return imageMap;
}

const writeAllBannerImages = (banners: ImageInfo[]) =>
  Promise.all(banners.map(writeImagesForBanner));

export async function writeImageFiles(products: ProcessedProduct[], bannerImages: ImageInfo[]) {
  const [productsWithImages, bannerInfos] = await Promise.all([
    writeAllProductImages(products),
    writeAllBannerImages(bannerImages),
  ]);

  return { bannerInfos, productsWithImages };
}
