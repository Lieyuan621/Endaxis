import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../core/project/createProject';
import { createInheritedScenario } from './scenarioInheritance';
import { ScenarioEditorSession } from './scenarioEditorSession';

function source() {
  const scenario = createEmptyScenario('source', 'Source');
  scenario.tracks[0] = {
    id: 'track',
    operator: null,
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 50 },
    skillCasts: [
      {
        id: 'a',
        source: { kind: 'custom', actionType: 'test', name: 'A' },
        placement: { startFrame: -10 },
      },
      {
        id: 'b',
        source: { kind: 'custom', actionType: 'test', name: 'B' },
        placement: { afterCastId: 'a' },
      },
      {
        id: 'c',
        source: { kind: 'custom', actionType: 'test', name: 'C' },
        placement: { afterCastId: 'b' },
      },
    ],
    consumableUses: [
      { id: 'old', frame: 1, consumableId: 'drug' },
      { id: 'future', frame: 20, consumableId: 'drug' },
    ],
  };
  scenario.battle.controlSwitches = [
    { id: 'old', frame: 2, trackIndex: 0 },
    { id: 'future', frame: 20, trackIndex: 0 },
  ];
  return scenario;
}

it('复制完整构筑及历史，边界输入不继承，连续组保持历史内部关系且无共享可变引用', () => {
  const original = source();
  const inherited = createInheritedScenario(original, {
    id: 'copy',
    name: 'Copy',
    frame: 20,
    resolveSkillFrame: (document, id) => {
      expect(document).toBe(original);
      return id === 'b' ? 10 : 20;
    },
  });
  expect(inherited.tracks[0]!.skillCasts.map(cast => cast.id)).toEqual(['a', 'b']);
  expect(inherited.tracks[0]!.skillCasts[1]!.placement).toEqual({ afterCastId: 'a' });
  expect(inherited.tracks[0]!.consumableUses).toHaveLength(1);
  expect(inherited.battle.controlSwitches).toHaveLength(1);
  expect(inherited.battle.prepFrames).toBe(original.battle.prepFrames);
  expect(inherited.battle.simulationRange?.startFrame).toBe(20);
  original.tracks[0]!.initialState.ultimateEnergy = 0;
  original.tracks[0]!.skillCasts.length = 0;
  expect(inherited.tracks[0]!.initialState.ultimateEnergy).toBe(50);
  expect(inherited.tracks[0]!.skillCasts).toHaveLength(2);
});

it('未知连续成员位置不猜测，重复继承不能倒退', () => {
  expect(() =>
    createInheritedScenario(source(), {
      id: 'copy',
      name: '',
      frame: -11,
      resolveSkillFrame: () => 10,
    }),
  ).toThrow('precedes the source simulation');
  expect(() =>
    createInheritedScenario(source(), {
      id: 'copy',
      name: '',
      frame: 20,
      resolveSkillFrame: () => undefined,
    }),
  ).toThrow('unresolved');
  const scenario = source();
  scenario.inheritance = { frame: 30, sourceScenarioId: 'missing' };
  expect(() =>
    createInheritedScenario(scenario, {
      id: 'copy',
      name: '',
      frame: 20,
      resolveSkillFrame: () => 10,
    }),
  ).toThrow('precede');
});

it('未来组无需后续成员回执即可移除，不会阻止历史继承', () => {
  const original = source();
  original.tracks[0]!.skillCasts[0]!.placement = { startFrame: 30 };
  const inherited = createInheritedScenario(original, {
    id: 'copy',
    name: 'Copy',
    frame: 20,
    resolveSkillFrame: () => {
      throw new Error('future inputs must not be resolved');
    },
  });
  expect(inherited.tracks[0]!.skillCasts).toEqual([]);
  expect(inherited.battle.controlSwitches.map(marker => marker.id)).toEqual(['old']);
});

