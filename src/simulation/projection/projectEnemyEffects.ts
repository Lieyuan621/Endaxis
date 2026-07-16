import type {
  Effect,
  StatusEffect,
  ArtsElement,
  ArtsReaction,
  PhysicalStatus,
  InflictionEffect,
  BurstEffect,
  ReactionEffect,
  PhysicalStatusEffect,
} from '@/data/types';
import type { EnemyStateEvent } from '@/simulation/engine/types';
import type { SimLogEntry } from '@/simulation/events/event.types';
import type { ResolvedHit } from '@/simulation/compiler/types';
import {
  getEffectIcon,
  getEffectColor,
  getEffectPresetKey,
  resolveEffectDefaults,
} from '@/data/effectPresets';
import { type ActivationWindow, buildApplyExpireWindows } from './projectTriggeredEffects';
import { buildByTypeKey, layoutEffects, type EffectLayout } from './effectLayout';
export { ROW_HEIGHT } from './effectLayout';

// ─── Types ──────────────────────────────────────────────────────────────────

/** A visual segment in the enemy status track */
interface EnemyEffectSegment {
  typeKey: string;
  group: EnemyEffectGroup;
  start: number;
  end: number;
  stacks: number;
  maxStacks: number;
  showIcon: boolean;
  icon: string;
  color: string;
  effect: Effect; // original effect data for reference
  sourceId: string; // operator/action source identifier
  carryoverKey?: string;
  disabled?: boolean;
  /** For stat debuffs: the stat field, used for same-stat affinity */
  stat?: string;
  /** True for reaction damage hit markers (rendered as diamonds). */
  isDamageHit?: boolean;
  /** Tick mark data within the segment (e.g. corrosion per-second ramp ticks). */
  tickMarks?: Array<{ time: number; resShred: number }>;
  /** Hit data for reaction damage markers (used to open detail dialog). */
  hitData?: any;
}

export enum EnemyEffectGroup {
  PHYSICAL_COMBO = 0,
  BREACH = 1,
  INFLICTION = 2,
  REACTION = 3,
  STAT_DEBUFF = 4,
}

interface EnemyEffectProjection {
  segments: EnemyEffectSegment[];
  /** Segments grouped by type key, for layout */
  byTypeKey: Map<string, EnemyEffectSegment[]>;
}

// ─── Simulation-aware projection ────────────────────────────────────────────

type InflictionTracker = {
  start: number;
  element: ArtsElement;
  stacks: number;
  expiresAt: number;
  sourceId: string;
  carryoverKey?: string;
  disabled?: boolean;
};
type VulnTracker = {
  start: number;
  stacks: number;
  expiresAt: number;
  sourceId: string;
  carryoverKey?: string;
  disabled?: boolean;
};
type DebuffTracker = {
  start: number;
  level: number;
  expiresAt: number;
  sourceId: string;
  carryoverKey?: string;
  disabled?: boolean;
};

function syntheticInfliction(element: ArtsElement): InflictionEffect {
  return { kind: 'infliction', element };
}

function syntheticReaction(reactionType: ArtsReaction | 'shatter'): ReactionEffect {
  return { kind: 'reaction', reactionType: reactionType as ArtsReaction };
}

function syntheticPhysical(physicalType: PhysicalStatus): PhysicalStatusEffect {
  return { kind: 'physicalStatus', physicalType };
}

function syntheticStatusEffect(id: string, name?: string): StatusEffect {
  return { kind: 'status', id, name, target: { scope: 'enemy' } };
}

function syntheticBurst(element: ArtsElement): BurstEffect {
  return { kind: 'burst', element };
}

function makeInflictionSeg(t: InflictionTracker, end: number): EnemyEffectSegment {
  const eff = syntheticInfliction(t.element);
  return {
    typeKey: 'infliction',
    group: EnemyEffectGroup.INFLICTION,
    start: t.start,
    end: Math.min(end, t.expiresAt),
    stacks: t.stacks,
    maxStacks: 4,
    showIcon: true,
    icon: getEffectIcon(eff),
    color: getEffectColor(eff),
    effect: eff,
    sourceId: t.sourceId,
    carryoverKey: t.carryoverKey,
    disabled: t.disabled,
  };
}

function makeVulnSeg(t: VulnTracker, end: number): EnemyEffectSegment {
  const eff = syntheticPhysical('vulnerability');
  return {
    typeKey: 'physical_combo',
    group: EnemyEffectGroup.PHYSICAL_COMBO,
    start: t.start,
    end: Math.min(end, t.expiresAt),
    stacks: t.stacks,
    maxStacks: 4,
    showIcon: false,
    icon: getEffectIcon(eff),
    color: getEffectColor(eff),
    effect: eff,
    sourceId: t.sourceId,
    carryoverKey: t.carryoverKey,
    disabled: t.disabled,
  };
}

