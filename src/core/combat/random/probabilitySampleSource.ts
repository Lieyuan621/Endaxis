import type { RandomSampleRequest } from './simulationRandom';

/** `RandomUtil.Dice(float)` 使用的独立随机样本端口。 */
export interface ProbabilitySampleSource {
  nextProbabilitySample(request?: RandomSampleRequest): number;
}

/** 用于录像对照和确定性测试的有限样本流。 */
export class ExplicitProbabilitySampleSource implements ProbabilitySampleSource {
  readonly #samples: readonly number[];
  #index = 0;

  constructor(samples: readonly number[]) {
    for (const sample of samples) assertProbabilitySample(sample);
    this.#samples = [...samples];
  }

  nextProbabilitySample(): number {
    const sample = this.#samples[this.#index];
    if (sample === undefined) throw new Error('probability sample source is exhausted');
    this.#index += 1;
    return sample;
  }
}

export function assertProbabilitySample(sample: number): void {
  if (!Number.isFinite(sample) || sample < 0 || sample > 1) {
    throw new RangeError('probability samples must be finite values in [0, 1]');
  }
}
