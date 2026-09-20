import { describe, expect, it } from 'vitest';
import {
  projectTimelineOperationMarkers,
  timelineOperationKeycapLabel,
} from './timelineOperationMarkers';

describe('timeline operation marker projection', () => {
  it('uses the default bindings shown by the in-game controller guide', () => {
    expect(
      [0, 1, 2, 3].map(index => timelineOperationKeycapLabel('skill', index, 'gamepad')),
    ).toEqual(['LB+X', 'LB+Y', 'LB+B', 'LB+A']);
    expect(
      [0, 1, 2, 3].map(index => timelineOperationKeycapLabel('switch', index, 'gamepad')),
    ).toEqual(['LB+←', 'LB+↑', 'LB+→', 'LB+↓']);
    expect(timelineOperationKeycapLabel('combo', 2, 'gamepad')).toBe('RB');
    expect(timelineOperationKeycapLabel('ultimate', 2, 'gamepad')).toBe('LB+B (Hold)');
    const markers = projectTimelineOperationMarkers(
      [{ id: 'skill', kind: 'skill', trackIndex: 0, frame: 0 }],
      0,
      1,
      true,
      0,
      'gamepad',
    );
    expect(markers[0]).toMatchObject({ label: 'LB+X', width: 40 });
  });
  it('同一时刻保持轨道输入顺序，不按实例 ID 重排', () => {
    const markers = projectTimelineOperationMarkers(
      [
        { id: 'z', kind: 'skill', trackIndex: 0, frame: 0 },
        { id: 'a', kind: 'skill', trackIndex: 1, frame: 0 },
      ],
      0,
      2,
    );
    expect(markers.map(marker => [marker.label, marker.top])).toEqual([
      ['1', 0],
      ['2', 16],
    ]);
  });
  it('uses the legacy labels and widths without persisting presentation data', () => {
    const markers = projectTimelineOperationMarkers(
      [
        { id: 'skill', kind: 'skill', trackIndex: 1, frame: 30 },
        { id: 'combo', kind: 'combo', trackIndex: 2, frame: 60 },
        { id: 'ultimate', kind: 'ultimate', trackIndex: 0, frame: 90, durationFrames: 40 },
        { id: 'switch', kind: 'switch', trackIndex: 3, frame: 150 },
      ],
      30,
      2,
    );

    expect(markers.map(marker => [marker.id, marker.label, marker.width])).toEqual([
      ['skill', '2', 20],
      ['combo', 'E', 20],
      ['ultimate', '1 (Hold)', null],
      ['switch', 'F4', 28],
    ]);
  });

  it('stacks overlapping caps using the legacy compact depth rules', () => {
    const markers = projectTimelineOperationMarkers(
      [
        { id: 'a', kind: 'skill', trackIndex: 0, frame: 10 },
        { id: 'b', kind: 'combo', trackIndex: 0, frame: 10 },
        { id: 'c', kind: 'switch', trackIndex: 0, frame: 10 },
        { id: 'd', kind: 'skill', trackIndex: 0, frame: 10 },
      ],
      0,
      1,
    );

    expect(markers.map(marker => marker.top)).toEqual([0, 10, 20, 30]);
    expect(markers.every(marker => marker.height === 10 && marker.fontSize === 8)).toBe(true);
  });

  it('only marks a combo as perfect when projection evidence supplies it', () => {
    const [ordinary, perfect] = projectTimelineOperationMarkers(
      [
        { id: 'ordinary', kind: 'combo', trackIndex: 0, frame: 0 },
        { id: 'perfect', kind: 'combo', trackIndex: 0, frame: 60, perfect: true },
      ],
      0,
      1,
    );
    expect(ordinary?.perfect).toBe(false);
    expect(perfect?.perfect).toBe(true);
  });

  it('projects operation caps through the collapsed preparatory inset', () => {
    const markers = projectTimelineOperationMarkers(
      [
        { id: 'prep', kind: 'skill', trackIndex: 0, frame: -75 },
        { id: 'battle', kind: 'skill', trackIndex: 0, frame: 30 },
      ],
      150,
      2,
      false,
    );
    expect(markers.find(marker => marker.id === 'prep')?.left).toBe(-132);
    expect(markers.find(marker => marker.id === 'battle')?.left).toBe(78);
  });
});
