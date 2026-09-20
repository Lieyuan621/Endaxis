import { describe, expect, it } from 'vitest';

import {
  compileActiveSkillRequestBatch,
  compileActiveSkillSource,
  type SkillPatchSource,
} from '../../src/index.ts';
import { activeSkillFixture } from '../sourceFixtures.ts';

describe('领域无关的主动 SkillData', () => {
  it('原生整数与命名 castType 编译结果一致，数字 Passive 不得误入主动入口', () => {
    const source = activeSkillFixture();
    expect(compileActiveSkillSource({ ...source, castType: 0 }, 'fixture', null)).toEqual(
      compileActiveSkillSource(source, 'fixture', null),
    );
    expect(() => compileActiveSkillSource({ ...source, castType: 1 }, 'fixture', null)).toThrow(
      'passive SkillData must use the passive compiler',
    );
    expect(() => compileActiveSkillSource({ ...source, castType: 2 }, 'fixture', null)).toThrow(
      'fixture.castType: unknown native enum',
    );
  });

  it('与被动入口共用黑板和 Patch 合并，并保留普通 Skill 的 castType', () => {
    const patch: SkillPatchSource = {
      levels: [1, 2],
      blackboard: { attack_scale: [1.2, 1.4], patch_only: [3, 4] },
      cooldownSeconds: [5, 4],
      costTypes: [0, 0],
      costValues: [0, 0],
    };
    const result = compileActiveSkillSource(activeSkillFixture(), 'active_fixture.json', patch);
    expect(result.blackboard).toEqual({
      definitionLevel: 1,
      declaredDefaults: { attack_scale: 1 },
      levels: [1, 2],
      values: { attack_scale: [1.2, 1.4], patch_only: [3, 4] },
    });
    expect(result.skill).toMatchObject({
      skillId: 'active_fixture',
      castType: 'Active',
      actionGraph: { durationFrame: 30, actionGroup: { timelineActions: [] } },
      references: [],
    });
    expect(result.targetGroupWrites).toEqual([]);
  });

  it('拒绝被动 SkillData 进入普通 Skill 入口', () => {
    expect(() =>
      compileActiveSkillSource(
        activeSkillFixture('active_fixture', 'Passive'),
        'passive_fixture.json',
        null,
      ),
    ).toThrow('passive SkillData must use the passive compiler');
  });

  it('批量入口保留领域请求，并按 SkillData ID 去重公共定义', () => {
    const requests = [
      { sourcePath: 'Operator.skills[0]', skillId: 'active_fixture' },
      { sourcePath: 'Operator.skills[1]', skillId: 'active_fixture' },
    ];
    const result = compileActiveSkillRequestBatch(
      requests,
      { active_fixture: activeSkillFixture() },
      {},
    );
    expect(result.requests).toEqual(requests);
    expect(result.definitions).toHaveLength(1);
    expect(result.definitions[0]).toMatchObject({
      skillId: 'active_fixture',
      sourcePath: 'SkillData.active_fixture',
    });
  });

  it('批量入口在缺失定义时保留提出请求的路径', () => {
    expect(() =>
      compileActiveSkillRequestBatch(
        [{ sourcePath: 'Operator.skills[0]', skillId: 'missing' }],
        {},
        {},
      ),
    ).toThrow('SkillData.missing: missing definition requested by Operator.skills[0]');
  });
});
