import { physicalInflictionParameters } from './physicalInflictionProjection.ts';
import { projectActionTargetQuery } from '../conditions/combatConditionProjection.ts';
import type { CombatStepParameters } from '../intermediateDefinitions.ts';
import type { KnockDownActionSource } from '../../source/physicalInflictionActions.ts';
import {
  actionValueOperand,
  type CombatActionProjectionContextSource,
} from '../combatProjectionCommon.ts';

/** 普通根倒地：来源和目标通过通用查询解析，不涉及防反或浮空转入。 */
export function projectKnockDownAction(
  action: KnockDownActionSource,
  path: string,
  context: CombatActionProjectionContextSource,
): {
  readonly kind: 'applyPhysicalInfliction';
  readonly parameters: Extract<
    CombatStepParameters['applyPhysicalInfliction'],
    { type: 'knockDown' }
  >;
} {
  const returnWhen = {
    Always: 'always',
    BothSuccessAndInterrupted: 'successAndInterrupted',
    OnlySuccess: 'success',
    OnlyInterrupted: 'interrupted',
  } as const satisfies Record<
    KnockDownActionSource['returnTrueWhen'],
    Extract<CombatStepParameters['applyPhysicalInfliction'], { type: 'knockDown' }>['returnWhen']
  >;
  // 朝向只影响空间/动画；immobilizedTime 只传给敌人动作中断，木桩不安装该主动行为。
  // duration 仍在执行点求值，不写入隐式状态 Buff；两条隐式引用由公共引用收集器维护。
  return {
    kind: 'applyPhysicalInfliction',
    parameters: physicalInflictionParameters(
      {
        type: 'knockDown',
        source: projectActionTargetQuery(action.source, context, `${path}.source`),
        target: projectActionTargetQuery(action.target, context, `${path}.target`),
        duration: actionValueOperand(action.duration),
        force: action.forceKnockDown,
        isExtra: action.isExtra,
        targetFilter: action.deadOption === 'OnlyDead' ? 'skipAll' : 'aliveOnly',
        returnWhen: returnWhen[action.returnTrueWhen],
      },
      context,
    ),
  };
}
