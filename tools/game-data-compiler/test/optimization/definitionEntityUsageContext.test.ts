import { TargetContextOperationExecutor } from '../../../../src/core/combat/abilities/targetContextOperationExecutor.ts';
import { extractDefinitionDataNodes } from '../../src/compiler/extractGraphDataNodes.ts';
import { skillFixture } from '../../../../src/test/skillFixture';
/** 跨定义的实体黑板用途汇总；全部夹具为图形态，序列入口与节点表成对给出。 */
import { describe, expect, it } from 'vitest';
import type {
  ActionGraphNode,
  ActionGraphReference,
  ActionGraphStep,
} from '../../src/compiler/intermediateDefinitions.ts';
import type { CombatStepForKind } from '../../src/compiler/intermediateDefinitions.ts';
import type { OperatorDefinition } from '../../src/compiler/intermediateDefinitions.ts';
import type { SkillDefinition } from '../../src/compiler/intermediateDefinitions.ts';
import type { AbilityEntityDefinition } from '../../src/compiler/intermediateDefinitions.ts';
import { compileGraphSequence } from '../support/graphSequence.ts';
import { ActionBlackboardOperationExecutor } from '../../../../src/core/combat/actions/actionBlackboardOperationExecutor.ts';
import { AbilityEntityOperationExecutor } from '../../../../src/core/combat/abilities/abilityEntityOperationExecutor.ts';
import { LogicalAbilityEntityRuntime } from '../../../../src/core/combat/abilities/logicalAbilityEntityRuntime.ts';
import { CombatActionSequenceRuntime } from '../../../../src/core/combat/actions/combatActionSequenceRuntime.ts';
import { createCallbackSkillHostFactory } from '../../../../src/core/combat/abilities/callbackSkillHost.ts';
import { CombatClock } from '../../../../src/core/combat/time/combatClock.ts';
import { RuntimeTargetContext } from '../../../../src/core/combat/abilities/runtimeTargetContext.ts';
import { CombatAttributeSet } from '../../../../src/core/combat/attributes/combatAttributes.ts';
import { compileCombatBuffDefinitions } from '../../../../src/core/combat/buffs/combatBuffDefinitions.ts';
import { BuffDefinitionOperationTarget } from '../../../../src/core/combat/buffs/buffDefinitionOperationTarget.ts';
import { CombatBuffContainer } from '../../../../src/core/combat/buffs/combatBuffs.ts';
import { ActionBlackboard } from '../../../../src/core/combat/actions/actionBlackboard.ts';
import { resolveActionValueOperand } from '../../../../src/core/combat/actions/actionBlackboard.ts';
import { avywenna } from '../../../../src/data/operators/avywenna.generated.ts';
import { analyzeGraphBuffDefinitionUsage } from '../../src/compiler/buffs/graphBuffValueUsage.ts';
import {
  collectGraphSharedEntityValueUsage,
  createGraphSharedEntityValueUsageCollector,
  createGraphEntityUsageContext,
  type GraphSequenceSource,
  type GraphSharedEntityValueUsageCollector,
  type GraphSharedEntityValueUsageInput,
} from '../../src/compiler/optimization/graphValueOptimization.ts';
import { pruneUnusedGraphSkillValues } from '../../src/compiler/optimization/graphValueOptimization.ts';
import {
  finalizeDefinitionResources,
  finalizeOperatorDefinition,
} from '../../src/compiler/finalizeDefinitions.ts';

const board = (key: string) => ({ kind: 'blackboard' as const, key });
const childSkillRuntime = {
  nativeSkillType: 'normalSkill',
  naturalDurationFrames: 10,
  castResource: {
    costFrame: 0,
    cooldownSeconds: 0,
    maxChargeTime: 1,
    cost: { resource: 'sp', value: 0, availabilityThreshold: 0 },
  },
} as const;
const spend = (key: string): ActionGraphStep => ({
  kind: 'changeResource',
  parameters: {
    resource: 'sp',
    source: { kind: 'owner' },
    targets: { kind: 'owner' },
    amount: board(key),
  },
});
const assign = (key: string, value: number): ActionGraphStep => ({
  kind: 'modifyActionValue',
  parameters: { key, operation: 'assign', value: { kind: 'constant', value } },
});

/** 平铺动作串链进共享节点表。 */
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

/** 独立图程序（机制序列等）：节点表与入口成对。 */
function program(steps: readonly ActionGraphStep[]): GraphSequenceSource {
  const nodes: Record<string, ActionGraphNode> = {};
  return { graph: { nodes }, entry: chain(nodes, 'entry', steps) };
}

