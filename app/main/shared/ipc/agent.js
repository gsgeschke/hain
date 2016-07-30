'use strict';

const co = require('co');

function isGeneratorFunction(func) {
  return func.constructor.name === 'GeneratorFunction';
}

function runAnyFuncAsPromise(func, args) {
  const _args = args || [];
  if (isGeneratorFunction(func))
    return co(func.apply(this, _args));
  return new Promise((resolve, reject) => {
    try {
      resolve(func.apply(this, _args));
    } catch (err) {
      reject(err);
    }
  });
}

class Agent {
  constructor(name, defaultTransport) {
    this.name = name;
    this.transport = null;
    this.funcs = {};
    this.nextCallId = 0;
    this.defaultTransport = defaultTransport;
  }
  allocateCallId() {
    this.nextCallId += 1;
    if (this.nextCallId > 9999999)
      this.nextCallId = 0;
    return this.nextCallId;
  }
  connect(transport) {
    const _transport = transport || this.defaultTransport;
    return new Promise((resolve, reject) => {
      // TODO add error handling
      this.transport = _transport;
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
      const func = this.funcs[funcName];
      if (func === undefined) {
        return this.transport.send(replyTag, {
          callId,
          error: 'undefined function'
        });
      }

      return co(runAnyFuncAsPromise(func, args))
        .then((result) => {
          this.transport.send(replyTag, { callId, result });
        })
        .catch((error) => {
          this.transport.send(replyTag, { callId, error });
        });
    });
  }
  define(funcName, func) {
    this.funcs[funcName] = func;
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
  wait(targetAgent, func) {
    let intervalId = 0;
    intervalId = setInterval(() => {
      this._checkAgentExists(targetAgent).then((exists) => {
        if (!exists)
          return;
        clearInterval(intervalId);
        runAnyFuncAsPromise(func);
      });
    }, 50);
  }
  _checkAgentExists(targetAgent) {
    return new Promise((resolve, reject) => {
      const thisCallId = this.allocateCallId();
      const replyTag = `repl:checkAgentExists:${thisCallId}`;
      this.transport.once(replyTag, (data) => {
        const { result } = data;
        resolve(result);
      });
      this.transport.send('checkAgentExists', { targetAgent, replyTag });
    });
  }
}

module.exports = Agent;
