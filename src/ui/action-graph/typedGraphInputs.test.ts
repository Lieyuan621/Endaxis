import { expect, it } from 'vitest';
import { actionTypedInputs, dataTypedInputs } from './typedGraphInputs';
import { listDataInputs } from '../../core/action-graph/actionGraphDataNodes';
import { composeDefinitionSchemas } from '../../../tools/editor/describeDefinitionType';

it('projects optional and mixed numeric operands from their schema without inventing a value', () => {
  const action = { kind: 'dealStagger' as const, parameters: { value: [1, 2] } };
  expect(actionTypedInputs(action)).toEqual([
    { path: ['parameters', 'value'], type: 'number', source: null, value: [1, 2] },
    { path: ['parameters', 'valueMultiplier'], type: 'number', source: null, value: undefined },
  ]);
  expect(action).toEqual({ kind: 'dealStagger', parameters: { value: [1, 2] } });
});
it('selects an aggregate operand branch without granting a pin to its ordinary sibling', () => {
  const valueSchema = composeDefinitionSchemas([
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['constant'] },
        value: { kind: 'number' },
      },
      semantics: { aliases: ['ActionValueOperand'] },
    },
    { kind: 'string' },
  ]);
  const fields = [{ path: ['value'], valueSchema }];
  expect(listDataInputs({ value: 'plain' }, fields)).toEqual([]);
  const expression = { kind: 'constant', value: 3 };
  expect(listDataInputs({ value: expression }, fields)).toEqual([
    { path: ['value'], type: 'number', source: null, value: expression },
  ]);
});
it('projects boolean conditions and existing record values but never ordinary string pins or phantom keys', () => {
  expect(
    actionTypedInputs({
      kind: 'conditional',
      parameters: { condition: { kind: 'constant', value: false } },
      whenTrue: { $sequence: null },
      whenFalse: { $sequence: null },
    }),
  ).toEqual([
    {
      path: ['parameters', 'condition'],
      type: 'boolean',
      source: null,
      value: { kind: 'constant', value: false },
    },
  ]);
  const inputs = actionTypedInputs({
    kind: 'applyBuff',
    parameters: {
      target: 'caster',
      buffId: { kind: 'stringNode', nodeId: 'buff' },
      blackboardAssignments: { power: [2, 3] },
      stringBlackboardAssignments: { name: 'label' },
    },
  });
  expect(inputs.map(input => input.path.join('.'))).toEqual([
    'parameters.buffId',
    'parameters.count',
    'parameters.blackboardAssignments.power',
  ]);
  expect(inputs.map(input => input.type)).toEqual(['string', 'number', 'number']);
});
it('keeps one input for a declared condition, rather than exposing its implementation twice', () => {
  const inputs = actionTypedInputs({
    kind: 'conditional',
    parameters: { condition: { kind: 'conditionNode', nodeId: 'comparison' } },
    whenTrue: { $sequence: null },
    whenFalse: { $sequence: null },
  });
  expect(inputs).toHaveLength(1);
  expect(inputs[0]?.type).toBe('boolean');
  expect(
    dataTypedInputs({
      type: 'boolean',
      expression: {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 1 },
        operator: 'equal',
        right: { kind: 'valueNode', nodeId: 'read' },
      },
    }).map(input => [input.path, input.type, input.source]),
  ).toEqual([
    [['left'], 'number', null],
    [['right'], 'number', 'read'],
  ]);
});
it('explicit non-connectable declarations suppress expression-shaped lookalikes', () => {
  const lookalike = { kind: 'constant', value: true };
  expect(
    listDataInputs(
      {
        number: lookalike,
        string: lookalike,
        build: lookalike,
        copies: { destination: lookalike },
        strings: { destination: lookalike },
      },
      [
        { path: ['number'], semantics: {} },
        { path: ['string'], semantics: { aliases: ['ActionStringOperand'] } },
        { path: ['build'], semantics: { aliases: ['BuildCondition'] } },
        { path: ['copies'], semantics: { recordValue: {} } },
        { path: ['strings'], semantics: { recordValue: {} } },
      ],
    ),
  ).toEqual([{ path: ['string'], type: 'string', source: null, value: lookalike }]);
});
it('uses structural container objects and preserves operands only at explicit depth boundaries', () => {
  const expression = { kind: 'constant', value: 3 };
  const result = listDataInputs(
    {
      items: [{ value: expression }],
      record: { key: expression },
      shallow: { value: expression },
      deep: { value: expression },
    },
    [
      {
        path: ['items'],
        valueSchema: {
          kind: 'array',
          element: {
            kind: 'object',
            fields: { value: { kind: 'opaque', semantics: { aliases: ['ActionValueOperand'] } } },
          },
        },
      },
      { path: ['record'], semantics: { recordValue: { aliases: ['ActionValueOperand'] } } },
      { path: ['deep'], fallback: { reason: 'depth-limit' } },
    ],
  );
  expect(result.map(input => input.path.join('.')).sort()).toEqual([
    'deep.value',
    'items.0.value',
    'record.key',
    'shallow.value',
  ]);
});

