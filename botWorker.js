require('log-timestamp');
const { parentPort, workerData } = require('worker_threads');
const axios = require('./httpClient');
const { bot, user } = require('./app/models');
const { POINT_CONVERSION_COMPRESSED } = require('constants');
const e = require('express');
const db = require('./app/models');
const utils = require('./utils.js');
const { reCookie } = require('./utilities');
const moment = require('moment-timezone');
var qs = require('qs');

var betting = false;

let is_mock = false;
let interval;
let systemData;
let current = {};
let playData;
let botObj;
let token = null;
let betFailed = false;
let playTurn = 1;
let status = 2;
var isStop = false;
var minBet = 50;
var maxBet = 2000;
var turnover = 0;
var is_opposite = false;
var table = null;
var stopLoss = 0;
var stopLossPercent = 0;
var latestBetSuccess = {
  shoe: null,
  round: null,
};
var profit = 0;
var b_tie = false;
var b_tie_val = 0;
var is_connect = false;
var is_reconnect = false;
var userSeToken = null;
var userSeTokenTime = 0;

var bet_time = null;
var maximumBet = 100000;
registerForEventListening();

async function getHistory() {
  if (userSeToken) {
    let w = await utils.getUserHistory(userSeToken);
    parentPort.postMessage({
      action: 'history',
      data: { history: w, id: botObj.userId },
    });
  }
}

async function checkAndReconnect() {
  if (is_reconnect) {
    return;
  }

  if (is_mock) {
    is_connect = true;
    return;
  }

  const user = await db.user.findOne({
    where: {
      id: botObj.userId,
    },
  });

  let reing = false;
  let cTime = parseFloat(userSeTokenTime) || 0;
  let cookieAge = Math.round((moment() - cTime) / 1000);
  // console.log(cookieAge);
  if (cookieAge > 1600 || !userSeToken) {
    is_reconnect = true;
    is_connect = false;
    while (!is_connect) {
      try {
        if (reing) {
          continue;
        }
        // console.log('reconnect with time condition');
        // console.log(user.ufa_account, user.type_password, user.web);
        reing = true;
        // let c = await utils.reCookie(user.ufa_account, user.type_password, user.web)
        let c = await reCookie(user.ufa_account, user.type_password);
        reing = false;
        if (c != null) {
          userSeToken = c;
          userSeTokenTime = moment().valueOf();
          is_connect = true;
          is_reconnect = false;
          await getHistory();
        }
      } catch (error) { }
    }
  } else {
    is_connect = true;
  }
  // else {
  //     let balance = await utils.getUserWallet(userSeTokenTime)
  //     if (balance == null) {
  //         is_reconnect = true
  //         is_connect = false
  //         reing = false
  //         while (!is_connect) {
  //             if (reing) {
  //                 continue
  //             }
  //             console.log('reconnect with logout condition')
  //             console.log(user.ufa_account, user.type_password, user.web)
  //             reing = true
  //             let c = await utils.reCookie(user.ufa_account, user.type_password, user.web)
  //             reing = false
  //             if (c != null) {
  //                 userSeToken = c
  //                 userSeTokenTime = moment().valueOf()
  //                 is_connect = true
  //                 is_reconnect = false
  //                 await getHistory()
  //             }

  //         }
  //     }

  // }
  parentPort.postMessage({
    action: 'connection_status',
    data: { status: is_connect, id: botObj.id },
  });
}

function checkConnection() {
  parentPort.postMessage({
    action: 'connection_status',
    data: { status: is_connect, id: botObj.id },
  });
}

