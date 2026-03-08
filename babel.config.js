module.exports = function createBabelConfig(api) {
  const isTest = api.env('test')

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          bugfixes: true,
          targets: isTest
            ? { node: 'current' }
            : {
                browsers: ['defaults', 'not IE 11'],
              },
        },
      ],
    ],
    plugins: ['babel-plugin-transform-typex-jsx'],
    ignore: ['node_modules'],
  }
}
