/** 把模拟告警转换成玩家能读懂的技能块提示；技能名称由时间轴提供，内部诊断保留在回执中。 */
import type { TimelineSkillDiagnosticReason } from './useScenarioSimulation';
import type { SkillAvailabilityDiagnosticReason } from '../../core/projection/skillAvailabilityDiagnostics';
import type { SkillExecutionDiagnosticReason } from '../../core/projection/skillExecutionDiagnostics';
import type { ComboWindowDiagnosticReason } from '../../core/projection/comboWindowDiagnostics';

type Translate = (key: string, values?: Record<string, string>) => string;

const warningKeys: Record<
  | SkillAvailabilityDiagnosticReason
  | SkillExecutionDiagnosticReason
  | ComboWindowDiagnosticReason
  | 'skillGroupInputRejected'
  | 'skillGroupInterrupted',
  string
> = {
  resourceUnavailable: 'resourceUnavailable',
  cooldownUnavailable: 'cooldownUnavailable',
  skillInputMismatch: 'inputMismatch',
  skillInputUnknown: 'inputUnknown',
  skillInterruptUnavailable: 'interruptUnavailable',
  skillInterruptUnknown: 'interruptUnknown',
  ultimateInputDuringPresentation: 'duringUltimate',
  skillCommonTagUnavailable: 'cannotUseSkills',
  skillTypeTagUnavailable: 'cannotUseSkillType',
  attackDuringDashWindow: 'afterDodge',
  costPaymentRejected: 'costRejected',
  windowMissing: 'comboUnavailable',
  releaseOrderMismatch: 'comboOrder',
  skillStageMismatch: 'comboStage',
  skillGroupInputRejected: 'groupNotStarted',
  skillGroupInterrupted: 'groupInterrupted',
};

function inputUnknownKey(detail: string): string {
  if (detail === 'multiple active command mappings have unresolved priority')
    return 'conflictingSkillChanges';
  if (detail === 'current skill has conditional input actions') return 'conditionalSkillChange';
  if (detail === 'special basic-attack selection state is not modelled')
    return 'specialAttackUnknown';
  return 'inputUnknown';
}

export function formatSkillBlockWarnings(options: {
  reasons: readonly TimelineSkillDiagnosticReason[];
  skillLabel?: string;
  /** 读取定义失败时不把原始异常和技能 ID 直接显示在技能块上。 */
  definitionUnavailable?: boolean;
  castLabel: (castId: string) => string | undefined;
  triggeredSkillLabel: (skillId: string) => string | undefined;
  t: Translate;
}): string {
  const { t } = options;
  const skill = options.skillLabel ?? t('timeline.skillWarnings.thisSkill');
  const text = (key: string, values: Record<string, string> = {}) =>
    t(`timeline.skillWarnings.${key}`, { skill, ...values });
  if (options.definitionUnavailable) return text('definitionUnavailable');

  const lines = options.reasons.map(reason => {
    if (reason.startsWith('skillInputMismatch:')) {
      const actualId = /^skillInputMismatch: expected '(.+)', actual '(.+)'$/.exec(reason)?.[2];
      const actual = actualId === undefined ? undefined : options.triggeredSkillLabel(actualId);
      return actual === undefined ? text('inputMismatch') : text('inputMismatchNamed', { actual });
    }
    if (reason.startsWith('skillInterruptUnavailable:')) {
      const currentId = /^skillInterruptUnavailable: cast '(.+)'$/.exec(reason)?.[1];
      const current = currentId === undefined ? undefined : options.castLabel(currentId);
      return current === undefined
        ? text('interruptUnavailable')
        : text('interruptUnavailableNamed', { current });
    }
    if (reason.startsWith('skillInputUnknown:'))
      return text(inputUnknownKey(reason.slice('skillInputUnknown: '.length)));
    if (reason.startsWith('skillInterruptUnknown:')) return text('interruptUnknown');
    // 未识别的诊断只能给出通用提示，不能把内部英文标识符当作玩家文案。
    const key = Object.prototype.hasOwnProperty.call(warningKeys, reason)
      ? warningKeys[reason as keyof typeof warningKeys]
      : 'unknown';
    return text(key);
  });
  const skipped = options.reasons.some(
    reason => reason === 'skillGroupInputRejected' || reason === 'skillGroupInterrupted',
  );
  if (lines.length > 0 && !skipped) lines.push(text('stillSimulated'));
  return [...new Set(lines)].join('\n');
}
