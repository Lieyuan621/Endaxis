import {
  requireExactFields,
  requireBoolean,
  requireInteger,
  requireNonEmptyString,
  requireNativeEnum,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';

export type ElementalInflictionTypeSource = 'Fire' | 'Pulse' | 'Cryst' | 'Natural';

export interface ElementalInflictionActionSource {
  readonly inverseReaction?: boolean;
  readonly kind: 'elementalInfliction';
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly element: ElementalInflictionTypeSource;
  readonly isExtra: boolean;
}

/** 角色侧元素异常；与敌人 SpellInfliction 的附着/反应状态机严格分开。 */
export interface CharacterSpellInflictionActionSource {
  readonly kind: 'characterSpellInfliction';
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly element: ElementalInflictionTypeSource;
  readonly directToTriggered: boolean;
  readonly count: number;
  readonly countBlackboardKey: string;
  readonly useCountBlackboardKey: boolean;
  readonly ignoreImmuneLevel: 'Default' | 'IgnoreWeakImmune';
  readonly ignoreAddingCooldown: boolean;
}

export interface ForcedElementalStatusActionSource {
  readonly kind: 'forcedElementalStatus';
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly statusElement: ElementalInflictionTypeSource;
  readonly consumedLayers: ScalarSource;
  readonly statusCount: ScalarSource;
  readonly consumedElement: ScalarSource;
  readonly isExtra: boolean;
}

export interface SpellAbnormalLifecycleEventSource {
  readonly kind: 'spellAbnormalLifecycleEvent';
  readonly isStart: boolean;
  readonly abnormalType: ElementalInflictionTypeSource | 'Burst';
}

export interface ForceTriggerWeaknessEventSource {
  readonly kind: 'forceTriggerWeaknessEvent';
  readonly attacker: TargetReferenceSource;
  readonly defender: TargetReferenceSource;
}

export interface SpellInflictionStartedEventSource {
  readonly kind: 'spellInflictionStartedEvent';
  readonly element: ElementalInflictionTypeSource;
}

export interface TriggerSpellBurstEventSource {
  readonly kind: 'triggerSpellBurstEvent';
  readonly element: ElementalInflictionTypeSource;
}

export function parseTriggerSpellBurstEventSource(
  value: unknown,
  path: string,
): TriggerSpellBurstEventSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'spellBurstType',
    ]),
    path,
  );
  const element = requireNonEmptyString(action.spellBurstType, `${path}.spellBurstType`);
  if (!['Fire', 'Pulse', 'Cryst', 'Natural'].includes(element))
    throw new Error(`${path}.spellBurstType: unsupported element ${JSON.stringify(element)}`);
  return { kind: 'triggerSpellBurstEvent', element: element as ElementalInflictionTypeSource };
}

/** OnBuffAfterTryEnhanced 发布 ON_SPELL_INFLICTION(31)；动作本身不改变附着层数。 */
export function parseSpellInflictionStartedEventSource(
  value: unknown,
  path: string,
): SpellInflictionStartedEventSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex', 'type']),
    path,
  );
  const element = requireNonEmptyString(action.type, `${path}.type`);
  if (!['Fire', 'Pulse', 'Cryst', 'Natural', 'Burst'].includes(element))
    throw new Error(`${path}.type: unsupported element ${JSON.stringify(element)}`);
  return { kind: 'spellInflictionStartedEvent', element: element as ElementalInflictionTypeSource };
}

export function parseForceTriggerWeaknessEventSource(
  value: unknown,
  path: string,
): ForceTriggerWeaknessEventSource {
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
      'defender',
    ]),
    path,
  );
  return {
    kind: 'forceTriggerWeaknessEvent',
    attacker: parseTargetReferenceSource(action.attacker, `${path}.attacker`),
    defender: parseTargetReferenceSource(action.defender, `${path}.defender`),
  };
}

/** 发布到 GameLevelEvent/BattleRecorder 的异常状态开始/结束事实，不直接改变战斗状态。 */
export function parseSpellAbnormalLifecycleEventSource(
  value: unknown,
  path: string,
): SpellAbnormalLifecycleEventSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'isStart',
      'abnormalType',
    ]),
    path,
  );
  const element = requireNonEmptyString(action.abnormalType, `${path}.abnormalType`);
  if (!['Fire', 'Pulse', 'Cryst', 'Natural', 'Burst'].includes(element))
    throw new Error(`${path}.abnormalType: unsupported element ${JSON.stringify(element)}`);
  return {
    kind: 'spellAbnormalLifecycleEvent',
    isStart: requireBoolean(action.isStart, `${path}.isStart`),
    abnormalType: element as ElementalInflictionTypeSource | 'Burst',
  };
}

