import { describe, expect, it } from 'vitest';
import { getGearPieceList, getGearSet, getOperator, getOperatorList, getWeaponList } from '@/data';
import { collectEffects, collectTriggerEffects, patchCombatSkills } from '@/data/collect';
import { createDefaultStats } from '@/simulation/defaultActorStats';
import { extractRawEntries, resolveHitsFromSheet } from '@/stores/timeline/resolveHits';
import { compileScenario } from './compiler/compileScenario';
import { simulate } from './simulator';
import { TriggerRegistry } from './engine/TriggerRegistry';
import type { Action, ScenarioData, ScenarioTrack } from './compiler/types';
import type { BaseStatValues } from '@/data/stats/types';
import type { TeamInstance, OperatorInstance, WeaponInstance } from '@/types';
import { i18n } from '@/i18n';

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

const EMPTY_GEAR = { armor: null, gloves: null, kit1: null, kit2: null };

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

function createTrack(id: string | null, actions: Action[], patch: Partial<ScenarioTrack> = {}) {
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
  } as ScenarioTrack;
}

function createScenario(tracks: ScenarioTrack[]): ScenarioData {
  return { tracks, connections: [] };
}

function runScenario(
  tracks: ScenarioTrack[],
  triggerEntries: Array<any> = [],
  consumedStackKeys = new Set<string>(),
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
    consumedStackKeys,
    {
      baseStatsByTrack,
      enemyDef: 100,
      lmdiAttributionMode: 'stacks',
    },
  );
}

function maxTalentStates(operatorSlug: string) {
  const sheet = getOperator(operatorSlug);
  return Object.fromEntries(
    (sheet?.talents || []).map((talent, index) => [String(index), Math.max(1, talent.levels || 1)]),
  );
}

function createOperatorInstance(operatorSlug: string, id = `op_${operatorSlug}`): OperatorInstance {
  return {
    id,
    operatorSlug,
    level: 60,
    promoted: true,
    potential: 6,
    skillLevels: {
      basicAttack: 9,
      battleSkill: 9,
      comboSkill: 9,
      ultimate: 9,
    },
    talentStates: maxTalentStates(operatorSlug),
    trustLevel: 0,
  } as unknown as OperatorInstance;
}

function createTeam(
  operatorId: string,
  weaponId: string | null = null,
  gear: {
    armor: string | null;
    gloves: string | null;
    kit1: string | null;
    kit2: string | null;
  } = EMPTY_GEAR,
): TeamInstance {
  return {
    id: 'team',
    name: 'team',
    slots: [
      { operatorId, weaponId, gear },
      { operatorId: null, weaponId: null, gear: { ...EMPTY_GEAR } },
      { operatorId: null, weaponId: null, gear: { ...EMPTY_GEAR } },
      { operatorId: null, weaponId: null, gear: { ...EMPTY_GEAR } },
    ],
  } as unknown as TeamInstance;
}

function mapTriggerEntriesToTracks(entries: Array<any>, tracks: ScenarioTrack[]) {
  return entries.map(entry => ({
    ...entry,
    sourceTrackId: tracks[entry.sourceSlotIndex]?.id ?? entry.sourceOperatorSlug,
  }));
}

function collectConsumedStackKeys(tracks: ScenarioTrack[], triggerEntries: Array<any>) {
  const keys = new Set<string>();
  const visitEffect = (effect: any) => {
    if (effect?.readConsumedStacks?.statusKey) keys.add(effect.readConsumedStacks.statusKey);
    if (Array.isArray(effect?.hit?.effects)) {
      for (const nested of effect.hit.effects) visitEffect(nested);
    }
  };
  for (const track of tracks) {
    for (const action of track.actions || []) {
      for (const hit of action.hits || []) {
        for (const effect of hit.effects || []) visitEffect(effect);
      }
    }
  }
  for (const entry of triggerEntries) {
    for (const effect of entry.triggerEffect?.effects || []) visitEffect(effect);
  }
  return keys;
}

