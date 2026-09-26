import type { AbilityEntityDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import type { OperatorPassiveSkillDefinition } from '../../../packages/game-data-contract/src/operators.ts';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import { resolveScenarioBuilds } from './resolveScenarioBuilds';

import { ActionGraphDefinitionRepository } from './actionGraphDefinitionRepository';
import { rootActionSteps } from './actionProgramInspection';
import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../project/createProject';
import type { ScenarioDocument } from '../project/schema';
import { perlica } from '../../data/operators/perlica.generated';
import { placeSkillGroup } from '../../ui/timeline/interaction/placeSkillGroup';
import {
  compileOperatorDefinitionSkills,
  compileOperatorSkillCastPrograms,
  compileResolvedScenarioTimeline,
  compileSkillCastPlayerInput,
  compileScenarioTimeline,
} from './compileScenarioTimeline';
import type { OperatorDefinition } from '../game-data/operatorDefinition';

function createScenario(): ScenarioDocument {
  const scenario = createEmptyScenario('scenario:1', '佩丽卡编译样本');

  scenario.tracks[0] = {
    id: 'track:0',
    operator: {
      operatorSlug: perlica.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  return scenario;
}

function index() {
  return {
    actionPrograms: new ActionGraphDefinitionRepository(),
    getOperator: (slug: string) => (slug === perlica.slug ? perlica : null),
    getCommonDefinitionSources: () => [],
  };
}

function place(scenario: ScenarioDocument, skillGroupKey: string, startFrame: number) {
  let nextId = scenario.tracks[0]!.skillCasts.length;
  return placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: perlica,
    skillGroupKey,
    startFrame,
    ids: { allocate: kind => `${kind}:${++nextId}` },
  }).scenario;
}

function requireSingleSkill(skillGroupKey: string): SkillDefinition {
  const group = perlica.skillGroups.find(candidate => candidate.key === skillGroupKey);
  if (group === undefined) {
    throw new Error(`expected single-skill group '${skillGroupKey}'`);
  }
  const skills = group.skills;
  if (Array.isArray(skills)) {
    throw new Error(`expected single-skill group '${skillGroupKey}'`);
  }
  return skills as SkillDefinition;
}

describe('compileScenarioTimeline', () => {
  it('Switch 的候选伤害保留步骤 key，不预写施放 hitId', () => {
    const scenario = place(createScenario(), 'battleSkill', 0);
    const cast = scenario.tracks[0]!.skillCasts[0]!;
    cast.customDefinition = {
      key: 'chr_0004_pelica_normal_skill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      timelineBlockFrames: 1,
      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'switch' } }],
      actionGraph: {
        main: {
          nodes: {
            switch: {
              action: {
                kind: 'switch',
                parameters: { choice: { kind: 'constant', value: 0 }, alwaysNext: true },
                options: [0, 1].map(value => ({
                  value: { kind: 'constant', value },
                  sequence: { $sequence: `case${value}` },
                })),
              },
              next: null,
            },
            case0: {
              action: {
                kind: 'dealDamage',
                key: 'case0',
                parameters: { damageType: 'physical', attackScale: 1, tags: [] },
              },
              next: null,
            },
            case1: {
              action: {
                kind: 'dealDamage',
                key: 'case1',
                parameters: { damageType: 'physical', attackScale: 1, tags: [] },
              },
              next: null,
            },
          },
        },
        macros: {},
      },
    };
    const program = compileScenarioTimeline(scenario, index()).operators[0]!.skillCasts!.find(
      binding => binding.castId === cast.id,
    )!.program;
    const step = rootActionSteps(program.timelineActions[0]!.sequence)[0]!;
    if (step.kind !== 'switch') throw new Error('expected switch');
    expect(step.options.map(option => rootActionSteps(option.sequence)[0]!.key)).toEqual([
      'case0',
      'case1',
    ]);
    expect(step.options.map(option => rootActionSteps(option.sequence)[0]!.hitId)).toEqual([
      undefined,
      undefined,
    ]);
  });

  it('copies cast-specific simulation inputs into the input instead of the skill program', () => {
    const scenario = place(createScenario(), 'battleSkill', 0);
    scenario.tracks[0]!.skillCasts[0]!.simulationInputs = {
      randomSeed: 7,
      criticalOverrides: { 'damage:1': true },
    };

    const compiled = compileScenarioTimeline(scenario, index());

    expect(compiled.inputs[0]?.simulationInputs).toEqual({
      randomSeed: 7,
      criticalOverrides: { 'damage:1': true },
    });
    expect(compiled.inputs[0]?.simulationInputs?.criticalOverrides).not.toBe(
      scenario.tracks[0]!.skillCasts[0]!.simulationInputs?.criticalOverrides,
    );
  });

  it('combines read-only common Buffs with operator-owned Buffs without a skill level', () => {
    const operator = {
      ...perlica,
      buffDefinitions: {
        buff_chr_fixture_owned: { stackingType: 'refresh' as const },
      },
    };
    const compiled = compileScenarioTimeline(createScenario(), {
      actionPrograms: new ActionGraphDefinitionRepository(),
      getOperator: slug => (slug === operator.slug ? operator : null),
      getCommonDefinitionSources: () => [
        {
          id: 'common',
          buffDefinitions: { buff_common_fixture: { stackingType: 'unlimited' } },
        },
      ],
    });

    expect(compiled.operators[0]?.buffDefinitions).toEqual({
      buff_common_fixture: { stackingType: 'unlimited' },
      buff_chr_fixture_owned: { stackingType: 'refresh' },
    });
  });

  it('compiles ability entity additions and overrides from a project operator template', () => {
    const scenario = place(createScenario(), 'battleSkill', 0);
    scenario.tracks[0]!.skillCasts[0]!.customDefinition = {
      key: 'chr_0004_pelica_normal_skill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      timelineBlockFrames: 1,
      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'spawn-generated' } }],
      actionGraph: {
        main: {
          nodes: {
            'spawn-generated': {
              action: {
                kind: 'spawnAbilityEntity',
                parameters: { abilityEntityId: 'generated', dieWhenSourceDies: false },
              },
              next: 'spawn-custom',
            },
            'spawn-custom': {
              action: {
                kind: 'spawnAbilityEntity',
                parameters: { abilityEntityId: 'custom', dieWhenSourceDies: false },
              },
              next: null,
            },
          },
        },
        macros: {},
      },
    };
    const operator = {
      ...perlica,
      abilityEntityDefinitions: {
        generated: {
          lifetime: { kind: 'limited' as const, durationSeconds: 3 },
        },
        custom: {
          lifetime: { kind: 'infinite' as const },
        },
      },
    };

    const compiled = compileScenarioTimeline(scenario, {
      actionPrograms: new ActionGraphDefinitionRepository(),
      getOperator: slug => (slug === operator.slug ? operator : null),
      getCommonDefinitionSources: () => [],
    });

    expect(compiled.operators[0]?.skillCasts?.[0]?.program.abilityEntityDefinitions).toEqual({
      generated: { lifetime: { kind: 'limited', durationSeconds: 3 } },
      custom: { lifetime: { kind: 'infinite' } },
    });
  });

  it('compiles the complete operator skill index and placed input', () => {
    const scenario = place(createScenario(), 'battleSkill', 60);

    const compiled = compileScenarioTimeline(scenario, index());

    expect(compiled.operators).toHaveLength(1);
    expect(compiled.operators[0]!.operatorId).toBe('track:0');
    expect(compiled.operators[0]!.skills).toEqual([]);
    expect(compiled.operators[0]!.skillCasts?.map(binding => binding.program.skillId)).toContain(
      'chr_0004_pelica_normal_skill',
    );
    expect(compiled.inputs).toEqual([
      {
        frame: 60,
        operatorId: 'track:0',
        skillId: 'chr_0004_pelica_normal_skill',
        castId: 'skillCast:1',
        action: 'battleSkill',
      },
    ]);
  });

  it('does not compile a hidden replacement until that concrete skill is placed', () => {
    const baseScenario = place(createScenario(), 'battleSkill', 60);
    const base = requireSingleSkill('battleSkill');
    const operator = {
      ...perlica,
      skillSlots: perlica.skillSlots?.map(slot =>
        slot.key === 'battleSkill'
          ? { ...slot, replacementSkillKeys: ['battleSkillVariant'] }
          : slot,
      ),
      skillGroups: perlica.skillGroups.map(group =>
        group.key === 'battleSkill'
          ? { ...group, replacementSkills: [{ ...base, key: 'battleSkillVariant' }] }
          : group,
      ),
    };

    const compiled = compileScenarioTimeline(baseScenario, {
      actionPrograms: new ActionGraphDefinitionRepository(),
      getOperator: slug => (slug === operator.slug ? operator : null),
      getCommonDefinitionSources: () => [],
    });

    expect(compiled.inputs).toEqual([
      {
        frame: 60,
        operatorId: 'track:0',
        skillId: 'chr_0004_pelica_normal_skill',
        castId: 'skillCast:1',
        action: 'battleSkill',
      },
    ]);
    expect(
      compiled.operators[0]!.skillCasts?.map(binding => [binding.program.skillId, binding.castId]),
    ).toEqual([['chr_0004_pelica_normal_skill', 'skillCast:1']]);
    expect(compiled.operators[0]!.skillSlotGroups).toContainEqual(
      expect.objectContaining({
        skillGroupKey: 'battleSkill',
        baseSkillKey: 'chr_0004_pelica_normal_skill',
        replacementSkillKeys: ['battleSkillVariant'],
      }),
    );

    const explicit = placeSkillGroup({
      scenario: baseScenario,
      trackIndex: 0,
      operator,
      skillGroupKey: 'battleSkill',
      skillKey: 'battleSkillVariant',
      startFrame: 90,
      ids: { allocate: kind => `${kind}:replacement` },
    }).scenario;
    const explicitCompiled = compileScenarioTimeline(explicit, {
      actionPrograms: new ActionGraphDefinitionRepository(),
      getOperator: slug => (slug === operator.slug ? operator : null),
      getCommonDefinitionSources: () => [],
    });
    expect(explicitCompiled.inputs).toContainEqual({
      frame: 90,
      operatorId: 'track:0',
      skillId: 'battleSkillVariant',
      castId: 'skillCast:replacement',
      action: 'battleSkill',
    });
    expect(explicitCompiled.operators[0]!.skillCasts).toContainEqual(
      expect.objectContaining({
        castId: 'skillCast:replacement',
        program: expect.objectContaining({ skillId: 'battleSkillVariant' }),
      }),
    );
  });

  it('does not let multiple library placements redefine an explicit runtime slot', () => {
    const scenario = place(createScenario(), 'battleSkill', 60);
    const base = requireSingleSkill('battleSkill');
    const comboInput = { ...base, key: 'battleSkillCombo' };
    const operator = {
      ...perlica,
      skillSlots: perlica.skillSlots?.map(slot =>
        slot.key === 'battleSkill' ? { ...slot, replacementSkillKeys: ['battleSkillEnd'] } : slot,
      ),
      skillGroups: perlica.skillGroups.map(group =>
        group.key === 'battleSkill'
          ? {
              ...group,
              skills: [base, comboInput],
              replacementSkills: [{ ...base, key: 'battleSkillEnd' }],
            }
          : group,
      ),
    };

    const compiled = compileScenarioTimeline(scenario, {
      actionPrograms: new ActionGraphDefinitionRepository(),
      getOperator: slug => (slug === operator.slug ? operator : null),
      getCommonDefinitionSources: () => [],
    });

    expect(compiled.operators[0]!.skillSlotGroups).toContainEqual(
      expect.objectContaining({
        skillGroupKey: 'battleSkill',
        baseSkillKey: 'chr_0004_pelica_normal_skill',
        replacementSkillKeys: ['battleSkillEnd'],
      }),
    );
  });

  it('does not infer native default input slots from library presentation groups', () => {
    const scenario = createScenario();
    const basicGroup = perlica.skillGroups.find(group => group.skillType === 'basicAttack')!;
    const baseSkill = Array.isArray(basicGroup.skills) ? basicGroup.skills[0]! : basicGroup.skills;
    const operator = {
      ...perlica,
      skillGroups: [
        ...perlica.skillGroups,
        {
          key: 'enhancedBasicAttack',
          skillType: 'basicAttack' as const,
          levelSource: 'ultimate' as const,
          libraryNameQualifier: 'enhanced' as const,
          skills: [{ ...baseSkill, key: 'enhancedBasicAttack1' }],
        },
      ],
    };

    const compiled = compileScenarioTimeline(scenario, {
      actionPrograms: new ActionGraphDefinitionRepository(),
      getOperator: slug => (slug === operator.slug ? operator : null),
      getCommonDefinitionSources: () => [],
    });

    expect(compiled.operators[0]!.skillSlotGroups!.filter(group => group.defaultForInput)).toEqual(
      [],
    );
    expect(compiled.operators[0]!.skillSlotGroups).not.toContainEqual(
      expect.objectContaining({ skillGroupKey: 'enhancedBasicAttack' }),
    );
  });

  it('compiles a routed replacement with its execution type and level while keeping the slot identity', () => {
    const scenario = place(createScenario(), 'battleSkill', 60);
    scenario.tracks[0]!.operator!.skillLevels.battleSkill = 3;
    scenario.tracks[0]!.operator!.skillLevels.comboSkill = 7;
    const routed: SkillDefinition = {
      key: 'battleSkillRoutedToCombo',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      timelineBlockFrames: 1,
      costs: [{ resource: 'sp', value: [10, 20, 30, 40, 50, 60, 70] }],
      costFrame: 0,
      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'deal' } }],
      actionGraph: {
        main: {
          nodes: {
            deal: {
              action: {
                kind: 'dealDamage',
                parameters: {
                  damageType: 'physical',
                  attackScale: [1, 2, 3, 4, 5, 6, 7],
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
    const operator = {
      ...perlica,
      skillSlots: perlica.skillSlots?.map(slot =>
        slot.key === 'battleSkill'
          ? { ...slot, replacementSkillKeys: ['battleSkillRoutedToCombo'] }
          : slot,
      ),
      skillGroups: perlica.skillGroups.map(group =>
        group.key === 'battleSkill'
          ? {
              ...group,
              routedReplacementSkills: [
                {
                  skill: routed,
                  // 路由包装元数据即便滞后，也不能覆盖单个技能自己的战斗类型与等级来源。
                  skillType: 'battleSkill' as const,
                  levelSource: 'battleSkill' as const,
                  executionSkillGroupKey: 'comboSkill',
                  executionSkillKey: 'comboSkill',
                },
              ],
            }
          : group,
      ),
    };

    const explicit = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator,
      skillGroupKey: 'battleSkill',
      skillKey: routed.key,
      startFrame: 90,
      ids: { allocate: kind => `${kind}:routed` },
    }).scenario;
    const compiled = compileScenarioTimeline(explicit, {
      actionPrograms: new ActionGraphDefinitionRepository(),
      getOperator: slug => (slug === operator.slug ? operator : null),
      getCommonDefinitionSources: () => [],
    });
    const variant = compiled.operators[0]!.skillCasts!.find(
      binding => binding.program.skillId === 'battleSkillRoutedToCombo',
    )!.program;

    expect(variant).toMatchObject({
      skillGroupKey: 'battleSkill',
      skillType: 'comboSkill',
      costs: [{ resource: 'sp', value: 70 }],
      executionSkillGroupKey: 'comboSkill',
      executionSkillId: 'comboSkill',
    });
    expect(rootActionSteps(variant.timelineActions[0]!.sequence)[0]).toMatchObject({
      kind: 'dealDamage',
      parameters: { attackScale: 7 },
    });
    expect(compiled.operators[0]!.skillSlotGroups).toContainEqual(
      expect.objectContaining({
        skillGroupKey: 'battleSkill',
        baseSkillKey: 'chr_0004_pelica_normal_skill',
        replacementSkillKeys: ['battleSkillRoutedToCombo'],
      }),
    );
  });

  it('preserves the declaration order of same-frame inputs', () => {
    let scenario = place(createScenario(), 'battleSkill', 60);
    scenario = place(scenario, 'ultimate', 60);

    expect(compileScenarioTimeline(scenario, index()).inputs).toEqual([
      {
        frame: 60,
        operatorId: 'track:0',
        skillId: 'chr_0004_pelica_normal_skill',
        castId: 'skillCast:1',
        action: 'battleSkill',
      },
      {
        frame: 60,
        operatorId: 'track:0',
        skillId: 'chr_0004_pelica_ultimate_skill',
        castId: 'skillCast:2',
        action: 'ultimate',
      },
    ]);
  });

  it('compiles a basic-attack placement as four ordered inputs', () => {
    const scenario = place(createScenario(), 'basicAttack', 30);
    const casts = scenario.tracks[0]!.skillCasts;

    expect(compileScenarioTimeline(scenario, index()).inputs).toEqual(
      casts.map(cast => ({
        frame: cast.placement.startFrame,
        operatorId: 'track:0',
        skillId: cast.source.kind === 'operatorSkill' ? cast.source.skillKey : '',
        castId: cast.id,
        action: 'basicAttack',
      })),
    );
  });

  it('omits explicitly disabled casts', () => {
    const scenario = place(createScenario(), 'battleSkill', 60);
    scenario.tracks[0]!.skillCasts[0]!.presentation = { disabled: true };

    expect(compileScenarioTimeline(scenario, index()).inputs).toEqual([]);
  });

  it.each(['none', 'head', 'middle', 'all'] as const)(
    '连续组跳过 %s 禁用成员，始终保留原头锚点',
    disabled => {
      const scenario = place(createScenario(), 'basicAttack', -12);
      const casts = scenario.tracks[0]!.skillCasts;
      for (let i = 1; i < casts.length; i += 1)
        casts[i]!.placement = { afterCastId: casts[i - 1]!.id };
      for (const [i, cast] of casts.entries()) {
        if (
          disabled === 'all' ||
          (disabled === 'head' && i === 0) ||
          (disabled === 'middle' && i === 1)
        )
          cast.presentation = { disabled: true };
      }
      const before = structuredClone(scenario);
      const compiled = compileScenarioTimeline(scenario, index());
      const enabled = casts.filter(cast => !cast.presentation?.disabled);
      expect(compiled.inputs.map(input => input.castId)).toEqual(enabled.map(cast => cast.id));
      expect(compiled.inputs.every(input => input.frame === -12)).toBe(true);
      expect(compiled.skillInputGroups).toEqual(
        enabled.length === 0
          ? undefined
          : [
              {
                anchorCastId: casts[0]!.id,
                castIds: enabled.map(cast => cast.id),
              },
            ],
      );
      expect((compiled.operators[0]!.skillCasts ?? []).map(binding => binding.castId)).toEqual(
        enabled.map(cast => cast.id),
      );
      expect(scenario).toEqual(before);
    },
  );

  it('连续组即使声明顺序不同于引用顺序，也按引用衔接并保留同帧声明序号', () => {
    const scenario = place(createScenario(), 'basicAttack', 30);
    const [first, second, third, fourth] = scenario.tracks[0]!.skillCasts;
    second!.placement = { afterCastId: first!.id };
    third!.placement = { afterCastId: second!.id };
    fourth!.placement = { startFrame: 100 };
    scenario.tracks[0]!.skillCasts = [third!, first!, fourth!, second!];
    const compiled = compileScenarioTimeline(scenario, index());
    expect(compiled.skillInputGroups).toEqual([
      { anchorCastId: first!.id, castIds: [first!.id, second!.id, third!.id] },
    ]);
    expect(
      compiled.inputs.map(input => [input.castId, input.frame, input.declarationOrder]),
    ).toEqual([
      [third!.id, 30, 0],
      [first!.id, 30, 1],
      [second!.id, 30, 3],
      [fourth!.id, 100, 2],
    ]);
  });

  it('compiles an active ultimate-cost potential into the runtime program', () => {
    const scenario = createScenario();
    scenario.tracks[0]!.operator!.potential = 1;
    const operator = {
      ...perlica,
      potentials: [
        {
          levels: 1,
          modifiers: [
            {
              kind: 'multiplySkillCost' as const,
              skillGroupKey: 'ultimate',
              resource: 'ultimateEnergy' as const,
              multiplier: 0.85,
            },
          ],
        },
      ],
    };

    const compiled = compileScenarioTimeline(place(scenario, 'ultimate', 60), {
      actionPrograms: new ActionGraphDefinitionRepository(),
      getOperator: slug => (slug === operator.slug ? operator : null),
      getCommonDefinitionSources: () => [],
    });
    const ultimate = compiled.operators[0]!.skillCasts?.find(
      binding => binding.program.skillId === 'chr_0004_pelica_ultimate_skill',
    )?.program;

    expect(ultimate?.costs).toEqual([{ resource: 'ultimateEnergy', value: 68 }]);
  });

  it('compiles a complete custom definition with the current skill level', () => {
    const scenario = place(createScenario(), 'battleSkill', 60);
    const cast = scenario.tracks[0]!.skillCasts[0]!;
    const template = requireSingleSkill('battleSkill');
    cast.customDefinition = {
      ...structuredClone(template),
      timelineBlockFrames: 99,
      costs: [
        {
          resource: 'sp',
          value: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 123],
        },
      ],
    };

    const compiled = compileScenarioTimeline(scenario, index());
    const binding = compiled.operators[0]!.skillCasts![0]!;
    const program = binding.program;

    expect(binding.castId).toBe(cast.id);
    expect(program.skillId).toBe('chr_0004_pelica_normal_skill');
    expect(program.timelineBlockFrames).toBe(99);
    expect(program.costs).toEqual([{ resource: 'sp', value: 123 }]);
  });

  it('keeps local step keys through root and child sequences without binding cast hit IDs', () => {
    const scenario = place(createScenario(), 'battleSkill', 60);
    const cast = scenario.tracks[0]!.skillCasts[0]!;
    cast.customDefinition = {
      key: 'chr_0004_pelica_normal_skill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      timelineBlockFrames: 30,
      scheduledSequences: [{ startFrame: 5, sequence: { $sequence: 'root-hit' } }],
      actionGraph: {
        main: {
          nodes: {
            'root-hit': {
              action: {
                key: 'root-hit',
                kind: 'dealDamage',
                parameters: { damageType: 'physical', attackScale: 1, tags: [] },
              },
              next: 'spawn',
            },
            spawn: {
              action: {
                kind: 'spawnAbilityEntity',
                parameters: {
                  abilityEntityId: 'ability:test',
                  dieWhenSourceDies: false,
                  inheritActionBlackboard: true,
                  definition: {
                    lifetime: { kind: 'limited', durationSeconds: 1 },
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
                      scheduledSequences: [{ startFrame: 3, sequence: { $sequence: 'child-hit' } }],
                      actionGraph: {
                        main: {
                          nodes: {
                            'child-hit': {
                              action: {
                                key: 'child-hit',
                                kind: 'dealFixedDamage',
                                parameters: { damageType: 'physical', value: 1, tags: [] },
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
              next: null,
            },
          },
        },
        macros: {},
      },
    };

    const program = compileScenarioTimeline(scenario, index()).operators[0]!.skillCasts![0]!
      .program;
    const root = rootActionSteps(program.timelineActions[0]!.sequence)[0]!;
    const spawn = rootActionSteps(program.timelineActions[0]!.sequence)[1]!;
    expect(root.key).toBe('root-hit');
    expect(root.hitId).toBeUndefined();
    expect(spawn.kind).toBe('spawnAbilityEntity');
    if (spawn.kind !== 'spawnAbilityEntity') throw new Error('expected spawn step');
    expect(
      rootActionSteps(spawn.parameters.definition!.childSkill?.timelineActions[0]?.sequence!)[0]
        ?.hitId,
    ).toBeUndefined();
  });

  it('applies active operator upgrades after compiling a custom definition', () => {
    const scenario = place(createScenario(), 'ultimate', 60);
    scenario.tracks[0]!.operator!.potential = 1;
    const cast = scenario.tracks[0]!.skillCasts[0]!;
    const template = requireSingleSkill('ultimate');
    cast.customDefinition = {
      ...structuredClone(template),
      costs: [{ resource: 'ultimateEnergy', value: 100 }],
    };
    const operator = {
      ...perlica,
      potentials: [
        {
          levels: 1,
          modifiers: [
            {
              kind: 'multiplySkillCost' as const,
              skillGroupKey: 'ultimate',
              resource: 'ultimateEnergy' as const,
              multiplier: 0.85,
            },
          ],
        },
      ],
    };

    const compiled = compileScenarioTimeline(scenario, {
      actionPrograms: new ActionGraphDefinitionRepository(),
      getOperator: slug => (slug === operator.slug ? operator : null),
      getCommonDefinitionSources: () => [],
    });

    expect(compiled.operators[0]!.skillCasts![0]!.program.costs).toEqual([
      { resource: 'ultimateEnergy', value: 85 },
    ]);
  });

  it('rejects a dangling skill identity', () => {
    const scenario = place(createScenario(), 'battleSkill', 60);
    const cast = scenario.tracks[0]!.skillCasts[0]!;
    if (cast.source.kind !== 'operatorSkill') throw new Error('unexpected fixture source');
    cast.source.skillKey = 'missing';

    expect(() => compileScenarioTimeline(scenario, index())).toThrow("has no skill 'missing'");
  });
});

it('compiles the complete graph operator skill catalog through the formal entry', () => {
  const build = createScenario().tracks[0]!.operator!;
  const compiled = compileOperatorDefinitionSkills(
    'track:graph',
    build,
    perlica,
    undefined,
    undefined,
    new ActionGraphDefinitionRepository(),
  );
  const entries = compiled.flatMap(program =>
    program.timelineActions.map(action => {
      if ('steps' in action.sequence) throw new Error('unexpected tree program');
      return action.sequence;
    }),
  );
  expect(entries.length).toBeGreaterThan(0);
  expect(compiled.map(program => program.skillId)).toContain('chr_0004_pelica_normal_skill');
  expect(entries.every(entry => entry.graph.skillLevel === 12)).toBe(true);
});

it('场景中的技能、Buff 和实体各自编译自己的图', () => {
  const scenario = place(createScenario(), 'battleSkill', 30);
  const sourceSkill = requireSingleSkill('battleSkill');
  const independentSkill: SkillDefinition = {
    ...sourceSkill,
    scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'spawnLocal' } }],
    actionGraph: {
      main: {
        nodes: {
          spawnLocal: {
            action: {
              kind: 'spawnAbilityEntity' as const,
              parameters: { abilityEntityId: 'localChild', dieWhenSourceDies: false },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  };
  const graphOperator: OperatorDefinition = {
    ...perlica,
    abilityEntityDefinitions: {
      ...perlica.abilityEntityDefinitions,
      localChild: {
        lifetime: { kind: 'infinite' as const },
        childSkill: {
          nativeSkillType: 'normalSkill' as const,
          naturalDurationFrames: 30,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
          },
          skillId: 'local-child',
          scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'localEntityAction' } }],
          actionGraph: {
            main: {
              nodes: {
                localEntityAction: {
                  action: { kind: 'dealStagger' as const, parameters: { value: 2 } },
                  next: null,
                },
              },
            },
            macros: {},
          },
        },
      },
    },
    buffDefinitions: {
      ...perlica.buffDefinitions,
      localBuff: {
        stackingType: 'unlimited' as const,
        lifecycleSequences: { start: { $sequence: 'buffEntry' } },
        actionGraph: {
          main: {
            nodes: {
              buffEntry: {
                action: { kind: 'dealStagger' as const, parameters: { value: 3 } },
                next: null,
              },
            },
          },
          macros: {},
        },
      },
    },
    skillGroups: perlica.skillGroups.map(group =>
      group.key === 'battleSkill' ? { ...group, skills: independentSkill } : group,
    ),
  };
  const compiled = compileScenarioTimeline(scenario, {
    actionPrograms: new ActionGraphDefinitionRepository(),
    getOperator: slug => (slug === perlica.slug ? graphOperator : null),
    getCommonDefinitionSources: () => [],
  });
  const cast = compiled.operators[0]!.skillCasts![0]!.program;
  expect(cast.skillId).toBe(sourceSkill.key);
  expect(cast.timelineActions.length).toBeGreaterThan(0);
  const sequence = cast.timelineActions[0]!.sequence;
  if ('steps' in sequence) throw new Error('expected compiled graph entry');
  expect([...sequence.graph.nodes.keys()].some(id => id.startsWith('[null,'))).toBe(true);
  const localChild = sequence.graph.abilityEntityDefinitions.localChild;
  const childEntry = localChild?.childSkill?.timelineActions[0]?.sequence;
  expect(childEntry?.entry).toBe('[null,"localEntityAction"]');
  expect(childEntry?.graph).not.toBe(sequence.graph);
  const buffStart = compiled.operators[0]!.buffDefinitions!.localBuff!.lifecycleSequences!.start!;
  if ('steps' in buffStart) throw new Error('expected compiled graph entry');
  expect(buffStart.graph.nodes.get(buffStart.entry!)!.action).toMatchObject({
    parameters: { value: 3 },
  });
});

it('不含过渡总图的干员能分别编译主动技能与常驻被动', () => {
  const scenario = place(createScenario(), 'battleSkill', 30);
  scenario.tracks[0]!.operator!.talentStates = { 0: 2 };
  const skill = requireSingleSkill('battleSkill');
  const battleGroup = perlica.skillGroups.find(group => group.key === 'battleSkill')!;
  const independentPassive: OperatorPassiveSkillDefinition = {
    key: 'native-passive',
    enableSequence: { $sequence: 'entry' },
    actionGraph: {
      main: {
        nodes: {
          entry: { action: { kind: 'dealStagger', parameters: { value: 7 } }, next: null },
        },
      },
      macros: {},
    },
  };
  const graphlessOperator: OperatorDefinition = {
    ...perlica,
    skillGroups: [{ ...battleGroup, skills: skill }],
    buffDefinitions: {},
    abilityEntityDefinitions: {},
    comboSkillConditions: [],
    passiveSkills: [independentPassive],
    eventHandlers: [],
    talents: [
      {
        levels: 2,
        attachedBuffs: [{ buffId: 'native-buff', blackboardAssignments: { power: [3, 7] } }],
      },
    ],
    potentials: [],
    dodgeSkill: undefined,
    entityBlackboardInitializers: [],
    skillSlots: perlica.skillSlots!.filter(slot => slot.key === 'battleSkill'),
  };
  const compiled = compileScenarioTimeline(scenario, {
    actionPrograms: new ActionGraphDefinitionRepository(),
    getOperator: slug => (slug === perlica.slug ? graphlessOperator : null),
    getCommonDefinitionSources: () => [],
  });
  const entry = compiled.operators[0]!.skillCasts![0]!.program.timelineActions[0]!.sequence;
  expect('steps' in entry).toBe(false);
  if ('steps' in entry) return;
  expect(entry.graph.nodes.size).toBeGreaterThan(0);
  const passive = compiled.operators[0]!.passivePrograms![0]!.enableSequence;
  expect('steps' in passive).toBe(false);
  if ('steps' in passive) return;
  expect(passive.graph).not.toBe(entry.graph);
  expect(passive.graph.nodes.get(passive.entry!)!.action).toMatchObject({
    parameters: { value: 7 },
  });
  expect(
    rootActionSteps(compiled.operators[0]!.initializationPrograms![0]!.sequence),
  ).toMatchObject([
    {
      kind: 'applyBuff',
      parameters: { buffId: 'native-buff', blackboardAssignments: { power: { value: 7 } } },
    },
  ]);
});

it('binds graph timeline casts and custom overrides without losing cast or input identity', () => {
  const scenario = place(createScenario(), 'battleSkill', 30);
  const track = scenario.tracks[0]!;
  const source = track.skillCasts[0]!;
  const customSkill: SkillDefinition = {
    ...requireSingleSkill('battleSkill'),
    blackboard: { custom_marker: 42 },
  };
  const casts = [
    source,
    { ...source, id: 'custom-cast', customDefinition: customSkill },
    { ...source, id: 'disabled-cast', presentation: { disabled: true } },
  ];
  const programs = compileOperatorSkillCastPrograms(
    track.id,
    casts,
    track.operator!,
    perlica,
    undefined,
    undefined,
    new ActionGraphDefinitionRepository(),
  );
  expect(programs.map(binding => binding.castId)).toEqual([source.id, 'custom-cast']);
  expect(programs[1]!.program.initialBlackboard.custom_marker).toBe(42);
  expect(compileSkillCastPlayerInput(track.id, casts[0]!, perlica, 30)).toMatchObject({
    frame: 30,
    castId: source.id,
  });
  for (const binding of programs)
    for (const action of binding.program.timelineActions)
      expect('steps' in action.sequence).toBe(false);
});

it('compiles a graph-backed complete scenario through the normal timeline entry', () => {
  const scenario = place(createScenario(), 'battleSkill', 30);
  const compiled = compileScenarioTimeline(scenario, index());
  expect(compiled.inputs).toEqual([
    {
      frame: 30,
      operatorId: 'track:0',
      skillId: 'chr_0004_pelica_normal_skill',
      castId: 'skillCast:1',
      action: 'battleSkill',
    },
  ]);
  expect(compiled.operators.map(operator => operator.operatorId)).toEqual(['track:0']);
  const casts = compiled.operators[0]!.skillCasts ?? [];
  expect(casts.length).toBeGreaterThan(0);
  for (const cast of casts)
    for (const action of cast.program.timelineActions)
      expect('steps' in action.sequence).toBe(false);
});

it('keeps common ability entity child programs in their own graph across ID collisions', () => {
  const scenario = place(createScenario(), 'battleSkill', 30);
  const skill = requireSingleSkill('battleSkill');
  const graphOperator: OperatorDefinition = {
    ...perlica,
    skillGroups: perlica.skillGroups.map(group =>
      group.key === 'battleSkill'
        ? {
            ...group,
            skills: {
              ...skill,
              scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'shared-id' } }],
              actionGraph: {
                main: {
                  nodes: {
                    'shared-id': {
                      action: {
                        kind: 'spawnAbilityEntity' as const,
                        parameters: { abilityEntityId: 'external', dieWhenSourceDies: false },
                      },
                      next: null,
                    },
                  },
                },
                macros: {},
              },
            },
          }
        : group,
    ),
  };
  const externalEntity: Record<string, AbilityEntityDefinition> = {
    external: {
      lifetime: { kind: 'infinite' as const },
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
        scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'shared-id' } }],
        actionGraph: {
          main: {
            nodes: {
              'shared-id': {
                action: { kind: 'dealStagger' as const, parameters: { value: 7 } },
                next: null,
              },
            },
          },
          macros: {},
        },
      },
    },
  };
  const compiled = compileScenarioTimeline(scenario, {
    actionPrograms: new ActionGraphDefinitionRepository(),
    getOperator: slug => (slug === perlica.slug ? graphOperator : null),
    getCommonAbilityEntityDefinitions: () => externalEntity,
    getCommonDefinitionSources: () => [
      {
        id: 'entities',
        abilityEntityDefinitions: externalEntity,
      },
      {
        id: 'buffs',
        buffDefinitions: {
          separate: {
            stackingType: 'unlimited',
            lifecycleSequences: { start: { $sequence: 'shared-id' } },
            actionGraph: {
              main: {
                nodes: {
                  'shared-id': {
                    action: { kind: 'dealStagger' as const, parameters: { value: 9 } },
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
  const cast = compiled.operators[0]!.skillCasts![0]!;
  const entry = cast.program.timelineActions[0]!.sequence;
  if ('steps' in entry) throw new Error('unexpected tree');
  const child =
    entry.graph.abilityEntityDefinitions.external!.childSkill!.timelineActions[0]!.sequence;
  expect(child.graph).not.toBe(entry.graph);
  expect(child.graph.nodes.get(child.entry!)!.action).toMatchObject({ parameters: { value: 7 } });
  expect(entry.graph.nodes.get(entry.entry!)!.action.kind).toBe('spawnAbilityEntity');
  const buffEntry = compiled.operators[0]!.buffDefinitions!.separate!.lifecycleSequences!.start!;
  if ('steps' in buffEntry) throw new Error('unexpected tree');
  expect(buffEntry.graph).not.toBe(child.graph);
  expect(buffEntry.graph.nodes.get(buffEntry.entry!)!.action).toMatchObject({
    parameters: { value: 9 },
  });
});

it('compiles the same graph scene from the resolved build used by runtime assembly', () => {
  const scenario = place(createScenario(), 'battleSkill', 30);
  const programs = new ActionGraphDefinitionRepository();
  const graphIndex = {
    getOperator: (slug: string) => (slug === perlica.slug ? perlica : null),
    getWeapon: (_slug: string) => null,
    getGear: (_slug: string) => null,
    getGearSet: (_slug: string) => null,
    actionPrograms: programs,
    getCommonDefinitionSources: () => [],
  };
  const builds = resolveScenarioBuilds(scenario, graphIndex);
  const resolved = compileResolvedScenarioTimeline(builds, undefined, {
    programs,
    commonDefinitionSources: graphIndex.getCommonDefinitionSources(),
  });
  const direct = compileScenarioTimeline(scenario, graphIndex);
  expect(resolved.inputs).toEqual(direct.inputs);
  expect(resolved.operators[0]!.skillCasts?.map(binding => binding.castId)).toEqual(
    direct.operators[0]!.skillCasts?.map(binding => binding.castId),
  );
  expect(resolved.operators[0]!.skillCasts![0]!.program.timelineActions.length).toBeGreaterThan(0);
});
