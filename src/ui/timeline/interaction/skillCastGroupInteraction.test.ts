import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { SkillCastDocument } from '../../../core/project/schema';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import {
  expandSkillCastGroupSelection,
  matchingPublishedSkillCastIds,
  projectCompatibleHitFrames,
  projectMovingSkillCastStartFrames,
  projectSkillCastInputFacts,
  resolveSkillCastGroupSelection,
} from './skillCastGroupInteraction';
import { createSkillCastGroup } from './timelineDocumentCommands';

function cast(id: string, placement: SkillCastDocument['placement']): SkillCastDocument {
  return {
    id,
    placement,
    source: { kind: 'operatorSkill', skillGroupKey: 'attack', skillKey: 'a1' },
  };
}

function fixture(casts: SkillCastDocument[]) {
  const scenario = createEmptyScenario('groups', 'groups');
  scenario.tracks[0] = {
    id: 'track',
    operator: null,
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: casts,
  };
  return scenario;
}

describe('连续组选择与移动', () => {
  const starts = new Map([
    ['a', 10],
    ['b', 40],
    ['c', 90],
  ]);

  it('允许原有空隙，但不能跨过未选择的技能', () => {
    const scenario = fixture([
      cast('c', { startFrame: 90 }),
      cast('a', { startFrame: 10 }),
      cast('b', { startFrame: 40 }),
    ]);
    expect(resolveSkillCastGroupSelection(scenario, new Set(['b', 'a']), starts)).toEqual({
      ok: true,
      castIds: new Set(['a', 'b']),
      alreadyGrouped: false,
    });
    expect(resolveSkillCastGroupSelection(scenario, new Set(['a', 'c']), starts)).toEqual({
      ok: false,
      reason: 'nonAdjacent',
    });
  });

  it('拒绝单项、混合轨道、未知身份和锁定成员', () => {
    const scenario = fixture([cast('a', { startFrame: 10 }), cast('b', { startFrame: 40 })]);
    expect(resolveSkillCastGroupSelection(scenario, new Set(['a']), starts)).toEqual({
      ok: false,
      reason: 'count',
    });
    expect(resolveSkillCastGroupSelection(scenario, new Set(['a', 'missing']), starts)).toEqual({
      ok: false,
      reason: 'mixed',
    });
    scenario.tracks[1] = {
      ...scenario.tracks[0]!,
      id: 'other',
      skillCasts: [cast('c', { startFrame: 90 })],
    };
    expect(resolveSkillCastGroupSelection(scenario, new Set(['a', 'c']), starts)).toEqual({
      ok: false,
      reason: 'mixed',
    });
    scenario.tracks[0]!.skillCasts[1]!.presentation = { locked: true };
    expect(resolveSkillCastGroupSelection(scenario, new Set(['a', 'b']), starts)).toEqual({
      ok: false,
      reason: 'locked',
    });
  });

  it('只允许完整旧组参与合并，并和命令保持禁用同帧成员的顺序', () => {
    const scenario = fixture([
      cast('c', { startFrame: 90 }),
      cast('b', { afterCastId: 'a' }),
      cast('a', { startFrame: 10 }),
    ]);
    scenario.tracks[0]!.skillCasts[2]!.presentation = { disabled: true };
    const sameFrame = new Map([
      ['a', 10],
      ['b', 10],
      ['c', 90],
    ]);
    expect(resolveSkillCastGroupSelection(scenario, new Set(['b', 'c']), sameFrame)).toEqual({
      ok: false,
      reason: 'partialGroup',
    });
    expect(resolveSkillCastGroupSelection(scenario, new Set(['a', 'b']), sameFrame)).toEqual({
      ok: true,
      castIds: new Set(['a', 'b']),
      alreadyGrouped: true,
    });
    const selection = resolveSkillCastGroupSelection(scenario, new Set(['c', 'b', 'a']), sameFrame);
    expect(selection.ok).toBe(true);
    if (!selection.ok) throw new Error('expected valid selection');
    const result = createSkillCastGroup(scenario, selection.castIds, sameFrame);
    expect(result.tracks[0]!.skillCasts.map(value => [value.id, value.placement])).toEqual([
      ['c', { afterCastId: 'b' }],
      ['b', { afterCastId: 'a' }],
      ['a', { startFrame: 10 }],
    ]);
  });

  it('拖动扩展整条链，不改变原来的成员选择集合', () => {
    const scenario = fixture([
      cast('a', { startFrame: 10 }),
      cast('b', { afterCastId: 'a' }),
      cast('c', { startFrame: 90 }),
    ]);
    const selected = new Set(['b']);
    expect(expandSkillCastGroupSelection(scenario, selected)).toEqual(new Set(['a', 'b']));
    expect(selected).toEqual(new Set(['b']));
  });

  it('等待模拟时整组同移，新回执到达后立即采用改变的间距', () => {
    const base = new Map([
      ['a', 10],
      ['b', 40],
      ['other', 70],
    ]);
    const move = {
      anchorId: 'a',
      castIds: ['a', 'b'],
      baseStartFrames: base,
      previewActualFrame: 20,
    };
    expect(projectMovingSkillCastStartFrames(base, move)).toEqual(
      new Map([
        ['a', 20],
        ['b', 50],
        ['other', 70],
      ]),
    );
    // 新模拟中时间膨胀让后项延至75帧，不能继续使用旧的30帧间距。
    const fresh = new Map([
      ['a', 20],
      ['b', 75],
      ['other', 70],
    ]);
    expect(projectMovingSkillCastStartFrames(fresh, move)).toEqual(fresh);
    expect(projectMovingSkillCastStartFrames(fresh, { ...move, previewActualFrame: 22 })).toEqual(
      new Map([
        ['a', 22],
        ['b', 77],
        ['other', 70],
      ]),
    );
    expect(base.get('b')).toBe(40);
  });
});

