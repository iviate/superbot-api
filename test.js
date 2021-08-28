var axios = require('axios');
var FormData = require('form-data');
var qs = require('qs');
const puppeteer = require("puppeteer");
const timeout = 30000
var request = require('request');

async function test() {
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
      .then(async function (response) {
        console.log(response.headers['set-cookie']);
        let token = "7qVRu7b77Vc"
        let walletAPI = `https://imba69.com/member/get_credit_limit?token=${token}`
        let config = {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': response.headers['set-cookie'].join()
          }
        }
        let res = await axios.get(walletAPI, config)
        console.log(res.data)
      })
      .catch(function (error) {
        console.log(error);
      });
  });
}




