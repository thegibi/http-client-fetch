import httpClient, { HttpClientError, HttpStatusCode } from './http-client';

const api = httpClient.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
  headers: {
    'X-Custom-Header': 'MyClient',
  },
});

api.interceptors.request.use((config) => {
  console.log(
    `[Request] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`,
  );

  config.headers = config.headers || {};
  config.headers.Authorization = 'Bearer TOKEN_123';
  return config;
});

api.interceptors.response.use(
  (response: any) => {
    console.log(`[Response] ${response.status} ${response.statusText}`);
    return response;
  },
  (error: any) => {
    if (error.response?.status === HttpStatusCode.Unauthorized)
    {
      console.error('Authentication error');
    }

    return Promise.reject(error);
  },
);

async function run() {
  try
  {
    // Axios-style usage: helper method
    const post = await api.get('/posts/1');
    console.log('Post title:', post.data?.title);

    // Axios-style usage: instance(url, config)
    const comments = await api('/comments', {
      method: 'GET',
      params: { postId: 1 },
    });
    console.log('Returned comments:', comments.data?.length ?? 0);

    // Axios-style usage: request(url, config)
    const created = await api.request('/posts', {
      method: 'POST',
      data: {
        title: 'New Post',
        body: 'Post content sent via httpClient',
        userId: 1,
      },
    });

    console.log('Post created:', created.status === HttpStatusCode.Created);
  } catch (error: any)
  {
    if (error instanceof HttpClientError || error?.isHttpClientError)
    {
      console.error(
        'HTTP error:',
        error.message,
        'code=',
        error.code,
        'status=',
        error.response?.status,
      );
      return;
    }

    console.error('Unexpected error:', error);
  }
}

run();
