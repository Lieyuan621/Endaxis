import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import {
  layoutBuffTimelineSegments,
  mergeOverlappingBuffTimelineSegments,
  projectBuffTimelineViz,
} from './buffTimelineViz';

function applied(
  sequence: number,
  frame: number,
  targetId: string,
  instanceId: number,
  layers: number,
  visible = true,
  sourceActionId = 'skill:test',
): CombatReceiptEntry {
  return {
    sequence,
    frame,
    time: frame / 30,
    event: 'BuffApplied',
    sourceId: 'source',
    targetId,
    data: {
      buffId: 'buff:test',
      instanceId,
      layers,
      visible,
      showInSquadIcon: true,
      sourceActionId,
      iconPath: '/icons/icon_battle_buff_atk_up.webp',
    },
  };
}

function finished(
  sequence: number,
  frame: number,
  targetId: string,
  instanceId: number,
): CombatReceiptEntry {
  return {
    sequence,
    frame,
    time: frame / 30,
    event: 'BuffFinished',
    targetId,
    data: { buffId: 'buff:test', instanceId, layers: 1, reason: 'lifetime' },
  };
}

describe('projectBuffTimelineViz', () => {
  it('只展示开启原生头顶或队伍图标的 Buff，不能凭图标资源判断', () => {
    const entry = applied(0, 0, 'operator:1', 1, 1);
    const hidden = { ...entry, data: { ...entry.data, showInSquadIcon: false } };
    expect(projectBuffTimelineViz([hidden], 30)).toEqual([]);
    for (const flag of ['showInHeadBarCommon', 'showInHeadBarAttached', 'showInSquadIcon']) {
      expect(
        projectBuffTimelineViz([{ ...hidden, data: { ...hidden.data, [flag]: true } }], 30),
      ).toHaveLength(1);
    }
  });
  it('distinguishes host release from an ordinary Buff finish', () => {
    const end = finished(1, 50, 'entity:test', 1);
    const released = projectBuffTimelineViz(
      [applied(0, 10, 'entity:test', 1, 1), { ...end, event: 'BuffReleased' }],
      90,
    );
    const finishedNormally = projectBuffTimelineViz([applied(0, 10, 'entity:test', 1, 1), end], 90);
    expect(released).toEqual([expect.objectContaining({ endReason: 'released' })]);
    expect(finishedNormally).toEqual([expect.objectContaining({ endReason: 'lifetime' })]);
  });
  it('projects apply, enhance, and finish boundaries by instance identity', () => {
    expect(
      projectBuffTimelineViz(
        [
          applied(0, 10, 'operator:1', 4, 1),
          applied(1, 20, 'operator:1', 4, 2),
          finished(2, 50, 'operator:1', 4),
        ],
        90,
      ),
    ).toEqual([
      {
        sourceId: 'source',
        sourceActionId: 'skill:test',
        targetId: 'operator:1',
        buffId: 'buff:test',
        instanceId: 4,
        startFrame: 10,
        startSequence: 0,
        endFrame: 20,
        layers: 1,
        startReason: 'applied',
        endReason: 'reapplied',
        placement: 'upper',
        iconPath: '/icons/icon_battle_buff_atk_up.webp',
        showInSquadIcon: true,
      },
      {
        sourceId: 'source',
        sourceActionId: 'skill:test',
        targetId: 'operator:1',
        buffId: 'buff:test',
        instanceId: 4,
        startFrame: 20,
        startSequence: 1,
        endFrame: 50,
        layers: 2,
        startReason: 'reapplied',
        endReason: 'lifetime',
        placement: 'upper',
        iconPath: '/icons/icon_battle_buff_atk_up.webp',
        showInSquadIcon: true,
      },
    ]);
  });

  it('hides definitions explicitly excluded from presentation', () => {
    expect(projectBuffTimelineViz([applied(0, 10, 'enemy', 1, 1, false)], 90)).toEqual([]);
  });

  it('保留 HUD 分流、进度和排序证据', () => {
    const entry = applied(0, 10, 'operator:1', 1, 2);
    expect(
      projectBuffTimelineViz(
        [
          {
            ...entry,
            data: {
              ...entry.data,
              showInSquadIcon: true,
              onlyShowForMainCharacter: true,
              showProgressInNormalSkillButton: true,
              useWeakProgressInNormalSkillButton: true,
              showWarningBackground: true,
              iconStyleInSquad: 'LifeTime',
              abnormalColorType: 'Fire',
              orderUseDirectoryValue: false,
              orderPriorityValue: 12,
              orderPriorityCategory: 'CommonCharBuff',
            },
          },
        ],
        90,
      )[0],
    ).toMatchObject({
      showInSquadIcon: true,
      onlyShowForMainCharacter: true,
      showProgressInNormalSkillButton: true,
      useWeakProgressInNormalSkillButton: true,
      showWarningBackground: true,
      iconStyleInSquad: 'LifeTime',
      abnormalColorType: 'Fire',
      orderUseDirectoryValue: false,
      orderPriorityValue: 12,
      orderPriorityCategory: 'CommonCharBuff',
    });
  });

  it('只用能力实体结束事实覆盖图标持续条，不改写 Buff 自身生命周期', () => {
    const entry = applied(0, 10, 'enemy', 1, 1);
    const segments = projectBuffTimelineViz(
      [
        {
          ...entry,
          data: { ...entry.data, iconDurationSourceTargetId: 'ability-entity:7' },
        },
        {
          sequence: 1,
          frame: 40,
          time: 40 / 30,
          event: 'AbilityEntityFinished',
          targetId: 'ability-entity:7',
          data: { abilityEntityId: 'fixture', reason: 'durationExpired' },
        },
        finished(2, 50, 'enemy', 1),
      ],
      90,
    );
    expect(segments).toEqual([
      expect.objectContaining({ startFrame: 10, endFrame: 50, durationEndFrame: 40 }),
    ]);
  });

  it('用具体 TimedMarker 实例的结束边沿覆盖图标持续条', () => {
    const entry = applied(0, 10, 'enemy', 1, 1);
    const segments = projectBuffTimelineViz(
      [
        {
          ...entry,
          data: {
            ...entry.data,
            iconDurationSourceTargetId: 'abilityEntity:7:timed-marker:3',
          },
        },
        {
          sequence: 1,
          frame: 34,
          time: 34 / 30,
          event: 'TimedMarkerFinished',
          targetId: 'abilityEntity:7:timed-marker:3',
          data: { markerId: 'ultimate-window', reason: 'expired' },
        },
        finished(2, 70, 'enemy', 1),
      ],
      90,
    );

    expect(segments).toEqual([
      expect.objectContaining({ startFrame: 10, endFrame: 70, durationEndFrame: 34 }),
    ]);
  });

  it('projects child presentation lifetimes without inventing runtime Buff instances', () => {
    const entries: CombatReceiptEntry[] = [
      {
        ...applied(0, 5, 'operator:1', 2, 1),
        event: 'BuffPresentationStarted',
        data: {
          buffId: 'buff:child-icon',
          parentBuffId: 'buff:test',
          instanceId: 2,
          layers: 1,
          iconPath: '/icons/child.webp',
          showInSquadIcon: true,
        },
      },
      {
        ...finished(1, 35, 'operator:1', 2),
        event: 'BuffPresentationFinished',
        data: {
          buffId: 'buff:child-icon',
          parentBuffId: 'buff:test',
          instanceId: 2,
          layers: 1,
          reason: 'lifetime',
        },
      },
    ];
    expect(projectBuffTimelineViz(entries, 60)).toEqual([
      {
        sourceId: 'source',
        targetId: 'operator:1',
        buffId: 'buff:child-icon',
        instanceId: 2,
        startFrame: 5,
        startSequence: 0,
        endFrame: 35,
        layers: 1,
        startReason: 'presentationStarted',
        endReason: 'lifetime',
        parentBuffId: 'buff:test',
        placement: 'upper',
        iconPath: '/icons/child.webp',
        showInSquadIcon: true,
      },
    ]);
  });

  it('让同帧同来源的纯展示子 Buff 继承唯一单属性摘要', () => {
    const parent = applied(0, 5, 'enemy', 1, 1, false, 'cast:skill');
    const child = applied(1, 5, 'enemy', 2, 1, true, 'cast:skill');
    expect(
      projectBuffTimelineViz(
        [
          {
            ...parent,
            data: {
              ...parent.data,
              simpleModifierAttribute: 'physicalVulnerabilityIncrease',
              simpleModifierSlot: 'baseAddition',
              simpleModifierValue: 0.1,
            },
          },
          { ...child, data: { ...child.data, buffId: 'buff:visual-child' } },
        ],
        30,
      )[0],
    ).toMatchObject({
      buffId: 'buff:visual-child',
      simpleModifierAttribute: 'physicalVulnerabilityIncrease',
      simpleModifierSlot: 'baseAddition',
      simpleModifierValue: 0.1,
    });
  });

  it('uses compact non-overlapping lanes', () => {
    const segments = projectBuffTimelineViz(
      [
        applied(0, 0, 'operator:1', 1, 1),
        applied(1, 10, 'operator:1', 2, 1),
        finished(2, 20, 'operator:1', 1),
        applied(3, 20, 'operator:1', 3, 1),
      ],
      40,
    );
    expect(layoutBuffTimelineSegments(segments).map(segment => segment.lane)).toEqual([0, 1, 0]);
  });

  it('叠加同一目标上持续时间重合的同 ID Buff，并在每次层数变化处分段', () => {
    const segments = projectBuffTimelineViz(
      [
        applied(0, 0, 'operator:1', 1, 1),
        applied(1, 5, 'operator:1', 2, 2),
        finished(2, 10, 'operator:1', 1),
        finished(3, 15, 'operator:1', 2),
      ],
      20,
    );

    expect(
      mergeOverlappingBuffTimelineSegments(segments).map(segment => ({
        start: segment.startFrame,
        end: segment.endFrame,
        layers: segment.layers,
        members: segment.members.map(member => member.instanceId),
        windows: segment.windows.map(window => window.instanceId),
      })),
    ).toEqual([
      { start: 0, end: 5, layers: 1, members: [1], windows: [1, 2] },
      { start: 5, end: 10, layers: 3, members: [1, 2], windows: [1, 2] },
      { start: 10, end: 15, layers: 2, members: [2], windows: [1, 2] },
    ]);
  });

  it('保留有时间间隔或只在边界相接的同 ID Buff 为独立窗口', () => {
    const segments = projectBuffTimelineViz(
      [
        applied(0, 0, 'operator:1', 1, 1),
        finished(1, 10, 'operator:1', 1),
        applied(2, 10, 'operator:1', 2, 2),
        finished(3, 20, 'operator:1', 2),
        applied(4, 25, 'operator:1', 3, 3),
        finished(5, 30, 'operator:1', 3),
      ],
      40,
    );

    expect(
      mergeOverlappingBuffTimelineSegments(segments).map(segment => [
        segment.startFrame,
        segment.endFrame,
        segment.layers,
        segment.members[0]!.instanceId,
      ]),
    ).toEqual([
      [0, 10, 1, 1],
      [10, 20, 2, 2],
      [25, 30, 3, 3],
    ]);
  });

  it('不合并不同目标或不同 ID 的重合 Buff', () => {
    const first = projectBuffTimelineViz(
      [applied(0, 0, 'operator:1', 1, 1), finished(1, 10, 'operator:1', 1)],
      20,
    )[0]!;
    const otherTarget = { ...first, targetId: 'operator:2', instanceId: 2, layers: 2 };
    const otherId = { ...first, buffId: 'buff:other', instanceId: 3, layers: 3 };

    expect(
      mergeOverlappingBuffTimelineSegments([first, otherTarget, otherId]).map(segment => [
        segment.targetId,
        segment.buffId,
        segment.layers,
        segment.members.length,
      ]),
    ).toEqual([
      ['operator:1', 'buff:test', 1, 1],
      ['operator:2', 'buff:test', 2, 1],
      ['operator:1', 'buff:other', 3, 1],
    ]);
  });

  it('层数归零时不生成展示段，并保留未合并 Buff 的原生持续条终点', () => {
    const visible = {
      ...projectBuffTimelineViz(
        [applied(0, 0, 'operator:1', 1, 1), finished(1, 20, 'operator:1', 1)],
        30,
      )[0]!,
      durationEndFrame: 12,
    };
    const zero = { ...visible, instanceId: 2, startFrame: 25, endFrame: 30, layers: 0 };

    expect(mergeOverlappingBuffTimelineSegments([visible, zero])).toEqual([
      { ...visible, members: [visible], windows: [visible] },
    ]);
  });

  it('uses frozen equipment provenance for the legacy lower band', () => {
    const [operatorBuff, eventBuff, weaponInitialization, gearInitialization] =
      projectBuffTimelineViz(
        [
          applied(0, 0, 'operator:1', 1, 1),
          applied(1, 0, 'operator:1', 2, 1, true, 'equipment:gearSet:suit_atk01:onDamage'),
          applied(
            2,
            0,
            'operator:1',
            3,
            1,
            true,
            'upgrade-initialization:weapon-trait:wpn_pistol_0005:skill3',
          ),
          applied(3, 0, 'operator:1', 4, 1, true, 'upgrade-initialization:gear-set:suit_atk01'),
        ],
        30,
      );
    expect(operatorBuff?.placement).toBe('upper');
    expect(eventBuff?.placement).toBe('lower');
    expect(weaponInitialization?.placement).toBe('lower');
    expect(gearInitialization?.placement).toBe('lower');
  });
});
