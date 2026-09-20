import { describe, expect, it } from 'vitest';
import type { CombatBuff } from './combatBuffs';
import { BuffProgressRecorder } from './buffProgressRecorder';

describe('BuffProgressRecorder', () => {
  it('恢复采样分母与活动索引，旧分支结束不截断新分支的进度曲线', () => {
    const original = new BuffProgressRecorder();
    const value = { instanceId: 7, remainingDuration: 4, isFinished: false };
    const buff = value as CombatBuff<string>;
    original.register('owner', buff, 'progress', { showProgressInHpBar: true }, 0);
    value.remainingDuration = 2;
    original.sample('owner', [buff], 60);
    const saved = structuredClone(original.runtimeState);
    const restored = new BuffProgressRecorder(structuredClone(saved));
    original.finish('owner', buff, 61);
    value.remainingDuration = 1;
    restored.sample('owner', [buff], 90);
    restored.finish('owner', buff, 120);
    expect(original.snapshot()[0]!.points).toEqual([
      { frame: 0, ratio: 1 },
      { frame: 60, ratio: 0.5 },
      { frame: 61, ratio: 0 },
    ]);
    expect(restored.snapshot()[0]!.points).toEqual([
      { frame: 0, ratio: 1 },
      { frame: 120, ratio: 0 },
    ]);
    expect(saved.runtimeCurveKeys.size).toBe(1);
    expect([...saved.curves.values()][0]!.points).toHaveLength(2);
    const ended = structuredClone(restored.runtimeState);
    const afterEnd = new BuffProgressRecorder(ended);
    afterEnd.sample('owner', [buff], 150);
    expect(afterEnd.snapshot()).toEqual(restored.snapshot());
    expect(ended.runtimeCurveKeys.size).toBe(0);
  });

  it('compresses linear samples while preserving a paused interval', () => {
    const recorder = new BuffProgressRecorder();
    const state = { instanceId: 7, remainingDuration: 1, isFinished: false };
    const buff = state as CombatBuff<string>;
    recorder.register(
      'operator:1',
      buff,
      'buff:progress',
      {
        showProgressInNormalSkillButton: true,
        useWeakProgressInNormalSkillButton: true,
      },
      0,
    );
    state.remainingDuration = 0.9;
    recorder.sample('operator:1', [buff], 1);
    state.remainingDuration = 0.8;
    recorder.sample('operator:1', [buff], 2);
    recorder.register(
      'operator:1',
      buff,
      'buff:progress',
      { showProgressInNormalSkillButton: true },
      2,
    );
    recorder.sample('operator:1', [buff], 3);
    state.remainingDuration = 0.7;
    recorder.sample('operator:1', [buff], 4);

    expect(recorder.snapshot()).toEqual([
      {
        targetId: 'operator:1',
        buffId: 'buff:progress',
        instanceId: 7,
        showInBattleSkillButton: true,
        showInUltimateButton: false,
        showInHpBar: false,
        weakBattleSkillStyle: true,
        points: [
          { frame: 0, ratio: 1 },
          { frame: 2, ratio: 0.8 },
          { frame: 3, ratio: 0.8 },
          { frame: 4, ratio: 0.7 },
        ],
      },
    ]);
  });

  it('records a zero endpoint when the runtime Buff finishes', () => {
    const recorder = new BuffProgressRecorder();
    const buff = {
      instanceId: 3,
      remainingDuration: 2,
      isFinished: false,
    } as CombatBuff<string>;
    recorder.register(
      'operator:1',
      buff,
      'buff:ultimate-progress',
      { showProgressInUltimateSkillButton: true },
      5,
    );
    recorder.finish('operator:1', buff, 65);
    expect(recorder.snapshot()[0]?.points).toEqual([
      { frame: 5, ratio: 1 },
      { frame: 65, ratio: 0 },
    ]);
  });

  it('records Buffs used only by the main-character HP bar progress', () => {
    const recorder = new BuffProgressRecorder();
    const buff = {
      instanceId: 9,
      remainingDuration: 3,
      isFinished: false,
    } as CombatBuff<string>;
    recorder.register('operator:2', buff, 'buff:hp-progress', { showProgressInHpBar: true }, 4);

    expect(recorder.snapshot()[0]).toMatchObject({
      targetId: 'operator:2',
      buffId: 'buff:hp-progress',
      showInBattleSkillButton: false,
      showInUltimateButton: false,
      showInHpBar: true,
      points: [{ frame: 4, ratio: 1 }],
    });
  });
});
