import { describe, expect, it } from 'vitest';
import { getDisplayKeyCandidates } from '@/utils/effectDisplay';
import { projectFromSimLog } from './projectEnemyEffects';
import { buildApplyExpireWindows } from './projectTriggeredEffects';

describe('enemy effect projection display keys', () => {
  it('preserves the originating action on delayed arts burst markers', () => {
    const projection = projectFromSimLog([
      {
        type: 'ARTS_BURST',
        time: 11.2,
        element: 'heat',
        sourceId: 'op_a',
        actionId: 'attachment_skill',
      },
    ] as any);

    expect(projection.segments).toEqual([
      expect.objectContaining({
        typeKey: 'infliction',
        start: 11.2,
        actionId: 'attachment_skill',
      }),
    ]);
  });

  it('uses status names for display while preserving runtime status identity', () => {
    const projection = projectFromSimLog(
      [
        {
          type: 'ENEMY_STATUS_APPLY',
          time: 0,
          id: 'tangtang-oldenStare',
          value: 0,
          stacks: 1,
          maxStacks: 1,
          expiresAt: 3,
          sourceId: 'tangtang',
          effect: {
            kind: 'status',
            id: 'tangtang-oldenStare',
            name: 'oldenStare',
            target: 'enemy',
          },
        },
        {
          type: 'ENEMY_EFFECT_EXPIRE',
          time: 3,
          kind: 'status',
          id: 'tangtang-oldenStare',
          consumed: false,
        },
      ] as any,
      [
        {
          type: 'DAMAGE_HIT',
          time: 1,
          payload: {
            targetId: 'enemy',
            sourceId: 'tangtang',
            actionId: 'dot',
            stagger: 0,
            hitData: {
              triggeredBy: 'dot:tangtang-oldenStare',
            },
          },
        },
      ] as any,
    );

    const status = projection.segments.find(segment => !segment.isDamageHit);
    const marker = projection.segments.find(segment => segment.isDamageHit);

    expect(status?.typeKey).toBe('state:oldenStare:tangtang-oldenStare');
    expect(marker?.typeKey).toBe(status?.typeKey);
    expect(getDisplayKeyCandidates(status?.typeKey)).toContain('oldenStare');
  });
});

describe('buildApplyExpireWindows', () => {
  it('keeps a same-timestamp expire→re-apply as a second window', () => {
    const base = {
      kind: 'status' as const,
      id: 'status-a',
      name: 'a',
      target: 'enemy' as const,
      value: 10,
    };
    const windows = buildApplyExpireWindows(
      [
        {
          key: 'status-a',
          time: 1,
          stacks: 1,
          maxStacks: 1,
          expiresAt: 21,
          effect: base,
          effectId: 'status-a',
        },
        {
          key: 'status-a',
          time: 21,
          stacks: 1,
          maxStacks: 1,
          expiresAt: 61,
          effect: { ...base, value: 14 },
          effectId: 'status-a',
        },
      ],
      [
        { key: 'status-a', time: 21 },
        { key: 'status-a', time: 61 },
      ],
    );

    expect(windows.get('status-a')).toEqual([
      expect.objectContaining({ start: 1, end: 21 }),
      expect.objectContaining({ start: 21, end: 61, effect: expect.objectContaining({ value: 14 }) }),
    ]);
  });

  it('keeps a later consume for the last stack-refresh apply (Tangtang whirlpools)', () => {
    const base = {
      kind: 'status' as const,
      id: 'tangtang-whirlpools',
      name: 'whirlpools',
      target: 'self' as const,
      maxStacks: 2,
      duration: 30,
    };
    const windows = buildApplyExpireWindows(
      [
        {
          key: 'tangtang-whirlpools',
          time: 0,
          stacks: 1,
          maxStacks: 2,
          expiresAt: 30,
          effect: base,
          effectId: 'tangtang-whirlpools',
        },
        {
          key: 'tangtang-whirlpools',
          time: 5,
          stacks: 2,
          maxStacks: 2,
          expiresAt: 35,
          effect: base,
          effectId: 'tangtang-whirlpools',
        },
      ],
      [{ key: 'tangtang-whirlpools', time: 10 }],
    );

    expect(windows.get('tangtang-whirlpools')).toEqual([
      expect.objectContaining({ start: 0, end: 5, stacks: 1 }),
      expect.objectContaining({ start: 5, end: 10, stacks: 2 }),
    ]);
  });
});
