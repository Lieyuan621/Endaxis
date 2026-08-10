import { describe, expect, it } from 'vitest';
import { compileEndaxisScenario } from './compileEndaxisScenario';
import { createDefaultStats } from '@/simulation/defaultActorStats';

/**
 * Trigger-registry dedup must not collapse entries that differ only in what their
 * (id-less) consume effect targets — that silently dropped the disarm trigger for every
 * conditional passive after the first one gated on a given status.
 */

/** The shape timelineStore synthesizes to disarm a conditional passive. */
function disarmEntry(passiveId: string) {
  return {
    sourceTrackId: 'alpha',
    triggerEffect: {
      trigger: {
        kind: 'onStatusExpire',
        status: 'some-stance',
        target: 'self',
        triggerScope: 'global',
      },
      effects: [
        {
          kind: 'consume',
          operatorStatus: passiveId,
          consumeScope: 'team',
          condition: { kind: 'not', condition: { kind: 'operatorStatus', status: 'some-stance' } },
        },
      ],
    },
  };
}

function registryEntriesFor(triggerEffects: unknown[]) {
  const track = {
    id: 'alpha',
    element: 'electric',
    actions: [],
    stats: createDefaultStats(),
    gaugeEfficiency: 100,
    originiumArtsPower: 0,
    linkCdReduction: 0,
    initialGauge: 0,
    maxGaugeOverride: null,
    acceptTeamGauge: true,
    triggerEffects,
  };
  const compiled = compileEndaxisScenario({
    scenarioData: { tracks: [track], connections: [] },
    tracks: [track],
    characterRoster: [],
    systemConstants: {},
  });
  return (compiled?.triggerRegistry as any)?.entries ?? [];
}

describe('trigger registry dedup', () => {
  it('keeps one disarm trigger per conditional passive', () => {
    const entries = registryEntriesFor([
      disarmEntry('liino-ultimate-electric-amp'),
      disarmEntry('liino-ultimate-nature-amp'),
    ]);
    const consumed = entries
      .flatMap((e: any) => e.triggerEffect.effects)
      .map((e: any) => e.operatorStatus)
      .sort();
    // Before the fix both entries keyed on "consume" and only the first survived,
    // so the nature amp was never removed and lasted for the rest of the fight.
    expect(consumed).toEqual(['liino-ultimate-electric-amp', 'liino-ultimate-nature-amp']);
  });

  it('still collapses genuinely identical entries', () => {
    const entries = registryEntriesFor([disarmEntry('same-passive'), disarmEntry('same-passive')]);
    expect(entries).toHaveLength(1);
  });
});
