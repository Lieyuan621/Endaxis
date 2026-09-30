import type { AbilityEntityDefinition } from '../../packages/game-data-contract/src/skills.ts';
import type { SkillBuffDefinition } from '../../packages/game-data-contract/src/buffs.ts';
import { expect, it } from 'vitest';
import type { ActionGraphDefinition } from '../../packages/game-data-contract/src/actionGraph';
import { createGameDataRepository } from './createGameDataRepository';

const firstGraph: ActionGraphDefinition = {
  nodes: { entry: { action: { kind: 'dealStagger', parameters: { value: 1 } }, next: null } },
};
const secondGraph: ActionGraphDefinition = {
  nodes: { entry: { action: { kind: 'dealStagger', parameters: { value: 2 } }, next: null } },
};

it('公共 Buff 校验自己的独立图入口', () => {
  const buff: SkillBuffDefinition = {
    stackingType: 'unlimited',
    lifecycleSequences: { start: { $sequence: 'entry' } },
    actionGraph: { main: firstGraph, macros: {} },
  };
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

it('公共能力实体校验子技能自己的独立图入口', () => {
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
  expect(repository.getCommonBuffSource!('first')?.id).toBe('buffs');
  expect(repository.getCommonAbilityEntitySource!('second')?.id).toBe('consumables');
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
