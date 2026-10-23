import { shallowRef } from 'vue';
import { describe, expect, it } from 'vitest';
import { createScenarioEditorSession } from '../../test/scenarioEditorSession';
import { createEmptyScenario } from '../../core/project/createProject';
import type { ScenarioDocument } from '../../core/project/schema';
import { gameDataRepository } from '../../data/gameDataRepository';
import { useTimelineEnemyEditor } from './useTimelineEnemyEditor';
import { generatedEnemyStages } from '../../data/enemies/generated/stages.generated';
import { createEmptyProject } from '../../core/project/createProject';
import { parseProjectDocument, serializeProjectDocument } from '../../core/project/serialization';
import {
  captureScenarioSimulationGameData,
  restoreScenarioSimulationGameData,
} from '../../application/simulation/scenarioSimulationGameData';
import { compileScenarioEnemy } from '../../core/compiler/compileScenarioEnemy';

function createEditor() {
  const initial = createEmptyScenario('scenario:enemy', '敌人场景');
  const session = createScenarioEditorSession(initial);
  const scenario = shallowRef<ScenarioDocument>(initial);
  session.subscribe(snapshot => {
    scenario.value = snapshot.scenario;
  });
  return {
    scenario,
    session,
    editor: useTimelineEnemyEditor({
      scenario,
      session,
      gameData: gameDataRepository,
      fps: 30,
    }),
  };
}

describe('useTimelineEnemyEditor', () => {
  it('关卡选择保存原生身份和完整数值，重新读取及模拟不依赖生成变体 ID', () => {
    const { editor, scenario } = createEditor();
    const stage = generatedEnemyStages.find(stage =>
      stage.enemies.some(enemy => enemy.definitionId?.includes('--')),
    )!;
    const entry = stage.enemies.find(
      enemy => enemy.definitionId?.includes('--') && enemy.level !== null,
    )!;
    editor.selectDefinitionEnemy(entry.definitionId!, entry.level!, entry.source);
    const saved = scenario.value.enemy;
    expect(saved.source).toEqual({
      kind: 'stage',
      stageId: stage.id,
      enemyId: entry.source.enemyId,
      templateId: entry.source.templateId,
      level: entry.level,
    });
    expect(editor.selectedDefinition.value?.id).toBe(entry.source.templateId);
    const project = createEmptyProject({ createdWith: 'test' });
    project.scenarios = [scenario.value];
    project.activeScenarioId = scenario.value.id;
    const json = serializeProjectDocument(project);
    expect(json).not.toContain(entry.definitionId!);
    const parsed = parseProjectDocument(json, { gameDataRepository });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('expected a valid stage enemy');
    const restored = parsed.value.scenarios[0]!;
    expect(restored.enemy).toEqual(saved);
    const data = captureScenarioSimulationGameData(restored, gameDataRepository);
    expect(data.enemies.map(enemy => enemy.id)).toEqual([entry.source.templateId]);
    expect(restoreScenarioSimulationGameData(data).getEnemy(entry.definitionId!)).toBeNull();
    expect(compileScenarioEnemy(restored.enemy).health).toBe(saved.editable.hp);
  });
  it('选择敌人预制体会提交一次完整实例', () => {
    const { editor, scenario, session } = createEditor();

    editor.selectDefinitionEnemy('eny-0125-fdcentur', 90);

    expect(session.snapshot.revision).toBe(1);
    expect(session.snapshot.lastCommand).toBe('setScenarioEnemy');
    expect(scenario.value.enemy.source).toEqual({
      kind: 'prefab',
      enemyId: 'eny-0125-fdcentur',
      level: 90,
    });
    expect(editor.selectedDefinition.value?.id).toBe('eny-0125-fdcentur');
  });

  it('确认一组属性修改只产生一次会话修订', () => {
    const { editor, scenario, session } = createEditor();
    const values = structuredClone(scenario.value.enemy.editable);
    values.hp = 200000;
    values.stagger.maximum = 500;

    editor.saveEnemyValues(values);

    expect(session.snapshot.revision).toBe(1);
    expect(scenario.value.enemy.editable).toEqual(values);
    expect(scenario.value.enemy).not.toHaveProperty('edited');
  });

  it('切换自定义敌人不会伪造预制体身份', () => {
    const { editor, scenario } = createEditor();

    editor.selectCustomEnemy(80);

    expect(scenario.value.enemy.source).toEqual({ kind: 'custom', level: 80 });
    expect(editor.selectedDefinition.value).toBeNull();
  });
});
