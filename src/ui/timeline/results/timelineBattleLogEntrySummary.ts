import type {
  CombatReceiptEntry,
  CombatReceiptValue,
} from '../../../core/combat/receipt/combatReceipt';

export interface TimelineBattleLogEntrySummaryOptions {
  readonly damageTypeLabel: (damageType: string) => string;
  readonly formatValue: (value: CombatReceiptValue) => string;
  readonly formatDamage: (value: number) => string;
  readonly overhealingLabel: (value: string) => string;
  readonly semanticLabel: (
    group: 'flag' | 'inflictionOutcome' | 'reason' | 'condition',
    value: string,
  ) => string;
  /** 技能等未知身份不猜测；Buff 无显示名时允许稳定 ID 回退。 */
  readonly identityLabel: (
    kind: 'skill' | 'buff' | 'reaction' | 'status',
    id: string,
    entry: CombatReceiptEntry,
  ) => string | null;
}

function number(data: CombatReceiptEntry['data'], key: string): number | null {
  const value = data?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function string(data: CombatReceiptEntry['data'], key: string): string | null {
  const value = data?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function transition(
  previous: number | null,
  current: number | null,
  format: (value: number) => string,
): string | null {
  return previous === null || current === null ? null : `${format(previous)} → ${format(current)}`;
}

function signed(value: number | null, format: (value: number) => string): string | null {
  if (value === null) return null;
  return `${value > 0 ? '+' : ''}${format(value)}`;
}

function compact(parts: readonly (string | null | undefined)[]): string {
  return parts
    .filter((part): part is string => part !== null && part !== undefined && part !== '')
    .join(' · ');
}

/**
 * 将已发生回执压缩为用户可读摘要。未知字段保留在可展开的原始详情，
 * 不根据邻近技能推断来源；Buff 没有显示名时保留可辨认的 ID。
 */
export function summarizeTimelineBattleLogEntry(
  entry: CombatReceiptEntry,
  options: TimelineBattleLogEntrySummaryOptions,
): string {
  const data = entry.data;
  const formatNumber = (value: number): string => options.formatValue(value);
  const identity = (kind: 'skill' | 'buff' | 'reaction' | 'status', key: string): string | null => {
    const id = string(data, key);
    return id === null ? null : options.identityLabel(kind, id, entry);
  };
  switch (entry.event) {
    case 'SkillInterrupted':
      return string(data, 'reason') === null
        ? ''
        : options.semanticLabel('reason', string(data, 'reason')!);
    case 'CombatConditionEvaluated':
      return typeof data?.passed === 'boolean'
        ? options.semanticLabel('condition', data.passed ? 'passed' : 'failed')
        : '';
    case 'PoiseRecovered':
      return number(data, 'poise') === null ? '' : formatNumber(number(data, 'poise')!);
    case 'SpellBurstApplied':
      return compact([
        number(data, 'value') === null ? null : options.formatDamage(number(data, 'value')!),
      ]);
    case 'HealingApplied':
      return compact([
        signed(number(data, 'actualHealing'), options.formatDamage),
        number(data, 'overhealing') === null
          ? null
          : options.overhealingLabel(options.formatDamage(number(data, 'overhealing')!)),
      ]);
    case 'PoiseApplied':
      return compact([
        transition(number(data, 'previousPoise'), number(data, 'currentPoise'), formatNumber),
        data?.brokePoise === true ? options.semanticLabel('flag', 'poiseBreak') : null,
        data?.cancelled === true ? options.semanticLabel('flag', 'cancelled') : null,
      ]);
    case 'SpChanged':
    case 'UltimateEnergyChanged':
      return compact([
        transition(number(data, 'previousValue'), number(data, 'currentValue'), formatNumber),
        signed(number(data, 'actualValue'), formatNumber),
      ]);
    case 'BuffCreated':
    case 'BuffApplied':
    case 'BuffPresentationStarted':
      return compact([
        identity('buff', 'buffId'),
        number(data, 'layers') === null ? null : `×${formatNumber(number(data, 'layers')!)}`,
      ]);
    case 'BuffFinished':
    case 'BuffReleased':
    case 'BuffPresentationFinished':
      return compact([
        identity('buff', 'buffId'),
        string(data, 'reason') === null
          ? null
          : options.semanticLabel('reason', string(data, 'reason')!),
      ]);
    case 'BuffEnhanceAttempted':
      return compact([
        identity('buff', 'buffId'),
        number(data, 'attemptedLayers') === null
          ? null
          : `+${formatNumber(number(data, 'attemptedLayers')!)}`,
      ]);
    case 'BuffStackChanged':
      return compact([
        identity('buff', 'buffId'),
        transition(number(data, 'previousLayers'), number(data, 'layers'), formatNumber),
      ]);
    case 'ElementalInflictionApplied': {
      const requested = string(data, 'requestedElement');
      const current = string(data, 'currentElement');
      return compact([
        requested === null ? null : options.damageTypeLabel(requested),
        current === null
          ? null
          : `${options.damageTypeLabel(current)} ×${formatNumber(number(data, 'currentLayers') ?? 0)}`,
        string(data, 'outcomeKind') === null
          ? null
          : options.semanticLabel('inflictionOutcome', string(data, 'outcomeKind')!),
      ]);
    }
    case 'ElementalReactionApplied':
      return compact([
        identity('reaction', 'reaction'),
        number(data, 'level') === null ? null : `Lv.${formatNumber(number(data, 'level')!)}`,
        number(data, 'durationSeconds') === null
          ? null
          : `${options.formatValue(number(data, 'durationSeconds')!)}s`,
      ]);
    case 'ElementalReactionConsumed':
      return compact([
        identity('reaction', 'reaction'),
        number(data, 'level') === null ? null : `Lv.${formatNumber(number(data, 'level')!)}`,
        data?.consumed === false ? options.semanticLabel('flag', 'notConsumed') : null,
      ]);
    case 'StatusChanged':
      return compact([
        identity('status', 'statusKey'),
        transition(number(data, 'previousStacks'), number(data, 'currentStacks'), formatNumber),
        string(data, 'reason') === null
          ? null
          : options.semanticLabel('reason', string(data, 'reason')!),
      ]);
    case 'AbilityEntitySpawned':
      return compact([
        identity('skill', 'childSkillId'),
        number(data, 'remainingDurationSeconds') === null
          ? null
          : `${options.formatValue(number(data, 'remainingDurationSeconds')!)}s`,
      ]);
    case 'AbilityEntityChildSkillRequested':
      return compact([identity('skill', 'childSkillId')]);
    case 'AbilityEntityFinished':
      return compact([
        string(data, 'reason') === null
          ? null
          : options.semanticLabel('reason', string(data, 'reason')!),
      ]);
    case 'SkillCostApplied':
      return compact([
        number(data, 'nonReturnedSpCost') === null
          ? null
          : `SP -${formatNumber(number(data, 'nonReturnedSpCost')!)}`,
        number(data, 'remainingUltimateEnergy') === null
          ? null
          : `ULT ${formatNumber(number(data, 'remainingUltimateEnergy')!)}`,
      ]);
    case 'SkillTimelineJumped':
      return number(data, 'destinationFrame') === null
        ? ''
        : `→ ${formatNumber(number(data, 'destinationFrame')!)}f`;
    case 'SkillCooldownAdjusted':
      return compact([
        identity('skill', 'skillId'),
        number(data, 'remainingFrames') === null
          ? null
          : `${formatNumber(number(data, 'remainingFrames')!)}f`,
      ]);
    default:
      return '';
  }
}
