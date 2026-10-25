import { projectAnimationCurveKeys } from '../animationCurveProjection.ts';
import type { ProjectileFlightTemplateDefinition } from '../../../../../packages/game-data-contract/src/projectiles.ts';
import type {
  ProjectileMoveModeSource,
  ProjectileCurveSource,
} from '../../source/projectileMovement.ts';
import { projectileDefinitionNumber } from './projectileTemplateParameters.ts';

type Movement = ProjectileFlightTemplateDefinition['segments'][number]['movement'];

/** 只投影参数，飞行积分和到达判断属于投射物运行时。 */
export function projectProjectileMovementSource(
  source: ProjectileMoveModeSource,
  path: string,
): Movement {
  if (source.limitAngularSpeed || source.lockVelocityToXZ)
    throw new Error(
      `${path}: constrained projectile direction needs an explicit spatial projection`,
    );
  const trace = projectTrace(source, path);
  const common = {
    trace,
    speed: projectileDefinitionNumber(source.speed),
    speedCurve: projectCurve(source.speedCurve, `${path}.speedCurve`),
    ...(source.useSpeedScaleWithDistance
      ? {
          distanceScaleCurve: projectCurve(
            source.speedScaleWithDistance,
            `${path}.speedScaleWithDistance`,
          ),
        }
      : {}),
  };
  switch (source.moveType) {
    case 0:
      return { ...common, path: { kind: 'straight' } };
    case 1: {
      if (source.parabolaDef !== 0 && source.parabolaDef !== 1)
        throw new Error(`${path}: unsupported parabola definition ${source.parabolaDef}`);
      return {
        ...common,
        path: {
          kind: 'parabola',
          definition:
            source.parabolaDef === 0
              ? { kind: 'speedGravity', gravity: projectileDefinitionNumber(source.gravity) }
              : {
                  kind: 'vertexDuration',
                  durationSeconds: projectileDefinitionNumber(source.travelDuration),
                  vertexOffsetMeters: projectileDefinitionNumber(source.vertexYOffset),
                },
        },
      };
    }
    case 2:
    case 3: {
      const point = (value: ProjectileMoveModeSource['bezierMidPoint1']) => {
        if (value.usePresetPoint)
          throw new Error(
            `${path}: preset Bezier control point ${value.presetPointKey} requires point resolution`,
          );
        const range = (values: typeof value.xRatioRange) =>
          [projectileDefinitionNumber(values[0]), projectileDefinitionNumber(values[1])] as const;
        return {
          distanceRatioRange: range(value.xRatioRange),
          angleDegreesRange: range(value.yzAngleRange),
          radiusMetersRange: range(value.yzRadiusRange),
          scaleWithDistance: value.scaledYzRadius,
        };
      };
      return {
        ...common,
        path: {
          kind: 'bezier',
          controlPoints:
            source.moveType === 2
              ? [point(source.bezierMidPoint1)]
              : [point(source.bezierMidPoint1), point(source.bezierMidPoint2)],
        },
      };
    }
    default:
      throw new Error(`${path}: unsupported projectile movement ${source.moveType}`);
  }
}

function projectTrace(source: ProjectileMoveModeSource, path: string): Movement['trace'] {
  switch (source.traceType) {
    case 0:
      return { kind: 'none' };
    case 1:
      return { kind: 'always' };
    case 2:
      return { kind: 'duration', seconds: projectileDefinitionNumber(source.traceTime) };
    case 3:
      return { kind: 'distance', meters: projectileDefinitionNumber(source.traceUntilDistance) };
    default:
      throw new Error(`${path}: unsupported trace type ${source.traceType}`);
  }
}

function projectCurve(source: ProjectileCurveSource, path: string) {
  if (source.preInfinity !== 2 || source.postInfinity !== 2)
    throw new Error(`${path}: projectile curve requires a supported extrapolation mode`);
  return projectAnimationCurveKeys(source.keys, path);
}
