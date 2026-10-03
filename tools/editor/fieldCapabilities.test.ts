import {
  actionNodeSchemas,
  dataNodeSchemas,
} from '../../src/ui/action-graph/actionNodeSchemas.generated.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkFieldCapabilityCoverage,
  collectFieldCapabilities,
  type FieldCapabilityException,
} from './fieldCapabilities.ts';

test('checks each reachable branch, including absent inputs, without guessing from sample values', () => {
  const rows = collectFieldCapabilities(
    {
      fixture: {
        kind: 'object',
        fields: {
          text: { kind: 'string', source: ['fixture.ts:1:1'] },
          optional: {
            kind: 'union',
            optional: true,
            source: ['fixture.ts:2:1'],
            variants: [{ kind: 'string' }, { kind: 'opaque', fallback: { reason: 'depth-limit' } }],
          },
        },
      },
    },
    {},
    {
      'number:test': {
        description: '',
        fields: [
          {
            path: ['value'],
            label: 'value',
            description: '',
            type: 'ActionValueOperand',
            required: false,
            control: 'operand',
            source: ['fixture.ts:3:1'],
          },
        ],
      },
    },
  );
  const exceptions: FieldCapabilityException[] = [
    {
      reason: 'depth-limit',
      phase: 'P4',
      category: 'deep structure',
      keys: ['definition/fixture/optional/<1>'],
    },
  ];
  assert.deepEqual(checkFieldCapabilityCoverage(rows, exceptions), []);
  assert.equal(
    rows.find(row => row.key === 'definition/fixture/text')?.fallback,
    undefined,
    'ordinary text is not a missing component',
  );
  const changed = rows.map(row =>
    row.key.endsWith('<1>') ? { ...row, key: 'definition/fixture/new/<1>' } : row,
  );
  assert.equal(changed.length, rows.length);
  const failures = checkFieldCapabilityCoverage(changed, exceptions);
  assert.ok(failures.some(message => message.includes('unreviewed fallback')));
  assert.ok(failures.some(message => message.includes('removed schema position')));
  assert.ok(
    checkFieldCapabilityCoverage(
      rows.map(row => (row.key.endsWith('<1>') ? { ...row, fallback: 'recursive-type' } : row)),
      exceptions,
    ).some(message => message.includes('stale fallback')),
  );

  assert.ok(
    checkFieldCapabilityCoverage(rows, [...exceptions, exceptions[0]!]).some(message =>
      message.includes('duplicate exception'),
    ),
  );
});

test('never grants string inputs numeric pins, and refuses opaque fields without a reason', () => {
  const rows = collectFieldCapabilities(
    {},
    {
      fixture: {
        description: '',
        fields: [
          {
            path: ['marker'],
            label: 'marker',
            description: '',
            type: 'ActionStringOperand',
            required: true,
            control: 'json',
            source: ['fixture.ts:2:1'],
            semantics: { type: 'ActionStringOperand', aliases: ['ActionStringOperand'] },
            fallback: { reason: 'structured-editor-pending' },
          },
        ],
      },
    },
    {},
  );
  assert.equal(rows.find(row => row.surface === 'action')?.connection, 'string-context');
  assert.throws(
    () =>
      collectFieldCapabilities({ fixture: { kind: 'opaque', source: ['fixture.ts:1:1'] } }, {}, {}),
    /unexplained schema fallback/,
  );
  assert.equal(rows.find(row => row.surface === 'action')?.control, 'stringOperand');
  assert.equal(rows.find(row => row.surface === 'action')?.fallback, undefined);
});

test('reports existing definition identity protection without treating a nested skill reference as an identity', () => {
  const rows = collectFieldCapabilities(
    {
      fixture: {
        kind: 'object',
        fields: {
          skillId: { kind: 'string', source: ['fixture.ts:1:1'] },
          reference: {
            kind: 'object',
            source: ['fixture.ts:2:1'],
            fields: {
              skillId: { kind: 'string' },
              key: { kind: 'string' },
            },
          },
        },
      },
    },
    {},
    {},
  );
  assert.equal(rows.find(row => row.key === 'definition/fixture/skillId')?.edit, 'none');
  assert.equal(
    rows.find(row => row.key === 'definition/fixture/reference/key')?.restriction,
    'identity-readonly',
  );
  assert.equal(rows.find(row => row.key === 'definition/fixture/reference/skillId')?.edit, 'field');
});