// EnergyShardType 是 0 起始的独立枚举，不是含 Physical 的 DamageType，也不是异常类型枚举。
// Enum=4 是原生成员，但不是 ForceSpellStatusAction 可施加的法术状态。
const ENERGY_SHARD_TYPES = new Map([
  [0, 'Fire'],
  [1, 'Pulse'],
  [2, 'Cryst'],
  [3, 'Natural'],
  [4, 'Enum'],
] as const);

export function parseForcedElementalStatusActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): ForcedElementalStatusActionSource {
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
      'spellStatusType',
      'consumedLayer',
      'count',
      'consumedType',
      'isExtra',
    ]),
    path,
  );
  const statusElement = requireNativeEnum(
    action.spellStatusType,
    ENERGY_SHARD_TYPES,
    `${path}.spellStatusType`,
  );
  if (statusElement === 'Enum') {
    throw new Error(
      `${path}.spellStatusType: unsupported element ${JSON.stringify(statusElement)}`,
    );
  }
  return {
    kind: 'forcedElementalStatus',
    source: parseTargetReferenceSource(action.source, `${path}.source`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    statusElement,
    consumedLayers: parseScalarSource(
      action.consumedLayer,
      `${path}.consumedLayer`,
      inheritedBlackboard,
    ),
    statusCount: parseScalarSource(action.count, `${path}.count`, inheritedBlackboard),
    consumedElement: parseScalarSource(
      action.consumedType,
      `${path}.consumedType`,
      inheritedBlackboard,
    ),
    isExtra: requireBoolean(action.isExtra, `${path}.isExtra`),
  };
}

/**
 * 严格读取 SpellInfliction 的原生载荷。动作会进入元素附着生命周期，
 * 不能像表现或空间动作一样省略。
 */
export function parseElementalInflictionActionSource(
  value: unknown,
  path: string,
): ElementalInflictionActionSource {
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
      'inflictionType',
      'isExtra',
    ]),
    path,
  );
  const element = requireNonEmptyString(action.inflictionType, `${path}.inflictionType`);
  if (!['Fire', 'Pulse', 'Cryst', 'Natural'].includes(element))
    throw new Error(
      `${path}.inflictionType: unsupported elemental infliction ${JSON.stringify(element)}`,
    );
  return {
    kind: 'elementalInfliction',
    source: parseTargetReferenceSource(action.source, `${path}.source`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    element: element as ElementalInflictionTypeSource,
    isExtra: requireBoolean(action.isExtra, `${path}.isExtra`),
  };
}

/**
 * 完整保留角色法术异常动作的原生载荷。
 * 场景能否省略由投影层结合 owner/source/target 证明，来源层不吞语义。
 */
export function parseCharacterSpellInflictionActionSource(
  value: unknown,
  path: string,
): CharacterSpellInflictionActionSource {
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
      'inflictionType',
      'directToTriggerred',
      'inflictionCount',
      'inflictionCountBlackboardKey',
      'useInflictionCountBlackboardKey',
      'ignoreImmuneLevel',
      'ignoreAddingCooldown',
    ]),
    path,
  );
  const element = requireNonEmptyString(action.inflictionType, `${path}.inflictionType`);
  if (!['Fire', 'Pulse', 'Cryst', 'Natural'].includes(element)) {
    throw new Error(
      `${path}.inflictionType: unsupported character spell infliction ${JSON.stringify(element)}`,
    );
  }
  const ignoreImmuneLevel = requireNonEmptyString(
    action.ignoreImmuneLevel,
    `${path}.ignoreImmuneLevel`,
  );
  if (!['Default', 'IgnoreWeakImmune'].includes(ignoreImmuneLevel)) {
    throw new Error(
      `${path}.ignoreImmuneLevel: unsupported value ${JSON.stringify(ignoreImmuneLevel)}`,
    );
  }
  const count = requireInteger(action.inflictionCount, `${path}.inflictionCount`);
  if (count < 0) throw new Error(`${path}.inflictionCount: expected non-negative integer`);
  return {
    kind: 'characterSpellInfliction',
    source: parseTargetReferenceSource(action.source, `${path}.source`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    element: element as ElementalInflictionTypeSource,
    directToTriggered: requireBoolean(action.directToTriggerred, `${path}.directToTriggerred`),
    count,
    countBlackboardKey: requireString(
      action.inflictionCountBlackboardKey,
      `${path}.inflictionCountBlackboardKey`,
    ),
    useCountBlackboardKey: requireBoolean(
      action.useInflictionCountBlackboardKey,
      `${path}.useInflictionCountBlackboardKey`,
    ),
    ignoreImmuneLevel: ignoreImmuneLevel as 'Default' | 'IgnoreWeakImmune',
    ignoreAddingCooldown: requireBoolean(
      action.ignoreAddingCooldown,
      `${path}.ignoreAddingCooldown`,
    ),
  };
}
