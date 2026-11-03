import { firstScenarioEnemy, levelEnemies } from '../../core/project/level';
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

function createEditor(
  initial = createEmptyScenario('scenario:enemy', '敌人场景'),
  enemyInstanceId = shallowRef<string | undefined>(),
) {
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
      enemyInstanceId,
    }),
  };
}

describe('useTimelineEnemyEditor', () => {
  it('替换所选额外敌人类型保留其生命周期，撤销重做不影响主敌人和自动死亡设置', () => {
    const initial = createEmptyScenario('multi-enemy', '多敌人');
    initial.battle.enemyAutomaticDeath = true;
    const enemy = structuredClone(firstScenarioEnemy(initial).enemy);
    enemy.lifecycle = {
      spawnFrame: 30,
      presenceChanges: [
        { id: 'leave', frame: 60, present: false },
        { id: 'return', frame: 90, present: true },
      ],
      deathFrame: 120,
    };
    initial.level = {
      kind: 'multiEnemies',
      enemies: [
        firstScenarioEnemy(initial),
        ...[{ id: 'a', name: 'A', enemy }].map(item => ({ ...item, id: 'enemy:' + item.id })),
      ],
    };
    const { editor, scenario, session } = createEditor(initial, shallowRef('enemy:a'));
    editor.selectDefinitionEnemy('eny-0125-fdcentur', 90);
    const replaced = scenario.value;
    expect(levelEnemies(replaced.level).slice(1)![0]!.enemy.lifecycle).toEqual(enemy.lifecycle);
    expect(firstScenarioEnemy(replaced).enemy).toEqual(firstScenarioEnemy(initial).enemy);
    expect(replaced.battle).toEqual(initial.battle);
    expect(editor.selectedDefinition.value?.id).toBe('eny-0125-fdcentur');
    expect(session.undo()).toBe(true);
    expect(scenario.value).toEqual(initial);
    expect(session.redo()).toBe(true);
    expect(scenario.value).toEqual(replaced);
    editor.selectCustomEnemy();
    expect(levelEnemies(scenario.value.level).slice(1)![0]!.enemy.lifecycle).toEqual(
      enemy.lifecycle,
    );
    expect(editor.selectedDefinition.value).toBeNull();
  });
  it('关卡选择保存出生定义引用，后台数据包包含规则且恢复后结算一致', () => {
    const { editor, scenario } = createEditor();
    const stage = generatedEnemyStages.find(stage =>
      stage.enemies.some(enemy => enemy.birthBuffs?.some(buff => buff.supported)),
    )!;
    const entry = stage.enemies.find(
      enemy => enemy.birthBuffs?.some(buff => buff.supported) && enemy.level !== null,
    )!;
    editor.selectDefinitionEnemy(entry.definitionId!, entry.level!, entry.source);
    const saved = firstScenarioEnemy(scenario.value).enemy;
    expect(saved.source).toEqual({
      kind: 'stage',
      stageId: stage.id,
      enemyId: entry.source.enemyId,
      templateId: entry.source.templateId,
      level: entry.level,
      spawnId: entry.id,
    });
    expect(editor.selectedDefinition.value?.id).toBe(entry.source.templateId);
    const project = createEmptyProject({ createdWith: 'test' });
    project.scenarios = [scenario.value];
    project.activeScenarioId = scenario.value.id;
    const json = serializeProjectDocument(project);
    expect(saved.birthEffects).not.toHaveProperty('definitionId');
    expect(json).not.toContain('"buffDefinitions"');
    const parsed = parseProjectDocument(json, { gameDataRepository });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('expected a valid stage enemy');
    const restored = parsed.value.scenarios[0]!;
    expect(firstScenarioEnemy(restored).enemy).toEqual(saved);
    const data = captureScenarioSimulationGameData(restored, gameDataRepository);
    expect(data.enemies.map(enemy => enemy.id)).toEqual([
      ...new Set([entry.source.templateId, entry.definitionId]),
    ]);
    expect(data.enemyStages?.map(stage => stage.id)).toEqual([stage.id]);
    const workerRepository = restoreScenarioSimulationGameData(data);
    expect(compileScenarioEnemy(firstScenarioEnemy(restored).enemy, workerRepository).health).toBe(
      compileScenarioEnemy(saved, gameDataRepository).health,
    );
  });
  it('选择敌人预制体会提交一次完整实例', () => {
    const { editor, scenario, session } = createEditor();

    editor.selectDefinitionEnemy('eny-0125-fdcentur', 90);

    expect(session.snapshot.revision).toBe(1);
    expect(session.snapshot.lastCommand).toBe('setScenarioEnemy');
    expect(firstScenarioEnemy(scenario.value).enemy.source).toEqual({
      kind: 'prefab',
      enemyId: 'eny-0125-fdcentur',
      level: 90,
    });
    expect(editor.selectedDefinition.value?.id).toBe('eny-0125-fdcentur');
  });

  it('确认一组属性修改只产生一次会话修订', () => {
    const { editor, scenario, session } = createEditor();
    const values = structuredClone(firstScenarioEnemy(scenario.value).enemy.editable);
    values.hp = 200000;
    values.stagger.maximum = 500;

    editor.saveEnemyValues(values);

    expect(session.snapshot.revision).toBe(1);
    expect(firstScenarioEnemy(scenario.value).enemy.editable).toEqual(values);
    expect(firstScenarioEnemy(scenario.value).enemy).not.toHaveProperty('edited');
  });

  it('切换自定义敌人不会伪造预制体身份', () => {
    const { editor, scenario } = createEditor();

    editor.selectCustomEnemy(80);

    expect(firstScenarioEnemy(scenario.value).enemy.source).toEqual({ kind: 'custom', level: 80 });
    expect(editor.selectedDefinition.value).toBeNull();
  });
});

