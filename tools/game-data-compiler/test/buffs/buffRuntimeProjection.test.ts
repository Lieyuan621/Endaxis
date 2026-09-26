import { readGraphActions, readResourceActions, graphBranch } from '../support/graphAssertions.ts';
import { fixtureGameplayTagRegistry } from '../gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';

import {
  buffRuntimeReadsBlackboardKey,
  compileBuffRuntimeDefinitionSource,
  compileCombatActionSequenceSource,
  evaluateFixedFullHealthToggleCondition,
  type BuffRuntimeSource,
  type DamageActionSource,
  type TargetReferenceSource,
} from '../../src/index.ts';
import type {
  ActionGraphReference,
  ActionGraphResourceDefinition,
} from '../../../../packages/game-data-contract/src/actionGraph.ts';
import type { CombatActionProjectionContextSource } from '../../src/compiler/combatProjectionCommon.ts';
import {
  createActionGraphBuilder,
  readActionGraphChain,
} from '../../src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../../src/compiler/actions/combatActionProjectionTypes.ts';

/** 编译原生输入，保留图及入口；steps 仅列出同层动作，不展开分支引用。 */
function projectSequence(
  source: Parameters<typeof compileCombatActionSequenceSource>[0],
  context: Omit<CombatActionProjectionContextSource, 'graph'>,
  visualOnlyIds?: ReadonlySet<string>,
  extensions?: Parameters<typeof compileCombatActionSequenceSource>[3],
) {
  const builder = createActionGraphBuilder<CompiledBuffStepSource>();
  const entry = compileCombatActionSequenceSource(
    source,
    { ...context, graph: builder },
    visualOnlyIds,
    extensions,
  );
  const graph = builder.finish();
  return { entry, graph, steps: readActionGraphChain(graph, entry) };
}

/** 读取指定生命周期入口的同层动作。 */
function lifecycleSteps(
  definition:
    | {
        readonly actionGraph?: ActionGraphResourceDefinition;
        readonly lifecycleSequences?: Readonly<Record<string, ActionGraphReference>>;
      }
    | undefined,
  key: string,
) {
  return readResourceActions(definition, definition?.lifecycleSequences?.[key]);
}

import { collectBuffSpawnedAbilityEntityContextKeys } from '../../src/compiler/buffs/standardStumpBuffClosure.ts';
import type { NativeSequenceSource } from '../../src/source/controlFlow.ts';
import type { KnownNativeActionLeafSource } from '../../src/source/actionLeaf.ts';
import { buffHasNoAffixIdentityWriter } from '../../src/compiler/buffs/buffCastIdentityProof.ts';
import { compileActionNode } from '../../src/compiler/actions/combatActionLeafProjection.ts';
import { parseComboCacheActionSource } from '../../src/source/inputControlActions.ts';

