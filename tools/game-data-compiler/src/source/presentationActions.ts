import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNativeActionPriority,
  requireNamedOrInteger,
  requireNumber,
  requireRecord,
  requireString,
  nativeActionName,
} from './primitives.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseTimeDilationCurveKeys } from './timeDilationActions.ts';
import {
  parseBuffApplicationActionSource,
  parseAdvancedBuffFinishActionSource,
  type BuffApplicationActionSource,
} from './buffActions.ts';
import { parseConditionLeafSource, type NativeConditionSource } from './condition.ts';
import { parseTargetGroupActionSource } from './targetGroup.ts';
import { parseFinishOwnerActionSource } from './lifecycleActions.ts';

export interface PlaySoundActionSource {
  readonly kind: 'playSound';
  readonly soundEvent: string;
  readonly stopOnEnd: boolean;
  readonly stopFadeDurationMilliseconds: number;
  readonly canInterruptTimeMilliseconds: number;
  readonly interruptFadeDurationMilliseconds: number;
  readonly jumpToWhenPlayMilliseconds: number;
  readonly useTemporaryEmitter: boolean;
  readonly target: TargetReferenceSource;
  readonly mountPoint: string | number;
  readonly followMountPoint: boolean;
  readonly useWeaponMountPoint: boolean;
  readonly weaponIndex: number;
  readonly weaponMountPoint: string | number;
  readonly useTimeDilationPauseAndSeek: boolean;
  readonly timeDilationPauseThreshold: number;
  readonly timeDilationSeekThreshold: number;
  readonly timeDilationFadeOutDurationMilliseconds: number;
  readonly timeDilationFadeInDurationMilliseconds: number;
}

export interface SkillTypeMutationActionSource {
  readonly kind: 'skillTypeMutation';
  readonly target: TargetReferenceSource;
  readonly skillId: string;
  readonly nativeSkillType: import('../../../../packages/game-data-contract/src/index.ts').NativeSkillType;
}

export interface DebugPrintActionSource {
  readonly kind: 'debugPrint';
  readonly logType: string | number;
  readonly target: TargetReferenceSource;
  readonly color: {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;
  };
  readonly blackboardKey: string;
  readonly identifier: string;
}

export interface EffectActionSource {
  readonly kind: 'effect';
  readonly target: TargetReferenceSource;
  readonly effectSource: TargetReferenceSource;
  readonly effectName: string;
}

function isPlainTargetReference(reference: TargetReferenceSource, targetSource: string): boolean {
  return (
    reference.targetSource === targetSource &&
    reference.targetGroupKey === '' &&
    reference.selectorOwner === 'ActionOwner' &&
    reference.ownerContextKey === '' &&
    reference.centerType === 'ActionSource' &&
    reference.centerContextKey === '' &&
    !reference.centerToGround &&
    reference.target === 'ActionSource' &&
    reference.targetContextKey === '' &&
    !reference.enableAdvancedDirection &&
    reference.selectorDirection === 'SourceForward' &&
    reference.finderType === null &&
    reference.validatorTypes.length === 0 &&
    reference.postProcessorTypes.length === 0
  );
}

/** 保留原生输入限制分支，不能先认定为纯表现；运行时投影仍待消费端取证。 */
export interface HideUiActionSource {
  readonly kind: 'hideUi';
  readonly onlyBlockInput: boolean;
}

export type CameraPresentationActionSource =
  HideUiActionSource | OtherCameraPresentationActionSource;

export interface OtherCameraPresentationActionSource {
  readonly kind:
    | 'cameraImpulse'
    | 'cameraControlState'
    | 'inheritedCameraControlState'
    | 'dynamicCameraControlState'
    | 'cameraRotate'
    | 'animatedCamera'
    | 'ultimateShow'
    | 'weaponVisibility'
    | 'weaponAnimation'
    | 'animatorParameter'
    | 'igniteBuffText'
    | 'immuneText'
    | 'weaponMountPoint'
    | 'voiceTrigger'
    | 'voiceInterrupt'
    | 'overrideCameraFollow'
    | 'temporaryUnlock'
    | 'lockCameraAim'
    | 'actorVisibility'
    | 'modelIntervalCheck'
    | 'operatorUiEvent'
    | 'specificLayerChangeNoop'
    | 'forceTargetInFightOmitted'
    | 'interruptHenshinListenerOmitted'
    | 'cutsceneCleanupListenerOmitted'
    | 'strafeMode'
    | 'bombClear'
    | 'skillTypeMutation'
    | 'passiveUiValue'
    | 'animatorAimOffset'
    | 'squadTeleportOmitted'
    | 'perfectDodgeAnimationOmitted'
    | 'firstDashAnimationParameterOmitted'
    | 'typhoeaHudHint';
  readonly readBlackboardKeys?: readonly string[];
  readonly target?: TargetReferenceSource;
  readonly skillId?: string;
  readonly nativeSkillType?: import('../../../../packages/game-data-contract/src/index.ts').NativeSkillType;
  readonly value?: ScalarSource;
}

/** 汤芙亚专属 HUD 只订阅箭矢/能量 Buff；Buff 本身仍由正式战斗运行时维护。 */
export function parseTyphoeaHudHintActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'arrowBuffId',
      'energyBuffId',
    ]),
    path,
  );
  requireNonEmptyString(action.arrowBuffId, `${path}.arrowBuffId`);
  requireNonEmptyString(action.energyBuffId, `${path}.energyBuffId`);
  return { kind: 'typhoeaHudHint' };
}

/** 只驱动 Animator 的瞄准偏移层；完整校验字段后在无表现模拟中省略。 */
export function parseAnimatorAimOffsetActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'aimOffsetType',
      'aimXParam',
      'aimYParam',
      'layerName',
      'maxHorizontalAngle',
      'maxVerticalAngle',
      'smoothSpeed',
      'inheritAimParameters',
      'resetOnEnd',
      'blendIn',
      'blendOut',
      'duration',
    ]),
    path,
  );
  requireNonEmptyString(action.aimOffsetType, `${path}.aimOffsetType`);
  requireInteger(action.aimXParam, `${path}.aimXParam`);
  requireInteger(action.aimYParam, `${path}.aimYParam`);
  requireNonEmptyString(action.layerName, `${path}.layerName`);
  for (const key of [
    'maxHorizontalAngle',
    'maxVerticalAngle',
    'smoothSpeed',
    'blendIn',
    'blendOut',
    'duration',
  ] as const) {
    requireNumber(action[key], `${path}.${key}`);
  }
  requireBoolean(action.inheritAimParameters, `${path}.inheritAimParameters`);
  requireBoolean(action.resetOnEnd, `${path}.resetOnEnd`);
  return { kind: 'animatorAimOffset' };
}

/** 队伍传送只修正空间位置；零距离模型中不改变伤害、资源、冷却或 Buff。 */
export function parseTryToTeleportSquadActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  requireExactFields(
    requireRecord(value, path),
    new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex']),
    path,
  );
  return { kind: 'squadTeleportOmitted' };
}

/**
 * 选择前闪、后闪或侧闪动画，并可把角色表现强制留在战斗待机；零空间战斗模拟不消费动画状态。
 * 字段仍完整校验，防止以后原生动作增加影响技能、Buff 或资源的参数却被静默忽略。
 */
export function parsePlayPerfectDodgeAnimActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'forceFightIdle',
      'forceFightIdleDuration',
    ]),
    path,
  );
  requireBoolean(action.forceFightIdle, `${path}.forceFightIdle`);
  requireNumber(action.forceFightIdleDuration, `${path}.forceFightIdleDuration`);
  return { kind: 'perfectDodgeAnimationOmitted' };
}

