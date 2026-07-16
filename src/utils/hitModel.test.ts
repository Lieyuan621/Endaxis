import { describe, expect, it } from 'vitest';
import {
  canEditEditorEffectValue,
  cloneEditorHit,
  createEditorEffect,
  filterEditorVisibleHits,
  getEditorEffectEditableFields,
  mergeEditorVisibleHits,
  parseEditorJsonField,
  patchEditorHitAt,
  retypeEditorEffect,
  retypeEditorEffectKind,
} from './hitModel';

describe('hit editor effect model', () => {
  it('creates simulator-native effect shapes from display effect keys', () => {
    expect(createEditorEffect('heat_infliction')).toMatchObject({
      type: 'heat_infliction',
      kind: 'infliction',
      element: 'heat',
      stacks: 1,
    });

    expect(createEditorEffect('breach')).toMatchObject({
      type: 'breach',
      kind: 'physicalStatus',
      physicalType: 'breach',
    });

    expect(createEditorEffect('combustion')).toMatchObject({
      type: 'combustion',
      kind: 'reaction',
      reactionType: 'combustion',
    });
  });

  it('creates simulator stat effects from stat preset display keys', () => {
    expect(createEditorEffect('dmgBonus:heat')).toMatchObject({
      type: 'dmgBonus:heat',
      displayType: 'dmgBonus:heat',
      kind: 'status',
      stat: { modifier: 'dmgBonus', elements: 'heat' },
      target: 'self',
      value: 0,
    });

    expect(createEditorEffect('dmgBonus:basicAttack')).toMatchObject({
      type: 'dmgBonus:basicAttack',
      kind: 'status',
      stat: { modifier: 'dmgBonus', skillTypes: 'basicAttack' },
      target: 'self',
      value: 0,
    });

    expect(createEditorEffect('critRate')).toMatchObject({
      type: 'critRate',
      kind: 'status',
      stat: { modifier: 'critRate' },
      target: 'self',
      value: 0,
    });

    expect(createEditorEffect('resistanceShred:physical')).toMatchObject({
      type: 'resistanceShred:physical',
      kind: 'status',
      stat: { modifier: 'resistanceShred', elements: 'physical' },
      target: 'enemy',
      value: 0,
    });
  });

  it('retypes an existing editor effect without keeping stale runtime routing fields', () => {
    const effect = createEditorEffect('default');
    const retyped = retypeEditorEffect(effect, 'electric_infliction');

    expect(retyped).toMatchObject({
      _id: effect._id,
      type: 'electric_infliction',
      displayType: 'electric_infliction',
      kind: 'infliction',
      element: 'electric',
      stacks: 1,
      duration: 0,
    });
    expect(retyped).not.toHaveProperty('id');
    expect(retyped).not.toHaveProperty('reactionType');
    expect(retyped).not.toHaveProperty('physicalType');
  });

  it('retypes between stat effects without keeping stale stat routing fields', () => {
    const effect = {
      ...createEditorEffect('critRate'),
      value: 12,
    };
    const retyped = retypeEditorEffect(effect, 'resistanceShred:physical');

    expect(retyped).toMatchObject({
      _id: effect._id,
      type: 'resistanceShred:physical',
      displayType: 'resistanceShred:physical',
      kind: 'status',
      stat: { modifier: 'resistanceShred', elements: 'physical' },
      target: 'enemy',
      value: 12,
    });
    expect(retyped.stat).not.toHaveProperty('skillTypes');
  });

  it('marks value-bearing runtime effects as editable in the skill editor', () => {
    expect(canEditEditorEffectValue(createEditorEffect('dmgBonus:heat'))).toBe(true);
    expect(canEditEditorEffectValue({ kind: 'damageHit', value: 100 })).toBe(true);
    expect(canEditEditorEffectValue({ kind: 'spRecovery', value: 10 })).toBe(true);
    expect(canEditEditorEffectValue(createEditorEffect('heat_infliction'))).toBe(false);
  });

  it('patches one editor hit without dropping uncommon runtime fields', () => {
    const hits = [
      {
        id: 'hit-a',
        offset: 0,
        multiplier: 100,
        element: 'heat',
        spRecovery: 0,
        spReturn: 0,
        stagger: 1,
        durationExtension: 0.25,
        treatAsReaction: 'combustion',
        treatAsSkillType: 'battleSkill',
        _condition: { kind: 'enemyHp', lt: 50 },
        effects: [{ kind: 'status', id: 'keep', duration: 3 }],
      },
      {
        id: 'hit-b',
        offset: 1,
        multiplier: 200,
        spRecovery: 0,
        spReturn: 0,
        stagger: 2,
        effects: [],
      },
    ];

    const next = patchEditorHitAt(hits, 0, { multiplier: 333, element: 'cryo' });

    expect(next[0]).toMatchObject({
      id: 'hit-a',
      multiplier: 333,
      element: 'cryo',
      durationExtension: 0.25,
      treatAsReaction: 'combustion',
      treatAsSkillType: 'battleSkill',
      _condition: { kind: 'enemyHp', lt: 50 },
    });
    expect(next[0]?.effects).toHaveLength(1);
    expect(next[0]?.effects?.[0]?._id).toBeTruthy();
    expect(next[1]).toMatchObject({ id: 'hit-b', multiplier: 200 });
  });

  it('parses editor JSON fields without accepting invalid JSON', () => {
    expect(parseEditorJsonField('{"kind":"enemyHp","lt":50}')).toEqual({
      ok: true,
      value: { kind: 'enemyHp', lt: 50 },
    });
    expect(parseEditorJsonField('')).toEqual({ ok: true, value: undefined });
    expect(parseEditorJsonField('{bad')).toMatchObject({ ok: false });
  });

  it('clones one editor hit with generated effect ids', () => {
    const hit = cloneEditorHit({
      offset: 0,
      multiplier: 100,
      spRecovery: 0,
      spReturn: 0,
      stagger: 0,
      effects: [{ kind: 'infliction', element: 'heat' }],
    });

    expect(hit.effects?.[0]?._id).toBeTruthy();
    expect(hit.multiplier).toBe(100);
  });

  it('reports editable fields for status and damageHit effects', () => {
    expect(
      getEditorEffectEditableFields({ kind: 'status', stat: { modifier: 'dmgBonus' } }),
    ).toEqual(
      expect.arrayContaining(['target', 'stat', 'value', 'scaling', 'external', 'condition']),
    );
    expect(getEditorEffectEditableFields({ kind: 'damageHit' })).toEqual(
      expect.arrayContaining([
        'element',
        'multiplier',
        'multiplierScaling',
        'staggerScaling',
        'hit',
        'scaleByCrit',
      ]),
    );
  });

  it('retypes effects by runtime kind without dropping identity and lifecycle fields', () => {
    const effect = {
      _id: 'effect-a',
      kind: 'status',
      id: 'old',
      duration: 5,
      stacks: 2,
      stat: { modifier: 'critRate' },
      value: 10,
    };

    expect(retypeEditorEffectKind(effect, 'damageHit')).toMatchObject({
      _id: 'effect-a',
      kind: 'damageHit',
      duration: 5,
      stacks: 2,
      element: 'physical',
      multiplier: 0,
    });
  });

  it('defaults new physical anomaly runtime effects to a selectable canonical type', () => {
    expect(retypeEditorEffectKind(createEditorEffect('default'), 'physicalStatus')).toMatchObject({
      kind: 'physicalStatus',
      physicalType: 'breach',
    });
  });

  it('filters editor-hidden runtime hit branches while preserving them on save', () => {
    const hits = [
      { id: 'visible', offset: 0, element: 'physical', effects: [] },
      { id: 'hidden-a', offset: 1, element: 'electric', hideInEditor: true, effects: [] },
      { id: 'hidden-b', offset: 2, element: 'electric', hiddenInEditor: true, effects: [] },
    ];

    expect(filterEditorVisibleHits(hits).map(hit => hit.id)).toEqual(['visible']);

    const merged = mergeEditorVisibleHits(hits, [
      { id: 'visible', offset: 0.5, element: 'heat', effects: [] },
    ]);

    expect(merged.map(hit => hit.id)).toEqual(['visible', 'hidden-a', 'hidden-b']);
    expect(merged[0]).toMatchObject({ id: 'visible', offset: 0.5, element: 'heat' });
    expect(merged[1]).toMatchObject({ id: 'hidden-a', hideInEditor: true });
    expect(merged[2]).toMatchObject({ id: 'hidden-b', hiddenInEditor: true });
  });
});
