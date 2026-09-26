import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import { createProgramDefinitionCompiler } from './compileProgramDefinitions';
import type { CompiledGraphEntry } from './combatProgram';
import { describe, expect, it } from 'vitest';
import type {
  ActionGraphDefinition,
  ActionGraphReference,
  ActionGraphResourceDefinition,
} from '../../../packages/game-data-contract/src/actionGraph';
import type { AbilityEntityDefinition } from '../game-data/operatorDefinition';
import { ActionGraphDefinitionRepository } from './actionGraphDefinitionRepository';
import { compileSkill, compileIndependentAbilityEntityResource } from './compileSkill';
import { createActionGraphCompilation, type CompiledActionGraph } from './compileActionGraph';

function expectEntry(
  entry: CompiledGraphEntry | undefined,
  graph: CompiledActionGraph,
  id: string,
) {
  expect(entry?.graph).toBe(graph);
  expect(entry?.entry).toBe(id);
}

const hit: ActionGraphReference = { $sequence: 'hit' };
const graph: ActionGraphDefinition = {
  nodes: {
    hit: {
      action: {
        kind: 'dealDamage',
        parameters: { damageType: 'physical', attackScale: [1, 2], tags: [] },
      },
      next: null,
    },
    buff: {
      action: {
        kind: 'applyBuff',
        parameters: {
          buffId: 'shared',
          target: 'caster',
          blackboardAssignments: {
            constant: [10, 20],
            dynamic: { kind: 'blackboard', key: 'power' },
          },
        },
      },
      next: null,
    },
    spawn: {
      action: {
        kind: 'spawnAbilityEntity',
        parameters: { abilityEntityId: 'entity', dieWhenSourceDies: false },
      },
      next: null,
    },
  },
};

