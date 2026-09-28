import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
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
    data: {
      value: 100,
      attack: 100,
      'attackDetailSlot:baseAddition': 15,
      'attackDetailSlot:baseMultiplier': 0.18,
      'attackDetailSlot:baseFinalAddition': -20,
      'attackDetailSlot:finalMultiplier': 1.2,
    },
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
            contributionSourceLabel: () => '',
            damageTypeLabel: (s: string) => s,
            skillTypeLabel: (s: string) => s,
            labels: { attack: 'ATK', criticalRate: 'CRIT', defenseDetail: () => '' },
          },
        ),
    }),
  );
  const detail = state.damageDetails.value[0];
  expect(detail.attributeSources).toEqual({});
  expect(detail.attackSlotSources.baseFinalAddition).toEqual([{ label: 'flat', value: 'ATK -20' }]);
  expect(detail.attackSlotSources.baseMultiplier).toEqual([
    { label: 'percent', value: 'ATK +18.0%' },
  ]);
  expect(detail.attackSlotSources.finalMultiplier).toEqual([
    { label: 'product', value: 'ATK x1.200' },
  ]);
  expect(detail.attackSlotValues.baseMultiplier).toBe(0.18);
  expect(detail.attackSlotValues.baseAddition).toBe(15);
  expect(detail.attackSlotValues.baseFinalAddition).toBe(-20);
  expect(detail.attackSlotValues.finalMultiplier).toBe(1.2);
  expect(detail.otherAttackSlots).toEqual([
    'baseAddition',
    'baseMultiplier',
    'baseFinalAddition',
    'finalMultiplier',
  ]);
  expect(detail.attackSources).toHaveLength(3);
  expect(entry).toEqual(before);
});

it('projects the full attack breakdown from the frozen hit receipt instead of a static panel', async () => {
  const entry: CombatReceiptEntry = {
    sequence: 2,
    frame: 0,
    time: 0,
    event: 'DamageApplied',
    data: {
      value: 440,
      attack: 716,
      attackDetailActualBase: 319,
      attackDetailOperatorBase: 200,
      attackDetailWeaponBase: 119,
      attackDetailAttackPercent: 0,
      attackDetailFlatAttack: 0,
      attackDetailMainAttribute: 'agility',
      attackDetailSecondaryAttribute: 'strength',
      attackDetailStrength: 123,
      attackDetailAgility: 200,
      attackDetailIntellect: 0,
      attackDetailWill: 0,
      attackDetailStrengthCoefficient: 0.002,
      attackDetailAgilityCoefficient: 0.005,
      attackDetailIntellectCoefficient: 0,
      attackDetailWillCoefficient: 0,
    },
  };
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
            contributionSourceLabel: () => '',
            damageTypeLabel: (s: string) => s,
            skillTypeLabel: (s: string) => s,
            labels: {
              attack: 'ATK',
              basicTotal: 'Basic Total',
              attributeBonus: 'Attribute Bonus',
              attributeLabel: (s: string) => s,
              criticalRate: 'CRIT',
              defenseDetail: () => '',
            },
          },
        ),
    }),
  );
  const detail = state.damageDetails.value[0].attackDetail;
  expect(detail).toMatchObject({
    basicTotal: 319,
    baseAttackTotal: 319,
    operatorBaseAttack: 200,
    weaponBaseAttack: 119,
    attackBonus: 0,
    flatAttack: 0,
    attackPercent: 0,
    attributeBonus: 1.246,
  });
  expect(detail.attributeContributions.map((row: { key: string }) => row.key)).toEqual([
    'agility',
    'strength',
  ]);
  expect(detail.formula).toContain('= 716');
});

it('projects expandable crit rows from the frozen hit facts', async () => {
  const entry: CombatReceiptEntry = {
    sequence: 3,
    frame: 0,
    time: 0,
    event: 'DamageApplied',
    data: {
      value: 150,
      standardCalculation: true,
      skillMultiplierPercent: 400,
      criticalRate: 1.25,
      criticalDamageIncrease: 0.6,
      criticalExpectationMultiplier: 1.6,
    },
    appliedDamageModifiers: [
      {
        kind: 'attribute',
        side: 'attacker',
        attribute: 'criticalRate',
        slot: 'baseAddition',
        value: 0.25,
        sourceId: 'rate-buff',
      },
      {
        kind: 'attribute',
        side: 'attacker',
        attribute: 'criticalDamageIncrease',
        slot: 'baseAddition',
        value: 0.1,
        sourceId: 'damage-buff',
      },
    ],
  };
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
            contributionSourceLabel: () => '',
            damageTypeLabel: (s: string) => s,
            skillTypeLabel: (s: string) => s,
            labels: {
              skillMultiplier: 'Skill Multiplier',
              criticalRate: 'CRIT',
              criticalDamage: 'CRIT DMG',
              defenseDetail: () => '',
            },
          },
        ),
    }),
  );
  const detail = state.damageDetails.value[0];
  expect(detail.baseRows[0]).toEqual({ label: 'Skill Multiplier', value: '400.0%' });
  expect(detail.criticalRateRaw).toBe(1.25);
  expect(detail.criticalRateEffective).toBe(1);
  expect(detail.multiplierRows.find((row: { kind?: string }) => row.kind === 'crit')?.detail).toBe(
    'CRIT 100.0% × 60.0%',
  );
  expect(detail.criticalDamageIncrease).toBe(0.6);
  expect(detail.criticalRateSources).toEqual([{ label: 'rate-buff', value: '+25.0%' }]);
  expect(detail.criticalDamageSources).toEqual([{ label: 'damage-buff', value: '+10.0%' }]);
  expect(detail.multiplierRows.find((row: { kind?: string }) => row.kind === 'crit')).toBeDefined();
  state.toggleCriticalDetail(3);
  expect(state.openCriticalDetails.value.has(3)).toBe(true);
  state.onClose();
  expect(state.openCriticalDetails.value.size).toBe(0);
});

it('uses the shared floating-surface arrow and keeps the attack breakdown in the table', () => {
  const source = readFileSync(new URL('./TimelineHitDetailDialog.vue', import.meta.url), 'utf8');
  expect(source).toContain('labels.baseAttack');
  expect(source).toContain('labels.attributeBonus');
  expect(source).not.toContain('labels.staticBuildAttack');
  expect(source).not.toContain('.hit-detail-source-tooltip[data-popper-placement]');
  expect(source).not.toContain('transform: rotate(45deg) !important');
});
