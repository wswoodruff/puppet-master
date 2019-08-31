'use strict';

const CopilotScript = require('../copilotScript');

const internals = {};

module.exports = (server, options) => ({
    value: {
        copilotBot: async (srv, []) => {

            await srv.start();

            const { clickService, copilotService } = srv.services();

            const clickServicePage = await clickService.getPage();

            await copilotService.startSession(clickServicePage, {
                debug: true,
                isPlaying: true,
                openController: true,
                botScript: CopilotScript
            });
        },
        loggerInner: async (srv, []) => {

            const url = 'https://ethereal.email/login';
            const messagesUrl = 'https://ethereal.email/messages';
            const usr = 'ryder.jerde14@ethereal.email';
            const pass = '94DtKFssqaDg7xryET';

            const { clickService, copilotService } = srv.services();

            const p = await clickService.getPage();

            await copilotService.runScript(p, {
                debug: true,
                botScript: [
                    async (page, context) => {

                        await page.goto(url);
                    },
                    async (page, context) => {

                        await page.type('input[type="email"]', usr);
                        await page.type('input[type="password"]', pass);
                        await page.click('button[type="submit"]');
                    },
                    async (page, context) => {

                        await page.goto(messagesUrl);
                    },
                    async (page, context) => {

                        await page.screenshot({ path: 'mailbox.png', fullPage: true });
                    },
                    async (page, context) => {

                        await clickService.closePage(page);
                    }
                ]
            });
        }
    }
});
