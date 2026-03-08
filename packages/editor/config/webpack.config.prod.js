const { merge } = require('webpack-merge')
const baseConfig = require('./webpack.config.base')

function createBundle(filename, { minimize, clean }) {
  return merge(baseConfig, {
    mode: 'production',
    devtool: false,
    output: {
      filename,
      clean,
    },
    optimization: {
      minimize,
      splitChunks: false,
      runtimeChunk: false,
    },
  })
}

module.exports = [
  createBundle('typex-editor.js', { minimize: false, clean: true }),
  createBundle('typex-editor.min.js', { minimize: true, clean: false }),
]
