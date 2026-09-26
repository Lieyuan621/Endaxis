import { describe, expect, it } from 'vitest';

import { ExplicitCriticalSampleSource } from '../../../core/combat/random/criticalSampleSource';
import { compileScenarioEquipment } from '../../../core/compiler/compileScenarioEquipment';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { ScenarioDocument, TrackDocument } from '../../../core/project/schema';
import { gearDefinitions } from '../../../data/equipment';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { generatedSkillSettings } from '../../../data/combat/skillSettings.generated';
import { perlica as perlicaGeneratedOperator } from '../../../data/operators/perlica.generated';
import { pogranichnik as pogranichnikGeneratedOperator } from '../../../data/operators/pogranichnik.generated';
import { liino } from '../../../data/operators/liino.generated';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { runStandardPlayerDamageScenarioSimulation } from '../runStandardPlayerDamageScenarioSimulation';

const CANONICAL_GEAR_SLUG = 'item_equip_t4_suit_burst01_edc_02';

describe('generated gear production integration', () => {
  it('pins the published gear and gear-set library to the game-data revision', async () => {
    const bySlug = <T extends { readonly slug: string }>(values: readonly T[]) =>
      [...values].sort((left, right) => left.slug.localeCompare(right.slug));
    const text = JSON.stringify({
      gears: bySlug(gameDataRepository.getGears()),
      gearSets: bySlug(gameDataRepository.getGearSets()),
    });
    const digest = new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)),
    );
    // 发布门禁：核对实际生成差异后更新内容指纹。
    expect([
      gameDataRepository.revision,
      Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join(''),
    ]).toEqual([
      generatedSkillSettings.revision,
      '7a857c98d98883a835e3f2f333314bc0e234a4cf475feee0653582a9c35dccc4',
    ]);
  });

  it('compiles every current native gear at its lowest and highest available artificing levels', () => {
    const current = gearDefinitions.filter(definition => definition.slug.startsWith('item_'));

    for (const definition of current) {
      for (const [tier, levels] of [
        ['minimum', definition.traits.map(() => 0)],
        ['maximum', definition.traits.map(trait => trait.levelCount - 1)],
      ] as const) {
        const identity = `${definition.slug}:${tier}`;
        const [compiled] = compileScenarioEquipment(
          createScenarioWithGear(definition.slug, definition.slotType, levels),
          gameDataRepository,
          gameDataRepository.actionPrograms,
        );
        expect(compiled?.contributions, identity).toHaveLength(definition.traits.length);
        for (const contribution of compiled?.contributions ?? []) {
          expect(contribution.source, identity).toMatchObject({
            kind: 'gearTrait',
            slug: definition.slug,
          });
          for (const modifier of contribution.modifiers) {
            expect(Number.isFinite(modifier.value), identity).toBe(true);
          }
        }
      }
    }
    expect(current).toHaveLength(258);
  });

  it('applies the selected native artificing level to damage', () => {
    const low = runWithGear(CANONICAL_GEAR_SLUG, 0);
    const high = runWithGear(CANONICAL_GEAR_SLUG, 3);

    expect(high.finalEnemyHealth).toBeLessThan(low.finalEnemyHealth);
    expect(gameDataRepository.getGear(CANONICAL_GEAR_SLUG)).toMatchObject({
      slug: CANONICAL_GEAR_SLUG,
      traits: [
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          modifiers: [
            expect.objectContaining({
              kind: 'damageScale',
              target: 'normalAttack',
              value: [0.27599999999999997, 0.3036, 0.33119999999999994, 0.35879999999999995],
            }),
          ],
        }),
      ],
    });
  });

  it.each([false, true])(
    'refunds SP only for a real battle skill, with Liino termination=%s',
    withTermination => {
      const operator = withTermination ? liino : pogranichnikGeneratedOperator;
      const endFrame = withTermination ? 650 : 300;
      const scenario = createEmptyScenario('scenario:ultimate-set', '终结技能量套生产回归');
      scenario.battle.durationFrames = endFrame;
      scenario.battle.resourceRules.maxSp = 400;
      scenario.battle.resourceRules.initialSp = 200;
      scenario.enemy.editable.hp = 10_000_000;
      scenario.tracks[0] = {
        id: 'track:pogranichnik-ultimate-set',
        operator: {
          operatorSlug: operator.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: 0, 1: 0 },
        },
        weapon: withTermination
          ? {
              weaponSlug: 'wpn_lance_0011',
              level: 90,
              tuned: true,
              potential: 5,
              traitLevels: [8, 8, 8],
            }
          : null,
        gears: {
          armor: {
            gearSlug: 'item_equip_t3_suit_usp01_body_01',
            artificingLevels: [0, 0, 0],
          },
          gloves: {
            gearSlug: 'item_equip_t3_suit_usp01_hand_01',
            artificingLevels: [0, 0, 0],
          },
          accessory1: {
            gearSlug: 'item_equip_t3_suit_usp01_edc_03',
            artificingLevels: [0, 0, 0],
          },
          accessory2: null,
        },
        initialState: { ultimateEnergy: withTermination ? 160 : 0 },
        skillCasts: [],
      };
      let placed = scenario;
      let nextId = 0;
      const placements = withTermination
        ? [
            { skillGroupKey: 'ultimate', startFrame: 1 },
            {
              skillGroupKey: 'battleSkill',
              skillKey: 'chr_0035_liino_normal_skill_end',
              startFrame: 180,
            },
            { skillGroupKey: 'battleSkill', startFrame: 300 },
            { skillGroupKey: 'battleSkill', startFrame: 540 },
          ]
        : [1, 181].map(startFrame => ({ skillGroupKey: 'battleSkill', startFrame }));
      for (const placement of placements) {
        placed = placeSkillGroup({
          scenario: placed,
          trackIndex: 0,
          operator,
          ...placement,
          ids: { allocate: kind => `${kind}:ultimate-set:${++nextId}` },
        }).scenario;
      }

      const result = runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            ultimateEnergySystemUnlocked: true,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          },
        },
        endFrame,
        criticalSamples: new ExplicitCriticalSampleSource(Array.from({ length: 200 }, () => 1)),
        elementalInflictionDocument: elementalAttachments,
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
      });

      expect(
        result.receiptEntries.filter(
          entry =>
            entry.event === 'SpChanged' &&
            entry.data?.gainKind === 'refund' &&
            entry.data?.baseValue === 50,
        ),
      ).toHaveLength(1);
      if (withTermination) {
        const refunds = result.receiptEntries.filter(
          entry =>
            entry.event === 'SpChanged' &&
            entry.data?.gainKind === 'refund' &&
            entry.data?.baseValue === 50,
        );
        expect(refunds[0]?.frame).toBe(300);
        const weaponProcFrames = result.receiptEntries
          .filter(
            entry =>
              entry.event === 'BuffApplied' &&
              entry.data?.buffId === 'buff_wpn_lance_0011_normal_magic_up',
          )
          .map(entry => entry.frame);
        expect(weaponProcFrames[0]).toBe(300);
        expect(weaponProcFrames).toContain(540);
        expect(weaponProcFrames).not.toContain(180);
        expect(result.receiptEntries).toContainEqual(
          expect.objectContaining({
            event: 'SkillTimelineJumped',
            frame: 180,
            data: expect.objectContaining({ destinationFrame: 540 }),
          }),
        );
      }
    },
  );

  it('runs the physical-status set proc once while its 15-second marker is active', () => {
    const scenario = createEmptyScenario('scenario:physical-set', '物理异常套装生产回归');
    scenario.battle.durationFrames = 260;
    scenario.battle.resourceRules.maxSp = 400;
    scenario.battle.resourceRules.initialSp = 400;
    scenario.enemy.editable.hp = 10_000_000;
    scenario.tracks[0] = {
      id: 'track:pogranichnik',
      operator: {
        operatorSlug: pogranichnikGeneratedOperator.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 0, 1: 0 },
      },
      weapon: null,
      gears: {
        armor: {
          gearSlug: 'item_equip_t4_suit_phy01_body_01',
          artificingLevels: [0, 0, 0],
        },
        gloves: {
          gearSlug: 'item_equip_t4_suit_phy01_hand_01',
          artificingLevels: [0, 0, 0],
        },
        accessory1: {
          gearSlug: 'item_equip_t4_suit_phy01_edc_01',
          artificingLevels: [0, 0],
        },
        accessory2: null,
      },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    let placed = scenario;
    let nextId = 0;
    for (const startFrame of [1, 61, 121, 181]) {
      placed = placeSkillGroup({
        scenario: placed,
        trackIndex: 0,
        operator: pogranichnikGeneratedOperator,
        skillGroupKey: 'battleSkill',
        startFrame,
        ids: { allocate: kind => `${kind}:physical-set:${++nextId}` },
      }).scenario;
    }

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
      },
      endFrame: 260,
      criticalSamples: new ExplicitCriticalSampleSource(Array.from({ length: 40 }, () => 1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
    });
    const setProcDamage = result.receiptEntries.filter(
      entry =>
        entry.event === 'DamageApplied' &&
        entry.data?.castId === 'upgrade-initialization:gear-set:suit_phy01',
    );
    expect(setProcDamage).toHaveLength(1);
    expect(setProcDamage[0]).toMatchObject({
      sourceId: 'track:pogranichnik',
      targetId: 'enemy',
      data: { damageType: 'physical', skillMultiplierPercent: 250 },
    });
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'PoiseApplied',
        sourceId: 'track:pogranichnik',
        targetId: 'enemy',
        data: expect.objectContaining({ calculationValue: 10 }),
      }),
    );
  });

  it('applies the generated fracture/crush set Buff during a physical infliction chain', () => {
    const scenario = createEmptyScenario('scenario:crush-fracture-set', '碎甲猛击套生产回归');
    scenario.battle.durationFrames = 260;
    scenario.battle.resourceRules.maxSp = 400;
    scenario.battle.resourceRules.initialSp = 400;
    scenario.enemy.editable.hp = 10_000_000;
    scenario.tracks[0] = {
      id: 'track:pogranichnik',
      operator: {
        operatorSlug: pogranichnikGeneratedOperator.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 0, 1: 0 },
      },
      weapon: null,
      gears: {
        armor: {
          gearSlug: 'item_equip_t4_suit_crush_fracture_body_01',
          artificingLevels: [0, 0, 0],
        },
        gloves: {
          gearSlug: 'item_equip_t4_suit_crush_fracture_hand_01',
          artificingLevels: [0, 0, 0],
        },
        accessory1: {
          gearSlug: 'item_equip_t4_suit_crush_fracture_edc_01',
          artificingLevels: [0, 0, 0],
        },
        accessory2: null,
      },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    let placed = scenario;
    let nextId = 0;
    for (const startFrame of [1, 61, 121, 181]) {
      placed = placeSkillGroup({
        scenario: placed,
        trackIndex: 0,
        operator: pogranichnikGeneratedOperator,
        skillGroupKey: 'battleSkill',
        startFrame,
        ids: { allocate: kind => `${kind}:crush-fracture-set:${++nextId}` },
      }).scenario;
    }

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
      },
      endFrame: 260,
      criticalSamples: new ExplicitCriticalSampleSource(Array.from({ length: 40 }, () => 1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'BuffApplied',
        sourceId: 'track:pogranichnik',
        targetId: 'track:pogranichnik',
        data: expect.objectContaining({
          buffId: 'buff_equipsuit_crush_fracture_physicdamage',
          sourceActionId: expect.stringContaining('gear-set:'),
        }),
      }),
    );
  });
});

