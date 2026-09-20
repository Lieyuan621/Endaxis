import { expect, it } from 'vitest';
import type { CompiledSkillProgram } from '../../../compiler/combatProgram';
import { CombatReceiptCollector } from '../../receipt/combatReceipt';
import { AbilitySystemRuntime } from '../../abilities/abilitySystemRuntime';
import { ActionBlackboard } from '../../actions/actionBlackboard';
import { CombatClock } from '../../time/combatClock';
import { createCombatOperationHostState } from '../../state/actionState';
import { CombatOperationPrograms } from '../../actions/combatOperationPrograms';
import { bindRestoredCombatOperatorSkills } from './combatOperatorSkillRestoration';
import { bindRestoredCombatSkillCooldowns } from './combatSkillCooldownRestoration';
import { CombatSkillPrograms } from '../../skills/combatSkillPrograms';
import { SkillCooldown } from '../../skills/skillCooldown';
import { SkillRuntime, type CombatOperationExecutor } from '../../skills/skillRuntime';
import { CombatBuffContainer, type CombatBuffDefinition } from '../../buffs/combatBuffs';
import { CombatAttributeSet } from '../../attributes/combatAttributes';

const program: CompiledSkillProgram = {
  operatorId: 'operator',
  skillGroupKey: 'battleSkill',
  skillId: 'skill',
  skillType: 'battleSkill',
  skillLevel: 1,
  timelineBlockFrames: 30,
  costs: [],
  initialBlackboard: { counter: 1 },
  naturalDurationFrames: 4,
  timelineActions: [],
  cooldownFrames: 30,
  costFrame: 0,
};

function operations(state: ReturnType<typeof createCombatOperationHostState>) {
  const executor: CombatOperationExecutor = {
    operationHost: { state, programs: new CombatOperationPrograms() },
    execute: () => true,
    evaluate: () => true,
  };
  return executor;
}

