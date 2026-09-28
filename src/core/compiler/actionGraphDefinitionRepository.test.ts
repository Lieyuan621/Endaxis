import { skillFixture } from '../../test/skillFixture';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import { createProgramDefinitionCompiler } from './compileProgramDefinitions';
import { expect, it, vi } from 'vitest';
import * as graphCompiler from './compileActionGraph';
import { createIndependentAbilityEntityImportResolver } from './compileCommonAbilityEntityImports';
import { ActionGraphDefinitionRepository } from './actionGraphDefinitionRepository';
import { compileSkill } from './compileSkill';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';

const definition = (): ActionGraphDefinition => ({
  nodes: {
    first: { action: { kind: 'dealStagger', parameters: { value: [1, 2] } }, next: 'shared' },
    second: { action: { kind: 'dealStagger', parameters: { value: 3 } }, next: 'shared' },
    shared: { action: { kind: 'dealStagger', parameters: { value: 4 } }, next: null },
  },
});

it('跨场景重建解析器仍复用实体定义表，修订、等级、外部依赖与仓库分别隔离', () => {
  const programs = new ActionGraphDefinitionRepository();
  const definitions = { entity: { lifetime: { kind: 'limited' as const, durationSeconds: 2 } } };
  const resolve = () => createIndependentAbilityEntityImportResolver(definitions, programs);
  const first = resolve()(1);
  expect(resolve()(1)).toBe(first);
  expect(resolve()(2)).not.toBe(first);
  const changed = { entity: { lifetime: { kind: 'limited' as const, durationSeconds: 3 } } };
  const second = programs.compileAbilityEntities(changed, 1);
  expect(second).not.toBe(first);
  expect(second.entity!.lifetime).toEqual({ kind: 'limited', durationSeconds: 3 });
  expect(() => Object.assign(definitions.entity.lifetime, { durationSeconds: 4 })).toThrow();
  expect(new ActionGraphDefinitionRepository().compileAbilityEntities(definitions, 1)).not.toBe(
    first,
  );
  const external = programs.compileAbilityEntities(
    { other: { lifetime: { kind: 'infinite' } } },
    1,
  );
  const withExternal = createIndependentAbilityEntityImportResolver(
    definitions,
    programs,
    () => external,
  );
  expect(withExternal(1)).not.toBe(first);
  expect(withExternal(1)).toBe(withExternal(1));
  expect(() => programs.compileAbilityEntities(definitions, 1, first)).toThrow(
    'duplicate imported',
  );
  expect(programs.mergeAbilityEntityImports(external, first)).toBe(
    programs.mergeAbilityEntityImports(external, resolve()(1)),
  );
  expect(programs.mergeAbilityEntityImports(external, second)).not.toBe(
    programs.mergeAbilityEntityImports(external, first),
  );
  expect(createIndependentAbilityEntityImportResolver(undefined, programs)(0)).toBe(
    createIndependentAbilityEntityImportResolver(undefined, programs)(0),
  );
});

it('公共资源集合跨模拟复用，新的集合重新校验', () => {
  const programs = new ActionGraphDefinitionRepository();
  const sources = [
    {
      id: 'common',
      abilityEntityDefinitions: { entity: { lifetime: { kind: 'infinite' as const } } },
    },
  ];
  const first = programs.compileCommonDefinitions(sources);
  expect(programs.compileCommonDefinitions(sources)).toBe(first);
  expect(programs.compileCommonDefinitions([...sources])).not.toBe(first);
  expect(() => programs.compileCommonDefinitions([...sources, ...sources])).toThrow(
    'duplicate common',
  );
});

it('已发布图只准备一次，不同等级与导入目录仍分别编译，新定义重新校验', () => {
  const prepare = vi.spyOn(graphCompiler, 'prepareActionGraphDefinition');
  try {
    const programs = new ActionGraphDefinitionRepository();
    const resource = { main: definition(), macros: {} };
    const first = programs.compile(resource, 1, undefined, {}).compileAll();
    const second = programs.compile(resource, 2, undefined, {}).compileAll();
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(first).not.toBe(second);
    expect(first.nodes.get('[null,"first"]')!.action).toMatchObject({ parameters: { value: 1 } });
    expect(second.nodes.get('[null,"first"]')!.action).toMatchObject({ parameters: { value: 2 } });
    const edited = structuredClone(resource);
    Object.assign(edited.main.nodes.first!, { next: 'missing' });
    expect(() => programs.compile(edited, 1)).toThrow('missing action graph node');
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(() => {
      Object.assign(resource.main.nodes.first!, { next: null });
    }).toThrow();
  } finally {
    prepare.mockRestore();
  }
});