/**
 * 极限闪避成功链把首次 Dash 动画参数改为 false。该参数只被 IFix 表现逻辑消费，
 * 零空间模拟没有动画状态；仍严格限制字段和值，避免把未来新增的战斗参数静默裁掉。
 */
export function parseSetFirstDashParamActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'isFirstDash',
    ]),
    path,
  );
  if (requireBoolean(action.isFirstDash, `${path}.isFirstDash`))
    throw new Error(`${path}.isFirstDash: true branch has not been audited`);
  return { kind: 'firstDashAnimationParameterOmitted' };
}

/**
 * 1.4.4 ChangeSpecificLayerAction 的两个空 LayerMask 都会被 _GetLayer 解析为 -1，
 * ExecuteInternal 随即成功返回，不写入目标 GameObject.layer。
 */
export function parseNoopSpecificLayerChangeActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'targetSettings',
      'originLayerMask',
      'targetLayerMask',
    ]),
    path,
  );
  parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`);
  const originLayerMask = requireRecord(action.originLayerMask, `${path}.originLayerMask`);
  const targetLayerMask = requireRecord(action.targetLayerMask, `${path}.targetLayerMask`);
  requireExactFields(originLayerMask, new Set(), `${path}.originLayerMask`);
  requireExactFields(targetLayerMask, new Set(), `${path}.targetLayerMask`);
  return { kind: 'specificLayerChangeNoop' };
}

/**
 * ForceTargetInFightAction 只改变敌方 AI/交战状态。Endaxis 的场景在技能执行前已经绑定战斗，
 * 且唯一木桩没有主动 AI；这里只接纳庄方宜已审计的施法者 Source -> Buff Owner 目标形状。
 */
export function parseForceTargetInFightActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'attacker',
      'target',
    ]),
    path,
  );
  const attacker = parseTargetReferenceSource(action.attacker, `${path}.attacker`);
  const target = parseTargetReferenceSource(action.target, `${path}.target`);
  if (!isPlainTargetReference(attacker, 'Source') || !isPlainTargetReference(target, 'Owner')) {
    throw new Error(`${path}: unsupported ForceTargetInFight attacker/target projection`);
  }
  return { kind: 'forceTargetInFightOmitted' };
}

/** 当前模拟不产生外部形态中断或受控标签；严格保留其唯一“结束自身形态 Buff”形状。 */
export function parseInterruptHenshinTagListenerActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'listenerType',
      'predefinedQuery',
      'customQuery',
      'executeOnMatch',
      'executeAction',
    ]),
    path,
  );
  if (
    action.listenerType === 'CustomQuery' &&
    action.predefinedQuery === 'None' &&
    requireBoolean(action.executeOnMatch, `${path}.executeOnMatch`)
  ) {
    return parseArcaneCutsceneCleanupTagListener(action, path, inheritedBlackboard);
  }
  const predefinedQuery = requireString(action.predefinedQuery, `${path}.predefinedQuery`);
  if (
    requireString(action.listenerType, `${path}.listenerType`) !== 'PredefinedQuery' ||
    (predefinedQuery !== 'InterruptHenshin' && predefinedQuery !== 'InImmobilized') ||
    !requireBoolean(action.executeOnMatch, `${path}.executeOnMatch`)
  ) {
    throw new Error(`${path}: unsupported TagQueryListener projection`);
  }
  const customQuery = requireRecord(action.customQuery, `${path}.customQuery`);
  requireExactFields(customQuery, new Set(['queryType', 'tags']), `${path}.customQuery`);
  if (
    requireString(customQuery.queryType, `${path}.customQuery.queryType`) !== 'HasAny' ||
    requireArray(customQuery.tags, `${path}.customQuery.tags`).length !== 0
  ) {
    throw new Error(`${path}: predefined listener must have an empty custom query`);
  }
  const sequence = requireRecord(action.executeAction, `${path}.executeAction`);
  requireExactFields(
    sequence,
    new Set(['actionData', 'onlyExecuteWhenSourceIsMainChar', 'onlyExecuteWhenSourceIsGuard']),
    `${path}.executeAction`,
  );
  if (
    requireBoolean(
      sequence.onlyExecuteWhenSourceIsMainChar,
      `${path}.executeAction.onlyExecuteWhenSourceIsMainChar`,
    ) ||
    requireBoolean(
      sequence.onlyExecuteWhenSourceIsGuard,
      `${path}.executeAction.onlyExecuteWhenSourceIsGuard`,
    )
  ) {
    throw new Error(`${path}: guarded InterruptHenshin listener is unsupported`);
  }
  const children = requireArray(sequence.actionData, `${path}.executeAction.actionData`);
  if (children.length !== 1) throw new Error(`${path}: expected one predefined-listener action`);
  const finish = parseAdvancedBuffFinishActionSource(
    children[0],
    `${path}.executeAction.actionData[0]`,
    inheritedBlackboard,
  );
  if (
    finish.kind !== 'buffFinishByQuery' ||
    finish.settings.checkType !== 'Id' ||
    finish.settings.buffIds.length !== 1 ||
    finish.settings.buffIds[0] === '' ||
    finish.settings.tagQuery.tagIds.length !== 0 ||
    !finish.finishAll ||
    finish.finishLayerCount.blackboardKey !== null ||
    finish.finishLayerCount.value !== 1 ||
    finish.limitSource ||
    finish.isFinishedEarly ||
    finish.isAbsorbed ||
    !isPlainTargetReference(finish.owner, 'Owner') ||
    !isPlainTargetReference(finish.buffSource, 'Source') ||
    !isPlainTargetReference(finish.finishSource, 'Source')
  ) {
    throw new Error(`${path}: unsupported predefined-listener finish action`);
  }
  return { kind: 'interruptHenshinListenerOmitted' };
}

/**
 * 过场/过场切换标签出现时清理 Buff 与召唤物。固定木桩模拟不产生
 * GlobalState/Performance/Cutscene 标签；完整验证清理目标后省略该不可达外部表现生命周期。
 */
// 目前只验证过 Arcane 的清理序列；不能仅凭结构相似扩大省略范围。
function parseArcaneCutsceneCleanupTagListener(
  action: Record<string, unknown>,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): CameraPresentationActionSource {
  const query = requireRecord(action.customQuery, `${path}.customQuery`);
  requireExactFields(query, new Set(['queryType', 'tags']), `${path}.customQuery`);
  const tags = requireArray(query.tags, `${path}.customQuery.tags`).map((item, index) => {
    const tag = requireRecord(item, `${path}.customQuery.tags[${index}]`);
    requireExactFields(tag, new Set(['tagId']), `${path}.customQuery.tags[${index}]`);
    return requireInteger(tag.tagId, `${path}.customQuery.tags[${index}].tagId`);
  });
  if (
    query.queryType !== 'HasAny' ||
    tags.length !== 2 ||
    !tags.includes(1105446346) ||
    !tags.includes(507365453)
  )
    throw new Error(`${path}: unsupported custom TagQueryListener query`);
  const sequence = requireRecord(action.executeAction, `${path}.executeAction`);
  requireExactFields(
    sequence,
    new Set(['actionData', 'onlyExecuteWhenSourceIsMainChar', 'onlyExecuteWhenSourceIsGuard']),
    `${path}.executeAction`,
  );
  if (
    requireBoolean(
      sequence.onlyExecuteWhenSourceIsMainChar,
      `${path}.executeAction.onlyExecuteWhenSourceIsMainChar`,
    ) ||
    requireBoolean(
      sequence.onlyExecuteWhenSourceIsGuard,
      `${path}.executeAction.onlyExecuteWhenSourceIsGuard`,
    )
  )
    throw new Error(`${path}: guarded cutscene cleanup listener is unsupported`);
  const children = requireArray(sequence.actionData, `${path}.executeAction.actionData`);
  if (children.length !== 3) throw new Error(`${path}: expected three cutscene cleanup actions`);
  const find = parseTargetGroupActionSource(
    children[0],
    `${path}.executeAction.actionData[0]`,
    inheritedBlackboard,
  );
  if (
    find?.producerType !== 'FindTargetAction' ||
    find.targetGroupKey !== 'tar' ||
    find.finderType !== 'InFightEnemyFinder' ||
    find.validatorTypes.length !== 0 ||
    find.postProcessorTypes.length !== 0
  )
    throw new Error(`${path}: unsupported cutscene cleanup target search`);
  const finish = parseAdvancedBuffFinishActionSource(
    children[1],
    `${path}.executeAction.actionData[1]`,
    inheritedBlackboard,
  );
  if (
    finish.kind !== 'buffFinishByQuery' ||
    finish.settings.checkType !== 'Id' ||
    finish.settings.buffIds.length === 0 ||
    finish.settings.buffIds.some(id => !id.startsWith('buff_chr_0032_lizhiyan_combo_skill_seal')) ||
    !finish.finishAll ||
    finish.owner.targetSource !== 'Context' ||
    finish.owner.targetGroupKey !== 'tar' ||
    finish.limitSource ||
    finish.isFinishedEarly ||
    finish.isAbsorbed
  )
    throw new Error(`${path}: unsupported cutscene Buff cleanup`);
  const owner = parseFinishOwnerActionSource(children[2], `${path}.executeAction.actionData[2]`);
  if (
    owner.skipDieDisplay ||
    owner.owner.targetSource !== 'InstantSearch' ||
    owner.owner.finderType !== 'OwnerSpawnedEntityFinder' ||
    owner.owner.finderSpawnedObjectType !== 'AbilityEntity' ||
    owner.owner.validatorTagQueries.length !== 1 ||
    owner.owner.validatorTagQueries[0]![0] !== 'HasAny' ||
    owner.owner.validatorTagQueries[0]![1].length !== 1 ||
    owner.owner.validatorTagQueries[0]![1][0] !== -1480463572
  )
    throw new Error(`${path}: unsupported cutscene spawned-entity cleanup`);
  return { kind: 'cutsceneCleanupListenerOmitted' };
}

/** 角色横移/步态/镜头锁定只改变移动表现；字段仍需完整读取。 */
export function parseSetStrafeModeActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'strafeTarget',
      'limitGait',
      'minGait',
      'maxGait',
      'lockToCamera',
      ...('yawOffset' in action ? ['yawOffset'] : []),
    ]),
    path,
  );
  parseTargetReferenceSource(action.strafeTarget, `${path}.strafeTarget`);
  requireBoolean(action.limitGait, `${path}.limitGait`);
  requireString(action.minGait, `${path}.minGait`);
  requireString(action.maxGait, `${path}.maxGait`);
  requireBoolean(action.lockToCamera, `${path}.lockToCamera`);
  // 原生直传移动组件的锁镜头朝向偏移；不改变技能时间轴或战斗数值。
  if ('yawOffset' in action) {
    const yawOffset = requireNumber(action.yawOffset, `${path}.yawOffset`);
    if (!Number.isFinite(yawOffset)) throw new Error(`${path}.yawOffset: expected finite number`);
  }
  return { kind: 'strafeMode' };
}

/** BombClearAction 清理角色手持炸弹状态；Next 时间轴没有炸弹交互对象。 */
export function parseBombClearActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  requireExactFields(
    requireRecord(value, path),
    new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex']),
    path,
  );
  return { kind: 'bombClear' };
}

/**
 * ChangeSkillType 只修改既有技能实例的分类。Next 的内部 CastSkill 按 ID 直接解析技能定义，
 * 不依赖原生 AbilitySystem 的技能分类注册；当前仅省略庄方宜退场技能的 AttachSkill 改写。
 */
export function parseSkillTypeMutationSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
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
      'skillId',
      'skillType',
    ]),
    path,
  );
  const target = parseTargetReferenceSource(action.target, `${path}.target`);
  const skillId = requireRecord(action.skillId, `${path}.skillId`);
  requireExactFields(
    skillId,
    new Set(['useBlackboardKey', 'value', 'blackboardKey']),
    `${path}.skillId`,
  );
  if (
    !isPlainTargetReference(target, 'Owner') ||
    requireBoolean(skillId.useBlackboardKey, `${path}.skillId.useBlackboardKey`) ||
    requireString(skillId.blackboardKey, `${path}.skillId.blackboardKey`) !== ''
  ) {
    throw new Error(`${path}: unsupported ChangeSkillType projection`);
  }
  const nativeSkillTypeByName: Readonly<
    Record<string, import('../../../../packages/game-data-contract/src/index.ts').NativeSkillType>
  > = {
    PassiveSkill: 'passiveSkill',
    Attack: 'attack',
    BreakingAttack: 'breakingAttack',
    NormalSkill: 'normalSkill',
    AttachSkill: 'attachSkill',
    Dodge: 'dodge',
    ComboSkill: 'comboSkill',
    UltimateSkill: 'ultimateSkill',
    ExtraActiveSkill: 'extraActiveSkill',
  };
  const nativeSkillType =
    nativeSkillTypeByName[requireString(action.skillType, `${path}.skillType`)];
  if (nativeSkillType === undefined) throw new Error(`${path}.skillType: unsupported SkillType`);
  return {
    kind: 'skillTypeMutation' as const,
    target,
    skillId: requireNonEmptyString(skillId.value, `${path}.skillId.value`),
    nativeSkillType,
  };
}

/** NotifyCharPassiveUIAction 把求值后的数值送入动作 Owner 的角色被动 UI。 */
export function parseNotifyCharacterPassiveUiActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): CameraPresentationActionSource {
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
      'value',
    ]),
    path,
  );
  const target = parseTargetReferenceSource(action.target, `${path}.target`);
  const scalar = parseScalarSource(action.value, `${path}.value`, inheritedBlackboard);
  return {
    kind: 'passiveUiValue',
    target,
    value: scalar,
    ...(scalar.blackboardKey === null ? {} : { readBlackboardKeys: [scalar.blackboardKey] }),
  };
}

/** 梨诺专属 UI 动画事件；两个标量只控制界面动画速度和缩放。 */
export function parseLiinoUiEventActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([...ACTION_META_FIELDS, 'liinoEvent', 'speed', 'scale']),
    path,
  );
  requireNonEmptyString(action.liinoEvent, `${path}.liinoEvent`);
  const speed = parseScalarSource(action.speed, `${path}.speed`, inheritedBlackboard);
  const scale = parseScalarSource(action.scale, `${path}.scale`, inheritedBlackboard);
  return {
    kind: 'operatorUiEvent',
    readBlackboardKeys: [speed.blackboardKey, scale.blackboardKey].filter(
      (key): key is string => key !== null,
    ),
  };
}

/**
 * 1.4.4 InheritCCSAction.ExecuteInternal (RVA 0x06D00E0C) 只创建并保存
 * CameraControlState，overrideBlendOut 只写该相机状态；OnEnd (0x06D00FC0)
 * 释放它。无渲染模拟严格校验载荷后省略，不据名称推断战斗行为。
 */
export function parseInheritedCameraControlStateActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([...ACTION_META_FIELDS, 'ccsOwner', 'ccsKey', 'overrideBlendOut', 'blendOutTime']),
    path,
  );
  const owner = parseTargetReferenceSource(action.ccsOwner, `${path}.ccsOwner`);
  if (owner.targetSource !== 'Owner' || owner.targetGroupKey !== '') {
    throw new Error(`${path}.ccsOwner: expected plain Owner`);
  }
  requireNonEmptyString(action.ccsKey, `${path}.ccsKey`);
  requireBoolean(action.overrideBlendOut, `${path}.overrideBlendOut`);
  const blendOutTime = requireNumber(action.blendOutTime, `${path}.blendOutTime`);
  if (blendOutTime < 0) throw new Error(`${path}.blendOutTime: expected non-negative number`);
  return { kind: 'inheritedCameraControlState' };
}

export function parseIgniteBuffTextActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'targetSettings',
      'mountPoint',
      'offset',
      'energyShardType',
      'textId',
      'showOnSquadIcon',
      'forceMainBody',
    ]),
    path,
  );
  parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`);
  requireString(action.mountPoint, `${path}.mountPoint`);
  const offset = requireRecord(action.offset, `${path}.offset`);
  requireExactFields(offset, new Set(['x', 'y']), `${path}.offset`);
  requireNumber(offset.x, `${path}.offset.x`);
  requireNumber(offset.y, `${path}.offset.y`);
  requireString(action.energyShardType, `${path}.energyShardType`);
  requireString(action.textId, `${path}.textId`);
  requireBoolean(action.showOnSquadIcon, `${path}.showOnSquadIcon`);
  requireBoolean(action.forceMainBody, `${path}.forceMainBody`);
  return { kind: 'igniteBuffText' };
}

