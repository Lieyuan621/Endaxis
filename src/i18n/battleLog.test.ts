import { describe, expect, test } from 'vitest';
import { i18n } from '@/i18n';

describe('battle log localization', () => {
  test('zh-CN localizes cooldown reduction events and generic basic attacks', () => {
    const message = i18n.global.getLocaleMessage('zh-CN') as Record<string, any>;

    expect(message.battleLog.types.CD_REDUCTION).toBe('冷却缩减');
    expect(message.battleLog.ui.cdReductionText).toBe('冷却缩减 {amount}s');
    expect(message.skillType.attack).toBe('普攻');
  });

  test('en/ru include cdReductionText', () => {
    const en = i18n.global.getLocaleMessage('en') as Record<string, any>;
    const ru = i18n.global.getLocaleMessage('ru') as Record<string, any>;
    expect(en.battleLog.ui.cdReductionText).toContain('{amount}');
    expect(ru.battleLog.ui.cdReductionText).toContain('{amount}');
  });
});
