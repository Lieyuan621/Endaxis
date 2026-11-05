import { resolveContingencyContractBuffPresentation } from '../../ui/timeline/contingencyContractBuffPresentation';
import { expect, it } from 'vitest';
import { resolveScenarioBuildAttributes } from './scenarioBuildAttributes';
import { gameDataRepository } from '../../data/gameDataRepository';
import { createTimelineSampleScenario } from '../../ui/timeline/timelineSampleScenario';
import { firstScenarioEnemy } from '../../core/project/level';
import { CONTINGENCY_CONTRACT_MECHANIC_PREFIX } from '../../data/contingencyContract/contingencyContractAdapter';

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
