const axios = require('./httpClient');

function chooseDtTable(tableId, cookie) {
  return axios({
    method: 'post',
    url: 'https://bpweb.siebamex777.com/player/query/chooseSingleTableChannel',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    },
    data: `queryTableID=${tableId}`,
  });
}

function queryDt(tableId, cookie) {
  return axios({
    method: 'post',
    url: 'https://bpweb.siebamex777.com/player/query/queryDealerEventV2',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      cookie: cookie,
      'x-requested-with': 'XMLHttpRequest',
    },
    data: `domainType=1&queryTableID=${tableId}&dealerEventStampTime=0`,
  });
}

module.exports = {
  chooseDtTable,
  queryDt,
};
