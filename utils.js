const puppeteer = require("puppeteer");
const axios = require('axios');

exports.reCookie = async function reCookie(username, password){
    let cookie = await (async (username, password) => {

        const browser = await puppeteer.launch({
            headless: true,
            devtools: false,
            args: ['--no-sandbox']
        });
        const page = await browser.newPage();
        await page.goto("https://www.ufabet.com/", {
            waitUntil: "networkidle2"
        });

        // await page.evaluate((USERNAME, PASSWORD) => {
        //     document.querySelector('[maxlength="100"][type="text"]').value = USERNAME;
        //     document.querySelector('input[vid="formPassword"][type="password"]').value = PASSWORD;
        // }, USERNAME, PASSWORD);

        // // login
        // await page.evaluate(() => {
        //     document.querySelector("form").submit();
        // });
        page.waitForNavigation({ waitUntil: 'networkidle0' })

        await page.type('input[name="txtUserName"]', username);
        await page.type('input[name="password"]', password);

        await Promise.all([
            page.click('#btnLogin'),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);

        await Promise.all([
            page.click('#btnAgree_T'),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);

        try {
            await page.waitForSelector('#fraSet', {
                visible: false,
                timeout: 5000
            })

            const frame = (await page.frames())[3];
            console.log(frame['_name'])

            const content = await frame.evaluate(() => document.querySelector('a[data-original-title="คาสิโนสด"]').onclick.toString())
            // console.log(content.split('\''))

            var gameSelectUrl = content.split('\'')[1]
            var param = content.split('?')[1]
            console.log(param)
            var paramObj = Object.fromEntries(new URLSearchParams(param))
            console.log(paramObj)

            var url = "https://igtx399.isme99.com/txgame.aspx?game=" + "39-101" + "&home=" + 
                        paramObj.home + "&sid=" + paramObj.sid + "&accid=" + paramObj.accid + 
                        "&lang=" + paramObj.lang + "&ct=" + paramObj.ct


            const page2 = await browser.newPage();
            await page2.goto(url, {
                waitUntil: "networkidle2"
            });

            await page2.waitForSelector('#playerInfo')
            const cookies = await page2.cookies()
            // console.log(cookies)

            let cookieHeader = ''
            cookies.forEach((value) => {
                cookieHeader += value.name + '=' + value.value + '; '
            })

            console.log(cookieHeader)
            return cookieHeader

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
            console.log("not found")
        }

        //   response.json(data);


        // access baccarat room 2
        // await page.goto("https://truthbet.com/g/live/baccarat/22", {
        //   waitUntil: "networkidle2",
        // });
        // await browser.close();
    })(username, password);

    return cookie
}


exports.getUserWallet = async function getUserWallet(cookie){
    let wallet = await (async (cookie) => {

        let balanceAPI = "https://bpweb.bikimex.net/player/query/queryBalancePC"
        const ps = new URLSearchParams()
        ps.append('dm', '1')

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookie
            }
        }
        
        
        
        let res = await axios.post(balanceAPI, ps, config)
    
        // console.log(res.data)

        if(res.data.status == '200'){
            return res.data.balance
        }else{
            return null
        }

        //   response.json(data);


        // access baccarat room 2
        // await page.goto("https://truthbet.com/g/live/baccarat/22", {
        //   waitUntil: "networkidle2",
        // });
        // await browser.close();
    })(cookie);

    return wallet
}