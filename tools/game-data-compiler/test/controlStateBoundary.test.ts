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

  it('敌人受击、死亡和干员击杀响应保留，供可死亡敌人继续执行', () => {
    expect(standardStumpBuffAbilityEventOmissionReason('OnBeforeTakeDamage', 'enemy')).toBeNull();
    expect(standardStumpBuffAbilityEventOmissionReason('OnTakeDamage', 'enemy')).toBeNull();
    expect(standardStumpBuffAbilityEventOmissionReason('OnOwnerHpZero', 'enemy')).toBeNull();
    expect(standardStumpBuffAbilityEventOmissionReason('OnOwnerDead', 'enemy')).toBeNull();
    expect(standardStumpBuffAbilityEventOmissionReason('OnAfterKillEntity', 'caster')).toBeNull();
  });

  it('敌人没有主动技能不代表死亡响应不能输出 Buff', () => {
    expect(standardStumpBuffAbilityEventOmissionReason('OnOutputBuff')).toBeNull();
    expect(standardStumpBuffAbilityEventOmissionReason('OnOutputBuff', 'caster')).toBeNull();
    expect(standardStumpBuffAbilityEventOmissionReason('OnOutputBuff', 'enemy')).toBeNull();
  });
});
