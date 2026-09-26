import { rootActionSteps } from '../../compiler/actionProgramInspection';
import type { CompiledGraphEntry } from '../../compiler/combatProgram';
import type { CombatOperatorProgram } from './combatRuntimeAssembly';

/**
 * 起身阶段的省略门禁：只访问编译后的静态程序，不遍历 Buff 容器、时钟或其他可变状态。
 * 仅证明直接由干员技能施加到自身的命名 Buff；不作跨 Buff 目标传播，不明目标仍阻断。
 */
export function inspectKnockDownControlConsumers(operators: readonly CombatOperatorProgram[]) {
  const rows: { row: Record<string, unknown>; path: string; ownerKey?: string }[] = [];
  const operatorOwnedBuffs = new Map<string, boolean>();
  function visit(
    value: unknown,
    path: string,
    operatorIndex: number,
    casterIsOperator = false,
    ownerKey?: string,
  ): void {
    if (Array.isArray(value)) {
      value.forEach((child, index) =>
        visit(child, `${path}[${index}]`, operatorIndex, casterIsOperator, ownerKey),
      );
    } else if (value !== null && typeof value === 'object') {
      if ('graph' in value && 'entry' in value) {
        // 只沿入口的语义出口检查；graph 是共享目录，含回指，不能作为 JSON 对象递归。
        visit(
          rootActionSteps(value as CompiledGraphEntry),
          `${path}.nodes`,
          operatorIndex,
          casterIsOperator,
          ownerKey,
        );
        return;
      }
      const row = value as Record<string, unknown>;
      rows.push({ row, path, ownerKey });
      if (row.kind === 'applyBuff') {
        const parameters = row.parameters as Record<string, unknown>;
        if (typeof parameters.buffId === 'string') {
          const key = `${operatorIndex}:${parameters.buffId}`;
          operatorOwnedBuffs.set(
            key,
            operatorOwnedBuffs.get(key) !== false &&
              casterIsOperator &&
              parameters.target === 'caster',
          );
        }
      }
      Object.entries(row).forEach(([key, child]) => {
        const nestedOwner =
          key === 'abilityEntityDefinitions' ||
          key === 'definition' ||
          key.endsWith('Definition') ||
          (child !== null && typeof child === 'object' && 'stackingType' in child);
        visit(
          child,
          `${path}.${key}`,
          operatorIndex,
          casterIsOperator &&
            !nestedOwner &&
            !['lifecycleSequences', 'abilityEventResponses', 'igniteEventResponses'].includes(key),
          nestedOwner ? undefined : ownerKey,
        );
      });
    }
  }
  operators.forEach((operator, index) => {
    // 明确列出静态入口；不把整个 CombatOperatorProgram 当成可序列化文档扫描。
    const roots = {
      skills: operator.skills,
      definitionSkillPrograms: operator.definitionSkillPrograms,
      skillCasts: operator.skillCasts?.map(binding => binding.program),
      abilityEntityDefinitions: operator.abilityEntityDefinitions,
      initializationPrograms: operator.initializationPrograms,
      passivePrograms: operator.passivePrograms,
      upgradeEventPrograms: operator.upgradeEventPrograms,
      comboConditionPrograms: operator.comboConditionPrograms,
      equipmentContributions: operator.equipmentContributions,
      combatModifiers: operator.panel?.combatModifiers,
    };
    const prefix = `operators[${index}]('${operator.operatorId}')`;
    for (const [key, value] of Object.entries(roots)) {
      visit(
        value,
        `${prefix}.${key}`,
        index,
        ['skills', 'definitionSkillPrograms', 'skillCasts'].includes(key),
      );
    }
    for (const [id, definition] of Object.entries(operator.buffDefinitions ?? {})) {
      visit(definition, `${prefix}.buffDefinitions.${id}`, index, false, `${index}:${id}`);
    }
  });
  const hasControl = rows.some(
    ({ row }) =>
      row.kind === 'applyKnockDown' &&
      (row.parameters as Record<string, unknown>).targetFilter !== 'skipAll',
  );
  if (!hasControl) return [];
  const getUp = 'Status/Immobilized/Getup';
  return rows.flatMap(({ row, path, ownerKey }) => {
    if (row.kind !== 'entityTagMatch' || !Array.isArray(row.tags)) return [];
    // 祖先查询同样可能观察 Getup；即使某个查询配置实际为 exact，也暂保守阻断。
    const observesGetUp = row.tags.some(
      tag => typeof tag === 'string' && (tag === getUp || getUp.startsWith(`${tag}/`)),
    );
    if (!observesGetUp || row.target === 'caster') return [];
    if (
      row.target === 'buffOwner' &&
      ownerKey !== undefined &&
      operatorOwnedBuffs.get(ownerKey) === true
    )
      return [];
    return [
      {
        path,
        detail: `knock-down cannot omit get-up: entityTagMatch on '${String(row.target)}' may observe ${getUp}; target ownership or get-up runtime is required`,
      },
    ];
  });
}
