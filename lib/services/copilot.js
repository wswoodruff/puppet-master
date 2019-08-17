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

module.exports = class BotCopilotService extends Schmervice.Service {

    async startSession(page, config) {

        const {
            botScript,
            stepTimeout = 3000,
            debug = false,
            openController = false
        } = config;

        const {
            index = 0,
            direction = DIRECTIONS.FORWARD,
            isPlaying = true
        } = config;

        internals.assertValidDirection(direction);

        const startScriptEvt = `${page.id}:start`;
        const stopScriptEvt =  `${page.id}:stop`;
        const controlEvt = `${page.id}:control`;
        const clickEvt = `${page.id}:click`;
        const scrollEvt = `${page.id}:scroll`;
        const statusUpdatedEvt = `${page.id}:statusUpdated`;
        const statusRequest = `${page.id}:statusRequest`;

        // Declare events to server
        // See the docs https://hapi.dev/api/?v=18.3.1#server.event()
        this.server.event({ name: startScriptEvt, shared: true });
        this.server.event({ name: stopScriptEvt, shared: true });
        this.server.event({ name: controlEvt, shared: true });
        this.server.event({ name: clickEvt, shared: true });
        this.server.event({ name: scrollEvt, shared: true });
        this.server.event({ name: statusUpdatedEvt, shared: true });
        this.server.event({ name: statusRequest, shared: true });

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
            isPlaying
        };

        const broadcastStatus = () => {

            this.server.events.emit(statusUpdatedEvt, {
                ...status,
                botScript: status.botScript.map((func) => func.toString()),
                draftBotScript: status.draftBotScript.map((func) => func.toString())
            });
        };

        broadcastStatus();

        const context = {};

        if (!status.isPlaying) {
            await Toys.event(this.server.events, startScriptEvt);
        }

        // Register event funcs

        this.server.events.on(statusRequest, () => {

            broadcastStatus();
        });

        this.server.events.on(controlEvt, ({ setting, val }) => {

            // Will enhance this later on
            status[setting] = val;

            broadcastStatus();
        });

        this.server.events.on(clickEvt, async ({ selector, x, y }) => {

            if (x && y) {
                await page.mouse.click(x, y);
            }
            else {
                await page.click(selector);
            }
        });

        this.server.events.on(scrollEvt, async ({ x: evtX, y: evtY }) => {

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

            const indexFromIntervalStart = Number(status.index);

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

                await fwdFunc(page, context);

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

            // Emit updated event after a step runs
            broadcastStatus();

            // Auto-stop the bot if it's reached the end of it's script instructions
            if (status.index === draftBotScript.length) {
                status.isPlaying = false;
                broadcastStatus();
                this.server.events.emit(stopScriptEvt);
            }
        }, stepTimeout);

        // Wait until the bot receives a stop event
        await Toys.event(this.server.events, stopScriptEvt);

        clearInterval(runner);

        this.server.events.removeAllListeners(startScriptEvt);
        this.server.events.removeAllListeners(stopScriptEvt);
        this.server.events.removeAllListeners(controlEvt);
        this.server.events.removeAllListeners(clickEvt);
        this.server.events.removeAllListeners(statusUpdatedEvt);
        this.server.events.removeAllListeners(statusRequest);

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
