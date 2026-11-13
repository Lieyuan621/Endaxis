import { describe, expect, it } from 'vitest';
import { ENTITY_TAG_POLICIES } from '../config/entityTagPolicies.ts';
import { retainReviewedEntityTags } from '../src/compiler/scenario/entityTagPolicy.ts';

describe('entity tag review', () => {
  it('retains gameplay restrictions and omits reviewed movement tags in the same action', () => {
    expect(
      retainReviewedEntityTags(
        [
          'Status/DisableDash',
          'Status/Ability/Skill/CantSwitchPosition',
          'Status/DontInterruptSkillBySwitchIn',
        ],
        'fixture.AddTagAction.tags',
      ),
    ).toEqual(['Status/DisableDash', 'Status/DontInterruptSkillBySwitchIn']);
  });

  it.each(['Status/NewTag', 'Status/DisableDash/NewTag', 'toString'])(
    'requires an explicit review for %s, including children of reviewed tags',
    tag => {
      expect(() =>
        retainReviewedEntityTags(['Status/DisableDash', tag], 'fixture.AddTagAction.tags'),
      ).toThrow(`fixture.AddTagAction.tags: unreviewed entity tag "${tag}"`);
    },
  );

  it('requires a reason for every review decision', () => {
    for (const policy of Object.values(ENTITY_TAG_POLICIES)) {
      expect(['retain', 'omit']).toContain(policy.disposition);
      expect(policy.reason.trim().length).toBeGreaterThan(0);
    }
  });
});
