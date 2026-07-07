/**
 * Timeline data accessor module.
 *
 * Reads from TypeScript effect sheets (operators, weapons, gear pieces)
 * and local JSON copies (enemies, system constants), then provides
 * accessor functions in the flat format expected by the timeline store.
 */

import type { SystemConstants, OperatorSheet, GearPieceSheet } from './types';
import { createFinisherEntry, createDiveEntry } from './types';
import { expandSegments } from './collect';
import { getOperatorGameName } from './gameText';
import systemData from './system.json';
const gearPieceSheets = Object.fromEntries(
  Object.entries(
    import.meta.glob('./gearpieces/**/*.ts', { eager: true, import: 'default' }) as Record<
      string,
      GearPieceSheet
    >,
  ).map(([path, sheet]) => [(path.split('/').pop() || '').replace(/\.ts$/, ''), sheet]),
);

// ─── Eager imports via Vite glob ────────────────────────────────────────────

const operatorModules = import.meta.glob('./operators/*.ts', {
  eager: true,
  import: 'default',
}) as Record<string, OperatorSheet>;
// ─── Utility: extract slug from module path ─────────────────────────────────

function slugFromPath(path: string): string {
  const filename = path.split('/').pop() || '';
  return filename.replace(/\.(json|ts)$/, '');
}

const SKILL_ICON_FILE: Record<string, string> = {
  battleSkill: 'battle.webp',
  comboSkill: 'combo.webp',
  ultimate: 'ultimate.webp',
};

// ─── Default UE / SP constants ──────────────────────────────────────────────

const BATTLE_SKILL_SP_COST = 100;
const COMBO_SKILL_UE = 0;

/**
 * Resolve a leveled value (number or number[]) to a scalar using a 0-based level index.
 * Clamps to the last array element if the level exceeds the array length.
 */
export function resolveLeveledValue(value: number | number[] | undefined, level: number): number {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  return value[Math.min(level, value.length - 1)] ?? 0;
}

// ─── Character Roster ───────────────────────────────────────────────────────
// Returns an array in the flat format the timeline store expects,
// with character IDs as lowercased gamedata IDs (not optimizer slugs).

const rlv = resolveLeveledValue;

/** Flatten a HitGroup into per-hit objects, stamping multiplier at level 0. */
function flattenHitGroup(hg: any): any[] {
  const hits = hg.hits ?? [];
  const hasMultiplier = hg.multiplier != null;
  const baseMultiplier = hasMultiplier ? rlv(hg.multiplier, 0) : 0;
  const totalWeight = hits.reduce((s: number, h: any) => s + (h.weight ?? 1), 0) || 1;
  return hits.map((t: any) => ({
    ...(t.id ? { id: t.id } : {}),
    offset: t.offset,
    ...(hg.element ? { element: hg.element } : {}),
    spRecovery: rlv(t.spRecovery, 0),
    spReturn: rlv(t.spReturn, 0),
    stagger: rlv(t.stagger, 0),
    effects: t.effects ?? [],
    ...(hg.condition != null ? { _condition: hg.condition } : {}),
    ...(t.treatAsReaction ? { treatAsReaction: t.treatAsReaction } : {}),
    ...(hg.treatAsSkillType ? { treatAsSkillType: hg.treatAsSkillType } : {}),
    ...(hasMultiplier
      ? {
          multiplier:
            hg.multiplierMode === 'split'
              ? baseMultiplier * ((t.weight ?? 1) / totalWeight)
              : baseMultiplier,
        }
      : { _noDamage: true }),
  }));
}

let _characterRoster: any[] | null = null;

