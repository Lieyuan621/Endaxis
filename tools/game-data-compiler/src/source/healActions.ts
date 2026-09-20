import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseNativeCalculationSource, type NativeCalculationSource } from './calculation.ts';
import type { BlackboardLevelValues } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

const ACTION_META_FIELDS = [
  '$type',
  'isEnable',
  'priorityLevel',
  'priorityOffset',
  'serverActionIndex',
];

export type HealCalculationSource = NativeCalculationSource;

export interface HealActionSource {
  readonly kind: 'heal';
  readonly alwaysNext: boolean;
  readonly healType: string;
  readonly healer: string;
  readonly contextKey: string;
  readonly target: TargetReferenceSource;
  readonly calculation: HealCalculationSource;
  readonly showHealText: boolean;
  readonly playHealEffect: boolean;
  /** 表现层使用的原生治疗特效身份；战斗编译不得丢弃。 */
  readonly effectName: string;
  readonly onlyPlayEffectOnActualHeal: boolean;
  readonly useHealTags: boolean;
  readonly healTagIds: readonly number[];
}

/**
 * 读取 HealAction 的公共来源事实。庞大的特效对象不进入战斗公式，但用于渲染的
 * effectName 与顶层播放开关必须保留，不能因其不参与数值模拟而丢失。
 */
export function parseHealActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): HealActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'alwaysNext',
      'healType',
      'healer',
      'contextKey',
      'target',
      'healCalculation',
      'showHealText',
      'playHealEffect',
      'effectData',
      'onlyPlayEffectOnActualHeal',
      'useHealTags',
      'healTags',
    ]),
    path,
  );
  const effectData = requireRecord(action.effectData, `${path}.effectData`);
  const useHealTags = requireBoolean(action.useHealTags, `${path}.useHealTags`);
  return {
    kind: 'heal',
    alwaysNext: requireBoolean(action.alwaysNext, `${path}.alwaysNext`),
    healType: requireNonEmptyString(action.healType, `${path}.healType`),
    healer: requireNonEmptyString(action.healer, `${path}.healer`),
    contextKey: requireString(action.contextKey, `${path}.contextKey`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    calculation: parseNativeCalculationSource(
      action.healCalculation,
      `${path}.healCalculation`,
      inheritedBlackboard,
    ),
    showHealText: requireBoolean(action.showHealText, `${path}.showHealText`),
    playHealEffect: requireBoolean(action.playHealEffect, `${path}.playHealEffect`),
    effectName: requireString(effectData.effectName, `${path}.effectData.effectName`),
    onlyPlayEffectOnActualHeal: requireBoolean(
      action.onlyPlayEffectOnActualHeal,
      `${path}.onlyPlayEffectOnActualHeal`,
    ),
    useHealTags,
    healTagIds: parseHealTags(action.healTags, `${path}.healTags`),
  };
}

function parseHealTags(value: unknown, path: string): number[] {
  const tags = requireRecord(value, path);
  requireExactFields(tags, new Set(['predefinedTag']), path);
  return requireArray(tags.predefinedTag, `${path}.predefinedTag`).map((rawTag, index) => {
    const tagPath = `${path}.predefinedTag[${index}]`;
    const tag = requireRecord(rawTag, tagPath);
    requireExactFields(tag, new Set(['tagId']), tagPath);
    if (typeof tag.tagId !== 'number' || !Number.isInteger(tag.tagId)) {
      throw new Error(`${tagPath}.tagId: expected integer`);
    }
    return tag.tagId;
  });
}
