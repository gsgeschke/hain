'use strict';

const co = require('co');

class Agent {
  constructor(name) {
    this.name = name;
    this.transport = null;
    this.funcs = {};
    this.nextCallId = 0;
  }
  allocateCallId() {
    this.nextCallId += 1;
    if (this.nextCallId > 9999999)
      this.nextCallId = 0;
    return this.nextCallId;
  }
  connect(transport) {
    return new Promise((resolve, reject) => {
      // TODO add error handling
      this.transport = transport;
      this.transport.activate(this.name);
      this.transport.on('repl:connect', (data) => resolve());
      this.transport.send('connect', { agentName: this.name });
      this.startListenForFunctionCalls();
    });
  }
  startListenForFunctionCalls() {
    this.transport.on('call', (data) => {
      const { callId, funcName, args } = data;
      const replyTag = `repl:call:${callId}`;
      const selectedGenerator = this.funcs[funcName];
      if (selectedGenerator === undefined) {
        return this.transport.send(replyTag, {
          callId,
          error: 'undefined function'
        });
      }

      return co(selectedGenerator.apply(this, args))
        .then((result) => {
          this.transport.send(replyTag, { callId, result });
        })
        .catch((error) => {
          this.transport.send(replyTag, { callId, error });
        });
    });
  }
  define(funcName, generator) {
    this.funcs[funcName] = generator;
  }
  call(targetAgent, funcName, ...args) {
    const thisCallId = this.allocateCallId();
    return new Promise((resolve, reject) => {
      this.transport.once(`repl:call:${thisCallId}`, (data) => {
        const { result, error } = data;
        if (error)
          return reject(error);
        return resolve(result);
      });
      this.transport.send('call', {
        callId: thisCallId,
        targetAgent,
        funcName,
        args
      });
    });
  }
}

module.exports = Agent;
