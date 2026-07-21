import { describe, expect, it } from 'vitest';
import {
  formatBattleLogField,
  translateBattleLogElement,
  translateBattleLogSpReason,
  translateBattleLogStatus,
  translateBattleLogTarget,
} from './formatBattleLogLabels';
import zh from '@/i18n/locales/zh-CN.json';

function makeT(messages: Record<string, unknown>) {
  const t = (key: string) => {
    const parts = key.split('.');
    let cur: unknown = messages;
    for (const part of parts) {
      if (!cur || typeof cur !== 'object') return key;
      cur = (cur as Record<string, unknown>)[part];
    }
    return typeof cur === 'string' ? cur : key;
  };
  const te = (key: string) => t(key) !== key;
  return { t, te };
}

describe('formatBattleLogLabels', () => {
  const { t, te } = makeT(zh as Record<string, unknown>);

  it('formats field labels from battleLog.fields', () => {
    expect(formatBattleLogField(t, te, 'damage', 12)).toBe('伤害=12');
    expect(formatBattleLogField(t, te, 'element', '灼热')).toBe('属性=灼热');
  });

  it('reuses hitEditor.elements for element values', () => {
    expect(translateBattleLogElement(t, te, 'heat')).toBe('灼热');
    expect(translateBattleLogElement(t, te, 'physical')).toBe('物理');
  });

  it('reuses effects.name for status/reaction values', () => {
    expect(translateBattleLogStatus(t, te, 'combustion')).toBe('燃烧');
    expect(translateBattleLogStatus(t, te, 'shatter')).toBe('碎冰');
  });

  it('translates sp reasons and enemy target', () => {
    expect(translateBattleLogSpReason(t, te, 'trigger')).toBe('扳机');
    expect(translateBattleLogTarget(t, te, 'enemy')).toBe('敌人');
  });
});
