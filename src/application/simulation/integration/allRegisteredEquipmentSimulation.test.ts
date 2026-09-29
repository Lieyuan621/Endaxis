import { describe, expect, it } from 'vitest';

import type { GearDefinition } from '../../../core/game-data/equipmentDefinition';
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

const gears = gameDataRepository.getGears();
const accessoryGears = gears.filter(gear => gear.slotType === 'accessory');
const gearSets = gameDataRepository.getGearSets();
const runtimeGearSets = gearSets.filter(
  gearSet =>
    gearSet.initializationSequence?.$sequence != null || gearSet.enableSequence?.$sequence != null,
);
const resources = {
  sharedSpGain: { baseGainEfficiency: 1 },
  spRecoveryPauseDuration: 1.5,
  ultimateEnergySystemUnlocked: true,
  normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
} as const;

describe('正式饰品槽位与套装运行行为', () => {
  it('各类装备测试来源非空且身份唯一', () => {
    for (const definitions of [gears, gearSets, runtimeGearSets]) {
      expect(definitions.length).toBeGreaterThan(0);
    }
    expect(new Set(gears.map(definition => definition.slug)).size).toBe(gears.length);
  });

  it('同一饰品放入任一槽位产生相同属性和伤害', async () => {
    const operator = requireBasicAttackOperator();
    const gear = gameDataRepository.getGear('item_equip_t4_suit_burst01_edc_02')!;
    expect(gear.slotType).toBe('accessory');
    const first = await simulate(operator, { gear, gearSlot: 'accessory1' });
    const second = await simulate(operator, { gear, gearSlot: 'accessory2' });
    expect(second.operatorPanels[0]).toEqual({
      ...first.operatorPanels[0],
      operatorId: second.operatorPanels[0]!.operatorId,
    });
    expect(second.finalEnemyHealth).toEqual(first.finalEnemyHealth);
  });

  it.each(gearSets)('$slug 三件套可被真实构筑激活并经历四类技能事件', async gearSet => {
    const operator = requireFourSkillOperator();
    const scenario = createScenarioWithGearSet(operator, gearSet.slug);
    const [compiled] = compileScenarioEquipment(
      scenario,
      gameDataRepository,
      gameDataRepository.actionPrograms,
    );
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
    readonly gear: GearDefinition;
    readonly gearSlot?: keyof TrackDocument['gears'];
  },
) {
  const identity = `${operator.slug}:${equipment.gear.slug}:${equipment.gearSlot ?? 'default'}`;
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
      artificingLevels: equipment.gear.traits.map(trait => trait.levelCount - 1),
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
    weapon: null,
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
    resources,
    elementalInflictionDocument: elementalAttachments,
    spellInflictionSettings: skillSettings,
  });
  return service.simulate(placed, 300);
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
    commonDefinitionSources: gameDataRepository.getCommonDefinitionSources?.(),
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
    commonDefinitionSources: gameDataRepository.getCommonDefinitionSources?.(),
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
    [gearSet.initializationSequence, gearSet.enableSequence].flatMap(reference => {
      if (reference === undefined || reference.$sequence === null) return [];
      const nodes = gearSet.actionGraph?.main.nodes ?? {};
      const stack = [reference.$sequence];
      const buffIds: string[] = [];
      const seen = new Set<string>();
      while (stack.length > 0) {
        const name = stack.pop()!;
        if (seen.has(name)) continue;
        seen.add(name);
        const node = nodes[name];
        if (node === undefined) continue;
        if (node.action.kind !== 'applyBuff') continue;
        const { buffId } = node.action.parameters;
        if (typeof buffId === 'string') buffIds.push(buffId);
        if (node.next !== null) stack.push(node.next);
        const action = node.action as { body?: { $sequence: string | null } };
        if (typeof action.body?.$sequence === 'string') stack.push(action.body.$sequence);
      }
      return buffIds;
    }),
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