/** 单入口技能图夹具。 */
function skill(
  steps: readonly ActionGraphStep[],
  blackboard: SkillDefinition['blackboard'],
): SkillDefinition {
  const nodes: Record<string, ActionGraphNode> = {};
  return {
    ...skillFixture({
      key: 'fixture',
      timelineBlockFrames: 30,
      scheduledSequences: [],
      actionGraph: { main: { nodes: {} }, macros: {} },
    }),
    key: 'fixture',
    timelineBlockFrames: 10,
    blackboard,
    scheduledSequences: [{ startFrame: 0, sequence: chain(nodes, 'main', steps) }],
    actionGraph: { main: { nodes }, macros: {} },
  };
}

/** 子技能持有自己的图；模板不持有图。 */
function childSkill(skillId: string, steps: readonly ActionGraphStep[]) {
  const nodes: Record<string, ActionGraphNode> = {};
  return {
    skillId,
    ...childSkillRuntime,
    scheduledSequences: [{ startFrame: 0, sequence: chain(nodes, 'child', steps) }],
    actionGraph: { main: { nodes }, macros: {} },
  };
}

const spawn = (
  id: string,
  definition?: AbilityEntityDefinition,
): CombatStepForKind<'spawnAbilityEntity'> => ({
  kind: 'spawnAbilityEntity',
  parameters: {
    bornAt: { kind: 'owner' as const },
    abilityEntityId: id,
    dieWhenSourceDies: false,
    inheritActionBlackboard: true,
    ...(definition === undefined ? {} : { definition }),
  },
});
const callback = (body: GraphSequenceSource): CombatStepForKind<'launchProjectile'> => ({
  kind: 'launchProjectile',
  parameters: { inheritActionBlackboard: true, finish: 1, recycleDelaySeconds: 1 },
  callbacks: [
    {
      event: 'finish',
      skill: {
        skillId: 'callback_fixture',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 10,
        blackboard: { value: 1 },
        scheduledSequences: [{ startFrame: 0, sequence: body.entry }],
        actionGraph: { main: body.graph, macros: {} },
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'sp', value: 0, availabilityThreshold: 0 },
        },
      },
    },
  ],
});

const input = (
  overrides: Partial<GraphSharedEntityValueUsageInput> = {},
): GraphSharedEntityValueUsageInput => ({
  operators: [],
  commonBuffDefinitions: {},
  commonAbilityEntityDefinitions: {},
  weapons: [],
  gears: [],
  gearSets: [],
  mechanicBuffDefinitions: {},
  mechanicSequences: [],
  ...overrides,
});
const shared = () => collectGraphSharedEntityValueUsage(input());
const fixtureOperator = (
  value: SkillDefinition,
  definitions: OperatorDefinition['abilityEntityDefinitions'],
): OperatorDefinition => {
  // avywenna 生成产物是图形态；剔除与夹具冲突的运行时字段后作为基座。
  const { dodgeSkill: _dodgeSkill, eventHandlers: _eventHandlers, ...base } = avywenna;
  return {
    ...base,
    talents: [],
    potentials: [],
    passiveSkills: [],
    comboSkillConditions: [],
    buffDefinitions: {},
    abilityEntityDefinitions: definitions,
    skillGroups: [{ key: 'fixture', operationType: 'battleSkill', skills: value }],
  };
};

/** 用查询所得能力实体上的排序键区分每个来源，避免只证明本板读写的重复合并。 */
const queryEntityValue = (key: string): GraphSequenceSource =>
  program([
    {
      kind: 'findOwnerSpawnedAbilityEntities',
      parameters: {
        owner: { kind: 'source' },
        saveToContextKey: 'found',
        circularOrder: { indexBlackboardKey: key, desiredCount: 1, reverseFlag: 1 },
      },
    },
  ]);

