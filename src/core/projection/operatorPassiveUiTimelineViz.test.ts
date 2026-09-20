import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import {
  layoutOperatorPassiveUiTimelineSegments,
  projectOperatorPassiveUiTimelineViz,
} from './operatorPassiveUiTimelineViz';

describe('projectOperatorPassiveUiTimelineViz', () => {
  it('把连续非零数值按每次变化切成持续段，归零时结束', () => {
    const entries: CombatReceiptEntry[] = [
      {
        sequence: 0,
        frame: 5,
        time: 5 / 30,
        event: 'CharacterPassiveUiValueChanged',
        targetId: 'operator:1',
        data: { value: 1 },
      },
      {
        sequence: 1,
        frame: 10,
        time: 10 / 30,
        event: 'CharacterPassiveUiValueChanged',
        targetId: 'operator:1',
        data: { value: 2 },
      },
      {
        sequence: 2,
        frame: 12,
        time: 12 / 30,
        event: 'CharacterPassiveUiValueChanged',
        targetId: 'operator:1',
        data: { value: 2 },
      },
      {
        sequence: 3,
        frame: 15,
        time: 15 / 30,
        event: 'CharacterPassiveUiValueChanged',
        targetId: 'operator:1',
        data: { value: 0 },
      },
      {
        sequence: 4,
        frame: 20,
        time: 20 / 30,
        event: 'CharacterPassiveUiValueChanged',
        targetId: 'operator:1',
        data: { value: 9 },
      },
    ];

    expect(
      projectOperatorPassiveUiTimelineViz(entries, 30, [
        {
          operatorId: 'operator:1',
          definition: {
            kind: 'numeric',
            appearance: 'laevatainCounter',
            maximum: 4,
            activeAt: 4,
          },
        },
      ]),
    ).toEqual([
      {
        kind: 'numeric',
        appearance: 'laevatainCounter',
        operatorId: 'operator:1',
        startFrame: 5,
        endFrame: 10,
        value: 1,
        maximum: 4,
        active: false,
      },
      {
        kind: 'numeric',
        appearance: 'laevatainCounter',
        operatorId: 'operator:1',
        startFrame: 10,
        endFrame: 15,
        value: 2,
        maximum: 4,
        active: false,
      },
      {
        kind: 'numeric',
        appearance: 'laevatainCounter',
        operatorId: 'operator:1',
        startFrame: 20,
        endFrame: 30,
        value: 4,
        maximum: 4,
        active: true,
      },
    ]);
  });

  it('把专属进度 Buff 的生效区间投影为专属 UI 段', () => {
    const entries: CombatReceiptEntry[] = [
      {
        sequence: 0,
        frame: 2,
        time: 2 / 30,
        event: 'BuffApplied',
        targetId: 'operator:1',
        data: { buffId: 'normal', instanceId: 1 },
      },
      {
        sequence: 1,
        frame: 8,
        time: 8 / 30,
        event: 'BuffFinished',
        targetId: 'operator:1',
        data: { buffId: 'normal', instanceId: 1 },
      },
      {
        sequence: 2,
        frame: 10,
        time: 10 / 30,
        event: 'BuffApplied',
        targetId: 'operator:1',
        data: { buffId: 'ultimate', instanceId: 2 },
      },
    ];

    expect(
      projectOperatorPassiveUiTimelineViz(entries, 20, [
        {
          operatorId: 'operator:1',
          definition: {
            kind: 'buffProgress',
            appearance: 'liinoMusic',
            normalBuffId: 'normal',
            ultimateBuffId: 'ultimate',
          },
        },
      ]),
    ).toEqual([
      {
        kind: 'buffProgress',
        appearance: 'liinoMusic',
        operatorId: 'operator:1',
        startFrame: 2,
        endFrame: 8,
        mode: 'normal',
        buffId: 'normal',
        instanceId: 1,
      },
      {
        kind: 'buffProgress',
        appearance: 'liinoMusic',
        operatorId: 'operator:1',
        startFrame: 10,
        endFrame: 20,
        mode: 'ultimate',
        buffId: 'ultimate',
        instanceId: 2,
      },
    ]);
  });

  it('只按战斗中的猎矢和启示层数投影 Typhoea HUD', () => {
    const definition = {
      kind: 'buffCounters' as const,
      appearance: 'typhoeaArrows' as const,
      reserveArrowBuffId: 'reserve',
      battleArrowBuffId: 'battle',
      pointBuffId: 'points',
      maximumArrows: 4,
      maximumPoints: 8,
    };
    const entries: CombatReceiptEntry[] = [
      {
        sequence: -1,
        frame: 1,
        time: 1 / 30,
        event: 'BuffApplied',
        targetId: 'operator:1',
        data: { buffId: 'reserve', instanceId: 0, layers: 3 },
      },
      {
        sequence: 0,
        frame: 2,
        time: 2 / 30,
        event: 'BuffApplied',
        targetId: 'operator:1',
        data: { buffId: 'battle', instanceId: 1, layers: 2 },
      },
      {
        sequence: 1,
        frame: 4,
        time: 4 / 30,
        event: 'BuffApplied',
        targetId: 'operator:1',
        data: { buffId: 'points', instanceId: 2, layers: 6 },
      },
      {
        sequence: 2,
        frame: 8,
        time: 8 / 30,
        event: 'BuffFinished',
        targetId: 'operator:1',
        data: { buffId: 'battle', instanceId: 1 },
      },
    ];

    expect(
      projectOperatorPassiveUiTimelineViz(entries, 10, [{ operatorId: 'operator:1', definition }]),
    ).toEqual([
      {
        kind: 'buffCounters',
        appearance: 'typhoeaArrows',
        operatorId: 'operator:1',
        startFrame: 2,
        endFrame: 4,
        battleArrows: 2,
        points: 0,
        maximumArrows: 4,
        maximumPoints: 8,
      },
      {
        kind: 'buffCounters',
        appearance: 'typhoeaArrows',
        operatorId: 'operator:1',
        startFrame: 4,
        endFrame: 8,
        battleArrows: 2,
        points: 6,
        maximumArrows: 4,
        maximumPoints: 8,
      },
      {
        kind: 'buffCounters',
        appearance: 'typhoeaArrows',
        operatorId: 'operator:1',
        startFrame: 8,
        endFrame: 10,
        battleArrows: 0,
        points: 6,
        maximumArrows: 4,
        maximumPoints: 8,
      },
    ]);
  });

  it('可以在已有 Buff lane 后继续排布', () => {
    const segments = projectOperatorPassiveUiTimelineViz(
      [
        {
          sequence: 0,
          frame: 1,
          time: 1 / 30,
          event: 'CharacterPassiveUiValueChanged',
          targetId: 'operator:1',
          data: { value: 1 },
        },
      ],
      10,
      [
        {
          operatorId: 'operator:1',
          definition: { kind: 'numeric', appearance: 'tangtangDroplets', maximum: 2 },
        },
      ],
    );
    expect(layoutOperatorPassiveUiTimelineSegments(segments, 3)[0]?.lane).toBe(3);
  });
});
