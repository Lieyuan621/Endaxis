import type { Effect, TriggerEffect } from '../types';
import type { EnemyStateEvent } from '@/simulation/engine/types';

export interface CriterionMechanism {
  /** Number of selectable levels (for value-array indexing / clamping). */
  levelCount: number;
  effects?: Effect[];
  triggers?: TriggerEffect[];
  /** Triggers whose *structure* depends on the selected level. When present, the injection uses
   *  `triggersByLevel[level-1]` in addition to `triggers` (which holds level-invariant triggers). */
  triggersByLevel?: TriggerEffect[][];
}

/**
 * Heat Loss (队列：失温 / 热流失) — c1003 Battle Skill / c1004 Combo Skill.
 *
 * Every 2 (level 1) / every (level 2) qualifying skill cast by ANY operator — each cast gated by a
 * per-caster 1s recast cooldown (`icd`) — adds 1 Cryo Infliction stack to the CONTROLLED operator
 * (`target:'controlled'`); team-wide counting for level 1 uses a shared boolean toggle hosted on the
 * enemy. On the 4th stack all Cryo is consumed and converted to Freeze. Display-only: every status
 * here omits `stat`, so it never touches the damage model.
 */
// Cryo persists until consumed (no natural decay). NOT literal Infinity: the operator-effect handler
// treats an Infinity expiry as a hidden permanent passive and skips the status log + onStatusApplied —
// which the Cryo display and the 4-stack→Freeze conversion both depend on. A large finite value is
// effectively infinite for any real timeline while keeping those alive.
const HEAT_LOSS_CRYO_DURATION = 1e9;
const HEAT_LOSS_FROZEN_DURATION = 5;
const HEAT_LOSS_ICD = 1;
const HEAT_LOSS_CRYO_ID = 'cc:heat-loss:cryo';
/** Shared operator-Freeze status id (one freeze state regardless of which source froze the operator),
 *  so the lysis criteria (Pyrolysis/Biolysis/Electrolysis/Physicolysis) can extend / dispel it. */
const FROZEN_ID = 'cc:frozen';
const FROZEN_ICON = '/icons/icon_battle_debuff_frozen.webp';
/** Convention id for "this operator ignores Cryo Infliction" (e.g. Estella talent 2). An operator
 *  carrying this hidden status as the controlled operator accrues no Heat Loss Cryo (so never Freezes). */
export const CRYO_INFLICTION_IMMUNE_ID = 'cryo-infliction-immune';

