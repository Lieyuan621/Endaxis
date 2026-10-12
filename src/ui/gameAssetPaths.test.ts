import { describe, expect, it } from 'vitest';
import { getOperatorAvatarPath } from './gameAssetPaths';

describe('gameAssetPaths', () => {
  it('rejects path injection instead of interpolating arbitrary definition values', () => {
    expect(() => getOperatorAvatarPath('../operator')).toThrow(/safe game asset segment/);
  });
});
