import {
  parseBlackboardAssignmentsSource,
  type BlackboardAssignmentSource,
} from './assignments.ts';
import { parseBlackboardDataPairs, type DeclaredBlackboardValueSource } from './blackboard.ts';
import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseScalarSource, type ScalarSource } from './scalar.ts';

export interface GlobalBuffChildInputSource {
  readonly buffId: string;
  readonly assignBlackboard: boolean;
  readonly assignments: readonly BlackboardAssignmentSource[];
}

export interface GlobalBuffTemplateSource {
  readonly id: string;
  readonly lifeType: string;
  readonly duration: ScalarSource;
  readonly triggerInterval: ScalarSource;
  readonly waitFirstTriggerInterval: boolean;
  readonly maxTriggerCount: ScalarSource;
  readonly stackingIdentifierType: string;
  readonly stackingType: string;
  readonly stackingKey: string;
  readonly usePriorityKey: boolean;
  readonly priorityKey: string;
  readonly negatePriority: boolean;
  readonly priority: number;
  readonly maxStackCount: number;
  readonly applyIconDurationToBuffs: boolean;
  readonly children: readonly GlobalBuffChildInputSource[];
  readonly globalModifierCount: number;
  readonly globalModifiers: readonly {
    readonly attribute:
      'spRecovery' | 'gainEfficiency' | 'normalAttackEfficiency' | 'powerAttackEfficiency';
    readonly operation: 'addition' | 'multiplier';
    readonly value: ScalarSource;
    readonly applyToReturnSpGain: boolean;
  }[];
  readonly globalEventCount: number;
  readonly blackboard: readonly DeclaredBlackboardValueSource[];
}

export function parseGlobalBuffTemplateSource(
  value: unknown,
  path: string,
): GlobalBuffTemplateSource {
  const template = requireRecord(value, path);
  requireExactFields(
    template,
    new Set([
      'id',
      'lifeType',
      'duration',
      'triggerInterval',
      'waitFirstTriggerInterval',
      'maxTriggerCount',
      'stackingIdentifierType',
      'stackingType',
      'stackingKey',
      'usePriorityKey',
      'priorityKey',
      'negatePriority',
      'priority',
      'maxStackCount',
      'applyIconDurationToBuffs',
      'buffInputs',
      'globalModifierCount',
      'globalModifiers',
      'globalEventCount',
      'blackboard',
    ]),
    path,
  );
  const inherited = Object.fromEntries(
    parseBlackboardDataPairs(template.blackboard, `${path}.blackboard`)
      .filter(item => typeof item.value === 'number' && !item.isDynamic)
      .map(item => [item.key, item.value as number]),
  );
  return {
    id: requireNonEmptyString(template.id, `${path}.id`),
    lifeType: requireNonEmptyString(template.lifeType, `${path}.lifeType`),
    duration: parseScalarSource(template.duration, `${path}.duration`, inherited),
    triggerInterval: parseScalarSource(
      template.triggerInterval,
      `${path}.triggerInterval`,
      inherited,
    ),
    waitFirstTriggerInterval: requireBoolean(
      template.waitFirstTriggerInterval,
      `${path}.waitFirstTriggerInterval`,
    ),
    maxTriggerCount: parseScalarSource(
      template.maxTriggerCount,
      `${path}.maxTriggerCount`,
      inherited,
    ),
    stackingIdentifierType: requireNonEmptyString(
      template.stackingIdentifierType,
      `${path}.stackingIdentifierType`,
    ),
    stackingType: requireNonEmptyString(template.stackingType, `${path}.stackingType`),
    stackingKey: requireString(template.stackingKey, `${path}.stackingKey`),
    usePriorityKey: requireBoolean(template.usePriorityKey, `${path}.usePriorityKey`),
    priorityKey: requireString(template.priorityKey, `${path}.priorityKey`),
    negatePriority: requireBoolean(template.negatePriority, `${path}.negatePriority`),
    priority: requireNumber(template.priority, `${path}.priority`),
    maxStackCount: requireInteger(template.maxStackCount, `${path}.maxStackCount`),
    applyIconDurationToBuffs: requireBoolean(
      template.applyIconDurationToBuffs,
      `${path}.applyIconDurationToBuffs`,
    ),
    children: requireArray(template.buffInputs, `${path}.buffInputs`).map((value, index) => {
      const childPath = `${path}.buffInputs[${index}]`;
      const child = requireRecord(value, childPath);
      requireExactFields(child, new Set(['buffId', 'assignBlackboard', 'assignItems']), childPath);
      const assignBlackboard = requireBoolean(
        child.assignBlackboard,
        `${childPath}.assignBlackboard`,
      );
      return {
        buffId: requireNonEmptyString(child.buffId, `${childPath}.buffId`),
        assignBlackboard,
        assignments: parseBlackboardAssignmentsSource(
          child.assignItems,
          `${childPath}.assignItems`,
          { enabled: assignBlackboard },
        ),
      };
    }),
    globalModifierCount: requireInteger(
      template.globalModifierCount,
      `${path}.globalModifierCount`,
    ),
    globalModifiers: parseGlobalModifiers(
      template.globalModifiers,
      `${path}.globalModifiers`,
      inherited,
    ),
    globalEventCount: requireInteger(template.globalEventCount, `${path}.globalEventCount`),
    blackboard: parseBlackboardDataPairs(template.blackboard, `${path}.blackboard`),
  };
}

