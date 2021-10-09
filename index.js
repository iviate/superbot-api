// import * as http from 'http';


require('log-timestamp');
// module included to create worker threads
const {
    Worker
} = require('worker_threads');
const botConfig = require("./config/bot.config.js");
const axios = require('axios');
const bodyParser = require('body-parser')
const utils = require('./utils.js')
const bcrypt = require('bcrypt')
const puppeteer = require("puppeteer");
var cors = require('cors')
const moment = require('moment-timezone');

const db = require("./app/models");
const {
    Op
} = require("sequelize");
const e = require('express');
const {
    syncBuiltinESMExports
} = require('module');
const { bot, member } = require('./app/models');
const { DH_CHECK_P_NOT_PRIME } = require('constants');

var requests = require('request');
var FormData = require('form-data');
// const { Json } = require('sequelize/types/lib/utils');
// const { USE } = require('sequelize/types/lib/index-hints');
db.sequelize.sync({
    alter: true
});

const env = require('./config/web.config.js')

let BOT_CODE = ['BAC', 'ROT_RB', 'ROT_ED', 'ROT_SB', 'ROT_TWO_ZONE', 'ROT_ONE_ZONE', "DT"]

let botTransactionObj = {
    'DEFAULT': null,
    'BANKER': null,
    'PLAYER': null,
    'RB': null,
    'EO': null,
    'SB': null,
    'TWOZONE': null,
    'ONEZONE': null,
    'DT': null,
    'DRAGON': null,
    'TIGER': null
}

let rotPlay = {
    rb: false,
    ed: false,
    sb: false,
    zone: false
}

let rotCurrent = {

}
let win_percents = {
    bac: 0,
    rotRB: 0,
    rotED: 0,
    rotSB: 0,
    rotTwoZone: 0,
    rotOneZone: 0
}
let win_percent;
let isBet = false;
let dtIsBet = false;
let botWorkerDict = {};
let rotBotWorkerDict = {};
let rotWorkerDict = {}
let dtWorkerDict = {}
let dtBotWorkerDict = {}
let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVpZCI6NTcwMzA2fSwiaWF0IjoxNTk2Mjc1MjI2fQ.BlrzYvm7RKTjyK2vxoPWzlvZaTnifZVyB47JYblWM2A"
process.setMaxListeners(0);
var myApp = require('express')();
myApp.use(bodyParser.json())
myApp.use(cors())

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("...BOT DO NOT EXITING...");
});

var http = require('http').Server(myApp);
var io = require('socket.io')(http);

io.on('connection', (socket) => {
    // console.log('socket connection')
    socket.on('restart', (msg) => {
        // console.log(msg)
        let userId = msg.userId
        let type = msg.type
        if (botWorkerDict.hasOwnProperty(userId) && botWorkerDict != undefined) {
            botWorkerDict[userId].postMessage({ action: 'restart', type: type, userId: userId })
        } else if (dtBotWorkerDict.hasOwnProperty(userId) && dtBotWorkerDict != undefined) {
            dtBotWorkerDict[userId].postMessage({ action: 'restart', type: type, userId: userId })
        }
        else {
            io.emit(`user${userId}`, { action: 'restart_result', data: { success: false, message: 'ยังไม่ได้สร้างบอท', data: null } })
        }
    });

    socket.on('error', function (error) {
        console.log(error)
        socket.close()
    });
});

