import type { OperatorDefinition } from '../../../../core/game-data/operatorDefinition';
import { structurePathSegments } from '../skillStructureEditorCommands';

/** Presentation ownership only. Contract members and simulation rules remain authoritative. */
export const OPERATOR_WORKSPACE_FIELDS = {
  slug: { area: 'identity', access: 'readonly' },
  gameId: { area: 'identity', access: 'readonly' },
  displayName: { area: 'profile', access: 'editable' },
  assetSlug: { area: 'profile', access: 'editable' },
  rarity: { area: 'profile', access: 'editable' },
  defaultPotential: { area: 'defaults', access: 'editable' },
  weaponType: { area: 'profile', access: 'editable' },
  element: { area: 'profile', access: 'editable' },
  role: { area: 'profile', access: 'editable' },
  mainAttribute: { area: 'profile', access: 'editable' },
  secondaryAttribute: { area: 'profile', access: 'editable' },
  attributes: { area: 'growth', access: 'editable' },
  trustAttributeBonus: { area: 'growth', access: 'editable' },
  skillGroups: { area: 'skills', access: 'editable' },
  skillSlots: { area: 'actionRouting', access: 'editable' },
  playerActionRoutes: { area: 'actionRouting', access: 'editable' },
  playerActionModes: { area: 'actionRouting', access: 'editable' },
  skillAliases: { area: 'provenance', access: 'readonly' },
  dodgeSkill: { area: 'skills', access: 'readonly' },
  dashBuffs: { area: 'buffs', access: 'readonly' },
  buffDefinitions: { area: 'buffs', access: 'editable' },
  buffDisplayNameKeys: { area: 'provenance', access: 'readonly' },
  skillDisplayNameKeys: { area: 'provenance', access: 'readonly' },
  abilityEntityDefinitions: { area: 'entities', access: 'editable' },
  comboSkillConditions: { area: 'combo', access: 'editable' },
  comboSkillPriority: { area: 'combo', access: 'editable' },
  entityBlackboard: { area: 'blackboard', access: 'editable' },
  entityBlackboardInitializers: { area: 'initialization', access: 'editable' },
  passiveSkills: { area: 'passives', access: 'editable' },
  eventHandlers: { area: 'listeners', access: 'editable' },
  passiveUi: { area: 'presentation', access: 'editable' },
  talents: { area: 'talents', access: 'editable' },
  potentials: { area: 'potentials', access: 'editable' },
  conversionSupport: { area: 'provenance', access: 'readonly' },
} as const satisfies Record<
  keyof OperatorDefinition,
  { area: string; access: 'readonly' | 'editable' }
>;

export type OperatorWorkspaceArea =
  (typeof OPERATOR_WORKSPACE_FIELDS)[keyof OperatorDefinition]['area'];

/** Reuse field ownership for diagnostics; unknown paths must not guess a page. */
export function operatorWorkspaceIssueTarget(path: string): OperatorWorkspaceTarget | undefined {
  const parts = structurePathSegments(path.replace(/^\$\.?/, ''));
  const field = parts[0];
  if (typeof field !== 'string' || !Object.hasOwn(OPERATOR_WORKSPACE_FIELDS, field))
    return undefined;
  return { kind: 'field', field: field as keyof OperatorDefinition, path: parts.slice(1) };
}
export type OperatorWorkspaceTarget =
  | { kind: 'area'; area: OperatorWorkspaceArea }
  | { kind: 'talent'; slot: 0 | 1 }
  | { kind: 'potential'; slot: 0 | 1 | 2 | 3 | 4 }
  | { kind: 'field'; field: keyof OperatorDefinition; path: readonly (string | number)[] };

/** A location is independent of component names, active tabs and mutable display labels. */
export function operatorWorkspaceTargetPath(
  target: OperatorWorkspaceTarget,
): readonly (string | number)[] | undefined {
  if (target.kind === 'area') return undefined;
  if (target.kind === 'talent') return ['talents', target.slot];
  if (target.kind === 'potential') return ['potentials', target.slot];
  return [target.field, ...target.path];
}

export function operatorWorkspaceTargetArea(
  target: OperatorWorkspaceTarget,
): OperatorWorkspaceArea {
  if (target.kind === 'area') return target.area;
  if (target.kind === 'talent') return 'talents';
  if (target.kind === 'potential') return 'potentials';
  return OPERATOR_WORKSPACE_FIELDS[target.field].area;
}