it('继承只保留历史 Dash，未来成功可以独立添加、修改和移除', () => {
  const original = source();
  original.battle.dodgeMarkers = [
    {
      id: 'perfect',
      frame: 10,
      trackIndex: 0,
      direction: 'forward',
      mode: { kind: 'perfectDodge', successDelayFrames: 5 },
    },
  ];

  const split = createInheritedScenario(original, {
    id: 'copy',
    name: 'Copy',
    frame: 12,
    resolveSkillFrame: (_, id) => (id === 'b' ? 10 : 20),
  });
  expect(split.battle.dodgeMarkers?.[0]?.mode).toEqual({ kind: 'dodge' });
  const session = new ScenarioEditorSession(split);
  expect(
    session.commit('success', before => {
      const next = structuredClone(before);
      next.battle.dodgeMarkers![0]!.mode = { kind: 'perfectDodge', successDelayFrames: 5 };
      return next;
    }),
  ).toBe(true);
  expect(() =>
    session.commit('past-success', before => {
      const next = structuredClone(before);
      next.battle.dodgeMarkers![0]!.mode = { kind: 'perfectDodge', successDelayFrames: 1 };
      return next;
    }),
  ).toThrow('frozen-input-history');
  expect(() =>
    session.commit('past-dash', before => {
      const next = structuredClone(before);
      next.battle.dodgeMarkers![0]!.direction = 'backward';
      return next;
    }),
  ).toThrow('frozen-input-history');
  expect(
    session.commit('remove-success', before => {
      const next = structuredClone(before);
      next.battle.dodgeMarkers![0]!.mode = { kind: 'dodge' };
      return next;
    }),
  ).toBe(true);

  const inherited = createInheritedScenario(original, {
    id: 'copy',
    name: 'Copy',
    frame: 16,
    resolveSkillFrame: (_, id) => (id === 'b' ? 10 : 20),
  });
  expect(inherited.battle.dodgeMarkers?.map(marker => marker.id)).toEqual(['perfect']);
});

it('继承后的历史连续组可查看和改外观，不能改输入，未来连续组无需历史位置重算', () => {
  const inherited = createInheritedScenario(source(), {
    id: 'copy',
    name: 'copy',
    frame: 20,
    resolveSkillFrame: (_, id) => (id === 'b' ? 10 : 30),
  });
  const session = new ScenarioEditorSession(inherited);
  expect(session.commit('rename', before => ({ ...before, name: 'new' }))).toBe(true);
  expect(() =>
    session.commit('past', before => {
      const next = structuredClone(before);
      next.tracks[0]!.skillCasts[1]!.simulationInputs = { randomSeed: 42 };
      return next;
    }),
  ).toThrow('frozen-input-history');
  expect(
    session.commit('future-group', before => {
      const next = structuredClone(before);
      next.tracks[0]!.skillCasts.push(
        {
          id: 'future',
          source: { kind: 'custom', actionType: 'test', name: 'new' },
          placement: { startFrame: 20 },
        },
        {
          id: 'next',
          source: { kind: 'custom', actionType: 'test', name: 'next' },
          placement: { afterCastId: 'future' },
        },
      );
      return next;
    }),
  ).toBe(true);
});

it('继承文档自动启用通用配置与历史约束，不能清除元数据绕过', () => {
  const scenario = createEmptyScenario('copy', 'Copy');
  scenario.inheritance = { frame: 20, sourceScenarioId: 'missing' };
  const session = new ScenarioEditorSession(scenario);
  expect(() => session.commit('detach', before => ({ ...before, inheritance: undefined }))).toThrow(
    'fixed-inheritance',
  );
  expect(() =>
    session.commit('enemy', before => ({ ...before, enemy: { ...before.enemy, rank: 'elite' } })),
  ).toThrow('locked-configuration');
  expect(() =>
    session.commit('past', before => ({
      ...before,
      battle: { ...before.battle, controlSwitches: [{ id: 'switch', frame: 19, trackIndex: 0 }] },
    })),
  ).toThrow('frozen-input-history');
  expect(
    session.commit('future', before => ({
      ...before,
      battle: { ...before.battle, controlSwitches: [{ id: 'switch', frame: 20, trackIndex: 0 }] },
    })),
  ).toBe(true);
});
