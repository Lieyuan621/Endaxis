import type { TyphoeaArcherySelectionState } from '../state/environmentState';
import { expect, it } from 'vitest';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { reconcileTyphoeaArcherySelection, TyphoeaArcheryRuntime } from './typhoeaArcherySelection';

it('补选保留已锁定目标，离场腾出名额，完整重选才改变已满列表', () => {
  const a: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:a' };
  const b: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:b' };
  const c: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:c' };
  const state: TyphoeaArcherySelectionState = { selected: [] };
  expect(reconcileTyphoeaArcherySelection(state, [a, a, b, c], 2, true)).toEqual({
    added: [a, b],
    removed: [],
  });
  expect(reconcileTyphoeaArcherySelection(state, [c, a, b], 2, false)).toEqual({
    added: [],
    removed: [],
  });
  expect(state.selected).toEqual([a, b]);
  const restored = structuredClone(state);
  for (const current of [state, restored]) {
    expect(reconcileTyphoeaArcherySelection(current, [c, b], 2, false)).toEqual({
      added: [c],
      removed: [a],
    });
    expect(current.selected).toEqual([b, c]);
    expect(reconcileTyphoeaArcherySelection(current, [a, b, c], 2, true)).toEqual({
      added: [a],
      removed: [c],
    });
    expect(reconcileTyphoeaArcherySelection(current, [], 0, false)).toEqual({
      added: [],
      removed: [a, b],
    });
    expect(current.selected).toEqual([]);
  }
  expect(state).toEqual(restored);
});

it('重复注册直到最后一个句柄结束才清理，恢复后继续注销而不重放注册', () => {
  const runtime = new TyphoeaArcheryRuntime();
  const candidates: RuntimeTargetRef[] = [
    { kind: 'enemy', enemyId: 'enemy:a' },
    { kind: 'enemy', enemyId: 'enemy:b' },
  ];
  expect(runtime.update(candidates)).toEqual({ added: [], removed: [] });
  const first = runtime.register(2);
  const second = runtime.register(2);
  expect(runtime.update(candidates)).toEqual({ added: candidates, removed: [] });
  const restored = new TyphoeaArcheryRuntime(structuredClone(runtime.runtimeState));
  for (const current of [runtime, restored]) {
    expect(current.unregister(first)).toEqual([]);
    expect(current.unregister(first)).toEqual([]);
    expect(current.runtimeState.selected).toEqual(candidates);
    expect(current.update([...candidates].reverse())).toEqual({ added: [], removed: [] });
    expect(current.unregister(second)).toEqual(candidates);
    expect(current.runtimeState.selected).toEqual([]);
    expect(current.update(candidates)).toEqual({ added: [], removed: [] });
    expect(current.register(2)).toBe(3);
    expect(current.update(candidates)).toEqual({ added: candidates, removed: [] });
  }
  expect(restored.runtimeState).toEqual(runtime.runtimeState);
});

it('额外注册覆盖数量配置，不重启瞄准或隐式执行完整重选', () => {
  const runtime = new TyphoeaArcheryRuntime();
  const candidates: RuntimeTargetRef[] = [
    { kind: 'enemy', enemyId: 'enemy:a' },
    { kind: 'enemy', enemyId: 'enemy:b' },
  ];
  const first = runtime.register(2);
  runtime.update(candidates);
  const second = runtime.register(1);
  expect(runtime.update(candidates)).toEqual({ added: [], removed: [] });
  expect(runtime.runtimeState.selected).toEqual(candidates);
  expect(runtime.update(candidates, true)).toEqual({ added: [], removed: [candidates[1]] });
  runtime.unregister(second);
  expect(runtime.runtimeState.targetCount).toBe(1);
  expect(runtime.unregister(first)).toEqual([candidates[0]]);
});
