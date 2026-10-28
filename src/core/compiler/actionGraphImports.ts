import type { ResolvedAbilityEntityDefinition } from './combatProgram';

export interface ActionGraphImports {
  readonly abilityEntities: Readonly<Record<string, ResolvedAbilityEntityDefinition>>;
}
export const EMPTY_GRAPH_IMPORTS: ActionGraphImports = Object.freeze({
  abilityEntities: Object.freeze({}),
});
