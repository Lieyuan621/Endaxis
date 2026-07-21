import {
  translateBattleLogElement,
  translateBattleLogStatus,
  formatBattleLogField,
} from './formatBattleLogLabels';

export type BattleLogTranslate = (key: string, values?: Record<string, unknown>) => string;
export type BattleLogTranslateExists = (key: string) => boolean;

export type BattleLogEntry = {
  type: string;
  time: number;
  channel?: 'enemy' | 'operator';
  payload: Record<string, unknown>;
};

/** Enemy-side events that are already mirrored as DAMAGE_HIT / too noisy for the battle log. */
const ENEMY_LOG_SKIP = new Set(['DOT_TICK']);

export function shouldIncludeEnemyLogEvent(event: { type?: string } | null | undefined): boolean {
  return !!(event?.type && !ENEMY_LOG_SKIP.has(event.type));
}

/**
 * Normalize a flat enemyLog event into the `{ type, time, payload }` shape used by SimLogPanel.
 * `sourceId` on most events is an operator track id (used for action attribution).
 */
export function normalizeEnemyLogEntry(event: Record<string, unknown>): BattleLogEntry {
  const { type, time, ...rest } = event;
  return {
    type: String(type || ''),
    time: Number(time) || 0,
    channel: 'enemy' as const,
    payload: rest,
  };
}

/**
 * Collapse a corrosion tick chain into one span:
 * tickIndex 0 starts a new span; later ticks for the same sourceId extend it.
 */
export function mergeCorrosionTicksInBattleLog(entries: BattleLogEntry[]): BattleLogEntry[] {
  const out: BattleLogEntry[] = [];
  let span: BattleLogEntry | null = null;

  const flushSpan = () => {
    if (!span) return;
    out.push(span);
    span = null;
  };

  for (const entry of entries) {
    if (entry.type !== 'CORROSION_TICK') {
      flushSpan();
      out.push(entry);
      continue;
    }

    const sourceId = String(entry.payload?.sourceId || '');
    const tickIndex = Number(entry.payload?.tickIndex) || 0;
    const resShred = Number(entry.payload?.resShred);
    const level = Number(entry.payload?.level) || 1;

    const startsNew =
      !span || String(span.payload.sourceId || '') !== sourceId || tickIndex === 0;

    if (startsNew) {
      flushSpan();
      span = {
        type: 'CORROSION_SPAN',
        time: entry.time,
        channel: 'enemy',
        payload: {
          sourceId,
          level,
          startResShred: Number.isFinite(resShred) ? resShred : 0,
          endResShred: Number.isFinite(resShred) ? resShred : 0,
          tickCount: 1,
          endTime: entry.time,
        },
      };
      continue;
    }

    span.payload.endResShred = Number.isFinite(resShred) ? resShred : span.payload.endResShred;
    span.payload.tickCount = (Number(span.payload.tickCount) || 0) + 1;
    span.payload.endTime = entry.time;
    if (Number.isFinite(level) && level > 0) span.payload.level = level;
  }

  flushSpan();
  return out;
}

export function isEnemyChannelEntry(entry: { channel?: string } | null | undefined): boolean {
  return entry?.channel === 'enemy';
}

export function isEnemyEffectType(type: string | null | undefined): boolean {
  switch (type) {
    case 'INFLICTION_APPLY':
    case 'INFLICTION_CONSUMED':
    case 'ARTS_BURST':
    case 'PHYSICAL_STATUS':
    case 'VULNERABILITY_APPLY':
    case 'VULNERABILITY_CHANGE':
    case 'VULNERABILITY_CONSUMED':
    case 'DEBUFF_APPLY':
    case 'ENEMY_STATUS_APPLY':
    case 'ENEMY_EFFECT_EXPIRE':
    case 'CORROSION_SPAN':
      return true;
    default:
      return false;
  }
}

export function isEnemyReactionType(type: string | null | undefined): boolean {
  return type === 'REACTION_TRIGGER';
}

function formatStacks(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : '';
}

