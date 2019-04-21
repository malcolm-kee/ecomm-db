import path from 'path';

export const isDev = process.env.IS_DEV === 'true';

export const outputFolder = path.resolve(__dirname, '..', 'build');
export const publicPath = path.resolve(outputFolder, 'public');

export const publicSrcPath = path.resolve(__dirname, '..', 'public');

export const imageOutputFolder = path.join(publicPath, 'images');
export const numOfUsers = isDev ? 5 : 100;
export const numOfProducts = isDev ? 0 : 100;
export const imagePublicPath = 'https://ecomm-db.herokuapp.com/images/';
