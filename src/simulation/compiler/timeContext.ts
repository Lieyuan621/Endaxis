import type { TimeExtension } from './types';

function round(num: number, factor: number = 1000): number {
  return Math.round(num * factor) / factor;
}

export class TimeContext {
  constructor(private readonly extensions: TimeExtension[]) {}

  toGameTime(realTime: number): number {
    for (const ext of this.extensions) {
      const freezeRealStart = ext.gameTime + ext.cumulativeFreezeTime;
      const freezeRealEnd = freezeRealStart + ext.amount;

      if (realTime >= freezeRealStart && realTime < freezeRealEnd) {
        return ext.gameTime;
      }

      if (realTime < freezeRealStart) {
        return realTime - ext.cumulativeFreezeTime;
      }
    }

    const last = this.extensions[this.extensions.length - 1];
    if (last) {
      const totalOffset = last.cumulativeFreezeTime + last.amount;
      return realTime - totalOffset;
    }

    return realTime;
  }

  toRealTime(gameTime: number): number {
    const reversedExtensions = [...this.extensions].reverse();
    const breakPoint = reversedExtensions.find(e => e.gameTime <= gameTime);

    if (!breakPoint) return gameTime;

    if (gameTime === breakPoint.gameTime) {
      return gameTime + breakPoint.cumulativeFreezeTime;
    }

    return gameTime + breakPoint.cumulativeFreezeTime + breakPoint.amount;
  }

  getShiftedEndTime(
    startTime: number,
    duration: number,
    excludeActionId: string | null = null,
  ): number {
    let currentTimeLimit = startTime + duration;
    const processedExtensions = new Set<string>();
    // Compiler extensions are ordered by real start. Skip the unrelated prefix;
    // walking forward also visits any later freezes reached by an extension.
    let lo = 0;
    let hi = this.extensions.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.extensions[mid]!.time < startTime) lo = mid + 1;
      else hi = mid;
    }
    for (let index = lo; index < this.extensions.length; index++) {
      const ext = this.extensions[index]!;
      if (ext.time >= currentTimeLimit) break;
      if (ext.sourceId === excludeActionId || processedExtensions.has(ext.sourceId)) continue;
      currentTimeLimit = round(currentTimeLimit + ext.amount);
      processedExtensions.add(ext.sourceId);
    }
    return currentTimeLimit;
  }
}
