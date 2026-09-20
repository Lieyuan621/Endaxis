import { expect, it, vi } from 'vitest';
import { createEmptyProject } from '../../core/project/createProject';
import type { ScenarioDocument } from '../../core/project/schema';
import { ScenarioEditorSession } from './scenarioEditorSession';
import { ActiveScenarioEditorSession, ProjectEditorSession } from './projectEditorSession';
import { ScenarioEditConstraintError, type ScenarioEditPolicy } from './scenarioEditConstraints';

function fixture() {
  const project = createEmptyProject({ createdWith: 'test' });
  project.scenarios[0]!.tracks[0] = {
    id: 'track',
    operator: null,
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [
      {
        id: 'anchor',
        source: { kind: 'custom', actionType: 'test', name: 'anchor' },
        placement: { startFrame: 10 },
      },
      {
        id: 'locked',
        source: { kind: 'custom', actionType: 'test', name: 'locked' },
        placement: { afterCastId: 'anchor' },
        presentation: { locked: true },
      },
    ],
  };
  return project;
}

function moving(scenario: ScenarioDocument): ScenarioDocument {
  const next = structuredClone(scenario);
  next.tracks[0]!.skillCasts[0]!.placement = { startFrame: 20 };
  return next;
}

function frozenFixture() {
  const scenario = fixture().scenarios[0]!;
  scenario.tracks[0]!.skillCasts[1]!.placement = { startFrame: 30 };
  scenario.tracks[0]!.skillCasts[1]!.presentation = {};
  scenario.tracks[0]!.consumableUses = [{ id: 'item', frame: 12, consumableId: 'medicine' }];
  scenario.battle.controlSwitches = [{ id: 'switch', frame: 15, trackIndex: 0 }];
  scenario.battle.externalEventMarkers = [
    {
      id: 'event',
      frame: 18,
      target: { scope: 'team' },
      event: { kind: 'comboCooldownControl', mode: 'cooldown' },
    },
  ];
  return scenario;
}

it('历史保护涵盖技能、切人、物品与人工事件，并保护空白和边界两侧', () => {
  const edits: ((s: ScenarioDocument) => void)[] = [
    s => {
      s.tracks[0]!.skillCasts[0]!.simulationInputs = { randomSeed: 9 };
    },
    s => {
      s.battle.controlSwitches[0]!.frame++;
    },
    s => {
      s.tracks[0]!.consumableUses = [];
    },
    s => {
      s.battle.externalEventMarkers![0]!.event = { kind: 'comboCooldownControl', mode: 'ready' };
    },
    s => {
      s.battle.controlSwitches.push({ id: 'new', frame: 19, trackIndex: 0 });
    },
    s => {
      s.tracks[0]!.skillCasts[1]!.placement = { startFrame: 19 };
    },
    s => {
      s.tracks[0]!.skillCasts[0]!.placement = { startFrame: 20 };
    },
  ];
  for (const edit of edits) {
    const session = new ScenarioEditorSession(frozenFixture(), 50, { inputBeforeFrame: 20 });
    expect(() =>
      session.commit('change', before => {
        const next = structuredClone(before);
        edit(next);
        return next;
      }),
    ).toThrow(ScenarioEditConstraintError);
    expect(session.snapshot.revision).toBe(0);
  }
  const session = new ScenarioEditorSession(frozenFixture(), 50, { inputBeforeFrame: 20 });
  expect(
    session.commit('at-boundary', before => {
      const next = structuredClone(before);
      next.tracks[0]!.skillCasts[1]!.placement = { startFrame: 20 };
      next.tracks[0]!.skillCasts[0]!.presentation = { color: 'blue' };
      return next;
    }),
  ).toBe(true);
});

it('配置锁不锁名称、布局和未来输入，项目级提交也检查配置', () => {
  const project = fixture();
  project.scenarios[0] = frozenFixture();
  const session = new ProjectEditorSession(project, 50, () => ({ configurationLocked: true }));
  const active = new ActiveScenarioEditorSession(session);
  for (const edit of [
    (s: ScenarioDocument) => {
      s.tracks[0]!.initialState.ultimateEnergy++;
    },
    (s: ScenarioDocument) => {
      s.enemy.editable.hp++;
    },
    (s: ScenarioDocument) => {
      s.battle.random = { mode: 'expected', globalSeed: 10 };
    },
  ]) {
    expect(() =>
      active.commit('config', before => {
        const next = structuredClone(before);
        edit(next);
        return next;
      }),
    ).toThrow(ScenarioEditConstraintError);
  }
  expect(
    active.commit('display', before => ({
      ...before,
      name: 'renamed',
      editor: { ...before.editor, prepExpanded: false },
    })),
  ).toBe(true);
});