function heatLossMechanism(group: number, skillType: 'battleSkill' | 'comboSkill'): CriterionMechanism {
  const cryoId = HEAT_LOSS_CRYO_ID;
  const toggleId = `cc:${group}:toggle`;
  const frozenId = FROZEN_ID;
  // While the controlled operator is Frozen, no new Cryo stacks accrue.
  const notFrozen = {
    kind: 'not' as const,
    condition: { kind: 'operatorStatus' as const, status: frozenId, target: 'controlled' as const },
  };
  // Operators with the cryo-immunity marker (e.g. Estella) accrue no Cryo while controlled.
  const notCryoImmune = {
    kind: 'not' as const,
    condition: {
      kind: 'operatorStatus' as const,
      status: CRYO_INFLICTION_IMMUNE_ID,
      target: 'controlled' as const,
    },
  };
  const cryo = (extra: Partial<Effect>): Effect =>
    ({
      kind: 'status',
      id: cryoId,
      target: 'controlled',
      stacks: 1,
      maxStacks: 4,
      stackStrategy: 'REFRESH_DURATION',
      duration: HEAT_LOSS_CRYO_DURATION,
      displayType: 'cryo_infliction',
      icon: '/icons/icon_energy_fusion_cryst.webp',
      icd: HEAT_LOSS_ICD,
      icdGroup: HEAT_LOSS_CRYO_ID,
      ...extra,
    }) as Effect;
  const castTrigger = (effects: Effect[]): TriggerEffect => ({
    trigger: { kind: 'onActionStart', skillTypes: skillType, triggerScope: 'global' },
    effects,
  });
  return {
    levelCount: 2,
    // Level-invariant: at the 4th Cryo stack, consume all Cryo and apply Frozen (display-only).
    triggers: [
      {
        trigger: { kind: 'onStatusApplied', status: cryoId, target: 'self', triggerScope: 'global' },
        effects: [
          {
            kind: 'status',
            id: frozenId,
            target: 'controlled',
            maxStacks: 1,
            duration: HEAT_LOSS_FROZEN_DURATION,
            displayType: 'solidification',
            icon: FROZEN_ICON,
            condition: {
              kind: 'operatorStatus',
              status: cryoId,
              target: 'controlled',
              stacks: { compare: 'atLeast', count: 4 },
              consume: true,
            },
          } as Effect,
        ],
      },
    ],
    triggersByLevel: [
      // Level 1 — every 2 team-wide casts (boolean toggle on the enemy).
      [
        castTrigger([
          // bank: when the toggle is absent, set it (this cast is the "1st of 2").
          {
            kind: 'status',
            id: toggleId,
            target: 'enemy',
            maxStacks: 1,
            duration: Infinity,
            ignoreTimeShift: true,
            hide: true,
            silent: true,
            icd: HEAT_LOSS_ICD,
            condition: { kind: 'not', condition: { kind: 'enemyStatus', status: toggleId } },
          } as Effect,
          // cryo+: when the toggle is present (the "2nd"), consume it and add a Cryo stack —
          // unless the controlled operator is already Frozen.
          cryo({
            condition: [
              { kind: 'enemyStatus', status: toggleId, consume: true },
              notFrozen,
              notCryoImmune,
            ],
          }),
        ]),
      ],
      // Level 2 — every cast adds a Cryo stack, unless the controlled operator is Frozen or immune.
      [castTrigger([cryo({ condition: [notFrozen, notCryoImmune] })])],
    ],
  };
}

/**
 * Lysis family (融化 / 升华 / 电解 / 切削) — c1017 / c1018 / c1019 / c1024.
 *
 * Modifies the operator Freeze produced by Heat Loss: while active, Freeze lasts 15s (vs the base 5s).
 * A matching Battle/Combo Skill dispels it and leaves 1 Cryo stack; a matching Ultimate only dispels.
 */
const LYSIS_FREEZE_DURATION = 15;

function lysisMechanism(element: 'heat' | 'nature' | 'electric' | 'physical'): CriterionMechanism {
  const frozenCondition = (consume = false) => ({
    kind: 'operatorStatus' as const,
    status: FROZEN_ID,
    target: 'controlled' as const,
    ...(consume ? { consume: true } : {}),
  });
  const dispelCarrier = (): Effect => ({
    kind: 'status',
    id: `cc:dispel:${element}`,
    target: 'controlled',
    duration: 0,
    hide: true,
    silent: true,
    condition: frozenCondition(true),
  } as Effect);

  return {
    levelCount: 1,
    triggers: [
      // Extend: when the operator Freeze lands, replace it with the longer 15s window. `silent` so the
      // re-apply doesn't re-fire onStatusApplied (no extend→extend loop); it still renders.
      {
        trigger: { kind: 'onStatusApplied', status: FROZEN_ID, target: 'self', triggerScope: 'global' },
        effects: [
          {
            kind: 'status',
            id: FROZEN_ID,
            target: 'controlled',
            maxStacks: 1,
            duration: LYSIS_FREEZE_DURATION,
            stackStrategy: 'REPLACE',
            displayType: 'solidification',
            icon: FROZEN_ICON,
            silent: true,
          } as Effect,
        ],
      },
      // Battle/Combo thaw: leave one Cryo stack, then consume Freeze at priority 3.
      {
        trigger: {
          kind: 'onActionStart',
          element,
          skillTypes: ['battleSkill', 'comboSkill'],
          triggerScope: 'global',
        },
        effects: [
          {
            kind: 'status',
            id: HEAT_LOSS_CRYO_ID,
            target: 'controlled',
            stacks: 1,
            maxStacks: 4,
            stackStrategy: 'REFRESH_DURATION',
            duration: HEAT_LOSS_CRYO_DURATION,
            displayType: 'cryo_infliction',
            icon: '/icons/icon_energy_fusion_cryst.webp',
            condition: frozenCondition(),
          } as Effect,
          dispelCarrier(),
        ],
      },
      // Ultimate thaw: consume Freeze without leaving Cryo.
      {
        trigger: {
          kind: 'onActionStart',
          element,
          skillTypes: 'ultimate',
          triggerScope: 'global',
        },
        effects: [dispelCarrier()],
      },
    ],
  };
}

