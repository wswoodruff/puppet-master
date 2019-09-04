'use strict';

const url = 'http://jius.bigroomstudios.com';
const usr = 'bill+employer';
const pass = 'root';

const internals = {};

module.exports = {
    context: {
        url,
        usr,
        pass,
        internals
    },
    script: [
        async (page, context) => {

            console.log('Visiting jius.bigroomstudios.com...');
            await page.goto(context.url);
        },
        async (page, context) => {

            console.log('Clicking on the login button');
            await page.click('.fkKxjI.name');
        },
        async (page, context) => {

            console.log('Typing in username and password');
            await page.type('#username', context.usr);
            await page.type('[type="password"]', context.pass);
            await page.waitFor(2000);
        },
        async (page, context) => {

            console.log('Hitting submit for login');
            await page.click('.fbzGtj[type="submit"]');

            await context.internals.logLocation(page);

            await page.waitFor(4000);
        },
        async (page, context) => {

            await page.waitFor(4000);

            await context.internals.logLocation(page);

            await page.waitFor(10000);
        }
    ]
};

internals.logLocation = async (page) => {

    console.log(await page.eval(() => {

        // eslint-disable-next-line
        return window.location;
    }));
};
