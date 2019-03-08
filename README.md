# ecomm-db

A mock db for ecomm sites

## Adding new product

1. Add a new record in [`products.js`](src/products.js)
   - if you want to add image for the product, place it in `src/images` folder.
1. Merge the change to master.

The build step will generate optimized images for all the product images.

After the build process is completed, you can get the image from the route `/images/<image-name.xxx>`.