function parseGlobalModifiers(
  value: unknown,
  path: string,
  inheritedBlackboard: Readonly<Record<string, number>>,
): GlobalBuffTemplateSource['globalModifiers'] {
  if (value === undefined) return [];
  return requireArray(value, path).map((raw, index) => {
    const itemPath = `${path}[${index}]`;
    const item = requireRecord(raw, itemPath);
    requireExactFields(
      item,
      new Set(['attribute', 'operation', 'value', 'applyToReturnSpGain']),
      itemPath,
    );
    const attribute = requireNonEmptyString(item.attribute, `${itemPath}.attribute`);
    if (
      !['spRecovery', 'gainEfficiency', 'normalAttackEfficiency', 'powerAttackEfficiency'].includes(
        attribute,
      )
    ) {
      throw new Error(`${itemPath}.attribute: unsupported value ${attribute}`);
    }
    const operation = requireNonEmptyString(item.operation, `${itemPath}.operation`);
    if (operation !== 'addition' && operation !== 'multiplier') {
      throw new Error(`${itemPath}.operation: unsupported value ${operation}`);
    }
    return {
      attribute: attribute as GlobalBuffTemplateSource['globalModifiers'][number]['attribute'],
      operation,
      value: parseScalarSource(item.value, `${itemPath}.value`, inheritedBlackboard),
      applyToReturnSpGain: requireBoolean(
        item.applyToReturnSpGain,
        `${itemPath}.applyToReturnSpGain`,
      ),
    };
  });
}

export interface GlobalBuffTemplateCatalogSource {
  readonly version: string;
  readonly byId: ReadonlyMap<string, GlobalBuffTemplateSource>;
}

export function parseGlobalBuffTemplateCatalogSource(
  value: unknown,
  path = 'GlobalBuffTemplateCatalog',
): GlobalBuffTemplateCatalogSource {
  const catalog = requireRecord(value, path);
  requireExactFields(catalog, new Set(['version', 'evidence', 'templates']), path);
  requireRecord(catalog.evidence, `${path}.evidence`);
  const templates = requireRecord(catalog.templates, `${path}.templates`);
  const byId = new Map<string, GlobalBuffTemplateSource>();
  for (const id of Object.keys(templates).sort()) {
    const template = parseGlobalBuffTemplateSource(templates[id], `${path}.templates.${id}`);
    if (template.id !== id) throw new Error(`${path}.templates.${id}.id: identity mismatch`);
    byId.set(id, template);
  }
  return {
    version: requireNonEmptyString(catalog.version, `${path}.version`),
    byId,
  };
}
