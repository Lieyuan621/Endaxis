import { ref, watch, type WatchSource } from 'vue';
import type { ScenarioSimulationRun } from '../../../application/simulation/scenarioSimulationService';

/** 有稳定命中身份时重新定位；其他回执在新结果发布后取消选择，不能复用旧序号。 */
export function useSimulationReceiptSelection(run: WatchSource<ScenarioSimulationRun | null>) {
  const sequence = ref<number | null>(null);
  watch(
    run,
    (next, previous) => {
      const key = previous?.receiptEntries.find(entry => entry.sequence === sequence.value)?.data
        ?.reactionCriticalKey;
      sequence.value =
        typeof key === 'string'
          ? (next?.receiptEntries.find(entry => entry.data?.reactionCriticalKey === key)
              ?.sequence ?? null)
          : null;
    },
    { flush: 'sync' },
  );
  return sequence;
}
