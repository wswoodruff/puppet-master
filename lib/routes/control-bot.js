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
                status: Joi.object({
                    setting: Joi.string().required(),
                    val: Joi.any().required()
                }),
                click: Joi.object({
                    coords: Joi.object({
                        x: Joi.number().required(),
                        y: Joi.number().required()
                    }),
                    selector: Joi.string()
                })
                    .xor('coords', 'selector'),
                scroll: Joi.object({
                    x: Joi.number().required(),
                    y: Joi.number().required()
                }),
                navigate: Joi.object({
                    url: Joi.string(),
                    back: Joi.boolean(),
                    forward: Joi.boolean()
                })
                    .xor('url', 'back', 'forward'),
                refresh: Joi.boolean(),
                playOne: Joi.boolean()
            })
        }
    },
    handler: (request, h) => {

        const { id: botId } = request.params;
        const { status, click, scroll, navigate, refresh, playOne } = request.payload;

        const setStatusEvt = `${botId}:setStatus`;
        const clickEvt = `${botId}:click`;
        const scrollEvt = `${botId}:scroll`;
        const refreshEvt = `${botId}:statusRequest`;
        const navEvt = `${botId}:nav`;
        const playOneEvt = `${botId}:playOne`;

        request.server.event({ name: setStatusEvt, shared: true });
        request.server.event({ name: clickEvt, shared: true });
        request.server.event({ name: scrollEvt, shared: true });
        request.server.event({ name: refreshEvt, shared: true });
        request.server.event({ name: navEvt, shared: true });
        request.server.event({ name: playOneEvt, shared: true });

        if (click) {
            request.server.events.emit(clickEvt, click);
        }
        else if (scroll) {
            request.server.events.emit(scrollEvt, scroll);
        }
        else if (status) {
            request.server.events.emit(setStatusEvt, status);
        }
        else if (navigate) {
            request.server.events.emit(navEvt, navigate);
        }
        else if (playOne) {
            request.server.events.emit(playOneEvt);
        }

        if (refresh) {
            request.server.events.emit(`${botId}:statusRequest`);
        }

        return true;
    }
};
