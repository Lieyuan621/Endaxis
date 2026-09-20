import { describe, expect, it } from 'vitest';
import { CombatClock } from '../time/combatClock';
import { TimedMarkerContainer } from './timedMarkers';

describe('TimedMarkerContainer', () => {
  it('keeps duplicate ids independent and filters expired entries by the shared clock', () => {
    const clock = new CombatClock();
    const markers = new TimedMarkerContainer('operator', clock);
    const first = markers.add('voice', 1 / 30);
    markers.add('voice', 2 / 30);

    expect(markers.has('voice')).toBe(true);
    first.remove();
    expect(markers.has('voice')).toBe(true);
    clock.advanceFrame();
    clock.advanceFrame();
    expect(markers.has('voice')).toBe(true);
    clock.advanceFrame();
    expect(markers.has('voice')).toBe(false);
  });

  it('为同名实例分配稳定身份并只发布一次结束边沿', () => {
    const clock = new CombatClock();
    const created: string[] = [];
    const finished: string[] = [];
    const markers = new TimedMarkerContainer('abilityEntity:7', clock, {
      created: marker => created.push(marker.sourceTargetId),
      finished: (marker, reason) => finished.push(`${marker.sourceTargetId}:${reason}`),
    });
    const first = markers.add('window', 0);
    const second = markers.add('window', 1);

    expect(created).toEqual(['abilityEntity:7:timed-marker:1', 'abilityEntity:7:timed-marker:2']);
    expect(markers.latestActiveSourceTargetId('window')).toBe(second.sourceTargetId);
    first.remove();
    first.remove();
    expect(finished).toEqual(['abilityEntity:7:timed-marker:1:removed']);

    clock.advanceFrame();
    markers.sweep();
    expect(finished).toHaveLength(1);
    markers.finishAll();
    expect(finished).toEqual([
      'abilityEntity:7:timed-marker:1:removed',
      'abilityEntity:7:timed-marker:2:ownerFinished',
    ]);
  });

  it('超过绑定时钟的有效容差后即使无人查询也发布过期边沿', () => {
    const clock = new CombatClock();
    const finished: string[] = [];
    const markers = new TimedMarkerContainer('abilityEntity:1', clock, {
      finished: (marker, reason) => finished.push(`${marker.markerId}:${reason}`),
    });
    markers.add('short', 1 / 30);

    clock.advanceFrame();
    markers.sweep();
    expect(finished).toEqual([]);
    clock.advanceFrame();
    markers.sweep();
    expect(finished).toEqual(['short:expired']);
  });
});
