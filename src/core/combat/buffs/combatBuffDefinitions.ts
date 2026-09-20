// 纯数据契约由独立包唯一声明；此路径保留兼容导出。
export {
  COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
  type CombatBuffDefinitionAction,
  type CombatBuffDefinitionAttributeModifier,
  type CombatBuffDefinitionAttributeSelector,
  type CombatBuffDefinitionAttributeStage,
  type CombatBuffDefinitionDamageModifier,
  type CombatBuffDefinitionDamageProcessor,
  type CombatBuffDefinitionEntry,
  type CombatBuffDefinitionLifecycleActions,
  type CombatBuffDefinitionNumberOperand,
  type CombatBuffDefinitionsDocument,
  type CombatBuffSemanticRole,
  type CombatBuffSpellBurstDefinition,
} from '../../../../packages/game-data-contract/src/buffs.ts';
import {
  COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
  type CombatBuffDefinitionAction,
  type CombatBuffDefinitionAttributeModifier,
  type CombatBuffDefinitionAttributeSelector,
  type CombatBuffDefinitionAttributeStage,
  type CombatBuffDefinitionDamageModifier,
  type CombatBuffDefinitionDamageProcessor,
  type CombatBuffDefinitionEntry,
  type CombatBuffDefinitionLifecycleActions,
  type CombatBuffDefinitionNumberOperand,
  type CombatBuffDefinitionsDocument,
  type CombatBuffSemanticRole,
  type CombatBuffSpellBurstDefinition,
} from '../../../../packages/game-data-contract/src/buffs.ts';
/**
 * 外部 Buff 数据进入通用 Buff 运行时前的语义化定义边界。
 * 数据源必须先转换为这里支持的原语；未知原生行为不能以回调或静默缺省方式穿透。
 */
import {
  COMPARISON_OPERATORS,
  DAMAGE_FEATURES,
  DAMAGE_TAGS,
  DAMAGE_TYPES,
  INFLICTION_ELEMENTS,
  type DamageFeature,
  type DamageTag,
  type DamageType,
  type InflictionElement,
} from '../../game-data/operatorDefinition';
import type { ActionBlackboardValue } from '../actions/actionBlackboard';
import { ATTRIBUTE_MODIFIER_SLOTS, attributeModifierValues } from '../attributes/combatAttributes';
import { ATTRIBUTE_MODIFIER_SOURCES } from '../state/foundationState';
import type { DamageModifierCondition } from '../damage/damageModifiers';
import { DAMAGE_SCALE_SIDES, DAMAGE_SCALE_ZONES } from '../damage/damageScale';
import { DAMAGE_MODIFIER_SIDES } from '../damage/playerDamageContext';
import type { PoiseModifierCondition, PoiseModifierDefinition } from '../damage/poiseModifiers';
import type { HealModifierDefinition } from '../heal/healModifiers';
import type {
  ElementalInflictionBuffIndex,
  ElementalInflictionStartedPayload,
} from '../infliction/elementalInflictionBuffAdapter';
import { createElementalAttachmentLifecycleActions } from '../infliction/elementalInflictionBuffAdapter';
import { assertGameplayTag } from '../tags/gameplayTags';
import type {
  BuffLifecycleActions,
  BuffPriority,
  BuffShieldDefinition,
  BuffSustainedProtectionDefinition,
  BuffTriggerCount,
  CombatBuff,
  CombatBuffDefinition,
  CombatBuffPresentation,
} from './combatBuffs';
import { BUFF_STACKING_TYPES } from './combatBuffs';

/** 执行器向战斗装配层提出的读取请求，不属于生成数据契约。 */
export interface CombatBuffDefinitionAttributeReadRequest {
  readonly target: 'source';
  readonly attribute: CombatBuffDefinitionAttributeSelector;
  readonly stage: CombatBuffDefinitionAttributeStage;
}

/** 把定义语义角色和动作编译为核心定义时使用的受控端口。 */
export interface CombatBuffDefinitionCompilerPorts<Key extends string> {
  readonly emitElementalInflictionStarted: (
    payload: ElementalInflictionStartedPayload,
    buff: CombatBuff<Key>,
  ) => void;
  /**
   * 读取动作来源实体的属性阶段值。实体定位、主副属性映射和排除 Converted 修正均由装配层负责；
   * index 编译器只负责 StoreAttributeValue 已确认的算式和当前 Buff 黑板生命周期。
   */
  readonly readAttribute?: (
    request: CombatBuffDefinitionAttributeReadRequest,
    buff: CombatBuff<Key>,
  ) => number;
  /** 法术爆发触发端口；爆发 Buff 存在该动作时必须提供。 */
  readonly onSpellBurstTriggered?: (payload: {
    readonly burstType: string;
    readonly sourceId: string;
    readonly skillCastInfo?: import('../state/foundationState').CombatSkillCastInfo;
  }) => void;
  /** 伤害动作携带执行实例身份，供实际伤害回执关联生命周期；不是按元素推测的来源。 */
  readonly onAttackScaledDamageTriggered?: (payload: {
    readonly damageType: DamageType;
    readonly attackScale: number;
    readonly tags: readonly DamageTag[];
    readonly features: readonly DamageFeature[];
    readonly canCritical: boolean;
    readonly sourceId: string;
    readonly skillCastInfo?: import('../state/foundationState').CombatSkillCastInfo;
    readonly buffId: string;
    readonly buffInstanceId: number;
    readonly buffOwnerId: string;
    readonly sourceActionId: string;
  }) => void;
}

/** 元素附着运行时适配器使用的已编译索引。 */
export class CompiledCombatBuffDefinitions<
  Key extends string,
