import { describe, expect, it } from 'vitest';
import { createAbilityEntityChildSkillDraft } from '../skills/skillDefinitionEditorViewModel';
import type { OperatorDefinition } from '../../../../core/game-data/operatorDefinition';
import liino from '../../../../data/operators/liino.generated';
import { commonBuffDefinitions } from '../../../../data/buffs/generated/commonBuffDefinitions.generated';
import {
  collectOperatorDefinitionReferences,
  referencesToDefinition,
} from './operatorDefinitionReferences';

it('梨诺的层数条件不要求提供被查询 Buff 的定义，但创建缺失 Buff 仍须报错', () => {
  const operator = structuredClone(liino);
  const knownIds = new Set([
    ...Object.keys(commonBuffDefinitions),
    ...Object.keys(operator.buffDefinitions ?? {}),
  ]);
  const missingDefinitions = () =>
    collectOperatorDefinitionReferences(operator).filter(
      ref => ref.kind === 'buff' && !knownIds.has(ref.id) && ref.usage !== 'instanceFilter',
    );
  const queried = collectOperatorDefinitionReferences(operator).filter(
    ref => ref.id === 'buff_chr_0035_liino_chrdung_armorbreak',
  );
  expect(queried).toHaveLength(5);
  expect(queried.every(ref => ref.usage === 'instanceFilter')).toBe(true);
  expect(missingDefinitions()).toEqual([]);

  operator.passiveSkills = [
    {
      key: 'missing-definition-test',
      enableSequence: {
        steps: [
          {
            kind: 'applyBuff',
            parameters: { target: 'caster', buffId: 'missing-buff' },
          },
        ],
      },
    },
  ];
  expect(missingDefinitions()).toMatchObject([{ id: 'missing-buff' }]);
});

