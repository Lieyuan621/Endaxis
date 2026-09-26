import type { AbilityEntityDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs.ts';
import { expect, it } from 'vitest';

import type { CommonDefinitionSource } from '../game-data/gameDataRepository';
import { ActionGraphDefinitionRepository } from './actionGraphDefinitionRepository';
import { compileCommonDefinitionSources } from './compileCommonDefinitionSources';

it('纯静态资源不编译空图，并拒绝没有所属图的程序入口', () => {
  const source: CommonDefinitionSource = {
    id: 'static',
    buffDefinitions: { buff: { stackingType: 'unlimited' } },
    abilityEntityDefinitions: { entity: { lifetime: { kind: 'infinite' } } },
  };
  const programs = new ActionGraphDefinitionRepository();
  // 静态资源根本不应请求图编译；也不以空图掩盖定义不完整。
  programs.compile = () => {
    throw new Error('unexpected graph compilation');
  };
  const result = compileCommonDefinitionSources([source], programs);
  expect(result.buffDefinitions.buff?.stackingType).toBe('unlimited');
  expect(result.abilityEntityDefinitions.entity?.lifetime).toEqual({ kind: 'infinite' });
  Reflect.set(source.buffDefinitions!.buff!, 'lifecycleSequences', { start: { $sequence: null } });
  expect(() => compileCommonDefinitionSources([source], programs)).toThrow(
    'executable Buff requires its own action graph',
  );
});

it('同一来源的两个公共 Buff 使用各自完整的图', () => {
  const sources: readonly CommonDefinitionSource[] = [
    {
      id: 'buffs',
      buffDefinitions: {
        first: {
          stackingType: 'unlimited',
          lifecycleSequences: { start: { $sequence: 'entry' } },
          actionGraph: {
            main: {
              nodes: {
                entry: { action: { kind: 'dealStagger', parameters: { value: 1 } }, next: null },
              },
            },
            macros: {},
          },
        } as SkillBuffDefinition,
        second: {
          stackingType: 'unlimited',
          lifecycleSequences: { start: { $sequence: 'entry' } },
          actionGraph: {
            main: {
              nodes: {
                entry: { action: { kind: 'dealStagger', parameters: { value: 2 } }, next: null },
              },
            },
            macros: {},
          },
        } as SkillBuffDefinition,
        pure: { stackingType: 'unlimited' },
      },
    },
  ];
  const compiled = compileCommonDefinitionSources(sources, new ActionGraphDefinitionRepository());
  const first = compiled.buffDefinitions.first!.lifecycleSequences!.start!;
  const second = compiled.buffDefinitions.second!.lifecycleSequences!.start!;
  expect(first.graph).not.toBe(second.graph);
  expect(first.graph.nodes.get(first.entry!)!.action).toMatchObject({ parameters: { value: 1 } });
  expect(second.graph.nodes.get(second.entry!)!.action).toMatchObject({
    parameters: { value: 2 },
  });
  expect(compiled.buffDefinitions.pure?.stackingType).toBe('unlimited');
});

it('不同资源不能共享同一份图对象', () => {
  const actionGraph = { main: { nodes: {} }, macros: {} };
  expect(() =>
    compileCommonDefinitionSources(
      [
        {
          id: 'shared',
          buffDefinitions: {
            first: { stackingType: 'unlimited', actionGraph },
          },
          abilityEntityDefinitions: {
            second: {
              lifetime: { kind: 'infinite' },
              childSkill: {
                skillId: 'child',
                nativeSkillType: 'normalSkill' as const,
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
                },
                scheduledSequences: [],
                actionGraph,
              },
            },
          },
        },
      ],
      new ActionGraphDefinitionRepository(),
    ),
  ).toThrow("common resource 'second.skills[0]' shares another resource's action graph");
});

