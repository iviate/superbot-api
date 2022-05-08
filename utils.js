const puppeteer = require('puppeteer');
const axios = require('./httpClient');
var qs = require('qs');
const timeout = 50000;
const env = require('./config/web.config.js');
var FormData = require('form-data');
var request = require('request');
const { webHostname } = require('./config/web.config.js');

exports.reCookie = async function reCookie(username, password, web) {
  let cookie = null;
  if (web == 4) {
    // console.log('web = 4')
    cookie = await reCookieImba(username, password);
  } else {
  }
  return cookie;
};

async function reCookieUfa(username, password) {
  let cookie = await (async (username, password) => {
    const browser = await puppeteer.launch({
      headless: true,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'
      );
      page.setDefaultTimeout(timeout);
      await page.goto(env.web, {
        waitUntil: 'networkidle2',
      });

      await page.waitForSelector('input[name="txtUserName"]');
      await page.type('input[name="txtUserName"]', username);
      await page.type('input[name="password"]', password);

      await Promise.all([
        page.click('#btnLogin'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
      ]);
      // await page.type('input[name="txtUserName"]', username);
      // await page.type('input[name="password"]', password);
      // await Promise.all([
      //     page.click('#btnLogin'),
      //     page.waitForNavigation({ waitUntil: 'networkidle0' }),
      // ]);

      await page.waitForSelector('#btnAgree_T');
      await Promise.all([
        page.evaluate(() => {
          document.querySelector('#btnAgree_T').click();
        }),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
      ]);

      await page.waitForSelector('#fraSet');

      const frame = (await page.frames())[3];
      // console.log(`frame ${frame['_name']}`)
      frame.waitForSelector('.spMargin2');
      const content = await frame.evaluate(
        async () =>
          await [...document.querySelectorAll('.spMargin2')]
            .find(
              (element) =>
                element.textContent === 'คาสิโนสด' ||
                element.textContent === 'Live Casino'
            )
            .onclick.toString()
      );
      // console.log(content.split('\''))

      var gameSelectUrl = content.split("'")[1];
      var param = content.split('?')[1];
      // console.log(param)
      var paramObj = Object.fromEntries(new URLSearchParams(param));
      // console.log(paramObj)

      var url =
        'https://igtx999.isme99.com/txgame.aspx?game=' +
        '39-101' +
        '&home=' +
        paramObj.home +
        '&sid=' +
        paramObj.sid +
        '&accid=' +
        paramObj.accid +
        '&lang=' +
        paramObj.lang +
        '&ct=' +
        paramObj.ct;

      const page2 = await browser.newPage();
      await page2.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'
      );
      page2.setDefaultTimeout(timeout);
      await page2.goto(url, {
        waitUntil: 'networkidle2',
      });

      await page2.waitForSelector('#playerInfo');
      const cookies = await page2.cookies();
      // console.log(cookies)

      let cookieHeader = '';
      cookies.forEach((value) => {
        cookieHeader += value.name + '=' + value.value + '; ';
      });

      console.log(cookieHeader);
      await browser.close();
      return cookieHeader;

      // const ps = new URLSearchParams()
      // ps.append('dm', '1')

      // const config = {
      //     headers: {
      //         'Content-Type': 'application/x-www-form-urlencoded',
      //         'Cookie': cookieHeader
      //     }
      // }

      // let res = await axios.post(balanceAPI, ps, config)

      // console.log(res.data)

      // if(res.data.status == '200'){
      //     return res.data.balance
      // }else{
      //     return {}
      // }

      // var properties = await elementHandle.properties;
      // console.log(properties)
      // console.log(elementHandle)
      // const jsHandle = await elementHandle.getProperty('data-original-title');

      // const plainValue = await jsHandle.jsonValue();
      // console.log(plainValue)
    } catch (e) {
      console.log(e);
      await browser.close();
      return null;
    }

    //   response.json(data);

    // access baccarat room 2
    // await page.goto("https://truthbet.com/g/live/baccarat/22", {
    //   waitUntil: "networkidle2",
    // });
    // await browser.close();
  })(username, password);

  return cookie;
}

