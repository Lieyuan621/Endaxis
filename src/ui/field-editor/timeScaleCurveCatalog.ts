import { computed, inject, type ComputedRef, type InjectionKey } from 'vue';
import { timeScaleCurveDefinitions } from '../../data/combat/timeDilationConfig';
import type { TimeScaleCurveCatalog } from './timeScaleCurveValue';

export const timeScaleCurveCatalogKey: InjectionKey<ComputedRef<TimeScaleCurveCatalog>> =
  Symbol('timeScaleCurveCatalog');
export function useTimeScaleCurveCatalog() {
  return inject(
    timeScaleCurveCatalogKey,
    computed(() => timeScaleCurveDefinitions),
  );
}
