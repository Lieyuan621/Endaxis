import { expect, it } from 'vitest';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { skillFixture } from '../../../test/skillFixture';
import { createTimelineSampleScenario } from '../../../ui/timeline/timelineSampleScenario';
import { createScenarioSimulationService } from '../createScenarioSimulationService';

it('小刻天赋 2 收到触发 Buff 后执行掉落物投射回调，恢复切面后结果一致', () => {
  const scenario = createTimelineSampleScenario();
  const track = scenario.tracks[0]!;
  track.operator!.operatorSlug = 'kay';
  track.operator!.talentStates = { 0: 2, 1: 2 };
  scenario.tracks[1] = null;
  const key = 'chr_0040_sweetpie_attack1';
  track.skillCasts = [
    {
      id: 'trigger',
      placement: { startFrame: 15 },
      source: { kind: 'operatorSkill', skillGroupKey: 'basicAttack', skillKey: key },
      customDefinition: skillFixture({
        key,
        timelineBlockFrames: 10,
        scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'apply' } }],
        actionGraph: {
          main: {
            nodes: {
              apply: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0040_sweetpie_passive_talent2_do' }],
                    targets: { kind: 'owner' },
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
  const session = createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
  session.advanceToFrame(5);
  const restored = session.fork(session.runtime.save());
  for (const run of [session, restored]) {
    run.advanceToFrame(70);
    expect(run.collectResult().receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'AbilityEntitySpawned',
        data: expect.objectContaining({
          abilityEntityId: 'abilityentity_chr_0040_sweetpie_ult_weapon_2_leave',
        }),
      }),
    );
  }
  expect(restored.collectResult()).toEqual(session.collectResult());
});
