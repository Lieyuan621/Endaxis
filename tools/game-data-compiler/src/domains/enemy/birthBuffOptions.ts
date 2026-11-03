import { readBirthShieldCount } from './birthShieldLabel.ts';
import { ENEMY_BIRTH_BUFF_EXCLUSIONS } from '../../../config/enemies/birthBuffExclusions.ts';
import type { AttributeModifier } from '../../../../../packages/game-data-contract/src/modifiers.ts';
import type { EnemyBirthBuffOption } from '../../../../../packages/game-data-contract/src/enemies.ts';
import {
  compileModifierSlot,
  projectCombatRuntimeAttributeKey,
} from '../../compiler/build/attributeModifier.ts';
import { ATTRIBUTE_TYPES, type ModifierTypeSource } from '../../source/attributeModifiers.ts';
import { readEnemyBornBuffAttributes } from './bornBuffAttributes.ts';
import { ENEMY_BIRTH_BUFF_NAMES } from './birthBuffPrograms.ts';

/** 排除只含表现或悬赏绑定动作的出生 Buff；属性、标签与未知动作仍保留。 */
function isCombatIrrelevantBirthBuff(source: Record<string, unknown>): boolean {
  const attributes = source.attributeModifier;
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return false;
  if ('isConvertedAttribute' in attributes && attributes.isConvertedAttribute) return false;
  if (
    !('attributeModifiers' in attributes) ||
    !Array.isArray(attributes.attributeModifiers) ||
    attributes.attributeModifiers.length > 0
  )
    return false;
  if (
    [
      'damageModifier',
      'healModifier',
      'poiseModifier',
      'globalModifier',
      'shieldConfigs',
      'applyTags',
      'tagsAfterTriggerExtendBuffAction',
    ].some(
      key => source[key] !== undefined && (!Array.isArray(source[key]) || source[key].length > 0),
    )
  )
    return false;
  const behavior = JSON.stringify([
    source.buffEventAction,
    source.abilityEventAction,
    source.igniteEventAction,
    source.timelineActions,
  ]);
  const types = [...behavior.matchAll(/"\$type"\s*:\s*"([^"]+)"/g)].map(match => match[1]);
  return (
    types.length > 0 &&
    types.every(
      type =>
        type === 'Beyond.Gameplay.Core.EffectAction+EffectActionData, Gameplay.Beyond' ||
        type === 'Beyond.Gameplay.Core.PlaySoundAction+PlaySoundActionData, Gameplay.Beyond' ||
        type === 'Beyond.Gameplay.Core.BindBountyEnemyAction+Data, Gameplay.Beyond',
    )
  );
}

const DAMAGE_TAKEN_ATTRIBUTES = new Set([
  'PhysicalDamageTakenScalar',
  'FireDamageTakenScalar',
  'PulseDamageTakenScalar',
  'CrystDamageTakenScalar',
  'NaturalDamageTakenScalar',
  'EtherDamageTakenScalar',
]);

/** 原生表格与 Buff 来源分别解码，发布时复用通用属性名与公式槽。 */
export function projectEnemyAttributeModifier(
  type: number,
  slot: ModifierTypeSource,
  value: number,
): AttributeModifier {
  const attribute = ATTRIBUTE_TYPES[type];
  if (
    !attribute ||
    (![1, 2, 3, 20, 21, 27, 31].includes(type) && !DAMAGE_TAKEN_ATTRIBUTES.has(attribute))
  )
    throw new Error(`unsupported enemy attribute ${type}`);
  return {
    attribute: projectCombatRuntimeAttributeKey(attribute),
    slot: compileModifierSlot(slot, `enemy attribute ${attribute}`),
    value,
  };
}

export function projectEnemyBirthBuffOption(
  source: Record<string, unknown>,
  buffId: string,
  origin: 'enemy' | 'stage',
  index: number,
  overrides: Record<string, number> = {},
  buffDirectory?: string,
): EnemyBirthBuffOption | undefined {
  if (ENEMY_BIRTH_BUFF_EXCLUSIONS[buffId] || isCombatIrrelevantBirthBuff(source)) return undefined;
  const modifiers = readEnemyBornBuffAttributes(source, buffId, overrides).filter(
    m =>
      [1, 3, 20, 21, 27, 31].includes(m.attrType) ||
      (ENEMY_BIRTH_BUFF_NAMES[buffId] !== undefined &&
        DAMAGE_TAKEN_ATTRIBUTES.has(ATTRIBUTE_TYPES[m.attrType]!)),
  );
  const behavior = JSON.stringify([source.buffEventAction, source.abilityEventAction]);
  const actions = [...behavior.matchAll(/Beyond\.Gameplay\.Core\.([^",]+),/g)].map(
    match => match[1],
  );
  const supported =
    modifiers.length > 0 &&
    actions.every(
      action => action.startsWith('EffectAction') || action.startsWith('PlaySoundAction'),
    ) &&
    [
      'damageModifier',
      'healModifier',
      'poiseModifier',
      'globalModifier',
      'shieldConfigs',
      'applyTags',
    ].every(key => !Array.isArray(source[key]) || source[key].length === 0);
  const shieldCount =
    buffDirectory && ENEMY_BIRTH_BUFF_NAMES[buffId] === 'resourceMonitor.enemy.countShield'
      ? readBirthShieldCount(source, overrides, buffDirectory)
      : undefined;
  return {
    key: `${origin}:${index}:${buffId}`,
    buffId,
    ...(ENEMY_BIRTH_BUFF_NAMES[buffId] ? { nameKey: ENEMY_BIRTH_BUFF_NAMES[buffId] } : {}),
    ...(shieldCount !== undefined
      ? {
          nameKey: 'resourceMonitor.enemy.countShieldLayers',
          nameParams: { count: shieldCount },
        }
      : {}),
    origin,
    supported: supported || ENEMY_BIRTH_BUFF_NAMES[buffId] !== undefined,
    ...(ENEMY_BIRTH_BUFF_NAMES[buffId] ? { runtimeBuffId: buffId, blackboard: overrides } : {}),
    modifiers: modifiers.map(({ attrType, formulaItem, attrValue }) =>
      projectEnemyAttributeModifier(attrType, formulaItem, attrValue),
    ),
  };
}