function restartOnlyProfit() {
  axios
    .get(`https://truthbet.com/api/wallet`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      let wallet = res.data.chips.credit;
      if (wallet <= botObj.init_wallet) {
        playData = JSON.parse(botObj.data);
        parentPort.postMessage({
          action: 'restart_result',
          data: { success: true, data: { playData: playData } },
          userId: botObj.userId,
        });
      } else {
        let s = 1;
        let profit = botObj.profit_threshold - wallet;
        let turn = Math.ceil(profit / botObj.init_bet);
        let left = turn;
        let ret = [];
        let state = 1;
        while (left > s) {
          ret.push(s);
          left -= s;
          state = 1;
          if (left < s) break;
          ret.push(s);
          left -= s;
          state = 2;
          if (left < s) break;
          ret.push(s);
          left -= s;
          state = 3;
          if (left < s) break;
          s++;
        }
        if (left > 0) {
          ret.push(left);
        }

        if (ret.length > 21) {
          let turn_left = 0;
          while (ret.length > 21) {
            if (state == 3) {
              s++;
              state = 0;
            }
            turn_left = ret.shift();
            if (turn_left + ret[ret.length - 1] > s) {
              let ses = turn_left + ret[ret.length - 1] - s;
              ret[ret.length - 1] = s;
              ret.push(ses);
              state++;
            } else {
              ret[ret.length - 1] += turn_left;
            }
          }
        }

        playData = ret;
        // console.log(playData)
        parentPort.postMessage({
          action: 'restart_result',
          data: { success: true, data: { playData: playData } },
          userId: botObj.userId,
        });
      }
    })
    .catch((error) => {
      // console.log(error)
      parentPort.postMessage({
        action: 'restart_result',
        data: { success: false, message: error },
        userId: botObj.userId,
      });
    });
}

function restartAll() {
  let s = 1;
  let turn = 0;
  for (let i = 0; i < playData.length; i++) {
    turn += playData[i];
  }
  // let turn = sum(playData)
  let left = turn;
  let ret = [];
  while (left > s) {
    ret.push(s);
    left -= s;
    state = 1;
    if (left < s) break;
    ret.push(s);
    left -= s;
    state = 2;
    if (left < s) break;
    ret.push(s);
    left -= s;
    state = 3;
    if (left < s) break;
    s++;
  }
  if (left > 0) {
    ret.push(left);
  }

  if (ret.length > 21) {
    let turn_left = 0;
    while (ret.length > 21) {
      if (state == 3) {
        s++;
        state = 0;
      }
      turn_left = ret.shift();
      if (turn_left + ret[ret.length - 1] > s) {
        let ses = turn_left + ret[ret.length - 1] - s;
        ret[ret.length - 1] = s;
        ret.push(ses);
        state++;
      } else {
        ret[ret.length - 1] += turn_left;
      }
    }
  }
  playData = ret;
  // console.log(playData)
  parentPort.postMessage({
    action: 'restart_result',
    data: { success: true, data: { playData: playData } },
    userId: botObj.userId,
  });
}

function restartXSystem(type) {
  if (type == 1) {
    restartOnlyProfit();
  } else if (type == 2) {
    restartAll();
  }
}

function getBetVal() {
  let betval = 0;
  if (botObj.money_system == 1) {
    betval = botObj.init_bet;
  } else if (
    botObj.money_system == 2 ||
    botObj.money_system == 5 ||
    botObj.money_system == 6
  ) {
    betval = playData[playTurn - 1];
  } else if (botObj.money_system == 3) {
    if (playData.length == 1) {
      betval = playData[0] * (botObj.init_bet / 2);
    } else {
      betval =
        (playData[0] + playData[playData.length - 1]) * (botObj.init_bet / 2);
    }
  } else if (botObj.money_system == 4) {
    if (playData.length == 1) {
      betval = playData[0] * botObj.init_bet;
    } else {
      betval = (playData[0] + playData[playData.length - 1]) * botObj.init_bet;
    }
  } else if (botObj.money_system == 9) {
    betval = playData[playTurn - 1];
  }

  let mod = ~~(betval % 10);
  // console.log(mod, betval)
  if (mod != 0 && mod != 5) {
    if (mod < 5) {
      betval = Math.floor(betval / 10) * 10 + 5;
    } else if (mod > 5) {
      betval = Math.ceil(betval / 10) * 10;
    }
  }

  return ~~betval;
}

async function getBetLimitCode(betSide, value) {
  if (value <= 50) {
    return '110901';
  }
  if (value > 200) {
    return '120903';
  }

  return '110912'
}

