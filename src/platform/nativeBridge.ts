declare global {
  interface Window {
    EndaxisHandleBack?: () => boolean;
    EndaxisNative?: {
      appReady?: () => void;
    };
  }
}

const backHandlers = new Set<() => boolean>();
let appReadySent = false;

if (typeof window !== 'undefined') {
  window.EndaxisHandleBack = () => {
    const handlers = Array.from(backHandlers).reverse();
    return handlers.some(handler => handler());
  };
}

export function isNativeApp(): boolean {
  return typeof navigator !== 'undefined' && /\bEndaxisApp\//i.test(navigator.userAgent);
}

export function registerBackHandler(handler: () => boolean): () => void {
  backHandlers.add(handler);
  return () => backHandlers.delete(handler);
}

export function notifyNativeAppReady(): boolean {
  if (appReadySent || !isNativeApp() || typeof window === 'undefined') return false;
  const appReady = window.EndaxisNative?.appReady;
  if (typeof appReady !== 'function') return false;

  try {
    appReady.call(window.EndaxisNative);
    appReadySent = true;
    return true;
  } catch {
    return false;
  }
}
