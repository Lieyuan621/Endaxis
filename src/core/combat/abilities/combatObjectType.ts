import type {
  CombatObjectType,
  CombatObjectTypeSelection,
} from '../../../../packages/game-data-contract/src/primitives';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';

/** 两种条件视图共用同一类型解析；共享句柄不抹掉投射物与能力实体的区别。 */
export function resolveCombatObjectType(
  target: RuntimeTargetRef,
  resolveEntity?: (instanceId: number) => CombatObjectType,
): CombatObjectType | undefined {
  if (target.kind === 'spatialPoint') return undefined;
  if (target.kind === 'enemy') return 'enemy';
  if (target.kind === 'operator') return 'character';
  if (resolveEntity === undefined)
    throw new Error('entity object type requires an instance directory');
  return resolveEntity(target.instanceId);
}

export function matchesCombatObjectType(
  selection: CombatObjectTypeSelection,
  type: CombatObjectType | undefined,
): boolean {
  return (
    type !== undefined &&
    (selection === 'all' ||
      selection.includes(type) ||
      (type === 'enemyPart' && selection.includes('enemy')))
  );
}
