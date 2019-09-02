'use strict';

const Boom = require('@hapi/boom');

module.exports = {
    method: 'get',
    path: '/bots/{id}/screenshot',
    options: {
        description: 'Grab a screenshot for a bot given the id',
        tags: ['api'],
        handler: async (request, h) => {

            const { clickService } = request.services();
            const { id: botId } = request.params;

            const page = clickService.pages[botId];

            if (!page) {
                throw Boom.notFound();
            }

            let screenshot;

            try {
                screenshot = h.response(await page.screenshot({ type: 'png' }))
                    .header('Content-Type', 'image/png')
                    .header('Content-Disposition', 'inline')
                    .header('Cache-Control', 'no-store, must-revalidate');
            }
            catch (err) {

                if (err.message.includes('Session closed. Most likely the page has been closed.') ||
                    err.message.includes('Target closed.')) {

                    // Ignore, the server is exiting or a bot is closed
                }
                else {
                    console.log('Screenshot err', err);
                }

                return `${request.info.host}/exiting.gif`;
            }

            return screenshot;
        }
    }
};
