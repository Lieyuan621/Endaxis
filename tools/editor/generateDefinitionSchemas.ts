/** 从正式契约生成对象字段类型，不读取干员样本或现有项目。 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import ts from 'typescript';
import type { DefinitionFieldSchema } from '../../src/ui/definition-editor/fieldSchema.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const contract = resolve(root, 'packages/game-data-contract/src');
const output = resolve(root, 'src/ui/definition-editor/definitionSchemas.generated.ts');
const sources = {
  operator: ['operators.ts', 'OperatorDefinition'],
  weapon: ['equipment.ts', 'WeaponDefinition'],
  gear: ['equipment.ts', 'GearDefinition'],
  gearSet: ['equipment.ts', 'GearSetDefinition'],
  consumable: ['consumables.ts', 'ConsumableDefinition'],
  enemy: ['../../../src/core/game-data/enemyDefinition.ts', 'EnemyDefinition'],
  globalEffect: ['../../../src/core/game-data/globalEffectDefinition.ts', 'GlobalEffectDefinition'],
  contract: ['mechanics.ts', 'ContingencyContractTagDefinition'],
  skill: ['skills.ts', 'SkillDefinition'],
  skillGroup: ['skills.ts', 'SkillGroupDefinition'],
  skillGroupVariant: ['skills.ts', 'SkillGroupVariantDefinition'],
  buff: ['buffs.ts', 'SkillBuffDefinition'],
  abilityEntity: ['skills.ts', 'AbilityEntityDefinition'],
  abilityEntityChildSkill: ['skills.ts', 'AbilityEntityChildSkillDefinition'],
  abilityEntityPassiveSkill: ['skills.ts', 'AbilityEntityPassiveSkillDefinition'],
  operatorPassiveSkill: ['operators.ts', 'OperatorPassiveSkillDefinition'],
  operatorUpgrade: ['operators.ts', 'OperatorUpgradeDefinition'],
  weaponTrait: ['equipment.ts', 'WeaponTraitDefinition'],
  gearTrait: ['equipment.ts', 'GearTraitDefinition'],
} as const;

const program = ts.createProgram(
  [...new Set(Object.values(sources).map(([file]) => resolve(contract, file)))],
  {
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: true,
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    types: [],
    lib: ['lib.es2023.d.ts'],
  },
);
const checker = program.getTypeChecker();

function typeOf(file: string, name: string): ts.Type {
  const source = program.getSourceFile(resolve(contract, file));
  const module = source && checker.getSymbolAtLocation(source);
  const symbol = module && checker.getExportsOfModule(module).find(entry => entry.name === name);
  if (!symbol) throw new Error(`missing contract type ${name}`);
  return checker.getDeclaredTypeOfSymbol(symbol);
}

function doc(symbol: ts.Symbol | undefined): string | undefined {
  const text = symbol && ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
  return text || undefined;
}

function branches(type: ts.Type): readonly ts.Type[] {
  return type.isUnion() ? type.types.flatMap(branches) : [type];
}

function describe(type: ts.Type, seen: ReadonlySet<number>, depth: number): DefinitionFieldSchema {
  // 条件是独立的表达式结构；不能把几十种分支当作普通下拉框编辑。
  // TypeScript 会在可选属性上展开 aliasSymbol，但 typeToString 仍保留契约名称。
  const typeName = checker.typeToString(type);
  if (/^(CombatCondition|BuildCondition)(?: \| (?:undefined|null))*$/.test(typeName))
    return { kind: 'condition', ...(typeName.includes('undefined') ? { optional: true } : {}) };
  const nullable = branches(type).filter(
    part => (part.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Never)) === 0,
  );
  if (!nullable.length) return { kind: 'opaque' };
  const optional = branches(type).some(part => (part.flags & ts.TypeFlags.Undefined) !== 0);
  const field = (shape: DefinitionFieldSchema): DefinitionFieldSchema =>
    optional ? { ...shape, optional: true } : shape;
  if (nullable.length > 1) {
    const literals = nullable.filter(part => part.isStringLiteral() || part.isNumberLiteral());
    if (literals.length === nullable.length)
      return field({ kind: 'enum', options: literals.map(part => (part as ts.LiteralType).value) });
    if (nullable.every(part => (part.flags & ts.TypeFlags.BooleanLike) !== 0))
      return field({ kind: 'boolean' });
    const others = nullable.filter(part => !literals.includes(part));
    return field({
      kind: 'union',
      variants: [
        ...(literals.length
          ? [
              {
                kind: 'enum' as const,
                options: literals.map(part => (part as ts.LiteralType).value),
              },
            ]
          : []),
        ...others.map(part => describe(part, seen, depth)),
      ],
    });
  }
  const current = nullable[0]!;
  if ((current.flags & ts.TypeFlags.Null) !== 0) return field({ kind: 'null' });
  if (current.isStringLiteral() || current.isNumberLiteral())
    return field({ kind: 'enum', options: [current.value] });
  if ((current.flags & ts.TypeFlags.NumberLike) !== 0) return field({ kind: 'number' });
  if ((current.flags & ts.TypeFlags.StringLike) !== 0) return field({ kind: 'string' });
  if ((current.flags & ts.TypeFlags.BooleanLike) !== 0) return field({ kind: 'boolean' });
  const name = current.aliasSymbol?.name ?? current.getSymbol()?.name;
  if (name === 'ActionGraphResourceDefinition' || name === 'ActionGraphDefinition')
    return field({ kind: 'graph' });
  if (name === 'ActionGraphReference') return field({ kind: 'opaque' });
  if (depth > 0 && checker.getPropertyOfType(current, 'actionGraph'))
    return field({ kind: 'opaque' });
  // 深层独立资源通过对象导航单独打开；这里不把整个游戏数据契约反复内联到每个字段。
  if (checker.isArrayType(current) || checker.isTupleType(current)) {
    const element = checker.getTypeArguments(current as ts.TypeReference)[0];
    return field({
      kind: 'array',
      element: element ? describe(element, seen, depth) : { kind: 'opaque' },
    });
  }
  const index = checker.getIndexTypeOfType(current, ts.IndexKind.String);
  if (index) return field({ kind: 'record', value: describe(index, seen, depth + 1) });
  if (depth >= 3 || seen.has(current.id)) return field({ kind: 'opaque' });
  const nested = new Set(seen).add(current.id);
  const fields: Record<string, DefinitionFieldSchema> = {};
  for (const property of checker.getPropertiesOfType(current)) {
    // 映射类型的属性可能没有独立声明节点，仍有完整类型，不能直接跳过。
    const propertyType = checker.getTypeOfSymbol(property);
    const child =
      property.name === 'actionGraph'
        ? ({ kind: 'graph' } as const)
        : describe(propertyType, nested, depth + 1);
    fields[property.name] = {
      ...child,
      ...(property.flags & ts.SymbolFlags.Optional ? { optional: true } : {}),
      ...(doc(property) ? { description: doc(property) } : {}),
    };
  }
  return field({ kind: 'object', fields });
}

export async function generateDefinitionSchemas(check = false): Promise<void> {
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length)
    throw new Error(
      ts.formatDiagnostics(diagnostics, {
        getCurrentDirectory: () => root,
        getCanonicalFileName: name => name,
        getNewLine: () => '\n',
      }),
    );
  const catalog = Object.fromEntries(
    Object.entries(sources).map(([kind, [file, name]]) => [
      kind,
      describe(typeOf(file, name), new Set(), 0),
    ]),
  );
  const prettierConfig = await prettier.resolveConfig(output);
  const source = await prettier.format(
    `/** 由 tools/editor/generateDefinitionSchemas.ts 从正式契约生成，请勿手改。 */\nimport type { DefinitionSchemaCatalog } from './fieldSchema';\nexport const definitionSchemas = ${JSON.stringify(catalog)} as const satisfies DefinitionSchemaCatalog;\n`,
    { ...prettierConfig, filepath: output },
  );
  if (check) {
    if ((await readFile(output, 'utf8')) !== source)
      throw new Error('definition field schemas are stale; run generate:definition-fields');
  } else await writeFile(output, source);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await generateDefinitionSchemas(process.argv.includes('--check'));
}
