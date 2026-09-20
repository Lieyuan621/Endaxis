import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';

/** 由技能定义明确声明的“本次释放创建哪个强化状态”关系。 */
export interface SkillEnhancementTimelineBinding {
  readonly castId: string;
  readonly targetId: string;
  readonly buffId: string;
}

export interface SkillEnhancementTimelineSegment extends SkillEnhancementTimelineBinding {
  readonly instanceId: number;
  readonly startFrame: number;
  readonly endFrame: number;
  readonly completed: boolean;
}

function stringData(
  data: Readonly<Record<string, CombatReceiptValue>> | undefined,
  key: string,
): string | undefined {
  const value = data?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function instanceIdData(
  data: Readonly<Record<string, CombatReceiptValue>> | undefined,
): number | undefined {
  const value = data?.instanceId;
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function bindingKey(targetId: string, buffId: string, castId: string): string {
  return `${targetId}\u0000${buffId}\u0000${castId}`;
}

function instanceKey(targetId: string, buffId: string, instanceId: number): string {
  return `${targetId}\u0000${buffId}\u0000${instanceId}`;
}

/**
 * 把终结技来源的精确 Buff 实例投影为强化条。
 *
 * 只接受定义显式绑定、目标一致且 `sourceActionId` 等于项目 castId 的 BuffApplied；
 * 后续刷新不会拆段，BuffFinished 才关闭实例。未结束的实例仅画到本次模拟终点。
 */
export function projectSkillEnhancementTimelineViz(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
  bindings: readonly SkillEnhancementTimelineBinding[],
): readonly SkillEnhancementTimelineSegment[] {
  if (!Number.isInteger(endFrame) || endFrame < 0) {
    throw new RangeError('endFrame must be a non-negative integer');
  }

  const bindingByIdentity = new Map(
    bindings.map(binding => [
      bindingKey(binding.targetId, binding.buffId, binding.castId),
      binding,
    ]),
  );
  const open = new Map<string, SkillEnhancementTimelineSegment>();
  const closed: SkillEnhancementTimelineSegment[] = [];

  for (const entry of entries) {
    if (
      entry.event !== 'BuffApplied' &&
      entry.event !== 'BuffFinished' &&
      entry.event !== 'BuffReleased'
    )
      continue;
    const targetId = entry.targetId;
    const buffId = stringData(entry.data, 'buffId');
    const instanceId = instanceIdData(entry.data);
    if (targetId === undefined || buffId === undefined || instanceId === undefined) continue;
    const instance = instanceKey(targetId, buffId, instanceId);

    if (entry.event === 'BuffFinished' || entry.event === 'BuffReleased') {
      const active = open.get(instance);
      if (active === undefined) continue;
      open.delete(instance);
      closed.push({ ...active, endFrame: entry.frame, completed: true });
      continue;
    }

    const castId = stringData(entry.data, 'sourceActionId');
    if (castId === undefined) continue;
    const binding = bindingByIdentity.get(bindingKey(targetId, buffId, castId));
    if (binding === undefined || open.has(instance)) continue;
    open.set(instance, {
      ...binding,
      instanceId,
      startFrame: entry.frame,
      endFrame,
      completed: false,
    });
  }

  return [...closed, ...open.values()].sort(
    (left, right) => left.startFrame - right.startFrame || left.instanceId - right.instanceId,
  );
}
