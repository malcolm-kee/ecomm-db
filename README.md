# ecomm-db

Generates a mock db for ecomm sites and exposes the data via REST API endpoints

## Upload File

You can upload files to this server by sending `PUT` request to `/upload` path, and it will returns an JSON object with the paths of the files:

```json
{
  "files": ["https://ecomm-db.herokuapp.com/uploads/some-checksum-filename.png"]
}
```

Note that the files uploaded will [be blown away](https://help.heroku.com/K1PPS2WM/why-are-my-file-uploads-missing-deleted) everytime the server restarts. It is meant for you to have a place to upload file temporarily for demo project only.

## Setting Up

1. Clone this repo
1. In the root of the project, run `npm ci`.
1. Generates the db build script with `npm run pack`
1. Generates the db with `npm run build`. To make this step faster by generates less data, use `npm run build:local`.
1. Start the server with `npm start`
1. You can now access the endpoints at [http://localhost:6366](http://localhost:6366)

## Adding new product

1. Add a new record in [`products.ts`](src/products.ts)
   - if you want to add image for the product, place it in `src/images` folder.
1. Merge the change to master.

The build step will generate optimized images for all the product images.

After the build process is completed, you can get the image from the route `/images/<image-name.xxx>`.
