import { inject, ref, type InjectionKey, type Ref } from 'vue';
import { normalizeDurationBarColorPrefs, type DurationBarColorPrefs } from './durationBarColor';

export const durationBarColorKey: InjectionKey<Ref<DurationBarColorPrefs>> =
  Symbol('nextDurationBarColor');
export function useDurationBarColor() {
  return inject(durationBarColorKey, () => ref(normalizeDurationBarColorPrefs(undefined)), true);
}
