import {
  parseBlackboardAssignmentsSource,
  type BlackboardAssignmentSource,
} from './assignments.ts';
import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseTagQuerySource } from './tagQuery.ts';
import { parseTargetReferenceSource } from './target.ts';
import type { NativeSequenceSource } from './controlFlow.ts';
import {
  parseAdvancedBuffFinishActionSource,
  parseBuffApplicationActionSource,
} from './buffActions.ts';
import type { TargetReferenceSource } from './target.ts';
import { parseScalarSource } from './scalar.ts';
import { parseAdvancedDirectionSource } from './spatial.ts';

export interface GlobalPartyAuraBuffInputSource {
  readonly buffId: string;
  readonly assignBlackboard: boolean;
  readonly assignments: readonly BlackboardAssignmentSource[];
}

/** 已取证的 GlobalAura + 存活友方 Character 分支。 */
export interface GlobalPartyAuraActionSource {
  readonly kind: 'globalPartyAura';
  readonly debugName: string;
  readonly fixedWhenStart: boolean;
  readonly target: 'party' | 'partyExceptCaster' | 'enemy';
  readonly buffSource: 'ActionOwner' | 'ActionSource';
  readonly inheritSourceSkillCastInfo: boolean;
  readonly buffs: readonly GlobalPartyAuraBuffInputSource[];
  /** 离开 Aura 时按同一批目标创建的有限余效 Buff。 */
  readonly exitBuffs: readonly GlobalPartyAuraBuffInputSource[];
  /** 原生退出动作另外清理 Owner 身上的同名 Buff，不等同于移除离场目标的实例。 */
  readonly exitOwnerCleanupBuffIds?: readonly string[];
  /** 进入范围时先清理的余效 Buff；用于避免范围内 Buff 与离场余效重叠。 */
  readonly enterCleanupBuffIds?: readonly string[];
  /** RangedAura 形状读取的黑板键；固定木桩中不参与成员判定，但来源事实不能丢。 */
  readonly spatialBlackboardKeys?: readonly string[];
  /** 只覆盖 Buff 图标倒计时来源，不改变 Buff 生命周期。 */
  readonly iconDurationOverride?: {
    readonly durationSourceType: 'AbilityEntity' | 'TimedMarker';
    readonly timedMarkerId: string;
  };
  /** 原生 Good 过滤未限制对象类型；Endaxis 只把其中可编辑的干员集合投影为 party。 */
  readonly includesAlliedNonCharacters?: boolean;
}

/** 引用闭包只消费 Aura 安装的 Buff；范围和目标行为仍由正式投影严格判定。 */
export interface AuraReferenceActionSource {
  readonly kind: 'auraReference';
  readonly buffs: readonly GlobalPartyAuraBuffInputSource[];
}

/**
 * 固定零空间木桩下可证明为“唯一敌人立即进入一次”的 RangedAura 窄分支。
 * 内部进入动作仍保留完整公共动作树；空间形状只作严格来源校验，不进入运行协议。
 */
export interface DirectRangedAuraActionSource<TLeaf> {
  readonly kind: 'directRangedAura';
  readonly target: 'enemy' | 'party';
  /** 原生是否在动作开始时固定 Aura 中心；零空间投影仍保留该来源事实。 */
  readonly fixedWhenStart: boolean;
  /** 敌方进入动作中已证明的唯一木桩 Context；队伍 Aura 不使用此快捷身份。 */
  readonly targetGroupKey?: string;
  readonly actionOnEnter: NativeSequenceSource<TLeaf>;
}

const ACTION_FIELDS = new Set([
  '$type',
  'isEnable',
  'priorityLevel',
  'priorityOffset',
  'serverActionIndex',
  'auraDebugName',
  'm_auraTypeWarning',
  'auraType',
  'auraRoot',
  'fixedWhenStart',
  'shapeData',
  'excludeColliderOptions',
  'targetObjectType',
  'targetFilter',
  'excludeOwner',
  'includeUnmarkable',
  'limitInfluenceCountPerTarget',
  'maxInfluenceCountPerTarget',
  'buffSource',
  'buffInput',
  'overrideBuffIconDuration',
  'buffIconDurationSource',
  'inheritSourceSkillCastId',
  'actionInAura',
  'actionWhenExitAura',
]);

const INFLUENCE_FILTER_FIELDS = [
  'filterFactionSource',
  'limitInfluenceHeight',
  'maxInfluenceHeight',
  'limitInfluenceAngle',
  'influenceAngle',
  'influenceDirection',
  'influenceDirectionAngleOffset',
] as const;

