import {
  parseBlackboardAssignmentsSource,
  type BlackboardAssignmentSource,
} from './assignments.ts';
import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNativeEnum,
  requireNonEmptyString,
  requireRecord,
  requireString,
} from './primitives.ts';
import {
  parseScalarSource,
  parseStringScalarSource,
  type BlackboardLevelValues,
  type ScalarSource,
  type StringScalarSource,
} from './scalar.ts';
import {
  parseAdvancedDirectionSource,
  parseQuaternionSource,
  parseVector3Source,
  type AdvancedDirectionSource,
  type QuaternionSource,
  type Vector3Source,
} from './spatial.ts';
import { readMountPoint } from './spatialEnums.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import { readDirectionType } from './targetEnums.ts';

const ACTION_META_FIELDS = [
  '$type',
  'isEnable',
  'priorityLevel',
  'priorityOffset',
  'serverActionIndex',
];

export interface ProjectileSkillCallbackSource {
  readonly event: 'block' | 'finish' | 'hit' | 'reach';
  readonly enabled: boolean;
  /** 关闭的槽位也可能残留非空 ID；引用闭包不得因此跟随它。 */
  readonly skillId: string;
}

export interface ProjectilePresetPointSource {
  readonly key: string;
  readonly point: TargetReferenceSource;
}

/** 原生 LaunchProjectile.Data 使用的模式；只接收导出层已还原的枚举名称。 */
export type ProjectileTargetFilterModeSource = 'None' | 'OnlyHit' | 'NeverHit';

// 发射投射物的元数据常量表，不按声明顺序推断枚举值。
const PROJECTILE_TARGET_FILTER_MODES = new Map<number, ProjectileTargetFilterModeSource>([
  [0, 'None'],
  [1, 'OnlyHit'],
  [2, 'NeverHit'],
]);

export interface ProjectileLaunchActionSource {
  readonly kind: 'projectileLaunch';
  readonly projectileId: string;
  readonly projectileSkillId: string;
  readonly projectileSource: TargetReferenceSource;
  readonly syncTimeScale: boolean;
  readonly assignBlackboard: boolean;
  readonly assignEntityBlackboard: boolean;
  readonly assignments: readonly BlackboardAssignmentSource[];
  readonly emitPosition: TargetReferenceSource;
  readonly emitMountPoint: string;
  readonly useWeaponMountPoint: boolean;
  readonly weaponIndex: number;
  /** WeaponMountPoint 的原生表示；尚未取得该独立枚举的名称映射。 */
  readonly weaponMountPoint: string | number;
  readonly overrideEmitBone: boolean;
  readonly emitPositionFixedOffset: Vector3Source;
  readonly emitPositionForwardMode: string;
  readonly emitPositionRandomOffset: Vector3Source;
  readonly target: TargetReferenceSource;
  readonly targetFilterMode: ProjectileTargetFilterModeSource;
  /** 旧结构没有过滤字段组时为 null；新结构即使关闭过滤也保留序列化配置。 */
  readonly targetFilterSettings: TargetReferenceSource | null;
  readonly alsoLaunchToHittableTarget: boolean;
  readonly overrideHitBone: boolean;
  readonly hitMountPoint: string;
  readonly hitBoneFixedOffset: Vector3Source;
  readonly hitBoneForwardMode: string;
  readonly hitBoneRandomOffset: Vector3Source;
  readonly presetPoints: readonly ProjectilePresetPointSource[];
  readonly callbacks: readonly ProjectileSkillCallbackSource[];
}

