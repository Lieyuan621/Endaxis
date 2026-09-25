import { describe, expect, it, vi } from 'vitest';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { SkillCastOperationExecutor } from './skillCastOperationExecutor';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';

describe('SkillCastOperationExecutor', () => {
  it('延迟请求复制命名目标组中的实体，空组保留空输入，不改用主目标', () => {
    const request = vi.fn();
    const executor = new SkillCastOperationExecutor({
      casterId: 'operator',
      request,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const targetContext = new RuntimeTargetContext();
    const context = { blackboard: new ActionBlackboard(), targetContext };
    const step = {
      kind: 'castSkillDuringAction',
      parameters: {
        skillId: 'counter',
        target: 'context',
        targetContextKey: 'attacker',
        skipApplyCost: false,
        inheritSourceSkillCastInfo: false,
      },
    } satisfies ResolvedCombatOperationStep;
    targetContext.setSingle('attacker', { kind: 'operator', operatorId: 'attacker' });
    executor.execute(step, context);
    targetContext.set('attacker', []);
    expect(request.mock.calls[0]![0].inputTarget).toEqual({
      kind: 'operator',
      operatorId: 'attacker',
    });
    executor.execute(step, context);
    expect(request.mock.calls[1]![0].inputTarget).toBeNull();
  });
  it('复制事件输入目标，不随回调结束或调用方修改而变化', () => {
    const request = vi.fn();
    const executor = new SkillCastOperationExecutor({
      casterId: 'operator',
      request,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const target = { kind: 'operator' as const, operatorId: 'attacker' };
    const step = {
      kind: 'castSkillDuringAction' as const,
      parameters: {
        skillId: 'counter',
        target: 'actionInputTarget' as const,
        skipApplyCost: false,
        inheritSourceSkillCastInfo: false,
      },
    };
    executor.execute(step, { blackboard: new ActionBlackboard(), actionInputTarget: target });
    target.operatorId = 'later-event';
    expect(request.mock.calls[0]?.[0].inputTarget).toEqual({
      kind: 'operator',
      operatorId: 'attacker',
    });
    executor.execute(step, { blackboard: new ActionBlackboard() });
    expect(request.mock.calls[1]?.[0].inputTarget).toBeNull();
  });
  it('queues the native skill and preserves inherited cast identity', () => {
    const request = vi.fn();
    const executor = new SkillCastOperationExecutor({
      casterId: 'operator',
      request,
      delegate: {
        execute: () => false,
        evaluate: () => false,
      },
    });
    const skillCastInfo = {
      skillCastId: 17,
      originSkillId: 'comboSkill',
      originSkillType: 'comboSkill' as const,
      nonReturnedSpCost: 4,
    };
    const step = {
      kind: 'castSkillDuringAction',
      parameters: {
        skillId: 'chr_0035_liino_normal_skill_combo',
        target: 'enemy',
        skipApplyCost: true,
        inheritSourceSkillCastInfo: true,
        interruptCurrentSkillOnlyWhenTargetCastable: true,
      },
    } satisfies ResolvedCombatOperationStep;

    expect(executor.execute(step, { blackboard: new ActionBlackboard(), skillCastInfo })).toBe(
      true,
    );
    expect(request).toHaveBeenCalledWith({
      nativeSkillId: 'chr_0035_liino_normal_skill_combo',
      inputTarget: { kind: 'enemy' },
      skipApplyCost: true,
      interruptCurrentSkillOnlyWhenTargetCastable: true,
      inheritedSkillCastInfo: skillCastInfo,
    });
  });

  it('requires a source cast context only when inheritance is enabled', () => {
    const executor = new SkillCastOperationExecutor({
      casterId: 'operator',
      request: vi.fn(),
      delegate: { execute: () => false, evaluate: () => false },
    });
    expect(() =>
      executor.execute(
        {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'child',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: true,
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toThrow('requires source SkillCastInfo');
  });

  it('保存延迟施法的自身目标身份', () => {
    const request = vi.fn();
    const executor = new SkillCastOperationExecutor({
      casterId: 'operator',
      request,
      delegate: { execute: () => false, evaluate: () => false },
    });

    expect(
      executor.execute(
        {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0028_zhuangfangyi_ultimate_skill_end',
            target: 'caster',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: false,
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);
    expect(request).toHaveBeenCalledWith({
      nativeSkillId: 'chr_0028_zhuangfangyi_ultimate_skill_end',
      inputTarget: { kind: 'operator', operatorId: 'operator' },
      skipApplyCost: true,
      inheritedSkillCastInfo: undefined,
    });
  });

  it('resolves the native skill id from the action blackboard', () => {
    const request = vi.fn();
    const executor = new SkillCastOperationExecutor({
      casterId: 'operator',
      request,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const blackboard = new ActionBlackboard({ dodgeSkillId: 'chr_test_dodge_skill' });

    executor.execute(
      {
        kind: 'castSkillDuringAction',
        parameters: {
          skillId: { blackboardKey: 'dodgeSkillId' },
          target: 'enemy',
          skipApplyCost: true,
          inheritSourceSkillCastInfo: false,
        },
      },
      { blackboard },
    );

    expect(request).toHaveBeenCalledWith({
      nativeSkillId: 'chr_test_dodge_skill',
      inputTarget: { kind: 'enemy' },
      skipApplyCost: true,
      inheritedSkillCastInfo: undefined,
    });
  });

  it('rejects a missing blackboard skill id', () => {
    const executor = new SkillCastOperationExecutor({
      casterId: 'operator',
      request: vi.fn(),
      delegate: { execute: () => false, evaluate: () => false },
    });

    expect(() =>
      executor.execute(
        {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: { blackboardKey: 'dodgeSkillId' },
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: false,
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toThrow("deferred skill id blackboard 'dodgeSkillId' is missing");
  });
});