/** The five infliction/vulnerability (status, element) pairs the enemy can carry. */
const INFLICTION_PAIRS = [
  ['vulnerability', 'physical'],
  ['heatInfliction', 'heat'],
  ['cryoInfliction', 'cryo'],
  ['electricInfliction', 'electric'],
  ['natureInfliction', 'nature'],
] as const;

export const CRITERION_MECHANISMS: Record<number, CriterionMechanism> = {
  // ── Weaken (队列：萎缩) — operator main attribute ×0.9 / ×0.8 / ×0.6 ──────────
  1028: {
    levelCount: 3,
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributePercent', attribute: 'main' },
        target: 'team',
        value: [-10, -20, -40],
        external: true,
      },
    ],
  },

  // ── Strangle (队列：扼制) — after raising an enemy's vuln/infliction, that operator's
  //    matching-type DMG -45% / -90% for 10s. ─────────────────────────────────────
  1009: {
    levelCount: 2,
    triggers: INFLICTION_PAIRS.map(
      ([status, element]): TriggerEffect => ({
        trigger: { kind: 'onStatusApplied', status, target: 'enemy', triggerScope: 'global' },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: [element] },
            target: 'self',
            value: [-45, -90],
            duration: 10,
            external: true,
          },
        ],
      }),
    ),
  },

  // ── Bent Edges (队列：折刃) — each ultimate cast: subsequent ultimate DMG -50% / -100%. ──
  1005: {
    levelCount: 2,
    triggers: [
      {
        trigger: { kind: 'onActionStart', skillTypes: 'ultimate', triggerScope: 'global' },
        effects: [
          {
            kind: 'status',
            id: 'bent-edges',
            stat: { modifier: 'dmgBonus', skillTypes: 'ultimate' },
            target: 'self',
            value: 0,
            scaling: {
              additive: [{ key: 'bent-edges-count', target: 'self', coefficient: [-50, -100] }],
            },
            external: true,
            stackStrategy: 'REPLACE',
            duration: Infinity,
            hide: true,
          },
          {
            kind: 'status',
            id: 'bent-edges-count',
            target: 'self',
            stacks: 1,
            maxStacks: 99,
            stackStrategy: 'REFRESH_DURATION',
            duration: Infinity,
            hide: true,
          },
        ],
      },
    ],
  },

  // ── Poor Basics (队列：脱力) — Basic Attack DMG -70%. ─────────────────────────────
  1008: {
    levelCount: 1,
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'basicAttack' },
        target: 'team',
        value: -70,
        external: true,
      },
    ],
  },

  // ── Effect Barrier (改写：屏障) — each enemy can only receive vuln or a same-type Arts
  //    Infliction once every 5s. ───────────────────────────────────────────────────
  1010: {
    levelCount: 1,
    triggers: INFLICTION_PAIRS.map(
      ([listen, element]): TriggerEffect => ({
        trigger: {
          kind: 'onStatusApplied',
          status: listen,
          target: 'enemy',
          triggerScope: 'global',
        },
        effects: [
          {
            kind: 'status',
            id: `inflictionBarrier-${element}`,
            stat: { modifier: 'inflictionBarrier', elements: element },
            target: 'enemy',
            duration: 5,
            silent: true,
            hide: true,
          },
        ],
      }),
    ),
  },

  // ── Overclock (环境：过速) — Combo Skill cooldown ×0.4 (-60%); Battle Skill DMG -60%. ──
  1000: {
    levelCount: 1,
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'cooldownReductionPercent', skillTypes: 'comboSkill' },
        target: 'team',
        value: 60,
        external: true,
      },
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'battleSkill' },
        target: 'team',
        value: -60,
      },
    ],
  },

  // ── Tremor (环境：震荡) — Battle Skill DMG -60%; non-skill-typed DMG +100%. ─────────
  1032: {
    levelCount: 1,
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'battleSkill' },
        target: 'team',
        value: -60,
      },
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'nonSkill' },
        target: 'team',
        value: 100,
        external: true,
      },
    ],
  },

  // ── Wrap (改写：裹附) — per vuln/Arts-Infliction stack on an enemy, that enemy takes
  //    -10% matching-type DMG; ends with the stack. ─────────────────────────────────
  1031: {
    levelCount: 1,
    triggers: INFLICTION_PAIRS.flatMap(([key, element]): TriggerEffect[] => {
      const base = {
        kind: 'status' as const,
        id: `wrap-${element}`,
        stat: { modifier: 'increasedDmgTaken' as const, elements: element },
        target: 'enemy' as const,
        external: true,
        stacks: 1,
        maxStacks: 1,
        duration: Infinity,
        hide: true,
        silent: true,
      };
      return [
        {
          trigger: { kind: 'onStatusApplied', status: key, target: 'enemy', triggerScope: 'global' },
          effects: [
            {
              ...base,
              value: 0,
              scaling: { additive: [{ key, target: 'enemy', coefficient: -10 }] },
            },
          ],
        },
        {
          trigger: { kind: 'onStatusExpire', status: key, target: 'enemy', triggerScope: 'global' },
          effects: [{ ...base, value: 0 }],
        },
        {
          trigger: { kind: 'onStatusConsumed', status: key, target: 'enemy', triggerScope: 'global' },
          effects: [{ ...base, value: 0 }],
        },
      ];
    }),
  },

  // ─── Placeholders — criteria with no damage-model mechanism (yet) ─────────────
  // Mechanics that don't affect the damage simulation. Fill in `effects` / `triggers` if/when modeled.

  // Thrill (改写：刺激) — enemy DMG dealt +30% / +80%.
  1002: { levelCount: 2 },
  // Time Limit (环境：时限) — countdown -100s / -200s / -300s.
  1021: { levelCount: 3 },
  // Vitality (改写：活性) — enemy HP +50% / +100% / +200%.
  9001: { levelCount: 3 },
  // Decapitate (队列：斩首) — controlled operator DMG taken +50% / +100%.
  1006: { levelCount: 2 },
  // Shared group c1013: Hypoxia (环境：厌氧, stamina recovery -50%) and Mire (环境：禁锢, dodge disabled) — mutually exclusive.
  1013: { levelCount: 2 },
  // Withering (环境：枯萎) — fewer / no between-wave healing masses.
  1020: { levelCount: 2 },
  // Reconstitution (环境：再构成) — elite enemy wave replacement.
  1022: { levelCount: 2 },
  // Surge (改写：奔腾) — enemy move speed +100%; DMG taken capped at 25% max HP per 0.1s.
  1023: { levelCount: 1 },
  // Sync Growth (环境：同步生长) — controlled operator heal/shield heals on-field enemies 8% max HP.
  1033: { levelCount: 1 },
  // Burden (队列：重负) — no heavy-hit state pauses natural ATB recovery for 12s.
  1034: { levelCount: 1 },
  // Exhaustion (队列：衰竭) — DMG taken converts to max-HP loss (melee 30% / ranged 50%).
  1014: { levelCount: 1 },
  // Heat Draw (改写：热量汲取) — enemy Cryo infliction directly applies Freeze.
  1016: { levelCount: 1 },
  // Partition (环境：分隔) — controlled operator cannot be switched once battle begins.
  1012: { levelCount: 1 },
  // Toxic Residue (改写：遗毒) — defeated enemy leaves a toxic patch (2% / 5% max HP per second).
  1015: { levelCount: 2 },
  // Heat Loss · Battle Skill (队列：失温) — Battle Skill casts grant the controlled operator Cryo → Freeze.
  1003: heatLossMechanism(1003, 'battleSkill'),
  // Heat Loss · Combo Skill (队列：热流失) — Combo Skill casts grant the controlled operator Cryo → Freeze.
  1004: heatLossMechanism(1004, 'comboSkill'),
  // Pyrolysis (环境：融化) — Freeze extended to 15s; dispel with a Heat-type skill.
  1017: lysisMechanism('heat'),
  // Biolysis (环境：升华) — Freeze extended to 15s; dispel with a Nature-type skill.
  1018: lysisMechanism('nature'),
  // Electrolysis (环境：电解) — Freeze extended to 15s; dispel with an Electric-type skill.
  1019: lysisMechanism('electric'),
  // Physicolysis (环境：切削) — Freeze extended to 15s; dispel with a Physical-type skill.
  1024: lysisMechanism('physical'),
  // Healing (改写：愈合) — enemy under control effects regenerates 5% / 15% max HP per second.
  1011: { levelCount: 2 },
};

