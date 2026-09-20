/**
 * 恢复一名干员的常驻被动来源宿主。
 *
 * 被动的事件响应、启用序列、动作宿主和局部黑板必须作为一个整体绑定。这里不会再次执行启用
 * 序列，也不会重新开放宿主；保存数据中的启用状态就是恢复后的状态。所有 Buff 目标完成实例
 * 恢复后，再通过返回对象一次性接回被动持有的子 Buff。
 */
import type { CompiledOperatorPassiveProgram } from '../../../compiler/combatProgram';
import {
  failAfterAbilityHostCleanup,
  runAbilityHostCleanup,
} from '../../abilities/abilityEventHostLifecycle';
import type {
  PassiveAbilityEventRuntime,
  RegisterPassiveAbilityEventAction,
} from '../../abilities/passiveAbilityEventRuntime';
import { PassiveAbilityEventRuntime as PassiveRuntime } from '../../abilities/passiveAbilityEventRuntime';
import { ActionBlackboard } from '../../actions/actionBlackboard';
import { CombatActionSequenceRuntime } from '../../actions/combatActionSequenceRuntime';
import { buffReferenceKey } from '../../buffs/buffReference';
import type { BuffApplicationHandle } from '../../buffs/combatBuffs';
import type { CombatSemanticEventRuntime } from '../../events/combatSemanticEventRuntime';
import type { CombatOperationExecutor } from '../../skills/skillRuntime';
import type { PassiveAbilityEventState } from '../../state/abilityState';
import { type BuffReference } from '../../state/foundationState';

export interface RestoreCombatOperatorPassivesOptions {
  readonly operatorId: string;
  readonly programs: readonly CompiledOperatorPassiveProgram[];
  readonly states: ReadonlyMap<string, PassiveAbilityEventState>;
  readonly operatorBlackboard: ActionBlackboard;
  readonly semanticEvents: CombatSemanticEventRuntime;
  readonly createOperations: (
    program: CompiledOperatorPassiveProgram,
    state: PassiveAbilityEventState,
  ) => CombatOperationExecutor;
  readonly register: RegisterPassiveAbilityEventAction;
}

export interface RestoredCombatOperatorPassives {
  readonly runtimes: ReadonlyMap<string, PassiveAbilityEventRuntime>;
  bindRestoredChildren(
    resolve: (reference: BuffReference) => BuffApplicationHandle | undefined,
  ): void;
  dispose(): void;
}

export function bindRestoredCombatOperatorPassives(
  options: RestoreCombatOperatorPassivesOptions,
): RestoredCombatOperatorPassives {
  const expected = new Set(options.programs.map(program => program.key));
  for (const key of options.states.keys()) {
    if (!expected.has(key))
      throw new Error(`restored passive '${options.operatorId}:${key}' is unknown`);
  }
  const runtimes = new Map<string, PassiveAbilityEventRuntime>();
  try {
    for (const program of options.programs) {
      const state = options.states.get(program.key);
      if (state === undefined) {
        throw new Error(`restored passive '${options.operatorId}:${program.key}' is missing`);
      }
      if (state.blackboard.entity !== options.operatorBlackboard.runtimeState) {
        throw new Error(
          `restored passive '${options.operatorId}:${program.key}' uses another entity blackboard`,
        );
      }
      if (state.enableSequence === null) {
        throw new Error(
          `restored passive '${options.operatorId}:${program.key}' has no enable sequence`,
        );
      }
      const blackboard = ActionBlackboard.bindRuntimeState(state.blackboard);
      const operations = options.createOperations(program, state);
      const ownerContext = {
        blackboard,
        actionOwnerId: options.operatorId,
        actionSourceId: options.operatorId,
      };
      const runtime = new PassiveRuntime(
        operations,
        ownerContext,
        program.abilityEventResponses ?? [],
        options.register,
        state,
      );
      const enableContext = {
        blackboard,
        addAbilityChildBuff: (child: BuffApplicationHandle) => runtime.addChildBuff(child),
      };
      const enableSequence = new CombatActionSequenceRuntime(
        operations,
        enableContext,
        {},
        options.semanticEvents,
        options.operatorId,
      ).createSequence(program.enableSequence, enableContext, state.enableSequence);
      runtime.recordEnableSequence(enableSequence.runtimeState);
      runtime.onDisable(() => enableSequence.end({}));
      runtimes.set(program.key, runtime);
    }
  } catch (error) {
    failAfterAbilityHostCleanup(
      error,
      [...runtimes.values()].map(runtime => () => runtime.dispose()),
    );
  }

  return {
    runtimes,
    bindRestoredChildren(resolve) {
      const children = new Map<string, BuffApplicationHandle>();
      for (const state of options.states.values()) {
        for (const reference of state.host.childBuffs) {
          const key = buffReferenceKey(reference);
          if (children.has(key)) continue;
          const child = resolve(reference);
          if (child === undefined) {
            throw new Error(
              `restored passive child Buff '${reference.ownerId}:${reference.instanceId}' is missing`,
            );
          }
          children.set(key, child);
        }
      }
      for (const runtime of runtimes.values()) {
        runtime.bindRestoredChildren(reference => children.get(buffReferenceKey(reference)));
      }
    },
    dispose() {
      runAbilityHostCleanup([...runtimes.values()].map(runtime => () => runtime.dispose()));
    },
  };
}
