import { describe, expect, it } from 'vitest';
import {
  collectActionCombatBadges,
  collectCombatBadgesFromAfflictionViz,
} from './actionCombatIcons';
import { projectEnemyAfflictionViz } from '@/simulation/projection/projectEnemyAfflictionViz';

describe('actionCombatIcons', () => {
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

  it('does not invent extra conditional inflictions from hit data (Arcane combo)', () => {
    const badges = collectActionCombatBadges({
      action: {
        hits: [
          {
            offset: 0.1,
            effects: [
              {
                kind: 'infliction',
                element: 'heat',
                condition: { kind: 'operatorStatus', status: 'tracker_heat', consume: true },
              },
              {
                kind: 'infliction',
                element: 'cryo',
                condition: { kind: 'operatorStatus', status: 'tracker_cryo', consume: true },
              },
              {
                kind: 'infliction',
                element: 'electric',
                condition: { kind: 'operatorStatus', status: 'tracker_electric', consume: true },
              },
              {
                kind: 'infliction',
                element: 'nature',
                condition: { kind: 'operatorStatus', status: 'tracker_nature', consume: true },
              },
            ],
          },
        ],
      },
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
              stacks: 1,
              sourceId: 'op_a',
              icon: '/icons/icon_energy_fusion_fire.webp',
            },
          ],
          markers: [],
        },
      },
    });

    expect(badges.map(item => item.key)).toEqual(['heat_infliction']);
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

  it('keeps a delayed burst on its originating action instead of the action at its event time', () => {
    const viz = {
      attachment: {
        markers: [
          {
            typeKey: 'heat_burst',
            time: 11.2,
            stacks: 1,
            sourceId: 'op_a',
            actionId: 'attachment_skill',
            icon: '/icons/icon_energy_fusion_fire.webp',
          },
        ],
        segments: [],
      },
    };

    const originBadges = collectActionCombatBadges({
      action: { instanceId: 'attachment_skill' },
      trackId: 'op_a',
      startTime: 10,
      endTime: 10.5,
      viz,
    });
    const laterBadges = collectActionCombatBadges({
      action: { instanceId: 'later_skill' },
      trackId: 'op_a',
      startTime: 11,
      endTime: 12,
      viz,
    });

    expect(originBadges.map(item => item.key)).toEqual(['heat_burst']);
    expect(laterBadges).toEqual([]);
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

  it('shows direct vulnerability stack growth before a later lift marker', () => {
    const viz = projectEnemyAfflictionViz({
      positionedSegments: [
        {
          typeKey: 'physical_combo',
          group: 0,
          start: 1,
          end: 1,
          stacks: 1,
          effect: { kind: 'physicalStatus', physicalType: 'vulnerability' },
        },
        {
          typeKey: 'physical_combo',
          group: 0,
          start: 1,
          end: 2,
          stacks: 1,
          effect: { kind: 'physicalStatus', physicalType: 'vulnerability' },
        },
        {
          typeKey: 'physical_combo',
          group: 0,
          start: 2,
          end: 2,
          stacks: 1,
          effect: { kind: 'physicalStatus', physicalType: 'vulnerability' },
        },
        {
          typeKey: 'physical_combo',
          group: 0,
          start: 2,
          end: 3,
          stacks: 2,
          effect: { kind: 'physicalStatus', physicalType: 'vulnerability' },
        },
        {
          typeKey: 'physical_combo',
          group: 0,
          start: 3,
          end: 3,
          stacks: 1,
          effect: { kind: 'physicalStatus', physicalType: 'lift' },
        },
        {
          typeKey: 'physical_combo',
          group: 0,
          start: 3,
          end: 8,
          stacks: 3,
          effect: { kind: 'physicalStatus', physicalType: 'vulnerability' },
        },
      ],
    });

    expect(viz.physical.markers).toEqual([
      expect.objectContaining({ typeKey: 'vulnerability', time: 1, stacks: 1 }),
      expect.objectContaining({ typeKey: 'vulnerability', time: 2, stacks: 2 }),
      expect.objectContaining({ typeKey: 'lift', time: 3, stacks: 3 }),
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
