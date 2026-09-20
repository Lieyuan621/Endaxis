/**
 * 武器、装备与套装定义的严格结构校验。
 *
 * 本模块校验只读游戏定义，不校验项目中的用户实例。动态配装能力复用技能系统的事件、
 * 条件和动作序列校验，保证两类数据进入编译器前遵守同一套战斗语言。
 */
import {
  DAMAGE_TYPES,
  OPERATOR_ATTRIBUTES,
  OPERATOR_WEAPON_TYPES,
  SKILL_TYPES,
} from './operatorDefinition';
import {
  EQUIPMENT_DAMAGE_SCALE_TARGETS,
  EQUIPMENT_ABILITY_EVENTS,
  EQUIPMENT_PANEL_STATS,
  EQUIPMENT_TRAIT_DISPLAY_COMPOSITES,
  GEAR_SLOT_TYPES,
  WEAPON_RARITIES,
} from './equipmentDefinition';
import {
  validateCombatConditionDefinition,
  validateLevelValuesDefinition,
  type SkillDefinitionValidationIssue,
} from './validateSkillDefinition';
import {
  validateActionSequenceDefinition,
  validateCombatEventTriggerDefinition,
} from './validation/actionPrograms';

export type EquipmentDefinitionValidationIssue = SkillDefinitionValidationIssue;

const weaponRarities = new Set<unknown>(WEAPON_RARITIES);
const weaponTypes = new Set<unknown>(OPERATOR_WEAPON_TYPES);
const gearSlotTypes = new Set<unknown>(GEAR_SLOT_TYPES);
const panelStats = new Set<unknown>(EQUIPMENT_PANEL_STATS);
const attributes = new Set<unknown>([...OPERATOR_ATTRIBUTES, 'main', 'secondary']);
const damageTypes = new Set<unknown>(DAMAGE_TYPES);
const skillTypes = new Set<unknown>(SKILL_TYPES);
const damageScaleTargets = new Set<unknown>(EQUIPMENT_DAMAGE_SCALE_TARGETS);
const equipmentAbilityEvents = new Set<unknown>(EQUIPMENT_ABILITY_EVENTS);
const equipmentTraitDisplayComposites = new Set<unknown>(EQUIPMENT_TRAIT_DISPLAY_COMPOSITES);

function push(issues: EquipmentDefinitionValidationIssue[], path: string, message: string): void {
  issues.push({ path, message });
}

function asRecord(
  value: unknown,
  path: string,
  issues: EquipmentDefinitionValidationIssue[],
): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    push(issues, path, 'expected an object');
    return null;
  }
  return value as Record<string, unknown>;
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: EquipmentDefinitionValidationIssue[],
): string | null {
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    push(issues, `${path}.${key}`, 'expected a non-empty string');
    return null;
  }
  return value;
}

function requireFiniteNumber(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: EquipmentDefinitionValidationIssue[],
): number | null {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    push(issues, `${path}.${key}`, 'expected a finite number');
    return null;
  }
  return value;
}

function requirePositiveInteger(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: EquipmentDefinitionValidationIssue[],
): number | null {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    push(issues, `${path}.${key}`, 'expected a positive integer');
    return null;
  }
  return value;
}

function requireEnum(
  record: Record<string, unknown>,
  key: string,
  allowed: ReadonlySet<unknown>,
  path: string,
  issues: EquipmentDefinitionValidationIssue[],
): void {
  if (!allowed.has(record[key])) push(issues, `${path}.${key}`, 'unexpected value');
}

function validateEnumList(
  value: unknown,
  allowed: ReadonlySet<unknown>,
  path: string,
  issues: EquipmentDefinitionValidationIssue[],
): void {
  const values = Array.isArray(value) ? value : [value];
  if (values.length === 0) {
    push(issues, path, 'expected a value or a non-empty array');
    return;
  }
  values.forEach((entry, index) => {
    if (!allowed.has(entry))
      push(issues, Array.isArray(value) ? `${path}[${index}]` : path, 'unexpected value');
  });
}

