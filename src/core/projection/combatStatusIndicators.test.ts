import { describe, expect, it } from 'vitest';
import { mergeOverlappingBuffTimelineSegments, type BuffTimelineSegment } from './buffTimelineViz';
import { combatStatusIconStyle, projectCombatStatusIndicators } from './combatStatusIndicators';

const segment: BuffTimelineSegment = {
  targetId: 'operator:1',
  buffId: 'buff:progress',
  instanceId: 7,
  startFrame: 10,
  endFrame: 40,
  layers: 3,
  enhanceCount: 3,
  enabled: true,
  hasFiniteLifetime: true,
  placement: 'upper',
  iconPath: '/icons/progress.webp',
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
};

describe('projectCombatStatusIndicators', () => {
  it('按原生显示标志生成多个 HUD 去向，不按 Buff ID 猜测', () => {
    expect(projectCombatStatusIndicators([segment], 20)).toEqual([
      {
        targetId: 'operator:1',
        buffId: 'buff:progress',
        instanceId: 7,
        layers: 3,
        enhanceCount: 3,
        enabled: true,
        windows: [segment],
        startFrame: 10,
        endFrame: 40,
        slots: ['mainCharacterHpBarCommon', 'normalSkillProgress'],
        onlyForControlledOperator: true,
        hasFiniteLifetime: true,
        iconPath: '/icons/progress.webp',
        iconStyle: 'LifeTime',
        abnormalColorType: 'Fire',
        showWarningBackground: true,
        useWeakNormalSkillProgress: true,
        order: {
          useDirectoryValue: false,
          value: 12,
          category: 'CommonCharBuff',
        },
      },
    ]);
  });

  it('按原生四类节点条件分流队伍与主控状态栏', () => {
    const common = { ...segment, instanceId: 8, onlyShowForMainCharacter: false };
    const [indicator] = projectCombatStatusIndicators([common], 20);
    expect(indicator?.slots).toEqual([
      'squadIcon',
      'mainCharacterHpBarCommon',
      'normalSkillProgress',
    ]);
  });

  it('按原生优先级降序、实例 UID 升序排列', () => {
    const indicators = projectCombatStatusIndicators(
      [
        { ...segment, buffId: 'low-priority', instanceId: 20, orderPriorityValue: 2 },
        { ...segment, buffId: 'high-priority-second', instanceId: 30, orderPriorityValue: 8 },
        { ...segment, buffId: 'high-priority-first', instanceId: 10, orderPriorityValue: 8 },
      ],
      20,
    );
    expect(indicators.map(indicator => indicator.instanceId)).toEqual([10, 30, 20]);
  });

  it('HUD 与时间轴共用生效聚合，禁用候选只在详情窗口保留', () => {
    const segments: BuffTimelineSegment[] = [
      {
        ...segment,
        instanceId: 1,
        enabled: false,
        layers: 20,
        enhanceCount: 20,
        simpleModifierAttribute: 'attack',
        simpleModifierSlot: 'finalMultiplier',
        simpleModifierValue: 99,
      },
      { ...segment, instanceId: 2, layers: 2, enhanceCount: 2, stackingType: 'highPriority' },
      {
        ...segment,
        instanceId: 3,
        startFrame: 20,
        layers: 4,
        enhanceCount: 1,
        displayCount: 4,
        stackingType: 'highPriority',
      },
    ];
    const timeline = mergeOverlappingBuffTimelineSegments(segments);
    for (const frame of [10, 19, 20, 39]) {
      const phase = timeline.find(value => value.startFrame <= frame && frame < value.endFrame)!;
      const hud = projectCombatStatusIndicators(segments, frame);
      expect(hud).toHaveLength(1);
      expect(hud[0]).toMatchObject({
        layers: phase.layers,
        enhanceCount: phase.enhanceCount,
        startFrame: phase.startFrame,
        endFrame: phase.endFrame,
        windows: phase.windows,
      });
      expect(hud[0]!.simpleModifierValue).toBeUndefined();
    }
    expect(projectCombatStatusIndicators(segments, 20)[0]!.layers).toBe(6);
    expect(projectCombatStatusIndicators(segments.slice(0, 1), 20)).toEqual([]);
    expect(projectCombatStatusIndicators(segments, 40)).toEqual([]);
  });

  it('按节点复刻原生图标样式选择与 Default 生命周期回退', () => {
    const [indicator] = projectCombatStatusIndicators(
      [{ ...segment, onlyShowForMainCharacter: false, iconStyleInSquad: 'Default' }],
      20,
    );
    expect(indicator).toBeDefined();
    expect(combatStatusIconStyle(indicator!, 'headBarAttached')).toBe('Attached');
    expect(combatStatusIconStyle(indicator!, 'headBarCommon')).toBe('LifeTime');
    expect(combatStatusIconStyle(indicator!, 'squadIcon')).toBe('LifeTime');
    expect(combatStatusIconStyle({ ...indicator!, hasFiniteLifetime: false }, 'squadIcon')).toBe(
      'NoLifeTime',
    );
  });

  it('只返回光标帧内且具有原生 HUD 去向的状态', () => {
    expect(projectCombatStatusIndicators([segment], 9)).toEqual([]);
    expect(projectCombatStatusIndicators([segment], 40)).toEqual([]);
    expect(
      projectCombatStatusIndicators(
        [{ ...segment, showInSquadIcon: false, showProgressInNormalSkillButton: false }],
        20,
      ),
    ).toEqual([]);
  });
});
