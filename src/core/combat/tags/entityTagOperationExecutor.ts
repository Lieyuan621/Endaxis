import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { CompiledCondition } from '../../compiler/compiledGraphData';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { GameplayTag } from './gameplayTags';

interface EntityTagTarget {
  addEntityTags(tags: readonly GameplayTag[]): void;
  removeEntityTags(tags: readonly GameplayTag[]): void;
}

/** AddTagAction 的句柄由动作持有；多个动作和 Buff 的同名标签分别计数。 */
export class EntityTagOperationExecutor implements CombatOperationExecutor {
  constructor(
    readonly queryTargets: CombatOperationExecutor['queryTargets'],
    readonly resolveTarget: (target: RuntimeTargetRef) => EntityTagTarget | undefined,
    readonly delegate: CombatOperationExecutor,
  ) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind !== 'addEntityTags') return this.delegate.execute(step, context);
    const state = context?.actionEntityTagsState;
    if (!state || !context || !this.queryTargets)
      throw new Error('entity tag action requires target queries and action state');
    const targets = this.queryTargets(step.parameters.targets, context);
    this.end(step, context);
    for (const target of targets) {
      const entity = this.resolveTarget(target);
      if (!entity) continue;
      for (const tag of step.parameters.tags) {
        // 每个标签分别保存句柄；同步监听可能在添加过程中结束动作。
        const reference = { target, tag };
        state.references.push(reference);
        entity.addEntityTags([tag]);
        if (!state.references.includes(reference)) return false;
      }
    }
    return state.references.length > 0;
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind !== 'addEntityTags') return this.delegate.end?.(step, context);
    const state = context?.actionEntityTagsState;
    if (!state) throw new Error('entity tag action requires action state');
    const references = state.references;
    state.references = [];
    for (const { target, tag } of references) this.resolveTarget(target)?.removeEntityTags([tag]);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    return this.delegate.evaluate(condition, context);
  }
}