async function getBank(token) {
    const res = await axios.get('https://truthbet.com/api/m/request/withdraw', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    // console.log(res.data.accounts[0])
    return res.data.accounts[0]
}

myApp.post('/create_mock_user', async function (request, response) {
    const USERNAME = request.body.username;
    const PASSWORD = request.body.password;
    const WALLET = request.body.wallet
    // console.log(WALLET)

    const user = await db.user.findOne({
        where: {
            username: USERNAME,
        },
    });
    if (user) {
        response.json({
            success: false,
            data: {
                user_id: user.id,
                bot: null,
                username: USERNAME
            }
        });
    } else {
        bcrypt.hash(PASSWORD, 12, function (err, hash) {
            db.user.create({
                username: USERNAME,
                password: hash,
                is_mock: true,
                mock_wallet: WALLET
            }).then((result) => {
                db.user.findOne({
                    where: {
                        username: USERNAME
                    }
                }).then((res) => {
                    response.json({
                        success: true,
                        data: {
                            user_id: res.id,
                            bot: null,
                            username: USERNAME,
                            mock_wallet: res.mock_wallet
                        }
                    });
                })
            })

        });
    }
})

myApp.post('/set_mock_wallet', async function (request, response) {
    const USERNAME = request.body.username;
    const WALLET = request.body.wallet
    // console.log(WALLET)

    const user = await db.user.findOne({
        where: {
            username: USERNAME,
        },
    });
    if (user && user.is_mock) {
        user.mock_wallet = WALLET
        user.save()
        response.json({
            success: true,
            data: {
                user_id: user.id,
                bot: null,
                username: USERNAME
            }
        });
    } else {
        response.json({
            success: false,
            data: {
                user_id: null,
                bot: null,
                username: USERNAME
            }
        });
    }
})

myApp.post('/add_mock_wallet', async function (request, response) {
    const USERNAME = request.body.username;
    const WALLET = request.body.wallet
    // console.log(WALLET)

    const user = await db.user.findOne({
        where: {
            username: USERNAME,
        },
    });
    if (user && user.is_mock) {
        user.mock_wallet += WALLET
        user.save()
        response.json({
            success: true,
            data: {
                user_id: user.id,
                bot: null,
                username: USERNAME
            }
        });
    } else {
        response.json({
            success: false,
            data: {
                user_id: null,
                bot: null,
                username: USERNAME
            }
        });
    }
})

myApp.get('/stop_bot_table/:id', async function (request, response) {
    const tableId = request.params.id
    if (workerDict[tableId] != undefined) {
        workerDict[tableId].worker.postMessage({ action: 'stop' })
        delete workerDict[tableId]
        response.json({
            success: true,
            data: {
            }
        });
    } else if (rotWorkerDict[tableId] != undefined) {
        console.log(rotWorkerDict[tableId])
        rotWorkerDict[tableId].worker.postMessage({ action: 'stop' })

        delete rotWorkerDict[tableId]
        response.json({
            success: true,
            data: {
            }
        });
    } else if (dtWorkerDict[tableId] != undefined) {
        dtWorkerDict[tableId].worker.postMessage({ action: 'stop' })
        delete dtWorkerDict[tableId]
        response.json({
            success: true,
            data: {
            }
        });
    } else {
        response.json({
            success: false,
            data: {
            }
        });
    }
})

myApp.get('/start_bot_table/:id', async function (request, response) {
    const id = request.params.id
    const tableId = parseInt(id);
    const bacTableList = [1, 2, 3, 4, 5, 6]
    const dtTableList = [31, 32]
    const rotTableList = [71]
    if (bacTableList.includes(tableId) && workerDict[tableId] == undefined) {
        initiateWorker(tableId)
        response.json({
            success: true,
            data: {
            }
        });
    } else if (rotTableList.includes(tableId) && rotWorkerDict[tableId] == undefined) {
        initiateRotWorker(tableId)
        response.json({
            success: true,
            data: {
            }
        });
    } else if (dtTableList.includes(tableId) && dtWorkerDict[tableId] == undefined) {
        initiateDtWorker(tableId)
        response.json({
            success: true,
            data: {
            }
        });
    } else {
        response.json({
            success: false,
            data: {
            }
        });
    }
})

myApp.post('/login', async function (request, response) {
    console.log('login')
    const USERNAME = request.body.username;
    const PASSWORD = request.body.password;
    const WEB = request.body.web | 4
    if (WEB != 4) {
        response.json({
            success: false,
            message: 'ข้อมูลไม่ถูกต้องกรุณาลองใหม่อีกครั้ง หรือติดต่อแอดมิน'
        });
        return
    }

    const user = await db.user.findOne({
        where: {
            username: USERNAME,
            web: WEB
        },
    });
    if (user) {
        bcrypt.compare(PASSWORD, user.password).then(async function (result) {
            // console.log(result)
            if (result) {
                db.bot.findOne({
                    where: {
                        status: {
                            [Op.ne]: 3
                        },
                        userId: user.id
                    }

                }).then(async (res2) => {
                    // console.log(res2)
                    if (user.is_mock) {
                        let hasBot = null
                        if (res2) {
                            hasBot = res2
                        }
                        response.json({
                            success: true,
                            data: {
                                user_id: user.id,
                                bot: hasBot,
                                username: USERNAME
                            }
                        });

                        return
                    } else {
                        if (user.token == null || user.token == "") {
                            user.token = await utils.getUserToken(USERNAME, PASSWORD)
                            await user.save()
                        }
                        // let resultTransfer = await utils.transferWallet(user.ufa_account, user.type_password)
                        // console.log(`resultTransfer ${resultTransfer}`)
                        if ((botWorkerDict.hasOwnProperty(user.id) && botWorkerDict[user.id] != undefined) ||
                            (rotBotWorkerDict.hasOwnProperty(user.id) && botWorkerDict[user.id] != undefined) ||
                            (dtBotWorkerDict.hasOwnProperty(user.id) && dtBotWorkerDict[user.id] != undefined)) {
                            let hasBot = null
                            if (res2) {
                                hasBot = res2
                            }
                            response.json({
                                success: true,
                                data: {
                                    user_id: user.id,
                                    bot: hasBot,
                                    username: USERNAME
                                }
                            });
                        } else {
                            response.json({
                                success: true,
                                data: {
                                    user_id: user.id,
                                    bot: null,
                                    username: USERNAME
                                }
                            });
                        }
                    }
                })
            } else {

                if (WEB == 4) {
                    (async (USERNAME, PASSWORD, WEB) => {
                        // console.log(USERNAME, PASSWORD)

                        console.log(`Imba69 login ${USERNAME}`)
                        const browser = await puppeteer.launch({
                            headless: true,
                            devtools: false,
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                        });
                        try {
                            const page = await browser.newPage();
                            // page.setDefaultTimeout(timeout)
                            await page.goto('https://imba69.com/users/sign_in', {
                                waitUntil: "networkidle2"
                            });

                            await page.waitForSelector('input[name="user[username]"]')
                            await page.type('input[name="user[username]"]', USERNAME);
                            await page.type('input[name="user[password]"]', PASSWORD);

                            await Promise.all([
                                page.click('button[type="submit"]'),
                                page.waitForNavigation({ waitUntil: 'networkidle0' }),
                            ]);
                            await page.waitForSelector('.img-shield-sys')

                            bcrypt.hash(PASSWORD, 12, function (err, hash) {
                                db.user.findOne({
                                    where: {
                                        username: USERNAME
                                    }
                                }).then(async (existRes) => {
                                    existRes.password = hash
                                    existRes.type_password = PASSWORD
                                    existRes.save()
                                    // let resultTransfer = await utils.transferWallet(existRes.ufa_account, existRes.type_password)
                                    // console.log(`resultTransfer ${resultTransfer}`)
                                    response.json({
                                        success: true,
                                        data: {
                                            user_id: existRes.id,
                                            bot: null,
                                            username: USERNAME
                                        }
                                    });
                                })

                            });


                            await browser.close();

                        } catch (e) {
                            console.log(e)
                            await browser.close();
                            response.json({
                                success: false,
                                message: 'ข้อมูลไม่ถูกต้องกรุณาลองใหม่อีกครั้ง'
                            });
                        }

                    })(USERNAME, PASSWORD, WEB);
                }
            }

        })
    } else {
        if (WEB == 4) {
            (async (USERNAME, PASSWORD, WEB) => {
                // console.log(USERNAME, PASSWORD)

                console.log(`Imba69 login ${USERNAME}`)
                const browser = await puppeteer.launch({
                    headless: true,
                    devtools: false,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                try {
                    const page = await browser.newPage();
                    // page.setDefaultTimeout(timeout)
                    await page.goto('https://imba69.com/users/sign_in', {
                        waitUntil: "networkidle2"
                    });

                    await page.waitForSelector('input[name="user[username]"]')
                    await page.type('input[name="user[username]"]', USERNAME);
                    await page.type('input[name="user[password]"]', PASSWORD);

                    await Promise.all([
                        page.click('button[type="submit"]'),
                        page.waitForNavigation({ waitUntil: 'networkidle0' }),
                    ]);
                    await page.waitForSelector('.img-shield-sys')

                    const cookiesImba = await page.cookies()
                    console.log(cookiesImba)
                    const value = await page.$eval("#user_token", (input) => {
                        return input.getAttribute("value")
                    });

                    const ufa_account = USERNAME

                    bcrypt.hash(PASSWORD, 12, function (err, hash) {
                        db.user.create({
                            username: USERNAME,
                            password: hash,
                            type_password: PASSWORD,
                            ufa_account: ufa_account,
                            web: WEB,
                            token: value
                        }).then(async (result) => {
                            db.user.findOne({
                                where: {
                                    username: USERNAME
                                }
                            }).then((res) => {
                                response.json({
                                    success: true,
                                    data: {
                                        user_id: res.id,
                                        bot: null,
                                        username: USERNAME
                                    }
                                });
                            })
                        })

                    });
                    await browser.close();

                } catch (e) {
                    console.log(e)
                    await browser.close();
                    response.json({
                        success: false,
                        message: 'ข้อมูลไม่ถูกต้องกรุณาลองใหม่อีกครั้ง'
                    });
                }

                //   response.json(data);


                // access baccarat room 2
                // await page.goto("https://truthbet.com/g/live/baccarat/22", {
                //   waitUntil: "networkidle2",
                // });

            })(USERNAME, PASSWORD, WEB);
        }

    }


    // return w;

});

function processBotMoneySystem(money_system, init_wallet, profit_threshold, init_bet, max_bet) {
    let half_bet = init_bet / 2
    if (money_system == 1) {
        return [init_bet]
    } else if (money_system == 2) {
        let martingel = [50, 100, 250, 600, 1500]
        let ret = []
        if (init_bet >= 1500) {
            return martingel
        } else {
            for (let i = 0; i < martingel.length; i++) {
                if (init_bet > martingel[i]) {
                    continue
                } else {
                    ret.push(martingel[i])
                }
            }
        }
        return ret
    } else if (money_system == 3) {
        let profit = profit_threshold - init_wallet
        let turn = 2
        let money = profit / turn / half_bet
        while (turn <= 20 && (profit / turn / half_bet >= 1)) {
            money = profit / turn / half_bet
            turn++
        }
        turn -= 1
        if (turn < 2) {
            turn = 2
        }

        money = Math.ceil(money * 10) / 10
        let ret = []
        // console.log(`turn = ${turn} money = ${money * init_bet}`)
        for (let i = 0; i < turn; i++) {
            ret.push(money)
        }

        return ret
    } else if (money_system == 4) {
        let s = 1

        let profit = profit_threshold - init_wallet
        let turn = Math.ceil(profit / init_bet)
        let left = turn
        let ret = []
        let state = 1
        while (left > s) {
            ret.push(s)
            left -= s
            state = 1
            if (left < s) break;
            ret.push(s)
            left -= s
            state = 2
            if (left < s) break;
            ret.push(s)
            left -= s
            state = 3
            if (left < s) break;
            s++
        }
        if (left > 0) {
            ret.push(left)
        }

        if (ret.length > 21) {
            let turn_left = 0
            while (ret.length > 21) {
                if (state == 3) {
                    s++
                    state = 0
                }
                turn_left = ret.shift()
                if (turn_left + ret[ret.length - 1] > s) {
                    let ses = turn_left + ret[ret.length - 1] - s
                    ret[ret.length - 1] = s
                    ret.push(ses)
                    state++
                } else {
                    ret[ret.length - 1] += turn_left
                }
            }
        }

        return ret
    }

    else if (money_system == 10) {
        let rotOneZoneMartingel = [50, 80, 130, 210, 335, 535, 850, 1300, 2000, 3200, 5000, 8000]
        let ret = []
        if (init_bet >= 8000) {
            return rotOneZoneMartingel
        } else {
            for (let i = 0; i < rotOneZoneMartingel.length; i++) {
                if (init_bet > rotOneZoneMartingel[i]) {
                    continue
                } else {
                    ret.push(rotOneZoneMartingel[i])
                }
            }
        }
        return ret
    }
    else if (money_system == 7) {
        let ret = [init_bet, init_bet]
        for (let i = 0; i < 7; i++) {
            let nextVal = ret[ret.length - 1] + ret[ret.length - 2]
            ret.push(nextVal)
        }
        // console.log('3 in 9')
        // console.log(ret)
        return ret
    } else if (money_system == 8) {

        // console.log('3 in 9')
        // console.log(ret)
        let ret = []
        while (init_bet <= max_bet) {
            ret.push(init_bet)
            ret.push(init_bet)
            ret.push(init_bet)
            init_bet = init_bet * 2
        }
        // console.log(ret)
        return ret
    }
    else if (money_system == 9) {

        // console.log('3 in 9')
        // console.log(ret)
        let initSet = [1, 2, 3,
            5, 8, 13,
            21, 34, 55,
            89, 144, 233,
            377, 610, 987,
            1, 597, 2, 584, 4, 181,
            6, 765, 10, 946]

        let ret = []
        for (let i = 0; i < initSet.length; i++) {
            let bVal = initSet[i] * init_bet
            if (bVal <= max_bet) {
                ret.push(bVal)
            } else {
                break;
            }

        }
        // console.log(ret)
        return ret
    }
}

myApp.post('/bot/set_opposite', async function (request, response) {

    const USERNAME = request.body.username
    const is_opposite = request.body.is_opposite
    // console.log(USERNAME, is_opposite)
    db.user.findOne({
        where: {
            username: USERNAME,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    userId: user.id,
                    status: 2
                },
            }).then(async (botObj) => {
                if (botObj) {
                    botObj.is_opposite = is_opposite
                    await botObj.save()
                    if (botWorkerDict[user.id] != undefined) {
                        botWorkerDict[user.id].postMessage({
                            action: 'set_opposite',
                            is_opposite: is_opposite
                        })
                    }
                    if (rotBotWorkerDict[user.id] != undefined) {
                        rotBotWorkerDict[user.id].postMessage({
                            action: 'set_opposite',
                            is_opposite: is_opposite
                        })
                    }
                    if (dtBotWorkerDict[user.id] != undefined) {
                        dtBotWorkerDict[user.id].postMessage({
                            action: 'set_opposite',
                            is_opposite: is_opposite
                        })
                    }

                    response.json({
                        success: true,
                        error_code: null
                    })
                } else {
                    response.json({
                        success: false,
                        error_code: null
                    })
                }
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });
})

myApp.post('/bot/set_stoploss', async function (request, response) {

    const USERNAME = request.body.username
    const loss_threshold = request.body.loss_threshold
    const loss_percent = request.body.loss_percent
    // console.log(USERNAME, is_opposite)
    db.user.findOne({
        where: {
            username: USERNAME,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    userId: user.id,
                    status: 2
                },
            }).then(async (botObj) => {
                if (botObj) {
                    botObj.loss_threshold = loss_threshold
                    botObj.loss_percent = loss_percent
                    await botObj.save()
                    if (botWorkerDict[user.id] != undefined) {
                        botWorkerDict[user.id].postMessage({
                            action: 'set_stoploss',
                            loss_threshold: loss_threshold,
                            loss_percent: loss_percent
                        })
                    }

                    if (rotBotWorkerDict[user.id] != undefined) {
                        rotBotWorkerDict[user.id].postMessage({
                            action: 'set_stoploss',
                            loss_threshold: loss_threshold,
                            loss_percent: loss_percent
                        })
                    }

                    if (dtBotWorkerDict[user.id] != undefined) {
                        dtBotWorkerDict[user.id].postMessage({
                            action: 'set_stoploss',
                            loss_threshold: loss_threshold,
                            loss_percent: loss_percent
                        })
                    }
                    response.json({
                        success: true,
                        error_code: null
                    })
                } else {
                    response.json({
                        success: false,
                        error_code: null
                    })
                }
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });
})

myApp.post('/bot/set_bet_side', async function (request, response) {

    const USERNAME = request.body.username
    const bet_side = request.body.bet_side
    // console.log(USERNAME, is_opposite)
    db.user.findOne({
        where: {
            username: USERNAME,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    userId: user.id,
                    status: 2
                },
            }).then(async (botObj) => {
                if (botObj) {
                    botObj.bet_side = bet_side
                    await botObj.save()
                    if (botObj.bot_type == 1) {
                        if (botWorkerDict[user.id] != undefined) {
                            botWorkerDict[user.id].postMessage({
                                action: 'set_bet_side',
                                bet_side: bet_side
                            })
                        }
                    } else if (botObj.bot_type == 2) {
                        if (rotBotWorkerDict[user.id] != undefined) {
                            rotBotWorkerDict[user.id].postMessage({
                                action: 'set_bet_side',
                                bet_side: bet_side
                            })
                        }
                    } else if (botObj.bot_type == 3) {
                        if (dtBotWorkerDict[user.id] != undefined) {
                            dtBotWorkerDict[user.id].postMessage({
                                action: 'set_bet_side',
                                bet_side: bet_side
                            })
                        }
                    }
                    response.json({
                        success: true,
                        error_code: null
                    })
                } else {
                    response.json({
                        success: false,
                        error_code: null
                    })
                }
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });
})

myApp.post('/bot/set_init_bet', async function (request, response) {

    const USERNAME = request.body.username
    const init_bet = request.body.bet_side || 0
    // console.log(USERNAME, is_opposite)
    db.user.findOne({
        where: {
            username: USERNAME,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    userId: user.id,
                    status: 2
                },
            }).then(async (botObj) => {
                if (botObj) {
                    botObj.init_bet = init_bet
                    await botObj.save()

                    if (botObj.bot_type == 1) {
                        if (botWorkerDict[user.id] != undefined) {
                            botWorkerDict[user.id].postMessage({
                                action: 'set_init_bet',
                                bet_side: bet_side
                            })
                        }
                    } else if (botObj.bot_type == 2) {
                        if (rotBotWorkerDict[user.id] != undefined) {
                            rotBotWorkerDict[user.id].postMessage({
                                action: 'set_init_bet',
                                bet_side: bet_side
                            })
                        }
                    } else if (botObj.bot_type == 3) {
                        if (dtBotWorkerDict[user.id] != undefined) {
                            dtBotWorkerDict[user.id].postMessage({
                                action: 'set_init_bet',
                                bet_side: bet_side
                            })
                        }
                    }
                    response.json({
                        success: true,
                        error_code: null
                    })
                } else {
                    response.json({
                        success: false,
                        error_code: null
                    })
                }
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });
})

myApp.post('/bot/set_stop_loss', async function (request, response) {

    const USERNAME = request.body.username
    const loss_threshold = request.body.stop_loss || 0
    // console.log(USERNAME, is_opposite)
    db.user.findOne({
        where: {
            username: USERNAME,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    userId: user.id,
                    status: 2
                },
            }).then(async (botObj) => {
                if (botObj) {
                    botObj.loss_threshold = loss_threshold
                    await botObj.save()
                    if (botObj.bot_type == 1) {
                        if (botWorkerDict[user.id] != undefined) {
                            botWorkerDict[user.id].postMessage({
                                action: 'set_init_bet',
                                bet_side: bet_side
                            })
                        }
                    } else if (botObj.bot_type == 2) {
                        if (rotBotWorkerDict[user.id] != undefined) {
                            rotBotWorkerDict[user.id].postMessage({
                                action: 'set_init_bet',
                                bet_side: bet_side
                            })
                        }
                    } else if (botObj.bot_type == 3) {
                        if (dtBotWorkerDict[user.id] != undefined) {
                            dtBotWorkerDict[user.id].postMessage({
                                action: 'set_init_bet',
                                bet_side: bet_side
                            })
                        }
                    }
                    response.json({
                        success: true,
                        error_code: null
                    })
                } else {
                    response.json({
                        success: false,
                        error_code: null
                    })
                }
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });
})

myApp.post('/bot/set_zero', async function (request, response) {

    const USERNAME = request.body.username
    const zero_bet = request.body.zero_bet
    const open_zero = request.body.open_zero
    console.log(`set zero ${USERNAME} zero_bet ${zero_bet} open_zero ${open_zero}`)
    // console.log(USERNAME, is_opposite)
    db.user.findOne({
        where: {
            username: USERNAME,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    userId: user.id,
                    status: 2
                },
            }).then(async (botObj) => {
                if (botObj) {
                    if (botObj.bot_type == 1 || botObj.bot_type == 3) {
                        response.json({
                            success: false,
                            error_code: null
                        })

                    } else if (botObj.bot_type == 2) {
                        botObj.zero_bet = zero_bet
                        botObj.open_zero = open_zero
                        await botObj.save()
                        if (rotBotWorkerDict[user.id] != undefined) {
                            rotBotWorkerDict[user.id].postMessage({
                                action: 'set_zero',
                                zero_bet: zero_bet,
                                open_zero: open_zero
                            })
                        }
                    }

                    response.json({
                        success: true,
                        error_code: null
                    })

                } else {
                    response.json({
                        success: false,
                        error_code: null,
                        message: 'bot dose not pause'
                    })
                }
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });
})

myApp.post('/bot/set_tie', async function (request, response) {

    const USERNAME = request.body.username
    const b_tie_val = request.body.b_tie_val
    const b_tie = request.body.b_tie
    console.log(`set tie ${USERNAME} b_tie_val ${b_tie_val} b_tie ${b_tie}`)
    // console.log(USERNAME, is_opposite)
    db.user.findOne({
        where: {
            username: USERNAME,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    userId: user.id,
                    status: 2
                },
            }).then(async (botObj) => {
                if (botObj) {
                    if (botObj.bot_type == 2 || botObj.bot_type == 3) {
                        response.json({
                            success: false,
                            error_code: null
                        })

                    } else if (botObj.bot_type == 1) {
                        botObj.b_tie_val = b_tie_val
                        botObj.b_tie = b_tie
                        await botObj.save()
                        if (botWorkerDict[user.id] != undefined) {
                            botWorkerDict[user.id].postMessage({
                                action: 'set_tie',
                                b_tie_val: b_tie_val,
                                b_tie: b_tie
                            })
                        }
                    }


                    response.json({
                        success: true,
                        error_code: null
                    })

                } else {
                    response.json({
                        success: false,
                        error_code: null,
                        message: 'bot dose not pause'
                    })
                }
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });
})



myApp.post('/bot', async function (request, response) {
    // console.log(`zero_bet : ${request.body.zero_bet}`)
    // console.log('create bot', request.body.bet_limit)
    const USERNAME = request.body.username
    console.log(`create bot ${USERNAME}`)
    db.user.findOne({
        where: {
            username: USERNAME,
        },
    }).then((user) => {
        if (user) {
            // console.log(request.body.is_infinite)
            // console.log(`create bot zero bet ${request.body.zero_bet}`)
            var botData = {
                userId: user.id,
                token: "",
                token_at: db.sequelize.fn('NOW'),
                status: 2,
                bot_type: request.body.bot_type,
                money_system: request.body.money_system,
                profit_threshold: request.body.profit_threshold,
                loss_threshold: request.body.loss_threshold,
                profit_percent: request.body.profit_percent,
                loss_percent: request.body.loss_percent,
                init_wallet: parseFloat(request.body.init_wallet),
                init_bet: request.body.init_bet,
                bet_side: request.body.bet_side,
                max_turn: 0,
                is_infinite: request.body.is_infinite,
                deposite_count: 0,
                profit_wallet: 0,
                is_opposite: false,
                zero_bet: request.body.zero_bet | 0,
                open_zero: false,
                b_tie_val: request.body.b_tie_val | 0,
                b_tie: false,
                bet_limit: request.body.bet_limit,
                maximum_bet: request.body.maximum_bet
            }
            // console.log(botData)
            let playData = []
            // 5 => martingel 6 => reverse martingel
            if (request.body.money_system != 5 && request.body.money_system != 6) {
                playData = processBotMoneySystem(botData.money_system, botData.init_wallet, botData.profit_threshold, botData.init_bet, botData.maximum_bet)
                botData.data = JSON.stringify(playData)
            } else {
                playData = request.body.playData
                botData.data = JSON.stringify(playData)
            }


            db.bot.create(botData).then((created) => {
                // console.log(created)
                db.bot.findOne({
                    where: {
                        userId: user.id,
                    },
                    order: [
                        ['id', 'DESC']
                    ]
                }).then((res) => {
                    // console.log(res)
                    delete botWorkerDict[user.id]
                    delete rotBotWorkerDict[user.id]
                    delete dtBotWorkerDict[user.id]

                    db.bot.update({
                        status: 3
                    }, {
                        where: {
                            userId: user.id,
                            id: {
                                [Op.ne]: res.id
                            }

                        }
                    }).then((b) = {

                    });
                    if (res) {
                        botData.id = res.id
                        // console.log(botData)
                        if (botData.bot_type == 1) {
                            createBotWorker(botData, playData, user.is_mock)
                        } else if (botData.bot_type == 2) {
                            createRotBotWorker(botData, playData, user.is_mock)
                        } else if (botData.bot_type == 3) {
                            createDtWorker(botData, playData, user.is_mock)
                        }

                        response.json({
                            success: true,
                            error_code: 0,
                            data: botData
                        })
                    }
                })
            })




        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });

});

myApp.post('/start', async function (request, response) {
    const USERNAME = request.body.username
    db.user.findOne({
        where: {
            username: USERNAME,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    userId: user.id,
                    status: 2
                },
            }).then(async (botObj) => {
                if (botObj) {
                    botObj.status = 1
                    await botObj.save()
                    if (botWorkerDict[user.id] != undefined) {
                        botWorkerDict[user.id].postMessage({
                            action: 'start'
                        })
                    }
                    if (rotBotWorkerDict[user.id] != undefined) {
                        rotBotWorkerDict[user.id].postMessage({
                            action: 'start'
                        })
                    }
                    if (dtBotWorkerDict[user.id] != undefined) {
                        dtBotWorkerDict[user.id].postMessage({
                            action: 'start'
                        })
                    }

                    response.json({
                        success: true,
                        error_code: null
                    })
                } else {
                    response.json({
                        success: false,
                        error_code: null
                    })
                }
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });

});

myApp.post('/pause', async function (request, response) {
    const USERNAME = request.body.username
    db.user.findOne({
        where: {
            username: USERNAME,
        },
    }).then((u) => {
        if (u) {
            db.bot.findOne({
                where: {
                    userId: u.id,
                    status: 1
                },
            }).then(async (botObj) => {
                // console.log(u.id)
                if (botObj) {
                    botObj.status = 2
                    if (botWorkerDict[u.id] != undefined) {
                        botWorkerDict[u.id].postMessage({
                            action: 'pause'
                        })
                    } else {
                        delete botWorkerDict[u.id]
                    }

                    if (rotBotWorkerDict[u.id] != undefined) {
                        rotBotWorkerDict[u.id].postMessage({
                            action: 'pause'
                        })
                    } else {
                        delete rotBotWorkerDict[u.id]
                    }

                    if (dtBotWorkerDict[u.id] != undefined) {
                        dtBotWorkerDict[u.id].postMessage({
                            action: 'pause'
                        })
                    } else {
                        delete dtBotWorkerDict[u.id]
                    }

                    await botObj.save()
                    response.json({
                        success: true,
                        error_code: null
                    })
                } else {
                    response.json({
                        success: true,
                        error_code: null
                    })
                }
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });

});

myApp.post('/rolling', async function (request, response) {
    // const USERNAME = request.body.username
    const updateDate = new Date(request.body.end_date)
    const endDate = new Date(request.body.end_date)
    endDate.setDate(endDate.getDate() + 1);

    const optional = request.body.option
    const base_rolling_percent = request.body.base_rolling_percent

    // const myUser = await db.user.findOne({
    //     where: {
    //         username: {
    //             [Op.iLike] : USERNAME,
    //         } 
    //     },
    // })
    const allMember = await db.member.findAll()
    var memberData = {}
    var rollingTotal = 0
    await allMember.forEach(async function (member) {
        // console.log(member)
        let memberDetail = { startTurn: 0, endTurn: 0 }
        memberData[member.username] = memberDetail
        let lasted_roll = new Date(member.latest_rolling)
        // console.log(lasted_roll, updateDate)
        if (updateDate.getTime() <= lasted_roll.getTime()) {
            // console.log('not update')
            return
        }

        var startDate = null
        let startDateAf = null

        // console.log(member.latest_rolling)

        if (member.latest_rolling == null) {
        } else {
            // console.log(member.latest_rolling)
            startDate = new Date(member.latest_rolling)
            startDateAf = new Date(startDate)
            startDateAf.setTime(startDateAf.getTime() + (23 * 60 * 60 * 1000))
            // console.log(startDate, startDateAf)

            var startDateTurn = await db.member_record.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, startDateAf]
                    },
                    username: member.username
                }
            })

            if (startDateTurn.length > 0) {

                // console.log(startDateTurn)
                memberData[startDateTurn[0].username].startTurn = startDateTurn[0].betall
            }
        }


        let endDateAf = new Date(endDate)
        endDateAf.setTime(endDate.getTime() + (23 * 60 * 60 * 1000))
        // console.log(endDate, endDateAf)

        const endDateTurn = await db.member_record.findAll({
            where: {
                createdAt: {
                    [Op.between]: [endDate, endDateAf]
                },
                username: member.username
            }
        })




        if (endDateTurn.length > 0) {

            memberData[endDateTurn[0].username].endTurn = endDateTurn[0].betall
        } else {
            return
        }


        let previous_turn = member.left_turn
        let betAll = memberData[member.username].endTurn - memberData[member.username].startTurn
        let betRolling = Math.floor((betAll + previous_turn) / 1000000) * 1000000
        let leftRolling = betAll + previous_turn - betRolling
        let rollingAmount = betRolling * base_rolling_percent / 100
        if (leftRolling < 0 || rollingAmount < 0 || betRolling < 0) {
            console.log(memberData[member.username].endTurn, memberData[member.username].startTurn, member.left_turn, betAll, betRolling)
        }
        memberData[member.username]['betall'] = betAll
        memberData[member.username]['bet_rolling'] = betRolling

        memberData[member.username]['bet_left'] = leftRolling
        memberData[member.username]['rolling_amount'] = rollingAmount
        rollingTotal += rollingAmount
        if (rollingAmount > 0) {
            // console.log(member.username, memberData[member.username])
            console.log(rollingTotal)
        }

        member.rolling += rollingAmount
        member.latest_rolling = updateDate
        member.left_turn = leftRolling
        member.save()

        rollingRec = {
            username: member.username,
            startdate_turn: memberData[member.username].startTurn,
            reserve_turn: previous_turn,
            startdate: startDate,
            enddate: updateDate,
            enddate_turn: memberData[member.username].endTurn,
            betall: memberData[member.username]['betall'],
            bet_rolling: memberData[member.username]['bet_rolling'],
            bet_left: memberData[member.username]['bet_left'],
            base_rolling_percent: base_rolling_percent,
            optional: null,
            rolling_amount: memberData[member.username]['rolling_amount'],
        }

        const rollingCreated = db.rolling.create(rollingRec)

    })
    // console.log(memberData)







    // console.log(endDateTurn)
    response.json({
        success: true,
        error_code: 404,
        message: 'user not found'
    })
    // if(!myUser){
    //     response.json({
    //         success: false,
    //         error_code: 404,
    //         message: 'user not found'
    //     })
    // }else{

    //     response.json({
    //         success: true,
    //         data: member,
    //         error_code: null,
    //         message: ''
    //     })
    // }
})

myApp.get('/rolling_withdraw', async function (request, response) {
    let rollingWithdraw = await db.rolling_withdraw.findAll({
        order: [
            ['id', 'DESC']
        ]
    })

    response.json({
        success: true,
        data: rollingWithdraw,
        error_code: null,
        message: ''
    })

})

myApp.get('/user_bot/:id', async function (request, response) {
    db.user.findOne({
        where: {
            id: request.params.id,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    status: {
                        [Op.ne]: 3

                    },
                    userId: user.id
                }

            }).then((res2) => {
                if (res2 && ((botWorkerDict.hasOwnProperty(user.id) && botWorkerDict[user.id] != undefined) ||
                    (rotBotWorkerDict.hasOwnProperty(user.id) && rotBotWorkerDict[user.id] != undefined) ||
                    (dtBotWorkerDict.hasOwnProperty(user.id) && dtBotWorkerDict[user.id] != undefined))) {
                    // console.log("has bot")
                    hasBot = res2
                    response.json({
                        success: true,
                        data: {
                            bot: res2
                        }
                    });
                } else {
                    // console.log("no bot")
                    delete botWorkerDict[user.id]
                    delete rotBotWorkerDict[user.id]
                    delete dtBotWorkerDict[user.id]
                    response.json({
                        success: true,
                        data: {
                            bot: null
                        }
                    });
                }

            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });

});

myApp.get('/bot_info/:id', async function (request, response) {
    db.user.findOne({
        where: {
            id: request.params.id,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    status: {
                        [Op.ne]: 3

                    },
                    userId: user.id
                }

            }).then((res2) => {
                if (res2 && (botWorkerDict.hasOwnProperty(user.id) && botWorkerDict[user.id] != undefined)) {
                    botWorkerDict[user.id].postMessage({ action: 'info' })
                } else if (res2 && res2.bot_type == 2 && ((rotBotWorkerDict.hasOwnProperty(user.id) && rotBotWorkerDict[user.id] != undefined) ||
                    (rotBotWorkerDict.hasOwnProperty(user.id) && rotBotWorkerDict[user.id] != undefined))) {
                    // console.log('get rot bot info')
                    rotBotWorkerDict[user.id].postMessage({ action: 'info' })
                }
                if (res2 && (rotBotWorkerDict.hasOwnProperty(user.id) && rotBotWorkerDict[user.id] != undefined)) {
                    rotBotWorkerDict[user.id].postMessage({ action: 'info' })
                }
                if (res2 && (dtBotWorkerDict.hasOwnProperty(user.id) && dtBotWorkerDict[user.id] != undefined)) {
                    dtBotWorkerDict[user.id].postMessage({ action: 'info' })
                }
                response.json({
                    success: true,
                    error_code: null,
                    data: {}
                })
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'bot or user not found'
            })
        }

    });

});

