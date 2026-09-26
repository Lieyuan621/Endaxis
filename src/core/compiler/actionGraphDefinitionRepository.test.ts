import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import { createProgramDefinitionCompiler } from './compileProgramDefinitions';
import { expect, it } from 'vitest';
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

it('同一仓库跨技能入口共享已编译节点，修订和等级隔离', () => {
  const programs = new ActionGraphDefinitionRepository();
  const actionGraph = definition();
  const resource = { main: actionGraph, macros: {} };
  const skill = (key: string): SkillDefinition => ({
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
    skill: {
      key: 'skill',
      timelineBlockFrames: 1,
      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'same' } }],
      actionGraph: localResource,
    },
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
