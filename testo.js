'use strict';

const url = 'http://jius.bigroomstudios.com';

module.exports = {
    context: {
        url
    },
    script: [
        async (page, context) => {

            await page.goto(context.url);
        },
        async (page, context) => {

            await page.click('.fkKxjI.name');
        },
        async (page, context) => {

            await page.type('#username', 'bill+employer');
            await page.type('[type="password"]', 'root');
            await page.waitFor(2000);
        },
        async (page, context) => {

            await page.click('.fbzGtj[type="submit"]');

            await page.waitFor(4000);
        },
        async (page, context) => {

            await page.waitFor(4000);
        }
    ]
};
