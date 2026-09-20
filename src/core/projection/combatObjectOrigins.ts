import type { CombatObjectRef, CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { combatObjectKey } from '../combat/receipt/combatObjectIdentity';
import { runtimeTargetFromEntityId } from '../game-data/logicalAbilityEntity';
import type { AppliedDamageModifier } from '../combat/damage/damageScale';

/** 图、明细与贡献共用的直接修正事实；索引对应原回执，不按定义名去重。 */
export interface CombatDirectModifier {
  readonly node: CombatObjectNode;
  readonly modifier: AppliedDamageModifier;
  readonly buff?: CombatObjectNode;
  readonly provider: CombatObjectNode;
}

export type CombatObjectRelation =
  | 'producedBy'
  | 'stackedBy'
  | 'previousState'
  | 'convertedBy'
  | 'runtimeSource'
  | 'ownedBy'
  | 'originCast'
  | 'modifiedBy'
  | 'providedBy'
  | 'buffEvent'
  | 'castEvent'
  | 'appliedBuff'
  | 'changedStacks'
  | 'attemptedStacking'
  | 'consumedBuff'
  | 'absorbedBuff'
  | 'endedBuff'
  | 'eventSource';

const buffEventRelations: Readonly<Record<string, CombatObjectRelation>> = {
  BuffApplied: 'appliedBuff',
  BuffStackChanged: 'changedStacks',
  BuffEnhanceAttempted: 'attemptedStacking',
  BuffConsumed: 'consumedBuff',
  BuffAbsorbed: 'absorbedBuff',
  BuffFinished: 'endedBuff',
  BuffReleased: 'endedBuff',
};

/** 仅解释已明确记录目标实例的事实；不按 Buff 定义 ID 或同帧相邻关系猜测。 */
export function eventBuff(entry: CombatReceiptEntry): CombatObjectRef | undefined {
  const id = entry.data?.instanceId;
  return buffEventRelations[entry.event] !== undefined &&
    entry.targetId !== undefined &&
    typeof id === 'number' &&
    Number.isSafeInteger(id) &&
    id > 0
    ? { kind: 'buff', ownerId: entry.targetId, instanceId: id }
    : undefined;
}

/** 查询会话签发的只读句柄，不能跨发布结果复用。 */
export interface CombatObjectNode {
  readonly ref: CombatObjectRef;
  readonly fact?: CombatReceiptEntry;
}

export interface CombatObjectLink {
  readonly relation: CombatObjectRelation;
  readonly target: CombatObjectNode;
  readonly sequence?: number;
}

export type CombatObjectTrace =
  | {
      readonly status: 'found';
      readonly node: CombatObjectNode;
      readonly path: readonly CombatObjectNode[];
    }
  | { readonly status: 'notFound' | 'missing' | 'cycle' | 'limit' };

/** 固定结果的可丢弃索引；不读取活动实例或当前编辑草稿，不重新执行战斗。 */
export class CombatObjectOrigins {
  readonly #facts = new Map<string, CombatReceiptEntry>();
  readonly #receipts = new Map<number, CombatReceiptEntry>();
  readonly #nodes = new Map<string, CombatObjectNode>();
  readonly #owned = new WeakSet<CombatObjectNode>();
  readonly #casts = new Map<string, { ref: CombatObjectRef; sequence: number }>();
  readonly #firstSeen = new Map<string, number>();
  readonly #buffEvents = new Map<string, number[]>();
  readonly #castEvents = new Map<string, number[]>();
  readonly #conversions = new Map<string, number[]>();

  constructor(entries: Iterable<CombatReceiptEntry>) {
    for (const entry of entries) {
      if (this.#receipts.has(entry.sequence)) throw new Error('duplicate receipt sequence');
      this.#receipts.set(entry.sequence, entry);
      if (
        entry.event === 'SkillStarted' &&
        typeof entry.data?.castId === 'string' &&
        entry.sourceId !== undefined &&
        (this.#casts.get(entry.data.castId)?.sequence ?? Infinity) > entry.sequence
      ) {
        this.#casts.set(entry.data.castId, {
          ref: { kind: 'action', ownerId: entry.sourceId, actionId: entry.data.castId },
          sequence: entry.sequence,
        });
      }
      const mention = (ref: CombatObjectRef | undefined) => {
        if (ref === undefined) return;
        const key = combatObjectKey(ref);
        this.#firstSeen.set(key, Math.min(this.#firstSeen.get(key) ?? Infinity, entry.sequence));
      };
      if (entry.subject !== undefined) {
        const key = combatObjectKey(entry.subject);
        if (this.#facts.has(key)) throw new Error(`duplicate object birth ${key}`);
        this.#facts.set(key, entry);
      }
      mention(entry.subject);
      mention(entry.producedBy);
      mention(entry.runtimeSource);
      mention(eventBuff(entry));
      if (entry.event === 'DamageApplied' || entry.event === 'SkillStarted') {
        mention({ kind: 'receipt', sequence: entry.sequence });
      }
    }
    // 收齐出生记录后才发出句柄；Buff 的 Start 可在同帧同步产生其他对象。
    for (const entry of this.#receipts.values()) {
      if (
        entry.event === 'ElementalAttachmentConverted' &&
        entry.targetId !== undefined &&
        typeof entry.data?.outputInstanceId === 'number'
      ) {
        const key = combatObjectKey({
          kind: 'buff',
          ownerId: entry.targetId,
          instanceId: entry.data.outputInstanceId,
        });
        const values = this.#conversions.get(key) ?? [];
        values.push(entry.sequence);
        this.#conversions.set(key, values);
      }
      const buff = eventBuff(entry);
      if (buff !== undefined) {
        this.get(buff);
        this.get({ kind: 'receipt', sequence: entry.sequence });
        const key = combatObjectKey(buff);
        const events = this.#buffEvents.get(key) ?? [];
        events.push(entry.sequence);
        this.#buffEvents.set(key, events);
        const cast =
          typeof entry.data?.castId === 'string' ? this.#casts.get(entry.data.castId) : undefined;
        if (cast !== undefined) {
          const castKey = combatObjectKey(cast.ref);
          const castEvents = this.#castEvents.get(castKey) ?? [];
          castEvents.push(entry.sequence);
          this.#castEvents.set(castKey, castEvents);
        }
      }
      if (entry.subject !== undefined) this.get(entry.subject);
      if (entry.producedBy !== undefined) this.get(entry.producedBy);
      if (entry.runtimeSource !== undefined) this.get(entry.runtimeSource);
      if (entry.event === 'DamageApplied' || entry.event === 'SkillStarted') {
        this.get({ kind: 'receipt', sequence: entry.sequence });
      }
      entry.appliedDamageModifiers?.forEach((_, index) =>
        this.get({ kind: 'modifier', sequence: entry.sequence, index }),
      );
    }
  }

  /** 枚举本结果已记录或被明确引用的对象，不扫描定义目录。 */
  *objects(): IterableIterator<CombatObjectNode> {
    yield* [...this.#nodes.values()];
  }

  get(ref: CombatObjectRef): CombatObjectNode {
    const key = combatObjectKey(ref);
    const known = this.#nodes.get(key);
    if (known !== undefined) return known;
    const fact =
      ref.kind === 'receipt' || ref.kind === 'modifier'
        ? this.#receipts.get(ref.sequence)
        : this.#facts.get(key);
    const node = Object.freeze({
      ref: Object.freeze({ ...ref }),
      ...(fact === undefined ? {} : { fact }),
    });
    this.#nodes.set(key, node);
    this.#owned.add(node);
    return node;
  }

  #requireOwned(node: CombatObjectNode): void {
    if (!this.#owned.has(node)) throw new Error('object belongs to another origin query');
  }

  #entity(id: string | undefined): CombatObjectRef | undefined {
    if (id === undefined || id === 'battle') return undefined;
    return runtimeTargetFromEntityId(id);
  }

  /** 用已有回执寻址实例在某一时点的层数状态，不创建运行时历史镜像。 */
  buffState(buff: CombatObjectNode, throughSequence: number): CombatObjectNode {
    this.#requireOwned(buff);
    if (buff.ref.kind !== 'buff') return buff;
    const events = (this.#buffEvents.get(combatObjectKey(buff.ref)) ?? [])
      .map(sequence => this.#receipts.get(sequence)!)
      .filter(entry => entry.sequence <= throughSequence)
      .sort((a, b) => a.sequence - b.sequence);
    const initial = events.find(entry => entry.event === 'BuffApplied');
    const changes = events.filter(
      entry =>
        entry.event === 'BuffStackChanged' &&
        typeof entry.data?.delta === 'number' &&
        entry.data.delta !== 0 &&
        entry.sequence > (initial?.sequence ?? -1),
    );
    const state = changes.at(-1) ?? initial;
    return state ? this.get({ kind: 'receipt', sequence: state.sequence }) : buff;
  }

  /** 只接受本查询签发的命中对象，确保同序号的兄弟分支不会混用。 */
  directModifiers(hit: CombatObjectNode): readonly CombatDirectModifier[] {
    this.#requireOwned(hit);
    if (hit.ref.kind !== 'receipt' || hit.fact?.event !== 'DamageApplied') return [];
    return (hit.fact.appliedDamageModifiers ?? []).map((modifier, index) => ({
      node: this.get({ kind: 'modifier', sequence: hit.fact!.sequence, index }),
      modifier,
      ...(modifier.buff === undefined
        ? {}
        : {
            buff: this.get({ kind: 'buff', ...modifier.buff }),
          }),
      provider: this.get(
        modifier.sourceActionId === undefined
          ? runtimeTargetFromEntityId(modifier.sourceId)
          : { kind: 'action', ownerId: modifier.sourceId, actionId: modifier.sourceActionId },
      ),
    }));
  }

  /** 只沿归属解析直接提供者；不沿产生者、增益或消费关系递归分配。 */
  providerOperator(provider: CombatObjectNode, throughSequence: number): string | undefined {
    this.#requireOwned(provider);
    if (provider.ref.kind === 'operator') return provider.ref.operatorId;
    const result = this.findAncestor(provider, node => node.ref.kind === 'operator', {
      relations: ['ownedBy'],
      throughSequence,
    });
    return result.status === 'found' && result.node.ref.kind === 'operator'
      ? result.node.ref.operatorId
      : undefined;
  }

  /** 边的类别由回执协议解释，不能从任意对象字段递归猜测。 */
  relations(node: CombatObjectNode, throughSequence = Infinity): readonly CombatObjectLink[] {
    this.#requireOwned(node);
    const links: CombatObjectLink[] = [];
    const fact = node.fact;
    if (fact !== undefined && fact.sequence > throughSequence) return links;
    const add = (
      relation: CombatObjectRelation,
      ref: CombatObjectRef | undefined,
      sequence = fact?.sequence,
    ) => {
      if (ref !== undefined) links.push({ relation, target: this.get(ref), sequence });
    };
    if (node.ref.kind === 'modifier') {
      const direct = this.directModifiers(
        this.get({ kind: 'receipt', sequence: node.ref.sequence }),
      )[node.ref.index];
      if (direct !== undefined) {
        add('providedBy', direct.provider.ref);
        add('producedBy', direct.buff?.ref);
      }
      return links;
    }
    if (fact !== undefined) {
      if (
        fact.event === 'ElementalAttachmentConverted' &&
        fact.targetId !== undefined &&
        typeof fact.data?.consumedInstanceId === 'number'
      ) {
        add('consumedBuff', {
          kind: 'buff',
          ownerId: fact.targetId,
          instanceId: fact.data.consumedInstanceId,
        });
        add('eventSource', this.#entity(fact.sourceId));
      }
      if (node.ref.kind === 'receipt') {
        const buff = eventBuff(fact);
        if (buff !== undefined) {
          if (fact.event === 'BuffStackChanged') {
            const previous = this.buffState(this.get(buff), fact.sequence - 1);
            add('previousState', previous.ref);
          }
          add(buffEventRelations[fact.event]!, buff);
          add('eventSource', fact.producedBy ?? this.#entity(fact.sourceId));
        }
      }
      add('producedBy', fact.producedBy);
      add('runtimeSource', fact.runtimeSource);
      if (typeof fact.data?.castId === 'string') {
        const cast = this.#casts.get(fact.data.castId);
        if (cast !== undefined && cast.sequence <= throughSequence) add('originCast', cast.ref);
      }
      if (node.ref.kind === 'receipt')
        fact.appliedDamageModifiers?.forEach((_, index) =>
          add('modifiedBy', { kind: 'modifier', sequence: fact.sequence, index }),
        );
      if (node.ref.kind === 'abilityEntity' && fact.event === 'AbilityEntitySpawned') {
        add('ownedBy', this.#entity(fact.sourceId));
      }
    }
    if (node.ref.kind === 'buff' || node.ref.kind === 'action')
      add('ownedBy', this.#entity(node.ref.ownerId));
    const events =
      node.ref.kind === 'buff'
        ? this.#buffEvents.get(combatObjectKey(node.ref))
        : node.ref.kind === 'action'
          ? this.#castEvents.get(combatObjectKey(node.ref))
          : undefined;
    if (node.ref.kind === 'buff') {
      const state = this.buffState(node, throughSequence);
      if (state !== node) add('stackedBy', state.ref, state.fact?.sequence);
    }
    for (const sequence of events ?? []) {
      if (sequence <= throughSequence)
        add(
          node.ref.kind === 'buff' ? 'buffEvent' : 'castEvent',
          { kind: 'receipt', sequence },
          sequence,
        );
    }
    if (node.ref.kind === 'buff')
      for (const sequence of this.#conversions.get(combatObjectKey(node.ref)) ?? [])
        if (sequence <= throughSequence)
          add('convertedBy', { kind: 'receipt', sequence }, sequence);
    return links;
  }

  /** 默认只走产生关系；命中按自身回执截断，未来事实不能改变过去的解释。 */
  findAncestor(
    start: CombatObjectNode,
    matches: (node: CombatObjectNode) => boolean,
    options: {
      readonly relations?: readonly CombatObjectRelation[];
      readonly throughSequence?: number;
      readonly maxNodes?: number;
    } = {},
  ): CombatObjectTrace {
    this.#requireOwned(start);
    const accepted = new Set(options.relations ?? ['producedBy']);
    const cutoff = options.throughSequence ?? start.fact?.sequence ?? Infinity;
    if (cutoff !== Infinity && (!Number.isSafeInteger(cutoff) || cutoff < -1)) {
      throw new RangeError('invalid origin history boundary');
    }
    const maximum = options.maxNodes ?? 256;
    if (!Number.isSafeInteger(maximum) || maximum < 1)
      throw new RangeError('invalid origin traversal limit');
    const queue: { node: CombatObjectNode; path: readonly CombatObjectNode[] }[] = [
      { node: start, path: [start] },
    ];
    const visited = new Set<CombatObjectNode>();
    let incomplete: 'missing' | 'cycle' | undefined;
    for (let offset = 0; offset < queue.length; offset++) {
      const { node, path } = queue[offset]!;
      if (visited.has(node)) continue;
      if (visited.size >= maximum) return { status: 'limit' };
      visited.add(node);
      if (
        (node.fact?.sequence ?? this.#firstSeen.get(combatObjectKey(node.ref)) ?? Infinity) >
          cutoff &&
        !['action', 'operator', 'enemy', 'spatialPoint'].includes(node.ref.kind)
      ) {
        incomplete = 'missing';
        continue;
      }
      if (node !== start && matches(node)) return { status: 'found', node, path };
      const links = this.relations(node, cutoff).filter(link => accepted.has(link.relation));
      if (
        links.length === 0 &&
        accepted.has('producedBy') &&
        !['action', 'operator', 'enemy', 'spatialPoint', 'modifier'].includes(node.ref.kind)
      )
        incomplete = 'missing';
      for (const link of links) {
        if (path.includes(link.target)) {
          incomplete = 'cycle';
          continue;
        }
        queue.push({ node: link.target, path: [...path, link.target] });
      }
    }
    return { status: incomplete ?? 'notFound' };
  }
}
