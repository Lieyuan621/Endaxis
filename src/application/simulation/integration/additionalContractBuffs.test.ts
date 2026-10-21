import { prepareStandardPlayerDamageScenarioRuntime } from '../runStandardPlayerDamageScenarioSimulation';
import { createStandardPlayerDamageCombatSession } from '../standardPlayerDamageCombatSession';
import { projectPoiseCurveFromReceipt } from '../../../core/projection/poiseCurves';
import { skillFixture } from '../../../test/skillFixture';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import { compoundStatusFactories } from '../../../data/buffs/compoundStatusFactories';
import { skillSettings } from '../../../data/combat/skillSettings';
import { it, expect } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { ActionGraphDefinitionRepository } from '../../../core/compiler/actionGraphDefinitionRepository';
import { MechanicAdapterRegistry } from '../../../core/scenarioMechanics/mechanicCompiler';
import { runStandardPlayerDamageScenarioSimulation } from '../../../application/simulation/runStandardPlayerDamageScenarioSimulation';

function run(
  root: string,
  skills: string[],
  endFrame = 900,
  configure?: (scenario: ReturnType<typeof createEmptyScenario>) => void,
  checkpointFrame?: number,
) {
  const scenario = createEmptyScenario('native-contract', 'native-contract');
  scenario.enemy.editable.hp = 1000000;
  scenario.battle.resourceRules = { maxSp: 1000, initialSp: 0, spRecoveryPerSecond: 8 };
  for (let i = 0; i < 2; i++)
    scenario.tracks[i] = {
      id: `op:${i}`,
      operator: {
        operatorSlug: 'perlica',
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
      skillCasts: i
        ? []
        : skills.map((skill, j) => ({
            id: `cast:${j}`,
            source: {
              kind: 'operatorSkill',
              skillGroupKey:
                skill === 'ultimate_skill'
                  ? 'ultimate'
                  : skill === 'normal_skill'
                    ? 'battleSkill'
                    : skill === 'power_attack'
                      ? 'finisher'
                      : 'comboSkill',
              skillKey: `chr_0004_pelica_${skill}`,
            },
            placement: { startFrame: 450 + j * 60 },
          })),
    };
  configure?.(scenario);
  scenario.mechanics.selections = [
    { id: 'contract', mechanicId: 'native-contract', enabled: true, parameters: {} },
  ];
  const programs = new ActionGraphDefinitionRepository();
  const init = programs
    .compile(
      {
        main: {
          nodes: {
            init: {
              action: {
                kind: 'applyBuff',
                parameters: {
                  targets:
                    root === 'buff_cc_enemy_poise_up' ||
                    root === 'buff_cc_eny_numshield_instance' ||
                    root === 'buff_cc02_eny_numshield' ||
                    root === 'buff_common_cryst_cryst_frozen_triggered_do'
                      ? { kind: 'fixed', target: 'enemy' }
                      : { kind: 'characterTeam', excludeOwner: false },
                  buffs: [
                    {
                      buffId: root,
                      ...(root === 'buff_cc_eny_numshield_instance'
                        ? { blackboardAssignments: { shield_num_max: 2 } }
                        : {}),
                    },
                  ],
                },
              },
              next: null,
            },
          },
          dataNodes: {},
        },
        macros: {},
      },
      0,
    )
    .compileEntry({ $sequence: 'init' }, 'native-contract');
  const simulate: typeof runStandardPlayerDamageScenarioSimulation =
    checkpointFrame === undefined
      ? runStandardPlayerDamageScenarioSimulation
      : input => {
          const prepared = prepareStandardPlayerDamageScenarioRuntime(input);
          const parent = createStandardPlayerDamageCombatSession(
            prepared.compiled,
            prepared.restoredEnvironment,
          );
          parent.advanceToFrame(checkpointFrame);
          const child = parent.fork(parent.runtime.save());
          parent.advanceToFrame(input.endFrame);
          child.advanceToFrame(input.endFrame);
          const result = parent.collectResult();
          expect(child.collectResult()).toEqual(result);
          return result;
        };
  return simulate({
    scenario,
    endFrame,
    elementalInflictionDocument: elementalAttachments,
    compoundStatusFactories,
    spellInflictionSettings: skillSettings,
    criticalSamples: { nextCriticalSample: () => 1 },
    resolveNonRandomRuntimeSnapshot: () => ({
      runtimeExtensionMultiplier: 1,
      appliesIgniteDamageMultiplier: false,
      appliesPhysicalInflictionDamageMultiplier: false,
    }),
    options: {
      index: {
        ...gameDataRepository,
        actionPrograms: programs,
        getMechanic: () => ({
          id: 'native-contract',
          family: 'contingencyContract',
          revision: 'test',
          parameters: [],
        }),
      },
      mechanicAdapters: new MechanicAdapterRegistry([
        {
          family: 'contingencyContract',
          revision: 'test',
          compile: () => [{ kind: 'battleInitializationSequence', sequence: init }],
        },
      ]),
      resources: {
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecoveryPauseDuration: 1.5,
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
      },
    },
  });
}

it('真实伤害按各干员目标的生命上限结算，不写入敌人生命账本', () => {
  const result = run('buff_cc_chr_dmg_down_after_consume', [], 3, scenario => {
    scenario.tracks[1]!.operator!.level = 1;
    scenario.tracks[1]!.operator!.trustLevel = 0;
    scenario.tracks[1]!.operator!.promoted = false;
    scenario.tracks[0]!.skillCasts = [
      {
        id: 'self-damage',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0004_pelica_attack1',
        },
        placement: { startFrame: 1 },
        customDefinition: skillFixture({
          key: 'chr_0004_pelica_attack1',
          timelineBlockFrames: 1,
          scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'hit' } }],
          actionGraph: {
            main: {
              nodes: {
                hit: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      damageType: 'true',
                      target: { kind: 'characterTeam', excludeOwner: false },
                      calculation: 'attribute',
                      calculationAttribute: 'MaxHp',
                      attributeSource: 'target',
                      attackScale: 0.05,
                      tags: [],
                    },
                  },
                  next: null,
                },
              },
              dataNodes: {},
            },
            macros: {},
          },
        }),
      },
    ];
  });
  const hits = result.receiptEntries.filter(entry => entry.event === 'DamageApplied');
  expect(hits.map(entry => entry.targetId).sort()).toEqual(['op:0', 'op:1']);
  expect(hits.every(entry => entry.sourceId === 'op:0')).toBe(true);
  const owner = hits.find(entry => entry.targetId === 'op:0')!;
  const teammate = hits.find(entry => entry.targetId === 'op:1')!;
  expect(Number(owner.data?.baseDamage)).toBeGreaterThan(Number(teammate.data?.baseDamage));
  expect(Number(teammate.data?.baseDamage)).toBeGreaterThan(0);
});

