import type { SimLogEntry } from '@/simulation/events/event.types.ts';

export type FormatSimLogEntryOptions = {
  formatTime?: (timeSeconds: number) => string;
};

function formatDefaultTime(timeSeconds: number) {
  if (!Number.isFinite(timeSeconds)) return '0.000s';
  return `${timeSeconds.toFixed(3)}s`;
}

function withPrefix(entry: SimLogEntry, message: string, opts?: FormatSimLogEntryOptions) {
  const timeLabel = (opts?.formatTime || formatDefaultTime)(entry.time);
  return `[${timeLabel}] [${entry.type}] ${message}`;
}

export function formatSimLogEntry(entry: SimLogEntry, opts?: FormatSimLogEntryOptions) {
  if (!entry || !entry.type) return '';

  switch (entry.type) {
    case 'ACTION_START': {
      const { skillId, actionId, type, spCost } = entry.payload || ({} as any);
      const typeLabel = type;
      const extra = spCost != null ? ` cost=${spCost}` : '';
      return withPrefix(
        entry,
        `action start ${skillId} (${typeLabel}) id=${actionId}${extra}`,
        opts,
      );
    }
    case 'ACTION_END': {
      const payload = entry.payload as any;
      const { skillId, actionId, type, spGain, spGainKind } = payload || {};
      const typeLabel = type;
      const gain = spGain != null ? ` gain=${spGain}${spGainKind ? `(${spGainKind})` : ''}` : '';
      return withPrefix(entry, `action end ${skillId} (${typeLabel}) id=${actionId}${gain}`, opts);
    }
    case 'DAMAGE_HIT': {
      const { sourceId, targetId, stagger, hitData, actionId } = entry.payload || ({} as any);
      const damage = hitData?._expectedDamage ?? 0;
      const spGain = Number(hitData?.spReturn ?? hitData?.spRecovery)
        ? ` sp+${Number(hitData?.spReturn ?? hitData?.spRecovery)}`
        : '';
      return withPrefix(
        entry,
        `dmg ${damage} stg ${stagger}${spGain} ${sourceId} -> ${targetId} id=${actionId}`,
        opts,
      );
    }
    case 'STAGGER': {
      const { actorId, actionId, stagger, amount, isBroken } = entry.payload || ({} as any);
      const tag = isBroken ? ' (BROKEN)' : '';
      return withPrefix(
        entry,
        `${actorId} stg=${Number(stagger).toFixed(1)} (${Number(amount).toFixed(1)}) id=${actionId}${tag}`,
        opts,
      );
    }
    case 'SP_CHANGE': {
      const { sp, change, reason, sourceId, recoverSp, refundSp, debtSp } =
        entry.payload || ({} as any);
      const before = Number(sp) - Number(change);
      const delta = Number(change);
      const sign = delta > 0 ? '+' : '';
      const extra =
        recoverSp != null || refundSp != null || debtSp != null
          ? ` [rec=${recoverSp ?? 0} ref=${refundSp ?? 0} debt=${debtSp ?? 0}]`
          : '';
      return withPrefix(
        entry,
        `sp ${before} -> ${sp} (${sign}${delta}) ${reason} id=${sourceId}${extra}`,
        opts,
      );
    }
    case 'ULT_ENERGY_CHANGE': {
      const { actorId, change, sourceId } = entry.payload || ({} as any);
      const sign = Number(change) > 0 ? '+' : '';
      return withPrefix(entry, `${actorId} gauge ${sign}${change} id=${sourceId}`, opts);
    }
    case 'SP_REGEN_PAUSE': {
      const { duration, sp, sourceId } = entry.payload || ({} as any);
      return withPrefix(
        entry,
        `sp regen pause ${Number(duration).toFixed(3)}s sp=${sp} id=${sourceId}`,
        opts,
      );
    }
    default: {
      const anyEntry: any = entry;
      return withPrefix(anyEntry, JSON.stringify(anyEntry.payload ?? {}), opts);
    }
  }
}
