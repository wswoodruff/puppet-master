'use strict';

const url = 'https://yesnobutton.com';

module.exports = {
    context: {
        url
    },
    script: [
        async (page, context) => {

            await page.goto(context.url);
        },
        async (page, context) => {

            await page.click('a[href="answer.html"]');
            await page.waitFor(2000);
        },
        async (page, context) => {

            await page.click('a[href="http://www.yesnobutton.com/answer.html"]');
            await page.waitFor(2000);
        },
        async (page, context) => {

            await page.click('a[href="http://www.yesnobutton.com/answer.html"]');
            await page.waitFor(2000);

            const {
                server
            } = context;

            const {
                txtMeTwilioService
            } = server.services();

            const fromPhoneNumber = await txtMeTwilioService.getDefaultOrRandomNumber();
            const TO_PHONE_NUMBER = '2073155407';

            const img = await page.getElement('a[href="http://www.yesnobutton.com/answer.html"] img');
            const imgSrc = await page.evalHandle(img, 'src');

            const splitOnSlashes = imgSrc.split('/');

            const imgEndName = splitOnSlashes[splitOnSlashes.length - 1];

            if (imgEndName.match(/yes/)) {
                await txtMeTwilioService.text({
                    from: fromPhoneNumber,
                    to: TO_PHONE_NUMBER,
                    body: 'The answer was Yes!'
                });
            }
        }
    ]
};
