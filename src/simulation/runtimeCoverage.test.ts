import { describe, expect, it } from 'vitest';
import { getGearPieceList, getGearSet, getOperator, getOperatorList, getWeaponList } from '@/data';
import { collectEffects, collectTriggerEffects, patchCombatSkills } from '@/data/collect';
import type { Effect, TriggerEffect } from '@/data/types';
import type { GearInstance, OperatorInstance, TeamInstance, WeaponInstance } from '@/types';
import { extractRawEntries, resolveHitsFromSheet } from '@/stores/timeline/resolveHits';
import { compileScenario } from './compiler/compileScenario';
import type { Action, ScenarioData, ScenarioTrack } from './compiler/types';
import { simulate } from './simulator';
import type { InitialEffect } from './simulator';
import { TriggerRegistry } from './engine/TriggerRegistry';
import { createDefaultStats } from '@/simulation/defaultActorStats';
import type { BaseStatValues } from '@/data/stats/types';
import { i18n } from '@/i18n';

type RuntimeTriggerEntry = {
  sourceTrackId: string;
  sourceSkillType?: string;
  triggerEffect: TriggerEffect;
};

type SweepFailure = {
  scope: string;
  id: string;
  detail: string;
};

const BASE_STATS: BaseStatValues = {
  level: 60,
  baseAtk: 1000,
  baseHp: 1000,
  weaponAtk: 0,
  baseAttrs: {
    strength: 100,
    agility: 100,
    intellect: 100,
    will: 100,
  },
  mainAttributeName: 'agility',
  secondaryAttributeName: 'intellect',
};

i18n.global.mergeLocaleMessage('zh-CN', {
  game: {
    slotType: { armor: 'Armor', gloves: 'Gloves', kit: 'Kit', kit1: 'Kit 1', kit2: 'Kit 2' },
    stat: { defense: 'Defense' },
  },
});

function createAction(id: string, type: Action['type'], patch: Partial<Action> = {}): Action {
  const startTime = Number(patch.startTime) || 0;
  return {
    id,
    instanceId: patch.instanceId || `${id}_inst`,
    type,
    skillId: patch.skillId || id,
    name: patch.name || id,
    startTime,
    logicalStartTime: patch.logicalStartTime ?? startTime,
    cooldown: 0,
    spCost: 0,
    spGain: 0,
    spGainKind: 'recover',
    element: 'physical',
    gaugeCost: 0,
    gaugeGain: 0,
    teamGaugeGain: 0,
    enhancementTime: 0,
    duration: 1,
    triggerWindow: 0,
    animationTime: 0,
    isDisabled: false,
    hits: [],
    ...patch,
  };
}

function createTrack(
  id: string,
  actions: Action[],
  patch: Partial<ScenarioTrack> = {},
): ScenarioTrack {
  const stats = {
    ...createDefaultStats(),
    ...(patch.stats || {}),
  } as ScenarioTrack['stats'];

  return {
    id,
    actions,
    stats,
    baseStats: BASE_STATS,
    gaugeEfficiency: Number(stats.ult_charge_eff) || 100,
    originiumArtsPower: Number(stats.originium_arts_power) || 0,
    linkCdReduction: Number(stats.link_cd_reduction) || 0,
    initialGauge: 0,
    maxGaugeOverride: null,
    acceptTeamGauge: true,
    ...patch,
  };
}

function createScenario(tracks: ScenarioTrack[]): ScenarioData {
  return { tracks, connections: [] };
}

function simulateTracks(
  tracks: ScenarioTrack[],
  triggerEntries: RuntimeTriggerEntry[] = [],
  initialEffects: InitialEffect[] = [],
) {
  const { timeline, teamConfig, enemyConfig, actors } = compileScenario(createScenario(tracks));
  const baseStatsByTrack = new Map<string, BaseStatValues>(
    actors.map(actor => [actor.id, BASE_STATS]),
  );
  return simulate(
    timeline,
    teamConfig,
    enemyConfig,
    actors,
    triggerEntries.length ? new TriggerRegistry(triggerEntries) : undefined,
    undefined,
    {
      initialEffects,
      baseStatsByTrack,
      enemyDef: 100,
    },
  );
}

function createOperatorInstance(operatorSlug: string): OperatorInstance {
  const sheet = getOperator(operatorSlug);
  return {
    id: `op_${operatorSlug}`,
    operatorSlug,
    level: 60,
    promoted: true,
    potential: sheet?.potentials?.length ?? 0,
    skillLevels: {
      basicAttack: 12,
      battleSkill: 12,
      comboSkill: 12,
      ultimate: 12,
    },
    talentStates: Object.fromEntries(
      (sheet?.talents ?? []).map((group, index) => [String(index), Math.max(1, group.levels ?? 1)]),
    ),
    trustLevel: 0,
  };
}

function createWeaponInstance(weaponSlug: string): WeaponInstance {
  return {
    id: `wp_${weaponSlug}`,
    weaponSlug,
    level: 60,
    tuned: true,
    potential: 0,
    skill1Level: 12,
    skill2Level: 12,
    skill3Level: 12,
  };
}

