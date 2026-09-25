import { expect, it, vi } from 'vitest';
import { logicalAbilityEntityRuntimeId } from '../../../game-data/logicalAbilityEntity';
import { AbilityEntityChildSkillPrograms } from '../../abilities/abilityEntityChildSkillPrograms';
import { LogicalAbilityEntityRuntime } from '../../abilities/logicalAbilityEntityRuntime';
import { ProjectileCallbackPrograms } from '../../abilities/projectileCallbackPrograms';
import { ProjectileLifecycleRuntime } from '../../abilities/projectileLifecycleRuntime';
import { CombatOperationPrograms } from '../../actions/combatOperationPrograms';
import { CombatSemanticEventRuntime } from '../../events/combatSemanticEventRuntime';
import { SimulationRandomSource } from '../../random/simulationRandom';
import { CombatVitals } from '../../resources/combatVitals';
import { CombatSkillPrograms } from '../../skills/combatSkillPrograms';
import { TimedMarkerContainer } from '../../status/timedMarkers';
import { createAbilitySystemState, createOperatorCenterState } from '../../state/abilityState';
import type { CombatStateGraph } from '../../state/combatState';
import {
  createSimulationRandomState,
  createTimedMarkerState,
  type SimulationRandomState,
} from '../../state/environmentState';
import {
  createBuffContainerState,
  createGlobalBuffState,
  createProjectileLifecycleState,
} from '../../state/instanceState';
import { CombatRuntimeAssembly, type AbilityEntityBuffRuntime } from '../combatRuntimeAssembly';
import { CombatSharedRuntime } from '../combatSharedRuntime';
import { StandardPlayerDamageEnvironment } from '../standardPlayerDamageEnvironment';
import { restoreCombatRuntime } from './combatRuntimeRestoration';

const resources = {
  sp: 0,
  maxSp: 300,
  returnedSp: 0,
  sharedSpGain: { baseGainEfficiency: 1 },
  spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
  ultimateEnergySystemUnlocked: false,
  normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
  squad: [
    {
      operatorId: 'operator',
      ultimateEnergy: 0,
      maxUltimateEnergy: 100,
      ultimateEnergyGainMultiplier: 1,
      allowedUltimateEnergyRecoveryTags: null,
    },
  ],
};

const environmentInput = {
  criticalSamples: { nextCriticalSample: () => 1 },
  resolveNonRandomRuntimeSnapshot: () => ({
    runtimeExtensionMultiplier: 1,
    appliesIgniteDamageMultiplier: false,
    appliesPhysicalInflictionDamageMultiplier: false,
  }),
};

const enemy = {
  source: { kind: 'custom' as const, level: 90 },
  rank: 'mob' as const,
  health: 1000,
  superArmor: 100,
  defenderAttributes: {
    defense: 0,
    shelterDamageMultiplier: 0,
    breakingAttackDamageTakenMultiplier: 1,
    resistances: Object.fromEntries(
      ['physical', 'heat', 'electric', 'cryo', 'nature', 'ether'].map(element => [
        element,
        { percent: 0, damageTakenMultiplier: 1 },
      ]),
    ) as Record<
      'physical' | 'heat' | 'electric' | 'cryo' | 'nature' | 'ether',
      { percent: number; damageTakenMultiplier: number }
    >,
  },
  stagger: {
    maximum: 100,
    knotThresholds: [0.5],
    knotBreakDurationFrames: 30,
    brokenDurationFrames: 300,
    finisherSpRecovery: 100,
  },
};

