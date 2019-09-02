'use strict';

const url = 'https://cryptocompare.com';

module.exports = {
    context: {
        url
    },
    script: [
        async (page, context) => {

            await page.goto(context.url);
        },
        async (page, context) => {

            await page.waitFor(8000);

            const textContent = await page.evalHandle(await page.getElement('.hero-charts'), 'innerText');
            console.log('textContent', textContent);
        }
    ]
};
