const cookie = require('./cookie');
const login = require('./login');

module.exports = {
  ...cookie,
  ...login,
};
