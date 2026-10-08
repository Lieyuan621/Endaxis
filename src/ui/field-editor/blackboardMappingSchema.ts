import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated.ts';
import type { NodeFieldSchema } from '../action-graph/nodeSchema';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import { hasSemanticAlias, sameFieldDeclaration } from '../../core/editor/fieldSemantics.ts';

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
}

/** 仅正式声明具有映射角色；同名字段、错误宿主路径和容器子槽不能获得映射能力。 */
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

function matchesValue(schema: DefinitionFieldSchema, value: BlackboardMappingValue) {
  if (value === 'string' || value === 'copy') return schema.kind === 'string';
  const semantics = schema.semantics;
  const levels = hasSemanticAlias(semantics, 'LevelValues');
  const operand = hasSemanticAlias(semantics, 'ActionValueOperand');
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
  const shape = node ? schema.valueSchema : schema;
  if (shape.kind !== 'record' || !shape.declaration) return undefined;
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
    if (sameFieldDeclaration(formal, shape) && matchesValue(shape.value, value))
      return { value, destination: 'exitBuff' };
  }
  if (!node && fieldName === 'blackboardAssignments' && matchesValue(shape.value, 'operand')) {
    const root = actionNodeSchemas.createGlobalBuff.fields.find(
      field => field.path.at(-1) === 'definition',
    )?.valueSchema;
    const children = root?.kind === 'object' ? root.fields.children : undefined;
    const formal =
      children?.kind === 'array' && children.element.kind === 'object'
        ? children.element.fields.blackboardAssignments
        : undefined;
    if (sameFieldDeclaration(formal, shape))
      return { value: 'operand', destination: 'globalBuffChild' };
  }
  for (const [kind, field, value, destination] of declarations) {
    if (fieldName !== field || !matchesValue(shape.value, value)) continue;
    const path = kind === 'callMacro' ? [field] : ['parameters', field];
    if (node && schema.path.join('.') !== path.join('.')) continue;
    const original = actionNodeSchemas[kind].fields.find(
      candidate => candidate.path.join('.') === path.join('.'),
    );
    if (sameFieldDeclaration(original?.valueSchema, shape)) return { value, destination };
  }
  return undefined;
}
