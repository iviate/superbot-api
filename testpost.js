var axios = require('axios');
var qs = require('qs');

let tableId = 3;
let shoe = 34635;
let round = 6
let bet = 'Player'
let betVal = 20
let bdata = [{"categoryIdx":1,"categoryName":bet,"stake":betVal}]

var data = qs.stringify({
 'domainType': '1',
'tableID': tableId.toString(),
'gameShoe': shoe.toString(),
'gameRound': round.toString(),
'data': JSON.stringify(bdata),
'betLimitID': '110901',
'f': '-1',
'c': 'A' 
});
var config = {
  method: 'post',
  url: 'https://bpweb.semgbow777.com/player/update/addMyTransaction',
  headers: { 
    'Cookie': 'visid_incap_1269746=me3DFFnUR6uuqj7shn0obp6uwl4AAAAAQUIPAAAAAADVxrR7iO5RIGukVqZ9KfWR; load_balancer=e8f510afde8d4f8580a47a8edcea2bd6; _ga=GA1.2.1124003114.1589816967; ROUTEID=.bacweb03; nlbi_1269746=Vv4FD7ELhWK+kpf3Y5KApwAAAADWVcieAfz9MtWJIDIkSNNe; incap_ses_338_1269746=7tx5LtSG1R3K1bwTedGwBJarJGAAAAAAZaVA1Y1L65YrLVESnYwqYQ==; rcr=987; _gid=GA1.2.1270742777.1613015956; JSESSIONID=88B80922D9A9C3A3525DFAB424C1BF43; _gat_gtag_UA_153578037_2=1', 
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  data : data
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});
