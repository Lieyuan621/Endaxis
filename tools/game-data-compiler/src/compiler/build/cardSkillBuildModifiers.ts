import type { LevelValues } from '../../../../../packages/game-data-contract/src/index.ts';
import { compileResolvedAttributeModifierSource } from './attributeModifier.ts';
import {
  isBuildContributionModifier,
  projectBuildAttributeModifier,
} from './buildAttributeProjection.ts';
import type {
  BuildDefinitionDiagnosticSource,
  CompiledBuildModifierDefinitionSource,
} from './formalBuildDefinition.ts';
import type { CompiledPassiveSkillDefinitionSource } from '../skills/passiveSkillBatch.ts';

/**
 * 公共 CardSkill 静态属性编译：参数引用绑定整列，字面量保持单值，每条原生修正只投影一次。
 * 武器传入全部等级列，套装传入其固定等级的安装黑板；这里不负责选择领域等级。
 * 缺失黑板不能补零，未知目标/公式槽不能按数值或名称推断；诊断交由领域阻止完整装配。
 */
export function compileCardSkillBuildModifiers(
  compiled: CompiledPassiveSkillDefinitionSource,
  blackboard: Readonly<Record<string, LevelValues>>,
  diagnostics: BuildDefinitionDiagnosticSource[],
): CompiledBuildModifierDefinitionSource[] {
  return compiled.definition.skill.cardAttributeModifiers.modifiers.flatMap(
    (nativeModifier, index) => {
      const sourcePath = `${compiled.sourcePath}.cardAttributeModifier.attributeModifiers[${index}]`;
      const key = nativeModifier.parameter.blackboardKey;
      const value = key === null ? nativeModifier.parameter.value : blackboard[key];
      if (value === undefined) {
        diagnostics.push({
          status: 'blocked',
          sourcePath,
          reason: `missing materialized blackboard value ${JSON.stringify(key)}`,
        });
        return [];
      }
      const projection = projectBuildAttributeModifier(
        compileResolvedAttributeModifierSource({
          sourcePath,
          modifyAttributeType: nativeModifier.modifyAttributeType,
          attributeType: nativeModifier.attributeType,
          formulaItem: nativeModifier.formulaItem,
          value,
        }),
      );
      if (projection.status !== 'supported') {
        diagnostics.push({ status: projection.status, sourcePath, reason: projection.reason });
        return [];
      }
      if (!isBuildContributionModifier(projection.modifier)) {
        diagnostics.push({
          status: 'blocked',
          sourcePath,
          reason: 'CardSkill cannot define GearDefinition.baseDefense',
        });
        return [];
      }
      return [projection.modifier];
    },
  );
}
