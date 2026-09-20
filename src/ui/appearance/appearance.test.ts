import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  APPEARANCE_STORAGE_KEY,
  applyAppearance,
  normalizeAppearance,
  readStoredAppearance,
  setAppearance,
  toggleAppearance,
} from './appearance';

function installDomMocks() {
  const store = new Map<string, string>();
  const classSet = new Set<string>(['dark']);
  const attrs = new Map<string, string>([['data-theme', 'dark']]);

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });

  vi.stubGlobal('document', {
    documentElement: {
      setAttribute: (key: string, value: string) => {
        attrs.set(key, value);
      },
      getAttribute: (key: string) => (attrs.has(key) ? attrs.get(key)! : null),
      removeAttribute: (key: string) => {
        attrs.delete(key);
      },
      classList: {
        toggle: (token: string, force?: boolean) => {
          const on = force === undefined ? !classSet.has(token) : !!force;
          if (on) classSet.add(token);
          else classSet.delete(token);
          return on;
        },
        contains: (token: string) => classSet.has(token),
        add: (token: string) => {
          classSet.add(token);
        },
        remove: (token: string) => {
          classSet.delete(token);
        },
      },
    },
  });

  return { store, classSet, attrs };
}

describe('appearance', () => {
  beforeEach(() => {
    installDomMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('normalizeAppearance defaults to dark', () => {
    expect(normalizeAppearance(null)).toBe('dark');
    expect(normalizeAppearance('nope')).toBe('dark');
    expect(normalizeAppearance('light')).toBe('light');
  });

  test('applyAppearance sets data-theme and dark class', () => {
    applyAppearance('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    applyAppearance('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  test('setAppearance persists and toggle flips', () => {
    setAppearance('light');
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('light');
    expect(readStoredAppearance()).toBe('light');
    expect(toggleAppearance()).toBe('dark');
    expect(readStoredAppearance()).toBe('dark');
  });
});
