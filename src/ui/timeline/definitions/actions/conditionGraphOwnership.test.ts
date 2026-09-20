import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createSSRApp, defineComponent, h, provide, nextTick, type ComponentOptions } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createI18n } from 'vue-i18n';
import CombatConditionEditor from './CombatConditionEditor.vue';
import CombatConditionWorkspace from './CombatConditionWorkspace.vue';
import { extendInspectorEditors, inspectorEditorRegistryKey } from '../inspector/inspectorEditors';
import type { CombatCondition } from '../../../../../packages/game-data-contract/src/conditions';
import { buildCombatConditionMindMap } from '../skillStructureMindMapModel';
import { conditionStructure } from '../inspector/conditionStructure.generated';
import { conditionInspectorFields } from '../inspector/conditionInspectorSchema';
import {
  insertStructureArrayItem,
  moveStructureArrayItem,
  replaceStructureValueAtPath,
} from '../skillStructureEditorCommands';

describe('条件图与参数的所有权', () => {
  it('恢复属性路径时选中最深子条件，不产生草稿更新', async () => {
    const condition: CombatCondition = {
      kind: 'all',
      conditions: [
        { kind: 'not', condition: { kind: 'contextFlagEquals', flag: 'a.b', value: true } },
      ],
    };
    let workspace: any;
    const changes: unknown[] = [];
    const component = {
      ...(CombatConditionWorkspace as ComponentOptions),
      setup(props: any, context: any) {
        workspace = (CombatConditionWorkspace as any).setup(props, context);
        return workspace;
      },
      ssrRender: () => {},
    };
    await renderToString(
      createSSRApp({
        render: () =>
          h(component, {
            condition,
            restoredPropertyPath: ['conditions', 0, 'condition', 'flag'],
            onUpdate: (...args: unknown[]) => changes.push(args),
          }),
      }),
    );
    await nextTick();
    expect(workspace.selectedPath.value).toBe('condition.conditions[0].condition');
    expect(workspace.value.value).toEqual({ kind: 'contextFlagEquals', flag: 'a.b', value: true });
    expect(changes).toEqual([]);
  });

  it('独立工作区将所选子条件的属性路径传给宿主，不泄漏内部 condition 包装', async () => {
    const condition: CombatCondition = {
      kind: 'all',
      conditions: [{ kind: 'contextFlagEquals', flag: 'old', value: true }],
    };
    let workspace: any;
    const changes: unknown[][] = [];
    const component = {
      ...(CombatConditionWorkspace as ComponentOptions),
      setup(props: any, context: any) {
        workspace = (CombatConditionWorkspace as any).setup(props, context);
        return workspace;
      },
      ssrRender: () => {},
    };
    const app = createSSRApp({
      render: () =>
        h(component, { condition, onUpdate: (...args: unknown[]) => changes.push(args) }),
    });
    await renderToString(app);
    workspace.selectedPath.value = 'condition.conditions[0]';
    workspace.update({ kind: 'contextFlagEquals', flag: 'new', value: true }, ['flag']);
    await nextTick();
    expect(changes).toEqual([
      [
        { kind: 'all', conditions: [{ kind: 'contextFlagEquals', flag: 'new', value: true }] },
        ['conditions', 0, 'flag'],
      ],
    ]);
    expect(condition.conditions[0]).toEqual({
      kind: 'contextFlagEquals',
      flag: 'old',
      value: true,
    });
  });

  it('条件类型切换也使用注册表与句柄，一次返回新条件及属性路径', async () => {
    const original: CombatCondition = { kind: 'all', conditions: [{ kind: 'combatActive' }] };
    const changes: unknown[][] = [];
    const control = defineComponent({
      emits: ['update'],
      setup(_, { emit }) {
        emit('update', 'singleEnemyPresent');
        return () => h('span', 'kind');
      },
    });
    const app = createSSRApp({
      setup() {
        provide(
          inspectorEditorRegistryKey,
          extendInspectorEditors({ enum: { component: control, props: () => ({}) } }),
        );
        return () =>
          h(CombatConditionEditor, {
            condition: original,
            layerOnly: true,
            onUpdate: (...args: unknown[]) => changes.push(args),
          });
      },
    });
    app.use(
      createI18n({
        legacy: false,
        locale: 'en',
        messages: { en: {} },
        missingWarn: false,
        fallbackWarn: false,
      }),
    );
    await renderToString(app);
    expect(changes).toEqual([[{ kind: 'singleEnemyPresent' }, ['kind']]]);
    expect(original.conditions).toEqual([{ kind: 'combatActive' }]);
  });

  it('递归字段是图关系，Inspector 不展开子条件', () => {
    expect(conditionStructure.not.condition.type).toBe('conditionNode');
    expect(conditionStructure.all.conditions.type).toBe('conditionNodes');
    const condition: CombatCondition = {
      kind: 'all',
      conditions: [
        { kind: 'not', condition: { kind: 'combatActive' } },
        { kind: 'singleEnemyPresent' },
      ],
    };
    const graph = buildCombatConditionMindMap(condition);
    expect(graph.children[0]!.children[0]!.sourcePath).toBe('condition.conditions[0].condition');
    expect(graph.canDelete).toBe(false);
    expect(graph.children[0]!.children[0]!.canDelete).toBe(false);
    expect(conditionInspectorFields('all')).toEqual([]);
    const inspector = readFileSync(new URL('./CombatConditionEditor.vue', import.meta.url), 'utf8');
    expect(inspector).not.toContain('RecursiveConditionEditor');
    expect(inspector).not.toContain('condition.conditions');
    const workspace = readFileSync(
      new URL('./CombatConditionWorkspace.vue', import.meta.url),
      'utf8',
    );
    expect(workspace).not.toContain('useDefinitionDraftHistory');
  });

  it('查询对象不产生独立图节点', () => {
    const condition: CombatCondition = {
      kind: 'buffBlackboardValueCompare',
      target: 'enemy',
      query: { kind: 'id', buffIds: ['buff'] },
      desiredKey: 'a',
      outputKey: 'b',
      operator: 'greater',
      value: { kind: 'constant', value: 0 },
    };
    expect(buildCombatConditionMindMap(condition).children).toEqual([]);
  });

  it('独立条件图复用结构命令增删排序和替换节点，不改写原树', () => {
    const original: { condition: CombatCondition } = {
      condition: { kind: 'all', conditions: [{ kind: 'combatActive' }] },
    };
    const added = insertStructureArrayItem(original, 'condition.conditions', {
      kind: 'singleEnemyPresent',
    });
    const moved = moveStructureArrayItem(added.root, added.itemPath, 'condition.conditions', 0);
    const updated = replaceStructureValueAtPath(moved.root, moved.itemPath, {
      kind: 'casterControlled',
    });
    expect(updated.condition).toEqual({
      kind: 'all',
      conditions: [{ kind: 'casterControlled' }, { kind: 'combatActive' }],
    });
    expect(original.condition).toEqual({ kind: 'all', conditions: [{ kind: 'combatActive' }] });
  });
});
