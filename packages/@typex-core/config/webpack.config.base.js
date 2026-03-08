const path = require('path')
const WebpackBar = require('webpackbar')

module.exports = {
  entry: {
    index: './index.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../dist'),
    clean: true,
    library: {
      name: 'TypexCore',
      type: 'umd',
    },
    globalObject: 'globalThis',
    umdNamedDefine: true,
  },
  module: {
    rules: [
      {
        test: /\.styl(us)?$/,
        use: ['style-loader', 'css-loader', 'stylus-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [new WebpackBar({ name: 'typex-core' })],
}
