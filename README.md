# Native Nexus

A lightweight inspired HTTP client and server implementation using native Fetch API.

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

## Why this project

Modern Node.js and browsers already ship with fetch. This library keeps the developer experience (instances, defaults, interceptors, and error shape) without adding an HTTP dependency.

## Features

- HTTP methods: `get`, `post`, `put`, `patch`, `delete`, `head`, `options`, and `request`
- Callable instance style: `api('/users', config)`
- Request and response interceptors
- Config defaults with `create(...)`
- Typed responses with TypeScript generics
- Native fetch under the hood

## Compatibility

- Node.js 18+
- Modern browsers with native fetch support
- TypeScript projects (declaration file included)

## Installation

```bash
npm install
```

## Development

```bash
# Type-check and build
npm run build

# Run sample entrypoint
npm run start

# Run in watch mode
npm run dev
```

Current npm scripts in `package.json` point to `src/index.ts` for `start` and `dev`, while `src/nexus.ts` is the library entrypoint.

## Testing

This project uses [Vitest](https://vitest.dev/) for unit testing and [MSW](https://mswjs.io/) (Mock Service Worker) for mocking HTTP requests.

### Run Tests

```bash
# Watch mode - re-runs on file changes
npm run test

# Single run (useful for CI/CD)
npm run test:run

# Visual test runner UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Coverage

The test suite includes 27 comprehensive tests covering:

- All HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Request and response interceptors
- Error handling and HTTP status codes
- Headers management and merging
- Instance creation and isolation
- Query parameters and timeout configuration

All tests run against mocked HTTP endpoints, ensuring fast and reliable execution without external dependencies.

## Quick Start

```ts
import nexus, { HttpError, HttpStatusCode } from '@nexus';

const api = nexus.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
  headers: {
    'X-Custom-Header': 'MyClient',
  },
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers.Authorization = 'Bearer TOKEN_123';
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

async function run() {
  try {
    const post = await api.get('/posts/1');
    console.log(post.data);

    const comments = await api('/comments', {
      method: 'GET',
      params: { postId: 1 },
    });
    console.log(comments.data);

    const created = await api.request('/posts', {
      method: 'POST',
      data: {
        title: 'New Post',
        body: 'Post content sent via nexus',
        userId: 1,
      },
    });

    console.log(created.status === HttpStatusCode.Created);
  } catch (error: any) {
    if (error instanceof HttpError || error?.isHttpError) {
      console.error(error.message, error.code, error.response?.status);
      return;
    }

    console.error(error);
  }
}

run();
```

## Example

For a complete integration example with Next.js, see the sample app repository:

- [next-example](https://github.com/thegibi/next-example)

It shows how to use this HTTP client and server in a Next.js project structure.

## API Reference

### Create a client

```ts
const api = nexus.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'X-App': 'demo',
  },
});
```

### Request methods

| Method                           | Signature                                                              |
| -------------------------------- | ---------------------------------------------------------------------- |
| `api(config)`                    | `(config: NexusRequestConfig) => Promise<NexusResponse>`               |
| `api(url, config)`               | `(url: string, config?: NexusRequestConfig) => Promise<NexusResponse>` |
| `api.request(...)`               | Same as callable signatures                                            |
| `api.get(url, config?)`          | `Promise<NexusResponse<T>>`                                            |
| `api.delete(url, config?)`       | `Promise<NexusResponse<T>>`                                            |
| `api.head(url, config?)`         | `Promise<NexusResponse<T>>`                                            |
| `api.options(url, config?)`      | `Promise<NexusResponse<T>>`                                            |
| `api.post(url, data?, config?)`  | `Promise<NexusResponse<T>>`                                            |
| `api.put(url, data?, config?)`   | `Promise<NexusResponse<T>>`                                            |
| `api.patch(url, data?, config?)` | `Promise<NexusResponse<T>>`                                            |

### Interceptors

```ts
const id = api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

api.interceptors.request.eject(id);
```

## Type Safety

```ts
interface User {
  id: number;
  name: string;
}

const response = await api.get<User>('/users/1');
console.log(response.data.name);
```

## Error Handling

The client throws `HttpError` for:

- HTTP non-2xx responses (`ERR_BAD_RESPONSE`)
- Network failures (`ERR_NETWORK`)
- Timeout (`ECONNABORTED`)
- Abort/cancel (`ERR_CANCELED`)

For non-2xx responses, `error.response` contains:

- `data`
- `status`
- `statusText`
- `headers`
- `config`

## Notes

- Uses native fetch from the runtime.
- Timeout is implemented via `AbortController`.
- GET and HEAD requests ignore request body.
- JSON payloads are stringified automatically and `Content-Type: application/json` is set when not provided.
