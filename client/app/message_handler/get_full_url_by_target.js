'use strict';

const targets = require('./url_targets');

const getUrlByTarget = (pathname) => {
  if (pathname in targets) {
    return targets[pathname];
  }

  throw new Error('Error 404: Unknown pathname');
};

const replaceUrlParams = (url, params = {}) => {
  for (let key in params) {
    if (params.hasOwnProperty(key) && key !== 'pathname') {
      url = url.replace('{' + key + '}', params[key]);
    }
  }

  const regexForAnythingInBraces = /\{[^\{\}]*\}/g;
  return url.replace(regexForAnythingInBraces, '');
};

module.exports = ({ sessionId, target, params = {} }) => {
  params.session_id = sessionId;
  return replaceUrlParams(getUrlByTarget(target), params);
};
