import type { CompiledComboSkillConditionProgram } from '../../compiler/combatProgram';

/** 当前木桩不攻击干员。仅识别明确的主控受击条件链，未知结构仍保留诊断。 */
export function hasUnmodeledIncomingAttackTrigger(
  programs: readonly CompiledComboSkillConditionProgram[],
  skillKey: string,
): boolean {
  return programs.some(program => {
    if (program.skillKey !== skillKey || program.event !== 'takeDamage') return false;
    let sequence = program.sequence;
    let requiresControlledTarget = false;
    while (sequence.steps.length === 1) {
      const step = sequence.steps[0]!;
      if (step.kind !== 'conditional' || step.whenFalse || step.parameters.alwaysNext) return false;
      const condition = step.parameters.condition;
      switch (condition.kind) {
        case 'contextTargetIdentityMatch':
          if (
            condition.contextKey !== 'trigger' ||
            condition.other !== 'controlledOperator' ||
            condition.operator !== 'equal'
          )
            return false;
          requiresControlledTarget = true;
          break;
        case 'healthCompare':
          if (condition.target !== 'contextTarget' || condition.contextKey !== 'trigger')
            return false;
          break;
        case 'eventDamageFeaturesMatch':
          break;
        case 'actionInputTargetObjectTypeMatch':
          if (condition.objectTypes.length !== 1 || condition.objectTypes[0] !== 'enemy')
            return false;
          break;
        default:
          return false;
      }
      sequence = step.whenTrue;
    }
    return sequence.steps.length === 0 && requiresControlledTarget;
  });
}
