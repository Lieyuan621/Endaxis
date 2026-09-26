import { expect, it, vi } from 'vitest';
import { CombatRuntimeAssembly, type CombatOperatorProgram } from './combatRuntimeAssembly';
import type {
  CompiledSkillProgram,
  ResolvedActionSequence,
  ResolvedSkillBuffDefinition,
} from '../../compiler/combatProgram';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import type {
  ActionGraphNode,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph';
import type { CombatStateGraph } from '../state/combatState';
import { CombatRuntimeSession } from './combatRuntimeSession';
import { StandardPlayerDamageEnvironment } from './standardPlayerDamageEnvironment';
import { CombatVitals } from '../resources/combatVitals';
import { AbilityEntityChildSkillPrograms } from '../abilities/abilityEntityChildSkillPrograms';
import { CombatOperationPrograms } from '../actions/combatOperationPrograms';
import { CombatSkillPrograms } from '../skills/combatSkillPrograms';
import { ProjectileCallbackPrograms } from '../abilities/projectileCallbackPrograms';

const compileGraphEntry = (
  revision: string,
  entry: string | null,
  nodes: Record<string, ActionGraphNode>,
): ResolvedActionSequence => ({
  graph: createActionGraphCompilation({ nodes }, 1, revision).compileAll(),
  entry,
  callSite: revision,
});

const chainEntry = (
  revision: string,
  actions: readonly ActionGraphStep[],
): ResolvedActionSequence => {
  const nodes: Record<string, ActionGraphNode> = {};
  actions.forEach((action, index) => {
    nodes[`step-${index}`] = {
      action,
      next: index + 1 < actions.length ? `step-${index + 1}` : null,
    };
  });
  return compileGraphEntry(revision, actions.length === 0 ? null : 'step-0', nodes);
};

const enemy = {
  source: { kind: 'custom' as const, level: 1 },
  rank: 'mob' as const,
  health: 100,
  superArmor: 0,
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
    knotThresholds: [],
    knotBreakDurationFrames: 0,
    brokenDurationFrames: 0,
    finisherSpRecovery: 0,
  },
};

const resources = {
  sp: 0,
  maxSp: 300,
  returnedSp: 0,
  sharedSpGain: { baseGainEfficiency: 1 },
  spRecovery: { valuePerSecond: 3, pauseDuration: 0, pauseRemaining: 0 },
  ultimateEnergySystemUnlocked: false,
  normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
  squad: [
    {
      operatorId: 'operator',
      ultimateEnergy: 0,
      maxUltimateEnergy: 0,
      ultimateEnergyGainMultiplier: 1,
      allowedUltimateEnergyRecoveryTags: null,
    },
  ],
};

function environmentInput(isOperatorControlled?: (operatorId: string, frame: number) => boolean) {
  return {
    ...(isOperatorControlled === undefined ? {} : { isOperatorControlled }),
    criticalSamples: { nextCriticalSample: () => 1 },
    resolveNonRandomRuntimeSnapshot: () => ({
      runtimeExtensionMultiplier: 1,
      appliesIgniteDamageMultiplier: false,
      appliesPhysicalInflictionDamageMultiplier: false,
    }),
  };
}

