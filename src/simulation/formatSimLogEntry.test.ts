import { describe, expect, it } from 'vitest';
import { formatSimLogEntry } from './formatSimLogEntry';
import zh from '@/i18n/locales/zh-CN.json';

function makeT(messages: Record<string, unknown>) {
  const t = (key: string, values?: Record<string, unknown>) => {
    const parts = key.split('.');
    let cur: unknown = messages;
    for (const part of parts) {
      if (!cur || typeof cur !== 'object') return key;
      cur = (cur as Record<string, unknown>)[part];
    }
    if (typeof cur !== 'string') return key;
    if (!values) return cur;
    return cur.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
  };
  const te = (key: string) => t(key) !== key;
  return { t, te };
}

describe('formatSimLogEntry i18n', () => {
  const { t, te } = makeT(zh as Record<string, unknown>);

  it('localizes damage / sp field labels when t/te are provided', () => {
    const line = formatSimLogEntry(
      {
        type: 'DAMAGE_HIT',
        time: 1.2,
        payload: {
          sourceId: 'alpha',
          targetId: 'enemy',
          stagger: 3,
          actionId: 'act_1',
          hitData: { _expectedDamage: 1200, spReturn: 5 },
        },
      } as any,
      {
        t,
        te,
        formatTime: () => '0:36',
        typeLabel: type => (type === 'DAMAGE_HIT' ? '伤害' : type),
        trackName: id => (id === 'alpha' ? '莱万汀' : id),
      },
    );

    expect(line).toContain('[伤害]');
    expect(line).toContain('伤害=1200');
    expect(line).toContain('失衡=3');
    expect(line).toContain('技力+=5');
    expect(line).toContain('莱万汀 -> 敌人');
  });
});
