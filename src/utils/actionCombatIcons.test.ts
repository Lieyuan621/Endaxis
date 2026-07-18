import { describe, expect, it } from 'vitest';
import {
  collectActionCombatBadges,
  collectCombatBadgesFromAfflictionViz,
  collectCombatBadgesFromHits,
} from './actionCombatIcons';
import { projectEnemyAfflictionViz } from '@/simulation/projection/projectEnemyAfflictionViz';

describe('actionCombatIcons', () => {
  it('collects infliction badges from hits without duration bars', () => {
    const badges = collectCombatBadgesFromHits(
      {
        hits: [
          {
            offset: 0.2,
            effects: [
              { kind: 'infliction', element: 'heat', stacks: 2 },
              { kind: 'physicalStatus', physicalType: 'lift', forced: true },
              { kind: 'status', stat: { modifier: 'atkPercent' }, value: 10 },
            ],
          },
        ],
      },
      10,
    );

    expect(badges.map(item => item.key)).toEqual(['heat_infliction']);
    expect(badges[0]).toMatchObject({
      stacks: 2,
      duration: 0,
      isMarker: true,
      kind: 'attachment',
    });
  });

  it('uses normalized physical viz markers for forced lift and vuln seeding', () => {
    const badges = collectCombatBadgesFromAfflictionViz({
      trackId: 'op_a',
      startTime: 10,
      endTime: 11,
      viz: {
        physical: {
          markers: [
            {
              typeKey: 'lift',
              time: 10.2,
              stacks: 1,
              sourceId: 'op_a',
              icon: '/icons/icon_battle_physical_airborne.webp',
            },
          ],
          segments: [],
        },
        attachment: {
          segments: [
            {
              typeKey: 'heat_infliction',
              start: 10.1,
              end: 30.1,
              stacks: 2,
              sourceId: 'op_a',
              icon: '/icons/icon_energy_fusion_fire.webp',
            },
          ],
          markers: [],
        },
      },
    });

    const lift = badges.find(item => item.key === 'lift');
    const heat = badges.find(item => item.key === 'heat_infliction');
    expect(lift).toMatchObject({ kind: 'physical', isMarker: true, stacks: 1 });
    expect(heat).toMatchObject({ kind: 'attachment', duration: 0, isMarker: true, stacks: 2 });
  });

  it('does not invent physical badges from raw hit effects', () => {
    const badges = collectActionCombatBadges({
      action: {
        hits: [{ effects: [{ kind: 'physicalStatus', physicalType: 'lift' }] }],
      },
      trackId: 'op_a',
      startTime: 1,
      endTime: 2,
      viz: { physical: { markers: [], segments: [] } },
    });
    expect(badges).toEqual([]);
  });

  it('hides attachments when an anomaly is triggered in the same window', () => {
    const badges = collectActionCombatBadges({
      trackId: 'op_a',
      startTime: 10,
      endTime: 11,
      viz: {
        attachment: {
          segments: [
            {
              typeKey: 'heat_infliction',
              start: 10.1,
              end: 30.1,
              stacks: 2,
              sourceId: 'op_a',
              icon: '/icons/icon_energy_fusion_fire.webp',
            },
          ],
          markers: [],
        },
        anomalies: {
          markers: [
            {
              typeKey: 'combustion',
              time: 10.1,
              stacks: 1,
              sourceId: 'op_a',
              icon: '/icons/icon_energy_fusion_combustion.webp',
            },
          ],
          segments: [],
        },
      },
    });

    expect(badges.map(item => item.key)).toEqual(['combustion']);
  });
});

describe('projectEnemyAfflictionViz physical normalize', () => {
  it('keeps forced lift when there is no prior vulnerability', () => {
    const viz = projectEnemyAfflictionViz({
      positionedSegments: [
        {
          typeKey: 'physical_combo',
          group: 0,
          start: 5,
          end: 5,
          stacks: 0,
          showIcon: true,
          icon: '/icons/icon_battle_physical_airborne.webp',
          effect: { kind: 'physicalStatus', physicalType: 'lift' },
          sourceId: 'op_a',
        },
      ],
    });

    expect(viz.physical.markers).toEqual([
      expect.objectContaining({ typeKey: 'lift', stacks: 1, time: 5 }),
    ]);
  });

  it('seeds one vulnerability stack for non-control physical without prior vuln', () => {
    const viz = projectEnemyAfflictionViz({
      positionedSegments: [
        {
          typeKey: 'physical_combo',
          group: 0,
          start: 5,
          end: 5,
          stacks: 0,
          showIcon: true,
          icon: '/icons/icon_battle_physical_fracture.webp',
          effect: { kind: 'physicalStatus', physicalType: 'breach' },
          sourceId: 'op_a',
        },
      ],
    });

    expect(viz.physical.markers).toEqual([
      expect.objectContaining({ typeKey: 'vulnerability', stacks: 1, time: 5 }),
    ]);
  });
});

describe('pickRepresentativePhysicalMarker', () => {
  it('preserves lift without prior stacks and seeds vulnerability otherwise', async () => {
    const { pickRepresentativePhysicalMarker } = await import(
      '@/simulation/projection/projectEnemyAfflictionViz'
    );
    expect(
      pickRepresentativePhysicalMarker([{ typeKey: 'lift', stacks: 1, time: 1 }], 0, 0),
    ).toMatchObject({ typeKey: 'lift', stacks: 1 });
    expect(
      pickRepresentativePhysicalMarker([{ typeKey: 'breach', stacks: 1, time: 1 }], 0, 0),
    ).toMatchObject({ typeKey: 'vulnerability', stacks: 1 });
  });
});
