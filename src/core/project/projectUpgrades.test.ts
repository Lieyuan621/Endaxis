import { operatorOwner } from './scenarioMarkers';
import { describe, expect, it } from 'vitest';
import { createEmptyProject } from './createProject';
import { firstScenarioEnemy } from './level';
import {
  inspectProjectInput,
  parseProjectDocument,
  serializeProjectDocument,
} from './serialization';

function versionOneProject() {
  const project = createEmptyProject({
    createdWith: 'test',
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  return {
    ...project,
    schemaVersion: 1,
    scenarios: project.scenarios.map(
      ({ level: _level, markers: _markers, ...scenario }, index) => ({
        ...scenario,
        battle: { ...scenario.battle, cycleBoundaries: [], controlSwitches: [] },
        enemy: firstScenarioEnemy(project.scenarios[index]!).enemy,
      }),
    ),
  };
}

describe('项目存档顺序升级', () => {
  it('版本 2 的预览合约替换为正式词条，丢弃参数并保留选择身份和启用状态', () => {
    const project = createEmptyProject({
      createdWith: 'test',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const ids = [200001, 200002, 200003, 200004];
    const input = {
      ...project,
      schemaVersion: 2,
      scenarios: project.scenarios.map(({ markers: _markers, ...scenario }) => ({
        ...scenario,
        battle: { ...scenario.battle, cycleBoundaries: [], controlSwitches: [] },
        mechanics: {
          selections: ids.map((id, index) => ({
            id: `selection-${index}`,
            mechanicId: `contingency-contract:tag:${id}`,
            enabled: index !== 2,
            parameters: { oldCustomValue: 123 },
          })),
        },
      })),
    };
    const before = structuredClone(input);
    const result = parseProjectDocument(input);
    if (!result.ok) throw new Error(JSON.stringify(result));
    expect(result.value.schemaVersion).toBe(4);
    expect(result.value.scenarios[0]!.mechanics.selections).toEqual(
      [113502, 110302, 110703, 110901].map((id, index) => ({
        id: `selection-${index}`,
        mechanicId: `contingency-contract:tag:${id}`,
        enabled: index !== 2,
        parameters: {},
      })),
    );
    expect(input).toEqual(before);
  });
  it.each(['text', 'object'])('版本 1 的 %s 输入自动升级，保存版本 4，输入不被改写', inputKind => {
    const input = versionOneProject();
    input.scenarios[0]!.enemy.editable.hp = 12345;
    const before = structuredClone(input);
    expect(inspectProjectInput(input)).toEqual({ kind: 'upgradeable', schemaVersion: 1 });
    const result = parseProjectDocument(inputKind === 'text' ? JSON.stringify(input) : input);
    if (!result.ok) throw new Error(JSON.stringify(result));
    expect(result.value.schemaVersion).toBe(4);
    expect(result.value.scenarios[0]!.level).toEqual({
      kind: 'singleEnemy',
      enemy: { id: 'enemy', enemy: input.scenarios[0]!.enemy },
    });
    expect(result.value.scenarios[0]).not.toHaveProperty('enemy');
    expect(result.value.createdAt).toBe(input.createdAt);
    expect(input).toEqual(before);
    expect(parseProjectDocument(serializeProjectDocument(result.value))).toEqual(result);
  });

  it('v3 的六类标记升级为可直接编辑的方案标记', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    const { markers: _markers, ...scenario } = project.scenarios[0]!;
    const enemyId = firstScenarioEnemy(project.scenarios[0]!).id;
    const track = {
      id: 't',
      operator: null,
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      skillCasts: [],
      initialState: { ultimateEnergy: 0 },
      consumableUses: [{ id: 'item', frame: -1, consumableId: 'food' }],
    };
    const source = {
      ...project,
      schemaVersion: 3,
      scenarios: [
        {
          ...scenario,
          tracks: [null, track, null, null],
          battle: {
            ...scenario.battle,
            cycleBoundaries: [{ id: 'cycle', frame: 4 }],
            controlSwitches: [{ id: 'switch', frame: 0, trackIndex: 0 }],
            dodgeMarkers: [
              {
                id: 'dodge',
                frame: 2,
                trackIndex: 1,
                direction: 'forward',
                mode: { kind: 'perfectDodge', successDelayFrames: 3 },
              },
            ],
            externalEventMarkers: [
              {
                id: 'pickup',
                frame: 2,
                target: { scope: 'operator', trackIndex: 1 },
                event: { kind: 'pickup', group: 'food' },
              },
            ],
            enemyTargetSwitches: [{ id: 'target', frame: 3, targetId: enemyId }],
          },
        },
      ],
    };
    const loaded = parseProjectDocument(source);
    if (!loaded.ok) throw new Error(JSON.stringify(loaded));
    const upgraded = loaded.value.scenarios[0]!;
    expect(upgraded.markers).toEqual([
      { kind: 'cycleBoundary', id: 'cycle', frame: 4 },
      {
        kind: 'controlSwitch',
        id: 'switch',
        frame: 0,
        owner: { scope: 'emptySlot', trackIndex: 0 },
      },
      {
        kind: 'dodge',
        id: 'dodge',
        frame: 2,
        owner: { scope: 'operator', trackId: 't' },
        direction: 'forward',
        mode: { kind: 'perfectDodge', successDelayFrames: 3 },
      },
      {
        kind: 'pickup' as const,
        id: 'pickup',
        frame: 2,
        owner: { scope: 'operator', trackId: 't' },
        group: 'food',
      },
      {
        kind: 'consumableUse',
        id: 'item',
        frame: -1,
        owner: { scope: 'operator', trackId: 't' },
        consumableId: 'food',
      },
      { kind: 'enemyTargetSwitch', id: 'target', frame: 3, enemyId },
    ]);
    upgraded.markers[0]!.frame = 6;
    expect(JSON.parse(serializeProjectDocument(loaded.value)).scenarios[0]).toEqual(upgraded);
    expect(source.scenarios[0]!.battle.cycleBoundaries[0]!.frame).toBe(4);
  });

  it('正式存档只写一份方案标记，并拒绝无效归属或重复数据源', () => {
    const project = createEmptyProject({
      createdWith: 'test',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    project.scenarios[0]!.markers.push({
      kind: 'controlSwitch' as const,
      id: 'switch',
      frame: 30,
      owner: operatorOwner(project.scenarios[0]!, 0),
    });
    const wire = JSON.parse(serializeProjectDocument(project));
    expect(wire.scenarios[0].markers).toEqual([
      {
        id: 'switch',
        frame: 30,
        kind: 'controlSwitch',
        owner: { scope: 'emptySlot', trackIndex: 0 },
      },
    ]);
    expect(wire.scenarios[0].battle).not.toHaveProperty('controlSwitches');
    const missing = structuredClone(wire);
    delete missing.scenarios[0].markers;
    for (const input of [missing, JSON.stringify(missing)]) {
      expect(parseProjectDocument(input)).toMatchObject({ ok: false, kind: 'invalid-document' });
    }
    const invalid = structuredClone(wire);
    invalid.scenarios[0].markers[0].owner = { scope: 'operator', trackId: 'missing' };
    expect(parseProjectDocument(invalid)).toMatchObject({ ok: false, kind: 'invalid-document' });
    wire.scenarios[0].battle.controlSwitches = [];
    expect(parseProjectDocument(wire)).toMatchObject({ ok: true });
  });

  it.each([0, -1, 1.5, 5])('没有升级路径的版本 %s 明确拒绝', schemaVersion => {
    expect(parseProjectDocument({ ...versionOneProject(), schemaVersion })).toEqual({
      ok: false,
      kind: 'unsupported-version',
      schemaVersion,
    });
  });

  it('损坏的版本 1 不使用默认敌人掩盖错误', () => {
    const input = versionOneProject();
    const result = parseProjectDocument({ ...input, scenarios: [{ id: 'broken' }] });
    expect(result).toMatchObject({ ok: false, kind: 'invalid-document' });
    expect(input.schemaVersion).toBe(1);
  });

  it('当前版本仍须符合关卡结构，不按旧字段兜底', () => {
    const input = versionOneProject();
    expect(parseProjectDocument({ ...input, schemaVersion: 3 })).toMatchObject({
      ok: false,
      kind: 'invalid-document',
    });
  });
});
