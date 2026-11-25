import type { EnemyLifecycleProgram } from '../combat/enemies/enemyLifecycle';
import type { EnemyLifecycleDocument } from '../project/schema';
import { validateEnemyLifecycle } from '../project/enemyLifecycleValidation';
import type { ValidationIssue } from '../project/validationHelpers';

/** 编译实例时间线；旧存档在实际模拟起点出生，而不是把准备阶段误判为未入场。 */
export function compileEnemyLifecycle(
  lifecycle: EnemyLifecycleDocument | undefined,
  initialFrame: number,
): EnemyLifecycleProgram {
  if (!Number.isSafeInteger(initialFrame))
    throw new RangeError('initial frame must be a safe integer');
  if (lifecycle === undefined)
    return Object.freeze({
      spawnFrame: initialFrame,
      presenceChanges: Object.freeze([]),
      deathFrame: null,
    });
  const issues: ValidationIssue[] = [];
  validateEnemyLifecycle(lifecycle, 'enemy.lifecycle', issues);
  if (issues.length)
    throw new Error(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
  return Object.freeze({
    spawnFrame: lifecycle.spawnFrame,
    presenceChanges: Object.freeze(
      lifecycle.presenceChanges.map(({ frame, present }) => Object.freeze({ frame, present })),
    ),
    deathFrame: lifecycle.deathFrame ?? null,
  });
}
