import type {
  EnemySpawnDefinition,
  EnemyStageDefinition,
} from '../../../packages/game-data-contract/src/enemies';
import { applyEnemyBirthAttribute } from '../game-data/enemyAttributeCalculation';
import { getEnemyRuntimeDefinitionId, type EnemyDefinition } from '../game-data/enemyDefinition';
import type { EnemyDocument, EnemyEditableValues } from './schema';

/** 出生规则由定义提供，实例明确选择启用项；不把定义或结算结果写回存档。 */
export function resolveEnemySpawn(
  source: EnemyDocument['source'],
  stage: EnemyStageDefinition | null,
): EnemySpawnDefinition | null {
  if (source.kind !== 'stage' || !source.spawnId) return null;
  const spawn =
    stage?.id === source.stageId
      ? stage.enemies.find(entry => entry.id === source.spawnId)
      : undefined;
  if (
    !spawn ||
    spawn.source.enemyId !== source.enemyId ||
    spawn.source.templateId !== source.templateId
  )
    throw new Error(`missing enemy spawn '${source.stageId}/${source.spawnId}'`);
  return spawn;
}

export function enemyBirthOptions(
  definition: EnemyDefinition | null,
  spawn?: EnemySpawnDefinition | null,
) {
  if (spawn && spawn.definitionId !== definition?.id)
    throw new Error(`enemy spawn definition mismatch '${spawn.id}'`);
  return [...(definition?.birthBuffs ?? []), ...(spawn?.birthBuffs ?? [])];
}

export function resolveEnemyBirthOptions(
  enemy: EnemyDocument,
  definition: EnemyDefinition | null,
  spawn?: EnemySpawnDefinition | null,
) {
  if (!enemy.birthEffects) return [];
  const definitionId = spawn?.definitionId ?? getEnemyRuntimeDefinitionId(enemy);
  if (!definition || definition.id !== definitionId)
    throw new Error(`missing enemy birth definition '${definitionId}'`);
  const enabled = new Set(enemy.birthEffects.enabledBuffs);
  const buffs = enemyBirthOptions(definition, spawn);
  for (const key of enabled)
    if (!buffs.some(buff => buff.key === key && buff.supported))
      throw new Error(`unsupported birth buff override '${key}'`);
  return buffs.filter(buff => enabled.has(buff.key));
}

/** 属性预览与模拟编译共用的派生面板。存档中的 editable 始终是基础属性。 */
export function resolveEnemyBirthValues(
  enemy: EnemyDocument,
  definition: EnemyDefinition | null,
  fps: number,
  spawn?: EnemySpawnDefinition | null,
  includeRuntimeBuffModifiers = true,
): EnemyEditableValues {
  const selected = resolveEnemyBirthOptions(enemy, definition, spawn);
  const base = enemy.editable;
  const modifiers = [
    ...(definition?.attributeModifiers ?? []),
    ...selected.flatMap(buff =>
      includeRuntimeBuffModifiers || !buff.runtimeBuffId ? buff.modifiers : [],
    ),
  ];
  const apply = (type: string, value: number) => applyEnemyBirthAttribute(type, value, modifiers);
  return {
    ...base,
    hp: Math.max(1, apply('MaxHp', base.hp)),
    defense: apply('Def', base.defense),
    finisherMultiplier: apply('BreakingAttackDamageTakenScalar', base.finisherMultiplier),
    resistances: { ...base.resistances },
    stagger: {
      ...base.stagger,
      knotThresholds: [...base.stagger.knotThresholds],
      maximum: apply('MaxPoise', base.stagger.maximum),
      brokenDurationFrames: Math.round(
        apply('PoiseRecTime', base.stagger.brokenDurationFrames / fps) *
          apply('PoiseRecTimeScalar', definition?.stagger.recoveryTimeMultiplier ?? 1) *
          fps,
      ),
    },
  };
}
