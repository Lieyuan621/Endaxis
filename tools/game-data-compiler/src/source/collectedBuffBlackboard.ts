import {
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';
import { parseScalarSource, type ScalarSource, type BlackboardLevelValues } from './scalar.ts';

export type CollectedBuffBlackboardActionSource =
  | { readonly kind: 'storeCollectedBuffValue'; readonly key: string; readonly outputKey: string }
  | {
      readonly kind: 'modifyCollectedBuffValue';
      readonly key: string;
      readonly useDirectValue: boolean;
      readonly multiplier: ScalarSource;
      readonly addition: ScalarSource;
      readonly directValue: ScalarSource;
    };

/** 原生收集动作修改的是事件中的 Buff 黑板，不是监听器自己的黑板。 */
export function parseCollectedBuffBlackboardAction(
  value: unknown,
  path: string,
  store: boolean,
  inheritedBlackboard: BlackboardLevelValues,
): CollectedBuffBlackboardActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'blackboardKey',
      ...(store ? ['storeKey'] : ['useDirectValue', 'multiplier', 'addition', 'directValue']),
    ]),
    path,
  );
  const key = requireNonEmptyString(action.blackboardKey, `${path}.blackboardKey`);
  return store
    ? {
        kind: 'storeCollectedBuffValue',
        key,
        outputKey: requireNonEmptyString(action.storeKey, `${path}.storeKey`),
      }
    : {
        kind: 'modifyCollectedBuffValue',
        key,
        useDirectValue: requireBoolean(action.useDirectValue, `${path}.useDirectValue`),
        multiplier: parseScalarSource(action.multiplier, `${path}.multiplier`, inheritedBlackboard),
        addition: parseScalarSource(action.addition, `${path}.addition`, inheritedBlackboard),
        directValue: parseScalarSource(
          action.directValue,
          `${path}.directValue`,
          inheritedBlackboard,
        ),
      };
}
