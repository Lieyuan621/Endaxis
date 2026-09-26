import { prepareActionGraphIdentities } from '../../compiler/optimization/actionGraphProjection.ts';
import {
  assertFiniteNumbers,
  createRenderContext,
  raw,
  renderIndependentGraphDefinition,
  renderValue,
  type RawExpression,
} from '../../compiler/optimization/actionGraphSourceRenderer.ts';
type RecordValue = Readonly<Record<string, unknown>>;

/**
 * 只输出已完成构图的独立资源；干员是资源目录，不拥有动作节点。
 */
export function renderOperatorDefinitionSource(input: { readonly operator: object }): string {
  assertFiniteNumbers(input, '$');
  const operator = { ...input.operator } as Record<string, unknown>;
  const context = createRenderContext();
  const skillDeclarations: string[] = [];
  const renderedSkills = new Map<string, string>();
  const registerSkill = (skillValue: unknown, path: string): RawExpression => {
    const skill = requireRecord(prepareActionGraphIdentities(skillValue), path);
    const key = requireString(skill.key, `${path}.key`);
    const identifier = `${toIdentifier(requireString(operator.slug, 'operator.slug'))}${upperFirst(toIdentifier(key))}`;
    const signature = JSON.stringify(skill);
    const previous = renderedSkills.get(key);
    if (previous !== undefined) {
      if (previous !== signature) throw new Error(`conflicting rendered operator skill ${key}`);
      return raw(identifier);
    }
    renderedSkills.set(key, signature);
    const graphIdentifier = `${identifier}ActionGraph`;
    const rendered = renderIndependentGraphDefinition(skill, graphIdentifier);
    for (const helper of rendered.helpers) context.helpers.add(helper);
    skillDeclarations.push(
      `export const ${graphIdentifier} = ${rendered.graph} as const satisfies ActionGraphResourceDefinition;`,
      `export const ${identifier}: SkillDefinition = ${rendered.definition};`,
    );
    return raw(identifier);
  };
  const registerSkills = (value: unknown, path: string): RawExpression | RawExpression[] =>
    Array.isArray(value)
      ? value.map((skill, index) => registerSkill(skill, `${path}[${index}]`))
      : registerSkill(value, path);
  const skillGroups = requireArray(operator.skillGroups, 'operator.skillGroups').map(
    (groupValue, groupIndex) => {
      const group = requireRecord(groupValue, `operator.skillGroups[${groupIndex}]`);
      const groupPath = `operator.skillGroups[${groupIndex}]`;
      return {
        ...group,
        skills: registerSkills(group.skills, `${groupPath}.skills`),
        ...(Array.isArray(group.variants)
          ? {
              variants: group.variants.map((variantValue, variantIndex) => {
                const variant = requireRecord(
                  variantValue,
                  `${groupPath}.variants[${variantIndex}]`,
                );
                return {
                  ...variant,
                  skills: registerSkills(
                    variant.skills,
                    `${groupPath}.variants[${variantIndex}].skills`,
                  ),
                };
              }),
            }
          : {}),
        ...(Array.isArray(group.replacementSkills)
          ? {
              replacementSkills: group.replacementSkills.map((skill, index) =>
                registerSkill(skill, `${groupPath}.replacementSkills[${index}]`),
              ),
            }
          : {}),
        ...(Array.isArray(group.routedReplacementSkills)
          ? {
              routedReplacementSkills: group.routedReplacementSkills.map(
                (routeValue, routeIndex) => {
                  const route = requireRecord(
                    routeValue,
                    `${groupPath}.routedReplacementSkills[${routeIndex}]`,
                  );
                  return {
                    ...route,
                    skill: registerSkill(
                      route.skill,
                      `${groupPath}.routedReplacementSkills[${routeIndex}].skill`,
                    ),
                  };
                },
              ),
            }
          : {}),
      };
    },
  );
  operator.skillGroups = skillGroups;
  if (operator.dodgeSkill !== undefined) {
    operator.dodgeSkill = registerSkill(operator.dodgeSkill, 'operator.dodgeSkill');
  }
  const renderedPassives = new Map<string, { signature: string; identifier: string }>();
  const registerPassive = (value: unknown, path: string): RawExpression => {
    const passive = requireRecord(prepareActionGraphIdentities(value), path);
    const key = requireString(passive.key, `${path}.key`);
    const signature = JSON.stringify(passive);
    const previous = renderedPassives.get(key);
    if (previous !== undefined) {
      if (previous.signature !== signature) throw new Error(`conflicting passive SkillData ${key}`);
      return raw(previous.identifier);
    }
    const identifier = `${toIdentifier(requireString(operator.slug, 'operator.slug'))}Passive${renderedPassives.size + 1}`;
    renderedPassives.set(key, { signature, identifier });
    const graphIdentifier = `${identifier}ActionGraph`;
    const rendered = renderIndependentGraphDefinition(passive, graphIdentifier);
    rendered.helpers.forEach(helper => context.helpers.add(helper));
    skillDeclarations.push(
      `const ${graphIdentifier} = ${rendered.graph} as const satisfies ActionGraphResourceDefinition;`,
      `const ${identifier}: OperatorPassiveSkillDefinition = ${rendered.definition};`,
    );
    return raw(identifier);
  };
  const registerPassives = (value: unknown, path: string): RawExpression[] =>
    requireArray(value, path).map((passive, index) =>
      registerPassive(passive, `${path}[${index}]`),
    );
  if (operator.passiveSkills !== undefined) {
    operator.passiveSkills = registerPassives(operator.passiveSkills, 'operator.passiveSkills');
  }
  for (const collection of ['talents', 'potentials'] as const) {
    if (!Array.isArray(operator[collection])) continue;
    operator[collection] = operator[collection].map((upgradeValue, index) => {
      const path = `operator.${collection}[${index}]`;
      const upgrade = requireRecord(upgradeValue, path);
      const prepared = {
        ...upgrade,
        ...(upgrade.passiveSkills === undefined
          ? {}
          : {
              passiveSkills: registerPassives(upgrade.passiveSkills, `${path}.passiveSkills`),
            }),
      };
      if (upgrade.initializationSequence === undefined && upgrade.eventHandlers === undefined)
        return prepared;
      const name = `${toIdentifier(requireString(operator.slug, 'operator.slug'))}${collection}${index + 1}`;
      const graphName = `${name}ActionGraph`;
      const rendered = renderIndependentGraphDefinition(
        requireRecord(prepareActionGraphIdentities(prepared), path),
        graphName,
      );
      rendered.helpers.forEach(helper => context.helpers.add(helper));
      skillDeclarations.push(
        `const ${graphName} = ${rendered.graph} as const satisfies ActionGraphResourceDefinition;`,
        `const ${name}: import('../../../packages/game-data-contract/src/operators').OperatorUpgradeDefinition = ${rendered.definition};`,
      );
      return raw(name);
    });
  }
  if (Array.isArray(operator.comboSkillConditions)) {
    operator.comboSkillConditions = operator.comboSkillConditions.map((value, index) => {
      const path = `operator.comboSkillConditions[${index}]`;
      const condition = requireRecord(prepareActionGraphIdentities(value), path);
      const name = `${toIdentifier(requireString(operator.slug, 'operator.slug'))}ComboCondition${index + 1}`;
      const graphName = `${name}ActionGraph`;
      const rendered = renderIndependentGraphDefinition(condition, graphName);
      rendered.helpers.forEach(helper => context.helpers.add(helper));
      skillDeclarations.push(
        `const ${graphName} = ${rendered.graph} as const satisfies ActionGraphResourceDefinition;`,
        `const ${name}: ComboSkillConditionDefinition = ${rendered.definition};`,
      );
      return raw(name);
    });
  }
  if (operator.buffDefinitions !== undefined) {
    const buffDefinitions = requireRecord(operator.buffDefinitions, 'operator.buffDefinitions');
    operator.buffDefinitions = Object.fromEntries(
      Object.entries(buffDefinitions).map(([id, value], index) => {
        const definition = requireRecord(value, `operator.buffDefinitions.${id}`);
        if (definition.actionGraph === undefined) return [id, definition];
        const name = `${toIdentifier(requireString(operator.slug, 'operator.slug'))}Buff${index + 1}`;
        const graphName = `${name}ActionGraph`;
        const rendered = renderIndependentGraphDefinition(
          requireRecord(prepareActionGraphIdentities(definition), `operator.buffDefinitions.${id}`),
          graphName,
        );
        rendered.helpers.forEach(helper => context.helpers.add(helper));
        skillDeclarations.push(
          `const ${graphName} = ${rendered.graph} as const satisfies ActionGraphResourceDefinition;`,
          `const ${name}: SkillBuffDefinition = ${rendered.definition};`,
        );
        return [id, raw(name)];
      }),
    );
  }

  const renderedBase = renderValue(prepareActionGraphIdentities(operator), context);
  const renderedOperator = renderedBase;
  const helperImport = [...context.helpers].sort().join(', ');
  const graphTypes = [
    ...(skillDeclarations.some(line => line.includes(': SkillDefinition'))
      ? ['SkillDefinition']
      : []),
    ...(skillDeclarations.some(line => line.includes(': OperatorPassiveSkillDefinition'))
      ? ['OperatorPassiveSkillDefinition']
      : []),
    ...(skillDeclarations.some(line => line.includes(': ComboSkillConditionDefinition'))
      ? ['ComboSkillConditionDefinition']
      : []),
    ...(skillDeclarations.some(line => line.includes(': SkillBuffDefinition'))
      ? ['SkillBuffDefinition']
      : []),
    ...(skillDeclarations.some(line => line.includes('satisfies ActionGraphResourceDefinition'))
      ? ['ActionGraphResourceDefinition']
      : []),
  ];
  return `/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
${helperImport ? `import { ${helperImport} } from './definitionHelpers';\n` : ''}
${['actionGraph', 'skills', 'buffs', 'operators']
  .map(module => {
    const types = graphTypes.filter(
      type =>
        (type === 'ActionGraphResourceDefinition'
          ? 'actionGraph'
          : type === 'SkillBuffDefinition'
            ? 'buffs'
            : type === 'SkillDefinition' || type === 'AbilityEntityDefinition'
              ? 'skills'
              : 'operators') === module,
    );
    return types.length
      ? `import type { ${types.join(', ')} } from '../../../packages/game-data-contract/src/${module}';`
      : '';
  })
  .filter(Boolean)
  .join('\n')}
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
${skillDeclarations.join('\n\n')}

export const ${toIdentifier(requireString(operator.slug, 'operator.slug'))}: OperatorDefinition = ${renderedOperator} as const satisfies OperatorDefinition;

export default ${toIdentifier(requireString(operator.slug, 'operator.slug'))};
`;
}