it('独立公共 Buff 通过实体目录引用另一来源的能力实体', () => {
  const buff: SkillBuffDefinition = {
    stackingType: 'unlimited',
    lifecycleSequences: { start: { $sequence: 'spawn' } },
    actionGraph: {
      main: {
        nodes: {
          spawn: {
            action: {
              kind: 'spawnAbilityEntity',
              parameters: { abilityEntityId: 'child', dieWhenSourceDies: false },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  };
  const sources: readonly CommonDefinitionSource[] = [
    { id: 'buffs', buffDefinitions: { active: buff } },
    {
      id: 'entities',
      abilityEntityDefinitions: {
        child: {
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
            scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'entry' } }],
            actionGraph: {
              main: {
                nodes: {
                  entry: { action: { kind: 'dealStagger', parameters: { value: 2 } }, next: null },
                },
              },
              macros: {},
            },
          },
        } satisfies AbilityEntityDefinition,
      },
    },
  ];
  const compiled = compileCommonDefinitionSources(sources, new ActionGraphDefinitionRepository());
  const start = compiled.buffDefinitions.active!.lifecycleSequences!.start!;
  expect(start.graph.abilityEntityDefinitions.child).toBe(compiled.importsForLevel(0).child);
});

it('公共 Buff 和能力实体分别绑定所属图的同名节点', () => {
  const sources: readonly CommonDefinitionSource[] = [
    {
      id: 'buffs',
      buffDefinitions: {
        first: {
          stackingType: 'unlimited',
          lifecycleSequences: { start: { $sequence: 'entry' } },
          actionGraph: {
            main: {
              nodes: {
                entry: { action: { kind: 'dealStagger', parameters: { value: 1 } }, next: null },
              },
            },
            macros: {},
          },
        },
        secondBuff: {
          stackingType: 'unlimited',
          lifecycleSequences: { start: { $sequence: 'spawn' } },
          actionGraph: {
            main: {
              nodes: {
                spawn: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: { abilityEntityId: 'second', dieWhenSourceDies: false },
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
    {
      id: 'entities',
      abilityEntityDefinitions: {
        second: {
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
            scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'entry' } }],
            actionGraph: {
              main: {
                nodes: {
                  entry: { action: { kind: 'dealStagger', parameters: { value: 2 } }, next: null },
                },
              },
              macros: {},
            },
          },
        } satisfies AbilityEntityDefinition,
      },
    },
  ];
  const compiled = compileCommonDefinitionSources(sources, new ActionGraphDefinitionRepository());
  const buffEntry = compiled.buffDefinitions.first!.lifecycleSequences!.start!;
  const entityEntry = compiled.importsForLevel(0).second!.childSkill!.timelineActions[0]!.sequence;
  expect(buffEntry.graph).not.toBe(entityEntry.graph);
  expect(buffEntry.graph.nodes.get(buffEntry.entry!)!.action).toMatchObject({
    parameters: { value: 1 },
  });
  expect(entityEntry.graph.nodes.get(entityEntry.entry!)!.action).toMatchObject({
    parameters: { value: 2 },
  });
  const spawnEntry = compiled.buffDefinitions.secondBuff!.lifecycleSequences!.start!;
  expect(spawnEntry.graph.abilityEntityDefinitions.second).toBe(compiled.importsForLevel(0).second);
  expect(compiled.importsForLevel(0)).toBe(compiled.importsForLevel(0));
});

it('能力实体模板按实际可达节点导入其他来源的实体', () => {
  const sources: readonly CommonDefinitionSource[] = [
    {
      id: 'first',
      abilityEntityDefinitions: {
        first: {
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
            skillId: 'first-child',
            scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'entry' } }],
            actionGraph: {
              main: {
                nodes: {
                  entry: {
                    action: {
                      kind: 'spawnAbilityEntity',
                      parameters: { abilityEntityId: 'second', dieWhenSourceDies: false },
                    },
                    next: null,
                  },
                },
              },
              macros: {},
            },
          },
        } satisfies AbilityEntityDefinition,
      },
    },
    {
      id: 'second',
      abilityEntityDefinitions: {
        second: {
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
            skillId: 'second-child',
            scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'entry' } }],
            actionGraph: {
              main: {
                nodes: {
                  entry: { action: { kind: 'dealStagger', parameters: { value: 2 } }, next: null },
                },
              },
              macros: {},
            },
          },
        } satisfies AbilityEntityDefinition,
      },
    },
  ];
  const compiled = compileCommonDefinitionSources(sources, new ActionGraphDefinitionRepository());
  const imports = compiled.importsForLevel(0);
  const firstEntry = imports.first!.childSkill!.timelineActions[0]!.sequence;
  const secondEntry = imports.second!.childSkill!.timelineActions[0]!.sequence;
  expect(firstEntry.graph.abilityEntityDefinitions.second).toBe(imports.second);
  expect(firstEntry.graph).not.toBe(secondEntry.graph);
  expect(secondEntry.graph.nodes.get(secondEntry.entry!)!.action).toMatchObject({
    parameters: { value: 2 },
  });
});

it('跨来源能力实体循环引用仍保留各自图和对象身份', () => {
  const source = (id: string, next: string): CommonDefinitionSource => {
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
        skillId: `${id}-child`,
        scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'entry' } }],
        actionGraph: {
          main: {
            nodes: {
              entry: {
                action: {
                  kind: 'spawnAbilityEntity',
                  parameters: { abilityEntityId: next, dieWhenSourceDies: false },
                },
                next: null,
              },
            },
          },
          macros: {},
        },
      },
    };
    return { id, abilityEntityDefinitions: { [id]: entity } };
  };
  const compiled = compileCommonDefinitionSources(
    [source('first', 'second'), source('second', 'first')],
    new ActionGraphDefinitionRepository(),
  );
  const first = compiled.importsForLevel(0).first!.childSkill!.timelineActions[0]!.sequence;
  const second = compiled.importsForLevel(0).second!.childSkill!.timelineActions[0]!.sequence;
  expect(first.graph).not.toBe(second.graph);
  expect(first.graph.abilityEntityDefinitions.second).toBe(compiled.importsForLevel(0).second);
  expect(second.graph.abilityEntityDefinitions.first).toBe(compiled.importsForLevel(0).first);
});

it('无来源总图时，独立实体跨来源互相引用并保持局部节点身份', () => {
  const source = (id: string, next: string): CommonDefinitionSource => {
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
        skillId: `${id}-child`,
        scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'entry' } }],
        actionGraph: {
          main: {
            nodes: {
              entry: {
                action: {
                  kind: 'spawnAbilityEntity',
                  parameters: { abilityEntityId: next, dieWhenSourceDies: false },
                },
                next: null,
              },
            },
          },
          macros: {},
        },
      },
    };
    return { id, abilityEntityDefinitions: { [id]: entity } };
  };
  const compiled = compileCommonDefinitionSources(
    [source('first', 'second'), source('second', 'first')],
    new ActionGraphDefinitionRepository(),
  );
  const first = compiled.importsForLevel(0).first!.childSkill!.timelineActions[0]!.sequence;
  const second = compiled.importsForLevel(0).second!.childSkill!.timelineActions[0]!.sequence;
  expect(first.graph).not.toBe(second.graph);
  expect(first.graph.abilityEntityDefinitions.second).toBe(compiled.importsForLevel(0).second);
  expect(second.graph.abilityEntityDefinitions.first).toBe(compiled.importsForLevel(0).first);
});
