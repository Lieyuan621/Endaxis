import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { useTimelineStore } from './timelineStore';
import { useOperatorStore } from './operatorStore';
import { useWeaponStore } from './weaponStore';
import { useGearStore } from './gearStore';
import { setLocale } from '@/i18n';
import { deserializeProjectData, serializeProjectData } from '@/utils/timeSerialization';
import { buildResolvedSegmentPayload } from './timeline/resolveHits';
import { useDragConnection } from '@/composables/useDragConnection';
import * as timelineCompiler from '@/simulation/compiler/compileTimeline';

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

  it('freezes Camille pursuit without changing the battle-skill identity', async () => {
    const store = useTimelineStore();
    await store.fetchGameData();
    store.changeTrackOperator(0, null, 'camille');
    store.selectTrack(0);
    const ultimate = store.activeSkillLibrary.find((s: any) => s.type === 'ultimate') as any;
    const skill = store.activeSkillLibrary.find((s: any) => s.type === 'battleSkill') as any;
    store.addSkillToTrack('camille', ultimate, 0);
    store.addSkillToTrack('camille', skill, 6);
    store.addSkillToTrack('camille', skill, 10);

    const pursuit = store.tracks[0]!.actions[1]!;
    const ordinary = store.tracks[0]!.actions[2]!;
    expect(store.compiledTimeline!.actionMap.get(pursuit.instanceId!)?.freezeDuration).toBe(0.5);
    expect(
      store.compiledTimeline!.actionMap.get(ordinary.instanceId!)?.freezeDuration,
    ).toBeUndefined();
    expect(pursuit.type).toBe('battleSkill');
    expect(store.globalExtensions.map(e => e.amount)).toEqual([2.3, 0.5]);
    expect(
      store.operatorLog.some(
        (event: any) =>
          event.type === 'OPERATOR_EFFECT_EXPIRE' &&
          event.id === 'camille-hunter-pursuit-ready' &&
          event.time === 8.633,
      ),
    ).toBe(true);
    expect(store.comboCooldownIntervals).toEqual([]);
  });

  it('refreshes Camille freeze metadata on reload without saving an activated flag', async () => {
    const store = useTimelineStore();
    await store.fetchGameData();
    store.changeTrackOperator(0, null, 'camille');
    store.selectTrack(0);
    const ultimate = store.activeSkillLibrary.find((s: any) => s.type === 'ultimate') as any;
    const skill = store.activeSkillLibrary.find((s: any) => s.type === 'battleSkill') as any;
    store.addSkillToTrack('camille', ultimate, 0);
    store.addSkillToTrack('camille', skill, 6);
    const pursuitId = store.tracks[0]!.actions[1]!.instanceId!;
    delete store.tracks[0]!.actions[1]!.conditionalFreeze;
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
    expect(store.compiledTimeline!.actionMap.get(pursuitId)?.freezeDuration).toBe(0.5);
    const reloaded = store.tracks[0]!.actions.find(a => a.instanceId === pursuitId)!;
    expect(reloaded).not.toHaveProperty('freezeDuration');
    const restored = deserializeProjectData(serializeProjectData({ actions: [reloaded] })) as any;
    expect(restored.actions[0].conditionalFreeze.duration).toBe(0.5);
    expect(restored.actions[0].conditionalFreeze.compression).toBe('comboSkill');
  });

  it.each(['before', 'after'] as const)(
    'compresses Camille and ordinary combos in the editor with the combo %s pursuit',
    async position => {
      const store = useTimelineStore();
      await store.fetchGameData();
      store.changeTrackOperator(0, null, 'camille');
      store.selectTrack(0);
      const ultimate = store.activeSkillLibrary.find((s: any) => s.type === 'ultimate') as any;
      const skill = store.activeSkillLibrary.find((s: any) => s.type === 'battleSkill') as any;
      store.addSkillToTrack('camille', ultimate, 0);
      store.addSkillToTrack('camille', skill, 6);
      const pursuitId = store.tracks[0]!.actions[1]!.instanceId!;
      const comboTime = position === 'before' ? 5.8 : 6.2;
      store.tracks[1]!.actions = [
        {
          id: 'combo',
          instanceId: 'combo',
          type: 'comboSkill',
          startTime: comboTime,
          logicalStartTime: comboTime,
          duration: 1,
          hits: [],
        },
      ];
      store.commitState();
      store.refreshAllActionShifts();
      const compressedId = position === 'before' ? 'combo' : pursuitId;
      expect(store.compiledTimeline!.actionMap.get(compressedId)?.freezeDuration).toBe(0.2);
      expect(store.tracks[0]!.actions[1]!.startTime).toBe(6);
      expect(store.tracks[1]!.actions[0]!.startTime).toBe(comboTime);
      store.updateAction('combo', { startTime: 10 });
      expect(store.compiledTimeline!.actionMap.get(pursuitId)?.freezeDuration).toBe(0.5);
      store.undo();
      expect(store.compiledTimeline!.actionMap.get(compressedId)?.freezeDuration).toBe(0.2);
      store.redo();
      expect(store.compiledTimeline!.actionMap.get(pursuitId)?.freezeDuration).toBe(0.5);
    },
  );

  it('uses nominal freeze time for Camille insertion just like ordinary combos', async () => {
    const store = useTimelineStore();
    await store.fetchGameData();
    store.changeTrackOperator(0, null, 'camille');
    store.selectTrack(0);
    const ultimate = store.activeSkillLibrary.find((s: any) => s.type === 'ultimate') as any;
    const skill = store.activeSkillLibrary.find((s: any) => s.type === 'battleSkill') as any;
    store.addSkillToTrack('camille', ultimate, 0);
    store.tracks[1]!.actions = [
      {
        id: 'combo',
        instanceId: 'combo',
        type: 'comboSkill',
        startTime: 6.2,
        logicalStartTime: 6.2,
        duration: 1,
        hits: [],
      },
    ];
    store.addSkillToTrack('camille', skill, 6);
    const pursuitId = store.tracks[0]!.actions[1]!.instanceId!;
    expect(store.tracks[1]!.actions[0]!.startTime).toBe(6.7);
    expect(store.compiledTimeline!.actionMap.get(pursuitId)?.freezeDuration).toBe(0.5);
    store.setMultiSelection([pursuitId]);
    store.removeCurrentSelection();
    expect(store.tracks[1]!.actions[0]!.startTime).toBe(6.2);
  });

  it('pushes and pulls later actions when placing and deleting Camille pursuit, including history', async () => {
    const store = useTimelineStore();
    await store.fetchGameData();
    store.changeTrackOperator(0, null, 'camille');
    store.selectTrack(0);
    const ultimate = store.activeSkillLibrary.find((s: any) => s.type === 'ultimate') as any;
    const skill = store.activeSkillLibrary.find((s: any) => s.type === 'battleSkill') as any;
    store.addSkillToTrack('camille', ultimate, 0);
    store.addSkillToTrack('camille', skill, 10);
    const laterId = store.tracks[0]!.actions[1]!.instanceId!;
    store.addSkillToTrack('camille', skill, 6);
    const pursuitId = store.tracks[0]!.actions[1]!.instanceId!;
    const laterStart = () =>
      store.tracks[0]!.actions.find(a => a.instanceId === laterId)!.startTime;
    expect(laterStart()).toBe(10.5);
    store.setMultiSelection([pursuitId]);
    store.removeCurrentSelection();
    expect(laterStart()).toBe(10);
    // The remaining skill now becomes the pursuit; derived timing must be rebuilt.
    expect(store.compiledTimeline!.actionMap.get(laterId)?.freezeDuration).toBe(0.5);
    store.undo();
    expect(laterStart()).toBe(10.5);
    expect(store.compiledTimeline!.actionMap.get(laterId)?.freezeDuration).toBeUndefined();
    store.redo();
    expect(laterStart()).toBe(10);
  });

  it('shares Camille conditional stop-shifting between editor and compiler', async () => {
    const store = useTimelineStore();
    await store.fetchGameData();
    store.changeTrackOperator(0, null, 'camille');
    store.selectTrack(0);
    const ultimate = store.activeSkillLibrary.find((s: any) => s.type === 'ultimate') as any;
    const skill = store.activeSkillLibrary.find((s: any) => s.type === 'battleSkill') as any;
    store.addSkillToTrack('camille', ultimate, 0);
    store.addSkillToTrack('camille', skill, 6);
    store.tracks[1]!.actions = [
      {
        id: 'spectator',
        instanceId: 'spectator',
        type: 'battleSkill',
        startTime: 6.2,
        logicalStartTime: 6.2,
        duration: 1,
        hits: [],
      },
    ];
    store.refreshAllActionShifts();
    expect(store.tracks[1]!.actions[0]!.startTime).toBe(6.5);
    expect(store.compiledTimeline!.actionMap.get('spectator')?.realStartTime).toBe(6.5);
    const pursuitId = store.tracks[0]!.actions[1]!.instanceId!;
    store.updateAction(pursuitId, { startTime: 22 });
    store.refreshAllActionShifts();
    expect(store.tracks[1]!.actions[0]!.startTime).toBe(6.2);
    expect(store.compiledTimeline!.actionMap.get(pursuitId)?.freezeDuration).toBeUndefined();
  });

  it('resolves conditional timing only once when deleting multiple Camille actions', async () => {
    const store = useTimelineStore();
    await store.fetchGameData();
    store.changeTrackOperator(0, null, 'camille');
    store.selectTrack(0);
    const ultimate = store.activeSkillLibrary.find((s: any) => s.type === 'ultimate') as any;
    const skill = store.activeSkillLibrary.find((s: any) => s.type === 'battleSkill') as any;
    store.addSkillToTrack('camille', ultimate, 0);
    store.addSkillToTrack('camille', skill, 6);
    store.addSkillToTrack('camille', skill, 10);
    store.setMultiSelection(store.tracks[0]!.actions.slice(1).map(a => a.instanceId!));
    // Observe the real timing function; do not replace its computation.
    const timingCalls = vi.spyOn(timelineCompiler, 'calculateTimelineShifts');
    try {
      expect(store.removeCurrentSelection().total).toBe(2);
      expect(timingCalls).toHaveBeenCalledTimes(1);
      expect(store.tracks[0]!.actions).toHaveLength(1);
    } finally {
      timingCalls.mockRestore();
    }
  });

  function createActionsWithStaleGrouping() {
    return [6, 8].map((startTime, index) => ({
      id: `independent-skill-${index}`,
      instanceId: `independent-action-${index}`,
      type: 'battleSkill',
      startTime,
      logicalStartTime: startTime,
      duration: 1,
      hits: [],
      comboGroupId: 'obsolete-group',
      comboSegmentIndex: index + 1,
      comboSegmentTotal: 2,
      comboLinked: true,
      comboFollowupDelay: index === 0 ? 1 : 0,
    }));
  }

  it.each([{ duration: 2 }, { startTime: 7 }])(
    'edits only the requested action despite stale grouping metadata: %j',
    patch => {
      const store = useTimelineStore();
      store.tracks[0]!.id = 'independent-actions';
      store.tracks[0]!.actions = createActionsWithStaleGrouping();
      store.commitState();

      store.updateAction('independent-action-0', patch);

      expect(store.tracks[0]!.actions[0]).toMatchObject(patch);
      expect(store.tracks[0]!.actions[1]).toMatchObject({
        startTime: 8,
        logicalStartTime: 8,
        duration: 1,
      });

      store.undo();
      expect(store.tracks[0]!.actions[0]).toMatchObject({ startTime: 6, duration: 1 });
      store.redo();
      expect(store.tracks[0]!.actions[0]).toMatchObject(patch);
      expect(store.tracks[0]!.actions[1]).toMatchObject({ startTime: 8, duration: 1 });
    },
  );

  it('deletes only selected actions despite stale grouping metadata, including after undo', () => {
    const store = useTimelineStore();
    store.tracks[0]!.id = 'independent-actions';
    store.tracks[0]!.actions = createActionsWithStaleGrouping();
    store.commitState();
    store.setMultiSelection(['independent-action-0']);

    expect(store.removeCurrentSelection().total).toBe(1);
    expect(store.tracks[0]!.actions.map(action => action.instanceId)).toEqual([
      'independent-action-1',
    ]);

    store.undo();
    expect(store.tracks[0]!.actions).toHaveLength(2);
    store.redo();
    expect(store.tracks[0]!.actions.map(action => action.instanceId)).toEqual([
      'independent-action-1',
    ]);
  });

  it('keeps current segment gaps in aggregate hits, placement, and frame serialization', () => {
    const store = useTimelineStore();
    store.tracks[0]!.id = 'segment-timing';
    const resolved = buildResolvedSegmentPayload('timing-skill', {
      segments: [
        { duration: 1, gap: 0.5, damageGroups: [{ hits: [{ offset: 0.25 }] }] },
        { duration: 2, damageGroups: [{ hits: [{ offset: 0.25 }] }] },
      ],
    });
    expect(resolved.totalDuration).toBe(3.5);
    expect(resolved.aggregatePayload.hits.map(hit => hit.offset)).toEqual([0.25, 1.75]);

    store.addSkillToTrack(
      'segment-timing',
      {
        id: 'timing-skill',
        type: 'battleSkill',
        segments: resolved.segmentPayloads.map(segment => ({
          id: segment.id,
          duration: segment.duration,
          followupDelay: segment.followupDelay,
          hits: segment.payload.hits,
        })),
      },
      6,
    );
    expect(store.tracks[0]!.actions.map(action => action.startTime)).toEqual([6, 7.5]);

    const serialized = serializeProjectData({ tracks: store.tracks }) as any;
    expect(serialized.tracks[0].actions[0].followupDelay).toBe(30);
    const restored = deserializeProjectData(serialized) as any;
    expect(restored.tracks[0].actions.map((action: any) => action.startTime)).toEqual([6, 7.5]);
    expect(restored.tracks[0].actions[0].followupDelay).toBe(0.5);
  });

  it('creates and reconnects ordinary action links with their selected ports', () => {
    const store = useTimelineStore();
    store.tracks[0]!.id = 'connection-track';
    store.tracks[0]!.actions = [1, 3, 5].map((startTime, index) => ({
      instanceId: `connection-action-${index}`,
      type: 'battleSkill',
      startTime,
      duration: 1,
      hits: [],
    }));
    const drag = useDragConnection();
    drag.newConnectionFrom({ x: 0, y: 0 }, 'connection-action-0', 'bottom');
    drag.endDrag('connection-action-1', 'top');

    expect(store.connections).toHaveLength(1);
    expect(store.connections[0]).toMatchObject({
      from: 'connection-action-0',
      to: 'connection-action-1',
      sourcePort: 'bottom',
      targetPort: 'top',
    });

    drag.moveConnectionEnd(store.connections[0]!.id, { x: 0, y: 0 });
    drag.endDrag('connection-action-2', 'left');

    expect(store.connections).toHaveLength(1);
    expect(store.connections[0]).toMatchObject({
      from: 'connection-action-0',
      to: 'connection-action-2',
      sourcePort: 'bottom',
      targetPort: 'left',
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
    expect(insertedAction._sheetDurationBaseline).toBe(firstSegment.duration);
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
    const action = store.tracks[0]!.actions.find((item: any) => item.id === battleSkill.id) as any;
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
    expect(reloaded._sheetDurationBaseline).toBe(sheetDuration);
  });

  it('preserves a zero user-edited action duration after reload', async () => {
    const store = useTimelineStore();
    await store.fetchGameData();

    store.changeTrackOperator(0, null, 'zhuang-fangyi');
    store.selectTrack(0);

    const battleSkill = store.activeSkillLibrary.find(
      (skill: any) => skill.type === 'battleSkill' && !skill.hiddenInLibraryGrid,
    ) as any;
    store.addSkillToTrack('zhuang-fangyi', battleSkill, 1);
    const action = store.tracks[0]!.actions.find((item: any) => item.id === battleSkill.id) as any;
    const sheetDuration = action._sheetDurationBaseline;

    store.updateAction(action.instanceId, { duration: 0 });
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
    expect(reloaded.duration).toBe(0);
    expect(reloaded._sheetDurationBaseline).toBe(sheetDuration);
  });

  it('updates an untouched action duration when its sheet baseline changes', async () => {
    const store = useTimelineStore();
    await store.fetchGameData();

    store.changeTrackOperator(0, null, 'zhuang-fangyi');
    store.selectTrack(0);

    const battleSkill = store.activeSkillLibrary.find(
      (skill: any) => skill.type === 'battleSkill' && !skill.hiddenInLibraryGrid,
    ) as any;
    store.addSkillToTrack('zhuang-fangyi', battleSkill, 1);
    const action = store.tracks[0]!.actions.find((item: any) => item.id === battleSkill.id) as any;
    const currentSheetDuration = action._sheetDurationBaseline;
    const oldSheetDuration = currentSheetDuration + 1;
    action.duration = oldSheetDuration;
    action._sheetDurationBaseline = oldSheetDuration;
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
    expect(reloaded.duration).toBe(currentSheetDuration);
    expect(reloaded._sheetDurationBaseline).toBe(currentSheetDuration);
  });

  it('preserves a legacy action duration while establishing its first sheet baseline', async () => {
    const store = useTimelineStore();
    await store.fetchGameData();

    store.changeTrackOperator(0, null, 'zhuang-fangyi');
    store.selectTrack(0);

    const battleSkill = store.activeSkillLibrary.find(
      (skill: any) => skill.type === 'battleSkill' && !skill.hiddenInLibraryGrid,
    ) as any;
    store.addSkillToTrack('zhuang-fangyi', battleSkill, 1);
    const action = store.tracks[0]!.actions.find((item: any) => item.id === battleSkill.id) as any;
    const sheetDuration = action._sheetDurationBaseline;
    const legacyDuration = sheetDuration + 2;
    action.duration = legacyDuration;
    delete action._sheetDurationBaseline;
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
    expect(reloaded.duration).toBe(legacyDuration);
    expect(reloaded._sheetDurationBaseline).toBe(sheetDuration);
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

  it('keeps Arcane second-ultimate cooldown bypass after reload', async () => {
    const store = useTimelineStore();
    await store.fetchGameData();

    store.changeTrackOperator(0, null, 'arcane');
    store.selectTrack(0);

    const ultimate = store.activeSkillLibrary.find(
      (skill: any) => skill.skillKey === 'ultimate' && !skill.hiddenInLibraryGrid,
    ) as any;
    const cooldownRequisite = ultimate.requisites.find(
      (item: any) => item.id === 'ultimate-cooldown-ready',
    );
    expect(cooldownRequisite?.condition).toEqual({
      kind: 'or',
      conditions: [
        { kind: 'ultimateCooldownReady' },
        { kind: 'operatorStatus', status: 'arcane-gloompurge-arcana-ready' },
      ],
    });

    store.addSkillToTrack('arcane', ultimate, 1);
    const action = store.tracks[0]!.actions.find((item: any) => item.id === ultimate.id) as any;
    const insertedRequisites = JSON.parse(JSON.stringify(action.requisites));

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
    expect(reloaded.requisites).toEqual(insertedRequisites);
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

  it('stores snap precision per scenario and defaults new scenarios to one frame', () => {
    const store = useTimelineStore();
    const firstScenarioId = store.activeScenarioId;
    const canUndoBefore = store.canUndo;

    expect(store.snapStep).toBeCloseTo(1 / 60);
    store.toggleSnapStep();
    expect(store.snapStep).toBeCloseTo(0.1);
    expect(store.scenarioList[0]?.editorPrefs?.snapStep).toBeCloseTo(0.1);
    expect(store.canUndo).toBe(canUndoBefore);

    store.addScenario();
    expect(store.snapStep).toBeCloseTo(1 / 60);

    store.switchScenario(firstScenarioId);
    expect(store.snapStep).toBeCloseTo(0.1);

    store.duplicateScenario(firstScenarioId);
    expect(store.snapStep).toBeCloseTo(0.1);
  });

  it('resets only the active scenario', () => {
    const store = useTimelineStore();
    const firstScenarioId = store.activeScenarioId;
    store.tracks[0]!.id = 'zhuang-fangyi';
    store.tracks[0]!.actions = [
      { id: 'first-skill', instanceId: 'first-action', startTime: 1 } as any,
    ];
    store.commitState();

    store.addScenario();
    store.tracks[0]!.id = 'alesh';
    store.tracks[0]!.actions = [
      { id: 'second-skill', instanceId: 'second-action', startTime: 2 } as any,
    ];
    store.resetCurrentScenario();

    expect(store.scenarioList).toHaveLength(2);
    expect(store.tracks.every(track => track.id === null && track.actions.length === 0)).toBe(true);

    store.switchScenario(firstScenarioId);
    expect(store.tracks[0]!.id).toBe('zhuang-fangyi');
    expect(store.tracks[0]!.actions.map(action => action.instanceId)).toEqual(['first-action']);
  });

  it('can reset the active scenario while preserving its operator loadout', async () => {
    const store = useTimelineStore();
    const operatorStore = useOperatorStore();
    const weaponStore = useWeaponStore();
    const gearStore = useGearStore();
    await store.fetchGameData();

    store.changeTrackOperator(0, null, 'zhuang-fangyi');
    store.updateTrackWeapon('zhuang-fangyi', 'forgeborn-scathe');
    store.updateTrackEquipment('zhuang-fangyi', 'armor', 'xiranflow-light-armor');

    const trackBefore = store.tracks[0]!;
    const operatorInstanceId = trackBefore.operatorInstanceId;
    const weaponInstanceId = trackBefore.weaponInstanceId;
    const armorInstanceId = trackBefore.equipArmorInstanceId;
    trackBefore.actions = [
      { id: 'placed-skill', instanceId: 'placed-action', startTime: 6 } as any,
    ];
    store.connections.push({ id: 'placed-connection' } as any);
    store.setBattleDuration(240);
    store.resetCurrentScenario({ preserveLoadout: true });

    const resetTrack = store.tracks[0]!;
    expect(resetTrack.id).toBe('zhuang-fangyi');
    expect(resetTrack.operatorInstanceId).toBe(operatorInstanceId);
    expect(resetTrack.weaponId).toBe('forgeborn-scathe');
    expect(resetTrack.weaponInstanceId).toBe(weaponInstanceId);
    expect(resetTrack.equipArmorId).toBe('xiranflow-light-armor');
    expect(resetTrack.equipArmorInstanceId).toBe(armorInstanceId);
    expect(resetTrack.actions).toHaveLength(0);
    expect(store.connections).toHaveLength(0);
    expect(store.battleDuration).toBe(120);
    expect(operatorStore.operators.map(item => item.id)).toContain(operatorInstanceId);
    expect(weaponStore.weapons.map(item => item.id)).toContain(weaponInstanceId);
    expect(gearStore.gears.map(item => item.id)).toContain(armorInstanceId);
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
