'use strict';

const DirectChannel = require('../direct-channel');

class DirectTransport {
  constructor() {
    this.agentName = null;
    this.listeners = {};
    this.onceListeners = {};
  }
  activate(agentName) {
    this.agentName = agentName;
    DirectChannel.listenFromTransport(agentName, this.onMessage.bind(this));
  }
  on(tag, handler) {
    this.listeners[tag] = handler;
  }
  once(tag, handler) {
    this.onceListeners[tag] = handler;
  }
  send(tag, data) {
    const agentName = this.agentName;
    DirectChannel.sendFromTransport(agentName, tag, data);
  }
  onMessage(tag, data) {
    const listener = this.listeners[tag];
    const onceListener = this.onceListeners[tag];
    if (listener)
      listener(data);

    if (onceListener) {
      onceListener(data);
      delete this.onceListeners[tag];
    }
  }
}

module.exports = DirectTransport;
