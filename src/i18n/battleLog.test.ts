import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { i18n } from '@/i18n';

function productionCoreSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionCoreSources(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

describe('battle log localization', () => {
  test('zh-CN localizes cooldown reduction events and generic basic attacks', () => {
    const message = i18n.global.getLocaleMessage('zh-CN') as Record<string, any>;

    expect(message.battleLog.types.CD_REDUCTION).toBe('冷却缩减');
    expect(message.battleLog.ui.cdReductionText).toBe('冷却缩减 {amount}s');
    expect(message.skillType.attack).toBe('普攻');
  });

  test('en includes cdReductionText', () => {
    const en = i18n.global.getLocaleMessage('en') as Record<string, any>;
    expect(en.battleLog.ui.cdReductionText).toContain('{amount}');
  });

  test('runtime interruption and time-dilation receipts have localized labels', () => {
    for (const locale of ['zh-CN', 'en'] as const) {
      const message = i18n.global.getLocaleMessage(locale) as Record<string, any>;
      expect(message.battleLog.receiptTypes.SkillInterrupted).toBeTruthy();
      expect(message.battleLog.receiptTypes.TimeDilationEnded).toBeTruthy();
    }
  });

  test('both languages cover the same receipt labels and debug controls', () => {
    const zh = (i18n.global.getLocaleMessage('zh-CN') as Record<string, any>).battleLog;
    const en = (i18n.global.getLocaleMessage('en') as Record<string, any>).battleLog;
    for (const section of ['receiptTypes', 'receiptFields']) {
      expect(Object.keys(zh[section]).sort()).toEqual(Object.keys(en[section]).sort());
      expect(Object.values(zh[section]).every(Boolean)).toBe(true);
      expect(Object.values(en[section]).every(Boolean)).toBe(true);
    }
    for (const key of ['debugEvents', 'hiddenAutoRecovery', 'rawReceipt']) {
      expect(zh.ui[key]).toBeTruthy();
      expect(en.ui[key]).toBeTruthy();
    }
    expect(zh.receiptDetails.condition).toEqual({ passed: '条件满足', failed: '条件未满足' });
    expect(Object.keys(en.receiptDetails.condition).sort()).toEqual(['failed', 'passed']);
  });

  test('production receipt event literals have localized labels', () => {
    const zh = (i18n.global.getLocaleMessage('zh-CN') as Record<string, any>).battleLog;
    const en = (i18n.global.getLocaleMessage('en') as Record<string, any>).battleLog;
    const corePath = join(dirname(fileURLToPath(import.meta.url)), '..', 'core');
    const eventNames = new Set<string>();
    for (const file of productionCoreSources(corePath)) {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (!/\bevent\s*:|\brecord\(/.test(line)) continue;
        for (const match of line.matchAll(/'([A-Z][A-Za-z]+)'/g)) eventNames.add(match[1]!);
      }
    }
    expect(
      [...eventNames].filter(event => !zh.receiptTypes[event] || !en.receiptTypes[event]).sort(),
    ).toEqual([]);
  });
});
