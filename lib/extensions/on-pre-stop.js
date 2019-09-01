'use strict';

const Path = require('path');
const Util = require('util');
const ChildProcess = require('child_process');

const Toys = require('toys');

const internals = {};

module.exports = (server, options) => {

    return Toys.onPreStop(async () => {

        const { clickService } = server.services();

        for (const pageId of Object.keys(clickService.pages)) {

            server.events.emit(`${pageId}:stop`);
        }

        if (options.killChromiumOnExit) {
            const { stdout: msg, stderr: err } = await Util.promisify(ChildProcess.exec)(`sh ${Path.join(__dirname, '../../kill-chromium.sh')}`);

            if (err) {
                console.log('err', err);
            }
            else {
                console.log(`\n${msg.replace(/\n$/, '')}\n`);
            }
        }
    });
};
