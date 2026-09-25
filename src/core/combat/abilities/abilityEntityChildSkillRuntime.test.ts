import { describe, expect, it, vi } from 'vitest';
import type { CompiledAbilityEntityChildSkillProgram } from '../../compiler/combatProgram';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { AbilityEntityChildSkillRuntime } from './abilityEntityChildSkillRuntime';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { AbilityEntityChildSkillPrograms } from './abilityEntityChildSkillPrograms';
import { createCallbackSkillHostFactory, EntitySkillHostGroup } from './callbackSkillHost';
import { CombatClock } from '../time/combatClock';
import { CombatReceiptCollector } from '../receipt/combatReceipt';

const program = {
  skillId: 'child-skill',
  nativeSkillType: 'normalSkill',
  naturalDurationFrames: 3,
  castResource: {
    costFrame: 0,
    cooldownSeconds: 0,
    maxChargeTime: 1,
    cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
  },
  initialBlackboard: { local: 3 },
  timelineActions: [
    {
      startFrame: 0,
      sequence: {
        steps: [
          {
            kind: 'setContextFlag',
            parameters: { flag: 'first', value: true, target: 'caster' },
          },
        ],
      },
    },
    {
      startFrame: 2,
      sequence: {
        steps: [
          {
            kind: 'setContextFlag',
            parameters: { flag: 'second', value: true, target: 'caster' },
          },
        ],
      },
    },
  ],
} satisfies CompiledAbilityEntityChildSkillProgram;

function dependencies(
  entityBlackboard: ActionBlackboard,
  execute: CombatOperationExecutor['execute'],
  binding = new AbilityEntityChildSkillPrograms().register(program),
  clock = new CombatClock(),
) {
  return {
    entity: { kind: 'abilityEntity' as const, instanceId: 7 },
    source: { kind: 'operator' as const, operatorId: 'launcher' },
    entityBlackboard,
    ownerOperatorId: 'owner',
    operations: { execute, evaluate: () => false },
    programId: binding.id,
    damageSnapshotProgram: binding.damageSnapshots,
    createCallbackSkillHost: createCallbackSkillHostFactory({
      clock,
      receipt: new CombatReceiptCollector(),
      definitionOperatorId: 'owner',
      allocateSkillCastId: () => 1,
    }),
  };
}

