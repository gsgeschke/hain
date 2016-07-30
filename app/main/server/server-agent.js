'use strict';

const Agent = require('../shared/ipc/agent');
const DirectTransport = require('../shared/ipc/transports/direct-transport');

const agent = new Agent('server', new DirectTransport());

module.exports = agent;
