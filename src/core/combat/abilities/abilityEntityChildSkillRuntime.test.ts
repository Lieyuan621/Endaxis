import { describe, expect, it, vi } from 'vitest';
import type { CompiledAbilityEntityChildSkillProgram } from '../../compiler/combatProgram';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { AbilityEntityChildSkillRuntime } from './abilityEntityChildSkillRuntime';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { AbilityEntityChildSkillPrograms } from './abilityEntityChildSkillPrograms';

const program = {
  skillId: 'child-skill',
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
) {
  return {
    entity: { kind: 'abilityEntity' as const, instanceId: 7 },
    entityBlackboard,
    ownerOperatorId: 'owner',
    operations: { execute, evaluate: () => false },
    programId: binding.id,
    damageSnapshotProgram: binding.damageSnapshots,
  };
}

describe('AbilityEntityChildSkillRuntime restore', () => {
  it('从保存进度继续时间轴，不重放开始动作并保留实体黑板共享关系', () => {
    const originalEntity = new ActionBlackboard({ parent: 11 });
    const originalExecute = vi.fn(() => true);
    const original = new AbilityEntityChildSkillRuntime(
      program,
      dependencies(originalEntity, originalExecute),
    );
    original.start();
    expect(originalExecute).toHaveBeenCalledOnce();
    original.advance(1 / 30);
    const saved = structuredClone({
      entity: originalEntity.runtimeState,
      child: original.runtimeState,
    });
    expect(saved.child.blackboard.entity).toBe(saved.entity);

    const restoredEntity = ActionBlackboard.bindRuntimeState(saved.entity);
    const restoredExecute = vi.fn(() => true);
    const restoredBinding = {
      id: original.runtimeState.programId,
      program,
      damageSnapshots: original.damageSnapshotProgram,
    };
    const restored = new AbilityEntityChildSkillRuntime(
      program,
      dependencies(restoredEntity, restoredExecute, restoredBinding),
      { state: saved.child },
    );
    expect(restoredExecute).not.toHaveBeenCalled();
    expect(() => restored.start()).toThrow('already started');
    expect(restored.runtimeState.blackboard.entity).toBe(restoredEntity.runtimeState);
    expect(restored.runtimeState.blackboard.values.get('parent')).toBe(11);

    originalExecute.mockClear();
    original.advance(1 / 30);
    restored.advance(1 / 30);
    expect(originalExecute).toHaveBeenCalledOnce();
    expect(restoredExecute).toHaveBeenCalledOnce();
    expect(restored.runtimeState).toEqual(original.runtimeState);
    expect(restored.runtimeState).not.toBe(original.runtimeState);
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