/** 公共 Buff 是独立、不可编辑的全局资源；不得从任一干员生成文件反向聚合。 */
export function renderCommonBuffDefinitionsSource(
  definitions: RecordValue,
  exportName = 'commonBuffDefinitions',
): string {
  if (!/^[$A-Z_a-z][$\w]*$/.test(exportName)) throw new Error('invalid Buff export name');
  assertFiniteNumbers(definitions, '$.commonBuffDefinitions');
  const helpers = new Set<string>();
  const declarations: string[] = [];
  const entries: string[] = [];
  for (const [index, [id, value]] of Object.entries(definitions)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .entries()) {
    const name = `commonBuff${index + 1}`;
    const graphName = `${name}ActionGraph`;
    const definition = prepareActionGraphIdentities(
      requireRecord(value, `commonBuffDefinitions.${id}`),
    );
    if (definition.actionGraph === undefined) {
      const context = createRenderContext();
      declarations.push(
        `const ${name}: OperatorBuffDefinitions[string] = ${renderValue(definition, context)};`,
      );
      context.helpers.forEach(helper => helpers.add(helper));
      entries.push(`${JSON.stringify(id)}: ${name}`);
      continue;
    }
    const rendered = renderIndependentGraphDefinition(definition, graphName);
    rendered.helpers.forEach(helper => helpers.add(helper));
    declarations.push(
      `const ${graphName} = ${rendered.graph} as const satisfies ActionGraphResourceDefinition;`,
      `const ${name}: SkillBuffDefinition = ${rendered.definition};`,
    );
    entries.push(`${JSON.stringify(id)}: ${name}`);
  }
  const helperImport = [...helpers].sort().join(', ');
  return `/** 由 tools/game-data-compiler 公共 Buff 生成器生成；不要手工编辑。 */
import type { OperatorBuffDefinitions } from '../../../core/game-data/operatorDefinition';
${helperImport ? `import { ${helperImport} } from '../../operators/definitionHelpers';\n` : ''}
import type { ActionGraphResourceDefinition } from '../../../../packages/game-data-contract/src/actionGraph';
import type { SkillBuffDefinition } from '../../../../packages/game-data-contract/src/buffs';
${declarations.join('\n\n')}
export const ${exportName}: OperatorBuffDefinitions = Object.freeze({ ${entries.join(', ')} });
`;
}

function requireRecord(value: unknown, path: string): RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error(`${path}: expected object`);
  return value as RecordValue;
}

function requireArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${path}: expected array`);
  return value;
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value) throw new Error(`${path}: expected string`);
  return value;
}

function toIdentifier(value: string): string {
  const parts = value.split(/[^A-Za-z0-9_$]+/).filter(Boolean);
  const result = parts.map((part, index) => (index ? upperFirst(part) : part)).join('');
  if (!/^[$A-Z_a-z]/.test(result)) return `_${result}`;
  return result;
}

function upperFirst(value: string): string {
  return value ? value[0]!.toUpperCase() + value.slice(1) : value;
}
