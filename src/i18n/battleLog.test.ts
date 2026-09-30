import { expect, test } from 'vitest';
import { i18n } from '@/i18n';

test('战斗回执名称和字段在两种语言中同时可用', () => {
  type ReceiptCopy = {
    battleLog: Record<'receiptTypes' | 'receiptFields', Record<string, string>>;
  };
  const zh = (i18n.global.getLocaleMessage('zh-CN') as ReceiptCopy).battleLog;
  const en = (i18n.global.getLocaleMessage('en') as ReceiptCopy).battleLog;
  for (const section of ['receiptTypes', 'receiptFields'] as const) {
    expect(Object.keys(zh[section]).sort()).toEqual(Object.keys(en[section]).sort());
    expect(Object.values(zh[section]).every(Boolean)).toBe(true);
    expect(Object.values(en[section]).every(Boolean)).toBe(true);
  }
});
