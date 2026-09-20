import type {
  CombatReceiptEntry,
  CombatReceiptValue,
} from '../../../core/combat/receipt/combatReceipt';

export interface TimelineBattleLogEntrySummaryOptions {
  readonly damageTypeLabel: (damageType: string) => string;
  readonly formatValue: (value: CombatReceiptValue) => string;
  readonly overhealingLabel: (value: string) => string;
  readonly semanticLabel: (group: 'flag' | 'inflictionOutcome' | 'reason', value: string) => string;
}

function number(data: CombatReceiptEntry['data'], key: string): number | null {
  const value = data?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function string(data: CombatReceiptEntry['data'], key: string): string | null {
  const value = data?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function transition(previous: number | null, current: number | null): string | null {
  return previous === null || current === null ? null : `${previous} → ${current}`;
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
 * 将一条已发生回执压缩为日志行摘要。这里只选择并排版现有标量；缺字段时回退到通用键值，
 * 不根据事件时间或邻近技能推断来源。
 */
export function summarizeTimelineBattleLogEntry(
  entry: CombatReceiptEntry,
  options: TimelineBattleLogEntrySummaryOptions,
): string {
  const data = entry.data;
  const formatNumber = (value: number): string => options.formatValue(value);
  switch (entry.event) {
    case 'DamageApplied':
    case 'BuffDamageApplied':
      return compact([
        string(data, 'damageType') === null
          ? null
          : options.damageTypeLabel(string(data, 'damageType')!),
        number(data, 'value') === null ? null : formatNumber(number(data, 'value')!),
      ]);
    case 'SpellBurstApplied':
      return compact([
        string(data, 'burstType'),
        number(data, 'value') === null ? null : formatNumber(number(data, 'value')!),
      ]);
    case 'HealingApplied':
      return compact([
        signed(number(data, 'actualHealing'), formatNumber),
        number(data, 'overhealing') === null
          ? null
          : options.overhealingLabel(formatNumber(number(data, 'overhealing')!)),
      ]);
    case 'PoiseApplied':
      return compact([
        transition(number(data, 'previousPoise'), number(data, 'currentPoise')),
        data?.brokePoise === true ? options.semanticLabel('flag', 'poiseBreak') : null,
        data?.cancelled === true ? options.semanticLabel('flag', 'cancelled') : null,
      ]);
    case 'SpChanged':
    case 'UltimateEnergyChanged':
      return compact([
        transition(number(data, 'previousValue'), number(data, 'currentValue')),
        signed(number(data, 'actualValue'), formatNumber),
      ]);
    case 'BuffApplied':
    case 'BuffPresentationStarted':
      return compact([
        string(data, 'buffId'),
        number(data, 'layers') === null ? null : `×${formatNumber(number(data, 'layers')!)}`,
      ]);
    case 'BuffFinished':
    case 'BuffPresentationFinished':
      return compact([
        string(data, 'buffId'),
        string(data, 'reason') === null
          ? null
          : options.semanticLabel('reason', string(data, 'reason')!),
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
        string(data, 'reaction'),
        number(data, 'level') === null ? null : `Lv.${formatNumber(number(data, 'level')!)}`,
        number(data, 'durationSeconds') === null
          ? null
          : `${options.formatValue(number(data, 'durationSeconds')!)}s`,
      ]);
    case 'ElementalReactionConsumed':
      return compact([
        string(data, 'reaction'),
        number(data, 'level') === null ? null : `Lv.${formatNumber(number(data, 'level')!)}`,
        data?.consumed === false ? options.semanticLabel('flag', 'notConsumed') : null,
      ]);
    case 'StatusChanged':
      return compact([
        string(data, 'statusKey'),
        transition(number(data, 'previousStacks'), number(data, 'currentStacks')),
        string(data, 'reason') === null
          ? null
          : options.semanticLabel('reason', string(data, 'reason')!),
      ]);
    case 'AbilityEntitySpawned':
      return compact([
        string(data, 'abilityEntityId'),
        string(data, 'childSkillId'),
        number(data, 'remainingDurationSeconds') === null
          ? null
          : `${options.formatValue(number(data, 'remainingDurationSeconds')!)}s`,
      ]);
    case 'AbilityEntityChildSkillRequested':
      return compact([string(data, 'abilityEntityId'), string(data, 'childSkillId')]);
    case 'AbilityEntityFinished':
      return compact([
        string(data, 'abilityEntityId'),
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
        string(data, 'skillId'),
        number(data, 'remainingFrames') === null
          ? null
          : `${formatNumber(number(data, 'remainingFrames')!)}f`,
      ]);
    default:
      if (data === undefined) return '';
      return Object.entries(data)
        .slice(0, 2)
        .map(([key, value]) => `${key}=${options.formatValue(value)}`)
        .join(' · ');
  }
}
