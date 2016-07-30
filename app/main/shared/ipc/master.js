'use strict';

class Master {
  constructor() {
    this.receivers = [];
    this.agentCallFuncs = {};
    this.callReplyFuncs = {};
    this.localCallIds = {};
    this.nextGlobalCallId = 0;
  }
  allocateGlobalCallId() {
    this.nextGlobalCallId += 1;
    if (this.nextGlobalCallId > 999999)
      this.nextGlobalCallId = 0;
    return this.nextGlobalCallId;
  }
  addReceiver(receiver) {
    this.receivers.push(receiver);
    receiver.startListen(this.onMessage.bind(this));
  }
  onMessage(receiver, reply, tag, data) {
    if (tag === 'connect') {
      this.handleConnect(receiver, reply, data);
    } else if (tag === 'call') {
      this.handleFunctionCall(receiver, reply, data);
    } else if (tag.startsWith('repl:call:')) {
      this.handleFunctionCallReply(receiver, tag, reply, data);
    }
  }
  handleConnect(receiver, reply, data) {
    const { agentName } = data;
    this.agentCallFuncs[agentName] = reply;
    reply('repl:connect');
  }
  handleFunctionCall(receiver, reply, data) {
    const { targetAgent, callId, funcName, args } = data;
    const agentCallFunc = this.agentCallFuncs[targetAgent];
    // if no target agent
    if (agentCallFunc === undefined) {
      const replyTag = `repl:call:${callId}`;
      reply(replyTag, { error: 'no agent' });
      return;
    }
    // if target agent exists
    const globalCallId = this.allocateGlobalCallId();
    this.localCallIds[globalCallId] = callId;
    this.callReplyFuncs[globalCallId] = reply;
    agentCallFunc('call', { callId: globalCallId, funcName, args });
  }
  handleFunctionCallReply(receiver, tag, reply, data) {
    const globalCallId = parseInt(tag.substring(10)); // 'repl:call:'.length
    const { result, error } = data;
    const localCallId = this.localCallIds[globalCallId];
    const replyFunc = this.callReplyFuncs[globalCallId];
    replyFunc(`repl:call:${localCallId}`, { result, error });
    delete this.funcIdByCallId[globalCallId];
    delete this.callReplyFuncs[globalCallId];
  }
}

module.exports = Master;