/** 伤害免疫提示只携带文字、挂点和屏幕偏移；严格解析后进入无渲染后端的表现叶。 */
export function parseImmuneTextActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'targetSettings',
      'mountPoint',
      'offset',
      'textId',
      'forceMainBody',
    ]),
    path,
  );
  parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`);
  requireString(action.mountPoint, `${path}.mountPoint`);
  const offset = requireRecord(action.offset, `${path}.offset`);
  requireExactFields(offset, new Set(['x', 'y']), `${path}.offset`);
  requireNumber(offset.x, `${path}.offset.x`);
  requireNumber(offset.y, `${path}.offset.y`);
  requireString(action.textId, `${path}.textId`);
  requireBoolean(action.forceMainBody, `${path}.forceMainBody`);
  return { kind: 'immuneText' };
}

export function parseSetAnimatorParameterActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([...ACTION_META_FIELDS, 'paramName', 'paramAction', 'actionOnEnd', 'endAction']),
    path,
  );
  requireString(action.paramName, `${path}.paramName`);
  parseAnimatorParameterAction(action.paramAction, `${path}.paramAction`);
  requireBoolean(action.actionOnEnd, `${path}.actionOnEnd`);
  parseAnimatorParameterAction(action.endAction, `${path}.endAction`);
  return { kind: 'animatorParameter' };
}

export function parseShowHideActorActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'targetSettings',
      'showHideType',
      'modelPartEnum',
      'isShow',
      'affectInit',
      'revertOnRelease',
    ]),
    path,
  );
  parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`);
  requireString(action.showHideType, `${path}.showHideType`);
  requireString(action.modelPartEnum, `${path}.modelPartEnum`);
  requireBoolean(action.isShow, `${path}.isShow`);
  requireBoolean(action.affectInit, `${path}.affectInit`);
  requireBoolean(action.revertOnRelease, `${path}.revertOnRelease`);
  return { kind: 'actorVisibility' };
}

export function parseModifyWeaponMountPointActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'weaponIndex',
      'overrideIdleMountPoint',
      'idleMountPoint',
      'overrideFightMountPoint',
      'fightMountPoint',
    ]),
    path,
  );
  requireInteger(action.weaponIndex, `${path}.weaponIndex`);
  requireBoolean(action.overrideIdleMountPoint, `${path}.overrideIdleMountPoint`);
  requireString(action.idleMountPoint, `${path}.idleMountPoint`);
  requireBoolean(action.overrideFightMountPoint, `${path}.overrideFightMountPoint`);
  requireString(action.fightMountPoint, `${path}.fightMountPoint`);
  return { kind: 'weaponMountPoint' };
}

export function parseWeaponAnimationActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'weaponId',
      'paramAction',
      'actionOnEnd',
      'endAction',
      'actionOnInterrupt',
      'interruptionAction',
      'overrideInterruptionTime',
      'interruptionBefore',
    ]),
    path,
  );
  requireInteger(action.weaponId, `${path}.weaponId`);
  parseAnimatorParameterAction(action.paramAction, `${path}.paramAction`);
  requireBoolean(action.actionOnEnd, `${path}.actionOnEnd`);
  parseAnimatorParameterAction(action.endAction, `${path}.endAction`);
  requireBoolean(action.actionOnInterrupt, `${path}.actionOnInterrupt`);
  parseAnimatorParameterAction(action.interruptionAction, `${path}.interruptionAction`);
  requireBoolean(action.overrideInterruptionTime, `${path}.overrideInterruptionTime`);
  requireNumber(action.interruptionBefore, `${path}.interruptionBefore`);
  return { kind: 'weaponAnimation' };
}

function parseAnimatorParameterAction(value: unknown, path: string): void {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set(['animatorParam', 'paramType', 'boolValue', 'intValue', 'floatValue']),
    path,
  );
  requireInteger(action.animatorParam, `${path}.animatorParam`);
  requireString(action.paramType, `${path}.paramType`);
  requireBoolean(action.boolValue, `${path}.boolValue`);
  requireInteger(action.intValue, `${path}.intValue`);
  requireNumber(action.floatValue, `${path}.floatValue`);
}

export function parseHideUiActionSource(value: unknown, path: string): HideUiActionSource {
  const action = requireRecord(value, path);
  requireExactFields(action, new Set([...ACTION_META_FIELDS, 'onlyBlockInput']), path);
  const onlyBlockInput = requireBoolean(action.onlyBlockInput, `${path}.onlyBlockInput`);
  return { kind: 'hideUi', onlyBlockInput };
}

export function parseUltimateShowActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(action, new Set(ACTION_META_FIELDS), path);
  return { kind: 'ultimateShow' };
}

/**
 * 1.4.4 IgnoreModelIntervalCheck.ExecuteInternal (RVA 0x06CFFC80) calls
 * Beyond.Gameplay.View.ModelManager.SetIgnoreIntervalCheck(true), while OnEnd
 * (0x06CFFD20) restores it with false. The action has no payload beyond the
 * common metadata and only changes the model loader's per-frame work budget;
 * a headless combat projection may therefore omit it after strict validation.
 */
export function parseIgnoreModelIntervalCheckActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(action, new Set(ACTION_META_FIELDS), path);
  return { kind: 'modelIntervalCheck' };
}

