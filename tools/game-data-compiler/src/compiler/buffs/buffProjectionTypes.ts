import type {
  BuffPriority,
  BuffShieldDefinition,
  CombatBuffDefinitionNumberOperand,
  CombatBuffPresentation,
  CombatBuffDefinitionAttributeModifier,
  CombatBuffDefinitionDamageModifier,
  SkillBuffAbilityEventResponse,
  SkillBuffIgniteEventResponse,
  SkillBuffDefinition,
  SkillBuffLifecycleSequences,
} from '../../../../../packages/game-data-contract/src/buffs.ts';
import type {
  DamageModifierCondition,
  HealModifierCondition,
  HealModifierDefinition,
  PoiseModifierDefinition,
} from '../../../../../packages/game-data-contract/src/modifiers.ts';
import type { CompiledBuffSequenceSource } from '../actions/combatActionProjectionTypes.ts';

/** Buff 蓝图的公共输出子集。安装参数、来源身份和运行状态不进入本模块。 */
export type CompiledBuffNumberSource = CombatBuffDefinitionNumberOperand;

/** 输出字段来自独立契约；此处只声明当前投影保证写出的字段与支持子集。 */
export type CompiledBuffPresentationSource = Required<
  Omit<CombatBuffPresentation, 'iconId' | 'iconPath'>
> &
  Pick<CombatBuffPresentation, 'iconId' | 'iconPath'>;

export type CompiledBuffAttributeModifierSource = Pick<
  CombatBuffDefinitionAttributeModifier,
  'attribute' | 'slot' | 'value'
>;

export interface CompiledBuffDamageModifierSource extends Pick<
  CombatBuffDefinitionDamageModifier,
  'enabledSide'
> {
  readonly condition?: DamageModifierCondition;
  readonly conditionProgram?: CompiledBuffSequenceSource;
  readonly processors: CombatBuffDefinitionDamageModifier['processors'];
}

export interface CompiledBuffHealModifierSource extends Pick<
  HealModifierDefinition,
  'enabledSide'
> {
  readonly condition?: HealModifierCondition;
  readonly processors: HealModifierDefinition['processors'];
}

/** 条件已是正式契约结构；原生条件准入由 compilePoiseModifierCondition 校验。 */
export type CompiledBuffPoiseModifierSource = PoiseModifierDefinition;

/** 根字段和生命周期字段均来自契约，只保留当前公共投影能够产生的部分。 */
export type CompiledBuffDefinitionSource = Pick<
  SkillBuffDefinition,
  | 'stackingType'
  | 'stackingKey'
  | 'durationSeconds'
  | 'triggerIntervalSeconds'
  | 'waitFirstTriggerInterval'
  | 'maxTriggerCount'
  | 'affixSkillCastIdentity'
> &
  Required<Pick<SkillBuffDefinition, 'maxStackCount' | 'applyTags' | 'extendTags'>> & {
    readonly actionGraph: import('../../../../../packages/game-data-contract/src/actionGraph.ts').ActionGraphResourceDefinition;
    readonly priority: BuffPriority;
    /** 默认时钟由省略字段表达；开启时间膨胀时才输出 global/self。 */
    readonly timeClock?: Extract<SkillBuffDefinition['timeClock'], 'global' | 'self'>;
    readonly presentation?: CompiledBuffPresentationSource;
    readonly blackboard: Readonly<Record<string, number | string>>;
    readonly attributeModifiers: readonly CompiledBuffAttributeModifierSource[];
    readonly damageModifiers?: readonly CompiledBuffDamageModifierSource[];
    readonly healModifiers?: readonly CompiledBuffHealModifierSource[];
    readonly poiseModifiers?: readonly CompiledBuffPoiseModifierSource[];
    readonly scheduledSequences?: readonly {
      readonly startFrame: number;
      readonly endFrame: number;
      readonly sequence: CompiledBuffSequenceSource;
    }[];
    readonly shields?: readonly (Omit<BuffShieldDefinition, 'value'> & {
      readonly value:
        | CompiledBuffNumberSource
        | {
            readonly attributeSource?: 'buffOwner' | 'buffSource';
            readonly attribute: string;
            readonly multiplier: CompiledBuffNumberSource;
            readonly addition: CompiledBuffNumberSource;
          };
    })[];
    readonly lifecycleSequences?: Readonly<
      Partial<
        Record<
          Extract<
            keyof SkillBuffLifecycleSequences,
            'start' | 'enable' | 'trigger' | 'enhanceChanged' | 'afterEnhance' | 'finish'
          >,
          CompiledBuffSequenceSource
        >
      >
    >;
    readonly abilityEventResponses?: readonly (Pick<
      SkillBuffAbilityEventResponse,
      'event' | 'priority'
    > & {
      readonly sequence: CompiledBuffSequenceSource;
    })[];
    readonly igniteEventResponses?: readonly (Pick<
      SkillBuffIgniteEventResponse,
      'igniteType' | 'finishAfterIgnited'
    > & {
      readonly sequence: CompiledBuffSequenceSource;
    })[];
  };
