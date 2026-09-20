import { describe, expect, it } from 'vitest';
import type { CombatBuffSpellBurstDefinition } from '../buffs/combatBuffDefinitions';
import type { PlayerDamageDefenderSnapshot } from '../damage/playerActiveDamageInput';
import { createSkillSettingSource, type SkillSettingsDocument } from './skillSettings';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { CombatVitals } from '../resources/combatVitals';
import {
  executeSpellBurst as executeBurst,
  resolveSpellBurstEnhanceFactor,
  type ExecuteSpellBurstInput,
} from './spellBurstRuntime';
import type { PlayerDamageOperationDependencies } from '../damage/playerDamageOperationExecutor';
import {
  DAMAGE_SCALE_ATTRIBUTE_KEYS,
  type DamageScaleAttributeSnapshot,
} from '../damage/damageScaleAttributes';

const scaleAttributes = Object.fromEntries(
  DAMAGE_SCALE_ATTRIBUTE_KEYS.map(key => [key, 0]),
) as unknown as DamageScaleAttributeSnapshot;

/** 单元测试的静态战场；生产环境必须注入实际属性、事件和护盾端口。 */
function executeSpellBurst(
  input: Omit<ExecuteSpellBurstInput, 'damage'> & {
    sourceId: string;
    attack: number;
    criticalRate: number;
    criticalDamageIncrease: number;
    weaknessDamageMultiplier: number;
    criticalSample: number;
    defender: PlayerDamageDefenderSnapshot;
    target: CombatVitals;
    clock: CombatClock;
    receipt: CombatReceiptCollector;
    skillCastInfo?: PlayerDamageOperationDependencies['skillCastInfo'];
    attackDetail?: PlayerDamageOperationDependencies['attackDetail'];
    emitSourceEvent: PlayerDamageOperationDependencies['emitHealthSourceEvent'];
    emitTargetEvent: PlayerDamageOperationDependencies['emitHealthTargetEvent'];
  },
) {
  return executeBurst({
    definition: input.definition,
    settings: input.settings,
    enhance: input.enhance,
    damage: {
      sourceOperatorId: input.sourceId,
      targetId: 'enemy',
      targetVitals: input.target,
      clock: input.clock,
      receipt: input.receipt,
      ...(input.skillCastInfo === undefined
        ? {}
        : {
            skillCastInfo: input.skillCastInfo,
            sourceActionId: input.skillCastInfo.originCastId,
          }),
      ...(input.attackDetail === undefined ? {} : { attackDetail: input.attackDetail }),
      captureAttributeSnapshots: () => ({
        attacker: {
          ...scaleAttributes,
          attack: input.attack,
          criticalRate: input.criticalRate,
          criticalDamageIncrease: input.criticalDamageIncrease,
          weaknessDamageMultiplier: input.weaknessDamageMultiplier,
          igniteDamageMultiplier: 1,
          physicalInflictionDamageMultiplier: 1,
        },
        defender: { ...scaleAttributes, ...input.defender },
      }),
      criticalSamples: { nextCriticalSample: () => input.criticalSample },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      applyDamageModifiers: () => undefined,
      clearInstantAttributeModifiers: () => undefined,
      addInstantAttributeModifier: () => undefined,
      emitPreparationEvent: () => undefined,
      resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
      emitHealthSourceEvent: input.emitSourceEvent,
      emitHealthTargetEvent: input.emitTargetEvent,
      emitPoiseSourceEvent: () => undefined,
      emitPoiseTargetEvent: () => undefined,
      delegate: { execute: () => false, evaluate: () => false },
    },
  });
}

const definition: CombatBuffSpellBurstDefinition = {
  burstType: 'Pulse',
  damageType: 'electric',
  skillSettingDataKey: '法术爆发伤害倍率',
  skillSettingColumn: 1,
  atkScaleBase: 50,
};

function settings(): SkillSettingsDocument {
  return {
    schemaVersion: 1,
    revision: 'test',
    data: [
      { key: '法术爆发伤害倍率', values: [1.5, 2, 2.5, 3], enhanceFormulaKey: 'linear' },
      { key: '无增强倍率', values: [2, 3], enhanceFormulaKey: '' },
    ],
    enhanceFormulas: [{ key: 'linear', kind: 'linear', paramA: 0.5 }],
  };
}

