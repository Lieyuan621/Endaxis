// Generated from the current native SkillSetting during the same rebuild. Do not edit manually.
import type { SkillSettingsDocument } from '../../core/combat/infliction/skillSettings';
import type { SkillSettingResources } from '../../../packages/game-data-contract/src/skillSettingResources';

export const generatedSkillSettings = {
  schemaVersion: 1,
  revision: '1.5.3@10506507-7',
  data: [
    {
      key: '异常初始伤害倍率',
      values: [1.6, 2.4, 3.2, 4],
      enhanceFormulaKey: 'Damage',
    },
    {
      key: '导电法术伤害提高',
      values: [0.12, 0.16, 0.2, 0.24],
      enhanceFormulaKey: 'Debuff',
    },
    {
      key: '燃烧每跳伤害',
      values: [0.24, 0.36, 0.48, 0.6],
      enhanceFormulaKey: 'Damage',
    },
    {
      key: '腐蚀每跳减抗',
      values: [-0.84, -1.12, -1.4, -1.68],
      enhanceFormulaKey: 'Debuff',
    },
    {
      key: '腐蚀减抗上限',
      values: [-12, -16, -20, -24],
      enhanceFormulaKey: 'Debuff',
    },
    {
      key: '碎冰倍率',
      values: [2.4, 3.6, 4.8, 6],
      enhanceFormulaKey: 'Damage',
    },
    {
      key: '冰冻持续时间',
      values: [6, 7, 8, 9],
      enhanceFormulaKey: '',
    },
    {
      key: '法术爆发伤害倍率',
      values: [1.6, 1.6, 1.6, 1.6],
      enhanceFormulaKey: 'Damage',
    },
    {
      key: '导电持续时间',
      values: [12, 18, 24, 30],
      enhanceFormulaKey: '',
    },
    {
      key: '腐蚀初始减抗',
      values: [-3.6, -4.8, -6, -7.2],
      enhanceFormulaKey: 'Debuff',
    },
    {
      key: '腐蚀持续时间',
      values: [15, 15, 15, 15],
      enhanceFormulaKey: '',
    },
  ],
  enhanceFormulas: [
    {
      key: 'Damage',
      kind: 'linear',
      paramA: 0.01,
    },
    {
      key: 'Debuff',
      kind: 'saturating',
      paramA: 2,
      paramB: 300,
    },
  ],
  resources: {
    atbRecoverInterval: 0.5,
    atbGainEfficiency: 1,
    atbConsumedDefaultUspGainSelf: 0.065,
    atbConsumedDefaultUspGainOther: 0.065,
  },
} as const satisfies SkillSettingsDocument & { readonly resources: SkillSettingResources };
