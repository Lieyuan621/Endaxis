import {
  parseBlackboardAssignmentsSource,
  type BlackboardAssignmentSource,
} from './assignments.ts';
import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';

/** SkillData 根部安装 Buff 时使用的公共载荷；干员、武器和装备不得各自重复解析。 */
export interface SkillBuffInstallSource {
  readonly buffId: string;
  readonly assignBlackboard: boolean;
  readonly assignments: readonly BlackboardAssignmentSource[];
}

export function parseSkillBuffInstallSources(
  value: unknown,
  path: string,
): SkillBuffInstallSource[] {
  return requireArray(value, path).map((rawEntry, index) => {
    const entryPath = `${path}[${index}]`;
    const entry = requireRecord(rawEntry, entryPath);
    requireExactFields(entry, new Set(['buffId', 'assignBlackboard', 'assignItems']), entryPath);
    const assignBlackboard = requireBoolean(
      entry.assignBlackboard,
      `${entryPath}.assignBlackboard`,
    );
    return {
      buffId: requireNonEmptyString(entry.buffId, `${entryPath}.buffId`),
      assignBlackboard,
      assignments: parseBlackboardAssignmentsSource(entry.assignItems, `${entryPath}.assignItems`, {
        enabled: assignBlackboard,
      }),
    };
  });
}
