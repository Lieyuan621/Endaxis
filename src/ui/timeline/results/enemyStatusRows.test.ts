import { describe, expect, it } from 'vitest';
import type { BuffTimelineSegment } from '../../../core/projection/buffTimelineViz';
import { isEnemyTimelineBuffVisible, layoutEnemyStatusRows } from './enemyStatusRows';

const attachmentIds = new Set(['electric', 'heat']);
function buff(buffId: string, extras: Partial<BuffTimelineSegment> = {}): BuffTimelineSegment {
  return {
    buffId,
    targetId: 'enemy',
    instanceId: 1,
    startFrame: 0,
    endFrame: 100,
    layers: 1,
    placement: 'upper',
    ...extras,
  };
}

describe('enemy status presentation rows', () => {
  it('uses explicit native head-bar routing, not a shared icon or buff name, to hide internal effects', () => {
    const hidden = buff('internal', {
      iconId: 'shared',
      showInHeadBarCommon: false,
      showInHeadBarAttached: false,
    });
    const before = JSON.stringify(hidden);
    expect(isEnemyTimelineBuffVisible(hidden)).toBe(false);
    expect(isEnemyTimelineBuffVisible(buff('icon', { ...hidden, showInHeadBarCommon: true }))).toBe(
      true,
    );
    expect(
      isEnemyTimelineBuffVisible(buff('attachment', { ...hidden, showInHeadBarAttached: true })),
    ).toBe(true);
    expect(isEnemyTimelineBuffVisible(buff('custom', { iconId: 'shared' }))).toBe(true);
    expect(JSON.stringify(hidden)).toBe(before);
  });
  it('never spreads neighboring frames into same-time slots or changes their timing', () => {
    const markers = [
      { kind: 'burst' as const, frame: 30 },
      { kind: 'burst' as const, frame: 31 },
      { kind: 'burst' as const, frame: 32 },
      { kind: 'burst' as const, frame: 31 },
    ];
    const short = buff('electric', { startFrame: 30, endFrame: 31 });
    const refreshed = buff('electric', { startFrame: 31, endFrame: 32, layers: 2 });
    const before = JSON.stringify({ markers, short, refreshed });
    const layout = layoutEnemyStatusRows([short, refreshed], markers, attachmentIds);
    expect(layout.markerPositions).toEqual([
      { row: 1, slot: 1 },
      { row: 1, slot: 1 },
      { row: 1, slot: 0 },
      { row: 1, slot: 2 },
    ]);
    expect(layout.lanes.get(short)).toBe(layout.lanes.get(refreshed));
    expect(JSON.stringify({ markers, short, refreshed })).toBe(before);
  });

  it('reserves a new segment icon before placing same-frame transient icons', () => {
    const attachment = buff('electric', { startFrame: 10 });
    const anomaly = buff('conduct', { startFrame: 10, iconStyleInSquad: 'SpellAbnormal' });
    const markers = [
      { kind: 'burst' as const, frame: 10 },
      { kind: 'attachmentTrigger' as const, frame: 10, element: 'heat' },
      { kind: 'reactionConsumed' as const, frame: 10, level: 2 },
      { kind: 'burst' as const, frame: 11 },
    ];
    const before = JSON.stringify({ attachment, anomaly, markers });
    const result = layoutEnemyStatusRows([attachment, anomaly], markers, attachmentIds);
    expect(result.markerPositions).toEqual([
      { row: 1, slot: 1 },
      { row: 1, slot: 2 },
      { row: 2, slot: 1 },
      { row: 1, slot: 0 },
    ]);
    expect(JSON.stringify({ attachment, anomaly, markers })).toBe(before);
    expect(result.rowCount).toBe(3);
  });

  it('does not reserve an icon for an ended segment or a segment in another anomaly lane', () => {
    const ended = buff('electric', { endFrame: 10 });
    const firstAnomaly = buff('conduct', { iconStyleInSquad: 'SpellAbnormal' });
    const secondAnomaly = buff('burn', { startFrame: 10, iconStyleInSquad: 'SpellAbnormal' });
    const result = layoutEnemyStatusRows(
      [ended, firstAnomaly, secondAnomaly],
      [
        { kind: 'burst', frame: 10 },
        { kind: 'reactionConsumed', frame: 10, level: 1 },
      ],
      attachmentIds,
    );
    expect(result.markerPositions).toEqual([
      { row: 1, slot: 0 },
      { row: 2, slot: 0 },
    ]);
  });

  it('grows for dense overlapping states instead of clipping them into fixed lanes', () => {
    const states = Array.from({ length: 20 }, (_, index) =>
      buff(`ordinary-${index}`, { instanceId: index + 1, startFrame: index }),
    );
    const inputOrder = [...states].reverse();
    const result = layoutEnemyStatusRows(inputOrder, [], attachmentIds);
    expect(result.rowCount).toBe(23);
    expect(new Set(states.map(state => result.lanes.get(state))).size).toBe(20);
    expect(inputOrder).toEqual([...states].reverse());
    expect(states.every(state => state.endFrame === 100)).toBe(true);
  });

  it('keeps a stacked attachment and same-frame input icons above dense anomalies', () => {
    const anomalies = Array.from({ length: 10 }, (_, index) =>
      buff(`anomaly-${index}`, { iconStyleInSquad: 'SpellAbnormal' }),
    );
    const attachment = buff('electric', { layers: 4 });
    const result = layoutEnemyStatusRows(
      [...anomalies, attachment],
      [
        { kind: 'attachmentTrigger', frame: 10, element: 'heat' },
        { kind: 'burst', frame: 10 },
      ],
      attachmentIds,
    );
    expect(result.lanes.get(attachment)).toBe(1);
    expect(result.markerPositions).toEqual([
      { row: 1, slot: 0 },
      { row: 1, slot: 1 },
    ]);
    expect(anomalies.map(state => result.lanes.get(state))).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
    expect(result.rowCount).toBe(12);
  });

  it('places the incoming conversion attachment above the resulting anomaly', () => {
    const resultBuff = buff('result', { iconStyleInSquad: 'SpellAbnormal' });
    const result = layoutEnemyStatusRows(
      [resultBuff],
      [{ kind: 'attachmentTrigger', frame: 0, element: 'electric' }],
      attachmentIds,
    );
    expect(result.markerPositions).toEqual([{ row: 1, slot: 0 }]);
    expect(result.lanes.get(resultBuff)).toBe(2);
  });
  it('keeps attachment chains together irrespective of ordinary buff overlap or input order', () => {
    const first = buff('electric', { endFrame: 30 });
    const second = buff('electric', { startFrame: 30, layers: 2 });
    const ordinary = buff('ordinary');
    const result = layoutEnemyStatusRows([ordinary, second, first], [], attachmentIds);
    expect(result.lanes.get(first)).toBe(1);
    expect(result.lanes.get(second)).toBe(1);
    expect(result.lanes.get(ordinary)).toBe(3);
    expect(result.rowCount).toBe(4);
    expect(first.endFrame).toBe(30);
  });

  it('uses explicit attachment identity ahead of native HUD metadata and retains unknown states', () => {
    const attachment = buff('electric', { showInHeadBarAttached: true });
    const physical = buff('buff_physical_no_guard', { showInHeadBarAttached: true });
    const anomaly = buff('anomaly', { iconStyleInSquad: 'SpellAbnormal' });
    const unknown = buff('unknown', { iconId: 'icon_battle_frozen' });
    const result = layoutEnemyStatusRows(
      [attachment, physical, anomaly, unknown],
      [],
      attachmentIds,
    );
    expect([physical, attachment, anomaly, unknown].map(item => result.lanes.get(item))).toEqual([
      0, 1, 2, 3,
    ]);
  });

  it('packs concurrent anomalies separately, reuses ended lanes, and places ordinary states after them', () => {
    const a = buff('a', { iconStyleInSquad: 'SpellAbnormal' });
    const b = buff('b', { iconStyleInSquad: 'SpellAbnormal', endFrame: 50 });
    const c = buff('c', { iconStyleInSquad: 'SpellAbnormal', startFrame: 50 });
    const ordinary = buff('ordinary');
    const result = layoutEnemyStatusRows([a, b, c, ordinary], [], attachmentIds);
    expect([a, b, c, ordinary].map(item => result.lanes.get(item))).toEqual([2, 3, 3, 4]);
  });

  it('puts bursts in the attachment row with same-time horizontal slots, not below every buff', () => {
    const result = layoutEnemyStatusRows(
      [buff('ordinary')],
      [
        { kind: 'burst', frame: 10 },
        { kind: 'reactionConsumed', frame: 10 },
        { kind: 'burst', frame: 10 },
        { kind: 'burst', frame: 20 },
      ],
      attachmentIds,
    );
    expect(result.markerPositions).toEqual([
      { row: 1, slot: 0 },
      { row: 2, slot: 0 },
      { row: 1, slot: 1 },
      { row: 1, slot: 0 },
    ]);
    expect(result.rowCount).toBe(4);
    expect(layoutEnemyStatusRows([], [], attachmentIds).rowCount).toBe(3);
  });
});
