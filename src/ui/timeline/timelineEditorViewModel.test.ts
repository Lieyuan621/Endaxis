import { describe, expect, it } from 'vitest';
import type { OperatorDefinition } from '../../core/game-data/operatorDefinition';
import { createEmptyScenario } from '../../core/project/createProject';
import {
  arcane,
  camille,
  laevatain,
  liino,
  mifu,
  perlica,
  rossi,
  zhuangFangyi,
} from '../../data/operators';
import { placeSkillGroup } from './interaction/placeSkillGroup';
import { projectTimelineEditor } from './timelineEditorViewModel';
import { arclight } from '../../data/operators/arclight.generated';
import { applyInitialUltimateEnergyPreset } from './interaction/timelineDocumentCommands';
import { compileOperatorDefinitionSkills } from '../../core/compiler/compileScenarioTimeline';
import { compileScenarioResources } from '../../core/compiler/compileScenarioResources';

it.each([0, 5])(
  'full initial charge matches compiled Arclight costs at potential %s',
  potential => {
    const scenario = createEmptyScenario('full-charge', 'Full charge');
    const build = {
      operatorSlug: arclight.slug,
      level: 90,
      promoted: true,
      potential,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    };
    scenario.tracks[0] = {
      id: 'owner',
      operator: build,
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const view = projectTimelineEditor(scenario, { getOperator: () => arclight });
    const full = applyInitialUltimateEnergyPreset(
      scenario,
      'full',
      view.tracks.map(track => track.maxUltimateEnergy),
    );
    const compiled = compileOperatorDefinitionSkills('owner', build, arclight);
    const maximum = compiled.find(
      skill => skill.skillType === 'ultimate' && skill.costs.length > 0,
    )!.costs[0]!.value;
    expect(maximum).toBe(potential === 0 ? 90 : 76.5);
    expect(full.tracks[0]!.initialState.ultimateEnergy).toBe(maximum);
    const resources = compileScenarioResources(full, {
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecoveryPauseDuration: 1.5,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
      operators: new Map([
        [
          'owner',
          {
            maxUltimateEnergy: maximum,
            ultimateEnergyGainMultiplier: 1,
            allowedUltimateEnergyRecoveryTags: null,
          },
        ],
      ]),
    });
    expect(resources.squad[0]!.ultimateEnergy).toBe(resources.squad[0]!.maxUltimateEnergy);
  },
);

describe('projectTimelineEditor', () => {
  it('keeps a cast in place and reports a local issue after its template skill key is edited', () => {
    const scenario = createEmptyScenario('scenario:template-edit', 'Template edit');
    scenario.tracks[0] = {
      id: 'track:template-edit',
      operator: {
        operatorSlug: 'edited-operator',
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 100,
        skillLevels: { battleSkill: 1 },
        talentStates: {},
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [
        {
          id: 'cast:kept',
          source: { kind: 'operatorSkill', skillGroupKey: 'battleSkill', skillKey: 'old-key' },
          placement: { startFrame: 45 },
        },
      ],
    };
    const edited = {
      ...perlica,
      slug: 'edited-operator',
      skillGroups: [
        {
          ...perlica.skillGroups.find(group => group.key === 'battleSkill')!,
          skills: { key: 'new-key', timelineBlockFrames: 30, scheduledSequences: [] },
        },
      ],
    };

    const result = projectTimelineEditor(scenario, {
      getOperator: slug => (slug === edited.slug ? edited : null),
    });

    expect(result.tracks[0]!.skillCasts).toHaveLength(1);
    expect(result.tracks[0]!.skillCasts[0]).toMatchObject({
      id: 'cast:kept',
      startFrame: 45,
      durationFrames: 0,
      resolutionIssue: "skill group 'edited-operator/battleSkill' has no skill 'old-key'",
    });
    expect(result.tracks[0]!.issues[0]).toContain("cast 'cast:kept'");
  });
  it('projects a definition-backed operator track without leaking mutable definitions', () => {
    const scenario = createEmptyScenario('scenario:1', '佩丽卡样板');

    scenario.tracks[0] = {
      id: 'track:0',
      operator: {
        operatorSlug: 'perlica',
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: {
          basicAttack: 12,
          battleSkill: 11,
          comboSkill: 10,
          ultimate: 9,
        },
        talentStates: {},
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 30,
      ids: { allocate: kind => `${kind}:1` },
    });

    const viewModel = projectTimelineEditor(placed.scenario, {
      getOperator: slug => (slug === perlica.slug ? perlica : null),
    });

    expect(viewModel.tracks).toHaveLength(4);
    expect(viewModel.tracks[0]?.operatorSlug).toBe('perlica');
    expect(viewModel.tracks[0]?.operatorAssetSlug).toBe('perlica');
    expect(viewModel.tracks[0]?.operatorSupport).toEqual({
      completeness: 'complete',
      missingCapabilities: [],
    });
    expect(viewModel.tracks[0]?.initialUltimateEnergy).toBe(0);
    expect(viewModel.tracks[0]?.maxUltimateEnergy).toBe(80);
    expect(viewModel.tracks[0]?.skillLibrary.map(entry => entry.skillGroupKey)).toEqual([
      'basicAttack',
      'plungingAttack',
      'finisher',
      'battleSkill',
      'comboSkill',
      'ultimate',
    ]);
    expect(viewModel.tracks[0]?.skillLibrary[0]?.level).toBe(12);
    expect(viewModel.tracks[0]?.skillLibrary[0]?.skills).toHaveLength(4);
    expect(viewModel.tracks[0]?.skillCasts[0]?.skillType).toBe('battleSkill');
    expect(viewModel.tracks[1]).toMatchObject({
      operatorSlug: null,
      operatorAssetSlug: null,
      operatorSupport: null,
      initialUltimateEnergy: 0,
      maxUltimateEnergy: null,
      skillLibrary: [],
    });
  });

  it('projects enhanced basic attacks as a variant entry using ultimate level', () => {
    const scenario = createEmptyScenario('scenario:laevatain-variant', '莱万汀强化普攻');
    scenario.tracks[0] = {
      id: 'track:laevatain',
      operator: {
        operatorSlug: laevatain.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 3, battleSkill: 4, comboSkill: 5, ultimate: 11 },
        talentStates: {},
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };

    const projected = projectTimelineEditor(scenario, {
      getOperator: slug => (slug === laevatain.slug ? laevatain : null),
    });
    const basicEntries = projected.tracks[0]!.skillLibrary.filter(
      entry => entry.skillGroupKey === 'basicAttack',
    );

    expect(basicEntries).toHaveLength(2);
    expect(basicEntries[0]?.variantKey).toBeUndefined();
    expect(basicEntries[0]?.level).toBe(3);
    expect(basicEntries[1]).toMatchObject({
      variantKey: 'enhancedBasicAttack',
      level: 11,
      enhanced: true,
    });
    expect(basicEntries[1]!.skills).toHaveLength(4);
    const battleEntries = projected.tracks[0]!.skillLibrary.filter(
      entry => entry.skillGroupKey === 'battleSkill',
    );
    expect(battleEntries).toHaveLength(2);
    expect(battleEntries[0]?.skills.map(skill => skill.skillKey)).toEqual([
      'chr_0016_laevat_normal_skill',
    ]);
    expect(battleEntries[1]).toMatchObject({
      placementSkillKey: 'chr_0016_laevat_normal_skill_during_ult',
      groupPlacementSkillKeys: ['chr_0016_laevat_normal_skill_during_ult'],
    });
  });

  it('projects only the explicitly placed Mifu battle-skill form hits', () => {
    const scenario = createEmptyScenario('scenario:mifu-hit-markers', '弭弗三段战技命中投影');
    scenario.tracks[0] = {
      id: 'track:mifu',
      operator: {
        operatorSlug: mifu.slug,
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
    const battleEntries = projectTimelineEditor(scenario, {
      getOperator: slug => (slug === mifu.slug ? mifu : null),
    }).tracks[0]!.skillLibrary.filter(entry => entry.skillGroupKey === 'battleSkill');
    expect(battleEntries).toHaveLength(1);
    expect(battleEntries[0]?.placementSkillKey).toBeUndefined();
    expect(battleEntries[0]?.groupPlacementSkillKeys).toEqual([
      'chr_0031_mifu_normalskill_1',
      'chr_0031_mifu_normalskill_2',
      'chr_0031_mifu_normalskill_3',
    ]);

    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: mifu,
      skillGroupKey: 'battleSkill',
      skillKey: 'chr_0031_mifu_normalskill_1',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:mifu` },
    }).scenario;

    const [cast] = projectTimelineEditor(placed, {
      getOperator: slug => (slug === mifu.slug ? mifu : null),
    }).tracks[0]!.skillCasts;
    const markersByForm = cast!.hitMarkers.reduce<Record<string, number>>((result, marker) => {
      const form = marker.skillKey ?? 'unknown';
      result[form] = (result[form] ?? 0) + 1;
      return result;
    }, {});

    expect(markersByForm).toEqual({ unknown: 1 });
    expect(cast!.hitMarkers).toEqual([expect.objectContaining({ conditional: false })]);

    const replacementPlaced = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: mifu,
      skillGroupKey: 'battleSkill',
      skillKey: 'chr_0031_mifu_normalskill_2',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:mifu-2` },
    }).scenario;
    const [replacementCast] = projectTimelineEditor(replacementPlaced, {
      getOperator: slug => (slug === mifu.slug ? mifu : null),
    }).tracks[0]!.skillCasts;
    expect(replacementCast!.hitMarkers).toHaveLength(3);
    expect(replacementCast!.hitMarkers.every(marker => !marker.conditional)).toBe(true);
  });

  it('projects a routed replacement as an independent card with its execution level source', () => {
    const scenario = createEmptyScenario('scenario:camille-routed-card', '卡米拉强化战技卡片');
    scenario.tracks[0] = {
      id: 'track:camille',
      operator: {
        operatorSlug: camille.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 3, battleSkill: 4, comboSkill: 5, ultimate: 6 },
        talentStates: {},
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: camille,
      skillGroupKey: 'battleSkill',
      skillKey: 'chr_0033_camille_normal_skill_2',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:camille-routed` },
    }).scenario;

    const track = projectTimelineEditor(placed, {
      getOperator: slug => (slug === camille.slug ? camille : null),
    }).tracks[0]!;
    const battleEntries = track.skillLibrary.filter(entry => entry.skillGroupKey === 'battleSkill');
    expect(battleEntries).toHaveLength(2);
    expect(battleEntries[0]).toMatchObject({ skillType: 'battleSkill', level: 4 });
    expect(battleEntries[1]).toMatchObject({
      placementSkillKey: 'chr_0033_camille_normal_skill_2',
      skillType: 'comboSkill',
      level: 5,
      enhanced: false,
      groupPlacementSkillKeys: ['chr_0033_camille_normal_skill_2'],
    });
    expect(track.skillCasts[0]?.skillType).toBe('comboSkill');
  });

  it('uses explicit library semantics instead of treating every replacement as enhanced', () => {
    const project = (operator: OperatorDefinition) => {
      const scenario = createEmptyScenario(`scenario:${operator.slug}`, operator.slug);
      scenario.tracks[0] = {
        id: `track:${operator.slug}`,
        operator: {
          operatorSlug: operator.slug,
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
      return projectTimelineEditor(scenario, {
        getOperator: slug => (slug === operator.slug ? operator : null),
      }).tracks[0]!.skillLibrary;
    };

    const zhuangEntries = project(zhuangFangyi);
    expect(
      zhuangEntries.some(
        entry => entry.placementSkillKey === 'chr_0030_zhuangfy_ultimate_skill_end',
      ),
    ).toBe(false);
    expect(
      zhuangEntries.find(entry => entry.skillGroupKey === 'enhancedBasicAttack'),
    ).toMatchObject({ enhanced: true });
    expect(
      zhuangEntries.find(entry => entry.placementSkillKey === 'chr_0030_zhuangfy_normal_skill_ult'),
    ).toMatchObject({ enhanced: true });
    expect(
      zhuangEntries.find(entry => entry.placementSkillKey === 'chr_0030_zhuangfy_combo_skill_ult'),
    ).toMatchObject({ enhanced: true });

    expect(
      project(arcane).find(
        entry => entry.placementSkillKey === 'chr_0032_lizhiyan_ultimate_skill2',
      ),
    ).toMatchObject({
      enhanced: false,
      skillType: 'ultimate',
    });
    expect(
      project(liino).find(entry => entry.placementSkillKey === 'chr_0035_liino_normal_skill_end'),
    ).toMatchObject({
      enhanced: false,
      skillType: 'battleSkill',
    });
    expect(project(liino).filter(entry => entry.skillGroupKey === 'battleSkill')).toEqual([
      expect.objectContaining({
        groupPlacementSkillKeys: ['chr_0035_liino_normal_skill'],
        skills: [expect.objectContaining({ timelineBlockFrames: 50 })],
      }),
      expect.objectContaining({
        placementSkillKey: 'chr_0035_liino_normal_skill_end',
        groupPlacementSkillKeys: ['chr_0035_liino_normal_skill_end'],
      }),
    ]);
    expect(project(camille).filter(entry => entry.skillGroupKey === 'comboSkill')).toEqual([
      expect.objectContaining({ groupPlacementSkillKeys: ['chr_0033_camille_combo_skill'] }),
    ]);
    expect(project(camille).filter(entry => entry.skillGroupKey === 'battleSkill')).toEqual([
      expect.objectContaining({ groupPlacementSkillKeys: ['chr_0033_camille_normal_skill'] }),
      expect.objectContaining({
        placementSkillKey: 'chr_0033_camille_normal_skill_2',
        groupPlacementSkillKeys: ['chr_0033_camille_normal_skill_2'],
        skillType: 'comboSkill',
      }),
    ]);
    expect(project(rossi).filter(entry => entry.skillGroupKey === 'comboSkill')).toEqual([
      expect.objectContaining({
        enhanced: false,
        groupPlacementSkillKeys: ['chr_0028_wulfa_combo_2_skill', 'chr_0028_wulfa_combo_3_skill'],
        skills: [
          expect.objectContaining({ timelineBlockFrames: 66 }),
          expect.objectContaining({ timelineBlockFrames: 60 }),
        ],
      }),
    ]);
  });

  it('keeps project template identity separate from inherited operator assets', () => {
    const scenario = createEmptyScenario('scenario:custom-assets', '自定义资源');
    scenario.tracks[0] = {
      id: 'track:custom-assets',
      operator: {
        operatorSlug: 'project:operator:1',
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 100,
        skillLevels: {},
        talentStates: {},
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const customOperator = {
      ...perlica,
      slug: 'project:operator:1',
      assetSlug: 'perlica',
    };

    const viewModel = projectTimelineEditor(scenario, {
      getOperator: slug => (slug === customOperator.slug ? customOperator : null),
    });

    expect(viewModel.tracks[0]).toMatchObject({
      operatorSlug: 'project:operator:1',
      operatorAssetSlug: 'perlica',
    });
  });

  it('reports missing operator definitions instead of inventing definition defaults', () => {
    const scenario = createEmptyScenario('scenario:1', '损坏引用');
    scenario.tracks[0] = {
      id: 'track:0',
      operator: {
        operatorSlug: 'missing',
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: {},
        talentStates: {},
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };

    const viewModel = projectTimelineEditor(scenario, { getOperator: () => null });

    expect(viewModel.tracks[0]?.issues).toEqual(["missing operator definition 'missing'"]);
    expect(viewModel.tracks[0]?.skillLibrary).toEqual([]);
  });
});
