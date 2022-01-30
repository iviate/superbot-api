const { reCookie } = require('./utilities');

async function example() {
  const username = '0894958453';
  const password = 'Aa112233';
  const cookie = await reCookie(username, password);
  console.log(cookie);
}

example();
