import { describe, expect, it } from 'vitest';
import { compileTimeline } from './compiler/compileTimeline';
import type { Action, ActionNode } from './compiler/types';
import type { OperatorStateEvent } from './engine/types';
import {
  getNumericUltimateEnhancements,
  getUltimateEnhancementMetricsMap,
  getStatusBoundUltimateCooldownStart,
} from './ultimateEnhancement';

function action(
  id: string,
  start: number,
  patch: Partial<Action> = {},
  trackId = 'owner',
): ActionNode {
  return {
    id,
    type: 'action',
    trackId,
    trackIndex: 0,
    node: {
      id,
      instanceId: id,
      skillId: id,
      name: id,
      type: 'battleSkill',
      startTime: start,
      logicalStartTime: start,
      duration: 1,
      cooldown: 0,
      spCost: 0,
      gaugeCost: 0,
      gaugeGain: 0,
      teamGaugeGain: 0,
      element: 'heat',
      hits: [],
      ...patch,
    },
  };
}
const ultimate = (patch: Partial<Action> = {}, trackId = 'owner') =>
  action(
    'ult',
    0,
    {
      type: 'ultimate',
      duration: 1,
      animationTime: 1,
      enhancementTime: 5,
      enhancementExtension: { skillTypes: ['battleSkill', 'comboSkill'] },
      ...patch,
    },
    trackId,
  );

describe('shared ultimate enhancement timing', () => {
  it('extends through newly included actions once, ignoring disabled, ghost and other-owner skills', () => {
    const timeline = compileTimeline([
      ultimate(),
      action('late', 7),
      action('first', 2, { duration: 2 }),
      action('disabled', 3, { duration: 100, isDisabled: true }),
      action('ghost', 3.5, { duration: 100, triggerWindow: -1 }),
      action('other', 4, { duration: 100 }, 'other'),
      action('basic', 5, { type: 'basicAttack', duration: 100 }),
      action('at-end', 9, { duration: 100 }),
    ]);
    expect(getNumericUltimateEnhancements(timeline).get('ult')).toEqual({
      enhStart: 1,
      baseDuration: 5,
      finalEnd: 9,
      extensionAmount: 3,
    });
  });

  it('preserves configured duration even if the extending action is interrupted', () => {
    const timeline = compileTimeline([
      ultimate(),
      action('battle', 2, { duration: 3 }),
      action('interrupt', 3, { type: 'basicAttack' }),
    ]);
    expect(timeline.actionMap.get('battle')?.isInterrupted).toBe(true);
    expect(getNumericUltimateEnhancements(timeline).get('ult')?.finalEnd).toBe(9);
  });

  it('accounts for combo freeze and an external freeze reached by the extension', () => {
    const timeline = compileTimeline([
      ultimate(),
      action('combo', 3, { type: 'comboSkill', duration: 1.5 }),
      action('external', 7, { type: 'ultimate', duration: 2, animationTime: 2 }, 'other'),
    ]);
    expect(getNumericUltimateEnhancements(timeline).get('ult')?.finalEnd).toBe(10);
  });

  it('does not infer extension from a character name without configuration', () => {
    const timeline = compileTimeline([
      ultimate({ enhancementExtension: undefined }, 'laevatain'),
      action('battle', 2, { duration: 3 }, 'laevatain'),
    ]);
    expect(getNumericUltimateEnhancements(timeline).get('ult')?.finalEnd).toBe(6);
  });

  it('honors the configured skill filter and refreshes timing on a newly compiled timeline', () => {
    const ult = ultimate({ enhancementExtension: { skillTypes: ['battleSkill'] } });
    const combo = action('combo', 3, { type: 'comboSkill', duration: 3 });
    const before = compileTimeline([ult, combo]);
    expect(getNumericUltimateEnhancements(before).get('ult')?.finalEnd).toBe(6.5);
    const after = compileTimeline([ult, combo, action('battle', 4, { duration: 2 })]);
    expect(getNumericUltimateEnhancements(after).get('ult')?.finalEnd).toBe(8.5);
    expect(getNumericUltimateEnhancements(before).get('ult')?.finalEnd).toBe(6.5);
  });

  it('merges refreshed status windows without creating a second bar or caching live logs', () => {
    const timeline = compileTimeline([
      ultimate({ enhancementTime: 'stance' }),
      action('second', 3, { type: 'ultimate', animationTime: 1, enhancementTime: 'stance' }),
    ]);
    const log: OperatorStateEvent[] = [
      {
        type: 'OPERATOR_EFFECT_APPLY',
        time: 1,
        id: 'stance',
        actionId: 'ult',
        sourceId: 'owner',
        targetTrackId: 'owner',
        expiresAt: 3,
        stacks: 1,
        maxStacks: 1,
        value: 1,
      },
      {
        type: 'OPERATOR_EFFECT_APPLY',
        time: 3,
        id: 'stance',
        actionId: 'second',
        sourceId: 'owner',
        targetTrackId: 'owner',
        expiresAt: 8,
        stacks: 1,
        maxStacks: 1,
        value: 1,
      },
    ];
    const first = getUltimateEnhancementMetricsMap(timeline, log);
    expect(first.get('ult')?.finalEnd).toBe(8);
    expect(first.has('second')).toBe(false);
    log.push({
      type: 'OPERATOR_EFFECT_EXPIRE',
      time: 6,
      id: 'stance',
      targetTrackId: 'owner',
      consumed: true,
    });
    expect(getUltimateEnhancementMetricsMap(timeline, log).get('ult')?.finalEnd).toBe(6);
    expect(getStatusBoundUltimateCooldownStart(timeline.actionMap.get('second')!, log)).toBe(6);
  });
});
