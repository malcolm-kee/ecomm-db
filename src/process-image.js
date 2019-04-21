import request from 'request';
import sharp from 'sharp';

import { isUrl } from './lib/is-url';

const Image_Size = {
  blur: {
    w: 5,
    h: 5
  }
};

/**
 *
 * @param {string} imagePath
 * @returns {Promise<sharp.Sharp>}
 */
function getSharp(imagePath) {
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

/**
 *
 * @param {sharp.Sharp} img
 * @param {GenerateImageOption} options
 */
function generateImage(img, { width, height, format, blur = false, fit = 'contain' }) {
  if (!blur) {
    const imgClone = img.clone().resize(width, height, {
      fit,
      background: 'rgb(255,255,255)'
    });

    return Promise.resolve(format === 'jpg' ? imgClone.jpeg() : imgClone.webp()).then(sharp =>
      sharp.toBuffer({
        resolveWithObject: true
      })
    );
  }

  const imgClone = img.clone().resize(Image_Size.blur.w, Image_Size.blur.h, {
    fit,
    background: 'rgb(255,255,255)',
    kernel: 'cubic'
  });

  return Promise.resolve(
    format === 'jpg' ? imgClone.jpeg({ quality: 1 }) : imgClone.webp({ quality: 1 })
  ).then(sharp =>
    sharp
      .blur()
      .resize(width, height, { kernel: 'cubic' })
      .toBuffer({ resolveWithObject: true })
  );
}

/**
 *
 * @param {string} imagePath
 * @param {GenerateImageOption[]} imageGenerationOptions
 */
export function processImage(imagePath, imageGenerationOptions) {
  return getSharp(imagePath).then(img =>
    Promise.all(imageGenerationOptions.map(option => generateImage(img, option)))
  );
}