const VITALITY_HP_MULTIPLIERS = [1.5, 2, 3] as const;
const HEALING_RATES = [0.05, 0.15] as const;
const SURGE_DAMAGE_CAP = Object.freeze({
  windowSeconds: 0.1,
  ratio: 0.25,
});

const CONTROL_PHYSICAL_TYPES = new Set(["lift", "knockdown"]);
const CONTROL_DEBUFF_TYPES = new Set(["solidification"]);
const CONTROL_STATUS_IDS = new Set([
  "endministrator-originium-crystals",
  "tangtang-oldenStare",
]);

const FROZEN_CONTROL_SUPER_ARMOR_LIMIT = 20;
const PHYSICAL_CONTROL_SUPER_ARMOR_LIMIT = 30;
const CONTROL_STATUS_SUPER_ARMOR_LIMITS = new Map<string, number>([
  ["endministrator-originium-crystals", FROZEN_CONTROL_SUPER_ARMOR_LIMIT],
]);

export interface EnemyDamageCapConfig {
  windowSeconds: number;
  ratio: number;
}

export interface EnemyControlInterval {
  start: number;
  end: number;
}

export function getSelectedCriterionLevel(
  tagIds: readonly unknown[] | undefined,
  groupId: number,
  levelCount: number,
): number | null {
  for (const rawId of tagIds || []) {
    const tagId = Number(rawId);
    if (!Number.isFinite(tagId)) continue;
    if (Math.floor(tagId / 100) !== groupId) continue;
    return Math.max(0, Math.min((tagId % 100) - 1, Math.max(0, levelCount - 1)));
  }
  return null;
}

