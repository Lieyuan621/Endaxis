import { describe, expect, it } from 'vitest';
import { projectRequisiteWarnings } from './projectRequisiteWarnings';
import type { ComboWindowLayout } from './projectComboWindows';

function comboSegment(start: number, end: number, windowStart = start): ComboWindowLayout[number] {
  return {
    start,
    end,
    duration: end - start,
    color: '#fdd900',
    windowStart,
  };
}

function comboWindowTrigger(sourceTrackId: string) {
  return {
    sourceTrackId,
    sourceSkillType: 'comboSkill',
    triggerEffect: {
      effects: [{ kind: 'status', id: `${sourceTrackId}-combo-window`, name: 'comboWindow' }],
    },
  };
}

type ComboWindowTrigger = ReturnType<typeof comboWindowTrigger>;

function comboSkillTrack(id: string, triggerEffects?: ComboWindowTrigger[]) {
  return {
    id,
    ...(triggerEffects ? { triggerEffects } : {}),
    actions: [{ instanceId: `${id}-combo`, type: 'comboSkill', startTime: 6 }],
  };
}

describe('projectRequisiteWarnings combo queue order', () => {
  it('warns when a combo skill is outside its combo window', () => {
    const warnings = projectRequisiteWarnings(
      [
        {
          id: 'perlica',
          actions: [{ instanceId: 'perlica-combo', type: 'comboSkill', startTime: 6 }],
        },
      ],
      new Map([['perlica', [comboSegment(1, 5)]]]),
      [],
      new Map(),
    );

    expect(warnings.get('perlica-combo')).toEqual({ kind: 'comboWindow' });
  });

  it('recognizes combo windows defined only by operator form overrides', () => {
    const warnings = projectRequisiteWarnings(
      [comboSkillTrack('arcane')],
      new Map(),
      [],
      new Map(),
    );

    expect(warnings.get('arcane-combo')).toEqual({ kind: 'comboWindow' });
  });

  it('uses current track trigger effects before falling back to sheet definitions', () => {
    const warnings = projectRequisiteWarnings(
      [comboSkillTrack('arcane', [])],
      new Map(),
      [],
      new Map(),
    );

    expect(warnings.has('arcane-combo')).toBe(false);
  });

  it('checks current-form combo windows when track trigger effects contain them', () => {
    const warnings = projectRequisiteWarnings(
      [comboSkillTrack('arcane', [comboWindowTrigger('arcane')])],
      new Map(),
      [],
      new Map(),
    );

    expect(warnings.get('arcane-combo')).toEqual({ kind: 'comboWindow' });
  });

  it('requires earlier combo windows to be released first', () => {
    const warnings = projectRequisiteWarnings(
      [
        { id: 'perlica', actions: [] },
        {
          id: 'chen-qianyu',
          actions: [{ instanceId: 'chen-combo', type: 'comboSkill', startTime: 3.2 }],
        },
      ],
      new Map([
        ['perlica', [comboSegment(1, 5)]],
        ['chen-qianyu', [comboSegment(2, 6)]],
      ]),
      [],
      new Map(),
    );

    expect(warnings.get('chen-combo')).toEqual({
      kind: 'comboOrder',
      blockingTrackId: 'perlica',
    });
  });

  it('uses track order when combo windows open on the same frame', () => {
    const warnings = projectRequisiteWarnings(
      [
        { id: 'perlica', actions: [] },
        {
          id: 'chen-qianyu',
          actions: [{ instanceId: 'chen-combo', type: 'comboSkill', startTime: 2 }],
        },
      ],
      new Map([
        ['perlica', [comboSegment(1, 5)]],
        ['chen-qianyu', [comboSegment(1, 5)]],
      ]),
      [],
      new Map(),
    );

    expect(warnings.get('chen-combo')).toEqual({
      kind: 'comboOrder',
      blockingTrackId: 'perlica',
    });
  });

  it('does not block a later combo after the earlier window closes', () => {
    const warnings = projectRequisiteWarnings(
      [
        { id: 'perlica', actions: [] },
        {
          id: 'chen-qianyu',
          actions: [{ instanceId: 'chen-combo', type: 'comboSkill', startTime: 5.2 }],
        },
      ],
      new Map([
        ['perlica', [comboSegment(1, 5)]],
        ['chen-qianyu', [comboSegment(2, 6)]],
      ]),
      [],
      new Map(),
    );

    expect(warnings.has('chen-combo')).toBe(false);
  });

  it('projects skill-requisite diagnostics emitted by the simulator', () => {
    const warnings = projectRequisiteWarnings(
      [{ id: 'laevatain', actions: [{ instanceId: 'enhanced', type: 'battleSkill', startTime: 1 }] }],
      new Map(),
      [],
      new Map(),
      [],
      [
        {
          type: 'ACTION_REQUISITE_FAILED',
          time: 1,
          payload: {
            actionId: 'enhanced',
            actorId: 'laevatain',
            skillId: 'enhancedBattleSkill',
            type: 'battleSkill',
            requisiteId: 'laevatain-ultimate-enhancement',
            messageKey: 'actionItem.requisiteTitle.ultimateEnhancementOnly',
          },
        },
      ],
    );

    expect(warnings.get('enhanced')).toEqual({
      kind: 'skillRequisite',
      requisiteId: 'laevatain-ultimate-enhancement',
      messageKey: 'actionItem.requisiteTitle.ultimateEnhancementOnly',
      params: undefined,
    });
  });

  it('lets skill-requisite diagnostics override generic resource warnings', () => {
    const warnings = projectRequisiteWarnings(
      [
        {
          id: 'arcane',
          actions: [
            { instanceId: 'arcane-ultimate', type: 'ultimate', startTime: 1, gaugeCost: 100 },
          ],
        },
      ],
      new Map(),
      [],
      new Map([['arcane', [{ time: 0, val: 0, ratio: 0 }]]]),
      [],
      [
        {
          type: 'ACTION_REQUISITE_FAILED',
          time: 1,
          payload: {
            actionId: 'arcane-ultimate',
            actorId: 'arcane',
            skillId: 'ultimate',
            type: 'ultimate',
            requisiteId: 'arcane-ultimate-arcana-ready',
            messageKey: 'actionItem.requisiteTitle.arcaneUltimateArcanaRequired',
          },
        },
      ],
    );

    expect(warnings.get('arcane-ultimate')).toEqual({
      kind: 'skillRequisite',
      requisiteId: 'arcane-ultimate-arcana-ready',
      messageKey: 'actionItem.requisiteTitle.arcaneUltimateArcanaRequired',
      params: undefined,
    });
  });

  it('orders split combo-window segments by their original window start', () => {
    const warnings = projectRequisiteWarnings(
      [
        { id: 'perlica', actions: [] },
        {
          id: 'chen-qianyu',
          actions: [{ instanceId: 'chen-combo', type: 'comboSkill', startTime: 3.2 }],
        },
      ],
      new Map([
        ['perlica', [comboSegment(3, 4, 1)]],
        ['chen-qianyu', [comboSegment(2, 6)]],
      ]),
      [],
      new Map(),
    );

    expect(warnings.get('chen-combo')).toEqual({
      kind: 'comboOrder',
      blockingTrackId: 'perlica',
    });
  });
});