export function parseAnimatedCameraActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'cameraAnimKey',
      'duration',
      'horizontalInheritType',
      'outRelativeHorizontalAngle',
      'verticalInheritType',
      'outVerticalValue',
      'zoomScaleInheritType',
      'outZoomScale',
      'fitByCameraPos',
      'followPosition',
      'followRotation',
      'easeIn',
      'easeInTime',
      'easeOut',
      'easeOutTime',
      'hideAllRendererEffect',
      'affectedByTimeScale',
      'checkCollisionOnEnd',
      'checkCollisionTime',
      'endByInput',
    ]),
    path,
  );
  requireString(action.cameraAnimKey, `${path}.cameraAnimKey`);
  for (const key of [
    'duration',
    'outRelativeHorizontalAngle',
    'outVerticalValue',
    'outZoomScale',
    'easeInTime',
    'easeOutTime',
    'checkCollisionTime',
  ] as const)
    requireNumber(action[key], `${path}.${key}`);
  for (const key of [
    'horizontalInheritType',
    'verticalInheritType',
    'zoomScaleInheritType',
  ] as const)
    requireString(action[key], `${path}.${key}`);
  for (const key of [
    'fitByCameraPos',
    'followPosition',
    'followRotation',
    'easeIn',
    'easeOut',
    'hideAllRendererEffect',
    'affectedByTimeScale',
    'checkCollisionOnEnd',
    'endByInput',
  ] as const)
    requireBoolean(action[key], `${path}.${key}`);
  return { kind: 'animatedCamera' };
}

export function parseWeaponVisibilityActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'includeAllWeapons',
      'weaponIndex',
      'visible',
      'showVFX',
      'overrideVFX',
      'vfxOverrideConfig',
    ]),
    path,
  );
  requireBoolean(action.includeAllWeapons, `${path}.includeAllWeapons`);
  requireInteger(action.weaponIndex, `${path}.weaponIndex`);
  requireBoolean(action.visible, `${path}.visible`);
  requireBoolean(action.showVFX, `${path}.showVFX`);
  requireBoolean(action.overrideVFX, `${path}.overrideVFX`);
  const vfx = requireRecord(action.vfxOverrideConfig, `${path}.vfxOverrideConfig`);
  const fields = [
    'toIdleAppearParticleFx',
    'toIdleAppearRendererFx',
    'toIdleAppearRendererFx2',
    'toIdleAppearRendererFx3',
    'toIdleAppearRendererFx4',
    'toIdleDisappearParticleFx',
    'toIdleDisappearRendererFx',
    'toFightAppearParticleFx',
    'toFightAppearRendererFx',
  ];
  requireExactFields(
    vfx,
    new Set(fields.flatMap(field => [`enable${field[0]!.toUpperCase()}${field.slice(1)}`, field])),
    `${path}.vfxOverrideConfig`,
  );
  for (const field of fields) {
    requireBoolean(
      vfx[`enable${field[0]!.toUpperCase()}${field.slice(1)}`],
      `${path}.vfxOverrideConfig.enable${field[0]!.toUpperCase()}${field.slice(1)}`,
    );
    requireString(vfx[field], `${path}.vfxOverrideConfig.${field}`);
  }
  return { kind: 'weaponVisibility' };
}

export function parseVoiceTriggerActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      '_triggerKey',
      '_speakerType',
      '_canInterruptTimeMs',
      ...('_jumpToWhenPlayMs' in action ? ['_jumpToWhenPlayMs'] : []),
      ...('_seekFadeInMs' in action ? ['_seekFadeInMs'] : []),
      ...('_responseQuestIdKey' in action ? ['_responseQuestIdKey'] : []),
      'targetSettings',
    ]),
    path,
  );
  requireString(action._triggerKey, `${path}._triggerKey`);
  const speakerTypePath = `${path}._speakerType`;
  const speakerType = action._speakerType;
  if (!(
    typeof speakerType === 'string' ||
    (Number.isInteger(speakerType) && (speakerType as number) >= 0 && (speakerType as number) <= 4)
  )) {
    throw new Error(`${speakerTypePath}: expected VoSpeakerType name or native value 0..4`);
  }
  requireInteger(action._canInterruptTimeMs, `${path}._canInterruptTimeMs`);
  // 新版时间参数传给语音 SeekResponse，不是战斗时间轴偏移。
  for (const key of ['_jumpToWhenPlayMs', '_seekFadeInMs']) {
    if (key in action) requireInteger(action[key], `${path}.${key}`);
  }
  // 原生把成功播放的句柄写回动作黑板；有写回时不能直接按纯语音省略。
  if (
    '_responseQuestIdKey' in action &&
    requireString(action._responseQuestIdKey, `${path}._responseQuestIdKey`) !== ''
  ) {
    throw new Error(
      `${path}._responseQuestIdKey: voice handle consumers require explicit projection`,
    );
  }
  parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`);
  return { kind: 'voiceTrigger' };
}

export function parseVoiceInterruptActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([...ACTION_META_FIELDS, '_interruptImmediately', '_canInterruptTimeMs']),
    path,
  );
  requireBoolean(action._interruptImmediately, `${path}._interruptImmediately`);
  requireInteger(action._canInterruptTimeMs, `${path}._canInterruptTimeMs`);
  return { kind: 'voiceInterrupt' };
}

export function parseCameraRotateActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'ccsPriority',
      'totalAngle',
      'duration',
      'blendStyle',
      'customCurve',
      'inputConflictStrategy',
    ]),
    path,
  );
  requireNumber(action.ccsPriority, `${path}.ccsPriority`);
  const totalAngle = parseScalarSource(
    action.totalAngle,
    `${path}.totalAngle`,
    inheritedBlackboard,
  );
  const duration = parseScalarSource(action.duration, `${path}.duration`, inheritedBlackboard);
  requireString(action.blendStyle, `${path}.blendStyle`);
  parseTimeDilationCurveKeys(action.customCurve, `${path}.customCurve`);
  requireString(action.inputConflictStrategy, `${path}.inputConflictStrategy`);
  return {
    kind: 'cameraRotate',
    readBlackboardKeys: [totalAngle.blackboardKey, duration.blackboardKey].filter(
      (key): key is string => key !== null,
    ),
  };
}

export interface PlayAnimationActionSource {
  readonly kind: 'playAnimation';
  readonly animationName: string;
  readonly durationSeconds: number;
  readonly blendOutSeconds: number;
  readonly playbackSpeed: number;
  readonly executeOnNormalEndOnly: boolean;
  /** 只保留当前已严格解析的“条件守卫后创建 Buff”结束子图；是否可省略由投影层判定。 */
  readonly onEnd?: {
    readonly conditions: readonly NativeConditionSource[];
    readonly buffApplications: readonly BuffApplicationActionSource[];
  };
}

const ACTION_META_FIELDS = [
  '$type',
  'isEnable',
  'priorityLevel',
  'priorityOffset',
  'serverActionIndex',
];

export function parseOverrideCameraFollowActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'targetSettings',
      'targetSettings2',
      'targetAlpha',
      'blendInStyle',
      'blendInTime',
      'blendOutStyle',
      'blendOutTime',
      'ccsPriority',
    ]),
    path,
  );
  parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`);
  parseTargetReferenceSource(action.targetSettings2, `${path}.targetSettings2`);
  const values = [
    parseScalarSource(action.targetAlpha, `${path}.targetAlpha`, inheritedBlackboard),
    parseScalarSource(action.blendInTime, `${path}.blendInTime`, inheritedBlackboard),
    parseScalarSource(action.blendOutTime, `${path}.blendOutTime`, inheritedBlackboard),
    parseScalarSource(action.ccsPriority, `${path}.ccsPriority`, inheritedBlackboard),
  ];
  requireString(action.blendInStyle, `${path}.blendInStyle`);
  requireString(action.blendOutStyle, `${path}.blendOutStyle`);
  return {
    kind: 'overrideCameraFollow',
    readBlackboardKeys: values
      .map(value => value.blackboardKey)
      .filter((key): key is string => key !== null),
  };
}

