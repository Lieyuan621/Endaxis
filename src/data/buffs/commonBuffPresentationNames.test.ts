import { describe, expect, it } from 'vitest';
import zhCN from '../../i18n/locales/zh-CN.json';
import en from '../../i18n/locales/en.json';
import { commonBuffPresentationNameKeys } from './generated/commonBuffPresentationNames.generated';

describe('公共 Buff 展示名称配置', () => {
  it('所有配置名称在两种产品语言中都有 i18n 文本', () => {
    for (const nameKey of Object.values(commonBuffPresentationNameKeys)) {
      expect(zhCN.effects.name).toHaveProperty(nameKey);
      expect(en.effects.name).toHaveProperty(nameKey);
    }
  });
});
