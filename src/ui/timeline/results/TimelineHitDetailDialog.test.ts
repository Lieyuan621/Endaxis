import { expect, it } from 'vitest';
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
              additionalScale: 'effectiveness',
              defenseDetail: () => '',
              stacksDetail: (count: number) => `${count} 层`,
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
            forceCritical: false,
            resultForceCritical: false,
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
      expect.objectContaining({ label: '源石技艺强度', detail: '50 点', value: 'x1.5' }),
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
            forceCritical: false,
            resultForceCritical: false,
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
              skillSettingSource: (column: number) => `Skill data column ${column}`,
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
              skillMultiplierInternalValue: '技能内部数值',
              buffStackSourceLabel: (kind: string, key: string) =>
                kind === 'tag' && key === 'Skill/Character/Common/SpellInflict/CrystInflict'
                  ? '寒冷附着'
                  : undefined,
              skillMultiplierStep: (step: number) => `计算步骤 ${step}`,
              skillMultiplierResult: '最终倍率',
              artsIntensity: '技艺强度',
              stacksDetail: (stacks: number) => `${stacks} 层`,
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
      {
        label: `最终倍率: 寒冷附着 ${layers} 层 × 240%`,
        value: `${240 * layers}%`,
      },
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
  expect(state.skillMultiplierCalculationRows(burstScale(1), 'atk_scale')).toEqual([
    { label: '基础倍率', value: '160%' },
  ]);
  expect(state.skillMultiplierCalculationRows(burstScale(1.1), 'atk_scale')).toEqual([
    { label: '基础倍率', value: '160%' },
    { label: '伤害强化', value: 'x1.1' },
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
  ).toEqual([{ label: '基础倍率', value: '160%' }]);
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
  ).toHaveLength(1);
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
  expect(complexBurstRows[0]).toEqual({ label: '基础倍率', value: '160%' });
  expect(complexBurstRows).toHaveLength(3);
  state.toggleSkillMultiplierDetail(3);
  expect(state.openSkillMultiplierDetails.value.has(3)).toBe(true);
  expect(detail.criticalRateRaw).toBe(1.25);
  expect(detail.criticalRateEffective).toBe(1);
  expect(detail.multiplierRows.find((row: { kind?: string }) => row.kind === 'crit')?.detail).toBe(
    '100% × 60%',
  );
  expect(detail.criticalDamageIncrease).toBe(0.6);
  expect(detail.criticalRateSources).toEqual([{ label: 'rate-buff', value: '+25%' }]);
  expect(detail.criticalDamageSources).toEqual([{ label: 'damage-buff', value: '+10%' }]);
  expect(detail.multiplierRows.find((row: { kind?: string }) => row.kind === 'crit')).toBeDefined();
  state.toggleCriticalDetail(3);
  expect(state.openCriticalDetails.value.has(3)).toBe(true);
  state.onClose();
  expect(state.openCriticalDetails.value.size).toBe(0);
  expect(state.openSkillMultiplierDetails.value.size).toBe(0);
});
