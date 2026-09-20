/**
 * 恢复一个能力实体实例持有的原生被动来源。
 *
 * 能力实体被动的动作所有者、来源、当前目标和可选施法信息都属于具体实体实例，不能按普通干员
 * 被动处理。恢复只绑定保存的黑板、序列、订阅和启用状态，不重新执行启用动作。
 */
import type {
  CompiledOperatorPassiveProgram,
  ResolvedAbilityEntityDefinition,
} from '../../../compiler/combatProgram';
import type { AbilityEntityTargetRef } from '../../../game-data/logicalAbilityEntity';
import { logicalAbilityEntityRuntimeId } from '../../../game-data/logicalAbilityEntity';
import {
  failAfterAbilityHostCleanup,
  runAbilityHostCleanup,
} from '../../abilities/abilityEventHostLifecycle';
import {
  PassiveAbilityEventRuntime,
  type RegisterPassiveAbilityEventAction,
} from '../../abilities/passiveAbilityEventRuntime';
import { ActionBlackboard } from '../../actions/actionBlackboard';
import { CombatActionSequenceRuntime } from '../../actions/combatActionSequenceRuntime';
import { buffReferenceKey } from '../../buffs/buffReference';
import type { BuffApplicationHandle } from '../../buffs/combatBuffs';
import type { CombatSemanticEventRuntime } from '../../events/combatSemanticEventRuntime';
import type { CombatOperationExecutor } from '../../skills/skillRuntime';
import type { PassiveAbilityEventState } from '../../state/abilityState';
import type { CombatSkillCastInfo } from '../../state/foundationState';
import { type BuffReference } from '../../state/foundationState';

export interface RestoreCombatAbilityEntityPassivesOptions {
  readonly entity: AbilityEntityTargetRef;
  readonly definition: ResolvedAbilityEntityDefinition;
  readonly states: ReadonlyMap<string, PassiveAbilityEventState>;
  readonly entityBlackboard: ActionBlackboard;
  readonly skillCastInfo?: CombatSkillCastInfo | null;
  readonly semanticEvents: CombatSemanticEventRuntime;
  readonly createOperations: (
    program: CompiledOperatorPassiveProgram,
    state: PassiveAbilityEventState,
  ) => CombatOperationExecutor;
  readonly register: RegisterPassiveAbilityEventAction;
}

export interface RestoredCombatAbilityEntityPassives {
  readonly runtimes: ReadonlyMap<string, PassiveAbilityEventRuntime>;
  bindRestoredChildren(
    resolve: (reference: BuffReference) => BuffApplicationHandle | undefined,
  ): void;
  dispose(): void;
}

export function bindRestoredCombatAbilityEntityPassives(
  options: RestoreCombatAbilityEntityPassivesOptions,
): RestoredCombatAbilityEntityPassives {
  const entityId = logicalAbilityEntityRuntimeId(options.entity.instanceId);
  const programs = options.definition.passiveSkills ?? [];
  const expected = new Set(programs.map(program => program.key));
  for (const key of options.states.keys()) {
    if (!expected.has(key)) throw new Error(`restored ${entityId} passive '${key}' is unknown`);
  }
  const runtimes = new Map<string, PassiveAbilityEventRuntime>();
  try {
    for (const program of programs) {
      const state = options.states.get(program.key);
      if (state === undefined)
        throw new Error(`restored ${entityId} passive '${program.key}' is missing`);
      if (state.blackboard.entity !== options.entityBlackboard.runtimeState) {
        throw new Error(
          `restored ${entityId} passive '${program.key}' uses another entity blackboard`,
        );
      }
      if (state.enableSequence === null) {
        throw new Error(`restored ${entityId} passive '${program.key}' has no enable sequence`);
      }
      const blackboard = ActionBlackboard.bindRuntimeState(state.blackboard);
      const operations = options.createOperations(program, state);
      const ownerContext = {
        blackboard,
        actionOwnerId: entityId,
        actionSourceId: entityId,
        actionOwnerAbilityEntity: options.entity,
        currentTarget: options.entity,
        ...(options.skillCastInfo === undefined || options.skillCastInfo === null
          ? {}
          : { skillCastInfo: options.skillCastInfo }),
      };
      const runtime = new PassiveAbilityEventRuntime(
        operations,
        ownerContext,
        program.abilityEventResponses ?? [],
        options.register,
        state,
      );
      const enableContext = {
        ...ownerContext,
        addAbilityChildBuff: (child: BuffApplicationHandle) => runtime.addChildBuff(child),
      };
      const enableSequence = new CombatActionSequenceRuntime(
        operations,
        enableContext,
        {},
        options.semanticEvents,
        entityId,
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
      const references = new Map<string, BuffReference>();
      for (const state of options.states.values()) {
        for (const reference of state.host.childBuffs) {
          const key = buffReferenceKey(reference);
          if (references.has(key)) {
            throw new Error(`restored ${entityId} child Buff '${key}' is duplicated`);
          }
          references.set(key, reference);
        }
      }
      const children = new Map<string, BuffApplicationHandle>();
      for (const [key, reference] of references) {
        const child = resolve(reference);
        if (child === undefined)
          throw new Error(`restored ${entityId} child Buff '${key}' is missing`);
        children.set(key, child);
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
