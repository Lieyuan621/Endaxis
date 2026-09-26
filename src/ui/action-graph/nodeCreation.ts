/** 根据节点字段元数据构造可新建的空节点；需要资源或变量身份的节点必须由对应选择器提供。 */
import type {
  ActionGraphDataNode,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import { actionNodeSchemas, dataNodeSchemas } from './actionNodeSchemas.generated';
import type { NodeFieldSchema } from './nodeSchema';
import { writeNodeField } from './nodeFieldValues';
import { validateActionGraphActions } from '../../core/game-data/validation/actionPrograms';

export type NodeCreation =
  | { key: string; kind: string; category: 'action'; action: ActionGraphStep }
  | { key: string; kind: string; category: 'number' | 'boolean'; data: ActionGraphDataNode };
const unavailable = Symbol('requires a selection');
/** 菜单分类只组织已有候选，不决定哪些节点可创建。 */
const actionGroups: Readonly<Record<string, readonly string[]>> = {
  flow: [
    'conditional',
    'switch',
    'repeatEachTick',
    'repeatByActionValue',
    'once',
    'callMacro',
    'callResource',
    'listenForCombatEvents',
    'triggerCustomAbilityEvent',
    'withActionBlackboardScope',
  ],
  damage: [
    'dealDamage',
    'dealFixedDamage',
    'dealStagger',
    'heal',
    'outputKnockDown',
    'outputAirborne',
    'applyKnockDown',
    'applyPhysicalInfliction',
    'triggerSpellBurst',
    'applyElementalInfliction',
    'applyElementalReaction',
    'consumeElementalReaction',
  ],
  buffs: [
    'applyBuff',
    'createGlobalBuff',
    'finishParentGlobalBuff',
    'finishGlobalBuffsById',
    'readBuffBlackboard',
    'readEventBuffBlackboard',
    'readCurrentBuffRemainingDuration',
    'readBuffRemainingDuration',
    'setCurrentBuffRemainingDuration',
    'refreshCurrentBuffAttributeModifiers',
    'readBuffStackCount',
    'finishBuffsByTag',
    'finishBuffsById',
    'finishCurrentBuff',
    'setCurrentBuffTimePaused',
    'igniteBuffs',
    'holdBuffsById',
    'inheritBuffById',
    'applyStatus',
    'consumeStatus',
  ],
  targets: [
    'mergeContextTargets',
    'findCharacterTeamTargets',
    'findUnfinishedProjectileTargets',
    'createSpatialPointTargets',
    'findOwnerSpawnedAbilityEntities',
    'pickContextTarget',
    'forEachContextTarget',
  ],
  entities: [
    'readAbilityEntityRemainingDuration',
    'setAbilityEntityRemainingDuration',
    'finishCurrentAbilityEntity',
    'finishActionOwnerAbilityEntity',
    'finishCurrentAbilityEntityWhenSourceDies',
    'startCurrentAbilityEntityChildSkill',
    'startCurrentAbilityEntityChildSkillById',
    'spawnAbilityEntity',
    'launchProjectile',
  ],
  values: [
    'modifyActionValue',
    'calculateActionValue',
    'storeCurrentTimelineFrame',
    'storeEventSpGainAmount',
    'storeEventHealValues',
    'storeShieldValue',
    'storeSourceAttributeValue',
    'storeEntityPropertyValue',
    'readSkillSettingData',
    'setContextFlag',
  ],
  resources: [
    'setHealthFloor',
    'changeResource',
    'changeResourceByActionValue',
    'recoverDashEnergy',
    'restrictUltimateEnergyRecovery',
    'gainSquadUltimateEnergyFromSkillCost',
    'gainFinisherSp',
  ],
};
export function nodeCreationGroup(item: NodeCreation): string {
  if (item.category !== 'action') return item.category;
  return (
    Object.entries(actionGroups).find(([, kinds]) => kinds.includes(item.kind))?.[0] ?? 'skills'
  );
}
function initialValue(field: NodeFieldSchema): unknown {
  if (field.control === 'number') return 0;
  if (field.control === 'boolean') return false;
  if (field.control === 'select') return field.options?.[0] ?? unavailable;
  if (field.control === 'operand') return { kind: 'constant', value: 0 };
  if (field.control === 'sequence') return { $sequence: null };
  if (field.type.split(' | ').includes('LevelValues')) return 0;
  if (field.type === 'CombatCondition') return { kind: 'constant', value: false };
  if (field.type === 'readonly CombatCondition[]')
    return [
      { kind: 'constant', value: false },
      { kind: 'constant', value: false },
    ];
  if (/^readonly .+\[\]$/.test(field.type)) return [];
  // 不凭空填写技能、Buff、黑板变量等必需身份，也不猜复杂对象的默认值。
  return unavailable;
}
function instantiate(base: unknown, fields: readonly NodeFieldSchema[]): unknown {
  let value = base;
  for (const field of fields) {
    if (!field.required) continue;
    const initial = initialValue(field);
    if (initial === unavailable) return undefined;
    value = writeNodeField(value, field.path, initial);
  }
  return value;
}
export function listNodeCreations(): readonly NodeCreation[] {
  const entries: NodeCreation[] = [];
  for (const schema of Object.values(actionNodeSchemas)) {
    const action = instantiate({ kind: schema.kind, parameters: {} }, schema.fields);
    if (action)
      entries.push({
        key: `action:${schema.kind}`,
        kind: schema.kind,
        category: 'action',
        action: action as ActionGraphStep,
      });
  }
  for (const [key, schema] of Object.entries(dataNodeSchemas)) {
    const [type, kind] = key.split(':') as ['number' | 'boolean', string];
    const expression = instantiate({ kind }, schema.fields);
    if (expression)
      entries.push({
        key,
        kind,
        category: type,
        data: { type, expression } as ActionGraphDataNode,
      });
  }
  // 联合字段可能各自可选，但仍要求至少提供一项。沿用正式校验，不在 UI 复制这些规则。
  return entries.filter(item => {
    const main =
      item.category === 'action'
        ? { nodes: { added: { action: item.action, next: null } } }
        : { nodes: {}, dataNodes: { added: item.data } };
    return validateActionGraphActions({ main, macros: {} }, 'graph').length === 0;
  });
}