describe('嵌套宿主直接图编译', () => {
  it.each(['hit', '$sequence', 'kind'])(
    '提取宏节点 %s 的身份限定各自命名空间，不把节点名误认成字段',
    nodeId => {
      const resource: ActionGraphResourceDefinition = {
        main: {
          nodes: {
            call: {
              action: {
                kind: 'callMacro',
                macroId: 'main',
                nodeBindings: { [nodeId]: 'removed-original' },
              },
              next: null,
            },
          },
        },
        macros: {
          main: { entry: { $sequence: nodeId }, graph: { nodes: { [nodeId]: graph.nodes.hit! } } },
        },
      };
      const compilation = createActionGraphCompilation(resource, 1);
      const entry = compilation.compileEntry({ $sequence: 'call' }, 'skill');
      expect(entry.graph.nodes.get(entry.entry!)!.action).toMatchObject({
        nodeBindings: {
          [JSON.stringify(['main', nodeId])]: JSON.stringify([null, 'removed-original']),
        },
      });
    },
  );

  it.each([
    [{}, 'missing macro node'],
    [{ first: 'original', second: 'original' }, 'duplicate identity'],
    [{ first: '', second: 'original' }, 'non-empty identity'],
    [{ first: 'a', second: 'b', extra: 'c' }, 'unknown macro node'],
  ] as const)('拒绝不完整或混淆执行身份的宏节点绑定 %j', (nodeBindings, error) => {
    const resource: ActionGraphResourceDefinition = {
      main: {
        nodes: {
          call: { action: { kind: 'callMacro', macroId: 'middle', nodeBindings }, next: null },
        },
      },
      macros: {
        middle: {
          entry: { $sequence: 'first' },
          graph: {
            nodes: {
              first: { ...graph.nodes.hit!, next: 'second' },
              second: graph.nodes.hit!,
            },
          },
        },
      },
    };
    expect(() => createActionGraphCompilation(resource, 1)).toThrow(error);
  });

  it('名为 main 的宏与主图同名节点保持独立', () => {
    const resource: ActionGraphResourceDefinition = {
      main: {
        nodes: { entry: { action: { kind: 'callMacro', macroId: 'main' }, next: null } },
      },
      macros: {
        main: {
          entry: { $sequence: 'entry' },
          graph: {
            nodes: {
              entry: {
                action: {
                  kind: 'dealDamage',
                  parameters: { damageType: 'physical', attackScale: 2, tags: [] },
                },
                next: null,
              },
            },
          },
        },
      },
    };
    const compilation = createActionGraphCompilation(resource, 1);
    const entry = compilation.compileEntry({ $sequence: 'entry' }, 'skill');
    compilation.finish();
    const call = compilation.program.nodes.get(entry.entry!)!.action;
    expect(call.kind).toBe('callMacro');
    if (call.kind !== 'callMacro') throw new Error('main graph entry was overwritten');
    expect(call.entry).not.toBe(entry.entry);
    expect(compilation.program.nodes.get(call.entry!)?.action.kind).toBe('dealDamage');
    expect(compilation.program.nodes.size).toBe(2);
  });

  it('独立宏图的缺失引用和递归调用会阻止编译', () => {
    const resource: ActionGraphResourceDefinition = {
      main: {
        nodes: { entry: { action: { kind: 'callMacro', macroId: 'first' }, next: null } },
      },
      macros: {
        first: {
          entry: { $sequence: 'entry' },
          graph: {
            nodes: { entry: { action: { kind: 'callMacro', macroId: 'second' }, next: null } },
          },
        },
      },
    };
    expect(() => createActionGraphCompilation(resource, 1)).toThrow(
      'missing action graph macro: second',
    );
    const recursive = {
      ...resource,
      macros: {
        ...resource.macros,
        second: {
          entry: { $sequence: 'entry' },
          graph: {
            nodes: { entry: { action: { kind: 'callMacro', macroId: 'first' }, next: null } },
          },
        },
      },
    } satisfies ActionGraphResourceDefinition;
    expect(() => createActionGraphCompilation(recursive, 1)).toThrow(
      'recursive action graph macro',
    );
  });
  it('正式技能编译共用等级费用和调度规则，拒绝缺失费用帧', () => {
    const skill: SkillDefinition = {
      key: 'skill',
      timelineBlockFrames: 10,
      naturalDurationFrames: 30,
      costFrame: 3,
      costs: [{ resource: 'sp', value: [50, 100] }],
      blackboard: { power: [1, 2] },
      scheduledSequences: [
        { startFrame: 4, endFrame: 8, sequence: hit },
        { startFrame: 0, sequence: { $sequence: 'spawn' } },
      ],
      actionGraph: { main: graph, macros: {} },
    };
    const program = compileSkill({
      operatorId: 'operator',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 2,
      skill,
      abilityEntityDefinitions: { entity: { lifetime: { kind: 'infinite' } } },
      programs: new ActionGraphDefinitionRepository(),
    });
    expect(program.costs).toEqual([{ resource: 'sp', value: 100 }]);
    expect(program.initialBlackboard).toEqual({ power: 2 });
    const firstAction = program.timelineActions[0]!;
    expect(firstAction.sequence.entry).not.toBeNull();
    expect(firstAction.sequence.graph.nodes.get(firstAction.sequence.entry!)?.action.kind).toBe(
      'dealDamage',
    );
    expect(firstAction).toMatchObject({ startFrame: 4, endFrame: 8 });
    expect(program.abilityEntityDefinitions?.entity).toBeDefined();
    expect(() =>
      compileSkill({
        operatorId: 'operator',
        skillGroupKey: 'battleSkill',
        skillType: 'battleSkill',
        skillLevel: 2,
        skill: { ...skill, key: 'incomplete', costFrame: undefined, scheduledSequences: [] },
        programs: new ActionGraphDefinitionRepository(),
      }),
    ).toThrow('costFrame');
  });
  it('Buff 的所有生命周期持有共享入口，等级赋值与动态读取保持区别', () => {
    const result = createActionGraphCompilation(graph, 2, 'r', {
      entity: { lifetime: { kind: 'infinite' } },
    }).compileAll();
    const action = result.nodes.get('buff')!.action;
    if (action.kind !== 'applyBuff') throw new Error('fixture');
    const compilation = createActionGraphCompilation({ nodes: { hit: graph.nodes.hit! } }, 2);
    const buffResource = { main: { nodes: { hit: graph.nodes.hit! } }, macros: {} };
    const buff = createProgramDefinitionCompiler(
      2,
      compilation.compileEntry,
      // 本夹具的 Buff 图就是上面已编译的同一批节点；保持编译身份一致。
      (resource, path) => {
        if (resource !== buffResource) throw new Error(`unexpected Buff resource at ${path}`);
        return compilation.compileEntry;
      },
    ).buff(
      {
        stackingType: 'refresh',
        actionGraph: buffResource,
        lifecycleSequences: { start: hit, finish: hit },
        scheduledSequences: [{ startFrame: 3, endFrame: 10, sequence: hit }],
        abilityEventResponses: [{ event: 'addedBuff', priority: 3, sequence: hit }],
        igniteEventResponses: [{ igniteType: 'test', finishAfterIgnited: true, sequence: hit }],
      },
      'buff.shared',
    );
    const buffGraph = compilation.program;
    expectEntry(buff.lifecycleSequences?.start, buffGraph, 'hit');
    expectEntry(buff.lifecycleSequences?.finish, buffGraph, 'hit');
    expect(buff.scheduledSequences?.[0]).toMatchObject({ startFrame: 3, endFrame: 10 });
    expectEntry(buff.scheduledSequences?.[0]?.sequence, buffGraph, 'hit');
    expectEntry(buff.abilityEventResponses?.[0]?.sequence, buffGraph, 'hit');
    expectEntry(buff.igniteEventResponses?.[0]?.sequence, buffGraph, 'hit');
    expect(action.parameters.blackboardAssignments).toEqual({
      constant: { kind: 'constant', value: 20 },
      dynamic: { kind: 'blackboard', key: 'power' },
    });
    expect(result.nodes.size).toBe(3);
    expect(result.nodes.get('hit')!.action).toMatchObject({ parameters: { attackScale: 2 } });
  });

  it('实体模板可再次生成自己，子技能和被动各自持有图', () => {
    const spawnGraph: ActionGraphResourceDefinition = {
      main: {
        nodes: {
          spawn: {
            action: {
              kind: 'spawnAbilityEntity',
              parameters: { abilityEntityId: 'entity', dieWhenSourceDies: false },
            },
            next: null,
          },
        },
      },
      macros: {},
    };
    const hitGraph = (): ActionGraphResourceDefinition => ({
      main: { nodes: { hit: { action: graph.nodes.hit!.action, next: null } } },
      macros: {},
    });
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
        skillId: 'child',
        blackboard: { scale: [1, 3] },
        scheduledSequences: [{ startFrame: 1, sequence: { $sequence: 'spawn' } }],
        actionGraph: spawnGraph,
      },
      childSkills: {
        hit: {
          nativeSkillType: 'normalSkill' as const,
          naturalDurationFrames: 30,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
          },
          skillId: 'hit',
          scheduledSequences: [{ startFrame: 0, sequence: hit }],
          actionGraph: hitGraph(),
        },
      },
      passiveSkills: [{ key: 'passive', enableSequence: hit, actionGraph: hitGraph() }],
    };
    // 递归与交叉引用经生产登记的导入解析器绑定；直接对内嵌目录编译不是递归入口。
    const programs = new ActionGraphDefinitionRepository();
    const compiled = compileIndependentAbilityEntityResource(entity, 'entity', 2, programs);
    expect(compiled.childSkill?.initialBlackboard).toEqual({ scale: 3 });
    const childEntry = compiled.childSkill?.timelineActions[0]?.sequence;
    // 子资源图内仍解析到自己的 spawn 节点，递归实体引用沿登记的占位身份保留。
    expect(childEntry?.graph.nodes.get(childEntry.entry!)?.action.kind).toBe('spawnAbilityEntity');
    expect(childEntry?.graph.abilityEntityDefinitions.entity).toBe(compiled);
    const hitEntry = compiled.childSkills?.hit?.timelineActions[0]?.sequence;
    expect(hitEntry?.graph.nodes.get(hitEntry.entry!)?.action.kind).toBe('dealDamage');
    const passiveEntry = compiled.passiveSkills?.[0]?.enableSequence;
    expect(passiveEntry?.graph.nodes.get(passiveEntry.entry!)?.action.kind).toBe('dealDamage');
  });

  it('外部实体定义中的悬空入口也必须报告，不能变成空程序', () => {
    expect(() =>
      createActionGraphCompilation(graph, 1, 'r', {
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
            skillId: 'bad',
            scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'missing' } }],
            actionGraph: { main: { nodes: {} }, macros: {} },
          },
        },
      }).compileAll(),
    ).toThrow('missing action graph node');
  });
});

