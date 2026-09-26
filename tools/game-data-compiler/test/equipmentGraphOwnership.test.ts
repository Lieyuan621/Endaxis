import { expect, it } from 'vitest';
import {
  compileWeaponContributions,
  compileWeaponBuffDefinitions,
} from '../../../src/core/compiler/compileEquipment.ts';
import { ActionGraphDefinitionRepository } from '../../../src/core/compiler/actionGraphDefinitionRepository.ts';
import { rootActionSteps } from '../../../src/core/compiler/actionProgramInspection.ts';

import type { WeaponDefinition } from '../../../packages/game-data-contract/src/equipment.ts';

it('相同原生技能与 Buff ID 在不同武器中保留各自程序和黑板', () => {
  const weapon = (slug: string, value: number): WeaponDefinition => ({
    slug,
    rarity: 5,
    weaponType: 'arts-unit',
    baseAttackAtLevelNodes: [1, 1, 1, 1, 1, 1],
    traits: [
      {
        key: 'passive',
        skillId: 'same-native-skill',
        levelCount: 1,
        blackboard: { scale: value },
        initializationSequence: { $sequence: 'entry' },
        actionGraph: {
          main: {
            nodes: {
              entry: {
                action: { kind: 'dealStagger', parameters: { value } },
                next: null,
              },
            },
          },
          macros: {},
        },
      },
    ],
    buffDefinitions: {
      'same-native-buff': {
        stackingType: 'unique',
        lifecycleSequences: {
          trigger: { $sequence: 'entry' },
        },
        actionGraph: {
          main: {
            nodes: {
              entry: {
                action: { kind: 'dealStagger', parameters: { value: value * 2 } },
                next: null,
              },
            },
          },
          macros: {},
        },
      },
    },
  });
  const first = weapon('first', 3);
  const second = weapon('second', 7);
  expect(first.traits[0]!.actionGraph).not.toBe(second.traits[0]!.actionGraph);
  const graph = first.traits[0]!.actionGraph!;
  if (!('main' in graph)) throw new Error('expected local resource graph');
  expect(Object.keys(graph.main.nodes)).toHaveLength(1);
  const repository = new ActionGraphDefinitionRepository();
  const compile = (definition: WeaponDefinition) =>
    compileWeaponContributions(
      definition,
      [1],
      { main: 'strength', secondary: 'agility' },
      repository,
    )[0]!;
  const a = compile(first),
    b = compile(second);
  expect(a.blackboard).toEqual({ scale: 3 });
  expect(b.blackboard).toEqual({ scale: 7 });
  expect(rootActionSteps(a.initializationSequence!)[0]).toMatchObject({
    parameters: { value: 3 },
  });
  expect(rootActionSteps(b.initializationSequence!)[0]).toMatchObject({
    parameters: { value: 7 },
  });
  expect(first.traits[0]).not.toHaveProperty('buffDefinitions');
  expect(a.buffDefinitions).toEqual({});
  const firstBuffs = compileWeaponBuffDefinitions(first, repository);
  const secondBuffs = compileWeaponBuffDefinitions(second, repository);
  expect(compileWeaponBuffDefinitions({ ...first, traits: [] }, repository)).toEqual(firstBuffs);
  const identical = weapon('identical', 3);
  expect(identical.buffDefinitions).toEqual(first.buffDefinitions);
  expect(identical.buffDefinitions).not.toBe(first.buffDefinitions);
  expect(identical.buffDefinitions!['same-native-buff']).not.toBe(
    first.buffDefinitions!['same-native-buff'],
  );
  expect(
    rootActionSteps(firstBuffs['same-native-buff']!.lifecycleSequences!.trigger!)[0],
  ).toMatchObject({ parameters: { value: 6 } });
  expect(
    rootActionSteps(secondBuffs['same-native-buff']!.lifecycleSequences!.trigger!)[0],
  ).toMatchObject({ parameters: { value: 14 } });
});
