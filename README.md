# ecomm-db

Generates a mock db for ecomm sites and exposes the data via REST API endpoints

## Setting Up

1. Clone this repo
1. In the root of the project, run `npm ci`.
1. Generates the db build script with `npm run pack`
1. Generates the db with `npm run build`. To make this step faster by generates less data, use `npm run build:local`.
1. Start the server with `npm start`
1. You can now access the endpoints at [http://localhost:3000](http://localhost:3000)

## Adding new product

1. Add a new record in [`products.ts`](src/products.ts)
   - if you want to add image for the product, place it in `src/images` folder.
1. Merge the change to master.

The build step will generate optimized images for all the product images.

After the build process is completed, you can get the image from the route `/images/<image-name.xxx>`.
