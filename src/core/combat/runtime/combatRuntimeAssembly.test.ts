import { describe, expect, it, vi } from 'vitest';
import { GAMEPLAY_TAG_PREDEFINE } from '../../../data/combat/gameplayTagPredefine.generated';
import { gilberta as gilbertaGeneratedOperator } from '../../../data/operators/gilberta.generated';
import { getSkill } from '../../../data/operators/testUtils';

const gilbertaBattleSkill = getSkill(gilbertaGeneratedOperator, 'chr_0013_aglina_normal_skill');
import type {
  CompiledOperatorPassiveProgram,
  CompiledSkillProgram,
  CompiledSkillSlotGroup,
  ResolvedCombatStep,
} from '../../compiler/combatProgram';
import { compileOperatorBuffDefinitions, compileSkill } from '../../compiler/compileSkill';
import {
  logicalAbilityEntityRuntimeId,
  type RuntimeTargetRef,
} from '../../game-data/logicalAbilityEntity';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { BuffDefinitionOperationTarget } from '../buffs/buffDefinitionOperationTarget';
import {
  CompiledCombatBuffDefinitions,
  type CombatBuffDefinitionEntry,
} from '../buffs/combatBuffDefinitions';
import { CombatBuffContainer } from '../buffs/combatBuffs';
import { createNativeEventFixture } from '../events/nativeEventTestFixture';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatVitals } from '../resources/combatVitals';
import { CombatSkillPrograms, combatSkillProgramKey } from '../skills/combatSkillPrograms';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { createActionSequenceState, createTimelineActionState } from '../state/actionState';
import { createBuffInstanceState } from '../state/instanceState';
import { CombatStatusContainer } from '../status/combatStatuses';
import { GameplayTagPredefine } from '../tags/gameplayTagPredefine';
import { GameplayTagRegistry } from '../tags/gameplayTags';
import { CombatRuntimeAssembly, type CombatEnemyProgram } from './combatRuntimeAssembly';
import { prepareCombatRuntimeRestore } from './restoration/combatRuntimeRestorePreparation';
import { CombatObjectOrigins } from '../../projection/combatObjectOrigins';

const emptyEnemyBuffRuntime = {
  ownerId: 'enemy',
  advanceFrame: () => undefined,
  getCountByIds: () => 0,
  finishByIds: () => 0,
  holdByIds: () => ({ release: () => undefined }),
  getCountByTags: () => 0,
  matchesEntityTags: () => false,
  findFirstByIds: () => undefined,
  findFirstByTags: () => undefined,
  finishByTags: () => 0,
};

const rejectingExecutor: CombatOperationExecutor = {
  execute: () => false,
  evaluate: () => false,
};

const testEnemy: CombatEnemyProgram = {
  source: { kind: 'custom', level: 90 },
  rank: 'mob',
  health: 1000,
  superArmor: 0,
  defenderAttributes: {
    defense: 0,
    shelterDamageMultiplier: 0,
    breakingAttackDamageTakenMultiplier: 1,
    resistances: {
      physical: { percent: 0, damageTakenMultiplier: 1 },
      heat: { percent: 0, damageTakenMultiplier: 1 },
      electric: { percent: 0, damageTakenMultiplier: 1 },
      cryo: { percent: 0, damageTakenMultiplier: 1 },
      nature: { percent: 0, damageTakenMultiplier: 1 },
      ether: { percent: 0, damageTakenMultiplier: 1 },
    },
  },
  stagger: {
    maximum: 100,
    knotThresholds: [0.5],
    knotBreakDurationFrames: 30,
    brokenDurationFrames: 300,
    finisherSpRecovery: 100,
  },
};

function asBuffRuntime(container: CombatBuffContainer<string>) {
  return {
    ownerId: container.ownerId,
    entityBlackboard: container.entityBlackboard,
    advanceFrame: () => container.tick(1 / 30),
    getCountByIds: (ids: readonly string[]) => container.getCountByIds(ids),
    findFirstByIds: (ids: readonly string[]) => container.findFirstByIds(ids),
    finishByIds: (ids: readonly string[], reason: 'early' | 'absorbed' | 'other') =>
      container.finishByIds(ids, reason),
    holdByIds: (ids: readonly string[]) => container.holdByIds(ids),
    getCountByTags: (...args: Parameters<typeof container.getCountByTags>) =>
      container.getCountByTags(...args),
    matchesEntityTags: (...args: Parameters<typeof container.matchesEntityTags>) =>
      container.matchesEntityTags(...args),
    findFirstByTags: (...args: Parameters<typeof container.findFirstByTags>) =>
      container.findFirstByTags(...args),
    finishByTags: (...args: Parameters<typeof container.finishByTags>) =>
      container.finishByTags(...args),
  };
}

type TestSkillProgram = CompiledSkillProgram & { readonly castId?: string };

function skill(
  overrides: Partial<CompiledSkillProgram> & { readonly castId?: string } = {},
): TestSkillProgram {
  return {
    operatorId: 'operator',
    skillGroupKey: 'battleSkill',
    skillId: 'skill',
    skillType: 'battleSkill',
    skillLevel: 1,
    initialBlackboard: {},
    timelineBlockFrames: 2,
    costFrame: 1,
    costs: [{ resource: 'sp', value: 100 }],
    timelineActions: [],
    ...overrides,
  };
}

it('被动写入EntityBB由同角色主动技能读取，而非留在被动局部板', () => {
  const program = skill({
    costFrame: undefined,
    costs: [],
    timelineActions: [
      {
        startFrame: 0,
        sequence: {
          steps: [
            {
              kind: 'changeResourceByActionValue',
              parameters: {
                resource: 'ultimateEnergy',
                recipient: 'caster',
                amount: { kind: 'blackboard', key: 'EntityBB_value' },
                coefficient: { kind: 'constant', value: 1 },
              },
            },
          ],
        },
      },
    ],
  });
  const passive: CompiledOperatorPassiveProgram = {
    key: 'writer',
    initialBlackboard: {},
    enableSequence: {
      steps: [
        {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_value',
            operation: 'assign',
            value: { kind: 'constant', value: 7 },
          },
        },
      ],
    },
  };
  const assembly = createAssembly(
    [program],
    undefined,
    undefined,
    emptyEnemyBuffRuntime,
    undefined,
    testEnemy,
    undefined,
    undefined,
    { EntityBB_value: 1 },
    undefined,
    undefined,
    undefined,
    [passive],
  );
  expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
  expect(assembly.resources.getUltimateEnergy('operator')).toBe(7);
});

function nativeEventRuntimeOptions() {
  const native = createNativeEventFixture();
  return {
    registerCombatAbilityEvent: native.register,
    emitAbilityEvent: ((_owner, event, payload) =>
      native.dispatcher.dispatch(
        { event, payload } as import('../events/combatAbilityEvent').CombatAbilityEvent,
        [],
      )) as NonNullable<ConstructorParameters<typeof CombatRuntimeAssembly>[0]['emitAbilityEvent']>,
  };
}

function createAssembly(
  input:
    | readonly TestSkillProgram[]
    | {
        programs: readonly TestSkillProgram[];
        skillCasts?: ConstructorParameters<
          typeof CombatRuntimeAssembly
        >[0]['operators'][number]['skillCasts'];
        definitionSkillPrograms?: readonly CompiledSkillProgram[];
        skillCooldownPrograms?: ConstructorParameters<
          typeof CombatRuntimeAssembly
        >[0]['operators'][number]['skillCooldownPrograms'];
        createOperationExecutor?: ConstructorParameters<
          typeof CombatRuntimeAssembly
        >[0]['createOperationExecutor'];
        emitAbilityEvent?: ConstructorParameters<
          typeof CombatRuntimeAssembly
        >[0]['emitAbilityEvent'];
        registerCombatAbilityEvent: NonNullable<
          ConstructorParameters<typeof CombatRuntimeAssembly>[0]['registerCombatAbilityEvent']
        >;
        registerPassiveAbilityEventAction?: ConstructorParameters<
          typeof CombatRuntimeAssembly
        >[0]['registerPassiveAbilityEventAction'];
        combatSkillPrograms?: CombatSkillPrograms;
        dodgeProgram?: ConstructorParameters<
          typeof CombatRuntimeAssembly
        >[0]['operators'][number]['dodgeProgram'];
        dodgeInputs?: ConstructorParameters<typeof CombatRuntimeAssembly>[0]['dodgeInputs'];
        dashTiming?: ConstructorParameters<typeof CombatRuntimeAssembly>[0]['dashTiming'];
        createOperatorBuffRuntime?: ConstructorParameters<
          typeof CombatRuntimeAssembly
        >[0]['createOperatorBuffRuntime'];
        skillAvailabilityTags?: GameplayTagPredefine;
        resolveDashControllerState?: ConstructorParameters<
          typeof CombatRuntimeAssembly
        >[0]['resolveDashControllerState'];
      },
  isOperatorControlled?: (operatorId: string, frame: number) => boolean,
  resolveVitals?: ConstructorParameters<typeof CombatRuntimeAssembly>[0]['resolveVitals'],
  enemyBuffRuntime: ConstructorParameters<
    typeof CombatRuntimeAssembly
  >[0]['enemyBuffRuntime'] = emptyEnemyBuffRuntime,
  createOperatorBuffRuntime?: ConstructorParameters<
    typeof CombatRuntimeAssembly
  >[0]['createOperatorBuffRuntime'],
  enemy: CombatEnemyProgram = testEnemy,
  timeDilation?: ConstructorParameters<typeof CombatRuntimeAssembly>[0]['timeDilation'],
  createAbilityEntityBuffRuntime?: ConstructorParameters<
    typeof CombatRuntimeAssembly
  >[0]['createAbilityEntityBuffRuntime'],
  initialEntityBlackboard?: Readonly<Record<string, number>>,
  skillSlotGroups?: readonly CompiledSkillSlotGroup[],
  emitAbilityEvent?: ConstructorParameters<typeof CombatRuntimeAssembly>[0]['emitAbilityEvent'],
  buffDefinitions?: ConstructorParameters<
    typeof CombatRuntimeAssembly
  >[0]['operators'][number]['buffDefinitions'],
  passivePrograms?: readonly CompiledOperatorPassiveProgram[],
  panel?: ConstructorParameters<typeof CombatRuntimeAssembly>[0]['operators'][number]['panel'],
  inputs?: ConstructorParameters<typeof CombatRuntimeAssembly>[0]['inputs'],
  playerActionRoutes?: ConstructorParameters<
    typeof CombatRuntimeAssembly
  >[0]['operators'][number]['playerActionRoutes'],
  skillAvailabilityTags?: GameplayTagPredefine,
): CombatRuntimeAssembly {
  const testPrograms = 'programs' in input ? input.programs : input;
  const programs = testPrograms.flatMap(program => (program.castId === undefined ? [program] : []));
  const skillCasts = [
    ...('programs' in input ? (input.skillCasts ?? []) : []),
    ...testPrograms.flatMap(program => {
      const { castId, ...definition } = program;
      return castId === undefined ? [] : [{ castId, program: definition }];
    }),
  ];
  for (const binding of skillCasts) {
    if (
      programs.some(program => program.skillId === binding.program.skillId) ||
      ('programs' in input &&
        input.definitionSkillPrograms?.some(program => program.skillId === binding.program.skillId))
    )
      continue;
    programs.push(binding.program);
  }
  const resolvedSkillAvailabilityTags =
    ('programs' in input ? input.skillAvailabilityTags : undefined) ?? skillAvailabilityTags;
  const resolvedCreateOperatorBuffRuntime =
    ('programs' in input ? input.createOperatorBuffRuntime : undefined) ??
    createOperatorBuffRuntime;
  return new CombatRuntimeAssembly({
    ...nativeEventRuntimeOptions(),
    ...('programs' in input
      ? { registerCombatAbilityEvent: input.registerCombatAbilityEvent }
      : {}),
    ...('programs' in input && input.emitAbilityEvent
      ? { emitAbilityEvent: input.emitAbilityEvent }
      : {}),
    ...('programs' in input && input.registerPassiveAbilityEventAction
      ? { registerPassiveAbilityEventAction: input.registerPassiveAbilityEventAction }
      : {}),
    ...(resolvedSkillAvailabilityTags === undefined
      ? {}
      : { skillAvailabilityTags: resolvedSkillAvailabilityTags }),
    ...('programs' in input && input.resolveDashControllerState !== undefined
      ? { resolveDashControllerState: input.resolveDashControllerState }
      : {}),
    ...('programs' in input && input.combatSkillPrograms !== undefined
      ? { combatSkillPrograms: input.combatSkillPrograms }
      : {}),
    enemy,
    resources: {
      sp: 100,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 30, pauseDuration: 1, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
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
    },
    enemyBuffRuntime,
    ...(timeDilation === undefined ? {} : { timeDilation }),
    operators: [
      {
        operatorId: 'operator',
        skills: programs,
        ...(skillCasts.length === 0 ? {} : { skillCasts }),
        ...('programs' in input && input.skillCooldownPrograms !== undefined
          ? { skillCooldownPrograms: input.skillCooldownPrograms }
          : {}),
        ...('programs' in input && input.definitionSkillPrograms !== undefined
          ? { definitionSkillPrograms: input.definitionSkillPrograms }
          : {}),
        ...('programs' in input && input.dodgeProgram !== undefined
          ? { dodgeProgram: input.dodgeProgram }
          : {}),
        ...(buffDefinitions === undefined ? {} : { buffDefinitions }),
        ...(skillSlotGroups === undefined ? {} : { skillSlotGroups }),
        ...(playerActionRoutes === undefined ? {} : { playerActionRoutes }),
        ...(initialEntityBlackboard === undefined ? {} : { initialEntityBlackboard }),
        ...(passivePrograms === undefined ? {} : { passivePrograms }),
        ...(panel === undefined ? {} : { panel }),
      },
    ],
    createOperationExecutor:
      'programs' in input && input.createOperationExecutor !== undefined
        ? input.createOperationExecutor
        : () => rejectingExecutor,
    ...(inputs === undefined ? {} : { inputs }),
    ...('programs' in input && input.dodgeInputs !== undefined
      ? { dodgeInputs: input.dodgeInputs }
      : {}),
    ...('programs' in input && input.dashTiming !== undefined
      ? { dashTiming: input.dashTiming }
      : {}),
    ...(resolvedCreateOperatorBuffRuntime === undefined
      ? {}
      : { createOperatorBuffRuntime: resolvedCreateOperatorBuffRuntime }),
    ...(createAbilityEntityBuffRuntime === undefined ? {} : { createAbilityEntityBuffRuntime }),
    ...(isOperatorControlled === undefined ? {} : { isOperatorControlled }),
    ...(resolveVitals === undefined ? {} : { resolveVitals }),
    ...(emitAbilityEvent === undefined ? {} : { emitAbilityEvent }),
  });
}