export function getCharacterRoster(): any[] {
  if (_characterRoster) return _characterRoster;

  const roster: any[] = [];

  for (const [path, data] of Object.entries(operatorModules)) {
    const slug = slugFromPath(path);
    if (!data.gameId) continue; // skip operators without timeline data

    const op: any = data;
    const id = slug;

    const basicAttack = op.combatSkills?.basicAttack;

    // Finisher and Dive from shared templates
    const finisherEntry = createFinisherEntry(op.finisherElement);
    const finSeg = finisherEntry.segments[0];
    const diveEntry = createDiveEntry(op.diveElement);
    const diveSeg = diveEntry.segments[0];

    const entry: any = {
      id,
      slug,
      element: op.element,
      rarity: op.rarity,
      weapon: op.weapon,
      name: getOperatorGameName(slug),
      avatar: `/operators/${slug}/avatar.webp`,
      accept_team_ult_energy: op.acceptTeamUltEnergy ?? true,
      accept_self_sp_cost_ult_energy: op.acceptSelfSpCostUltEnergy ?? true,
      exclusive_buffs: op.exclusiveBuffs || [],
      // Finisher
      finisher_duration: finSeg?.duration ?? 0,
      finisher_damage_hits: (finSeg?.damageGroups ?? []).flatMap(flattenHitGroup),
      // Dive
      dive_duration: diveSeg?.duration ?? 0,
      dive_damage_hits: (diveSeg?.damageGroups ?? []).flatMap(flattenHitGroup),
    };

    // Basic Attack → basicAttack_segments (reconstructed from segments)
    if (basicAttack) {
      entry.basicAttack_segments = (basicAttack.segments || []).map((seg: any) => ({
        duration: seg.duration,
        ...(seg.gap != null ? { gap: seg.gap } : {}),
        element: seg.damageGroups?.[0]?.element,
        ultimateEnergyGain: 0,
        damage_hits: (seg?.damageGroups ?? []).flatMap(flattenHitGroup),
      }));
    }

    // Battle Skill / Combo Skill / Ultimate → flat dict-key fields + per-segment arrays
    for (const skillKey of ['battleSkill', 'comboSkill', 'ultimate'] as const) {
      const skill = op.combatSkills?.[skillKey];
      if (!skill) continue;

      // expandSegments converts TickGroups → HitGroups so their hits are visible below.
      const expandedSegs = expandSegments(skill.segments || []);
      const seg = expandedSegs[0];
      if (!seg) continue;

      // Per-segment array (mirrors basicAttack_segments shape)
      entry[`${skillKey}_segments`] = expandedSegs.map((s: any) => {
        const base: any = {
          duration: s.duration,
          ...(s.gap != null ? { gap: s.gap } : {}),
          ...(s.skillId ? { skillId: s.skillId } : {}),
          element: s.damageGroups?.[0]?.element,
          ultimateEnergyGain: 0,
          damage_hits: (s?.damageGroups ?? []).flatMap(flattenHitGroup),
        };
        if (skillKey === 'battleSkill') {
          const segSpCost = s.spCost ?? BATTLE_SKILL_SP_COST;
          base.spCost = segSpCost;
          base.ultimateEnergyGain = s.ultimateEnergyGain ?? 0;
          base.teamUltimateEnergyGain = s.teamUltimateEnergyGain ?? 0;
        }
        return base;
      });

      // Flat fields from first segment
      entry[`${skillKey}_duration`] = seg.duration ?? 0;
      entry[`${skillKey}_damage_hits`] = (seg?.damageGroups ?? []).flatMap(flattenHitGroup);
      entry[`${skillKey}_element`] = seg.damageGroups?.[0]?.element;
      entry[`${skillKey}_icon`] = `/operators/${slug}/${SKILL_ICON_FILE[skillKey]}`;

      if (skillKey === 'battleSkill') {
        const segs = entry.battleSkill_segments as any[];
        const totalSpCost = segs.reduce((acc, s) => acc + (s.spCost ?? 0), 0);
        const totalUe = segs.reduce((acc, s) => acc + (s.ultimateEnergyGain ?? 0), 0);
        entry.battleSkill_spCost = totalSpCost;
        entry.battleSkill_ultimateEnergyGain = totalUe;
        entry.battleSkill_teamUltimateEnergyGain = totalUe;
      }
      if (skillKey === 'comboSkill') {
        entry.comboSkill_ultimateEnergyGain = skill.ultimateEnergyGain ?? COMBO_SKILL_UE;
      }

      if (skill.cooldown != null) entry[`${skillKey}_cooldown`] = rlv(skill.cooldown, 0);

      if (skillKey === 'ultimate') {
        if (skill.ultimateEnergyCost != null)
          entry.ultimate_ultimateEnergyCost = skill.ultimateEnergyCost;
        entry.ultimate_ultimateEnergyReply = 0;
        if (skill.enhancementTime != null) entry.ultimate_enhancementTime = skill.enhancementTime;
        if (skill.animationTime != null) entry.ultimate_animationTime = skill.animationTime;
      }
    }

    roster.push(entry);
  }

  _characterRoster = roster;
  return roster;
}

// ─── Equipment Database ─────────────────────────────────────────────────────

let _equipmentDatabase: any[] | null = null;

export function getEquipmentDatabase(): any[] {
  if (_equipmentDatabase) return _equipmentDatabase;

  const equipment: any[] = [];

  for (const [slug, eq] of Object.entries(gearPieceSheets)) {
    equipment.push({
      id: slug,
      slot: eq.slotType || '',
      icon: eq.icon || '',
      category: eq.setSlug || '',
      level: eq.levelRequirement || 0,
    });
  }

  _equipmentDatabase = equipment;
  return equipment;
}

// ─── System Constants ───────────────────────────────────────────────────────

export function getSystemConstants(): SystemConstants {
  return systemData as SystemConstants;
}

export function getEquipmentCategories(): string[] {
  return (systemData as SystemConstants).equipmentCategories || [];
}

export function getEquipmentCategoryConfigs(): Record<string, unknown> {
  return (systemData as SystemConstants).equipmentCategoryConfigs || {};
}

export function getIconDatabase(): Record<string, string> {
  return (systemData as SystemConstants).iconDatabase || {};
}
