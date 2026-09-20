/** 将闪避回执归拢为标签结果；不重新判断窗口，也不推测未发生的成功效果。 */
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { DODGE_FORCED_REASONS, DODGE_UNKNOWN_REASONS } from '../combat/skills/dodgeInputRuntime';

export type DodgeMarkerMessageCode =
  | (typeof DODGE_FORCED_REASONS)[number]
  | (typeof DODGE_UNKNOWN_REASONS)[number]
  | 'executed'
  | 'interruptedSkill'
  | 'perfectDodgeDeclared'
  | 'perfectDodgeSkillStarted'
  | 'perfectDodgeWindowInactive'
  | 'nativeSuccessNotTriggered'
  | 'nativeSkillNotStarted'
  | 'missingAbilityEventPublisher';
export interface DodgeMarkerDiagnostic {
  status: 'normal' | 'unverified' | 'warning';
  readonly messages: { code: DodgeMarkerMessageCode; castId?: string }[];
}

export function projectDodgeMarkerDiagnostics(
  entries: readonly CombatReceiptEntry[],
): ReadonlyMap<string, DodgeMarkerDiagnostic> {
  const results = new Map<string, DodgeMarkerDiagnostic>();
  for (const entry of entries) {
    if (
      ![
        'DashInputExecuted',
        'DodgeInputForced',
        'DodgeInputPartiallySimulated',
        'PerfectDodgeDeclared',
        'PerfectDodgeSkillStarted',
        'PerfectDodgeDeclarationForced',
        'PerfectDodgeDeclarationRejected',
      ].includes(entry.event)
    )
      continue;
    const id = entry.data?.dodgeId;
    if (typeof id !== 'string') continue;
    let result = results.get(id);
    if (result === undefined) {
      result = { status: 'normal', messages: [] };
      results.set(id, result);
    }
    const append = (code: DodgeMarkerMessageCode) => result.messages.push({ code });
    switch (entry.event) {
      case 'DashInputExecuted': {
        append('executed');
        if (typeof entry.data?.interruptedSkillId === 'string') {
          const castId = entry.data.interruptedCastId;
          result.messages.push({
            code: 'interruptedSkill',
            ...(typeof castId === 'string' ? { castId } : {}),
          });
        }
        break;
      }
      case 'DodgeInputForced':
        result.status = 'warning';
        for (const reason of DODGE_FORCED_REASONS)
          if (entry.data?.[reason] === true) append(reason);
        break;
      case 'DodgeInputPartiallySimulated':
        if (result.status === 'normal') result.status = 'unverified';
        for (const reason of DODGE_UNKNOWN_REASONS)
          if (entry.data?.[reason] === true) append(reason);
        break;
      case 'PerfectDodgeDeclared':
        append('perfectDodgeDeclared');
        break;
      case 'PerfectDodgeSkillStarted':
        append('perfectDodgeSkillStarted');
        break;
      case 'PerfectDodgeDeclarationForced':
        result.status = 'warning';
        if (entry.data?.missingDodgeProgram === true) append('missingDodgeProgram');
        if (entry.data?.dashNotActive === true) append('perfectDodgeWindowInactive');
        break;
      case 'PerfectDodgeDeclarationRejected': {
        result.status = 'warning';
        const reason = entry.data?.reason;
        if (
          reason === 'nativeSuccessNotTriggered' ||
          reason === 'nativeSkillNotStarted' ||
          reason === 'missingAbilityEventPublisher'
        )
          append(reason);
        break;
      }
    }
  }
  return results;
}
