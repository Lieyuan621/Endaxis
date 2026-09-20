import type { SkillStructureNode } from '../skillStructureMindMapModel';
import {
  cloneStructureValue,
  insertStructureArrayItem,
  moveStructureArrayItem,
  removeStructureArrayItem,
  replaceStructureValueAtPath,
  resolveStructureValue,
} from '../skillStructureEditorCommands';

const BUFF_GRAPH_PAYLOAD_KINDS = [
  'buffShield',
  'buffDamageModifier',
  'buffDamageProcessor',
  'buffDamageCondition',
  'buffAttributeModifier',
  'buffSlotReplacement',
  'buffKeywordEnhancement',
  'buffHealModifier',
  'buffHealProcessor',
  'buffHealCondition',
  'buffPoiseModifier',
  'buffPoiseProcessor',
  'buffPoiseCondition',
] as const;
export type BuffGraphPayloadKind = (typeof BUFF_GRAPH_PAYLOAD_KINDS)[number];
export type BuffGraphClipboard = { kind: BuffGraphPayloadKind; value: unknown };
type Node = Pick<SkillStructureNode, 'sourcePath' | 'payloadKind' | 'acceptsChildKind' | 'canMove'>;

export function isBuffGraphPayload(kind: unknown): kind is BuffGraphPayloadKind {
  return BUFF_GRAPH_PAYLOAD_KINDS.some(value => value === kind);
}
function isCondition(kind: BuffGraphPayloadKind) {
  return (
    kind === 'buffDamageCondition' || kind === 'buffHealCondition' || kind === 'buffPoiseCondition'
  );
}
export function isBuffGraphClipboard<T extends { kind: unknown }>(
  value: T | undefined,
): value is T & BuffGraphClipboard {
  return value !== undefined && isBuffGraphPayload(value.kind);
}

function childArray(node: Node, kind: BuffGraphPayloadKind): string | undefined {
  if (node.acceptsChildKind !== kind) return;
  if (!isCondition(kind)) return node.sourcePath;
  // Empty optional condition ports are values, not arrays.
  if (node.payloadKind === kind) return `${node.sourcePath}.conditions`;
}
export function pasteBuffGraphNode<T>(document: T, target: Node, clipboard: BuffGraphClipboard) {
  if (target.acceptsChildKind !== clipboard.kind) return;
  const path = childArray(target, clipboard.kind);
  const value = cloneStructureValue(clipboard.value);
  if (path !== undefined) return insertStructureArrayItem(document, path, value);
  if (
    isCondition(clipboard.kind) &&
    resolveStructureValue(document, target.sourcePath) === undefined
  )
    return {
      root: replaceStructureValueAtPath(document, target.sourcePath, value),
      itemPath: target.sourcePath,
    };
}
export function moveBuffGraphNode<T>(
  document: T,
  source: Node,
  target: Node,
  placement: 'inside' | 'before' | 'after',
) {
  if (
    !isBuffGraphPayload(source.payloadKind) ||
    source.canMove === false ||
    !/\[\d+\]$/.test(source.sourcePath)
  )
    return;
  if (
    placement === 'inside' &&
    isCondition(source.payloadKind) &&
    target.acceptsChildKind === source.payloadKind &&
    /(?:damage|heal|poise)Modifiers\[\d+\]\.condition$/.test(target.sourcePath) &&
    resolveStructureValue(document, target.sourcePath) === undefined
  ) {
    const value = resolveStructureValue(document, source.sourcePath);
    return {
      root: replaceStructureValueAtPath(
        removeStructureArrayItem(document, source.sourcePath),
        target.sourcePath,
        value,
      ),
      itemPath: target.sourcePath,
    };
  }
  let path: string | undefined;
  let index: number | undefined;
  if (placement === 'inside') path = childArray(target, source.payloadKind);
  else if (source.payloadKind === target.payloadKind) {
    const match = /^(.*)\[(\d+)\]$/.exec(target.sourcePath);
    if (match) {
      path = match[1];
      index = Number(match[2]) + (placement === 'after' ? 1 : 0);
    }
  }
  if (
    path === undefined ||
    path === source.sourcePath ||
    path.startsWith(`${source.sourcePath}.`) ||
    path.startsWith(`${source.sourcePath}[`)
  )
    return;
  return moveStructureArrayItem(document, source.sourcePath, path, index);
}
