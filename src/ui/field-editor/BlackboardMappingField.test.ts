import { mountSetup } from '../../test/componentSetup';
import { computed, createSSRApp, h, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import { describe, expect, it } from 'vitest';
import { i18n } from '../../i18n';
import type { BlackboardFieldContext } from '../../application/editor/blackboardFieldContext';
import { unknownBlackboardContext } from '../../application/editor/blackboardFieldContext';
import { blackboardFieldContextKey } from './blackboardFieldContext';
import BlackboardMappingField from './BlackboardMappingField.vue';

async function mount(
  component: unknown,
  initial: Record<string, unknown>,
  initialContext = unknownBlackboardContext(),
) {
  const context = shallowRef<BlackboardFieldContext>(initialContext);
  const mounted = await mountSetup(component, initial, app => {
    app.provide(
      blackboardFieldContextKey,
      computed(() => context.value),
    );
  });
  return {
    ...mounted,
    context,
  };
}
const known: BlackboardFieldContext = {
  status: 'known',
  scopes: [{ id: 'current', label: 'Current action' }],
  candidates: [
    {
      key: 'number',
      valueType: 'number',
      readable: true,
      writable: true,
      scope: 'current',
      source: 'current',
    },
    {
      key: 'string',
      valueType: 'string',
      readable: true,
      writable: true,
      scope: 'current',
      source: 'current',
    },
    {
      key: 'other',
      valueType: 'number',
      readable: false,
      writable: false,
      scope: 'other',
      source: 'other',
    },
  ],
  parameters: [],
};

function props(value: unknown, changes: unknown[], valueMode = 'levelsOrOperand') {
  return {
    value,
    descriptor: { value: valueMode, destination: 'buff' },
    editable: true,
    label: 'Mappings',
    onChange: (next: unknown) => changes.push(next),
  };
}

describe('atomic mapping editing', () => {
  it('keeps add, rename, value edit and deletion local until one Apply; Cancel emits nothing', async () => {
    const original = { keep: [1, 2], delete: 3 };
    const changes: unknown[] = [];
    const f = await mount(BlackboardMappingField, props(original, changes));
    try {
      f.state.begin();
      f.state.remove(1);
      f.state.rows.value[0].key = 'renamed';
      f.state.rows.value[0].value = [4, 5];
      f.state.add();
      f.state.rows.value[1].key = 'new';
      expect(changes).toEqual([]);
      f.state.cancel();
      expect(changes).toEqual([]);
      expect(original).toEqual({ keep: [1, 2], delete: 3 });
      f.state.begin();
      f.state.remove(1);
      f.state.rows.value[0].value = [7, 8];
      const applying = f.state.apply();
      f.state.apply();
      await f.update({ value: { keep: [7, 8] } });
      await applying;
      expect(changes).toEqual([{ keep: [7, 8] }]);
      expect(f.state.editing.value).toBe(false);
    } finally {
      f.stop();
    }
  });

  it('keeps invalid drafts for repair and preserves invalid imported siblings', async () => {
    const changes: unknown[] = [];
    const f = await mount(BlackboardMappingField, props({ old: null, good: 1 }, changes, 'levels'));
    try {
      f.state.begin();
      f.state.add();
      await f.state.apply();
      expect(f.state.error.value).toBe('emptyKey');
      expect(f.state.editing.value).toBe(true);
      expect(changes).toEqual([]);
      f.state.rows.value[2].key = 'added';
      f.state.rows.value[2].value = 0;
      await f.state.apply();
      expect(changes).toEqual([{ old: null, good: 1, added: 0 }]);
      expect(f.state.editing.value).toBe(true);
      expect(f.state.error.value).toBe('applyRejected');
      expect(f.state.rows.value[2]).toEqual({ key: 'added', value: 0 });
    } finally {
      f.stop();
    }
  });

  it('copies either numeric or string keys, but never a literal disguised as a source', async () => {
    const changes: unknown[] = [];
    const f = await mount(BlackboardMappingField, props({}, changes, 'copy'), known);
    try {
      f.state.begin();
      f.state.add();
      f.state.rows.value[0] = { key: 'target', value: 'string' };
      await f.state.apply();
      expect(changes).toEqual([{ target: 'string' }]);
    } finally {
      f.stop();
    }
  });

  it('preserves existing connections, explicit fallback zero and strict absence', async () => {
    const changes: unknown[] = [];
    const original = {
      connected: { kind: 'valueNode', nodeId: 'data_1' },
      strict: { kind: 'blackboard', key: 'number' },
      fallback: { kind: 'blackboard', key: 'number', fallback: 0 },
    };
    const f = await mount(BlackboardMappingField, props(original, changes), known);
    try {
      f.state.begin();
      f.state.add();
      f.state.rows.value[3].key = 'new';
      f.state.rows.value[3].value = 0;
      await f.state.apply();
      expect(changes).toEqual([{ ...original, new: 0 }]);
      expect(Object.hasOwn((changes[0] as typeof original).strict, 'fallback')).toBe(false);
    } finally {
      f.stop();
    }
  });

  it('blocks stale drafts and read-only mutation', async () => {
    const changes: unknown[] = [];
    const f = await mount(BlackboardMappingField, props({ old: 1 }, changes));
    try {
      f.state.begin();
      f.state.rows.value[0].value = 2;
      await f.update({ value: { old: 3 } });
      await f.state.apply();
      expect(changes).toEqual([]);
      expect(f.state.error.value).toBe('staleDraft');
      expect(f.state.rows.value[0].value).toBe(2);
      await f.update({ editable: false });
      f.state.begin();
      f.state.add();
      await f.state.apply();
      expect(f.state.editing.value).toBe(false);
      expect(changes).toEqual([]);
    } finally {
      f.stop();
    }
  });
});

it('renders contract-specific direction and unknown destination without JSON editing', async () => {
  for (const mode of ['copy', 'string', 'levelsOrOperand']) {
    const app = createSSRApp({
      render: () =>
        h(BlackboardMappingField, {
          value: { target: 'source' },
          descriptor: { value: mode as 'copy', destination: 'buff' },
          editable: false,
          label: 'Mapping',
        }),
    });
    app
      .use(i18n)
      .provide(ID_INJECTION_KEY, { prefix: 100, current: 0 })
      .provide(ZINDEX_INJECTION_KEY, { current: 0 });
    const html = await renderToString(app);
    expect(html).toContain(`data-blackboard-mapping="${mode}"`);
    expect(html).toContain('target');
    expect(html).toContain('source');
    expect(html).toContain('目标上下文未知');
    expect(html).not.toContain('textarea');
    expect(html).not.toContain('编辑映射');
  }
});

it('unsets optional mappings distinctly from an empty record and can cancel', async () => {
  const changes: unknown[] = [];
  const f = await mount(BlackboardMappingField, { ...props({ old: 1 }, changes), required: false });
  try {
    f.state.begin();
    f.state.requestUnset();
    expect(changes).toEqual([]);
    f.state.cancel();
    expect(changes).toEqual([]);
    f.state.begin();
    f.state.requestUnset();
    const applying = f.state.apply();
    await f.update({ value: undefined });
    await applying;
    expect(changes).toEqual([undefined]);
    expect(f.state.editing.value).toBe(false);
  } finally {
    f.stop();
  }
});
