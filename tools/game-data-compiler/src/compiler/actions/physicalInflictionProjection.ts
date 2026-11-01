import type { CombatStepParameters } from '../intermediateDefinitions.ts';
import { COMPILED_BUFF_TARGET_KINDS } from '../buffs/compiledBuffMetadata.ts';
import { projectActionTargetQuery } from '../conditions/combatConditionProjection.ts';
import type {
  AirborneActionSource,
  PhysicalInflictionActionSource,
} from '../../source/physicalInflictionActions.ts';
import type { CompiledBuffStepSource } from './combatActionProjectionTypes.ts';
import {
  actionValueOperand,
  inferBuffTargetKind,
  type CombatActionProjectionContextSource,
  type ProjectedTargetGroup,
} from '../combatProjectionCommon.ts';

/**
 * 物理异常会改变后续伤害和事件，不能按表现动作裁剪。空间位移、朝向和硬直只影响
 * 敌人主动表现，在固定木桩模型中不进入正式协议；公共 Buff 由定义目录统一提供，Buff 身份由物理异常类型固定确定。
 */
export function projectPhysicalInflictionAction(
  action: AirborneActionSource | PhysicalInflictionActionSource,
  path: string,
  context: CombatActionProjectionContextSource,
  targetGroups: ReadonlyMap<string, ProjectedTargetGroup> = new Map(),
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
        targetGroups,
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
        targetGroups,
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
      targetGroups,
    ),
  };
}

/** 查询身份留给运行时；闭包只使用可证明的宿主种类，未知来源不能默认成干员。 */
export function physicalInflictionParameters<
  T extends CombatStepParameters['applyPhysicalInfliction'],
>(
  parameters: T,
  context: CombatActionProjectionContextSource,
  targetGroups: ReadonlyMap<string, ProjectedTargetGroup> = new Map(),
): T {
  const source = inferBuffTargetKind(parameters.source, context, targetGroups);
  return Object.assign(parameters, {
    [COMPILED_BUFF_TARGET_KINDS]: {
      target:
        parameters.type === 'crush' || parameters.type === 'fracture'
          ? 'enemy'
          : inferBuffTargetKind(parameters.target, context, targetGroups),
      ...(source === 'caster' ? {} : { source }),
    },
  });
}
