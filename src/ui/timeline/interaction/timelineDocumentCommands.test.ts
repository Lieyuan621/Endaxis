import { describe, expect, it } from 'vitest';

it('反应伤害覆盖独立保存，取消时不修改技能块或其他命中', () => {
  const original = createEmptyScenario('reaction', '反应');
  const forced = setReactionDamageForcedCritical(original, ['first', 'second'], true);
  expect(forced.tracks).toBe(original.tracks);
  expect(original.battle.reactionCriticalOverrides).toBeUndefined();
  const saved = JSON.parse(JSON.stringify(forced)) as ScenarioDocument;
  const cleared = setReactionDamageForcedCritical(saved, ['first'], false);
  expect(cleared.battle.reactionCriticalOverrides).toEqual({ second: true });
  expect(
    setReactionDamageForcedCritical(cleared, ['second'], false).battle.reactionCriticalOverrides,
  ).toBeUndefined();
});
import { createEmptyScenario } from '../../../core/project/createProject';
import type { ScenarioDocument, SkillCastDocument } from '../../../core/project/schema';
import {
  addControlSwitch,
  addCycleBoundary,
  addDodgeMarker,
  applyInitialUltimateEnergyPreset,
  clearSimulationRangeBoundary,
  createSkillCastGroup,
  insertSkillCastIntoGroup,
  dissolveSkillCastGroups,
  removeSkillCasts,
  setSkillCastForcedCritical,
  setReactionDamageForcedCritical,
  setUnifiedInitialUltimateEnergy,
  updateDodgeMarker,
  setScenarioBuffAttributes,
  setGlobalConfig,
  setSimulationRangeBoundary,
  setControlSwitchTrack,
  setBattleDurationFrames,
  setBattlePrepFrames,
  setTrackGear,
  setTrackOperator,
  setTrackWeapon,
  swapTimelineTracks,
  updateBattleResourceRule,
  updateTrackInitialUltimateEnergy,
} from './timelineDocumentCommands';
import { ScenarioEditorSession } from '../../../application/editor/scenarioEditorSession';

