import { expect, it } from 'vitest';
import type { SkillGlobalBuffDefinition } from '../../../game-data/operatorDefinition';
import { LogicalAbilityEntityRuntime } from '../../abilities/logicalAbilityEntityRuntime';
import { ActionBlackboard } from '../../actions/actionBlackboard';
import { CombatAttributeSet } from '../../attributes/combatAttributes';
import { BuffDefinitionOperationTarget } from '../../buffs/buffDefinitionOperationTarget';
import type { CombatBuffDefinitionEntry } from '../../buffs/combatBuffDefinitions';
import { CombatBuffContainer, type CombatBuffDefinition } from '../../buffs/combatBuffs';
import { GlobalBuffRuntime } from '../../buffs/globalBuffRuntime';
import type { BuffContainerState } from '../../state/instanceState';
import { createGlobalBuffState } from '../../state/instanceState';
import {
  bindRestoredAbilityEntityBuffTargets,
  collectRestoredCombatBuffTargets,
  CombatBuffRestoration,
} from './combatBuffRestoration';

const compile = (entry: CombatBuffDefinitionEntry): CombatBuffDefinition<string> => ({
  id: entry.id,
  stackingType: entry.stackingType,
  durationSeconds: entry.durationSeconds,
});

function restoreTarget(ownerId: string, state: BuffContainerState<string>) {
  const container = new CombatBuffContainer(
    ownerId,
    new CombatAttributeSet<string>(state.attributes),
    undefined,
    null,
    ActionBlackboard.bindRuntimeState(state.entityBlackboard),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    state,
  );
  return new BuffDefinitionOperationTarget(container, { get: () => undefined, compile });
}

it('整场 Buff 恢复按定义所有者绑定同名实例，并从当前实体接回来源属性', () => {
  const firstContainer = new CombatBuffContainer<string>('first', new CombatAttributeSet<string>());
  const secondAttributes = new CombatAttributeSet<string>();
  secondAttributes.define('attack', 77, {});
  const secondContainer = new CombatBuffContainer<string>('second', secondAttributes);
  const first = new BuffDefinitionOperationTarget(firstContainer, {
    get: () => undefined,
    compile,
  });
  const firstDefinition = { stackingType: 'refresh', durationSeconds: 5 } as const;
  const secondDefinition = { stackingType: 'refresh', durationSeconds: 9 } as const;
  first.apply({
    buffId: 'shared',
    definition: firstDefinition,
    sourceId: 'second',
    definitionOwnerId: 'first',
    blackboardValues: {},
    sourceAttributeOwnerId: 'second',
    getSourceAttributeValue: attribute => secondAttributes.get(attribute),
  });
  const restoredFirst = restoreTarget('first', structuredClone(firstContainer.runtimeState));
  const restoredSecond = restoreTarget('second', structuredClone(secondContainer.runtimeState));
  const globalBuffs = new GlobalBuffRuntime(
    () => [restoredFirst, restoredSecond],
    () => undefined,
    null,
    null,
    createGlobalBuffState(),
  );
  const requestedDefinitions: string[] = [];
  const restoration = new CombatBuffRestoration({
    targets: new Map([
      ['first', restoredFirst],
      ['second', restoredSecond],
    ]),
    globalBuffs,
    resolveDefinition: (ownerId, id) => {
      requestedDefinitions.push(`${ownerId}:${id}`);
      return ownerId === 'first' && id === 'shared'
        ? firstDefinition
        : ownerId === 'second' && id === 'shared'
          ? secondDefinition
          : undefined;
    },
    resolveGlobalDefinition: () => undefined,
  });

  restoration.bindInstances();
  restoration.bindRelations();

  expect(requestedDefinitions).toEqual(['first:shared']);
  expect(restoredFirst.findFirstByIds(['shared'])?.remainingDuration).toBe(5);
  expect(() => restoration.bindRelations()).toThrow("Buff restoration phase is 'relationsBound'");
});

