'use strict';

const ipcMain = require('electron').ipcMain;

class RendererReceiver {
  constructor() {
    this.masterHandler = null;
    this.replySenders = {};
  }
  startListen(masterHandler) {
    this.masterHandler = masterHandler;
    ipcMain.on('::ipc', this.onMessage.bind(this));
  }
  onMessage(event, arg) {
    const { agentName, tag, data } = arg;
    this.replySender[agentName] = event.sender;
    this.masterHandler(this, this.reply.bind(this, agentName), tag, data);
  }
  reply(agentName, tag, data) {
    const replySender = this.replySenders[agentName];
    replySender.send('::ipc', { tag, data });
  }
}

module.exports = RendererReceiver;
