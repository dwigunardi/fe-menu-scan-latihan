import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Returns `false` during SSR and hydration, and `true` once rendering on the client.
 * Replaces the `useEffect(() => setMounted(true), [])` pattern without an extra
 * effect-triggered render, while still avoiding hydration mismatches.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
