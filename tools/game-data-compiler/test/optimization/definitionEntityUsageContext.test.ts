/** 用真实动作宿主验证跨板传值；默认值、旧值比较和外部消费者都不能被用途摘要抹掉。 */
import { describe, expect, it } from 'vitest';
import type {
  ActionSequenceDefinition,
  CombatStepDefinition,
  CombatStepForKind,
} from '../../../../packages/game-data-contract/src/actions.ts';
import type { OperatorDefinition } from '../../../../packages/game-data-contract/src/operators.ts';
import type {
  AbilityEntityDefinition,
  SkillDefinition,
} from '../../../../packages/game-data-contract/src/skills.ts';
import { compileActionSequence } from '../../../../src/core/compiler/compileSkill.ts';
import {
  ActionBlackboard,
  resolveActionValueOperand,
} from '../../../../src/core/combat/actions/actionBlackboard.ts';
import { ActionBlackboardOperationExecutor } from '../../../../src/core/combat/actions/actionBlackboardOperationExecutor.ts';
import { AbilityEntityOperationExecutor } from '../../../../src/core/combat/abilities/abilityEntityOperationExecutor.ts';
import { LogicalAbilityEntityRuntime } from '../../../../src/core/combat/abilities/logicalAbilityEntityRuntime.ts';
import { CombatActionSequenceRuntime } from '../../../../src/core/combat/actions/combatActionSequenceRuntime.ts';
import { createCallbackSkillHostFactory } from '../../../../src/core/combat/abilities/callbackSkillHost.ts';
import { CombatClock } from '../../../../src/core/combat/time/combatClock.ts';
import { RuntimeTargetContext } from '../../../../src/core/combat/abilities/runtimeTargetContext.ts';
import { CombatAttributeSet } from '../../../../src/core/combat/attributes/combatAttributes.ts';
import { compileCombatBuffDefinitions } from '../../../../src/core/combat/buffs/combatBuffDefinitions.ts';
import { ElementalBuffRuntime } from '../../../../src/core/combat/buffs/elementalBuffRuntime.ts';
import { avywenna } from '../../../../src/data/operators/avywenna.generated.ts';
import { analyzeBuffDefinitionUsage } from '../../src/compiler/buffs/buffValueUsage.ts';
import {
  collectSharedEntityValueUsage,
  createSharedEntityValueUsageCollector,
  createEntityUsageContext,
  type SharedEntityValueUsageCollector,
  type SharedEntityValueUsageInput,
} from '../../src/compiler/optimization/definitionEntityUsageContext.ts';
import { pruneUnusedSkillValues } from '../../src/compiler/optimization/skillValueOptimization.ts';
import { optimizeOperatorDefinitionPrograms } from '../../src/compiler/optimization/definitionProgramOptimization.ts';

