import { describe, expect, it } from 'vitest';
import { createRepeatedActionState } from '../state/actionState';
import {
  executeRepeatedAction,
  finishRepeatedAction,
  tickRepeatedAction,
} from './repeatedActionExecution';

describe('TickIntervalActionV2', () => {
  it('首次 Tick 执行，周期模式每次更新最多一次，结束达到时长才补齐', () => {
    const state = createRepeatedActionState();
    const parameters = {
      nativeTickIntervalV2: {
        executeEachFrame: false,
        intervalSeconds: 0.1,
        totalTickCount: 4,
        totalDurationSeconds: 0.4,
      },
    };
    let count = 0;
    const run = () => {
      count++;
    };
    executeRepeatedAction(state, parameters, run);
    expect(count).toBe(0);
    tickRepeatedAction(state, parameters, 0.4, run, 12);
    expect(count).toBe(1);
    finishRepeatedAction(state, parameters, run);
    expect(count).toBe(4);
    executeRepeatedAction(state, parameters, run);
    tickRepeatedAction(state, parameters, 0.1, run, 15);
    finishRepeatedAction(state, parameters, run);
    expect(count).toBe(5);
  });
  it('逐帧模式同帧不重入、跨帧追赶且恢复后保持次数上限', () => {
    let state = createRepeatedActionState();
    const parameters = {
      nativeTickIntervalV2: {
        executeEachFrame: true,
        intervalSeconds: 0,
        totalTickCount: 5,
        totalDurationSeconds: 1,
      },
    };
    let count = 0;
    const run = () => {
      count++;
    };
    executeRepeatedAction(state, parameters, run);
    tickRepeatedAction(state, parameters, 0, run, 4);
    tickRepeatedAction(state, parameters, 0, run, 4);
    expect(count).toBe(1);
    state = structuredClone(state);
    tickRepeatedAction(state, parameters, 0.1, run, 7);
    expect(count).toBe(4);
    tickRepeatedAction(state, parameters, 1, run, 37);
    expect(count).toBe(5);
  });
});
