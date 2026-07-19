import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTimelineStore } from './timelineStore';
import { setLocale } from '@/i18n';

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
});