export function parseTemporaryUnlockActionSource(
  value: unknown,
  path: string,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'compareTarget',
      'targetSettings',
      'disableLockAimPriority',
      ...('blockManualLock' in action ? ['blockManualLock'] : []),
    ]),
    path,
  );
  requireBoolean(action.compareTarget, `${path}.compareTarget`);
  parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`);
  requireNumber(action.disableLockAimPriority, `${path}.disableLockAimPriority`);
  // 只限制玩家手动切换镜头锁定，不改已经选出的技能目标。
  if ('blockManualLock' in action)
    requireBoolean(action.blockManualLock, `${path}.blockManualLock`);
  return { kind: 'temporaryUnlock' };
}

/** LockCameraAimAction 只建立相机控制状态；严格读取所有 1.4.4 镜头参数后由无渲染后端省略。 */
export function parseLockCameraAimActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'ccsPriority',
      'overrideLowerParamsToDefault',
      'angleThreshold',
      'forceFollowMainChar',
      'blendInStyle',
      'blendInCustomCurve',
      'blendInTime',
      'blendOutStyle',
      'blendOutCustomCurve',
      'blendOutTime',
      'horizontalBaseAngleMin',
      'horizontalBaseAngleMinBB',
      'horizontalBaseAngleMax',
      'horizontalBaseAngleMaxBB',
      'verticalRelativeToTarget',
      'verticalBaseValue',
      'verticalBaseValueBB',
      'verticalBaseValueMin',
      'verticalBaseValueMinBB',
      'verticalBaseValueMax',
      'verticalBaseValueMaxBB',
      'dampingTime',
      'horizontalSpeedFactor',
      'verticalSpeedFactor',
      'horizontalTweenSpeed',
      'verticalTweenSpeed',
      'allowAimZones',
      'useExitParam',
      'exitParamOnlyOnComplete',
      'exitParam',
      'disablePlayerInputOnBlendIn',
      'disablePlayerInputOnBlendOut',
      'disablePlayerInputInState',
      'cancelOnDrag',
      'cancelOnBeHit',
      'cancelOnMove',
      'overrideTarget1',
      'useMainCharYForTarget1',
      'targetSettings',
      'mountPoint1',
      'overrideLookAtOffset',
      'lookAtOffset',
      'overrideTarget2',
      'useMainCharYForTarget2',
      'targetSettings2',
      'mountPoint2',
      'overrideLookAt2Offset',
      'lookAt2Offset',
      'lookAt2OffsetWhenNoOverride',
      'targetAlpha',
    ]),
    path,
  );
  for (const key of [
    'ccsPriority',
    'angleThreshold',
    'blendInTime',
    'blendOutTime',
    'horizontalBaseAngleMin',
    'horizontalBaseAngleMax',
    'verticalBaseValue',
    'verticalBaseValueMin',
    'verticalBaseValueMax',
    'dampingTime',
    'horizontalSpeedFactor',
    'verticalSpeedFactor',
    'horizontalTweenSpeed',
    'verticalTweenSpeed',
    'targetAlpha',
  ] as const)
    requireNumber(action[key], `${path}.${key}`);
  for (const key of [
    'overrideLowerParamsToDefault',
    'forceFollowMainChar',
    'verticalRelativeToTarget',
    'allowAimZones',
    'useExitParam',
    'exitParamOnlyOnComplete',
    'disablePlayerInputOnBlendIn',
    'disablePlayerInputOnBlendOut',
    'disablePlayerInputInState',
    'cancelOnDrag',
    'cancelOnBeHit',
    'cancelOnMove',
    'overrideTarget1',
    'useMainCharYForTarget1',
    'overrideLookAtOffset',
    'overrideTarget2',
    'useMainCharYForTarget2',
    'overrideLookAt2Offset',
  ] as const)
    requireBoolean(action[key], `${path}.${key}`);
  requireString(action.blendInStyle, `${path}.blendInStyle`);
  requireString(action.blendOutStyle, `${path}.blendOutStyle`);
  requireString(action.mountPoint1, `${path}.mountPoint1`);
  requireString(action.mountPoint2, `${path}.mountPoint2`);
  parseTimeDilationCurveKeys(action.blendInCustomCurve, `${path}.blendInCustomCurve`);
  parseTimeDilationCurveKeys(action.blendOutCustomCurve, `${path}.blendOutCustomCurve`);
  parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`);
  parseTargetReferenceSource(action.targetSettings2, `${path}.targetSettings2`);
  const readBlackboardKeys = [
    'horizontalBaseAngleMinBB',
    'horizontalBaseAngleMaxBB',
    'verticalBaseValueBB',
    'verticalBaseValueMinBB',
    'verticalBaseValueMaxBB',
  ]
    .map(key => parseScalarSource(action[key], `${path}.${key}`, inheritedBlackboard).blackboardKey)
    .filter((key): key is string => key !== null);
  const exitParam = requireRecord(action.exitParam, `${path}.exitParam`);
  requireExactFields(
    exitParam,
    new Set([
      'applyHorizontalAngle',
      'horizontalAngleRelativeToCharacter',
      'horizontalAngle',
      'applyVerticalValue',
      'verticalValue',
      'applyZoomScale',
      'zoomScale',
    ]),
    `${path}.exitParam`,
  );
  for (const key of [
    'applyHorizontalAngle',
    'horizontalAngleRelativeToCharacter',
    'applyVerticalValue',
    'applyZoomScale',
  ] as const)
    requireBoolean(exitParam[key], `${path}.exitParam.${key}`);
  for (const key of ['horizontalAngle', 'verticalValue', 'zoomScale'] as const)
    requireNumber(exitParam[key], `${path}.exitParam.${key}`);
  for (const key of ['lookAtOffset', 'lookAt2Offset', 'lookAt2OffsetWhenNoOverride'] as const) {
    const vector = requireRecord(action[key], `${path}.${key}`);
    requireExactFields(vector, new Set(['x', 'y', 'z']), `${path}.${key}`);
    for (const axis of ['x', 'y', 'z'] as const)
      requireNumber(vector[axis], `${path}.${key}.${axis}`);
  }
  return { kind: 'lockCameraAim', ...(readBlackboardKeys.length ? { readBlackboardKeys } : {}) };
}

/**
 * 无渲染后端只可省略没有 onEnd 子动作的动画。onEnd 可能承载战斗逻辑，因此非空时严格拒绝，
 * 不能因为根动作是表现动作就连带删除子图。
 */
