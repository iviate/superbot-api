const axios = require('axios');

const httpClient = axios.create();

httpClient.interceptors.request.use((config) => {
  if (process.env.IS_ENABLE_PROXY === 'true') {
    return {
      ...config,
      proxy: {
        host: process.env.PROXY_HOST,
        port: process.env.PROXY_PORT,
        auth: {
          username: process.env.PROXY_USER,
          password: process.env.PROXY_PASSWORD,
        },
      },
    };
  }

  return config;
});

module.exports = httpClient;
