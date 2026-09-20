import type { CombatReceiptEntry } from './combatReceipt';

interface Segment {
  readonly previous: Segment | null;
  readonly start: number;
  readonly entries: readonly CombatReceiptEntry[];
}
const cursorOwner = Symbol('receipt cursor');
const roots = new WeakMap<CombatReceiptView, { head: Segment | null; length: number }>();
function viewOf(head: Segment | null, length: number): CombatReceiptView {
  const view = new CombatReceiptView();
  roots.set(view, { head, length });
  return view;
}
export interface CombatReceiptCursor {
  readonly [cursorOwner]: object;
  readonly nextSequence: number;
}

/** 固定历史；段和记录均不可变，数组适配只在这个视图内物化一次。 */
export class CombatReceiptView {
  #array: readonly CombatReceiptEntry[] | undefined;
  #segments: readonly Segment[] | undefined;
  constructor() {
    roots.set(this, { head: null, length: 0 });
    Object.freeze(this);
  }
  get length(): number {
    return roots.get(this)!.length;
  }

  *entries(fromSequence = 0, toSequence = this.length): IterableIterator<CombatReceiptEntry> {
    validateRange(fromSequence, toSequence, this.length);
    const segments: Segment[] = [];
    for (
      let segment = roots.get(this)!.head;
      segment !== null && segment.start + segment.entries.length > fromSequence;
      segment = segment.previous
    ) {
      if (segment.start < toSequence) segments.push(segment);
    }
    for (let index = segments.length - 1; index >= 0; index -= 1) {
      const segment = segments[index]!;
      for (
        let position = Math.max(0, fromSequence - segment.start);
        position < Math.min(segment.entries.length, toSequence - segment.start);
        position += 1
      )
        yield segment.entries[position]!;
    }
  }

  get(sequence: number): CombatReceiptEntry | undefined {
    if (!Number.isSafeInteger(sequence) || sequence < 0 || sequence >= this.length)
      return undefined;
    if (this.#segments === undefined) {
      const segments: Segment[] = [];
      for (let segment = roots.get(this)!.head; segment !== null; segment = segment.previous)
        segments.push(segment);
      this.#segments = segments.reverse();
    }
    let low = 0,
      high = this.#segments.length - 1;
    while (low <= high) {
      const middle = (low + high) >>> 1,
        segment = this.#segments[middle]!;
      if (sequence < segment.start) high = middle - 1;
      else if (sequence >= segment.start + segment.entries.length) low = middle + 1;
      else return segment.entries[sequence - segment.start];
    }
    return undefined;
  }

  toArray(): readonly CombatReceiptEntry[] {
    return (this.#array ??= Object.freeze([...this.entries()]));
  }

  /** 从固定视图创建独立写端；不会暴露内部段给调用方。 */
  fork(): CombatReceiptHistory {
    return new CombatReceiptHistory(this);
  }
}

function validateRange(from: number, to: number, length: number): void {
  if (
    !Number.isSafeInteger(from) ||
    !Number.isSafeInteger(to) ||
    from < 0 ||
    to < from ||
    to > length
  )
    throw new RangeError('receipt range must be within this history');
}

/** 已封存前缀共享，当前分支只拥有自己的追加尾部。 */
export class CombatReceiptHistory {
  #tail: CombatReceiptEntry[] = [];
  #view: CombatReceiptView | undefined;
  readonly #identity = {};
  readonly #cursors = new WeakMap<CombatReceiptCursor, number>();
  #head: Segment | null;
  #count: number;
  constructor(saved = new CombatReceiptView()) {
    const root = roots.get(saved);
    if (root === undefined) throw new Error('receipt history requires an owned snapshot');
    this.#head = root.head;
    this.#count = root.length;
    this.#view = saved;
  }

  get length(): number {
    return this.#count;
  }

  append(entry: Omit<CombatReceiptEntry, 'sequence'>): void {
    const record: CombatReceiptEntry = Object.freeze({
      ...entry,
      sequence: this.#count,
      ...(entry.subject === undefined ? {} : { subject: Object.freeze({ ...entry.subject }) }),
      ...(entry.producedBy === undefined
        ? {}
        : { producedBy: Object.freeze({ ...entry.producedBy }) }),
      ...(entry.runtimeSource === undefined
        ? {}
        : { runtimeSource: Object.freeze({ ...entry.runtimeSource }) }),
      ...(entry.data === undefined ? {} : { data: Object.freeze({ ...entry.data }) }),
      ...(entry.appliedDamageModifiers === undefined
        ? {}
        : {
            appliedDamageModifiers: Object.freeze(
              entry.appliedDamageModifiers.map(item =>
                Object.freeze({
                  ...item,
                  ...(item.buff === undefined ? {} : { buff: Object.freeze({ ...item.buff }) }),
                }),
              ),
            ),
          }),
    });
    this.#tail.push(record);
    this.#count += 1;
    this.#view = undefined;
    if (this.#tail.length >= 256) this.#seal();
  }

  #seal(): void {
    if (this.#tail.length === 0) return;
    this.#head = Object.freeze({
      previous: this.#head,
      start: this.#count - this.#tail.length,
      entries: Object.freeze(this.#tail),
    });
    this.#tail = [];
  }

  snapshot(): CombatReceiptView {
    this.#seal();
    return (this.#view ??= viewOf(this.#head, this.#count));
  }

  cursor(fromSequence = 0): CombatReceiptCursor {
    validateRange(fromSequence, this.#count, this.#count);
    const cursor = Object.freeze({ [cursorOwner]: this.#identity, nextSequence: fromSequence });
    this.#cursors.set(cursor, fromSequence);
    return cursor;
  }

  readSince(
    cursor: CombatReceiptCursor,
    events?: ReadonlySet<string>,
  ): {
    readonly entries: readonly CombatReceiptEntry[];
    readonly cursor: CombatReceiptCursor;
  } {
    if (cursor[cursorOwner] !== this.#identity || this.#cursors.get(cursor) !== cursor.nextSequence)
      throw new Error('receipt cursor belongs to another history branch');
    const from = cursor.nextSequence;
    validateRange(from, this.#count, this.#count);
    // 读尾部不封存；批次只持有冻结记录，不暴露可变数组。
    const entries: CombatReceiptEntry[] = [];
    const sealedLength = this.#count - this.#tail.length;
    if (from < sealedLength) {
      for (const entry of viewOf(this.#head, sealedLength).entries(from))
        if (events === undefined || events.has(entry.event)) entries.push(entry);
    }
    for (let index = Math.max(0, from - sealedLength); index < this.#tail.length; index += 1) {
      const entry = this.#tail[index]!;
      if (events === undefined || events.has(entry.event)) entries.push(entry);
    }
    return { entries: Object.freeze(entries), cursor: this.cursorAtEnd() };
  }

  private cursorAtEnd(): CombatReceiptCursor {
    return this.cursor(this.#count);
  }
}

/**
 * 从线程或存盘边界返回的纯数据重建固定历史。
 * sequence 必须从零连续递增；不能静默重排或接受缺口。
 */
export function restoreCombatReceiptView(
  entries: readonly CombatReceiptEntry[],
): CombatReceiptView {
  const history = new CombatReceiptHistory();
  for (let sequence = 0; sequence < entries.length; sequence += 1) {
    const entry = entries[sequence]!;
    if (entry.sequence !== sequence) {
      throw new Error(`receipt history expected sequence ${sequence}, received ${entry.sequence}`);
    }
    const { sequence: _sequence, ...record } = entry;
    history.append(record);
  }
  return history.snapshot();
}