function defender(): PlayerDamageDefenderSnapshot {
  return {
    defense: 0,
    shelterDamageMultiplier: 0,
    breakingAttackDamageTakenMultiplier: 1,
    resistances: {
      physical: { percent: 0, damageTakenMultiplier: 1 },
      heat: { percent: 0, damageTakenMultiplier: 1 },
      electric: { percent: 0, damageTakenMultiplier: 1 },
      cryo: { percent: 0, damageTakenMultiplier: 1 },
      nature: { percent: 0, damageTakenMultiplier: 1 },
      ether: { percent: 0, damageTakenMultiplier: 1 },
    },
  };
}

function createVitals() {
  return new CombatVitals({
    health: 10000,
    maxHealth: 10000,
    maxPoise: 0,
    poise: 0,
    poiseRecoveryTime: 0,
    poiseRecoveryTimeMultiplier: 1,
    poiseBrokenEndTime: 0,
    poiseImmune: false,
  });
}

describe('resolveSpellBurstEnhanceFactor', () => {
  it('按线性与饱和公式计算增强倍率，无公式退化为 1', () => {
    const source = createSkillSettingSource(settings());
    expect(resolveSpellBurstEnhanceFactor(source, 'linear', 0)).toBe(1);
    expect(resolveSpellBurstEnhanceFactor(source, 'linear', 2)).toBe(2);
    expect(resolveSpellBurstEnhanceFactor(source, 'missing', 3)).toBe(1);
    expect(resolveSpellBurstEnhanceFactor(source, '', 3)).toBe(1);
  });

  it('增强公式存在但来源增强属性不可用时明确失败', () => {
    const source = createSkillSettingSource(settings());
    expect(() => resolveSpellBurstEnhanceFactor(source, 'linear', null)).toThrow(
      'requires the source infliction-enhance attribute',
    );
    // 无增强公式的倍率不需要来源属性。
    expect(resolveSpellBurstEnhanceFactor(source, '', null)).toBe(1);
  });
});

