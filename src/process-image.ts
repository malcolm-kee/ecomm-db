import imagemin from 'imagemin';
import request from 'request';
import sharp, { Sharp } from 'sharp';
import { isUrl } from './lib/is-url';
import { GenerateImageOption } from './type';

const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminWebp = require('imagemin-webp');

export function getSharp(imagePath: string) {
  return new Promise<Sharp>((fulfill, reject) => {
    if (isUrl(imagePath)) {
      request({ url: imagePath, encoding: null }, function afterRequest(
        err,
        _,
        bodyBuffer: Buffer
      ) {
        if (err) {
          console.error(`Error downloading image: ${imagePath}`);
          return reject(err);
        }

        const newSharp = sharp(bodyBuffer);

        return fulfill(newSharp);
      });
    } else {
      const newSharp = sharp(imagePath);
      return fulfill(newSharp);
    }
  });
}

function compressJpg(pipeline: Sharp, { quality = 30 } = {}) {
  return pipeline.toBuffer().then(sharpBuffer =>
    imagemin.buffer(sharpBuffer, {
      plugins: [
        imageminMozjpeg({
          quality,
          progressive: true,
        }),
      ],
    })
  );
}

function compressWebp(pipeline: Sharp, { quality = 5 } = {}) {
  return pipeline.toBuffer().then(sharpBuffer =>
    imagemin.buffer(sharpBuffer, {
      plugins: [imageminWebp({ quality })],
    })
  );
}

export async function generateImage(
  img: Sharp,
  { width, height, format, blur = false, fit = 'contain', position }: GenerateImageOption
) {
  if (!blur) {
    const sharp = img.clone().resize(width, height, {
      fit,
      position,
      background: 'rgb(255,255,255)',
    });

    return {
      width,
      height,
      format,
      blur,
      buffer:
        format === 'jpg'
          ? await compressJpg(sharp, { quality: 100 })
          : await compressWebp(sharp, { quality: 100 }),
    };
  }

  const sharp = img.clone().resize(width, height, {
    fit,
    position,
    background: 'rgb(255,255,255)',
    kernel: 'cubic',
  });

  const compressedBuffer = format === 'jpg' ? await compressJpg(sharp) : await compressWebp(sharp);

  return {
    width,
    height,
    format,
    blur,
    buffer: compressedBuffer,
  };
}