function makeDebuffSeg(
  debuffType: string,
  info: DebuffTracker,
  group: EnemyEffectGroup,
  corrosionTicks?: Array<{ time: number; resShred: number }>,
): EnemyEffectSegment {
  const isArtsReaction = ['combustion', 'electrification', 'corrosion', 'solidification'].includes(
    debuffType,
  );
  const eff = isArtsReaction
    ? syntheticReaction(debuffType as ArtsReaction)
    : syntheticPhysical('breach');

  // Attach logged corrosion tick data (excluding initial tick at segment start)
  let tickMarks: Array<{ time: number; resShred: number }> | undefined;
  if (debuffType === 'corrosion' && corrosionTicks) {
    tickMarks = corrosionTicks.filter(t => t.time > info.start && t.time < info.expiresAt);
  }

  return {
    typeKey: `reaction:${debuffType}`,
    group,
    start: info.start,
    end: info.expiresAt,
    stacks: info.level,
    maxStacks: 4,
    showIcon: true,
    icon: getEffectIcon(eff),
    color: getEffectColor(eff),
    effect: eff,
    sourceId: info.sourceId,
    carryoverKey: info.carryoverKey,
    disabled: info.disabled,
    tickMarks,
  };
}

/** Instant damage-hit diamond marker (reaction hits and DoT ticks). */
function makeDamageHitMarker(
  typeKey: string,
  group: EnemyEffectGroup,
  time: number,
  sourceId: string,
  hitData: ResolvedHit,
): EnemyEffectSegment {
  const reactionLevel = Number(hitData?._reactionMeta?.level) || 0;
  return {
    typeKey,
    group,
    start: time,
    end: time,
    stacks: reactionLevel,
    maxStacks: 1,
    showIcon: false,
    icon: '',
    color: '#ffffff',
    effect: {} as Effect,
    sourceId,
    isDamageHit: true,
    hitData,
  };
}

function getStateDisplayKey(effect: Effect, fallbackId: string): string {
  const raw = effect as Effect & { displayType?: string; name?: string; type?: string };
  return (
    String(raw.displayType || raw.name || raw.type || raw.id || fallbackId || 'status').trim() ||
    'status'
  );
}

function getEnemyStatusTypeKey(resolved: Effect, effectId: string): string {
  const hasStat = resolved.kind === 'status' && resolved.stat;
  if (hasStat) return `stat:${getEffectPresetKey(resolved)}:${effectId}`;

  const displayKey = getStateDisplayKey(resolved, effectId);
  return displayKey === effectId ? `state:${effectId}` : `state:${displayKey}:${effectId}`;
}

/** Convert ActivationWindows to EnemyEffectSegments for StatusEffects. */
function windowsToEnemyStatusSegments(windows: ActivationWindow[]): EnemyEffectSegment[] {
  return windows.map(w => {
    const resolved = resolveEffectDefaults(w.effect);
    const hasStat = resolved.kind === 'status' && resolved.stat;
    return {
      typeKey: getEnemyStatusTypeKey(resolved, w.effectId),
      group: EnemyEffectGroup.STAT_DEBUFF,
      start: w.start,
      end: w.end,
      stacks: w.stacks,
      maxStacks: w.maxStacks ?? 1,
      showIcon: !w.isContinuation,
      icon: getEffectIcon(resolved, w.stacks),
      color: getEffectColor(resolved),
      effect: resolved,
      sourceId: w.sourceId ?? w.effectId,
      carryoverKey: w.carryoverKey,
      disabled: w.disabled,
      stat: hasStat ? JSON.stringify(resolved.stat) : '',
    };
  });
}

/**
 * Convert the simulation engine's event log into an EnemyEffectProjection.
 *
 * Enemy effects are rendered exclusively from the sim log (ground truth).
 * Do NOT add a hitFires fallback — the simulation dispatches all enemy effects
 * through ENEMY_EFFECT_APPLY events, so the log is the single source of truth.
 * A previous hitFires-based fallback was removed because it attempted local
 * condition evaluation that diverged from the simulation's actual behavior.
 */
