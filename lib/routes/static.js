'use strict';

module.exports = {
    method: 'get',
    path: '/{param*}',
    options: {
        description: 'Serve static',
        tags: ['api'],
        handler: {
            directory: {
                path: './static'
            }
        }
    }
};
