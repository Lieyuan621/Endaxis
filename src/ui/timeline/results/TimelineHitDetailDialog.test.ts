import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createSSRApp, h, type ComponentOptions } from 'vue';
import { renderToString } from 'vue/server-renderer';
import Dialog from './TimelineHitDetailDialog.vue';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';

it('按旧版顺序展示独立乘区，失衡只从独立增伤中拆出一次', async () => {
  const entry: CombatReceiptEntry = {
    sequence: 1,
    frame: 0,
    time: 0,
    event: 'DamageApplied',
    data: {
      standardCalculation: true,
      attack: 100,
      skillMultiplierPercent: 200,
      baseDamage: 200,
      'damageScale:normal': 1.452,
      'damageScale:normal:attacker': 1.32,
      'damageScale:normal:defender': 1.1,
      'damageScale:product': 1.56,
      'damageScale:enhanced': 1.2,
      'damageScale:vulnerable': 1.1,
      'damageScale:combo': 1.3,
      directDamageMultiplier: 1.05,
      defenseMultiplier: 0.5,
      resistancePercentMultiplier: 0.8,
      enemyBaseResistancePercent: 40,
      enemyResistancePercent: 20,
      finisherMultiplier: 1.5,
      levelCoefficient: 1.454,
      artsIntensityMultiplier: 1.72,
      effectivenessMultiplier: 1.1,
      criticalExpectationMultiplier: 1.025,
      criticalRate: 0.05,
      criticalDamageIncrease: 0.5,
    },
    skillMultiplierCalculation: { operation: 'multiply', left: 1, right: 2, result: 2 },
    appliedDamageModifiers: [
      {
        kind: 'damageScale',
        side: 'defender',
        zone: 'product',
        addition: 0.3,
        sourceId: 'enemy',
        buffId: 'buff_common_poise_break_damage_taken_scale',
      },
      {
        kind: 'damageScale',
        side: 'attacker',
        zone: 'combo',
        addition: 0.3,
        sourceId: 'a',
        consumedStacks: 1,
        buff: { ownerId: 'a', instanceId: 1 },
      },
      {
        kind: 'damageScale',
        side: 'attacker',
        zone: 'combo',
        addition: 0.3,
        sourceId: 'a',
        consumedStacks: 1,
        buff: { ownerId: 'a', instanceId: 2 },
      },
      {
        kind: 'damageScale',
        side: 'attacker',
        zone: 'combo',
        addition: 0.3,
        sourceId: 'a',
        consumedStacks: 1,
        buff: { ownerId: 'a', instanceId: 3 },
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
            damageZoneLabel: (zone: string) => zone,
            labels: {
              damageBonus: 'bonus',
              criticalExpectation: 'critical',
              directMultiplier: 'direct',
              damageTaken: 'taken',
              defenseMultiplier: 'defense',
              resistanceMultiplier: 'resistance',
              staggerMultiplier: 'stagger',
              finisherMultiplier: 'finisher',
              levelCoefficient: 'level',
              artsIntensity: 'arts',
              effectiveness: 'effectiveness',
              defenseDetail: () => '',
              stacksDetail: (count: number) => `${count} 层`,
              multiplierCalculation: '倍率计算',
              separatedMultiplier: (name: string) => `${name}（另列乘区）`,
            },
          },
        ),
    }),
  );
  const rows = state.damageDetails.value[0].multiplierRows;
  expect(rows.map((row: any) => row.label)).toEqual([
    'bonus',
    'critical',
    'enhanced',
    'product',
    'direct',
    'vulnerable',
    'taken',
    'combo',
    'defense',
    'resistance',
    'stagger',
    'finisher',
    'level',
    'arts',
    'effectiveness',
  ]);
  expect(rows.find((row: any) => row.label === 'bonus').detail).toBe('+32.0%');
  expect(rows.find((row: any) => row.label === 'combo').detail).toBe('3 层');
  expect(rows.find((row: any) => row.label === 'critical').detail).toBe('5.0% × 50.0%');
  expect(rows.find((row: any) => row.label === 'resistance').detail).toBe('40.0% → 20.0%');
  expect(rows.find((row: any) => row.label === 'product').factor).toBeCloseTo(1.2);
  expect(rows.find((row: any) => row.label === 'stagger').factor).toBeCloseTo(1.3);
  expect(rows.reduce((value: number, row: any) => value * row.factor, 1)).toBeCloseTo(
    1.452 * 1.025 * 1.2 * 1.56 * 1.05 * 1.1 * 1.3 * 0.5 * 0.8 * 1.5 * 1.454 * 1.72 * 1.1,
  );
  expect(state.damageDetails.value[0].skillMultiplierRows[0]).toEqual({
    label: '倍率计算',
    value: '1 × 2 = 2',
  });
});

it('keeps flat, additive percentage and independent attack sources separate without changing receipts', async () => {
  const entry: CombatReceiptEntry = {
    sequence: 1,
    frame: 0,
    time: 0,
    event: 'DamageApplied',
    data: {
      value: 100,
      attack: 100,
      levelCoefficient: 1 + 89 / 196,
      artsIntensityMultiplier: 1.5,
      artsIntensity: 50,
      sourceLevel: 90,
      reactionDamageKind: 'spellBurst',
      skillType: 'battleSkill',
      nonCriticalDamage: 100,
      criticalDamage: 150,
      directDamageMultiplier: 1.2,
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
            labels: {
              attack: 'ATK',
              criticalRate: 'CRIT',
              levelCoefficient: '等级系数',
              defenseMultiplier: '防御修正',
              artsIntensity: '源石技艺强度',
              levelDetail: (value: number) => `等级 ${value}`,
              artsIntensityDetail: (value: number) => `${value} 点`,
              directMultiplier: '其他倍率',
              defenseDetail: () => '',
            },
          },
        ),
    }),
  );
  const detail = state.damageDetails.value[0];
  expect(detail.contextRows.some((row: any) => row.value === 'battleSkill')).toBe(false);
  expect(detail.canForceCritical).toBe(true);
  const defenseIndex = detail.multiplierRows.findIndex((row: any) => row.label === '防御修正');
  expect(
    detail.multiplierRows.slice(defenseIndex, defenseIndex + 3).map((row: any) => row.label),
  ).toEqual(['防御修正', '等级系数', '源石技艺强度']);
  expect(detail.multiplierRows).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        label: '等级系数',
        detail: '等级 90',
        value: 'x1.454',
        factor: 1 + 89 / 196,
      }),
      expect.objectContaining({ label: '源石技艺强度', detail: '50 点', value: 'x1.500' }),
      expect.objectContaining({ label: '其他倍率', factor: 1.2 }),
    ]),
  );
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
    '100.0% × 60.0%',
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
