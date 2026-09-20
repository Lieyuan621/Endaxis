/**
 * 活动、关卡和自定义规则进入通用战斗核心的受控协议。
 * 只允许可校验的纯数据序列，禁止 Adapter 注入回调或任意对象补丁。
 */
import type { ResolvedActionSequence } from '../compiler/combatProgram';
import type { AbilityEvent } from '../../../packages/game-data-contract/src/abilityEvents';

/** 当前向机制适配器开放的、已确认的原生 `AbilityEvent` 身份。 */
export const MECHANIC_ABILITY_EVENTS = [
  'beforeCastSkill',
  'skillEnd',
  'outputDamage',
  'takeDamage',
  'beforeCalculateDamage',
  'afterSkillApplyCost',
] as const satisfies readonly AbilityEvent[];
/** 场景机制当前允许监听的 Ability 事件集合。 */
export type MechanicAbilityEvent = (typeof MECHANIC_ABILITY_EVENTS)[number];

/** 已还原身份和同步分发边界的关卡事件。 */
export type MechanicGameLevelEvent = { kind: 'spellInflictionStarted' };

/**
 * 首批可执行的机制原语。适配器只能返回数据，不能表达运行时回调
 * 或任意对象补丁，以维持明确的执行边界。
 */
export type MechanicContribution =
  | {
      /** 创建敌人生命账本前应用；首批只开放已由原生属性修饰器确认的最大生命乘区。 */
      readonly kind: 'enemyProgramStatMultiplier';
      readonly stat: 'maxHealth';
      readonly multiplier: number;
    }
  | {
      /** 战斗实体与事件总线完成装配后、任何技能输入前执行一次。 */
      readonly kind: 'battleInitializationSequence';
      readonly sequence: ResolvedActionSequence;
    }
  | {
      readonly kind: 'combatEventSequence';
      readonly event: MechanicAbilityEvent;
      readonly priority: number;
      readonly sequence: ResolvedActionSequence;
    }
  | {
      readonly kind: 'gameLevelEventSequence';
      readonly event: MechanicGameLevelEvent;
      readonly sequence: ResolvedActionSequence;
    };

/** 带完整来源位置的编译结果，用于安装、诊断和版本追踪。 */
export interface CompiledMechanicContribution {
  readonly selectionId: string;
  readonly mechanicId: string;
  readonly selectionIndex: number;
  readonly contributionIndex: number;
  readonly contribution: MechanicContribution;
}
