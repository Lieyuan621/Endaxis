import { operatorOwner, dodgeInputs } from '../../../core/project/scenarioMarkers';
import {
  ActiveScenarioEditorSession,
  ProjectEditorSession,
} from '../../../application/editor/projectEditorSession';
import { expect, it } from 'vitest';
import { copyTimelineActions, copyTimelineItems, pasteTimelineActions } from './timelineClipboard';
import { createEmptyProject, createEmptyScenario } from '../../../core/project/createProject';
import { firstScenarioEnemy } from '../../../core/project/level';
import { pruneHitOverrides } from '../../../core/project/hitOverrides';
import { collectTimelineItems, removeTimelineItems } from './timelineItems';
import type { ScenarioDocument, TrackDocument } from '../../../core/project/schema';
function fixture(id = 'source', owner = 'operator', enemyId = 'enemy:source'): ScenarioDocument {
  const scenario = createEmptyScenario(id, id);
  firstScenarioEnemy(scenario).id = enemyId;
  scenario.tracks[0] = {
    id: owner,
    operator: {
      operatorSlug: 'perlica',
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 0,
      skillLevels: {},
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [
      {
        id: 'cast',
        source: { kind: 'operatorSkill', skillGroupKey: 'basicAttack', skillKey: 'attack' },
        placement: { startFrame: 10 },
      },
    ],
  } as TrackDocument;
  return scenario;
}
const ids = () => {
  let n = 0;
  return { allocate: () => `new:${++n}` };
};
const identity = (owner: string, enemy: string, cast = 'cast') =>
  JSON.stringify([
    ['action', owner, cast],
    ['abilityEntity', 'projectile', owner, 2],
    ['buff', 'thunder', enemy, 1],
    ['hit', owner, enemy, 3],
  ]);
it('同方案复制重映射技能，保留敌人和局部次数及明确不暴击，仅复制选中根', () => {
  const source = fixture();
  const key = identity('operator', 'enemy:source');
  source.battle.hitCriticalOverrides = {
    [key]: false,
    [identity('operator', 'enemy:source', 'other')]: true,
  };
  const clipboard = copyTimelineActions(source, new Set(['cast']))!;
  const result = pasteTimelineActions(source, clipboard, 100, ids());
  expect(result.scenario.battle.hitCriticalOverrides).toEqual({
    ...source.battle.hitCriticalOverrides,
    [identity('operator', 'enemy:source', result.skillCastIds[0])]: false,
  });
  expect(source.tracks[0]!.skillCasts).toHaveLength(1);
  expect(result.skippedHitOverrides).toBeUndefined();
});
it('跨方案双方单敌人时重映射归属和受击目标，不要求同种敌人', () => {
  const source = fixture();
  source.battle.hitCriticalOverrides = { [identity('operator', 'enemy:source')]: true };
  const target = fixture('target', 'different-operator-id', 'enemy:target');
  firstScenarioEnemy(target).enemy.source = {
    kind: 'prefab',
    enemyId: 'different-enemy',
    level: 90,
  };
  const result = pasteTimelineActions(
    target,
    copyTimelineActions(source, new Set(['cast']))!,
    100,
    ids(),
  );
  expect(result.scenario.battle.hitCriticalOverrides).toEqual({
    [identity('different-operator-id', 'enemy:target', result.skillCastIds[0])]: true,
  });
});
it('跨方案多敌人时照常粘贴技能，跳过覆盖，即便敌人 ID 恰好相同', () => {
  const source = fixture();
  source.battle.hitCriticalOverrides = { [identity('operator', 'enemy:source')]: true };
  const target = fixture('target');
  const enemy = firstScenarioEnemy(target);
  target.level = {
    kind: 'multiEnemies',
    enemies: [enemy, { ...structuredClone(enemy), id: 'enemy:second' }],
  };
  const result = pasteTimelineActions(
    target,
    copyTimelineActions(source, new Set(['cast']))!,
    100,
    ids(),
  );
  expect(result.skillCastIds).toHaveLength(1);
  expect(result.skippedHitOverrides).toBe(1);
  expect(result.scenario.battle.hitCriticalOverrides).toBeUndefined();
});
it('同方案多敌人剪切先保存覆盖，删除清理后粘贴恢复，重复粘贴使用不同根', () => {
  const source = fixture();
  const enemy = firstScenarioEnemy(source);
  source.level = {
    kind: 'multiEnemies',
    enemies: [enemy, { ...structuredClone(enemy), id: 'enemy:second' }],
  };
  const key = identity('operator', 'enemy:second');
  source.battle.hitCriticalOverrides = { [key]: false };
  const items = [...collectTimelineItems(source).values()].filter(
    item => item.ref.kind === 'skill',
  );
  const clipboard = copyTimelineItems(source, items, new Map([['cast', 10]]))!;
  const removed = pruneHitOverrides(source, removeTimelineItems(source, items));
  expect(removed.battle.hitCriticalOverrides).toBeUndefined();
  const allocator = ids();
  const first = pasteTimelineActions(removed, clipboard, 100, allocator);
  const second = pasteTimelineActions(first.scenario, clipboard, 200, allocator);
  expect(second.scenario.battle.hitCriticalOverrides).toEqual({
    [identity('operator', 'enemy:second', first.skillCastIds[0])]: false,
    [identity('operator', 'enemy:second', second.skillCastIds[0])]: false,
  });
  expect(source.battle.hitCriticalOverrides).toEqual({ [key]: false });
});

it('剪切、粘贴的撤销重做同时恢复技能及覆盖', () => {
  const source = fixture();
  const key = identity('operator', 'enemy:source');
  source.battle.hitCriticalOverrides = { [key]: false };
  const project = createEmptyProject({ createdWith: 'test' });
  project.scenarios = [source];
  project.activeScenarioId = source.id;
  const session = new ActiveScenarioEditorSession(new ProjectEditorSession(project));
  const items = [...collectTimelineItems(source).values()].filter(
    item => item.ref.kind === 'skill',
  );
  const clipboard = copyTimelineItems(source, items, new Map([['cast', 10]]))!;
  session.commit('cut', current => removeTimelineItems(current, items));
  const allocator = ids();
  session.commit(
    'paste',
    current => pasteTimelineActions(current, clipboard, 100, allocator).scenario,
  );
  const pasted = structuredClone(session.snapshot.scenario);
  expect(Object.values(pasted.battle.hitCriticalOverrides!)).toEqual([false]);
  session.undo();
  expect(session.snapshot.scenario.battle.hitCriticalOverrides).toBeUndefined();
  expect(session.snapshot.scenario.tracks[0]!.skillCasts).toHaveLength(0);
  session.undo();
  expect(session.snapshot.scenario).toEqual(source);
  session.redo();
  session.redo();
  expect(session.snapshot.scenario).toEqual(pasted);
  session.dispose();
});
it('同方案目标已删除时仅跳过该目标的记录，不改映射到其他敌人', () => {
  const source = fixture();
  const enemy = firstScenarioEnemy(source);
  source.level = {
    kind: 'multiEnemies',
    enemies: [enemy, { ...structuredClone(enemy), id: 'enemy:deleted' }],
  };
  source.battle.hitCriticalOverrides = {
    [identity('operator', 'enemy:source')]: true,
    [identity('operator', 'enemy:deleted')]: false,
  };
  const clipboard = copyTimelineActions(source, new Set(['cast']))!;
  const target = structuredClone(source);
  target.level = { kind: 'singleEnemy', enemy: firstScenarioEnemy(target) };
  delete target.battle.hitCriticalOverrides;
  const result = pasteTimelineActions(target, clipboard, 100, ids());
  expect(result.skippedHitOverrides).toBe(1);
  expect(result.scenario.battle.hitCriticalOverrides).toEqual({
    [identity('operator', 'enemy:source', result.skillCastIds[0])]: true,
  });
});
it('能力实体作为 Buff 宿主时递归重映射其创建链，不改类型和次数', () => {
  const source = fixture();
  const chain = JSON.parse(identity('operator', 'enemy:source'));
  chain[2][2] = JSON.stringify(chain.slice(0, 2));
  source.battle.hitCriticalOverrides = { [JSON.stringify(chain)]: false };
  const target = fixture('target', 'new-operator', 'enemy:target');
  const result = pasteTimelineActions(
    target,
    copyTimelineActions(source, new Set(['cast']))!,
    100,
    ids(),
  );
  const expected = JSON.parse(identity('new-operator', 'enemy:target', result.skillCastIds[0]));
  expected[2][2] = JSON.stringify(expected.slice(0, 2));
  expect(result.scenario.battle.hitCriticalOverrides).toEqual({
    [JSON.stringify(expected)]: false,
  });
});

it('跨方案按干员匹配实际目标轨，重建两类标记及同轨闪避', () => {
  const source = fixture();
  const key = identity('operator', 'enemy:source');
  source.battle.hitWeaknessBreaks = { [key]: { stagger: 22.5 } };
  source.battle.hitCriticalOverrides = { [key]: false };
  source.markers = [
    ...source.markers.filter(marker => marker.kind !== 'dodge'),
    {
      kind: 'dodge' as const,
      id: 'dodge',
      owner: operatorOwner(source, 0),
      frame: 16,
      direction: 'forward',
      mode: { kind: 'dodge' },
    },
  ];
  const target = fixture('target', 'target-track', 'enemy:target');
  target.tracks[2] = target.tracks[0];
  target.tracks[0] = null;
  const selected = [...collectTimelineItems(source).values()].filter(
    item => item.ref.kind === 'skill' || item.ref.kind === 'dodge',
  );
  const clipboard = copyTimelineItems(source, selected, new Map([['cast', 10]]))!;
  const result = pasteTimelineActions(target, clipboard, 100, ids());
  const newKey = identity('target-track', 'enemy:target', result.skillCastIds[0]);
  expect(result.scenario.tracks[2]!.skillCasts.at(-1)?.id).toBe(result.skillCastIds[0]);
  expect(dodgeInputs(result.scenario)?.at(-1)).toMatchObject({ trackIndex: 2, frame: 106 });
  expect(result.scenario.battle.hitWeaknessBreaks).toEqual({ [newKey]: { stagger: 22.5 } });
  expect(result.scenario.battle.hitCriticalOverrides).toEqual({ [newKey]: false });
  target.tracks[0] = { ...target.tracks[2]!, id: 'also-perlica' };
  const rejected = pasteTimelineActions(target, clipboard, 100, ids());
  expect(rejected.unmatchedTracks).toBe(true);
  expect(rejected.scenario).toBe(target);
});

it('同方案相同轨道 ID 改为其他干员时整次粘贴取消', () => {
  const source = fixture();
  const clipboard = copyTimelineActions(source, new Set(['cast']))!;
  const target = structuredClone(source);
  target.tracks[0]!.operator!.operatorSlug = 'chen-qianyu';
  const result = pasteTimelineActions(target, clipboard, 100, ids());
  expect(result.unmatchedTracks).toBe(true);
  expect(result.scenario).toBe(target);
  expect(result.itemRefs).toHaveLength(0);
});

const hostDependency = (cast: string, hostCast: string, hostOwner = 'operator') =>
  JSON.stringify([
    ['action', 'operator', cast],
    [
      'buff',
      'mark',
      JSON.stringify([
        ['action', hostOwner, hostCast],
        ['abilityEntity', 'host', hostOwner, 0],
      ]),
      0,
    ],
    ['hit', 'operator', 'enemy:source', 0],
  ]);

function externalHostFixture() {
  const scenario = fixture();
  const track = scenario.tracks[0]!;
  track.skillCasts.push({ ...track.skillCasts[0]!, id: 'host-cast' });
  scenario.battle.hitWeaknessBreaks = { [hostDependency('cast', 'host-cast')]: true };
  return scenario;
}

it('仅复制伤害来源时，同方案保留未复制的宿主技能依赖，删除宿主后跳过标记', () => {
  const source = externalHostFixture();
  const clipboard = copyTimelineActions(source, new Set(['cast']))!;
  const result = pasteTimelineActions(source, clipboard, 100, ids());
  expect(
    result.scenario.battle.hitWeaknessBreaks?.[
      hostDependency(result.skillCastIds[0]!, 'host-cast')
    ],
  ).toBe(true);
  const deleted = structuredClone(source);
  deleted.tracks[0]!.skillCasts.pop();
  expect(pasteTimelineActions(deleted, clipboard, 100, ids()).skippedHitOverrides).toBe(1);
});

it('同时复制伤害来源与宿主时，原件仍然存在也分别绑定两个新技能', () => {
  const source = externalHostFixture();
  const result = pasteTimelineActions(
    source,
    copyTimelineActions(source, new Set(['cast', 'host-cast']))!,
    100,
    ids(),
  );
  expect(result.scenario.battle.hitWeaknessBreaks).toEqual({
    ...source.battle.hitWeaknessBreaks,
    [hostDependency(result.skillCastIds[0]!, result.skillCastIds[1]!)]: true,
  });
});

it('跨方案即使目标中有同名技能也跳过未复制的宿主依赖', () => {
  const source = externalHostFixture();
  const target = structuredClone(source);
  target.id = 'target';
  delete target.battle.hitWeaknessBreaks;
  const result = pasteTimelineActions(
    target,
    copyTimelineActions(source, new Set(['cast']))!,
    100,
    ids(),
  );
  expect(result.skillCastIds).toHaveLength(1);
  expect(result.skippedHitOverrides).toBe(1);
  expect(result.scenario.battle.hitWeaknessBreaks).toBeUndefined();
});

it('构筑 action 与技能同名且 owner 不同时不会重绑到新技能', () => {
  const source = fixture();
  source.battle.hitWeaknessBreaks = { [hostDependency('cast', 'cast', 'enemy:source')]: true };
  const clipboard = copyTimelineActions(source, new Set(['cast']))!;
  const same = pasteTimelineActions(source, clipboard, 100, ids());
  expect(
    same.scenario.battle.hitWeaknessBreaks?.[
      hostDependency(same.skillCastIds[0]!, 'cast', 'enemy:source')
    ],
  ).toBe(true);
  const target = fixture('target');
  expect(pasteTimelineActions(target, clipboard, 100, ids()).skippedHitOverrides).toBe(1);
});
