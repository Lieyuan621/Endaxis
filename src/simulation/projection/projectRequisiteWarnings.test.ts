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