function formatResShred(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Human-readable summary line for an enemy-channel battle-log entry. */
export function formatEnemyBattleLogSummary(
  entry: { type?: string; payload?: Record<string, unknown> },
  t: BattleLogTranslate,
  te: BattleLogTranslateExists,
): string {
  const p = entry.payload || {};
  switch (entry.type) {
    case 'INFLICTION_APPLY': {
      const elem = translateBattleLogElement(t, te, String(p.element || ''));
      const stacks = formatStacks(p.stacks);
      const parts = [elem, stacks ? `×${stacks}` : ''].filter(Boolean);
      if (p.triggerOnly) parts.push(`(${t('battleLog.ui.triggerOnly')})`);
      return parts.join(' ');
    }
    case 'INFLICTION_CONSUMED': {
      const elem = translateBattleLogElement(t, te, String(p.element || ''));
      const stacks = formatStacks(p.consumedStacks);
      return [elem, stacks ? `×${stacks}` : ''].filter(Boolean).join(' ');
    }
    case 'ARTS_BURST':
      return translateBattleLogElement(t, te, String(p.element || ''));
    case 'REACTION_TRIGGER': {
      const name = translateBattleLogStatus(
        t,
        te,
        String(p.reactionType || p.reactionName || ''),
      );
      const level = formatStacks(p.level);
      return level ? `${name} Lv${level}` : name;
    }
    case 'PHYSICAL_STATUS': {
      const name = translateBattleLogStatus(t, te, String(p.physicalType || ''));
      if (p.actualControl === false) return `${name} (${t('battleLog.ui.noControl')})`;
      return name;
    }
    case 'VULNERABILITY_APPLY':
    case 'VULNERABILITY_CHANGE': {
      const trigger = translateBattleLogStatus(t, te, String(p.trigger || p.physicalType || ''));
      const stacks = formatStacks(p.stacks);
      return [trigger, stacks ? `×${stacks}` : ''].filter(Boolean).join(' ');
    }
    case 'VULNERABILITY_CONSUMED': {
      const by = translateBattleLogStatus(t, te, String(p.consumedBy || ''));
      const stacks = formatStacks(p.consumedStacks);
      return [by, stacks ? `×${stacks}` : ''].filter(Boolean).join(' ');
    }
    case 'DEBUFF_APPLY': {
      const name = translateBattleLogStatus(t, te, String(p.debuffType || ''));
      const level = formatStacks(p.level);
      return level ? `${name} Lv${level}` : name;
    }
    case 'ENEMY_STATUS_APPLY': {
      const name = translateBattleLogStatus(t, te, String(p.id || ''));
      const stacks = formatStacks(p.stacks);
      return [name, stacks ? `×${stacks}` : ''].filter(Boolean).join(' ');
    }
    case 'ENEMY_EFFECT_EXPIRE': {
      const kind = String(p.kind || '');
      if (kind === 'infliction') {
        return translateBattleLogElement(t, te, String(p.element || ''));
      }
      if (kind === 'debuff') {
        return translateBattleLogStatus(t, te, String(p.debuffType || ''));
      }
      if (kind === 'status') {
        return translateBattleLogStatus(t, te, String(p.id || ''));
      }
      if (kind === 'vulnerability') {
        return translateBattleLogStatus(t, te, 'vulnerability');
      }
      return kind;
    }
    case 'CORROSION_SPAN': {
      const start = formatResShred(p.startResShred);
      const end = formatResShred(p.endResShred);
      const ticks = formatStacks(p.tickCount);
      const level = formatStacks(p.level);
      const shredPart =
        start === end
          ? formatBattleLogField(t, te, 'resShred', start)
          : `${formatBattleLogField(t, te, 'resShred', start)} → ${end}`;
      const parts = [shredPart];
      if (level) parts.push(`Lv${level}`);
      if (ticks) parts.push(`×${ticks}`);
      return parts.join(' ');
    }
    default:
      return '';
  }
}

/** Search / orphan plain-text line for enemy-channel entries. */
export function formatEnemyBattleLogLine(
  entry: { type?: string; time?: number; payload?: Record<string, unknown> },
  opts: {
    t: BattleLogTranslate;
    te: BattleLogTranslateExists;
    formatTime?: (timeSeconds: number) => string;
    typeLabel?: (type: string) => string;
  },
): string {
  const timeLabel = (opts.formatTime || ((s: number) => `${Number(s).toFixed(3)}s`))(
    Number(entry.time) || 0,
  );
  const type = String(entry.type || '');
  const typeLabel = opts.typeLabel?.(type) || type;
  const summary = formatEnemyBattleLogSummary(entry, opts.t, opts.te);
  const verb =
    entry.type === 'ENEMY_EFFECT_EXPIRE' || entry.type === 'INFLICTION_CONSUMED'
      ? opts.t('battleLog.ui.effectRemove')
      : entry.type === 'CORROSION_SPAN'
        ? opts.t('battleLog.ui.tick')
        : opts.t('battleLog.ui.effectApply');
  return `[${timeLabel}] [${typeLabel}] ${verb} ${summary}`.trim();
}
