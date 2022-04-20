const { getCredit, reCookie } = require('./utilities');

async function example() {
  const username = 'username';
  const password = 'password';
  const cookie = await reCookie(username, password);

  const userToken = 'token';
  const creditResponse = await getCredit(username, userToken);

  console.log(cookie);
  console.log(creditResponse); // { success: true, credit: 0.14 }
}

example();