export interface AbilityEntitySpawnActionSource {
  readonly kind: 'abilityEntitySpawn';
  readonly abilityEntityId: string;
  readonly setSource: boolean;
  readonly sourceType: string;
  readonly sourceContextKey: string;
  readonly setTarget: boolean;
  /** 即使 setTarget=false，也保留序列化目标，不能伪装成字段不存在。 */
  readonly target: TargetReferenceSource;
  readonly bornAt: TargetReferenceSource;
  readonly bornMountPoint: string;
  readonly bornPositionOffset: Vector3Source;
  readonly checkNavmeshAreaName: boolean;
  readonly forbiddenAreaNames: readonly string[];
  readonly attachToClosestMeshPoint: boolean;
  readonly rotateYFromBoneToCurrentPosition: boolean;
  readonly bornRotation: string;
  readonly bornRotationContextTarget: string;
  readonly useAdvancedDirection: boolean;
  readonly advancedDirection: AdvancedDirectionSource;
  readonly clampToXZPlane: boolean;
  readonly applyBornRotationOffset: boolean;
  readonly bornRotationOffset: QuaternionSource;
  readonly assignEntityBlackboard: boolean;
  readonly assignments: readonly BlackboardAssignmentSource[];
  readonly assignBlackboard: boolean;
  readonly skillId: string;
  /** 原生只传给实体子技能的 CastSkillOptions，不控制实体生成数量。 */
  readonly allowMultiInputTarget: boolean;
  readonly overrideDuration: boolean;
  readonly duration: ScalarSource;
  readonly saveToContext: boolean;
  readonly contextKey: string;
  readonly pauseEffectOnEnd: boolean;
  readonly inheritSourceSkillCastId: boolean;
  readonly dieWhenSourceDies: boolean;
  readonly forceSyncInit: boolean;
  readonly dieOnEnd: boolean;
}

export interface AbilityEntityDurationMutationActionSource {
  readonly kind: 'abilityEntityDurationMutation';
  readonly setMultipleTargets: boolean;
  readonly target: TargetReferenceSource;
  readonly actionTargetType: string;
  readonly targetContextKey: string;
  readonly operation: string;
  readonly value: ScalarSource;
}

export interface AbilityEntityTargetMutationActionSource {
  readonly kind: 'abilityEntityTargetMutation';
  readonly target: TargetReferenceSource;
}

export function parseAbilityEntityTargetMutationActionSource(
  value: unknown,
  path: string,
): AbilityEntityTargetMutationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(action, new Set([...ACTION_META_FIELDS, 'targetSettings']), path);
  return {
    kind: 'abilityEntityTargetMutation',
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
  };
}

function parseAbilityEntityDurationTargetSource(
  value: unknown,
  path: string,
): TargetReferenceSource {
  const target = requireRecord(value, path);
  const compactFields = new Set([
    'advancedDirection',
    'centerToGround',
    'centerType',
    'enableAdvancedDirection',
    'selectorDirection',
    'selectorOwner',
    'target',
    'targetSource',
  ]);
  if (
    Object.keys(target).length === compactFields.size &&
    Object.keys(target).every(field => compactFields.has(field))
  ) {
    // setMultipleTarget=false 的 InputTarget 样本只序列化 TargetSettings 的固定外壳；补回
    // TargetReference 的空选择器默认值后仍交给同一个严格解析器校验全部实存字段。
    return parseTargetReferenceSource(
      {
        ...target,
        targetGroupKey: '',
        ownerContextKey: '',
        centerContextKey: '',
        selectorData: { validatorData: [], postProcessorData: [] },
        targetContextKey: '',
      },
      path,
    );
  }
  return parseTargetReferenceSource(target, path);
}

export function parseAbilityEntityDurationMutationActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): AbilityEntityDurationMutationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'setMultipleTarget',
      'targetSettings',
      'actionTargetType',
      'targetContextKey',
      'operation',
      'value',
    ]),
    path,
  );
  return {
    kind: 'abilityEntityDurationMutation',
    setMultipleTargets: requireBoolean(action.setMultipleTarget, `${path}.setMultipleTarget`),
    target: parseAbilityEntityDurationTargetSource(action.targetSettings, `${path}.targetSettings`),
    actionTargetType: requireNonEmptyString(action.actionTargetType, `${path}.actionTargetType`),
    targetContextKey: requireString(action.targetContextKey, `${path}.targetContextKey`),
    operation: requireNonEmptyString(action.operation, `${path}.operation`),
    value: parseScalarSource(action.value, `${path}.value`, inheritedBlackboard),
  };
}

export interface SkillCastActionSource {
  readonly kind: 'skillCast';
  readonly caster: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly skillId: StringScalarSource;
  readonly skipApplyCost: boolean;
  readonly inheritSourceSkillCastId: boolean;
  /** 新版延迟请求先验证目标技能可施放，成功后才允许中断当前技能。 */
  readonly interruptCurrentSkillOnlyWhenTargetCastable: boolean;
}

