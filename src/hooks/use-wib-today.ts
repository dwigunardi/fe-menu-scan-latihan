import { useSyncExternalStore } from 'react';
import { getTodayWib } from '@/lib/utils/date-helpers';

const CHECK_INTERVAL_MS = 60_000;

// Re-check the date every minute; React only re-renders when the returned string changes
const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, CHECK_INTERVAL_MS);
  return () => clearInterval(id);
};

/**
 * Today's date in WIB as "YYYY-MM-DD". Updates after midnight WIB, so a screen left open
 * overnight (like the kiosk) switches to the new day without a reload.
 */
export function useWibToday(): string {
  return useSyncExternalStore(subscribe, getTodayWib, getTodayWib);
}