function createFixture(
  isOperatorControlled?: (operatorId: string, frame: number) => boolean,
  live = false,
  deferInitialInput = false,
  lazyCasts = false,
  cameraSensitive = false,
  initialControlledOperatorId?: string | null,
) {
  const environment = new StandardPlayerDamageEnvironment({
    ...environmentInput(isOperatorControlled),
    enemyVitals: new CombatVitals({
      health: 100,
      maxHealth: 100,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    }),
  });
  const childPrograms = new AbilityEntityChildSkillPrograms();
  const operationPrograms = new CombatOperationPrograms();
  const skillPrograms = new CombatSkillPrograms();
  const callbackPrograms = new ProjectileCallbackPrograms();
  const skillProgramsInput: CompiledSkillProgram[] = [
    {
      operatorId: 'operator',
      skillGroupKey: 'battleSkill',
      skillId: 'skill',
      skillType: 'battleSkill' as const,
      skillLevel: 1,
      initialBlackboard: {},
      timelineBlockFrames: 0,
      costFrame: undefined,
      costs: [],
      timelineActions: cameraSensitive
        ? [
            {
              startFrame: 2,
              sequence: compileGraphEntry('camera-sensitive-selection', 'branch', {
                branch: {
                  action: {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'cameraToTargetAngleCompare',
                        operator: 'greater',
                        value: { kind: 'constant', value: 0 },
                      },
                    },
                    whenTrue: { $sequence: 'selected-one' },
                    whenFalse: { $sequence: 'selected-two' },
                  },
                  next: null,
                },
                'selected-one': {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'selected',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  next: null,
                },
                'selected-two': {
                  action: {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'selected',
                      operation: 'assign',
                      value: { kind: 'constant', value: 2 },
                    },
                  },
                  next: null,
                },
              }),
            },
          ]
        : [],
    },
    {
      operatorId: 'operator',
      skillGroupKey: 'battleSkill',
      skillId: 'skill',
      skillType: 'battleSkill' as const,
      skillLevel: 1,
      initialBlackboard: {},
      timelineBlockFrames: 0,
      costFrame: undefined,
      costs: [],
      timelineActions: [],
    },
  ];
  const switchCounter: ResolvedSkillBuffDefinition = {
    stackingType: 'unique',
    blackboard: { count: 0 },
    abilityEventResponses: (['ownerSwitchToGuard', 'ownerSwitchToCenter'] as const).map(event => ({
      event,
      priority: 0,
      sequence: chainEntry(`switch-counter-${event}`, [
        {
          kind: 'modifyActionValue',
          parameters: { key: 'count', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
      ]),
    })),
  };
  const operators: CombatOperatorProgram[] = [
    {
      operatorId: 'operator',
      skills: skillProgramsInput.slice(0, 1),
      skillCasts: [
        { castId: 'cast:a', program: skillProgramsInput[0]! },
        { castId: 'cast:b', program: skillProgramsInput[1]! },
      ],
      ...(lazyCasts ? { definitionSkillPrograms: skillProgramsInput.slice(0, 1) } : {}),
      buffDefinitions: { 'switch-counter': switchCounter },
      passivePrograms: [
        {
          key: 'switch-counter',
          initialBlackboard: {},
          enableSequence: chainEntry('switch-counter-enable', [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'switch-counter',
                target: 'caster',
                asChildBuff: true,
              },
            },
          ]),
        },
      ],
    },
  ];
  const inputs = [
    { frame: 0, operatorId: 'operator', skillId: 'skill', castId: 'cast:a' },
    { frame: 4, operatorId: 'operator', skillId: 'skill', castId: 'cast:b' },
  ];
  const externalEvents = [
    {
      frame: 0,
      targetOperatorIds: ['operator'],
      event: { kind: 'comboCooldownControl' as const, mode: 'cooldown' as const },
    },
    {
      frame: 4,
      targetOperatorIds: ['operator'],
      event: { kind: 'comboCooldownControl' as const, mode: 'cooldown' as const },
    },
  ];
  const original = new CombatRuntimeAssembly({
    deferInitialInput,
    ...environment.runtimeOptions,
    ...(isOperatorControlled === undefined ? {} : { isOperatorControlled }),
    resources,
    enemy,
    operators,
    ...(initialControlledOperatorId === undefined ? {} : { initialControlledOperatorId }),
    inputs: live ? [] : inputs,
    abilityEntityChildSkillPrograms: childPrograms,
    combatOperationPrograms: operationPrograms,
    combatSkillPrograms: skillPrograms,
    externalEvents: live ? [] : externalEvents,
  });
  const createRestore =
    (
      candidateInputs = live ? [] : inputs,
      candidateExternalEvents = live ? [] : externalEvents,
      candidateOperators = operators,
    ) =>
    (
      graph: typeof original.stateGraph,
      branchSkillPrograms: CombatSkillPrograms,
      receiptHistory: import('../receipt/combatReceiptHistory').CombatReceiptView,
    ) =>
      CombatRuntimeAssembly.restore({
        receiptHistory,
        graph,
        resources,
        enemy,
        operators: candidateOperators,
        inputs: candidateInputs,
        environment: environmentInput(isOperatorControlled),
        abilityEntityChildSkillPrograms: childPrograms,
        combatOperationPrograms: operationPrograms,
        combatSkillPrograms: branchSkillPrograms,
        projectileCallbackPrograms: callbackPrograms,
        externalEvents: candidateExternalEvents,
      });
  const restore = vi.fn(createRestore());
  return {
    session: new CombatRuntimeSession(original, restore),
    restore,
    createRestore,
    inputs,
    externalEvents,
    operators,
  };
}

