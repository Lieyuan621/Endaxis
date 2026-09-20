import type { CombatStepParameters } from '../../../../../packages/game-data-contract/src/actions.ts';
import type { KnockDownActionSource } from '../../source/physicalInflictionActions.ts';
import {
  actionValueOperand,
  type CombatActionProjectionContextSource,
} from '../combatProjectionCommon.ts';

/** 普通根倒地：仅投影已证明的干员来源和固定敌人，不涉及防反、部位或浮空转入。 */
export function projectKnockDownAction(
  action: KnockDownActionSource,
  path: string,
  context: CombatActionProjectionContextSource,
): {
  readonly kind: 'applyKnockDown';
  readonly parameters: CombatStepParameters['applyKnockDown'];
} {
  const fixedEnemy =
    (action.target.targetSource === 'Target' && context.actionTargetTarget === 'enemy') ||
    (action.target.targetSource === 'Context' &&
      context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true);
  const fixedCasterSource =
    (action.source.targetSource === 'Source' &&
      action.source.targetGroupKey === '' &&
      context.actionSourceTarget === 'caster') ||
    (action.source.targetSource === 'Owner' &&
      action.source.targetGroupKey === '' &&
      context.actionOwnerTarget === 'caster');
  if (!fixedCasterSource || !fixedEnemy) {
    throw new Error(`${path}: unsupported knock-down source/target`);
  }
  if (action.isExtra) throw new Error(`${path}: extra knock-down requires BuffAddContext support`);
  const returnWhen = {
    Always: 'always',
    BothSuccessAndInterrupted: 'successAndInterrupted',
    OnlySuccess: 'success',
    OnlyInterrupted: 'interrupted',
  } as const satisfies Record<
    KnockDownActionSource['returnTrueWhen'],
    CombatStepParameters['applyKnockDown']['returnWhen']
  >;
  // 朝向只影响空间/动画；immobilizedTime 只传给敌人动作中断，木桩不安装该主动行为。
  // duration 仍在执行点求值，不写入隐式状态 Buff；两条隐式引用由公共引用收集器维护。
  return {
    kind: 'applyKnockDown',
    parameters: {
      target: 'enemy',
      duration: actionValueOperand(action.duration),
      force: action.forceKnockDown,
      isExtra: false,
      targetFilter: action.deadOption === 'OnlyDead' ? 'skipAll' : 'aliveOnly',
      returnWhen: returnWhen[action.returnTrueWhen],
    },
  };
}