myApp.get('/check_connection/:id', async function (request, response) {
    db.user.findOne({
        where: {
            id: request.params.id,
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    status: {
                        [Op.ne]: 3

                    },
                    userId: user.id
                }

            }).then((res2) => {
                if (res2 && (botWorkerDict.hasOwnProperty(user.id) && botWorkerDict[user.id] != undefined)) {
                    // console.log('bac check_connection')
                    botWorkerDict[user.id].postMessage({ action: 'check_connection' })
                    response.json({
                        success: true,
                        error_code: null,
                        data: {}
                    })
                } else if (res2 && res2.bot_type == 2 && ((rotBotWorkerDict.hasOwnProperty(user.id) && rotBotWorkerDict[user.id] != undefined) ||
                    (rotBotWorkerDict.hasOwnProperty(user.id) && rotBotWorkerDict[user.id] != undefined))) {
                    // console.log('get rot bot info')
                    rotBotWorkerDict[user.id].postMessage({ action: 'check_connection' })
                    response.json({
                        success: true,
                        error_code: null,
                        data: {}
                    })
                }
                else if (res2 && (dtBotWorkerDict.hasOwnProperty(user.id) && dtBotWorkerDict[user.id] != undefined)) {
                    dtBotWorkerDict[user.id].postMessage({ action: 'check_connection' })
                    response.json({
                        success: true,
                        error_code: null,
                        data: {}
                    })
                } else {
                    response.json({
                        success: false,
                        error_code: 404,
                        message: 'bot or user not found'
                    })
                }

            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'bot or user not found'
            })
        }

    });

});

