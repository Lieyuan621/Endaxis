import {
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';
import { parseNativeCalculationSource, type NativeCalculationSource } from './calculation.ts';
import type { BlackboardLevelValues } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

const ACTION_META_FIELDS = [
  '$type',
  'isEnable',
  'priorityLevel',
  'priorityOffset',
  'serverActionIndex',
];

export interface RecoverPoiseActionSource {
  readonly kind: 'recoverPoise';
  readonly alwaysNext: boolean;
  readonly healer: string;
  readonly target: TargetReferenceSource;
  readonly calculation: NativeCalculationSource;
  readonly playHealEffect: boolean;
}
/** 读取原生 RecoverPoiseAction 的目标与恢复量。 */
export function parseRecoverPoiseActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): RecoverPoiseActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'alwaysNext',
      'healer',
      'target',
      'poiseType',
      'recoverValue',
      'playHealEffect',
      'effectData',
    ]),
    path,
  );
  if (action.poiseType !== 'Physical') throw new Error(`${path}: unsupported poise type`);
  return {
    kind: 'recoverPoise',
    alwaysNext: requireBoolean(action.alwaysNext, `${path}.alwaysNext`),
    healer: requireNonEmptyString(action.healer, `${path}.healer`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    calculation: parseNativeCalculationSource(
      action.recoverValue,
      `${path}.recoverValue`,
      inheritedBlackboard,
    ),
    playHealEffect: requireBoolean(action.playHealEffect, `${path}.playHealEffect`),
  };
}
