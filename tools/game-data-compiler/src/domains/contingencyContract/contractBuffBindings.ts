import {
  requireArray,
  requireInteger,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
} from '../../source/primitives.ts';

export interface ContractBuffBinding {
  readonly tagId: number;
  readonly pending?: string;
  readonly omitted?: string;
  readonly spRecoveryBonus?: number;
  readonly buffs: readonly {
    readonly buffId: string;
    readonly owner: 'caster' | 'enemy';
    readonly blackboard: Readonly<Record<string, number | string>>;
  }[];
}

/** 人工绑定只决定根和参数组；具体数值仍取服务器公布的黑板。 */
export function resolveContractBuffBindings(
  configuration: unknown,
  supplement: unknown,
): readonly ContractBuffBinding[] {
  const data = requireRecord(supplement, 'contract supplement');
  const gameId = requireNonEmptyString(data.gameId, 'contract supplement.gameId');
  const tags = requireRecord(data.tags, `${gameId}.tags`);
  const bindings = requireRecord(
    requireRecord(configuration, 'contract bindings')[gameId],
    `contract bindings.${gameId}`,
  );
  return Object.entries(bindings).map(([id, raw]) => {
    if (!/^\d+$/.test(id)) throw new Error(`invalid contract tag ID ${id}`);
    const entry = requireRecord(raw, `${gameId}.${id}`);
    const tag = requireRecord(tags[id], `${gameId}.tags.${id}`);
    const boards = requireArray(tag.serverBlackboards, `${id}.serverBlackboards`);
    let spRecoveryBonus: number | undefined;
    if (entry.spRecoveryBlackboardIndex !== undefined) {
      const index = requireInteger(
        entry.spRecoveryBlackboardIndex,
        `${id}.spRecoveryBlackboardIndex`,
      );
      const value = requireRecord(
        requireRecord(boards[index], `${id}.blackboard`).recover_ratio,
        `${id}.recover_ratio`,
      );
      if (value.isDynamic !== false)
        throw new Error(`${id}.recover_ratio: dynamic value unsupported`);
      spRecoveryBonus = requireNumber(value.floatValue, `${id}.recover_ratio`);
    }
    return {
      tagId: Number(id),
      ...(spRecoveryBonus === undefined ? {} : { spRecoveryBonus }),
      ...(entry.omitted === undefined
        ? {}
        : { omitted: requireNonEmptyString(entry.omitted, `${id}.omitted`) }),
      ...(entry.pending === undefined
        ? {}
        : { pending: requireNonEmptyString(entry.pending, `${id}.pending`) }),
      buffs: requireArray(entry.buffs, `${id}.buffs`).map((rawBuff, index) => {
        const path = `${id}.buffs[${index}]`;
        const buff = requireRecord(rawBuff, path);
        if (buff.owner !== 'caster' && buff.owner !== 'enemy')
          throw new Error(`${path}.owner: expected caster or enemy`);
        const boardIndex = requireInteger(buff.blackboardIndex, `${path}.blackboardIndex`);
        const board = requireRecord(boards[boardIndex], `${path}.serverBlackboards[${boardIndex}]`);
        const blackboard: Record<string, number | string> = {};
        for (const [key, rawValue] of Object.entries(board)) {
          const value = requireRecord(rawValue, `${path}.${key}`);
          if (value.isDynamic !== false)
            throw new Error(`${path}.${key}: dynamic value unsupported`);
          if (typeof value.strValue !== 'string')
            throw new Error(`${path}.${key}: missing string value`);
          const number = requireNumber(value.floatValue, `${path}.${key}.floatValue`);
          if (!Number.isFinite(number)) throw new Error(`${path}.${key}: non-finite value`);
          blackboard[key] = value.strValue || number;
        }
        return {
          buffId: requireNonEmptyString(buff.buffId, `${path}.buffId`),
          owner: buff.owner,
          blackboard,
        };
      }),
    };
  });
}