function triggerExerciseActions() {
  const setupEffects: any[] = [
    {
      id: 'sweep-self-status',
      kind: 'status',
      stat: { modifier: 'link' },
      target: 'self',
      value: 1,
      duration: 1,
    },
    {
      id: 'sweep-enemy-status',
      kind: 'status',
      stat: { modifier: 'increasedDmgTaken' },
      target: 'enemy',
      value: 5,
      duration: 1,
    },
    { kind: 'infliction', element: 'heat', stacks: 1 },
    { kind: 'physicalStatus', physicalType: 'lift' },
  ];
  return [
    createAction('sweep_setup', 'battleSkill', {
      startTime: 0,
      hits: [
        {
          offset: 0,
          multiplier: 100,
          spRecovery: 10,
          spReturn: 0,
          stagger: 1,
          effects: setupEffects,
        },
      ],
    }),
    createAction('sweep_basic', 'basicAttack', {
      startTime: 1,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 1, spReturn: 0, stagger: 1 }],
    }),
    createAction('sweep_combo', 'comboSkill', {
      startTime: 2,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 1, spReturn: 0, stagger: 1 }],
    }),
    createAction('sweep_ultimate', 'ultimate', {
      startTime: 3,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 1, spReturn: 0, stagger: 1 }],
    }),
    createAction('sweep_finisher', 'finisher', {
      startTime: 4,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 1, spReturn: 0, stagger: 1 }],
    }),
    createAction('sweep_dive', 'dive', {
      startTime: 5,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 1, spReturn: 0, stagger: 1 }],
    }),
    createAction('sweep_consume', 'battleSkill', {
      startTime: 6,
      hits: [
        {
          offset: 0,
          multiplier: 100,
          spRecovery: 1,
          spReturn: 0,
          stagger: 1,
          effects: [
            { kind: 'consume', operatorStatus: 'sweep-self-status' },
            { kind: 'consume', enemyStatus: 'sweep-enemy-status' },
          ],
        },
      ],
    }),
  ];
}

function passiveDispatchActions(effects: Array<any>) {
  return [
    createAction('dispatch_passives', 'battleSkill', {
      startTime: 0,
      hits: [
        {
          offset: 0,
          multiplier: 100,
          spRecovery: 1,
          spReturn: 0,
          stagger: 1,
          effects,
        },
      ],
    }),
    createAction('consume_passives', 'battleSkill', {
      startTime: 1,
      hits: [{ offset: 0, multiplier: 100, spRecovery: 1, spReturn: 0, stagger: 1 }],
    }),
  ];
}

function createGearInstance(id: string, gearPieceId: string) {
  return { id, gearPieceId, artificingLevels: [3, 3, 3] };
}

