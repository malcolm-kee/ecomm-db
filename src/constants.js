const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  isDev,
  numOfUsers: isDev ? 3 : 100,
  numOfProducts: isDev ? 0 : 100,
  imagePublicPath: 'https://ecomm-db.herokuapp.com/images/'
};