const sequence = (...steps: CombatStepDefinition[]): ActionSequenceDefinition => ({ steps });
const board = (key: string) => ({ kind: 'blackboard' as const, key });
const spend = (key: string): CombatStepDefinition => ({
  kind: 'changeResourceByActionValue',
  parameters: { resource: 'sp', recipient: 'team', amount: board(key) },
});
const assign = (key: string, value: number): CombatStepDefinition => ({
  kind: 'modifyActionValue',
  parameters: { key, operation: 'assign', value: { kind: 'constant', value } },
});
const spawn = (
  id: string,
  definition?: AbilityEntityDefinition,
): CombatStepForKind<'spawnAbilityEntity'> => ({
  kind: 'spawnAbilityEntity',
  parameters: {
    abilityEntityId: id,
    dieWhenSourceDies: false,
    inheritActionBlackboard: true,
    ...(definition === undefined ? {} : { definition }),
  },
});
const callback = (
  body: ActionSequenceDefinition,
): CombatStepForKind<'scheduleProjectileFinishCallback'> => ({
  kind: 'scheduleProjectileFinishCallback',
  parameters: { delaySeconds: 1, recycleDelaySeconds: 1 },
  callback: {
    skillId: 'callback_fixture',
    nativeSkillType: 'normalSkill',
    naturalDurationFrames: 10,
    blackboard: { value: 1 },
    scheduledSequences: [{ startFrame: 0, sequence: body }],
    castResource: {
      costFrame: 0,
      cooldownSeconds: 0,
      maxChargeTime: 1,
      cost: { resource: 'sp', value: 0, availabilityThreshold: 0 },
    },
  },
});
const skill = (
  body: ActionSequenceDefinition,
  blackboard: SkillDefinition['blackboard'],
): SkillDefinition => ({
  key: 'fixture',
  timelineBlockFrames: 10,
  blackboard,
  scheduledSequences: [{ startFrame: 0, sequence: body }],
});
const input = (
  overrides: Partial<SharedEntityValueUsageInput> = {},
): SharedEntityValueUsageInput => ({
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
const shared = () => collectSharedEntityValueUsage(input());
const fixtureOperator = (
  value: SkillDefinition,
  definitions: OperatorDefinition['abilityEntityDefinitions'],
): OperatorDefinition => ({
  ...avywenna,
  talents: [],
  potentials: [],
  passiveSkills: [],
  comboSkillConditions: [],
  buffDefinitions: {},
  abilityEntityDefinitions: definitions,
  skillGroups: [
    { key: 'fixture', skillType: 'battleSkill', levelSource: 'battleSkill', skills: value },
  ],
});

/** 用查询所得能力实体上的排序键区分每个来源，避免只证明本板读写的重复合并。 */
const queryEntityValue = (key: string): ActionSequenceDefinition =>
  sequence({
    kind: 'findOwnerSpawnedAbilityEntities',
    parameters: {
      saveToContextKey: 'found',
      circularOrder: { indexBlackboardKey: key, desiredCount: 1, reverseFlag: 1 },
    },
  });

describe('实体用途分阶段收集', () => {
  it('按域合并摘要，再逐人收集，与一次性收集的全部用途一致', () => {
    const source = input({
      operators: [fixtureOperator(skill(queryEntityValue('operator'), {}), {})],
      commonBuffDefinitions: {
        common: { stackingType: 'unlimited', durationSeconds: { blackboardKey: 'commonBuff' } },
      },
      commonAbilityEntityDefinitions: {
        shared: {
          lifetime: { kind: 'infinite' },
          childSkill: {
            skillId: 'shared',
            scheduledSequences: [{ startFrame: 0, sequence: queryEntityValue('commonEntity') }],
          },
        },
      },
      weapons: [
        {
          slug: 'weapon',
          rarity: 3,
          weaponType: 'sword',
          baseAttackAtLevelNodes: [1],
          traits: [
            { key: 'trait', levelCount: 1, initializationSequence: queryEntityValue('weapon') },
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
              enableSequence: queryEntityValue('gear'),
            },
          ],
        },
      ],
      gearSets: [{ slug: 'set', initializationSequence: queryEntityValue('gearSet') }],
      mechanicBuffDefinitions: {
        mechanic: { stackingType: 'unlimited', durationSeconds: { blackboardKey: 'mechanicBuff' } },
      },
      mechanicSequences: [queryEntityValue('mechanicSequence')],
    });
    const equipment = createSharedEntityValueUsageCollector(source.commonAbilityEntityDefinitions);
    source.gears.forEach(equipment.addGear);
    source.weapons.forEach(equipment.addWeapon);
    source.gearSets.forEach(equipment.addGearSet);
    const mechanics = createSharedEntityValueUsageCollector(source.commonAbilityEntityDefinitions);
    source.mechanicSequences.forEach(mechanics.addSequence);
    mechanics.addBuffDefinitions(source.mechanicBuffDefinitions);
    const collector = createSharedEntityValueUsageCollector(source.commonAbilityEntityDefinitions);
    collector.addUsage(equipment.finish());
    source.operators.forEach(collector.addOperator);
    collector.addUsage(mechanics.finish());
    collector.addBuffDefinitions(source.commonBuffDefinitions);
    const result = collector.finish();
    expect(result).toEqual(collectSharedEntityValueUsage(source));
    expect(result.reads).toEqual(
      new Set([
        'operator',
        'commonBuff',
        'commonEntity',
        'weapon',
        'gear',
        'gearSet',
        'mechanicBuff',
        'mechanicSequence',
      ]),
    );
    expect(result.unknownAccess).toBe(false);
    expect(result.commonAbilityEntityDefinitions).toBe(source.commonAbilityEntityDefinitions);
  });

  it('后加入来源或摘要中的未知访问仍阻止裁剪，不能被前一阶段的已知摘要掩盖', () => {
    // 模拟外部反序列化后尚未登记的新动作，走真实用途分析的保守分支。
    const unknown: ActionSequenceDefinition = JSON.parse(
      '{"steps":[{"kind":"unregisteredAction","parameters":{}}]}',
    );
    const catalog = {};
    const known = createSharedEntityValueUsageCollector(catalog);
    known.addSequence(queryEntityValue('known'));
    const earlier = known.finish();
    const late = createSharedEntityValueUsageCollector(catalog);
    late.addSequence(unknown);
    for (const addUnknown of [
      (collector: SharedEntityValueUsageCollector) => collector.addSequence(unknown),
      (collector: SharedEntityValueUsageCollector) => collector.addUsage(late.finish()),
    ]) {
      const collector = createSharedEntityValueUsageCollector(catalog);
      collector.addUsage(earlier);
      addUnknown(collector);
      const result = collector.finish();
      expect(result.unknownAccess).toBe(true);
      expect(result.reads).toEqual(new Set(['known']));
      const value = skill(sequence(spawn('entity', { lifetime: { kind: 'infinite' } })), {
        known: 7,
        unused: 99,
      });
      expect(
        pruneUnusedSkillValues(value, new Set(), createEntityUsageContext({}, result)).report
          .retainedReason,
      ).toBe('unresolved-blackboard-access');
    }
    expect(earlier.unknownAccess).toBe(false);
  });

  it('拒绝合并不同公共实体目录，结束后也不能再增加用途', () => {
    const catalog = {};
    const collector = createSharedEntityValueUsageCollector(catalog);
    expect(() => collector.addUsage(createSharedEntityValueUsageCollector({}).finish())).toThrow(
      'same common entity catalog',
    );
    collector.addSequence(queryEntityValue('before'));
    const result = collector.finish();
    expect(collector.finish()).toBe(result);
    expect(() => collector.addSequence(queryEntityValue('after'))).toThrow('already finished');
    expect(() =>
      collector.addUsage(createSharedEntityValueUsageCollector(catalog).finish()),
    ).toThrow('already finished');
    expect(result.reads).toEqual(new Set(['before']));
  });
});

/** Spawn 和子技能均由正式执行器创建，终端只记录资源动作的数值。 */
function executeEntitySkill(value: SkillDefinition) {
  const amounts: number[] = [];
  const actionOperations = new ActionBlackboardOperationExecutor({
    execute(step, context) {
      if (step.kind === 'changeResourceByActionValue')
        amounts.push(resolveActionValueOperand(step.parameters.amount, context!.blackboard));
      return true;
    },
    evaluate: () => true,
  });
  const entities = new LogicalAbilityEntityRuntime({});
  const operations: AbilityEntityOperationExecutor = new AbilityEntityOperationExecutor(
    'fixture',
    entities,
    actionOperations,
    {
      resolveOperations: () => operations,
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
  const runtime = new CombatActionSequenceRuntime(operations, { blackboard });
  for (const item of value.scheduledSequences)
    runtime.createSequence(compileActionSequence(item.sequence, 1)).executeInstant({});
  return amounts;
}

describe('跨技能黑板用途', () => {
  it('嵌入回调按读取和 epsilon 旧值保留；延时启动读取创建时父快照而非回调默认值', () => {
    const value = skill(sequence(callback(sequence(assign('value', 7), spend('value')))), {
      value: 7.000001,
      unused: 99,
    });
    const result = pruneUnusedSkillValues(value);
    expect(result.skill.blackboard).toEqual({ value: 7.000001 });
    expect(result.report.retainedReason).toBeUndefined();
    const run = (source: SkillDefinition) => {
      const amounts: number[] = [];
      const operations = new ActionBlackboardOperationExecutor({
        execute(step, context) {
          if (step.kind === 'changeResourceByActionValue')
            amounts.push(resolveActionValueOperand(step.parameters.amount, context!.blackboard));
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
          scheduleProjectileFinishCallback: (_delay, _recycle, execute) => {
            finish = execute;
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
        .createSequence(compileActionSequence(source.scheduledSequences[0]!.sequence, 1))
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
          skillId: 'first',
          blackboard: { value: 1 },
          scheduledSequences: [
            { startFrame: 0, sequence: sequence(assign('value', 7), spend('value')) },
          ],
        },
        later: {
          skillId: 'later',
          scheduledSequences: [{ startFrame: 0, sequence: sequence(spend('later')) }],
        },
      },
      passiveSkills: [
        {
          key: 'passive',
          blackboard: { passive: 0 },
          enableSequence: sequence(spend('passive')),
          abilityEventResponses: [
            { event: 'addedBuff', priority: 0, sequence: sequence(spend('event')) },
          ],
        },
      ],
    };
    const step = spawn('entity', definition);
    const value = skill(
      sequence({ ...step, parameters: { ...step.parameters, childSkillId: 'first' } }),
      {
        value: 7.000001,
        later: 9,
        passive: 3,
        event: 5,
        duration: 2,
        limit: 1,
        unused: 99,
        EntityBB_kept: 6,
      },
    );
    const result = pruneUnusedSkillValues(value, new Set(), createEntityUsageContext({}, shared()));
    expect(result.report.removedInitialKeys).toEqual(['unused']);
    expect(result.skill.blackboard?.value).toBe(7.000001);
    expect(executeEntitySkill(value)).toEqual([7.000001]);
    expect(executeEntitySkill(result.skill)).toEqual(executeEntitySkill(value));
  });

  it('递归传给另一个实体与回调时保留末端读取，缺键错误不会变成默认值', () => {
    const leaf: AbilityEntityDefinition = {
      lifetime: { kind: 'infinite' },
      childSkill: {
        skillId: 'leaf',
        scheduledSequences: [{ startFrame: 0, sequence: sequence(spend('required')) }],
      },
    };
    const middle: AbilityEntityDefinition = {
      lifetime: { kind: 'infinite' },
      childSkill: {
        skillId: 'middle',
        scheduledSequences: [
          { startFrame: 0, sequence: sequence(callback(sequence(spawn('leaf', leaf)))) },
        ],
      },
    };
    const context = createEntityUsageContext({ middle, leaf }, shared());
    const value = skill(sequence(spawn('middle')), { required: 9, unused: 99 });
    expect(pruneUnusedSkillValues(value, new Set(), context).skill.blackboard).toEqual({
      required: 9,
    });
    const missing = skill(sequence(spawn('leaf', leaf)), { unused: 99 });
    const pruned = pruneUnusedSkillValues(missing, new Set(), context).skill;
    expect(() => executeEntitySkill(missing)).toThrow("'required' is missing");
    expect(() => executeEntitySkill(pruned)).toThrow("'required' is missing");
  });

  it('没有完整共享摘要、接收方缺失、递归环和未知下游都保持整板', () => {
    const cycle: AbilityEntityDefinition = {
      lifetime: { kind: 'infinite' },
      childSkill: {
        skillId: 'loop',
        scheduledSequences: [{ startFrame: 0, sequence: sequence(spawn('loop')) }],
      },
    };
    for (const context of [
      createEntityUsageContext({ loop: cycle }, undefined),
      createEntityUsageContext({}, shared()),
      createEntityUsageContext({ loop: cycle }, shared()),
      createEntityUsageContext(
        {
          loop: {
            ...cycle,
            childSkill: {
              skillId: 'later',
              scheduledSequences: [{ startFrame: 0, sequence: sequence(spawn('unregistered')) }],
            },
          },
        },
        shared(),
      ),
      createEntityUsageContext(
        { loop: { ...cycle, childSkill: undefined } },
        { ...shared(), unknownAccess: true },
      ),
    ]) {
      const value = skill(sequence(callback(sequence(spawn('loop')))), { unused: 99 });
      expect(pruneUnusedSkillValues(value, new Set(), context).report.retainedReason).toBe(
        'unresolved-blackboard-access',
      );
    }
  });

  it('实体显式赋值先读取父板，接收键与来源键不同也不会删掉来源', () => {
    const step = spawn('entity', {
      lifetime: { kind: 'infinite' },
      childSkill: {
        skillId: 'child',
        scheduledSequences: [{ startFrame: 0, sequence: sequence(spend('received')) }],
      },
    });
    const value = skill(
      sequence({
        ...step,
        parameters: {
          ...step.parameters,
          blackboardAssignments: { received: board('source') },
        },
      }),
      { source: 7, unused: 99 },
    );
    const result = pruneUnusedSkillValues(value, new Set(), createEntityUsageContext({}, shared()));
    expect(result.skill.blackboard).toEqual({ source: 7 });
    expect(executeEntitySkill(result.skill)).toEqual([7]);
    expect(executeEntitySkill(value)).toEqual([7]);
  });

  it('队友环排序确实读取生成实体上的普通键，而不是查询者自己的同名板', () => {
    const query: CombatStepForKind<'findOwnerSpawnedAbilityEntities'> = {
      kind: 'findOwnerSpawnedAbilityEntities',
      parameters: {
        ownerContextKey: 'owner',
        saveToContextKey: 'found',
        circularOrder: { indexBlackboardKey: 'slot', desiredCount: 3, reverseFlag: 1 },
      },
    };
    const collected = collectSharedEntityValueUsage(
      input({ mechanicSequences: [sequence(query)] }),
    );
    const value = skill(sequence(spawn('entity', { lifetime: { kind: 'infinite' } })), {
      slot: 2,
      unused: 99,
    });
    const pruned = pruneUnusedSkillValues(
      value,
      new Set(),
      createEntityUsageContext({}, collected),
    ).skill;
    expect(pruned.blackboard).toEqual({ slot: 2 });
    const run = (source: SkillDefinition) => {
      const entities = new LogicalAbilityEntityRuntime({});
      const executor = new AbilityEntityOperationExecutor('caster', entities, {
        execute: () => true,
        evaluate: () => true,
      });
      const runtime = new CombatActionSequenceRuntime(executor, {
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
        .createSequence(compileActionSequence(source.scheduledSequences[0]!.sequence, 1))
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
    const collected = collectSharedEntityValueUsage(
      input({
        mechanicBuffDefinitions: {
          mechanic: {
            stackingType: 'unlimited',
            lifecycleSequences: { trigger: sequence(spend('mechanic')) },
          },
        },
        mechanicSequences: [
          sequence({
            kind: 'findOwnerSpawnedAbilityEntities',
            parameters: {
              ownerContextKey: 'ally',
              saveToContextKey: 'found',
              circularOrder: { indexBlackboardKey: remote, desiredCount: 1, reverseFlag: 1 },
            },
          }),
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
                buffDefinitions: {
                  gear: {
                    stackingType: 'unlimited',
                    attributeModifiers: [
                      {
                        attribute: 'attack',
                        slot: 'addition',
                        value: { blackboardKey: 'gearValue' },
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
        commonBuffDefinitions: {
          carrier: {
            stackingType: 'unlimited',
            lifecycleSequences: {
              trigger: sequence(spawn('unresolved'), callback(sequence(spend('callbackRead')))),
            },
          },
        },
      }),
    );
    expect(collected.unknownAccess).toBe(false);
    expect(collected.reads).toEqual(new Set(['remote', 'mechanic', 'gearValue', 'callbackRead']));
    const value = skill(sequence(spawn('empty', { lifetime: { kind: 'infinite' } })), {
      remote: 0,
      mechanic: 1,
      gearValue: 2,
      callbackRead: 3,
      unused: 99,
    });
    expect(
      pruneUnusedSkillValues(value, new Set(), createEntityUsageContext({}, collected)).report
        .removedInitialKeys,
    ).toEqual(['unused']);

    const entityBoard = new ActionBlackboard({ remote: 7 });
    const buffBoard = new ActionBlackboard({ own: 1 }, entityBoard);
    expect(buffBoard.getNumber(remote)).toBe(7);
    expect(buffBoard.detachedSnapshot().getNumber(remote)).toBe(7);
    expect(buffBoard.snapshot()).toEqual({ own: 1 });
    expect(new ActionBlackboard(buffBoard.snapshot()).getNumber(remote)).toBeUndefined();
  });

  it('系统元素 Buff 的生命周期读取敌方独立板，不接收能力实体的同名初值', () => {
    const amounts: number[] = [];
    const runtime = new ElementalBuffRuntime({
      ownerId: 'enemy',
      attributes: new CombatAttributeSet(),
      index: compileCombatBuffDefinitions(
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
    });
    expect(runtime.entityBlackboard.snapshot()).toEqual({});
    runtime.apply({ buffId: 'system', sourceId: 'ability-entity:1', blackboardValues: {} });
    expect(amounts).toEqual([7]);
    const value = skill(sequence(spawn('empty', { lifetime: { kind: 'infinite' } })), {
      systemValue: 99,
    });
    expect(
      pruneUnusedSkillValues(value, new Set(), createEntityUsageContext({}, shared())).report
        .removedInitialKeys,
    ).toEqual(['systemValue']);
  });

  it('Buff 属性以外的伤害条件、护盾和治疗也可能读宿主板', () => {
    const usage = analyzeBuffDefinitionUsage({
      stackingType: 'unlimited',
      durationSeconds: { blackboardKey: 'duration' },
      damageModifiers: [
        {
          enabledSide: 'attacker',
          condition: {
            kind: 'buffBlackboardCompare',
            left: { blackboardKey: 'gate' },
            right: 0,
            operator: 'greater',
          },
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

  it('生成适配器仅在完整上下文下裁剪，report 和 off 返回原对象', () => {
    const value = skill(sequence(spawn('entity')), { value: 7, unused: 99 });
    const operator = fixtureOperator(value, {
      entity: {
        lifetime: { kind: 'infinite' },
        childSkill: {
          skillId: 'child',
          scheduledSequences: [{ startFrame: 0, sequence: sequence(spend('value')) }],
        },
      },
    });
    const usage = collectSharedEntityValueUsage(input({ operators: [operator] }));
    expect(
      optimizeOperatorDefinitionPrograms(operator, 'apply').report.skillValues[0]?.retainedReason,
    ).toBe('unresolved-blackboard-access');
    const result = optimizeOperatorDefinitionPrograms(operator, 'apply', usage);
    expect(result.report.skillValues[0]?.removedInitialKeys).toEqual(['unused']);
    const report = optimizeOperatorDefinitionPrograms(operator, 'report', usage);
    expect(report.operator).toBe(operator);
    expect(report.report.skillValues).toEqual(result.report.skillValues);
    expect(optimizeOperatorDefinitionPrograms(operator, 'off', usage).operator).toBe(operator);
  });
});
