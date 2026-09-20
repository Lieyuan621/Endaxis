/**
 * 场景模拟使用的随机策略。
 *
 * 期望模式让连续数值使用数学期望，并用均匀序列安排无法取平均的离散事件；随机模式则从
 * 可复现的伪随机流取样。两种模式向战斗运行时提供相同的样本接口，具体技能无需维护两套实现；
 * 直接伤害只在统一的伤害执行器中选择写入期望值或本次取样值。
 */
import type { SimulationRandomState } from '../state/environmentState';
import type { CriticalSampleSource } from './criticalSampleSource';
import type { ProbabilitySampleSource } from './probabilitySampleSource';

export type SimulationRandomMode = 'expected' | 'sampled';

/** 一次随机取样的稳定归属；技能块种子只接管带有对应 castId 的取样。 */
export interface RandomSampleRequest {
  readonly castId?: string;
  /** 期望模式中独立安排离散结果的来源身份；避免无关来源互相挤占均匀序列。 */
  readonly expectedSequenceId?: string;
}

export interface SimulationRandomSettings {
  readonly mode: SimulationRandomMode;
  /** 32 位无符号整数。相同场景、种子和执行顺序得到相同结果。 */
  readonly globalSeed: number;
}

/**
 * 把伤害与概率取样端口绑定到当前分支的随机状态。
 * getState 每次取样时解析当前数据，不跨调用缓存分支状态；恢复或回退后同一对象可立即读取新分支。
 */
export class SimulationRandomSource implements CriticalSampleSource, ProbabilitySampleSource {
  readonly #settings: SimulationRandomSettings;
  readonly #getState: () => SimulationRandomState;

  constructor(settings: SimulationRandomSettings, getState: () => SimulationRandomState) {
    assertSeed(settings.globalSeed, 'globalSeed');
    this.#settings = { mode: settings.mode, globalSeed: settings.globalSeed };
    this.#getState = getState;
    const state = this.#getState();
    bindSimulationRandomConfiguration(state, this.#settings);
    if (this.#settings.mode === 'sampled') {
      for (const [castId, usedSeed] of state.usedCastSeeds) {
        if (this.#selectedSeed(state, castId) !== usedSeed) {
          throw new Error(`random seed selection for consumed cast '${castId}' does not match`);
        }
      }
    }
  }

  nextCriticalSample(request?: RandomSampleRequest): number {
    return this.#next('critical', request);
  }

  #selectedSeed(state: SimulationRandomState, castId: string): number | null {
    return state.submittedCastSeeds.get(castId) ?? null;
  }

  nextProbabilitySample(request?: RandomSampleRequest): number {
    return this.#next('probability', request);
  }

  #next(kind: 'critical' | 'probability', request: RandomSampleRequest | undefined): number {
    const castId = request?.castId;
    const state = this.#getState();
    const castSeed =
      castId === undefined ? undefined : (this.#selectedSeed(state, castId) ?? undefined);
    if (this.#settings.mode === 'sampled' && castId !== undefined) {
      const usedSeed = state.usedCastSeeds.get(castId);
      const selectedSeed = castSeed ?? null;
      if (usedSeed !== undefined && usedSeed !== selectedSeed) {
        throw new Error(`random seed selection for consumed cast '${castId}' does not match`);
      }
      state.usedCastSeeds.set(castId, selectedSeed);
    }
    return takeSimulationRandomSample(state, this.#settings, kind, {
      ...request,
      ...(castSeed === undefined ? {} : { castSeed }),
    });
  }
}

/** 输入时只登记选择，不预先创建随机流，也不消费样本。 */
export function submitSimulationCastSeed(
  state: SimulationRandomState,
  castId: string,
  seed?: number,
): void {
  if (castId.length === 0) throw new RangeError('cast seed id must not be empty');
  if (seed !== undefined) assertSeed(seed, `cast seed '${castId}'`);
  const selected = seed ?? null;
  const previous = state.submittedCastSeeds.has(castId)
    ? state.submittedCastSeeds.get(castId)
    : state.usedCastSeeds.get(castId);
  if (previous !== undefined && previous !== selected)
    throw new Error(`cannot change submitted random seed '${castId}'`);
  state.submittedCastSeeds.set(castId, selected);
}

/**
 * 在当前步进中消费一个样本。只读取本次来源，不能查询整条轴的未来种子表。
 * 期望模式和随机模式共享此入口，流划分与整数运算顺序保持原有规则。
 */
export function takeSimulationRandomSample(
  state: SimulationRandomState,
  settings: { readonly mode: SimulationRandomMode; readonly globalSeed: number },
  kind: 'critical' | 'probability',
  request?: RandomSampleRequest & { readonly castSeed?: number },
): number {
  bindSimulationRandomConfiguration(state, settings);
  if (settings.mode === 'expected') {
    if (request?.castSeed !== undefined) {
      if (request.castId === undefined || request.castId.length === 0)
        throw new Error('a cast seed requires a non-empty cast id');
      const streamKey = `${kind}:cast:${request.castId}`;
      const shift = mixSeed(request.castSeed, streamKey) / 0x100000000;
      return (takeEvenSample(state, streamKey) + shift) % 1;
    }
    const scope =
      request?.expectedSequenceId === undefined ? 'global' : `source:${request.expectedSequenceId}`;
    return takeEvenSample(state, `${kind}:${scope}`);
  }
  const castSeed = request?.castSeed;
  if (castSeed !== undefined && (request?.castId === undefined || request.castId.length === 0))
    throw new Error('a cast seed requires a non-empty cast id');
  const scope = castSeed === undefined ? 'global' : `cast:${request!.castId}`;
  const streamKey = `${kind}:${scope}`;
  let previous = state.streams.get(streamKey);
  if (previous === undefined) {
    const seed = castSeed ?? settings.globalSeed;
    assertSeed(seed, 'random stream seed');
    previous = mixSeed(seed, streamKey);
  }
  const next = (previous + 0x6d2b79f5) >>> 0;
  state.streams.set(streamKey, next);
  return mulberry32Sample(next);
}

function bindSimulationRandomConfiguration(
  state: SimulationRandomState,
  settings: { readonly mode: SimulationRandomMode; readonly globalSeed: number },
): void {
  const existing = state.configuration;
  if (existing === null) {
    state.configuration = { mode: settings.mode, globalSeed: settings.globalSeed };
    return;
  }
  if (existing.mode !== settings.mode || existing.globalSeed !== settings.globalSeed) {
    throw new Error('restored random configuration does not match saved combat state');
  }
}

function takeEvenSample(state: SimulationRandomState, streamKey: string): number {
  const index = (state.evenIndices.get(streamKey) ?? 0) + 1;
  state.evenIndices.set(streamKey, index);
  let remaining = index;
  let sample = 0;
  let place = 0.5;
  while (remaining > 0) {
    sample += (remaining % 2) * place;
    remaining = Math.floor(remaining / 2);
    place *= 0.5;
  }
  return sample;
}

function assertSeed(seed: number, label: string): void {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError(`${label} must be a 32-bit unsigned integer`);
  }
}

function mixSeed(seed: number, text: string): number {
  let value = seed >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

function mulberry32Sample(state: number): number {
  let value = state;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
}
