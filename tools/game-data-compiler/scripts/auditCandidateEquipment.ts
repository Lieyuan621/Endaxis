import fs from 'node:fs/promises';
import { OPERATOR_DEFINITION_OUTPUTS } from './operatorDefinitionOutputs.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createCandidateRuntimeServer } from '../src/compiler/publication/candidateRuntimeServer.ts';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../..');
const REPLACEMENT_PATHS = [
  ...OPERATOR_DEFINITION_OUTPUTS,
  'src/data/buffs/generated',
  'src/data/equipment/generated-weapons',
  'src/data/equipment/generated',
  'src/data/equipment/generated-gear-sets',
  'src/data/combat/gameplayTagCatalog.generated.ts',
  'src/data/combat/gameplayTagPredefine.generated.ts',
  'src/data/combat/hitStopCurveCatalog.generated.ts',
  'src/data/combat/timeDilationCatalog.generated.ts',
  'src/data/combat/skillSettings.generated.ts',
] as const;

interface AuditArguments {
  readonly candidateRoot: string;
  readonly endFrame: number;
}

interface RuntimeOperator {
  readonly slug: string;
  readonly weaponType: string;
  readonly talents: readonly unknown[];
  readonly skillGroups: readonly { readonly key: string }[];
}

interface RuntimeWeapon {
  readonly slug: string;
  readonly weaponType: string;
  readonly traits: readonly { readonly levelCount: number }[];
}

interface RuntimeGear {
  readonly slug: string;
  readonly slotType: 'armor' | 'gloves' | 'accessory';
  readonly gearSetSlug?: string;
  readonly traits: readonly { readonly levelCount: number }[];
}

type RuntimeGearSet = Pick<
  import('../../../packages/game-data-contract/src/equipment.ts').GearSetDefinition,
  'slug' | 'enableSequence' | 'initializationSequence' | 'buffDefinitions' | 'actionGraph'
>;

function installationSteps(gearSet: RuntimeGearSet) {
  return [
    ...(gearSet.enableSequence === undefined
      ? []
      : readActionGraphChain(gearSet.actionGraph!.main, gearSet.enableSequence)),
    ...(gearSet.initializationSequence === undefined
      ? []
      : readActionGraphChain(gearSet.actionGraph!.main, gearSet.initializationSequence)),
  ];
}

type RuntimeScenario = Record<string, any>;

