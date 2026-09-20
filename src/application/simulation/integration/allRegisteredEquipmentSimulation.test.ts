import { describe, expect, it } from 'vitest';

import type { GearDefinition, WeaponDefinition } from '../../../core/game-data/equipmentDefinition';
import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
import { compileScenarioEquipment } from '../../../core/compiler/compileScenarioEquipment';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { TrackDocument } from '../../../core/project/schema';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import { skillSettings } from '../../../data/combat/skillSettings';
import { createGameDataRepository, gameDataRepository } from '../../../data/gameDataRepository';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { ScenarioSimulationService } from '../scenarioSimulationService';
import { staticEquipmentContribution } from '../testSupport/staticEquipmentContribution';

const weapons = gameDataRepository.getWeapons();
const gears = gameDataRepository.getGears();
const gearTierCases = gears.flatMap(gear =>
  (['minimum', 'maximum'] as const).map(tier => ({ gear, tier })),
);
const relativeAttributeGears = gears.filter(usesRelativeOperatorAttribute);
const attributePairOperators = [
  ...new Map(
    gameDataRepository
      .getOperators()
      .filter(hasBasicAttack)
      .map(operator => [`${operator.mainAttribute}:${operator.secondaryAttribute}`, operator]),
  ).values(),
];
const relativeAttributeGearCases = relativeAttributeGears.flatMap(gear =>
  attributePairOperators.map(operator => ({ gear, operator })),
);
const accessoryGears = gears.filter(gear => gear.slotType === 'accessory');
const accessoryPairs = accessoryGears.map((gear, index) => ({
  gear,
  partner: accessoryGears[(index + 1) % accessoryGears.length]!,
}));
const gearSets = gameDataRepository.getGearSets();
const runtimeGearSets = gearSets.filter(
  gearSet =>
    (gearSet.initializationSequence?.steps.length ?? 0) +
      (gearSet.enableSequence?.steps.length ?? 0) >
    0,
);
const resources = {
  sharedSpGain: { baseGainEfficiency: 1 },
  spRecoveryPauseDuration: 1.5,
  ultimateEnergySystemUnlocked: true,
  normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
} as const;

describe('所有正式武器与单件装备逐项装配和模拟', () => {
  it('锁定当前仓库的横向覆盖边界', () => {
    expect(weapons).toHaveLength(79);
    expect(gears).toHaveLength(258);
    expect(gearSets).toHaveLength(24);
    expect(runtimeGearSets).toHaveLength(19);
    expect(relativeAttributeGears).toHaveLength(23);
    expect(new Set(weapons.map(definition => definition.slug)).size).toBe(weapons.length);
    expect(new Set(gears.map(definition => definition.slug)).size).toBe(gears.length);
  });

  it.each(weapons)('$slug 可由兼容干员装配并跑完整模拟', async weapon => {
    const operator = requireCompatibleOperator(weapon);
    await expect(simulate(operator, { weapon })).resolves.toBeDefined();
  });

  it.each(gearTierCases)('$gear.slug 在 $tier 精炼档可装入对应槽位并跑完整模拟', async entry => {
    const operator = requireBasicAttackOperator();
    await expect(simulate(operator, entry)).resolves.toBeDefined();
  });

  it.each(relativeAttributeGearCases)(
    '$gear.slug 可按 $operator.slug 的主副属性解析并跑完整模拟',
    async ({ gear, operator }) => {
      await expect(simulate(operator, { gear })).resolves.toBeDefined();
    },
  );

  it.each(accessoryGears)('$slug 可装入第二饰品槽并跑完整模拟', async gear => {
    const operator = requireBasicAttackOperator();
    await expect(simulate(operator, { gear, gearSlot: 'accessory2' })).resolves.toBeDefined();
  });

  it.each(accessoryPairs)(
    '$gear.slug 与 $partner.slug 同时装配并跑完整模拟',
    async ({ gear, partner }) => {
      if (partner.slug === gear.slug) {
        throw new Error(`accessory '${gear.slug}' has no distinct pairing partner`);
      }
      const operator = requireBasicAttackOperator();
      await expect(simulate(operator, { gear, secondaryGear: partner })).resolves.toBeDefined();
    },
  );

  it.each(gearSets)('$slug 三件套可被真实构筑激活并经历四类技能事件', async gearSet => {
    const operator = requireFourSkillOperator();
    const scenario = createScenarioWithGearSet(operator, gearSet.slug);
    const [compiled] = compileScenarioEquipment(scenario, gameDataRepository);
    expect(
      compiled?.contributions.flatMap(contribution =>
        contribution.source.kind === 'gearSet' ? [contribution.source.slug] : [],
      ),
    ).toEqual([gearSet.slug]);

    const active = await simulateScenario(operator, scenario, gameDataRepository);
    const baseline = await simulateScenario(
      operator,
      scenario,
      createRepositoryWithoutGearSet(gearSet.slug),
    );
    expect(observableEquipmentResult(active)).not.toEqual(observableEquipmentResult(baseline));
  });

  it.each(runtimeGearSets)(
    '$slug 的运行时根在标准四技能场景产生独立于静态修正的可观察结果',
    async gearSet => {
      const operator = requireFourSkillOperator();
      const scenario = createScenarioWithGearSet(operator, gearSet.slug);
      const active = await simulateScenario(operator, scenario, gameDataRepository);
      const staticOnly = await simulateScenario(
        operator,
        scenario,
        createRepositoryWithoutGearSetRuntime(gearSet.slug),
      );
      const activeObservable = observableGearSetRuntimeResult(active, gearSet);
      const staticObservable = observableGearSetRuntimeResult(staticOnly, gearSet);
      expect(activeObservable).not.toEqual(staticObservable);
    },
  );
});

