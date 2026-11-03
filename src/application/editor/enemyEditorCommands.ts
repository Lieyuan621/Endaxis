import type { EnemySpawnDefinition } from '../../../packages/game-data-contract/src/enemies';
import { enemyBirthOptions } from '../../core/project/enemyBirthEffects';
import { firstScenarioEnemy, levelEnemies, mapLevelEnemies } from '../../core/project/level';
/**
 * 将敌人预制体默认值转换为项目实例，并提供不可变的敌人覆盖命令。
 * 切换定义会重新捕获完整默认值；单项编辑只修改实例数值，不修改定义。
 */
import {
  getEnemyHpAtLevel,
  getEnemyRuntimeDefinitionId,
  type EnemyDefinition,
} from '../../core/game-data/enemyDefinition';
import type {
  EnemyDocument,
  StageEnemyIdentity,
  EnemyEditableValues,
  ScenarioDocument,
} from '../../core/project/schema';

/** 关卡选择中的一个已具备完整属性数据的敌人条目。 */
export interface StageEnemySelection {
  count: number;
  definitionId: string;
  level: number;
  source: StageEnemyIdentity;
  name: string;
}

function secondsToFrames(seconds: number, fps: number): number {
  if (!Number.isInteger(fps) || fps <= 0) throw new Error('project FPS must be a positive integer');
  return Math.round(seconds * fps);
}

/** 从敌人预制体的明确等级节点创建一个没有用户覆盖的敌人实例。 */
export function createDefinitionEnemyDocument(
  definition: EnemyDefinition,
  level: number,
  fps: number,
  stage?: StageEnemyIdentity,
  enabledBirthBuffs?: readonly string[],
  spawn?: EnemySpawnDefinition | null,
): EnemyDocument {
  const hp = getEnemyHpAtLevel(definition, level);
  if (hp === null) {
    throw new Error(`enemy '${definition.id}' has no HP value at level ${level}`);
  }
  const document: EnemyDocument = {
    source: stage
      ? { kind: 'stage', ...stage, level }
      : { kind: 'prefab', enemyId: definition.id, level },
    rank: definition.rank,
    editable: {
      hp,
      defense: definition.defense,
      superArmor: definition.superArmor,
      finisherMultiplier: definition.finisherMultiplier,
      resistances: { ...definition.resistances },
      stagger: {
        maximum: definition.stagger.maximum,
        knotThresholds: [...definition.stagger.knotThresholds],
        knotBreakDurationFrames: secondsToFrames(definition.stagger.knotBreakDurationSeconds, fps),
        brokenDurationFrames: secondsToFrames(definition.stagger.brokenDurationSeconds, fps),
        finisherSpRecovery: definition.stagger.finisherSpRecovery,
      },
    },
  };
  const options = enemyBirthOptions(definition, spawn);
  if (
    !options.length &&
    !definition.attributeModifiers?.length &&
    definition.stagger.recoveryTimeMultiplier === undefined
  )
    return document;
  return {
    ...document,
    birthEffects: {
      enabledBuffs: [
        ...(enabledBirthBuffs ?? options.filter(buff => buff.supported).map(buff => buff.key)),
      ],
    },
  };
}

export function setScenarioEnemy(
  scenario: ScenarioDocument,
  enemy: EnemyDocument,
  instanceId?: string,
): ScenarioDocument {
  const id = instanceId ?? firstScenarioEnemy(scenario).id;
  if (!levelEnemies(scenario.level).some(item => item.id === id))
    throw new Error('unknown enemy instance: ' + id);
  return {
    ...scenario,
    level: mapLevelEnemies(scenario.level, item => (item.id === id ? { ...item, enemy } : item)),
  };
}

/** 创建一个带明确项目默认值的自定义敌人；这些值本来就由用户决定，因此不标记为预制体覆盖。 */
export function createCustomEnemyDocument(level = 90): EnemyDocument {
  if (!Number.isInteger(level) || level <= 0) throw new Error('enemy level must be positive');
  return {
    source: { kind: 'custom', level },
    rank: 'mob',
    editable: {
      hp: 100000,
      defense: 100,
      superArmor: 0,
      finisherMultiplier: 1,
      resistances: {},
      stagger: {
        maximum: 300,
        knotThresholds: [0.5],
        knotBreakDurationFrames: 60,
        brokenDurationFrames: 300,
        finisherSpRecovery: 100,
      },
    },
  };
}

/** 把属性弹窗的一次确认合并为一次场景修改，并隔离编辑草稿。 */
export function replaceEnemyEditableValues(
  scenario: ScenarioDocument,
  values: EnemyEditableValues,
  instanceId?: string,
  enabledBirthBuffs?: readonly string[],
): ScenarioDocument {
  const enemy =
    instanceId === undefined
      ? firstScenarioEnemy(scenario).enemy
      : levelEnemies(scenario.level).find(item => item.id === instanceId)?.enemy;
  if (!enemy) throw new Error('unknown enemy instance: ' + instanceId);
  const definitionId = getEnemyRuntimeDefinitionId(enemy);
  const configuration =
    definitionId && (enemy.birthEffects || enabledBirthBuffs?.length)
      ? {
          enabledBuffs: [...(enabledBirthBuffs ?? enemy.birthEffects?.enabledBuffs ?? [])],
        }
      : undefined;
  const current = enemy.editable;
  let changed = false;
  for (const field of ['hp', 'defense', 'superArmor', 'finisherMultiplier'] as const) {
    if (current[field] !== values[field]) changed = true;
  }
  const resistanceKeys = new Set([
    ...Object.keys(current.resistances),
    ...Object.keys(values.resistances),
  ]);
  if ([...resistanceKeys].some(key => current.resistances[key] !== values.resistances[key])) {
    changed = true;
  }
  for (const field of [
    'maximum',
    'knotThresholds',
    'knotBreakDurationFrames',
    'brokenDurationFrames',
    'finisherSpRecovery',
  ] as const) {
    const unchanged =
      field === 'knotThresholds'
        ? current.stagger.knotThresholds.length === values.stagger.knotThresholds.length &&
          current.stagger.knotThresholds.every(
            (value, index) => value === values.stagger.knotThresholds[index],
          )
        : current.stagger[field] === values.stagger[field];
    if (!unchanged) {
      changed = true;
    }
  }
  const previousEnabled = enemy.birthEffects?.enabledBuffs ?? [];
  const enabledChanged =
    configuration &&
    (configuration.enabledBuffs.length !== previousEnabled.length ||
      configuration.enabledBuffs.some(key => !previousEnabled.includes(key)));
  if (!changed && !enabledChanged) return scenario;
  if (configuration)
    return setScenarioEnemy(
      scenario,
      {
        ...enemy,
        birthEffects: configuration,
        editable: structuredClone(values),
      },
      instanceId,
    );

  return setScenarioEnemy(
    scenario,
    {
      ...enemy,
      editable: {
        ...values,
        resistances: { ...values.resistances },
        stagger: {
          ...values.stagger,
          knotThresholds: [...values.stagger.knotThresholds],
        },
      },
    },
    instanceId,
  );
}