it('按入口编译共享节点，不让无关技能的等级数组影响 Buff 程序', () => {
  const source: ActionGraphDefinition = {
    nodes: {
      buff: {
        action: {
          kind: 'dealStagger',
          parameters: { value: { kind: 'blackboard', key: 'poise' } },
        },
        next: null,
      },
      skill: { action: { kind: 'dealStagger', parameters: { value: [1, 2] } }, next: 'buff' },
      other: { action: { kind: 'dealStagger', parameters: { value: 3 } }, next: 'buff' },
    },
  };
  const compilation = createActionGraphCompilation(source, 0);
  const first = compilation.compileEntry({ $sequence: 'buff' }, 'buff.start');
  expect([...first.graph.nodes.keys()]).toEqual(['buff']);
  const node = first.graph.nodes.get('buff');
  const second = compilation.compileEntry({ $sequence: 'other' }, 'buff.finish');
  expect(second.graph).toBe(first.graph);
  expect(second.graph.nodes.get('buff')).toBe(node);
  expect([...second.graph.nodes.keys()]).toEqual(['buff', 'other']);
  expect(first.callSite).not.toBe(second.callSite);
  expect(() => compilation.compileEntry({ $sequence: 'skill' }, 'skill')).toThrow('skill level');
});

it('入口编译收集未选分支和事件响应，但不触及整张目录的其他入口', () => {
  const source: ActionGraphDefinition = {
    nodes: {
      branch: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'constant', value: true } },
          whenTrue: { $sequence: 'listener' },
          whenFalse: { $sequence: 'reset' },
        },
        next: null,
      },
      listener: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'event',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                sequence: { $sequence: 'response' },
              },
            ],
          },
        },
        next: null,
      },
      reset: { action: { kind: 'dealStagger', parameters: { value: 1 } }, next: null },
      response: { action: { kind: 'dealStagger', parameters: { value: 2 } }, next: null },
      unrelated: { action: { kind: 'dealStagger', parameters: { value: [1] } }, next: null },
    },
  };
  const compilation = createActionGraphCompilation(source, 0);
  compilation.compileEntry({ $sequence: 'branch' }, 'buff.start');
  expect([...compilation.program.nodes.keys()].sort()).toEqual([
    'branch',
    'listener',
    'reset',
    'response',
  ]);
});