it('恢复后群体 GlobalBuff 仍按原生队伍逆序应用子 Buff', () => {
  const childDefinition: ResolvedSkillBuffDefinition = { stackingType: 'unlimited' };
  const operators: CombatOperatorProgram[] = [
    {
      operatorId: 'operator-a',
      skills: [],
      buffDefinitions: { 'party-child': childDefinition },
    },
    { operatorId: 'operator-b', skills: [] },
  ];
  const twoOperatorResources = {
    ...resources,
    squad: operators.map(operator => ({
      operatorId: operator.operatorId,
      ultimateEnergy: 0,
      maxUltimateEnergy: 0,
      ultimateEnergyGainMultiplier: 1,
      allowedUltimateEnergyRecoveryTags: null,
    })),
  };
  const createEnvironment = () =>
    new StandardPlayerDamageEnvironment({
      ...environmentInput(),
      enemyVitals: new CombatVitals({
        health: 100,
        maxHealth: 100,
        maxPoise: 0,
        poise: 0,
        poiseRecoveryTime: 0,
        poiseRecoveryTimeMultiplier: 1,
        poiseBrokenEndTime: 0,
        poiseImmune: false,
      }),
    });
  const environment = createEnvironment();
  const original = new CombatRuntimeAssembly({
    ...environment.runtimeOptions,
    resources: twoOperatorResources,
    enemy,
    operators,
  });
  const saved = structuredClone(original.stateGraph);
  const restored = CombatRuntimeAssembly.restore({
    receiptHistory: original.receipt.history.snapshot(),
    graph: saved,
    resources: twoOperatorResources,
    enemy,
    operators,
    environment: environmentInput(),
    abilityEntityChildSkillPrograms: original.abilityEntityChildSkillPrograms,
    combatOperationPrograms: original.combatOperationPrograms,
    combatSkillPrograms: original.combatSkillPrograms,
    projectileCallbackPrograms: original.projectileLifetimes.callbackPrograms,
  });
  const definition = {
    stackingType: 'unlimited' as const,
    durationSeconds: 1,
    blackboard: {},
    children: [{ buffId: 'party-child', blackboardAssignments: {} }],
  };
  const add = (assembly: CombatRuntimeAssembly) => {
    assembly.globalBuffs.add({
      id: 'party-global',
      definition,
      sourceId: 'operator-a',
      blackboardValues: {},
    });
    return assembly.receipt.entries
      .filter(entry => entry.event === 'BuffApplied')
      .map(entry => entry.targetId);
  };

  expect(add(original)).toEqual(['operator-b', 'operator-a']);
  expect(add(restored)).toEqual(['operator-b', 'operator-a']);
});

