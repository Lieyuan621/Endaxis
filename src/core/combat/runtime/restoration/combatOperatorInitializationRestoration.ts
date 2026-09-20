/**
 * 恢复一名干员已经完成装配的养成与装备初始化序列。
 *
 * 初始化在新战斗中只执行一次。恢复时只重建序列对象、步骤数据和结束清理关系，绝不再次执行
 * 初始化或启用动作。装备初始化继续共享对应贡献的黑板，并把长期 Buff 所有权交回装备宿主。
 */
import type { CompiledOperatorInitializationProgram } from '../../../compiler/combatProgram';
import type { BuffApplicationHandle } from '../../buffs/combatBuffs';
import type { ActionSequence } from '../../actions/actionSequence';
import { ActionBlackboard } from '../../actions/actionBlackboard';
import { CombatActionSequenceRuntime } from '../../actions/combatActionSequenceRuntime';
import type { CombatSemanticEventRuntime } from '../../events/combatSemanticEventRuntime';
import type { EquipmentEventRuntime } from '../../abilities/equipmentEventRuntime';
import type { OperatorInitializationState } from '../../state/abilityState';
import type { CombatOperationExecutor } from '../../skills/skillRuntime';

export interface RestoreCombatOperatorInitializationsOptions {
  readonly operatorId: string;
  readonly programs: readonly CompiledOperatorInitializationProgram[];
  readonly states: ReadonlyMap<string, OperatorInitializationState>;
  readonly semanticEvents: CombatSemanticEventRuntime;
  readonly equipment?: EquipmentEventRuntime;
  readonly createOperations: (
    program: CompiledOperatorInitializationProgram,
    state: OperatorInitializationState,
  ) => CombatOperationExecutor;
}

export interface RestoredCombatOperatorInitialization {
  readonly state: OperatorInitializationState;
  readonly blackboard: ActionBlackboard;
  readonly initializationSequence: ActionSequence;
  readonly enableSequence: ActionSequence | null;
}

export function bindRestoredCombatOperatorInitializations(
  options: RestoreCombatOperatorInitializationsOptions,
): ReadonlyMap<string, RestoredCombatOperatorInitialization> {
  const expected = new Set(options.programs.map(program => program.key));
  for (const key of options.states.keys()) {
    if (!expected.has(key)) {
      throw new Error(`restored initialization '${options.operatorId}:${key}' is unknown`);
    }
  }
  const result = new Map<string, RestoredCombatOperatorInitialization>();
  for (const program of options.programs) {
    const state = options.states.get(program.key);
    if (state === undefined) {
      throw new Error(`restored initialization '${options.operatorId}:${program.key}' is missing`);
    }
    if (state.key !== program.key) {
      throw new Error(
        `restored initialization '${options.operatorId}:${program.key}' has another key`,
      );
    }
    if (state.equipmentContributionIndex !== program.equipmentContributionIndex) {
      throw new Error(
        `restored initialization '${options.operatorId}:${program.key}' has another equipment contribution`,
      );
    }
    const contributionIndex = program.equipmentContributionIndex;
    const blackboard =
      contributionIndex === undefined
        ? ActionBlackboard.bindRuntimeState(state.blackboard)
        : options.equipment?.blackboardFor(contributionIndex);
    if (blackboard === undefined) {
      throw new Error(
        `restored initialization '${options.operatorId}:${program.key}' has no equipment runtime`,
      );
    }
    if (blackboard.runtimeState !== state.blackboard) {
      throw new Error(
        `restored initialization '${options.operatorId}:${program.key}' uses another equipment blackboard`,
      );
    }
    const operations = options.createOperations(program, state);
    if (operations.operationHost?.state !== state.operations) {
      throw new Error(
        `restored initialization '${options.operatorId}:${program.key}' uses another operation state`,
      );
    }
    const context = {
      blackboard,
      actionOwnerId: options.operatorId,
      ...(contributionIndex === undefined
        ? {}
        : {
            actionSourceId: options.operatorId,
            addAbilityChildBuff: (child: BuffApplicationHandle) =>
              options.equipment!.addChildBuff(contributionIndex, child),
          }),
    };
    const runtime = new CombatActionSequenceRuntime(
      operations,
      context,
      {},
      options.semanticEvents,
      options.operatorId,
    );
    const initializationSequence = runtime.createSequence(
      program.sequence,
      context,
      state.initializationSequence,
    );
    let enableSequence: ActionSequence | null = null;
    if (program.enableSequence === undefined) {
      if (state.enableSequence !== null) {
        throw new Error(
          `restored initialization '${options.operatorId}:${program.key}' has an unexpected enable sequence`,
        );
      }
    } else {
      if (state.enableSequence === null) {
        throw new Error(
          `restored initialization '${options.operatorId}:${program.key}' has no enable sequence`,
        );
      }
      enableSequence = runtime.createSequence(
        program.enableSequence,
        context,
        state.enableSequence,
      );
      options.equipment!.onDisable(contributionIndex!, () => enableSequence!.end({}));
    }
    result.set(program.key, { state, blackboard, initializationSequence, enableSequence });
  }
  return result;
}