export function parsePlayAnimationActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues = {},
): PlayAnimationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'animName',
      'blendDuration',
      'blendOut',
      'duration',
      'playbackSpeed',
      'useStartTimeBlackboardKey',
      'startTime',
      'startTimeBlackboardKey',
      'exitToIdle',
      'blendOutNextStateHash',
      'onEndAction',
      'executeOnNormalEndOnly',
    ]),
    path,
  );
  const onEnd = requireRecord(action.onEndAction, `${path}.onEndAction`);
  requireExactFields(
    onEnd,
    new Set(['actionData', 'onlyExecuteWhenSourceIsMainChar', 'onlyExecuteWhenSourceIsGuard']),
    `${path}.onEndAction`,
  );
  const onEndActions = requireArray(onEnd.actionData, `${path}.onEndAction.actionData`);
  if (
    requireBoolean(
      onEnd.onlyExecuteWhenSourceIsMainChar,
      `${path}.onEndAction.onlyExecuteWhenSourceIsMainChar`,
    ) ||
    requireBoolean(
      onEnd.onlyExecuteWhenSourceIsGuard,
      `${path}.onEndAction.onlyExecuteWhenSourceIsGuard`,
    )
  ) {
    throw new Error(`${path}.onEndAction: animation end combat actions are unsupported`);
  }
  const conditions: NativeConditionSource[] = [];
  const buffApplications: BuffApplicationActionSource[] = [];
  const enabledOnEndActions = onEndActions.filter((raw, index) =>
    requireBoolean(
      requireRecord(raw, `${path}.onEndAction.actionData[${index}]`).isEnable,
      `${path}.onEndAction.actionData[${index}].isEnable`,
    ),
  );
  enabledOnEndActions.forEach((raw, index) => {
    const actionPath = `${path}.onEndAction.actionData[${index}]`;
    const child = requireRecord(raw, actionPath);
    const name = nativeActionName(requireNonEmptyString(child.$type, `${actionPath}.$type`));
    if (name === 'CreateBuffAction' || name === 'CreateBuffAttachingSkill') {
      buffApplications.push(
        parseBuffApplicationActionSource(child, actionPath, inheritedBlackboard),
      );
      return;
    }
    if (name.startsWith('Check')) {
      conditions.push(parseConditionLeafSource(child, actionPath, inheritedBlackboard));
      return;
    }
    throw new Error(
      `${path}.onEndAction: animation end combat actions are unsupported (${actionPath}: ${JSON.stringify(name)})`,
    );
  });
  return {
    kind: 'playAnimation',
    animationName: requireString(action.animName, `${path}.animName`),
    durationSeconds: requireNumber(action.duration, `${path}.duration`),
    blendOutSeconds: requireNumber(action.blendOut, `${path}.blendOut`),
    playbackSpeed: requireNumber(action.playbackSpeed, `${path}.playbackSpeed`),
    executeOnNormalEndOnly: requireBoolean(
      action.executeOnNormalEndOnly,
      `${path}.executeOnNormalEndOnly`,
    ),
    ...(enabledOnEndActions.length === 0 ? {} : { onEnd: { conditions, buffApplications } }),
  };
}

/** PlayAnimationWithStep 在基础动画外建立短距离步进移动；战斗 IR 只省略表现/空间结果。 */
export function parsePlayAnimationWithStepActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): PlayAnimationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'animName',
      'blendDuration',
      'blendOut',
      'duration',
      'playbackSpeed',
      'useStartTimeBlackboardKey',
      'startTime',
      'startTimeBlackboardKey',
      'exitToIdle',
      'blendOutNextStateHash',
      'onEndAction',
      'executeOnNormalEndOnly',
      'stepTarget',
      'montageName',
      'stepDistance',
      'frameToOriginAnim',
      'stepBlendIn',
      'animBlendInAfterStep',
      'snapFrame',
      'snapDistance',
      'useFixSpeed',
      'speed',
      'speedCurveKey',
      'hideWeapon',
      'hideWeaponFrame',
      'battlePoseWhenStep',
    ]),
    path,
  );
  const onEnd = requireRecord(action.onEndAction, `${path}.onEndAction`);
  requireExactFields(
    onEnd,
    new Set(['actionData', 'onlyExecuteWhenSourceIsMainChar', 'onlyExecuteWhenSourceIsGuard']),
    `${path}.onEndAction`,
  );
  if (
    requireArray(onEnd.actionData, `${path}.onEndAction.actionData`).length > 0 ||
    requireBoolean(
      onEnd.onlyExecuteWhenSourceIsMainChar,
      `${path}.onEndAction.onlyExecuteWhenSourceIsMainChar`,
    ) ||
    requireBoolean(
      onEnd.onlyExecuteWhenSourceIsGuard,
      `${path}.onEndAction.onlyExecuteWhenSourceIsGuard`,
    )
  )
    throw new Error(`${path}.onEndAction: animation end combat actions are unsupported`);
  parseTargetReferenceSource(action.stepTarget, `${path}.stepTarget`);
  for (const key of [
    'blendDuration',
    'blendOut',
    'startTime',
    'stepDistance',
    'stepBlendIn',
    'animBlendInAfterStep',
    'snapDistance',
  ] as const)
    requireNumber(action[key], `${path}.${key}`);
  for (const key of [
    'frameToOriginAnim',
    'snapFrame',
    'blendOutNextStateHash',
    'hideWeaponFrame',
  ] as const)
    requireInteger(action[key], `${path}.${key}`);
  for (const key of [
    'useStartTimeBlackboardKey',
    'exitToIdle',
    'executeOnNormalEndOnly',
    'useFixSpeed',
    'hideWeapon',
    'battlePoseWhenStep',
  ] as const)
    requireBoolean(action[key], `${path}.${key}`);
  requireString(action.startTimeBlackboardKey, `${path}.startTimeBlackboardKey`);
  requireString(action.montageName, `${path}.montageName`);
  parseScalarSource(action.speed, `${path}.speed`, inheritedBlackboard);
  requireString(action.speedCurveKey, `${path}.speedCurveKey`);
  return {
    kind: 'playAnimation',
    animationName: requireString(action.animName, `${path}.animName`),
    durationSeconds: requireNumber(action.duration, `${path}.duration`),
    blendOutSeconds: requireNumber(action.blendOut, `${path}.blendOut`),
    playbackSpeed: requireNumber(action.playbackSpeed, `${path}.playbackSpeed`),
    executeOnNormalEndOnly: requireBoolean(
      action.executeOnNormalEndOnly,
      `${path}.executeOnNormalEndOnly`,
    ),
  };
}

