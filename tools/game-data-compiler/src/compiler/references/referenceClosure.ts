import type {
  DefinitionReferenceKind,
  DefinitionReferenceSource,
} from '../../source/referenceGraph.ts';

export interface DefinitionReferenceNodeSource {
  readonly kind: DefinitionReferenceKind;
  readonly id: string;
  readonly sourcePath: string;
  readonly references: readonly DefinitionReferenceSource[];
}

export interface MissingDefinitionReferenceSource {
  readonly sourceKind: DefinitionReferenceKind;
  readonly sourceId: string;
  readonly reference: DefinitionReferenceSource;
}

export interface DefinitionReferenceClosureSource {
  readonly definitions: readonly DefinitionReferenceNodeSource[];
  readonly missing: readonly MissingDefinitionReferenceSource[];
}

/** 同类定义 ID 必须唯一；不同类型可以合法复用同一裸字符串。 */
export function indexDefinitionReferenceNodes(
  nodes: readonly DefinitionReferenceNodeSource[],
): ReadonlyMap<string, DefinitionReferenceNodeSource> {
  const index = new Map<string, DefinitionReferenceNodeSource>();
  for (const node of nodes) {
    const key = definitionKey(node.kind, node.id);
    const previous = index.get(key);
    if (previous) {
      throw new Error(
        `duplicate ${key}: ${JSON.stringify(previous.sourcePath)} and ${JSON.stringify(node.sourcePath)}`,
      );
    }
    index.set(key, node);
  }
  return index;
}

/**
 * 从显式根定义扩展静态引用闭包。关闭、动态和空引用保留在来源节点中，但绝不参与遍历。
 */
export function resolveDefinitionReferenceClosure(
  roots: ReadonlyArray<readonly [DefinitionReferenceKind, string]>,
  nodes: readonly DefinitionReferenceNodeSource[],
): DefinitionReferenceClosureSource {
  const index = indexDefinitionReferenceNodes(nodes);
  const queue = roots.map(([kind, id]) => definitionKey(kind, id));
  const visited = new Set<string>();
  const definitions: DefinitionReferenceNodeSource[] = [];
  const missing: MissingDefinitionReferenceSource[] = [];

  while (queue.length > 0) {
    const key = queue.shift()!;
    if (visited.has(key)) continue;
    visited.add(key);
    const node = index.get(key);
    if (!node) {
      const [kind, id] = splitDefinitionKey(key);
      throw new Error(`missing root definition ${kind}:${JSON.stringify(id)}`);
    }
    definitions.push(node);

    for (const reference of node.references) {
      if (reference.state !== 'active' || !reference.id) continue;
      const targetKey = definitionKey(reference.kind, reference.id);
      if (index.has(targetKey)) {
        if (!visited.has(targetKey)) queue.push(targetKey);
      } else {
        missing.push({ sourceKind: node.kind, sourceId: node.id, reference });
      }
    }
  }

  return { definitions, missing };
}

function definitionKey(kind: DefinitionReferenceKind, id: string): string {
  return `${kind}\0${id}`;
}

function splitDefinitionKey(key: string): [DefinitionReferenceKind, string] {
  const separator = key.indexOf('\0');
  return [key.slice(0, separator) as DefinitionReferenceKind, key.slice(separator + 1)];
}
