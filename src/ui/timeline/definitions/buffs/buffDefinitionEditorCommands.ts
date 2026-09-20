import type {
  BuffDuration,
  BuffPriority,
  CombatBuffPresentation,
  CombatBuffDefinitionAttributeModifier,
  SkillBuffDefinitionDamageModifier as CombatBuffDefinitionDamageModifier,
  CombatBuffChildPresentation,
  SkillBuffSlotReplacement,
  BuffShieldDefinition,
  BuffKeywordEnhancementDefinition,
  BuffSustainedProtectionDefinition,
  CombatBuffSemanticRole,
  CombatBuffSpellBurstDefinition,
  SkillBuffDefinition,
} from '../../../../../packages/game-data-contract/src/buffs';
import type { ActionBlackboardValue } from '../../../../../packages/game-data-contract/src/primitives';
import type {
  HealModifierDefinition,
  PoiseModifierDefinition,
} from '../../../../../packages/game-data-contract/src/modifiers';

export type EditableBuffScalarField =
  'durationSeconds' | 'triggerIntervalSeconds' | 'maxStackCount' | 'maxTriggerCount';

/** 只替换一个根数值字段；其余 Buff 证据保持引用和值不变。 */
export function setBuffDefinitionScalar(
  definition: SkillBuffDefinition,
  field: EditableBuffScalarField,
  value: BuffDuration | undefined,
): SkillBuffDefinition {
  const next = { ...definition };
  if (value === undefined) delete next[field];
  else next[field] = value;
  return next;
}

/** 优先级在常量和动态黑板形式之间切换时，仅保留仍有语义的取反位。 */
export function setBuffDefinitionPriority(
  definition: SkillBuffDefinition,
  value: BuffDuration | undefined,
): SkillBuffDefinition {
  const next = { ...definition };
  if (value === undefined) delete next.priority;
  else if (typeof value === 'number') next.priority = value;
  else {
    const priority: BuffPriority = {
      blackboardKey: value.blackboardKey,
      ...(typeof definition.priority === 'object' && definition.priority.negate
        ? { negate: true }
        : {}),
    };
    next.priority = priority;
  }
  return next;
}

export function setBuffDefinitionPresentationField(
  definition: SkillBuffDefinition,
  field: keyof Pick<CombatBuffPresentation, 'iconId' | 'iconPath' | 'visible'>,
  value: string | boolean | undefined,
): SkillBuffDefinition {
  const next = { ...definition };
  const presentation = { ...definition.presentation };
  if (value === undefined || value === '') delete presentation[field];
  else Object.assign(presentation, { [field]: value });
  if (Object.keys(presentation).length === 0) delete next.presentation;
  else next.presentation = presentation;
  return next;
}

export function setBuffDefinitionPresentation(
  definition: SkillBuffDefinition,
  presentation: CombatBuffPresentation | undefined,
): SkillBuffDefinition {
  const next = { ...definition };
  if (presentation === undefined) delete next.presentation;
  else next.presentation = presentation;
  return next;
}

export function setBuffDefinitionChildPresentations(
  definition: SkillBuffDefinition,
  children: readonly CombatBuffChildPresentation[],
): SkillBuffDefinition {
  const next = { ...definition };
  if (children.length === 0) delete next.childPresentations;
  else next.childPresentations = children;
  return next;
}

export function setBuffDefinitionBlackboard(
  definition: SkillBuffDefinition,
  blackboard: Readonly<Record<string, ActionBlackboardValue>>,
): SkillBuffDefinition {
  const next = { ...definition };
  if (Object.keys(blackboard).length === 0) delete next.blackboard;
  else next.blackboard = blackboard;
  return next;
}

export function setBuffDefinitionAttributeModifiers(
  definition: SkillBuffDefinition,
  modifiers: readonly CombatBuffDefinitionAttributeModifier[],
): SkillBuffDefinition {
  const next = { ...definition };
  if (modifiers.length === 0) delete next.attributeModifiers;
  else next.attributeModifiers = modifiers;
  return next;
}

export function setBuffDefinitionDamageModifiers(
  definition: SkillBuffDefinition,
  modifiers: readonly CombatBuffDefinitionDamageModifier[],
): SkillBuffDefinition {
  const next = { ...definition };
  if (modifiers.length === 0) delete next.damageModifiers;
  else next.damageModifiers = modifiers;
  return next;
}

export function setBuffDefinitionSkillSlotReplacements(
  definition: SkillBuffDefinition,
  replacements: readonly SkillBuffSlotReplacement[],
): SkillBuffDefinition {
  const next = { ...definition };
  if (replacements.length === 0) delete next.skillSlotReplacements;
  else next.skillSlotReplacements = replacements;
  return next;
}

export function setBuffDefinitionHealModifiers(
  definition: SkillBuffDefinition,
  modifiers: readonly HealModifierDefinition[],
): SkillBuffDefinition {
  const next = { ...definition };
  if (modifiers.length === 0) delete next.healModifiers;
  else next.healModifiers = modifiers;
  return next;
}

export function setBuffDefinitionPoiseModifiers(
  definition: SkillBuffDefinition,
  modifiers: readonly PoiseModifierDefinition[],
): SkillBuffDefinition {
  const next = { ...definition };
  if (modifiers.length === 0) delete next.poiseModifiers;
  else next.poiseModifiers = modifiers;
  return next;
}

export function setBuffDefinitionShields(
  definition: SkillBuffDefinition,
  shields: readonly BuffShieldDefinition[],
): SkillBuffDefinition {
  const next = { ...definition };
  if (shields.length === 0) delete next.shields;
  else next.shields = shields;
  return next;
}

export function setBuffDefinitionKeywordEnhancements(
  definition: SkillBuffDefinition,
  enhancements: readonly BuffKeywordEnhancementDefinition[],
): SkillBuffDefinition {
  const next = { ...definition };
  if (enhancements.length === 0) delete next.keywordEnhancements;
  else next.keywordEnhancements = enhancements;
  return next;
}

export function setBuffDefinitionAdvancedProperties(
  definition: SkillBuffDefinition,
  patch: {
    readonly sustainedProtection?: BuffSustainedProtectionDefinition | null;
    readonly role?: CombatBuffSemanticRole | null;
    readonly spellBurst?: CombatBuffSpellBurstDefinition | null;
    readonly affixSkillCastIdentity?: 'sourceSkillCast' | null;
  },
): SkillBuffDefinition {
  const next = { ...definition };
  for (const field of [
    'sustainedProtection',
    'role',
    'spellBurst',
    'affixSkillCastIdentity',
  ] as const) {
    const value = patch[field];
    if (value === undefined) continue;
    if (value === null) delete next[field];
    else Object.assign(next, { [field]: value });
  }
  return next;
}
