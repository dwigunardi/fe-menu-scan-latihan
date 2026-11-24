/**
 * Cross-tab lock around every request that reads or replaces the HttpOnly refresh cookie
 * (`menuscan_rt`): login, onboard, handover, refresh, logout.
 *
 * All tabs share that one cookie. Without the lock, a refresh still in flight can land after a
 * handover/login (its rotation overwrites, or its 401 clears, the new staff's cookie) or after a
 * logout (its rotation keeps the session alive). With the lock, these requests run one at a time
 * across tabs, and each one sees the cookie left by the previous one.
 *
 * Never call it while already holding the lock (no re-entrancy): a request inside the lock must
 * not trigger the pipeline's silent refresh, which takes the same lock.
 */
export const AUTH_COOKIE_LOCK = 'menuscan-refresh';

/**
 * Longest a request may hold the lock. A stalled request (flaky Wi-Fi on a kiosk tablet) would
 * otherwise block login, refresh and handover in every tab until the tab is closed.
 */
export const AUTH_COOKIE_LOCK_TIMEOUT_MS = 15_000;

export class AuthCookieLockTimeoutError extends Error {
  constructor() {
    super('Permintaan autentikasi terlalu lama. Periksa koneksi lalu coba lagi.');
    this.name = 'AuthCookieLockTimeoutError';
  }
}

/** Aborts when either signal aborts (AbortSignal.any is not available in every target browser). */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

/**
 * Runs `fn` while holding the cookie lock. `fn` receives a signal that aborts after
 * AUTH_COOKIE_LOCK_TIMEOUT_MS (or when the caller's `signal` aborts); pass it to the request.
 * Even if `fn` ignores it, the lock is released at the deadline and AuthCookieLockTimeoutError
 * is thrown. The caller's `signal` also cancels waiting for the lock.
 */
export async function withAuthCookieLock<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  const run = async (): Promise<T> => {
    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(new AuthCookieLockTimeoutError()), AUTH_COOKIE_LOCK_TIMEOUT_MS);
    const requestSignal = signal ? anySignal([signal, deadline.signal]) : deadline.signal;
    try {
      return await Promise.race([
        fn(requestSignal),
        new Promise<never>((_, reject) => {
          deadline.signal.addEventListener('abort', () => reject(new AuthCookieLockTimeoutError()), {
            once: true,
          });
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  };

  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  if (!locks?.request) return run();
  return locks.request(AUTH_COOKIE_LOCK, signal ? { signal } : {}, run) as Promise<T>;
}
