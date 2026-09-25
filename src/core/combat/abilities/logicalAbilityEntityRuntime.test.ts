import { createTestBuffReference } from '../buffs/buffTestFixtures';
import { describe, expect, it, vi } from 'vitest';
import { LogicalAbilityEntityRuntime } from './logicalAbilityEntityRuntime';
import { logicalAbilityEntityRuntimeId } from '../../game-data/logicalAbilityEntity';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { StateStepper } from '../runtime/stateStepper';
import {
  killLogicalAbilityEntity,
  advanceAbilityEntityRelease,
  advanceAbilityEntityLifetime,
} from './logicalAbilityEntityExecution';

function createRuntime() {
  return new LogicalAbilityEntityRuntime({
    resolveDeltaSeconds: () => 0.25,
  });
}

describe('LogicalAbilityEntityRuntime', () => {
  it('同一实体重复请求同一技能时复用宿主，每帧只推进一次', () => {
    const runtime = createRuntime();
    const entity = runtime.spawn({
      abilityEntityId: 'test',
      ownerId: 'owner',
      source: { kind: 'enemy' },
      definition: { lifetime: { kind: 'infinite' } },
    });
    const child = { skillId: 'child', start: vi.fn(), advance: vi.fn(), finish: vi.fn() };
    const createChild = vi.fn(() => child);
    runtime.startChildSkill(entity, 'child', createChild);
    runtime.startChildSkill(entity, 'child', createChild);
    expect(createChild).toHaveBeenCalledOnce();
    expect(child.start).toHaveBeenCalledTimes(2);
    runtime.advanceFrame();
    expect(child.advance).toHaveBeenCalledOnce();
    runtime.finish(entity);
    expect(child.finish).toHaveBeenCalledOnce();
  });

  it('每帧时间倍率和 Buff 阶段不复制完整实体黑板', () => {
    const runtime = new LogicalAbilityEntityRuntime({
      resolveDeltaSeconds: () => 0.1,
      hooks: { tickBuffs: () => {}, recycleBuffs: () => {} },
    });
    runtime.spawn({
      abilityEntityId: 'test',
      ownerId: 'owner',
      source: { kind: 'enemy' },
      definition: { lifetime: { kind: 'infinite' }, blackboard: { value: 1 } },
    });
    const snapshot = vi.spyOn(ActionBlackboard.prototype, 'snapshot');
    runtime.advanceFrame();
    expect(snapshot).not.toHaveBeenCalled();
    snapshot.mockRestore();
  });

  it('关系恢复失败时不提交半批结果，可以修正解析器后重试', () => {
    const original = createRuntime();
    const first = original.spawn({
      abilityEntityId: 'first',
      ownerId: 'owner',
      source: { kind: 'enemy' },
      definition: { lifetime: { kind: 'infinite' } },
    });
    const second = original.spawn({
      abilityEntityId: 'second',
      ownerId: 'owner',
      source: { kind: 'enemy' },
      definition: { lifetime: { kind: 'infinite' } },
    });
    original.addChildBuff(first, {
      isRecycled: false,
      reference: { ownerId: 'first', instanceId: 1 },
      finish: () => true,
    });
    original.addChildBuff(second, {
      isRecycled: false,
      reference: { ownerId: 'second', instanceId: 2 },
      finish: () => true,
    });
    const restored = new LogicalAbilityEntityRuntime({
      restoredState: structuredClone(original.runtimeState),
    });
    expect(() =>
      restored.bindRestoredRelations({
        resolveChildBuff: reference => {
          if (reference.ownerId === 'second') throw new Error('missing second child');
          return { isRecycled: false, reference, finish: () => true };
        },
      }),
    ).toThrow('missing second child');

    const firstFinish = vi.fn(() => true);
    const secondFinish = vi.fn(() => true);
    restored.bindRestoredRelations({
      resolveChildBuff: reference => ({
        isRecycled: false,
        reference,
        finish: reference.ownerId === 'first' ? firstFinish : secondFinish,
      }),
    });
    restored.finish(first);
    restored.finish(second);
    expect(firstFinish).toHaveBeenCalledOnce();
    expect(secondFinish).toHaveBeenCalledOnce();
  });

  it('从目录数据恢复实体时不重放生成，并在关系阶段接回子Buff和reset回调', () => {
    const original = createRuntime();
    const entity = original.spawn({
      abilityEntityId: 'restored',
      ownerId: 'owner',
      source: { kind: 'operator', operatorId: 'owner' },
      definition: { lifetime: { kind: 'limited', durationSeconds: 1 } },
      blackboardAssignments: { damage: 12 },
    });
    original.timedMarkers(entity).add('window', 0.5);
    const childReference = createTestBuffReference();
    original.addChildBuff(entity, {
      isRecycled: false,
      reference: childReference,
      finish: () => true,
    });
    const reset = original.onReset(entity, () => {});
    original.advanceFrame();
    const saved = structuredClone(original.runtimeState);

    const spawned = vi.fn();
    const markerFinished = vi.fn();
    const childFinish = vi.fn(() => true);
    const restored = new LogicalAbilityEntityRuntime({
      restoredState: structuredClone(saved),
      resolveDeltaSeconds: () => 0.25,
      hooks: { spawned, timedMarkerFinished: markerFinished },
    });
    expect(spawned).not.toHaveBeenCalled();
    expect(restored.entityBlackboard(entity).getNumber('damage')).toBe(12);
    expect(restored.timedMarkers(entity).has('window')).toBe(true);
    if (entity.kind !== 'abilityEntity') throw new Error('expected an ability entity');
    expect(restored.timedMarkers(entity).ownerId).toBe(
      logicalAbilityEntityRuntimeId(entity.instanceId),
    );
    expect(restored.timedMarkers(entity).runtimeState.entries[0]!.ownerId).toBe(
      logicalAbilityEntityRuntimeId(entity.instanceId),
    );
    restored.bindRestoredRelations({
      resolveChildBuff: reference => {
        expect(reference).toEqual(childReference);
        return { isRecycled: false, reference, finish: childFinish };
      },
    });
    const restoredReset = vi.fn();
    restored.bindResetCallback(entity, reset.registrationId, restoredReset);

    restored.advanceFrame();
    expect(markerFinished).not.toHaveBeenCalled();
    restored.advanceFrame();
    expect(markerFinished).toHaveBeenCalledOnce();
    restored.advanceFrame();
    expect(restored.isActive(entity)).toBe(false);
    expect(childFinish).toHaveBeenCalledExactlyOnceWith('other', null);
    expect(restoredReset).toHaveBeenCalledOnce();
    expect(original.isActive(entity)).toBe(true);
  });

  it('子Buff身份和reset登记可复制，通知中注销不改变本轮回调快照', () => {
    const runtime = createRuntime();
    const entity = runtime.spawn({
      abilityEntityId: 'entity',
      ownerId: 'owner',
      source: { kind: 'enemy' },
      definition: { lifetime: { kind: 'infinite' } },
    });
    const reference = createTestBuffReference();
    runtime.addChildBuff(entity, { isRecycled: false, reference, finish: () => true });
    const calls: string[] = [];
    runtime.onReset(entity, () => {
      calls.push('first');
      second.dispose();
    });
    const second = runtime.onReset(entity, () => calls.push('second'));
    const session = new StateStepper(runtime.runtimeState, () => undefined);
    const saved = session.read();
    const state = [...saved.instances.values()][0]!;
    expect(state.childBuffs).toEqual([reference]);
    expect(state.resetCallbackIds).toEqual([0, 1]);
    expect(state.nextResetCallbackId).toBe(2);
    runtime.finish(entity);
    expect(calls).toEqual(['first', 'second']);
    expect(state.resetCallbackIds).toEqual([0, 1]);
  });

  it('同一切面可以继续寿命或进入延迟回收，两条分支独立计时', () => {
    const runtime = createRuntime();
    runtime.spawn({
      abilityEntityId: 'entity',
      ownerId: 'owner',
      source: { kind: 'enemy' },
      definition: {
        lifetime: { kind: 'limited', durationSeconds: 1 },
        deathReleaseDelaySeconds: 0.5,
      },
    });
    const state = [...runtime.runtimeState.instances.values()][0]!;
    const session = new StateStepper(state, (step, kill: boolean) => {
      if (kill) {
        expect(killLogicalAbilityEntity(step.state, 'explicit')).toBe(true);
        expect(killLogicalAbilityEntity(step.state, 'sourceDied')).toBe(false);
        return [
          advanceAbilityEntityRelease(step.state, 0.25),
          advanceAbilityEntityRelease(step.state, 0.25),
        ];
      }
      const sweep = () => expect(step.state.elapsedDurationSeconds).toBeGreaterThan(0);
      return [
        advanceAbilityEntityLifetime(step.state, 0.5, sweep),
        advanceAbilityEntityLifetime(step.state, 0.5, sweep),
      ];
    });
    const saved = session.save();
    expect(session.step(false)).toEqual([false, true]);
    expect(session.read().remainingDurationSeconds).toBe(0);
    session.restore(saved);
    expect(session.step(true)).toEqual([false, true]);
    expect(session.read().remainingDurationSeconds).toBe(1);
    expect(session.read().pendingReleaseReason).toBe('explicit');
    expect(state.isAlive).toBe(true);
    expect(state.elapsedDurationSeconds).toBe(0);
  });

  it('目录复制包含待回收状态、死亡来源和共享黑板，原实例释放不清理副本', () => {
    const runtime = createRuntime();
    const source = { kind: 'operator' as const, operatorId: 'owner' };
    const entity = runtime.spawn({
      abilityEntityId: 'entity',
      ownerId: 'owner',
      source,
      dieWhenSourceDies: true,
      definition: {
        lifetime: { kind: 'limited', durationSeconds: 2 },
        deathReleaseDelaySeconds: 0.5,
      },
    });
    runtime.advanceFrame();
    runtime.notifySourceDied(source);
    const blackboard = runtime.entityBlackboard(entity);
    const session = new StateStepper(
      { directory: runtime.runtimeState, blackboard: blackboard.runtimeState },
      () => undefined,
    );
    const copied = session.read();
    const instance = [...copied.directory.instances.values()][0]!;
    expect(instance.blackboard).toBe(copied.blackboard);
    expect(instance.remainingDurationSeconds).toBe(1.75);
    expect(instance.pendingRelease).toBe(true);
    expect(instance.isAlive).toBe(false);
    expect(instance.pendingReleaseReason).toBe('sourceDied');
    expect(copied.directory.deadSources).toEqual([source]);
    runtime.advanceFrame();
    runtime.advanceFrame();
    expect(runtime.runtimeState.instances.size).toBe(0);
    expect(copied.directory.instances.size).toBe(1);
    expect(instance.pendingReleaseElapsedSeconds).toBe(0);
  });

  it('用生成动作赋值覆盖实体模板黑板，并保留未覆盖默认值', () => {
    const runtime = createRuntime();
    const entity = runtime.spawn({
      abilityEntityId: 'entity',
      ownerId: 'owner',
      source: { kind: 'operator', operatorId: 'owner' },
      definition: {
        lifetime: { kind: 'infinite' },
        blackboard: { EntityBB_damage: 0, EntityBB_label: 'bat' },
      },
      blackboardAssignments: { EntityBB_damage: 5.5 },
    });
    expect(runtime.entityBlackboard(entity).snapshot()).toEqual({
      EntityBB_damage: 5.5,
      EntityBB_label: 'bat',
    });
  });

  it('所有权子Buff以空来源结束，包括清理中追加的子Buff，并先于reset通知', () => {
    const order: string[] = [];
    const runtime = createRuntime();
    const entity = runtime.spawn({
      abilityEntityId: 'entity',
      ownerId: 'owner',
      source: { kind: 'operator', operatorId: 'owner' },
      definition: { lifetime: { kind: 'infinite' } },
    });
    const lateFinish = vi.fn(() => {
      order.push('late');
      return true;
    });
    const firstFinish = vi.fn(() => {
      order.push('first');
      runtime.addChildBuff(entity, {
        isRecycled: false,
        reference: createTestBuffReference(),
        finish: lateFinish,
      });
      return true;
    });
    runtime.addChildBuff(entity, {
      isRecycled: false,
      reference: createTestBuffReference(),
      finish: firstFinish,
    });
    runtime.onReset(entity, () => order.push('reset'));
    runtime.finish(entity);
    expect(firstFinish).toHaveBeenCalledExactlyOnceWith('other', null);
    expect(lateFinish).toHaveBeenCalledExactlyOnceWith('other', null);
    expect(order).toEqual(['first', 'late', 'reset']);
  });
  it('reset订阅在子技能和宿主清理后执行，重复函数按句柄独立注销', () => {
    const observed: string[] = [];
    const runtime = new LogicalAbilityEntityRuntime({
      resolveDeltaSeconds: () => 0.1,
      hooks: { finished: () => observed.push('owner-cleanup') },
    });
    const entity = runtime.spawn({
      abilityEntityId: 'entity',
      ownerId: 'owner',
      source: { kind: 'operator', operatorId: 'owner' },
      definition: { lifetime: { kind: 'infinite' } },
      createChildRuntime: () => ({
        start: () => {},
        advance: () => {},
        finish: () => observed.push('skill-cleanup'),
      }),
    });
    const callback = () => {
      expect(runtime.isActive(entity)).toBe(false);
      observed.push('reset');
    };
    runtime.onReset(entity, callback).dispose();
    runtime.onReset(entity, callback);
    runtime.finish(entity);
    expect(observed).toEqual(['skill-cleanup', 'owner-cleanup', 'reset']);
  });
  it('前一个宿主回调释放后一个实体后，快照不再推进已释放实体', () => {
    const observed: string[] = [];
    let releaseNext = () => {};
    const runtime = new LogicalAbilityEntityRuntime({
      resolveDeltaSeconds: () => 0.1,
      hooks: {
        tickBuffs: entity => {
          observed.push(entity.abilityEntityId);
          if (entity.abilityEntityId === 'first') releaseNext();
        },
      },
    });
    for (const id of ['first', 'second']) {
      const target = runtime.spawn({
        abilityEntityId: id,
        ownerId: 'owner',
        source: { kind: 'operator', operatorId: 'owner' },
        definition: { lifetime: { kind: 'infinite' } },
      });
      if (id === 'second')
        releaseNext = () => {
          runtime.finish(target, 'explicit');
        };
    }
    runtime.advanceFrame();
    expect(observed).toEqual(['first']);
  });
  it('更新中生成的实体立即start，但Buff和技能的时间增量均从下一轮开始', () => {
    const observed: string[] = [];
    let spawned = false;
    const runtime = new LogicalAbilityEntityRuntime({
      resolveDeltaSeconds: () => 0.1,
      hooks: {
        tickBuffs: entity => observed.push(`${entity.abilityEntityId}:buff`),
        recycleBuffs: entity => observed.push(`${entity.abilityEntityId}:recycle`),
      },
    });
    runtime.spawn({
      abilityEntityId: 'parent',
      ownerId: 'owner',
      source: { kind: 'operator', operatorId: 'owner' },
      definition: { lifetime: { kind: 'infinite' } },
      createChildRuntime: () => ({
        start: () => {},
        finish: () => {},
        advance: () => {
          if (spawned) return;
          spawned = true;
          runtime.spawn({
            abilityEntityId: 'child',
            ownerId: 'owner',
            source: { kind: 'operator', operatorId: 'owner' },
            definition: { lifetime: { kind: 'infinite' } },
            createChildRuntime: () => ({
              start: () => observed.push('child:start'),
              finish: () => {},
              advance: () => observed.push('child:skill'),
            }),
          });
        },
      }),
    });
    runtime.advanceFrame();
    expect(observed).toEqual(['parent:buff', 'child:start', 'parent:recycle']);
    observed.length = 0;
    runtime.advanceFrame();
    expect(observed).toEqual([
      'parent:buff',
      'parent:recycle',
      'child:buff',
      'child:skill',
      'child:recycle',
    ]);
  });
  it('每个实体依次推进Buff、技能和回收，不跨实体批处理', () => {
    const observed: string[] = [];
    const runtime = new LogicalAbilityEntityRuntime({
      resolveDeltaSeconds: () => 0.1,
      hooks: {
        tickBuffs: entity => observed.push(`${entity.abilityEntityId}:buff`),
        recycleBuffs: entity => observed.push(`${entity.abilityEntityId}:recycle`),
      },
    });
    for (const id of ['first', 'second'])
      runtime.spawn({
        abilityEntityId: id,
        ownerId: 'owner',
        source: { kind: 'operator', operatorId: 'owner' },
        definition: { lifetime: { kind: 'infinite' } },
        createChildRuntime: () => ({
          start: () => {},
          finish: () => {},
          advance: () => observed.push(`${id}:skill`),
        }),
      });
    runtime.advanceFrame();
    expect(observed).toEqual([
      'first:buff',
      'first:skill',
      'first:recycle',
      'second:buff',
      'second:skill',
      'second:recycle',
    ]);
  });

  it('Buff更新结束实体后不再执行其技能或普通回收阶段', () => {
    const skill = vi.fn();
    const recycle = vi.fn();
    const runtime = new LogicalAbilityEntityRuntime({
      resolveDeltaSeconds: () => 0.1,
      hooks: {
        tickBuffs: entity =>
          runtime.finish({ kind: 'abilityEntity', instanceId: entity.instanceId }, 'explicit'),
        recycleBuffs: recycle,
      },
    });
    runtime.spawn({
      abilityEntityId: 'test',
      ownerId: 'owner',
      source: { kind: 'operator', operatorId: 'owner' },
      definition: { lifetime: { kind: 'infinite' } },
      createChildRuntime: () => ({ start: () => {}, finish: () => {}, advance: skill }),
    });
    runtime.advanceFrame();
    expect(skill).not.toHaveBeenCalled();
    expect(recycle).not.toHaveBeenCalled();
  });
  it.each(['explicit', 'durationExpired'] as const)(
    '出生及 %s 结束保留同一份完整来源，出生先于子技能',
    reason => {
      const observed: string[] = [];
      const skillCastInfo = {
        skillCastId: 42,
        originSkillId: 'origin',
        originSkillType: 'comboSkill' as const,
        nonReturnedSpCost: 17,
      };
      const runtime = new LogicalAbilityEntityRuntime({
        resolveDeltaSeconds: () => 1,
        hooks: {
          spawned: snapshot => {
            expect(snapshot.skillCastInfo).toBe(skillCastInfo);
            observed.push('spawned');
          },
          finished: snapshot => {
            expect(snapshot.skillCastInfo).toBe(skillCastInfo);
            observed.push('finished');
          },
        },
      });
      const entity = runtime.spawn({
        abilityEntityId: 'test',
        definition: { lifetime: { kind: 'limited', durationSeconds: 1 } },
        ownerId: 'owner',
        source: { kind: 'operator', operatorId: 'owner' },
        skillCastInfo,
        createChildRuntime: () => ({
          start: () => {
            observed.push('child');
          },
          advance: () => {},
          finish: () => {},
        }),
      });
      if (reason === 'explicit') runtime.finish(entity, reason);
      else {
        runtime.advanceFrame();
        runtime.advanceFrame();
      }
      expect(observed).toEqual(['spawned', 'child', 'finished']);
    },
  );
  it('uses one instance set for zero-space range and owner/entity-id lookup', () => {
    const runtime = createRuntime();
    const a = runtime.spawn({
      abilityEntityId: 'water',
      definition: { lifetime: { kind: 'limited', durationSeconds: 1 } },
      ownerId: 'a',
      source: { kind: 'operator', operatorId: 'a' },
    });
    runtime.spawn({
      abilityEntityId: 'sword',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'a',
      source: { kind: 'operator', operatorId: 'a' },
    });
    runtime.spawn({
      abilityEntityId: 'water',
      definition: { lifetime: { kind: 'limited', durationSeconds: 1 } },
      ownerId: 'b',
      source: { kind: 'operator', operatorId: 'b' },
    });

    expect(runtime.findAll()).toHaveLength(3);
    expect(
      runtime.findOwnerSpawned({
        ownerId: 'a',
        abilityEntityIds: ['water'],
      }),
    ).toEqual([a]);
  });

  it('keeps per-instance duration, target and entity blackboard state', () => {
    const runtime = createRuntime();
    const entity = runtime.spawn({
      abilityEntityId: 'water',
      definition: { lifetime: { kind: 'limited', durationSeconds: 1 } },
      ownerId: 'a',
      source: { kind: 'operator', operatorId: 'a' },
      target: { kind: 'enemy' },
      overrideDurationSeconds: 0.5,
      blackboardAssignments: { EntityBB_power: 3 },
    });
    runtime.setRemainingDuration(entity, 0.75);
    runtime.setTarget(entity, { kind: 'operator', operatorId: 'b' });
    runtime.advanceFrame();

    expect(runtime.snapshot(entity)).toMatchObject({
      target: { kind: 'operator', operatorId: 'b' },
      remainingDurationSeconds: 0.5,
      elapsedDurationSeconds: 0.25,
      blackboard: { EntityBB_power: 3 },
    });
  });

  it('filters owner-spawned entities by their source skill-cast identity', () => {
    const runtime = createRuntime();
    const first = runtime.spawn({
      abilityEntityId: 'seal',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'arcane',
      source: { kind: 'operator', operatorId: 'arcane' },
      sourceSkillCastId: 17,
    });
    runtime.spawn({
      abilityEntityId: 'seal',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'arcane',
      source: { kind: 'operator', operatorId: 'arcane' },
      sourceSkillCastId: 18,
    });

    expect(
      runtime.findOwnerSpawned({
        ownerId: 'arcane',
        abilityEntityIds: ['seal'],
        sourceSkillCastId: 17,
      }),
    ).toEqual([first]);
  });

  it('expires limited instances while infinite instances remain active', () => {
    const finished = vi.fn();
    const runtime = new LogicalAbilityEntityRuntime({
      resolveDeltaSeconds: () => 0.25,
      hooks: { finished },
    });
    runtime.spawn({
      abilityEntityId: 'short',
      definition: { lifetime: { kind: 'limited', durationSeconds: 0.5 } },
      ownerId: 'a',
      source: { kind: 'operator', operatorId: 'a' },
    });
    runtime.spawn({
      abilityEntityId: 'forever',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'a',
      source: { kind: 'operator', operatorId: 'a' },
    });

    runtime.advanceFrame();
    runtime.advanceFrame();

    expect(runtime.activeCount).toBe(1);
    expect(finished).toHaveBeenCalledWith(expect.any(Object), 'durationExpired');
  });

  it('requests the child skill once and honors source-death ownership', () => {
    const childSkillRequested = vi.fn();
    const runtime = new LogicalAbilityEntityRuntime({
      hooks: { childSkillRequested },
    });
    const entity = runtime.spawn({
      abilityEntityId: 'child',
      definition: {
        lifetime: { kind: 'infinite' },
        childSkill: { skillId: 'child_skill' },
      },
      ownerId: 'a',
      source: { kind: 'operator', operatorId: 'a' },
      dieWhenSourceDies: true,
    });

    expect(childSkillRequested).toHaveBeenCalledTimes(1);
    expect(runtime.isActive(entity)).toBe(true);
    expect(runtime.notifySourceDied({ kind: 'operator', operatorId: 'a' })).toBe(1);
    expect(runtime.isActive(entity)).toBe(true);
    expect(runtime.snapshot(entity).isAlive).toBe(false);
    expect(runtime.findOwnerSpawned({ ownerId: 'a' })).toEqual([entity]);
    expect(runtime.notifySourceDied({ kind: 'operator', operatorId: 'a' })).toBe(0);
    runtime.advanceFrame();
    expect(runtime.isActive(entity)).toBe(false);
    expect(runtime.activeCount).toBe(0);
  });

  it('keeps a killed entity discoverable until its native controller recycle delay elapses', () => {
    const runtime = createRuntime();
    const entity = runtime.spawn({
      abilityEntityId: 'delayed-release',
      definition: {
        lifetime: { kind: 'infinite' },
        deathReleaseDelaySeconds: 0.5,
      },
      ownerId: 'a',
      source: { kind: 'operator', operatorId: 'a' },
    });

    runtime.kill(entity);
    runtime.advanceFrame();
    expect(runtime.findOwnerSpawned({ ownerId: 'a' })).toEqual([entity]);
    expect(runtime.snapshot(entity).isAlive).toBe(false);
    runtime.advanceFrame();
    expect(runtime.findOwnerSpawned({ ownerId: 'a' })).toEqual([]);
  });
});