describe('optimizer runtime full data sweep', () => {
  it('resolves, compiles, and simulates every operator combat skill', () => {
    const failures: string[] = [];

    for (const { slug } of getOperatorList()) {
      try {
        const sheet = getOperator(slug);
        if (!sheet) throw new Error('missing operator sheet');
        const flatSkills = patchCombatSkills(sheet, {
          talentStates: maxTalentStates(slug),
          potential: 6,
        });
        const actions: Action[] = [];
        let startTime = 0;

        for (const [skillKey, skill] of Object.entries(flatSkills)) {
          const level = 8;
          for (let segmentIndex = 0; segmentIndex < (skill.segments || []).length; segmentIndex++) {
            const segment = skill.segments![segmentIndex]!;
            const rawEntries = extractRawEntries({ segments: [segment] }, level);
            const hits = resolveHitsFromSheet([], rawEntries, level, {
              preserveCondition: true,
              preserveDurationExtension: true,
            });
            actions.push(
              createAction(`${slug}_${skillKey}_${segmentIndex}`, skill.type as Action['type'], {
                skillId: skill.skillKey || skillKey,
                element: skill.element || sheet.element,
                duration: Math.max(0.1, Number(segment.duration) || 1),
                hits,
                startTime,
              }),
            );
            startTime += Math.max(1.5, Number(segment.duration) || 1) + 0.5;
          }
        }

        expect(actions.length, `${slug} has no resolved actions`).toBeGreaterThan(0);
        const result = runScenario([createTrack(slug, actions)]);
        expect(result.simLog.length, `${slug} produced no sim log`).toBeGreaterThan(0);
      } catch (error) {
        failures.push(`${slug}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    expect(failures).toEqual([]);
  });

  it('collects and simulates every operator, weapon, and gear trigger registry entry', () => {
    const failures: string[] = [];
    const operatorSlugs = getOperatorList().map(entry => entry.slug);
    const weaponSlugs = getWeaponList().map(entry => entry.slug);
    const gearSetSlugs = [
      ...new Set(
        getGearPieceList()
          .map(piece => piece.setSlug)
          .filter((slug): slug is string => Boolean(slug)),
      ),
    ];

    const runTriggerCase = (
      _label: string,
      operatorSlug: string,
      weaponSlug: string | null,
      gearPieceSlugs: string[] = [],
    ) => {
      const operatorInstances = [createOperatorInstance(operatorSlug, 'op_alpha')];
      const weaponInstances: WeaponInstance[] = weaponSlug
        ? ([
            {
              id: 'weapon_alpha',
              weaponSlug,
              level: 60,
              tuned: true,
              potential: 6,
              skill1Level: 9,
              skill2Level: 9,
              skill3Level: 9,
            },
          ] as unknown as WeaponInstance[])
        : [];
      const gearInstances = gearPieceSlugs.map((slug, index) =>
        createGearInstance(`gear_${index}`, slug),
      );
      const gear = {
        armor: gearInstances[0]?.id ?? null,
        gloves: gearInstances[1]?.id ?? null,
        kit1: gearInstances[2]?.id ?? null,
        kit2: gearInstances[3]?.id ?? null,
      };
      const team = createTeam('op_alpha', weaponInstances[0]?.id ?? null, gear);
      const tracks = [createTrack('alpha', triggerExerciseActions())];
      const entries = mapTriggerEntriesToTracks(
        collectTriggerEffects(team, operatorInstances, weaponInstances, gearInstances, new Map()),
        tracks,
      );

      runScenario(tracks, entries, collectConsumedStackKeys(tracks, entries));
      return entries.length;
    };

    for (const slug of operatorSlugs) {
      try {
        runTriggerCase(`operator:${slug}`, slug, null);
      } catch (error) {
        failures.push(
          `operator:${slug}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    for (const slug of weaponSlugs) {
      try {
        runTriggerCase(`weapon:${slug}`, 'estella', slug);
      } catch (error) {
        failures.push(`weapon:${slug}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    for (const setSlug of gearSetSlugs) {
      try {
        const set = getGearSet(setSlug);
        const pieceSlugs = getGearPieceList()
          .filter(piece => piece.setSlug === setSlug)
          .map(piece => piece.slug)
          .slice(0, 4);
        const entryCount = runTriggerCase(`gearSet:${setSlug}`, 'estella', null, pieceSlugs);
        if ((set?.triggers || []).length > 0) {
          expect(entryCount, `${setSlug} trigger count`).toBeGreaterThan(0);
        }
      } catch (error) {
        failures.push(
          `gearSet:${setSlug}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    expect(failures).toEqual([]);
  });

  it('collects and dispatches passive effects from every operator, weapon, gear piece, and gear set', () => {
    const failures: string[] = [];

    const runPassiveCase = (
      _label: string,
      operatorSlug: string,
      weaponSlug: string | null,
      gearPieceSlugs: string[] = [],
    ) => {
      const operatorInstances = [createOperatorInstance(operatorSlug, 'op_alpha')];
      const weaponInstances: WeaponInstance[] = weaponSlug
        ? ([
            {
              id: 'weapon_alpha',
              weaponSlug,
              level: 60,
              tuned: true,
              potential: 6,
              skill1Level: 9,
              skill2Level: 9,
              skill3Level: 9,
            },
          ] as unknown as WeaponInstance[])
        : [];
      const gearInstances = gearPieceSlugs.map((slug, index) =>
        createGearInstance(`gear_${index}`, slug),
      );
      const gear = {
        armor: gearInstances[0]?.id ?? null,
        gloves: gearInstances[1]?.id ?? null,
        kit1: gearInstances[2]?.id ?? null,
        kit2: gearInstances[3]?.id ?? null,
      };
      const team = createTeam('op_alpha', weaponInstances[0]?.id ?? null, gear);
      const collected = collectEffects(team, operatorInstances, weaponInstances, gearInstances);
      const effects = collected.map(entry => entry.effect).filter(Boolean);
      if (effects.length === 0) return 0;

      const tracks = [createTrack('alpha', passiveDispatchActions(effects))];
      runScenario(tracks, [], collectConsumedStackKeys(tracks, []));
      return effects.length;
    };

    for (const { slug } of getOperatorList()) {
      try {
        runPassiveCase(`operator:${slug}`, slug, null);
      } catch (error) {
        failures.push(
          `operator:${slug}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    for (const { slug } of getWeaponList()) {
      try {
        runPassiveCase(`weapon:${slug}`, 'estella', slug);
      } catch (error) {
        failures.push(`weapon:${slug}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    for (const { slug } of getGearPieceList()) {
      try {
        runPassiveCase(`gearPiece:${slug}`, 'estella', null, [slug]);
      } catch (error) {
        failures.push(
          `gearPiece:${slug}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    for (const setSlug of [
      ...new Set(
        getGearPieceList()
          .map(piece => piece.setSlug)
          .filter((slug): slug is string => Boolean(slug)),
      ),
    ]) {
      try {
        const pieceSlugs = getGearPieceList()
          .filter(piece => piece.setSlug === setSlug)
          .map(piece => piece.slug)
          .slice(0, 4);
        runPassiveCase(`gearSet:${setSlug}`, 'estella', null, pieceSlugs);
      } catch (error) {
        failures.push(
          `gearSet:${setSlug}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    expect(failures).toEqual([]);
  });
});