it('完整输入锁可锁标记；未解析连续组不能按未来放行，解析器必须区分候选文档', () => {
  const scenario = frozenFixture();
  const locked = new ScenarioEditorSession(scenario, 50, {
    lockedInputs: [{ kind: 'consumable', id: 'item' }],
  });
  expect(() =>
    locked.commit('item', before => {
      const next = structuredClone(before);
      next.tracks[0]!.consumableUses![0]!.consumableId = 'other';
      return next;
    }),
  ).toThrow(ScenarioEditConstraintError);
  scenario.tracks[0]!.skillCasts[1]!.placement = { afterCastId: 'anchor' };
  const unresolved = new ScenarioEditorSession(scenario, 50, { inputBeforeFrame: 20 });
  expect(() => unresolved.commit('rename', before => ({ ...before, name: 'new' }))).toThrow(
    ScenarioEditConstraintError,
  );
  const resolved = new ScenarioEditorSession(scenario, 50, {
    inputBeforeFrame: 20,
    resolveSkillFrame: document => (document === scenario ? 30 : 19),
  });
  expect(() => resolved.commit('candidate', before => ({ ...before, name: 'new' }))).toThrow(
    ScenarioEditConstraintError,
  );
});

it('启用固定约束后撤销也不能修改历史，拒绝后保留撤销栈', () => {
  const project = fixture();
  project.scenarios[0] = frozenFixture();
  let policy: ScenarioEditPolicy = {};
  const session = new ProjectEditorSession(project, 50, () => policy);
  const active = new ActiveScenarioEditorSession(session);
  active.commit('past', moving);
  policy = { inputBeforeFrame: 25 };
  expect(() => session.undo()).toThrow(ScenarioEditConstraintError);
  expect(session.canUndo).toBe(true);
  expect(session.canRedo).toBe(false);
  expect(session.snapshot.revision).toBe(1);
});

it('拒绝间接移动锁定成员，失败不发布、不记历史，项目级批量命令也不能绕过', () => {
  const project = fixture();
  const single = new ScenarioEditorSession(project.scenarios[0]!);
  const projectSession = new ProjectEditorSession(project);
  const active = new ActiveScenarioEditorSession(projectSession);
  for (const session of [single, active]) {
    const subscriber = vi.fn();
    session.subscribe(subscriber);
    expect(() => session.commit('move', moving)).toThrow(ScenarioEditConstraintError);
    expect(session.snapshot.revision).toBe(0);
    expect(session.canUndo).toBe(false);
    expect(subscriber).not.toHaveBeenCalled();
  }
  expect(() =>
    projectSession.commit('batch', before => ({
      ...before,
      scenarios: before.scenarios.map(scenario => ({ ...moving(scenario), name: 'changed' })),
    })),
  ).toThrow(ScenarioEditConstraintError);
  expect(projectSession.snapshot.project).toBe(project);
});

it('位置锁允许参数和外观修改；单独解锁后可移动，撤销重做恢复锁和位置', () => {
  const session = new ScenarioEditorSession(fixture().scenarios[0]!);
  session.commit('appearance', before => {
    const next = structuredClone(before);
    next.tracks[0]!.skillCasts[1]!.presentation!.color = 'red';
    next.tracks[0]!.skillCasts[1]!.simulationInputs = { randomSeed: 42 };
    return next;
  });
  expect(() =>
    session.commit('unlock-and-move', before => {
      const next = moving(before);
      next.tracks[0]!.skillCasts[1]!.presentation!.locked = false;
      return next;
    }),
  ).toThrow(ScenarioEditConstraintError);
  session.commit('unlock', before => {
    const next = structuredClone(before);
    next.tracks[0]!.skillCasts[1]!.presentation!.locked = false;
    return next;
  });
  session.commit('move', moving);
  session.undo();
  session.undo();
  expect(session.snapshot.scenario.tracks[0]!.skillCasts[1]!.presentation!.locked).toBe(true);
  session.redo();
  session.redo();
  expect(session.snapshot.scenario.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(20);
});

it('禁止删除锁块或其前驱，但允许删除整个方案', () => {
  const project = fixture();
  for (const id of ['anchor', 'locked']) {
    const session = new ScenarioEditorSession(project.scenarios[0]!);
    expect(() =>
      session.commit('delete', before => {
        const next = structuredClone(before);
        next.tracks[0]!.skillCasts = next.tracks[0]!.skillCasts.filter(cast => cast.id !== id);
        return next;
      }),
    ).toThrow(ScenarioEditConstraintError);
  }
  const other = structuredClone(project.scenarios[0]!);
  other.id = 'other';
  project.scenarios.push(other);
  const session = new ProjectEditorSession(project);
  expect(
    session.commit('deleteScenario', before => ({
      ...before,
      activeScenarioId: other.id,
      scenarios: [other],
    })),
  ).toBe(true);
});
