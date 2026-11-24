import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  withAuthCookieLock,
  AUTH_COOKIE_LOCK,
  AUTH_COOKIE_LOCK_TIMEOUT_MS,
  AuthCookieLockTimeoutError,
} from '@/lib/api/auth-cookie-lock';

const originalLocks = Object.getOwnPropertyDescriptor(navigator, 'locks');

function setLocks(value: unknown) {
  Object.defineProperty(navigator, 'locks', { configurable: true, value });
}

/** Minimal exclusive LockManager: one holder per name, others wait in order. */
function createFakeLockManager() {
  const tails = new Map<string, Promise<unknown>>();
  const request = vi.fn(
    (name: string, optionsOrCallback: unknown, maybeCallback?: () => Promise<unknown>) => {
      const callback = (maybeCallback ?? optionsOrCallback) as () => Promise<unknown>;
      const previous = tails.get(name) ?? Promise.resolve();
      const run = previous.then(() => callback());
      tails.set(name, run.catch(() => undefined));
      return run;
    }
  );
  return { request };
}

describe('withAuthCookieLock', () => {
  afterEach(() => {
    if (originalLocks) Object.defineProperty(navigator, 'locks', originalLocks);
    else setLocks(undefined);
  });

  it('runs one cookie-changing request at a time across callers', async () => {
    setLocks(createFakeLockManager());
    const order: string[] = [];
    let releaseFirst: () => void = () => {};

    const first = withAuthCookieLock(async () => {
      order.push('first:start');
      await new Promise<void>((resolve) => (releaseFirst = resolve));
      order.push('first:end');
    });
    const second = withAuthCookieLock(async () => {
      order.push('second:start');
    });

    await Promise.resolve();
    await Promise.resolve();
    // The second request waits while the first one holds the lock
    expect(order).toEqual(['first:start']);

    releaseFirst();
    await Promise.all([first, second]);
    expect(order).toEqual(['first:start', 'first:end', 'second:start']);
  });

  it('uses the shared lock name and forwards the abort signal', async () => {
    const lockManager = createFakeLockManager();
    setLocks(lockManager);
    const controller = new AbortController();

    await withAuthCookieLock(async () => 'ok', controller.signal);

    expect(lockManager.request).toHaveBeenCalledWith(
      AUTH_COOKIE_LOCK,
      { signal: controller.signal },
      expect.any(Function)
    );
  });

  it('releases the lock when a stalled request outlives the timeout', async () => {
    setLocks(createFakeLockManager());
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    let requestSignal: AbortSignal | undefined;

    const stalled = withAuthCookieLock((signal) => {
      requestSignal = signal;
      return new Promise<never>(() => {});
    });
    const assertion = expect(stalled).rejects.toBeInstanceOf(AuthCookieLockTimeoutError);
    await vi.advanceTimersByTimeAsync(AUTH_COOKIE_LOCK_TIMEOUT_MS);
    await assertion;
    vi.useRealTimers();

    // The request was told to abort, and the next caller gets the lock
    expect(requestSignal?.aborted).toBe(true);
    await expect(withAuthCookieLock(async () => 'next')).resolves.toBe('next');
  });

  it('runs the request directly when Web Locks are not available', async () => {
    setLocks(undefined);
    await expect(withAuthCookieLock(async () => 42)).resolves.toBe(42);
  });
});
