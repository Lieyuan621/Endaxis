import type { NativeActionNodeSource } from '../../source/controlFlow.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { FinishOwnerActionSource } from '../../source/lifecycleActions.ts';
import type { CombatActionProjectionContextSource } from '../combatProjectionCommon.ts';
import type {
  CompiledBuffConditionSource,
  CompiledBuffStepSource,
} from './combatActionProjectionTypes.ts';

/** 原生 JumpTo 在 Execute/Tick 重试条件；不能投影成只执行一次的普通条件分支。 */
export function projectTimelineJump(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
  context: CombatActionProjectionContextSource,
  compileCondition: (
    node: NativeActionNodeSource<KnownNativeActionLeafSource>,
  ) => CompiledBuffConditionSource | null,
): CompiledBuffStepSource | null {
  if (node.body.kind !== 'timelineJump') return null;
  const { destinationFrame, condition } = node.body;
  // 只开放已有原生证据的向前跳转，跨目标帧后不得再尝试反向跳转。
  if (
    !context.timelineRange ||
    !Number.isInteger(destinationFrame) ||
    destinationFrame <= context.timelineRange.startFrame ||
    destinationFrame < context.timelineRange.endFrame
  )
    throw new Error(`${node.sourcePath}: timeline jump requires a proven forward timeline range`);
  if (condition.onlyExecuteWhenSourceIsMainCharacter || condition.onlyExecuteWhenSourceIsGuard)
    throw new Error(`${node.sourcePath}: timeline jump condition root filters are unsupported`);
  const conditions: CompiledBuffConditionSource[] = [];
  let negateNext = false;
  for (const item of condition.actions.filter(item => item.metadata.enabled)) {
    if (item.body.kind === 'negateNextResult') {
      if (negateNext) throw new Error(`${item.sourcePath}: consecutive condition negation`);
      negateNext = true;
      continue;
    }
    const value = compileCondition(item);
    if (value === null)
      throw new Error(`${item.sourcePath}: timeline jump requires pure conditions`);
    conditions.push(negateNext ? { kind: 'not', condition: value } : value);
    negateNext = false;
  }
  if (negateNext) throw new Error(`${node.sourcePath}: dangling timeline jump condition negation`);
  return {
    kind: 'jumpTimeline',
    parameters: {
      destinationFrame,
      ...(conditions.length === 0
        ? {}
        : {
            condition:
              conditions.length === 1 ? conditions[0]! : { kind: 'all' as const, conditions },
          }),
    },
  };
}

/** FinishOwner 的 AbilityEntity 死亡分支；释放仍由运行时下一次 advance 处理。 */
export function projectFinishOwner(
  action: FinishOwnerActionSource,
  context: CombatActionProjectionContextSource,
  sourcePath: string,
): CompiledBuffStepSource {
  if (
    !['currentAbilityEntity', 'buffOwner'].includes(context.actionOwnerTarget) ||
    action.owner.targetSource !== 'Owner' ||
    action.owner.targetGroupKey !== '' ||
    action.owner.finderType !== null ||
    action.owner.validatorTypes.length ||
    action.owner.postProcessorTypes.length
  )
    throw new Error(
      `${sourcePath}: unsupported FinishOwner target; expected an AbilityEntity-backed Owner`,
    );
  if (context.actionOwnerTarget === 'currentAbilityEntity') {
    // 子技能内层 ForEach 会临时覆盖 currentTarget；ActionOwner 身份必须保存在独立端口。
    return { kind: 'finishActionOwnerAbilityEntity', parameters: {} };
  }
  // Buff 蓝图在安装前不知道宿主实体种类；能力实体 Buff 的生命周期运行时会把该宿主
  // 作为 currentTarget 传入。若同一定义被错误装到普通角色，运行时会保持严格并报错。
  // skipDieDisplay 只控制死亡表现；Next 无渲染后端，不能把死亡替换为同步释放。
  return { kind: 'finishCurrentAbilityEntity', parameters: {} };
}
