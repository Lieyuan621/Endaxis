import { describe, expect, it } from 'vitest';
import { createSSRApp, defineComponent, h, provide, shallowRef } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createI18n } from 'vue-i18n';
import {
  createDefinitionEditContext,
  guardDefinitionProperty,
  editPropertyValue,
} from './definitionEditContext';
import { useDefinitionDraftHistory } from './useDefinitionDraftHistory';
import { extendInspectorEditors, inspectorEditorRegistryKey } from './inspector/inspectorEditors';
import DefinitionPropertyScope from './DefinitionPropertyScope.vue';
import CombatConditionEditor from './actions/CombatConditionEditor.vue';
import CombatStepEditor from './actions/CombatStepEditor.vue';
import type { ActionSequenceDefinition } from '../../../core/game-data/operatorDefinition';

describe('保存范围的统一编辑上下文', () => {
  it('真实施加 Buff 面板直接提交，删除最后一项仍执行父字段省略规则', async () => {
    let draft: ActionSequenceDefinition = {
      steps: [
        {
          kind: 'applyBuff',
          parameters: { buffId: 'test', target: 'enemy', blackboardAssignments: { x: [1, 2] } },
        },
      ],
    };
    const original = draft;
    const paths: unknown[] = [],
      updates: unknown[] = [];
    const context = createDefinitionEditContext({
      read: () => draft,
      commit(next, path) {
        draft = next;
        paths.push(path);
      },
    });
    const control = defineComponent({
      props: ['binding'],
      setup(props) {
        props.binding.update(() => ({}));
        return () => h('span');
      },
    });
    const app = createSSRApp({
      setup() {
        provide(
          inspectorEditorRegistryKey,
          extendInspectorEditors({
            buffAssignments: {
              component: control,
              props: context => ({ binding: context.binding }),
            },
          }),
        );
        return () =>
          h(
            DefinitionPropertyScope,
            { property: context.root.child('steps').child(0) },
            {
              default: () =>
                h(CombatStepEditor, {
                  step: original.steps[0]!,
                  skillLevel: 1,
                  inspectorOnly: true,
                  inlineBuffInGraph: true,
                  onUpdate: (...args: unknown[]) => updates.push(args),
                }),
            },
          );
      },
    });
    app.use(
      createI18n({
        legacy: false,
        locale: 'en',
        messages: {},
        missingWarn: false,
        fallbackWarn: false,
      }),
    );
    await renderToString(app);
    expect(draft.steps[0]!.parameters).toEqual({ buffId: 'test', target: 'enemy' });
    expect(original.steps[0]!.parameters).toHaveProperty('blackboardAssignments');
    expect(paths).toEqual([['steps', 0, 'parameters', 'blackboardAssignments']]);
    expect(updates).toEqual([]);
  });
  it('集合操作读取最新句柄，子属性继承动态禁用，不回传旧入口', () => {
    const stale = { items: [1] };
    let draft = stale;
    let count = 0;
    let enabled = true;
    const context = createDefinitionEditContext({
      read: () => draft,
      commit(next) {
        draft = next;
        count++;
      },
    });
    const items = guardDefinitionProperty(context.root.child('items'), () => enabled);
    const fallback = () => {
      throw new Error('不得回传旧入口');
    };
    editPropertyValue(items, stale.items, current => [...current, 2], fallback);
    editPropertyValue(items, stale.items, current => [...current, 3], fallback);
    expect(draft.items).toEqual([1, 2, 3]);
    enabled = false;
    items.child(0).update(() => 99);
    expect(draft.items).toEqual([1, 2, 3]);
    expect(count).toBe(2);
  });
  it('子句柄读取最新根，联动修改只提交一次，保留含点键', () => {
    let draft = { items: [{ values: { 'a.b': 1 }, other: 0 }] };
    const commits: unknown[] = [];
    const context = createDefinitionEditContext({
      read: () => draft,
      commit(next, focus) {
        draft = next;
        commits.push(focus);
      },
    });
    const item = context.root.child('items').child(0);
    const value = item.child('values').child('a.b');
    value.update(() => 2);
    item.update(current => ({ ...(current as object), other: 3 }));
    expect(draft).toEqual({ items: [{ values: { 'a.b': 2 }, other: 3 }] });
    expect(value.read()).toBe(2);
    expect(commits).toEqual([
      ['items', 0, 'values', 'a.b'],
      ['items', 0],
    ]);
    value.update(current => current);
    expect(commits).toHaveLength(2);
    draft = { items: [] };
    value.update(() => 5);
    expect(draft.items).toEqual([]);
    expect(commits).toHaveLength(2);
  });

  it('真实条件控件直接提交共享历史，不经过组件 update；撤销重做恢复根与完整定位', async () => {
    const initial = { condition: { kind: 'contextFlagEquals' as const, flag: 'old', value: true } };
    const draft = shallowRef(initial);
    const history = useDefinitionDraftHistory(
      () => draft.value,
      next => {
        draft.value = next;
      },
    );
    const commits: unknown[] = [];
    const context = createDefinitionEditContext({
      read: () => draft.value,
      commit(next, focus) {
        commits.push(focus);
        history.commit(next, { path: '', propertyPath: focus });
      },
    });
    const updates: unknown[] = [];
    const control = defineComponent({
      emits: ['update'],
      setup(_, { emit }) {
        emit('update', 'new');
        return () => h('span');
      },
    });
    const app = createSSRApp({
      setup() {
        provide(
          inspectorEditorRegistryKey,
          extendInspectorEditors({ text: { component: control, props: () => ({}) } }),
        );
        return () =>
          h(
            DefinitionPropertyScope,
            { property: context.root.child('condition') },
            {
              default: () =>
                h(CombatConditionEditor, {
                  condition: draft.value.condition,
                  layerOnly: true,
                  onUpdate: (...args: unknown[]) => updates.push(args),
                }),
            },
          );
      },
    });
    app.use(
      createI18n({
        legacy: false,
        locale: 'en',
        messages: {},
        missingWarn: false,
        fallbackWarn: false,
      }),
    );
    await renderToString(app);
    expect(draft.value.condition.flag).toBe('new');
    expect(commits).toEqual([['condition', 'flag']]);
    expect(updates).toEqual([]);
    history.restore('undo');
    expect(draft.value).toEqual(initial);
    expect(history.restoredLocation?.value?.propertyPath).toEqual(['condition', 'flag']);
    history.restore('redo');
    expect(draft.value.condition.flag).toBe('new');
  });
});
