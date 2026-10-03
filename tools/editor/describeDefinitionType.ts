/** 两个生成器共用的纯类型描述；不创建或隐式读取生产 TypeScript Program。 */
import ts from 'typescript';
import { createHash } from 'node:crypto';
import { referenceKindForDeclaration } from '../../src/ui/definition-editor/fieldInputConfig.ts';
import type { FieldSemantics } from '../../src/ui/field-editor/fieldSemantics.ts';
import type { DefinitionFieldSchema } from '../../src/ui/definition-editor/fieldSchema.ts';
import { createFieldSemanticExtractor, type FieldTypeContext } from './fieldSemantics.ts';
import type {
  InlineConditionScope,
  FieldFallbackReason,
  FieldSemanticMetadata,
} from '../../src/ui/field-editor/fieldSemantics.ts';

function branches(type: ts.Type): readonly ts.Type[] {
  return type.isUnion() ? type.types.flatMap(branches) : [type];
}

function literalValue(type: ts.Type): string | number {
  if (!type.isStringLiteral() && !type.isNumberLiteral())
    throw new Error('expected a string or number literal');
  if (typeof type.value !== 'string' && typeof type.value !== 'number')
    throw new Error('BigInt literal cannot be edited as a schema enum');
  return type.value;
}

/** 两个生成器在同一声明上下文中提取语义；本函数亦供自包含契约夹具使用。 */
export function describeDefinitionType(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  symbol: ts.Symbol | undefined,
  sourceRoot: string,
  options: { readonly definitionRoot?: boolean } = {},
): DefinitionFieldSchema {
  const extractor = createFieldSemanticExtractor(typeChecker, sourceRoot);
  const references: Record<string, DefinitionFieldSchema> = {};
  const interned = new Map<
    ts.Type,
    Map<string, { id: string; schema?: DefinitionFieldSchema; referenced: boolean }>
  >();
  const ids = new Set<string>();
  let count = 0;
  const fallback = (reason: FieldFallbackReason): FieldSemanticMetadata['fallback'] => ({ reason });

  function discriminator(value: ts.Type): string | undefined {
    const kind = typeChecker.getPropertyOfType(value, 'kind');
    const type = kind && typeChecker.getTypeOfSymbol(kind);
    return type?.isStringLiteral() ? type.value : undefined;
  }
  function inlineHost(input: FieldTypeContext): InlineConditionScope | undefined {
    for (const origin of input.origins) {
      const property = origin.node.parent;
      if (!ts.isPropertySignature(property) || property.name.getText() !== 'condition') continue;
      if (
        input.source.some(source =>
          /^packages\/game-data-contract\/src\/equipment\.ts:/.test(source),
        )
      )
        return 'equipment';
      if (
        input.source.some(source =>
          /^packages\/game-data-contract\/src\/operators\.ts:/.test(source),
        ) &&
        ts.isTypeLiteralNode(property.parent) &&
        property.parent.members.some(
          member =>
            ts.isPropertySignature(member) &&
            member.name.getText() === 'kind' &&
            member.type?.getText() === "'addConditionalDamage'",
        )
      )
        return 'enemyStaggered';
      if (
        input.source.some(source => /^packages\/game-data-contract\/src\/skills\.ts:/.test(source))
      ) {
        for (
          let parent: ts.Node | undefined = property.parent;
          parent && !ts.isInterfaceDeclaration(parent) && !ts.isTypeAliasDeclaration(parent);
          parent = parent.parent
        )
          if (ts.isPropertySignature(parent) && parent.name.getText() === 'switchToBuffCast')
            return 'skillSwitch';
      }
    }
    return undefined;
  }

  function describe(
    input: FieldTypeContext,
    seen: ReadonlySet<ts.Type>,
    depth: number,
    inheritedCondition?: InlineConditionScope,
  ): DefinitionFieldSchema {
    const { type } = input;
    const metadata = extractor.metadata(input);
    const condition = /^(CombatCondition)(?: \| (?:undefined|null))*$/.test(
      typeChecker.typeToString(type),
    );
    const conditionScope =
      inheritedCondition ?? (options.definitionRoot && condition ? inlineHost(input) : undefined);
    const aliases = (value: FieldSemantics | undefined): readonly string[] => [
      ...(value?.aliases ?? []),
      ...(value?.unionVariants ?? []).flatMap(aliases),
    ];
    const semanticAliases = aliases(metadata.semantics);
    const operand = semanticAliases.includes('ActionValueOperand');
    const inlineMetadata =
      conditionScope && (condition || operand) ? { inlineCondition: conditionScope } : {};
    const nullable = branches(type).filter(
      part => (part.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Never)) === 0,
    );
    const optional = branches(type).some(part => (part.flags & ts.TypeFlags.Undefined) !== 0);
    const field = (shape: DefinitionFieldSchema): DefinitionFieldSchema => ({
      ...shape,
      ...metadata,
      ...inlineMetadata,
      ...(optional ? { optional: true } : {}),
    });
    if (metadata.semantics?.aliases?.includes('TimeScaleCurveDefinition'))
      return field({ kind: 'timeScaleCurve' });
    // 条件是独立表达式，不把分支当作普通下拉框；从声明追踪可选 alias。
    if (condition && !conditionScope)
      return field({ kind: 'condition', fallback: fallback('condition-editor-pending') });
    if (!nullable.length) return field({ kind: 'opaque', fallback: fallback('no-present-type') });
    // Checker identity prevents aliases/generic instantiations with equal display names from
    // collapsing. Declaration origins and root ownership remain part of the context identity.
    const identity = JSON.stringify({
      type: typeChecker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation),
      declarations: (type.aliasSymbol ?? type.getSymbol())?.declarations?.map(node => [
        node.getSourceFile().fileName.replaceAll(sourceRoot, ''),
        node.pos,
        node.end,
      ]),
      source: input.source,
      origins: extractor.identity(input),
      semantics: metadata.semantics,
      owned: !(options.definitionRoot && depth === 0),
      conditionScope,
    });
    let contexts = interned.get(type);
    if (!contexts) interned.set(type, (contexts = new Map()));
    const existing = contexts.get(identity);
    if (existing) {
      if (existing.schema) return existing.schema;
      existing.referenced = true;
      return field({ kind: 'ref', ref: existing.id });
    }
    if (++count > 50_000) throw new Error('definition schema expansion budget exceeded');
    const base = `field_${createHash('sha256').update(identity).digest('hex').slice(0, 20)}`;
    let id = base;
    let suffix = 1;
    while (ids.has(id)) id = `${base}_${suffix++}`;
    ids.add(id);
    const entry: { id: string; schema?: DefinitionFieldSchema; referenced: boolean } = {
      id,
      referenced: false,
    };
    contexts.set(identity, entry);
    const build = (): DefinitionFieldSchema => {
      if (nullable.length > 1) {
        const literals: ts.Type[] = nullable.filter(
          part => part.isStringLiteral() || part.isNumberLiteral(),
        );
        if (literals.length === nullable.length)
          return field({ kind: 'enum', options: literals.map(literalValue) });
        if (nullable.every(part => (part.flags & ts.TypeFlags.BooleanLike) !== 0))
          return field({ kind: 'boolean' });
        const others = nullable.filter(part => {
          if (literals.includes(part)) return false;
          const kind = discriminator(part);
          if (conditionScope && operand && ['valueNode', 'parameter'].includes(kind ?? ''))
            return false;
          if (conditionScope && condition) {
            if (conditionScope === 'enemyStaggered') return kind === 'targetStaggered';
            return !['conditionNode', 'abilityEntityRemainingDurationCompare'].includes(kind ?? '');
          }
          return true;
        });
        return field({
          kind: 'union',
          variants: [
            ...(literals.length
              ? [
                  {
                    kind: 'enum' as const,
                    options: literals.map(literalValue),
                    source: input.source,
                    semantics: {
                      type: literals.map(part => typeChecker.typeToString(part)).join(' | '),
                      unionVariants: literals.map(part =>
                        extractor.semantics(extractor.branch(input, part)),
                      ),
                    },
                  },
                ]
              : []),
            ...others.map(part =>
              describe(extractor.branch(input, part), seen, depth, conditionScope),
            ),
          ],
        });
      }
      const current = nullable[0]!;
      if ((current.flags & ts.TypeFlags.Null) !== 0) return field({ kind: 'null' });
      if (current.isStringLiteral() || current.isNumberLiteral())
        return field({ kind: 'enum', options: [literalValue(current)] });
      if ((current.flags & ts.TypeFlags.NumberLike) !== 0) return field({ kind: 'number' });
      if ((current.flags & ts.TypeFlags.StringLike) !== 0) return field({ kind: 'string' });
      if ((current.flags & ts.TypeFlags.BooleanLiteral) !== 0)
        return field({ kind: 'enum', options: [typeChecker.typeToString(current) === 'true'] });
      if ((current.flags & ts.TypeFlags.BooleanLike) !== 0) return field({ kind: 'boolean' });
      if (
        current.flags &
          (ts.TypeFlags.Any |
            ts.TypeFlags.Unknown |
            ts.TypeFlags.BigIntLike |
            ts.TypeFlags.ESSymbolLike |
            ts.TypeFlags.TypeParameter) ||
        typeChecker.getSignaturesOfType(current, ts.SignatureKind.Call).length ||
        typeChecker.getSignaturesOfType(current, ts.SignatureKind.Construct).length
      )
        return field({ kind: 'opaque', fallback: fallback('unsupported-type') });
      const name = current.aliasSymbol?.name ?? current.getSymbol()?.name;
      if (name === 'ActionGraphResourceDefinition' || name === 'ActionGraphDefinition')
        return field({ kind: 'graph' });
      if (name === 'ActionGraphReference')
        return field({ kind: 'opaque', fallback: fallback('graph-reference-boundary') });
      if (
        (!options.definitionRoot || depth > 0) &&
        typeChecker.getPropertyOfType(current, 'actionGraph')
      )
        return field({ kind: 'opaque', fallback: fallback('owned-resource-boundary') });

      const nested = new Set(seen).add(current);
      if (typeChecker.isTupleType(current)) {
        const tuple = current as ts.TupleTypeReference;
        if (
          tuple.target.hasRestElement ||
          tuple.target.minLength !== typeChecker.getTypeArguments(tuple).length
        )
          return field({ kind: 'opaque', fallback: fallback('tuple-editor-pending') });
        const elements = typeChecker.getTypeArguments(tuple);
        return field({
          kind: 'tuple',
          elements: elements.map((element, index) =>
            describe(extractor.element(input, element, index), nested, depth, conditionScope),
          ),
          minLength: tuple.target.minLength,
        });
      }
      if (typeChecker.isArrayType(current)) {
        const element = typeChecker.getTypeArguments(current as ts.TypeReference)[0];
        return field({
          kind: 'array',
          element: element
            ? describe(extractor.element(input, element), nested, depth, conditionScope)
            : {
                kind: 'opaque',
                ...metadata,
                fallback: fallback('no-present-type'),
              },
        });
      }
      const index = typeChecker.getIndexTypeOfType(current, ts.IndexKind.String);
      if (index)
        return field({
          kind: 'record',
          value: describe(extractor.recordValue(input, index), nested, depth + 1, conditionScope),
        });

      const fields: Record<string, DefinitionFieldSchema> = {};
      for (const property of typeChecker.getPropertiesOfType(current)) {
        // 映射属性可能无独立声明，继承最近可定位声明；不能跳过其类型。
        const propertyType = typeChecker.getTypeOfSymbol(property);
        const childContext = extractor.property(input, propertyType, property);
        const child =
          property.name === 'actionGraph' &&
          branches(propertyType).some(
            part => (part.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Never)) === 0,
          )
            ? { kind: 'graph' as const, ...extractor.metadata(childContext) }
            : describe(childContext, nested, depth + 1, conditionScope);
        const description = ts
          .displayPartsToString(property.getDocumentationComment(typeChecker))
          .replaceAll('\r\n', '\n')
          .trim();
        const scopedChild: DefinitionFieldSchema =
          conditionScope === 'enemyStaggered' &&
          property.name === 'target' &&
          discriminator(current) === 'targetStaggered'
            ? { ...child, kind: 'enum', options: ['enemy'] }
            : child;
        fields[property.name] = {
          ...scopedChild,
          ...(property.flags & ts.SymbolFlags.Optional ? { optional: true } : {}),
          ...(description ? { description } : {}),
        };
      }
      return field({ kind: 'object', fields });
    };
    const result = build();
    entry.schema = result;
    if (entry.referenced) references[id] = result;
    return result;
  }
  const schema = describe(
    extractor.context(type, symbol ?? type.aliasSymbol ?? type.getSymbol()),
    new Set(),
    0,
  );
  return Object.keys(references).length ? { ...schema, references } : schema;
}

