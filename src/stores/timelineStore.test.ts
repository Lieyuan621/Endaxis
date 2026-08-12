import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { useTimelineStore } from './timelineStore';
import { useOperatorStore } from './operatorStore';
import { setLocale } from '@/i18n';
import { serializeProjectData } from '@/utils/timeSerialization';

describe('timeline skill library editing', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, String(value));
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    });
  });

  it('exposes segmented skill children as editable library models', async () => {
    const store = useTimelineStore();
    await store.fetchGameData();

    store.changeTrackOperator(0, null, 'zhuang-fangyi');
    store.selectTrack(0);

    const groupedSkill = store.activeSkillLibrary.find(
      (skill: any) =>
        (Array.isArray(skill?.segments) && skill.segments.length >= 2) ||
        (Array.isArray(skill?.attackSegments) && skill.attackSegments.length >= 2),
    ) as any;
    expect(groupedSkill).toBeTruthy();

    const firstSegment = (groupedSkill.segments || groupedSkill.attackSegments)[0];
    expect(firstSegment?.hiddenInLibraryGrid).toBe(true);

    const librarySegment = store.activeSkillLibrary.find(
      (skill: any) => skill.id === firstSegment.id,
    ) as any;
    expect(librarySegment).toBeTruthy();

    const editedHits = [
      {
        offset: 0.5,
        multiplier: 777,
        spRecovery: 3,
        spReturn: 0,
        stagger: 9,
        effects: [],
      },
    ];

    store.updateLibrarySkill(firstSegment.id, {
      duration: 2.25,
      hits: editedHits,
    });

    const editedSegment = store.activeSkillLibrary.find(
      (skill: any) => skill.id === firstSegment.id,
    ) as any;
    expect(editedSegment.duration).toBe(2.25);
    expect(editedSegment.hits).toMatchObject(editedHits);

    store.addSkillToTrack('zhuang-fangyi', editedSegment, 1);
    const insertedAction = store.tracks[0]!.actions.find(
      (action: any) => action.id === firstSegment.id,
    ) as any;

    expect(insertedAction).toBeTruthy();
    expect(insertedAction.duration).toBe(2.25);
    expect(insertedAction.hits).toMatchObject(editedHits);
  });

  it('preserves user-edited action duration after operator status refresh', async () => {
    const store = useTimelineStore();
    await store.fetchGameData();

    store.changeTrackOperator(0, null, 'zhuang-fangyi');
    store.selectTrack(0);

    const battleSkill = store.activeSkillLibrary.find(
      (skill: any) => skill.type === 'battleSkill' && !skill.hiddenInLibraryGrid,
    ) as any;
    expect(battleSkill).toBeTruthy();

    store.addSkillToTrack('zhuang-fangyi', battleSkill, 1);
    const action = store.tracks[0]!.actions.find(
      (item: any) => item.id === battleSkill.id,
    ) as any;
    expect(action).toBeTruthy();

    const sheetDuration = Number(action.duration) || 0;
    const customDuration = sheetDuration > 0 ? sheetDuration + 1.5 : 3.25;
    store.updateAction(action.instanceId, { duration: customDuration });
    expect(action.duration).toBe(customDuration);
    store.commitState();

    localStorage.setItem(
      'endaxis_autosave',
      JSON.stringify(
        serializeProjectData({
          version: '1.0.0',
          timestamp: Date.now(),
          scenarioList: JSON.parse(JSON.stringify(store.scenarioList)),
          activeScenarioId: store.activeScenarioId,
          systemConstants: store.systemConstants,
          activeEnemyId: store.activeEnemyId,
          activeEnemyLevel: store.activeEnemyLevel,
        }),
      ),
    );

    await store.loadFromBrowser();

    const reloaded = store.tracks[0]!.actions.find(
      (item: any) => item.instanceId === action.instanceId,
    ) as any;
    expect(reloaded).toBeTruthy();
    expect(reloaded.duration).toBe(customDuration);
  });

  it('names generic basic attacks as 普攻 and only the final segment as 重击', async () => {
    setLocale('zh-CN');
    const store = useTimelineStore();
    await store.fetchGameData();

    store.changeTrackOperator(0, null, 'zhuang-fangyi');
    store.selectTrack(0);

    const basicAttackGroup = store.activeSkillLibrary.find(
      (skill: any) => skill.type === 'basicAttack' && skill.kind === 'attack_group',
    ) as any;

    expect(basicAttackGroup).toBeTruthy();
    expect(basicAttackGroup.name).toBe('普攻');

    store.addSkillToTrack('zhuang-fangyi', basicAttackGroup, 1);
    const insertedSegments = store.tracks[0]!.actions.filter(
      (action: any) => action.attackGroupInstanceId,
    ) as any[];

    expect(insertedSegments.length).toBeGreaterThan(1);
    expect(insertedSegments.at(-1)?.name).toBe('重击');
    expect(
      insertedSegments.slice(0, -1).every((action: any) => action.name.startsWith('普攻 ')),
    ).toBe(true);
  });

  it('keeps Laevatain enhanced basic attack distinct from normal attack in the library', async () => {
    setLocale('zh-CN');
    const store = useTimelineStore();
    await store.fetchGameData();

    store.changeTrackOperator(0, null, 'laevatain');
    store.selectTrack(0);

    const basicAttacks = store.activeSkillLibrary.filter(
      (skill: any) => skill.type === 'basicAttack' && !skill.hiddenInLibraryGrid,
    ) as any[];
    const enhanced = basicAttacks.find(
      (skill: any) => skill.skillKey === 'laevatain-basic-attack-during-ultimate',
    );
    const normal = basicAttacks.find((skill: any) => skill.skillKey === 'basicAttack');

    expect(enhanced).toBeTruthy();
    expect(normal).toBeTruthy();
    expect(enhanced.id).not.toBe(normal.id);
    expect(enhanced.name).toBe('强化普攻');
    expect(normal.name).toBe('普攻');

    const { findLibrarySkillForPlaceRematch } = await import('@/utils/librarySkillHotkeys');
    expect(
      findLibrarySkillForPlaceRematch(store.activeSkillLibrary, {
        id: enhanced.id,
        type: 'basicAttack',
      })?.id,
    ).toBe(enhanced.id);
  });

  it('resolves Wulfgard derived hit effects before exposing skills to the editor', async () => {
    const store = useTimelineStore();
    await store.fetchGameData();

    store.changeTrackOperator(0, null, 'wulfgard');
    store.selectTrack(0);

    const battleSkill = store.activeSkillLibrary.find(
      (skill: any) => skill.type === 'battleSkill',
    ) as any;
    const effects = (battleSkill?.hits || []).flatMap((hit: any) => hit.effects || []);

    expect(effects.some((effect: any) => effect.kind === 'derived')).toBe(false);
    expect(effects.some((effect: any) => effect.displayType === 'derived')).toBe(false);
    expect(
      effects.some(
        (effect: any) =>
          effect.name === 'scorchingFangs' &&
          effect.kind === 'status' &&
          effect.displayType === 'scorchingFangs',
      ),
    ).toBe(true);
  });

  it('exposes Liino stance termination as a zero-cost short nonSkill action', async () => {
    setLocale('zh-CN');
    const store = useTimelineStore();
    await store.fetchGameData();

    store.changeTrackOperator(0, null, 'liino');
    store.selectTrack(0);

    const stanceTermination = store.activeSkillLibrary.find(
      (skill: any) => skill.skillKey === 'liino-stance-termination',
    ) as any;
    const battleSkill = store.activeSkillLibrary.find(
      (skill: any) => skill.skillKey === 'battleSkill',
    ) as any;
    const ultimate = store.activeSkillLibrary.find(
      (skill: any) => skill.skillKey === 'ultimate',
    ) as any;

    expect(stanceTermination).toMatchObject({
      type: 'nonSkill',
      skillId: 'liino-stance-termination',
      name: '姿态中止',
      duration: 0.2,
      spCost: 0,
      gaugeGain: 0,
      teamGaugeGain: 0,
    });
    expect(stanceTermination.requisites).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'liino-stance-termination-active' })]),
    );
    expect(battleSkill.requisites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'liino-battle-skill-cooldown-ready' }),
      ]),
    );
    expect(battleSkill.spCost).toBe(25);
    expect(ultimate.requisites).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'ultimate-cooldown-ready' })]),
    );

    // Sub-skill rule: a nonSkill variant ranks by its parent skill, so it sits directly beneath
    // the battle skill rather than falling to the end of the library.
    const keys = store.activeSkillLibrary.map((skill: any) => skill.skillKey);
    expect(keys.indexOf('liino-stance-termination')).toBe(keys.indexOf('battleSkill') + 1);
  });

  it('toggles multiple actions through the shared action selection path', () => {
    const store = useTimelineStore();

    store.selectConnection('conn-1');
    expect(store.selectedConnectionId).toBe('conn-1');

    store.toggleActionsMultiSelection(['a-1', 'a-2']);
    expect([...store.multiSelectedIds].sort()).toEqual(['a-1', 'a-2']);
    expect(store.selectedActionId).toBeNull();
    expect(store.selectedConnectionId).toBeNull();

    store.toggleActionsMultiSelection(['a-2', 'a-3']);
    expect([...store.multiSelectedIds].sort()).toEqual(['a-1', 'a-3']);
  });

  it('keeps scenario switching transactional until queued store watchers have flushed', async () => {
    vi.useFakeTimers();

    try {
      const store = useTimelineStore();
      const firstScenarioId = store.activeScenarioId;
      store.addScenario();

      expect(store.activeScenarioId).not.toBe(firstScenarioId);

      store.switchScenario(firstScenarioId);

      expect(store.activeScenarioId).toBe(firstScenarioId);
      expect(store.isSwitchingScenario).toBe(true);

      await nextTick();
      await vi.runOnlyPendingTimersAsync();

      expect(store.isSwitchingScenario).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not replace unchanged armory data during timeline undo and redo', () => {
    const store = useTimelineStore();
    const operatorStore = useOperatorStore();
    operatorStore.setAll([
      {
        id: 'op-history-test',
        operatorSlug: 'zhuang-fangyi',
        level: 1,
        promoted: false,
        potential: 0,
        skillLevels: {},
        talentStates: {},
        trustLevel: 0,
      },
    ] as any);

    store.tracks[0]!.id = 'zhuang-fangyi';
    store.tracks[0]!.operatorInstanceId = 'op-history-test';
    store.commitState();
    const armoryReference = operatorStore.operators;

    store.tracks[0]!.actions.push({
      id: 'history-skill',
      instanceId: 'history-action',
      name: 'History skill',
      startTime: 1,
      duration: 1,
      hits: [],
    } as any);
    store.commitState();

    store.undo();
    expect(store.tracks[0]!.actions).toHaveLength(0);
    expect(operatorStore.operators).toBe(armoryReference);

    store.redo();
    expect(store.tracks[0]!.actions.map(action => action.instanceId)).toEqual(['history-action']);
    expect(operatorStore.operators).toBe(armoryReference);
  });

  it('still restores armory edits through history', () => {
    const store = useTimelineStore();
    const operatorStore = useOperatorStore();
    operatorStore.setAll([
      {
        id: 'op-armory-history-test',
        operatorSlug: 'zhuang-fangyi',
        level: 1,
        promoted: false,
        potential: 0,
        skillLevels: {},
        talentStates: {},
        trustLevel: 0,
      },
    ] as any);
    store.commitState();

    operatorStore.updateOperator('op-armory-history-test', { level: 20 });
    store.commitState();
    expect(operatorStore.operators[0]?.level).toBe(20);

    store.undo();
    expect(operatorStore.operators[0]?.level).toBe(1);
  });

  it('deletes the selected combo cooldown control event', () => {
    const store = useTimelineStore();
    store.addComboCooldownEvent(3, 'cooldown');
    const eventId = store.comboCooldownEvents[0]!.id;

    store.selectComboCooldownEvent(eventId);
    expect(store.removeCurrentSelection()).toEqual({ total: 1 });
    expect(store.comboCooldownEvents).toHaveLength(0);
    expect(store.selectedComboCooldownEventId).toBeNull();
  });

  it('exposes simulated combo cooldown intervals for timeline rendering', () => {
    const store = useTimelineStore();
    store.tracks[0]!.id = 'combo-render-test';
    store.tracks[0]!.actions = [
      {
        id: 'combo-render-skill',
        instanceId: 'combo-render-action',
        skillId: 'combo-render-skill',
        name: 'Combo',
        type: 'comboSkill',
        startTime: 2,
        logicalStartTime: 2,
        duration: 1,
        cooldown: 10,
        hits: [],
      } as any,
    ];
    store.commitState();

    expect(store.comboCooldownIntervals).toContainEqual(
      expect.objectContaining({
        actorId: 'combo-render-test',
        sourceActionId: 'combo-render-action',
        start: 2,
        end: 12,
      }),
    );
  });
});
