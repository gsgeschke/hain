/* global process */
'use strict';

const logger = require('../shared/logger');
const globalProxyAgent = require('./global-proxy-agent');
const serverProxy = require('./server-proxy');
const PreferencesObject = require('../shared/preferences-object');

const agent = require('./worker-agent');

// Create a local copy of app-pref object
const globalPrefObj = new PreferencesObject(null, 'global', {}, 'nokey');

const workerContext = {
  app: serverProxy.appProxy,
  toast: serverProxy.toastProxy,
  shell: serverProxy.shellProxy,
  logger: serverProxy.loggerProxy,
  globalPreferences: globalPrefObj
};

let plugins = null;

function handleExceptions() {
  process.on('uncaughtException', (err) => {
    logger.log(err);
  });
}

function* initialize(initialGlobalPref) {
  handleExceptions();
  globalPrefObj.update(initialGlobalPref);
  globalProxyAgent.initialize(globalPrefObj);

  plugins = require('./plugins')(workerContext);
  yield* plugins.initialize();
  // TODO 에러 내보기 (SERVER에서 받을 수 있는가?)
}

agent.define('initialize', initialize);
agent.define('requestSearch', (ticket, query) => {
  const res = (obj) => agent.call('mainWindow', 'updateResult', ticket, obj.type, obj.payload);
  plugins.searchAll(query, res);
});
agent.define('requestExecute', (pluginId, id, payload) => plugins.execute(pluginId, id, payload));
agent.define('requestRenderPreview', (ticket, pluginId, id, payload) => {
  const render = (html) => agent.call('mainWindow', 'renderPreview', ticket, html);
  plugins.renderPreview(pluginId, id, payload, render);
});
agent.define('requestButtonAction', (pluginId, id, payload) => plugins.buttonAction(pluginId, id, payload));
agent.define('getPluginPrefIds', () => plugins.getPrefIds());
agent.define('getPreferences', (prefId) => plugins.getPreferences(prefId));
agent.define('updatePreferences', (prefId, model) => plugins.updatePreferences(prefId, model));
agent.define('commitPreferences', () => plugins.commitPreferences());
agent.define('resetPreferences', (prefId) => plugins.resetPreferences(prefId));
agent.define('updateGlobalPreferences', (model) => globalPrefObj.update(model));
agent.connect();