describe('CombatRuntimeAssembly', () => {
  it('缺少未查明的闪避数据时保留输入并记录局部告警，不终止整场模拟', () => {
    const current = skill({
      skillId: 'current',
      costs: [],
      timelineBlockFrames: 30,
      exclusiveFrame: 30,
    });
    const assembly = createAssembly({
      programs: [current],
      registerCombatAbilityEvent: nativeEventRuntimeOptions().registerCombatAbilityEvent,
    });
    expect(assembly.tryStartSkill('operator', 'current')).toBe(true);

    expect(() =>
      assembly.advanceInputFrame({
        dodges: [
          { kind: 'dash', dodgeId: 'd1', operatorId: 'operator', direction: 'forward' },
          { kind: 'perfectDodgeSuccess', dodgeId: 'd1', operatorId: 'operator' },
        ],
      }),
    ).not.toThrow();

    expect(assembly.stateGraph.operators.get('operator')?.center).toMatchObject({
      state: 'dash',
      dashId: 'd1',
      dashTimingKnown: false,
    });
    expect(assembly.receipt.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event: 'SkillInterrupted' }),
        expect.objectContaining({
          event: 'DashInputExecuted',
          data: expect.objectContaining({ timingKnown: false }),
        }),
        expect.objectContaining({
          event: 'DodgeInputForced',
          data: expect.objectContaining({
            dodgeId: 'd1',
            operatorNotControlled: true,
          }),
        }),
        expect.objectContaining({
          event: 'DodgeInputPartiallySimulated',
          data: expect.objectContaining({
            dodgeId: 'd1',
            missingDashTiming: true,
            missingDodgeProgram: true,
            missingDashTagRules: true,
          }),
        }),
        expect.objectContaining({
          event: 'PerfectDodgeDeclarationForced',
          data: expect.objectContaining({
            dodgeId: 'd1',
            missingDodgeProgram: true,
            dashNotActive: false,
          }),
        }),
      ]),
    );
  });

  it('原生闪避标签门禁逐项告警，但时间轴声明的 Dash 仍然执行', () => {
    const table = new GameplayTagPredefine(GAMEPLAY_TAG_PREDEFINE);
    const container = new CombatBuffContainer<string>('operator', new CombatAttributeSet<string>());
    container.addEntityTags([
      table.getQuery('InImmobilized').tags[0]!,
      table.getQuery('InDisableDash').tags[0]!,
      table.getTag('SuperArmor'),
    ]);
    const assembly = createAssembly({
      programs: [],
      registerCombatAbilityEvent: nativeEventRuntimeOptions().registerCombatAbilityEvent,
      createOperatorBuffRuntime: () => asBuffRuntime(container),
      skillAvailabilityTags: table,
      resolveDashControllerState: () => ({
        playerActionEnabled: false,
        movementGaitAllowsDash: false,
        isInAir: true,
      }),
    });

    assembly.advanceInputFrame({
      dodges: [{ kind: 'dash', dodgeId: 'blocked', operatorId: 'operator', direction: 'forward' }],
    });

    expect(assembly.receipt.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'DashInputExecuted',
          producedBy: {
            kind: 'action',
            ownerId: 'operator',
            actionId: 'dash:blocked',
          },
        }),
        expect.objectContaining({
          event: 'DodgeInputForced',
          data: expect.objectContaining({
            dodgeId: 'blocked',
            inImmobilized: true,
            inDisableDash: true,
            hasSuperArmor: true,
            playerActionDisabled: true,
            movementGaitTooLow: true,
            isInAir: true,
          }),
        }),
      ]),
    );
  });

  it('Dash 中断当前技能并附着原生 Buff，成功事实经原生监听请求隐藏 Dodge 技能', () => {
    const container = new CombatBuffContainer<string>('operator', new CombatAttributeSet<string>());
    const buffRuntime = new BuffDefinitionOperationTarget(container, {
      get: () => undefined,
      compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
    });
    const current = skill({
      skillId: 'current',
      costs: [],
      timelineBlockFrames: 30,
      exclusiveFrame: 30,
    });
    const dodge = skill({
      skillGroupKey: 'dodge',
      skillId: 'perfectDodge',
      skillType: 'dodge',
      nativeSkillType: 'dodge',
      costs: [],
      costFrame: undefined,
      timelineBlockFrames: 2,
      exclusiveFrame: 2,
    });
    let assembly!: CombatRuntimeAssembly;
    assembly = createAssembly(
      {
        programs: [current, dodge],
        skillCooldownPrograms: [current, dodge],
        registerCombatAbilityEvent: nativeEventRuntimeOptions().registerCombatAbilityEvent,
        emitAbilityEvent: (_operatorId, event) => {
          if (event !== 'beforeTakeDamage') return;
          assembly.requestPostSkillCast('operator', {
            skillId: 'perfectDodge',
            resolveSkillSlot: false,
          });
        },
        dodgeProgram: {
          skillId: 'perfectDodge',
          dashBuffs: [{ buffId: 'dash-buff', blackboard: { dodgeSkillId: 'perfectDodge' } }],
        },
        dashTiming: {
          dashOffsetFrames: 30,
          blockAttackFramesInDash: 2,
          allowAttackAfterFramesInDash: 4,
          blockAttackFramesInPerfectDodge: 2,
          allowAttackAfterFramesInPerfectDodge: 4,
          blockDashAfterPerfectDodgeFrames: 3,
          dashInputCooldownFrames: 24,
          dashSecondDashIntervalFrames: 9,
        },
      },
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      () => buffRuntime,
      testEnemy,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { 'dash-buff': { stackingType: 'unique' } },
    );
    expect(assembly.tryStartSkill('operator', 'current')).toBe(true);

    assembly.advanceInputFrame({
      dodges: [
        { kind: 'dash', dodgeId: 'd1', operatorId: 'operator', direction: 'forward' },
        { kind: 'perfectDodgeSuccess', dodgeId: 'd1', operatorId: 'operator' },
      ],
    });
    assembly.advanceInputFrame({});

    expect(
      assembly.receipt.entries.findLast(entry => entry.event === 'SkillStarted')?.data?.skillId,
    ).toBe('perfectDodge');
    expect(assembly.stateGraph.operators.get('operator')?.center).toMatchObject({
      state: 'free',
      dashId: null,
      perfectDodgeActive: false,
      perfectDodgeConsumed: true,
    });
    expect(container.getCountByIds(['dash-buff'])).toBe(0);
    expect(assembly.receipt.entries.map(entry => entry.event)).toEqual(
      expect.arrayContaining([
        'SkillInterrupted',
        'DashInputExecuted',
        'PerfectDodgeDeclared',
        'PerfectDodgeSkillStarted',
      ]),
    );
  });

  it('Buff 容器接入干员节点并与技能共用实体黑板，清理不改写副本', () => {
    const container = new CombatBuffContainer<string>('operator', new CombatAttributeSet<string>());
    const target = new BuffDefinitionOperationTarget(container, { get: () => undefined });
    const assembly = createAssembly(
      [skill()],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      () => target,
    );
    const operator = assembly.stateGraph.operators.get('operator')!;
    expect(operator.buffs).toBe(container.runtimeState);
    expect(operator.buffs!.entityBlackboard).toBe(operator.blackboard);
    container.add({ id: 'test', stackingType: 'unlimited' }, 'operator');
    const saved = structuredClone(assembly.stateGraph);
    container.finishByIds(['test'], 'other');
    container.recycleFinishedBuffs();
    expect(saved.operators.get('operator')!.buffs!.instances.size).toBe(1);
    expect(operator.buffs!.instances.size).toBe(0);
    expect(saved.operators.get('operator')!.buffs!.entityBlackboard).toBe(
      saved.operators.get('operator')!.blackboard,
    );
  });

  it('固定定义相同时，不同未来块的身份和黑板不进入相同前缀的数据图', () => {
    const build = (futureId: string, futureValue: number) =>
      createAssembly({
        programs: [
          skill({ castId: 'prefix' }),
          skill({ castId: futureId, initialBlackboard: { futureValue } }),
        ],
        definitionSkillPrograms: [skill()],
        ...nativeEventRuntimeOptions(),
      });
    const a = build('future-a', 11);
    const b = build('future-b', 99);
    expect(a.stateGraph).toEqual(b.stateGraph);
    a.tryStartPlayerInput('operator', 'skill', 'prefix');
    b.tryStartPlayerInput('operator', 'skill', 'prefix');
    expect(a.stateGraph.operators.get('operator')!.ability.currentSkillKey).toBe(
      'skill\u0000prefix',
    );
    a.advanceFrame();
    b.advanceFrame();
    expect(a.stateGraph).toEqual(b.stateGraph);
    expect([...a.stateGraph.operators.get('operator')!.skills.keys()]).toEqual([
      'skill\u0000',
      'skill\u0000prefix',
    ]);
    const saved = structuredClone(a.stateGraph);
    const savedOperator = saved.operators.get('operator')!;
    expect(savedOperator.cooldowns.get('skill')).toBe(
      savedOperator.skills.get('skill\u0000')!.cooldown,
    );
    expect(savedOperator.cooldowns.get('skill')).toBe(
      savedOperator.skills.get('skill\u0000prefix')!.cooldown,
    );
    expect(saved.operators.get('operator')!.skills.get('skill\u0000')!.blackboard.entity).toBe(
      saved.operators.get('operator')!.skills.get('skill\u0000prefix')!.blackboard.entity,
    );
    a.tryStartPlayerInput('operator', 'skill', 'future-a');
    expect(a.stateGraph.operators.get('operator')!.skills.has('skill\u0000future-a')).toBe(true);
    expect(saved.operators.get('operator')!.skills.has('skill\u0000future-a')).toBe(false);
    expect(
      saved.operators.get('operator')!.skills.get('skill\u0000prefix')!.blackboard.entity,
    ).toBe(saved.operators.get('operator')!.blackboard);
    expect(saved.operators.get('operator')!.ability.currentSkillKey).toBeNull();
  });

  it('只配置冷却而没有施放实例的技能也进入数据图', () => {
    const assembly = createAssembly({
      programs: [],
      skillCooldownPrograms: [skill({ skillId: 'unplaced', cooldownFrames: 100, costFrame: 0 })],
      ...nativeEventRuntimeOptions(),
    });
    const operator = assembly.stateGraph.operators.get('operator')!;
    expect(operator.skills.size).toBe(0);
    expect([...operator.cooldowns.keys()]).toEqual(['unplaced']);
    const saved = structuredClone(assembly.stateGraph);
    expect(saved.operators.get('operator')!.cooldowns.get('unplaced')).toEqual(
      operator.cooldowns.get('unplaced'),
    );
    expect(saved.operators.get('operator')!.cooldowns.get('unplaced')).not.toBe(
      operator.cooldowns.get('unplaced'),
    );
  });

  it('有固定定义的未来技能块在提交时才创建执行器，重复输入不重复创建', () => {
    const created: (string | undefined)[] = [];
    const definition = skill();
    const placed = skill({ castId: 'future' });
    const assembly = createAssembly({
      programs: [placed],
      definitionSkillPrograms: [definition],
      ...nativeEventRuntimeOptions(),
      createOperationExecutor: context => {
        created.push(context.castId);
        return rejectingExecutor;
      },
    });
    expect(created).not.toContain('future');
    assembly.advanceFrame();
    expect(created).not.toContain('future');
    assembly.tryStartPlayerInput('operator', placed.skillId, 'future');
    expect(created.filter(id => id === 'future')).toHaveLength(1);
    assembly.tryStartPlayerInput('operator', placed.skillId, 'future');
    expect(created.filter(id => id === 'future')).toHaveLength(1);
  });

  it('共享层引用正式运行数据，复制后不会被后续帧和事件改写', () => {
    const assembly = createAssembly([]);
    const state = assembly.sharedState;
    expect(state.clock).toBe(assembly.clock.runtimeState);
    expect(state.resources).toBe(assembly.resources.runtimeState);
    expect(state).not.toHaveProperty('receipts');
    expect(state.comboWindows).toBe(assembly.comboWindows.runtimeState);
    const saved = structuredClone(state);
    const savedHistory = assembly.receipt.history.snapshot();
    assembly.comboWindows.open('operator', 'combo');
    assembly.ultimatePresentation.setActive(true, 'operator', 'hide');
    assembly.advanceFrame();
    expect(state.clock.frame).toBe(saved.clock.frame + 1);
    expect(state.comboWindows.records.size).toBe(1);
    expect(state.ultimatePresentation.inUltimateCasting).toBe(true);
    expect(saved.comboWindows.records.size).toBe(0);
    expect(saved.ultimatePresentation.inUltimateCasting).toBe(false);
    expect(assembly.receipt.history.length).toBeGreaterThan(savedHistory.length);
  });

  it('正式装配把普通技能登记到切面树共享的固定程序目录', () => {
    const program = skill();
    const programs = new CombatSkillPrograms();
    const assembly = createAssembly({
      programs: [program],
      combatSkillPrograms: programs,
      ...nativeEventRuntimeOptions(),
    });

    expect(assembly.combatSkillPrograms).toBe(programs);
    expect(programs.resolve(combatSkillProgramKey(program)).program).toBe(program);
  });

  it('整场恢复预检接受完整复制图，并拒绝丢失程序或共享引用的候选', () => {
    const definition = skill();
    const placed = skill();
    const operator = {
      operatorId: 'operator',
      skills: [],
      definitionSkillPrograms: [definition],
      skillCasts: [{ castId: 'future', program: placed }],
    };
    const assembly = createAssembly({
      programs: [],
      skillCasts: operator.skillCasts,
      definitionSkillPrograms: [definition],
      ...nativeEventRuntimeOptions(),
    });
    const saved = structuredClone(assembly.stateGraph);

    const prepared = prepareCombatRuntimeRestore(saved, [operator], assembly.combatSkillPrograms);

    expect(prepared.graph).toBe(saved);
    expect(prepared.operators).toBe(saved.operators);
    expect(prepared.skills.get('operator')![0]!.state).toBe(
      saved.operators.get('operator')!.skills.get('skill\u0000'),
    );
    expect(prepared.skills.get('operator')![0]!.fixed.program).toBe(definition);
    expect(() => prepareCombatRuntimeRestore(saved, [operator], new CombatSkillPrograms())).toThrow(
      "combat skill program 'operator",
    );
    const missingSkill = structuredClone(saved);
    missingSkill.operators.get('operator')!.skills.delete('skill\u0000');
    expect(() =>
      prepareCombatRuntimeRestore(missingSkill, [operator], assembly.combatSkillPrograms),
    ).toThrow("restored operator 'operator' is missing skill");
    const splitCooldown = structuredClone(saved);
    const splitOperator = splitCooldown.operators.get('operator')!;
    splitOperator.skills.set('skill\u0000', {
      ...splitOperator.skills.get('skill\u0000')!,
      cooldown: structuredClone(splitOperator.cooldowns.get('skill')!),
    });
    expect(() =>
      prepareCombatRuntimeRestore(splitCooldown, [operator], assembly.combatSkillPrograms),
    ).toThrow("restored skill 'operator:skill");
    const wrongOrder = structuredClone(saved);
    (wrongOrder.shared.resources.squad[0] as { operatorId: string }).operatorId = 'other';
    expect(() =>
      prepareCombatRuntimeRestore(wrongOrder, [operator], assembly.combatSkillPrograms),
    ).toThrow('restored resource squad order does not match combat operators');
    const splitResources = structuredClone(saved);
    const member = splitResources.shared.resources.squad[0]!;
    splitResources.shared.resources.operators.set(member.operatorId, structuredClone(member));
    expect(() =>
      prepareCombatRuntimeRestore(splitResources, [operator], assembly.combatSkillPrograms),
    ).toThrow("restored resource operator 'operator' uses another ledger");
    const missingAttachedBuff = structuredClone(saved);
    missingAttachedBuff.operators
      .get('operator')!
      .skills.get('skill\u0000')!
      .execution.attachedBuffs.set('["enemy",99]', { ownerId: 'enemy', instanceId: 99 });
    expect(() =>
      prepareCombatRuntimeRestore(missingAttachedBuff, [operator], assembly.combatSkillPrograms),
    ).toThrow('restored attached Buff');

    const missingActionBuff = structuredClone(saved);
    const actionSequence = createActionSequenceState(1);
    actionSequence.steps[0] = {
      kind: 'buffHold',
      buffs: {
        active: true,
        references: [{ ownerId: 'enemy', instanceId: 100 }],
      },
    };
    missingActionBuff.operators.get('operator')!.skills.get('skill\u0000')!.timeline = {
      scheduling: createTimelineActionState(),
      sequences: [actionSequence],
    };
    expect(() =>
      prepareCombatRuntimeRestore(missingActionBuff, [operator], assembly.combatSkillPrograms),
    ).toThrow('restored action-owned Buff');
  });

  it('整场恢复预检拒绝脱离干员实体黑板的被动状态', () => {
    const definition = skill();
    const passive: CompiledOperatorPassiveProgram = {
      key: 'passive',
      initialBlackboard: {},
      enableSequence: { steps: [] },
    };
    const operator = {
      operatorId: 'operator',
      skills: [definition],
      passivePrograms: [passive],
    };
    const assembly = createAssembly(
      [definition],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      [passive],
    );
    const saved = structuredClone(assembly.stateGraph);
    const passiveState = saved.operators.get('operator')!.passives.get('passive')!;
    Object.defineProperty(passiveState.blackboard, 'entity', {
      value: structuredClone(saved.operators.get('operator')!.blackboard),
    });

    expect(() =>
      prepareCombatRuntimeRestore(saved, [operator], assembly.combatSkillPrograms),
    ).toThrow("restored passive 'operator:passive' uses another entity blackboard");
  });

  it('整场恢复预检在创建对象前拒绝能力实体 Buff 容器的不完整拓扑', () => {
    const definition = skill();
    const operator = {
      operatorId: 'operator',
      skills: [definition],
    };
    const assembly = createAssembly([definition]);
    const target = assembly.abilityEntities.spawn({
      abilityEntityId: 'summon',
      definition: { lifetime: { kind: 'limited', durationSeconds: 10 } },
      ownerId: 'operator',
      source: { kind: 'operator', operatorId: 'operator' },
    });
    if (target.kind !== 'abilityEntity') throw new Error('test entity was not created');
    const entity = assembly.stateGraph.instances.abilityEntities.instances.get(target.instanceId)!;
    const buffs = new CombatBuffContainer(
      logicalAbilityEntityRuntimeId(target.instanceId),
      new CombatAttributeSet<string>(),
      undefined,
      null,
      ActionBlackboard.bindRuntimeState(entity.blackboard),
    );
    entity.buffContainerCreated = true;
    entity.buffs = buffs.runtimeState;
    const valid = structuredClone(assembly.stateGraph);

    expect(() =>
      prepareCombatRuntimeRestore(valid, [operator], assembly.combatSkillPrograms),
    ).not.toThrow();

    const missing = structuredClone(valid);
    missing.instances.abilityEntities.instances.get(target.instanceId)!.buffs = null;
    expect(() =>
      prepareCombatRuntimeRestore(missing, [operator], assembly.combatSkillPrograms),
    ).toThrow(`restored AbilityEntity '${target.instanceId}' created Buff container has no data`);

    const splitBlackboard = structuredClone(valid);
    const splitEntity = splitBlackboard.instances.abilityEntities.instances.get(target.instanceId)!;
    splitEntity.buffs = {
      ...splitEntity.buffs!,
      entityBlackboard: structuredClone(splitEntity.blackboard),
    };
    expect(() =>
      prepareCombatRuntimeRestore(splitBlackboard, [operator], assembly.combatSkillPrograms),
    ).toThrow(`restored AbilityEntity '${target.instanceId}' Buffs use another blackboard`);

    const duplicateChildOwner = structuredClone(valid);
    const duplicateEntity = duplicateChildOwner.instances.abilityEntities.instances.get(
      target.instanceId,
    )!;
    const ownerId = logicalAbilityEntityRuntimeId(target.instanceId);
    const child = createBuffInstanceState({
      ownerId,
      instanceId: 1,
      definitionId: 'child',
      sourceId: 'operator',
    });
    duplicateEntity.buffs!.instances.set(1, child);
    duplicateEntity.childBuffs.push(child.identity, child.identity);
    expect(() =>
      prepareCombatRuntimeRestore(duplicateChildOwner, [operator], assembly.combatSkillPrograms),
    ).toThrow(`restored AbilityEntity child Buff '["${ownerId}",1]' has multiple owners`);
  });

  it.each([
    { scope: 'global', scale: 0.5, blockFrames: 2, nextFrame: 5, instant: false, frozenFrames: 0 },
    { scope: 'entity', scale: 0.5, blockFrames: 2, nextFrame: 5, instant: false, frozenFrames: 0 },
    { scope: 'global', scale: 1, blockFrames: 0, nextFrame: 1, instant: false, frozenFrames: 0 },
    { scope: 'global', scale: 1, blockFrames: 2, nextFrame: 1, instant: true, frozenFrames: 0 },
    { scope: 'global', scale: 0, blockFrames: 2, nextFrame: 6, instant: false, frozenFrames: 3 },
  ] as const)(
    '持久组按 $scope 时钟的实际块边界接续，块宽 $blockFrames，旁路 $instant',
    ({ scope, scale, blockFrames, nextFrame, instant, frozenFrames }) => {
      const programs = ['a', 'b', 'c'].map(castId =>
        skill({
          skillId: castId,
          castId,
          costs: [],
          costFrame: undefined,
          timelineBlockFrames: blockFrames,
          // 自然周期明显大于块宽，防止把自然结束误当成组内衔接点。
          naturalDurationFrames: 300,
          ...(instant ? { switchToBuffCast: { asSkillCast: true, sequence: { steps: [] } } } : {}),
        }),
      );
      const assembly = new CombatRuntimeAssembly({
        ...nativeEventRuntimeOptions(),
        enemy: testEnemy,
        enemyBuffRuntime: emptyEnemyBuffRuntime,
        resources: {
          sp: 100,
          maxSp: 300,
          returnedSp: 0,
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
          ultimateEnergySystemUnlocked: true,
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
        },
        operators: [{ operatorId: 'operator', skills: programs }],
        inputs: programs.map((program, declarationOrder) => ({
          frame: 0,
          operatorId: 'operator',
          skillId: program.skillId,
          castId: program.castId!,
          declarationOrder,
        })),
        skillInputGroups: [{ anchorCastId: 'a', castIds: ['a', 'b', 'c'] }],
        timeDilation: { config: {} },
        createOperationExecutor: () => rejectingExecutor,
      });
      const dilationId =
        scope === 'global'
          ? assembly.timeDilation!.startGlobal({
              durationSeconds: 30,
              slot: 'Test/TimeSlot1',
              priority: 10,
              constantScale: scale,
            })
          : assembly.timeDilation!.startEntity({
              entityId: 'operator',
              durationSeconds: 30,
              slot: 'Test/TimeSlot1',
              priority: 10,
              curve: () => scale,
            });
      if (frozenFrames > 0) {
        assembly.advanceFrames(frozenFrames);
        expect(
          assembly.receipt.entries.filter(entry => entry.event === 'SkillInputProcessed'),
        ).toHaveLength(1);
        assembly.timeDilation!.stop(dilationId);
      }
      assembly.advanceFrames(nextFrame - frozenFrames - 1);
      expect(
        assembly.receipt.entries
          .filter(entry => entry.event === 'SkillInputProcessed')
          .map(entry => [entry.data?.castId, entry.frame]),
      ).toEqual([['a', 0]]);
      assembly.advanceFrame();
      expect(
        assembly.receipt.entries
          .filter(entry => entry.event === 'SkillInputProcessed')
          .map(entry => [entry.data?.castId, entry.frame]),
      ).toEqual([
        ['a', 0],
        ['b', nextFrame],
      ]);
      // 缺少玩家路由只产生告警，已经执行的组成员仍继续衔接。
      expect(
        assembly.receipt.entries.some(entry => entry.event === 'SkillInputResolutionUnknown'),
      ).toBe(true);
      expect(assembly.receipt.entries.some(entry => entry.event === 'SkillInputGroupBlocked')).toBe(
        false,
      );
      if (instant) {
        expect(assembly.receipt.entries.some(entry => entry.event === 'SkillStarted')).toBe(false);
        expect(
          assembly.receipt.entries.filter(entry => entry.event === 'SkillSwitchedToBuff'),
        ).toHaveLength(2);
      }
      const nextInterval = frozenFrames > 0 ? blockFrames + 1 : nextFrame;
      assembly.advanceFrames(nextInterval);
      expect(
        assembly.receipt.entries
          .filter(entry => entry.event === 'SkillInputProcessed')
          .map(entry => [entry.data?.castId, entry.frame]),
      ).toEqual([
        ['a', 0],
        ['b', nextFrame],
        ['c', nextFrame + nextInterval],
      ]);
    },
  );

  it('Dash 中断连续组前段后，等待原生攻击接续窗口再放置下一段', () => {
    const programs = ['a', 'b'].map(castId =>
      skill({
        skillId: castId,
        castId,
        costs: [],
        costFrame: undefined,
        timelineBlockFrames: 30,
        naturalDurationFrames: 300,
        exclusiveFrame: 300,
      }),
    );
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      enemy: testEnemy,
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      resources: {
        sp: 100,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
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
      },
      operators: [{ operatorId: 'operator', skills: programs }],
      initialControlledOperatorId: 'operator',
      inputs: programs.map((program, declarationOrder) => ({
        frame: 0,
        operatorId: 'operator',
        skillId: program.skillId,
        castId: program.castId!,
        declarationOrder,
      })),
      skillInputGroups: [{ anchorCastId: 'a', castIds: ['a', 'b'] }],
      dodgeInputs: [
        { frame: 1, kind: 'dash', dodgeId: 'd1', operatorId: 'operator', direction: 'forward' },
      ],
      dashTiming: {
        dashOffsetFrames: 30,
        blockAttackFramesInDash: 1,
        allowAttackAfterFramesInDash: 4,
        blockAttackFramesInPerfectDodge: 1,
        allowAttackAfterFramesInPerfectDodge: 3,
        blockDashAfterPerfectDodgeFrames: 15,
        dashInputCooldownFrames: 24,
        dashSecondDashIntervalFrames: 9,
      },
      createOperationExecutor: () => rejectingExecutor,
    });

    assembly.advanceFrames(4);
    expect(
      assembly.receipt.entries
        .filter(entry => entry.event === 'SkillInputProcessed')
        .map(entry => [entry.data?.castId, entry.frame]),
    ).toEqual([['a', 0]]);
    assembly.advanceFrame();
    expect(
      assembly.receipt.entries
        .filter(entry => entry.event === 'SkillInputProcessed')
        .map(entry => [entry.data?.castId, entry.frame]),
    ).toEqual([
      ['a', 0],
      ['b', 5],
    ]);
  });

  it.each(
    (['finish', 'reach', 'hit'] as const).flatMap(event =>
      (['actionSource', 'actionOwner'] as const).map(source => ({ event, source })),
    ),
  )('嵌套投射物 $event 回调按 $source 选择来源与发射事件身份', ({ event, source }) => {
    const emitAbilityEvent = vi.fn();
    const callbackStep = (
      steps: readonly ResolvedCombatStep[],
      source: 'actionSource' | 'actionOwner' = 'actionSource',
    ): ResolvedCombatStep => ({
      kind: 'launchProjectile',
      parameters: {
        source,
        finish: event === 'reach' ? 'firstTickReach' : event === 'hit' ? 10 : 0.01,
        recycleDelaySeconds: 10,
        ...(event === 'hit' ? { hit: { finishOnHit: true } } : {}),
      },
      callbacks: [
        {
          event,
          skill: {
            skillId: 'callback',
            nativeSkillType: 'normalSkill',
            naturalDurationFrames: 3,
            initialBlackboard: {},
            castResource: {
              costFrame: 0,
              cooldownSeconds: 0,
              maxChargeTime: 1,
              cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
            },
            timelineActions: [{ startFrame: 0, endFrame: 0, sequence: { steps } }],
          },
        },
      ],
    });
    const sourceProbe = (
      objectType: import('../../../../packages/game-data-contract/src/primitives').CombatObjectType,
      name: string,
    ): ResolvedCombatStep[] => [
      {
        kind: 'mergeContextTargets',
        parameters: {
          saveToContextKey: 'source',
          sources: [{ kind: 'abilitySystemSource', owner: 'actionOwner' }],
        },
      },
      {
        kind: 'conditional',
        parameters: {
          condition: {
            kind: 'contextTargetObjectTypeMatch',
            contextKey: 'source',
            objectTypes: [objectType],
          },
        },
        whenTrue: {
          steps: [
            {
              kind: 'triggerCustomAbilityEvent',
              parameters: {
                target: 'caster',
                source: 'currentAbilityEntity',
                eventName: name,
                eventParam: 1,
              },
            },
          ],
        },
      },
    ];
    const assembly = createAssembly({
      ...nativeEventRuntimeOptions(),
      emitAbilityEvent,
      programs: [
        skill({
          costs: [],
          costFrame: undefined,
          timelineActions: [
            {
              startFrame: 0,
              sequence: {
                steps: [
                  callbackStep([
                    ...sourceProbe('character', 'source-is-operator'),
                    callbackStep(
                      [
                        ...sourceProbe(
                          source === 'actionOwner' ? 'projectile' : 'character',
                          'nested-source',
                        ),
                        ...sourceProbe('abilityEntity', 'incorrect-ability-entity-match'),
                      ],
                      source,
                    ),
                  ]),
                ],
              },
            },
          ],
        }),
      ],
    });
    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    assembly.advanceFrames(2);
    const launches = emitAbilityEvent.mock.calls.filter(call => call[1] === 'projectileLaunched');
    expect(launches.map(call => call[0])).toEqual([
      'operator',
      source === 'actionOwner' ? 'ability-entity:1' : 'operator',
    ]);
    expect(
      emitAbilityEvent.mock.calls
        .filter(call => call[1] === 'customAbilityEvent')
        .map(call => call[2].eventName),
    ).toEqual(['source-is-operator', 'nested-source']);
    expect(assembly.projectileLifetimes.getUnfinishedTargets()).toEqual([]);
  });
  it('显式延迟 Skill ID 的来源身份与 BeforeCast 不被当前技能槽改写', () => {
    const emitAbilityEvent = vi.fn();
    const base = skill({
      skillId: 'base',
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          endFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'changeSkillSlot',
                parameters: { skillGroupKey: 'battleSkill', targetSkillKey: 'replacement' },
              },
            ],
          },
        },
      ],
    });
    const followup = skill({ skillId: 'followup', costs: [], costFrame: undefined });
    const replacement = skill({ skillId: 'replacement', costs: [], costFrame: undefined });
    const args: Parameters<typeof createAssembly> = [[base, followup, replacement]];
    args[9] = [
      {
        skillGroupKey: 'battleSkill',
        baseSkillKey: 'base',
        stableInputSkillKeys: ['base', 'followup'],
        replacementSkillKeys: ['replacement'],
      },
    ];
    args[10] = emitAbilityEvent;
    const assembly = createAssembly(...args);
    expect(assembly.tryStartSkill('operator', 'base')).toBe(true);
    emitAbilityEvent.mockClear();
    const inherited = {
      skillCastId: 42,
      originSkillId: 'origin',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 10,
    };
    assembly.requestPostSkillCast('operator', {
      skillId: 'followup',
      resolveSkillSlot: false,
      inheritedSkillCastInfo: inherited,
      inputTarget: { kind: 'operator', operatorId: 'operator' },
    });
    assembly.advanceFrame();
    const before = emitAbilityEvent.mock.calls.filter(call => call[1] === 'beforeCastSkill');
    expect(
      assembly.stateGraph.operators.get('operator')!.skills.get('followup\u0000')!.execution
        .inputTarget,
    ).toEqual({ kind: 'operator', operatorId: 'operator' });
    expect(before).toHaveLength(1);
    expect(before[0]![2]).toMatchObject({
      skillId: 'followup',
      skillCastId: 42,
      skillCastInfo: inherited,
    });
    assembly.advanceFrame();
    const end = emitAbilityEvent.mock.calls.filter(
      call => call[1] === 'skillEnd' && call[2].skillId === 'followup',
    );
    expect(end).toHaveLength(1);
    expect(end[0]![2]).toMatchObject({ skillId: 'followup', skillCastId: 42 });
  });

  it('publishes the launched projectile instance and preserves its source cast until reset', () => {
    const emitAbilityEvent = vi.fn();
    const assembly = createAssembly({
      ...nativeEventRuntimeOptions(),
      emitAbilityEvent,
      programs: [
        skill({
          costs: [],
          costFrame: undefined,
          timelineActions: [
            {
              startFrame: 0,
              endFrame: 0,
              sequence: {
                steps: [
                  {
                    kind: 'launchProjectile',
                    parameters: { finish: 0.1, recycleDelaySeconds: 0 },
                    callbacks: [
                      {
                        event: 'finish',
                        skill: {
                          skillId: 'callback',
                          nativeSkillType: 'normalSkill',
                          naturalDurationFrames: 1,
                          castResource: {
                            costFrame: 0,
                            cooldownSeconds: 0,
                            maxChargeTime: 1,
                            cost: {
                              resource: 'ultimateEnergy',
                              value: 0,
                              availabilityThreshold: 0,
                            },
                          },
                          initialBlackboard: {},
                          timelineActions: [
                            { startFrame: 0, endFrame: 0, sequence: { steps: [] } },
                          ],
                        },
                      },
                    ],
                  },
                ],
              },
            },
          ],
        }),
      ],
    });
    expect(emitAbilityEvent.mock.calls).toEqual([]);
    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    const launch = emitAbilityEvent.mock.calls.find(call => call[1] === 'projectileLaunched');
    const cast = emitAbilityEvent.mock.calls.find(call => call[1] === 'beforeCastSkill');
    expect(launch?.[0]).toBe('operator');
    expect(launch?.[2].sourceId).toBe('operator');
    expect(launch?.[2].entity).not.toHaveProperty('target');
    expect(launch?.[2].entity.instanceId).toBeGreaterThan(0);
    expect(launch?.[2].skillCastInfo.skillCastId).toBe(cast?.[2].skillCastId);
    const reset = vi.fn(() => {
      expect(assembly.projectileLifetimes.findSource(1)).toEqual({
        kind: 'operator',
        operatorId: 'operator',
      });
      expect(
        emitAbilityEvent.mock.calls
          .filter(call => call[0] === 'ability-entity:1')
          .map(call => call[1]),
      ).toEqual(['beforeCastSkill', 'afterSkillApplyCost', 'skillEnd']);
    });
    launch?.[2].entity.onReset(reset);
    expect(reset).not.toHaveBeenCalled();
    for (let i = 0; i < 30; i++) assembly.advanceFrame();
    expect(reset).toHaveBeenCalledTimes(1);
    expect(assembly.projectileLifetimes.findSource(1)).toBeUndefined();
    const origins = new CombatObjectOrigins(assembly.receipt.entries);
    const historical = origins.get({ kind: 'abilityEntity', instanceId: 1 });
    expect(historical.fact?.event).toBe('ProjectileLaunched');
    expect(
      origins.relations(historical).find(link => link.relation === 'producedBy')?.target.ref,
    ).toEqual({ kind: 'action', ownerId: 'operator', actionId: 'skill' });
    expect(
      origins.relations(historical).find(link => link.relation === 'runtimeSource')?.target.ref,
    ).toEqual({ kind: 'operator', operatorId: 'operator' });
    const callbackEvents = emitAbilityEvent.mock.calls.filter(
      call => call[0] === 'ability-entity:1',
    );
    for (const [, , payload] of callbackEvents) {
      expect(payload).toMatchObject({
        sourceId: 'ability-entity:1',
        targetId: 'ability-entity:1',
        skillId: 'callback',
        skillCastId: cast?.[2].skillCastId,
      });
      expect(payload.skillType).toBeUndefined();
    }
    expect(
      emitAbilityEvent.mock.calls.filter(call => call[1] === 'projectileLaunched'),
    ).toHaveLength(1);
  });

  it.each(
    [0, 1.5].flatMap(recycleDelaySeconds =>
      [1, 0.5].map(globalScale => ({ recycleDelaySeconds, globalScale })),
    ),
  )(
    '无战斗回调发射按全局缩放$globalScale保留$recycleDelaySeconds秒回收延迟',
    ({ recycleDelaySeconds, globalScale }) => {
      const emitAbilityEvent = vi.fn();
      const assembly = createAssembly(
        {
          ...nativeEventRuntimeOptions(),
          emitAbilityEvent,
          programs: [
            skill({
              costs: [],
              costFrame: undefined,
              timelineActions: [
                {
                  startFrame: 0,
                  endFrame: 0,
                  sequence: {
                    steps: [
                      {
                        kind: 'launchProjectile',
                        parameters: { finish: 'firstTickReach', recycleDelaySeconds },
                        callbacks: [],
                      },
                      { kind: 'finishTimeline', parameters: {} },
                    ],
                  },
                },
              ],
            }),
          ],
        },
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { config: {} },
      );
      assembly.timeDilation!.startGlobal({
        durationSeconds: 10,
        slot: 'Test/TimeSlot1',
        priority: 1,
        constantScale: globalScale,
      });
      expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
      const launch = emitAbilityEvent.mock.calls.find(call => call[1] === 'projectileLaunched');
      expect(launch).toBeDefined();
      const reset = vi.fn(() =>
        expect(assembly.projectileLifetimes.findSource(1)).toEqual({
          kind: 'operator',
          operatorId: 'operator',
        }),
      );
      launch![2].entity.onReset(reset);
      // 动作结束不持有此对象的释放句柄。
      assembly.advanceFrame();
      expect(assembly.timeDilation!.currentGlobalScale).toBe(globalScale);
      expect(assembly.receipt.entries.some(entry => entry.event === 'SkillEnded')).toBe(true);
      expect(reset).not.toHaveBeenCalled();
      for (let i = 0; i < Math.floor((recycleDelaySeconds * 30) / globalScale); i++) {
        assembly.projectileLifetimes.advanceFrame();
        expect(reset).not.toHaveBeenCalled();
      }
      assembly.projectileLifetimes.advanceFrame();
      expect(reset).not.toHaveBeenCalled();
      assembly.projectileLifetimes.advanceFrame();
      expect(reset).toHaveBeenCalledOnce();
      expect(assembly.projectileLifetimes.findSource(1)).toBeUndefined();
      expect(emitAbilityEvent.mock.calls.filter(call => call[0] === 'ability-entity:1')).toEqual(
        [],
      );
    },
  );

  it('runs projectile finish and reset before the enemy AbilitySystem buff pass', () => {
    const calls: string[] = [];
    const assembly = createAssembly([], undefined, undefined, {
      ...emptyEnemyBuffRuntime,
      advanceFrame: () => calls.push('enemy-buffs'),
    });
    calls.length = 0;
    const projectile = assembly.projectileLifetimes.launch({
      finishDelaySeconds: 0.01,
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 1 / 30,
      finish: () => calls.push('finish-callback'),
      beforeReset: () => calls.push('end-callback'),
      abilityRuntime: { advanceFrame: () => calls.push('ability') },
    });
    projectile.onReset(() => calls.push('reset'));
    const savedGraph = structuredClone(assembly.stateGraph);
    expect(assembly.stateGraph.shared).toBe(assembly.sharedState);
    expect(assembly.stateGraph.events.semantic).toBe(assembly.semanticEvents.runtimeState);
    expect(assembly.stateGraph.events.native).toBeNull();
    expect(assembly.stateGraph.instances.abilityEntities).toBe(
      assembly.abilityEntities.runtimeState,
    );
    expect(assembly.stateGraph.instances.globalBuffs).toBe(assembly.globalBuffs.runtimeState);
    expect(savedGraph.instances.projectiles.instances.has(projectile.target.instanceId)).toBe(true);
    assembly.advanceFrame();
    expect(calls).toEqual(['finish-callback', 'enemy-buffs', 'ability']);
    calls.length = 0;
    assembly.advanceFrame();
    expect(calls).toEqual(['enemy-buffs', 'ability']);
    calls.length = 0;
    assembly.advanceFrame();
    expect(calls).toEqual(['end-callback', 'reset', 'enemy-buffs']);
    expect(assembly.stateGraph.instances.projectiles.instances.size).toBe(0);
    expect(savedGraph.instances.projectiles.instances.size).toBe(1);
  });

  it.each(['common', 'type'] as const)(
    'diagnoses current %s tags without rejecting an authored skill',
    kind => {
      const table = new GameplayTagPredefine(GAMEPLAY_TAG_PREDEFINE);
      const container = new CombatBuffContainer('operator', new CombatAttributeSet<string>());
      const tags =
        kind === 'common'
          ? [table.getTag('CantCastSkillWhenChanneling'), table.getQuery('InDisarmed').tags[0]!]
          : [table.getQuery('InDisarmed').tags[0]!];
      const event =
        kind === 'common' ? 'SkillInputBlockedByCommonTag' : 'SkillInputBlockedByTypeTag';
      container.addEntityTags(tags);
      const assembly = createAssembly(
        [skill({ costs: [], nativeSkillType: 'attack' })],
        undefined,
        undefined,
        emptyEnemyBuffRuntime,
        () => asBuffRuntime(container),
        testEnemy,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        table,
      );
      expect(assembly.tryStartPlayerInput('operator', 'skill', undefined, 'battleSkill')).toBe(
        true,
      );
      expect(assembly.receipt.entries).toContainEqual(
        expect.objectContaining({
          event,
          data: expect.objectContaining({
            skillId: 'skill',
            blocker: kind === 'common' ? 'CantCastSkillWhenChanneling' : 'InDisarmed',
          }),
        }),
      );
      expect(assembly.receipt.entries.some(entry => entry.event === 'SkillStarted')).toBe(true);
      if (kind === 'common') {
        expect(
          assembly.receipt.entries.some(entry => entry.event === 'SkillInputBlockedByTypeTag'),
        ).toBe(false);
      }
      container.removeEntityTags(tags);
      assembly.advanceFrame();
      assembly.advanceFrame();
      assembly.advanceFrame();
      expect(assembly.tryStartPlayerInput('operator', 'skill', undefined, 'battleSkill')).toBe(
        true,
      );
      expect(assembly.receipt.entries.filter(entry => entry.event === event)).toHaveLength(1);
    },
  );

  it.each(['basicAttack', 'battleSkill', 'comboSkill', 'ultimate', undefined] as const)(
    'diagnoses only evidenced ultimate input during another operator presentation: %s',
    action => {
      const assembly = createAssembly([skill({ costs: [] })]);
      assembly.ultimatePresentation.setActive(true, 'another-operator', 'cinematic');
      expect(assembly.tryStartPlayerInput('operator', 'skill', undefined, action)).toBe(true);
      expect(
        assembly.receipt.entries.filter(
          entry => entry.event === 'UltimateInputBlockedByPresentation',
        ),
      ).toHaveLength(action === 'ultimate' ? 1 : 0);
      expect(assembly.receipt.entries).toContainEqual(
        expect.objectContaining({ event: 'SkillStarted' }),
      );
    },
  );

  it('does not diagnose ultimate input after presentation ends or an internal cast during it', () => {
    const assembly = createAssembly([skill({ costs: [] })]);
    assembly.ultimatePresentation.setActive(true, 'another-operator', 'cinematic');
    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    assembly.ultimatePresentation.setActive(false, 'another-operator', 'cinematic');
    assembly.advanceFrame();
    assembly.advanceFrame();
    assembly.advanceFrame();
    expect(assembly.tryStartPlayerInput('operator', 'skill', undefined, 'ultimate')).toBe(true);
    expect(
      assembly.receipt.entries.filter(
        entry => entry.event === 'UltimateInputBlockedByPresentation',
      ),
    ).toHaveLength(0);
  });

  it('resolves Buff lifecycle operations from a deferred unbound skill definition', () => {
    const container = new CombatBuffContainer<string>('operator', new CombatAttributeSet<string>());
    const buffRuntime = new BuffDefinitionOperationTarget(container, {
      get: () => undefined,
      compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
    });
    const hidden = skill({
      skillId: 'native-hidden',
      nativeSkillType: 'normalSkill',
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'applyBuff',
                parameters: {
                  buffId: 'hidden-buff',
                  target: 'caster',
                  inheritSourceSkillCastInfo: true,
                },
              },
            ],
          },
        },
      ],
    });
    const placed = skill({
      skillId: 'placed',
      castId: 'placed-cast',
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'castSkillDuringAction',
                parameters: {
                  skillId: 'native-hidden',
                  target: 'enemy',
                  skipApplyCost: true,
                  inheritSourceSkillCastInfo: false,
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly(
      [placed, hidden],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      () => buffRuntime,
      testEnemy,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        'hidden-buff': {
          stackingType: 'unique',
          lifecycleSequences: {
            enable: {
              steps: [
                {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'seen',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  },
                },
              ],
            },
          },
        },
      },
      undefined,
      undefined,
      undefined,
      undefined,
    );

    expect(assembly.tryStartSkill('operator', 'placed', 'placed-cast')).toBe(true);
    assembly.advanceFrame();
    expect(container.getCountById('hidden-buff')).toBe(1);
  });

  it('emits native owner switch events exactly when the control timeline changes', () => {
    const emitted = vi.fn();
    const assembly = createAssembly(
      [],
      (_operatorId, frame) => frame < 2 || frame >= 3,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      undefined,
      undefined,
      undefined,
      undefined,
      emitted,
    );

    assembly.advanceFrame();
    expect(emitted).not.toHaveBeenCalled();
    assembly.advanceFrame();
    assembly.advanceFrame();

    expect(emitted.mock.calls).toEqual([
      ['operator', 'ownerSwitchToGuard', { sourceId: 'operator', targetId: 'operator' }],
      ['operator', 'ownerSwitchToCenter', { sourceId: 'operator', targetId: 'operator' }],
    ]);
  });

  it('warns on a mismatched player slot but executes the explicitly placed skill', () => {
    const base = skill({ skillId: 'battleSkill', castId: 'cast:base', costs: [] });
    const replacement = skill({
      skillId: 'battleSkillDuringUltimate',
      castId: 'cast:replacement',
      costs: [{ resource: 'sp', value: 150 }],
    });
    const assembly = createAssembly(
      [base, replacement],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      undefined,
      undefined,
      undefined,
      [
        {
          skillGroupKey: 'battleSkill',
          baseSkillKey: 'battleSkill',
          replacementSkillKeys: ['battleSkillDuringUltimate'],
        },
      ],
      undefined,
      undefined,
      undefined,
      undefined,
      [
        {
          frame: 0,
          operatorId: 'operator',
          skillId: 'battleSkillDuringUltimate',
          castId: 'cast:replacement',
          action: 'battleSkill',
        },
      ],
      {
        battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
      },
    );

    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'SkillInputResolvedToDifferentSkill',
        data: expect.objectContaining({
          skillId: 'battleSkillDuringUltimate',
          actualSkillId: 'battleSkill',
        }),
      }),
    );
    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'SkillStarted',
        data: expect.objectContaining({ skillId: 'battleSkillDuringUltimate' }),
      }),
    );

    assembly.advanceFrame();
    expect(assembly.resources.sp).toBe(-49);
    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'SpChanged',
        data: expect.objectContaining({ actualValue: -150, currentValue: -49 }),
      }),
    );
  });

  it('resolves the combo action to the active HUD candidate before the static combo slot', () => {
    const first = skill({ skillId: 'combo-stage-1', skillType: 'comboSkill', costs: [] });
    const second = skill({ skillId: 'combo-stage-2', skillType: 'comboSkill', costs: [] });
    const assembly = createAssembly(
      [first, second],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      undefined,
      undefined,
      undefined,
      [
        {
          skillGroupKey: 'comboSkill',
          baseSkillKey: 'combo-stage-1',
          stableInputSkillKeys: ['combo-stage-1', 'combo-stage-2'],
          replacementSkillKeys: [],
        },
      ],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' } },
    );
    assembly.comboWindows.open('operator', 'combo-stage-2');

    expect(assembly.tryStartPlayerInput('operator', 'combo-stage-2', undefined, 'comboSkill')).toBe(
      true,
    );
    expect(
      assembly.receipt.entries.some(entry => entry.event === 'SkillInputResolvedToDifferentSkill'),
    ).toBe(false);
  });

  it('resolves a native combo candidate through the current combo skill slot', () => {
    const ultimate = skill({
      skillId: 'ultimate',
      skillType: 'ultimate',
      costs: [],
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'changeSkillSlot',
                parameters: {
                  skillGroupKey: 'comboSkill',
                  targetSkillKey: 'enhancedComboSkill',
                  inheritOriginSkillCooldownProgress: true,
                },
              },
            ],
          },
        },
      ],
    });
    const base = skill({ skillId: 'comboSkill', skillType: 'comboSkill', costs: [] });
    const enhanced = skill({
      skillId: 'enhancedComboSkill',
      skillType: 'comboSkill',
      costs: [],
    });
    const assembly = createAssembly(
      [ultimate, base, enhanced],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      undefined,
      undefined,
      undefined,
      [
        {
          skillGroupKey: 'comboSkill',
          baseSkillKey: 'comboSkill',
          replacementSkillKeys: ['enhancedComboSkill'],
        },
      ],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' } },
    );

    expect(assembly.tryStartSkill('operator', 'ultimate')).toBe(true);
    assembly.comboWindows.open(
      'operator',
      'comboSkill',
      {},
      {
        skillGroupKey: 'comboSkill',
        inputTarget: { kind: 'enemy' },
        triggerTarget: null,
        assignPairs: null,
      },
    );

    expect(
      assembly.tryStartPlayerInput('operator', 'enhancedComboSkill', undefined, 'comboSkill'),
    ).toBe(true);
    expect(
      assembly.receipt.entries.some(entry => entry.event === 'SkillInputResolvedToDifferentSkill'),
    ).toBe(false);
    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'SkillStarted',
        data: expect.objectContaining({ skillId: 'enhancedComboSkill' }),
      }),
    );
  });

  it('resolves descendant Buff definitions from the source skill after crossing to a teammate', () => {
    const sourceBuffs = new CombatBuffContainer('source', new CombatAttributeSet<string>());
    const allyBuffs = new CombatBuffContainer('ally', new CombatAttributeSet<string>());
    const compileInline = (entry: CombatBuffDefinitionEntry) => ({
      id: entry.id,
      stackingType: entry.stackingType,
    });
    const sourceRuntime = new BuffDefinitionOperationTarget(sourceBuffs, {
      get: () => undefined,
      compile: compileInline,
    });
    const allyRuntime = new BuffDefinitionOperationTarget(allyBuffs, {
      get: () => undefined,
      compile: compileInline,
    });
    const childDefinition = { stackingType: 'unique' as const };
    const parentDefinition = {
      stackingType: 'unique' as const,
      lifecycleSequences: {
        enable: {
          steps: [
            {
              kind: 'applyBuff' as const,
              parameters: {
                buffId: 'source-child',
                target: 'buffOwner' as const,
                inheritSourceSkillCastInfo: true,
              },
            },
          ],
        },
      },
    };
    const sourceSkill = skill({
      operatorId: 'source',
      skillId: 'support',
      castId: 'support-cast',
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'applyBuff',
                parameters: {
                  buffId: 'source-parent',
                  target: 'partyExceptCaster',
                  inheritSourceSkillCastInfo: true,
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
        squad: ['source', 'ally'].map(operatorId => ({
          operatorId,
          ultimateEnergy: 0,
          maxUltimateEnergy: 100,
          ultimateEnergyGainMultiplier: 1,
          allowedUltimateEnergyRecoveryTags: null,
        })),
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [
        {
          operatorId: 'source',
          skills: [sourceSkill],
          buffRuntime: sourceRuntime,
          buffDefinitions: {
            'source-parent': parentDefinition,
            'source-child': childDefinition,
          },
        },
        { operatorId: 'ally', skills: [], buffRuntime: allyRuntime },
      ],
      createOperationExecutor: () => rejectingExecutor,
    });

    expect(assembly.tryStartSkill('source', 'support', 'support-cast')).toBe(true);
    expect(allyBuffs.getCountById('source-parent')).toBe(1);
    expect(allyBuffs.getCountById('source-child')).toBe(1);
    expect(sourceBuffs.getCountById('source-child')).toBe(0);
  });

  it('emits before-cast events for both direct and deferred skill starts', () => {
    const emitAbilityEvent = vi.fn();
    const first = skill({ skillId: 'first', costs: [], costFrame: undefined });
    const second = skill({
      skillGroupKey: 'ultimate',
      skillId: 'second',
      skillType: 'ultimate',
      costs: [],
      costFrame: undefined,
    });
    const assembly = createAssembly(
      [first, second],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      emitAbilityEvent,
    );

    expect(assembly.tryStartSkill('operator', 'first')).toBe(true);
    assembly.requestPostSkillCast('operator', { skillId: 'second' });
    assembly.advanceFrame();

    expect(emitAbilityEvent.mock.calls).toEqual([
      [
        'operator',
        'beforeCastSkill',
        {
          sourceId: 'operator',
          targetId: 'operator',
          skillType: 'battleSkill',
          skillId: 'first',
          skillCastId: 1,
          skillCastInfo: {
            skillCastId: 1,
            originSkillId: 'first',
            originSkillType: 'battleSkill',
            nonReturnedSpCost: 0,
          },
          attachBuffToCurrentSkill: expect.any(Function),
        },
      ],
      [
        'operator',
        'skillEnd',
        {
          sourceId: 'operator',
          targetId: 'operator',
          skillType: 'battleSkill',
          skillId: 'first',
          skillCastId: 1,
        },
      ],
      [
        'operator',
        'beforeCastSkill',
        {
          sourceId: 'operator',
          targetId: 'operator',
          skillType: 'ultimate',
          skillId: 'second',
          skillCastId: 2,
          skillCastInfo: {
            skillCastId: 2,
            originSkillId: 'second',
            originSkillType: 'ultimate',
            nonReturnedSpCost: 0,
          },
          attachBuffToCurrentSkill: expect.any(Function),
        },
      ],
    ]);
  });

  it('keeps a frame-zero slot change on the current release and selects it next time', () => {
    const base = skill({
      castId: 'ultimate-cast',
      skillGroupKey: 'ultimate',
      skillId: 'ultimate',
      skillType: 'ultimate',
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          endFrame: 1,
          sequence: {
            steps: [
              {
                kind: 'changeSkillSlot',
                parameters: { skillGroupKey: 'ultimate', targetSkillKey: 'arcana' },
              },
            ],
          },
        },
      ],
    });
    const arcana = skill({
      castId: 'ultimate-cast',
      skillGroupKey: 'ultimate',
      skillId: 'arcana',
      skillType: 'ultimate',
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          endFrame: 1,
          sequence: {
            steps: [
              {
                kind: 'changeSkillSlot',
                parameters: { skillGroupKey: 'ultimate', targetSkillKey: 'ultimate' },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly(
      [base, arcana],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      undefined,
      undefined,
      undefined,
      [
        {
          skillGroupKey: 'ultimate',
          baseSkillKey: 'ultimate',
          replacementSkillKeys: ['arcana'],
        },
      ],
    );

    expect(assembly.tryStartSkill('operator', 'ultimate', 'ultimate-cast')).toBe(true);
    expect(
      assembly.receipt.entries.filter(entry => entry.event === 'SkillStarted').at(-1)?.data
        ?.skillId,
    ).toBe('ultimate');
    assembly.advanceFrames(2);

    expect(assembly.tryStartSkill('operator', 'ultimate', 'ultimate-cast')).toBe(true);
    expect(
      assembly.receipt.entries.filter(entry => entry.event === 'SkillStarted').at(-1)?.data
        ?.skillId,
    ).toBe('arcana');
    expect(
      assembly.receipt.entries
        .filter(entry => entry.event === 'SkillSlotChanged')
        .map(entry => [entry.data?.skillGroupKey, entry.data?.targetSkillKey]),
    ).toEqual([
      ['ultimate', 'arcana'],
      ['ultimate', 'ultimate'],
    ]);
  });

  it('installs static entity blackboard values before creating skill runtimes', () => {
    const entityBlackboard = new ActionBlackboard();
    const operatorBuffRuntime = {
      ...emptyEnemyBuffRuntime,
      ownerId: 'operator',
      entityBlackboard,
    };

    createAssembly(
      [skill()],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      () => operatorBuffRuntime,
      testEnemy,
      undefined,
      undefined,
      { EntityBB_form: 1 },
    );

    expect(entityBlackboard.getNumber('EntityBB_form')).toBe(1);
  });

  it('runs logical AbilityEntity spawn steps through the shared scene directory', () => {
    const emitAbilityEvent = vi.fn();
    const program = skill({
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'spawnAbilityEntity',
                parameters: {
                  abilityEntityId: 'fixture_entity',
                  definition: {
                    lifetime: { kind: 'limited', durationSeconds: 5 },
                    childSkill: {
                      nativeSkillType: 'normalSkill' as const,
                      naturalDurationFrames: 30,
                      castResource: {
                        costFrame: 0,
                        cooldownSeconds: 0,
                        maxChargeTime: 1,
                        cost: {
                          resource: 'ultimateEnergy' as const,
                          value: 0,
                          availabilityThreshold: 0,
                        },
                      },
                      skillId: 'fixture_child',
                      initialBlackboard: {},
                      timelineActions: [],
                    },
                  },
                  target: 'enemy',
                  overrideDurationSeconds: { kind: 'constant', value: 2 },
                  saveToContextKey: 'spawned',
                  dieWhenSourceDies: false,
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly({
      ...nativeEventRuntimeOptions(),
      programs: [program],
      emitAbilityEvent,
    });

    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    expect(assembly.abilityEntities.activeCount).toBe(1);
    const [entity] = assembly.abilityEntities.findAll();
    const origin = assembly.abilityEntities.snapshot(entity!).skillCastInfo;
    expect(origin).toMatchObject({ originSkillId: 'skill', originSkillType: 'battleSkill' });
    assembly.abilityEntities.finish(entity!, 'explicit');
    for (const event of ['abilityEntitySpawned', 'abilityEntityFinished']) {
      const published = emitAbilityEvent.mock.calls.find(call => call[1] === event);
      expect(published?.[2].skillCastInfo).toBe(origin);
    }
    expect(assembly.receipt.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'AbilityEntitySpawned',
          sourceId: 'operator',
          data: expect.objectContaining({
            abilityEntityId: 'fixture_entity',
            remainingDurationSeconds: 2,
          }),
        }),
        expect.objectContaining({
          event: 'AbilityEntityChildSkillRequested',
          data: expect.objectContaining({ childSkillId: 'fixture_child' }),
        }),
      ]),
    );
  });

  it('advances a logical AbilityEntity lifetime with its entity time scale', () => {
    const assembly = createAssembly(
      [],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      {
        config: {},
      },
    );
    const entity = assembly.abilityEntities.spawn({
      abilityEntityId: 'fixture_entity',
      definition: { lifetime: { kind: 'limited', durationSeconds: 1 } },
      ownerId: 'operator',
      source: { kind: 'operator', operatorId: 'operator' },
    });
    if (entity.kind !== 'abilityEntity') throw new Error('spawn must return an AbilityEntity');
    assembly.timeDilation!.startEntity({
      entityId: logicalAbilityEntityRuntimeId(entity.instanceId),
      durationSeconds: 10,
      slot: 'Test/TimeSlot1',
      priority: 10,
      curve: () => 0.5,
    });

    assembly.advanceFrames(30);

    const snapshot = assembly.abilityEntities.snapshot(entity);
    expect(snapshot.remainingDurationSeconds).toBeCloseTo(0.5);
    expect(snapshot.elapsedDurationSeconds).toBeCloseTo(0.5);
  });

  it('installs each AbilityEntity passive on spawn and unregisters it when the entity finishes', () => {
    const native = createNativeEventFixture();
    const program = skill({
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'spawnAbilityEntity',
                parameters: {
                  abilityEntityId: 'passive-host',
                  dieWhenSourceDies: false,
                  definition: {
                    lifetime: { kind: 'infinite' },
                    blackboard: { EntityBB_seed: 7 },
                    passiveSkills: [
                      {
                        key: 'entity-passive',
                        initialBlackboard: {},
                        enableSequence: { steps: [] },
                        abilityEventResponses: [
                          {
                            event: 'addedBuff',
                            priority: 0,
                            sequence: {
                              steps: [
                                {
                                  kind: 'changeResource',
                                  parameters: { resource: 'sp', amount: 10, recipient: 'team' },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly({
      programs: [program],
      registerCombatAbilityEvent: native.register,
      registerPassiveAbilityEventAction: (_entityId, event, priority, handle) =>
        native.dispatcher.registerAction(event, priority, published => handle(published)),
    });
    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    const [entity] = assembly.abilityEntities.findAll();
    expect(entity).toBeDefined();
    expect(assembly.abilityEntities.entityBlackboard(entity!).getNumber('EntityBB_seed')).toBe(7);
    const entityState = assembly.stateGraph.instances.abilityEntities.instances.get(
      entity!.instanceId,
    )!;
    const passiveState = entityState.passiveAbilities.get('entity-passive')!;
    expect(passiveState.host.enabled).toBe(true);
    expect(passiveState.host.registrations).toHaveLength(1);
    expect(passiveState.blackboard.entity).toBe(entityState.blackboard);
    native.emitAddedBuff({
      sourceId: 'operator',
      targetId: 'enemy',
      buffId: 'signal',
      buffTags: [],
    });
    expect(assembly.resources.sp).toBe(110);
    assembly.abilityEntities.finish(entity!);
    native.emitAddedBuff({
      sourceId: 'operator',
      targetId: 'enemy',
      buffId: 'signal',
      buffTags: [],
    });
    expect(assembly.resources.sp).toBe(110);
  });

  it('runs an AbilityEntity child timeline on the same entity time scale', () => {
    const program = skill({
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'spawnAbilityEntity',
                parameters: {
                  abilityEntityId: 'fixture_entity',
                  dieWhenSourceDies: false,
                  definition: {
                    lifetime: { kind: 'limited', durationSeconds: 10 },
                    childSkill: {
                      nativeSkillType: 'normalSkill' as const,
                      naturalDurationFrames: 30,
                      castResource: {
                        costFrame: 0,
                        cooldownSeconds: 0,
                        maxChargeTime: 1,
                        cost: {
                          resource: 'ultimateEnergy' as const,
                          value: 0,
                          availabilityThreshold: 0,
                        },
                      },
                      skillId: 'fixture_child',
                      initialBlackboard: {},
                      timelineActions: [
                        {
                          startFrame: 2,
                          sequence: {
                            steps: [
                              {
                                kind: 'changeResource',
                                parameters: { resource: 'sp', amount: 10, recipient: 'team' },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly(
      [program],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      {
        config: {},
      },
    );

    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    const [entity] = assembly.abilityEntities.findAll();
    if (entity?.kind !== 'abilityEntity') throw new Error('spawn must return an AbilityEntity');
    assembly.timeDilation!.startEntity({
      entityId: logicalAbilityEntityRuntimeId(entity.instanceId),
      durationSeconds: 10,
      slot: 'Test/TimeSlot1',
      priority: 10,
      curve: () => 0.5,
    });

    assembly.advanceFrames(3);
    expect(
      assembly.receipt.entries.some(
        entry => entry.event === 'SpChanged' && entry.data?.requestedValue === 10,
      ),
    ).toBe(false);
    assembly.advanceFrame();
    expect(
      assembly.receipt.entries.some(
        entry => entry.event === 'SpChanged' && entry.data?.requestedValue === 10,
      ),
    ).toBe(true);
  });

  it('lets an AbilityEntity child skill launch a projectile through the battle scheduler', () => {
    const program = skill({
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'spawnAbilityEntity',
                parameters: {
                  abilityEntityId: 'projectile-child-host',
                  dieWhenSourceDies: false,
                  definition: {
                    lifetime: { kind: 'limited', durationSeconds: 10 },
                    childSkill: {
                      nativeSkillType: 'normalSkill' as const,
                      naturalDurationFrames: 30,
                      castResource: {
                        costFrame: 0,
                        cooldownSeconds: 0,
                        maxChargeTime: 1,
                        cost: {
                          resource: 'ultimateEnergy' as const,
                          value: 0,
                          availabilityThreshold: 0,
                        },
                      },
                      skillId: 'projectile-child',
                      initialBlackboard: {},
                      timelineActions: [
                        {
                          startFrame: 1,
                          sequence: {
                            steps: [
                              {
                                kind: 'launchProjectile',
                                parameters: { finish: 'firstTickReach' },
                                callbacks: [],
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly([program]);

    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    expect(() => assembly.advanceFrame()).not.toThrow();
    expect(assembly.projectileLifetimes.activeCount).toBe(1);
    assembly.advanceFrames(3);
    expect(assembly.projectileLifetimes.activeCount).toBe(0);
    const launched = assembly.receipt.entries.find(entry => entry.event === 'ProjectileLaunched');
    expect(launched?.subject).toEqual({ kind: 'abilityEntity', instanceId: 2 });
    expect(launched?.producedBy).toEqual({ kind: 'abilityEntity', instanceId: 1 });
  });

  it('lets an AbilityEntity Buff lifecycle finish its owning entity through the shared chain', () => {
    let entityBuffs: CombatBuffContainer<string> | undefined;
    const ownerHpZeroCleanupStates: boolean[] = [];
    const emitAbilityEvent = vi.fn((_entityId, event) => {
      if (event === 'ownerHpZero') {
        ownerHpZeroCleanupStates.push(entityBuffs?.buffs[0]?.isFinished ?? true);
      }
    });
    const createAbilityEntityBuffRuntime = vi.fn(
      (entityId: string, blackboard: ActionBlackboard, target: RuntimeTargetRef) => {
        entityBuffs = new CombatBuffContainer(
          entityId,
          new CombatAttributeSet<string>(),
          undefined,
          null,
          blackboard,
        );
        return new BuffDefinitionOperationTarget(
          entityBuffs,
          {
            get: () => undefined,
            compile: entry => ({
              id: entry.id,
              stackingType: entry.stackingType,
              triggerIntervalSeconds: entry.triggerIntervalSeconds,
              waitFirstTriggerInterval: entry.waitFirstTriggerInterval,
              maxTriggerCount: entry.maxTriggerCount,
            }),
          },
          target,
        );
      },
    );
    const program = skill({
      castId: 'entity-buff-cast',
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'spawnAbilityEntity',
                parameters: {
                  abilityEntityId: 'buff-host',
                  dieWhenSourceDies: false,
                  definition: {
                    lifetime: { kind: 'limited', durationSeconds: 10 },
                    childSkill: {
                      nativeSkillType: 'normalSkill' as const,
                      naturalDurationFrames: 30,
                      castResource: {
                        costFrame: 0,
                        cooldownSeconds: 0,
                        maxChargeTime: 1,
                        cost: {
                          resource: 'ultimateEnergy' as const,
                          value: 0,
                          availabilityThreshold: 0,
                        },
                      },
                      skillId: 'buff-child',
                      initialBlackboard: {},
                      timelineActions: [
                        {
                          startFrame: 0,
                          sequence: {
                            steps: [
                              {
                                kind: 'applyBuff',
                                parameters: {
                                  buffId: 'entity-monitor',
                                  target: 'currentAbilityEntity',
                                  inheritSourceSkillCastInfo: true,
                                  definition: {
                                    stackingType: 'unique',
                                    triggerIntervalSeconds: 1 / 30,
                                    waitFirstTriggerInterval: true,
                                    maxTriggerCount: 1,
                                    lifecycleSequences: {
                                      trigger: {
                                        steps: [
                                          {
                                            kind: 'applyBuff',
                                            parameters: {
                                              buffId: 'entity-trigger-result',
                                              target: 'buffOwner',
                                              inheritSourceSkillCastInfo: true,
                                              definition: { stackingType: 'unique' },
                                            },
                                          },
                                          { kind: 'finishCurrentAbilityEntity', parameters: {} },
                                        ],
                                      },
                                    },
                                  },
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly(
      [program],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      undefined,
      createAbilityEntityBuffRuntime,
      undefined,
      undefined,
      emitAbilityEvent,
    );

    expect(assembly.tryStartSkill('operator', 'skill', 'entity-buff-cast')).toBe(true);
    expect(createAbilityEntityBuffRuntime).toHaveBeenCalledOnce();
    expect(entityBuffs?.buffs.map(buff => buff.definition.id)).toEqual(['entity-monitor']);
    const entityState = [...assembly.stateGraph.instances.abilityEntities.instances.values()][0]!;
    expect(entityState.buffContainerCreated).toBe(true);
    expect(entityState.buffs).toBe(entityBuffs!.runtimeState);
    expect(entityState.buffs!.entityBlackboard).toBe(entityState.blackboard);
    const savedEntity = structuredClone(entityState);
    const monitor = entityBuffs?.buffs[0];
    expect(assembly.abilityEntities.activeCount).toBe(1);
    assembly.advanceFrames(1);
    expect(assembly.abilityEntities.activeCount).toBe(1);
    assembly.advanceFrames(1);
    expect(assembly.abilityEntities.activeCount).toBe(0);
    expect(monitor?.isFinished).toBe(true);
    expect(monitor?.isRecycled).toBe(true);
    expect(entityBuffs?.buffs).toEqual([]);
    expect(ownerHpZeroCleanupStates).toEqual([false]);
    expect(savedEntity.buffs!.instances.size).toBe(1);
    expect(savedEntity.buffs!.entityBlackboard).toBe(savedEntity.blackboard);
    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'AbilityEntityFinished',
        data: expect.objectContaining({ reason: 'explicit' }),
      }),
    );
  });

  it('runs Gilberta generated caster-health monitor through the assembled entity Buff chain', () => {
    let entityBuffs: CombatBuffContainer<string> | undefined;
    const createAbilityEntityBuffRuntime = (
      entityId: string,
      blackboard: ActionBlackboard,
      target: RuntimeTargetRef,
    ) => {
      entityBuffs = new CombatBuffContainer(
        entityId,
        new CombatAttributeSet<string>(),
        undefined,
        null,
        blackboard,
      );
      return new BuffDefinitionOperationTarget(
        entityBuffs,
        {
          get: () => undefined,
          compile: entry => ({
            id: entry.id,
            stackingType: entry.stackingType,
            priority: entry.priority,
            maxStackCount: entry.maxStackCount,
            triggerIntervalSeconds: entry.triggerIntervalSeconds,
            waitFirstTriggerInterval: entry.waitFirstTriggerInterval,
            maxTriggerCount: entry.maxTriggerCount,
          }),
        },
        target,
      );
    };
    const compiled = compileSkill({
      operatorId: 'operator',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 1,
      skill: gilbertaBattleSkill,
      abilityEntityDefinitions: gilbertaGeneratedOperator.abilityEntityDefinitions,
    });
    const spawnAction = compiled.timelineActions.find(action =>
      action.sequence.steps.some(step => step.kind === 'spawnAbilityEntity'),
    );
    if (spawnAction === undefined) throw new Error('Gilberta generated spawn action is missing');
    const castId = 'gilberta-monitor-cast';
    const program: CompiledSkillProgram = {
      ...compiled,
      skillId: 'gilberta-monitor-fixture',
      timelineBlockFrames: 1,
      costFrame: undefined,
      costs: [],
      timelineActions: [{ ...spawnAction, startFrame: 0 }],
    };
    const operatorVitals = new CombatVitals({
      health: 0,
      maxHealth: 100,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const assembly = createAssembly(
      [{ ...program, castId }],
      undefined,
      () => operatorVitals,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      undefined,
      createAbilityEntityBuffRuntime,
      undefined,
      undefined,
      undefined,
      compileOperatorBuffDefinitions(gilbertaGeneratedOperator.buffDefinitions),
    );

    expect(assembly.tryStartSkill('operator', program.skillId, castId)).toBe(true);
    expect(assembly.abilityEntities.activeCount).toBe(1);
    expect(entityBuffs?.buffs.map(buff => buff.definition.id)).toEqual([
      'buff_chr_0013_aglina_normal_skill_monitor',
    ]);
    const monitor = entityBuffs?.buffs[0];
    expect(
      assembly.abilityEntities.notifySourceDied({ kind: 'operator', operatorId: 'operator' }),
    ).toBe(0);
    assembly.advanceFrames(6);

    expect(assembly.abilityEntities.activeCount).toBe(0);
    expect(monitor?.isFinished).toBe(true);
    expect(monitor?.isRecycled).toBe(true);
    expect(entityBuffs?.buffs).toEqual([]);
    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'AbilityEntityFinished',
        // 蓝图未启用 dieWhenSourceDies；实体由监视 Buff 的显式结束动作关闭。
        data: expect.objectContaining({ reason: 'explicit' }),
      }),
    );
  });

  it('resolves owner/entity-id AbilityEntity targets through the assembled time-dilation chain', () => {
    const program = skill({
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'startTimeDilation',
                parameters: {
                  scope: 'entity',
                  durationSeconds: { kind: 'constant', value: 1 },
                  slot: 'Test/TimeSlot1',
                  priority: 10,
                  curve: { kind: 'named', key: 'half' },
                  finishByAction: false,
                  targets: [],
                  abilityEntityTargets: [
                    {
                      kind: 'ownerSpawned',
                      abilityEntityIds: ['marked'],
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly(
      [program],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      {
        config: {
          curves: new Map([['half', () => 0.5]]),
        },
      },
    );
    const markedEntity = assembly.abilityEntities.spawn({
      abilityEntityId: 'marked',
      definition: {
        lifetime: { kind: 'limited', durationSeconds: 2 },
      },
      ownerId: 'operator',
      source: { kind: 'operator', operatorId: 'operator' },
    });
    assembly.abilityEntities.spawn({
      abilityEntityId: 'plain',
      definition: { lifetime: { kind: 'limited', durationSeconds: 2 } },
      ownerId: 'operator',
      source: { kind: 'operator', operatorId: 'operator' },
    });
    if (markedEntity.kind !== 'abilityEntity') throw new Error('spawn must return an entity');

    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);

    expect(assembly.timeDilation!.entityInstances.map(instance => instance.entityId)).toEqual([
      logicalAbilityEntityRuntimeId(markedEntity.instanceId),
    ]);
  });

  it('shares one cooldown ledger across placed casts of the same skill', () => {
    const assembly = createAssembly([
      skill({ castId: 'cast:1', cooldownFrames: 10, costs: [], costFrame: 0 }),
      skill({ castId: 'cast:2', cooldownFrames: 10, costs: [], costFrame: 0 }),
    ]);

    expect(assembly.tryStartSkill('operator', 'skill', 'cast:1')).toBe(true);
    assembly.advanceFrame();
    expect(assembly.tryStartSkill('operator', 'skill', 'cast:2')).toBe(true);

    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'SkillCooldownUnavailableAtStart',
        data: expect.objectContaining({ castId: 'cast:2', skillId: 'skill' }),
      }),
    );
  });

  it('applies a scoped native cooldown multiplier to the shared combo-skill ledger', () => {
    const panel = {
      operatorId: 'operator',
      level: 90,
      attributes: { strength: 0, agility: 0, intellect: 0, will: 0 },
      attack: 1,
      attackBeforeAttributeScalar: 1,
      mainAttribute: 'strength' as const,
      secondaryAttribute: 'agility' as const,
      health: 1,
      defense: 0,
      criticalRate: 0,
      criticalDamage: 0,
      artsIntensity: 0,
      ultimateEnergyGainEfficiency: 1,
      skillCooldownReduction: 0,
      staggerDamagePercent: 0,
      combatModifiers: [
        {
          kind: 'skillCooldownMultiplier' as const,
          skillTypes: 'comboSkill' as const,
          value: 0.85,
        },
      ],
      receipt: [],
    };
    const programs = ['cast:1', 'cast:2', 'cast:3'].map(castId =>
      skill({
        castId,
        skillGroupKey: 'comboSkill',
        skillType: 'comboSkill',
        cooldownFrames: 10,
        costs: [],
        costFrame: 0,
      }),
    );
    const assembly = createAssembly(
      programs,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      panel,
    );

    expect(assembly.tryStartSkill('operator', 'skill', 'cast:1')).toBe(true);
    for (let frame = 0; frame < 8; frame += 1) assembly.advanceFrame();
    expect(assembly.tryStartSkill('operator', 'skill', 'cast:2')).toBe(true);
    assembly.advanceFrame();
    expect(assembly.tryStartSkill('operator', 'skill', 'cast:3')).toBe(true);

    const cooldownEvents = assembly.receipt.entries.filter(entry =>
      entry.event.startsWith('SkillCooldown'),
    );
    expect(cooldownEvents.map(entry => entry.event)).toEqual([
      'SkillCooldownReserved',
      'SkillCooldownUnavailableAtStart',
      'SkillCooldownReady',
      'SkillCooldownReserved',
    ]);
  });

  it('reads the native combo cooldown recovery scalar on every cooldown tick', () => {
    const attributes = new CombatAttributeSet<string>();
    attributes.define('ComboSkillCooldownScalar', 1, {});
    attributes.define('ComboSkillCooldownRecoveryScalar', 2, { minimum: 0 });
    const container = new CombatBuffContainer('operator', attributes);
    const buffRuntime = new BuffDefinitionOperationTarget(container, {
      get: () => undefined,
      compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
    });
    const programs = ['cast:1', 'cast:2', 'cast:3'].map(castId =>
      skill({
        castId,
        skillGroupKey: 'comboSkill',
        skillType: 'comboSkill',
        cooldownFrames: 10,
        costs: [],
        costFrame: 0,
      }),
    );
    const assembly = createAssembly(programs, undefined, undefined, undefined, () => buffRuntime);

    expect(assembly.tryStartSkill('operator', 'skill', 'cast:1')).toBe(true);
    for (let frame = 0; frame < 4; frame += 1) assembly.advanceFrame();
    expect(assembly.tryStartSkill('operator', 'skill', 'cast:2')).toBe(true);
    assembly.advanceFrame();
    expect(assembly.tryStartSkill('operator', 'skill', 'cast:3')).toBe(true);

    expect(
      assembly.receipt.entries
        .filter(entry => entry.event.startsWith('SkillCooldown'))
        .map(entry => entry.event),
    ).toEqual([
      'SkillCooldownReserved',
      'SkillCooldownUnavailableAtStart',
      'SkillCooldownReady',
      'SkillCooldownReserved',
    ]);
  });

  it('inherits normalized cooldown progress when changing a skill slot', () => {
    const base = skill({
      castId: 'battle-cast',
      skillId: 'battleSkill',
      cooldownFrames: 10,
      costs: [],
      costFrame: 0,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'changeSkillSlot',
                parameters: {
                  skillGroupKey: 'battleSkill',
                  targetSkillKey: 'battleSkillEnd',
                  inheritOriginSkillCooldownProgress: true,
                },
              },
            ],
          },
        },
      ],
    });
    const end = skill({
      castId: 'battle-cast',
      skillId: 'battleSkillEnd',
      cooldownFrames: 20,
      costs: [],
      costFrame: 0,
    });
    const assembly = createAssembly(
      [base, end],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      undefined,
      undefined,
      undefined,
      [
        {
          skillGroupKey: 'battleSkill',
          baseSkillKey: 'battleSkill',
          replacementSkillKeys: ['battleSkillEnd'],
        },
      ],
    );

    expect(assembly.tryStartSkill('operator', 'battleSkill', 'battle-cast')).toBe(true);
    assembly.advanceFrames(2);
    expect(
      assembly.receipt.entries.find(entry => entry.event === 'SkillSlotChanged')?.data,
    ).toEqual(
      expect.objectContaining({
        previousSkillKey: 'battleSkill',
        targetSkillKey: 'battleSkillEnd',
        inheritOriginSkillCooldownProgress: true,
        inheritedCooldownProgress: 0,
      }),
    );

    expect(assembly.tryStartSkill('operator', 'battleSkill', 'battle-cast')).toBe(true);
    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'SkillCooldownUnavailableAtStart',
        data: expect.objectContaining({ skillId: 'battleSkillEnd' }),
      }),
    );
  });

  it('技能槽替换的还原数据保存在能力系统中，动作结束后清除登记', () => {
    const base = skill({
      castId: 'cast',
      skillId: 'base',
      costs: [],
      costFrame: 0,
      timelineActions: [
        {
          startFrame: 0,
          endFrame: 3,
          sequence: {
            steps: [
              {
                kind: 'changeSkillSlot',
                parameters: {
                  skillGroupKey: 'battle',
                  targetSkillKey: 'enhanced',
                  lifetime: 'finishByAction',
                  inheritOriginSkillCooldownProgress: true,
                },
              },
            ],
          },
        },
      ],
    });
    const enhanced = skill({ castId: 'cast', skillId: 'enhanced', costs: [], costFrame: 0 });
    const assembly = createAssembly(
      [base, enhanced],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      undefined,
      undefined,
      undefined,
      [{ skillGroupKey: 'battle', baseSkillKey: 'base', replacementSkillKeys: ['enhanced'] }],
    );
    expect(assembly.tryStartSkill('operator', 'base', 'cast')).toBe(true);
    const state = assembly.stateGraph.operators.get('operator')!.ability;
    expect(state.skillSlotReplacements.get('battle')).toEqual({
      registrationId: 0,
      revertedSkillKey: 'base',
      inheritOriginSkillCooldownProgress: true,
    });
    const saved = structuredClone(state);
    assembly.advanceFrames(4);
    expect(state.skillSlotReplacements.size).toBe(0);
    expect(state.skillSlotGroups.get('battle')!.currentSkillKey).toBe('base');
    expect(saved.skillSlotReplacements.size).toBe(1);
    expect(saved.nextSkillSlotReplacementId).toBe(1);
  });

  it('changes an unplaced skill group without fabricating cooldown ledgers', () => {
    const ultimate = skill({
      castId: 'ultimate-cast',
      skillGroupKey: 'ultimate',
      skillId: 'ultimate',
      skillType: 'ultimate',
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'changeSkillSlot',
                parameters: {
                  skillGroupKey: 'comboSkill',
                  targetSkillKey: 'enhancedComboSkill',
                  inheritOriginSkillCooldownProgress: true,
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly(
      [ultimate],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      undefined,
      undefined,
      undefined,
      [
        {
          skillGroupKey: 'comboSkill',
          baseSkillKey: 'comboSkill',
          replacementSkillKeys: ['enhancedComboSkill'],
        },
      ],
    );

    expect(assembly.tryStartSkill('operator', 'ultimate', 'ultimate-cast')).toBe(true);
    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'SkillSlotChanged',
        data: expect.objectContaining({
          skillGroupKey: 'comboSkill',
          previousSkillKey: 'comboSkill',
          targetSkillKey: 'enhancedComboSkill',
          inheritOriginSkillCooldownProgress: true,
        }),
      }),
    );
  });

  it('rejects conflicting cooldown definitions for placed casts of the same skill', () => {
    expect(() =>
      createAssembly([
        skill({ castId: 'cast:1', cooldownFrames: 10, costs: [], costFrame: 0 }),
        skill({ castId: 'cast:2', cooldownFrames: 20, costs: [], costFrame: 0 }),
      ]),
    ).toThrow("skill 'skill' of 'operator' has inconsistent cooldown configuration");

    expect(() =>
      createAssembly([
        skill({ castId: 'cast:1', cooldownFrames: undefined, costs: [], costFrame: 0 }),
        skill({ castId: 'cast:2', cooldownFrames: 20, costs: [], costFrame: 0 }),
      ]),
    ).toThrow("skill 'skill' of 'operator' has inconsistent cooldown configuration");
  });

  it('routes time-dilation clocks without moving later actual-frame inputs', () => {
    const casterDeltas: Array<{ selfScaledDeltaSeconds: number }> = [];
    const otherDeltas: Array<{ selfScaledDeltaSeconds: number }> = [];
    const makeBuffRuntime = (ownerId: string, sink: Array<{ selfScaledDeltaSeconds: number }>) => ({
      ...emptyEnemyBuffRuntime,
      ownerId,
      advanceWithDeltas: (deltas: { selfScaledDeltaSeconds: number }) => sink.push(deltas),
    });
    const freeze = skill({
      operatorId: 'caster',
      skillId: 'freeze',
      castId: 'freeze-cast',
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'startTimeDilation',
                parameters: {
                  scope: 'global',
                  durationSeconds: { kind: 'constant', value: 1 },
                  slot: 'Test/TimeSlot1',
                  priority: 10,
                  curve: { kind: 'named', key: 'half' },
                  finishByAction: false,
                  ignoredTargets: ['controlled'],
                },
              },
            ],
          },
        },
      ],
    });
    const followUp = skill({ operatorId: 'other', skillId: 'follow-up' });
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
        squad: ['caster', 'other'].map(operatorId => ({
          operatorId,
          ultimateEnergy: 0,
          maxUltimateEnergy: 100,
          ultimateEnergyGainMultiplier: 1,
          allowedUltimateEnergyRecoveryTags: null,
        })),
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [
        {
          operatorId: 'caster',
          skills: [freeze],
          buffRuntime: makeBuffRuntime('caster', casterDeltas),
        },
        {
          operatorId: 'other',
          skills: [followUp],
          buffRuntime: makeBuffRuntime('other', otherDeltas),
        },
      ],
      inputs: [{ frame: 1, operatorId: 'other', skillId: 'follow-up' }],
      timeDilation: {
        config: {
          curves: new Map([['half', () => 0.5]]),
        },
      },
      isOperatorControlled: operatorId => operatorId === 'other',
      createOperationExecutor: () => rejectingExecutor,
    });

    expect(assembly.tryStartSkill('caster', 'freeze', 'freeze-cast')).toBe(true);
    expect(
      assembly.receipt.entries.find(entry => entry.event === 'TimeDilationStarted'),
    ).toMatchObject({
      frame: 0,
      sourceId: 'caster',
      data: { kind: 'global', sourceActionId: 'freeze', currentScale: 0.5 },
    });
    assembly.advanceFrame();

    expect(casterDeltas[0]?.selfScaledDeltaSeconds).toBeCloseTo(1 / 60);
    expect(otherDeltas[0]?.selfScaledDeltaSeconds).toBeCloseTo(1 / 30);
    expect(
      assembly.receipt.entries.find(entry => entry.event === 'SkillInputProcessed'),
    ).toMatchObject({
      frame: 1,
      data: { scheduledActualFrame: 1 },
    });

    assembly.advanceFrames(3);

    expect(
      assembly.receipt.entries.find(entry => entry.event === 'SkillOperableBoundaryReached'),
    ).toMatchObject({
      frame: 4,
      sourceId: 'caster',
      data: { castId: 'freeze-cast', durationFrames: 2 },
    });
  });

  it('advances enemy Buff lifetime and periodic triggers with each native clock domain', () => {
    const triggerCounts = new Map([
      ['default', 0],
      ['global', 0],
      ['self', 0],
    ]);
    const definitions = (['default', 'global', 'self'] as const).map(timeClock => ({
      id: `${timeClock}-clock`,
      stackingType: 'unique' as const,
      timeClock,
      durationSeconds: 1 / 30,
      triggerIntervalSeconds: 1 / 60,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      actions: {
        trigger: () => triggerCounts.set(timeClock, triggerCounts.get(timeClock)! + 1),
      },
    }));
    const enemyBuffs = new CombatBuffContainer<string>('enemy', new CombatAttributeSet<string>());
    const enemyBuffRuntime = new BuffDefinitionOperationTarget(enemyBuffs, {
      get: id => definitions.find(definition => definition.id === id),
    });
    for (const definition of definitions) {
      enemyBuffRuntime.apply({
        buffId: definition.id,
        sourceId: 'operator',
        blackboardValues: {},
      });
    }
    const assembly = createAssembly(
      [],
      undefined,
      undefined,
      enemyBuffRuntime,
      undefined,
      undefined,
      {
        config: {},
      },
    );
    assembly.timeDilation!.startGlobal({
      durationSeconds: 1,
      slot: 'Test/TimeSlot1',
      priority: 1,
      constantScale: 0.5,
    });
    assembly.timeDilation!.startEntity({
      entityId: 'enemy',
      durationSeconds: 1,
      slot: 'Test/TimeSlot2',
      priority: 1,
      curve: () => 0.5,
    });

    assembly.advanceFrame();

    expect(enemyBuffs.getCountById('default-clock')).toBe(1);
    expect(enemyBuffs.getCountById('global-clock')).toBe(1);
    expect(enemyBuffs.getCountById('self-clock')).toBe(1);
    expect(Object.fromEntries(triggerCounts)).toEqual({ default: 1, global: 0, self: 0 });

    assembly.advanceFrame();

    expect(enemyBuffs.getCountById('default-clock')).toBe(0);
    expect(enemyBuffs.getCountById('global-clock')).toBe(1);
    expect(enemyBuffs.getCountById('self-clock')).toBe(1);
    expect(Object.fromEntries(triggerCounts)).toEqual({ default: 2, global: 1, self: 1 });

    assembly.advanceFrames(2);
    expect(enemyBuffs.getCountById('global-clock')).toBe(0);
    expect(enemyBuffs.getCountById('self-clock')).toBe(0);
    expect(Object.fromEntries(triggerCounts)).toEqual({ default: 2, global: 2, self: 2 });
  });

  it('installs equipment event handlers and executes their resource sequence', () => {
    const nativeEvents = createNativeEventFixture();
    const initialize = {
      steps: [
        {
          kind: 'modifyActionValue',
          parameters: {
            key: 'gain',
            operation: 'assign',
            value: { kind: 'constant', value: 10 },
          },
        },
      ],
    } as const;
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      registerCombatAbilityEvent: nativeEvents.register,
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
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
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [
        {
          operatorId: 'operator',
          skills: [],
          equipmentContributions: [
            {
              source: { kind: 'weaponTrait', slug: 'fixture-weapon', traitKey: 'skill' },
              selectedLevel: 1,
              modifiers: [],
              eventHandlers: [
                {
                  key: 'gain-sp',
                  event: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
                  condition: { kind: 'combatActive' },
                  sequence: {
                    steps: [
                      {
                        kind: 'changeResourceByActionValue',
                        parameters: {
                          resource: 'sp',
                          amount: { kind: 'blackboard', key: 'gain' },
                          recipient: 'team',
                        },
                      },
                    ],
                  },
                },
              ],
              blackboard: { gain: 1 },
              initializationSequence: initialize,
            },
          ],
          initializationPrograms: [
            { key: 'equipment-fixture', equipmentContributionIndex: 0, sequence: initialize },
          ],
        },
      ],
      createOperationExecutor: () => rejectingExecutor,
      createEquipmentEventOperationExecutor: () => rejectingExecutor,
    });

    nativeEvents.emitOutputDamage({
      sourceId: 'operator',
      tags: ['normalSkill'],
    });

    expect(assembly.resources.sp).toBe(10);
    expect(assembly.receipt.entries.at(-1)).toMatchObject({
      event: 'SpChanged',
      sourceId: 'operator',
      data: {
        skillId: 'equipment:weaponTrait:fixture-weapon:gain-sp',
        actualValue: 10,
      },
    });
  });

  it('配装逐能力启用：自身启动不响应，已启用能力及启用后安装正常响应', () => {
    const native = createNativeEventFixture();
    const observed: string[] = [];
    const sequence = {
      steps: [
        {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: 1,
            recipient: 'team',
          },
        },
      ],
    } as const;
    new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      emitAbilityEvent: (_owner, event, payload) =>
        native.dispatcher.dispatch(
          { event, payload } as import('../events/combatAbilityEvent').CombatAbilityEvent,
          [],
        ),
      registerEquipmentAbilityEventAction: (_owner, event, priority, handle) =>
        native.dispatcher.registerAction(event, priority, published => handle(published)),
      enemy: testEnemy,
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: false,
        normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
        squad: [],
      },
      operators: [
        {
          operatorId: 'operator',
          skills: [],
          equipmentContributions: ['first', 'second'].map(key => ({
            source: { kind: 'weaponTrait', slug: 'fixture', traitKey: key },
            selectedLevel: 1,
            modifiers: [],
            enableSequence: sequence,
            initializationSequence: sequence,
            eventHandlers: [{ key, abilityEvent: 'skillSpGained', sequence: { steps: [] } }],
          })),
          initializationPrograms: ['first', 'second'].map((key, equipmentContributionIndex) => ({
            key,
            equipmentContributionIndex,
            enableSequence: sequence,
            sequence,
          })),
        },
      ],
      createOperationExecutor: () => rejectingExecutor,
      createEquipmentEventOperationExecutor: context => {
        observed.push(context.handlerKey);
        return rejectingExecutor;
      },
    });
    expect(observed).toEqual(['first', 'first', 'first', 'second']);
  });

  it.each(['registration', 'initialization', 'enable'] as const)(
    '配装 %s 失败清理之前所有干员的监听',
    failure => {
      const disposals: string[] = [];
      const eventHandler = {
        key: 'gain',
        abilityEvent: 'skillSpGained',
        sequence: { steps: [] },
      } as const;
      expect(
        () =>
          new CombatRuntimeAssembly({
            ...nativeEventRuntimeOptions(),
            enemy: testEnemy,
            resources: {
              sp: 0,
              maxSp: 300,
              returnedSp: 0,
              sharedSpGain: { baseGainEfficiency: 1 },
              spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
              ultimateEnergySystemUnlocked: false,
              normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
              squad: [],
            },
            enemyBuffRuntime: emptyEnemyBuffRuntime,
            operators: ['first', 'second'].map(operatorId => ({
              operatorId,
              skills: [],
              equipmentContributions: [
                {
                  source: { kind: 'weaponTrait', slug: 'fixture', traitKey: 'skill' },
                  selectedLevel: 1,
                  modifiers: [],
                  eventHandlers: [eventHandler],
                },
              ],
              initializationPrograms: [
                {
                  key: operatorId,
                  equipmentContributionIndex:
                    failure === 'initialization' && operatorId === 'second' ? 99 : 0,
                  ...(failure === 'enable' && operatorId === 'second'
                    ? {
                        enableSequence: {
                          steps: [
                            {
                              kind: 'modifyActionValue' as const,
                              parameters: {
                                key: 'result',
                                operation: 'assign' as const,
                                value: { kind: 'blackboard' as const, key: 'missing-enable-value' },
                              },
                            },
                          ],
                        },
                      }
                    : {}),
                  sequence: { steps: [] },
                },
              ],
            })),
            createOperationExecutor: () => rejectingExecutor,
            createEquipmentEventOperationExecutor: () => rejectingExecutor,
            registerEquipmentAbilityEventAction: operatorId => {
              if (operatorId === 'second' && failure === 'registration')
                throw new Error('registration failed');
              return {
                dispose: () => {
                  disposals.push(operatorId);
                },
              };
            },
          }),
      ).toThrow(
        failure === 'registration'
          ? 'registration failed'
          : failure === 'enable'
            ? /missing-enable-value/
            : "equipment Ability '99' is not active",
      );
      expect(disposals).toEqual(failure === 'registration' ? ['first'] : ['first', 'second']);
    },
  );

  it('requires an explicit terminal executor when equipment events are present', () => {
    expect(
      () =>
        new CombatRuntimeAssembly({
          ...nativeEventRuntimeOptions(),
          enemy: testEnemy,
          resources: {
            sp: 0,
            maxSp: 300,
            returnedSp: 0,
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
            ultimateEnergySystemUnlocked: false,
            normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
            squad: [],
          },
          enemyBuffRuntime: emptyEnemyBuffRuntime,
          operators: [
            {
              operatorId: 'operator',
              skills: [],
              equipmentContributions: [
                {
                  source: { kind: 'gearSet', slug: 'fixture-set' },
                  selectedLevel: 1,
                  modifiers: [],
                  eventHandlers: [
                    {
                      key: 'handler',
                      event: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'team' },
                      sequence: { steps: [] },
                    },
                  ],
                },
              ],
            },
          ],
          createOperationExecutor: () => rejectingExecutor,
        }),
    ).toThrow("operator 'operator' has equipment event handlers but no equipment event executor");
  });

  it('executes inline Buff lifecycle steps through the originating cast operation chain', () => {
    const buffs = new CombatBuffContainer<string>('operator', new CombatAttributeSet<string>());
    const buffRuntime = new BuffDefinitionOperationTarget(buffs, {
      get: () => undefined,
      compile: entry => ({
        id: entry.id,
        stackingType: entry.stackingType,
        durationSeconds: entry.durationSeconds,
      }),
    });
    const program = skill({
      castId: 'cast-1',
      costFrame: undefined,
      costs: [],
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'applyBuff',
                parameters: {
                  buffId: 'resource-buff',
                  target: 'caster',
                  inheritSourceSkillCastInfo: true,
                  definition: {
                    stackingType: 'unique',
                    lifecycleSequences: {
                      start: {
                        steps: [
                          {
                            kind: 'changeResource',
                            parameters: {
                              resource: 'sp',
                              amount: 20,
                              recipient: 'team',
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly(
      [program],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      () => buffRuntime,
    );

    expect(assembly.tryStartSkill('operator', 'skill', 'cast-1')).toBe(true);
    expect(assembly.resources.sp).toBe(120);
    expect(buffs.buffs[0]?.skillCastInfo).toMatchObject({
      originSkillId: 'skill',
      originCastId: 'cast-1',
    });
    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({ event: 'SpChanged', sourceId: 'operator' }),
    );
  });

  it('dispatches a successful Buff application to an active skill listener', () => {
    const nativeEvents = createNativeEventFixture();
    const buffs = new CombatBuffContainer<string>('operator', new CombatAttributeSet<string>());
    const buffRuntime = new BuffDefinitionOperationTarget(
      buffs,
      {
        get: () => undefined,
        compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
      },
      undefined,
      undefined,
      nativeEvents.emitAddedBuff,
    );
    const program = skill({
      costFrame: undefined,
      costs: [],
      timelineActions: [
        {
          startFrame: 0,
          endFrame: 2,
          sequence: {
            steps: [
              {
                kind: 'listenForCombatEvents',
                parameters: {
                  responses: [
                    {
                      key: 'on-added-buff',
                      event: { kind: 'buffApplied' },
                      condition: { kind: 'eventBuffIdMatch', buffIds: ['watched-buff'] },
                      sequence: {
                        steps: [
                          {
                            kind: 'changeResource',
                            parameters: {
                              resource: 'sp',
                              amount: 7,
                              recipient: 'team',
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                kind: 'applyBuff',
                parameters: {
                  buffId: 'watched-buff',
                  target: 'caster',
                  definition: { stackingType: 'unique' },
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly(
      { programs: [program], registerCombatAbilityEvent: nativeEvents.register },
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      () => buffRuntime,
    );

    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    expect(assembly.resources.sp).toBe(107);
  });

  it('keeps passive combat event listeners active after their enable sequence completes', () => {
    const program = skill({
      costFrame: undefined,
      costs: [],
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'changeResource',
                parameters: {
                  resource: 'sp',
                  amount: 10,
                  recipient: 'team',
                  spGainKind: 'gain',
                  spGainSource: 'skill',
                },
              },
            ],
          },
        },
      ],
    });
    const passivePrograms: readonly CompiledOperatorPassiveProgram[] = [
      {
        key: 'skill-sp-listener',
        initialBlackboard: {},
        enableSequence: {
          steps: [
            {
              kind: 'listenForCombatEvents',
              parameters: {
                responses: [
                  {
                    key: 'on-skill-sp',
                    event: { kind: 'spGained', source: 'skill', gainKind: 'gain' },
                    phase: 'dataAction',
                    priority: 0,
                    sequence: {
                      steps: [
                        {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: 9,
                            recipient: 'caster',
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
      },
    ];
    const assembly = createAssembly(
      [program],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      passivePrograms,
    );

    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    expect(assembly.resources.getUltimateEnergy('operator')).toBe(9);
  });

  it('dispatches active airborne output before continuing the authored sequence', () => {
    const program = skill({
      costFrame: undefined,
      costs: [],
      timelineActions: [
        {
          startFrame: 0,
          endFrame: 2,
          sequence: {
            steps: [
              {
                kind: 'listenForCombatEvents',
                parameters: {
                  responses: [
                    {
                      key: 'before-output-airborne',
                      event: { kind: 'airborneOutput' },
                      sequence: {
                        steps: [
                          {
                            kind: 'changeResource',
                            parameters: { resource: 'sp', amount: 9, recipient: 'team' },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              { kind: 'outputAirborne', parameters: { target: 'enemy' } },
              {
                kind: 'changeResource',
                parameters: { resource: 'sp', amount: 1, recipient: 'team' },
              },
            ],
          },
        },
      ],
    });
    const published: string[] = [];
    const native = createNativeEventFixture();
    const assembly = createAssembly({
      programs: [program],
      registerCombatAbilityEvent: native.register,
      emitAbilityEvent: (_owner, event) => published.push(event),
    });

    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    expect(assembly.resources.sp).toBe(110);
    expect(published).toEqual([
      'beforeCastSkill',
      'skillSpGained',
      'afterOutputPhysicalInfliction',
      'skillSpGained',
    ]);
    expect(
      assembly.receipt.entries
        .map(entry => entry.event)
        .filter(event => event === 'AirborneOutput' || event === 'SpChanged'),
    ).toEqual(['AirborneOutput', 'SpChanged', 'SpChanged']);
  });

  it('executes party Buff lifecycle steps relative to each actual operator owner', () => {
    const sourceBuffs = new CombatBuffContainer<string>('source', new CombatAttributeSet<string>());
    const allyBuffs = new CombatBuffContainer<string>('ally', new CombatAttributeSet<string>());
    const createBuffRuntime = (container: CombatBuffContainer<string>) =>
      new BuffDefinitionOperationTarget(container, {
        get: () => undefined,
        compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
      });
    const sourceBuffRuntime = createBuffRuntime(sourceBuffs);
    const allyBuffRuntime = createBuffRuntime(allyBuffs);
    const program = skill({
      operatorId: 'source',
      castId: 'party-cast',
      costFrame: undefined,
      costs: [],
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'applyBuff',
                parameters: {
                  buffId: 'party-owner-buff',
                  target: 'party',
                  inheritSourceSkillCastInfo: true,
                  definition: {
                    stackingType: 'unique',
                    lifecycleSequences: {
                      start: {
                        steps: [
                          {
                            kind: 'changeResource',
                            parameters: {
                              resource: 'ultimateEnergy',
                              amount: 10,
                              recipient: 'caster',
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
        squad: [
          {
            operatorId: 'source',
            ultimateEnergy: 0,
            maxUltimateEnergy: 100,
            ultimateEnergyGainMultiplier: 1,
            allowedUltimateEnergyRecoveryTags: null,
          },
          {
            operatorId: 'ally',
            ultimateEnergy: 0,
            maxUltimateEnergy: 100,
            ultimateEnergyGainMultiplier: 1,
            allowedUltimateEnergyRecoveryTags: null,
          },
        ],
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [
        { operatorId: 'source', skills: [program], buffRuntime: sourceBuffRuntime },
        { operatorId: 'ally', skills: [], buffRuntime: allyBuffRuntime },
      ],
      createOperationExecutor: () => rejectingExecutor,
    });

    expect(assembly.tryStartSkill('source', 'skill', 'party-cast')).toBe(true);
    expect(sourceBuffs.buffs).toHaveLength(1);
    expect(allyBuffs.buffs).toHaveLength(1);
    expect(assembly.resources.snapshot().squad).toEqual([
      expect.objectContaining({ operatorId: 'source', ultimateEnergy: 10 }),
      expect.objectContaining({ operatorId: 'ally', ultimateEnergy: 10 }),
    ]);
    expect(
      assembly.receipt.entries.filter(entry => entry.event === 'UltimateEnergyChanged'),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceId: 'source', targetId: 'source' }),
        expect.objectContaining({ sourceId: 'ally', targetId: 'ally' }),
      ]),
    );
  });

  it.each(['equipment', 'missing-root', 'upgrade'] as const)(
    'initialization child Buff requires its equipment Ability root (%s)',
    owner => {
      const buffs = new CombatBuffContainer<string>('operator', new CombatAttributeSet<string>());
      const buffRuntime = new BuffDefinitionOperationTarget(buffs, {
        get: () => undefined,
        compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
      });
      const configureLifecycle = vi.spyOn(buffRuntime, 'configureLifecycleOperations');
      const sequence = {
        steps: [
          {
            kind: 'applyBuff',
            parameters: {
              buffId: 'equipment-child',
              target: 'caster',
              ...(owner === 'upgrade' ? {} : { source: 'eventSource' as const }),
              asChildBuff: true,
              definition: { stackingType: 'unique' },
            },
          },
        ],
      } as const;
      const create = () =>
        new CombatRuntimeAssembly({
          ...nativeEventRuntimeOptions(),
          enemy: testEnemy,
          resources: {
            sp: 0,
            maxSp: 300,
            returnedSp: 0,
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
            ultimateEnergySystemUnlocked: false,
            normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
            squad: [],
          },
          enemyBuffRuntime: emptyEnemyBuffRuntime,
          operators: [
            {
              operatorId: 'operator',
              skills: [],
              buffRuntime,
              equipmentContributions: [
                {
                  source: { kind: 'weaponTrait', slug: 'fixture', traitKey: 'skill' },
                  selectedLevel: 1,
                  modifiers: [],
                  eventHandlers: [],
                  initializationSequence: sequence,
                },
              ],
              initializationPrograms: [
                {
                  key: 'fixture',
                  sequence,
                  ...(owner === 'upgrade'
                    ? {}
                    : {
                        equipmentContributionIndex: owner === 'equipment' ? 0 : 99,
                      }),
                },
              ],
            },
          ],
          createOperationExecutor: () => rejectingExecutor,
          // Initialization-only Ability must not require an event terminal executor.
        });
      if (owner !== 'equipment') {
        expect(create).toThrow(
          owner === 'upgrade'
            ? 'requires a Buff, Ability, or Skill owner context'
            : "equipment Ability '99' is not active",
        );
        return;
      }
      const assembly = create();
      expect(buffs.buffs).toHaveLength(1);
      const child = buffs.buffs[0]!;
      const equipmentState = assembly.stateGraph.operators.get('operator')!.equipment!;
      expect(equipmentState.contributions.get(0)!.host.enabled).toBe(true);
      expect(equipmentState.contributions.get(0)!.host.childBuffs).toEqual([child.reference]);
      const initializationState = assembly.stateGraph.operators
        .get('operator')!
        .initializations.get('fixture')!;
      expect(initializationState.initializationExecuted).toBe(true);
      expect(initializationState.blackboard).toBe(equipmentState.contributions.get(0)!.blackboard);
      expect(initializationState.operations).toBeDefined();
      expect(child.sourceId).toBe('operator');
      expect(child.isFinished).toBe(false);
      // 无施法来源的装备被动也必须为每个 Buff 分配独立的有状态执行链。
      const resolveOperations = configureLifecycle.mock.calls[0]![0];
      const source = {
        ownerId: child.owner.ownerId,
        sourceId: child.sourceId,
        definitionOwnerId: child.definitionOwnerId,
        sourceActionId: child.sourceActionId,
        skillCastInfo: child.skillCastInfo,
      };
      expect(child.skillCastInfo).toBeNull();
      expect(resolveOperations(source)).not.toBe(resolveOperations(source));
      expect(assembly.receipt.entries).toContainEqual(
        expect.objectContaining({
          event: 'OperatorUpgradeInitialized',
          frame: 0,
        }),
      );
    },
  );

  it('enables compiled passive programs once after Buff runtimes are configured', () => {
    const buffs = new CombatBuffContainer<string>('operator', new CombatAttributeSet<string>());
    const buffRuntime = new BuffDefinitionOperationTarget(buffs, {
      get: () => undefined,
      compile: entry => ({ id: entry.id, stackingType: entry.stackingType }),
    });
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
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
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [
        {
          operatorId: 'operator',
          skills: [],
          buffRuntime,
          initializationPrograms: [
            {
              key: 'potential:potential1',
              sequence: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'potential-marker',
                      target: 'caster',
                      definition: {
                        stackingType: 'unique',
                        blackboard: { ratio: 0.5 },
                      },
                      blackboardAssignments: {
                        ratio: { kind: 'constant', value: 0.5 },
                      },
                    },
                  },
                ],
              },
            },
          ],
          passivePrograms: [
            {
              key: 'talent-aura',
              initialBlackboard: { attackIncrease: 0.2 },
              enableSequence: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'talent-aura',
                      target: 'caster',
                      asChildBuff: true,
                      definition: {
                        stackingType: 'unique',
                        lifecycleSequences: {
                          start: {
                            steps: [
                              {
                                kind: 'changeResource',
                                parameters: {
                                  resource: 'sp',
                                  amount: 20,
                                  recipient: 'team',
                                },
                              },
                            ],
                          },
                        },
                      },
                      blackboardAssignments: {
                        attackIncrease: { kind: 'blackboard', key: 'attackIncrease' },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
      createOperationExecutor: () => rejectingExecutor,
    });

    expect(buffs.buffs).toHaveLength(2);
    expect(buffs.buffs[0]?.sourceActionId).toBe('upgrade-initialization:potential:potential1');
    expect(buffs.buffs[0]?.blackboard.getNumber('ratio')).toBeCloseTo(0.5);
    expect(buffs.buffs[1]?.sourceActionId).toBe('passive:talent-aura');
    expect(buffs.buffs[1]?.blackboard.getNumber('attackIncrease')).toBeCloseTo(0.2);
    const passiveState = assembly.stateGraph.operators
      .get('operator')!
      .passives.get('talent-aura')!;
    expect(passiveState.host.enabled).toBe(true);
    expect(passiveState.blackboard.values.get('attackIncrease')).toBeCloseTo(0.2);
    expect(passiveState.host.childBuffs).toEqual([buffs.buffs[1]!.reference]);
    expect(passiveState.operations).toBeDefined();
    expect(passiveState.enableSequence).not.toBeNull();
    expect(assembly.resources.sp).toBe(20);
    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({ event: 'SpChanged', sourceId: 'operator' }),
    );
    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({
        frame: 0,
        event: 'OperatorUpgradeInitialized',
        sourceId: 'operator',
        data: { key: 'potential:potential1' },
      }),
    );
    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({
        frame: 0,
        event: 'PassiveSkillEnabled',
        sourceId: 'operator',
        data: { passiveKey: 'talent-aura' },
      }),
    );
    assembly.disposePassiveAbilityEvents();
    expect(buffs.buffs[1]?.isFinished).toBe(true);
    expect(buffs.buffs[0]?.isFinished).toBe(false);
    assembly.disposePassiveAbilityEvents();
  });

  it('executes operator upgrade events through the shared Buff runtime', () => {
    const native = createNativeEventFixture();
    const attributes = new CombatAttributeSet<string>();
    attributes.define('Atk', 500, { minimum: 0, maximum: 10000 });
    const buffs = new CombatBuffContainer<string>('operator', attributes);
    const buffRuntime = new BuffDefinitionOperationTarget(buffs, {
      get: () => undefined,
      compile: entry =>
        new CompiledCombatBuffDefinitions('test', [entry], {
          emitElementalInflictionStarted: () => undefined,
        }).get(entry.id)!,
    });
    new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      registerCombatAbilityEvent: native.register,
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
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
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [
        {
          operatorId: 'operator',
          skills: [],
          buffRuntime,
          upgradeEventPrograms: [
            {
              key: 'potential:attackAfterSpGain:0',
              event: { kind: 'spGained' },
              initialBlackboard: {},
              sequence: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'attack-up',
                      target: 'caster',
                      definition: {
                        stackingType: 'enhanceAndRefresh',
                        maxStackCount: 2,
                        durationSeconds: 5,
                        attributeModifiers: [
                          { attribute: 'Atk', slot: 'baseMultiplier', value: 0.2 },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
      createOperationExecutor: () => rejectingExecutor,
    });

    const event = {
      event: 'skillSpGained' as const,
      payload: {
        sourceOperatorId: 'operator',
        source: 'skill' as const,
        gainKind: 'gain' as const,
        requestedAmount: 1,
        amount: 1,
      },
    };
    native.dispatcher.dispatch(event, []);
    expect(attributes.get('Atk')).toBe(600);
    native.dispatcher.dispatch(event, []);
    expect(attributes.get('Atk')).toBe(700);
    expect(buffs.getCountByIds(['attack-up'])).toBe(2);
  });

  it('executes operator upgrade events only for actual skill-source SP gains', () => {
    const native = createNativeEventFixture();
    const attributes = new CombatAttributeSet<string>();
    attributes.define('Atk', 500, { minimum: 0, maximum: 10000 });
    const buffs = new CombatBuffContainer<string>('operator', attributes);
    const buffRuntime = new BuffDefinitionOperationTarget(
      buffs,
      {
        get: () => undefined,
        compile: entry =>
          new CompiledCombatBuffDefinitions('test', [entry], {
            emitElementalInflictionStarted: () => undefined,
          }).get(entry.id)!,
      },
      undefined,
      (event, priority, handle) =>
        native.dispatcher.registerAction(event, priority, published => handle(published)),
    );
    const gainSkill = skill({
      skillId: 'sp-skill',
      costs: [],
      costFrame: undefined,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'changeResource',
                parameters: {
                  resource: 'sp',
                  amount: 20,
                  recipient: 'team',
                  spGainKind: 'gain',
                  spGainSource: 'skill',
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = new CombatRuntimeAssembly({
      registerCombatAbilityEvent: native.register,
      emitAbilityEvent: (_owner, event, payload) =>
        native.dispatcher.dispatch(
          { event, payload } as import('../events/combatAbilityEvent').CombatAbilityEvent,
          [],
        ),
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
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
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [
        {
          operatorId: 'operator',
          skills: [gainSkill],
          buffRuntime,
          initializationPrograms: [
            {
              key: 'skill-sp-buff-listener',
              sequence: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'skill-sp-listener',
                      target: 'caster',
                      definition: {
                        stackingType: 'unique',
                        abilityEventResponses: [
                          {
                            event: 'skillSpGained',
                            priority: 0,
                            sequence: {
                              steps: [
                                {
                                  kind: 'applyBuff',
                                  parameters: {
                                    buffId: 'skill-sp-listener-attack',
                                    target: 'caster',
                                    definition: {
                                      stackingType: 'unique',
                                      attributeModifiers: [
                                        {
                                          attribute: 'Atk',
                                          slot: 'baseMultiplier',
                                          value: 0.1,
                                        },
                                      ],
                                    },
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          ],
          upgradeEventPrograms: [
            {
              key: 'potential:skill-sp-attack:0',
              event: { kind: 'spGained', source: 'skill', gainKind: 'gain' },
              initialBlackboard: {},
              sequence: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'skill-sp-attack',
                      target: 'caster',
                      definition: {
                        stackingType: 'enhanceAndRefresh',
                        maxStackCount: 5,
                        durationSeconds: 10,
                        attributeModifiers: [
                          { attribute: 'Atk', slot: 'baseMultiplier', value: 0.1 },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
      createOperationExecutor: () => rejectingExecutor,
    });

    const operatorState = assembly.stateGraph.operators.get('operator')!;
    expect(operatorState.upgradeEvents?.programs).toEqual([
      expect.objectContaining({ key: 'potential:skill-sp-attack:0' }),
    ]);
    expect(operatorState.upgradeEvents?.programs[0]!.subscriptions.length).toBeGreaterThan(0);
    expect(operatorState.initializations.has('skill-sp-buff-listener')).toBe(true);
    expect(assembly.tryStartSkill('operator', 'sp-skill')).toBe(true);
    assembly.advanceFrame();
    expect(assembly.resources.sp).toBe(20);
    expect(attributes.get('Atk')).toBe(600);
    expect(buffs.getCountByIds(['skill-sp-attack'])).toBe(1);
    expect(buffs.getCountByIds(['skill-sp-listener-attack'])).toBe(1);
  });

  it('opens and consumes the matching combo window without blocking other skills', () => {
    const opener = skill({
      skillId: 'combo-stage-1',
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'openComboWindow',
                parameters: { nextSkillKey: 'combo-stage-2' },
              },
            ],
          },
        },
      ],
    });
    const stage2 = skill({ skillId: 'combo-stage-2', skillType: 'comboSkill' });
    const unrelated = skill({ skillId: 'unrelated' });
    const assembly = createAssembly([opener, stage2, unrelated]);

    expect(assembly.tryStartSkill('operator', 'combo-stage-1')).toBe(true);
    expect(assembly.comboWindows.first?.nextSkillKey).toBe('combo-stage-2');

    expect(assembly.tryStartSkill('operator', 'unrelated')).toBe(true);
    expect(assembly.comboWindows.first?.nextSkillKey).toBe('combo-stage-2');

    expect(assembly.tryStartSkill('operator', 'combo-stage-2')).toBe(true);
    expect(assembly.comboWindows.first).toBeUndefined();
    expect(
      assembly.receipt.entries.some(entry => entry.event === 'ComboWindowUnavailableAtStart'),
    ).toBe(false);
  });

  it('records a diagnostic fact but still starts a combo skill without a window', () => {
    const combo = skill({ skillId: 'comboSkill', skillType: 'comboSkill' });
    const assembly = createAssembly([combo]);

    expect(assembly.tryStartSkill('operator', 'comboSkill')).toBe(true);
    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'ComboWindowUnavailableAtStart',
        sourceId: 'operator',
        data: expect.objectContaining({ skillId: 'comboSkill', reason: 'windowMissing' }),
      }),
    );
  });

  it('does not consume a combo window when a combo-typed skill starts from the battle input', () => {
    const pursuit = skill({
      skillId: 'pursuit',
      skillType: 'comboSkill',
      skillGroupKey: 'battleSkill',
      costs: [],
    });
    const assembly = createAssembly(
      [pursuit],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      testEnemy,
      undefined,
      undefined,
      undefined,
      [{ skillGroupKey: 'battleSkill', baseSkillKey: 'pursuit', replacementSkillKeys: [] }],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' } },
    );

    expect(assembly.tryStartPlayerInput('operator', 'pursuit', undefined, 'battleSkill')).toBe(
      true,
    );
    expect(
      assembly.receipt.entries.filter(entry => entry.event === 'ComboWindowUnavailableAtStart'),
    ).toEqual([]);
  });

  it('advances an environment-created operator Buff runtime as the ability-system owner', () => {
    const advanceFrame = vi.fn();
    const operatorBuffRuntime = {
      ...emptyEnemyBuffRuntime,
      ownerId: 'operator',
      advanceFrame,
    };
    const createOperatorBuffRuntime = vi.fn(() => operatorBuffRuntime);
    const assembly = createAssembly(
      [],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      createOperatorBuffRuntime,
    );

    assembly.advanceFrames(3);
    expect(createOperatorBuffRuntime).toHaveBeenCalledOnce();
    expect(createOperatorBuffRuntime).toHaveBeenCalledWith('operator', undefined, undefined);
    expect(advanceFrame).toHaveBeenCalledTimes(3);
  });

  it('advances the enemy Buff runtime once per combat frame', () => {
    const advanceFrame = vi.fn();
    const assembly = createAssembly([], undefined, undefined, {
      ...emptyEnemyBuffRuntime,
      advanceFrame,
    });

    assembly.advanceFrames(3);
    expect(advanceFrame).toHaveBeenCalledTimes(3);
  });

  it('rejects an enemy Buff runtime with a mismatched owner', () => {
    expect(() =>
      createAssembly([], undefined, undefined, {
        ...emptyEnemyBuffRuntime,
        ownerId: 'operator',
      }),
    ).toThrow("enemy Buff runtime owner must be 'enemy'");
  });

  it('evaluates health conditions against the current combat vitals', () => {
    const enemyVitals = new CombatVitals({
      health: 400,
      maxHealth: 1000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const program = skill({
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'healthCompare',
                    target: 'enemy',
                    valueType: 'ratio',
                    operator: 'less',
                    value: { kind: 'constant', value: 0.5 },
                  },
                },
                whenTrue: {
                  steps: [
                    {
                      kind: 'changeResource',
                      parameters: { resource: 'sp', amount: 20, recipient: 'team' },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly([program], undefined, target => {
      expect(target).toBe('enemy');
      return enemyVitals;
    });

    assembly.tryStartSkill('operator', 'skill');

    expect(assembly.resources.sp).toBe(120);
  });

  it('evaluates rank conditions from the compiled scenario enemy', () => {
    const program = skill({
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: { condition: { kind: 'enemyRankIn', ranks: ['elite', 'boss'] } },
                whenTrue: {
                  steps: [
                    {
                      kind: 'changeResource',
                      parameters: { resource: 'sp', amount: 20, recipient: 'team' },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly(
      [program],
      undefined,
      undefined,
      emptyEnemyBuffRuntime,
      undefined,
      { ...testEnemy, rank: 'elite' },
    );

    assembly.tryStartSkill('operator', 'skill');

    expect(assembly.resources.sp).toBe(120);
  });

  it('routes semantic status actions and conditions through one frame-driven owner', () => {
    const receipt = new CombatReceiptCollector();
    const program = skill({
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'applyStatus',
                parameters: { statusKey: 'ready', target: 'caster' },
              },
              {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'statusActive',
                    statusKey: 'ready',
                    target: 'caster',
                  },
                },
                whenTrue: {
                  steps: [
                    {
                      kind: 'changeResource',
                      parameters: { resource: 'sp', amount: 1, recipient: 'team' },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: false,
        normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
        squad: [],
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [
        {
          operatorId: 'operator',
          skills: [program],
          statusContainer: new CombatStatusContainer('operator', [
            {
              statusKey: 'ready',
              applyStacks: 1,
              maxStacks: 1,
              durationFrames: 2,
              durationStacking: 'refresh',
              consumeStacks: 'all',
            },
          ]),
        },
      ],
      createOperationExecutor: () => rejectingExecutor,
      receipt,
    });

    assembly.tryStartSkill('operator', 'skill');
    expect(assembly.resources.sp).toBe(1);
    assembly.advanceFrames(2);
    expect(
      receipt.entries
        .filter(entry => entry.event === 'StatusChanged')
        .map(entry => entry.data?.reason),
    ).toEqual(['applied', 'expired']);
  });

  it('evaluates caster control conditions from the current simulation frame', () => {
    const isOperatorControlled = vi.fn(() => true);
    const program = skill({
      timelineActions: [
        {
          startFrame: 1,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: { condition: { kind: 'casterControlled' } },
                whenTrue: {
                  steps: [
                    {
                      kind: 'changeResource',
                      parameters: { resource: 'sp', amount: 20, recipient: 'team' },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly([program], isOperatorControlled);

    assembly.tryStartSkill('operator', 'skill');
    assembly.advanceFrame();

    expect(isOperatorControlled).toHaveBeenCalledWith('operator', 1);
    expect(assembly.resources.sp).toBe(21);
  });

  it('rejects caster control conditions when the scenario did not provide control state', () => {
    const program = skill({
      timelineActions: [
        {
          startFrame: 1,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: { condition: { kind: 'casterControlled' } },
                whenTrue: { steps: [] },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly([program]);

    assembly.tryStartSkill('operator', 'skill');

    expect(() => assembly.advanceFrame()).toThrow(
      "skill 'skill' requires the current controlled operator",
    );
  });

  it('runs resource recovery before the skill cost frame and records the result', () => {
    const assembly = createAssembly([skill()]);
    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);

    assembly.advanceFrame();

    expect(assembly.resources.sp).toBe(1);
    expect(assembly.receipt.entries.map(entry => entry.event)).toEqual([
      'SkillStarted',
      'SpChanged',
      'SpChanged',
      'SkillCostApplied',
      'SkillEnded',
    ]);
  });

  it('wraps delegate executors with shared-resource behavior', () => {
    const refundProgram = skill({
      skillId: 'refund',
      costFrame: undefined,
      costs: [],
      timelineActions: [
        {
          startFrame: 1,
          sequence: {
            steps: [
              {
                kind: 'changeResource',
                parameters: {
                  resource: 'sp',
                  amount: 20,
                  recipient: 'team',
                  spGainKind: 'refund',
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = createAssembly([refundProgram]);
    expect(assembly.tryStartSkill('operator', 'refund')).toBe(true);

    assembly.advanceFrame();

    expect(assembly.resources.sp).toBe(121);
    expect(assembly.resources.returnedSp).toBe(20);
    expect(assembly.receipt.entries).toContainEqual(
      expect.objectContaining({ event: 'SpChanged', sourceId: 'operator' }),
    );
  });

  it('rejects mismatched operator ownership instead of silently reparenting skills', () => {
    expect(() => createAssembly([skill({ operatorId: 'other' })])).toThrow(
      "skill 'skill' belongs to 'other', expected 'operator'",
    );
  });

  it('wires enemy buff blackboard reads into the skill operation chain', () => {
    const path = 'buff/status/conduct';
    const enemyBuffs = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet(),
      new GameplayTagRegistry([path]),
    );
    enemyBuffs.add(
      {
        id: 'conduct',
        stackingType: 'unlimited',
        durationSeconds: 1 / 30,
        applyTags: [path],
        blackboard: { count: 4 },
      },
      'operator',
    );
    let observedValue: number | undefined;
    const program = skill({
      costFrame: undefined,
      costs: [],
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'readBuffBlackboard',
                parameters: {
                  target: 'enemy',
                  query: {
                    kind: 'tag',
                    tagQueryType: 'hasAny',
                    buffTags: [path],
                  },
                  desiredKey: 'count',
                  outputKey: 'conductCount',
                },
              },
              {
                kind: 'setContextFlag',
                parameters: { flag: 'observed', value: true, target: 'caster' },
              },
            ],
          },
        },
      ],
    });
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
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
      },
      enemyBuffRuntime: asBuffRuntime(enemyBuffs),
      operators: [{ operatorId: 'operator', skills: [program] }],
      createOperationExecutor: () => ({
        execute: (_step, context) => {
          observedValue = context?.blackboard.getNumber('conductCount');
          return true;
        },
        evaluate: () => false,
      }),
    });

    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    expect(observedValue).toBe(4);
    assembly.advanceFrame();
    expect(enemyBuffs.getCountById('conduct')).toBe(0);
  });

  it('evaluates action blackboard comparisons inside the assembled executor chain', () => {
    let reachedBranch = false;
    const program = skill({
      costFrame: undefined,
      costs: [],
      initialBlackboard: { swordCount: 3 },
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'swordCount' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 3 },
                  },
                },
                whenTrue: {
                  steps: [
                    {
                      kind: 'setContextFlag',
                      parameters: { flag: 'reached', value: true, target: 'caster' },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
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
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [{ operatorId: 'operator', skills: [program] }],
      createOperationExecutor: () => ({
        execute: step => {
          reachedBranch = step.kind === 'setContextFlag';
          return true;
        },
        evaluate: () => false,
      }),
    });

    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    expect(reachedBranch).toBe(true);
  });

  it('shares entity blackboard values between different skills of one operator', () => {
    let reachedBranch = false;
    const writer = skill({
      skillId: 'writer',
      costFrame: undefined,
      costs: [],
      timelineBlockFrames: 1,
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'modifyActionValue',
                parameters: {
                  key: 'EntityBB_SwordNum',
                  operation: 'add',
                  value: { kind: 'constant', value: 1 },
                },
              },
            ],
          },
        },
      ],
    });
    const reader = skill({
      skillId: 'reader',
      costFrame: undefined,
      costs: [],
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'EntityBB_SwordNum' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                whenTrue: {
                  steps: [
                    {
                      kind: 'setContextFlag',
                      parameters: { flag: 'reached', value: true, target: 'caster' },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
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
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [{ operatorId: 'operator', skills: [writer, reader] }],
      createOperationExecutor: () => ({
        execute: step => {
          reachedBranch ||= step.kind === 'setContextFlag';
          return true;
        },
        evaluate: () => false,
      }),
    });

    expect(assembly.tryStartSkill('operator', 'writer')).toBe(true);
    assembly.advanceFrame();
    expect(assembly.tryStartSkill('operator', 'reader')).toBe(true);
    expect(reachedBranch).toBe(true);
  });

  it('uses the same entity blackboard for an operator buff runtime and its skills', () => {
    const casterBuffs = new CombatBuffContainer('operator', new CombatAttributeSet());
    casterBuffs.entityBlackboard.assignDynamic('EntityBB_SwordNum', 4);
    let reachedBranch = false;
    const reader = skill({
      costFrame: undefined,
      costs: [],
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'EntityBB_SwordNum' },
                    operator: 'equal',
                    right: { kind: 'constant', value: 4 },
                  },
                },
                whenTrue: {
                  steps: [
                    {
                      kind: 'setContextFlag',
                      parameters: { flag: 'reached', value: true, target: 'caster' },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
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
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [
        { operatorId: 'operator', skills: [reader], buffRuntime: asBuffRuntime(casterBuffs) },
      ],
      createOperationExecutor: () => ({
        execute: step => {
          reachedBranch ||= step.kind === 'setContextFlag';
          return true;
        },
        evaluate: () => false,
      }),
    });

    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    expect(reachedBranch).toBe(true);
  });

  it('routes party Buff applications to every configured operator runtime', () => {
    const appliedTo: string[] = [];
    const createBuffRuntime = (ownerId: string) => ({
      ownerId,
      advanceFrame: () => undefined,
      apply: () => {
        appliedTo.push(ownerId);
        return true;
      },
      getCountByIds: () => 0,
      finishByIds: () => 0,
      holdByIds: () => ({ release: () => undefined }),
      getCountByTags: () => 0,
      matchesEntityTags: () => false,
      findFirstByIds: () => undefined,
      findFirstByTags: () => undefined,
      finishByTags: () => 0,
    });
    const program = skill({
      operatorId: 'operator-a',
      costFrame: undefined,
      costs: [],
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'applyBuff',
                parameters: { buffId: 'party-buff', target: 'party' },
              },
            ],
          },
        },
      ],
    });
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
        squad: [
          {
            operatorId: 'operator-a',
            ultimateEnergy: 0,
            maxUltimateEnergy: 100,
            ultimateEnergyGainMultiplier: 1,
            allowedUltimateEnergyRecoveryTags: null,
          },
          {
            operatorId: 'operator-b',
            ultimateEnergy: 0,
            maxUltimateEnergy: 100,
            ultimateEnergyGainMultiplier: 1,
            allowedUltimateEnergyRecoveryTags: null,
          },
        ],
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [
        {
          operatorId: 'operator-a',
          skills: [program],
          buffRuntime: createBuffRuntime('operator-a'),
        },
        {
          operatorId: 'operator-b',
          skills: [],
          buffRuntime: createBuffRuntime('operator-b'),
        },
      ],
      createOperationExecutor: () => rejectingExecutor,
    });

    expect(assembly.tryStartSkill('operator-a', 'skill')).toBe(true);
    expect(appliedTo).toEqual(['operator-b', 'operator-a']);
  });

  it.each([
    {
      target: 'casterAndControlledOperator' as const,
      operatorIds: ['operator-a', 'operator-b', 'operator-c'],
      expected: ['operator-a', 'operator-c'],
    },
    {
      target: 'casterAndLowestHealthRatioOperatorExceptCaster' as const,
      operatorIds: ['operator-a', 'operator-b', 'operator-c'],
      expected: ['operator-a', 'operator-b'],
    },
    {
      target: 'casterAndLowestHealthRatioOperatorExceptCaster' as const,
      operatorIds: ['operator-a'],
      expected: ['operator-a'],
    },
  ])(
    'routes the proven teammate collection $target with $operatorIds',
    ({ target, operatorIds, expected }) => {
      const appliedTo: string[] = [];
      const createBuffRuntime = (ownerId: string) => ({
        ownerId,
        advanceFrame: () => undefined,
        apply: () => {
          appliedTo.push(ownerId);
          return true;
        },
        getCountByIds: () => 0,
        finishByIds: () => 0,
        holdByIds: () => ({ release: () => undefined }),
        getCountByTags: () => 0,
        matchesEntityTags: () => false,
        findFirstByIds: () => undefined,
        findFirstByTags: () => undefined,
        finishByTags: () => 0,
      });
      const createVitals = (health: number) =>
        new CombatVitals({
          health,
          maxHealth: 100,
          maxPoise: 0,
          poise: 0,
          poiseRecoveryTime: 0,
          poiseRecoveryTimeMultiplier: 1,
          poiseBrokenEndTime: 0,
          poiseImmune: false,
        });
      const vitals = new Map([
        ['operator-a', createVitals(100)],
        ['operator-b', createVitals(20)],
        ['operator-c', createVitals(80)],
      ]);
      const program = skill({
        operatorId: 'operator-a',
        costFrame: undefined,
        costs: [],
        timelineActions: [
          {
            startFrame: 0,
            sequence: {
              steps: [{ kind: 'applyBuff', parameters: { buffId: 'shield', target } }],
            },
          },
        ],
      });
      const assembly = new CombatRuntimeAssembly({
        ...nativeEventRuntimeOptions(),
        enemy: testEnemy,
        resources: {
          sp: 0,
          maxSp: 300,
          returnedSp: 0,
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
          squad: operatorIds.map(operatorId => ({
            operatorId,
            ultimateEnergy: 0,
            maxUltimateEnergy: 100,
            ultimateEnergyGainMultiplier: 1,
            allowedUltimateEnergyRecoveryTags: null,
          })),
        },
        enemyBuffRuntime: emptyEnemyBuffRuntime,
        operators: operatorIds.map(operatorId => ({
          operatorId,
          skills: operatorId === 'operator-a' ? [program] : [],
          buffRuntime: createBuffRuntime(operatorId),
        })),
        isOperatorControlled:
          target === 'casterAndControlledOperator'
            ? operatorId => operatorId === 'operator-c'
            : undefined,
        resolveOperatorVitals:
          operatorIds.length > 1 ? operatorId => vitals.get(operatorId)! : undefined,
        createOperationExecutor: () => rejectingExecutor,
      });

      expect(assembly.tryStartSkill('operator-a', 'skill')).toBe(true);
      expect(appliedTo).toEqual(expected);
    },
  );

  it('routes caster Buff identity operations to that operator Buff runtime', () => {
    const casterBuffs = new CombatBuffContainer('operator', new CombatAttributeSet());
    const previous = casterBuffs.add({ id: 'sword-trigger', stackingType: 'unique' }, 'operator');
    const program = skill({
      costFrame: undefined,
      costs: [],
      timelineActions: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['sword-trigger'],
                    operator: 'greaterOrEqual',
                    value: 1,
                  },
                },
                whenTrue: {
                  steps: [
                    {
                      kind: 'finishBuffsById',
                      parameters: {
                        target: 'caster',
                        buffIds: ['sword-trigger'],
                        reason: 'other',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      enemy: testEnemy,
      resources: {
        sp: 0,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
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
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [
        { operatorId: 'operator', skills: [program], buffRuntime: asBuffRuntime(casterBuffs) },
      ],
      createOperationExecutor: () => rejectingExecutor,
    });

    expect(assembly.tryStartSkill('operator', 'skill')).toBe(true);
    expect(previous?.finishReason).toBe('other');
  });

  it('processes frame input after recovery and before the skill cost tick', () => {
    const program = skill({ costFrame: 0 });
    const assembly = new CombatRuntimeAssembly({
      ...nativeEventRuntimeOptions(),
      enemy: testEnemy,
      resources: {
        sp: 99,
        maxSp: 300,
        returnedSp: 0,
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecovery: { valuePerSecond: 30, pauseDuration: 1, pauseRemaining: 0 },
        ultimateEnergySystemUnlocked: true,
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
      },
      enemyBuffRuntime: emptyEnemyBuffRuntime,
      operators: [
        {
          operatorId: 'operator',
          skills: [program],
          skillSlotGroups: [
            {
              skillGroupKey: 'battleSkill',
              baseSkillKey: 'skill',
              replacementSkillKeys: [],
            },
          ],
          playerActionRoutes: {
            battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
          },
        },
      ],
      inputs: [{ frame: 1, operatorId: 'operator', skillId: 'skill', action: 'battleSkill' }],
      createOperationExecutor: () => rejectingExecutor,
    });

    assembly.advanceFrame();

    expect(assembly.resources.sp).toBe(0);
    expect(assembly.receipt.entries.map(entry => entry.event)).toEqual([
      'SpChanged',
      'SkillStarted',
      'SpChanged',
      'SkillCostApplied',
      'SkillInputProcessed',
      'SkillEnded',
    ]);
  });
});
