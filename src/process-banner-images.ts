import glob from 'glob';
import { processImage } from './process-image';
import { ImageInfo, GenerateImageOption } from './type';

const bannerImageOptions: GenerateImageOption[] = [
  {
    width: 2500,
    height: 1000,
    fit: 'cover',
    format: 'jpg',
    position: 'top',
  },
  {
    width: 1242,
    height: 400,
    fit: 'cover',
    format: 'jpg',
    position: 'top',
  },
  {
    width: 700,
    height: 350,
    fit: 'cover',
    format: 'jpg',
    position: 'top',
  },
  {
    width: 500,
    height: 200,
    fit: 'cover',
    format: 'jpg',
    position: 'top',
  },
];

export function processBannerImages(): Promise<ImageInfo[]> {
  return new Promise((fulfill, reject) => {
    glob(__dirname + '/../images/banner**.jpg', function afterGlob(error, files) {
      if (error) return reject(error);

      return Promise.all(
        files.map(bannerImgPath =>
          processImage(
            bannerImgPath,
            bannerImageOptions.reduce<GenerateImageOption[]>(
              (result, option) =>
                result.concat([
                  option,
                  {
                    ...option,
                    blur: true,
                  },
                ]),
              []
            )
          )
        )
      )
        .then(data =>
          data.map(images => ({
            images,
          }))
        )
        .then(fulfill)
        .catch(reject);
    });
  });
}
