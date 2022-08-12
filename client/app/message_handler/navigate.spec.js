'use strict';

const FakeWindow = require('../mocks/fake_window');
const MessageHandler = require('./navigate');

describe('Navigate Handler', function() {

  let fakeWindow;
  let transmitter;
  let messageHandler;

  beforeEach(function() {
    fakeWindow = FakeWindow.create(this.sandbox);

    transmitter = {
      respondToSender: this.sandbox.spy()
    };

    messageHandler = new MessageHandler(fakeWindow, transmitter);
  });

  const navigateTo = ({ target, params = {} }) => {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target,
        params
      },
      source: {
        integration_instance_id: 1
      }
    });
  };

  it('should listen to messages with event "navigate"', function() {
    expect(messageHandler.MESSAGE_EVENT).to.be.eql('navigate');
  });

  it('should set proper location when calling handleMessage with params', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'email_analysis/details',
        params: {
          campaign_id: 666,
          launch_id: 999
        }
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'repmanager.php?session_id=SESSIONID',
      'changed=0',
      'action=analysis',
      'camp_id=666',
      'launch_id=999',
      'page=1',
      'search=',
      'step=1',
      'save_pref=on',
      'tabdetails_length=10',
      'tabfull_length=10',
      'campaign_category=',
      'admin=n',
      'status=current',
      'type=all'
    ].join('&'));
  });

  it('should set proper location when calling handleMessage without params', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'email_campaigns/list'
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql('campaignmanager.php?session_id=SESSIONID&action=list');
  });

  it('navigates to admin list', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'administrators/list'
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=service',
      'service=user-management',
      'service_path=/admin/list'
    ].join('&'));
  });

  describe('when unload confirm is initialized', function() {
    beforeEach(function() {
      fakeWindow.Emarsys.integration.unload.initialized = true;
      fakeWindow.Emarsys.integration.dialog.confirmNavigation = this.sandbox.stub().returns(fakeWindow.resolved());
    });

    it('should pop a confirm dialog when we have the unload confirm initialized', function() {
      messageHandler.handleMessage({
        event: 'navigate',
        data: {
          target: 'email_campaigns/list'
        },
        source: {
          integration_instance_id: 1
        }
      });

      expect(fakeWindow.Emarsys.integration.dialog.confirmNavigation).to.be.called;
    });

    it('should send response back to the service with success true', function(done) {
      messageHandler.handleMessage({
        event: 'navigate',
        data: {
          eventId: 1,
          target: 'email_campaigns/list'
        },
        source: {
          integration_instance_id: 1
        }
      })
        .then(() => {
          expect(transmitter.respondToSender).to.have.been.calledWithMatch(
            'navigate:response',
            { id: 1, success: true }
          );

          done();
        });
    });
  });

  describe('when unload confirm is not initialized', function() {
    beforeEach(function() {
      fakeWindow.Emarsys.integration.unload.initialized = false;
    });

    it('should send response back to the service with success true', function(done) {
      messageHandler.handleMessage({
        event: 'navigate',
        data: {
          eventId: 1,
          target: 'email_campaigns/list'
        },
        source: {
          integration_instance_id: 1
        }
      }).then(() => {
        expect(transmitter.respondToSender).to.have.been.calledWithMatch(
          'navigate:response',
          { id: 1, success: true }
        );

        done();
      });
    });
  });

  it('should throw 404 when called with invalid pathname', function() {
    let exceptionThrown;

    try {
      navigateTo({ target: 'invalid/pathname' });
    } catch (e) {
      exceptionThrown = e;
    }

    expect(exceptionThrown.message).to.eql('Error 404: Unknown pathname');
  });

  it('navigates to create campaign with proper params', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'email_campaigns/create',
        params: {
          use_template: 'n',
          mailstream: 1
        }
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'campaignmanager.php?session_id=SESSIONID',
      'action=new',
      'use_template=n',
      'mailstream=1'
    ].join('&'));
  });

  it('navigates to create content blocks based campaign with proper params', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'email_campaigns/blocks/create',
        params: {
          mailstream: 1
        }
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?r=contentBlocks/selector&session_id=SESSIONID',
      'mailstream=1'
    ].join('&'));
  });

  it('navigates to bounce management page with proper params', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'bounce_management/list',
        params: {
          only_mailstreams: 1
        }
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'adminmanager.php?session_id=SESSIONID&action=invmails',
      'only_mailstreams=1'
    ].join('&'));
  });

  it('navigates to unified program edit page with proper params', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'program/edit',
        params: {
          program_id: 318
        }
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=eventCenter/index#/edit/ac/318'
    ].join('&'));
  });

  it('navigates to program summary page with reporting param with proper params', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'program/report',
        params: {
          program_id: 318
        }
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=program/summary',
      'programId=318'
    ].join('&'));
  });

  it('navigates to program summary page with proper params', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'program/summary',
        params: {
          program_id: 318,
          start_date: '2022-01-01',
          end_date: '2022-01-05'
        }
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=program/summary',
      'programId=318',
      'start_date=2022-01-01',
      'end_date=2022-01-05'
    ].join('&'));
  });

  it('navigates to contact edit page with proper params', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'contact/edit',
        params: {
          uid: 318,
          return_url: 'triggeredEmail'
        }
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'userprofiles.php?session_id=SESSIONID&action=show',
      'uid=318',
      'sback=triggeredEmail'
    ].join('&'));
  });

  it('navigate to trend reporting page for selecting multiple campaigns', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'trendsreporting/trends/campaigns',
        params: {
          campaign_ids: '42,43',
          program_id: 993,
          program_name: 'csudaprogram',
          start_date: 1582156800000,
          end_date: 1582243200000
        }
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=trendsreporting/trends',
      'campaignIds=42,43',
      'programId=993',
      'programName=csudaprogram',
      'startDate=1582156800000',
      'endDate=1582243200000'
    ].join('&'));
  });

  it('navigates to trend reporting page for specific campaign', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'trendsreporting/trends/campaign',
        params: {
          campaign_id: 42
        }
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'repmanager.php?action=analysis&page=1&step=11&session_id=SESSIONID',
      'camp_id=42'
    ].join('&'));
  });

  it('navigates to permission settings policies page', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'permission_settings/policies'
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=permissionSettings'
    ].join('&'));
  });

  it('navigates to permission settings roles page', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'permission_settings/roles'
      },
      source: {
        integration_instance_id: 1
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=permissionSettings#/roles'
    ].join('&'));
  });

  it('navigates to Tactics list page', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'tactics/list',
        params: {
          kpi_fake: 'foo_fake',
          kpi: 'foo'
        }
      },
      source: {
        integration_instance_id: 1
      }
    });

    const expectedUrl = 'bootstrap.php?session_id=SESSIONID&r=tactics&kpi=foo_fake#/?kpi=foo';
    expect(fakeWindow.location.href).to.eql(expectedUrl);
  });

  it('navigates to Tactics details page', function() {
    messageHandler.handleMessage({
      event: 'navigate',
      data: {
        target: 'tactics/details',
        params: {
          id: 'foo'
        }
      },
      source: {
        integration_instance_id: 1
      }
    });

    const expectedUrl = 'bootstrap.php?session_id=SESSIONID&r=tactics#/?id=foo';
    expect(fakeWindow.location.href).to.eql(expectedUrl);
  });

  it('navigates to Mobile Engage push editor page', function() {
    navigateTo({
      target: 'me_push/edit',
      params: {
        id: 'foo'
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=service/index',
      'service=push-notification',
      'iframe=show',
      '#/campaigns/foo'
    ].join('&'));
  });

  it('navigates to Mobile Engage push reporting page', function() {
    navigateTo({
      target: 'me_push/report',
      params: {
        id: 'foo'
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=service/index',
      'service=push-notification',
      'iframe=show',
      '#/reports/push/foo'
    ].join('&'));
  });

  it('navigates to Mobile Engage Inbox editor page', function() {
    navigateTo({
      target: 'me_inbox/edit',
      params: {
        id: 'foo'
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=service/index',
      'service=push-notification',
      'iframe=show',
      '#/campaigns/foo'
    ].join('&'));
  });

  it('navigates to Mobile Engage Inbox reporting page', function() {
    navigateTo({
      target: 'me_inbox/report',
      params: {
        id: 'foo'
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=service/index',
      'service=push-notification',
      'iframe=show',
      '#/reports/inbox/foo'
    ].join('&'));
  });

  it('navigates to SMS Settings page', function() {
    navigateTo({ target: 'sms/settings' });

    expect(fakeWindow.location.href).to.eql(
      'bootstrap.php?session_id=SESSIONID&r=smsSettings'
    );
  });

  it('navigates to SMS Dashboard page', function() {
    navigateTo({ target: 'sms/dashboard' });

    expect(fakeWindow.location.href).to.eql(
      'bootstrap.php?session_id=SESSIONID&r=service&service=smsadapter'
    );
  });

  it('navigates to RTI program edit page', function() {
    navigateTo({
      target: 'rti/edit',
      params: {
        id: 'ukumasing'
      }
    });

    expect(fakeWindow.location.href).to.eql(
      'bootstrap.php?session_id=SESSIONID' +
      '&r=eventCenter/index#/edit/rti/ukumasing'
    );
  });

  it('navigates to RTI program report overview page', function() {
    const programId = 'my-program-id';
    navigateTo({
      target: 'rti/report',
      params: {
        id: programId
      }
    });

    expect(fakeWindow.location.href).to.eql(
      'bootstrap.php?session_id=SESSIONID' +
      '&r=eventCenter/index#/summary/' + programId
    );
  });

  describe('automation program reporting', () => {
    [
      { programType: 'ac', id: 123, startDate: '2022-08-01', endDate: '2022-09-01' },
      { programType: 'rti', id: '1asdf1234' }
    ].forEach(({ programType, id, startDate, endDate }) => {
      it(`navigates to ${programType} program unified report page`, () => {
        navigateTo({
          target: 'automation/report',
          params: {
            programType,
            id,
            startDate,
            endDate
          }
        });

        expect(fakeWindow.location.href).to.eql(
          'bootstrap.php?session_id=SESSIONID' +
          `&r=eventCenter/index#/reporting/${programType}/${id}?start_date=${startDate}&end_date=${endDate}`
        );
      });
    });
  });

  it('navigates to New Revenue Attribution Settings page', function() {
    navigateTo({ target: 'revenue_attributor/settings' });

    expect(fakeWindow.location.href).to.eql(
      'bootstrap.php?session_id=SESSIONID&r=service&service=revenue-attributor'
    );
  });

  it('navigates to Mobile Engage push campaigns page', function() {
    navigateTo({
      target: 'me_push/campaigns'
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=service/index',
      'service=push-notification',
      'iframe=show',
      '#/campaigns'
    ].join('&'));
  });

  it('navigates to Mobile Engage inapp campaigns page', function() {
    navigateTo({
      target: 'me_push/inapp-campaigns'
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=service/index',
      'service=push-notification',
      'iframe=show',
      '#/inapp-campaigns'
    ].join('&'));
  });

  it('navigates to Mobile Engage inapp campaigns edit page', function() {
    navigateTo({
      target: 'me_push/inapp-campaigns/edit',
      params: {
        id: 'foo'
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=service/index',
      'service=push-notification',
      'iframe=show',
      '#/inapp-campaigns/foo'
    ].join('&'));
  });

  it('navigates to Mobile Engage inapp reports page', function() {
    navigateTo({
      target: 'me_push/inapp-campaigns/report',
      params: {
        id: 'foo'
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'bootstrap.php?session_id=SESSIONID',
      'r=service/index',
      'service=push-notification',
      'iframe=show',
      '#/reports/inapp/foo'
    ].join('&'));
  });

  it('navigates to Form edit page', function() {
    navigateTo({
      target: 'forms/edit',
      params: {
        form_id: 123
      }
    });

    expect(fakeWindow.location.href).to.eql([
      'regmanager.php?session_id=SESSIONID',
      'form_id=123',
      'action=description'
    ].join('&'));
  });
});