/** 所有 Aura 入口共用字段增量校验，不把阵营来源或启用的空间过滤误当表现信息。 */
function parseAuraRecord(value: unknown, path: string): Record<string, unknown> {
  const action = requireRecord(value, path);
  const hasInfluenceFilters = INFLUENCE_FILTER_FIELDS.some(field => field in action);
  requireExactFields(
    action,
    new Set([...ACTION_FIELDS, ...(hasInfluenceFilters ? INFLUENCE_FILTER_FIELDS : [])]),
    path,
  );
  if (hasInfluenceFilters) {
    // 新来源配置默认解析 Action Source 的阵营。
    requirePlainAuraTarget(
      parseTargetReferenceSource(action.filterFactionSource, `${path}.filterFactionSource`),
      'Source',
      `${path}.filterFactionSource`,
    );
    for (const field of ['limitInfluenceHeight', 'limitInfluenceAngle'] as const) {
      if (requireBoolean(action[field], `${path}.${field}`))
        throw new Error(`${path}.${field}: enabled Aura spatial filter is not projected`);
    }
    // 两个开关关闭时原生不执行这些计算；只校验输入结构，不引入黑板读者或运行时字段。
    for (const field of [
      'maxInfluenceHeight',
      'influenceAngle',
      'influenceDirectionAngleOffset',
    ] as const)
      parseScalarSource(action[field], `${path}.${field}`, {});
    parseAdvancedDirectionSource(action.influenceDirection, `${path}.influenceDirection`);
  }
  return action;
}

export function parseGlobalPartyAuraActionSource(
  value: unknown,
  path: string,
): GlobalPartyAuraActionSource {
  const action = parseAuraRecord(value, path);
  requireExpected(action.auraType, 'GlobalAura', `${path}.auraType`);
  const root = parseTargetReferenceSource(action.auraRoot, `${path}.auraRoot`);
  if (root.targetSource !== 'Owner' || root.targetGroupKey !== '') {
    throw new Error(`${path}.auraRoot: expected plain Owner`);
  }
  const fixedWhenStart = requireBoolean(action.fixedWhenStart, `${path}.fixedWhenStart`);
  const targetObjectType = requireNonEmptyString(
    action.targetObjectType,
    `${path}.targetObjectType`,
  );
  const target =
    targetObjectType === 'Character'
      ? 'party'
      : targetObjectType === 'Enemy' || targetObjectType === 'EnemyAll'
        ? 'enemy'
        : null;
  if (target === null)
    throw new Error(
      `${path}.targetObjectType: unsupported value ${JSON.stringify(targetObjectType)}`,
    );
  // GlobalAura 的空间尺寸仍可能由动作黑板提供。固定零距离模型不按半径筛目标，
  // 但保留键引用供黑板闭包审计，不能把动态半径误判成缺失字面值。
  const spatialBlackboardKeys = parseFiniteRangedShape(action.shapeData, `${path}.shapeData`);
  requireExpected(action.excludeColliderOptions, 0, `${path}.excludeColliderOptions`);
  const filter = requireRecord(action.targetFilter, `${path}.targetFilter`);
  if (target === 'party' && filter.autoSetTargetFaction === false) {
    parseFixedGoodCharacterFilter(filter, `${path}.targetFilter`, new Set([-65522, 'Character']));
  } else {
    parseGlobalFilter(filter, `${path}.targetFilter`, target === 'party' ? 'Ally' : 'Anti');
  }
  const excludeOwner = requireBoolean(action.excludeOwner, `${path}.excludeOwner`);
  requireExpected(action.includeUnmarkable, false, `${path}.includeUnmarkable`);
  // 固定零距离且没有移动/重入：同一 Aura 生命周期内每个目标只会进入一次，因而“不限”与
  // max=1 的限次在可见 Buff/治疗结果上等价；字段仍严格要求为布尔值。
  requireBoolean(action.limitInfluenceCountPerTarget, `${path}.limitInfluenceCountPerTarget`);
  requireExpected(action.maxInfluenceCountPerTarget, 1, `${path}.maxInfluenceCountPerTarget`);
  const buffSource = requireNonEmptyString(action.buffSource, `${path}.buffSource`);
  if (buffSource !== 'ActionOwner' && buffSource !== 'ActionSource') {
    throw new Error(`${path}.buffSource: unsupported value ${JSON.stringify(buffSource)}`);
  }
  requireExpected(action.overrideBuffIconDuration, false, `${path}.overrideBuffIconDuration`);
  parseIconDurationSource(action.buffIconDurationSource, `${path}.buffIconDurationSource`, false);
  const inheritSourceSkillCastInfo = requireBoolean(
    action.inheritSourceSkillCastId,
    `${path}.inheritSourceSkillCastId`,
  );
  parseEmptySequence(action.actionInAura, `${path}.actionInAura`);
  const buffs = parseAuraBuffInputs(action.buffInput, `${path}.buffInput`);
  const exitOwnerCleanupBuffIds: string[] = [];
  const exitBuffs = parseAuraExitAction(
    action.actionWhenExitAura,
    `${path}.actionWhenExitAura`,
    buffs.map(entry => entry.buffId),
    exitOwnerCleanupBuffIds,
  );
  return {
    kind: 'globalPartyAura',
    debugName: requireString(action.auraDebugName, `${path}.auraDebugName`),
    fixedWhenStart,
    target: target === 'party' && excludeOwner ? 'partyExceptCaster' : target,
    buffSource,
    inheritSourceSkillCastInfo,
    buffs,
    exitBuffs,
    ...(exitOwnerCleanupBuffIds.length === 0 ? {} : { exitOwnerCleanupBuffIds }),
    ...(spatialBlackboardKeys.length === 0 ? {} : { spatialBlackboardKeys }),
  };
}

