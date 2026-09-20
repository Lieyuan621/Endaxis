import { describe, expect, it } from 'vitest';
import { parseSkillTargetSelectionHeaderSource } from '../src/source/skillTargetSelection.ts';
import { compileActiveSkillSource } from '../src/compiler/skills/activeSkillDefinition.ts';
import { activeSkillFixture } from './sourceFixtures.ts';

// 1.4.4 诀 combo 原生二进制 C4395DB3...67937841 的策略字段，非完整 SkillData。
const fields = () => ({
  selectStrategy: 4,
  smartTargetSelectStrategy: 1,
  canDummyCast: true,
  dummyPositionOffset: { x: 0, y: 0, z: 6 },
});

describe('公共 SkillData 目标选择策略头', () => {
  it('真实数值配置与命名配置得到同一语义身份', () => {
    const numeric = parseSkillTargetSelectionHeaderSource(fields(), 'skill');
    const named = parseSkillTargetSelectionHeaderSource(
      {
        ...fields(),
        selectStrategy: 'SelectSmartObject',
        smartTargetSelectStrategy: 'SelectComboSkillTrigger',
      },
      'skill',
    );
    expect(numeric).toEqual(named);
    expect(numeric).toEqual({
      sourcePath: 'skill',
      selectStrategy: 'SelectSmartObject',
      smartTargetSelectStrategy: 'SelectComboSkillTrigger',
      canDummyCast: true,
      dummyPositionOffset: [0, 0, 6],
    });
  });

  it.each(['SelectObject', 'SelectPosition', 'NoTarget', 'SelectDirection', 'SelectSmartObject'])(
    '保留 %s 原生策略而非全改成唯一敌人',
    name => {
      expect(
        parseSkillTargetSelectionHeaderSource({ ...fields(), selectStrategy: name }, 'skill')
          .selectStrategy,
      ).toBe(name);
    },
  );

  it.each(['SelectByBuff', 'SelectByTag', 'SelectByBuffStackNum'])(
    '保留未复刻评分策略 %s 的身份，不冒充已支持执行',
    name => {
      expect(
        parseSkillTargetSelectionHeaderSource(
          { ...fields(), smartTargetSelectStrategy: name },
          'skill',
        ).smartTargetSelectStrategy,
      ).toBe(name);
    },
  );

  it.each([undefined, {}, 9, -1, 1.5, true, '1', 'NearestEnemy'])(
    '拒绝未知策略 %j 并报告原始字段路径',
    value => {
      expect(() =>
        parseSkillTargetSelectionHeaderSource(
          { ...fields(), selectStrategy: value },
          'source.skill',
        ),
      ).toThrow('source.skill.selectStrategy');
    },
  );

  it('非智能选择也保留 smart 配置与 dummy 偏移，不能以当前分支未读为由删除来源', () => {
    const input = {
      ...fields(),
      selectStrategy: 0,
      canDummyCast: false,
      dummyPositionOffset: { x: 1, y: 2, z: 3 },
    };
    const parsed = parseSkillTargetSelectionHeaderSource(input, 'skill');
    input.dummyPositionOffset.x = 9;
    expect(parsed.smartTargetSelectStrategy).toBe('SelectComboSkillTrigger');
    expect(parsed.dummyPositionOffset).toEqual([1, 2, 3]);
  });

  it('主动技能公共编译入口保留策略头', () => {
    const compiled = compileActiveSkillSource(
      { ...activeSkillFixture(), ...fields() },
      'combo',
      null,
    );
    expect(compiled.skill.targetSelection).toEqual(
      parseSkillTargetSelectionHeaderSource(fields(), 'combo'),
    );
  });

  it('缺失 dummy 配置不猜默认值', () => {
    expect(() =>
      parseSkillTargetSelectionHeaderSource({ ...fields(), canDummyCast: undefined }, 'skill'),
    ).toThrow('skill.canDummyCast');
    expect(() =>
      parseSkillTargetSelectionHeaderSource({ ...fields(), dummyPositionOffset: {} }, 'skill'),
    ).toThrow('skill.dummyPositionOffset');
  });
});
