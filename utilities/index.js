const cookie = require('./cookie');
const credit = require('./credit');
const login = require('./login');
const sleep = require('./sleep');

module.exports = {
  ...cookie,
  ...credit,
  ...login,
  ...sleep,
};
