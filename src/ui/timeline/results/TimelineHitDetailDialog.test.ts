import { expect, it, vi } from 'vitest';
import {
  createSSRApp,
  effectScope,
  h,
  nextTick,
  reactive,
  ssrContextKey,
  type ComponentOptions,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import Dialog from './TimelineHitDetailDialog.vue';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';

it('按旧版顺序展示独立乘区，失衡只从独立增伤中拆出一次', async () => {
  const entry: CombatReceiptEntry = {
    sequence: 1,
    frame: 0,
    time: 0,
    event: 'DamageApplied',
    targetId: 'enemy:second',
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
      additionalScaleMultiplier: 1.1,
      criticalExpectationMultiplier: 1.025,
      criticalRate: 0.05,
      criticalDamageIncrease: 0.5,
    },
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
            entries: [entry, { ...entry, sequence: 2 }],
            initialSequence: 2,
            targetLabel: '伤害对象',
            operatorLabel: (id: string) => (id === 'enemy:second' ? '第二目标' : id),
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
              additionalScale: 'effectiveness',
              defenseDetail: () => '',
              stacksDetail: (count: string) => `${count} 层`,
            },
          },
        ),
    }),
  );
  expect(state.damageIndex.value).toBe(1);
  const rows = state.damageDetails.value[0].multiplierRows;
  expect(state.damageDetails.value[0].contextRows).toContainEqual({
    label: '伤害对象',
    value: '第二目标',
  });
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
  expect(rows.find((row: any) => row.label === 'bonus').detail).toBe('+32%');
  expect(rows.find((row: any) => row.label === 'combo').detail).toBe('3 层');
  expect(rows.find((row: any) => row.label === 'critical').detail).toBe('5% × 50%');
  expect(rows.find((row: any) => row.label === 'resistance').detail).toBe('40% → 20%');
  expect(rows.find((row: any) => row.label === 'product').factor).toBeCloseTo(1.2);
  expect(rows.find((row: any) => row.label === 'stagger').factor).toBeCloseTo(1.3);
  expect(rows.reduce((value: number, row: any) => value * row.factor, 1)).toBeCloseTo(
    1.452 * 1.025 * 1.2 * 1.56 * 1.05 * 1.1 * 1.3 * 0.5 * 0.8 * 1.5 * 1.454 * 1.72 * 1.1,
  );
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
      artsIntensity: 50.123456789,
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
        sourceId: 'operator',
        panelSource: {
          kind: 'equipment',
          contribution: { kind: 'weaponTrait', slug: 'weapon', traitKey: 'attack-percent' },
        },
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
            entries: [entry],
            contributionSourceLabel: () => '武器词条',
            damageTypeLabel: (s: string) => s,
            skillTypeLabel: (s: string) => s,
            labels: {
              attack: 'ATK',
              criticalRate: 'CRIT',
              levelCoefficient: '等级系数',
              defenseMultiplier: '防御修正',
              artsIntensity: '源石技艺强度',
              levelDetail: (value: string) => `等级 ${value}`,
              artsIntensityDetail: (value: string) => {
                expect(typeof value).toBe('string');
                return `${value} 点`;
              },
              directMultiplier: '其他倍率',
              defenseDetail: () => '',
            },
          },
        ),
    }),
  );
  const detail = state.damageDetails.value[0];
  expect(detail.contextRows.some((row: any) => row.value === 'battleSkill')).toBe(false);
  expect(state.criticalKey.value).toBeUndefined();
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
      expect.objectContaining({ label: '源石技艺强度', detail: '50.123 点', value: 'x1.5' }),
      expect.objectContaining({ label: '其他倍率', factor: 1.2 }),
    ]),
  );
  expect(detail.attributeSources).toEqual({});
  expect(detail.attackSlotSources.baseFinalAddition).toEqual([{ label: 'flat', value: 'ATK -20' }]);
  expect(detail.attackSlotSources.baseMultiplier).toEqual([
    { label: '武器词条', value: 'ATK +18%' },
  ]);
  expect(detail.attackSlotSources.finalMultiplier).toEqual([
    { label: 'product', value: 'ATK x1.2' },
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
      attack: 716.474,
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
  expect(detail.formula).toContain('≈ 716.474');
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
      skillMultiplierPercent: 324,
      skillMultiplierSourceKey: 'atk_scale_final',
      criticalRate: 1.25,
      criticalDamageIncrease: 0.6,
      criticalExpectationMultiplier: 1.6,
    },
    skillMultiplierCalculation: {
      operation: 'multiply',
      left: 0.54,
      right: 6,
      result: 3.24,
      leftKey: 'atk_scale_final',
      rightKey: 'final_rate',
      leftCalculation: {
        operation: 'add',
        left: 0.45,
        right: 0.09,
        result: 0.54,
        leftKey: 'atk_scale',
        rightKey: 'atk_up_final',
        rightCalculation: {
          operation: 'multiply',
          left: 0.09,
          right: 1,
          result: 0.09,
          leftKey: 'atk_up_per_conduct',
          rightKey: 'conductCnt',
        },
      },
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
            entries: [entry],
            contributionSourceLabel: () => '',
            damageTypeLabel: (s: string) => s,
            skillTypeLabel: (s: string) => s,
            labels: {
              skillMultiplier: 'Skill Multiplier',
              baseMultiplier: '基础倍率',
              fixedMultiplier: '额外倍率',
              hitFraction: '本次命中占比',
              fromSource: (name: string) => `from ${name}`,
              skillMultiplierKeyLabel: (key: string) =>
                (
                  ({
                    atk_scale: '基础倍率',
                    atk_scale_enhence: '强化倍率',
                    damage_enhence: '伤害强化',
                    atk_scale_final: '计算后倍率',
                    atk_up_per_conduct: '每层导电倍率加成',
                    conductCnt: '导电层数',
                    atk_up_final: '导电倍率加成',
                    final_rate: '末段雷击倍率',
                  }) as Record<string, string>
                )[key],
              multiplierAddition: '倍率加算',
              buffStackSourceLabel: (kind: string, key: string) =>
                kind === 'tag' && key === 'Skill/Character/Common/SpellInflict/CrystInflict'
                  ? '寒冷附着'
                  : undefined,
              artsIntensity: '技艺强度',
              stacksDetail: (stacks: string) => `${stacks} 层`,
              criticalRate: 'CRIT',
              criticalDamage: 'CRIT DMG',
              defenseDetail: () => '',
            },
          },
        ),
    }),
  );
  const detail = state.damageDetails.value[0];
  for (const layers of [0, 1, 3]) {
    expect(
      state.skillMultiplierCalculationRows(
        {
          operation: 'multiply',
          left: 2.4,
          right: layers,
          result: 2.4 * layers,
          leftKey: 'atk_scale3',
          rightKey: 'infliction_num',
          rightCalculation: {
            operation: 'assign',
            left: 0,
            right: layers,
            result: layers,
            sourceKind: 'buffTagStackCount',
            rightKey: 'Skill/Character/Common/SpellInflict/CrystInflict',
          },
        },
        'final_combo_atkscale',
      ),
    ).toEqual([
      ...(layers === 1
        ? []
        : [
            { label: '基础倍率', value: '240%' },
            { label: '寒冷附着', detail: `${layers} 层`, value: `x${layers}` },
          ]),
    ]);
  }
  expect(detail.baseRows[0]).toEqual({ label: 'Skill Multiplier', value: '324%' });
  expect(detail.skillMultiplierSources).toEqual([
    { label: '基础倍率', value: '45%' },
    { label: '导电倍率加成', detail: '1 层 × 9%', value: '+9%' },
    { label: '末段雷击倍率', value: 'x6' },
  ]);
  expect(
    state.skillMultiplierCalculationRows(
      entry.skillMultiplierCalculation!.leftCalculation,
      'atk_scale_final',
    ),
  ).toEqual(detail.skillMultiplierSources.slice(0, 2));
  expect(
    state.skillMultiplierCalculationRows(
      {
        operation: 'multiply',
        left: 1,
        right: 2,
        result: 2,
        leftKey: 'unknown_internal_key',
      },
      'another_unknown_key',
    )[0].label,
  ).not.toMatch(/unknown_internal_key|another_unknown_key/);
  expect(
    state.skillMultiplierCalculationRows(
      {
        operation: 'multiply',
        left: 1.5,
        right: 0.1,
        result: 0.15,
        leftKey: 'atk_scale',
      },
      'atk_scale_once',
    ),
  ).toEqual([
    { label: '基础倍率', value: '150%' },
    { label: '本次命中占比', value: '10%' },
  ]);
  expect(
    state.skillMultiplierCalculationRows(
      {
        operation: 'multiply',
        left: 1.5,
        right: 0.1,
        result: 0.15,
        leftKey: 'atk_scale',
      },
      'atk_scale',
    ),
  ).toEqual([
    { label: '基础倍率', value: '150%' },
    { label: '本次命中占比', value: '10%' },
  ]);
  expect(
    state.skillMultiplierCalculationRows(
      {
        operation: 'multiply',
        left: 1.92,
        right: 0.4,
        result: 0.768,
        leftKey: 'atk_scale_1',
      },
      'atk_scale_once',
    ),
  ).toEqual([
    { label: '基础倍率', value: '192%' },
    { label: '本次命中占比', value: '40%' },
  ]);
  expect(
    state.skillMultiplierCalculationRows(
      {
        operation: 'multiply',
        left: 1.5,
        right: 1.2,
        result: 1.8,
        leftKey: 'atk_scale',
      },
      'atk_scale_final',
    ),
  ).toEqual([
    { label: '基础倍率', value: '150%' },
    { label: '额外倍率', value: 'x1.2' },
  ]);
  expect(
    state.skillMultiplierCalculationRows(
      { operation: 'divide', left: 1.5, right: 2, result: 0.75, leftKey: 'atk_scale' },
      'atk_scale',
    ),
  ).toEqual([
    { label: '基础倍率', value: '150%' },
    { label: '额外倍率', value: 'x0.5' },
  ]);
  expect(
    state.skillMultiplierCalculationRows(
      { operation: 'multiply', left: 1.5, right: 2, result: 7, leftKey: 'atk_scale' },
      'atk_scale',
    ),
  ).toEqual([]);
  expect(
    state.skillMultiplierCalculationRows(
      {
        operation: 'multiply',
        left: 1,
        right: 1.6,
        result: 1.6,
        leftKey: 'atk_scale_base',
        rightKey: 'atk_scale_enhence',
      },
      'atk_scale_total',
    ),
  ).toEqual([
    { label: '基础倍率', value: '100%' },
    { label: '强化倍率', value: 'x1.6' },
  ]);
  expect(
    state.skillMultiplierCalculationRows(
      {
        operation: 'multiply',
        left: 1,
        right: 0.4,
        result: 0.4,
        leftKey: 'atk_scale_base',
        rightKey: 'unknown_factor',
      },
      'atk_scale_total',
    ),
  ).toEqual([
    { label: '基础倍率', value: '100%' },
    { label: '额外倍率', value: 'x0.4' },
  ]);
  const burstBase = {
    operation: 'multiply',
    left: 1.6,
    right: 1,
    result: 1.6,
    sourceKind: 'skillSetting',
    sourceColumn: 1,
  } as const;
  const burstScale = (factor: number) => ({
    operation: 'multiply' as const,
    left: 1.6,
    right: factor,
    result: 1.6 * factor,
    leftKey: 'atk_scale',
    rightKey: 'damage_enhence',
    leftCalculation: burstBase,
    rightCalculation: {
      operation: 'multiply' as const,
      left: factor,
      right: 1,
      result: factor,
      leftKey: 'potential_damage_rate',
    },
  });
  expect(state.skillMultiplierCalculationRows(burstScale(1), 'atk_scale')).toEqual([]);
  expect(
    state.skillMultiplierCalculationRows(
      {
        operation: 'assign',
        left: 0,
        right: 2.6,
        result: 2.6,
        sourceKind: 'skillBlackboard',
        sourceSkillId: 'chr_0032_lizhiyan_combo_skill',
        sourceSkillLevel: 12,
        sourceKey: 'atk_scale_laser2',
      },
      'atk_scale_laser2',
    ),
  ).toEqual([]);
  expect(state.skillMultiplierCalculationRows(burstScale(1.1), 'atk_scale')).toEqual([
    { label: '基础倍率', value: '160%' },
    { label: '伤害强化', value: 'x1.1' },
  ]);
  expect(
    state.skillMultiplierCalculationRows(
      {
        operation: 'multiply',
        left: 0.45,
        right: 6,
        result: 2.7,
        leftCalculation: {
          operation: 'assign',
          left: 0,
          right: 0.45,
          result: 0.45,
          sourceKind: 'skillBlackboard',
          sourceSkillId: 'source-skill',
          sourceSkillLevel: 12,
          sourceKey: 'atk_scale',
        },
      },
      'atk_scale',
    ),
  ).toEqual([
    { label: '基础倍率', value: '45%' },
    { label: '额外倍率', value: 'x6' },
  ]);
  expect(
    state.skillMultiplierCalculationRows({ ...burstBase, right: 1.25, result: 2 }, 'atk_scale'),
  ).toEqual([
    { label: '基础倍率', value: '160%' },
    { label: '技艺强度', value: 'x1.25' },
  ]);
  expect(
    state.skillMultiplierCalculationRows(
      { operation: 'multiply', left: 1.6, right: 1, result: 1.6, leftKey: 'atk_scale' },
      'atk_scale',
    ),
  ).toEqual([]);
  expect(
    state.skillMultiplierCalculationRows(
      {
        operation: 'multiply',
        left: 2,
        right: 1.2,
        result: 2.4,
        rightKey: 'unknown_factor',
        rightCalculation: {
          operation: 'multiply',
          left: 1.2,
          right: 1,
          result: 1.2,
          leftKey: 'unknown_factor',
        },
      },
      'unknown_total',
    ),
  ).toEqual([
    { label: '基础倍率', value: '200%' },
    { label: '额外倍率', value: 'x1.2' },
  ]);
  const complexBurstRows = state.skillMultiplierCalculationRows(
    {
      operation: 'multiply',
      left: 1.6,
      right: 1.2,
      result: 1.92,
      leftKey: 'atk_scale',
      rightKey: 'damage_enhence',
      leftCalculation: burstBase,
      rightCalculation: {
        operation: 'add',
        left: 1,
        right: 0.2,
        result: 1.2,
      },
    },
    'atk_scale',
  );
  expect(complexBurstRows).toEqual([
    { label: '基础倍率', value: '160%' },
    { label: '伤害强化', value: 'x1.2' },
  ]);
  state.toggleSkillMultiplierDetail(3);
  expect(state.openSkillMultiplierDetails.value.has(3)).toBe(true);
  expect(detail.criticalRateRaw).toBe(1.25);
  expect(detail.criticalRateEffective).toBe(1);
  expect(
    detail.multiplierRows.find(
      (row: { expandsCriticalDetails?: boolean }) => row.expandsCriticalDetails,
    )?.detail,
  ).toBe('100% × 60%');
  expect(detail.criticalDamageIncrease).toBe(0.6);
  expect(detail.criticalRateSources).toEqual([{ label: 'rate-buff', value: '+25%' }]);
  expect(detail.criticalDamageSources).toEqual([{ label: 'damage-buff', value: '+10%' }]);
  state.toggleCriticalDetail(3);
  expect(state.openCriticalDetails.value.has(3)).toBe(true);
  state.onClose();
  expect(state.openCriticalDetails.value.size).toBe(0);
  expect(state.openSkillMultiplierDetails.value.size).toBe(0);
});