describe('实体用途分阶段收集', () => {
  it('Buff 自有变量不保护其他实体的同名键，实体写入和外部读取仍保留', () => {
    const collector = createGraphSharedEntityValueUsageCollector({});
    const graph = program([
      spend('local'),
      spend('fallback'),
      assign('EntityBB_shared', 1),
      {
        kind: 'readBuffBlackboard',
        parameters: {
          target: 'buffOwner',
          query: { kind: 'id', buffIds: ['other'] },
          desiredKey: 'local',
          outputKey: 'result',
        },
      },
    ]);
    collector.addBuffDefinitions({
      buff: {
        stackingType: 'unlimited',
        blackboard: { local: 0, result: 0, EntityBB_shared: 0 },
        actionGraph: { main: graph.graph, macros: {} },
        lifecycleSequences: { trigger: [graph.entry] },
      },
    });
    const result = collector.finish();
    expect(result.externalReads).toHaveLength(1);
    expect(result.externalReads[0]?.key).toBe('local');
  });

  it('时间线跳转仍收集条件中的实体变量，不把控制效果误报成未知变量访问', () => {
    const nodes: Record<string, ActionGraphNode> = {};
    const condition = chain(nodes, 'condition', [queryEntityValueStep('jumpCondition')]);
    const entry = chain(nodes, 'jump', [
      {
        kind: 'jumpTimeline',
        parameters: { destinationFrame: 0 },
        condition: { kind: 'checkActionResult', action: condition },
      },
    ]);
    const collector = createGraphSharedEntityValueUsageCollector({});
    collector.addSequence({ graph: { nodes }, entry });
    const usage = collector.finish();
    expect(usage.externalReads.map(read => read.key)).toContain('jumpCondition');
    expect(usage.unknownAccess).toBe(false);
  });

  it('按域合并摘要，再逐人收集，与一次性收集的全部用途一致', () => {
    const source = input({
      operators: [fixtureOperator(skill([queryEntityValueStep('operator')], {}), {})],
      commonBuffDefinitions: {
        common: { stackingType: 'unlimited', durationSeconds: { blackboardKey: 'commonBuff' } },
      },
      commonAbilityEntityDefinitions: {
        shared: {
          lifetime: { kind: 'infinite' },
          childSkill: childSkill('shared', [queryEntityValueStep('commonEntity')]),
        },
      },
      weapons: [
        {
          slug: 'weapon',
          rarity: 3,
          weaponType: 'sword',
          baseAttackAtLevelNodes: [1],
          traits: [
            (() => {
              const weaponProgram = queryEntityValue('weapon');
              return {
                key: 'trait',
                levelCount: 1,
                initializationSequence: weaponProgram.entry,
                actionGraph: { main: weaponProgram.graph, macros: {} },
              };
            })(),
          ],
        },
      ],
      gears: [
        {
          slug: 'gear',
          slotType: 'armor',
          levelRequirement: 1,
          baseDefense: 1,
          traits: [
            {
              key: 'trait',
              levelCount: 1,
              display: {
                kind: 'modifier',
                modifier: { kind: 'attribute', attribute: 'strength', operation: 'flat', value: 1 },
              },
            },
          ],
        },
      ],
      gearSets: [
        (() => {
          const gearSet = queryEntityValue('gearSet');
          return {
            slug: 'set',
            initializationSequence: gearSet.entry,
            actionGraph: { main: gearSet.graph, macros: {} },
          };
        })(),
      ],
      mechanicBuffDefinitions: {
        mechanic: { stackingType: 'unlimited', durationSeconds: { blackboardKey: 'mechanicBuff' } },
      },
      mechanicSequences: [queryEntityValue('mechanicSequence')],
    });
    const equipment = createGraphSharedEntityValueUsageCollector(
      source.commonAbilityEntityDefinitions,
    );
    source.gears.forEach(equipment.addGear);
    source.weapons.forEach(equipment.addWeapon);
    source.gearSets.forEach(equipment.addGearSet);
    const mechanics = createGraphSharedEntityValueUsageCollector(
      source.commonAbilityEntityDefinitions,
    );
    source.mechanicSequences.forEach(mechanics.addSequence);
    mechanics.addBuffDefinitions(source.mechanicBuffDefinitions);
    const collector = createGraphSharedEntityValueUsageCollector(
      source.commonAbilityEntityDefinitions,
    );
    collector.addUsage(equipment.finish());
    source.operators.forEach(collector.addOperator);
    collector.addUsage(mechanics.finish());
    collector.addBuffDefinitions(source.commonBuffDefinitions);
    const result = collector.finish();
    expect(result).toEqual(collectGraphSharedEntityValueUsage(source));
    expect(new Set(result.externalReads.map(read => read.key))).toEqual(
      new Set(['operator', 'commonEntity', 'weapon', 'gearSet', 'mechanicSequence']),
    );
    expect(result.unknownAccess).toBe(false);
    expect(result.commonAbilityEntityDefinitions).toBe(source.commonAbilityEntityDefinitions);
  });

  it('跨阶段保留 Buff 查询身份，不把同名键误认为当前板或另一 Buff 的读取', () => {
    const catalog = {};
    const first = createGraphSharedEntityValueUsageCollector(catalog);
    first.addSequence(
      program(
        ['first', 'second'].map(buffId => ({
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: [buffId] },
            desiredKey: 'count',
            outputKey: 'local',
          },
        })),
      ),
    );
    const second = createGraphSharedEntityValueUsageCollector(catalog);
    second.addUsage(first.finish());
    second.addSequence(
      program([
        {
          kind: 'readEventBuffBlackboard',
          parameters: { desiredKey: 'count', outputKey: 'local' },
        },
      ]),
    );
    const result = second.finish();
    expect(result.externalReads).toEqual([
      {
        kind: 'buff',
        target: 'buffOwner',
        query: { kind: 'id', buffIds: ['first'] },
        key: 'count',
      },
      {
        kind: 'buff',
        target: 'buffOwner',
        query: { kind: 'id', buffIds: ['second'] },
        key: 'count',
      },
      { kind: 'eventBuff', key: 'count' },
    ]);
  });

  it('收集摘要保留未知访问诊断；实际实体接收方缺失时仍保守保留', () => {
    // 模拟外部反序列化后尚未登记的新动作，走真实用途分析的保守分支。
    const unknown: GraphSequenceSource = program([
      { kind: 'unregisteredAction', parameters: {} } as unknown as ActionGraphStep,
    ]);
    const catalog = {};
    const known = createGraphSharedEntityValueUsageCollector(catalog);
    known.addSequence(queryEntityValue('known'));
    const earlier = known.finish();
    const late = createGraphSharedEntityValueUsageCollector(catalog);
    late.addSequence(unknown);
    for (const addUnknown of [
      (collector: GraphSharedEntityValueUsageCollector) => collector.addSequence(unknown),
      (collector: GraphSharedEntityValueUsageCollector) => collector.addUsage(late.finish()),
    ]) {
      const collector = createGraphSharedEntityValueUsageCollector(catalog);
      collector.addUsage(earlier);
      addUnknown(collector);
      const result = collector.finish();
      expect(result.unknownAccess).toBe(true);
      expect(result.externalReads.map(read => read.key)).toEqual(['known']);
      const value = skill([spawn('entity', { lifetime: { kind: 'infinite' } })], {
        known: 7,
        unused: 99,
      });
      expect(
        pruneUnusedGraphSkillValues(value, new Set(), createGraphEntityUsageContext({}, result))
          .report.retainedReason,
      ).toBe('unresolved-blackboard-access');
    }
    expect(earlier.unknownAccess).toBe(false);
  });

  it('拒绝合并不同公共实体目录，结束后也不能再增加用途', () => {
    const catalog = {};
    const collector = createGraphSharedEntityValueUsageCollector(catalog);
    expect(() =>
      collector.addUsage(createGraphSharedEntityValueUsageCollector({}).finish()),
    ).toThrow('same common entity catalog');
    collector.addSequence(queryEntityValue('before'));
    const result = collector.finish();
    expect(collector.finish()).toBe(result);
    expect(() => collector.addSequence(queryEntityValue('after'))).toThrow('already finished');
    expect(() =>
      collector.addUsage(createGraphSharedEntityValueUsageCollector(catalog).finish()),
    ).toThrow('already finished');
    expect(result.externalReads.map(read => read.key)).toEqual(['before']);
  });
});

