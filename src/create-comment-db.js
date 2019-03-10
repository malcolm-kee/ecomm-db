const faker = require('faker');
const getId = require('./get-id');

function getCommentCount() {
  return faker.random.number({ min: 0, max: 10 });
}

/**
 * @param {Array} users
 */
function pickUser(users) {
  const userIndex = faker.random.number({ min: 0, max: users.length - 1, precision: 1 });
  return users[userIndex];
}

module.exports = function createCommentDb(products, users) {
  return products
    .map(product => {
      const comments = [];

      for (let index = 0; index < getCommentCount(); index++) {
        const user = pickUser(users);
        comments.push({
          id: getId(),
          productId: product.id,
          userId: user.id,
          userName: user.name,
          content: faker.lorem.sentence(),
          createdOn: faker.date.past().getTime()
        });
      }

      return comments;
    })
    .reduce((result, comments) => result.concat(comments), []);
};
