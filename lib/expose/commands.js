'use strict';

const Path = require('path');

const Exiting = require('exiting');

const internals = {};

module.exports = (server, options) => ({
    value: {
        copilotBot: async (srv, [scriptPath]) => {

            if (!scriptPath) {
                throw new Error('scriptPath is required');
            }

            let CopilotScript;

            if (scriptPath === 'new') {

                const defaultFunc = async (page, context) => {

                    await page.waitFor(4000);
                };

                CopilotScript = [defaultFunc, defaultFunc, defaultFunc];
            }
            else {
                try {
                    CopilotScript = require(require.resolve(Path.join(process.cwd(), scriptPath)));
                }
                catch (err) {
                    if (err.code && err.code === 'MODULE_NOT_FOUND') {
                        console.log('Note the script path is relative to your cwd\n', err);
                    }
                    else {
                        throw err;
                    }
                }
            }

            await Exiting.createManager(srv).start();

            const { clickService, botControlService } = srv.services();

            const clickServicePage = await clickService.getPage();

            await botControlService.copilot(clickServicePage, {
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

            const { clickService, botControlService } = srv.services();

            const p = await clickService.getPage();

            await botControlService.runScript(p, {
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
