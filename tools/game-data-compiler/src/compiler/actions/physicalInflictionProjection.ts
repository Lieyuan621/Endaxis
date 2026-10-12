import type {
  AirborneActionSource,
  PhysicalInflictionActionSource,
} from '../../source/physicalInflictionActions.ts';
import type { CompiledBuffStepSource } from './combatActionProjectionTypes.ts';
import {
  actionValueOperand,
  type CombatActionProjectionContextSource,
} from '../combatProjectionCommon.ts';

/**
 * 物理异常会改变后续伤害和事件，不能按表现动作裁剪。空间位移、朝向和硬直只影响
 * 敌人主动表现，在固定木桩模型中不进入正式协议；公共 Buff 由定义目录统一提供，Buff 身份由物理异常类型固定确定。
 */
export function projectPhysicalInflictionAction(
  action: AirborneActionSource | PhysicalInflictionActionSource,
  path: string,
  context: CombatActionProjectionContextSource,
): Extract<CompiledBuffStepSource, { readonly kind: 'applyPhysicalInfliction' }> {
  const fixedEnemy =
    (action.target.targetSource === 'Target' && context.actionTargetTarget === 'enemy') ||
    (action.target.targetSource === 'Context' &&
      context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true);
  const source = action.kind === 'airborne' ? action.source : action.attacker;
  const fixedCasterSource =
    (source.targetSource === 'Owner' &&
      source.targetGroupKey === '' &&
      context.actionOwnerTarget === 'caster') ||
    (source.targetSource === 'Source' &&
      source.targetGroupKey === '' &&
      context.actionSourceTarget === 'caster');
  if (!fixedCasterSource || !fixedEnemy)
    throw new Error(`${path}: unsupported physical-infliction attacker/target`);

  if (action.kind === 'airborne') {
    const returnWhen = {
      Always: 'always',
      BothSuccessAndInterrupted: 'successAndInterrupted',
      OnlySuccess: 'success',
      OnlyInterrupted: 'interrupted',
    } as const;
    return {
      kind: 'applyPhysicalInfliction',
      parameters: {
        type: 'airborne',
        target: 'enemy',
        isExtra: action.isExtra,
        duration: actionValueOperand(action.floatingDuration),
        height: actionValueOperand(action.floatingHeight),
        speedFactorMultiplier: action.speedFactorMultiplier,
        force: action.forceAirborne,
        targetFilter: action.deadOption === 'OnlyDead' ? 'skipAll' : 'aliveOnly',
        returnWhen: returnWhen[action.returnTrueWhen],
      },
    };
  }
  if (action.deadOption === 'OnlyDead')
    throw new Error(
      `${path}: dead-only physical infliction is outside the fixed living stump model`,
    );

  if (action.kind === 'fracture') {
    return {
      kind: 'applyPhysicalInfliction',
      parameters: {
        type: 'fracture',
        target: 'enemy',
        isExtra: action.isExtra,
      },
    };
  }
  return {
    kind: 'applyPhysicalInfliction',
    parameters: {
      type: 'crush',
      target: 'enemy',
      isExtra: action.isExtra,
      damageMultiplier: actionValueOperand(action.damageMultiplier),
      ignoreHitEffect: action.ignoreHitEffect,
    },
  };
}
