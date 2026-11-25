import { resolveScenarioInitialFrame } from './skillCastPlacement';
import { firstScenarioEnemy } from './level';
import { describe, expect, it } from 'vitest';
import { createEmptyProject, createEmptyScenario } from './createProject';
import { isMultiEnemyModeEnabled, requiresMultiEnemyMode } from './multiEnemyMode';
import { parseProjectDocument, serializeProjectDocument } from './serialization';

describe('关卡编辑模式', () => {
  it('关卡类型决定界面，单个敌人也可以使用多敌人视图并保存', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    const scenario = project.scenarios[0]!;
    expect(isMultiEnemyModeEnabled(scenario)).toBe(false);
    scenario.level = { kind: 'multiEnemies', enemies: [firstScenarioEnemy(scenario)] };
    const loaded = parseProjectDocument(serializeProjectDocument(project));
    if (!loaded.ok) throw new Error('invalid saved project');
    expect(isMultiEnemyModeEnabled(loaded.value.scenarios[0]!)).toBe(true);
    expect(requiresMultiEnemyMode(scenario)).toBe(false);
  });
  it('多个敌人或非默认生命周期禁止收起为单敌人', () => {
    const scenario = createEmptyScenario('test', 'test');
    const initial = firstScenarioEnemy(scenario);
    scenario.level = {
      kind: 'multiEnemies',
      enemies: [initial, { ...structuredClone(initial), id: 'enemy:second' }],
    };
    expect(requiresMultiEnemyMode(scenario)).toBe(true);
    scenario.level.enemies.pop();
    expect(requiresMultiEnemyMode(scenario)).toBe(false);
    initial.enemy.lifecycle = {
      spawnFrame: resolveScenarioInitialFrame(scenario),
      presenceChanges: [],
      deathFrame: 10,
    };
    expect(requiresMultiEnemyMode(scenario)).toBe(true);
    delete initial.enemy.lifecycle.deathFrame;
    expect(requiresMultiEnemyMode(scenario)).toBe(false);
    initial.enemy.lifecycle.spawnFrame = 10;
    expect(requiresMultiEnemyMode(scenario)).toBe(true);
  });
});
