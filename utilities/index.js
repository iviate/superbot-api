const cookie = require('./cookie');
const credit = require('./credit');
const login = require('./login');

module.exports = {
  ...cookie,
  ...credit,
  ...login,
};
