'use strict';

module.exports = (srv, options) => ({
    plugins: {
        plugin: require('txt-me'),
        options: { twilio: options.twilio }
    }
});
