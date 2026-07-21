import { describe, expect, it } from 'vitest';
import { enrichBattleLogAttribution } from './enrichBattleLogAttribution';

describe('enrichBattleLogAttribution', () => {
  it('fills INFLICTION_CONSUMED / expire sourceId from prior applies', () => {
    const enriched = enrichBattleLogAttribution([
      {
        type: 'INFLICTION_APPLY',
        time: 1,
        channel: 'enemy',
        payload: { element: 'heat', sourceId: 'laevatain', stacks: 2 },
      },
      {
        type: 'INFLICTION_CONSUMED',
        time: 2,
        channel: 'enemy',
        payload: { element: 'heat', consumedStacks: 2 },
      },
      {
        type: 'ENEMY_EFFECT_EXPIRE',
        time: 20,
        channel: 'enemy',
        payload: { kind: 'infliction', element: 'heat', consumed: false },
      },
    ]);

    expect(enriched[1].payload.sourceId).toBe('laevatain');
    expect(enriched[2].payload.sourceId).toBe('laevatain');
  });

  it('copies operator apply source/action onto matching expire', () => {
    const enriched = enrichBattleLogAttribution([
      {
        type: 'OPERATOR_EFFECT_APPLY',
        time: 1,
        channel: 'operator',
        payload: {
          id: 'atk-buff',
          targetTrackId: 'beta',
          sourceId: 'alpha',
          actionId: 'act_1',
          stacks: 1,
        },
      },
      {
        type: 'OPERATOR_EFFECT_EXPIRE',
        time: 10,
        channel: 'operator',
        payload: {
          id: 'atk-buff',
          targetTrackId: 'beta',
          consumed: false,
        },
      },
    ]);

    expect(enriched[1].payload.sourceId).toBe('alpha');
    expect(enriched[1].payload.actionId).toBe('act_1');
  });
});