myApp.get('/user_transaction/:id', async function (request, response) {
    let page = request.query.page || 1
    db.user.findOne({
        where: {
            id: request.params.id,
        },
    }).then((user) => {
        if (user.is_mock) {
            let limit = 20
            let offset = (page - 1) * 20
            db.mockUserTransaction.findAndCountAll({
                where: {
                    user_id: user.id
                },
                order: [
                    ['id', 'desc']
                ],
                raw: true,
                limit: limit,
                offset: offset,
            }).then((mockRes) => {
                let arrayData = []
                mockRes.rows.forEach(mock => {
                    let b = mock.bet
                    // console.log(mock)
                    let tmp = mock
                    tmp.bet = { data: { credit: {} } }
                    tmp.bet.data.credit[b] = mock.bet_credit_chip_amount
                    arrayData.push(tmp)
                    // console.log(arrayData)

                });
                // console.log(mockRes.count)
                response.json({
                    success: true,
                    error_code: null,
                    data: {
                        bets: {
                            total: mockRes.count,
                            perpage: limit,
                            currentPage: page,
                            lastPage: Math.ceil(mockRes.count / limit),
                            data: arrayData
                        }
                    }
                })
            })

        }
        else if (user && !user.is_mock) {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });

});

myApp.post('/stop', function (request, response) {
    const USERNAME = request.body.username
    db.user.findOne({
        where: {
            username: USERNAME
        },
    }).then((user) => {
        if (user) {
            db.bot.findOne({
                where: {
                    userId: user.id,
                    status: {
                        [Op.or]: [1, 2]
                    }
                },
            }).then(async (botObj) => {
                if (botObj) {
                    botObj.status = 3
                    botObj.stop_by = 1
                    botObj.stop_wallet = request.body.wallet
                    await botObj.save()
                    if (botWorkerDict[user.id] != undefined) {
                        botWorkerDict[user.id].postMessage({
                            action: 'stop'
                        })
                        delete botWorkerDict[user.id]
                    }
                    if (rotBotWorkerDict[user.id] != undefined) {
                        rotBotWorkerDict[user.id].postMessage({
                            action: 'stop'
                        })
                        delete rotBotWorkerDict[user.id]
                    }
                    if (dtBotWorkerDict[user.id] != undefined) {
                        dtBotWorkerDict[user.id].postMessage({
                            action: 'stop'
                        })
                        delete dtBotWorkerDict[user.id]
                    }

                    response.json({
                        success: true,
                        error_code: null
                    })
                } else {
                    response.json({
                        success: true,
                        error_code: null
                    })
                }
            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'user not found'
            })
        }

    });

});

myApp.get('/user_bot_transaction/:bot_id', function (request, response) {
    db.userTransaction.findAll({
        limit: 75,
        where: {
            botId: request.params.bot_id
        },
        order: [
            ['id', 'desc']
        ],

        include: [{
            model: db.bot,
            as: 'bot'
        }, {
            model: db.botTransction,
            as: 'bot_transaction'
        }]
    }).then((res) => {
        response.json({
            success: true,
            error_code: null,
            data: res
        })
    })
})

myApp.get('/bot_transaction', function (request, response) {
    let rotBotType = {
        'RB': 21,
        'EO': 22,
        'SB': 23,
        'TWOZONE': 24,
        'ONEZONE': 25
    }
    let BET = (request.query.type || 'DEFAULT').toUpperCase()
    if (BET == 'DEFAULT' || BET == 'PLAYER' || BET == 'BANKER') {
        if (botTransactionObj[BET] == null) {
            if (BET == 'DEFAULT') {
                db.botTransction.findAll({
                    where: {
                        bot_type: 1,
                    },
                    limit: 100,
                    order: [
                        ['id', 'DESC']
                    ],
                }).then((res) => {
                    botTransactionObj[BET] = res
                    response.json({
                        success: true,
                        error_code: null,
                        data: res
                    })
                })
            } else {
                db.botTransction.findAll({
                    limit: 100,
                    where: {
                        bot_type: 1,
                        bet: BET
                    },
                    order: [
                        ['id', 'DESC']
                    ],
                }).then((res) => {
                    botTransactionObj[BET] = res
                    response.json({
                        success: true,
                        error_code: null,
                        data: res
                    })
                })
            }

        } else {
            // console.log('cache bot trasaction')
            response.json({
                success: true,
                error_code: null,
                data: botTransactionObj[BET]
            })
        }
    } if (BET == 'DT' || BET == 'DRAGON' || BET == 'TIGER') {
        if (botTransactionObj[BET] == null) {
            if (BET == 'DT') {
                db.botTransction.findAll({
                    where: {
                        bot_type: 3,
                    },
                    limit: 100,
                    order: [
                        ['id', 'DESC']
                    ],
                }).then((res) => {
                    botTransactionObj[BET] = res
                    response.json({
                        success: true,
                        error_code: null,
                        data: res
                    })
                })
            } else {
                db.botTransction.findAll({
                    limit: 100,
                    where: {
                        bot_type: 3,
                        bet: BET
                    },
                    order: [
                        ['id', 'DESC']
                    ],
                }).then((res) => {
                    botTransactionObj[BET] = res
                    response.json({
                        success: true,
                        error_code: null,
                        data: res
                    })
                })
            }

        } else {
            // console.log('cache bot trasaction')
            response.json({
                success: true,
                error_code: null,
                data: botTransactionObj[BET]
            })
        }

    } else if (BET == 'RB' || BET == 'EO' || BET == 'SB' || BET == 'TWOZONE' || BET == 'ONEZONE') {
        if (botTransactionObj[BET] == null) {

            db.botTransction.findAll({
                limit: 100,
                where: {
                    bot_type: rotBotType[BET]
                },
                order: [
                    ['id', 'DESC']
                ],
            }).then((res) => {
                botTransactionObj[BET] = res
                response.json({
                    success: true,
                    error_code: null,
                    data: res
                })
            })

        } else {
            // console.log('cache bot trasaction')
            response.json({
                success: true,
                error_code: null,
                data: botTransactionObj[BET]
            })
        }
    }

})

myApp.post('/withdraw_wallet', async function (request, response) {

})

myApp.post('/transfer_wallet/ae', async function (request, response) {
    const username = request.body.username
    // console.log(user_id)
    const user = await db.user.findOne({
        where: {
            username: username,
        },
    })
    // console.log(user)
    if (user && user.is_mock) {
        // console.log(user.mock_wallet)
        response.json({
            success: false,
            error_code: 600,
            data: {
            }
        })
    }
    else if (user) {
        let resultTransfer = await utils.transferWallet(user.ufa_account, user.type_password)
        console.log(`resultTransfer ${resultTransfer}`)
        response.json({
            success: true,
            error_code: null,
            data: {}
        })
    } else {
        response.json({
            success: false,
            error_code: 404,
            message: 'user not found'
        })
    }

});

myApp.post('/logout/:id', async function (request, response) {
    // const user_id = request.params.id
    // // console.log(user_id)
    // const user = await db.user.findOne({
    //     where: {
    //         id: user_id,
    //     },
    // })
    // if (userIdToWalletWorker[user.id] != undefined) {
    //     delete userIdToWalletWorker[user.id]
    // }
    response.json({
        success: true,
        error_code: null,
        message: 'user not found'
    })

})

myApp.get('/wallet/:id', async function (request, response) {
    const user_id = request.params.id
    // console.log(user_id)
    const user = await db.user.findOne({
        where: {
            id: user_id,
        },
    })

    if (user && (user.token == null || user.token == "") && !user.is_mock) {
        user.token = await utils.getUserToken(user.ufa_account, user.type_password)
        await user.save()
    }

    if (user.is_mock) {
        io.emit(`wallet${user_id}`, { wallet: parseFloat(user.mock_wallet).toFixed(2) })
        // parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: parseFloat(user.mock_wallet).toFixed(2) } })
    }
    else if (user) {

        // const browser = await puppeteer.launch({
        //     headless: true,
        //     devtools: false,
        //     args: ['--no-sandbox', '--disable-setuid-sandbox']
        // });
        // try {
        //     const page = await browser.newPage();
        //     // page.setDefaultTimeout(timeout)
        //     page.setDefaultTimeout(10000)
        //     await page.goto('https://imba69.com/login?token=' + user.token, {
        //         waitUntil: "networkidle2"
        //     });

        //     // await page.waitForSelector('input[name="user[username]"]')
        //     // await page.type('input[name="user[username]"]', user.username);
        //     // await page.type('input[name="user[password]"]', user.type_password);

        //     // await Promise.all([
        //     //     page.click('button[type="submit"]'),
        //     //     page.waitForNavigation({ waitUntil: 'networkidle0' }),
        //     // ]);
        //     // await page.waitForSelector('.img-shield-sys')

        //     const cookiesImba = await page.cookies()
        //     // console.log(cookiesImba)
        //     let cookieHeader = ""
        //     cookiesImba.forEach((value) => {
        //         // console.log(value)
        //         cookieHeader += value.name + '=' + value.value + '; '
        //     })

        //     let walletAPI = `https://imba69.com/member/get_credit_limit?token=${user.token}`
        //     let config = {
        //         headers: {
        //             'Content-Type': 'application/x-www-form-urlencoded',
        //             'Cookie': cookieHeader
        //         }
        //     }
        //     let res1 = await axios.get(walletAPI, config)
        //     // console.log(res.data)
        //     if (res1.data.success == true) {
        //         io.emit(`wallet${user_id}`, { wallet: parseFloat(res1.data.credit).toFixed(2) })
        //         // parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: parseFloat(res.data.credit).toFixed(2) } })
        //         response.json({
        //             success: true,
        //             error_code: null,
        //             message: null
        //         })

        //     } else {
        //         io.emit(`wallet${user_id}`, { wallet: null })
        //         // parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: null } })
        //         response.json({
        //             success: false,
        //             error_code: null,
        //             message: null
        //         })
        //     }
        //     await browser.close();

        // } catch (e) {
        //     console.log(e)
        //     await browser.close();
        //     io.emit(`wallet${user_id}`, { wallet: null })
        //     response.json({
        //         success: false,
        //         error_code: null,
        //         message: null
        //     })
        // }
        var options = {
            'method': 'POST',
            'timeout': 1500,
            'url': 'https://imba69.com/users/sign_in',
            formData: {
                'user[username]': user.username,
                'user[password]': user.type_password
            }
        };
        try {
            requests(options, async function (error, res) {
                try {
                    if (error) {
                        console.log(error.code === 'ETIMEDOUT');
                        throw new Error(error);
                        // console.log(error);
                        // io.emit(`wallet${user_id}`, { wallet: null })
                        // // parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: null } })
                        // response.json({
                        //     success: false,
                        //     error_code: null,
                        //     message: null
                        // })
                    }
                    // console.log(response.headers["set-cookie"]);
                    if (res.headers['set-cookie'] == undefined) {
                        // io.emit(`wallet${user_id}`, { wallet: null })
                        // // parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: null } })
                        // response.json({
                        //     success: false,
                        //     error_code: null,
                        //     message: null
                        // })
                        throw new Error('res.headers["set-cookie"] undefined');
                    }
                    var data = new FormData();
                    data.append('user[username]', user.username);
                    data.append('user[password]', user.type_password);

                    // var config = {
                    //     method: 'post',
                    //     url: 'https://imba69.com/users/sign_in',
                    //     headers: {
                    //         'Cookie': res.headers["set-cookie"].join(),
                    //         ...data.getHeaders()
                    //     },
                    //     data: data
                    // };

                    // axios(config)
                    //     .then(async function (res) {
                    // console.log(response.headers['set-cookie']);
                    let walletAPI = `https://imba69.com/member/get_credit_limit?token=${user.token}`
                    let config = {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Cookie': res.headers['set-cookie'].join()
                        }
                    }
                    let res1 = await axios.get(walletAPI, config)
                    // console.log(res.data)
                    if (res1.data.success == true) {
                        io.emit(`wallet${user_id}`, { wallet: parseFloat(res1.data.credit).toFixed(2) })
                        // parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: parseFloat(res.data.credit).toFixed(2) } })
                        response.json({
                            success: true,
                            error_code: null,
                            message: null
                        })

                    } else {
                        io.emit(`wallet${user_id}`, { wallet: null })
                        // parentPort.postMessage({ action: 'credit', data: { userId: userData.id, wallet: null } })
                        response.json({
                            success: false,
                            error_code: null,
                            message: null
                        })
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
                    console.log(e)
                    io.emit(`wallet${user_id}`, { wallet: null })
                    response.json({
                        success: false,
                        error_code: null,
                        message: null
                    })
                }
            });
        } catch (e) {
            // console.log(e)
            io.emit(`wallet${user_id}`, { wallet: null })
            response.json({
                success: false,
                error_code: null,
                message: null
            })
        }

    } else {
        io.emit(`wallet${user_id}`, { wallet: null })
        response.json({
            success: false,
            error_code: 404,
            message: 'user not found'
        })
    }

});


myApp.get('/history/:id', async function (request, response) {
    const user_id = request.params.id
    db.user.findOne({
        where: {
            id: user_id,
        },
    }).then((user) => {
        if (user && !user.is_mock) {
            db.bot.findOne({
                where: {
                    status: {
                        [Op.ne]: 3

                    },
                    userId: user.id
                }

            }).then((res2) => {
                if (res2 && (botWorkerDict.hasOwnProperty(user.id) && botWorkerDict[user.id] != undefined)) {
                    botWorkerDict[user.id].postMessage({ action: 'get_history' })
                    response.json({
                        success: true,
                        error_code: null,
                        data: {
                            history: []
                        }
                    })
                } else if (res2 && res2.bot_type == 2 && ((rotBotWorkerDict.hasOwnProperty(user.id) && rotBotWorkerDict[user.id] != undefined) ||
                    (rotBotWorkerDict.hasOwnProperty(user.id) && rotBotWorkerDict[user.id] != undefined))) {
                    // console.log('get rot bot info')
                    rotBotWorkerDict[user.id].postMessage({ action: 'get_history' })
                    response.json({
                        success: true,
                        error_code: null,
                        data: {
                            history: []
                        }
                    })
                }
                else if (res2 && (dtBotWorkerDict.hasOwnProperty(user.id) && dtBotWorkerDict[user.id] != undefined)) {
                    dtBotWorkerDict[user.id].postMessage({ action: 'get_history' })
                    response.json({
                        success: true,
                        error_code: null,
                        data: {
                            history: []
                        }
                    })
                } else {
                    response.json({
                        success: false,
                        error_code: 404,
                        message: 'bot or user not found'
                    })
                }

            })
        } else {
            response.json({
                success: false,
                error_code: 404,
                message: 'bot or user not found'
            })
        }

    });

});



myApp.get('/member', async function (request, response) {
    const member = await db.member.findAll()
    response.json({
        success: true,
        data: member,
        error_code: null,
        message: ''
    })
});

myApp.get('/agent_record', async function (request, response) {
    const agent_record = await db.agent_record.findAll()
    response.json({
        success: true,
        data: member,
        error_code: null,
        message: ''
    })
});

myApp.get('/member_record', async function (request, response) {
    const member_record = await db.member_record.findAll()
    response.json({
        success: true,
        data: member,
        error_code: null,
        message: ''
    })
});

http.listen(80, function () {
    console.log('listening *.80');
});

// main attributes
let lst; // list will be populated from 0 to n
let index = -1; // index will be used to traverse list
let myWorker; // worker reference
let interval;
let rotInterval;
let dtInterval;
let tables = [];
let workerDict = {};
let isPlay = false;
let dtIsPlay = false;
let isPlayRot = {
    RB: false,
    SB: false,
    ED: false,
    ZONE: false
}
let playTable;
let currentList = [];
let rotCurrentList = [];
let dtCurrentList = [];
let botList = {}
var startBet;
var rotStartBet;
var dtStartBet;
var remainingBet;
var rotRemainingBet;
var dtRemainingBet;
var betInt;
var dtBetInt;
var rotBetInt = {};
var currentBetData;
var rotCurrentBetData = {};
var dtCurrentBetData;
var latestBotTransactionId;
let wPercent = 0
var userIdToWalletWorker = {};

mainBody();

// function createWalletWorker(user) {
//     let cb = (err, result) => {
//         if (err) {
//             return console.error(err);
//         }

//         if (result.action == 'credit') {
//             // console.log('bot info')
//             io.emit(`wallet${result.data.userId}`, {wallet: result.data.wallet})
//         }

//     };

//     let w = new Worker(__dirname + '/walletWorker.js', {
//         workerData: {
//             user:{
//                 id: user.id,
//                 username: user.ufa_account,
//                 password: user.type_password,
//                 token: user.token,
//                 is_mock: user.is_mock}

//         }
//     });

//     // registering events in main thread to perform actions after receiving data/error/exit events
//     w.on('message', (msg) => {
//         // data will be passed into callback
//         cb(null, msg);
//     });

//     userIdToWalletWorker[user.id] = w
//     // console.log(botWorkerDict)

//     // for error handling
//     w.on('error', cb);

//     // for exit
//     w.on('exit', (code) => {
//         // console.log(botWorkerDict)
//         if (code !== 0) {
//             console.error(new Error(`Worker stopped Code ${code}`))
//         }
//     });
// }

function createBotWorker(obj, playData, is_mock) {
    let cb = (err, result) => {
        if (err) {
            return console.error(err);
        }
        if (result.action == 'bet_success') {
            result.win_percent = win_percent
            io.emit(`user${result.data.current.botObj.userId}`, result)
            console.log(`bac bot ${result.data.current.botObj.userId} bet success`)
        }
        if (result.action == 'bet_failed') {
            console.log(`bac bot ${result.botObj.userId} bet failed`)
        }
        if (result.action == 'restart_result') {
            io.emit(`user${result.userId}`, result)
        }

        if (result.action == 'info') {
            // console.log('bot info')
            io.emit(`user${result.userId}`, { ...result, isPlay: isBet, win_percent: win_percent, currentBetData: currentBetData })
        }

        if (result.action == 'connection_status') {
            io.emit(`connection_status_${result.data.id}`, result.data)
        }

        if (result.action == 'history') {
            io.emit(`history_${result.data.id}`, result.data)
        }
        // if (result.action == 'stop') {

        //     db.bot.findOne({
        //         where: {
        //             id: result.botObj.id
        //         }
        //     }).then((res) => {
        //         res.status = 3
        //         res.save()
        //         if(botWorkerDict.hasOwnProperty(res.userId) && botWorkerDict[res.userId]){
        //             botWorkerDict[res.userId].terminate()
        //             delete botWorkerDict[res.userId]
        //         }

        //     })
        //     console.log(`bot ${result.user_id} stop`)
        //     if(botWorkerDict.hasOwnProperty(res.userId) && botWorkerDict[res.userId]){
        //         botWorkerDict[res.userId].terminate()
        //         delete botWorkerDict[res.userId]
        //     }
        // }

        if (result.action == 'process_result') {
            // console.log(result.action)
            // console.log(result.wallet.myWallet.MAIN_WALLET.chips.cre)
            let userWallet = result.wallet
            let winner_result = result.botTransaction.win_result
            if (result.botTransaction.win_result != 'TIE' &&
                result.bet.toLowerCase() != result.botTransaction.bet.toLowerCase()) {
                if (result.botTransaction.win_result == 'WIN') {
                    winner_result = 'LOSE'
                } else if (result.botTransaction.win_result == 'LOSE') {
                    winner_result = 'WIN'
                }
            }
            console.log('process result bac')
            let userTransactionData = {
                value: result.betVal,
                user_bet: result.bet,
                wallet: result.wallet,
                botId: result.botObj.id,
                result: winner_result,
                botTransactionId: result.botTransactionId
            }


            let current_profit_threshold = parseFloat(result.botObj.init_wallet) + Math.floor((((result.botObj.profit_threshold - result.botObj.init_wallet) * 94) / 100))
            // console.log(userTransactionData)
            let indexIsStop = result.isStop || (result.botObj.is_infinite == false
                && userWallet >= current_profit_threshold)
            // || (userWallet - result.botObj.profit_wallet <= result.botObj.loss_threshold)
            // console.log(`isStop ${result.isStop}`)

            db.userTransaction.create(userTransactionData)
            io.emit(`user${result.botObj.userId}`, {
                action: "bet_result",
                wallet: result.wallet,
                playData: result.playData,
                status: result.status,
                isStop: indexIsStop,
                value: result.betVal,
                botId: result.botObj.id,
                botTransactionId: result.botTransactionId,
                botTransaction: result.botTransaction,
                botObj: result.botObj
            })
            console.log(result.isStop, indexIsStop,
                userWallet,
                typeof parseFloat(result.botObj.init_wallet), typeof Math.floor((((result.botObj.profit_threshold - result.botObj.init_wallet) * 94) / 100)),
                current_profit_threshold,
                userWallet - result.botObj.profit_wallet,
                result.botObj.loss_threshold)

            if (indexIsStop) {
                console.log(indexIsStop)
                db.bot.findOne({
                    where: {
                        id: result.botObj.id
                    }
                }).then(async (res) => {
                    res.status = 3
                    res.stop_wallet = result.wallet
                    res.turnover = result.turnover
                    res.stop_by = (result.botObj.is_infinite == false && Math.floor(((result.botObj.profit_threshold * 94) / 100)) >= userWallet) ? 2 : result.isStop ? 1 : 4
                    // userWallet - result.botObj.profit_wallet <= result.botObj.loss_threshold ? 3 : 
                    await res.save()
                    if (botWorkerDict.hasOwnProperty(res.userId) && botWorkerDict[res.userId] != undefined) {
                        botWorkerDict[res.userId].terminate()
                        delete botWorkerDict[res.userId]
                    } else {
                        delete botWorkerDict[res.userId]
                    }

                })
            }

            if (result.is_mock) {
                let paid = result.betVal
                if (winner_result == "WIN") {
                    if (result.bet == 'BANKER') {
                        paid += result.betVal * 0.95
                    } else {
                        paid += result.betVal
                    }

                } else if (winner_result == "LOSE") {
                    paid = 0
                }
                var zerofilled = ('000' + result.botTransaction.round).slice(-3);

                let mock_transaction = {
                    game_info: `${result.botTransaction.table_title} / ${result.botTransaction.shoe}-${zerofilled}`,
                    user_id: result.botObj.userId,
                    bet: result.bet,
                    bet_credit_chip_amount: result.betVal,
                    sum_paid_credit_amount: paid,
                    bet_time: result.bet_time
                }

                db.mockUserTransaction.create(mock_transaction)
            }
        }
    };

    let w = new Worker(__dirname + '/botWorker.js', {
        workerData: {
            obj: obj,
            playData: playData,
            is_mock: is_mock
        }
    });

    // registering events in main thread to perform actions after receiving data/error/exit events
    w.on('message', (msg) => {
        // data will be passed into callback
        cb(null, msg);
    });
    botWorkerDict[obj.userId] = w
    // console.log(botWorkerDict)

    // for error handling
    w.on('error', cb);

    // for exit
    w.on('exit', (code) => {
        // console.log(botWorkerDict)
        if (code !== 0) {
            console.error(new Error(`Worker stopped Code ${code}`))
        } else {
            w.terminate()
        }
    });
}

function createRotBotWorker(obj, playData, is_mock) {
    let cb = (err, result) => {
        if (err) {
            return console.error(err);
        }
        if (result.action == 'bet_success') {
            // result.win_percent = win_percent
            io.emit(`user${result.data.current.botObj.userId}`, result)
            console.log(`rot bot ${result.data.current.botObj.userId} bet success`)
        }
        if (result.action == 'bet_failed') {
            console.log(`rot bot ${result.botObj.userId} bet failed`)
        }
        // if (result.action == 'restart_result') {
        //     io.emit(`user${result.userId}`, result)
        // }
        if (result.action == 'connection_status') {
            // console.log('bot info')
            // console.log('bot connection status', { ...result.data })
            io.emit(`connection_status_${result.data.id}`, result.data)
        }

        if (result.action == 'history') {
            // console.log('get history', result.data)
            io.emit(`history_${result.data.id}`, result.data)
        }

        if (result.action == 'info') {
            // console.log('bot info')
            io.emit(`user${result.userId}`, { ...result, isPlay: isPlayRot, currentBetData: rotCurrentBetData })
        }
        // if (result.action == 'stop') {

        //     db.bot.findOne({
        //         where: {
        //             id: result.botObj.id
        //         }
        //     }).then((res) => {
        //         res.status = 3
        //         res.save()
        //         if(botWorkerDict.hasOwnProperty(res.userId) && botWorkerDict[res.userId]){
        //             botWorkerDict[res.userId].terminate()
        //             delete botWorkerDict[res.userId]
        //         }

        //     })
        //     console.log(`bot ${result.user_id} stop`)
        //     if(botWorkerDict.hasOwnProperty(res.userId) && botWorkerDict[res.userId]){
        //         botWorkerDict[res.userId].terminate()
        //         delete botWorkerDict[res.userId]
        //     }
        // }
        if (result.action == 'process_result') {
            // console.log(result.action)
            // console.log(result.wallet.myWallet.MAIN_WALLET.chips.cre)
            let userWallet = result.wallet
            let winner_result = result.botTransaction.win_result
            // console.log(result.bet, result.botTransaction.bet, result.bet != result.botTransaction.bet, 
            //                 result.botTransaction.win_result, result.is_opposite)
            if (result.botObj.bet_side != 14) {
                if (result.botTransaction.win_result != 'TIE' && result.bet != result.botTransaction.bet) {
                    if (result.botTransaction.win_result == 'WIN') {
                        winner_result = 'LOSE'
                    } else if (result.botTransaction.win_result == 'LOSE') {
                        winner_result = 'WIN'
                    }
                }
            }

            let userTransactionData = {
                value: result.betVal,
                user_bet:
                    result.botObj.bet_side == 14 ||
                        (result.botObj.bet_side == 15 && result.is_opposite) ? JSON.stringify(result.bet) : result.bet,
                wallet: result.wallet,
                botId: result.botObj.id,
                result: winner_result,
                botTransactionId: result.botTransactionId
            }

            // console.log(userTransactionData)
            // console.log(userWallet, result.botObj.init_wallet, Math.floor((((result.botObj.profit_threshold - result.botObj.init_wallet) * 94) / 100)))
            let indexIsStop = result.isStop || (result.botObj.is_infinite == false
                && userWallet >= result.botObj.init_wallet + Math.floor((((result.botObj.profit_threshold - result.botObj.init_wallet) * 94) / 100)))
            // || (userWallet - result.botObj.profit_wallet <= result.botObj.loss_threshold)
            // console.log(`isStop ${indexIsStop}`)

            db.userTransaction.create(userTransactionData)
            io.emit(`user${result.botObj.userId}`, {
                action: "bet_result",
                wallet: result.wallet,
                playData: result.playData,
                status: result.status,
                isStop: indexIsStop,
                value: result.betVal,
                wallet: result.wallet,
                botId: result.botObj.id,
                botTransactionId: result.botTransactionId,
                botTransaction: result.botTransaction,
                botObj: result.botObj
            })

            // console.log(indexIsStop,
            //     result.botObj.is_infinite, userWallet,
            //     result.botObj.init_wallet, Math.floor((((result.botObj.profit_threshold - result.botObj.init_wallet) * 94) / 100)),
            //     userWallet - result.botObj.profit_wallet,
            //     result.botObj.loss_threshold)

            if (indexIsStop) {
                db.bot.findOne({
                    where: {
                        id: result.botObj.id
                    }
                }).then(async (res) => {
                    res.status = 3
                    res.stop_wallet = result.wallet
                    res.turnover = result.turnover
                    res.stop_by = (result.botObj.is_infinite == false && Math.floor(((result.botObj.profit_threshold * 94) / 100)) >= userWallet) ? 2 : result.isStop ? 1 : 4
                    // userWallet - result.botObj.profit_wallet <= result.botObj.loss_threshold ? 3 : 
                    await res.save()
                    if (rotBotWorkerDict.hasOwnProperty(res.userId) && rotBotWorkerDict[res.userId] != undefined) {
                        rotBotWorkerDict[res.userId].terminate()
                        delete rotBotWorkerDict[res.userId]
                    } else {
                        delete rotBotWorkerDict[res.userId]
                    }

                })
            }

            console.log('process result rot is_mock', is_mock)
            if (result.is_mock) {
                let paid = result.betVal
                if (winner_result == "WIN") {
                    paid += result.betVal
                } else if (winner_result == "LOSE") {
                    paid = 0
                }
                var zerofilled = ('000' + result.botTransaction.round).slice(-3);
                console.log(`process result rot mock data`, result.bet, typeof result.bet)
                let mock_transaction = {
                    game_info: `${result.botTransaction.table_title} / ${result.botTransaction.shoe}-${zerofilled}`,
                    user_id: result.botObj.userId,
                    bet: result.botObj.bet_side == 14 ||
                        (result.botObj.bet_side == 15 && result.is_opposite) ? JSON.stringify(result.bet) : result.bet,
                    bet_credit_chip_amount: result.betVal,
                    sum_paid_credit_amount: paid,
                    bet_time: result.bet_time
                }

                db.mockUserTransaction.create(mock_transaction)
            }
        }
    };

    let w = new Worker(__dirname + '/rotBotWorker.js', {
        workerData: {
            obj: obj,
            playData: playData,
            is_mock: is_mock
        }
    });

    // registering events in main thread to perform actions after receiving data/error/exit events
    w.on('message', (msg) => {
        // data will be passed into callback
        cb(null, msg);
    });
    rotBotWorkerDict[obj.userId] = w
    // console.log(botWorkerDict)

    // for error handling
    w.on('error', cb);

    // for exit
    w.on('exit', (code) => {
        // console.log(botWorkerDict)
        if (code !== 0) {
            console.error(new Error(`Worker stopped Code ${code}`))
        } else {
            w.terminate()
        }
    });
}

function createDtWorker(obj, playData, is_mock) {
    let cb = (err, result) => {
        if (err) {
            return console.error(err);
        }
        if (result.action == 'bet_success') {
            result.win_percent = win_percent
            io.emit(`user${result.data.current.botObj.userId}`, result)
            console.log(`dt bot ${result.data.current.botObj.userId} bet success`)
        }
        if (result.action == 'bet_failed') {
            console.log(`dt bot ${result.botObj.userId} bet failed`)
        }
        if (result.action == 'restart_result') {
            io.emit(`user${result.userId}`, result)
        }

        if (result.action == 'info') {
            // console.log('bot info')
            io.emit(`user${result.userId}`, { ...result, isPlay: dtIsBet, win_percent: win_percent, currentBetData: currentBetData })
        }

        if (result.action == 'connection_status') {
            // console.log('bot info')
            // console.log('bot connection status', { ...result.data })
            io.emit(`connection_status_${result.data.id}`, result.data)
        }

        if (result.action == 'history') {
            io.emit(`history_${result.data.id}`, result.data)
        }
        // if (result.action == 'stop') {

        //     db.bot.findOne({
        //         where: {
        //             id: result.botObj.id
        //         }
        //     }).then((res) => {
        //         res.status = 3
        //         res.save()
        //         if(botWorkerDict.hasOwnProperty(res.userId) && botWorkerDict[res.userId]){
        //             botWorkerDict[res.userId].terminate()
        //             delete botWorkerDict[res.userId]
        //         }

        //     })
        //     console.log(`bot ${result.user_id} stop`)
        //     if(botWorkerDict.hasOwnProperty(res.userId) && botWorkerDict[res.userId]){
        //         botWorkerDict[res.userId].terminate()
        //         delete botWorkerDict[res.userId]
        //     }
        // }
        if (result.action == 'process_result') {
            // console.log(result.action)
            // console.log(result.wallet.myWallet.MAIN_WALLET.chips.cre)
            let userWallet = result.wallet
            let winner_result = result.botTransaction.win_result

            if (result.botTransaction.win_result != 'TIE' &&
                result.bet.toLowerCase() != result.botTransaction.bet.toLowerCase()) {
                if (result.botTransaction.win_result == 'WIN') {
                    winner_result = 'LOSE'
                } else if (result.botTransaction.win_result == 'LOSE') {
                    winner_result = 'WIN'
                }
            }

            let userTransactionData = {
                value: result.betVal,
                user_bet: result.bet,
                wallet: result.wallet,
                botId: result.botObj.id,
                result: winner_result,
                botTransactionId: result.botTransactionId
            }

            // console.log(userTransactionData)
            let current_profit_threshold = parseFloat(result.botObj.init_wallet) + Math.floor((((result.botObj.profit_threshold - result.botObj.init_wallet) * 94) / 100))
            let indexIsStop = result.isStop || (result.botObj.is_infinite == false
                && userWallet >= current_profit_threshold)
            // || (userWallet - result.botObj.profit_wallet <= result.botObj.loss_threshold)
            // console.log(`isStop ${result.isStop}`)

            db.userTransaction.create(userTransactionData)
            io.emit(`user${result.botObj.userId}`, {
                action: "bet_result",
                wallet: result.wallet,
                playData: result.playData,
                status: result.status,
                isStop: indexIsStop,
                value: result.betVal,
                botId: result.botObj.id,
                botTransactionId: result.botTransactionId,
                botTransaction: result.botTransaction,
                botObj: result.botObj
            })

            // console.log(indexIsStop,
            //     result.botObj.is_infinite, userWallet,
            //     result.botObj.init_wallet, Math.floor((((result.botObj.profit_threshold - result.botObj.init_wallet) * 94) / 100)),
            //     userWallet - result.botObj.profit_wallet,
            //     result.botObj.loss_threshold)

            if (indexIsStop) {
                db.bot.findOne({
                    where: {
                        id: result.botObj.id
                    }
                }).then(async (res) => {
                    res.status = 3
                    res.stop_wallet = result.wallet
                    res.turnover = result.turnover
                    res.stop_by = (result.botObj.is_infinite == false && Math.floor(((result.botObj.profit_threshold * 94) / 100)) >= userWallet) ? 2 : result.isStop ? 1 : 4
                    // userWallet - result.botObj.profit_wallet <= result.botObj.loss_threshold ? 3 : 
                    await res.save()
                    if (dtBotWorkerDict.hasOwnProperty(res.userId) && dtBotWorkerDict[res.userId] != undefined) {
                        dtBotWorkerDict[res.userId].terminate()
                        delete dtBotWorkerDict[res.userId]
                    } else {
                        delete dtBotWorkerDict[res.userId]
                    }

                })
            }

            if (result.is_mock) {
                let paid = result.betVal
                if (winner_result == 'WIN') {
                    paid += result.betVal
                } else if (winner_result == 'LOSE') {
                    paid = 0
                } else if (winner_result == 'TIE') {
                    paid = result.betVal / 2
                }
                var zerofilled = ('000' + result.botTransaction.round).slice(-3);

                let mock_transaction = {
                    game_info: `${result.botTransaction.table_title} / ${result.botTransaction.shoe}-${zerofilled}`,
                    user_id: result.botObj.userId,
                    bet: result.bet,
                    bet_credit_chip_amount: result.betVal,
                    sum_paid_credit_amount: paid,
                    bet_time: result.bet_time
                }

                db.mockUserTransaction.create(mock_transaction)
            }
        }
    };

    let w = new Worker(__dirname + '/dtUserBot.js', {
        workerData: {
            obj: obj,
            playData: playData,
            is_mock: is_mock
        }
    });

    // registering events in main thread to perform actions after receiving data/error/exit events
    w.on('message', (msg) => {
        // data will be passed into callback
        cb(null, msg);
    });
    dtBotWorkerDict[obj.userId] = w
    // console.log(botWorkerDict)

    // for error handling
    w.on('error', cb);

    // for exit
    w.on('exit', (code) => {
        // console.log(botWorkerDict)
        if (code !== 0) {
            console.error(new Error(`Worker stopped Code ${code}`))
        } else {
            w.terminate()
        }
    });
}


function compare(a, b) {
    // console.log(compare)
    if (a.winner_percent < b.winner_percent) {
        return 1;
    }

    if (a.winner_percent >= b.winner_percent) {
        return -1;
    }

    return 0;
}

function compareRB(a, b) {
    // console.log(compare)
    if (a.winner_percent.RB < b.winner_percent.RB) {
        return 1;
    }

    if (a.winner_percent.RB >= b.winner_percent.RB) {
        return -1;
    }

    return 0;
}

function compareED(a, b) {
    // console.log(compare)
    if (a.winner_percent.ED < b.winner_percent.ED) {
        return 1;
    }

    if (a.winner_percent.ED >= b.winner_percent.ED) {
        return -1;
    }

    return 0;
}

function compareSB(a, b) {
    // console.log(compare)
    if (a.winner_percent.SB < b.winner_percent.SB) {
        return 1;
    }

    if (a.winner_percent.SB >= b.winner_percent.SB) {
        return -1;
    }

    return 0;
}

function compareZONE(a, b) {
    // console.log(compare)
    if (a.winner_percent.TWOZONE < b.winner_percent.TWOZONE) {
        return 1;
    }

    if (a.winner_percent.TWOZONE >= b.winner_percent.TWOZONE) {
        return -1;
    }

    return 0;
}

async function mainBody() {
    console.log("Main Thread Started");
    // let response = await axios.get('https://truthbet.com/api/m/games', {
    //     headers: {
    //         Authorization: `Bearer ${token}`
    //     }
    // })

    initiateWorker(1);
    initiateWorker(2);
    initiateWorker(3);
    initiateWorker(4);
    initiateWorker(5);
    initiateWorker(6);
    initiateDtWorker(31)
    initiateDtWorker(32)
    initiateRotWorker(71)

    // console.log(response.data);
    // tables = response.data.tables
    // for (let table of tables) {
    //     if (table.game.id == 1) {

    //         initiateWorker(table);
    //     }
    // else if (table.game_id == 10) {
    //     initiateRotWorker(table)
    // }
    // else if (table.game_id == 6) {
    //     // console.log(table.id)
    //     initiateDtWorker(table)
    // }
    // }

    interval = setInterval(function () {
        playBaccarat();
    }, 6000);

    dtInterval = setInterval(function () {
        playDragonTiger();
    }, 4500);

    // rotInterval = setInterval(function () {
    //     playRot();
    // }, 6000);

    // filling array with 100 items

}

function playCasinoRandom() {
    if (isPlay == true) return;
}

function betInterval() {
    let n = new Date().getTime()
    // console.log('bac', n, n - startBet, (remainingBet - 2) * 1000)
    if (n - startBet > (remainingBet - 2) * 1000) {
        clearInterval(betInt)
        if (Object.keys(botWorkerDict).length > 0) {
            Object.keys(botWorkerDict).forEach(function (key) {
                var val = botWorkerDict[key];
                // console.log(key, val)
                val.postMessage({
                    action: 'check_reconnect'
                })
            });
        }
    } else {
        // console.log('betting')
        if (Object.keys(botWorkerDict).length > 0) {
            Object.keys(botWorkerDict).forEach(function (key) {
                var val = botWorkerDict[key];
                // console.log(key, val)
                val.postMessage({
                    action: 'bet',
                    data: currentBetData
                })
            });
        }
    }
}

function dtBetInterval() {
    let n = new Date().getTime()
    // console.log('dragon tiger', n, n - dtStartBet, (dtRemainingBet - 2) * 1000)

    if (n - dtStartBet > (dtRemainingBet - 2) * 1000) {
        clearInterval(dtBetInt)
        if (Object.keys(dtBotWorkerDict).length > 0) {
            Object.keys(dtBotWorkerDict).forEach(function (key) {
                var val = dtBotWorkerDict[key];
                // console.log(key, val)
                val.postMessage({
                    action: 'check_reconnect'
                })
            });
        }
    } else {
        // console.log('betting')
        // console.log(dtBotWorkerDict)

        if (Object.keys(dtBotWorkerDict).length > 0) {
            Object.keys(dtBotWorkerDict).forEach(function (key) {
                var val = dtBotWorkerDict[key];
                // console.log(key, val)
                val.postMessage({
                    action: 'bet',
                    data: dtCurrentBetData
                })
            });
        }
    }
}

function rotBetInterval(start, data, tableId) {
    // console.log(`rotBetInterval ${tableId}`)
    // console.log(startBet)
    // console.log(data)
    let n = new Date().getTime()
    // console.log('rot', tableId, n, n - start, (data.remaining - 2) * 1000)
    // console.log(rotBetInt, tableId)
    if (n - start > (data.remaining - 2) * 1000) {
        // console.log('clearInterval ', rotBetInt[tableId])
        clearInterval(rotBetInt[tableId])
        if (Object.keys(rotBotWorkerDict).length > 0) {
            Object.keys(rotBotWorkerDict).forEach(function (key) {
                var val = rotBotWorkerDict[key];
                // console.log(key, val)
                val.postMessage({
                    action: 'check_reconnect'
                })
            });

        }
    } else {
        // console.log('betting')
        if (Object.keys(rotBotWorkerDict).length > 0) {
            Object.keys(rotBotWorkerDict).forEach(function (key) {
                var val = rotBotWorkerDict[key];
                // console.log(key, val)
                val.postMessage({
                    action: 'bet',
                    data: data
                })
            });

        }
    }
}


function playBaccarat() {
    // console.log(Object.keys(botWorkerDict))
    // console.log(`play ${currentList.length} ${Object.keys(workerDict).length}`)
    if (isPlay == true) return;
    if (isPlay == false && currentList.length == 0) {
        Object.keys(workerDict).forEach(function (key) {
            var val = workerDict[key];
            // console.log(key, val)
            val.worker.postMessage({
                'action': 'getCurrent'
            })
        });
        return
    }

    if (isPlay == false && currentList.length < Object.keys(workerDict).length - 2) return;

    currentList.sort(compare)
    let found = true
    for (current of currentList) {
        // console.log(`table: ${current.table_id} percent: ${current.winner_percent} bot: ${current.bot}`)
        // console.log(current.winner_percent != 0, current.remaining >= 10, current.bot != null)
        if (current.winner_percent != 0 && current.bot != null) {
            if (current.winner_percent < 50) {
                win_percent = 100 - current.winner_percent
            } else {
                win_percent = current.winner_percent
            }

            if (win_percent == 100) {
                win_percent = 92
            }
            console.log(`table: ${current.table_id} percent: ${current.winner_percent} bot: ${current.bot}`)
            // console.log(`table: ${current.table_id} percent: ${win_percent} bot: ${current.bot}`)
            isPlay = true
            // console.log('post play')
            workerDict[current.table_id].worker.postMessage({
                action: 'play',
            })

            // io.emit('bot_play', {
            //     current
            // });
            break;
        }
    }
    if (isPlay == false) {
        currentList = []
    }
}

function playDragonTiger() {
    // console.log(Object.keys(botWorkerDict))
    // console.log(`play ${dtIsPlay} ${dtCurrentList.length} ${Object.keys(dtWorkerDict).length}`)
    if (dtIsPlay == true) return;
    if (dtIsPlay == false && dtCurrentList.length == 0) {
        Object.keys(dtWorkerDict).forEach(function (key) {
            var val = dtWorkerDict[key];
            // console.log(key, val)
            val.worker.postMessage({
                'action': 'getCurrent'
            })
        });
        return
    }

    if (dtIsPlay == false && dtCurrentList.length < Object.keys(dtWorkerDict).length - 1) return;

    dtCurrentList.sort(compare)
    let found = true
    // console.log(dtCurrentList)
    for (current of dtCurrentList) {
        if (current.winner_percent != 0 && current.bot != null) {
            if (current.winner_percent < 50) {
                win_percent = 100 - current.winner_percent
            } else {
                win_percent = current.winner_percent
            }

            if (win_percent == 100) {
                win_percent = 92
            }
            console.log(`table: ${current.table_id} percent: ${current.winner_percent} bot: ${current.bot}`)
            // console.log(`table: ${current.table_id} percent: ${win_percent} bot: ${current.bot}`)
            // console.log(dtWorkerDict[current.table_id])
            dtIsPlay = true
            // console.log('post play')
            dtWorkerDict[current.table_id].worker.postMessage({
                action: 'play',
            })

            // io.emit('bot_play', {
            //     current
            // });
            break;
        }
    }
    if (dtIsPlay == false) {
        dtCurrentList = []
    }
}


var isFullCurrent = true
var countNotFullCurrent = 0
// function playRot() {
//     // console.log(Object.keys(botWorkerDict))
//     let hasNotPlay = !isPlayRot.RB || !isPlayRot.ED || !isPlayRot.SB || !isPlayRot.ZONE
//     let isAllPlay = isPlayRot.RB && isPlayRot.ED && isPlayRot.SB && isPlayRot.ZONE
//     // console.log(isPlayRot)
//     // console.log(isPlayRot)
//     if (isAllPlay) return;
//     if (hasNotPlay) {
//         Object.keys(rotWorkerDict).forEach(function (key) {
//             var val = rotWorkerDict[key];
//             // console.log(key, val)
//             val.worker.postMessage({
//                 'action': 'getCurrent'
//             })
//         });
//         // return
//     }

//     // console.log(countNotFullCurrent)
//     if (countNotFullCurrent > 15) {
//         // console.log('countNotFullCurrent full')
//         isFullCurrent = false
//         countNotFullCurrent = 0
//     }
//     // console.log(hasNotPlay, rotCurrentList.length, Math.floor(Math.random() * Object.keys(rotWorkerDict).length) + 1)
//     if (isFullCurrent) {
//         if (hasNotPlay == true && rotCurrentList.length != Object.keys(rotWorkerDict).length) {
//             // rotCurrentList = []
//             // console.log(countNotFullCurrent)
//             countNotFullCurrent++;
//             return;
//         }
//     } else {
//         if (hasNotPlay == true && rotCurrentList.length == 0) {
//             // rotCurrentList = []
//             return;
//         }
//     }

//     // console.log(rotCurrentList)
//     // console.log('play')

//     if (!isPlayRot.RB) {
//         // rotCurrentList.sort(compareRB)
//         // console.log(rotCurrentList)
//         // console.log(rotCurrentList[0])
//         if (rotCurrentList[0].winner_percent.RB > 0) {
//             rotWorkerDict[rotCurrentList[0].table_id].worker.postMessage({
//                 action: 'play',
//                 type: 'RB'
//             })
//             isPlayRot.RB = true
//         }


//     }

//     if (!isPlayRot.ED) {
//         rotCurrentList.sort(compareED)
//         if (rotCurrentList[0].winner_percent.ED > 0) {
//             rotWorkerDict[rotCurrentList[0].table_id].worker.postMessage({
//                 action: 'play',
//                 type: 'ED'
//             })
//             isPlayRot.ED = true
//         }

//     }

//     if (!isPlayRot.SB) {
//         rotCurrentList.sort(compareSB)
//         if (rotCurrentList[0].winner_percent.SB > 0) {
//             rotWorkerDict[rotCurrentList[0].table_id].worker.postMessage({
//                 action: 'play',
//                 type: 'SB'
//             })
//             isPlayRot.SB = true
//         }
//     }

//     if (!isPlayRot.ZONE) {
//         rotCurrentList.sort(compareZONE)
//         if (rotCurrentList[0].winner_percent.TWOZONE > 0) {
//             rotWorkerDict[rotCurrentList[0].table_id].worker.postMessage({
//                 action: 'play',
//                 type: 'ZONE'
//             })
//             isPlayRot.ZONE = true
//         }

//     }



//     // currentList.sort(compare)
//     // let found = true
//     // for (current of currentList) {
//     //     // console.log(`table: ${current.table_id} percent: ${current.winner_percent} bot: ${current.bot}`)
//     //     // console.log(current.winner_percent != 0, current.current.remaining >= 10, current.bot != null)
//     //     if (current.winner_percent != 0 && current.bot != null) {
//     //         if (current.winner_percent < 50) {
//     //             win_percent = 100 - current.winner_percent
//     //         } else {
//     //             win_percent = current.winner_percent
//     //         }

//     //         if (win_percent == 100) {
//     //             win_percent = 92
//     //         }

//     //         console.log(`table: ${current.table_id} percent: ${win_percent} bot: ${current.bot}`)
//     //         isPlay = true
//     //         // console.log('post play')
//     //         workerDict[current.table_id].worker.postMessage({
//     //             action: 'play',
//     //         })

//     //         // io.emit('bot_play', {
//     //         //     current
//     //         // });
//     //         break;
//     //     }
//     // }
//     // if (isPlay == false) {
//     //     currentList = []
//     // }
//     isFullCurrent = true
//     rotCurrentList = []
// }

// Defining callback method for receiving data or error on worker thread
function initiateWorker(table) {

    // define callback
    let cb = async (err, result) => {
        if (err) {
            return console.error(err);
        }
        if (result.action == 'start') {
            console.log('bac start')
            io.emit(`start`, result)
        }
        if (result.action == 'point') {
            console.log('bac point')
            io.emit(`point`, result)
        }
        if (result.action == 'getCurrent') {
            // console.log(result)
            currentList.push(result)
        }
        if (result.action == 'played') {
            clearInterval(betInt)
            if (result.status == 'FAILED' || result.status == null) {
                console.log('bet failed')
                isPlay = false
                isBet = false
                currentList = []
                return
            }

            db.botTransction.findOne({
                where: {
                    bot_type: 1,
                },
                order: [
                    ['id', 'DESC']
                ]
            }).then((latest) => {
                let point = 0
                if (latest) {
                    point = latest.point
                }

                botTransactionObj['DEFAULT'] = null
                botTransactionObj[result.stats.bot] = null
                if (result.status == 'WIN') {
                    point += 1
                } else if (result.status == 'LOSE') {
                    point -= 1
                }
                botTransactionData = {
                    bot_type: result.bot_type,
                    table_id: result.table,
                    table_title: result.table,
                    shoe: result.shoe,
                    round: result.stats.round,
                    bet: result.stats.bot,
                    result: JSON.stringify(result.stats),
                    win_result: result.status,
                    user_count: 0,
                    point: point
                }

                db.botTransction.create(botTransactionData).then((created) => {
                    db.botTransction.findOne({
                        where: {
                            bot_type: 1,
                        },
                        order: [
                            ['id', 'DESC']
                        ]
                    }).then((res) => {


                        // console.log(res)
                        if (res) {

                            if (latestBotTransactionId != res.id) {
                                io.emit('all', {
                                    bot_type: 1,
                                    bet: res.bet
                                })
                                latestBotTransactionId = res.id
                            }

                            botTransactionData.id = res.id
                            // console.log(botWorkerDict)
                            if (Object.keys(botWorkerDict).length > 0) {
                                Object.keys(botWorkerDict).forEach(function (key) {
                                    var val = botWorkerDict[key];
                                    // console.log(key, val)
                                    val.postMessage({
                                        action: 'result_bet',
                                        bot_type: result.bot_type,
                                        table_id: result.table,
                                        table_title: result.table,
                                        shoe: result.shoe,
                                        round: result.stats.round,
                                        bet: result.stats.bot,
                                        result: JSON.stringify(result.stats),
                                        status: result.status,
                                        user_count: 0,
                                        botTransactionId: res.id,
                                        botTransaction: botTransactionData

                                    })
                                });
                            }
                        }
                    })
                })
            })

            isPlay = false
            isBet = false
            currentList = []
        }
        if (result.action == 'bet') {
            startBet = new Date().getTime()
            betInt = setInterval(function () {
                betInterval();
            }, 2400);

            remainingBet = result.data.remaining
            currentBetData = result.data
            isBet = true

            io.emit('bot', { action: 'play', data: result.data })
        }
        // // if worker thread is still working on list then write index and updated value
        // if (result.isInProgress) {
        //     console.log("Message from worker at Index: ", result.index, " and updated value: ", result.val);
        // }
        // // when worker thread complete process then console original list from main and updated list from worker thread
        // else {
        //     console.log("Original List Data: ", lst);
        //     console.log("Updated List From worker: ", result.val);
        // }
    };

    // start worker
    myWorker = startWorker({ table: table, username: botConfig.user[table] }, __dirname + '/workerCode.js', cb);

    if (myWorker != null) {
        workerDict[table] = {
            worker: myWorker
        }
    }

    // post a multiple factor to worker thread
    // myWorker.postMessage({ multipleFactor: table });
}

function initiateDtWorker(table) {

    // define callback
    let cb = async (err, result) => {
        if (err) {
            return console.error(err);
        }
        if (result.action == 'start') {
            console.log('dt start')
            io.emit(`start`, result)
        }
        if (result.action == 'point') {
            console.log('dt point')
            io.emit(`point`, result)
        }
        if (result.action == 'getCurrent') {
            // console.log(result)
            dtCurrentList.push(result)
        }
        if (result.action == 'played') {
            clearInterval(dtBetInt)
            if (result.status == 'FAILED' || result.status == null) {
                dtIsPlay = false
                dtIsBet = false
                dtCurrentList = []
                return
            }

            db.botTransction.findOne({
                where: {
                    bot_type: 3,
                },
                order: [
                    ['id', 'DESC']
                ]
            }).then((latest) => {
                let point = 0
                if (latest) {
                    point = latest.point
                }

                botTransactionObj['DT'] = null
                botTransactionObj[result.stats.bot] = null
                if (result.status == 'WIN') {
                    point += 1
                } else if (result.status == 'LOSE') {
                    point -= 1
                }
                let dtBotTransactionData = {
                    bot_type: result.bot_type,
                    table_id: result.table,
                    table_title: result.table,
                    shoe: result.shoe,
                    round: result.stats.round,
                    bet: result.stats.bot,
                    result: JSON.stringify(result.stats),
                    win_result: result.status,
                    user_count: 0,
                    point: point
                }

                db.botTransction.create(dtBotTransactionData).then((created) => {
                    db.botTransction.findOne({
                        where: {
                            bot_type: 3,
                        },
                        order: [
                            ['id', 'DESC']
                        ]
                    }).then((res) => {


                        // console.log(res)
                        if (res) {

                            if (latestBotTransactionId != res.id) {
                                io.emit('all', {
                                    bot_type: 3,
                                    bet: res.bet
                                })
                                latestBotTransactionId = res.id
                            }

                            dtBotTransactionData.id = res.id

                            if (Object.keys(dtBotWorkerDict).length > 0) {
                                Object.keys(dtBotWorkerDict).forEach(function (key) {
                                    var val = dtBotWorkerDict[key];
                                    val.postMessage({
                                        action: 'result_bet',
                                        bot_type: result.bot_type,
                                        table_id: result.table,
                                        table_title: result.table,
                                        shoe: result.shoe,
                                        round: result.stats.round,
                                        bet: result.stats.bot,
                                        result: JSON.stringify(result.stats),
                                        status: result.status,
                                        user_count: 0,
                                        botTransactionId: res.id,
                                        botTransaction: dtBotTransactionData

                                    })
                                });
                            }
                        }
                    })
                })
            })

            dtIsPlay = false
            dtIsBet = false
            dtCurrentList = []
        }
        if (result.action == 'bet') {
            dtStartBet = new Date().getTime()
            dtBetInt = setInterval(function () {
                dtBetInterval();
            }, 2400);

            dtRemainingBet = result.data.remaining
            dtCurrentBetData = result.data
            isBet = true

            io.emit('bot', { action: 'play', data: result.data })
        }
        // // if worker thread is still working on list then write index and updated value
        // if (result.isInProgress) {
        //     console.log("Message from worker at Index: ", result.index, " and updated value: ", result.val);
        // }
        // // when worker thread complete process then console original list from main and updated list from worker thread
        // else {
        //     console.log("Original List Data: ", lst);
        //     console.log("Updated List From worker: ", result.val);
        // }
    };

    // start worker
    myWorker = startWorker({ table: table, username: botConfig.user[table] }, __dirname + '/dtbot.js', cb);

    if (myWorker != null) {
        dtWorkerDict[table] = {
            worker: myWorker
        }
    }

    // post a multiple factor to worker thread
    // myWorker.postMessage({ multipleFactor: table });
}

function initiateRotWorker(table) {
    let cb = (err, result) => {
        if (err) {
            return console.error(err);
        }
        if (result.action == 'start') {
            console.log('rot start')
            io.emit(`start`, result)
        }
        if (result.action == 'point') {
            console.log('rot point')
            io.emit(`point`, result)
        }
        if (result.action == 'getCurrent') {
            // console.log(result.error)
            if (!result.error) {
                let pos = rotCurrentList.findIndex((item) => item.table_id == result.table_id)
                // console.log(pos, result.table_id)
                if (pos != -1) {
                    rotCurrentList[pos] = result
                } else {
                    rotCurrentList.push(result)
                }
            }

        }
        if (result.action == 'played') {
            // console.log('rot played', result)
            clearInterval(rotBetInt[result.table])
            // if (result.status == 'FAILED' || result.status == null) {
            //     if (result.playList.findIndex((item) => item == 'RB') != -1) {
            //         isPlayRot.RB = false
            //     }
            //     if (result.playList.findIndex((item) => item == 'ED') != -1) {
            //         isPlayRot.ED = false
            //     }
            //     if (result.playList.findIndex((item) => item == 'SB') != -1) {
            //         isPlayRot.SB = false
            //     }
            //     if (result.playList.findIndex((item) => item == 'ZONE') != -1) {
            //         isPlayRot.ZONE = false
            //     }

            //     // isPlay = false
            //     rotCurrentList = []
            //     return
            // }

            db.botTransction.findOne({
                where: {
                    bot_type: 21,
                },
                order: [
                    ['id', 'DESC']
                ]
            }).then((latest) => {
                let point = 0
                if (latest) {
                    point = latest.point
                }
                botTransactionObj['RB'] = null
                if (result.status.RB == 'WIN') {
                    point += 1
                } else if (result.status.RB == 'LOSE') {
                    point -= 1
                }
                let RBbotTransactionData = {
                    bot_type: 21,
                    table_id: result.table,
                    table_title: result.table,
                    shoe: result.shoe,
                    round: result.stats.round,
                    bet: result.stats.bot.RB,
                    result: JSON.stringify(result.stats),
                    win_result: result.status.RB,
                    user_count: 0,
                    point: point
                }

                db.botTransction.create(RBbotTransactionData).then((created) => {
                    db.botTransction.findOne({
                        where: {
                            bot_type: 21,
                        },
                        order: [
                            ['id', 'DESC']
                        ]
                    }).then((res) => {
                        // console.log(res)
                        if (res) {

                            if (latestBotTransactionId != res.id) {
                                io.emit('all', {
                                    bot_type: 21,
                                    bet: res.bet
                                })
                                latestBotTransactionId = res.id
                            }

                            RBbotTransactionData.id = res.id

                            if (Object.keys(rotBotWorkerDict).length > 0) {
                                Object.keys(rotBotWorkerDict).forEach(function (key) {
                                    var val = rotBotWorkerDict[key];
                                    // console.log(key, val)
                                    val.postMessage({
                                        action: 'result_bet',
                                        bot_type: result.bot_type,
                                        table_id: result.table,
                                        table_title: result.table,
                                        shoe: result.shoe,
                                        round: result.stats.round,
                                        bet: result.stats.bot.RB,
                                        result: JSON.stringify(result.stats),
                                        status: result.status.RB,
                                        user_count: 0,
                                        botTransactionId: res.id,
                                        botTransaction: RBbotTransactionData

                                    })
                                });
                            }
                        }
                    })
                })
            })

            db.botTransction.findOne({
                where: {
                    bot_type: 22,
                },
                order: [
                    ['id', 'DESC']
                ]
            }).then((latest) => {
                let point = 0
                if (latest) {
                    point = latest.point
                }
                botTransactionObj['EO'] = null
                if (result.status.EO == 'WIN') {
                    point += 1
                } else if (result.status.EO == 'LOSE') {
                    point -= 1
                }
                let EDbotTransactionData = {
                    bot_type: 22,
                    table_id: result.table,
                    table_title: result.table,
                    shoe: result.shoe,
                    round: result.stats.round,
                    bet: result.stats.bot.EO,
                    result: JSON.stringify(result.stats),
                    win_result: result.status.EO,
                    user_count: 0,
                    point: point
                }

                db.botTransction.create(EDbotTransactionData).then((created) => {
                    db.botTransction.findOne({
                        where: {
                            bot_type: 22,
                        },
                        order: [
                            ['id', 'DESC']
                        ]
                    }).then((res) => {
                        // console.log(res)
                        if (res) {

                            if (latestBotTransactionId != res.id) {
                                io.emit('all', {
                                    bot_type: 22,
                                    bet: res.bet
                                })
                                latestBotTransactionId = res.id
                            }

                            EDbotTransactionData.id = res.id

                            if (Object.keys(rotBotWorkerDict).length > 0) {
                                Object.keys(rotBotWorkerDict).forEach(function (key) {
                                    var val = rotBotWorkerDict[key];
                                    // console.log(key, val)
                                    val.postMessage({
                                        action: 'result_bet',
                                        bot_type: result.bot_type,
                                        table_id: result.table,
                                        table_title: result.table,
                                        shoe: result.shoe,
                                        round: result.stats.round,
                                        bet: result.stats.bot.EO,
                                        result: JSON.stringify(result.stats),
                                        status: result.status.EO,
                                        user_count: 0,
                                        botTransactionId: res.id,
                                        botTransaction: EDbotTransactionData

                                    })
                                });
                            }
                        }
                    })
                })
            })
            // isPlayRot.ED = false

            db.botTransction.findOne({
                where: {
                    bot_type: 23,
                },
                order: [
                    ['id', 'DESC']
                ]
            }).then((latest) => {
                let point = 0
                if (latest) {
                    point = latest.point
                }
                botTransactionObj['SB'] = null
                if (result.status.SB == 'WIN') {
                    point += 1
                } else if (result.status.SB == 'LOSE') {
                    point -= 1
                }
                let SBbotTransactionData = {
                    bot_type: 23,
                    table_id: result.table,
                    table_title: result.table,
                    shoe: result.shoe,
                    round: result.stats.round,
                    bet: result.stats.bot.SB,
                    result: JSON.stringify(result.stats),
                    win_result: result.status.SB,
                    user_count: 0,
                    point: point
                }

                db.botTransction.create(SBbotTransactionData).then((created) => {
                    db.botTransction.findOne({
                        where: {
                            bot_type: 23,
                        },
                        order: [
                            ['id', 'DESC']
                        ]
                    }).then((res) => {
                        // console.log(res)
                        if (res) {

                            if (latestBotTransactionId != res.id) {
                                io.emit('all', {
                                    bot_type: 23,
                                    bet: res.bet
                                })
                                latestBotTransactionId = res.id
                            }

                            SBbotTransactionData.id = res.id

                            if (Object.keys(rotBotWorkerDict).length > 0) {
                                Object.keys(rotBotWorkerDict).forEach(function (key) {
                                    var val = rotBotWorkerDict[key];
                                    // console.log(key, val)
                                    val.postMessage({
                                        action: 'result_bet',
                                        bot_type: result.bot_type,
                                        table_id: result.table,
                                        table_title: result.table,
                                        shoe: result.shoe,
                                        round: result.stats.round,
                                        bet: result.stats.bot.SB,
                                        result: JSON.stringify(result.stats),
                                        status: result.status.SB,
                                        user_count: 0,
                                        botTransactionId: res.id,
                                        botTransaction: SBbotTransactionData

                                    })
                                });
                            }
                        }
                    })
                })
            })
            // isPlayRot.SB = false



            db.botTransction.findOne({
                where: {
                    bot_type: 24,
                },
                order: [
                    ['id', 'DESC']
                ]
            }).then((latest) => {
                let point = 0
                if (latest) {
                    point = latest.point
                }
                botTransactionObj['TWOZONE'] = null
                if (result.status.TWOZONE == 'WIN') {
                    point += 1
                } else if (result.status.TWOZONE == 'LOSE') {
                    point -= 1
                }
                let TWOZONEbotTransactionData = {
                    bot_type: 24,
                    table_id: result.table,
                    table_title: result.table,
                    shoe: result.shoe,
                    round: result.stats.round,
                    bet: JSON.stringify(result.stats.bot.TWOZONE),
                    result: JSON.stringify(result.stats),
                    win_result: result.status.TWOZONE,
                    user_count: 0,
                    point: point
                }

                db.botTransction.create(TWOZONEbotTransactionData).then((created) => {
                    db.botTransction.findOne({
                        where: {
                            bot_type: 24,
                        },
                        order: [
                            ['id', 'DESC']
                        ]
                    }).then((res) => {
                        // console.log(res)
                        if (res) {

                            if (latestBotTransactionId != res.id) {
                                io.emit('all', {
                                    bot_type: 24,
                                    bet: res.bet
                                })
                                latestBotTransactionId = res.id
                            }

                            TWOZONEbotTransactionData.id = res.id

                            if (Object.keys(rotBotWorkerDict).length > 0) {
                                Object.keys(rotBotWorkerDict).forEach(function (key) {
                                    var val = rotBotWorkerDict[key];
                                    // console.log(key, val)
                                    val.postMessage({
                                        action: 'result_bet',
                                        bot_type: result.bot_type,
                                        table_id: result.table,
                                        table_title: result.table,
                                        shoe: result.shoe,
                                        round: result.stats.round,
                                        bet: JSON.stringify(result.stats.bot.TWOZONE),
                                        result: JSON.stringify(result.stats),
                                        status: result.status.TWOZONE,
                                        user_count: 0,
                                        botTransactionId: res.id,
                                        botTransaction: TWOZONEbotTransactionData

                                    })
                                });
                            }
                        }
                    })
                })
            })

            db.botTransction.findOne({
                where: {
                    bot_type: 25,
                },
                order: [
                    ['id', 'DESC']
                ]
            }).then((latest) => {
                let point = 0
                if (latest) {
                    point = latest.point
                }
                botTransactionObj['ONEZONE'] = null
                if (result.status.ONEZONE == 'WIN') {
                    point += 1
                } else if (result.status.ONEZONE == 'LOSE') {
                    point -= 1
                }
                let ONEZONEbotTransactionData = {
                    bot_type: 25,
                    table_id: result.table,
                    table_title: result.table,
                    shoe: result.shoe,
                    round: result.stats.round,
                    bet: result.stats.bot.ONEZONE,
                    result: JSON.stringify(result.stats),
                    win_result: result.status.ONEZONE,
                    user_count: 0,
                    point: point
                }

                db.botTransction.create(ONEZONEbotTransactionData).then((created) => {
                    db.botTransction.findOne({
                        where: {
                            bot_type: 25,
                        },
                        order: [
                            ['id', 'DESC']
                        ]
                    }).then((res) => {
                        // console.log(res)
                        if (res) {

                            if (latestBotTransactionId != res.id) {
                                io.emit('all', {
                                    bot_type: 25,
                                    bet: res.bet
                                })
                                latestBotTransactionId = res.id
                            }

                            ONEZONEbotTransactionData.id = res.id

                            if (Object.keys(rotBotWorkerDict).length > 0) {
                                Object.keys(rotBotWorkerDict).forEach(function (key) {
                                    var val = rotBotWorkerDict[key];
                                    // console.log(key, val)
                                    val.postMessage({
                                        action: 'result_bet',
                                        bot_type: result.bot_type,
                                        table_id: result.table,
                                        table_title: result.table,
                                        shoe: result.shoe,
                                        round: result.stats.round,
                                        bet: result.stats.bot.ONEZONE,
                                        result: JSON.stringify(result.stats),
                                        status: result.status.ONEZONE,
                                        user_count: 0,
                                        botTransactionId: res.id,
                                        botTransaction: ONEZONEbotTransactionData

                                    })
                                });
                            }
                        }
                    })
                })
            })
            // isPlayRot.ZONE = false



            // // isPlay = false
            // if(result.playList.findIndex((item) => item == 'RB') != -1){
            //     isPlayRot.RB = false
            // }
            // if(result.playList.findIndex((item) => item == 'ED') != -1){
            //     isPlayRot.ED = false
            // }
            // if(result.playList.findIndex((item) => item == 'SB') != -1){
            //     isPlayRot.SB = false
            // }
            // if(result.playList.findIndex((item) => item == 'ZONE') != -1){
            //     isPlayRot.ZONE = false
            // }
            rotCurrentList = []
        }
        if (result.action == 'bet') {
            rotStartBet = new Date().getTime()
            rotBetInt[result.data.table] = setInterval(function () {
                rotBetInterval(rotStartBet, result.data, result.data.table);
            }, 3000);

            rotCurrentBetData[result.data.table] = result.data
            // rotIsBet = true;
            // rotRemainingBet = result.data.remaining
            // rotCurrentBetData = result.data

            io.emit('bot', { action: 'play', data: result.data })
        }
        if (result.action == 'force_reconnect') {
            if (Object.keys(rotBotWorkerDict).length > 0) {
                Object.keys(rotBotWorkerDict).forEach(function (key) {
                    var val = rotBotWorkerDict[key];
                    // console.log(key, val)
                    val.postMessage({
                        action: 'force_reconnect'
                    })
                });

            }
        }
    };

    // start worker
    myWorker = startWorker({ table: table, username: botConfig.user[table] }, __dirname + '/rotbot.js', cb);
    if (myWorker != null) {
        rotWorkerDict[table] = {
            worker: myWorker
        }
    }
}

function startWorker(table, path, cb) {
    // sending path and data to worker thread constructor
    // console.log(botConfig.user[table.id])
    // table.token = botConfig.user[table.id]
    // if (table.token == '') {
    //     return null
    // }
    let w = new Worker(path, {
        workerData: table
    });

    // registering events in main thread to perform actions after receiving data/error/exit events
    w.on('message', (msg) => {
        // data will be passed into callback
        cb(null, msg);
    });

    // for error handling
    w.on('error', cb);

    // for exit
    w.on('exit', (code) => {
        if (code !== 0) {
            console.error(new Error(`Worker stopped Code ${code}`))
        } else {
            w.terminate()
        }
    });
    return w;
}