export function parseDirectRangedAuraActionSource<TLeaf>(
  value: unknown,
  path: string,
  parseSequence: (value: unknown, path: string) => NativeSequenceSource<TLeaf>,
): DirectRangedAuraActionSource<TLeaf> | GlobalPartyAuraActionSource {
  const action = parseAuraRecord(value, path);
  requireExpected(action.auraType, 'RangedAura', `${path}.auraType`);
  const root = parseTargetReferenceSource(action.auraRoot, `${path}.auraRoot`);
  if (root.targetSource !== 'Owner' || root.targetGroupKey !== '') {
    throw new Error(`${path}.auraRoot: expected plain Owner`);
  }
  const fixedWhenStart = requireBoolean(action.fixedWhenStart, `${path}.fixedWhenStart`);
  const spatialBlackboardKeys = parseFiniteRangedShape(action.shapeData, `${path}.shapeData`);
  requireExpected(action.excludeColliderOptions, 0, `${path}.excludeColliderOptions`);
  const filter = requireRecord(action.targetFilter, `${path}.targetFilter`);
  const rangedBuffs = parseAuraBuffInputs(action.buffInput, `${path}.buffInput`, false);
  const autoEnemyTarget = filter.autoSetTargetFaction === true && filter.factionTarget === 'Anti';
  const autoPartyTarget = filter.autoSetTargetFaction === true && filter.factionTarget === 'Ally';
  if (
    rangedBuffs.length > 0 &&
    (autoEnemyTarget ||
      autoPartyTarget ||
      (filter.autoSetTargetFaction === false &&
        (filter.targetFactionType === 'Good' || filter.targetFactionType === 'Bad')))
  ) {
    requireExpected(action.targetObjectType, 0, `${path}.targetObjectType`);
    const target = autoEnemyTarget || filter.targetFactionType === 'Bad' ? 'enemy' : 'party';
    let includesAlliedNonCharacters = false;
    if (autoEnemyTarget) {
      parseGlobalFilter(filter, `${path}.targetFilter`, 'Anti');
    } else if (autoPartyTarget) {
      parseGlobalFilter(filter, `${path}.targetFilter`, 'Ally');
      includesAlliedNonCharacters = true;
    } else if (target === 'party') {
      if (filter.filterObjectType === false) {
        parseFixedGoodAllFilter(filter, `${path}.targetFilter`);
        includesAlliedNonCharacters = true;
      } else {
        parseFixedGoodCharacterFilter(filter, `${path}.targetFilter`, new Set(['Character']));
      }
    } else parseFixedEnemyFilter(filter, `${path}.targetFilter`);
    const excludeOwner = requireBoolean(action.excludeOwner, `${path}.excludeOwner`);
    requireExpected(action.includeUnmarkable, false, `${path}.includeUnmarkable`);
    // 固定零距离且没有移动/重入：每个目标只触发一次进入，max=1 的限次不会再截断结果。
    requireBoolean(action.limitInfluenceCountPerTarget, `${path}.limitInfluenceCountPerTarget`);
    requireExpected(action.maxInfluenceCountPerTarget, 1, `${path}.maxInfluenceCountPerTarget`);
    const buffSource = requireNonEmptyString(action.buffSource, `${path}.buffSource`);
    if (buffSource !== 'ActionOwner' && buffSource !== 'ActionSource') {
      throw new Error(`${path}.buffSource: unsupported value ${JSON.stringify(buffSource)}`);
    }
    const overrideBuffIconDuration = requireBoolean(
      action.overrideBuffIconDuration,
      `${path}.overrideBuffIconDuration`,
    );
    const iconDuration = parseIconDurationSource(
      action.buffIconDurationSource,
      `${path}.buffIconDurationSource`,
      overrideBuffIconDuration,
    );
    const inheritSourceSkillCastInfo = requireBoolean(
      action.inheritSourceSkillCastId,
      `${path}.inheritSourceSkillCastId`,
    );
    const enterCleanupBuffIds = parseAuraEnterCleanup(action.actionInAura, `${path}.actionInAura`);
    const buffs = rangedBuffs;
    const exitOwnerCleanupBuffIds: string[] = [];
    const exitBuffs = parseAuraExitAction(
      action.actionWhenExitAura,
      `${path}.actionWhenExitAura`,
      buffs.map(entry => entry.buffId),
      exitOwnerCleanupBuffIds,
    );
    return {
      kind: 'globalPartyAura',
      debugName: requireString(action.auraDebugName, `${path}.auraDebugName`),
      fixedWhenStart,
      target: target === 'enemy' ? 'enemy' : excludeOwner ? 'partyExceptCaster' : 'party',
      buffSource,
      inheritSourceSkillCastInfo,
      buffs,
      exitBuffs,
      ...(exitOwnerCleanupBuffIds.length === 0 ? {} : { exitOwnerCleanupBuffIds }),
      ...(enterCleanupBuffIds.length === 0 ? {} : { enterCleanupBuffIds }),
      ...(spatialBlackboardKeys.length === 0 ? {} : { spatialBlackboardKeys }),
      ...(overrideBuffIconDuration ? { iconDurationOverride: iconDuration } : {}),
      ...(includesAlliedNonCharacters ? { includesAlliedNonCharacters: true } : {}),
    };
  }
  requireExpected(action.targetObjectType, 0, `${path}.targetObjectType`);
  const directTarget = autoEnemyTarget ? 'enemy' : autoPartyTarget ? 'party' : null;
  if (directTarget === null) {
    throw new Error(`${path}.targetFilter: expected automatic Anti or Ally faction`);
  }
  parseGlobalFilter(filter, `${path}.targetFilter`, directTarget === 'enemy' ? 'Anti' : 'Ally');
  requireExpected(action.excludeOwner, true, `${path}.excludeOwner`);
  requireExpected(action.includeUnmarkable, false, `${path}.includeUnmarkable`);
  requireBoolean(action.limitInfluenceCountPerTarget, `${path}.limitInfluenceCountPerTarget`);
  requireExpected(action.maxInfluenceCountPerTarget, 1, `${path}.maxInfluenceCountPerTarget`);
  requireExpected(action.buffSource, 'ActionSource', `${path}.buffSource`);
  if (parseAuraBuffInputs(action.buffInput, `${path}.buffInput`, false).length !== 0) {
    throw new Error(`${path}.buffInput: expected empty array`);
  }
  requireExpected(action.overrideBuffIconDuration, false, `${path}.overrideBuffIconDuration`);
  parseIconDurationSource(action.buffIconDurationSource, `${path}.buffIconDurationSource`, false);
  requireExpected(action.inheritSourceSkillCastId, false, `${path}.inheritSourceSkillCastId`);
  const actionOnEnter = parseSequence(action.actionInAura, `${path}.actionInAura`);
  parseEmptySequence(action.actionWhenExitAura, `${path}.actionWhenExitAura`);
  const targetGroupKeys = collectDirectTargetGroupKeys(actionOnEnter);
  if (directTarget === 'enemy' && targetGroupKeys.size !== 1) {
    throw new Error(`${path}.actionInAura: expected exactly one direct Target group`);
  }
  return {
    kind: 'directRangedAura',
    target: directTarget,
    fixedWhenStart,
    ...(directTarget === 'enemy' ? { targetGroupKey: [...targetGroupKeys][0]! } : {}),
    actionOnEnter,
  };
}

