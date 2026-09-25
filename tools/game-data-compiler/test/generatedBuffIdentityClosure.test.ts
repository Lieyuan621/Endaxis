import { describe, expect, it } from 'vitest';
import * as operators from '../../../src/data/operators';
import { commonBuffDefinitions } from '../../../src/data/buffs/commonDefinitions';
import { collectCompiledBuffIdentityReadIds } from '../src/compiler/references/compiledReferences';

describe('generated Buff identity closure', () => {
  it('has no unclassified missing event signal Buff definitions', () => {
    const eventConditions = (value: unknown): unknown[] => {
      if (Array.isArray(value)) return value.flatMap(eventConditions);
      if (value === null || typeof value !== 'object') return [];
      const record = value as Record<string, unknown>;
      return record.kind === 'eventBuffIdMatch'
        ? [record]
        : Object.values(record).flatMap(eventConditions);
    };
    const definitions = new Set([
      ...Object.keys(commonBuffDefinitions),
      ...Object.values(operators).flatMap(operator => Object.keys(operator.buffDefinitions ?? {})),
    ]);
    const missing = Object.values(operators).flatMap(operator =>
      [...collectCompiledBuffIdentityReadIds(eventConditions(operator))]
        .filter(id => !definitions.has(id))
        .map(id => `${operator.slug}: ${id}`),
    );
    // These are listeners for an enemy-authored signal, not player Buff creation.
    // Same-batch SkillData: eny_0018_lbtough_skill07{,_endinggame},
    // eny_0058_agdisk_skill08 create this ID. The stationary-target model does
    // not execute those enemy skills. Keep the exact pairs visible: do not
    // exempt all enemy IDs or accidentally hide a new player-signal omission.
    expect(missing.sort()).toEqual([
      'catcher: buff_eny_0018_lbtough_pre_catch',
      'purrchena: buff_eny_0018_lbtough_pre_catch',
      'snowshine: buff_eny_0018_lbtough_pre_catch',
    ]);
  });
});
