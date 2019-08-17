'use strict';

const Joi = require('@hapi/joi');

module.exports = {
    method: 'post',
    path: '/bots/{id}/control',
    options: {
        description: 'Control bot by id',
        tags: ['api'],
        validate: {
            payload: Joi.object({
                setting: Joi.string(),
                val: Joi.any(),
                click: Joi.object({
                    x: Joi.number(),
                    y: Joi.number(),
                    selector: Joi.string()
                })
                    .xor(['setting', 'val'], 'click')
            })
        }
    },
    handler: (request, h) => {

        const { id } = request.params;
        const { setting, val, click } = request.payload;

        const controlEvt = `${id}:control`;
        const clickEvt = `${id}:click`;

        request.server.event({ name: controlEvt, shared: true });
        request.server.event({ name: clickEvt, shared: true });

        if (click) {
            request.server.events.emit(clickEvt, click);
        }

        if (setting && typeof val !== 'undefined') {
            request.server.events.emit(controlEvt, { setting, val });
        }

        return true;
    }
};
