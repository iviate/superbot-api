const axios = require('axios');

const httpClient = axios.create();

const MAX_RETRY = 3;

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

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response ? error.response.status : null;

    if (status === 403) {
      error.config.__retryCount = error.config.__retryCount || 0;

      if (error.config.__retryCount < MAX_RETRY) {
        error.config.__retryCount += 1;

        await sleep(100);

        return httpClient(error.config);
      }
    }

    return Promise.reject(error);
  }
);

module.exports = httpClient;
