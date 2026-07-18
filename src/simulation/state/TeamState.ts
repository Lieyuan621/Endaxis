import type { SpGainKind } from '@/simulation/compiler/types.ts';
import type { BaseGameState } from '@/simulation/state/BaseGameState.ts';
import type { TeamSnapshot, TeamConfig } from '@/simulation/state/types.ts';
import type { SimulationEngine } from '../engine/SimulationEngine';

export class TeamState implements BaseGameState<TeamSnapshot> {
  private recoverSp: number;
  private refundSp: number = 0;
  private debtSp: number = 0;
  private isSpRegenPaused: boolean = false;
  private spRegenPauseDuration: number = 0;

  constructor(
    readonly config: TeamConfig,
    _engine: SimulationEngine,
  ) {
    this.recoverSp = Math.max(0, Number(config.initialSp) || 0);
    if (this.recoverSp > this.config.maxSp) {
      this.recoverSp = this.config.maxSp;
    }
  }

  advanceTime(dt: number, currentTime: number) {
    const prepEnd = Number(this.config.prepDuration) || 0;
    if (prepEnd <= 0) {
      this.regenSp(dt);
      return;
    }

    const startTime = currentTime - dt;
    const effectiveStart = Math.max(startTime, prepEnd);
    const effectiveDuration = currentTime - effectiveStart;
    if (effectiveDuration > 0) {
      this.regenSp(effectiveDuration);
    }
  }

  snapshot(): TeamSnapshot {
    return {
      sp: this.getSp(),
      recoverSp: this.recoverSp,
      refundSp: this.refundSp,
      debtSp: this.debtSp,
      spRecovered: this.recoverSp,
      spReturned: this.refundSp,
      spRegenRate: this.config.spRegenRate,
      maxSp: this.config.maxSp,
      isSpRegenPaused: this.isSpRegenPaused,
      spRegenPauseDuration: this.spRegenPauseDuration,
    };
  }

  getSp(): number {
    return this.getPositiveSp() - this.debtSp;
  }

  getRecoverSp() {
    return this.recoverSp;
  }

  getRefundSp() {
    return this.refundSp;
  }

  getSpRecovered() {
    return this.recoverSp;
  }

  getSpReturned() {
    return this.refundSp;
  }

  getDebtSp() {
    return this.debtSp;
  }

  addSp(amount: number, kind: SpGainKind = 'recover'): number {
    if (!Number.isFinite(amount) || amount <= 0) {
      return this.getSp();
    }

    let remaining = amount;

    if (this.debtSp > 0) {
      const repaid = Math.min(this.debtSp, remaining);
      this.debtSp -= repaid;
      remaining -= repaid;
    }

    if (remaining <= 0) {
      return this.getSp();
    }

    if (kind === 'refund') {
      this.refundSp += remaining;
      this.trimOverflow('refund');
      return this.getSp();
    }

    this.recoverSp += remaining;
    this.trimOverflow('recover');
    return this.getSp();
  }

  modifySpRecovery(amount: number): number {
    return this.addSp(amount, 'recover');
  }

  modifySpReturn(amount: number): number {
    return this.addSp(amount, 'refund');
  }

  consumeSp(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        sp: this.getSp(),
        recoverConsumed: 0,
        refundConsumed: 0,
        recoveredConsumed: 0,
        returnedConsumed: 0,
        debtIncurred: 0,
      };
    }

    let remaining = amount;
    const refundConsumed = Math.min(this.refundSp, remaining);
    this.refundSp -= refundConsumed;
    remaining -= refundConsumed;

    const recoverConsumed = Math.min(this.recoverSp, remaining);
    this.recoverSp -= recoverConsumed;
    remaining -= recoverConsumed;

    if (remaining > 0) {
      this.debtSp += remaining;
    }

    return {
      sp: this.getSp(),
      recoverConsumed,
      refundConsumed,
      recoveredConsumed: recoverConsumed,
      returnedConsumed: refundConsumed,
      debtIncurred: remaining,
    };
  }

  pauseSpRegen(duration: number) {
    this.isSpRegenPaused = true;
    this.spRegenPauseDuration += duration;
  }

  private regenSp(dt: number) {
    // Keep regen running while refund SP remains to displace: regen adds to recover and
    // trimOverflow('recover') converts refund → recover (so a later spend draws recover SP → UE).
    if (this.recoverSp >= this.config.maxSp && this.refundSp <= 0) {
      return;
    }

    let effectiveDuration = dt;

    if (this.isSpRegenPaused) {
      if (dt < this.spRegenPauseDuration) {
        this.spRegenPauseDuration -= dt;
        return;
      }

      effectiveDuration -= this.spRegenPauseDuration;
      this.isSpRegenPaused = false;
      this.spRegenPauseDuration = 0;
    }

    const gain = effectiveDuration * this.config.spRegenRate;
    this.addSp(gain, 'recover');
  }

  private getPositiveSp() {
    return this.recoverSp + this.refundSp;
  }

  private trimOverflow(preferredKind: SpGainKind) {
    let overflow = Math.max(0, this.getPositiveSp() - this.config.maxSp);
    if (overflow <= 0) {
      return;
    }

    if (preferredKind === 'recover' && this.refundSp > 0) {
      const displacedRefund = Math.min(this.refundSp, overflow);
      this.refundSp -= displacedRefund;
      overflow -= displacedRefund;
    }

    if (overflow <= 0) {
      return;
    }

    if (preferredKind === 'refund') {
      this.refundSp = Math.max(0, this.refundSp - overflow);
      return;
    }

    this.recoverSp = Math.max(0, this.recoverSp - overflow);
  }
}