/** 在候选覆盖视图中逐项真实装配武器、单件装备和套装。 */
export async function auditCandidateEquipment(args: AuditArguments) {
  const candidateRoot = await fs.realpath(path.resolve(args.candidateRoot));
  const operatorFiles = OPERATOR_DEFINITION_OUTPUTS.map(file => path.join(candidateRoot, file));
  if (operatorFiles.length === 0) throw new Error('candidate contains no generated operators');

  const server = await createCandidateRuntimeServer({
    projectRoot: PROJECT_ROOT,
    candidateRoot,
    replacementPaths: REPLACEMENT_PATHS,
  });
  try {
    const operators: RuntimeOperator[] = [];
    for (const file of operatorFiles.sort()) {
      const module = await server.ssrLoadModule(toViteFsId(file));
      // 具名与default导出可以指向同一个干员；不同对象仍必须拒绝。
      const definitions = [...new Set(Object.values(module).filter(isOperatorDefinition))];
      if (definitions.length !== 1) {
        throw new Error(
          `${path.relative(candidateRoot, file)} exports ${definitions.length} operator definitions`,
        );
      }
      operators.push(definitions[0]);
    }

    const weaponModule = await server.ssrLoadModule(
      '/src/data/equipment/generated-weapons/index.generated.ts',
    );
    const weapons = weaponModule.generatedWeaponDefinitions as RuntimeWeapon[];
    if (!Array.isArray(weapons) || weapons.length === 0) {
      throw new Error('candidate contains no generated weapons');
    }
    if (new Set(weapons.map(weapon => weapon.slug)).size !== weapons.length) {
      throw new Error('candidate weapon identity is not unique');
    }
    const gearModule = await server.ssrLoadModule(
      '/src/data/equipment/generated/index.generated.ts',
    );
    const gears = gearModule.generatedGearDefinitions as RuntimeGear[];
    const gearSetModule = await server.ssrLoadModule(
      '/src/data/equipment/generated-gear-sets/index.generated.ts',
    );
    const gearSets = gearSetModule.generatedGearSetDefinitions as RuntimeGearSet[];
    assertUniqueDefinitions(gears, 'gear');
    assertUniqueDefinitions(gearSets, 'gear set');

    const repositoryModule = await server.ssrLoadModule('/src/data/gameDataRepository.ts');
    const formalRepository = repositoryModule.gameDataRepository;
    const commonBuffModule = await server.ssrLoadModule(
      toViteFsId(
        path.join(candidateRoot, 'src/data/buffs/generated/commonBuffDefinitions.generated.ts'),
      ),
    );
    const runtimeSkillSettings = await server.ssrLoadModule('/src/data/combat/skillSettings.ts');
    const attachmentModule = await server.ssrLoadModule('/src/data/buffs/elementalAttachments.ts');
    const projectModule = await server.ssrLoadModule('/src/core/project/createProject.ts');
    const placementModule = await server.ssrLoadModule(
      '/src/ui/timeline/interaction/placeSkillGroup.ts',
    );
    const serviceModule = await server.ssrLoadModule(
      '/src/application/simulation/scenarioSimulationService.ts',
    );
    const repository = repositoryModule.createGameDataRepository({
      revision: 'candidate-weapon-simulation-audit',
      commonDefinitionSources: [
        { id: 'common-buffs', buffDefinitions: commonBuffModule.commonBuffDefinitions },
      ],
      operators,
      weapons,
      gears,
      gearSets,
      enemies: formalRepository.getEnemies(),
    });
    const nativeResources = runtimeSkillSettings.skillSettingResources;
    const serviceResources = {
      sharedSpGain: { baseGainEfficiency: nativeResources.atbGainEfficiency },
      spRecoveryPauseDuration: nativeResources.atbRecoverInterval,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: {
        selfGainPerSp: nativeResources.atbConsumedDefaultUspGainSelf,
        otherGainPerSp: nativeResources.atbConsumedDefaultUspGainOther,
      },
    };
    const spellInflictionSettings = runtimeSkillSettings.skillSettings;
    const createService = (index: any, revision: string) =>
      new serviceModule.ScenarioSimulationService({
        index,
        repositoryRevision: revision,
        resources: serviceResources,
        elementalInflictionDocument: attachmentModule.elementalAttachments,
        spellInflictionSettings,
      });
    const service = createService(repository, 'candidate-equipment-simulation-audit');

    const failures: { identity: string; message: string; stack?: string }[] = [];
    for (const weapon of weapons) {
      const operator = operators.find(
        candidate =>
          candidate.weaponType === weapon.weaponType &&
          candidate.skillGroups.some(group => group.key === 'basicAttack'),
      );
      if (operator === undefined) {
        failures.push({
          identity: weapon.slug,
          message: `no compatible '${weapon.weaponType}' operator with a basic attack`,
        });
        continue;
      }
      try {
        const scenario = createScenario(
          projectModule.createEmptyScenario(
            `audit:candidate-weapon:${weapon.slug}`,
            '候选武器装配门禁',
          ),
          operator,
          weapon,
          args.endFrame,
        );
        let nextId = 0;
        const placed = placementModule.placeSkillGroup({
          scenario,
          trackIndex: 0,
          operator,
          skillGroupKey: 'basicAttack',
          startFrame: 1,
          ids: { allocate: (kind: string) => `${kind}:${weapon.slug}:${nextId++}` },
        }).scenario;
        await service.simulate(placed, args.endFrame);
      } catch (error) {
        failures.push({
          identity: weapon.slug,
          message: error instanceof Error ? error.message : String(error),
          ...(error instanceof Error && error.stack !== undefined ? { stack: error.stack } : {}),
        });
      }
    }
    const basicAttackOperator = operators.find(operator =>
      operator.skillGroups.some(group => group.key === 'basicAttack'),
    );
    if (basicAttackOperator === undefined) throw new Error('no operator with a basic attack');
    for (const gear of gears) {
      for (const tier of ['minimum', 'maximum'] as const) {
        await auditGearCase({
          identity: `${gear.slug}:${tier}`,
          operator: basicAttackOperator,
          gear,
          tier,
          gearSlot: gear.slotType === 'accessory' ? 'accessory1' : gear.slotType,
          endFrame: args.endFrame,
          projectModule,
          placementModule,
          service,
          failures,
        });
      }
      if (gear.slotType === 'accessory') {
        await auditGearCase({
          identity: `${gear.slug}:accessory2`,
          operator: basicAttackOperator,
          gear,
          tier: 'maximum',
          gearSlot: 'accessory2',
          endFrame: args.endFrame,
          projectModule,
          placementModule,
          service,
          failures,
        });
      }
    }
    const accessories = gears.filter(gear => gear.slotType === 'accessory');
    for (const [index, gear] of accessories.entries()) {
      const partner = accessories[(index + 1) % accessories.length];
      if (partner === undefined || partner.slug === gear.slug) {
        failures.push({ identity: `${gear.slug}:pair`, message: 'no distinct accessory partner' });
        continue;
      }
      await auditGearCase({
        identity: `${gear.slug}:pair:${partner.slug}`,
        operator: basicAttackOperator,
        gear,
        tier: 'maximum',
        gearSlot: 'accessory1',
        secondaryGear: partner,
        endFrame: args.endFrame,
        projectModule,
        placementModule,
        service,
        failures,
      });
    }
    const fourSkillOperator = operators.find(operator =>
      ['basicAttack', 'battleSkill', 'comboSkill', 'ultimate'].every(key =>
        operator.skillGroups.some(group => group.key === key),
      ),
    );
    if (fourSkillOperator === undefined) throw new Error('no operator with all four skill types');
    for (const gearSet of gearSets) {
      await auditGearSetCase({
        gearSet,
        gears,
        accessories,
        operator: fourSkillOperator,
        projectModule,
        placementModule,
        service,
        createService,
        createRepositoryWithoutGearSet: (gearSetSlug: string) =>
          repositoryModule.createGameDataRepository({
            revision: `candidate-equipment-without:${gearSetSlug}`,
            commonDefinitionSources: [
              { id: 'common-buffs', buffDefinitions: commonBuffModule.commonBuffDefinitions },
            ],
            operators,
            weapons,
            gears: gears.map(gear =>
              gear.gearSetSlug === gearSetSlug
                ? (({ gearSetSlug: _gearSetSlug, ...setless }) => setless)(gear)
                : gear,
            ),
            gearSets,
            enemies: formalRepository.getEnemies(),
          }),
        createRepositoryWithoutGearSetRuntime: (gearSetSlug: string) =>
          repositoryModule.createGameDataRepository({
            revision: `candidate-equipment-static-only:${gearSetSlug}`,
            commonDefinitionSources: [
              { id: 'common-buffs', buffDefinitions: commonBuffModule.commonBuffDefinitions },
            ],
            operators,
            weapons,
            gears,
            gearSets: gearSets.map(gearSet => {
              if (gearSet.slug !== gearSetSlug) return gearSet;
              const {
                buffDefinitions: _buffDefinitions,
                initializationSequence: _initializationSequence,
                enableSequence: _enableSequence,
                ...staticOnly
              } = gearSet;
              return staticOnly;
            }),
            enemies: formalRepository.getEnemies(),
          }),
        failures,
      });
    }
    if (failures.length > 0) {
      throw new Error(
        `candidate equipment simulation failed for ${failures.length} case(s):\n${failures
          .slice(0, 30)
          .map(
            failure =>
              `${failure.identity}: ${failure.message}${
                failure.stack === undefined ? '' : `\n${failure.stack}`
              }`,
          )
          .join('\n')}`,
      );
    }
    return {
      operatorCount: operators.length,
      weaponCount: weapons.length,
      compatibleWeaponTypeCount: new Set(weapons.map(weapon => weapon.weaponType)).size,
      gearCount: gears.length,
      gearTierCaseCount: gears.length * 2,
      accessorySecondSlotCaseCount: accessories.length,
      accessoryPairCaseCount: accessories.length,
      gearSetCount: gearSets.length,
      runtimeGearSetCount: gearSets.filter(gearSet => installationSteps(gearSet).length > 0).length,
      endFrame: args.endFrame,
    };
  } finally {
    await server.close();
  }
}

