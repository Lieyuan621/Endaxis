import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { ScenarioDocument, SkillCastDocument } from '../../../core/project/schema';
import type { SkillDefinition } from '../../../core/game-data/operatorDefinition';
import {
  addControlSwitch,
  addCycleBoundary,
  addExternalEventMarker,
  addDodgeMarker,
  applyInitialUltimateEnergyPreset,
  moveControlSwitch,
  moveCycleBoundary,
  moveExternalEventMarker,
  moveDodgeMarker,
  removeControlSwitch,
  removeCycleBoundary,
  removeExternalEventMarker,
  removeDodgeMarker,
  clearSimulationRangeBoundary,
  createSkillDefinitionDraft,
  createSkillCastGroup,
  dissolveSkillCastGroups,
  moveSkillCast,
  moveSkillCasts,
  removeSkillCast,
  removeSkillCasts,
  resetSkillCastToTemplate,
  setSkillCastColor,
  setSkillCastDisabled,
  setSkillCastForcedCritical,
  setSkillCastLocked,
  setSkillCastRandomSeed,
  setSkillCastCustomDefinition,
  setUnifiedInitialUltimateEnergy,
  updateDodgeMarker,
  setGlobalOperatorStatModifiers,
  setGlobalConfig,
  setSimulationRangeBoundary,
  setControlSwitchTrack,
  setBattleDurationFrames,
  setBattlePrepFrames,
  setTimelinePrepExpanded,
  setTrackGear,
  setTrackOperator,
  setTrackWeapon,
  swapTimelineTracks,
  updateBattleResourceRule,
  updateExternalEventMarker,
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

  it('persists prep folding only in editor presentation state', () => {
    const original = scenario();
    const updated = setTimelinePrepExpanded(original, false);
    expect(updated.editor.prepExpanded).toBe(false);
    expect(updated.battle).toBe(original.battle);
    expect(updated.tracks).toBe(original.tracks);
    expect(setTimelinePrepExpanded(updated, false)).toBe(updated);
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
  it('updates shared SP rules without mutating the scenario', () => {
    const original = scenario();
    const updated = updateBattleResourceRule(original, 'spRecoveryPerSecond', 18.5);

    expect(updated).not.toBe(original);
    expect(updated.battle.resourceRules.spRecoveryPerSecond).toBe(18.5);
    expect(original.battle.resourceRules.spRecoveryPerSecond).not.toBe(18.5);
  });

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

describe('setGlobalOperatorStatModifiers', () => {
  it('stores a cloned semantic list and keeps the source scenario immutable', () => {
    const original = scenario();
    const modifiers = [
      {
        id: 'global:modifier:1',
        kind: 'operatorStat' as const,
        modifier: 'criticalRate' as const,
        value: 0.2,
      },
      {
        id: 'global:modifier:2',
        kind: 'operatorStat' as const,
        modifier: 'skillCooldownReduction' as const,
        value: 0.5,
        skillType: 'comboSkill' as const,
      },
    ];
    const updated = setGlobalOperatorStatModifiers(original, modifiers);

    expect(original.globalConfig.modifiers).toEqual([]);
    expect(updated.globalConfig.modifiers).toEqual(modifiers);
    expect(updated.globalConfig.modifiers).not.toBe(modifiers);
    expect(setGlobalOperatorStatModifiers(updated, modifiers)).toBe(updated);
  });

  it('rejects duplicate ids, unsupported scopes, and invalid cooldown ratios', () => {
    const original = scenario();
    expect(() =>
      setGlobalOperatorStatModifiers(original, [
        { id: 'same', kind: 'operatorStat', modifier: 'criticalRate', value: 0.1 },
        { id: 'same', kind: 'operatorStat', modifier: 'criticalDamage', value: 0.1 },
      ]),
    ).toThrow('unique');
    expect(() =>
      setGlobalOperatorStatModifiers(original, [
        {
          id: 'scoped',
          kind: 'operatorStat',
          modifier: 'criticalRate',
          value: 0.1,
          skillType: 'comboSkill',
        },
      ]),
    ).toThrow('does not support');
    expect(() =>
      setGlobalOperatorStatModifiers(original, [
        {
          id: 'cooldown',
          kind: 'operatorStat',
          modifier: 'skillCooldownReduction',
          value: 1,
          skillType: 'comboSkill',
        },
      ]),
    ).toThrow('less than 1');
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

  it('拖动一个成员或多选同组成员只平移一次组首，其他成员保持相对关系', () => {
    const original = grouped();
    const actual = new Map([...frames, ['cast:2', 22], ['cast:3', 40]]);
    for (const moved of [
      moveSkillCast(original, 0, 'cast:2', 32, actual),
      moveSkillCasts(original, new Set(['cast:1', 'cast:2']), 0, 'cast:2', 32, actual),
    ]) {
      expect(moved.tracks[0]!.skillCasts[0]!.placement).toEqual({ startFrame: 20 });
      expect(moved.tracks[0]!.skillCasts[1]).toBe(original.tracks[0]!.skillCasts[1]);
      expect(moved.tracks[0]!.skillCasts[2]).toBe(original.tracks[0]!.skillCasts[2]);
      expect(moved.tracks[0]!.skillCasts[3]).toBe(original.tracks[0]!.skillCasts[3]);
    }
    original.battle.durationFrames = 60;
    const limited = moveSkillCasts(
      original,
      new Set(['cast:2', 'cast:4']),
      0,
      'cast:2',
      100,
      actual,
    );
    expect(limited.tracks[0]!.skillCasts[0]!.placement).toEqual({ startFrame: 20 });
    expect(limited.tracks[0]!.skillCasts[3]!.placement).toEqual({ startFrame: 60 });
    expect(() => moveSkillCast(original, 0, 'cast:2', 32)).toThrow('resolved integer start frame');
  });

  it('未选中的组员锁定也会阻止整组移动', () => {
    const original = grouped();
    original.tracks[0]!.skillCasts[2]!.presentation = { locked: true };
    expect(moveSkillCast(original, 0, 'cast:2', 40, frames)).toBe(original);
    expect(moveSkillCasts(original, new Set(['cast:2', 'cast:4']), 0, 'cast:2', 40, frames)).toBe(
      original,
    );
  });

  it('组尾超出模拟终点时仍只限制组首，拖动不会反向跳跃或卡死', () => {
    const original = grouped();
    original.battle.durationFrames = 60;
    const pendingTail = new Map([...frames, ['cast:2', 100], ['cast:3', 200]]);
    const moved = moveSkillCast(original, 0, 'cast:1', 20, pendingTail);
    expect(moved.tracks[0]!.skillCasts[0]!.placement).toEqual({ startFrame: 20 });
    expect(moved.tracks[0]!.skillCasts[2]).toBe(original.tracks[0]!.skillCasts[2]);
    expect(moveSkillCast(original, 0, 'cast:1', 10, pendingTail)).toBe(original);
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
    const middle = removeSkillCast(original, 0, 'cast:2');
    expect(middle.tracks[0]!.skillCasts.map(cast => cast.placement)).toEqual([
      { startFrame: 10 },
      { afterCastId: 'cast:1' },
      { startFrame: 50 },
    ]);
    expect(middle.connections).toEqual(original.connections);
    const head = removeSkillCast(original, 0, 'cast:1');
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

describe('moveSkillCast', () => {
  it('assigns an operator to an empty track', () => {
    const original = createEmptyScenario('scenario:operator', '干员样本');
    const updated = setTrackOperator(original, 2, perlicaBuild, 'track:2');

    expect(updated.tracks[2]).toMatchObject({
      operator: perlicaBuild,
      weapon: null,
      skillCasts: [],
    });
    expect(original.tracks[2]).toBeNull();
  });

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

  it('leaves the document unchanged when selecting the current operator again', () => {
    const original = scenario();
    original.tracks[0] = { ...original.tracks[0]!, operator: perlicaBuild };

    expect(setTrackOperator(original, 0, { ...perlicaBuild }, 'track:0')).toBe(original);
  });

  it('assigns, replaces and removes a weapon on a track', () => {
    const original = scenario();
    original.tracks[0] = { ...original.tracks[0]!, operator: perlicaBuild };
    const first = {
      weaponSlug: 'first',
      level: 90,
      tuned: true,
      potential: 0,
      traitLevels: [1, 1, 1],
    };
    const second = { ...first, weaponSlug: 'second' };

    const equipped = setTrackWeapon(original, 0, first);
    const replaced = setTrackWeapon(equipped, 0, second);
    const cleared = setTrackWeapon(replaced, 0, null);

    expect(equipped.tracks[0]!.weapon).toEqual(first);
    expect(replaced.tracks[0]!.weapon).toEqual(second);
    expect(cleared.tracks[0]!.weapon).toBeNull();
    expect(original.tracks[0]!.weapon).toBeNull();
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

  it('assigns independent gear slots and clears them separately', () => {
    const original = scenario();
    const armor = { gearSlug: 'armor', artificingLevels: [0, 0, 0] };
    const accessory = {
      gearSlug: 'accessory',
      artificingLevels: [0, 0],
    };

    const armored = setTrackGear(original, 0, 'armor', armor);
    const equipped = setTrackGear(armored, 0, 'accessory1', accessory);
    const cleared = setTrackGear(equipped, 0, 'armor', null);

    expect(equipped.tracks[0]!.gears).toEqual({
      armor: armor,
      gloves: null,
      accessory1: accessory,
      accessory2: null,
    });
    expect(cleared.tracks[0]!.gears.armor).toBeNull();
    expect(cleared.tracks[0]!.gears.accessory1).toEqual(accessory);
    expect(original.tracks[0]!.gears).toEqual({
      armor: null,
      gloves: null,
      accessory1: null,
      accessory2: null,
    });
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

  it('moves only the requested cast without mutating the source scenario', () => {
    const original = scenario();
    const moved = moveSkillCast(original, 0, 'cast:1', 75);

    expect(original.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(30);
    expect(moved.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(75);
    expect(moved.tracks[1]).toBe(original.tracks[1]);
  });

  it('does not move a locked cast', () => {
    const original = scenario(true);
    expect(moveSkillCast(original, 0, 'cast:1', 75)).toBe(original);
  });

  it('rejects invalid frames and missing cast identities', () => {
    expect(() => moveSkillCast(scenario(), 0, 'cast:1', 1.5)).toThrow('visible timeline');
    expect(() => moveSkillCast(scenario(), 0, 'missing', 30)).toThrow("no skill cast 'missing'");
  });

  it('updates lock and disabled states without mutating the source', () => {
    const original = scenario();
    const locked = setSkillCastLocked(original, 0, 'cast:1', true);
    const disabled = setSkillCastDisabled(locked, 0, 'cast:1', true);

    expect(original.tracks[0]!.skillCasts[0]!.presentation).toBeUndefined();
    expect(disabled.tracks[0]!.skillCasts[0]!.presentation).toMatchObject({
      locked: true,
      disabled: true,
    });
  });

  it('sets and clears an action color as a presentation field', () => {
    const original = scenario();
    const colored = setSkillCastColor(original, 0, 'cast:1', '#ff4d4f');
    const reset = setSkillCastColor(colored, 0, 'cast:1', null);

    expect(colored.tracks[0]!.skillCasts[0]!.presentation?.color).toBe('#ff4d4f');
    expect(reset.tracks[0]!.skillCasts[0]!.presentation?.color).toBeNull();
    expect(original.tracks[0]!.skillCasts[0]!.presentation).toBeUndefined();
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

  it('stores and clears a skill-block random seed without changing other simulation inputs', () => {
    const seeded = setSkillCastRandomSeed(scenario(), 0, 'cast:1', 123);
    expect(seeded.tracks[0]!.skillCasts[0]!.simulationInputs).toEqual({
      randomSeed: 123,
    });

    const cleared = setSkillCastRandomSeed(seeded, 0, 'cast:1', null);
    expect(cleared.tracks[0]!.skillCasts[0]!.simulationInputs).toBeUndefined();
  });

  it('stores an independent complete custom definition and can return to the template', () => {
    const original = scenario();
    const definition: SkillDefinition = {
      key: 'skill',
      timelineBlockFrames: 45,
      scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
    };

    const customized = setSkillCastCustomDefinition(original, 0, 'cast:1', definition);
    const stored = customized.tracks[0]!.skillCasts[0]!.customDefinition!;
    expect(stored).toEqual(definition);
    expect(stored).not.toBe(definition);

    const mutableSequence = definition.scheduledSequences[0] as { startFrame: number };
    mutableSequence.startFrame = 9;
    expect(stored.scheduledSequences[0]!.startFrame).toBe(0);

    const reset = resetSkillCastToTemplate(customized, 0, 'cast:1');
    expect(reset.tracks[0]!.skillCasts[0]!.customDefinition).toBeUndefined();
    expect(resetSkillCastToTemplate(reset, 0, 'cast:1')).toBe(reset);
  });

  it('creates an isolated editor draft before the definition is committed', () => {
    const definition: SkillDefinition = {
      key: 'skill',
      timelineBlockFrames: 30,
      scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
    };

    const draft = createSkillDefinitionDraft(definition);
    (draft.scheduledSequences[0] as { startFrame: number }).startFrame = 12;

    expect(definition.scheduledSequences[0]!.startFrame).toBe(0);
    expect(draft.scheduledSequences[0]!.startFrame).toBe(12);
  });

  it('rejects a custom definition that cannot replace the referenced template', () => {
    const original = scenario();
    const wrongDefinition: SkillDefinition = {
      key: 'other',
      timelineBlockFrames: 30,
      scheduledSequences: [],
    };

    expect(() => setSkillCastCustomDefinition(original, 0, 'cast:1', wrongDefinition)).toThrow(
      'does not match source skill key',
    );
  });

  it('rejects an invalid custom definition before changing the scenario', () => {
    const original = scenario();
    const invalidDefinition = {
      key: 'skill',
      timelineBlockFrames: -1,
      scheduledSequences: [],
    } as unknown as SkillDefinition;

    expect(() => setSkillCastCustomDefinition(original, 0, 'cast:1', invalidDefinition)).toThrow(
      "invalid custom definition at 'customDefinition.timelineBlockFrames'",
    );
    expect(original.tracks[0]!.skillCasts[0]!.customDefinition).toBeUndefined();
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

    const removed = removeSkillCast(original, 0, 'cast:1');
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

    const twoMembers = removeSkillCast(original, 0, 'cast:2');
    expect(twoMembers.tracks[0]!.skillCasts.map(value => value.id)).toEqual(['cast:1', 'cast:3']);

    const oneMember = removeSkillCast(twoMembers, 0, 'cast:1');
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

describe('moveSkillCasts', () => {
  function multiTrackScenario() {
    const value = scenario();
    value.tracks[0]!.skillCasts.push({
      ...cast(),
      id: 'cast:2',
      placement: { startFrame: 60 },
    });
    value.tracks[1] = {
      id: 'track:1',
      operator: null,
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [{ ...cast(), id: 'cast:3', placement: { startFrame: 90 } }],
    };
    value.battle.durationFrames = 120;
    return value;
  }

  it('moves selected casts across tracks while preserving their relative positions', () => {
    const original = multiTrackScenario();
    const moved = moveSkillCasts(original, new Set(['cast:1', 'cast:3']), 0, 'cast:1', 45);

    expect(moved.tracks[0]!.skillCasts.map(value => value.placement.startFrame)).toEqual([45, 60]);
    expect(moved.tracks[1]!.skillCasts[0]!.placement.startFrame).toBe(105);
    expect(original.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(30);
  });

  it('clamps the shared delta at both timeline boundaries', () => {
    const original = multiTrackScenario();
    const selection = new Set(['cast:1', 'cast:3']);
    const movedLeft = moveSkillCasts(original, selection, 0, 'cast:1', 0);
    const movedRight = moveSkillCasts(original, selection, 0, 'cast:1', 100);

    expect(movedLeft.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(0);
    expect(movedLeft.tracks[1]!.skillCasts[0]!.placement.startFrame).toBe(60);
    expect(movedRight.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(60);
    expect(movedRight.tracks[1]!.skillCasts[0]!.placement.startFrame).toBe(120);
  });

  it('keeps the whole selection unchanged when any selected cast is locked', () => {
    const original = multiTrackScenario();
    original.tracks[1]!.skillCasts[0]!.presentation = { locked: true };

    expect(moveSkillCasts(original, new Set(['cast:1', 'cast:3']), 0, 'cast:1', 45)).toBe(original);
  });

  it('rejects stale selections and anchors outside the selection', () => {
    const original = multiTrackScenario();
    expect(() => moveSkillCasts(original, new Set(['cast:1', 'missing']), 0, 'cast:1', 45)).toThrow(
      'missing or duplicate',
    );
    expect(() => moveSkillCasts(original, new Set(['cast:3']), 0, 'cast:1', 45)).toThrow(
      'does not contain anchor',
    );
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

  it('adds, moves and removes cycle boundaries immutably', () => {
    const original = scenario();
    const added = addCycleBoundary(original, 'cycle:1', 45);
    const moved = moveCycleBoundary(added, 'cycle:1', 60);
    const removed = removeCycleBoundary(moved, 'cycle:1');
    expect(original.battle.cycleBoundaries).toEqual([]);
    expect(added.battle.cycleBoundaries[0]?.frame).toBe(45);
    expect(moved.battle.cycleBoundaries[0]?.frame).toBe(60);
    expect(removed.battle.cycleBoundaries).toEqual([]);
  });

  it('adds track-bound control switches only to occupied tracks', () => {
    const original = scenario();
    const added = addControlSwitch(original, 'switch:1', 30, 0);
    expect(moveControlSwitch(added, 'switch:1', 75).battle.controlSwitches[0]?.frame).toBe(75);
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
    expect(removeControlSwitch(added, 'switch:1').battle.controlSwitches).toEqual([]);
    expect(() => addControlSwitch(original, 'switch:2', 30, 1)).toThrow('track 1 is empty');
  });

  it('places and moves control switches throughout the preparation range', () => {
    const original = scenario();
    original.battle.prepFrames = 150;
    const added = addControlSwitch(original, 'switch:prep', -120, 0);
    expect(added.battle.controlSwitches[0]?.frame).toBe(-120);
    expect(moveControlSwitch(added, 'switch:prep', -150).battle.controlSwitches[0]?.frame).toBe(
      -150,
    );
    expect(() => moveControlSwitch(added, 'switch:prep', -151)).toThrow('editable timeline');
  });

  it('adds, configures, moves and removes dodge markers on occupied tracks', () => {
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
    const moved = moveDodgeMarker(configured, 'dodge:1', 20);

    expect(configured.battle.dodgeMarkers?.[0]).toEqual({
      id: 'dodge:1',
      frame: -10,
      trackIndex: 0,
      direction: 'backward',
      mode: { kind: 'perfectDodge', successDelayFrames: 5 },
    });
    expect(moved.battle.dodgeMarkers?.[0]?.frame).toBe(20);
    expect(removeDodgeMarker(moved, 'dodge:1').battle.dodgeMarkers).toEqual([]);
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

  it('persists only the explicitly supplied external fact and target', () => {
    const original = scenario();
    const added = addExternalEventMarker(
      original,
      'external:1',
      90,
      { scope: 'operator', trackIndex: 0 },
      { kind: 'comboCooldownControl', mode: 'cooldown' },
    );
    expect(added.battle.externalEventMarkers?.[0]).toEqual({
      id: 'external:1',
      frame: 90,
      target: { scope: 'operator', trackIndex: 0 },
      event: { kind: 'comboCooldownControl', mode: 'cooldown' },
    });
    expect(
      moveExternalEventMarker(added, 'external:1', 120).battle.externalEventMarkers?.[0]?.frame,
    ).toBe(120);
    const configured = updateExternalEventMarker(added, 'external:1', {
      event: {
        kind: 'comboCooldownControl',
        mode: 'ready',
      },
    });
    expect(configured.battle.externalEventMarkers?.[0]?.event).toEqual({
      kind: 'comboCooldownControl',
      mode: 'ready',
    });
    expect(updateExternalEventMarker(added, 'missing', {})).toBe(added);
    expect(removeExternalEventMarker(added, 'external:1').battle.externalEventMarkers).toEqual([]);
  });

  it('rejects marker frames outside the editable battle range', () => {
    const original = scenario();
    expect(() => addCycleBoundary(original, 'cycle:1', -1)).toThrow('marker frame');
    expect(() => addCycleBoundary(original, 'cycle:1', original.battle.durationFrames + 1)).toThrow(
      'marker frame',
    );
  });
});

describe('global Buff selection commands', () => {
  it('keeps custom definitions when toggling and editing numeric modifiers, without aliasing drafts', () => {
    const original = scenario();
    const config = {
      modifiers: [],
      enabledPresetIds: ['combo-cdr-50'],
      customBuffs: [
        {
          id: 'scenario:custom-global:1',
          name: 'Custom',
          enabled: false,
          definition: { stackingType: 'unlimited' as const },
        },
      ],
    };
    const updated = setGlobalConfig(original, config);
    config.customBuffs[0]!.name = 'Changed draft';
    expect(updated.globalConfig.customBuffs![0]!.name).toBe('Custom');
    const edited = setGlobalOperatorStatModifiers(updated, [
      { id: 'attack', kind: 'operatorStat', modifier: 'attackPercent', value: 0.1 },
    ]);
    expect(edited.globalConfig.customBuffs).toEqual(updated.globalConfig.customBuffs);
    expect(edited.globalConfig.enabledPresetIds).toEqual(['combo-cdr-50']);
    expect(original.globalConfig.customBuffs).toBeUndefined();
    expect(() => setGlobalConfig(original, { ...config, enabledPresetIds: ['missing'] })).toThrow(
      'unknown',
    );
  });
});
