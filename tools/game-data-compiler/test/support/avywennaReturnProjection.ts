import { fixtureGameplayTagRegistry } from '../gameplayTagFixtures.ts';
import { parseKnownNativeActionLeafSource } from '../../src/source/actionLeaf.ts';
import { parseNativeSequenceSource } from '../../src/source/controlFlow.ts';

export const returnProjectionContext = {
  gameplayTagRegistry: fixtureGameplayTagRegistry,
  actionOwnerTarget: 'unavailable',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'enemy',
} as const;

export function parseReturnSequence(value: unknown, path: string) {
  return parseNativeSequenceSource(value, path, {}, (value, path) =>
    parseKnownNativeActionLeafSource(value, path, {}),
  );
}
