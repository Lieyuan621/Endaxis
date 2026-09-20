import { expect, it } from 'vitest';
import { ABILITY_EVENTS } from '../../../../../packages/game-data-contract/src/abilityEvents';
import { abilityEventDisplayLabel, abilityEventLabelsZh } from './abilityEventPresentation';
it('covers the shared protocol without changing identities or inventing unknown event labels', () => {
  expect(Object.keys(abilityEventLabelsZh).sort()).toEqual([...ABILITY_EVENTS].sort());
  for (const event of ABILITY_EVENTS) {
    expect(abilityEventDisplayLabel(event, 'zh-CN')).toContain(` · ${event}`);
    expect(abilityEventDisplayLabel(event, 'en')).toBe(event);
  }
  expect(abilityEventDisplayLabel('futureEvent', 'zh-CN')).toBe('futureEvent');
});
