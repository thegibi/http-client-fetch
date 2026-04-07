import nexus, { HttpError, HttpStatusCode } from '@nexus';

const api = nexus.create({
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
  (response) => {
    console.log(`[Response] ${response.status} ${response.statusText}`);
    return response;
  },
  (error) => {
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
    const post = await api.get('/posts/1');
    console.log('Post title:', post.data?.title);

    const comments = await api('/comments', {
      method: 'GET',
      params: { postId: 1 },
    });
    console.log('Returned comments:', comments.data?.length ?? 0);

    const created = await api.request('/posts', {
      method: 'POST',
      data: {
        title: 'New Post',
        body: 'Post content sent via nexus',
        userId: 1,
      },
    });

    console.log('Post created:', created.status === HttpStatusCode.Created);
  } catch (error: any)
  {
    if (error instanceof HttpError || error?.isHttpError)
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
