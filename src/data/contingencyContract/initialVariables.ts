import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';

export interface ContractInitialVariable {
  key: string;
  defaultValue: number;
  min?: number;
  max?: number;
  integer?: boolean;
}

// 只读取初始化图显式传入的常量，不遍历子 Buff 的黑板，避免暴露计数器等运行状态。
function assignments(graph: ActionGraphResourceDefinition) {
  return Object.values(graph.main.nodes).flatMap(({ action }) => {
    if (action.kind === 'createGlobalBuff') return [action.parameters.blackboardAssignments ?? {}];
    if (action.kind === 'applyBuff')
      return action.parameters.buffs.map(buff => buff.blackboardAssignments ?? {});
    return [];
  });
}

function constantValue(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (
    value &&
    typeof value === 'object' &&
    'kind' in value &&
    value.kind === 'constant' &&
    'value' in value &&
    typeof value.value === 'number'
  )
    return value.value;
  return undefined;
}

export function readContractInitialVariables(
  graph: ActionGraphResourceDefinition,
  metadata: Readonly<Record<string, ContractVariableConstraints>> = {},
): readonly ContractInitialVariable[] {
  const defaults = new Map<string, number>();
  const conflicting = new Set<string>();
  for (const values of assignments(graph))
    for (const [key, value] of Object.entries(values)) {
      const numeric = constantValue(value);
      if (numeric === undefined) continue;
      if (defaults.has(key) && defaults.get(key) !== numeric) conflicting.add(key);
      defaults.set(key, numeric);
    }
  return [...defaults]
    .filter(([key]) => !conflicting.has(key))
    .map(([key, defaultValue]) => ({
      key,
      defaultValue,
      ...metadata[key],
    }));
}

export type ContractVariableConstraints = Pick<ContractInitialVariable, 'min' | 'max' | 'integer'>;

export function resolveInitialVariableOverrides(
  fields: readonly ContractInitialVariable[],
  overrides: Readonly<Record<string, unknown>>,
): Record<string, number> {
  for (const key of Object.keys(overrides))
    if (!fields.some(field => field.key === key))
      throw new Error(`Unknown contract initial variable '${key}'`);
  return Object.fromEntries(
    fields.map(field => {
      const value = overrides[field.key] ?? field.defaultValue;
      if (typeof value !== 'number' || !Number.isFinite(value))
        throw new Error(`Invalid contract initial variable '${field.key}'`);
      if (
        (field.integer && !Number.isInteger(value)) ||
        (field.min !== undefined && value < field.min) ||
        (field.max !== undefined && value > field.max)
      )
        throw new Error(`Out-of-range contract initial variable '${field.key}'`);
      return [field.key, value];
    }),
  );
}

/** 仅覆盖初始化参数；不改共享定义、子图或运行中间值。 */
export function withContractInitialVariables(
  graph: ActionGraphResourceDefinition,
  values: Readonly<Record<string, number>>,
): ActionGraphResourceDefinition {
  const replace = <T>(
    original: Readonly<Record<string, T>>,
    convert: (value: number) => T,
  ): Record<string, T> =>
    Object.fromEntries(
      Object.entries(original).map(([key, value]) => [
        key,
        Object.hasOwn(values, key) && constantValue(value) !== undefined
          ? convert(values[key]!)
          : value,
      ]),
    );
  const number = (value: number) => ({ kind: 'constant' as const, value });
  return {
    ...graph,
    main: {
      ...graph.main,
      nodes: Object.fromEntries(
        Object.entries(graph.main.nodes).map(([id, node]) => {
          const action = node.action;
          if (action.kind === 'createGlobalBuff')
            return [
              id,
              {
                ...node,
                action: {
                  ...action,
                  parameters: {
                    ...action.parameters,
                    blackboardAssignments: replace(
                      action.parameters.blackboardAssignments ?? {},
                      number,
                    ),
                  },
                },
              },
            ];
          if (action.kind === 'applyBuff')
            return [
              id,
              {
                ...node,
                action: {
                  ...action,
                  parameters: {
                    ...action.parameters,
                    buffs: action.parameters.buffs.map(buff => ({
                      ...buff,
                      blackboardAssignments: replace(buff.blackboardAssignments ?? {}, number),
                    })),
                  },
                },
              },
            ];
          return [id, node];
        }),
      ),
    },
  };
}
