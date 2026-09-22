import { describe, expect, it } from 'vitest';
import en from '../../../i18n/locales/en.json';
import zhCN from '../../../i18n/locales/zh-CN.json';

describe('operator-specific status copy', () => {
  it('uses the mechanic names published in the Chinese game text', () => {
    expect(zhCN.timeline.passiveUi.appearances).toEqual({
      tangtangDroplets: '涡流',
      laevatainCounter: '熔火',
      zhuangFangyiThunder: '青霆剑',
      arcaneSigils: '破晦',
      liinoMusic: '演唱姿态',
      typhoeaArrows: '猎物清点',
    });
    expect(zhCN.timeline.passiveUi.modes).toEqual({
      normal: '演唱姿态',
      ultimate: '高歌姿态',
    });
    expect(zhCN.timeline.passiveUi.battleArrows).toBe('猎矢');
    expect(zhCN.timeline.passiveUi.points).toBe('启示');
  });

  it('keeps every UI locale on the same detail-copy schema', () => {
    const keys = (value: Record<string, unknown>) => Object.keys(value).sort();
    expect(keys(en.timeline.passiveUi)).toEqual(keys(zhCN.timeline.passiveUi));
    expect(keys(en.timeline.passiveUi.values)).toEqual(keys(zhCN.timeline.passiveUi.values));
    expect(keys(en.timeline.passiveUi.descriptions)).toEqual(
      keys(zhCN.timeline.passiveUi.descriptions),
    );
  });
});
