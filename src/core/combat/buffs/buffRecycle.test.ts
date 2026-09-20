import { describe, expect, it } from 'vitest';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer } from './combatBuffs';
import { BuffProgressRecorder } from './buffProgressRecorder';
import { AbilitySystemRuntime } from '../abilities/abilitySystemRuntime';
import { ActionBlackboard } from '../actions/actionBlackboard';

describe('Buff instance recycling', () => {
  it('宿主释放逐个回收，即便Buff不可结束，也不发布普通结束通知', () => {
    let finished = 0;
    const owner = new CombatBuffContainer<string>(
      'owner',
      new CombatAttributeSet<string>(),
      undefined,
      null,
      undefined,
      () => finished++,
    );
    const first = owner.add({ id: 'first', stackingType: 'unique' }, 'owner')!;
    const second = owner.add({ id: 'second', stackingType: 'unique' }, 'owner')!;
    first.setFinishable(false);
    const observed: string[] = [];
    first.onRecycled(() => {
      observed.push('first');
      expect(second.isRecycled).toBe(false);
      owner.releaseAll(); // 回调重入不重复清理正在退出的容器。
    });
    second.onRecycled(() => observed.push('second'));
    owner.releaseAll();
    expect(observed).toEqual(['first', 'second']);
    expect(owner.buffs).toHaveLength(0);
    expect(finished).toBe(0);
    owner.releaseAll();
    expect(observed).toEqual(['first', 'second']);
  });
  it('宿主自动回收先于动作容器，动作中新结束的实例留到下次宿主推进', () => {
    const owner = new CombatBuffContainer<string>('owner', new CombatAttributeSet<string>());
    const original = owner.add({ id: 'original', stackingType: 'unique' }, 'owner')!;
    original.finish('other');
    let created = original;
    const ability = new AbilitySystemRuntime({
      skills: [],
      buffRuntime: {
        advanceFrame: () => owner.tick(0),
        recycleFinishedBuffs: () => owner.recycleFinishedBuffs(),
      },
      actionRuntime: {
        advanceFrame: () => {
          expect(created.isRecycled).toBe(true);
          created = owner.add({ id: 'next', stackingType: 'unique' }, 'owner')!;
          created.finish('other');
        },
      },
    });
    ability.advanceFrame();
    const previous = created;
    expect(previous.isRecycled).toBe(false);
    ability.advanceFrame();
    expect(previous.isRecycled).toBe(true);
    expect(created.isRecycled).toBe(false);
  });
  it('退出容器不删除已经完成的进度历史', () => {
    const recorder = new BuffProgressRecorder();
    const owner = new CombatBuffContainer<string>(
      'owner',
      new CombatAttributeSet<string>(),
      undefined,
      null,
      undefined,
      buff => recorder.finish('owner', buff, 1),
    );
    const buff = owner.add({ id: 'history', stackingType: 'unique', durationSeconds: 2 }, 'owner')!;
    recorder.register('owner', buff, 'history', undefined, 0, true);
    buff.finish('other');
    const history = recorder.snapshot();
    owner.recycleFinishedBuffs();
    recorder.sample('owner', owner.buffs, 2);
    expect(owner.buffs).toHaveLength(0);
    expect(recorder.snapshot()).toEqual(history);
    expect(history).toHaveLength(1);
  });

  it('同一个函数的多次订阅可按句柄独立注销', () => {
    const owner = new CombatBuffContainer<never>('owner', new CombatAttributeSet<never>());
    const buff = owner.add({ id: 'callbacks', stackingType: 'unique' }, 'owner')!;
    const order: string[] = [];
    const repeated = () => order.push('repeated');
    buff.onRecycled(repeated);
    buff.onRecycled(() => order.push('middle'));
    buff.onRecycled(repeated).dispose();
    buff.finish('other');
    owner.recycleFinishedBuffs();
    expect(order).toEqual(['repeated', 'middle']);
  });

  it('复制后按原编号重绑回收回调且不触发旧分支', () => {
    const definition = { id: 'restored-callback', stackingType: 'unique' as const };
    const original = new CombatBuffContainer<never>('owner', new CombatAttributeSet<never>());
    const oldBuff = original.add(definition, 'owner')!;
    let oldCalls = 0;
    const registration = oldBuff.onRecycled(() => oldCalls++);
    oldBuff.finish('other');
    const saved = structuredClone(original.runtimeState);
    const restored = new CombatBuffContainer<never>(
      'owner',
      new CombatAttributeSet(saved.attributes),
      undefined,
      null,
      ActionBlackboard.bindRuntimeState(saved.entityBlackboard),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      saved,
    );
    restored.bindRestoredInstances(state =>
      state.identity.definitionId === definition.id ? definition : undefined,
    );
    const newBuff = restored.getInstance(oldBuff.instanceId)!;
    let newCalls = 0;
    newBuff.bindRecycledCallback(registration.registrationId, () => newCalls++);

    restored.recycleFinishedBuffs();
    expect(newCalls).toBe(1);
    expect(oldCalls).toBe(0);
    original.recycleFinishedBuffs();
    expect(oldCalls).toBe(1);
  });

  it('结束和tick不回收；独立回收幂等且不重复结束', () => {
    let finishes = 0;
    const owner = new CombatBuffContainer<never>(
      'owner',
      new CombatAttributeSet<never>(),
      undefined,
      null,
      undefined,
      () => finishes++,
    );
    const definition = { id: 'buff', stackingType: 'unique' as const };
    const buff = owner.add(definition, 'owner')!;
    let calls = 0;
    buff.onRecycled(instance => {
      expect(instance).toBe(buff);
      expect(owner.buffs).not.toContain(buff);
      calls++;
    });
    const removed = buff.onRecycled(() => {
      throw new Error('disposed callback');
    });
    removed.dispose();
    removed.dispose();
    buff.finish('early');
    owner.tick(1);
    expect(buff.isRecycled).toBe(false);
    expect(calls).toBe(0);
    owner.recycleFinishedBuffs();
    owner.recycleFinishedBuffs();
    expect(calls).toBe(1);
    expect(finishes).toBe(1);
    expect(buff.finishReason).toBe('early');
    expect(owner.add(definition, 'owner')).not.toBe(buff);
  });

  it.each([true, false])('回调改变未访问实例的本轮资格 earlier=%s', earlier => {
    const owner = new CombatBuffContainer<never>('owner', new CombatAttributeSet<never>());
    const first = owner.add({ id: 'first', stackingType: 'unique' }, 'owner')!;
    const second = owner.add({ id: 'second', stackingType: 'unique' }, 'owner')!;
    const trigger = earlier ? second : first;
    const target = earlier ? first : second;
    trigger.onRecycled(() => target.finish('other'));
    trigger.finish('other');
    owner.recycleFinishedBuffs();
    expect(trigger.isRecycled).toBe(true);
    expect(target.isFinished).toBe(true);
    expect(target.isRecycled).toBe(earlier);
    owner.recycleFinishedBuffs();
    expect(target.isRecycled).toBe(true);
  });
});
