import {
  requireArray,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

const META = ['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex'];

export interface SkillSettingReadItemSource {
  readonly dataKey: string;
  readonly column: ScalarSource;
  readonly enhanceAttributeSource: TargetReferenceSource;
  readonly storeKey: string;
}

export interface SkillSettingReadActionSource {
  readonly kind: 'readSkillSettingData';
  readonly items: readonly SkillSettingReadItemSource[];
}

export function parseSkillSettingReadActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): SkillSettingReadActionSource {
  const action = requireRecord(value, path);
  requireExactFields(action, new Set([...META, 'dataList']), path);
  return {
    kind: 'readSkillSettingData',
    items: requireArray(action.dataList, `${path}.dataList`).map((value, index) => {
      const itemPath = `${path}.dataList[${index}]`;
      const item = requireRecord(value, itemPath);
      requireExactFields(
        item,
        new Set(['dataKey', 'column', 'enhanceAttributeSource', 'storeKey']),
        itemPath,
      );
      return {
        dataKey: requireNonEmptyString(item.dataKey, `${itemPath}.dataKey`),
        column: parseScalarSource(item.column, `${itemPath}.column`, inheritedBlackboard),
        enhanceAttributeSource: parseTargetReferenceSource(
          item.enhanceAttributeSource,
          `${itemPath}.enhanceAttributeSource`,
        ),
        storeKey: requireNonEmptyString(item.storeKey, `${itemPath}.storeKey`),
      };
    }),
  };
}
