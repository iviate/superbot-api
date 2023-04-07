const cookie = require('./cookie');
const credit = require('./credit');
const date = require('./date');
const login = require('./login');
const sleep = require('./sleep');

module.exports = {
  ...cookie,
  ...credit,
  ...date,
  ...login,
  ...sleep,
};
