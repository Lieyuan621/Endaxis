import { expect, it } from 'vitest';
import { createSSRApp, h, type ComponentOptions } from 'vue';
import { renderToString } from 'vue/server-renderer';
import Dialog from './TimelineHitDetailDialog.vue';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';

it('keeps flat, additive percentage and independent attack sources separate without changing receipts', async () => {
  const entry: CombatReceiptEntry = {
    sequence: 1,
    frame: 0,
    time: 0,
    event: 'DamageApplied',
    data: { value: 100, attack: 100 },
    appliedDamageModifiers: [
      {
        kind: 'attribute',
        side: 'attacker',
        attribute: 'Atk',
        slot: 'baseFinalAddition',
        value: -20,
        sourceId: 'flat',
      },
      {
        kind: 'attribute',
        side: 'attacker',
        attribute: 'Atk',
        slot: 'baseMultiplier',
        value: 0.18,
        sourceId: 'percent',
      },
      {
        kind: 'attribute',
        side: 'attacker',
        attribute: 'Atk',
        slot: 'finalMultiplier',
        value: 1.2,
        sourceId: 'product',
      },
      {
        kind: 'attribute',
        side: 'attacker',
        attribute: 'criticalRate',
        slot: 'baseAddition',
        value: 0.1,
        sourceId: 'critical',
      },
    ],
  };
  const before = structuredClone(entry);
  let state: any;
  await renderToString(
    createSSRApp({
      render: () =>
        h(
          {
            ...(Dialog as ComponentOptions),
            setup(props: any, context: any) {
              state = (Dialog as any).setup(props, context);
              return state;
            },
            ssrRender: () => {},
          },
          {
            visible: true,
            randomMode: 'expected',
            forceCritical: false,
            resultForceCritical: false,
            entries: [entry],
            operatorPanel: {
              attack: 90,
              receipt: [
                {
                  source: { kind: 'operatorBase', operatorSlug: 'test' },
                  stat: 'intellect',
                  operation: 'flat',
                  value: 100,
                },
              ],
            },
            contributionSourceLabel: () => '',
            damageTypeLabel: (s: string) => s,
            skillTypeLabel: (s: string) => s,
            labels: { attack: 'ATK', criticalRate: 'CRIT', defenseDetail: () => '' },
          },
        ),
    }),
  );
  const detail = state.damageDetails.value[0];
  expect(detail.staticAttack).toBe(90);
  expect(detail.attributeSources).toEqual({});
  expect(detail.attackSlotSources.baseFinalAddition).toEqual([{ label: 'flat', value: 'ATK -20' }]);
  expect(detail.attackSlotSources.baseMultiplier).toEqual([
    { label: 'percent', value: 'ATK +18.0%' },
  ]);
  expect(detail.attackSlotSources.finalMultiplier).toEqual([
    { label: 'product', value: 'ATK x1.200' },
  ]);
  expect(detail.otherAttackSlots).toEqual([
    'baseMultiplier',
    'baseFinalAddition',
    'finalMultiplier',
  ]);
  expect(detail.attackSources).toHaveLength(3);
  expect(entry).toEqual(before);
});
