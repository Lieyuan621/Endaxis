import type { CompiledComboSkillConditionProgram } from '../../compiler/combatProgram';

/** 当前木桩不攻击干员。仅识别明确的主控受击条件链，未知结构仍保留诊断。 */
export function hasUnmodeledIncomingAttackTrigger(
  programs: readonly CompiledComboSkillConditionProgram[],
  skillKey: string,
): boolean {
  return programs.some(program => {
    if (program.skillKey !== skillKey || program.event !== 'takeDamage') return false;
    const { graph } = program.sequence;
    let entry = program.sequence.entry;
    let requiresControlledTarget = false;
    while (entry !== null) {
      const node = graph.nodes.get(entry);
      if (node === undefined || node.next !== null) return false;
      const { action } = node;
      if (
        action.kind !== 'conditional' ||
        action.whenFalse !== undefined ||
        action.parameters.alwaysNext
      )
        return false;
      const condition = action.parameters.condition;
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
          if (
            condition.objectTypes === 'all' ||
            condition.objectTypes.length !== 1 ||
            condition.objectTypes[0] !== 'enemy'
          )
            return false;
          break;
        default:
          return false;
      }
      entry = action.whenTrue.$sequence;
    }
    return requiresControlledTarget;
  });
}
