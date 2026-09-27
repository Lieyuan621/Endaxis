import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';

/** 供方案选择的全局效果资产；启用后由场景机制向队伍施加此 Buff。 */
export interface GlobalEffectDefinition {
  readonly id: string;
  readonly nameKey?: string;
  readonly descriptionKey?: string;
  readonly buff: SkillBuffDefinition;
}
