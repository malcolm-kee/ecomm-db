import request from 'request';
import sharp, { Sharp } from 'sharp';
import { isUrl } from './lib/is-url';
import { GenerateImageOption } from './type';

const Image_Size = {
  blur: {
    w: 5,
    h: 5
  }
};

function getSharp(imagePath: string): Promise<Sharp> {
  return new Promise((fulfill, reject) => {
    if (isUrl(imagePath)) {
      request({ url: imagePath, encoding: null }, function afterRequest(err, res, bodyBuffer) {
        if (err) {
          console.error(`Error downloading image: ${imagePath}`);
          return reject(err);
        }

        return fulfill(sharp(bodyBuffer));
      });
    } else {
      return fulfill(sharp(imagePath));
    }
  });
}

/**
 *
 * @typedef {Object} GenerateImageOption
 * @property {number} width
 * @property {number} height
 * @property {'jpg' | 'webp'} format
 * @property {boolean} [blur]
 * @property {'contain' | 'cover'} [fit]
 */

function generateImage(
  img: Sharp,
  { width, height, format, blur = false, fit = 'contain' }: GenerateImageOption
) {
  if (!blur) {
    const imgClone = img.clone().resize(width, height, {
      fit,
      position: 'top',
      background: 'rgb(255,255,255)'
    });

    const sharp = format === 'jpg' ? imgClone.jpeg() : imgClone.webp();

    return {
      sharp,
      width,
      height,
      format
    };
  }

  const imgClone = img.clone().resize(Image_Size.blur.w, Image_Size.blur.h, {
    fit,
    background: 'rgb(255,255,255)',
    kernel: 'cubic'
  });

  const sharp = (format === 'jpg' ? imgClone.jpeg({ quality: 1 }) : imgClone.webp({ quality: 1 }))
    .blur()
    .resize(width, height, { kernel: 'cubic' });

  return {
    sharp,
    width,
    height,
    format
  };
}

export async function processImage(
  imagePath: string,
  imageGenerationOptions: GenerateImageOption[]
) {
  const sharp = await getSharp(imagePath);

  return imageGenerationOptions.map(option => generateImage(sharp, option));
}
