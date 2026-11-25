import { isObject, requireBoolean, requireString, type ValidationIssue } from './validationHelpers';

/** 在导入和编译边界共用；出生前可有准备时间，因此帧允许负数。 */
export function validateEnemyLifecycle(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!isObject(value)) {
    issues.push({ path, message: 'expected an object' });
    return;
  }
  const spawn = value.spawnFrame;
  if (!Number.isSafeInteger(spawn))
    issues.push({ path: `${path}.spawnFrame`, message: 'expected a safe integer frame' });
  if (
    value.deathFrame !== undefined &&
    (!Number.isSafeInteger(value.deathFrame) ||
      (typeof spawn === 'number' &&
        typeof value.deathFrame === 'number' &&
        value.deathFrame < spawn))
  )
    issues.push({
      path: `${path}.deathFrame`,
      message: 'death must be an integer frame at or after spawn',
    });
  if (!Array.isArray(value.presenceChanges)) {
    issues.push({ path: `${path}.presenceChanges`, message: 'expected an array' });
    return;
  }
  const ids = new Set<string>();
  let previousFrame: number | undefined;
  value.presenceChanges.forEach((change, index) => {
    const itemPath = `${path}.presenceChanges[${index}]`;
    if (!isObject(change)) {
      issues.push({ path: itemPath, message: 'expected an object' });
      return;
    }
    const id = requireString(change, 'id', itemPath, issues);
    if (id !== null) {
      if (ids.has(id))
        issues.push({ path: `${itemPath}.id`, message: 'duplicate presence marker identity' });
      ids.add(id);
    }
    requireBoolean(change.present, `${itemPath}.present`, issues);
    const frame = change.frame;
    if (
      typeof frame !== 'number' ||
      !Number.isSafeInteger(frame) ||
      (typeof spawn === 'number' && frame < spawn) ||
      (previousFrame !== undefined && frame <= previousFrame)
    )
      issues.push({
        path: `${itemPath}.frame`,
        message: 'presence frames must increase and not precede spawn',
      });
    if (typeof frame === 'number') previousFrame = frame;
  });
}