async function bet(data) {
  // console.log(`start baccarat success ${botObj.userId}`, data);
  table = data.table;
  // console.log(status, betFailed, botObj.bet_side, botObj.is_infinite)
  if (betFailed) {
    return;
  }

  if (!is_connect) {
    return;
  }

  if (is_reconnect) {
    return;
  }

  if (isStop) {
    return;
  }

  if (betting) {
    return;
  }

  if (current.shoe == data.shoe && current.round == data.round) {
    betFailed = false;
    return;
  }

  if (status == 2) {
    // console.log(`bot ${workerData.obj.userId} pause`)
  } else if (status == 3) {
    // console.log(`bot ${workerData.obj.userId} stop`)
  } else if (botObj.bet_side == 2 && data.bot == 'BANKER') {
  } else if (botObj.bet_side == 3 && data.bot == 'PLAYER') {
  } else {
    try {
      betting = true;
      // console.log(data)
      // console.log("bot start play")
      let betVal = getBetVal();
      // console.log(`betVal : ${betVal}`)
      if (betVal < botObj.init_bet) {
        betVal = botObj.init_bet;
      } else if (betVal > botObj.maximum_bet) {
        betVal = botObj.maximum_bet;
      }

      // if(!is_mock){
      //     if (betVal > maxBet) {
      //         // console.log('upgrade bet limit')
      //         let payload = { games: { baccarat: { range: "medium" } } }

      //         axios.post(`https://truthbet.com/api/m/settings/limit`, payload, {
      //             headers: {
      //                 Authorization: `Bearer ${workerData.obj.token}`
      //             }
      //         }).then(res => {
      //             minBet = 200
      //             maxBet = 10000
      //         })
      //             .catch(error => {
      //                 // console.log(error)
      //             })
      //         return

      //     } else if (betVal < minBet) {
      //         // console.log('dowgrade bet limit')
      //         let payload = { games: { baccarat: { range: "newbie" } } }

      //         axios.post(`https://truthbet.com/api/m/settings/limit`, payload, {
      //             headers: {
      //                 Authorization: `Bearer ${workerData.obj.token}`
      //             }
      //         }).then(res => {
      //             minBet = 50
      //             maxBet = 2500
      //         })
      //             .catch(error => {
      //                 // console.log(error)
      //             })
      //         return
      //     }
      // }

      let payload = { table_id: data.table, game_id: data.game_id };
      let realBet = data.bot;
      let categoryId = 0;
      // console.log(data.bot)
      if (data.bot == 'PLAYER' && is_opposite == false) {
        payload.chip = { credit: { PLAYER: betVal } };
        realBet = 'Player';
        categoryId = 1;
      } else if (data.bot == 'BANKER' && is_opposite == false) {
        payload.chip = { credit: { BANKER: betVal } };
        realBet = 'Banker';
      } else if (data.bot == 'PLAYER' && is_opposite == true) {
        payload.chip = { credit: { BANKER: betVal } };
        realBet = 'Banker';
      } else if (data.bot == 'BANKER' && is_opposite == true) {
        payload.chip = { credit: { PLAYER: betVal } };
        realBet = 'Player';
        categoryId = 1;
      } else {
        return;
      }

      // console.log(data.bot, realBet, is_opposite)

      if (!is_mock) {
        const user = await db.user.findOne({
          where: {
            id: botObj.userId,
          },
        });
        let bData = [
          { categoryIdx: categoryId, categoryName: realBet, stake: betVal },
        ];
        if (b_tie) {
          bData.push({ categoryIdx: 2, categoryName: 'Tie', stake: b_tie_val });
        }
        let betLimiCode = await getBetLimitCode(botObj.bet_side, betVal);
        // console.log(botObj.userId, realBet, betVal, betLimiCode);
        var pData = qs.stringify({
          domainType: '1',
          tableID: data.table.toString(),
          gameShoe: data.shoe.toString(),
          gameRound: data.round.toString(),
          data: JSON.stringify(bData),
          betLimitID: betLimiCode, // 11901 20 - 5000, 110902 100 - 10000,
          f: '-1',
          c: 'A',
        });
        var config = {
          method: 'post',
          url: 'https://bpweb.siebamex777.com/player/update/addMyTransaction',
          headers: {
            Cookie: userSeToken,
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
          },
          data: pData,
        };
        let res = null;
        try {
          res = await axios(config);
          // console.log(`betting baccarat success ${botObj.userId}`, e);
        } catch (e) {
          // console.log(`error betting baccarat ${botObj.userId}`, e);
          // console.log('');
        }

        let message = {};
        if (res.data.message != undefined && res.data.message) {
          // console.log(res.data.message)
          try {
            message = JSON.parse(res.data.message);
          } catch (e) {
            message = {};
            // console.log(res.data);
          }

          // console.log('convert message <<<<', message)
        }

        if (res == null || res.data.status != 200) {
          // console.log(res.data)
          parentPort.postMessage({
            action: 'bet_failed',
            botObj: botObj,
            error: res.data,
          });
          betFailed = false;
          betting = false;
        } else if (
          res.data.status == 200 &&
          message.txns != undefined &&
          message.txns[0].success == true
        ) {
          turnover += betVal;
          current = {
            bot: data.bot,
            bet: realBet,
            shoe: data.shoe,
            round: data.round,
            table_id: data.table,
            betVal: betVal,
            playTurn: playTurn,
            botObj: botObj,
            is_opposite: is_opposite,
          };
          parentPort.postMessage({
            action: 'bet_success',
            data: {
              ...data,
              betVal: betVal,
              current: current,
              botObj: botObj,
              turnover: turnover,
              bet: realBet,
            },
          });
          betFailed = true;
          betting = false;
        } else {
          parentPort.postMessage({
            action: 'bet_failed',
            botObj: botObj,
            error: res.data,
          });
          betFailed = false;
          betting = false;
        }

        // let betAPI = "https://bpweb.bikimex.net/player/update/addMyTransaction"
        // let bData = [{"categoryIdx":1,"categoryName":realBet,"stake":betVal}]
        // console.log(bData, data.table, data.shoe, data.round)

        // const ps = new URLSearchParams()
        // ps.append('domainType', '1')
        // ps.append('tableID', data.table)
        // ps.append('gameShoe', data.shoe)
        // ps.append('gameRound', data.round)
        // ps.append('data', bData)
        // ps.append('betLimitID', 110901)
        // ps.append('f', -1)
        // ps.append('c', 'A')

        // const user = await db.user.findOne({
        //     where: {
        //         id: botObj.userId
        //     },
        // })

        // console.log(user.cookie)

        // const config = {
        //     headers: {
        //         'Content-Type': 'application/x-www-form-urlencoded',
        //         'Cookie': user.cookie
        //     }
        // }

        // let res = await axios.post(betAPI, ps, config)

        // console.log(res.data)
        // if(res.data.status == 200){
        //     turnover += betVal
        //     current = { bot: data.bot, bet: realBet, shoe: data.shoe, round: data.round, table_id: data.table, betVal: betVal, playTurn: playTurn, botObj: botObj, is_opposite: is_opposite }
        //     parentPort.postMessage({ action: 'bet_success', data: { ...data, betVal: betVal, current: current, botObj: botObj, turnover: turnover, bet: realBet } })
        //     betFailed = true
        // }else{
        //     parentPort.postMessage({ action: 'bet_failed', botObj: botObj, error: res.data })
        //     betFailed = false
        // }
        // let res = await axios.post(balanceAPI, ps, config)
        // axios.post(`https://truthbet.com/api/bet/baccarat`, payload,
        //     {
        //         headers: {
        //             Authorization: `Bearer ${token}`,
        //             'content-type': 'application/json'
        //         }
        //     })
        //     .then(response => {
        //         // console.log(response.data);
        //         turnover += betVal
        //         current = { bot: data.bot, bet: realBet, shoe: data.shoe, round: data.round, table_id: data.table, betVal: betVal, playTurn: playTurn, botObj: botObj, is_opposite: is_opposite }
        //         parentPort.postMessage({ action: 'bet_success', data: { ...data, betVal: betVal, current: current, botObj: botObj, turnover: turnover, bet: realBet } })
        //         betFailed = true
        //     })
        //     .catch(error => {
        //         if (error.response.data.code != 500 && error.response.data.code != "toomany_requests") {
        //             betFailed = true
        //         } else {
        //             betFailed = false
        //         }
        //         parentPort.postMessage({ action: 'bet_failed', botObj: botObj, error: error.response.data.error })
        //     });
      } else {
        turnover += betVal;
        current = {
          bot: data.bot,
          bet: realBet,
          shoe: data.shoe,
          round: data.round,
          table_id: data.table.id,
          betVal: betVal,
          playTurn: playTurn,
          botObj: botObj,
          is_opposite: is_opposite,
        };
        parentPort.postMessage({
          action: 'bet_success',
          data: {
            ...data,
            betVal: betVal,
            current: current,
            botObj: botObj,
            turnover: turnover,
            bet: realBet,
          },
        });
        betFailed = true;
        bet_time = Date.now();
        betting = false;
      }
    } catch (error) {
      // console.log(`bet_baccarat ${botObj.userId} main error `, error);
    }
    betting = false;
  }
}

