import { describe, expect, it } from 'vitest';
import en from '../../../i18n/locales/en.json';
import zhCN from '../../../i18n/locales/zh-CN.json';

describe('operator-specific status copy', () => {
  it('keeps every UI locale on the same detail-copy schema', () => {
    const keys = (value: Record<string, unknown>) => Object.keys(value).sort();
    expect(keys(en.timeline.passiveUi)).toEqual(keys(zhCN.timeline.passiveUi));
    expect(keys(en.timeline.passiveUi.values)).toEqual(keys(zhCN.timeline.passiveUi.values));
    expect(keys(en.timeline.passiveUi.descriptions)).toEqual(
      keys(zhCN.timeline.passiveUi.descriptions),
    );
  });
});
