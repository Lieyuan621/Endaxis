import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { renderSharedSchemaValues } from './renderSharedSchemaValues.ts';
import { COMBAT_STEP_KINDS } from '../../packages/game-data-contract/src/actions.ts';
import type { ActionGraphStep } from '../../packages/game-data-contract/src/actionGraph.ts';
import type { NodeSchema } from '../../src/ui/action-graph/nodeSchema.ts';
import {
  actionNodeSchemas,
  dataNodeSchemas,
} from '../../src/ui/action-graph/actionNodeSchemas.generated.ts';
import { describeNodeFields, generateActionNodeSchemas } from './generateActionNodeSchema.ts';

const schemas = generateActionNodeSchemas();

function field(kind: ActionGraphStep['kind'], ...path: string[]) {
  const result = schemas[kind].fields.find(item => item.path.join('.') === path.join('.'));
  assert.ok(result, `Missing ${kind}.${path.join('.')}`);
  return result;
}

test('covers every contract action and graph-only call without using data instances', () => {
  assert.deepEqual(
    Object.keys(schemas).sort(),
    [...COMBAT_STEP_KINDS, 'callMacro', 'callResource'].sort(),
  );
  assert.deepEqual(schemas, actionNodeSchemas);
  for (const [kind, schema] of Object.entries(schemas)) {
    assert.deepEqual(Object.keys(schema), ['fields']);
    const paths = schema.fields.map(item => item.path.join('.'));
    assert.equal(new Set(paths).size, paths.length, `${kind} repeats a field`);
    assert.ok(paths.every(path => path !== 'kind' && path !== 'nodeBindings'));
    for (const field of schema.fields)
      for (const duplicate of ['label', 'required', 'type'])
        assert.equal(Object.hasOwn(field, duplicate), false, `${kind} copies ${duplicate}`);
  }
});

test('keeps contract optionality in the value schema, enum values and documentation', () => {
  const calculation = field('dealDamage', 'parameters', 'calculation');
  assert.equal(calculation.valueSchema.optional, true);
  assert.equal(calculation.control, 'select');
  assert.deepEqual(calculation.options, ['standard', 'breakingAttack', 'attribute']);
  assert.ok(calculation.description.includes('可省略'));
  assert.equal(
    Boolean(field('dealDamage', 'parameters', 'damageType').valueSchema.optional),
    false,
  );
  assert.equal(Boolean(field('once', 'parameters', 'scopeKey').valueSchema.optional), true);
});

test('retains fields found in only some alternatives of a parameter union', () => {
  assert.equal(Boolean(field('heal', 'parameters', 'target').valueSchema.optional), false);
  assert.equal(Boolean(field('heal', 'parameters', 'contextKey').valueSchema.optional), true);
  assert.equal(Boolean(field('heal', 'parameters', 'amount').valueSchema.optional), true);
  assert.equal(Boolean(field('heal', 'parameters', 'multiplier').valueSchema.optional), true);
  assert.equal(Boolean(field('heal', 'parameters', 'addition').valueSchema.optional), true);
});

test('uses graph references as sequence controls and leaves independent resources opaque', () => {
  assert.equal(field('conditional', 'whenTrue').control, 'sequence');
  assert.equal(Boolean(field('conditional', 'whenTrue').valueSchema.optional), false);
  assert.equal(field('conditional', 'whenFalse').control, 'sequence');
  assert.equal(Boolean(field('conditional', 'whenFalse').valueSchema.optional), true);
  assert.equal(field('callResource', 'resource').control, 'resource');
  assert.equal(
    field('startCurrentAbilityEntityChildSkill', 'parameters', 'childSkill').control,
    'resource',
  );
  assert.equal(field('launchProjectile', 'callbacks').control, 'resource');
  assert.ok(
    Object.values(schemas).every(schema => schema.fields.every(item => item.path.length <= 2)),
  );
});

test('distinguishes operand, primitive and complex data without guessing values', () => {
  assert.equal(field('createSpatialPointTargets', 'parameters', 'count').control, 'operand');
  assert.equal(field('dealDamage', 'parameters', 'takeAttackSnapshot').control, 'boolean');
  assert.equal(field('dealDamage', 'parameters', 'attackScale').control, 'levelValues');
  assert.equal(field('dealDamage', 'parameters', 'tags').control, 'multiselect');
  assert.equal(field('callMacro', 'macroId').control, 'string');
  assert.ok(!schemas.callMacro.fields.some(item => item.path.at(-1) === 'key'));
  assert.ok(!schemas.callResource.fields.some(item => item.path.at(-1) === 'key'));
});

test('derives the string data family from the actual contract operand without a second expression shape', () => {
  const generated: Record<string, NodeSchema> = {};
  generateActionNodeSchemas(generated);
  assert.deepEqual(generated, dataNodeSchemas);
  for (const schema of Object.values(generated)) assert.deepEqual(Object.keys(schema), ['fields']);
  const expression = generated['string:stringOperand']!.fields[0]!;
  assert.deepEqual(expression.path, ['expression']);
  assert.ok(expression.valueSchema.semantics?.aliases?.includes('ActionStringOperand'));
  assert.ok(expression.valueSchema);
  assert.equal(generated['string:blackboardString'], undefined);
});

