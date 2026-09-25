import { describe, expect, it } from 'vitest';

import type {
  OperatorDefinition,
  SkillDefinition,
} from '../../../core/game-data/operatorDefinition';
import { createEmptyScenario } from '../../../core/project/createProject';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { placeSkillGroup } from '../interaction/placeSkillGroup';
import { projectTimelineEditor } from '../timelineEditorViewModel';

interface DeclaredPlaceableSkill {
  readonly operator: OperatorDefinition;
  readonly groupKey: string;
  readonly variantKey?: string;
  readonly skill: SkillDefinition;
}

function asSkills(value: SkillDefinition | readonly SkillDefinition[]): readonly SkillDefinition[] {
  return Array.isArray(value) ? value : [value as SkillDefinition];
}

function identity(
  operatorSlug: string,
  groupKey: string,
  variantKey: string | undefined,
  skillKey: string,
): string {
  return `${operatorSlug}/${groupKey}/${variantKey ?? '-'}/${skillKey}`;
}

function createOperatorScenario(operator: OperatorDefinition) {
  const scenario = createEmptyScenario(`skill-library:${operator.slug}`, operator.slug);
  scenario.tracks[0] = {
    id: `track:${operator.slug}`,
    operator: {
      operatorSlug: operator.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 3, battleSkill: 5, comboSkill: 7, ultimate: 11 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  return scenario;
}

const declaredPlaceableSkills: readonly DeclaredPlaceableSkill[] = gameDataRepository
  .getOperators()
  .flatMap(operator =>
    operator.skillGroups.flatMap(group => [
      ...asSkills(group.skills).map(skill => ({ operator, groupKey: group.key, skill })),
      ...(group.variants ?? []).flatMap(variant =>
        asSkills(variant.skills).map(skill => ({
          operator,
          groupKey: group.key,
          variantKey: variant.key,
          skill,
        })),
      ),
      ...(group.replacementSkills ?? [])
        .filter(skill => group.replacementSkillPlacements?.[skill.key] !== 'internal')
        .map(skill => ({ operator, groupKey: group.key, skill })),
      ...(group.routedReplacementSkills ?? [])
        .filter(
          replacement => group.replacementSkillPlacements?.[replacement.skill.key] !== 'internal',
        )
        .map(replacement => ({ operator, groupKey: group.key, skill: replacement.skill })),
    ]),
  );

describe('正式干员技能库覆盖', () => {
  it('将全部可主动放置技能恰好展示一次，并排除内部执行技能', () => {
    const projected = gameDataRepository.getOperators().flatMap(operator => {
      const track = projectTimelineEditor(createOperatorScenario(operator), gameDataRepository)
        .tracks[0]!;
      return track.skillLibrary.flatMap(entry =>
        entry.skills.map(skill =>
          identity(operator.slug, entry.skillGroupKey, entry.variantKey, skill.skillKey),
        ),
      );
    });
    const declared = declaredPlaceableSkills.map(entry =>
      identity(entry.operator.slug, entry.groupKey, entry.variantKey, entry.skill.key),
    );

    expect(declared.length).toBeGreaterThan(0);
    expect(new Set(declared).size).toBe(declared.length);
    expect(new Set(projected).size).toBe(projected.length);
    expect(projected.toSorted()).toEqual(declared.toSorted());
  });

  it('每张正式技能库卡片都能按其投影语义生成同一技能或技能链', () => {
    let allocated = 0;
    for (const operator of gameDataRepository.getOperators()) {
      const scenario = createOperatorScenario(operator);
      const track = projectTimelineEditor(scenario, gameDataRepository).tracks[0]!;
      for (const entry of track.skillLibrary) {
        const group = operator.skillGroups.find(
          candidate => candidate.key === entry.skillGroupKey,
        )!;
        const definitionSkills = [
          ...asSkills(group.skills),
          ...(group.variants ?? []).flatMap(variant => asSkills(variant.skills)),
          ...(group.replacementSkills ?? []),
          ...(group.routedReplacementSkills ?? []).map(item => item.skill),
        ];
        const placed = placeSkillGroup({
          scenario,
          trackIndex: 0,
          operator,
          skillGroupKey: entry.skillGroupKey,
          ...(entry.variantKey === undefined ? {} : { variantKey: entry.variantKey }),
          ...(entry.placementSkillKey === undefined ? {} : { skillKey: entry.placementSkillKey }),
          startFrame: 0,
          ids: { allocate: kind => `${kind}:coverage:${allocated++}` },
        }).scenario;
        expect(
          placed.tracks[0]!.skillCasts.map(cast =>
            cast.source.kind === 'operatorSkill' ? cast.source.skillKey : null,
          ),
        ).toEqual(entry.groupPlacementSkillKeys);
        expect(entry.skills.every(skill => skill.skillKey.length > 0)).toBe(true);
        const levelSource = definitionSkills.find(
          skill => skill.key === entry.skills[0]!.skillKey,
        )?.levelSource;
        expect(levelSource).toBeDefined();
        expect(entry.level).toBe(scenario.tracks[0]!.operator!.skillLevels[levelSource!] ?? 1);
      }
    }
  });
});
