import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';

/** Ephemeral event provenance, never serialized. Equal graph objects may be reused in
 * different macro namespaces, so both the immutable value and active address matter. */
export interface GraphInteractionSnapshot {
  readonly value: ActionGraphDefinition;
  readonly scope?: string;
}
