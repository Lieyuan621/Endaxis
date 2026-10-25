import { offsetSpatialPoint, spatialPointDirection } from './spatialPointPosition';
import {
  valueInputExpression,
  type CompiledInputs,
  type CompiledTargetQuery,
  type CompiledValueInput,
} from '../../compiler/compiledGraphData';
import type { ProjectileFlightDefinition } from '../../../../packages/game-data-contract/src/projectiles';
import type {
  ProjectilePosition,
  ProjectileResolvedPoint,
  ResolvedProjectileFlight,
} from '../state/projectileMovementState';
type CompiledProjectileFlight = CompiledInputs<ProjectileFlightDefinition>;

/** 发射时固定端点；移动和切面恢复不再读取发射者的 Context。 */
export function resolveProjectileFlightEndpoints(
  flight: CompiledProjectileFlight,
  resolve: (target: CompiledTargetQuery, role: 'start' | 'target') => ProjectilePosition,
  resolveValue?: (value: CompiledValueInput) => number,
): ResolvedProjectileFlight {
  const point = (
    value: CompiledProjectileFlight['start'],
    role: 'start' | 'target' = 'target',
  ): ProjectileResolvedPoint => {
    if ('side' in value) return value;
    const position = resolve(value.target, role);
    if (value.offset) {
      if (!resolveValue) throw new Error('projectile path offset requires action value evaluation');
      return {
        position: offsetSpatialPoint(
          position,
          value.offset.local.map(resolveValue),
          value.offset,
          spatialPointDirection(value.offset.facing, query => resolve(query, 'target')),
        ),
      };
    }
    return { position: [position[0], position[1], position[2]] };
  };
  const resolved = {
    ...flight,
    start: point(flight.start, 'start'),
    segments: flight.segments.map(segment => ({ ...segment, target: point(segment.target) })),
    collision:
      flight.collision === undefined
        ? undefined
        : { ...flight.collision, target: point(flight.collision.target) },
  };
  // 只解引用叶值，不提前读取变量；命中回调改写的实体变量仍在后续 Tick 生效。
  const detach = (value: unknown): unknown => {
    if (value === null || typeof value !== 'object') return value;
    if ('kind' in value && value.kind === 'valueNode') {
      const expression = valueInputExpression(value as CompiledValueInput);
      if (expression.kind === 'parameter') throw new Error('unbound projectile macro parameter');
      return { ...expression };
    }
    if (Array.isArray(value)) return value.map(detach);
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, detach(child)]));
  };
  return detach(resolved) as ResolvedProjectileFlight;
}
