import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { skillFixture } from '../../../test/skillFixture';
import { createScenarioSimulationService } from '../createScenarioSimulationService';

it('实体结束后其被动施加的独立 Buff 仍能从切面恢复并执行后续动作', () => {
  const operator = gameDataRepository.getOperator('perlica')!;
  const scenario = createEmptyScenario('ended-entity', 'ended-entity');
  scenario.battle.durationFrames = 90;
  scenario.tracks[0] = {
    id: 'operator',
    operator: {
      operatorSlug: operator.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [
      {
        id: 'spawn',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0004_pelica_attack1',
        },
        placement: { startFrame: 0 },
        customDefinition: skillFixture({
          key: 'chr_0004_pelica_attack1',
          timelineBlockFrames: 1,
          scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'spawn' } }],
          actionGraph: {
            main: {
              nodes: {
                spawn: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'owner' },
                      abilityEntityId: 'short-lived-host',
                      dieWhenSourceDies: false,
                      definition: {
                        lifetime: { kind: 'limited', durationSeconds: 0.1 },
                        passiveSkills: [
                          {
                            key: 'install-independent-buff',
                            blackboard: {},
                            enableSequence: { $sequence: 'apply' },
                            actionGraph: {
                              main: {
                                nodes: {
                                  apply: {
                                    action: {
                                      kind: 'applyBuff',
                                      parameters: {
                                        targets: { kind: 'fixed', target: 'caster' },
                                        buffs: [{ buffId: 'delayed-independent' }],
                                      },
                                    },
                                    next: null,
                                  },
                                },
                              },
                              macros: {},
                            },
                          },
                        ],
                      },
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
    ],
  };
  const repository = {
    ...gameDataRepository,
    getOperator: (slug: string) =>
      slug !== operator.slug
        ? gameDataRepository.getOperator(slug)
        : {
            ...operator,
            buffDefinitions: {
              ...operator.buffDefinitions,
              'delayed-independent': {
                stackingType: 'unlimited' as const,
                durationSeconds: 2,
                scheduledSequences: [{ startFrame: 45, sequence: { $sequence: 'gain' } }],
                actionGraph: {
                  main: {
                    nodes: {
                      gain: {
                        action: {
                          kind: 'changeResource' as const,
                          parameters: {
                            resource: 'ultimateEnergy' as const,
                            amount: 7,
                            source: { kind: 'owner' as const },
                            targets: { kind: 'owner' as const },
                          },
                        },
                        next: null,
                      },
                    },
                  },
                  macros: {},
                },
              },
            },
          },
  };
  const parent = createScenarioSimulationService(repository).createCombatSession(scenario);
  parent.advanceToFrame(30);
  expect(parent.runtime.readState().instances.abilityEntities.instances.size).toBe(0);
  expect(
    parent
      .collectResult()
      .receiptEntries.some(
        entry => entry.event === 'BuffApplied' && entry.data?.buffId === 'delayed-independent',
      ),
  ).toBe(true);
  const child = parent.fork(parent.runtime.save());
  parent.advanceToFrame(90);
  child.advanceToFrame(90);
  expect(
    parent.runtime.readState().shared.resources.operators.get('operator')?.ultimateEnergy,
  ).toBe(7);
  expect(child.collectResult()).toEqual(parent.collectResult());
});
