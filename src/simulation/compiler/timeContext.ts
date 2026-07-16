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
    let changed = true;

    while (changed) {
      changed = false;
      for (const ext of this.extensions) {
        if (ext.sourceId === excludeActionId) continue;
        if (processedExtensions.has(ext.sourceId)) continue;

        if (ext.time >= startTime && ext.time < currentTimeLimit) {
          currentTimeLimit = round(currentTimeLimit + ext.amount);
          processedExtensions.add(ext.sourceId);
          changed = true;
        }
      }
    }
    return currentTimeLimit;
  }
}
