'use strict';

class DirectChannel {
  constructor() {
    this.receiverListener = null;
    this.transportListeners = {};
  }
  listenFromReceiver(listener) {
    this.receiverListener = listener;
  }
  listenFromTransport(agentName, listener) {
    this.transportListeners[agentName] = listener;
  }
  sendFromReceiver(agentName, tag, data) {
    const transportListener = this.transportListeners[agentName];
    if (transportListener)
      transportListener(tag, data);
  }
  sendFromTransport(agentName, tag, data) {
    if (this.receiverListener)
      this.receiverListener(agentName, tag, data);
  }
}

module.exports = new DirectChannel();
