import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs.ts';
import type { AbilityEntityDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import { rootActionSteps } from './actionProgramInspection';
import { validateSkillDefinition } from '../game-data/validateSkillDefinition';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  CombatStepParameters,
  HealTargetBinding,
} from '../../../packages/game-data-contract/src/actions';
import type {
  ResolvedCombatStep,
  ResolvedCombatStepForKind,
  ResolvedCombatStepParameters,
} from './combatProgram';
import type {
  ActionGraphNode,
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import { createActionGraphCompilation } from './compileActionGraph';
import { ActionGraphDefinitionRepository } from './actionGraphDefinitionRepository';
import { createIndependentAbilityEntityImportResolver } from './compileCommonAbilityEntityImports';
import { perlica } from '../../data/operators/perlica.generated';
import {
  compileIndependentBuffResource,
  compileIndependentAbilityEntityResource,
  compileSkill,
} from './compileSkill';

/**
 * 把一条纯线性 ActionGraphStep 链铺成同图节点并返回入口身份。
 * 只支持顺序 next，不表达任何分支或控制子入口；调用侧必须显式声明图结构。
 */
function linearChain(
  prefix: string,
  steps: readonly ActionGraphStep[],
): { readonly nodes: Record<string, ActionGraphNode>; readonly entry: string | null } {
  const nodes: Record<string, ActionGraphNode> = {};
  steps.forEach((action, index) => {
    nodes[`${prefix}-${index}`] = {
      action,
      next: index + 1 < steps.length ? `${prefix}-${index + 1}` : null,
    };
  });
  return { nodes, entry: steps.length === 0 ? null : `${prefix}-0` };
}

/** 单段调度技能：整条 main 图只有一条线性链，其余字段原样保留。 */
function linearSkill(
  fixture: Omit<SkillDefinition, 'scheduledSequences' | 'actionGraph'> & {
    readonly startFrame?: number;
    readonly steps: readonly ActionGraphStep[];
  },
): SkillDefinition {
  const { startFrame = 0, steps, ...fields } = fixture;
  const chain = linearChain('s0', steps);
  return {
    ...fields,
    scheduledSequences: [{ startFrame, sequence: { $sequence: chain.entry } }],
    actionGraph: { main: { nodes: chain.nodes }, macros: {} },
  };
}

/** 无调度序列的技能仍需持有自己的（空）资源图。 */
function emptyGraphSkill(
  fixture: Omit<SkillDefinition, 'scheduledSequences' | 'actionGraph'>,
): SkillDefinition {
  return {
    ...fixture,
    scheduledSequences: [],
    actionGraph: { main: { nodes: {} }, macros: {} },
  };
}

it('keeps step kind, parameters and sequence fields correlated through the public member type', () => {
  type Selected = ResolvedCombatStepForKind<
    'conditional' | 'once' | 'dealDamage' | 'dealFixedDamage'
  >;
  expectTypeOf<Selected>().toEqualTypeOf<
    Extract<ResolvedCombatStep, { kind: 'conditional' | 'once' | 'dealDamage' | 'dealFixedDamage' }>
  >();
  expectTypeOf<ResolvedCombatStepForKind<'once'>>().not.toBeNever();
  const emptyBody = {
    graph: createActionGraphCompilation({ nodes: {} }, 1, 'test').compileAll(),
    entry: null,
    callSite: 'test',
  };
  const once: ResolvedCombatStepForKind<'once'> = {
    kind: 'once',
    parameters: { scopeKey: 'test' },
    body: emptyBody,
  };
  expect(rootActionSteps(once.body)).toEqual([]);
  // @ts-expect-error once requires its child sequence.
  const missingBody: ResolvedCombatStepForKind<'once'> = {
    kind: 'once',
    parameters: { scopeKey: 'test' },
  };
  void missingBody;
  // @ts-expect-error unknown kinds cannot silently resolve to never.
  type UnknownStep = ResolvedCombatStepForKind<'unknownStep'>;
  expectTypeOf<UnknownStep>();
});

function findPerlicaSkill(key: string): SkillDefinition {
  for (const group of perlica.skillGroups) {
    const skills = Array.isArray(group.skills) ? group.skills : [group.skills];
    const skill = skills.find(candidate => candidate.key === key);
    if (skill !== undefined) return skill;
  }
  throw new Error(`missing Perlica skill '${key}'`);
}

describe('compileSkill', () => {
  it('Buff 和能力实体分别编译自己的局部节点，不借用技能图', () => {
    const resource = (value: number): ActionGraphResourceDefinition => ({
      main: {
        nodes: { entry: { action: { kind: 'dealStagger', parameters: { value } }, next: null } },
      },
      macros: {},
    });
    const buff: SkillBuffDefinition = {
      stackingType: 'refresh',
      lifecycleSequences: { start: { $sequence: 'entry' } },
      actionGraph: resource(1),
    };
    const entity: AbilityEntityDefinition = {
      lifetime: { kind: 'infinite' },
      childSkill: {
        nativeSkillType: 'normalSkill' as const,
        naturalDurationFrames: 30,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
        },
        skillId: 'entity-child',
        scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'entry' } }],
        actionGraph: resource(2),
      },
    };
    const programs = new ActionGraphDefinitionRepository();
    const compiledBuff = compileIndependentBuffResource(buff, 'buff', programs);
    const compiledEntity = compileIndependentAbilityEntityResource(entity, 'entity', 1, programs);
    const buffEntry = compiledBuff.lifecycleSequences?.start;
    const entityEntry = compiledEntity.childSkill?.timelineActions[0]?.sequence;
    expect(buffEntry?.entry).not.toBeNull();
    expect(entityEntry?.entry).not.toBeNull();
    expect(buffEntry?.graph).not.toBe(entityEntry?.graph);
    expect(buffEntry?.graph.nodes.get(buffEntry.entry!)!.action).toMatchObject({
      parameters: { value: 1 },
    });
    expect(entityEntry?.graph.nodes.get(entityEntry.entry!)!.action).toMatchObject({
      parameters: { value: 2 },
    });
  });

  it('独立能力实体的子技能可以再次生成同一实体', () => {
    const entity: AbilityEntityDefinition = {
      lifetime: { kind: 'infinite' },
      childSkill: {
        nativeSkillType: 'normalSkill' as const,
        naturalDurationFrames: 30,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
        },
        skillId: 'recursive-child',
        scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'spawn' } }],
        actionGraph: {
          main: {
            nodes: {
              spawn: {
                action: {
                  kind: 'spawnAbilityEntity',
                  parameters: { abilityEntityId: 'self', dieWhenSourceDies: false },
                },
                next: null,
              },
            },
          },
          macros: {},
        },
      },
    };
    const resolve = createIndependentAbilityEntityImportResolver(
      { self: entity },
      new ActionGraphDefinitionRepository(),
    );
    const compiled = resolve(1).self!;
    const entry = compiled.childSkill!.timelineActions[0]!.sequence;
    expect(entry.graph.abilityEntityDefinitions.self).toBe(compiled);
  });

  it('两份独立能力实体可以相互引用，且相同节点名不串图', () => {
    const entity = (id: string, peer: string): AbilityEntityDefinition => ({
      lifetime: { kind: 'infinite' },
      childSkill: {
        nativeSkillType: 'normalSkill' as const,
        naturalDurationFrames: 30,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
        },
        skillId: `${id}-child`,
        scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'entry' } }],
        actionGraph: {
          main: {
            nodes: {
              entry: {
                action: {
                  kind: 'spawnAbilityEntity',
                  parameters: { abilityEntityId: peer, dieWhenSourceDies: false },
                },
                next: null,
              },
            },
          },
          macros: {},
        },
      },
    });
    const resolve = createIndependentAbilityEntityImportResolver(
      { first: entity('first', 'second'), second: entity('second', 'first') },
      new ActionGraphDefinitionRepository(),
    );
    const definitions = resolve(1);
    const firstGraph = definitions.first!.childSkill!.timelineActions[0]!.sequence.graph;
    const secondGraph = definitions.second!.childSkill!.timelineActions[0]!.sequence.graph;
    expect(firstGraph).not.toBe(secondGraph);
    expect(firstGraph.abilityEntityDefinitions.second).toBe(definitions.second);
    expect(secondGraph.abilityEntityDefinitions.first).toBe(definitions.first);
    expect(resolve(1)).toBe(definitions);
  });

  it('技能自身的主图和宏图直接编译，两个相同序列保留各自的调用点', () => {
    const chain = (prefix: string): Record<string, ActionGraphNode> => ({
      [`${prefix}-0`]: {
        action: { kind: 'dealStagger', parameters: { value: 3 } },
        next: `${prefix}-1`,
      },
      [`${prefix}-1`]: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
    });
    const skill: SkillDefinition = {
      key: 'independent',
      timelineBlockFrames: 10,
      scheduledSequences: [
        { startFrame: 1, sequence: { $sequence: 'a-0' } },
        { startFrame: 2, sequence: { $sequence: 'b-0' } },
      ],
      actionGraph: { main: { nodes: { ...chain('a'), ...chain('b') } }, macros: {} },
    };
    const program = compileSkill({
      operatorId: 'owner',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 1,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });
    const first = program.timelineActions[0]!.sequence;
    const second = program.timelineActions[1]!.sequence;
    expect(first.graph).toBe(second.graph);
    expect(first.entry).not.toBe(second.entry);
    expect(first.graph.nodes.size).toBe(4);
  });

  it('正式技能编译共享重复入口的节点，宿主入口保留各自调用位置', () => {
    const skill: SkillDefinition = {
      key: 'shared',
      timelineBlockFrames: 5,
      scheduledSequences: [
        { startFrame: 0, sequence: { $sequence: 'entry' } },
        { startFrame: 3, sequence: { $sequence: 'entry' } },
      ],
      actionGraph: {
        main: {
          nodes: {
            entry: { action: { kind: 'dealStagger', parameters: { value: 3 } }, next: null },
          },
        },
        macros: {},
      },
    };
    const program = compileSkill({
      operatorId: 'owner',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 1,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });
    const first = program.timelineActions[0]!.sequence;
    const second = program.timelineActions[1]!.sequence;
    expect(first.graph).toBe(second.graph);
    expect(first.entry).toBe(second.entry);
    expect(first.callSite).not.toBe(second.callSite);
    expect(first.graph.nodes.size).toBe(1);
    expect(first).not.toHaveProperty('steps');
  });

  it('keeps the same heal target binding before and after compilation', () => {
    type TargetBinding<T> = T extends HealTargetBinding ? Pick<T, 'target' | 'contextKey'> : never;
    expectTypeOf<TargetBinding<CombatStepParameters['heal']>>().toEqualTypeOf<HealTargetBinding>();
    expectTypeOf<
      TargetBinding<ResolvedCombatStepParameters['heal']>
    >().toEqualTypeOf<HealTargetBinding>();
    expectTypeOf<{ target: 'contextTarget' }>().not.toExtend<HealTargetBinding>();
    expectTypeOf<{ target: 'caster'; contextKey: string }>().not.toExtend<HealTargetBinding>();
    expectTypeOf<{ target: 'contextTarget'; contextKey: string }>().toExtend<HealTargetBinding>();
  });

  it('标签原数组直接穿过运行编译，不包装或再次解析路径', () => {
    const tags = Object.freeze(['Custom/Buff/Child']);
    const compiled = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 1,
      skill: linearSkill({
        key: 'tags',
        timelineBlockFrames: 1,
        steps: [
          {
            kind: 'readBuffBlackboard',
            parameters: {
              target: 'enemy',
              query: { kind: 'tag', tagQueryType: 'hasAny', buffTags: tags },
              desiredKey: 'count',
              outputKey: 'result',
            },
          },
        ],
      }),
      programs: new ActionGraphDefinitionRepository(),
    });
    const operation = rootActionSteps(compiled.timelineActions[0]!.sequence)[0]!;
    expect(operation.kind).toBe('readBuffBlackboard');
    if (operation.kind !== 'readBuffBlackboard' || operation.parameters.query.kind !== 'tag')
      throw new Error('unexpected operation');
    expect(operation.parameters.query.buffTags).toEqual(tags);
  });
  it('保留两类伤害的特征及倍率伤害的即时属性修正，不丢失运行时黑板引用', () => {
    const instantAttributeModifiers = [
      {
        targetSide: 'attacker',
        attribute: 'criticalRate',
        slot: 'baseAddition',
        value: { kind: 'blackboard', key: 'crit_delta' },
        attributeTiming: 'runtime',
      },
    ] as const;
    const compiled = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 2,
      skill: linearSkill({
        key: 'features',
        timelineBlockFrames: 1,
        steps: [
          {
            kind: 'dealDamage',
            parameters: {
              damageType: 'physical',
              attackScale: [1, 2],
              tags: [],
              features: ['shatter', 'dot'],
              instantAttributeModifiers,
            },
          },
          {
            kind: 'dealFixedDamage',
            parameters: {
              damageType: 'physical',
              value: [50, 100],
              tags: [],
              features: ['knockDown', 'physicalInfliction'],
            },
          },
        ],
      }),
      programs: new ActionGraphDefinitionRepository(),
    });
    expect(
      rootActionSteps(compiled.timelineActions[0]!.sequence).map(step => step.parameters),
    ).toEqual([
      {
        damageType: 'physical',
        attackScale: 2,
        tags: [],
        features: ['shatter', 'dot'],
        instantAttributeModifiers,
      },
      {
        damageType: 'physical',
        value: 100,
        tags: [],
        features: ['knockDown', 'physicalInfliction'],
      },
    ]);
  });
  it('compiles both inline physical-infliction Buff graphs at the skill level', () => {
    const skill = linearSkill({
      key: 'fracture',
      timelineBlockFrames: 1,
      steps: [
        {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'fracture',
            target: 'enemy',
            isExtra: false,
            noGuardBuffId: 'buff_physical_no_guard',
            noGuardDefinition: {
              stackingType: 'unlimited',
              lifecycleSequences: { start: { $sequence: 'start' } },
              actionGraph: {
                main: {
                  nodes: {
                    start: {
                      action: { kind: 'dealStagger', parameters: { value: [2, 4] } },
                      next: null,
                    },
                  },
                },
                macros: {},
              },
            },
            fractureBuffId: 'buff_physical_fracture',
            fractureDefinition: {
              stackingType: 'refresh',
              scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'entry' } }],
              actionGraph: {
                main: {
                  nodes: {
                    entry: {
                      action: { kind: 'dealStagger', parameters: { value: [1, 3] } },
                      next: null,
                    },
                  },
                },
                macros: {},
              },
            },
          },
        },
      ],
    });

    const compiled = compileSkill({
      operatorId: 'antal',
      skillGroupKey: 'comboSkill',
      skillType: 'comboSkill',
      skillLevel: 2,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });
    const step = rootActionSteps(compiled.timelineActions[0]!.sequence)[0]!;
    expect(step.kind).toBe('applyPhysicalInfliction');
    if (step.kind !== 'applyPhysicalInfliction') return;
    expect(
      rootActionSteps(step.parameters.noGuardDefinition.lifecycleSequences?.start!)[0]?.parameters,
    ).toEqual({ value: 4 });
    expect(step.parameters.type).toBe('fracture');
    if (step.parameters.type !== 'fracture') return;
    expect(
      rootActionSteps(step.parameters.fractureDefinition.scheduledSequences?.[0]?.sequence!)[0]
        ?.parameters,
    ).toEqual({ value: 3 });
  });

  it('compiles operator Buff blueprints without a skill-level context', () => {
    const buff: SkillBuffDefinition = {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      lifecycleSequences: { start: { $sequence: 'entry' } },
      actionGraph: {
        main: {
          nodes: {
            entry: {
              action: {
                kind: 'dealDamage',
                parameters: {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'scale' },
                  tags: [],
                },
              },
              next: null,
            },
          },
        },
        macros: {},
      },
    };
    const result = compileIndependentBuffResource(
      buff,
      'mark',
      new ActionGraphDefinitionRepository(),
    );
    expect(result.stackingType).toBe('refresh');
    expect(rootActionSteps(result.lifecycleSequences!.start!)).toMatchObject([
      { kind: 'dealDamage', parameters: { attackScale: { kind: 'blackboard', key: 'scale' } } },
    ]);
  });

  it('rejects skill-level arrays inside an operator Buff blueprint', () => {
    const buff: SkillBuffDefinition = {
      stackingType: 'refresh',
      lifecycleSequences: { start: { $sequence: 'entry' } },
      actionGraph: {
        main: {
          nodes: {
            entry: {
              action: {
                kind: 'dealDamage',
                parameters: {
                  damageType: 'physical',
                  attackScale: [1, 2],
                  tags: [],
                },
              },
              next: null,
            },
          },
        },
        macros: {},
      },
    };
    expect(() =>
      compileIndependentBuffResource(buff, 'invalid', new ActionGraphDefinitionRepository()),
    ).toThrow('must not depend on a skill level inside an operator Buff');
  });

  it('resolves heal multiplier and addition at the selected skill level', () => {
    const skill = linearSkill({
      key: 'heal',
      timelineBlockFrames: 1,
      steps: [
        {
          kind: 'heal',
          parameters: {
            target: 'controlledOperator',
            alwaysNext: false,
            attribute: 'will',
            multiplier: [1, 2],
            addition: [10, 20],
            tags: ['Test/TagNegative1'],
          },
        },
      ],
    });

    expect(
      rootActionSteps(
        compileSkill({
          operatorId: 'fixture',
          skillGroupKey: 'comboSkill',
          skillType: 'comboSkill',
          skillLevel: 2,
          skill,
          programs: new ActionGraphDefinitionRepository(),
        }).timelineActions[0]?.sequence!,
      )[0],
    ).toMatchObject({
      kind: 'heal',
      parameters: { alwaysNext: false, multiplier: 2, addition: 20 },
    });
  });

  it('resolves a definite heal amount at the selected skill level', () => {
    const skill = linearSkill({
      key: 'definite-heal',
      timelineBlockFrames: 1,
      steps: [
        {
          kind: 'heal',
          parameters: {
            target: 'controlledOperator',
            amount: [100, 240],
            tags: [],
          },
        },
      ],
    });

    expect(
      rootActionSteps(
        compileSkill({
          operatorId: 'fixture',
          skillGroupKey: 'comboSkill',
          skillType: 'comboSkill',
          skillLevel: 2,
          skill,
          programs: new ActionGraphDefinitionRepository(),
        }).timelineActions[0]?.sequence!,
      )[0],
    ).toMatchObject({
      kind: 'heal',
      parameters: { amount: 240 },
    });
  });

  it('compiles an embedded AbilityEntity child timeline at the parent skill level', () => {
    const skill = linearSkill({
      key: 'entity-parent',
      timelineBlockFrames: 1,
      steps: [
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'entity',
            dieWhenSourceDies: false,
            definition: {
              lifetime: { kind: 'infinite' },
              childSkill: {
                nativeSkillType: 'normalSkill' as const,
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
                },
                skillId: 'entity-child',
                blackboard: { coefficient: [1, 2] },
                scheduledSequences: [{ startFrame: 3, sequence: { $sequence: 'entry' } }],
                actionGraph: {
                  main: {
                    nodes: {
                      entry: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'physical',
                            attackScale: [4, 5],
                            tags: ['comboSkill'],
                          },
                        },
                        next: null,
                      },
                    },
                  },
                  macros: {},
                },
              },
            },
          },
        },
      ],
    });

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'combo',
      skillType: 'comboSkill',
      skillLevel: 2,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });

    const operation = rootActionSteps(program.timelineActions[0]!.sequence)[0]!;
    if (operation.kind !== 'spawnAbilityEntity') throw new Error('expected spawn');
    const child = operation.parameters.definition!.childSkill!;
    expect(child).toMatchObject({ skillId: 'entity-child', initialBlackboard: { coefficient: 2 } });
    expect(child.timelineActions[0]!.startFrame).toBe(3);
    expect(rootActionSteps(child.timelineActions[0]!.sequence)).toMatchObject([
      { parameters: { attackScale: 5 } },
    ]);
  });

  it('compiles an ID-only AbilityEntity closure at the parent skill level without recursive inlining', () => {
    const skill = linearSkill({
      key: 'entity-reference-parent',
      timelineBlockFrames: 1,
      steps: [
        {
          kind: 'spawnAbilityEntity',
          parameters: { abilityEntityId: 'entity', dieWhenSourceDies: false },
        },
      ],
    });

    const templates: Record<string, AbilityEntityDefinition> = {
      entity: {
        lifetime: { kind: 'infinite' },
        childSkill: {
          nativeSkillType: 'normalSkill' as const,
          naturalDurationFrames: 30,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
          },
          skillId: 'entity-child',
          blackboard: { coefficient: [1, 2] },
          scheduledSequences: [{ startFrame: 3, sequence: { $sequence: 'child' } }],
          actionGraph: {
            main: {
              nodes: {
                child: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'physical',
                      attackScale: [4, 5],
                      tags: ['comboSkill'],
                    },
                  },
                  next: 'child-spawn',
                },
                'child-spawn': {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: { abilityEntityId: 'entity', dieWhenSourceDies: false },
                  },
                  next: null,
                },
              },
            },
            macros: {},
          },
        },
      },
    };
    const imports = createIndependentAbilityEntityImportResolver(
      templates,
      new ActionGraphDefinitionRepository(),
    )(2);
    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'combo',
      skillType: 'comboSkill',
      skillLevel: 2,
      skill,
      programs: new ActionGraphDefinitionRepository(),
      importedAbilityEntityDefinitions: imports,
    });

    expect(rootActionSteps(program.timelineActions[0]?.sequence!)[0]).toEqual({
      kind: 'spawnAbilityEntity',
      parameters: { abilityEntityId: 'entity', dieWhenSourceDies: false },
    });
    const child = program.abilityEntityDefinitions!.entity!.childSkill!;
    expect(child.initialBlackboard).toEqual({ coefficient: 2 });
    expect(rootActionSteps(child.timelineActions[0]!.sequence)).toMatchObject([
      { kind: 'dealDamage', parameters: { attackScale: 5 } },
      {
        kind: 'spawnAbilityEntity',
        parameters: { abilityEntityId: 'entity', dieWhenSourceDies: false },
      },
    ]);
  });

  it('rejects legacy top-level handlers because they do not preserve listener lifetime', () => {
    const skill: SkillDefinition = {
      key: 'legacy-listener',
      timelineBlockFrames: 1,
      scheduledSequences: [],
      eventHandlers: [
        {
          key: 'legacy',
          event: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
          scheduledSequences: [{ startFrame: 0, sequence: { $sequence: null } }],
        },
      ],
      actionGraph: { main: { nodes: {} }, macros: {} },
    };

    expect(() =>
      compileSkill({
        operatorId: 'fixture',
        skillGroupKey: 'battleSkill',
        skillType: 'battleSkill',
        skillLevel: 1,
        skill,
        programs: new ActionGraphDefinitionRepository(),
      }),
    ).toThrow('uses legacy eventHandlers without a listener interval');
  });

  it('按技能等级解析初始动作黑板', () => {
    const skill = emptyGraphSkill({
      key: 'blackboard',
      blackboard: { fixed: 3, scaling: [10, 20] },
      timelineBlockFrames: 1,
    });

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 2,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });

    expect(program.initialBlackboard).toEqual({ fixed: 3, scaling: 20 });
  });

  it('resolves the per-hit multiplier of a breaking attack', () => {
    const skill = linearSkill({
      key: 'finisher-split',
      timelineBlockFrames: 10,
      startFrame: 3,
      steps: [
        {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            calculation: 'breakingAttack',
            attackScale: [4, 9],
            calculationMultiplier: [0.1, 0.2],
            tags: ['powerAttack'],
          },
        },
      ],
    });

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'finisher',
      skillType: 'finisher',
      skillLevel: 2,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });

    expect(rootActionSteps(program.timelineActions[0]?.sequence!)[0]).toMatchObject({
      parameters: { attackScale: 9, calculationMultiplier: 0.2 },
    });
  });

  it('resolves a standalone stagger step without creating health damage', () => {
    const skill = linearSkill({
      key: 'stagger-only',
      timelineBlockFrames: 1,
      steps: [{ kind: 'dealStagger', parameters: { value: [10, 20] } }],
    });

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 2,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });

    expect(rootActionSteps(program.timelineActions[0]?.sequence!)[0]).toEqual({
      kind: 'dealStagger',
      parameters: { value: 20 },
    });
  });

  it('resolves the level value of fixed base damage', () => {
    const skill = linearSkill({
      key: 'fixed-damage',
      timelineBlockFrames: 1,
      steps: [
        {
          kind: 'dealFixedDamage',
          parameters: {
            damageType: 'physical',
            value: [10, 20],
            tags: ['ultimateSkill'],
          },
        },
      ],
    });

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'ultimate',
      skillType: 'ultimate',
      skillLevel: 2,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });

    expect(rootActionSteps(program.timelineActions[0]?.sequence!)[0]).toEqual({
      kind: 'dealFixedDamage',
      parameters: { damageType: 'physical', value: 20, tags: ['ultimateSkill'] },
    });
  });

  it('keeps dynamic stagger operands for runtime blackboard evaluation', () => {
    const skill = linearSkill({
      key: 'dynamic-stagger',
      timelineBlockFrames: 1,
      steps: [
        {
          kind: 'dealDamage',
          parameters: {
            damageType: 'physical',
            attackScale: 1,
            tags: ['comboSkill'],
            stagger: { kind: 'blackboard', key: 'poise' },
            staggerMultiplier: { kind: 'blackboard', key: 'poise_scale' },
          },
        },
      ],
    });

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'comboSkill',
      skillType: 'comboSkill',
      skillLevel: 1,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });

    expect(rootActionSteps(program.timelineActions[0]?.sequence!)[0]).toMatchObject({
      parameters: {
        stagger: { kind: 'blackboard', key: 'poise' },
        staggerMultiplier: { kind: 'blackboard', key: 'poise_scale' },
      },
    });
  });

  it('preserves a dynamic damage multiplier for runtime resolution', () => {
    const skill = linearSkill({
      key: 'dynamic-damage',
      timelineBlockFrames: 1,
      steps: [
        {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'blackboard', key: 'attackScale' },
            tags: ['normalSkill'],
          },
        },
      ],
    });

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 1,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });

    expect(rootActionSteps(program.timelineActions[0]?.sequence!)[0]).toMatchObject({
      parameters: { attackScale: { kind: 'blackboard', key: 'attackScale' } },
    });
  });

  it('keeps the derived timeline block width in the compiled index', () => {
    const skill = emptyGraphSkill({
      key: 'timeline-block',
      timelineBlockFrames: 18,
    });

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 1,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });

    expect(program.timelineBlockFrames).toBe(18);
  });

  it('rejects cooldown values that cannot be represented as frame periods', () => {
    const skill = emptyGraphSkill({
      key: 'invalid-cooldown',
      timelineBlockFrames: 1,
      cooldownFrames: 1.5,
    });

    expect(() =>
      compileSkill({
        operatorId: 'fixture',
        skillGroupKey: 'comboSkill',
        skillType: 'comboSkill',
        skillLevel: 1,
        skill,
        programs: new ActionGraphDefinitionRepository(),
      }),
    ).toThrow("skill 'invalid-cooldown' must use positive integer cooldownFrames");
  });

  it('compiles Perlica battle skill into a single-level runtime program', () => {
    const skill = findPerlicaSkill('chr_0004_pelica_normal_skill');

    const program = compileSkill({
      operatorId: perlica.slug,
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 12,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });

    expect(program).toMatchObject({
      operatorId: 'perlica',
      skillId: 'chr_0004_pelica_normal_skill',
      timelineBlockFrames: 31,
      costFrame: 0,
      costs: [{ resource: 'sp', value: 100 }],
    });
    const impact = program.timelineActions.find(action => action.startFrame === 13);
    expect(rootActionSteps(impact?.sequence!)).toEqual([
      {
        kind: 'applyElementalInfliction',
        parameters: { element: 'electric', isExtra: false },
      },
      {
        kind: 'dealDamage',
        parameters: {
          damageType: 'electric',
          attackScale: { kind: 'blackboard', key: 'atk_scale' },
          tags: ['normalSkill'],
          features: ['canBreakWeakness'],
          stagger: { kind: 'blackboard', key: 'poise' },
        },
      },
      {
        kind: 'gainSquadUltimateEnergyFromSkillCost',
        parameters: { coefficient: 1 },
      },
    ]);
    // 编译期不预写步骤 key；运行期按调用位置与节点身份分配伤害登记 key。
    expect(rootActionSteps(impact?.sequence!)[1]?.key).toBeUndefined();
  });

  it('resolves nested level values without retaining level arrays', () => {
    const skill = findPerlicaSkill('chr_0004_pelica_combo_skill');

    const program = compileSkill({
      operatorId: perlica.slug,
      skillGroupKey: 'comboSkill',
      skillType: 'comboSkill',
      skillLevel: 12,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });

    expect(program.cooldownFrames).toBe(570);
    expect(JSON.stringify(program)).not.toContain('[0.8,');
  });

  it('preserves the SP refund category while resolving its level value', () => {
    const skill = linearSkill({
      key: 'refund',
      timelineBlockFrames: 1,
      steps: [
        {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: [10, 20],
            coefficient: [0.5, 0.25],
            recipient: 'team',
            spGainKind: 'refund',
          },
        },
      ],
    });

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'comboSkill',
      skillType: 'comboSkill',
      skillLevel: 2,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });

    expect(rootActionSteps(program.timelineActions[0]?.sequence!)[0]).toEqual({
      kind: 'changeResource',
      parameters: {
        resource: 'sp',
        amount: 20,
        coefficient: 0.25,
        recipient: 'team',
        spGainKind: 'refund',
      },
    });
  });

  it('preserves a dynamic resource coefficient for runtime evaluation', () => {
    const skill = linearSkill({
      key: 'dynamic-refund',
      timelineBlockFrames: 1,
      steps: [
        {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'refundAmount' },
            coefficient: { kind: 'blackboard', key: 'targetCount' },
            recipient: 'team',
            spGainKind: 'refund',
          },
        },
      ],
    });

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'comboSkill',
      skillType: 'comboSkill',
      skillLevel: 1,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });

    expect(rootActionSteps(program.timelineActions[0]?.sequence!)[0]).toEqual({
      kind: 'changeResourceByActionValue',
      parameters: {
        resource: 'sp',
        amount: { kind: 'blackboard', key: 'refundAmount' },
        coefficient: { kind: 'blackboard', key: 'targetCount' },
        recipient: 'team',
        spGainKind: 'refund',
      },
    });
  });

  it('compiles ultimate-energy recovery options into the runtime protocol', () => {
    const skill = linearSkill({
      key: 'taggedRecovery',
      timelineBlockFrames: 1,
      steps: [
        {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: [0.1, 0.2],
            coefficient: 0.5,
            recipient: 'caster',
            isPercentValue: true,
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
            ignoreUltimateEnergyGainMultiplier: true,
          },
        },
      ],
    });

    const program = compileSkill({
      operatorId: 'fixture',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 2,
      skill,
      programs: new ActionGraphDefinitionRepository(),
    });

    expect(rootActionSteps(program.timelineActions[0]?.sequence!)[0]).toEqual({
      kind: 'changeResource',
      parameters: {
        resource: 'ultimateEnergy',
        amount: 0.2,
        coefficient: 0.5,
        recipient: 'caster',
        isPercentValue: true,
        ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
        ignoreUltimateEnergyGainMultiplier: true,
      },
    });
  });

  it('rejects paid skills whose native cost frame has not been recovered', () => {
    const incomplete = emptyGraphSkill({
      key: 'incomplete',
      timelineBlockFrames: 30,
      costs: [{ resource: 'sp', value: 100 }],
    });

    expect(() =>
      compileSkill({
        operatorId: 'fixture',
        skillGroupKey: 'battleSkill',
        skillType: 'battleSkill',
        skillLevel: 1,
        skill: incomplete,
        programs: new ActionGraphDefinitionRepository(),
      }),
    ).toThrow("skill 'incomplete' has costs but no recovered costFrame");
  });

  it('rejects a level outside the recovered value table', () => {
    const skill = findPerlicaSkill('chr_0004_pelica_normal_skill');

    expect(() =>
      compileSkill({
        operatorId: perlica.slug,
        skillGroupKey: 'battleSkill',
        skillType: 'battleSkill',
        skillLevel: 13,
        skill,
        programs: new ActionGraphDefinitionRepository(),
      }),
    ).toThrow('has no value for skill level 13');
  });

  it('rejects multiple costs because native CastData has one cost slot', () => {
    const incomplete = emptyGraphSkill({
      key: 'multiple-costs',
      timelineBlockFrames: 30,
      costFrame: 0,
      costs: [
        { resource: 'sp', value: 100 },
        { resource: 'ultimateEnergy', value: 10 },
      ],
    });

    expect(() =>
      compileSkill({
        operatorId: 'fixture',
        skillGroupKey: 'battleSkill',
        skillType: 'battleSkill',
        skillLevel: 1,
        skill: incomplete,
        programs: new ActionGraphDefinitionRepository(),
      }),
    ).toThrow("skill 'multiple-costs' has multiple costs, but native CastData has one cost");
  });

  it('在数据边界拒绝数字标签，不依赖运行时类型转换', () => {
    const skill = linearSkill({
      key: 'invalid-tag',
      timelineBlockFrames: 1,
      steps: [
        {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'enemy',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['2147483648'],
            },
            desiredKey: 'count',
            outputKey: 'result',
          },
        },
      ],
    });

    expect(validateSkillDefinition(skill)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: 'expected readable GameplayTag path' }),
      ]),
    );
  });
});
