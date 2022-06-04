const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const scripts = ['cropArea', 'frameScript', 'frameContent'];

module.exports = {
  entry: {
    popup: path.resolve('src/popup/popup.tsx'),
    background: path.resolve('src/background/background.ts'),
    cropArea: path.resolve('src/contentScript/Screenshot/CropArea/cropArea.tsx'),
    frameContent: path.resolve('src/contentScript/Screenshot/ImageHandler/frameContent.tsx'),
    frameScript: path.resolve('src/contentScript/Screenshot/ImageHandler/frameScript.tsx'),
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@utils': path.resolve('src/utils'),
      '@components': path.resolve('src/components'),
    },
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('src/static'),
          to: path.resolve('build'),
        },
      ],
    }),
    ...getHtmlPlugins(['popup', ...scripts]),
  ],
  output: {
    filename: '[name].js',
    path: path.resolve('build'),
  },
  optimization: {
    splitChunks: {
      chunks(chunk) {
        return !scripts.includes(chunk.name);
      },
    },
  },
};

function getHtmlPlugins(chunks) {
  return chunks.map(
    (chunk) =>
      new HtmlPlugin({
        title: 'React Extension',
        filename: `${chunk}.html`,
        chunks: [chunk],
      }),
  );
}
