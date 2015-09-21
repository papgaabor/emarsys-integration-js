'use strict';

var IntegrationApi = require('./integration_api');
var ConfirmComponent = require('./components/confirm');
var ModalComponent = require('./components/modal');

class DialogApi extends IntegrationApi {

  constructor(window) {
    super(window);

    this.deferreds = {};
    this.confirmComponents = {};
    this.confirmParams = {};
  }

  submit(success, data = {}) {
    var message = this.generateMessage(success, data);

    if (this.deferreds[this.params.dialogId]) {
      if (success) {
        this.deferreds[this.params.dialogId].resolve(message);
      } else {
        this.deferreds[this.params.dialogId].reject(message);
      }
    } else {
      this.window.SUITE.integration.messageToService(message, this.params.openerIntegrationInstanceId);
    }
  }

  generateMessage(success, data = {}) {
    var message = this.window.$.extend({
      event: 'dialog:submit',
      dialogId: this.params.dialogId,
      success: success
    }, data);

    if (this.confirmParams[this.params.dialogId]) {
      message = this.window.$.extend(message, this.confirmParams[this.params.dialogId]);
    }

    return message;
  }

  resize() {
    this.window.SUITE.integration.messageToSuite({
      event: 'resize',
      height: this.window.document.getElementsByClassName('modal-container')[0].scrollHeight
    });
  }

  confirm(options) {
    if (!options.dialogId) {
      options.dialogId = Math.floor(Math.random() * 10000000);
    }

    if (options.params) {
      this.confirmParams[options.dialogId] = options.params;
    }

    var confirmComponent = this.getConfirmComponent(options);
    if (options.optional) {
      this.confirmComponents[options.dialogId] = confirmComponent;
      this.window.SUITE.integration.messageToService({
        event: options.checkEvent,
        confirmId: options.dialogId
      }, options.askFrom);
    } else {
      confirmComponent.render();
    }

    if (options.source.integration_id === 'SUITE') {
      this.deferreds[options.dialogId] = this.window.$.Deferred();
      return this.deferreds[options.dialogId].promise();
    }
  }

  getConfirmComponent(options) {
    return new ConfirmComponent(this.window, options);
  }

  confirmNavigation(url, confirmOptions) {
    var confirmPromise = this.confirm(confirmOptions);

    confirmPromise.then(() => {
      this.window.$(this.window).off('beforeunload');
      this.window.location.href = url;
    }).always(() => {
      this.close();
    });

    return confirmPromise;
  }

  modal(options) {
    new ModalComponent(this.window, options).render();
  }

  close() {
    this.window.SUITE.integration.messageToSuite({
      event: 'modal:close'
    });
  }

  static create(global) {
    return new DialogApi(global);
  }

}

module.exports = DialogApi;
