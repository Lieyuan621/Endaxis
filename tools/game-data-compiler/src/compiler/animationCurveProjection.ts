import type { TimeScaleCurveKeyDefinition } from '../../../../packages/game-data-contract/src/conditions.ts';
import type { TimeDilationCurveKeySource } from '../source/timeDilationActions.ts';

/** 原生层保留整数；在输出边界检查契约可表达的权重模式，不断言、不截位或补默认值。 */
export function projectAnimationCurveKeys(
  keys: readonly TimeDilationCurveKeySource[],
  sourcePath: string,
): readonly TimeScaleCurveKeyDefinition[] {
  return keys.map((key, index) => {
    const { weightedMode } = key;
    // AnimationCurveEvaluator：WeightedIn=1、WeightedOut=2，仅支持 0..3。
    if (weightedMode !== 0 && weightedMode !== 1 && weightedMode !== 2 && weightedMode !== 3) {
      throw new Error(`${sourcePath}[${index}].weightedMode: unsupported value ${weightedMode}`);
    }
    return { ...key, weightedMode };
  });
}