it('整场恢复基础阶段直接绑定共享账本、环境和全部基础 Buff 外壳', () => {
  const originalShared = new CombatSharedRuntime({ resources, operatorOrder: ['operator'] });
  const originalEnvironment = new StandardPlayerDamageEnvironment({
    ...environmentInput,
    enemyVitals: new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      maxPoise: 100,
      poise: 100,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    }),
  });
  const originalOperatorBuffs =
    originalEnvironment.runtimeOptions.createOperatorBuffRuntime!('operator');
  const saved = structuredClone({
    shared: originalShared.runtimeState,
    environment: originalEnvironment.runtimeState,
    enemyBuffs: originalEnvironment.runtimeOptions.enemyBuffRuntime.runtimeState!,
    operatorBuffs: originalOperatorBuffs.runtimeState!,
    semanticEvents: new CombatSemanticEventRuntime().runtimeState,
  });
  const graph: CombatStateGraph = {
    shared: saved.shared,
    inputs: {
      initialInputPending: false,
      castParameters: new Map(),
      control: new Map([['operator', false]]),
      skills: {
        nextInputIndex: 0,
        previousFixedInput: null,
        continuation: { nextIndex: 1, previous: null, stopped: false },
        groups: [],
      },
      dodges: {
        nextInputIndex: 0,
        previousInput: null,
        executedDashIds: new Set(),
        declaredSuccessIds: new Set(),
      },
      externalEvents: { nextEventIndex: 0, previousEvent: null },
    },
    environment: saved.environment,
    events: { native: new Map(), semantic: saved.semanticEvents },
    operators: new Map([
      [
        'operator',
        {
          blackboard: saved.operatorBuffs.entityBlackboard,
          ability: createAbilitySystemState(),
          center: createOperatorCenterState(),
          skills: new Map(),
          passives: new Map(),
          equipment: null,
          initializations: new Map(),
          upgradeEvents: null,
          comboConditions: new Map(),
          cooldowns: new Map(),
          statuses: null,
          timedMarkers: createTimedMarkerState(),
          buffs: saved.operatorBuffs,
        },
      ],
    ]),
    enemy: {
      statuses: null,
      timedMarkers: createTimedMarkerState(),
      buffs: saved.enemyBuffs,
    },
    instances: {
      abilityEntities: { instances: new Map(), deadSources: [] },
      projectiles: createProjectileLifecycleState(),
      globalBuffs: createGlobalBuffState(),
    },
  };
  const originalEntities = new LogicalAbilityEntityRuntime({});
  const entityTarget = originalEntities.spawn({
    abilityEntityId: 'summon',
    definition: { lifetime: { kind: 'limited', durationSeconds: 10 } },
    ownerId: 'operator',
    source: { kind: 'operator', operatorId: 'operator' },
  });
  if (entityTarget.kind !== 'abilityEntity') throw new Error('fixture entity was not created');
  const entityState = originalEntities.runtimeState.instances.get(entityTarget.instanceId)!;
  entityState.buffContainerCreated = true;
  entityState.buffs = createBuffContainerState(undefined, entityState.blackboard);
  graph.instances.abilityEntities.instances.set(entityTarget.instanceId, entityState);
  for (const [ownerId, state] of [
    ['enemy', graph.enemy.timedMarkers],
    ['operator', graph.operators.get('operator')!.timedMarkers],
  ] as const) {
    const markers = new TimedMarkerContainer(ownerId, originalShared.clock, {}, state);
    markers.add('scaled-marker', 3, originalShared.clock, 'globalScaled');
    markers.add('global-marker', 3, originalShared.clock, 'global');
  }
  const assemblyGraph = structuredClone(graph);
  const program = {
    operatorId: 'operator',
    skills: [],
    abilityEntityDefinitions: {
      summon: { lifetime: { kind: 'limited' as const, durationSeconds: 10 } },
    },
  };
  const callbackPrograms = new ProjectileCallbackPrograms();
  let suppliedProjectiles: ProjectileLifecycleRuntime | undefined;
  let coreRegistered = false;
  let sourcesRegistered = false;
  const candidate = restoreCombatRuntime({
    graph,
    programs: [program],
    fixedSkillPrograms: new CombatSkillPrograms(),
    foundation: {
      shared: { resources },
      environment: environmentInput,
      enemy,
      resolveProjectileRuntimeDependencies: () => {
        throw new Error('fixture does not launch projectiles');
      },
    },
    objects: context => {
      suppliedProjectiles = new ProjectileLifecycleRuntime(
        () => context.foundation.shared.abilityEntityInstanceIds.allocate(),
        { state: graph.instances.projectiles, callbackPrograms },
      );
      return {
        callbackPrograms,
        projectiles: suppliedProjectiles,
        buffs: {
          resolveDefinition: () => undefined,
          resolveGlobalDefinition: () => undefined,
        },
        operators: {
          createCoreBindings: () => ({
            createSkillDependencies: () => {
              throw new Error('fixture has no skills');
            },
            abilityRuntime: {},
          }),
          onCoreBound: () => {
            coreRegistered = true;
          },
          createSourceBindings: () => {
            expect(coreRegistered).toBe(true);
            return {
              createEquipmentExecutor: () => ({ execute: () => true, evaluate: () => true }),
              createInitializationOperations: () => ({ execute: () => true, evaluate: () => true }),
              createPassiveOperations: () => ({ execute: () => true, evaluate: () => true }),
              registerPassive: () => {
                throw new Error('fixture has no passive responses');
              },
              createUpgradeExecutor: () => ({ execute: () => true, evaluate: () => true }),
            };
          },
          onSourcesBound: () => {
            sourcesRegistered = true;
          },
        },
        abilityEntityRelations: {
          childSkillPrograms: new AbilityEntityChildSkillPrograms(),
          createPassiveOperations: () => {
            throw new Error('fixture has no AbilityEntity passives');
          },
          registerPassive: () => {
            throw new Error('fixture has no AbilityEntity passive responses');
          },
          createChildSkillBindings: () => {
            throw new Error('fixture has no AbilityEntity child skills');
          },
        },
        createProjectileCallbackBindings: () => {
          throw new Error('fixture has no projectile callbacks');
        },
      };
    },
  });
  const { foundation: restored, entities, objects, frame } = candidate;
  expect(candidate.enemyTimedMarkers.runtimeState).toBe(graph.enemy.timedMarkers);
  expect(candidate.enemyTimedMarkers.has('scaled-marker')).toBe(true);
  expect(candidate.enemyTimedMarkers.has('global-marker')).toBe(true);
  expect(objects.operators.cores.get('operator')!.timedMarkers.has('scaled-marker')).toBe(true);

  expect(restored.shared.runtimeState).toBe(saved.shared);
  expect(restored.shared.clock.runtimeState).toBe(saved.shared.clock);
  expect(restored.environment.runtimeState).toBe(saved.environment);
  expect(restored.semanticEvents.runtimeState).toBe(saved.semanticEvents);
  expect(restored.environment.runtimeOptions.enemyBuffRuntime.runtimeState).toBe(saved.enemyBuffs);
  expect(restored.enemyBuffTarget).toBe(restored.environment.runtimeOptions.enemyBuffRuntime);
  expect(restored.operatorBuffTargets.get('operator')!.runtimeState).toBe(saved.operatorBuffs);
  expect(restored.operatorBuffTargets.get('operator')!.entityBlackboard!.runtimeState).toBe(
    graph.operators.get('operator')!.blackboard,
  );
  expect(entities.runtime.runtimeState).toBe(graph.instances.abilityEntities);
  expect([...entities.targets.keys()]).toEqual([
    'enemy',
    'operator',
    logicalAbilityEntityRuntimeId(entityTarget.instanceId),
  ]);
  const entityBuffs = entities.targets.get(
    logicalAbilityEntityRuntimeId(entityTarget.instanceId),
  ) as AbilityEntityBuffRuntime;
  const advanceEntityBuffs = vi.spyOn(entityBuffs, 'advanceWithDeltas');
  const releaseEntityBuffs = vi.spyOn(entityBuffs, 'releaseAll');
  expect(objects.buffs.globalBuffs.runtimeState).toBe(graph.instances.globalBuffs);
  expect(objects.projectiles.runtimeState).toBe(graph.instances.projectiles);
  expect(objects.projectiles).toBe(suppliedProjectiles);
  expect(objects.operators.cores.get('operator')!.blackboard.runtimeState).toBe(
    graph.operators.get('operator')!.blackboard,
  );
  expect(objects.operators.programs.get('operator')!.buffRuntime).toBe(
    restored.operatorBuffTargets.get('operator'),
  );
  expect(sourcesRegistered).toBe(true);
  const previousFrame = restored.shared.clock.frame;
  frame.advanceFrame();
  expect(restored.shared.clock.frame).toBe(previousFrame + 1);
  expect(advanceEntityBuffs).toHaveBeenCalledOnce();
  entities.runtime.finish(entityTarget);
  expect(releaseEntityBuffs).toHaveBeenCalledOnce();
  expect(entities.targets.has(logicalAbilityEntityRuntimeId(entityTarget.instanceId))).toBe(false);
  objects.operators.disposeSources();
  objects.abilityEntityRelations.disposePassives();

  const restoredAssembly = CombatRuntimeAssembly.restore({
    receiptHistory: originalShared.receipt.history.snapshot(),
    graph: assemblyGraph,
    resources,
    enemy,
    operators: [program],
    environment: environmentInput,
    abilityEntityChildSkillPrograms: new AbilityEntityChildSkillPrograms(),
    combatOperationPrograms: new CombatOperationPrograms(),
    combatSkillPrograms: new CombatSkillPrograms(),
    projectileCallbackPrograms: new ProjectileCallbackPrograms(),
  });
  expect(restoredAssembly.stateGraph).toBe(assemblyGraph);
  expect(restoredAssembly.sharedState).toBe(assemblyGraph.shared);
  expect(restoredAssembly.abilityEntities.runtimeState).toBe(
    assemblyGraph.instances.abilityEntities,
  );
  expect(restoredAssembly.projectileLifetimes.runtimeState).toBe(
    assemblyGraph.instances.projectiles,
  );
  expect(restoredAssembly.globalBuffs.runtimeState).toBe(assemblyGraph.instances.globalBuffs);
  const restoredFrame = restoredAssembly.clock.frame;
  restoredAssembly.advanceFrame();
  expect(restoredAssembly.clock.frame).toBe(restoredFrame + 1);

  const randomGraph = structuredClone(assemblyGraph);
  const randomState = createSimulationRandomState();
  const randomSettings = { mode: 'sampled' as const, globalSeed: 42 };
  const randomSource = new SimulationRandomSource(randomSettings, () => randomState);
  randomSource.nextCriticalSample();
  (randomGraph.environment as { random: SimulationRandomState | null }).random = randomState;
  const restoreRandomGraph = (globalSeed: number) =>
    CombatRuntimeAssembly.restore({
      receiptHistory: originalShared.receipt.history.snapshot(),
      graph: structuredClone(randomGraph),
      resources,
      enemy,
      operators: [program],
      environment: {
        simulationRandomSettings: { mode: 'sampled', globalSeed },
        resolveNonRandomRuntimeSnapshot: environmentInput.resolveNonRandomRuntimeSnapshot,
      },
      abilityEntityChildSkillPrograms: new AbilityEntityChildSkillPrograms(),
      combatOperationPrograms: new CombatOperationPrograms(),
      combatSkillPrograms: new CombatSkillPrograms(),
      projectileCallbackPrograms: new ProjectileCallbackPrograms(),
    });
  expect(() => restoreRandomGraph(43)).toThrow('random configuration does not match');
  expect(restoreRandomGraph(42).stateGraph.environment!.random).toEqual(randomState);
});

