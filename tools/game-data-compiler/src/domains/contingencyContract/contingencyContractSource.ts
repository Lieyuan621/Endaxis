import { imageRefFromPath } from '../../compiler/publication/imageResources.ts';
import type { ContingencyContractTagDefinition } from '../../../../../packages/game-data-contract/src/mechanics.ts';
import {
  requireArray,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
  requireString,
  type SourceRecord,
} from '../../source/primitives.ts';

const TAG_FIELDS = new Set([
  'desc',
  'icon',
  'name',
  'romanNumSuffix',
  'score',
  'tagId',
  'tagTerms',
]);
const TERM_FIELDS = new Set(['blackboard', 'buffId', 'termType']);
const TAG_LAYOUT_FIELDS = new Set([...TAG_FIELDS].filter(field => field !== 'tagTerms'));
const BLACKBOARD_FIELDS = new Set(['key', 'value', 'valueStr']);
const CONTRACT_FIELDS = new Set(['activityId', 'contractGroupMap']);
const COLUMN_CONTRACT_FIELDS = new Set([
  'activityId',
  'contractColMap',
  'contractGroupMap',
  'contractMap',
]);
const GROUP_FIELDS = new Set(['contractMap']);
const COLUMN_FIELDS = new Set(['contractRowMap']);
const ENTRY_FIELDS = new Set([
  'canPreview',
  'conflictId',
  'groupId',
  'keyId',
  'lockIds',
  'tagId',
  'unlockActivityStage',
  'unlockScore',
]);

const COLUMN_ENTRY_FIELDS = new Set([...ENTRY_FIELDS, 'column', 'row']);

/** `Beyond.GEnums.ContingencyContractTermType` recovered from the current game assembly. */
export type ContingencyContractTermKind = 'enemyBuff' | 'selfGlobalBuff' | 'reduceChallengeTime';

export const CONTINGENCY_CONTRACT_TERM_TYPES: ReadonlyMap<number, ContingencyContractTermKind> =
  new Map([
    [1, 'enemyBuff'],
    [2, 'selfGlobalBuff'],
    [3, 'reduceChallengeTime'],
  ] as const);

export interface ContingencyContractBlackboardSource {
  readonly key: string;
  readonly value: number;
  readonly valueStr: string;
}

export interface ContingencyContractTermSource {
  readonly kind: ContingencyContractTermKind;
  readonly buffId: string;
  readonly blackboard: readonly ContingencyContractBlackboardSource[];
}

export interface ContingencyContractTagSource {
  readonly tagId: number;
  readonly nameTextId: string;
  readonly descriptionTextId: string;
  readonly icon: string;
  readonly romanNumSuffix: string;
  readonly score: number;
  readonly terms: readonly ContingencyContractTermSource[];
}

function parseTextReference(value: unknown, path: string): string {
  const reference = requireRecord(value, path);
  requireExactFields(reference, new Set(['id', 'text']), path);
  requireString(reference.text, `${path}.text`);
  if (typeof reference.id !== 'string' && typeof reference.id !== 'number') {
    throw new Error(`${path}.id: expected int64 string or number`);
  }
  return String(reference.id);
}

export interface ContingencyContractEntrySource {
  readonly tagId: number;
  readonly groupId: number;
  readonly keyId: string;
  readonly lockIds: readonly string[];
  readonly unlockScore: number;
  readonly unlockActivityStage: string;
  readonly conflictId: string;
  readonly canPreview: boolean;
}

export interface ContingencyContractSource {
  readonly id: string;
  readonly activityId: string;
  readonly columns: readonly {
    readonly id: string;
    readonly entries: readonly ContingencyContractEntrySource[];
  }[];
}

export interface ContingencyContractCatalogSource {
  readonly tags: readonly ContingencyContractTagSource[];
  readonly contracts: readonly ContingencyContractSource[];
}

