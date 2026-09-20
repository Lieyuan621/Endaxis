import type {
  EquipmentContributionDefinition,
  EquipmentEventHandlerDefinition,
  EquipmentModifierDefinition,
  GearDefinition,
  GearSetDefinition,
  GearTraitDefinition,
  WeaponDefinition,
  WeaponTraitDefinition,
} from '../../../../core/game-data/equipmentDefinition';
import type { GearInstanceDocument, WeaponInstanceDocument } from '../../../../core/project/schema';

export type EquipmentEditorCoverage = 'editable' | 'structureEditable' | 'fixedIdentity';

/**
 * 配装定义和实例编辑器的契约穷尽账本。
 *
 * 定义、贡献和实例属于三个不同层级；这里分别对公共类型做 keyof 门禁，避免 UI 只凭字段长得相似
 * 就把模板能力、词条逐级值和用户实例加点混在一起。
 */
export const WEAPON_DEFINITION_EDITOR_COVERAGE = {
  slug: 'fixedIdentity',
  displayName: 'editable',
  assetSlug: 'editable',
  iconPath: 'editable',
  rarity: 'editable',
  weaponType: 'editable',
  baseAttackAtLevelNodes: 'editable',
  traits: 'structureEditable',
} as const satisfies Readonly<Record<keyof WeaponDefinition, EquipmentEditorCoverage>>;

export const GEAR_DEFINITION_EDITOR_COVERAGE = {
  slug: 'fixedIdentity',
  displayName: 'editable',
  assetSlug: 'editable',
  iconPath: 'editable',
  slotType: 'editable',
  levelRequirement: 'editable',
  baseDefense: 'editable',
  traits: 'structureEditable',
  gearSetSlug: 'editable',
} as const satisfies Readonly<Record<keyof GearDefinition, EquipmentEditorCoverage>>;

export const GEAR_SET_DEFINITION_EDITOR_COVERAGE = {
  slug: 'fixedIdentity',
  displayName: 'editable',
  iconPath: 'editable',
  modifiers: 'structureEditable',
  eventHandlers: 'structureEditable',
  buffDefinitions: 'structureEditable',
  blackboard: 'editable',
  enableSequence: 'structureEditable',
  initializationSequence: 'structureEditable',
} as const satisfies Readonly<Record<keyof GearSetDefinition, EquipmentEditorCoverage>>;

export const EQUIPMENT_CONTRIBUTION_EDITOR_COVERAGE = {
  modifiers: 'structureEditable',
  eventHandlers: 'structureEditable',
  buffDefinitions: 'structureEditable',
  blackboard: 'editable',
  enableSequence: 'structureEditable',
  initializationSequence: 'structureEditable',
} as const satisfies Readonly<
  Record<keyof EquipmentContributionDefinition, EquipmentEditorCoverage>
>;

export const WEAPON_TRAIT_EDITOR_COVERAGE = {
  key: 'editable',
  levelCount: 'editable',
  ...EQUIPMENT_CONTRIBUTION_EDITOR_COVERAGE,
} as const satisfies Readonly<Record<keyof WeaponTraitDefinition, EquipmentEditorCoverage>>;

export const GEAR_TRAIT_EDITOR_COVERAGE = {
  key: 'editable',
  levelCount: 'editable',
  display: 'structureEditable',
  ...EQUIPMENT_CONTRIBUTION_EDITOR_COVERAGE,
} as const satisfies Readonly<Record<keyof GearTraitDefinition, EquipmentEditorCoverage>>;

export const EQUIPMENT_MODIFIER_EDITOR_COVERAGE = {
  attribute: 'editable',
  panelStat: 'editable',
  damageBonus: 'editable',
  damageScale: 'editable',
  staticHealingIncrease: 'editable',
  skillCooldownMultiplier: 'editable',
} as const satisfies Readonly<Record<EquipmentModifierDefinition['kind'], 'editable'>>;

export const EQUIPMENT_EVENT_HANDLER_EDITOR_COVERAGE = {
  key: 'editable',
  priority: 'editable',
  condition: 'structureEditable',
  sequence: 'structureEditable',
  event: 'editable',
  abilityEvent: 'editable',
} as const satisfies Readonly<
  Record<keyof EquipmentEventHandlerDefinition, EquipmentEditorCoverage>
>;

export const WEAPON_INSTANCE_EDITOR_COVERAGE = {
  weaponSlug: 'fixedIdentity',
  level: 'editable',
  tuned: 'editable',
  potential: 'editable',
  traitLevels: 'editable',
} as const satisfies Readonly<Record<keyof WeaponInstanceDocument, EquipmentEditorCoverage>>;

export const GEAR_INSTANCE_EDITOR_COVERAGE = {
  gearSlug: 'fixedIdentity',
  artificingLevels: 'editable',
} as const satisfies Readonly<Record<keyof GearInstanceDocument, EquipmentEditorCoverage>>;
