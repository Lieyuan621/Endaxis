import { bindProjectileCallbackLifecycle } from './projectileCallbackRuntime';
import { createTestBuffReference } from '../buffs/buffTestFixtures';
import { describe, expect, it } from 'vitest';
import type { ResolvedActionSequence } from '../../compiler/combatProgram';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import type {
  ActionGraphDefinition,
  ActionGraphNode,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { COMBAT_FRAME_INTERVAL } from '../time/combatClock';
import { ProjectileLifecycleRuntime } from './projectileLifecycleRuntime';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { createCallbackSkillHostFactory, type CallbackSkillHostFactory } from './callbackSkillHost';
import { CombatClock } from '../time/combatClock';
import { CombatReceiptCollector } from '../receipt/combatReceipt';

const compileGraphEntry = (
  revision: string,
  entry: string | null,
  nodes: ActionGraphDefinition['nodes'],
): ResolvedActionSequence => ({
  graph: createActionGraphCompilation({ nodes }, 1, revision).compileAll(),
  entry,
  callSite: revision,
});

const chainSequence = (
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

// Each isolated fixture advances its clock after the Battle pass, as CombatSimulation does.
const createTestHost: CallbackSkillHostFactory = (program, context, operations) => {
  const clock = new CombatClock();
  const create = createCallbackSkillHostFactory({
    clock,
    receipt: new CombatReceiptCollector(),
    definitionOperatorId: 'source',
    allocateSkillCastId: () => 1,
  });
  const host = create(
    program,
    {
      ...context,
      actionOwnerAbilityEntity: context.actionOwnerAbilityEntity ?? {
        kind: 'abilityEntity',
        instanceId: 1,
      },
      skillCastInfo: context.skillCastInfo ?? {
        skillCastId: 42,
        originSkillId: 'source',
        originSkillType: 'comboSkill',
        nonReturnedSpCost: 0,
      },
    },
    operations,
  );
  return {
    ...host,
    advance: delta => {
      host.advance(delta);
      clock.advanceFrame();
    },
  };
};

const zeroCastResource = {
  costFrame: 0,
  cooldownSeconds: 0,
  maxChargeTime: 1,
  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
} as const;

const probe = {
  kind: 'setContextFlag',
  parameters: { flag: 'probe', value: true, target: 'caster' },
} as const;

const delayedProbeNodes = (): ActionGraphDefinition['nodes'] => ({
  launch: {
    action: {
      kind: 'withActionBlackboardScope',
      parameters: {
        scopeKey: 'projectile',
        lifetime: 'execution',
        initialValues: {},
        inheritParent: true,
        entityInitialValues: { EntityBB_seed: 4 },
        entityAssignments: {
          EntityBB_snapshot: { kind: 'blackboard', key: 'launchValue' },
          EntityBB_sourceSnapshot: { kind: 'blackboard', key: 'EntityBB_source', fallback: 0 },
        },
      },
      body: { $sequence: 'schedule' },
    },
    next: null,
  },
  schedule: {
    action: {
      kind: 'launchProjectile',
      parameters: { finish: 3, recycleDelaySeconds: 0 },
      callbacks: [
        {
          event: 'finish',
          skill: {
            skillId: 'callback',
            nativeSkillType: 'normalSkill',
            naturalDurationFrames: 1,
            castResource: zeroCastResource,
            blackboard: {},
            scheduledSequences: [
              {
                startFrame: 0,
                endFrame: 0,
                sequence: { $sequence: 'callback-scope' },
              },
            ],
            actionGraph: {
              main: {
                nodes: {
                  'callback-scope': {
                    action: {
                      kind: 'withActionBlackboardScope',
                      parameters: {
                        scopeKey: 'callback',
                        lifetime: 'execution',
                        initialValues: { local: 2 },
                        inheritParent: true,
                      },
                      body: { $sequence: 'probe' },
                    },
                    next: null,
                  },
                  probe: {
                    action: probe,
                    next: null,
                  },
                },
              },
              macros: {},
            },
          },
        },
      ],
    },
    next: null,
  },
});

const delayedProbeEntry = compileGraphEntry('delayed-probe', 'launch', delayedProbeNodes());

function delayedProbe(): ResolvedActionSequence {
  return delayedProbeEntry;
}

describe('projectile callback action lifecycle', () => {
  it('投射物目录保存命中前输入和命中后宿主，旧切面保持未命中', () => {
    const projectiles = new ProjectileLifecycleRuntime();
    const runtime = new CombatActionSequenceRuntime(
      { execute: () => true, evaluate: () => true },
      {
        blackboard: new ActionBlackboard({ launchValue: 7 }),
        skillCastInfo: {
          skillCastId: 42,
          originSkillId: 'source',
          originSkillType: 'comboSkill',
          nonReturnedSpCost: 0,
        },
        createCallbackSkillHost: createTestHost,
        launchProjectile: request =>
          projectiles.launch({
            finishDelaySeconds: request.finish,
            recycleDelaySeconds: request.recycleDelaySeconds,
            callbacks: request.callbacks.map(c => c.runtime.runtimeState),
            callbackPrograms: request.callbacks.map(c => c.program),
            firstTickHit: request.hit,
            ...bindProjectileCallbackLifecycle(
              request.callbacks.map(c => c.runtime),
              () => 1,
            ),
          }),
      },
      undefined,
      undefined,
      'source',
    );
    runtime.createSequence(delayedProbe()).executeInstant({});
    const data = [...projectiles.runtimeState.instances.values()][0]!.callbacks[0]!;
    expect(data.skillId).toBe('callback');
    expect(projectiles.callbackPrograms.resolve(data.programId!).skillId).toBe('callback');
    expect(data.skillCastInfo?.skillCastId).toBe(42);
    expect(data.host).toBeNull();
    expect(ActionBlackboard.bindRuntimeState(data.blackboard).snapshot().launchValue).toBe(7);
    const saved = structuredClone(projectiles.runtimeState);
    projectiles.advanceFrame();
    projectiles.advanceFrame();
    projectiles.advanceFrame();
    expect(data.host).not.toBeNull();
    expect([...saved.instances.values()][0]!.callbacks[0]!.host).toBeNull();
  });

  it('uses the same synchronous out-of-duration jump cleanup as an ordinary skill', () => {
    const trace: string[] = [];
    const context = { blackboard: new ActionBlackboard() };
    const execution = new CombatActionSequenceRuntime(
      {
        evaluate: () => true,
        execute: () => {
          trace.push('start');
          return true;
        },
        end: (_step, context) => {
          trace.push('end');
          context!.requestTimelineJump!(2);
        },
      },
      context,
    );
    const callback = createTestHost(
      {
        skillId: 'callback',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 5,
        castResource: zeroCastResource,
        initialBlackboard: {},
        timelineActions: [
          { startFrame: 0, endFrame: 20, sequence: chainSequence('callback-probe', [probe]) },
          {
            startFrame: 1,
            endFrame: 2,
            sequence: chainSequence('callback-jump', [
              { kind: 'jumpTimeline', parameters: { destinationFrame: 6 } },
              probe,
            ]),
          },
        ],
      },
      context,
      execution.operations,
    );
    callback.start();
    callback.advance(COMBAT_FRAME_INTERVAL);
    callback.advance(COMBAT_FRAME_INTERVAL);
    expect(trace).toEqual(['start', 'end']);
    callback.advance(10);
    callback.end();
    expect(trace).toEqual(['start', 'end']);
  });

  it('ends active intervals once and never starts pending intervals after reset cleanup', () => {
    const trace: string[] = [];
    const context = { blackboard: new ActionBlackboard() };
    const execution = new CombatActionSequenceRuntime(
      {
        evaluate: () => true,
        execute: step => {
          if (step.kind === 'setContextFlag') trace.push(`start:${step.parameters.flag}`);
          return true;
        },
        end: step => {
          if (step.kind === 'setContextFlag') trace.push(`end:${step.parameters.flag}`);
        },
      },
      context,
    );
    const callback = createTestHost(
      {
        skillId: 'callback',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 100,
        castResource: zeroCastResource,
        initialBlackboard: {},
        timelineActions: [
          { startFrame: 0, endFrame: 10, sequence: chainSequence('callback-probe-late', [probe]) },
          {
            startFrame: 5,
            endFrame: 10,
            sequence: chainSequence('callback-late', [
              { ...probe, parameters: { ...probe.parameters, flag: 'late' } },
            ]),
          },
        ],
      },
      context,
      execution.operations,
    );
    callback.start();
    callback.advance(COMBAT_FRAME_INTERVAL);
    callback.end();
    callback.advance(10);
    callback.end();
    expect(trace).toEqual(['start:probe', 'end:probe']);
  });

  it('compiles and runs independent callback intervals on one detached direct board until natural end', () => {
    const scheduler = new ProjectileLifecycleRuntime();
    const trace: string[] = [];
    let frame = 0;
    let componentDelta = 1;
    const source = new ActionBlackboard({ seed: 7 });
    const runtime = new CombatActionSequenceRuntime(
      {
        evaluate: () => true,
        execute: (step, context) => {
          if (step.kind !== 'setContextFlag') throw new Error('unexpected fixture step');
          trace.push(
            `${frame}:start:${step.parameters.flag}:${context!.blackboard.getNumber('value')}`,
          );
          expect(context!.blackboard.getNumber('seed')).toBe(7);
          expect(context!.skillCastInfo?.skillCastId).toBe(42);
          expect(context!.actionOwnerId).toBe('ability-entity:1');
          expect(context!.actionSourceId).toBe('source');
          expect(context!.actionOwnerAbilityEntity).toEqual({
            kind: 'abilityEntity',
            instanceId: 1,
          });
          if (step.parameters.flag === 'write') {
            context!.blackboard.assignDynamic('value', 2);
            context!.attachBuffToCurrentSkill!({
              isRecycled: false,
              reference: createTestBuffReference(),
              finish: (reason, source) => {
                expect([reason, source]).toEqual(['other', null]);
                trace.push(`${frame}:attached-end`);
                return true;
              },
            });
          }
          return true;
        },
        end: step => {
          if (step.kind === 'setContextFlag') trace.push(`${frame}:end:${step.parameters.flag}`);
        },
      },
      {
        blackboard: source,
        skillCastInfo: {
          skillCastId: 42,
          originSkillId: 'source',
          originSkillType: 'comboSkill',
          nonReturnedSpCost: 0,
        },
        createCallbackSkillHost: createTestHost,
        launchProjectile: request => {
          const projectile = scheduler.launch({
            finishDelaySeconds: request.finish,
            recycleDelaySeconds: request.recycleDelaySeconds,
            callbacks: request.callbacks.map(c => c.runtime.runtimeState),
            callbackPrograms: request.callbacks.map(c => c.program),
            firstTickHit: request.hit,
            ...bindProjectileCallbackLifecycle(
              request.callbacks.map(c => c.runtime),
              () => componentDelta,
            ),
          });
          projectile.onReset(() => trace.push(`${frame}:reset`));
          return projectile;
        },
      },
      undefined,
      undefined,
      'source',
    );
    const parent = runtime.createSequence(
      compileGraphEntry('fixture-callback-intervals', 'launch', {
        launch: {
          action: {
            kind: 'launchProjectile',
            parameters: { finish: 1, recycleDelaySeconds: 100 },
            callbacks: [
              {
                event: 'finish',
                skill: {
                  skillId: 'callback',
                  nativeSkillType: 'normalSkill',
                  naturalDurationFrames: 3,
                  castResource: {
                    costFrame: 0,
                    cooldownSeconds: 0,
                    maxChargeTime: 1,
                    cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                  },
                  blackboard: { value: 1 },
                  scheduledSequences: [
                    {
                      startFrame: 0,
                      endFrame: 1,
                      sequence: { $sequence: 'write' },
                    },
                    {
                      startFrame: 0,
                      endFrame: 3,
                      sequence: { $sequence: 'long' },
                    },
                    {
                      startFrame: 2,
                      endFrame: 4,
                      sequence: { $sequence: 'read' },
                    },
                  ],
                  actionGraph: {
                    main: {
                      nodes: {
                        write: {
                          action: { ...probe, parameters: { ...probe.parameters, flag: 'write' } },
                          next: null,
                        },
                        long: {
                          action: { ...probe, parameters: { ...probe.parameters, flag: 'long' } },
                          next: null,
                        },
                        read: {
                          action: { ...probe, parameters: { ...probe.parameters, flag: 'read' } },
                          next: null,
                        },
                      },
                    },
                    macros: {},
                  },
                },
              },
            ],
          },
          next: null,
        },
      }),
    );
    parent.executeInstant({});
    source.assignDynamic('seed', 99);
    const tick = () => {
      frame++;
      scheduler.advanceFrame();
      scheduler.beginAbilityFrame();
      scheduler.advanceAbilityFrame();
    };
    tick();
    componentDelta = COMBAT_FRAME_INTERVAL;
    for (let i = 0; i < 3; i++) tick();
    expect(trace).toEqual([
      '1:start:write:1',
      '1:start:long:2',
      '2:end:write',
      '3:start:read:2',
      '4:end:long',
      '4:end:read',
      '4:attached-end',
    ]);
    expect(scheduler.activeCount).toBe(1);
    componentDelta = 100;
    tick();
    tick();
    expect(trace.at(-1)).toBe('6:reset');
    expect(trace.filter(item => item.includes('attached-end'))).toHaveLength(1);
  });

  it('keeps zero-length callback intervals separate from projectile reset', () => {
    const scheduler = new ProjectileLifecycleRuntime();
    const trace: string[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: () => {
          trace.push('callback');
          return true;
        },
        end: () => trace.push('end-callback'),
        evaluate: () => true,
      },
      {
        blackboard: new ActionBlackboard(),
        createCallbackSkillHost: createTestHost,
        launchProjectile: request => {
          const instance = scheduler.launch({
            finishDelaySeconds: request.finish,
            recycleDelaySeconds: request.recycleDelaySeconds,
            callbacks: request.callbacks.map(c => c.runtime.runtimeState),
            callbackPrograms: request.callbacks.map(c => c.program),
            firstTickHit: request.hit,
            ...bindProjectileCallbackLifecycle(
              request.callbacks.map(c => c.runtime),
              () => 1,
            ),
          });
          instance.onReset(() => trace.push('reset'));
          return instance;
        },
      },
      undefined,
      undefined,
      'source',
    );
    const parent = runtime.createSequence(
      compileGraphEntry('zero-length-callback', 'launch', {
        launch: {
          action: {
            kind: 'launchProjectile',
            parameters: { finish: 1, recycleDelaySeconds: 1 },
            callbacks: [
              {
                event: 'finish',
                skill: {
                  skillId: 'callback',
                  nativeSkillType: 'normalSkill',
                  naturalDurationFrames: 1,
                  castResource: zeroCastResource,
                  blackboard: {},
                  scheduledSequences: [
                    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'probe' } },
                  ],
                  actionGraph: {
                    main: {
                      nodes: {
                        probe: { action: probe, next: null },
                      },
                    },
                    macros: {},
                  },
                },
              },
            ],
          },
          next: null,
        },
      }),
    );
    parent.executeInstant({});
    parent.end({});
    expect(trace).toEqual([]);
    scheduler.advanceFrame();
    // 首次启动只有 Execute；本夹具不推进回调技能，End 留到投射物回收清理。
    expect(trace).toEqual(['callback']);
    parent.end({});
    scheduler.advanceFrame();
    expect(trace).toEqual(['callback']);
    scheduler.advanceFrame();
    expect(trace).toEqual(['callback', 'end-callback', 'reset']);
    scheduler.advanceFrame();
    expect(trace).toHaveLength(3);
  });

  it('registers only when the containing branch executes and survives its parent sequence end', () => {
    const scheduler = new ProjectileLifecycleRuntime();
    let passed = false;
    let executions = 0;
    const operations: CombatOperationExecutor = {
      execute: () => {
        executions += 1;
        return true;
      },
      evaluate: () => passed,
    };
    const blackboard = new ActionBlackboard({ launchValue: 7 });
    const runtime = new CombatActionSequenceRuntime(
      operations,
      {
        blackboard,
        createCallbackSkillHost: createTestHost,
        launchProjectile: request => {
          return scheduler.launch({
            finishDelaySeconds: request.finish,
            recycleDelaySeconds: request.recycleDelaySeconds,
            callbacks: request.callbacks.map(c => c.runtime.runtimeState),
            callbackPrograms: request.callbacks.map(c => c.program),
            firstTickHit: request.hit,
            ...bindProjectileCallbackLifecycle(
              request.callbacks.map(c => c.runtime),
              () => COMBAT_FRAME_INTERVAL,
            ),
          });
        },
      },
      undefined,
      undefined,
      'source',
    );
    const branched: ResolvedActionSequence = compileGraphEntry('branched-callback', 'branch', {
      ...delayedProbeNodes(),
      branch: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: { kind: 'probability', probability: { kind: 'constant', value: 1 } },
          },
          whenTrue: { $sequence: 'launch' },
        },
        next: null,
      },
    });

    runtime.createSequence(branched).executeInstant({});
    expect(scheduler.activeCount).toBe(0);

    passed = true;
    const parent = runtime.createSequence(branched);
    parent.executeInstant({});
    parent.end({});
    expect(scheduler.activeCount).toBe(1);
    scheduler.advanceFrame();
    expect(executions).toBe(0);
    for (let frame = 1; frame < 91; frame += 1) scheduler.advanceFrame();
    expect(executions).toBe(1);
    expect(scheduler.activeCount).toBe(1);
    scheduler.advanceFrame();
    scheduler.advanceFrame();
    expect(scheduler.activeCount).toBe(0);
  });

  it('samples direct and entity assignment inputs at launch and isolates repeated projectiles', () => {
    const scheduler = new ProjectileLifecycleRuntime();
    let sourceEnabled = true;
    const observed: number[][] = [];
    const operations: CombatOperationExecutor = {
      execute: (_step, context) => {
        observed.push([
          context!.blackboard.getNumber('launchValue')!,
          context!.blackboard.getNumber('local')!,
          context!.blackboard.getNumber('EntityBB_seed')!,
          context!.blackboard.getNumber('EntityBB_snapshot')!,
          context!.blackboard.getNumber('EntityBB_sourceSnapshot')!,
        ]);
        context!.blackboard.assignDynamic('EntityBB_seed', 500);
        return true;
      },
      evaluate: () => true,
    };
    const entityBlackboard = new ActionBlackboard({ EntityBB_source: 11 });
    const blackboard = new ActionBlackboard({ launchValue: 7 }, entityBlackboard);
    const runtime = new CombatActionSequenceRuntime(
      operations,
      {
        blackboard,
        canExecuteAction: () => sourceEnabled,
        createCallbackSkillHost: createTestHost,
        launchProjectile: request => {
          return scheduler.launch({
            finishDelaySeconds: request.finish,
            recycleDelaySeconds: request.recycleDelaySeconds,
            callbacks: request.callbacks.map(c => c.runtime.runtimeState),
            callbackPrograms: request.callbacks.map(c => c.program),
            firstTickHit: request.hit,
            ...bindProjectileCallbackLifecycle(
              request.callbacks.map(c => c.runtime),
              () => COMBAT_FRAME_INTERVAL,
            ),
          });
        },
      },
      undefined,
      undefined,
      'source',
    );

    runtime.createSequence(delayedProbe()).executeInstant({});
    blackboard.assignDynamic('launchValue', 99);
    blackboard.assignDynamic('EntityBB_source', 22);
    runtime.createSequence(delayedProbe()).executeInstant({});
    blackboard.assignDynamic('launchValue', 100);
    blackboard.assignDynamic('EntityBB_source', 33);
    // 回调动作宿主是投射物，不继承发射动作宿主的启用状态。
    sourceEnabled = false;
    for (let frame = 0; frame < 91; frame += 1) scheduler.advanceFrame();
    expect(observed).toEqual([
      [7, 2, 4, 7, 11],
      [99, 2, 4, 99, 22],
    ]);
    expect(entityBlackboard.getNumber('EntityBB_seed')).toBeUndefined();
    expect(entityBlackboard.getNumber('EntityBB_source')).toBe(33);
  });
});
