'use strict';

// --
// Server
// App
// --

// Worker
// Renderer

// 문제점들
// 1. 실행 순서 (server, app 순서가 꼬인다)
// 2. Preferences를 중간에 hook해야 함

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../shared/logger');
const electronApp = require('electron').app;

const app = require('./app/app');
const proxyHandler = require('./proxy-handler');
const pref = require('./app-pref');

const ForkReceiver = require('../shared/ipc/receivers/fork-receiver');

const Master = require('../shared/ipc/master');
const DirectReceiver = require('../shared/ipc/receivers/direct-receiver');
const RendererReceiver = require('../shared/ipc/receivers/renderer-receiver');

const master = new Master();
master.addReceiver(new DirectReceiver('server'));
master.addReceiver(new RendererReceiver('mainWindow'));
master.addReceiver(new RendererReceiver('prefWindow'));

const agent = require('./server-agent');

let workerProcess = null;
let workerReceiver = null;
let isWorkerReady = false;

function reloadWorker() {
  isWorkerReady = false;

  if (workerProcess !== null) {
    workerProcess.kill();
    workerProcess = null;
  }

  // TODO Implementation
  // if (workerReceiver !== null)
  //   master.removeReceiver(workerReceiver);

  agent.call('mainWindow', 'reload');
  loadWorker();
}

function loadWorker() {
  const workerPath = path.join(__dirname, '../worker/worker.js');
  if (!fs.existsSync(workerPath))
    throw new Error('can\'t execute plugin process');

  workerProcess = cp.fork(workerPath, [], {
    execArgv: ['--always-compact'],
    silent: true
  });
  workerReceiver = new ForkReceiver(workerProcess);
  master.addReceiver(workerReceiver);

  agent.wait('worker', function* () {
    const initialGlobalPref = pref.get();
    yield agent.call('worker', 'initialize', initialGlobalPref);
    agent.call('mainWindow', 'initialize');
    isWorkerReady = true;
  });
}

function initialize() {
  agent.connect();
  loadWorker();

  electronApp.on('quit', () => {
    try {
      if (workerProcess)
        workerProcess.kill();
    } catch (e) { }
  });
}

// const appPrefId = 'Hain';
// const workerPrefHandlers = {
//   'on-get-plugin-pref-ids': (payload) => {
//     const pluginPrefIds = payload;
//     const appPrefItem = {
//       id: appPrefId,
//       group: 'Application'
//     };
//     const pluginPrefItems = pluginPrefIds.map(x => ({
//       id: x,
//       group: 'Plugins'
//     }));
//     const prefItems = [appPrefItem].concat(pluginPrefItems);
//     rpc.send('prefwindow', 'on-get-pref-items', prefItems);
//   },
//   'on-get-preferences': (payload) => {
//     const { prefId, schema, model } = payload;
//     rpc.send('prefwindow', 'on-get-preferences', { prefId, schema, model });
//   }
// };
// mergeWorkerHandlers(workerPrefHandlers);

agent.define('logError', (msg) => logger.log(`Unhandled Plugin Error: ${msg}`));
agent.define('callProxyFunc', (service, func, args) => proxyHandler.handle(service, func, args));

// Preferences
// rpc.on('getPrefItems', (evt, msg) => {
//   sendmsg('getPluginPrefIds');
// });

// rpc.on('getPreferences', (evt, msg) => {
//   const prefId = msg;
//   if (prefId === appPrefId) {
//     const schema = JSON.stringify(pref.schema);
//     const model = pref.get();
//     rpc.send('prefwindow', 'on-get-preferences', { prefId, schema, model });
//     return;
//   }
//   sendmsg('getPreferences', prefId);
// });

// rpc.on('updatePreferences', (evt, msg) => {
//   const { prefId, model } = msg;
//   if (prefId === appPrefId) {
//     pref.update(model);
//     return;
//   }
//   sendmsg('updatePreferences', msg);
// });

// rpc.on('resetPreferences', (evt, msg) => {
//   const prefId = msg;
//   if (prefId === appPrefId) {
//     const schema = JSON.stringify(pref.schema);
//     const model = pref.reset();
//     rpc.send('prefwindow', 'on-get-preferences', { prefId, schema, model });
//     return;
//   }
//   sendmsg('resetPreferences', prefId);
// });

// function commitPreferences() {
//   sendmsg('commitPreferences');

//   if (pref.isDirty) {
//     const globalPref = pref.get();
//     sendmsg('updateGlobalPreferences', globalPref);
//     pref.commit();
//   }
// }

agent.define('close', function* () {
  app.close();
});

module.exports = {
  initialize,
  reloadWorker,
  get isLoaded() { return (workerProcess !== null && isWorkerReady); }
};
