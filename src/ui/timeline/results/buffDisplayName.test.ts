import { describe, expect, it } from 'vitest';
import {
  collectBuffDisplayNameKeys,
  resolveBuffDisplayName,
  resolveSimpleBuffModifierDisplayName,
  resolveBuffEffectSummary,
} from './buffDisplayName';
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
  it('腐蚀五种等值抗性合并，原生百分点不再乘以 100', () => {
    const translate = { te: () => true, t: () => '全抗性' };
    expect(
      resolveBuffEffectSummary(
        {
          enabled: true,
          attributeEffects: [
            'PhysicalResistance',
            'FireResistance',
            'PulseResistance',
            'CrystResistance',
            'NaturalResistance',
          ].map(attribute => ({ attribute, slot: 'baseAddition', value: -4.44 })),
        },
        translate,
      ),
    ).toBe('全抗性-4.44%');
  });
  it('同槽加值求和，独立乘法相乘，四种法术加成只有聚合后等值才合并', () => {
    const messages: Record<string, string> = {
      'effects.name.artsIntensity': '源石技艺强度',
      'effects.name.dmgBonus:arts': '法术伤害加成',
      'effects.name.ampBonus:arts': '法术增幅',
      'effects.name.susceptibility:arts': '法术脆弱',
      'effects.name.dmgBonus:heat': '灼热伤害加成',
      'effects.name.dmgBonus:cryo': '寒冷伤害加成',
      'effects.name.dmgBonus:electric': '电磁伤害加成',
      'effects.name.dmgBonus:nature': '自然伤害加成',
      'statDetail.atkBonus': '攻击加成',
      'statDetail.attackSlots.finalMultiplier': '独立乘法',
    };
    const translate = { te: (key: string) => key in messages, t: (key: string) => messages[key]! };
    const attributeEffects = [
      ...[16, 16].map(value => ({
        attribute: 'PhysicalAndSpellInflictionEnhance',
        slot: 'baseAddition',
        value,
      })),
      ...['heat', 'cryo', 'electric', 'nature'].flatMap(type =>
        [0.1, 0.2].map(value => ({
          attribute: `${type}DamageIncrease`,
          slot: 'baseAddition',
          value,
        })),
      ),
      ...[1.2, 1.2].map(value => ({ attribute: 'Atk', slot: 'finalMultiplier', value })),
    ];
    expect(
      resolveBuffEffectSummary(
        {
          enabled: true,
          attributeEffects: ['heat', 'cryo', 'electric', 'nature'].map(type => ({
            attribute: `${type}EnhancedDamageIncrease`,
            slot: 'baseAddition',
            value: 0.2,
          })),
        },
        translate,
      ),
    ).toBe('法术增幅+20%');
    expect(
      resolveBuffEffectSummary(
        {
          enabled: true,
          attributeEffects: ['heat', 'cryo', 'electric', 'nature'].map(type => ({
            attribute: `${type}VulnerabilityIncrease`,
            slot: 'baseAddition',
            value: 0.2,
          })),
        },
        translate,
      ),
    ).toBe('法术脆弱+20%');
    expect(resolveBuffEffectSummary({ enabled: true, attributeEffects }, translate)).toBe(
      '源石技艺强度+32\n法术伤害加成+30%\n攻击加成（独立乘法）×1.44',
    );
    expect(
      resolveBuffEffectSummary(
        {
          enabled: true,
          attributeEffects: [
            ...attributeEffects,
            { attribute: 'heatDamageIncrease', slot: 'baseAddition', value: 0.01 },
          ],
        },
        translate,
      ),
    ).toContain('灼热伤害加成+31%');
    expect(
      resolveBuffEffectSummary(
        {
          enabled: true,
          attributeEffects: attributeEffects.filter(
            effect => effect.attribute !== 'natureDamageIncrease',
          ),
        },
        translate,
      ),
    ).not.toContain('法术伤害加成');
  });
  it('伤害规则保留作用方、类型限制与附加条件，不冒充无条件属性', () => {
    const translate = {
      te: () => true,
      t: (key: string, values?: Record<string, string>): string => {
        let value: unknown = zh;
        for (const part of key.split('.')) value = (value as Record<string, unknown>)[part];
        return (value as string).replace('{type}', values?.type ?? '');
      },
    };
    const damageEffects = [
      {
        side: 'defender' as const,
        zone: 'normal',
        addition: 0.168,
        damageTypes: ['heat', 'electric', 'cryo', 'nature'],
        conditional: false,
      },
    ];
    expect(resolveBuffEffectSummary({ enabled: true, damageEffects }, translate)).toBe(
      '受到的法术伤害 +16.8%',
    );
    expect(
      resolveBuffEffectSummary(
        { enabled: true, damageEffects: [{ ...damageEffects[0]!, conditional: true }] },
        translate,
      ),
    ).toContain('仅在附加条件满足时生效');
    expect(
      resolveBuffEffectSummary(
        {
          enabled: true,
          damageEffects: [
            { side: 'defender', zone: 'product', addition: -0.3, conditional: false },
          ],
        },
        translate,
      ),
    ).toBe('受到的伤害 -30%');
    expect(resolveBuffEffectSummary({ enabled: false, damageEffects }, translate)).toBeUndefined();
  });
  it('多属性效果独立列出，禁用候选和无法解释的槽位不冒充生效加成', () => {
    const messages: Record<string, string> = {
      'effects.name.atkPercent': '攻击力%',
      'effects.name.critRate': '暴击率',
      'effects.name.artsIntensity': '源石技艺强度',
      'statDetail.atkBonus': '攻击加成',
      'statDetail.attackSlots.finalMultiplier': '最终阶段：独立乘法',
    };
    const translate = { te: (key: string) => key in messages, t: (key: string) => messages[key]! };
    const segment = {
      enabled: true,
      attributeEffects: [
        { attribute: 'Atk', slot: 'baseMultiplier', value: 0.2 },
        { attribute: 'criticalRate', slot: 'baseAddition', value: 0.1 },
        { attribute: 'PhysicalAndSpellInflictionEnhance', slot: 'baseAddition', value: 35 },
        { attribute: 'Atk', slot: 'finalMultiplier', value: 1.2 },
        { attribute: 'unknown', slot: 'baseAddition', value: 123 },
      ],
    };
    expect(resolveBuffEffectSummary(segment, translate)).toBe(
      '攻击力+20%\n暴击率+10%\n源石技艺强度+35\n攻击加成（最终阶段：独立乘法）×1.2',
    );
    expect(resolveBuffEffectSummary({ ...segment, enabled: false }, translate)).toBeUndefined();
  });
  it('将历史增幅事实显示为属性数值摘要', () => {
    const translate = {
      te: (key: string) => key === 'effects.name.ampBonus:electric',
      t: () => zh.effects.name['ampBonus:electric'],
    };
    expect(
      [0.18, 0.2, 0.22].map(value =>
        resolveSimpleBuffModifierDisplayName(
          {
            attribute: 'electricEnhancedDamageIncrease',
            slot: 'baseAddition',
            value,
          },
          translate,
        ),
      ),
    ).toEqual(['电磁增幅+18%', '电磁增幅+20%', '电磁增幅+22%']);
  });
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
        collectBuffDisplayNameKeys([
          {
            buff_chr_0028_wulfa_normal_bleed: {
              presentation: { nameKey: 'effects.name.razorClawmark' },
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
