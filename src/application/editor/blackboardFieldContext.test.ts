import { expect, it } from 'vitest';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { analyzeGraphBlackboard } from './graphBlackboard';
import {
  blackboardContextForField,
  blackboardRequestForField,
  createBlackboardFieldContext,
  resolveBlackboardKey,
} from './blackboardFieldContext';

function fixture(): ActionGraphDefinition {
  return {
    nodes: {
      entry: { action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} }, next: null },
    },
  };
}
const numberRead = { mode: 'read', valueType: 'number' } as const;
const stringRead = { mode: 'read', valueType: 'string' } as const;

it('keeps numeric, string, external and macro parameter namespaces separate', () => {
  const analysis = analyzeGraphBlackboard(fixture(), ['entry'], ['argument'], {
    amount: [1, 2],
    buffId: 'buff',
  });
  const context = createBlackboardFieldContext(analysis, new Set(['current']));
  expect(resolveBlackboardKey(context, 'amount', numberRead).valid).toBe(true);
  expect(resolveBlackboardKey(context, 'buffId', numberRead).state).toBe('typeMismatch');
  expect(resolveBlackboardKey(context, 'buffId', stringRead).valid).toBe(true);
  expect(resolveBlackboardKey(context, 'providedLater', stringRead).state).toBe('external');
  expect(
    resolveBlackboardKey(context, 'argument', { mode: 'parameter', valueType: 'number' }).valid,
  ).toBe(true);
  expect(
    resolveBlackboardKey(context, 'argument', { mode: 'parameter', valueType: 'string' }).state,
  ).toBe('typeMismatch');
  expect(
    resolveBlackboardKey(context, 'missing', { mode: 'parameter', valueType: 'number' }).state,
  ).toBe('missingParameter');
  expect(
    resolveBlackboardKey(context, 'argument', { mode: 'write', valueType: 'number' }).state,
  ).toBe('external');
});

it('unbound data nodes and external Buff reads explicitly retain unknown owner context', () => {
  const analysis = analyzeGraphBlackboard(fixture(), ['entry'], [], { SkillOnly: 1 });
  const current = createBlackboardFieldContext(analysis, new Set(['current']));
  expect(createBlackboardFieldContext(analysis, undefined).status).toBe('unknown');
  for (const kind of [
    'readBuffBlackboard',
    'readEventBuffBlackboard',
    'buffBlackboardValueCompare',
  ]) {
    const context = blackboardContextForField(current, kind, ['parameters', 'desiredKey']);
    expect(context.status).toBe('unknown');
    expect(context.candidates).toEqual([]);
    expect(resolveBlackboardKey(context, 'SkillOnly', numberRead).state).toBe('contextUnknown');
    expect(blackboardContextForField(current, kind, ['parameters', 'outputKey'])).toBe(current);
  }
});

it('uses exact action contract slots and rejects similarly named unrelated fields', () => {
  expect(
    blackboardRequestForField('readBuffBlackboard', ['parameters', 'desiredKey'], {
      blackboardOrigin: 'contract',
    }),
  ).toEqual(numberRead);
  expect(
    blackboardRequestForField('readBuffBlackboard', ['parameters', 'outputKey'], {
      blackboardOrigin: 'contract',
    }),
  ).toEqual({
    mode: 'write',
    valueType: 'number',
  });
  expect(
    blackboardRequestForField('storeSourceAttributeValue', ['parameters', 'attribute', 'key']),
  ).toBeUndefined();
  expect(blackboardRequestForField('customAction', ['parameters', 'outputKey'])).toBeUndefined();
  expect(blackboardRequestForField('blackboard', ['key'], {})).toBeUndefined();
  expect(blackboardRequestForField('blackboard', ['key'])).toBeUndefined();
  expect(
    blackboardRequestForField('blackboard', ['key'], { blackboardOrigin: 'globalBuff' }),
  ).toBeUndefined();
  expect(
    blackboardRequestForField('blackboard', ['key'], { blackboardOrigin: 'contract' }),
  ).toEqual(numberRead);
});

it('records string operand reads and copied-source reads without fabricating dynamic Buff keys', () => {
  const graph: ActionGraphDefinition = {
    nodes: {
      apply: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: { kind: 'stringNode', nodeId: 'buffId' },
                copiedBlackboardAssignments: { targetKey: 'sourceKey' },
              },
            ],
            targets: { kind: 'fixed', target: 'caster' },
          },
        },
        next: null,
      },
    },
    dataNodes: { buffId: { type: 'string', expression: { blackboardKey: 'buffName' } } },
  };
  const analysis = analyzeGraphBlackboard(graph, ['apply']);
  expect(analysis.variables.map(variable => variable.key).sort()).toEqual([
    'buffName',
    'sourceKey',
  ]);
  expect(analysis.variables.find(variable => variable.key === 'buffName')?.readSites).toEqual([
    { id: 'buffId', owner: 'data' },
  ]);
  const context = createBlackboardFieldContext(analysis, new Set(['current']));
  expect(resolveBlackboardKey(context, 'buffName', stringRead).state).toBe('external');
});

it('write addresses can overwrite a value of another type', () => {
  const analysis = analyzeGraphBlackboard(fixture(), ['entry'], ['argument'], {
    rootOnly: 1,
    text: 'string',
  });
  const root = createBlackboardFieldContext(analysis, new Set(['current']));
  const write = { mode: 'write', valueType: 'number' } as const;
  expect(resolveBlackboardKey(root, 'text', write).valid).toBe(true);
  expect(
    resolveBlackboardKey(root, 'text', write).candidates.find(candidate => candidate.key === 'text')
      ?.selectable,
  ).toBe(true);
});

it('explicit finite numeric fallback preserves legal missing and non-numeric read semantics', () => {
  const analysis = analyzeGraphBlackboard(fixture(), ['entry'], [], { text: 'string' });
  const context = createBlackboardFieldContext(analysis, new Set(['current']));
  expect(resolveBlackboardKey(context, 'text', numberRead).valid).toBe(false);
  expect(resolveBlackboardKey(context, 'text', { ...numberRead, fallback: 0 }).state).toBe(
    'fallback',
  );
  expect(resolveBlackboardKey(context, 'local', { ...numberRead, fallback: 5 }).valid).toBe(true);
  expect(resolveBlackboardKey(context, 'text', { ...numberRead, fallback: NaN }).valid).toBe(false);
  expect(
    resolveBlackboardKey(context, 'text', { mode: 'parameter', valueType: 'number', fallback: 0 })
      .valid,
  ).toBe(false);
});

it('an existing strict numeric read with no declaration remains an externally supplied key', () => {
  const graph: ActionGraphDefinition = {
    nodes: {
      use: {
        action: {
          kind: 'dealStagger',
          parameters: { value: { kind: 'valueNode', nodeId: 'read' } },
        },
        next: null,
      },
    },
    dataNodes: { read: { type: 'number', expression: { kind: 'blackboard', key: 'runtime' } } },
  };
  const analysis = analyzeGraphBlackboard(graph, ['use']);
  const context = createBlackboardFieldContext(analysis, analysis.dataContexts.get('read'));
  expect(resolveBlackboardKey(context, 'runtime', numberRead).state).toBe('external');
  expect(resolveBlackboardKey(context, 'runtime', numberRead).valid).toBe(true);
});