function runWithGear(gearSlug: string, damageTraitLevel: number) {
  const scenario = createScenarioWithGear(gearSlug, 'accessory', [0, 0, damageTraitLevel]);
  let nextCastId = 0;
  const placed = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: perlicaGeneratedOperator,
    skillGroupKey: 'basicAttack',
    startFrame: 1,
    ids: { allocate: (kind: string) => `${kind}:generated-gear:${++nextCastId}` },
  }).scenario;

  return runStandardPlayerDamageScenarioSimulation({
    scenario: placed,
    options: {
      index: gameDataRepository,
      resources: {
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecoveryPauseDuration: 1.5,
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
      },
    },
    endFrame: 100,
    criticalSamples: new ExplicitCriticalSampleSource(Array.from({ length: 20 }, () => 1)),
    resolveNonRandomRuntimeSnapshot: () => ({
      runtimeExtensionMultiplier: 1,
      appliesIgniteDamageMultiplier: false,
      appliesPhysicalInflictionDamageMultiplier: false,
    }),
  });
}

function createScenarioWithGear(
  gearSlug: string,
  slotType: 'armor' | 'gloves' | 'accessory',
  artificingLevels: readonly number[],
): ScenarioDocument {
  const scenario = createEmptyScenario('scenario:generated-gear', '生成装备生产回归');
  const gears: TrackDocument['gears'] = {
    armor: null,
    gloves: null,
    accessory1: null,
    accessory2: null,
  };
  const slot = slotType === 'accessory' ? 'accessory1' : slotType;
  gears[slot] = { gearSlug, artificingLevels: [...artificingLevels] };
  scenario.tracks[0] = {
    id: 'track:0',
    operator: {
      operatorSlug: perlicaGeneratedOperator.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: null,
    gears,
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  return scenario;
}
