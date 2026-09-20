import { describe, expect, it, vi } from 'vitest';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { SkillSlotOperationExecutor } from './skillSlotOperationExecutor';
import { ActionBlackboard } from '../actions/actionBlackboard';

describe('SkillSlotOperationExecutor', () => {
  it('结束普攻映射动作只撤销自己的句柄，重复结束无副作用', () => {
    const finish = vi.fn();
    const register = vi.fn(() => 3);
    const context = {
      blackboard: new ActionBlackboard(),
      actionRegistrationState: { registrationId: null as number | null },
    };
    const delegate = { execute: vi.fn(() => false), evaluate: vi.fn(() => false) };
    const executor = new SkillSlotOperationExecutor({
      changeSkillSlot: vi.fn(),
      overrideBasicAttackMapping: register,
      finishBasicAttackMapping: finish,
      delegate,
    });
    const step: ResolvedCombatOperationStep = {
      kind: 'overrideBasicAttackMapping',
      parameters: { skillId: 'native.heavy' },
    };
    executor.execute(step, context);
    expect(register).toHaveBeenCalledWith('native.heavy');
    executor.end(step, context);
    executor.end(step, context);
    expect(finish).toHaveBeenCalledWith(3);
    expect(finish).toHaveBeenCalledOnce();
    expect(delegate.execute).not.toHaveBeenCalled();
  });
  it('changes future slot resolution without delegating the operation', () => {
    const changeSkillSlot = vi.fn();
    const delegate = {
      execute: vi.fn(() => false),
      evaluate: vi.fn(() => false),
    };
    const executor = new SkillSlotOperationExecutor({ changeSkillSlot, delegate });
    const step: ResolvedCombatOperationStep = {
      kind: 'changeSkillSlot',
      parameters: { skillGroupKey: 'ultimate', targetSkillKey: 'arcana' },
    };

    expect(executor.execute(step)).toBe(true);
    expect(changeSkillSlot).toHaveBeenCalledWith('ultimate', 'arcana', false);
    expect(delegate.execute).not.toHaveBeenCalled();
  });

  it('forwards native cooldown-progress inheritance', () => {
    const changeSkillSlot = vi.fn();
    const executor = new SkillSlotOperationExecutor({
      changeSkillSlot,
      delegate: { execute: () => false, evaluate: () => false },
    });

    executor.execute({
      kind: 'changeSkillSlot',
      parameters: {
        skillGroupKey: 'battleSkill',
        targetSkillKey: 'battleSkillEnd',
        inheritOriginSkillCooldownProgress: true,
      },
    });

    expect(changeSkillSlot).toHaveBeenCalledWith('battleSkill', 'battleSkillEnd', true);
  });

  it('keeps an infinite native replacement handle alive when its action ends', () => {
    const finish = vi.fn();
    const replaceSkillSlot = vi.fn(() => 2);
    const context = {
      blackboard: new ActionBlackboard(),
      actionRegistrationState: { registrationId: null as number | null },
    };
    const executor = new SkillSlotOperationExecutor({
      changeSkillSlot: vi.fn(),
      replaceSkillSlot,
      finishSkillSlotReplacement: finish,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const step: ResolvedCombatOperationStep = {
      kind: 'changeSkillSlot',
      parameters: {
        skillGroupKey: 'comboSkill',
        targetSkillKey: 'comboSkill3',
        lifetime: 'infinite',
      },
    };

    expect(executor.execute(step, context)).toBe(true);
    executor.end(step, context);

    expect(replaceSkillSlot).toHaveBeenCalledWith({
      skillGroupKey: 'comboSkill',
      targetSkillKey: 'comboSkill3',
      inheritOriginSkillCooldownProgress: false,
    });
    expect(finish).not.toHaveBeenCalled();
  });

  it('reverts a FinishByAction replacement exactly when its action ends', () => {
    const finish = vi.fn();
    const context = {
      blackboard: new ActionBlackboard(),
      actionRegistrationState: { registrationId: null as number | null },
    };
    const executor = new SkillSlotOperationExecutor({
      changeSkillSlot: vi.fn(),
      replaceSkillSlot: () => 3,
      finishSkillSlotReplacement: finish,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const step: ResolvedCombatOperationStep = {
      kind: 'changeSkillSlot',
      parameters: {
        skillGroupKey: 'battleSkill',
        targetSkillKey: 'battleSkillEnd',
        revertedSkillKey: 'battleSkill',
        inheritOriginSkillCooldownProgress: true,
        lifetime: 'finishByAction',
      },
    };

    executor.execute(step, context);
    executor.end(step, context);
    executor.end(step, context);

    expect(finish).toHaveBeenCalledWith('battleSkill', 3);
    expect(finish).toHaveBeenCalledTimes(1);
  });

  it('activates a player-action mode for the action lifetime and restores it once', () => {
    const finish = vi.fn();
    const activatePlayerActionMode = vi.fn(() => 7);
    const context = {
      blackboard: new ActionBlackboard(),
      actionRegistrationState: { registrationId: null as number | null },
    };
    const executor = new SkillSlotOperationExecutor({
      changeSkillSlot: vi.fn(),
      activatePlayerActionMode,
      finishPlayerActionMode: finish,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const step: ResolvedCombatOperationStep = {
      kind: 'changePlayerActionMode',
      parameters: { modeId: 'ultimateMode', lifetime: 'finishByAction' },
    };

    expect(executor.execute(step, context)).toBe(true);
    executor.end(step, context);
    executor.end(step, context);

    expect(activatePlayerActionMode).toHaveBeenCalledWith('ultimateMode');
    expect(finish).toHaveBeenCalledWith(7);
    expect(finish).toHaveBeenCalledTimes(1);
  });

  it('applies a native SkillType mutation immediately without changing a slot', () => {
    const changeNativeSkillType = vi.fn();
    const changeSkillSlot = vi.fn();
    const executor = new SkillSlotOperationExecutor({
      changeSkillSlot,
      changeNativeSkillType,
      delegate: { execute: () => false, evaluate: () => false },
    });

    expect(
      executor.execute({
        kind: 'changeNativeSkillType',
        parameters: { targetSkillKey: 'ultimateEnd', nativeSkillType: 'attachSkill' },
      }),
    ).toBe(true);
    expect(changeNativeSkillType).toHaveBeenCalledWith('ultimateEnd', 'attachSkill');
    expect(changeSkillSlot).not.toHaveBeenCalled();
  });

  it('把负的连续 Dash 上限转成原生无限值，并在动作结束时清除', () => {
    const setMultiDashLimit = vi.fn();
    const context = {
      blackboard: new ActionBlackboard(),
      actionRegistrationState: { registrationId: null as number | null },
    };
    const executor = new SkillSlotOperationExecutor({
      changeSkillSlot: vi.fn(),
      setMultiDashLimit,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const step: ResolvedCombatOperationStep = {
      kind: 'overrideMultiDashLimit',
      parameters: { dashCount: { kind: 'constant', value: -1 } },
    };

    expect(executor.execute(step, context)).toBe(true);
    expect(setMultiDashLimit).toHaveBeenLastCalledWith(0x7fffffff);
    executor.end(step, context);
    executor.end(step, context);
    expect(setMultiDashLimit).toHaveBeenLastCalledWith(null);
    expect(setMultiDashLimit).toHaveBeenCalledTimes(2);
  });
});
