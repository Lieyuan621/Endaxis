import {
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireRecord,
} from './primitives.ts';
import {
  parseScalarSource,
  parseStringScalarSource,
  type BlackboardLevelValues,
  type ScalarSource,
  type StringScalarSource,
} from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import { gameplayTagId } from './nativeGameplayTags.ts';
import { projectSpGainKind, projectSpGainSource } from './spGainEnums.ts';

export interface ResourceGainActionSource {
  readonly kind: 'resourceGain';
  readonly resource: 'ultimateEnergy' | 'sp';
  readonly amount: ScalarSource;
  readonly coefficient: ScalarSource;
  readonly spGainKind: 'gain' | 'refund' | null;
  readonly spGainSource: 'default' | 'normalAttack' | 'powerAttack' | 'skill' | null;
  readonly onlyMainOperator: boolean;
  readonly isPercentValue: boolean;
  readonly useUltimateRecoveryTag: boolean;
  readonly ultimateRecoveryTagId: number;
  readonly ignoreUltimateGainScalar: boolean;
  readonly playEffect: boolean;
  readonly playAudio: boolean;
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
}

/** RecoverDashEnergy 的完整原生载荷。它操作 PlayerController 的共享闪避体力。 */
export interface DashEnergyRecoveryActionSource {
  readonly kind: 'dashEnergyRecovery';
  readonly amount: ScalarSource;
  readonly canRecoverWhenOverdraft: boolean;
}

export interface BattleDetailRecordActionSource {
  readonly kind: 'recordPerfectDodge';
}

/** GainBreakingAttackAtb：从命中目标读取处决技力基值，再乘动作 factor。 */
export interface FinisherSpGainActionSource {
  readonly kind: 'finisherSpGain';
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly factor: ScalarSource;
}

export interface TimedMarkerApplicationSource {
  readonly kind: 'timedMarkerApplication';
  readonly target: TargetReferenceSource;
  readonly marker: StringScalarSource;
  readonly duration: ScalarSource;
  readonly autoFinishByAction: boolean;
  /** true 使用目标自身的局部膨胀时间，false 使用共享战斗时间。 */
  readonly useTimeDilationDeltaTime: boolean;
}

export interface GlobalCooldownApplicationSource {
  readonly kind: 'globalCooldownApplication';
  readonly target: TargetReferenceSource;
  readonly buffId: string;
  readonly duration: ScalarSource;
}

export interface SkillCooldownMutationActionSource {
  readonly kind: 'skillCooldownMutation';
  readonly target: TargetReferenceSource;
  readonly skill:
    | {
        readonly kind: 'type';
        readonly skillType: 'basicAttack' | 'battleSkill' | 'comboSkill' | 'ultimate' | 'finisher';
      }
    | { readonly kind: 'id'; readonly skillId: string };
  readonly operation: 'set' | 'reduce';
  readonly basis: 'baseDurationRatio' | 'absoluteSeconds';
  readonly value: ScalarSource;
}

const ACTION_META_FIELDS = [
  '$type',
  'isEnable',
  'priorityLevel',
  'priorityOffset',
  'serverActionIndex',
];

/** 读取 ObtainCostAction 的完整公共载荷，不在来源层判断当前场景是否拥有该资源。 */
export function parseResourceGainActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): ResourceGainActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'costType',
      'isPercentValue',
      'useUspRecoverTag',
      'uspRecoverTag',
      'ignoreUspGainScalar',
      'atbSourceType',
      'atbGainMethod',
      ...('useAtbGainTag' in action || 'atbGainTag' in action
        ? ['useAtbGainTag', 'atbGainTag']
        : []),
      'playObtainAtbEffect',
      'playObtainAtbAudio',
      'costValue',
      'coefficient',
      'atbOnlyMainChar',
      'source',
      'target',
    ]),
    path,
  );
  // 新版开关关闭时 GainAtb 不读取配置标签；仅接入这一有证据的旧行为等价分支。
  // 字段必须成对出现，开启时不能静默丢弃标签资格或自行猜测其含义。
  if ('useAtbGainTag' in action) {
    const enabled = requireBoolean(action.useAtbGainTag, `${path}.useAtbGainTag`);
    const tag = requireRecord(action.atbGainTag, `${path}.atbGainTag`);
    requireExactFields(tag, new Set(['tagId']), `${path}.atbGainTag`);
    gameplayTagId(requireInteger(tag.tagId, `${path}.atbGainTag.tagId`));
    if (enabled)
      throw new Error(`${path}.useAtbGainTag: tagged SP gain requires native consumer projection`);
  }
  const resource = { UltimateSp: 'ultimateEnergy', Atb: 'sp' }[String(action.costType)] as
    'ultimateEnergy' | 'sp' | undefined;
  if (!resource)
    throw new Error(`${path}.costType: unsupported value ${JSON.stringify(action.costType)}`);
  const spGainSource = projectSpGainSource(action.atbSourceType, `${path}.atbSourceType`);
  const spGainKind = projectSpGainKind(action.atbGainMethod, `${path}.atbGainMethod`);
  const recoveryTag = requireRecord(action.uspRecoverTag, `${path}.uspRecoverTag`);
  requireExactFields(recoveryTag, new Set(['tagId']), `${path}.uspRecoverTag`);
  return {
    kind: 'resourceGain',
    resource,
    amount: parseScalarSource(action.costValue, `${path}.costValue`, inheritedBlackboard),
    coefficient: parseScalarSource(action.coefficient, `${path}.coefficient`, inheritedBlackboard),
    spGainKind: resource === 'sp' ? spGainKind : null,
    spGainSource: resource === 'sp' ? spGainSource : null,
    onlyMainOperator: requireBoolean(action.atbOnlyMainChar, `${path}.atbOnlyMainChar`),
    isPercentValue: requireBoolean(action.isPercentValue, `${path}.isPercentValue`),
    useUltimateRecoveryTag: requireBoolean(action.useUspRecoverTag, `${path}.useUspRecoverTag`),
    ultimateRecoveryTagId: requireNonNegativeInteger(
      recoveryTag.tagId,
      `${path}.uspRecoverTag.tagId`,
    ),
    ignoreUltimateGainScalar: requireBoolean(
      action.ignoreUspGainScalar,
      `${path}.ignoreUspGainScalar`,
    ),
    playEffect: requireBoolean(action.playObtainAtbEffect, `${path}.playObtainAtbEffect`),
    playAudio: requireBoolean(action.playObtainAtbAudio, `${path}.playObtainAtbAudio`),
    source: parseTargetReferenceSource(action.source, `${path}.source`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
  };
}

export function parseDashEnergyRecoveryActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): DashEnergyRecoveryActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([...ACTION_META_FIELDS, 'energyNum', 'canRecoverWhenOverdraft']),
    path,
  );
  return {
    kind: 'dashEnergyRecovery',
    amount: parseScalarSource(action.energyNum, `${path}.energyNum`, inheritedBlackboard),
    canRecoverWhenOverdraft: requireBoolean(
      action.canRecoverWhenOverdraft,
      `${path}.canRecoverWhenOverdraft`,
    ),
  };
}

export function parseBattleDetailRecordActionSource(
  value: unknown,
  path: string,
): BattleDetailRecordActionSource {
  const action = requireRecord(value, path);
  requireExactFields(action, new Set([...ACTION_META_FIELDS, 'recordType']), path);
  const recordType = action.recordType;
  if (recordType !== 'Dodge' && recordType !== 1)
    throw new Error(`${path}.recordType: unsupported value ${JSON.stringify(recordType)}`);
  return { kind: 'recordPerfectDodge' };
}

/** 严格读取 GainBreakingAttackAtb 的完整 1.4.4 载荷。 */
export function parseFinisherSpGainActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): FinisherSpGainActionSource {
  const action = requireRecord(value, path);
  requireExactFields(action, new Set([...ACTION_META_FIELDS, 'source', 'target', 'factor']), path);
  const factor = requireRecord(action.factor, `${path}.factor`);
  requireExactFields(
    factor,
    new Set(['useBlackboardKey', 'value', 'blackboardKey']),
    `${path}.factor`,
  );
  return {
    kind: 'finisherSpGain',
    source: parseTargetReferenceSource(action.source, `${path}.source`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    factor: parseScalarSource(factor, `${path}.factor`, inheritedBlackboard),
  };
}

/** TimedMarker 的计时基准属于原生语义，不能在单敌人投影中丢失。 */
export function parseTimedMarkerApplicationSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): TimedMarkerApplicationSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'targetSettings',
      'markerId',
      'duration',
      'autoFinishByAction',
      'useTimeDilationDt',
    ]),
    path,
  );
  return {
    kind: 'timedMarkerApplication',
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    marker: parseStringScalarSource(action.markerId, `${path}.markerId`),
    duration: parseScalarSource(action.duration, `${path}.duration`, inheritedBlackboard),
    autoFinishByAction: requireBoolean(action.autoFinishByAction, `${path}.autoFinishByAction`),
    useTimeDilationDeltaTime: requireBoolean(action.useTimeDilationDt, `${path}.useTimeDilationDt`),
  };
}

export function parseGlobalCooldownApplicationSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): GlobalCooldownApplicationSource {
  const action = requireRecord(value, path);
  requireExactFields(action, new Set([...ACTION_META_FIELDS, 'target', 'buffId', 'cdTime']), path);
  return {
    kind: 'globalCooldownApplication',
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    buffId: requireNonEmptyString(action.buffId, `${path}.buffId`),
    duration: parseScalarSource(action.cdTime, `${path}.cdTime`, inheritedBlackboard),
  };
}

export function parseSkillCooldownMutationActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): SkillCooldownMutationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'target',
      'useSkillType',
      'skillTypeMask',
      'skillId',
      'functionType',
      'isPercentage',
      'value',
    ]),
    path,
  );
  const useSkillType = requireBoolean(action.useSkillType, `${path}.useSkillType`);
  const skillType = {
    NormalAttack: 'basicAttack',
    NormalSkill: 'battleSkill',
    ComboSkill: 'comboSkill',
    UltimateSkill: 'ultimate',
    BreakingAttack: 'finisher',
  }[String(action.skillTypeMask)] as
    'basicAttack' | 'battleSkill' | 'comboSkill' | 'ultimate' | 'finisher' | undefined;
  const functionType = String(action.functionType);
  if (functionType !== 'Set' && functionType !== 'Reduce') {
    throw new Error(
      `${path}.functionType: unsupported value ${JSON.stringify(action.functionType)}`,
    );
  }
  return {
    kind: 'skillCooldownMutation',
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    skill: useSkillType
      ? {
          kind: 'type',
          skillType:
            skillType ??
            (() => {
              throw new Error(
                `${path}.skillTypeMask: unsupported value ${JSON.stringify(action.skillTypeMask)}`,
              );
            })(),
        }
      : { kind: 'id', skillId: requireNonEmptyString(action.skillId, `${path}.skillId`) },
    operation: functionType === 'Set' ? 'set' : 'reduce',
    basis: requireBoolean(action.isPercentage, `${path}.isPercentage`)
      ? 'baseDurationRatio'
      : 'absoluteSeconds',
    value: parseScalarSource(action.value, `${path}.value`, inheritedBlackboard),
  };
}
