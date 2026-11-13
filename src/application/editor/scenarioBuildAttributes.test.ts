import { resolveContingencyContractBuffPresentation } from '../../ui/timeline/contingencyContractBuffPresentation';
import { expect, it } from 'vitest';
import { resolveScenarioBuildAttributes } from './scenarioBuildAttributes';
import { gameDataRepository } from '../../data/gameDataRepository';
import { createTimelineSampleScenario } from '../../ui/timeline/timelineSampleScenario';
import { firstScenarioEnemy } from '../../core/project/level';
import { CONTINGENCY_CONTRACT_MECHANIC_PREFIX } from '../../data/contingencyContract/contingencyContractAdapter';
import { operatorDefinitions } from '../../data/operators';
import { createScenarioSimulationService } from '../simulation/createScenarioSimulationService';
import { capturePublishedOperatorMetadata } from '../../ui/timeline/results/publishedOperatorMetadata';
import { resolvePublishedBuffSource } from '../../ui/timeline/results/publishedBuffSource';
import { getOperatorTalentName } from '../../ui/gameText';
import { ensureLocaleResources } from '../../i18n';

it.each([false, true])('captures opening combo cooldown multiplier with gear set=%s', withGear => {
  const scenario = createTimelineSampleScenario();
  const track = scenario.tracks[0]!;
  if (withGear) {
    const gear = (suffix: string) => {
      const gearSlug = `item_equip_t4_suit_combo_cd01_${suffix}`;
      return {
        gearSlug,
        artificingLevels: gameDataRepository.getGear(gearSlug)!.traits.map(() => 0),
      };
    };
    track.gears.armor = gear('body_01');
    track.gears.gloves = gear('hand_01');
    track.gears.accessory1 = gear('edc_01');
  }
  const fixed = withGear ? 0.85 : 1;
  const before = resolveScenarioBuildAttributes(scenario, gameDataRepository);
  expect(before.operators.get(track.id)?.comboSkillCooldownMultiplier).toBeCloseTo(fixed);
  scenario.globalConfig.customBuff = {
    stackingType: 'unlimited',
    attributeModifiers: [
      { attribute: 'ComboSkillCooldownScalar', slot: 'finalMultiplier', value: 0.75 },
    ],
  };
  const result = resolveScenarioBuildAttributes(scenario, gameDataRepository);
  expect(result.operators.get(track.id)?.ComboSkillCooldownScalar).toBe(0.75);
  expect(result.operators.get(track.id)?.comboSkillCooldownMultiplier).toBeCloseTo(fixed * 0.75);
  expect(result.operatorModifiers.get(track.id)).toContainEqual(
    expect.objectContaining({
      attribute: 'ComboSkillCooldownScalar',
      slot: 'finalMultiplier',
      value: 0.75,
    }),
  );
});

it('uses normal initialization and leaves frame-zero skill inputs pending', () => {
  const scenario = createTimelineSampleScenario();
  const owner = scenario.tracks[0]!;
  owner.operator!.operatorSlug = 'gilberta';
  owner.operator!.talentStates = { '0': 2 };
  const cast = scenario.tracks[1]!.skillCasts[0]!;
  cast.placement.startFrame = 0;
  cast.presentation = { disabled: false };
  const service = createScenarioSimulationService(gameDataRepository);
  const panel = service.createBuildAttributeRuntime(scenario);
  const normal = service.createInputCombatSession(scenario, 0).runtime;
  expect(panel.stateGraph.operators).toEqual(normal.readState().operators);
  expect(panel.receipt.entries.some(entry => entry.event === 'SkillStarted')).toBe(false);
  expect(panel.clock.frame).toBe(0);
  const original = resolveScenarioBuildAttributes(scenario, gameDataRepository);
  scenario.tracks[1]!.skillCasts = [];
  expect(resolveScenarioBuildAttributes(scenario, gameDataRepository)).toEqual(original);
});

