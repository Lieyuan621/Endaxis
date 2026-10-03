/** 从声明节点补回 TypeChecker 展开的 alias；不把普通 string 识别为领域类型。 */
import { relative, resolve } from 'node:path';
import ts from 'typescript';
import type {
  FieldSemanticAlias,
  FieldSemanticMetadata,
  FieldSemantics,
} from '../../src/ui/field-editor/fieldSemantics.ts';

const semanticDeclarations: Readonly<Record<FieldSemanticAlias, string>> = {
  TimeScaleCurveDefinition: 'conditions.ts',
  GameplayTag: 'gameplayTags.ts',
  ActionStringOperand: 'primitives.ts',
  ActionValueOperand: 'conditions.ts',
  ActionGraphReference: 'actionGraph.ts',
  LevelValues: 'primitives.ts',
  CombatCondition: 'conditions.ts',
  BuildCondition: 'conditions.ts',
};

interface TypeOrigin {
  readonly node: ts.TypeNode;
  readonly substitutions?: ReadonlyMap<ts.Symbol, TypeOrigin>;
}

export interface FieldTypeContext {
  readonly type: ts.Type;
  readonly origins: readonly TypeOrigin[];
  readonly source: readonly string[];
}

export function createFieldSemanticExtractor(checker: ts.TypeChecker, root: string) {
  function symbolAt(node: ts.Node): ts.Symbol | undefined {
    const symbol = checker.getSymbolAtLocation(node);
    return symbol && symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  }

  function semanticAlias(symbol: ts.Symbol | undefined): FieldSemanticAlias | undefined {
    if (!symbol || !Object.hasOwn(semanticDeclarations, symbol.name)) return undefined;
    const name = symbol.name as FieldSemanticAlias;
    const file = resolve(root, 'packages/game-data-contract/src', semanticDeclarations[name]);
    if (
      !symbol.declarations?.some(
        declaration => resolve(declaration.getSourceFile().fileName) === file,
      )
    )
      return undefined;
    return name;
  }

  function sourceOf(symbol: ts.Symbol | undefined): string[] {
    return (symbol?.declarations ?? []).map(declaration => {
      const file = declaration.getSourceFile();
      const position = file.getLineAndCharacterOfPosition(declaration.getStart(file));
      return `${relative(root, file.fileName).replaceAll('\\', '/')}:${position.line + 1}:${position.character + 1}`;
    });
  }

  function context(
    type: ts.Type,
    symbol?: ts.Symbol,
    inheritedSource: readonly string[] = [],
  ): FieldTypeContext {
    const origins: TypeOrigin[] = [];
    for (const declaration of symbol?.declarations ?? []) {
      if (
        (ts.isPropertySignature(declaration) ||
          ts.isPropertyDeclaration(declaration) ||
          ts.isTypeAliasDeclaration(declaration)) &&
        declaration.type
      )
        origins.push({ node: declaration.type });
    }
    const source = sourceOf(symbol);
    return { type, origins, source: source.length ? source : inheritedSource };
  }

  function property(input: FieldTypeContext, type: ts.Type, symbol: ts.Symbol): FieldTypeContext {
    const result = context(type, symbol, input.source);
    const origins: TypeOrigin[] = [];
    for (const origin of unionOrigins(input)) {
      const { node } = origin;
      let members: ts.NodeArray<ts.TypeElement> | undefined;
      let substitutions = origin.substitutions;
      if (ts.isTypeLiteralNode(node)) members = node.members;
      else if (ts.isTypeReferenceNode(node)) {
        const declaration = symbolAt(node.typeName)?.declarations?.find(ts.isInterfaceDeclaration);
        if (declaration) {
          members = declaration.members;
          const mapped = new Map(substitutions);
          declaration.typeParameters?.forEach((parameter, index) => {
            const parameterSymbol = checker.getSymbolAtLocation(parameter.name);
            const argument = node.typeArguments?.[index] ?? parameter.default;
            if (parameterSymbol && argument)
              mapped.set(parameterSymbol, { node: argument, substitutions });
          });
          substitutions = mapped;
        }
      }
      for (const member of members ?? []) {
        if (
          ts.isPropertySignature(member) &&
          member.type &&
          member.name.getText().replace(/^['"]|['"]$/g, '') === symbol.name
        )
          origins.push({ node: member.type, substitutions });
      }
    }
    return origins.length ? { ...result, origins } : result;
  }

  function isBuiltinContainer(symbol: ts.Symbol | undefined): boolean {
    return (
      !!symbol &&
      ['Array', 'ReadonlyArray', 'Record', 'Readonly'].includes(symbol.name) &&
      !!symbol.declarations?.some(declaration =>
        /\/typescript\/lib\/lib\.[^/]+\.d\.ts$/.test(
          declaration.getSourceFile().fileName.replaceAll('\\', '/'),
        ),
      )
    );
  }

  function aliasTarget(origin: TypeOrigin, symbol: ts.Symbol): TypeOrigin | undefined {
    if (!ts.isTypeReferenceNode(origin.node)) return undefined;
    const node = origin.node;
    const declaration = symbol.declarations?.find(ts.isTypeAliasDeclaration);
    if (!declaration) return undefined;
    const mapped = new Map(origin.substitutions);
    declaration.typeParameters?.forEach((parameter, index) => {
      const parameterSymbol = checker.getSymbolAtLocation(parameter.name);
      const argument = node.typeArguments?.[index] ?? parameter.default;
      if (parameterSymbol && argument)
        mapped.set(parameterSymbol, { node: argument, substitutions: origin.substitutions });
    });
    return { node: declaration.type, substitutions: mapped };
  }

  function expand(origin: TypeOrigin, visited = new Set<ts.Symbol>()): TypeOrigin[] {
    const { node, substitutions } = origin;
    if (ts.isParenthesizedTypeNode(node) || ts.isTypeOperatorNode(node))
      return expand({ node: node.type, substitutions }, visited);
    if (!ts.isTypeReferenceNode(node)) return [origin];
    const symbol = symbolAt(node.typeName);
    const replacement = symbol && substitutions?.get(symbol);
    if (replacement) return expand(replacement, visited);
    if (symbol?.name === 'Readonly' && isBuiltinContainer(symbol) && node.typeArguments?.[0])
      return expand({ node: node.typeArguments[0], substitutions }, visited);
    if (!symbol || visited.has(symbol) || isBuiltinContainer(symbol)) return [origin];
    if (semanticAlias(symbol) && !originType(origin).isUnion()) return [origin];
    const target = aliasTarget(origin, symbol);
    return target ? expand(target, new Set(visited).add(symbol)) : [origin];
  }

  function aliasesIn(origin: TypeOrigin, visited = new Set<ts.Symbol>()): FieldSemanticAlias[] {
    const { node, substitutions } = origin;
    if (ts.isParenthesizedTypeNode(node))
      return aliasesIn({ node: node.type, substitutions }, visited);
    if (ts.isUnionTypeNode(node)) {
      const present = node.types.filter(
        part =>
          !(
            originType({ node: part, substitutions }).flags &
            (ts.TypeFlags.Undefined | ts.TypeFlags.Never)
          ),
      );
      return present.length === 1 ? aliasesIn({ node: present[0]!, substitutions }, visited) : [];
    }
    if (ts.isImportTypeNode(node) && node.qualifier) {
      const known = semanticAlias(symbolAt(node.qualifier));
      return known ? [known] : [];
    }
    if (!ts.isTypeReferenceNode(node)) return [];
    const symbol = symbolAt(node.typeName);
    const replacement = symbol && substitutions?.get(symbol);
    if (replacement) return aliasesIn(replacement, visited);
    const known = semanticAlias(symbol);
    if (known) return [known];
    if (!symbol || visited.has(symbol) || isBuiltinContainer(symbol)) return [];
    const target = aliasTarget(origin, symbol);
    return target ? aliasesIn(target, new Set(visited).add(symbol)) : [];
  }

  function aliases(input: FieldTypeContext): FieldSemanticAlias[] {
    const present = checker.getNonNullableType(input.type);
    const known = semanticAlias(present.aliasSymbol ?? present.getSymbol());
    return [
      ...new Set([
        ...(known ? [known] : []),
        ...input.origins.flatMap(origin => aliasesIn(origin)),
      ]),
    ];
  }

  function unionOrigins(input: FieldTypeContext): TypeOrigin[] {
    const flatten = (origin: TypeOrigin): TypeOrigin[] => {
      // string alias 会被 TypeChecker 擦除，抵达它时保留原声明节点。
      if (
        ts.isTypeReferenceNode(origin.node) &&
        semanticAlias(symbolAt(origin.node.typeName)) &&
        !originType(origin).isUnion()
      )
        return [origin];
      return expand(origin).flatMap(part => {
        if (ts.isUnionTypeNode(part.node))
          return part.node.types.flatMap(node =>
            flatten({ node, substitutions: part.substitutions }),
          );
        return [part];
      });
    };
    return input.origins.flatMap(flatten);
  }

  function originType(origin: TypeOrigin): ts.Type {
    if (ts.isTypeReferenceNode(origin.node)) {
      const symbol = symbolAt(origin.node.typeName);
      const replacement = symbol && origin.substitutions?.get(symbol);
      if (replacement) return originType(replacement);
    }
    return checker.getTypeFromTypeNode(origin.node);
  }

  function branch(input: FieldTypeContext, type: ts.Type): FieldTypeContext {
    // 只按实际类型匹配，不用可赋值性把普通 string 分支当成 tag。
    const origins = unionOrigins(input).filter(origin => originType(origin) === type);
    return { type, origins, source: input.source };
  }

  function element(input: FieldTypeContext, type: ts.Type, index?: number): FieldTypeContext {
    const origins: TypeOrigin[] = unionOrigins(input).flatMap(origin => {
      const { node, substitutions } = origin;
      let child: ts.TypeNode | undefined;
      if (index !== undefined && ts.isTupleTypeNode(node)) {
        child = node.elements[index];
        const rest =
          child &&
          (ts.isRestTypeNode(child) || (ts.isNamedTupleMember(child) && !!child.dotDotDotToken));
        if (child && ts.isNamedTupleMember(child)) child = child.type;
        if (child && (ts.isOptionalTypeNode(child) || ts.isRestTypeNode(child))) child = child.type;
        // checker 的 rest 参数已经是元素类型；声明仍是数组或数组 alias，需要再取一层。
        if (rest && child)
          return element(
            { type, origins: [{ node: child, substitutions }], source: input.source },
            type,
          ).origins;
      } else if (ts.isArrayTypeNode(node)) child = node.elementType;
      else if (ts.isTypeReferenceNode(node) && isBuiltinContainer(symbolAt(node.typeName)))
        child = node.typeArguments?.[0];
      return child ? [{ node: child, substitutions }] : [];
    });
    return { type, origins, source: input.source };
  }

  function recordValue(input: FieldTypeContext, type: ts.Type): FieldTypeContext {
    const origins: TypeOrigin[] = unionOrigins(input).flatMap(origin => {
      const { node, substitutions } = origin;
      if (
        ts.isTypeReferenceNode(node) &&
        isBuiltinContainer(symbolAt(node.typeName)) &&
        node.typeArguments?.[1]
      )
        return [{ node: node.typeArguments[1], substitutions }];
      if (ts.isTypeLiteralNode(node))
        return node.members.flatMap(member =>
          ts.isIndexSignatureDeclaration(member) && member.type
            ? [{ node: member.type, substitutions }]
            : [],
        );
      return [];
    });
    if (!origins.length) {
      for (const declaration of input.type.getSymbol()?.declarations ?? []) {
        if (ts.isInterfaceDeclaration(declaration)) {
          for (const member of declaration.members) {
            if (ts.isIndexSignatureDeclaration(member) && member.type)
              origins.push({ node: member.type });
          }
        }
      }
    }
    return { type, origins, source: input.source };
  }

  function declaredUnionOrigins(origin: TypeOrigin, visited = new Set<ts.Symbol>()): TypeOrigin[] {
    const { node, substitutions } = origin;
    if (ts.isParenthesizedTypeNode(node))
      return declaredUnionOrigins({ node: node.type, substitutions }, visited);
    if (ts.isUnionTypeNode(node)) return node.types.map(part => ({ node: part, substitutions }));
    if (!ts.isTypeReferenceNode(node)) return [];
    const symbol = symbolAt(node.typeName);
    if (!symbol || visited.has(symbol) || semanticAlias(symbol) || isBuiltinContainer(symbol))
      return [];
    const replacement = substitutions?.get(symbol) ?? aliasTarget(origin, symbol);
    return replacement ? declaredUnionOrigins(replacement, new Set(visited).add(symbol)) : [];
  }

  function semantics(
    input: FieldTypeContext,
    seen: ReadonlySet<ts.Type> = new Set(),
    depth = 0,
  ): FieldSemantics {
    const { type } = input;
    const names = aliases(input);
    const optional =
      type.isUnion() && type.types.some(part => !!(part.flags & ts.TypeFlags.Undefined));
    const result: FieldSemantics = {
      type: checker.typeToString(type),
      ...(names.length ? { aliases: names } : {}),
      ...(optional ? { optional: true } : {}),
    };
    // 已知领域 alias 的内部结构由正式契约负责；不重复铺开完整条件/操作数树。
    if (depth >= 4 || seen.has(type) || names.length) return result;
    const nested = new Set(seen).add(type);
    const child = (value: FieldTypeContext) => semantics(value, nested, depth + 1);
    if (type.isUnion()) {
      const present = type.types.filter(
        part => !(part.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Never)),
      );
      // 保留显式联合中的领域分支，避免 checker 展开 ActionValueOperand 后丢失身份。
      const declared = input.origins
        .flatMap(origin => declaredUnionOrigins(origin))
        .map(origin => ({ type: originType(origin), origins: [origin], source: input.source }))
        .filter(part => !(part.type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Never)));
      if (
        declared.length > 1 &&
        !declared.every(part => !!(part.type.flags & ts.TypeFlags.BooleanLike))
      )
        return { ...result, unionVariants: declared.map(child) };
      // boolean 的 true/false 展开无需再复制为两条结构描述。
      if (present.length > 1 && !present.every(part => !!(part.flags & ts.TypeFlags.BooleanLike)))
        return { ...result, unionVariants: present.map(part => child(branch(input, part))) };
      if (present.length === 1)
        return { ...child({ ...branch(input, present[0]!), origins: input.origins }), ...result };
    }
    if (checker.isTupleType(type)) {
      const tuple = type as ts.TupleTypeReference;
      const types = checker.getTypeArguments(tuple);
      return {
        ...result,
        tuple: {
          elements: types.map((part, index) => {
            const flags = tuple.target.elementFlags[index]!;
            const label = tuple.target.labeledElementDeclarations?.[index];
            return {
              ...(label && ts.isNamedTupleMember(label) ? { label: label.name.getText() } : {}),
              ...(flags & ts.ElementFlags.Optional ? { optional: true } : {}),
              ...(flags & ts.ElementFlags.Variable ? { rest: true } : {}),
              semantics: child(element(input, part, index)),
            };
          }),
          minLength: tuple.target.minLength,
          ...(tuple.target.hasRestElement ? {} : { maxLength: types.length }),
        },
      };
    }
    if (checker.isArrayType(type)) {
      const item = checker.getTypeArguments(type as ts.TypeReference)[0];
      if (item) return { ...result, arrayElement: child(element(input, item)) };
    }
    const value = checker.getIndexTypeOfType(type, ts.IndexKind.String);
    return value ? { ...result, recordValue: child(recordValue(input, value)) } : result;
  }

  function metadata(input: FieldTypeContext): FieldSemanticMetadata {
    return {
      semantics: semantics(input),
      ...(input.source.length ? { source: input.source } : {}),
    };
  }

  function identity(input: FieldTypeContext): unknown {
    function originKey(origin: TypeOrigin, seen = new Set<TypeOrigin>()): unknown {
      if (seen.has(origin)) throw new Error('cyclic generic origin');
      const next = new Set(seen).add(origin);
      if (ts.isTypeReferenceNode(origin.node)) {
        const symbol = symbolAt(origin.node.typeName);
        const replacement = symbol && origin.substitutions?.get(symbol);
        if (replacement) return originKey(replacement, next);
      }
      // Canonicalize only substitutions used by this declaration. Recursive generic
      // edges must not acquire a longer identity from equivalent substitution chains.
      const used = new Set<ts.Symbol>();
      function collect(node: ts.Node) {
        if (ts.isTypeReferenceNode(node)) {
          const symbol = symbolAt(node.typeName);
          if (symbol && origin.substitutions?.has(symbol)) used.add(symbol);
        }
        ts.forEachChild(node, collect);
      }
      collect(origin.node);
      return {
        file: relative(root, origin.node.getSourceFile().fileName).replaceAll('\\', '/'),
        position: origin.node.pos,
        end: origin.node.end,
        substitutions: [...used].map(symbol => [
          sourceOf(symbol),
          originKey(origin.substitutions!.get(symbol)!, next),
        ]),
      };
    }
    return input.origins.map(origin => originKey(origin));
  }
  return {
    context,
    property,
    aliases,
    branch,
    element,
    recordValue,
    metadata,
    semantics,
    identity,
  };
}
