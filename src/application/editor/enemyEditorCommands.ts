/**
 * 将敌人预制体默认值转换为项目实例，并提供不可变的敌人覆盖命令。
 * 切换定义会重新捕获完整默认值；单项编辑只记录用户接管的字段，不修改定义。
 */
import { getEnemyHpAtLevel, type EnemyDefinition } from '../../core/game-data/enemyDefinition';
import type {
  EnemyDocument,
  EnemyEditableField,
  EnemyEditableValues,
  EnemyStaggerEditableValues,
  ScenarioDocument,
} from '../../core/project/schema';

export type EnemyBasicEditableField = keyof Pick<
  EnemyEditableValues,
  'hp' | 'defense' | 'superArmor' | 'finisherMultiplier'
>;
export type EnemyStaggerEditableField = keyof EnemyStaggerEditableValues;

function addEditedField(
  edited: readonly EnemyEditableField[],
  field: EnemyEditableField,
): EnemyEditableField[] {
  return edited.includes(field) ? [...edited] : [...edited, field];
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
): EnemyDocument {
  const hp = getEnemyHpAtLevel(definition, level);
  if (hp === null) {
    throw new Error(`enemy '${definition.id}' has no HP value at level ${level}`);
  }
  return {
    source: { kind: 'prefab', enemyId: definition.id, level },
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
    edited: [],
  };
}

export function setScenarioEnemy(
  scenario: ScenarioDocument,
  enemy: EnemyDocument,
): ScenarioDocument {
  if (scenario.enemy === enemy) return scenario;
  return { ...scenario, enemy };
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
    edited: [],
  };
}

/** 把属性弹窗的一次确认合并为一次场景修改，并逐字段记录本次新增的用户覆盖。 */
export function replaceEnemyEditableValues(
  scenario: ScenarioDocument,
  values: EnemyEditableValues,
): ScenarioDocument {
  const current = scenario.enemy.editable;
  const changedFields: EnemyEditableField[] = [];
  for (const field of ['hp', 'defense', 'superArmor', 'finisherMultiplier'] as const) {
    if (current[field] !== values[field]) changedFields.push(field);
  }
  const resistanceKeys = new Set([
    ...Object.keys(current.resistances),
    ...Object.keys(values.resistances),
  ]);
  if ([...resistanceKeys].some(key => current.resistances[key] !== values.resistances[key])) {
    changedFields.push('resistances');
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
      changedFields.push(`stagger.${field}`);
    }
  }
  if (changedFields.length === 0) return scenario;

  return {
    ...scenario,
    enemy: {
      ...scenario.enemy,
      editable: {
        ...values,
        resistances: { ...values.resistances },
        stagger: {
          ...values.stagger,
          knotThresholds: [...values.stagger.knotThresholds],
        },
      },
      edited: changedFields.reduce<EnemyEditableField[]>(addEditedField, [
        ...scenario.enemy.edited,
      ]),
    },
  };
}

export function updateEnemyBasicField<K extends EnemyBasicEditableField>(
  scenario: ScenarioDocument,
  field: K,
  value: EnemyEditableValues[K],
): ScenarioDocument {
  if (scenario.enemy.editable[field] === value) return scenario;
  return {
    ...scenario,
    enemy: {
      ...scenario.enemy,
      editable: { ...scenario.enemy.editable, [field]: value },
      edited: addEditedField(scenario.enemy.edited, field),
    },
  };
}

export function updateEnemyResistance(
  scenario: ScenarioDocument,
  damageType: string,
  value: number,
): ScenarioDocument {
  if (scenario.enemy.editable.resistances[damageType] === value) return scenario;
  return {
    ...scenario,
    enemy: {
      ...scenario.enemy,
      editable: {
        ...scenario.enemy.editable,
        resistances: { ...scenario.enemy.editable.resistances, [damageType]: value },
      },
      edited: addEditedField(scenario.enemy.edited, 'resistances'),
    },
  };
}

export function updateEnemyStaggerField<K extends EnemyStaggerEditableField>(
  scenario: ScenarioDocument,
  field: K,
  value: EnemyStaggerEditableValues[K],
): ScenarioDocument {
  const current = scenario.enemy.editable.stagger[field];
  const unchanged =
    field === 'knotThresholds' && Array.isArray(current) && Array.isArray(value)
      ? current.length === value.length && current.every((item, index) => item === value[index])
      : current === value;
  if (unchanged) return scenario;
  const editedField = `stagger.${field}` as const;
  return {
    ...scenario,
    enemy: {
      ...scenario.enemy,
      editable: {
        ...scenario.enemy.editable,
        stagger: {
          ...scenario.enemy.editable.stagger,
          [field]: Array.isArray(value) ? [...value] : value,
        },
      },
      edited: addEditedField(scenario.enemy.edited, editedField),
    },
  };
}
