import { describe, expect, test } from 'vitest';
import {
  EFFECT_KINDS,
  EDITOR_EFFECT_KINDS,
  EFFECT_KIND_FIELDS,
  effectKindHasField,
  getEffectEditableFieldKeys,
  createEffectKindDefaults,
} from './effectSchema';
import {
  ATTRIBUTES,
  OPERATOR_CLASSES,
  OPERATOR_STAT_MODIFIERS,
  PHYSICAL_STATUS_TYPES,
  REACTION_TYPES,
  TREAT_AS_REACTION_TYPES,
} from '@/data/enums';
import { createEditorEffect, retypeEditorEffectKind } from '@/utils/hitModel';

describe('hit/effect editor SSOT', () => {
  test('covers every editor effect kind with field defs', () => {
    expect(EDITOR_EFFECT_KINDS).not.toContain('derived');
    expect(EFFECT_KINDS).toContain('derived');
    for (const kind of EFFECT_KINDS) {
      expect(EFFECT_KIND_FIELDS[kind]?.length, kind).toBeGreaterThan(0);
      expect(getEffectEditableFieldKeys(kind)).toEqual(
        expect.arrayContaining(['id', 'duration', ...EFFECT_KIND_FIELDS[kind]]),
      );
    }
  });

  test('domain physical / reaction enums are exposed for selects', () => {
    expect(PHYSICAL_STATUS_TYPES).toContain('vulnerability');
    expect(TREAT_AS_REACTION_TYPES).toContain('shatter');
    expect(TREAT_AS_REACTION_TYPES).toEqual(
      expect.arrayContaining([...REACTION_TYPES, 'shatter', 'breach', 'crush']),
    );
  });

  test('derived kind defaults and retype work', () => {
    expect(createEffectKindDefaults('derived')).toMatchObject({
      kind: 'derived',
      sourceEffect: '',
    });
    const effect = retypeEditorEffectKind(createEditorEffect('default'), 'derived');
    expect(effect).toMatchObject({ kind: 'derived', sourceEffect: '' });
  });

  test('keeps structured kind fields on the schema (no primary JSON escape list)', () => {
    expect(effectKindHasField('status', 'stat')).toBe(true);
    expect(effectKindHasField('status', 'target')).toBe(true);
    expect(effectKindHasField('ultEnergyGain', 'target')).toBe(true);
    expect(effectKindHasField('damageHit', 'stat')).toBe(false);
    expect(effectKindHasField('damageOverTime', 'consumedStatEffects')).toBe(true);
    expect(effectKindHasField('consume', 'operatorStatus')).toBe(true);
    expect(effectKindHasField('damageHit', 'hit')).toBe(true);
    expect(effectKindHasField('derived', 'effect')).toBe(true);
    expect(OPERATOR_STAT_MODIFIERS).toEqual(
      expect.arrayContaining(['attributeFlat', 'attributePercent']),
    );
    expect(ATTRIBUTES).toContain('main');
    expect(OPERATOR_CLASSES).toContain('guard');
  });
});
