import type { SimLogEntry } from '@/simulation/events/event.types.ts';
import {
  formatBattleLogField,
  translateBattleLogSpReason,
  translateBattleLogTarget,
} from '@/simulation/formatBattleLogLabels';

export type FormatSimLogEntryOptions = {
  formatTime?: (timeSeconds: number) => string;
  t?: (key: string, values?: Record<string, unknown>) => string;
  te?: (key: string) => boolean;
  typeLabel?: (type: string) => string;
  trackName?: (trackId: string) => string;
  actionName?: (actionId: string) => string;
};

function formatDefaultTime(timeSeconds: number) {
  if (!Number.isFinite(timeSeconds)) return '0.000s';
  return `${timeSeconds.toFixed(3)}s`;
}

function withPrefix(
  entry: SimLogEntry,
  message: string,
  opts?: FormatSimLogEntryOptions,
) {
  const timeLabel = (opts?.formatTime || formatDefaultTime)(entry.time);
  const typeLabel = opts?.typeLabel?.(entry.type) || entry.type;
  return `[${timeLabel}] [${typeLabel}] ${message}`;
}

function field(
  opts: FormatSimLogEntryOptions | undefined,
  key: string,
  value: string | number,
  fallbackKey: string,
) {
  if (opts?.t && opts?.te) return formatBattleLogField(opts.t, opts.te, key, value);
  return `${fallbackKey}=${value}`;
}

function nameTrack(opts: FormatSimLogEntryOptions | undefined, id: string | undefined) {
  if (!id) return '';
  return opts?.trackName?.(id) || id;
}

function nameAction(opts: FormatSimLogEntryOptions | undefined, id: string | undefined) {
  if (!id) return '';
  return opts?.actionName?.(id) || id;
}

export function formatSimLogEntry(entry: SimLogEntry, opts?: FormatSimLogEntryOptions) {
  if (!entry || !entry.type) return '';

  switch (entry.type) {
    case 'ACTION_START': {
      const { skillId, actionId, type, spCost } = entry.payload || ({} as any);
      const skill = nameAction(opts, skillId) || skillId;
      const extra = spCost != null ? ` ${field(opts, 'sp', spCost, 'cost')}` : '';
      return withPrefix(
        entry,
        `${skill} (${type || ''}) id=${actionId}${extra}`.trim(),
        opts,
      );
    }
    case 'ACTION_END': {
      const payload = entry.payload as any;
      const { skillId, actionId, type, spGain, spGainKind } = payload || {};
      const skill = nameAction(opts, skillId) || skillId;
      const gain =
        spGain != null
          ? ` ${field(opts, 'spGain', spGain, 'gain')}${spGainKind ? `(${spGainKind})` : ''}`
          : '';
      return withPrefix(entry, `${skill} (${type || ''}) id=${actionId}${gain}`.trim(), opts);
    }
    case 'DAMAGE_HIT': {
      const { sourceId, targetId, stagger, hitData, actionId } = entry.payload || ({} as any);
      const damage = hitData?._expectedDamage ?? 0;
      const spGainNum = Number(hitData?.spReturn ?? hitData?.spRecovery) || 0;
      const spGain = spGainNum ? ` ${field(opts, 'spGain', spGainNum, 'sp+')}` : '';
      const from = nameTrack(opts, sourceId);
      const to = opts?.t && opts?.te
        ? translateBattleLogTarget(opts.t, opts.te, targetId)
        : targetId;
      return withPrefix(
        entry,
        `${field(opts, 'damage', damage, 'dmg')} ${field(opts, 'stagger', stagger, 'stg')}${spGain} ${from} -> ${to} id=${actionId}`,
        opts,
      );
    }
    case 'STAGGER': {
      const { actorId, actionId, stagger, amount, isBroken } = entry.payload || ({} as any);
      const broken =
        isBroken && opts?.t ? ` (${opts.t('battleLog.ui.broken')})` : isBroken ? ' (BROKEN)' : '';
      return withPrefix(
        entry,
        `${nameTrack(opts, actorId)} ${field(opts, 'stagger', Number(stagger).toFixed(1), 'stg')} (${Number(amount).toFixed(1)}) id=${actionId}${broken}`,
        opts,
      );
    }
    case 'SP_CHANGE': {
      const { sp, change, reason, sourceId, recoverSp, refundSp, debtSp } =
        entry.payload || ({} as any);
      const before = Number(sp) - Number(change);
      const delta = Number(change);
      const sign = delta > 0 ? '+' : '';
      const reasonLabel =
        opts?.t && opts?.te ? translateBattleLogSpReason(opts.t, opts.te, reason) : reason;
      const extra =
        recoverSp != null || refundSp != null || debtSp != null
          ? ` [rec=${recoverSp ?? 0} ref=${refundSp ?? 0} debt=${debtSp ?? 0}]`
          : '';
      return withPrefix(
        entry,
        `${field(opts, 'sp', `${before} -> ${sp}`, 'sp')} (${sign}${delta}) ${reasonLabel} id=${sourceId}${extra}`,
        opts,
      );
    }
    case 'ULT_ENERGY_CHANGE': {
      const { actorId, change, sourceId } = entry.payload || ({} as any);
      const sign = Number(change) > 0 ? '+' : '';
      return withPrefix(
        entry,
        `${nameTrack(opts, actorId)} ${field(opts, 'gauge', `${sign}${change}`, 'gauge')} id=${sourceId}`,
        opts,
      );
    }
    case 'SP_REGEN_PAUSE': {
      const { duration, sp, sourceId } = entry.payload || ({} as any);
      return withPrefix(
        entry,
        `${Number(duration).toFixed(3)}s ${field(opts, 'sp', sp, 'sp')} id=${sourceId}`,
        opts,
      );
    }
    case 'CD_REDUCTION': {
      const { actionId, reduction, actorId } = (entry.payload || {}) as any;
      const amount = Number(reduction);
      const text =
        opts?.t?.(
          'battleLog.ui.cdReductionText',
          { amount: Number.isFinite(amount) ? amount : reduction },
        ) || `cd-${amount}`;
      return withPrefix(
        entry,
        `${nameTrack(opts, actorId)} ${text} id=${actionId}`,
        opts,
      );
    }
    default: {
      const anyEntry: any = entry;
      return withPrefix(anyEntry, JSON.stringify(anyEntry.payload ?? {}), opts);
    }
  }
}