async function auditGearCase(input: {
  readonly identity: string;
  readonly operator: RuntimeOperator;
  readonly gear: RuntimeGear;
  readonly tier: 'minimum' | 'maximum';
  readonly gearSlot: 'armor' | 'gloves' | 'accessory1' | 'accessory2';
  readonly secondaryGear?: RuntimeGear;
  readonly endFrame: number;
  readonly projectModule: any;
  readonly placementModule: any;
  readonly service: any;
  readonly failures: { identity: string; message: string; stack?: string }[];
}) {
  try {
    const scenario = input.projectModule.createEmptyScenario(
      `audit:candidate-gear:${input.identity}`,
      '候选单件装备门禁',
    );
    configureBattle(scenario, input.endFrame);
    const gears = { armor: null, gloves: null, accessory1: null, accessory2: null } as Record<
      string,
      unknown
    >;
    gears[input.gearSlot] = gearInstance(input.gear, input.tier);
    if (input.secondaryGear !== undefined) {
      gears.accessory2 = gearInstance(input.secondaryGear, 'maximum');
    }
    scenario.tracks[0] = createTrack(input.operator, null, gears, input.identity);
    let nextId = 0;
    const placed = input.placementModule.placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: input.operator,
      skillGroupKey: 'basicAttack',
      startFrame: 1,
      ids: { allocate: (kind: string) => `${kind}:${input.identity}:${nextId++}` },
    }).scenario;
    await input.service.simulate(placed, input.endFrame);
  } catch (error) {
    input.failures.push(errorDetail(input.identity, error));
  }
}

