import { computed, createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { expect, it } from 'vitest';
import Page from './AbilityEntityDefinitionsDialog.vue';
import type { DefinitionDraftHistory } from '../useDefinitionDraftHistory';
import type { OperatorAbilityEntityDefinitions } from '../../../../core/game-data/operatorDefinition';
const definitions: OperatorAbilityEntityDefinitions = {
  example: { lifetime: { kind: 'infinite' } },
};
async function render(shared: boolean) {
  const history: DefinitionDraftHistory<OperatorAbilityEntityDefinitions> = {
    commit() {},
    restore() {
      return false;
    },
    canUndo: computed(() => false),
    canRedo: computed(() => false),
  };
  const app = createSSRApp({
    render: () =>
      h(Page, {
        visible: true,
        paged: true,
        baseDefinitions: {},
        customDefinitions: definitions,
        sharedHistory: shared ? history : undefined,
        skillLevel: 1,
      }),
  });
  app.use(
    createI18n({
      legacy: false,
      locale: 'zh-CN',
      messages: {
        'zh-CN': {
          timeline: {
            skillEditing: {
              abilityEntityCustom: '自定义',
              abilityEntityOperatorGroup: '干员能力实体',
            },
          },
        },
      },
    }),
  );
  return renderToString(app);
}
it('does not infer provenance from a full owner draft or preselect an unopened directory item', async () => {
  const html = await render(true);
  expect(html).toContain('干员能力实体');
  expect(html).toContain('example');
  expect(html).not.toContain('entity-workspace__badge');
  expect(html).not.toContain('entity-workspace__item active');
  expect(html).not.toContain('entity-create-form');
});
it('keeps explicit custom badges in the standalone override editor', async () => {
  const html = await render(false);
  expect(html).toContain('entity-workspace__badge');
  expect(html).toContain('自定义');
});
