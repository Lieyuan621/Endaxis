import { parseAttributeTypeValue, type AttributeTypeSource } from './attributeModifiers.ts';
import {
  COMPARISON_OPERATORS,
  type ComparisonOperator,
} from '../../../../packages/game-data-contract/src/primitives.ts';
import {
  requireExactFields,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';

const CONDITION_FIELDS = new Set([
  'compareOp',
  'condId',
  'condType',
  'leftAttrType',
  'rightAttrType',
  'toastText',
]);

export const COMPARE_OPERATORS = COMPARISON_OPERATORS;
export type CompareOperatorSource = ComparisonOperator;

/** SkillConditionTable 中一条原生条件；condType 保留原生整数身份。 */
export interface SkillConditionSource {
  readonly sourcePath: string;
  readonly conditionId: string;
  readonly conditionType: number;
  readonly operator: CompareOperatorSource;
  readonly leftAttribute: AttributeTypeSource;
  readonly rightAttribute: AttributeTypeSource;
}

export function parseSkillConditionSources(
  value: unknown,
  conditionIds?: readonly string[],
  sourceName = 'SkillConditionTable',
): SkillConditionSource[] {
  const table = requireRecord(value, sourceName);
  const selectedIds = conditionIds ?? Object.keys(table);
  if (new Set(selectedIds).size !== selectedIds.length) {
    throw new Error('conditionIds: duplicate condition ID');
  }
  return selectedIds.map(conditionId => {
    const sourcePath = `${sourceName}.${conditionId}`;
    const row = requireRecord(table[conditionId], sourcePath);
    requireExactFields(row, CONDITION_FIELDS, sourcePath);
    const embeddedId = requireNonEmptyString(row.condId, `${sourcePath}.condId`);
    if (embeddedId !== conditionId) {
      throw new Error(`${sourcePath}.condId: expected ${JSON.stringify(conditionId)}`);
    }
    const compareIndex = requireNonNegativeInteger(row.compareOp, `${sourcePath}.compareOp`);
    const operator = COMPARE_OPERATORS[compareIndex];
    if (operator === undefined) {
      throw new Error(`${sourcePath}.compareOp: unknown CompareOperator ${compareIndex}`);
    }
    validateI18nText(row.toastText, `${sourcePath}.toastText`);
    return {
      sourcePath,
      conditionId,
      conditionType: requireNonNegativeInteger(row.condType, `${sourcePath}.condType`),
      operator,
      leftAttribute: parseAttributeTypeValue(row.leftAttrType, `${sourcePath}.leftAttrType`),
      rightAttribute: parseAttributeTypeValue(row.rightAttrType, `${sourcePath}.rightAttrType`),
    };
  });
}

function validateI18nText(value: unknown, path: string): void {
  const row = requireRecord(value, path);
  requireExactFields(row, new Set(['id', 'text']), path);
  requireNumber(row.id, `${path}.id`);
  requireString(row.text, `${path}.text`);
}
