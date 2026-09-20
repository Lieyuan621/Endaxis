import { describe, expect, it } from 'vitest';
import type { OperatorDefinition, SkillDefinition } from './operatorDefinition';
import { installCompiledSkillDefinition } from './installCompiledSkillDefinition';

const original: SkillDefinition = {
  key: 'skill_source',
  timelineBlockFrames: 1,
  scheduledSequences: [],
};

const operator = {
  slug: 'fixture',
  skillGroups: [
    { key: 'battleSkill', skillType: 'battleSkill', levelSource: 'battleSkill', skills: original },
  ],
} as unknown as OperatorDefinition;

describe('installCompiledSkillDefinition', () => {
  it('replaces exactly one skill by native source identity without mutating the base', () => {
    const compiled = { ...original, timelineBlockFrames: 34 };
    const result = installCompiledSkillDefinition(operator, compiled, {
      supplemental: { stackingType: 'unique' },
    });

    expect(result.skillGroups[0]?.skills).toBe(compiled);
    expect(result.buffDefinitions?.supplemental).toEqual({ stackingType: 'unique' });
    expect(operator.skillGroups[0]?.skills).toBe(original);
  });

  it('rejects missing, duplicate, and conflicting-key bindings', () => {
    expect(() => installCompiledSkillDefinition(operator, { ...original, key: 'missing' })).toThrow(
      'must match exactly once; matched 0',
    );
    expect(() =>
      installCompiledSkillDefinition(
        { ...operator, skillGroups: [...operator.skillGroups, ...operator.skillGroups] },
        original,
      ),
    ).toThrow('must match exactly once; matched 2');
    expect(() => installCompiledSkillDefinition(operator, { ...original, key: 'wrong' })).toThrow(
      'must match exactly once; matched 0',
    );
  });
});
