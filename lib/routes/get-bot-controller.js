'use strict';

module.exports = {
    method: 'get',
    path: '/bots/{id}/controller',
    options: {
        description: 'Get a custom control panel for a bot',
        tags: ['api'],
        handler: async (request, h) => {

            const { id: botId } = request.params;

            request.server.event({ name: `${botId}:statusUpdated`, shared: true });
            request.server.event({ name: `${botId}:statusRequest`, shared: true });

            const status = await new Promise((res, rej) => {

                try {
                    request.server.events.once(`${botId}:statusUpdated`, (s) => {

                        res(s);
                    });

                    request.server.events.emit(`${botId}:statusRequest`);
                }
                catch (err) {
                    rej(err);
                }
            });

            return h.view('bot-controller', {
                screenshotPath: `http://0.0.0.0:${request.server.info.port}/bots/${request.params.id}/screenshot`,
                ssePath: `http://0.0.0.0:${request.server.info.port}/bots/${request.params.id}/watch-status`,
                serverUrl: `${request.server.info.protocol}://${request.info.host}`,
                botId: request.params.id,
                status
            });
        }
    }
};
