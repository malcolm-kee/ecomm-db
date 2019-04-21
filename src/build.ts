import fs from 'fs';
import mkdirp from 'mkdirp';
import { ncp } from 'ncp';
import path from 'path';
import rimraf from 'rimraf';
import {
  imageOutputFolder,
  numOfUsers,
  outputFolder,
  publicPath,
  publicSrcPath
} from './constants';
import { createCommentDb } from './create-comment-db';
import { createProductDb } from './create-product-db';
import { createUserDb } from './create-user-db';
import { processBannerImages } from './process-banner-images';
import { DbBanner, DbComment, DbProduct, DbUser } from './type';
import { writeImageFiles } from './write-images-files';

function clean() {
  return new Promise(function(fulfill, reject) {
    rimraf(outputFolder, function afterRimraf(rimrafErr) {
      if (rimrafErr) {
        console.error('rimraf error');
        return reject(rimrafErr);
      }
      mkdirp(outputFolder, function afterMkdirP(mkdirErr) {
        if (mkdirErr) {
          console.error('create build folder error');
          reject(mkdirErr);
        }
        fulfill();
      });
    });
  });
}

function setupPublicFolder() {
  return new Promise((fulfill, reject) => {
    mkdirp(publicPath, function afterCreatePublicFolder(error) {
      if (error) {
        console.error('create publicFolder error');
        return reject(error);
      }

      ncp(publicSrcPath, publicPath, copyError => {
        if (copyError) {
          console.error('copy publicFolder error');
          return reject(copyError);
        }

        mkdirp(imageOutputFolder, function afterCreateImageFolder(createImageFolderError) {
          if (createImageFolderError) {
            console.error('copy image publicFolder error');
            return reject(createImageFolderError);
          }
          fulfill();
        });
      });
    });
  });
}

function buildDb({
  products,
  banners,
  users,
  comments
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
        products
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

async function build() {
  try {
    await clean();
    await setupPublicFolder();
    const [products, users, bannerImageData] = await Promise.all([
      createProductDb(),
      createUserDb(numOfUsers),
      processBannerImages()
    ]);
    const comments = createCommentDb(products, users);

    const { bannerInfos, productsWithImages } = await writeImageFiles(products, bannerImageData);

    await buildDb({ banners: bannerInfos, products: productsWithImages, users, comments });
  } catch (err) {
    console.error(err);
  }
}

build();
