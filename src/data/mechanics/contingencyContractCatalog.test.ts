import { describe, expect, it } from 'vitest';
import {
  contingencyContractTags,
  isContingencyContractTagLocked,
  toggleContingencyContractTag,
} from './contingencyContractCatalog';

describe('contingencyContractCatalog', () => {
  it('classifies every current package tag without hiding unfinished work', () => {
    expect(contingencyContractTags).toHaveLength(46);
    expect(contingencyContractTags.filter(tag => tag.support === 'supported')).toHaveLength(24);
    expect(contingencyContractTags.filter(tag => tag.support === 'blocked')).toHaveLength(0);
    expect(contingencyContractTags.filter(tag => tag.support === 'omitted')).toHaveLength(22);
    expect(contingencyContractTags.every(tag => !Object.hasOwn(tag, 'localization'))).toBe(true);
  });

  it('replaces a selected tier in the same native conflict group', () => {
    expect(toggleContingencyContractTag([102801, 100003], 102803)).toEqual([100003, 102803]);
    expect(toggleContingencyContractTag([100003], 100003)).toEqual([]);
    expect(toggleContingencyContractTag([], 900101)).toEqual([900101]);
  });

  it('requires the native key from either Overclock or Tremor before selecting later tags', () => {
    const overclock = contingencyContractTags.find(tag => tag.tagId === 100003)!;
    const tremor = contingencyContractTags.find(tag => tag.tagId === 103203)!;
    const downstream = contingencyContractTags.find(tag => tag.tagId === 103102)!;
    expect(overclock.keyId).toBe('key2');
    expect(tremor.keyId).toBe('key2');
    expect(downstream.lockIds).toEqual(['key2']);

    expect(isContingencyContractTagLocked([], downstream.tagId)).toBe(true);
    expect(toggleContingencyContractTag([], downstream.tagId)).toEqual([]);
    expect(toggleContingencyContractTag([100803], downstream.tagId)).toEqual([100803]);
    expect(toggleContingencyContractTag([overclock.tagId], downstream.tagId)).toEqual([
      overclock.tagId,
      downstream.tagId,
    ]);
    expect(toggleContingencyContractTag([tremor.tagId], downstream.tagId)).toEqual([
      tremor.tagId,
      downstream.tagId,
    ]);
  });

  it('switches the mutually exclusive key provider without dropping already selected descendants', () => {
    expect(toggleContingencyContractTag([100003, 103102], 103203)).toEqual([103102, 103203]);
  });
});
