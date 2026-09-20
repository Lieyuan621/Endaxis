import {
  createRenderer,
  h,
  nextTick,
  reactive,
  ref,
  ssrContextKey,
  type ComponentOptions,
} from 'vue';
import { expect, it } from 'vitest';
import Upgrade from './operators/OperatorUpgradeBehaviorDialog.vue';
import Runtime from './operators/OperatorRuntimeBehaviorDialog.vue';
import Combo from './operators/OperatorComboDefinitionsDialog.vue';

const cases = [
  {
    name: 'upgrade',
    component: Upgrade,
    props: {
      upgrade: { levels: 2, initializationSequence: { steps: [] } },
      skillGroupKeys: [],
    },
    draft: (p: any) => p.draft.value,
    edit: (p: any) => (p.draft.value.key = 'edited'),
  },
  {
    name: 'runtime',
    component: Runtime,
    props: { passiveSkills: [{ key: 'qa', enableSequence: { steps: [] } }], eventHandlers: [] },
    draft: (p: any) => p.passives.value,
    edit: (p: any) => (p.passives.value[0].key = 'edited'),
  },
  {
    name: 'combo',
    component: Combo,
    props: {
      conditions: [
        { key: 'qa', skillKey: 'combo', event: 'outputDamage', sequence: { steps: [] } },
      ],
      skillKeys: ['combo'],
    },
    draft: (p: any) => p.conditions.value,
    edit: (p: any) => (p.conditions.value[0].key = 'edited'),
  },
];

it.each(cases)(
  '$name opens and saves proxy-backed definitions without aliasing or clone errors',
  async ({ name, component, props, draft, edit }) => {
    const input = reactive(props);
    const original = JSON.stringify(input);
    const visible = ref(true);
    const saved: unknown[] = [];
    let panel: any;
    const renderer = createRenderer<object, object>({
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
    });
    const wrapped = {
      ...(component as ComponentOptions),
      setup(props: any, ctx: any) {
        panel = (component as any).setup(props, ctx);
        return panel;
      },
      render: () => null,
    };
    const app = renderer.createApp({
      render: () =>
        h(wrapped, {
          ...input,
          visible: visible.value,
          skillLevel: 12,
          level: 1,
          onSave: (value: unknown) => saved.push(value),
          'onUpdate:visible': (value: boolean) => (visible.value = value),
        }),
    });
    app.provide(ssrContextKey, { modules: new Set() });
    app.mount({});
    try {
      if (name === 'upgrade') {
        expect(panel.upgradeLevels.value).toBe(2);
        expect(panel.editingLevel.value).toBe(1);
        panel.upgradeLevel.value = 2;
        expect(panel.editingLevel.value).toBe(2);
      }
      const initialDraft = JSON.stringify(draft(panel));
      edit(panel);
      await nextTick();
      expect(JSON.stringify(draft(panel))).not.toBe(initialDraft);
      expect(JSON.stringify(input)).toBe(original);
      panel.save();
      await nextTick();
      expect(saved).toHaveLength(1);
      expect(() => structuredClone(saved[0])).not.toThrow();
      const snapshot = JSON.stringify(saved[0]);
      visible.value = false;
      await nextTick();
      visible.value = true;
      await nextTick();
      expect(JSON.stringify(draft(panel))).toBe(initialDraft);
      expect(JSON.stringify(saved[0])).toBe(snapshot);
    } finally {
      app.unmount();
    }
  },
);