it('长时间未重击会停止自然技力恢复，主控重击后恢复并重新计时', () => {
  const result = run('buff_cc_chr_no_lastcombo_stop_atb_recover', ['power_attack']);
  const recovery = result.receiptEntries.filter(
    e => e.event === 'SpChanged' && e.data?.source === 'autoRecovery',
  );
  expect(recovery.some(e => e.frame > 30 && e.frame < 300)).toBe(true);
  expect(recovery.some(e => e.frame > 390 && e.frame < 450)).toBe(false);
  expect(recovery.some(e => e.frame > 500 && e.frame < 700)).toBe(true);
  expect(recovery.some(e => e.frame > 850)).toBe(false);
});

it.each([
  ['buff_cc_chr_dmg_down_after_consume', 'early', true],
  ['buff_cc_chr_dmg_down_after_consume', 'absorbed', true],
  ['buff_cc_chr_dmg_down_after_consume_inflict', 'early', true],
  ['buff_cc_chr_dmg_down_after_consume_inflict', 'absorbed', false],
] as const)('%s 对 %s 的减伤触发与到期恢复', (root, reason, triggered) => {
  const result = run(root, [], 400, scenario => {
    const track = scenario.tracks[0]!;
    track.skillCasts = [
      {
        id: 'probe',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0004_pelica_attack1',
        },
        placement: { startFrame: 1 },
        customDefinition: skillFixture({
          key: 'chr_0004_pelica_attack1',
          timelineBlockFrames: 341,
          scheduledSequences: [
            { startFrame: 0, sequence: { $sequence: 'hit' } },
            { startFrame: 10, sequence: { $sequence: 'attach' } },
            { startFrame: 20, sequence: { $sequence: 'hit' } },
            { startFrame: 340, sequence: { $sequence: 'hit' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                hit: {
                  action: {
                    kind: 'dealDamage',
                    key: 'probe',
                    parameters: { damageType: 'physical', attackScale: 1, tags: ['normalAttack'] },
                  },
                  next: null,
                },
                attach: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'heat', isExtra: false },
                  },
                  next: 'finish',
                },
                finish: {
                  action: {
                    kind: 'finishBuffsByTag',
                    parameters: {
                      targets: { kind: 'fixed', target: 'enemy' },
                      finishSource: { kind: 'source' },
                      tagQueryType: 'hasAny',
                      buffTags: ['Skill/Character/Common/SpellInflict'],
                      reason,
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
  });
  const damage = result.receiptEntries.filter(e => e.event === 'DamageApplied');
  expect(damage).toHaveLength(3);
  expect(damage[1]!.data?.value).toBeCloseTo(
    Number(damage[0]!.data?.value) * (triggered ? 0.1 : 1),
    5,
  );
  expect(damage[2]!.data?.value).toBeCloseTo(Number(damage[0]!.data?.value), 5);
});

it.each([
  ['buff_cc_chr_combo_cd_up', 'combo_skill', 150],
  ['buff_cc_chr_normal_skill_cd', 'normal_skill', 300],
  ['buff_cc_chr_combo_cost_atb', 'normal_skill', 300],
] as const)('%s 将原生附加秒数计入实际冷却', (root, skill, addition) => {
  const baseline = run('buff_cc_chr_dmg_down_after_consume', [skill]);
  const modified = run(root, [skill]);
  const reserved = (result: ReturnType<typeof run>) =>
    result.receiptEntries.find(e => e.event === 'SkillCooldownReserved')?.data?.remainingFrames ??
    0;
  expect(reserved(modified)).toBe(Number(reserved(baseline)) + addition);
});

it('终结技后上限修正影响百分比回能，但不改写技能固定费用', () => {
  const simulate = (root: string) =>
    run(root, ['ultimate_skill'], 700, scenario => {
      scenario.tracks[0]!.skillCasts.push({
        id: 'energy-probe',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0004_pelica_attack1',
        },
        placement: { startFrame: 650 },
        customDefinition: skillFixture({
          key: 'chr_0004_pelica_attack1',
          timelineBlockFrames: 21,
          scheduledSequences: [
            { startFrame: 0, sequence: { $sequence: 'gain' } },
            { startFrame: 20, sequence: { $sequence: 'remove' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                remove: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'owner' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_cc_chr_ult_sp_cost_increase_instance'],
                      reason: 'other',
                    },
                  },
                  next: null,
                },
                gain: {
                  action: {
                    kind: 'changeResource',
                    parameters: {
                      resource: 'ultimateEnergy',
                      amount: 1,
                      isPercentValue: true,
                      ignoreUltimateEnergyGainMultiplier: true,
                      source: { kind: 'owner' },
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
      });
    });
  const baseline = simulate('buff_cc_chr_dmg_down_after_consume');
  const modified = simulate('buff_cc_chr_ult_sp_cost_increase');
  const changes = (result: ReturnType<typeof run>) =>
    result.receiptEntries.filter(e => e.event === 'UltimateEnergyChanged');
  const normal = changes(baseline);
  const adjusted = changes(modified);
  expect(adjusted.at(-1)?.frame).toBe(670);
  expect(adjusted.at(-1)?.data?.currentValue).toBe(normal.at(-1)?.data?.currentValue);
  expect(normal.length).toBeGreaterThan(0);
  expect(
    adjusted.filter(e => Number(e.data?.requestedValue) < 0).map(e => e.data?.requestedValue),
  ).toEqual(
    normal.filter(e => Number(e.data?.requestedValue) < 0).map(e => e.data?.requestedValue),
  );
  expect(adjusted.find(e => e.frame === 650)?.data?.requestedValue).toBeCloseTo(
    Number(normal.at(-1)?.data?.requestedValue) * 1.2,
    4,
  );
});

it('原生失衡上限增幅同步敌方账本，后续命中与曲线不中断', () => {
  const result = run('buff_cc_enemy_poise_up', ['normal_skill']);
  const change = result.receiptEntries.find(e => e.event === 'MaxPoiseChanged');
  expect(change).toBeDefined();
  expect(change?.data?.maxPoise).toBeCloseTo(Number(change?.data?.previousMaxPoise) * 1.15, 4);
  expect(change?.data?.currentPoise).toBeCloseTo(Number(change?.data?.previousPoise) * 1.15, 4);
  expect(change?.data?.maxPoise).toBeCloseTo(345, 4);
  const curve = projectPoiseCurveFromReceipt({ poise: 300, maxPoise: 300 }, result.receiptEntries);
  expect(curve.maxValue).toBeCloseTo(345, 4);
  expect(curve.maximumPoints?.at(-1)?.value).toBeCloseTo(345, 4);
});

it('计数盾同次施法多次命中只扣一次，新施法才消耗下一层', () => {
  const result = run('buff_cc_eny_numshield_instance', [], 120, scenario => {
    scenario.tracks[0]!.skillCasts = [1, 61].map((frame, index) => ({
      id: `shield-probe:${index}`,
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0004_pelica_attack1',
      },
      placement: { startFrame: frame },
      customDefinition: skillFixture({
        key: 'chr_0004_pelica_attack1',
        timelineBlockFrames: 21,
        scheduledSequences: [0, 10].map(startFrame => ({
          startFrame,
          sequence: { $sequence: 'hit' },
        })),
        actionGraph: {
          main: {
            nodes: {
              hit: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: 1,
                    tags: ['normalSkill'],
                  },
                },
                next: null,
              },
            },
          },
          macros: {},
        },
      }),
    }));
  });
  const damage = result.receiptEntries
    .filter(entry => entry.event === 'DamageApplied')
    .map(entry => Number(entry.data?.value));
  expect(damage).toHaveLength(4);
  expect(damage.slice(0, 3)).toEqual([0, 0, 0]);
  expect(damage[3]).toBeGreaterThan(0);
});

it('二期计数盾在持有期间阻止失衡伤害', () => {
  const baseline = run('buff_cc_enemy_poise_up', ['normal_skill']);
  expect(
    baseline.receiptEntries.some(
      entry => entry.event === 'PoiseApplied' && Number(entry.data?.calculatedDamage) > 0,
    ),
  ).toBe(true);
  const result = run('buff_cc02_eny_numshield', ['normal_skill']);
  expect(result.receiptEntries.some(entry => entry.event === 'DamageApplied')).toBe(true);
  expect(result.receiptEntries.filter(entry => entry.event === 'PoiseApplied')).toEqual([]);
});

it('未重击惩罚按八秒计时施加虚弱', () => {
  const result = run('buff_cc_chr_no_lastcombo_weak', [], 260);
  const created = result.receiptEntries.filter(
    entry =>
      entry.event === 'BuffCreated' && entry.data?.buffId === 'buff_cc_chr_no_lastcombo_weak_stack',
  );
  expect(created.length).toBeGreaterThan(0);
  for (const entry of created) expect(entry.time).toBeCloseTo(8, 1);
});

it('初始化施加的冻结 Buff 在切面恢复后仍随生命周期结束时间膨胀', () => {
  const result = run('buff_common_cryst_cryst_frozen_triggered_do', [], 240, undefined, 30);
  expect(result.receiptEntries.some(entry => entry.event === 'TimeDilationEnded')).toBe(true);
});
