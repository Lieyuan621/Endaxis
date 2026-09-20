import type { CombatCondition, CombatStepParameters } from '../../game-data/operatorDefinition';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
import { COMBAT_FRAMES_PER_SECOND } from '../time/combatClock';
import type { CombatOperationContext, CombatOperationExecutor } from './skillRuntime';
import type { CompiledSkillCooldownProgram } from '../../compiler/combatProgram';
import type { SkillCooldown } from './skillCooldown';
import type { SkillCooldownSnapshot } from '../state/abilityState';

/** 按施术者与技能身份修改共享账本；来源别名不会导致同一技能重复结算。 */
export function adjustMatchingSkillCooldowns(
  ledgers: ReadonlyMap<
    string,
    {
      readonly program: Pick<CompiledSkillCooldownProgram, 'operatorId' | 'skillId' | 'skillType'>;
      readonly skillIds: ReadonlySet<string>;
      readonly cooldown: SkillCooldown;
    }
  >,
  operatorId: string,
  skill: CombatStepParameters['adjustSkillCooldown']['skill'],
  operation: 'reduce' | 'set',
  basis: 'baseDurationRatio' | 'absoluteFrames',
  value: number,
  record: (skillId: string, snapshot: SkillCooldownSnapshot) => void,
): number {
  const matchedKeys = new Set<string>();
  let changed = 0;
  for (const { program, skillIds } of ledgers.values()) {
    if (
      program.operatorId !== operatorId ||
      (skill.kind === 'type'
        ? program.skillType !== skill.skillType
        : program.skillId !== skill.skillId && !skillIds.has(skill.skillId))
    )
      continue;
    const key = `${operatorId}\u0000${program.skillId}`;
    if (matchedKeys.has(key)) continue;
    matchedKeys.add(key);
    const ledger = ledgers.get(key);
    if (ledger === undefined) continue;
    const cooldown = ledger.cooldown;
    const didChange =
      operation === 'reduce'
        ? basis === 'baseDurationRatio'
          ? cooldown.reduceByBaseDurationRatio(value)
          : cooldown.reduceByFrames(value)
        : basis === 'baseDurationRatio'
          ? cooldown.setByBaseDurationRatio(value)
          : cooldown.setRemainingFrames(value);
    if (!didChange) continue;
    changed++;
    record(ledger.program.skillId, cooldown.snapshot);
  }
  return changed;
}

export interface SkillCooldownOperationExecutorOptions {
  readonly reduceByBaseDurationRatio: (
    skill: CombatStepParameters['adjustSkillCooldown']['skill'],
    ratio: number,
  ) => number;
  readonly reduceByAbsoluteFrames: (
    skill: CombatStepParameters['adjustSkillCooldown']['skill'],
    frames: number,
  ) => number;
  readonly setByBaseDurationRatio: (
    skill: CombatStepParameters['adjustSkillCooldown']['skill'],
    ratio: number,
  ) => number;
  readonly setByAbsoluteFrames: (
    skill: CombatStepParameters['adjustSkillCooldown']['skill'],
    frames: number,
  ) => number;
  readonly delegate: CombatOperationExecutor;
}

/** 执行以施法者技能类型为范围的原生立即冷却修改。 */
export class SkillCooldownOperationExecutor implements CombatOperationExecutor {
  constructor(readonly options: SkillCooldownOperationExecutorOptions) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind !== 'adjustSkillCooldown') {
      return context === undefined
        ? this.options.delegate.execute(step)
        : this.options.delegate.execute(step, context);
    }
    if (context === undefined) {
      throw new Error('adjustSkillCooldown requires a combat operation context');
    }
    const value = resolveActionValueOperand(step.parameters.value, context.blackboard);
    const { operation, basis, skill } = step.parameters;
    if (operation === 'reduce' && basis === 'baseDurationRatio') {
      this.options.reduceByBaseDurationRatio(skill, value);
    } else if (operation === 'reduce' && basis === 'absoluteSeconds') {
      this.options.reduceByAbsoluteFrames(skill, value * COMBAT_FRAMES_PER_SECOND);
    } else if (operation === 'set' && basis === 'baseDurationRatio') {
      this.options.setByBaseDurationRatio(skill, value);
    } else if (operation === 'set' && basis === 'absoluteSeconds') {
      this.options.setByAbsoluteFrames(skill, value * COMBAT_FRAMES_PER_SECOND);
    } else {
      throw new Error(`unsupported skill cooldown adjustment '${operation}/${basis}'`);
    }
    return true;
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind === 'adjustSkillCooldown') return;
    this.options.delegate.end?.(step, context);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    return context === undefined
      ? this.options.delegate.evaluate(condition)
      : this.options.delegate.evaluate(condition, context);
  }
}
