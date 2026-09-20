import { describe, expect, it } from 'vitest';
import { ATTRIBUTE_MODIFIER_SOURCES } from '../state/foundationState';
import { createCombatAttributeModifier, attributeModifierValues } from './combatAttributes';
import {
  createOperatorAttackAttributes,
  resolveOperatorAttack,
  type OperatorAttackDerivationInput,
} from './operatorAttackAttributes';

const input: OperatorAttackDerivationInput = {
  attributes: { strength: 100, agility: 80, intellect: 120, will: 200 },
  attackBeforeAttributeScalar: 500,
  artsIntensity: 16,
  mainAttribute: 'intellect',
  secondaryAttribute: 'will',
};

describe('operator attack attributes', () => {
  it('adds build and runtime attack multipliers in one native slot and preserves flat additions', () => {
    const build = {
      ...input,
      attackBeforeAttributeScalar: 714 * 1.312 + 20,
      attackBase: { rawValue: 714, baseMultiplier: 0.312, baseFinalAddition: 20 },
    };
    const attributes = createOperatorAttackAttributes(build);
    expect(attributes.get('Atk')).toBeCloseTo(build.attackBeforeAttributeScalar);
    const buff = createCombatAttributeModifier(
      'Atk',
      attributeModifierValues('baseMultiplier', 0.2),
      ATTRIBUTE_MODIFIER_SOURCES.buff,
      'runtime',
    );
    attributes.addModifier(buff);
    expect(attributes.get('Atk')).toBeCloseTo(714 * (1 + 0.312 + 0.2) + 20);
    expect(resolveOperatorAttack(build, attributes)).toBe(
      Math.floor((714 * 1.512 + 20) * (1 + 120 * Math.fround(0.005) + 200 * Math.fround(0.002))),
    );
    attributes.removeModifier(buff);
    expect(attributes.get('Atk')).toBeCloseTo(build.attackBeforeAttributeScalar);
  });

  it('keeps combo cooldown period and recovery scalars as distinct native attributes', () => {
    const attributes = createOperatorAttackAttributes(input);

    expect(attributes.get('ComboSkillCooldownScalar')).toBe(1);
    expect(attributes.get('ComboSkillCooldownRecoveryScalar')).toBe(1);
  });

  it('exposes panel defense through the native Def runtime attribute', () => {
    const attributes = createOperatorAttackAttributes({ ...input, defense: 420 });

    expect(attributes.get('Def')).toBe(420);
  });

  it('uses panel arts intensity as native infliction enhance and accepts Buff additions', () => {
    const attributes = createOperatorAttackAttributes(input);
    attributes.addModifier(
      createCombatAttributeModifier(
        'PhysicalAndSpellInflictionEnhance',
        attributeModifierValues('baseAddition', 10),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );

    expect(attributes.get('PhysicalAndSpellInflictionEnhance')).toBe(26);
  });

  it('从面板初始化终结技回能效率并保留 Buff 动态修正', () => {
    const attributes = createOperatorAttackAttributes({
      ...input,
      ultimateEnergyGainEfficiency: 1.2,
    });
    attributes.addModifier(
      createCombatAttributeModifier(
        'UltimateSpGainScalar',
        attributeModifierValues('baseAddition', 0.05),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );

    expect(attributes.get('UltimateSpGainScalar')).toBeCloseTo(1.25);
  });

  it('按 AttributeMetaTable 承载并限制关键词加速倍率', () => {
    const attributes = createOperatorAttackAttributes(input);
    attributes.addModifier(
      createCombatAttributeModifier(
        'KeywordSpeedUpScalar',
        attributeModifierValues('baseAddition', 0.5),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );

    expect(attributes.get('KeywordSpeedUpScalar')).toBe(1.3);
  });

  it('按原生主副属性系数计算静态攻击', () => {
    const attributes = createOperatorAttackAttributes(input);

    expect(resolveOperatorAttack(input, attributes)).toBe(
      Math.floor(500 * (1 + 120 * Math.fround(0.005) + 200 * Math.fround(0.002))),
    );
  });

  it('运行时 Buff 修改派生系数后重新计算攻击', () => {
    const attributes = createOperatorAttackAttributes(input);
    attributes.addModifier(
      createCombatAttributeModifier(
        'AtkIncreaseFactorFromWisd',
        attributeModifierValues('baseAddition', 0.001),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );
    attributes.addModifier(
      createCombatAttributeModifier(
        'AtkIncreaseFactorFromWill',
        attributeModifierValues('baseAddition', 0.001),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );

    expect(resolveOperatorAttack(input, attributes)).toBe(
      Math.floor(
        500 * (1 + 120 * (Math.fround(0.005) + 0.001) + 200 * (Math.fround(0.002) + 0.001)),
      ),
    );
  });

  it('applies native Atk base-multiplier buffs before attribute scaling', () => {
    const attributes = createOperatorAttackAttributes(input);
    attributes.addModifier(
      createCombatAttributeModifier(
        'Atk',
        attributeModifierValues('baseMultiplier', 0.4),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );

    expect(resolveOperatorAttack(input, attributes)).toBe(
      Math.floor(500 * 1.4 * (1 + 120 * Math.fround(0.005) + 200 * Math.fround(0.002))),
    );
  });

  it('keeps static damage-scale BaseAddition and Addition in their native formula stages', () => {
    const attributes = createOperatorAttackAttributes({
      ...input,
      combatModifiers: [
        { kind: 'damageScale', target: 'nature', slot: 'baseAddition', value: 0.2 },
        { kind: 'damageScale', target: 'nature', slot: 'addition', value: 0.1 },
      ],
    });
    attributes.addModifier(
      createCombatAttributeModifier(
        'natureDamageIncrease',
        attributeModifierValues('baseMultiplier', 0.5),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );

    expect(attributes.get('natureDamageIncrease')).toBeCloseTo(0.4);
  });

  it('derives healing attributes from Will and static progression modifiers', () => {
    const attributes = createOperatorAttackAttributes({
      ...input,
      combatModifiers: [
        { kind: 'staticHealingIncrease', target: 'output', value: 0.1 },
        { kind: 'staticHealingIncrease', target: 'taken', value: 0.05 },
      ],
    });

    expect(attributes.get('healOutputIncrease')).toBeCloseTo(0.1);
    expect(attributes.get('healTakenIncrease')).toBeCloseTo(0.25);
  });

  it('按 AttributeMetaTable 承载治疗套装施加的全类型受伤倍率', () => {
    const attributes = createOperatorAttackAttributes(input);
    attributes.addModifier(
      createCombatAttributeModifier(
        'PhysicalDamageTakenScalar',
        attributeModifierValues('baseFinalMultiplier', 0.7),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );

    expect(attributes.get('PhysicalDamageTakenScalar')).toBeCloseTo(0.7);
    expect(attributes.get('EtherDamageTakenScalar')).toBe(1);
  });
});
