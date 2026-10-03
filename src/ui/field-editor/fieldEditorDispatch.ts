import { spawnDefinitionResources } from './spawnDefinitionSchema';
import { graphSequenceBoundaries } from './graphSequenceContainerSchema';
import { graphOperandSchemas, isSkillSettingValuesSchema } from './graphOperandContainerSchema';
import { supportsStructuredValue, isReadonlyDefinitionSlot } from './structuredValueSchema';
import { stringCollectionDescriptor } from './stringCollectionSchema';
import { isConditionListField } from './conditionListSchema';
import { resolveBlackboardMapping } from './blackboardMappingSchema';
import type { NodeFieldSchema } from '../action-graph/nodeSchema';
import {
  resolveDefinitionSchema,
  EMPTY_SCHEMA_REFERENCES,
} from '../../core/editor/resolveDefinitionSchema';
import type {
  DefinitionFieldSchema,
  DefinitionSchemaReferences,
} from '../definition-editor/fieldSchema';
import { referenceKindForDeclaration } from '../definition-editor/fieldInputConfig';
import type { FieldFallbackReason, FieldSemanticAlias, FieldSemantics } from './fieldSemantics';

export interface FieldEditorContext {
  readonly nodeKind?: string;
  readonly graphOperand?: boolean;
  readonly references?: DefinitionSchemaReferences;
  readonly name?: string;
  /** An explicit family inherited by an array/record value or selected union branch. */
  readonly referenceKind?: string;
  readonly editable?: boolean;
  /** The host knows whether this is an existing protected identity or a new declaration. */
  readonly protectedIdentity?: boolean;
}

export interface FieldEditorResolution {
  readonly control:
    | DefinitionFieldSchema['kind']
    | NodeFieldSchema['control']
    | 'reference'
    | 'stringOperand'
    | 'blackboardMapping'
    | 'conditionList'
    | 'stringCollection'
    | 'gameplayTag'
    | 'structuredValue'
    | 'inlineCondition'
    | 'inlineOperand'
    | 'graphOperand'
    | 'skillSettingValues';
  readonly semantic:
    | 'timeScaleCurve'
    | 'nativeId'
    | 'plain'
    | 'reference'
    | 'identity'
    | 'levelValues'
    | 'stringOperand'
    | 'valueOperand'
    | 'combatCondition'
    | 'combatConditionList'
    | 'buildCondition'
    | 'graph'
    | 'tuple'
    | 'gameplayTag';
  readonly view: 'value' | 'reference' | 'structure' | 'navigation' | 'readonly';
  readonly edit: 'field' | 'recursive' | 'json' | 'none';
  readonly referenceKind?: string;
  readonly fallback?: FieldFallbackReason;
  readonly readonly: boolean;
}

/** Union alternatives describe this value; container elements describe other values. */
function aliasesOf(semantics: FieldSemantics | undefined): readonly FieldSemanticAlias[] {
  return [...(semantics?.aliases ?? []), ...(semantics?.unionVariants ?? []).flatMap(aliasesOf)];
}

/** Shared type dispatch only: no catalog reads, current-value guesses, or write side effects.
 * P1 preserves each surface's existing controls while exposing semantic intent and gaps.
 * Candidates and reference validity belong to the application's resolver, never this function.
 */
