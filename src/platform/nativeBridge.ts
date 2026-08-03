declare global {
  interface Window {
    EndaxisAndroid?: unknown;
    EndaxisHandleBack?: () => boolean;
  }
}

const backHandlers = new Set<() => boolean>();

if (typeof window !== 'undefined') {
  window.EndaxisHandleBack = () => {
    const handlers = Array.from(backHandlers).reverse();
    return handlers.some(handler => handler());
  };
}

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.EndaxisAndroid);
}

export function registerBackHandler(handler: () => boolean): () => void {
  backHandlers.add(handler);
  return () => backHandlers.delete(handler);
}
