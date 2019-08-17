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

            const page = clickService.pages[request.params.id];

            if (!page) {
                throw Boom.notFound();
            }

            return h.response(await page.screenshot({ type: 'png' }))
                .header('Content-Type', 'image/png')
                .header('Content-Disposition', 'inline');
        }
    }
};
