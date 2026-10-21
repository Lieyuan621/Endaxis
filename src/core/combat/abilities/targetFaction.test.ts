import { describe, expect, it } from 'vitest';
import { COMBAT_FACTIONS } from '../../../../packages/game-data-contract/src/primitives';
import { isAntiFaction, isFactionTargetUnmarkable } from './targetFaction';

describe('native faction masks and markability', () => {
  it('preserves the native mask including neutral and invalid targets', () => {
    expect(
      COMBAT_FACTIONS.map(source =>
        COMBAT_FACTIONS.filter(target => isAntiFaction(source, target)),
      ),
    ).toEqual([['invalid'], ['invalid'], ['bad', 'neutral'], ['good', 'neutral'], ['good', 'bad']]);
  });
  it('does not exclude an ally solely for its IsUnMarkableAlly tag', () => {
    expect(isFactionTargetUnmarkable('good', 'good', name => name === 'IsUnMarkableAlly')).toBe(
      false,
    );
    expect(isFactionTargetUnmarkable('good', 'good', name => name === 'IsUnMarkable')).toBe(true);
  });
  it('uses both directed enemy relations for the conditional tags', () => {
    expect(isFactionTargetUnmarkable('bad', 'good', name => name === 'IsUnMarkableAnti')).toBe(
      true,
    );
    expect(isFactionTargetUnmarkable('bad', 'good', name => name === 'IsUnMarkableAlly')).toBe(
      true,
    );
    expect(
      isFactionTargetUnmarkable('unknown', 'invalid', name => name === 'IsUnMarkableAlly'),
    ).toBe(false);
    expect(
      isFactionTargetUnmarkable('unknown', 'invalid', name => name === 'IsUnMarkableAnti'),
    ).toBe(true);
  });
});
