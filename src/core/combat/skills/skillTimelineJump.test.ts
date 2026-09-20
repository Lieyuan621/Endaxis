import { describe, expect, it } from 'vitest';
import { isSkillTimelineJumpBeforeCurrent, SkillTimelineJumpGate } from './skillTimelineJump';

describe('native Skill.JumpTo lower bound', () => {
  it('ignores backwards targets but accepts equal and forward positions', () => {
    expect(isSkillTimelineJumpBeforeCurrent(4, 5)).toBe(true);
    expect(isSkillTimelineJumpBeforeCurrent(5, 5)).toBe(false);
    expect(isSkillTimelineJumpBeforeCurrent(6, 5)).toBe(false);
  });
  it('uses the native seconds epsilon rather than rounding the current frame', () => {
    expect(isSkillTimelineJumpBeforeCurrent(5, 5.0001)).toBe(false);
    expect(isSkillTimelineJumpBeforeCurrent(5, 5.001)).toBe(true);
  });
  it('does not silently accept invalid frame inputs', () => {
    expect(() => isSkillTimelineJumpBeforeCurrent(0.5, 0)).toThrow('integer');
    expect(() => isSkillTimelineJumpBeforeCurrent(1, NaN)).toThrow('finite');
  });
});

describe('native Skill.JumpTo lifetime gate', () => {
  it.each([
    { destination: 30, duration: 30, expected: 'jump' },
    { destination: 31, duration: 30, expected: 'end' },
    { destination: 30, duration: 29.99997, expected: 'jump' },
    { destination: 30, duration: 29.97, expected: 'end' },
    { destination: 31, duration: undefined, expected: 'jump' },
  ])('$destination with duration $duration: $expected', ({ destination, duration, expected }) => {
    const trace: string[] = [];
    new SkillTimelineJumpGate().execute(
      destination,
      0,
      duration,
      () => trace.push('jump'),
      () => trace.push('end'),
    );
    expect(trace).toEqual([expected]);
  });

  it('suppresses nested jumps during end and releases the gate afterwards', () => {
    const gate = new SkillTimelineJumpGate();
    const trace: string[] = [];
    gate.execute(
      31,
      0,
      30,
      () => trace.push('wrong'),
      () => {
        trace.push('end');
        gate.execute(
          5,
          0,
          30,
          () => trace.push('nested'),
          () => trace.push('nested end'),
        );
      },
    );
    gate.execute(
      5,
      0,
      30,
      () => trace.push('later'),
      () => trace.push('wrong end'),
    );
    expect(trace).toEqual(['end', 'later']);
  });
});
