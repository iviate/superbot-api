require('log-timestamp');
const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');
const { bot } = require('./app/models');
const { POINT_CONVERSION_COMPRESSED } = require('constants');
const e = require('express');
const db = require('./app/models');
const utils = require("./utils.js")
const moment = require('moment-timezone');
var qs = require('qs');
var botCodeMap = {
    11: 'RB',
    12: 'ED',
    13: 'SB',
    14: 'TWOZONE',
    15: 'ONEZONE'
}
let interval;
let systemData;
let current = {}
let playData;
let botObj;
let token = null
let betFailed = false;
let playTurn = 1
let status = 2
var isStop = false;
var minBet = 50
var maxBet = 2500
var minZero = 10
var turnover = 0
var is_opposite = false
var table = null
var stopLoss = 0
var stopLossPercent = 0
var profitloss = 0
var winStreak = 0
var XRPreviousWinStreak = 0
var XRWinStreak = 0
var is_mock = false
let bet_time = null
let isRecookie = false
registerForEventListening();

function restartOnlyProfit() {
    axios.get(`https://truthbet.com/api/wallet`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(res => {

            let wallet = res.data.chips.credit
            if (wallet <= botObj.init_wallet) {
                playData = JSON.parse(botObj.data)
                parentPort.postMessage({ action: 'restart_result', data: { success: true, data: { playData: playData } }, userId: botObj.userId })
            } else {
                let s = 1
                let profit = botObj.profit_threshold - wallet
                let turn = Math.ceil(profit / botObj.init_bet)
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

                playData = ret
                // console.log(playData)
                parentPort.postMessage({ action: 'restart_result', data: { success: true, data: { playData: playData } }, userId: botObj.userId })
            }

        })
        .catch(error => {
            console.log(error)
            parentPort.postMessage({ action: 'restart_result', data: { success: false, message: error }, userId: botObj.userId })
        })
}

function restartAll() {
    let s = 1
    let turn = 0
    for (let i = 0; i < playData.length; i++) {
        turn += playData[i]
    }
    // let turn = sum(playData)
    let left = turn
    let ret = []
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
    playData = ret
    // console.log(playData)
    parentPort.postMessage({ action: 'restart_result', data: { success: true, data: { playData: playData } }, userId: botObj.userId })
}


function restartXSystem(type) {
    if (type == 1) {
        restartOnlyProfit()
    } else if (type == 2) {
        restartAll()
    }
}

function getBetVal() {
    let betval = 0
    if (botObj.money_system == 1) {
        betval = botObj.init_bet
    }
    else if (botObj.money_system == 2 || botObj.money_system == 5 || botObj.money_system == 6) {
        // console.log(playData, playTurn)
        betval = playData[playTurn - 1]
    }
    else if (botObj.money_system == 3) {
        if (playData.length == 1) {
            betval = playData[0] * (botObj.init_bet / 2)
        } else {
            betval = (playData[0] + playData[playData.length - 1]) * (botObj.init_bet / 2)
        }

    }
    else if (botObj.money_system == 4) {
        if (playData.length == 1) {
            betval = playData[0] * botObj.init_bet
        } else {
            betval = (playData[0] + playData[playData.length - 1]) * botObj.init_bet
        }

    }
    else if (botObj.money_system == 7) {
        betval = playData[playTurn - 1]
        // console.log(`bet val ${playTurn} : ${betval}`)
    }
    else if (botObj.money_system == 8) {
        betval = playData[playTurn - 1]
        // console.log(`3 in 9 bet val ${playTurn} : ${betval}`)
    }
    else if (botObj.money_system == 9) {
        betval = playData[playTurn - 1]
    }

    let mod = ~~(betval % 10)
    // console.log(mod, betval)
    if (mod != 0 && mod != 5) {
        if (mod < 5) {
            betval = (Math.floor((betval / 10)) * 10) + 5
        } else if (mod > 5) {
            betval = Math.ceil(betval / 10) * 10
        }
    }


    return ~~betval
}

// function getBetPayLoad(table_id, game_id, bot, betVal) {
//     let payload = { table_id: table_id, game_id: game_id }
//     if (botObj.bet_side == 11) {
//         let realBet = data.bot.RB
//         if (data.bot == 'HALFxBLACK' && is_opposite == false) {
//             payload.chip = { credit: { 'HALFxBLACK': betVal } }
//         } else if (data.bot == 'HALFxRED' && is_opposite == false) {
//             payload.chip = { credit: { 'HALFxRED': betVal } }
//         } else if (data.bot == 'HALFxBLACK' && is_opposite == true) {
//             payload.chip = { credit: { 'HALFxRED': betVal } }
//             realBet = 'HALFxRED'
//         } else if (data.bot == 'HALFxRED' && is_opposite == true) {
//             payload.chip = { credit: { 'HALFxBLACK': betVal } }
//             realBet = 'HALFxBLACK'
//         } else {
//             return
//         }
//     } else if (botObj.bet_side == 12) {
//         let realBet = data.bot.ED
//         if (data.bot == 'HALFxEVEN' && is_opposite == false) {
//             payload.chip = { credit: { 'HALFxEVEN': betVal } }
//         } else if (data.bot == 'HALFxODD' && is_opposite == false) {
//             payload.chip = { credit: { 'HALFxODD': betVal } }
//         } else if (data.bot == 'HALFxEVEN' && is_opposite == true) {
//             payload.chip = { credit: { 'HALFxODD': betVal } }
//             realBet = 'HALFxODD'
//         } else if (data.bot == 'HALFxODD' && is_opposite == true) {
//             payload.chip = { credit: { 'HALFxEVEN': betVal } }
//             realBet = 'HALFxEVEN'
//         } else {
//             return
//         }
//     } else if (botObj.bet_side == 13) {
//         let realBet = data.bot.ED
//         if (data.bot == 'HALFxSMALL' && is_opposite == false) {
//             payload.chip = { credit: { 'HALFxSMALL': betVal } }
//         } else if (data.bot == 'HALFxBIG' && is_opposite == false) {
//             payload.chip = { credit: { 'HALFxBIG': betVal } }
//         } else if (data.bot == 'HALFxBIG' && is_opposite == true) {
//             payload.chip = { credit: { 'HALFxSMALL': betVal } }
//             realBet = 'HALFxSMALL'
//         } else if (data.bot == 'HALFxSMALL' && is_opposite == true) {
//             payload.chip = { credit: { 'HALFxBIG': betVal } }
//             realBet = 'HALFxBIG'
//         } else {
//             return
//         }
//     } else if (botObj.bet_side == 14) {
//         let realBet = data.bot.TWOZONE
//         payload.chip = {}
//         payload.chip['credit'] = {}
//         payload.chip.credit[realBet[0]] = betVal
//         payload.chip.credit[realBet[1]] = betVal
//     } else if (botObj.bet_side == 15) {
//         if(!is_opposite){
//             let realBet = data.bot.ONEZONE
//             payload.chip = {}
//             payload.chip['credit'] = {}
//             payload.chip.credit[realBet] = betVal
//         }else{
//             let dozen = ['DOZENx1st', 'DOZENx2nd', 'DOZENx3rd']

//         }



//     }

// }

async function bet(data) {
    table = data.table
    // console.log(status, betFailed, botObj.bet_side, botObj.is_infinite, data.playList)
    if(isRecookie){
        return
    }

    if (betFailed) {
        return
    }

    if (current.shoe == data.shoe && current.round == data.round) {
        betFailed = false
        return
    }

    if (botObj.bet_side == 11 && data.playList.findIndex((item) => item == 'RB') == -1) {
        return
    }
    else if (botObj.bet_side == 12 && data.playList.findIndex((item) => item == 'EO') == -1) {
        return
    }
    else if (botObj.bet_side == 13 && data.playList.findIndex((item) => item == 'SB') == -1) {
        return
    }
    else if (botObj.bet_side == 14 && data.playList.findIndex((item) => item == 'ZONE') == -1) {
        return
    }
    else if (botObj.bet_side == 15 && data.playList.findIndex((item) => item == 'ZONE') == -1) {
        return
    }

    if (status == 2) {
        // console.log(`bot ${workerData.obj.userId} pause`)
    } else if (status == 3) {
        // console.log(`bot ${workerData.obj.userId} stop`)
    } else {

        let betVal = getBetVal()
        // console.log(`betVal : ${betVal}`)
        if (betVal < botObj.init_bet) {
            betVal = botObj.init_bet
        } else if (betVal > 5000) {
            betVal = 5000
        }

        // if (betVal > maxBet) {
        //     // console.log('upgrade bet limit')
        //     let payload = { games: { baccarat: { range: "medium" } } }

        //     axios.post(`https://truthbet.com/api/m/settings/limit`, payload, {
        //         headers: {
        //             Authorization: `Bearer ${workerData.obj.token}`
        //         }
        //     }).then(res => {
        //         minBet = 200
        //         maxBet = 10000
        //         minZero = 40
        //     })
        //         .catch(error => {
        //             // console.log(error)
        //         })
        //     return

        // } else if (betVal < minBet) {
        //     // console.log('dowgrade bet limit')
        //     let payload = { games: { baccarat: { range: "newbie" } } }

        //     axios.post(`https://truthbet.com/api/m/settings/limit`, payload, {
        //         headers: {
        //             Authorization: `Bearer ${workerData.obj.token}`
        //         }
        //     }).then(res => {
        //         minBet = 50
        //         maxBet = 2500
        //         minZero = 10
        //     })
        //         .catch(error => {
        //             // console.log(error)
        //         })
        //     return
        // }

        // getBetPayLoad(data.table.id, data.game_id, data.bot, betVal)
        let mapZone = {
            FIRST: 148,
            SECOND: 149,
            THIRD: 150
        }
        let bPayload = { "details": [], "categoryStakes": [] }
        // console.log(data.table, data.bot, betVal)
        let realBet = null
        let idx = []
        let payload = { table_id: data.table, game_id: data.game_id }
        if (botObj.bet_side == 11) {
            realBet = data.bot.RB
            if (data.bot.RB == 'BLACK' && is_opposite == false) {
                idx.push(156)
                payload.chip = { credit: { 'BLACK': betVal } }
            } else if (data.bot.RB == 'RED' && is_opposite == false) {
                payload.chip = { credit: { 'RED': betVal } }
                idx.push(155)
            } else if (data.bot.RB == 'BLACK' && is_opposite == true) {
                payload.chip = { credit: { 'RED': betVal } }
                realBet = 'RED'
                idx.push(155)
            } else if (data.bot.RB == 'RED' && is_opposite == true) {
                payload.chip = { credit: { 'BLACK': betVal } }
                realBet = 'BLACK'
                idx.push(156)
            } else {
                return
            }
        } else if (botObj.bet_side == 12) {
            realBet = data.bot.EO
            if (data.bot.EO == 'EVEN' && is_opposite == false) {
                payload.chip = { credit: { 'EVEN': betVal } }
                idx.push(154)
            } else if (data.bot.EO == 'ODD' && is_opposite == false) {
                payload.chip = { credit: { 'ODD': betVal } }
                idx.push(153)
            } else if (data.bot.EO == 'EVEN' && is_opposite == true) {
                payload.chip = { credit: { 'ODD': betVal } }
                realBet = 'ODD'
                idx.push(153)
            } else if (data.bot.EO == 'ODD' && is_opposite == true) {
                payload.chip = { credit: { 'EVEN': betVal } }
                realBet = 'EVEN'
                idx.push(154)
            } else {
                return
            }
        } else if (botObj.bet_side == 13) {
            realBet = data.bot.SB
            if (data.bot.SB == 'SMALL' && is_opposite == false) {
                payload.chip = { credit: { 'SMALL': betVal } }
                idx.push(151)
            } else if (data.bot.SB == 'BIG' && is_opposite == false) {
                payload.chip = { credit: { 'BIG': betVal } }
                idx.push(152)
            } else if (data.bot.SB == 'BIG' && is_opposite == true) {
                payload.chip = { credit: { 'SMALL': betVal } }
                realBet = 'SMALL'
                idx.push(151)
            } else if (data.bot.SB == 'SMALL' && is_opposite == true) {
                payload.chip = { credit: { 'BIG': betVal } }
                realBet = 'BIG'
                idx.push(152)
            } else {
                return
            }
        } else if (botObj.bet_side == 14) {
            realBet = data.bot.TWOZONE
            realBet.forEach(element => {
                idx.push(mapZone[element])
            });
        } else if (botObj.bet_side == 15) {
            if (!is_opposite) {
                realBet = data.bot.ONEZONE
                idx.push(mapZone[realBet])
            } else {
                // console.log('opposite one zone')
                let dozen = ['FIRST', 'SECOND', 'THIRD']
                let index = dozen.indexOf(data.bot.ONEZONE)
                // console.log(index)
                if (index != -1) {
                    dozen.splice(index, 1)
                    realBet = dozen
                    realBet.forEach(element => {
                        idx.push(mapZone[element])
                    });
                } else {
                    realBet = data.bot.ONEZONE
                    idx.push(mapZone[realBet])

                }
            }
        }

        idx.forEach(element => {
            bPayload["details"].push({ "mode": 0, "idx": element, "orders": [{ "idx": element, "amt": betVal }], "orderLength": 1, "totAmt": betVal })
            bPayload["categoryStakes"].push({ "idx": element, "stake": betVal })
        })

        let zeroVal = 0
        // console.log(`bet bet zero ${botObj.open_zero} ${botObj.zero_bet}`)
        if (botObj.open_zero && botObj.zero_bet > 9) {
            if (botObj.zero_bet < minZero) {
                zeroVal = minZero
                bPayload["details"].push({ "mode": 0, "idx": 0, "orders": [{ "idx": 0, "amt": zeroVal }], "orderLength": 1, "totAmt": zeroVal })
                bPayload["categoryStakes"].push({ "idx": 0, "stake": zeroVal })
            } else {
                zeroVal = botObj.zero_bet
                bPayload["details"].push({ "mode": 0, "idx": 0, "orders": [{ "idx": 0, "amt": zeroVal }], "orderLength": 1, "totAmt": zeroVal })
                bPayload["categoryStakes"].push({ "idx": 0, "stake": zeroVal })
            }

        }

        // console.log(payload)

        if (!is_mock) {
            const user = await db.user.findOne({
                where: {
                    id: botObj.userId
                },
            })
            // let bData = [{ "categoryIdx": categoryId, "categoryName": realBet, "stake": betVal }]
            // console.log(data)
            var pData = qs.stringify({
                'dealerDomain': '1',
                'tableID': data.table.toString(),
                'gameShoe': data.shoe.toString(),
                'gameRound': data.round.toString(),
                'data': JSON.stringify(bPayload),
                'betLimitID': '110901',
                'f': '-1',
                'c': 'A'
            });
            var config = {
                method: 'post',
                url: 'https://bpweb.bikimex.net/player/update/addRouTransaction',
                headers: {
                    'Cookie': user.cookie,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: pData
            };

            let res = await axios(config)
            // console.log(res.data)

            if (res.data.status == 200) {
                if (botObj.open_zero) {
                    turnover += zeroVal
                }

                if (botObj.bet_side == 14 || (botObj.bet_side == 15 && is_opposite == true)) {
                    turnover += betVal * 2
                } else {
                    turnover += betVal
                }
                current = { bot: data.bot, bet: realBet, shoe: data.shoe, round: data.round, table_id: data.table, betVal: betVal, playTurn: playTurn, botObj: botObj, is_opposite: is_opposite }
                parentPort.postMessage({ action: 'bet_success', data: { ...data, betVal: betVal, current: current, botObj: botObj, turnover: turnover, bet: realBet } })
                betFailed = true

                const user = await db.user.findOne({
                    where: {
                        id: botObj.userId
                    },
                })
                let cTime = parseFloat(user.cookieTime) || 0
                let cookieAge = Math.round((moment() - cTime) / 1000)
                // console.log(cookieAge)
                if (cookieAge > 1400 || !user.cookie) {
                    isRecookie = true
                    let c = await utils.reCookie(user.ufa_account, user.type_password)
                    currentWallet = await utils.getUserWallet(c)
                    user.cookie = c
                    user.cookieTime = moment().valueOf()
                    user.save()
                    isRecookie = false
                    
                }
            } else {
                parentPort.postMessage({ action: 'bet_failed', botObj: botObj, error: res.data })
                betFailed = false
                let cTime = parseFloat(user.cookieTime) || 0
                let cookieAge = Math.round((moment() - cTime) / 1000)
                // console.log(cookieAge)
                if (cookieAge > 1400 || !user.cookie) {
                    isRecookie = true
                    let c = await utils.reCookie(user.ufa_account, user.type_password)
                    currentWallet = await utils.getUserWallet(c)
                    user.cookie = c
                    user.cookieTime = moment().valueOf()
                    user.save()
                    isRecookie = false
                }
            }

        } else {
            turnover += betVal
            current = { bot: data.bot, bet: realBet, shoe: data.shoe, round: data.round, table_id: data.table, betVal: betVal, playTurn: playTurn, botObj: botObj, is_opposite: is_opposite }
            parentPort.postMessage({ action: 'bet_success', data: { ...data, betVal: betVal, current: current, botObj: botObj, turnover: turnover, bet: realBet } })
            betFailed = true
            bet_time = Date.now()
        }
    }

}

function genLeftProfitLabaushare(wallet) {
    let half_bet = botObj.init_bet / 2
    let leftProfit = (botObj.init_wallet + botObj.profit_wallet + (botObj.profit_threshold - botObj.init_wallet)) - wallet
    let turn = 2
    let money = leftProfit / turn / half_bet
    while (turn < 20 && (leftProfit / turn / half_bet >= 1)) {
        money = leftProfit / turn / half_bet
        turn++
    }
    turn -= 1
    money = Math.ceil(money * 10) / 10
    let ret = []
    // console.log(`turn = ${turn} money = ${money * init_bet}`)
    for (let i = 0; i < turn; i++) {
        ret.push(money)
    }

    return ret
}

function genLeftProfitXSystem(wallet) {
    let s = 1
    let leftProfit = (botObj.init_wallet + botObj.profit_wallet + (botObj.profit_threshold - botObj.init_wallet)) - wallet
    let turn = Math.ceil(leftProfit / botObj.init_bet)
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

async function processResultBet(betStatus, botTransactionId, botTransaction, gameResult) {
    let startLoop = moment()
    while(isRecookie){
        await new Promise(() => setTimeout(() => {}, 2000));
        let loopAge = Math.round((moment() - startLoop) / 1000)
        if(loopAge > 120){
            break;
        }
    }

    let gameResultObj = JSON.parse(gameResult)
    // console.log(gameResultObj.data)
    let score = JSON.parse(gameResultObj.data.message).tableCards[0]
    // console.log(gameResultObj.winner)
    if (botObj.money_system == 1) { }
    else if (botObj.money_system == 6 || botObj.money_system == 5) {
        // console.log(betStatus, botTransactionId, botTransaction, current.is_opposite)
        if (score == 0) {
            playTurn++
            if (playTurn > playData.length) {
                playTurn = 1
            }
        } else if ((betStatus == 'WIN' && current.is_opposite == false) || (betStatus == 'LOSE' && current.is_opposite == true)) {
            playTurn = 1
        } else if ((betStatus == 'LOSE' && current.is_opposite == false) || (betStatus == 'WIN' && current.is_opposite == true)) {
            playTurn++
            if (playTurn > playData.length) {
                playTurn = 1
            }
        }
    }
    else if (botObj.money_system == 7) {
        // console.log(`before playTurn ${playTurn}`)
        // console.log(playData[playTurn-1])
        if (score == 0) {
            winStreak = 0
            profitloss += -1 * (playData[playTurn - 1] * 2)
        } else if (betStatus == "WIN") {
            winStreak += 1
            profitloss += playData[playTurn - 1]
        } else if (betStatus == 'LOSE') {
            winStreak = 0
            profitloss += -1 * (playData[playTurn - 1] * 2)
        }
        // console.log(`profitloss ${profitloss} winStreak: ${winStreak}`)
        if (winStreak == 3 || profitloss >= 0) {
            playTurn = 1
            profitloss = 0
        } else {
            playTurn += 1
        }
        // console.log(`after playTurn ${playTurn}`)
        if (playTurn > 9) {
            playTurn = 1
            profitloss = 0
        }

        // console.log(`last playTurn ${playTurn}`)
    }
    else if (botObj.money_system == 3 || botObj.money_system == 4) {
        if (score == 0) {
            if (playData.length == 1) {
                playData.push(Math.ceil(playData[0] * 10) / 10)
            } else {
                playData.push(Math.ceil((playData[0] + playData[playData.length - 1]) * 10) / 10)
            }
        } else if ((betStatus == 'WIN' && current.is_opposite == false) || (betStatus == 'LOSE' && current.is_opposite == true)) {
            playData = playData.splice(1, playData.length - 2)
        } else if ((betStatus == 'LOSE' && current.is_opposite == false) || (betStatus == 'WIN' && current.is_opposite == true)) {
            if (playData.length == 1) {
                playData.push(Math.ceil(playData[0] * 10) / 10)
            } else {
                playData.push(Math.ceil((playData[0] + playData[playData.length - 1]) * 10) / 10)
            }


        }
    } else if (botObj.money_system == 8) {
        if (betStatus == "WIN") {
            XRWinStreak += 1
        }
        // console.log(` XR SYSTEM ${playTurn}, ${XRWinStreak}, ${XRPreviousWinStreak}`)

        if (playTurn == playData.length) {
            // console.log(`full set`)
            playTurn = 1
            XRWinStreak = 0
            XRPreviousWinStreak = 0
        }
        else if (playTurn % 3 == 0) {
            // console.log('third turn')
            if (XRWinStreak < 2) {
                // console.log(`${XRWinStreak} next turn`)
                XRPreviousWinStreak = XRWinStreak
                playTurn += 1
                XRWinStreak = 0
            } else if (XRWinStreak == 2) {
                // console.log(`${XRWinStreak} same set`)
                playTurn -= 2
                XRPreviousWinStreak = XRWinStreak
                XRWinStreak = 0
            } else if (XRWinStreak == 3) {
                // console.log(`${XRWinStreak} re set`)
                playTurn = 1
                XRWinStreak = 0
                XRPreviousWinStreak = 0
            }
        } else if (playTurn % 3 == 2) {
            // console.log('secord turn')
            if (XRWinStreak == 2 && XRPreviousWinStreak == 2) {
                // console.log(`${XRWinStreak} re set`)
                playTurn = 1
                XRWinStreak = 0
                XRPreviousWinStreak = 0
            }
            else {
                playTurn += 1
            }
        } else {
            // console.log('first turn')
            // console.log(playTurn, XRWinStreak)
            playTurn += 1
            // console.log(playTurn, XRWinStreak)
        }


    }
    else if (botObj.money_system == 9) {
        if (score == 0) {
            playTurn += 1
            // if (playTurn > playData.length) {
            //     playTurn = 1
            // }
        } else if ((betStatus == 'WIN' && current.is_opposite == false) || (betStatus == 'LOSE' && current.is_opposite == true)) {
            playTurn -= 2
            if (playTurn < 1) {
                playTurn = 1
            }
        } else if ((betStatus == 'LOSE' && current.is_opposite == false) || (betStatus == 'WIN' && current.is_opposite == true)) {
            playTurn += 1
        }
    }

    if (!is_mock) {
        // console.log(playData)
        const user = await db.user.findOne({
            where: {
                id: botObj.userId
            },
        })
        let currentWallet = 0
        currentWallet = await utils.getUserWallet(user.cookie)
        console.log(`rot ${botObj.userId}-${user.ufa_account} wallet ${currentWallet}`)

        let cutProfit = botObj.init_wallet + Math.floor(((botObj.profit_threshold - botObj.init_wallet) * 94) / 100)
        if (playData.length == 0) {
            if (botObj.is_infinite == false && currentWallet - botObj.profit_wallet >= cutProfit) {
                isStop = true
            } else {

                // if (botObj.money_system == 3) {
                //     playData = genLeftProfitLabaushare(currentWallet)
                // } else if (botObj.money_system == 4) {
                //     playData = genLeftProfitXSystem(currentWallet)
                // }
                playData = JSON.parse(botObj.data)
                // console.log('re labuashare')
                // console.log(playData)
            }
        }



        // console.log(currentWallet, cutProfit)
        if (botObj.is_infinite && currentWallet - botObj.profit_wallet >= cutProfit) {
            db.bot.findOne({
                where: {
                    id: botObj.id
                }
            }).then((b) => {
                // console.log('profit wallet')
                let amount = currentWallet - botObj.profit_wallet - botObj.init_wallet
                b.profit_wallet += amount
                b.deposite_count += 1
                botObj.profit_wallet += amount
                botObj.deposite_count += 1
                playData = JSON.parse(botObj.data)
                playTurn = 1
                // console.log(botObj.profit_wallet, b.profit_wallet)
                b.save()
                db.wallet_transfer.create({ botId: botObj.id, amount: amount }).then((created) => { })
                parentPort.postMessage({
                    action: 'process_result',
                    status: betStatus,
                    wallet: currentWallet,
                    betVal: current.betVal,
                    bet: current.bet,
                    botObj: botObj,
                    is_opposite: current.is_opposite,
                    playData: playData,
                    botTransactionId: botTransactionId,
                    botTransaction: botTransaction,
                    isStop: isStop,
                    is_mock: is_mock,
                    turnover: turnover
                })


            })
        } else {
            if (botObj.is_infinite && playData.length === 0) {
                playData = JSON.parse(botObj.data)
            }
            // console.log(currentWallet - botObj.profit_wallet <= botObj.loss_threshold, currentWallet > 50)
            if (parseInt(currentWallet) - parseInt(botObj.profit_wallet) <= parseInt(botObj.loss_threshold) + 1) {
                // let currentBot = await db.bot.findOne({
                //     where: {
                //         id: botObj.id
                //     }
                // })
                // let new_loss = currentBot.loss_threshold - stopLoss
                // let new_loss_percent = currentBot.loss_percent + stopLossPercent
                // // console.log(currentWallet, new_loss, currentWallet <= new_loss, currentWallet - botObj.profit_wallet > 50)
                // while (parseInt(currentWallet) <= new_loss + 1 + 10 && currentWallet - botObj.profit_wallet > 50) {
                //     new_loss -= stopLoss
                //     new_loss_percent += currentBot.stopLossPercent
                // }

                // if (new_loss_percent > 100 || new_loss < 0) {
                //     new_loss_percent = 100
                //     new_loss = 0
                // }

                // currentBot.loss_threshold = new_loss
                // currentBot.loss_percent = new_loss_percent
                // currentBot.status = 2

                // await currentBot.save()
                // botObj.loss_threshold = new_loss
                // botObj.loss_percent = new_loss_percent
                // botObj.status = 2
                // status = 2
                // if (currentWallet - botObj.profit_wallet < 50) {
                //     isStop = true
                // }
                // parentPort.postMessage({ action: 'info', botObj: botObj, playData: playData, turnover: turnover, userId: botObj.userId, table: table, current: current })
                parentPort.postMessage({
                    action: 'process_result',
                    status: betStatus,
                    wallet: currentWallet,
                    betVal: current.betVal,
                    bet: current.bet,
                    botObj: botObj,
                    playData: playData,
                    is_opposite: current.is_opposite,
                    botTransactionId: botTransactionId,
                    botTransaction: botTransaction,
                    isStop: true,
                    is_mock: is_mock,
                    turnover: turnover
                })
            } else {
                parentPort.postMessage({
                    action: 'process_result',
                    status: betStatus,
                    wallet: currentWallet,
                    betVal: current.betVal,
                    bet: current.bet,
                    botObj: botObj,
                    playData: playData,
                    is_opposite: current.is_opposite,
                    botTransactionId: botTransactionId,
                    botTransaction: botTransaction,
                    isStop: isStop,
                    is_mock: is_mock,
                    turnover: turnover
                })
            }
        }
    }
    else {
        // console.log('process mock rot bot')
        db.user.findOne({
            where: {
                id: botObj.userId
            }
        }).then(async (u) => {
            if (score == 0) {
                u.mock_wallet -= current.betVal
            }
            if ((betStatus == 'WIN' && current.is_opposite == false) || (betStatus == 'LOSE' && current.is_opposite == true)) {
                if ((botObj.bet_side == 14 && current.is_opposite == false) || (botObj.bet_side == 15 && current.is_opposite == true)) {
                    u.mock_wallet += (current.betVal * 2)
                } else {
                    u.mock_wallet += current.betVal
                }

            } else if ((betStatus == 'LOSE' && current.is_opposite == false) || (betStatus == 'WIN' && current.is_opposite == true)) {
                u.mock_wallet -= current.betVal
            } else if (betStatus == 'TIE') {
            }
            let currentWallet = u.mock_wallet
            u.save()
            // console.log(u)

            let cutProfit = botObj.init_wallet + Math.floor(((botObj.profit_threshold - botObj.init_wallet) * 94) / 100)
            if (playData.length == 0) {
                if (botObj.is_infinite == false && currentWallet - botObj.profit_wallet >= cutProfit) {
                    isStop = true
                } else {

                    // if (botObj.money_system == 3) {
                    //     playData = genLeftProfitLabaushare(currentWallet)
                    // } else if (botObj.money_system == 4) {
                    //     playData = genLeftProfitXSystem(currentWallet)
                    // }
                    playData = JSON.parse(botObj.data)
                    // console.log('re labuashare')
                    // console.log(playData)
                }
            }



            // console.log(currentWallet, cutProfit)
            if (botObj.is_infinite && currentWallet - botObj.profit_wallet >= cutProfit) {
                db.bot.findOne({
                    where: {
                        id: botObj.id
                    }
                }).then((b) => {
                    let amount = currentWallet - botObj.profit_wallet - botObj.init_wallet
                    b.profit_wallet += amount
                    b.deposite_count += 1
                    botObj.profit_wallet += amount
                    botObj.deposite_count += 1
                    playData = JSON.parse(botObj.data)
                    playTurn = 1
                    // console.log(botObj.profit_wallet, b.profit_wallet)
                    b.save()
                    db.wallet_transfer.create({ botId: botObj.id, amount: amount }).then((created) => { })
                    parentPort.postMessage({
                        action: 'process_result',
                        status: betStatus,
                        wallet: u.mock_wallet,
                        betVal: current.betVal,
                        bet: current.bet,
                        is_opposite: current.is_opposite,
                        botObj: botObj,
                        playData: playData,
                        botTransactionId: botTransactionId,
                        botTransaction: botTransaction,
                        isStop: isStop,
                        turnover: turnover,
                        playTurn: playTurn,
                        is_mock: is_mock,
                        bet_time: bet_time
                    })


                })
            } else {
                if (botObj.is_infinite && playData.length === 0) {
                    playData = JSON.parse(botObj.data)
                }
                // console.log(currentWallet - botObj.profit_wallet <= botObj.loss_threshold, currentWallet > 50)
                if (parseInt(currentWallet) - parseInt(botObj.profit_wallet) <= parseInt(botObj.loss_threshold) + 1) {
                    let currentBot = await db.bot.findOne({
                        where: {
                            id: botObj.id
                        }
                    })
                    let new_loss = currentBot.loss_threshold - stopLoss
                    let new_loss_percent = currentBot.loss_percent + stopLossPercent
                    // console.log(currentWallet, new_loss, currentWallet <= new_loss, currentWallet - botObj.profit_wallet > 50)
                    while (parseInt(currentWallet) <= new_loss + 1 + 10 && currentWallet - botObj.profit_wallet > 50) {
                        new_loss -= stopLoss
                        new_loss_percent += currentBot.stopLossPercent
                    }

                    if (new_loss_percent > 100 || new_loss < 0) {
                        new_loss_percent = 100
                        new_loss = 0
                    }

                    currentBot.loss_threshold = new_loss
                    currentBot.loss_percent = new_loss_percent
                    currentBot.status = 2

                    await currentBot.save()
                    botObj.loss_threshold = new_loss
                    botObj.loss_percent = new_loss_percent
                    botObj.status = 2
                    status = 2
                    if (currentWallet - botObj.profit_wallet < 50) {
                        isStop = true
                    }
                    parentPort.postMessage({ action: 'info', botObj: botObj, playData: playData, turnover: turnover, userId: botObj.userId, table: table, current: current })
                    parentPort.postMessage({
                        action: 'process_result',
                        status: betStatus,
                        wallet: u.mock_wallet,
                        betVal: current.betVal,
                        bet: current.bet,
                        botObj: botObj,
                        playData: playData,
                        is_opposite: current.is_opposite,
                        botTransactionId: botTransactionId,
                        botTransaction: botTransaction,
                        isStop: currentWallet - botObj.profit_wallet < 50 ? true : false,
                        turnover: turnover,
                        is_mock: is_mock,
                        bet_time: bet_time
                    })
                } else {
                    parentPort.postMessage({
                        action: 'process_result',
                        status: betStatus,
                        wallet: u.mock_wallet,
                        betVal: current.betVal,
                        bet: current.bet,
                        botObj: botObj,
                        is_opposite: current.is_opposite,
                        playData: playData,
                        botTransactionId: botTransactionId,
                        botTransaction: botTransaction,
                        isStop: isStop,
                        turnover: turnover,
                        is_mock: is_mock,
                        bet_time: bet_time
                    })
                }



            }
        })
    }
}

function registerForEventListening() {
    is_mock = workerData.is_mock
    playData = workerData.playData
    botObj = workerData.obj
    stopLoss = botObj.init_wallet - botObj.loss_threshold
    stopLossPercent = botObj.loss_percent
    token = workerData.obj.token
    // console.log(`${workerData.obj.id} hello`)

    axios.get(`https://truthbet.com/api/m/settings/limit`, {
        headers: {
            Authorization: `Bearer ${workerData.obj.token}`
        }
    })
        .then(res => {
            let userConfig = res.data.userConfig
            if (userConfig.package == 'rookie') {
                minBet = 100
                maxBet = 5000
            } else if (userConfig.package == 'medium') {
                minBet = 200
                maxBet = 10000
            }
        })
        .catch(error => {
            // console.log(error)
        })
    // callback method is defined to receive data from main thread
    let cb = (err, result) => {
        if (err) return console.error(err);
        if (result.action == 'bet') {
            // console.log('rot bet')
            bet(result.data)
        }
        if (result.action == 'info') {
            parentPort.postMessage({ action: 'info', botObj: botObj, playData: playData, turnover: turnover, userId: botObj.userId, table: table, current: current })
        }
        if (result.action == 'result_bet') {
            mapBotTypeAndBetSide = {
                11: 21,
                12: 22,
                13: 23,
                14: 24,
                15: 25
            }
            // console.log('action result_bet')
            // console.log(result, current)
            betFailed = false
            if (result.table_id == current.table_id &&
                result.round == current.round &&
                result.shoe == current.shoe &&
                mapBotTypeAndBetSide[botObj.bet_side] == result.botTransaction.bot_type) {
                
                setTimeout( function () {
                    processResultBet(result.status, result.botTransactionId, result.botTransaction, result.result)
                }, 7000)
                
            }
        }
        if (result.action == 'set_opposite') {
            // console.log(`set_opposite ${result.is_opposite}`)
            botObj.is_opposite = result.is_opposite
            is_opposite = result.is_opposite
            parentPort.postMessage({ action: 'info', botObj: botObj, playData: playData, turnover: turnover, userId: botObj.userId, table: table, current: current })
        }

        if (result.action == 'set_bet_side') {
            // console.log(`set_opposite ${result.is_opposite}`)
            botObj.bet_side = result.bet_side
            parentPort.postMessage({ action: 'info', botObj: botObj, playData: playData, turnover: turnover, userId: botObj.userId, table: table, current: current })
            // bet_side = result.bet_side
        }

        if (result.action == 'set_zero') {
            botObj.zero_bet = result.zero_bet
            botObj.open_zero = result.open_zero
            parentPort.postMessage({ action: 'info', botObj: botObj, playData: playData, turnover: turnover, userId: botObj.userId, table: table, current: current })
        }

        if (result.action == 'pause') {
            botObj.status = 2
            status = 2
        }
        if (result.action == 'start') {
            botObj.status = 1
            status = 1
            // betFailed = false
        }
        if (result.action == 'stop') {
            // console.log('action stop')
            isStop = true
            status = 3
            botObj.status = 3
            db.bot.findOne({
                where: {
                    id: botObj.id,
                }
            }).then((b) => {
                b.turnover = turnover
                // console.log(`turn over stop ${turnover}`)
                b.save()
                process.exit(0)
            })

        }
        // if (result.action == 'restart') {
        //     if (botObj.money_system != 4) {
        //         parentPort.postMessage({ action: 'restart_result', data: { success: false, message: "บอทไม่ใด้เดินเงินแบบ X System" }, userId: botObj.userId })
        //     }
        //     else if (status != 2) {
        //         parentPort.postMessage({ action: 'restart_result', data: { success: false, message: "โปรดหยุดบอทก่อนรีสตาร์ท" }, userId: botObj.userId })
        //     } else {
        //         restartXSystem(result.type)
        //     }
        // }
        // console.log("Thread id ")
        // //  setting up interval to call method to multiple with factor
        // interval = setInterval(predictPlay, 5000);
    };

    // registering to events to receive messages from the main thread
    parentPort.on('error', cb);
    parentPort.on('message', (msg) => {
        cb(null, msg);
    });
}
// function predictPlay()
// {
//     console.log(`${workerData} is working`)
// }