test('exposes mixed level-value and operand inputs while leaving structured operand containers pending', () => {
  const rows = collectFieldCapabilities(
    {},
    {
      fixture: {
        description: '',
        fields: [
          {
            path: ['amount'],
            label: 'amount',
            description: '',
            type: 'LevelValues | ActionValueOperand',
            required: false,
            control: 'levelValues',
            source: ['fixture.ts:1:1'],
            semantics: {
              type: 'LevelValues | ActionValueOperand',
              unionVariants: [
                { type: 'LevelValues', aliases: ['LevelValues'] },
                { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
              ],
            },
          },
          {
            path: ['operands'],
            label: 'operands',
            description: '',
            type: 'readonly ActionValueOperand[]',
            required: true,
            control: 'json',
            source: ['fixture.ts:2:1'],
            fallback: { reason: 'structured-editor-pending' },
            semantics: {
              type: 'readonly ActionValueOperand[]',
              arrayElement: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
            },
          },
        ],
      },
    },
    {},
  );
  assert.equal(rows[0]?.control, 'typedInput');
  assert.equal(rows[0]?.connection, 'number-context');
  assert.equal(rows.find(row => row.path === 'operands')?.connection, 'none');
  assert.equal(rows[0]?.fallback, undefined);
  assert.ok(
    checkFieldCapabilityCoverage(rows, []).some(message => message.includes('unreviewed fallback')),
  );
});

test('condition arrays have typed structural editors but do not turn their containers into pins', () => {
  const rows = collectFieldCapabilities({}, {}, dataNodeSchemas);
  for (const kind of ['all', 'any']) {
    const row = rows.find(row => row.key === `data/boolean:${kind}/conditions`)!;
    assert.equal(row.control, 'conditionList');
    assert.equal(row.view, 'structure');
    assert.equal(row.edit, 'field');
    assert.equal(row.connection, 'none');
    assert.equal(row.fallback, undefined);
  }
});

test('typed string collections close only homogeneous formal tag/reference gaps without granting container pins', () => {
  const source = ['packages/game-data-contract/src/actions.ts:1:1'];
  const base = {
    path: ['parameters', 'buffIds'],
    label: '',
    description: '',
    required: false,
    type: 'readonly string[]',
    control: 'json' as const,
    source,
    fallback: { reason: 'structured-editor-pending' as const },
  };
  const [row] = collectFieldCapabilities(
    {},
    {
      fixture: {
        description: '',
        fields: [
          { ...base, semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } } },
        ],
      },
    },
    {},
  );
  assert.equal(row?.control, 'stringCollection');
  assert.equal(row?.fallback, undefined);
  assert.equal(row?.connection, 'none');
  const [plain] = collectFieldCapabilities(
    {},
    {
      fixture: {
        description: '',
        fields: [
          {
            ...base,
            source: ['custom/actions.ts:1:1'],
            semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
          },
        ],
      },
    },
    {},
  );
  assert.equal(plain?.fallback, 'structured-editor-pending');
});

test('the formal curve closes one historical action position without opening opaque fields or string pins', () => {
  const rows = collectFieldCapabilities({}, actionNodeSchemas, {});
  const curve = rows.find(row => row.key === 'action/startTimeDilation/parameters/curve')!;
  assert.equal(curve.control, 'timeScaleCurve');
  assert.equal(curve.view, 'structure');
  assert.equal(curve.edit, 'field');
  assert.equal(curve.connection, 'none');
  assert.equal(curve.fallback, undefined);
  const nativeIds = rows.find(
    row => row.key === 'action/finishGlobalBuffsById/parameters/globalBuffIds',
  )!;
  assert.equal(nativeIds.control, 'stringCollection');
  assert.equal(nativeIds.fallback, undefined);
  assert.equal(nativeIds.connection, 'none');
});

test('definition curves report structural view and field editing consistently with the shared dispatcher', () => {
  const rows = collectFieldCapabilities(
    {
      fixture: {
        kind: 'object',
        fields: { curve: { kind: 'timeScaleCurve', source: ['fixture.ts:1:1'] } },
      },
    },
    {},
    {},
  );
  const row = rows.find(row => row.key === 'definition/fixture/curve')!;
  assert.equal(row.view, 'structure');
  assert.equal(row.edit, 'field');
  assert.equal(row.connection, 'none');
});
