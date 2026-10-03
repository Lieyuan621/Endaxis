import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated.ts';
import type { NodeFieldSchema } from '../action-graph/nodeSchema';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import type { FieldSemantics } from './fieldSemantics';

export type BlackboardMappingValue = 'levels' | 'operand' | 'levelsOrOperand' | 'string' | 'copy';
export type BlackboardMappingDestination =
  | 'childAction'
  | 'childEntity'
  | 'buff'
  | 'exitBuff'
  | 'globalBuffChild'
  | 'abilityEntity'
  | 'globalBuff'
  | 'macroArguments';

export interface BlackboardMappingDescriptor {
  readonly value: BlackboardMappingValue;
  readonly destination: BlackboardMappingDestination;
  readonly allowsParameters?: boolean;
}

/** Only these exact contract declarations have mapping semantics. Deriving source locations
 * from the generated schemas makes moving a declaration safe, without treating every field
 * called initialValues/blackboardAssignments (or a container's child) as a mapping.
 */
const declarations = [
  ['withActionBlackboardScope', 'initialValues', 'levels', 'childAction'],
  ['withActionBlackboardScope', 'entityInitialValues', 'levels', 'childEntity'],
  ['withActionBlackboardScope', 'entityAssignments', 'operand', 'childEntity'],
  ['applyBuff', 'blackboardAssignments', 'levelsOrOperand', 'buff'],
  ['applyBuff', 'stringBlackboardAssignments', 'string', 'buff'],
  ['applyBuff', 'copiedBlackboardAssignments', 'copy', 'buff'],
  ['spawnAbilityEntity', 'blackboardAssignments', 'operand', 'abilityEntity'],
  ['spawnAbilityEntity', 'stringBlackboardAssignments', 'string', 'abilityEntity'],
  ['createGlobalBuff', 'blackboardAssignments', 'operand', 'globalBuff'],
  ['callMacro', 'arguments', 'operand', 'macroArguments'],
] as const;

function hasAlias(semantics: FieldSemantics | undefined, alias: string): boolean {
  return Boolean(
    semantics?.aliases?.some(value => value === alias) ||
    semantics?.unionVariants?.some(value => hasAlias(value, alias)),
  );
}

function matchesValue(semantics: FieldSemantics | undefined, value: BlackboardMappingValue) {
  if (!semantics) return false;
  if (value === 'string' || value === 'copy') return semantics.type === 'string';
  const levels = hasAlias(semantics, 'LevelValues');
  const operand = hasAlias(semantics, 'ActionValueOperand');
  return value === 'levels'
    ? levels && !operand
    : value === 'operand'
      ? operand && !levels
      : levels && operand;
}

export function resolveBlackboardMapping(
  schema: NodeFieldSchema | DefinitionFieldSchema,
  name?: string,
): BlackboardMappingDescriptor | undefined {
  const node = 'control' in schema;
  const fieldName = name ?? (node ? schema.path.at(-1) : undefined);
  if (!schema.semantics?.recordValue || !schema.source?.length) return undefined;
  if (!node && schema.kind !== 'record') return undefined;
  // Exit Buff assignments have a distinct declaration and operand-only numeric values.
  if (
    !node &&
    ['blackboardAssignments', 'stringBlackboardAssignments'].includes(String(fieldName))
  ) {
    const root = actionNodeSchemas.applyBuff.fields.find(
      field => field.path.at(-1) === 'onActionEndBuffs',
    )?.valueSchema;
    const formal =
      root?.kind === 'array' && root.element.kind === 'object'
        ? root.element.fields[String(fieldName)]
        : undefined;
    const value = fieldName === 'blackboardAssignments' ? 'operand' : 'string';
    if (
      formal?.source?.some(source => schema.source?.includes(source)) &&
      matchesValue(schema.semantics.recordValue, value)
    )
      return { value, destination: 'exitBuff' };
  }
  if (
    !node &&
    fieldName === 'blackboardAssignments' &&
    matchesValue(schema.semantics.recordValue, 'operand')
  ) {
    const root = actionNodeSchemas.createGlobalBuff.fields.find(
      field => field.path.at(-1) === 'definition',
    )?.valueSchema;
    const children = root?.kind === 'object' ? root.fields.children : undefined;
    const formal =
      children?.kind === 'array' && children.element.kind === 'object'
        ? children.element.fields.blackboardAssignments
        : undefined;
    if (formal?.source?.some(source => schema.source?.includes(source)))
      return { value: 'operand', destination: 'globalBuffChild' };
  }
  for (const [kind, field, value, destination] of declarations) {
    if (fieldName !== field || !matchesValue(schema.semantics.recordValue, value)) continue;
    const path = kind === 'callMacro' ? [field] : ['parameters', field];
    if (node && schema.path.join('.') !== path.join('.')) continue;
    const original = actionNodeSchemas[kind].fields.find(
      candidate => candidate.path.join('.') === path.join('.'),
    );
    if (original?.source?.some(source => schema.source?.includes(source)))
      return { value, destination, ...(kind === 'callMacro' ? { allowsParameters: false } : {}) };
  }
  return undefined;
}
