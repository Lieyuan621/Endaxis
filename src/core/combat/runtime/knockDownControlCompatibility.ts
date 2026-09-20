import type { CombatOperatorProgram } from './combatRuntimeAssembly';

/**
 * 起身阶段的省略门禁：只访问编译后的静态程序，不遍历 Buff 容器、时钟或其他可变状态。
 * 这是保守的结构检查，不作分支活跃性/跨 Buff 目标传播优化；不明目标必须阻断。
 */
export function inspectKnockDownControlConsumers(operators: readonly CombatOperatorProgram[]) {
  const rows: { row: Record<string, unknown>; path: string }[] = [];
  function visit(value: unknown, path: string): void {
    if (Array.isArray(value)) {
      value.forEach((child, index) => visit(child, `${path}[${index}]`));
    } else if (value !== null && typeof value === 'object') {
      const row = value as Record<string, unknown>;
      rows.push({ row, path });
      Object.entries(row).forEach(([key, child]) => visit(child, `${path}.${key}`));
    }
  }
  operators.forEach((operator, index) => {
    // 明确列出静态入口；不把整个 CombatOperatorProgram 当成可序列化文档扫描。
    const roots = {
      skills: operator.skills,
      definitionSkillPrograms: operator.definitionSkillPrograms,
      skillCasts: operator.skillCasts?.map(binding => binding.program),
      buffDefinitions: operator.buffDefinitions,
      abilityEntityDefinitions: operator.abilityEntityDefinitions,
      initializationPrograms: operator.initializationPrograms,
      passivePrograms: operator.passivePrograms,
      upgradeEventPrograms: operator.upgradeEventPrograms,
      comboConditionPrograms: operator.comboConditionPrograms,
      equipmentContributions: operator.equipmentContributions,
      combatModifiers: operator.panel?.combatModifiers,
    };
    visit(roots, `operators[${index}]('${operator.operatorId}')`);
  });
  const hasControl = rows.some(
    ({ row }) =>
      row.kind === 'applyKnockDown' &&
      (row.parameters as Record<string, unknown>).targetFilter !== 'skipAll',
  );
  if (!hasControl) return [];
  const getUp = 'Status/Immobilized/Getup';
  return rows.flatMap(({ row, path }) => {
    if (row.kind !== 'entityTagMatch' || !Array.isArray(row.tags)) return [];
    // 祖先查询同样可能观察 Getup；即使某个查询配置实际为 exact，也暂保守阻断。
    const observesGetUp = row.tags.some(
      tag => typeof tag === 'string' && (tag === getUp || getUp.startsWith(`${tag}/`)),
    );
    if (!observesGetUp || row.target === 'caster') return [];
    return [
      {
        path,
        detail: `knock-down cannot omit get-up: entityTagMatch on '${String(row.target)}' may observe ${getUp}; target ownership or get-up runtime is required`,
      },
    ];
  });
}
