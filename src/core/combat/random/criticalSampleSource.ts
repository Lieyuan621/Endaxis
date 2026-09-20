/**
 * 玩家主动伤害共享的暴击随机样本端口及已恢复的 56 项减法随机流。
 * 原生初始化算法还没做通，因此这里只接受完整状态或显式测试样本，不提供 seed 便捷构造。
 */
const BATTLE_RANDOM_STATE_LENGTH = 56;
const BATTLE_RANDOM_MAX_VALUE = 0x7fffffff;

import type { RandomSampleRequest } from './simulationRandom';
import type { BattleRandomState } from '../state/environmentState';

/** 一场战斗持有的有状态暴击样本来源。 */
export interface CriticalSampleSource {
  nextCriticalSample(request?: RandomSampleRequest): number;
}

/**
 * 编辑器使用的确定性均匀样本流。
 *
 * 它按二进制 Van der Corput 序列依次返回 0.5、0.25、0.75、0.125……，让任意较短前缀也能
 * 覆盖 0 到 1。该序列只用于原生随机状态未知时稳定地近似暴击事件，不代表游戏原生随机数。
 * 每次完整模拟都必须新建实例，保证结果不受此前运行次数影响。
 */
export class EvenCriticalSampleSource implements CriticalSampleSource {
  #index = 1;

  nextCriticalSample(): number {
    let index = this.#index;
    let sample = 0;
    let place = 0.5;
    while (index > 0) {
      sample += (index % 2) * place;
      index = Math.floor(index / 2);
      place *= 0.5;
    }
    this.#index += 1;
    return sample;
  }
}

/** 精确复刻当前反编译版本单步推进规则的 56 项减法随机流。 */
export class SubtractiveBattleRandom implements CriticalSampleSource {
  readonly #values: number[];
  #currentIndex: number;
  #pairedIndex: number;

  constructor(state: BattleRandomState) {
    assertIndex(state.currentIndex, 'currentIndex');
    assertIndex(state.pairedIndex, 'pairedIndex');
    if (state.values.length !== BATTLE_RANDOM_STATE_LENGTH) {
      throw new RangeError(`battle random state must contain ${BATTLE_RANDOM_STATE_LENGTH} values`);
    }
    for (const value of state.values) {
      if (!Number.isInteger(value) || value < 0 || value >= BATTLE_RANDOM_MAX_VALUE) {
        throw new RangeError(
          `battle random state values must be integers in [0, ${BATTLE_RANDOM_MAX_VALUE})`,
        );
      }
    }
    this.#currentIndex = state.currentIndex;
    this.#pairedIndex = state.pairedIndex;
    this.#values = [...state.values];
  }

  nextCriticalSample(): number {
    const currentIndex = advanceIndex(this.#currentIndex);
    const pairedIndex = advanceIndex(this.#pairedIndex);
    let value = this.#values[currentIndex]! - this.#values[pairedIndex]!;
    if (value === BATTLE_RANDOM_MAX_VALUE) value -= 1;
    if (value < 0) value += BATTLE_RANDOM_MAX_VALUE;
    this.#values[currentIndex] = value;
    this.#currentIndex = currentIndex;
    this.#pairedIndex = pairedIndex;
    return Math.fround(value * (1 / BATTLE_RANDOM_MAX_VALUE));
  }

  captureState(): BattleRandomState {
    return {
      currentIndex: this.#currentIndex,
      pairedIndex: this.#pairedIndex,
      values: [...this.#values],
    };
  }
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

function advanceIndex(index: number): number {
  const next = index + 1;
  return next < BATTLE_RANDOM_STATE_LENGTH ? next : 1;
}

function assertIndex(index: number, name: string): void {
  if (!Number.isInteger(index) || index < 0 || index >= BATTLE_RANDOM_STATE_LENGTH) {
    throw new RangeError(`${name} must be an integer in [0, ${BATTLE_RANDOM_STATE_LENGTH})`);
  }
}
