import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { CombatCondition } from '../../game-data/operatorDefinition';
import { CombatOperationPrograms } from '../actions/combatOperationPrograms';
import type { SkillCastInheritanceActionState } from '../state/actionState';
import type {
  SkillCastInheritanceRegistration,
  SkillCastInheritanceState,
} from '../state/environmentState';
import type { CombatSkillCastInfo } from '../state/foundationState';
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';

/** 原生 AbilitySystem 的普通攻击施法身份继承槽；首次注册优先，按动作结束撤销。 */
export class BasicAttackSkillCastInheritanceRegistry {
  constructor(
    readonly runtimeState: SkillCastInheritanceState = {
      registrations: new Map(),
      nextId: 1,
    },
  ) {}

  register(
    operatorId: string,
    skillCastInfo: CombatSkillCastInfo,
  ): SkillCastInheritanceRegistration {
    const registration = { operatorId, id: this.runtimeState.nextId++, skillCastInfo };
    if (!this.runtimeState.registrations.has(operatorId)) {
      this.runtimeState.registrations.set(operatorId, registration);
    }
    return registration;
  }

  unregister(registration: SkillCastInheritanceRegistration): void {
    if (this.runtimeState.registrations.get(registration.operatorId)?.id === registration.id)
      this.runtimeState.registrations.delete(registration.operatorId);
  }

  get(operatorId: string): CombatSkillCastInfo | undefined {
    return this.runtimeState.registrations.get(operatorId)?.skillCastInfo;
  }
}

/** Buff enable 序列中的注册动作；同一步骤实例在 end/reset 时只撤销自己的注册。 */
export class SkillCastInheritanceOperationExecutor implements CombatOperationExecutor {
  readonly runtimeState: SkillCastInheritanceActionState;
  readonly programs: CombatOperationPrograms;

  constructor(
    readonly operatorId: string,
    readonly registry: BasicAttackSkillCastInheritanceRegistry,
    readonly delegate: CombatOperationExecutor,
    restored?: {
      readonly state: SkillCastInheritanceActionState;
      readonly programs: CombatOperationPrograms;
    },
  ) {
    this.runtimeState = restored?.state ?? { registrations: new Map() };
    this.programs = restored?.programs ?? new CombatOperationPrograms();
  }

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind !== 'inheritSkillCastInfoForBasicAttack') {
      return context === undefined
        ? this.delegate.execute(step)
        : this.delegate.execute(step, context);
    }
    const slot = this.programs.slot(step);
    if (this.runtimeState.registrations.has(slot)) return true;
    if (context?.skillCastInfo === undefined) {
      throw new Error('basic-attack SkillCastInfo inheritance requires a source SkillCastInfo');
    }
    this.runtimeState.registrations.set(
      slot,
      this.registry.register(this.operatorId, context.skillCastInfo),
    );
    return true;
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind !== 'inheritSkillCastInfoForBasicAttack') {
      this.delegate.end?.(step, context);
      return;
    }
    const slot = this.programs.slot(step);
    const registration = this.runtimeState.registrations.get(slot);
    if (registration !== undefined) this.registry.unregister(registration);
    this.runtimeState.registrations.delete(slot);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    return context === undefined
      ? this.delegate.evaluate(condition)
      : this.delegate.evaluate(condition, context);
  }
}
