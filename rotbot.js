// parentPort for registering to events from main thread
// workerData for receiving data clone
require('log-timestamp');
const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');
const puppeteer = require("puppeteer");
const utils = require("./utils.js")
const moment = require('moment-timezone');
const rotConfig = require('./config/rot.config.js')


let interval;
let isReCookie = false
let cookieTime = null
let previousEventType = ""
// let index = -1;
// let tableObj;
// let tableStats = [];
let info = [];
let shoe;
let round;
let username = null
let password = "Aa5555++"
// let stats;
let predictStats = { shoe: '', correct: 0, wrong: 0, tie: 0, info: {}, predict: [] };
// let predictStatsHistory = [];
let statsCount;
let bot = null;
let playRound = null;
let token = null
let isPlay = false;
let cookie = null;
var date = new Date();
var tableId = 0

let isPlayHalfRB = false
let isPlayHalfEO = false
let isPlayHalfSB = false
let isPlayZone = false

let statCount = {
    rbCorrect: 0,
    rbWrong: 0,
    edCorrect: 0,
    edWrong: 0,
    sbCorrect: 0,
    sbWrong: 0,
    twoZoneCorrect: 0,
    twoZoneWrong: 0,
    oneZoneCorrect: 0,
    oneZoneWrong: 0
}

let HalfRB = ['BLACK', 'REO']
let HalfEO = ['EVEN', 'ODD']
let HalfSB = ['SMALL', 'BIG']
let Dozen = ['FIRST', 'SECOND', 'THIRD']
// var resultStats = ''
// var threeCutPlay = {}
// var fourCutPlay = {}

var last_pull_timestamp = date.getTime();
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVpZCI6NDI4MjE5fSwiaWF0IjoxNTk1ODM2ODUzfQ.1YDXUwVIg7kIiYpxYlRPrn06jLtdQ6nG9dufe6MhIIM
registerForEventListening();


function getCurrent() {
    // console.log(current)
    let sum = predictStats.correct + predictStats.wrong + predictStats.tie
    
    let winner_percent = 0
    if (sum != 0) {
        winner_percent = ((predictStats.correct + predictStats.tie) / sum) * 100
    }

    console.log(`tableId : ${tableId} sum = ${sum} bot = ${bot} round = ${round} percent = ${winner_percent}`)

    if (bot != null && round != 0) {
        parentPort.postMessage({
            error: false,
            action: 'getCurrent',
            table_id: tableId,
            info: info,
            predictStats: predictStats,
            round: round,
            bot: bot,
            winner_percent: winner_percent,
            bot: bot,
            table_title: tableId
        })
    } else {
        parentPort.postMessage({
            table_id: tableId,
            table_title: tableId,
            action: 'getCurrent',
            error: true,
            winner_percent: 0,
            bot: null
        })
    }


}

