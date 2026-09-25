import { describe, expect, it } from 'vitest';
import { createAbilityEntityChildSkillDraft } from './skills/skillDefinitionEditorViewModel';
import type {
  AbilityEntityDefinition,
  SkillDefinition,
  SkillBuffDefinition,
} from '../../../core/game-data/operatorDefinition';
import {
  buildAbilityEntityStructureMindMap,
  buildActionSequenceMindMap,
  buildBuffStructureMindMap,
  buildEquipmentContributionMindMap,
  buildSkillStructureMindMap,
  findSkillStructureNodeForPath,
  indexSkillStructureNodes,
} from './skillStructureMindMapModel';
import { appendCombatStepInStructure, resolveStructureValue } from './skillStructureEditorCommands';

describe('skillStructureMindMapModel', () => {
  it('施放旁路复用条件和序列节点，保留真实路径及必填序列', () => {
    const skill: SkillDefinition = {
      key: 'bypass',
      timelineBlockFrames: 1,
      scheduledSequences: [],
      switchToBuffCast: { asSkillCast: false, sequence: { steps: [] } },
    };
    const root = buildSkillStructureMindMap(skill);
    const condition = findSkillStructureNodeForPath(root, 'switchToBuffCast.condition');
    expect(condition.sourcePath).toBe('switchToBuffCast.condition');
    expect(condition.canAddChild).toBe('combatCondition');
    const sequence = findSkillStructureNodeForPath(root, 'switchToBuffCast.sequence');
    expect(sequence.canAddChild).toBe('step');
    expect(sequence.canDelete).toBe(false);
    const changed = appendCombatStepInStructure(skill, sequence.sourcePath!, {
      kind: 'finishCurrentAbilityEntity',
      parameters: {},
    }).root;
    const stepPath = 'switchToBuffCast.sequence.steps[0]';
    expect(
      findSkillStructureNodeForPath(buildSkillStructureMindMap(changed), stepPath).sourcePath,
    ).toBe(stepPath);
    expect(changed.switchToBuffCast?.asSkillCast).toBe(false);
    expect(skill.switchToBuffCast?.sequence.steps).toHaveLength(0);
  });
  it('伤害修正条件程序复用序列节点，独立与内联 Buff 均保留真实路径', () => {
    const definition: SkillBuffDefinition = {
      stackingType: 'refresh',
      damageModifiers: [
        {
          enabledSide: 'attacker',
          processors: [],
          conditionProgram: {
            steps: [
              {
                kind: 'listenForCombatEvents',
                parameters: {
                  responses: [
                    { key: 'response', event: { kind: 'operatorHit' }, sequence: { steps: [] } },
                  ],
                },
              },
            ],
          },
        },
      ],
    };
    const path = 'damageModifiers[0].conditionProgram';
    const root = buildBuffStructureMindMap('test', definition);
    const node = findSkillStructureNodeForPath(root, path);
    expect(node.sourcePath).toBe(path);
    expect(node.canAddChild).toBe('step');
    const responsePath = `${path}.steps[0].parameters.responses[0]`;
    expect(findSkillStructureNodeForPath(root, responsePath).payloadKind).toBe('eventResponse');
    const changed = appendCombatStepInStructure(definition, path, {
      kind: 'finishCurrentBuff',
      parameters: { reason: 'early', finishSource: 'actionSource' },
    });
    expect((resolveStructureValue(changed.root, path) as { steps: unknown[] }).steps).toHaveLength(
      2,
    );
    expect(definition.damageModifiers![0]!.conditionProgram!.steps).toHaveLength(1);
    const inline = buildActionSequenceMindMap({
      steps: [
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'test',
            target: 'enemy',
            definition,
          },
        },
      ],
    });
    const inlinePath = `steps[0].parameters.definition.${responsePath}`;
    expect(findSkillStructureNodeForPath(inline, inlinePath).sourcePath).toBe(inlinePath);
  });
  it('把具名能力实体子技能分别展开为成员，并保留各自完整结构路径', () => {
    const definition: AbilityEntityDefinition = {
      lifetime: { kind: 'limited', durationSeconds: 50 },
      childSkills: {
        chr_0032_first: {
          ...createAbilityEntityChildSkillDraft('chr_0032_first'),
          scheduledSequences: [],
        },
        'chr_0032.second': {
          ...createAbilityEntityChildSkillDraft('chr_0032.second'),
          blackboard: { scale: 1 },
          scheduledSequences: [
            {
              startFrame: 14,
              sequence: { steps: [{ kind: 'finishActionOwnerAbilityEntity', parameters: {} }] },
            },
          ],
        },
      },
    };
    const root = buildAbilityEntityStructureMindMap('entity.test', definition);
    const children = root.children.filter(node => node.payloadKind === 'childSkill');

    expect(root.summary).toContain('2 个子技能 · 1 条子序列');
    expect(children).toHaveLength(2);
    expect(children[0]).toMatchObject({
      label: 'chr_0032_first',
      relationToParent: 'member',
      sourcePath: 'childSkills["chr_0032_first"]',
    });
    expect(children[1]?.children[0]).toMatchObject({
      sourcePath: 'childSkills["chr_0032.second"].scheduledSequences[0]',
      payloadKind: 'scheduledSequence',
    });
    expect(findSkillStructureNodeForPath(root, children[1]!.children[0]!.sourcePath).id).toBe(
      children[1]!.children[0]!.id,
    );
  });

  it('把 GlobalBuff 父定义投影为固定端口，把子 Buff 投影为可排序成员', () => {
    const skill: SkillDefinition = {
      key: 'global-buff',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'createGlobalBuff',
                parameters: {
                  globalBuffId: 'global.test',
                  definition: {
                    stackingType: 'stack',
                    maxStackCount: 4,
                    blackboard: { duration: 10 },
                    children: [
                      { buffId: 'buff.a', blackboardAssignments: {} },
                      {
                        buffId: 'buff.b',
                        blackboardAssignments: {
                          scale: { kind: 'blackboard', key: 'scale' },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      ],
    };
    const nodes = indexSkillStructureNodes(buildSkillStructureMindMap(skill));
    const definition = nodes.get('sequence:0:step:0:definition');
    const firstChild = nodes.get('sequence:0:step:0:definition:child:0');
    const secondChild = nodes.get('sequence:0:step:0:definition:child:1');

    expect(definition).toMatchObject({
      payloadKind: 'globalBuffDefinition',
      relationToParent: 'port',
      canAddChild: 'globalBuffChild',
      acceptsChildKind: 'globalBuffChild',
      sourcePath: 'scheduledSequences[0].sequence.steps[0].parameters.definition',
    });
    expect(firstChild).toMatchObject({
      payloadKind: 'globalBuffChild',
      relationToParent: 'member',
      canDelete: true,
      canMove: true,
      sourcePath: 'scheduledSequences[0].sequence.steps[0].parameters.definition.children[0]',
    });
    expect(secondChild?.summary).toBe('1 项父黑板赋值');
  });

  it('把内联能力实体子技能和回调 Body 展开为固定结构端口', () => {
    const skill: SkillDefinition = {
      key: 'inline-child-skill',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'forEachContextTarget',
                parameters: { contextKey: 'entities' },
                body: {
                  steps: [
                    {
                      kind: 'startCurrentAbilityEntityChildSkill',
                      parameters: {
                        childSkill: {
                          ...createAbilityEntityChildSkillDraft('child.test'),
                          scheduledSequences: [
                            {
                              startFrame: 0,
                              sequence: { steps: [{ kind: 'finishTimeline', parameters: {} }] },
                            },
                          ],
                        },
                      },
                    },
                    {
                      kind: 'launchProjectile',
                      parameters: { finish: 1, recycleDelaySeconds: 0 },
                      callbacks: [
                        {
                          event: 'finish',
                          skill: {
                            skillId: 'callback',
                            nativeSkillType: 'normalSkill',
                            naturalDurationFrames: 1,
                            castResource: {
                              costFrame: 0,
                              cooldownSeconds: 0,
                              maxChargeTime: 1,
                              cost: {
                                resource: 'ultimateEnergy',
                                value: 0,
                                availabilityThreshold: 0,
                              },
                            },
                            blackboard: {},
                            scheduledSequences: [
                              {
                                startFrame: 0,
                                endFrame: 0,
                                sequence: { steps: [{ kind: 'finishTimeline', parameters: {} }] },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };
    const nodes = [...indexSkillStructureNodes(buildSkillStructureMindMap(skill)).values()];
    const childSkill = nodes.find(node => node.payloadKind === 'childSkill');
    const callbackBody = nodes.find(
      node =>
        node.sourcePath ===
        'scheduledSequences[0].sequence.steps[0].body.steps[1].callbacks[0].skill.scheduledSequences',
    );
    expect(childSkill).toMatchObject({
      relationToParent: 'port',
      canAddChild: 'sequence',
      acceptsChildKind: 'scheduledSequence',
      canCopy: false,
      sourcePath:
        'scheduledSequences[0].sequence.steps[0].body.steps[0].parameters.childSkill.scheduledSequences',
    });
    expect(childSkill?.children[0]?.sourcePath).toBe(
      'scheduledSequences[0].sequence.steps[0].body.steps[0].parameters.childSkill.scheduledSequences[0]',
    );
    expect(callbackBody).toMatchObject({ canAddChild: 'sequence', relationToParent: 'port' });
  });

  it('Switch 候选是可添加步骤的序列端口，重复标签仍有独立路径', () => {
    const skill: SkillDefinition = {
      key: 'test',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'switch',
                parameters: { choice: { kind: 'blackboard', key: 'count' }, alwaysNext: true },
                options: [0, 0].map(value => ({
                  value: { kind: 'constant', value },
                  sequence: { steps: [] },
                })),
              },
            ],
          },
        },
      ],
    };
    const nodes = [
      ...indexSkillStructureNodes(
        buildSkillStructureMindMap(skill, {
          blackboard: 'Blackboard',
          availability: 'Availability',
          sequence: 'Sequence',
        }),
      ).values(),
    ];
    const branches = nodes.filter(node => node.sourcePath.includes('.options['));
    expect(branches.map(node => node.sourcePath)).toEqual(
      [0, 1].map(index => `scheduledSequences[0].sequence.steps[0].options[${index}].sequence`),
    );
    expect(branches.every(node => node.canAddChild === 'step')).toBe(true);
  });

  it('projects settings, sequences, nested branches, and definition references', () => {
    const skill = {
      key: 'testSkill',
      timelineBlockFrames: 20,
      availability: {
        kind: 'any',
        conditions: [{ kind: 'combatActive' }, { kind: 'casterControlled' }],
      },
      eventHandlers: [
        {
          key: 'after-hit',
          event: { kind: 'skillHit', skillGroupKey: 'battleSkill', scope: 'operator' },
          condition: { kind: 'combatActive' },
          scheduledSequences: [
            {
              startFrame: 2,
              sequence: { steps: [{ kind: 'finishTimeline', parameters: {} }] },
            },
          ],
        },
      ],
      scheduledSequences: [
        {
          startFrame: 5,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: { condition: { kind: 'combatActive' } },
                whenTrue: {
                  steps: [
                    {
                      kind: 'spawnAbilityEntity',
                      parameters: { abilityEntityId: 'entity.test' },
                    },
                  ],
                },
                whenFalse: { steps: [] },
              },
              {
                kind: 'listenForCombatEvents',
                parameters: {
                  responses: [
                    {
                      key: 'on-hit',
                      event: { kind: 'buffApplied' },
                      condition: { kind: 'combatActive' },
                      sequence: {
                        steps: [{ kind: 'finishTimeline', parameters: {} }],
                      },
                    },
                    {
                      key: 'on-airborne',
                      event: { kind: 'airborneOutput' },
                      sequence: { steps: [] },
                    },
                  ],
                },
              },
              {
                kind: 'jumpTimeline',
                parameters: { destinationFrame: 18 },
              },
              {
                kind: 'jumpTimeline',
                parameters: {
                  destinationFrame: 19,
                  condition: { kind: 'casterControlled' },
                },
              },
              {
                kind: 'applyPhysicalInfliction',
                parameters: {
                  type: 'fracture',
                  target: 'enemy',
                  isExtra: false,
                  noGuardBuffId: 'buff_physical_no_guard',
                  noGuardDefinition: {
                    stackingType: 'unlimited',
                    durationSeconds: 10,
                    lifecycleSequences: {
                      enable: { steps: [{ kind: 'finishTimeline', parameters: {} }] },
                    },
                  },
                  fractureBuffId: 'buff_physical_fracture',
                  fractureDefinition: {
                    stackingType: 'refresh',
                    durationSeconds: 5,
                  },
                },
              },
            ],
          },
        },
      ],
    } as unknown as SkillDefinition;

    const root = buildSkillStructureMindMap(skill, {
      blackboard: 'Blackboard',
      availability: 'Availability',
      sequence: 'Sequence',
    });
    const nodes = indexSkillStructureNodes(root);

    expect(root.children.map(node => node.label)).toEqual([
      'Blackboard',
      'Availability',
      '技能事件响应',
      '输入窗口',
      '施放旁路',
      'Sequence 1',
    ]);
    expect(nodes.get('sequence:0')?.editorSection).toBe(0);
    expect(root.canAddChild).toBe('sequence');
    expect(nodes.get('sequence:0')?.canAddChild).toBe('step');
    expect(nodes.get('sequence:0:step:0:false')?.canAddChild).toBe('step');
    expect(findSkillStructureNodeForPath(root, '$.scheduledSequences[0].endFrame').id).toBe(
      'sequence:0',
    );
    expect(
      findSkillStructureNodeForPath(
        root,
        '$.scheduledSequences[0].sequence.steps[0].whenTrue.steps[0].parameters.abilityEntityId',
      ).id,
    ).toBe('sequence:0:step:0:true:step:0');
    expect(nodes.get('sequence:0:step:0')?.details['步骤类型']).toBe('conditional');
    expect(nodes.get('availability')?.payloadKind).toBe('combatCondition');
    expect(nodes.get('availability')?.canAddChild).toBe('combatCondition');
    expect(nodes.get('availability:condition:1')?.sourcePath).toBe('availability.conditions[1]');
    expect(nodes.get('sequence:0:step:0:condition')?.sourcePath).toBe(
      'scheduledSequences[0].sequence.steps[0].parameters.condition',
    );
    expect(nodes.get('sequence:0:step:0:condition')?.canDelete).toBe(false);
    expect(nodes.get('sequence:0:step:1')?.canAddChild).toBe('eventResponse');
    expect(nodes.get('sequence:0:step:1:response:0')?.sourcePath).toBe(
      'scheduledSequences[0].sequence.steps[1].parameters.responses[0]',
    );
    expect(nodes.get('sequence:0:step:1:response:0:condition')?.sourcePath).toBe(
      'scheduledSequences[0].sequence.steps[1].parameters.responses[0].condition',
    );
    expect(nodes.get('sequence:0:step:4')?.children.map(node => node.label)).toEqual([
      '破防层 Buff',
      '碎甲 Buff',
    ]);
    expect(nodes.get('sequence:0:step:4:no-guard-definition')?.relationToParent).toBe('port');
    expect(
      nodes.get('sequence:0:step:4:no-guard-definition:buff:lifecycle:enable:step:0')?.sourcePath,
    ).toBe(
      'scheduledSequences[0].sequence.steps[4].parameters.noGuardDefinition.lifecycleSequences.enable.steps[0]',
    );
    expect(nodes.get('sequence:0:step:1:response:0:sequence:step:0')?.sourcePath).toBe(
      'scheduledSequences[0].sequence.steps[1].parameters.responses[0].sequence.steps[0]',
    );
    expect(nodes.get('sequence:0:step:1:response:1')?.canAddChild).toBe('combatCondition');
    expect(nodes.get('sequence:0:step:2:condition')?.canAddChild).toBe('combatCondition');
    expect(nodes.get('sequence:0:step:2:condition')?.sourcePath).toBe(
      'scheduledSequences[0].sequence.steps[2].parameters.condition',
    );
    expect(nodes.get('sequence:0:step:3:condition')?.payloadKind).toBe('combatCondition');
    expect(nodes.get('sequence:0:step:3:condition')?.canDelete).toBe(true);
    expect(nodes.get('skill:handlers')?.canAddChild).toBe('skillEventHandler');
    expect(nodes.get('skill:handler:0')?.sourcePath).toBe('eventHandlers[0]');
    expect(nodes.get('skill:handler:0:condition')?.sourcePath).toBe('eventHandlers[0].condition');
    expect(nodes.get('skill:handler:0:sequences')?.canAddChild).toBe('sequence');
    expect(nodes.get('skill:handler:0:sequence:0')?.sourcePath).toBe(
      'eventHandlers[0].scheduledSequences[0]',
    );
    expect(nodes.get('skill:handler:0:sequence:0')?.canDelete).toBe(false);
    expect(nodes.get('sequence:0:step:0:true:step:0')?.reference).toEqual({
      kind: 'entity',
      id: 'entity.test',
    });

    const withoutAvailability = buildSkillStructureMindMap({
      ...skill,
      availability: undefined,
    });
    expect(indexSkillStructureNodes(withoutAvailability).get('availability')?.canAddChild).toBe(
      'combatCondition',
    );
  });

  it('projects Buff lifecycle and ability-entity child timelines through the same node model', () => {
    const buff = buildBuffStructureMindMap('buff.test', {
      stackingType: 'refresh',
      scheduledSequences: [
        {
          startFrame: 4,
          endFrame: 12,
          sequence: {
            steps: [{ kind: 'changeResource', parameters: { resource: 'sp', amount: 3 } }],
          },
        },
      ],
      lifecycleSequences: {
        trigger: {
          steps: [{ kind: 'changeResource', parameters: { resource: 'sp', amount: 1 } }],
        },
      },
      abilityEventResponses: [
        {
          event: 'outputDamage',
          priority: 3,
          sequence: {
            steps: [{ kind: 'changeResource', parameters: { resource: 'sp', amount: 2 } }],
          },
        },
      ],
      igniteEventResponses: [
        {
          igniteType: 'test-ignite',
          finishAfterIgnited: true,
          sequence: { steps: [{ kind: 'finishBuff', parameters: {} }] },
        },
      ],
    } as never);
    const buffNodes = indexSkillStructureNodes(buff);
    expect(buff.canAddChild).toBe('lifecycle');
    expect(buffNodes.get('buff:scheduled-sequences')?.canAddChild).toBe('sequence');
    expect(buffNodes.get('buff:scheduled-sequences')?.relationToParent).toBe('port');
    expect(buffNodes.get('buff:sequence:0')?.sourcePath).toBe('scheduledSequences[0]');
    expect(buffNodes.get('buff:sequence:0')?.payloadKind).toBe('scheduledSequence');
    expect(buffNodes.get('buff:sequence:0')?.relationToParent).toBe('member');
    expect(buffNodes.get('buff:sequence:0:step:0')?.sourcePath).toBe(
      'scheduledSequences[0].sequence.steps[0]',
    );
    expect(buffNodes.get('buff:lifecycle:trigger')?.canAddChild).toBe('step');
    expect(buffNodes.get('buff:lifecycle:trigger:step:0')?.sourcePath).toBe(
      'lifecycleSequences.trigger.steps[0]',
    );
    expect(buffNodes.get('buff:ability-responses')?.canAddChild).toBe('buffAbilityResponse');
    expect(buffNodes.get('buff:ability-responses')?.relationToParent).toBe('port');
    expect(buffNodes.get('buff:ability-response:0')?.sourcePath).toBe('abilityEventResponses[0]');
    expect(buffNodes.get('buff:ability-response:0:sequence')?.relationToParent).toBe('port');
    expect(buffNodes.get('buff:ability-response:0:sequence:step:0')?.sourcePath).toBe(
      'abilityEventResponses[0].sequence.steps[0]',
    );
    expect(buffNodes.get('buff:ignite-responses')?.canAddChild).toBe('buffIgniteResponse');
    expect(buffNodes.get('buff:ignite-response:0')?.sourcePath).toBe('igniteEventResponses[0]');
    expect(buffNodes.get('buff:ignite-response:0:sequence:step:0')?.sourcePath).toBe(
      'igniteEventResponses[0].sequence.steps[0]',
    );

    const entity = buildAbilityEntityStructureMindMap('entity.test', {
      lifetime: { kind: 'limited', durationSeconds: 10 },
      childSkill: {
        ...createAbilityEntityChildSkillDraft('entity-child'),
        scheduledSequences: [
          {
            startFrame: 3,
            sequence: {
              steps: [
                { kind: 'finishCurrentAbilityEntity', parameters: {} },
                {
                  kind: 'listenForCombatEvents',
                  parameters: {
                    responses: [
                      {
                        key: 'entity-response',
                        event: { kind: 'buffApplied' },
                        condition: { kind: 'combatActive' },
                        sequence: { steps: [] },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    });
    const entityNodes = indexSkillStructureNodes(entity);
    expect(entityNodes.get('entity:child-skill')?.canAddChild).toBe('sequence');
    expect(entityNodes.get('entity:sequence:0')?.canAddChild).toBe('step');
    expect(entityNodes.get('entity:sequence:0:step:0')?.sourcePath).toBe(
      'childSkill.scheduledSequences[0].sequence.steps[0]',
    );
    expect(entityNodes.get('entity:sequence:0:step:1')?.canAddChild).toBe('eventResponse');
    expect(entityNodes.get('entity:sequence:0:step:1:response:0:condition')?.sourcePath).toBe(
      'childSkill.scheduledSequences[0].sequence.steps[1].parameters.responses[0].condition',
    );

    const entityWithoutChildSkill = buildAbilityEntityStructureMindMap('entity.empty', {
      lifetime: { kind: 'infinite' },
    });
    expect(entityWithoutChildSkill.canAddChild).toBe('childSkill');
  });

  it('projects equipment modifiers and event response sequences into the shared map', () => {
    const root = buildEquipmentContributionMindMap({
      modifiers: [{ kind: 'panelStat', stat: 'criticalRate', value: [0.1, 0.2] }],
      eventHandlers: [
        {
          key: 'on-hit',
          event: { kind: 'skillHit', skillGroupKey: 'battleSkill', scope: 'operator' },
          condition: {
            kind: 'all',
            conditions: [
              { kind: 'combatActive' },
              { kind: 'not', condition: { kind: 'casterControlled' } },
            ],
          },
          sequence: {
            steps: [
              {
                kind: 'changeResource',
                parameters: { resource: 'sp', amount: 1, recipient: 'caster' },
              },
            ],
          },
        },
        {
          key: 'without-condition',
          event: { kind: 'buffApplied' },
          sequence: { steps: [] },
        },
      ],
      blackboard: { initial_rate: [1, 2] },
      initializationSequence: {
        steps: [
          {
            kind: 'changeResource',
            parameters: { resource: 'sp', amount: 2, recipient: 'caster' },
          },
        ],
      },
    });
    const nodes = indexSkillStructureNodes(root);

    expect(nodes.get('equipment:modifier:0')?.sourcePath).toBe('modifiers[0]');
    expect(nodes.get('equipment:modifier:0')?.payloadKind).toBe('equipmentModifier');
    expect(nodes.get('equipment:modifiers')?.acceptsChildKind).toBe('equipmentModifier');
    expect(nodes.get('equipment:modifiers')?.canAddChild).toBe('equipmentModifier');
    expect(nodes.get('equipment:handler:0')?.sourcePath).toBe('eventHandlers[0]');
    expect(nodes.get('equipment:handler:0')?.payloadKind).toBe('equipmentHandler');
    expect(nodes.get('equipment:handler:0:condition')?.sourcePath).toBe(
      'eventHandlers[0].condition',
    );
    expect(nodes.get('equipment:handler:0:condition')?.canAddChild).toBe('combatCondition');
    expect(nodes.get('equipment:handler:0:condition')?.canMove).toBe(false);
    expect(nodes.get('equipment:handler:0:condition:condition:0')?.sourcePath).toBe(
      'eventHandlers[0].condition.conditions[0]',
    );
    expect(nodes.get('equipment:handler:0:condition:condition:1:condition')?.sourcePath).toBe(
      'eventHandlers[0].condition.conditions[1].condition',
    );
    expect(nodes.get('equipment:handler:0:condition:condition:1:condition')?.canDelete).toBe(false);
    expect(nodes.get('equipment:handler:1')?.canAddChild).toBe('combatCondition');
    expect(nodes.get('equipment:handlers')?.canAddChild).toBe('equipmentHandler');
    expect(nodes.get('equipment:handler:0:sequence:step:0')?.sourcePath).toBe(
      'eventHandlers[0].sequence.steps[0]',
    );
    expect(nodes.get('equipment:initialization-sequence')?.sourcePath).toBe(
      'initializationSequence',
    );
    expect(nodes.get('equipment:initialization-sequence')?.relationToParent).toBe('port');
    expect(nodes.get('equipment:initialization-sequence')?.canAddChild).toBe('step');
    expect(nodes.get('equipment:initialization-sequence:step:0')?.sourcePath).toBe(
      'initializationSequence.steps[0]',
    );
  });
});
