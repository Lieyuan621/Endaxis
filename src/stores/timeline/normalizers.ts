// ─── Timeline track normalizers ─────────────────────────────────────────────
// Pure helpers that construct default tracks and normalize incoming
// (deserialized) track data into the canonical `Track` shape. Kept free of any
// reactive/store dependencies so they can be imported by both the orchestrator
// and the other extracted timeline modules.

import { createDefaultStats } from '@/simulation/defaultActorStats';
import type { Track } from './types';

/** Max refine tier for equipment (armor / gloves / accessories). */
export const EQUIPMENT_REFINE_MAX_TIER = 3;

/** Clamp a percentage-like value to the [0, 100] range. */
export const clampPercent = (val: unknown): number => {
  const num = Number(val) || 0;
  if (num < 0) return 0;
  if (num > 100) return 100;
  return num;
};

/** Clamp a weapon skill tier to the [1, 9] range (defaults to 1). */
export const clampTier9 = (val: unknown): number => {
  const num = Math.round(Number(val));
  if (!Number.isFinite(num)) return 1;
  if (num < 1) return 1;
  if (num > 9) return 9;
  return num;
};

/** Clamp an equipment refine tier to the [0, EQUIPMENT_REFINE_MAX_TIER] range. */
export const clampEquipmentRefineTier = (val: unknown): number => {
  const num = Math.round(Number(val));
  if (!Number.isFinite(num)) return 0;
  if (num < 0) return 0;
  if (num > EQUIPMENT_REFINE_MAX_TIER) return EQUIPMENT_REFINE_MAX_TIER;
  return num;
};

/** Build a fresh, empty operator track with default stats. */
export const createEmptyTrack = (): Track => ({
  id: null,
  operatorInstanceId: null,
  actions: [],
  initialGauge: 0,
  maxGaugeOverride: null,
  gaugeEfficiency: 100,
  originiumArtsPower: 0,
  weaponId: null,
  weaponInstanceId: null,
  weaponCommon1Tier: 1,
  weaponCommon2Tier: 1,
  weaponBuffTier: 1,
  weaponAppliedDeltas: {},
  equipmentAppliedDeltas: {},
  stats: createDefaultStats(),
  equipArmorId: null,
  equipGlovesId: null,
  equipAccessory1Id: null,
  equipAccessory2Id: null,
  equipArmorInstanceId: null,
  equipGlovesInstanceId: null,
  equipAccessory1InstanceId: null,
  equipAccessory2InstanceId: null,
  equipArmorRefineTier: 0,
  equipGlovesRefineTier: 0,
  equipAccessory1RefineTier: 0,
  equipAccessory2RefineTier: 0,
  linkCdReduction: 0,
  operatorStatus: null,
  enemyStatus: null,
  triggerEffects: [],
});

/** The default four-track layout for a new scenario. */
export const createDefaultTracks = (): Track[] => [
  createEmptyTrack(),
  createEmptyTrack(),
  createEmptyTrack(),
  createEmptyTrack(),
];

/** Normalize one (possibly partial/deserialized) track into the canonical shape. */
export const normalizeTrack = (track: Partial<Track> | null | undefined): Track => {
  if (!track) return createEmptyTrack();
  const merged = {
    ...createEmptyTrack(),
    ...track,
    actions: track.actions || [],
  };

  const baseStats = createDefaultStats();
  const hasIncomingStats = track.stats && typeof track.stats === 'object';
  merged.stats = { ...baseStats, ...(hasIncomingStats ? track.stats : {}) };

  if (!merged.weaponAppliedDeltas || typeof merged.weaponAppliedDeltas !== 'object')
    merged.weaponAppliedDeltas = {};
  if (!merged.equipmentAppliedDeltas || typeof merged.equipmentAppliedDeltas !== 'object')
    merged.equipmentAppliedDeltas = {};
  const mergedRecord = merged as Record<string, unknown>;
  if (!('operatorStatus' in mergedRecord)) mergedRecord.operatorStatus = null;
  if (!('baseStats' in mergedRecord)) mergedRecord.baseStats = null;
  if (!('enemyStatus' in mergedRecord)) mergedRecord.enemyStatus = null;
  if (!Array.isArray(merged.triggerEffects)) merged.triggerEffects = [];

  merged.equipArmorRefineTier = clampEquipmentRefineTier(merged.equipArmorRefineTier);
  merged.equipGlovesRefineTier = clampEquipmentRefineTier(merged.equipGlovesRefineTier);
  merged.equipAccessory1RefineTier = clampEquipmentRefineTier(merged.equipAccessory1RefineTier);
  merged.equipAccessory2RefineTier = clampEquipmentRefineTier(merged.equipAccessory2RefineTier);

  if (!hasIncomingStats) {
    const eff = Number(track.gaugeEfficiency);
    if (Number.isFinite(eff)) merged.stats.ult_charge_eff = eff;
    const link = Number(track.linkCdReduction);
    if (Number.isFinite(link)) merged.stats.link_cd_reduction = link;
    const arts = Number(track.originiumArtsPower);
    if (Number.isFinite(arts)) merged.stats.originium_arts_power = arts;
  }

  merged.gaugeEfficiency = Number(merged.stats.ult_charge_eff) || 0;
  merged.linkCdReduction = clampPercent(merged.stats.link_cd_reduction);
  merged.originiumArtsPower = Number(merged.stats.originium_arts_power) || 0;

  return merged;
};

/** Normalize a list of tracks. */
export const normalizeTracks = (list: (Partial<Track> | undefined)[] = []): Track[] =>
  list.map(t => normalizeTrack(t));
