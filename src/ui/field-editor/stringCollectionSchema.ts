import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema.ts';
import type { NodeFieldSchema } from '../action-graph/nodeSchema.ts';

export type StringCollectionKind = 'reference' | 'gameplayTag' | 'nativeId';

/** Only formal homogeneous string containers qualify; tuples/unions are not guessed. */
export function stringCollectionDescriptor(
  schema: DefinitionFieldSchema | NodeFieldSchema,
  name?: string,
  inheritedReferenceKind?: string,
): { readonly kind: StringCollectionKind; readonly referenceKind?: string } | undefined {
  const node = 'control' in schema;
  const shape = node ? schema.valueSchema : schema;
  if (shape.kind !== 'array' || shape.element.kind !== 'string') return undefined;
  const element = shape.element;
  // 开放运行时 ID 由正式声明标记，宿主路径和同质字符串结构仍须匹配。
  if (
    !inheritedReferenceKind &&
    (name ?? (node ? schema.path.at(-1) : undefined)) === 'globalBuffIds' &&
    (!node || schema.path.join('.') === 'parameters.globalBuffIds') &&
    shape.nativeId
  )
    return { kind: 'nativeId' };
  if (element.semantics?.aliases?.includes('GameplayTag')) return { kind: 'gameplayTag' };
  const referenceKind = inheritedReferenceKind ?? shape.referenceKind;
  if (referenceKind && referenceKind !== 'globalBuff') return { kind: 'reference', referenceKind };
  return undefined;
}
