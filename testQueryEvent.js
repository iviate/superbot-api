require('dotenv').config();
const axios = require('axios');

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
}

async function queryRou() {
  const tableId = 71; // 71

  const chRes = await chooseRouletteTable(tableId, user.cookie);

  console.log(chRes.data);

  const res = await queryRoulette(tableId, user.cookie);

  console.log(res.data);
}

async function main() {
  // await login();
  // await queryDT();
  // await queryBac();
  await queryRou();
}

main();