> implements ElementalInflictionBuffIndex<Key> {
  readonly #definitions = new Map<string, CombatBuffDefinition<Key>>();
  readonly #attachmentElements = new Map<CombatBuffDefinition<Key>, InflictionElement>();
  readonly #attachments = new Map<InflictionElement, CombatBuffDefinition<Key>>();
  readonly #bursts = new Map<InflictionElement, CombatBuffDefinition<Key>>();
  readonly #compoundStatuses = new Map<string, CombatBuffDefinition<Key>>();
  readonly #spellBursts = new Map<string, CombatBuffSpellBurstDefinition>();
  readonly #spellBurstBuffIds = new Map<string, string>();

  constructor(
    readonly revision: string,
    entries: readonly CombatBuffDefinitionEntry[],
    ports: CombatBuffDefinitionCompilerPorts<Key>,
  ) {
    for (const entry of entries) this.register(entry, ports);
  }

  get(id: string): CombatBuffDefinition<Key> | undefined {
    return this.#definitions.get(id);
  }

  getAttachmentElement(definition: CombatBuffDefinition<Key>): InflictionElement | null {
    return this.#attachmentElements.get(definition) ?? null;
  }

  getAttachment(element: InflictionElement): CombatBuffDefinition<Key> {
    return requireRole(this.#attachments, element, `elemental attachment '${element}'`);
  }

  getBurst(element: InflictionElement): CombatBuffDefinition<Key> {
    return requireRole(this.#bursts, element, `elemental burst '${element}'`);
  }

  getCompoundStatus(
    consumedElement: InflictionElement,
    incomingElement: InflictionElement,
  ): CombatBuffDefinition<Key> {
    const key = compoundStatusKey(consumedElement, incomingElement);
    return requireRole(
      this.#compoundStatuses,
      key,
      `compound status '${consumedElement}->${incomingElement}'`,
    );
  }

  private register(
    entry: CombatBuffDefinitionEntry,
    ports: CombatBuffDefinitionCompilerPorts<Key>,
  ): void {
    if (entry.id.length === 0) throw new Error('buff definition entry id must not be empty');
    if (this.#definitions.has(entry.id)) {
      throw new Error(`duplicate buff definition entry '${entry.id}'`);
    }
    const definition: CombatBuffDefinition<Key> = {
      id: entry.id,
      affixSkillCastIdentity: entry.affixSkillCastIdentity,
      presentation: entry.presentation,
      childPresentations: entry.childPresentations,
      timeClock: entry.timeClock,
      applyTags: entry.applyTags,
      extendTags: entry.extendTags,
      stackingType: entry.stackingType,
      stackingKey: entry.stackingKey,
      priority: entry.priority,
      maxStackCount: entry.maxStackCount,
      durationSeconds: entry.durationSeconds,
      addingCooldownSeconds: entry.addingCooldownSeconds,
      ignoreAddingCooldown: entry.ignoreAddingCooldown,
      triggerIntervalSeconds: entry.triggerIntervalSeconds,
      waitFirstTriggerInterval: entry.waitFirstTriggerInterval,
      maxTriggerCount: entry.maxTriggerCount,
      blackboard: entry.blackboard,
      attributeModifiers: entry.attributeModifiers?.map(modifier => ({
        attribute: modifier.attribute as Key,
        target: modifier.target,
        values:
          typeof modifier.value === 'number'
            ? attributeModifierValues(modifier.slot, modifier.value)
            : { slot: modifier.slot, blackboardKey: modifier.value.blackboardKey },
        timing: 'runtime',
        source:
          modifier.source === 'converted'
            ? ATTRIBUTE_MODIFIER_SOURCES.converted
            : ATTRIBUTE_MODIFIER_SOURCES.buff,
      })),
      damageModifiers: entry.damageModifiers,
      keywordEnhancements: entry.keywordEnhancements,
      healModifiers: entry.healModifiers,
      poiseModifiers: entry.poiseModifiers,
      shields: entry.shields,
      sustainedProtection: entry.sustainedProtection,
      actions: compileLifecycleActions(entry, ports),
    };
    this.#definitions.set(entry.id, definition);
    this.registerRole(entry.role, definition);
    this.registerSpellBurst(entry.spellBurst, entry.id);
  }

  /** 按原生爆发类型查找爆发伤害参数；定义没有该爆发时返回 null。 */
  getSpellBurst(burstType: string): CombatBuffSpellBurstDefinition | null {
    return this.#spellBursts.get(burstType) ?? null;
  }

  private registerSpellBurst(
    definition: CombatBuffSpellBurstDefinition | undefined,
    buffId: string,
  ): void {
    if (definition === undefined) return;
    const existingBuff = this.#spellBurstBuffIds.get(definition.burstType);
    if (existingBuff !== undefined) {
      throw new Error(
        `spell burst '${definition.burstType}' is declared by both buffs '${existingBuff}' and '${buffId}'`,
      );
    }
    this.#spellBurstBuffIds.set(definition.burstType, buffId);
    this.#spellBursts.set(definition.burstType, definition);
  }

  private registerRole(
    role: CombatBuffSemanticRole | undefined,
    definition: CombatBuffDefinition<Key>,
  ): void {
    if (role === undefined) return;
    switch (role.kind) {
      case 'elementalAttachment':
        registerUniqueRole(this.#attachments, role.element, definition, role.kind);
        this.#attachmentElements.set(definition, role.element);
        return;
      case 'elementalBurst':
        registerUniqueRole(this.#bursts, role.element, definition, role.kind);
        return;
      case 'compoundStatus': {
        const key = compoundStatusKey(role.consumedElement, role.incomingElement);
        registerUniqueRole(this.#compoundStatuses, key, definition, role.kind);
        return;
      }
    }
  }
}

export function compileCombatBuffDefinitions<Key extends string>(
  document: CombatBuffDefinitionsDocument,
  ports: CombatBuffDefinitionCompilerPorts<Key>,
): CompiledCombatBuffDefinitions<Key> {
  if (document.schemaVersion !== COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION) {
    throw new Error(
      `unsupported combat buff definition schema version '${document.schemaVersion}'`,
    );
  }
  if (document.revision.length === 0) throw new Error('buff definition revision must not be empty');
  return new CompiledCombatBuffDefinitions(document.revision, document.buffs, ports);
}

/** 生成或外部存储的语义定义进入核心前的严格 JSON 边界。 */
/** 严格解析一项可序列化 Buff 定义，供外部文档和技能内联定义共用。 */
export function parseCombatBuffDefinitionEntry(
  input: unknown,
  path = '$',
): CombatBuffDefinitionEntry {
  const entry = requireObject(input, path);
  requireOnlyKeys(entry, path, [
    'id',
    'affixSkillCastIdentity',
    'presentation',
    'childPresentations',
    'timeClock',
    'applyTags',
    'extendTags',
    'stackingType',
    'stackingKey',
    'priority',
    'maxStackCount',
    'durationSeconds',
    'addingCooldownSeconds',
    'ignoreAddingCooldown',
    'triggerIntervalSeconds',
    'waitFirstTriggerInterval',
    'maxTriggerCount',
    'blackboard',
    'attributeModifiers',
    'damageModifiers',
    'keywordEnhancements',
    'healModifiers',
    'poiseModifiers',
    'shields',
    'sustainedProtection',
    'role',
    'actions',
    'spellBurst',
  ]);
  const stackingType = requireEnum(entry.stackingType, BUFF_STACKING_TYPES, `${path}.stackingType`);
  return {
    id: requireNonEmptyString(entry.id, `${path}.id`),
    ...(entry.affixSkillCastIdentity === undefined
      ? {}
      : {
          affixSkillCastIdentity: requireEnum(
            entry.affixSkillCastIdentity,
            ['sourceSkillCast'] as const,
            `${path}.affixSkillCastIdentity`,
          ),
        }),
    ...parseOptionalPresentation(entry, path),
    ...parseOptionalChildPresentations(entry, path),
    ...(entry.timeClock === undefined
      ? {}
      : {
          timeClock: requireEnum(
            entry.timeClock,
            ['default', 'global', 'self'] as const,
            `${path}.timeClock`,
          ),
        }),
    ...parseOptionalGameplayTags(entry, 'applyTags', path),
    ...parseOptionalGameplayTags(entry, 'extendTags', path),
    stackingType,
    ...parseOptionalString(entry, 'stackingKey', path),
    ...parseOptionalPriority(entry, path),
    ...parseOptionalNonNegativeInteger(entry, 'maxStackCount', path),
    ...parseOptionalScalar(entry, 'durationSeconds', path),
    ...parseOptionalScalar(entry, 'addingCooldownSeconds', path),
    ...parseOptionalBoolean(entry, 'ignoreAddingCooldown', path),
    ...parseOptionalScalar(entry, 'triggerIntervalSeconds', path),
    ...parseOptionalBoolean(entry, 'waitFirstTriggerInterval', path),
    ...parseOptionalTriggerCount(entry, path),
    ...parseOptionalBlackboard(entry, path),
    ...parseOptionalAttributeModifiers(entry, path),
    ...parseOptionalDamageModifiers(entry, path),
    ...parseOptionalKeywordEnhancements(entry, path),
    ...parseOptionalHealModifiers(entry, path),
    ...parseOptionalPoiseModifiers(entry, path),
    ...parseOptionalShields(entry, path),
    ...parseOptionalSustainedProtection(entry, path),
    ...parseOptionalRole(entry, path),
    ...parseOptionalActions(entry, path),
    ...parseOptionalSpellBurst(entry, path),
  };
}

function parseOptionalChildPresentations(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { childPresentations?: CombatBuffDefinitionEntry['childPresentations'] } {
  if (entry.childPresentations === undefined) return {};
  if (!Array.isArray(entry.childPresentations)) {
    throw new Error(`${path}.childPresentations: expected array`);
  }
  return {
    childPresentations: entry.childPresentations.map((value, index) => {
      const childPath = `${path}.childPresentations[${index}]`;
      const child = requireObject(value, childPath);
      requireOnlyKeys(child, childPath, ['buffId', 'presentation']);
      const parsed = parseOptionalPresentation(child, childPath);
      if (parsed.presentation === undefined) {
        throw new Error(`${childPath}.presentation: required`);
      }
      return {
        buffId: requireNonEmptyString(child.buffId, `${childPath}.buffId`),
        presentation: parsed.presentation,
      };
    }),
  };
}

function parseOptionalPresentation(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { presentation?: CombatBuffPresentation } {
  if (entry.presentation === undefined) return {};
  const presentationPath = `${path}.presentation`;
  const input = requireObject(entry.presentation, presentationPath);
  requireOnlyKeys(input, presentationPath, [
    'iconId',
    'iconPath',
    'visible',
    'showInHeadBarCommon',
    'showInHeadBarAttached',
    'showInSquadIcon',
    'onlyShowForMainCharacter',
    'blinkInMainCharHpBar',
    'showProgressInHpBar',
    'showProgressInNormalSkillButton',
    'useWeakProgressInNormalSkillButton',
    'showProgressInUltimateSkillButton',
    'forceRaiseIconEvent',
    'showWarningBackground',
    'playStrongInAnimation',
    'hasCharHpBarVfxType',
    'charHpBarVfxType',
    'iconStyleInSquad',
    'abnormalColorType',
    'orderPriority',
  ]);
  const optionalString = (
    key: 'iconId' | 'iconPath' | 'charHpBarVfxType' | 'iconStyleInSquad' | 'abnormalColorType',
  ) =>
    input[key] === undefined
      ? {}
      : { [key]: requireNonEmptyString(input[key], `${presentationPath}.${key}`) };
  const optionalBoolean = (
    key:
      | 'visible'
      | 'showInHeadBarCommon'
      | 'showInHeadBarAttached'
      | 'showInSquadIcon'
      | 'onlyShowForMainCharacter'
      | 'blinkInMainCharHpBar'
      | 'showProgressInHpBar'
      | 'showProgressInNormalSkillButton'
      | 'useWeakProgressInNormalSkillButton'
      | 'showProgressInUltimateSkillButton'
      | 'forceRaiseIconEvent'
      | 'showWarningBackground'
      | 'playStrongInAnimation'
      | 'hasCharHpBarVfxType',
  ) =>
    input[key] === undefined
      ? {}
      : { [key]: requireBoolean(input[key], `${presentationPath}.${key}`) };
  let orderPriority: CombatBuffPresentation['orderPriority'];
  if (input.orderPriority !== undefined) {
    const orderPath = `${presentationPath}.orderPriority`;
    const order = requireObject(input.orderPriority, orderPath);
    requireOnlyKeys(order, orderPath, ['useDirectoryValue', 'value', 'category']);
    orderPriority = {
      useDirectoryValue: requireBoolean(order.useDirectoryValue, `${orderPath}.useDirectoryValue`),
      value: requireFiniteNumber(order.value, `${orderPath}.value`),
      category: requireNonEmptyString(order.category, `${orderPath}.category`),
    };
  }
  return {
    presentation: {
      ...optionalString('iconId'),
      ...optionalString('iconPath'),
      ...optionalBoolean('visible'),
      ...optionalBoolean('showInHeadBarCommon'),
      ...optionalBoolean('showInHeadBarAttached'),
      ...optionalBoolean('showInSquadIcon'),
      ...optionalBoolean('onlyShowForMainCharacter'),
      ...optionalBoolean('blinkInMainCharHpBar'),
      ...optionalBoolean('showProgressInHpBar'),
      ...optionalBoolean('showProgressInNormalSkillButton'),
      ...optionalBoolean('useWeakProgressInNormalSkillButton'),
      ...optionalBoolean('showProgressInUltimateSkillButton'),
      ...optionalBoolean('forceRaiseIconEvent'),
      ...optionalBoolean('showWarningBackground'),
      ...optionalBoolean('playStrongInAnimation'),
      ...optionalBoolean('hasCharHpBarVfxType'),
      ...optionalString('charHpBarVfxType'),
      ...optionalString('iconStyleInSquad'),
      ...optionalString('abnormalColorType'),
      ...(orderPriority === undefined ? {} : { orderPriority }),
    },
  };
}

function parseOptionalShields(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { shields?: readonly BuffShieldDefinition[] } {
  if (entry.shields === undefined) return {};
  if (!Array.isArray(entry.shields)) throw new Error(`${path}.shields: expected array`);
  return {
    shields: entry.shields.map((input, index) => {
      const shieldPath = `${path}.shields[${index}]`;
      const shield = requireObject(input, shieldPath);
      requireOnlyKeys(shield, shieldPath, [
        'infinityValue',
        'value',
        'damageAbsorptions',
        'absorbCount',
        'absorbAllDamageWhenConsumed',
        'removeBuffWhenConsumed',
        'priority',
        'replaceHitEffect',
      ]);
      if (!Array.isArray(shield.damageAbsorptions)) {
        throw new Error(`${shieldPath}.damageAbsorptions: expected array`);
      }
      return {
        infinityValue: requireBoolean(shield.infinityValue, `${shieldPath}.infinityValue`),
        value: parseShieldValue(shield.value, `${shieldPath}.value`),
        damageAbsorptions: shield.damageAbsorptions.map((raw, absorptionIndex) => {
          const absorptionPath = `${shieldPath}.damageAbsorptions[${absorptionIndex}]`;
          const absorption = requireObject(raw, absorptionPath);
          requireOnlyKeys(absorption, absorptionPath, ['damageType', 'ratio', 'scale']);
          return {
            damageType: requireEnum(
              absorption.damageType,
              DAMAGE_TYPES,
              `${absorptionPath}.damageType`,
            ),
            ratio: parseDefinitionNumberOperand(absorption.ratio, `${absorptionPath}.ratio`),
            scale: parseDefinitionNumberOperand(absorption.scale, `${absorptionPath}.scale`),
          };
        }),
        absorbCount: parseDefinitionIntegerOperand(shield.absorbCount, `${shieldPath}.absorbCount`),
        absorbAllDamageWhenConsumed: requireBoolean(
          shield.absorbAllDamageWhenConsumed,
          `${shieldPath}.absorbAllDamageWhenConsumed`,
        ),
        removeBuffWhenConsumed: requireBoolean(
          shield.removeBuffWhenConsumed,
          `${shieldPath}.removeBuffWhenConsumed`,
        ),
        priority: requireEnum(
          shield.priority,
          ['normal', 'prioritizeConsume'] as const,
          `${shieldPath}.priority`,
        ),
        replaceHitEffect: requireBoolean(shield.replaceHitEffect, `${shieldPath}.replaceHitEffect`),
      };
    }),
  };
}

function parseShieldValue(value: unknown, path: string): BuffShieldDefinition['value'] {
  if (typeof value === 'object' && value !== null && 'attribute' in value) {
    const calculation = requireObject(value, path);
    requireOnlyKeys(calculation, path, ['attributeSource', 'attribute', 'multiplier', 'addition']);
    const attributeSource =
      calculation.attributeSource === undefined
        ? undefined
        : requireEnum(
            calculation.attributeSource,
            ['buffOwner', 'buffSource'] as const,
            `${path}.attributeSource`,
          );
    return {
      ...(attributeSource === undefined ? {} : { attributeSource }),
      attribute: requireNonEmptyString(calculation.attribute, `${path}.attribute`),
      multiplier: parseDefinitionNumberOperand(calculation.multiplier, `${path}.multiplier`),
      addition: parseDefinitionNumberOperand(calculation.addition, `${path}.addition`),
    };
  }
  return parseDefinitionNumberOperand(value, path);
}

function parseOptionalSustainedProtection(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { sustainedProtection?: BuffSustainedProtectionDefinition } {
  if (entry.sustainedProtection === undefined) return {};
  const protectionPath = `${path}.sustainedProtection`;
  const protection = requireObject(entry.sustainedProtection, protectionPath);
  requireOnlyKeys(protection, protectionPath, ['target', 'superArmor', 'impactResistance']);
  return {
    sustainedProtection: {
      target: requireEnum(
        protection.target,
        ['owner', 'buffSource'] as const,
        `${protectionPath}.target`,
      ),
      superArmor: parseDefinitionNumberOperand(
        protection.superArmor,
        `${protectionPath}.superArmor`,
      ),
      impactResistance: parseDefinitionNumberOperand(
        protection.impactResistance,
        `${protectionPath}.impactResistance`,
      ),
    },
  };
}

function parseOptionalDamageModifiers(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { damageModifiers?: readonly CombatBuffDefinitionDamageModifier[] } {
  if (entry.damageModifiers === undefined) return {};
  if (!Array.isArray(entry.damageModifiers)) {
    throw new Error(`${path}.damageModifiers: expected array`);
  }
  return {
    damageModifiers: entry.damageModifiers.map((input, index) => {
      const modifierPath = `${path}.damageModifiers[${index}]`;
      const modifier = requireObject(input, modifierPath);
      requireOnlyKeys(modifier, modifierPath, ['enabledSide', 'condition', 'processors']);
      if (!Array.isArray(modifier.processors)) {
        throw new Error(`${modifierPath}.processors: expected array`);
      }
      return {
        enabledSide: requireEnum(
          modifier.enabledSide,
          DAMAGE_MODIFIER_SIDES,
          `${modifierPath}.enabledSide`,
        ),
        ...(modifier.condition === undefined
          ? {}
          : {
              condition: parseDamageModifierCondition(
                modifier.condition,
                `${modifierPath}.condition`,
              ),
            }),
        processors: modifier.processors.map((processor, processorIndex) =>
          parseDamageModifierProcessor(processor, `${modifierPath}.processors[${processorIndex}]`),
        ),
      };
    }),
  };
}

function parseOptionalKeywordEnhancements(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { keywordEnhancements?: readonly import('./combatBuffs').BuffKeywordEnhancementDefinition[] } {
  if (entry.keywordEnhancements === undefined) return {};
  if (!Array.isArray(entry.keywordEnhancements)) {
    throw new Error(`${path}.keywordEnhancements: expected array`);
  }
  return {
    keywordEnhancements: entry.keywordEnhancements.map((input, index) => {
      const itemPath = `${path}.keywordEnhancements[${index}]`;
      const item = requireObject(input, itemPath);
      requireOnlyKeys(item, itemPath, [
        'triggerBuffIds',
        'operation',
        'targetKey',
        'initialValue',
        'value',
      ]);
      if (!Array.isArray(item.triggerBuffIds) || item.triggerBuffIds.length === 0) {
        throw new Error(`${itemPath}.triggerBuffIds: expected non-empty array`);
      }
      return {
        triggerBuffIds: item.triggerBuffIds.map((value, idIndex) =>
          requireNonEmptyString(value, `${itemPath}.triggerBuffIds[${idIndex}]`),
        ),
        operation: requireEnum(
          item.operation,
          ['assign', 'add', 'multiply'] as const,
          `${itemPath}.operation`,
        ),
        targetKey: requireNonEmptyString(item.targetKey, `${itemPath}.targetKey`),
        initialValue: parseDefinitionNumberOperand(item.initialValue, `${itemPath}.initialValue`),
        value: parseDefinitionNumberOperand(item.value, `${itemPath}.value`),
      };
    }),
  };
}

function parseOptionalHealModifiers(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { healModifiers?: readonly HealModifierDefinition[] } {
  if (entry.healModifiers === undefined) return {};
  if (!Array.isArray(entry.healModifiers)) {
    throw new Error(`${path}.healModifiers: expected array`);
  }
  return {
    healModifiers: entry.healModifiers.map((input, index) => {
      const modifierPath = `${path}.healModifiers[${index}]`;
      const modifier = requireObject(input, modifierPath);
      requireOnlyKeys(modifier, modifierPath, ['enabledSide', 'condition', 'processors']);
      if (!Array.isArray(modifier.processors) || modifier.processors.length === 0) {
        throw new Error(`${modifierPath}.processors: expected non-empty array`);
      }
      return {
        enabledSide: requireEnum(
          modifier.enabledSide,
          ['healer', 'receiver'] as const,
          `${modifierPath}.enabledSide`,
        ),
        ...(modifier.condition === undefined
          ? {}
          : {
              condition: parseHealModifierCondition(
                modifier.condition,
                `${modifierPath}.condition`,
              ),
            }),
        processors: modifier.processors.map((inputProcessor, processorIndex) => {
          const processorPath = `${modifierPath}.processors[${processorIndex}]`;
          const processor = requireObject(inputProcessor, processorPath);
          if (processor.kind === 'modifyHealingIncrease') {
            requireOnlyKeys(processor, processorPath, ['kind', 'timing', 'side', 'addition']);
            return {
              kind: 'modifyHealingIncrease' as const,
              timing: requireEnum(
                processor.timing,
                ['beforeCalculation'] as const,
                `${processorPath}.timing`,
              ),
              side: requireEnum(
                processor.side,
                ['healer', 'receiver'] as const,
                `${processorPath}.side`,
              ),
              addition: parseDefinitionNumberOperand(
                processor.addition,
                `${processorPath}.addition`,
              ),
            };
          }
          requireOnlyKeys(processor, processorPath, [
            'kind',
            'timing',
            'baseMultiplier',
            'multiplierCount',
          ]);
          if (processor.kind !== 'modifyCalculationResult')
            throw new Error(`${processorPath}.kind: unsupported heal processor`);
          return {
            kind: 'modifyCalculationResult' as const,
            timing: requireEnum(
              processor.timing,
              ['afterCalculation'] as const,
              `${processorPath}.timing`,
            ),
            baseMultiplier: parseDefinitionNumberOperand(
              processor.baseMultiplier,
              `${processorPath}.baseMultiplier`,
            ),
            multiplierCount: parseDefinitionNumberOperand(
              processor.multiplierCount,
              `${processorPath}.multiplierCount`,
            ),
          };
        }),
      };
    }),
  };
}

function parseHealModifierCondition(
  input: unknown,
  path: string,
): NonNullable<HealModifierDefinition['condition']> {
  const condition = requireObject(input, path);
  if (condition.kind === 'healTagsMatch') {
    requireOnlyKeys(condition, path, ['kind', 'match', 'tags']);
    if (!Array.isArray(condition.tags)) throw new Error(`${path}.tags: expected array`);
    return {
      kind: 'healTagsMatch',
      match: requireEnum(condition.match, ['hasAny', 'hasAll'] as const, `${path}.match`),
      tags: condition.tags.map((tagId, index) => parseGameplayTag(tagId, `${path}.tags[${index}]`)),
    };
  }
  if (condition.kind === 'targetHealthCompare') {
    requireOnlyKeys(condition, path, ['kind', 'valueType', 'operator', 'value']);
    return {
      kind: 'targetHealthCompare',
      valueType: requireEnum(
        condition.valueType,
        ['current', 'ratio'] as const,
        `${path}.valueType`,
      ),
      operator: requireEnum(condition.operator, COMPARISON_OPERATORS, `${path}.operator`),
      value: parseDefinitionNumberOperand(condition.value, `${path}.value`),
    };
  }
  if (condition.kind === 'buffBlackboardCompare') {
    requireOnlyKeys(condition, path, ['kind', 'left', 'operator', 'right']);
    return {
      kind: 'buffBlackboardCompare',
      left: parseDefinitionNumberOperand(condition.left, `${path}.left`),
      operator: requireEnum(condition.operator, COMPARISON_OPERATORS, `${path}.operator`),
      right: parseDefinitionNumberOperand(condition.right, `${path}.right`),
    };
  }
  throw new Error(`${path}.kind: unsupported heal modifier condition '${String(condition.kind)}'`);
}

function parseOptionalPoiseModifiers(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { poiseModifiers?: readonly PoiseModifierDefinition[] } {
  if (entry.poiseModifiers === undefined) return {};
  if (!Array.isArray(entry.poiseModifiers)) {
    throw new Error(`${path}.poiseModifiers: expected array`);
  }
  return {
    poiseModifiers: entry.poiseModifiers.map((input, index) => {
      const modifierPath = `${path}.poiseModifiers[${index}]`;
      const modifier = requireObject(input, modifierPath);
      requireOnlyKeys(modifier, modifierPath, ['enabledSide', 'condition', 'processors']);
      if (!Array.isArray(modifier.processors) || modifier.processors.length === 0) {
        throw new Error(`${modifierPath}.processors: expected non-empty array`);
      }
      return {
        enabledSide: requireEnum(
          modifier.enabledSide,
          ['attacker', 'defender'] as const,
          `${modifierPath}.enabledSide`,
        ),
        ...(modifier.condition === undefined
          ? {}
          : {
              condition: parsePoiseModifierCondition(
                modifier.condition,
                `${modifierPath}.condition`,
              ),
            }),
        processors: modifier.processors.map((inputProcessor, processorIndex) => {
          const processorPath = `${modifierPath}.processors[${processorIndex}]`;
          const processor = requireObject(inputProcessor, processorPath);
          requireOnlyKeys(processor, processorPath, ['kind', 'timing', 'side', 'addition']);
          if (processor.kind !== 'modifyPoiseScalar') {
            throw new Error(`${processorPath}.kind: unsupported poise processor`);
          }
          return {
            kind: 'modifyPoiseScalar' as const,
            timing: requireEnum(
              processor.timing,
              ['beforeCalculation'] as const,
              `${processorPath}.timing`,
            ),
            side: requireEnum(
              processor.side,
              ['attacker', 'defender'] as const,
              `${processorPath}.side`,
            ),
            addition: parseDefinitionNumberOperand(processor.addition, `${processorPath}.addition`),
          };
        }),
      };
    }),
  };
}

function parsePoiseModifierCondition(input: unknown, path: string): PoiseModifierCondition {
  const condition = requireObject(input, path);
  if (condition.kind === 'casterControlled') {
    requireOnlyKeys(condition, path, ['kind']);
    return { kind: 'casterControlled' };
  }
  if (condition.kind === 'eventDamageTagsMatch') {
    requireOnlyKeys(condition, path, ['kind', 'match', 'tags']);
    return {
      kind: 'eventDamageTagsMatch',
      match: requireEnum(condition.match, ['hasAny', 'hasAll'] as const, `${path}.match`),
      tags: parseEnumArray(condition.tags, DAMAGE_TAGS, `${path}.tags`),
    };
  }
  if (condition.kind === 'all') {
    requireOnlyKeys(condition, path, ['kind', 'conditions']);
    if (!Array.isArray(condition.conditions) || condition.conditions.length === 0) {
      throw new Error(`${path}.conditions: expected non-empty array`);
    }
    return {
      kind: 'all',
      conditions: condition.conditions.map((child, index) =>
        parsePoiseModifierCondition(child, `${path}.conditions[${index}]`),
      ),
    };
  }
  throw new Error(`${path}.kind: unsupported poise modifier condition '${String(condition.kind)}'`);
}

function parseDamageModifierCondition(input: unknown, path: string): DamageModifierCondition {
  const condition = requireObject(input, path);
  switch (condition.kind) {
    case 'entityTagMatch': {
      requireOnlyKeys(condition, path, ['kind', 'target', 'tagQueryType', 'tags']);
      if (!Array.isArray(condition.tags) || condition.tags.length === 0) {
        throw new Error(`${path}.tags: expected non-empty array`);
      }
      return {
        kind: 'entityTagMatch',
        target: requireEnum(condition.target, ['caster', 'enemy'] as const, `${path}.target`),
        tagQueryType: requireEnum(
          condition.tagQueryType,
          ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'] as const,
          `${path}.tagQueryType`,
        ),
        tags: condition.tags.map((value, index) => {
          try {
            assertGameplayTag(value);
            return value;
          } catch {
            throw new Error(`${path}.tags[${index}]: expected readable GameplayTag path`);
          }
        }),
      };
    }
    case 'casterControlled':
      requireOnlyKeys(condition, path, ['kind']);
      return { kind: 'casterControlled' };
    case 'sourceSkillCastMatch':
      requireOnlyKeys(condition, path, ['kind']);
      return { kind: 'sourceSkillCastMatch' };
    case 'buffIdCountCompare':
      requireOnlyKeys(condition, path, ['kind', 'target', 'buffIds', 'operator', 'value']);
      if (
        !Array.isArray(condition.buffIds) ||
        condition.buffIds.length === 0 ||
        !condition.buffIds.every(value => typeof value === 'string' && value.length > 0)
      ) {
        throw new Error(`${path}.buffIds: expected non-empty Buff ID array`);
      }
      return {
        kind: 'buffIdCountCompare',
        target: requireEnum(condition.target, ['caster', 'enemy'] as const, `${path}.target`),
        buffIds: condition.buffIds as string[],
        operator: requireEnum(
          condition.operator,
          ['equal', 'notEqual', 'less', 'lessOrEqual', 'greater', 'greaterOrEqual'] as const,
          `${path}.operator`,
        ),
        value: parseDefinitionNumberOperand(condition.value, `${path}.value`),
      };
    case 'targetPoiseCompare':
      requireOnlyKeys(condition, path, [
        'kind',
        'target',
        'returnValueIfMissing',
        'operator',
        'value',
      ]);
      return {
        kind: 'targetPoiseCompare',
        target: requireEnum(condition.target, ['enemy'] as const, `${path}.target`),
        returnValueIfMissing: requireBoolean(
          condition.returnValueIfMissing,
          `${path}.returnValueIfMissing`,
        ),
        operator: requireEnum(
          condition.operator,
          ['equal', 'notEqual', 'less', 'lessOrEqual', 'greater', 'greaterOrEqual'] as const,
          `${path}.operator`,
        ),
        value: parseDefinitionNumberOperand(condition.value, `${path}.value`),
      };
    case 'eventDamageTagsMatch':
      requireOnlyKeys(condition, path, ['kind', 'match', 'tags']);
      return {
        kind: 'eventDamageTagsMatch',
        match: requireEnum(
          condition.match,
          ['exact', 'hasAny', 'hasAll', 'exceptAny', 'exceptAll'] as const,
          `${path}.match`,
        ),
        tags: parseEnumArray(condition.tags, DAMAGE_TAGS, `${path}.tags`),
      };
    case 'eventDamageFeaturesMatch':
      requireOnlyKeys(condition, path, ['kind', 'match', 'features']);
      return {
        kind: 'eventDamageFeaturesMatch',
        match: requireEnum(
          condition.match,
          ['exact', 'hasAny', 'hasAll', 'exceptAny', 'exceptAll'] as const,
          `${path}.match`,
        ),
        features: parseEnumArray(condition.features, DAMAGE_FEATURES, `${path}.features`),
      };
    case 'eventDamageTypesMatch':
      requireOnlyKeys(condition, path, ['kind', 'damageTypes']);
      return {
        kind: 'eventDamageTypesMatch',
        damageTypes: parseEnumArray(condition.damageTypes, DAMAGE_TYPES, `${path}.damageTypes`),
      };
    case 'buffBlackboardCompare':
      requireOnlyKeys(condition, path, ['kind', 'left', 'operator', 'right']);
      return {
        kind: 'buffBlackboardCompare',
        left: parseDefinitionNumberOperand(condition.left, `${path}.left`),
        operator: requireEnum(condition.operator, COMPARISON_OPERATORS, `${path}.operator`),
        right: parseDefinitionNumberOperand(condition.right, `${path}.right`),
      };
    case 'not':
      requireOnlyKeys(condition, path, ['kind', 'condition']);
      return {
        kind: 'not',
        condition: parseDamageModifierCondition(condition.condition, `${path}.condition`),
      };
    case 'all':
    case 'any':
      requireOnlyKeys(condition, path, ['kind', 'conditions']);
      if (!Array.isArray(condition.conditions) || condition.conditions.length === 0) {
        throw new Error(`${path}.conditions: expected non-empty array`);
      }
      return {
        kind: condition.kind,
        conditions: condition.conditions.map((child, index) =>
          parseDamageModifierCondition(child, `${path}.conditions[${index}]`),
        ),
      };
    default:
      throw new Error(
        `${path}.kind: unsupported damage modifier condition '${String(condition.kind)}'`,
      );
  }
}

function parseDamageModifierProcessor(
  input: unknown,
  path: string,
): CombatBuffDefinitionDamageProcessor {
  const processor = requireObject(input, path);
  if (processor.kind === 'damageScale') {
    requireOnlyKeys(processor, path, ['kind', 'side', 'zone', 'addition']);
    const addition = parseDefinitionNumberOperand(processor.addition, `${path}.addition`);
    return {
      kind: 'damageScale',
      side: requireEnum(processor.side, DAMAGE_SCALE_SIDES, `${path}.side`),
      zone: requireEnum(processor.zone, DAMAGE_SCALE_ZONES, `${path}.zone`),
      addition,
    };
  }
  if (processor.kind === 'instantAttribute') {
    requireOnlyKeys(processor, path, [
      'kind',
      'targetSide',
      'attribute',
      'values',
      'attributeTiming',
    ]);
    const values = requireObject(processor.values, `${path}.values`);
    requireOnlyKeys(values, `${path}.values`, ['slot', 'value']);
    return {
      kind: 'instantAttribute',
      targetSide: requireEnum(processor.targetSide, DAMAGE_MODIFIER_SIDES, `${path}.targetSide`),
      attribute: requireNonEmptyString(processor.attribute, `${path}.attribute`),
      values: {
        slot: requireEnum(values.slot, ATTRIBUTE_MODIFIER_SLOTS, `${path}.values.slot`),
        value: parseDefinitionNumberOperand(values.value, `${path}.values.value`),
      },
      attributeTiming: requireEnum(
        processor.attributeTiming,
        ['runtime'] as const,
        `${path}.attributeTiming`,
      ),
    };
  }
  throw new Error(`${path}.kind: unsupported damage processor '${String(processor.kind)}'`);
}

function parseOptionalSpellBurst(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { spellBurst?: CombatBuffSpellBurstDefinition } {
  if (entry.spellBurst === undefined) return {};
  const burstPath = `${path}.spellBurst`;
  const burst = requireObject(entry.spellBurst, burstPath);
  requireOnlyKeys(burst, burstPath, [
    'burstType',
    'damageType',
    'skillSettingDataKey',
    'skillSettingColumn',
    'atkScaleBase',
  ]);
  const skillSettingColumn = requireFiniteNumber(
    burst.skillSettingColumn,
    `${burstPath}.skillSettingColumn`,
  );
  if (!Number.isInteger(skillSettingColumn) || skillSettingColumn < 1) {
    throw new Error(`${burstPath}.skillSettingColumn: expected positive integer`);
  }
  const atkScaleBase = requireFiniteNumber(burst.atkScaleBase, `${burstPath}.atkScaleBase`);
  if (atkScaleBase < 0) throw new Error(`${burstPath}.atkScaleBase: expected non-negative`);
  return {
    spellBurst: {
      burstType: requireNonEmptyString(burst.burstType, `${burstPath}.burstType`),
      damageType: requireNonEmptyString(burst.damageType, `${burstPath}.damageType`) as DamageType,
      skillSettingDataKey: requireNonEmptyString(
        burst.skillSettingDataKey,
        `${burstPath}.skillSettingDataKey`,
      ),
      skillSettingColumn,
      atkScaleBase,
    },
  };
}

function requireFiniteNumber(input: unknown, path: string): number {
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    throw new Error(`${path}: expected finite number`);
  }
  return input;
}

function parseOptionalAttributeModifiers(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { attributeModifiers?: readonly CombatBuffDefinitionAttributeModifier[] } {
  if (entry.attributeModifiers === undefined) return {};
  if (!Array.isArray(entry.attributeModifiers)) {
    throw new Error(`${path}.attributeModifiers: expected array`);
  }
  return {
    attributeModifiers: entry.attributeModifiers.map((input, index) => {
      const modifierPath = `${path}.attributeModifiers[${index}]`;
      const modifier = requireObject(input, modifierPath);
      requireOnlyKeys(modifier, modifierPath, ['attribute', 'slot', 'value', 'source', 'target']);
      const rawValue = modifier.value;
      const value =
        typeof rawValue === 'number' && Number.isFinite(rawValue)
          ? rawValue
          : parseBlackboardReference(rawValue, `${modifierPath}.value`);
      const parsedAttribute =
        typeof modifier.attribute === 'string'
          ? requireNonEmptyString(modifier.attribute, `${modifierPath}.attribute`)
          : parseStoreAttributeSelector(modifier.attribute, `${modifierPath}.attribute`);
      const attribute =
        typeof parsedAttribute === 'object' && parsedAttribute.kind === 'specific'
          ? parsedAttribute.key
          : parsedAttribute;
      return {
        attribute,
        slot: requireEnum(modifier.slot, ATTRIBUTE_MODIFIER_SLOTS, `${modifierPath}.slot`),
        value,
        ...(modifier.target === undefined
          ? {}
          : {
              target: requireEnum(
                modifier.target,
                ['owner', 'buffSource'] as const,
                `${modifierPath}.target`,
              ),
            }),
        ...(modifier.source === undefined
          ? {}
          : {
              source: requireEnum(
                modifier.source,
                ['converted'] as const,
                `${modifierPath}.source`,
              ),
            }),
      };
    }),
  };
}

function parseOptionalGameplayTags(
  entry: Readonly<Record<string, unknown>>,
  key: 'applyTags' | 'extendTags',
  path: string,
): Partial<Pick<CombatBuffDefinitionEntry, typeof key>> {
  if (entry[key] === undefined) return {};
  if (!Array.isArray(entry[key])) {
    throw new Error(`${path}.${key}: expected array`);
  }
  return {
    [key]: entry[key].map((value, index) => {
      try {
        assertGameplayTag(value);
        return value;
      } catch {
        throw new Error(`${path}.${key}[${index}]: expected readable GameplayTag path`);
      }
    }),
  } as Partial<Pick<CombatBuffDefinitionEntry, typeof key>>;
}

function parseOptionalRole(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { role?: CombatBuffSemanticRole } {
  if (entry.role === undefined) return {};
  const rolePath = `${path}.role`;
  const role = requireObject(entry.role, rolePath);
  const kind = requireNonEmptyString(role.kind, `${rolePath}.kind`);
  switch (kind) {
    case 'elementalAttachment':
    case 'elementalBurst':
      requireOnlyKeys(role, rolePath, ['kind', 'element']);
      return {
        role: {
          kind,
          element: requireEnum(role.element, INFLICTION_ELEMENTS, `${rolePath}.element`),
        },
      };
    case 'compoundStatus':
      requireOnlyKeys(role, rolePath, ['kind', 'consumedElement', 'incomingElement']);
      return {
        role: {
          kind,
          consumedElement: requireEnum(
            role.consumedElement,
            INFLICTION_ELEMENTS,
            `${rolePath}.consumedElement`,
          ),
          incomingElement: requireEnum(
            role.incomingElement,
            INFLICTION_ELEMENTS,
            `${rolePath}.incomingElement`,
          ),
        },
      };
    default:
      throw new Error(`${rolePath}.kind: unknown value '${kind}'`);
  }
}

function parseOptionalActions(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { actions?: CombatBuffDefinitionLifecycleActions } {
  if (entry.actions === undefined) return {};
  const actionsPath = `${path}.actions`;
  const actions = requireObject(entry.actions, actionsPath);
  requireOnlyKeys(actions, actionsPath, [
    'start',
    'trigger',
    'enhanceChanged',
    'afterEnhance',
    'finish',
  ]);
  return {
    actions: {
      ...parseOptionalDefinitionActionList(actions, 'start', actionsPath),
      ...parseOptionalDefinitionActionList(actions, 'trigger', actionsPath),
      ...parseOptionalDefinitionActionList(actions, 'enhanceChanged', actionsPath),
      ...parseOptionalDefinitionActionList(actions, 'afterEnhance', actionsPath),
      ...parseOptionalDefinitionActionList(actions, 'finish', actionsPath),
    },
  };
}

function parseOptionalDefinitionActionList(
  actions: Readonly<Record<string, unknown>>,
  key: keyof CombatBuffDefinitionLifecycleActions,
  path: string,
): Partial<CombatBuffDefinitionLifecycleActions> {
  const input = actions[key];
  if (input === undefined) return {};
  if (!Array.isArray(input)) throw new Error(`${path}.${key}: expected array`);
  return {
    [key]: input.map((item, index) => {
      const actionPath = `${path}.${key}[${index}]`;
      const action = requireObject(item, actionPath);
      if (action.kind === 'modifyBlackboard') {
        requireOnlyKeys(action, actionPath, ['kind', 'operation', 'targetKey', 'value']);
        return {
          kind: action.kind,
          operation: requireEnum(
            action.operation,
            ['assign', 'add'] as const,
            `${actionPath}.operation`,
          ),
          targetKey: requireNonEmptyString(action.targetKey, `${actionPath}.targetKey`),
          value:
            typeof action.value === 'number' && Number.isFinite(action.value)
              ? action.value
              : parseBlackboardReference(action.value, `${actionPath}.value`),
        };
      }
      if (action.kind === 'clampBlackboard') {
        requireOnlyKeys(action, actionPath, ['kind', 'targetKey', 'minimum', 'maximum']);
        if (action.minimum === undefined && action.maximum === undefined) {
          throw new Error(`${actionPath}: expected minimum or maximum`);
        }
        return {
          kind: action.kind,
          targetKey: requireNonEmptyString(action.targetKey, `${actionPath}.targetKey`),
          ...(action.minimum === undefined
            ? {}
            : {
                minimum: parseDefinitionNumberOperand(action.minimum, `${actionPath}.minimum`),
              }),
          ...(action.maximum === undefined
            ? {}
            : {
                maximum: parseDefinitionNumberOperand(action.maximum, `${actionPath}.maximum`),
              }),
        };
      }
      if (action.kind === 'storeAttributeValue') {
        requireOnlyKeys(action, actionPath, [
          'kind',
          'target',
          'attribute',
          'stage',
          'useFloor',
          'divisor',
          'multiplier',
          'base',
          'targetKey',
        ]);
        if (action.useFloor !== true && action.useFloor !== false) {
          throw new Error(`${actionPath}.useFloor: expected boolean`);
        }
        return {
          kind: action.kind,
          target: requireEnum(action.target, ['source'] as const, `${actionPath}.target`),
          attribute: parseStoreAttributeSelector(action.attribute, `${actionPath}.attribute`),
          stage: requireEnum(
            action.stage,
            ['armedNonConverted', 'finalNonConverted'] as const,
            `${actionPath}.stage`,
          ),
          useFloor: action.useFloor,
          divisor: parseDefinitionNumberOperand(action.divisor, `${actionPath}.divisor`),
          multiplier: parseDefinitionNumberOperand(action.multiplier, `${actionPath}.multiplier`),
          base: parseDefinitionNumberOperand(action.base, `${actionPath}.base`),
          targetKey: requireNonEmptyString(action.targetKey, `${actionPath}.targetKey`),
        };
      }
      if (action.kind === 'triggerSpellBurst') {
        requireOnlyKeys(action, actionPath, ['kind', 'burstType']);
        return {
          kind: action.kind,
          burstType: requireNonEmptyString(action.burstType, `${actionPath}.burstType`),
        };
      }
      if (action.kind === 'dealAttackScaledDamage') {
        requireOnlyKeys(action, actionPath, [
          'kind',
          'damageType',
          'attackScale',
          'tags',
          'features',
          'canCritical',
        ]);
        if (action.canCritical !== true && action.canCritical !== false) {
          throw new Error(`${actionPath}.canCritical: expected boolean`);
        }
        if (!Array.isArray(action.tags)) throw new Error(`${actionPath}.tags: expected array`);
        if (!Array.isArray(action.features)) {
          throw new Error(`${actionPath}.features: expected array`);
        }
        return {
          kind: action.kind,
          damageType: requireEnum(action.damageType, DAMAGE_TYPES, `${actionPath}.damageType`),
          attackScale: parseDefinitionNumberOperand(
            action.attackScale,
            `${actionPath}.attackScale`,
          ),
          tags: action.tags.map((tag, tagIndex) =>
            requireEnum(tag, DAMAGE_TAGS, `${actionPath}.tags[${tagIndex}]`),
          ),
          features: action.features.map((feature, featureIndex) =>
            requireEnum(feature, DAMAGE_FEATURES, `${actionPath}.features[${featureIndex}]`),
          ),
          canCritical: action.canCritical,
        };
      }
      if (action.kind === 'visualOnly') {
        requireOnlyKeys(action, actionPath, ['kind', 'actionType']);
        return {
          kind: action.kind,
          actionType: requireNonEmptyString(action.actionType, `${actionPath}.actionType`),
        };
      }
      if (action.kind === 'simulationNoEffect') {
        requireOnlyKeys(action, actionPath, ['kind', 'reason', 'nativeActionType']);
        return {
          kind: action.kind,
          reason: requireEnum(
            action.reason,
            ['enemyWeaknessWindowRequiresEnemyActiveBehavior'] as const,
            `${actionPath}.reason`,
          ),
          nativeActionType: requireNonEmptyString(
            action.nativeActionType,
            `${actionPath}.nativeActionType`,
          ),
        };
      }
      requireOnlyKeys(action, actionPath, ['kind']);
      if (action.kind === 'emitElementalInflictionStarted') return { kind: action.kind };
      if (action.kind === 'refreshAttributeModifierValues') return { kind: action.kind };
      throw new Error(`${actionPath}.kind: unknown value '${String(action.kind)}'`);
    }),
  };
}

function parseOptionalBlackboard(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { blackboard?: Readonly<Record<string, ActionBlackboardValue>> } {
  if (entry.blackboard === undefined) return {};
  const blackboard = requireObject(entry.blackboard, `${path}.blackboard`);
  for (const [key, value] of Object.entries(blackboard)) {
    if (value === null || typeof value === 'string') continue;
    if (typeof value === 'number' && Number.isFinite(value)) continue;
    throw new Error(`${path}.blackboard.${key}: expected finite number, string, or null`);
  }
  return { blackboard: blackboard as Readonly<Record<string, ActionBlackboardValue>> };
}

function parseOptionalTriggerCount(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { maxTriggerCount?: BuffTriggerCount } {
  if (entry.maxTriggerCount === undefined) return {};
  if (typeof entry.maxTriggerCount === 'number') {
    if (!Number.isSafeInteger(entry.maxTriggerCount)) {
      throw new Error(`${path}.maxTriggerCount: expected safe integer`);
    }
    return { maxTriggerCount: entry.maxTriggerCount };
  }
  return {
    maxTriggerCount: parseBlackboardReference(entry.maxTriggerCount, `${path}.maxTriggerCount`),
  };
}

function parseOptionalScalar(
  entry: Readonly<Record<string, unknown>>,
  key: 'durationSeconds' | 'triggerIntervalSeconds' | 'addingCooldownSeconds',
  path: string,
): Partial<Pick<CombatBuffDefinitionEntry, typeof key>> {
  const value = entry[key];
  if (value === undefined) return {};
  if (typeof value === 'number' && Number.isFinite(value)) return { [key]: value };
  return { [key]: parseBlackboardReference(value, `${path}.${key}`) };
}

function parseOptionalPriority(
  entry: Readonly<Record<string, unknown>>,
  path: string,
): { priority?: BuffPriority } {
  if (entry.priority === undefined) return {};
  if (typeof entry.priority === 'number' && Number.isFinite(entry.priority)) {
    return { priority: entry.priority };
  }
  const priorityPath = `${path}.priority`;
  const priority = requireObject(entry.priority, priorityPath);
  requireOnlyKeys(priority, priorityPath, ['blackboardKey', 'negate']);
  if (priority.negate !== undefined && typeof priority.negate !== 'boolean') {
    throw new Error(`${priorityPath}.negate: expected boolean`);
  }
  return {
    priority: {
      blackboardKey: requireNonEmptyString(priority.blackboardKey, `${priorityPath}.blackboardKey`),
      ...(priority.negate === undefined ? {} : { negate: priority.negate }),
    },
  };
}

function parseStoreAttributeSelector(
  input: unknown,
  path: string,
): CombatBuffDefinitionAttributeSelector {
  const selector = requireObject(input, path);
  const kind = requireNonEmptyString(selector.kind, `${path}.kind`);
  if (kind === 'specific') {
    requireOnlyKeys(selector, path, ['kind', 'key']);
    return { kind, key: requireNonEmptyString(selector.key, `${path}.key`) };
  }
  if (kind === 'main' || kind === 'secondary' || kind === 'all') {
    requireOnlyKeys(selector, path, ['kind']);
    return { kind };
  }
  throw new Error(`${path}.kind: unknown value '${kind}'`);
}

function parseDefinitionNumberOperand(
  input: unknown,
  path: string,
): CombatBuffDefinitionNumberOperand {
  return typeof input === 'number' && Number.isFinite(input)
    ? input
    : parseBlackboardReference(input, path);
}

function parseDefinitionIntegerOperand(
  input: unknown,
  path: string,
): number | { readonly blackboardKey: string } {
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || !Number.isInteger(input)) {
      throw new Error(`${path}: expected integer or blackboard reference`);
    }
    return input;
  }
  return parseBlackboardReference(input, path);
}

function requireBoolean(input: unknown, path: string): boolean {
  if (typeof input !== 'boolean') throw new Error(`${path}: expected boolean`);
  return input;
}

function parseBlackboardReference(input: unknown, path: string): { blackboardKey: string } {
  const reference = requireObject(input, path);
  requireOnlyKeys(reference, path, ['blackboardKey']);
  return { blackboardKey: requireNonEmptyString(reference.blackboardKey, `${path}.blackboardKey`) };
}

function parseOptionalString(
  entry: Readonly<Record<string, unknown>>,
  key: 'stackingKey',
  path: string,
): Partial<Pick<CombatBuffDefinitionEntry, typeof key>> {
  if (entry[key] === undefined) return {};
  return { [key]: requireNonEmptyString(entry[key], `${path}.${key}`) };
}

function parseOptionalBoolean(
  entry: Readonly<Record<string, unknown>>,
  key: 'waitFirstTriggerInterval' | 'ignoreAddingCooldown',
  path: string,
): Partial<Pick<CombatBuffDefinitionEntry, typeof key>> {
  if (entry[key] === undefined) return {};
  if (typeof entry[key] !== 'boolean') throw new Error(`${path}.${key}: expected boolean`);
  return { [key]: entry[key] };
}

function parseOptionalNonNegativeInteger(
  entry: Readonly<Record<string, unknown>>,
  key: 'maxStackCount',
  path: string,
): Partial<Pick<CombatBuffDefinitionEntry, typeof key>> {
  if (entry[key] === undefined) return {};
  if (!Number.isSafeInteger(entry[key]) || (entry[key] as number) < 0) {
    throw new Error(`${path}.${key}: expected non-negative safe integer`);
  }
  return { [key]: entry[key] as number };
}

function requireObject(input: unknown, path: string): Readonly<Record<string, unknown>> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(`${path}: expected object`);
  }
  return input as Readonly<Record<string, unknown>>;
}

function requireOnlyKeys(
  input: Readonly<Record<string, unknown>>,
  path: string,
  allowedKeys: readonly string[],
): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) throw new Error(`${path}: unknown property '${key}'`);
  }
}

function requireNonEmptyString(input: unknown, path: string): string {
  if (typeof input !== 'string' || input.length === 0) {
    throw new Error(`${path}: expected non-empty string`);
  }
  return input;
}

function requireEnum<const Values extends readonly string[]>(
  input: unknown,
  values: Values,
  path: string,
): Values[number] {
  if (typeof input !== 'string' || !values.includes(input)) {
    throw new Error(`${path}: unknown value '${String(input)}'`);
  }
  return input;
}

function parseEnumArray<const Values extends readonly string[]>(
  input: unknown,
  values: Values,
  path: string,
): readonly Values[number][] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error(`${path}: expected non-empty array`);
  }
  return input.map((value, index) => requireEnum(value, values, `${path}[${index}]`));
}

function compileLifecycleActions<Key extends string>(
  entry: CombatBuffDefinitionEntry,
  ports: CombatBuffDefinitionCompilerPorts<Key>,
): BuffLifecycleActions<Key> | undefined {
  const actions = entry.actions;
  if (actions === undefined) return undefined;
  const start = compileDefinitionActionList(entry, 'start', actions.start, ports);
  const trigger = compileDefinitionActionList(entry, 'trigger', actions.trigger, ports);
  const enhanceChanged = compileDefinitionActionList(
    entry,
    'enhanceChanged',
    actions.enhanceChanged,
    ports,
  );
  const afterEnhance = compileDefinitionActionList(
    entry,
    'afterEnhance',
    actions.afterEnhance,
    ports,
  );
  const finish = compileDefinitionActionList(entry, 'finish', actions.finish, ports);
  if (
    start.length === 0 &&
    trigger.length === 0 &&
    enhanceChanged.length === 0 &&
    afterEnhance.length === 0 &&
    finish.length === 0
  ) {
    return undefined;
  }
  return {
    ...(start.length === 0 ? {} : { start: createLifecycleHandler(start) }),
    ...(trigger.length === 0 ? {} : { trigger: createLifecycleHandler(trigger) }),
    ...(enhanceChanged.length === 0
      ? {}
      : { enhanceChanged: createLifecycleHandler(enhanceChanged) }),
    ...(afterEnhance.length === 0 ? {} : { afterEnhance: createLifecycleHandler(afterEnhance) }),
    ...(finish.length === 0 ? {} : { finish: createLifecycleHandler(finish) }),
  };
}

type BuffActionHandler<Key extends string> = (buff: CombatBuff<Key>) => void;

function compileDefinitionActionList<Key extends string>(
  entry: CombatBuffDefinitionEntry,
  lifecycle: keyof CombatBuffDefinitionLifecycleActions,
  actions: readonly CombatBuffDefinitionAction[] | undefined,
  ports: CombatBuffDefinitionCompilerPorts<Key>,
): readonly BuffActionHandler<Key>[] {
  return (actions ?? []).map(action => {
    switch (action.kind) {
      case 'modifyBlackboard':
        return buff => modifyBuffBlackboard(buff, action);
      case 'clampBlackboard':
        return buff => clampBuffBlackboard(buff, action);
      case 'refreshAttributeModifierValues':
        return buff => buff.refreshAttributeModifierValues();
      case 'storeAttributeValue': {
        const readAttribute = ports.readAttribute;
        if (readAttribute === undefined) {
          throw new Error(
            `buff '${entry.id}' stores an attribute value without a readAttribute port`,
          );
        }
        return buff => storeBuffAttributeValue(buff, action, readAttribute);
      }
      case 'emitElementalInflictionStarted': {
        if (lifecycle !== 'afterEnhance') {
          throw new Error(
            `buff '${entry.id}' emits elemental-infliction events from unsupported lifecycle '${lifecycle}'`,
          );
        }
        const role = entry.role;
        if (role?.kind !== 'elementalAttachment') {
          throw new Error(
            `buff '${entry.id}' emits elemental-infliction events without an elemental-attachment role`,
          );
        }
        const handler = createElementalAttachmentLifecycleActions(
          role.element,
          ports.emitElementalInflictionStarted,
        ).afterEnhance!;
        return buff => handler(buff, buff.sourceId);
      }
      case 'triggerSpellBurst': {
        const onSpellBurstTriggered = ports.onSpellBurstTriggered;
        if (onSpellBurstTriggered === undefined) {
          throw new Error(
            `buff '${entry.id}' triggers spell burst '${action.burstType}' without an onSpellBurstTriggered port`,
          );
        }
        return buff => {
          onSpellBurstTriggered({
            burstType: action.burstType,
            sourceId: buff.sourceId,
            ...(buff.skillCastInfo === null ? {} : { skillCastInfo: buff.skillCastInfo }),
          });
        };
      }
      case 'dealAttackScaledDamage': {
        const onTriggered = ports.onAttackScaledDamageTriggered;
        if (onTriggered === undefined) {
          throw new Error(
            `buff '${entry.id}' deals attack-scaled damage without an onAttackScaledDamageTriggered port`,
          );
        }
        return buff =>
          onTriggered({
            damageType: action.damageType,
            attackScale: resolveBuffBlackboardOperand(buff, action.attackScale),
            tags: action.tags,
            features: action.features,
            canCritical: action.canCritical,
            sourceId: buff.sourceId,
            buffId: buff.definition.id,
            skillCastInfo: buff.skillCastInfo ?? undefined,
            buffInstanceId: buff.instanceId,
            buffOwnerId: buff.owner.ownerId,
            sourceActionId: buff.sourceActionId,
          });
      }
      case 'visualOnly':
        // 已确认的纯表现动作（动画/特效/声音/镜头/顿帧等），后端无数值作用。
        return () => undefined;
      case 'simulationNoEffect':
        // 动作身份和固定模型边界保留在定义中；标准木桩没有对应的敌方主动行为状态。
        return () => undefined;
    }
  });
}

function storeBuffAttributeValue<Key extends string>(
  buff: CombatBuff<Key>,
  action: Extract<CombatBuffDefinitionAction, { kind: 'storeAttributeValue' }>,
  readAttribute: NonNullable<CombatBuffDefinitionCompilerPorts<Key>['readAttribute']>,
): void {
  const attributeValue = readAttribute(
    { target: action.target, attribute: action.attribute, stage: action.stage },
    buff,
  );
  // 原生仅在 useFloor 分支读取除数；关闭取整时缺失的 divisor 黑板键不应影响执行。
  const scaledAttribute = action.useFloor
    ? Math.floor(attributeValue / resolveBuffBlackboardOperand(buff, action.divisor))
    : attributeValue;
  const result =
    resolveBuffBlackboardOperand(buff, action.base) +
    scaledAttribute * resolveBuffBlackboardOperand(buff, action.multiplier);
  buff.blackboard.assignDynamic(action.targetKey, result);
  // StoreAttributeValue 写入后会通知当前 Buff，使依赖该黑板键的属性修正立即重建。
  buff.refreshAttributeModifierValues();
}

function modifyBuffBlackboard<Key extends string>(
  buff: CombatBuff<Key>,
  action: Extract<CombatBuffDefinitionAction, { kind: 'modifyBlackboard' }>,
): void {
  const operand = resolveBuffBlackboardOperand(buff, action.value);
  if (action.operation === 'assign') {
    buff.blackboard.assignDynamic(action.targetKey, operand);
    return;
  }
  const snapshot = buff.blackboard.snapshot();
  const current = buff.blackboard.getNumber(action.targetKey);
  if (action.targetKey in snapshot && current === undefined) {
    throw new Error(
      `buff '${buff.definition.id}' blackboard target '${action.targetKey}' is not numeric`,
    );
  }
  buff.blackboard.assignDynamic(action.targetKey, (current ?? 0) + operand);
}

function clampBuffBlackboard<Key extends string>(
  buff: CombatBuff<Key>,
  action: Extract<CombatBuffDefinitionAction, { kind: 'clampBlackboard' }>,
): void {
  const current = buff.blackboard.getNumber(action.targetKey);
  if (current === undefined) {
    throw new Error(
      `buff '${buff.definition.id}' blackboard target '${action.targetKey}' is missing or not numeric`,
    );
  }
  const minimum =
    action.minimum === undefined
      ? Number.NEGATIVE_INFINITY
      : resolveBuffBlackboardOperand(buff, action.minimum);
  const maximum =
    action.maximum === undefined
      ? Number.POSITIVE_INFINITY
      : resolveBuffBlackboardOperand(buff, action.maximum);
  if (minimum > maximum) {
    throw new Error(
      `buff '${buff.definition.id}' blackboard clamp '${action.targetKey}' has minimum ${minimum} above maximum ${maximum}`,
    );
  }
  buff.blackboard.assignDynamic(action.targetKey, Math.min(maximum, Math.max(minimum, current)));
}

function resolveBuffBlackboardOperand<Key extends string>(
  buff: CombatBuff<Key>,
  value: number | { readonly blackboardKey: string },
): number {
  if (typeof value === 'number') return value;
  const operand = buff.blackboard.getNumber(value.blackboardKey);
  if (operand !== undefined) return operand;
  throw new Error(
    `buff '${buff.definition.id}' blackboard value '${value.blackboardKey}' is missing or not numeric`,
  );
}

function createLifecycleHandler<Key extends string>(
  handlers: readonly BuffActionHandler<Key>[],
): BuffActionHandler<Key> {
  return buff => {
    for (const handler of handlers) handler(buff);
  };
}

function compoundStatusKey(
  consumedElement: InflictionElement,
  incomingElement: InflictionElement,
): string {
  return `${consumedElement}->${incomingElement}`;
}

function registerUniqueRole<Key, Attribute extends string>(
  entries: Map<Key, CombatBuffDefinition<Attribute>>,
  key: Key,
  definition: CombatBuffDefinition<Attribute>,
  role: CombatBuffSemanticRole['kind'],
): void {
  const existing = entries.get(key);
  if (existing !== undefined) {
    throw new Error(
      `buff definition role '${role}' is assigned to both '${existing.id}' and '${definition.id}'`,
    );
  }
  entries.set(key, definition);
}

function requireRole<Key, Attribute extends string>(
  entries: ReadonlyMap<Key, CombatBuffDefinition<Attribute>>,
  key: Key,
  label: string,
): CombatBuffDefinition<Attribute> {
  const definition = entries.get(key);
  if (definition === undefined) throw new Error(`buff definition is missing ${label}`);
  return definition;
}

function parseGameplayTag(value: unknown, path: string): string {
  try {
    assertGameplayTag(value);
    return value;
  } catch {
    throw new Error(`${path}: expected readable GameplayTag path`);
  }
}
