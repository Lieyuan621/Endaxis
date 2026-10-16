import { TargetContextOperationExecutor } from '../../../src/core/combat/abilities/targetContextOperationExecutor';
import { RuntimeTargetContext } from '../../../src/core/combat/abilities/runtimeTargetContext';
import { parseTargetReferenceSource } from '../src/source/target.ts';
import {
  compileEventCondition,
  projectActionTargetQuery,
} from '../src/compiler/conditions/combatConditionProjection.ts';
import {
  compileCombatActionSequenceSource,
  compileCombatConditionSequenceSource,
} from '../src/compiler/buffs/buffRuntimeProjection.ts';
import { isPresentationOnlyActionSequence } from '../src/compiler/skills/skillPresentationTargets.ts';
import { parseKnownNativeActionSequenceSource } from '../src/source/actionLeaf.ts';
import { createActionGraphBuilder } from '../src/compiler/actions/actionGraphBuilder.ts';
import { extractGraphDataNodes } from '../src/compiler/extractGraphDataNodes.ts';
import type { CompiledBuffStepSource } from '../src/compiler/actions/combatActionProjectionTypes.ts';
import { createActionGraphCompilation } from '../../../src/core/compiler/compileActionGraph';
import { CombatActionSequenceRuntime } from '../../../src/core/combat/actions/combatActionSequenceRuntime';
import { ActionBlackboardOperationExecutor } from '../../../src/core/combat/actions/actionBlackboardOperationExecutor';
import { ActionBlackboard } from '../../../src/core/combat/actions/actionBlackboard';
import { describe, expect, it } from 'vitest';

import { parseConditionLeafSource } from '../src/index.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const CONDITION_META = {
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 2,
} as const;

const TARGET_CONTEXT = {
  actionOwnerTarget: 'caster',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'actionInputTarget',
} as const;