/** Merge equivalent declaration shapes without discarding any branch's metadata. */
function composeShapes(
  values: readonly DefinitionFieldSchema[],
  name?: string,
): DefinitionFieldSchema {
  if (!values.length) throw new Error('no present field variants');
  if (values.length === 1) return values[0]!;
  const semanticKey = (value: FieldSemantics | undefined): unknown =>
    value
      ? {
          aliases: value.aliases,
          arrayElement: value.arrayElement && semanticKey(value.arrayElement),
          recordValue: value.recordValue && semanticKey(value.recordValue),
          unionVariants: value.unionVariants?.map(semanticKey),
        }
      : {};
  const shapeKey = (value: DefinitionFieldSchema, fieldName?: string, nested = false): unknown => ({
    ...(nested ? { optional: value.optional === true } : {}),
    kind: value.kind,
    ...(value.kind === 'ref' ? { ref: value.ref } : {}),
    role: referenceKindForDeclaration(fieldName ?? '', value.source),
    semantics: semanticKey(value.semantics),
    fallback: value.fallback,
    inlineCondition: value.inlineCondition,
    ...(value.kind === 'enum' ? { options: value.options } : {}),
    ...(value.kind === 'object'
      ? {
          fields: Object.fromEntries(
            Object.entries(value.fields).map(([key, child]) => [key, shapeKey(child, key, true)]),
          ),
        }
      : {}),
    ...(value.kind === 'array' ? { element: shapeKey(value.element, fieldName, true) } : {}),
    ...(value.kind === 'record' ? { value: shapeKey(value.value, fieldName, true) } : {}),
    ...(value.kind === 'tuple'
      ? {
          elements: value.elements.map(child => shapeKey(child, undefined, true)),
          minLength: value.minLength,
        }
      : {}),
    ...(value.kind === 'union'
      ? { variants: value.variants.map(child => shapeKey(child, fieldName, true)) }
      : {}),
  });
  const key = (value: DefinitionFieldSchema) =>
    JSON.stringify({ shape: shapeKey(value, name), references: value.references });
  const groups = new Map<string, DefinitionFieldSchema[]>();
  for (const value of values) {
    const group = groups.get(key(value)) ?? [];
    group.push(value);
    groups.set(key(value), group);
  }
  const merged = [...groups.values()].map(group => {
    const first = group[0]!;
    if (group.length === 1) return first;
    const metadata = {
      source: [...new Set(group.flatMap(value => value.source ?? []))],
      semantics: {
        ...first.semantics,
        type: [...new Set(group.flatMap(value => value.semantics?.type ?? []))].join(' | '),
        unionVariants: group.flatMap(value => (value.semantics ? [value.semantics] : [])),
      },
      ...(group.some(value => value.optional) ? { optional: true } : {}),
    };
    if (first.kind === 'object')
      return {
        ...first,
        ...metadata,
        fields: Object.fromEntries(
          Object.keys(first.fields).map(name => [
            name,
            composeShapes(
              group.map(value =>
                value.kind === 'object' ? value.fields[name]! : first.fields[name]!,
              ),
              name,
            ),
          ]),
        ),
      };
    if (first.kind === 'array')
      return {
        ...first,
        ...metadata,
        element: composeShapes(
          group.map(value => (value.kind === 'array' ? value.element : first.element)),
          name,
        ),
      };
    if (first.kind === 'record')
      return {
        ...first,
        ...metadata,
        value: composeShapes(
          group.map(value => (value.kind === 'record' ? value.value : first.value)),
          name,
        ),
      };
    if (first.kind === 'tuple')
      return {
        ...first,
        ...metadata,
        elements: first.elements.map((child, index) =>
          composeShapes(
            group.map(value => (value.kind === 'tuple' ? value.elements[index]! : child)),
          ),
        ),
      };
    if (first.kind === 'union')
      return {
        ...first,
        ...metadata,
        variants: first.variants.map((child, index) =>
          composeShapes(
            group.map(value => (value.kind === 'union' ? value.variants[index]! : child)),
            name,
          ),
        ),
      };
    return { ...first, ...metadata };
  });
  return merged.length === 1 ? merged[0]! : { kind: 'union', variants: merged };
}