function createTeam(
  operatorSlug = 'estella',
  weaponSlug: string | null = null,
  gearIds: Partial<TeamInstance['slots'][number]['gear']> = {},
): TeamInstance {
  return {
    id: 'team',
    name: 'Runtime sweep',
    slots: [
      {
        operatorId: `op_${operatorSlug}`,
        weaponId: weaponSlug ? `wp_${weaponSlug}` : null,
        gear: {
          armor: gearIds.armor ?? null,
          gloves: gearIds.gloves ?? null,
          kit1: gearIds.kit1 ?? null,
          kit2: gearIds.kit2 ?? null,
        },
      },
      {
        operatorId: null,
        weaponId: null,
        gear: { armor: null, gloves: null, kit1: null, kit2: null },
      },
      {
        operatorId: null,
        weaponId: null,
        gear: { armor: null, gloves: null, kit1: null, kit2: null },
      },
      {
        operatorId: null,
        weaponId: null,
        gear: { armor: null, gloves: null, kit1: null, kit2: null },
      },
    ],
  };
}

function toRuntimeTriggers(
  team: TeamInstance,
  operators: OperatorInstance[],
  weapons: WeaponInstance[] = [],
  gear: GearInstance[] = [],
): RuntimeTriggerEntry[] {
  return collectTriggerEffects(team, operators, weapons, gear, new Map()).map(entry => ({
    ...entry,
    sourceTrackId: 'alpha',
  }));
}

function toRuntimeInitialEffects(
  team: TeamInstance,
  operators: OperatorInstance[],
  weapons: WeaponInstance[] = [],
  gear: GearInstance[] = [],
): InitialEffect[] {
  const enemyStatModifiers = new Set(['susceptibility', 'increasedDmgTaken', 'resistanceShred']);
  return collectEffects(team, operators, weapons, gear).flatMap((entry): InitialEffect[] => {
    const effect = entry.effect as any;
    if (!effect || effect.kind !== 'status' || effect.condition || !effect.stat) return [];
    const rawTarget = effect.target;
    const scope = typeof rawTarget === 'string' ? rawTarget : rawTarget?.scope;
    if (scope === 'enemy') return [];
    if (enemyStatModifiers.has(effect.stat?.modifier)) return [];

    const targetTrackIds = scope === 'team' ? ['alpha'] : ['alpha'];
    return targetTrackIds.map(targetTrackId => ({
      targetTrackId,
      id: effect.id,
      stat: effect.stat,
      value: Number(effect.value) || 0,
      sourceId: 'alpha',
      effect: { ...effect, hide: true },
      stacks: effect.stacks,
      maxStacks: effect.maxStacks,
      stackStrategy: effect.stackStrategy,
    }));
  });
}

function triggerExerciseActions(): Action[] {
  return [
    createAction('basic', 'basicAttack', {
      startTime: 0,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 10, spReturn: 0, stagger: 5 }],
    }),
    createAction('battle', 'battleSkill', {
      startTime: 1,
      element: 'heat',
      hits: [
        {
          offset: 0,
          multiplier: 100,
          spRecovery: 10,
          spReturn: 0,
          stagger: 5,
          effects: [
            { kind: 'infliction', element: 'heat', stacks: 1 } as Effect,
            {
              id: 'runtime-sweep-self-status',
              kind: 'status',
              stat: { modifier: 'link' },
              target: 'self',
              value: 1,
              duration: 3,
            } as Effect,
          ],
        },
      ],
    }),
    createAction('combo', 'comboSkill', {
      startTime: 2,
      hits: [
        {
          offset: 0,
          multiplier: 100,
          spRecovery: 10,
          spReturn: 0,
          stagger: 5,
          effects: [{ kind: 'physicalStatus', physicalType: 'lift' } as Effect],
        },
      ],
    }),
    createAction('ultimate', 'ultimate', {
      startTime: 3,
      element: 'electric',
      hits: [{ offset: 0, multiplier: 100, spRecovery: 10, spReturn: 0, stagger: 5 }],
    }),
    createAction('finisher', 'finisher', {
      startTime: 4,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
    }),
    createAction('dive', 'dive', {
      startTime: 5,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
    }),
  ];
}

function recordFailure(failures: SweepFailure[], scope: string, id: string, error: unknown) {
  failures.push({
    scope,
    id,
    detail: error instanceof Error ? error.message : String(error),
  });
}

function expectNoFailures(failures: SweepFailure[]) {
  expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
}

