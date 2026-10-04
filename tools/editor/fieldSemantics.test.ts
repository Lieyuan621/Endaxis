import assert from 'node:assert/strict';
import test from 'node:test';
import { join, resolve, sep } from 'node:path';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { schemaSourceLocation } from './schemaSourceLocation.ts';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { resolveDefinitionSchema } from '../../src/core/editor/resolveDefinitionSchema.ts';
import { describeDefinitionType } from './describeDefinitionType.ts';
import { describeNodeFields } from './generateActionNodeSchema.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const fixturePath = resolve(root, 'tools/editor/fieldSemantics.fixture.ts');
const source = `
import type { GameplayTag as ImportedTag } from '../../packages/game-data-contract/src/gameplayTags.ts';
import type { ActionStringOperand, LevelValues } from '../../packages/game-data-contract/src/primitives.ts';
import type { ActionValueOperand, TimeScaleCurveDefinition as FormalCurve } from '../../packages/game-data-contract/src/conditions.ts';
import type { ActionGraphReference } from '../../packages/game-data-contract/src/actionGraph.ts';
type TagAlias = ImportedTag;
type TagMap<T> = Readonly<Record<string, T>>;
type Tags = readonly TagAlias[];
type Spread<T> = readonly [head: number, ...tail: T[]];
namespace Unrelated { export type GameplayTag = string; }
interface IndexedTags { readonly [key: string]: TagAlias; }
export interface Fixture {
  curveValue?: FormalCurve;
  fixed: readonly [tag: TagAlias, count: number];
  trueOnly?: true;
  tag?: TagAlias;
  tags: readonly TagAlias[];
  mapped: Readonly<Record<string, TagAlias>>;
  generic: TagMap<ImportedTag>;
  indexed: IndexedTags;
  choice: TagAlias | number;
  mixed: LevelValues | ActionValueOperand;
  tuple: readonly [tag: TagAlias, count: number, label?: ActionStringOperand];
  rest: readonly [tag: TagAlias, ...levels: number[]];
  namedRest: readonly [head: number, ...tail: TagAlias[]];
  unnamedRest: readonly [number, ...TagAlias[]];
  aliasRest: readonly [head: number, ...tail: Tags];
  genericRest: Spread<ImportedTag>;
  operand?: ActionValueOperand;
  operands: readonly ActionValueOperand[];
  textOperand: ActionStringOperand;
  levels: LevelValues;
  graph?: ActionGraphReference;
  condition?: import('../../packages/game-data-contract/src/conditions.ts').CombatCondition;
  ordinaryBuffId: string;
  misleading: Unrelated.GameplayTag;
  impossible?: never;
  unknownValue: unknown;
  callback: () => number;
  integer: bigint;
  identifier: symbol;
}
type Link<T> = { value: T; next?: Link<T>; children: readonly Link<T>[] };
export interface GenericFixture { tags: Link<ImportedTag>; numbers: Link<number>; ordinary: Link<string>; }
export type MutualA = { kind: 'a'; child?: MutualB };
export type MutualB = { kind: 'b'; child?: MutualA };
export type RecursiveList = readonly RecursiveList[];
export interface RecursiveMap { readonly [key: string]: RecursiveMap; }
export type Aggregated = { value?: ImportedTag } | { value: number } | { value?: never };
export type Equivalent = { kind: 'a'; value: { x: number } } | { kind: 'b'; value: { x: number } };
export type DifferentRequired = { kind: 'a'; value: { x: number; y?: number } } | { kind: 'b'; value: { x?: number; y: number } };
export type DifferentMeaning = { value: ImportedTag } | { value: string };
export interface ForbiddenGraph { actionGraph?: never; label: string; }
export interface Owned { actionGraph: ActionGraphReference; label: string; }
namespace Foreign { export type TimeScaleCurveDefinition = { kind: 'ordinary'; value: number }; }
export interface ForeignFixture { curve: Foreign.TimeScaleCurveDefinition; }
export interface DepthFixture { a: { b: { c: { value: ImportedTag } } } }
`;
const options: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2023,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  allowImportingTsExtensions: true,
  noEmit: true,
  skipLibCheck: true,
  types: [],
};
const host = ts.createCompilerHost(options);
const originalSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (path, version, onError, shouldCreateNewSourceFile) =>
  resolve(path) === fixturePath
    ? ts.createSourceFile(fixturePath, source, options.target!, true)
    : originalSourceFile(path, version, onError, shouldCreateNewSourceFile);
