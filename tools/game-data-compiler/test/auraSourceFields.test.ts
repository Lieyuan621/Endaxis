import { describe, expect, it } from 'vitest';
import {
  parseGlobalPartyAuraActionSource,
  parseDirectRangedAuraActionSource,
  parseAuraReferenceActionSource,
} from '../src/source/auraActions.ts';
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

  it('范围 Aura 复用同一校验，不丢安装的 Buff', () => {
    const ranged = { ...base, auraType: 'RangedAura', targetObjectType: 0 };
    const unexpectedCallback = () => {
      throw new Error('本样本不应解析进入子序列');
    };
    expect(
      parseDirectRangedAuraActionSource({ ...ranged, ...defaults }, 'aura', unexpectedCallback),
    ).toEqual(parseDirectRangedAuraActionSource(ranged, 'aura', unexpectedCallback));
  });

  it('引用闭包与正式入口共用字段表', () => {
    expect(parseAuraReferenceActionSource({ ...base, ...defaults }, 'aura')).toEqual(
      parseAuraReferenceActionSource(base, 'aura'),
    );
  });

  it.each([
    { limitInfluenceAngle: true },
    { limitInfluenceHeight: true },
    { limitInfluenceHeight: 0 },
    { limitInfluenceAngle: 'false' },
    { filterFactionSource: targetFixture('Owner') },
    { filterFactionSource: targetFixture('Context', undefined, 'enemy') },
    { influenceAngle: null },
    { influenceDirection: {} },
    { influenceDirectionAngleOffset: { ...scalarFixture(0), value: '0' } },
  ])('阻断未证明或非法的影响过滤 %j', overrides => {
    expect(() =>
      parseGlobalPartyAuraActionSource({ ...base, ...defaults, ...overrides }, 'aura'),
    ).toThrow('aura.');
  });

  it.each(Object.keys(defaults))('新增字段必须完整，不能缺少 %s', key => {
    const current: Record<string, unknown> = { ...base, ...defaults };
    delete current[key];
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