export function resolveFieldEditor(
  input: DefinitionFieldSchema | NodeFieldSchema,
  context: FieldEditorContext = {},
): FieldEditorResolution {
  const references =
    context.references ??
    ('kind' in input ? input.references : input.valueSchema?.references) ??
    EMPTY_SCHEMA_REFERENCES;
  const schema = 'kind' in input ? resolveDefinitionSchema(input, references) : input;
  const node = 'control' in schema;
  const baseControl = node ? schema.control : schema.kind;
  const name = context.name ?? (node ? schema.path.at(-1) : undefined) ?? '';
  const referenceKind = context.referenceKind ?? referenceKindForDeclaration(name, schema.source);
  const aliases = aliasesOf(schema.semantics);
  const has = (alias: FieldSemanticAlias) => aliases.includes(alias);
  const tuple = Boolean(schema.semantics?.tuple);
  const boundary =
    ['graph', 'sequence', 'resource'].includes(baseControl) ||
    ['graph-reference-boundary', 'owned-resource-boundary'].includes(schema.fallback?.reason ?? '');
  const curve =
    !boundary &&
    (baseControl === 'timeScaleCurve' ||
      (node && baseControl === 'json' && schema.valueSchema?.kind === 'timeScaleCurve'));
  const collection = stringCollectionDescriptor(schema, name, referenceKind);
  const conditionList = isConditionListField(schema);
  const semantic: FieldEditorResolution['semantic'] = context.protectedIdentity
    ? 'identity'
    : collection?.kind === 'nativeId'
      ? 'nativeId'
      : curve
        ? 'timeScaleCurve'
        : conditionList
          ? 'combatConditionList'
          : tuple
            ? 'tuple'
            : has('ActionGraphReference') || baseControl === 'graph' || baseControl === 'sequence'
              ? 'graph'
              : has('ActionStringOperand')
                ? 'stringOperand'
                : has('ActionValueOperand') || baseControl === 'operand'
                  ? 'valueOperand'
                  : has('CombatCondition')
                    ? 'combatCondition'
                    : has('BuildCondition')
                      ? 'buildCondition'
                      : has('LevelValues') || baseControl === 'levelValues'
                        ? 'levelValues'
                        : has('GameplayTag')
                          ? 'gameplayTag'
                          : referenceKind
                            ? 'reference'
                            : 'plain';
  const mapping = resolveBlackboardMapping(schema, name);
  const structured =
    node &&
    baseControl === 'json' &&
    schema.valueSchema &&
    supportsStructuredValue(
      schema.valueSchema,
      name,
      references,
      graphOperandSchemas(schema.valueSchema, context.nodeKind, schema.path, references),
      graphSequenceBoundaries(schema.valueSchema, context.nodeKind, schema.path, references),
      spawnDefinitionResources(schema.valueSchema, context.nodeKind, schema.path),
    );
  const inlineCondition = !node && schema.inlineCondition && semantic === 'combatCondition';
  const inlineOperand = !node && schema.inlineCondition && semantic === 'valueOperand';
  const graphOperand = !node && context.graphOperand && semantic === 'valueOperand';
  const contextlessOperand =
    !node && semantic === 'valueOperand' && !inlineOperand && !graphOperand;
  const skillSettingValues = !node && isSkillSettingValuesSchema(schema);
  const control = skillSettingValues
    ? 'skillSettingValues'
    : graphOperand
      ? 'graphOperand'
      : inlineCondition
        ? 'inlineCondition'
        : inlineOperand
          ? 'inlineOperand'
          : contextlessOperand
            ? 'operand'
            : curve
              ? 'timeScaleCurve'
              : collection && !boundary
                ? 'stringCollection'
                : semantic === 'gameplayTag' && baseControl === 'string'
                  ? 'gameplayTag'
                  : conditionList && !boundary
                    ? 'conditionList'
                    : mapping && !boundary
                      ? 'blackboardMapping'
                      : semantic === 'stringOperand' && !boundary && baseControl !== 'opaque'
                        ? 'stringOperand'
                        : baseControl === 'string' && referenceKind && !context.protectedIdentity
                          ? 'reference'
                          : structured
                            ? 'structuredValue'
                            : semantic === 'levelValues' &&
                                !node &&
                                supportsStructuredValue(schema, name, references)
                              ? 'levelValues'
                              : baseControl;
  const container =
    curve ||
    control === 'structuredValue' ||
    conditionList ||
    ['array', 'tuple', 'record', 'object', 'union'].includes(baseControl);
  const intrinsicallyReadonly =
    contextlessOperand ||
    boundary ||
    (!graphOperand && ['opaque', 'condition', 'null'].includes(baseControl));
  const readonly =
    context.editable === false ||
    Boolean(context.protectedIdentity) ||
    (!node && isReadonlyDefinitionSlot(name, schema.source)) ||
    intrinsicallyReadonly;
  const fallback = [
    'inlineCondition',
    'inlineOperand',
    'graphOperand',
    'skillSettingValues',
    'timeScaleCurve',
    'stringOperand',
    'blackboardMapping',
    'conditionList',
    'stringCollection',
    'gameplayTag',
    'structuredValue',
  ].includes(control)
    ? undefined
    : contextlessOperand
      ? 'structured-editor-pending'
      : (schema.fallback?.reason ??
        (baseControl === 'opaque'
          ? tuple
            ? 'tuple-editor-pending'
            : 'unsupported-type'
          : baseControl === 'condition'
            ? 'condition-editor-pending'
            : baseControl === 'json'
              ? 'structured-editor-pending'
              : boundary
                ? baseControl === 'resource'
                  ? 'owned-resource-boundary'
                  : 'graph-reference-boundary'
                : undefined));
  return {
    control,
    semantic,
    view: boundary
      ? 'navigation'
      : control === 'reference'
        ? 'reference'
        : container
          ? 'structure'
          : intrinsicallyReadonly
            ? 'readonly'
            : 'value',
    edit: readonly
      ? 'none'
      : control === 'structuredValue'
        ? 'recursive'
        : [
              'inlineCondition',
              'inlineOperand',
              'graphOperand',
              'skillSettingValues',
              'timeScaleCurve',
              'stringOperand',
              'blackboardMapping',
              'conditionList',
              'stringCollection',
              'gameplayTag',
              'structuredValue',
            ].includes(control)
          ? 'field'
          : container
            ? 'recursive'
            : ['json', 'operand'].includes(baseControl)
              ? 'json'
              : 'field',
    ...(referenceKind === undefined ? {} : { referenceKind }),
    ...(fallback === undefined ? {} : { fallback }),
    readonly,
  };
}
