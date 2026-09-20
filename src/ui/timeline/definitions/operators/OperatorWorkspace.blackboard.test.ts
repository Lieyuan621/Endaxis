import { createSSRApp, h, type ComponentOptions } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { expect, it } from 'vitest';
import Workspace from './OperatorDefinitionWorkspaceDialog.vue';
import { perlica } from '../../../../data/operators/perlica.generated';

it('keeps literal value types explicit and preserves unrelated blackboard entries', async () => {
  let panel: any;
  const definition = { ...perlica, entityBlackboard: { numeric: 3, text: '03' } };
  const app = createSSRApp({
    render: () =>
      h(
        {
          ...(Workspace as ComponentOptions),
          setup(props: any, context: any) {
            panel = (Workspace as any).setup(props, context);
            return panel;
          },
          ssrRender: () => {},
        },
        { visible: true, baseDefinition: definition, customDefinition: definition, skillLevel: 1 },
      ),
  });
  app.use(createI18n({ legacy: false, locale: 'zh-CN', messages: {} }));
  await renderToString(app);
  const input = (value: string) => ({ target: { value } });
  panel.updateEntityBlackboardEntry('numeric', input(''));
  panel.updateEntityBlackboardEntry('numeric', input('invalid'));
  panel.updateEntityBlackboardEntry('missing', input('1'));
  expect(panel.draft.value.entityBlackboard).toEqual({ numeric: 3, text: '03' });
  panel.updateEntityBlackboardEntry('numeric', input('2.5'));
  panel.updateEntityBlackboardEntry('text', input('007'));
  expect(panel.history.undoLocation.value.propertyPath).toEqual(['entityBlackboard', 'text']);
  expect(panel.draft.value.entityBlackboard).toEqual({ numeric: 2.5, text: '007' });
  panel.toggleEntityBlackboardEntryType('numeric');
  expect(panel.history.undoLocation.value.propertyPath).toEqual([
    'entityBlackboard',
    'numeric',
    'type',
  ]);
  expect(panel.draft.value.entityBlackboard.numeric).toBe('2.5');
  const duplicateInput = input('text');
  panel.renameEntityBlackboardEntry('numeric', duplicateInput);
  expect(duplicateInput.target.value).toBe('numeric');
  expect(panel.blackboardRenameError.value.message).toContain('已存在');
  expect(panel.draft.value.entityBlackboard.numeric).toBe('2.5');
  panel.renameEntityBlackboardEntry('numeric', input(''));
  expect(panel.blackboardRenameError.value).toBeUndefined();
  expect(panel.draft.value.entityBlackboard['']).toBe('2.5');
  panel.history.restore('undo');
  expect(panel.draft.value.entityBlackboard.numeric).toBe('2.5');
  panel.renameEntityBlackboardEntry('numeric', input('constructor'));
  expect(Object.hasOwn(panel.draft.value.entityBlackboard, 'constructor')).toBe(true);
  panel.removeEntityBlackboardEntry('constructor');
  expect(panel.draft.value.entityBlackboard).toEqual({ text: '007' });
  expect(definition.entityBlackboard).toEqual({ numeric: 3, text: '03' });
});
