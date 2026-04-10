import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './server';

// Enable request mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test so that each test could alter them without affecting the other
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

// Clean up after the tests
afterAll(() => {
  server.close();
});
