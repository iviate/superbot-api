// parentPort for registering to events from main thread
// workerData for receiving data clone
require('log-timestamp');
const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');
// const puppeteer = require("puppeteer");
const utils = require("./utils.js")
const moment = require('moment-timezone');
const db = require("./app/models");
var request = require('request');
var FormData = require('form-data');
var userData = null
// var browser = null
// var page = null
var imbaCookie = ""
registerForEventListening();

async function test(username, password, token) {
    if (userData.is_mock) {
        const user = await db.user.findOne({
            where: {
                id: userData.id,
            },
        })
        parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: parseFloat(user.mock_wallet).toFixed(2) } })
    }
    else {
        var options = {
            'method': 'POST',
            'url': 'https://imba69.com/users/sign_in',
            formData: {
                'user[username]': username,
                'user[password]': password
            }
        };
        request(options, function (error, response) {
            if (error) return null;
            // console.log(response.headers["set-cookie"]);
            var data = new FormData();
            data.append('user[username]', username);
            data.append('user[password]', password);

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
                    // console.log(response.headers['set-cookie']);
                    let walletAPI = `https://imba69.com/member/get_credit_limit?token=${token}`
                    let config = {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Cookie': response.headers['set-cookie'].join()
                        }
                    }
                    let res = await axios.get(walletAPI, config)
                    // console.log(res.data)
                    if (res.data.success == true) {
                        parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: parseFloat(res.data.credit).toFixed(2) } })

                    } else {
                        parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: null } })
                    }

                })
                .catch(function (error) {
                    console.log(error);
                    parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: null } })
                });
        });
    }

}

async function getUserImbaWallet(username, password, token) {
    console.log('userData.is_mock <<< ', userData.is_mock)
    if (userData.is_mock) {
        const user = await db.user.findOne({
            where: {
                id: userData.id,
            },
        })
        return user.mock_wallet
    } else {
        let walletAPI = `https://imba69.com/member/get_credit_limit?token=${token}`
        let config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': imbaCookie
            }
        }
        let res = await axios.get(walletAPI, config)
        // console.log(res.headers)
        if (res.data.credit != undefined && res.data.success) {
            console.log('return first')
            console.log(res.data)
            return res.data.credit
        }
        else {
            try {
                if (page) {
                    await page.close()
                }
                page = await browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
                page.setDefaultTimeout(50000)
                await page.goto('https://imba69.com/users/sign_in', {
                    waitUntil: "networkidle2"
                });

                await page.waitForSelector('input[name="user[username]"]')
                await page.type('input[name="user[username]"]', username);
                await page.type('input[name="user[password]"]', password);

                await Promise.all([
                    page.click('button[type="submit"]'),
                    page.waitForNavigation({ waitUntil: 'networkidle0' }),
                ]);
                await page.waitForSelector('.img-shield-sys')

                const cookiesImba = await page.cookies()
                // console.log(cookiesImba)
                imbaCookie = ""
                cookiesImba.forEach((value) => {
                    // console.log(value)
                    imbaCookie += value.name + '=' + value.value + '; '
                })
                const ps = new URLSearchParams()
                // console.log(imbaCookie)
                config = {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Cookie': imbaCookie
                    }
                }
                let res = await axios.get(walletAPI, config)
                console.log(res.data)
                if (res.data.success == true) {
                    return res.data.credit
                } else {
                    return null
                }
            } catch (e) {
                // console.log(e)
                console.log(e)
                return res.data.credit
            }
        }
    }


}


async function registerForEventListening() {

    userData = workerData.user
    // console.log(userData)
    // browser = await puppeteer.launch({
    //     headless: true,
    //     devtools: false,
    //     args: ['--no-sandbox', '--disable-setuid-sandbox']
    // });
    test(userData.username, userData.password, userData.token)


    // callback method is defined to receive data from main thread
    let cb = async (err, result) => {
        if (err) return console.error(err);
        // console.log("Thread id ")

        if (result.action == 'wallet') {
            test(userData.username, userData.password, userData.token)
        } else if (result.action == 'play') {
            // console.log(`Thred id ${workerData.id} action ${result.action}`)
            isPlay = true
            playRound = round + 1
            // betting(result.current)
        }


        // //  setting up interval to call method to multiple with factor

    };


    // registering to events to receive messages from the main thread
    parentPort.on('error', cb);
    parentPort.on('message', (msg) => {
        cb(null, msg);
    });
}





