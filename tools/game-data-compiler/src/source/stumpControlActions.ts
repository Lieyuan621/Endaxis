import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import {
  parseTimeDilationCurveKeys,
  type TimeDilationCurveKeySource,
} from './timeDilationActions.ts';
import { parseAdvancedDirectionSource, type AdvancedDirectionSource } from './spatial.ts';
import { readControlledStateDeadOption, readAbilityActionReturnTrueMethod } from './controlEnums.ts';

export interface StaticEnemyControlActionSource {
  readonly kind: 'enemyHurtAnimation' | 'pushBack';
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
}

export interface PullActionSource extends Omit<StaticEnemyControlActionSource, 'kind'> {
  readonly kind: 'pull';
  /** 普通目标/目的地未命中时的继续策略；不是拉拽是否成功的结果。 */
  readonly alwaysNext: boolean;
}

export interface TargetHitStopActionSource {
  readonly kind: 'targetHitStop';
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly affectType: string;
  readonly curveKey: string;
  readonly directCurveKeys: readonly TimeDilationCurveKeySource[];
  readonly durationSeconds: number;
  readonly priorityTagId: number;
}

export interface BlowOffEnemyActionSource {
  readonly kind: 'blowOffEnemy';
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly deadOption: string;
}

export interface BlowOffActionSource {
  readonly kind: 'blowOff';
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly deadOption: string;
}

export interface TakeDownActionSource {
  readonly kind: 'takeDown';
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly deadOption: string;
  readonly returnTrueWhen: string;
}

export interface LaunchUpwardActionSource {
  readonly kind: 'launchUpward';
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly teammateBigStagger: boolean;
  readonly floatingDuration: ScalarSource;
  readonly floatingHeight: ScalarSource;
  readonly speedFactorMultiplier: number;
  readonly faceDirection: AdvancedDirectionSource;
  /** 原生特效配置只保留为来源证据，不进入木桩数值投影。 */
  readonly airborneEffect: Readonly<Record<string, unknown>>;
  readonly immobilizedTime: number;
  readonly deadOption: string;
  readonly returnTrueWhen: string;
}

export type StumpControlActionSource =
  | StaticEnemyControlActionSource
  | PullActionSource
  | TargetHitStopActionSource
  | BlowOffEnemyActionSource
  | BlowOffActionSource
  | TakeDownActionSource
  | LaunchUpwardActionSource;

const META = ['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex'];

/** 严格保留受控状态动作；固定木桩投影只可在证明目标为敌人后消去。 */
export function parseTakeDownActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): TakeDownActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...META,
      'source',
      'targetSettings',
      'teammateBigStagger',
      'duration',
      'faceDirection',
      'immobilizedTime',
      'deadOption',
      'returnTrueWhen',
    ]),
    path,
  );
  requireBoolean(action.teammateBigStagger, `${path}.teammateBigStagger`);
  parseScalarSource(action.duration, `${path}.duration`, inheritedBlackboard);
  parseAdvancedDirectionSource(action.faceDirection, `${path}.faceDirection`);
  requireNumber(action.immobilizedTime, `${path}.immobilizedTime`);
  return {
    kind: 'takeDown',
    source: parseTargetReferenceSource(action.source, `${path}.source`),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    deadOption: readControlledStateDeadOption(action.deadOption, `${path}.deadOption`),
    returnTrueWhen: readAbilityActionReturnTrueMethod(action.returnTrueWhen, `${path}.returnTrueWhen`),
  };
}

/**
 * 严格保留 LaunchUpwardAction；它直接进入控制组件，不等同于带破防/Buff 链的
 * AirborneAction。固定木桩投影只能消去已证明目标且 Always 返回的实例。
 */
export function parseLaunchUpwardActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): LaunchUpwardActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...META,
      'source',
      'target',
      'teammateBigStagger',
      'floatingDuration',
      'floatingHeight',
      'speedFactorMultiplier',
      'faceDirection',
      'airborneEffect',
      'immobilizedTime',
      'deadOption',
      'returnTrueWhen',
    ]),
    path,
  );
  return {
    kind: 'launchUpward',
    source: parseTargetReferenceSource(action.source, `${path}.source`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    teammateBigStagger: requireBoolean(action.teammateBigStagger, `${path}.teammateBigStagger`),
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
    deadOption: readControlledStateDeadOption(action.deadOption, `${path}.deadOption`),
    returnTrueWhen: readAbilityActionReturnTrueMethod(action.returnTrueWhen, `${path}.returnTrueWhen`),
  };
}

