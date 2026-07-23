const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:3001';

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].[contenthash:8].js',
    clean: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        'vendor-xlsx': {
          test: /[\\/]node_modules[\\/]xlsx[\\/]/,
          name: 'vendor-xlsx',
          chunks: 'all',
          priority: 30,
        },
        'vendor-react': {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
          name: 'vendor-react',
          chunks: 'all',
          priority: 20,
        },
        'vendor-lucide': {
          test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
          name: 'vendor-lucide',
          chunks: 'all',
          priority: 20,
        },
        'vendor-common': {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor-common',
          chunks: 'all',
          priority: 10,
        },
      },
    },
  },
  performance: false,
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
    new webpack.DefinePlugin({
      ADMIN_API_BASE_URL: JSON.stringify(process.env.API_BASE_URL || ''),
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /\.test\.ts$/,
    }),
  ],
  devServer: {
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
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
        proxyTimeout: 30000,
        timeout: 30000,
      }
    ],
  },
  mode: 'development',
};