it('来源属性实体缺失时使整个候选进入失败状态', () => {
  const originalContainer = new CombatBuffContainer<string>(
    'first',
    new CombatAttributeSet<string>(),
  );
  const original = new BuffDefinitionOperationTarget(originalContainer, {
    get: () => undefined,
    compile,
  });
  const definition = { stackingType: 'unique' } as const;
  original.apply({
    buffId: 'source-bound',
    definition,
    sourceId: 'missing',
    blackboardValues: {},
    getSourceAttributeValue: () => 1,
  });
  const restored = restoreTarget('first', structuredClone(originalContainer.runtimeState));
  const restoration = new CombatBuffRestoration({
    targets: new Map([['first', restored]]),
    globalBuffs: new GlobalBuffRuntime(
      () => [restored],
      () => undefined,
      null,
      null,
      createGlobalBuffState(),
    ),
    resolveDefinition: () => definition,
    resolveGlobalDefinition: () => undefined,
  });

  expect(() => restoration.bindInstances()).toThrow("source attribute owner 'missing' is missing");
  expect(() => restoration.bindInstances()).toThrow("Buff restoration phase is 'failed'");
});

it('普通实例完成后接回全局父实例，结束父层只清理恢复分支子 Buff', () => {
  const originalContainer = new CombatBuffContainer<string>(
    'member',
    new CombatAttributeSet<string>(),
  );
  const originalTarget = new BuffDefinitionOperationTarget(originalContainer, {
    get: () => undefined,
    compile,
  });
  const childDefinition = { stackingType: 'unlimited' } as const;
  const globalDefinition: SkillGlobalBuffDefinition = {
    stackingType: 'unlimited',
    durationSeconds: 10,
    blackboard: {},
    children: [{ buffId: 'child', blackboardAssignments: {} }],
  };
  const originalGlobal = new GlobalBuffRuntime(
    () => [originalTarget],
    () => childDefinition,
  );
  originalGlobal.add({
    id: 'global',
    definition: globalDefinition,
    sourceId: 'member',
    blackboardValues: {},
  });
  const saved = structuredClone({
    member: originalContainer.runtimeState,
    global: originalGlobal.runtimeState,
  });
  const restoredTarget = restoreTarget('member', saved.member);
  const restoredGlobal = new GlobalBuffRuntime(
    () => [restoredTarget],
    () => childDefinition,
    null,
    null,
    saved.global,
  );
  const restoration = new CombatBuffRestoration({
    targets: new Map([['member', restoredTarget]]),
    globalBuffs: restoredGlobal,
    resolveDefinition: (ownerId, id) =>
      ownerId === 'member' && id === 'child' ? childDefinition : undefined,
    resolveGlobalDefinition: (_sourceId, id) => (id === 'global' ? globalDefinition : undefined),
  });

  restoration.bindInstances();
  restoration.bindRelations();
  restoredGlobal.finishInstance(saved.global.groups.get('global')![0]!, 'early');

  expect(saved.global.groups.get('global')![0]!.finished).toBe(true);
  expect(restoredTarget.getCountByIds(['child'])).toBe(0);
  expect(originalGlobal.runtimeState.groups.get('global')![0]!.finished).toBe(false);
});

it('按能力实体目录重建已存在的 Buff 目标，并绑定同一实体黑板', () => {
  const originalEntities = new LogicalAbilityEntityRuntime({});
  const target = originalEntities.spawn({
    abilityEntityId: 'summon',
    definition: {
      lifetime: { kind: 'limited', durationSeconds: 10 },
      bornTags: ['Object/AbilityEntity/Test'],
    },
    ownerId: 'operator',
    source: { kind: 'operator', operatorId: 'operator' },
  });
  if (target.kind !== 'abilityEntity') throw new Error('test entity was not created');
  const originalState = originalEntities.runtimeState.instances.get(target.instanceId)!;
  const originalContainer = new CombatBuffContainer(
    `ability-entity:${target.instanceId}`,
    new CombatAttributeSet<string>(),
    undefined,
    null,
    originalEntities.entityBlackboard(target),
  );
  originalContainer.addEntityTags(originalState.definition.bornTags ?? []);
  originalState.buffContainerCreated = true;
  originalState.buffs = originalContainer.runtimeState;
  const saved = structuredClone(originalEntities.runtimeState);
  const restoredEntities = new LogicalAbilityEntityRuntime({ restoredState: saved });

  const restored = bindRestoredAbilityEntityBuffTargets(
    restoredEntities,
    (entityId, blackboard, currentTarget, bornTags, state) => {
      expect(entityId).toBe(`ability-entity:${target.instanceId}`);
      expect(currentTarget).toEqual(target);
      expect(bornTags).toEqual(['Object/AbilityEntity/Test']);
      const container = new CombatBuffContainer(
        entityId,
        new CombatAttributeSet<string>(state.attributes),
        undefined,
        null,
        blackboard,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        state,
      );
      return new BuffDefinitionOperationTarget(container, {
        get: () => undefined,
        compile,
      });
    },
  );

  expect(restored.get(target.instanceId)!.runtimeState).toBe(
    saved.instances.get(target.instanceId)!.buffs,
  );
  expect(restored.get(target.instanceId)!.runtimeState!.entityBlackboard).toBe(
    saved.instances.get(target.instanceId)!.blackboard,
  );
  const invalid = structuredClone(saved);
  invalid.instances.get(target.instanceId)!.buffs = null;
  expect(() =>
    bindRestoredAbilityEntityBuffTargets(
      new LogicalAbilityEntityRuntime({ restoredState: invalid }),
      () => {
        throw new Error('must not create');
      },
    ),
  ).toThrow('created Buff container has no saved data');
});