it.each([
  [0, 0, 1],
  [1, 0, 1.04],
  [2, 0, 1.07],
  [2, 3, 1.12],
])(
  'includes Gilberta talent %s potential %s in eligible teammates static charging efficiency',
  (talent, potential, expected) => {
    const scenario = createTimelineSampleScenario();
    const owner = scenario.tracks[0]!;
    owner.operator!.operatorSlug = 'gilberta';
    owner.operator!.talentStates = { '0': talent };
    owner.operator!.potential = potential;
    const caster = scenario.tracks[1]!;
    caster.operator!.operatorSlug = 'perlica';
    caster.initialState.ultimateEnergy = 0;
    caster.skillCasts = [];
    scenario.tracks[2] = {
      ...structuredClone(caster),
      id: 'track:ineligible',
      operator: { ...structuredClone(caster.operator!), operatorSlug: 'arclight' },
    };
    scenario.tracks[3] = {
      ...structuredClone(caster),
      id: 'track:guard',
      operator: { ...structuredClone(caster.operator!), operatorSlug: 'lifeng' },
    };
    const result = resolveScenarioBuildAttributes(scenario, gameDataRepository);
    expect(result.operators.get(owner.id)?.UltimateSpGainScalar).toBeCloseTo(expected);
    expect(result.operators.get(caster.id)?.UltimateSpGainScalar).toBeCloseTo(expected);
    expect(result.operators.get('track:ineligible')?.UltimateSpGainScalar).toBe(1);
    expect(result.operators.get('track:guard')?.UltimateSpGainScalar).toBeCloseTo(expected);
  },
);

it('traces Gilberta teammate charging bonus back to the localized talent', () => {
  ensureLocaleResources('zh-CN', ['operators']);
  const scenario = createTimelineSampleScenario();
  const owner = scenario.tracks[0]!;
  owner.operator!.operatorSlug = 'gilberta';
  owner.operator!.talentStates = { '0': 2 };
  const teammate = scenario.tracks[1]!;
  teammate.operator!.operatorSlug = 'perlica';
  teammate.initialState.ultimateEnergy = 0;
  teammate.skillCasts = [];

  const modifier = resolveScenarioBuildAttributes(scenario, gameDataRepository)
    .operatorModifiers.get(teammate.id)
    ?.find(entry => entry.buffId === 'buff_chr_0013_aglina_talent_0_effectbuff_Add');
  expect(modifier).toMatchObject({
    sourceId: owner.id,
    sourceActionId: 'passive:chr_0013_aglina_talent_0',
    attribute: 'UltimateSpGainScalar',
  });
  const source = resolvePublishedBuffSource(
    modifier!,
    scenario,
    capturePublishedOperatorMetadata(scenario, gameDataRepository),
  );
  expect(source).toEqual({ kind: 'talent', slug: 'gilberta', index: 0 });
  if (source?.kind === 'talent') {
    expect(getOperatorTalentName(source.slug, source.index, 0, 'zh-CN')).toBe('信使的歌声');
  }
});

it.each(operatorDefinitions)(
  'initializes static passive attributes for $slug without skill inputs',
  definition => {
    const scenario = createTimelineSampleScenario();
    const track = scenario.tracks[0]!;
    scenario.tracks = [track, null, null, null];
    track.operator!.operatorSlug = definition.slug;
    track.operator!.talentStates = Object.fromEntries(
      definition.talents.map((talent, index) => [String(index), talent.levels]),
    );
    track.operator!.potential = definition.potentials.reduce(
      (sum, potential) => sum + potential.levels,
      0,
    );
    const attributes = resolveScenarioBuildAttributes(scenario, gameDataRepository).operators.get(
      track.id,
    )!;
    expect(attributes).toBeDefined();
    expect(Object.values(attributes).every(Number.isFinite)).toBe(true);
  },
);

