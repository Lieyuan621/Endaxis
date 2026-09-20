import {
  parseKnownNativeActionLeafSource,
  type KnownNativeActionLeafSource,
} from './actionLeaf.ts';
import { parseDeclaredBlackboard, type DeclaredBlackboardValueSource } from './blackboard.ts';
import {
  parseNativeSequenceSource,
  type NativeLeafParser,
  type NativeSequenceSource,
} from './controlFlow.ts';
import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import type { BlackboardLevelValues } from './scalar.ts';

const SKILL_DATA_FIELDS = new Set([
  'actionGroupData',
  'aiExclusiveFrame',
  'attackRangeType',
  'blackboard',
  'buffs',
  'canCastInAir',
  'canDummyCast',
  'canMove',
  'cardAttributeModifier',
  'castData',
  'castType',
  'characterReturnToIdle',
  'comboSkillUIBigSpriteName',
  'comboSkillUISpriteName',
  'dontInterruptCombo',
  'dummyPositionOffset',
  'durationFrame',
  'exclusiveFrame',
  'hittableAttackRange',
  'iconBgType',
  'iconId',
  'level',
  'needEnemyOutOfScreenWarning',
  'needEnemyOutOfScreenWarningOverrideValue',
  'offsetRecordFrame',
  'overrideHittableObjAttackRange',
  'overrideNeedEnemyOutOfScreenWarning',
  'passiveSkillType',
  'rootMotionCliffCheck',
  'selectStrategy',
  'showNotRecommendState',
  'skillHighlightCondition',
  'skillId',
  'skillName',
  'skillSpecification',
  'skillTags',
  'smartTargetBuffFindSettings',
  'smartTargetBuffIds',
  'smartTargetSelectStrategy',
  'smartTargetTagQuery',
  'switchToBuffConfig',
  'switchToCenterBeforeCast',
  'tagDuringAttach',
  'toggleBuffs',
  'uiRangeHints',
  'useAIExclusiveFrame',
]);

export interface ForceSyncAnimationSource {
  readonly forceSync: boolean;
  readonly montageName: string;
  readonly targetFrame: number;
  readonly playbackSpeed: number;
}

export interface SkillTimelineActionSource<TLeaf> {
  readonly startFrame: number;
  readonly endFrame: number;
  readonly sequence: NativeSequenceSource<TLeaf>;
  readonly forceSyncAnimation: ForceSyncAnimationSource;
}

export interface SkillPassiveEventSource<TLeaf> {
  /** 5 个敌方样本使用未命名数值 0；来源层不得猜成某个命名事件。 */
  readonly abilityEvent: string | number;
  /** 一个事件可原样保存多个 SequenceAction；不能提前压成单一序列。 */
  readonly actions: readonly NativeSequenceSource<TLeaf>[];
}

export interface SkillActionGroupSource<TLeaf> {
  readonly timelineActions: readonly SkillTimelineActionSource<TLeaf>[];
  readonly passiveEvents: readonly SkillPassiveEventSource<TLeaf>[];
}

/**
 * SkillData 的动作图切片。其余根字段只做版本签名校验，不表示施法、UI 与智能选敌已经解析。
 */
export interface SkillActionGraphSource<TLeaf> {
  readonly skillId: string;
  readonly level: number;
  readonly durationFrame: number;
  readonly declaredBlackboard: readonly DeclaredBlackboardValueSource[];
  readonly actionGroup: SkillActionGroupSource<TLeaf>;
  /** VFS 导出的原生空载荷；旧命名导出可能省略，非空形态尚未接入。 */
  readonly buffInputBase?: null;
  /** 当前版本的原生布尔字段；保留来源事实，不据此虚构水中施法运行逻辑。 */
  readonly canCastInWater?: boolean;
}

export function parseSkillActionGraphSource<TLeaf>(
  value: unknown,
  sourcePath: string,
  inheritedBlackboard: BlackboardLevelValues,
  parseLeaf: NativeLeafParser<TLeaf>,
): SkillActionGraphSource<TLeaf> {
  const root = requireRecord(value, sourcePath);
  const expectedFields = new Set(SKILL_DATA_FIELDS);
  // 只兼容已经核对的两项来源差异，其他缺失或新增字段继续严格失败。
  for (const field of ['buffInputBase', 'canCastInWater']) {
    if (Object.hasOwn(root, field)) expectedFields.add(field);
  }
  requireExactFields(root, expectedFields, sourcePath);
  // BuffInputBase 是原生多态载荷，不是 buffs 的别名。当前 2621 份均为 null；
  // 非空形态必须先取证其消费者，不能当成启动 Buff 或任意对象吞掉。
  if (Object.hasOwn(root, 'buffInputBase') && root.buffInputBase !== null) {
    throw new Error(`${sourcePath}.buffInputBase: non-null payload is not supported`);
  }
  return {
    ...(Object.hasOwn(root, 'buffInputBase') ? { buffInputBase: null } : {}),
    ...(Object.hasOwn(root, 'canCastInWater')
      ? { canCastInWater: requireBoolean(root.canCastInWater, `${sourcePath}.canCastInWater`) }
      : {}),
    skillId: requireNonEmptyString(root.skillId, `${sourcePath}.skillId`),
    level: requireNonNegativeInteger(root.level, `${sourcePath}.level`),
    durationFrame: requireNonNegativeInteger(root.durationFrame, `${sourcePath}.durationFrame`),
    declaredBlackboard: parseDeclaredBlackboard(root, sourcePath),
    actionGroup: parseSkillActionGroupSource(
      root.actionGroupData,
      `${sourcePath}.actionGroupData`,
      inheritedBlackboard,
      parseLeaf,
    ),
  };
}

