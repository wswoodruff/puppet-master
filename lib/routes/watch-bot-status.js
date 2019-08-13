'use strict';

const Boom = require('boom');

const { PassThrough } = require('stream');

module.exports = {
    method: 'get',
    path: '/bots/{id}/watch-status',
    options: {
        description: 'Watch the live status of the bot via SSE',
        tags: ['api'],
        handler: (request, h) => {

            const { id: pageId } = request.params;

            const { clickService } = request.services();

            const stream = new PassThrough({ objectMode: true });

            if (!clickService.pages[pageId]) {
                throw Boom.notFound();
            }

            let currentStatus = clickService.pages[pageId].status;

            const pushStatusUpdateToStream = (status) => {

                if (!clickService.pages[pageId]) {
                    stream.push(null);
                    throw Boom.notFound();
                }

                currentStatus = status;
                stream.push(currentStatus);
            };

            const teardown = () => {

                stream.push(null);
            };

            request.server.event({
                name: `${pageId}:statusUpdated`,
                shared: true
            });

            request.server.event({
                name: `${pageId}:statusRequest`,
                shared: true
            });

            request.server.events.on(`${pageId}:statusUpdated`, (evt) => {

                pushStatusUpdateToStream(evt);
            });

            request.server.events.emit(`${pageId}:statusRequest`);

            request.server.events.once(`${pageId}:stop`, teardown);

            // Init the stream
            stream.push('open');
            stream.push(currentStatus);

            // 'X-Accel-Buffering' is a necessary header to set if you're using nginx!

            // Found out about the 'X-Accel-Buffering' header from here:
            // https://serverfault.com/questions/801628/for-server-sent-events-sse-what-nginx-proxy-configuration-is-appropriate
            return h.event(stream, null, { event: 'status' })
                .header('X-Accel-Buffering', 'no');
        }
    }
};
