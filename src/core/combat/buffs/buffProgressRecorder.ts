import type { CombatBuff } from './combatBuffs';
import type { BuffProgressCurveState, BuffProgressRecorderState } from '../state/environmentState';

export interface BuffProgressPoint {
  readonly frame: number;
  readonly ratio: number | null;
}

export interface BuffProgressCurve {
  readonly targetId: string;
  readonly buffId: string;
  readonly instanceId: number;
  readonly showInBattleSkillButton: boolean;
  readonly showInUltimateButton: boolean;
  readonly showInHpBar: boolean;
  readonly weakBattleSkillStyle: boolean;
  readonly points: readonly BuffProgressPoint[];
}

function curveKey(targetId: string, buffId: string, instanceId: number): string {
  return `${targetId}\u0000${buffId}\u0000${instanceId}`;
}

function runtimeKey(targetId: string, instanceId: number): string {
  return `${targetId}\u0000${instanceId}`;
}

function ratio(remaining: number | null, duration: number | null): number | null {
  if (remaining === null || duration === null || duration <= 1e-6) return null;
  return Math.min(1, Math.max(0, remaining / duration));
}

function compact(points: readonly BuffProgressPoint[]): readonly BuffProgressPoint[] {
  const result: BuffProgressPoint[] = [];
  for (const point of points) {
    const previous = result.at(-1);
    if (previous?.frame === point.frame) {
      result[result.length - 1] = point;
      continue;
    }
    result.push(point);
    while (result.length >= 3) {
      const left = result.at(-3)!;
      const middle = result.at(-2)!;
      const right = result.at(-1)!;
      if (left.ratio === null || middle.ratio === null || right.ratio === null) break;
      const expected =
        left.ratio +
        ((right.ratio - left.ratio) * (middle.frame - left.frame)) / (right.frame - left.frame);
      if (Math.abs(expected - middle.ratio) > 1e-7) break;
      result.splice(result.length - 2, 1);
    }
  }
  return result;
}

/** 只记录原生 HUD 进度控件明确消费的 Buff；逐帧采样后压缩共线点。 */
export class BuffProgressRecorder {
  constructor(
    readonly runtimeState: BuffProgressRecorderState = {
      curves: new Map(),
      runtimeCurveKeys: new Map(),
    },
  ) {}

  register(
    targetId: string,
    buff: CombatBuff<string>,
    buffId: string,
    presentation: NonNullable<CombatBuff<string>['definition']['presentation']> | undefined,
    frame: number,
    forceTrack = false,
  ): void {
    const showInBattleSkillButton = presentation?.showProgressInNormalSkillButton === true;
    const showInUltimateButton = presentation?.showProgressInUltimateSkillButton === true;
    const showInHpBar = presentation?.showProgressInHpBar === true;
    if (!forceTrack && !showInBattleSkillButton && !showInUltimateButton && !showInHpBar) return;
    const key = curveKey(targetId, buffId, buff.instanceId);
    let curve = this.runtimeState.curves.get(key);
    if (curve === undefined) {
      curve = {
        targetId,
        buffId,
        instanceId: buff.instanceId,
        showInBattleSkillButton,
        showInUltimateButton,
        showInHpBar,
        weakBattleSkillStyle: presentation?.useWeakProgressInNormalSkillButton === true,
        durationSeconds: buff.remainingDuration,
        points: [],
      };
      this.runtimeState.curves.set(key, curve);
      const ownerKey = runtimeKey(targetId, buff.instanceId);
      const keys = this.runtimeState.runtimeCurveKeys.get(ownerKey) ?? new Set<string>();
      keys.add(key);
      this.runtimeState.runtimeCurveKeys.set(ownerKey, keys);
    } else {
      // 重复施加会重新触发按钮指针，但叠层本身不等价于重置总时长；只有实际剩余时长
      // 超过此前分母时才扩展显示区间，避免把半途叠层错误画回 100%。
      if (
        buff.remainingDuration !== null &&
        (curve.durationSeconds === null || buff.remainingDuration > curve.durationSeconds)
      ) {
        curve.durationSeconds = buff.remainingDuration;
      }
    }
    this.#sampleCurve(curve, buff.remainingDuration, frame);
  }

  sample(targetId: string, buffs: readonly CombatBuff<string>[], frame: number): void {
    for (const buff of buffs) {
      if (buff.isFinished) continue;
      const keys = this.runtimeState.runtimeCurveKeys.get(runtimeKey(targetId, buff.instanceId));
      if (keys === undefined) continue;
      for (const key of keys) {
        const curve = this.runtimeState.curves.get(key);
        if (curve !== undefined) this.#sampleCurve(curve, buff.remainingDuration, frame);
      }
    }
  }

  finish(targetId: string, buff: CombatBuff<string>, frame: number): void {
    const keys = this.runtimeState.runtimeCurveKeys.get(runtimeKey(targetId, buff.instanceId));
    if (keys === undefined) return;
    for (const key of keys) {
      const curve = this.runtimeState.curves.get(key);
      if (curve !== undefined) this.#sampleCurve(curve, 0, frame);
    }
    this.runtimeState.runtimeCurveKeys.delete(runtimeKey(targetId, buff.instanceId));
  }

  snapshot(): readonly BuffProgressCurve[] {
    return Object.freeze(
      [...this.runtimeState.curves.values()].map(curve =>
        Object.freeze({
          targetId: curve.targetId,
          buffId: curve.buffId,
          instanceId: curve.instanceId,
          showInBattleSkillButton: curve.showInBattleSkillButton,
          showInUltimateButton: curve.showInUltimateButton,
          showInHpBar: curve.showInHpBar,
          weakBattleSkillStyle: curve.weakBattleSkillStyle,
          points: Object.freeze(compact(curve.points).map(point => Object.freeze({ ...point }))),
        }),
      ),
    );
  }

  #sampleCurve(curve: BuffProgressCurveState, remaining: number | null, frame: number): void {
    curve.points.push({ frame, ratio: ratio(remaining, curve.durationSeconds) });
  }
}
