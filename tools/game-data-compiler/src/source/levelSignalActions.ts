import { requireBoolean, requireExactFields, requireRecord } from './primitives.ts';
import {
  parseScalarSource,
  parseStringScalarSource,
  type BlackboardLevelValues,
  type ScalarSource,
  type StringScalarSource,
} from './scalar.ts';

/** 向关卡脚本发送具名数值信号；不等同于战斗语义事件。 */
export interface BattleLevelSignalActionSource {
  readonly kind: 'battleLevelSignal';
  readonly signalId: StringScalarSource;
  readonly value: ScalarSource;
}

/** 训练关卡的成功/失败埋点；只保留完整来源事实，Next 战斗模型没有关卡训练消费者。 */
export interface TrainingLevelEventActionSource {
  readonly kind: 'trainingLevelEvent';
  readonly eventKey: StringScalarSource;
  readonly outputStringValue: boolean;
  readonly stringValue: StringScalarSource;
  readonly numericValue: ScalarSource;
}

export function parseBattleLevelSignalActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): BattleLevelSignalActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'signalId',
      'doubleValue',
    ]),
    path,
  );
  return {
    kind: 'battleLevelSignal',
    signalId: parseStringScalarSource(action.signalId, `${path}.signalId`),
    value: parseScalarSource(action.doubleValue, `${path}.doubleValue`, inheritedBlackboard),
  };
}

export function parseTrainingLevelEventActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): TrainingLevelEventActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'eventKey',
      'outputStringValue',
      'stringValue',
      'numericValue',
    ]),
    path,
  );
  return {
    kind: 'trainingLevelEvent',
    eventKey: parseStringScalarSource(action.eventKey, `${path}.eventKey`),
    outputStringValue: requireBoolean(action.outputStringValue, `${path}.outputStringValue`),
    stringValue: parseStringScalarSource(action.stringValue, `${path}.stringValue`),
    numericValue: parseScalarSource(
      action.numericValue,
      `${path}.numericValue`,
      inheritedBlackboard,
    ),
  };
}
