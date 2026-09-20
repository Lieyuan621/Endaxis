import type { AbilityEvent } from '../../../../../packages/game-data-contract/src/abilityEvents.ts';

/**
 * 原生 AbilityEvent 到公共数据契约的唯一身份映射。
 *
 * 字符串来自运行时模板/SkillActionGraph，数字来自 CharacterTemplate 的
 * TriggerComboSkillEvent。两者指向同一个原生枚举，任何消费方都必须经过这里转换；
 * 监听目标绑定和木桩模型是否会产生该事件不是身份转换的一部分。
 */
const NATIVE_ABILITY_EVENT_NAMES = {
  OnOwnerHpZero: 'ownerHpZero',
  OnCustomAbilityEvent: 'customAbilityEvent',
  OnEnterFight: 'enterFight',
  OnOwnerSwitchToCenter: 'ownerSwitchToCenter',
  OnOwnerSwitchToGuard: 'ownerSwitchToGuard',
  OnAddedBuff: 'addedBuff',
  OnTakeDamage: 'takeDamage',
  OnOutputDamage: 'outputDamage',
  OnPoiseZero: 'poiseZero',
  OnBeforeCastSkill: 'beforeCastSkill',
  OnSkillEnd: 'skillEnd',
  OnBeforeOutputKnockDown: 'beforeOutputKnockDown',
  OnAfterOutputKnockDown: 'afterOutputKnockDown',
  OnTakeCriticalDamage: 'takeCriticalDamage',
  OnOutputCriticalDamage: 'outputCriticalDamage',
  OnReceiveHeal: 'receiveHeal',
  OnOutputHeal: 'outputHeal',
  OnAfterAddedShield: 'afterAddedShield',
  OnBeforeTakePhysicalInfliction: 'beforeTakePhysicalInfliction',
  OnAfterTakePhysicalInfliction: 'afterTakePhysicalInfliction',
  OnBeforeTakeDamage: 'beforeTakeDamage',
  OnBeforeHitByProjectile: 'beforeHitByProjectile',
  OnOutputBuff: 'outputBuff',
  OnBeforeDamageAction: 'beforeDamageAction',
  OnEnemyBeforeTakeSpellInfliction: 'beforeTakeInfliction',
  OnCharBeforeTakeSpellInfliction: 'beforeTakeSpellInfliction',
  OnCharBeforeOutputSpellInfliction: 'beforeOutputInfliction',
  OnCharBeforeOutputSpellBurst: 'beforeOutputSpellBurst',
  OnCharAfterOutputSpellInfliction: 'afterOutputInfliction',
  OnEnemyAfterTakeSpellInfliction: 'afterTakeInfliction',
  OnAfterOutputWeaknessTriggered: 'afterOutputWeaknessTriggered',
  OnSetWeakness: 'weaknessSet',
  OnObtainAtb: 'skillSpGained',
  OnPerfectDodge: 'perfectDodge',
  OnAfterSkillApplyCost: 'afterSkillApplyCost',
  OnFinishedBuff: 'finishedBuff',
  OnBuffEndsEarly: 'buffEndsEarly',
  OnBuffEnhanceChanged: 'buffEnhanceChanged',
  OnBeforeAddedBuff: 'beforeAddedBuff',
  OnBeforeOutputBuff: 'beforeOutputBuff',
  OnConsumeBuff: 'buffConsumed',
  OnAbsorbBuff: 'buffAbsorbed',
  OnAfterKillEntity: 'afterKillEntity',
  OnPoiseKnotBreak: 'poiseKnotBreak',
  OnAbilityEntitySpawned: 'abilityEntitySpawned',
  OnAbilityEntityFinished: 'abilityEntityFinished',
  OnBeforeCalculateDamage: 'beforeCalculateDamage',
  OnBeforeOutputDamage: 'beforeOutputDamage',
  OnBeforeOutputPhysicalInfliction: 'beforeOutputPhysicalInfliction',
  OnAfterOutputPhysicalInfliction: 'afterOutputPhysicalInfliction',
} as const satisfies Readonly<Record<string, AbilityEvent>>;

const NATIVE_ABILITY_EVENT_IDS = {
  1: 'OnOwnerHpZero',
  2: 'OnOwnerSwitchToCenter',
  3: 'OnOwnerSwitchToGuard',
  5: 'OnCustomAbilityEvent',
  6: 'OnEnterFight',
  9: 'OnAddedBuff',
  12: 'OnTakeDamage',
  13: 'OnOutputDamage',
  21: 'OnPoiseZero',
  30: 'OnBeforeCastSkill',
  31: 'OnSkillEnd',
  40: 'OnBeforeOutputKnockDown',
  41: 'OnAfterOutputKnockDown',
  43: 'OnTakeCriticalDamage',
  44: 'OnOutputCriticalDamage',
  45: 'OnReceiveHeal',
  50: 'OnOutputHeal',
  147: 'OnAfterAddedShield',
  59: 'OnBeforeTakePhysicalInfliction',
  60: 'OnAfterTakePhysicalInfliction',
  101: 'OnBeforeTakeDamage',
  102: 'OnOutputBuff',
  104: 'OnBeforeDamageAction',
  121: 'OnEnemyBeforeTakeSpellInfliction',
  122: 'OnCharBeforeTakeSpellInfliction',
  126: 'OnCharBeforeOutputSpellInfliction',
  127: 'OnCharBeforeOutputSpellBurst',
  129: 'OnCharAfterOutputSpellInfliction',
  130: 'OnEnemyAfterTakeSpellInfliction',
  141: 'OnAfterOutputWeaknessTriggered',
  151: 'OnSetWeakness',
  142: 'OnObtainAtb',
  143: 'OnAfterSkillApplyCost',
  145: 'OnPerfectDodge',
  203: 'OnFinishedBuff',
  204: 'OnBuffEndsEarly',
  205: 'OnBeforeAddedBuff',
  206: 'OnBeforeOutputBuff',
  208: 'OnConsumeBuff',
  209: 'OnBuffEnhanceChanged',
  211: 'OnAbsorbBuff',
  222: 'OnAfterKillEntity',
  241: 'OnPoiseKnotBreak',
  261: 'OnAbilityEntitySpawned',
  262: 'OnAbilityEntityFinished',
  301: 'OnBeforeCalculateDamage',
  302: 'OnBeforeOutputDamage',
  401: 'OnBeforeOutputPhysicalInfliction',
  402: 'OnAfterOutputPhysicalInfliction',
} as const satisfies Readonly<Record<number, keyof typeof NATIVE_ABILITY_EVENT_NAMES>>;

export function projectAbilityEvent(event: string | number, sourcePath: string): AbilityEvent {
  const nativeName =
    typeof event === 'number'
      ? NATIVE_ABILITY_EVENT_IDS[event as keyof typeof NATIVE_ABILITY_EVENT_IDS]
      : event;
  const projected =
    nativeName === undefined
      ? undefined
      : NATIVE_ABILITY_EVENT_NAMES[nativeName as keyof typeof NATIVE_ABILITY_EVENT_NAMES];
  if (projected === undefined) {
    throw new Error(`${sourcePath}: unsupported ability event ${JSON.stringify(event)}`);
  }
  return projected;
}
