/**
 * Registers the PWA Service Worker in client browser environments.
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ [PWA] Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.warn('⚠️ [PWA] Service Worker registration failed:', error);
        });
    });
  }
}