function genLeftProfitLabaushare(wallet) {
  let half_bet = botObj.init_bet / 2;
  let leftProfit =
    botObj.init_wallet +
    botObj.profit_wallet +
    (botObj.profit_threshold - botObj.init_wallet) -
    wallet;
  let turn = 2;
  let money = leftProfit / turn / half_bet;
  while (turn < 20 && leftProfit / turn / half_bet >= 1) {
    money = leftProfit / turn / half_bet;
    turn++;
  }
  turn -= 1;
  money = Math.ceil(money * 10) / 10;
  let ret = [];
  // console.log(`turn = ${turn} money = ${money * init_bet}`)
  for (let i = 0; i < turn; i++) {
    ret.push(money);
  }

  return ret;
}

function genLeftProfitXSystem(wallet) {
  let s = 1;
  let leftProfit =
    botObj.init_wallet +
    botObj.profit_wallet +
    (botObj.profit_threshold - botObj.init_wallet) -
    wallet;
  let turn = Math.ceil(leftProfit / botObj.init_bet);
  let left = turn;
  let ret = [];
  let state = 1;
  while (left > s) {
    ret.push(s);
    left -= s;
    state = 1;
    if (left < s) break;
    ret.push(s);
    left -= s;
    state = 2;
    if (left < s) break;
    ret.push(s);
    left -= s;
    state = 3;
    if (left < s) break;
    s++;
  }
  if (left > 0) {
    ret.push(left);
  }

  if (ret.length > 21) {
    let turn_left = 0;
    while (ret.length > 21) {
      if (state == 3) {
        s++;
        state = 0;
      }
      turn_left = ret.shift();
      if (turn_left + ret[ret.length - 1] > s) {
        let ses = turn_left + ret[ret.length - 1] - s;
        ret[ret.length - 1] = s;
        ret.push(ses);
        state++;
      } else {
        ret[ret.length - 1] += turn_left;
      }
    }
  }
  return ret;
}

