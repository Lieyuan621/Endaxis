import { type SkillCastStartPreparation } from '../state/foundationState';
/** 技能已经提交、尚未开始时保存的目标和黑板准备值；不包含执行回调。 */
import type { CombatOperationContext } from './skillRuntime';

/** 在技能初值恢复与开始回执之后、费用和第零帧动作之前应用一次准备值。 */
export function applySkillCastStartPreparation(
  preparation: SkillCastStartPreparation,
  context: CombatOperationContext,
): void {
  if (context.targetContext === undefined) throw new Error('combo cast requires target context');
  if (preparation.trigger !== undefined)
    context.targetContext.setSingle('trigger', preparation.trigger);
  if (preparation.smartTarget !== undefined)
    context.targetContext.setSingle('smart_target', preparation.smartTarget);
  if (preparation.trigger !== undefined && preparation.assignPairs !== null) {
    context.blackboard.assign(preparation.assignPairs);
  }
}