export function parseProjectileLaunchActionSource(
  value: unknown,
  path: string,
): ProjectileLaunchActionSource {
  const action = requireRecord(value, path);
  // 旧结构无此字段组；当前结构的
  // None 不解析过滤目标，false 不额外发射。只允许整组缺失，不能吞掉残缺的新数据。
  const targetControlFields = [
    'targetFilterMode',
    'targetFilterSettings',
    'alsoLaunchToHittableTarget',
  ];
  const hasTargetControls = targetControlFields.some(field => Object.hasOwn(action, field));
  if (hasTargetControls) {
    for (const field of targetControlFields) {
      if (!Object.hasOwn(action, field)) throw new Error(`${path}.${field}: missing field`);
    }
  }
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'projectileId',
      'projectileSkillId',
      'projectileSource',
      'syncTimeScale',
      'assignEntityBlackboard',
      'assignPairs',
      'assignBlackboard',
      'emitPos',
      'emitMountPoint',
      'useWeaponMp',
      'weaponIndex',
      'weaponMp',
      'overrideEmitBone',
      'emitPosFixedOffset',
      'emitPosOffsetForward',
      'emitPosRandomOffset',
      'targetSettings',
      ...(hasTargetControls ? targetControlFields : []),
      'overrideHitBone',
      'hitMountPoint',
      'hitBoneFixedOffset',
      'hitBoneOffsetForward',
      'hitBoneRandomOffset',
      'presetPoints',
      'castSkillOnBlock',
      'skillIdOnBlock',
      'castSkillOnFinish',
      'skillIdOnFinish',
      'castSkillOnHit',
      'castSkillOnReach',
      'skillIdOnReach',
    ]),
    path,
  );
  const assignEntityBlackboard = requireBoolean(
    action.assignEntityBlackboard,
    `${path}.assignEntityBlackboard`,
  );
  const projectileSkillId = requireString(action.projectileSkillId, `${path}.projectileSkillId`);
  const callbackFields = [
    ['block', 'castSkillOnBlock', 'skillIdOnBlock'],
    ['finish', 'castSkillOnFinish', 'skillIdOnFinish'],
    ['hit', 'castSkillOnHit', 'projectileSkillId'],
    ['reach', 'castSkillOnReach', 'skillIdOnReach'],
  ] as const;
  const callbacks = callbackFields.map(([event, enabledField, skillField]) => {
    const enabled = requireBoolean(action[enabledField], `${path}.${enabledField}`);
    const skillId =
      skillField === 'projectileSkillId'
        ? projectileSkillId
        : requireString(action[skillField], `${path}.${skillField}`);
    return { event, enabled, skillId };
  });
  const targetFilterMode = hasTargetControls
    ? requireNativeEnum(
        action.targetFilterMode,
        PROJECTILE_TARGET_FILTER_MODES,
        `${path}.targetFilterMode`,
      )
    : 'None';
  return {
    kind: 'projectileLaunch',
    projectileId: requireNonEmptyString(action.projectileId, `${path}.projectileId`),
    projectileSkillId,
    projectileSource: parseTargetReferenceSource(
      action.projectileSource,
      `${path}.projectileSource`,
    ),
    syncTimeScale: requireBoolean(action.syncTimeScale, `${path}.syncTimeScale`),
    assignBlackboard: requireBoolean(action.assignBlackboard, `${path}.assignBlackboard`),
    assignEntityBlackboard,
    assignments: parseBlackboardAssignmentsSource(action.assignPairs, `${path}.assignPairs`, {
      enabled: assignEntityBlackboard,
    }),
    emitPosition: parseTargetReferenceSource(action.emitPos, `${path}.emitPos`),
    emitMountPoint: readMountPoint(action.emitMountPoint, `${path}.emitMountPoint`),
    useWeaponMountPoint: requireBoolean(action.useWeaponMp, `${path}.useWeaponMp`),
    weaponIndex: requireInteger(action.weaponIndex, `${path}.weaponIndex`),
    weaponMountPoint: parseOpaqueWeaponMountPoint(action.weaponMp, `${path}.weaponMp`),
    overrideEmitBone: requireBoolean(action.overrideEmitBone, `${path}.overrideEmitBone`),
    emitPositionFixedOffset: parseVector3Source(
      action.emitPosFixedOffset,
      `${path}.emitPosFixedOffset`,
    ),
    emitPositionForwardMode: readDirectionType(
      action.emitPosOffsetForward,
      `${path}.emitPosOffsetForward`,
    ),
    emitPositionRandomOffset: parseVector3Source(
      action.emitPosRandomOffset,
      `${path}.emitPosRandomOffset`,
    ),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    targetFilterMode,
    targetFilterSettings: hasTargetControls
      ? parseTargetReferenceSource(action.targetFilterSettings, `${path}.targetFilterSettings`)
      : null,
    alsoLaunchToHittableTarget: hasTargetControls
      ? requireBoolean(action.alsoLaunchToHittableTarget, `${path}.alsoLaunchToHittableTarget`)
      : false,
    overrideHitBone: requireBoolean(action.overrideHitBone, `${path}.overrideHitBone`),
    hitMountPoint: readMountPoint(action.hitMountPoint, `${path}.hitMountPoint`),
    hitBoneFixedOffset: parseVector3Source(action.hitBoneFixedOffset, `${path}.hitBoneFixedOffset`),
    hitBoneForwardMode: readDirectionType(
      action.hitBoneOffsetForward,
      `${path}.hitBoneOffsetForward`,
    ),
    hitBoneRandomOffset: parseVector3Source(
      action.hitBoneRandomOffset,
      `${path}.hitBoneRandomOffset`,
    ),
    presetPoints: requireArray(action.presetPoints, `${path}.presetPoints`).map(
      (rawPreset, index) => parseProjectilePresetPoint(rawPreset, `${path}.presetPoints[${index}]`),
    ),
    callbacks,
  };
}

