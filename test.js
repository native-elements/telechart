Date.prototype.getTimestamp = function () {
    return this.getTime() / 1000
}

new Date().getTimestamp()