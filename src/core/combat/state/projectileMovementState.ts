import type { ProjectileFlightDefinition } from '../../../../packages/game-data-contract/src/projectiles';
import type { ActionValueExpression } from '../../../../packages/game-data-contract/src/conditions';

export type ProjectilePosition = readonly [number, number, number];
export type ProjectileValue = Exclude<ActionValueExpression, { kind: 'valueNode' | 'parameter' }>;
export type ProjectileResolvedPoint =
  { readonly side: 'operator' | 'enemy' } | { readonly position: ProjectilePosition };
type ResolvePoints<T> = T extends ProjectileFlightDefinition['start']
  ? ProjectileResolvedPoint
  : T extends { readonly kind: 'valueNode' }
    ? ProjectileValue
    : T extends object
      ? { [Key in keyof T]: ResolvePoints<T[Key]> }
      : T;
export type ResolvedProjectileFlight = ResolvePoints<ProjectileFlightDefinition>;

/** 参数不可变；下面的移动进度与投射物身份一起进入切面，不保存宿主回调。 */
export interface ProjectileMovementState {
  readonly definition: ResolvedProjectileFlight;
  readonly operatorEnemyDistanceMeters: number;
  readonly launchPosition: ProjectilePosition;
  position: ProjectilePosition;
  previousPosition: ProjectilePosition;
  segmentStart: ProjectilePosition;
  targetPosition: ProjectilePosition;
  segmentIndex: number;
  elapsedSeconds: number;
  scaledElapsedSeconds: number;
  distanceScale: number;
  travelDurationSeconds: number;
  horizontalSpeed: number;
  verticalSpeed: number;
  gravity: number;
  traceLimit: number;
  traceRemainingSeconds: number;
  controlPoints: readonly ProjectilePosition[];
  reached: boolean;
  firstTick: boolean;
  ring: { innerRadius: number; outerRadius: number; previousInnerRadius: number } | null;
}