it('按当前页的身份设置标记，重算后跟随同一命中并显示已结算的非暴击结果', async () => {
  const hit = (sequence: number, key: string, canEdit: boolean): CombatReceiptEntry => ({
    event: 'DamageApplied',
    frame: 1,
    time: 1 / 30,
    sequence,
    data: {
      hitIdentity: key,
      canBreakWeakness: canEdit,
      canCritical: canEdit,
      value: 85,
      criticalDamage: 100,
      nonCriticalDamage: 100,
      expectedDamage: 105,
      hitCriticalOverride: canEdit ? false : null,
      criticalMultiplier: 1,
      criticalExpectationMultiplier: 1.05,
    },
  });
  const first = hit(5, 'first', false),
    second = hit(7, 'second', true);
  const props = reactive({
    entries: [first, second],
    visible: true,
    initialSequence: 5,
    randomMode: 'expected',
    criticalOverrides: { second: false },
    weaknessBreaks: {},
    labels: {
      criticalResult: '结果',
      criticalHit: '暴击',
      nonCriticalHit: '未暴击',
      forceNonCritical: '强制不暴击',
      criticalExpectation: '期望',
      expectedDamage: '期望伤害',
      actualDamage: '本次伤害',
      forcedDamage: '强制暴击伤害',
      forcedNonCriticalDamage: '强制非暴击伤害',
      defenseDetail: () => '',
    },
  });
  const scope = effectScope();
  try {
    const emit = vi.fn();
    const app = createSSRApp({});
    app.provide(ssrContextKey, { modules: new Set() });
    const state = app.runWithContext(() =>
      scope.run(() => (Dialog as any).setup(props, { emit, expose: () => {} })),
    );
    expect(state.criticalKey.value).toBeUndefined();
    expect(state.weaknessKey.value).toBeUndefined();
    state.setCriticalSelection(true);
    state.setWeaknessSelection(true);
    expect(emit).not.toHaveBeenCalled();
    state.damageIndex.value = 1;
    expect(state.criticalSelection.value).toBe(false);
    expect(state.criticalLabel.value).toBe('强制不暴击');
    state.setCriticalSelection(null);
    state.setWeaknessSelection(true);
    expect(emit.mock.calls).toEqual([
      ['setCriticalOverride', 'second', undefined],
      ['setWeaknessBreak', 'second', true],
    ]);
    props.entries = [hit(8, 'second', true), hit(11, 'first', false)];
    props.initialSequence = 11;
    await nextTick();
    expect(state.damageIndex.value).toBe(0);
    expect(state.criticalKey.value).toBe('second');
    const detail = state.damageDetails.value[0];
    expect(detail).toMatchObject({ headline: 85, headlineLabel: '强制非暴击伤害', isForced: true });
    const resultRow = (index: number) =>
      state.damageDetails.value[index].multiplierRows.find(
        (row: { label: string }) => row.label === '结果',
      );
    expect(resultRow(0)).toMatchObject({
      detail: '未暴击',
      expandsCriticalDetails: false,
      tooltip: undefined,
      factor: 1,
    });
    expect(state.damageDetails.value[1].headlineLabel).toBe('期望伤害');
    props.randomMode = 'sampled';
    const critical = hit(8, 'second', true);
    props.entries[0] = {
      ...critical,
      data: {
        ...critical.data,
        hitCriticalOverride: true,
        isCritical: true,
        criticalMultiplier: 1.5,
      },
    };
    expect(state.damageDetails.value.map((item: any) => item.headlineLabel)).toEqual([
      '强制暴击伤害',
      '本次伤害',
    ]);
    expect(resultRow(0)).toMatchObject({
      detail: '暴击',
      expandsCriticalDetails: false,
      tooltip: undefined,
      factor: 1.5,
    });
    expect(resultRow(1).expandsCriticalDetails).toBe(true);
  } finally {
    scope.stop();
  }
});