describe('AbilityEntityChildSkillRuntime restore', () => {
  it('从保存进度继续时间轴，不重放开始动作并保留实体黑板共享关系', () => {
    const originalEntity = new ActionBlackboard({ parent: 11 });
    const originalExecute = vi.fn(() => true);
    const clock = new CombatClock();
    const original = new AbilityEntityChildSkillRuntime(
      program,
      dependencies(originalEntity, originalExecute, undefined, clock),
    );
    original.start();
    expect(originalExecute).toHaveBeenCalledOnce();
    expect(originalExecute).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        actionOwnerId: 'ability-entity:7',
        actionSourceId: 'launcher',
      }),
    );
    clock.advanceFrame();
    original.advance(1 / 30);
    const saved = structuredClone({
      entity: originalEntity.runtimeState,
      child: original.runtimeState,
    });
    expect(saved.child.host.skill.blackboard.entity).toBe(saved.entity);

    const restoredEntity = ActionBlackboard.bindRuntimeState(saved.entity);
    const restoredExecute = vi.fn(() => true);
    const restoredBinding = {
      id: original.runtimeState.programId,
      program,
      damageSnapshots: original.damageSnapshotProgram,
    };
    const restored = new AbilityEntityChildSkillRuntime(
      program,
      dependencies(restoredEntity, restoredExecute, restoredBinding, clock),
      { state: saved.child },
    );
    expect(restoredExecute).not.toHaveBeenCalled();
    restored.start();
    expect(restoredExecute).not.toHaveBeenCalled();
    expect(restored.runtimeState.host.skill.blackboard.entity).toBe(restoredEntity.runtimeState);
    expect(restored.runtimeState.host.skill.blackboard.values.get('parent')).toBe(11);

    originalExecute.mockClear();
    clock.advanceFrame();
    original.advance(1 / 30);
    restored.advance(1 / 30);
    expect(originalExecute).toHaveBeenCalledOnce();
    expect(restoredExecute).toHaveBeenCalledOnce();
    expect(restoredExecute).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        actionOwnerId: 'ability-entity:7',
        actionSourceId: 'launcher',
      }),
    );
    expect(restored.runtimeState).toEqual(original.runtimeState);
    expect(restored.runtimeState).not.toBe(original.runtimeState);
  });

  it('不同子技能共享当前技能，恢复后保持共享；切换结束前一个技能并保留其冷却', () => {
    const clock = new CombatClock();
    const board = new ActionBlackboard();
    const group = new EntitySkillHostGroup();
    const programs = new AbilityEntityChildSkillPrograms();
    const firstProgram = {
      ...program,
      castResource: { ...program.castResource, cooldownSeconds: 10 },
    };
    const secondProgram = { ...program, skillId: 'second-child' };
    const firstBinding = programs.register(firstProgram);
    const secondBinding = programs.register(secondProgram);
    const firstExecute = vi.fn(() => true);
    const first = new AbilityEntityChildSkillRuntime(firstProgram, {
      ...dependencies(board, firstExecute, firstBinding, clock),
      skillHostGroup: group,
    });
    first.start();
    const second = new AbilityEntityChildSkillRuntime(secondProgram, {
      ...dependencies(board, () => true, secondBinding, clock),
      skillHostGroup: group,
    });
    second.start();
    expect(group.ability.currentSkillId).toBe('second-child');
    expect(first.runtimeState.host.ability).toBe(second.runtimeState.host.ability);
    const saved = structuredClone({
      board: board.runtimeState,
      first: first.runtimeState,
      second: second.runtimeState,
    });
    const restoredBoard = ActionBlackboard.bindRuntimeState(saved.board);
    const restoredGroup = new EntitySkillHostGroup();
    const restoredExecute = vi.fn(() => true);
    const restoredFirst = new AbilityEntityChildSkillRuntime(
      firstProgram,
      {
        ...dependencies(restoredBoard, restoredExecute, firstBinding, clock),
        skillHostGroup: restoredGroup,
      },
      { state: saved.first },
    );
    new AbilityEntityChildSkillRuntime(
      secondProgram,
      {
        ...dependencies(restoredBoard, () => true, secondBinding, clock),
        skillHostGroup: restoredGroup,
      },
      { state: saved.second },
    );
    expect(restoredGroup.ability.currentSkillId).toBe('second-child');
    first.start();
    restoredFirst.start();
    expect(firstExecute).toHaveBeenCalledOnce();
    expect(restoredExecute).not.toHaveBeenCalled();
    clock.advanceFrame();
    group.advance(10);
    restoredGroup.advance(10);
    first.start();
    restoredFirst.start();
    expect(firstExecute).toHaveBeenCalledTimes(2);
    expect(restoredExecute).toHaveBeenCalledOnce();
    expect(restoredFirst.runtimeState).toEqual(first.runtimeState);
  });

  it('拒绝把子技能状态绑到另一份实体黑板', () => {
    const entity = new ActionBlackboard({ parent: 1 });
    const original = new AbilityEntityChildSkillRuntime(
      program,
      dependencies(entity, () => true),
    );
    original.start();
    const state = structuredClone(original.runtimeState);
    expect(
      () =>
        new AbilityEntityChildSkillRuntime(
          program,
          dependencies(new ActionBlackboard({ parent: 1 }), () => true, {
            id: state.programId,
            program,
            damageSnapshots: original.damageSnapshotProgram,
          }),
          { state },
        ),
    ).toThrow('restored entity blackboard');
  });
});
