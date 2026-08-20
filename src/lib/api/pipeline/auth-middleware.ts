import { useAuthStore } from '@/store/use-auth-store';
import { Middleware } from './types';

/**
 * Auth Middleware:
 * Automatically injects Bearer accessToken from useAuthStore if available and not already set.
 */
export const authMiddleware: Middleware = async (ctx, next) => {
  const token = useAuthStore.getState().accessToken;

  const hasAuth = Object.keys(ctx.headers).some(
    (k) => k.toLowerCase() === 'authorization'
  );

  if (token && !hasAuth) {
    ctx.headers['Authorization'] = `Bearer ${token}`;
  }

  await next();
};
