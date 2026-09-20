import type { ResolvedActionSequence } from '../../compiler/combatProgram';
import type { DamageModifierConditionProgram } from './damageModifiers';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';

/**
 * 为已有 Buff 动作运行时绑定同步伤害条件入口。黑板和作用域归原 Buff 实例所有。
 * 当前接通公共条件分支与黑板运算；持续动作未接入此瞬时入口，不静默只执行首帧。
 */
export function createDamageModifierConditionProgram(
  sequence: ResolvedActionSequence,
  runtime: CombatActionSequenceRuntime,
  ports: {
    readonly getBuffAffixSkillCastId?: () => number | null;
    readonly resolveInputTarget?: (entityId: string) => RuntimeTargetRef;
  } = {},
): DamageModifierConditionProgram {
  assertSynchronousModifierSequence(sequence);
  return {
    execute(input) {
      const otherId = input.side === 'attacker' ? input.targetId : input.sourceId;
      const action = runtime.createSequence(sequence, {
        ...runtime.context,
        // 原生为临时 Context；不能把创建程序时的外部事件或 InputTarget 带进本次判断。
        event: undefined,
        eventSkillCastInfo: undefined,
        actionInputTarget: ports.resolveInputTarget?.(otherId),
        currentTarget: undefined,
        beforeApplyDamageModifier: {
          ...input,
          getBuffAffixSkillCastId: ports.getBuffAffixSkillCastId,
        },
      });
      // 与公共 ExecuteInstant 相同的布尔短路及 End/Reset；额外保证错误也不会遗留动作状态。
      const context = {};
      try {
        action.reset(context);
        return action.tryExecute(context);
      } finally {
        try {
          action.end(context);
        } finally {
          action.reset(context);
        }
      }
    },
  };
}

function assertSynchronousModifierSequence(
  sequence: ResolvedActionSequence,
  path = 'damage modifier condition',
): void {
  for (const [index, step] of sequence.steps.entries()) {
    const stepPath = `${path}.steps[${index}]`;
    if (step.kind === 'conditional') {
      assertSynchronousModifierSequence(step.whenTrue, `${stepPath}.whenTrue`);
      if (step.whenFalse !== undefined)
        assertSynchronousModifierSequence(step.whenFalse, `${stepPath}.whenFalse`);
    } else if (
      step.kind !== 'modifyActionValue' &&
      step.kind !== 'calculateActionValue' &&
      step.kind !== 'readBuffStackCount'
    ) {
      throw new Error(`${stepPath}: unsupported synchronous modifier step '${step.kind}'`);
    }
  }
}