export function parseEnemyHurtAnimationActionSource(
  value: unknown,
  path: string,
): StumpControlActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...META,
      'attacker',
      'defender',
      'hurtAnim',
      'additiveShaking',
      'shakeIntensity',
      'randFrameWhenZeroTimeScale',
      'faceToAttacker',
      'faceDirectionSettings',
      'teammateUseWeakenEffect',
      'overrideTransitionTime',
      'transitionTime',
      'weakImmobilizedTime',
      'weakUnmovableTime',
      'customPushBackDistance',
      'pushBackDistance',
      'distanceCurveEnabled',
      'distanceCurve',
      'distanceUseScale',
      'immobilizedTimeUseScale',
      'unmovableTimeUseScale',
      'deadAlsoPlayAnim',
      'deadTargetFactor',
      'impactValue',
      'overrideSuperArmorLimit',
    ]),
    path,
  );
  return {
    kind: 'enemyHurtAnimation',
    source: parseTargetReferenceSource(action.attacker, `${path}.attacker`),
    target: parseTargetReferenceSource(action.defender, `${path}.defender`),
  };
}

export function parsePullActionSource(value: unknown, path: string): StumpControlActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...META,
      'targetSettings',
      'pullSpeedUseBb',
      'pullSpeed',
      'pullSpeedBb',
      'isInfinity',
      'pullDuration',
      'stopTolerance',
      'unmovable',
      'finishPullByAction',
      'destination',
      'pullTargetType',
      'fixedDistanceMode',
      'attenuationBySuperArmor',
      'attenuationValues',
      ...('alwaysNext' in action ? ['alwaysNext'] : []),
    ]),
    path,
  );
  return {
    kind: 'pull',
    // 旧结构等价于默认关闭；来源层保留控制策略，不能按位移参数丢失。
    alwaysNext: 'alwaysNext' in action ? requireBoolean(action.alwaysNext, `${path}.alwaysNext`) : false,
    source: parseTargetReferenceSource(action.destination, `${path}.destination`),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
  };
}

export function parsePushBackActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): StumpControlActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...META,
      'attackerTargetSettings',
      'sourcePointSettings',
      'targetSettings',
      'pushBackDirection',
      'pushBackDistance',
      'distanceCurveEnabled',
      'curveOriginUseSourcePoint',
      'distanceCurve',
      'distanceUseScale',
      'timeUseScale',
      'unmovableUseScale',
      'pushBackTime',
      'unmovableTime',
      'useCustomCurve',
      'customCurve',
      'curveTemplate',
    ]),
    path,
  );
  parseTargetReferenceSource(action.sourcePointSettings, `${path}.sourcePointSettings`);
  for (const key of ['pushBackDistance', 'pushBackTime', 'unmovableTime'] as const)
    parseScalarSource(action[key], `${path}.${key}`, inheritedBlackboard);
  for (const key of [
    'distanceCurveEnabled',
    'curveOriginUseSourcePoint',
    'distanceUseScale',
    'timeUseScale',
    'unmovableUseScale',
    'useCustomCurve',
  ] as const)
    requireBoolean(action[key], `${path}.${key}`);
  parseTimeDilationCurveKeys(action.distanceCurve, `${path}.distanceCurve`, true);
  parseTimeDilationCurveKeys(action.customCurve, `${path}.customCurve`, true);
  requireString(action.pushBackDirection, `${path}.pushBackDirection`);
  requireString(action.curveTemplate, `${path}.curveTemplate`);
  return {
    kind: 'pushBack',
    source: parseTargetReferenceSource(
      action.attackerTargetSettings,
      `${path}.attackerTargetSettings`,
    ),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
  };
}

/**
 * 严格保存 BlowOffEnemyAction 的目标、空间参数与死亡过滤。具体物理异常链只有在目标仍可参与
 * 木桩数值模拟时才能投影；OnlyDead 切片可在目标死亡终止模型下审计省略。
 */
