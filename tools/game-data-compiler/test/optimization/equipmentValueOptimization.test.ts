/** 用实际装备宿主、事件分发和动作执行器验证运行入口的黑板初值裁剪。 */
import { describe, expect, it } from 'vitest';
import type { CombatStepForKind } from '../../../../packages/game-data-contract/src/actions.ts';
import type { CombatCondition } from '../../../../packages/game-data-contract/src/conditions.ts';
import type { GearSetDefinition } from '../../../../packages/game-data-contract/src/equipment.ts';
import { compileGearSetContribution } from '../../../../src/core/compiler/compileEquipment.ts';
import { ActionGraphDefinitionRepository } from '../../../../src/core/compiler/actionGraphDefinitionRepository.ts';
import { createNativeEventFixture } from '../../../../src/core/combat/events/nativeEventTestFixture.ts';
import { ActionBlackboardOperationExecutor } from '../../../../src/core/combat/actions/actionBlackboardOperationExecutor.ts';
import { resolveActionValueOperand } from '../../../../src/core/combat/actions/actionBlackboard.ts';
import { CombatActionSequenceRuntime } from '../../../../src/core/combat/actions/combatActionSequenceRuntime.ts';
import { EquipmentEventRuntime } from '../../../../src/core/combat/abilities/equipmentEventRuntime.ts';
import { optimizeGearSetDefinitionPrograms } from '../../src/compiler/optimization/equipmentDefinitionOptimization.ts';
import type {
  ActionGraphNode,
  ActionGraphReference,
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph.ts';

const literal = (value: number) => ({ kind: 'constant' as const, value });
const board = (key: string) => ({ kind: 'blackboard' as const, key });
const spend = (key: string): ActionGraphStep => ({
  kind: 'changeResourceByActionValue',
  parameters: { resource: 'sp', recipient: 'team', amount: board(key) },
});
const gate = (key: string): CombatCondition => ({
  kind: 'actionValueCompare',
  left: board(key),
  operator: 'greater',
  right: literal(0),
});
const hit = { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' } as const;

/** 定义内的平铺动作串链；控制动作体内引用同一节点表。 */
function chain(
  nodes: Record<string, ActionGraphNode>,
  prefix: string,
  actions: readonly ActionGraphStep[],
): ActionGraphReference {
  actions.forEach((action, index) => {
    nodes[`${prefix}-${index}`] = {
      action,
      next: index + 1 < actions.length ? `${prefix}-${index + 1}` : null,
    };
  });
  return { $sequence: actions.length === 0 ? null : `${prefix}-0` };
}

const scopeBody = (
  nodes: Record<string, ActionGraphNode>,
  prefix: string,
  parameters: CombatStepForKind<'withActionBlackboardScope'>['parameters'],
  ...steps: ActionGraphStep[]
): ActionGraphStep => ({
  kind: 'withActionBlackboardScope',
  parameters,
  body: chain(nodes, `${prefix}-body`, steps),
});

/** 与装配器相同：启用/初始化和所有事件响应共享装备宿主的同一黑板。 */
function executeContribution(definition: GearSetDefinition) {
  const compiled = compileGearSetContribution(
    definition,
    {
      main: 'agility',
      secondary: 'intellect',
    },
    new ActionGraphDefinitionRepository(),
  );
  const native = createNativeEventFixture();
  const amounts: number[] = [];
  const operations = new ActionBlackboardOperationExecutor({
    execute(step, context) {
      if (step.kind !== 'changeResourceByActionValue')
        throw new Error(`unexpected test action ${step.kind}`);
      amounts.push(resolveActionValueOperand(step.parameters.amount, context!.blackboard));
      return true;
    },
    evaluate: () => {
      throw new Error('unexpected test condition');
    },
  });
  const host = new EquipmentEventRuntime(
    native.semanticEvents,
    'operator_fixture',
    [compiled],
    () => operations,
  );
  try {
    const blackboard = host.blackboardFor(0);
    const initialization = new CombatActionSequenceRuntime(operations, { blackboard });
    for (const program of [compiled.enableSequence, compiled.initializationSequence]) {
      if (program === undefined) continue;
      const action = initialization.createSequence(program);
      action.reset({});
      action.executeInstant({});
    }
    host.enable(0);
    native.emitOutputDamage({ sourceId: 'operator_fixture', tags: ['normalSkill'] });
    return { amounts, values: blackboard.snapshot() };
  } finally {
    host.dispose();
  }
}

describe('有运行入口的装备贡献按键裁剪初值', () => {
  it('汇总启用、初始化及每个事件条件和序列；未触发入口仍保留所用键', () => {
    const nodes: Record<string, ActionGraphNode> = {};
    const input: GearSetDefinition = {
      slug: 'runtime_fixture',
      blackboard: {
        enable: 2,
        initialize: 3,
        firstGate: 1,
        firstValue: 4,
        secondGate: 0,
        secondValue: 5,
        unused: 99,
      },
      enableSequence: chain(nodes, 'enable', [spend('enable')]),
      initializationSequence: chain(nodes, 'initialize', [spend('initialize')]),
      eventHandlers: [
        {
          key: 'first',
          event: hit,
          condition: gate('firstGate'),
          sequence: chain(nodes, 'first', [spend('firstValue')]),
        },
        {
          key: 'second',
          event: hit,
          condition: gate('secondGate'),
          sequence: chain(nodes, 'second', [spend('secondValue')]),
        },
      ],
      actionGraph: { main: { nodes }, macros: {} },
    };
    const applied = optimizeGearSetDefinitionPrograms(input);
    expect(applied.report.equipmentValues[0]).toMatchObject({
      removedInitialKeys: ['unused'],
      retainedReason: 'runtime-value-access',
    });
    expect(Object.keys(applied.definition.blackboard ?? {})).toEqual([
      'enable',
      'initialize',
      'firstGate',
      'firstValue',
      'secondGate',
      'secondValue',
    ]);
    expect(executeContribution(input).amounts).toEqual([2, 3, 4]);
    expect(executeContribution(applied.definition).amounts).toEqual(
      executeContribution(input).amounts,
    );
    const report = optimizeGearSetDefinitionPrograms(input, 'report');
    expect(report.definition).toBe(input);
    expect(report.report.equipmentValues).toEqual(applied.report.equipmentValues);
    expect(optimizeGearSetDefinitionPrograms(input, 'off').definition).toBe(input);
  });

  it('先删除不可达分支，再删除只有该分支使用的初值；行为入口仍保留', () => {
    const nodes: Record<string, ActionGraphNode> = {};
    const body = chain(nodes, 'body', [
      {
        kind: 'modifyActionValue',
        parameters: { key: 'destination', operation: 'assign', value: board('source') },
      },
    ]);
    const input: GearSetDefinition = {
      slug: 'unreachable_fixture',
      blackboard: { source: 2, destination: 0 },
      initializationSequence: chain(nodes, 'init', [
        {
          kind: 'conditional',
          parameters: { condition: { kind: 'constant', value: false } },
          whenTrue: body,
        },
      ]),
      actionGraph: { main: { nodes }, macros: {} },
    };
    const result = optimizeGearSetDefinitionPrograms(input);
    expect(result.definition.initializationSequence).toBeDefined();
    expect(result.report.after.steps).toBeLessThan(result.report.before.steps);
    expect(result.report.equipmentValues[0]?.removedInitialKeys).toEqual(['source', 'destination']);
    // 当前因 prune 把删除的 blackboard 以 undefined 重写回定义而失败（已记录为生产缺陷）。
    expect(Object.hasOwn(result.definition, 'blackboard')).toBe(false);
  });

  it('只有写入而没有显式后续读取的键也保留旧值，维持 epsilon 赋值结果', () => {
    const nodes: Record<string, ActionGraphNode> = {};
    const input: GearSetDefinition = {
      slug: 'epsilon_fixture',
      blackboard: { written: 3.000001, unused: 99 },
      initializationSequence: chain(nodes, 'init', [
        {
          kind: 'modifyActionValue',
          parameters: { key: 'written', operation: 'assign', value: literal(3) },
        },
      ]),
      actionGraph: { main: { nodes }, macros: {} },
    };
    const result = optimizeGearSetDefinitionPrograms(input);
    expect(result.definition.blackboard).toEqual({ written: 3.000001 });
    expect(executeContribution(input).values.written).toBe(3.000001);
    expect(executeContribution(result.definition).values.written).toBe(3.000001);
    expect(result.definition.initializationSequence).toEqual(input.initializationSequence);
  });

  it('父值覆盖子初值，独立实体赋值仍读父板；子板自身数据不参与此次裁剪', () => {
    const nodes: Record<string, ActionGraphNode> = {};
    const input: GearSetDefinition = {
      slug: 'scope_fixture',
      blackboard: { inherited: 7, assigned: 5, unused: 99 },
      initializationSequence: chain(nodes, 'init', [
        scopeBody(
          nodes,
          'inherited',
          {
            scopeKey: 'inherited',
            initialValues: { inherited: 1, childOnly: 9 },
            inheritParent: true,
          },
          spend('inherited'),
        ),
        scopeBody(
          nodes,
          'isolated',
          {
            scopeKey: 'isolated',
            initialValues: {},
            inheritParent: false,
            entityInitialValues: { childValue: 1 },
            entityAssignments: { childValue: board('assigned') },
          },
          spend('childValue'),
        ),
      ]),
      actionGraph: { main: { nodes }, macros: {} },
    };
    const result = optimizeGearSetDefinitionPrograms(input);
    expect(result.definition.blackboard).toEqual({ inherited: 7, assigned: 5 });
    expect(result.definition.initializationSequence).toEqual(input.initializationSequence);
    expect(executeContribution(input).amounts).toEqual([7, 5]);
    expect(executeContribution(result.definition).amounts).toEqual(
      executeContribution(input).amounts,
    );
  });

  it('投射物回调中仍有未解析实体传出时，即使包在隔离子作用域里也整板保留', () => {
    const callbackNodes: Record<string, ActionGraphNode> = {
      spawn: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'unresolved',
            dieWhenSourceDies: false,
            inheritActionBlackboard: true,
          },
        },
        next: null,
      },
    };
    const callbackGraph: ActionGraphResourceDefinition = {
      main: { nodes: callbackNodes },
      macros: {},
    };
    const callback: ActionGraphStep = {
      kind: 'launchProjectile',
      parameters: { finish: 1, recycleDelaySeconds: 1 },
      callbacks: [
        {
          event: 'finish',
          skill: {
            skillId: 'callback_fixture',
            nativeSkillType: 'normalSkill',
            naturalDurationFrames: 0,
            blackboard: {},
            scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'spawn' } }],
            actionGraph: callbackGraph,
            castResource: {
              costFrame: 0,
              cooldownSeconds: 0,
              maxChargeTime: 1,
              cost: { resource: 'sp', value: 0, availabilityThreshold: 0 },
            },
          },
        },
      ],
    };
    for (const wrap of [false, true] as const) {
      const nodes: Record<string, ActionGraphNode> = {};
      const step = wrap
        ? scopeBody(
            nodes,
            'callback',
            { scopeKey: 'callback', initialValues: {}, inheritParent: false },
            callback,
          )
        : callback;
      const input: GearSetDefinition = {
        slug: 'callback_fixture',
        blackboard: { captured: 7, possiblyUsedLater: 99 },
        initializationSequence: chain(nodes, 'init', [step]),
        actionGraph: { main: { nodes }, macros: {} },
      };
      const result = optimizeGearSetDefinitionPrograms(input);
      // 当前因优化管线先重建定义对象、不再保留未触碰黑板的引用身份而失败（已记录为生产缺陷）。
      expect(result.definition.blackboard).toBe(input.blackboard);
      expect(result.report.equipmentValues[0]).toMatchObject({
        removedInitialKeys: [],
        retainedReason: 'unresolved-blackboard-access',
      });
    }
  });

  it('Buff 同名初值属于独立实例，只保留施加时从装备板读取的赋值来源', () => {
    const nodes: Record<string, ActionGraphNode> = {};
    const input: GearSetDefinition = {
      slug: 'buff_fixture',
      blackboard: { duration: 99, transfer: 2 },
      buffDefinitions: {
        independent_buff: {
          stackingType: 'unlimited',
          blackboard: { duration: 7, received: 0 },
          durationSeconds: { blackboardKey: 'duration' },
        },
      },
      enableSequence: chain(nodes, 'enable', [
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'independent_buff',
            target: 'caster',
            blackboardAssignments: { received: board('transfer') },
          },
        },
      ]),
      actionGraph: { main: { nodes }, macros: {} },
    };
    const result = optimizeGearSetDefinitionPrograms(input);
    expect(result.definition.blackboard).toEqual({ transfer: 2 });
    expect(result.definition.buffDefinitions).toEqual(input.buffDefinitions);
    expect(result.definition.enableSequence).toEqual(input.enableSequence);
  });

  it('不删除现有写入或缺键读取，缺失输入的错误保持可见', () => {
    const nodes: Record<string, ActionGraphNode> = {};
    const input: GearSetDefinition = {
      slug: 'missing_fixture',
      blackboard: { destination: 0, unused: 99 },
      initializationSequence: chain(nodes, 'init', [
        {
          kind: 'modifyActionValue',
          parameters: { key: 'destination', operation: 'assign', value: board('missing') },
        },
      ]),
      actionGraph: { main: { nodes }, macros: {} },
    };
    const result = optimizeGearSetDefinitionPrograms(input);
    expect(result.definition.blackboard).toEqual({ destination: 0 });
    expect(() => executeContribution(input)).toThrow(
      "action blackboard value 'missing' is missing",
    );
    expect(() => executeContribution(result.definition)).toThrow(
      "action blackboard value 'missing' is missing",
    );
  });
});
