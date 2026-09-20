import { describe, expect, it } from 'vitest';
import { assignGeneratedDamageStepKeys } from '../../src/compiler/publication/definitionStepKeys.ts';

describe('最终定义的伤害步骤身份', () => {
  it('同一回调重复展开仍有不同 key，重建确定且不修改输入', () => {
    const hit = { kind: 'dealDamage', parameters: {} };
    const source = { steps: [hit, { body: { steps: [hit] } }] };
    const result = assignGeneratedDamageStepKeys(source, 'skill');
    const text = JSON.stringify(result);
    expect(text).toContain('skill:/steps/0');
    expect(text).toContain('skill:/steps/1/body/steps/0');
    expect(assignGeneratedDamageStepKeys(source, 'skill')).toEqual(result);
    expect(JSON.stringify(source)).not.toContain('key');
  });
  it('不默默改写已存在的重复 key', () => {
    expect(() =>
      assignGeneratedDamageStepKeys(
        {
          steps: [
            { kind: 'dealDamage', key: 'duplicate' },
            { kind: 'dealFixedDamage', key: 'duplicate' },
          ],
        },
        'skill',
      ),
    ).toThrow(/duplicate damage step key/);
  });
});
