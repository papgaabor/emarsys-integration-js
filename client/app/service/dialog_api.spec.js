'use strict';

const sinon = global.sinon || {};
const Q = require('q');
const FakeWindow = require('../mocks/fake_window');
const Transmitter = require('../comm/transmitter');
const DialogFactory = require('./dialog_factory');
const DialogApi = require('./dialog_api');

const createFakeWindow = function(sandbox) {
  return FakeWindow.create(sandbox);
};

const createTransmitter = function(fakeWindow) {
  return new Transmitter({
    global: fakeWindow,
    integrationId: 'EMARSYS',
    integrationInstanceId: 'EMARSYS'
  });
};

const createDialogApi = function({
  transmitter,
  dialogFactory = DialogFactory.create()
} = {}) {
  return new DialogApi(transmitter, dialogFactory);
};

describe('DialogApi', function() {

  let fakeWindow;
  let transmitter;
  let dialogFactory;
  let dialogApi;

  beforeEach(function() {
    fakeWindow = createFakeWindow(this.sandbox);
    transmitter = createTransmitter(fakeWindow);
    dialogApi = createDialogApi({ transmitter });
  });

  describe('#submit', function() {
    const fakeMessage = {
      message: 'fake-message'
    };
    const fakeDialogId = 'foo';

    beforeEach(function() {
      this.sandbox.stub(transmitter, 'messageToService');
      this.sandbox.stub(dialogApi, '_getParams').returns({
        dialogId: fakeDialogId,
        openerIntegrationInstanceId: 'bar'
      });

      this.sandbox.stub(dialogApi, 'generateMessageData').returns(fakeMessage);
    });

    it('should generate a message', function() {
      dialogApi.submit(true);
      expect(dialogApi.generateMessageData).to.be.called;
    });

    describe('submitting to a service', function() {
      it('should send the message to a service', function() {
        dialogApi.submit(true);
        expect(transmitter.messageToService).to.be.calledWith('dialog:submit', fakeMessage, 'bar');
      });
    });

    describe('submitting to Emarsys', function() {
      beforeEach(function() {
        dialogApi.deferreds[fakeDialogId] = Q.defer();
        this.sandbox.stub(dialogApi.deferreds[fakeDialogId], 'reject');
        this.sandbox.stub(dialogApi.deferreds[fakeDialogId], 'resolve');
      });

      it('should send message when resolving the promise', function() {
        dialogApi.submit(true);
        expect(dialogApi.deferreds[fakeDialogId].resolve).to.be.calledWith(fakeMessage);
      });

      it('should send message when rejecting the promise', function() {
        dialogApi.submit(false);
        expect(dialogApi.deferreds[fakeDialogId].reject).to.be.calledWith(fakeMessage);
      });
    });
  });

  describe('#close', function() {
    describe('when dialog is a confirm dialog', function() {
      const confirmMessage = {
        data: {
          dialogId: 1234
        },
        source: {
          integration_id: 'EMARSYS'
        }
      };
      let fakeConfirmComponent;

      beforeEach(function() {
        fakeConfirmComponent = {
          render: this.sandbox.stub(),
          close: this.sandbox.stub()
        };

        dialogFactory = DialogFactory.create();
        dialogFactory.createConfirmDialog = this.sandbox.stub().returns(fakeConfirmComponent);

        dialogApi = createDialogApi({ transmitter, dialogFactory });
      });

      it('should close the confirm dialog', function() {
        dialogApi.confirm(confirmMessage);
        dialogApi.close();

        expect(fakeConfirmComponent.close).to.be.called;
      });
    });

    describe('when dialog is a modal dialog', function() {
      const modalMessage = {
        data: {
          dialogId: 1234,
          src: 'http://test.com'
        },
        source: {
          integration_id: 'EMARSYS'
        }
      };
      let fakeModalComponent;

      beforeEach(function() {
        fakeModalComponent = {
          render: this.sandbox.stub(),
          close: this.sandbox.stub()
        };

        dialogFactory = DialogFactory.create();
        dialogFactory.createModalDialog = this.sandbox.stub().returns(fakeModalComponent);

        dialogApi = createDialogApi({ transmitter, dialogFactory });
      });

      it('should close the modal dialog', function() {
        dialogApi.modal(modalMessage);
        dialogApi.close();

        expect(fakeModalComponent.close).to.be.called;
      });
    });
  });

  describe('#generateMessageData', function() {
    beforeEach(function() {
      this.sandbox.stub(transmitter, 'messageToService');
      this.sandbox.stub(dialogApi, '_getParams').returns({
        dialogId: 'foo',
        openerIntegrationInstanceId: 'bar'
      });
    });

    describe('without confirmParams', function() {
      const testCases = [
        {
          name: 'should pass success when true',
          success: true,
          data: null,
          expected: {
            dialogId: 'foo',
            success: true
          }
        },
        {
          name: 'should pass success when false',
          success: false,
          data: null,
          expected: {
            dialogId: 'foo',
            success: false
          }
        },
        {
          name: 'should pass data too',
          success: false,
          data: {
            key: 'value'
          },
          expected: {
            dialogId: 'foo',
            success: false,
            key: 'value'
          }
        }
      ];

      testCases.runTests(function(test) {
        const message = dialogApi.generateMessageData(test.success, test.data);
        expect(message).to.eql(test.expected);
      });
    });

    describe('with confirmParams', function() {
      it('should also append options from the beginning', function() {
        dialogApi.confirmParams.foo = {
          test: 'option-value'
        };
        const message = dialogApi.generateMessageData(true, {
          key: 'data-value'
        });
        expect(message).to.eql({
          dialogId: 'foo',
          success: true,
          key: 'data-value',
          test: 'option-value'
        });
      });
    });
  });

  describe('#confirm', function() {
    const confirmMessage = {
      data: {
        dialogId: 1234
      },
      source: {
        integration_id: 'EMARSYS'
      }
    };
    let fakeConfirmComponent;

    beforeEach(function() {
      fakeConfirmComponent = {
        render: this.sandbox.stub()
      };

      dialogFactory = DialogFactory.create();
      dialogFactory.createConfirmDialog = this.sandbox.stub().returns(fakeConfirmComponent);

      dialogApi = createDialogApi({ transmitter, dialogFactory });
    });

    it('should create a confirm dialog', function() {
      dialogApi.confirm(confirmMessage);
      expect(dialogFactory.createConfirmDialog).to.be.calledWith(transmitter.global, confirmMessage);
    });

    it('should create a confirm dialog with a random ID when no ID is given', function() {
      dialogApi.confirm({
        data: {},
        source: confirmMessage.source
      });
      expect(dialogFactory.createConfirmDialog).to.be.calledWith(transmitter.global, {
        data: {
          dialogId: sinon.match.number
        },
        source: confirmMessage.source
      });
    });

    it('should render the confirm dialog', function() {
      dialogApi.confirm(confirmMessage);
      expect(fakeConfirmComponent.render).to.be.called;
    });
  });

  describe('#confirmNavigation', function() {
    const fakeUrl = 'http://fake.url';
    const fakeConfirmOptions = {
      key: 'foo'
    };

    beforeEach(function() {
      dialogApi.confirm = this.sandbox.stub().returns(fakeWindow.resolved());
      dialogApi.close = this.sandbox.stub();
    });

    it('should call confirm() with options passed', function(done) {
      dialogApi.confirmNavigation(fakeUrl, fakeConfirmOptions).always(() => {
        expect(dialogApi.confirm).to.be.calledWith(fakeConfirmOptions);
        done();
      });
    });

    it('should set proper location when the confirm promise is resolved', function(done) {
      dialogApi.confirmNavigation(fakeUrl, fakeConfirmOptions).then(() => {
        expect(fakeWindow.location.href).to.eql(fakeUrl);
        done();
      });
    });

    it('should not change location when the confirm promise is rejected', function(done) {
      const originalLocation = fakeWindow.location.href;
      dialogApi.confirm = this.sandbox.stub().returns(fakeWindow.rejected());

      dialogApi.confirmNavigation(fakeUrl, fakeConfirmOptions).fail(() => {
        expect(fakeWindow.location.href).to.eql(originalLocation);
        done();
      });
    });

    it('should close the confirm dialog at the end', function(done) {
      dialogApi.confirm = this.sandbox.stub().returns(fakeWindow.rejected());

      dialogApi.confirmNavigation(fakeUrl, fakeConfirmOptions).fail(() => {
        expect(dialogApi.close).to.be.called;
        done();
      });
    });
  });

});
