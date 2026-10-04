import { mountSetup } from '../../test/componentSetup';
import { h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp } from 'vue';
import { expect, it } from 'vitest';
import { i18n } from '../../i18n';
import BlackboardKeyField from './BlackboardKeyField.vue';
import { blackboardNavigationKey, type BlackboardNavigator } from './blackboardFieldContext';
import type { BlackboardFieldContext } from '../../application/editor/blackboardFieldContext';

const context: BlackboardFieldContext = {
  status: 'known',
  scopes: [{ id: 'local', label: 'Local callback' }],
  parameters: [],
  candidates: [
    {
      key: 'amount',
      valueType: 'number',
      readable: true,
      writable: true,
      scope: 'local',
      source: 'Local callback',
      target: { owner: 'action', id: 'writer' },
    },
    {
      key: 'buffId',
      valueType: 'string',
      readable: true,
      writable: true,
      scope: 'local',
      source: 'Local callback',
    },
  ],
};
function mount(initial: Record<string, unknown>, navigate?: BlackboardNavigator) {
  return mountSetup(BlackboardKeyField, initial, app => {
    if (navigate) app.provide(blackboardNavigationKey, navigate);
  });
}

it('accepts only compatible known choices and reports invalid raw text to transaction owners', async () => {
  const accepted: string[] = [];
  const raw: string[] = [];
  const mounted = await mount({
    context,
    mode: 'read',
    valueType: 'string',
    value: 'buffId',
    onChange: (key: string) => accepted.push(key),
    onDraftChange: (key: string) => raw.push(key),
  });
  try {
    mounted.state.choose('amount');
    expect(accepted).toEqual([]);
    mounted.state.input('amount');
    mounted.state.change('amount');
    expect(raw).toEqual(['amount']);
    expect(accepted).toEqual([]);
    expect(mounted.state.resolution.value.state).toBe('typeMismatch');
    mounted.state.input('runtimeSupplied');
    mounted.state.change('runtimeSupplied');
    expect(accepted).toEqual(['runtimeSupplied']);
    await mounted.update({ context: { ...context, candidates: [] } });
    expect(mounted.state.draft.value).toBe('runtimeSupplied');
    await mounted.update({ value: 'replacement' });
    expect(mounted.state.draft.value).toBe('replacement');
  } finally {
    mounted.stop();
  }
});

it('readonly retains source navigation while rejecting writes', async () => {
  const accepted: string[] = [];
  const navigated: unknown[] = [];
  const mounted = await mount(
    {
      context,
      mode: 'read',
      valueType: 'number',
      value: 'amount',
      editable: false,
      onChange: (key: string) => accepted.push(key),
    },
    target => navigated.push(target),
  );
  try {
    mounted.state.choose('buffId');
    mounted.state.input('other');
    mounted.state.change('other');
    mounted.state.locate();
    expect(accepted).toEqual([]);
    expect(mounted.state.draft.value).toBe('amount');
    expect(navigated).toEqual([{ owner: 'action', id: 'writer' }]);
  } finally {
    mounted.stop();
  }
});

it('renders unknown ownership without inventing a selected key or a fallback value', async () => {
  const app = createSSRApp({
    render: () => h(BlackboardKeyField, { mode: 'read', valueType: 'string', value: 'dynamicId' }),
  });
  app.use(i18n);
  const html = await renderToString(app);
  expect(html).toContain('data-blackboard-state="contextUnknown"');
  expect(html).toContain('dynamicId');
  expect(html).not.toContain('data-blackboard-state="valid"');
});
