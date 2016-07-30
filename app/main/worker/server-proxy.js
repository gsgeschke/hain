'use strict';

const agent = require('./worker-agent');
const logger = require('../shared/logger');

function call(service, func, args) {
  agent.call('server', 'callProxyFunc', service, func, args);
}

function wrapFunc(service) {
  return (func, args) => call(service, func, args);
}

const app_func = wrapFunc('app');
const appProxy = {
  restart: () => app_func('restart'),
  quit: () => app_func('quit'),
  open: (query) => app_func('open', query),
  close: (dontRestoreFocus) => app_func('close', dontRestoreFocus),
  setInput: (text) => app_func('setQuery', text), // Deprecated
  setQuery: (query) => app_func('setQuery', query),
  openPreferences: (prefId) => app_func('openPreferences', prefId),
  reloadPlugins: () => app_func('reloadPlugins')
};

const toast_func = wrapFunc('toast');
const toastProxy = {
  enqueue: (message, duration) => toast_func('enqueue', { message, duration })
};

const shell_func = wrapFunc('shell');
const shellProxy = {
  showItemInFolder: (fullPath) => shell_func('showItemInFolder', fullPath),
  openItem: (fullPath) => shell_func('openItem', fullPath),
  openExternal: (fullPath) => shell_func('openExternal', fullPath)
};

const logger_func = wrapFunc('logger');
const loggerProxy = {
  log: (msg) => {
    logger.log(msg);
    logger_func('log', msg);
  }
};

module.exports = { appProxy, toastProxy, shellProxy, loggerProxy };
