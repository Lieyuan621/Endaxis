import { createSSRApp, h, nextTick, type ComponentOptions } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import BranchStepEditor from './BranchStepEditor.vue';

// 执行真实组件 setup，隔离模板；验证路径路由，不冒充浏览器焦点验收。
async function mountBranch(step: any, restoredPropertyPath?: readonly (string | number)[]) {
  let editor: any;
  const updates: any[][] = [];
  const component = {
    ...(BranchStepEditor as ComponentOptions),
    setup(props: any, context: any) {
      editor = (BranchStepEditor as any).setup(props, context);
      return editor;
    },
    ssrRender: () => {},
  };
  const app = createSSRApp({
    render: () =>
      h(component, {
        step,
        skillLevel: 1,
        restoredPropertyPath,
        onUpdate: (...args: any[]) => updates.push(args),
      }),
  });
  app.use(createI18n({ legacy: false, locale: 'en', messages: {} }));
  await renderToString(app);
  await nextTick();
  return { editor, updates };
}

describe('递归分支的宿主属性路径', () => {
  const leaf = { kind: 'storeCurrentTimelineFrame', parameters: { outputKey: 'old' } };
  it.each(['conditional', 'once', 'repeatEachTick'] as const)(
    '%s 恢复子步骤并将叶子路径原样交回宿主',
    async kind => {
      const branch = kind === 'conditional' ? 'whenFalse' : 'body';
      const step =
        kind === 'conditional'
          ? {
              kind,
              parameters: { condition: { kind: 'combatActive' } },
              whenTrue: { steps: [] },
              whenFalse: { steps: [leaf, leaf] },
            }
          : { kind, parameters: {}, body: { steps: [leaf, leaf] } };
      const path = [branch, 'steps', 1, 'parameters', 'outputKey'];
      const { editor, updates } = await mountBranch(step, path);
      expect(editor.selectedBranch.value).toBe(branch);
      expect(editor.selectedIndex.value).toBe(1);
      expect(editor.restoredChildPath.value).toEqual(['parameters', 'outputKey']);
      expect(updates).toEqual([]);
      const changed = { ...leaf, parameters: { outputKey: 'new' } };
      editor.replaceStep(changed, ['parameters', 'outputKey']);
      expect(updates).toHaveLength(1);
      expect(updates[0]![1]).toEqual(path);
      expect(updates[0]![0][branch].steps).toEqual([leaf, changed]);
      expect(leaf.parameters.outputKey).toBe('old');
      editor.selectChild(branch, 0);
      expect(editor.restoredChildPath.value).toBeUndefined();
      expect(updates).toHaveLength(1);
    },
  );

  it('嵌套分支逐层加前缀，不丢失条件路径或含点字典键', async () => {
    const inner = {
      kind: 'conditional',
      parameters: { condition: { kind: 'combatActive' } },
      whenTrue: { steps: [] },
    };
    const outer = { kind: 'once', parameters: { scopeKey: 's' }, body: { steps: [inner] } };
    const a = await mountBranch(inner);
    const b = await mountBranch(outer);
    a.editor.setCondition({ kind: 'combatActive' }, ['query', 'a.b']);
    b.editor.replaceStep(...a.updates[0]!);
    expect(b.updates[0]![1]).toEqual([
      'body',
      'steps',
      0,
      'parameters',
      'condition',
      'query',
      'a.b',
    ]);
  });

  it('不存在的子步骤不选中、不写入草稿', async () => {
    const { editor, updates } = await mountBranch(
      { kind: 'once', parameters: { scopeKey: 's' }, body: { steps: [] } },
      ['body', 'steps', 9, 'parameters', 'outputKey'],
    );
    expect(editor.restoredChildPath.value).toBeUndefined();
    editor.replaceStep(leaf, ['parameters', 'outputKey']);
    expect(updates).toEqual([]);
  });
});
