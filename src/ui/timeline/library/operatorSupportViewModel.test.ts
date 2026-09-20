import { describe, expect, it } from 'vitest';
import { projectOperatorSupport } from './operatorSupportViewModel';

describe('projectOperatorSupport', () => {
  it('treats reviewed definitions without conversion metadata as complete', () => {
    expect(projectOperatorSupport({})).toEqual({
      completeness: 'complete',
      missingCapabilities: [],
    });
  });

  it('copies stable partial support without exposing mutable source arrays', () => {
    const skillGroupKeys = ['battleSkill'];
    const support = projectOperatorSupport({
      conversionSupport: {
        completeness: 'partial',
        missingCapabilities: [{ capability: 'skillBehavior', skillGroupKeys }],
      },
    });
    skillGroupKeys.push('ultimate');

    expect(support).toEqual({
      completeness: 'partial',
      missingCapabilities: [{ capability: 'skillBehavior', skillGroupKeys: ['battleSkill'] }],
    });
    expect(Object.isFrozen(support.missingCapabilities)).toBe(true);
  });
});
