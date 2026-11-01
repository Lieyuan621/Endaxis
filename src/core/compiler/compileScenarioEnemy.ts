/**
 * 将项目持久化的敌人实例编译为战斗运行时使用的稳定输入。
 *
 * 可编辑属性保留存档快照，不重新套用定义默认值。
 * 失衡节点阈值原样进入运行时程序，由失衡系统按原生语义消费。
 */
import type { PlayerDamageDefenderSnapshot } from '../combat/damage/playerActiveDamageInput';
import type { CombatEnemyProgram } from '../combat/runtime/combatRuntimeAssembly';
import type { EnemyDocument } from '../project/schema';
import { compileEnemyLifecycle } from './compileEnemyLifecycle';

const RESISTIBLE_DAMAGE_TYPES = [
  'physical',
  'heat',
  'electric',
  'cryo',
  'nature',
  'ether',
] as const;

function requireFinite(value: number, path: string): number {
  if (!Number.isFinite(value)) throw new TypeError(`${path} must be a finite number`);
  return value;
}

function requireNonNegative(value: number, path: string): number {
  requireFinite(value, path);
  if (value < 0) throw new RangeError(`${path} must be non-negative`);
  return value;
}

function requireNonNegativeInteger(value: number, path: string): number {
  requireNonNegative(value, path);
  if (!Number.isInteger(value)) throw new RangeError(`${path} must be an integer`);
  return value;
}

function compileDefenderAttributes(enemy: EnemyDocument): PlayerDamageDefenderSnapshot {
  const knownTypes = new Set<string>(RESISTIBLE_DAMAGE_TYPES);
  for (const type of Object.keys(enemy.editable.resistances)) {
    if (!knownTypes.has(type)) throw new Error(`enemy resistance '${type}' is not supported`);
  }

  return {
    defense: requireNonNegative(enemy.editable.defense, 'enemy.editable.defense'),
    shelterDamageMultiplier: 0,
    breakingAttackDamageTakenMultiplier: requireNonNegative(
      enemy.editable.finisherMultiplier,
      'enemy.editable.finisherMultiplier',
    ),
    resistances: Object.fromEntries(
      RESISTIBLE_DAMAGE_TYPES.map(type => [
        type,
        {
          percent: requireFinite(
            enemy.editable.resistances[type] ?? 0,
            `enemy.editable.resistances.${type}`,
          ),
          damageTakenMultiplier: 1,
        },
      ]),
    ) as PlayerDamageDefenderSnapshot['resistances'],
  };
}

/** 编译单个敌人实例的静态运行时程序。 */
export function compileScenarioEnemy(enemy: EnemyDocument): CombatEnemyProgram {
  const source = {
    ...enemy.source,
    level: requireNonNegativeInteger(enemy.source.level, 'enemy.source.level'),
  };
  if (source.level === 0) throw new RangeError('enemy.source.level must be positive');

  return {
    source,
    ...(enemy.lifecycle === undefined
      ? {}
      : { lifecycle: compileEnemyLifecycle(enemy.lifecycle, 0) }),
    rank: enemy.rank,
    health: requireNonNegative(enemy.editable.hp, 'enemy.editable.hp'),
    superArmor: requireNonNegative(enemy.editable.superArmor, 'enemy.editable.superArmor'),
    defenderAttributes: compileDefenderAttributes(enemy),
    stagger: {
      maximum: requireNonNegative(enemy.editable.stagger.maximum, 'enemy.editable.stagger.maximum'),
      knotThresholds: compileKnotThresholds(enemy.editable.stagger.knotThresholds),
      knotBreakDurationFrames: requireNonNegativeInteger(
        enemy.editable.stagger.knotBreakDurationFrames,
        'enemy.editable.stagger.knotBreakDurationFrames',
      ),
      brokenDurationFrames: requireNonNegativeInteger(
        enemy.editable.stagger.brokenDurationFrames,
        'enemy.editable.stagger.brokenDurationFrames',
      ),
      finisherSpRecovery: requireNonNegative(
        enemy.editable.stagger.finisherSpRecovery,
        'enemy.editable.stagger.finisherSpRecovery',
      ),
    },
  };
}

function compileKnotThresholds(values: readonly number[]): readonly number[] {
  let previous = 0;
  return Object.freeze(
    values.map((value, index) => {
      const threshold = requireNonNegative(value, `enemy.editable.stagger.knotThresholds.${index}`);
      if (threshold <= previous || threshold >= 1) {
        throw new RangeError(
          'enemy stagger knot thresholds must increase and stay between 0 and 1',
        );
      }
      previous = threshold;
      return threshold;
    }),
  );
}
