import { describe, expect, it } from 'vitest';
import { tickChanneling } from './channelingActionExecution';
import { createChannelingActionState } from '../state/actionState';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';

describe('Channeling 部位计数', () => {
  it('部位退场后主体不能重获次数，执行仍绑定部位，其他敌人独立计数', () => {
    const state = createChannelingActionState();
    const body: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:body' };
    const other: RuntimeTargetRef = { kind: 'enemy', enemyId: 'enemy:other' };
    const part: RuntimeTargetRef = { kind: 'abilityEntity', instanceId: 1 };
    const parameters = {
      target: { kind: 'inputTarget' as const },
      executeEachFrame: true,
      catchUpMissedTicks: false,
      triggerIntervalSeconds: 0,
      targetTriggerIntervalSeconds: 0,
      maxCountPerTarget: 1,
    };
    const hits: RuntimeTargetRef[] = [];
    const countTarget = (target: RuntimeTargetRef) =>
      target.kind === 'abilityEntity' ? body : target;
    tickChanneling(
      state,
      parameters,
      0,
      0,
      () => [part],
      target => hits.push(target),
      countTarget,
    );
    const restored = structuredClone(state);
    tickChanneling(
      restored,
      parameters,
      1,
      1 / 30,
      () => [body, other],
      target => hits.push(target),
      countTarget,
    );
    expect(hits).toEqual([part, other]);
  });
});
