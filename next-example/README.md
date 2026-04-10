# Next.js http-client-fetch Proposal

This repository demonstrates how to use `http-client-fetch` in both server-side and client-side code in a Next.js App Router application.

The proposal is simple: create one shared HTTP client instance, reuse it in Server Components and Client Components, and keep the rendering model explicit in the UI and documentation.

## What this repo shows

- A shared `http-client-fetch` client configured once in `app/libs/api.ts`
- A Server Component that awaits data during server rendering
- A Client Component that fetches data in the browser after hydration
- A single page that compares both approaches side by side

## Why this approach

Using one HTTP client instance gives you a consistent place to manage:

- `baseURL`
- shared headers
- interceptors or auth logic
- request behavior reused across server and client execution

This works well for Next.js when you want the same API wrapper available in different rendering environments.

## Implementation overview

### Shared HTTP client

The shared client is defined in `app/libs/api.ts`:

```ts
import httpClient from 'http-client-fetch';

export const api = httpClient.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
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

api.interceptors.response.use((response) => response);
```

The interceptor block is included on purpose so the example also shows where to add shared auth headers, request tracing, logging, or response normalization.

### Server-side usage

In Next.js App Router, components are Server Components by default. That means you can call the shared HTTP client directly in an async component:

```tsx
import { api } from '../libs/api';

export default async function FetchServerSide() {
  const users = await api.get('/users');

  return <pre>{JSON.stringify(users.data, null, 2)}</pre>;
}
```

Use this pattern when:

- data should be fetched on the server
- SEO or first-render content matters
- you want to avoid browser-side loading for the initial render

### Client-side usage

For interactive browser-side behavior, use a Client Component with `'use client'` and fetch inside an effect:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '../libs/api';

export default function FetchClientSide() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function loadUsers() {
      const response = await api.get('/users');
      setUsers(response.data);
    }

    loadUsers();
  }, []);

  return <pre>{JSON.stringify(users, null, 2)}</pre>;
}
```

Use this pattern when:

- the request depends on browser interaction
- the component uses state or effects
- the request should happen after hydration

## Important Next.js note

This example follows the current App Router model:

- Server Components are the default in `app/`
- `'use client'` creates the client boundary
- `'use server'` is for Server Functions and server actions, not for marking ordinary Server Components

## Run the example

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Project structure

```text
app/
	components/
		fetch-client-side.tsx
		fetch-server-side.tsx
	libs/
		api.ts
	page.tsx
```

## Summary description

This project is a small reference implementation for teams that want to document or propose `http-client-fetch` as a shared API layer in Next.js. It shows the same client working in both Server Components and Client Components with minimal setup and clear separation of rendering behavior.
