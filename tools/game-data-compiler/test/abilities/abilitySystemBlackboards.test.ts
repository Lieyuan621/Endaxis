import { describe, expect, it } from 'vitest';
import { parseAbilitySystemBlackboardsSource } from '../../src/source/abilitySystemBlackboards.ts';
import { numericDeclaredBlackboard, parseDeclaredBlackboard } from '../../src/source/blackboard.ts';

const path = 'character.abilitySystem';
const pair = (key: string, valueDouble = 0, isDynamic = true, valueStr = '') => ({
  key,
  valueDouble,
  valueStr,
  isDynamic,
});
// 1.4.4 诀角色 raw SHA256 33934515...58dca0bc；仅固定已完整消费的两段 DataPair。
// 不复制整个 raw/导出 JSON，也不把 908 字节未解码后缀声明为已支持。
function sample() {
  return {
    entityBlackboard: [
      pair('EntityBB_consumed_type'),
      pair('EntityBB_consumed_layer'),
      pair('EntityBB_ult_hit'),
      pair('EntityBB_wisd_greater_will', 1),
    ],
    skillDataBundle: {
      enableComboSkillBlackboard: true,
      comboSkillBlackboard: [pair('consumed_layer'), pair('consumed_type')],
    },
  };
}

describe('AbilitySystem 两层黑板来源', () => {
  it('保留真实四实体键和两条件键，不自动合并到技能黑板', () => {
    const parsed = parseAbilitySystemBlackboardsSource(sample(), path);
    expect(parsed.entity.initialValues).toHaveLength(4);
    expect(parsed.comboCondition.initialValues).toHaveLength(2);
    expect(parsed.comboCondition.enabled).toBe(true);
    expect(parsed.entity.sourcePath).toBe(`${path}.entityBlackboard`);
    expect(parsed.comboCondition.sourcePath).toBe(`${path}.skillDataBundle.comboSkillBlackboard`);
    expect(parsed.entity.initialValues.find(v => v.key === 'EntityBB_wisd_greater_will')).toEqual({
      key: 'EntityBB_wisd_greater_will',
      value: 1,
      isDynamic: true,
    });
    expect(numericDeclaredBlackboard(parsed.entity.initialValues)).toEqual({});
    expect(parsed.comboCondition.initialValues.map(v => v.key)).toEqual([
      'consumed_layer',
      'consumed_type',
    ]);
  });

  it('同名键分属两层且不共享可变数据', () => {
    const input = sample();
    input.skillDataBundle.comboSkillBlackboard.push(pair('EntityBB_consumed_type', 7));
    const parsed = parseAbilitySystemBlackboardsSource(input, path);
    input.entityBlackboard[0]!.valueDouble = 99;
    expect(parsed.entity.initialValues.find(v => v.key === 'EntityBB_consumed_type')?.value).toBe(
      0,
    );
    expect(
      parsed.comboCondition.initialValues.find(v => v.key === 'EntityBB_consumed_type')?.value,
    ).toBe(7);
  });

  it('禁用条件黑板仍保留配置证据', () => {
    const input = sample();
    input.skillDataBundle.enableComboSkillBlackboard = false;
    const parsed = parseAbilitySystemBlackboardsSource(input, path);
    expect(parsed.comboCondition.enabled).toBe(false);
    expect(parsed.comboCondition.initialValues).toHaveLength(2);
  });

  it('复用 SkillData 的 DataPair 读取语义并保留字符串和动态标记', () => {
    const entries = [pair('b', 2, false), pair('a', 0, true, 'label')];
    const parsed = parseAbilitySystemBlackboardsSource(
      {
        entityBlackboard: entries,
        skillDataBundle: { enableComboSkillBlackboard: true, comboSkillBlackboard: [] },
      },
      path,
    );
    expect(parsed.entity.initialValues).toEqual(
      parseDeclaredBlackboard({ blackboard: entries }, 'skill'),
    );
  });

  it.each(['entity', 'combo'] as const)('重复键在 %s 本层失败且保留源路径', scope => {
    const input = sample();
    const entries =
      scope === 'entity' ? input.entityBlackboard : input.skillDataBundle.comboSkillBlackboard;
    entries.push({ ...entries[0]! });
    expect(() => parseAbilitySystemBlackboardsSource(input, path)).toThrow(
      `${path}.${scope === 'entity' ? 'entityBlackboard' : 'skillDataBundle.comboSkillBlackboard'}: duplicate key`,
    );
  });

  it.each(['entityBlackboard', 'skillDataBundle'])('缺少 %s 不补空板', key => {
    const input: Record<string, unknown> = sample();
    delete input[key];
    expect(() => parseAbilitySystemBlackboardsSource(input, path)).toThrow(`${path}.${key}`);
  });

  it('缺少启用开关不默认 true', () => {
    const input = { entityBlackboard: [], skillDataBundle: { comboSkillBlackboard: [] } };
    expect(() => parseAbilitySystemBlackboardsSource(input, path)).toThrow(
      `${path}.skillDataBundle.enableComboSkillBlackboard: expected boolean`,
    );
  });

  it('未知 DataPair 字段严格失败，错误路径不伪装成 skill.blackboard', () => {
    const input = sample();
    Object.assign(input.entityBlackboard[0]!, { guessed: true });
    expect(() => parseAbilitySystemBlackboardsSource(input, path)).toThrow(
      `${path}.entityBlackboard[0]: unexpected fields`,
    );
  });
});
