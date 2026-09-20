import type { CombatBuffDefinitionDamageProcessor } from '../../../../../packages/game-data-contract/src/buffs';

export function createBuffDamageProcessor(
  kind: CombatBuffDefinitionDamageProcessor['kind'],
): CombatBuffDefinitionDamageProcessor {
  return kind === 'damageScale'
    ? { kind, side: 'attacker', zone: 'normal', addition: 0 }
    : {
        kind,
        targetSide: 'attacker',
        attribute: 'Atk',
        values: { slot: 'baseAddition', value: 0 },
        attributeTiming: 'runtime',
      };
}