it('正式装配从活动技能切面恢复后继续得到相同逐帧结果', () => {
  const abilityEntityDefinition = {
    lifetime: { kind: 'limited' as const, durationSeconds: 10 },
    childSkill: {
      skillId: 'entity-child',
      nativeSkillType: 'normalSkill' as const,
      naturalDurationFrames: 30,
      castResource: {
        costFrame: 0,
        cooldownSeconds: 0,
        maxChargeTime: 1,
        cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
      },
      initialBlackboard: {},
      timelineActions: [
        {
          startFrame: 2,
          sequence: {
            steps: [
              {
                kind: 'changeResource' as const,
                parameters: { resource: 'sp' as const, amount: 3, recipient: 'team' as const },
              },
            ],
          },
        },
      ],
    },
  };
  const program = {
    operatorId: 'operator',
    skillGroupKey: 'battleSkill',
    skillId: 'skill',
    skillType: 'battleSkill' as const,
    skillLevel: 1,
    initialBlackboard: {},
    timelineBlockFrames: 3,
    naturalDurationFrames: 3,
    costFrame: 0,
    costs: [],
    abilityEntityDefinitions: { restored_entity: abilityEntityDefinition },
    timelineActions: [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'applyBuff' as const,
              parameters: {
                buffId: 'persistent',
                target: 'caster' as const,
                inheritSourceSkillCastInfo: true,
              },
            },
            {
              kind: 'launchProjectile' as const,
              parameters: { finish: 0.05, recycleDelaySeconds: 0.05 },
              callbacks: [
                {
                  event: 'finish' as const,
                  skill: {
                    skillId: 'callback',
                    nativeSkillType: 'normalSkill' as const,
                    naturalDurationFrames: 2,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
                    },
                    initialBlackboard: {},
                    timelineActions: [
                      {
                        startFrame: 0,
                        sequence: {
                          steps: [
                            {
                              kind: 'dealFixedDamage' as const,
                              key: 'callback-hit',
                              parameters: {
                                damageType: 'physical' as const,
                                value: 25,
                                tags: [],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
            {
              kind: 'spawnAbilityEntity' as const,
              parameters: {
                abilityEntityId: 'restored_entity',
                definition: abilityEntityDefinition,
                dieWhenSourceDies: false,
              },
            },
          ],
        },
      },
    ],
  };
  const buffDefinitions = {
    persistent: { stackingType: 'unique' as const },
    passivePersistent: {
      stackingType: 'unique' as const,
      lifecycleSequences: {
        enable: {
          steps: [
            {
              kind: 'modifyActionValue' as const,
              parameters: {
                key: 'restoredValue',
                operation: 'assign' as const,
                value: { kind: 'constant' as const, value: 9 },
              },
            },
          ],
        },
      },
    },
    potentialPersistent: { stackingType: 'unique' as const },
  };
  const passivePrograms = [
    {
      key: 'passive',
      initialBlackboard: { restoredValue: 7 },
      enableSequence: {
        steps: [
          {
            kind: 'applyBuff' as const,
            parameters: { buffId: 'passivePersistent', target: 'caster' as const },
          },
        ],
      },
    },
  ];
  const comboProgram = {
    operatorId: 'operator',
    skillGroupKey: 'combo',
    skillId: 'combo',
    skillType: 'comboSkill' as const,
    skillLevel: 1,
    initialBlackboard: {},
    cooldownFrames: 300,
    costFrame: 0,
    costs: [],
    timelineBlockFrames: 1,
    naturalDurationFrames: 1,
    timelineActions: [{ startFrame: 1, sequence: { steps: [] } }],
  };
  const comboConditionPrograms = [
    {
      key: 'damage-condition',
      skillGroupKey: 'combo',
      skillKey: 'combo',
      event: 'beforeOutputDamage' as const,
      immediately: false,
      initialValues: { hits: 0 },
      sequence: {
        steps: [
          {
            kind: 'modifyActionValue' as const,
            parameters: {
              key: 'hits',
              operation: 'add' as const,
              value: { kind: 'constant' as const, value: 1 },
            },
          },
        ],
      },
    },
  ];
  const panel = {
    operatorId: 'operator',
    level: 1,
    attributes: { strength: 0, agility: 0, intellect: 0, will: 0 },
    attack: 1,
    attackBeforeAttributeScalar: 1,
    mainAttribute: 'intellect' as const,
    secondaryAttribute: 'will' as const,
    health: 1000,
    defense: 0,
    criticalRate: 0,
    criticalDamage: 0,
    artsIntensity: 0,
    ultimateEnergyGainEfficiency: 1,
    skillCooldownReduction: 0,
    staggerDamagePercent: 0,
    combatModifiers: [],
    receipt: [],
  };
  const environment = new StandardPlayerDamageEnvironment({
    ...environmentInput,
    enemyVitals: new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      maxPoise: 100,
      poise: 100,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    }),
  });
  const skillPrograms = new CombatSkillPrograms();
  const operationPrograms = new CombatOperationPrograms();
  const childSkillPrograms = new AbilityEntityChildSkillPrograms();
  const equipmentContributions = [
    {
      source: { kind: 'weaponTrait' as const, slug: 'fixture-weapon', traitKey: 'damage-count' },
      selectedLevel: 1,
      modifiers: [],
      blackboard: { hits: 0 },
      eventHandlers: [
        {
          key: 'count-damage',
          abilityEvent: 'beforeOutputDamage' as const,
          sequence: {
            steps: [
              {
                kind: 'modifyActionValue' as const,
                parameters: {
                  key: 'hits',
                  operation: 'add' as const,
                  value: { kind: 'constant' as const, value: 1 },
                },
              },
            ],
          },
        },
      ],
    },
  ];
  const initializationPrograms = [
    {
      key: 'equipment-fixture',
      equipmentContributionIndex: 0,
      sequence: { steps: [] },
    },
  ];
  const upgradeEventPrograms = [
    {
      key: 'potential:skill-hit-buff:0',
      event: {
        kind: 'skillHit' as const,
        skillGroupKey: 'battleSkill',
        scope: 'operator' as const,
      },
      initialBlackboard: {},
      sequence: {
        steps: [
          {
            kind: 'applyBuff' as const,
            parameters: { buffId: 'potentialPersistent', target: 'caster' as const },
          },
        ],
      },
    },
  ];
  const operatorProgram = {
    operatorId: 'operator',
    skills: [program, comboProgram],
    skillSlotGroups: [{ skillGroupKey: 'combo', baseSkillKey: 'combo', replacementSkillKeys: [] }],
    comboConditionPrograms,
    abilityEntityDefinitions: { restored_entity: abilityEntityDefinition },
    buffDefinitions,
    panel,
    passivePrograms,
    equipmentContributions,
    initializationPrograms,
    upgradeEventPrograms,
  };
  const original = new CombatRuntimeAssembly({
    ...environment.runtimeOptions,
    resources,
    enemy,
    operators: [operatorProgram],
    abilityEntityChildSkillPrograms: childSkillPrograms,
    combatOperationPrograms: operationPrograms,
    combatSkillPrograms: skillPrograms,
    timeDilation: { config: {} },
  });
  original.timeDilation!.startGlobal({
    durationSeconds: 10,
    slot: 'Test/TimeSlot1',
    priority: 1,
    constantScale: 0.5,
  });
  expect(original.tryStartSkill('operator', 'skill')).toBe(true);
  original.advanceFrame();
  expect(original.stateGraph.operators.get('operator')!.buffs!.instances.size).toBe(2);
  expect(original.stateGraph.instances.projectiles.instances.size).toBe(1);
  expect(original.stateGraph.instances.projectiles.instances.get(1)!.callbacks[0]!.host).toBeNull();
  expect(
    original.stateGraph.operators
      .get('operator')!
      .comboConditions.get('damage-condition')!
      .blackboard.values.get('hits'),
  ).toBe(0);
  expect(
    original.stateGraph.operators
      .get('operator')!
      .equipment!.contributions.get(0)!
      .blackboard.values.get('hits'),
  ).toBe(0);
  expect(
    original.stateGraph.operators.get('operator')!.upgradeEvents!.programs[0]!.subscriptions,
  ).not.toHaveLength(0);
  const saved = structuredClone(original.stateGraph);
  const restoreBranch = (
    graph: CombatStateGraph,
    projectileCallbackPrograms = original.projectileLifetimes.callbackPrograms,
  ) =>
    CombatRuntimeAssembly.restore({
      receiptHistory: original.receipt.history.snapshot(),
      graph,
      resources,
      enemy,
      operators: [operatorProgram],
      environment: environmentInput,
      abilityEntityChildSkillPrograms: childSkillPrograms,
      combatOperationPrograms: operationPrograms,
      combatSkillPrograms: skillPrograms,
      projectileCallbackPrograms,
      timeDilation: { config: {}, programs: original.timeDilation!.programs },
    });
  const originalBeforeRejectedCandidate = structuredClone(original.stateGraph);
  expect(() => restoreBranch(structuredClone(saved), new ProjectileCallbackPrograms())).toThrow(
    'missing projectile callback program',
  );
  expect(original.stateGraph).toEqual(originalBeforeRejectedCandidate);

  const restored = restoreBranch(saved);

  expect(restored.stateGraph).toBe(saved);
  expect(restored.stateGraph).toEqual(original.stateGraph);
  original.advanceFrames(5);
  restored.advanceFrames(5);
  expect(
    restored.stateGraph.instances.projectiles.instances.get(1)!.callbacks[0]!.host,
  ).not.toBeNull();
  expect(
    restored.stateGraph.operators
      .get('operator')!
      .comboConditions.get('damage-condition')!
      .blackboard.values.get('hits'),
  ).toBe(1);
  expect(
    restored.stateGraph.operators
      .get('operator')!
      .equipment!.contributions.get(0)!
      .blackboard.values.get('hits'),
  ).toBe(1);
  expect(restored.stateGraph.operators.get('operator')!.buffs!.instances.size).toBe(3);
  expect(restored.stateGraph).toEqual(original.stateGraph);
  const activeHostSaved = structuredClone(original.stateGraph);
  const activeHostRestored = restoreBranch(activeHostSaved);
  expect(activeHostRestored.stateGraph).toEqual(original.stateGraph);
  original.advanceFrames(12);
  restored.advanceFrames(12);
  activeHostRestored.advanceFrames(12);
  expect(restored.stateGraph).toEqual(original.stateGraph);
  expect(activeHostRestored.stateGraph).toEqual(original.stateGraph);
  expect(restored.stateGraph.instances.projectiles.instances.size).toBe(0);
  expect(restored.projectileLifetimes.findSource(1)).toBeUndefined();
});
