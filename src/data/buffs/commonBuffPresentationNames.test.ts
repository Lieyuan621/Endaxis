import { describe, expect, it } from 'vitest';
import zhCN from '../../i18n/locales/zh-CN/common.json';
import en from '../../i18n/locales/en/common.json';
import { commonBuffDefinitions } from './commonDefinitions';
import { elementalAttachments } from './elementalAttachments';

describe('公共 Buff 展示名称配置', () => {
  it('所有配置名称在两种产品语言中都有 i18n 文本', () => {
    for (const buff of [...Object.values(commonBuffDefinitions), ...elementalAttachments.buffs]) {
      const key = buff.presentation?.nameKey;
      if (!key) continue;
      const nameKey = key.replace(/^effects\.name\./, '');
      expect(zhCN.effects.name).toHaveProperty(nameKey);
      expect(en.effects.name).toHaveProperty(nameKey);
    }
  });
});
