import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import {
  findBuffTimelineSegmentForDamage,
  layoutBuffTimelineSegments,
  mergeOverlappingBuffTimelineSegments,
  projectBuffTimelineViz,
  projectBuffIconTimelineMetadata,
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
      enabled: true,
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

function changed(
  sequence: number,
  frame: number,
  instanceId: number,
  event: string,
  data: NonNullable<CombatReceiptEntry['data']>,
): CombatReceiptEntry {
  return {
    sequence,
    frame,
    time: frame / 30,
    event,
    targetId: 'enemy',
    data: { buffId: 'buff:test', instanceId, ...data },
  };
}

describe('projectBuffTimelineViz', () => {
  it('内部 Buff 不画轴上状态，但保留伤害归属所需的图标身份', () => {
    const entry = applied(0, 0, 'operator:1', 1, 1);
    const hidden = { ...entry, data: { ...entry.data, showInSquadIcon: false } };
    expect(projectBuffTimelineViz([hidden], 30)).toEqual([]);
    expect(projectBuffIconTimelineMetadata([hidden], 30)).toHaveLength(1);
    expect(
      projectBuffTimelineViz(
        [{ ...hidden, data: { ...hidden.data, showInHeadBarCommon: true } }],
        30,
      ),
    ).toHaveLength(1);
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
        showInSquadIcon: true,
        targetId: 'operator:1',
        buffId: 'buff:test',
        instanceId: 4,
        startFrame: 10,
        startSequence: 0,
        endFrame: 20,
        endSequence: 1,
        layers: 1,
        enhanceCount: 1,
        enabled: true,
        startReason: 'applied',
        endReason: 'reapplied',
        placement: 'upper',
        iconPath: '/icons/icon_battle_buff_atk_up.webp',
      },
      {
        sourceId: 'source',
        sourceActionId: 'skill:test',
        showInSquadIcon: true,
        targetId: 'operator:1',
        buffId: 'buff:test',
        instanceId: 4,
        startFrame: 20,
        startSequence: 1,
        endFrame: 50,
        endSequence: 2,
        layers: 2,
        enhanceCount: 2,
        enabled: true,
        startReason: 'reapplied',
        endReason: 'lifetime',
        placement: 'upper',
        iconPath: '/icons/icon_battle_buff_atk_up.webp',
      },
    ]);
  });

  it('hides definitions explicitly excluded from presentation', () => {
    expect(projectBuffTimelineViz([applied(0, 10, 'enemy', 1, 1, false)], 90)).toEqual([]);
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
          enabled: true,
          iconPath: '/icons/child.webp',
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
        endSequence: 1,
        layers: 1,
        enhanceCount: 1,
        enabled: true,
        startReason: 'presentationStarted',
        endReason: 'lifetime',
        parentBuffId: 'buff:test',
        placement: 'upper',
        iconPath: '/icons/child.webp',
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

  it('真实子 Buff 只跟随已记录的数值来源实例，不因同帧同值而更新兄弟或无来源图标', () => {
    const parent = (sequence: number, instanceId: number) => {
      const entry = applied(sequence, 5, 'operator', instanceId, 1, false, 'passive');
      return {
        ...entry,
        data: {
          ...entry.data,
          simpleModifierAttribute: 'electricEnhancedDamageIncrease',
          simpleModifierSlot: 'baseAddition',
          simpleModifierValue: 0.18,
        },
      };
    };
    const child = (sequence: number, instanceId: number, parentId?: number): CombatReceiptEntry => {
      const entry = applied(sequence, 5, 'operator', instanceId, 1, true, 'passive');
      return {
        ...entry,
        ...(parentId === undefined
          ? {}
          : { producedBy: { kind: 'buff', ownerId: 'operator', instanceId: parentId } }),
        data: { ...entry.data, buffId: `icon:${instanceId}` },
      };
    };
    // 原生 Start 先创建子图标，之后才记录父 Buff 的 Applied，不能依赖记录顺序相反。
    const receipts: CombatReceiptEntry[] = [
      child(0, 2, 1),
      parent(1, 1),
      child(2, 4, 3),
      parent(3, 3),
      child(4, 5),
      {
        sequence: 5,
        frame: 10,
        time: 10 / 30,
        event: 'BuffModifierChanged',
        targetId: 'operator',
        data: {
          buffId: 'buff:test',
          instanceId: 1,
          simpleModifierAttribute: 'electricEnhancedDamageIncrease',
          simpleModifierSlot: 'baseAddition',
          simpleModifierValue: 0.2,
        },
      },
    ];
    const segments = projectBuffTimelineViz(receipts, 30);
    expect(
      segments
        .filter(segment => segment.buffId === 'icon:2')
        .map(segment => [segment.startFrame, segment.endFrame, segment.simpleModifierValue]),
    ).toEqual([
      [5, 10, 0.18],
      [10, 30, 0.2],
    ]);
    for (const buffId of ['icon:4', 'icon:5'])
      expect(
        segments
          .filter(segment => segment.buffId === buffId)
          .map(segment => [segment.startFrame, segment.endFrame, segment.simpleModifierValue]),
      ).toEqual([[5, 30, 0.18]]);
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

  it.each(['highPriority', 'highPriorityWithMaxStack'])(
    '%s 只累计启用候选，并在赢家结束后恢复原实例与其数值摘要',
    stackingType => {
      const apply = (sequence: number, frame: number, instanceId: number, value: number) => {
        const entry = applied(sequence, frame, 'enemy', instanceId, 1);
        return {
          ...entry,
          data: {
            ...entry.data,
            stackingType,
            simpleModifierAttribute: 'attack',
            simpleModifierSlot: 'baseAddition',
            simpleModifierValue: value,
          },
        };
      };
      const segments = projectBuffTimelineViz(
        [
          apply(0, 0, 1, 0.1),
          changed(1, 5, 1, 'BuffEnabledChanged', { enabled: false }),
          apply(2, 5, 2, 0.2),
          finished(3, 10, 'enemy', 2),
          changed(4, 10, 1, 'BuffEnabledChanged', { enabled: true }),
          finished(5, 15, 'enemy', 1),
        ],
        20,
      );
      const merged = mergeOverlappingBuffTimelineSegments(segments);
      expect(
        merged.map(segment => [
          segment.startFrame,
          segment.endFrame,
          segment.layers,
          segment.simpleModifierValue,
          segment.members.map(member => member.instanceId),
        ]),
      ).toEqual([
        [0, 5, 1, 0.1, [1]],
        [5, 10, 1, 0.2, [2]],
        [10, 15, 1, 0.1, [1]],
      ]);
      expect(merged[1]!.instanceId).toBe(2);
      expect(merged[1]!.windows).toContainEqual(
        expect.objectContaining({
          instanceId: 1,
          enabled: false,
          enhanceCount: 1,
          layers: 1,
          startFrame: 5,
          endFrame: 10,
        }),
      );
    },
  );

  it('同 ID 的不同互斥组各自可生效，不凭 highPriority 类型限制总层数或选禁用摘要', () => {
    const entries = [
      applied(0, 0, 'enemy', 1, 2),
      applied(1, 0, 'enemy', 2, 3),
      applied(2, 0, 'enemy', 3, 8),
    ].map((entry, index) => ({
      ...entry,
      data: {
        ...entry.data,
        enabled: index !== 2,
        stackingType: 'highPriority',
        simpleModifierAttribute: 'attack',
        simpleModifierSlot: 'finalMultiplier',
        simpleModifierValue: index === 2 ? 99 : 0.2,
      },
    }));
    const merged = mergeOverlappingBuffTimelineSegments(projectBuffTimelineViz(entries, 20));
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      layers: 5,
      enhanceCount: 5,
      enabled: true,
      instanceId: 2,
      simpleModifierValue: 0.2,
    });
    expect(merged[0]!.members.map(member => member.instanceId)).toEqual([1, 2]);
    expect(merged[0]!.windows).toHaveLength(3);
    const ambiguous = mergeOverlappingBuffTimelineSegments(
      projectBuffTimelineViz(
        entries.map((entry, index) =>
          index === 1 ? { ...entry, data: { ...entry.data, simpleModifierValue: 0.3 } } : entry,
        ),
        20,
      ),
    );
    expect(ambiguous[0]!.simpleModifierAttribute).toBeUndefined();
    expect(ambiguous[0]!.simpleModifierSlot).toBeUndefined();
    expect(ambiguous[0]!.simpleModifierValue).toBeUndefined();
  });

  it('初始禁用不画图标，启用同帧的叠层和改值保留历史而只画最终状态', () => {
    const initial = applied(1, 0, 'enemy', 1, 3);
    const entries = [
      changed(0, 0, 1, 'BuffEnabledChanged', { enabled: false }),
      { ...initial, data: { ...initial.data, enabled: false } },
      changed(2, 3, 1, 'BuffEnabledChanged', { enabled: true }),
      changed(3, 3, 1, 'BuffStackChanged', { layers: 2 }),
      changed(4, 3, 1, 'BuffModifierChanged', {
        simpleModifierAttribute: 'attack',
        simpleModifierSlot: 'baseAddition',
        simpleModifierValue: 0.15,
      }),
      changed(5, 7, 1, 'BuffStackChanged', { layers: 1 }),
      changed(6, 9, 1, 'BuffEnabledChanged', { enabled: false }),
    ];
    expect(
      mergeOverlappingBuffTimelineSegments(projectBuffTimelineViz(entries.slice(0, 2), 10)),
    ).toEqual([]);
    const raw = projectBuffTimelineViz(entries, 10);
    const merged = mergeOverlappingBuffTimelineSegments(raw);
    expect(merged.map(segment => [segment.startFrame, segment.endFrame, segment.layers])).toEqual([
      [3, 7, 2],
      [7, 9, 1],
    ]);
    expect(
      raw.map(segment => [
        segment.startFrame,
        segment.endFrame,
        segment.enhanceCount,
        segment.enabled,
      ]),
    ).toEqual([
      [0, 3, 3, false],
      [3, 3, 3, true],
      [3, 3, 2, true],
      [3, 7, 2, true],
      [7, 9, 1, true],
      [9, 10, 1, false],
    ]);
    expect(merged[0]!.windows.map(segment => segment.startSequence)).toEqual([4, 1, 2, 3, 6]);
    expect(merged[0]!.simpleModifierValue).toBe(0.15);
    expect(merged[1]!.startReason).toBe('stackChanged');
    expect(merged[1]!.endReason).toBe('enabledChanged');
  });

  it('虚拟子图标跟随父实例启用与增强次数，明确显示等级不被增强次数覆盖', () => {
    const parent = applied(0, 0, 'enemy', 1, 2);
    const entries: CombatReceiptEntry[] = [
      { ...parent, data: { ...parent.data, displayCount: 4 } },
      {
        ...parent,
        sequence: 1,
        event: 'BuffPresentationStarted',
        data: {
          ...parent.data,
          buffId: 'child',
          parentBuffId: 'buff:test',
          displayCount: 4,
        },
      },
      changed(2, 3, 1, 'BuffStackChanged', { layers: 3 }),
      changed(3, 5, 1, 'BuffEnabledChanged', { enabled: false }),
      changed(4, 6, 1, 'BuffStackChanged', { layers: 1 }),
      changed(5, 8, 1, 'BuffEnabledChanged', { enabled: true }),
    ];
    const raw = projectBuffTimelineViz(entries, 10);
    for (const buffId of ['buff:test', 'child']) {
      const values = raw.filter(segment => segment.buffId === buffId);
      expect(
        values.map(segment => [
          segment.startFrame,
          segment.endFrame,
          segment.enhanceCount,
          segment.displayCount,
          segment.layers,
          segment.enabled,
        ]),
      ).toEqual([
        [0, 3, 2, 4, 4, true],
        [3, 5, 3, 4, 4, true],
        [5, 6, 3, 4, 4, false],
        [6, 8, 1, 4, 4, false],
        [8, 10, 1, 4, 4, true],
      ]);
      expect(mergeOverlappingBuffTimelineSegments(values).map(segment => segment.layers)).toEqual([
        4, 4, 4,
      ]);
    }
  });

  it('伤害按同帧回执顺序归属，不选择稍后叠层后的原始或合并状态', () => {
    const entries = [
      applied(0, 0, 'enemy', 1, 4),
      changed(2, 5, 1, 'BuffStackChanged', { layers: 3 }),
      changed(5, 10, 1, 'BuffStackChanged', { layers: 2 }),
    ];
    const raw = projectBuffTimelineViz(entries, 20);
    const damage = (sequence: number, frame: number): CombatReceiptEntry => ({
      sequence,
      frame,
      time: frame / 30,
      event: 'DamageApplied',
      targetId: 'enemy',
      data: { buffId: 'buff:test', buffOwnerId: 'enemy', buffInstanceId: 1 },
    });
    for (const segments of [raw, mergeOverlappingBuffTimelineSegments(raw)]) {
      expect(findBuffTimelineSegmentForDamage(damage(1, 5), segments)?.layers).toBe(4);
      expect(findBuffTimelineSegmentForDamage(damage(3, 5), segments)?.layers).toBe(3);
      expect(findBuffTimelineSegmentForDamage(damage(4, 10), segments)?.layers).toBe(3);
      expect(findBuffTimelineSegmentForDamage(damage(6, 10), segments)?.layers).toBe(2);
    }
  });

  it('首次 Start 伤害先于同帧 Applied 时仍找到图标，不把后续变化作为初始回退', () => {
    const raw = projectBuffTimelineViz(
      [applied(2, 5, 'enemy', 1, 4), changed(3, 10, 1, 'BuffStackChanged', { layers: 3 })],
      20,
    );
    const initialDamage: CombatReceiptEntry = {
      sequence: 1,
      frame: 5,
      time: 5 / 30,
      event: 'DamageApplied',
      targetId: 'enemy',
      data: { buffId: 'buff:test', buffOwnerId: 'enemy', buffInstanceId: 1 },
    };
    for (const segments of [raw, mergeOverlappingBuffTimelineSegments(raw)])
      expect(findBuffTimelineSegmentForDamage(initialDamage, segments)?.layers).toBe(4);
  });

  it('同帧初始窗口被增强切段覆盖后，Start 伤害仍链接现有 Buff 行', () => {
    const raw = projectBuffTimelineViz(
      [applied(2, 5, 'enemy', 1, 1), changed(3, 5, 1, 'BuffStackChanged', { layers: 2 })],
      20,
    );
    const hit: CombatReceiptEntry = {
      sequence: 1,
      frame: 5,
      time: 5 / 30,
      event: 'DamageApplied',
      targetId: 'enemy',
      data: { buffId: 'buff:test', buffOwnerId: 'enemy', buffInstanceId: 1 },
    };
    // 命中事实仍从原始窗口读取；合并段只负责定位行，不能把同一伤害另起一行。
    expect(findBuffTimelineSegmentForDamage(hit, raw)?.enhanceCount).toBe(1);
    const merged = mergeOverlappingBuffTimelineSegments(raw);
    expect(merged).toHaveLength(1);
    expect(findBuffTimelineSegmentForDamage(hit, merged)).toBe(merged[0]);
    expect(merged[0]!.windows.some(window => window.startReason === 'applied')).toBe(true);
  });

  it('合并段只在命中帧内查找，并用启停边沿序号区分候选移除前后的状态', () => {
    const raw = projectBuffTimelineViz(
      [
        applied(0, 0, 'enemy', 1, 2),
        applied(2, 5, 'enemy', 2, 1),
        changed(4, 10, 2, 'BuffEnabledChanged', { enabled: false }),
      ],
      20,
    );
    const merged = mergeOverlappingBuffTimelineSegments(raw);
    const damage = (sequence: number, frame: number, instanceId = 1): CombatReceiptEntry => ({
      sequence,
      frame,
      time: frame / 30,
      event: 'DamageApplied',
      targetId: 'enemy',
      data: { buffId: 'buff:test', buffOwnerId: 'enemy', buffInstanceId: instanceId },
    });
    expect(findBuffTimelineSegmentForDamage(damage(1, 3), merged)?.startFrame).toBe(0);
    expect(findBuffTimelineSegmentForDamage(damage(1, 5), merged)?.layers).toBe(2);
    expect(findBuffTimelineSegmentForDamage(damage(3, 5), merged)?.layers).toBe(3);
    expect(findBuffTimelineSegmentForDamage(damage(3, 10), merged)?.layers).toBe(3);
    expect(findBuffTimelineSegmentForDamage(damage(5, 10), merged)?.layers).toBe(2);
    // 终结回调的来源可以不在最终阶段成员内，但原始窗口仍提供其图标身份。
    const terminal = findBuffTimelineSegmentForDamage(damage(5, 10, 2), merged);
    expect(terminal?.startFrame).toBe(10);
    expect(terminal?.windows.some(window => window.instanceId === 2)).toBe(true);
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
