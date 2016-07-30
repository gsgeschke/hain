'use strict';

const textutil = require('../shared/textutil');
const agent = require('./server-agent');

function enqueue(message, duration) {
  agent.call('mainWindow', 'enqueueToast', textutil.sanitize(message), duration);
}

module.exports = { enqueue };
