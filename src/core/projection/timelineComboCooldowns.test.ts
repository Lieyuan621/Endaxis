import { describe, expect, it } from 'vitest';
import { projectTimelineComboCooldowns } from './timelineComboCooldowns';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';

describe('timeline combo cooldown bands', () => {
  it('splits repeated controls and closes on actual ready rather than a static duration', () => {
    const events = [
      [5, 'TimelineComboCooldownControlled', { mode: 'cooldown' }],
      [20, 'TimelineComboCooldownControlled', { mode: 'cooldown' }],
      [60, 'SkillCooldownAdjusted', { ready: true }],
    ] as const;
    const entries: CombatReceiptEntry[] = events.map(([frame, event, data], sequence) => ({
      sequence,
      frame,
      time: frame / 30,
      event,
      sourceId: 'owner',
      data: { skillId: 'combo', ...data },
    }));
    expect(
      projectTimelineComboCooldowns(entries, 100).map(band => [band.startFrame, band.endFrame]),
    ).toEqual([
      [5, 20],
      [20, 60],
    ]);
  });
});