describe('连续组执行事实', () => {
  it('旧固定排列的回执不能作为新连续组事实，移动同一组仍可使用上次完整结果', () => {
    const fixed = fixture([
      cast('a', { startFrame: 10 }),
      cast('b', { startFrame: 40 }),
      cast('c', { startFrame: 90 }),
    ]);
    const grouped = structuredClone(fixed);
    grouped.tracks[0]!.skillCasts[1]!.placement = { afterCastId: 'a' };
    expect(matchingPublishedSkillCastIds(grouped, fixed)).toEqual(new Set(['c']));
    expect(matchingPublishedSkillCastIds(fixed, grouped)).toEqual(new Set(['c']));
    const moved = structuredClone(grouped);
    moved.tracks[0]!.skillCasts[0]!.placement = { startFrame: 20 };
    expect(matchingPublishedSkillCastIds(moved, grouped)).toEqual(new Set(['a', 'b', 'c']));
    expect(matchingPublishedSkillCastIds(grouped, undefined).size).toBe(0);
  });

  it('成员顺序改变也失效，不靠组首ID或成员数量认作同组', () => {
    const before = fixture([
      cast('a', { startFrame: 10 }),
      cast('b', { afterCastId: 'a' }),
      cast('c', { afterCastId: 'b' }),
    ]);
    const after = fixture([
      cast('a', { startFrame: 10 }),
      cast('b', { afterCastId: 'c' }),
      cast('c', { afterCastId: 'a' }),
    ]);
    expect(matchingPublishedSkillCastIds(after, before).size).toBe(0);
  });

  it('被拒绝但已处理的输入有尝试帧，不把SkillStarted或阻断后缀当作输入发生', () => {
    const entries: CombatReceiptEntry[] = [
      {
        sequence: 0,
        frame: 10,
        time: 0,
        event: 'SkillInputProcessed',
        data: { castId: 'a', status: 'rejected' },
      },
      { sequence: 1, frame: 11, time: 0, event: 'SkillStarted', data: { castId: 'other' } },
      { sequence: 2, frame: 12, time: 0, event: 'SkillInputGroupBlocked', data: { castId: 'b' } },
    ];
    expect(projectSkillCastInputFacts(entries)).toEqual({
      frames: new Map([['a', 10]]),
      switchedToBuff: new Set(),
    });
  });

  it('即时Buff旁路用输入回执和完成事实确认，不依赖SkillStarted', () => {
    const entries: CombatReceiptEntry[] = [
      { sequence: 0, frame: 10, time: 0, event: 'SkillSwitchedToBuff', data: { castId: 'a' } },
      { sequence: 1, frame: 10, time: 0, event: 'SkillInputProcessed', data: { castId: 'a' } },
    ];
    expect(projectSkillCastInputFacts(entries)).toEqual({
      frames: new Map([['a', 10]]),
      switchedToBuff: new Set(['a']),
    });
  });

  it('建组后不把旧B@100的命中110帧投影到预计B@30，并保留未改组的事实', () => {
    const previous = fixture([
      cast('a', { startFrame: 0 }),
      cast('b', { startFrame: 100 }),
      cast('c', { startFrame: 200 }),
    ]);
    const current = structuredClone(previous);
    current.tracks[0]!.skillCasts[1]!.placement = { afterCastId: 'a' };
    const hits = [
      { castId: 'b', hitId: 'hit-b', frame: 110 },
      { castId: 'c', hitId: 'hit-c', frame: 205 },
    ];
    expect(
      projectCompatibleHitFrames(hits, matchingPublishedSkillCastIds(current, previous)),
    ).toEqual(new Map([['hit-c', 205]]));
    const freshHits = [{ castId: 'b', hitId: 'hit-b', frame: 40 }, hits[1]!];
    expect(
      projectCompatibleHitFrames(freshHits, matchingPublishedSkillCastIds(current, current)),
    ).toEqual(
      new Map([
        ['hit-b', 40],
        ['hit-c', 205],
      ]),
    );
  });
});
