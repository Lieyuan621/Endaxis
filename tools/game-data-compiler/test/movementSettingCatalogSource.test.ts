import { describe, expect, it } from 'vitest';
import {
  parseMovementSettingCatalogDumpSource,
  renderMovementSettingCatalogModule,
} from '../src/source/movementSettingCatalogSource.ts';

describe('MovementSetting catalog source', () => {
  it('读取连续 Dash 的内外窗口并生成稳定模块', () => {
    const source = parseMovementSettingCatalogDumpSource(
      '\tfloat _dashInputCd = 0.8\r\n\tfloat _dashSecondDashInterval = 0.3\r\n',
      'fixture',
    );
    expect(source).toMatchObject({
      dashInputCooldownSeconds: 0.8,
      dashSecondDashIntervalSeconds: 0.3,
    });
    expect(renderMovementSettingCatalogModule(source)).toContain(
      '"dashSecondDashIntervalSeconds": 0.3',
    );
  });

  it('拒绝缺字段和颠倒的窗口', () => {
    expect(() =>
      parseMovementSettingCatalogDumpSource('\tfloat _dashInputCd = 0.8\n', 'missing'),
    ).toThrow('missing _dashSecondDashInterval');
    expect(() =>
      parseMovementSettingCatalogDumpSource(
        '\tfloat _dashInputCd = 0.2\n\tfloat _dashSecondDashInterval = 0.3\n',
        'reversed',
      ),
    ).toThrow('exceeds the outer input window');
  });
});
