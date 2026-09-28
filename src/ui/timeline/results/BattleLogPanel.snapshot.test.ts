import { createRenderer, h, nextTick, shallowRef, ssrContextKey, type ComponentOptions } from 'vue';
import { createI18n } from 'vue-i18n';
import { expect, it } from 'vitest';
import BattleLogPanel from './BattleLogPanel.vue';
import type { TimelineBattleLogSnapshot } from './timelineBattleLogProjection';
import {
  CombatReceiptCollector,
  type CombatReceiptEntry,
} from '../../../core/combat/receipt/combatReceipt';

function historyOf(entries: readonly CombatReceiptEntry[]) {
  const receipt = new CombatReceiptCollector();
  for (const { sequence: _sequence, ...entry } of entries) receipt.record(entry);
  return receipt.history.snapshot();
}

function firstEntry(snapshot: TimelineBattleLogSnapshot): CombatReceiptEntry {
  return snapshot.history.get(0)!;
}

const log = (name: string, damage: number): TimelineBattleLogSnapshot => ({
  history: historyOf([
    {
      sequence: 0,
      frame: 30,
      time: 1,
      event: 'DamageApplied',
      sourceId: 'track:1',
      targetId: 'enemy',
      data: { castId: 'cast:1', value: damage, damageType: 'electric' },
    },
  ]),
  resolveCastOwners: () => [
    { castId: 'cast:1', label: '战技', operatorLabel: name, sourceId: 'track:1' },
  ],
});

// Mounted production setup and watchers, deliberately without a DOM/template.
// Browser rendering and pointer/keyboard activation are separate verification.
async function mount(initial: TimelineBattleLogSnapshot | null) {
  const current = shallowRef(initial);
  const locations: Array<{ frame: number; castId: string | null }> = [];
  let panel: any;
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
  const component = {
    ...(BattleLogPanel as ComponentOptions),
    setup(props: any, context: any) {
      panel = (BattleLogPanel as any).setup(props, context);
      return panel;
    },
    render: () => null,
  };
  const app = renderer.createApp({
    render: () =>
      h(component, {
        log: current.value,
        selectedCastId: null,
        eventLabel: String,
        damageTypeLabel: String,
        onLocate: (frame: number, castId: string | null) => locations.push({ frame, castId }),
      }),
  });
  app.use(createI18n({ legacy: false, locale: 'en', messages: { en: {} } }));
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  await nextTick();
  return { current, panel, locations, stop: () => app.unmount() };
}

it('locates preparation receipts at their negative frame without toggling the group closed', async () => {
  const initial = log('佩丽卡', 100);
  const entry = { ...firstEntry(initial), frame: -60, time: -2 };
  const f = await mount({ ...initial, history: historyOf([entry]) });
  try {
    const group = f.panel.groupedEntries.value[0];
    const event = { preventDefault() {} };
    f.panel.locateGroup(group, event);
    f.panel.locateGroup(group, event);
    expect(f.panel.openGroupKey.value).toBe(group.key);
    f.panel.locateEntry(group, entry);
    expect(f.locations).toEqual(
      Array.from({ length: 3 }, () => ({ frame: -60, castId: 'cast:1' })),
    );
  } finally {
    f.stop();
  }
});

it('holds receipts, group labels and source labels until one explicit refresh', async () => {
  const first = log('佩丽卡', 100);
  const f = await mount(first);
  try {
    expect(f.panel.sourceLabel(firstEntry(first))).toBe('佩丽卡 · 战技');
    expect(f.panel.groupedEntries.value[0].damage).toBe(100);
    f.current.value = log('弧光', 500);
    await nextTick();
    expect(f.panel.dirty.value).toBe(true);
    expect(f.panel.snapshot.value).toBe(first);
    expect(f.panel.sourceLabel(firstEntry(first))).toBe('佩丽卡 · 战技');
    expect(f.panel.groupedEntries.value[0].damage).toBe(100);
    expect(f.panel.ownerBySourceId.value.get('track:1').operatorLabel).toBe('佩丽卡');
    f.panel.refresh();
    expect(f.panel.dirty.value).toBe(false);
    expect(f.panel.sourceLabel(firstEntry(first))).toBe('弧光 · 战技');
    expect(f.panel.groupedEntries.value[0].damage).toBe(500);
  } finally {
    f.stop();
  }
});

