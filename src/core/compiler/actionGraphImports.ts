import type { ResolvedAbilityEntityDefinition } from './combatProgram';
import type { ProjectileDefinition } from '../../../packages/game-data-contract/src/projectiles';

export interface ActionGraphImports {
  readonly abilityEntities: Readonly<Record<string, ResolvedAbilityEntityDefinition>>;
  readonly projectiles: Readonly<Record<string, ProjectileDefinition>>;
}
export const EMPTY_GRAPH_IMPORTS: ActionGraphImports = Object.freeze({
  abilityEntities: Object.freeze({}),
  projectiles: Object.freeze({}),
});