function parseOpaqueWeaponMountPoint(value: unknown, path: string): string | number {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  throw new Error(`${path}: expected a non-empty enum name or integer native value`);
}

export function parseAbilityEntitySpawnActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): AbilityEntitySpawnActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'abilityEntityId',
      'setAbilityEntitySource',
      'abilityEntitySource',
      'abilityEntitySourceContextKey',
      'setAbilityEntityTarget',
      'abilityEntityTarget',
      'bornAt',
      'bornMountPoint',
      'bornPosOffset',
      'checkNavmeshAreaName',
      'forbiddenAreaNames',
      'attachToClosestMeshPoint',
      'yRotateFromBoneToCurPos',
      'bornRotation',
      'bornRotationContextTarget',
      'useAdvancedDirectionSetting',
      'advancedDirectionSetting',
      'clampToXZPlane',
      'applyBornRotationOffset',
      'bornRotationOffset',
      'assignEntityBlackboard',
      'assignPairs',
      'assignBlackboard',
      'abilityEntitySkillId',
      ...(Object.hasOwn(action, 'allowMultiInputTarget') ? ['allowMultiInputTarget'] : []),
      'overrideDuration',
      'duration',
      'saveToContext',
      'contextKey',
      'pauseEffectOnEnd',
      'inheritSourceSkillCastId',
      'dieWhenSourceDie',
      'forceSyncInit',
      'dieOnEnd',
    ]),
    path,
  );
  const assignEntityBlackboard = requireBoolean(
    action.assignEntityBlackboard,
    `${path}.assignEntityBlackboard`,
  );
  return {
    kind: 'abilityEntitySpawn',
    abilityEntityId: requireNonEmptyString(action.abilityEntityId, `${path}.abilityEntityId`),
    setSource: requireBoolean(action.setAbilityEntitySource, `${path}.setAbilityEntitySource`),
    sourceType: requireNonEmptyString(action.abilityEntitySource, `${path}.abilityEntitySource`),
    sourceContextKey: requireString(
      action.abilityEntitySourceContextKey,
      `${path}.abilityEntitySourceContextKey`,
    ),
    setTarget: requireBoolean(action.setAbilityEntityTarget, `${path}.setAbilityEntityTarget`),
    target: parseTargetReferenceSource(action.abilityEntityTarget, `${path}.abilityEntityTarget`),
    bornAt: parseTargetReferenceSource(action.bornAt, `${path}.bornAt`),
    bornMountPoint: requireNonEmptyString(action.bornMountPoint, `${path}.bornMountPoint`),
    bornPositionOffset: parseVector3Source(action.bornPosOffset, `${path}.bornPosOffset`),
    checkNavmeshAreaName: requireBoolean(
      action.checkNavmeshAreaName,
      `${path}.checkNavmeshAreaName`,
    ),
    forbiddenAreaNames: requireArray(action.forbiddenAreaNames, `${path}.forbiddenAreaNames`).map(
      (item, index) => requireString(item, `${path}.forbiddenAreaNames[${index}]`),
    ),
    attachToClosestMeshPoint: requireBoolean(
      action.attachToClosestMeshPoint,
      `${path}.attachToClosestMeshPoint`,
    ),
    rotateYFromBoneToCurrentPosition: requireBoolean(
      action.yRotateFromBoneToCurPos,
      `${path}.yRotateFromBoneToCurPos`,
    ),
    bornRotation: requireNonEmptyString(action.bornRotation, `${path}.bornRotation`),
    bornRotationContextTarget: requireString(
      action.bornRotationContextTarget,
      `${path}.bornRotationContextTarget`,
    ),
    useAdvancedDirection: requireBoolean(
      action.useAdvancedDirectionSetting,
      `${path}.useAdvancedDirectionSetting`,
    ),
    advancedDirection: parseAdvancedDirectionSource(
      action.advancedDirectionSetting,
      `${path}.advancedDirectionSetting`,
    ),
    clampToXZPlane: requireBoolean(action.clampToXZPlane, `${path}.clampToXZPlane`),
    applyBornRotationOffset: requireBoolean(
      action.applyBornRotationOffset,
      `${path}.applyBornRotationOffset`,
    ),
    bornRotationOffset: parseQuaternionSource(
      action.bornRotationOffset,
      `${path}.bornRotationOffset`,
    ),
    assignEntityBlackboard,
    assignments: parseBlackboardAssignmentsSource(action.assignPairs, `${path}.assignPairs`, {
      enabled: assignEntityBlackboard,
    }),
    assignBlackboard: requireBoolean(action.assignBlackboard, `${path}.assignBlackboard`),
    skillId: requireString(action.abilityEntitySkillId, `${path}.abilityEntitySkillId`),
    // 旧结构没有此字段，沿用默认施法选项；新结构即使为 false 也严格校验类型。
    allowMultiInputTarget: Object.hasOwn(action, 'allowMultiInputTarget')
      ? requireBoolean(action.allowMultiInputTarget, `${path}.allowMultiInputTarget`)
      : false,
    overrideDuration: requireBoolean(action.overrideDuration, `${path}.overrideDuration`),
    duration: parseScalarSource(action.duration, `${path}.duration`, inheritedBlackboard),
    saveToContext: requireBoolean(action.saveToContext, `${path}.saveToContext`),
    contextKey: requireString(action.contextKey, `${path}.contextKey`),
    pauseEffectOnEnd: requireBoolean(action.pauseEffectOnEnd, `${path}.pauseEffectOnEnd`),
    inheritSourceSkillCastId: requireBoolean(
      action.inheritSourceSkillCastId,
      `${path}.inheritSourceSkillCastId`,
    ),
    dieWhenSourceDies: requireBoolean(action.dieWhenSourceDie, `${path}.dieWhenSourceDie`),
    forceSyncInit: requireBoolean(action.forceSyncInit, `${path}.forceSyncInit`),
    dieOnEnd: requireBoolean(action.dieOnEnd, `${path}.dieOnEnd`),
  };
}

