'use strict';

const Util = require('util');
const ChildProcess = require('child_process');

const Schmervice = require('schmervice');
const Toys = require('toys');

const internals = {};

const DIRECTIONS = {
    FORWARD: 'forward',
    REVERSE: 'reverse'
};

// This must be declared for some reason =/
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

module.exports = class BotControlService extends Schmervice.Service {

    async copilot(page, config) {

        const {
            stepTimeout = 3000,
            debug = false,
            openController = false,
            index = 0,
            direction = DIRECTIONS.FORWARD,
            isPlaying = false
        } = config;

        const context = config.botScript.context || {};
        const botScript = config.botScript.script ? config.botScript.script : config.botScript;

        internals.assertValidDirection(direction);

        const startScriptEvt = `${page.id}:start`;
        const stopScriptEvt =  `${page.id}:stop`;
        const setStatusEvt = `${page.id}:setStatus`;
        const clickEvt = `${page.id}:click`;
        const scrollEvt = `${page.id}:scroll`;
        const statusUpdatedEvt = `${page.id}:statusUpdated`;
        const statusRequestEvt = `${page.id}:statusRequest`;
        const navEvt = `${page.id}:nav`;
        const playOneEvt = `${page.id}:playOne`;
        const updateStepEvt = `${page.id}:updateStep`;
        const addStepEvt = `${page.id}:addStep`;
        const removeStepEvt = `${page.id}:removeStep`;

        // Declare events to server
        // See the docs https://hapi.dev/api/?v=18.3.1#server.event()
        this.server.event({ name: startScriptEvt, shared: true });
        this.server.event({ name: stopScriptEvt, shared: true });
        this.server.event({ name: setStatusEvt, shared: true });
        this.server.event({ name: clickEvt, shared: true });
        this.server.event({ name: scrollEvt, shared: true });
        this.server.event({ name: statusUpdatedEvt, shared: true });
        this.server.event({ name: statusRequestEvt, shared: true });
        this.server.event({ name: navEvt, shared: true });
        this.server.event({ name: playOneEvt, shared: true });
        this.server.event({ name: updateStepEvt, shared: true });
        this.server.event({ name: addStepEvt, shared: true });
        this.server.event({ name: removeStepEvt, shared: true });

        // Note: Toys must have 'error' registered
        this.server.event('error');

        // A botScript is an array of funcs that pass along a context for sharing state
        const draftBotScript = [...botScript];

        const status = {
            botScript,
            draftBotScript,
            stepTimeout,
            debug,
            index,
            direction,
            isPlaying,
            playOne: null
        };

        const broadcastStatus = async () => {

            let url;

            try {
                // eslint-disable-next-line
                url = await page.evaluate(() => window.location.href);

                this.server.events.emit(statusUpdatedEvt, {
                    ...status,
                    url,
                    botScript: status.botScript.map((func) => func.toString()),
                    draftBotScript: status.draftBotScript.map((func) => func.toString())
                });
            }
            catch (err) {

                if (err.message.includes('Session closed. Most likely the page has been closed.')) {
                    // Dial 0
                }
                else {
                    console.log('err', err);
                }
            }
        };

        broadcastStatus();

        // Status request
        this.server.events.on(statusRequestEvt, () => {

            broadcastStatus();
        });

        // Set status
        this.server.events.on(setStatusEvt, ({ setting, val }) => {

            status[setting] = val;

            broadcastStatus();
        });

        // Nav
        this.server.events.on(navEvt, async ({ url, back, forward }) => {

            if (back) {
                await page.goBack();
            }
            else if (forward) {
                await page.goForward();
            }
            else if (url) {
                await page.goto(url);
            }

            broadcastStatus();
        });

        // Play one
        this.server.events.on(playOneEvt, () => {

            status.playOne = String(status.index);
            status.isPlaying = true;

            broadcastStatus();
        });

        // Update Step
        this.server.events.on(updateStepEvt, ({ index: updateIndex, value }) => {

            // Aha! Ahahaha!! AAAHHHHHHHHAHAHAHAHHAAHAAAAAAAA!!!!!!
            // This is similar to eval
            const functionBody = value.trim().substring(value.indexOf('{') + 1, value.lastIndexOf('}')).replace(/[\n\u200b]/g, '').trim();
            status.draftBotScript[updateIndex] = new AsyncFunction('page', 'context', functionBody);

            broadcastStatus();
        });

        // Add Step
        this.server.events.on(addStepEvt, ({ index: addIndex, value }) => {

            // Aha! Ahahaha!! AAAHHHHHHHHAHAHAHAHHAAHAAAAAAAA!!!!!!
            // This is similar to eval
            const functionBody = value.trim().substring(value.indexOf('{') + 1, value.lastIndexOf('}')).replace(/[\n\u200b]/g, '').trim();
            const newFunc = new AsyncFunction('page', 'context', functionBody);

            status.draftBotScript.splice(addIndex, 0, newFunc);
            broadcastStatus();
        });

        // Remove Step
        this.server.events.on(removeStepEvt, (removeIndex) => {

            status.draftBotScript.splice(removeIndex, 1);
            broadcastStatus();
        });

        // Click
        this.server.events.on(clickEvt, async ({ selector, coords: { x, y } }) => {

            if (x && y) {
                await page.mouse.click(x, y);
            }
            else {
                await page.click(selector);
            }
        });

        this.server.events.on(scrollEvt, async ({ x: evtX, y: evtY }) => {

            // eslint-disable-next-line
            await page.evaluate((x, y) => window.scrollBy(x, y), evtX, evtY);
        });

        if (openController) {
            await Util.promisify(ChildProcess.exec)(`open http://0.0.0.0:${this.server.info.port}/bots/${page.id}/controller`);
        }

        let scriptStepRunning = false;

        const runner = setInterval(async () => {

            if (!status.isPlaying || scriptStepRunning) {
                return;
            }

            const indexFromIntervalStart = status.index;

            if (status.playOne) {
                if (status.playOne.endsWith(':end')) {
                    status.isPlaying = false;
                    status.playOne = null;
                    broadcastStatus();
                    return;
                }

                status.playOne = `${status.playOne}:start`;
                broadcastStatus();
            }

            if (debug) {
                console.log(`Running step ${indexFromIntervalStart}`);
            }

            scriptStepRunning = true;

            if (direction === DIRECTIONS.FORWARD) {

                if (status.index === draftBotScript.length) {
                    this.server.log('error', `Already at end of script for id ${page.id}`);
                    return;
                }

                const fwdFunc = draftBotScript[status.index][DIRECTIONS.FORWARD] || draftBotScript[status.index];

                try {
                    await fwdFunc(page, context);
                }
                catch (err) {
                    if (err.message.includes('Session closed. Most likely the page has been closed.') ||
                        err.message.includes('browser has disconnected!')) {
                        // Dial 0
                    }
                    else {
                        status.isPlaying = false;
                        console.log('err', err);
                    }
                }

                status.index++;
            }
            else {
                // 'direction' is 'reverse'

                if (status.index === 0) {
                    this.server.log('error', `Already at beginning of script for id ${page.id}`);
                    return;
                }

                if (draftBotScript[status.index][DIRECTIONS.REVERSE]) {
                    await draftBotScript[status.index][DIRECTIONS.REVERSE](page, context);
                    status.index--;
                }
                else {
                    this.server.log('error', `No reverse function for index ${status.index}`);
                }
            }

            scriptStepRunning = false;

            if (debug) {
                console.log(`Finished step ${indexFromIntervalStart}`);
            }

            if (status.playOne && status.playOne.endsWith(':start')) {
                status.playOne = status.playOne.replace('start', 'end');
            }

            // Emit updated event after a step runs
            broadcastStatus();

            // Auto-stop the bot if it's reached the end of it's script instructions
            if (status.index === draftBotScript.length) {
                status.isPlaying = false;
                broadcastStatus();
                // this.server.events.emit(stopScriptEvt);
            }
        }, stepTimeout);

        // Wait until the bot receives a stop event
        await Toys.event(this.server.events, stopScriptEvt);

        status.isPlaying = false;
        console.log('\nBot closing...');

        clearInterval(runner);

        this.server.events.removeAllListeners(startScriptEvt);
        this.server.events.removeAllListeners(stopScriptEvt);
        this.server.events.removeAllListeners(setStatusEvt);
        this.server.events.removeAllListeners(clickEvt);
        this.server.events.removeAllListeners(scrollEvt);
        this.server.events.removeAllListeners(statusUpdatedEvt);
        this.server.events.removeAllListeners(statusRequestEvt);
        this.server.events.removeAllListeners(navEvt);
        this.server.events.removeAllListeners(playOneEvt);

        return draftBotScript;
    }

    async runScript(page, config) {

        const {
            botScript,
            stepTimeout = 3000,
            debug = false,
            direction = DIRECTIONS.FORWARD
        } = config;

        let {
            index = 0
        } = config;

        const context = {};

        let scriptStepRunning = false;

        await new Promise((resolve, reject) => {

            try {
                const runner = setInterval(async () => {

                    if (scriptStepRunning) {
                        return;
                    }

                    if (debug) {
                        console.log(`Running step ${index}`);
                    }

                    scriptStepRunning = true;

                    if (direction === DIRECTIONS.FORWARD) {

                        if (index === botScript.length) {
                            this.server.log('error', `Already at end of script for id ${page.id}`);
                            return;
                        }

                        const fwdFunc = botScript[index][DIRECTIONS.FORWARD] || botScript[index];

                        await fwdFunc(page, context);

                        index++;
                    }
                    else {
                        // 'direction' is 'reverse'

                        if (index === 0) {
                            this.server.log('error', `Already at beginning of script for id ${page.id}`);
                            return;
                        }

                        if (botScript[index][DIRECTIONS.REVERSE]) {
                            await botScript[index][DIRECTIONS.REVERSE](page, context);
                            index--;
                        }
                        else {
                            this.server.log('error', `No reverse function for index ${index}`);
                        }
                    }

                    scriptStepRunning = false;

                    if (index === botScript.length) {
                        clearInterval(runner);
                        resolve();
                    }
                }, stepTimeout);
            }
            catch (err) {

                reject(err);
            }
        });
    }
};

module.exports.DIRECTIONS = DIRECTIONS;

internals.assertValidDirection = (direction) => {

    if (!Object.values(DIRECTIONS).includes(direction)) {
        throw new Error(`Direction must be one of "${String(Object.values(DIRECTIONS))}". "${direction}" is invalid.`);
    }
};