async function auditGearSetCase(input: {
  readonly gearSet: RuntimeGearSet;
  readonly gears: readonly RuntimeGear[];
  readonly accessories: readonly RuntimeGear[];
  readonly operator: RuntimeOperator;
  readonly projectModule: any;
  readonly placementModule: any;
  readonly service: any;
  readonly createService: (index: any, revision: string) => any;
  readonly createRepositoryWithoutGearSet: (slug: string) => any;
  readonly createRepositoryWithoutGearSetRuntime: (slug: string) => any;
  readonly failures: { identity: string; message: string; stack?: string }[];
}) {
  const identity = `gear-set:${input.gearSet.slug}`;
  try {
    const pieces = input.gears.filter(gear => gear.gearSetSlug === input.gearSet.slug);
    const armor = pieces.find(gear => gear.slotType === 'armor');
    const gloves = pieces.find(gear => gear.slotType === 'gloves');
    const accessory = pieces.find(gear => gear.slotType === 'accessory');
    if (armor === undefined || gloves === undefined || accessory === undefined) {
      throw new Error('does not contain armor, gloves, and accessory');
    }
    const secondAccessory =
      pieces.find(gear => gear.slotType === 'accessory' && gear.slug !== accessory.slug) ??
      input.accessories.find(gear => gear.gearSetSlug !== input.gearSet.slug);
    if (secondAccessory === undefined) throw new Error('has no legal second accessory partner');
    let scenario = input.projectModule.createEmptyScenario(
      `audit:candidate-${identity}`,
      '候选套装门禁',
    );
    configureBattle(scenario, 1200);
    scenario.tracks[0] = createTrack(
      input.operator,
      null,
      {
        armor: gearInstance(armor, 'maximum'),
        gloves: gearInstance(gloves, 'maximum'),
        accessory1: gearInstance(accessory, 'maximum'),
        accessory2: gearInstance(secondAccessory, 'maximum'),
      },
      identity,
    );
    let nextId = 0;
    for (const [index, skillGroupKey] of [
      'basicAttack',
      'battleSkill',
      'comboSkill',
      'ultimate',
    ].entries()) {
      scenario = input.placementModule.placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: input.operator,
        skillGroupKey,
        startFrame: 1 + index * 300,
        ids: { allocate: (kind: string) => `${kind}:${identity}:${nextId++}` },
      }).scenario;
    }
    const active = await input.service.simulate(scenario, 1200);
    const withoutSet = await input
      .createService(
        input.createRepositoryWithoutGearSet(input.gearSet.slug),
        `${identity}:without-set`,
      )
      .simulate(scenario, 1200);
    if (
      sameObservableResult(observableEquipmentResult(active), observableEquipmentResult(withoutSet))
    ) {
      throw new Error('three-piece build has no observable difference from the setless baseline');
    }
    if (installationSteps(input.gearSet).length > 0) {
      const staticOnly = await input
        .createService(
          input.createRepositoryWithoutGearSetRuntime(input.gearSet.slug),
          `${identity}:static-only`,
        )
        .simulate(scenario, 1200);
      if (
        sameObservableResult(
          observableGearSetRuntimeResult(active, input.gearSet),
          observableGearSetRuntimeResult(staticOnly, input.gearSet),
        )
      ) {
        throw new Error('runtime root has no downstream observable difference from static-only');
      }
    }
  } catch (error) {
    input.failures.push(errorDetail(identity, error));
  }
}

function observableEquipmentResult(result: any) {
  return {
    operatorPanel: result.operatorPanels[0],
    finalEnemyHealth: result.finalEnemyHealth,
    receipts: result.receiptEntries.filter((entry: any) => isObservableEquipmentEvent(entry.event)),
  };
}