/** 实体模板内联时的查询动作（与 queryEntityValue 同形，但直接作为技能图节点）。 */
function queryEntityValueStep(key: string): ActionGraphStep {
  return {
    kind: 'findOwnerSpawnedAbilityEntities',
    parameters: {
      owner: { kind: 'source' },
      saveToContextKey: 'found',
      circularOrder: { indexBlackboardKey: key, desiredCount: 1, reverseFlag: 1 },
    },
  };
}

/** Spawn 和子技能均由正式执行器创建，终端只记录资源动作的数值。 */
function executeEntitySkill(value: SkillDefinition) {
  const amounts: number[] = [];
  const actionOperations = new ActionBlackboardOperationExecutor({
    execute(step, context) {
      if (step.kind === 'changeResource')
        amounts.push(
          typeof step.parameters.amount === 'number'
            ? step.parameters.amount
            : resolveActionValueOperand(step.parameters.amount, context!.blackboard),
        );
      return true;
    },
    evaluate: () => true,
  });
  const entities = new LogicalAbilityEntityRuntime({});
  let nextCastId = 1;
  const operations: AbilityEntityOperationExecutor = new AbilityEntityOperationExecutor(
    'fixture',
    entities,
    new TargetContextOperationExecutor('fixture', actionOperations),
    {
      resolveOperations: () => operations,
      createCallbackSkillHost: createCallbackSkillHostFactory({
        clock: new CombatClock(),
        receipt: { record: () => {} },
        definitionOperatorId: 'fixture',
        allocateSkillCastId: () => nextCastId++,
      }),
    },
  );
  const blackboard = new ActionBlackboard(
    Object.fromEntries(
      Object.entries(value.blackboard ?? {}).map(([key, v]) => [
        key,
        typeof v === 'number' ? v : v[0]!,
      ]),
    ),
  );
  const runtime = new CombatActionSequenceRuntime(operations, {
    blackboard,
    actionOwnerId: 'fixture',
    actionSourceId: 'fixture',
  });
  for (const item of value.scheduledSequences)
    runtime
      .createSequence(compileGraphSequence(item.sequence, value.actionGraph))
      .executeInstant({});
  return amounts;
}

