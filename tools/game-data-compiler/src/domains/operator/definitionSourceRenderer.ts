type RecordValue = Readonly<Record<string, unknown>>;

interface RenderContext {
  readonly helpers: Set<string>;
  readonly sharedSequenceReferenceByObject: WeakMap<object, SharedActionSequenceReference>;
  renderingSharedSequenceIdentifier?: string;
  renderingIdentityPlaceholderByValue?: ReadonlyMap<string, string>;
}

interface RawExpression {
  readonly rawExpression: string;
}

/**
 * 将整名编译器的结构化结果渲染成与旧生成器一致的声明式源码。
 * 这里只恢复机械 DSL（调度、序列、步骤和技能黑板），不重新解释游戏规则。
 */
export function renderOperatorDefinitionSource(input: { readonly operator: RecordValue }): string {
  assertFiniteNumbers(input, '$');
  const operator = { ...input.operator };
  const sharedSequences = collectSharedActionSequences(operator);
  const context: RenderContext = {
    helpers: new Set(),
    sharedSequenceReferenceByObject: sharedSequences.referenceByObject,
  };
  const skillDeclarations: string[] = [];
  const renderedSkills = new Map<string, string>();
  const registerSkill = (skillValue: unknown, path: string): RawExpression => {
    const skill = requireRecord(skillValue, path);
    const key = requireString(skill.key, `${path}.key`);
    const identifier = `${toIdentifier(requireString(operator.slug, 'operator.slug'))}${upperFirst(toIdentifier(key))}`;
    const signature = JSON.stringify(skill);
    const previous = renderedSkills.get(key);
    if (previous !== undefined) {
      if (previous !== signature) throw new Error(`conflicting rendered operator skill ${key}`);
      return raw(identifier);
    }
    renderedSkills.set(key, signature);
    skillDeclarations.push(
      `export const ${identifier}: SkillDefinition = ${renderSkill(skill, context)};`,
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

  const renderedOperator = renderValue(operator, context);
  const sharedSequenceDeclarations = sharedSequences.definitions.map(definition => {
    context.renderingSharedSequenceIdentifier = definition.identifier;
    context.renderingIdentityPlaceholderByValue = new Map(
      definition.identities.map((value, index) => [value, generatedIdentityPlaceholder(index)]),
    );
    const rendered = renderValue(definition.value, context);
    context.renderingSharedSequenceIdentifier = undefined;
    context.renderingIdentityPlaceholderByValue = undefined;
    return `const ${definition.identifier}: ActionSequenceDefinition = ${rendered};`;
  });
  const helperImport = [...context.helpers].sort().join(', ');
  return `/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type {
${sharedSequenceDeclarations.length > 0 ? '  ActionSequenceDefinition,\n' : ''}
  OperatorDefinition,
  SkillDefinition,
} from '../../core/game-data/operatorDefinition';
${helperImport ? `import { ${helperImport} } from './definitionHelpers';\n` : ''}
${sharedSequenceDeclarations.join('\n\n')}
${sharedSequenceDeclarations.length > 0 ? '\n' : ''}
${skillDeclarations.join('\n\n')}

export const ${toIdentifier(requireString(operator.slug, 'operator.slug'))}: OperatorDefinition = ${renderedOperator} as const satisfies OperatorDefinition;

export default ${toIdentifier(requireString(operator.slug, 'operator.slug'))};
`;
}

/** 公共 Buff 是独立、不可编辑的全局资源；不得从任一干员生成文件反向聚合。 */
export function renderCommonBuffDefinitionsSource(definitions: RecordValue): string {
  assertFiniteNumbers(definitions, '$.commonBuffDefinitions');
  const context: RenderContext = {
    helpers: new Set(),
    sharedSequenceReferenceByObject: new WeakMap(),
  };
  const rendered = renderValue(definitions, context);
  const helperImport = [...context.helpers].sort().join(', ');
  return `/** 由 tools/game-data-compiler 公共 Buff 生成器生成；不要手工编辑。 */
import type { OperatorBuffDefinitions } from '../../../core/game-data/operatorDefinition';
${helperImport ? `import { ${helperImport} } from '../../operators/definitionHelpers';\n` : ''}
export const commonBuffDefinitions = Object.freeze(${rendered}) as OperatorBuffDefinitions;
`;
}

function assertFiniteNumbers(value: unknown, path: string): void {
  if (typeof value === 'number') {
    // Unity AnimationCurve 用 ±Infinity tangent 表示阶跃切线；旧生成器也以显式
    // Number 常量保留。NaN 没有对应的合法来源语义，仍必须带路径失败。
    if (Number.isNaN(value)) throw new Error(`cannot render NaN at ${path}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFiniteNumbers(item, `${path}[${index}]`));
    return;
  }
  if (value === null || typeof value !== 'object' || isRaw(value)) return;
  for (const [key, item] of Object.entries(value)) assertFiniteNumbers(item, `${path}.${key}`);
}

function renderSkill(skill: RecordValue, context: RenderContext): string {
  if (!hasOwn(skill, 'blackboard')) return renderValue(skill, context);
  const { blackboard, ...definition } = skill;
  context.helpers.add('withSkillBlackboard');
  return `withSkillBlackboard(${renderValue(definition, context)}, ${renderValue(blackboard, context)})`;
}

function renderValue(value: unknown, context: RenderContext, property?: string): string {
  if (isRaw(value)) return value.rawExpression;
  if (value !== null && typeof value === 'object') {
    const shared = context.sharedSequenceReferenceByObject.get(value);
    if (shared !== undefined && shared.identifier !== context.renderingSharedSequenceIdentifier) {
      if (shared.identities.length === 0) return shared.identifier;
      context.helpers.add('instantiateActionSequence');
      return `instantiateActionSequence(${shared.identifier}, ${renderValue(shared.identities, context)})`;
    }
  }
  if (typeof value === 'string')
    return JSON.stringify(context.renderingIdentityPlaceholderByValue?.get(value) ?? value);
  if (value === null || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (value === Number.POSITIVE_INFINITY) return 'Number.POSITIVE_INFINITY';
    if (value === Number.NEGATIVE_INFINITY) return 'Number.NEGATIVE_INFINITY';
    if (Number.isNaN(value)) throw new Error('cannot render NaN');
    if (property === 'attackScale') {
      context.helpers.add('percentage');
      return `percentage(${renderNumber(value * 100)})`;
    }
    return renderNumber(value);
  }
  if (Array.isArray(value)) {
    if (property === 'attackScale' && value.every(item => typeof item === 'number')) {
      context.helpers.add('percentages');
      return `percentages([${value.map(item => renderNumber(item * 100)).join(', ')}])`;
    }
    return `[${value.map(item => renderValue(item, context)).join(', ')}]`;
  }
  const record = requireRecord(value, 'rendered value');
  const helper = renderHelper(record, context);
  if (helper !== null) return helper;
  return `{${Object.entries(record)
    .map(([key, item]) => `${JSON.stringify(key)}: ${renderValue(item, context, key)}`)
    .join(', ')}}`;
}

const SHARED_ACTION_SEQUENCE_MINIMUM_SIGNATURE_LENGTH = 1_000;

interface SharedActionSequenceDefinition {
  readonly identifier: string;
  readonly value: RecordValue;
  readonly identities: readonly string[];
}

interface SharedActionSequenceReference {
  readonly identifier: string;
  readonly identities: readonly string[];
}

/**
 * 原生 SkillData 会从多个发射点调用同一个投射物回调。编译后的动作序列若完全相同，
 * 源码无需再次内联几百份；这里只共享不可变定义对象，不删除分支、不改 step key，也不把
 * “形似”当作“相同”。阈值只避免为很短的重复序列制造比正文更吵的声明。
 */
function collectSharedActionSequences(value: unknown): {
  readonly definitions: readonly SharedActionSequenceDefinition[];
  readonly referenceByObject: WeakMap<object, SharedActionSequenceReference>;
} {
  const occurrences = new Map<
    string,
    {
      count: number;
      readonly values: { readonly value: RecordValue; readonly identities: readonly string[] }[];
      readonly firstOrder: number;
    }
  >();
  let order = 0;
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (item === null || typeof item !== 'object' || isRaw(item)) return;
    const record = item as RecordValue;
    if (sameKeys(Object.keys(record), ['steps']) && Array.isArray(record.steps)) {
      const normalized = identityParameterizedValueSignature(record);
      const previous = occurrences.get(normalized.signature);
      if (previous === undefined) {
        occurrences.set(normalized.signature, {
          count: 1,
          values: [{ value: record, identities: normalized.identities }],
          firstOrder: order++,
        });
      } else {
        previous.count += 1;
        previous.values.push({ value: record, identities: normalized.identities });
      }
    }
    Object.values(record).forEach(visit);
  };
  visit(value);

  const selected = [...occurrences]
    .filter(
      ([signature, occurrence]) =>
        occurrence.count > 1 && signature.length >= SHARED_ACTION_SEQUENCE_MINIMUM_SIGNATURE_LENGTH,
    )
    .sort((left, right) => left[1].firstOrder - right[1].firstOrder)
    .map(([signature, occurrence], index) => ({
      signature,
      occurrence,
      identifier: `sharedActionSequence${index + 1}`,
    }));
  const referenceByObject = new WeakMap<object, SharedActionSequenceReference>();
  for (const entry of selected) {
    for (const occurrence of entry.occurrence.values) {
      referenceByObject.set(occurrence.value, {
        identifier: entry.identifier,
        identities: occurrence.identities,
      });
    }
  }
  return {
    definitions: selected
      // 子序列声明必须先于引用它的较大父序列；名称仍按首次出现顺序保持稳定。
      .sort((left, right) => left.signature.length - right.signature.length)
      .map(entry => ({
        identifier: entry.identifier,
        value: entry.occurrence.values[0]!.value,
        identities: entry.occurrence.values[0]!.identities,
      })),
    referenceByObject,
  };
}

function identityParameterizedValueSignature(value: unknown): {
  readonly signature: string;
  readonly identities: readonly string[];
} {
  const identityIndexes = new Map<string, number>();
  const identities: string[] = [];
  const signature = JSON.stringify(value, (_key, item: unknown) => {
    if (typeof item !== 'number' || Number.isFinite(item)) return item;
    if (item === Number.POSITIVE_INFINITY) return { $number: 'positiveInfinity' };
    if (item === Number.NEGATIVE_INFINITY) return { $number: 'negativeInfinity' };
    return { $number: 'nan' };
  });
  const normalized = JSON.stringify(value, (_key, item: unknown) => {
    if (typeof item === 'string' && isGeneratedIdentity(item)) {
      let index = identityIndexes.get(item);
      if (index === undefined) {
        index = identities.length;
        identityIndexes.set(item, index);
        identities.push(item);
      }
      return { $generatedIdentity: index };
    }
    if (typeof item !== 'number' || Number.isFinite(item)) return item;
    if (item === Number.POSITIVE_INFINITY) return { $number: 'positiveInfinity' };
    if (item === Number.NEGATIVE_INFINITY) return { $number: 'negativeInfinity' };
    return { $number: 'nan' };
  });
  return { signature: identities.length === 0 ? signature : normalized, identities };
}

function isGeneratedIdentity(value: string): boolean {
  return (
    value.startsWith('SkillData.') ||
    value.includes(':/scheduledSequences/') ||
    value.includes(':/eventListeners/') ||
    value.includes(':/lifecycleSequences/')
  );
}

function generatedIdentityPlaceholder(index: number): string {
  return `\u0000endaxis-generated-identity:${index}`;
}

function renderHelper(value: RecordValue, context: RenderContext): string | null {
  const keys = Object.keys(value);
  if (sameKeys(keys, ['steps'])) {
    context.helpers.add('sequence');
    return `sequence(${requireArray(value.steps, 'sequence.steps')
      .map(step => renderValue(step, context))
      .join(', ')})`;
  }
  if (
    keys.every(key => ['startFrame', 'endFrame', 'sequence'].includes(key)) &&
    hasOwn(value, 'startFrame') &&
    hasOwn(value, 'sequence')
  ) {
    context.helpers.add('scheduled');
    const args = [renderValue(value.startFrame, context), renderValue(value.sequence, context)];
    if (hasOwn(value, 'endFrame')) args.push(renderValue(value.endFrame, context));
    return `scheduled(${args.join(', ')})`;
  }
  if (typeof value.kind !== 'string' || !hasOwn(value, 'parameters')) return null;
  const parameters = requireRecord(value.parameters, `${value.kind}.parameters`);
  if (value.kind === 'conditional' && hasOwn(value, 'whenTrue')) {
    context.helpers.add('branch');
    const { condition, alwaysNext, ...unexpected } = parameters;
    if (Object.keys(unexpected).length || condition === undefined) return null;
    const args = [renderValue(condition, context), renderValue(value.whenTrue, context)];
    if (hasOwn(value, 'whenFalse')) args.push(renderValue(value.whenFalse, context));
    else if (alwaysNext === true) args.push('undefined');
    if (alwaysNext === true) args.push('{ alwaysNext: true }');
    return `branch(${args.join(', ')})`;
  }
  if (
    value.kind === 'once' &&
    sameKeys(Object.keys(parameters), ['scopeKey']) &&
    hasOwn(value, 'body')
  )
    return callHelper('once', [parameters.scopeKey, value.body], context);
  if (value.kind === 'repeatEachTick' && keys.length === 3 && hasOwn(value, 'body'))
    return callHelper(
      'repeatEachTick',
      Object.keys(parameters).length === 0 ? [value.body] : [value.body, parameters],
      context,
    );
  if (
    value.kind === 'repeatByActionValue' &&
    sameKeys(Object.keys(parameters), ['count']) &&
    hasOwn(value, 'body')
  )
    return callHelper('repeatByActionValue', [parameters.count, value.body], context);
  if (
    value.kind === 'forEachContextTarget' &&
    sameKeys(Object.keys(parameters), ['contextKey']) &&
    hasOwn(value, 'body')
  )
    return callHelper('forEachContextTarget', [parameters.contextKey, value.body], context);
  if (
    value.kind === 'forEachContextTarget' &&
    sameKeys(Object.keys(parameters), ['target']) &&
    hasOwn(value, 'body')
  )
    return callHelper('forEachTarget', [parameters.target, value.body], context);
  if (value.kind === 'withActionBlackboardScope' && hasOwn(value, 'body')) {
    const {
      scopeKey,
      lifetime,
      alwaysNext,
      initialValues,
      inheritParent,
      entityInitialValues,
      entityAssignments,
      ...unexpected
    } = parameters;
    if (
      Object.keys(unexpected).length === 0 &&
      scopeKey !== undefined &&
      initialValues !== undefined &&
      inheritParent !== undefined
    ) {
      const args = [scopeKey, initialValues, inheritParent, value.body];
      if (
        entityInitialValues !== undefined ||
        lifetime !== undefined ||
        alwaysNext === true ||
        entityAssignments !== undefined
      )
        args.push(entityInitialValues === undefined ? raw('undefined') : entityInitialValues);
      if (lifetime !== undefined || alwaysNext === true || entityAssignments !== undefined)
        args.push({
          ...(lifetime === undefined ? {} : { lifetime }),
          ...(alwaysNext === true ? { alwaysNext: true } : {}),
          ...(entityAssignments === undefined ? {} : { entityAssignments }),
        });
      return callHelper('withActionBlackboardScope', args, context);
    }
  }
  if (keys.every(key => ['kind', 'parameters', 'key'].includes(key))) {
    context.helpers.add('step');
    const args: unknown[] = [value.kind, parameters];
    if (hasOwn(value, 'key')) args.push(value.key);
    return `step(${args.map(item => renderValue(item, context)).join(', ')})`;
  }
  return null;
}

function callHelper(name: string, args: readonly unknown[], context: RenderContext): string {
  context.helpers.add(name);
  return `${name}(${args.map(value => renderValue(value, context)).join(', ')})`;
}

function renderNumber(value: number): string {
  return String(Number(value.toPrecision(15)));
}

function raw(rawExpression: string): RawExpression {
  return { rawExpression };
}

function isRaw(value: unknown): value is RawExpression {
  return typeof value === 'object' && value !== null && 'rawExpression' in value;
}

function hasOwn(value: RecordValue, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function sameKeys(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length && expected.every(key => actual.includes(key));
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
