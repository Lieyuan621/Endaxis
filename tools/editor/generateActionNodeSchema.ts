import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as prettier from 'prettier';
import ts from 'typescript';
import type { ActionGraphStep } from '../../packages/game-data-contract/src/actionGraph.ts';
import type {
  ActionNodeSchema,
  NodeFieldSchema,
  DataNodeSchema,
} from '../../src/ui/action-graph/nodeSchema.ts';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
export const generatedSchemaPath = resolve(
  projectRoot,
  'src/ui/action-graph/actionNodeSchemas.generated.ts',
);

interface PropertyVariant {
  readonly symbol: ts.Symbol;
  readonly type: ts.Type;
}

interface ContractProperty {
  readonly name: string;
  readonly required: boolean;
  readonly variants: readonly PropertyVariant[];
}

function isPresent(type: ts.Type): boolean {
  return type.isUnion()
    ? type.types.some(isPresent)
    : (type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Never)) === 0;
}

function objectVariants(type: ts.Type): readonly ts.Type[] {
  return type.isUnion() ? type.types.flatMap(objectVariants) : [type];
}

/** 联合类型各分支的字段都列出，只有每种分支均要求的字段才标为必填。 */
function propertiesOf(type: ts.Type, checker: ts.TypeChecker): ContractProperty[] {
  const branches = objectVariants(type);
  const names = new Set(
    branches.flatMap(branch => checker.getPropertiesOfType(branch).map(p => p.name)),
  );
  return [...names].flatMap(name => {
    const variants: PropertyVariant[] = [];
    let required = true;
    for (const branch of branches) {
      const symbol = checker.getPropertyOfType(branch, name);
      const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
      if (!symbol || !declaration) {
        required = false;
        continue;
      }
      const propertyType = checker.getTypeOfSymbolAtLocation(symbol, declaration);
      if (!isPresent(propertyType)) {
        required = false;
        continue;
      }
      required &&= (symbol.flags & ts.SymbolFlags.Optional) === 0;
      variants.push({ symbol, type: propertyType });
    }
    return variants.length ? [{ name, required, variants }] : [];
  });
}

function documentation(symbol: ts.Symbol | undefined, checker: ts.TypeChecker): string {
  return symbol ? ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim() : '';
}

function rawType(variant: PropertyVariant, checker: ts.TypeChecker): string {
  const declaration = variant.symbol.valueDeclaration ?? variant.symbol.declarations?.[0];
  if (
    declaration &&
    (ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration)) &&
    declaration.type
  ) {
    return declaration.type.getText().replace(/\s+/g, ' ').trim();
  }
  return checker.typeToString(variant.type, undefined, ts.TypeFormatFlags.NoTruncation);
}