const program = ts.createProgram([fixturePath], options, host);
const checker = program.getTypeChecker();
const diagnostics = ts.getPreEmitDiagnostics(program);
assert.equal(
  diagnostics.length,
  0,
  diagnostics
    .map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    .join('\n'),
);
const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(fixturePath)!)!;
function typeOf(name: string) {
  const symbol = checker.getExportsOfModule(moduleSymbol).find(item => item.name === name)!;
  return checker.getDeclaredTypeOfSymbol(symbol);
}
const fixture = typeOf('Fixture');
const definition = describeDefinitionType(fixture, checker, undefined, root);
assert.equal(definition.kind, 'object');
if (definition.kind !== 'object') throw new Error('fixture must describe an object');
const fields = definition.fields;
const nodes = Object.fromEntries(
  describeNodeFields(fixture, checker).map(field => [field.path.at(-1), field]),
);

test('both generators retain erased, imported and indirect aliases in optional and container slots', () => {
  const tagType = checker.getTypeOfSymbol(checker.getPropertyOfType(fixture, 'tag')!);
  assert.equal(
    checker.getNonNullableType(tagType).aliasSymbol,
    undefined,
    'fixture must exercise checker-erased string aliases',
  );
  for (const name of [
    'tag',
    'tags',
    'mapped',
    'generic',
    'indexed',
    'choice',
    'mixed',
    'tuple',
    'operand',
    'operands',
    'textOperand',
    'levels',
    'graph',
    'condition',
  ]) {
    assert.deepEqual(fields[name]!.semantics, nodes[name]!.valueSchema.semantics, name);
    assert.equal(Object.hasOwn(fields[name]!, 'source'), false, name);
    assert.equal(Object.hasOwn(nodes[name]!.valueSchema, 'source'), false, name);
  }
  assert.deepEqual(fields.tag!.semantics?.aliases, ['GameplayTag']);
  assert.equal(fields.tag!.optional, true);
  assert.deepEqual(fields.tags!.semantics?.arrayElement?.aliases, ['GameplayTag']);
  for (const name of ['mapped', 'generic', 'indexed']) {
    const field = fields[name]!;
    assert.equal(field.kind, 'record');
    if (field.kind !== 'record') throw new Error(`${name} must be a record`);
    assert.deepEqual(
      field.value.semantics?.aliases,
      ['GameplayTag'],
      `${name} must retain its value alias`,
    );
    assert.deepEqual(field.semantics?.recordValue?.aliases, ['GameplayTag']);
    assert.equal(Object.hasOwn(field, 'source'), false);
    assert.equal(Object.hasOwn(field.value, 'source'), false);
  }
  for (const [name, alias] of [
    ['operand', 'ActionValueOperand'],
    ['textOperand', 'ActionStringOperand'],
    ['levels', 'LevelValues'],
    ['graph', 'ActionGraphReference'],
    ['condition', 'CombatCondition'],
  ] as const)
    assert.deepEqual(fields[name]!.semantics?.aliases, [alias], name);
  assert.equal(
    fields.operand!.semantics?.unionVariants,
    undefined,
    'formal operands stay atomic instead of duplicating the contract',
  );
  assert.equal(
    nodes.operands!.valueSchema.semantics?.aliases,
    undefined,
    'a container cannot become an operand input',
  );
  assert.deepEqual(nodes.operands!.valueSchema.semantics?.arrayElement?.aliases, [
    'ActionValueOperand',
  ]);
});

