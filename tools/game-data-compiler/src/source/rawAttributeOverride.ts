import {
  parseAttributeTypeValue,
  parseAttributeTypeName,
  type AttributeTypeSource,
} from './attributeModifiers.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import { requireArray, requireExactFields, requireRecord } from './primitives.ts';

export interface RawAttributeOverrideSource {
  readonly target: TargetReferenceSource;
  readonly attributes: readonly {
    readonly attribute: AttributeTypeSource;
    readonly value: ScalarSource;
  }[];
}

export function parseRawAttributeOverrideSource(
  value: unknown,
  path: string,
  blackboard: BlackboardLevelValues,
): RawAttributeOverrideSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'targetSettings',
      'attributeOverrides',
    ]),
    path,
  );
  return {
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    attributes: requireArray(action.attributeOverrides, `${path}.attributeOverrides`).map(
      (raw, index) => {
        const entryPath = `${path}.attributeOverrides[${index}]`;
        const entry = requireRecord(raw, entryPath);
        requireExactFields(entry, new Set(['attributeType', 'overrideValue']), entryPath);
        return {
          attribute:
            typeof entry.attributeType === 'string'
              ? parseAttributeTypeName(entry.attributeType, `${entryPath}.attributeType`)
              : parseAttributeTypeValue(entry.attributeType, `${entryPath}.attributeType`),
          value: parseScalarSource(entry.overrideValue, `${entryPath}.overrideValue`, blackboard),
        };
      },
    ),
  };
}
