import { createTestBuffReference } from '../buffs/buffTestFixtures';
import { describe, expect, it, vi } from 'vitest';
import { AbilitySystemRuntime, type AbilitySkillRuntime } from './abilitySystemRuntime';
import { StateStepper } from '../runtime/stateStepper';
import {
  storePostSkillCastRequest,
  takePostSkillCastRequest,
  takeBeforeSkillCastPreparation,
} from './abilitySystemExecution';
import type { RuntimeSkillInterruptReason, RuntimeSkillTransition } from '../skills/skillRuntime';
import type { RuntimeSkillState } from '../state/abilityState';

class FixtureRuntime implements AbilitySkillRuntime {
  state: RuntimeSkillState = 'ready';
  lastTransition: RuntimeSkillTransition | undefined;
  readonly inheritedBuffs: unknown[] = [];

  constructor(
    readonly skillId: string,
    readonly events: string[],
    readonly skillType: AbilitySkillRuntime['skillType'] = 'battleSkill',
    readonly castId?: string,
    readonly timelineBlockFrames?: number,
  ) {}

  canStart(): boolean {
    return this.state !== 'casting';
  }

  tryStart(): boolean {
    this.events.push(`start:${this.skillId}`);
    this.state = 'casting';
    return true;
  }

  interrupt(reason: RuntimeSkillInterruptReason, transition?: RuntimeSkillTransition): void {
    this.lastTransition = transition;
    this.events.push(`interrupt:${this.skillId}:${reason}`);
    this.state = 'ended';
  }

  attachInheritedBuff(buff: never): void {
    this.inheritedBuffs.push(buff);
  }

  advanceFrame(): void {
    this.events.push(`tick:${this.skillId}`);
  }
}

const beforeCastPayload = { sourceId: 'owner', targetId: 'owner', skillId: 'test', skillCastId: 1 };

