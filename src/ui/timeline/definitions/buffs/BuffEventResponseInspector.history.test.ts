import { createRenderer, h, ssrContextKey } from 'vue';
import { expect, it } from 'vitest';
import Page from './BuffEventResponseInspector.vue';
import { createDefinitionEditContext } from '../definitionEditContext';
it('updates the latest bound response and records exact field focus without turning empty priority into zero', () => {
  let value = { responses: [{ event: 'outputDamage', priority: 5, sequence: { steps: [] } }] };
  const paths: unknown[] = [];
  const binding = createDefinitionEditContext({
    read: () => value,
    commit: (next, path) => {
      value = next;
      paths.push(path);
    },
  }).at(['responses', 0]);
  let panel: any;
  const component = {
    ...(Page as any),
    setup(props: any, context: any) {
      panel = (Page as any).setup(props, context);
      return panel;
    },
    render: () => null,
  };
  const app = createRenderer<object, object>({
    insert() {},
    remove() {},
    patchProp() {},
    setText() {},
    setElementText() {},
    createElement: () => ({}),
    createText: () => ({}),
    createComment: () => ({}),
    parentNode: () => null,
    nextSibling: () => null,
  }).createApp({
    render: () => h(component, { kind: 'ability', response: value.responses[0], binding }),
  });
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  try {
    panel.setPriority({ target: { value: '' } });
    expect(paths).toHaveLength(0);
    panel.setPriority({ target: { value: '2.5' } });
    expect(paths).toHaveLength(0);
    panel.setPriority({ target: { value: '7' } });
    expect(value.responses[0]!.priority).toBe(7);
    expect(paths.at(-1)).toEqual(['responses', 0, 'priority']);
    panel.setAbilityEvent({ target: { value: 'takeDamage' } });
    expect(value.responses[0]!.priority).toBe(7);
    expect(value.responses[0]!.event).toBe('takeDamage');
    expect(paths.at(-1)).toEqual(['responses', 0, 'event']);
  } finally {
    app.unmount();
  }
});
