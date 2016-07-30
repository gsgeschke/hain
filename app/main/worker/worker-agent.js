'use strict';

const Agent = require('../shared/ipc/agent');
const ForkTransport = require('../shared/ipc/transports/fork-transport');

const agent = new Agent('worker', new ForkTransport(process));

module.exports = agent;
