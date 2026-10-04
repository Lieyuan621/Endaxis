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
    expect(enemy.edited).toEqual([]);
  });

  it('拒绝定义未提供的敌人等级，而不自行插值', () => {
    const definition = gameDataRepository.getEnemy('eny-0125-fdcentur')!;

    expect(() => createDefinitionEnemyDocument(definition, 101, 30)).toThrow(
      `enemy '${definition.id}' has no HP value at level 101`,
    );
  });

  it('整值确认保留已有接管字段，按实际差异记录新覆盖并隔离草稿', () => {
    const scenario = createEmptyScenario('scenario:enemy', '敌人场景');
    scenario.enemy.edited = ['defense', 'hp'];
    const before = structuredClone(scenario);
    const values = structuredClone(scenario.enemy.editable);
    values.hp = 1000;
    values.resistances.heat = 0.2;
    values.stagger.maximum = 500;
    values.stagger.knotThresholds = [0.25, 0.75];

    const updated = replaceEnemyEditableValues(scenario, values);

    expect(updated.enemy.edited).toEqual([
      'defense',
      'hp',
      'resistances',
      'stagger.maximum',
      'stagger.knotThresholds',
    ]);
    expect(updated.enemy.editable).toEqual(values);
    expect(scenario).toEqual(before);
    expect(replaceEnemyEditableValues(updated, structuredClone(values))).toBe(updated);

    values.resistances.heat = 0.9;
    values.stagger.knotThresholds.push(1);
    expect(updated.enemy.editable.resistances.heat).toBe(0.2);
    expect(updated.enemy.editable.stagger.knotThresholds).toEqual([0.25, 0.75]);
  });

  it('创建自定义敌人时不伪装成预制体覆盖', () => {
    expect(createCustomEnemyDocument(80)).toMatchObject({
      source: { kind: 'custom', level: 80 },
      rank: 'mob',
      edited: [],
    });
  });
});
