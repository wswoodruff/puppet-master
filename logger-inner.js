'use strict';

const url = 'https://ethereal.email/login';
const messagesUrl = 'https://ethereal.email/messages';
const usr = 'ryder.jerde14@ethereal.email';
const pass = '94DtKFssqaDg7xryET';

module.exports = {
    context: {
        url,
        messagesUrl,
        usr,
        pass
    },
    script: [
        async (page, context) => {

            await page.goto(context.url);
        },
        async (page, context) => {

            await page.type('input[type="email"]', context.usr);
            await page.type('input[type="password"]', context.pass);
            await page.click('button[type="submit"]');
        },
        async (page, context) => {

            await page.goto(context.messagesUrl);
        },
        async (page, context) => {

            await page.screenshot({ path: 'mailbox.png', fullPage: true });
        }
    ]
};
