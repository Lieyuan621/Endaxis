import { describe, expect, test } from 'vitest';
import { i18n } from '@/i18n';

const REQUIRED_GROUPS = {
  elements: ['physical', 'heat', 'cryo', 'electric', 'nature'],
  skillTypes: ['basicAttack', 'battleSkill', 'comboSkill', 'ultimate', 'finalStrike', 'dive'],
  effectKinds: [
    'status',
    'infliction',
    'burst',
    'reaction',
    'physicalStatus',
    'damageHit',
    'damageOverTime',
    'spRecovery',
    'spReturn',
    'ultEnergyGain',
    'consume',
    'oneTime',
    'cooldownReductionFlat',
    'cooldownReductionPercent',
  ],
  reactions: ['combustion', 'electrification', 'solidification', 'corrosion'],
  physicalStatuses: ['breach', 'crush', 'lift', 'knockdown'],
  stackStrategies: ['REFRESH_DURATION', 'INDEPENDENT', 'REPLACE'],
  applyTimings: ['afterDamage', 'beforeDamage'],
  multiplierModes: ['each', 'split'],
  consumeScopes: ['team'],
  fields: [
    'reactionType',
    'treatAsReaction',
    'physicalType',
    'effectiveness',
    'defaultLevel',
    'interval',
    'multiplierMode',
    'scaleByCrit',
    'snapshot',
    'canCrit',
    'skipFirstTick',
    'cancelOnRefresh',
    'consumeStacks',
    'consumeScope',
    'silent',
    'external',
    'forced',
    'condition',
    'stat',
    'target',
    'scaling',
    'requiresInfliction',
    'multiplierScaling',
    'staggerScaling',
    'hit',
    'readConsumedStacks',
    'consumedStatEffects',
    'operatorStatus',
    'enemyStatus',
    'skillTypes',
    'treatAsSkillType',
    'skillId',
    '_condition',
  ],
};

describe('hit editor localization', () => {
  test.each(['zh-CN', 'en', 'ru'])('%s has a shared none label for hit editor selects', locale => {
    const message = i18n.global.getLocaleMessage(locale) as Record<string, any>;

    expect(message.common.none, `${locale}.common.none`).toEqual(expect.any(String));
    expect(message.common.none).not.toBe('');
  });

  test.each(['zh-CN', 'en', 'ru'])('%s has labels for editor enums and fields', locale => {
    const message = i18n.global.getLocaleMessage(locale) as Record<string, unknown>;
    const hitEditor = message.hitEditor as Record<string, string | Record<string, string>>;

    expect(hitEditor.newEffect, `${locale}.hitEditor.newEffect`).toEqual(expect.any(String));
    expect(hitEditor.newEffect).not.toBe('');

    for (const [group, keys] of Object.entries(REQUIRED_GROUPS)) {
      const labels = hitEditor[group] as Record<string, string> | undefined;
      for (const key of keys) {
        expect(labels?.[key], `${locale}.hitEditor.${group}.${key}`).toEqual(expect.any(String));
        expect(labels?.[key]).not.toBe('');
      }
    }
  });

  test('zh-CN uses Endaxis terminology for damage and effect types', () => {
    const message = i18n.global.getLocaleMessage('zh-CN') as Record<string, any>;

    expect(message.hitEditor.elements.heat).toBe('灼热');
    expect(message.hitEditor.elements.cryo).toBe('寒冷');
    expect(message.effects.name.heat_infliction).toBe('灼热附着');
    expect(message.effects.name.cryo_infliction).toBe('寒冷附着');
    expect(message.effects.name.heat_burst).toBe('灼热爆发');
    expect(message.effects.name.cryo_burst).toBe('寒冷爆发');
    expect(message.effects.name.ultEnergyGain).toBe('终结技充能');
    expect(message.effects.group.status).toBe('法术异常');
    expect(message.hitEditor.effectKinds.infliction).toBe('法术附着');
    expect(message.hitEditor.effectKinds.reaction).toBe('法术异常');
    expect(message.hitEditor.effectKinds.physicalStatus).toBe('物理异常');
    expect(message.hitEditor.effectKinds.status).toBe('其他');
    expect(message.hitEditor.fields.reactionType).toBe('异常类型');
    expect(message.hitEditor.fields.treatAsReaction).toBe('视为异常类型');
    expect(message.hitEditor.fields.physicalType).toBe('物理异常类型');
    expect(message.hitEditor.treatAsReaction).toBe('按异常类型处理');
    expect(message.hitEditor.fields.skillTypes).toBe('技能类型');
    expect(message.hitEditor.fields.treatAsSkillType).toBe('视为技能类型');
    expect(message.hitEditor.hide).toBe('隐藏显示');
    expect(message.hitEditor.fields.silent).toBe('不触发连锁');
    expect(message.hitEditor.fields.external).toBe('独立乘区');
    expect(message.hitEditor.fields._condition).toBe('判定点条件');
    expect(message.hitEditor.fields.condition).toBe('效果条件');
    expect(message.hitEditor.fields.target).toBe('效果目标');
    expect(message.effects.group.physical).toBe(message.hitEditor.effectKinds.physicalStatus);
    expect(message.effects.group.status).toBe(message.hitEditor.effectKinds.reaction);
    expect(message.hitEditor.reactions).toMatchObject({
      combustion: '燃烧',
      electrification: '导电',
      solidification: '冻结',
      corrosion: '腐蚀',
    });
    expect(message.hitEditor.physicalStatuses).toMatchObject({
      breach: '碎甲',
      crush: '猛击',
      lift: '击飞',
      knockdown: '倒地',
    });
  });
});
