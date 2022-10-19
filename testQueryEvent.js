require('dotenv').config();
const axios = require('axios');
const qs = require('qs');

const { chooseBaccaratTable, queryBaccarat } = require('./baccaratHelper');
const { chooseDtTable, queryDt } = require('./dtHelper');
const { chooseRouletteTable, queryRoulette } = require('./rouletteHelper');
const { reCookie } = require('./utilities');

const user = {
  username: 'asdf',
  password: 'asdf',
  cookie: '',
};

async function login() {
  let cookie = await reCookie(user.username, user.password);
  user.cookie = cookie;
  console.log(user.username, user.password, 'login success', cookie);
}

async function queryDT() {
  const tableId = 31; // 31, 32

  const chRes = await chooseDtTable(tableId, user.cookie);

  console.log(chRes.data);

  const res = await queryDt(tableId, user.cookie);

  console.log(res.data);
}

async function queryBac() {
  const tableId = 1; // 1, 2

  const chRes = await chooseBaccaratTable(tableId, user.cookie);

  console.log(chRes.data);

  const res = await queryBaccarat(tableId, user.cookie);

  console.log(res.data);

  return res;
}

async function queryRou() {
  const tableId = 71; // 71

  const chRes = await chooseRouletteTable(tableId, user.cookie);

  console.log(chRes.data);

  const res = await queryRoulette(tableId, user.cookie);

  console.log(res.data);
}

async function betBac(bacEvent, cookie) {
  const bacData = JSON.parse(bacEvent.message);
  if (bacData.eventType !== 'GP_NEW_GAME_START') {
    console.log('not new game start', bacData.eventType);
    return;
  }

  const pData = qs.stringify({
    domainType: '1',
    tableID: bacData.tableID.toString(),
    gameShoe: bacData.gameShoe.toString(),
    gameRound: bacData.gameRound.toString(),
    data: JSON.stringify([
      { categoryIdx: 1, categoryName: 'PLAYER', stake: 20 },
    ]),
    betLimitID: '110901', // 11901 20 - 5000, 110902 100 - 10000,
    f: '-1',
    c: 'A',
  });
  var config = {
    method: 'post',
    url: 'https://bpweb.siebamex777.com/player/update/addMyTransaction',
    headers: {
      Cookie: user.cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    },
    data: pData,
  };
  const res = await axios(config);
  console.log(res.data);

  return res;
}

async function main() {
  // await login();
  // await queryDT();
  const bacEvent = await queryBac();
  const betRes = await betBac(bacEvent.data);
  // await queryRou();
}

main();
