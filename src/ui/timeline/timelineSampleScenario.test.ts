import { describe, expect, it } from 'vitest';
import { resolveSkillTemplateDefinition } from '../../core/compiler/resolveSkillDefinition';
import { validateSkillDefinition } from '../../core/game-data/validateSkillDefinition';
import { arclight } from '../../data/operators/arclight.generated';
import {
  ABILITY_ENTITY_SAMPLE_CAST_ID,
  ABILITY_ENTITY_SAMPLE_TRACK_INDEX,
  createTimelineSampleScenario,
} from './timelineSampleScenario';
import source from './timelineSampleScenario.ts?raw';

describe('timelineSampleScenario', () => {
  it('does not load the complete operator catalog for two stable slugs', () => {
    expect(source).not.toContain('data/operators');
  });
  it('keeps the shared 120 second default on first launch', () => {
    expect(createTimelineSampleScenario().battle.durationFrames).toBe(120 * 30);
  });
  it('提供可直接编辑的真实生成能力实体子时间线', () => {
    const scenario = createTimelineSampleScenario();
    const track = scenario.tracks[ABILITY_ENTITY_SAMPLE_TRACK_INDEX]!;
    const cast = track.skillCasts.find(item => item.id === ABILITY_ENTITY_SAMPLE_CAST_ID)!;
    const { definition } = resolveSkillTemplateDefinition(cast, arclight);
    const spawn = Object.values(definition.actionGraph.main.nodes).find(
      node => node.action.kind === 'spawnAbilityEntity',
    )?.action;

    expect(validateSkillDefinition(definition, '$')).toEqual([]);
    expect(cast.customDefinition).toBeUndefined();
    expect(cast.presentation?.disabled).toBe(true);
    expect(spawn?.kind).toBe('spawnAbilityEntity');
    if (spawn?.kind !== 'spawnAbilityEntity') throw new Error('missing AbilityEntity sample');
    expect(spawn.parameters.abilityEntityId).toBe('abilityentity_chr_0007_ikut_ultimate_skill');
    expect(
      arclight.abilityEntityDefinitions?.[spawn.parameters.abilityEntityId]?.childSkill
        ?.scheduledSequences,
    ).toHaveLength(4);
  });
});
