const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:3001';

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /\.test\.ts$/,
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3002,
    host: '0.0.0.0',
    open: true,
    hot: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: apiProxyTarget,
        changeOrigin: true,
      }
    ],
  },
  mode: 'development',
};
