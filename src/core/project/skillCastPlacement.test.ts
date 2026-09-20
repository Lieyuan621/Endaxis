/** 检查手动顺序链、临时显示帧与存档引用校验，确保计算结果不会写回作者文档。 */
import { describe, expect, it } from 'vitest';
import { createEmptyProject } from './createProject';
import type { SkillCastDocument, SkillCastPlacementDocument } from './schema';
import {
  getSkillCastPlacementAnchor,
  getSkillCastPlacementChains,
  resolveSkillCastStartFrames,
} from './skillCastPlacement';
import { validateProjectDocument } from './validation';
import { parseProjectDocument, serializeProjectDocument } from './serialization';

function cast(id: string, placement: SkillCastPlacementDocument): SkillCastDocument {
  return { id, source: { kind: 'custom', actionType: 'fixture', name: id }, placement };
}

function project(casts: SkillCastDocument[]) {
  const value = createEmptyProject({ createdWith: 'test' });
  value.scenarios[0]!.tracks[0] = {
    id: 'track:0',
    operator: null,
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: casts,
  };
  return value;
}

describe('手动技能放置链', () => {
  it('按首次出现的链保留声明顺序，链内跟随前驱并保留全部技能对象', () => {
    const a = cast('a', { startFrame: 10 });
    const b = cast('b', { afterCastId: 'a' });
    const c = cast('c', { afterCastId: 'b' });
    const loose = cast('loose', { startFrame: 0 });
    const values = [b, loose, a, c];
    const chains = getSkillCastPlacementChains(values);
    expect(chains).toEqual([
      { anchor: a, casts: [a, b, c] },
      { anchor: loose, casts: [loose] },
    ]);
    expect(chains[0]!.casts[1]).toBe(b);
    expect(getSkillCastPlacementAnchor(values, 'c')).toBe(a);
    expect(() => getSkillCastPlacementAnchor(values, 'missing')).toThrow('missing skill cast');
  });

  it('实际帧优先，缺失帧按宽度顺延，禁用项不占时间，未回写计算帧', () => {
    const values = [
      cast('a', { startFrame: 10 }),
      cast('b', { afterCastId: 'a' }),
      { ...cast('c', { afterCastId: 'b' }), presentation: { disabled: true } },
      cast('d', { afterCastId: 'c' }),
    ];
    const before = structuredClone(values);
    const actual = new Map([
      ['a', 20],
      ['c', 40],
    ]);
    expect(
      resolveSkillCastStartFrames(values, value => (value.id === 'a' ? 0 : 5), actual),
    ).toEqual(
      new Map([
        ['a', 20],
        ['b', 21],
        ['c', 40],
        ['d', 40],
      ]),
    );
    expect(resolveSkillCastStartFrames(values, () => 5)).toEqual(
      new Map([
        ['a', 10],
        ['b', 15],
        ['c', 20],
        ['d', 20],
      ]),
    );
    expect(values).toEqual(before);
  });

  it.each([
    { values: [cast('a', { afterCastId: 'missing' })], message: 'no predecessor' },
    {
      values: [
        cast('a', { startFrame: 0 }),
        cast('b', { afterCastId: 'a' }),
        cast('c', { afterCastId: 'a' }),
      ],
      message: 'more than one successor',
    },
    {
      values: [cast('a', { afterCastId: 'b' }), cast('b', { afterCastId: 'a' })],
      message: 'cycle',
    },
    { values: [cast('a', { afterCastId: 'a' })], message: 'cycle' },
  ])('拒绝不闭合的链：$message', ({ values, message }) => {
    expect(() => getSkillCastPlacementChains(values)).toThrow(message);
  });

  it('保存和加载只包含组首作者帧，不产生组 ID 或后续绝对帧', () => {
    const value = project([cast('a', { startFrame: -30 }), cast('b', { afterCastId: 'a' })]);
    const json = serializeProjectDocument(value);
    expect(parseProjectDocument(json)).toEqual({ ok: true, value });
    expect(value.scenarios[0]!.tracks[0]!.skillCasts[1]!.placement).toEqual({ afterCastId: 'a' });
    expect(json).not.toContain('groupId');
  });

  it.each([
    { values: [cast('a', { afterCastId: 'missing' })], message: 'same track' },
    {
      values: [
        cast('a', { startFrame: 0 }),
        cast('b', { afterCastId: 'a' }),
        cast('c', { afterCastId: 'a' }),
      ],
      message: 'already has a successor',
    },
    {
      values: [cast('a', { afterCastId: 'b' }), cast('b', { afterCastId: 'a' })],
      message: 'cycle',
    },
    { values: [cast('a', { startFrame: 0.5 })], message: 'integer' },
    { values: [cast('a', { startFrame: -151 })], message: 'preparation range' },
  ])('存档边界拒绝非法放置：$message', ({ values, message }) => {
    const result = validateProjectDocument(project(values));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some(issue => issue.message.includes(message))).toBe(true);
  });

  it('拒绝跨轨引用和同时保存两类放置字段', () => {
    const value = project([cast('a', { startFrame: 0 })]);
    value.scenarios[0]!.tracks[1] = {
      ...value.scenarios[0]!.tracks[0]!,
      id: 'track:1',
      skillCasts: [cast('b', { afterCastId: 'a' })],
    };
    const crossTrack = validateProjectDocument(value);
    expect(crossTrack.ok).toBe(false);
    if (!crossTrack.ok)
      expect(crossTrack.issues.some(issue => issue.message.includes('same track'))).toBe(true);
    const malformed = {
      ...cast('c', { afterCastId: 'a' }),
      placement: { startFrame: 12, afterCastId: 'a' },
    };
    const dual = validateProjectDocument({
      ...value,
      scenarios: [
        {
          ...value.scenarios[0]!,
          tracks: [
            {
              ...value.scenarios[0]!.tracks[0]!,
              skillCasts: [cast('a', { startFrame: 0 }), malformed],
            },
            null,
            null,
            null,
          ],
        },
      ],
    });
    expect(dual.ok).toBe(false);
    if (!dual.ok)
      expect(dual.issues.some(issue => issue.message.includes('mutually exclusive'))).toBe(true);
  });
});