it.each([true, false])('未来候选和父分支登记互不污染，候选先运行=%s', candidateFirst => {
  const { session, createRestore, inputs, externalEvents, operators } = createFixture(
    undefined,
    false,
    false,
    true,
  );
  session.advanceFrames(3);
  const checkpoint = session.save();
  const before = session.readState();
  const candidateOperators = operators.map(operator => ({
    ...operator,
    skillCasts: operator.skillCasts?.map(binding =>
      binding.castId === 'cast:b'
        ? { ...binding, program: { ...binding.program, initialBlackboard: { candidateValue: 2 } } }
        : binding,
    ),
  }));
  const trial = session.fork(checkpoint, createRestore(inputs, externalEvents, candidateOperators));
  if (candidateFirst) {
    trial.advanceFrame();
    session.advanceFrame();
  } else {
    session.advanceFrame();
    trial.advanceFrame();
  }
  const candidate = trial.readState();
  expect(
    candidate.operators.get('operator')!.skills.get('skill\u0000cast:b')!.initialBlackboard,
  ).toEqual({ candidateValue: 2 });
  const parent = session.readState();
  expect(
    parent.operators.get('operator')!.skills.get('skill\u0000cast:b')!.initialBlackboard,
  ).toEqual({});
  const candidateCheckpoint = trial.save();
  trial.advanceFrame();
  const continued = trial.readState();
  trial.restore(candidateCheckpoint);
  trial.advanceFrame();
  expect(trial.readState()).toEqual(continued);
  session.restore(checkpoint);
  expect(session.readState()).toEqual(before);
  session.advanceFrame();
  expect(session.readState()).toEqual(parent);
  const changedPast = operators.map(operator => ({
    ...operator,
    skillCasts: operator.skillCasts?.map(binding =>
      binding.castId === 'cast:a'
        ? { ...binding, program: { ...binding.program, initialBlackboard: { candidateValue: 9 } } }
        : binding,
    ),
  }));
  expect(() =>
    session.restore(checkpoint, createRestore(inputs, externalEvents, changedPast)),
  ).toThrow('uses another program');
  expect(session.readState()).toEqual(parent);
});

it('从同一完整帧按 A、B、A 回退，失败候选不替换当前装配', () => {
  const { session, restore, createRestore, inputs, externalEvents } = createFixture();
  session.advanceFrames(3);
  const checkpoint = session.save();

  session.advanceFrames(2);
  const branchA = session.readState();
  expect(branchA.inputs.externalEvents.nextEventIndex).toBe(2);
  expect(branchA.inputs.skills.nextInputIndex).toBe(2);
  expect(
    session
      .readHistory()
      .toArray()
      .filter(entry => entry.event === 'SkillInputProcessed'),
  ).toHaveLength(2);
  expect(() =>
    session.restore(
      checkpoint,
      createRestore([{ ...inputs[0]!, castId: 'cast:b' }, inputs[1]!], externalEvents),
    ),
  ).toThrow('fixed input prefix does not match program');
  expect(session.readState()).toEqual(branchA);
  session.restore(checkpoint, createRestore(inputs.slice(0, 1), externalEvents.slice(0, 1)));
  session.advanceFrames(2);
  const branchB = session.readState();
  expect(branchB.shared.clock.frame).toBe(5);
  expect(branchB.inputs.skills.nextInputIndex).toBe(1);
  expect(branchB.inputs.externalEvents.nextEventIndex).toBe(1);
  expect(branchB).not.toEqual(branchA);

  session.restore(checkpoint);
  session.advanceFrames(2);
  expect(session.readState()).toEqual(branchA);
  expect(session.generation).toBe(2);

  restore.mockImplementationOnce(() => {
    throw new Error('rejected candidate');
  });
  expect(() => session.restore(checkpoint)).toThrow('rejected candidate');
  expect(session.readState()).toEqual(branchA);
  expect(session.generation).toBe(2);
});

it('本帧技能与人工标记随分支回退，空输入帧不读取原切人排程', () => {
  const readControl = vi.fn(() => true);
  const { session } = createFixture(readControl, true);
  const before = session.readState();
  const checkpoint = session.save();
  readControl.mockClear();
  session.advanceInputFrame({
    controlledOperatorId: null,
    skills: [{ operatorId: 'operator', skillId: 'skill', castId: 'cast:a' }],
    externalEvents: [
      {
        targetOperatorIds: ['operator'],
        event: { kind: 'comboCooldownControl', mode: 'cooldown' },
      },
    ],
  });
  const first = session.readState();
  expect(first.inputs.control.get('operator')).toBe(false);
  expect(
    session
      .readHistory()
      .toArray()
      .filter(entry => entry.event === 'SkillInputProcessed'),
  ).toHaveLength(1);
  session.restore(checkpoint);
  expect(session.readState()).toEqual(before);
  session.advanceInputFrame({});
  const second = session.readState();
  expect(second.inputs.control.get('operator')).toBe(true);
  expect(
    session
      .readHistory()
      .toArray()
      .some(entry => entry.event === 'SkillInputProcessed'),
  ).toBe(false);
  expect(readControl).not.toHaveBeenCalled();
});

