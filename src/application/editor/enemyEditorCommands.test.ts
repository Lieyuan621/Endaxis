import { firstScenarioEnemy, levelEnemies } from '../../core/project/level';
import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../../core/project/createProject';
import { gameDataRepository } from '../../data/gameDataRepository';
import {
  createDefinitionEnemyDocument,
  createCustomEnemyDocument,
  replaceEnemyEditableValues,
} from './enemyEditorCommands';

describe('enemyEditorCommands', () => {
  it('把敌人预制体的完整默认值捕获为项目实例', () => {
    const definition = gameDataRepository.getEnemy('eny-0125-fdcentur')!;

    const enemy = createDefinitionEnemyDocument(definition, 90, 30);

    expect(enemy.source).toEqual({ kind: 'prefab', enemyId: definition.id, level: 90 });
    expect(enemy.rank).toBe(definition.rank);
    expect(enemy.editable).toMatchObject({
      hp: 2476341,
      defense: 100,
      superArmor: 30,
      finisherMultiplier: 1.75,
      stagger: {
        maximum: definition.stagger.maximum,
        knotThresholds: definition.stagger.knotThresholds,
        knotBreakDurationFrames: Math.round(definition.stagger.knotBreakDurationSeconds * 30),
        brokenDurationFrames: Math.round(definition.stagger.brokenDurationSeconds * 30),
      },
    });
    expect(enemy).not.toHaveProperty('edited');
  });

  it('拒绝定义未提供的敌人等级，而不自行插值', () => {
    const definition = gameDataRepository.getEnemy('eny-0125-fdcentur')!;

    expect(() => createDefinitionEnemyDocument(definition, 101, 30)).toThrow(
      `enemy '${definition.id}' has no HP value at level 101`,
    );
  });

  it('整值确认保持幂等并隔离草稿', () => {
    const scenario = createEmptyScenario('scenario:enemy', '敌人场景');
    const before = structuredClone(scenario);
    const values = structuredClone(firstScenarioEnemy(scenario).enemy.editable);
    values.hp = 1000;
    values.resistances.heat = 0.2;
    values.stagger.maximum = 500;
    values.stagger.knotThresholds = [0.25, 0.75];

    const updated = replaceEnemyEditableValues(scenario, values);

    expect(firstScenarioEnemy(updated).enemy).not.toHaveProperty('edited');
    expect(firstScenarioEnemy(updated).enemy.editable).toEqual(values);
    expect(scenario).toEqual(before);
    expect(replaceEnemyEditableValues(updated, structuredClone(values))).toBe(updated);

    values.resistances.heat = 0.9;
    values.stagger.knotThresholds.push(1);
    expect(firstScenarioEnemy(updated).enemy.editable.resistances.heat).toBe(0.2);
    expect(firstScenarioEnemy(updated).enemy.editable.stagger.knotThresholds).toEqual([0.25, 0.75]);
  });

  it('创建自定义敌人时不伪装成预制体覆盖', () => {
    expect(createCustomEnemyDocument(80)).toMatchObject({
      source: { kind: 'custom', level: 80 },
      rank: 'mob',
    });
  });
});

it('只修改所选敌人的属性，保留其他实例和生命周期', () => {
  const scenario = createEmptyScenario('enemies', 'Enemies');
  const enemy = createCustomEnemyDocument();
  enemy.lifecycle = { spawnFrame: 30, presenceChanges: [] };
  scenario.level = {
    kind: 'multiEnemies',
    enemies: [
      firstScenarioEnemy(scenario),
      ...[
        { id: 'a', name: 'A', enemy },
        { id: 'b', name: 'B', enemy: createCustomEnemyDocument() },
      ].map(item => ({ ...item, id: 'enemy:' + item.id })),
    ],
  };
  const changed = replaceEnemyEditableValues(scenario, { ...enemy.editable, hp: 500 }, 'enemy:a');
  expect(firstScenarioEnemy(changed).enemy).toBe(firstScenarioEnemy(scenario).enemy);
  expect(levelEnemies(changed.level).slice(1)![1]).toBe(levelEnemies(scenario.level).slice(1)[1]);
  expect(levelEnemies(changed.level).slice(1)![0]!.enemy.editable.hp).toBe(500);
  expect(levelEnemies(changed.level).slice(1)![0]!.enemy.lifecycle).toEqual(enemy.lifecycle);
  expect(enemy.editable.hp).toBe(100000);
});
