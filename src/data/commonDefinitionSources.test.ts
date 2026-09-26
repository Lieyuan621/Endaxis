import type { AbilityEntityDefinition } from '../../packages/game-data-contract/src/skills.ts';
import type { SkillBuffDefinition } from '../../packages/game-data-contract/src/buffs.ts';
import { expect, it } from 'vitest';
import type { ActionGraphDefinition } from '../../packages/game-data-contract/src/actionGraph';
import type { OperatorDefinition } from '../core/game-data/operatorDefinition';
import { createGameDataRepository } from './createGameDataRepository';

const firstGraph: ActionGraphDefinition = {
  nodes: { entry: { action: { kind: 'dealStagger', parameters: { value: 1 } }, next: null } },
};
const secondGraph: ActionGraphDefinition = {
  nodes: { entry: { action: { kind: 'dealStagger', parameters: { value: 2 } }, next: null } },
};

it('公共来源只登记独立 Buff，各 Buff 校验自己的图', () => {
  const buff: SkillBuffDefinition = {
    stackingType: 'unlimited',
    lifecycleSequences: { start: { $sequence: 'entry' } },
    actionGraph: { main: firstGraph, macros: {} },
  };
  const repository = createGameDataRepository({
    revision: 'independent-buff',
    commonDefinitionSources: [{ id: 'buffs', buffDefinitions: { first: buff } }],
  });
  expect(repository.getCommonBuffDefinitions!().first).toBe(buff);
  expect(repository.getCommonBuffSource!('first')?.id).toBe('buffs');
  expect(() =>
    createGameDataRepository({
      revision: 'invalid-independent-buff',
      commonDefinitionSources: [
        {
          id: 'buffs',
          buffDefinitions: {
            first: { ...buff, lifecycleSequences: { start: { $sequence: 'missing' } } },
          },
        },
      ],
    }),
  ).toThrow('missing');
});

it('公共来源只登记独立能力实体，并校验实体自己的图入口', () => {
  const entity: AbilityEntityDefinition = {
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
      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'entry' } }],
      actionGraph: { main: firstGraph, macros: {} },
    },
  };
  const repository = createGameDataRepository({
    revision: 'independent-entity',
    commonDefinitionSources: [{ id: 'entities', abilityEntityDefinitions: { child: entity } }],
  });
  expect(repository.getCommonAbilityEntitySource!('child')?.id).toBe('entities');
  expect(repository.getCommonAbilityEntityDefinitions!().child).toBe(entity);
  expect(() =>
    createGameDataRepository({
      revision: 'invalid-independent-entity',
      commonDefinitionSources: [
        {
          id: 'entities',
          abilityEntityDefinitions: {
            child: {
              ...entity,
              childSkill: {
                ...entity.childSkill!,
                scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'missing' } }],
              },
            },
          },
        },
      ],
    }),
  ).toThrow('missing');
});

it('同一公共来源的静态与独立 Buff 图分别登记，不混用节点', () => {
  const repository = createGameDataRepository({
    revision: 'mixed-common-source',
    commonDefinitionSources: [
      {
        id: 'mixed',
        buffDefinitions: {
          legacy: {
            stackingType: 'unlimited',
          },
          independent: {
            stackingType: 'unlimited',
            lifecycleSequences: { start: { $sequence: 'own' } },
            actionGraph: {
              main: {
                nodes: {
                  own: { action: { kind: 'dealStagger', parameters: { value: 1 } }, next: null },
                },
              },
              macros: {},
            },
          },
        },
      },
    ],
  });
  expect(Object.keys(repository.getCommonBuffDefinitions!())).toEqual(['legacy', 'independent']);
});

it('保留公共定义所属的来源身份，允许不同来源使用相同的局部节点 ID', () => {
  const repository = createGameDataRepository({
    revision: 'graph-sources',
    commonDefinitionSources: [
      {
        id: 'buffs',
        buffDefinitions: {
          first: {
            stackingType: 'unlimited',
            lifecycleSequences: { start: { $sequence: 'entry' } },
            actionGraph: { main: firstGraph, macros: {} },
          },
        },
      },
      {
        id: 'consumables',
        abilityEntityDefinitions: {
          second: {
            lifetime: { kind: 'infinite' },
            childSkill: {
              skillId: 'second-skill',
              nativeSkillType: 'normalSkill' as const,
              naturalDurationFrames: 30,
              castResource: {
                costFrame: 0,
                cooldownSeconds: 0,
                maxChargeTime: 1,
                cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
              },
              scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'entry' } }],
              actionGraph: { main: secondGraph, macros: {} },
            },
          },
        },
      },
    ],
  });
  const sources = repository.getCommonDefinitionSources!();
  expect(sources.map(source => source.id)).toEqual(['buffs', 'consumables']);
  expect(sources[0]!.buffDefinitions!.first).toBe(repository.getCommonBuffDefinitions!().first);
  expect(repository.getCommonBuffSource!('first')).toBe(sources[0]);
  expect(sources[1]!.abilityEntityDefinitions!.second).toBe(
    repository.getCommonAbilityEntityDefinitions!().second,
  );
  expect(repository.getCommonAbilityEntitySource!('second')).toBe(sources[1]);
  expect(repository.getCommonBuffSource!('missing')).toBeNull();
});

