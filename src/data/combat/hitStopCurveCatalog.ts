import type { TimeScaleCurveKeyDefinition } from '../../core/game-data/operatorDefinition';
import { HIT_STOP_NAMED_CURVE_DEFINITIONS } from './hitStopCurveCatalog.generated';

export {
  HIT_STOP_NAMED_CURVE_DEFINITIONS,
  HIT_STOP_NAMED_CURVE_KEYS,
  type HitStopNamedCurveKey,
} from './hitStopCurveCatalog.generated';

export function hitStopNamedCurveKeys(
  keyName: string,
): readonly TimeScaleCurveKeyDefinition[] | undefined {
  return (
    HIT_STOP_NAMED_CURVE_DEFINITIONS as Readonly<
      Record<string, readonly TimeScaleCurveKeyDefinition[]>
    >
  )[keyName];
}
