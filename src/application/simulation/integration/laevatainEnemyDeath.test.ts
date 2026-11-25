import { expect, it } from 'vitest';
import { firstScenarioEnemy } from '../../../core/project/level';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { skillFixture } from '../../../test/skillFixture';
import { createTimelineSampleScenario } from '../../../ui/timeline/timelineSampleScenario';
import { createScenarioSimulationService } from '../createScenarioSimulationService';

it.each([
  { spawnFrame: 0, automaticDeath: false },
  { spawnFrame: 10, automaticDeath: false },
  { spawnFrame: 0, automaticDeath: true },
  { spawnFrame: 10, automaticDeath: true },
])(
  '莱万汀吸收手动死亡的非主目标身上的灼热附着（$spawnFrame, 自动死亡 $automaticDeath）',
  ({ spawnFrame, automaticDeath }) => {
    const scenario = createTimelineSampleScenario();
    scenario.battle.enemyAutomaticDeath = automaticDeath;
    const track = scenario.tracks[0]!;
    track.operator!.operatorSlug = 'laevatain';
    track.operator!.talentStates = { '0': 3 };
    scenario.tracks[1] = null;
    scenario.level = {
      kind: 'multiEnemies',
      enemies: [
        firstScenarioEnemy(scenario),
        {
          id: 'enemy:second',
          name: '第二个敌人',
          enemy: {
            ...structuredClone(firstScenarioEnemy(scenario).enemy),
            lifecycle: { spawnFrame, presenceChanges: [], deathFrame: 30 },
          },
        },
      ],
    };
    track.skillCasts = [
      {
        id: 'inflict',
        placement: { startFrame: 15 },
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0016_laevat_attack1',
        },
        customDefinition: skillFixture({
          key: 'chr_0016_laevat_attack1',
          timelineBlockFrames: 10,
          scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'inflict' } }],
          actionGraph: {
            main: {
              nodes: {
                inflict: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: {
                      element: 'heat',
                      isExtra: false,
                      target: { kind: 'enemyByTags', tagQueryType: 'hasAll', tags: [] },
                    },
                  },
                  next: null,
                },
              },
            },
            macros: {},
          },
        }),
      },
    ];
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(5);
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(40);
    restored.advanceToFrame(40);
    expect(restored.collectResult()).toEqual(session.collectResult());
    const entries = session.collectResult().receiptEntries;
    const enemyStates = session.runtime.readState().environment!.enemyInstances!;
    expect(enemyStates.get('enemy:second')!.buffs.instances.size).toBe(0);
    expect(enemyStates.get(firstScenarioEnemy(scenario).id)!.buffs.instances.size).toBeGreaterThan(
      0,
    );
    const released = entries.filter(
      entry => entry.event === 'BuffReleased' && entry.targetId === 'enemy:second',
    );
    expect(released.length).toBeGreaterThan(0);
    expect(released.every(entry => entry.frame === 30)).toBe(true);
    expect(entries.findIndex(entry => entry.event === 'BuffAbsorbed')).toBeLessThan(
      entries.indexOf(released[0]!),
    );
    const afterDeath = session.fork(session.runtime.save());
    session.advanceToFrame(60);
    afterDeath.advanceToFrame(60);
    expect(afterDeath.collectResult()).toEqual(session.collectResult());
    expect(
      session.runtime.readState().environment!.enemyInstances!.get('enemy:second')!.buffs.instances
        .size,
    ).toBe(0);
    expect(entries.filter(e => e.event === 'BuffAbsorbed')).toMatchObject([
      {
        frame: 30,
        sourceId: track.id,
        targetId: 'enemy:second',
        data: { buffId: 'buff_common_energy_shard_attached_fire', layers: 1 },
      },
    ]);
    expect(
      entries.filter(
        e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_chr_0016_laevat_energy',
      ),
    ).toMatchObject([
      {
        frame: 30,
        targetId: track.id,
        data: { layers: 1 },
      },
    ]);
  },
);
