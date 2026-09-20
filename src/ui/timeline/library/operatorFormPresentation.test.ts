import { describe, expect, it } from 'vitest';
import { arcane } from '../../../data/operators/arcane.generated';
import { resolveOperatorPresentationFormKey } from './operatorFormPresentation';

describe('干员展示形态', () => {
  it('按照最终智识和意志面板判断诀的当前形态', () => {
    expect(
      resolveOperatorPresentationFormKey(arcane, {
        strength: 0,
        agility: 0,
        intellect: 500,
        will: 500,
      }),
    ).toBe('int');
    expect(
      resolveOperatorPresentationFormKey(arcane, {
        strength: 0,
        agility: 0,
        intellect: 499,
        will: 500,
      }),
    ).toBe('will');
  });
});
