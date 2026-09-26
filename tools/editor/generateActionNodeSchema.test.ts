import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { COMBAT_STEP_KINDS } from '../../packages/game-data-contract/src/actions.ts';
import type { ActionGraphStep } from '../../packages/game-data-contract/src/actionGraph.ts';
import { actionNodeSchemas } from '../../src/ui/action-graph/actionNodeSchemas.generated.ts';
import {
  generatedSchemaPath,
  generateActionNodeSchemas,
  renderActionNodeSchemas,
} from './generateActionNodeSchema.ts';

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
  for (const schema of Object.values(schemas)) {
    const paths = schema.fields.map(item => item.path.join('.'));
    assert.equal(new Set(paths).size, paths.length, `${schema.kind} repeats a field`);
    assert.ok(paths.every(path => path !== 'kind' && path !== 'nodeBindings'));
  }
});

test('keeps optional contract fields, enum values, original type text and documentation', () => {
  const calculation = field('dealDamage', 'parameters', 'calculation');
  assert.equal(calculation.required, false);
  assert.equal(calculation.type, 'DamageCalculation');
  assert.equal(calculation.control, 'select');
  assert.deepEqual(calculation.options, ['standard', 'breakingAttack', 'attribute']);
  assert.ok(calculation.description.includes('可省略'));
  assert.ok(schemas.dealDamage.description.includes('伤害'));
  assert.equal(field('dealDamage', 'parameters', 'damageType').required, true);
  assert.equal(field('once', 'parameters', 'scopeKey').required, false);
});

test('retains fields found in only some alternatives of a parameter union', () => {
  assert.equal(field('heal', 'parameters', 'target').required, true);
  assert.equal(field('heal', 'parameters', 'contextKey').required, false);
  assert.equal(field('heal', 'parameters', 'amount').required, false);
  assert.equal(field('heal', 'parameters', 'multiplier').required, false);
  assert.equal(field('heal', 'parameters', 'addition').required, false);
});

test('uses graph references as sequence controls and leaves independent resources opaque', () => {
  assert.equal(field('conditional', 'whenTrue').control, 'sequence');
  assert.equal(field('conditional', 'whenTrue').required, true);
  assert.equal(field('conditional', 'whenFalse').control, 'sequence');
  assert.equal(field('conditional', 'whenFalse').required, false);
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
  assert.ok(!schemas.callMacro.fields.some(item => item.label === 'key'));
  assert.ok(!schemas.callResource.fields.some(item => item.label === 'key'));
});

test('checked-in output matches the deterministic Prettier-formatted generator output', async () => {
  assert.equal(await readFile(generatedSchemaPath, 'utf8'), await renderActionNodeSchemas());
});
