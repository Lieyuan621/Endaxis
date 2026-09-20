import { computed, effectScope, nextTick, shallowRef } from 'vue';
import { expect, it } from 'vitest';
import { useSimulationReceiptSelection } from './useSimulationReceiptSelection';
import type { ScenarioSimulationRun } from '../../../application/simulation/scenarioSimulationService';

// Only receipt identity matters here; the simulation publisher is tested separately.
const run = (value: number) =>
  ({ receiptEntries: [{ sequence: 1, data: { value } }] }) as unknown as ScenarioSimulationRun;

it('clears a reused sequence synchronously before a new run can supply different damage', () => {
  const scope = effectScope();
  try {
    scope.run(() => {
      const published = shallowRef<ScenarioSimulationRun | null>(run(100));
      const selected = useSimulationReceiptSelection(computed(() => published.value));
      const detail = computed(() =>
        published.value?.receiptEntries.find(e => e.sequence === selected.value),
      );
      selected.value = 1;
      expect(detail.value?.data?.value).toBe(100);
      published.value = run(999);
      // No nextTick: stale selection must not read the new receipt even within this call stack.
      expect(selected.value).toBeNull();
      expect(detail.value).toBeUndefined();
      selected.value = 1;
      expect(detail.value?.data?.value).toBe(999);
      published.value = null;
      expect(selected.value).toBeNull();
    });
  } finally {
    scope.stop();
  }
});

it('keeps selection while the last successful snapshot remains published', async () => {
  const scope = effectScope();
  const published = shallowRef<ScenarioSimulationRun | null>(run(100));
  const selected = scope.run(() => useSimulationReceiptSelection(published))!;
  try {
    selected.value = 1;
    // Waiting/failed/discarded runs retain the old snapshot in useScenarioSimulation.
    published.value = published.value;
    await nextTick();
    expect(selected.value).toBe(1);
    scope.stop();
    published.value = run(200);
    expect(selected.value).toBe(1); // disposed editor no longer receives updates
  } finally {
    scope.stop();
  }
});
