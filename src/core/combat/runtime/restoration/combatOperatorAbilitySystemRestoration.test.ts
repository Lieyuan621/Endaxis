import { expect, it, vi } from 'vitest';
import type { CompiledSkillProgram } from '../../../compiler/combatProgram';
import type { CombatOperatorProgram } from '../combatRuntimeAssembly';
import { bindRestoredCombatOperatorAbilitySystem } from './combatOperatorAbilitySystemRestoration';
import { bindRestoredCombatSkillCooldowns } from './combatSkillCooldownRestoration';
import { createAbilitySystemState } from '../../state/abilityState';
import { SkillCooldown } from '../../skills/skillCooldown';

const cooldownProgram: CompiledSkillProgram = {
  operatorId: 'operator',
  skillGroupKey: 'battleSkill',
  skillId: 'unplaced',
  skillType: 'battleSkill',
  skillLevel: 1,
  timelineBlockFrames: 30,
  timelineActions: [],
  costs: [],
  initialBlackboard: {},
  cooldownFrames: 30,
  costFrame: 0,
};

it('恢复能力系统继续推进没有施放实例的共享冷却，并只发布一次就绪', () => {
  const operator: CombatOperatorProgram = {
    operatorId: 'operator',
    skills: [],
    skillCooldownPrograms: [cooldownProgram],
  };
  const originalCooldown = new SkillCooldown(30, 0);
  originalCooldown.tryReserve();
  originalCooldown.setRemainingFrames(1);
  const savedCooldowns = structuredClone(new Map([['unplaced', originalCooldown.runtimeState]]));
  const cooldowns = bindRestoredCombatSkillCooldowns(operator, savedCooldowns);
  const state = structuredClone(createAbilitySystemState());
  const ready = vi.fn();

  const ability = bindRestoredCombatOperatorAbilitySystem({
    operator,
    state,
    skills: new Map(),
    cooldowns,
    runtime: {},
    onCooldownReady: ready,
  });

  expect(ability.runtimeState).toBe(state);
  ability.advanceFrame();
  ability.advanceFrame();
  expect(cooldowns.get('unplaced')!.cooldown.snapshot.ready).toBe(true);
  expect(ready).toHaveBeenCalledExactlyOnceWith('unplaced');
  expect(originalCooldown.snapshot.remainingFrames).toBe(1);
});

it('恢复能力系统拒绝保存状态中无法解析的当前技能', () => {
  const operator: CombatOperatorProgram = { operatorId: 'operator', skills: [] };
  const state = createAbilitySystemState();
  state.currentSkillKey = 'missing\u0000';

  expect(() =>
    bindRestoredCombatOperatorAbilitySystem({
      operator,
      state,
      skills: new Map(),
      cooldowns: new Map(),
      runtime: {},
    }),
  ).toThrow("missing ability skill binding 'missing");
});