function validateModifier(
  value: unknown,
  path: string,
  levelCount: number,
  issues: EquipmentDefinitionValidationIssue[],
  allowSingleValue = false,
): void {
  const record = asRecord(value, path, issues);
  if (record === null) return;
  const kind = requireString(record, 'kind', path, issues);
  issues.push(...validateLevelValuesDefinition(record.value, `${path}.value`));
  if (
    Array.isArray(record.value) &&
    record.value.length !== levelCount &&
    !(allowSingleValue && record.value.length === 1)
  ) {
    push(issues, `${path}.value`, `expected ${levelCount} level values`);
  }

  switch (kind) {
    case 'attribute':
      requireEnum(record, 'attribute', attributes, path, issues);
      if (record.operation !== 'flat' && record.operation !== 'percent') {
        push(issues, `${path}.operation`, "expected 'flat' or 'percent'");
      }
      break;
    case 'panelStat':
      requireEnum(record, 'stat', panelStats, path, issues);
      break;
    case 'damageBonus':
      validateEnumList(record.damageTypes, damageTypes, `${path}.damageTypes`, issues);
      if (record.skillTypes !== undefined) {
        validateEnumList(record.skillTypes, skillTypes, `${path}.skillTypes`, issues);
      }
      break;
    case 'damageScale':
      requireEnum(record, 'target', damageScaleTargets, path, issues);
      if (
        record.slot !== undefined &&
        record.slot !== 'baseAddition' &&
        record.slot !== 'addition'
      ) {
        push(issues, `${path}.slot`, "expected 'baseAddition' or 'addition'");
      }
      break;
    case 'staticHealingIncrease':
      if (record.target !== 'output' && record.target !== 'taken') {
        push(issues, `${path}.target`, "expected 'output' or 'taken'");
      }
      break;
    case 'skillCooldownMultiplier':
      validateEnumList(record.skillTypes, skillTypes, `${path}.skillTypes`, issues);
      break;
    case null:
      break;
    default:
      push(issues, `${path}.kind`, 'unknown equipment modifier kind');
  }
}

function validateTraitDisplay(
  value: unknown,
  path: string,
  levelCount: number,
  issues: EquipmentDefinitionValidationIssue[],
): void {
  const record = asRecord(value, path, issues);
  if (record === null) return;
  const kind = requireString(record, 'kind', path, issues);
  if (kind === 'modifier') {
    // 原生固定词条只在 displayAttrModifiers 中存基础值；所有精锻档共用该值。
    validateModifier(record.modifier, `${path}.modifier`, levelCount, issues, true);
    return;
  }
  if (kind === 'composite') {
    requireEnum(record, 'composite', equipmentTraitDisplayComposites, path, issues);
    issues.push(...validateLevelValuesDefinition(record.value, `${path}.value`));
    if (
      Array.isArray(record.value) &&
      record.value.length !== 1 &&
      record.value.length !== levelCount
    ) {
      push(issues, `${path}.value`, `expected one or ${levelCount} display values`);
    }
    return;
  }
  if (kind !== null) push(issues, `${path}.kind`, 'unknown equipment trait display kind');
}

function validateContribution(
  record: Record<string, unknown>,
  path: string,
  levelCount: number,
  issues: EquipmentDefinitionValidationIssue[],
): void {
  if (Object.hasOwn(record, 'initializationBlackboard')) {
    push(issues, `${path}.initializationBlackboard`, 'use the shared contribution blackboard');
  }
  if (record.modifiers !== undefined) {
    if (!Array.isArray(record.modifiers)) {
      push(issues, `${path}.modifiers`, 'expected an array');
    } else {
      record.modifiers.forEach((modifier, index) =>
        validateModifier(modifier, `${path}.modifiers[${index}]`, levelCount, issues),
      );
    }
  }

  if (record.buffDefinitions !== undefined) {
    const definitions = asRecord(record.buffDefinitions, `${path}.buffDefinitions`, issues);
    if (definitions !== null) {
      for (const [buffId, definition] of Object.entries(definitions)) {
        issues.push(
          ...validateActionSequenceDefinition(
            {
              steps: [
                {
                  kind: 'applyBuff',
                  parameters: {
                    buffId,
                    target: 'caster',
                    definition,
                    inheritSourceSkillCastInfo: true,
                  },
                },
              ],
            },
            `${path}.buffDefinitions.${buffId}`,
          ),
        );
      }
    }
  }

  if (record.enableSequence !== undefined) {
    issues.push(
      ...validateActionSequenceDefinition(record.enableSequence, `${path}.enableSequence`),
    );
  }
  if (record.initializationSequence !== undefined) {
    issues.push(
      ...validateActionSequenceDefinition(
        record.initializationSequence,
        `${path}.initializationSequence`,
      ),
    );
  }

  if (record.blackboard !== undefined) {
    const blackboard = asRecord(record.blackboard, `${path}.blackboard`, issues);
    if (blackboard !== null) {
      for (const [blackboardKey, value] of Object.entries(blackboard)) {
        issues.push(...validateLevelValuesDefinition(value, `${path}.blackboard.${blackboardKey}`));
        if (Array.isArray(value) && value.length !== levelCount) {
          push(
            issues,
            `${path}.blackboard.${blackboardKey}`,
            `expected ${levelCount} level values`,
          );
        }
      }
    }
  }

  if (record.eventHandlers === undefined) return;
  if (!Array.isArray(record.eventHandlers)) {
    push(issues, `${path}.eventHandlers`, 'expected an array');
    return;
  }
  const keys = new Set<string>();
  record.eventHandlers.forEach((handler, index) => {
    const handlerPath = `${path}.eventHandlers[${index}]`;
    const handlerRecord = asRecord(handler, handlerPath, issues);
    if (handlerRecord === null) return;
    const key = requireString(handlerRecord, 'key', handlerPath, issues);
    if (key !== null) {
      if (keys.has(key)) push(issues, `${handlerPath}.key`, `duplicate event handler key '${key}'`);
      keys.add(key);
    }
    const hasEvent = handlerRecord.event !== undefined;
    const hasAbilityEvent = handlerRecord.abilityEvent !== undefined;
    if (hasEvent === hasAbilityEvent) {
      push(issues, handlerPath, 'expected exactly one of event or abilityEvent');
    } else if (hasEvent) {
      issues.push(
        ...validateCombatEventTriggerDefinition(handlerRecord.event, `${handlerPath}.event`),
      );
    } else {
      requireEnum(handlerRecord, 'abilityEvent', equipmentAbilityEvents, handlerPath, issues);
    }
    if (handlerRecord.condition !== undefined) {
      issues.push(
        ...validateCombatConditionDefinition(handlerRecord.condition, `${handlerPath}.condition`),
      );
    }
    if (handlerRecord.blackboard !== undefined) {
      push(
        issues,
        `${handlerPath}.blackboard`,
        'blackboard belongs to the equipment contribution, not its event handler',
      );
    }
    issues.push(
      ...validateActionSequenceDefinition(handlerRecord.sequence, `${handlerPath}.sequence`),
    );
  });
}

