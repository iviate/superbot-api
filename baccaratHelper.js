const axios = require('./httpClient');

function chooseBaccaratTable(tableId, cookie) {
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

function queryBaccarat(tableId, cookie) {
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
  chooseBaccaratTable,
  queryBaccarat,
};
