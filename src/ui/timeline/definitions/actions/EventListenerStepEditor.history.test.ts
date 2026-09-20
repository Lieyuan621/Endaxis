import { createRenderer, h, nextTick, shallowRef, ssrContextKey, type ComponentOptions } from 'vue';
import { expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import Editor from './EventListenerStepEditor.vue';
import { createDefinitionEditContext } from '../definitionEditContext';
import { useDefinitionDraftHistory } from '../useDefinitionDraftHistory';
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';

it.each([true, false])('监听完整表单共用参数句柄，不创建独立历史（绑定=%s）', async bound => {
  type Listener = CombatStepForKind<'listenForCombatEvents'>;
  const initial: Listener = {
    kind: 'listenForCombatEvents',
    parameters: {
      responses: [
        { key: 'a', event: { kind: 'enemyDefeated', scope: 'operator' }, sequence: { steps: [] } },
      ],
    },
  };
  const draft = shallowRef(initial);
  let panel: any;
  let history!: ReturnType<typeof useDefinitionDraftHistory<Listener>>;
  const updates: unknown[] = [];
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
    ...(Editor as ComponentOptions),
    setup(props: any, ctx: any) {
      panel = (Editor as any).setup(props, ctx);
      return panel;
    },
    render: () => null,
  };
  const app = renderer.createApp({
    setup() {
      history = useDefinitionDraftHistory(
        () => draft.value,
        next => {
          draft.value = next;
        },
      );
      const context = createDefinitionEditContext({
        read: () => draft.value,
        commit: (next, path) => history.commit(next, { path: '', propertyPath: path }),
      });
      return () =>
        h(wrapped, {
          step: draft.value,
          skillLevel: 1,
          parametersBinding: bound ? context.root.child('parameters') : undefined,
          onUpdate: (next: Listener) => {
            updates.push(next);
            history.commit(next);
          },
        });
    },
  });
  app.provide(ssrContextKey, { modules: new Set() });
  app.use(
    createI18n({
      legacy: false,
      locale: 'en',
      messages: {},
      missingWarn: false,
      fallbackWarn: false,
    }),
  );
  app.mount({});
  try {
    panel
      .responseProperty(0)
      .child('event')
      .child('scope')
      .update(() => 'team');
    await nextTick();
    expect(draft.value.parameters.responses[0]!.event).toEqual({
      kind: 'enemyDefeated',
      scope: 'team',
    });
    expect(updates).toHaveLength(bound ? 0 : 1);
    history.restore('undo');
    await nextTick();
    expect(draft.value).toEqual(initial);
    if (bound)
      expect(history.restoredLocation!.value!.propertyPath).toEqual([
        'parameters',
        'responses',
        0,
        'event',
        'scope',
      ]);
    panel.addResponse();
    await nextTick();
    panel.addResponse();
    await nextTick();
    expect(new Set(draft.value.parameters.responses.map(response => response.key)).size).toBe(3);
    panel.removeResponse(2);
    await nextTick();
    panel.removeResponse(1);
    await nextTick();
    const last = draft.value;
    panel.removeResponse(0);
    await nextTick();
    expect(draft.value).toBe(last);
  } finally {
    app.unmount();
  }
});
