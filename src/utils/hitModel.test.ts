import { describe, expect, it } from 'vitest';
import {
  cloneEditorHit,
  createEditorEffect,
  retypeEditorEffect,
  retypeEditorEffectKind,
  summarizeEditorHitTotals,
  toPersistedEditorHits,
} from './hitModel';
import { resolveEffectDisplayKey } from './effectDisplay';

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
    });
  });

  it('preserves numeric value when retyping between stat presets', () => {
    const effect = createEditorEffect('dmgBonus:heat');
    effect.value = 12;
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

  it('does not seed displayType from runtime status ids', () => {
    const hit = cloneEditorHit({
      effects: [
        {
          id: 'lastrite-hypothermic-perfusion',
          name: 'hypothermicPerfusion',
          kind: 'status',
          target: 'team',
          duration: 15,
        },
        {
          id: 'tangtang-waterspouts-sp-return',
          kind: 'spReturn',
          value: 0,
        },
      ],
    });

    expect(hit.effects?.[0]?.displayType).not.toBe('lastrite-hypothermic-perfusion');
    expect(resolveEffectDisplayKey(hit.effects?.[0])).toBe('hypothermicPerfusion');
    expect(hit.effects?.[1]?.displayType).not.toBe('tangtang-waterspouts-sp-return');
    expect(resolveEffectDisplayKey(hit.effects?.[1])).toBe('spReturn');
  });

  it('defaults new physical anomaly runtime effects to a selectable canonical type', () => {
    expect(retypeEditorEffectKind(createEditorEffect('default'), 'physicalStatus')).toMatchObject({
      kind: 'physicalStatus',
      physicalType: 'breach',
    });
  });

  it('strips editor UI metadata when persisting hits', () => {
    const persisted = toPersistedEditorHits(
      [
        {
          id: 'visible',
          offset: 0.5,
          element: 'heat',
          effects: [],
          _editorId: 'ui-1',
          _editorSourceIndex: 0,
        } as any,
      ],
      'physical',
    );

    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toMatchObject({ id: 'visible', offset: 0.5, element: 'heat' });
    expect(persisted[0]).not.toHaveProperty('_editorId');
    expect(persisted[0]).not.toHaveProperty('_editorSourceIndex');
  });

  it('summarizes hit totals with max-per-id for shared ids and sum for anonymous hits', () => {
    expect(
      summarizeEditorHitTotals([
        { id: 'thunder', stagger: 0, spRecovery: 0 },
        { id: 'thunder', stagger: 15, spRecovery: 6 },
        { id: 'thunder', stagger: 15, spRecovery: 6 },
        { id: 'first', stagger: 0, spRecovery: 0 },
      ]),
    ).toEqual({ stagger: 15, spGain: 6 });

    expect(
      summarizeEditorHitTotals([
        { stagger: 10, spRecovery: 5 },
        { stagger: 8, spReturn: 3 },
      ]),
    ).toEqual({ stagger: 18, spGain: 8 });

    expect(
      summarizeEditorHitTotals([
        { id: 'a', stagger: 15, spRecovery: 2 },
        { id: 'a', stagger: 15, spRecovery: 2 },
        { stagger: 10, spRecovery: 4 },
      ]),
    ).toEqual({ stagger: 25, spGain: 6 });
  });
});
