import { compileAbilitySystemBlackboardsSource } from '../compiler/abilities/abilitySystemBlackboards.ts';
import {
  compileComboSkillConditionDefinitionSource,
  createOperatorComboActionProjectionContext,
} from '../compiler/conditions/comboSkillConditions.ts';
import { GameplayTagRegistry } from '../source/nativeGameplayTags.ts';
import { parseOperatorRuntimeTemplateSource } from '../source/operatorRuntimeTemplate.ts';
import { requireArray, requireNonEmptyString, requireRecord } from '../source/primitives.ts';

/**
 * 更新审计不改 pin，也不把 pin 变化当作解析失败而跳过新内容。
 * 尝试全部当前 CharacterData（含未配置身份），正式生成的严格身份门禁保持不变。
 */
export function auditOperatorTemplateRefresh(
  manifestValue: unknown,
  templatesBySourceFile: Readonly<Record<string, unknown>>,
  gameplayTagPaths: readonly string[],
) {
  const manifest = requireRecord(manifestValue, 'operators.json');
  const ignoredSourceFiles = new Set(
    requireArray(
      manifest.ignoredRuntimeTemplateSourceFiles ?? [],
      'operators.json.ignoredRuntimeTemplateSourceFiles',
    ).map((value, index) =>
      requireNonEmptyString(value, `operators.json.ignoredRuntimeTemplateSourceFiles[${index}]`),
    ),
  );
  const configured = requireArray(manifest.operators, 'operators.json.operators').map(
    (value, i) => {
      const row = requireRecord(value, `operators[${i}]`);
      const runtime = requireRecord(row.runtimeTemplate, `operators[${i}].runtimeTemplate`);
      return {
        slug: requireNonEmptyString(row.slug, `operators[${i}].slug`),
        sourceFile: requireNonEmptyString(runtime.sourceFile, `operators[${i}].sourceFile`),
        characterId: requireNonEmptyString(
          runtime.sourceCharacterId,
          `operators[${i}].sourceCharacterId`,
        ),
        sourceSha256: requireNonEmptyString(runtime.sourceSha256, `operators[${i}].sourceSha256`),
      };
    },
  );
  const context = createOperatorComboActionProjectionContext(
    new GameplayTagRegistry(gameplayTagPaths),
  );
  const sourceFiles = [
    ...new Set([...Object.keys(templatesBySourceFile), ...configured.map(row => row.sourceFile)]),
  ].sort();
  const entries = sourceFiles.map(sourceFile => {
    const bindings = configured.filter(row => row.sourceFile === sourceFile);
    const identity = { sourceFile, configuredSlugs: bindings.map(row => row.slug) };
    try {
      const template = parseOperatorRuntimeTemplateSource(
        templatesBySourceFile[sourceFile],
        sourceFile,
        { parseComboConditions: false },
      );
      const mismatched = bindings.filter(row => row.characterId !== template.characterId);
      if (mismatched.length)
        throw new Error(
          `template character identity mismatch: ${mismatched.map(row => row.slug).join(', ')}`,
        );
      const source = {
        ...identity,
        characterId: template.characterId,
        sourceSha256: template.sourceSha256,
        changedPins: bindings
          .filter(row => row.sourceSha256.toLowerCase() !== template.sourceSha256.toLowerCase())
          .map(row => row.slug),
        decodeStatus: template.decodeStatus,
        comboSkillId: template.comboSkillId,
      };
      try {
        const blackboards = compileAbilitySystemBlackboardsSource(template.blackboards);
        const decoded = parseOperatorRuntimeTemplateSource(
          templatesBySourceFile[sourceFile],
          sourceFile,
        );
        const conditions = decoded.conditions!.conditions.map(
          (condition, index) =>
            compileComboSkillConditionDefinitionSource(
              condition,
              blackboards,
              { key: `native-combo:${index}`, skillKey: template.comboSkillId },
              context,
            ).definition,
        );
        return {
          ...source,
          status: 'compiled-prefix' as const,
          conditionCount: conditions.length,
          events: conditions.map(condition => condition.event),
        };
      } catch (error) {
        return {
          ...source,
          status: 'blocked' as const,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    } catch (error) {
      return {
        ...identity,
        status: 'blocked' as const,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
  for (const sourceFile of ignoredSourceFiles) {
    if (!sourceFiles.includes(sourceFile))
      throw new Error(`ignored runtime template source does not exist: ${sourceFile}`);
    if (configured.some(row => row.sourceFile === sourceFile))
      throw new Error(`configured runtime template cannot be ignored: ${sourceFile}`);
  }
  return {
    scope: 'current-operator-template-prefix-refresh',
    sourceCount: Object.keys(templatesBySourceFile).length,
    configuredCount: configured.length,
    compiledPrefixCount: entries.filter(entry => entry.status === 'compiled-prefix').length,
    blockedCount: entries.filter(entry => entry.status === 'blocked').length,
    changedPinCount: entries.reduce(
      (count, entry) => count + ('changedPins' in entry ? entry.changedPins.length : 0),
      0,
    ),
    unconfiguredSourceFiles: entries
      .filter(
        entry => entry.configuredSlugs.length === 0 && !ignoredSourceFiles.has(entry.sourceFile),
      )
      .map(entry => entry.sourceFile),
    ignoredSourceFiles: [...ignoredSourceFiles].sort(),
    entries,
    note: '只验证已解码模板前缀/黑板/连携条件；源哈希变化不证明效果变化，未配置身份不等于新增可玩干员。未更新 pin，未验证完整技能闭包或模拟。',
  };
}
