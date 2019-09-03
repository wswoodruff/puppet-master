'use strict';

module.exports = (srv, options) => ({
    plugins: {
        plugin: require('clickity'),
        options: {
            devtools: options.devtools
        }
    }
});