function registerForEventListening() {
    
    tableId = workerData.table
    username = workerData.username
    console.log(`start table ${tableId} - ${username}`)
    inititalInfo()
    // callback method is defined to receive data from main thread
    let cb = (err, result) => {
        if (err) return console.error(err);
        // console.log("Thread id ")

        if (result.action == 'getCurrent') {
            getCurrent()
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

async function inititalInfo() {
    while(cookie == null)
    {
        try{
            cookie = await utils.reCookie(username, password)
            console.log(cookie)
            cookieTime = moment()
            await axios.get(`https://bpweb.bikimex.net/player/singleTable4.jsp?dm=1&t=${tableId}&title=1&sgt=6&hall=1`,
                {
                    headers: {
                        Cookie: cookie
                    }
                })
            isReCookie = false
        }catch(e){
            cookie = null
            isReCookie = true

        }
        
    }
    
    interval = setInterval(predictPlay, 1500);


    // axios.get(`https://truthbet.com/api/table/${workerData.id}?include=dealer,info`,
    //     {
    //         headers: {
    //             Authorization: `Bearer ${token}`
    //         }
    //     })
    //     .then(response => {
    //         // console.log(response.data);
    //         let detail = response.data.info.detail
    //         if (shoe != detail.shoe) {
    //             shoe = detail.shoe
    //             round = detail.round
    //             // predictStatsHistory.push({ ...predictStats })
    //             predictStats = { shoe: shoe, correct: 0, wrong: 0, tie: 0, info: {}, predict: [] }

    //             if (predictStats.predict.length != detail.statistic.length) {
    //                 let i = 1
    //                 for (roundStat of detail.statistic) {
    //                     // console.log(roundStat)
    //                     predictStats.predict.push({ ...roundStat, round: i, bot: null, isResult: true })
    //                     i++

    //                 }
    //             }

    //             if (detail.round > detail.statistic.length) {
    //                 predictStats.predict.push({ round: detail.round, bot: null, isResult: false })
    //             }
    //         }

    //     })
    //     .catch(error => {
    //         console.log(error);
    //     });
}


async function predictPlay() {
    if(isReCookie){
        console.log("reCookie")
        return
    }
    let cookieAge = Math.round((moment() - cookieTime) / 1000)
    // console.log(cookieAge)
    if(previousEventType === 'GP_NEW_GAME_START' && !isPlay && cookieAge > 1120){
        while(cookie != null){
            try{
                cookie = null
                isReCookie = true
                cookie = await utils.reCookie(username, password)
                cookieTime = moment()
                await axios.get(`https://bpweb.bikimex.net/player/singleTable4.jsp?dm=1&t=${tableId}&title=1&sgt=0&hall=1`,
                {
                    headers: {
                        Cookie: cookie
                    }
                })
                isReCookie = false
            }catch(e){
                cookie = null
                continue
            }

            return
        }
        
        
    }

    let balanceAPI = "https://bpweb.bikimex.net/player/query/queryDealerEventV2"
    const ps = new URLSearchParams()
    ps.append('domainType', 1)
    ps.append('queryTableID', tableId)
    ps.append('dealerEventStampTime', 0)

    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookie
        }
    }



    let res = await axios.post(balanceAPI, ps, config)
    // console.log(res.data)
    if(typeof res.data === 'object' && res !== null)
    {
        livePlaying(res.data)
    }else{
        isReCookie = true
        cookie = await utils.reCookie(username, password)
        cookieTime = moment()
        await axios.get(`https://bpweb.bikimex.net/player/singleTable4.jsp?dm=1&t=${tableId}&title=1&sgt=6&hall=1`,
        {
            headers: {
                Cookie: cookie
            }
        })
        isReCookie = false
        return
    }
    
    // let current = new Date().getTime()
    // console.log(current)

    // if(current - last_pull_timestamp < 6500){
    //     // console.log(`${workerData.title} not pull`)
    //     return
    // }else{
    //     // console.log(`${workerData.title}`)
    //     last_pull_timestamp = current
    // }
    // axios.get(`https://truthbet.com/api/table/${workerData.id}?include=dealer,info`,
    //     {
    //         headers: {
    //             Authorization: `Bearer ${token}`
    //         }
    //     })
    //     .then((response) => {
    //         // console.log(response.data);
    //         // console.log(`round = ${response.data.info.detail.round}`)
    //         info = response.data.info.detail
    //         botplay(response.data.info.detail)

    //     })
    //     .catch((error) => {
    //         console.log(`table error ${workerData.id} ${error}`);
    //         if (isPlay == true) {
    //             isPlay = false
    //             parentPort.postMessage({ action: 'played', status: null })
    //         }
    //     });
}

function randomHalfRB() {
    return HalfRB[Math.floor(Math.random() * HalfRB.length)]
}

function randomHalfEO() {
    return HalfEO[Math.floor(Math.random() * HalfEO.length)]
}

function randomHalfSB() {
    return HalfSB[Math.floor(Math.random() * HalfSB.length)]
}

function randomTwoZone() {
    var ret = []
    while (ret.length != 2) {
        let rand = Dozen[Math.floor(Math.random() * Dozen.length)]
        if (ret.indexOf(rand) == -1) {
            ret.push(rand)
        }
    }
    return ret
}

function randomOneZone(twozone) {
    return twozone[Math.floor(Math.random() * twozone.length)]
}

function getRBWinerPercent() {
    let sum = statCount.rbCorrect + statCount.rbWrong
    let win_percent = 50
    if (sum != 0) {
        win_percent = (statCount.rbCorrect / sum) * 100
    }

    if (win_percent < 50) {
        win_percent = 100 - win_percent
    } else {
        win_percent = win_percent
    }

    if (win_percent == 100) {
        win_percent = 91
    }

    return win_percent
}

function getEOWinerPercent() {
    let sum = statCount.edCorrect + statCount.edWrong
    let win_percent = 55
    if (sum != 0) {
        win_percent = (statCount.edCorrect / sum) * 100
    }

    if (win_percent < 50) {
        win_percent = 100 - win_percent
    } else {
        win_percent = win_percent
    }

    if (win_percent == 100) {
        win_percent = 91
    }

    return win_percent
}

function getSBWinerPercent() {
    let sum = statCount.sbCorrect + statCount.sbWrong
    let win_percent = 55
    if (sum != 0) {
        win_percent = (statCount.sbCorrect / sum) * 100
    }

    if (win_percent < 50) {
        win_percent = 100 - win_percent
    } else {
        win_percent = win_percent
    }

    if (win_percent == 100) {
        win_percent = 91
    }

    return win_percent
}

function getTwozoneWinerPercent() {
    let sum = statCount.twoZoneCorrect + statCount.twoZoneWrong
    let win_percent = 55
    if (sum != 0) {
        win_percent = (statCount.twoZoneCorrect / sum) * 100
    }

    if (win_percent < 50) {
        win_percent = 100 - win_percent
    } else {
        win_percent = win_percent
    }

    if (win_percent == 100) {
        win_percent = 91
    }

    return win_percent
}

function getOnezoneWinerPercent() {
    let sum = statCount.oneZoneCorrect + statCount.oneZoneWrong
    let win_percent = 55
    if (sum != 0) {
        win_percent = (statCount.oneZoneCorrect / sum) * 100
    }

    if (win_percent < 50) {
        win_percent = 100 - win_percent
    } else {
        win_percent = win_percent
    }

    if (win_percent == 100) {
        win_percent = 91
    }

    return win_percent
}

async function livePlaying(data){

    // const APP_KEY = 'ef1bd779bdd77aad75f8'
    // const pusher = new Pusher(APP_KEY, {
    //     cluster: 'ap1',
    // });
    // const channel = pusher.subscribe(`game.${tableId}`);
    // // console.log("start", `game.${tableId}`);

    // const io = global['io'];

    const WAITNG_TIME = 29;

    // let liveData = {
    //     status: "",
    //     remaining: 0,
    //     score: {
    //         player: 0,
    //         banker: 0,
    //     },
    //     cards: {
    //         player: [],
    //         banker: [],
    //     },
    //     gameId: null,
    //     predict: null,
    //     round: null,
    //     winner: "-",
    // }
    let previousGameStartAt = moment();
    let botChoice = ["DRAGON", "TIGER"]
    // console.log(data.message)
    let dataJson = JSON.parse(data.message)
    // console.log(dataJson)
    if(dataJson.eventType === "GP_NEW_GAME_START" && previousEventType !== "GP_NEW_GAME_START"){
        previousEventType = "GP_NEW_GAME_START"

        let playCount = predictStats.predict.length
        let lastPlay = { ...predictStats.predict[playCount - 1] }
        if (!lastPlay.isResult && isPlay && playRound < dataJson.gameRound) {
            parentPort.postMessage({
                action: 'played',
                status: status,
                stats: predictStats.predict[playCount - 1],
                shoe: shoe,
                table: workerData,
                bot_type: 2,
                playList: ['RB', 'EO', 'SB', 'ZONE'],
            })
        }

        round = dataJson.gameRound
        console.log(`${tableId}-baccarat-start round ${dataJson.gameShoe}-${dataJson.gameRound}`)
        //console.log(data)
        previousGameStartAt = dataJson.roundStartTime

        if (shoe != dataJson.gameShoe) {
            shoe =  dataJson.gameShoe
            round = dataJson.gameRound
            // predictStatsHistory.push({ ...predictStats })
            predictStats = { shoe: shoe, correct: 0, wrong: 0, tie: 0, info: {}, predict: [] }
            statCount = {
                rbCorrect: 0,
                rbWrong: 0,
                edCorrect: 0,
                edWrong: 0,
                sbCorrect: 0,
                sbWrong: 0,
                twoZoneCorrect: 0,
                twoZoneWrong: 0,
                oneZoneCorrect: 0,
                oneZoneWrong: 0
            }
            if (isPlay) {
                isPlay = false
                bot = null
                parentPort.postMessage({ action: 'played', status: 'FAILED', playList: playList, table: workerData })
            }
            return
        }

        // if (isPlay && playRound < data.round) {
        //     isPlay = false
        //     parentPort.postMessage({ action: 'played', status: 'FAILEO', playList: playList, table: workerData })
        //     return
        // }
        let remainBet = Math.max(WAITNG_TIME - Math.round((moment() - previousGameStartAt) / 1000), 0)
        parentPort.postMessage({ action: 'start', remaining : remainBet, data: dataJson })
        let twozone = randomTwoZone()
        bot = {
            RB: randomHalfRB(),
            EO: randomHalfEO(),
            SB: randomHalfSB(),
            TWOZONE: twozone,
            ONEZONE: randomOneZone(twozone)
        }
        let winPercent = {
            RB: getRBWinerPercent(),
            EO: getEOWinerPercent(),
            SB: getSBWinerPercent(),
            TWOZONE: getTwozoneWinerPercent(),
            ONEZONE: getOnezoneWinerPercent()
        }
        console.log(`remainBet ${remainBet}`)

        if (dataJson.gameRound < 3) {
            bot = null
            predictStats.predict.push({ round: dataJson.gameRound, bot: null, isResult: false })
            if (isPlay && playRound < 4) {
                isPlay = false
                parentPort.postMessage({ action: 'played', status: 'FAILED', playList: playList, table: workerData })
            }
        } else {
            if (remainBet > 17) {

                setTimeout(function () {
                    parentPort.postMessage({
                        action: 'bet', data: {
                            bot: bot,
                            table: tableId,
                            shoe: shoe,
                            round: data.round,
                            game_id: data.id,
                            remaining: remainBet,
                            win_percent: winPercent,
                            playList: ['RB', 'EO', 'SB', 'ZONE']
                        }
                    })
                }, 7000)
               
            } else {
                // parentPort.postMessage({ action: 'played', status: 'FAILEO', playList: ['RB', 'EO', 'SB', 'ZONE'], table: workerData })
            }
            predictStats.predict.push({ round: dataJson.gameRound, bot: bot, isResult: false, winPercent: winPercent })


        }
    }
    else if(dataJson.eventType === "GP_WINNER" && previousEventType !== "GP_WINNER"){
        previousEventType = "GP_WINNER"
        // console.log(`${tableId}-baccarat-result`)
        console.log(`${tableId}-routlette-result`)
        // console.log(data)
        let winner = dataJson.winner;
        let score = dataJson.tableCards[0]
        console.log(score, rotConfig[score])
        let playCount = predictStats.predict.length
        let lastPlay = { ...predictStats.predict[playCount - 1] }
        predictStats.predict[playCount - 1] = { ...lastPlay, isResult: true, data }
        // console.log(bot, winner, lastPlay.bot, isPlay, playRound, round)
        if (bot != null) {

            // parentPort.postMessage({ action: 'clear_static_bet' })
            let status = {
                RB: 'LOSE',
                EO: 'LOSE',
                SB: 'LOSE',
                TWOZONE: 'LOSE',
                ONEZONE: 'LOSE'
            }

            let addition = rotConfig[score]
            parentPort.postMessage({ action: 'point', data: dataJson, result: addition, score: score})
            if (addition.findIndex((item) => item == bot.RB) != -1) {
                statCount.rbCorrect++;
                status.RB = 'WIN'
            } else {
                statCount.rbWrong++;
            }

            if (addition.findIndex((item) => item == bot.EO) != -1) {
                statCount.edCorrect++;
                status.EO = 'WIN'
            } else {
                statCount.edWrong++;
            }

            if (addition.findIndex((item) => item == bot.SB) != -1) {
                statCount.sbCorrect++;
                status.SB = 'WIN'
            } else {
                statCount.sbCorrect++;
            }

            if (addition.findIndex((item) => item == bot.TWOZONE[0]) != -1 ||
                addition.findIndex((item) => item == bot.TWOZONE[1]) != -1) {
                statCount.twoZoneCorrect++;
                status.TWOZONE = 'WIN'
            } else {
                statCount.twoZoneWrong++;
            }

            if (addition.findIndex((item) => item == bot.ONEZONE) != -1) {
                statCount.oneZoneCorrect++;
                status.ONEZONE = 'WIN'
            } else {
                statCount.oneZoneWrong++;
            }
            console.log(status)
            parentPort.postMessage({
                action: 'played',
                status: status,
                stats: predictStats.predict[playCount - 1],
                shoe: shoe,
                table: tableId,
                bot_type: 2,
                playList: ['RB', 'EO', 'SB', 'ZONE'],
            })
            bot = null
        }
        // liveData.winner = winner;
        // liveData.status = "END";
        // await this.calStatBaccarat(tableId, liveData.gameId, winner)
        // await this.updateBetHistory(tableId, liveData.gameId, winner)
        // await this.updateBaccaratStat(tableId, tableTitle)
        // await this.broadcastStat(tableId)
        // setTimeout(() => {
        //     liveData.status = "WAITING"
        // }, 2000);
    }else if(dataJson === 'GP_ONE_CARD_DRAWN'){
        if(isPlay){
            parentPort.postMessage({ action: 'point', data: dataJson })
        }
        
    }

    // channel.bind('deal', async (data) => {
        // console.log(`${tableId}-baccarat-deal`)

        // liveData.status = "OPEN";

        // liveData.score.player = data.score.total.p % 10;
        // liveData.score.banker = data.score.total.b % 10;

        // liveData.cards.player = data.histories.p.card;
        // liveData.cards.banker = data.histories.b.card;
    // });

    // setInterval(async () => {
    //     if (liveData.status == "BETTING") {
    //         liveData.remaining = Math.max(WAITNG_TIME - Math.round((moment() - previousGameStartAt) / 1000), 0)
    //     } else {
    //         liveData.remaining = "-"
    //     }
    //     io.emit(`baccarat-live-${tableId}`, liveData)
    // }, 1000)
}

// function botplay(currentInfo) {
//     if (shoe != currentInfo.shoe) {
//         shoe = currentInfo.shoe
//         round = currentInfo.round
//         // predictStatsHistory.push({ ...predictStats })
//         predictStats = { shoe: shoe, correct: 0, wrong: 0, tie: 0, info: {}, predict: [] }
//         return
//     }
//     round = currentInfo.round
//     let botChoice = ["BANKER", "PLAYER"]
//     let statsCount = currentInfo.statistic.length
//     let playCount = predictStats.predict.length
//     let currentRound = currentInfo.round
//     if (currentInfo.round == 0) {
//         if (isPlay == true) {
//             isPlay = false
//             parentPort.postMessage({ action: 'played', status: null })
//         }
//         return;

//     }

//     // console.log(shoe, round, currentInfo.round, currentInfo.statistic.length, bot)
//     let lastPlay = { ...predictStats.predict[playCount - 1] }
//     let lastStat = { ...currentInfo.statistic[statsCount - 1] }
//     if (playCount == statsCount && lastPlay.isResult == false) {
//         // cal correct wrong and collect stats
//         predictStats.predict[playCount - 1] = { ...lastPlay, isResult: true, ...lastStat }
//         if (bot != null) {
//             let status = ''
//             if (lastStat.winner == 'TIE') {
//                 predictStats.tie++;
//                 status = 'TIE'

//             }
//             else if (lastPlay.bot == lastStat.winner) {
//                 predictStats.correct++;
//                 status = 'WIN'
//             } else {
//                 predictStats.wrong++;
//                 status = 'LOSE'
//             }

//             if (isPlay && playRound == statsCount) {
//                 isPlay = false
//                 parentPort.postMessage({
//                     action: 'played',
//                     status: status,
//                     stats: predictStats.predict[playCount - 1],
//                     shoe: shoe,
//                     table: tableId,
//                     bot_type: 1
//                 })
//             }
//             bot = null
//         }
//     }


//     if (currentInfo.round > playCount) {
//         if (currentInfo.round < 2) {
//             bot = null
//             predictStats.predict.push({ round: currentInfo.round, bot: null, isResult: false })
//         } else {
//             bot = botChoice[Math.floor(Math.random() * botChoice.length)]
//             predictStats.predict.push({ round: currentInfo.round, bot: bot, isResult: false })
//             if (isPlay && playRound == currentInfo.round) {
//                 axios.get(`https://truthbet.com/api/baccarat/${workerData.id}/current`,
//                     {
//                         headers: {
//                             Authorization: `Bearer ${token}`
//                         }
//                     })
//                     .then(response => {
//                         // console.log(response.data);
//                         // console.log(`round = ${response.data.info.detail.round}`)
//                         let current = response.data.game
//                         // console.log(current)
//                         let sum = predictStats.correct + predictStats.wrong + predictStats.tie
//                         let win_percent = 0
//                         if (sum != 0) {
//                             win_percent = ((predictStats.correct + predictStats.tie) / sum) * 100
//                         }

//                         if (win_percent < 50) {
//                             win_percent = 100 - win_percent
//                         } else {
//                             win_percent = win_percent
//                         }

//                         if (win_percent == 100) {
//                             win_percent = 92
//                         }

//                         if (current.round == currentInfo.round && current.remaining > 10) {
//                             parentPort.postMessage({
//                                 action: 'bet', data: {
//                                     bot: bot,
//                                     table: tableId,
//                                     shoe: shoe,
//                                     round: current.round,
//                                     game_id: current.id,
//                                     remaining: current.remaining,
//                                     win_percent: win_percent
//                                 }
//                             })
//                         } else {
//                             parentPort.postMessage({ action: 'played', status: 'FAILEO' })
//                         }

//                     })
//                     .catch(error => {
//                         console.log(`current: ${error}`);
//                         isPlay = false
//                         parentPort.postMessage({ action: 'played', status: 'FAILEO' })
//                     });
//             }


//         }
//     }

//     predictStats.info = { ...currentInfo }
//     round = currentInfo.round
//     // console.log(predictStats.predict)
//     // console.log( `table: ${workerData.id} ${predictStats.correct}, ${predictStats.wrong}, ${predictStats.tie}`)
//     // if(round == currentInfo.round) return;

//     // if(currentInfo.statistic.length != currentInfo.round - 1) return;
//     // round = currentInfo.round

//     // if(bot == null && round > predictStats.predict.length){
//     //     bot = botChoice[Math.floor(Math.random() * botChoice.length)]

//     // }

//     // if(currentInfo.statistic.length < 5){
//     //     predictStats.predict.push({...lastStat, bot: null})
//     // }else{
//     //     predictStats.predict.push({...lastStat, bot: botChoice[Math.floor(Math.random() * botChoice.length)]})
//     //     console.log(predictStats.predict)
//     // }
//     return
// }


// item of list will be multiplied with a factor as per index
function processDataAndSendData(multipleFactor) {

    // updating index
    index++;
    // // now check first length
    // if( workerData.length > index) {
    //     // update value
    //     workerData[index] = workerData[index] * multipleFactor;
    //     // send updated value as notification along with in progress flag as true
    //     parentPort.postMessage({ index, val: workerData[index], isInProgress:true });
    // } else {
    //     // send complete updated list as notification, when processing is done
    //     parentPort.postMessage({ val: workerData, isInProgress:false });
    //     clearInterval(interval);
    // }
}