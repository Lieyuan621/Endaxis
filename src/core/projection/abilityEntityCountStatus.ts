import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import type { AbilityEntityTargetRef } from '../game-data/logicalAbilityEntity';

/** 仅观察实体创建/结束事实；每段保留真实实例身份，供已有来源查询使用。 */
export function projectAbilityEntityCountStatus(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
  operatorId: string,
  abilityEntityId: string,
) {
  const entities = new Map<string, AbilityEntityTargetRef>();
  const segments: {
    startFrame: number;
    endFrame: number;
    entities: readonly AbilityEntityTargetRef[];
  }[] = [];
  let startFrame = 0;
  const close = (frame: number) => {
    if (entities.size > 0 && frame > startFrame)
      segments.push({ startFrame, endFrame: frame, entities: [...entities.values()] });
  };
  for (const entry of entries) {
    if (entry.frame > endFrame) break;
    const ref = entry.subject;
    const targetId = entry.targetId;
    if (targetId === undefined) continue;
    if (
      entry.event === 'AbilityEntitySpawned' &&
      ref?.kind === 'abilityEntity' &&
      entry.sourceId === operatorId &&
      entry.data?.abilityEntityId === abilityEntityId &&
      !entities.has(targetId)
    ) {
      close(entry.frame);
      entities.set(targetId, ref);
    } else if (entry.event === 'AbilityEntityFinished' && entities.has(targetId)) {
      close(entry.frame);
      entities.delete(targetId);
    } else continue;
    startFrame = entry.frame;
  }
  close(endFrame);
  return { segments, entities: [...entities.values()] };
}
