import { describe, expect, test } from 'vitest';
import { i18n } from '@/i18n';
import { PHYSICAL_STATUS_TYPES, TREAT_AS_REACTION_TYPES } from '@/data/enums';

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
    'stacksFromConsume',
    '_condition',
  ],
};

/** Anomaly / physical keys share `effects.name` with the rest of the app — no hitEditor copy. */
const EFFECT_NAME_KEYS = Object.freeze([
  ...TREAT_AS_REACTION_TYPES,
  ...PHYSICAL_STATUS_TYPES,
]);

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
    expect(hitEditor.reactions, `${locale}.hitEditor.reactions`).toBeUndefined();
    expect(hitEditor.physicalStatuses, `${locale}.hitEditor.physicalStatuses`).toBeUndefined();
    expect(
      (message.battleLog as { effectNames?: unknown })?.effectNames,
      `${locale}.battleLog.effectNames`,
    ).toBeUndefined();
    expect(
      (message.hitDetail as { reaction?: unknown })?.reaction,
      `${locale}.hitDetail.reaction`,
    ).toBeUndefined();

    for (const [group, keys] of Object.entries(REQUIRED_GROUPS)) {
      const labels = hitEditor[group] as Record<string, string> | undefined;
      for (const key of keys) {
        expect(labels?.[key], `${locale}.hitEditor.${group}.${key}`).toEqual(expect.any(String));
        expect(labels?.[key]).not.toBe('');
      }
    }

    const effectNames = (message.effects as { name?: Record<string, string> })?.name || {};
    for (const key of EFFECT_NAME_KEYS) {
      expect(effectNames[key], `${locale}.effects.name.${key}`).toEqual(expect.any(String));
      expect(effectNames[key]).not.toBe('');
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
    expect(message.hitEditor.fields.skillTypes).toBe('技能类型');
    expect(message.hitEditor.fields.treatAsSkillType).toBe('视为技能类型');
    expect(message.hitEditor.title).toBe('命中 {index}');
    expect(message.hitEditor.hide).toBe('隐藏显示');
    expect(message.hitEditor.fields.silent).toBe('不触发连锁');
    expect(message.hitEditor.fields.external).toBe('独立乘区');
    expect(message.hitEditor.fields._condition).toBe('判定点条件');
    expect(message.hitEditor.fields.condition).toBe('效果条件');
    expect(message.hitEditor.fields.target).toBe('效果目标');
    expect(message.effects.group.physical).toBe(message.hitEditor.effectKinds.physicalStatus);
    expect(message.effects.group.status).toBe(message.hitEditor.effectKinds.reaction);
    expect(message.effects.name).toMatchObject({
      combustion: '燃烧',
      electrification: '导电',
      solidification: '冻结',
      corrosion: '腐蚀',
      shatter: '碎冰',
      vulnerability: '破防',
      breach: '碎甲',
      crush: '猛击',
      lift: '击飞',
      knockdown: '倒地',
    });
  });
});
