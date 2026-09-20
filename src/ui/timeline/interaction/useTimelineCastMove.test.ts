import { effectScope, shallowRef } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { createInteractionSession } from '../../interaction/interactionSession';
import { createEmptyTimelineActionSelection } from './timelineActionSelection';
import { useTimelineCastMove } from './useTimelineCastMove';
import { moveSkillCasts } from './timelineDocumentCommands';

afterEach(() => vi.unstubAllGlobals());

function fixture(readOnly = false, minimumInputFrame = 0) {
  const events = new EventTarget();
  class Lane {
    readonly dataset = { trackIndex: '0' };
    closest() {
      return this;
    }
    getBoundingClientRect() {
      return { left: 0 };
    }
  }
  vi.stubGlobal('window', events);
  vi.stubGlobal('Element', Lane);
  vi.stubGlobal('document', { elementFromPoint: () => new Lane() });
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const original = createEmptyScenario('drag', 'drag');
  original.battle.prepFrames = 0;
  original.tracks[0] = {
    id: 'track',
    operator: null,
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [
      {
        id: 'cast',
        placement: { startFrame: 10 },
        source: { kind: 'operatorSkill', skillGroupKey: 'attack', skillKey: 'a1' },
      },
    ],
  };
  const scenario = shallowRef(original);
  const actionSelection = shallowRef(createEmptyTimelineActionSelection());
  const interactionSession = createInteractionSession();
  const simulationService = { beginInteractiveSession: vi.fn(), endInteractiveSession: vi.fn() };
  const commitScenario = vi.fn(() => true);
  const scope = effectScope();
  const movement = scope.run(() =>
    useTimelineCastMove({
      isInputReadOnly: () => readOnly,
      minimumInputFrame: shallowRef(minimumInputFrame),
      scenario,
      actionSelection,
      interactionSession,
      simulationService,
      resolvedSkillCastStartFrames: shallowRef(new Map([['cast', 10]])),
      timelineScroll: shallowRef(null),
      pxPerFrame: shallowRef(1),
      snapFrames: shallowRef(1),
      cursorFrame: shallowRef(0),
      trackHeaderWidth: 180,
      rulerHeight: 60,
      timelineFramePx: frame => frame,
      alignSelectedCastToTarget: () => false,
      applyActionSelection: selection => {
        actionSelection.value = selection;
      },
      commitScenario,
      simulateNow: async () => true,
      warnLocked: vi.fn(),
    }),
  )!;
  movement.beginCastMove(
    {
      button: 0,
      pointerId: 1,
      clientX: 10,
      clientY: 100,
      currentTarget: { getBoundingClientRect: () => ({ left: 10 }) },
      preventDefault() {},
      stopPropagation() {},
    } as unknown as PointerEvent,
    0,
    'cast',
  );
  const move = (clientX = 30) =>
    events.dispatchEvent(
      Object.assign(new Event('pointermove'), {
        pointerId: 1,
        clientX,
        clientY: 100,
      }),
    );
  move();
  expect(scenario.value.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(readOnly ? 10 : 30);
  return {
    scenario,
    original,
    movement,
    interactionSession,
    simulationService,
    commitScenario,
    scope,
    move,
    finish: () =>
      events.dispatchEvent(
        Object.assign(new Event('pointerup'), {
          pointerId: 1,
          clientX: 30,
          clientY: 100,
          stopPropagation() {},
        }),
      ),
  };
}

describe('timeline cast move lifecycle', () => {
  it('拖入冻结历史时停在继承帧，仍可向后拖动', () => {
    const f = fixture(false, 5);
    f.move(-100);
    expect(f.scenario.value.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(5);
    f.move(40);
    expect(f.scenario.value.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(40);
    f.scope.stop();
  });
  it('多选共享位移以最早组首限制继承边界，而非仅限制鼠标抓取的技能', () => {
    const f = fixture();
    const base = structuredClone(f.original);
    base.tracks[0]!.skillCasts.push({
      ...structuredClone(base.tracks[0]!.skillCasts[0]!),
      id: 'later',
      placement: { startFrame: 30 },
    });
    const moved = moveSkillCasts(base, new Set(['cast', 'later']), 0, 'later', 5, undefined, 5);
    expect(moved.tracks[0]!.skillCasts.map(cast => cast.placement.startFrame)).toEqual([5, 25]);
    f.scope.stop();
  });
  it('提交被拒绝时撤销预览，不能留下被判为历史输入的非法位置', async () => {
    const f = fixture();
    f.commitScenario.mockReturnValue(false);
    f.finish();
    await vi.waitFor(() => expect(f.movement.castMoveGesture.value).toBeNull());
    expect(f.scenario.value).toBe(f.original);
    expect(f.interactionSession.current).toBeNull();
    f.scope.stop();
  });
  it('只读输入不启动预览或交互模拟，也不提交修改', () => {
    const f = fixture(true);
    expect(f.scenario.value).toBe(f.original);
    expect(f.interactionSession.current).toBeNull();
    expect(f.simulationService.beginInteractiveSession).not.toHaveBeenCalled();
    expect(f.commitScenario).not.toHaveBeenCalled();
    f.scope.stop();
  });
  it('rolls back a cancelled preview and releases listeners without adding history', () => {
    const f = fixture();
    expect(f.interactionSession.current?.owner).toBe('cast-move');
    f.movement.cancelCastMove();
    expect(f.scenario.value).toBe(f.original);
    expect(f.interactionSession.current).toBeNull();
    expect(f.simulationService.endInteractiveSession).toHaveBeenCalledTimes(1);
    f.move();
    expect(f.scenario.value).toBe(f.original);
    expect(f.commitScenario).not.toHaveBeenCalled();
    f.scope.stop();
    expect(f.simulationService.endInteractiveSession).toHaveBeenCalledTimes(1);
  });

  it('discards the old preview on project replacement without restoring the old scenario', () => {
    const f = fixture();
    const replacement = createEmptyScenario('replacement', 'replacement');
    f.scenario.value = replacement;
    f.movement.discardCastMove();
    f.interactionSession.cancel();
    f.scope.stop();
    expect(f.scenario.value).toBe(replacement);
    expect(f.movement.castMoveGesture.value).toBeNull();
    expect(f.simulationService.endInteractiveSession).toHaveBeenCalledTimes(1);
    expect(f.commitScenario).not.toHaveBeenCalled();
  });
});
