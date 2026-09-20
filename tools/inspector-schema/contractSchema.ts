import ts from 'typescript';
import { resolve } from 'node:path';

/** 只提取契约结构，不携带显示文案，也不推测领域校验或默认值。 */
export function extractInspectorStructures(repositoryRoot: string) {
  const file = resolve(repositoryRoot, 'packages/game-data-contract/src/conditions.ts');
  const actionFile = resolve(repositoryRoot, 'packages/game-data-contract/src/actions.ts');
  const equipmentFile = resolve(repositoryRoot, 'packages/game-data-contract/src/equipment.ts');
  const program = ts.createProgram([file, actionFile, equipmentFile], {
    strict: true,
    target: ts.ScriptTarget.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    module: ts.ModuleKind.ESNext,
    skipLibCheck: true,
  });
  const checker = program.getTypeChecker();
  const diagnostics = program.getSyntacticDiagnostics();
  if (diagnostics.length)
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: file => file,
        getCurrentDirectory: () => repositoryRoot,
        getNewLine: () => '\n',
      }),
    );
  const source = program.getSourceFile(file)!;
  const declaration = source.statements.find(
    (node): node is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(node) && node.name.text === 'CombatCondition',
  );
  if (!declaration) throw new Error('找不到 CombatCondition 契约');
  const root = checker.getTypeFromTypeNode(declaration.type);
  if (!root.isUnion()) throw new Error('CombatCondition 必须是可辨识联合类型');
  type Shape = {
    type: string;
    options?: string[];
    variants?: Shape[];
    element?: Shape;
    properties?: Record<string, Shape & { optional: boolean }>;
  };
  const operandDeclaration = source.statements.find(
    (node): node is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(node) && node.name.text === 'ActionValueOperand',
  );
  if (!operandDeclaration) throw new Error('找不到 ActionValueOperand 契约');
  const operandType = checker.getTypeFromTypeNode(operandDeclaration.type);
  const active = new Set<ts.Type>();
  function describe(value: ts.Type): Shape {
    if (active.has(value)) return { type: 'unsupported' };
    active.add(value);
    try {
      return describeValue(value);
    } finally {
      active.delete(value);
    }
  }
  function describeValue(value: ts.Type): Shape {
    if (value === root) return { type: 'conditionNode' };
    // 定义/序列的所有权属于导图或定义工作区，禁止当作参数对象自动铺开。
    if (
      [
        'ActionSequenceDefinition',
        'SkillBuffDefinition',
        'AbilityEntityChildSkillDefinition',
        'AbilityEntityDefinition',
      ].includes(value.aliasSymbol?.name ?? value.getSymbol()?.name ?? '')
    )
      return { type: 'unsupported' };
    const parts = value.isUnion() ? value.types : [value];
    if (checker.isArrayType(value)) {
      const element = checker.getTypeArguments(value as ts.TypeReference)[0];
      const shape = element ? describe(element) : { type: 'unsupported' };
      return shape.type === 'conditionNode'
        ? { type: 'conditionNodes' }
        : shape.type === 'text'
          ? { type: 'textList' }
          : shape.type === 'enum'
            ? { ...shape, type: 'enumList' }
            : shape.type !== 'unsupported' && shape.type !== 'conditionNodes'
              ? { type: 'array', element: shape }
              : { type: 'unsupported' };
    }
    if (value.aliasSymbol?.name === 'LevelValues') return { type: 'levelValues' };
    if (value.aliasSymbol?.name === 'ActionValueOperand') return { type: 'actionValue' };
    if (value.aliasSymbol?.name === 'ActionStringOperand') return { type: 'stringReference' };
    if (parts.every(part => !!(part.flags & ts.TypeFlags.BooleanLike))) return { type: 'boolean' };
    if (value.flags & ts.TypeFlags.Number) return { type: 'number' };
    if (value.flags & ts.TypeFlags.String) return { type: 'text' };
    if (parts.every(part => part.isStringLiteral()))
      return { type: 'enum', options: parts.map(part => (part as ts.StringLiteralType).value) };
    if (value.isUnion()) {
      // TS 会展开别名联合；将数值操作数成员重新归为同一专用控件，不损失外层标量形式。
      const operands = parts.filter(part => checker.isTypeAssignableTo(part, operandType));
      const literals = parts.filter(part => part.isStringLiteral());
      const booleans = parts.filter(part => !!(part.flags & ts.TypeFlags.BooleanLike));
      const rest = parts.filter(
        part =>
          !operands.includes(part) &&
          !literals.some(literal => literal === part) &&
          !booleans.includes(part),
      );
      const variants: Shape[] = rest.map(describe);
      if (literals.length)
        variants.push({
          type: 'enum',
          options: literals.map(part => (part as ts.StringLiteralType).value),
        });
      if (booleans.length) variants.push({ type: 'boolean' });
      if (operands.length) variants.push({ type: 'actionValue' });
      if (variants.length > 1 && variants.every(shape => shape.type !== 'unsupported'))
        return { type: 'union', variants };
    }
    // 仅接管纯字符串字典；混合具名字段、数值索引及图结构仍不作为普通参数展开。
    const indexes = checker.getIndexInfosOfType(value);
    if (indexes.length === 1 && !value.getProperties().length) {
      const index = indexes[0]!;
      if (index.keyType.flags & ts.TypeFlags.String) {
        // Record<string, never> 明确禁止任何参数，不是可增删的字典。
        if (index.type.flags & ts.TypeFlags.Never) return { type: 'object', properties: {} };
        const element = describe(index.type);
        if (!['unsupported', 'conditionNode', 'conditionNodes'].includes(element.type))
          return { type: 'dictionary', element };
      }
    }
    // 只展开有限具名参数对象；条件引用已在入口分流，绝不递归展开条件子树。
    if (value.flags & ts.TypeFlags.Object && !checker.getIndexInfosOfType(value).length) {
      const properties: Record<string, Shape & { optional: boolean }> = {};
      for (const property of value.getProperties()) {
        const child = checker.getNonNullableType(
          checker.getTypeOfSymbolAtLocation(property, source),
        );
        if (child === value) return { type: 'unsupported' };
        const shape = describe(child);
        if (['unsupported', 'conditionNode', 'conditionNodes'].includes(shape.type))
          return { type: 'unsupported' };
        properties[property.name] = {
          ...shape,
          optional: !!(property.flags & ts.SymbolFlags.Optional),
        };
      }
      if (Object.keys(properties).length) return { type: 'object', properties };
    }
    return { type: 'unsupported' };
  }
  const result: Record<string, Record<string, Shape & { optional: boolean }>> = {};
  for (const variant of root.types) {
    const discriminator = variant.getProperty('kind');
    if (!discriminator) throw new Error('条件分支缺少 kind');
    const kindType = checker.getTypeOfSymbolAtLocation(discriminator, declaration);
    if (!kindType.isStringLiteral()) throw new Error('条件 kind 必须是字符串字面量');
    const fields: Record<string, Shape & { optional: boolean }> = {};
    for (const property of variant.getProperties()) {
      if (property.name === 'kind') continue;
      const value = checker.getNonNullableType(
        checker.getTypeOfSymbolAtLocation(property, declaration),
      );
      const optional = !!(property.flags & ts.SymbolFlags.Optional);
      fields[property.name] = { ...describe(value), optional };
    }
    result[kindType.value] = fields;
  }
  const actionSource = program.getSourceFile(actionFile)!;
  const stepDeclaration = actionSource.statements.find(
    (node): node is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(node) && node.name.text === 'CombatStepParameters',
  );
  if (!stepDeclaration) throw new Error('找不到 CombatStepParameters 契约');
  const steps: Record<string, Shape> = {};
  for (const property of checker.getTypeAtLocation(stepDeclaration).getProperties()) {
    steps[property.name] = describe(checker.getTypeOfSymbolAtLocation(property, actionSource));
  }
  const eventDeclaration = actionSource.statements.find(
    (node): node is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(node) && node.name.text === 'CombatEventTrigger',
  );
  if (!eventDeclaration) throw new Error('找不到 CombatEventTrigger 契约');
  const event = describe(checker.getTypeFromTypeNode(eventDeclaration.type));
  const equipmentSource = program.getSourceFile(equipmentFile);
  const modifierDeclaration = equipmentSource?.statements.find(
    (node): node is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(node) && node.name.text === 'EquipmentModifierDefinition',
  );
  if (!modifierDeclaration) throw new Error('找不到 EquipmentModifierDefinition 契约');
  const modifier = describe(checker.getTypeFromTypeNode(modifierDeclaration.type));
  // 宿主定义含图拥有的递归成员，逐字段描述，不能因 sequence 不可展开而丢掉普通字段。
  function definitionFields(source: ts.SourceFile | undefined, name: string) {
    const node = source?.statements.find(
      node =>
        (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
        node.name.text === name,
    );
    if (!node) throw new Error(`找不到 ${name} 契约`);
    return Object.fromEntries(
      checker
        .getTypeAtLocation(node)
        .getProperties()
        .map(property => [
          property.name,
          {
            ...describe(
              checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(property, node)),
            ),
            optional: !!(property.flags & ts.SymbolFlags.Optional),
          },
        ]),
    );
  }
  return {
    conditions: result,
    steps,
    modifier,
    event,
    handler: definitionFields(equipmentSource, 'EquipmentEventHandlerDefinition'),
    contribution: definitionFields(equipmentSource, 'EquipmentContributionDefinition'),
    eventOwners: {
      response: definitionFields(actionSource, 'CombatEventResponseDefinition'),
      handler: definitionFields(actionSource, 'CombatEventHandlerDefinition'),
    },
  };
}

