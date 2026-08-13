type BootReadyPhase = 'data' | 'view';

const readyPhases = new Set<BootReadyPhase>();
const readyListeners = new Set<() => void>();
let dismissalScheduled = false;

function isBootReady() {
  return readyPhases.size >= 2;
}

function scheduleBootLoaderDismissal() {
  if (dismissalScheduled || !isBootReady() || typeof window === 'undefined') return;
  dismissalScheduled = true;

  for (const listener of readyListeners) listener();
  readyListeners.clear();

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.getElementById('boot-loader')?.remove();
    });
  });
}

export function markBootReady(phase: BootReadyPhase) {
  readyPhases.add(phase);
  scheduleBootLoaderDismissal();
}

export function onBootReady(listener: () => void) {
  if (isBootReady()) {
    listener();
    return () => {};
  }

  readyListeners.add(listener);
  return () => readyListeners.delete(listener);
}

export function reportBootLoadFailure() {
  if (typeof document === 'undefined') return;
  const loader = document.getElementById('boot-loader');
  if (!loader) return;

  loader.setAttribute('aria-busy', 'false');
  loader.classList.add('is-error');
  const message = loader.querySelector('.message');
  if (message) message.textContent = '加载失败，请刷新后重试';
}
