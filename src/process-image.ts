import imagemin from 'imagemin';
import request from 'request';
import sharp, { Sharp } from 'sharp';
import { isUrl } from './lib/is-url';
import { GenerateImageOption } from './type';

const imageminMozjpeg = require(`imagemin-mozjpeg`);
const imageminWebp = require(`imagemin-webp`);

export const getSharp = (function() {
  const sharpMap = new Map<string, Sharp>();

  return function getSharp(imagePath: string): Promise<Sharp> {
    const prevSharp = sharpMap.get(imagePath);
    if (prevSharp) {
      return Promise.resolve(prevSharp.clone());
    }

    return new Promise((fulfill, reject) => {
      if (isUrl(imagePath)) {
        request({ url: imagePath, encoding: null }, function afterRequest(
          err,
          res,
          bodyBuffer: Buffer
        ) {
          if (err) {
            console.error(`Error downloading image: ${imagePath}`);
            return reject(err);
          }

          const newSharp = sharp(bodyBuffer);
          sharpMap.set(imagePath, newSharp);

          return fulfill(newSharp);
        });
      } else {
        const newSharp = sharp(imagePath);
        sharpMap.set(imagePath, newSharp);
        return fulfill(newSharp);
      }
    });
  };
})();

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
      sharp,
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
    sharp,
    width,
    height,
    format,
    blur,
    buffer: compressedBuffer,
  };
}