test('union alternatives retain their own identity without promoting plain strings or mixed inputs', () => {
  assert.equal(fields.choice!.kind, 'union');
  assert.equal(fields.choice!.semantics?.aliases, undefined);
  assert.deepEqual(
    fields.choice!.semantics?.unionVariants?.map(variant => variant.aliases),
    [['GameplayTag'], undefined],
  );
  assert.equal(fields.mixed!.semantics?.aliases, undefined);
  assert.deepEqual(
    fields.mixed!.semantics?.unionVariants?.map(variant => variant.aliases),
    [['LevelValues'], ['ActionValueOperand']],
  );
  if (fields.choice!.kind === 'union')
    assert.deepEqual(
      fields.choice!.variants.find(variant => variant.kind === 'string')?.semantics?.aliases,
      ['GameplayTag'],
    );
  assert.equal(fields.ordinaryBuffId!.semantics?.aliases, undefined);
  assert.equal(
    fields.misleading!.semantics?.aliases,
    undefined,
    'same-name aliases outside the formal contract are not domain evidence',
  );
  const aggregate = describeNodeFields(typeOf('Aggregated'), checker)[0]!;
  assert.equal(aggregate.valueSchema.optional, true);
  assert.equal(Object.hasOwn(aggregate.valueSchema, 'source'), false);
  assert.equal(aggregate.valueSchema.kind, 'union');
  if (aggregate.valueSchema.kind !== 'union') throw new Error('expected heterogeneous union');
  assert.ok(
    aggregate.valueSchema.variants.some(variant =>
      variant.semantics?.aliases?.includes('GameplayTag'),
    ),
  );
  assert.equal(aggregate.valueSchema.semantics?.aliases, undefined);
});

test('tuples preserve per-slot shapes while variable and optional lengths remain explicitly unsupported', () => {
  assert.equal(fields.tuple!.kind, 'opaque');
  assert.equal(fields.tuple!.fallback?.reason, 'tuple-editor-pending');
  assert.equal(nodes.tuple!.control, 'json');
  assert.equal(nodes.tuple!.valueSchema.kind, 'opaque');
  assert.equal(nodes.tuple!.valueSchema.fallback?.reason, 'tuple-editor-pending');
  assert.equal(Object.hasOwn(nodes.tuple!, 'fallback'), false);
  const tuple = fields.tuple!.semantics?.tuple!;
  assert.equal(tuple.minLength, 2);
  assert.equal(tuple.elements.length, 3);
  assert.deepEqual(
    tuple.elements.map(element => element.label),
    ['tag', 'count', 'label'],
  );
  assert.deepEqual(tuple.elements[0]!.semantics.aliases, ['GameplayTag']);
  assert.deepEqual(tuple.elements[1]!.semantics, {});
  assert.equal(tuple.elements[2]!.optional, true);
  assert.deepEqual(tuple.elements[2]!.semantics.aliases, ['ActionStringOperand']);
  assert.equal(fields.rest!.semantics?.tuple?.minLength, 1);
  assert.equal(fields.rest!.semantics?.tuple?.elements[1]!.rest, true);
  for (const name of ['namedRest', 'unnamedRest', 'aliasRest', 'genericRest']) {
    assert.deepEqual(fields[name]!.semantics, nodes[name]!.valueSchema.semantics, name);
    const tail = fields[name]!.semantics?.tuple?.elements[1]!;
    assert.equal(tail.rest, true, name);
    assert.deepEqual(tail.semantics.aliases, ['GameplayTag'], name);
  }
});

test('recursive containers use finite references, deep values stay typed, and real boundaries remain explicit', () => {
  const list = describeDefinitionType(typeOf('RecursiveList'), checker, undefined, root);
  assert.equal(list.kind, 'array');
  if (list.kind === 'array')
    assert.equal(resolveDefinitionSchema(list.element, list.references).kind, 'array');
  assert.ok(Object.keys(list.references ?? {}).length);
  assert.doesNotThrow(() => JSON.stringify(list));
  const map = describeDefinitionType(typeOf('RecursiveMap'), checker, undefined, root);
  assert.equal(map.kind, 'record');
  if (map.kind === 'record')
    assert.equal(resolveDefinitionSchema(map.value, map.references).kind, 'record');
  const depth = describeDefinitionType(typeOf('DepthFixture'), checker, undefined, root);
  if (
    depth.kind !== 'object' ||
    depth.fields.a?.kind !== 'object' ||
    depth.fields.a.fields.b?.kind !== 'object'
  )
    throw new Error('expected the supported object depth');
  assert.equal(depth.fields.a.fields.b.fields.c?.kind, 'object');
  assert.equal(fields.impossible!.fallback?.reason, 'no-present-type');
  for (const name of ['unknownValue', 'callback', 'integer', 'identifier']) {
    assert.equal(fields[name]!.kind, 'opaque', name);
    assert.equal(fields[name]!.fallback?.reason, 'unsupported-type', name);
  }
});

