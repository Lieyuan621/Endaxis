import { describe, expect, it } from 'vitest';

import {
  projectEquipmentAttributeModifier,
  type AttributeModifierSlotSource,
  type AttributeTypeSource,
  type CompiledAttributeModifierTargetSource,
} from '../src/index.ts';

describe('单件装备属性投影', () => {
  it.each([
    ['specific', 'Wisd', 'baseAddition', 'attribute', 'intellect', 'flat'],
    ['sub', 'Level', 'baseAddition', 'attribute', 'secondary', 'flat'],
    ['main', 'Level', 'baseMultiplier', 'attribute', 'main', 'percent'],
    ['specific', 'Def', 'baseAddition', 'panelStat', 'baseDefense', undefined],
    ['specific', 'Atk', 'baseMultiplier', 'panelStat', 'attackPercent', undefined],
    ['specific', 'Atk', 'baseFinalAddition', 'panelStat', 'attackFlat', undefined],
  ] as const)('maps %s/%s/%s', (target, attribute, slot, kind, semanticTarget, operation) => {
    const source = fixture(target, attribute, slot);
    expect(projectEquipmentAttributeModifier(source)).toMatchObject({
      status: 'supported',
      modifier: {
        kind,
        ...(kind === 'attribute' ? { attribute: semanticTarget, operation } : {}),
        ...(kind === 'panelStat' ? { stat: semanticTarget } : {}),
        value: 0.25,
      },
    });
  });

  it('整列数值经过装备投影仍按等级保留', () => {
    const values = Object.freeze([0, 0.25, -0.5]);
    expect(
      projectEquipmentAttributeModifier({
        ...fixture('specific', 'Atk', 'baseMultiplier'),
        value: values,
      }),
    ).toMatchObject({ status: 'supported', modifier: { value: values } });
  });

  it.each([
    ['NormalAttackDamageIncrease', 'normalAttack'],
    ['PulseDamageIncrease', 'electric'],
    ['DamageToBrokenUnitIncrease', 'staggeredEnemy'],
  ] as const)('maps %s to damage scale %s', (attribute, target) => {
    expect(
      projectEquipmentAttributeModifier(fixture('specific', attribute, 'baseAddition')),
    ).toMatchObject({
      status: 'supported',
      modifier: { kind: 'damageScale', target, value: 0.25 },
    });
  });

  it('preserves the distinct native Addition slot for damage-scale attributes', () => {
    expect(
      projectEquipmentAttributeModifier(fixture('specific', 'NaturalDamageIncrease', 'addition')),
    ).toMatchObject({
      status: 'supported',
      modifier: { kind: 'damageScale', target: 'nature', slot: 'addition', value: 0.25 },
    });
  });

  it('preserves native poise-output addition and combo cooldown multiplier semantics', () => {
    expect(
      projectEquipmentAttributeModifier(
        fixture('specific', 'PoiseDamageOutputScalar', 'baseAddition'),
      ),
    ).toMatchObject({
      status: 'supported',
      modifier: { kind: 'panelStat', stat: 'staggerDamagePercent', value: 0.25 },
    });
    expect(
      projectEquipmentAttributeModifier(
        fixture('specific', 'ComboSkillCooldownScalar', 'baseFinalMultiplier'),
      ),
    ).toMatchObject({
      status: 'supported',
      modifier: {
        kind: 'skillCooldownMultiplier',
        skillTypes: 'comboSkill',
        value: 0.25,
      },
    });
  });

  it('maps healing and keeps stump-model-only modifiers as scenario omissions', () => {
    expect(
      projectEquipmentAttributeModifier(fixture('specific', 'HealOutputIncrease', 'baseAddition')),
    ).toMatchObject({
      status: 'supported',
      modifier: { kind: 'staticHealingIncrease', target: 'output', value: 0.25 },
    });
    expect(
      projectEquipmentAttributeModifier(
        fixture('specific', 'FireDamageTakenScalar', 'baseFinalMultiplier'),
      ),
    ).toMatchObject({
      status: 'scenario-omitted',
      reason: 'playerDamageTakenRequiresEnemyActiveDamage',
    });
    expect(
      projectEquipmentAttributeModifier(
        fixture('specific', 'EtherDamageTakenScalar', 'baseAddition'),
      ),
    ).toMatchObject({
      status: 'scenario-omitted',
      reason: 'playerDamageTakenRequiresEnemyActiveDamage',
    });
    expect(
      projectEquipmentAttributeModifier(
        fixture('specific', 'ShieldOutputIncrease', 'baseAddition'),
      ),
    ).toMatchObject({
      status: 'scenario-omitted',
      reason: 'shieldOutputDoesNotAffectStumpEnemyDamage',
    });
  });

  it('整列输入不会绕过未知公式槽或木桩省略边界', () => {
    const value = Object.freeze([0.2, 0.3]);
    expect(
      projectEquipmentAttributeModifier({
        ...fixture('specific', 'Atk', 'baseAddition'),
        value,
      }),
    ).toMatchObject({ status: 'blocked' });
    expect(
      projectEquipmentAttributeModifier({
        ...fixture('specific', 'FireDamageTakenScalar', 'baseFinalMultiplier'),
        value,
      }),
    ).toMatchObject({
      status: 'scenario-omitted',
      reason: 'playerDamageTakenRequiresEnemyActiveDamage',
    });
  });

  it('does not reuse a mapping when the native target or formula slot changes', () => {
    // 公共契约允许受治疗增幅，不意味着当前构筑转换已经支持该原生属性。
    expect(
      projectEquipmentAttributeModifier(fixture('specific', 'HealTakenIncrease', 'baseAddition')),
    ).toMatchObject({ status: 'blocked' });
    expect(
      projectEquipmentAttributeModifier(fixture('specific', 'Atk', 'baseAddition')),
    ).toMatchObject({ status: 'blocked' });
    expect(projectEquipmentAttributeModifier(fixture('all', 'Str', 'baseAddition'))).toMatchObject({
      status: 'blocked',
    });
    expect(
      projectEquipmentAttributeModifier(
        fixture('specific', 'PhysicalDamageTakenScalar', 'baseAddition'),
      ),
    ).toMatchObject({ status: 'blocked' });
  });
});

function fixture(
  target: CompiledAttributeModifierTargetSource,
  declaredAttributeType: AttributeTypeSource,
  slot: AttributeModifierSlotSource,
) {
  return {
    sourcePath: 'EquipTable.fixture.equipAttrModifiers[0]',
    target,
    declaredAttributeType,
    slot,
    value: 0.25,
  };
}
