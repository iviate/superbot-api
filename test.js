var axios = require('axios');
var FormData = require('form-data');
var qs = require('qs');
const puppeteer = require('puppeteer');
const timeout = 30000;
var request = require('request');
// test();
test2();
async function test() {
  // var options = {
  //   method: 'POST',
  //   url: 'https://imba66.com/users/sign_in',
  //   formData: {
  //     'user[username]': '0894958453',
  //     'user[password]': 'Aa112233',
  //   },
  // };
  // request(options, function (error, response) {
  //   if (error) throw new Error(error);

  


  const browser = await puppeteer.launch({
    headless: true,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const page = await browser.newPage();
await page.goto('https://imba66.com/login?token=uRuczWv7UGA', {
    waitUntil: "networkidle2"
});

await page.waitForSelector('.img-shield-sys')

const cookiesImba = await page.cookies()
            console.log(cookiesImba)
            let cookieHeader = ""
            cookiesImba.forEach((value) => {
                // console.log(value)
                cookieHeader += value.name + '=' + value.value + '; '
            })
            browser.close()
    // console.log(response.headers['set-cookie']);
    var data = new FormData();
    data.append('user[username]', '0894958453');
    data.append('user[password]', 'Aa112233');

    var config = {
      method: 'post',
      url: 'https://imba66.com/users/sign_in',
      headers: {
        Cookie: cookieHeader,
        ...data.getHeaders(),
      },
      data: data,
    };

    axios(config)
      .then(async function (response) {
        console.log(response.headers['set-cookie']);
        let token = '7qVRu7b77Vc';
        let walletAPI = `https://imba66.com/member/get_credit_limit?token=${token}`;
        let config = {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: cookieHeader,
          },
        };
        let res = await axios.get(walletAPI, config);
        console.log(res.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  // });
}

async function test2() {
  var options = {
    method: 'POST',
    timeout: 1000,
    url: 'https://imba66.com/users/sign_in',
    formData: {
      'user[username]': '0951824929',
      'user[password]': '0951824929',
    },
  };
  // try {
  //   request(options, async function (error, res) {
      try {
        // if (error) {
        //   console.log(error);
        //   console.log(error.code === 'ETIMEDOUT');
        //   throw new Error(error);
        //   // console.log(error);
        //   // io.emit(`wallet${user_id}`, { wallet: null })
        //   // // parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: null } })
        //   // response.json({
        //   //     success: false,
        //   //     error_code: null,
        //   //     message: null
        //   // })
        // }
        // // console.log(response.headers["set-cookie"]);
        // if (res.headers['set-cookie'] == undefined) {
        //   // io.emit(`wallet${user_id}`, { wallet: null })
        //   // // parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: null } })
        //   // response.json({
        //   //     success: false,
        //   //     error_code: null,
        //   //     message: null
        //   // })
        //   throw new Error('res.headers["set-cookie"] undefined');
        // }

        const browser = await puppeteer.launch({
          headless: true,
          devtools: false,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.goto('https://imba66.com/login?token=C2VqzqhQdxk', {
          waitUntil: "networkidle2"
      });
      
      await page.waitForSelector('.img-shield-sys')
      
      const cookiesImba = await page.cookies()
                  console.log(cookiesImba)
                  let cookieHeader = ""
                  cookiesImba.forEach((value) => {
                      // console.log(value)
                      cookieHeader += value.name + '=' + value.value + '; '
                  })
                  browser.close()
        var data = new FormData();
        data.append('user[username]', '0954480543');
        data.append('user[password]', '123456p');

        // var config = {
        //     method: 'post',
        //     url: 'https://imba66.com/users/sign_in',
        //     headers: {
        //         'Cookie': res.headers["set-cookie"].join(),
        //         ...data.getHeaders()
        //     },
        //     data: data
        // };

        // axios(config)
        //     .then(async function (res) {
        // console.log(response.headers['set-cookie']);
        let walletAPI = `https://imba66.com/member/get_credit_limit?token=C2VqzqhQdxk`;
        let config = {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: cookieHeader,
          },
        };
        let res1 = await axios.get(walletAPI, config);
        // console.log(res.data)
        if (res1.data.success == true) {
          console.log(parseFloat(res1.data.credit).toFixed(2));
          // io.emit(`wallet${user_id}`, { wallet: parseFloat(res1.data.credit).toFixed(2) })
          // // parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: parseFloat(res.data.credit).toFixed(2) } })
          // response.json({
          //     success: true,
          //     error_code: null,
          //     message: null
          // })
        } else {
          console.log('NULL');
          console.log(res1.data)
          // io.emit(`wallet${user_id}`, { wallet: null })
          // // parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: null } })
          // response.json({
          //     success: false,
          //     error_code: null,
          //     message: null
          // })
        }

        // })
        // .catch(function (error) {
        //     console.log(error);
        //     io.emit(`wallet${user_id}`, { wallet: null })
        //     // parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: null } })
        //     response.json({
        //         success: false,
        //         error_code: null,
        //         message: null
        //     })

        // });
      } catch (e) {
        console.log(e);
        // io.emit(`wallet${user_id}`, { wallet: null })
        // response.json({
        //     success: false,
        //     error_code: null,
        //     message: null
        // })
      }
  //   });
  // } catch (e) {
  //   console.log(e);
  //   // io.emit(`wallet${user_id}`, { wallet: null })
  //   // response.json({
  //   //     success: false,
  //   //     error_code: null,
  //   //     message: null
  //   // })
  // }
}
