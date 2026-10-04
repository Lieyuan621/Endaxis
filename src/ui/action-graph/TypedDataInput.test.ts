import { mountSetup } from '../../test/componentSetup';
import { expect, it } from 'vitest';
import type { DataInput } from '../../core/action-graph/actionGraphDataNodes';
import TypedDataInput from './TypedDataInput.vue';

async function mount(input: DataInput, readonly = false) {
  const changes: (number | boolean | string)[] = [];
  const mounted = await mountSetup(TypedDataInput, {
    input,
    readonly,
    resetKey: {} as unknown,
    label: 'test',
    onConstant: (value: number | boolean | string) => changes.push(value),
  });
  return {
    ...mounted,
    changes,
    resetOwner: (resetKey: unknown) => mounted.update({ resetKey }),
    accept: (value: unknown) => mounted.update({ input: { ...input, source: null, value } }),
  };
}
it('keeps a connected source until explicit valid apply; empty number and cancel do not become zero', async () => {
  const panel = await mount({
    path: ['value'],
    type: 'number',
    source: 'read',
    value: { kind: 'valueNode', nodeId: 'read' },
  });
  try {
    panel.state.start();
    expect(panel.state.draft.value).toBe('');
    panel.state.apply();
    expect(panel.changes).toEqual([]);
    panel.state.draft.value = '4';
    panel.state.reset();
    expect(panel.changes).toEqual([]);
    panel.state.start();
    panel.state.draft.value = '7';
    panel.state.apply();
    expect(panel.changes).toEqual([7]);
    // A parent rejection does not change props or discard the repairable local draft.
    expect(panel.state.editing.value).toBe(true);
    expect(panel.state.draft.value).toBe('7');
    await panel.accept({ kind: 'constant', value: 7 });
    expect(panel.state.editing.value).toBe(false);
  } finally {
    panel.stop();
  }
});
it('requires explicit boolean selection and treats false as a legitimate chosen value', async () => {
  const panel = await mount({
    path: ['condition'],
    type: 'boolean',
    source: null,
    value: undefined,
  });
  try {
    panel.state.start();
    panel.state.apply();
    expect(panel.changes).toEqual([]);
    panel.state.draft.value = 'false';
    panel.state.apply();
    expect(panel.changes).toEqual([false]);
  } finally {
    panel.stop();
  }
});
it('readonly control cannot emit a mutation even when invoked programmatically', async () => {
  const panel = await mount(
    { path: ['value'], type: 'number', source: null, value: { kind: 'constant', value: 9 } },
    true,
  );
  try {
    panel.state.start();
    panel.state.draft.value = '10';
    panel.state.apply();
    expect(panel.changes).toEqual([]);
  } finally {
    panel.stop();
  }
});

it('resets an indexed draft on owning-expression replacement even when its item reference is unchanged', async () => {
  const value = { kind: 'conditionNode', nodeId: 'shared' };
  const panel = await mount({
    path: ['conditions', '0'],
    type: 'boolean',
    source: 'shared',
    value,
  });
  try {
    const owner = { kind: 'all', conditions: [value, value] };
    await panel.resetOwner(owner);
    panel.state.start();
    panel.state.draft.value = 'false';
    await panel.resetOwner(owner);
    expect(panel.state.editing.value).toBe(true);
    expect(panel.state.draft.value).toBe('false');
    await panel.resetOwner({ ...owner, conditions: [...owner.conditions] });
    expect(panel.state.editing.value).toBe(false);
    expect(panel.state.draft.value).toBe('');
    expect(panel.changes).toEqual([]);
  } finally {
    panel.stop();
  }
});

it('keeps exact string literals and a connected source until accepted; never coerces or trims', async () => {
  const panel = await mount({
    path: ['markerId'],
    type: 'string',
    source: 'read',
    value: { kind: 'stringNode', nodeId: 'read' },
  });
  try {
    panel.state.start();
    panel.state.apply();
    expect(panel.changes).toEqual([]);
    panel.state.draft.value = '  false  ';
    panel.state.apply();
    expect(panel.changes).toEqual(['  false  ']);
    expect(panel.state.editing.value).toBe(true);
    await panel.accept('  false  ');
    expect(panel.state.preview.value).toBe('  false  ');
    panel.state.start();
    expect(panel.state.draft.value).toBe('  false  ');
    panel.state.draft.value = '  ';
    panel.state.apply();
    expect(panel.changes).toEqual(['  false  ', '  ']);
    panel.state.reset();
    expect(panel.state.editing.value).toBe(false);
  } finally {
    panel.stop();
  }
});