function parseFixedGoodCharacterFilter(
  filter: Record<string, unknown>,
  path: string,
  allowedObjectTypes: ReadonlySet<unknown>,
): void {
  requireExactFields(
    filter,
    new Set([
      'checkAlive',
      'autoSetTargetFaction',
      'factionTarget',
      'targetFactionType',
      'filterObjectType',
      'objectType',
      'filterSlot',
      'slotIndex',
      'filterGameplayTag',
      'tagQuery',
    ]),
    path,
  );
  // checkAlive 仅过滤已经死亡的候选。Endaxis 固定木桩模型不制造干员死亡，唯一敌人也始终
  // 存活，因此两种取值的目标集合相同；仍校验字段类型，不能把其他筛选位一并省略。
  requireBoolean(filter.checkAlive, `${path}.checkAlive`);
  requireExpected(filter.autoSetTargetFaction, false, `${path}.autoSetTargetFaction`);
  requireExpected(filter.factionTarget, 'Anti', `${path}.factionTarget`);
  requireExpected(filter.targetFactionType, 'Good', `${path}.targetFactionType`);
  requireExpected(filter.filterObjectType, true, `${path}.filterObjectType`);
  if (!allowedObjectTypes.has(filter.objectType)) {
    throw new Error(`${path}.objectType: unsupported Good-character mask`);
  }
  requireExpected(filter.filterSlot, false, `${path}.filterSlot`);
  requireExpected(filter.slotIndex, 0, `${path}.slotIndex`);
  requireExpected(filter.filterGameplayTag, false, `${path}.filterGameplayTag`);
  const query = parseTagQuerySource(filter.tagQuery, `${path}.tagQuery`);
  if (query.tagIds.length > 0) throw new Error(`${path}.tagQuery: expected an empty query`);
}

