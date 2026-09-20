/** 验证替换登记与真实冷却账本共同恢复，覆盖旧编号失效和分支独立推进。 */
import { describe, expect, it } from 'vitest';
import { createAbilitySystemState } from '../state/abilityState';
import {
  replaceAbilitySkillSlot,
  finishAbilitySkillSlotReplacement,
  type SkillSlotReplacementHost,
} from '../abilities/abilitySystemExecution';
import { SkillCooldown } from '../skills/skillCooldown';

describe('技能槽替换恢复', () => {
  it('撤销使用当前分支的冷却进度，旧编号不能撤销后来安装的替换', () => {
    const state = createAbilitySystemState();
    state.skillSlotGroups.set('battle', {
      baseSkillKey: 'base',
      input: 'battleSkill',
      defaultForInput: true,
      stableInputSkillKeys: new Set(),
      allowedSkillKeys: new Set(['base', 'first', 'second']),
      currentSkillKey: 'base',
    });
    const cooldowns = new Map(
      ['base', 'first', 'second'].map(key => [key, new SkillCooldown(100, 0)]),
    );
    cooldowns.get('base')!.setProgress(0.25);
    const bind = (data: typeof state, ledgers: typeof cooldowns): SkillSlotReplacementHost => ({
      currentSkillKey: group => data.skillSlotGroups.get(group)!.currentSkillKey,
      changeSkillSlot: (group, skill, inherit) => {
        const slot = data.skillSlotGroups.get(group)!;
        if (inherit)
          ledgers.get(skill)!.setProgress(ledgers.get(slot.currentSkillKey)!.snapshot.progress);
        slot.currentSkillKey = skill;
      },
    });
    const host = bind(state, cooldowns);
    const first = replaceAbilitySkillSlot(
      state,
      {
        skillGroupKey: 'battle',
        targetSkillKey: 'first',
        inheritOriginSkillCooldownProgress: true,
      },
      host,
    );
    const saved = structuredClone({
      ability: state,
      cooldowns: new Map([...cooldowns].map(([key, value]) => [key, value.runtimeState])),
    });
    const restoredCooldowns = new Map(
      [...saved.cooldowns].map(([key, value]) => [
        key,
        new SkillCooldown(100, 0, undefined, value),
      ]),
    );
    const restoredHost = bind(saved.ability, restoredCooldowns);
    restoredCooldowns.get('first')!.setProgress(0.75);
    const second = replaceAbilitySkillSlot(
      saved.ability,
      {
        skillGroupKey: 'battle',
        targetSkillKey: 'second',
        inheritOriginSkillCooldownProgress: true,
      },
      restoredHost,
    );
    expect(saved.ability.skillSlotReplacements.get('battle')!.revertedSkillKey).toBe('base');
    expect(restoredCooldowns.get('second')!.snapshot.progress).toBeCloseTo(0.75);
    finishAbilitySkillSlotReplacement(saved.ability, 'battle', first, restoredHost);
    expect(saved.ability.skillSlotGroups.get('battle')!.currentSkillKey).toBe('second');
    restoredCooldowns.get('second')!.setProgress(0.9);
    finishAbilitySkillSlotReplacement(saved.ability, 'battle', second, restoredHost);
    finishAbilitySkillSlotReplacement(saved.ability, 'battle', second, restoredHost);
    expect(saved.ability.skillSlotGroups.get('battle')!.currentSkillKey).toBe('base');
    expect(restoredCooldowns.get('base')!.snapshot.progress).toBeCloseTo(0.9);
    expect(state.skillSlotGroups.get('battle')!.currentSkillKey).toBe('first');
    expect(cooldowns.get('base')!.snapshot.progress).toBeCloseTo(0.25);
    expect(state.skillSlotReplacements.has('battle')).toBe(true);
  });
});
