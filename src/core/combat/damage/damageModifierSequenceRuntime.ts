import { conditionInputExpression } from '../../compiler/compiledGraphData';
import { rootActionSteps } from '../../compiler/actionProgramInspection';
import type { ResolvedActionSequence } from '../../compiler/combatProgram';
import type {
  DamageModifierConditionRuntime,
  DamageModifierConditionInput,
} from './damageModifiers';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { createModifierConditionRuntime } from '../actions/modifierConditionRuntime';
import type { ActionSequenceState } from '../state/actionState';
import { summarizeModifierCondition } from './modifierConditionSummary';

/**
 * 为已有 Buff 动作运行时绑定同步伤害条件入口。黑板和作用域归原 Buff 实例所有。
 * 动作按照原生同步入口执行并逐项复位，不另建条件求值器。
 */
export function createDamageModifierCondition(
  sequence: ResolvedActionSequence,
  runtime: CombatActionSequenceRuntime,
  ports: {
    readonly getBuffAffixSkillCastId?: () => number | null;
    readonly resolveInputTarget?: (entityId: string) => RuntimeTargetRef;
  } = {},
  state?: ActionSequenceState,
): DamageModifierConditionRuntime {
  const steps = rootActionSteps(sequence);
  const guard = steps.length === 1 ? steps[0] : undefined;
  const condition =
    guard?.kind === 'conditional'
      ? conditionInputExpression(guard.parameters.condition)
      : undefined;
  const damageTypes =
    guard?.kind === 'conditional' &&
    guard.parameters.alwaysNext !== true &&
    guard.whenFalse === undefined &&
    guard.whenTrue.entry === null &&
    condition?.kind === 'eventDamageTypeIn'
      ? condition.damageTypes
      : undefined;
  return {
    summary: summarizeModifierCondition(sequence),
    ...(damageTypes === undefined ? {} : { damageTypes }),
    ...createModifierConditionRuntime<DamageModifierConditionInput>(
      sequence,
      runtime,
      input => ({
        context: { kind: 'damage', input, getBuffAffixSkillCastId: ports.getBuffAffixSkillCastId },
        target: ports.resolveInputTarget?.(
          input.side === 'attacker' ? input.targetId : input.sourceId,
        ),
      }),
      state,
    ),
  };
}