export function getContingencyEnemyHpMultiplier(tagIds: readonly unknown[] | undefined): number {
  const level = getSelectedCriterionLevel(tagIds, 9001, VITALITY_HP_MULTIPLIERS.length);
  return level == null ? 1 : VITALITY_HP_MULTIPLIERS[level] ?? 1;
}

export function getContingencyEnemyHealingRate(tagIds: readonly unknown[] | undefined): number {
  const level = getSelectedCriterionLevel(tagIds, 1011, HEALING_RATES.length);
  return level == null ? 0 : HEALING_RATES[level] ?? 0;
}

export function getContingencyEnemyDamageCap(
  tagIds: readonly unknown[] | undefined,
): EnemyDamageCapConfig | null {
  return getSelectedCriterionLevel(tagIds, 1023, 1) == null ? null : { ...SURGE_DAMAGE_CAP };
}

export function buildEffectiveEnemySystemConstants<T extends Record<string, any>>(
  systemConstants: T,
  tagIds: readonly unknown[] | undefined,
): T {
  const baseHp = Math.max(1, Number(systemConstants?.enemyHp) || 1);
  const damageCap = getContingencyEnemyDamageCap(tagIds);
  return {
    ...systemConstants,
    enemyHp: Math.round(baseHp * getContingencyEnemyHpMultiplier(tagIds)),
    enemyDamageCapWindowSeconds: damageCap?.windowSeconds,
    enemyDamageCapRatio: damageCap?.ratio,
  };
}