it('拒绝跨来源重名，而非按合并顺序静默覆盖', () => {
  expect(() =>
    createGameDataRepository({
      revision: 'duplicates',
      commonDefinitionSources: [
        { id: 'buffs', buffDefinitions: { same: { stackingType: 'unlimited' } } },
        { id: 'consumables', buffDefinitions: { same: { stackingType: 'unlimited' } } },
      ],
    }),
  ).toThrow("common Buff 'same' belongs to both 'buffs' and 'consumables'");
  expect(() =>
    createGameDataRepository({
      revision: 'duplicate-entities',
      commonDefinitionSources: [
        { id: 'buffs', abilityEntityDefinitions: { same: { lifetime: { kind: 'infinite' } } } },
        {
          id: 'consumables',
          abilityEntityDefinitions: { same: { lifetime: { kind: 'infinite' } } },
        },
      ],
    }),
  ).toThrow("common AbilityEntity 'same' belongs to both 'buffs' and 'consumables'");
});

it('独立定义不允许递归动作图', () => {
  expect(() =>
    createGameDataRepository({
      revision: 'recursive-common',
      commonDefinitionSources: [
        {
          id: 'buffs',
          buffDefinitions: {
            first: {
              stackingType: 'unlimited',
              lifecycleSequences: { start: { $sequence: 'entry' } },
              actionGraph: {
                main: {
                  nodes: { entry: { action: firstGraph.nodes.entry!.action, next: 'entry' } },
                },
                macros: {},
              },
            },
          },
        },
      ],
    }),
  ).toThrow('recursive action graph');
});

it('仓库装载干员图时校验所有入口及未使用节点', () => {
  const operator = (entry: string, graph = firstGraph) =>
    ({
      slug: 'graph-operator',
      actionGraph: graph,
      skillGroups: [
        {
          skills: {
            key: 'test',
            scheduledSequences: [{ startFrame: 0, sequence: { $sequence: entry } }],
          },
        },
      ],
    }) as unknown as OperatorDefinition & {
      actionGraph: ActionGraphDefinition;
    };
  expect(() =>
    createGameDataRepository({
      revision: 'graph',
      operators: [operator('entry')],
    }),
  ).not.toThrow();
  expect(() =>
    createGameDataRepository({
      revision: 'graph',
      operators: [operator('missing')],
    }),
  ).toThrow(
    "operator 'graph-operator'.skillGroups.0.skills.scheduledSequences.0.sequence: missing action graph node: missing",
  );
  const independentSkill = (entry: string) =>
    ({
      ...operator('entry'),
      skillGroups: [
        {
          skills: {
            key: 'test',
            scheduledSequences: [{ startFrame: 0, sequence: { $sequence: entry } }],
            actionGraph: { main: secondGraph, macros: {} },
          },
        },
      ],
    }) as unknown as OperatorDefinition & {
      actionGraph: ActionGraphDefinition;
    };
  expect(() =>
    createGameDataRepository({
      revision: 'nested-resource',
      operators: [independentSkill('entry')],
    }),
  ).not.toThrow();
  expect(() =>
    createGameDataRepository({
      revision: 'invalid-nested-resource',
      operators: [independentSkill('missing')],
    }),
  ).toThrow('missing action graph node: missing');
  const { actionGraph: _, ...graphless } = independentSkill('entry');
  expect(() =>
    createGameDataRepository({
      revision: 'graphless-operator',
      operators: [graphless],
    }),
  ).not.toThrow();
  const { actionGraph: _unused, ...invalidGraphless } = independentSkill('missing');
  expect(() =>
    createGameDataRepository({
      revision: 'invalid-graphless-operator',
      operators: [invalidGraphless],
    }),
  ).toThrow('missing action graph node: missing');
  const recursive: ActionGraphDefinition = {
    nodes: { entry: { action: firstGraph.nodes.entry!.action, next: 'entry' } },
  };
  expect(() =>
    createGameDataRepository({
      revision: 'graph',
      operators: [operator('entry', recursive)],
    }),
  ).toThrow("operator 'graph-operator': recursive action graph: entry");
});
