import { ref } from 'vue';
import {
  type Appearance,
  initAppearance,
  readStoredAppearance,
  setAppearance,
} from '@/theme/appearance';

const appearance = ref<Appearance>(readStoredAppearance());
let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  appearance.value = initAppearance();
  initialized = true;
}

export function useAppearance() {
  ensureInitialized();

  function set(next: Appearance) {
    appearance.value = setAppearance(next);
  }

  return {
    appearance,
    setAppearance: set,
  };
}

/** Call once from app bootstrap (before mount). */
export function bootstrapAppearance() {
  ensureInitialized();
  return appearance;
}
