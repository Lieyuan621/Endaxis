import {
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import { readDirectionType } from './targetEnums.ts';
import {
  parseTimeDilationCurveKeys,
  type TimeDilationCurveKeySource,
} from './timeDilationActions.ts';

export interface SaveTwoDirectionAngleActionSource {
  readonly kind: 'saveTwoDirectionAngle';
  readonly direction1Source: TargetReferenceSource;
  readonly direction1Target: TargetReferenceSource;
  readonly direction1Type: ReturnType<typeof readDirectionType>;
  readonly direction2Source: TargetReferenceSource;
  readonly direction2Target: TargetReferenceSource;
  readonly direction2Type: ReturnType<typeof readDirectionType>;
  readonly outputKey: string;
}

export type PresentationCalculationActionSource =
  | {
      /** 玩家移动输入的有符号角度；仅可在其全部保留消费者消失后从战斗程序省略。 */
      readonly kind: 'saveMoveAxisAngle';
      readonly outputKey: string;
    }
  | {
      readonly kind: 'evaluateCurve';
      readonly input: ScalarSource;
      readonly outputKey: string;
      readonly curve: readonly TimeDilationCurveKeySource[];
    }
  | {
      readonly kind: 'saveCameraAngle';
      readonly target: TargetReferenceSource;
      readonly mountPoint: string;
      readonly outputKeys: readonly string[];
    };

export function parseSaveMoveAxisAngleActionSource(
  value: unknown,
  path: string,
): PresentationCalculationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex', 'key']),
    path,
  );
  return {
    kind: 'saveMoveAxisAngle',
    outputKey: requireNonEmptyString(action.key, `${path}.key`),
  };
}

/**
 * 严格保留 SaveCameraAngle 的目标与实际写入键。角度值本身不在导入阶段求值；
 * 只有完整技能数据流证明这些键仅被表现动作消费时，调用方才会省略该动作。
 */
export function parseSaveCameraAngleActionSource(
  value: unknown,
  path: string,
): PresentationCalculationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'target',
      'mountPoint',
      'yawKey',
      'pitchKey',
      'eulerPitchKey',
      'distanceKey',
    ]),
    path,
  );
  const outputKeys = ['yawKey', 'pitchKey', 'eulerPitchKey', 'distanceKey']
    .map(key => {
      const output = action[key];
      if (typeof output !== 'string') throw new Error(`${path}.${key}: expected string`);
      return output;
    })
    .filter(key => key.length > 0);
  if (outputKeys.length === 0) throw new Error(`${path}: expected at least one output key`);
  return {
    kind: 'saveCameraAngle',
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    mountPoint: requireNonEmptyString(action.mountPoint, `${path}.mountPoint`),
    outputKeys,
  };
}

export function parseSaveTwoDirectionAngleActionSource(
  value: unknown,
  path: string,
): SaveTwoDirectionAngleActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'dir1Source',
      'dir1Target',
      'dir1DirectionType',
      'dir2Source',
      'dir2Target',
      'dir2DirectionType',
      'key',
    ]),
    path,
  );
  return {
    kind: 'saveTwoDirectionAngle',
    direction1Source: parseTargetReferenceSource(action.dir1Source, `${path}.dir1Source`),
    direction1Target: parseTargetReferenceSource(action.dir1Target, `${path}.dir1Target`),
    direction1Type: readDirectionType(action.dir1DirectionType, `${path}.dir1DirectionType`),
    direction2Source: parseTargetReferenceSource(action.dir2Source, `${path}.dir2Source`),
    direction2Target: parseTargetReferenceSource(action.dir2Target, `${path}.dir2Target`),
    direction2Type: readDirectionType(action.dir2DirectionType, `${path}.dir2DirectionType`),
    outputKey: requireNonEmptyString(action.key, `${path}.key`),
  };
}

export function parseCurveEvaluateFloatActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): PresentationCalculationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'inputValue',
      'useCustomCurve',
      'customCurve',
      'curveTemplate',
      'key',
    ]),
    path,
  );
  if (!requireBoolean(action.useCustomCurve, `${path}.useCustomCurve`))
    throw new Error(`${path}.useCustomCurve: named curve evaluation is unsupported`);
  requireNonEmptyString(action.curveTemplate, `${path}.curveTemplate`);
  return {
    kind: 'evaluateCurve',
    input: parseScalarSource(action.inputValue, `${path}.inputValue`, inheritedBlackboard),
    outputKey: requireNonEmptyString(action.key, `${path}.key`),
    curve: parseTimeDilationCurveKeys(action.customCurve, `${path}.customCurve`, true),
  };
}