it('完整目标目录只接受直接绑定候选数据的敌人、干员和能力实体外壳', () => {
  const enemyState = structuredClone(
    new CombatBuffContainer<string>('enemy', new CombatAttributeSet<string>()).runtimeState,
  );
  const operatorState = structuredClone(
    new CombatBuffContainer<string>('operator', new CombatAttributeSet<string>()).runtimeState,
  );
  const enemy = restoreTarget('enemy', enemyState);
  const operator = restoreTarget('operator', operatorState);
  const originalEntities = new LogicalAbilityEntityRuntime({});
  const entityTarget = originalEntities.spawn({
    abilityEntityId: 'summon',
    definition: { lifetime: { kind: 'limited', durationSeconds: 10 } },
    ownerId: 'operator',
    source: { kind: 'operator', operatorId: 'operator' },
  });
  if (entityTarget.kind !== 'abilityEntity') throw new Error('test entity was not created');
  const entityState = originalEntities.runtimeState.instances.get(entityTarget.instanceId)!;
  const entityContainer = new CombatBuffContainer(
    `ability-entity:${entityTarget.instanceId}`,
    new CombatAttributeSet<string>(),
    undefined,
    null,
    originalEntities.entityBlackboard(entityTarget),
  );
  entityState.buffContainerCreated = true;
  entityState.buffs = entityContainer.runtimeState;
  const entities = new LogicalAbilityEntityRuntime({
    restoredState: structuredClone(originalEntities.runtimeState),
  });
  const createAbilityEntityTarget: Parameters<
    typeof collectRestoredCombatBuffTargets
  >[0]['createAbilityEntityTarget'] = (entityId, _blackboard, _target, _bornTags, state) =>
    restoreTarget(entityId, state);

  const targets = collectRestoredCombatBuffTargets({
    enemyState,
    enemyTarget: enemy,
    operatorStates: new Map([['operator', operatorState]]),
    operatorTargets: new Map([['operator', operator]]),
    abilityEntities: entities,
    createAbilityEntityTarget,
  });

  expect([...targets.keys()]).toEqual([
    'enemy',
    'operator',
    `ability-entity:${entityTarget.instanceId}`,
  ]);
  expect(() =>
    collectRestoredCombatBuffTargets({
      enemyState,
      enemyTarget: enemy,
      operatorStates: new Map([['operator', operatorState]]),
      operatorTargets: new Map([
        ['operator', restoreTarget('operator', structuredClone(operatorState))],
      ]),
      abilityEntities: entities,
      createAbilityEntityTarget,
    }),
  ).toThrow("restored Buff target 'operator' does not bind its saved state");
  expect(() =>
    collectRestoredCombatBuffTargets({
      enemyState,
      enemyTarget: enemy,
      operatorStates: new Map(),
      operatorTargets: new Map([['operator', operator]]),
      abilityEntities: entities,
      createAbilityEntityTarget,
    }),
  ).toThrow("restored Buff target 'operator' has no operator state");
});
