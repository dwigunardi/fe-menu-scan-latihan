/**
 * Registers the PWA Service Worker in client browser environments.
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') {
    return;
  }

  const register = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ [PWA] Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.warn('⚠️ [PWA] Service Worker registration failed:', error);
      });
  };

  // This runs from a React effect, which is often after `load` has already fired —
  // waiting for the event in that case would mean never registering.
  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}
