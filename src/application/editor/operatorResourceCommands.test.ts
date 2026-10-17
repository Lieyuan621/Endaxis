import { describe, expect, it } from 'vitest';
import { perlica } from '../../data/operators/perlica.generated';
import { skillFixture } from '../../test/skillFixture';
import { editOperatorResources } from './operatorResourceCommands';
import { validateSkillDefinition } from '../../core/game-data/validateSkillDefinition';

const source = {
  ...perlica,
  skills: [
    skillFixture({
      timelineBlockFrames: 30,
      scheduledSequences: [],
      actionGraph: { main: { nodes: {} }, macros: {} },
      key: 'one',
      levelSource: 'battleSkill',
    }),
    skillFixture({
      timelineBlockFrames: 30,
      scheduledSequences: [],
      actionGraph: { main: { nodes: {} }, macros: {} },
      key: 'two',
      levelSource: 'battleSkill',
    }),
  ],
  skillGroups: [
    { key: 'basicAttack', operationType: 'basicAttack' as const, skillIds: ['one', 'two'] },
  ],
  talents: [],
  potentials: [],
};
describe('干员技能目录与放置引用事务', () => {
  it('新增使用具体技能的等级源，重排只改引用，删除同时更新目录且不改原定义', () => {
    const added = editOperatorResources(source, { kind: 'addSkill', group: 0 });
    const skill = added.skills.find(skill => skill.key === 'custom_skill_1')!;
    expect(skill.levelSource).toBe('battleSkill');
    expect(validateSkillDefinition(skill)).toEqual([]);
    const moved = editOperatorResources(added, { kind: 'moveSkillUp', group: 0, index: 2 });
    expect(moved.skills).toEqual(added.skills);
    expect(moved.skillGroups[0]!.skillIds).toEqual(['one', 'custom_skill_1', 'two']);
    const removed = editOperatorResources(moved, { kind: 'removeSkill', group: 0, index: 1 });
    expect(removed.skills).toEqual(source.skills);
    expect(removed.skillGroups).toEqual(source.skillGroups);
    expect(source.skills).toHaveLength(2);
  });
  it('其他输入或技能槽引用的定义不能删除，失败保持原数据', () => {
    const referenced = {
      ...source,
      skillSlots: [{ key: 'battleSkill', baseSkillKey: 'two', replacementSkillKeys: [] }],
    };
    expect(() =>
      editOperatorResources(referenced, { kind: 'removeSkill', group: 0, index: 1 }),
    ).toThrow('skillReferenced');
    expect(referenced.skills).toEqual(source.skills);
    const shared = {
      ...source,
      skillGroups: [
        ...source.skillGroups,
        { key: 'other', operationType: 'battleSkill' as const, skillIds: ['two'] },
      ],
    };
    expect(() =>
      editOperatorResources(shared, { kind: 'removeSkill', group: 0, index: 1 }),
    ).toThrow('skillReferenced');
  });
  it('天赋集合编辑不影响技能目录', () => {
    const added = editOperatorResources(source, { kind: 'addUpgrade', collection: 'talents' });
    expect(added.talents).toEqual([{ levels: 1 }]);
    expect(
      editOperatorResources(added, { kind: 'removeUpgrade', collection: 'talents', index: 0 })
        .talents,
    ).toEqual([]);
    expect(added.skills).toBe(source.skills);
  });
});
