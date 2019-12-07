import path from 'path';

export const isDev = process.env.IS_DEV === 'true';

export const outputFolder = path.resolve(__dirname, '..', 'build');
export const publicPath = path.resolve(outputFolder, 'public');

export const publicSrcPath = path.resolve(__dirname, '..', 'public');

export const imageOutputFolder = path.join(publicPath, 'images');
export const numOfUsers = isDev ? 5 : 100;
export const numOfProducts = isDev ? 2 : 50;
const APP_NAME = process.env.HEROKU_APP_NAME;
const app_baseurl = APP_NAME ? `https://${APP_NAME}.herokuapp.com` : 'http://localhost:6366';
export const imagePublicPath = `${app_baseurl}/images/`;