test('generated value schemas compose every declaration, preserving distinct semantics without diagnostic provenance', () => {
  const value = describeNodeFields(typeOf('Equivalent'), checker).find(
    field => field.path.at(-1) === 'value',
  )!;
  assert.equal(value.valueSchema?.kind, 'object');
  if (value.valueSchema?.kind !== 'object')
    throw new Error('equivalent value shape must be usable');
  assert.equal(Object.hasOwn(value.valueSchema, 'source'), false);
  assert.equal(Object.hasOwn(value.valueSchema.fields.x!, 'source'), false);
  assert.equal(
    describeNodeFields(typeOf('DifferentRequired'), checker).find(
      field => field.path.at(-1) === 'value',
    )!.valueSchema?.kind,
    'union',
    'different nested required slots cannot be weakened into one object',
  );
  const distinct = describeNodeFields(typeOf('DifferentMeaning'), checker)[0]!.valueSchema;
  assert.equal(
    distinct?.kind,
    'union',
    'plain strings must not acquire a tag role from another declaration',
  );
  const aggregate = describeNodeFields(typeOf('Aggregated'), checker)[0]!.valueSchema!;
  assert.equal(aggregate.optional, true);
  assert.equal(Object.hasOwn(aggregate, 'source'), false);
  assert.equal(aggregate.kind, 'union');
});
test('field-root resources remain boundaries and fixed tuple/literal declarations keep exact values', () => {
  const owned = describeDefinitionType(typeOf('Owned'), checker, undefined, root);
  assert.equal(owned.fallback?.reason, 'owned-resource-boundary');
  const forbidden = describeDefinitionType(typeOf('ForbiddenGraph'), checker, undefined, root, {
    definitionRoot: true,
  });
  assert.equal(forbidden.kind, 'object');
  if (forbidden.kind !== 'object') throw new Error('expected asset root');
  assert.equal(forbidden.fields.actionGraph?.fallback?.reason, 'no-present-type');
  assert.equal(forbidden.fields.actionGraph?.optional, true);
  assert.equal(
    describeDefinitionType(typeOf('Owned'), checker, undefined, root, { definitionRoot: true })
      .kind,
    'object',
  );
  const fixed = fields.fixed!;
  assert.equal(fixed.kind, 'tuple');
  if (fixed.kind !== 'tuple') throw new Error('fixed tuple');
  assert.deepEqual(
    fixed.elements.map(element => element.kind),
    ['string', 'number'],
  );
  assert.equal(fixed.minLength, 2);
  assert.equal(fields.trueOnly?.kind, 'enum');
  if (fields.trueOnly?.kind === 'enum') assert.deepEqual(fields.trueOnly.options, [true]);
  assert.equal(
    describeNodeFields(typeOf('ForeignFixture'), checker)[0]!.valueSchema?.kind,
    'object',
  );
});

test('only the genuine formal curve declaration receives the shared curve editor', () => {
  assert.equal(fields.curveValue?.kind, 'timeScaleCurve');
  assert.ok(fields.curveValue?.semantics?.aliases?.includes('TimeScaleCurveDefinition'));
  assert.equal(nodes.curveValue?.valueSchema?.kind, 'timeScaleCurve');
  assert.equal(fields.curveValue?.optional, true);
  const foreign = describeDefinitionType(typeOf('ForeignFixture'), checker, undefined, root);
  assert.equal(foreign.kind, 'object');
  if (foreign.kind !== 'object') throw new Error('expected object');
  assert.equal(foreign.fields.curve?.kind, 'object');
  assert.ok(!foreign.fields.curve?.semantics?.aliases?.includes('TimeScaleCurveDefinition'));
});

