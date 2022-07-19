const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

const scripts = ['cropArea', 'frameScript', 'frameContent'];

module.exports = {
  entry: {
    popup: path.resolve('src/popup/popup.tsx'),
    background: path.resolve('src/background/background.ts'),
    cropArea: path.resolve('src/contentScript/cropArea.tsx'),
    frameContent: path.resolve('src/contentScript/frameContent.tsx'),
    frameScript: path.resolve('src/contentScript/frameScript.tsx'),
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(css|scss)$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader', // postcss loader needed for tailwindcss
            options: {
              postcssOptions: {
                ident: 'postcss',
                plugins: [tailwindcss, autoprefixer],
              },
            },
          },
        ],
      },
      {
        test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf)$/,
        type: 'asset/resource',
      },
      {
        test: /\.svg$/,
        issuer: /\.[jt]sx?$/,
        use: [{ loader: '@svgr/webpack', options: { output: { publicPath: '' } } }],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@utils': path.resolve('src/utils'),
      '@components': path.resolve('src/components'),
      '@styles': path.resolve('src/styles'),
      '@icons': path.resolve('src/icons'),
      '@hooks': path.resolve('src/hooks'),
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
        title: 'NoteIt',
        filename: `${chunk}.html`,
        chunks: [chunk],
      }),
  );
}