export function parseBlowOffEnemyActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): BlowOffEnemyActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...META,
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
    ]),
    path,
  );
  for (const key of [
    'blowOffDistance',
    'distanceRandomRange',
    'blowOffHeight',
    'totalTime',
  ] as const)
    parseScalarSource(action[key], `${path}.${key}`, inheritedBlackboard);
  requireBoolean(action.overwriteHeight, `${path}.overwriteHeight`);
  parseAdvancedDirectionSource(action.directionSettings, `${path}.directionSettings`);
  requireBoolean(action.isExtra, `${path}.isExtra`);
  return {
    kind: 'blowOffEnemy',
    source: parseTargetReferenceSource(
      action.attackerTargetSettings,
      `${path}.attackerTargetSettings`,
    ),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    deadOption: readControlledStateDeadOption(action.deadOption, `${path}.deadOption`),
  };
}

/** BlowOffAction 只修改角色受控位移/模型高度；严格保留其身份与死亡过滤供木桩投影审计。 */
export function parseBlowOffActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): BlowOffActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...META,
      'attackerTargetSettings',
      'targetSettings',
      'teammateBigStagger',
      'blowOffDistance',
      'distanceRandomRange',
      'overwriteHeight',
      'blowOffHeight',
      'directionSettings',
      'directionAngleOffset',
      'totalTime',
      'deadOption',
      'forceMoveColliderToGround',
      'modelHeightRecoverTime',
    ]),
    path,
  );
  for (const key of [
    'blowOffDistance',
    'distanceRandomRange',
    'blowOffHeight',
    'directionAngleOffset',
    'totalTime',
    'modelHeightRecoverTime',
  ] as const)
    parseScalarSource(action[key], `${path}.${key}`, inheritedBlackboard);
  for (const key of ['teammateBigStagger', 'overwriteHeight', 'forceMoveColliderToGround'] as const)
    requireBoolean(action[key], `${path}.${key}`);
  parseAdvancedDirectionSource(action.directionSettings, `${path}.directionSettings`);
  return {
    kind: 'blowOff',
    source: parseTargetReferenceSource(
      action.attackerTargetSettings,
      `${path}.attackerTargetSettings`,
    ),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    deadOption: readControlledStateDeadOption(action.deadOption, `${path}.deadOption`),
  };
}

export function parseTargetHitStopActionSource(
  value: unknown,
  path: string,
): StumpControlActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...META,
      'affectType',
      'curveKey',
      'useDirectCurve',
      'directCurve',
      'duration',
      'timeDilationPriority',
      'attacker',
      'target',
    ]),
    path,
  );
  const affectType = requireString(action.affectType, `${path}.affectType`);
  if (!['OnlyAttacker', 'OnlyTarget', 'Both'].includes(affectType))
    throw new Error(`${path}.affectType: unsupported hit-stop target set ${affectType}`);
  const useDirectCurve = requireBoolean(action.useDirectCurve, `${path}.useDirectCurve`);
  const directCurve = requireArray(action.directCurve, `${path}.directCurve`);
  const curveKey = requireString(action.curveKey, `${path}.curveKey`);
  // useDirectCurve 是真正的来源选择器；未选中的槽位允许保留序列化残值。
  // 全量 SkillData 同时存在 named+非空 direct 与 direct+非空 named 两类形状，
  // 不能用未选槽位是否为空反推运行时来源。
  if ((useDirectCurve && directCurve.length === 0) || (!useDirectCurve && curveKey.length === 0))
    throw new Error(`${path}: inconsistent hit-stop curve source`);
  const duration = requireNumber(action.duration, `${path}.duration`);
  if (!Number.isFinite(duration) || duration < 0)
    throw new Error(`${path}.duration: expected finite non-negative number`);
  const priority = requireRecord(action.timeDilationPriority, `${path}.timeDilationPriority`);
  requireExactFields(priority, new Set(['tagId']), `${path}.timeDilationPriority`);
  return {
    kind: 'targetHitStop',
    source: parseTargetReferenceSource(action.attacker, `${path}.attacker`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    affectType,
    curveKey,
    directCurveKeys: useDirectCurve
      ? parseTimeDilationCurveKeys(directCurve, `${path}.directCurve`, true)
      : [],
    durationSeconds: duration,
    priorityTagId: requireInteger(priority.tagId, `${path}.timeDilationPriority.tagId`),
  };
}