describe('公共 Buff 运行时投影', () => {
  it.each([
    ['Unlimited', true],
    ['HighPriority', false],
    ['Stack', true],
    ['Enhance', false],
    ['Refresh', false],
    ['Extend', false],
    ['Modify', false],
    ['Unique', true],
    ['EnhanceAndRefresh', false],
    ['OverwriteDuration', false],
    ['EnhanceAndOverwriteDuration', false],
    ['HighPriorityWithMaxStack', false],
    ['TimedGrowingEnhance', false],
  ] as const)('只按原生叠加类型门槛加载 Buff 时间线：%s', (stackingType, expected) => {
    const fixture = sourceFixture();
    const eventSequence = fixture.graph.abilityEvents[0]!.actions[0]!;
    const source: BuffRuntimeSource = {
      ...fixture,
      graph: {
        ...fixture.graph,
        timelineActions: [
          {
            startFrame: 10,
            endFrame: 20,
            forceSyncAnimation: {
              forceSync: false,
              montageName: '',
              targetFrame: 0,
              playbackSpeed: 1,
            },
            sequence: { ...eventSequence, actions: [eventSequence.actions[1]!] },
          },
        ],
      },
      lifecycle: { ...fixture.lifecycle, stackingType },
    };

    const definition = compileBuffRuntimeDefinitionSource(source);

    expect(definition.scheduledSequences !== undefined).toBe(expected);
  });

  it('当前伊冯 DuringBuffEnable 的 Attack 映射进入可撤销动作，不被表现过滤吞掉', () => {
    // hybrid-20260905 / AKEDB 1.5.3@9913107-5，结束 Buff 的首个启用回调。
    const action = parseComboCacheActionSource(
      {
        $type: 'Beyond.Gameplay.Core.ComboCacheAction+Data, Gameplay.Beyond',
        isEnable: true,
        priorityLevel: 'Default',
        priorityOffset: 0,
        serverActionIndex: 0,
        mappingDataList: [
          {
            cmdType: 'Attack',
            skillId: 'chr_0017_yvonne_ult_attack_end',
            cacheEndByAction: true,
            clearOffsetTargetSkillIdOnEnd: true,
            overrideCacheTime: true,
            cacheTime: { useBlackboardKey: false, value: 0.5, blackboardKey: '' },
          },
        ],
      },
      'BuffData.buff_chr_0017_yvonne_ultimate_skill_end.buffEventAction[0].actions[0]',
      {},
    );
    const source = sourceFixture();
    const sequence = source.graph.abilityEvents[0]!.actions[0]!;
    const template = sequence.actions[0]!;
    const definition = compileBuffRuntimeDefinitionSource(
      {
        ...source,
        graph: {
          ...source.graph,
          abilityEvents: [],
          buffEvents: [
            {
              event: 'DuringBuffEnable',
              actions: [
                {
                  ...sequence,
                  actions: [
                    {
                      ...template,
                      body: {
                        kind: 'leaf',
                        value: { family: 'inputControl', action },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      new Set(),
      new Set(),
      {},
      undefined,
      { fixedBuffOwnerTarget: 'caster' },
    );
    expect(readResourceActions(definition, definition.lifecycleSequences?.enable)).toEqual([
      {
        kind: 'overrideBasicAttackMapping',
        parameters: { skillId: 'chr_0017_yvonne_ult_attack_end' },
      },
    ]);
    const node = {
      ...template,
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'inputControl' as const,
          action: {
            ...action,
            mappings: action.mappings.map(mapping => ({ ...mapping, cacheEndByAction: false })),
          },
        },
      },
    };
    expect(() =>
      compileActionNode(node, new Set(), new Map(), {
        actionOwnerTarget: 'buffOwner',
        fixedBuffOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
        graph: createActionGraphBuilder<CompiledBuffStepSource>(),
      }),
    ).toThrow('unsupported Buff command mapping lifetime');
  });
  it.each(['spatialPoint', 'contextOperator', 'lowestHealthRatioOperatorExceptCaster'] as const)(
    'CreateBuff 不把未解析的目标组 %s 断言成可施加目标',
    group => {
      const node = sourceFixture().graph.abilityEvents[0]!.actions[0]!.actions[1]!;
      if (node.body.kind !== 'leaf' || node.body.value.family !== 'buffApplication')
        throw new Error('missing Buff application fixture');
      const action = {
        ...node.body.value.action,
        target: { ...fixedTarget('Context'), targetGroupKey: 'recipient' },
      };
      expect(() =>
        compileActionNode(
          { ...node, body: { kind: 'leaf', value: { family: 'buffApplication', action } } },
          new Set(),
          new Map([['recipient', group]]),
          {
            actionOwnerTarget: 'buffOwner',
            actionSourceTarget: 'caster',
            actionTargetTarget: 'enemy',
            graph: createActionGraphBuilder<CompiledBuffStepSource>(),
          },
        ),
      ).toThrow('unsupported Buff target/source');
    },
  );

  it.each(['Source', 'Owner'])('当前实例结束保留原生来源：%s', finishSource => {
    const metadata = sourceFixture().graph.abilityEvents[0]!.actions[0]!.actions[0]!.metadata;
    const steps = compileActionNode(
      {
        sourcePath: 'fixture.finishEnvironment',
        metadata,
        body: {
          kind: 'leaf',
          value: {
            family: 'buffFinish',
            action: {
              kind: 'buffFinishByQuery',
              owner: fixedTarget('Owner'),
              settings: {
                checkType: 'Environment',
                buffIds: [],
                tagQuery: { queryType: 'hasAny', tagIds: [] },
              },
              finishAll: true,
              finishLayerCount: { value: 1, blackboardKey: null, levelValues: null },
              limitSource: false,
              buffSource: fixedTarget('Source'),
              isFinishedEarly: true,
              isAbsorbed: false,
              finishSource: fixedTarget(finishSource),
            },
          },
        },
      },
      new Set(),
      new Map(),
      {
        actionOwnerTarget: 'buffOwner',
        fixedBuffOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
        graph: createActionGraphBuilder<CompiledBuffStepSource>(),
      },
    );
    expect(steps).toEqual([
      {
        kind: 'finishCurrentBuff',
        parameters: {
          reason: 'early',
          finishSource: finishSource === 'Owner' ? 'actionOwner' : 'actionSource',
        },
      },
    ]);
  });
  it.each([true, false])('空目标伤害覆盖旧的静态敌人证明（alwaysNext=%s）', alwaysNext => {
    const node = sourceFixture().graph.abilityEvents[0]!.actions[0]!.actions[1]!;
    const project = () =>
      compileActionNode(
        {
          ...node,
          body: {
            kind: 'leaf',
            value: {
              family: 'damage',
              action: {
                ...simpleDamageFixture(),
                alwaysNext,
                target: { ...fixedTarget('Context'), targetGroupKey: 'tar' },
              },
            },
          },
        },
        new Set(),
        new Map([['tar', 'empty']]),
        {
          actionSourceTarget: 'caster',
          actionOwnerTarget: 'caster',
          actionTargetTarget: 'enemy',
          staticEnemyTargetGroupKeys: new Set(['tar']),
          graph: createActionGraphBuilder<CompiledBuffStepSource>(),
        },
      );
    if (alwaysNext) expect(project()).toEqual([]);
    else expect(project).toThrow('empty-target damage short-circuit');
  });

  it('施加 Buff 的 Context 接收者保留查询身份，与来源分别解析', () => {
    const node = sourceFixture().graph.abilityEvents[0]!.actions[0]!.actions[1]!;
    if (node.body.kind !== 'leaf' || node.body.value.family !== 'buffApplication')
      throw new Error('missing Buff application fixture');
    const builder = createActionGraphBuilder<CompiledBuffStepSource>();
    const steps = compileActionNode(
      {
        ...node,
        body: {
          kind: 'leaf',
          value: {
            ...node.body.value,
            action: {
              ...node.body.value.action,
              target: { ...fixedTarget('Context'), targetGroupKey: 'recipient' },
              buffSource: 'ContextTarget',
              contextKey: 'source',
            },
          },
        },
      },
      new Set(),
      new Map([
        ['recipient', 'sourceFinderResult'],
        ['source', 'sourceFinderResult'],
      ]),
      {
        actionOwnerTarget: 'buffOwner',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
        graph: builder,
      },
    );
    expect(steps).toHaveLength(1);
    const [each] = steps;
    if (each?.kind !== 'forEachContextTarget') throw new Error('expected forEachContextTarget');
    expect(each.parameters.contextKey).toBe('recipient');
    expect(readGraphActions(builder.finish(), each.body)).toMatchObject([
      {
        kind: 'applyBuff',
        parameters: { target: 'currentTarget', sourceContextKey: 'source' },
      },
    ]);
  });
  it('结束 Buff 保留 SourceFinder 的 Context 身份，不重新读取 buffSource', () => {
    const metadata = sourceFixture().graph.abilityEvents[0]!.actions[0]!.actions[0]!.metadata;
    const builder = createActionGraphBuilder<CompiledBuffStepSource>();
    const steps = compileActionNode(
      {
        sourcePath: 'fixture.finishQueriedSource',
        metadata,
        body: {
          kind: 'leaf',
          value: {
            family: 'buffFinish',
            action: {
              kind: 'buffFinishById',
              owner: { ...fixedTarget('Context'), targetGroupKey: 'queried' },
              buffIds: ['buff.fixture'],
              finishAll: true,
              finishLayerCount: { value: 1, blackboardKey: null, levelValues: null },
              limitSource: false,
              buffSource: fixedTarget('Source'),
              isFinishedEarly: false,
              finishSource: fixedTarget('Source'),
            },
          },
        },
      },
      new Set(),
      new Map([['queried', 'sourceFinderResult']]),
      {
        actionOwnerTarget: 'buffOwner',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
        graph: builder,
      },
    );
    const [each] = steps;
    if (each?.kind !== 'forEachContextTarget') throw new Error('expected forEachContextTarget');
    expect(each.parameters.contextKey).toBe('queried');
    expect(readGraphActions(builder.finish(), each.body)).toEqual([
      {
        kind: 'finishBuffsById',
        parameters: { target: 'currentTarget', buffIds: ['buff.fixture'], reason: 'other' },
      },
    ]);
  });
  it('没有 affix 写入的 Buff 事件按自身来源施法限定计数', () => {
    const source = sourceFixture();
    const sequence = source.graph.abilityEvents[0]!.actions[0]!;
    const condition = sequence.actions[0]!;
    const limited: BuffRuntimeSource = {
      ...source,
      graph: {
        ...source.graph,
        abilityEvents: [
          {
            event: 'OnBeforeCastSkill',
            actions: [
              {
                ...sequence,
                actions: [
                  {
                    ...condition,
                    body: {
                      kind: 'leaf',
                      value: {
                        family: 'condition',
                        action: {
                          kind: 'buffStack',
                          sourceType: 'CheckBuffStackNumAdvanced',
                          targetSource: 'Owner',
                          targetGroupKey: '',
                          buffCheckType: 'Id',
                          buffIds: ['buff_seal'],
                          tagQueryType: 'hasAny',
                          buffTagIds: [],
                          countType: 'BuffCount',
                          comparison: 'LT',
                          value: { value: 1, blackboardKey: null, levelValues: null },
                          limitSkillCastId: true,
                        },
                      },
                    },
                  },
                  sequence.actions[1]!,
                ],
              },
            ],
          },
        ],
      },
    };
    expect(buffHasNoAffixIdentityWriter(limited)).toBe(true);
    const compiled = compileBuffRuntimeDefinitionSource(limited);
    expect(JSON.stringify(compiled.actionGraph)).toContain('"sameSourceSkillCast":true');

    // Even a disabled writer in a modifier-owned nested program invalidates
    // the whole-definition proof, not only the sequence being compiled.
    const withWriter: BuffRuntimeSource = {
      ...limited,
      damageModifiers: [
        {
          enabledSide: 'Attacker',
          processors: [],
          condition: {
            ...sequence,
            actions: [
              {
                ...condition,
                metadata: { ...condition.metadata, enabled: false },
                body: {
                  kind: 'leaf',
                  value: { family: 'skillAffix', action: { kind: 'skillAffix' } },
                },
              },
            ],
          },
        },
      ],
    };
    expect(buffHasNoAffixIdentityWriter(withWriter)).toBe(false);
    expect(() => compileBuffRuntimeDefinitionSource(withWriter)).toThrow(
      'unsupported event target Buff count condition',
    );
  });

  it('防御方修正的 Target 不能误读为敌人失衡值', () => {
    const source = sourceFixture();
    const seed = source.graph.abilityEvents[0]!.actions[0]!;
    expect(() =>
      compileBuffRuntimeDefinitionSource({
        ...source,
        damageModifiers: [
          {
            enabledSide: 'Defender',
            condition: {
              ...seed,
              actions: [
                {
                  sourcePath: 'modifier.defender.poise',
                  metadata: seed.actions[0]!.metadata,
                  body: {
                    kind: 'leaf',
                    value: {
                      family: 'condition',
                      action: {
                        kind: 'poise',
                        sourceType: 'CheckPoiseValue',
                        target: fixedTarget('Target'),
                        comparison: 'LE',
                        returnValueIfMissing: false,
                        value: { value: 0, blackboardKey: null, levelValues: null },
                      },
                    },
                  },
                },
              ],
            },
            processors: [
              {
                kind: 'damageScale',
                side: 'Defender',
                zoneName: 'NormalCalcZone',
                addition: { value: 0.1, blackboardKey: null, levelValues: null },
              },
            ],
          },
        ],
      }),
    ).toThrow('damage modifier poise target is not the enemy');
  });

  it.each([
    ['HasAny', 'any', 'hasAny'],
    ['HasAll', 'all', 'hasAll'],
    ['ExceptAny', 'all', 'exceptAny'],
    ['ExceptAll', 'any', 'exceptAll'],
  ] as const)('伤害修正的 %s 混合位掩码复用公共标签/特征转换', (checkType, kind, match) => {
    const source = sourceFixture();
    const seed = source.graph.abilityEvents[0]!.actions[0]!;
    const condition: NativeSequenceSource<KnownNativeActionLeafSource> = {
      ...seed,
      actions: [
        {
          sourcePath: 'modifier.mask',
          metadata: seed.actions[0]!.metadata,
          body: {
            kind: 'leaf',
            value: {
              family: 'condition',
              action: {
                kind: 'damageDecorateMask',
                sourceType: 'CheckDamageDecorateMask',
                checkType,
                mask: 256 + 268435456,
              },
            },
          },
        },
      ],
    };
    const result = compileBuffRuntimeDefinitionSource({
      ...source,
      damageModifiers: [
        {
          enabledSide: 'Attacker',
          condition,
          processors: [
            {
              kind: 'damageScale',
              side: 'Attacker',
              zoneName: 'NormalCalcZone',
              addition: { value: 0.1, blackboardKey: null, levelValues: null },
            },
          ],
        },
      ],
    });
    expect(result.damageModifiers?.[0]?.condition).toEqual({
      kind,
      conditions: [
        { kind: 'eventDamageTagsMatch', match, tags: ['normalSkill'] },
        { kind: 'eventDamageFeaturesMatch', match, features: ['dot'] },
      ],
    });
  });

  it('伤害修正的 NotNext 走公共序列控制流，不能当成未支持的独立动作', () => {
    const source = sourceFixture();
    const seed = source.graph.abilityEvents[0]!.actions[0]!;
    const result = compileBuffRuntimeDefinitionSource({
      ...source,
      damageModifiers: [
        {
          enabledSide: 'Attacker',
          condition: {
            ...seed,
            actions: [
              {
                sourcePath: 'modifier.not',
                metadata: seed.actions[0]!.metadata,
                body: { kind: 'negateNextResult' },
              },
              {
                sourcePath: 'modifier.cast',
                metadata: seed.actions[0]!.metadata,
                body: {
                  kind: 'leaf',
                  value: {
                    family: 'condition',
                    action: { kind: 'skillCastId', sourceType: 'CheckSkillCastId' },
                  },
                },
              },
            ],
          },
          processors: [
            {
              kind: 'damageScale',
              side: 'Attacker',
              zoneName: 'NormalCalcZone',
              addition: { value: 0.1, blackboardKey: null, levelValues: null },
            },
          ],
        },
      ],
    });
    expect(result.damageModifiers?.[0]?.condition).toEqual({
      kind: 'not',
      condition: { kind: 'sourceSkillCastMatch' },
    });
  });

  it('空处理器列表不能直接丢弃具有黑板副作用的条件', () => {
    const source = sourceFixture();
    const seed = source.graph.abilityEvents[0]!.actions[0]!;
    // 直接复用公共动作源，既不增加原生动作解析器，也不伪装成条件叶子。
    const condition: NativeSequenceSource<KnownNativeActionLeafSource> = {
      ...seed,
      actions: [
        {
          sourcePath: 'modifier.write',
          metadata: seed.actions[0]!.metadata,
          body: {
            kind: 'leaf',
            value: {
              family: 'blackboardCalculation',
              action: {
                kind: 'blackboardCalculation',
                key: 'real_imbue_scale',
                operation: 'Multiply',
                addend: null,
                left: { value: 0, blackboardKey: 'imbue_scale', levelValues: null },
                right: { value: 1.5, blackboardKey: null, levelValues: null },
              },
            },
          },
        },
      ],
    };
    const result = compileBuffRuntimeDefinitionSource({
      ...source,
      damageModifiers: [
        {
          enabledSide: 'Attacker',
          condition,
          processors: [],
        },
      ],
    });
    expect(
      result.damageModifiers?.map(modifier => ({
        ...modifier,
        conditionProgram: modifier.conditionProgram,
      })),
    ).toEqual([
      {
        enabledSide: 'attacker',
        conditionProgram: graphBranch(result.actionGraph!.main, [
          {
            kind: 'calculateActionValue',
            parameters: {
              key: 'real_imbue_scale',
              operation: 'multiply',
              left: { kind: 'blackboard', key: 'imbue_scale' },
              right: { kind: 'constant', value: 1.5 },
            },
          },
        ]),
        processors: [],
      },
    ]);
  });

  it('把 Buff 动作内创建并保存的 AbilityEntity Context 保留为实体目标证据', () => {
    const source = sourceFixture();
    const event = source.graph.abilityEvents[0]!;
    const action = event.actions[0]!;
    const metadata = action.actions[0]!.metadata;
    const changed: BuffRuntimeSource = {
      ...source,
      graph: {
        ...source.graph,
        abilityEvents: [
          {
            ...event,
            actions: [
              {
                ...action,
                actions: [
                  {
                    sourcePath: 'BuffData.buff_root.spawn.saved',
                    metadata,
                    body: {
                      kind: 'leaf',
                      value: {
                        family: 'abilityEntity',
                        action: { saveToContext: true, contextKey: 'laser_target' },
                      },
                    },
                  } as never,
                  {
                    sourcePath: 'BuffData.buff_root.spawn.disabled',
                    metadata: { ...metadata, enabled: false },
                    body: {
                      kind: 'leaf',
                      value: {
                        family: 'abilityEntity',
                        action: { saveToContext: true, contextKey: 'disabled_target' },
                      },
                    },
                  } as never,
                ],
              },
            ],
          },
        ],
      },
    };

    expect([...collectBuffSpawnedAbilityEntityContextKeys(changed)]).toEqual(['laser_target']);
  });

  it('点燃响应的 Target 读取点燃者，Source 仍是 Buff 原来源', () => {
    const source = sourceFixture();
    const response = source.graph.abilityEvents[0]!.actions[0]!;
    const projected = compileBuffRuntimeDefinitionSource({
      ...source,
      graph: {
        ...source.graph,
        abilityEvents: [],
        igniteEvents: [
          {
            igniteType: 'EndminUlt',
            finishAfterIgnited: true,
            actions: [
              {
                ...response,
                actions: [
                  {
                    sourcePath: 'BuffData.buff_root.ignite.read-potency',
                    metadata: response.actions[0]!.metadata,
                    body: {
                      kind: 'leaf',
                      value: {
                        family: 'buffBlackboardRead',
                        action: {
                          kind: 'buffBlackboardRead',
                          target: { targetSource: 'Target', targetGroupKey: '' },
                          settings: {
                            checkType: 'Id',
                            buffIds: ['buff.potential'],
                            tagQuery: { queryType: 'hasAny', tagIds: [] },
                          },
                          desiredKey: 'ratio',
                          outputKey: 'ratio_dynamic',
                        },
                      },
                    },
                  } as never,
                  ...response.actions.slice(1),
                ],
              },
            ],
          },
        ],
      },
    });

    expect(
      projected.igniteEventResponses?.map(response => ({
        ...response,
        sequence: response.sequence,
      })),
    ).toMatchObject([
      {
        igniteType: 'EndminUlt',
        finishAfterIgnited: true,
        sequence: graphBranch(
          projected.actionGraph!.main,
          [
            {
              kind: 'readBuffBlackboard',
              parameters: {
                target: 'actionInputTarget',
                query: { kind: 'id', buffIds: ['buff.potential'] },
                desiredKey: 'ratio',
                outputKey: 'ratio_dynamic',
              },
            },
            {
              kind: 'applyBuff',
              parameters: { target: 'buffOwner', source: 'buffOwner' },
            },
          ],
          true,
        ),
      },
    ]);
  });

  it('按 OnAddedBuff 事件保留 Owner Buff 条件与宿主时间轴跳转', () => {
    const metadata = {
      nativeType: 'Example.Action+Data, Example',
      nativeName: 'Action',
      enabled: true,
      priorityLevel: 'Default',
      priorityOffset: 0,
      serverActionIndex: 0,
    } as const;
    const responseCondition = {
      sourcePath: 'SkillData.listener.response.checkEnd',
      metadata,
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'condition' as const,
          action: {
            kind: 'buffStack' as const,
            sourceType: 'CheckBuffStackNumAdvanced',
            targetSource: 'Owner',
            targetGroupKey: 'stale_tar',
            buffCheckType: 'Id',
            buffIds: ['buff.skill.end'],
            buffTagIds: [],
            tagQueryType: 'hasAny',
            countType: 'BuffCount',
            comparison: 'GE',
            value: { value: 1, blackboardKey: null, levelValues: null },
            limitSkillCastId: false,
          },
        },
      },
    };
    const jump = {
      sourcePath: 'SkillData.listener.response.jump',
      metadata,
      body: {
        kind: 'timelineJump' as const,
        destinationFrame: 540,
        condition: {
          actions: [],
          onlyExecuteWhenSourceIsMainCharacter: false,
          onlyExecuteWhenSourceIsGuard: false,
        },
      },
    };
    const resetSkillCooldown = {
      sourcePath: 'SkillData.listener.response.resetCooldown',
      metadata,
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'skillCooldownMutation' as const,
          action: {
            kind: 'skillCooldownMutation' as const,
            target: {
              targetSource: 'Owner',
              targetGroupKey: '',
            },
            skill: { kind: 'id' as const, skillId: 'skill.normal' },
            operation: 'set' as const,
            basis: 'absoluteSeconds' as const,
            value: { value: 0, blackboardKey: 'set_cd', levelValues: null },
          },
        },
      },
    };
    const source = {
      actions: [
        {
          sourcePath: 'SkillData.listener',
          metadata,
          body: {
            kind: 'leaf' as const,
            value: {
              family: 'eventListener' as const,
              action: {
                kind: 'eventListener' as const,
                events: [
                  {
                    abilityEvent: 'OnAddedBuff',
                    actions: [
                      {
                        actions: [responseCondition, resetSkillCooldown, jump],
                        onlyExecuteWhenSourceIsMainCharacter: false,
                        onlyExecuteWhenSourceIsGuard: false,
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ],
      onlyExecuteWhenSourceIsMainCharacter: false,
      onlyExecuteWhenSourceIsGuard: false,
    };

    const projectedResult = projectSequence(source as never, {
      gameplayTagRegistry: fixtureGameplayTagRegistry,
      actionOwnerTarget: 'caster',
      actionSourceTarget: 'caster',
      actionTargetTarget: 'enemy',
      timelineRange: { startFrame: 137, endFrame: 527 },
    });
    expect(readGraphActions(projectedResult.graph, projectedResult.entry)).toEqual([
      {
        kind: 'listenForCombatEvents',
        parameters: {
          responses: [
            {
              key: 'SkillData.listener.abilityActionMap[0].actions[0]',
              phase: 'dataAction',
              priority: 0,
              event: { kind: 'abilityEvent', event: 'addedBuff' },
              sequence: graphBranch(projectedResult.graph, [
                {
                  kind: 'conditional',
                  parameters: {
                    condition: {
                      kind: 'buffIdStackCompare',
                      target: 'caster',
                      buffIds: ['buff.skill.end'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                  },
                  whenTrue: graphBranch(projectedResult.graph, [
                    {
                      kind: 'adjustSkillCooldown',
                      parameters: {
                        target: 'caster',
                        skill: { kind: 'id', skillId: 'skill.normal' },
                        operation: 'set',
                        basis: 'absoluteSeconds',
                        value: { kind: 'blackboard', key: 'set_cd' },
                      },
                    },
                    { kind: 'jumpTimeline', parameters: { destinationFrame: 540 } },
                  ]),
                },
              ]),
            },
          ],
        },
      },
    ]);
  });

  it('OnBeforeAddedBuff 监听器编译为事件响应，目标解析沿用施加来源身份', () => {
    const metadata = {
      nativeType: 'Example.Action+Data, Example',
      nativeName: 'Action',
      enabled: true,
      priorityLevel: 'Default',
      priorityOffset: 0,
      serverActionIndex: 0,
    } as const;
    const source = {
      actions: [
        {
          sourcePath: 'SkillData.listener',
          metadata,
          body: {
            kind: 'leaf' as const,
            value: {
              family: 'eventListener' as const,
              action: {
                kind: 'eventListener' as const,
                events: [
                  {
                    abilityEvent: 'OnBeforeAddedBuff',
                    actions: [
                      {
                        actions: [
                          {
                            sourcePath: 'SkillData.listener.response.jump',
                            metadata,
                            body: {
                              kind: 'timelineJump' as const,
                              destinationFrame: 180,
                              condition: {
                                actions: [],
                                onlyExecuteWhenSourceIsMainCharacter: false,
                                onlyExecuteWhenSourceIsGuard: false,
                              },
                            },
                          },
                        ],
                        onlyExecuteWhenSourceIsMainCharacter: false,
                        onlyExecuteWhenSourceIsGuard: false,
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ],
      onlyExecuteWhenSourceIsMainCharacter: false,
      onlyExecuteWhenSourceIsGuard: false,
    };

    const projectedResult = projectSequence(source as never, {
      gameplayTagRegistry: fixtureGameplayTagRegistry,
      actionOwnerTarget: 'caster',
      actionSourceTarget: 'caster',
      actionTargetTarget: 'enemy',
      timelineRange: { startFrame: 21, endFrame: 180 },
    });
    expect(readGraphActions(projectedResult.graph, projectedResult.entry)).toEqual([
      {
        kind: 'listenForCombatEvents',
        parameters: {
          responses: [
            {
              key: 'SkillData.listener.abilityActionMap[0].actions[0]',
              phase: 'dataAction',
              priority: 0,
              event: { kind: 'abilityEvent', event: 'beforeAddedBuff' },
              sequence: graphBranch(projectedResult.graph, [
                { kind: 'jumpTimeline', parameters: { destinationFrame: 180 } },
              ]),
            },
          ],
        },
      },
    ]);
  });

  it('移动输入仅控制空间动作时整体省略，不为玩家猜输入状态', () => {
    const metadata = {
      nativeType: 'Example.Action+Data, Example',
      nativeName: 'Action',
      enabled: true,
      priorityLevel: 'Default',
      priorityOffset: 0,
      serverActionIndex: 0,
    } as const;
    const leaf = (family: string, action: Record<string, unknown>, sourcePath: string) => ({
      sourcePath,
      metadata,
      body: { kind: 'leaf' as const, value: { family, action } },
    });
    const togglable = {
      sourcePath: 'SkillData.moveInputToggle',
      metadata,
      body: {
        kind: 'togglable' as const,
        condition: {
          actions: [leaf('condition', { kind: 'moveInput' }, 'condition')],
          onlyExecuteWhenSourceIsMainCharacter: false,
          onlyExecuteWhenSourceIsGuard: false,
        },
        action: {
          actions: [leaf('spatial', { kind: 'receiveMoveInput' }, 'movement')],
          onlyExecuteWhenSourceIsMainCharacter: false,
          onlyExecuteWhenSourceIsGuard: false,
        },
      },
    };
    expect(
      projectSequence(
        {
          actions: [togglable],
          onlyExecuteWhenSourceIsMainCharacter: false,
          onlyExecuteWhenSourceIsGuard: false,
        } as never,
        {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      ),
    ).toMatchObject({ entry: { $sequence: null } });
  });

  it('距离黑板只进入纯空间条件树时整体省略，不要求不存在的表现目标组', () => {
    const metadata = {
      nativeType: 'Example.Action+Data, Example',
      nativeName: 'Action',
      enabled: true,
      priorityLevel: 'Default',
      priorityOffset: 0,
      serverActionIndex: 0,
    } as const;
    const leaf = (family: string, action: Record<string, unknown>, sourcePath: string) => ({
      sourcePath,
      metadata,
      body: { kind: 'leaf' as const, value: { family, action } },
    });
    const nested = {
      sourcePath: 'SkillData.spatial.nested',
      metadata,
      body: {
        kind: 'ifElse' as const,
        condition: {
          actions: [
            leaf(
              'condition',
              { kind: 'floatCompare', left: { blackboardKey: 'distance' } },
              'SkillData.spatial.compare',
            ),
          ],
        },
        whenTrue: {
          actions: [leaf('presentation', { kind: 'cameraControl' }, 'SkillData.spatial.camera')],
        },
        whenFalse: { actions: [] },
        alwaysNext: true,
      },
    };
    const source = {
      onlyExecuteWhenSourceIsMainCharacter: false,
      onlyExecuteWhenSourceIsGuard: false,
      actions: [
        {
          sourcePath: 'SkillData.spatial.outer',
          metadata,
          body: {
            kind: 'ifElse' as const,
            condition: {
              actions: [leaf('condition', { kind: 'mainOperator' }, 'SkillData.spatial.owner')],
            },
            whenTrue: {
              actions: [
                leaf(
                  'spatialMeasurement',
                  {
                    kind: 'targetDistance',
                    source: { targetSource: 'Context', targetGroupKey: 'presentation_only' },
                    target: { targetSource: 'Source', targetGroupKey: '' },
                    outputKey: 'distance',
                  },
                  'SkillData.spatial.distance',
                ),
                nested,
              ],
            },
            whenFalse: { actions: [] },
            alwaysNext: true,
          },
        },
      ],
    };
    expect(
      projectSequence(source as never, {
        gameplayTagRegistry: fixtureGameplayTagRegistry,
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }).steps,
    ).toEqual([]);
  });

  it('角色外部受击事件只省略唯一敌人来源的精确对象类型守卫', () => {
    const source = sourceFixture();
    const sequence = source.graph.abilityEvents[0]!.actions[0]!;
    const apply = sequence.actions.find(
      node => node.body.kind === 'leaf' && node.body.value.family === 'buffApplication',
    )!;
    const condition = {
      sourcePath: 'BuffData.operatorHit.enemyGuard',
      metadata: sequence.actions[0]!.metadata,
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'condition' as const,
          action: {
            kind: 'objectTypeMatch' as const,
            sourceType: 'CheckObjectTypeMatch',
            target: { targetSource: 'Target', targetGroupKey: '' } as never,
            objectTypeMask: 'Enemy',
          },
        },
      },
    };
    const damageKindGuard = {
      sourcePath: 'BuffData.operatorHit.directDamageGuard',
      metadata: sequence.actions[0]!.metadata,
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'condition' as const,
          action: {
            kind: 'damageDecorateMask' as const,
            sourceType: 'CheckDamageDecorateMask',
            checkType: 'ExceptAny',
            mask: 268435456 + 536870912,
          },
        },
      },
    };
    const definition = compileBuffRuntimeDefinitionSource(
      {
        ...source,
        graph: {
          ...source.graph,
          abilityEvents: [
            {
              event: 'OnTakeDamage',
              actions: [{ ...sequence, actions: [condition, damageKindGuard, apply] }],
            },
          ],
        },
      },
      new Set(),
      new Set(),
      {},
      undefined,
      { fixedBuffOwnerTarget: 'caster', gameplayTagRegistry: fixtureGameplayTagRegistry },
    );

    expect(definition.abilityEventResponses?.[0]).toMatchObject({ event: 'takeDamage' });
    expect(
      readResourceActions(definition, definition.abilityEventResponses?.[0]?.sequence),
    ).toMatchObject([{ kind: 'applyBuff' }]);
    expect(
      JSON.stringify(
        compileBuffRuntimeDefinitionSource(
          {
            ...source,
            graph: {
              ...source.graph,
              abilityEvents: [
                {
                  event: 'OnTakeDamage',
                  actions: [
                    {
                      ...sequence,
                      actions: [
                        {
                          ...condition,
                          body: {
                            ...condition.body,
                            value: {
                              ...condition.body.value,
                              action: {
                                ...condition.body.value.action,
                                objectTypeMask: 'Character',
                              },
                            },
                          },
                        },
                        apply,
                      ],
                    },
                  ],
                },
              ],
            },
          },
          new Set(),
          new Set(),
          {},
          undefined,
          { fixedBuffOwnerTarget: 'caster', gameplayTagRegistry: fixtureGameplayTagRegistry },
        ),
      ),
    ).toContain('actionInputTargetObjectTypeMatch');
  });

  it.each([
    ['OnBeforeOutputKnockDown', 'beforeOutputKnockDown'],
    ['OnAfterOutputKnockDown', 'afterOutputKnockDown'],
    ['OnAfterOutputWeaknessTriggered', 'afterOutputWeaknessTriggered'],
  ])('%s 保留为组件同步事件，不降成通用异常或旧输出标记', (nativeName, expected) => {
    const source = sourceFixture();
    const event = source.graph.abilityEvents[0]!;
    const sequence = event.actions[0]!;
    const definition = compileBuffRuntimeDefinitionSource(
      {
        ...source,
        graph: {
          ...source.graph,
          abilityEvents: [
            {
              ...event,
              event: nativeName,
              actions: [{ ...sequence, actions: [sequence.actions[1]!] }],
            },
          ],
        },
      },
      new Set(),
      new Set(),
      {},
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry },
    );
    expect(definition.abilityEventResponses).toHaveLength(1);
    expect(definition.abilityEventResponses![0]).toMatchObject({ event: expected });
    expect(
      readResourceActions(definition, definition.abilityEventResponses![0]!.sequence),
    ).toMatchObject([{ kind: 'applyBuff' }]);
  });

  it('敌人持有的击倒载体由 Source 结算伤害，保留 KnockDown 及物理异常分类', () => {
    const source = sourceFixture();
    const sequence = source.graph.abilityEvents[0]!.actions[0]!;
    const damage = {
      ...simpleDamageFixture(),
      attacker: 'ActionSource' as const,
      target: fixedTarget('Owner'),
    };
    const project = (action: DamageActionSource, fixedBuffOwnerTarget?: 'enemy' | 'caster') =>
      compileBuffRuntimeDefinitionSource(
        {
          ...source,
          graph: {
            ...source.graph,
            abilityEvents: [],
            buffEvents: [
              {
                event: 'OnBuffStart',
                actions: [
                  {
                    ...sequence,
                    actions: [
                      {
                        ...sequence.actions[0]!,
                        body: { kind: 'leaf', value: { family: 'damage', action } },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
        new Set(),
        new Set(),
        {},
        undefined,
        { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{ fixedBuffOwnerTarget } },
      );
    const knockdown = {
      ...damage,
      units: damage.units.map(unit => ({
        ...unit,
        damageDecorateMask: unit.attributeType === 'Hp' ? 65536 : 0,
      })),
    };
    expect(lifecycleSteps(project(knockdown, 'enemy'), 'start')).toEqual([
      {
        kind: 'dealDamage',
        parameters: {
          damageType: 'physical',
          attackScale: { kind: 'blackboard', key: 'atk_scale' },
          tags: [],
          features: ['knockDown', 'physicalInfliction'],
          stagger: { kind: 'blackboard', key: 'poise' },
        },
      },
    ]);
    expect(() => project(knockdown)).toThrow('unsupported Buff damage source');
    expect(() => project(knockdown, 'caster')).toThrow('unsupported Buff damage source');
    expect(() => project({ ...knockdown, attacker: 'ActionOwner' }, 'enemy')).toThrow(
      'enemy Buff Owner',
    );
    const poiseOnly = { ...damage, units: damage.units.slice(1) };
    expect(lifecycleSteps(project(poiseOnly, 'enemy'), 'start')).toEqual([
      {
        kind: 'dealStagger',
        parameters: { value: { kind: 'blackboard', key: 'poise' } },
      },
    ]);
    const weaknessPoiseOnly = {
      ...poiseOnly,
      units: poiseOnly.units.map(unit => ({
        ...unit,
        serializedAttackCalculationPresent: true,
        attackCalculation: null,
        damageDecorateMask: 4096,
      })),
    };
    expect(lifecycleSteps(project(weaknessPoiseOnly, 'enemy'), 'start')).toEqual([
      {
        kind: 'dealStagger',
        parameters: {
          value: { kind: 'blackboard', key: 'poise' },
          features: ['canBreakWeakness'],
        },
      },
    ]);
    expect(() => project({ ...poiseOnly, attacker: 'ActionOwner' }, 'enemy')).toThrow(
      'enemy Buff Owner',
    );
    expect(
      lifecycleSteps(
        project(
          {
            ...damage,
            units: damage.units.map(unit => ({
              ...unit,
              damageDecorateMask: unit.attributeType === 'Hp' ? 65536 + 16384 : 0,
            })),
          },
          'enemy',
        ),
        'start',
      )[0],
    ).toMatchObject({
      kind: 'dealDamage',
      parameters: { features: ['knockDown', 'physicalInfliction'] },
    });
  });

  it.each(['buffApplication', 'aura'] as const)('%s 把直接字符串与数值黑板赋值分开投影', family => {
    const sequence = sourceFixture().graph.abilityEvents[0]!.actions[0]!;
    const apply = sequence.actions[1]!;
    if (apply.body.kind !== 'leaf' || apply.body.value.family !== 'buffApplication')
      throw new Error('fixture');
    const assignment = {
      targetKey: 'rate',
      inputValueKey: 'source_rate',
      useDirectValue: true,
      valueType: 'String',
      numericValue: 7,
      stringValue: 'label',
    };
    const entry = {
      ...apply.body.value.action.buffs[0]!,
      assignBlackboard: true,
      assignments: [assignment],
    };
    const action = {
      ...apply.body.value.action,
      buffs: [entry],
      target: fixedTarget('Target'),
      buffSource: 'ActionSource' as const,
    };
    const project = (visualOnlyIds = new Set<string>()) =>
      projectSequence(
        {
          ...sequence,
          actions: [
            {
              ...apply,
              body:
                family === 'buffApplication'
                  ? { kind: 'leaf', value: { family, action } }
                  : {
                      kind: 'leaf',
                      value: {
                        family,
                        action: {
                          kind: 'globalPartyAura',
                          debugName: '',
                          fixedWhenStart: false,
                          target: 'party',
                          buffSource: 'ActionSource',
                          inheritSourceSkillCastInfo: false,
                          buffs: [entry],
                          exitBuffs: [],
                        },
                      },
                    },
            },
          ],
        },
        {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: family === 'aura' ? 'buffOwner' : 'enemy',
        },
        visualOnlyIds,
      );
    expect(project().steps[0]).toMatchObject({
      parameters: { stringBlackboardAssignments: { rate: 'label' } },
    });
    // 已证明纯表现的整项先省略，不因其中未执行的字符串写入阻塞。
    expect(project(new Set([entry.buffId])).steps).toEqual([]);
    assignment.useDirectValue = false;
    expect(project().steps[0]).toMatchObject({
      parameters:
        family === 'buffApplication'
          ? { copiedBlackboardAssignments: { rate: 'source_rate' } }
          : { blackboardAssignments: { rate: { kind: 'blackboard', key: 'source_rate' } } },
    });
    assignment.useDirectValue = true;
    assignment.valueType = 'Numeric';
    expect(project().steps[0]).toMatchObject({
      parameters: { blackboardAssignments: { rate: { kind: 'constant', value: 7 } } },
    });
  });

  it('能力实体 Aura 保留 ActionOwner 作为 Buff 来源', () => {
    const sequence = sourceFixture().graph.abilityEvents[0]!.actions[0]!;
    const apply = sequence.actions[1]!;
    if (apply.body.kind !== 'leaf' || apply.body.value.family !== 'buffApplication')
      throw new Error('fixture');
    const entry = {
      ...apply.body.value.action.buffs[0]!,
      assignBlackboard: false,
      assignments: [],
    };
    const projected = projectSequence(
      {
        ...sequence,
        actions: [
          {
            ...apply,
            body: {
              kind: 'leaf',
              value: {
                family: 'aura',
                action: {
                  kind: 'globalPartyAura',
                  debugName: 'ability-entity-owner',
                  fixedWhenStart: false,
                  target: 'partyExceptCaster',
                  buffSource: 'ActionOwner',
                  inheritSourceSkillCastInfo: true,
                  buffs: [entry],
                  exitBuffs: [],
                  iconDurationOverride: {
                    durationSourceType: 'TimedMarker',
                    timedMarkerId: 'ultimate-window',
                  },
                },
              },
            },
          },
        ],
      },
      {
        gameplayTagRegistry: fixtureGameplayTagRegistry,
        actionOwnerTarget: 'currentAbilityEntity',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      },
    );

    expect(projected.steps[0]).toMatchObject({
      kind: 'applyBuff',
      parameters: {
        source: 'currentAbilityEntity',
        iconDurationSource: {
          kind: 'actionOwnerTimedMarker',
          markerId: 'ultimate-window',
        },
      },
    });
  });

  it('导电状态子 Buff 使用外层换算后的最终时长建立反应并保留原生寿命', () => {
    const sequence = sourceFixture().graph.abilityEvents[0]!.actions[0]!;
    const apply = sequence.actions[1]!;
    if (apply.body.kind !== 'leaf' || apply.body.value.family !== 'buffApplication')
      throw new Error('fixture');
    const entry = apply.body.value.action.buffs[0]!;
    const action = {
      ...apply.body.value.action,
      target: fixedTarget('Target'),
      buffSource: 'ActionSource' as const,
      buffs: [
        {
          ...entry,
          buffId: 'buff_common_pulse_pulse_conduct_triggered_do',
          assignBlackboard: true,
          assignments: [
            {
              targetKey: 'duration',
              valueType: 'Numeric' as const,
              numericValue: 0,
              stringValue: '',
              useDirectValue: false,
              inputValueKey: 'duration',
            },
          ],
        },
      ],
    };
    const project = () =>
      projectSequence(
        {
          ...sequence,
          actions: [
            {
              ...apply,
              body: { kind: 'leaf', value: { family: 'buffApplication', action } },
            },
          ],
        },
        {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      );

    expect(project().steps).toMatchObject([
      {
        kind: 'applyElementalReaction',
        parameters: {
          reaction: 'electrification',
          target: 'enemy',
          durationSeconds: { kind: 'blackboard', key: 'duration' },
        },
      },
      {
        kind: 'applyBuff',
        parameters: {
          buffId: 'buff_common_pulse_pulse_conduct_triggered_do',
          target: 'enemy',
        },
      },
    ]);
    // 同名黑板值由源作用域直接继承；反应步骤仍显式读取该值作为最终时长。
    const appliedStep = project().steps[1]!;
    if (appliedStep.kind !== 'applyBuff') throw new Error('expected an applyBuff step');
    expect(appliedStep.parameters).not.toHaveProperty('blackboardAssignments');

    action.buffs = [{ ...action.buffs[0]!, assignments: [] }];
    expect(project).toThrow('unsupported electrification trigger Buff shape');
  });

  it('Buff 事件中的 ActionSource 保留精确 Buff 来源实例', () => {
    const sequence = sourceFixture().graph.abilityEvents[0]!.actions[0]!;
    const apply = sequence.actions[1]!;
    if (apply.body.kind !== 'leaf' || apply.body.value.family !== 'buffApplication')
      throw new Error('fixture');
    const projected = projectSequence(
      {
        ...sequence,
        actions: [
          {
            ...apply,
            body: {
              kind: 'leaf',
              value: {
                family: 'buffApplication',
                action: {
                  ...apply.body.value.action,
                  target: fixedTarget('Target'),
                  buffSource: 'ActionSource',
                },
              },
            },
          },
        ],
      },
      {
        gameplayTagRegistry: fixtureGameplayTagRegistry,
        actionOwnerTarget: 'buffOwner',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
        fixedBuffSourceTarget: 'currentAbilityEntity',
      },
    );

    expect(projected.steps[0]).toMatchObject({
      kind: 'applyBuff',
      parameters: { target: 'enemy', source: 'buffSource' },
    });
  });
  it.each(['OnBuffStart', 'DuringBuffEnable', 'OnBuffAfterTryEnhanced'] as const)(
    '%s 的来源、持有者和默认目标不借用能力事件',
    event => {
      const source = sourceFixture();
      const sequence = source.graph.abilityEvents[0]!.actions[0]!;
      const apply = sequence.actions[1]!;
      if (apply.body.kind !== 'leaf' || apply.body.value.family !== 'buffApplication')
        throw new Error('fixture');
      const action = apply.body.value.action;
      for (const targetSource of ['Source', 'Owner', 'Target']) {
        for (const buffSource of ['ActionSource', 'ActionOwner'] as const) {
          const definition = compileBuffRuntimeDefinitionSource(
            {
              ...source,
              graph: {
                ...source.graph,
                abilityEvents: [],
                buffEvents: [
                  {
                    event,
                    actions: [
                      {
                        ...sequence,
                        actions: [
                          {
                            ...apply,
                            body: {
                              kind: 'leaf',
                              value: {
                                family: 'buffApplication',
                                action: {
                                  ...action,
                                  target: fixedTarget(targetSource),
                                  buffSource,
                                },
                              },
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
            undefined,
            undefined,
            undefined,
            undefined,
            { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
          );
          const key =
            event === 'OnBuffStart'
              ? 'start'
              : event === 'DuringBuffEnable'
                ? 'enable'
                : 'afterEnhance';
          const step = lifecycleSteps(definition, key)[0];
          expect(step).toMatchObject({
            kind: 'applyBuff',
            parameters: { target: targetSource === 'Source' ? 'caster' : 'buffOwner' },
          });
          expect(step?.kind === 'applyBuff' && step.parameters.source).toBe(
            buffSource === 'ActionOwner' ? 'buffOwner' : undefined,
          );
        }
      }
    },
  );

  it('把 DuringBuffEnable 末尾的 SkillAffix 保留为动作而非提前构造身份', () => {
    const source = sourceFixture();
    const sequence = source.graph.abilityEvents[0]!.actions[0]!;
    const template = sequence.actions[0]!;
    const definition = compileBuffRuntimeDefinitionSource({
      ...source,
      graph: {
        ...source.graph,
        abilityEvents: [],
        buffEvents: [
          {
            event: 'DuringBuffEnable',
            actions: [
              {
                ...sequence,
                actions: [
                  {
                    ...template,
                    sourcePath: 'BuffData.buff_root.skillAffix',
                    body: {
                      kind: 'leaf',
                      value: { family: 'skillAffix', action: { kind: 'skillAffix' } },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(definition.affixSkillCastIdentity).toBeUndefined();
    expect(readResourceActions(definition, definition.lifecycleSequences?.enable)).toEqual([
      { kind: 'skillAffix', parameters: {} },
    ]);
    expect(definition.abilityEventResponses ?? []).toEqual([]);
  });

  it.each(['Target', 'Source'] as const)(
    '主动动作的 %s Buff 目标不需要伪造事件上下文',
    targetSource => {
      const sequence = sourceFixture().graph.abilityEvents[0]!.actions[0]!;
      const apply = sequence.actions[1]!;
      if (apply.body.kind !== 'leaf' || apply.body.value.family !== 'buffApplication')
        throw new Error('fixture');
      const projected = projectSequence(
        {
          ...sequence,
          actions: [
            {
              ...apply,
              body: {
                kind: 'leaf',
                value: {
                  family: 'buffApplication',
                  action: {
                    ...apply.body.value.action,
                    target: fixedTarget(targetSource),
                    buffSource: 'ActionSource',
                  },
                },
              },
            },
          ],
        },
        {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          actionOwnerTarget: 'unavailable',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      );
      expect(projected.steps[0]).toMatchObject({
        kind: 'applyBuff',
        parameters: {
          target: targetSource === 'Target' ? 'enemy' : 'caster',
        },
      });
      expect(
        projected.steps[0]!.kind === 'applyBuff' && projected.steps[0]!.parameters.source,
      ).toBeUndefined();
    },
  );

  it('保留动作期 Buff 对下一原生技能的严格生命周期转交白名单', () => {
    const sequence = sourceFixture().graph.abilityEvents[0]!.actions[0]!;
    const apply = sequence.actions[1]!;
    if (apply.body.kind !== 'leaf' || apply.body.value.family !== 'buffApplication')
      throw new Error('fixture');
    const projected = projectSequence(
      {
        ...sequence,
        actions: [
          {
            ...apply,
            body: {
              kind: 'leaf',
              value: {
                family: 'buffApplication',
                action: {
                  ...apply.body.value.action,
                  target: fixedTarget('Source'),
                  buffSource: 'ActionSource',
                  autoFinishByAction: true,
                  inheritSkillIds: ['chr_native_attack1'],
                  finishWithNextSkillIfNotInherited: true,
                },
              },
            },
          },
        ],
      },
      {
        gameplayTagRegistry: fixtureGameplayTagRegistry,
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      },
    );
    expect(projected.steps[0]).toMatchObject({
      kind: 'applyBuff',
      parameters: {
        finishByAction: true,
        inheritToNextSkillIds: ['chr_native_attack1'],
      },
    });
  });

  it('主动回调尚未绑定 Owner 时拒绝把它当作 Buff 施加来源', () => {
    const sequence = sourceFixture().graph.abilityEvents[0]!.actions[0]!;
    const apply = sequence.actions[1]!;
    if (apply.body.kind !== 'leaf' || apply.body.value.family !== 'buffApplication')
      throw new Error('fixture');
    const action = apply.body.value.action;
    expect(() =>
      projectSequence(
        {
          ...sequence,
          actions: [
            {
              ...apply,
              body: {
                kind: 'leaf',
                value: {
                  family: 'buffApplication',
                  action: {
                    ...action,
                    target: fixedTarget('Target'),
                    buffSource: 'ActionOwner',
                  },
                },
              },
            },
          ],
        },
        {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          actionOwnerTarget: 'unavailable',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      ),
    ).toThrow('unsupported Buff target/source');
  });

  it('目标侧前置事件不沿用未经审计的技能事件条件', () => {
    const source = sourceFixture();
    expect(() =>
      compileBuffRuntimeDefinitionSource(
        {
          ...source,
          graph: {
            ...source.graph,
            abilityEvents: source.graph.abilityEvents.map(event => ({
              ...event,
              event: 'OnBeforeAddedBuff',
            })),
          },
        },
        undefined,
        undefined,
        undefined,
        undefined,
        { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
      ),
    ).toThrow('unaudited receiving Buff event condition skillType');
  });
  it('受击响应可按固定宿主标签、本次伤害元素和概率共同守卫', () => {
    const source = sourceFixture();
    const response = source.graph.abilityEvents[0]!.actions[0]!;
    const apply = response.actions[1]!;
    const conditionNode = (
      action: Record<string, unknown>,
      index: number,
    ): (typeof response.actions)[number] =>
      ({
        sourcePath: `BuffData.buff_root.take-damage-condition[${index}]`,
        metadata: { ...response.actions[0]!.metadata, serverActionIndex: index },
        body: { kind: 'leaf', value: { family: 'condition', action } },
      }) as never;
    const definition = compileBuffRuntimeDefinitionSource(
      {
        ...source,
        graph: {
          ...source.graph,
          abilityEvents: [
            {
              event: 'OnBeforeTakeDamage',
              actions: [
                {
                  ...response,
                  actions: [
                    conditionNode(
                      {
                        kind: 'entityTag',
                        targetSource: 'Owner',
                        targetGroupKey: '',
                        tagQueryType: 'exceptAny',
                        tagIds: [1570888476],
                      },
                      0,
                    ),
                    conditionNode({ kind: 'damageType', damageType: 'heat' }, 1),
                    conditionNode(
                      {
                        kind: 'probability',
                        value: { value: 0.5, blackboardKey: null, levelValues: null },
                      },
                      2,
                    ),
                    apply,
                  ],
                },
              ],
            },
          ],
        },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      {
        gameplayTagRegistry: fixtureGameplayTagRegistry,
        fixedBuffOwnerTarget: 'caster',
        fixedBuffSourceTarget: 'caster',
      },
    );

    expect(
      readResourceActions(definition, definition.abilityEventResponses?.[0]?.sequence)[0],
    ).toMatchObject({
      kind: 'conditional',
      parameters: {
        condition: {
          kind: 'entityTagMatch',
          target: 'buffOwner',
          tagQueryType: 'exceptAny',
        },
      },
      whenTrue: graphBranch(
        definition.actionGraph!.main,
        [
          {
            kind: 'conditional',
            parameters: { condition: { kind: 'eventDamageTypeIn', damageTypes: ['heat'] } },
          },
        ],
        true,
      ),
    });
  });
  it.each(['Source', 'Target', 'Owner'] as const)(
    '目标侧前置 Buff 事件严格区分 %s 的身份',
    target => {
      const source = sourceFixture();
      const sequence = source.graph.abilityEvents[0]!.actions[0]!;
      const apply = sequence.actions[1]!;
      if (apply.body.kind !== 'leaf' || apply.body.value.family !== 'buffApplication')
        throw new Error('fixture');
      const definition = compileBuffRuntimeDefinitionSource(
        {
          ...source,
          graph: {
            ...source.graph,
            abilityEvents: [
              {
                event: 'OnBeforeAddedBuff',
                actions: [
                  {
                    ...sequence,
                    actions: [
                      {
                        ...sequence.actions[0]!,
                        body: {
                          kind: 'leaf',
                          value: {
                            family: 'condition',
                            action: {
                              kind: 'targetIdentity',
                              sourceType: 'CheckTargetsEqual',
                              first: { ...fixedTarget('Source'), targetGroupKey: '' },
                              second: { ...fixedTarget('Target'), targetGroupKey: '' },
                            },
                          },
                        },
                      },
                      {
                        ...apply,
                        body: {
                          kind: 'leaf',
                          value: {
                            family: 'buffApplication',
                            action: {
                              ...apply.body.value.action,
                              target: fixedTarget(target),
                              buffSource: 'ActionSource',
                            },
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
        undefined,
        undefined,
        undefined,
        undefined,
        { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
      );
      expect(
        readResourceActions(definition, definition.abilityEventResponses?.[0]?.sequence)[0],
      ).toMatchObject({
        kind: 'conditional',
        parameters: {
          condition: {
            kind: 'actionInputTargetIdentityMatch',
            other: 'actionSource',
            operator: 'equal',
          },
        },
        whenTrue: graphBranch(
          definition.actionGraph!.main,
          [
            {
              kind: 'applyBuff',
              parameters: {
                target: { Source: 'buffSource', Target: 'eventSource', Owner: 'buffOwner' }[target],
                source: 'buffSource',
              },
            },
          ],
          true,
        ),
      });
    },
  );

  it('保留 CreateBuffAttachingSkill 的技能寿命约束，不能降级为独立 Buff', () => {
    const source = sourceFixture();
    const sequence = source.graph.abilityEvents[0]!.actions[0]!;
    const apply = sequence.actions[1]!;
    if (apply.body.kind !== 'leaf' || apply.body.value.family !== 'buffApplication') {
      throw new Error('fixture must contain a Buff application');
    }
    const result = projectSequence(
      {
        ...sequence,
        actions: [
          {
            ...apply,
            body: {
              kind: 'leaf',
              value: {
                family: 'buffApplication',
                action: { ...apply.body.value.action, lifetimeOwner: 'currentCastSkill' },
              },
            },
          },
        ],
      },
      {
        gameplayTagRegistry: fixtureGameplayTagRegistry,
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'eventTarget',
      },
    );
    expect(result.steps[0]).toMatchObject({
      kind: 'applyBuff',
      parameters: { lifetimeOwner: 'currentCastSkill' },
    });
  });

  it('ForEach 的直接 Target 忽略陈旧组名并按已证明的当前敌人读取 Buff', () => {
    const sequence = sourceFixture().graph.abilityEvents[0]!.actions[0]!;
    const metadata = sequence.actions[0]!.metadata;
    const result = projectSequence(
      {
        ...sequence,
        actions: [
          {
            sourcePath: 'SkillData.child.readCount',
            metadata,
            body: {
              kind: 'leaf',
              value: {
                family: 'buffQuery',
                action: {
                  kind: 'buffStackRead',
                  sourceType: 'SaveBuffStackNumByTag',
                  target: { targetSource: 'Target', targetGroupKey: 'stale_smart_target' } as never,
                  checkType: 'Tag',
                  buffIds: [],
                  tagQueryType: 'hasAny',
                  buffTagIds: [1075718177],
                  countType: 'BuffCount',
                  limitSkillCastId: false,
                  outputKey: 'count',
                },
              },
            },
          },
        ],
      },
      {
        gameplayTagRegistry: fixtureGameplayTagRegistry,
        actionOwnerTarget: 'currentAbilityEntity',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      },
    );

    expect(result.steps[0]).toMatchObject({
      kind: 'readBuffStackCount',
      parameters: { target: 'enemy', outputKey: 'count' },
    });
  });

  it('数量真分支把至多一个的零空间 Context 细化为单例且不泄漏编译标记', () => {
    const sequence = sourceFixture().graph.abilityEvents[0]!.actions[0]!;
    const metadata = sequence.actions[0]!.metadata;
    const target = { ...fixedTarget('Context'), targetGroupKey: 'tar2' };
    const readNode = {
      sourcePath: 'SkillData.fixture.forEach.readCount',
      metadata,
      body: {
        kind: 'leaf',
        value: {
          family: 'buffQuery',
          action: {
            kind: 'buffStackRead',
            sourceType: 'SaveBuffStackNumByTag',
            target: fixedTarget('Target'),
            checkType: 'Tag',
            buffIds: [],
            tagQueryType: 'hasAny',
            buffTagIds: [1075718177],
            countType: 'BuffCount',
            limitSkillCastId: false,
            outputKey: 'count',
          },
        },
      },
    };
    const result = projectSequence(
      {
        ...sequence,
        actions: [
          {
            sourcePath: 'SkillData.fixture.guard',
            metadata,
            body: {
              kind: 'ifElse',
              condition: {
                ...sequence,
                actions: [
                  {
                    sourcePath: 'SkillData.fixture.guard.count',
                    metadata,
                    body: {
                      kind: 'leaf',
                      value: {
                        family: 'condition',
                        action: {
                          kind: 'entityCount',
                          targetSource: 'Context',
                          targetGroupKey: 'tar2',
                          containsHittableTarget: false,
                          excludeDeadEntity: false,
                          storeKey: '',
                          comparison: 'GE',
                          minimumCount: 1,
                        },
                      },
                    },
                  },
                ],
              },
              whenTrue: {
                ...sequence,
                actions: [
                  {
                    sourcePath: 'SkillData.fixture.guard.forEach',
                    metadata,
                    body: {
                      kind: 'forEach',
                      target,
                      action: { ...sequence, actions: [readNode] },
                    },
                  },
                ],
              },
              whenFalse: { ...sequence, actions: [] },
              alwaysNext: true,
            },
          },
        ],
      } as never,
      {
        gameplayTagRegistry: fixtureGameplayTagRegistry,
        actionOwnerTarget: 'currentAbilityEntity',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'caster',
        atMostOneZeroSpaceTargetGroupKeys: new Set(['tar2']),
      },
    );

    expect(readGraphActions(result.graph, result.entry)[0]).toMatchObject({
      kind: 'conditional',
      whenTrue: graphBranch(
        result.graph,
        [
          {
            kind: 'forEachContextTarget',
            parameters: { target: 'enemy' },
            body: graphBranch(
              result.graph,
              [{ kind: 'readBuffStackCount', parameters: { target: 'enemy' } }],
              true,
            ),
          },
        ],
        true,
      ),
    });
    expect(JSON.stringify(result)).not.toContain('guaranteedSingletonZeroSpace');
  });

  it('公共动作投影按宿主上下文解析 ActionOwner，而不把武器宿主伪装成 Buff', () => {
    const source = sourceFixture();
    const sequence = source.graph.abilityEvents[0]!.actions[0]!;

    const result = projectSequence(sequence, {
      gameplayTagRegistry: fixtureGameplayTagRegistry,
      actionOwnerTarget: 'caster',
      actionSourceTarget: 'caster',
      actionTargetTarget: 'eventTarget',
    });
    expect(readGraphActions(result.graph, result.entry)[0]).toMatchObject({
      kind: 'conditional',
      whenTrue: graphBranch(
        result.graph,
        [{ kind: 'applyBuff', parameters: { target: 'caster' } }],
        true,
      ),
    });
  });

  it('保留 FinishBuffAdvanced 的 Buff 来源目标与吸收原因', () => {
    const source = sourceFixture();
    const sequence = source.graph.abilityEvents[0]!.actions[0]!;
    const metadata = sequence.actions[0]!.metadata;
    const definition = compileBuffRuntimeDefinitionSource(
      {
        ...source,
        graph: {
          ...source.graph,
          abilityEvents: [],
          buffEvents: [
            {
              event: 'OnBuffFinish',
              actions: [
                {
                  ...sequence,
                  actions: [
                    {
                      sourcePath: 'BuffData.buff_root.finishSourceBuff',
                      metadata,
                      body: {
                        kind: 'leaf',
                        value: {
                          family: 'buffFinish',
                          action: {
                            kind: 'buffFinishByQuery',
                            owner: fixedTarget('Source'),
                            settings: {
                              checkType: 'Id',
                              buffIds: ['buff.weapon.exist'],
                              tagQuery: { queryType: 'hasAny', tagIds: [] },
                            },
                            finishAll: true,
                            finishLayerCount: { value: 1, blackboardKey: null, levelValues: null },
                            limitSource: false,
                            buffSource: fixedTarget('Source'),
                            isFinishedEarly: false,
                            isAbsorbed: true,
                            finishSource: fixedTarget('Source'),
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
    );

    expect(readResourceActions(definition, definition.lifecycleSequences?.finish)).toEqual([
      {
        kind: 'finishBuffsById',
        parameters: {
          target: 'caster',
          buffIds: ['buff.weapon.exist'],
          reason: 'absorbed',
        },
      },
    ]);
  });

  it('FinishBuffAdvanced 将原生 MainCharacter owner 投影为固定施法者', () => {
    const source = sourceFixture();
    const baseSequence = source.graph.abilityEvents[0]!.actions[0]!;
    const metadata = baseSequence.actions[0]!.metadata;
    const compiled = projectSequence(
      {
        ...baseSequence,
        actions: [
          {
            sourcePath: 'BuffData.buff_cc_chr.finishStack',
            metadata,
            body: {
              kind: 'leaf',
              value: {
                family: 'buffFinish',
                action: {
                  kind: 'buffFinishByQuery',
                  owner: fixedTarget('MainCharacter'),
                  settings: {
                    checkType: 'Id',
                    buffIds: ['buff_cc_chr_stack'],
                    tagQuery: { queryType: 'hasAny', tagIds: [] },
                  },
                  finishAll: true,
                  finishLayerCount: { value: 1, blackboardKey: null, levelValues: null },
                  limitSource: false,
                  buffSource: fixedTarget('Source'),
                  isFinishedEarly: false,
                  isAbsorbed: false,
                  finishSource: fixedTarget('Source'),
                },
              },
            },
          },
        ],
      },
      {
        actionOwnerTarget: 'buffOwner',
        actionSourceTarget: 'buffSource',
        actionTargetTarget: 'eventTarget',
        fixedBuffOwnerTarget: 'caster',
        fixedBuffSourceTarget: 'caster',
      },
    );
    expect(compiled.steps).toEqual([
      {
        kind: 'finishBuffsById',
        parameters: {
          target: 'caster',
          buffIds: ['buff_cc_chr_stack'],
          reason: 'other',
        },
      },
    ]);
  });

  it('FinishBuffAdvanced 的空 Id 列表严格投影为无操作而非结束全部 Buff', () => {
    const source = sourceFixture();
    const baseSequence = source.graph.abilityEvents[0]!.actions[0]!;
    const metadata = baseSequence.actions[0]!.metadata;
    expect(
      projectSequence(
        {
          ...baseSequence,
          actions: [
            {
              sourcePath: 'SkillData.fixture.emptyFinishIds',
              metadata,
              body: {
                kind: 'leaf',
                value: {
                  family: 'buffFinish',
                  action: {
                    kind: 'buffFinishByQuery',
                    owner: fixedTarget('Owner'),
                    settings: {
                      checkType: 'Id',
                      buffIds: [],
                      tagQuery: { queryType: 'hasAny', tagIds: [] },
                    },
                    finishAll: true,
                    finishLayerCount: { value: 1, blackboardKey: null, levelValues: null },
                    limitSource: false,
                    buffSource: fixedTarget('Source'),
                    isFinishedEarly: false,
                    isAbsorbed: false,
                    finishSource: fixedTarget('Source'),
                  },
                },
              },
            },
          ],
        },
        {
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      ),
    ).toMatchObject({ entry: { $sequence: null } });
  });

  it('FinishBuffAction 的严格 CharacterTeamFinder 投影为全队目标', () => {
    const source = sourceFixture();
    const baseSequence = source.graph.abilityEvents[0]!.actions[0]!;
    const metadata = baseSequence.actions[0]!.metadata;
    const partyOwner = {
      ...fixedTarget('InstantSearch'),
      finderType: 'CharacterTeamFinder',
    } as const;

    expect(
      projectSequence(
        {
          ...baseSequence,
          actions: [
            {
              sourcePath: 'SkillData.fixture.finishPartyBuff',
              metadata,
              body: {
                kind: 'leaf',
                value: {
                  family: 'buffFinish',
                  action: {
                    kind: 'buffFinishById',
                    owner: partyOwner,
                    buffIds: ['buff.fixture'],
                    finishAll: true,
                    finishLayerCount: { value: 1, blackboardKey: null, levelValues: null },
                    limitSource: false,
                    buffSource: fixedTarget('Source'),
                    isFinishedEarly: false,
                    finishSource: fixedTarget('Source'),
                  },
                },
              },
            },
          ],
        },
        {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      ).steps,
    ).toEqual([
      {
        kind: 'finishBuffsById',
        parameters: {
          target: 'party',
          buffIds: ['buff.fixture'],
          reason: 'other',
        },
      },
    ]);
  });

  it('FinishBuffAdvanced 可消费主动技能入口已证明的唯一敌人 Context', () => {
    const source = sourceFixture();
    const baseSequence = source.graph.abilityEvents[0]!.actions[0]!;
    const metadata = baseSequence.actions[0]!.metadata;
    const enemyContextOwner = {
      ...fixedTarget('Context'),
      targetGroupKey: 'smart_target',
    } as const;

    expect(
      projectSequence(
        {
          ...baseSequence,
          actions: [
            {
              sourcePath: 'SkillData.fixture.finishEnemyConduct',
              metadata,
              body: {
                kind: 'leaf',
                value: {
                  family: 'buffFinish',
                  action: {
                    kind: 'buffFinishByQuery',
                    owner: enemyContextOwner,
                    settings: {
                      checkType: 'Tag',
                      buffIds: [],
                      tagQuery: { queryType: 'hasAny', tagIds: [1466867135] },
                    },
                    finishAll: true,
                    finishLayerCount: { value: 1, blackboardKey: null, levelValues: null },
                    limitSource: false,
                    buffSource: fixedTarget('Source'),
                    isFinishedEarly: true,
                    isAbsorbed: false,
                    finishSource: fixedTarget('Source'),
                  },
                },
              },
            },
          ],
        },
        {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
          staticEnemyTargetGroupKeys: new Set(['smart_target']),
        },
      ).steps,
    ).toEqual([
      {
        kind: 'finishBuffsByTag',
        parameters: {
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
          reason: 'early',
        },
      },
    ]);
  });

  it('FinishBuffAdvanced 接受主动技能 Owner 指向施法者的消费来源', () => {
    const source = sourceFixture();
    const baseSequence = source.graph.abilityEvents[0]!.actions[0]!;
    const metadata = baseSequence.actions[0]!.metadata;
    expect(
      projectSequence(
        {
          ...baseSequence,
          actions: [
            {
              sourcePath: 'SkillData.fixture.finishEnemySpellStatus',
              metadata,
              body: {
                kind: 'leaf',
                value: {
                  family: 'buffFinish',
                  action: {
                    kind: 'buffFinishByQuery',
                    owner: fixedTarget('Target'),
                    settings: {
                      checkType: 'Tag',
                      buffIds: ['ignored-serialized-residue'],
                      tagQuery: { queryType: 'hasAny', tagIds: [-1558844517] },
                    },
                    finishAll: true,
                    finishLayerCount: { value: 1, blackboardKey: null, levelValues: null },
                    limitSource: false,
                    buffSource: fixedTarget('Source'),
                    isFinishedEarly: true,
                    isAbsorbed: false,
                    finishSource: fixedTarget('Owner'),
                  },
                },
              },
            },
          ],
        },
        {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      ).steps,
    ).toEqual([
      {
        kind: 'finishBuffsByTag',
        parameters: {
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
          reason: 'early',
        },
      },
    ]);
  });

  it('把治疗 Tag 条件和即时治疗属性修正投影到公共治疗修正', () => {
    const source = sourceFixture();
    const conditionNode = source.graph.abilityEvents[0]!.actions[0]!.actions[0]!;
    const definition = compileBuffRuntimeDefinitionSource(
      {
        ...source,
        healModifiers: [
          {
            enabledSide: 'Healer',
            condition: {
              onlyExecuteWhenSourceIsMainCharacter: false,
              onlyExecuteWhenSourceIsGuard: false,
              actions: [
                {
                  ...conditionNode,
                  body: {
                    kind: 'leaf',
                    value: {
                      family: 'condition',
                      action: {
                        kind: 'healTag',
                        sourceType: 'CheckHealTag',
                        queryType: 'hasAny',
                        tagIds: [-1517158118],
                      },
                    },
                  },
                },
              ],
            },
            processors: [
              {
                kind: 'instantAttribute',
                modifyTargetSide: 'Attacker',
                modifier: {
                  modifyAttributeType: 'Specific',
                  attributeType: 'HealOutputIncrease',
                  formulaItem: 'BaseAddition',
                  parameter: { value: 0, blackboardKey: 'heal_up', levelValues: [0.05] },
                },
              },
            ],
          },
        ],
      },
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
    );

    expect(definition.healModifiers).toEqual([
      {
        enabledSide: 'healer',
        condition: {
          kind: 'healTagsMatch',
          match: 'hasAny',
          tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
        },
        processors: [
          {
            kind: 'modifyHealingIncrease',
            timing: 'beforeCalculation',
            side: 'healer',
            addition: { blackboardKey: 'heal_up' },
          },
        ],
      },
    ]);
  });

  it('把低血量条件与治疗结果乘算投影到复刻库一致的治疗后处理', () => {
    const source = sourceFixture();
    const conditionNode = source.graph.abilityEvents[0]!.actions[0]!.actions[0]!;
    const definition = compileBuffRuntimeDefinitionSource({
      ...source,
      healModifiers: [
        {
          enabledSide: 'Healer',
          condition: {
            onlyExecuteWhenSourceIsMainCharacter: false,
            onlyExecuteWhenSourceIsGuard: false,
            actions: [
              {
                ...conditionNode,
                body: {
                  kind: 'leaf',
                  value: {
                    family: 'condition',
                    action: {
                      kind: 'health',
                      sourceType: 'CheckHp',
                      targetSource: 'Target',
                      targetGroupKey: '',
                      comparison: 'LE',
                      isRatio: true,
                      value: { value: 0.5, blackboardKey: 'rate', levelValues: null },
                      characterTeamSelection: null,
                    },
                  },
                },
              },
            ],
          },
          processors: [
            {
              kind: 'modifyCalculationResult',
              baseMultiplier: { value: 0, blackboardKey: 'heal_up', levelValues: null },
              multiplierCount: { value: 1, blackboardKey: null, levelValues: null },
            },
          ],
        },
      ],
    } as never);

    expect(definition.healModifiers).toEqual([
      {
        enabledSide: 'healer',
        condition: {
          kind: 'targetHealthCompare',
          valueType: 'ratio',
          operator: 'lessOrEqual',
          value: { blackboardKey: 'rate' },
        },
        processors: [
          {
            kind: 'modifyCalculationResult',
            timing: 'afterCalculation',
            baseMultiplier: { blackboardKey: 'heal_up' },
            multiplierCount: 1,
          },
        ],
      },
    ]);
  });

  it('把主控普攻末段的即时失衡属性修正投影到公共失衡修正', () => {
    const source = sourceFixture();
    const template = source.graph.abilityEvents[0]!.actions[0]!.actions[0]!;
    const project = (mask: number) =>
      compileBuffRuntimeDefinitionSource(
        {
          ...source,
          poiseModifiers: [
            {
              enabledSide: 'Attacker',
              condition: {
                onlyExecuteWhenSourceIsMainCharacter: false,
                onlyExecuteWhenSourceIsGuard: false,
                actions: [
                  {
                    ...template,
                    body: {
                      kind: 'leaf',
                      value: {
                        family: 'condition',
                        action: {
                          kind: 'damageDecorateMask',
                          sourceType: 'CheckDamageDecorateMask',
                          checkType: 'HasAll',
                          mask,
                        },
                      },
                    },
                  },
                  {
                    ...template,
                    sourcePath: `${template.sourcePath}.main`,
                    body: {
                      kind: 'leaf',
                      value: {
                        family: 'condition',
                        action: {
                          kind: 'mainOperator',
                          sourceType: 'CheckMainCharacterCondition',
                          targetSource: 'Source',
                          targetGroupKey: '',
                        },
                      },
                    },
                  },
                ],
              },
              processors: [
                {
                  kind: 'instantAttribute',
                  modifyTargetSide: 'Attacker',
                  modifier: {
                    modifyAttributeType: 'Specific',
                    attributeType: 'PoiseDamageOutputScalar',
                    formulaItem: 'BaseAddition',
                    parameter: { value: 0, blackboardKey: 'poise_up', levelValues: [0.3] },
                  },
                },
              ],
            },
          ],
        },
        undefined,
        undefined,
        undefined,
        undefined,
        { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
      );

    expect(() => project(128)).toThrow('unsupported poise decorate mask 128');
    expect(project(2097152).poiseModifiers).toEqual([
      {
        enabledSide: 'attacker',
        condition: {
          kind: 'all',
          conditions: [
            {
              kind: 'eventDamageTagsMatch',
              match: 'hasAll',
              tags: ['normalAttackLastCombo'],
            },
            { kind: 'casterControlled' },
          ],
        },
        processors: [
          {
            kind: 'modifyPoiseScalar',
            timing: 'beforeCalculation',
            side: 'attacker',
            addition: { blackboardKey: 'poise_up' },
          },
        ],
      },
    ]);
  });

  it('把有限容量护盾投影到公共 Buff 护盾定义', () => {
    const definition = compileBuffRuntimeDefinitionSource(
      {
        ...sourceFixture(),
        shields: [
          {
            infinityValue: false,
            value: {
              kind: 'definite',
              value: { value: 0, blackboardKey: 'shield_valid', levelValues: [500] },
              applyScale: false,
              valueScale: { value: 0, blackboardKey: null, levelValues: null },
            },
            damageAbsorptions: [],
            absorbCount: { value: -1, blackboardKey: null },
            absorbAllDamageWhenConsumed: false,
            removeBuffWhenConsumed: true,
            priority: 'Normal',
            replaceHitEffect: true,
          },
        ],
      },
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
    );

    expect(definition.shields).toEqual([
      {
        infinityValue: false,
        value: { blackboardKey: 'shield_valid' },
        damageAbsorptions: [],
        absorbCount: -1,
        absorbAllDamageWhenConsumed: false,
        removeBuffWhenConsumed: true,
        priority: 'normal',
        replaceHitEffect: true,
      },
    ]);
  });

  it('保留以 Buff 来源防御属性计算的护盾初值', () => {
    const definition = compileBuffRuntimeDefinitionSource(
      {
        ...sourceFixture(),
        shields: [
          {
            infinityValue: false,
            value: {
              kind: 'attribute',
              valueSource: 'AttackerOrHealer',
              attributeType: 'Def',
              multiplier: { value: 0.5, blackboardKey: 'shield_def_rate', levelValues: [0.5] },
              addition: { value: 100, blackboardKey: 'shield_base', levelValues: [100] },
            },
            damageAbsorptions: [],
            absorbCount: { value: -1, blackboardKey: null },
            absorbAllDamageWhenConsumed: false,
            removeBuffWhenConsumed: true,
            priority: 'Normal',
            replaceHitEffect: true,
          },
        ],
      },
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry },
    );

    expect(definition.shields?.[0]?.value).toEqual({
      attributeSource: 'buffSource',
      attribute: 'Def',
      multiplier: { blackboardKey: 'shield_def_rate' },
      addition: { blackboardKey: 'shield_base' },
    });
  });

  it('把事件来源技能类型与 CastSkillContext 的当前技能类型分开投影', () => {
    const source = sourceFixture();
    const condition = source.graph.abilityEvents[0]?.actions[0]?.actions[0];
    if (condition?.body.kind !== 'leaf' || condition.body.value.family !== 'condition') {
      throw new Error('fixture condition is missing');
    }
    const changed = {
      ...source,
      graph: {
        ...source.graph,
        abilityEvents: [
          {
            ...source.graph.abilityEvents[0]!,
            actions: [
              {
                ...source.graph.abilityEvents[0]!.actions[0]!,
                actions: [
                  {
                    ...condition,
                    body: {
                      kind: 'leaf' as const,
                      value: {
                        family: 'condition' as const,
                        action: {
                          kind: 'originSkillType' as const,
                          sourceType: 'CheckOriginSkillType',
                          skillTypes: ['Attack', 'NormalSkill'],
                          attackTypeMask: 'All',
                        },
                      },
                    },
                  },
                  ...source.graph.abilityEvents[0]!.actions[0]!.actions.slice(1),
                ],
              },
            ],
          },
        ],
      },
    };

    expect(
      (() => {
        const compiled = compileBuffRuntimeDefinitionSource(
          changed,
          undefined,
          undefined,
          undefined,
          undefined,
          {
            gameplayTagRegistry: fixtureGameplayTagRegistry,
          },
        );
        return readResourceActions(compiled, compiled.abilityEventResponses?.[0]?.sequence)[0];
      })(),
    ).toMatchObject({
      kind: 'conditional',
      parameters: {
        condition: {
          kind: 'originSkillTypeIn',
          skillTypes: ['basicAttack', 'plungingAttack', 'battleSkill'],
        },
      },
    });
  });

  it.each([
    [-4, ['plungingAttack']],
    [-7, ['basicAttack']],
  ] as const)('按原生三位掩码投影数值攻击类型 %s', (attackTypeMask, expected) => {
    const source = sourceFixture();
    const condition = source.graph.abilityEvents[0]?.actions[0]?.actions[0];
    if (condition?.body.kind !== 'leaf' || condition.body.value.family !== 'condition') {
      throw new Error('fixture condition is missing');
    }
    const changed = {
      ...source,
      graph: {
        ...source.graph,
        abilityEvents: [
          {
            ...source.graph.abilityEvents[0]!,
            actions: [
              {
                ...source.graph.abilityEvents[0]!.actions[0]!,
                actions: [
                  {
                    ...condition,
                    body: {
                      kind: 'leaf' as const,
                      value: {
                        family: 'condition' as const,
                        action: {
                          kind: 'originSkillType' as const,
                          sourceType: 'CheckOriginSkillType',
                          skillTypes: ['Attack'],
                          attackTypeMask,
                        },
                      },
                    },
                  },
                  ...source.graph.abilityEvents[0]!.actions[0]!.actions.slice(1),
                ],
              },
            ],
          },
        ],
      },
    };

    expect(
      (() => {
        const compiled = compileBuffRuntimeDefinitionSource(
          changed,
          undefined,
          undefined,
          undefined,
          undefined,
          {
            gameplayTagRegistry: fixtureGameplayTagRegistry,
          },
        );
        return readResourceActions(compiled, compiled.abilityEventResponses?.[0]?.sequence)[0];
      })(),
    ).toMatchObject({
      kind: 'conditional',
      parameters: { condition: { kind: 'originSkillTypeIn', skillTypes: expected } },
    });
  });

  it('将 Buff 事件中 Source 的当前技能类型解析为施放者', () => {
    const source = sourceFixture();
    const condition = source.graph.abilityEvents[0]?.actions[0]?.actions[0];
    if (condition?.body.kind !== 'leaf' || condition.body.value.family !== 'condition') {
      throw new Error('fixture condition is missing');
    }
    const changed = {
      ...source,
      graph: {
        ...source.graph,
        abilityEvents: [
          {
            ...source.graph.abilityEvents[0]!,
            actions: [
              {
                ...source.graph.abilityEvents[0]!.actions[0]!,
                actions: [
                  {
                    ...condition,
                    body: {
                      kind: 'leaf' as const,
                      value: {
                        family: 'condition' as const,
                        action: {
                          kind: 'skillType' as const,
                          sourceType: 'CheckSkillType',
                          checkTargetCurrentSkill: true,
                          skillOwner: {
                            targetSource: 'Source',
                            targetGroupKey: '',
                          } as never,
                          mustBeforeExclusiveTime: false,
                          skillTypes: ['NormalSkill'],
                          attackTypeMask: 'All',
                        },
                      },
                    },
                  },
                  ...source.graph.abilityEvents[0]!.actions[0]!.actions.slice(1),
                ],
              },
            ],
          },
        ],
      },
    };

    expect(
      (() => {
        const compiled = compileBuffRuntimeDefinitionSource(
          changed,
          undefined,
          undefined,
          undefined,
          undefined,
          {
            gameplayTagRegistry: fixtureGameplayTagRegistry,
          },
        );
        return readResourceActions(compiled, compiled.abilityEventResponses?.[0]?.sequence)[0];
      })(),
    ).toMatchObject({
      kind: 'conditional',
      parameters: {
        condition: {
          kind: 'currentSkillTypeIn',
          target: 'caster',
          skillTypes: ['battleSkill'],
        },
      },
    });
  });

  it.each([
    {
      validatorTypes: [] as string[],
      postProcessorTypes: [] as string[],
      excludesOwner: false,
      expectedTarget: 'party' as const,
    },
    {
      validatorTypes: ['ExcludeOwnerValidator'],
      postProcessorTypes: [] as string[],
      excludesOwner: false,
      expectedTarget: 'partyExceptCaster' as const,
    },
    {
      validatorTypes: [] as string[],
      postProcessorTypes: ['ExcludeTarget'],
      excludesOwner: true,
      expectedTarget: 'partyExceptCaster' as const,
    },
  ])(
    '把显式技力筛选和队伍查询编译为 $expectedTarget Buff 响应',
    ({ validatorTypes, postProcessorTypes, excludesOwner, expectedTarget }) => {
      const source = sourceFixture();
      const sequence = source.graph.abilityEvents[0]!.actions[0]!;
      const apply = sequence.actions[1]!;
      if (apply.body.kind !== 'leaf' || apply.body.value.family !== 'buffApplication') {
        throw new Error('invalid fixture');
      }
      const metadata = apply.metadata;
      const definition = compileBuffRuntimeDefinitionSource(
        {
          ...source,
          graph: {
            ...source.graph,
            abilityEvents: [
              {
                event: 'OnObtainAtb',
                actions: [
                  {
                    ...sequence,
                    actions: [
                      {
                        sourcePath: 'BuffData.buff_root.obtain-filter',
                        metadata,
                        body: {
                          kind: 'leaf',
                          value: {
                            family: 'condition',
                            action: {
                              kind: 'obtainAtbType',
                              sourceType: 'CheckObtainAtbType',
                              checkObtainType: true,
                              obtainTypes: ['Skill'],
                              checkObtainMethod: true,
                              obtainMethods: ['Gain'],
                            },
                          },
                        },
                      },
                      {
                        sourcePath: 'BuffData.buff_root.find-party',
                        metadata: { ...metadata, serverActionIndex: 1 },
                        body: {
                          kind: 'leaf',
                          value: {
                            family: 'targetGroup',
                            action: {
                              producerType: 'FindTargetAction',
                              targetGroupKey: 'teammate',
                              finderType: 'CharacterTeamFinder',
                              validatorTypes,
                              postProcessorTypes,
                              excludesOwner,
                              center: 'ActionSource',
                              centerContextKey: '',
                              selectorOwner: 'ActionSource',
                              selectorOwnerContextKey: '',
                            } as never,
                          },
                        },
                      },
                      {
                        ...apply,
                        metadata: { ...metadata, serverActionIndex: 2 },
                        body: {
                          ...apply.body,
                          value: {
                            ...apply.body.value,
                            action: {
                              ...apply.body.value.action,
                              target: {
                                targetSource: 'Context',
                                targetGroupKey: 'teammate',
                              } as never,
                            },
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
        undefined,
        undefined,
        undefined,
        undefined,
        { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
      );

      expect(
        definition.abilityEventResponses?.map(response => ({
          ...response,
          sequence: response.sequence,
        })),
      ).toMatchObject([
        {
          event: 'skillSpGained',
          sequence: graphBranch(
            definition.actionGraph!.main,
            [
              {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'eventSpGainMatch',
                    sources: ['skill'],
                    gainKinds: ['gain'],
                  },
                },
                whenTrue: graphBranch(
                  definition.actionGraph!.main,
                  [{ kind: 'applyBuff', parameters: { target: expectedTarget } }],
                  true,
                ),
              },
            ],
            true,
          ),
        },
      ]);
    },
  );

  it('技力 Buff 响应允许无类型筛选的动作序列', () => {
    const source = sourceFixture();
    const sequence = source.graph.abilityEvents[0]!.actions[0]!;
    const definition = compileBuffRuntimeDefinitionSource({
      ...source,
      graph: {
        ...source.graph,
        abilityEvents: [
          {
            event: 'OnObtainAtb',
            actions: [
              {
                ...sequence,
                actions: [sequence.actions[1]!],
              },
            ],
          },
        ],
      },
    });
    expect(
      definition.abilityEventResponses?.map(response => ({
        ...response,
        sequence: response.sequence,
      })),
    ).toMatchObject([
      {
        event: 'skillSpGained',
        sequence: graphBranch(definition.actionGraph!.main, [{ kind: 'applyBuff' }], true),
      },
    ]);
  });

  it('把无条件普通乘区增伤投影为 Buff 伤害修正', () => {
    const source = sourceFixture();
    const definition = compileBuffRuntimeDefinitionSource(
      {
        ...source,
        damageModifiers: [
          {
            enabledSide: 'Attacker',
            condition: {
              onlyExecuteWhenSourceIsMainCharacter: false,
              onlyExecuteWhenSourceIsGuard: false,
              actions: [],
            },
            processors: [
              {
                kind: 'damageScale',
                side: 'Attacker',
                zoneName: 'NormalCalcZone',
                addition: { value: 0, blackboardKey: 'atk_up', levelValues: [0.05] },
              },
            ],
          },
        ],
      },
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
    );

    expect(definition.damageModifiers).toEqual([
      {
        enabledSide: 'attacker',
        processors: [
          {
            kind: 'damageScale',
            side: 'attacker',
            zone: 'normal',
            addition: { blackboardKey: 'atk_up' },
          },
        ],
      },
    ]);
  });

  it('把武器伤害类型、伤害标签、敌人标签、Buff 层数和失衡条件投影到公共伤害条件', () => {
    const source = sourceFixture();
    const metadata = source.graph.abilityEvents[0]!.actions[0]!.actions[0]!.metadata;
    const processor = {
      kind: 'damageScale' as const,
      side: 'Attacker',
      zoneName: 'NormalCalcZone',
      addition: { value: 0.1, blackboardKey: null, levelValues: null },
    };
    const modifier = (action: unknown) => ({
      enabledSide: 'Attacker',
      condition: {
        onlyExecuteWhenSourceIsMainCharacter: false,
        onlyExecuteWhenSourceIsGuard: false,
        actions: [
          {
            sourcePath: 'BuffData.weapon.condition',
            metadata,
            body: { kind: 'leaf', value: { family: 'condition', action } },
          },
        ],
      },
      processors: [processor],
    });
    const definition = compileBuffRuntimeDefinitionSource(
      {
        ...source,
        damageModifiers: [
          modifier({ kind: 'damageTypeMask', damageTypes: ['Cryst', 'Natural'] }),
          modifier({ kind: 'damageDecorateMask', checkType: 'HasAny', mask: 768 }),
          modifier({
            kind: 'entityTag',
            targetSource: 'Target',
            targetGroupKey: 'inactive-residual-group',
            tagQueryType: 'hasAny',
            tagIds: [1570888476],
          }),
          modifier({
            kind: 'buffStack',
            targetSource: 'Target',
            targetGroupKey: '',
            buffCheckType: 'Id',
            buffIds: ['buff_physical_no_guard'],
            tagQueryType: 'hasAny',
            buffTagIds: [],
            countType: 'BuffCount',
            comparison: 'GE',
            value: { value: 1, blackboardKey: null, levelValues: null },
            limitSkillCastId: false,
          }),
          modifier({
            kind: 'poise',
            target: { ...fixedTarget('Target'), targetGroupKey: '' },
            returnValueIfMissing: false,
            comparison: 'LE',
            value: { value: 0, blackboardKey: null, levelValues: null },
          }),
          modifier({
            kind: 'health',
            targetSource: 'Target',
            targetGroupKey: '',
            comparison: 'LT',
            isRatio: true,
            value: { value: 0, blackboardKey: 'hp_remain', levelValues: [0.5] },
            characterTeamSelection: null,
          }),
        ] as never,
      },
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
    );

    expect(definition.damageModifiers?.map(item => item.condition)).toEqual([
      { kind: 'eventDamageTypesMatch', damageTypes: ['cryo', 'nature'] },
      {
        kind: 'eventDamageTagsMatch',
        match: 'hasAny',
        tags: ['normalSkill', 'ultimateSkill'],
      },
      {
        kind: 'entityTagMatch',
        target: 'enemy',
        tagQueryType: 'hasAny',
        tags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
      },
      {
        kind: 'buffIdCountCompare',
        target: 'enemy',
        buffIds: ['buff_physical_no_guard'],
        operator: 'greaterOrEqual',
        value: 1,
      },
      {
        kind: 'targetPoiseCompare',
        target: 'enemy',
        returnValueIfMissing: false,
        operator: 'lessOrEqual',
        value: 0,
      },
      {
        kind: 'targetHealthCompare',
        target: 'enemy',
        valueType: 'ratio',
        operator: 'less',
        value: { blackboardKey: 'hp_remain' },
      },
    ]);
  });

  it('把技能类型守卫、动态传参、属性修正和图标投影为正式 Next 定义', () => {
    const definition = compileBuffRuntimeDefinitionSource(
      sourceFixture(),
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
    );

    expect(
      definition.abilityEventResponses?.map(response => ({
        ...response,
        sequence: response.sequence,
      })),
    ).toMatchObject([
      {
        event: 'beforeCastSkill',
        priority: 0,
        sequence: graphBranch(
          definition.actionGraph!.main,
          [
            {
              kind: 'conditional',
              parameters: {
                condition: { kind: 'eventSkillTypeIn', skillTypes: ['battleSkill'] },
              },
              whenTrue: graphBranch(
                definition.actionGraph!.main,
                [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_child',
                      target: 'buffOwner',
                    },
                  },
                ],
                true,
              ),
            },
          ],
          true,
        ),
      },
    ]);
    const { abilityEventResponses: _responses, ...definitionWithoutResponses } = definition;
    expect(definitionWithoutResponses).toMatchObject({
      stackingType: 'unique',
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_atk_up',
        iconPath: '/icons/icon_battle_buff_atk_up.webp',
        showInSquadIcon: true,
        showProgressInNormalSkillButton: true,
        useWeakProgressInNormalSkillButton: true,
        showWarningBackground: true,
      },
      blackboard: { atk_up: 0.05, duration: 15 },
      attributeModifiers: [
        { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
      ],
    });
    const condition = readResourceActions(
      definition,
      definition.abilityEventResponses?.[0]?.sequence,
    )[0];
    if (condition?.kind !== 'conditional') throw new Error('expected guarded child Buff');
    const child = readResourceActions(definition, condition.whenTrue)[0];
    if (child?.kind !== 'applyBuff') throw new Error('expected child Buff application');
    expect(child.parameters).not.toHaveProperty('blackboardAssignments');
  });

  it('把原生 Main 属性修正保留为运行时主属性选择器', () => {
    const fixture = sourceFixture();
    const source = {
      ...fixture,
      attributeModifiers: {
        ...fixture.attributeModifiers,
        modifiers: [
          {
            ...fixture.attributeModifiers.modifiers[0]!,
            modifyAttributeType: 'Main' as const,
          },
        ],
      },
    };

    const definition = compileBuffRuntimeDefinitionSource(
      source,
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry },
    );

    expect(definition.attributeModifiers).toEqual([
      { attribute: { kind: 'main' }, slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
    ]);
  });

  it('fails closed on behavior payloads that are not in the common IR', () => {
    const source = sourceFixture();
    expect(() =>
      compileBuffRuntimeDefinitionSource(
        {
          ...source,
          unsupportedPayloads: [{ field: 'damageModifier', entryCount: 1 }],
        },
        undefined,
        undefined,
        undefined,
        undefined,
        { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
      ),
    ).toThrow('unsupported Buff payloads: damageModifier');
  });

  it('distinguishes declared-only blackboard values from executable reads', () => {
    const source = sourceFixture();

    expect(buffRuntimeReadsBlackboardKey(source, 'unused')).toBe(false);
    expect(buffRuntimeReadsBlackboardKey(source, 'atk_up')).toBe(true);
    expect(buffRuntimeReadsBlackboardKey(source, 'duration')).toBe(false);
  });

  it('严格归约固定满血场景的 ToggleBuff 条件', () => {
    expect(
      evaluateFixedFullHealthToggleCondition({
        kind: 'currentHpRatio',
        comparison: 'GE',
        value: 0.8,
      }),
    ).toBe(true);
    expect(
      evaluateFixedFullHealthToggleCondition({
        kind: 'currentHpRatio',
        comparison: 'LE',
        value: 0.5,
      }),
    ).toBe(false);
    expect(
      evaluateFixedFullHealthToggleCondition({
        kind: 'currentHpRatio',
        comparison: 'LE',
        value: { kind: 'unresolvedSkillBlackboard', key: 'hp_ratio' },
      }),
    ).toBeNull();
  });

  it('玩家受击监听默认保留，也允许调用方显式省略', () => {
    const source = sourceFixture();
    const damageTakenSource: BuffRuntimeSource = {
      ...source,
      graph: {
        ...source.graph,
        abilityEvents: source.graph.abilityEvents.map(event => ({
          ...event,
          event: 'OnTakeDamage',
        })),
      },
    };

    expect(
      compileBuffRuntimeDefinitionSource(
        damageTakenSource,
        undefined,
        undefined,
        undefined,
        undefined,
        { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
      ).abilityEventResponses?.[0]?.event,
    ).toBe('takeDamage');
    expect(
      compileBuffRuntimeDefinitionSource(
        damageTakenSource,
        new Set(),
        new Set(['OnTakeDamage']),
        undefined,
        undefined,
        { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
      ).abilityEventResponses,
    ).toBeUndefined();
  });

  it('只把敌方宿主的 OnEnemyBeforeTakeSpellInfliction 映射为目标方附着入口', () => {
    const source = sourceFixture();
    const enemyListener: BuffRuntimeSource = {
      ...source,
      graph: {
        ...source.graph,
        abilityEvents: source.graph.abilityEvents.map(event => ({
          ...event,
          event: 'OnEnemyBeforeTakeSpellInfliction',
        })),
      },
    };

    expect(
      compileBuffRuntimeDefinitionSource(
        enemyListener,
        undefined,
        undefined,
        undefined,
        undefined,
        { fixedBuffOwnerTarget: 'enemy', gameplayTagRegistry: fixtureGameplayTagRegistry },
      ).abilityEventResponses?.[0]?.event,
    ).toBe('beforeTakeInfliction');
    expect(() =>
      compileBuffRuntimeDefinitionSource(
        enemyListener,
        undefined,
        undefined,
        undefined,
        undefined,
        { fixedBuffOwnerTarget: 'caster', gameplayTagRegistry: fixtureGameplayTagRegistry },
      ),
    ).toThrow('requires a proven enemy Buff owner');
  });

  it('把 OnOutputBuff 的标签条件投影为公共事件 Buff 条件', () => {
    const source = sourceFixture();
    const nativeEvent = source.graph.abilityEvents[0]!;
    const nativeSequence = nativeEvent.actions[0]!;
    const tagSource: BuffRuntimeSource = {
      ...source,
      graph: {
        ...source.graph,
        abilityEvents: [
          {
            ...nativeEvent,
            event: 'OnOutputBuff',
            actions: [
              {
                ...nativeSequence,
                actions: [
                  {
                    ...nativeSequence.actions[0]!,
                    body: {
                      kind: 'leaf',
                      value: {
                        family: 'condition',
                        action: {
                          kind: 'contextBuff',
                          sourceType: 'CheckBuffIdInContext',
                          matcher: {
                            kind: 'tag',
                            queryType: 'hasAny',
                            buffTagIds: [1466867135],
                          },
                        },
                      },
                    },
                  },
                  nativeSequence.actions[1]!,
                ],
              },
            ],
          },
        ],
      },
    };

    const outputBuffDefinition = compileBuffRuntimeDefinitionSource(
      tagSource,
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry },
    );
    expect(
      outputBuffDefinition.abilityEventResponses?.map(response => ({
        ...response,
        sequence: response.sequence,
      })),
    ).toEqual([
      {
        event: 'outputBuff',
        priority: 0,
        sequence: graphBranch(outputBuffDefinition.actionGraph!.main, [
          {
            kind: 'conditional',
            parameters: {
              condition: {
                kind: 'eventBuffTagsMatch',
                match: 'hasAny',
                buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
              },
            },
            whenTrue: expect.any(Object),
          },
        ]),
      },
    ]);
  });

  it.each([
    ['Target', 'actionInputTarget'],
    ['Owner', 'buffOwner'],
    ['Source', 'caster'],
  ])('按原生 BuffCount 保留 %s 的增强层数守卫，不统一指向事件目标', (targetSource, target) => {
    const source = sourceFixture();
    const nativeEvent = source.graph.abilityEvents[0]!;
    const nativeSequence = nativeEvent.actions[0]!;
    const apply = nativeSequence.actions[1]!;
    const countCondition = {
      ...nativeSequence.actions[0]!,
      sourcePath: 'BuffData.buff_root.count',
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'condition' as const,
          action: {
            kind: 'buffStack' as const,
            sourceType: 'CheckBuffStackNumAdvanced',
            targetSource,
            targetGroupKey: '',
            buffCheckType: 'Tag',
            buffIds: [],
            tagQueryType: 'hasAny' as const,
            buffTagIds: [1075718177],
            countType: 'BuffCount',
            comparison: 'GE',
            value: { value: 3, blackboardKey: 'stack_cond', levelValues: [3] },
            limitSkillCastId: false,
          },
        },
      },
    };
    const countSource: BuffRuntimeSource = {
      ...source,
      graph: {
        ...source.graph,
        declaredBlackboard: [
          ...source.graph.declaredBlackboard,
          { key: 'stack_cond', value: 3, isDynamic: false },
        ],
        abilityEvents: [
          {
            ...nativeEvent,
            event: 'OnOutputBuff',
            actions: [
              {
                ...nativeSequence,
                actions: [nativeSequence.actions[0]!, apply, countCondition, apply],
              },
            ],
          },
        ],
      },
    };

    const countDefinition = compileBuffRuntimeDefinitionSource(
      countSource,
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry },
    );
    const steps = readResourceActions(
      countDefinition,
      countDefinition.abilityEventResponses?.[0]?.sequence,
    );
    expect(steps).toEqual([
      {
        kind: 'conditional',
        parameters: {
          condition: {
            kind: 'eventSkillTypeIn',
            skillTypes: ['battleSkill'],
          },
        },
        whenTrue: graphBranch(countDefinition.actionGraph!.main, [
          expect.objectContaining({ kind: 'applyBuff' }),
          {
            kind: 'conditional',
            parameters: {
              condition: {
                kind: 'buffStackCompare',
                target,
                tagQueryType: 'hasAny',
                buffTags: ['Skill/Character/Common/NoGuard'],
                operator: 'greaterOrEqual',
                value: { kind: 'blackboard', key: 'stack_cond' },
              },
            },
            whenTrue: graphBranch(countDefinition.actionGraph!.main, [
              expect.objectContaining({ kind: 'applyBuff' }),
            ]),
          },
        ]),
      },
    ]);
  });

  it.each(['Context', 'Target'])('NoGuard 的 %s 查询保留 Buff 计数而非失衡判断', targetSource => {
    const source = sourceFixture();
    const nativeSequence = source.graph.abilityEvents[0]!.actions[0]!;
    const countCondition = {
      ...nativeSequence.actions[0]!,
      sourcePath: 'SkillData.combo.count',
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'condition' as const,
          action: {
            kind: 'buffStack' as const,
            sourceType: 'CheckBuffStackNumAdvanced',
            targetSource,
            targetGroupKey: targetSource === 'Context' ? 'smart_target' : '',
            buffCheckType: 'Tag',
            buffIds: [],
            tagQueryType: 'hasAny' as const,
            buffTagIds: [1075718177],
            countType: 'BuffCount',
            comparison: 'GE',
            value: { value: 1, blackboardKey: null, levelValues: null },
            limitSkillCastId: false,
          },
        },
      },
    };

    expect(
      projectSequence(
        { ...nativeSequence, actions: [countCondition, nativeSequence.actions[1]!] },
        {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
          staticEnemyTargetGroupKeys: new Set(['smart_target']),
        },
      ).steps[0],
    ).toMatchObject({
      kind: 'conditional',
      parameters: {
        condition: {
          kind: 'buffStackCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    });
  });

  it('Tag + BuffIdCount 保留为不同 Buff 定义 ID 数量条件', () => {
    const source = sourceFixture();
    const nativeSequence = source.graph.abilityEvents[0]!.actions[0]!;
    const countCondition = {
      ...nativeSequence.actions[0]!,
      sourcePath: 'SkillData.ardelia.countCorrosionKinds',
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'condition' as const,
          action: {
            kind: 'buffStack' as const,
            sourceType: 'CheckBuffStackNumAdvanced',
            targetSource: 'Target',
            targetGroupKey: '',
            buffCheckType: 'Tag',
            buffIds: [],
            tagQueryType: 'hasAny' as const,
            buffTagIds: [1075718177],
            countType: 'BuffIdCount',
            comparison: 'GE',
            value: { value: 1, blackboardKey: null, levelValues: null },
            limitSkillCastId: false,
          },
        },
      },
    };

    expect(
      projectSequence(
        { ...nativeSequence, actions: [countCondition, nativeSequence.actions[1]!] },
        {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'currentOperator',
        },
      ).steps[0],
    ).toMatchObject({
      kind: 'conditional',
      parameters: {
        condition: {
          kind: 'buffTagIdCountCompare',
          target: 'currentTarget',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    });
  });

  it('闭合物理异常事件中的计数写回、动态乘法和 OR 条件', () => {
    const source = sourceFixture();
    const sequence = source.graph.abilityEvents[0]!.actions[0]!;
    const metadata = sequence.actions[0]!.metadata;
    const target = { targetSource: 'Target', targetGroupKey: '' } as never;
    const scalar = (value: number, blackboardKey: string | null = null) => ({
      value,
      blackboardKey,
      levelValues: null,
    });
    const conditionNode = (sourcePath: string, action: unknown, serverActionIndex: number) => ({
      sourcePath,
      metadata: { ...metadata, serverActionIndex },
      body: { kind: 'leaf' as const, value: { family: 'condition' as const, action } },
    });
    const mutationNode = (
      sourcePath: string,
      key: string,
      operation: string,
      value: ReturnType<typeof scalar>,
      serverActionIndex: number,
    ) => ({
      sourcePath,
      metadata: { ...metadata, serverActionIndex },
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'blackboardMutation' as const,
          action: {
            kind: 'blackboardMutation' as const,
            key,
            operation,
            value,
            directValue: true,
            calculationTarget: { targetSource: 'Owner' } as never,
            calculationType: 'HpRatio',
          },
        },
      },
    });
    const buffStack = (checkType: 'Tag' | 'Id', buffIds: readonly string[], tagIds: number[]) => ({
      kind: 'buffStack' as const,
      sourceType: 'CheckBuffStackNumAdvanced',
      targetSource: 'Target',
      targetGroupKey: '',
      buffCheckType: checkType,
      buffIds,
      tagQueryType: 'hasAny' as const,
      buffTagIds: tagIds,
      countType: 'BuffCount',
      comparison: 'GE',
      value: scalar(1),
      limitSkillCastId: false,
    });
    const ifElse = {
      sourcePath: 'BuffData.buff_root.specialMultiplier',
      metadata: { ...metadata, serverActionIndex: 3 },
      body: {
        kind: 'ifElse' as const,
        condition: {
          onlyExecuteWhenSourceIsMainCharacter: false,
          onlyExecuteWhenSourceIsGuard: false,
          actions: [
            conditionNode(
              'BuffData.buff_root.specialMultiplier.any',
              {
                kind: 'any',
                sourceType: 'OrConditionAction',
                groups: [
                  { conditions: [buffStack('Tag', [], [1066759270])], negated: [false] },
                  {
                    conditions: [buffStack('Id', ['buff_common_originum_frozen'], [])],
                    negated: [false],
                  },
                  {
                    conditions: [
                      {
                        kind: 'poise',
                        sourceType: 'CheckPoiseValue',
                        target,
                        returnValueIfMissing: false,
                        comparison: 'Equals',
                        value: scalar(0),
                      },
                    ],
                    negated: [false],
                  },
                ],
              },
              4,
            ),
          ],
        },
        whenTrue: {
          onlyExecuteWhenSourceIsMainCharacter: false,
          onlyExecuteWhenSourceIsGuard: false,
          actions: [
            mutationNode(
              'BuffData.buff_root.multiply',
              'perStack',
              'Multiply',
              scalar(0, 'special'),
              5,
            ),
          ],
        },
        whenFalse: {
          onlyExecuteWhenSourceIsMainCharacter: false,
          onlyExecuteWhenSourceIsGuard: false,
          actions: [],
        },
        alwaysNext: true,
      },
    };
    const eventSource: BuffRuntimeSource = {
      ...source,
      graph: {
        ...source.graph,
        abilityEvents: [
          {
            event: 'OnBeforeOutputPhysicalInfliction',
            actions: [
              {
                onlyExecuteWhenSourceIsMainCharacter: false,
                onlyExecuteWhenSourceIsGuard: false,
                actions: [
                  conditionNode(
                    'BuffData.buff_root.physicalType',
                    {
                      kind: 'physicalInflictionType',
                      sourceType: 'CheckPhysicalInflictionType',
                      types: ['fracture', 'crush'],
                      savedKey: '',
                    },
                    0,
                  ),
                  {
                    sourcePath: 'BuffData.buff_root.readCount',
                    metadata: { ...metadata, serverActionIndex: 1 },
                    body: {
                      kind: 'leaf',
                      value: {
                        family: 'buffQuery',
                        action: {
                          kind: 'buffStackRead',
                          sourceType: 'SaveBuffStackNumAdvanced',
                          target,
                          checkType: 'Tag',
                          buffIds: [],
                          tagQueryType: 'hasAny',
                          buffTagIds: [1075718177],
                          countType: 'BuffCount',
                          limitSkillCastId: false,
                          outputKey: 'count',
                        },
                      },
                    },
                  },
                  mutationNode(
                    'BuffData.buff_root.assign',
                    'perStack',
                    'Assign',
                    scalar(0, 'base'),
                    2,
                  ),
                  ifElse,
                ] as never,
              },
            ],
          },
        ],
      },
    };

    const compiledDefinition = compileBuffRuntimeDefinitionSource(
      eventSource,
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry },
    );
    const compiled = compiledDefinition.abilityEventResponses?.map(response => ({
      ...response,
      sequence: response.sequence,
    }));
    // 原生 BuffCount 必须走增强层数默认模式，不能在部分匹配断言中漏掉 instance。
    expect(JSON.stringify(compiledDefinition.actionGraph)).not.toContain('"countType":"instance"');
    expect(compiled).toMatchObject([
      {
        event: 'beforeOutputPhysicalInfliction',
        sequence: graphBranch(
          compiledDefinition.actionGraph!.main,
          [
            {
              parameters: {
                condition: {
                  kind: 'eventPhysicalInflictionTypeIn',
                  types: ['fracture', 'crush'],
                },
              },
              whenTrue: graphBranch(
                compiledDefinition.actionGraph!.main,
                [
                  {
                    kind: 'readBuffStackCount',
                    parameters: { target: 'eventTarget', outputKey: 'count' },
                  },
                  {
                    kind: 'modifyActionValue',
                    parameters: { key: 'perStack', operation: 'assign' },
                  },
                  {
                    kind: 'conditional',
                    parameters: { condition: { kind: 'any' }, alwaysNext: true },
                    whenTrue: graphBranch(
                      compiledDefinition.actionGraph!.main,
                      [
                        {
                          kind: 'modifyActionValue',
                          parameters: { key: 'perStack', operation: 'multiply' },
                        },
                      ],
                      true,
                    ),
                  },
                ],
                true,
              ),
            },
          ],
          true,
        ),
      },
    ]);
  });

  it('把输出 Buff 后的全局冷却、简单伤害和冷却写入保留为同一短路线性链', () => {
    const source = sourceFixture();
    const nativeEvent = source.graph.abilityEvents[0]!;
    const nativeSequence = nativeEvent.actions[0]!;
    const metadata = nativeSequence.actions[0]!.metadata;
    const eventTagNode = {
      ...nativeSequence.actions[0]!,
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'condition' as const,
          action: {
            kind: 'contextBuff' as const,
            sourceType: 'CheckBuffIdInContext',
            matcher: {
              kind: 'tag' as const,
              queryType: 'hasAny' as const,
              buffTagIds: [-6380412],
            },
          },
        },
      },
    };
    const cooldownNode = {
      sourcePath: 'BuffData.buff_root.cooldown',
      metadata: { ...metadata, serverActionIndex: 1 },
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'condition' as const,
          action: {
            kind: 'globalCooldown' as const,
            sourceType: 'CheckGlobalCDTimerAction',
            targetSource: 'Owner',
            targetGroupKey: '',
            buffId: 'buff_equipsuit_physuit_01',
          },
        },
      },
    };
    const damageNode = {
      sourcePath: 'BuffData.buff_root.damage',
      metadata: { ...metadata, serverActionIndex: 2 },
      body: {
        kind: 'leaf' as const,
        value: { family: 'damage' as const, action: simpleDamageFixture() },
      },
    };
    const cooldownWriteNode = {
      sourcePath: 'BuffData.buff_root.cooldownWrite',
      metadata: { ...metadata, serverActionIndex: 3 },
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'globalCooldown' as const,
          action: {
            kind: 'globalCooldownApplication' as const,
            target: fixedTarget('Source'),
            buffId: 'buff_equipsuit_physuit_01',
            duration: { value: 0, blackboardKey: 'duration', levelValues: [15] },
          },
        },
      },
    };
    const runtimeSource: BuffRuntimeSource = {
      ...source,
      graph: {
        ...source.graph,
        declaredBlackboard: [
          ...source.graph.declaredBlackboard,
          { key: 'atk_scale', value: 1, isDynamic: false },
          { key: 'poise', value: 0, isDynamic: false },
        ],
        abilityEvents: [
          {
            ...nativeEvent,
            event: 'OnOutputBuff',
            actions: [
              {
                ...nativeSequence,
                actions: [eventTagNode, cooldownNode, damageNode, cooldownWriteNode],
              },
            ],
          },
        ],
      },
    };

    const runtimeDefinition = compileBuffRuntimeDefinitionSource(
      runtimeSource,
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry },
    );
    expect(
      readResourceActions(
        runtimeDefinition,
        runtimeDefinition.abilityEventResponses?.[0]?.sequence,
      ),
    ).toEqual([
      {
        kind: 'conditional',
        parameters: {
          condition: {
            kind: 'eventBuffTagsMatch',
            match: 'hasAny',
            buffTags: ['Skill/Character/Common/PhysicalStatus'],
          },
        },
        whenTrue: graphBranch(runtimeDefinition.actionGraph!.main, [
          {
            kind: 'conditional',
            parameters: {
              condition: {
                kind: 'not',
                condition: {
                  kind: 'globalCooldownPresent',
                  target: 'buffOwner',
                  markerId: 'buff_equipsuit_physuit_01',
                },
              },
            },
            whenTrue: graphBranch(runtimeDefinition.actionGraph!.main, [
              {
                kind: 'dealDamage',
                parameters: {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: [],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
              },
              {
                kind: 'setGlobalCooldown',
                parameters: {
                  target: 'caster',
                  markerId: 'buff_equipsuit_physuit_01',
                  durationSeconds: { kind: 'blackboard', key: 'duration' },
                },
              },
            ]),
          },
        ]),
      },
    ]);
  });

  it('把首次启用声音与满血治疗双分支投影到既有 Buff 事件协议', () => {
    const source = sourceFixture();
    const nativeEvent = source.graph.abilityEvents[0]!;
    const nativeSequence = nativeEvent.actions[0]!;
    const applyNode = nativeSequence.actions[1]!;
    if (applyNode.body.kind !== 'leaf' || applyNode.body.value.family !== 'buffApplication') {
      throw new Error('invalid fixture');
    }
    const eventTargetApply = {
      ...applyNode,
      body: {
        kind: 'leaf' as const,
        value: {
          ...applyNode.body.value,
          action: {
            ...applyNode.body.value.action,
            target: { ...fixedTarget('Target'), targetGroupKey: '' },
          },
        },
      },
    };
    const overhealNode = {
      ...nativeSequence.actions[0]!,
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'condition' as const,
          action: {
            kind: 'overHeal' as const,
            sourceType: 'CheckOverHeal',
            overHealKey: '',
            finalHealKey: '',
            realHealKey: '',
          },
        },
      },
    };
    const negateNode = {
      sourcePath: 'BuffData.buff_root.not',
      metadata: { ...applyNode.metadata, serverActionIndex: 2 },
      body: { kind: 'negateNextResult' as const },
    };
    const presentationNode = {
      sourcePath: 'BuffData.buff_root.sound',
      metadata: applyNode.metadata,
      body: {
        kind: 'leaf' as const,
        value: {
          family: 'presentation' as const,
          action: {
            kind: 'playSound' as const,
            soundEvent: 'au_int_cure_one',
          } as never,
        },
      },
    };
    const compiled = compileBuffRuntimeDefinitionSource(
      {
        ...source,
        graph: {
          ...source.graph,
          buffEvents: [
            {
              event: 'OnBuffStart',
              actions: [{ ...nativeSequence, actions: [applyNode, presentationNode] }],
            },
          ],
          abilityEvents: [
            {
              ...nativeEvent,
              event: 'OnOutputHeal',
              actions: [
                { ...nativeSequence, actions: [overhealNode, eventTargetApply] },
                { ...nativeSequence, actions: [negateNode, overhealNode, eventTargetApply] },
              ],
            },
          ],
        },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      { gameplayTagRegistry: fixtureGameplayTagRegistry, ...{} },
    );

    expect(readResourceActions(compiled, compiled.lifecycleSequences?.start)).toMatchObject([
      { kind: 'applyBuff', parameters: { target: 'buffOwner' } },
    ]);
    expect(
      compiled.abilityEventResponses?.map(response => ({
        ...response,
        sequence: response.sequence,
      })),
    ).toMatchObject([
      {
        event: 'outputHeal',
        sequence: graphBranch(
          compiled.actionGraph!.main,
          [
            {
              parameters: { condition: { kind: 'eventOverheal' } },
              whenTrue: graphBranch(
                compiled.actionGraph!.main,
                [{ parameters: { target: 'eventTarget' } }],
                true,
              ),
            },
          ],
          true,
        ),
      },
      {
        event: 'outputHeal',
        sequence: graphBranch(
          compiled.actionGraph!.main,
          [
            {
              parameters: {
                condition: { kind: 'not', condition: { kind: 'eventOverheal' } },
              },
              whenTrue: graphBranch(
                compiled.actionGraph!.main,
                [{ parameters: { target: 'eventTarget' } }],
                true,
              ),
            },
          ],
          true,
        ),
      },
    ]);
  });
});

function fixedTarget(targetSource: string): TargetReferenceSource {
  return {
    targetSource,
    targetGroupKey: targetSource === 'Target' ? 'ignored-residual' : '',
    selectorOwner: 'ActionOwner',
    ownerContextKey: '',
    centerType: 'ActionSource',
    centerContextKey: '',
    centerToGround: false,
    target: 'ActionSource',
    targetContextKey: '',
    enableAdvancedDirection: false,
    selectorDirection: 'SourceForward',
    finderType: null,
    finderShape: null,
    finderOwnerPartsQuery: null,
    validatorTypes: [],
    postProcessorTypes: [],
    priorityFilters: [],
    shuffleTargets: [],
    distanceValidators: [],
    finderSpawnedObjectType: null,
    validatorTagQueries: [],
  };
}

describe('固定木桩 RangedAura 投影', () => {
  it('唯一敌人进入范围时只执行一次完整进入动作树', () => {
    const metadata = {
      nativeType: 'fixture',
      nativeName: 'fixture',
      enabled: true,
      priorityLevel: 'Default',
      priorityOffset: 0,
      serverActionIndex: 1,
    };
    const actionOnEnter = {
      onlyExecuteWhenSourceIsMainCharacter: false,
      onlyExecuteWhenSourceIsGuard: false,
      actions: [
        {
          sourcePath: 'fixture.aura.actionInAura.actionData[0]',
          metadata,
          body: {
            kind: 'leaf',
            value: {
              family: 'blackboardMutation',
              action: {
                kind: 'blackboardMutation',
                key: 'count',
                operation: 'Add',
                value: { value: 1, blackboardKey: null, levelValues: null },
                directValue: true,
                calculationTarget: { targetSource: 'Owner' },
                calculationType: 'HpRatio',
              },
            },
          },
        },
      ],
    };
    const sequence = {
      onlyExecuteWhenSourceIsMainCharacter: false,
      onlyExecuteWhenSourceIsGuard: false,
      actions: [
        {
          sourcePath: 'fixture.aura',
          metadata,
          body: {
            kind: 'leaf',
            value: {
              family: 'aura',
              action: {
                kind: 'directRangedAura',
                target: 'enemy',
                fixedWhenStart: true,
                targetGroupKey: 'tar',
                actionOnEnter,
              },
            },
          },
        },
      ],
    };
    expect(
      projectSequence(sequence as never, {
        gameplayTagRegistry: fixtureGameplayTagRegistry,
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }).steps,
    ).toEqual([
      {
        kind: 'modifyActionValue',
        parameters: {
          key: 'count',
          operation: 'add',
          value: { kind: 'constant', value: 1 },
        },
      },
    ]);
  });
});

describe('Typhoea 弓术目标选择投影', () => {
  it('在唯一木桩模型中移除只服务于目标选择的持续标记', () => {
    const sequence = {
      onlyExecuteWhenSourceIsMainCharacter: false,
      onlyExecuteWhenSourceIsGuard: false,
      actions: [
        {
          sourcePath: 'BuffData.typhoea.targetSelect',
          metadata: {
            enabled: true,
            priorityLevel: 'Default',
            priorityOffset: 0,
            serverActionIndex: 0,
          },
          body: {
            kind: 'leaf',
            value: {
              family: 'typhoeaArcherySelection',
              action: {
                kind: 'typhoeaArcheryTargetSelection',
                markBuffId: 'buff_chr_0034_typhoea_normal_skill_aimmedenemy',
                targetCount: { value: 2, blackboardKey: null, levelValues: null },
                fullScreen: false,
                lockRegionHalfHeight: { value: 0.5, blackboardKey: null, levelValues: null },
                lockRegionRatio: { value: 1.777, blackboardKey: null, levelValues: null },
                maxLockDistanceFromCamera: {
                  value: 25,
                  blackboardKey: null,
                  levelValues: null,
                },
                smartPrioritySelection: {
                  strategy: 'SelectByTag',
                  buffIds: [],
                  tagQuery: { queryType: 'hasAny', tagIds: [-1411846745] },
                  buffFindSettings: {
                    checkType: 'Id',
                    buffIds: [],
                    tagQuery: { queryType: 'hasAny', tagIds: [] },
                  },
                },
              },
            },
          },
        },
      ],
    };
    expect(
      projectSequence(sequence as never, {
        gameplayTagRegistry: fixtureGameplayTagRegistry,
        actionOwnerTarget: 'buffOwner',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
        fixedBuffOwnerTarget: 'caster',
        fixedBuffSourceTarget: 'caster',
      }).steps,
    ).toEqual([]);
  });
});

function simpleDamageFixture(): DamageActionSource {
  const common = {
    damageType: 'Physical',
    simpleCalculation: true,
    takeAttackSnapshot: false,
    damageDecorateMask: 0,
    gameplayTagIds: [],
    controlEffectRoll: true,
    onlyEnableForMainOperator: false,
    processors: [],
    ignoreDamageImmuneLevel: 'None',
    ignorePoiseImmune: false,
    reduceDamageForGuard: false,
    reduceDamageForGuardRatio: 1,
    gainCost: false,
    costs: [],
    enablePoiseBreakTimeDilation: true,
    visualImportance: 'Level1',
    visualCoalitionEnabled: false,
    visualCoalitionGroupKey: '',
    alwaysStartNewCoalition: false,
    alwaysEndCoalition: false,
    updatePositionOnCoalition: true,
  } as const;
  return {
    kind: 'damage',
    alwaysNext: true,
    attacker: 'ActionOwner',
    target: fixedTarget('Target'),
    effectSource: fixedTarget('Owner'),
    hitEnvironment: false,
    units: [
      {
        ...common,
        attributeType: 'Hp',
        attackScale: { value: 0, blackboardKey: 'atk_scale', levelValues: [2.5] },
        serializedAttackCalculationPresent: false,
        attackCalculation: null,
        serializedPoiseCalculationPresent: false,
        poiseCalculation: null,
      },
      {
        ...common,
        attributeType: 'Poise',
        attackScale: { value: 0, blackboardKey: null, levelValues: null },
        serializedAttackCalculationPresent: false,
        attackCalculation: null,
        serializedPoiseCalculationPresent: true,
        poiseCalculation: {
          kind: 'definite',
          value: { value: 0, blackboardKey: 'poise', levelValues: [10] },
          applyScale: false,
          valueScale: { value: 0, blackboardKey: null, levelValues: null },
        },
      },
    ],
  };
}

function sourceFixture(): BuffRuntimeSource {
  const metadata = {
    nativeType: 'fixture',
    nativeName: 'fixture',
    enabled: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 0,
  };
  return {
    graph: {
      buffId: 'buff_root',
      declaredBlackboard: [
        { key: 'atk_up', value: 0.05, isDynamic: false },
        { key: 'duration', value: 15, isDynamic: false },
      ],
      useTimeDilationDeltaTime: false,
      onlyUseSelfTimeDilation: false,
      timelineActions: [],
      buffEvents: [],
      igniteEvents: [],
      abilityEvents: [
        {
          event: 'OnBeforeCastSkill',
          actions: [
            {
              onlyExecuteWhenSourceIsMainCharacter: false,
              onlyExecuteWhenSourceIsGuard: false,
              actions: [
                {
                  sourcePath: 'BuffData.buff_root.condition',
                  metadata,
                  body: {
                    kind: 'leaf',
                    value: {
                      family: 'condition',
                      action: {
                        kind: 'skillType',
                        sourceType: 'CheckSkillType',
                        skillTypes: ['NormalSkill'],
                      },
                    },
                  },
                },
                {
                  sourcePath: 'BuffData.buff_root.apply',
                  metadata: { ...metadata, serverActionIndex: 1 },
                  body: {
                    kind: 'leaf',
                    value: {
                      family: 'buffApplication',
                      action: {
                        kind: 'buffApplication',
                        lifetimeOwner: 'independent',
                        buffs: [
                          {
                            buffId: 'buff_child',
                            assignBlackboard: true,
                            assignments: [
                              {
                                targetKey: 'atk_up',
                                valueType: 'Numeric',
                                numericValue: 0,
                                stringValue: '',
                                useDirectValue: false,
                                inputValueKey: 'atk_up',
                              },
                            ],
                            readIdFromBlackboard: false,
                            buffIdKey: '',
                          },
                        ],
                        count: { value: 1, blackboardKey: null, levelValues: null },
                        target: { targetSource: 'Owner' } as never,
                        buffSource: 'ActionOwner',
                        contextKey: '',
                        autoFinishByAction: false,
                        inheritSkillIds: [],
                        finishWithNextSkillIfNotInherited: true,
                        asChildBuff: false,
                        inheritSourceSkillCastId: false,
                        inheritSourceSkillCastInfo: true,
                        isExtra: false,
                        passTargetGroupsToBuff: false,
                        overrideBuffIconDuration: false,
                        buffIconDuration: {
                          durationSourceType: 'AbilityEntity',
                          timedMarkerId: '',
                        },
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    presentation: {
      hasIcon: true,
      spritePath: 'icon_battle_buff_atk_up',
      showInHeadBarCommon: false,
      showInHeadBarAttached: false,
      showInSquadIcon: true,
      onlyShowForMainCharacter: false,
      blinkInMainCharHpBar: false,
      showProgressInHpBar: false,
      showProgressInNormalSkillButton: true,
      useWeakProgressInNormalSkillButton: true,
      showProgressInUltimateSkillButton: false,
      forceRaiseIconEvent: false,
      showWarningBackground: true,
      playStrongInAnimation: false,
      hasCharHpBarVfxType: false,
      charHpBarVfxType: 'None',
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderUseDirectoryValue: false,
      orderPriorityValue: 0,
      orderPriorityEnum: 'CommonCharBuff',
    },
    lifecycle: {
      lifeType: 'Infinity',
      addingCooldown: null,
      ignoreAddingCooldown: false,
      duration: { value: 0, blackboardKey: null, levelValues: null },
      triggerInterval: { value: -1, blackboardKey: null, levelValues: null },
      waitFirstTriggerInterval: false,
      maxTriggerCount: { value: -1, blackboardKey: null, levelValues: null },
      stackingIdentifierType: 'Id',
      stackingType: 'Unique',
      stackingKey: '',
      priority: { value: 0, blackboardKey: null, levelValues: null },
      negatePriority: false,
      maxStackCount: { value: 0, blackboardKey: null, levelValues: null },
      needsStackEffect: false,
      stackEffectCount: 0,
      stackEffectActionTypes: [],
    },
    attributeModifiers: {
      isConvertedAttribute: false,
      modifiers: [
        {
          modifyAttributeType: 'Specific',
          attributeType: 'Atk',
          formulaItem: 'BaseMultiplier',
          parameter: { value: 0, blackboardKey: 'atk_up', levelValues: [0.05] },
        },
      ],
    },
    damageModifiers: [],
    healModifiers: [],
    poiseModifiers: [],
    shields: [],
    applyTagIds: [],
    extendTagIds: [],
    unsupportedPayloads: [],
  };
}
