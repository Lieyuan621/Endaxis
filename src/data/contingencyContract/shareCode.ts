import type {
  ContingencyContractShareLayout,
  ContingencyContractTagDefinition,
} from '../../../packages/game-data-contract/src/mechanics';

const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export type ContractShareError = 'invalid' | 'unavailable' | 'conflict' | 'prerequisite';
export type ContractShareResult =
  { ok: true; tagIds: number[]; score: number } | { ok: false; error: ContractShareError };

/** 与原生列倒序八进制转 Base32 等价；不能使用只保留 32 位的 Number 位运算。 */
export function encodeContractShareCode(
  layout: ContingencyContractShareLayout,
  tagIds: readonly number[],
): string {
  const pending = new Set(tagIds);
  let bits = 0n;
  for (const [column, rows] of Object.entries(layout.columns)) {
    for (const [row, id] of Object.entries(rows)) {
      if (!pending.delete(id)) continue;
      bits |= 1n << BigInt((Number(column) - 1) * 3 + Number(row) - 1);
    }
  }
  if (pending.size) throw new Error('Selected contract tag has no native share position');
  let code = '';
  do {
    code = alphabet[Number(bits & 31n)] + code;
    bits >>= 5n;
  } while (bits);
  return code.padStart(Math.ceil((layout.maxColumn * 3) / 5), '0');
}

/** 仅检查组合本身；不查询玩家历史分数或活动阶段解锁。 */
export function decodeContractShareCode(
  layout: ContingencyContractShareLayout,
  tags: readonly ContingencyContractTagDefinition[],
  text: string,
): ContractShareResult {
  const invalid: ContractShareResult = { ok: false, error: 'invalid' };
  const input = text.replace(/[\r\n]/g, '').trim();
  const wrapped = input.match(/^[^<>]*<([^<>]+)>[^<>]*$/);
  const code = (wrapped ? wrapped[1]! : input).toUpperCase();
  if (code.length !== Math.ceil((layout.maxColumn * 3) / 5)) return invalid;
  let bits = 0n;
  for (const char of code) {
    const digit = alphabet.indexOf(char);
    if (digit < 0) return invalid;
    bits = (bits << 5n) | BigInt(digit);
  }
  if (bits >> BigInt(layout.maxColumn * 3)) return invalid;
  const tagIds: number[] = [];
  for (let column = 1; column <= layout.maxColumn; column++) {
    const rows = layout.columns[String(column)];
    // 原生跳过没有配置的整列；已有列内不存在的行则是无效码。
    if (!rows) continue;
    for (let row = 1; row <= 3; row++) {
      if (!(bits & (1n << BigInt((column - 1) * 3 + row - 1)))) continue;
      const id = rows[String(row)];
      if (id === undefined) return invalid;
      tagIds.push(id);
    }
  }
  const byId = new Map(tags.map(tag => [tag.tagId, tag]));
  const selected: ContingencyContractTagDefinition[] = [];
  for (const id of tagIds) {
    const tag = byId.get(id);
    if (!tag) return { ok: false, error: 'unavailable' };
    selected.push(tag);
  }
  const conflicts = new Set<string>();
  for (const tag of selected) {
    if (tag.conflictId) {
      if (conflicts.has(tag.conflictId)) return { ok: false, error: 'conflict' };
      conflicts.add(tag.conflictId);
    }
    if (
      tag.lockIds.some(
        key => !selected.some(other => other.tagId !== tag.tagId && other.keyId === key),
      )
    )
      return { ok: false, error: 'prerequisite' };
  }
  return { ok: true, tagIds, score: selected.reduce((sum, tag) => sum + tag.score, 0) };
}

/** 分享码只替换当前期数，其他期数的选择不受影响。 */
export function replaceContractSeasonSelection(
  selected: readonly number[],
  seasonTagIds: ReadonlySet<number>,
  imported: readonly number[],
): number[] {
  return [...selected.filter(id => !seasonTagIds.has(id)), ...imported];
}
