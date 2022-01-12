'use strict';

const Dialog = require('./dialog');

class Confirm extends Dialog {

  render() {
    super.render();

    let $eModal = this.window.$(this._modal);
    $eModal.attr('data-params', JSON.stringify({
      integrationId: this.options.source.integration_id,
      integrationInstanceId: 'EMARSYS',
      openerIntegrationInstanceId: this.options.source.integration_instance_id,
      dialogId: this.options.data.dialogId
    }));
  }

  getModalOptions() {
    let modalOptions = super.getModalOptions();
    let cancelButton = this.cleanMessage(this.options.data.cancel);
    let okButton = this.cleanMessage(this.options.data.ok);
    modalOptions.buttons = {
      [cancelButton]: {
        autofocus: true,
        callback: function() {
          window.Emarsys.integration.dialog.submit(false);
        },
        className: 'e-flex__item'
      },
      [okButton]: {
        callback: function() {
          window.Emarsys.integration.dialog.submit(true);
        },
        className: 'e-flex__item e-btn-primary background-color-danger'
      }
    };

    return modalOptions;
  }

  getModalContent() {
    if (this.options.data.body) {
      return this.cleanMessage(this.options.data.body);
    }

    return '';
  }
}

module.exports = Confirm;
