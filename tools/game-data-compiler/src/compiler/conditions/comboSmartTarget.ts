import type { SkillTargetSelectionHeaderSource } from '../../source/skillTargetSelection.ts';

/** 固定木桩/普通选敌设置投影。来源头完整保留；不假装已经实现其他评分策略。 */
export function compileSkillSmartTargetSource(source: SkillTargetSelectionHeaderSource) {
  let smartTarget: 'enemy' | 'input' | 'trigger' | undefined;
  if (source.selectStrategy === 'SelectSmartObject') {
    switch (source.smartTargetSelectStrategy) {
      case 'SelectComboSkillTarget':
        smartTarget = 'input';
        break;
      case 'SelectComboSkillTrigger':
        smartTarget = 'trigger';
        break;
      case 'SelectByBuff':
      case 'SelectByTag':
      case 'SelectByBuffStackNum':
        // StoreSmartTarget 的原生智能评分失败后回退 MainTarget；固定木桩中唯一敌人
        // 存活且距离为零，因此无需伪造评分顺序即可收敛到同一实体。
        smartTarget = 'enemy';
        break;
      default:
        throw new Error(
          `${source.sourcePath}.smartTargetSelectStrategy: scoring projection is not audited`,
        );
    }
  }
  return {
    source,
    definition: smartTarget === undefined ? {} : { smartTarget },
    projection: 'fixed-dummy-normal-targeting' as const,
  };
}
