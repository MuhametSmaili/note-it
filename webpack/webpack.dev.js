const common = require('./webpack.common.js');

module.exports = {
  ...common,
  mode: 'development',
  devtool: 'cheap-module-source-map',
};
