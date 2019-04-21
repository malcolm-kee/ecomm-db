import fs from 'fs';
import path from 'path';
import { imageOutputFolder, imagePublicPath } from './constants';
import { kebabCase } from './lib/kebab-case';
import { BannerInfo, ImageInfo, ProcessedProduct, ProductImageInfo } from './type';
import { Sharp } from 'sharp';

function writeFileToImgFolder(fileName: string, sharp: Sharp) {
  return new Promise((fulfill, reject) => {
    const writeStream = fs.createWriteStream(path.resolve(imageOutputFolder, fileName));
    sharp.pipe(writeStream);
    writeStream.once('error', reject);
    writeStream.once('finish', fulfill);
  });
}

function mapImagePath(imageName: string) {
  return `${imagePublicPath}${imageName}`;
}

async function writeImagesForProduct(product: ProcessedProduct) {
  const images: ProductImageInfo = {};
  const writeFilesPromises: Promise<{}>[] = [];

  product.imgs.forEach(function createImg(imgData) {
    const imgName = `${kebabCase(product.name)}.${imgData.size}.${imgData.img.height}x${
      imgData.img.width
    }.${imgData.img.format}`;
    images[imgData.size] = imgName;

    writeFilesPromises.push(writeFileToImgFolder(imgName, imgData.img.sharp));
  });

  await Promise.all(writeFilesPromises);

  return product.imgs.length > 0 ? images : null;
}

async function writeAllProductImages(products: ProcessedProduct[]) {
  const allImages = await Promise.all(products.map(writeImagesForProduct));
  return allImages.map((images, index) => {
    const { imgs: _, ...productData } = products[index];
    return {
      ...productData,
      images
    };
  });
}

async function writeImagesForBanner(banner: ImageInfo, index: number) {
  const imageMap: BannerInfo = {};
  const writeFilesPromises: Promise<{}>[] = [];

  banner.images.forEach(image => {
    const imgName = `banner-${index}${image.blur ? '-blur' : ''}.${image.height}x${image.width}.${
      image.format
    }`;

    writeFilesPromises.push(writeFileToImgFolder(imgName, image.sharp));

    const key = image.blur ? image.width + 'Blur' : image.width;

    imageMap[key] = mapImagePath(imgName);
  });

  await Promise.all(writeFilesPromises);

  return imageMap;
}

const writeAllBannerImages = (banners: ImageInfo[]) =>
  Promise.all(banners.map(writeImagesForBanner));

export async function writeImageFiles(products: ProcessedProduct[], bannerImages: ImageInfo[]) {
  const [productsWithImages, bannerInfos] = await Promise.all([
    writeAllProductImages(products),
    writeAllBannerImages(bannerImages)
  ]);

  return { bannerInfos, productsWithImages };
}
