type Root =
  | { kind: 'action'; ownerId: string; actionId: string }
  | { kind: 'operator'; operatorId: string }
  | { kind: 'enemy'; enemyId: string }
  | { kind: 'godEntity' };

export function rootIdentity(root: Root): string {
  switch (root.kind) {
    case 'action':
      return JSON.stringify([['action', root.ownerId, root.actionId]]);
    case 'operator':
      return JSON.stringify([['operator', root.operatorId]]);
    case 'enemy':
      return JSON.stringify([['enemy', root.enemyId]]);
    case 'godEntity':
      return JSON.stringify([['battle']]);
  }
}

function readChain(key: string): unknown[] | undefined {
  try {
    const chain: unknown = JSON.parse(key);
    return Array.isArray(chain) ? chain : undefined;
  } catch {
    return undefined;
  }
}

/** 技能块复制只关注直接创建链的根；中途继承的施法身份不属于这个根。 */
export function rootAction(key: string): { ownerId: string; actionId: string } | undefined {
  const root = readChain(key)?.[0];
  return Array.isArray(root) &&
    root.length === 3 &&
    root[0] === 'action' &&
    typeof root[1] === 'string' &&
    typeof root[2] === 'string'
    ? { ownerId: root[1], actionId: root[2] }
    : undefined;
}

/** 每个运行分支独立计数。对相同父对象、类型和宿主使用从零开始的出现次数。 */
export class DerivedObjectOccurrences {
  readonly #counts = new Map<string, number>();

  child(
    parent: string,
    kind: 'abilityEntity' | 'buff' | 'globalBuff',
    definition: string,
    owner: string,
  ): string {
    return this.#next(parent, [kind, definition, owner]);
  }

  hit(parent: string, attacker: string, target: string): string {
    return this.#next(parent, ['hit', attacker, target]);
  }

  #next(parent: string, step: readonly string[]): string {
    const chain = JSON.parse(parent) as unknown[];
    const group = JSON.stringify([...chain, step]);
    const index = this.#counts.get(group) ?? 0;
    this.#counts.set(group, index + 1);
    return JSON.stringify([...chain, [...step, index]]);
  }

  /** 嵌套命中可能晚分配、先写入账本，恢复时按同组最大序号续计。 */
  restoreHit(key: string): void {
    const chain = readChain(key);
    const step = chain?.at(-1);
    if (!Array.isArray(step) || step[0] !== 'hit') throw new Error('invalid hit identity');
    const index = step.pop();
    if (!Number.isSafeInteger(index) || index < 0) throw new Error('invalid hit occurrence');
    const group = JSON.stringify(chain);
    this.#counts.set(group, Math.max(this.#counts.get(group) ?? 0, index + 1));
  }
}

export interface IdentityMapping {
  entity(id: string): string | undefined;
  action(id: string, sourceOwner: string): string | undefined;
}

/** 只替换身份字段。能力实体作为宿主时，其引用本身也是创建链。 */
export function mapHitIdentity(key: string, mapping: IdentityMapping): string | undefined {
  return mapChain(key, mapping, 'hit', 0);
}

function mapChain(
  key: string,
  mapping: IdentityMapping,
  terminal: 'hit' | 'owner',
  depth: number,
): string | undefined {
  if (depth > 64) return undefined;
  const chain = readChain(key);
  if (!chain?.length) return undefined;
  function owner(value: unknown): string | undefined {
    if (typeof value !== 'string' || !value) return undefined;
    return value.startsWith('[[')
      ? mapChain(value, mapping, 'owner', depth + 1)
      : mapping.entity(value);
  }
  for (const [index, step] of chain.entries()) {
    if (!Array.isArray(step)) return undefined;
    const kind = step[0];
    const isRoot =
      kind === 'action' || kind === 'operator' || kind === 'enemy' || kind === 'battle';
    if (
      isRoot !== (index === 0) ||
      (kind === 'hit') !== (terminal === 'hit' && index === chain.length - 1)
    )
      return undefined;
    if (!isRoot && (step.length !== 4 || !Number.isSafeInteger(step[3]) || step[3] < 0))
      return undefined;
    switch (kind) {
      case 'action':
        if (step.length !== 3 || typeof step[2] !== 'string' || !step[2]) return undefined;
        if (typeof step[1] !== 'string') return undefined;
        step[2] = mapping.action(step[2], step[1]);
        step[1] = owner(step[1]);
        break;
      case 'operator':
      case 'enemy':
        if (step.length !== 2) return undefined;
        step[1] = owner(step[1]);
        break;
      case 'battle':
        if (step.length !== 1) return undefined;
        break;
      case 'abilityEntity':
      case 'buff':
      case 'globalBuff':
        if (typeof step[1] !== 'string' || !step[1]) return undefined;
        step[2] = owner(step[2]);
        break;
      case 'hit':
        step[1] = owner(step[1]);
        step[2] = owner(step[2]);
        break;
      default:
        return undefined;
    }
    if (step.includes(undefined)) return undefined;
  }
  return JSON.stringify(chain);
}

const retainIdentity: IdentityMapping = { entity: id => id, action: id => id };

export function isHitIdentity(key: string): boolean {
  return mapHitIdentity(key, retainIdentity) === key;
}