/** Compose independent root contexts without allowing equal reference labels from different
 * maps to alias each other. Bodies remain JSON-shaped, and references never carry maps. */
export function composeDefinitionSchemas(
  values: readonly DefinitionFieldSchema[],
  name?: string,
): DefinitionFieldSchema {
  const references: Record<string, DefinitionFieldSchema> = {};
  const normalized = values.map(value => {
    if (!value.references) return value;
    const prefix = createHash('sha256')
      .update(JSON.stringify(value.references))
      .digest('hex')
      .slice(0, 20);
    function rename(schema: DefinitionFieldSchema): DefinitionFieldSchema {
      const { references: _references, ...base } = schema;
      switch (base.kind) {
        case 'ref':
          return { ...base, ref: `${prefix}_${base.ref}` };
        case 'array':
          return { ...base, element: rename(base.element) };
        case 'record':
          return { ...base, value: rename(base.value) };
        case 'tuple':
          return { ...base, elements: base.elements.map(rename) };
        case 'union':
          return { ...base, variants: base.variants.map(rename) };
        case 'object':
          return {
            ...base,
            fields: Object.fromEntries(
              Object.entries(base.fields).map(([key, child]) => [key, rename(child)]),
            ),
          };
        default:
          return base;
      }
    }
    for (const [key, body] of Object.entries(value.references))
      references[`${prefix}_${key}`] = rename(body);
    return rename(value);
  });
  const shape = composeShapes(normalized, name);
  return Object.keys(references).length ? { ...shape, references } : shape;
}
