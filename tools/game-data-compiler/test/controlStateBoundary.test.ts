import { describe, expect, it } from 'vitest';
import { standardStumpBuffAbilityEventOmissionReason } from '../src/compiler/scenario/standardStumpScenarioPolicy.ts';

describe('无敌人主动行为的控制状态边界', () => {
  it('物理控制的输出、受击和处理事件不因敌人没有动作被无条件删除', () => {
    for (const event of [
      'OnBeforeOutputKnockDown',
      'OnAfterTakeKnockDown',
      'OnAfterApplyPhysics',
    ]) {
      expect(standardStumpBuffAbilityEventOmissionReason(event)).toBeNull();
    }
  });

  it('干员受击监听由外部标记保留，只有死亡事件仍按木桩边界省略', () => {
    for (const event of ['OnBeforeTakeDamage', 'OnTakeDamage']) {
      expect(standardStumpBuffAbilityEventOmissionReason(event, 'caster')).toBeNull();
    }
    for (const event of ['OnOwnerHpZero', 'OnOwnerDead']) {
      expect(standardStumpBuffAbilityEventOmissionReason(event, 'caster')).not.toBeNull();
      expect(standardStumpBuffAbilityEventOmissionReason(event)).toBeNull();
    }
  });

  it('外部受击标记不伪造角色承受元素附着事件', () => {
    expect(
      standardStumpBuffAbilityEventOmissionReason('OnCharBeforeTakeSpellInfliction', 'caster'),
    ).not.toBeNull();
    expect(
      standardStumpBuffAbilityEventOmissionReason('OnCharBeforeTakeSpellInfliction', 'enemy'),
    ).toBeNull();
  });

  it('敌方受击事件保留，但唯一木桩死亡后的事件省略', () => {
    expect(standardStumpBuffAbilityEventOmissionReason('OnBeforeTakeDamage', 'enemy')).toBeNull();
    expect(standardStumpBuffAbilityEventOmissionReason('OnTakeDamage', 'enemy')).toBeNull();
    expect(standardStumpBuffAbilityEventOmissionReason('OnOwnerHpZero', 'enemy')).not.toBeNull();
    expect(standardStumpBuffAbilityEventOmissionReason('OnOwnerDead', 'enemy')).not.toBeNull();
  });

  it('敌人输出 Buff 只在被动木桩归属已证明时省略', () => {
    expect(standardStumpBuffAbilityEventOmissionReason('OnOutputBuff')).toBeNull();
    expect(standardStumpBuffAbilityEventOmissionReason('OnOutputBuff', 'caster')).toBeNull();
    expect(standardStumpBuffAbilityEventOmissionReason('OnOutputBuff', 'enemy')).not.toBeNull();
  });
});
