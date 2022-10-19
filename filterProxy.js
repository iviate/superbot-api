require('dotenv').config();
const webHostname = `https://imba999.com`;

process.env.WEB_HOSTNAME = webHostname;
const axios = require('axios');
const { reCookie } = require('./utilities/login');
// const axios = require('./httpClient');
var qs = require('qs');

const USERNAME = '123';
const PASSWORD = '123';

const proxyList = [
  '45.155.69.55:6260:asdf:asdf',
  '45.155.69.41:6246:asdf:asdf',
  '45.155.69.246:6451:asdf:asdf',
  '45.155.69.7:6212:asdf:asdf',
  '45.155.69.90:6295:asdf:asdf',
  '45.155.69.72:6277:asdf:asdf',
  '45.155.69.91:6296:asdf:asdf',
  '45.155.69.117:6322:asdf:asdf',
  '45.155.69.97:6302:asdf:asdf',
  '45.155.69.209:6414:asdf:asdf',
  '45.155.69.109:6314:asdf:asdf',
  '45.155.69.14:6219:asdf:asdf',
  '45.155.69.179:6384:asdf:asdf',
  '45.155.69.24:6229:asdf:asdf',
  '45.155.69.56:6261:asdf:asdf',
  '45.155.69.196:6401:asdf:asdf',
  '45.155.69.150:6355:asdf:asdf',
  '45.155.69.23:6228:asdf:asdf',
  '45.155.69.171:6376:asdf:asdf',
  '45.155.69.240:6445:asdf:asdf',
  '45.155.69.54:6259:asdf:asdf',
  '45.155.69.86:6291:asdf:asdf',
  '45.155.69.120:6325:asdf:asdf',
  '45.155.69.100:6305:asdf:asdf',
  '45.155.69.195:6400:asdf:asdf',
  '45.155.69.13:6218:asdf:asdf',
  '45.155.69.157:6362:asdf:asdf',
  '45.155.69.122:6327:asdf:asdf',
  '45.155.69.45:6250:asdf:asdf',
  '45.155.69.93:6298:asdf:asdf',
  '45.155.69.84:6289:asdf:asdf',
  '45.155.69.101:6306:asdf:asdf',
  '45.155.69.99:6304:asdf:asdf',
  '45.155.69.184:6389:asdf:asdf',
  '45.155.69.6:6211:asdf:asdf',
  '45.155.69.18:6223:asdf:asdf',
  '45.155.69.147:6352:asdf:asdf',
  '45.155.69.217:6422:asdf:asdf',
  '45.155.69.33:6238:asdf:asdf',
  '45.155.69.38:6243:asdf:asdf',
  '45.155.69.80:6285:asdf:asdf',
  '45.155.69.53:6258:asdf:asdf',
  '45.155.69.175:6380:asdf:asdf',
  '45.155.69.152:6357:asdf:asdf',
  '45.155.69.22:6227:asdf:asdf',
  '45.155.69.139:6344:asdf:asdf',
  '45.155.69.205:6410:asdf:asdf',
  '45.155.69.212:6417:asdf:asdf',
  '45.155.69.181:6386:asdf:asdf',
  '45.155.69.227:6432:asdf:asdf',
];

async function bet(cookie, { tableId, shoe, round }) {
  let bet = 'Player';
  let betVal = 20;
  let bdata = [{ categoryIdx: 1, categoryName: bet, stake: betVal }];

  var data = qs.stringify({
    domainType: 1,
    tableID: tableId,
    gameShoe: shoe,
    gameRound: round,
    data: JSON.stringify(bdata),
    betLimitID: '110901',
    f: '-1',
    c: 'A',
  });
  var config = {
    method: 'post',
    url: 'https://bpweb.siebamex777.com/player/update/addMyTransaction',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  };

  const res = await axios(config);

  console.log(res.data);
}

