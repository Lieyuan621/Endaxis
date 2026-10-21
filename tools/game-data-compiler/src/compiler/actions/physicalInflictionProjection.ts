import type { ActionTargetQuery, CombatStepParameters } from '../intermediateDefinitions.ts';
import { COMPILED_BUFF_TARGET_KINDS } from '../buffs/compiledBuffMetadata.ts';
import { projectActionTargetQuery } from '../conditions/combatConditionProjection.ts';
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
  const source = action.kind === 'airborne' ? action.source : action.attacker;
  if (action.kind === 'airborne') {
    const returnWhen = {
      Always: 'always',
      BothSuccessAndInterrupted: 'successAndInterrupted',
      OnlySuccess: 'success',
      OnlyInterrupted: 'interrupted',
    } as const;
    return {
      kind: 'applyPhysicalInfliction',
      parameters: physicalInflictionParameters(
        {
          type: 'airborne',
          source: projectActionTargetQuery(source, context, `${path}.source`),
          target: projectActionTargetQuery(action.target, context, `${path}.target`),
          isExtra: action.isExtra,
          duration: actionValueOperand(action.floatingDuration),
          height: actionValueOperand(action.floatingHeight),
          speedFactorMultiplier: action.speedFactorMultiplier,
          force: action.forceAirborne,
          targetFilter: action.deadOption === 'OnlyDead' ? 'skipAll' : 'aliveOnly',
          returnWhen: returnWhen[action.returnTrueWhen],
        },
        context,
      ),
    };
  }
  if (action.deadOption === 'OnlyDead')
    throw new Error(
      `${path}: dead-only physical infliction is outside the fixed living stump model`,
    );

  if (action.kind === 'fracture') {
    return {
      kind: 'applyPhysicalInfliction',
      parameters: physicalInflictionParameters(
        {
          type: 'fracture',
          source: projectActionTargetQuery(source, context, `${path}.source`),
          target: projectActionTargetQuery(action.target, context, `${path}.target`),
          isExtra: action.isExtra,
        },
        context,
      ),
    };
  }
  return {
    kind: 'applyPhysicalInfliction',
    parameters: physicalInflictionParameters(
      {
        type: 'crush',
        source: projectActionTargetQuery(source, context, `${path}.source`),
        target: projectActionTargetQuery(action.target, context, `${path}.target`),
        isExtra: action.isExtra,
        damageMultiplier: actionValueOperand(action.damageMultiplier),
        ignoreHitEffect: action.ignoreHitEffect,
      },
      context,
    ),
  };
}

/** 查询身份留给运行时；闭包只使用可证明的宿主种类，未知来源不能默认成干员。 */
export function physicalInflictionParameters<
  T extends CombatStepParameters['applyPhysicalInfliction'],
>(parameters: T, context: CombatActionProjectionContextSource): T {
  const kind = (query: ActionTargetQuery): string => {
    if (query.kind === 'fixed') return query.target;
    if (query.kind === 'context' && context.staticEnemyTargetGroupKeys?.has(query.key))
      return 'enemy';
    if (query.kind === 'owner') return context.fixedBuffOwnerTarget ?? context.actionOwnerTarget;
    if (query.kind === 'source') return context.fixedBuffSourceTarget ?? context.actionSourceTarget;
    if (query.kind === 'inputTarget') return context.actionTargetTarget ?? 'unknown';
    if (query.kind === 'characterTeam' || query.kind === 'mainCharacter') return 'caster';
    if (query.kind === 'battleMainTarget' || query.kind === 'enemyByTags') return 'enemy';
    if (query.kind === 'buffFilter' || query.kind === 'exclude') return kind(query.targets);
    return 'unknown';
  };
  const source = kind(parameters.source);
  return Object.assign(parameters, {
    [COMPILED_BUFF_TARGET_KINDS]: {
      target:
        parameters.type === 'crush' || parameters.type === 'fracture'
          ? 'enemy'
          : kind(parameters.target),
      ...(source === 'caster' ? {} : { source }),
    },
  });
}
