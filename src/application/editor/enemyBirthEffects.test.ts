import type { EnemyStageDefinition } from '../../../packages/game-data-contract/src/enemies';
import { createGameDataRepository } from '../../data/createGameDataRepository';
import {
  captureScenarioSimulationGameData,
  restoreScenarioSimulationGameData,
} from '../simulation/scenarioSimulationGameData';
import { generatedEnemyStages } from '../../data/enemies/generated/stages.generated';
import { enemyBirthOptions } from '../../core/project/enemyBirthEffects';
import { compileScenarioEnemy } from '../../core/compiler/compileScenarioEnemy';
import type { EnemyDefinition } from '../../core/game-data/enemyDefinition';
import { resolveEnemyBirthValues } from '../../core/project/enemyBirthEffects';
import { validateEnemy } from '../../core/project/scenarioValidation';
import type { ValidationIssue } from '../../core/project/validationHelpers';
import { getEnemyHpAtLevel } from '../../core/game-data/enemyDefinition';
import { expect, it } from 'vitest';
import { generatedEnemyDefinitions as generated } from '../../data/enemies/generated/index.generated';
import {
  createDefinitionEnemyDocument,
  replaceEnemyEditableValues,
  setScenarioEnemy,
} from './enemyEditorCommands';
import { createEmptyScenario } from '../../core/project/createProject';
import { firstScenarioEnemy } from '../../core/project/level';

const generatedEnemyDefinitions: readonly EnemyDefinition[] = generated;

it('创建和读取实例均只保存定义的基础值', () => {
  for (const definition of generatedEnemyDefinitions)
    for (const level of Object.keys(definition.levelHp).map(Number)) {
      const enemy = createDefinitionEnemyDocument(definition, level, 30);
      const saved = JSON.stringify(enemy);
      resolveEnemyBirthValues(enemy, definition, 30);
      expect(JSON.stringify(enemy)).toBe(saved);
      expect(enemy.editable.hp, definition.id).toBe(getEnemyHpAtLevel(definition, level));
      expect(enemy.editable.defense, definition.id).toBe(definition.defense);
      expect(enemy.editable.stagger.maximum, definition.id).toBe(definition.stagger.maximum);
      expect(enemy.editable.stagger.brokenDurationFrames, definition.id).toBe(
        Math.round(definition.stagger.brokenDurationSeconds * 30),
      );
    }
});

it('基础生命值编辑和出生效果开关独立保存，不重复叠加', () => {
  const spawn = generatedEnemyStages
    .flatMap(stage => stage.enemies)
    .find(entry =>
      entry.birthBuffs?.some(
        buff => buff.supported && buff.modifiers.some(m => m.attribute === 'MaxHp'),
      ),
    )!;
  const definition = generatedEnemyDefinitions.find(d => d.id === spawn.definitionId)!;
  const enemy = createDefinitionEnemyDocument(
    definition,
    spawn.level!,
    30,
    spawn.source,
    undefined,
    spawn,
  );
  const defaults = enemyBirthOptions(definition, spawn)
    .filter(buff => buff.supported)
    .map(buff => buff.key);
  const base = { ...enemy.editable, hp: 12345 };
  const scenario = setScenarioEnemy(createEmptyScenario('birth-test', 'birth-test'), enemy);
  const changed = replaceEnemyEditableValues(scenario, base, undefined, []);
  const result = firstScenarioEnemy(changed).enemy;
  expect(result.editable.hp).toBe(12345);
  expect(result.birthEffects?.enabledBuffs).toEqual([]);
  const repeat = replaceEnemyEditableValues(changed, base, undefined, []);
  expect(repeat).toBe(changed);
  const restored = JSON.parse(JSON.stringify(result));
  const issues: ValidationIssue[] = [];
  validateEnemy(restored, 'enemy', issues);
  expect(issues).toEqual([]);
  expect(restored).toEqual(result);
  expect(JSON.stringify(restored)).not.toMatch(/buffDefinitions|fixedModifiers|limits|rules/);
  restored.birthEffects.enabledBuffs.push('missing-effect');
  expect(() => resolveEnemyBirthValues(restored, definition, 30, spawn)).toThrow(
    'unsupported birth buff override',
  );
  const enabled = replaceEnemyEditableValues(changed, base, undefined, defaults);
  expect(
    resolveEnemyBirthValues(firstScenarioEnemy(enabled).enemy, definition, 30, spawn).hp,
  ).not.toBe(resolveEnemyBirthValues(result, definition, 30, spawn).hp);
});

it('没有出生效果选择的存档也以基础值应用固有修正，不隐式启用 Buff', () => {
  const definition: EnemyDefinition = {
    ...generatedEnemyDefinitions[0]!,
    attributeModifiers: [{ attribute: 'MaxHp', slot: 'multiplier', value: 1 }],
    birthBuffs: [
      {
        key: 'optional',
        buffId: 'optional',
        origin: 'enemy',
        supported: true,
        modifiers: [{ attribute: 'MaxHp', slot: 'finalMultiplier', value: 3 }],
      },
    ],
  };
  const enemy = createDefinitionEnemyDocument(definition, 90, 30);
  delete enemy.birthEffects;
  enemy.editable.hp = 1234;
  expect(resolveEnemyBirthValues(enemy, definition, 30).hp).toBe(2468);
  expect(
    compileScenarioEnemy(enemy, { getEnemy: id => (id === definition.id ? definition : null) })
      .health,
  ).toBe(2468);
  const scenario = setScenarioEnemy(createEmptyScenario('base', 'base'), enemy);
  const enabled = replaceEnemyEditableValues(scenario, enemy.editable, undefined, ['optional']);
  const saved = JSON.parse(JSON.stringify(firstScenarioEnemy(enabled).enemy));
  expect(resolveEnemyBirthValues(saved, definition, 30).hp).toBe(7404);
  expect(saved.editable.hp).toBe(1234);
  expect(enemy.editable.hp).toBe(1234);
});

