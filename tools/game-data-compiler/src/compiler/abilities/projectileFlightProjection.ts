import {
  bindProjectileTemplateParameters,
  projectileDefinitionNumber,
} from './projectileTemplateParameters.ts';
import { omitsProjectileEnemyCollision } from './projectileSimulationScope.ts';
import type {
  ProjectileFlightDefinition,
  ProjectileFlightTemplateDefinition,
  ProjectilePointDefinition,
} from '../../../../../packages/game-data-contract/src/projectiles.ts';
import type { ProjectileRuntimeSource } from '../../source/projectileRuntime.ts';
import type { ProjectileLaunchActionSource } from '../../source/referenceActions.ts';
import type { TargetReferenceSource } from '../../source/target.ts';
import {
  actionValueOperand,
  isControlledOperatorInstantSearch,
  type CombatActionProjectionContextSource,
} from '../combatProjectionCommon.ts';
import type { IntermediateDefinition } from '../intermediateDefinitions.ts';
import { projectProjectileMovementSource } from './projectileMovementProjection.ts';
import { projectActionTargetQuery } from '../conditions/combatConditionProjection.ts';
import {
  projectProjectileCollisionSource,
  isFixedGoodCharacterTargetFilter,
} from './projectileCollisionProjection.ts';

/** 端点身份与移动参数分别投影；不再把飞行距离折算成固定 Tick 数。 */
export function projectProjectileFlightSource(
  runtime: ProjectileRuntimeSource,
  launch: ProjectileLaunchActionSource,
  context: CombatActionProjectionContextSource,
  path: string,
): IntermediateDefinition<ProjectileFlightDefinition> {
  const start = resolveProjectilePoint(launch.emitPosition, context, `${path}.emitPosition`);
  const points = new Map<string, IntermediateDefinition<ProjectilePointDefinition>>([
    ['LaunchPoint', start],
  ]);
  const endpoint = (key: string): IntermediateDefinition<ProjectilePointDefinition> => {
    const cached = points.get(key);
    if (cached) return cached;
    const preset = launch.presetPoints.find(item => item.key === key);
    const source = preset?.point ?? (key === 'TargetPoint' ? launch.target : undefined);
    if (!source) throw new Error(`${path}: missing projectile endpoint ${key}`);
    const point = resolveProjectilePoint(source, context, `${path}.endpoints.${key}`);
    points.set(key, point);
    return point;
  };
  const { hitBeforeReach, segments, ...template } = bindProjectileTemplateParameters(
    projectProjectileFlightTemplateSource(runtime, path),
  );
  return {
    hitBeforeReach,
    start,
    segments: segments.map(({ targetKey, ...segment }) => ({
      target:
        targetKey === null
          ? resolveProjectilePoint(launch.target, context, `${path}.target`)
          : endpoint(targetKey),
      ...segment,
    })),
    ...template,
  };
}

/** ProjectileData 只声明路径阶段与参数；位置查询由 LaunchProjectile 绑定。 */
export function projectProjectileFlightTemplateSource(
  runtime: ProjectileRuntimeSource,
  path: string,
): ProjectileFlightTemplateDefinition {
  const movement = (id: string) => {
    const mode = runtime.moveModes.get(id);
    if (!mode) throw new Error(`${path}: missing projectile movement mode ${id}`);
    return projectProjectileMovementSource(mode, `${path}.movement.${id}`);
  };
  const segments = runtime.useSegmentMove
    ? runtime.moveSegments.map(segment => {
        return {
          targetKey: segment.endPointKey,
          movement: movement(segment.moveModeId),
          ...(segment.earlyNextByDuration
            ? {
                earlyNextAfterSeconds: {
                  kind: 'constant' as const,
                  value: segment.segmentDuration,
                },
              }
            : {}),
          skipCollision: segment.skipHitAndBlockDetection,
        };
      })
    : [
        {
          targetKey: null,
          movement: movement('Default'),
          skipCollision: false,
        },
      ];
  const shape = runtime.colliderShape;
  const reachRadius =
    shape?.shapeType === 1
      ? Math.min(0.5, shape.radius)
      : shape?.shapeType === 2
        ? Math.min(0.5, ...shape.extent)
        : 0.5;
  const collisionTarget: ProjectilePointDefinition = {
    side: isFixedGoodCharacterTargetFilter(runtime.targetFilter) ? 'operator' : 'enemy',
  };
  const collision = omitsProjectileEnemyCollision(runtime.projectileId, runtime)
    ? undefined
    : projectProjectileCollisionSource(runtime, collisionTarget, path);
  return {
    hitBeforeReach: runtime.useHitBlockReachOrder,
    segments,
    ...(collision === undefined ? {} : { collision }),
    finishDurationSeconds: { kind: 'constant' as const, value: runtime.finishDuration },
    finishDistanceMeters: projectileDefinitionNumber(runtime.finishDistance),
    finishOnReach: runtime.finishOnReach,
    keepMovingOnReach: runtime.keepMoveOnReach,
    reachRadiusMeters: { kind: 'constant' as const, value: reachRadius },
  };
}