describe('公共条件叶子 IR', () => {
  it('实体技能中的当前主控技能检查不读取来源干员或事件技能', () => {
    const source = parseKnownNativeActionSequenceSource(
      {
        actionData: [
          condition('CheckSkillType', {
            checkTargetCurSkill: true,
            skillOwner: targetFixture('MainCharacter'),
            mustBeforeExclusiveTime: false,
            attackTypeMask: 'All',
            skillTypeList: ['BreakingAttack', 'Dodge'],
            normalSkillSubTypeFilter: 'Any',
          }),
        ],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      'skill.main-character',
      {},
    );
    expect(
      compileEventCondition(
        source.actions[0]!,
        {
          actionOwnerTarget: 'currentAbilityEntity',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
          graph: createActionGraphBuilder(),
        },
        new Map(),
      ),
    ).toEqual({
      kind: 'currentSkillTypeIn',
      target: 'controlledOperator',
      skillTypes: ['finisher', 'dodge'],
    });
  });

  it('转移来源查询保留部位标签和写入目标组，不按施法来源折叠', () => {
    const source = parseKnownNativeActionSequenceSource(
      {
        actionData: [
          {
            ...CONDITION_META,
            $type: 'Beyond.Gameplay.Core.CheckDamageTransferredSource+Data, Gameplay.Beyond',
            tagQuery: { queryType: 'HasAny', tags: [{ tagId: 123 }] },
            contextKey: 'part',
          },
        ],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      'transfer',
      {},
    );
    expect(source.actions[0]?.body).toMatchObject({
      kind: 'leaf',
      value: {
        family: 'condition',
        action: {
          kind: 'damageTransferredSource',
          tagQuery: { queryType: 'hasAny', tagIds: [123] },
          contextKey: 'part',
        },
      },
    });
    expect(isPresentationOnlyActionSequence(source)).toBe(false);
  });
  it('静态敌人证明用于公共目标查询，未证明的组仍在运行时读取', () => {
    const target = parseTargetReferenceSource(
      targetFixture('Context', undefined, 'targets'),
      'target',
    );
    const graph = createActionGraphBuilder<CompiledBuffStepSource>();
    expect(projectActionTargetQuery(target, { ...TARGET_CONTEXT, graph }, 'target')).toEqual({
      kind: 'context',
      key: 'targets',
    });
    expect(
      projectActionTargetQuery(
        target,
        { ...TARGET_CONTEXT, graph, staticEnemyTargetGroupKeys: new Set(['targets']) },
        'target',
      ),
    ).toEqual({ kind: 'fixed', target: 'enemy' });
    expect(
      projectActionTargetQuery(
        target,
        { ...TARGET_CONTEXT, graph, staticEnemyTargetGroupKeys: new Set(['other']) },
        'target',
      ),
    ).toEqual({ kind: 'context', key: 'targets' });
    const input = parseTargetReferenceSource(targetFixture('Target'), 'target');
    for (const actionTargetTarget of ['enemy', 'caster'] as const) {
      expect(
        projectActionTargetQuery(input, { ...TARGET_CONTEXT, graph, actionTargetTarget }, 'target'),
      ).toEqual({
        kind: 'fixed',
        target: actionTargetTarget,
      });
    }
    for (const actionTargetTarget of ['actionInputTarget', 'eventTarget', 'eventSource'] as const) {
      expect(
        projectActionTargetQuery(input, { ...TARGET_CONTEXT, graph, actionTargetTarget }, 'target'),
      ).toEqual({
        kind: 'inputTarget',
      });
    }
  });

  it('Target 对象类型检查读取实际输入，不按外围编译上下文折成常量', () => {
    const source = parseKnownNativeActionSequenceSource(
      {
        actionData: [
          {
            ...CONDITION_META,
            $type: 'Beyond.Gameplay.Core.Conditions.CheckObjectTypeMatch+Data, Gameplay.Beyond',
            target: targetFixture('Target'),
            objectTypeMask: 'Character',
          },
        ],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      'type-check',
      {},
    );
    for (const actionTargetTarget of ['enemy', 'currentOperator', 'eventTarget'] as const) {
      expect(
        compileEventCondition(
          source.actions[0]!,
          {
            ...TARGET_CONTEXT,
            actionTargetTarget,
            graph: createActionGraphBuilder<CompiledBuffStepSource>(),
          },
          new Map(),
        ),
      ).toEqual({ kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['character'] });
    }
  });
  it('查找主目标：缺宿主保留旧组，空结果覆盖旧组，敌方宿主仍查询全局主目标', () => {
    let hasTarget = true;
    const executor = new TargetContextOperationExecutor(
      'operator',
      {
        execute: () => true,
        evaluate: () => false,
      },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        mainTarget: () => (hasTarget ? { kind: 'enemy' } : undefined),
        ownerSpawned: () => [],
      },
    );
    const targets = new RuntimeTargetContext();
    targets.set('result', [{ kind: 'operator', operatorId: 'old' }]);
    const step = {
      kind: 'findTargets',
      parameters: {
        owner: { kind: 'owner' },
        query: { kind: 'mainTarget', owner: { kind: 'owner' } },
        saveToContextKey: 'result',
      },
    } as const;
    const context = { blackboard: new ActionBlackboard(), targetContext: targets };
    expect(executor.execute(step, context)).toBe(false);
    expect(targets.get('result')).toEqual([{ kind: 'operator', operatorId: 'old' }]);
    expect(executor.execute(step, { ...context, actionOwnerId: 'enemy' })).toBe(true);
    expect(targets.get('result')).toEqual([{ kind: 'enemy' }]);
    hasTarget = false;
    expect(executor.execute(step, { ...context, actionOwnerId: 'enemy' })).toBe(true);
    expect(targets.get('result')).toEqual([]);
  });
  it('队伍查询保留原生倒序并按动作宿主排除，而不是按定义干员排除', () => {
    const executor = new TargetContextOperationExecutor(
      'first',
      {
        execute: () => true,
        evaluate: () => false,
      },
      undefined,
      {
        listOperatorIds: () => ['first', 'second', 'third'],
        isOperatorControlled: () => false,
        resolveVitals: () => {
          throw new Error('unexpected vitals query');
        },
      },
    );
    const context = { blackboard: new ActionBlackboard(), actionOwnerId: 'second' };
    expect(executor.queryTargets({ kind: 'characterTeam', excludeOwner: false }, context)).toEqual(
      ['third', 'second', 'first'].map(operatorId => ({ kind: 'operator', operatorId })),
    );
    expect(executor.queryTargets({ kind: 'characterTeam', excludeOwner: true }, context)).toEqual(
      ['third', 'first'].map(operatorId => ({ kind: 'operator', operatorId })),
    );
  });
  it('全局主目标不读取输入目标或残留目标组，也不按动作宿主改选友方', () => {
    const target = parseTargetReferenceSource(
      { ...targetFixture('MainTarget'), targetGroupKey: 'stale' },
      'target',
    );
    const query = projectActionTargetQuery(
      target,
      {
        ...TARGET_CONTEXT,
        graph: createActionGraphBuilder<CompiledBuffStepSource>(),
      },
      'target',
    );
    const executor = new TargetContextOperationExecutor('operator', {
      execute: () => true,
      evaluate: () => false,
    });
    expect(
      executor.queryTargets(query, {
        blackboard: new ActionBlackboard(),
        actionOwnerId: 'enemy',
        actionInputTarget: { kind: 'operator', operatorId: 'operator' },
      }),
    ).toEqual([{ kind: 'enemy' }]);
  });
  it('原始 SkillData 的技能类型数字枚举与已解码名称一致', () => {
    const payload = {
      checkTargetCurSkill: false,
      skillOwner: targetFixture('Owner'),
      mustBeforeExclusiveTime: false,
      attackTypeMask: 'All',
    };
    const numeric = parseConditionLeafSource(
      condition('CheckSkillType', {
        ...payload,
        skillTypeList: [2, 6],
        normalSkillSubTypeFilter: 2,
      }),
      'SkillData.native.condition',
      {},
    );
    const named = parseConditionLeafSource(
      condition('CheckSkillType', {
        ...payload,
        skillTypeList: ['NormalSkill', 'ComboSkill'],
        normalSkillSubTypeFilter: 'AdditionalNormalSkill',
      }),
      'SkillData.named.condition',
      {},
    );
    expect(numeric).toEqual(named);
    expect(named).toMatchObject({ normalSkillSubTypeFilter: 'AdditionalNormalSkill' });
  });
  it('原始 SkillData 的伤害分类比较枚举与已解码名称一致', () => {
    const numeric = parseConditionLeafSource(
      condition('CheckDamageDecorateMask', { checkType: 2, mask: 256 }),
      'SkillData.native.condition',
      {},
    );
    const named = parseConditionLeafSource(
      condition('CheckDamageDecorateMask', { checkType: 'HasAll', mask: 256 }),
      'SkillData.named.condition',
      {},
    );
    expect(numeric).toMatchObject({ kind: 'damageDecorateMask', checkType: 'HasAll', mask: 256 });
    expect(numeric).toEqual(named);
  });
  it('严格保留 OnObtainAtb 的获取类型与方式筛选', () => {
    expect(
      parseConditionLeafSource(
        condition('CheckObtainAtbType', {
          checkObtainType: true,
          obtainTypeList: ['Skill'],
          checkObtainMethod: true,
          obtainMethodList: ['Gain'],
        }),
        'fixture.obtainAtbType',
        {},
      ),
    ).toMatchObject({
      kind: 'obtainAtbType',
      checkObtainType: true,
      obtainTypes: ['Skill'],
      checkObtainMethod: true,
      obtainMethods: ['Gain'],
    });
  });

  it('保留被动 CheckCurHpRatio 的比较与黑板阈值', () => {
    expect(
      parseConditionLeafSource(
        {
          $type: 'Beyond.Gameplay.Core.Abilities.Condition.CheckCurHpRatio, Gameplay.Beyond',
          compareType: 'GE',
          value: scalarFixture(0, 'hp_ratio'),
        },
        'passive.toggle.conditions[0]',
        { hp_ratio: [0.5, 1] },
      ),
    ).toMatchObject({
      kind: 'currentHpRatio',
      comparison: 'GE',
      value: { blackboardKey: 'hp_ratio', levelValues: [0.5, 1] },
    });
  });

  it('保留能力实体剩余时长的比较和目标', () => {
    expect(
      parseConditionLeafSource(
        condition('CheckAbilityEntityCurDuration', {
          abilityEntity: targetFixture('Target'),
          compareType: 'LT',
          value: scalarFixture(3),
          saveCurDuration: false,
          bbKey: '',
        }),
        'fixture.condition',
        {},
      ),
    ).toMatchObject({
      kind: 'abilityEntityDuration',
      comparison: 'LT',
      target: { targetSource: 'Target' },
      value: { value: 3 },
    });
  });

  it('未知条件携带原生类型明确阻塞', () => {
    expect(() =>
      parseConditionLeafSource(condition('UnknownNativeCondition', {}), 'fixture.condition', {}),
    ).toThrow('condition parser has not migrated "UnknownNativeCondition"');
  });

  it('按判别字段解析 Advanced 事件 Buff 条件', () => {
    const fixture = (blackboardKey = '', buffIdList: readonly unknown[] = []) =>
      condition('CheckBuffIdInContextAdvanced', {
        checkType: 'Tag',
        buffIdList,
        query: { queryType: 'HasAny', tags: [{ tagId: -1558844517 }] },
        blackboardKey,
      });
    expect(parseConditionLeafSource(fixture(), 'fixture.contextBuffAdvanced', {})).toMatchObject({
      kind: 'contextBuff',
      sourceType: 'CheckBuffIdInContextAdvanced',
      matcher: {
        kind: 'tag',
        queryType: 'hasAny',
        buffTagIds: [-1558844517],
      },
    });
    expect(
      parseConditionLeafSource(
        fixture('buffid', [{ useBlackboardKey: false, value: '', blackboardKey: '' }]),
        'fixture.contextBuffAdvanced',
        {},
      ),
    ).toMatchObject({ buffIdOutputKey: 'buffid' });
    expect(
      parseConditionLeafSource(
        condition('CheckBuffIdInContextAdvanced', {
          checkType: 'Id',
          buffIdList: [{ useBlackboardKey: true, value: '', blackboardKey: 'id' }],
          query: { queryType: 'HasAny', tags: [] },
          blackboardKey: '',
        }),
        'fixture.contextBuffAdvanced',
        {},
      ),
    ).toMatchObject({ matcher: { kind: 'id', buffIds: [{ kind: 'blackboard', key: 'id' }] } });
  });

  it('按 checkType 忽略基础事件 Buff 条件的非活动字段', () => {
    expect(
      parseConditionLeafSource(
        condition('CheckBuffIdInContext', {
          checkType: 'Tag',
          buffIdList: [{ buffId: 'stale.serialized.id' }],
          query: { queryType: 'HasAny', tags: [{ tagId: -1480463572 }] },
          blackboardKey: '',
        }),
        'fixture.contextBuff',
        {},
      ),
    ).toMatchObject({
      kind: 'contextBuff',
      matcher: { kind: 'tag', queryType: 'hasAny', buffTagIds: [-1480463572] },
    });
  });

  it.each([
    ['CheckConsumeBuffLayer', 'consumeBuffLayer'],
    ['CheckBuffEnhanceChangedLayer', 'buffEnhanceLayer'],
  ])('%s 保留事件层数比较和值写回键', (sourceType, kind) => {
    expect(
      parseConditionLeafSource(
        condition(sourceType, {
          num: scalarFixture(0, 'minimum_layer'),
          compareType: 'GE',
          storeKey: 'consume_layer',
        }),
        'fixture.consumeBuffLayer',
        { minimum_layer: [1, 2] },
      ),
    ).toEqual({
      kind,
      sourceType,
      comparison: 'GE',
      value: {
        value: 0,
        blackboardKey: 'minimum_layer',
        levelValues: [1, 2],
      },
      outputKey: 'consume_layer',
    });
  });

  it('CompareString 严格保留两个字符串黑板操作数', () => {
    expect(
      parseConditionLeafSource(
        condition('CompareString', {
          valueA: { useBlackboardKey: true, value: 'owner_type', blackboardKey: 'owner_type' },
          valueB: { useBlackboardKey: true, value: '', blackboardKey: 'team_type' },
        }),
        'fixture.compareString',
        {},
      ),
    ).toEqual({
      kind: 'stringCompare',
      sourceType: 'CompareString',
      left: { value: 'owner_type', blackboardKey: 'owner_type' },
      right: { value: '', blackboardKey: 'team_type' },
    });
  });

  it('严格解析物理异常事件类型位集并保留 savedKey 边界', () => {
    expect(
      parseConditionLeafSource(
        condition('CheckPhysicalInflictionType', {
          mask: 'Fracture, Crush',
          savedKey: '',
        }),
        'fixture.physicalInflictionType',
        {},
      ),
    ).toMatchObject({
      kind: 'physicalInflictionType',
      types: ['fracture', 'crush'],
      savedKey: '',
    });
    expect(() =>
      parseConditionLeafSource(
        condition('CheckPhysicalInflictionType', { mask: 'Unknown', savedKey: '' }),
        'fixture.physicalInflictionType',
        {},
      ),
    ).toThrow("unknown physical infliction flag 'Unknown'");
  });
});

function condition(sourceType: string, fields: Record<string, unknown>): Record<string, unknown> {
  return {
    $type: `Example.${sourceType}+Data, Example`,
    ...CONDITION_META,
    ...fields,
  };
}

it('原生角色类型读取和字符串比较保留两次调用，角色表身份在执行时读取', () => {
  const source = parseKnownNativeActionSequenceSource(
    {
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
      actionData: [
        condition('SaveCharTypeId', { target: targetFixture('Owner'), storeKey: 'type' }),
        condition('CompareString', {
          valueA: { value: '', useBlackboardKey: true, blackboardKey: 'type' },
          valueB: { value: 'Pulse', useBlackboardKey: false, blackboardKey: '' },
        }),
      ],
    },
    'identity',
    {},
  );
  const graph = createActionGraphBuilder<CompiledBuffStepSource>();
  const entry = compileCombatActionSequenceSource(
    source,
    {
      graph,
      actionOwnerTarget: 'caster',
      actionSourceTarget: 'caster',
      actionTargetTarget: 'enemy',
    },
    new Set(),
  );
  const formal = extractGraphDataNodes(graph.finish());
  expect(
    Object.values(formal.nodes)
      .map(node => node.action.kind)
      .sort(),
  ).toEqual(['checkCondition', 'storeCharacterTypeId']);
  expect(
    Object.values(formal.dataNodes ?? {})
      .map(node => node.type)
      .sort(),
  ).toEqual(['boolean', 'string']);
  const compiled = createActionGraphCompilation(formal, 1).compileEntry(entry, 'compare');
  let type = 'Pulse';
  const board = new ActionBlackboard();
  const sequence = new CombatActionSequenceRuntime(
    new ActionBlackboardOperationExecutor(
      {
        execute: () => false,
        evaluate: () => false,
      },
      undefined,
      undefined,
      undefined,
      undefined,
      {
        sourceId: 'caster',
        resolve: () => 'electric',
        readTypeId: () => type,
      },
    ),
    { blackboard: board },
  ).createSequence(compiled);
  expect(sequence.executeInstant({})).toBe(true);
  expect(board.getString('type')).toBe('Pulse');
  type = 'Natural';
  expect(sequence.executeInstant({})).toBe(false);
  expect(board.getString('type')).toBe('Natural');
});

it.each([false, true])('队友遍历保留独立循环和条件调用，排除 Owner=%s', excludeOwner => {
  const body = parseKnownNativeActionSequenceSource(
    {
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
      actionData: [
        condition('CompareString', {
          valueA: { value: 'Pulse', useBlackboardKey: false, blackboardKey: '' },
          valueB: { value: 'Natural', useBlackboardKey: false, blackboardKey: '' },
        }),
      ],
    },
    'body',
    {},
  );
  const graph = createActionGraphBuilder<CompiledBuffStepSource>();
  const entry = compileCombatActionSequenceSource(
    {
      ...body,
      actions: [
        {
          metadata: body.actions[0]!.metadata,
          sourcePath: 'loop',
          body: {
            kind: 'forEach',
            target: {
              ...parseTargetReferenceSource(targetFixture('Owner'), 'target'),
              targetSource: 'InstantSearch',
              finderType: 'CharacterTeamFinder',
              validatorTypes: excludeOwner ? ['ExcludeOwnerValidator'] : [],
            },
            action: body,
          },
        },
      ],
    },
    {
      graph,
      actionOwnerTarget: 'caster',
      actionSourceTarget: 'caster',
      actionTargetTarget: 'enemy',
    },
    new Set(),
  );
  const formal = graph.finish();
  const action = formal.nodes[entry.$sequence!]!.action;
  expect(action.kind).toBe('forEachContextTarget');
  if (action.kind !== 'forEachContextTarget') throw new Error('missing loop');
  expect(action.parameters).toEqual({ targets: { kind: 'characterTeam', excludeOwner } });
  expect(formal.nodes[action.body.$sequence!]!.action.kind).toBe('checkCondition');
});

it('仍影响返回结果的方向夹角条件拒绝发布，不以零度代算', () => {
  const graph = createActionGraphBuilder<CompiledBuffStepSource>();
  const source = parseKnownNativeActionSequenceSource(
    {
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
      actionData: [
        condition('CheckTwoDirectionAngle', {
          dir1Source: targetFixture('Source'),
          dir1Target: targetFixture('Target'),
          dir1DirectionType: 'CameraForward',
          dir2Source: { ...targetFixture('Context'), targetGroupKey: 'MainChar' },
          dir2Target: targetFixture('Target'),
          dir2DirectionType: 'SourceToTarget',
          compareType: 'LT',
          value: scalarFixture(0, 'threshold'),
        }),
      ],
    },
    'angle',
    { threshold: [0] },
  );
  compileCombatConditionSequenceSource(
    source,
    {
      graph,
      actionOwnerTarget: 'caster',
      actionSourceTarget: 'caster',
      actionTargetTarget: 'enemy',
    },
    new Set(),
  );
  expect(() => extractGraphDataNodes(graph.finish())).toThrow(
    'twoDirectionAngleCompare still affects combat and cannot be published',
  );
});

it('仍影响结果的目标朝向检查拒绝发布', () => {
  const graph = createActionGraphBuilder<CompiledBuffStepSource>();
  const source = parseKnownNativeActionSequenceSource(
    {
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
      actionData: [
        condition('CheckTargetAngle', {
          origin: { ...targetFixture('Context'), targetGroupKey: 'origin' },
          target: targetFixture('Owner'),
          angleType: 'TargetBackward',
          angle: scalarFixture(0, 'angle'),
        }),
      ],
    },
    'facing',
    { angle: [0] },
  );
  compileCombatConditionSequenceSource(
    source,
    {
      graph,
      actionOwnerTarget: 'caster',
      actionSourceTarget: 'caster',
      actionTargetTarget: 'enemy',
    },
    new Set(),
  );
  expect(() => extractGraphDataNodes(graph.finish())).toThrow(
    'targetFacingAngle still affects combat and cannot be published',
  );
});

it('距离检查保留一个原生调用，查询在每次执行时读取，空组不能折叠成零距离', () => {
  const graph = createActionGraphBuilder<CompiledBuffStepSource>();
  const source = parseKnownNativeActionSequenceSource(
    {
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
      actionData: [
        {
          ...CONDITION_META,
          $type: 'Beyond.Gameplay.Core.CheckDistanceCondition+Data, Gameplay.Beyond',
          source: targetFixture('Owner'),
          target: targetFixture('Context', undefined, 'target'),
          distance: 0,
          lessThan: true,
          includeTargetRadius: true,
          containsHittableObj: false,
        },
      ],
    },
    'distance',
    {},
  );
  const entry = compileCombatConditionSequenceSource(source, {
    graph,
    actionOwnerTarget: 'caster',
    actionSourceTarget: 'caster',
    actionTargetTarget: 'enemy',
  });
  const formal = extractGraphDataNodes(graph.finish());
  expect(Object.values(formal.nodes).map(node => node.action.kind)).toEqual(['checkCondition']);
  const compiled = createActionGraphCompilation(formal, 1).compileEntry(entry, 'distance');
  const targets = new RuntimeTargetContext();
  const runtime = new CombatActionSequenceRuntime(
    new TargetContextOperationExecutor('owner', {
      execute: () => true,
      evaluate: () => {
        throw new Error('unhandled condition');
      },
    }),
    { blackboard: new ActionBlackboard(), targetContext: targets, actionOwnerId: 'owner' },
  ).createSequence(compiled);
  expect(runtime.executeInstant({})).toBe(false);
  targets.set('target', [{ kind: 'enemy' }]);
  expect(runtime.executeInstant({})).toBe(true);
  targets.set('target', []);
  expect(runtime.executeInstant({})).toBe(false);
});

it('方向夹角保留为分析动作，未经用途裁剪不得进入正式图', () => {
  const graph = createActionGraphBuilder<CompiledBuffStepSource>();
  const source = parseKnownNativeActionSequenceSource(
    {
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
      actionData: [
        {
          ...CONDITION_META,
          $type: 'Beyond.Gameplay.Core.SaveTwoDirectionAngle+Data, Gameplay.Beyond',
          dir1Source: targetFixture('Owner'),
          dir1Target: targetFixture('Target'),
          dir1DirectionType: 'CameraForward',
          dir2Source: targetFixture('Owner'),
          dir2Target: targetFixture('Target'),
          dir2DirectionType: 'SourceForward',
          key: 'angle',
        },
      ],
    },
    'angle',
    {},
  );
  expect(isPresentationOnlyActionSequence(source)).toBe(false);
  compileCombatActionSequenceSource(source, {
    graph,
    actionOwnerTarget: 'caster',
    actionSourceTarget: 'caster',
    actionTargetTarget: 'enemy',
  });
  expect(Object.values(graph.finish().nodes).map(node => node.action.kind)).toEqual([
    'saveTwoDirectionAngle',
  ]);
  expect(() => extractGraphDataNodes(graph.finish())).toThrow(
    'direction angle still affects combat and cannot be published',
  );
});

it.each([false, true])(
  '固定点查询保留在复制动作中，缺失宿主时覆盖为空组（贴地=%s）',
  centerToGround => {
    const graph = createActionGraphBuilder<CompiledBuffStepSource>();
    const convertFrom = targetFixture('InstantSearch', {
      finderData: {
        $type: 'Beyond.Gameplay.Core.Selector+FixedPointFinder+Data, Gameplay.Beyond',
        positionOffset: { x: 0, y: 1, z: 5 },
        rotationOffset: { x: 0, y: 0, z: 0, w: 1 },
        snapToNavmesh: false,
        sampleRadius: scalarFixture(0),
      },
      validatorData: [],
      postProcessorData: [],
    });
    convertFrom.centerToGround = centerToGround;
    const source = parseKnownNativeActionSequenceSource(
      {
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
        actionData: [
          {
            ...CONDITION_META,
            $type: 'Beyond.Gameplay.Core.ConvertToTargetContext+Data, Gameplay.Beyond',
            convertFrom: {
              ...convertFrom,
              centerType: 'ContextTarget',
              centerContextKey: 'main_char',
              selectorDirection: 'CameraForward',
            },
            targetGroupKey: 'tar',
            operationType: 'None',
            translateOperation: 'Rotate180DegAroundRef',
            translationRef: 'ActionSource',
            translationDeg: 0,
            excludeTarget: 'ActionSource',
            blackboardVector3: { x: scalarFixture(0), y: scalarFixture(0), z: scalarFixture(0) },
          },
        ],
      },
      'fixedPoint',
      {},
    );
    const entry = compileCombatActionSequenceSource(source, {
      graph,
      actionOwnerTarget: 'caster',
      actionSourceTarget: 'caster',
      actionTargetTarget: 'enemy',
    });
    const formal = extractGraphDataNodes(graph.finish());
    expect(Object.values(formal.nodes).map(node => node.action.kind)).toEqual([
      'copyContextTargets',
    ]);
    const compiled = createActionGraphCompilation(formal, 1).compileEntry(entry, 'fixedPoint');
    const targets = new RuntimeTargetContext();
    const executor = new TargetContextOperationExecutor('owner', {
      execute: () => false,
      evaluate: () => false,
    });
    const create = (actionOwnerId?: string) =>
      new CombatActionSequenceRuntime(executor, {
        blackboard: new ActionBlackboard(),
        targetContext: targets,
        actionOwnerId,
      }).createSequence(compiled);
    expect(create('owner').executeInstant({})).toBe(true);
    expect(targets.get('tar')).toEqual([{ kind: 'spatialPoint', pointId: 1 }]);
    expect(create().executeInstant({})).toBe(true);
    expect(targets.get('tar')).toEqual([]);
  },
);

it('原生实体计数每次重新查询，比较失败不写值，保留一个检查动作', () => {
  const graph = createActionGraphBuilder<CompiledBuffStepSource>();
  const source = parseKnownNativeActionSequenceSource(
    {
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
      actionData: [
        {
          ...CONDITION_META,
          $type: 'Beyond.Gameplay.Core.Conditions.CheckEntityNum+Data, Gameplay.Beyond',
          checkTarget: targetFixture('InstantSearch', {
            finderData: {
              $type: 'Beyond.Gameplay.Core.Selector+MainTargetFinder+Data, Gameplay.Beyond',
            },
            validatorData: [],
            postProcessorData: [],
          }),
          minNum: 1,
          containsHittableTarget: true,
          compareType: 'GE',
          excludeDeadEntity: true,
          storeKey: 'count',
        },
      ],
    },
    'entityCount',
    {},
  );
  const entry = compileCombatActionSequenceSource(source, {
    graph,
    actionOwnerTarget: 'caster',
    actionSourceTarget: 'caster',
    actionTargetTarget: 'enemy',
  });
  const formal = extractGraphDataNodes(graph.finish());
  expect(Object.values(formal.nodes).map(node => node.action.kind)).toEqual(['checkCondition']);
  const compiled = createActionGraphCompilation(formal, 1).compileEntry(entry, 'count');
  let alive = false;
  const board = new ActionBlackboard({ count: 7 });
  const runtime = new CombatActionSequenceRuntime(
    new TargetContextOperationExecutor(
      'owner',
      { execute: () => false, evaluate: () => false },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        mainTarget: () => ({ kind: 'enemy' }),
        ownerSpawned: () => [],
        entityLifeState: () => (alive ? 'alive' : 'dead'),
      },
    ),
    { blackboard: board, targetContext: new RuntimeTargetContext(), actionOwnerId: 'owner' },
  ).createSequence(compiled);
  expect(runtime.executeInstant({})).toBe(false);
  expect(board.getNumber('count')).toBe(7);
  alive = true;
  expect(runtime.executeInstant({})).toBe(true);
  expect(board.getNumber('count')).toBe(1);
});

it('仍影响结果的镜头设置检查拒绝发布', () => {
  for (const desiredAlphaSetting of ['Default', 'Strong', 'Weak'] as const) {
    const source = parseKnownNativeActionSequenceSource(
      {
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
        actionData: [condition('CheckComboSkillCameraAlphaSetting', { desiredAlphaSetting })],
      },
      'cameraSetting',
      {},
    );
    const graph = createActionGraphBuilder<CompiledBuffStepSource>();
    compileCombatConditionSequenceSource(
      source,
      {
        graph,
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      },
      new Set(),
    );
    expect(() => extractGraphDataNodes(graph.finish())).toThrow(
      'comboCameraAlphaSetting still affects combat and cannot be published',
    );
  }
});

it('裁空方向分支时删除直接读取条件，但不吞掉未证明无副作用的即时查询', () => {
  const source = parseKnownNativeActionSequenceSource(
    {
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
      actionData: [
        {
          ...CONDITION_META,
          $type: 'Beyond.Gameplay.Core.IfElseAction+Data, Gameplay.Beyond',
          alwaysNext: true,
          conditionAction: {
            onlyExecuteWhenSourceIsMainChar: false,
            onlyExecuteWhenSourceIsGuard: false,
            actionData: [
              condition('CheckTwoDirectionAngle', {
                dir1Source: targetFixture('Source'),
                dir1Target: targetFixture('Target'),
                dir1DirectionType: 'CameraForward',
                dir2Source: targetFixture('Source'),
                dir2Target: targetFixture('Target'),
                dir2DirectionType: 'SourceToTarget',
                compareType: 'LT',
                value: scalarFixture(0),
              }),
            ],
          },
          succeedActions: {
            onlyExecuteWhenSourceIsMainChar: false,
            onlyExecuteWhenSourceIsGuard: false,
            actionData: [],
          },
          failActions: {
            onlyExecuteWhenSourceIsMainChar: false,
            onlyExecuteWhenSourceIsGuard: false,
            actionData: [],
          },
        },
      ],
    },
    'unused-angle',
    {},
  );
  const compile = () => {
    const graph = createActionGraphBuilder<CompiledBuffStepSource>();
    return compileCombatActionSequenceSource(
      source,
      {
        graph,
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      },
      new Set(),
    );
  };
  expect(compile().$sequence).toBeNull();
  const branch = source.actions[0]!;
  if (branch.body.kind !== 'ifElse') throw new Error('expected branch');
  const check = branch.body.condition.actions[0]!;
  if (
    check.body.kind !== 'leaf' ||
    check.body.value.family !== 'condition' ||
    check.body.value.action.kind !== 'twoDirectionAngle'
  )
    throw new Error('expected angle');
  Object.assign(check.body.value.action.dir1Source, {
    targetSource: 'InstantSearch',
    finderType: 'RandomPointFinder',
  });
  expect(compile).toThrow('unsupported');
});
