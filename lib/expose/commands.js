'use strict';

const internals = {};

module.exports = (server, options) => ({
    value: {
        copilotBot: async (srv, []) => {

            await srv.start();

            const { clickService, botCopilotService } = srv.services();

            const clickServicePage = await clickService.getPage();

            await botCopilotService.startSession(clickServicePage, {
                debug: true,
                isPlaying: true,
                openController: true,
                botScript: [
                    async (page, context) => {

                        await page.goto('https://www.espn.com');
                        await page.waitFor(2000);
                    },
                    async (page, context) => {

                        await page.waitFor(2000);
                    },
                    async (page, context) => {

                        await page.waitFor(2000);
                    },
                    async (page, context) => {

                        await page.waitFor(2000);
                    },
                    async (page, context) => {

                        await page.waitFor(2000);
                    },
                    async (page, context) => {

                        await page.waitFor(2000);
                    },
                    async (page, context) => {

                        await page.waitFor(2000);
                    },
                    async (page, context) => {

                        await page.waitFor(2000);
                    },
                    async (page, context) => {

                        await page.waitFor(2000);
                    },
                    async (page, context) => {

                        await page.waitFor(2000);
                    },
                    async (page, context) => {

                        await page.waitFor(2000);
                    },
                    async (page, context) => {

                        await page.waitFor(2000);
                    },
                    async (page, context) => {

                        await page.waitFor(2000);
                    },
                    async (page, context) => {

                        await page.waitFor(2000);
                    }
                ]
            });
        },
        loggerInner: async (srv, []) => {

            const url = 'https://ethereal.email/login';
            const messagesUrl = 'https://ethereal.email/messages';
            const usr = 'ryder.jerde14@ethereal.email';
            const pass = '94DtKFssqaDg7xryET';

            const { clickService, botCopilotService } = srv.services();

            const p = await clickService.getPage();

            await botCopilotService.runScript(p, {
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