exports.getUserToken = async function getUserToken(username, password) {
  let cookie = await (async (username, password) => {
    const browser = await puppeteer.launch({
      headless: true,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'
      );
      page.setDefaultTimeout(timeout);
      await page.goto(`${webHostname}/users/sign_in`, {
        waitUntil: 'networkidle2',
      });

      await page.waitForSelector('input[name="user[username]"]');
      await page.type('input[name="user[username]"]', username);
      await page.type('input[name="user[password]"]', password);

      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
      ]);
      await page.waitForSelector('.img-shield-sys');
      const value = await page.$eval('#user_token', (input) => {
        return input.getAttribute('value');
      });
      console.log(value);
      await browser.close();
      return value;
    } catch (e) {
      console.log(e);
      await browser.close();
      return null;
    }
  })(username, password);

  return cookie;
};

async function reCookieImbaNew(username, password) {
  console.log('recookie imba');
  let cookie = await (async (username, password) => {
    var options = {
      method: 'POST',
      url: `${webHostname}/users/sign_in`,
      formData: {
        'user[username]': username,
        'user[password]': password,
      },
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      // console.log(response.headers["set-cookie"]);
      var data = new FormData();
      data.append('user[username]', username);
      data.append('user[password]', password);

      var config = {
        method: 'post',
        url: `${webHostname}/users/sign_in`,
        headers: {
          Cookie: response.headers['set-cookie'].join(),
          ...data.getHeaders(),
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          console.log(response.headers['set-cookie']);
          var config = {
            method: 'get',
            url: `${webHostname}/member/gamelink?vendor=sexy&game_id=undefined&game_code=undefined&mobile=false`,
            headers: {
              Cookie: response.headers['set-cookie'].join(),
            },
          };

          axios(config)
            .then(async function (response) {
              const browser = await puppeteer.launch({
                headless: true,
                devtools: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
              });

              const page2 = await browser.newPage();
              // await page2.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
              page2.setDefaultTimeout(timeout);
              await page2.goto(response.data.data, {
                waitUntil: 'networkidle2',
              });

              await page2.waitForSelector('#playerInfo');
              const cookies = await page2.cookies();
              // console.log(cookies)

              let cookieHeader2 = '';
              cookies.forEach((value) => {
                cookieHeader2 += value.name + '=' + value.value + '; ';
              });

              console.log(cookieHeader2);
              await browser.close();
              return cookieHeader2;
            })
            .catch(function (error) {
              console.log(error);
              return null;
            });
        })
        .catch(function (error) {
          console.log(error);
          return null;
        });
    });
  })(username, password);

  return cookie;
}

async function reCookieImba(username, password) {
  let cookie = await (async (username, password) => {
    console.log('start reCookieImba <<< ', username, password);
    const browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'
      );
      page.setDefaultTimeout(timeout);
      await page.goto(`${webHostname}/users/sign_in`, {
        waitUntil: 'networkidle2',
      });

      await page.waitForSelector('input[name="user[username]"]');
      await page.type('input[name="user[username]"]', username);
      await page.type('input[name="user[password]"]', password);

      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
      ]);
      await page.waitForSelector('.img-shield-sys');

      const cookiesImba = await page.cookies();
      // console.log(cookiesImba)
      let cookieHeader = '';
      cookiesImba.forEach((value) => {
        // console.log(value)
        cookieHeader += value.name + '=' + value.value + '; ';
      });
      const ps = new URLSearchParams();
      // console.log(cookieHeader)
      const URL = `${webHostname}/member/gamelink?vendor=sexy&game_id=undefined&game_code=undefined&mobile=false`;
      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookieHeader,
        },
      };

      let res = await axios.get(URL, config);
      // console.log(res.data)
      const page2 = await browser.newPage();
      await page2.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'
      );
      page2.setDefaultTimeout(timeout);
      await page2.goto(res.data.data, {
        waitUntil: 'networkidle2',
      });

      await page2.waitForSelector('#playerInfo');
      const cookies = await page2.cookies();
      // console.log(cookies)

      let cookieHeader2 = '';
      cookies.forEach((value) => {
        cookieHeader2 += value.name + '=' + value.value + '; ';
      });

      console.log(cookieHeader2);
      await browser.close();
      return cookieHeader2;
    } catch (e) {
      console.log(e);
      await browser.close();
      return null;
    }
  })(username, password);

  return cookie;
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

