const axios = require('./httpClient');
const qs = require('qs');

const { reCookie } = require('./utilities');

const username = '0895847548';
const password = 'SADok:kl';
// const username = '0895847545';
// const password = 'SADok:kl';

// const storeCookie =
//   'visid_incap_2676700=gpyJfGQlRwK07IvfcZGtrDhcYGIAAAAAQUIPAAAAAAA3MvgwMzcTj2rmqv+re1Yf; load_balancer=d266c005a01944cb91e8abb410072991; _ga=GA1.2.1854677976.1650516981; __cflb=02DiuFJnHp5AvRqJXjJxpmBWHPpvDQUAPVbdhGfHKuc9A; _gid=GA1.2.68016039.1651242784; JSESSIONID=B2827CC5CDCFD24731F71601AF733779; ROUTEID=.bacweb11; rcr=987';

const storeCookie =
  'JSESSIONID=F58ACE922EBCDE1804F601FB66B8A235; ROUTEID=.bacweb13;';

const loginCookie =
  '_mm8bet_web_session=BOgoaSSr694W/MF1+gZ7uQifMD9NLdC0iIVq1N8Cp2VLcj4EcPU60cKKY4vWRKMjDyMyY6ruI3eCiUv6JGmfhBPTlwJVePsynY2zIqHifIVc+ccKFafOpwpPgGuUtlDQO5f5PxaESi0hWlpC8AODKOVNQBC69TZg+to/tkwc4WREw3UjQXudoxAeqyT8SRi7vSTd+MFYBSJc+VHeuvH0jB+ZkffF6HPwor7xnMuLvyvYYf/31BA=--2DV8eK34ToOpUHbq--CAIbdkPYaaFlKt1dA9Y6fA==; JSESSIONID=CDCE66034621E41981368136F8D1E68F; ROUTEID=.bacweb04; __cflb=02DiuFJnHp5AvRqJXjJwuTt2LNRv1boFS4awZWzrT3D16; load_balancer=8299f86529e14c88b38b39b08f6cb993;';
function getCookieObject(cookieString) {
  const loginCookieList = cookieString.split(';');
  const loginCookieObject = loginCookieList
    .map((cookieItem) => {
      const [key, value] = cookieItem.split('=');
      return { key, value };
    })
    .filter(({ key }) => !!key);
  return loginCookieObject;
}

async function compareCookie() {
  const storeCookieObject = getCookieObject(storeCookie);
  const loginCookieObject = getCookieObject(loginCookie);

  console.log({
    storeCookieObject,
    loginCookieObject,
  });
}

async function getState() {
  const res = await axios({
    method: 'post',
    url: 'https://bpcdf.semgbow777.com/player/query/queryDealerEventTimemeta',
    headers: {
      Cookie: storeCookie,
      // Cookie: loginCookie,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: qs.stringify({
      domainType: '1',
      queryTableID: 31,
      dealerEventStampTime: Math.floor(Date.now() / 1000),
    }),
  });

  const message = res.data.message;
  console.log(message ? JSON.parse(message) : res.data);
}

async function main() {
  const tableId = 32;
  const cookie = await reCookie(username, password);
  console.log({ cookie });

  const setTableResponse = await axios({
    method: 'post',
    url: 'https://bpcdf.semgbow777.com/player/query/chooseSingleTableChannel',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: qs.stringify({
      queryTableID: tableId,
    }),
  });

  const linkMapping = {
    1: 'singleBacTable',
    31: 'singleDraTable',
    32: 'singleDraTable',
    71: 'singleRouTable',
  };

  const pageLink = linkMapping[tableId];

  // console.log(pageLink);

  // const setTableResponse = await axios({
  //   method: 'get',
  //   url: `https://bpcdf.semgbow777.com/player/${pageLink}.jsp?t=${tableId}&hall=1`,
  //   headers: {
  //     Cookie: cookie,
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //   },
  // });

  // console.log(setTableResponse.data);

  //   const res = await axios({
  //     method: 'post',
  //     url: 'https://bpcdf.semgbow777.com/player/update/addMyTransaction',
  //     headers: {
  //       Cookie: cookie,
  //       'Content-Type': 'application/x-www-form-urlencoded',
  //     },
  //     data: qs.stringify({
  //       domainType: '1',
  //       tableID: 1,
  //       gameShoe: 47024,
  //       gameRound: 67,
  //       data: JSON.stringify([
  //         { categoryIdx: 1, categoryName: 'Player', stake: 20 },
  //       ]),
  //       betLimitID: 110901, // 11901 20 - 5000, 110902 100 - 10000,
  //       f: '-1',
  //       c: 'A',
  //     }),
  //   });

  const res = await axios({
    method: 'post',
    url: 'https://bpcdf.semgbow777.com/player/query/queryDealerEventV2',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: qs.stringify({
      domainType: '1',
      queryTableID: tableId,
      dealerEventStampTime: Math.floor(Date.now() / 1000),
    }),
  });

  console.log(res.data);
}

try {
  main();
  // compareCookie();
  //   getState();
  // setInterval(() => {
  //   getState();
  // }, 1000);
} catch (error) {
  console.log({ error });
}