it('批量应用关卡是完整可撤销事务，坏条目不会部分提交', () => {
  const { editor, scenario, session } = createEditor();
  const original = structuredClone(scenario.value);
  const stage = generatedEnemyStages.find(
    stage =>
      stage.enemies.length > 1 &&
      stage.enemies.every(
        entry =>
          entry.definitionId &&
          entry.level !== null &&
          gameDataRepository.getEnemy(entry.definitionId),
      ),
  )!;
  const selections = stage.enemies.map(entry => ({
    count: 2,
    definitionId: entry.definitionId!,
    level: entry.level!,
    source: entry.source,
    name: entry.nameKey,
  }));
  let nextId = 0;
  const allocate = () => `enemy:${++nextId}`;
  expect(() =>
    editor.selectStageEnemies(
      [...selections, { ...selections[0]!, definitionId: 'missing-test-enemy' }],
      allocate,
    ),
  ).toThrow();
  expect(scenario.value).toEqual(original);
  editor.selectStageEnemies(selections, allocate);
  const applied = structuredClone(scenario.value);
  const instances = selections.flatMap(entry => Array.from({ length: entry.count }, () => entry));
  expect(applied.level.kind).toBe('multiEnemies');
  expect(levelEnemies(applied.level).map(enemy => enemy.id)).toEqual(
    instances.map((_, index) => `enemy:${index + 1}`),
  );
  expect(levelEnemies(applied.level).slice(1)).toHaveLength(instances.length - 1);
  expect(firstScenarioEnemy(applied).enemy.source).toEqual({
    kind: 'stage',
    ...selections[0]!.source,
    level: selections[0]!.level,
  });
  expect(
    levelEnemies(applied.level)
      .slice(1)!
      .map(entry => entry.enemy.source),
  ).toEqual(
    instances.slice(1).map(entry => ({ kind: 'stage', ...entry.source, level: entry.level })),
  );
  expect(
    new Set(
      levelEnemies(applied.level)
        .slice(1)!
        .map(entry => entry.id),
    ).size,
  ).toBe(instances.length - 1);
  expect(session.undo()).toBe(true);
  expect(scenario.value).toEqual(original);
  expect(session.redo()).toBe(true);
  expect(scenario.value).toEqual(applied);
});
