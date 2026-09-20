import { describe, expect, it } from 'vitest';
import akekuri from '../../../src/data/operators/akekuri.generated';
import avywenna from '../../../src/data/operators/avywenna.generated';
import wulfgard from '../../../src/data/operators/wulfgard.generated';
import xaihi from '../../../src/data/operators/xaihi.generated';
import yvonne from '../../../src/data/operators/yvonne.generated';
import { standardStumpBuffAbilityEventOmissionReason } from '../src/compiler/scenario/standardStumpScenarioPolicy.ts';

function visit(value: unknown, inspect: (row: Record<string, unknown>) => void) {
  if (Array.isArray(value)) return value.forEach(item => visit(item, inspect));
  if (value === null || typeof value !== 'object') return;
  const row = value as Record<string, unknown>;
  inspect(row);
  Object.values(row).forEach(child => visit(child, inspect));
}

describe('无敌人主动行为的控制状态边界', () => {
  it.each([
    'OnBeforeOutputKnockDown',
    'OnAfterOutputKnockDown',
    'OnBeforeTakeKnockDown',
    'OnAfterTakeKnockDown',
    'OnBeforeApplyPhysics',
    'OnAfterApplyPhysics',
  ])('%s 不因敌人没有动作被无条件删除', event => {
    expect(standardStumpBuffAbilityEventOmissionReason(event)).toBeNull();
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

  it('五份完整定义目前只有伊冯的干员自身查询可能读取起身祖先标签；新增消费者必须重新审计', () => {
    const watched = 'Status/Immobilized/Getup';
    const readers: { operator: string; target: unknown }[] = [];
    for (const [operator, definition] of Object.entries({
      akekuri,
      avywenna,
      wulfgard,
      xaihi,
      yvonne,
    })) {
      visit(definition, row => {
        if (
          row.kind === 'entityTagMatch' &&
          Array.isArray(row.tags) &&
          row.tags.some(
            tag => typeof tag === 'string' && (tag === watched || watched.startsWith(tag + '/')),
          )
        )
          readers.push({ operator, target: row.target });
      });
    }
    expect(readers).toEqual([{ operator: 'yvonne', target: 'buffOwner' }]);
    const applications: unknown[] = [];
    visit(yvonne, row => {
      if (row.kind !== 'applyBuff') return;
      const parameters = row.parameters as Record<string, unknown>;
      if (parameters.buffId === 'buff_chr_0017_yvonne_normal_skill_projectile')
        applications.push(parameters.target);
    });
    expect(applications.length).toBeGreaterThan(0);
    expect(new Set(applications)).toEqual(new Set(['caster']));
  });
});
