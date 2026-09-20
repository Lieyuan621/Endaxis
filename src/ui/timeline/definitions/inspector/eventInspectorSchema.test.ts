import { expect, it } from 'vitest';
import { eventInspectorFields, eventOwnerInspectorFields } from './eventInspectorSchema';
import CombatEventResponseInspector from '../actions/CombatEventResponseInspector.vue';
import type {
  CombatEventResponseDefinition,
  CombatEventHandlerDefinition,
} from '../../../../core/game-data/operatorDefinition';
import {
  createCombatEventTriggerDraft,
  EDITABLE_COMBAT_EVENT_TRIGGER_KINDS,
} from '../actions/combatEventTriggerCatalog';
import type { CombatEventTrigger } from '../../../../core/game-data/operatorDefinition';
import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createI18n } from 'vue-i18n';
import CombatEventTriggerEditor from '../actions/CombatEventTriggerEditor.vue';
import { createDefinitionEditContext } from '../definitionEditContext';
import { inspectorEditorRegistryKey, extendInspectorEditors } from './inspectorEditors';

it('原生事件检查器提供契约候选并原位修改事件身份', () => {
  const value = createCombatEventTriggerDraft('abilityEvent');
  const field = eventInspectorFields(value).find(field => field.key === 'event');
  expect([...(field?.options ?? [])].sort()).toEqual(['addedBuff', 'outputBuff']);
  expect(field?.write(value, 'outputBuff')).toEqual({ kind: 'abilityEvent', event: 'outputBuff' });
});

it.each([false, true])('公共响应面板直接提交事件路径，保留图结构（调度=%s）', async scheduled => {
  type Owner = CombatEventResponseDefinition | CombatEventHandlerDefinition;
  let response: Owner = scheduled
    ? { key: 'a', event: { kind: 'enemyDefeated', scope: 'operator' }, scheduledSequences: [] }
    : { key: 'a', event: { kind: 'enemyDefeated', scope: 'operator' }, sequence: { steps: [] } };
  const original = response;
  const commits: unknown[] = [];
  const context = createDefinitionEditContext({
    read: () => ({ response }),
    commit: (next, path) => {
      response = next.response;
      commits.push(path);
    },
  });
  expect(eventOwnerInspectorFields<Owner>(scheduled).map(field => field.key)).toEqual(['key']);
  const control = defineComponent({
    props: ['value'],
    emits: ['update'],
    setup(props, { emit }) {
      if (props.value === 'operator') emit('update', 'team');
      return () => h('span');
    },
  });
  const app = createSSRApp({
    render: () =>
      h(CombatEventResponseInspector, {
        response,
        scheduled,
        binding: context.root.child('response'),
      }),
  });
  app.provide(
    inspectorEditorRegistryKey,
    extendInspectorEditors({
      enum: {
        component: control,
        props: ({ value }) => ({ value }),
      },
    }),
  );
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
  expect(commits).toEqual([['response', 'event', 'scope']]);
  expect(response).toEqual({ ...original, event: { kind: 'enemyDefeated', scope: 'team' } });
});

it('真实事件控件支持直接句柄，未绑定宿主仍使用原 update 兼容入口', async () => {
  for (const bound of [true, false]) {
    let event: CombatEventTrigger = { kind: 'enemyDefeated', scope: 'operator' };
    const commits: unknown[] = [];
    const updates: unknown[] = [];
    const context = createDefinitionEditContext({
      read: () => ({ event }),
      commit: (next, path) => {
        event = next.event;
        commits.push(path);
      },
    });
    const control = defineComponent({
      props: ['value'],
      emits: ['update'],
      setup(props, { emit }) {
        if (props.value === 'operator') emit('update', 'team');
        return () => h('span');
      },
    });
    const app = createSSRApp({
      render: () =>
        h(CombatEventTriggerEditor, {
          event,
          binding: bound ? context.root.child('event') : undefined,
          onUpdate: next => updates.push(next),
        }),
    });
    app.provide(
      inspectorEditorRegistryKey,
      extendInspectorEditors({
        enum: {
          component: control,
          props: ({ value }) => ({ value }),
        },
      }),
    );
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
    expect(commits).toEqual(bound ? [['event', 'scope']] : []);
    expect(updates).toEqual(bound ? [] : [{ kind: 'enemyDefeated', scope: 'team' }]);
  }
});

it('全部事件的非 kind 成员来自契约，切换类型使用原草稿工厂清理旧参数', () => {
  for (const kind of EDITABLE_COMBAT_EVENT_TRIGGER_KINDS) {
    const event = createCombatEventTriggerDraft(kind);
    const fields = eventInspectorFields(event);
    for (const key of Object.keys(event)) expect(fields.map(field => field.key)).toContain(key);
    expect(fields[0]!.write(event, 'spGained')).toEqual({ kind: 'spGained' });
  }
});

it('多元素筛选完整保留，修改范围不丢失数组或重复项', () => {
  const event: CombatEventTrigger = {
    kind: 'elementalInflictionApplied',
    elements: ['heat', 'cryo', 'heat'],
    scope: 'operator',
  };
  const fields = eventInspectorFields(event);
  const elements = fields.find(field => field.key === 'elements')!;
  expect(elements.widget).toBe('enumSelection');
  expect(elements.read(event)).toBe(event.elements);
  expect(elements.write(event, [])).toBe(event);
  expect(fields.find(field => field.key === 'scope')!.write(event, 'team')).toEqual({
    ...event,
    scope: 'team',
  });
  const physical = eventInspectorFields({
    kind: 'physicalInflictionApplied',
    types: ['fracture', 'airborne'],
    scope: 'team',
  });
  expect(physical.find(field => field.key === 'types')!.widget).toBe('enumSelection');
});

it('治疗目标和空 Buff 筛选仍保持省略语义，技力筛选可以独立省略', () => {
  const heal: CombatEventTrigger = { kind: 'operatorHealed' };
  const role = eventInspectorFields(heal).find(field => field.key === 'role')!;
  expect(role.read(heal)).toBe('target');
  expect(role.write(role.write(heal, 'source'), 'target')).toEqual(heal);
  const buff: CombatEventTrigger = { kind: 'buffConsumed', buffIds: ['a', 'b'] };
  const ids = eventInspectorFields(buff).find(field => field.key === 'buffIds')!;
  expect(ids.write(buff, [])).toEqual({ kind: 'buffConsumed' });
  const sp: CombatEventTrigger = { kind: 'spGained', source: 'skill', gainKind: 'refund' };
  expect(
    eventInspectorFields(sp)
      .find(field => field.key === 'source')!
      .toggle(sp, false),
  ).toEqual({ kind: 'spGained', gainKind: 'refund' });
});