async function processResultBet(betStatus, botTransactionId, botTransaction) {
  // console.log('processResultBet')
  if (botObj.money_system == 1) {
  } else if (botObj.money_system == 2 || botObj.money_system == 5) {
    if (
      (betStatus == 'WIN' && current.is_opposite == false) ||
      (betStatus == 'LOSE' && current.is_opposite == true)
    ) {
      playTurn = 1;
    } else if (
      (betStatus == 'LOSE' && current.is_opposite == false) ||
      (betStatus == 'WIN' && current.is_opposite == true)
    ) {
      playTurn += 1;
      if (playTurn > playData.length) {
        playTurn = 1;
      }
    }
  } else if (botObj.money_system == 3 || botObj.money_system == 4) {
    if (
      (betStatus == 'WIN' && current.is_opposite == false) ||
      (betStatus == 'LOSE' && current.is_opposite == true)
    ) {
      playData = playData.splice(1, playData.length - 2);
    } else if (
      (betStatus == 'LOSE' && current.is_opposite == false) ||
      (betStatus == 'WIN' && current.is_opposite == true)
    ) {
      if (playData.length == 1) {
        playData.push(Math.ceil(playData[0] * 10) / 10);
      } else {
        playData.push(
          Math.ceil((playData[0] + playData[playData.length - 1]) * 10) / 10
        );
      }
    }
  } else if (botObj.money_system == 9) {
    if (
      (betStatus == 'WIN' && current.is_opposite == false) ||
      (betStatus == 'LOSE' && current.is_opposite == true)
    ) {
      playTurn -= 2;
      if (playTurn < 1) {
        playTurn = 1;
      }
    } else if (
      (betStatus == 'LOSE' && current.is_opposite == false) ||
      (betStatus == 'WIN' && current.is_opposite == true)
    ) {
      playTurn += 1;
    }
  } else if (botObj.money_system == 6) {
    if (
      (betStatus == 'WIN' && current.is_opposite == false) ||
      (betStatus == 'LOSE' && current.is_opposite == true)
    ) {
      playTurn += 1;
      if (playTurn > playData.length) {
        playTurn = 1;
      }
    } else if (
      (betStatus == 'LOSE' && current.is_opposite == false) ||
      (betStatus == 'WIN' && current.is_opposite == true)
    ) {
      playTurn = 1;
    }
  }

  if (!is_mock) {
    const user = await db.user.findOne({
      where: {
        id: botObj.userId,
      },
    });
    let currentWallet = 0;
    // console.log(`bac ${botObj.userId} wallet ${currentWallet}`);

    if (
      (betStatus == 'WIN' && current.is_opposite == false) ||
      (betStatus == 'LOSE' && current.is_opposite == true)
    ) {
      // console.log("process :::: " , current.bet.toLowerCase(), current.betVal)
      if (current.bet.toLowerCase() == 'player') {
        profit += current.betVal;
      } else {
        profit += current.betVal * 0.95;
      }
    } else if (
      (betStatus == 'LOSE' && current.is_opposite == false) ||
      (betStatus == 'WIN' && current.is_opposite == true)
    ) {
      profit -= current.betVal;
    }
    currentWallet = botObj.init_wallet + profit;

    let cutProfit =
      botObj.init_wallet +
      Math.floor(((botObj.profit_threshold - botObj.init_wallet) * 94) / 100);
    if (playData.length == 0) {
      if (
        botObj.is_infinite == false &&
        currentWallet - botObj.profit_wallet >= cutProfit
      ) {
        isStop = true;
      } else {
        // if (botObj.money_system == 3) {
        //     playData = genLeftProfitLabaushare(currentWallet)
        // } else if (botObj.money_system == 4) {
        //     playData = genLeftProfitXSystem(currentWallet)
        // }
        playData = JSON.parse(botObj.data);
        // console.log('re labuashare')
        // console.log(playData)
      }
    }

    // console.log(currentWallet, cutProfit)
    if (
      botObj.is_infinite &&
      currentWallet - botObj.profit_wallet >= cutProfit
    ) {
      db.bot
        .findOne({
          where: {
            id: botObj.id,
          },
        })
        .then((b) => {
          let amount =
            currentWallet - botObj.profit_wallet - botObj.init_wallet;
          b.profit_wallet += amount;
          b.deposite_count += 1;
          botObj.profit_wallet += amount;
          botObj.deposite_count += 1;
          playData = JSON.parse(botObj.data);
          playTurn = 1;
          // console.log(botObj.profit_wallet, b.profit_wallet)
          b.save();
          db.wallet_transfer
            .create({ botId: botObj.id, amount: amount })
            .then((created) => { });
          parentPort.postMessage({
            action: 'process_result',
            status: betStatus,
            wallet: currentWallet,
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
          });
        });
    } else {
      if (botObj.is_infinite && playData.length === 0) {
        playData = JSON.parse(botObj.data);
      }
      // console.log(currentWallet - botObj.profit_wallet <= botObj.loss_threshold, currentWallet > 50)
      if (
        parseInt(currentWallet) - parseInt(botObj.profit_wallet) <=
        parseInt(botObj.loss_threshold) + 1
      ) {
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
          turnover: turnover,
          is_mock: is_mock,
        });
      } else {
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
          turnover: turnover,
          is_mock: is_mock,
        });
      }
    }

    // let cTime = parseFloat(user.cookieTime) || 0
    // let cookieAge = Math.round((moment() - cTime) / 1000)
    // // console.log(cookieAge)
    // if (cookieAge > 1500 || !user.cookie) {
    //     let c = await utils.reCookie(user.ufa_account, user.type_password, user.web)
    //     user.cookie = c
    //     user.cookieTime = moment().valueOf()
    //     user.save()
    // }
  } else {
    // console.log('process result mock')
    db.user
      .findOne({
        where: {
          id: botObj.userId,
        },
      })
      .then(async (u) => {
        if (
          (betStatus == 'WIN' && current.is_opposite == false) ||
          (betStatus == 'LOSE' && current.is_opposite == true)
        ) {
          // console.log("process :::: " , current.bet.toLowerCase(), current.betVal)
          if (current.bet.toLowerCase() == 'player') {
            u.mock_wallet += current.betVal;
          } else {
            u.mock_wallet += current.betVal * 0.95;
          }
        } else if (
          (betStatus == 'LOSE' && current.is_opposite == false) ||
          (betStatus == 'WIN' && current.is_opposite == true)
        ) {
          u.mock_wallet -= current.betVal;
        }
        let currentWallet = u.mock_wallet;
        u.save();
        // console.log(u)

        let cutProfit =
          botObj.init_wallet +
          Math.floor(
            ((botObj.profit_threshold - botObj.init_wallet) * 94) / 100
          );
        if (playData.length == 0) {
          if (
            botObj.is_infinite == false &&
            currentWallet - botObj.profit_wallet >= cutProfit
          ) {
            isStop = true;
          } else {
            // if (botObj.money_system == 3) {
            //     playData = genLeftProfitLabaushare(currentWallet)
            // } else if (botObj.money_system == 4) {
            //     playData = genLeftProfitXSystem(currentWallet)
            // }
            playData = JSON.parse(botObj.data);
            // console.log('re labuashare')
            // console.log(playData)
          }
        }

        // console.log(currentWallet, cutProfit)
        if (
          botObj.is_infinite &&
          currentWallet - botObj.profit_wallet >= cutProfit
        ) {
          db.bot
            .findOne({
              where: {
                id: botObj.id,
              },
            })
            .then((b) => {
              let amount =
                currentWallet - botObj.profit_wallet - botObj.init_wallet;
              b.profit_wallet += amount;
              b.deposite_count += 1;
              botObj.profit_wallet += amount;
              botObj.deposite_count += 1;
              playData = JSON.parse(botObj.data);
              playTurn = 1;
              // console.log(botObj.profit_wallet, b.profit_wallet)
              b.save();
              db.wallet_transfer
                .create({ botId: botObj.id, amount: amount })
                .then((created) => { });
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
                bet_time: bet_time,
              });
            });
        } else {
          if (botObj.is_infinite && playData.length === 0) {
            playData = JSON.parse(botObj.data);
          }
          // console.log(currentWallet - botObj.profit_wallet <= botObj.loss_threshold, currentWallet > 50)
          if (
            parseInt(currentWallet) - parseInt(botObj.profit_wallet) <=
            parseInt(botObj.loss_threshold) + 1
          ) {
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

            // if (new_loss_percent > 100 || new_loss <= 0) {
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
            parentPort.postMessage({
              action: 'info',
              botObj: botObj,
              playData: playData,
              turnover: turnover,
              userId: botObj.userId,
              table: table,
              current: current,
            });
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
              isStop: true,
              turnover: turnover,
              is_mock: is_mock,
              bet_time: bet_time,
            });
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
              bet_time: bet_time,
            });
          }
        }
      });
  }
}
async function registerForEventListening() {
  is_mock = workerData.is_mock;
  playData = workerData.playData;
  botObj = workerData.obj;
  b_tie_val = botObj.b_tie_val;
  b_tie = botObj.b_tie;
  stopLoss = botObj.init_wallet - botObj.loss_threshold;
  stopLossPercent = botObj.loss_percent;
  token = workerData.obj.token;
  require('./log-console.js')('botWorker', botObj.userId)
  await checkAndReconnect();
  await getHistory();
  // if (botObj.bet_limit == "260901") {
  //     maxBet = 10000
  // }
  // console.log(`${workerData.obj.id} hello`)

  // axios.get(`https://truthbet.com/api/m/settings/limit`, {
  //     headers: {
  //         Authorization: `Bearer ${workerData.obj.token}`
  //     }
  // })
  //     .then(res => {
  //         let userConfig = res.data.userConfig
  //         if (userConfig.package == 'rookie') {
  //             minBet = 100
  //             maxBet = 5000
  //         } else if (userConfig.package == 'medium') {
  //             minBet = 200
  //             maxBet = 10000
  //         }
  //     })
  //     .catch(error => {
  //         // console.log(error)
  //     })
  // callback method is defined to receive data from main thread
  let cb = (err, result) => {
    if (err) return console.error(err);
    if (result.action == 'bet') {
      bet(result.data);
    }
    if (result.action == 'check_connection') {
      checkConnection();
    }
    if (result.action == 'get_history') {
      getHistory();
    }
    if (result.action == 'check_reconnect') {
      checkAndReconnect();
    }
    if (result.action == 'info') {
      parentPort.postMessage({
        action: 'info',
        botObj: botObj,
        playData: playData,
        turnover: turnover,
        userId: botObj.userId,
        table: table,
        current: current,
      });
    }
    if (result.action == 'result_bet') {
      // console.log('action result_bet')
      betFailed = false;
      // console.log(result)
      // console.log(current)
      if (
        result.table == current.table &&
        result.round == current.round &&
        result.shoe == current.shoe
      ) {
        processResultBet(
          result.status,
          result.botTransactionId,
          result.botTransaction
        );
      }
    }
    if (result.action == 'set_opposite') {
      // console.log(`set_opposite ${result.is_opposite}`)
      botObj.is_opposite = result.is_opposite;
      is_opposite = result.is_opposite;
      parentPort.postMessage({
        action: 'info',
        botObj: botObj,
        playData: playData,
        turnover: turnover,
        userId: botObj.userId,
        table: table,
        current: current,
      });
    }

    if (result.action == 'set_bet_side') {
      // console.log(`set_opposite ${result.is_opposite}`)
      botObj.bet_side = result.bet_side;
      parentPort.postMessage({
        action: 'info',
        botObj: botObj,
        playData: playData,
        turnover: turnover,
        userId: botObj.userId,
        table: table,
        current: current,
      });
      // bet_side = result.bet_side
    }

    if (result.action == 'set_tie') {
      // console.log(`set_opposite ${result.is_opposite}`)
      botObj.b_tie = result.b_tie;
      botObj.b_tie_val = result.b_tie_val;
      b_tie = result.b_tie;
      b_tie_val = result.b_tie_val;
      parentPort.postMessage({
        action: 'info',
        botObj: botObj,
        playData: playData,
        turnover: turnover,
        userId: botObj.userId,
        table: table,
        current: current,
      });
      // bet_side = result.bet_side
    }

    if (result.action == 'pause') {
      botObj.status = 2;
      status = 2;
    }
    if (result.action == 'start') {
      botObj.status = 1;
      status = 1;
      // betFailed = false
    }
    if (result.action == 'stop') {
      // console.log('action stop')
      isStop = true;
      status = 3;
      botObj.status = 3;
      db.bot
        .findOne({
          where: {
            id: botObj.id,
          },
        })
        .then((b) => {
          b.turnover = turnover;
          // console.log(`turn over stop ${turnover}`)
          b.save();
          process.exit(0);
        });
    }
    if (result.action == 'restart') {
      if (botObj.money_system != 4) {
        parentPort.postMessage({
          action: 'restart_result',
          data: { success: false, message: 'บอทไม่ใด้เดินเงินแบบ X System' },
          userId: botObj.userId,
        });
      } else if (status != 2) {
        parentPort.postMessage({
          action: 'restart_result',
          data: { success: false, message: 'โปรดหยุดบอทก่อนรีสตาร์ท' },
          userId: botObj.userId,
        });
      } else {
        restartXSystem(result.type);
      }
    }
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