describe('跨技能黑板用途', () => {
  it('嵌入回调按读取和 epsilon 旧值保留；延时启动读取创建时父快照而非回调默认值', () => {
    const value = skill([callback(program([assign('value', 7), spend('value')]))], {
      value: 7.000001,
      unused: 99,
    });
    const result = pruneUnusedGraphSkillValues(value);
    expect(result.skill.blackboard).toEqual({ value: 7.000001 });
    expect(result.report.retainedReason).toBeUndefined();
    const run = (source: SkillDefinition) => {
      const amounts: number[] = [];
      const operations = new ActionBlackboardOperationExecutor({
        execute(step, context) {
          if (step.kind === 'changeResource')
            amounts.push(
              typeof step.parameters.amount === 'number'
                ? step.parameters.amount
                : resolveActionValueOperand(step.parameters.amount, context!.blackboard),
            );
          return true;
        },
        evaluate: () => true,
      });
      const blackboard = new ActionBlackboard(
        Object.fromEntries(
          Object.entries(source.blackboard ?? {}).map(([key, v]) => [
            key,
            typeof v === 'number' ? v : v[0]!,
          ]),
        ),
      );
      let finish: (() => void) | undefined;
      const runtime = new CombatActionSequenceRuntime(
        operations,
        {
          blackboard,
          skillCastInfo: {
            skillCastId: 1,
            originSkillId: 'fixture',
            originSkillType: 'battleSkill',
            nonReturnedSpCost: 0,
          },
          launchProjectile: request => {
            finish = () => request.callbacks.forEach(callback => callback.runtime.start());
            return {
              instanceId: 1,
              target: { kind: 'abilityEntity', instanceId: 1 },
              onReset: () => ({ registrationId: 1, dispose() {} }),
            };
          },
          createCallbackSkillHost: createCallbackSkillHostFactory({
            clock: new CombatClock(),
            receipt: { record() {} },
            definitionOperatorId: 'fixture',
            allocateSkillCastId: () => 2,
          }),
        },
        {},
        undefined,
        'fixture',
      );
      runtime
        .createSequence(
          compileGraphSequence(source.scheduledSequences[0]!.sequence, source.actionGraph),
        )
        .executeInstant({});
      blackboard.assign({ value: 100 });
      finish!();
      return amounts;
    };
    expect(run(value)).toEqual([7.000001]);
    expect(run(result.skill)).toEqual(run(value));
  });

  it('实体完整接收方保留模板寿命、全部子技能和被动读写，父值覆盖子初值', () => {
    const definition: AbilityEntityDefinition = {
      lifetime: { kind: 'limited', durationSeconds: { blackboardKey: 'duration', fallback: 2 } },
      maxStackingCount: { blackboardKey: 'limit', fallback: 1 },
      childSkills: {
        first: {
          ...childSkill('first', [assign('value', 7), spend('value')]),
          blackboard: { value: 1 },
        },
        later: childSkill('later', [spend('later')]),
      },
      passiveSkills: [
        (() => {
          const passiveNodes: Record<string, ActionGraphNode> = {};
          const enable = chain(passiveNodes, 'enable', [spend('passive')]);
          const event = chain(passiveNodes, 'event', [spend('event')]);
          return {
            key: 'passive',
            blackboard: { passive: 0 },
            enableSequence: enable,
            abilityEventResponses: [{ event: 'addedBuff' as const, priority: 0, sequence: event }],
            actionGraph: { main: { nodes: passiveNodes }, macros: {} },
          };
        })(),
      ],
    };
    const step = spawn('entity', definition);
    const value = skill([{ ...step, parameters: { ...step.parameters, childSkillId: 'first' } }], {
      value: 7.000001,
      later: 9,
      passive: 3,
      event: 5,
      duration: 2,
      limit: 1,
      unused: 99,
      EntityBB_kept: 6,
    });
    const result = pruneUnusedGraphSkillValues(
      value,
      new Set(),
      createGraphEntityUsageContext({}, shared()),
    );
    expect(result.report.removedInitialKeys).toEqual(['unused']);
    expect(result.skill.blackboard?.value).toBe(7.000001);
    expect(executeEntitySkill(value)).toEqual([7.000001]);
    expect(executeEntitySkill(result.skill)).toEqual(executeEntitySkill(value));
  });

  it('递归传给另一个实体与回调时保留末端读取，缺键错误不会变成默认值', () => {
    const leaf: AbilityEntityDefinition = {
      lifetime: { kind: 'infinite' },
      childSkill: childSkill('leaf', [spend('required')]),
    };
    const middle: AbilityEntityDefinition = {
      lifetime: { kind: 'infinite' },
      childSkill: childSkill('middle', [callback(program([spawn('leaf', leaf)]))]),
    };
    const context = createGraphEntityUsageContext({ middle, leaf }, shared());
    const value = skill([spawn('middle')], { required: 9, unused: 99 });
    // 同上回调分析缺口（生产缺陷）导致整板保留。
    expect(pruneUnusedGraphSkillValues(value, new Set(), context).skill.blackboard).toEqual({
      required: 9,
    });
    const missing = skill([spawn('leaf', leaf)], { unused: 99 });
    const pruned = pruneUnusedGraphSkillValues(missing, new Set(), context).skill;
    expect(() => executeEntitySkill(missing)).toThrow("'required' is missing");
    expect(() => executeEntitySkill(pruned)).toThrow("'required' is missing");
  });

  it('没有完整共享摘要、接收方缺失、递归环和未知下游都保持整板', () => {
    const cycle: AbilityEntityDefinition = {
      lifetime: { kind: 'infinite' },
      childSkill: childSkill('loop', [spawn('loop')]),
    };
    for (const context of [
      createGraphEntityUsageContext({ loop: cycle }, undefined),
      createGraphEntityUsageContext({}, shared()),
      createGraphEntityUsageContext({ loop: cycle }, shared()),
      createGraphEntityUsageContext(
        {
          loop: {
            lifetime: { kind: 'infinite' },
            childSkill: childSkill('later', [spawn('unregistered')]),
          },
        },
        shared(),
      ),
    ]) {
      const value = skill([callback(program([spawn('loop')]))], { unused: 99 });
      expect(pruneUnusedGraphSkillValues(value, new Set(), context).report.retainedReason).toBe(
        'unresolved-blackboard-access',
      );
    }
  });

  it('实体显式赋值先读取父板，接收键与来源键不同也不会删掉来源', () => {
    const step = spawn('entity', {
      lifetime: { kind: 'infinite' },
      childSkill: childSkill('child', [spend('received')]),
    });
    const value = skill(
      [
        {
          ...step,
          parameters: {
            ...step.parameters,
            blackboardAssignments: { received: board('source') },
          },
        },
      ],
      { source: 7, unused: 99 },
    );
    const result = pruneUnusedGraphSkillValues(
      value,
      new Set(),
      createGraphEntityUsageContext({}, shared()),
    );
    expect(result.skill.blackboard).toEqual({ source: 7 });
    expect(executeEntitySkill(result.skill)).toEqual([7]);
    expect(executeEntitySkill(value)).toEqual([7]);
  });

  it('队友环排序确实读取生成实体上的普通键，而不是查询者自己的同名板', () => {
    const query: CombatStepForKind<'findOwnerSpawnedAbilityEntities'> = {
      kind: 'findOwnerSpawnedAbilityEntities',
      parameters: {
        owner: { kind: 'context', key: 'owner' },
        saveToContextKey: 'found',
        circularOrder: { indexBlackboardKey: 'slot', desiredCount: 3, reverseFlag: 1 },
      },
    };
    const collected = collectGraphSharedEntityValueUsage(
      input({ mechanicSequences: [program([query])] }),
    );
    const value = skill([spawn('entity', { lifetime: { kind: 'infinite' } })], {
      slot: 2,
      unused: 99,
    });
    const pruned = pruneUnusedGraphSkillValues(
      value,
      new Set(),
      createGraphEntityUsageContext({}, collected),
    ).skill;
    expect(pruned.blackboard).toEqual({ slot: 2, unused: 99 });
    const run = (source: SkillDefinition) => {
      const entities = new LogicalAbilityEntityRuntime({});
      const executor = new AbilityEntityOperationExecutor(
        'caster',
        entities,
        new TargetContextOperationExecutor('caster', {
          execute: () => true,
          evaluate: () => true,
        }),
      );
      const runtime = new CombatActionSequenceRuntime(executor, {
        actionOwnerId: 'caster',
        actionSourceId: 'caster',
        blackboard: new ActionBlackboard(
          Object.fromEntries(
            Object.entries(source.blackboard ?? {}).map(([key, item]) => [
              key,
              typeof item === 'number' ? item : item[0]!,
            ]),
          ),
        ),
      });
      runtime
        .createSequence(
          compileGraphSequence(source.scheduledSequences[0]!.sequence, source.actionGraph),
        )
        .executeInstant({});
      for (const slot of [0, 1])
        entities.spawn({
          abilityEntityId: 'entity',
          definition: { lifetime: { kind: 'infinite' } },
          ownerId: 'caster',
          source: { kind: 'operator', operatorId: 'caster' },
          blackboardAssignments: { slot },
        });
      const targetContext = new RuntimeTargetContext();
      targetContext.setSingle('owner', { kind: 'operator', operatorId: 'caster' });
      executor.execute(query, { blackboard: new ActionBlackboard({ slot: 99 }), targetContext });
      return targetContext
        .get('found')
        .map(target => (target.kind === 'abilityEntity' ? target.instanceId : -1));
    };
    expect(run(value)).toEqual([2, 1, 3]);
    expect(run(pruned)).toEqual([2, 1, 3]);
    expect(run({ ...pruned, blackboard: {} })).toEqual([1, 2, 3]);
  });

  it('共享用途纳入队友查询、装备与场景 Buff，快照传出不误读宿主整板', () => {
    const remote = 'remote';
    const carrierNodes: Record<string, ActionGraphNode> = {};
    const carrierTrigger = chain(carrierNodes, 'trigger', [
      spawn('unresolved'),
      callback(program([spend('callbackRead')])),
    ]);
    const collected = collectGraphSharedEntityValueUsage(
      input({
        mechanicBuffDefinitions: {
          mechanic: (() => {
            const mechanicProgram = program([spend('mechanic')]);
            return {
              stackingType: 'unlimited' as const,
              lifecycleSequences: { trigger: [mechanicProgram.entry] },
              actionGraph: { main: mechanicProgram.graph, macros: {} },
            };
          })(),
        },
        mechanicSequences: [
          program([
            {
              kind: 'findOwnerSpawnedAbilityEntities',
              parameters: {
                owner: { kind: 'context', key: 'ally' },
                saveToContextKey: 'found',
                circularOrder: { indexBlackboardKey: remote, desiredCount: 1, reverseFlag: 1 },
              },
            },
          ]),
        ],
        gears: [
          {
            slug: 'gear',
            slotType: 'armor',
            levelRequirement: 1,
            baseDefense: 1,
            traits: [
              {
                key: 'trait',
                levelCount: 1,
                display: {
                  kind: 'modifier',
                  modifier: {
                    kind: 'attribute',
                    attribute: 'strength',
                    operation: 'flat',
                    value: 1,
                  },
                },
              },
            ],
          },
        ],
        commonBuffDefinitions: {
          carrier: {
            stackingType: 'unlimited',
            lifecycleSequences: { trigger: [carrierTrigger] },
            actionGraph: { main: { nodes: carrierNodes }, macros: {} },
          },
        },
      }),
    );
    expect(collected.unknownAccess).toBe(false);
    expect(collected.externalReads.map(read => read.key)).toEqual(['remote']);
    const value = skill([spawn('empty', { lifetime: { kind: 'infinite' } })], {
      remote: 0,
      mechanic: 1,
      gearValue: 2,
      callbackRead: 3,
      unused: 99,
    });
    expect(
      pruneUnusedGraphSkillValues(value, new Set(), createGraphEntityUsageContext({}, collected))
        .report.removedInitialKeys,
    ).toEqual([]);

    const entityBoard = new ActionBlackboard({ remote: 7 });
    const buffBoard = new ActionBlackboard({ own: 1 }, entityBoard);
    expect(buffBoard.getNumber(remote)).toBe(7);
    expect(buffBoard.detachedSnapshot().getNumber(remote)).toBe(7);
    expect(buffBoard.snapshot()).toEqual({ own: 1 });
    expect(new ActionBlackboard(buffBoard.snapshot()).getNumber(remote)).toBeUndefined();
  });

  it('系统元素 Buff 的生命周期读取敌方独立板，不接收能力实体的同名初值', () => {
    const amounts: number[] = [];
    const runtime = new BuffDefinitionOperationTarget(
      new CombatBuffContainer('enemy', new CombatAttributeSet()),
      compileCombatBuffDefinitions(
        {
          schemaVersion: 1,
          revision: 'fixture',
          buffs: [
            {
              id: 'system',
              stackingType: 'unlimited',
              blackboard: { systemValue: 7 },
              actions: {
                start: [
                  {
                    kind: 'dealAttackScaledDamage',
                    damageType: 'physical',
                    attackScale: { blackboardKey: 'systemValue' },
                    tags: [],
                    features: [],
                    canCritical: false,
                  },
                ],
              },
            },
          ],
        },
        {
          emitElementalInflictionStarted() {},
          onAttackScaledDamageTriggered: payload => amounts.push(payload.attackScale),
        },
      ),
    );
    expect(runtime.entityBlackboard.snapshot()).toEqual({});
    runtime.apply({ buffId: 'system', sourceId: 'ability-entity:1', blackboardValues: {} });
    expect(amounts).toEqual([7]);
    const value = skill([spawn('empty', { lifetime: { kind: 'infinite' } })], {
      systemValue: 99,
    });
    expect(
      pruneUnusedGraphSkillValues(value, new Set(), createGraphEntityUsageContext({}, shared()))
        .report.removedInitialKeys,
    ).toEqual(['systemValue']);
  });

  it('Buff 属性以外的伤害条件、护盾和治疗也可能读宿主板', () => {
    const usage = analyzeGraphBuffDefinitionUsage({
      actionGraph: {
        main: {
          nodes: {
            guard: {
              action: {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'gate' },
                    operator: 'greater',
                    right: { kind: 'constant', value: 0 },
                  },
                },
                whenTrue: { $sequence: null },
              },
              next: null,
            },
          },
        },
        macros: {},
      },
      stackingType: 'unlimited',
      durationSeconds: { blackboardKey: 'duration' },
      damageModifiers: [
        {
          enabledSide: 'attacker',
          condition: { $sequence: 'guard' },
          processors: [
            {
              kind: 'instantAttribute',
              targetSide: 'attacker',
              attribute: 'attack',
              attributeTiming: 'runtime',
              values: { slot: 'addition', value: { blackboardKey: 'attack' } },
            },
          ],
        },
      ],
      healModifiers: [
        {
          enabledSide: 'healer',
          processors: [
            {
              kind: 'modifyCalculationResult',
              timing: 'afterCalculation',
              baseMultiplier: { blackboardKey: 'healing' },
              multiplierCount: 1,
            },
          ],
        },
      ],
      shields: [
        {
          infinityValue: false,
          value: { attribute: 'attack', multiplier: { blackboardKey: 'shield' }, addition: 0 },
          damageAbsorptions: [],
          absorbCount: 1,
          absorbAllDamageWhenConsumed: false,
          removeBuffWhenConsumed: false,
          priority: 'normal',
          replaceHitEffect: false,
        },
      ],
    });
    expect(usage.reads).toEqual(new Set(['duration', 'gate', 'attack', 'healing', 'shield']));
  });

  it('生成适配器仅在完整上下文下裁剪，report 和 off 保留定义内容', () => {
    const value = skill([spawn('entity')], { value: 7, unused: 99 });
    const operator = fixtureOperator(value, {
      entity: {
        lifetime: { kind: 'infinite' },
        childSkill: childSkill('child', [spend('value')]),
      },
    });
    const usage = collectGraphSharedEntityValueUsage(input({ operators: [operator] }));
    expect(
      finalizeOperatorDefinition(operator, 'apply').report.resourceValues.find(
        item => item.resourceId === 'fixture',
      )?.retainedReason,
    ).toBe('unresolved-blackboard-access');
    const result = finalizeOperatorDefinition(operator, 'apply', usage);
    expect(
      result.report.resourceValues.find(item => item.resourceId === 'fixture')?.removedInitialKeys,
    ).toEqual(['unused']);
    const report = finalizeOperatorDefinition(operator, 'report', usage);
    expect(report.operator).toEqual(extractDefinitionDataNodes(operator));
    expect(report.report.resourceValues).toEqual(result.report.resourceValues);
    expect(finalizeOperatorDefinition(operator, 'off', usage).operator).toEqual(
      extractDefinitionDataNodes(operator),
    );
  });

  it('子技能独立裁剪无用写入，保留传给后续实体的值及实体共享变量', () => {
    const child = {
      ...childSkill('child', [
        assign('unused', 2),
        assign('forwarded', 7),
        assign('EntityBB_shared', 9),
        spawn('receiver'),
      ]),
      blackboard: { unused: 0, forwarded: 1, EntityBB_shared: 0 },
    };
    const operator = fixtureOperator(skill([spawn('entity')], {}), {
      entity: {
        lifetime: { kind: 'infinite' },
        childSkill: child,
        childSkills: { child },
      },
      receiver: {
        lifetime: { kind: 'infinite' },
        childSkill: childSkill('receiver', [spend('forwarded')]),
      },
    });
    const usage = collectGraphSharedEntityValueUsage(input({ operators: [operator] }));
    const result = finalizeOperatorDefinition(operator, 'apply', usage);
    const entity = result.operator.abilityEntityDefinitions!.entity!;
    for (const value of [entity.childSkill!, entity.childSkills!.child!]) {
      expect(value.blackboard).toEqual({ forwarded: 1, EntityBB_shared: 0 });
      expect(
        Object.values(value.actionGraph.main.nodes).filter(
          node => node.action.kind === 'modifyActionValue',
        ),
      ).toHaveLength(2);
    }
    expect(result.report.resourceValues.filter(report => report.resourceId === 'child')).toEqual([
      expect.objectContaining({ removedInitialKeys: ['unused'] }),
      expect.objectContaining({ removedInitialKeys: ['unused'] }),
    ]);
  });
  it('嵌在动作中的投射物回调也按独立技能裁剪，不依赖干员目录入口', () => {
    const value = skill([callback(program([assign('unused', 2), spend('value')]))], {});
    const result = finalizeDefinitionResources(value, 'apply');
    const launch = Object.values(result.value.actionGraph.main.nodes).find(
      node => node.action.kind === 'launchProjectile',
    )!.action;
    if (launch.kind !== 'launchProjectile') throw new Error('missing projectile');
    const child = launch.callbacks[0]!.skill;
    expect(Object.values(child.actionGraph.main.nodes).map(node => node.action.kind)).toEqual([
      'changeResource',
    ]);
    expect(child.blackboard).toEqual({ value: 1 });
    expect(
      result.report.resourceValues.find(item => item.resourceId === 'callback_fixture')
        ?.removedWrites,
    ).toEqual([expect.objectContaining({ key: 'unused' })]);
  });
});
