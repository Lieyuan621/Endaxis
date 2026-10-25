import { parseScalarSource, type ScalarSource } from './scalar.ts';
import {
  requireArray,
  requireBoolean,
  requireInteger,
  requireNonEmptyString,
  requireRecord,
  requireString,
} from './primitives.ts';
import {
  parseTimeDilationCurveKeys,
  type TimeDilationCurveKeySource,
} from './timeDilationActions.ts';

export interface ProjectileCurveSource {
  readonly keys: readonly TimeDilationCurveKeySource[];
  readonly preInfinity: number;
  readonly postInfinity: number;
}

interface BezierPointSource {
  readonly usePresetPoint: boolean;
  readonly presetPointKey: string;
  readonly xRatioRange: readonly [ScalarSource, ScalarSource];
  readonly yzAngleRange: readonly [ScalarSource, ScalarSource];
  readonly yzRadiusRange: readonly [ScalarSource, ScalarSource];
  readonly scaledYzRadius: boolean;
}

export interface ProjectileMoveModeSource {
  readonly moveType: number;
  readonly traceType: number;
  readonly traceTime: ScalarSource;
  readonly traceUntilDistance: ScalarSource;
  readonly speed: ScalarSource;
  readonly speedCurve: ProjectileCurveSource;
  readonly useSpeedScaleWithDistance: boolean;
  readonly speedScaleWithDistance: ProjectileCurveSource;
  readonly lockVelocityToXZ: boolean;
  readonly groundedMove: boolean;
  readonly limitAngularSpeed: boolean;
  readonly angularSpeed: ScalarSource;
  readonly angularSpeedCurve: ProjectileCurveSource;
  readonly parabolaDef: number;
  readonly travelDuration: ScalarSource;
  readonly vertexYOffset: ScalarSource;
  readonly gravity: ScalarSource;
  readonly bezierMidPoint1: BezierPointSource;
  readonly bezierMidPoint2: BezierPointSource;
}

/** 只接受完整移动记录，旧导出的错误字段边界不能作为零距离或非零距离证明。 */
export function parseProjectileMoveModes(
  value: unknown,
  path: string,
): ReadonlyMap<string, ProjectileMoveModeSource> {
  const dictionary = requireRecord(value, path);
  if (dictionary.$decoded !== true) throw new Error(`${path}: full movement decoding is required`);
  const result = new Map<string, ProjectileMoveModeSource>();
  for (const [index, entry] of requireArray(dictionary.values, `${path}.values`).entries()) {
    const at = `${path}.values[${index}]`;
    const mode = requireRecord(entry, at);
    if (mode.$decoded !== true) throw new Error(`${at}: full movement decoding is required`);
    const id = requireNonEmptyString(mode.key, `${at}.key`);
    if (result.has(id)) throw new Error(`${at}.key: duplicate move mode ${JSON.stringify(id)}`);
    const scalar = (key: string) => parseScalarSource(mode[key], `${at}.${key}`, {});
    const flag = (key: string) => requireBoolean(mode[key], `${at}.${key}`);
    const enumeration = (key: string) =>
      requireInteger(requireRecord(mode[key], `${at}.${key}`).value, `${at}.${key}.value`);
    result.set(id, {
      moveType: enumeration('moveType'),
      traceType: enumeration('traceType'),
      traceTime: scalar('traceTime'),
      traceUntilDistance: scalar('traceUntilDistance'),
      speed: scalar('speed'),
      speedCurve: parseProjectileCurve(mode.speedCurve, `${at}.speedCurve`),
      useSpeedScaleWithDistance: flag('useSpeedScaleWithDistance'),
      speedScaleWithDistance: parseProjectileCurve(
        mode.speedScaleWithDistance,
        `${at}.speedScaleWithDistance`,
      ),
      lockVelocityToXZ: flag('lockVelocityToXZ'),
      groundedMove: flag('groundedMove'),
      limitAngularSpeed: flag('limitAngularSpeed'),
      angularSpeed: scalar('angularSpeed'),
      angularSpeedCurve: parseProjectileCurve(mode.angularSpeedCurve, `${at}.angularSpeedCurve`),
      parabolaDef: enumeration('parabolaDef'),
      travelDuration: scalar('travelDuration'),
      vertexYOffset: scalar('vertexYOffset'),
      gravity: scalar('gravity'),
      bezierMidPoint1: parseBezierPoint(mode.bezierMidPoint1, `${at}.bezierMidPoint1`),
      bezierMidPoint2: parseBezierPoint(mode.bezierMidPoint2, `${at}.bezierMidPoint2`),
    });
  }
  return result;
}

function parseBezierPoint(value: unknown, path: string): BezierPointSource {
  const point = requireRecord(value, path);
  const range = (key: string): readonly [ScalarSource, ScalarSource] => {
    const value = requireRecord(point[key], `${path}.${key}`);
    return [
      parseScalarSource(value.x, `${path}.${key}.x`, {}),
      parseScalarSource(value.y, `${path}.${key}.y`, {}),
    ];
  };
  return {
    usePresetPoint: requireBoolean(point.usePresetPoint, `${path}.usePresetPoint`),
    presetPointKey: requireString(point.presetPointKey, `${path}.presetPointKey`),
    xRatioRange: range('xRatioRange'),
    yzAngleRange: range('yzAngleRange'),
    yzRadiusRange: range('yzRadiusRange'),
    scaledYzRadius: requireBoolean(point.scaledYzRadius, `${path}.scaledYzRadius`),
  };
}

function parseProjectileCurve(value: unknown, path: string): ProjectileCurveSource {
  const curve = requireRecord(value, path);
  // VFS 使用 Unity 序列化字段名；关键帧验证和无穷切线解释复用已有曲线解析。
  const keys = requireArray(curve.keys, `${path}.keys`).map((raw, index) => {
    const key = requireRecord(raw, `${path}.keys[${index}]`);
    const { inSlope, outSlope, ...rest } = key;
    return { ...rest, inTangent: inSlope, outTangent: outSlope };
  });
  return {
    keys: parseTimeDilationCurveKeys(keys, `${path}.keys`, true),
    preInfinity: requireInteger(curve.preInfinity, `${path}.preInfinity`),
    postInfinity: requireInteger(curve.postInfinity, `${path}.postInfinity`),
  };
}
