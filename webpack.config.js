const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const WebpackSourceMapSupport = require('webpack-source-map-support');

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
        test: /(.js|.ts)$/,
        use: 'ts-loader'
      }
    ]
  },
  devtool: 'source-map',
  externals: [nodeExternals()],
  node: {
    __dirname: false
  },
  plugins: [new WebpackSourceMapSupport()]
};
