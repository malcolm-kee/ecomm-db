import imagemin from 'imagemin';
import request from 'request';
import fileType from 'file-type';
import sharp, { Sharp } from 'sharp';
import { isUrl } from './lib/is-url';
import { GenerateImageOption } from './type';

const imageminMozjpeg = require(`imagemin-mozjpeg`);
const imageminWebp = require(`imagemin-webp`);

function checkFileType(buffer: Buffer) {
  try {
    const result = fileType(buffer);
    if (result) {
      console.info(result);
    }
  } catch (e) {
    console.error(`Error parsing filetype ${e}`);
  }
}

function getSharp(imagePath: string): Promise<Sharp> {
  return new Promise((fulfill, reject) => {
    if (isUrl(imagePath)) {
      request({ url: imagePath, encoding: null }, function afterRequest(
        err,
        res,
        bodyBuffer: Buffer
      ) {
        console.group(`Done downloading image: ${imagePath}`);
        if (err) {
          console.error(`Error downloading image: ${imagePath}`);
          return reject(err);
        }
        checkFileType(bodyBuffer);
        console.groupEnd();

        return fulfill(sharp(bodyBuffer));
      });
    } else {
      return fulfill(sharp(imagePath));
    }
  });
}

function compressJpg(pipeline: Sharp, { quality = 30 } = {}) {
  return pipeline.toBuffer().then(sharpBuffer =>
    imagemin.buffer(sharpBuffer, {
      plugins: [
        imageminMozjpeg({
          quality,
          progressive: true
        })
      ]
    })
  );
}

function compressWebp(pipeline: Sharp, { quality = 5 } = {}) {
  return pipeline.toBuffer().then(sharpBuffer =>
    imagemin.buffer(sharpBuffer, {
      plugins: [imageminWebp({ quality })]
    })
  );
}

async function generateImage(
  img: Sharp,
  { width, height, format, blur = false, fit = 'contain', position }: GenerateImageOption
) {
  if (!blur) {
    const sharp = img.clone().resize(width, height, {
      fit,
      position,
      background: 'rgb(255,255,255)'
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
          : await compressWebp(sharp, { quality: 100 })
    };
  }

  const sharp = img.clone().resize(width, height, {
    fit,
    position,
    background: 'rgb(255,255,255)',
    kernel: 'cubic'
  });

  const compressedBuffer = format === 'jpg' ? await compressJpg(sharp) : await compressWebp(sharp);

  return {
    sharp,
    width,
    height,
    format,
    blur,
    buffer: compressedBuffer
  };
}

export async function processImage(
  imagePath: string,
  imageGenerationOptions: GenerateImageOption[]
) {
  const sharp = await getSharp(imagePath);

  return Promise.all(imageGenerationOptions.map(option => generateImage(sharp, option)));
}
