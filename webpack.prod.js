const extend = require('webpack-merge')

module.exports = extend(require('./webpack.common'), {
    mode: 'production',
    devtool: false,
})