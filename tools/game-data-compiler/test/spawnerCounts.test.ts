import { expect, it } from 'vitest';
import { findSpawnerCount } from '../src/domains/enemy/spawnerAttributes';

it('按实际刷怪动作数量统计，并隔离同敌人的属性变体', () => {
  const buffs = [{ buffId: 'strong', blackboard: [] }];
  const source = {
    enemyLibrary: [
      { key: 'a', enemyId: 'enemy', enemyLevel: 70, bornBuffList: [] },
      { key: 'b', enemyId: 'enemy', enemyLevel: 70, bornBuffList: buffs },
    ],
    waveMap: {
      first: {
        groupMap: {
          first: {
            actionMap: {
              a: { libraryKey: 'a', spawnCount: 3 },
              b: { libraryKey: 'b', spawnCount: 2 },
              c: { libraryKey: 'a', spawnCount: 4 },
            },
          },
        },
      },
    },
  };
  expect(findSpawnerCount([source], ['enemy'], [70], 'enemy', 70, [])).toBe(7);
  expect(findSpawnerCount([source], ['enemy'], [70], 'enemy', 70, buffs)).toBe(2);
  expect(findSpawnerCount([source, source], ['enemy'], [70], 'enemy', 70, [])).toBeNull();
  expect(findSpawnerCount([source], ['enemy'], [80], 'enemy', 80, [])).toBeNull();
  expect(
    findSpawnerCount(
      [{ ...source, waveMap: { first: { ...source.waveMap.first, repeatable: true } } }],
      ['enemy'],
      [70],
      'enemy',
      70,
      [],
    ),
  ).toBeNull();
  expect(findSpawnerCount([], ['enemy'], [70], 'enemy', 70, [])).toBeNull();
});