it('projects reordered condition-list items at their new indexed paths without duplicating nested inputs', () => {
  const shared = { kind: 'conditionNode' as const, nodeId: 'shared' };
  const inline = { kind: 'constant' as const, value: false };
  const conditions = [shared, inline, shared];
  for (const kind of ['all', 'any'] as const) {
    expect(dataTypedInputs({ type: 'boolean', expression: { kind, conditions: [] } })).toEqual([]);
    const inputs = dataTypedInputs({
      type: 'boolean',
      expression: { kind, conditions: [inline, shared, shared] },
    });
    expect(inputs.map(input => [input.path, input.type, input.source])).toEqual([
      [['conditions', '0'], 'boolean', null],
      [['conditions', '1'], 'boolean', 'shared'],
      [['conditions', '2'], 'boolean', 'shared'],
    ]);
    expect(inputs[0]?.value).toBe(inline);
    expect(conditions).toEqual([shared, inline, shared]);
  }
});

it('uses full value schemas for nested object operands and keeps non-pin declarations closed', () => {
  const expression = { kind: 'valueNode' as const, nodeId: 'shared' };
  const inputs = actionTypedInputs({
    kind: 'dealDamage',
    parameters: {
      attackScale: 1,
      tags: [],
      damageType: 'physical',
      instantAttributeModifiers: [
        {
          targetSide: 'attacker',
          attribute: 'Attack',
          slot: 'addition',
          attributeTiming: 'runtime',
          value: expression,
        },
      ],
    },
  } as Parameters<typeof actionTypedInputs>[0]);
  expect(
    inputs.some(
      input =>
        input.path.join('.') === 'parameters.instantAttributeModifiers.0.value' &&
        input.source === 'shared',
    ),
  ).toBe(true);
  expect(
    listDataInputs({ value: { kind: 'constant', value: 3 } }, [
      {
        path: ['value'],
        valueSchema: {
          kind: 'object',
          fields: { kind: { kind: 'string' }, value: { kind: 'number' } },
        },
      },
    ]),
  ).toEqual([]);
  expect(
    listDataInputs({ value: undefined }, [
      {
        path: ['value'],
        valueSchema: {
          kind: 'condition',
          optional: true,
          semantics: { aliases: ['CombatCondition'] },
        },
      },
    ]),
  ).toEqual([{ path: ['value'], type: 'boolean', source: null, value: undefined }]);
});

it('projects only formal string operand slots, including string references and marker conditions', () => {
  const linked = { kind: 'stringNode' as const, nodeId: 'read' };
  expect(
    actionTypedInputs({
      kind: 'castSkillDuringAction',
      parameters: {
        skillId: linked,
        target: 'caster',
        skipApplyCost: false,
        inheritSourceSkillCastInfo: false,
      },
    }).filter(input => input.type === 'string'),
  ).toEqual([{ path: ['parameters', 'skillId'], type: 'string', source: 'read', value: linked }]);
  expect(
    dataTypedInputs({
      type: 'boolean',
      expression: { kind: 'abilityEntityTimedMarkerPresent', markerId: linked },
    }),
  ).toContainEqual({ path: ['markerId'], type: 'string', source: 'read', value: linked });
  expect(dataTypedInputs({ type: 'string', expression: { blackboardKey: 'id' } })).toEqual([
    { path: [], type: 'string', source: null, value: { blackboardKey: 'id' } },
  ]);
  expect(dataTypedInputs({ type: 'string', expression: 'exact literal' })).toEqual([
    { path: [], type: 'string', source: null, value: 'exact literal' },
  ]);
  expect(dataTypedInputs({ type: 'string', expression: linked })).toEqual([
    { path: [], type: 'string', source: 'read', value: linked },
  ]);
  expect(
    listDataInputs({
      name: 'name',
      key: 'destination',
      id: 'resource',
      board: { blackboardKey: 'key' },
    }),
  ).toEqual([]);
});
