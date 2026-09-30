import { describe, expect, it } from 'vitest';
import { collectOperatorBuffDisplayNameKeys, resolveBuffDisplayName } from './buffDisplayName';
import { compoundStatusFactories } from '../../../data/buffs/compoundStatusFactories';
import zh from '../../../i18n/locales/zh-CN.json';

const messages: Readonly<Record<string, string>> = {
  'effects.name.susceptibility:physical': '物理脆弱',
  'effects.name.lift': '击飞',
  'effects.name.combustion': '燃烧',
  'effects.name.electrification': '导电',
  'effects.name.solidification': '冻结',
  'effects.name.corrosion': '腐蚀',
};
const i18n = {
  te: (key: string) => messages[key] !== undefined,
  t: (key: string) => messages[key] ?? key,
};

describe('Buff display name', () => {
  it('names global modifiers without exposing the internal Buff ID', () => {
    expect(
      resolveBuffDisplayName('scenario:custom-values', {
        te: key => key === 'timeline.globalModifiers.title',
        t: () => zh.timeline.globalModifiers.title,
      }),
    ).toBe(zh.timeline.globalModifiers.title);
  });
  it('translates Razor Clawmark before falling back to its source', () => {
    expect(
      resolveBuffDisplayName(
        'buff_chr_0028_wulfa_normal_bleed',
        {
          te: key => key === 'effects.name.razorClawmark',
          t: () => zh.effects.name.razorClawmark,
        },
        undefined,
        '洛茜',
        collectOperatorBuffDisplayNameKeys([
          {
            buffDisplayNameKeys: {
              buff_chr_0028_wulfa_normal_bleed: 'effects.name.razorClawmark',
            },
          },
        ]),
      ),
    ).toBe(zh.effects.name.razorClawmark);
  });
  it('按输入元素命名复合状态及其产物', () => {
    const names = { heat: '燃烧', electric: '导电', cryo: '冻结', nature: '腐蚀' };
    for (const [element, name] of Object.entries(names)) {
      const factory = compoundStatusFactories.factories.find(
        candidate => candidate.incomingElement === element,
      );
      expect(factory, element).toBeDefined();
      if (factory === undefined) continue;
      for (const id of [factory.id, factory.createdBuff.buffId]) {
        expect(resolveBuffDisplayName(id, i18n, undefined, '来源技能')).toBe(name);
      }
    }
    expect(resolveBuffDisplayName('buff_common_pulse_natural_triggered', i18n)).toBe('导电');
    expect(resolveBuffDisplayName('buff_common_pulse_unknown_triggered', i18n)).toBe(
      'buff_common_pulse_unknown_triggered',
    );
  });
  it('appends a strict single attribute summary after the source name', () => {
    expect(
      resolveBuffDisplayName(
        'buff:test',
        i18n,
        { attribute: 'physicalVulnerabilityIncrease', slot: 'baseAddition', value: 0.1 },
        '触发技能',
      ),
    ).toBe('触发技能 · 物理脆弱+10%');
  });

  it('uses the triggering definition name when no explicit or safe automatic name exists', () => {
    expect(
      resolveBuffDisplayName(
        'buff:test',
        i18n,
        { attribute: 'unknown', slot: 'baseAddition', value: 1 },
        '触发天赋',
      ),
    ).toBe('触发天赋');
  });

  it('uses a configured common Buff name instead of the source name', () => {
    expect(resolveBuffDisplayName('buff_physical_airborne', i18n, undefined, '某个技能名称')).toBe(
      '击飞',
    );
  });

  it('uses the attribute summary alone when the triggering source has no display name', () => {
    expect(
      resolveBuffDisplayName('buff:test', i18n, {
        attribute: 'physicalVulnerabilityIncrease',
        slot: 'baseAddition',
        value: 0.1,
      }),
    ).toBe('物理脆弱+10%');
  });
});

it('keeps user-defined Buff names literal even when they look like translation keys', () => {
  expect(
    resolveBuffDisplayName(
      'custom',
      { te: () => true, t: () => 'translated' },
      undefined,
      undefined,
      new Map([['custom', { text: 'effects.name.atkPercent' }]]),
    ),
  ).toBe('effects.name.atkPercent');
});