exports.transferWallet = async function (username, password) {
  // console.log(username, password)

  const browser = await puppeteer.launch({
    headless: true,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'
    );
    page.setDefaultTimeout(timeout);
    await page.goto(env.web, {
      waitUntil: 'networkidle2',
    });

    // await page.evaluate((USERNAME, PASSWORD) => {
    //     document.querySelector('[maxlength="100"][type="text"]').value = USERNAME;
    //     document.querySelector('input[vid="formPassword"][type="password"]').value = PASSWORD;
    // }, USERNAME, PASSWORD);

    // // login
    // await page.evaluate(() => {
    //     document.querySelector("form").submit();
    // });
    // await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await page.waitForSelector('input[name="txtUserName"]');
    await page.type('input[name="txtUserName"]', username);
    await page.type('input[name="password"]', password);

    await Promise.all([
      page.click('#btnLogin'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    await Promise.all([
      page.evaluate(() => {
        document.querySelector('#btnAgree_T').click();
      }),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    await page.waitForSelector('#fraSet');

    const frame = (await page.frames())[3];
    // console.log(`frame ${frame['_name']}`)

    const content = await frame.evaluate(
      async () =>
        await [...document.querySelectorAll('.spMargin2')]
          .find(
            (element) =>
              element.textContent === 'คาสิโนสด' ||
              element.textContent === 'Live Casino'
          )
          .onclick.toString()
    );
    // console.log(content.split('\''))
    var amount = await frame.evaluate(
      async () => await document.querySelector('strong span.Positive').innerText
    );
    var amt = parseInt(amount.replace(/,/g, ''), 10);
    // console.log(amt)
    var gameSelectUrl = content.split("'")[1];
    var param = content.split('?')[1];
    // console.log(param)
    var paramObj = Object.fromEntries(new URLSearchParams(param));
    // console.log(paramObj)

    var url = 'https://igtx999.isme99.com';
    // /tx4.aspx?game=" + "39-101" + "&home=" +
    //     paramObj.home + "&sid=" + paramObj.sid + "&accid=" + paramObj.accid +
    //     "&lang=" + paramObj.lang + "&ct=" + paramObj.ct

    const page2 = await browser.newPage();
    await page2.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'
    );
    page2.setDefaultTimeout(timeout);
    await page2.goto(url, { waitUntil: 'networkidle0' });
    console.log(url);

    // await page2.waitForSelector('#DepositAmt')
    const cookies = await page2.cookies();
    console.log(url);
    // console.log(cookies)

    let cookieHeader = '';
    cookies.forEach((value) => {
      cookieHeader += value.name + '=' + value.value + '; ';
    });

    // console.log(cookieHeader)

    // let fieldHandle = await page2.$('#DepositAmt')
    // // console.log(fieldHandle)
    // const amt = await page2.evaluate(x => x.value, fieldHandle);
    // console.log(`amt = ${amt}`)
    // var pData = qs.stringify({
    //     'accid': paramObj.accid,
    //     'sid': paramObj.sid,
    //     'home': paramObj.home,
    //     'game': '39-101',
    //     'ct': paramObj.ct,
    //     'action': deposit,
    //     'amt': amt
    // });
    let depositUrl = `https://igtx999.isme99.com/api.aspx?accid=${paramObj.accid}&sid=${paramObj.sid}&home=${paramObj.home}&game=39-101&ct=${paramObj.ct}&action=deposit&amt=${amt}`;

    // console.log(depositUrl)
    var config = {
      method: 'post',
      url: depositUrl,
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    let res = await axios(config);
    console.log(res.data);

    depositUrl = `https://igtx999.isme99.com/api.aspx?accid=${
      paramObj.accid
    }&sid=${paramObj.sid}&home=${paramObj.home}&game=39-101&ct=${
      paramObj.ct
    }&action=deposit&amt=${amt - 1}`;

    // console.log(depositUrl)
    config = {
      method: 'post',
      url: depositUrl,
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    let res2 = await axios(config);
    console.log(res2.data);

    await browser.close();
    return null;

    // console.log(plainValue)
  } catch (e) {
    // console.log(e)
    await browser.close();
  }

  //   response.json(data);

  // access baccarat room 2
  // await page.goto("https://truthbet.com/g/live/baccarat/22", {
  //   waitUntil: "networkidle2",
  // });
  // await browser.close();
};

exports.getUserImbaWallet = async function getUserImbaWallet(
  username,
  password,
  token,
  imbaCookie
) {
  console.log('getUserImbaWallet <<< ', imbaCookie);
  let walletAPI = `${webHostname}`;
  let config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: imbaCookie,
    },
  };
  let res = await axios.get(walletAPI, config);
  // console.log(res.headers)
  if (res.data.credit != undefined && res.data.success) {
    console.log('return first');
    return { credit: res.data.credit, cookie: null };
  } else {
    const browser = await puppeteer.launch({
      headless: true,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36'
      );
      page.setDefaultTimeout(timeout);
      await page.goto(`${webHostname}/users/sign_in`, {
        waitUntil: 'networkidle2',
      });

      // await page.waitForSelector('input[name="user[username]"]')
      // await page.type('input[name="user[username]"]', username);
      // await page.type('input[name="user[password]"]', password);

      // await Promise.all([
      //     page.click('button[type="submit"]'),
      //     page.waitForNavigation({ waitUntil: 'networkidle0' }),
      // ]);
      // await page.waitForSelector('.img-shield-sys')

      const cookiesImba = await page.cookies();
      // console.log(cookiesImba)
      let cookieHeader = '';
      cookiesImba.forEach((value) => {
        // console.log(value)
        cookieHeader += value.name + '=' + value.value + '; ';
      });
      const ps = new URLSearchParams();
      // console.log(cookieHeader)
      // await browser.close();
      config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookieHeader,
        },
      };
      let res = await axios.get(walletAPI, config);
      console.log(res.data);
      if (res.data.success == true) {
        return { credit: res.data.credit, cookie: cookieHeader };
      } else {
        return { credit: null, cookie: null };
      }
    } catch (e) {
      // console.log(e)
      console.log(e);
      await browser.close();
      return { credit: null, cookie: null };
    }
  }
};

exports.getUserWallet = async function getUserWallet(cookie) {
  let wallet = await (async (cookie) => {
    let balanceAPI = 'https://bpcdf.semgbow777.com/player/query/queryBalancePC';
    const ps = new URLSearchParams();
    ps.append('dm', '1');
    ps.append('hallType', '1');

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookie,
      },
    };

    let res = await axios.post(balanceAPI, ps, config);

    console.log('get user wallet >>>>>> ', res.data);

    if (res.data.balance != undefined) {
      return res.data.balance;
    } else {
      return null;
    }

    //   response.json(data);

    // access baccarat room 2
    // await page.goto("https://truthbet.com/g/live/baccarat/22", {
    //   waitUntil: "networkidle2",
    // });
    // await browser.close();
  })(cookie);

  return wallet;
};

