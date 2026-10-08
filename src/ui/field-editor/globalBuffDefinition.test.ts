import { expect, it } from 'vitest';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { validateStructuredValue } from './structuredValue';
import { globalBuffDraftContext } from '../../application/editor/globalBuffFieldContext';
import { unknownBlackboardContext } from '../../application/editor/blackboardFieldContext';

const field = actionNodeSchemas.createGlobalBuff.fields.find(
  field => field.path.at(-1) === 'definition',
)!;

it('全局效果的数据连接在效果自身变量作用域求值，修改覆盖值后重新检查', () => {
  const input = { kind: 'valueNode', nodeId: 'ratio' } as const;
  const definition = {
    stackingType: 'unlimited',
    children: [],
    blackboard: { ratio: 'unavailable' },
    sharedSpModifiers: [
      {
        attribute: 'spRecovery',
        operation: 'addition',
        applyToReturnSpGain: false,
        value: input,
      },
    ],
  };
  const graph: ActionGraphDefinition = {
    nodes: {},
    dataNodes: { ratio: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } } },
  };
  const options = (blackboardAssignments: unknown) => ({
    kind: 'createGlobalBuff',
    path: field.path,
    graph,
    blackboard: unknownBlackboardContext(),
    globalBuff: globalBuffDraftContext({
      kind: 'createGlobalBuff',
      parameters: { globalBuffId: 'fixture', definition, blackboardAssignments },
    }),
  });
  const next = { ...definition, applyIconDurationToBuffs: true };
  expect(() =>
    validateStructuredValue(
      field.valueSchema,
      definition,
      next,
      options({ ratio: { kind: 'constant', value: 2 } }),
    ),
  ).not.toThrow();
  expect(() =>
    validateStructuredValue(field.valueSchema, definition, next, options(undefined)),
  ).toThrow();
  expect(next.sharedSpModifiers[0]!.value).toBe(input);
});

it('全局效果的连接通过图编辑，表单编辑其他字段时不移除或复制连接', () => {
  const input = { kind: 'valueNode', nodeId: 'amount' } as const;
  const definition = {
    stackingType: 'unlimited',
    children: [],
    blackboard: {},
    sharedSpModifiers: [
      {
        attribute: 'spRecovery',
        operation: 'addition',
        applyToReturnSpGain: false,
        value: input,
      },
    ],
  };
  const graph: ActionGraphDefinition = {
    nodes: {},
    dataNodes: { amount: { type: 'number', expression: { kind: 'constant', value: 2 } } },
  };
  const options = { kind: 'createGlobalBuff', path: field.path, graph };
  expect(() =>
    validateStructuredValue(
      field.valueSchema,
      definition,
      { ...definition, applyIconDurationToBuffs: true },
      options,
    ),
  ).not.toThrow();
  expect(() =>
    validateStructuredValue(
      field.valueSchema,
      definition,
      { ...definition, sharedSpModifiers: [] },
      options,
    ),
  ).toThrow();
});
