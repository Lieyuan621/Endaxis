import { computed, effectScope, shallowRef } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { createInteractionSession } from '../../interaction/interactionSession';
import { createEmptyTimelineActionSelection } from './timelineActionSelection';
import { useTimelineItemMove } from './useTimelineItemMove';
import { collectTimelineItems, timelineItemKey } from './timelineItems';

afterEach(() => vi.unstubAllGlobals());

function fixture(readOnly = false, minimumInputFrame = 0, blocked = false) {
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
  if (minimumInputFrame > 0)
    original.inheritance = { sourceScenarioId: 'source', frame: minimumInputFrame };
  if (readOnly) original.tracks[0]!.skillCasts[0]!.presentation = { locked: true };
  const pointerFrame = vi.fn((x: number) => x);
  const scenario = shallowRef(original);
  const actionSelection = shallowRef(createEmptyTimelineActionSelection());
  const interactionSession = createInteractionSession();
  const simulationService = { beginInteractiveSession: vi.fn(), endInteractiveSession: vi.fn() };
  const commitScenario = vi.fn(
    (_name: string, command: (current: typeof original) => typeof original) => {
      scenario.value = command(scenario.value);
      return true;
    },
  );
  const simulateNow = vi.fn(async () => true);
  const unblock = blocked ? interactionSession.block() : () => {};
  const scope = effectScope();
  const movement = scope.run(() =>
    useTimelineItemMove({
      scenario,
      items: computed(() => collectTimelineItems(scenario.value)),
      selection: actionSelection,
      interactionSession,
      simulationService,
      viewport: shallowRef(null),
      pointerFrame,
      snapFrames: shallowRef(1),
      headerWidth: 180,
      rulerHeight: 60,
      verticalAutoScroll: () => false,
      applySelection: selection => {
        actionSelection.value = selection;
      },
      commit: commitScenario,
      simulate: simulateNow,
      blocked: vi.fn(),
    }),
  )!;
  const begin = () =>
    movement.begin(
      {
        button: 0,
        pointerId: 1,
        clientX: 10,
        clientY: 100,
        preventDefault() {},
        stopPropagation() {},
      } as unknown as PointerEvent,
      timelineItemKey({ kind: 'skill', id: 'cast' }),
    );
  begin();
  const move = (clientX = 30, buttons = 1) =>
    events.dispatchEvent(
      Object.assign(new Event('pointermove'), {
        pointerId: 1,
        buttons,
        clientX,
        clientY: 100,
      }),
    );
  move();
  expect(scenario.value.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(
    readOnly || blocked ? 10 : 30,
  );
  return {
    scenario,
    pointerFrame,
    original,
    begin,
    unblock,
    events,
    simulateNow,
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

describe('timeline item move lifecycle', () => {
  it('交互被屏障阻止时不遗留拖动状态或启动模拟', () => {
    const f = fixture(false, 0, true);
    expect(f.movement.gesture.value).toBeNull();
    expect(f.simulationService.beginInteractiveSession).not.toHaveBeenCalled();
    f.unblock();
    f.begin();
    f.move();
    expect(f.interactionSession.current?.owner).toBe('timeline-item-move');
    f.scope.stop();
  });

  it('漏收松开事件后没有按住主按钮的移动会取消并还原预览', () => {
    const f = fixture();
    f.move(40, 0);
    expect(f.movement.gesture.value).toBeNull();
    expect(f.scenario.value).toBe(f.original);
    expect(f.interactionSession.current).toBeNull();
    expect(f.commitScenario).not.toHaveBeenCalled();
    f.scope.stop();
  });

  it('其他指针取消不影响当前拖动，当前指针取消则还原', () => {
    const f = fixture();
    f.events.dispatchEvent(Object.assign(new Event('pointercancel'), { pointerId: 2 }));
    expect(f.movement.gesture.value).not.toBeNull();
    f.events.dispatchEvent(Object.assign(new Event('pointercancel'), { pointerId: 1 }));
    expect(f.movement.gesture.value).toBeNull();
    expect(f.scenario.value).toBe(f.original);
    f.scope.stop();
  });

  it('松手后的模拟被替代也清理预览，保留已提交落点', async () => {
    const f = fixture();
    f.simulateNow.mockResolvedValue(false);
    f.finish();
    await vi.waitFor(() => expect(f.movement.gesture.value).toBeNull());
    expect(f.scenario.value.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(30);
    expect(f.interactionSession.current).toBeNull();
    f.scope.stop();
  });

  it('模拟异常也清理预览和交互占用', async () => {
    const f = fixture();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      f.simulateNow.mockRejectedValue(new Error('simulation failed'));
      f.finish();
      await vi.waitFor(() => expect(f.movement.gesture.value).toBeNull());
      expect(f.interactionSession.current).toBeNull();
      expect(f.simulationService.endInteractiveSession).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalled();
    } finally {
      error.mockRestore();
      f.scope.stop();
    }
  });

  it('松手时计算落点异常也释放手势并还原文档', async () => {
    const f = fixture();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    f.pointerFrame.mockImplementation(() => {
      throw new Error('placement failed');
    });
    try {
      f.finish();
      await vi.waitFor(() => expect(error).toHaveBeenCalled());
      expect(f.movement.gesture.value).toBeNull();
      expect(f.interactionSession.current).toBeNull();
      expect(f.scenario.value).toBe(f.original);
      expect(f.commitScenario).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
      f.scope.stop();
    }
  });

  it('上一轮松手模拟结束不能清除新一轮拖动', async () => {
    const f = fixture();
    let finishSimulation!: (value: boolean) => void;
    f.simulateNow.mockReturnValue(
      new Promise(resolve => {
        finishSimulation = resolve;
      }),
    );
    f.finish();
    await vi.waitFor(() => expect(f.simulateNow).toHaveBeenCalled());
    f.begin();
    f.move(50);
    const current = f.movement.gesture.value;
    finishSimulation(false);
    await Promise.resolve();
    await Promise.resolve();
    expect(f.movement.gesture.value).toBe(current);
    expect(f.interactionSession.current?.owner).toBe('timeline-item-move');
    f.scope.stop();
  });

  it('拖入冻结历史时停在继承帧，仍可向后拖动', () => {
    const f = fixture(false, 5);
    f.move(-100);
    expect(f.scenario.value.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(5);
    f.move(40);
    expect(f.scenario.value.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(40);
    f.scope.stop();
  });
  it('提交被拒绝时撤销预览，不能留下被判为历史输入的非法位置', async () => {
    const f = fixture();
    f.commitScenario.mockReturnValue(false);
    f.finish();
    await vi.waitFor(() => expect(f.movement.gesture.value).toBeNull());
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
    expect(f.interactionSession.current?.owner).toBe('timeline-item-move');
    f.movement.cancel();
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
    f.movement.discard();
    f.interactionSession.cancel();
    f.scope.stop();
    expect(f.scenario.value).toBe(replacement);
    expect(f.movement.gesture.value).toBeNull();
    expect(f.simulationService.endInteractiveSession).toHaveBeenCalledTimes(1);
    expect(f.commitScenario).not.toHaveBeenCalled();
  });
});
