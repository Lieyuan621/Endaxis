import { translateBattleLogStatus } from './formatBattleLogLabels';
import type { BattleLogTranslate, BattleLogTranslateExists } from './normalizeEnemyLogForBattleLog';

/** Continuation applies only refresh remaining stacks after partial consume — skip in the battle log. */
export function shouldIncludeOperatorLogEvent(
  event: { type?: string; isContinuation?: boolean; effect?: { hide?: boolean } } | null | undefined,
): boolean {
  if (!event?.type) return false;
  if (event.isContinuation) return false;
  if (event.effect?.hide) return false;
  return event.type === 'OPERATOR_EFFECT_APPLY' || event.type === 'OPERATOR_EFFECT_EXPIRE';
}

export function normalizeOperatorLogEntry(event: Record<string, unknown>) {
  const { type, time, ...rest } = event;
  return {
    type: String(type || ''),
    time: Number(time) || 0,
    channel: 'operator' as const,
    payload: rest,
  };
}

export function isOperatorChannelEntry(entry: { channel?: string } | null | undefined): boolean {
  return entry?.channel === 'operator';
}

export function isOperatorEffectType(type: string | null | undefined): boolean {
  return type === 'OPERATOR_EFFECT_APPLY' || type === 'OPERATOR_EFFECT_EXPIRE';
}

function resolveEffectLabel(
  p: Record<string, unknown>,
  t: BattleLogTranslate,
  te: BattleLogTranslateExists,
): string {
  const effect = p.effect as { name?: string; id?: string } | undefined;
  const key = String(effect?.name || p.id || effect?.id || '').trim();
  return translateBattleLogStatus(t, te, key) || key;
}

export function formatOperatorBattleLogSummary(
  entry: { type?: string; payload?: Record<string, unknown> },
  t: BattleLogTranslate,
  te: BattleLogTranslateExists,
): string {
  const p = entry.payload || {};
  const name = resolveEffectLabel(p, t, te);
  const stacks = Number(p.stacks ?? p.cumulativeStacks ?? p.stacksToConsume);
  const stackLabel = Number.isFinite(stacks) && stacks > 0 ? `×${stacks}` : '';
  return [name, stackLabel].filter(Boolean).join(' ');
}

export function formatOperatorBattleLogLine(
  entry: { type?: string; time?: number; payload?: Record<string, unknown> },
  opts: {
    t: BattleLogTranslate;
    te: BattleLogTranslateExists;
    formatTime?: (timeSeconds: number) => string;
    typeLabel?: (type: string) => string;
    trackName?: (trackId: string) => string;
  },
): string {
  const timeLabel = (opts.formatTime || ((s: number) => `${Number(s).toFixed(3)}s`))(
    Number(entry.time) || 0,
  );
  const type = String(entry.type || '');
  const typeLabel = opts.typeLabel?.(type) || type;
  const summary = formatOperatorBattleLogSummary(entry, opts.t, opts.te);
  const verb =
    entry.type === 'OPERATOR_EFFECT_EXPIRE'
      ? opts.t('battleLog.ui.effectRemove')
      : opts.t('battleLog.ui.effectApply');
  const targetId = String(entry.payload?.targetTrackId || '');
  const target = targetId && opts.trackName ? opts.trackName(targetId) : targetId;
  const targetPart = target ? ` -> ${target}` : '';
  return `[${timeLabel}] [${typeLabel}] ${verb} ${summary}${targetPart}`.trim();
}

/** Skill-sheet hits vs trigger / reaction / DoT damage. */
export function isEffectOriginDamage(entry: {
  type?: string;
  payload?: { hitData?: { triggered?: boolean; _reactionMeta?: unknown; triggeredBy?: string } };
}): boolean {
  if (entry?.type !== 'DAMAGE_HIT') return false;
  const hit = entry.payload?.hitData;
  if (!hit) return false;
  if (hit.triggered) return true;
  if (hit._reactionMeta) return true;
  const by = String(hit.triggeredBy || '');
  return by.startsWith('dot:') || by.startsWith('reaction:') || by.startsWith('triggered:');
}
