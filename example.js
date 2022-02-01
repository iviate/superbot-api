const { reCookie } = require('./utilities');

async function example() {
  const username = 'username';
  const password = 'password';
  const cookie = await reCookie(username, password);
  console.log(cookie);
}

example();