it('逐帧会话的连续空帧与分叉都保持已提交的切人结果', () => {
  const readControl = vi.fn(() => true);
  const { session } = createFixture(readControl, true);
  session.advanceInputFrame({ controlledOperatorId: null });
  const checkpoint = session.save();
  const branch = session.fork(checkpoint);
  readControl.mockClear();
  branch.advanceFrames(2);
  session.advanceFrames(2);
  expect(branch.readState()).toEqual(session.readState());
  expect(session.readState().inputs.control.get('operator')).toBe(false);
  expect(readControl).not.toHaveBeenCalled();
});

it('开场输入前保存，原帧试放、回退换技能，不额外推进时间或资源', () => {
  const { session } = createFixture(undefined, true, true);
  const initial = session.readState();
  const checkpoint = session.save();
  const input = {
    skills: [{ operatorId: 'operator', skillId: 'skill', castId: 'cast:a' }],
    externalEvents: [
      {
        targetOperatorIds: ['operator'],
        event: { kind: 'comboCooldownControl' as const, mode: 'cooldown' as const },
      },
    ],
  };
  expect(initial.inputs.initialInputPending).toBe(true);
  session.applyInitialInput(input);
  const first = session.readState();
  expect(first.inputs.initialInputPending).toBe(false);
  expect(first.shared.clock).toEqual(initial.shared.clock);
  expect(first.shared.resources).toEqual(initial.shared.resources);
  const processed = session
    .readHistory()
    .toArray()
    .filter(entry => entry.event === 'SkillInputProcessed');
  expect(processed).toHaveLength(1);
  expect(processed[0]).toMatchObject({ frame: 0, data: { castId: 'cast:a', accepted: true } });
  expect(() => session.applyInitialInput(input)).toThrow('already been applied');
  session.restore(checkpoint);
  expect(session.readState()).toEqual(initial);
  session.applyInitialInput({
    skills: [{ operatorId: 'operator', skillId: 'skill', castId: 'cast:b' }],
  });
  expect(session.frame).toBe(0);
  expect(
    session
      .readHistory()
      .toArray()
      .filter(entry => entry.event === 'SkillInputProcessed'),
  ).toEqual([
    expect.objectContaining({ frame: 0, data: expect.objectContaining({ castId: 'cast:b' }) }),
  ]);
  session.restore(checkpoint);
  session.applyInitialInput(input);
  expect(session.readState()).toEqual(first);
});

it('开场未提交时不能跨过输入边界，空输入提交后才开始正常回能', () => {
  const { session } = createFixture(undefined, true, true);
  const checkpoint = session.save();
  const initial = session.readState();
  expect(() => session.advanceFrame()).toThrow('apply initial combat input');
  expect(session.frame).toBe(0);
  session.restore(checkpoint);
  const branch = session.fork(checkpoint);
  branch.applyInitialInput({});
  expect(branch.readState().shared).toEqual(initial.shared);
  branch.advanceFrame();
  expect(branch.frame).toBe(1);
  expect(branch.readState().shared.resources).not.toEqual(initial.shared.resources);
  expect(session.readState()).toEqual(initial);
});