function parseFixedEnemyFilter(filter: Record<string, unknown>, path: string): void {
  requireExactFields(
    filter,
    new Set([
      'checkAlive',
      'autoSetTargetFaction',
      'factionTarget',
      'targetFactionType',
      'filterObjectType',
      'objectType',
      'filterSlot',
      'slotIndex',
      'filterGameplayTag',
      'tagQuery',
    ]),
    path,
  );
  requireBoolean(filter.checkAlive, `${path}.checkAlive`);
  requireExpected(filter.autoSetTargetFaction, false, `${path}.autoSetTargetFaction`);
  requireExpected(filter.factionTarget, 'Anti', `${path}.factionTarget`);
  requireExpected(filter.targetFactionType, 'Bad', `${path}.targetFactionType`);
  requireExpected(filter.filterObjectType, false, `${path}.filterObjectType`);
  requireExpected(filter.objectType, 'All', `${path}.objectType`);
  requireExpected(filter.filterSlot, false, `${path}.filterSlot`);
  requireExpected(filter.slotIndex, 0, `${path}.slotIndex`);
  requireExpected(filter.filterGameplayTag, false, `${path}.filterGameplayTag`);
  const query = parseTagQuerySource(filter.tagQuery, `${path}.tagQuery`);
  if (query.tagIds.length > 0) throw new Error(`${path}.tagQuery: expected an empty query`);
}

function parseFixedGoodAllFilter(filter: Record<string, unknown>, path: string): void {
  requireExactFields(
    filter,
    new Set([
      'checkAlive',
      'autoSetTargetFaction',
      'factionTarget',
      'targetFactionType',
      'filterObjectType',
      'objectType',
      'filterSlot',
      'slotIndex',
      'filterGameplayTag',
      'tagQuery',
    ]),
    path,
  );
  requireBoolean(filter.checkAlive, `${path}.checkAlive`);
  requireExpected(filter.autoSetTargetFaction, false, `${path}.autoSetTargetFaction`);
  requireExpected(filter.factionTarget, 'Anti', `${path}.factionTarget`);
  requireExpected(filter.targetFactionType, 'Good', `${path}.targetFactionType`);
  requireExpected(filter.filterObjectType, false, `${path}.filterObjectType`);
  requireExpected(filter.objectType, 'All', `${path}.objectType`);
  requireExpected(filter.filterSlot, false, `${path}.filterSlot`);
  requireExpected(filter.slotIndex, 0, `${path}.slotIndex`);
  requireExpected(filter.filterGameplayTag, false, `${path}.filterGameplayTag`);
  const query = parseTagQuerySource(filter.tagQuery, `${path}.tagQuery`);
  if (query.tagIds.length > 0) throw new Error(`${path}.tagQuery: expected an empty query`);
}

function parseAuraEnterCleanup(value: unknown, path: string): string[] {
  const sequence = requireRecord(value, path);
  requireExactFields(
    sequence,
    new Set(['actionData', 'onlyExecuteWhenSourceIsMainChar', 'onlyExecuteWhenSourceIsGuard']),
    path,
  );
  requireExpected(
    sequence.onlyExecuteWhenSourceIsMainChar,
    false,
    `${path}.onlyExecuteWhenSourceIsMainChar`,
  );
  requireExpected(
    sequence.onlyExecuteWhenSourceIsGuard,
    false,
    `${path}.onlyExecuteWhenSourceIsGuard`,
  );
  return requireArray(sequence.actionData, `${path}.actionData`).flatMap((raw, index) => {
    const actionPath = `${path}.actionData[${index}]`;
    const cleanup = parseAdvancedBuffFinishActionSource(raw, actionPath, {});
    if (
      cleanup.kind !== 'buffFinishByQuery' ||
      cleanup.settings.checkType !== 'Id' ||
      cleanup.settings.buffIds.length === 0 ||
      cleanup.settings.tagQuery.tagIds.length !== 0 ||
      !cleanup.finishAll ||
      cleanup.finishLayerCount.blackboardKey !== null ||
      cleanup.finishLayerCount.value !== 1 ||
      cleanup.limitSource ||
      cleanup.isFinishedEarly ||
      cleanup.isAbsorbed
    )
      throw new Error(`${actionPath}: unsupported Aura enter cleanup`);
    requirePlainAuraTarget(cleanup.owner, 'Target', `${actionPath}.buffOwner`);
    requirePlainAuraTarget(cleanup.buffSource, 'Source', `${actionPath}.buffSource`);
    requirePlainAuraTarget(cleanup.finishSource, 'Source', `${actionPath}.finishSource`);
    return [...cleanup.settings.buffIds];
  });
}

