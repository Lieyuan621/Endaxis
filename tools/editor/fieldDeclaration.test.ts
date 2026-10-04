import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import {
  createFieldDeclarationExtractor,
  mergeFieldDeclarationMetadata,
} from './fieldDeclaration.ts';
import { createFieldSemanticExtractor } from './fieldSemantics.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
function metadata(code: string, file = 'packages/game-data-contract/src/actions.ts') {
  const source = ts.createSourceFile(resolve(root, file), code, ts.ScriptTarget.Latest, true);
  const extract = createFieldDeclarationExtractor(root);
  const result: Record<string, ReturnType<typeof extract>[]> = {};
  function visit(node: ts.Node) {
    if (ts.isPropertySignature(node)) {
      const name = node.name.getText(source);
      const value = extract({ declarations: [node] } as unknown as ts.Symbol);
      (result[name] ??= []).push(value);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return result;
}

test('exact declaration capabilities survive movement, LF and CRLF', () => {
  const code = `export interface CombatStepParameters {
    spawnAbilityEntity: { definition: { value: number } };
    readSkillSettingData: { items: readonly { values: number[]; storeKey: string }[] };
  }`;
  const expected = metadata(code);
  assert.deepEqual(expected.definition, [
    { declaration: 'CombatStepParameters.spawnAbilityEntity.definition' },
  ]);
  assert.deepEqual(expected.values, [
    { declaration: 'CombatStepParameters.readSkillSettingData.items.values' },
  ]);
  assert.deepEqual(expected.storeKey, [{ blackboardOrigin: 'contract' }]);
  for (const newline of ['\n', '\r\n'])
    assert.deepEqual(
      metadata(('// moved declaration\n\n' + code).replaceAll('\n', newline)),
      expected,
    );
});

test('same-shaped foreign, nested namespace and unregistered declarations grant no capability', () => {
  const code =
    'export interface CombatStepParameters { spawnAbilityEntity: { definition: { value: number } } }';
  for (const file of [
    'custom/actions.ts',
    'packages/other/src/actions.ts',
    'packages/game-data-contract/src/skills.ts',
  ])
    assert.deepEqual(metadata(code, file).definition, [{}]);
  assert.deepEqual(metadata(`namespace Foreign { ${code} }`).definition, [{}]);
  assert.deepEqual(metadata('interface Other { definition: { value: number } }').definition, [{}]);
});

test('reference roles retain formal file scopes and never label ordinary child keys', () => {
  const code =
    'interface Fixture { buffId: string | { blackboardKey: string }; skillId: string; skillIds: readonly string[] }';
  const values = metadata(code);
  assert.deepEqual(values.buffId, [{ referenceKind: 'buff' }]);
  assert.deepEqual(values.skillId, [{ referenceKind: 'skill' }]);
  assert.deepEqual(values.blackboardKey, [{}]);
  assert.deepEqual(metadata(code, 'packages/game-data-contract/src/equipment.ts').skillId, [{}]);
  assert.deepEqual(metadata(code, 'custom/actions.ts').buffId, [{}]);
});

test('readonly slots, native IDs and blackboard origins require their declaration owners', () => {
  assert.deepEqual(
    metadata(
      'interface OperatorDefinition { skillAliases: {} }',
      'packages/game-data-contract/src/operators.ts',
    ).skillAliases,
    [{ readonlyDeclaration: true }],
  );
  assert.deepEqual(
    metadata(
      'interface EnemyDefinition { levelHp: number[] }',
      'src/core/game-data/enemyDefinition.ts',
    ).levelHp,
    [{ readonlyDeclaration: true }],
  );
  assert.deepEqual(
    metadata('interface Other { levelHp: number[] }', 'src/core/game-data/enemyDefinition.ts')
      .levelHp,
    [{}],
  );
  assert.deepEqual(
    metadata(
      'interface CombatStepParameters { finishGlobalBuffsById: { globalBuffIds: string[] } }',
    ).globalBuffIds,
    [{ nativeId: true }],
  );
  assert.deepEqual(
    metadata(
      'type AbilityEntityDefinitionNumber = number | { blackboardKey: string }',
      'packages/game-data-contract/src/skills.ts',
    ).blackboardKey,
    [{ blackboardOrigin: 'abilityEntity' }],
  );
  assert.deepEqual(
    metadata(
      'type BuffDuration = number | { blackboardKey: string }',
      'packages/game-data-contract/src/buffs.ts',
    ).blackboardKey,
    [{ blackboardOrigin: 'globalBuff' }],
  );
  assert.deepEqual(
    metadata(
      'interface CombatStepParameters { storeSourceAttributeValue: { attribute: { key: string }; targetKey: string } }',
    ).key,
    [{}],
  );
});

test('aggregate metadata never chooses one of conflicting capabilities', () => {
  assert.deepEqual(
    mergeFieldDeclarationMetadata([{ referenceKind: 'buff' }, { referenceKind: 'skill' }]),
    {},
  );
  assert.deepEqual(mergeFieldDeclarationMetadata([{ referenceKind: 'buff' }, {}]), {});
  assert.deepEqual(
    mergeFieldDeclarationMetadata([
      { declaration: 'ActionGraphMacroCall.arguments' },
      { declaration: 'CombatStepNode.options' },
    ]),
    {},
  );
});

test('branch and container contexts inherit roles while real child properties replace them', () => {
  const file = resolve(root, 'packages/game-data-contract/src/actions.ts');
  const code = `export interface CombatStepParameters {
    applyBuff: {
      buffId: string | { blackboardKey: string };
      inheritToNextSkillIds: readonly string[];
      onActionEndBuffs: readonly { blackboardAssignments: Readonly<Record<string, number>> }[];
    };
  }`;
  const options = { target: ts.ScriptTarget.ES2023, strict: true, types: [] };
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile;
  host.getSourceFile = (name, languageVersion, ...rest) =>
    resolve(name.replaceAll('\\', '/')) === file
      ? ts.createSourceFile(name, code, languageVersion, true)
      : original(name, languageVersion, ...rest);
  // Exercise the actual overlay with both compiler-normalized and native Windows
  // separators, even on Linux; falling through must not load the real actions.ts.
  for (const spelling of [file.replaceAll('\\', '/'), file.replaceAll('/', '\\')])
    assert.equal(host.getSourceFile(spelling, options.target)?.text, code);
  const program = ts.createProgram([file], options, host);
  assert.deepEqual(ts.getPreEmitDiagnostics(program), []);
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(file)!;
  assert.equal(source.text, code, 'the compiler program must contain the in-memory fixture');
  const owner = source.statements[0]!;
  assert.ok(ts.isInterfaceDeclaration(owner));
  const rootType = checker.getTypeAtLocation(owner);
  const applyBuff = checker.getTypeOfSymbol(checker.getPropertyOfType(rootType, 'applyBuff')!);
  const extractor = createFieldSemanticExtractor(checker, root);
  const context = (name: string) => {
    const symbol = checker.getPropertyOfType(applyBuff, name)!;
    return extractor.context(checker.getTypeOfSymbol(symbol), symbol);
  };
  const buffId = context('buffId');
  assert.equal(extractor.metadata(buffId).referenceKind, 'buff');
  assert.ok(buffId.type.isUnion());
  for (const type of (buffId.type as ts.UnionType).types) {
    const branch = extractor.branch(buffId, type);
    assert.equal(extractor.metadata(branch).referenceKind, 'buff');
    const child = checker.getPropertyOfType(type, 'blackboardKey');
    if (child) {
      const value = extractor.metadata(
        extractor.property(branch, checker.getTypeOfSymbol(child), child),
      );
      assert.deepEqual(value, {});
    }
  }
  const list = context('inheritToNextSkillIds');
  const string = checker.getTypeArguments(list.type as ts.TypeReference)[0]!;
  assert.deepEqual(extractor.metadata(extractor.element(list, string)), { referenceKind: 'skill' });
  const endBuffs = context('onActionEndBuffs');
  const rowType = checker.getTypeArguments(endBuffs.type as ts.TypeReference)[0]!;
  const row = extractor.element(endBuffs, rowType);
  assert.equal(
    extractor.metadata(row).declaration,
    'CombatStepParameters.applyBuff.onActionEndBuffs',
  );
  const assignments = checker.getPropertyOfType(rowType, 'blackboardAssignments')!;
  assert.equal(
    extractor.metadata(extractor.property(row, checker.getTypeOfSymbol(assignments), assignments))
      .declaration,
    'CombatStepParameters.applyBuff.onActionEndBuffs.blackboardAssignments',
  );
});