it('镜头夹角条件在截面恢复后仍按零度计算', () => {
  const { session } = createFixture(undefined, true, true, false, true);
  const before = session.save();
  session.applyInitialInput({
    skills: [{ operatorId: 'operator', skillId: 'skill', castId: 'cast:a' }],
  });
  const submitted = session.save();
  const selected = () =>
    session
      .readState()
      .operators.get('operator')!
      .skills.get('skill\u0000cast:a')!
      .blackboard.values.get('selected');
  session.advanceFrames(2);
  expect(selected()).toBe(2);
  const first = session.readState();
  session.restore(submitted);
  session.advanceFrames(2);
  expect(session.readState()).toEqual(first);
  session.restore(before);
  session.applyInitialInput({
    skills: [{ operatorId: 'operator', skillId: 'skill', castId: 'cast:a' }],
  });
  session.advanceFrames(2);
  expect(selected()).toBe(2);
});

it('未预编译的施放身份复用定义，活动截面可恢复且试放不污染父分支', () => {
  const { session } = createFixture(undefined, true, true, true, true);
  const initial = session.readState();
  const before = session.save();
  const trial = session.fork(before);
  trial.applyInitialInput({
    skills: [
      {
        operatorId: 'operator',
        skillId: 'skill',
        castId: 'live:first',
      },
    ],
  });
  const active = trial.save();
  expect(
    trial.readState().operators.get('operator')!.skills.get('skill\u0000live:first')!.castId,
  ).toBe('live:first');
  trial.advanceFrames(2);
  const completed = trial.readState();
  expect(
    completed.operators
      .get('operator')!
      .skills.get('skill\u0000live:first')!
      .blackboard.values.get('selected'),
  ).toBe(2);
  trial.restore(active);
  trial.advanceFrames(2);
  expect(trial.readState()).toEqual(completed);
  expect(session.readState()).toEqual(initial);
  session.applyInitialInput({
    skills: [
      {
        operatorId: 'operator',
        skillId: 'skill',
        castId: 'live:second',
      },
    ],
  });
  session.advanceFrames(2);
  expect(session.readState().operators.get('operator')!.skills.has('skill\u0000live:first')).toBe(
    false,
  );
  expect(
    session
      .readState()
      .operators.get('operator')!
      .skills.get('skill\u0000live:second')!
      .blackboard.values.get('selected'),
  ).toBe(2);
  session.restore(before);
  expect(session.readState()).toEqual(initial);
});

it('截面复制不包含回执历史，恢复和分叉保留原事实对象', () => {
  const { session } = createFixture();
  session.advanceFrames(3);
  const history = session.readHistory();
  expect(history.length).toBeGreaterThan(0);
  const clone = vi.spyOn(globalThis, 'structuredClone');
  try {
    const saved = session.save();
    const branch = session.fork(saved);
    expect(branch.readHistory()).toBe(history);
    expect(branch.readHistory().get(0)).toBe(history.get(0));
    expect(clone.mock.calls.length).toBeGreaterThan(0);
    for (const [graph] of clone.mock.calls) {
      if (graph !== null && typeof graph === 'object' && 'shared' in graph)
        expect(graph.shared).not.toHaveProperty('receipts');
    }
    branch.advanceFrames(2);
    expect(branch.readHistory().length).toBeGreaterThan(history.length);
    expect(session.readHistory()).toBe(history);
    session.restore(saved);
    expect(session.readHistory()).toBe(history);
  } finally {
    clone.mockRestore();
  }
});

it('按游标筛选回执返回不可变事实，回退后旧游标失效', () => {
  const { session } = createFixture(undefined, true, true);
  const before = session.save();
  const cursor = session.readReceipts().cursor;
  session.applyInitialInput({
    skills: [{ operatorId: 'operator', skillId: 'skill', castId: 'cast:a' }],
  });
  const selected = session.readReceipts(cursor, new Set(['SkillInputProcessed']));
  expect(selected.entries).toHaveLength(1);
  expect(selected.entries[0]).toMatchObject({ data: { accepted: true } });
  expect(Reflect.set(selected.entries[0]!.data!, 'accepted', false)).toBe(false);
  expect(
    session.readReceipts(cursor, new Set(['SkillInputProcessed'])).entries[0]!.data!.accepted,
  ).toBe(true);
  expect(session.readReceipts(selected.cursor).entries).toEqual([]);
  session.restore(before);
  expect(() => session.readReceipts(selected.cursor)).toThrow('another history branch');
});

