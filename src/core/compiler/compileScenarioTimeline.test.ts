import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../project/createProject';
import type { ScenarioDocument } from '../project/schema';
import { perlica } from '../../data/operators/perlica.generated';
import { placeSkillGroup } from '../../ui/timeline/interaction/placeSkillGroup';
import { compileScenarioTimeline } from './compileScenarioTimeline';
import type { SkillDefinition } from '../game-data/operatorDefinition';

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
  return { getOperator: (slug: string) => (slug === perlica.slug ? perlica : null) };
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
  if (group === undefined || Array.isArray(group.skills)) {
    throw new Error(`expected single-skill group '${skillGroupKey}'`);
  }
  return group.skills as SkillDefinition;
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
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'switch',
                parameters: { choice: { kind: 'constant', value: 0 }, alwaysNext: true },
                options: [0, 1].map(value => ({
                  value: { kind: 'constant', value },
                  sequence: {
                    steps: [
                      {
                        kind: 'dealDamage',
                        key: `case${value}`,
                        parameters: { damageType: 'physical', attackScale: 1, tags: [] },
                      },
                    ],
                  },
                })),
              },
            ],
          },
        },
      ],
    };
    const program = compileScenarioTimeline(scenario, index()).operators[0]!.skillCasts!.find(
      binding => binding.castId === cast.id,
    )!.program;
    const step = program.timelineActions[0]!.sequence.steps[0]!;
    if (step.kind !== 'switch') throw new Error('expected switch');
    expect(step.options.map(option => option.sequence.steps[0]!.key)).toEqual(['case0', 'case1']);
    expect(step.options.map(option => option.sequence.steps[0]!.hitId)).toEqual([
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
      getOperator: slug => (slug === operator.slug ? operator : null),
      getCommonBuffDefinitions: () => ({
        buff_common_fixture: { stackingType: 'unlimited' },
      }),
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
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'spawnAbilityEntity',
                parameters: { abilityEntityId: 'generated', dieWhenSourceDies: false },
              },
              {
                kind: 'spawnAbilityEntity',
                parameters: { abilityEntityId: 'custom', dieWhenSourceDies: false },
              },
            ],
          },
        },
      ],
    };
    const operator = {
      ...perlica,
      abilityEntityDefinitions: {
        generated: { lifetime: { kind: 'limited' as const, durationSeconds: 3 } },
        custom: { lifetime: { kind: 'infinite' as const } },
      },
    };

    const compiled = compileScenarioTimeline(scenario, {
      getOperator: slug => (slug === operator.slug ? operator : null),
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
      getOperator: slug => (slug === operator.slug ? operator : null),
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
      getOperator: slug => (slug === operator.slug ? operator : null),
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
      getOperator: slug => (slug === operator.slug ? operator : null),
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
      getOperator: slug => (slug === operator.slug ? operator : null),
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
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'dealDamage',
                parameters: {
                  damageType: 'physical',
                  attackScale: [1, 2, 3, 4, 5, 6, 7],
                  tags: [],
                },
              },
            ],
          },
        },
      ],
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
      getOperator: slug => (slug === operator.slug ? operator : null),
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
    expect(variant.timelineActions[0]!.sequence.steps[0]).toMatchObject({
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
      getOperator: slug => (slug === operator.slug ? operator : null),
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
      scheduledSequences: [
        {
          startFrame: 5,
          sequence: {
            steps: [
              {
                key: 'root-hit',
                kind: 'dealDamage',
                parameters: { damageType: 'physical', attackScale: 1, tags: [] },
              },
              {
                kind: 'spawnAbilityEntity',
                parameters: {
                  abilityEntityId: 'ability:test',
                  dieWhenSourceDies: false,
                  inheritActionBlackboard: true,
                  definition: {
                    lifetime: { kind: 'limited', durationSeconds: 1 },
                    childSkill: {
                      skillId: 'child',
                      scheduledSequences: [
                        {
                          startFrame: 3,
                          sequence: {
                            steps: [
                              {
                                key: 'child-hit',
                                kind: 'dealFixedDamage',
                                parameters: { damageType: 'physical', value: 1, tags: [] },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    };

    const program = compileScenarioTimeline(scenario, index()).operators[0]!.skillCasts![0]!
      .program;
    const root = program.timelineActions[0]!.sequence.steps[0]!;
    const spawn = program.timelineActions[0]!.sequence.steps[1]!;
    expect(root.key).toBe('root-hit');
    expect(root.hitId).toBeUndefined();
    expect(spawn.kind).toBe('spawnAbilityEntity');
    if (spawn.kind !== 'spawnAbilityEntity') throw new Error('expected spawn step');
    expect(
      spawn.parameters.definition!.childSkill?.timelineActions[0]?.sequence.steps[0]?.hitId,
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
      getOperator: slug => (slug === operator.slug ? operator : null),
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
