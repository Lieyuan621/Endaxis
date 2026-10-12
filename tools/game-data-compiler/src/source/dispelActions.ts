import {
  requireBoolean,
  requireExactFields,
  requireRecord,
  requireNonNegativeInteger,
} from './primitives.ts';
import { parseTagQuerySource, type TagQuerySource } from './tagQuery.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

export interface DispelActionSource {
  readonly kind: 'dispel';
  readonly dispelSource: TargetReferenceSource;
  readonly dispelTargets: TargetReferenceSource;
  readonly dispelLevel: number;
  readonly checkTag: boolean;
  readonly tagQuery: TagQuerySource;
}

/** 严格保存原生驱散来源、目标、等级与启用位；未启用查询时仍保留残留来源事实。 */
export function parseDispelActionSource(value: unknown, path: string): DispelActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'dispelSource',
      'dispelTargets',
      'dispelLevel',
      'checkTag',
      'tagQuery',
    ]),
    path,
  );
  return {
    kind: 'dispel',
    dispelSource: parseTargetReferenceSource(action.dispelSource, `${path}.dispelSource`),
    dispelTargets: parseTargetReferenceSource(action.dispelTargets, `${path}.dispelTargets`),
    dispelLevel: parseDispelLevel(action.dispelLevel, `${path}.dispelLevel`),
    checkTag: requireBoolean(action.checkTag, `${path}.checkTag`),
    tagQuery: parseTagQuerySource(action.tagQuery, `${path}.tagQuery`),
  };
}

/** 原生当前唯一命名等级为 Default，也接受资源中的整数枚举值。 */
export function parseDispelLevel(value: unknown, path: string): number {
  return value === 'Default' ? 0 : requireNonNegativeInteger(value, path);
}

export function parseBuffDispelLevel(value: unknown, path: string): number | null {
  const config = requireRecord(value, path);
  requireExactFields(config, new Set(['canBeDispelled', 'dispelledLevel']), path);
  const enabled = requireBoolean(config.canBeDispelled, `${path}.canBeDispelled`);
  const level = parseDispelLevel(config.dispelledLevel, `${path}.dispelledLevel`);
  return enabled ? level : null;
}