it('同一仓库跨技能入口共享已编译节点，修订和等级隔离', () => {
  const programs = new ActionGraphDefinitionRepository();
  const actionGraph = definition();
  const resource = { main: actionGraph, macros: {} };
  const skill = (key: string): SkillDefinition =>
    skillFixture({
      key,
      timelineBlockFrames: 1,
      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: key } }],
      actionGraph: resource,
    });
  const compile = (key: string) =>
    compileSkill({
      operatorId: 'operator',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 1,
      skill: skill(key),
      programs,
    });
  const first = compile('first').timelineActions[0]!.sequence;
  const shared = first.graph.nodes.get('shared');
  const second = compile('second').timelineActions[0]!.sequence;
  expect(second.graph).toBe(first.graph);
  expect(second.graph.nodes.get('shared')).toBe(shared);
  expect(second.graph.nodes.size).toBe(3);
  expect(programs.compile(actionGraph, 2).program).not.toBe(first.graph);
  expect(programs.compile(definition(), 1).program.revision).not.toBe(first.graph.revision);
  const firstAction = actionGraph.nodes.first!.action;
  if (firstAction.kind !== 'dealStagger') throw new Error('fixture requires a dealStagger node');
  expect(Object.isFrozen(firstAction.parameters)).toBe(true);
});

it('实体模板改变和不同仓库都不能借用旧编译目录', () => {
  const programs = new ActionGraphDefinitionRepository();
  const graph = definition();
  const firstTemplates = { entity: { lifetime: { kind: 'infinite' as const } } };
  const secondTemplates = {
    entity: { lifetime: { kind: 'limited' as const, durationSeconds: 2 } },
  };
  const first = programs.compile(graph, 1, firstTemplates);
  expect(programs.compile(graph, 1, firstTemplates)).toBe(first);
  expect(programs.compile(graph, 1, secondTemplates)).not.toBe(first);
  expect(new ActionGraphDefinitionRepository().compile(graph, 1, firstTemplates)).not.toBe(first);
  expect(Object.isFrozen(firstTemplates.entity.lifetime)).toBe(true);
});

it('imported entity entries retain their owning graph when local node IDs collide', () => {
  const programs = new ActionGraphDefinitionRepository();
  const common: ActionGraphDefinition = {
    nodes: {
      same: { action: { kind: 'dealStagger', parameters: { value: 7 } }, next: null },
    },
  };
  const owner = programs.compile(common, 1);
  const childGraph = { main: common, macros: {} };
  const entity = createProgramDefinitionCompiler(
    1,
    owner.compileEntry,
    // 子技能图就是本测试中 owner 已编译的同一批节点；保持编译身份一致。
    (graph, path) => {
      if (graph !== childGraph) throw new Error(`unexpected child resource at ${path}`);
      return owner.compileEntry;
    },
  ).entity(
    {
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
        scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'same' } }],
        actionGraph: childGraph,
      },
    },
    'common.entity',
  );
  const imports = { entity };
  const local: ActionGraphDefinition = {
    nodes: {
      same: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: { abilityEntityId: 'entity', dieWhenSourceDies: false },
        },
        next: null,
      },
    },
  };
  const localResource = { main: local, macros: {} };
  const compiled = programs.compile(localResource, 1, undefined, imports);
  compiled.compileEntry({ $sequence: 'same' }, 'skill');
  expect(compiled.program.abilityEntityDefinitions.entity).toBe(entity);
  const child = entity.childSkill!.timelineActions[0]!.sequence;
  expect(child.graph).toBe(owner.program);
  expect(child.graph).not.toBe(compiled.program);
  expect(child.graph.nodes.get('same')!.action).toMatchObject({
    kind: 'dealStagger',
    parameters: { value: 7 },
  });
  expect(compiled.program.nodes.get('[null,"same"]')!.action.kind).toBe('spawnAbilityEntity');
  const skill = compileSkill({
    operatorId: 'operator',
    skillGroupKey: 'battleSkill',
    skillType: 'battleSkill',
    skillLevel: 1,
    skill: skillFixture({
      key: 'skill',
      timelineBlockFrames: 1,
      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'same' } }],
      actionGraph: localResource,
    }),
    programs,
    importedAbilityEntityDefinitions: imports,
  });
  expect(skill.abilityEntityDefinitions!.entity).toBe(entity);
  expect(skill.timelineActions[0]!.sequence.graph).toBe(compiled.program);

  expect(programs.compile(localResource, 1, undefined, imports)).toBe(compiled);
  expect(programs.compile(localResource, 1, undefined, { entity })).not.toBe(compiled);
  expect(() =>
    programs
      .compile(localResource, 1, { entity: { lifetime: { kind: 'infinite' } } }, imports)
      .compileEntry({ $sequence: 'same' }, 'skill'),
  ).toThrow('duplicate imported');
});
