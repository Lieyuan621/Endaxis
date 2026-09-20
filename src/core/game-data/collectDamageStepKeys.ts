/**
 * 递归遍历 SkillDefinition 中的可投影伤害步骤（dealDamage / dealFixedDamage），
 * 返回每个步骤的完整路径与稳定 key（缺失时 key 为空字符串）。
 *
 * 本模块只负责遍历与路径构建，不判定合法/非法；
 * 缺失与重复的判定由 validateSkillDefinition 统一报告。
 */
export interface DamageStepKeyEntry {
  /** 伤害步骤在定义内的完整路径，如 `scheduledSequences[0].sequence.steps[1]`。 */
  readonly path: string;
  /** 步骤的稳定 key；缺失或为空时为空字符串。 */
  readonly key: string;
}

/**
 * 递归收集全部伤害步骤的路径与 key。
 * 条件分支（whenTrue/whenFalse）与所有序列容器体均被遍历。
 */
export function collectDamageStepKeys(definition: unknown): readonly DamageStepKeyEntry[] {
  const entries: DamageStepKeyEntry[] = [];
  if (!isRecord(definition) || !Array.isArray(definition.scheduledSequences)) {
    return entries;
  }
  for (const [sequenceIndex, sequence] of definition.scheduledSequences.entries()) {
    const sequencePath = `scheduledSequences[${sequenceIndex}].sequence`;
    if (
      !isRecord(sequence) ||
      !isRecord(sequence.sequence) ||
      !Array.isArray(sequence.sequence.steps)
    ) {
      continue;
    }
    collectSequenceKeys(sequence.sequence.steps, sequencePath, entries);
  }
  return entries;
}

function collectSequenceKeys(
  steps: readonly unknown[],
  path: string,
  entries: DamageStepKeyEntry[],
): void {
  for (const [stepIndex, step] of steps.entries()) {
    if (!isRecord(step)) continue;
    const stepPath = `${path}.steps[${stepIndex}]`;
    if (step.kind === 'dealDamage' || step.kind === 'dealFixedDamage') {
      entries.push({ path: stepPath, key: typeof step.key === 'string' ? step.key : '' });
      continue;
    }
    if (step.kind === 'switch' && Array.isArray(step.options)) {
      step.options.forEach((option, index) => {
        if (isRecord(option) && isRecord(option.sequence) && Array.isArray(option.sequence.steps)) {
          collectSequenceKeys(
            option.sequence.steps,
            `${stepPath}.options[${index}].sequence`,
            entries,
          );
        }
      });
      continue;
    }
    if (step.kind === 'conditional') {
      if (isRecord(step.whenTrue) && Array.isArray(step.whenTrue.steps)) {
        collectSequenceKeys(step.whenTrue.steps, `${stepPath}.whenTrue`, entries);
      }
      if (isRecord(step.whenFalse) && Array.isArray(step.whenFalse.steps)) {
        collectSequenceKeys(step.whenFalse.steps, `${stepPath}.whenFalse`, entries);
      }
      continue;
    }
    if (step.kind === 'once' && isRecord(step.body) && Array.isArray(step.body.steps)) {
      collectSequenceKeys(step.body.steps, `${stepPath}.once`, entries);
      continue;
    }
    if (
      step.kind === 'withActionBlackboardScope' &&
      isRecord(step.body) &&
      Array.isArray(step.body.steps)
    ) {
      collectSequenceKeys(step.body.steps, `${stepPath}.body`, entries);
      continue;
    }
    if (step.kind === 'repeatEachTick' && isRecord(step.body) && Array.isArray(step.body.steps)) {
      collectSequenceKeys(step.body.steps, `${stepPath}.body`, entries);
      continue;
    }
    if (
      step.kind === 'forEachContextTarget' &&
      isRecord(step.body) &&
      Array.isArray(step.body.steps)
    ) {
      collectSequenceKeys(step.body.steps, `${stepPath}.body`, entries);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
