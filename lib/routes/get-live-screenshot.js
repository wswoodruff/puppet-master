'use strict';

const Boom = require('@hapi/boom');

module.exports = {
    method: 'get',
    path: '/bots/{id}/screenshot',
    options: {
        description: 'Grab a live screenshot for a bot given the id',
        tags: ['api'],
        handler: async (request, h) => {

            const { clickService } = request.services();
            const { id: botId } = request.params;

            const page = clickService.pages[botId];

            if (!page) {
                throw Boom.notFound();
            }

            return h.response(await page.screenshot({ type: 'png' }))
                .header('Content-Type', 'image/png')
                .header('Content-Disposition', 'inline')
                .header('Cache-Control', 'no-store, must-revalidate');
        }
    }
};
