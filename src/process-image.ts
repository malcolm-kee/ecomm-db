import request from 'request';
import sharp, { Sharp } from 'sharp';
import { isUrl } from './lib/is-url';
import { GenerateImageOption } from './type';

const Image_Size = {
  blur: {
    w: 5,
    h: 5
  },
  largeBlur: {
    w: 25,
    h: 25
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

function generateImage(
  img: Sharp,
  { width, height, format, blur = false, fit = 'contain', position }: GenerateImageOption
) {
  if (!blur) {
    const imgClone = img.clone().resize(width, height, {
      fit,
      position,
      background: 'rgb(255,255,255)'
    });

    const sharp = format === 'jpg' ? imgClone.jpeg() : imgClone.webp();

    return {
      sharp,
      width,
      height,
      format,
      blur
    };
  }

  const imgClone = img
    .clone()
    .resize(
      width > 2000 ? Image_Size.largeBlur.w : Image_Size.blur.w,
      width > 2000 ? Image_Size.largeBlur.h : Image_Size.blur.h,
      {
        fit,
        position,
        background: 'rgb(255,255,255)',
        kernel: 'cubic'
      }
    );

  const sharp = (format === 'jpg' ? imgClone.jpeg({ quality: 1 }) : imgClone.webp({ quality: 1 }))
    .blur()
    .resize(width, height, { kernel: 'cubic', position });

  return {
    sharp,
    width,
    height,
    format,
    blur
  };
}

export async function processImage(
  imagePath: string,
  imageGenerationOptions: GenerateImageOption[]
) {
  const sharp = await getSharp(imagePath);

  return imageGenerationOptions.map(option => generateImage(sharp, option));
}
