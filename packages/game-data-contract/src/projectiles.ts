import type { GameplayTag, GameplayTagQueryType } from './gameplayTags.ts';
import type {
  ActionTargetQuery,
  ActionValueOperand,
  SpatialPointOffsetDefinition,
  TimeScaleCurveKeyDefinition,
} from './conditions.ts';

/** 使用角色所在端点，不模拟骨骼、武器挂点及其偏移。 */
export type ProjectilePointDefinition =
  | { readonly side: 'operator' | 'enemy' }
  | {
      readonly target: ActionTargetQuery;
      /** 资源明确配置的路径点偏移，不包含骨骼挂点偏移。 */
      readonly offset?: SpatialPointOffsetDefinition;
    };

export interface ProjectileMovementDefinition {
  readonly trace:
    | { readonly kind: 'none' }
    | { readonly kind: 'always' }
    | { readonly kind: 'duration'; readonly seconds: ActionValueOperand }
    | { readonly kind: 'distance'; readonly meters: ActionValueOperand };
  readonly speed: ActionValueOperand;
  readonly speedCurve: readonly TimeScaleCurveKeyDefinition[];
  readonly distanceScaleCurve?: readonly TimeScaleCurveKeyDefinition[];
  readonly path:
    | { readonly kind: 'straight' }
    | {
        readonly kind: 'parabola';
        readonly definition:
          | { readonly kind: 'speedGravity'; readonly gravity: ActionValueOperand }
          | {
              readonly kind: 'vertexDuration';
              readonly durationSeconds: ActionValueOperand;
              readonly vertexOffsetMeters: ActionValueOperand;
            };
      }
    | {
        readonly kind: 'bezier';
        /** 原生控制点范围，在每段开始时求值和取样。 */
        readonly controlPoints:
          | readonly [ProjectileBezierPointDefinition]
          | readonly [ProjectileBezierPointDefinition, ProjectileBezierPointDefinition];
      };
}

export interface ProjectileBezierPointDefinition {
  readonly distanceRatioRange: readonly [ActionValueOperand, ActionValueOperand];
  readonly angleDegreesRange: readonly [ActionValueOperand, ActionValueOperand];
  readonly radiusMetersRange: readonly [ActionValueOperand, ActionValueOperand];
  readonly scaleWithDistance: boolean;
}

/** 投射物实例独立持有飞行进度，技能动作图只保存这些不可变参数。 */
export interface ProjectileFlightDefinition {
  /** 原生 useHitBlockReachOrder；省略时先到达再碰撞。 */
  readonly hitBeforeReach?: boolean;
  readonly start: ProjectilePointDefinition;
  /** 固定端点模型以目标位置作为碰撞点，不还原角色碰撞体。 */
  readonly collision?: { readonly target: ProjectilePointDefinition } & (
    | { readonly kind: 'sphere'; readonly radiusMeters: ActionValueOperand }
    | {
        readonly kind: 'box';
        /** 原生局部坐标：X 横向、Y 竖向、Z 向前；这不是发射挂点偏移。 */
        readonly centerMeters: readonly [
          ActionValueOperand,
          ActionValueOperand,
          ActionValueOperand,
        ];
        readonly halfExtentsMeters: readonly [
          ActionValueOperand,
          ActionValueOperand,
          ActionValueOperand,
        ];
      }
    | {
        readonly kind: 'ring';
        readonly innerRadiusMeters: ActionValueOperand;
        readonly outerRadiusMeters: ActionValueOperand;
        readonly innerRadiusSpeed: ActionValueOperand;
        readonly outerRadiusSpeed: ActionValueOperand;
        readonly heightMeters: ActionValueOperand;
      }
  );
  readonly segments: readonly {
    readonly target: ProjectilePointDefinition;
    readonly movement: ProjectileMovementDefinition;
    readonly earlyNextAfterSeconds?: ActionValueOperand;
    readonly skipCollision: boolean;
  }[];
  readonly finishDurationSeconds: ActionValueOperand;
  readonly finishDistanceMeters: ActionValueOperand;
  readonly finishOnReach: boolean;
  /** 独立落地弹以下穿落点高度触发 Block，不要求命中目标点。 */
  readonly landingAtTarget?: boolean;
  readonly keepMovingOnReach: boolean;
  readonly reachRadiusMeters: ActionValueOperand;
}

/** ProjectileData 的数值参数直接读取投射物变量，不引用发射技能的数据节点。 */
export type ProjectileDefinitionNumber =
  | { readonly kind: 'constant'; readonly value: number }
  | { readonly blackboardKey: string; readonly fallback?: number };

type ProjectileTemplateParameters<T> = T extends ActionValueOperand
  ? ProjectileDefinitionNumber
  : T extends object
    ? { [K in keyof T]: ProjectileTemplateParameters<T[K]> }
    : T;

/** 原生投射物路径定义；路径点名称由发射动作绑定到实际目标。 */
export type ProjectileFlightTemplateDefinition = ProjectileTemplateParameters<
  Omit<ProjectileFlightDefinition, 'start' | 'segments' | 'landingAtTarget'> & {
    readonly segments: readonly (Omit<ProjectileFlightDefinition['segments'][number], 'target'> & {
      /** null 使用发射动作的目标；其他值引用该动作的具名预设点。 */
      readonly targetKey: string | null;
    })[];
  }
>;

/** LaunchProjectile 的端点绑定；移动和碰撞参数由 projectileId 指定的资源提供。 */
export interface ProjectileLaunchDefinition {
  readonly start: ProjectilePointDefinition;
  readonly segmentTargets: readonly ProjectilePointDefinition[];
  /** 独立落地回调的固定端点近似。 */
  readonly landingAtTarget?: boolean;
}

/** 原生投射物资源；发射动作只引用它并绑定本次发射输入。 */
export interface ProjectileDefinition {
  readonly flight: ProjectileFlightTemplateDefinition;
  readonly hit?: ProjectileHitDefinition;
  /** 回调和移动实际读取的实体黑板初值。 */
  readonly blackboard: Readonly<Record<string, number>>;
}

/** ProjectileData 的命中规则；发射目标在动作上绑定。 */
export interface ProjectileHitDefinition {
  readonly onReach?: boolean;
  readonly target?: 'allOperators';
  readonly finishOnHit: boolean;
  readonly maxHitCount?: number;
  readonly repeatIntervalSeconds?: number;
  readonly hitTagFilter?: { tagQueryType: GameplayTagQueryType; tags: readonly GameplayTag[] };
  readonly retryRejectedHit?: boolean;
}
