import { mountSetup } from '../../test/componentSetup';
import { expect, it } from 'vitest';
import type { CombatCondition } from '../../../packages/game-data-contract/src/conditions';
import ConditionListField from './ConditionListField.vue';

async function mount(value: readonly CombatCondition[], editable = true) {
  const changes: (readonly CombatCondition[])[] = [];
  let discards = 0;
  const mounted = await mountSetup(ConditionListField, {
    value,
    editable,
    label: 'Conditions',
    onChange: (value: readonly CombatCondition[]) => changes.push(value),
    onDiscard: () => discards++,
  });
  return {
    ...mounted,
    changes,
    get discards() {
      return discards;
    },
  };
}

it('requires a chosen boolean, stages structural edits atomically, and cancels without changing the parent', async () => {
  const source: CombatCondition = Object.freeze({ kind: 'conditionNode', nodeId: 'shared' });
  const original = Object.freeze([source]);
  const panel = await mount(original);
  try {
    panel.state.begin();
    panel.state.add();
    expect(panel.state.conditions.value).toEqual(original);
    panel.state.choice.value = 'false';
    panel.state.add();
    expect(panel.state.choice.value).toBe('');
    panel.state.move(1, -1);
    expect(panel.state.conditions.value).toEqual([{ kind: 'constant', value: false }, source]);
    expect(panel.state.conditions.value[1]).toBe(source);
    expect(panel.changes).toEqual([]);
    panel.state.discard();
    expect(panel.discards).toBe(1);
    panel.state.begin();
    expect(panel.state.conditions.value).toEqual(original);
    panel.state.remove(0);
    await panel.state.apply();
    expect(panel.changes).toEqual([[]]);
    expect(original).toEqual([source]);
  } finally {
    panel.stop();
  }
});

it('retains rejected edits, clears superseded parent proposals, and resets after acceptance', async () => {
  const panel = await mount([]);
  try {
    panel.state.begin();
    panel.state.choice.value = 'false';
    panel.state.add();
    await panel.state.apply();
    expect(panel.state.editing.value).toBe(true);
    expect(panel.state.error.value).toBe('rejected');
    expect(panel.changes).toEqual([[{ kind: 'constant', value: false }]]);
    panel.state.choice.value = 'true';
    panel.state.add();
    expect(panel.discards).toBe(1);
    expect(panel.state.error.value).toBe('');
    await panel.state.apply();
    await panel.update({ value: panel.changes[1]! });
    expect(panel.state.editing.value).toBe(false);
    expect(panel.state.conditions.value).toEqual([]);
  } finally {
    panel.stop();
  }
});

it('resets local indexes on external replacement, undo and readonly transitions', async () => {
  const source: CombatCondition = { kind: 'conditionNode', nodeId: 'shared' };
  const panel = await mount([source]);
  try {
    panel.state.begin();
    panel.state.choice.value = 'true';
    panel.state.add();
    await panel.update({ value: [source, source] });
    expect(panel.state.editing.value).toBe(false);
    panel.state.begin();
    expect(panel.state.conditions.value).toEqual([source, source]);
    await panel.update({ value: [source] });
    expect(panel.state.editing.value).toBe(false);
    panel.state.begin();
    await panel.update({ editable: false });
    panel.state.begin();
    panel.state.choice.value = 'true';
    panel.state.add();
    panel.state.remove(0);
    panel.state.move(0, 1);
    await panel.state.apply();
    expect(panel.state.editing.value).toBe(false);
    expect(panel.changes).toEqual([]);
  } finally {
    panel.stop();
  }
});

it('unchanged apply creates no transaction and cancel drops a rejected proposal', async () => {
  const panel = await mount([]);
  try {
    panel.state.begin();
    await panel.state.apply();
    expect(panel.state.editing.value).toBe(false);
    expect(panel.changes).toEqual([]);
    expect(panel.discards).toBe(0);
    panel.state.begin();
    panel.state.choice.value = 'false';
    panel.state.add();
    await panel.state.apply();
    panel.state.discard();
    expect(panel.state.error.value).toBe('');
    expect(panel.discards).toBe(1);
    panel.state.begin();
    expect(panel.state.conditions.value).toEqual([]);
  } finally {
    panel.stop();
  }
});

it('blocks repeated apply while awaiting acceptance and ignores a cancelled session response', async () => {
  const panel = await mount([]);
  try {
    panel.state.begin();
    panel.state.choice.value = 'true';
    panel.state.add();
    const first = panel.state.apply();
    const repeated = panel.state.apply();
    expect(panel.changes).toHaveLength(1);
    panel.state.discard();
    panel.state.begin();
    await Promise.all([first, repeated]);
    expect(panel.state.conditions.value).toEqual([]);
    expect(panel.state.editing.value).toBe(true);
    expect(panel.state.error.value).toBe('');
    expect(panel.changes).toHaveLength(1);
  } finally {
    panel.stop();
  }
});
