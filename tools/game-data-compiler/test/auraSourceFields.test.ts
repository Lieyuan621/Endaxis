import { describe, expect, it } from 'vitest';
import { parseGlobalPartyAuraActionSource } from '../src/source/auraActions.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const emptySequence = {
  actionData: [],
  onlyExecuteWhenSourceIsMainChar: false,
  onlyExecuteWhenSourceIsGuard: false,
};
const base = {
  $type: 'Beyond.Gameplay.Core.AuraAction+Data, Gameplay.Beyond',
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 0,
  auraDebugName: 'fixture',
  m_auraTypeWarning: '',
  auraType: 'GlobalAura',
  auraRoot: targetFixture('Owner'),
  fixedWhenStart: false,
  shapeData: {
    _shape: 'Box',
    _rotationOffset: { x: 0, y: 0, z: 0 },
    _useExtentKey: false,
    _extent: { x: 0, y: 0, z: 0 },
    _extentXKey: '',
    _extentYKey: '',
    _extentZKey: '',
    _useCenterKey: false,
    _center: { x: 0, y: 0, z: 0 },
    _centerXKey: '',
    _centerYKey: '',
    _centerZKey: '',
    _heightKey: '',
    _height: 0,
    _radiusKey: '',
    _radius: 0,
  },
  excludeColliderOptions: 0,
  targetObjectType: 'Character',
  targetFilter: {
    checkAlive: true,
    autoSetTargetFaction: true,
    factionTarget: 'Ally',
    targetFactionType: 'Good',
    filterObjectType: false,
    objectType: 'All',
    filterSlot: false,
    slotIndex: 0,
    filterGameplayTag: false,
    tagQuery: { queryType: 'HasAny', tags: [] },
  },
  excludeOwner: false,
  includeUnmarkable: false,
  limitInfluenceCountPerTarget: false,
  maxInfluenceCountPerTarget: 1,
  buffSource: 'ActionSource',
  buffInput: [{ buffId: 'buff_fixture', assignBlackboard: false, assignItems: [] }],
  overrideBuffIconDuration: false,
  buffIconDurationSource: {
    m_abilityEntityTypeInfo: '',
    m_timedMarkerInfo: '',
    durationSourceType: 'AbilityEntity',
    timedMarkerId: '',
  },
  inheritSourceSkillCastId: true,
  actionInAura: emptySequence,
  actionWhenExitAura: emptySequence,
};
const defaults = {
  filterFactionSource: targetFixture('Source'),
  limitInfluenceHeight: false,
  maxInfluenceHeight: scalarFixture(0),
  limitInfluenceAngle: false,
  influenceAngle: scalarFixture(360),
  influenceDirection: {
    directionType: 'SourceForward',
    sourceMountPoint: 'None',
    targetMountPoint: 'None',
    customSourceAndTarget: false,
    clampToXZ: true,
    invertDirection: false,
  },
  influenceDirectionAngleOffset: scalarFixture(0),
};

describe('Aura 新版默认影响过滤', () => {
  it('退出时清理 Owner 的配置不冒充 Target 清理', () => {
    const exit = {
      $type: 'Beyond.Gameplay.Core.FinishBuffAdvanced+Data, Gameplay.Beyond',
      isEnable: true,
      priorityLevel: 'Default',
      priorityOffset: 0,
      serverActionIndex: 0,
      buffOwner: targetFixture('Owner'),
      buffSettings: {
        checkType: 'Id',
        buffIdList: ['buff_fixture'],
        tagQuery: { queryType: 'HasAny', tags: [] },
      },
      finishAll: true,
      finishLayerCnt: scalarFixture(1),
      limitSource: false,
      buffSource: targetFixture('Source'),
      finishSource: targetFixture('Source'),
      isFinishedEarly: false,
      isAbsorbed: false,
    };
    const parse = (target: string) =>
      parseGlobalPartyAuraActionSource(
        {
          ...base,
          actionWhenExitAura: {
            ...emptySequence,
            actionData: [{ ...exit, buffOwner: targetFixture(target) }],
          },
        },
        'aura',
      );
    expect(parse('Owner').exitOwnerCleanupBuffIds).toEqual(['buff_fixture']);
    expect(parse('Target').exitOwnerCleanupBuffIds).toBeUndefined();
    expect(() => parse('Source')).toThrow('expected plain Target');
  });

  it('默认 Source 阵营和关闭几何限制不改变 Buff 与来源身份', () => {
    const old = parseGlobalPartyAuraActionSource(base, 'aura');
    expect(parseGlobalPartyAuraActionSource({ ...base, ...defaults }, 'aura')).toEqual(old);
    expect(old).toMatchObject({
      target: 'party',
      buffSource: 'ActionSource',
      inheritSourceSkillCastInfo: true,
      buffs: [{ buffId: 'buff_fixture' }],
    });
  });

  it.each([
    { limitInfluenceAngle: true },
    { filterFactionSource: targetFixture('Context', undefined, 'enemy') },
    { influenceDirection: {} },
  ])('阻断未证明或非法的影响过滤 %j', overrides => {
    expect(() =>
      parseGlobalPartyAuraActionSource({ ...base, ...defaults, ...overrides }, 'aura'),
    ).toThrow('aura.');
  });

  it('新版影响过滤不能缺少必填字段', () => {
    const current: Record<string, unknown> = { ...base, ...defaults };
    delete current.limitInfluenceHeight;
    expect(() => parseGlobalPartyAuraActionSource(current, 'aura')).toThrow('unexpected fields');
  });

  it('关闭的几何计算不引入无效黑板依赖', () => {
    expect(
      parseGlobalPartyAuraActionSource(
        { ...base, ...defaults, influenceAngle: scalarFixture(0, 'unused_angle') },
        'aura',
      ),
    ).toEqual(parseGlobalPartyAuraActionSource(base, 'aura'));
  });
});
