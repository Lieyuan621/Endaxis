export type PassiveSkillLevelSource =
  | { readonly kind: 'nativeDefault' }
  | {
      /** 角色基础被动跟随其所在原生技能组对应的项目等级轴。 */
      readonly kind: 'operatorSkillGroup';
      readonly levelSource: import('../../../../../packages/game-data-contract/src/index.ts').SkillLevelSource;
    }
  | {
      readonly kind: 'weaponProgression';
      readonly slotIndex: number;
      readonly breakthroughTemplateId: string;
      readonly talentTemplateId: string;
    }
  | {
      readonly kind: 'equipmentSuitThreshold';
      readonly level: number;
      readonly requiredCount: number;
    };

/** 领域发现层交给公共被动编译器的统一请求。 */
export interface PassiveSkillCompileRequestSource {
  readonly originKind: 'operatorProgression' | 'weapon' | 'equipmentSuit';
  readonly originId: string;
  readonly sourcePath: string;
  readonly skillId: string;
  readonly levelSource: PassiveSkillLevelSource;
  readonly inputBlackboard: Readonly<Record<string, number>>;
  /** Operator 养成效果的原生 SkillConditionTable ID；其他领域通常省略。 */
  readonly activeConditionIds?: readonly string[];
}