it('独立资源的嵌套入口只绑定一次所属图身份', () => {
  const resource = {
    main: {
      nodes: {
        root: { action: { kind: 'callMacro' as const, macroId: 'shared' }, next: null },
      },
    },
    macros: {
      shared: {
        entry: { $sequence: 'branch' },
        graph: {
          nodes: {
            branch: {
              action: {
                kind: 'conditional' as const,
                parameters: { condition: { kind: 'constant' as const, value: true } },
                whenTrue: { $sequence: 'hit' },
                whenFalse: { $sequence: null },
              },
              next: null,
            },
            hit: { action: { kind: 'dealStagger' as const, parameters: { value: 1 } }, next: null },
          },
        },
      },
    },
  };
  const compilation = createActionGraphCompilation(resource, 1);
  compilation.compileEntry({ $sequence: 'root' }, 'skill');
  const macroBranch = compilation.program.nodes.get(JSON.stringify(['shared', 'branch']));
  expect(macroBranch?.action.kind).toBe('conditional');
  if (macroBranch?.action.kind !== 'conditional') throw new Error('missing branch');
  expect(macroBranch.action.whenTrue.$sequence).toBe(JSON.stringify(['shared', 'hit']));
  expect(compilation.program.nodes.has(JSON.stringify(['shared', 'hit']))).toBe(true);
});
