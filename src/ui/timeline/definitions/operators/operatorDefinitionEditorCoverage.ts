import type { OperatorDefinition } from '../../../../core/game-data/operatorDefinition';

export type OperatorDefinitionEditorCoverage =
  'identityReadOnly' | 'editable' | 'structureEditable' | 'preservedOnly';

/**
 * 干员根定义编辑覆盖账本。
 *
 * 这里不重定义干员协议，只要求公共契约新增或删除根字段时显式选择编辑边界。
 * `preservedOnly` 不是“可以丢弃”，而是当前只能随完整草稿无损往返，尚无专用控件。
 */
export const OPERATOR_DEFINITION_EDITOR_COVERAGE = {
  slug: 'identityReadOnly',
  displayName: 'editable',
  assetSlug: 'editable',
  gameId: 'identityReadOnly',
  rarity: 'editable',
  defaultPotential: 'editable',
  weaponType: 'editable',
  element: 'editable',
  role: 'editable',
  mainAttribute: 'editable',
  secondaryAttribute: 'editable',
  attributes: 'editable',
  trustAttributeBonus: 'editable',
  skillGroups: 'structureEditable',
  skillSlots: 'preservedOnly',
  playerActionRoutes: 'preservedOnly',
  playerActionModes: 'preservedOnly',
  skillAliases: 'preservedOnly',
  dodgeSkill: 'preservedOnly',
  dashBuffs: 'preservedOnly',
  buffDefinitions: 'structureEditable',
  buffDisplayNameKeys: 'preservedOnly',
  skillDisplayNameKeys: 'preservedOnly',
  abilityEntityDefinitions: 'structureEditable',
  comboSkillConditions: 'structureEditable',
  comboSkillPriority: 'preservedOnly',
  entityBlackboard: 'editable',
  passiveUi: 'preservedOnly',
  entityBlackboardInitializers: 'editable',
  passiveSkills: 'structureEditable',
  eventHandlers: 'structureEditable',
  talents: 'structureEditable',
  potentials: 'structureEditable',
  conversionSupport: 'preservedOnly',
} as const satisfies Readonly<Record<keyof OperatorDefinition, OperatorDefinitionEditorCoverage>>;

export function getOperatorDefinitionEditorCoverage(): Readonly<
  Record<OperatorDefinitionEditorCoverage, number>
> {
  const result: Record<OperatorDefinitionEditorCoverage, number> = {
    identityReadOnly: 0,
    editable: 0,
    structureEditable: 0,
    preservedOnly: 0,
  };
  for (const status of Object.values(OPERATOR_DEFINITION_EDITOR_COVERAGE)) result[status] += 1;
  return result;
}