exports.getUserHistory = async function getUserHistory(cookie) {
  let history = await (async (cookie) => {
    let historyAPI =
      'https://bpcdf.semgbow777.com/player/query/queryTxnHistory';
    let startTime = new Date();
    let endTime = new Date();
    startTime.setHours(0, 0, 0, 0);
    endTime.setHours(23, 59, 59, 999);
    const ps = new URLSearchParams();
    ps.append('dealerDomain', '1');
    ps.append('strDateTime', startTime.getTime());
    ps.append('endDateTime', endTime.getTime());
    ps.append('filterBacCls', false);
    ps.append('filterBacSpd', true);
    ps.append('filterBacIns', false);
    ps.append('filterDra', false);
    ps.append('filterSic', false);
    ps.append('filterFpc', true);
    ps.append('filterRou', false);
    ps.append('filterTpt', false);
    ps.append('filterRBSic', false);
    ps.append('filterTpa', false);
    ps.append('filterTpo', false);

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookie,
      },
    };

    let res = await axios.post(historyAPI, ps, config);

    // console.log(res.data.status)

    if (res.data.txnHistory) {
      return res.data.txnHistory;
    } else {
      return null;
    }

    //   response.json(data);

    // access baccarat room 2
    // await page.goto("https://truthbet.com/g/live/baccarat/22", {
    //   waitUntil: "networkidle2",
    // });
    // await browser.close();
  })(cookie);

  return history;
};
