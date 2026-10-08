/** 从条件图提取可说明的限制，不参与条件执行。 */
import {
  conditionInputExpression,
  type CompiledConditionInput,
} from '../../compiler/compiledGraphData';
import { rootActionSteps } from '../../compiler/actionProgramInspection';
import type { ResolvedActionSequence } from '../../compiler/combatProgram';
import type { BuffConditionSummary } from '../receipt/combatReceipt';

/** 仅识别确定的必要条件；写入、反向分支和未解释节点不参与摘要推断。 */
export function summarizeModifierCondition(sequence: ResolvedActionSequence): BuffConditionSummary {
  const requirements = new Set<BuffConditionSummary['requirements'][number]>();
  let partial = false;
  function condition(input: CompiledConditionInput) {
    const value = conditionInputExpression(input);
    if (value.kind === 'all') value.conditions.forEach(condition);
    else if (value.kind === 'casterControlled') requirements.add('casterControlled');
    else if (value.kind === 'eventSkillCastMatchesBuffSource') requirements.add('sameSkillCast');
    else if (
      value.kind === 'eventDamageTagsMatch' &&
      value.match === 'hasAny' &&
      value.tags.length === 1 &&
      value.tags[0] === 'normalAttackLastCombo'
    )
      requirements.add('heavyAttack');
    else partial = true;
  }
  function visit(entry: ResolvedActionSequence) {
    for (const step of rootActionSteps(entry)) {
      if (
        step.kind !== 'conditional' ||
        step.whenFalse !== undefined ||
        step.parameters.alwaysNext === true
      ) {
        partial = true;
        // 后续条件可能依赖此处的写入；不把写入后的判断解释成原始输入限制。
        return false;
      }
      condition(step.parameters.condition);
      if (!visit(step.whenTrue)) return false;
    }
    return true;
  }
  visit(sequence);
  return { requirements: [...requirements], partial };
}