export function projectFromSimLog(
  events: EnemyStateEvent[],
  simLog?: SimLogEntry[],
): EnemyEffectProjection {
  const segments: EnemyEffectSegment[] = [];

  // Collect corrosion tick data from logged events
  const corrosionTicks: Array<{ time: number; resShred: number }> = [];
  for (const event of events) {
    if (event.type === 'CORROSION_TICK') {
      corrosionTicks.push({ time: event.time, resShred: event.resShred });
    }
  }

  // Enemy-specific state trackers (infliction, vulnerability, debuffs/reactions)
  let infliction: InflictionTracker | null = null;
  let vuln: VulnTracker | null = null;
  const openDebuffs = new Map<string, DebuffTracker>();

  for (const event of events) {
    switch (event.type) {
      case 'INFLICTION_APPLY': {
        if (event.triggerOnly) {
          // Consumption trigger — icon only, no duration bar
          const eff = syntheticInfliction(event.element);
          segments.push({
            typeKey: 'infliction',
            group: EnemyEffectGroup.INFLICTION,
            start: event.time,
            end: event.time,
            stacks: 0,
            maxStacks: 4,
            showIcon: true,
            icon: getEffectIcon(eff),
            color: getEffectColor(eff),
            effect: eff,
            sourceId: event.sourceId,
            carryoverKey: event.carryoverKey,
            disabled: event.disabled,
          });
        } else if (
          infliction &&
          infliction.element === event.element &&
          !infliction.disabled &&
          !event.disabled
        ) {
          // Same-element reapply → split segment at boundary (stack increase + timer refresh)
          segments.push(makeInflictionSeg(infliction, event.time));
          infliction = {
            start: event.time,
            element: event.element,
            stacks: Math.min(4, infliction.stacks + event.stacks),
            expiresAt: event.expiresAt ?? event.time + 20,
            sourceId: event.sourceId,
            carryoverKey: event.carryoverKey,
            disabled: event.disabled,
          };
        } else {
          // Fresh infliction or different element (consumed event should precede)
          if (infliction) segments.push(makeInflictionSeg(infliction, event.time));
          infliction = {
            start: event.time,
            element: event.element,
            stacks: Math.min(4, event.stacks),
            expiresAt: event.expiresAt ?? event.time + event.effectiveDuration,
            sourceId: event.sourceId,
            carryoverKey: event.carryoverKey,
            disabled: event.disabled,
          };
        }
        break;
      }

      case 'INFLICTION_CONSUMED': {
        if (infliction) {
          segments.push(makeInflictionSeg(infliction, event.time));
          infliction = null;
        }
        break;
      }

      case 'ENEMY_EFFECT_EXPIRE': {
        // Handles infliction, vulnerability, and debuff expiry/consumption uniformly.
        // Uses event.time so forced consumption (priority 3) ends the window at the right point.
        switch (event.kind) {
          case 'infliction':
            if (infliction && infliction.element === event.element) {
              segments.push(makeInflictionSeg(infliction, event.time));
              infliction = null;
            }
            break;
          case 'vulnerability':
            if (vuln) {
              segments.push(makeVulnSeg(vuln, event.time));
              vuln = null;
            }
            break;
          case 'debuff': {
            const dt = event.debuffType;
            const existing = openDebuffs.get(dt);
            if (existing) {
              existing.expiresAt = event.time;
              const group = dt === 'breach' ? EnemyEffectGroup.BREACH : EnemyEffectGroup.REACTION;
              segments.push(makeDebuffSeg(dt, existing, group, corrosionTicks));
              openDebuffs.delete(dt);
            }
            break;
          }
          case 'status':
            // Handled post-loop via buildApplyExpireWindows
            break;
        }
        break;
      }

      case 'ARTS_BURST': {
        // Inline marker on infliction bar (same typeKey → same sub-row)
        const eff = syntheticBurst(event.element);
        segments.push({
          typeKey: 'infliction',
          group: EnemyEffectGroup.INFLICTION,
          start: event.time,
          end: event.time,
          stacks: 0,
          maxStacks: 4,
          showIcon: true,
          icon: getEffectIcon(eff),
          color: getEffectColor(eff),
          effect: eff,
          sourceId: '',
        });
        break;
      }

      case 'PHYSICAL_STATUS': {
        // Trigger icon marker in physical combo row
        const showsControlDuration =
          (event.physicalType === 'lift' || event.physicalType === 'knockdown') &&
          event.actualControl === true &&
          Number(event.effectiveDuration) > 0;
        const eff = syntheticPhysical(
          event.actualControl === false &&
            (event.physicalType === 'lift' || event.physicalType === 'knockdown')
            ? 'vulnerability'
            : event.physicalType,
        );
        segments.push({
          typeKey: 'physical_combo',
          group: EnemyEffectGroup.PHYSICAL_COMBO,
          start: event.time,
          end: event.time,
          stacks: 0,
          maxStacks: 1,
          showIcon: true,
          icon: getEffectIcon(eff),
          color: getEffectColor(eff),
          effect: eff,
          sourceId: event.sourceId,
        });
        if (showsControlDuration) {
          segments.push({
            typeKey: `physical_control:${event.physicalType}`,
            group: EnemyEffectGroup.PHYSICAL_COMBO,
            start: event.time,
            end: event.time + Number(event.effectiveDuration),
            stacks: 1,
            maxStacks: 1,
            showIcon: true,
            icon: getEffectIcon(eff),
            color: getEffectColor(eff),
            effect: eff,
            sourceId: event.sourceId,
          });
        }
        break;
      }

      case 'VULNERABILITY_CHANGE': {
        if (vuln) segments.push(makeVulnSeg(vuln, event.time));
        vuln = {
          start: event.time,
          stacks: event.stacks,
          expiresAt: event.expiresAt,
          sourceId: event.sourceId,
          carryoverKey: event.carryoverKey,
          disabled: event.disabled,
        };
        break;
      }

      case 'VULNERABILITY_CONSUMED': {
        if (vuln) {
          segments.push(makeVulnSeg(vuln, event.time));
          vuln = null;
        }
        break;
      }

      case 'REACTION_TRIGGER': {
        // Only shatter needs an instant marker — other reactions produce DEBUFF_APPLY
        if (event.reactionType === 'shatter') {
          const eff = syntheticReaction('shatter');
          segments.push({
            typeKey: 'reaction:shatter',
            group: EnemyEffectGroup.REACTION,
            start: event.time,
            end: event.time,
            stacks: event.level,
            maxStacks: 4,
            showIcon: true,
            icon: getEffectIcon(eff),
            color: getEffectColor(eff),
            effect: eff,
            sourceId: event.sourceId,
          });
        }
        break;
      }

      case 'DEBUFF_APPLY': {
        const { debuffType, time, level, expiresAt, sourceId, carryoverKey, disabled } = event;
        const existing = openDebuffs.get(debuffType);
        if (existing) {
          existing.expiresAt = time;
          const group =
            debuffType === 'breach' ? EnemyEffectGroup.BREACH : EnemyEffectGroup.REACTION;
          segments.push(makeDebuffSeg(debuffType, existing, group, corrosionTicks));
        }
        openDebuffs.set(debuffType, {
          start: time,
          level,
          expiresAt,
          sourceId,
          carryoverKey,
          disabled,
        });
        break;
      }
    }
  }

  // Flush still-open enemy-specific segments
  if (infliction) segments.push(makeInflictionSeg(infliction, infliction.expiresAt));
  if (vuln) segments.push(makeVulnSeg(vuln, vuln.expiresAt));
  for (const [debuffType, info] of openDebuffs) {
    const group = debuffType === 'breach' ? EnemyEffectGroup.BREACH : EnemyEffectGroup.REACTION;
    segments.push(makeDebuffSeg(debuffType, info, group, corrosionTicks));
  }

  // ── Post-loop: batch-process enemy StatusEffects (same pattern as operator projection) ──

  // Build windows from ENEMY_STATUS_APPLY/EXPIRE pairs
  const statusApplies = (
    events.filter(e => e.type === 'ENEMY_STATUS_APPLY') as Extract<
      EnemyStateEvent,
      { type: 'ENEMY_STATUS_APPLY' }
    >[]
  ).map(e => ({
    key: e.id,
    time: e.time,
    stacks: e.stacks,
    maxStacks: e.maxStacks,
    expiresAt: e.expiresAt,
    effect: e.effect ?? syntheticStatusEffect(e.id),
    effectId: e.id,
    isContinuation: e.isContinuation,
    sourceId: e.sourceId,
    carryoverKey: e.carryoverKey,
    disabled: e.disabled,
  }));
  const statusExpires = (
    events.filter(e => e.type === 'ENEMY_EFFECT_EXPIRE' && e.kind === 'status') as Extract<
      EnemyStateEvent,
      { type: 'ENEMY_EFFECT_EXPIRE'; kind: 'status' }
    >[]
  ).map(e => ({ key: e.id, time: e.time }));
  const enemyStatusLogMap = buildApplyExpireWindows(statusApplies, statusExpires);

  // Convert log windows to segments (exclude hidden effects from rendering)
  const visibleStatusLogMap = new Map(
    [...enemyStatusLogMap].filter(([key]) => {
      const firstApply = (
        events as Extract<EnemyStateEvent, { type: 'ENEMY_STATUS_APPLY' }>[]
      ).find(e => e.type === 'ENEMY_STATUS_APPLY' && e.id === key);
      return !firstApply?.effect?.hide;
    }),
  );
  const visibleStatusWindows = [...visibleStatusLogMap.values()].flat();
  const statusTypeKeyByEffectId = new Map(
    visibleStatusWindows.map(w => [
      w.effectId,
      getEnemyStatusTypeKey(resolveEffectDefaults(w.effect), w.effectId),
    ]),
  );
  segments.push(...windowsToEnemyStatusSegments(visibleStatusWindows));

  // ── Reaction damage + DoT hit markers from simLog (single pass) ────────
  if (simLog) {
    const REACTION_TYPE_KEY_MAP: Record<string, string> = {
      electrification: 'reaction:electrification',
      corrosion: 'reaction:corrosion',
      combustion: 'reaction:combustion',
      combustion_dot: 'reaction:combustion',
      solidification: 'reaction:solidification',
      shatter: 'reaction:shatter',
      artsBurst: 'infliction',
      knockdown: 'reaction:knockdown',
      lift: 'reaction:lift',
      breach: 'reaction:breach',
      crush: 'reaction:crush',
    };

    const REACTION_GROUP_MAP: Record<string, EnemyEffectGroup> = {
      electrification: EnemyEffectGroup.REACTION,
      corrosion: EnemyEffectGroup.REACTION,
      combustion: EnemyEffectGroup.REACTION,
      combustion_dot: EnemyEffectGroup.REACTION,
      solidification: EnemyEffectGroup.REACTION,
      shatter: EnemyEffectGroup.REACTION,
      artsBurst: EnemyEffectGroup.INFLICTION,
      knockdown: EnemyEffectGroup.PHYSICAL_COMBO,
      lift: EnemyEffectGroup.PHYSICAL_COMBO,
      breach: EnemyEffectGroup.BREACH,
      crush: EnemyEffectGroup.PHYSICAL_COMBO,
    };

    for (const entry of simLog) {
      if (entry.type !== 'DAMAGE_HIT') continue;
      const hitData = entry.payload.hitData as ResolvedHit;

      // Reaction damage hit marker — skip synthetic `treatAsReaction` hits,
      // which only borrow the reaction formula and aren't real reactions.
      if (hitData?._reactionMeta && !hitData._reactionMeta.synthetic) {
        const { reactionType } = hitData._reactionMeta;
        const typeKey = REACTION_TYPE_KEY_MAP[reactionType] ?? `reaction:${reactionType}`;
        const group = REACTION_GROUP_MAP[reactionType] ?? EnemyEffectGroup.REACTION;

        segments.push(
          makeDamageHitMarker(typeKey, group, entry.time, entry.payload.sourceId, hitData),
        );
      }
    }
  }

  // ── DoT tick diamond markers from simLog ────────────────────────────────
  // Bar comes from ENEMY_STATUS_APPLY (handled by the log-based status path above).
  // Diamonds come from DAMAGE_HIT events spawned by DOT_TICK (identified by triggeredBy prefix).
  // We read from simLog (not events) because the DAMAGE_HIT hitData carries _expectedDamage.
  if (simLog) {
    for (const entry of simLog) {
      if (entry.type !== 'DAMAGE_HIT') continue;
      const hitData = entry.payload.hitData as ResolvedHit;
      const triggeredBy = hitData?.triggeredBy;
      if (!triggeredBy || !triggeredBy.startsWith('dot:')) continue;
      // Extract effectId from triggeredBy ('dot:{effectId}') to match bar typeKey ('state:{effectId}')
      const effectId = triggeredBy.slice(4);
      const typeKey = statusTypeKeyByEffectId.get(effectId) ?? `state:${effectId}`;
      segments.push(
        makeDamageHitMarker(
          typeKey,
          EnemyEffectGroup.STAT_DEBUFF,
          entry.time,
          entry.payload.sourceId,
          hitData,
        ),
      );
    }
  }

  return { segments, byTypeKey: buildByTypeKey(segments) };
}

// ─── Layout (delegates to shared engine) ────────────────────────────────────

type EnemyEffectLayout = EffectLayout<EnemyEffectSegment>;

export function layoutEnemyEffects(projection: EnemyEffectProjection): EnemyEffectLayout {
  return layoutEffects(projection.byTypeKey, 5, EnemyEffectGroup.STAT_DEBUFF);
}
