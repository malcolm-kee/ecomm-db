const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

/**
 * @type {webpack.Configuration}
 */
module.exports = {
  entry: path.resolve(__dirname, 'src', 'build'),
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'build.js'
  },
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      }
    ]
  },
  devtool: 'source-map',
  externals: [nodeExternals()],
  node: {
    __dirname: false
  }
};
