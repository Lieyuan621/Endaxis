import { expect, it } from 'vitest';
import { listNodeCreations } from './nodeCreation';
import { validateSkillDefinition } from '../../core/game-data/validateSkillDefinition';

it('菜单提供的空节点可以直接放入自定义技能，不会生成悬空身份', () => {
  const entries = listNodeCreations();
  expect(entries.length).toBeGreaterThan(8);
  expect(entries.some(item => item.kind === 'dealStagger')).toBe(true);
  expect(entries.some(item => item.kind === 'dealDamage')).toBe(true);
  const failures: unknown[] = [];
  for (const item of entries) {
    const main =
      item.category === 'action'
        ? { nodes: { added: { action: item.action, next: null } } }
        : { nodes: {}, dataNodes: { added: item.data } };
    const issues = validateSkillDefinition({
      key: 'test',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      timelineBlockFrames: 30,
      scheduledSequences: [],
      actionGraph: { main, macros: {} },
    });
    if (issues.length) failures.push({ key: item.key, issues });
  }
  expect(failures).toEqual([]);
  expect(entries.some(item => item.kind === 'callResource')).toBe(false);
  expect(entries.some(item => item.kind === 'blackboard')).toBe(false);
});
