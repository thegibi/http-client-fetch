import httpClient from 'http-client-fetch';

export const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

export const api = httpClient.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Demo-Client': 'next-example',
    },
  };
});

api.interceptors.response.use((response) => {
  return response;
});
