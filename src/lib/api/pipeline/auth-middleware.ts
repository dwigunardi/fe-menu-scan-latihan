import { useAuthStore } from '@/store/use-auth-store';
import { Middleware } from './types';

/**
 * Auth Middleware:
 * Automatically injects Bearer accessToken from useAuthStore if available and not already set.
 * Includes direct localStorage fallback to eliminate hydration race conditions on initial page load.
 */
export const authMiddleware: Middleware = async (ctx, next) => {
  let token = useAuthStore.getState().accessToken;

  // Fallback to localStorage directly if store is still rehydrating in browser
  if (!token && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('kumpul_cafe_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed?.state?.accessToken || null;
      }
    } catch {
      // Ignore JSON parse error
    }
  }

  const hasAuth = Object.keys(ctx.headers).some(
    (k) => k.toLowerCase() === 'authorization'
  );

  if (token && !hasAuth) {
    ctx.headers['Authorization'] = `Bearer ${token}`;
  }

  await next();
};
