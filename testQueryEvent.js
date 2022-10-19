require('dotenv').config();
const axios = require('axios');

const user = {
  username: 'asdf',
  password: 'asdf',
  cookie:
    '_mm8bet_web_session=/+rIUJCB330x92xbaQ+qF2We7QqoNKpZfi54kUCbZJPOglSGAKEzCKaAPd8cb6Dpv/KOzVlVIVT3PPgRuLSKtk2qt1FED6707t7ohHDa4227IYkBIb4N5dRPO5cpjh7/udRTOadFUN7YRiBGfvM9FTiUz4xUARBbgAA990tMNcR/9NU9JBAwFW97Fs/a/dLoP2YTQfU64R6qo+NRb/fEVg5E2i3qe8YiLfwbNgDUfQnNMiRwro0XFg==--aX3pqq6YkHORUvsi--d23+XPI7cacz0FpDLEDr3w==; JSESSIONID=B2E7EE2E77AC56133E8CA7035F58D56F; ROUTEID=.bacweb04; visid_incap_2774889=LxxbRF1/TmCHJiepA1F9L7A3UGMAAAAAQUIPAAAAAADawN0xczwsdPogGLeReZeq; nlbi_2774889=ztGsUpkCgTr22VMk2kvPRwAAAAC4y9HiOlq7XPNFZHT/ZER6; incap_ses_1634_2774889=gkEBUHxtEneYfHF5YyKtFqs3UGMAAAAAT85VaCeDB0x/f5yblxw7nQ==; load_balancer=47e9417017b84068ac68e6c75ab10ec9; incap_ses_1638_2774889=yhVZHeMAWFpUqZsLXli7FrA3UGMAAAAA0zGuA60XavDY9FISpSD6AQ==;',
};

async function login() {
  let cookie = await reCookie(user.username, user.password);
  user.cookie = cookie;
  console.log(user.username, user.password, 'login success', cookie);
}

async function queryDT() {
  const tableId = 31; // 31, 32

  const chRes = await axios({
    method: 'post',
    url: 'https://bpweb.siebamex777.com/player/query/chooseSingleTableChannel',
    headers: {
      Cookie: user.cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    },
    data: `queryTableID=${tableId}`,
  });

  console.log(chRes.data);

  const res = await axios({
    method: 'post',
    url: 'https://bpweb.siebamex777.com/player/query/queryDealerEventV2',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      cookie: user.cookie,
      'x-requested-with': 'XMLHttpRequest',
    },
    data: `domainType=1&queryTableID=${tableId}&dealerEventStampTime=0`,
  });

  console.log(res.data);
}

async function queryBac() {
  const tableId = 1; // 1, 2

  const chRes = await axios({
    method: 'post',
    url: 'https://bpweb.siebamex777.com/player/query/chooseSingleTableChannel',
    headers: {
      Cookie: user.cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    },
    data: `queryTableID=${tableId}`,
  });

  console.log(chRes.data);

  const res = await axios({
    method: 'post',
    url: 'https://bpweb.siebamex777.com/player/query/queryDealerEventV2',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      cookie: user.cookie,
      'x-requested-with': 'XMLHttpRequest',
    },
    data: `domainType=1&queryTableID=${tableId}&dealerEventStampTime=0`,
  });

  console.log(res.data);
}

async function main() {
  // await login();
  //   await queryDT();
  await queryBac();
}

main();