it('结束实例的 ID 保留使用处索引，但不与创建定义依赖混为一类', () => {
  const operator = definition();
  operator.skillGroups = [
    {
      key: 'qa',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: {
        key: 'qa',
        timelineBlockFrames: 1,
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: {
              steps: [
                {
                  kind: 'once',
                  parameters: { scopeKey: 'qa' },
                  body: {
                    steps: [
                      {
                        kind: 'finishBuffsById',
                        parameters: { target: 'caster', buffIds: ['same-id'], reason: 'other' },
                      },
                      { kind: 'applyBuff', parameters: { target: 'caster', buffId: 'same-id' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ];
  const refs = referencesToDefinition(
    collectOperatorDefinitionReferences(operator),
    'buff',
    'same-id',
  );
  expect(refs).toHaveLength(2);
  expect(refs.find(ref => ref.path.endsWith('buffIds[0]'))?.usage).toBe('instanceFilter');
  expect(refs.find(ref => ref.path.endsWith('buffId'))?.usage).toBeUndefined();
});

it('tracks all passive UI Buff references using their actual contract fields', () => {
  const operator = definition();
  const cases: NonNullable<OperatorDefinition['passiveUi']>[] = [
    {
      kind: 'buffProgress',
      appearance: 'liinoMusic',
      normalBuffId: 'normal',
      ultimateBuffId: 'ultimate',
    },
    {
      kind: 'buffCounters',
      appearance: 'typhoeaArrows',
      reserveArrowBuffId: 'reserve',
      battleArrowBuffId: 'battle',
      pointBuffId: 'point',
      maximumArrows: 3,
      maximumPoints: 3,
    },
  ];
  for (const passiveUi of cases) {
    const refs = collectOperatorDefinitionReferences({ ...operator, passiveUi }).filter(ref =>
      ref.path.startsWith('passiveUi.'),
    );
    expect(refs.map(ref => ref.id)).toEqual(
      passiveUi.kind === 'buffProgress' ? ['normal', 'ultimate'] : ['reserve', 'battle', 'point'],
    );
    expect(refs.every(ref => ref.kind === 'buff' && ref.ownerKind === 'operator')).toBe(true);
  }
});

function definition(): OperatorDefinition {
  return {
    slug: 'reference-test',
    gameId: 'reference-test',
    rarity: 5,
    weaponType: 'sword',
    element: 'electric',
    role: 'guard',
    mainAttribute: 'strength',
    secondaryAttribute: 'agility',
    attributes: {
      strength: [1],
      agility: [1],
      intellect: [1],
      will: [1],
      baseAttack: [1],
      baseHealth: [1],
    },
    skillGroups: [
      {
        key: 'normal',
        skillType: 'basicAttack',
        levelSource: 'basicAttack',
        skills: {
          key: 'attack',
          timelineBlockFrames: 10,
          scheduledSequences: [
            {
              startFrame: 0,
              sequence: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: { target: 'caster', buffId: 'buff-a' },
                  },
                  {
                    kind: 'applyBuff',
                    parameters: {
                      target: 'caster',
                      buffId: 'inline-only',
                      definition: { stackingType: 'refresh' },
                    },
                  },
                  {
                    kind: 'spawnAbilityEntity',
                    parameters: { abilityEntityId: 'entity-a', dieWhenSourceDies: true },
                  },
                ],
              },
            },
          ],
        },
        replacementSkills: [
          {
            key: 'replacement',
            timelineBlockFrames: 10,
            scheduledSequences: [
              {
                startFrame: 0,
                sequence: {
                  steps: [
                    {
                      kind: 'applyBuff',
                      parameters: { target: 'caster', buffId: 'buff-b' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
    buffDefinitions: {
      'buff-a': {
        stackingType: 'refresh',
        lifecycleSequences: {
          start: {
            steps: [
              {
                kind: 'finishBuffsById',
                parameters: { target: 'caster', buffIds: ['buff-b'], reason: 'early' },
              },
            ],
          },
        },
      },
      'buff-b': { stackingType: 'refresh' },
    },
    abilityEntityDefinitions: {
      'entity-a': {
        lifetime: { kind: 'infinite' },
        childSkill: {
          ...createAbilityEntityChildSkillDraft('child'),
          scheduledSequences: [
            {
              startFrame: 0,
              sequence: {
                steps: [
                  {
                    kind: 'findOwnerSpawnedAbilityEntities',
                    parameters: {
                      saveToContextKey: 'targets',
                      abilityEntityIds: ['entity-b'],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      'entity-b': { lifetime: { kind: 'infinite' } },
    },
    passiveSkills: [
      {
        key: 'root-passive',
        enableSequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: { target: 'caster', buffId: 'buff-b' },
            },
          ],
        },
      },
    ],
    talents: [
      {
        levels: 1,
        initializationSequence: {
          steps: [
            {
              kind: 'spawnAbilityEntity',
              parameters: { abilityEntityId: 'entity-b', dieWhenSourceDies: true },
            },
          ],
        },
      },
    ],
    potentials: [],
  };
}

describe('operator definition references', () => {
  it('indexes references in skills, Buff lifecycles, and ability-entity child skills', () => {
    const references = collectOperatorDefinitionReferences(definition());

    expect(referencesToDefinition(references, 'buff', 'buff-a')).toMatchObject([
      { ownerKind: 'skill', ownerId: 'normal/attack' },
    ]);
    expect(referencesToDefinition(references, 'buff', 'buff-b')).toMatchObject([
      { ownerKind: 'skill', ownerId: 'normal/replacement' },
      { ownerKind: 'buff', ownerId: 'buff-a' },
      { ownerKind: 'passiveSkill', ownerId: 'root-passive' },
    ]);
    expect(referencesToDefinition(references, 'entity', 'entity-a')).toMatchObject([
      { ownerKind: 'skill', ownerId: 'normal/attack' },
    ]);
    expect(referencesToDefinition(references, 'entity', 'entity-b')).toMatchObject([
      { ownerKind: 'entity', ownerId: 'entity-a' },
      { ownerKind: 'upgrade', ownerId: 'talents/0' },
    ]);
  });

  it('does not treat registry keys as references', () => {
    const references = collectOperatorDefinitionReferences(definition());

    expect(referencesToDefinition(references, 'buff', 'unused')).toEqual([]);
    expect(references.some(reference => reference.path === 'buffDefinitions["buff-a"]')).toBe(
      false,
    );
    expect(referencesToDefinition(references, 'buff', 'inline-only')).toEqual([]);
  });
});