function resolveProjectilePoint(
  target: TargetReferenceSource,
  context: CombatActionProjectionContextSource,
  path: string,
): IntermediateDefinition<ProjectilePointDefinition> {
  if (isControlledOperatorInstantSearch(target)) return { side: 'operator' };
  // 固定端点模型中主控及其队伍槽位共用干员位置；只归约位置，不改写命中目标身份。
  if (
    target.postProcessorTypes.length === 1 &&
    target.postProcessorTypes[0] === 'ConvertToSlot' &&
    isControlledOperatorInstantSearch({ ...target, postProcessorTypes: [] })
  )
    return { side: 'operator' };
  const identity = (value: string | undefined): ProjectilePointDefinition | undefined => {
    if (value === 'enemy') return { side: 'enemy' };
    if (
      value === 'caster' ||
      value === 'currentOperator' ||
      (value === 'actionInputTarget' && context.actionInputIsOperator)
    )
      return { side: 'operator' };
    if (value === 'buffOwner') return identity(context.fixedBuffOwnerTarget);
    if (value === 'buffSource') return identity(context.fixedBuffSourceTarget);
    return undefined;
  };
  if (target.targetSource === 'InstantSearch' && target.finderFixedPoint) {
    const fixed = target.finderFixedPoint;
    const verticalOnly = fixed.positionOffset[0] === 0 && fixed.positionOffset[2] === 0;
    if (
      fixed.snapToNavmesh ||
      target.enableAdvancedDirection ||
      (!['SourceForward', 'CameraForward'].includes(target.selectorDirection ?? '') &&
        !verticalOnly)
    )
      throw new Error(
        `${path}: fixed projectile point requires unavailable direction or navigation`,
      );
    const query = projectActionTargetQuery(target, context, path);
    if (query.kind !== 'fixedPoint') throw new Error(`${path}: expected fixed projectile point`);
    return {
      target: query.center,
      offset: {
        local: [
          { kind: 'constant', value: fixed.positionOffset[0] },
          { kind: 'constant', value: fixed.positionOffset[1] },
          { kind: 'constant', value: fixed.positionOffset[2] },
        ],
        facing: 'operatorToEnemy',
        rotation: fixed.rotationOffset,
        centerOnGround: target.centerToGround,
      },
    };
  }
  let result: ProjectilePointDefinition | undefined;
  if (target.targetSource === 'InstantSearch' && target.finderPointOffset) {
    if (
      target.enableAdvancedDirection ||
      target.validatorTypes.length ||
      target.postProcessorTypes.length ||
      target.finderPointOffset.rotation.some(
        value => value.blackboardKey !== null || value.value !== 0,
      )
    )
      throw new Error(`${path}: projectile path point rotation or filtering requires projection`);
    const source = identity(context.actionSourceTarget);
    const center = identity(context.actionTargetTarget);
    if (
      target.centerType !== 'CurrentTarget' ||
      !source ||
      !('side' in source) ||
      source.side !== 'operator' ||
      !center ||
      !('side' in center) ||
      center.side !== 'enemy' ||
      !['TargetToSource', 'SourceToTarget', 'SourceForward'].includes(target.selectorDirection)
    )
      throw new Error(`${path}: projectile path point center or direction requires projection`);
    const values = target.finderPointOffset.position;
    return {
      target: { kind: 'fixed', target: 'enemy' },
      offset: {
        centerOnGround: target.centerToGround,
        local: [
          actionValueOperand(values[0]),
          actionValueOperand(values[1]),
          actionValueOperand(values[2]),
        ],
        facing:
          target.selectorDirection === 'TargetToSource' ? 'enemyToOperator' : 'operatorToEnemy',
      },
    };
  }
  switch (target.targetSource) {
    case 'MainCharacter':
      result = { side: 'operator' };
      break;
    case 'MainTarget':
      result = { side: 'enemy' };
      break;
    case 'Source':
      result = identity(context.actionSourceTarget);
      break;
    case 'Owner':
      result = identity(context.actionOwnerTarget);
      break;
    case 'Target':
      result = identity(context.actionTargetTarget);
      break;
    case 'Context': {
      const key = target.targetGroupKey;
      if (context.staticEnemyTargetGroupKeys?.has(key)) result = { side: 'enemy' };
      else if (context.operatorTargetGroupKeys?.has(key)) result = { side: 'operator' };
      else result = identity(context.contextTargetGroupTargets?.get(key));
      break;
    }
  }
  return result ?? { target: projectActionTargetQuery(target, context, path) };
}