it('打断失衡值与命中绑定，参考招式取自当前目标，选用后可手填', () => {
  const hit = (sequence: number, targetId: string): CombatReceiptEntry => ({
    event: 'DamageApplied',
    sequence,
    frame: 1,
    time: 1 / 30,
    targetId,
    data: { canBreakWeakness: true, hitIdentity: `hit-${sequence}` },
  });
  const skillId = 'eny_0018_lbtough_skill02';
  const props = reactive({
    visible: true,
    entries: [hit(1, 'enemy:a'), hit(2, 'enemy:b')],
    weaknessBreaks: { 'hit-1': true, 'hit-2': { stagger: 8 } },
    weaknessBreakOptions: (targetId: string) =>
      targetId === 'enemy:a'
        ? [
            { skillId, stagger: 10 },
            { skillId, stagger: 25 },
          ]
        : [],
  });
  const scope = effectScope();
  try {
    const emit = vi.fn();
    const app = createSSRApp({});
    app.provide(ssrContextKey, { modules: new Set() });
    const state = app.runWithContext(() =>
      scope.run(() => (Dialog as any).setup(props, { emit, expose: () => {} })),
    );
    expect(state.weaknessStagger.value).toBe(0);
    expect(state.enemySkillOptions.value.map((option: { label: string }) => option.label)).toEqual([
      'skill02 · 10',
      'skill02 · 25',
    ]);
    state.setWeaknessStagger(state.enemySkillOptions.value[1].stagger);
    state.setWeaknessStagger(3.5);
    expect(emit.mock.calls).toEqual([
      ['setWeaknessBreakStagger', 'hit-1', 25],
      ['setWeaknessBreakStagger', 'hit-1', 3.5],
    ]);
    state.damageIndex.value = 1;
    expect(state.weaknessStagger.value).toBe(8);
    expect(state.enemySkillOptions.value).toEqual([]);
    emit.mockClear();
    for (const invalid of [-1, NaN, Infinity]) state.setWeaknessStagger(invalid);
    state.setWeaknessStagger(8);
    expect(emit).not.toHaveBeenCalled();
    state.setWeaknessStagger(undefined);
    expect(emit.mock.calls).toEqual([['setWeaknessBreakStagger', 'hit-2', 0]]);
    state.damageIndex.value = 0;
    props.weaknessBreaks['hit-1'] = false;
    expect(state.enemySkillOptions.value).toEqual([]);
    emit.mockClear();
    state.setWeaknessStagger(5);
    expect(emit).not.toHaveBeenCalled();
  } finally {
    scope.stop();
  }
});