function finiteInterval(start: unknown, end: unknown, until: number): EnemyControlInterval | null {
  const s = Math.max(0, Number(start) || 0);
  const rawEnd = Number(end);
  const e = Number.isFinite(rawEnd) ? Math.min(rawEnd, until) : until;
  if (!(e > s)) return null;
  return { start: s, end: e };
}

function getBaseRuntimeStatusId(statusId: unknown): string {
  return String(statusId ?? "").split("@")[0] ?? "";
}

function isControlStatusId(statusId: unknown): boolean {
  return CONTROL_STATUS_IDS.has(getBaseRuntimeStatusId(statusId));
}

function canControlByStatus(statusId: unknown, superArmor: number): boolean {
  const limit = CONTROL_STATUS_SUPER_ARMOR_LIMITS.get(getBaseRuntimeStatusId(statusId));
  return limit === undefined || superArmor <= limit;
}

export function buildContingencyEnemyControlIntervals(
  enemyLog: readonly EnemyStateEvent[] | undefined,
  until = Infinity,
  superArmor = 0,
): EnemyControlInterval[] {
  const limit = Number.isFinite(until) ? Math.max(0, until) : Infinity;
  const armor = Math.max(0, Number(superArmor) || 0);
  const intervals: EnemyControlInterval[] = [];

  for (const event of enemyLog || []) {
    if (event.type === "PHYSICAL_STATUS" && CONTROL_PHYSICAL_TYPES.has(event.physicalType)) {
      if (event.actualControl === false) continue;
      if (armor >= PHYSICAL_CONTROL_SUPER_ARMOR_LIMIT) continue;
      const duration = Number(event.effectiveDuration) || 0;
      const interval = finiteInterval(event.time, event.time + duration, limit);
      if (interval) intervals.push(interval);
      continue;
    }

    if (event.type === "DEBUFF_APPLY" && CONTROL_DEBUFF_TYPES.has(event.debuffType)) {
      if (armor > FROZEN_CONTROL_SUPER_ARMOR_LIMIT) continue;
      const interval = finiteInterval(event.time, event.expiresAt, limit);
      if (interval) intervals.push(interval);
      continue;
    }

    if (event.type === "ENEMY_STATUS_APPLY" && isControlStatusId(event.id)) {
      if (!canControlByStatus(event.id, armor)) continue;
      const interval = finiteInterval(event.time, event.expiresAt, limit);
      if (interval) intervals.push(interval);
    }
  }

  intervals.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: EnemyControlInterval[] = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end + 0.0001) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }
  return merged;
}

export function computeContingencyEnemyHealing(
  enemyLog: readonly EnemyStateEvent[] | undefined,
  {
    maxHp,
    rate,
    until = Infinity,
    superArmor = 0,
  }: {
    maxHp: number;
    rate: number;
    until?: number;
    superArmor?: number;
  },
): number {
  const hp = Math.max(0, Number(maxHp) || 0);
  const healRate = Math.max(0, Number(rate) || 0);
  if (hp <= 0 || healRate <= 0) return 0;

  return buildContingencyEnemyControlIntervals(enemyLog, until, superArmor).reduce(
    (sum, interval) => sum + (interval.end - interval.start) * healRate * hp,
    0,
  );
}

/** True when the given numeric groupId has a damage-model mechanism (effects or triggers) implemented. */
export function hasCriterionMechanism(groupId: number): boolean {
  const mech = CRITERION_MECHANISMS[groupId];
  return !!mech && (
    (mech.effects?.length ?? 0) > 0
    || (mech.triggers?.length ?? 0) > 0
    || (mech.triggersByLevel?.some(level => level.length > 0) ?? false)
  );
}
