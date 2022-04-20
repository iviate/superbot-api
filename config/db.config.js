module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'root',
  DB: process.env.DB_DATABASE || 'ibot',
  PASSWORD: process.env.DB_PASSWORD || 'ibot',
  dialect: 'mysql',
};
