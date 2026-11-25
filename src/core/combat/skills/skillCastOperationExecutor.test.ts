import { singleTargetList } from '../../game-data/logicalAbilityEntity';
import { stringInput } from '../../../test/compiledGraphInputs';
import { describe, expect, it, vi } from 'vitest';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { SkillCastOperationExecutor } from './skillCastOperationExecutor';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';

describe('SkillCastOperationExecutor', () => {
  it('普通延迟施法保存查询首项，空集合保留空输入，宿主与目标独立解析', () => {
    const request = vi.fn();
    const targetContext = new RuntimeTargetContext();
    const context = { blackboard: new ActionBlackboard(), targetContext };
    const executor = new SkillCastOperationExecutor({
      casterId: 'definition-owner',
      queryTargets: query =>
        query.kind === 'source'
          ? [
              { kind: 'spatialPoint', pointId: 1 },
              { kind: 'operator', operatorId: 'actual-caster' },
            ]
          : targetContext.get('selected'),
      request,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const step = {
      kind: 'castSkillDuringAction',
      parameters: {
        caster: { kind: 'source' },
        target: { kind: 'context', key: 'selected' },
        skillId: 'child',
        skipApplyCost: false,
        inheritSourceSkillCastInfo: false,
      },
    } satisfies ResolvedCombatOperationStep;
    targetContext.set('selected', [
      { kind: 'enemy', enemyId: 'enemy:second' },
      { kind: 'enemy', enemyId: 'enemy' },
    ]);
    expect(executor.execute(step, context)).toBe(true);
    targetContext.set('selected', []);
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({ inputTarget: { kind: 'enemy', enemyId: 'enemy:second' } }),
      { kind: 'operator', operatorId: 'actual-caster' },
      context,
    );
    expect(executor.execute(step, context)).toBe(true);
    expect(request.mock.calls[1]![0].inputTarget).toBeNull();
  });
  it('先选实际施法宿主，空宿主不读取后续技能黑板或提交请求', () => {
    const request = vi.fn();
    const targetContext = new RuntimeTargetContext();
    const context = { blackboard: new ActionBlackboard(), targetContext };
    const executor = new SkillCastOperationExecutor({
      casterId: 'definition-owner',
      request,
      queryTargets: query =>
        query.kind === 'context'
          ? (targetContext.getOptional(query.key) ?? [])
          : query.kind === 'fixed' && query.target === 'enemy'
            ? [{ kind: 'enemy', enemyId: 'enemy:chosen' }]
            : [],
      delegate: { execute: () => false, evaluate: () => false },
    });
    const step = {
      kind: 'castSkillDuringAction',
      parameters: {
        caster: { kind: 'context', key: 'soul' },
        skillId: stringInput('nextSkill'),
        target: 'enemy',
        skipApplyCost: false,
        inheritSourceSkillCastInfo: false,
      },
    } satisfies ResolvedCombatOperationStep;
    expect(executor.execute(step, context)).toBe(false);
    expect(request).not.toHaveBeenCalled();
    targetContext.set('soul', [{ kind: 'spatialPoint', pointId: 1 }]);
    expect(executor.execute(step, context)).toBe(false);
    expect(request).not.toHaveBeenCalled();
    targetContext.set('soul', [
      { kind: 'abilityEntity', instanceId: 7 },
      { kind: 'enemy', enemyId: 'enemy' },
    ]);
    context.blackboard.assign({ nextSkill: 'born' });
    expect(executor.execute(step, context)).toBe(true);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeSkillId: 'born',
        inputTarget: { kind: 'enemy', enemyId: 'enemy:chosen' },
      }),
      { kind: 'abilityEntity', instanceId: 7 },
      context,
    );
  });
  it('延迟请求复制命名目标组中的实体，空组保留空输入，不改用主目标', () => {
    const request = vi.fn();
    const executor = new SkillCastOperationExecutor({
      queryTargets: () => [{ kind: 'enemy', enemyId: 'enemy' }],
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
    targetContext.set('attacker', [
      { kind: 'operator', operatorId: 'attacker' },
      { kind: 'enemy', enemyId: 'enemy' },
    ]);
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
      queryTargets: () => [{ kind: 'enemy', enemyId: 'enemy' }],
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
    executor.execute(step, {
      blackboard: new ActionBlackboard(),
      actionInputTargets: singleTargetList(target),
    });
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
      queryTargets: () => [{ kind: 'enemy', enemyId: 'enemy' }],
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
      inputTarget: { kind: 'enemy', enemyId: 'enemy' },
      skipApplyCost: true,
      interruptCurrentSkillOnlyWhenTargetCastable: true,
      inheritedSkillCastInfo: skillCastInfo,
    });
  });

  it('requires a source cast context only when inheritance is enabled', () => {
    const executor = new SkillCastOperationExecutor({
      queryTargets: () => [{ kind: 'enemy', enemyId: 'enemy' }],
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
      queryTargets: () => [{ kind: 'enemy', enemyId: 'enemy' }],
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
      queryTargets: () => [{ kind: 'enemy', enemyId: 'enemy' }],
      casterId: 'operator',
      request,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const blackboard = new ActionBlackboard({ dodgeSkillId: 'chr_test_dodge_skill' });

    executor.execute(
      {
        kind: 'castSkillDuringAction',
        parameters: {
          skillId: stringInput('dodgeSkillId'),
          target: 'enemy',
          skipApplyCost: true,
          inheritSourceSkillCastInfo: false,
        },
      },
      { blackboard },
    );

    expect(request).toHaveBeenCalledWith({
      nativeSkillId: 'chr_test_dodge_skill',
      inputTarget: { kind: 'enemy', enemyId: 'enemy' },
      skipApplyCost: true,
      inheritedSkillCastInfo: undefined,
    });
  });

  it('rejects a missing blackboard skill id', () => {
    const executor = new SkillCastOperationExecutor({
      queryTargets: () => [{ kind: 'enemy', enemyId: 'enemy' }],
      casterId: 'operator',
      request: vi.fn(),
      delegate: { execute: () => false, evaluate: () => false },
    });

    expect(() =>
      executor.execute(
        {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: stringInput('dodgeSkillId'),
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

it('延迟施法分别查询宿主与当前主控，保存当次目标而不绑定定义所属干员', () => {
  const request = vi.fn();
  let mainId = 'ally';
  const executor = new SkillCastOperationExecutor({
    casterId: 'si',
    request,
    queryTargets: query =>
      query.kind === 'mainCharacter'
        ? [{ kind: 'operator', operatorId: mainId }]
        : [{ kind: 'abilityEntity', instanceId: 2 }],
    delegate: { execute: () => false, evaluate: () => false },
  });
  const step = {
    kind: 'castSkillDuringAction',
    parameters: {
      caster: { kind: 'context', key: 'moying2' },
      target: { kind: 'mainCharacter' },
      skillId: 'chr_0036_jsspsi_normal_skill_inkhurt_front',
      skipApplyCost: false,
      inheritSourceSkillCastInfo: false,
    },
  } satisfies ResolvedCombatOperationStep;
  const context = { blackboard: new ActionBlackboard() };
  expect(executor.execute(step, context)).toBe(true);
  mainId = 'si';
  expect(executor.execute(step, context)).toBe(true);
  expect(request.mock.calls.map(args => [args[0].inputTarget, args[1]])).toEqual([
    [
      { kind: 'operator', operatorId: 'ally' },
      { kind: 'abilityEntity', instanceId: 2 },
    ],
    [
      { kind: 'operator', operatorId: 'si' },
      { kind: 'abilityEntity', instanceId: 2 },
    ],
  ]);
});

it('中断动作只使用查询的第一个实体，空查询仍成功', () => {
  const interrupt = vi.fn();
  const queryTargets = vi.fn().mockReturnValue([
    { kind: 'spatialPoint', pointId: 1 },
    { kind: 'operator', operatorId: 'target' },
    { kind: 'operator', operatorId: 'other' },
  ]);
  const executor = new SkillCastOperationExecutor({
    casterId: 'source',
    request: vi.fn(),
    queryTargets,
    interruptCurrentSkill: interrupt,
    delegate: { execute: () => false, evaluate: () => false },
  });
  const step = {
    kind: 'interruptCurrentSkill',
    parameters: { targets: { kind: 'inputTarget' } },
  } satisfies ResolvedCombatOperationStep;
  const context = { blackboard: new ActionBlackboard() };
  expect(executor.execute(step, context)).toBe(true);
  expect(interrupt.mock.calls).toEqual([[{ kind: 'operator', operatorId: 'target' }]]);
  queryTargets.mockReturnValue([]);
  expect(executor.execute(step, context)).toBe(true);
  expect(interrupt).toHaveBeenCalledTimes(1);
});