export function formatEventSchema(root: string, structures = extractInspectorStructures(root)) {
  return (
    '// 自动从 game-data-contract/actions.ts 提取，请勿手工编辑。\n' +
    `export const eventStructure = ${JSON.stringify(structures.event)} as const;\n` +
    `export const eventOwnerStructures = ${JSON.stringify(structures.eventOwners)} as const;\n`
  );
}

export function formatContributionSchema(
  root: string,
  structures = extractInspectorStructures(root),
) {
  return (
    '// 自动从 game-data-contract/equipment.ts 提取，请勿手工编辑。\n' +
    `export const handlerStructure = ${JSON.stringify(structures.handler)} as const;\n` +
    `export const contributionStructure = ${JSON.stringify(structures.contribution)} as const;\n`
  );
}

export function formatModifierSchema(root: string, structures = extractInspectorStructures(root)) {
  return (
    '// 自动从 game-data-contract/equipment.ts 提取，请勿手工编辑。\n' +
    `export const modifierStructure = ${JSON.stringify(structures.modifier)} as const;\n`
  );
}

export function extractConditionSchema(root: string) {
  return extractInspectorStructures(root).conditions;
}

export function formatStepSchema(root: string, structures = extractInspectorStructures(root)) {
  return (
    '// 自动从 game-data-contract/actions.ts 提取，请勿手工编辑。\n' +
    'export const stepStructure = {\n' +
    Object.entries(structures.steps)
      .map(([kind, shape]) => `  ${JSON.stringify(kind)}: ${JSON.stringify(shape)},`)
      .join('\n') +
    '\n} as const;\n'
  );
}

export function formatConditionSchema(root: string, structures = extractInspectorStructures(root)) {
  const schema = structures.conditions;
  return (
    '// 自动从 game-data-contract/conditions.ts 提取，请勿手工编辑。\n' +
    'export const conditionStructure = {\n' +
    Object.entries(schema)
      .map(([kind, fields]) => `  ${JSON.stringify(kind)}: ${JSON.stringify(fields)},`)
      .join('\n') +
    '\n} as const;\n'
  );
}