export function parseSkillActionGroupSource<TLeaf>(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
  parseLeaf: NativeLeafParser<TLeaf>,
): SkillActionGroupSource<TLeaf> {
  const group = requireRecord(value, path);
  requireExactFields(group, new Set(['timelineActions', 'passiveEventActions']), path);
  return {
    timelineActions: requireArray(group.timelineActions, `${path}.timelineActions`).map(
      (timeline, index) =>
        parseSkillTimelineActionSource(
          timeline,
          `${path}.timelineActions[${index}]`,
          inheritedBlackboard,
          parseLeaf,
        ),
    ),
    passiveEvents: requireArray(group.passiveEventActions, `${path}.passiveEventActions`).map(
      (event, index) =>
        parsePassiveEvent(
          event,
          `${path}.passiveEventActions[${index}]`,
          inheritedBlackboard,
          parseLeaf,
        ),
    ),
  };
}

export function parseKnownSkillActionGraphSource(
  value: unknown,
  sourcePath: string,
  inheritedBlackboard: BlackboardLevelValues,
): SkillActionGraphSource<KnownNativeActionLeafSource> {
  return parseSkillActionGraphSource(value, sourcePath, inheritedBlackboard, (leaf, leafPath) =>
    parseKnownNativeActionLeafSource(leaf, leafPath, inheritedBlackboard),
  );
}

export function parseSkillTimelineActionSource<TLeaf>(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
  parseLeaf: NativeLeafParser<TLeaf>,
): SkillTimelineActionSource<TLeaf> {
  const timeline = requireRecord(value, path);
  requireExactFields(
    timeline,
    new Set(['_startFrame', '_endFrame', '_sequenceActionData', 'forceSyncAnimData']),
    path,
  );
  return {
    startFrame: requireNonNegativeInteger(timeline._startFrame, `${path}._startFrame`),
    endFrame: requireNonNegativeInteger(timeline._endFrame, `${path}._endFrame`),
    sequence: parseNativeSequenceSource(
      timeline._sequenceActionData,
      `${path}._sequenceActionData`,
      inheritedBlackboard,
      parseLeaf,
    ),
    forceSyncAnimation: parseForceSyncAnimation(
      timeline.forceSyncAnimData,
      `${path}.forceSyncAnimData`,
    ),
  };
}

function parseForceSyncAnimation(value: unknown, path: string): ForceSyncAnimationSource {
  const source = requireRecord(value, path);
  requireExactFields(
    source,
    new Set(['forceSync', 'montageName', 'targetFrame', 'playbackSpeed']),
    path,
  );
  return {
    forceSync: requireBoolean(source.forceSync, `${path}.forceSync`),
    montageName: requireString(source.montageName, `${path}.montageName`),
    targetFrame: requireNonNegativeInteger(source.targetFrame, `${path}.targetFrame`),
    playbackSpeed: requireNumber(source.playbackSpeed, `${path}.playbackSpeed`),
  };
}

function parsePassiveEvent<TLeaf>(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
  parseLeaf: NativeLeafParser<TLeaf>,
): SkillPassiveEventSource<TLeaf> {
  const event = requireRecord(value, path);
  requireExactFields(event, new Set(['abilityEvent', 'actions']), path);
  const rawAbilityEvent = event.abilityEvent;
  const abilityEvent =
    typeof rawAbilityEvent === 'string'
      ? requireNonEmptyString(rawAbilityEvent, `${path}.abilityEvent`)
      : requireInteger(rawAbilityEvent, `${path}.abilityEvent`);
  return {
    abilityEvent,
    actions: requireArray(event.actions, `${path}.actions`).map((action, index) =>
      parseNativeSequenceSource(
        action,
        `${path}.actions[${index}]`,
        inheritedBlackboard,
        parseLeaf,
      ),
    ),
  };
}