it('首帧人工切换在被动初始化后执行，排程和逐帧入口都通知一次', () => {
  const scheduled = createFixture(() => false, false, false, false, false, 'operator').session;
  const live = createFixture(() => false, true, true, false, false, 'operator').session;
  const count = (session: CombatRuntimeSession) =>
    [...session.readState().operators.get('operator')!.buffs!.instances.values()]
      .find(buff => buff.identity.definitionId === 'switch-counter')!
      .blackboard.values.get('count');
  expect(count(live)).toBe(0);
  live.applyInitialInput({ controlledOperatorId: null });
  expect(count(live)).toBe(1);
  expect(count(scheduled)).toBe(1);
  expect(live.readState().inputs.control).toEqual(scheduled.readState().inputs.control);
});

it('拒绝其他会话的检查点和非法推进数量', () => {
  const first = createFixture().session;
  const second = createFixture().session;
  expect(() => second.restore(first.save())).toThrow('does not belong');
  expect(() => first.advanceFrames(-1)).toThrow('non-negative safe integer');
});

it('拒绝在完整排程里混入逐帧输入，回退后原排程仍可推进', () => {
  const { session } = createFixture();
  const checkpoint = session.save();
  const frame = session.frame;
  expect(() => session.advanceInputFrame({})).toThrow('without scheduled inputs');
  expect(session.frame).toBe(frame);
  session.restore(checkpoint);
  session.advanceFrames(4);
  expect(session.readState().inputs.skills.nextInputIndex).toBe(2);
});

it('保存切人前后的身份，恢复不通知，续跑按原阶段发布切后台和切回事件', () => {
  const switchCount = (graph: CombatStateGraph) =>
    [...graph.operators.get('operator')!.buffs!.instances.values()]
      .find(buff => buff.identity.definitionId === 'switch-counter')!
      .blackboard.values.get('count');
  const readControl = vi.fn((_operatorId: string, frame: number) => frame < 4 || frame >= 5);
  const { session } = createFixture(readControl);
  session.advanceFrames(3);
  const checkpoint = session.save();
  const before = session.readState();
  readControl.mockClear();
  const trial = session.fork(checkpoint);
  expect(trial.readState()).toEqual(before);
  expect(readControl).not.toHaveBeenCalled();
  trial.advanceFrame();
  expect(readControl.mock.calls).toEqual([['operator', 4]]);
  const atGuard = trial.readState();
  expect(atGuard.inputs.control.get('operator')).toBe(false);
  expect(switchCount(atGuard)).toBe(1);
  expect(session.readState()).toEqual(before);
  const guardCheckpoint = trial.save();
  trial.advanceFrame();
  const returned = trial.readState();
  expect(returned.inputs.control.get('operator')).toBe(true);
  expect(switchCount(returned)).toBe(2);
  trial.restore(guardCheckpoint);
  expect(trial.readState()).toEqual(atGuard);
  trial.advanceFrame();
  expect(trial.readState()).toEqual(returned);
  session.advanceFrames(2);
  expect(session.readState()).toEqual(returned);
});

it('试探分支独立推进，显式丢弃检查点后不再保留历史入口', () => {
  const { session, createRestore, inputs, externalEvents } = createFixture();
  session.advanceFrames(3);
  const checkpoint = session.save();
  const parent = session.readState();

  const trial = session.fork(
    checkpoint,
    createRestore(inputs.slice(0, 1), externalEvents.slice(0, 1)),
  );
  trial.advanceFrames(2);
  expect(trial.frame).toBe(5);
  expect(trial.readState().inputs.skills.nextInputIndex).toBe(1);
  expect(session.readState()).toEqual(parent);
  expect(session.frame).toBe(3);

  session.discardCheckpoint(checkpoint);
  expect(() => session.restore(checkpoint)).toThrow('does not belong');
  expect(() => session.fork(checkpoint)).toThrow('does not belong');
});