describe('battle axis commands', () => {
  it('changes the visual prep inset without shifting real battle frames', () => {
    const original = scenario();
    const updated = setBattlePrepFrames(original, 60);
    expect(updated.battle.prepFrames).toBe(60);
    expect(updated.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(
      original.tracks[0]!.skillCasts[0]!.placement.startFrame,
    );
    expect(setBattlePrepFrames(updated, 60)).toBe(updated);
    expect(() => setBattlePrepFrames(original, -1)).toThrow('non-negative integer');
  });

  it('shortens the battle axis only as far as its latest stable timeline object', () => {
    const original = scenario();
    original.tracks[0]!.skillCasts[0]!.placement.startFrame = 80;
    original.battle.cycleBoundaries.push({ id: 'cycle:latest', frame: 120 });
    original.battle.externalEventMarkers = [
      {
        id: 'external:latest',
        frame: 150,
        target: { scope: 'operator', trackIndex: 0 },
        event: { kind: 'comboCooldownControl', mode: 'cooldown' },
      },
    ];
    original.battle.simulationRange = { endFrame: 180 };

    expect(setBattleDurationFrames(original, 60).battle.durationFrames).toBe(180);
    expect(setBattleDurationFrames(original, 240).battle.durationFrames).toBe(240);
    expect(() => setBattleDurationFrames(original, 0)).toThrow('positive integer');
  });
});

describe('updateBattleResourceRule', () => {
  it('clamps initial SP to the fixed maximum', () => {
    const original = scenario();
    original.battle.resourceRules.initialSp = 200;

    expect(
      updateBattleResourceRule(original, 'initialSp', 400).battle.resourceRules.initialSp,
    ).toBe(original.battle.resourceRules.maxSp);
  });

  it('rejects invalid values and preserves no-op identity', () => {
    const original = scenario();
    expect(
      updateBattleResourceRule(original, 'initialSp', original.battle.resourceRules.initialSp),
    ).toBe(original);
    expect(() => updateBattleResourceRule(original, 'initialSp', -1)).toThrow(
      'initialSp must be a non-negative finite number',
    );
  });
});

describe('setScenarioBuffAttributes', () => {
  it('stores a cloned semantic list and keeps the source scenario immutable', () => {
    const original = scenario();
    const modifiers = [
      { attribute: 'criticalRate', slot: 'baseAddition' as const, value: 0.2 },
      { attribute: 'ComboSkillCooldownScalar', slot: 'finalMultiplier' as const, value: 1 - 0.5 },
    ];
    const updated = setScenarioBuffAttributes(original, modifiers);

    expect(original.globalConfig.customBuff).toBeUndefined();
    expect(updated.globalConfig.customBuff?.attributeModifiers).toEqual(modifiers);
    expect(updated.globalConfig.customBuff?.attributeModifiers).not.toBe(modifiers);
  });

  it('rejects non-finite Buff attributes', () => {
    expect(() =>
      setScenarioBuffAttributes(scenario(), [
        { attribute: 'criticalRate', slot: 'baseAddition', value: NaN },
      ]),
    ).toThrow(/attributeModifiers/);
  });
});

describe('initial ultimate energy presets', () => {
  it('cycles empty, full and the remembered per-track custom profile', () => {
    const original = scenario();
    original.tracks[0]!.initialState.ultimateEnergy = 40;
    const custom = updateTrackInitialUltimateEnergy(original, 0, 40, 100);
    const empty = applyInitialUltimateEnergyPreset(custom, 'empty', [100, null, null, null]);
    const full = applyInitialUltimateEnergyPreset(empty, 'full', [100, null, null, null]);
    const restored = applyInitialUltimateEnergyPreset(full, 'custom', [100, null, null, null]);

    expect(empty.tracks[0]!.initialState.ultimateEnergy).toBe(0);
    expect(full.tracks[0]!.initialState.ultimateEnergy).toBe(100);
    expect(restored.tracks[0]!.initialState.ultimateEnergy).toBe(40);
    expect(restored.editor.initialUltimateEnergyPreset?.mode).toBe('custom');
  });

  it('right-click unified values are clamped per track and become the custom profile', () => {
    const original = scenario();
    original.tracks[1] = {
      ...original.tracks[0]!,
      id: 'track:1',
      skillCasts: [],
    };
    const updated = setUnifiedInitialUltimateEnergy(original, 80, [100, 60, null, null]);
    expect(updated.tracks[0]!.initialState.ultimateEnergy).toBe(80);
    expect(updated.tracks[1]!.initialState.ultimateEnergy).toBe(60);
    expect(updated.editor.initialUltimateEnergyPreset).toEqual({
      mode: 'custom',
      customByTrackId: { 'track:0': 80, 'track:1': 60 },
    });
  });
});

describe('swapTimelineTracks', () => {
  it('swaps complete track slots and remaps control switches', () => {
    const original = createEmptyScenario('scenario:tracks', '轨道排序样本');
    original.tracks[0] = {
      ...scenario().tracks[0]!,
      id: 'operator:a',
      operator: perlicaBuild,
    };
    original.tracks[1] = {
      ...scenario().tracks[0]!,
      id: 'operator:b',
      operator: perlicaBuild,
    };
    original.battle.controlSwitches = [
      { id: 'switch:a', frame: 0, trackIndex: 0 },
      { id: 'switch:b', frame: 30, trackIndex: 1 },
      { id: 'switch:c', frame: 60, trackIndex: 2 },
    ];

    const swapped = swapTimelineTracks(original, 0, 1);

    expect(swapped.tracks[0]?.id).toBe('operator:b');
    expect(swapped.tracks[1]?.id).toBe('operator:a');
    expect(swapped.battle.controlSwitches.map(value => value.trackIndex)).toEqual([1, 0, 2]);
    expect(original.tracks[0]?.id).toBe('operator:a');
  });
});

describe('updateTrackInitialUltimateEnergy', () => {
  it('updates the persistent track value and clamps it to the resolved maximum', () => {
    const original = scenario();
    const updated = updateTrackInitialUltimateEnergy(original, 0, 120, 80);

    expect(updated.tracks[0]?.initialState.ultimateEnergy).toBe(80);
    expect(original.tracks[0]?.initialState.ultimateEnergy).toBe(0);
    expect(updateTrackInitialUltimateEnergy(updated, 0, 80, 80)).toBe(updated);
  });

  it('rejects empty tracks and invalid numeric boundaries', () => {
    const original = scenario();
    expect(() => updateTrackInitialUltimateEnergy(original, 1, 10, 80)).toThrow('empty');
    expect(() => updateTrackInitialUltimateEnergy(original, 0, Number.NaN, 80)).toThrow(
      'finite non-negative',
    );
  });
});

const perlicaBuild = {
  operatorSlug: 'perlica',
  level: 90,
  promoted: true,
  potential: 0,
  trustLevel: 4,
  skillLevels: { basicAttack: 12 },
  talentStates: {},
};

function cast(locked = false): SkillCastDocument {
  return {
    id: 'cast:1',
    source: { kind: 'operatorSkill', skillGroupKey: 'skill', skillKey: 'skill' },
    placement: { startFrame: 30 },
    ...(locked ? { presentation: { locked: true } } : {}),
  };
}

function scenario(locked = false) {
  const value = createEmptyScenario('scenario:move', '移动样本');
  value.tracks[0] = {
    id: 'track:0',
    operator: null,
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [cast(locked)],
  };
  return value;
}

describe('手动技能组命令', () => {
  const frames = new Map([
    ['cast:1', 10],
    ['cast:2', 20],
    ['cast:3', 30],
    ['cast:4', 50],
  ]);
  const members = new Set(['cast:1', 'cast:2', 'cast:3']);
  function loose() {
    const value = scenario();
    value.tracks[0]!.skillCasts = [...frames].map(([id, startFrame]) => ({
      ...cast(),
      id,
      placement: { startFrame },
    }));
    value.connections = [
      {
        id: 'manual-cast',
        consumption: false,
        from: { kind: 'skillCast', skillCastId: 'cast:1' },
        to: { kind: 'skillCast', skillCastId: 'cast:3' },
      },
    ];
    return value;
  }
  const grouped = () => createSkillCastGroup(loose(), members, frames);

  it('插入独立技能只重接相邻两段，保留组首、成员身份和连线', () => {
    const original = grouped();
    const result = insertSkillCastIntoGroup(original, 'cast:4', 'cast:2');
    expect(result.tracks[0]!.skillCasts.map(cast => cast.placement)).toEqual([
      { startFrame: 10 },
      { afterCastId: 'cast:4' },
      { afterCastId: 'cast:2' },
      { afterCastId: 'cast:1' },
    ]);
    expect(result.connections).toBe(original.connections);
    expect(original.tracks[0]!.skillCasts[1]!.placement).toEqual({ afterCastId: 'cast:1' });
    expect(insertSkillCastIntoGroup(original, 'cast:2', 'cast:3')).toBe(original);
    expect(insertSkillCastIntoGroup(original, 'cast:4', 'cast:1')).toBe(original);
    original.tracks[0]!.skillCasts[2]!.presentation = { locked: true };
    expect(insertSkillCastIntoGroup(original, 'cast:4', 'cast:2')).toBe(original);
  });

  it('按实际顺序成组，仅组首保存帧，身份和技能块连线保持原样', () => {
    const original = loose();
    const value = createSkillCastGroup(original, new Set(['cast:3', 'cast:1', 'cast:2']), frames);
    expect(value.tracks[0]!.skillCasts.map(cast => cast.placement)).toEqual([
      { startFrame: 10 },
      { afterCastId: 'cast:1' },
      { afterCastId: 'cast:2' },
      { startFrame: 50 },
    ]);
    expect(value.connections).toBe(original.connections);
    expect(value.tracks[0]!.skillCasts[1]!.source).toBe(original.tracks[0]!.skillCasts[1]!.source);
    expect(original.tracks[0]!.skillCasts.map(cast => cast.placement.startFrame)).toEqual([
      10, 20, 30, 50,
    ]);
    expect(createSkillCastGroup(value, members, frames)).toBe(value);
  });

  it('拒绝非连续、跨轨、旧组不完整和锁定选区，不产生空历史', () => {
    const original = loose();
    expect(createSkillCastGroup(original, new Set(['cast:1', 'cast:3']), frames)).toBe(original);
    expect(createSkillCastGroup(original, new Set(['cast:1']), frames)).toBe(original);
    const group = grouped();
    expect(createSkillCastGroup(group, new Set(['cast:2', 'cast:3', 'cast:4']), frames)).toBe(
      group,
    );
    original.tracks[0]!.skillCasts[1]!.presentation = { locked: true };
    expect(createSkillCastGroup(original, members, frames)).toBe(original);
    original.tracks[1] = {
      ...original.tracks[0]!,
      id: 'track:1',
      skillCasts: [{ ...cast(), id: 'other' }],
    };
    expect(createSkillCastGroup(original, new Set(['cast:1', 'other']), frames)).toBe(original);
  });

  it('显式拆组保存当时显示位置，选中一项即解散整组且不影响独立项', () => {
    const original = grouped();
    const actual = new Map([...frames, ['cast:2', 27], ['cast:3', 51]]);
    const value = dissolveSkillCastGroups(original, new Set(['cast:2']), actual);
    expect(value.tracks[0]!.skillCasts.map(cast => cast.placement)).toEqual([
      { startFrame: 10 },
      { startFrame: 27 },
      { startFrame: 51 },
      { startFrame: 50 },
    ]);
    expect(value.tracks[0]!.skillCasts[3]).toBe(original.tracks[0]!.skillCasts[3]);
    expect(value.connections).toBe(original.connections);
    expect(dissolveSkillCastGroups(value, members, actual)).toBe(value);
  });

  it('删中间项重连，删组首交出原锚点，只移除指向被删技能块的连线', () => {
    const original = grouped();
    const middle = removeSkillCasts(original, new Set(['cast:2']));
    expect(middle.tracks[0]!.skillCasts.map(cast => cast.placement)).toEqual([
      { startFrame: 10 },
      { afterCastId: 'cast:1' },
      { startFrame: 50 },
    ]);
    expect(middle.connections).toEqual(original.connections);
    const head = removeSkillCasts(original, new Set(['cast:1']));
    expect(head.tracks[0]!.skillCasts.map(cast => cast.placement)).toEqual([
      { startFrame: 10 },
      { afterCastId: 'cast:2' },
      { startFrame: 50 },
    ]);
    expect(head.connections).toEqual([]);
    expect(
      removeSkillCasts(original, new Set(['cast:1', 'cast:2'])).tracks[0]!.skillCasts[0]!.placement,
    ).toEqual({ startFrame: 10 });
  });

  it('成组和拆组分别作为一个命令撤销，重做不重新分配任何身份', () => {
    const original = loose();
    const session = new ScenarioEditorSession(original);
    session.commit('group', current => createSkillCastGroup(current, members, frames));
    const group = session.snapshot.scenario;
    session.commit('dissolve', current => dissolveSkillCastGroups(current, members, frames));
    expect(session.undo()).toBe(true);
    expect(session.snapshot.scenario).toBe(group);
    expect(session.undo()).toBe(true);
    expect(session.snapshot.scenario).toBe(original);
    expect(session.redo()).toBe(true);
    expect(session.snapshot.scenario).toBe(group);
  });
});

describe('skill document editing', () => {
  it('clears stale casts, connections and track equipment when changing operator', () => {
    const original = scenario();
    original.tracks[0] = {
      ...original.tracks[0]!,
      operator: perlicaBuild,
      weapon: {
        weaponSlug: 'old',
        level: 90,
        tuned: true,
        potential: 0,
        traitLevels: [1],
      },
      gears: {
        armor: { gearSlug: 'old', artificingLevels: [0] },
        gloves: null,
        accessory1: null,
        accessory2: null,
      },
    };
    original.connections = [
      {
        id: 'connection:1',
        consumption: false,
        from: { kind: 'skillCast', skillCastId: 'cast:1' },
        to: { kind: 'skillCast', skillCastId: 'cast:2' },
      },
    ];
    const arcaneBuild = { ...perlicaBuild, operatorSlug: 'arcane' };

    const updated = setTrackOperator(original, 0, arcaneBuild, 'track:0');

    expect(updated.tracks[0]!.operator).toEqual(arcaneBuild);
    expect(updated.tracks[0]!.skillCasts).toEqual([]);
    expect(updated.connections).toEqual([]);
    expect(updated.tracks[0]!.weapon).toBeNull();
    expect(updated.tracks[0]!.gears).toEqual({
      armor: null,
      gloves: null,
      accessory1: null,
      accessory2: null,
    });
  });

  it('清空轨道删除其闪避、切人和外部输入，保留其他轨道与全队标记', () => {
    const original = scenario();
    original.tracks[0] = { ...original.tracks[0]!, operator: perlicaBuild };
    original.tracks[1] = { ...original.tracks[0]!, id: 'track:1', skillCasts: [] };
    original.battle.dodgeMarkers = [
      {
        id: 'dodge:sample:1',
        frame: 10,
        trackIndex: 0,
        direction: 'forward',
        mode: { kind: 'dodge' },
      },
      {
        id: 'dodge:other',
        frame: 20,
        trackIndex: 1,
        direction: 'backward',
        mode: { kind: 'perfectDodge', successDelayFrames: 2 },
      },
    ];
    original.battle.controlSwitches = [
      { id: 'switch:0', frame: 5, trackIndex: 0 },
      { id: 'switch:1', frame: 15, trackIndex: 1 },
    ];
    original.battle.externalEventMarkers = [
      {
        id: 'event:0',
        frame: 5,
        target: { scope: 'operator', trackIndex: 0 },
        event: { kind: 'comboCooldownControl', mode: 'ready' },
      },
      {
        id: 'event:1',
        frame: 5,
        target: { scope: 'operator', trackIndex: 1 },
        event: { kind: 'comboCooldownControl', mode: 'ready' },
      },
      {
        id: 'event:team',
        frame: 5,
        target: { scope: 'team' },
        event: { kind: 'comboCooldownControl', mode: 'ready' },
      },
    ];
    const changed = setTrackOperator(
      original,
      0,
      { ...perlicaBuild, operatorSlug: 'arcane' },
      'track:new',
    );
    expect(changed.battle).toBe(original.battle);
    const cleared = setTrackOperator(original, 0, null, 'unused');
    expect(cleared.tracks[0]).toBeNull();
    expect(cleared.battle.dodgeMarkers).toEqual([original.battle.dodgeMarkers[1]]);
    expect(cleared.battle.controlSwitches).toEqual([original.battle.controlSwitches[1]]);
    expect(cleared.battle.externalEventMarkers).toEqual(
      original.battle.externalEventMarkers.slice(1),
    );
    expect(original.battle.dodgeMarkers).toHaveLength(2);
  });

  it('rejects equipping a weapon on an empty track', () => {
    const original = createEmptyScenario('scenario:empty-weapon', '空轨道');
    expect(() =>
      setTrackWeapon(original, 0, {
        weaponSlug: 'first',
        level: 90,
        tuned: true,
        potential: 0,
        traitLevels: [1],
      }),
    ).toThrow('track 0 is empty');
  });

  it('rejects equipping gear on an empty track', () => {
    const original = createEmptyScenario('scenario:empty-gear', '空轨道');
    expect(() =>
      setTrackGear(original, 0, 'armor', {
        gearSlug: 'armor',
        artificingLevels: [0],
      }),
    ).toThrow('track 0 is empty');
  });

  it('stores forced critical hits by stable step key and removes empty simulation inputs', () => {
    const original = scenario();
    const forced = setSkillCastForcedCritical(original, 0, 'cast:1', 'damage:1', true);

    expect(forced.tracks[0]!.skillCasts[0]!.simulationInputs?.criticalOverrides).toEqual({
      'damage:1': true,
    });
    expect(setSkillCastForcedCritical(forced, 0, 'cast:1', 'damage:1', true)).toBe(forced);

    const cleared = setSkillCastForcedCritical(forced, 0, 'cast:1', 'damage:1', false);
    expect(cleared.tracks[0]!.skillCasts[0]!.simulationInputs).toBeUndefined();
  });

  it('removes the cast and every connection that points to it', () => {
    const original = scenario();
    original.connections = [
      {
        id: 'connection:1',
        consumption: false,
        from: { kind: 'skillCast', skillCastId: 'cast:1' },
        to: { kind: 'skillCast', skillCastId: 'cast:2' },
      },
      {
        id: 'connection:2',
        consumption: false,
        from: { kind: 'skillCast', skillCastId: 'cast:2' },
        to: { kind: 'skillCast', skillCastId: 'cast:3' },
      },
    ];

    const removed = removeSkillCasts(original, new Set(['cast:1']));
    expect(removed.tracks[0]!.skillCasts).toEqual([]);
    expect(removed.connections.map(connection => connection.id)).toEqual(['connection:2']);
    expect(original.tracks[0]!.skillCasts).toHaveLength(1);
  });

  it('removes a member from a set of casts and preserves the remaining casts', () => {
    const original = scenario();
    const grouped = [0, 1, 2].map(index => ({
      ...cast(),
      id: `cast:${index + 1}`,
    }));
    original.tracks[0]!.skillCasts = grouped;

    const twoMembers = removeSkillCasts(original, new Set(['cast:2']));
    expect(twoMembers.tracks[0]!.skillCasts.map(value => value.id)).toEqual(['cast:1', 'cast:3']);

    const oneMember = removeSkillCasts(twoMembers, new Set(['cast:1']));
    expect(oneMember.tracks[0]!.skillCasts.map(value => value.id)).toEqual(['cast:3']);
  });

  it('removes selected casts across tracks as one immutable command', () => {
    const original = scenario();
    original.tracks[0]!.skillCasts.push({ ...cast(), id: 'cast:2' });
    original.tracks[1] = {
      id: 'track:1',
      operator: null,
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [{ ...cast(), id: 'cast:3' }],
    };
    original.connections = [
      {
        id: 'connection:1',
        consumption: false,
        from: { kind: 'skillCast', skillCastId: 'cast:1' },
        to: { kind: 'skillCast', skillCastId: 'cast:3' },
      },
    ];

    const removed = removeSkillCasts(original, new Set(['cast:1', 'cast:3']));

    expect(removed.tracks[0]!.skillCasts.map(value => value.id)).toEqual(['cast:2']);
    expect(removed.tracks[1]!.skillCasts).toEqual([]);
    expect(removed.connections).toEqual([]);
    expect(original.tracks[0]!.skillCasts).toHaveLength(2);
  });

  it('ignores stale batch selection identities without creating a document revision', () => {
    const original = scenario();
    expect(removeSkillCasts(original, new Set())).toBe(original);
    expect(removeSkillCasts(original, new Set(['missing']))).toBe(original);
  });
});

describe('timeline marker commands', () => {
  it('sets, clamps and clears the optional simulation range immutably', () => {
    const original = scenario();
    const started = setSimulationRangeBoundary(original, 'start', 90);
    const endedBeforeStart = setSimulationRangeBoundary(started, 'end', 60);
    expect(started.battle.simulationRange).toEqual({ startFrame: 90 });
    expect(endedBeforeStart.battle.simulationRange).toEqual({ startFrame: 60, endFrame: 60 });

    const clearedStart = clearSimulationRangeBoundary(endedBeforeStart, 'start');
    expect(clearedStart.battle.simulationRange).toEqual({ endFrame: 60 });
    expect(
      clearSimulationRangeBoundary(clearedStart, 'end').battle.simulationRange,
    ).toBeUndefined();
    expect(clearSimulationRangeBoundary(original, 'start')).toBe(original);
  });

  it('adds track-bound control switches only to occupied tracks', () => {
    const original = scenario();
    const added = addControlSwitch(original, 'switch:1', 30, 0);
    const occupiedSecondTrack = {
      ...added,
      tracks: [added.tracks[0], { ...added.tracks[0]!, id: 'track:2' }, null, null],
    } as ScenarioDocument;
    expect(
      setControlSwitchTrack(occupiedSecondTrack, 'switch:1', 1).battle.controlSwitches[0]
        ?.trackIndex,
    ).toBe(1);
    expect(setControlSwitchTrack(added, 'missing', 0)).toBe(added);
    expect(() => setControlSwitchTrack(added, 'switch:1', 1)).toThrow('track 1 is empty');
    expect(() => addControlSwitch(original, 'switch:2', 30, 1)).toThrow('track 1 is empty');
  });

  it('places control switches throughout the preparation range', () => {
    const original = scenario();
    original.battle.prepFrames = 150;
    const added = addControlSwitch(original, 'switch:prep', -120, 0);
    expect(added.battle.controlSwitches[0]?.frame).toBe(-120);
  });

  it('adds and configures dodge markers on occupied tracks', () => {
    const original = scenario();
    original.battle.prepFrames = 30;
    const added = addDodgeMarker(original, {
      id: 'dodge:1',
      frame: -10,
      trackIndex: 0,
      direction: 'forward',
      mode: { kind: 'dodge' },
    });
    const configured = updateDodgeMarker(added, 'dodge:1', {
      direction: 'backward',
      mode: { kind: 'perfectDodge', successDelayFrames: 5 },
    });

    expect(configured.battle.dodgeMarkers?.[0]).toEqual({
      id: 'dodge:1',
      frame: -10,
      trackIndex: 0,
      direction: 'backward',
      mode: { kind: 'perfectDodge', successDelayFrames: 5 },
    });
    expect(() =>
      addDodgeMarker(original, {
        id: 'empty',
        frame: 0,
        trackIndex: 1,
        direction: 'forward',
        mode: { kind: 'dodge' },
      }),
    ).toThrow('track 1 is empty');
  });

  it('rejects marker frames outside the editable battle range', () => {
    const original = scenario();
    expect(() => addCycleBoundary(original, 'cycle:1', -1)).toThrow('marker frame');
    expect(() => addCycleBoundary(original, 'cycle:1', original.battle.durationFrames + 1)).toThrow(
      'marker frame',
    );
  });
});

describe('global effect reference commands', () => {
  it('keeps effect references when editing numeric modifiers, without aliasing drafts', () => {
    const original = scenario();
    const config = {
      effects: [
        { effectId: 'combo-cdr-50', enabled: true },
        { effectId: 'project:globalEffect:1', enabled: false },
      ],
    };
    const updated = setGlobalConfig(original, config);
    config.effects[1]!.enabled = true;
    expect(updated.globalConfig.effects![1]!.enabled).toBe(false);
    const edited = setScenarioBuffAttributes(updated, [
      { attribute: 'Atk', slot: 'baseMultiplier' as const, value: 0.1 },
    ]);
    expect(edited.globalConfig.effects).toEqual(updated.globalConfig.effects);
    expect(original.globalConfig.effects).toBeUndefined();
    expect(() =>
      setGlobalConfig(original, {
        ...config,
        effects: [
          { effectId: 'combo-cdr-50', enabled: true },
          { effectId: 'combo-cdr-50', enabled: false },
        ],
      }),
    ).toThrow('duplicate');
  });
});
