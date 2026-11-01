import { firstScenarioEnemy } from './level';
import { expect, it } from 'vitest';
import { createEmptyScenario, createEmptyProject } from './createProject';
import { scenarioEnemyOrder, removeScenarioEnemy } from './enemyTargeting';
import { parseProjectDocument, serializeProjectDocument } from './serialization';

it('重排保留身份，删除敌人不改变其余实例身份和切换引用，最后一个不能删除', () => {
  const scenario = createEmptyScenario('s', 's');
  scenario.level = {
    kind: 'multiEnemies',
    enemies: [
      firstScenarioEnemy(scenario),
      ...[
        { id: 'a', name: 'A', enemy: structuredClone(firstScenarioEnemy(scenario).enemy) },
        { id: 'b', name: 'B', enemy: structuredClone(firstScenarioEnemy(scenario).enemy) },
      ].map(item => ({ ...item, id: 'enemy:' + item.id })),
    ],
  };
  scenario.level.enemies = [
    scenario.level.enemies[2]!,
    scenario.level.enemies[0]!,
    scenario.level.enemies[1]!,
  ];
  scenario.battle.enemyTargetSwitches = [
    { id: 'target', frame: 30, targetId: 'enemy:b' },
    { id: 'removed', frame: 60, targetId: 'enemy' },
  ];
  expect(scenarioEnemyOrder(scenario)).toEqual(['enemy:b', 'enemy', 'enemy:a']);
  const result = removeScenarioEnemy(scenario, 'enemy');
  expect(firstScenarioEnemy(result).name).toBe('B');
  expect(scenarioEnemyOrder(result)).toEqual(['enemy:b', 'enemy:a']);
  expect(result.battle.enemyTargetSwitches).toEqual([
    { id: 'target', frame: 30, targetId: 'enemy:b' },
  ]);
  const project = createEmptyProject({ createdWith: 'test' });
  project.scenarios = [result];
  project.activeScenarioId = result.id;
  const loaded = parseProjectDocument(JSON.parse(serializeProjectDocument(project)));
  expect(loaded.ok).toBe(true);
  const only = removeScenarioEnemy(result, 'enemy:a');
  expect(removeScenarioEnemy(only, 'enemy:b')).toBe(only);
});
