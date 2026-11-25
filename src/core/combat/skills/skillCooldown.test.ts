import { describe, expect, it } from 'vitest';
import { SkillCooldown } from './skillCooldown';

describe('SkillCooldown', () => {
  it('百分比使用已捕获的周期，就绪后设置冷却才重新读取当前修正', () => {
    let addition = 60;
    const cooldown = new SkillCooldown(300, 0, base => base * 2 + addition);
    cooldown.tryReserve();
    cooldown.advance(60);
    addition = 0;
    cooldown.reduceByPeriodRatio(0.5);
    expect(cooldown.snapshot.remainingFrames).toBe(270);
    cooldown.setByPeriodRatio(0.5);
    expect(cooldown.snapshot.remainingFrames).toBe(330);
    cooldown.advance(330);
    cooldown.setByPeriodRatio(0.5);
    expect(cooldown.snapshot.remainingFrames).toBe(300);
  });

  it('零基础冷却在就绪时设置百分比仍读取原生附加秒数', () => {
    const cooldown = new SkillCooldown(0, 0, base => base + 300);
    cooldown.setByPeriodRatio(0.5);
    expect(cooldown.snapshot.remainingFrames).toBe(150);
  });
  it('captures a dynamic period multiplier when the cast reserves cooldown', () => {
    let multiplier = 0.4;
    const cooldown = new SkillCooldown(300, undefined, baseFrames => baseFrames * multiplier);

    expect(cooldown.tryReserve()).toBe(true);
    expect(cooldown.snapshot.remainingFrames).toBe(120);
    cooldown.advance(120);
    multiplier = 0.5;
    expect(cooldown.tryReserve()).toBe(true);
    expect(cooldown.snapshot.remainingFrames).toBe(150);
  });

  it('rejects invalid dynamic period multipliers when reserving', () => {
    const cooldown = new SkillCooldown(300, undefined, () => Number.NaN);
    expect(() => cooldown.tryReserve()).toThrow(/period must be finite/);
  });

  it('does not refund a timeline override when the previous cast finishes before confirmation', () => {
    const cooldown = new SkillCooldown(100, 30);
    cooldown.tryReserve();
    cooldown.advance(5);
    cooldown.overrideByTimeline(false);
    expect(cooldown.finishCast()).toBe(false);
    expect(cooldown.snapshot.remainingFrames).toBe(100);
    cooldown.overrideByTimeline(true);
    expect(cooldown.snapshot.ready).toBe(true);
  });
  it('连携资格快照只接受完整单充能配置，经过时间由配置帧换成秒', () => {
    expect(new SkillCooldown().comboConditionSnapshot).toBeNull();
    expect(new SkillCooldown(300).comboConditionSnapshot).toBeNull();
    const cooldown = new SkillCooldown(300, 30);
    expect(cooldown.comboConditionSnapshot).toEqual({
      oneReady: true,
      maxPassedTime: 0,
      startCdFrame: 30,
    });
    cooldown.tryReserve();
    cooldown.advance(29.5);
    expect(cooldown.comboConditionSnapshot).toEqual({
      oneReady: false,
      maxPassedTime: 29.5 / 30,
      startCdFrame: 30,
    });
    cooldown.advance(0.5);
    expect(cooldown.comboConditionSnapshot?.maxPassedTime).toBe(1);
    cooldown.setProgress(0.5);
    expect(cooldown.comboConditionSnapshot?.maxPassedTime).toBe(5);
    cooldown.advance(150);
    expect(cooldown.comboConditionSnapshot?.oneReady).toBe(true);
  });
  it('reserves, advances and becomes ready at the configured frame', () => {
    const cooldown = new SkillCooldown(4, 0);

    expect(cooldown.snapshot).toEqual({
      configured: true,
      ready: true,
      remainingFrames: 0,
      progress: 1,
    });
    expect(cooldown.tryReserve()).toBe(true);
    expect(cooldown.snapshot.remainingFrames).toBe(4);

    expect(cooldown.advanceFrame()).toBe(false);
    expect(cooldown.advanceFrame()).toBe(false);
    expect(cooldown.advanceFrame()).toBe(false);
    expect(cooldown.advanceFrame()).toBe(true);
    expect(cooldown.snapshot.ready).toBe(true);
  });

  it('preserves fractional effective periods produced by native cooldown multipliers', () => {
    const cooldown = new SkillCooldown(8.5, 0);
    cooldown.tryReserve();

    cooldown.advance(8);
    expect(cooldown.snapshot.remainingFrames).toBeCloseTo(0.5);
    expect(cooldown.advance(0.5)).toBe(true);
    expect(cooldown.snapshot.ready).toBe(true);
  });

  it('refunds a reserved charge only before the recovered commit frame', () => {
    const early = new SkillCooldown(10, 3);
    early.tryReserve();
    early.advanceFrame();
    early.advanceFrame();
    expect(early.finishCast()).toBe(true);
    expect(early.snapshot.ready).toBe(true);

    const committed = new SkillCooldown(10, 3);
    committed.tryReserve();
    committed.advanceFrame();
    committed.advanceFrame();
    committed.advanceFrame();
    expect(committed.finishCast()).toBe(false);
    expect(committed.snapshot.ready).toBe(false);
  });

  it('does not restart an unavailable cooldown for an illegal timeline cast', () => {
    const cooldown = new SkillCooldown(10, 0);
    cooldown.tryReserve();
    cooldown.advanceFrame();
    cooldown.advanceFrame();

    expect(cooldown.tryReserve()).toBe(false);
    expect(cooldown.snapshot.remainingFrames).toBe(8);
  });

  it('treats a skill without cooldown configuration as always ready', () => {
    const cooldown = new SkillCooldown();

    expect(cooldown.tryReserve()).toBe(true);
    expect(cooldown.advanceFrame()).toBe(false);
    expect(cooldown.finishCast()).toBe(false);
    expect(cooldown.snapshot).toEqual({
      configured: false,
      ready: true,
      remainingFrames: 0,
      progress: 1,
    });
  });

  it('reduces the remaining cooldown by a ratio of the configured base duration', () => {
    const cooldown = new SkillCooldown(100, 0);
    cooldown.tryReserve();
    cooldown.advance(10);

    expect(cooldown.reduceByPeriodRatio(0.5)).toBe(true);
    expect(cooldown.snapshot.remainingFrames).toBe(40);
    expect(cooldown.reduceByPeriodRatio(0.5)).toBe(true);
    expect(cooldown.snapshot.ready).toBe(true);
  });

  it('reduces the remaining cooldown by an absolute frame count without going below ready', () => {
    const cooldown = new SkillCooldown(100, 0);
    cooldown.tryReserve();
    cooldown.advance(10);

    expect(cooldown.reduceByFrames(30)).toBe(true);
    expect(cooldown.snapshot.remainingFrames).toBe(60);
    expect(cooldown.reduceByFrames(90)).toBe(true);
    expect(cooldown.snapshot.remainingFrames).toBe(0);
    expect(cooldown.reduceByFrames(1)).toBe(false);
  });

  it('sets remaining cooldown from either the base ratio or absolute frames', () => {
    const cooldown = new SkillCooldown(100, 0);

    expect(cooldown.setByPeriodRatio(0.4)).toBe(true);
    expect(cooldown.snapshot.remainingFrames).toBe(40);
    expect(cooldown.setRemainingFrames(12)).toBe(true);
    expect(cooldown.snapshot.remainingFrames).toBe(12);
    expect(cooldown.setRemainingFrames(0)).toBe(true);
    expect(cooldown.snapshot.ready).toBe(true);
  });

  it('sets a positive native cooldown on a configured zero-period skill', () => {
    const cooldown = new SkillCooldown(0, 0);
    expect(cooldown.setRemainingFrames(240)).toBe(true);
    expect(cooldown.snapshot.remainingFrames).toBe(240);
    expect(cooldown.tryReserve()).toBe(false);
    cooldown.advance(240);
    expect(cooldown.ready).toBe(true);
    expect(cooldown.setByPeriodRatio(1)).toBe(true);
    expect(cooldown.snapshot.remainingFrames).toBe(0);
    // 未配置计时器与已配置零周期不是同一种状态。
    expect(new SkillCooldown().setRemainingFrames(240)).toBe(false);
  });

  it('sets normalized native timer progress across different base durations', () => {
    const source = new SkillCooldown(100, 0);
    const target = new SkillCooldown(40, 0);
    source.tryReserve();
    source.advance(25);

    expect(target.setProgress(source.snapshot.progress)).toBe(true);
    expect(target.snapshot.progress).toBe(0.25);
    expect(target.snapshot.remainingFrames).toBe(30);
    expect(() => target.setProgress(1.1)).toThrow(
      'skill cooldown progress must be a finite number between 0 and 1',
    );
  });
});