it('includes contract maximum health but ignores skill inputs and enemy death', () => {
  const scenario = createTimelineSampleScenario();
  const enemy = firstScenarioEnemy(scenario);
  const original = resolveScenarioBuildAttributes(scenario, gameDataRepository);
  scenario.mechanics.selections.push({
    id: 'health',
    mechanicId: `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}900101`,
    enabled: true,
    parameters: {},
  });
  const result = resolveScenarioBuildAttributes(scenario, gameDataRepository);
  expect(result.enemies.get(enemy.id)?.MaxHp).toBe(original.enemies.get(enemy.id)!.MaxHp! * 1.5);
  enemy.enemy.lifecycle = { spawnFrame: 100, deathFrame: 110, presenceChanges: [] };
  scenario.battle.enemyAutomaticDeath = true;
  for (const track of scenario.tracks) if (track) track.skillCasts = [];
  expect(resolveScenarioBuildAttributes(scenario, gameDataRepository)).toEqual(result);
});

it.each([110403, 111703])(
  'adds contract %s health bonus before final health multipliers',
  tagId => {
    const scenario = createTimelineSampleScenario();
    const enemyId = firstScenarioEnemy(scenario).id;
    const base = resolveScenarioBuildAttributes(scenario, gameDataRepository).enemies.get(
      enemyId,
    )!.MaxHp!;
    scenario.mechanics.selections = [
      {
        id: 'hardship',
        mechanicId: `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}${tagId}`,
        enabled: true,
        parameters: {},
      },
    ];
    expect(
      resolveScenarioBuildAttributes(scenario, gameDataRepository).enemies.get(enemyId)?.MaxHp,
    ).toBeCloseTo(base * 2.2);
    scenario.mechanics.selections.push({
      id: 'health',
      mechanicId: `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}900101`,
      enabled: true,
      parameters: {},
    });
    expect(
      resolveScenarioBuildAttributes(scenario, gameDataRepository).enemies.get(enemyId)?.MaxHp,
    ).toBeCloseTo(base * 2.2 * 1.5);
  },
);

it('uses native resistance overrides and global operator modifiers', () => {
  const scenario = createTimelineSampleScenario();
  scenario.mechanics.selections = [
    {
      id: 'resistance',
      mechanicId: `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}112901`,
      enabled: true,
      parameters: {},
    },
  ];
  const base = resolveScenarioBuildAttributes(scenario, gameDataRepository);
  expect(base.enemies.get(firstScenarioEnemy(scenario).id)?.PhysicalResistance).toBe(25);
  scenario.globalConfig.customBuff = {
    stackingType: 'unlimited',
    attributeModifiers: [{ attribute: 'Def', slot: 'finalMultiplier', value: 0.5 }],
  };
  const modified = resolveScenarioBuildAttributes(scenario, gameDataRepository);
  for (const [id, values] of base.operators)
    expect(modified.operators.get(id)?.Def).toBe(values.Def! * 0.5);
});

it('applies enemy contracts without a selected operator', () => {
  const scenario = createTimelineSampleScenario();
  scenario.tracks = [null, null, null, null];
  scenario.mechanics.selections = [
    {
      id: 'resistance',
      mechanicId: `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}112901`,
      enabled: true,
      parameters: {},
    },
  ];
  expect(
    resolveScenarioBuildAttributes(scenario, gameDataRepository).enemies.get(
      firstScenarioEnemy(scenario).id,
    )?.PhysicalResistance,
  ).toBe(25);
});

it('retains the selected contract identity and native multiplier for panel details', () => {
  const scenario = createTimelineSampleScenario();
  scenario.mechanics.selections = [
    {
      id: 'shrink',
      mechanicId: `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}102803`,
      enabled: true,
      parameters: {},
    },
  ];
  const result = resolveScenarioBuildAttributes(scenario, gameDataRepository);
  const modifiers = [...result.operatorModifiers.values()].flat();
  expect(modifiers.length).toBeGreaterThan(0);
  for (const modifier of modifiers) {
    expect(modifier.value).toBe(0.6);
    expect(modifier.slot).toBe('finalMultiplier');
    expect(
      resolveContingencyContractBuffPresentation(
        modifier.sourceActionId,
        scenario.mechanics.selections,
      )?.tag.tagId,
    ).toBe(102803);
  }
});