it('loads the first publication but does not auto-refresh a published empty log', async () => {
  const f = await mount(null);
  try {
    const empty = { history: historyOf([]), resolveCastOwners: () => [] };
    f.current.value = empty;
    await nextTick();
    expect(f.panel.snapshot.value).toBe(empty);
    f.current.value = log('佩丽卡', 100);
    await nextTick();
    expect(f.panel.entries.value).toEqual([]);
    expect(f.panel.dirty.value).toBe(true);
    f.panel.refresh();
    expect(f.panel.entries.value).toHaveLength(1);
    f.panel.clearEvents();
    expect(f.panel.filteredEntries.value).toHaveLength(0);
  } finally {
    f.stop();
  }
});

it('relocalizes the retained snapshot without refreshing to a newer publication', async () => {
  const language = shallowRef('zh');
  const first = log('unused', 100);
  const f = await mount({
    ...first,
    resolveCastOwners: () => [
      {
        castId: 'cast:1',
        sourceId: 'track:1',
        label: language.value === 'zh' ? '战技' : 'Battle skill',
        operatorLabel: language.value === 'zh' ? '佩丽卡' : 'Perlica',
      },
    ],
  });
  try {
    f.current.value = log('弧光', 500);
    await nextTick();
    language.value = 'en';
    expect(f.panel.sourceLabel(firstEntry(first))).toBe('Perlica · Battle skill');
    expect(f.panel.groupedEntries.value[0].damage).toBe(100);
    expect(f.panel.dirty.value).toBe(true);
  } finally {
    f.stop();
  }
});

it('clears the retained log when its publication scope is cleared', async () => {
  const f = await mount(log('佩丽卡', 100));
  try {
    f.current.value = null;
    await nextTick();
    expect(f.panel.entries.value).toEqual([]);
    expect(f.panel.castOwners.value).toEqual([]);
    expect(f.panel.dirty.value).toBe(false);
    f.current.value = log('弧光', 500);
    await nextTick();
    expect(f.panel.groupedEntries.value[0].damage).toBe(500);
    expect(f.panel.sourceLabel(f.panel.entries.value[0])).toBe('弧光 · 战技');
  } finally {
    f.stop();
  }
});

it('hides only frame-by-frame SP recovery until debug events are enabled', async () => {
  const first = log('佩丽卡', 100);
  const f = await mount({
    ...first,
    history: historyOf([
      firstEntry(first),
      {
        sequence: 1,
        frame: 31,
        time: 31 / 30,
        event: 'SpChanged',
        data: { source: 'autoRecovery', previousValue: 200, currentValue: 200.27 },
      },
      {
        sequence: 2,
        frame: 32,
        time: 32 / 30,
        event: 'SpChanged',
        sourceId: 'track:1',
        data: { skillId: 'battleSkill', previousValue: 200.27, currentValue: 210 },
      },
    ]),
  });
  try {
    expect(f.panel.hiddenAutoRecoveryCount.value).toBe(1);
    expect(
      f.panel.filteredEntries.value.map((entry: CombatReceiptEntry) => entry.sequence),
    ).toEqual([0, 2]);
    f.panel.showDebugEvents.value = true;
    expect(
      f.panel.filteredEntries.value.map((entry: CombatReceiptEntry) => entry.sequence),
    ).toEqual([0, 1, 2]);
    f.panel.showDebugEvents.value = false;
    expect(f.panel.filteredEntries.value).toHaveLength(2);
  } finally {
    f.stop();
  }
});

it('does not repeat a source already named by its group or expose unknown source IDs', async () => {
  const first = log('佩丽卡', 100);
  const f = await mount(first);
  try {
    const group = f.panel.groupedEntries.value[0];
    expect(f.panel.entrySourceLabel(group, firstEntry(first))).toBeNull();
    expect(f.panel.sourceLabel({ ...firstEntry(first), data: {}, sourceId: 'unknown' })).toBeNull();
  } finally {
    f.stop();
  }
});

it('keeps unknown Buff IDs readable and presents damage as separate main-style fields', async () => {
  const f = await mount(log('佩丽卡', 100));
  try {
    const buff = {
      sequence: 2,
      frame: 5,
      time: 5 / 30,
      event: 'BuffCreated',
      data: { buffId: 'buff:operator-specific' },
    } satisfies CombatReceiptEntry;
    expect(f.panel.entrySummary(buff)).toBe('buff:operator-specific');

    const damage = {
      ...firstEntry(f.current.value!),
      data: { value: 1677, damageType: 'physical' },
    } satisfies CombatReceiptEntry;
    expect(f.panel.isDamageEntry(damage)).toBe(true);
    expect(f.panel.isEffectDamage(damage)).toBe(false);
    expect(f.panel.damageAmount(damage)).toBe('1,677');
    expect(f.panel.damageElement(damage)).toBe('physical');
    expect(f.panel.isEffectDamage({ ...damage, event: 'BuffDamageApplied' })).toBe(true);
  } finally {
    f.stop();
  }
});