it.each(['active', 'finished', 'recycled'] as const)(
  '附属 Buff 为 %s 时，恢复与连续运行一致且不重放生命周期',
  phase => {
    const fixedPrograms = new CombatSkillPrograms();
    const fixed = fixedPrograms.register(program);
    const originalClock = new CombatClock();
    const originalReceipt = new CombatReceiptCollector();
    const originalBlackboard = new ActionBlackboard({ shared: 7 });
    const originalCooldown = new SkillCooldown(30, 0);
    const originalOperationState = createCombatOperationHostState();
    const original = new SkillRuntime(program, {
      clock: originalClock,
      receipt: originalReceipt,
      operations: operations(originalOperationState),
      resources: null,
      allocateSkillCastId: () => 1,
      entityBlackboard: originalBlackboard,
      cooldown: originalCooldown,
      advancesCooldown: false,
      damageSnapshotProgram: fixed.damageSnapshots,
      operationState: originalOperationState,
    });
    const originalAbility = new AbilitySystemRuntime({ skills: [original] });
    expect(originalAbility.tryStartSkill('skill')).toBe(true);
    const definition: CombatBuffDefinition<string> = { id: 'attached', stackingType: 'unlimited' };
    const buffs = new CombatBuffContainer('operator', new CombatAttributeSet<string>());
    const buff = buffs.add(definition, 'operator')!;
    original.attachInheritedBuff(buff);
    if (phase !== 'active') buff.finish('lifetime', null);
    if (phase === 'recycled') buffs.recycleFinishedBuffs();
    // 同定义的新实例不能成为旧引用的替代品。
    const survivor = buffs.add(definition, 'operator')!;
    originalClock.advanceFrame();
    originalAbility.advanceFrame();
    const saved = structuredClone({
      clock: originalClock.runtimeState,
      blackboard: originalBlackboard.runtimeState,
      cooldowns: new Map([['skill', originalCooldown.runtimeState]]),
      skill: original.runtimeState,
      ability: originalAbility.runtimeState,
      buffs: buffs.runtimeState,
    });
    const savedBeforeRestore = structuredClone(saved);
    const restoredBuffs = new CombatBuffContainer(
      'operator',
      new CombatAttributeSet(saved.buffs.attributes),
      undefined,
      null,
      ActionBlackboard.bindRuntimeState(saved.buffs.entityBlackboard),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      saved.buffs,
    );
    restoredBuffs.bindRestoredInstances(() => definition);
    const restoredClock = new CombatClock(saved.clock);
    const restoredReceipt = new CombatReceiptCollector(originalReceipt.history.snapshot());
    const restoredBlackboard = ActionBlackboard.bindRuntimeState(saved.blackboard);
    const cooldowns = bindRestoredCombatSkillCooldowns(
      { operatorId: 'operator', skills: [program] },
      saved.cooldowns,
    );
    const allocate = () => {
      throw new Error('restoration must not allocate a cast id');
    };
    const restored = bindRestoredCombatOperatorSkills({
      operatorId: 'operator',
      skills: [{ program, fixed, state: saved.skill }],
      cooldowns,
      createDependencies: binding => ({
        clock: restoredClock,
        receipt: restoredReceipt,
        operations: operations(binding.state.operations),
        resources: null,
        allocateSkillCastId: allocate,
        entityBlackboard: restoredBlackboard,
      }),
      resolveAttachedBuff: reference => restoredBuffs.resolveHandle(reference),
    }).get('skill\u0000')!;
    const restoredAbility = new AbilitySystemRuntime({ skills: [restored] }, saved.ability);
    expect(saved).toEqual(savedBeforeRestore);

    expect(restored.runtimeState).toBe(saved.skill);
    expect(restored.runtimeState.cooldown).toBe(saved.cooldowns.get('skill'));
    expect(restored.runtimeState.blackboard.entity).toBe(saved.blackboard);
    for (let frame = 2; frame <= 4; frame += 1) {
      originalClock.advanceFrame();
      originalAbility.advanceFrame();
      restoredClock.advanceFrame();
      restoredAbility.advanceFrame();
      expect(restored.runtimeState).toEqual(original.runtimeState);
      expect(restoredAbility.runtimeState).toEqual(originalAbility.runtimeState);
      expect(restoredReceipt.entries).toEqual(originalReceipt.entries);
      expect(restoredBuffs.runtimeState).toEqual(buffs.runtimeState);
    }
    expect(restored.state).toBe('ended');
    expect(original.runtimeState.execution.attachedBuffs.size).toBe(0);
    expect(survivor.isFinished).toBe(false);
    expect(restoredBuffs.getInstance(survivor.instanceId)!.isFinished).toBe(false);
  },
);

it('技能宿主拒绝未绑定保存动作状态的当前执行链', () => {
  const fixed = new CombatSkillPrograms().register(program);
  const cooldownState = new SkillCooldown(30, 0).runtimeState;
  const state = new SkillRuntime(program, {
    clock: new CombatClock(),
    receipt: new CombatReceiptCollector(),
    operations: operations(createCombatOperationHostState()),
    resources: null,
    allocateSkillCastId: () => 1,
    cooldown: new SkillCooldown(30, 0, undefined, cooldownState),
    advancesCooldown: false,
  }).runtimeState;
  const cooldowns = bindRestoredCombatSkillCooldowns(
    { operatorId: 'operator', skills: [program] },
    new Map([['skill', state.cooldown]]),
  );

  expect(() =>
    bindRestoredCombatOperatorSkills({
      operatorId: 'operator',
      skills: [{ program, fixed, state }],
      cooldowns,
      createDependencies: () => ({
        clock: new CombatClock(),
        receipt: new CombatReceiptCollector(),
        operations: operations(createCombatOperationHostState()),
        resources: null,
        allocateSkillCastId: () => 1,
      }),
      resolveAttachedBuff: () => undefined,
    }),
  ).toThrow('has no matching operation host');
});