/** 仅输出词条选择与说明求值需要的数据；原生 term 与文本留在各自生成链路。 */
export function compileContingencyContractTagDefinitions(
  catalog: ContingencyContractCatalogSource,
): readonly ContingencyContractTagDefinition[] {
  const tags = new Map(catalog.tags.map(tag => [tag.tagId, tag]));
  return (catalog.contracts[0]?.columns ?? []).flatMap(column =>
    column.entries.map(entry => {
      const tag = tags.get(entry.tagId);
      if (tag === undefined) throw new Error(`unknown contract tag ${entry.tagId}`);
      if (!/^[a-zA-Z0-9_-]+$/u.test(tag.icon)) throw new Error(`unsafe contract icon ${tag.icon}`);
      const blackboard: Record<string, number> = {};
      for (const term of tag.terms) {
        for (const item of term.blackboard) {
          if (!Object.hasOwn(blackboard, item.key)) blackboard[item.key] = item.value;
        }
      }
      return {
        tagId: tag.tagId,
        columnId: column.id,
        conflictId: entry.conflictId,
        score: tag.score,
        keyId: entry.keyId,
        lockIds: entry.lockIds,
        romanNumSuffix: tag.romanNumSuffix,
        icon: imageRefFromPath(`/contingency_contract/1/${tag.icon}.webp`),
        blackboard,
      };
    }),
  );
}

function orderedNumericEntries(value: SourceRecord, path: string): [string, unknown][] {
  return Object.entries(value)
    .map(([key, entry]) => {
      if (!/^\d+$/.test(key)) throw new Error(`${path}: expected numeric map key, got ${key}`);
      return [key, entry] as [string, unknown];
    })
    .sort(([left], [right]) => Number(left) - Number(right));
}

function requireBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${path}: expected boolean`);
  return value;
}

function parseTerm(value: unknown, path: string): ContingencyContractTermSource {
  const term = requireRecord(value, path);
  requireExactFields(term, TERM_FIELDS, path);
  const termType = requireInteger(term.termType, `${path}.termType`);
  const kind = CONTINGENCY_CONTRACT_TERM_TYPES.get(termType);
  if (kind === undefined) throw new Error(`${path}.termType: unknown native enum ${termType}`);
  return {
    kind,
    buffId: requireNonEmptyString(term.buffId, `${path}.buffId`),
    blackboard: requireArray(term.blackboard, `${path}.blackboard`).map((raw, index) => {
      const itemPath = `${path}.blackboard[${index}]`;
      const item = requireRecord(raw, itemPath);
      requireExactFields(item, BLACKBOARD_FIELDS, itemPath);
      return {
        key: requireNonEmptyString(item.key, `${itemPath}.key`),
        value: requireNumber(item.value, `${itemPath}.value`),
        valueStr: requireString(item.valueStr, `${itemPath}.valueStr`),
      };
    }),
  };
}

export function parseContingencyContractCatalogSource(
  ccTagTableValue: unknown,
  contractTableValue: unknown,
): ContingencyContractCatalogSource {
  return parseCatalog(ccTagTableValue, contractTableValue, (tag, path) => {
    if (!Object.hasOwn(tag, 'tagTerms')) {
      throw new Error(
        `${path}: missing combat effect source; this CcTagTable has no tagTerms. ` +
          'Explicit Buff bindings are required.',
      );
    }
    return requireArray(tag.tagTerms, `${path}.tagTerms`).map((term, index) =>
      parseTerm(term, `${path}.tagTerms[${index}]`),
    );
  });
}

/** 展示表不承诺具有效果来源；返回值不携带 terms，不能误作空效果编译。 */
export function parseContingencyContractLayoutSource(
  ccTagTableValue: unknown,
  contractTableValue: unknown,
) {
  const catalog = parseCatalog(ccTagTableValue, contractTableValue, () => []);
  return {
    tags: catalog.tags.map(({ terms: _terms, ...tag }) => tag),
    contracts: catalog.contracts,
  };
}

function parseCatalog(
  ccTagTableValue: unknown,
  contractTableValue: unknown,
  readTerms: (tag: SourceRecord, path: string) => readonly ContingencyContractTermSource[],
): ContingencyContractCatalogSource {
  const tagTable = requireRecord(ccTagTableValue, 'CcTagTable');
  const tags = orderedNumericEntries(tagTable, 'CcTagTable').map(([key, raw]) => {
    const path = `CcTagTable.${key}`;
    const tag = requireRecord(raw, path);
    requireExactFields(tag, Object.hasOwn(tag, 'tagTerms') ? TAG_FIELDS : TAG_LAYOUT_FIELDS, path);
    const tagId = requireInteger(tag.tagId, `${path}.tagId`);
    if (String(tagId) !== key) throw new Error(`${path}.tagId: does not match table key`);
    return {
      tagId,
      nameTextId: parseTextReference(tag.name, `${path}.name`),
      descriptionTextId: parseTextReference(tag.desc, `${path}.desc`),
      icon: requireString(tag.icon, `${path}.icon`),
      romanNumSuffix: requireString(tag.romanNumSuffix, `${path}.romanNumSuffix`),
      score: requireInteger(tag.score, `${path}.score`),
      terms: readTerms(tag, path),
    };
  });
  const tagsById = new Map(tags.map(tag => [tag.tagId, tag]));

  const contractTable = requireRecord(contractTableValue, 'ContingencyContractTable');
  const referencedTags = new Set<number>();
  const contracts = Object.entries(contractTable)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, raw]) => {
      const path = `ContingencyContractTable.${id}`;
      const contract = requireRecord(raw, path);
      // 新版按列/行提供布局；contractGroupMap 改为按逻辑分组索引，不能再充当列。
      const columnLayout = Object.hasOwn(contract, 'contractColMap');
      requireExactFields(contract, columnLayout ? COLUMN_CONTRACT_FIELDS : CONTRACT_FIELDS, path);
      const columnsKey = columnLayout ? 'contractColMap' : 'contractGroupMap';
      const rowsKey = columnLayout ? 'contractRowMap' : 'contractMap';
      const columns = orderedNumericEntries(
        requireRecord(contract[columnsKey], `${path}.${columnsKey}`),
        `${path}.${columnsKey}`,
      ).map(([columnId, rawGroup]) => {
        const groupPath = `${path}.${columnsKey}.${columnId}`;
        const group = requireRecord(rawGroup, groupPath);
        requireExactFields(group, columnLayout ? COLUMN_FIELDS : GROUP_FIELDS, groupPath);
        const entries = orderedNumericEntries(
          requireRecord(group[rowsKey], `${groupPath}.${rowsKey}`),
          `${groupPath}.${rowsKey}`,
        ).map(([entryId, rawEntry]) => {
          const entryPath = `${groupPath}.${rowsKey}.${entryId}`;
          const entry = requireRecord(rawEntry, entryPath);
          requireExactFields(entry, columnLayout ? COLUMN_ENTRY_FIELDS : ENTRY_FIELDS, entryPath);
          if (
            columnLayout &&
            (requireInteger(entry.column, `${entryPath}.column`) !== Number(columnId) ||
              requireInteger(entry.row, `${entryPath}.row`) !== Number(entryId))
          ) {
            throw new Error(`${entryPath}: column/row does not match layout position`);
          }
          const tagId = requireInteger(entry.tagId, `${entryPath}.tagId`);
          if (!tagsById.has(tagId)) throw new Error(`${entryPath}.tagId: unknown tag ${tagId}`);
          referencedTags.add(tagId);
          return {
            tagId,
            groupId: requireInteger(entry.groupId, `${entryPath}.groupId`),
            keyId: requireString(entry.keyId, `${entryPath}.keyId`),
            lockIds: requireArray(entry.lockIds, `${entryPath}.lockIds`).map((lockId, index) =>
              requireNonEmptyString(lockId, `${entryPath}.lockIds[${index}]`),
            ),
            unlockScore: requireInteger(entry.unlockScore, `${entryPath}.unlockScore`),
            unlockActivityStage: requireString(
              entry.unlockActivityStage,
              `${entryPath}.unlockActivityStage`,
            ),
            conflictId: requireString(entry.conflictId, `${entryPath}.conflictId`),
            canPreview: requireBoolean(entry.canPreview, `${entryPath}.canPreview`),
          };
        });
        return { id: columnId, entries };
      });
      return {
        id,
        activityId: requireNonEmptyString(contract.activityId, `${path}.activityId`),
        columns,
      };
    });

  const unreferenced = tags.filter(tag => !referencedTags.has(tag.tagId));
  if (unreferenced.length > 0) {
    throw new Error(
      `CcTagTable: tags are not present in ContingencyContractTable: ${unreferenced
        .map(tag => tag.tagId)
        .join(', ')}`,
    );
  }
  return { tags, contracts };
}

export function collectContingencyContractGlobalBuffIds(
  catalog: ContingencyContractCatalogSource,
): string[] {
  return [
    ...new Set(
      catalog.tags.flatMap(tag =>
        tag.terms.flatMap(term => (term.kind === 'selfGlobalBuff' ? [term.buffId] : [])),
      ),
    ),
  ].sort();
}