test('shared values preserve complete catalogs, field order and distinct source/scope metadata', () => {
  const options = ['first', 'second', 'third', 'fourth'];
  const semantics = {
    type: options.map(value => JSON.stringify(value)).join(' | '),
    optional: true,
  };
  const description = 'A repeated explanation that stays present at every field and node.';
  const field = (index: number) => ({
    kind: 'enum',
    options,
    semantics,
    source: [`packages/game-data-contract/src/actions.ts:${index + 1}:3`],
    description,
    optional: index % 2 === 0,
    inlineCondition: index % 2 === 0 ? 'equipment' : 'skillSwitch',
    references: { child: { kind: 'string', source: [`owner:${index}`] } },
  });
  const values = [
    Array.from({ length: 12 }, (_, index) => field(index)),
    { valueSchema: field(0), description },
  ];
  const rendered = renderSharedSchemaValues(values);
  const source = `${rendered.declarations}\nJSON.stringify([${rendered.expressions.join(',')}]);`;
  const expanded = runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText,
  );
  assert.equal(
    expanded,
    JSON.stringify(values),
    'sharing must preserve every value and property order',
  );
  assert.ok(
    source.length < JSON.stringify(values).length * 0.8,
    'repeated metadata must reduce output',
  );
  assert.deepEqual(renderSharedSchemaValues(values), rendered, 'generation must be deterministic');
  const unique = { kind: 'number', source: ['one declaration'], optional: false };
  assert.equal(
    renderSharedSchemaValues([unique]).declarations,
    '',
    'single-use values stay inline',
  );
});

test('recognizes role labels and controls by formal declarations, including erased aliases', () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const fixturePath = resolve(root, 'tools/editor/nodeFieldHints.fixture.ts');
  const source = `
    import type { OperatorRole as FormalRole, LevelValues as FormalLevels } from '../../packages/game-data-contract/src/primitives.ts';
    import type { ActionValueOperand as FormalOperand } from '../../packages/game-data-contract/src/conditions.ts';
    import type { ActionGraphReference as FormalSequence } from '../../packages/game-data-contract/src/actionGraph.ts';
    type Role = FormalRole;
    type List<T> = ReadonlyArray<T>;
    namespace Foreign {
      export type OperatorRole = 'caster' | 'guard';
      export type LevelValues = number | readonly number[];
      export type ActionValueOperand = { kind: 'constant'; value: number };
      export interface ActionGraphReference { $sequence: string | null; }
    }
    export interface Fixture {
      role: Role;
      roles?: readonly Role[];
      generic: List<Role>;
      imported: import('../../packages/game-data-contract/src/primitives.ts').OperatorRole;
      ordinary: 'caster' | 'guard';
      misleading: Foreign.OperatorRole;
      misleadingList: readonly Foreign.OperatorRole[];
      conflicting: FormalRole | 'other';
      levels: FormalLevels;
      mixedLevels: FormalLevels | FormalOperand;
      operand: FormalOperand;
      sequence: FormalSequence;
      fakeLevels: Foreign.LevelValues;
      fakeOperand: Foreign.ActionValueOperand;
      fakeSequence: Foreign.ActionGraphReference;
      requiredUndefined: number | undefined;
      optionalValue?: number;
      nested: { value?: number };
    }
    export type RequiredUndefinedUnion = { value: number | undefined } | { value: string | undefined };
    export type OptionalUnion = { value?: number } | { value: string };
    export type MissingUnion = { value: number } | { other: string };
    export type Aggregated = { roles: readonly Role[] } | { roles: readonly Foreign.OperatorRole[] };
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
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (path, ...args) =>
    resolve(path) === fixturePath
      ? ts.createSourceFile(fixturePath, source, options.target!, true)
      : original(path, ...args);
  const program = ts.createProgram([fixturePath], options, host);
  assert.deepEqual(
    ts
      .getPreEmitDiagnostics(program)
      .map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
    [],
  );
  const checker = program.getTypeChecker();
  const module = checker.getSymbolAtLocation(program.getSourceFile(fixturePath)!)!;
  const fields = (name: string) => {
    const symbol = checker.getExportsOfModule(module).find(value => value.name === name)!;
    return Object.fromEntries(
      describeNodeFields(checker.getDeclaredTypeOfSymbol(symbol), checker).map(field => [
        field.path.at(-1),
        field,
      ]),
    );
  };
  const fixture = fields('Fixture');
  assert.equal(fixture.role!.optionLabels, 'operatorRole');
  assert.equal(fixture.roles!.optionLabels, 'operatorRole');
  assert.equal(fixture.generic!.optionLabels, 'operatorRole');
  assert.equal(fixture.imported!.optionLabels, 'operatorRole');
  assert.equal(fixture.roles!.valueSchema.optional, true);
  assert.equal(fixture.ordinary!.optionLabels, undefined);
  assert.equal(fixture.misleading!.optionLabels, undefined);
  assert.equal(fixture.misleadingList!.optionLabels, undefined);
  assert.equal(fixture.conflicting!.optionLabels, undefined);
  assert.equal(fields('Aggregated').roles!.optionLabels, undefined);
  assert.equal(fixture.levels!.control, 'levelValues');
  assert.equal(fixture.mixedLevels!.control, 'levelValues');
  assert.equal(fixture.operand!.control, 'operand');
  assert.equal(fixture.sequence!.control, 'sequence');
  assert.equal(fixture.fakeLevels!.control, 'json');
  assert.equal(fixture.fakeOperand!.control, 'json');
  assert.equal(fixture.fakeSequence!.control, 'json');
  assert.equal(fixture.requiredUndefined!.valueSchema.optional, undefined);
  assert.equal(fixture.optionalValue!.valueSchema.optional, true);
  assert.equal(fields('RequiredUndefinedUnion').value!.valueSchema.optional, undefined);
  assert.equal(fields('OptionalUnion').value!.valueSchema.optional, true);
  assert.equal(fields('MissingUnion').value!.valueSchema.optional, true);
  const nested = fixture.nested!.valueSchema;
  assert.equal(nested.kind, 'object');
  if (nested.kind === 'object') assert.equal(nested.fields.value!.optional, true);
});
