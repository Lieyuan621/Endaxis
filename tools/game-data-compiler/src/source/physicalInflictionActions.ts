import {
  requireBoolean,
  requireExactFields,
  requireNumber,
  requireRecord,
} from './primitives.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseAdvancedDirectionSource, type AdvancedDirectionSource } from './spatial.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

import {
  readControlledStateDeadOption as parseDeadOption,
  readAbilityActionReturnTrueMethod as parseReturnTrueWhen,
  type ControlledStateDeadOptionSource,
  type AbilityActionReturnTrueMethodSource,
} from './controlEnums.ts';
export type { ControlledStateDeadOptionSource, AbilityActionReturnTrueMethodSource } from './controlEnums.ts';

/** 击倒不是纯敌人动作：入口有破防门、状态 Buff 和独立返回策略，不归木桩表现动作。 */
export interface KnockDownActionSource {
  readonly kind: 'knockDown';
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly forceKnockDown: boolean;
  readonly duration: ScalarSource;
  readonly faceDirection: AdvancedDirectionSource;
  readonly immobilizedTime: number;
  readonly isExtra: boolean;
  readonly deadOption: ControlledStateDeadOptionSource;
  readonly returnTrueWhen: AbilityActionReturnTrueMethodSource;
}

/** 浮空与击倒共享破防/返回门，但控制参数和原生字段身份不同。 */
export interface AirborneActionSource {
  readonly kind: 'airborne';
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly forceAirborne: boolean;
  readonly floatingDuration: ScalarSource;
  readonly floatingHeight: ScalarSource;
  readonly speedFactorMultiplier: number;
  readonly faceDirection: AdvancedDirectionSource;
  /** 特效负载只保留为来源证据，不投影为木桩战斗状态。 */
  readonly airborneEffect: Readonly<Record<string, unknown>>;
  readonly immobilizedTime: number;
  readonly isExtra: boolean;
  readonly deadOption: ControlledStateDeadOptionSource;
  readonly returnTrueWhen: AbilityActionReturnTrueMethodSource;
}

interface PhysicalInflictionActionBaseSource {
  readonly attacker: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly blowOffDistance: ScalarSource;
  readonly distanceRandomRange: ScalarSource;
  readonly overwriteHeight: boolean;
  readonly blowOffHeight: ScalarSource;
  readonly direction: AdvancedDirectionSource;
  readonly totalTime: ScalarSource;
  readonly isExtra: boolean;
  readonly deadOption: ControlledStateDeadOptionSource;
  readonly immobilizedTime: number;
}

export interface FractureActionSource extends PhysicalInflictionActionBaseSource {
  readonly kind: 'fracture';
}

export interface CrushActionSource extends PhysicalInflictionActionBaseSource {
  readonly kind: 'crush';
  readonly damageMultiplier: ScalarSource;
  readonly ignoreHitEffect: boolean;
}

export type PhysicalInflictionActionSource = FractureActionSource | CrushActionSource;

