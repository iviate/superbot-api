module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'root',
  DB: process.env.DB_DATABASE || 'ibot',
  PORT: process.env.DB_PORT || 3306,
  PASSWORD: process.env.DB_PASSWORD || 'ibot',
  dialect: 'mysql',
};
