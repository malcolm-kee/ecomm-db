import fs from 'fs';
import mkdirp from 'mkdirp';
import mustache from 'mustache';
import { ncp } from 'ncp';
import path from 'path';
import rimraf from 'rimraf';
import {
  imageOutputFolder,
  numOfUsers,
  outputFolder,
  publicPath,
  publicSrcPath,
} from './constants';
import { createCommentDb } from './create-comment-db';
import { createProductDb } from './create-product-db';
import { createUserDb } from './create-user-db';
import { ImageProcessor } from './image-processor';
import { processBannerImages } from './process-banner-images';
import { DbBanner, DbComment, DbProduct, DbUser, User } from './type';

function clean() {
  return new Promise(function(fulfill, reject) {
    rimraf(outputFolder, function afterRimraf(rimrafErr) {
      if (rimrafErr) {
        console.error('rimraf error');
        return reject(rimrafErr);
      }
      mkdirp(outputFolder)
        .then(fulfill)
        .catch(mkdirErr => {
          console.error('create build folder error');
          reject(mkdirErr);
        });
    });
  });
}

function setupPublicFolder() {
  return new Promise((fulfill, reject) => {
    mkdirp(publicPath)
      .then(() => {
        ncp(publicSrcPath, publicPath, copyError => {
          if (copyError) {
            console.error('copy publicFolder error');
            return reject(copyError);
          }

          mkdirp(imageOutputFolder)
            .then(fulfill)
            .catch(createImageFolderError => {
              console.error('copy image publicFolder error');
              return reject(createImageFolderError);
            });
        });
      })
      .catch(error => {
        console.error('create publicFolder error');
        return reject(error);
      });
  });
}

function buildDb({
  products,
  banners,
  users,
  comments,
}: {
  products: DbProduct[];
  banners: DbBanner[];
  users: DbUser[];
  comments: DbComment[];
}) {
  return new Promise(function(fulfill, reject) {
    fs.writeFile(
      path.resolve(outputFolder, 'db.json'),
      JSON.stringify({
        banners,
        comments,
        users,
        products,
        chats: [],
      }),
      'utf8',
      function afterBuildDb(err) {
        if (err) {
          console.error('Error build db');
          console.error(err);
          return reject(err);
        }

        console.log('Success build db');
        fulfill();
      }
    );
  });
}

function getHomepageTemplate() {
  return new Promise<string>((fulfill, reject) => {
    fs.readFile(path.resolve(publicSrcPath, 'index.html'), 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }
      return fulfill(data);
    });
  });
}

function overwriteHomepage(generatedHomepage: string) {
  return new Promise((fulfill, reject) => {
    fs.writeFile(path.resolve(publicPath, 'index.html'), generatedHomepage, err => {
      if (err) {
        return reject(err);
      }
      return fulfill();
    });
  });
}

async function generateHomepage(users: User[]) {
  const homePageTemplate = await getHomepageTemplate();
  await overwriteHomepage(
    mustache.render(homePageTemplate, {
      users,
    })
  );
}

async function build() {
  try {
    const imageProcessor = new ImageProcessor(15);

    await clean();
    await setupPublicFolder();
    const [products, users, banners] = await Promise.all([
      createProductDb(imageProcessor),
      createUserDb(numOfUsers),
      processBannerImages(imageProcessor),
    ]);
    const comments = createCommentDb(products, users);
    await generateHomepage(users);

    await buildDb({ banners, products, users, comments });

    if (!imageProcessor.isEmpty) {
      console.log(`Waiting image generations...`);
      imageProcessor.logProgress();
      imageProcessor.on('done', () => {
        console.log(`Image generation done`);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

build();
