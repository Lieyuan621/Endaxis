import { describe, expect, it } from 'vitest';

import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { projectSkillEnhancementTimelineViz } from './skillEnhancementTimelineViz';

function entry(
  sequence: number,
  frame: number,
  event: 'BuffApplied' | 'BuffFinished',
  targetId: string,
  buffId: string,
  instanceId: number,
  sourceActionId?: string,
): CombatReceiptEntry {
  return {
    sequence,
    frame,
    time: frame / 30,
    event,
    targetId,
    data: { buffId, instanceId, ...(sourceActionId === undefined ? {} : { sourceActionId }) },
  };
}

const binding = { castId: 'cast:ultimate', targetId: 'operator:1', buffId: 'buff:enhance' };

describe('skill enhancement timeline projection', () => {
  it('projects the exact source cast Buff instance until its actual finish', () => {
    expect(
      projectSkillEnhancementTimelineViz(
        [
          entry(1, 47, 'BuffApplied', 'operator:1', 'buff:enhance', 9, 'cast:ultimate'),
          entry(2, 647, 'BuffFinished', 'operator:1', 'buff:enhance', 9),
        ],
        900,
        [binding],
      ),
    ).toEqual([
      {
        ...binding,
        instanceId: 9,
        startFrame: 47,
        endFrame: 647,
        completed: true,
      },
    ]);
  });

  it('ignores wrong cast, Buff and target identities', () => {
    const entries = [
      entry(1, 10, 'BuffApplied', 'operator:1', 'buff:enhance', 1, 'cast:other'),
      entry(2, 11, 'BuffApplied', 'operator:1', 'buff:other', 2, 'cast:ultimate'),
      entry(3, 12, 'BuffApplied', 'operator:2', 'buff:enhance', 3, 'cast:ultimate'),
    ];
    expect(projectSkillEnhancementTimelineViz(entries, 100, [binding])).toEqual([]);
  });

  it('does not split a refreshed instance and closes open instances at simulation end', () => {
    const entries = [
      entry(1, 20, 'BuffApplied', 'operator:1', 'buff:enhance', 4, 'cast:ultimate'),
      entry(2, 80, 'BuffApplied', 'operator:1', 'buff:enhance', 4, 'cast:ultimate'),
    ];
    expect(projectSkillEnhancementTimelineViz(entries, 120, [binding])).toEqual([
      {
        ...binding,
        instanceId: 4,
        startFrame: 20,
        endFrame: 120,
        completed: false,
      },
    ]);
  });
});
