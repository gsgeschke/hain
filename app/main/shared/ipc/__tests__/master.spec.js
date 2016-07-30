'use strict';

const Master = require('../master');

class ReceiverMock {
  constructor() {
    this.masterHandler = null;
  }
  startListen(masterHandler) {
    this.masterHandler = masterHandler;
  }
  emit(tag, data, replyHook) {
    this.masterHandler(this, replyHook, tag, data);
  }
}

describe('master.js', () => {

  describe('manage agent reply funcs', () => {

    it('should store reply func for agent', () => {
      const receiverMock = new ReceiverMock();
      const master = new Master();
      master.addReceiver(receiverMock);

      const agentName = 'agent0';
      const replyHook = jest.fn();
      receiverMock.emit('connect', { agentName }, replyHook);
      expect(master.agentCallFuncs[agentName]).toBeDefined();
      expect(replyHook).toBeCalledWith('repl:connect');
    });

  });

  describe('manage function calls between agents', () => {

    pit('should call appropriate function in target agent, and relay it', () => {
      return new Promise((resolve, reject) => {
        const receiverMock = new ReceiverMock();
        const master = new Master();
        master.addReceiver(receiverMock);

        const mockReply = jest.fn();
        receiverMock.emit('connect', { agentName: 'agent0' }, mockReply);
        receiverMock.emit('connect', { agentName: 'agent1' }, mockReply);

        receiverMock.emit('call',
          { targetAgent: 'agent1', callId: 10, funcName: 'test', args: [] },
          (tag, data) => {
            expect(tag).toBe('repl:call:10');
            expect(data.result).toBeDefined();
            resolve();
          });

        const nextCallId = master.nextGlobalCallId;
        receiverMock.emit(`repl:call:${nextCallId}`, { callId: nextCallId, result: 0 }, () => {});
      });
    });

    pit('should relay error if there is no target agent', () => {
      return new Promise((resolve, reject) => {
        const receiverMock = new ReceiverMock();
        const master = new Master();
        master.addReceiver(receiverMock);

        const mockReply = jest.fn();
        receiverMock.emit('connect', { agentName: 'agent0' }, mockReply);

        receiverMock.emit('call',
          { targetAgent: 'agent1', callId: 10, funcName: 'test', args: [] },
          (tag, data) => {
            expect(tag).toBe('repl:call:10');
            expect(data.error).toBeDefined();
            resolve();
          });
      });
    });

  });

});
