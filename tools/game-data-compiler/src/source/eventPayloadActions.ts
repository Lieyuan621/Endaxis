import { requireExactFields, requireRecord, requireString } from './primitives.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

export interface SaveAtbObtainValueActionSource {
  readonly kind: 'saveAtbObtainValue';
  /** OnObtainAtb.Value：效率结算后、共享技力上限截断前的值。 */
  readonly valueKey: string;
  /** OnObtainAtb.RealDelta：共享技力实际变化量。 */
  readonly realDeltaKey: string;
}

export interface SaveHealValueActionSource {
  readonly kind: 'saveHealValue';
  /** HealEventData.FinalHealValue：修正后的请求治疗量。 */
  readonly finalHealKey: string;
  /** HealEventData.RealHealValue：生命上限截断后的实际治疗量。 */
  readonly realHealKey: string;
}

export interface SaveShieldValueActionSource {
  readonly kind: 'saveShieldValue';
  readonly target: TargetReferenceSource;
  readonly valueType: 'GainedValue' | 'CurValue';
  readonly outputKey: string;
}

export function parseSaveShieldValueActionSource(
  value: unknown,
  path: string,
): SaveShieldValueActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'shieldValue',
      'valueType',
      'bbKey',
    ]),
    path,
  );
  const valueType = requireString(action.valueType, `${path}.valueType`);
  if (valueType !== 'GainedValue' && valueType !== 'CurValue') {
    throw new TypeError(`${path}.valueType: unsupported shield value ${JSON.stringify(valueType)}`);
  }
  return {
    kind: 'saveShieldValue',
    target: parseTargetReferenceSource(action.shieldValue, `${path}.shieldValue`),
    valueType,
    outputKey: requireString(action.bbKey, `${path}.bbKey`),
  };
}

export function parseSaveHealValueActionSource(
  value: unknown,
  path: string,
): SaveHealValueActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'finalHealKey',
      'realHealKey',
    ]),
    path,
  );
  return {
    kind: 'saveHealValue',
    finalHealKey: requireString(action.finalHealKey, `${path}.finalHealKey`),
    realHealKey: requireString(action.realHealKey, `${path}.realHealKey`),
  };
}

/** 严格读取原生 SaveAtbObtainValue；空键表示不写入相应字段。 */
export function parseSaveAtbObtainValueActionSource(
  value: unknown,
  path: string,
): SaveAtbObtainValueActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'valueKey',
      'realDeltaKey',
    ]),
    path,
  );
  return {
    kind: 'saveAtbObtainValue',
    valueKey: requireString(action.valueKey, `${path}.valueKey`),
    realDeltaKey: requireString(action.realDeltaKey, `${path}.realDeltaKey`),
  };
}
