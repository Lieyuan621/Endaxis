import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { COMBAT_PROTOCOL_RUNTIME_GAPS } from '../../../src/core/combat/runtime/combatProtocolCapabilities.ts';
import {
  ABILITY_EVENTS,
  ATTRIBUTE_MODIFIER_SLOTS,
  ATTRIBUTE_MODIFIER_TIMINGS,
  COMBO_SKILL_PRIORITIES,
  COMBAT_CONDITION_KINDS,
  COMBAT_EVENT_TRIGGER_KINDS,
  COMBAT_STEP_KINDS,
  COMPARISON_OPERATORS,
  DAMAGE_MODIFIER_SIDES,
  DAMAGE_PROCESS_TIMINGS,
  EQUIPMENT_ABILITY_EVENTS,
  GAMEPLAY_TAG_QUERY_TYPES,
  GEAR_SLOT_TYPES,
  NATIVE_SKILL_TYPES,
  OPERATOR_WEAPON_TYPES,
  OPERATOR_RARITIES,
  OPERATOR_ROLES,
  DAMAGE_ELEMENTS,
  PLAYER_SKILL_INPUTS,
  PHYSICAL_INFLICTION_TYPES,
  SKILL_LEVEL_SOURCES,
  SKILL_TRIGGER_SCOPES,
  SP_GAIN_SOURCES,
  WEAPON_RARITIES,
} from '../../../packages/game-data-contract/src/index.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const contractRoot = join(root, 'packages/game-data-contract/src');
const compilerRoot = join(root, 'tools/game-data-compiler');
const toolsRoot = join(root, 'tools');
const productRoot = join(root, 'src');

/** Vue 的模板和样式不是 TypeScript；保留普通 script 和 script setup 的检查。 */
function scriptSources(path: string, text: string): string[] {
  return path.endsWith('.vue')
    ? [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]!)
    : [text];
}

function inside(file: string, directory: string): boolean {
  const path = relative(directory, file);
  return path === '' || (!path.startsWith('..') && !path.includes(':'));
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.(ts|vue)$/.test(entry.name) ? [path] : [];
  });
}

/** 类型导入和动态导入同样是依赖；字符串中的生成代码不算当前模块的依赖。 */
function moduleReferences(text: string): string[] {
  const file = ts.createSourceFile('source.ts', text, ts.ScriptTarget.Latest, true);
  const references: string[] = [];
  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      references.push(node.moduleSpecifier.text);
    }
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    ) {
      references.push(node.argument.literal.text);
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      const argument = node.arguments[0];
      references.push(
        argument && ts.isStringLiteral(argument) ? argument.text : '<computed-import>',
      );
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return references;
}

function loadProgram(configFile: string): ts.Program {
  const config = ts.readConfigFile(configFile, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configFile));
  expect(parsed.errors).toEqual([]);
  return ts.createProgram(parsed.fileNames, parsed.options);
}