async function isProxyInWhiteList(cookie, proxyNumber) {
  const proxySplit = proxyList[proxyNumber].split(':');
  const proxyUsername = proxySplit[2];
  try {
    const tableId = 2;
    // const res1 = await axios({
    //   method: 'post',
    //   url: 'https://bpweb.siebamex777.com/player/query/chooseSingleTableChannel',
    //   headers: {
    //     Cookie: cookie,
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //   },
    //   data: qs.stringify({
    //     queryTableID: tableId,
    //   }),
    // });

    const res = await axios({
      method: 'post',
      url: 'https://bpweb.semgbow777.com/player/query/queryDealerEventV2',
      // url: `https://cda9b3d44ddbb14df317426bcdc0bc31.m.pipedream.net/${proxyUsername}`,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-requested-with': 'XMLHttpRequest',
        cookie: cookie,
      },
      proxy: {
        host: proxySplit[0],
        port: proxySplit[1],
        auth: {
          username: proxyUsername,
          password: proxySplit[3],
        },
      },
      data: `domainType=1&queryTableID=${tableId}&dealerEventStampTime=1650909888055`,
    });

    const message = JSON.parse(res.data.message);

    const isSuccess = JSON.stringify(res.data).length > 5;

    console.log(proxySplit[0], isSuccess);

    if (isSuccess) {
      console.log({
        tableId,
        shoe: message.gameShoe,
        round: message.gameRound,
      });
    } else {
      console.log(res.data);
    }

    return isSuccess;
  } catch (error) {
    // console.log(error);
    console.error('ERROR:', proxyUsername);
    return false;
  }
}

async function main() {
  //   const cookie = await reCookie(USERNAME, PASSWORD);
  const cookie = `visid_incap_2676700=r4GRKWUMTfe5d4vO6xawQBy/8GIAAAAAQUIPAAAAAAAXlFIvIx+uwBPaUHnHFMwA; load_balancer=f3fb0a720b9044bfb0afe06ddc5dd44d; _ga=GA1.2.564539504.1659944737; ROUTEID=.bacweb11; nlbi_2676700=Zp2EcQxJFAZnsdcEi7dK3wAAAACtAzD0IuUdh36nLhOYSncj; incap_ses_1526_2676700=GjPIZXPtd1pOoN5oK3EtFQgHBmMAAAAAiRN9NG84HRsPfiY8gMgdmg==; rcr=987; _gid=GA1.2.1899706765.1661339404; JSESSIONID=36AB4D9E29D3070B31EA5140AC701BB8`;
  //   console.log({ cookie });

  const successList = [];
  const failList = [];
  const testList = [];

  // const isSuccess = await isProxyInWhiteList(cookie, 30);

  for (let index = 0; index <= proxyList.length; index++) {
    const isSuccess = await isProxyInWhiteList(cookie, index);
    if (isSuccess) {
      successList.push(index);
    } else {
      failList.push(index);
    }
  }

  // for (let index = 1; index <= 5; index++) {
  //   // const isSuccess = await isProxyInWhiteList(cookie, index);
  //   testList.push(isProxyInWhiteList(cookie, index));
  // }

  // const allTest = await Promise.all(testList);

  // allTest.forEach((isSuccess, index) => {
  //   if (isSuccess) {
  //     successList.push(index + 1);
  //   } else {
  //     failList.push(index + 1);
  //   }
  // });
  // console.log({ failList });

  console.log(failList);
}

main();

// [
//   1,  3,  5,  6,  7, 11, 12, 16, 17,
//  20, 21, 22, 23, 24, 25, 26, 28, 29,
//  30, 32, 33, 34, 35, 36, 38, 39, 40,
//  41, 43, 45, 46, 48, 49, 50
// ]

// [
//   1,  3,  5,  6,  7, 11, 12, 16, 17,
//  20, 21, 22, 23, 24, 25, 26, 28, 29,
//  30, 32, 33, 34, 35, 36, 38, 39, 40,
//  41, 43, 45, 46, 48, 49, 50
// ]
