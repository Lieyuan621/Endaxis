import { describe, expect, it } from 'vitest';
import {
  matchTimelineBattleLogPreset,
  resolveTimelineBattleLogPreset,
} from './timelineBattleLogFilterPresets';

const events = [
  'SkillStarted',
  'DamageApplied',
  'SpChanged',
  'BuffApplied',
  'ElementalReactionApplied',
  'ExternalOperatorHitProcessed',
];

describe('timeline battle-log filter presets', () => {
  it('maps the legacy damage and status presets onto explicit Next receipt families', () => {
    expect(resolveTimelineBattleLogPreset('damage', events)).toEqual([
      'SkillStarted',
      'DamageApplied',
      'SpChanged',
    ]);
    expect(resolveTimelineBattleLogPreset('status', events)).toEqual([
      'BuffApplied',
      'ElementalReactionApplied',
    ]);
  });

  it('recognizes exact preset selections without absorbing unrelated events', () => {
    expect(matchTimelineBattleLogPreset(new Set(events), events)).toBe('all');
    expect(matchTimelineBattleLogPreset(new Set(['DamageApplied']), events)).toBeNull();
  });
});
