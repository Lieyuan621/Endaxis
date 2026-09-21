import { createRenderer, createSSRApp, defineComponent, h, shallowRef, ssrContextKey } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import { createI18n } from 'vue-i18n';
import { expect, it, vi } from 'vitest';
import Editor from './BuffStepEditor.vue';
import { createDefinitionEditContext } from '../definitionEditContext';

it('hides migrated modifier collections while retaining the unconverted form sections', async () => {
  const render = async (modifierCollectionsInGraph: boolean) => {
    const app = createSSRApp({
      render: () =>
        h(Editor, {
          step: {
            kind: 'applyBuff',
            parameters: {
              target: 'caster',
              buffId: 'test',
              definition: { stackingType: 'refresh' },
            },
          },
          skillLevel: 1,
          definitionOnly: true,
          inspectorOnly: true,
          modifierCollectionsInGraph,
        }),
    });
    app.use(
      createI18n({
        legacy: false,
        locale: 'zh',
        messages: {},
        missingWarn: false,
        fallbackWarn: false,
      }),
    );
    app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 });
    app.provide(ZINDEX_INJECTION_KEY, { current: 0 });
    app.component(
      'el-tooltip',
      defineComponent({
        inheritAttrs: false,
        setup(_props, { slots }) {
          return () => slots.default?.();
        },
      }),
    );
    return renderToString(app);
  };
  const graph = await render(true);
  expect(graph).not.toContain('添加伤害修正器');
  expect(graph).not.toContain('添加属性修正器');
  expect(graph).not.toContain('治疗修正');
  expect(graph).not.toContain('护盾定义');
  expect(graph).toContain('Buff 展示身份');
  expect(graph).toContain('子 Buff 展示身份');
  expect(graph).toContain('高级原生语义');
  expect(graph).toContain('启用时记录来源技能的施法身份');
  expect(graph).toContain('叠加与优先级');
  expect(graph).toContain('持续时间与触发');
  expect(graph).toContain('标签规则');
  expect(graph.indexOf('叠加与优先级')).toBeLessThan(graph.indexOf('持续时间与触发'));
  const standalone = await render(false);
  expect(standalone).toContain('添加伤害修正器');
  expect(standalone).toContain('添加属性修正器');
  expect(standalone).toContain('Buff 展示身份');
  expect(standalone).toContain('子 Buff 展示身份');
});

it('edits definition scalars from the latest root and records their precise field without forwarding', () => {
  const root = shallowRef<any>({ stackingType: 'refresh', durationSeconds: 10 });
  const commit = vi.fn((value, _focus) => {
    root.value = value;
  });
  const binding = createDefinitionEditContext({ read: () => root.value, commit }).root;
  let editor: any;
  const forward = vi.fn();
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
  const app = renderer.createApp({
    render: () =>
      h(
        {
          ...(Editor as any),
          setup(props: any, context: any) {
            editor = (Editor as any).setup(props, context);
            return editor;
          },
          render: () => null,
        },
        {
          step: {
            kind: 'applyBuff',
            parameters: {
              target: 'caster',
              definition: { stackingType: 'refresh', durationSeconds: 1 },
            },
          },
          skillLevel: 1,
          definitionBinding: binding,
          onUpdate: forward,
        },
      ),
  });
  app.use(createI18n({ legacy: false, locale: 'zh', messages: {} }));
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  try {
    root.value = { ...root.value, maxStackCount: 3 };
    editor.setDefinitionScalar('durationSeconds', 15);
    expect(root.value).toEqual({ stackingType: 'refresh', durationSeconds: 15, maxStackCount: 3 });
    expect(commit).toHaveBeenLastCalledWith(root.value, ['durationSeconds']);
    editor.setDefinitionScalar('durationSeconds', undefined);
    expect(root.value).not.toHaveProperty('durationSeconds');
    editor.setDefinitionPresentation({ iconId: 'test' });
    expect(root.value.presentation).toEqual({ iconId: 'test' });
    expect(root.value.maxStackCount).toBe(3);
    expect(commit).toHaveBeenLastCalledWith(root.value, ['presentation']);
    editor.setDefinitionPresentation({});
    expect(root.value.presentation).toEqual({});
    editor.setDefinitionPresentation(undefined);
    expect(root.value).not.toHaveProperty('presentation');
    editor.setDefinitionChildPresentations([{ buffId: 'child', presentation: {} }]);
    expect(root.value.childPresentations).toHaveLength(1);
    expect(commit).toHaveBeenLastCalledWith(root.value, ['childPresentations']);
    editor.setDefinitionChildPresentations(
      [{ buffId: 'child', presentation: { visible: false } }],
      [0, 'presentation'],
    );
    expect(commit).toHaveBeenLastCalledWith(root.value, ['childPresentations', 0, 'presentation']);
    editor.setDefinitionChildPresentations([]);
    expect(root.value.childPresentations ?? []).toHaveLength(0);
    for (const [field, value] of Object.entries({
      sustainedProtection: { target: 'owner', superArmor: 0, impactResistance: 2 },
      role: { kind: 'elementalAttachment', element: 'heat' },
      spellBurst: {
        burstType: 'Fire',
        damageType: 'heat',
        skillSettingDataKey: 'test',
        skillSettingColumn: 1,
        atkScaleBase: 0,
      },
      affixSkillCastIdentity: 'sourceSkillCast',
    })) {
      editor.setDefinitionAdvancedProperty(field, value);
      expect(root.value[field]).toEqual(value);
      expect(root.value.maxStackCount).toBe(3);
      expect(commit).toHaveBeenLastCalledWith(root.value, [field]);
      editor.setDefinitionAdvancedProperty(field, undefined);
      expect(root.value).not.toHaveProperty(field);
    }
    expect(forward).not.toHaveBeenCalled();
  } finally {
    app.unmount();
  }
});