function parseAuraExitAction(
  value: unknown,
  path: string,
  buffIds: readonly string[],
  ownerCleanupBuffIds: string[] = [],
): GlobalPartyAuraBuffInputSource[] {
  const sequence = requireRecord(value, path);
  requireExactFields(
    sequence,
    new Set(['actionData', 'onlyExecuteWhenSourceIsMainChar', 'onlyExecuteWhenSourceIsGuard']),
    path,
  );
  requireExpected(
    sequence.onlyExecuteWhenSourceIsMainChar,
    false,
    `${path}.onlyExecuteWhenSourceIsMainChar`,
  );
  requireExpected(
    sequence.onlyExecuteWhenSourceIsGuard,
    false,
    `${path}.onlyExecuteWhenSourceIsGuard`,
  );
  const actions = requireArray(sequence.actionData, `${path}.actionData`);
  if (actions.length === 0) return [];
  const rawActions = actions.map((value, index) => {
    const raw = requireRecord(value, `${path}.actionData[${index}]`);
    requireExpected(raw.isEnable, true, `${path}.actionData[${index}].isEnable`);
    return raw;
  });
  if (
    rawActions.every(raw => typeof raw.$type === 'string' && raw.$type.includes('CreateBuffAction'))
  ) {
    if (rawActions.length !== 1)
      throw new Error(`${path}.actionData: expected one Aura exit Buff creation action`);
    const raw = rawActions[0]!;
    const application = parseBuffApplicationActionSource(raw, `${path}.actionData[0]`, {});
    if (
      application.count.blackboardKey !== null ||
      application.count.value !== 1 ||
      application.buffSource !== 'ActionSource' ||
      application.contextKey !== '' ||
      application.autoFinishByAction ||
      application.inheritSkillIds.length !== 0 ||
      !application.finishWithNextSkillIfNotInherited ||
      application.asChildBuff ||
      application.inheritSourceSkillCastId ||
      !application.inheritSourceSkillCastInfo ||
      application.isExtra ||
      application.passTargetGroupsToBuff ||
      application.overrideBuffIconDuration ||
      application.lifetimeOwner !== 'independent'
    ) {
      throw new Error(`${path}.actionData[0]: unsupported Aura exit Buff lifecycle`);
    }
    requirePlainAuraTarget(application.target, 'Target', `${path}.actionData[0].targetSettings`);
    return application.buffs.map(entry => ({
      buffId: entry.buffId,
      assignBlackboard: entry.assignBlackboard,
      assignments: entry.assignments,
    }));
  }
  const cleanedBuffIds: string[] = [];
  for (const [index, raw] of rawActions.entries()) {
    const actionPath = `${path}.actionData[${index}]`;
    const cleanup = parseAdvancedBuffFinishActionSource(raw, actionPath, {});
    if (
      cleanup.kind !== 'buffFinishByQuery' ||
      cleanup.settings.checkType !== 'Id' ||
      cleanup.settings.tagQuery.tagIds.length !== 0 ||
      !cleanup.finishAll ||
      cleanup.finishLayerCount.blackboardKey !== null ||
      cleanup.finishLayerCount.value !== 1 ||
      cleanup.limitSource ||
      cleanup.isFinishedEarly ||
      cleanup.isAbsorbed
    ) {
      throw new Error(`${actionPath}: unsupported Aura exit cleanup`);
    }
    cleanedBuffIds.push(...cleanup.settings.buffIds);
    if (cleanup.owner.targetSource === 'Owner') {
      requirePlainAuraTarget(cleanup.owner, 'Owner', `${actionPath}.buffOwner`);
      ownerCleanupBuffIds.push(...cleanup.settings.buffIds);
    } else {
      requirePlainAuraTarget(cleanup.owner, 'Target', `${actionPath}.buffOwner`);
    }
    requirePlainAuraTarget(cleanup.buffSource, 'Source', `${actionPath}.buffSource`);
    requirePlainAuraTarget(cleanup.finishSource, 'Source', `${actionPath}.finishSource`);
  }
  if (
    cleanedBuffIds.length !== buffIds.length ||
    cleanedBuffIds.some((id, index) => id !== buffIds[index])
  )
    throw new Error(`${path}.actionData: Aura exit cleanup does not match installed Buffs`);
  return [];
}

function requirePlainAuraTarget(
  target: TargetReferenceSource,
  targetSource: 'Source' | 'Target' | 'Owner',
  path: string,
): void {
  if (
    target.targetSource !== targetSource ||
    target.targetGroupKey !== '' ||
    target.finderType !== null ||
    target.validatorTypes.length !== 0 ||
    target.postProcessorTypes.length !== 0 ||
    target.priorityFilters.length !== 0 ||
    target.shuffleTargets.length !== 0 ||
    target.distanceValidators.length !== 0 ||
    target.validatorTagQueries.length !== 0 ||
    target.enableAdvancedDirection
  ) {
    throw new Error(`${path}: expected plain ${targetSource}`);
  }
}

/**
 * 定义闭包不解释 Aura 的空间执行语义，只严格读取会形成定义边的 buffInput。
 * 因此 RangedAura 可以参与资源下载，但进入 Endaxis 运行投影时仍会被严格阻断。
 */
