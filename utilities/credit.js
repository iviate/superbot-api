const axios = require('../httpClient');
const { webHostname } = require('../config/web.config');

const { getCookieString } = require('./cookie');

async function getCredit(username, token) {
  const cookie = getCookieString(username);

  if (cookie === '') {
    return {
      success: false,
      credit: 0,
    };
  }

  const config = {
    method: 'get',
    url: `${webHostname}/member/get_credit_limit?token=${token}`,
    headers: {
      // Host: 'imba66.com',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      'Sec-Ch-Ua':
        '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.9',
      Cookie: cookie,
    },
  };

  try {
    const res = await axios(config);
    if (res.data && res.data.success) {
      return res.data;
    }
    return {
      success: false,
      credit: 0,
    };
  } catch (error) {
    return {
      success: false,
      credit: 0,
    };
  }
}

module.exports = {
  getCredit,
};