function observableGearSetRuntimeResult(result: any, gearSet: RuntimeGearSet) {
  const rootBuffIds = new Set(
    installationSteps(gearSet).flatMap(step =>
      step.kind === 'applyBuff' && typeof step.parameters?.buffId === 'string'
        ? [step.parameters.buffId]
        : [],
    ),
  );
  return {
    operatorPanel: result.operatorPanels[0],
    finalEnemyHealth: result.finalEnemyHealth,
    receipts: result.receiptEntries.filter((entry: any) => {
      if (
        (entry.event === 'BuffApplied' || entry.event === 'BuffFinished') &&
        typeof entry.data?.buffId === 'string' &&
        rootBuffIds.has(entry.data.buffId)
      ) {
        return false;
      }
      return isObservableEquipmentEvent(entry.event);
    }),
  };
}

function isObservableEquipmentEvent(event: string): boolean {
  return [
    'BuffApplied',
    'BuffFinished',
    'DamageApplied',
    'HealingApplied',
    'PoiseApplied',
    'SpChanged',
    'UltimateEnergyChanged',
  ].includes(event);
}

function sameObservableResult(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function configureBattle(scenario: RuntimeScenario, endFrame: number): void {
  scenario.battle.durationFrames = endFrame;
  scenario.enemy.editable.hp = 1_000_000_000;
  scenario.battle.resourceRules = {
    maxSp: 1000,
    initialSp: 1000,
    spRecoveryPerSecond: 100,
    defaultSkillSpCost: 100,
  };
}

function createTrack(
  operator: RuntimeOperator,
  weapon: RuntimeWeapon | null,
  gears: Record<string, unknown>,
  identity: string,
) {
  return {
    id: `track:candidate-equipment:${identity}`,
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
      weapon === null
        ? null
        : {
            weaponSlug: weapon.slug,
            level: 90,
            tuned: true,
            potential: 0,
            traitLevels: weapon.traits.map(trait => trait.levelCount),
          },
    gears,
    initialState: { ultimateEnergy: 1000, maxUltimateEnergyOverride: 1000 },
    skillCasts: [],
  };
}

function gearInstance(gear: RuntimeGear, tier: 'minimum' | 'maximum') {
  return {
    gearSlug: gear.slug,
    artificingLevels: gear.traits.map(trait => (tier === 'minimum' ? 0 : trait.levelCount - 1)),
  };
}

function errorDetail(identity: string, error: unknown) {
  return {
    identity,
    message: error instanceof Error ? error.message : String(error),
    ...(error instanceof Error && error.stack !== undefined ? { stack: error.stack } : {}),
  };
}

function assertUniqueDefinitions(
  definitions: readonly { readonly slug: string }[],
  label: string,
): void {
  if (!Array.isArray(definitions) || definitions.length === 0) {
    throw new Error(`candidate contains no generated ${label}s`);
  }
  if (new Set(definitions.map(definition => definition.slug)).size !== definitions.length) {
    throw new Error(`candidate ${label} identity is not unique`);
  }
}

function createScenario(
  scenario: RuntimeScenario,
  operator: RuntimeOperator,
  weapon: RuntimeWeapon,
  endFrame: number,
): RuntimeScenario {
  configureBattle(scenario, endFrame);
  scenario.tracks[0] = createTrack(
    operator,
    weapon,
    { armor: null, gloves: null, accessory1: null, accessory2: null },
    weapon.slug,
  );
  return scenario;
}

function isOperatorDefinition(value: unknown): value is RuntimeOperator {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { slug?: unknown }).slug === 'string' &&
    typeof (value as { weaponType?: unknown }).weaponType === 'string' &&
    Array.isArray((value as { skillGroups?: unknown }).skillGroups)
  );
}

function toViteFsId(file: string): string {
  return `/@fs/${file.replaceAll('\\', '/')}`;
}

function parseArguments(argv: readonly string[]): AuditArguments {
  let candidateRoot = '';
  let endFrame = 300;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    const value = argv[index + 1];
    if (argument === '--candidate-root' && value !== undefined) {
      candidateRoot = value;
      index += 1;
    } else if (argument === '--end-frame' && value !== undefined) {
      endFrame = Number(value);
      index += 1;
    } else {
      throw new Error(`unknown or incomplete argument: ${argument}`);
    }
  }
  if (candidateRoot.length === 0) throw new Error('--candidate-root is required');
  if (!Number.isInteger(endFrame) || endFrame < 1) {
    throw new Error('--end-frame must be a positive integer');
  }
  return { candidateRoot, endFrame };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await auditCandidateEquipment(parseArguments(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
}
import { readActionGraphChain } from '../src/compiler/actions/actionGraphBuilder.ts';
