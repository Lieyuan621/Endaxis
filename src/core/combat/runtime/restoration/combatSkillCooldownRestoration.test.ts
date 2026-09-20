import { expect, it } from 'vitest';
import type { CompiledSkillProgram } from '../../../compiler/combatProgram';
import type { CombatOperatorProgram } from '../combatRuntimeAssembly';
import {
  bindRestoredCombatSkillCooldowns,
  resolveCombatSkillCooldownConfiguration,
} from './combatSkillCooldownRestoration';
import { SkillCooldown } from '../../skills/skillCooldown';
import { CombatBuffContainer } from '../../buffs/combatBuffs';
import { CombatAttributeSet } from '../../attributes/combatAttributes';

function skill(overrides: Partial<CompiledSkillProgram> = {}): CompiledSkillProgram {
  return {
    operatorId: 'operator',
    skillGroupKey: 'battleSkill',
    skillId: 'skill',
    skillType: 'battleSkill',
    skillLevel: 1,
    timelineBlockFrames: 100,
    costs: [],
    initialBlackboard: {},
    timelineActions: [],
    cooldownFrames: 100,
    costFrame: 10,
    ...overrides,
  };
}

it('恢复共享冷却直接绑定保存账本，后续推进不修改原分支', () => {
  const program = skill();
  const operator: CombatOperatorProgram = { operatorId: 'operator', skills: [program] };
  const original = new SkillCooldown(100, 10);
  original.tryReserve();
  original.advance(25);
  const saved = structuredClone(new Map([['skill', original.runtimeState]]));

  const binding = bindRestoredCombatSkillCooldowns(operator, saved).get('skill')!;

  expect(binding.cooldown.runtimeState).toBe(saved.get('skill'));
  expect(binding.cooldown.snapshot.remainingFrames).toBe(original.snapshot.remainingFrames);
  binding.cooldown.advance(5);
  expect(binding.cooldown.snapshot.remainingFrames).toBe(original.snapshot.remainingFrames - 5);
  expect(original.snapshot.remainingFrames).toBe(75);
});

it('恢复后的连携冷却在实际预占时读取当前分支 Buff 倍率', () => {
  let multiplier = 2;
  const program = skill({ skillType: 'comboSkill', skillGroupKey: 'comboSkill' });
  const operator: CombatOperatorProgram = {
    operatorId: 'operator',
    skills: [program],
    buffRuntime: Object.assign(
      new CombatBuffContainer('operator', new CombatAttributeSet<string>()),
      {
        getAttributeValue: () => multiplier,
        advanceFrame: () => {},
      },
    ),
  };
  const saved = new Map([['skill', new SkillCooldown(100, 10).runtimeState]]);
  const cooldown = bindRestoredCombatSkillCooldowns(operator, saved).get('skill')!.cooldown;

  expect(cooldown.tryReserve()).toBe(true);
  expect(cooldown.snapshot.remainingFrames).toBe(200);
  cooldown.overrideByTimeline(true);
  multiplier = 0.5;
  expect(cooldown.tryReserve()).toBe(true);
  expect(cooldown.snapshot.remainingFrames).toBe(50);
});

it('固定面板修正只改变基础周期，错误的数据形状在绑定前失败', () => {
  const program = skill();
  const operator: CombatOperatorProgram = {
    operatorId: 'operator',
    skills: [program],
    panel: {
      operatorId: 'operator',
      level: 1,
      attributes: { strength: 0, agility: 0, intellect: 0, will: 0 },
      attack: 100,
      attackBeforeAttributeScalar: 100,
      mainAttribute: 'strength',
      secondaryAttribute: 'agility',
      health: 100,
      defense: 0,
      criticalRate: 0,
      criticalDamage: 1.5,
      artsIntensity: 0,
      ultimateEnergyGainEfficiency: 1,
      skillCooldownReduction: 0,
      staggerDamagePercent: 0,
      receipt: [],
      combatModifiers: [
        {
          kind: 'skillCooldownMultiplier',
          skillTypes: ['battleSkill'],
          value: 0.8,
        },
      ],
    },
  };

  expect(resolveCombatSkillCooldownConfiguration(operator, program)).toEqual({
    periodFrames: 80,
    commitFrame: 10,
  });
  expect(() =>
    bindRestoredCombatSkillCooldowns(
      operator,
      new Map([['skill', { reservedByCurrentCast: false, timer: undefined }]]),
    ),
  ).toThrow("restored cooldown 'operator:skill' does not match its fixed configuration");
});
