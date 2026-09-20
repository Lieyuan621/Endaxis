export type Appearance = 'dark' | 'light';

export const APPEARANCE_STORAGE_KEY = 'endaxis:appearance:v1';

export function normalizeAppearance(value: unknown): Appearance {
  return value === 'light' ? 'light' : 'dark';
}

export function readStoredAppearance(): Appearance {
  try {
    return normalizeAppearance(localStorage.getItem(APPEARANCE_STORAGE_KEY));
  } catch {
    return 'dark';
  }
}

export function writeStoredAppearance(appearance: Appearance): void {
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, normalizeAppearance(appearance));
  } catch {
    // ignore quota / private mode
  }
}

/** Apply theme to <html>: data-theme + Element Plus dark class. */
export function applyAppearance(appearance: Appearance): Appearance {
  const next = normalizeAppearance(appearance);
  const root = document.documentElement;
  root.setAttribute('data-theme', next);
  root.classList.toggle('dark', next === 'dark');
  return next;
}

export function initAppearance(): Appearance {
  return applyAppearance(readStoredAppearance());
}

export function setAppearance(appearance: Appearance): Appearance {
  const next = applyAppearance(appearance);
  writeStoredAppearance(next);
  return next;
}

export function toggleAppearance(current?: Appearance): Appearance {
  const from = normalizeAppearance(current ?? readStoredAppearance());
  return setAppearance(from === 'dark' ? 'light' : 'dark');
}
