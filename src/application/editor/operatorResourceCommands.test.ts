import { skillFixture } from '../../test/skillFixture';
import { describe, expect, it } from 'vitest';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
import { editOperatorResources } from './operatorResourceCommands';
import { validateSkillDefinition } from '../../core/game-data/validateSkillDefinition';

const skill = (key: string) =>
  skillFixture({
    key,
    timelineBlockFrames: 30,
    scheduledSequences: [],
    actionGraph: { main: { nodes: {} }, macros: {} },
  });
const source = {
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skills: [skill('one'), skill('two')],
    },
  ],
  talents: [],
  potentials: [],
} as unknown as OperatorDefinition;

describe('干员内部列表操作', () => {
  it('新增技能沿用组内技能的等级来源，而不是展示分类', () => {
    const operator = {
      ...source,
      skillGroups: [
        {
          key: 'floating',
          operationType: 'basicAttack' as const,
          skills: skillFixture({
            ...skill('floating1'),
            key: 'floating1',
            skillType: 'basicAttack',
            levelSource: 'battleSkill',
          }),
        },
      ],
    };
    const added = editOperatorResources(operator, { kind: 'addSkill', group: 0 });
    expect(added.skillGroups[0]!.skills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'custom_skill_1',
          skillType: 'basicAttack',
          levelSource: 'battleSkill',
        }),
      ]),
    );
  });
  it('新增独立技能，重排保留完整技能，删除不修改原定义', () => {
    const added = editOperatorResources(source, { kind: 'addSkill', group: 0 });
    const addedSkills = added.skillGroups[0]!.skills;
    if (!Array.isArray(addedSkills)) throw new Error('expected a skill sequence');
    expect(validateSkillDefinition(addedSkills[2])).toEqual([]);
    const moved = editOperatorResources(added, { kind: 'moveSkillUp', group: 0, index: 2 });
    const removed = editOperatorResources(moved, { kind: 'removeSkill', group: 0, index: 1 });
    expect(
      (moved.skillGroups[0]!.skills as readonly { key: string }[]).map(skill => skill.key),
    ).toEqual(['one', 'custom_skill_1', 'two']);
    expect(removed.skillGroups[0]!.skills).toEqual(source.skillGroups[0]!.skills);
    expect(source.skillGroups[0]!.skills).toHaveLength(2);
  });
  it('被引用的技能不能直接删除，失败不改变列表', () => {
    const referenced = {
      ...source,
      skillSlots: [{ key: 'battleSkill', baseSkillKey: 'two', replacementSkillKeys: [] }],
    } as OperatorDefinition;
    expect(() =>
      editOperatorResources(referenced, { kind: 'removeSkill', group: 0, index: 1 }),
    ).toThrow('skillReferenced');
    expect(referenced.skillGroups[0]!.skills).toHaveLength(2);
  });
  it('空天赋列表可新增并删除', () => {
    const added = editOperatorResources(source, { kind: 'addUpgrade', collection: 'talents' });
    expect(added.talents).toEqual([{ levels: 1 }]);
    expect(
      editOperatorResources(added, { kind: 'removeUpgrade', collection: 'talents', index: 0 })
        .talents,
    ).toEqual([]);
  });
});