export function parseAirborneActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): AirborneActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'source',
      'target',
      'forceAirborne',
      'floatingDuration',
      'floatingHeight',
      'speedFactorMultiplier',
      'faceDirection',
      'airborneEffect',
      'immobilizedTime',
      'isExtra',
      'deadOption',
      'returnTrueWhen',
    ]),
    path,
  );
  const deadOption = parseDeadOption(action.deadOption, `${path}.deadOption`);
  const returnTrueWhen = parseReturnTrueWhen(action.returnTrueWhen, `${path}.returnTrueWhen`);
  return {
    kind: 'airborne',
    source: parseTargetReferenceSource(action.source, `${path}.source`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    forceAirborne: requireBoolean(action.forceAirborne, `${path}.forceAirborne`),
    floatingDuration: parseScalarSource(
      action.floatingDuration,
      `${path}.floatingDuration`,
      inheritedBlackboard,
    ),
    floatingHeight: parseScalarSource(
      action.floatingHeight,
      `${path}.floatingHeight`,
      inheritedBlackboard,
    ),
    speedFactorMultiplier: requireNumber(
      action.speedFactorMultiplier,
      `${path}.speedFactorMultiplier`,
    ),
    faceDirection: parseAdvancedDirectionSource(action.faceDirection, `${path}.faceDirection`),
    airborneEffect: requireRecord(action.airborneEffect, `${path}.airborneEffect`),
    immobilizedTime: requireNumber(action.immobilizedTime, `${path}.immobilizedTime`),
    isExtra: requireBoolean(action.isExtra, `${path}.isExtra`),
    deadOption,
    returnTrueWhen,
  };
}
export function parsePhysicalInflictionActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
  kind: PhysicalInflictionActionSource['kind'],
): PhysicalInflictionActionSource {
  const action = requireRecord(value, path);
  const fields = new Set([
    '$type',
    'isEnable',
    'priorityLevel',
    'priorityOffset',
    'serverActionIndex',
    'attackerTargetSettings',
    'targetSettings',
    'blowOffDistance',
    'distanceRandomRange',
    'overwriteHeight',
    'blowOffHeight',
    'directionSettings',
    'totalTime',
    'isExtra',
    'deadOption',
    'immobilizedTime',
  ]);
  if (kind === 'crush') {
    fields.add('damageMultiplier');
    fields.add('ignoreHitEffect');
  }
  requireExactFields(action, fields, path);
  const deadOption = parseDeadOption(action.deadOption, `${path}.deadOption`);
  const base: PhysicalInflictionActionBaseSource = {
    attacker: parseTargetReferenceSource(
      action.attackerTargetSettings,
      `${path}.attackerTargetSettings`,
    ),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    blowOffDistance: parseScalarSource(
      action.blowOffDistance,
      `${path}.blowOffDistance`,
      inheritedBlackboard,
    ),
    distanceRandomRange: parseScalarSource(
      action.distanceRandomRange,
      `${path}.distanceRandomRange`,
      inheritedBlackboard,
    ),
    overwriteHeight: requireBoolean(action.overwriteHeight, `${path}.overwriteHeight`),
    blowOffHeight: parseScalarSource(
      action.blowOffHeight,
      `${path}.blowOffHeight`,
      inheritedBlackboard,
    ),
    direction: parseAdvancedDirectionSource(action.directionSettings, `${path}.directionSettings`),
    totalTime: parseScalarSource(action.totalTime, `${path}.totalTime`, inheritedBlackboard),
    isExtra: requireBoolean(action.isExtra, `${path}.isExtra`),
    deadOption,
    immobilizedTime: requireNumber(action.immobilizedTime, `${path}.immobilizedTime`),
  };
  return kind === 'fracture'
    ? { kind, ...base }
    : {
        kind,
        ...base,
        damageMultiplier: parseScalarSource(
          action.damageMultiplier,
          `${path}.damageMultiplier`,
          inheritedBlackboard,
        ),
        ignoreHitEffect: requireBoolean(action.ignoreHitEffect, `${path}.ignoreHitEffect`),
      };
}

export function parseKnockDownActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): KnockDownActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'source',
      'targetSettings',
      'forceKnockDown',
      'duration',
      'faceDirection',
      'immobilizedTime',
      'isExtra',
      'deadOption',
      'returnTrueWhen',
    ]),
    path,
  );
  const deadOption = parseDeadOption(action.deadOption, `${path}.deadOption`);
  const returnTrueWhen = parseReturnTrueWhen(action.returnTrueWhen, `${path}.returnTrueWhen`);
  return {
    kind: 'knockDown',
    source: parseTargetReferenceSource(action.source, `${path}.source`),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    forceKnockDown: requireBoolean(action.forceKnockDown, `${path}.forceKnockDown`),
    duration: parseScalarSource(action.duration, `${path}.duration`, inheritedBlackboard),
    faceDirection: parseAdvancedDirectionSource(action.faceDirection, `${path}.faceDirection`),
    immobilizedTime: requireNumber(action.immobilizedTime, `${path}.immobilizedTime`),
    isExtra: requireBoolean(action.isExtra, `${path}.isExtra`),
    deadOption,
    returnTrueWhen,
  };
}
