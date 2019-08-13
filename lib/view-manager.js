'use strict';

const Handlebars = require('handlebars');

module.exports = (server, options) => ({
    path: 'templates',
    isCached: !options.developmentMode,
    defaultExtension: 'hbs',
    engines: {
        hbs: Handlebars
    },
    context: {
        options,
        baseURI: server.realm.modifiers.route.prefix || ''
    }
});
