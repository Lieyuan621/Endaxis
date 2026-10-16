import { conditionInputExpression } from '../../compiler/compiledGraphData';
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
      if (node === undefined) return false;
      const { action } = node;
      if (action.kind !== 'checkCondition') return false;
      const condition = conditionInputExpression(action.parameters.condition);
      switch (condition.kind) {
        case 'targetsEqual': {
          const { first, second } = condition;
          if (!(
            (first.kind === 'context' &&
              first.key === 'trigger' &&
              second.kind === 'mainCharacter') ||
            (second.kind === 'context' &&
              second.key === 'trigger' &&
              first.kind === 'mainCharacter')
          ))
            return false;
          requiresControlledTarget = true;
          break;
        }
        case 'checkMainCharacter':
          if (condition.target.kind !== 'context' || condition.target.key !== 'trigger')
            return false;
          requiresControlledTarget = true;
          break;
        case 'healthCompare':
          if (condition.target.kind !== 'context' || condition.target.key !== 'trigger')
            return false;
          break;
        case 'eventDamageFeaturesMatch':
          break;
        case 'targetObjectTypeMatch':
          if (
            condition.target.kind !== 'inputTarget' ||
            condition.objectTypes === 'all' ||
            condition.objectTypes.length !== 1 ||
            condition.objectTypes[0] !== 'enemy'
          )
            return false;
          break;
        default:
          return false;
      }
      entry = node.next;
    }
    return requiresControlledTarget;
  });
}