function validateTraits(
  value: unknown,
  path: string,
  issues: EquipmentDefinitionValidationIssue[],
  requireDisplay: boolean,
): void {
  if (!Array.isArray(value)) {
    push(issues, path, 'expected an array');
    return;
  }
  const keys = new Set<string>();
  value.forEach((trait, index) => {
    const traitPath = `${path}[${index}]`;
    const record = asRecord(trait, traitPath, issues);
    if (record === null) return;
    const key = requireString(record, 'key', traitPath, issues);
    if (key !== null) {
      if (keys.has(key)) push(issues, `${traitPath}.key`, `duplicate trait key '${key}'`);
      keys.add(key);
    }
    const levelCount = requirePositiveInteger(record, 'levelCount', traitPath, issues);
    if (levelCount !== null) {
      validateContribution(record, traitPath, levelCount, issues);
      if (requireDisplay) {
        validateTraitDisplay(record.display, `${traitPath}.display`, levelCount, issues);
      }
    }
  });
}

/** 校验一把武器的只读定义。 */
export function validateWeaponDefinition(
  value: unknown,
  path = '$',
): EquipmentDefinitionValidationIssue[] {
  const issues: EquipmentDefinitionValidationIssue[] = [];
  const record = asRecord(value, path, issues);
  if (record === null) return issues;
  requireString(record, 'slug', path, issues);
  requireEnum(record, 'rarity', weaponRarities, path, issues);
  requireEnum(record, 'weaponType', weaponTypes, path, issues);
  if (!Array.isArray(record.baseAttackAtLevelNodes) || record.baseAttackAtLevelNodes.length !== 6) {
    push(issues, `${path}.baseAttackAtLevelNodes`, 'expected six level-node values');
  } else {
    record.baseAttackAtLevelNodes.forEach((entry, index) => {
      if (typeof entry !== 'number' || !Number.isFinite(entry) || entry < 0) {
        push(
          issues,
          `${path}.baseAttackAtLevelNodes[${index}]`,
          'expected a non-negative finite number',
        );
      }
    });
  }
  validateTraits(record.traits, `${path}.traits`, issues, false);
  return issues;
}

/** 校验一件装备的只读定义。 */
export function validateGearDefinition(
  value: unknown,
  path = '$',
): EquipmentDefinitionValidationIssue[] {
  const issues: EquipmentDefinitionValidationIssue[] = [];
  const record = asRecord(value, path, issues);
  if (record === null) return issues;
  requireString(record, 'slug', path, issues);
  requireEnum(record, 'slotType', gearSlotTypes, path, issues);
  const levelRequirement = requireFiniteNumber(record, 'levelRequirement', path, issues);
  if (levelRequirement !== null && (!Number.isInteger(levelRequirement) || levelRequirement < 0)) {
    push(issues, `${path}.levelRequirement`, 'expected a non-negative integer');
  }
  const baseDefense = requireFiniteNumber(record, 'baseDefense', path, issues);
  if (baseDefense !== null && baseDefense < 0) {
    push(issues, `${path}.baseDefense`, 'expected a non-negative number');
  }
  if (
    record.gearSetSlug !== undefined &&
    (typeof record.gearSetSlug !== 'string' || record.gearSetSlug.length === 0)
  ) {
    push(issues, `${path}.gearSetSlug`, 'expected a non-empty string');
  }
  validateTraits(record.traits, `${path}.traits`, issues, true);
  return issues;
}

/** 校验一个固定三件触发的套装定义。 */
export function validateGearSetDefinition(
  value: unknown,
  path = '$',
): EquipmentDefinitionValidationIssue[] {
  const issues: EquipmentDefinitionValidationIssue[] = [];
  const record = asRecord(value, path, issues);
  if (record === null) return issues;
  requireString(record, 'slug', path, issues);
  validateContribution(record, path, 1, issues);
  return issues;
}
