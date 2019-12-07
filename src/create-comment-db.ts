import faker from 'faker';
import { getId } from './lib/get-id';
import { Product, User, Comment } from './type';

function getCommentCount() {
  return faker.random.number({ min: 0, max: 10 });
}

function pickUser(users: User[]) {
  const userIndex = faker.random.number({ min: 0, max: users.length - 1, precision: 1 });
  return users[userIndex];
}

export function createCommentDb(products: Product[], users: User[]): Comment[] {
  return products
    .map(product => {
      const comments: Comment[] = [];

      for (let index = 0; index < getCommentCount(); index++) {
        const user = pickUser(users);
        comments.push({
          id: getId(),
          productId: product.id,
          userId: user.id,
          userName: user.name,
          content: faker.lorem.sentence(),
          createdOn: faker.date.past().getTime(),
        });
      }

      return comments;
    })
    .reduce((result, comments) => result.concat(comments), []);
}