function distinct(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function classify(
  variants: readonly PropertyVariant[],
  checker: ts.TypeChecker,
): Pick<NodeFieldSchema, 'control' | 'options'> {
  const types = variants.map(variant => checker.getNonNullableType(variant.type));
  if (variants.every(variant => rawType(variant, checker).split(' | ').includes('LevelValues')))
    return { control: 'levelValues' };
  const arrayElements = types.map(type =>
    checker.isArrayType(type) ? checker.getTypeArguments(type as ts.TypeReference)[0] : undefined,
  );
  if (arrayElements.every(type => type !== undefined)) {
    const elements = arrayElements.flatMap(type => objectVariants(type!));
    if (elements.every(type => type.isStringLiteral() || type.isNumberLiteral())) {
      return {
        control: 'multiselect',
        options: [...new Set(elements.map(type => (type as ts.LiteralType).value))],
      };
    }
  }
  if (types.every(type => type.aliasSymbol?.name === 'ActionValueOperand')) {
    return { control: 'operand' };
  }
  if (types.every(type => type.getSymbol()?.name === 'ActionGraphReference')) {
    return { control: 'sequence' };
  }
  const hasActionGraph = (type: ts.Type): boolean =>
    objectVariants(type).some(branch => {
      const graph = checker.getPropertyOfType(branch, 'actionGraph');
      const declaration = graph?.valueDeclaration ?? graph?.declarations?.[0];
      return (
        graph !== undefined &&
        declaration !== undefined &&
        isPresent(checker.getTypeOfSymbolAtLocation(graph, declaration))
      );
    });
  const containsResource = (type: ts.Type): boolean =>
    objectVariants(type).every(branch =>
      checker.getPropertiesOfType(branch).some(property => {
        const declaration = property.valueDeclaration ?? property.declarations?.[0];
        return (
          declaration !== undefined &&
          hasActionGraph(checker.getTypeOfSymbolAtLocation(property, declaration))
        );
      }),
    );
  if (types.every(type => hasActionGraph(type))) {
    return { control: 'resource' };
  }
  // 回调数组的独立技能资源在元素的 skill 字段内；容器本身按资源保持不透明。
  if (
    arrayElements.every(type => type !== undefined) &&
    arrayElements.length > 0 &&
    arrayElements.every(type => containsResource(type!))
  ) {
    return { control: 'resource' };
  }
  // null 是实际取值，不等于省略可选属性；含 null 的联合按 JSON 保留。
  const parts = variants.flatMap(variant => objectVariants(variant.type)).filter(isPresent);
  if (parts.every(type => (type.flags & ts.TypeFlags.BooleanLike) !== 0)) {
    const values = new Set(parts.map(type => checker.typeToString(type)));
    if (values.has('true') && values.has('false')) return { control: 'boolean' };
  }
  const options: (string | number | boolean)[] = [];
  for (const type of parts) {
    if (type.isStringLiteral() || type.isNumberLiteral()) options.push(type.value);
    else if (type.flags & ts.TypeFlags.BooleanLiteral) {
      options.push(checker.typeToString(type) === 'true');
    } else {
      options.length = 0;
      break;
    }
  }
  if (options.length) return { control: 'select', options: [...new Set(options)] };
  if (parts.every(type => (type.flags & ts.TypeFlags.NumberLike) !== 0))
    return { control: 'number' };
  if (parts.every(type => (type.flags & ts.TypeFlags.StringLike) !== 0))
    return { control: 'string' };
  return { control: 'json' };
}

function fieldSchema(
  property: ContractProperty,
  prefix: readonly string[],
  checker: ts.TypeChecker,
): NodeFieldSchema {
  return {
    path: [...prefix, property.name],
    label: property.name,
    description: distinct(
      property.variants.map(variant => documentation(variant.symbol, checker)),
    ).join('\n'),
    type: distinct(property.variants.map(variant => rawType(variant, checker))).join(' | '),
    required: property.required,
    ...classify(property.variants, checker),
  };
}

function exportedType(
  program: ts.Program,
  checker: ts.TypeChecker,
  path: string,
  name: string,
): ts.Type {
  const source = program.getSourceFile(path);
  const module = source && checker.getSymbolAtLocation(source);
  const symbol = module && checker.getExportsOfModule(module).find(item => item.name === name);
  if (!symbol) throw new Error(`Missing contract export: ${name}`);
  return checker.getDeclaredTypeOfSymbol(symbol);
}

/** 只读取契约及其依赖，不加载具体干员数据或应用代码。 */
export function generateActionNodeSchemas(
  dataSchemas?: Record<string, DataNodeSchema>,
): Readonly<Record<ActionGraphStep['kind'], ActionNodeSchema>> {
  const contractPath = resolve(projectRoot, 'packages/game-data-contract/src/actionGraph.ts');
  const program = ts.createProgram([contractPath], {
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: true,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
    lib: ['lib.es2023.d.ts'],
  });
  const errors = ts.getPreEmitDiagnostics(program);
  if (errors.length) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(errors, {
        getCurrentDirectory: () => projectRoot,
        getCanonicalFileName: name => name,
        getNewLine: () => '\n',
      }),
    );
  }
  const checker = program.getTypeChecker();
  if (dataSchemas) {
    for (const name of ['CombatCondition', 'ActionValueOperand']) {
      const type = exportedType(
        program,
        checker,
        resolve(projectRoot, 'packages/game-data-contract/src/conditions.ts'),
        name,
      );
      for (const variant of objectVariants(type)) {
        const properties = propertiesOf(variant, checker);
        const kind = properties.find(p => p.name === 'kind');
        const literal = kind?.variants[0]?.type;
        if (!literal?.isStringLiteral()) continue;
        dataSchemas[`${name === 'CombatCondition' ? 'boolean' : 'number'}:${literal.value}`] = {
          description: documentation(kind?.variants[0]?.symbol, checker),
          fields: properties.filter(p => p.name !== 'kind').map(p => fieldSchema(p, [], checker)),
        };
      }
    }
  }
  const steps = exportedType(program, checker, contractPath, 'ActionGraphStep');
  const parameters = exportedType(
    program,
    checker,
    resolve(projectRoot, 'packages/game-data-contract/src/actions.ts'),
    'CombatStepParameters',
  );
  const result: Record<string, ActionNodeSchema> = {};
  for (const step of objectVariants(steps)) {
    const properties = propertiesOf(step, checker);
    const kindType = properties.find(property => property.name === 'kind')?.variants[0]?.type;
    if (!kindType?.isStringLiteral())
      throw new Error('ActionGraphStep must be discriminated by a literal kind.');
    const kind = kindType.value as ActionGraphStep['kind'];
    if (result[kind]) throw new Error(`Duplicate ActionGraphStep kind: ${kind}`);
    const fields: NodeFieldSchema[] = [];
    for (const property of properties) {
      if (property.name === 'kind' || property.name === 'nodeBindings') continue;
      if (property.name === 'parameters') {
        for (const variant of property.variants) {
          for (const parameter of propertiesOf(variant.type, checker)) {
            fields.push(fieldSchema(parameter, ['parameters'], checker));
          }
        }
      } else {
        fields.push(fieldSchema(property, [], checker));
      }
    }
    result[kind] = {
      kind,
      description:
        documentation(checker.getPropertyOfType(parameters, kind), checker) ||
        documentation(step.aliasSymbol ?? step.getSymbol(), checker),
      fields,
    };
  }
  return result as Readonly<Record<ActionGraphStep['kind'], ActionNodeSchema>>;
}