export function parseCameraPresentationActionSource(
  value: unknown,
  path: string,
  kind: OtherCameraPresentationActionSource['kind'],
): CameraPresentationActionSource {
  const action = requireRecord(value, path);
  const fields =
    kind === 'cameraImpulse'
      ? [
          ...ACTION_META_FIELDS,
          'realCameraShake2D',
          'targetSettings',
          'releaseWhenActionEnds',
          '_mountPoint',
          '_boneNode',
          '_positionOffset',
          '_followTarget',
          '_impulseDefinitionData',
        ]
      : kind === 'cameraControlState'
        ? [
            ...ACTION_META_FIELDS,
            'configKey',
            'customPriority',
            'ccsPriority',
            'useCcsCondition',
            'overrideBlendIn',
            'blendInStyle',
            'blendInCustomCurve',
            'blendInTime',
            'overrideBlendOut',
            'blendOutStyle',
            'blendOutCustomCurve',
            'blendOutTime',
            'removeByDuration',
            'ccsDuration',
            'removeByActionEnd',
            'inheritByNextSkill',
            'inheritKey',
            'inheritSkillIds',
            'keepAdditiveParamOnLeave',
          ]
        : [
            ...ACTION_META_FIELDS,
            'debugName',
            'customPriority',
            'ccsPriority',
            'overrideLowerParamsToDefault',
            'useCondition',
            'enterConditionsOr',
            'leaveConditionsOr',
            'blendInStyle',
            'blendInCustomCurve',
            'blendInTime',
            'blendOutStyle',
            'blendOutCustomCurve',
            'blendOutTime',
            'removeByDuration',
            'ccsDuration',
            'removeByActionEnd',
            'useAdditiveParam',
            'additiveHorizontalAngle',
            'additiveVerticalValue',
            'additiveZoomScale',
            'keepAdditiveParamOnLeave',
            'useMinZoom',
            'minZoom',
            'useMaxZoom',
            'maxZoom',
            'useMinVerticalValue',
            'minVerticalValue',
            'useMaxVerticalValue',
            'maxVerticalValue',
            'enableHorizontalAngleLimit',
            'minHorizontalAngle',
            'maxHorizontalAngle',
            'useFovCurve',
            'fovCurve',
            'useScreenYCurve',
            'screenYCurve',
            'useShoulderOffset',
            'shoulderOffset',
            'useAdditionalShoulderOffset',
            'additionalShoulderOffset',
            'useLookAtOffset',
            'lookAtOffset',
            'useAdditionalLookAtOffset',
            'additionalLookAtOffset',
            'useAdditiveFOV',
            'additiveFOV',
          ];
  requireExactFields(action, new Set(fields), path);
  if (kind === 'cameraImpulse')
    parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`);
  return { kind };
}

/** EffectAction 的根路由严格读取；渲染专属配置保留在来源 JSON，不进入无渲染战斗 IR。 */
export function parseEffectActionSource(
  value: unknown,
  path: string,
  encoding: 'polymorphic' | 'typedSlot' = 'polymorphic',
): EffectActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...(encoding === 'polymorphic' ? ['$type'] : []),
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'targetSettings',
      'effectSource',
      'useGuardLodSourceOverride',
      'guardLodSource',
      'isMainCharacterActive',
      'isTargetMainCharacterActive',
      'isShowBigEffect',
      'bigEffectName',
      ...('bigEffectTarget' in action ? ['bigEffectTarget'] : []),
      'playOnHittableObjects',
      'effectActionCfg',
      'saveEffectIdToBlackboard',
      'forceMainBody',
      'isCreateWithSourceModelActive',
    ]),
    path,
  );
  const config = requireRecord(action.effectActionCfg, `${path}.effectActionCfg`);
  // 专用 stackEffects 槽与多态动作共用字段校验，区别仅在是否序列化类型标记。
  requireNativeActionPriority(action.priorityLevel, `${path}.priorityLevel`);
  requireNumber(action.priorityOffset, `${path}.priorityOffset`);
  requireInteger(action.serverActionIndex, `${path}.serverActionIndex`);
  for (const key of [
    'isEnable',
    'useGuardLodSourceOverride',
    'isMainCharacterActive',
    'isTargetMainCharacterActive',
    'isShowBigEffect',
    'playOnHittableObjects',
    'forceMainBody',
    'isCreateWithSourceModelActive',
  ]) {
    requireBoolean(action[key], `${path}.${key}`);
  }
  requireRecord(action.guardLodSource, `${path}.guardLodSource`);
  requireString(action.bigEffectName, `${path}.bigEffectName`);
  // 新版大特效目标仍是公共 TargetSettings，只服务于表现路由，不另造一种目标解析器。
  if ('bigEffectTarget' in action) {
    parseTargetReferenceSource(action.bigEffectTarget, `${path}.bigEffectTarget`);
  }
  // 句柄写回可能有后续消费者，不能按纯表现动作省略。
  if (requireString(action.saveEffectIdToBlackboard, `${path}.saveEffectIdToBlackboard`) !== '') {
    throw new Error(
      `${path}.saveEffectIdToBlackboard: effect handle consumers require explicit projection`,
    );
  }
  return {
    kind: 'effect',
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    effectSource: parseTargetReferenceSource(action.effectSource, `${path}.effectSource`),
    effectName: requireString(config.effectName, `${path}.effectActionCfg.effectName`),
  };
}

/**
 * 1.4.4 的 PlaySoundAction.ExecuteInternal 只解析目标并进入音频播放路径。
 * 来源层仍完整校验已知字段；投影层可据此将它保留为有证据的表现 no-op。
 */
export function parsePlaySoundActionSource(value: unknown, path: string): PlaySoundActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      '_soundEvent',
      '_stopOnEnd',
      '_stopFadeDurationMs',
      '_canInterruptTimeMs',
      '_intrptFadeDurationMs',
      '_jumpToWhenPlayMs',
      '_useTempEmitter',
      'targetSettings',
      'mountPoint',
      'followMountPoint',
      'useWeaponMountPoint',
      'weaponIndex',
      'weaponMountPoint',
      'useTimeDilationPauseAndSeek',
      'timeDilationPauseThreshold',
      'timeDilationSeekThreshold',
      'timeDilationFadeOutDurationMs',
      'timeDilationFadeInDurationMs',
    ]),
    path,
  );
  return {
    kind: 'playSound',
    soundEvent: requireString(action._soundEvent, `${path}._soundEvent`),
    stopOnEnd: requireBoolean(action._stopOnEnd, `${path}._stopOnEnd`),
    stopFadeDurationMilliseconds: requireInteger(
      action._stopFadeDurationMs,
      `${path}._stopFadeDurationMs`,
    ),
    canInterruptTimeMilliseconds: requireInteger(
      action._canInterruptTimeMs,
      `${path}._canInterruptTimeMs`,
    ),
    interruptFadeDurationMilliseconds: requireInteger(
      action._intrptFadeDurationMs,
      `${path}._intrptFadeDurationMs`,
    ),
    jumpToWhenPlayMilliseconds: requireInteger(
      action._jumpToWhenPlayMs,
      `${path}._jumpToWhenPlayMs`,
    ),
    useTemporaryEmitter: requireBoolean(action._useTempEmitter, `${path}._useTempEmitter`),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    mountPoint: requireNamedOrInteger(action.mountPoint, `${path}.mountPoint`),
    followMountPoint: requireBoolean(action.followMountPoint, `${path}.followMountPoint`),
    useWeaponMountPoint: requireBoolean(action.useWeaponMountPoint, `${path}.useWeaponMountPoint`),
    weaponIndex: requireInteger(action.weaponIndex, `${path}.weaponIndex`),
    weaponMountPoint: requireNamedOrInteger(action.weaponMountPoint, `${path}.weaponMountPoint`),
    useTimeDilationPauseAndSeek: requireBoolean(
      action.useTimeDilationPauseAndSeek,
      `${path}.useTimeDilationPauseAndSeek`,
    ),
    timeDilationPauseThreshold: requireNumber(
      action.timeDilationPauseThreshold,
      `${path}.timeDilationPauseThreshold`,
    ),
    timeDilationSeekThreshold: requireNumber(
      action.timeDilationSeekThreshold,
      `${path}.timeDilationSeekThreshold`,
    ),
    timeDilationFadeOutDurationMilliseconds: requireInteger(
      action.timeDilationFadeOutDurationMs,
      `${path}.timeDilationFadeOutDurationMs`,
    ),
    timeDilationFadeInDurationMilliseconds: requireInteger(
      action.timeDilationFadeInDurationMs,
      `${path}.timeDilationFadeInDurationMs`,
    ),
  };
}

/** 1.4.4 原生 fallback 直接返回 true，不读取 bbKey；仍完整保存载荷。 */
export function parseDebugPrintActionSource(value: unknown, path: string): DebugPrintActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'logType',
      'target',
      'color',
      'bbKey',
      'identifier',
    ]),
    path,
  );
  const color = requireRecord(action.color, `${path}.color`);
  requireExactFields(color, new Set(['r', 'g', 'b', 'a']), `${path}.color`);
  return {
    kind: 'debugPrint',
    logType:
      typeof action.logType === 'number'
        ? requireInteger(action.logType, `${path}.logType`)
        : requireString(action.logType, `${path}.logType`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    color: {
      r: requireNumber(color.r, `${path}.color.r`),
      g: requireNumber(color.g, `${path}.color.g`),
      b: requireNumber(color.b, `${path}.color.b`),
      a: requireNumber(color.a, `${path}.color.a`),
    },
    blackboardKey: requireString(action.bbKey, `${path}.bbKey`),
    identifier: requireString(action.identifier, `${path}.identifier`),
  };
}
