const setCookie = require('set-cookie-parser');

let cookies = {};

function addCookie(username, cookieString) {
  const parsedCookie = setCookie.parse(cookieString, {
    decodeValues: true,
    map: true,
  });

  let cookie = cookies[username] || {};

  cookie = {
    ...cookie,
    ...parsedCookie,
  };

  cookies[username] = cookie;
}

function addCookieFromResponse(username, response) {
  addCookie(username, response.headers['set-cookie']);
}

function clearCookie(username) {
  delete cookies[username];
}

function getCookieString(username, isEncode = true) {
  const cookie = cookies[username];
  return Object.keys(cookie).reduce((cookieString, cookieKey) => {
    if (cookie[cookieKey]) {
      const cookieValue = cookie[cookieKey].value;
      const cookieValueString = isEncode
        ? encodeURIComponent(cookieValue)
        : cookieValue;

      return `${cookieString} ${cookieKey}=${cookieValueString};`;
    }

    return cookieString;
  }, '');
}

module.exports = {
  addCookie,
  addCookieFromResponse,
  clearCookie,
  getCookieString,
};
