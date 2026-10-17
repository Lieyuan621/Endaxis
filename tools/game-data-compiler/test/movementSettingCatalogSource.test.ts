import { describe, expect, it } from 'vitest';
import { parseMovementSettingCatalogDumpSource } from '../src/source/movementSettingCatalogSource.ts';

const jump =
  '\tfloat _jumpDelay = 0\n\tfloat _maxJumpHeight = 2.1\n\tfloat _gravity = 40\n\tfloat _fallingGravity = 38\n';
const misc = '\tfloat minPlungingAttackHeight = 0.6\n\tfloat plungingAttackDownSpeed = 60\n';

describe('MovementSetting catalog source', () => {
  it('读取连续 Dash 的内外窗口', () => {
    const source = parseMovementSettingCatalogDumpSource(
      '\tfloat _dashInputCd = 0.8\r\n\tfloat _dashSecondDashInterval = 0.3\r\n' + jump,
      'fixture',
      misc,
    );
    expect(source).toMatchObject({
      dashInputCooldownSeconds: 0.8,
      dashSecondDashIntervalSeconds: 0.3,
      minPlungingAttackHeight: 0.6,
      plungingAttackDownSpeed: 60,
    });
  });

  it('拒绝缺字段和颠倒的窗口', () => {
    expect(() =>
      parseMovementSettingCatalogDumpSource('\tfloat _dashInputCd = 0.8\n', 'missing', misc),
    ).toThrow('missing _dashSecondDashInterval');
    expect(() =>
      parseMovementSettingCatalogDumpSource(
        '\tfloat _dashInputCd = 0.2\n\tfloat _dashSecondDashInterval = 0.3\n',
        'reversed',
        misc,
      ),
    ).toThrow('exceeds the outer input window');
  });
});
