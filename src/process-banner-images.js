const glob = require('glob');
const processImage = require('./process-image');

function processBannerImages() {
  return new Promise((fulfill, reject) => {
    glob(__dirname + '/images/banner**.jpg', function afterGlob(error, files) {
      if (error) return reject(error);

      return Promise.all(
        files.map(bannerImgPath =>
          processImage(bannerImgPath, [
            {
              width: 1242,
              height: 373,
              fit: 'cover',
              format: 'jpg'
            },
            {
              width: 700,
              height: 350,
              fit: 'cover',
              format: 'jpg'
            },
            {
              width: 500,
              height: 200,
              fit: 'cover',
              format: 'jpg'
            }
          ])
        )
      )
        .then(data =>
          data.map(images => ({
            images
          }))
        )
        .then(fulfill)
        .catch(reject);
    });
  });
}

module.exports = processBannerImages;
