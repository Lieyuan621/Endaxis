/** 从正式契约生成对象字段类型，不读取干员样本或现有项目。 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import ts from 'typescript';
import { renderSharedSchemaObjects } from './renderSharedSchemaObjects.ts';
import { describeDefinitionType } from './describeDefinitionType.ts';
export { describeDefinitionType } from './describeDefinitionType.ts';

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

export async function generateDefinitionSchemas(check = false): Promise<void> {
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
      describeDefinitionType(typeOf(file, name), checker, undefined, root, {
        definitionRoot: true,
      }),
    ]),
  );
  const rendered = renderSharedSchemaObjects(catalog, 'definitionSchemaPart');
  const prettierConfig = await prettier.resolveConfig(output);
  const source = await prettier.format(
    `/** 由 tools/editor/generateDefinitionSchemas.ts 从正式契约生成，请勿手改。 */\nimport type { DefinitionSchemaCatalog } from './fieldSchema';\n${rendered.declarations}\nexport const definitionSchemas = ${rendered.expression} as const satisfies DefinitionSchemaCatalog;\n`,
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
