import { describe, expect, it } from 'vitest';
import { compileTimeline } from './compileTimeline';
import type { Action, ActionNode, Hit } from './types';

function hit(offset: number): Hit {
  return { offset, spRecovery: 0, spReturn: 0, stagger: 0, multiplier: 100 };
}

function basicAttackNode(
  id: string,
  hits: Hit[],
  seq?: { index: number; total: number },
): ActionNode {
  const node = {
    instanceId: id,
    id,
    skillId: id,
    type: 'basicAttack',
    name: id,
    logicalStartTime: 0,
    element: 'physical',
    enhancementTime: 0,
    startTime: 0,
    cooldown: 0,
    spCost: 0,
    gaugeCost: 0,
    gaugeGain: 0,
    teamGaugeGain: 0,
    duration: 1,
    triggerWindow: 0,
    animationTime: 0,
    hits,
    ...(seq ? { sequenceIndex: seq.index, sequenceTotal: seq.total } : {}),
  } as unknown as Action;
  return { id, type: 'action', trackId: '', trackIndex: 0, node };
}

describe('compileTimeline — finalStrike auto-tagging', () => {
  it('tags only the last hit of a completed basic-attack sequence as finalStrike', () => {
    const result = compileTimeline([
      basicAttackNode('A', [hit(0), hit(0.5)], { index: 3, total: 3 }),
    ]);
    const hits = result.actions[0]!.resolvedHits;
    expect(hits[0]!.skillType).toBe('basicAttack');
    expect(hits[1]!.skillType).toBe('finalStrike');
  });

  it('tags a single-hit basic attack (no sequence info) as finalStrike', () => {
    const result = compileTimeline([basicAttackNode('A', [hit(0)])]);
    expect(result.actions[0]!.resolvedHits[0]!.skillType).toBe('finalStrike');
  });

  it('does not tag finalStrike mid-sequence', () => {
    const result = compileTimeline([
      basicAttackNode('A', [hit(0), hit(0.5)], { index: 1, total: 3 }),
    ]);
    for (const h of result.actions[0]!.resolvedHits) {
      expect(h.skillType).toBe('basicAttack');
    }
  });
});
