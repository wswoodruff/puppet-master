'use strict';

module.exports = {
    method: 'get',
    path: '/bots/{id}/controller',
    options: {
        description: 'Get a custom control panel for a bot',
        tags: ['api'],
        handler: (request, h) => {

            return h.view('bot-controller', {
                screenshotPath: `http://0.0.0.0:${request.server.info.port}/bots/${request.params.id}/screenshot`,
                ssePath: `http://0.0.0.0:${request.server.info.port}/bots/${request.params.id}/watch-status`
            });
        }
    }
};
