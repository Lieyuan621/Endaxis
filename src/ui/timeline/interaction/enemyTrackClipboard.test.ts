import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { copyEnemyTrack, instantiateEnemyTrack } from './enemyTrackClipboard';

it('复制保留配置和绝对时间，多次粘贴重建敌人及其标记身份且不修改原件', () => {
  const scenario = createEmptyScenario('scenario:test', 'test');
  if (scenario.level.kind !== 'singleEnemy') throw new Error('expected single enemy');
  const enemy = scenario.level.enemy;
  enemy.enemy.lifecycle = {
    spawnFrame: 30,
    presenceChanges: [{ id: 'presence:original', frame: 60, present: false }],
    deathFrame: 90,
  };
  const clipboard = copyEnemyTrack(enemy, [
    { id: 'target:original', frame: 45, targetId: enemy.id },
    { id: 'target:other', frame: 50, targetId: 'another' },
  ]);
  let sequence = 0;
  const ids = { allocate: (kind: string) => `${kind}:${++sequence}` };
  const first = instantiateEnemyTrack(clipboard, ids);
  const second = instantiateEnemyTrack(clipboard, ids);
  expect(first.enemy.enemy).toEqual({
    ...enemy.enemy,
    lifecycle: {
      ...enemy.enemy.lifecycle,
      presenceChanges: [{ id: 'enemyPresence:2', frame: 60, present: false }],
    },
  });
  expect(first.switches).toEqual([{ id: 'enemyTarget:3', frame: 45, targetId: first.enemy.id }]);
  expect(second.enemy.id).not.toBe(first.enemy.id);
  expect(second.enemy.enemy.lifecycle!.presenceChanges[0]!.id).not.toBe(
    first.enemy.enemy.lifecycle!.presenceChanges[0]!.id,
  );
  first.enemy.enemy.lifecycle!.spawnFrame = 100;
  expect(clipboard.enemy.enemy.lifecycle!.spawnFrame).toBe(30);
  expect(enemy.enemy.lifecycle.presenceChanges[0]!.id).toBe('presence:original');
});
