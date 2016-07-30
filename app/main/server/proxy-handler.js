'use strict';

const shell = require('electron').shell;
const toast = require('./toast');

const agent = require('./server-agent');
const proxyHandlers = {};

const app = require('./app/app');

function handle(service, func, args) {
  const handler = proxyHandlers[service];
  const _func = handler[func];
  _func(args);
}

proxyHandlers.app = {
  restart: () => app.restart(),
  quit: () => app.quit(),
  open: (query) => app.open(query),
  close: (dontRestoreFocus) => app.close(dontRestoreFocus),
  setQuery: (query) => agent.call('mainWindow', 'setQuery', query),
  openPreferences: (prefId) => app.openPreferences(prefId),
  reloadPlugins: () => app.reloadPlugins()
};

proxyHandlers.toast = {
  enqueue: (args) => {
    const { message, duration } = args;
    toast.enqueue(message, duration);
  }
};

proxyHandlers.shell = {
  showItemInFolder: (fullPath) => shell.showItemInFolder(fullPath),
  openItem: (fullPath) => shell.openItem(fullPath),
  openExternal: (fullPath) => shell.openExternal(fullPath)
};

proxyHandlers.logger = {
  log: (msg) => agent.call('mainWindow', 'logToConsole', msg)
};

module.exports = { handle };
