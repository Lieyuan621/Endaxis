import { describe, expect, it } from 'vitest';

import type { SkillDefinition, SkillGroupDefinition } from './operatorDefinition';
import { listSkillGroupDefinitionBindings } from './operatorSkillDefinitions';

function skill(key: string): SkillDefinition {
  return {
    key,
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    timelineBlockFrames: 1,
    scheduledSequences: [],
  };
}

describe('operatorSkillDefinitions', () => {
  it('enumerates every structural skill origin without assigning placement semantics', () => {
    const group: SkillGroupDefinition = {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: [skill('base1'), skill('base2')],
      variants: [{ key: 'variant', levelSource: 'ultimate', skills: skill('variant') }],
      replacementSkills: [skill('replacement')],
      routedReplacementSkills: [
        {
          skill: { ...skill('routed'), skillType: 'comboSkill', levelSource: 'comboSkill' },
          skillType: 'comboSkill',
          levelSource: 'comboSkill',
          executionSkillGroupKey: 'comboSkill',
          executionSkillKey: 'comboSkill',
        },
      ],
    };

    expect(
      listSkillGroupDefinitionBindings(group).map(binding => ({
        key: binding.skill.key,
        origin: binding.origin,
        variant: binding.variant?.key,
        routed: binding.routedReplacement?.executionSkillKey,
      })),
    ).toEqual([
      { key: 'base1', origin: 'base', variant: undefined, routed: undefined },
      { key: 'base2', origin: 'base', variant: undefined, routed: undefined },
      { key: 'variant', origin: 'variant', variant: 'variant', routed: undefined },
      { key: 'replacement', origin: 'replacement', variant: undefined, routed: undefined },
      { key: 'routed', origin: 'routedReplacement', variant: undefined, routed: 'comboSkill' },
    ]);
  });
});
