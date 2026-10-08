/** 修正宿主共用的同步动作调用。临时计算包只在调用期间绑定，不进入切面。 */
import type { ResolvedActionSequence } from '../../compiler/combatProgram';
import type { CombatOperationContext } from '../skills/skillRuntime';
import type { ActionSequenceState } from '../state/actionState';
import type { CombatActionSequenceRuntime } from './combatActionSequenceRuntime';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';

export interface ModifierConditionRuntime<Input> {
  readonly runtimeState: ActionSequenceState;
  execute(input: Input): boolean;
}

export function createModifierConditionRuntime<Input>(
  sequence: ResolvedActionSequence,
  runtime: CombatActionSequenceRuntime,
  bind: (input: Input) => {
    readonly context: NonNullable<CombatOperationContext['modifierContext']>;
    readonly target: RuntimeTargetRef | undefined;
  },
  state?: ActionSequenceState,
): ModifierConditionRuntime<Input> {
  const context: { -readonly [K in keyof CombatOperationContext]: CombatOperationContext[K] } = {
    ...runtime.context,
    event: undefined,
    eventSkillCastInfo: undefined,
    actionInputTarget: undefined,
    currentTarget: undefined,
    modifierContext: undefined,
  };
  const action = runtime.createSequence(sequence, context, state);
  return {
    runtimeState: action.runtimeState,
    execute(input) {
      const previous = {
        actionInputTarget: context.actionInputTarget,
        currentTarget: context.currentTarget,
        modifierContext: context.modifierContext,
      };
      const binding = bind(input);
      try {
        context.actionInputTarget = binding.target;
        context.currentTarget = binding.target;
        context.modifierContext = binding.context;
        return action.tryExecute({}, true);
      } finally {
        Object.assign(context, previous);
      }
    },
  };
}
