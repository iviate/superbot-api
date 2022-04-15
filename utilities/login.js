const axios = require('axios');
const qs = require('qs');

const { addCookieFromResponse, getCookieString } = require('./cookie');
const { sleep } = require('./sleep');

let isInProgress = false;

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // console.log(error)
    if (error.response.status === 302) {
      return Promise.resolve(error.response);
    } else {
      return Promise.reject(error);
    }
  }
);

async function loginImba(username, password) {
  const config = {
    maxRedirects: 0,
    method: 'post',
    url: 'https://imba69.com/users/sign_in',
    headers: {
      Host: 'imba69.com',
      'Content-Length': '57',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua':
        '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Upgrade-Insecure-Requests': '1',
      Origin: 'https://imba69.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
      Referer: 'https://imba69.com/users/sign_in',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    data: `user[username]=${username}&user[password]=${password}`,
  };

  const resLogin = await axios(config);

  if (resLogin.status !== 302) {
    console.log('login imba not complete');

    return false;
  }

  addCookieFromResponse(resLogin);

  return true;
}

async function getOnlineGameLoginInfo() {
  const vendorResponse = await axios({
    maxRedirects: 0,
    method: 'get',
    url: 'https://imba69.com/member/gamelink?vendor=sexy&game_id=undefined&game_code=undefined&mobile=false',
    headers: {
      Host: 'imba69.com',
      'Sec-Ch-Ua':
        '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
      Accept: '*/*',
      'X-Requested-With': 'XMLHttpRequest',
      'Sec-Ch-Ua-Mobile': '?0',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      Referer: 'https://imba69.com/member/games?game=casino',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.9',
      Cookie: getCookieString(),
    },
  });

  if (vendorResponse.status === 302) {
    console.log('cannot get online game login link');

    return false;
  }

  const loginURL = new URL(vendorResponse.data.data);

  const searchParams = loginURL.searchParams;

  if (!searchParams.has('userId') || !searchParams.has('tokenId')) {
    console.log('cannot get online game login info');

    return false;
  }

  return {
    userId: searchParams.get('userId'),
    tokenId: searchParams.get('tokenId'),
  };
}

async function loginOnlineGame({ userId, tokenId }) {
  const loginData = qs.stringify({
    userId,
    tokenId,
    agentId: '2hilo',
    gameCode: 'MX-LIVE-001',
    platform: 'SEXYBCRT',
    gameType: 'LIVE',
    isLaunchGame: 'true',
  });

  const config = {
    method: 'post',
    url: 'https://www.onlinegames22.com/player/login/apiLogin',
    maxRedirects: 0,
    headers: {
      Connection: 'keep-alive',
      'Cache-Control': 'max-age=0',
      'sec-ch-ua':
        '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'Upgrade-Insecure-Requests': '1',
      Origin: 'https://www.onlinegames22.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Dest': 'document',
      Referer: 'https://www.onlinegames22.com/player/login/apiLogin0/',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    data: loginData,
  };

  const resLogin = await axios(config);

  if (
    resLogin.status !== 302 ||
    resLogin.headers.location.indexOf('user') === -1
  ) {
    console.log('login online game not complete');

    return false;
  }

  addCookieFromResponse(resLogin);

  return resLogin.headers.location;
}

async function loginZeusWithLoginLink(zeusLoginLink) {
  const zeusLoginURL = new URL(zeusLoginLink);

  const zeusLoginParams = zeusLoginURL.searchParams.toString();

  const newZeusLoginURL = new URL(
    `/api/player/MexAWCA/login?${zeusLoginParams}`,
    zeusLoginLink
  );

  const resLogin = await axios.get(newZeusLoginURL.toString());

  addCookieFromResponse(resLogin);
}

async function loginOnlineGameAndZeus() {
  const loginInfo = await getOnlineGameLoginInfo();

  if (!loginInfo) {
    return loginInfo;
  }

  const zeusLoginLink = await loginOnlineGame(loginInfo);

  if (!zeusLoginLink) {
    return zeusLoginLink;
  }

  await loginZeusWithLoginLink(zeusLoginLink);

  return true;
}

async function reCookie(username, password) {
  try {
    if (isInProgress) {
      await sleep(5000);
      return reCookie(username, password);
    }
    isInProgress = true;
    const isLoginImbaSuccess = await loginImba(username, password);

    if (!isLoginImbaSuccess) {
      isInProgress = false;
      return;
    }

    const isLoginZeusSuccess = await loginOnlineGameAndZeus();

    if (!isLoginZeusSuccess) {
      isInProgress = false;
      return;
    }

    isInProgress = false;
    return getCookieString(false);
  } catch (error) {
    isInProgress = false;
    throw error;
  }
}

module.exports = {
  reCookie,
};