export function parseAuraReferenceActionSource(
  value: unknown,
  path: string,
): AuraReferenceActionSource {
  const action = parseAuraRecord(value, path);
  requireNonEmptyString(action.auraType, `${path}.auraType`);
  const buffs = parseAuraBuffInputs(action.buffInput, `${path}.buffInput`, false);
  const exitBuffs = parseAuraExitAction(
    action.actionWhenExitAura,
    `${path}.actionWhenExitAura`,
    buffs.map(entry => entry.buffId),
  );
  return {
    kind: 'auraReference',
    buffs: [...buffs, ...exitBuffs],
  };
}

function parseAuraBuffInputs(
  value: unknown,
  path: string,
  requireNonEmpty = true,
): GlobalPartyAuraBuffInputSource[] {
  const buffs = requireArray(value, path).map((raw, index) => {
    const inputPath = `${path}[${index}]`;
    const input = requireRecord(raw, inputPath);
    requireExactFields(input, new Set(['buffId', 'assignBlackboard', 'assignItems']), inputPath);
    const assignBlackboard = requireBoolean(
      input.assignBlackboard,
      `${inputPath}.assignBlackboard`,
    );
    const assignments = parseBlackboardAssignmentsSource(
      input.assignItems,
      `${inputPath}.assignItems`,
      {
        enabled: assignBlackboard,
      },
    );
    if (!assignBlackboard && assignments.length > 0) {
      throw new Error(`${inputPath}.assignItems: expected empty array when assignment is disabled`);
    }
    return {
      buffId: requireNonEmptyString(input.buffId, `${inputPath}.buffId`),
      assignBlackboard,
      assignments,
    };
  });
  if (requireNonEmpty && buffs.length === 0) throw new Error(`${path}: expected at least one Buff`);
  return buffs;
}

function parseGlobalFilter(value: unknown, path: string, expectedFaction: string): void {
  const filter = requireRecord(value, path);
  requireExactFields(
    filter,
    new Set([
      'checkAlive',
      'autoSetTargetFaction',
      'factionTarget',
      'targetFactionType',
      'filterObjectType',
      'objectType',
      'filterSlot',
      'slotIndex',
      'filterGameplayTag',
      'tagQuery',
    ]),
    path,
  );
  // Fixed stump simulation has no dead operator/enemy candidates, so this filter is inert.
  requireBoolean(filter.checkAlive, `${path}.checkAlive`);
  requireExpected(filter.autoSetTargetFaction, true, `${path}.autoSetTargetFaction`);
  requireExpected(filter.factionTarget, expectedFaction, `${path}.factionTarget`);
  const factionType = filter.targetFactionType;
  const expectedFactionType = expectedFaction === 'Anti' ? 'Bad' : 'Good';
  if (factionType !== 0 && factionType !== expectedFactionType) {
    throw new Error(
      `${path}.targetFactionType: expected 0 or ${JSON.stringify(expectedFactionType)}`,
    );
  }
  requireExpected(filter.filterObjectType, false, `${path}.filterObjectType`);
  requireExpected(filter.objectType, 'All', `${path}.objectType`);
  requireExpected(filter.filterSlot, false, `${path}.filterSlot`);
  requireExpected(filter.slotIndex, 0, `${path}.slotIndex`);
  requireExpected(filter.filterGameplayTag, false, `${path}.filterGameplayTag`);
  const query = parseTagQuerySource(filter.tagQuery, `${path}.tagQuery`);
  if (query.tagIds.length > 0) throw new Error(`${path}.tagQuery: expected an empty query`);
}

export function parseFiniteRangedShape(value: unknown, path: string): string[] {
  const shape = requireRecord(value, path);
  requireExactFields(
    shape,
    new Set([
      '_shape',
      '_rotationOffset',
      '_useExtentKey',
      '_extent',
      '_extentXKey',
      '_extentYKey',
      '_extentZKey',
      '_useCenterKey',
      '_center',
      '_centerXKey',
      '_centerYKey',
      '_centerZKey',
      '_heightKey',
      '_height',
      '_radiusKey',
      '_radius',
    ]),
    path,
  );
  const shapeType = requireString(shape._shape, `${path}._shape`);
  if (shapeType !== 'Box' && shapeType !== 'Sphere' && shapeType !== 'Capsule') {
    throw new Error(`${path}._shape: unsupported value ${JSON.stringify(shapeType)}`);
  }
  parseFiniteVector(shape._rotationOffset, `${path}._rotationOffset`);
  requireExpected(shape._useExtentKey, false, `${path}._useExtentKey`);
  parseFiniteVector(shape._extent, `${path}._extent`);
  const blackboardKeys: string[] = [];
  for (const key of ['_extentXKey', '_extentYKey', '_extentZKey']) {
    const value = requireString(shape[key], `${path}.${key}`);
    if (value.length > 0) blackboardKeys.push(value);
  }
  requireExpected(shape._useCenterKey, false, `${path}._useCenterKey`);
  parseFiniteVector(shape._center, `${path}._center`);
  const dimensionKeys = new Map<string, string>();
  for (const key of ['_centerXKey', '_centerYKey', '_centerZKey', '_heightKey', '_radiusKey']) {
    const value = requireString(shape[key], `${path}.${key}`);
    if (value.length > 0) blackboardKeys.push(value);
    dimensionKeys.set(key, value);
  }
  const height = requireNumber(shape._height, `${path}._height`);
  const radius = requireNumber(shape._radius, `${path}._radius`);
  const positiveDimension = (literal: number, keyField: '_heightKey' | '_radiusKey') => {
    const blackboardKey = dimensionKeys.get(keyField) ?? '';
    // 非空 key 代表该维度由动作 Blackboard 在运行时提供；序列化字面值只是回退载荷。
    // 零空间模型不读取具体范围，但仍保留 key 供黑板闭包审计，不能要求残留字面值为正。
    return literal > 0 || blackboardKey.length > 0;
  };
  if (
    shapeType === 'Capsule' &&
    (!positiveDimension(height, '_heightKey') || !positiveDimension(radius, '_radiusKey'))
  ) {
    throw new Error(`${path}: Capsule requires positive height and radius`);
  }
  return blackboardKeys;
}

