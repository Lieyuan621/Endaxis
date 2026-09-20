import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import {
  avywenna,
  laevatain,
  mifu,
  perlica,
  zhuangFangyi,
  yvonne,
} from '../../../data/operators/index';
import {
  groupPlacedSkillSequence,
  placeSkillGroup,
  placeLibrarySkillGroup,
  type TimelineDocumentIdAllocator,
} from './placeSkillGroup';
import { listSkillGroupLibraryPlacements } from '../../../application/editor/skillGroupPlacement';

function createIds(): TimelineDocumentIdAllocator {
  let next = 0;
  return { allocate: kind => `${kind}:${++next}` };
}

function createPerlicaScenario() {
  const scenario = createEmptyScenario('scenario:1', '佩丽卡样板');

  scenario.tracks[0] = {
    id: 'track:0',
    operator: {
      operatorSlug: 'perlica',
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

describe('placeSkillGroup', () => {
  it('普通干员技能组也通过元数据启用递归策略，不依赖干员或技能名字', () => {
    const operator = structuredClone(perlica);
    const group = operator.skillGroups.find(group => group.key === 'basicAttack')!;
    group.placementPolicy = {
      kind: 'recursiveInput',
      firstSkillKey: 'chr_0004_pelica_attack1',
      terminalSkillKey: 'chr_0004_pelica_attack4',
      maxSegments: 8,
      fallback: 'sequence',
    };
    const placed = placeLibrarySkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator,
      skillGroupKey: 'basicAttack',
      startFrame: 30,
      ids: createIds(),
    });
    expect(placed.skillCastIds).toHaveLength(1);
    expect(placed.extension?.reservedCastIds).toHaveLength(7);
    expect(placed.extension?.terminalSkillKey).toBe('chr_0004_pelica_attack4');
    expect(placed.fallback?.skillCastIds).toHaveLength(4);
    delete group.placementPolicy;
    const ordinary = placeLibrarySkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator,
      skillGroupKey: 'basicAttack',
      startFrame: 30,
      ids: createIds(),
    });
    expect(ordinary.extension).toBeUndefined();
    expect(ordinary.skillCastIds).toHaveLength(4);
  });
  it('伊冯卡片仍展示六段，整组只播种A1，单段重击不递归', () => {
    const scenario = createPerlicaScenario();
    scenario.tracks[0]!.operator!.operatorSlug = yvonne.slug;
    const input = {
      scenario,
      trackIndex: 0 as const,
      operator: yvonne,
      skillGroupKey: 'basicAttack',
      variantKey: 'enhancedBasicAttack',
      startFrame: 90,
      ids: createIds(),
    };
    const group = yvonne.skillGroups.find(group => group.key === 'basicAttack')!;
    const entry = listSkillGroupLibraryPlacements(group).find(
      entry => entry.variantKey === 'enhancedBasicAttack',
    )!;
    expect(entry.skills.map(skill => skill.key)).toEqual([
      'chr_0017_yvonne_ult_attack1_1',
      'chr_0017_yvonne_ult_attack2_1',
      'chr_0017_yvonne_ult_attack2_2',
      'chr_0017_yvonne_ult_attack3_1',
      'chr_0017_yvonne_ult_attack3_2',
      'chr_0017_yvonne_ult_attack_end',
    ]);
    const placed = placeLibrarySkillGroup(input);
    expect(placed.scenario.tracks[0]!.skillCasts).toHaveLength(1);
    expect(placed.scenario.tracks[0]!.skillCasts[0]!.source).toMatchObject({
      skillKey: 'chr_0017_yvonne_ult_attack1_1',
    });
    expect(placed.extension?.reservedCastIds).toHaveLength(23);
    const fallback = placed.fallback!;
    expect(
      fallback.scenario.tracks[0]!.skillCasts.map(cast =>
        cast.source.kind === 'operatorSkill' ? cast.source.skillKey : '',
      ),
    ).toEqual(entry.skills.map(skill => skill.key));
    expect(fallback.skillCastIds).toHaveLength(6);
    expect(fallback.skillCastIds[0]).toBe(placed.skillCastIds[0]);
    expect(fallback.scenario.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(90);
    const single = placeLibrarySkillGroup({ ...input, skillKey: 'chr_0017_yvonne_ult_attack_end' });
    expect(single.extension).toBeUndefined();
    expect(single.scenario.tracks[0]!.skillCasts).toHaveLength(1);
    expect(single.scenario.tracks[0]!.skillCasts[0]!.source).toMatchObject({
      skillKey: 'chr_0017_yvonne_ult_attack_end',
    });
  });
  it('stores the semantic action from explicit native routing on new casts', () => {
    const scenario = createPerlicaScenario();
    scenario.tracks[0]!.operator!.operatorSlug = avywenna.slug;
    const result = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: avywenna,
      skillGroupKey: 'battleSkill',
      startFrame: 10,
      ids: createIds(),
    });

    expect(result.scenario.tracks[0]!.skillCasts[0]!.source).toEqual({
      kind: 'operatorSkill',
      skillGroupKey: 'battleSkill',
      skillKey: 'chr_0012_avywen_normal_skill',
      action: 'battleSkill',
    });
  });

  it('places the generated basic-attack chain with definition defaults', () => {
    const original = createPerlicaScenario();
    const result = placeSkillGroup({
      scenario: original,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'basicAttack',
      startFrame: 30,
      ids: createIds(),
    });
    const casts = result.scenario.tracks[0]!.skillCasts;

    expect(original.tracks[0]!.skillCasts).toEqual([]);
    expect(casts).toHaveLength(4);
    const basicAttack = perlica.skillGroups.find(group => group.key === 'basicAttack')!;
    const skills = Array.isArray(basicAttack.skills) ? basicAttack.skills : [basicAttack.skills];
    expect(casts.map(cast => cast.placement.startFrame)).toEqual([
      30,
      31 + skills[0]!.timelineBlockFrames,
      32 + skills[0]!.timelineBlockFrames + skills[1]!.timelineBlockFrames,
      33 +
        skills[0]!.timelineBlockFrames +
        skills[1]!.timelineBlockFrames +
        skills[2]!.timelineBlockFrames,
    ]);
    expect(casts[0]?.source).toEqual({
      kind: 'operatorSkill',
      skillGroupKey: 'basicAttack',
      skillKey: 'chr_0004_pelica_attack1',
      action: 'basicAttack',
    });
    const grouped = groupPlacedSkillSequence(result.scenario, result.skillCastIds);
    expect(grouped.tracks[0]!.skillCasts.map(cast => cast.placement)).toEqual([
      { startFrame: 30 },
      { afterCastId: result.skillCastIds[0] },
      { afterCastId: result.skillCastIds[1] },
      { afterCastId: result.skillCastIds[2] },
    ]);
    expect(grouped.tracks[0]!.skillCasts.map(cast => cast.id)).toEqual(result.skillCastIds);
  });

  it('keeps a single skill as one cast and resolves its cost', () => {
    const result = placeSkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 60,
      ids: createIds(),
    });
    const cast = result.scenario.tracks[0]!.skillCasts[0]!;

    const battleSkill = perlica.skillGroups.find(group => group.key === 'battleSkill')!;
    const skill = Array.isArray(battleSkill.skills) ? battleSkill.skills[0] : battleSkill.skills;
    expect(skill?.costs?.length ?? 0).toBeGreaterThan(0);
    expect(skill?.scheduledSequences.length ?? 0).toBeGreaterThan(0);
    expect(cast.source).toEqual({
      kind: 'operatorSkill',
      skillGroupKey: 'battleSkill',
      skillKey: 'chr_0004_pelica_normal_skill',
      action: 'battleSkill',
    });
  });

  it('places one selected segment of a skill chain', () => {
    const result = placeSkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'basicAttack',
      skillKey: 'chr_0004_pelica_attack3',
      startFrame: 45,
      ids: createIds(),
    });
    const casts = result.scenario.tracks[0]!.skillCasts;

    expect(casts).toHaveLength(1);
    expect(casts[0]!.source).toEqual({
      kind: 'operatorSkill',
      skillGroupKey: 'basicAttack',
      skillKey: 'chr_0004_pelica_attack3',
      action: 'basicAttack',
    });
    expect(casts[0]!.placement.startFrame).toBe(45);
  });

  it('places an enhanced basic-attack variant without changing its stable parent group', () => {
    const scenario = createPerlicaScenario();
    scenario.tracks[0]!.operator!.operatorSlug = laevatain.slug;
    const result = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: laevatain,
      skillGroupKey: 'basicAttack',
      variantKey: 'enhancedBasicAttack',
      startFrame: 90,
      ids: createIds(),
    });

    expect(result.scenario.tracks[0]!.skillCasts).toHaveLength(4);
    expect(result.scenario.tracks[0]!.skillCasts.map(cast => cast.source)).toEqual([
      expect.objectContaining({
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0016_laevat_ult_attack1',
      }),
      expect.objectContaining({
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0016_laevat_ult_attack2',
      }),
      expect.objectContaining({
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0016_laevat_ult_attack3',
      }),
      expect.objectContaining({
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0016_laevat_ult_attack4',
      }),
    ]);
    const grouped = groupPlacedSkillSequence(result.scenario, result.skillCastIds);
    expect(grouped.tracks[0]!.skillCasts.map(cast => cast.placement)).toEqual([
      { startFrame: 90 },
      { afterCastId: result.skillCastIds[0] },
      { afterCastId: result.skillCastIds[1] },
      { afterCastId: result.skillCastIds[2] },
    ]);
  });

  it('places a runtime replacement only when that concrete skill is selected', () => {
    const scenario = createPerlicaScenario();
    scenario.tracks[0]!.operator!.operatorSlug = laevatain.slug;
    const result = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: laevatain,
      skillGroupKey: 'battleSkill',
      skillKey: 'chr_0016_laevat_normal_skill_during_ult',
      startFrame: 120,
      ids: createIds(),
    });

    expect(result.scenario.tracks[0]!.skillCasts).toEqual([
      expect.objectContaining({
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill_during_ult',
          action: 'battleSkill',
        },
      }),
    ]);
  });

  it('places explicitly configured replacement stages as one ordered Mifu chain', () => {
    const scenario = createPerlicaScenario();
    scenario.tracks[0]!.operator!.operatorSlug = mifu.slug;
    const result = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: mifu,
      skillGroupKey: 'battleSkill',
      startFrame: 10,
      ids: createIds(),
    });

    expect(
      result.scenario.tracks[0]!.skillCasts.map(cast =>
        cast.source.kind === 'operatorSkill' ? cast.source.skillKey : null,
      ),
    ).toEqual([
      'chr_0031_mifu_normalskill_1',
      'chr_0031_mifu_normalskill_2',
      'chr_0031_mifu_normalskill_3',
    ]);
    expect(result.scenario.tracks[0]!.skillCasts.map(cast => cast.placement.startFrame)).toEqual([
      10, 22, 51,
    ]);
  });

  it('does not allow an internal runtime skill to be placed explicitly', () => {
    const scenario = createPerlicaScenario();
    scenario.tracks[0]!.operator!.operatorSlug = zhuangFangyi.slug;

    expect(() =>
      placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: zhuangFangyi,
        skillGroupKey: 'ultimate',
        skillKey: 'chr_0030_zhuangfy_ultimate_skill_end',
        startFrame: 10,
        ids: createIds(),
      }),
    ).toThrow("skill group 'ultimate' has no skill 'chr_0030_zhuangfy_ultimate_skill_end'");
  });

  it('rejects a definition that does not match the track build', () => {
    const scenario = createPerlicaScenario();
    scenario.tracks[0]!.operator!.operatorSlug = 'another';

    expect(() =>
      placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: perlica,
        skillGroupKey: 'battleSkill',
        startFrame: 0,
        ids: createIds(),
      }),
    ).toThrow("references 'another', not 'perlica'");
  });
});
