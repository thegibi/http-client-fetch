import { http, HttpResponse } from 'msw';

const API_BASE = 'https://api.example.com';

export const handlers = [
  // GET /users
  http.get(`${API_BASE}/users`, () => {
    return HttpResponse.json([
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ]);
  }),

  // GET /users/:id
  http.get(`${API_BASE}/users/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id: Number(id),
      name: 'John Doe',
      email: 'john@example.com',
    });
  }),

  // HEAD /users - for HEAD requests
  http.head(`${API_BASE}/users`, () => {
    return HttpResponse.text('', {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // OPTIONS /users - for OPTIONS requests
  http.options(`${API_BASE}/users`, () => {
    return HttpResponse.text('', {
      headers: {
        Allow: 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
      },
    });
  }),

  // POST /users
  http.post(`${API_BASE}/users`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        id: 3,
        ...body,
      },
      { status: 201 },
    );
  }),

  // PUT /users/:id
  http.put(`${API_BASE}/users/:id`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: Number(params.id),
      ...body,
    });
  }),

  // PATCH /users/:id
  http.patch(`${API_BASE}/users/:id`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: Number(params.id),
      ...body,
    });
  }),

  // DELETE /users/:id
  http.delete(`${API_BASE}/users/:id`, () => {
    return HttpResponse.json(null, { status: 204 });
  }),

  // Error handler for testing
  http.get(`${API_BASE}/error`, () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }),

  // Unauthorized handler
  http.get(`${API_BASE}/unauthorized`, () => {
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }),

  // Not found handler
  http.get(`${API_BASE}/not-found`, () => {
    return HttpResponse.json({ error: 'Not Found' }, { status: 404 });
  }),

  // Text response (non-JSON)
  http.get(`${API_BASE}/text`, () => {
    return HttpResponse.text('Plain text response', {
      headers: { 'Content-Type': 'text/plain' },
    });
  }),

  // HTML response
  http.get(`${API_BASE}/html`, () => {
    return HttpResponse.text('<html><body>HTML content</body></html>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }),

  // response.json() parse error - malformed JSON
  http.get(`${API_BASE}/malformed-json`, () => {
    return HttpResponse.text('Not valid JSON', {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // response.text() parse error
  http.get(`${API_BASE}/text-error`, () => {
    return HttpResponse.text('Error', {
      headers: { 'Content-Type': 'text/plain' },
    });
  }),

  // Delayed response for timeout testing
  http.get(`${API_BASE}/delayed`, async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return HttpResponse.json({ delayed: true });
  }),
];

export const API_URL = API_BASE;
