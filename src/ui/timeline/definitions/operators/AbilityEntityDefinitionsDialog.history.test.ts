import { createRenderer, h, nextTick, shallowRef, ssrContextKey, type ComponentOptions } from 'vue';
import { createI18n } from 'vue-i18n';
import { expect, it, vi } from 'vitest';
import Panel from './AbilityEntityDefinitionsDialog.vue';
import { useDefinitionDraftHistory } from '../useDefinitionDraftHistory';
import type { OperatorAbilityEntityDefinitions } from '../../../../core/game-data/operatorDefinition';
import { perlica } from '../../../../data/operators/perlica.generated';

it('edits the owner draft directly and restores entity edits without a secondary save', async () => {
  vi.stubGlobal('document', { addEventListener() {}, removeEventListener() {} });
  const definitions = shallowRef<OperatorAbilityEntityDefinitions>({
    first: { lifetime: { kind: 'limited', durationSeconds: 10 } },
    second: { lifetime: { kind: 'infinite' } },
  });
  let panel: any;
  let history: ReturnType<typeof useDefinitionDraftHistory<OperatorAbilityEntityDefinitions>>;
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
    ...(Panel as ComponentOptions),
    setup(props: any, context: any) {
      panel = (Panel as any).setup(props, context);
      return panel;
    },
    render: () => null,
  };
  const save = vi.fn();
  const app = renderer.createApp({
    setup() {
      history = useDefinitionDraftHistory(
        () => definitions.value,
        value => {
          definitions.value = value;
        },
      );
      const shared = {
        ...history,
        commit: (value: OperatorAbilityEntityDefinitions, location: any) =>
          history.commit(value, { ...location, section: 'entities' }),
      };
      return () =>
        h(wrapped, {
          visible: true,
          paged: true,
          baseDefinitions: {},
          customDefinitions: definitions.value,
          skillLevel: 1,
          sharedHistory: shared,
          operatorDefinition: {
            ...perlica,
            skillGroups: [
              {
                key: 'test',
                skillType: 'battleSkill',
                levelSource: 'battleSkill',
                skills: {
                  key: 'spawn',
                  timelineBlockFrames: 1,
                  scheduledSequences: [
                    {
                      startFrame: 0,
                      sequence: {
                        steps: [
                          {
                            kind: 'spawnAbilityEntity',
                            parameters: { abilityEntityId: 'new-entity', dieWhenSourceDies: false },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
          onSave: save,
        });
    },
  });
  app.use(createI18n({ legacy: false, locale: 'zh', messages: {} }));
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  try {
    expect(panel.detailOpen.value).toBe(false);
    panel.beginCreate();
    expect(panel.creating.value).toBe(true);
    expect(history!.canUndo.value).toBe(false);
    panel.newId.value = 'first';
    expect(panel.canAdd.value).toBe(false);
    expect(panel.createError.value).toContain('已被');
    panel.addDefinition();
    expect(definitions.value.first!.lifetime).toEqual({ kind: 'limited', durationSeconds: 10 });
    panel.cancelCreate();
    expect(panel.creating.value).toBe(false);
    expect(history!.canUndo.value).toBe(false);
    panel.openDefinition('first');
    expect(panel.detailOpen.value).toBe(true);
    expect(history!.canUndo.value).toBe(false);
    panel.selectedDefinitionHistory.commit({ lifetime: { kind: 'limited', durationSeconds: 25 } });
    await nextTick();
    expect(definitions.value.first!.lifetime).toEqual({ kind: 'limited', durationSeconds: 25 });
    panel.selectedId.value = 'second';
    history!.restore('undo');
    await nextTick();
    expect(definitions.value.first!.lifetime).toEqual({ kind: 'limited', durationSeconds: 10 });
    expect(panel.selectedId.value).toBe('first');
    history!.restore('redo');
    await nextTick();
    expect(definitions.value.first!.lifetime).toEqual({ kind: 'limited', durationSeconds: 25 });
    panel.newId.value = 'new-entity';
    panel.addDefinition();
    await nextTick();
    expect(panel.creating.value).toBe(false);
    expect(definitions.value['new-entity']).toBeDefined();
    history!.restore('undo');
    await nextTick();
    expect(definitions.value['new-entity']).toBeUndefined();
    expect(panel.detailOpen.value).toBe(false);
    history!.restore('redo');
    await nextTick();
    expect(panel.selectedId.value).toBe('new-entity');
    expect(panel.detailOpen.value).toBe(true);
    expect(panel.selectedReferences.value.length).toBeGreaterThan(0);
    panel.removeOrResetDefinition();
    await nextTick();
    expect(definitions.value['new-entity']).toBeUndefined();
    history!.restore('undo');
    await nextTick();
    expect(panel.selectedId.value).toBe('new-entity');
    expect(save).not.toHaveBeenCalled();
  } finally {
    app.unmount();
    vi.unstubAllGlobals();
  }
});