describe('optimizer-native full runtime coverage sweep', () => {
  it('resolves and simulates every operator combat skill segment', () => {
    const failures: SweepFailure[] = [];

    for (const { slug } of getOperatorList()) {
      const sheet = getOperator(slug);
      if (!sheet) continue;
      const patched = patchCombatSkills(sheet, {
        talentStates: Object.fromEntries(
          (sheet.talents ?? []).map((group, index) => [
            String(index),
            Math.max(1, group.levels ?? 1),
          ]),
        ),
        potential: sheet.potentials?.length ?? 0,
      });

      for (const [skillKey, skill] of Object.entries(patched)) {
        const segments = Array.isArray(skill?.segments) ? skill.segments : [];
        for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
          try {
            const rawEntries = extractRawEntries(skill, segmentIndex);
            const hits = resolveHitsFromSheet([], rawEntries, 11, { preserveCondition: true });
            const segment = segments[segmentIndex];
            simulateTracks([
              createTrack('alpha', [
                createAction(`${slug}_${skillKey}_${segmentIndex}`, skill.type as Action['type'], {
                  element:
                    segment?.damageGroups?.find((group: any) => group?.element)?.element ??
                    sheet.element ??
                    'physical',
                  duration: Number(segment?.duration) || 1,
                  hits,
                }),
              ]),
            ]);
          } catch (error) {
            recordFailure(
              failures,
              'operator-skill',
              `${slug}:${skillKey}:segment${segmentIndex}`,
              error,
            );
          }
        }
      }
    }

    expectNoFailures(failures);
  });

  it('collects and simulates every weapon trigger sheet', () => {
    const failures: SweepFailure[] = [];
    const operator = createOperatorInstance('estella');

    for (const { slug } of getWeaponList()) {
      try {
        const weapon = createWeaponInstance(slug);
        const team = createTeam('estella', slug);
        const triggerEntries = toRuntimeTriggers(team, [operator], [weapon]);
        simulateTracks(
          [createTrack('alpha', triggerExerciseActions(), { triggerEffects: triggerEntries })],
          triggerEntries,
        );
      } catch (error) {
        recordFailure(failures, 'weapon-trigger', slug, error);
      }
    }

    expectNoFailures(failures);
  });

  it('collects and simulates every 3-piece gear-set trigger sheet', () => {
    const failures: SweepFailure[] = [];
    const operator = createOperatorInstance('estella');
    const piecesBySet = new Map<string, string[]>();

    for (const piece of getGearPieceList()) {
      if (!piece.setSlug || piece.setSlug === 'no-set-bonuses') continue;
      const list = piecesBySet.get(piece.setSlug) ?? [];
      list.push(piece.slug);
      piecesBySet.set(piece.setSlug, list);
    }

    for (const [setSlug, pieces] of piecesBySet) {
      if (!getGearSet(setSlug) || pieces.length < 3) continue;
      try {
        const gearInstances: GearInstance[] = pieces.slice(0, 3).map((pieceSlug, index) => ({
          id: `gear_${index}`,
          gearPieceId: pieceSlug,
          artificingLevels: [],
        }));
        const team = createTeam('estella', null, {
          armor: gearInstances[0]?.id ?? null,
          gloves: gearInstances[1]?.id ?? null,
          kit1: gearInstances[2]?.id ?? null,
        });
        const triggerEntries = toRuntimeTriggers(team, [operator], [], gearInstances);
        simulateTracks(
          [createTrack('alpha', triggerExerciseActions(), { triggerEffects: triggerEntries })],
          triggerEntries,
        );
      } catch (error) {
        recordFailure(failures, 'gear-set-trigger', setSlug, error);
      }
    }

    expectNoFailures(failures);
  });

  it('collects and simulates passive runtime initial effects for every operator, weapon, and gear piece', () => {
    const failures: SweepFailure[] = [];
    const baseAction = createAction('passive_runtime_hit', 'battleSkill', {
      hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 }],
    });

    for (const { slug } of getOperatorList()) {
      try {
        const operator = createOperatorInstance(slug);
        const team = createTeam(slug);
        const initialEffects = toRuntimeInitialEffects(team, [operator]);
        simulateTracks([createTrack('alpha', [baseAction])], [], initialEffects);
      } catch (error) {
        recordFailure(failures, 'operator-passive', slug, error);
      }
    }

    const operator = createOperatorInstance('estella');
    for (const { slug } of getWeaponList()) {
      try {
        const weapon = createWeaponInstance(slug);
        const team = createTeam('estella', slug);
        const initialEffects = toRuntimeInitialEffects(team, [operator], [weapon]);
        simulateTracks([createTrack('alpha', [baseAction])], [], initialEffects);
      } catch (error) {
        recordFailure(failures, 'weapon-passive', slug, error);
      }
    }

    for (const piece of getGearPieceList()) {
      try {
        const gear: GearInstance[] = [
          { id: 'gear_piece', gearPieceId: piece.slug, artificingLevels: [3, 3, 3] },
        ];
        const team = createTeam('estella', null, { armor: 'gear_piece' });
        const initialEffects = toRuntimeInitialEffects(team, [operator], [], gear);
        simulateTracks([createTrack('alpha', [baseAction])], [], initialEffects);
      } catch (error) {
        recordFailure(failures, 'gear-piece-passive', piece.slug, error);
      }
    }

    expectNoFailures(failures);
  });
});
