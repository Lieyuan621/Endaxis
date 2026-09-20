import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { SkillCastDocument } from '../../../core/project/schema';
import {
  compactSkillSelectionByWidths,
  resolveCompactSkillSelection,
} from './compactSkillSelection';

function fixture() {
  const scenario = createEmptyScenario('test', 'test');
  const cast = (id: string, startFrame: number): SkillCastDocument => ({
    id,
    source: { kind: 'operatorSkill', skillGroupKey: 'basicAttack', skillKey: 'basicAttack1' },
    placement: { startFrame },
  });
  const track = {
    id: 'track',
    operator: null,
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [cast('late', 100), cast('first', -20), cast('tie', 100)],
  };
  scenario.tracks[0] = track;
  scenario.tracks[1] = { ...track, id: 'other', skillCasts: [cast('other', 0)] };
  return scenario;
}

describe('compact selection', () => {
  it('不把连续组或被部分选中的连续组改成固定排程', () => {
    const scenario = fixture();
    scenario.tracks[0]!.skillCasts[0]!.placement = { afterCastId: 'first' };
    for (const ids of [
      ['first', 'late'],
      ['first', 'tie'],
      ['late', 'tie'],
    ]) {
      expect(resolveCompactSkillSelection(scenario, new Set(ids))).toEqual({
        ok: false,
        reason: 'grouped',
      });
      expect(compactSkillSelectionByWidths(scenario, ids, new Map())).toBe(scenario);
    }
  });
  it('keeps the known prefix and completes the unknown tail without moving the anchor', () => {
    const scenario = fixture();
    const result = compactSkillSelectionByWidths(
      scenario,
      ['first', 'late', 'tie'],
      new Map([
        ['first', 10],
        ['late', 20],
      ]),
      new Map([
        ['first', 999],
        ['late', 15],
      ]),
    );
    expect(result.tracks[0]!.skillCasts.map(c => c.placement.startFrame)).toEqual([15, -20, 35]);
    expect(scenario.tracks[0]!.skillCasts.map(c => c.placement.startFrame)).toEqual([
      100, -20, 100,
    ]);
    expect(result.tracks[1]).toEqual(scenario.tracks[1]);
  });
  it('falls back to block widths without mutating the source or unselected casts', () => {
    const scenario = fixture();
    scenario.tracks[0]!.skillCasts[0]!.presentation = { disabled: true };
    const before = structuredClone(scenario);
    const result = compactSkillSelectionByWidths(
      scenario,
      ['first', 'late'],
      new Map([
        ['first', 45],
        ['late', 20],
      ]),
    );
    expect(scenario).toEqual(before);
    expect(result.tracks[0]!.skillCasts.map(c => c.placement.startFrame)).toEqual([25, -20, 100]);
    expect(result.tracks[0]!.skillCasts[0]!.presentation).toEqual({ disabled: true });
    expect(result.tracks[1]).toEqual(before.tracks[1]);
  });
  it('uses chronological order and document order for ties, never selection order', () => {
    const scenario = fixture();
    const before = structuredClone(scenario);
    expect(resolveCompactSkillSelection(scenario, new Set(['tie', 'late', 'first']))).toEqual({
      ok: true,
      castIds: ['first', 'late', 'tie'],
    });
    expect(scenario).toEqual(before);
  });
  it.each([{ ids: [] }, { ids: ['first'] }])('requires multiple casts: $ids', ({ ids }) => {
    expect(resolveCompactSkillSelection(fixture(), new Set(ids))).toEqual({
      ok: false,
      reason: 'count',
    });
  });
  it.each([
    ['first', 'other'],
    ['first', 'late', 'marker'],
  ])('rejects mixed tracks or markers: %j', (...ids) => {
    expect(resolveCompactSkillSelection(fixture(), new Set(ids))).toEqual({
      ok: false,
      reason: 'mixed',
    });
  });
  it.each(['locked', 'disabled'] as const)(
    'allows explicit compaction while preserving %s',
    field => {
      const scenario = fixture();
      scenario.tracks[0]!.skillCasts[0]!.presentation = { [field]: true };
      expect(resolveCompactSkillSelection(scenario, new Set(['first', 'late']))).toEqual({
        ok: true,
        castIds: ['first', 'late'],
      });
    },
  );
});
