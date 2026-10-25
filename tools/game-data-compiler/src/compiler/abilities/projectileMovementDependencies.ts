import type { ProjectileRuntimeSource } from '../../source/projectileRuntime.ts';
import type { ScalarSource } from '../../source/scalar.ts';

/** 移动也是实体变量的消费者，不能只按回调动作裁剪初值和写入。 */
export function projectileMovementBlackboardReads(
  runtime: ProjectileRuntimeSource,
): ReadonlySet<string> {
  const inputs: ScalarSource[] = [runtime.finishDistance];
  const ids = runtime.useSegmentMove
    ? runtime.moveSegments.map(segment => segment.moveModeId)
    : ['Default'];
  for (const id of new Set(ids)) {
    const mode = runtime.moveModes.get(id);
    if (!mode) throw new Error(`${runtime.projectileId}: missing movement mode ${id}`);
    inputs.push(mode.speed);
    if (mode.traceType === 2) inputs.push(mode.traceTime);
    if (mode.traceType === 3) inputs.push(mode.traceUntilDistance);
    if (mode.limitAngularSpeed) inputs.push(mode.angularSpeed);
    if (mode.moveType === 1) {
      if (mode.parabolaDef === 0) inputs.push(mode.gravity);
      else inputs.push(mode.travelDuration, mode.vertexYOffset);
    }
    if (mode.moveType === 2 || mode.moveType === 3) {
      const points =
        mode.moveType === 2 ? [mode.bezierMidPoint1] : [mode.bezierMidPoint1, mode.bezierMidPoint2];
      for (const point of points) {
        if (!point.usePresetPoint)
          inputs.push(...point.xRatioRange, ...point.yzAngleRange, ...point.yzRadiusRange);
      }
    }
  }
  return new Set(
    inputs.flatMap(input => (input.blackboardKey === null ? [] : [input.blackboardKey])),
  );
}
