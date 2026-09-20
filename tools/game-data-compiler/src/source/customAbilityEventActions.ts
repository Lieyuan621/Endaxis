import { requireExactFields, requireRecord, requireString } from './primitives.ts';
import {
  parseScalarSource,
  parseStringScalarSource,
  type BlackboardLevelValues,
} from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

export interface TriggerCustomAbilityEventSource {
  readonly kind: 'triggerCustomAbilityEvent';
  readonly eventSource: TargetReferenceSource;
  readonly targets: TargetReferenceSource;
  readonly eventName: ReturnType<typeof parseStringScalarSource>;
  readonly eventParam: ReturnType<typeof parseScalarSource>;
}

export function parseTriggerCustomAbilityEventSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): TriggerCustomAbilityEventSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'eventSource',
      'targets',
      'eventName',
      'eventParam',
    ]),
    path,
  );
  return {
    kind: 'triggerCustomAbilityEvent',
    eventSource: parseTargetReferenceSource(action.eventSource, `${path}.eventSource`),
    targets: parseTargetReferenceSource(action.targets, `${path}.targets`),
    eventName: parseStringScalarSource(action.eventName, `${path}.eventName`),
    eventParam: parseScalarSource(action.eventParam, `${path}.eventParam`, inheritedBlackboard),
  };
}

export interface CheckCustomAbilityEventSource {
  readonly kind: 'customAbilityEvent';
  readonly eventName: ReturnType<typeof parseStringScalarSource>;
  readonly savedParamKey: string;
}

export function parseCheckCustomAbilityEventSource(
  value: unknown,
  path: string,
): CheckCustomAbilityEventSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'eventName',
      'savedParamKey',
    ]),
    path,
  );
  return {
    kind: 'customAbilityEvent',
    eventName: parseStringScalarSource(action.eventName, `${path}.eventName`),
    savedParamKey: requireString(action.savedParamKey, `${path}.savedParamKey`),
  };
}