export async function renderActionNodeSchemas(): Promise<string> {
  const dataSchemas: Record<string, DataNodeSchema> = {};
  const schemas = generateActionNodeSchemas(dataSchemas);
  const source =
    `// Generated by tools/editor/generateActionNodeSchema.ts. Do not edit.\n` +
    `import type { ActionGraphStep } from '../../../packages/game-data-contract/src/actionGraph.ts';\n` +
    `import type { ActionNodeSchema, DataNodeSchema } from './nodeSchema.ts';\n\n` +
    `export const actionNodeSchemas: Readonly<Record<ActionGraphStep['kind'], ActionNodeSchema>> = ${JSON.stringify(schemas, null, 2)};\n` +
    `export const dataNodeSchemas: Readonly<Record<string, DataNodeSchema>> = ${JSON.stringify(dataSchemas, null, 2)};\n`;
  return prettier.format(source, {
    ...(await prettier.resolveConfig(generatedSchemaPath)),
    filepath: generatedSchemaPath,
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--check'))
    throw new Error('Usage: generateActionNodeSchema.ts [--check]');
  const source = await renderActionNodeSchemas();
  if (args.includes('--check')) {
    const existing = await readFile(generatedSchemaPath, 'utf8').catch(() => undefined);
    if (existing !== source) {
      throw new Error(
        'Action node schemas are stale. Run tools/editor/generateActionNodeSchema.ts.',
      );
    }
    process.stdout.write('Action node schemas are up to date.\n');
  } else {
    await mkdir(dirname(generatedSchemaPath), { recursive: true });
    await writeFile(generatedSchemaPath, source, 'utf8');
    process.stdout.write(`Generated ${generatedSchemaPath}\n`);
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
