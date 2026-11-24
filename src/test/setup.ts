import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Web Animations spec: cancel() rejects the `finished` promise with an AbortError and marks it as
// handled, so browsers never report it. happy-dom (>= 20.12) rejects it without that mark, and
// motion cancels animations without reading `finished`, so every interrupted animation became an
// "Unhandled Rejection: AbortError: The animation was canceled" that failed the whole run.
// Attaching a no-op handler marks it as handled; code awaiting `finished` still sees the rejection.
if (typeof Animation !== 'undefined') {
  const cancel = Animation.prototype.cancel;
  Animation.prototype.cancel = function (this: Animation) {
    this.finished?.catch(() => {});
    return cancel.call(this);
  };
}

// Mock window.matchMedia for theme / responsive components
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
