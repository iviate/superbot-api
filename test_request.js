var request = require('request');
var options = {
  'method': 'POST',
  'url': 'https://imba66.com/users/sign_in',
  'headers': {
    'Cookie': '_mm8bet_web_session=JPNi%2BBuZEarjLCxUXrrnyAohAOBntA%2F%2FC3RxbbM7e0fjhGLeV4EsNm%2Fl6CY8u86DRR5tKSlql9j23FcFHuQSPRlbnJMkgBFbyat46gQL5DsknKUowkyRYTCt4%2B7%2FvIhiZR35korjHzpRSGqXox45drp5GcVwfdp55L4BohZZlz1ZGAQBi4XLlXxbRioVhgB%2FHBegjbtzaxVg2ljXZDe6uk9Cn84JKMyClfnpA6ZFq4DYwFBBJl8%3D--62PU%2F%2FZwI3%2BzUTuQ--ZywlS883CRUB5guO%2FcHKTg%3D%3D'
  },
  formData: {
    'user[username]': '0643258932',
    'user[password]': 'ฤฟ696969'
  }
};

request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
  console.log(response.headers['set-cookie'])
  let cookie = response.headers['set-cookie'].join()
  var options2 = {
    'method': 'GET',
    'url': 'https://imba66.com/member',
    'headers': {
      'Cookie': cookie
    }
  };
  request(options2, function (error, response) {
    if (error) throw new Error(error);
    // console.log(response.body);
  });
  

var options3 = {
  'method': 'GET',
  'url': 'https://imba66.com/member/gamelink?vendor=sexy&game_id=undefined&game_code=undefined&mobile=false',
  'headers': {
    'Cookie': '_mm8bet_web_session=Krpr4KBz20TPHKWsO3stuBQKkx%2FeVkET3Ko4g%2BkDlP7uZteGj0Bfrl4yY3pY%2BPK5SbWB58l%2BA%2BhhVogLy3QtxwmuJ%2F4ecO9hBNL0jTX2j0SAqPtv4p3tNG5KFFXPzeQwHyyNIFgSJgzYYm8W7axAamXoaqUDiZmdf9ToFmBZgBr7xCU1jr3W8Avtz0UlRipKJ5x%2BKWaICkd4hzrsH7d%2B4CMN0pWzSC6pLIC72vj4AvR7%2Fy%2FHmOc%3D--%2Bdp3z0gDmKyOr6tV--xzEs69rIOhpnnKCMVxI5Mw%3D%3D'
  }
};
request(options3, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
  const obj = JSON.parse(response.body);
  console.log(obj.data);
  var options4 = {
    'method': 'GET',
    'url': obj.data
  };
  request(options4, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.headers['set-cookie']);
    var options5 = {
        'method': 'POST',
        'url': 'https://bpweb.semgbow777.com/player/query/queryBalancePC',
        'headers': {
          'Cookie': response.headers['set-cookie'].join(),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
          'dm': '1',
          'hallType': '1'
        }
      };
      request(options5, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
      });
      
  });
  

});

});


