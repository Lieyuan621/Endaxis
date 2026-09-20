import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../../core/project/createProject';
import { gameDataRepository } from '../../data/gameDataRepository';
import {
  createDefinitionEnemyDocument,
  createCustomEnemyDocument,
  replaceEnemyEditableValues,
  setScenarioEnemy,
  updateEnemyBasicField,
  updateEnemyResistance,
  updateEnemyStaggerField,
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

  it('每类用户覆盖都记录明确的接管字段', () => {
    const definition = gameDataRepository.getEnemy('eny-0125-fdcentur')!;
    const initial = setScenarioEnemy(
      createEmptyScenario('scenario:enemy', '敌人场景'),
      createDefinitionEnemyDocument(definition, 90, 30),
    );

    const updatedHp = updateEnemyBasicField(initial, 'hp', 1000);
    const updatedResistance = updateEnemyResistance(updatedHp, 'heat', 0.2);
    const updatedStagger = updateEnemyStaggerField(updatedResistance, 'maximum', 500);

    expect(updatedStagger.enemy.edited).toEqual(['hp', 'resistances', 'stagger.maximum']);
    expect(updatedStagger.enemy.editable.hp).toBe(1000);
    expect(updatedStagger.enemy.editable.resistances.heat).toBe(0.2);
    expect(updatedStagger.enemy.editable.stagger.maximum).toBe(500);
    expect(initial.enemy.edited).toEqual([]);
  });

  it('属性弹窗的一次确认按实际差异记录覆盖', () => {
    const scenario = createEmptyScenario('scenario:enemy', '敌人场景');
    const values = structuredClone(scenario.enemy.editable);
    values.defense = 200;
    values.stagger.brokenDurationFrames = 450;

    const updated = replaceEnemyEditableValues(scenario, values);

    expect(updated.enemy.edited).toEqual(['defense', 'stagger.brokenDurationFrames']);
    expect(updated.enemy.editable.defense).toBe(200);
    expect(updated.enemy.editable.stagger.brokenDurationFrames).toBe(450);
    expect(replaceEnemyEditableValues(updated, updated.enemy.editable)).toBe(updated);
  });

  it('创建自定义敌人时不伪装成预制体覆盖', () => {
    expect(createCustomEnemyDocument(80)).toMatchObject({
      source: { kind: 'custom', level: 80 },
      rank: 'mob',
      edited: [],
    });
  });
});
