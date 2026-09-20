import { parseSkillSettingResources } from '../../../../packages/game-data-contract/src/skillSettingResources.ts';
import {
  requireArray,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';

export type SkillSettingEnhanceFormulaSource =
  | { readonly kind: 'none' }
  | { readonly kind: 'linear'; readonly paramA: number }
  | { readonly kind: 'saturating'; readonly paramA: number; readonly paramB: number };

export interface SkillSettingCatalogEntrySource {
  readonly key: string;
  readonly values: readonly number[];
  readonly enhanceFormulaKey: string;
}

export interface SkillSettingCatalogSource {
  readonly revision: string;
  readonly data: ReadonlyMap<string, SkillSettingCatalogEntrySource>;
  readonly formulas: ReadonlyMap<string, SkillSettingEnhanceFormulaSource>;
}

export function parseSkillSettingCatalogSource(
  value: unknown,
  path = 'SkillSettingCatalog',
): SkillSettingCatalogSource {
  const root = requireRecord(value, path);
  requireExactFields(
    root,
    new Set(['schemaVersion', 'revision', 'data', 'enhanceFormulas', 'resources']),
    path,
  );
  // This catalog consumes only infliction rows; validate any accompanying resource section.
  if (root.resources !== undefined) parseSkillSettingResources(root.resources);
  if (requireInteger(root.schemaVersion, `${path}.schemaVersion`) !== 1) {
    throw new Error(`${path}.schemaVersion: expected 1`);
  }
  const formulas = new Map<string, SkillSettingEnhanceFormulaSource>();
  requireArray(root.enhanceFormulas, `${path}.enhanceFormulas`).forEach((value, index) => {
    const formulaPath = `${path}.enhanceFormulas[${index}]`;
    const formula = requireRecord(value, formulaPath);
    const key = requireNonEmptyString(formula.key, `${formulaPath}.key`);
    if (formulas.has(key)) throw new Error(`${formulaPath}.key: duplicate ${key}`);
    const kindField = formula.formulaType === undefined ? 'kind' : 'formulaType';
    const kind = requireNonEmptyString(formula[kindField], `${formulaPath}.${kindField}`);
    if (kind === 'none') {
      requireExactFields(
        formula,
        new Set(
          kindField === 'formulaType' ? ['key', kindField, 'paramA', 'paramB'] : ['key', kindField],
        ),
        formulaPath,
      );
      if (kindField === 'formulaType') {
        requireNumber(formula.paramA, `${formulaPath}.paramA`);
        requireNumber(formula.paramB, `${formulaPath}.paramB`);
      }
      formulas.set(key, { kind });
      return;
    }
    if (kind === 'linear') {
      requireExactFields(
        formula,
        new Set(
          kindField === 'formulaType'
            ? ['key', kindField, 'paramA', 'paramB']
            : ['key', kindField, 'paramA'],
        ),
        formulaPath,
      );
      formulas.set(key, {
        kind,
        paramA: requireNumber(formula.paramA, `${formulaPath}.paramA`),
      });
      return;
    }
    if (kind === 'saturating') {
      requireExactFields(formula, new Set(['key', kindField, 'paramA', 'paramB']), formulaPath);
      formulas.set(key, {
        kind,
        paramA: requireNumber(formula.paramA, `${formulaPath}.paramA`),
        paramB: requireNumber(formula.paramB, `${formulaPath}.paramB`),
      });
      return;
    }
    throw new Error(`${formulaPath}.${kindField}: unsupported ${kind}`);
  });
  const data = new Map<string, SkillSettingCatalogEntrySource>();
  requireArray(root.data, `${path}.data`).forEach((value, index) => {
    const entryPath = `${path}.data[${index}]`;
    const entry = requireRecord(value, entryPath);
    requireExactFields(entry, new Set(['key', 'values', 'enhanceFormulaKey']), entryPath);
    const key = requireNonEmptyString(entry.key, `${entryPath}.key`);
    if (data.has(key)) throw new Error(`${entryPath}.key: duplicate ${key}`);
    const values = requireArray(entry.values, `${entryPath}.values`).map((value, column) =>
      requireNumber(value, `${entryPath}.values[${column}]`),
    );
    if (values.length !== 4) throw new Error(`${entryPath}.values: expected four columns`);
    const enhanceFormulaKey = requireString(
      entry.enhanceFormulaKey,
      `${entryPath}.enhanceFormulaKey`,
    );
    if (enhanceFormulaKey !== '' && !formulas.has(enhanceFormulaKey)) {
      throw new Error(`${entryPath}.enhanceFormulaKey: missing formula ${enhanceFormulaKey}`);
    }
    data.set(key, { key, values, enhanceFormulaKey });
  });
  return {
    revision: requireNonEmptyString(root.revision, `${path}.revision`),
    data,
    formulas,
  };
}