test('recursive generics preserve source aliases and instantiated checker identity', () => {
  const result = describeDefinitionType(typeOf('GenericFixture'), checker, undefined, root);
  assert.equal(result.kind, 'object');
  if (result.kind !== 'object') throw new Error('expected object');
  for (const [name, kind, alias] of [
    ['tags', 'string', 'GameplayTag'],
    ['numbers', 'number', undefined],
    ['ordinary', 'string', undefined],
  ] as const) {
    const child = resolveDefinitionSchema(result.fields[name]!, result.references);
    assert.equal(child.kind, 'object');
    if (child.kind !== 'object') throw new Error('expected generic object');
    assert.equal(child.fields.value?.kind, kind);
    assert.deepEqual(child.fields.value?.semantics?.aliases, alias ? [alias] : undefined);
  }
  const mutual = describeDefinitionType(typeOf('MutualA'), checker, undefined, root);
  assert.ok(Object.keys(mutual.references ?? {}).length);
  assert.deepEqual(
    describeDefinitionType(typeOf('GenericFixture'), checker, undefined, root),
    result,
  );
  assert.equal(JSON.stringify(mutual).includes('recursive-type'), false);
});

test('recursive identities and genuine aliases survive checkout paths, symlinks and CRLF', () => {
  const directory = mkdtempSync(join(tmpdir(), 'schema-paths-'));
  const linkedRoot = join(directory, 'repo');
  symlinkSync(root, linkedRoot, 'junction');
  const fixture = `import type { GameplayTag } from '../../packages/game-data-contract/src/gameplayTags.ts';
import type { TimeScaleCurveDefinition } from '../../packages/game-data-contract/src/conditions.ts';
type Link<T> = { value: T; next?: Link<T>; children: readonly Link<T>[] };
export interface Portable { tags: Link<GameplayTag>; ordinary: Link<string>; curve?: TimeScaleCurveDefinition; next?: Portable; }
`;
  function generate(sourceRoot: string, text: string) {
    const path = resolve(sourceRoot, 'tools/editor/portable.fixture.ts');
    const fixtureHost = ts.createCompilerHost(options);
    const read = fixtureHost.getSourceFile.bind(fixtureHost);
    fixtureHost.getSourceFile = (name, version, onError, fresh) =>
      resolve(name) === path
        ? ts.createSourceFile(path, text, options.target!, true)
        : read(name, version, onError, fresh);
    const fixtureProgram = ts.createProgram([path], options, fixtureHost);
    const fixtureChecker = fixtureProgram.getTypeChecker();
    const module = fixtureChecker.getSymbolAtLocation(fixtureProgram.getSourceFile(path)!)!;
    const symbol = fixtureChecker
      .getExportsOfModule(module)
      .find(value => value.name === 'Portable')!;
    assert.equal(
      schemaSourceLocation(sourceRoot).filePath(ts.getDefaultLibFilePath(options)),
      'node_modules/typescript/lib/lib.es2023.full.d.ts',
    );
    return describeDefinitionType(
      fixtureChecker.getDeclaredTypeOfSymbol(symbol),
      fixtureChecker,
      undefined,
      sourceRoot,
    );
  }
  try {
    const invocation = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        resolve(linkedRoot, 'tools/editor/generateActionNodeSchema.ts'),
        '--invalid',
      ],
      { encoding: 'utf8' },
    );
    assert.equal(invocation.status, 1, 'symlink entry must execute argument validation');
    assert.match(invocation.stderr, /Usage: generateActionNodeSchema/);
    const expected = generate(resolve(root), fixture);
    assert.ok(Object.keys(expected.references ?? {}).length, 'fixture must exercise recursive IDs');
    for (const sourceRoot of [root + sep, linkedRoot]) {
      for (const newline of ['\n', '\r\n']) {
        assert.deepEqual(generate(sourceRoot, fixture.replaceAll('\n', newline)), expected);
      }
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
