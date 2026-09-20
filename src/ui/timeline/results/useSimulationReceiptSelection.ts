import { ref, watch, type WatchSource } from 'vue';
import type { ScenarioSimulationRun } from '../../../application/simulation/scenarioSimulationService';

/** 回执序号只属于一次已发布模拟；新结果发布时不能借用旧序号读取另一笔伤害。 */
export function useSimulationReceiptSelection(run: WatchSource<ScenarioSimulationRun | null>) {
  const sequence = ref<number | null>(null);
  watch(
    run,
    () => {
      sequence.value = null;
    },
    { flush: 'sync' },
  );
  return sequence;
}
