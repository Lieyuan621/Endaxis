import { describe, expect, it } from 'vitest';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { ActionBlackboard } from '../actions/actionBlackboard';
import type { CombatOperationExecutor } from './skillRuntime';
import {
  BasicAttackSkillCastInheritanceRegistry,
  SkillCastInheritanceOperationExecutor,
} from './skillCastInheritanceOperationExecutor';
import { StateStepper } from '../runtime/stateStepper';

const terminal: CombatOperationExecutor = {
  execute: () => true,
  evaluate: () => true,
};

const step = {
  kind: 'inheritSkillCastInfoForBasicAttack',
  parameters: {},
} as const satisfies ResolvedCombatOperationStep;

const firstCast = {
  skillCastId: 7,
  originSkillId: 'floating-mode',
  originSkillType: 'ultimate',
  nonReturnedSpCost: 0,
} as const;

describe('普通攻击施法身份继承槽', () => {
  it('整图恢复保留实际持有者，竞争注册和重复注销都不会清除新持有者', () => {
    const registry = new BasicAttackSkillCastInheritanceRegistry();
    const first = registry.register('typhoeus', firstCast);
    const ignored = registry.register('typhoeus', { ...firstCast, skillCastId: 8 });
    const saved = structuredClone({ state: registry.runtimeState, first, ignored });
    registry.unregister(first);
    registry.register('typhoeus', { ...firstCast, skillCastId: 9 });
    const restored = new BasicAttackSkillCastInheritanceRegistry(saved.state);
    restored.unregister(saved.ignored);
    expect(restored.get('typhoeus')?.skillCastId).toBe(7);
    restored.unregister(saved.first);
    const next = restored.register('typhoeus', { ...firstCast, skillCastId: 10 });
    expect(next.id).toBe(3);
    restored.unregister(saved.first);
    expect(restored.get('typhoeus')?.skillCastId).toBe(10);
    expect(registry.get('typhoeus')?.skillCastId).toBe(9);
  });

  it('首次注册优先，且只有实际占用槽位的动作能注销', () => {
    const registry = new BasicAttackSkillCastInheritanceRegistry();
    const first = registry.register('typhoeus', firstCast);
    const second = registry.register('typhoeus', { ...firstCast, skillCastId: 8 });

    expect(registry.get('typhoeus')).toBe(firstCast);
    registry.unregister(second);
    expect(registry.get('typhoeus')).toBe(firstCast);
    registry.unregister(first);
    expect(registry.get('typhoeus')).toBeUndefined();
  });

  it('Buff enable 动作在 end 时撤销来源施法身份', () => {
    const registry = new BasicAttackSkillCastInheritanceRegistry();
    const executor = new SkillCastInheritanceOperationExecutor('typhoeus', registry, terminal);
    const context = { blackboard: new ActionBlackboard(), skillCastInfo: firstCast };

    expect(executor.execute(step, context)).toBe(true);
    expect(registry.get('typhoeus')).toBe(firstCast);
    executor.end(step, context);
    expect(registry.get('typhoeus')).toBeUndefined();
  });

  it('恢复动作宿主后只撤销恢复分支的继承登记', () => {
    const originalRegistry = new BasicAttackSkillCastInheritanceRegistry();
    const originalExecutor = new SkillCastInheritanceOperationExecutor(
      'typhoeus',
      originalRegistry,
      terminal,
    );
    const context = { blackboard: new ActionBlackboard(), skillCastInfo: firstCast };
    originalExecutor.execute(step, context);
    const copied = new StateStepper(
      { registry: originalRegistry.runtimeState, actions: originalExecutor.runtimeState },
      () => undefined,
    ).read();
    const restoredRegistry = new BasicAttackSkillCastInheritanceRegistry(copied.registry);
    const restoredExecutor = new SkillCastInheritanceOperationExecutor(
      'typhoeus',
      restoredRegistry,
      terminal,
      { state: copied.actions, programs: originalExecutor.programs },
    );

    restoredExecutor.end(step, context);

    expect(restoredRegistry.get('typhoeus')).toBeUndefined();
    expect(originalRegistry.get('typhoeus')).toBe(firstCast);
  });

  it('缺少 Buff 来源施法身份时严格失败', () => {
    const executor = new SkillCastInheritanceOperationExecutor(
      'typhoeus',
      new BasicAttackSkillCastInheritanceRegistry(),
      terminal,
    );
    expect(() => executor.execute(step, { blackboard: new ActionBlackboard() })).toThrow(
      'requires a source SkillCastInfo',
    );
  });
});
