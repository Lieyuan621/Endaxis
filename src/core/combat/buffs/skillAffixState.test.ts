import { describe, expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import { createSkillAffixState } from '../state/instanceState';
import {
  prepareSkillAffixRequest,
  releaseSkillAffixReference,
  startSkillAffixCast,
} from './skillAffixExecution';

describe('SkillAffix 分支', () => {
  it('回退待转交请求后可以改由其他技能开始，重复请求只增加一个引用', () => {
    const initial = createSkillAffixState(1, 42);
    prepareSkillAffixRequest(initial, 42);
    prepareSkillAffixRequest(initial, 42);
    expect(initial.references).toBe(2);
    expect(releaseSkillAffixReference(initial)).toBe(false);
    const session = new StateStepper(initial, (step, input: number | 'end') => {
      if (input === 'end') return releaseSkillAffixReference(step.state);
      return startSkillAffixCast(step.state, input) && releaseSkillAffixReference(step.state);
    });
    const saved = session.save();
    expect(session.step(42)).toBe(false);
    expect(session.read().pendingRequest).toBe(false);
    expect(session.step('end')).toBe(true);
    session.restore(saved);
    expect(session.step(99)).toBe(true);
    session.restore(saved);
    expect(session.read()).toEqual(initial);
  });
});
