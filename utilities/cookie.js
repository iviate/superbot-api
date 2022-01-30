const setCookie = require('set-cookie-parser');

let cookies = {};

function addCookie(cookieString) {
  const parsedCookie = setCookie.parse(cookieString, {
    decodeValues: true,
    map: true,
  });

  cookies = {
    ...cookies,
    ...parsedCookie,
  };
}

function addCookieFromResponse(response) {
  addCookie(response.headers['set-cookie']);
}

function getCookieString(isEncode = true) {
  return Object.keys(cookies).reduce((cookieString, cookieKey) => {
    if (cookies[cookieKey]) {
      const cookieValue = cookies[cookieKey].value;
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
  getCookieString,
};
