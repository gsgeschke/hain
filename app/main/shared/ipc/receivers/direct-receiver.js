'use strict';

const DirectChannel = require('../direct-channel');

class DirectReceiver {
  constructor() {
    this.masterHandler = null;
  }
  startListen(masterHandler) {
    this.masterHandler = masterHandler;
    DirectChannel.listenForReceiver(this.onMessage.bind(this));
  }
  onMessage(agentName, tag, data) {
    this.masterHandler(this, this.reply.bind(this, agentName), tag, data);
  }
  reply(agentName, tag, data) {
    DirectChannel.sendFromReceiver(agentName, tag, data);
  }
}

module.exports = DirectReceiver;