function parseFiniteVector(value: unknown, path: string): void {
  const vector = requireRecord(value, path);
  requireExactFields(vector, new Set(['x', 'y', 'z']), path);
  for (const key of ['x', 'y', 'z']) requireNumber(vector[key], `${path}.${key}`);
}

function collectDirectTargetGroupKeys<TLeaf>(sequence: NativeSequenceSource<TLeaf>): Set<string> {
  const keys = new Set<string>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (value === null || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    if (record.targetSource === 'Target' && typeof record.targetGroupKey === 'string') {
      if (record.targetGroupKey !== '') keys.add(record.targetGroupKey);
    }
    for (const nested of Object.values(record)) visit(nested);
  };
  visit(sequence);
  return keys;
}

function parseIconDurationSource(
  value: unknown,
  path: string,
  active = true,
): { durationSourceType: 'AbilityEntity' | 'TimedMarker'; timedMarkerId: string } {
  const source = requireRecord(value, path);
  requireExactFields(
    source,
    new Set([
      'm_abilityEntityTypeInfo',
      'm_timedMarkerInfo',
      'durationSourceType',
      'timedMarkerId',
    ]),
    path,
  );
  requireString(source.m_abilityEntityTypeInfo, `${path}.m_abilityEntityTypeInfo`);
  requireString(source.m_timedMarkerInfo, `${path}.m_timedMarkerInfo`);
  if (
    source.durationSourceType !== 'AbilityEntity' &&
    source.durationSourceType !== 'TimedMarker'
  ) {
    throw new Error(`${path}.durationSourceType: unsupported value`);
  }
  const timedMarkerId = requireString(source.timedMarkerId, `${path}.timedMarkerId`);
  // overrideBuffIconDuration=false 时原生不会读取这份编辑器配置；导出样本可能保留
  // TimedMarker + 空 id 的默认组合。字段形状仍校验，但仅对启用分支施加语义约束。
  if (active && source.durationSourceType === 'TimedMarker' && timedMarkerId.length === 0)
    throw new Error(`${path}.timedMarkerId: expected non-empty TimedMarker id`);
  if (active && source.durationSourceType === 'AbilityEntity' && timedMarkerId.length > 0)
    throw new Error(`${path}.timedMarkerId: expected empty AbilityEntity marker id`);
  return { durationSourceType: source.durationSourceType, timedMarkerId };
}

function parseEmptySequence(value: unknown, path: string): void {
  const sequence = requireRecord(value, path);
  requireExactFields(
    sequence,
    new Set(['actionData', 'onlyExecuteWhenSourceIsMainChar', 'onlyExecuteWhenSourceIsGuard']),
    path,
  );
  if (requireArray(sequence.actionData, `${path}.actionData`).length > 0)
    throw new Error(`${path}.actionData: expected empty array`);
  requireExpected(
    sequence.onlyExecuteWhenSourceIsMainChar,
    false,
    `${path}.onlyExecuteWhenSourceIsMainChar`,
  );
  requireExpected(
    sequence.onlyExecuteWhenSourceIsGuard,
    false,
    `${path}.onlyExecuteWhenSourceIsGuard`,
  );
}

function requireExpected(value: unknown, expected: string | number | boolean, path: string): void {
  const actual =
    typeof expected === 'string'
      ? requireString(value, path)
      : typeof expected === 'boolean'
        ? requireBoolean(value, path)
        : Number.isInteger(expected)
          ? requireInteger(value, path)
          : requireNumber(value, path);
  if (actual !== expected) throw new Error(`${path}: expected ${JSON.stringify(expected)}`);
}
