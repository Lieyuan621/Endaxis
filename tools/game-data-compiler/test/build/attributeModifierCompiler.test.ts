import { describe, expect, it } from 'vitest';

import {
  compileResolvedAttributeModifierSource,
  isCombatRuntimeAttributeRelevant,
  projectCombatRuntimeAttributeKey,
  projectPrimaryAttributeKey,
  resolveCompiledAttributeModifierTargets,
  type ModifyAttributeTypeSource,
  type ModifierTypeSource,
} from '../../src/index.ts';

describe('公共属性修正编译器', () => {
  it('只通过公共入口投影原生四维属性键', () => {
    expect((['Str', 'Agi', 'Wisd', 'Will'] as const).map(projectPrimaryAttributeKey)).toEqual([
      'strength',
      'agility',
      'intellect',
      'will',
    ]);
    expect(projectPrimaryAttributeKey('Atk')).toBeNull();
  });

  it('在进入 Next 运行时时统一投影原生伤害属性身份', () => {
    expect(projectCombatRuntimeAttributeKey('PhysicalDamageIncrease')).toBe(
      'physicalDamageIncrease',
    );
    expect(projectCombatRuntimeAttributeKey('PulseDamageIncrease')).toBe('electricDamageIncrease');
    expect(projectCombatRuntimeAttributeKey('Atk')).toBe('Atk');
  });

  it('公共 IR 保留索敌距离，但固定零空间运行投影将其排除', () => {
    expect(isCombatRuntimeAttributeRelevant('NormalAttackRange')).toBe(false);
    expect(isCombatRuntimeAttributeRelevant('NormalAttackStartRange')).toBe(false);
    expect(isCombatRuntimeAttributeRelevant('MoveSpeedScalar')).toBe(false);
    expect(isCombatRuntimeAttributeRelevant('InAirMoveSpeedScalar')).toBe(false);
    expect(isCombatRuntimeAttributeRelevant('Atk')).toBe(true);
  });

  it('把八个原生数字槽稳定映射到运行时槽位', () => {
    const cases: readonly [ModifierTypeSource, string][] = [
      ['Addition', 'addition'],
      ['Multiplier', 'multiplier'],
      ['FinalAddition', 'finalAddition'],
      ['FinalMultiplier', 'finalMultiplier'],
      ['BaseAddition', 'baseAddition'],
      ['BaseMultiplier', 'baseMultiplier'],
      ['BaseFinalAddition', 'baseFinalAddition'],
      ['BaseFinalMultiplier', 'baseFinalMultiplier'],
    ];
    expect(cases.map(([formulaItem]) => compileFixture('Specific', formulaItem).slot)).toEqual(
      cases.map(([, slot]) => slot),
    );
  });

  it('整列参数保持同一引用，不展开成逐等级修正', () => {
    const values = Object.freeze([0, 1, 2.5]);
    const compiled = compileResolvedAttributeModifierSource({
      sourcePath: 'fixture.modifier',
      modifyAttributeType: 'Main',
      attributeType: 'Atk',
      formulaItem: 'BaseAddition',
      value: values,
    });
    expect(compiled.value).toBe(values);
    expect(resolveCompiledAttributeModifierTargets(compiled, 'Will', 'Str')).toEqual(['Will']);
  });

  it.each([{ value: [] }, { value: [0, Number.NaN] }, { value: [1, Number.POSITIVE_INFINITY] }])(
    '拒绝空列和列内非有限值 $value',
    ({ value }) => {
      expect(() =>
        compileResolvedAttributeModifierSource({
          sourcePath: 'fixture.modifier',
          modifyAttributeType: 'Specific',
          attributeType: 'Str',
          formulaItem: 'BaseAddition',
          value,
        }),
      ).toThrow('attribute modifier value must be finite and level columns must not be empty');
    },
  );

  it('按原生规则展开 Specific、Main、Sub、All，同时保留声明属性', () => {
    const target = (modifyAttributeType: ModifyAttributeTypeSource) =>
      compileFixture(modifyAttributeType, 'BaseAddition');
    expect(resolveCompiledAttributeModifierTargets(target('Specific'), 'Wisd', 'Will')).toEqual([
      'Atk',
    ]);
    expect(resolveCompiledAttributeModifierTargets(target('Main'), 'Wisd', 'Will')).toEqual([
      'Wisd',
    ]);
    expect(resolveCompiledAttributeModifierTargets(target('Sub'), 'Wisd', 'Will')).toEqual([
      'Will',
    ]);
    expect(resolveCompiledAttributeModifierTargets(target('All'), 'Wisd', 'Will')).toEqual([
      'Str',
      'Agi',
      'Wisd',
      'Will',
    ]);
    expect(resolveCompiledAttributeModifierTargets(target('Main'), null, 'Will')).toEqual([]);
    expect(target('Main').declaredAttributeType).toBe('Atk');
  });

  it('拒绝非数值公式槽和非有限值', () => {
    expect(() => compileFixture('Specific', 'None')).toThrow(
      'ModifierType None is not a numeric formula slot',
    );
    expect(() =>
      compileResolvedAttributeModifierSource({
        sourcePath: 'fixture',
        modifyAttributeType: 'Specific',
        attributeType: 'Atk',
        formulaItem: 'BaseAddition',
        value: Number.NaN,
      }),
    ).toThrow('attribute modifier value must be finite');
  });
});

function compileFixture(
  modifyAttributeType: ModifyAttributeTypeSource,
  formulaItem: ModifierTypeSource,
) {
  return compileResolvedAttributeModifierSource({
    sourcePath: 'fixture.modifier',
    modifyAttributeType,
    attributeType: 'Atk',
    formulaItem,
    value: 1,
  });
}
