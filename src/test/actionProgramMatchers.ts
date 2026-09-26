import { expect } from 'vitest';
import { rootActionSteps } from '../core/compiler/actionProgramInspection';
import type { ResolvedActionSequence } from '../core/compiler/combatProgram';

/** 只检查指定入口的直接动作；嵌套入口由显式 matcher 检查，不展开整张程序图。 */
export function actionSteps(expected: readonly unknown[]) {
  return {
    asymmetricMatch(actual: unknown): boolean {
      if (!actual || typeof actual !== 'object' || !('graph' in actual || 'steps' in actual))
        return false;
      try {
        expect(rootActionSteps(actual as ResolvedActionSequence)).toMatchObject(expected);
        return true;
      } catch {
        return false;
      }
    },
    toString: () => 'ActionSteps',
    getExpectedType: () => 'object',
  };
}
