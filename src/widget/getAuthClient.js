import { OktaAuth } from '@okta/okta-auth-js';
import Util from 'util/Util';
import config from 'config/config.json';

export default function(options) {
  const {
    issuer,
    clientId,
    redirectUri,
    state,
    scopes,
    flow,
    codeChallenge,
    codeChallengeMethod,
    recoveryToken
  } = options;
  const authParams = {
    issuer,
    clientId,
    redirectUri,
    state,
    scopes,
    flow,
    codeChallenge,
    codeChallengeMethod,
    transformErrorXHR: Util.transformErrorXHR,
    recoveryToken,
    ...options.authParams
  };

  if (!authParams.issuer) {
    authParams.issuer = options.baseUrl + '/oauth2/default';
  }

  authParams.transactionManager = authParams.transactionManager || {};
  Object.assign(authParams.transactionManager, {
    saveLastResponse: false
  });
  var authClient = options.authClient ? options.authClient : new OktaAuth(authParams);
  if (!authClient._oktaUserAgent) {
    // TODO: this block handles OKTA UA for passed in authClient, error should be thrown in the next major version
    // For now, do nothing here to preserve the current behavior
    // JIRA: https://oktainc.atlassian.net/browse/OKTA-433378
    // throw new Errors.ConfigError('The passed in authClient should be version 5.4.0 or above.');
  } else {
    authClient._oktaUserAgent.addEnvironment(`okta-signin-widget-${config.version}`);
  }

  return authClient;
}
