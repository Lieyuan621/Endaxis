import { numberInput } from '../../../test/compiledGraphInputs';
import { expect, it, vi } from 'vitest';
import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import { ActionBlackboard } from '../actions/actionBlackboard';
import type { ActionRegistrationState } from '../state/actionState';
import { TyphoeaArcheryRuntime } from './typhoeaArcherySelection';
import { TyphoeaArcheryOperationExecutor } from './typhoeaArcheryOperationExecutor';

it('动作求值一次并保存注册句柄，恢复后结束只注销原句柄', () => {
  const registry = new TyphoeaArcheryRuntime();
  const state: ActionRegistrationState = { registrationIds: [] };
  const context = {
    blackboard: new ActionBlackboard({ count: 2 }),
    actionSourceId: 'operator',
    actionRegistrationState: state,
  };
  const register = vi.fn((request: { targetCount: number }) =>
    registry.register(request.targetCount),
  );
  const unregister = vi.fn((id: number) => {
    registry.unregister(id);
  });
  const delegate = { execute: vi.fn(() => false), evaluate: vi.fn(() => false), end: vi.fn() };
  const step: ResolvedCombatStepForKind<'startTyphoeaArchery'> = {
    kind: 'startTyphoeaArchery',
    parameters: {
      targetCount: numberInput({ kind: 'blackboard', key: 'count' }),
      markBuffId: 'mark',
      priorityTags: ['Priority'],
      priorityTagQueryType: 'hasAny',
    },
  };
  const executor = new TyphoeaArcheryOperationExecutor(delegate, register, unregister);
  executor.execute(step, context);
  executor.execute(step, context);
  expect(register).toHaveBeenCalledTimes(1);
  expect(register).toHaveBeenCalledWith(
    {
      targetCount: 2,
      markBuffId: 'mark',
      priorityTags: ['Priority'],
      priorityTagQueryType: 'hasAny',
    },
    context,
  );
  expect(registry.runtimeState.registrations.size).toBe(1);
  // 同一程序节点的第二次调用必须持有独立句柄，结束它不能注销第一次调用。
  const second = { ...context, actionRegistrationState: { registrationIds: [] } };
  executor.execute(step, second);
  expect(registry.runtimeState.registrations.size).toBe(2);
  executor.end(step, second);
  expect(registry.runtimeState.registrations.size).toBe(1);
  unregister.mockClear();
  const saved = structuredClone({ action: state, registry: registry.runtimeState });
  const restoredRegistry = new TyphoeaArcheryRuntime(saved.registry);
  const restoredRegister = vi.fn(() => {
    throw new Error('must not replay registration');
  });
  const restoredEnd = vi.fn((id: number) => {
    restoredRegistry.unregister(id);
  });
  const restored = new TyphoeaArcheryOperationExecutor(delegate, restoredRegister, restoredEnd);
  restored.end(step, { ...context, actionRegistrationState: saved.action });
  restored.end(step, { ...context, actionRegistrationState: saved.action });
  expect(restoredRegister).not.toHaveBeenCalled();
  expect(restoredEnd).toHaveBeenCalledExactlyOnceWith(1);
  expect(restoredRegistry.runtimeState.registrations.size).toBe(0);
  expect(registry.runtimeState.registrations.size).toBe(1);
  executor.end(step, context);
  executor.end(step, context);
  expect(unregister).toHaveBeenCalledExactlyOnceWith(1);
  expect(delegate.execute).not.toHaveBeenCalled();
  expect(delegate.end).not.toHaveBeenCalled();
});