describe('独立游戏数据契约边界', () => {
  it('公共战斗事件触发器同时具备严格校验草稿和语义运行时匹配分支', () => {
    const runtimePath = join(productRoot, 'core/combat/events/combatSemanticEventRuntime.ts');
    const ast = ts.createSourceFile(
      runtimePath,
      readFileSync(runtimePath, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const runtimeCases = new Set<string>();
    const visit = (node: ts.Node): void => {
      if (ts.isCaseClause(node) && ts.isStringLiteral(node.expression)) {
        runtimeCases.add(node.expression.text);
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);

    expect(COMBAT_EVENT_TRIGGER_KINDS.filter(kind => !runtimeCases.has(kind))).toEqual([]);
  });

  it('公共动作和条件没有新增未登记的生产运行时缺口', () => {
    const runtimeDirectories = [
      'runtime',
      'actions',
      'abilities',
      'buffs',
      'skills',
      'time',
      'resources',
      'damage',
      'heal',
      'infliction',
      'events',
      'status',
    ];
    const runtimeFiles = runtimeDirectories.flatMap(directory =>
      sourceFiles(join(productRoot, 'core/combat', directory)),
    );
    const discriminants = new Set<string>();
    for (const path of runtimeFiles.filter(
      path =>
        !/\.(test|spec)\.ts$/.test(path) && !path.endsWith('standardPlayerDamageCompatibility.ts'),
    )) {
      const ast = ts.createSourceFile(
        path,
        readFileSync(path, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      );
      const visit = (node: ts.Node): void => {
        if (
          ts.isBinaryExpression(node) &&
          [
            ts.SyntaxKind.EqualsEqualsToken,
            ts.SyntaxKind.EqualsEqualsEqualsToken,
            ts.SyntaxKind.ExclamationEqualsToken,
            ts.SyntaxKind.ExclamationEqualsEqualsToken,
          ].includes(node.operatorToken.kind)
        ) {
          for (const [left, right] of [
            [node.left, node.right],
            [node.right, node.left],
          ] as const) {
            if (
              ts.isPropertyAccessExpression(left) &&
              left.name.text === 'kind' &&
              ts.isStringLiteral(right)
            ) {
              discriminants.add(right.text);
            }
          }
        }
        if (ts.isCaseClause(node) && ts.isStringLiteral(node.expression)) {
          discriminants.add(node.expression.text);
        }
        ts.forEachChild(node, visit);
      };
      visit(ast);
    }
    expect(COMBAT_STEP_KINDS.filter(kind => !discriminants.has(kind))).toEqual(
      Object.keys(COMBAT_PROTOCOL_RUNTIME_GAPS.steps),
    );
    expect(COMBAT_CONDITION_KINDS.filter(kind => !discriminants.has(kind))).toEqual(
      Object.keys(COMBAT_PROTOCOL_RUNTIME_GAPS.conditions),
    );
  });

  it('实体及整名干员装配直接接受契约检查，不用类型断言绕过输出差异', () => {
    const violations: string[] = [];
    for (const name of [
      'compiler/abilities/abilityEntityDefinition.ts',
      'compiler/abilities/abilityEntityChildSkill.ts',
      'domains/operator/definition.ts',
    ]) {
      const path = join(compilerRoot, 'src', name);
      const ast = ts.createSourceFile(
        path,
        readFileSync(path, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      );
      const visit = (node: ts.Node): void => {
        // as const 仅保留字面量/只读元组，不允许 as 正式协议、unknown 或其他类型。
        if (
          (ts.isAsExpression(node) && node.type.getText(ast) !== 'const') ||
          ts.isTypeAssertionExpression(node)
        )
          violations.push(name);
        ts.forEachChild(node, visit);
      };
      visit(ast);
    }
    expect(violations).toEqual([]);
  });

  it('已迁移阶段输出不得重新手写契约字段', () => {
    const protectedFields: Record<string, readonly string[]> = {
      CompiledWeaponStaticDefinitionSource: [
        'slug',
        'rarity',
        'weaponType',
        'baseAttackAtLevelNodes',
      ],
      CompiledWeaponTraitStaticDefinitionSource: ['key', 'levelCount'],
      CompiledWeaponRuntimeDefinitionSource: ['assetSlug', 'iconPath', 'blackboard'],
      CompiledWeaponEventHandlerSource: ['key', 'priority', 'blackboard'],
      CompiledGearDefinitionSource: [
        'slug',
        'assetSlug',
        'iconPath',
        'slotType',
        'levelRequirement',
        'baseDefense',
        'gearSetSlug',
      ],
      CompiledGearTraitDefinitionSource: ['key', 'levelCount', 'display'],
      CompiledOperatorDefinitionHeaderSource: [
        'slug',
        'gameId',
        'rarity',
        'weaponType',
        'element',
        'role',
        'mainAttribute',
        'secondaryAttribute',
      ],
      CompiledOperatorAttributeGrowthSource: [
        'strength',
        'agility',
        'intellect',
        'will',
        'baseAttack',
        'baseHealth',
      ],
      CompiledTrustAttributeBonusSource: ['values'],
      CompiledGearSetStaticDefinitionSource: ['slug'],
      CompiledOperatorActiveSkillRuntimeDefinitionSource: [
        'key',
        'skillId',
        'blackboard',
        'timelineBlockFrames',
        'costFrame',
        'cooldownFrames',
        'startFrame',
        'endFrame',
      ],
      CompiledActiveSkillTimelineSequenceSource: ['startFrame', 'endFrame'],
      OperatorSkillIdentitySource: ['key', 'skillType'],
      OperatorSkillGroupVariantSource: ['key', 'levelSource'],
      OperatorSkillGroupSource: ['key', 'skillType', 'levelSource'],
      OperatorActiveSkillEntrySource: ['key', 'skillType'],
    };
    const found = new Set<string>();
    const violations: string[] = [];
    for (const path of sourceFiles(join(compilerRoot, 'src'))) {
      const ast = ts.createSourceFile(
        path,
        readFileSync(path, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      );
      for (const declaration of ast.statements) {
        if (!ts.isTypeAliasDeclaration(declaration) && !ts.isInterfaceDeclaration(declaration))
          continue;
        const fields = protectedFields[declaration.name.text];
        if (!fields) continue;
        found.add(declaration.name.text);
        const visit = (node: ts.Node): void => {
          if (ts.isPropertySignature(node) && fields.includes(node.name.getText(ast))) {
            violations.push(
              `${relative(root, path)}: ${declaration.name.text}.${node.name.getText(ast)}`,
            );
          }
          ts.forEachChild(node, visit);
        };
        visit(declaration);
      }
    }
    expect([...found].sort()).toEqual(Object.keys(protectedFields).sort());
    expect(violations).toEqual([]);
  });

  it.each([
    'tools/game-data-compiler/src/compiler',
    'tools/game-data-compiler/src/domains',
    'tools/game-data-compiler/src/source',
    'src/core',
    'src/data',
    'src/ui',
  ])('已确认归属的正式枚举不得换名复制为类型或校验集合：%s', directory => {
    // 只约束已逐项确认身份的枚举，不把任意“长得相同”的原生类型自动合并。
    const signature = (values: readonly (string | number)[]) =>
      values
        .map(value => JSON.stringify(value))
        .sort()
        .join('|');
    const owners = new Map([
      [signature(WEAPON_RARITIES), 'WeaponRarity'],
      [signature(OPERATOR_WEAPON_TYPES), 'OperatorWeaponType'],
      [signature(EQUIPMENT_ABILITY_EVENTS), 'EquipmentAbilityEvent'],
      [signature(GEAR_SLOT_TYPES), 'GearSlotType'],
      [signature(OPERATOR_RARITIES), 'OperatorRarity'],
      [signature(OPERATOR_ROLES), 'OperatorRole'],
      [signature(DAMAGE_ELEMENTS), 'DamageElement'],
      [signature(SKILL_LEVEL_SOURCES), 'SkillLevelSource'],
      [signature(ABILITY_EVENTS), 'AbilityEvent'],
      [signature(GAMEPLAY_TAG_QUERY_TYPES), 'GameplayTagQueryType'],
      [signature(COMPARISON_OPERATORS), 'ComparisonOperator'],
      [signature(SP_GAIN_SOURCES), 'SpGainSource'],
      [signature(ATTRIBUTE_MODIFIER_TIMINGS), 'AttributeModifierTiming'],
      [signature(ATTRIBUTE_MODIFIER_SLOTS), 'AttributeModifierSlot'],
      [signature(DAMAGE_PROCESS_TIMINGS), 'DamageProcessTiming'],
      [signature(DAMAGE_MODIFIER_SIDES), 'DamageModifierSide'],
      [signature(PLAYER_SKILL_INPUTS), 'PlayerSkillInput'],
      [signature(NATIVE_SKILL_TYPES), 'NativeSkillType'],
      [signature(SKILL_TRIGGER_SCOPES), 'SkillTriggerScope'],
      [signature(COMBO_SKILL_PRIORITIES), 'ComboSkillPriority'],
      [signature(COMBAT_EVENT_TRIGGER_KINDS), 'CombatEventTriggerKind'],
      [signature(PHYSICAL_INFLICTION_TYPES), 'PhysicalInflictionType'],
    ]);
    const violations: string[] = [];
    const enumSizes = new Set([...owners.keys()].map(key => key.split('|').length));
    const check = (nodes: readonly ts.Node[], path: string) => {
      // 长度不同不可能是完整复制，避免为大量实际数据数组生成、排序签名。
      if (!enumSizes.has(nodes.length)) return;
      const values: (string | number)[] = [];
      for (const node of nodes) {
        const literal = ts.isLiteralTypeNode(node) ? node.literal : node;
        if (ts.isStringLiteral(literal)) values.push(literal.text);
        else if (ts.isNumericLiteral(literal)) values.push(Number(literal.text));
        else return;
      }
      const owner = owners.get(signature(values));
      if (owner) violations.push(`${relative(root, path)}: 应复用 ${owner}`);
    };
    for (const path of sourceFiles(join(root, directory)).filter(
      path => !/[\\/]generated(?:-definitions)?[\\/]|\.generated\./.test(path),
    )) {
      for (const script of scriptSources(path, readFileSync(path, 'utf8'))) {
        const ast = ts.createSourceFile(path, script, ts.ScriptTarget.Latest, true);
        const visit = (node: ts.Node): void => {
          if (ts.isUnionTypeNode(node)) {
            // Extract/Exclude 的第二项是支持范围选择，不是独立枚举声明。
            const parent = node.parent;
            const isSubsetSelection =
              ts.isTypeReferenceNode(parent) &&
              ['Extract', 'Exclude'].includes(parent.typeName.getText(ast)) &&
              parent.typeArguments?.[1] === node;
            if (!isSubsetSelection) check(node.types, path);
          }
          // 校验集合受约束；实际输出载荷和原生→正式的映射表不属于重复声明。
          if (ts.isVariableDeclaration(node) && node.initializer) {
            let value = node.initializer;
            while (ts.isAsExpression(value) || ts.isParenthesizedExpression(value))
              value = value.expression;
            if (
              ts.isNewExpression(value) &&
              value.expression.getText(ast) === 'Set' &&
              value.arguments?.[0]
            ) {
              value = value.arguments[0];
            }
            if (ts.isArrayLiteralExpression(value)) check(value.elements, path);
          }
          if (
            ts.isNewExpression(node) &&
            node.expression.getText(ast) === 'Set' &&
            node.arguments?.[0] &&
            ts.isArrayLiteralExpression(node.arguments[0])
          ) {
            check(node.arguments[0].elements, path);
          }
          ts.forEachChild(node, visit);
        };
        visit(ast);
      }
    }
    expect(violations).toEqual([]);
  });

  it('条件与叶子投影不得直接或间接回流到上层编排，包括类型依赖', () => {
    const directory = join(compilerRoot, 'src/compiler');
    const layers = new Map([
      [join(directory, 'combatProjectionCommon.ts'), 0],
      [join(directory, 'combatConditionProjection.ts'), 1],
      [join(directory, 'combatActionLeafProjection.ts'), 1],
      [join(directory, 'combatEntityAndTimeProjection.ts'), 2],
      [join(directory, 'buffRuntimeProjection.ts'), 3],
    ]);
    const graph = new Map(
      sourceFiles(join(compilerRoot, 'src')).map(path => [
        path,
        moduleReferences(readFileSync(path, 'utf8'))
          .filter(specifier => specifier.startsWith('.'))
          .map(specifier => resolve(dirname(path), specifier)),
      ]),
    );
    const violations: string[] = [];
    for (const [start, layer] of layers) {
      const visited = new Set<string>();
      const visit = (path: string, chain: readonly string[]): void => {
        for (const dependency of graph.get(path) ?? []) {
          const next = [...chain, dependency];
          const targetLayer = layers.get(dependency);
          if (targetLayer !== undefined && targetLayer >= layer) {
            violations.push(next.map(item => relative(directory, item)).join(' -> '));
          }
          if (!visited.has(dependency)) {
            visited.add(dependency);
            visit(dependency, next);
          }
        }
      };
      visit(start, [start]);
    }
    expect(violations).toEqual([]);
  });

  it('生产消费者直接引用类型所有者，拆分模块不复制同名函数或常量', () => {
    const violations: string[] = [];
    const implementationFiles = new Set(
      [
        'buffRuntimeProjection.ts',
        'combatProjectionCommon.ts',
        'combatConditionProjection.ts',
        'combatActionLeafProjection.ts',
        'combatEntityAndTimeProjection.ts',
      ].map(file => join(compilerRoot, 'src/compiler', file)),
    );
    const owners = new Map<string, string>();
    for (const path of sourceFiles(join(compilerRoot, 'src'))) {
      const ast = ts.createSourceFile(
        path,
        readFileSync(path, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      );
      for (const node of ast.statements) {
        if (
          ts.isImportDeclaration(node) &&
          ts.isStringLiteral(node.moduleSpecifier) &&
          node.moduleSpecifier.text.endsWith('/buffRuntimeProjection.ts')
        ) {
          const clause = node.importClause;
          if (
            clause?.isTypeOnly ||
            (clause?.namedBindings &&
              ts.isNamedImports(clause.namedBindings) &&
              clause.namedBindings.elements.some(item => item.isTypeOnly))
          ) {
            violations.push(`${relative(root, path)}: 类型不得借道实现入口`);
          }
        }
        if (!implementationFiles.has(path)) continue;
        const names =
          ts.isFunctionDeclaration(node) && node.name
            ? [node.name.text]
            : ts.isVariableStatement(node)
              ? node.declarationList.declarations.map(item => item.name.getText(ast))
              : [];
        for (const name of names) {
          if (owners.has(name)) violations.push(`${name}: ${owners.get(name)} / ${path}`);
          owners.set(name, path);
        }
      }
    }
    expect(violations).toEqual([]);
  });
  it('投影输出类型有唯一声明，且不反向依赖来源或编译实现', () => {
    const owners: Record<string, readonly string[]> = {
      'actions/combatActionProjectionTypes.ts': [
        'CompiledActionValueOperandSource',
        'CompiledSimpleDamageOperationSource',
        'CompiledBuffConditionSource',
        'CompiledBuffStepSource',
        'CompiledBuffSequenceSource',
      ],
      'buffs/buffProjectionTypes.ts': [
        'CompiledBuffNumberSource',
        'CompiledBuffPresentationSource',
        'CompiledBuffAttributeModifierSource',
        'CompiledBuffDamageModifierSource',
        'CompiledBuffHealModifierSource',
        'CompiledBuffPoiseModifierSource',
        'CompiledBuffDefinitionSource',
      ],
    };
    const expected = new Map(
      Object.entries(owners).flatMap(([file, names]) =>
        names.map(name => [name, join(compilerRoot, 'src/compiler', file)] as const),
      ),
    );
    const found = new Map<string, string[]>();
    const violations: string[] = [];
    for (const path of sourceFiles(join(compilerRoot, 'src'))) {
      const text = readFileSync(path, 'utf8');
      const ast = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
      for (const node of ast.statements) {
        if (
          (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
          expected.has(node.name.text)
        ) {
          found.set(node.name.text, [...(found.get(node.name.text) ?? []), path]);
        }
      }
      if (![...expected.values()].includes(path)) continue;
      for (const specifier of moduleReferences(text)) {
        const resolved = resolve(dirname(path), specifier);
        if (
          !inside(resolved, contractRoot) &&
          resolved !== join(compilerRoot, 'src/compiler/actions/combatActionProjectionTypes.ts')
        ) {
          violations.push(`${relative(root, path)}: 禁止依赖 ${specifier}`);
        }
      }
      for (const node of ast.statements) {
        if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) continue;
        if (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly) continue;
        violations.push(`${relative(root, path)}: 输出类型模块只允许类型声明和 type-only 导入`);
      }
    }
    expect(violations).toEqual([]);
    for (const [name, path] of expected) expect(found.get(name), name).toEqual([path]);
  });

  it('依赖扫描覆盖类型、转导出及动态引用，但不把生成字符串误判成 import', () => {
    expect(
      moduleReferences(`
      import type { A } from './a.ts';
      export { B } from './b.ts';
      type C = import('./c.ts').C;
      const d = import('./d.ts');
      const e = require('./e.ts');
      const f = import(variable);
      const generated = "import { G } from './g.ts'";
    `),
    ).toEqual(['./a.ts', './b.ts', './c.ts', './d.ts', './e.ts', '<computed-import>']);
  });

  it('Vue 扫描保留两个脚本块，不解析模板和样式', () => {
    const scripts = scriptSources(
      'component.vue',
      `
      <template><div>import('./template.ts')</div></template>
      <script lang="ts">import './normal.ts';</script>
      <script setup lang="ts">type T = import('./setup.ts').T;</script>
      <style>.label::after { content: "import('./style.ts')"; }</style>
    `,
    );
    expect(scripts.flatMap(moduleReferences)).toEqual(['./normal.ts', './setup.ts']);
  });

  it('契约只能依赖包内声明，不得包含运行类或回调字段', () => {
    const violations: string[] = [];
    for (const path of sourceFiles(contractRoot)) {
      const text = readFileSync(path, 'utf8');
      for (const specifier of moduleReferences(text)) {
        if (
          !specifier.startsWith('.') ||
          !inside(resolve(dirname(path), specifier), contractRoot)
        ) {
          violations.push(`${relative(root, path)}: ${specifier}`);
        }
      }
      const ast = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
      function visit(node: ts.Node): void {
        if (
          ts.isClassDeclaration(node) ||
          ts.isFunctionTypeNode(node) ||
          ts.isMethodSignature(node) ||
          ts.isCallSignatureDeclaration(node)
        ) {
          violations.push(`${relative(root, path)}: 运行类或回调不能进入数据契约`);
        }
        ts.forEachChild(node, visit);
      }
      visit(ast);
    }
    expect(violations).toEqual([]);
  });

  it('契约无需本体、转换器、Node 或 DOM 类型即可独立检查', () => {
    const program = loadProgram(join(contractRoot, '../tsconfig.json'));
    const external = program
      .getSourceFiles()
      .filter(file => !file.isDeclarationFile && !inside(file.fileName, contractRoot));
    expect(external.map(file => file.fileName)).toEqual([]);
    expect(
      ts
        .getPreEmitDiagnostics(program)
        .map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n')),
    ).toEqual([]);
  });

  it('转换器生产依赖图不加载本体', () => {
    const program = loadProgram(join(compilerRoot, 'tsconfig.production.json'));
    const violations = program
      .getSourceFiles()
      .filter(
        file =>
          !file.isDeclarationFile &&
          ![compilerRoot, contractRoot].some(directory => inside(file.fileName, directory)),
      );
    expect(violations.map(file => relative(root, file.fileName))).toEqual([]);
    expect(
      ts
        .getPreEmitDiagnostics(program)
        .map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n')),
    ).toEqual([]);
  });

  it('本体生产代码不得引用命令行工具或游戏数据编译器，跨端测试是显式例外', () => {
    const violations: string[] = [];
    for (const path of sourceFiles(productRoot).filter(path => !/\.(test|spec)\.ts$/.test(path))) {
      const text = readFileSync(path, 'utf8');
      // Vue 文件只扫描 script / script setup，不能拿整个模板当 TypeScript 解析。
      const scripts = scriptSources(path, text);
      for (const specifier of scripts.flatMap(moduleReferences)) {
        if (
          specifier.includes('game-data-compiler') ||
          (specifier.startsWith('.') && inside(resolve(dirname(path), specifier), toolsRoot))
        ) {
          violations.push(`${relative(root, path)}: ${specifier}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
