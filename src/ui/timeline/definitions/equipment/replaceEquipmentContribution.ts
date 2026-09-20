import type { EquipmentContributionDefinition } from '../../../../core/game-data/equipmentDefinition';

// Exhaustive against the public protocol: a new contribution field must also participate
// in replacement. The graph emits a complete snapshot, not a partial patch.
const contributionFields = {
  modifiers: true,
  eventHandlers: true,
  buffDefinitions: true,
  blackboard: true,
  enableSequence: true,
  initializationSequence: true,
} satisfies Record<keyof EquipmentContributionDefinition, true>;

/** Replace graph-owned data without overwriting the host's identity/display metadata. */
export function replaceEquipmentContribution<T extends EquipmentContributionDefinition>(
  host: T,
  contribution: EquipmentContributionDefinition,
): T {
  const next = { ...host };
  for (const key of Object.keys(contributionFields) as Array<
    keyof EquipmentContributionDefinition
  >) {
    delete next[key];
    if (contribution[key] !== undefined) Object.assign(next, { [key]: contribution[key] });
  }
  return next;
}
