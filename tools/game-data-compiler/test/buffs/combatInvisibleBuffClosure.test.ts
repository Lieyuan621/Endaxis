import { describe, expect, it } from 'vitest';
import { collectCombatInvisibleBuffClosureIds } from '../../src/compiler/buffs/combatInvisibleBuffClosure.ts';
import { buffFixture, iconFixture, scalarFixture, targetFixture } from '../sourceFixtures.ts';

const meta = {
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 0,
};

/** 无图标、无战斗载荷的表现 Buff 基底。 */
const presentationBuff = (id: string, abilityEventAction: unknown[] = []) =>
  buffFixture({
    id,
    hasIcon: false,
    iconConfig: { ...iconFixture(), _spritePath: '' },
    applyTags: [],
    abilityEventAction,
  });

const sequence = (actionData: unknown[]) => ({
  actionData,
  onlyExecuteWhenSourceIsMainChar: false,
  onlyExecuteWhenSourceIsGuard: false,
});

/** 只创建一个子 Buff 的动作；buffApplication 叶子在闭包判定中按表现中间节点处理。 */
const createChildBuff = (buffId: string) => ({
  ...meta,
  $type: 'Beyond.Gameplay.Core.CreateBuffAction+Data, Gameplay.Beyond',
  buffs: [
    {
      buffId,
      assignBlackboard: false,
      assignItems: [],
      readIdFromBlackboard: false,
      buffIdKey: '',
    },
  ],
  count: scalarFixture(1),
  targetSettings: targetFixture('Source'),
  buffSource: 'ActionSource',
  contextKey: '',
  autoFinishByAction: false,
  inheritSkillIdList: [],
  finishWithNextSkillIfNotInherited: true,
  asChildBuff: false,
  inheritSourceSkillCastId: true,
  inheritSourceSkillCastInfo: true,
  isExtra: false,
  passTargetGroupsToBuff: false,
  overrideBuffIconDuration: false,
  buffIconDurationSource: {
    m_abilityEntityTypeInfo: '',
    m_timedMarkerInfo: '',
    durationSourceType: 'AbilityEntity',
    timedMarkerId: '',
  },
});

describe('表现 Buff 闭包判定', () => {
  const load = (buffs: Record<string, unknown>) => (id: string) => {
    const value = buffs[id];
    if (value === undefined) throw new Error(`missing ${id}`);
    return value;
  };

  it('整条表现引用链在无身份读取时被裁掉', () => {
    const buffs = {
      'buff.creator': presentationBuff('buff.creator', [
        { abilityEvent: 'OnAddedBuff', actions: [sequence([createChildBuff('buff.marker')])] },
      ]),
      'buff.marker': presentationBuff('buff.marker'),
    };
    expect(collectCombatInvisibleBuffClosureIds(['buff.creator'], load(buffs))).toEqual(
      new Set(['buff.creator', 'buff.marker']),
    );
  });

  it('身份被观察的子 Buff 从初始集合排除，可见性沿引用边向上保活创建者', () => {
    const buffs = {
      'buff.creator': presentationBuff('buff.creator', [
        { abilityEvent: 'OnAddedBuff', actions: [sequence([createChildBuff('buff.marker')])] },
      ]),
      'buff.marker': presentationBuff('buff.marker'),
    };
    // 回归锁定：observedBuffIds 只在事后 filter 时，创建者仍会被误裁（K3  arcane 光环丢失）。
    expect(
      collectCombatInvisibleBuffClosureIds(['buff.creator'], load(buffs), new Set(['buff.marker'])),
    ).toEqual(new Set());
  });

  it('引用未知或战斗 Buff 的节点失败关闭，不误裁', () => {
    const buffs = {
      'buff.creator': presentationBuff('buff.creator', [
        { actions: [createChildBuff('buff.combat')] },
      ]),
      'buff.combat': buffFixture({ id: 'buff.combat', hasIcon: true }),
    };
    expect(collectCombatInvisibleBuffClosureIds(['buff.creator'], load(buffs))).toEqual(new Set());
  });
});