it('新增或新适配出生 Buff 不自动进入已保存的启用列表', () => {
  const original = generatedEnemyDefinitions.find(d => d.birthBuffs)!;
  const saved = JSON.parse(JSON.stringify(createDefinitionEnemyDocument(original, 90, 30)));
  const before = resolveEnemyBirthValues(saved, original, 30);
  const added = {
    key: 'new-buff',
    buffId: 'new-buff',
    origin: 'enemy' as const,
    supported: true,
    modifiers: [{ attribute: 'MaxHp' as const, slot: 'finalMultiplier' as const, value: 2 }],
  };
  const updated: EnemyDefinition = {
    ...original,
    birthBuffs: [...original.birthBuffs!, added],
  };
  expect(resolveEnemyBirthValues(saved, updated, 30)).toEqual(before);
  expect(createDefinitionEnemyDocument(updated, 90, 30).birthEffects!.enabledBuffs).toContain(
    added.key,
  );
  saved.birthEffects.enabledBuffs.push(added.key);
  expect(resolveEnemyBirthValues(saved, updated, 30).hp).toBe(before.hp * 2);
  expect(
    createDefinitionEnemyDocument(updated, 90, 30, undefined, []).birthEffects!.enabledBuffs,
  ).toEqual([]);
});

it('未支持效果不隐式结算，后续支持也不会自动启用', () => {
  const original = generatedEnemyDefinitions.find(d =>
    d.birthBuffs?.some(buff => !buff.supported && buff.modifiers.length),
  )!;
  const saved = createDefinitionEnemyDocument(original, 90, 30);
  const pending = original.birthBuffs!.find(buff => !buff.supported && buff.modifiers.length)!;
  expect(saved.birthEffects!.enabledBuffs).not.toContain(pending.key);
  const updated: EnemyDefinition = {
    ...original,
    birthBuffs: original.birthBuffs!.map(buff => ({ ...buff, supported: true })),
  };
  expect(resolveEnemyBirthValues(saved, updated, 30)).toEqual(
    resolveEnemyBirthValues(saved, original, 30),
  );
});

it('同一敌人的出生配置按关卡隔离，Worker 不串用相同局部 ID 的效果', () => {
  const definition: EnemyDefinition = {
    ...generatedEnemyDefinitions[0]!,
    attributeModifiers: [],
    birthBuffs: [],
  };
  function stage(id: string, multiplier: number): EnemyStageDefinition {
    return {
      ...generatedEnemyStages[0]!,
      id,
      enemies: [
        {
          id: 'spawn',
          source: {
            stageId: id,
            spawnId: 'spawn',
            enemyId: definition.id.replaceAll('-', '_'),
            templateId: definition.id,
          },
          definitionId: definition.id,
          level: 90,
          count: 1,
          nameKey: 'enemy',
          birthBuffs: [
            {
              key: 'stage:0:hp',
              buffId: 'hp',
              origin: 'stage',
              supported: true,
              modifiers: [{ attribute: 'MaxHp', slot: 'finalMultiplier', value: multiplier }],
            },
          ],
        },
      ],
    };
  }
  const stages = [stage('a', 2), stage('b', 4)];
  const scenario = createEmptyScenario('stage-isolation', 'stage-isolation');
  scenario.level = {
    kind: 'multiEnemies',
    enemies: stages.map(stage => {
      const spawn = stage.enemies[0]!;
      const enemy = createDefinitionEnemyDocument(
        definition,
        90,
        30,
        spawn.source,
        undefined,
        spawn,
      );
      enemy.editable.hp = 100;
      return { id: stage.id, name: stage.id, enemy };
    }),
  };
  const repository = createGameDataRepository({
    revision: 'stages',
    enemies: [definition],
    enemyStages: stages,
  });
  const packet = captureScenarioSimulationGameData(scenario, repository);
  expect(packet.enemies).toHaveLength(1);
  expect(packet.enemyStages).toHaveLength(2);
  const restored = restoreScenarioSimulationGameData(structuredClone(packet));
  expect(
    scenario.level.enemies.map(({ enemy }) => compileScenarioEnemy(enemy, restored).health),
  ).toEqual([200, 400]);
  expect(definition.birthBuffs).toEqual([]);
  const enemy = structuredClone(scenario.level.enemies[0]!.enemy);
  if (enemy.source.kind !== 'stage') throw new Error('expected stage source');
  enemy.source = { ...enemy.source, stageId: 'missing' };
  expect(() => compileScenarioEnemy(enemy, restored)).toThrow('missing enemy spawn');
});