describe('AbilitySystemRuntime', () => {
  it('恢复运行中修改的原生技能类型，同时保留定义一致性检查', () => {
    const original = new AbilitySystemRuntime({
      skills: [new FixtureRuntime('skill', [], 'ultimate')],
    });
    original.changeNativeSkillType('skill', 'attachSkill');
    const saved = structuredClone(original.runtimeState);
    const restored = new AbilitySystemRuntime(
      { skills: [new FixtureRuntime('skill', [], 'ultimate')] },
      saved,
    );
    expect(restored.nativeSkillTypeForSkill('skill')).toBe('attachSkill');
    original.changeNativeSkillType('skill', 'normalSkill');
    expect(restored.nativeSkillTypeForSkill('skill')).toBe('attachSkill');
    expect(
      () =>
        new AbilitySystemRuntime(
          {
            skills: [
              new FixtureRuntime('skill', [], 'ultimate'),
              new FixtureRuntime('skill', [], 'battleSkill', 'cast'),
            ],
          },
          structuredClone(saved),
        ),
    ).toThrow('inconsistent native SkillType');
    saved.nativeSkillTypeBySkillId.clear();
    expect(
      () =>
        new AbilitySystemRuntime({ skills: [new FixtureRuntime('skill', [], 'ultimate')] }, saved),
    ).toThrow('has no native type');
  });

  it('恢复当前技能、替换槽和活动模式，不套用构造默认值或调用旧技能绑定', () => {
    const definition = {
      skillSlotGroups: [
        { skillGroupKey: 'battle', baseSkillKey: 'base', replacementSkillKeys: ['enhanced'] },
      ],
      playerActionModes: [
        { modeId: 'default', modeLayer: 'mode', defaultEnabled: true, commandMappings: {} },
        { modeId: 'changed', modeLayer: 'mode', defaultEnabled: false, commandMappings: {} },
      ],
    };
    const oldEvents: string[] = [];
    const original = new AbilitySystemRuntime({
      ...definition,
      skills: [new FixtureRuntime('base', oldEvents), new FixtureRuntime('enhanced', oldEvents)],
    });
    original.tryStartSkill('base');
    original.changeSkillSlot('battle', 'enhanced');
    const mode = original.activatePlayerActionMode('changed');
    const saved = structuredClone(original.runtimeState);
    const beforeBinding = structuredClone(saved);
    const events: string[] = [];
    const base = new FixtureRuntime('base', events);
    base.state = 'casting'; // 技能宿主由调用方先恢复，本例单独验证能力系统绑定。
    const restored = new AbilitySystemRuntime(
      { ...definition, skills: [base, new FixtureRuntime('enhanced', events)] },
      saved,
    );
    expect(saved).toEqual(beforeBinding);
    expect(restored.currentSkillId).toBe('base');
    expect(events).toEqual([]);
    mode.finish();
    expect(saved.activePlayerActionModeByLayer.get('mode')).toBe('changed');
    expect(saved.playerActionModeActivations.has(mode.registrationId)).toBe(true);
    expect(original.runtimeState.playerActionModeActivations.size).toBe(0);
    const reboundMode = restored.bindPlayerActionModeActivation(mode.registrationId);
    expect(saved.nextPlayerActionModeActivationId).toBe(1);
    reboundMode.finish();
    reboundMode.finish();
    expect(saved.activePlayerActionModeByLayer.get('mode')).toBe('default');
    expect(saved.playerActionModeActivations.size).toBe(0);
    expect(() => restored.bindPlayerActionModeActivation(mode.registrationId)).toThrow(
      'is missing',
    );
    expect(saved.skillSlotGroups.get('battle')!.currentSkillKey).toBe('enhanced');
    oldEvents.length = 0;
    restored.advanceFrame();
    expect(events).toContain('tick:base');
    expect(oldEvents).toEqual([]);
    expect(
      () => new AbilitySystemRuntime({ ...definition, skills: [] }, structuredClone(saved)),
    ).toThrow('missing ability skill binding');
  });

  it('提交施放实例后才加入推进列表，同技能冷却仍只推进一次', () => {
    const calls: string[] = [];
    const definition = new FixtureRuntime('skill', calls);
    const cooldown = vi.fn();
    const ability = new AbilitySystemRuntime({
      skills: [definition],
      skillTickPlan: [{ skillId: 'skill', advanceCooldown: cooldown }],
    });
    ability.advanceFrame();
    expect(calls).toEqual(['tick:skill']);
    const cast = new FixtureRuntime('skill', calls, 'battleSkill', 'cast-1');
    ability.registerCastInstance(cast);
    expect(ability.tryStartSkill('skill', 'cast-1')).toBe(true);
    calls.length = 0;
    cooldown.mockClear();
    ability.advanceFrame();
    expect(calls).toEqual(['tick:skill', 'tick:skill']);
    expect(cooldown).toHaveBeenCalledTimes(1);
    expect(() => ability.registerCastInstance(cast)).toThrow('duplicate');
  });

  it('拒绝不匹配定义的实例后不会留下半注册记录', () => {
    const calls: string[] = [];
    const ability = new AbilitySystemRuntime({ skills: [new FixtureRuntime('skill', calls)] });
    expect(() =>
      ability.registerCastInstance(new FixtureRuntime('skill', calls, 'ultimate', 'cast')),
    ).toThrow('disagrees');
    expect(() =>
      ability.registerCastInstance(new FixtureRuntime('unknown', calls, 'battleSkill', 'cast')),
    ).toThrow('no registered definition');
    ability.registerCastInstance(new FixtureRuntime('skill', calls, 'battleSkill', 'cast'));
    expect(ability.tryStartSkill('skill', 'cast')).toBe(true);
  });

  it('施放前准备保存数据，恢复后可以再次消费同一准备而不持有旧回调', () => {
    const ability = new AbilitySystemRuntime({ skills: [new FixtureRuntime('skill', [])] });
    const payload = { ...beforeCastPayload, skillCastId: 42 };
    ability.prepareBeforeSkillCastStart('skill', undefined, payload);
    payload.skillCastId = 99;
    const session = new StateStepper(ability.runtimeState, (step, _: undefined) =>
      takeBeforeSkillCastPreparation(step.state, 'skill\u0000'),
    );
    const saved = session.save();
    expect(session.step(undefined)?.payload.skillCastId).toBe(42);
    expect(session.step(undefined)).toBeUndefined();
    session.restore(saved);
    expect(session.step(undefined)?.payload.skillCastId).toBe(42);
    expect(ability.runtimeState.beforeCastStarts.size).toBe(1);
  });

  it('正式能力系统把已启动技能的边界跟踪纳入同一数据根', () => {
    const ability = new AbilitySystemRuntime({
      skills: [new FixtureRuntime('skill', [], 'battleSkill', 'cast', 3)],
      resolveActualFrame: () => 0,
      onSkillOperableBoundaryReached: () => {},
    });
    ability.tryStartSkill('skill', 'cast');
    const session = new StateStepper(ability.runtimeState, () => undefined);
    const state = session.read();
    expect(state.currentSkillKey).toBe('skill\u0000cast');
    expect(state.operableBoundaries.pendingByCastId.get('cast')).toEqual({
      castId: 'cast',
      durationFrames: 3,
      actualStartFrame: 0,
      accumulatedFrames: 0,
    });
    expect(state.operableBoundaries.registeredCastIds.has('cast')).toBe(true);
  });

  it('保存当前技能身份和延迟请求，恢复后替换请求不污染另一分支', () => {
    const ability = new AbilitySystemRuntime({
      skills: [new FixtureRuntime('first', []), new FixtureRuntime('second', [])],
    });
    ability.tryStartSkill('first');
    ability.requestPostSkillCast({ skillId: 'second' });
    const session = new StateStepper(ability.runtimeState, (step, replace: boolean) => {
      if (replace) storePostSkillCastRequest(step.state, { skillId: 'first' });
      const request = takePostSkillCastRequest(step.state);
      storePostSkillCastRequest(step.state, { skillId: 'second', skipApplyCost: true });
      return request;
    });
    const saved = session.save();
    expect(session.read().currentSkillKey).toBe('first\u0000');
    expect(session.step(true)?.skillId).toBe('first');
    expect(session.read().postSkillCastRequest?.skipApplyCost).toBe(true);
    session.restore(saved);
    expect(session.step(false)?.skillId).toBe('second');
    expect(ability.runtimeState.postSkillCastRequest).toMatchObject({ skillId: 'second' });
    expect(ability.runtimeState.postSkillCastRequest?.skipApplyCost).toBeUndefined();
    expect(ability.currentSkillId).toBe('first');
  });

  it('Buff 普攻映射覆盖当前技能，重复注册与乱序撤销不复活旧映射', () => {
    const first = Object.assign(new FixtureRuntime('attack', [], 'basicAttack'), {
      currentTimelineFrame: 1,
      inputWindows: {
        commandMappings: [
          {
            startFrame: 0,
            endFrame: 20,
            input: 'basicAttack' as const,
            targetSkillId: 'attack',
          },
        ],
      },
    });
    const ability = new AbilitySystemRuntime({
      skills: [first, new FixtureRuntime('heavy', [], 'basicAttack')],
      playerActionRoutes: {
        basicAttack: {
          kind: 'basicAttack',
          skillKeys: ['attack', 'heavy'],
          defaultSkillKey: 'attack',
        },
      },
    });
    ability.tryStartSkill('attack');
    const a = ability.overrideBasicAttackMapping('heavy');
    const b = ability.overrideBasicAttackMapping('heavy');
    expect(ability.resolvePlayerInputSkill('heavy')).toMatchObject({ status: 'matched' });
    a.finish();
    a.finish();
    expect(ability.resolvePlayerInputSkill('heavy')).toMatchObject({ status: 'matched' });
    const conflict = ability.overrideBasicAttackMapping('attack');
    expect(ability.resolvePlayerInputSkill('heavy')).toMatchObject({ status: 'unknown' });
    conflict.finish();
    b.finish();
    expect(ability.resolvePlayerInputSkill('heavy')).toEqual({
      status: 'mismatched',
      actualSkillKey: 'attack',
    });
  });
  it.each(['available', 'unavailable', 'missing'] as const)(
    'projectile callback interrupts before lookup/availability (%s), without a next-skill transition',
    mode => {
      const events: string[] = [];
      const previous = new FixtureRuntime('previous', events);
      const next = new FixtureRuntime('callback', events);
      const prepare = vi.fn();
      const ability = new AbilitySystemRuntime({
        skills: [
          previous,
          Object.assign(next, {
            canStart: () => {
              events.push('check:callback');
              return mode !== 'unavailable';
            },
            prepareCastInput: prepare,
          }),
        ],
        onPostSkillCastRequest: () => {
          throw new Error('callback must not enqueue');
        },
      });
      expect(ability.tryStartSkill('previous')).toBe(true);
      events.length = 0;
      const source = {
        skillCastId: 42,
        originSkillId: 'source',
        originSkillType: 'comboSkill' as const,
        nonReturnedSpCost: 10,
      };
      expect(
        ability.tryStartProjectileCallbackSkill(
          mode === 'missing' ? 'missing' : 'callback',
          source,
        ),
      ).toBe(mode === 'available');
      expect(events).toEqual([
        'interrupt:previous:default',
        ...(mode === 'missing' ? [] : ['check:callback']),
        ...(mode === 'available' ? ['start:callback'] : []),
      ]);
      expect(previous.lastTransition).toBeUndefined();
      expect(prepare).toHaveBeenCalledTimes(mode === 'available' ? 1 : 0);
      if (mode === 'available') {
        expect(prepare).toHaveBeenCalledWith({
          skipApplyCost: false,
          inheritedSkillCastInfo: source,
        });
        expect(prepare.mock.calls[0]![0].inheritedSkillCastInfo).not.toBe(source);
      }
    },
  );

  it('projectile callbacks cast the explicit ID and reuse ordinary synchronous processing hooks', () => {
    const events: string[] = [];
    const base = Object.assign(new FixtureRuntime('base', events), {
      prepareCastInput: vi.fn(),
      processingSkillCastId: 42,
    });
    const replacement = new FixtureRuntime('replacement', events);
    const ability = new AbilitySystemRuntime({
      skills: [base, replacement],
      emitBeforeSkillCast: () => {
        events.push('before');
        expect(ability.currentProcessingSkillCastId).toBe(42);
      },
      skillSlotGroups: [
        { skillGroupKey: 'slot', baseSkillKey: 'base', replacementSkillKeys: ['replacement'] },
      ],
    });
    ability.changeSkillSlot('slot', 'replacement');
    ability.prepareBeforeSkillCastStart('base', undefined, beforeCastPayload, false);
    expect(
      ability.tryStartProjectileCallbackSkill('base', {
        skillCastId: 42,
        originSkillId: 'source',
        originSkillType: 'comboSkill',
        nonReturnedSpCost: 0,
      }),
    ).toBe(true);
    expect(events).toEqual(['before', 'start:base']);
    expect(replacement.state).toBe('ready');
  });

  it('延迟请求先写槽再通知，通知中重入的请求按后写覆盖且不递归施法', () => {
    const events: string[] = [];
    let requests = 0;
    const ability = new AbilitySystemRuntime({
      skills: [new FixtureRuntime('first', events), new FixtureRuntime('second', events)],
      onPostSkillCastRequest: info => {
        expect(info).toBeNull();
        expect(events).toEqual([]);
        if (++requests === 1) ability.requestPostSkillCast({ skillId: 'second' });
      },
    });
    ability.requestPostSkillCast({ skillId: 'first' });
    expect(requests).toBe(2);
    ability.advanceFrame();
    expect(events).toContain('start:second');
    expect(events).not.toContain('start:first');
  });

  it('请求委托收到的是传入来源身份的值快照，而不是新技能的预分配编号', () => {
    const inherited = {
      skillCastId: 42,
      originSkillId: 'source',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 10,
    };
    const notices: unknown[] = [];
    const consumed: unknown[] = [];
    const ability = new AbilitySystemRuntime({
      skills: [new FixtureRuntime('next', [])],
      onPostSkillCastRequest: info => notices.push(info),
      beforePostSkillCastStart: request => consumed.push(request.inheritedSkillCastInfo),
    });
    ability.requestPostSkillCast({ skillId: 'next', inheritedSkillCastInfo: inherited });
    inherited.skillCastId = 99;
    ability.advanceFrame();
    expect(notices).toEqual([{ ...inherited, skillCastId: 42 }]);
    expect(consumed).toEqual(notices);
    expect(notices[0]).not.toBe(inherited);
  });

  it('施放当帧两路增量归零，共享冷却只归零该技能，仍调用动作更新', () => {
    const events: string[] = [];
    const current = Object.assign(new FixtureRuntime('current', events), {
      startedInCurrentFrame: true,
      advance: (timeline: number, cooldown: number) =>
        events.push(`current:${timeline}:${cooldown}`),
    });
    const other = Object.assign(new FixtureRuntime('other', events), {
      startedInCurrentFrame: false,
      advance: (timeline: number, cooldown: number) => events.push(`other:${timeline}:${cooldown}`),
    });
    const ability = new AbilitySystemRuntime({
      skills: [current, other],
      skillTickPlan: ['current', 'other'].map(skillId => ({
        skillId,
        advanceCooldown: delta => events.push(`cd:${skillId}:${delta}`),
      })),
    });
    ability.advanceFrame();
    expect(events).toEqual([
      'cd:current:0',
      'current:0:0',
      `cd:other:${1 / 30}`,
      `other:${1 / 30}:0`,
    ]);
    events.length = 0;
    current.startedInCurrentFrame = false;
    ability.advanceFrame();
    expect(events[0]).toBe(`cd:current:${1 / 30}`);
    expect(events[1]).toBe(`current:${1 / 30}:0`);
  });

  it('目录按每个身份先冷却再动作，空槽只推进冷却，重复放置不重复推进', () => {
    const events: string[] = [];
    const ability = new AbilitySystemRuntime({
      skills: [
        new FixtureRuntime('second', events),
        new FixtureRuntime('first', events, 'battleSkill', 'a'),
        new FixtureRuntime('first', events, 'battleSkill', 'b'),
      ],
      buffRuntime: {
        advanceFrame: () => events.push('buff'),
        recycleFinishedBuffs: () => events.push('recycle'),
      },
      actionRuntime: { advanceFrame: () => events.push('action') },
      skillTickPlan: ['first', 'unplaced', 'second'].map(skillId => ({
        skillId,
        advanceCooldown: delta => {
          expect(delta).toBe(1 / 30);
          events.push(`cooldown:${skillId}`);
        },
      })),
    });
    ability.advanceFrame();
    expect(events).toEqual([
      'buff',
      'cooldown:first',
      'tick:first',
      'tick:first',
      'cooldown:unplaced',
      'cooldown:second',
      'tick:second',
      'recycle',
      'action',
    ]);
  });

  it('目录冷却消费原始冷却增量，放置实例只消费时间线增量', () => {
    const skill = new FixtureRuntime('first', []);
    let received: number[] = [];
    const ability = new AbilitySystemRuntime({
      skills: [
        Object.assign(skill, {
          advance: (timeline: number, cooldown: number) => {
            received = [timeline, cooldown];
          },
        }),
      ],
      skillTickPlan: [{ skillId: 'first', advanceCooldown: delta => expect(delta).toBe(0.2) }],
      resolveTickDeltas: () => ({
        defaultDeltaSeconds: 1,
        globalScaledDeltaSeconds: 0.5,
        selfScaledDeltaSeconds: 0.1,
        skillCooldownDeltaSeconds: 0.2,
      }),
    });
    ability.advanceFrame();
    expect(received).toEqual([0.1, 0]);
  });

  it('显式推进目录不能重复或漏掉可执行技能', () => {
    const entry = { skillId: 'first', advanceCooldown: () => {} };
    expect(() => new AbilitySystemRuntime({ skills: [], skillTickPlan: [entry, entry] })).toThrow(
      'duplicate skill tick identity',
    );
    expect(
      () =>
        new AbilitySystemRuntime({ skills: [new FixtureRuntime('first', [])], skillTickPlan: [] }),
    ).toThrow('missing from tick plan');
  });
  it('preserves the native buff, skill-list, deferred-cast, action order', () => {
    const events: string[] = [];
    const first = new FixtureRuntime('first', events);
    const second = new FixtureRuntime('second', events);
    const ability = new AbilitySystemRuntime({
      buffRuntime: { advanceFrame: () => events.push('buff') },
      skills: [first, second],
      actionRuntime: { advanceFrame: () => events.push('action') },
    });
    expect(ability.tryStartSkill('first')).toBe(true);
    events.length = 0;
    ability.requestPostSkillCast({ skillId: 'second' });

    ability.advanceFrame();

    expect(events).toEqual([
      'buff',
      'tick:first',
      'tick:second',
      'interrupt:first:castNextSkill',
      'start:second',
      'action',
    ]);
    expect(ability.currentSkillId).toBe('second');
  });

  it('uses a last-write-wins slot instead of queuing deferred casts', () => {
    const events: string[] = [];
    const first = new FixtureRuntime('first', events);
    const second = new FixtureRuntime('second', events);
    const third = new FixtureRuntime('third', events);
    const ability = new AbilitySystemRuntime({ skills: [first, second, third] });
    expect(ability.tryStartSkill('first')).toBe(true);
    events.length = 0;

    ability.requestPostSkillCast({ skillId: 'second' });
    ability.requestPostSkillCast({ skillId: 'third' });
    ability.advanceFrame();

    expect(events).toContain('start:third');
    expect(events).not.toContain('start:second');
    expect(ability.currentSkillId).toBe('third');
  });

  it('runs deferred cast preparation after interrupt and before the next skill starts', () => {
    const events: string[] = [];
    const first = new FixtureRuntime('first', events);
    const second = new FixtureRuntime('second', events);
    const ability = new AbilitySystemRuntime({
      skills: [first, second],
      beforePostSkillCastStart: request => events.push(`before:${request.skillId}`),
    });
    expect(ability.tryStartSkill('first')).toBe(true);
    events.length = 0;
    ability.requestPostSkillCast({ skillId: 'second' });

    ability.advanceFrame();

    expect(events).toEqual([
      'tick:first',
      'tick:second',
      'interrupt:first:castNextSkill',
      'before:second',
      'start:second',
    ]);
  });

  it('目标技能不可施放时保留当前技能，不执行延迟施法准备', () => {
    const events: string[] = [];
    const first = new FixtureRuntime('first', events);
    const second = Object.assign(new FixtureRuntime('second', events), {
      canStart: () => false,
      tryStart: () => {
        events.push('unexpected-start:second');
        return false;
      },
    });
    const ability = new AbilitySystemRuntime({
      skills: [first, second],
      beforePostSkillCastStart: request => events.push(`before:${request.skillId}`),
    });
    expect(ability.tryStartSkill('first')).toBe(true);
    events.length = 0;

    ability.requestPostSkillCast({
      skillId: 'second',
      interruptCurrentSkillOnlyWhenTargetCastable: true,
    });
    ability.advanceFrame();

    expect(events).toEqual(['tick:first', 'tick:second']);
    expect(ability.currentSkillId).toBe('first');
  });

  it('未启用可施放保护时保留原生先中断、后尝试施放语义', () => {
    const events: string[] = [];
    const first = new FixtureRuntime('first', events);
    const second = Object.assign(new FixtureRuntime('second', events), {
      canStart: () => false,
      tryStart: () => {
        events.push('failed-start:second');
        return false;
      },
    });
    const ability = new AbilitySystemRuntime({ skills: [first, second] });
    expect(ability.tryStartSkill('first')).toBe(true);
    events.length = 0;

    ability.requestPostSkillCast({ skillId: 'second' });
    ability.advanceFrame();

    expect(events).toEqual([
      'tick:first',
      'tick:second',
      'interrupt:first:castNextSkill',
      'failed-start:second',
    ]);
    expect(ability.currentSkillId).toBeNull();
  });

  it('treats each placed skill as an instruction to replace the previous skill', () => {
    const events: string[] = [];
    const basicAttack = new FixtureRuntime('basic', events, 'basicAttack');
    const equalPriority = new FixtureRuntime('equal', events, 'basicAttack');
    const ultimate = new FixtureRuntime('ultimate', events, 'ultimate');
    const ability = new AbilitySystemRuntime({ skills: [basicAttack, equalPriority, ultimate] });

    expect(ability.tryStartSkill('basic')).toBe(true);
    expect(ability.tryStartSkill('equal')).toBe(true);
    expect(ability.tryStartSkill('ultimate')).toBe(true);
    expect(events).toEqual([
      'start:basic',
      'interrupt:basic:castNextSkill',
      'start:equal',
      'interrupt:equal:castNextSkill',
      'start:ultimate',
    ]);
  });

  it('结束旧技能后才发布新技能的施放前事件', () => {
    const events: string[] = [];
    const first = new FixtureRuntime('first', events);
    const second = new FixtureRuntime('second', events);
    const ability = new AbilitySystemRuntime({
      skills: [first, second],
      emitBeforeSkillCast: () => {
        events.push('before:second');
        expect(first.state).toBe('ended');
        expect(ability.currentSkillId).toBe('second');
      },
    });

    expect(ability.tryStartSkill('first')).toBe(true);
    events.length = 0;
    ability.prepareBeforeSkillCastStart('second', undefined, beforeCastPayload);

    expect(ability.tryStartSkill('second')).toBe(true);
    expect(events).toEqual(['interrupt:first:castNextSkill', 'before:second', 'start:second']);
  });

  it('exposes the next native skill identity and exact Buff transfer port during interruption', () => {
    const events: string[] = [];
    const first = new FixtureRuntime('first', events);
    const second = Object.assign(new FixtureRuntime('second', events), {
      transitionSkillId: 'native.second',
    });
    const ability = new AbilitySystemRuntime({ skills: [first, second] });
    const buff = { isRecycled: false, reference: createTestBuffReference(), finish: () => true };

    ability.tryStartSkill('first');
    ability.tryStartSkill('second');
    first.lastTransition?.attachBuffToNextSkill(buff);

    expect(first.lastTransition?.nextSkillId).toBe('native.second');
    expect(second.inheritedBuffs).toEqual([buff]);
  });

  it('does not register a positive-duration boundary for a zero-width presentation skill', () => {
    const events: string[] = [];
    const reached: unknown[] = [];
    let actualFrame = 0;
    const skill = new FixtureRuntime('zero', events, 'battleSkill', 'cast:zero', 0);
    const ability = new AbilitySystemRuntime({
      skills: [skill],
      resolveActualFrame: () => actualFrame,
      onSkillOperableBoundaryReached: fact => reached.push(fact),
    });

    expect(ability.tryStartSkill('zero', 'cast:zero')).toBe(true);
    actualFrame = 1;
    ability.advanceFrame();
    expect(reached).toEqual([]);
  });

  it.each([0, 36])(
    'publishes the reached boundary once, including local frame %s',
    durationFrames => {
      const reached: unknown[] = [];
      let actualFrame = 0;
      let routeBoundary: number | undefined;
      const skill = Object.assign(
        new FixtureRuntime('attack4', [], 'basicAttack', 'cast:attack4', 225),
        { usesRuntimeOperableBoundary: true },
      );
      Object.defineProperty(skill, 'reachedOperableBoundaryFrame', {
        get: () => routeBoundary,
      });
      const ability = new AbilitySystemRuntime({
        skills: [skill],
        resolveActualFrame: () => actualFrame,
        onSkillOperableBoundaryReached: fact => reached.push(fact),
      });

      expect(ability.tryStartSkill('attack4', 'cast:attack4')).toBe(true);
      actualFrame = 1;
      routeBoundary = durationFrames;
      ability.advanceFrame();
      expect(reached).toEqual([{ castId: 'cast:attack4', durationFrames, reachedAtFrame: 1 }]);

      actualFrame = 2;
      ability.advanceFrame();
      expect(reached).toHaveLength(1);
    },
  );

  it('publishes the first currently routed decision point without choosing a future skill', () => {
    const reached: unknown[] = [];
    let actualFrame = 0;
    let localFrame = 0;
    let boundaryFrame: number | undefined;
    const current = Object.assign(
      new FixtureRuntime('current', [], 'basicAttack', 'cast:current', 30),
      {
        transitionSkillId: 'native.current',
        usesRuntimeOperableBoundary: true,
        inputWindows: {
          commandMappings: [
            {
              startFrame: 0,
              endFrame: 8,
              input: 'basicAttack' as const,
              targetSkillId: 'native.next',
            },
          ],
          allowedNextSkills: [
            { startFrame: 0, endFrame: 8, skillIds: ['native.cleanup'] },
            { startFrame: 5, endFrame: 8, skillIds: ['native.next'] },
          ],
        },
        canInterrupt: false,
        markOperableBoundaryReached(frame = localFrame) {
          boundaryFrame ??= frame;
        },
      },
    );
    Object.defineProperties(current, {
      currentTimelineFrame: { get: () => localFrame },
      passedFrames: { get: () => localFrame },
      reachedOperableBoundaryFrame: { get: () => boundaryFrame },
    });
    current.advanceFrame = () => {
      localFrame = 5;
    };
    const next = Object.assign(new FixtureRuntime('next', [], 'basicAttack'), {
      transitionSkillId: 'native.next',
    });
    const cleanup = Object.assign(new FixtureRuntime('cleanup', [], 'basicAttack'), {
      transitionSkillId: 'native.cleanup',
    });
    const ability = new AbilitySystemRuntime({
      skills: [current, next, cleanup],
      playerActionRoutes: {
        basicAttack: {
          kind: 'basicAttack',
          skillKeys: ['current', 'next', 'cleanup'],
          defaultSkillKey: 'current',
        },
      },
      resolveActualFrame: () => actualFrame,
      onSkillOperableBoundaryReached: fact => reached.push(fact),
    });

    expect(ability.tryStartSkill('current', 'cast:current')).toBe(true);
    expect(reached).toEqual([]);
    actualFrame = 1;
    ability.advanceFrame();
    expect(reached).toEqual([{ castId: 'cast:current', durationFrames: 5, reachedAtFrame: 1 }]);
  });

  it('snapshots the active slot variant at release start and applies changes to later releases', () => {
    const events: string[] = [];
    const base = new FixtureRuntime('ultimate', events, 'ultimate');
    const replacement = new FixtureRuntime('arcana', events, 'ultimate');
    const ability = new AbilitySystemRuntime({
      skills: [base, replacement],
      skillSlotGroups: [
        {
          skillGroupKey: 'ultimate',
          baseSkillKey: 'ultimate',
          replacementSkillKeys: ['arcana'],
        },
      ],
    });

    expect(ability.tryStartSkill('ultimate')).toBe(true);
    expect(ability.changeSkillSlot('ultimate', 'arcana')).toBe('ultimate');
    expect(ability.currentSkillId).toBe('ultimate');

    base.state = 'ended';
    expect(ability.tryStartSkill('ultimate')).toBe(true);
    expect(ability.currentSkillId).toBe('arcana');

    expect(ability.changeSkillSlot('ultimate', 'ultimate')).toBe('arcana');
    expect(ability.currentSkillId).toBe('arcana');
    replacement.state = 'ended';
    expect(ability.tryStartSkill('ultimate')).toBe(true);
    expect(events.filter(event => event.startsWith('start:'))).toEqual([
      'start:ultimate',
      'start:arcana',
      'start:ultimate',
    ]);
  });

  it('preserves each stable input until a shared slot replacement becomes active', () => {
    const events: string[] = [];
    const base = new FixtureRuntime('battleSkill', events, 'battleSkill');
    const comboInput = new FixtureRuntime('battleSkillCombo', events, 'battleSkill');
    const end = new FixtureRuntime('battleSkillEnd', events, 'battleSkill');
    const ability = new AbilitySystemRuntime({
      skills: [base, comboInput, end],
      skillSlotGroups: [
        {
          skillGroupKey: 'battleSkill',
          baseSkillKey: 'battleSkill',
          stableInputSkillKeys: ['battleSkill', 'battleSkillCombo'],
          replacementSkillKeys: ['battleSkillEnd'],
        },
      ],
    });

    expect(ability.tryStartSkill('battleSkillCombo')).toBe(true);
    expect(ability.currentSkillId).toBe('battleSkillCombo');
    comboInput.state = 'ended';

    expect(ability.changeSkillSlot('battleSkill', 'battleSkillEnd')).toBe('battleSkill');
    expect(ability.tryStartSkill('battleSkillCombo')).toBe(true);
    expect(ability.currentSkillId).toBe('battleSkillEnd');
    end.state = 'ended';

    expect(ability.changeSkillSlot('battleSkill', 'battleSkill')).toBe('battleSkillEnd');
    expect(ability.tryStartSkill('battleSkillCombo')).toBe(true);
    expect(ability.currentSkillId).toBe('battleSkillCombo');
  });

  it('does not infer player actions from legacy skill-library groups', () => {
    const events: string[] = [];
    const ability = new AbilitySystemRuntime({
      skills: [
        new FixtureRuntime('battleSkill', events, 'battleSkill'),
        new FixtureRuntime('battleSkillCombo', events, 'battleSkill'),
        new FixtureRuntime('battleSkillEnd', events, 'battleSkill'),
      ],
      skillSlotGroups: [
        {
          skillGroupKey: 'battleSkill',
          baseSkillKey: 'battleSkill',
          stableInputSkillKeys: ['battleSkill', 'battleSkillCombo'],
          replacementSkillKeys: ['battleSkillEnd'],
        },
      ],
    });

    expect(ability.resolvePlayerInputSkill('battleSkillCombo')).toEqual({
      status: 'unknown',
      reason: 'operator has no imported player action routes',
    });

    ability.changeSkillSlot('battleSkill', 'battleSkillEnd');

    expect(ability.resolvePlayerInputSkill('battleSkillEnd')).toEqual({
      status: 'unknown',
      reason: 'operator has no imported player action routes',
    });
  });

  it('resolves semantic actions from explicit routes instead of library groups', () => {
    const events: string[] = [];
    const ability = new AbilitySystemRuntime({
      skills: [
        new FixtureRuntime('battleSkill', events, 'battleSkill'),
        new FixtureRuntime('enhancedBattleSkill', events, 'battleSkill'),
      ],
      skillSlotGroups: [
        {
          skillGroupKey: 'normalSkillSlot',
          input: 'battleSkill',
          baseSkillKey: 'battleSkill',
          replacementSkillKeys: ['enhancedBattleSkill'],
        },
      ],
      playerActionRoutes: {
        battleSkill: { kind: 'skillSlot', skillSlotKey: 'normalSkillSlot' },
      },
    });

    expect(ability.currentNormalSkillId).toBe('battleSkill');
    expect(ability.resolvePlayerInputSkill('battleSkill', 'battleSkill')).toEqual({
      status: 'matched',
      actualSkillKey: 'battleSkill',
    });
    ability.changeSkillSlot('normalSkillSlot', 'enhancedBattleSkill');
    expect(ability.currentNormalSkillId).toBe('enhancedBattleSkill');
    expect(ability.resolvePlayerInputSkill('battleSkill', 'battleSkill')).toEqual({
      status: 'mismatched',
      actualSkillKey: 'enhancedBattleSkill',
    });
    expect(ability.resolvePlayerInputSkill('enhancedBattleSkill', 'ultimate')).toEqual({
      status: 'unknown',
      reason: "skill is not reachable from player action 'ultimate'",
    });
  });

  it('keeps an imported basic-attack route unknown until a native default mapping is present', () => {
    const events: string[] = [];
    const ability = new AbilitySystemRuntime({
      skills: [new FixtureRuntime('attack1', events, 'basicAttack')],
      playerActionRoutes: {
        basicAttack: { kind: 'basicAttack', skillKeys: ['attack1'] },
      },
    });
    expect(ability.currentNormalSkillId).toBeUndefined();

    expect(ability.resolvePlayerInputSkill('attack1', 'basicAttack')).toEqual({
      status: 'unknown',
      reason: 'native basic-attack command mapping is not imported',
    });
  });

  it('does not reject finisher or plunging attack through the grounded A1 default mapping', () => {
    const ability = new AbilitySystemRuntime({
      skills: [
        new FixtureRuntime('attack1', [], 'basicAttack'),
        new FixtureRuntime('finisher', [], 'finisher'),
        new FixtureRuntime('plungingAttack', [], 'plungingAttack'),
      ],
      playerActionRoutes: {
        basicAttack: {
          kind: 'basicAttack',
          skillKeys: ['attack1', 'finisher', 'plungingAttack'],
          defaultSkillKey: 'attack1',
        },
      },
      playerActionModes: [
        {
          modeId: 'ultimate-mode',
          modeLayer: 'ultimate',
          defaultEnabled: true,
          commandMappings: {
            basicAttack: { skillId: 'attack1' },
          },
        },
      ],
    });

    expect(ability.resolvePlayerInputSkill('finisher', 'basicAttack')).toEqual({
      status: 'notApplicable',
      reason: 'special basic-attack selection state is outside simulation scope',
    });
    expect(ability.resolvePlayerInputSkill('plungingAttack', 'basicAttack')).toEqual({
      status: 'notApplicable',
      reason: 'special basic-attack selection state is outside simulation scope',
    });
    expect(ability.resolvePlayerInputSkill('attack1', 'basicAttack')).toEqual({
      status: 'matched',
      actualSkillKey: 'attack1',
    });
  });

  it('uses an active native mode for basic-attack routing and restores its layer', () => {
    const events: string[] = [];
    const ability = new AbilitySystemRuntime({
      skills: [
        new FixtureRuntime('attack1', events, 'basicAttack'),
        new FixtureRuntime('enhancedAttack', events, 'basicAttack'),
      ],
      playerActionRoutes: {
        basicAttack: {
          kind: 'basicAttack',
          skillKeys: ['attack1', 'enhancedAttack'],
          defaultSkillKey: 'attack1',
        },
      },
      playerActionModes: [
        {
          modeId: 'ultimateMode',
          modeLayer: 'ultimate',
          defaultEnabled: false,
          normalAttackSkillKeys: ['enhancedAttack'],
          commandMappings: {
            basicAttack: { skillId: 'enhancedAttack' },
          },
        },
      ],
    });

    const handle = ability.activatePlayerActionMode('ultimateMode');
    expect(ability.resolvePlayerInputSkill('attack1', 'basicAttack')).toEqual({
      status: 'mismatched',
      actualSkillKey: 'enhancedAttack',
    });
    expect(ability.resolvePlayerInputSkill('enhancedAttack', 'basicAttack')).toEqual({
      status: 'matched',
      actualSkillKey: 'enhancedAttack',
    });

    handle.finish();
    expect(ability.resolvePlayerInputSkill('attack1', 'basicAttack')).toEqual({
      status: 'matched',
      actualSkillKey: 'attack1',
    });
  });

  it('records the next attack at offsetRecordFrame and preserves it through Dash for one second', () => {
    let passedFrames = 0;
    const playerActionRoutes = {
      basicAttack: {
        kind: 'basicAttack' as const,
        skillKeys: ['attack1', 'attack2', 'modeAttack'],
        normalAttackSkillKeys: ['attack1', 'attack2'],
        defaultSkillKey: 'attack1',
      },
    } as const;
    const playerActionModes = [
      {
        modeId: 'mode',
        modeLayer: 'mode',
        defaultEnabled: true,
        commandMappings: {
          basicAttack: { skillId: 'modeAttack' },
        },
      },
    ] as const;
    const attack1 = Object.assign(new FixtureRuntime('attack1', [], 'basicAttack'), {
      nativeSkillType: 'attack' as const,
      offsetRecordFrame: 5,
    });
    Object.defineProperty(attack1, 'passedFrames', { get: () => passedFrames });
    attack1.advanceFrame = () => {
      passedFrames = 5;
    };
    const ability = new AbilitySystemRuntime({
      skills: [
        attack1,
        Object.assign(new FixtureRuntime('attack2', [], 'basicAttack'), {
          nativeSkillType: 'attack' as const,
        }),
        Object.assign(new FixtureRuntime('modeAttack', [], 'basicAttack'), {
          nativeSkillType: 'attack' as const,
        }),
        Object.assign(new FixtureRuntime('battle', [], 'battleSkill'), {
          nativeSkillType: 'normalSkill' as const,
        }),
      ],
      dashOffsetFrames: 30,
      playerActionRoutes,
      playerActionModes,
    });

    expect(ability.tryStartSkill('attack1')).toBe(true);
    ability.advanceFrame();
    expect(ability.runtimeState.comboOffsetTargetSkillKey).toBe('attack2');

    ability.interruptCurrentSkillForDash();
    expect(ability.resolvePlayerInputSkill('attack2', 'basicAttack')).toEqual({
      status: 'matched',
      actualSkillKey: 'attack2',
    });
    expect(ability.resolvePlayerInputSkill('modeAttack', 'basicAttack')).toEqual({
      status: 'mismatched',
      actualSkillKey: 'attack2',
    });
    const restored = new AbilitySystemRuntime(
      {
        skills: [
          Object.assign(new FixtureRuntime('attack1', [], 'basicAttack'), {
            nativeSkillType: 'attack' as const,
          }),
          Object.assign(new FixtureRuntime('attack2', [], 'basicAttack'), {
            nativeSkillType: 'attack' as const,
          }),
          Object.assign(new FixtureRuntime('modeAttack', [], 'basicAttack'), {
            nativeSkillType: 'attack' as const,
          }),
          Object.assign(new FixtureRuntime('battle', [], 'battleSkill'), {
            nativeSkillType: 'normalSkill' as const,
          }),
        ],
        dashOffsetFrames: 30,
        playerActionRoutes,
        playerActionModes,
      },
      structuredClone(ability.runtimeState),
    );
    expect(restored.resolvePlayerInputSkill('attack2', 'basicAttack')).toEqual({
      status: 'matched',
      actualSkillKey: 'attack2',
    });
    expect(ability.tryStartSkill('battle')).toBe(true);
    expect(ability.runtimeState.comboOffsetTargetSkillKey).toBe('attack2');
    expect(ability.runtimeState.comboOffsetModifier?.skillCasted).toBe(false);

    for (let frame = 0; frame < 30; frame += 1) ability.advanceFrame();
    expect(ability.runtimeState.comboOffsetModifier).toBeNull();
    expect(ability.runtimeState.comboOffsetTargetSkillKey).toBe('attack2');
    expect(ability.resolvePlayerInputSkill('modeAttack', 'basicAttack')).toEqual({
      status: 'matched',
      actualSkillKey: 'modeAttack',
    });
  });

  it('keeps unresolved native mode targets explicit instead of inventing a skill', () => {
    const ability = new AbilitySystemRuntime({
      skills: [new FixtureRuntime('attack1', [], 'basicAttack')],
      playerActionRoutes: {
        basicAttack: {
          kind: 'basicAttack',
          skillKeys: ['attack1'],
          defaultSkillKey: 'attack1',
        },
      },
      playerActionModes: [
        {
          modeId: 'ultimateMode',
          modeLayer: 'ultimate',
          defaultEnabled: true,
          commandMappings: { basicAttack: { skillId: 'native.missing' } },
        },
      ],
    });

    expect(ability.resolvePlayerInputSkill('attack1', 'basicAttack')).toEqual({
      status: 'unknown',
      reason: "active mode maps basic attack to unconverted native skill 'native.missing'",
    });
  });

  it('mutates the native SkillType independently from the Endaxis skill category', () => {
    const skill = Object.assign(new FixtureRuntime('ending', [], 'ultimate'), {
      nativeSkillType: 'ultimateSkill' as const,
    });
    const ability = new AbilitySystemRuntime({ skills: [skill] });
    ability.tryStartSkill('ending');

    expect(ability.currentSkillType).toBe('ultimate');
    expect(ability.currentNativeSkillType).toBe('ultimateSkill');
    expect(ability.nativeSkillTypeForSkill('ending')).toBe('ultimateSkill');
    ability.changeNativeSkillType('ending', 'attachSkill');
    expect(ability.currentSkillType).toBe('ultimate');
    expect(ability.currentNativeSkillType).toBe('attachSkill');
    expect(ability.nativeSkillTypeForSkill('ending')).toBe('attachSkill');
    expect(() => ability.nativeSkillTypeForSkill('missing')).toThrow('unknown ability skill');
  });

  it('resolves a chained input from native command mapping and allowed-next windows', () => {
    const events: string[] = [];
    let frame = 5;
    const first = new FixtureRuntime('attack1', events, 'basicAttack');
    Object.defineProperties(first, {
      transitionSkillId: { value: 'native.attack1' },
      currentTimelineFrame: { get: () => frame },
      canInterrupt: { get: () => false },
      inputWindows: {
        value: {
          commandMappings: [
            {
              startFrame: 5,
              endFrame: 10,
              input: 'basicAttack',
              targetSkillId: 'native.attack2',
            },
          ],
          allowedNextSkills: [{ startFrame: 7, endFrame: 10, skillIds: ['native.attack2'] }],
        },
      },
    });
    const second = new FixtureRuntime('attack2', events, 'basicAttack');
    Object.defineProperty(second, 'transitionSkillId', { value: 'native.attack2' });
    const ability = new AbilitySystemRuntime({
      skills: [first, second],
      skillSlotGroups: [
        {
          skillGroupKey: 'basicAttack',
          input: 'basicAttack',
          defaultForInput: true,
          baseSkillKey: 'attack1',
          stableInputSkillKeys: ['attack1', 'attack2'],
          replacementSkillKeys: [],
        },
      ],
      playerActionRoutes: {
        basicAttack: {
          kind: 'basicAttack',
          skillKeys: ['attack1', 'attack2'],
          defaultSkillKey: 'attack1',
        },
      },
    });

    ability.tryStartSkill('attack1');
    expect(ability.resolvePlayerInputSkill('attack2')).toEqual({
      status: 'matched',
      actualSkillKey: 'attack2',
    });
    expect(ability.evaluatePlayerInputInterruption('attack2')).toEqual({
      status: 'blocked',
      currentSkillKey: 'attack1',
    });

    frame = 7;
    expect(ability.evaluatePlayerInputInterruption('attack2')).toEqual({ status: 'allowed' });

    frame = 11;
    expect(ability.resolvePlayerInputSkill('attack2')).toEqual({
      status: 'mismatched',
      actualSkillKey: 'attack1',
    });
  });

  it('accepts a preserved basic-attack stage from a non-attack allowed-next window', () => {
    const events: string[] = [];
    let frame = 5;
    const battleSkill = new FixtureRuntime('battleSkill', events, 'battleSkill');
    Object.defineProperties(battleSkill, {
      currentTimelineFrame: { get: () => frame },
      inputWindows: {
        value: {
          allowedNextSkills: [
            {
              startFrame: 5,
              endFrame: 10,
              skillIds: ['native.attack1', 'native.attack2'],
            },
          ],
        },
      },
    });
    const attack1 = new FixtureRuntime('attack1', events, 'basicAttack');
    const attack2 = new FixtureRuntime('attack2', events, 'basicAttack');
    Object.defineProperty(attack1, 'transitionSkillId', { value: 'native.attack1' });
    Object.defineProperty(attack2, 'transitionSkillId', { value: 'native.attack2' });
    const ability = new AbilitySystemRuntime({
      skills: [battleSkill, attack1, attack2],
      skillSlotGroups: [
        {
          skillGroupKey: 'basicAttack',
          input: 'basicAttack',
          defaultForInput: true,
          baseSkillKey: 'attack1',
          stableInputSkillKeys: ['attack1', 'attack2'],
          replacementSkillKeys: [],
        },
      ],
      playerActionRoutes: {
        basicAttack: {
          kind: 'basicAttack',
          skillKeys: ['attack1', 'attack2'],
          defaultSkillKey: 'attack1',
        },
      },
    });

    ability.tryStartSkill('battleSkill');
    expect(ability.resolvePlayerInputSkill('attack2', 'basicAttack')).toEqual({
      status: 'matched',
      actualSkillKey: 'attack2',
    });
    expect(ability.evaluatePlayerInputInterruption('attack2')).toEqual({ status: 'allowed' });

    frame = 11;
    expect(ability.resolvePlayerInputSkill('attack2', 'basicAttack')).toEqual({
      status: 'mismatched',
      actualSkillKey: 'attack1',
    });
  });

  it('does not redirect an explicit native CastSkill id through the active input slot', () => {
    const events: string[] = [];
    const base = new FixtureRuntime('battleSkill', events, 'battleSkill');
    const combo = new FixtureRuntime('battleSkillCombo', events, 'battleSkill');
    const end = new FixtureRuntime('battleSkillEnd', events, 'battleSkill');
    const ability = new AbilitySystemRuntime({
      skills: [base, combo, end],
      skillSlotGroups: [
        {
          skillGroupKey: 'battleSkill',
          baseSkillKey: 'battleSkill',
          stableInputSkillKeys: ['battleSkill', 'battleSkillCombo'],
          replacementSkillKeys: ['battleSkillEnd'],
        },
      ],
    });

    ability.changeSkillSlot('battleSkill', 'battleSkillEnd');
    ability.requestPostSkillCast({ skillId: 'battleSkillCombo', resolveSkillSlot: false });
    ability.advanceFrame();

    expect(ability.currentSkillId).toBe('battleSkillCombo');
  });
});
