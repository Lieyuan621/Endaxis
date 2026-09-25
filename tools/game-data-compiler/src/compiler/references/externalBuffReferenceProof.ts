import { parseBuffRuntimeSource, type BuffRuntimeSource } from '../../source/buffRuntime.ts';
import {
  collectBuffActionReferences,
  parseKnownNativeBuffActionGraphSource,
} from '../../source/buffActionGraph.ts';
import type { DefinitionReferenceSource } from '../../source/referenceGraph.ts';
import {
  resolveKeywordChildCandidates,
  UnprovenBuffReferenceError,
} from '../buffs/buffReferenceClosure.ts';

/**
 * 保存外部资源检查已经读到的 Buff 和创建来路，复用 Buff 闭包的动态 ID 证明。
 * 技能、投射物等外部入口的黑板覆盖尚未在这里证明，因此这些入口一律作为未知根处理。
 * 每次 resolve 都基于当前全部来路计算，不缓存可能被后续资源推翻的候选。
 */
export class ExternalBuffReferenceProof {
  private readonly roots = new Set<string>();
  private readonly sources = new Map<string, BuffRuntimeSource>();
  private readonly references = new Map<string, readonly DefinitionReferenceSource[]>();
  private readonly owners = new Map<DefinitionReferenceSource, string>();

  addExternalReferences(references: readonly DefinitionReferenceSource[]): void {
    for (const reference of references) {
      if (reference.kind === 'buff' && reference.state === 'active' && reference.id !== null)
        this.roots.add(reference.id);
    }
  }

  addBuff(id: string, value: unknown, path: string): readonly DefinitionReferenceSource[] {
    const source = parseBuffRuntimeSource(value, path);
    if (source.graph.buffId !== id) throw new Error(`${path}: Buff identity mismatch`);
    const references = collectBuffActionReferences(
      parseKnownNativeBuffActionGraphSource(value, path, {}),
    );
    this.sources.set(id, source);
    this.references.set(id, references);
    for (const reference of references) this.owners.set(reference, id);
    return references;
  }

  resolve(reference: DefinitionReferenceSource): readonly DefinitionReferenceSource[] | undefined {
    const owner = this.owners.get(reference);
    if (owner === undefined || reference.kind !== 'buff') return undefined;
    try {
      const candidates = resolveKeywordChildCandidates(
        owner,
        reference,
        [...this.roots],
        this.sources,
        this.references,
        new Set(),
        new Map(),
      );
      return candidates.map(id => ({ ...reference, id, state: 'active', blackboardKey: null }));
    } catch (error) {
      if (error instanceof UnprovenBuffReferenceError) return undefined;
      throw error;
    }
  }
}
