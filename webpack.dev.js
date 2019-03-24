const extend = require('webpack-merge')

module.exports = extend(require('./webpack.common'), {
    mode: 'development',
    devtool: 'inline-source-map',
})