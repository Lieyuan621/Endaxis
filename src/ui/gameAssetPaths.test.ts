import { describe, expect, it } from 'vitest';
import { getIconAssetPath, getOperatorAvatarPath } from './gameAssetPaths';

describe('gameAssetPaths', () => {
  it('rejects path injection instead of interpolating arbitrary definition values', () => {
    expect(() => getOperatorAvatarPath('../operator')).toThrow(/safe game asset segment/);
    expect(() => getIconAssetPath('folder/icon')).toThrow(/safe game asset segment/);
  });
});
