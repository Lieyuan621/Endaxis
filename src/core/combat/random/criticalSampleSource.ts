/** 暴击随机样本端口；正式模拟由 SimulationRandomSource 提供样本。 */
import type { RandomSampleRequest } from './simulationRandom';

/** 一场战斗持有的有状态暴击样本来源。 */
export interface CriticalSampleSource {
  nextCriticalSample(request?: RandomSampleRequest): number;
}

/** 用于精确测试或人工录像对照的有限样本流；耗尽后不会循环或回退到其他随机源。 */
export class ExplicitCriticalSampleSource implements CriticalSampleSource {
  readonly #samples: readonly number[];
  #index = 0;

  constructor(samples: readonly number[]) {
    for (const sample of samples) {
      if (!Number.isFinite(sample) || sample < 0 || sample > 1) {
        throw new RangeError('critical samples must be finite values in [0, 1]');
      }
    }
    this.#samples = [...samples];
  }

  nextCriticalSample(): number {
    const sample = this.#samples[this.#index];
    if (sample === undefined) throw new Error('critical sample source is exhausted');
    this.#index += 1;
    return sample;
  }
}
