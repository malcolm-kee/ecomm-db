const path = require('path');

const isDev = process.env.IS_DEV === 'true';

const outputFolder = path.resolve(__dirname, '..', 'build');
const publicPath = path.resolve(outputFolder, 'public');

module.exports = {
  isDev,
  outputFolder,
  publicSrcPath: path.resolve(__dirname, '..', 'public'),
  publicPath,
  imageOutputFolder: path.join(publicPath, 'images'),
  numOfUsers: isDev ? 5 : 100,
  numOfProducts: isDev ? 0 : 100,
  imagePublicPath: 'https://ecomm-db.herokuapp.com/images/'
};
