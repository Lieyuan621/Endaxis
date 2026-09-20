import { requireBoolean, requireExactFields, requireRecord, requireString } from './primitives.ts';
import { parseTagQuerySource, type TagQuerySource } from './tagQuery.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

export interface DispelActionSource {
  readonly kind: 'dispel';
  readonly dispelSource: TargetReferenceSource;
  readonly dispelTargets: TargetReferenceSource;
  readonly dispelLevel: string;
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
    dispelLevel: requireString(action.dispelLevel, `${path}.dispelLevel`),
    checkTag: requireBoolean(action.checkTag, `${path}.checkTag`),
    tagQuery: parseTagQuerySource(action.tagQuery, `${path}.tagQuery`),
  };
}
