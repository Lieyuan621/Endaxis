import { describe, expect, it } from 'vitest';
import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import {
  createMappingRows,
  mappingFromRows,
  mappingValidationError,
  resolveBlackboardMapping,
  validMappingValue,
  validMappingDraft,
} from './blackboardMapping';

const field = (kind: keyof typeof actionNodeSchemas, name: string) =>
  actionNodeSchemas[kind].fields.find(field => field.path.join('.') === `parameters.${name}`)!;

describe('blackboard mapping declaration metadata', () => {
  it.each([
    ['withActionBlackboardScope', 'initialValues', 'levels', 'childAction'],
    ['withActionBlackboardScope', 'entityInitialValues', 'levels', 'childEntity'],
    ['withActionBlackboardScope', 'entityAssignments', 'operand', 'childEntity'],
    ['applyBuff', 'blackboardAssignments', 'levelsOrOperand', 'buff'],
    ['applyBuff', 'copiedBlackboardAssignments', 'copy', 'buff'],
    ['applyBuff', 'stringBlackboardAssignments', 'string', 'buff'],
    ['spawnAbilityEntity', 'blackboardAssignments', 'operand', 'abilityEntity'],
    ['spawnAbilityEntity', 'stringBlackboardAssignments', 'string', 'abilityEntity'],
    ['createGlobalBuff', 'blackboardAssignments', 'operand', 'globalBuff'],
  ] as const)(
    'identifies %s.%s without confusing source and destination',
    (kind, name, value, destination) => {
      expect(resolveBlackboardMapping(field(kind, name))).toEqual({ value, destination });
    },
  );

  it('rejects coincidental names, nested leaves and different declarations', () => {
    const original = field('applyBuff', 'copiedBlackboardAssignments');
    expect(
      resolveBlackboardMapping({
        ...original,
        valueSchema: { ...original.valueSchema, declaration: undefined },
      }),
    ).toBeUndefined();
    expect(
      resolveBlackboardMapping({
        ...original,
        valueSchema: {
          ...original.valueSchema,
          declaration: 'CombatStepParameters.applyBuff.stringBlackboardAssignments',
        },
      }),
    ).toBeUndefined();
    expect(
      resolveBlackboardMapping({ ...original, path: ['nested', ...original.path] }),
    ).toBeUndefined();
    expect(
      resolveBlackboardMapping({
        ...original,
        valueSchema: { kind: 'string', declaration: original.valueSchema.declaration },
      }),
    ).toBeUndefined();
    expect(
      resolveBlackboardMapping(
        {
          kind: 'string',
          declaration: original.valueSchema.declaration,
          semantics: original.valueSchema.semantics,
        },
        'copiedBlackboardAssignments',
      ),
    ).toBeUndefined();
  });

  it('supports a definition record retaining the exact formal declaration', () => {
    const original = field('applyBuff', 'copiedBlackboardAssignments');
    expect(
      resolveBlackboardMapping(
        {
          kind: 'record',
          value: { kind: 'string' },
          declaration: original.valueSchema.declaration,
          semantics: original.valueSchema.semantics,
        },
        'copiedBlackboardAssignments',
      ),
    ).toEqual({ value: 'copy', destination: 'buff' });
  });
});

describe('blackboard mapping transaction helpers', () => {
  it('distinguishes literal strings, source-key copies, levels and action operands', () => {
    expect(validMappingValue('', 'string')).toBe(true);
    expect(validMappingValue('', 'copy')).toBe(false);
    expect(validMappingValue([1, 2], 'levels')).toBe(true);
    expect(validMappingValue({ kind: 'constant', value: 2 }, 'levels')).toBe(false);
    expect(validMappingValue(2, 'operand')).toBe(false);
    expect(validMappingValue({ kind: 'constant', value: 2 }, 'operand')).toBe(true);
    expect(validMappingValue({ kind: 'constant', value: NaN }, 'operand')).toBe(false);
    expect(validMappingValue({ kind: 'valueNode', nodeId: 'number' }, 'levelsOrOperand')).toBe(
      true,
    );
  });

  it('preserves invalid imported siblings while allowing explicit repair', () => {
    const original = { old: { unexpected: 1 }, good: 3 };
    const rows = createMappingRows(original);
    rows[1]!.value = [4, 5];
    expect(mappingValidationError(rows, original, 'levels')).toBeUndefined();
    expect(mappingFromRows(rows)).toEqual({ old: { unexpected: 1 }, good: [4, 5] });
    rows[0]!.value = { kind: 'constant', value: 1 };
    expect(mappingValidationError(rows, original, 'levels')).toBe('invalidValue');
    rows[0]!.value = 9;
    expect(mappingValidationError(rows, original, 'levels')).toBeUndefined();
    expect(original).toEqual({ old: { unexpected: 1 }, good: 3 });
  });

  it('rejects empty, duplicate, and unsafe new keys without mutating originals', () => {
    const original = { old: 2 };
    const rows = createMappingRows(original);
    rows.push({ key: '', value: 0 });
    expect(mappingValidationError(rows, original, 'levels')).toBe('emptyKey');
    rows[1]!.key = 'old';
    expect(mappingValidationError(rows, original, 'levels')).toBe('duplicateKey');
    rows[1]!.key = '__proto__';
    expect(mappingValidationError(rows, original, 'levels')).toBe('unsafeKey');
    const imported = JSON.parse('{"__proto__": 2}');
    const retained = mappingFromRows(createMappingRows(imported));
    expect(Object.hasOwn(retained, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(retained)).toBe(Object.prototype);
  });
});

it('宏实参通过常量或数据节点传入', () => {
  const args = actionNodeSchemas.callMacro.fields.find(
    field => field.path.join('.') === 'arguments',
  )!;
  const descriptor = resolveBlackboardMapping(args)!;
  expect(descriptor).toEqual({
    value: 'operand',
    destination: 'macroArguments',
  });
  const context = { status: 'known' as const, scopes: [], candidates: [], parameters: [] };
  expect(
    validMappingDraft(
      { p: { kind: 'valueNode', nodeId: 'parameter-read' } },
      {},
      descriptor,
      context,
    ),
  ).toBe(true);
  expect(validMappingDraft({ p: { kind: 'constant', value: 2 } }, {}, descriptor, context)).toBe(
    true,
  );
});