describe('executeSpellBurst', () => {
  it.each([
    ['Fire', 'heat'],
    ['Pulse', 'electric'],
    ['Cryst', 'cryo'],
    ['Natural', 'nature'],
  ] as const)(
    'freezes %s burst damage identity and detail without a second health write',
    (burstType, damageType) => {
      const receipt = new CombatReceiptCollector();
      const target = createVitals();
      executeSpellBurst({
        definition: { ...definition, burstType, damageType },
        sourceId: 'operator',
        skillCastInfo: {
          skillCastId: 12,
          originCastId: 'cast:original',
          originSkillId: 'battle',
          originSkillType: 'battleSkill',
          nonReturnedSpCost: 100,
        },
        attackDetail: {
          panelAttack: 1000,
          operatorBaseAttack: 800,
          weaponBaseAttack: 200,
          attackPercent: 0,
          flatAttack: 0,
          mainAttribute: 'intellect',
          secondaryAttribute: 'will',
          attributes: { strength: 0, agility: 0, intellect: 0, will: 0 },
          coefficients: { strength: 0, agility: 0, intellect: 0.005, will: 0.002 },
        },
        attack: 1000,
        enhance: 2,
        criticalRate: 0.5,
        criticalDamageIncrease: 0.5,
        weaknessDamageMultiplier: 1,
        criticalSample: 1,
        settings: createSkillSettingSource(settings()),
        defender: defender(),
        target,
        clock: new CombatClock(),
        receipt,
        emitSourceEvent: () => undefined,
        emitTargetEvent: () => undefined,
      });
      const hits = receipt.entries.filter(entry => entry.event === 'DamageApplied');
      expect(hits).toHaveLength(1);
      expect(hits[0]?.data).toMatchObject({
        spellBurstType: burstType,
        sourceActionId: 'cast:original',
        attackDetailOperatorBase: 800,
        attackDetailWeaponBase: 200,
        damageType,
        spellBurstEnhanceFactor: 2,
        attack: 1000,
        skillMultiplierPercent: 300,
        nonCriticalDamage: 3000,
        criticalDamage: 4500,
        expectedDamage: 3750,
        value: 3000,
      });
      expect(target.health).toBe(7000);
    },
  );
  it('按 SkillSetting 倍率与增强公式造成标准伤害', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const target = createVitals();

    const result = executeSpellBurst({
      definition,
      sourceId: 'perlica',
      attack: 1000,
      enhance: 0,
      criticalRate: 0,
      criticalDamageIncrease: 0,
      weaknessDamageMultiplier: 1,
      criticalSample: 1,
      settings: createSkillSettingSource(settings()),
      defender: defender(),
      target,
      clock,
      receipt,
      emitSourceEvent: () => undefined,
      emitTargetEvent: () => undefined,
    });

    // 倍率 1.5 × 增强 1 = 1.5，伤害 = 1000 × 1.5。
    expect(result).toMatchObject({
      burstType: 'Pulse',
      skillScale: 1.5,
      enhanceFactor: 1,
      value: 1500,
    });
    expect(target.health).toBe(8500);
    expect(receipt.entries.at(-1)).toMatchObject({
      event: 'SpellBurstApplied',
      data: { burstType: 'Pulse', value: 1500, remainingHealth: 8500 },
    });
    expect(receipt.entries.some(entry => entry.event === 'DamageApplied')).toBe(true);
  });

  it('来源附着增强属性按公式放大倍率', () => {
    const target = createVitals();
    const result = executeSpellBurst({
      definition,
      sourceId: 'perlica',
      attack: 1000,
      enhance: 2,
      criticalRate: 0,
      criticalDamageIncrease: 0,
      weaknessDamageMultiplier: 1,
      criticalSample: 1,
      settings: createSkillSettingSource(settings()),
      defender: defender(),
      target,
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      emitSourceEvent: () => undefined,
      emitTargetEvent: () => undefined,
    });
    // 线性公式：0.5 × 2 + 1 = 2，倍率 1.5 × 2 = 3。
    expect(result).toMatchObject({ enhanceFactor: 2, value: 3000 });
  });

  it('SkillSetting 缺少倍率数据时严格失败', () => {
    const missing: SkillSettingsDocument = {
      schemaVersion: 1,
      revision: 'test',
      data: [],
      enhanceFormulas: [],
    };
    expect(() =>
      executeSpellBurst({
        definition,
        sourceId: 'perlica',
        attack: 1000,
        enhance: 0,
        criticalRate: 0,
        criticalDamageIncrease: 0,
        weaknessDamageMultiplier: 1,
        criticalSample: 1,
        settings: createSkillSettingSource(missing),
        defender: defender(),
        target: createVitals(),
        clock: new CombatClock(),
        receipt: new CombatReceiptCollector(),
        emitSourceEvent: () => undefined,
        emitTargetEvent: () => undefined,
      }),
    ).toThrow("requires SkillSetting '法术爆发伤害倍率'");
  });

  it('增强公式存在但来源增强属性不可用时严格失败', () => {
    expect(() =>
      executeSpellBurst({
        definition,
        sourceId: 'perlica',
        attack: 1000,
        enhance: null,
        criticalRate: 0,
        criticalDamageIncrease: 0,
        weaknessDamageMultiplier: 1,
        criticalSample: 1,
        settings: createSkillSettingSource(settings()),
        defender: defender(),
        target: createVitals(),
        clock: new CombatClock(),
        receipt: new CombatReceiptCollector(),
        emitSourceEvent: () => undefined,
        emitTargetEvent: () => undefined,
      }),
    ).toThrow('requires the source infliction-enhance attribute');
  });

  it('无增强公式的爆发在来源增强属性缺失时仍可执行', () => {
    const noEnhance: SkillSettingsDocument = {
      schemaVersion: 1,
      revision: 'test',
      data: [{ key: '法术爆发伤害倍率', values: [2, 3], enhanceFormulaKey: '' }],
      enhanceFormulas: [],
    };
    const result = executeSpellBurst({
      definition,
      sourceId: 'perlica',
      attack: 1000,
      enhance: null,
      criticalRate: 0,
      criticalDamageIncrease: 0,
      weaknessDamageMultiplier: 1,
      criticalSample: 1,
      settings: createSkillSettingSource(noEnhance),
      defender: defender(),
      target: createVitals(),
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      emitSourceEvent: () => undefined,
      emitTargetEvent: () => undefined,
    });
    expect(result).toMatchObject({ skillScale: 2, enhanceFactor: 1, value: 2000 });
  });
});