export function parseSkillCastActionSource(value: unknown, path: string): SkillCastActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'caster',
      'target',
      'skillId',
      'skipApplyCost',
      'inheritSourceSkillCastId',
      ...('interruptCurSkillOnlyWhenTargetCastable' in action
        ? ['interruptCurSkillOnlyWhenTargetCastable']
        : []),
    ]),
    path,
  );
  const interruptCurrentSkillOnlyWhenTargetCastable =
    'interruptCurSkillOnlyWhenTargetCastable' in action
      ? requireBoolean(
          action.interruptCurSkillOnlyWhenTargetCastable,
          `${path}.interruptCurSkillOnlyWhenTargetCastable`,
        )
      : false;
  return {
    kind: 'skillCast',
    caster: parseTargetReferenceSource(action.caster, `${path}.caster`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    skillId: parseStringScalarSource(action.skillId, `${path}.skillId`),
    skipApplyCost: requireBoolean(action.skipApplyCost, `${path}.skipApplyCost`),
    inheritSourceSkillCastId: requireBoolean(
      action.inheritSourceSkillCastId,
      `${path}.inheritSourceSkillCastId`,
    ),
    interruptCurrentSkillOnlyWhenTargetCastable,
  };
}

function parseProjectilePresetPoint(value: unknown, path: string): ProjectilePresetPointSource {
  const preset = requireRecord(value, path);
  requireExactFields(preset, new Set(['presetPointKey', 'presetPoint']), path);
  return {
    key: requireNonEmptyString(preset.presetPointKey, `${path}.presetPointKey`),
    point: parseTargetReferenceSource(preset.presetPoint, `${path}.presetPoint`),
  };
}
