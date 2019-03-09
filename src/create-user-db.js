const faker = require('faker');

const getUserId = (function() {
  let id = Date.now();

  return function generateId() {
    return id++;
  };
})();

function createUserProfile() {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  return {
    id: getUserId(),
    name: `${firstName} ${lastName}`,
    email: faker.internet.email(firstName, lastName),
    joinedDate: faker.date.past().getTime(),
    avatar: faker.image.avatar()
  };
}

/**
 * @param {number} userCount
 */
module.exports = function createUserDb(userCount) {
  const users = [];
  for (let index = 0; index < userCount; index++) {
    users.push(createUserProfile());
  }
  return users;
};
