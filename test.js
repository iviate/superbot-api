var axios = require('axios');
var FormData = require('form-data');
var qs = require('qs');
const puppeteer = require("puppeteer");
const timeout = 30000
var request = require('request');
var options = {
  'method': 'POST',
  'url': 'https://imba69.com/users/sign_in',
  formData: {
    'user[username]': '0643258932',
    'user[password]': 'ฤฟ696969'
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.headers["set-cookie"]);
  var data = new FormData();
  data.append('user[username]', '0643258932');
  data.append('user[password]', 'ฤฟ696969');

  var config = {
    method: 'post',
    url: 'https://imba69.com/users/sign_in',
    headers: {
      'Cookie': response.headers["set-cookie"].join(),
      ...data.getHeaders()
    },
    data: data
  };

  axios(config)
    .then(function (response) {
      console.log(response.headers['set-cookie']);
      var config = {
        method: 'get',
        url: 'https://imba69.com/member/gamelink?vendor=sexy&game_id=undefined&game_code=undefined&mobile=false',
        headers: {
          'Cookie': response.headers['set-cookie'].join()
        }
      };

      axios(config)
        .then(async function (response) {
          console.log(response.data.data);

          const browser = await puppeteer.launch({
            headless: true,
            devtools: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });

          const page2 = await browser.newPage();
          // await page2.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
          page2.setDefaultTimeout(timeout)
          await page2.goto(response.data.data, {
            waitUntil: "networkidle2"
          });

          await page2.waitForSelector('#playerInfo')
          const cookies = await page2.cookies()
          // console.log(cookies)

          let cookieHeader2 = ''
          cookies.forEach((value) => {
            cookieHeader2 += value.name + '=' + value.value + '; '
          })


          console.log(cookieHeader2)
        })
        .catch(function (error) {
          console.log(error);
        });
    })
    .catch(function (error) {
      console.log(error);
    });
});