function simulate(
  operator: OperatorDefinition,
  equipment: {
    readonly weapon?: WeaponDefinition;
    readonly gear?: GearDefinition;
    readonly tier?: 'minimum' | 'maximum';
    readonly gearSlot?: keyof TrackDocument['gears'];
    readonly secondaryGear?: GearDefinition;
  },
) {
  const identity = `${operator.slug}:${equipment.weapon?.slug ?? equipment.gear?.slug ?? 'bare'}:${equipment.tier ?? 'maximum'}:${equipment.gearSlot ?? 'default'}:${equipment.secondaryGear?.slug ?? 'single'}`;
  const scenario = createEmptyScenario(`audit:equipment:${identity}`, '全配装运行门禁');
  scenario.battle.durationFrames = 300;
  scenario.enemy.editable.hp = 1_000_000_000;
  scenario.battle.resourceRules = {
    maxSp: 1000,
    initialSp: 1000,
    spRecoveryPerSecond: 100,
    defaultSkillSpCost: 100,
  };
  const gears: TrackDocument['gears'] = {
    armor: null,
    gloves: null,
    accessory1: null,
    accessory2: null,
  };
  if (equipment.gear !== undefined) {
    const slot =
      equipment.gearSlot ??
      (equipment.gear.slotType === 'accessory' ? 'accessory1' : equipment.gear.slotType);
    if (
      (equipment.gear.slotType === 'accessory' && slot !== 'accessory1' && slot !== 'accessory2') ||
      (equipment.gear.slotType !== 'accessory' && slot !== equipment.gear.slotType)
    ) {
      throw new Error(`gear '${equipment.gear.slug}' cannot be placed in '${slot}'`);
    }
    gears[slot] = {
      gearSlug: equipment.gear.slug,
      artificingLevels: equipment.gear.traits.map(trait =>
        equipment.tier === 'minimum' ? 0 : trait.levelCount - 1,
      ),
    };
  }
  if (equipment.secondaryGear !== undefined) {
    if (equipment.secondaryGear.slotType !== 'accessory') {
      throw new Error(`secondary gear '${equipment.secondaryGear.slug}' must be an accessory`);
    }
    if (gears.accessory2 !== null) {
      throw new Error('secondary gear conflicts with an explicitly occupied accessory2 slot');
    }
    gears.accessory2 = {
      gearSlug: equipment.secondaryGear.slug,
      artificingLevels: equipment.secondaryGear.traits.map(trait => trait.levelCount - 1),
    };
  }
  scenario.tracks[0] = {
    id: `track:audit:${identity}`,
    operator: {
      operatorSlug: operator.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: Object.fromEntries(operator.skillGroups.map(group => [group.key, 12])),
      talentStates: Object.fromEntries(operator.talents.map((_, index) => [index, 0])),
    },
    weapon:
      equipment.weapon === undefined
        ? null
        : {
            weaponSlug: equipment.weapon.slug,
            level: 90,
            tuned: true,
            potential: 0,
            traitLevels: equipment.weapon.traits.map(trait => trait.levelCount),
          },
    gears,
    initialState: { ultimateEnergy: 1000, maxUltimateEnergyOverride: 1000 },
    skillCasts: [],
  };
  let nextCastId = 0;
  const placed = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator,
    skillGroupKey: 'basicAttack',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:equipment-audit:${identity}:${++nextCastId}` },
  }).scenario;
  const service = new ScenarioSimulationService({
    index: gameDataRepository,
    repositoryRevision: `${gameDataRepository.revision}:all-equipment-audit`,
    resources,
    elementalInflictionDocument: elementalAttachments,
    spellInflictionSettings: skillSettings,
  });
  return service.simulate(placed, 300);
}

function requireCompatibleOperator(weapon: WeaponDefinition): OperatorDefinition {
  const operator = gameDataRepository
    .getOperators()
    .find(candidate => candidate.weaponType === weapon.weaponType && hasBasicAttack(candidate));
  if (operator === undefined) {
    throw new Error(`weapon '${weapon.slug}' has no compatible operator with a basic attack`);
  }
  return operator;
}

function requireBasicAttackOperator(): OperatorDefinition {
  const operator = gameDataRepository.getOperators().find(hasBasicAttack);
  if (operator === undefined) throw new Error('repository has no operator with a basic attack');
  return operator;
}

function requireFourSkillOperator(): OperatorDefinition {
  const operator = gameDataRepository
    .getOperators()
    .find(candidate =>
      ['basicAttack', 'battleSkill', 'comboSkill', 'ultimate'].every(key =>
        candidate.skillGroups.some(group => group.key === key),
      ),
    );
  if (operator === undefined)
    throw new Error('repository has no operator with all four skill types');
  return operator;
}

function createScenarioWithGearSet(
  operator: OperatorDefinition,
  gearSetSlug: string,
): ReturnType<typeof createEmptyScenario> {
  const pieces = gears.filter(definition => definition.gearSetSlug === gearSetSlug);
  const armor = pieces.find(definition => definition.slotType === 'armor');
  const gloves = pieces.find(definition => definition.slotType === 'gloves');
  const accessories = pieces.filter(definition => definition.slotType === 'accessory');
  const accessory = accessories[0];
  if (armor === undefined || gloves === undefined || accessory === undefined) {
    throw new Error(`gear set '${gearSetSlug}' does not have one piece for every required slot`);
  }
  const secondAccessory =
    accessories.find(definition => definition.slug !== accessory.slug) ??
    accessoryGears.find(definition => definition.gearSetSlug !== gearSetSlug);
  if (secondAccessory === undefined) {
    throw new Error(`gear set '${gearSetSlug}' has no legal second accessory partner`);
  }
  const scenario = createEmptyScenario(`audit:gear-set:${gearSetSlug}`, '全套装运行门禁');
  scenario.battle.durationFrames = 1_200;
  scenario.enemy.editable.hp = 1_000_000_000;
  scenario.battle.resourceRules = {
    maxSp: 1000,
    initialSp: 1000,
    spRecoveryPerSecond: 100,
    defaultSkillSpCost: 100,
  };
  const instance = (definition: GearDefinition) => ({
    gearSlug: definition.slug,
    artificingLevels: definition.traits.map(trait => trait.levelCount - 1),
  });
  scenario.tracks[0] = {
    id: `track:audit:gear-set:${gearSetSlug}`,
    operator: {
      operatorSlug: operator.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: Object.fromEntries(operator.skillGroups.map(group => [group.key, 12])),
      talentStates: Object.fromEntries(operator.talents.map((_, index) => [index, 0])),
    },
    weapon: null,
    gears: {
      armor: instance(armor),
      gloves: instance(gloves),
      accessory1: instance(accessory),
      accessory2: instance(secondAccessory),
    },
    initialState: { ultimateEnergy: 1000, maxUltimateEnergyOverride: 1000 },
    skillCasts: [],
  };
  return scenario;
}

async function simulateScenario(
  operator: OperatorDefinition,
  scenario: ReturnType<typeof createEmptyScenario>,
  index: typeof gameDataRepository,
) {
  let placed = scenario;
  let nextId = 0;
  for (const [index, skillGroupKey] of [
    'basicAttack',
    'battleSkill',
    'comboSkill',
    'ultimate',
  ].entries()) {
    placed = placeSkillGroup({
      scenario: placed,
      trackIndex: 0,
      operator,
      skillGroupKey,
      startFrame: 1 + index * 300,
      ids: { allocate: kind => `${kind}:gear-set-audit:${++nextId}` },
    }).scenario;
  }
  const service = new ScenarioSimulationService({
    index,
    repositoryRevision: `${index.revision}:all-gear-set-audit`,
    resources,
    elementalInflictionDocument: elementalAttachments,
    spellInflictionSettings: skillSettings,
  });
  return service.simulate(placed, 1_200);
}

function createRepositoryWithoutGearSet(gearSetSlug: string) {
  return createGameDataRepository({
    revision: `${gameDataRepository.revision}:without:${gearSetSlug}`,
    operators: gameDataRepository.getOperators(),
    weapons: gameDataRepository.getWeapons(),
    gears: gameDataRepository
      .getGears()
      .map(definition =>
        definition.gearSetSlug === gearSetSlug
          ? (({ gearSetSlug: _gearSetSlug, ...setless }) => setless)(definition)
          : definition,
      ),
    gearSets: gameDataRepository.getGearSets(),
    commonBuffDefinitions: gameDataRepository.getCommonBuffDefinitions?.(),
    commonAbilityEntityDefinitions: gameDataRepository.getCommonAbilityEntityDefinitions?.(),
  });
}

function createRepositoryWithoutGearSetRuntime(gearSetSlug: string) {
  return createGameDataRepository({
    revision: `${gameDataRepository.revision}:static-only:${gearSetSlug}`,
    operators: gameDataRepository.getOperators(),
    weapons: gameDataRepository.getWeapons(),
    gears: gameDataRepository.getGears(),
    gearSets: gameDataRepository.getGearSets().map(definition => {
      if (definition.slug !== gearSetSlug) return definition;
      return staticEquipmentContribution(definition);
    }),
    commonBuffDefinitions: gameDataRepository.getCommonBuffDefinitions?.(),
    commonAbilityEntityDefinitions: gameDataRepository.getCommonAbilityEntityDefinitions?.(),
  });
}

function observableEquipmentResult(
  result: Awaited<ReturnType<ScenarioSimulationService['simulate']>>,
) {
  return {
    operatorPanel: result.operatorPanels[0],
    finalEnemyHealth: result.finalEnemyHealth,
    receipts: result.receiptEntries.filter(entry =>
      [
        'BuffApplied',
        'BuffFinished',
        'DamageApplied',
        'HealingApplied',
        'PoiseApplied',
        'SpChanged',
        'UltimateEnergyChanged',
      ].includes(entry.event),
    ),
  };
}

function observableGearSetRuntimeResult(
  result: Awaited<ReturnType<ScenarioSimulationService['simulate']>>,
  gearSet: (typeof gearSets)[number],
) {
  const rootBuffIds = new Set(
    [
      ...(gearSet.initializationSequence?.steps ?? []),
      ...(gearSet.enableSequence?.steps ?? []),
    ].flatMap(step => (step.kind === 'applyBuff' ? [step.parameters.buffId] : [])),
  );
  return {
    operatorPanel: result.operatorPanels[0],
    finalEnemyHealth: result.finalEnemyHealth,
    receipts: result.receiptEntries.filter(entry => {
      if (
        (entry.event === 'BuffApplied' || entry.event === 'BuffFinished') &&
        typeof entry.data?.buffId === 'string' &&
        rootBuffIds.has(entry.data.buffId)
      ) {
        return false;
      }
      return [
        'BuffApplied',
        'BuffFinished',
        'DamageApplied',
        'HealingApplied',
        'PoiseApplied',
        'SpChanged',
        'UltimateEnergyChanged',
      ].includes(entry.event);
    }),
  };
}

function hasBasicAttack(operator: OperatorDefinition): boolean {
  return operator.skillGroups.some(group => group.key === 'basicAttack');
}

function usesRelativeOperatorAttribute(gear: GearDefinition): boolean {
  return gear.traits.some(trait =>
    (trait.modifiers ?? []).some(
      modifier =>
        modifier.kind === 'attribute' &&
        (modifier.attribute === 'main' || modifier.attribute === 'secondary'),
    ),
  );
}
