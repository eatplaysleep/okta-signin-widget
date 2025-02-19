/*!
 * Copyright (c) 2020, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */
import { loc, View, createButton, _ } from 'okta';
import hbs from 'handlebars-inline-precompile';
import Enums from '../../../util/Enums';
import Util from '../../../util/Util';
import { FASTPASS_FALLBACK_SPINNER_TIMEOUT, IDENTIFIER_FLOW } from '../utils/Constants';

export function appendLoginHint(deviceChallengeUrl, loginHint) {
  if (deviceChallengeUrl && loginHint) {
    deviceChallengeUrl += '&login_hint=' + loginHint;
  }

  return deviceChallengeUrl;
}

export function doChallenge(view, fromView) {
  const deviceChallenge = view.getDeviceChallengePayload();
  const loginHint = view.options?.settings?.get('identifier');
  const HIDE_CLASS = 'hide';
  switch (deviceChallenge.challengeMethod) {
  case Enums.LOOPBACK_CHALLENGE:
    view.title = loc('deviceTrust.sso.redirectText', 'login');
    view.add(View.extend({
      className: 'loopback-content',
      template: hbs`<div class="spinner"></div>`
    }));
    view.doLoopback(deviceChallenge);
    break;
  case Enums.CUSTOM_URI_CHALLENGE:
    view.title = loc('customUri.title', 'login');
    view.add(View.extend({
      className: 'skinny-content',
      template: hbs`
            <p>
              {{i18n code="customUri.required.content.prompt" bundle="login"}}
            </p>
          `,
    }));
    view.add(createButton({
      className: 'ul-button button button-wide button-primary',
      title: loc('customUri.required.content.button', 'login'),
      id: 'launch-ov',
      click: () => {
        view.doCustomURI();
      }
    }));
    view.add(View.extend({
      className: 'skinny-content',
      template: hbs`
          <p>
            {{i18n code="customUri.required.content.download.title" bundle="login"}}
          </p>
          <p>
            <a href="{{downloadOVLink}}" target="_blank" id="download-ov" class="link">
              {{i18n code="customUri.required.content.download.linkText" bundle="login"}}
            </a>
          </p>
          `,
      getTemplateData() {
        return {
          downloadOVLink: deviceChallenge.downloadHref
        };
      },
    }));
    view.customURI = appendLoginHint(deviceChallenge.href, loginHint);
    view.doCustomURI();
    break;
  case Enums.UNIVERSAL_LINK_CHALLENGE:
    view.title = loc('universalLink.title', 'login');
    view.add(View.extend({
      className: 'universal-link-content',
      template: hbs`
            <div class="spinner"></div>
            {{i18n code="universalLink.content" bundle="login"}}
          `
    }));
    view.add(createButton({
      className: 'ul-button button button-wide button-primary',
      title: loc('oktaVerify.reopen.button', 'login'),
      click: () => {
        // only window.location.href can open universal link in iOS/MacOS
        // other methods won't do, ex, AJAX get or form get (Util.redirectWithFormGet)
        let deviceChallengeUrl = appendLoginHint(deviceChallenge.href, loginHint);
        Util.redirect(deviceChallengeUrl);
      }
    }));
    break;
  case Enums.APP_LINK_CHALLENGE:
    view.title = loc('appLink.title', 'login');
    view.add(View.extend({
      className: 'app-link-content',
      template: hbs`
        <div class="spinner {{hideClass}}"></div>
        <div class="appLinkContent {{hideClass}}">{{i18n code="appLink.content" bundle="login"}}</div>
      `,
      getTemplateData() {
        return { hideClass: HIDE_CLASS };
      },
      postRender() {
        if (fromView === IDENTIFIER_FLOW) {
          this.$('.spinner').removeClass(HIDE_CLASS);
          setTimeout(_.bind(()=> {
            const data = { label: loc('goback', 'login') };
            this.options.appState.trigger('updateFooterLink', data);
            this.$('.spinner').addClass(HIDE_CLASS);
            this.$('.appLinkContent').removeClass(HIDE_CLASS);
          }, this), FASTPASS_FALLBACK_SPINNER_TIMEOUT);
        } else {
          this.$('.appLinkContent').removeClass(HIDE_CLASS);
        }
      },
    }));
    view.add(createButton({
      className: `${HIDE_CLASS} al-button button button-wide button-primary`,
      title: loc('oktaVerify.open.button', 'login'),
      click: () => {
        // only window.location.href can open app link in Android
        // other methods won't do, ex, AJAX get or form get (Util.redirectWithFormGet)
        let deviceChallengeUrl = appendLoginHint(deviceChallenge.href, loginHint);
        Util.redirect(deviceChallengeUrl, window, true);
      },
      postRender() {
        if (fromView === IDENTIFIER_FLOW) {
          setTimeout(_.bind(()=> {
            this.$el.removeClass(HIDE_CLASS);
          }, this), FASTPASS_FALLBACK_SPINNER_TIMEOUT);
        } else {
          this.$el.removeClass(HIDE_CLASS);
        }
      }
    }));
    break;
  }
}
