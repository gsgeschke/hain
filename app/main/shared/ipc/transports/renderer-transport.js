'use strict';

const ipcRenderer = require('electron').ipcRenderer;

class RendererTransport {
  constructor() {
    this.agentName = null;
    this.listeners = {};
    this.onceListeners = {};
  }
  activate(agentName) {
    this.agentName = agentName;
    ipcRenderer.on('::ipc', this.onMessage.bind(this));
  }
  on(tag, handler) {
    this.listeners[tag] = handler;
  }
  once(tag, handler) {
    this.onceListeners[tag] = handler;
  }
  send(tag, data) {
    const agentName = this.agentName;
    ipcRenderer.send('::ipc', { agentName, tag, data });
  }
  onMessage(event, arg) {
    const { tag, data } = arg;
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

module.exports = RendererTransport;
