import { expect, it, vi } from 'vitest';
import type {
  CombatFrameInput,
  CombatSkillInputPhase,
} from '../../core/combat/runtime/combatFrameInput';
import type { ScenarioDocument } from '../../core/project/schema';
import type { StandardPlayerDamageCombatSession } from '../simulation/standardPlayerDamageCombatSession';
import { createLegacyPreservedInputRunner } from './preservedInputs';

it.each([-10, 0, 10])('固定输入从 %s 帧向前运行，同帧修正后只执行一次，不保存切面', firstFrame => {
  let frame = Math.min(0, firstFrame);
  let initialInputPending = true;
  let actualSkill = 'replacement1';
  const submitted: string[] = [];
  const markers: number[] = [];
  const execute = (input: CombatFrameInput) => {
    if (input.controlledOperatorId !== undefined) markers.push(frame);
    if (typeof input.skills === 'function')
      input.skills({
        canContinue: () => {
          throw new Error('fixed inputs must not plan continuation');
        },
        canPlanContinuation: () => {
          throw new Error('fixed inputs must not plan continuation');
        },
        groupBlocked: () => {
          throw new Error('fixed inputs have no dynamic group');
        },
        resolvePlayerInputSkill: () => ({ status: 'mismatched', actualSkillKey: actualSkill }),
        submit: (skill, actualFrame) => {
          expect(actualFrame).toBe(frame);
          submitted.push(skill.skillId);
          actualSkill = 'replacement2';
          return true;
        },
      } as CombatSkillInputPhase);
  };
  // 不提供 save/fork；任何切面访问都会使测试失败。
  const session = {
    runtime: {
      get frame() {
        return frame;
      },
      get initialInputPending() {
        return initialInputPending;
      },
      applyInitialInput(input: CombatFrameInput) {
        initialInputPending = false;
        execute(input);
      },
      advanceInputFrame(input: CombatFrameInput) {
        frame += 1;
        execute(input);
      },
    },
    advanceToFrame(target: number) {
      expect(target).toBeGreaterThanOrEqual(frame);
      frame = target;
    },
  } as StandardPlayerDamageCombatSession;
  const skills = [0, 1].map(index => ({
    operatorId: 'track',
    skillId: 'base',
    castId: `cast${index}`,
    declarationOrder: index,
  }));
  const compileFixedInputs = vi.fn(() => [
    { frame: firstFrame, controlledOperatorId: 'track', skills },
    { frame: firstFrame + 2, skills: [skills[0]!] },
    { frame: firstFrame + 100, controlledOperatorId: 'track' },
  ]);
  const createInputCombatSession = vi.fn(() => session);
  const resolve = vi.fn((_id: string, actual: string) => actual);
  createLegacyPreservedInputRunner({ compileFixedInputs, createInputCombatSession })(
    {} as ScenarioDocument,
    resolve,
  );
  expect(compileFixedInputs).toHaveBeenCalledTimes(1);
  expect(createInputCombatSession).toHaveBeenCalledTimes(1);
  expect(submitted).toEqual(['replacement1', 'replacement2', 'replacement2']);
  expect(markers).toEqual([firstFrame]);
  expect(frame).toBe(firstFrame + 2);
});
