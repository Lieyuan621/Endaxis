import { describe, expect, it } from 'vitest';
import { resolveDamageBonusSourceLabel } from './damageBonusSourceLabel';

const t = (key: string) => {
  if (key === 'effects.name.imprisonment') return '囹圄';
  return key;
};
const te = (key: string) => key === 'effects.name.imprisonment';

describe('resolveDamageBonusSourceLabel', () => {
  it('keeps stamped Chinese display names', () => {
    expect(resolveDamageBonusSourceLabel('使命必达', t, te, 'zh-CN')).toBe('使命必达');
    expect(resolveDamageBonusSourceLabel('动火用辅助骨骼', t, te, 'zh-CN')).toBe(
      '动火用辅助骨骼',
    );
  });

  it('translates effect locale keys', () => {
    expect(resolveDamageBonusSourceLabel('imprisonment', t, te, 'zh-CN')).toBe('囹圄');
  });

  it('resolves weapon slug from generated effect ids', () => {
    expect(
      resolveDamageBonusSourceLabel(
        'delivery-guaranteed-skill3-trigger0-effect0',
        t,
        te,
        'zh-CN',
      ),
    ).toBe('使命必达');
  });
});
