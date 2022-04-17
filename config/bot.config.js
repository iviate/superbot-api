let user = {};
try {
  user = JSON.parse(process.env.BOT_USER);
} catch (error) {
  user = {
    1: {
      username: process.env.BOT_USER_1 || '0899999901',
      pwd: process.env.BOT_PASSWORD_1 || '1111',
    },
    2: {
      username: process.env.BOT_USER_2 || '0899999902',
      pwd: process.env.BOT_PASSWORD_2 || '2222',
    },
    3: {
      username: process.env.BOT_USER_3 || '0899999903',
      pwd: process.env.BOT_PASSWORD_3 || '3333',
    },
    4: {
      username: process.env.BOT_USER_4 || '0899999904',
      pwd: process.env.BOT_PASSWORD_4 || '4444',
    },
    5: {
      username: process.env.BOT_USER_5 || '0899999905',
      pwd: process.env.BOT_PASSWORD_5 || '5555',
    },
    6: {
      username: process.env.BOT_USER_6 || '0899999906',
      pwd: process.env.BOT_PASSWORD_6 || '6666',
    },
    31: {
      username: process.env.BOT_USER_31 || '0899999907',
      pwd: process.env.BOT_PASSWORD_31 || '7777',
    },
    32: {
      username: process.env.BOT_USER_32 || '0899999908',
      pwd: process.env.BOT_PASSWORD_32 || '8888',
    },
    71: {
      username: process.env.BOT_USER_71 || '0899999909',
      pwd: process.env.BOT_PASSWORD_71 || '9999',
    },
  };
}
module.exports = {
  user,
};
