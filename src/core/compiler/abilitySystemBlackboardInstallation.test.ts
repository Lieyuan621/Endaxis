import { describe, expect, it } from 'vitest';
import { parseAbilitySystemBlackboardsSource } from '../../../tools/game-data-compiler/src/source/abilitySystemBlackboards.ts';
import { compileAbilitySystemBlackboardsSource } from '../../../tools/game-data-compiler/src/compiler/abilities/abilitySystemBlackboards.ts';
import { ActionBlackboard } from '../combat/actions/actionBlackboard';

const pair = (key: string, valueDouble = 0, valueStr = '') => ({
  key,
  valueDouble,
  valueStr,
  isDynamic: true,
});
const sample = (enabled = true) => ({
  entityBlackboard: [
    pair('EntityBB_consumed_type'),
    pair('EntityBB_consumed_layer'),
    pair('EntityBB_ult_hit'),
    pair('EntityBB_wisd_greater_will', 1),
  ],
  skillDataBundle: {
    enableComboSkillBlackboard: enabled,
    comboSkillBlackboard: [pair('consumed_type'), pair('consumed_layer')],
  },
});

describe('公共模板黑板安装投影', () => {
  it('真实 4/2 初值分别进入实体与每条条件的运行板，动态项不被过滤', () => {
    const parsed = parseAbilitySystemBlackboardsSource(sample(), 'character.abilitySystem');
    const compiled = compileAbilitySystemBlackboardsSource(parsed);
    expect(compiled.source).toBe(parsed);
    expect(compiled.entityInitialValues).toEqual({
      EntityBB_consumed_type: 0,
      EntityBB_consumed_layer: 0,
      EntityBB_ult_hit: 0,
      EntityBB_wisd_greater_will: 1,
    });
    const entity = new ActionBlackboard(compiled.entityInitialValues);
    const first = new ActionBlackboard(compiled.comboConditionInitialValues!, entity);
    const second = new ActionBlackboard(compiled.comboConditionInitialValues!, entity);
    first.assignDynamic('consumed_type', 3);
    first.assignDynamic('EntityBB_consumed_type', 2);
    expect(second.getNumber('consumed_type')).toBe(0);
    expect(second.getNumber('EntityBB_consumed_type')).toBe(2);
    expect(compiled.entityInitialValues.EntityBB_consumed_type).toBe(0);
    expect(compiled.comboConditionInitialValues!.consumed_type).toBe(0);
    const newEntity = new ActionBlackboard(compiled.entityInitialValues);
    expect(newEntity.getNumber('EntityBB_consumed_type')).toBe(0);
    expect(newEntity.getNumber('consumed_type')).toBeUndefined();
  });

  it('禁用条件板与启用空板不同，源声明仍完整保留', () => {
    const disabled = compileAbilitySystemBlackboardsSource(
      parseAbilitySystemBlackboardsSource(sample(false), 'data'),
    );
    expect(disabled.comboConditionInitialValues).toBeNull();
    expect(disabled.source.comboCondition.initialValues).toHaveLength(2);
    const empty = sample();
    empty.skillDataBundle.comboSkillBlackboard = [];
    expect(
      compileAbilitySystemBlackboardsSource(parseAbilitySystemBlackboardsSource(empty, 'data'))
        .comboConditionInitialValues,
    ).toEqual({});
  });

  it('字符串及 double 字面值无损保留，不提前 float 化或套用 SkillPatch', () => {
    const input = sample();
    input.entityBlackboard.push(pair('label', 0, 'native'), pair('value', 1.0000000001));
    const compiled = compileAbilitySystemBlackboardsSource(
      parseAbilitySystemBlackboardsSource(input, 'data'),
    );
    expect(compiled.entityInitialValues.label).toBe('native');
    expect(compiled.entityInitialValues.value).toBe(1.0000000001);
  });
});
