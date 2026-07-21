import { describe, expect, it } from 'vitest';
import {
  formatOperatorBattleLogSummary,
  isEffectOriginDamage,
  shouldIncludeOperatorLogEvent,
} from './normalizeOperatorLogForBattleLog';
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

describe('normalizeOperatorLogForBattleLog', () => {
  const { t, te } = makeT(zh as Record<string, unknown>);

  it('skips continuation and hidden applies', () => {
    expect(shouldIncludeOperatorLogEvent({ type: 'OPERATOR_EFFECT_APPLY' })).toBe(true);
    expect(
      shouldIncludeOperatorLogEvent({ type: 'OPERATOR_EFFECT_APPLY', isContinuation: true }),
    ).toBe(false);
    expect(
      shouldIncludeOperatorLogEvent({
        type: 'OPERATOR_EFFECT_APPLY',
        effect: { hide: true },
      }),
    ).toBe(false);
  });

  it('formats operator effect names via effects.name', () => {
    expect(
      formatOperatorBattleLogSummary(
        {
          type: 'OPERATOR_EFFECT_APPLY',
          payload: { id: 'vulnerability', stacks: 2 },
        },
        t,
        te,
      ),
    ).toBe('破防 ×2');
  });

  it('classifies skill vs effect-origin damage', () => {
    expect(
      isEffectOriginDamage({
        type: 'DAMAGE_HIT',
        payload: { hitData: {} },
      }),
    ).toBe(false);
    expect(
      isEffectOriginDamage({
        type: 'DAMAGE_HIT',
        payload: { hitData: { triggered: true, triggeredBy: 'combustion' } },
      }),
    ).toBe(true);
    expect(
      isEffectOriginDamage({
        type: 'DAMAGE_HIT',
        payload: { hitData: { triggered: true, triggeredBy: 'dot:burn' } },
      }),
    ).toBe(true);
  });
});
