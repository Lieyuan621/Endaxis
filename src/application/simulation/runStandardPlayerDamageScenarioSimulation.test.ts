import { describe, expect, it } from 'vitest';
import { ExplicitCriticalSampleSource } from '../../core/combat/random/criticalSampleSource';
import { createEmptyScenario } from '../../core/project/createProject';
import { perlica, perlica as perlicaFormalOperator } from '../../data/operators/perlica.generated';
import perlicaGeneratedOperator from '../../data/operators/perlica.generated';
import { arclight as arclightGeneratedOperator } from '../../data/operators/arclight.generated';
import { lifeng as lifengGeneratedOperator } from '../../data/operators/lifeng.generated';
import { endministrator as endministratorGeneratedOperator } from '../../data/operators/endministrator.generated';
import { lastRite as lastRiteGeneratedOperator } from '../../data/operators/last-rite.generated';
import { tangtang as tangtangGeneratedOperator } from '../../data/operators/tangtang.generated';
import { gilberta as gilbertaGeneratedOperator } from '../../data/operators/gilberta.generated';
import { rossi as rossiGeneratedOperator } from '../../data/operators/rossi.generated';
import { camille as camilleGeneratedOperator } from '../../data/operators/camille.generated';
import { chenQianyu as chenQianyuGeneratedOperator } from '../../data/operators/chen-qianyu.generated';
import { estella as estellaGeneratedOperator } from '../../data/operators/estella.generated';
import { getSkill } from '../../data/operators/testUtils';
import { mifu as mifuGeneratedOperator } from '../../data/operators/mifu.generated';
import { akekuri } from '../../data/operators/akekuri.generated';
import { commonBuffDefinitions } from '../../data/buffs/commonDefinitions';
import { elementalAttachments } from '../../data/buffs/elementalAttachments';
import { scheduled, sequence, step, branch } from '../../data/operators/definitionHelpers';
import { placeSkillGroup } from '../../ui/timeline/interaction/placeSkillGroup';
import { StandardPlayerDamageCompatibilityError } from '../../core/combat/runtime/standardPlayerDamageCompatibility';
import { runStandardPlayerDamageScenarioSimulation } from './runStandardPlayerDamageScenarioSimulation';
import type { OperatorDefinition } from '../../core/game-data/operatorDefinition';

const estellaBattleSkill = getSkill(estellaGeneratedOperator, 'chr_0021_whiten_normal_skill');
import { MechanicAdapterRegistry } from '../../core/mechanics/mechanicCompiler';
import { projectBuffTimelineViz } from '../../core/projection/buffTimelineViz';
import { findBuffDamageSegment } from '../../ui/timeline/results/enemyBuffDamageHits';
import { projectTimelineHitOccurrences } from '../../ui/timeline/results/timelineHitEffects';
import { gameDataRepository } from '../../data/gameDataRepository';
import {
  CONTINGENCY_CONTRACT_MECHANIC_PREFIX,
  contingencyContractMechanicAdapter,
} from '../../data/mechanics/contingencyContractAdapter';

function createPerlicaScenario() {
  const scenario = createEmptyScenario('scenario:standard-damage', '标准伤害样本');

  scenario.tracks[0] = {
    id: 'track:0',
    operator: {
      operatorSlug: perlica.slug,
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
    skillCasts: [],
  };
  return scenario;
}

function standardOptions() {
  return {
    index: {
      getOperator: (slug: string) => (slug === perlica.slug ? perlica : null),
      getWeapon: () => null,
      getGear: () => null,
      getGearSet: () => null,
    },
    resources: {
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecoveryPauseDuration: 1.5,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
    },
  };
}

describe('标准入口普通倒地装配', () => {
  function fixture(observeGetUp = false) {
    const definition: OperatorDefinition = {
      ...perlica,
      talents: [],
      potentials: [],
      buffDefinitions: {
        buff_physical_no_guard: { stackingType: 'refresh', durationSeconds: 2 },
        buff_physical_knockdown: { stackingType: 'refresh', durationSeconds: 2 },
      },
      skillGroups: [
        ...perlica.skillGroups.filter(group => group.key !== 'battleSkill'),
        {
          key: 'battleSkill',
          skillType: 'battleSkill',
          levelSource: 'battleSkill',
          skills: {
            key: 'battleSkill',
            skillType: 'battleSkill',
            levelSource: 'battleSkill',
            timelineBlockFrames: 1,
            scheduledSequences: [
              scheduled(
                0,
                sequence(
                  ...Array.from({ length: 2 }, () =>
                    step('applyKnockDown', {
                      target: 'enemy',
                      duration: { kind: 'constant', value: 0.1 },
                      force: false,
                      isExtra: false,
                      targetFilter: 'aliveOnly',
                      returnWhen: 'always',
                    }),
                  ),
                  ...(observeGetUp
                    ? [
                        branch(
                          {
                            kind: 'entityTagMatch',
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            tags: ['Status/Immobilized/Getup'],
                          },
                          sequence(),
                        ),
                      ]
                    : []),
                ),
              ),
            ],
          },
        },
      ],
    };
    const scenario = placeSkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator: definition,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:down` },
    }).scenario;
    const options = standardOptions();
    return () =>
      runStandardPlayerDamageScenarioSimulation({
        scenario,
        endFrame: 15,
        criticalSamples: {
          nextCriticalSample: () => {
            throw new Error('控制夹具不应抽伤害样本');
          },
        },
        resolveNonRandomRuntimeSnapshot: () => {
          throw new Error('控制夹具不应结算伤害');
        },
        options: { ...options, index: { ...options.index, getOperator: () => definition } },
      });
  }
  it('经项目编译、标准预检与正式入口执行首次破防和再次倒地', () => {
    const result = fixture()();
    expect(
      result.receiptEntries.filter(entry => entry.event === 'PhysicalNoGuardApplied'),
    ).toHaveLength(1);
    expect(
      result.receiptEntries.filter(entry => entry.event === 'PhysicalInflictionApplied'),
    ).toHaveLength(1);
  });
  it('正式入口拒绝需要敌方起身状态的场景，不先执行控制', () => {
    expect(fixture(true)).toThrow('cannot omit get-up');
  });
});

function placeGeneratedPerlicaFlow(operator: OperatorDefinition = perlicaGeneratedOperator) {
  const scenario = createPerlicaScenario();
  scenario.enemy.editable.stagger = {
    ...scenario.enemy.editable.stagger,
    maximum: 30,
    finisherSpRecovery: 80,
  };
  scenario.tracks[0] = {
    ...scenario.tracks[0]!,
    initialState: { ultimateEnergy: 80 },
  };
  let nextId = 0;
  const ids = { allocate: (kind: string) => `${kind}:${++nextId}` };
  const placements = [
    { skillGroupKey: 'basicAttack', startFrame: 1 },
    { skillGroupKey: 'comboSkill', startFrame: 106 },
    { skillGroupKey: 'battleSkill', startFrame: 132 },
    { skillGroupKey: 'ultimate', startFrame: 161 },
    { skillGroupKey: 'plungingAttack', startFrame: 225 },
    { skillGroupKey: 'finisher', startFrame: 247 },
  ] as const;

  return placements.reduce(
    (current, placement) =>
      placeSkillGroup({
        scenario: current,
        trackIndex: 0,
        operator,
        ...placement,
        ids,
      }).scenario,
    scenario,
  );
}

function createGeneratedTeamScenario() {
  const scenario = createEmptyScenario('scenario:generated-team', '自动生成干员组队样本');
  scenario.battle.resourceRules = {
    ...scenario.battle.resourceRules,
    initialSp: 100,
    spRecoveryPerSecond: 0,
  };
  const build = (operatorSlug: string) => ({
    operatorSlug,
    level: 90,
    promoted: true,
    potential: 0,
    trustLevel: 4,
    skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
    talentStates: {},
  });
  scenario.tracks[0] = {
    id: 'track:0',
    operator: build(arclightGeneratedOperator.slug),
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  scenario.tracks[1] = {
    id: 'track:1',
    operator: build(perlicaGeneratedOperator.slug),
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 80 },
    skillCasts: [],
  };

  let nextId = 0;
  const ids = { allocate: (kind: string) => `${kind}:${++nextId}` };
  const placements = [
    {
      trackIndex: 0,
      operator: arclightGeneratedOperator,
      skillGroupKey: 'basicAttack',
      skillKey: 'chr_0007_ikut_attack5',
      startFrame: 1,
    },
    {
      trackIndex: 1,
      operator: perlicaGeneratedOperator,
      skillGroupKey: 'comboSkill',
      startFrame: 20,
    },
    {
      trackIndex: 1,
      operator: perlicaGeneratedOperator,
      skillGroupKey: 'battleSkill',
      startFrame: 40,
    },
    {
      trackIndex: 1,
      operator: perlicaGeneratedOperator,
      skillGroupKey: 'ultimate',
      startFrame: 180,
    },
    {
      trackIndex: 1,
      operator: perlicaGeneratedOperator,
      skillGroupKey: 'ultimate',
      startFrame: 260,
    },
  ] as const;
  return placements.reduce(
    (current, placement) => placeSkillGroup({ scenario: current, ids, ...placement }).scenario,
    scenario,
  );
}

function createGeneratedAkekuriComboImbueScenario(
  talentEnabled: boolean,
  potential: number,
  battleSkillStartFrame = 60,
) {
  const scenario = createEmptyScenario(
    `scenario:akekuri-combo-imbue-${talentEnabled ? 'on' : 'off'}-p${potential}`,
    '弭弗连击增伤样本',
  );
  scenario.battle.resourceRules = {
    ...scenario.battle.resourceRules,
    initialSp: 300,
    spRecoveryPerSecond: 0,
  };
  const build = (operatorSlug: string, talentStates: Record<number, number>) => ({
    operatorSlug,
    level: 90,
    promoted: true,
    potential: operatorSlug === akekuri.slug ? potential : 0,
    trustLevel: 4,
    skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
    talentStates,
  });
  scenario.tracks[0] = {
    id: 'track:akekuri',
    operator: build(akekuri.slug, talentEnabled ? { 1: 1 } : {}),
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 80 },
    skillCasts: [],
  };
  scenario.tracks[1] = {
    id: 'track:perlica-imbue',
    operator: build(perlicaGeneratedOperator.slug, {}),
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  let nextId = 0;
  const ids = { allocate: (kind: string) => `${kind}:akekuri:${++nextId}` };
  const withUltimate = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: akekuri,
    skillGroupKey: 'ultimate',
    startFrame: 1,
    ids,
  }).scenario;
  return placeSkillGroup({
    scenario: withUltimate,
    trackIndex: 1,
    operator: perlicaGeneratedOperator,
    skillGroupKey: 'battleSkill',
    startFrame: battleSkillStartFrame,
    ids,
  }).scenario;
}

function createGeneratedArclightBattleSkillScenario() {
  const scenario = createEmptyScenario('scenario:generated-arclight-battle-skill', '弧光战技样本');
  scenario.battle.resourceRules = {
    ...scenario.battle.resourceRules,
    initialSp: 100,
    spRecoveryPerSecond: 0,
  };
  scenario.tracks[0] = {
    id: 'track:sample:arclight',
    operator: {
      operatorSlug: arclightGeneratedOperator.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: { 0: 1 },
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  return placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: arclightGeneratedOperator,
    skillGroupKey: 'battleSkill',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:1` },
  }).scenario;
}

function createGeneratedArclightUltimateScenario() {
  const scenario = createEmptyScenario('scenario:generated-arclight-ultimate', '弧光终结技样本');
  scenario.tracks[0] = {
    id: 'track:sample:arclight',
    operator: {
      operatorSlug: arclightGeneratedOperator.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 90 },
    skillCasts: [],
  };
  return placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: arclightGeneratedOperator,
    skillGroupKey: 'ultimate',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:1` },
  }).scenario;
}

function createGeneratedLifengScenario(talentLevel: number) {
  const scenario = createEmptyScenario('scenario:lifeng-talent', '莱锋常驻天赋样本');
  scenario.tracks[0] = {
    id: 'track:0',
    operator: {
      operatorSlug: lifengGeneratedOperator.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 1, battleSkill: 1, comboSkill: 1, ultimate: 1 },
      talentStates: { 0: talentLevel },
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  return placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: lifengGeneratedOperator,
    skillGroupKey: 'plungingAttack',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:1` },
  }).scenario;
}

function createGeneratedLifengKnockDownScenario() {
  const scenario = createEmptyScenario('scenario:lifeng-knockdown', '黎风击倒天赋与潜能样本');
  scenario.tracks[0] = {
    id: 'track:lifeng-knockdown',
    operator: {
      operatorSlug: lifengGeneratedOperator.slug,
      level: 90,
      promoted: true,
      potential: 5,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: { 1: 2 },
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  const first = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: lifengGeneratedOperator,
    skillGroupKey: 'battleSkill',
    startFrame: 451,
    ids: { allocate: kind => `${kind}:1` },
  }).scenario;
  return placeSkillGroup({
    scenario: first,
    trackIndex: 0,
    operator: lifengGeneratedOperator,
    skillGroupKey: 'battleSkill',
    startFrame: 850,
    ids: { allocate: kind => `${kind}:2` },
  }).scenario;
}

function createGeneratedEndministratorIgniteScenario(talent1Level?: 1 | 2) {
  const scenario = createEmptyScenario('scenario:endministrator-ignite', '管理员冻结点燃样本');
  scenario.battle.resourceRules = {
    ...scenario.battle.resourceRules,
    initialSp: 0,
    spRecoveryPerSecond: 0,
  };
  scenario.tracks[0] = {
    id: 'track:endministrator',
    operator: {
      operatorSlug: endministratorGeneratedOperator.slug,
      level: 90,
      promoted: true,
      potential: 3,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: talent1Level === undefined ? {} : { 0: talent1Level },
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 80 },
    skillCasts: [],
  };
  let nextId = 0;
  const ids = { allocate: (kind: string) => `${kind}:${++nextId}` };
  const withFrozen = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: endministratorGeneratedOperator,
    skillGroupKey: 'comboSkill',
    skillKey: 'chr_0003_endminf_combo_skill',
    startFrame: 1,
    ids,
  }).scenario;
  const withUltimate = placeSkillGroup({
    scenario: withFrozen,
    trackIndex: 0,
    operator: endministratorGeneratedOperator,
    skillGroupKey: 'ultimate',
    skillKey: 'chr_0003_endminf_ultimate_skill',
    startFrame: 80,
    ids,
  }).scenario;
  if (talent1Level === undefined) return withUltimate;
  return placeSkillGroup({
    scenario: withUltimate,
    trackIndex: 0,
    operator: endministratorGeneratedOperator,
    skillGroupKey: 'basicAttack',
    startFrame: 170,
    ids,
  }).scenario;
}

function createGeneratedLastRitePartyBuffScenario() {
  const scenario = createEmptyScenario('scenario:last-rite-party-buff', '余烬队伍 Buff 样本');
  scenario.battle.resourceRules = {
    ...scenario.battle.resourceRules,
    initialSp: 100,
    spRecoveryPerSecond: 0,
  };
  const build = () => ({
    operatorSlug: lastRiteGeneratedOperator.slug,
    level: 90,
    promoted: true,
    potential: 0,
    trustLevel: 4,
    skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
    talentStates: {},
  });
  scenario.tracks[0] = {
    id: 'track:last-rite-source',
    operator: build(),
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  scenario.tracks[1] = {
    id: 'track:last-rite-ally',
    operator: build(),
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  scenario.battle.controlSwitches.push({ id: 'switch:last-rite-ally', frame: 35, trackIndex: 1 });
  let nextId = 0;
  const ids = { allocate: (kind: string) => `${kind}:${++nextId}` };
  const withBuff = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: lastRiteGeneratedOperator,
    skillGroupKey: 'battleSkill',
    startFrame: 1,
    ids,
  }).scenario;
  return placeSkillGroup({
    scenario: withBuff,
    trackIndex: 1,
    operator: lastRiteGeneratedOperator,
    skillGroupKey: 'basicAttack',
    skillKey: 'chr_0026_lastrite_attack4',
    startFrame: 40,
    ids,
  }).scenario;
}

function createGeneratedTangtangComboScenario() {
  const scenario = createEmptyScenario('scenario:generated-tangtang', '唐棠连携水体样本');
  scenario.tracks[0] = {
    id: 'track:tangtang',
    operator: {
      operatorSlug: tangtangGeneratedOperator.slug,
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
    skillCasts: [],
  };
  return placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: tangtangGeneratedOperator,
    skillGroupKey: 'comboSkill',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:tangtang` },
  }).scenario;
}

function createGeneratedTangtangBattleScenario(potential: number) {
  const scenario = createEmptyScenario(
    `scenario:generated-tangtang-p${potential}`,
    '唐棠战技潜能样本',
  );
  scenario.battle.resourceRules = {
    ...scenario.battle.resourceRules,
    initialSp: 300,
    spRecoveryPerSecond: 0,
  };
  scenario.tracks[0] = {
    id: 'track:tangtang',
    operator: {
      operatorSlug: tangtangGeneratedOperator.slug,
      level: 90,
      promoted: true,
      potential,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  return placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: tangtangGeneratedOperator,
    skillGroupKey: 'battleSkill',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:tangtang:p${potential}` },
  }).scenario;
}

function createGeneratedTangtangUltimateResponseScenario(includeAllyPlungingAttack: boolean) {
  const scenario = createEmptyScenario(
    `scenario:generated-tangtang-ultimate-response-${includeAllyPlungingAttack}`,
    '汤汤终结技队友下落攻击响应样本',
  );
  const build = (operatorSlug: string, ultimateEnergy: number) => ({
    operator: {
      operatorSlug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy },
    skillCasts: [],
  });
  scenario.tracks[0] = {
    id: 'track:tangtang',
    ...build(tangtangGeneratedOperator.slug, 90),
  };
  scenario.tracks[1] = {
    id: 'track:perlica',
    ...build(perlicaGeneratedOperator.slug, 0),
  };

  let nextId = 0;
  const ids = { allocate: (kind: string) => `${kind}:tangtang-ultimate:${++nextId}` };
  const withUltimate = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: tangtangGeneratedOperator,
    skillGroupKey: 'ultimate',
    startFrame: 1,
    ids,
  }).scenario;
  if (!includeAllyPlungingAttack) return withUltimate;

  // 终结技水体在全局约第 198 帧向队友施加响应 Buff。佩丽卡下落攻击
  // 在起手后第 3 帧命中，因此从 197 帧放置可让命中落在监听窗口内。
  withUltimate.battle.controlSwitches.push({
    id: 'switch:tangtang-ultimate:perlica',
    frame: 190,
    trackIndex: 1,
  });
  return placeSkillGroup({
    scenario: withUltimate,
    trackIndex: 1,
    operator: perlicaGeneratedOperator,
    skillGroupKey: 'plungingAttack',
    startFrame: 197,
    ids,
  }).scenario;
}

function createGeneratedGilbertaBattleScenario(talentLevel: 0 | 2, potential: number) {
  const scenario = createEmptyScenario(
    `scenario:generated-gilberta-t${talentLevel}-p${potential}`,
    '吉尔伯塔回能天赋样本',
  );
  scenario.battle.resourceRules = {
    ...scenario.battle.resourceRules,
    initialSp: 300,
    spRecoveryPerSecond: 0,
  };
  scenario.tracks[0] = {
    id: 'track:gilberta',
    operator: {
      operatorSlug: gilbertaGeneratedOperator.slug,
      level: 90,
      promoted: true,
      potential,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: talentLevel === 0 ? {} : { 0: talentLevel },
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  return placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: gilbertaGeneratedOperator,
    skillGroupKey: 'battleSkill',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:gilberta:t${talentLevel}:p${potential}` },
  }).scenario;
}

function createGeneratedMifuProtectionScenario() {
  const scenario = createEmptyScenario('scenario:generated-mifu', '弭弗护盾与战技换槽样本');
  scenario.battle.durationFrames = 240;
  scenario.battle.resourceRules = {
    ...scenario.battle.resourceRules,
    initialSp: 300,
    spRecoveryPerSecond: 0,
  };
  scenario.tracks[0] = {
    id: 'track:mifu',
    operator: {
      operatorSlug: mifuGeneratedOperator.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: { 1: 1 },
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 80 },
    skillCasts: [],
  };
  let nextId = 0;
  const ids = { allocate: (kind: string) => `${kind}:mifu:${++nextId}` };
  const combo = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: mifuGeneratedOperator,
    skillGroupKey: 'comboSkill',
    startFrame: 1,
    ids,
  }).scenario;
  const ultimate = placeSkillGroup({
    scenario: combo,
    trackIndex: 0,
    operator: mifuGeneratedOperator,
    skillGroupKey: 'ultimate',
    startFrame: 40,
    ids,
  }).scenario;
  return placeSkillGroup({
    scenario: ultimate,
    trackIndex: 0,
    operator: mifuGeneratedOperator,
    skillGroupKey: 'battleSkill',
    skillKey: 'chr_0031_mifu_normalskill_2',
    startFrame: 160,
    ids,
  }).scenario;
}

function createGeneratedMifuBattleChainScenario() {
  const scenario = createEmptyScenario('scenario:generated-mifu-chain', '弭弗三段战技样本');
  scenario.battle.durationFrames = 300;
  scenario.battle.resourceRules = {
    ...scenario.battle.resourceRules,
    initialSp: 300,
    spRecoveryPerSecond: 0,
  };
  const battleGroup = mifuGeneratedOperator.skillGroups.find(group => group.key === 'battleSkill')!;
  const baseSkill = Array.isArray(battleGroup.skills) ? battleGroup.skills[0]! : battleGroup.skills;
  // 原生第二段只在结算前读到至少三层 NoGuard 时换入第三段。测试前置只建立这项
  // 敌方状态，不改弭弗三段技能、换槽 Buff 或伤害定义本身。
  const battleChainOperator: OperatorDefinition = {
    ...mifuGeneratedOperator,
    skillGroups: mifuGeneratedOperator.skillGroups.map(group =>
      group !== battleGroup
        ? group
        : {
            ...group,
            skills: {
              ...baseSkill,
              scheduledSequences: [
                scheduled(
                  0,
                  sequence(
                    ...Array.from({ length: 3 }, () =>
                      step('applyBuff', {
                        buffId: 'buff_physical_no_guard',
                        target: 'enemy',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  ),
                ),
                ...baseSkill.scheduledSequences,
              ],
            },
          },
    ),
  };
  scenario.tracks[0] = {
    id: 'track:mifu-chain',
    operator: {
      operatorSlug: mifuGeneratedOperator.slug,
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
    skillCasts: [],
  };
  let nextId = 0;
  const ids = { allocate: (kind: string) => `${kind}:mifu-chain:${++nextId}` };
  let placed = scenario;
  for (const [skillKey, startFrame] of [
    ['chr_0031_mifu_normalskill_1', 1],
    ['chr_0031_mifu_normalskill_2', 40],
    ['chr_0031_mifu_normalskill_3', 120],
  ] as const) {
    placed = placeSkillGroup({
      scenario: placed,
      trackIndex: 0,
      operator: battleChainOperator,
      skillGroupKey: 'battleSkill',
      skillKey,
      startFrame,
      ids,
    }).scenario;
  }
  return { scenario: placed, operator: battleChainOperator };
}

function runGeneratedLifengScenario(talentLevel: number) {
  return runStandardPlayerDamageScenarioSimulation({
    scenario: createGeneratedLifengScenario(talentLevel),
    endFrame: 60,
    criticalSamples: new ExplicitCriticalSampleSource([1, 1]),
    resolveNonRandomRuntimeSnapshot: () => ({
      runtimeExtensionMultiplier: 1,
      appliesIgniteDamageMultiplier: false,
      appliesPhysicalInflictionDamageMultiplier: false,
    }),
    options: {
      ...standardOptions(),
      index: {
        getOperator: slug =>
          slug === lifengGeneratedOperator.slug ? lifengGeneratedOperator : null,
        getWeapon: () => null,
        getGear: () => null,
        getGearSet: () => null,
        getCommonBuffDefinitions: () => commonBuffDefinitions,
      },
    },
  });
}

describe('runStandardPlayerDamageScenarioSimulation', () => {
  it('uses the generated common dash listener for a complete perfect-dodge flow', () => {
    const scenario = createPerlicaScenario();
    scenario.battle.resourceRules = {
      ...scenario.battle.resourceRules,
      initialSp: 0,
      spRecoveryPerSecond: 0,
    };
    scenario.battle.dodgeMarkers = [
      {
        id: 'dodge:generated-perfect',
        frame: 1,
        trackIndex: 0,
        direction: 'forward',
        mode: { kind: 'perfectDodge', successDelayFrames: 0 },
      },
    ];

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario,
      endFrame: 3,
      criticalSamples: {
        nextCriticalSample: () => {
          throw new Error('perfect dodge must not draw a damage critical sample');
        },
      },
      resolveNonRandomRuntimeSnapshot: () => {
        throw new Error('perfect dodge must not resolve a damage snapshot');
      },
      options: {
        ...standardOptions(),
        index: {
          ...standardOptions().index,
          getCommonBuffDefinitions: () => commonBuffDefinitions,
        },
      },
    });

    const events = result.receiptEntries.map(entry => entry.event);
    expect(events).toEqual(
      expect.arrayContaining([
        'DashInputExecuted',
        'PerfectDodgeDeclared',
        'PerfectDodgeSucceeded',
        'DashEnergyChanged',
        'SkillStarted',
      ]),
    );
    expect(result.finalResources.sp).toBe(7);
    expect(result.finalResources.dashEnergy).toMatchObject({
      spent: 0.5,
      capacity: null,
      inOverdraft: false,
    });
  });

  it('refunds Estella talent SP after she outputs the native shatter buff', () => {
    const run = (talentLevel: 1 | 2) => {
      // The damage half of Estella's battle skill independently reads the still-unresolved
      // CharacterTemplateData key EntityBB_first_hit. Keep the exact generated talent-consume
      // sequence and feed it the native shatter Buff identity through Estella's own output event;
      // this avoids inventing an entity-blackboard initializer or changing event ownership.
      const refundSequence = estellaBattleSkill.scheduledSequences.find(
        scheduledSequence =>
          scheduledSequence.startFrame === 21 &&
          JSON.stringify(scheduledSequence.sequence).includes(
            'buff_chr_0021_whiten_talent_0_active',
          ),
      );
      if (refundSequence === undefined) throw new Error('missing Estella talent refund sequence');
      const talentTriggerAndConsumptionSkill = {
        ...estellaBattleSkill,
        scheduledSequences: [
          scheduled(
            0,
            sequence(
              step('applyBuff', {
                buffId: 'buff_common_cryst_triggered_physical_break',
                target: 'enemy',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: {
                  atk_scale: { kind: 'constant', value: 0 },
                },
              }),
            ),
          ),
          refundSequence,
        ],
      };
      const estellaForTalentTest = {
        ...estellaGeneratedOperator,
        skillGroups: estellaGeneratedOperator.skillGroups.map(group =>
          group.key === 'battleSkill'
            ? { ...group, skills: talentTriggerAndConsumptionSkill }
            : group,
        ),
      };
      const scenario = createEmptyScenario(
        `scenario:generated-estella-talent-${talentLevel}`,
        '艾斯黛拉冻结碎冰返还',
      );
      scenario.battle.durationFrames = 600;
      scenario.battle.resourceRules = {
        ...scenario.battle.resourceRules,
        initialSp: 300,
        spRecoveryPerSecond: 0,
      };
      const build = (operatorSlug: string, talentStates: Record<number, number>) => ({
        operatorSlug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates,
      });
      scenario.tracks[0] = {
        id: 'track:estella',
        operator: build(estellaGeneratedOperator.slug, { 0: talentLevel }),
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      let nextId = 0;
      const ids = { allocate: (kind: string) => `${kind}:estella-talent:${++nextId}` };
      const placements = [
        {
          trackIndex: 0 as const,
          operator: estellaForTalentTest,
          skillGroupKey: 'battleSkill',
          startFrame: 1,
        },
      ];
      const placed = placements.reduce(
        (current, placement) => placeSkillGroup({ scenario: current, ids, ...placement }).scenario,
        scenario,
      );
      return runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 500,
        criticalSamples: new ExplicitCriticalSampleSource(Array(100).fill(1)),
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        elementalInflictionDocument: elementalAttachments,
        options: {
          ...standardOptions(),
          index: {
            getCommonBuffDefinitions: () => commonBuffDefinitions,
            getOperator: slug =>
              slug === estellaGeneratedOperator.slug ? estellaForTalentTest : null,
            getWeapon: () => null,
            getGear: () => null,
            getGearSet: () => null,
          },
        },
      });
    };

    const refunds = (talentLevel: 1 | 2) =>
      run(talentLevel).receiptEntries.filter(
        entry =>
          entry.event === 'SpChanged' &&
          entry.sourceId === 'track:estella' &&
          entry.data?.requestedValue === (talentLevel === 1 ? 7.5 : 15),
      );
    expect(refunds(1)).toHaveLength(1);
    expect(refunds(2)).toHaveLength(1);
  });

  it('stacks Chen Qianyu talent 1 from skill damage before the next attack', () => {
    const run = (talentLevel: 1 | 2) => {
      const scenario = createEmptyScenario(
        `scenario:generated-chen-talent-${talentLevel}`,
        '陈千语技能伤害叠攻',
      );
      scenario.tracks[0] = {
        id: 'track:chen-qianyu',
        operator: {
          operatorSlug: chenQianyuGeneratedOperator.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: talentLevel },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      let nextId = 0;
      const ids = { allocate: (kind: string) => `${kind}:chen-talent:${++nextId}` };
      const skill = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: chenQianyuGeneratedOperator,
        skillGroupKey: 'battleSkill',
        startFrame: 1,
        ids,
      }).scenario;
      const attack = placeSkillGroup({
        scenario: skill,
        trackIndex: 0,
        operator: chenQianyuGeneratedOperator,
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0005_chen_attack1',
        startFrame: 40,
        ids,
      }).scenario;
      return runStandardPlayerDamageScenarioSimulation({
        scenario: attack,
        endFrame: 80,
        criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          ...standardOptions(),
          index: {
            getOperator: slug =>
              slug === chenQianyuGeneratedOperator.slug ? chenQianyuGeneratedOperator : null,
            getWeapon: () => null,
            getGear: () => null,
            getGearSet: () => null,
            getCommonBuffDefinitions: () => commonBuffDefinitions,
          },
        },
      });
    };

    const attackDamage = (talentLevel: 1 | 2) =>
      run(talentLevel).receiptEntries.find(
        entry =>
          entry.event === 'DamageApplied' &&
          String(entry.data?.stepKey).includes('chr_0005_chen_attack1'),
      )?.data?.value as number | undefined;
    expect(attackDamage(1)).toBeTypeOf('number');
    expect(attackDamage(2)).toBeGreaterThan(attackDamage(1) ?? 0);
  });

  it('applies both Rossi talent 1 levels to the real battle-skill bleed chain', () => {
    const run = (talentLevel: 1 | 2) => {
      const scenario = createEmptyScenario(
        `scenario:generated-rossi-bleed-talent-${talentLevel}`,
        '洛茜战技流血天赋',
      );
      scenario.battle.durationFrames = 1200;
      scenario.enemy.editable.stagger = {
        ...scenario.enemy.editable.stagger,
        maximum: 1,
      };
      scenario.battle.resourceRules = {
        ...scenario.battle.resourceRules,
        initialSp: 300,
        spRecoveryPerSecond: 0,
      };
      scenario.tracks[0] = {
        id: 'track:perlica',
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
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      scenario.tracks[1] = {
        id: 'track:rossi',
        operator: {
          operatorSlug: rossiGeneratedOperator.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: talentLevel },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      let nextId = 0;
      const ids = {
        allocate: (kind: string) => `${kind}:rossi-bleed-${talentLevel}:${++nextId}`,
      };
      const staggered = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: perlicaGeneratedOperator,
        skillGroupKey: 'battleSkill',
        startFrame: 1,
        ids,
      }).scenario;
      const placed = placeSkillGroup({
        scenario: staggered,
        trackIndex: 1,
        operator: rossiGeneratedOperator,
        skillGroupKey: 'battleSkill',
        startFrame: 20,
        ids,
      }).scenario;
      // 原始 timelineActions[25] 检查 NoGuard Buff，不检查 PoiseBroken。
      // 第一段战技正常产生破防层；第二次才满足追击门，不手工注入 Buff/黑板。
      const withFollowUp = placeSkillGroup({
        scenario: placed,
        trackIndex: 1,
        operator: rossiGeneratedOperator,
        skillGroupKey: 'battleSkill',
        startFrame: 200,
        ids,
      }).scenario;
      return runStandardPlayerDamageScenarioSimulation({
        scenario: withFollowUp,
        endFrame: 1100,
        criticalSamples: new ExplicitCriticalSampleSource(Array(200).fill(1)),
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        elementalInflictionDocument: elementalAttachments,
        options: {
          ...standardOptions(),
          index: {
            getCommonBuffDefinitions: () => commonBuffDefinitions,
            getOperator: slug =>
              slug === rossiGeneratedOperator.slug
                ? rossiGeneratedOperator
                : slug === perlicaGeneratedOperator.slug
                  ? perlicaGeneratedOperator
                  : null,
            getWeapon: () => null,
            getGear: () => null,
            getGearSet: () => null,
          },
        },
      });
    };

    const bleedDamage = (talentLevel: 1 | 2) => {
      const entries = run(talentLevel).receiptEntries;
      expect(
        entries.some(
          entry =>
            entry.event === 'BuffApplied' &&
            entry.frame < 200 &&
            entry.data?.buffId === 'buff_physical_no_guard',
        ),
      ).toBe(true);
      expect(
        entries.some(
          entry =>
            entry.event === 'BuffApplied' &&
            entry.frame < 200 &&
            entry.data?.buffId === 'buff_chr_0028_wulfa_tut_normalskill_failure',
        ),
      ).toBe(true);
      const hits = entries.filter(
        entry =>
          entry.event === 'DamageApplied' &&
          String(entry.data?.stepKey).includes(
            'buff_chr_0028_wulfa_normal_bleed:/lifecycleSequences/trigger',
          ),
      );
      expect(hits.filter(entry => entry.frame < 200)).toEqual([]);
      const segments = projectBuffTimelineViz(entries, 1100);
      const skillHits = [...projectTimelineHitOccurrences(entries).values()].flat();
      for (const hit of hits) {
        expect(hit.sourceId).toBe('track:rossi');
        expect(hit.data?.buffId).toBe('buff_chr_0028_wulfa_normal_bleed');
        expect(findBuffDamageSegment(hit, segments)).toBeDefined();
        expect(skillHits.some(item => item.hitId === hit.data?.hitId)).toBe(false);
      }
      return hits;
    };
    const level1 = bleedDamage(1);
    const level2 = bleedDamage(2);
    expect(level1.length).toBeGreaterThan(0);
    expect(level2.length).toBeGreaterThan(level1.length);
    expect(level2[0]?.data?.value as number).toBeGreaterThan(level1[0]?.data?.value as number);
  });

  it('does not run Rossi conditional follow-up without the required enemy Buff tag', () => {
    const scenario = createEmptyScenario('scenario:generated-rossi-claw-mark', '洛茜爪印样本');
    scenario.battle.durationFrames = 300;
    scenario.battle.resourceRules = {
      ...scenario.battle.resourceRules,
      initialSp: 100,
      spRecoveryPerSecond: 0,
    };
    scenario.tracks[0] = {
      id: 'track:rossi',
      operator: {
        operatorSlug: rossiGeneratedOperator.slug,
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
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: rossiGeneratedOperator,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:rossi` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 250,
      criticalSamples: new ExplicitCriticalSampleSource(Array(40).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        ...standardOptions(),
        index: {
          getCommonBuffDefinitions: () => commonBuffDefinitions,
          getOperator: slug =>
            slug === rossiGeneratedOperator.slug ? rossiGeneratedOperator : null,
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
        },
      },
    });

    const clawMarkDamage = result.receiptEntries.filter(
      entry =>
        entry.event === 'DamageApplied' &&
        String(entry.data?.stepKey).includes('buff_chr_0028_wulfa_normal_defup') &&
        String(entry.data?.stepKey).includes('buffInterval'),
    );
    expect(clawMarkDamage).toEqual([]);

    const tutorialSuccessDamage = result.receiptEntries.filter(
      entry =>
        entry.event === 'DamageApplied' &&
        String(entry.data?.stepKey).includes('buff_chr_0028_wulfa_tut_normalskill_success') &&
        String(entry.data?.stepKey).includes('buffInterval'),
    );
    expect(tutorialSuccessDamage).toEqual([]);
    expect(
      result.receiptEntries.some(
        entry => entry.event === 'SkillTimelineFinished' && entry.sourceId === 'track:rossi',
      ),
    ).toBe(true);
  });

  it('runs Rossi attack 4 on the controlled and off-field native timeline branches', () => {
    const simulate = (controlled: boolean) => {
      const scenario = createEmptyScenario(
        `scenario:rossi-attack4-${controlled ? 'controlled' : 'off-field'}`,
        '洛茜第四段普攻主控分支',
      );
      const rossiTrack = controlled ? 0 : 1;
      if (!controlled) {
        scenario.tracks[0] = {
          id: 'track:anchor',
          operator: {
            operatorSlug: perlica.slug,
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
          skillCasts: [],
        };
      }
      scenario.tracks[rossiTrack] = {
        id: 'track:rossi',
        operator: {
          operatorSlug: rossiGeneratedOperator.slug,
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
        skillCasts: [],
      };
      const placed = placeSkillGroup({
        scenario,
        trackIndex: rossiTrack as 0 | 1,
        operator: rossiGeneratedOperator,
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0028_wulfa_attack4',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:rossi-attack4` },
      }).scenario;
      const result = runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 220,
        criticalSamples: new ExplicitCriticalSampleSource(Array(40).fill(0)),
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          ...standardOptions(),
          index: {
            getCommonBuffDefinitions: () => commonBuffDefinitions,
            getOperator: slug =>
              slug === rossiGeneratedOperator.slug
                ? rossiGeneratedOperator
                : slug === perlica.slug
                  ? perlica
                  : null,
            getWeapon: () => null,
            getGear: () => null,
            getGearSet: () => null,
          },
        },
      });
      const damageFrames = result.receiptEntries
        .filter(
          entry =>
            entry.event === 'DamageApplied' &&
            entry.sourceId === 'track:rossi' &&
            String(entry.data?.stepKey).includes('chr_0028_wulfa_attack4'),
        )
        .map(entry => entry.frame);
      const operableBoundaryFrame = result.receiptEntries.find(
        entry => entry.event === 'SkillOperableBoundaryReached',
      )?.frame;
      return { damageFrames, operableBoundaryFrame };
    };

    expect(simulate(true)).toEqual({
      damageFrames: [7, 9, 14, 16, 24],
      operableBoundaryFrame: 37,
    });
    expect(simulate(false)).toEqual({
      damageFrames: [7, 10, 15, 17, 25],
      operableBoundaryFrame: 37,
    });
  });

  it('runs Rossi delayed combo Buff trigger without the native-disabled Refresh timeline', () => {
    const scenario = createEmptyScenario(
      'scenario:generated-rossi-combo-delay',
      '洛茜连携延迟伤害',
    );
    scenario.battle.durationFrames = 120;
    scenario.tracks[0] = {
      id: 'track:rossi',
      operator: {
        operatorSlug: rossiGeneratedOperator.slug,
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
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: rossiGeneratedOperator,
      skillGroupKey: 'comboSkill',
      skillKey: 'chr_0028_wulfa_combo_2_skill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:rossi-combo` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 80,
      criticalSamples: new ExplicitCriticalSampleSource(Array(40).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        ...standardOptions(),
        index: {
          getCommonBuffDefinitions: () => commonBuffDefinitions,
          getOperator: slug =>
            slug === rossiGeneratedOperator.slug ? rossiGeneratedOperator : null,
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
        },
      },
    });

    const delayedDamage = result.receiptEntries.filter(
      entry =>
        entry.event === 'DamageApplied' &&
        String(entry.data?.stepKey).includes('buff_chr_0028_wulfa_combo_2_damage'),
    );
    expect(delayedDamage).toHaveLength(3);
    expect(delayedDamage.every(entry => entry.sourceId === 'track:rossi')).toBe(true);
    expect(
      delayedDamage.filter(entry =>
        String(entry.data?.stepKey).includes('/lifecycleSequences/trigger'),
      ),
    ).toHaveLength(3);
    expect(
      delayedDamage.filter(entry => String(entry.data?.stepKey).includes('/scheduledSequences/')),
    ).toHaveLength(0);
  });

  it('runs Rossi ultimate with its conditional critical-damage Buff', () => {
    const scenario = createEmptyScenario('scenario:generated-rossi-ultimate', '洛茜终结技');
    scenario.battle.durationFrames = 300;
    scenario.tracks[0] = {
      id: 'track:rossi',
      operator: {
        operatorSlug: rossiGeneratedOperator.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: {},
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 100 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: rossiGeneratedOperator,
      skillGroupKey: 'ultimate',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:rossi-ultimate` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 260,
      criticalSamples: new ExplicitCriticalSampleSource(Array(100).fill(0)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      elementalInflictionDocument: elementalAttachments,
      options: {
        ...standardOptions(),
        index: {
          getCommonBuffDefinitions: () => commonBuffDefinitions,
          getOperator: slug =>
            slug === rossiGeneratedOperator.slug ? rossiGeneratedOperator : null,
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
        },
      },
    });

    const directHits = result.receiptEntries.filter(
      entry =>
        entry.event === 'DamageApplied' &&
        entry.sourceId === 'track:rossi' &&
        String(entry.data?.stepKey).startsWith('chr_0028_wulfa_ultimate_skill:'),
    );
    // 原生固定段 12..36 各一次，两个 channeling 段各一次；条件分支只走一侧。
    expect(directHits).toHaveLength(27);
    expect(new Set(directHits.map(entry => entry.data?.stepKey)).size).toBe(27);
  });

  it('runs Camille ultimate with the native channel hit limits', () => {
    const scenario = createEmptyScenario('scenario:generated-camille-ultimate', '卡蜜拉终结技');
    scenario.battle.durationFrames = 300;
    scenario.tracks[0] = {
      id: 'track:camille',
      operator: {
        operatorSlug: camilleGeneratedOperator.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: {},
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 130 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: camilleGeneratedOperator,
      skillGroupKey: 'ultimate',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:camille-ultimate` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 260,
      criticalSamples: new ExplicitCriticalSampleSource(Array(100).fill(0)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      elementalInflictionDocument: elementalAttachments,
      options: {
        ...standardOptions(),
        index: {
          getCommonBuffDefinitions: () => commonBuffDefinitions,
          getOperator: slug =>
            slug === camilleGeneratedOperator.slug ? camilleGeneratedOperator : null,
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
        },
      },
    });

    const directHits = result.receiptEntries.filter(
      entry =>
        entry.event === 'DamageApplied' &&
        entry.sourceId === 'track:camille' &&
        String(entry.data?.stepKey).startsWith('chr_0033_camille_ultimate_skill:'),
    );
    expect(directHits).toHaveLength(9);
    expect(
      directHits.filter(entry => String(entry.data?.stepKey).includes('/scheduledSequences/3/')),
    ).toHaveLength(7);
  });

  it('keeps Rossi follow-up available for the native combo window after the precise-link timer', () => {
    const simulate = (comboSkill3StartFrame: number) => {
      const scenario = createEmptyScenario(
        `scenario:generated-rossi-qte-${comboSkill3StartFrame}`,
        '洛茜精准衔接',
      );
      scenario.battle.durationFrames = 180;
      scenario.tracks[0] = {
        id: 'track:rossi',
        operator: {
          operatorSlug: rossiGeneratedOperator.slug,
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
        skillCasts: [],
      };
      const afterFirstStage = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: rossiGeneratedOperator,
        skillGroupKey: 'comboSkill',
        skillKey: 'chr_0028_wulfa_combo_2_skill',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:rossi-qte-first` },
      }).scenario;
      const placed = placeSkillGroup({
        scenario: afterFirstStage,
        trackIndex: 0,
        operator: rossiGeneratedOperator,
        skillGroupKey: 'comboSkill',
        // 时间轴保存玩家显式选择的具体技能形态。原生换槽状态只负责
        // 校验此时输入实际会解析成什么，不再暗中改写技能块。
        skillKey: 'chr_0028_wulfa_combo_3_skill',
        startFrame: comboSkill3StartFrame,
        ids: { allocate: kind => `${kind}:rossi-qte-second-${comboSkill3StartFrame}` },
      }).scenario;
      return runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 150,
        criticalSamples: new ExplicitCriticalSampleSource(Array(80).fill(1)),
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          ...standardOptions(),
          index: {
            getCommonBuffDefinitions: () => commonBuffDefinitions,
            getOperator: slug =>
              slug === rossiGeneratedOperator.slug ? rossiGeneratedOperator : null,
            getWeapon: () => null,
            getGear: () => null,
            getGearSet: () => null,
          },
        },
      });
    };

    // 正式产物保留命中停帧；原生 QTE 以连携剩余时间差判定，不以帧号邻接或计时 Buff 存在性猜测。
    const inside = simulate(65);
    const outside = simulate(82);

    expect(inside.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'ComboRingQtePressed',
        data: expect.objectContaining({
          succeeded: true,
          sourceActionId: 'skillCast:rossi-qte-second-65',
        }),
      }),
    );
    expect(outside.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'ComboRingQtePressed',
        data: expect.objectContaining({
          succeeded: false,
          sourceActionId: 'skillCast:rossi-qte-second-82',
        }),
      }),
    );
    expect(
      inside.receiptEntries.some(
        entry =>
          entry.event === 'BuffApplied' &&
          entry.data?.buffId === 'buff_chr_0028_wulfa_tut_comboskill_success',
      ),
    ).toBe(true);
    expect(
      outside.receiptEntries.some(
        entry =>
          entry.event === 'BuffApplied' &&
          entry.data?.buffId === 'buff_chr_0028_wulfa_tut_comboskill_success',
      ),
    ).toBe(false);

    expect(
      inside.receiptEntries.some(
        entry =>
          entry.event === 'TimeDilationStarted' &&
          entry.sourceId === 'track:rossi' &&
          entry.data?.priority === 50,
      ),
    ).toBe(true);
    // 精准衔接计时决定技能内部效果；TriggerComboSkillAction 另行开启原生 5 秒连携候选，
    // 因而 82 帧仍能按当前连携槽消费 comboSkill3，不能把两个计时器混为一谈。
    expect(
      outside.receiptEntries.some(
        entry => entry.event === 'TimeDilationStarted' && entry.data?.priority === 50,
      ),
    ).toBe(true);
    expect(outside.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'ComboWindowConsumed',
        data: expect.objectContaining({ nextSkillKey: 'chr_0028_wulfa_combo_3_skill' }),
      }),
    );
  });

  it('pauses Rossi combo timers for the native power-attack action interval', () => {
    const simulate = (withPowerAttack: boolean) => {
      const scenario = createEmptyScenario(
        `scenario:generated-rossi-combo-pause-${withPowerAttack}`,
        '洛茜连携计时暂停',
      );
      scenario.battle.durationFrames = 420;
      scenario.tracks[0] = {
        id: 'track:rossi',
        operator: {
          operatorSlug: rossiGeneratedOperator.slug,
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
        skillCasts: [],
      };
      let placed = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: rossiGeneratedOperator,
        skillGroupKey: 'comboSkill',
        skillKey: 'chr_0028_wulfa_combo_2_skill',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:rossi-pause-combo` },
      }).scenario;
      if (withPowerAttack) {
        placed = placeSkillGroup({
          scenario: placed,
          trackIndex: 0,
          operator: rossiGeneratedOperator,
          skillGroupKey: 'finisher',
          skillKey: 'chr_0028_wulfa_power_attack',
          startFrame: 60,
          ids: { allocate: kind => `${kind}:rossi-pause-power` },
        }).scenario;
      }
      const result = runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 380,
        criticalSamples: new ExplicitCriticalSampleSource(Array(120).fill(1)),
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          ...standardOptions(),
          index: {
            getCommonBuffDefinitions: () => commonBuffDefinitions,
            getOperator: slug =>
              slug === rossiGeneratedOperator.slug ? rossiGeneratedOperator : null,
            getWeapon: () => null,
            getGear: () => null,
            getGearSet: () => null,
          },
        },
      });
      return result.receiptEntries.find(
        entry =>
          entry.event === 'BuffFinished' &&
          entry.data?.buffId === 'buff_chr_0028_wulfa_combo_usetimer' &&
          entry.data?.reason === 'lifetime',
      )?.frame;
    };

    const normalFinishFrame = simulate(false);
    const pausedFinishFrame = simulate(true);
    expect(normalFinishFrame).toBeTypeOf('number');
    expect(pausedFinishFrame).toBeTypeOf('number');
    expect(pausedFinishFrame!).toBeGreaterThan(normalFinishFrame!);
  });

  it('runs generated Tangtang combo damage and water entity lifecycle', () => {
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: createGeneratedTangtangComboScenario(),
      endFrame: 2000,
      criticalSamples: new ExplicitCriticalSampleSource(Array(40).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      elementalInflictionDocument: elementalAttachments,
      options: {
        ...standardOptions(),
        index: {
          getOperator: slug =>
            slug === tangtangGeneratedOperator.slug ? tangtangGeneratedOperator : null,
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'SkillStarted',
        sourceId: 'track:tangtang',
        data: expect.objectContaining({ skillId: 'chr_0027_tangtang_combo_skill' }),
      }),
    );
    expect(
      result.receiptEntries.some(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:tangtang',
      ),
    ).toBe(true);
    const spawnedIds = new Set(
      result.receiptEntries
        .filter(entry => entry.event === 'AbilityEntitySpawned')
        .map(entry => entry.targetId),
    );
    const finishedIds = new Set(
      result.receiptEntries
        .filter(entry => entry.event === 'AbilityEntityFinished')
        .map(entry => entry.targetId),
    );
    expect(spawnedIds.size).toBeGreaterThan(0);
    expect([...spawnedIds].some(id => finishedIds.has(id))).toBe(true);
  });

  it('applies Tangtang potential 3 to battle-skill and base-passive damage inputs', () => {
    const simulate = (potential: number) =>
      runStandardPlayerDamageScenarioSimulation({
        scenario: createGeneratedTangtangBattleScenario(potential),
        endFrame: 180,
        criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        elementalInflictionDocument: elementalAttachments,
        options: {
          ...standardOptions(),
          index: {
            getOperator: slug =>
              slug === tangtangGeneratedOperator.slug ? tangtangGeneratedOperator : null,
            getWeapon: () => null,
            getGear: () => null,
            getGearSet: () => null,
          },
        },
      });
    const damage = (potential: number) =>
      simulate(potential)
        .receiptEntries.filter(entry => entry.event === 'DamageApplied')
        .reduce(
          (sum, entry) => sum + (typeof entry.data?.value === 'number' ? entry.data.value : 0),
          0,
        );

    expect(damage(0)).toBeTypeOf('number');
    expect(damage(3)).toBeGreaterThan(damage(0) as number);
  });

  it('lets an ally plunging attack upgrade Tangtang ultimate ability-entity follow-up', () => {
    const simulate = (includeAllyPlungingAttack: boolean) =>
      runStandardPlayerDamageScenarioSimulation({
        scenario: createGeneratedTangtangUltimateResponseScenario(includeAllyPlungingAttack),
        endFrame: 240,
        criticalSamples: new ExplicitCriticalSampleSource(Array(40).fill(1)),
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        elementalInflictionDocument: elementalAttachments,
        options: {
          ...standardOptions(),
          index: {
            getCommonBuffDefinitions: () => commonBuffDefinitions,
            getOperator: slug => {
              if (slug === tangtangGeneratedOperator.slug) return tangtangGeneratedOperator;
              if (slug === perlicaGeneratedOperator.slug) return perlicaGeneratedOperator;
              return null;
            },
            getWeapon: () => null,
            getGear: () => null,
            getGearSet: () => null,
          },
        },
      });
    const baseline = simulate(false);
    const triggered = simulate(true);
    const tangtangDamage = (result: typeof baseline) =>
      result.receiptEntries
        .filter(entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:tangtang')
        .map(entry => entry.data!);

    const markerCreated = baseline.receiptEntries.find(
      entry => entry.event === 'TimedMarkerCreated' && entry.data?.markerId === 'tangtang_ult',
    );
    const markerFinished = baseline.receiptEntries.find(
      entry => entry.event === 'TimedMarkerFinished' && entry.targetId === markerCreated?.targetId,
    );
    const auraBuffs = baseline.receiptEntries.filter(
      entry =>
        entry.event === 'BuffApplied' &&
        (entry.data?.buffId === 'buff_chr_0027_tangtang_ultskill_debuff' ||
          entry.data?.buffId === 'buff_chr_0027_tangtang_ultskill_buff') &&
        entry.data.iconDurationSourceTargetId === markerCreated?.targetId,
    );

    expect(markerCreated?.targetId).toMatch(/^ability-entity:\d+:timed-marker:\d+$/);
    expect(markerFinished).toEqual(
      expect.objectContaining({
        frame: expect.any(Number),
        data: expect.objectContaining({ markerId: 'tangtang_ult' }),
      }),
    );
    expect(markerFinished!.frame).toBeGreaterThan(markerCreated!.frame);
    expect(auraBuffs.map(entry => entry.targetId).sort()).toEqual(['enemy', 'track:perlica']);

    expect(triggered.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'BuffApplied',
        sourceId: expect.stringMatching(/^ability-entity:/),
        targetId: 'track:perlica',
        data: expect.objectContaining({ buffId: 'buff_chr_0027_tangtang_ultskill_buff_damage' }),
      }),
    );
    expect(tangtangDamage(triggered)).toHaveLength(tangtangDamage(baseline).length);
    expect(tangtangDamage(baseline).at(-1)?.stepKey).toContain('/scheduledSequences/1/');
    expect(tangtangDamage(triggered).at(-1)?.stepKey).toContain('/scheduledSequences/2/');
    expect(tangtangDamage(triggered).at(-1)?.value).toBeGreaterThan(
      tangtangDamage(baseline).at(-1)?.value as number,
    );
  });

  it('applies Gilberta talent and potential to the live ultimate-energy gain attribute', () => {
    const simulate = (talentLevel: 0 | 2, potential: number) =>
      runStandardPlayerDamageScenarioSimulation({
        scenario: createGeneratedGilbertaBattleScenario(talentLevel, potential),
        endFrame: 120,
        criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        elementalInflictionDocument: elementalAttachments,
        options: {
          ...standardOptions(),
          index: {
            getCommonBuffDefinitions: () => commonBuffDefinitions,
            getOperator: slug =>
              slug === gilbertaGeneratedOperator.slug ? gilbertaGeneratedOperator : null,
            getWeapon: () => null,
            getGear: () => null,
            getGearSet: () => null,
          },
        },
      });
    const gained = (talentLevel: 0 | 2, potential: number) =>
      simulate(talentLevel, potential).receiptEntries.find(
        entry => entry.event === 'UltimateEnergyChanged' && entry.targetId === 'track:gilberta',
      )?.data?.actualValue;

    expect(gained(0, 0)).toBeCloseTo(6.5);
    expect(gained(2, 0)).toBeCloseTo(6.5 * 1.07);
    expect(gained(2, 3)).toBeCloseTo(6.5 * 1.12);
  });

  it('runs generated Mifu shield creation and active battle-skill replacement', () => {
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: createGeneratedMifuProtectionScenario(),
      endFrame: 240,
      criticalSamples: new ExplicitCriticalSampleSource(Array(30).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        ...standardOptions(),
        index: {
          getCommonBuffDefinitions: () => commonBuffDefinitions,
          getOperator: slug => (slug === mifuGeneratedOperator.slug ? mifuGeneratedOperator : null),
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
        },
      },
    });

    expect(
      result.receiptEntries
        .filter(entry => entry.event === 'SkillStarted')
        .map(entry => entry.data?.skillId),
    ).toEqual([
      'chr_0031_mifu_combo_skill',
      'chr_0031_mifu_ultimate_skill',
      'chr_0031_mifu_normalskill_2',
    ]);
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'CombatStepReached',
        frame: 1,
        sourceId: 'track:mifu',
        data: expect.objectContaining({ skillId: 'chr_0031_mifu_combo_skill', kind: 'applyBuff' }),
      }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'SkillStarted',
        sourceId: 'track:mifu',
        data: expect.objectContaining({ skillId: 'chr_0031_mifu_normalskill_2' }),
      }),
    );
    // 原生终结技第 98 帧明确配置 0 倍率 DamageAction；它仍执行命中与停帧动作。
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'DamageApplied',
        sourceId: 'track:mifu',
        data: expect.objectContaining({
          stepKey:
            'chr_0031_mifu_ultimate_skill:/scheduledSequences/3/sequence/steps/0/whenTrue/steps/0',
          expectedDamage: 0,
        }),
      }),
    );
  });

  it('runs all three generated Mifu battle-skill forms with stable hit identities', () => {
    const fixture = createGeneratedMifuBattleChainScenario();
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: fixture.scenario,
      endFrame: 300,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        ...standardOptions(),
        index: {
          getCommonBuffDefinitions: () => commonBuffDefinitions,
          getOperator: slug => (slug === fixture.operator.slug ? fixture.operator : null),
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
        },
      },
    });

    expect(
      result.receiptEntries
        .filter(entry => entry.event === 'SkillStarted')
        .map(entry => entry.data?.skillId),
    ).toEqual([
      'chr_0031_mifu_normalskill_1',
      'chr_0031_mifu_normalskill_2',
      'chr_0031_mifu_normalskill_3',
    ]);
    const damageSteps = result.receiptEntries
      .filter(entry => entry.event === 'DamageApplied')
      .map(entry => String(entry.data?.stepKey));
    expect(damageSteps.filter(stepKey => stepKey.includes('normalskill_1'))).toHaveLength(1);
    expect(damageSteps.filter(stepKey => stepKey.includes('normalskill_2'))).toHaveLength(3);
    expect(damageSteps.filter(stepKey => stepKey.includes('normalskill_3'))).toHaveLength(1);
    const thirdFormDamage = result.receiptEntries.find(
      entry =>
        entry.event === 'DamageApplied' && String(entry.data?.stepKey).includes('normalskill_3'),
    );
    expect(thirdFormDamage?.data?.value).toBeTypeOf('number');
    expect(thirdFormDamage?.data?.value as number).toBeGreaterThan(0);
    expect(
      result.receiptEntries
        .filter(
          entry =>
            entry.event === 'DamageApplied' &&
            String(entry.data?.stepKey).includes('chr_0031_mifu_normalskill_'),
        )
        .every(
          entry => typeof entry.data?.castId === 'string' && typeof entry.data?.hitId === 'string',
        ),
    ).toBe(true);
  });

  it('keeps generated Last Rite party Buff damage attributed to the Buff source', () => {
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: createGeneratedLastRitePartyBuffScenario(),
      endFrame: 100,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      elementalInflictionDocument: elementalAttachments,
      options: {
        ...standardOptions(),
        index: {
          getCommonBuffDefinitions: () => commonBuffDefinitions,
          getOperator: slug =>
            slug === lastRiteGeneratedOperator.slug ? lastRiteGeneratedOperator : null,
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
        },
      },
    });

    const phantomDamage = result.receiptEntries.find(
      entry =>
        entry.event === 'DamageApplied' &&
        String(entry.data?.stepKey).includes('buff_chr_0026_lastrite_normal_skill_phantom'),
    );
    expect(phantomDamage).toMatchObject({ sourceId: 'track:last-rite-source' });
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'ElementalInflictionApplied',
        sourceId: 'track:last-rite-source',
      }),
    );
  });

  it('runs generated Endministrator freeze and ultimate ignition through production simulation', () => {
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: createGeneratedEndministratorIgniteScenario(),
      endFrame: 220,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        ...standardOptions(),
        index: {
          getCommonBuffDefinitions: () => commonBuffDefinitions,
          getOperator: slug =>
            slug === endministratorGeneratedOperator.slug ? endministratorGeneratedOperator : null,
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
        },
      },
    });

    expect(
      result.receiptEntries
        .filter(entry => entry.event === 'SkillStarted')
        .map(entry => entry.data?.skillId),
    ).toEqual(['chr_0003_endminf_combo_skill', 'chr_0003_endminf_ultimate_skill']);
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'BuffFinished',
        targetId: 'enemy',
        data: expect.objectContaining({
          buffId: 'buff_common_originum_frozen',
          reason: 'ignite',
        }),
      }),
    );
    const damageEntries = result.receiptEntries.filter(
      entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:endministrator',
    );
    expect(damageEntries).toHaveLength(5);
    expect(damageEntries).toContainEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          stepKey: expect.stringContaining('buff_common_originum_frozen:'),
        }),
      }),
    );
    expect(result.finalResources.squad[0]?.ultimateEnergy).toBe(15);
  });

  it('applies Endministrator talent 1 attack Buff after igniting frozen', () => {
    const run = (talent1Level: 1 | 2) =>
      runStandardPlayerDamageScenarioSimulation({
        scenario: createGeneratedEndministratorIgniteScenario(talent1Level),
        endFrame: 240,
        criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          ...standardOptions(),
          index: {
            getCommonBuffDefinitions: () => commonBuffDefinitions,
            getOperator: slug =>
              slug === endministratorGeneratedOperator.slug
                ? endministratorGeneratedOperator
                : null,
            getWeapon: () => null,
            getGear: () => null,
            getGearSet: () => null,
          },
        },
      });

    const level1 = run(1);
    const level2 = run(2);
    expect(level2.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'BuffApplied',
        sourceId: 'track:endministrator',
        targetId: 'track:endministrator',
        data: expect.objectContaining({
          buffId: 'buff_chr_0003_endminf_talent_1_tirgger',
        }),
      }),
    );
    const basicDamage = (result: typeof level1) =>
      result.receiptEntries.find(
        entry => entry.event === 'DamageApplied' && entry.data?.castId === 'skillCast:3',
      )?.data?.value as number | undefined;
    expect(basicDamage(level1)).toBeTypeOf('number');
    expect(basicDamage(level2)).toBeGreaterThan(basicDamage(level1) ?? 0);
  });

  it('applies Endministrator talent 2 only to physical damage against frozen', () => {
    const run = (talent2Level: 1 | 2) => {
      const scenario = createGeneratedEndministratorIgniteScenario();
      const track = scenario.tracks[0];
      if (track?.operator == null) throw new Error('missing Endministrator track');
      track.operator.talentStates = { 1: talent2Level };
      return runStandardPlayerDamageScenarioSimulation({
        scenario,
        endFrame: 220,
        criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          ...standardOptions(),
          index: {
            getCommonBuffDefinitions: () => commonBuffDefinitions,
            getOperator: slug =>
              slug === endministratorGeneratedOperator.slug
                ? endministratorGeneratedOperator
                : null,
            getWeapon: () => null,
            getGear: () => null,
            getGearSet: () => null,
          },
        },
      });
    };

    const level1 = run(1);
    const level2 = run(2);
    const firstUltimateDamage = (result: typeof level1) =>
      result.receiptEntries.find(
        entry => entry.event === 'DamageApplied' && entry.data?.castId === 'skillCast:2',
      );
    expect(firstUltimateDamage(level1)?.data?.damageType).toBe('physical');
    expect(firstUltimateDamage(level2)?.data?.value as number).toBeGreaterThan(
      firstUltimateDamage(level1)?.data?.value as number,
    );
  });

  it('ends generated Arclight ultimate time freeze within the fixed actual-time range', () => {
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: createGeneratedArclightUltimateScenario(),
      endFrame: 150,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      elementalInflictionDocument: elementalAttachments,
      options: {
        ...standardOptions(),
        index: {
          getOperator: slug =>
            slug === arclightGeneratedOperator.slug ? arclightGeneratedOperator : null,
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
          getCommonBuffDefinitions: () => commonBuffDefinitions,
        },
      },
    });

    expect(result.frame).toBe(150);
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'TimeDilationEnded',
        sourceId: 'track:sample:arclight',
        data: expect.objectContaining({
          sourceActionId: 'chr_0007_ikut_ultimate_skill',
          reason: 'stopped',
        }),
      }),
    );
    const arclightDamage = result.receiptEntries.filter(
      entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:sample:arclight',
    );
    expect(arclightDamage).toHaveLength(2);
    expect(
      arclightDamage.every(
        entry => entry.data?.castId === 'skillCast:1' && typeof entry.data.hitId === 'string',
      ),
    ).toBe(true);
    expect(arclightDamage.map(entry => entry.frame)).toEqual([64, 120]);
  });

  it('accepts the generated Arclight battle skill Buff and entity-tag operations', () => {
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: createGeneratedArclightBattleSkillScenario(),
      endFrame: 150,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        ...standardOptions(),
        index: {
          getOperator: slug =>
            slug === arclightGeneratedOperator.slug ? arclightGeneratedOperator : null,
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
          getCommonBuffDefinitions: () => commonBuffDefinitions,
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'SkillStarted',
        sourceId: 'track:sample:arclight',
        data: expect.objectContaining({ skillId: 'chr_0007_ikut_normal_skill' }),
      }),
    );
  });

  it('applies generated Lifeng talent factors to the runtime attack snapshot', () => {
    const withoutTalent = runGeneratedLifengScenario(0);
    const withTalent = runGeneratedLifengScenario(1);
    const damageValue = (result: typeof withTalent) =>
      result.receiptEntries.find(entry => entry.event === 'DamageApplied')?.data?.value;

    expect(withTalent.operatorPanels[0]?.attack).toBe(withoutTalent.operatorPanels[0]?.attack);
    expect(damageValue(withoutTalent)).toBeTypeOf('number');
    expect(damageValue(withTalent)).toBeTypeOf('number');
    expect(damageValue(withTalent) as number).toBeGreaterThan(damageValue(withoutTalent) as number);
    expect(withTalent.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'PassiveSkillEnabled',
        sourceId: 'track:0',
        data: expect.objectContaining({ passiveKey: 'chr_0015_lifeng_talent_1' }),
      }),
    );
  });

  it('consumes Lifeng potential 5 on the next knockdown and restarts its timer', () => {
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: createGeneratedLifengKnockDownScenario(),
      endFrame: 1400,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      elementalInflictionDocument: elementalAttachments,
      options: {
        ...standardOptions(),
        index: {
          getOperator: slug =>
            slug === lifengGeneratedOperator.slug ? lifengGeneratedOperator : null,
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
          getCommonBuffDefinitions: () => commonBuffDefinitions,
        },
      },
    });
    // 技能内动作会受已编译的实体命中停顿影响；轴上释放时刻固定，但内部第 54 帧
    // 不能再用旧逻辑帧常量反推现实帧。以实际倒地输出验证同帧潜能响应。
    const knockDown = result.receiptEntries.find(
      entry => entry.event === 'PhysicalInflictionApplied' && entry.data?.type === 'knockDown',
    );
    expect(knockDown).toBeDefined();
    const knockDownFrame = knockDown!.frame;
    const damageAtKnockDown = result.receiptEntries.filter(
      entry => entry.frame === knockDownFrame && entry.event === 'DamageApplied',
    );
    expect(damageAtKnockDown).toHaveLength(3);
    expect(damageAtKnockDown).toContainEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          stepKey:
            'buff_chr_0015_lifeng_talent_2:/abilityEventResponses/0/sequence/steps/0/whenTrue/steps/4',
        }),
      }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        frame: knockDownFrame,
        event: 'BuffFinished',
        data: expect.objectContaining({ buffId: 'buff_chr_0015_lifeng_potential_5_1' }),
      }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        frame: knockDownFrame + 450,
        event: 'BuffFinished',
        data: expect.objectContaining({ buffId: 'buff_chr_0015_lifeng_potential_5' }),
      }),
    );
  });

  it('projects Akekuri global combo layers onto the party and consumes one layer per skill', () => {
    const simulate = (talentEnabled: boolean, potential = 0, battleSkillStartFrame = 60) =>
      runStandardPlayerDamageScenarioSimulation({
        scenario: createGeneratedAkekuriComboImbueScenario(
          talentEnabled,
          potential,
          battleSkillStartFrame,
        ),
        endFrame: battleSkillStartFrame + 120,
        criticalSamples: new ExplicitCriticalSampleSource(Array(30).fill(1)),
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        elementalInflictionDocument: elementalAttachments,
        options: {
          ...standardOptions(),
          index: {
            getCommonBuffDefinitions: () => commonBuffDefinitions,
            getOperator: slug =>
              [akekuri, perlicaGeneratedOperator].find(operator => operator.slug === slug) ?? null,
            getWeapon: () => null,
            getGear: () => null,
            getGearSet: () => null,
          },
        },
      });
    const perlicaBattleDamage = (result: ReturnType<typeof simulate>) =>
      result.receiptEntries.find(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:perlica-imbue',
      )?.data?.value as number;

    const baseline = simulate(false);
    const imbued = simulate(true);
    expect(perlicaBattleDamage(baseline)).toBeGreaterThan(0);
    expect(perlicaBattleDamage(imbued)).toBeCloseTo(perlicaBattleDamage(baseline) * 1.3);
    expect(
      imbued.receiptEntries.filter(
        entry =>
          entry.event === 'BuffFinished' &&
          entry.data?.buffId === 'buff_common_affixes_combo_trigger',
      ),
    ).toHaveLength(2);

    expect(perlicaBattleDamage(simulate(true, 0, 240))).toBeCloseTo(perlicaBattleDamage(baseline));
    expect(perlicaBattleDamage(simulate(true, 5, 240))).toBeCloseTo(
      perlicaBattleDamage(baseline) * 1.3,
    );
    expect(perlicaBattleDamage(simulate(true, 5, 360))).toBeCloseTo(perlicaBattleDamage(baseline));
  });

  it('runs generated operators through team events, combo windows and shared resources', () => {
    const definitions = [arclightGeneratedOperator, perlicaGeneratedOperator];
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: createGeneratedTeamScenario(),
      endFrame: 400,
      criticalSamples: new ExplicitCriticalSampleSource(Array(40).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      elementalInflictionDocument: elementalAttachments,
      options: {
        ...standardOptions(),
        index: {
          getCommonBuffDefinitions: () => commonBuffDefinitions,
          getOperator: slug => definitions.find(operator => operator.slug === slug) ?? null,
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
        },
      },
    });

    expect(
      result.receiptEntries
        .filter(entry => entry.event === 'SkillStarted')
        .map(entry => [entry.sourceId, entry.data?.skillId]),
    ).toEqual([
      ['track:0', 'chr_0007_ikut_attack5'],
      ['track:1', 'chr_0004_pelica_combo_skill'],
      ['track:1', 'chr_0004_pelica_normal_skill'],
      ['track:1', 'chr_0004_pelica_ultimate_skill'],
      ['track:1', 'chr_0004_pelica_ultimate_skill'],
    ]);
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({ event: 'ComboWindowOpened', sourceId: 'track:1' }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({ event: 'ComboWindowConsumed', sourceId: 'track:1' }),
    );
    expect(
      new Set(
        result.receiptEntries
          .filter(entry => entry.event === 'DamageApplied')
          .map(entry => entry.sourceId),
      ),
    ).toEqual(new Set(['track:0', 'track:1']));
    expect(result.finalResources.sp).toBeGreaterThan(0);
    expect(result.finalResources.sp).toBeLessThan(result.initialResources.sp);
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'SkillCostApplied',
        sourceId: 'track:1',
        data: expect.objectContaining({
          skillId: 'chr_0004_pelica_normal_skill',
          nonReturnedSpCost: 100,
        }),
      }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'SkillCostApplied',
        sourceId: 'track:1',
        data: expect.objectContaining({
          skillId: 'chr_0004_pelica_ultimate_skill',
          remainingUltimateEnergy: 0,
        }),
      }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'SkillCooldownUnavailableAtStart',
        sourceId: 'track:1',
        data: expect.objectContaining({ skillId: 'chr_0004_pelica_ultimate_skill' }),
      }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'SkillCostUnavailableAtStart',
        sourceId: 'track:1',
        data: expect.objectContaining({ skillId: 'chr_0004_pelica_ultimate_skill' }),
      }),
    );
    expect(
      result.receiptEntries.filter(
        entry =>
          entry.event === 'SkillCostApplied' &&
          entry.sourceId === 'track:1' &&
          entry.data?.skillId === 'chr_0004_pelica_ultimate_skill',
      ),
    ).toHaveLength(2);
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'UltimateEnergyChanged',
        sourceId: 'track:1',
        data: expect.objectContaining({ requestedValue: -80, actualValue: 0, currentValue: 0 }),
      }),
    );
  });

  it('runs every generated Perlica skill type through the production simulation flow', () => {
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placeGeneratedPerlicaFlow(perlicaFormalOperator),
      endFrame: 283,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      elementalInflictionDocument: elementalAttachments,
      options: {
        ...standardOptions(),
        index: {
          getOperator: slug => (slug === perlicaFormalOperator.slug ? perlicaFormalOperator : null),
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
          getCommonBuffDefinitions: () => commonBuffDefinitions,
        },
      },
    });

    expect(
      result.receiptEntries
        .filter(entry => entry.event === 'SkillStarted')
        .map(entry => entry.data?.skillId),
    ).toEqual([
      'chr_0004_pelica_attack1',
      'chr_0004_pelica_attack2',
      'chr_0004_pelica_attack3',
      'chr_0004_pelica_attack4',
      'chr_0004_pelica_combo_skill',
      'chr_0004_pelica_normal_skill',
      'chr_0004_pelica_ultimate_skill',
      'chr_0004_pelica_plunging_attack_end',
      'chr_0004_pelica_power_attack',
    ]);
    expect(result.receiptEntries.some(entry => entry.event === 'ComboWindowOpened')).toBe(true);
    expect(result.receiptEntries.some(entry => entry.event === 'ComboWindowConsumed')).toBe(true);
    expect(result.receiptEntries.some(entry => entry.event === 'ElementalInflictionApplied')).toBe(
      true,
    );
    expect(
      projectBuffTimelineViz(result.receiptEntries, result.frame).filter(
        segment =>
          segment.targetId === 'enemy' &&
          segment.buffId === 'buff_common_energy_shard_attached_pulse',
      ),
    ).toContainEqual(
      expect.objectContaining({
        iconId: 'icon_energy_fusion_pulse',
        showInHeadBarCommon: false,
        showInHeadBarAttached: true,
      }),
    );
    expect(result.receiptEntries.some(entry => entry.event === 'ElementalReactionApplied')).toBe(
      true,
    );
    expect(result.enemyVitals.finalPoise).toBe(0);

    const finisherRecoveryIndex = result.receiptEntries.findIndex(
      entry =>
        entry.event === 'SpChanged' && entry.data?.skillId === 'chr_0004_pelica_power_attack',
    );
    expect(finisherRecoveryIndex).toBeGreaterThan(0);
    const finisherRecovery = result.receiptEntries[finisherRecoveryIndex]!;
    const finisherDamageIndex = result.receiptEntries.findIndex(
      entry =>
        entry.frame === finisherRecovery.frame &&
        entry.event === 'DamageApplied' &&
        entry.sourceId === 'track:0',
    );
    expect(finisherDamageIndex).toBeGreaterThanOrEqual(0);
    expect(finisherDamageIndex).toBeLessThan(finisherRecoveryIndex);
    expect(finisherRecovery).toMatchObject({
      sourceId: 'track:0',
      data: {
        skillId: 'chr_0004_pelica_power_attack',
        baseValue: 80,
        gainKind: 'gain',
      },
    });
    expect(result.finalResources.squad[0]?.ultimateEnergy).toBeLessThan(80);
  });

  it('compiles a placed pure-damage skill and returns enemy health from the same runtime', () => {
    const scenario = createPerlicaScenario();
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'plungingAttack',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:1` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 4,
      criticalSamples: new ExplicitCriticalSampleSource([1]),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: standardOptions(),
    });

    const damage = result.receiptEntries.find(entry => entry.event === 'DamageApplied');
    expect(damage).toBeDefined();
    expect(damage?.data?.value).toBeCloseTo(635.4);
    expect(result.finalEnemyHealth).toBeCloseTo(result.enemy.health - 635.4);
    expect(damage?.data?.remainingHealth).toBe(result.finalEnemyHealth);
    // 最终结果与投影共用本次模拟唯一的敌人账本快照，不再回退到静态敌人数值。
    expect(result.enemyVitals.initialHealth).toBe(result.enemy.health);
    expect(result.enemyVitals.maxHealth).toBe(result.enemy.health);
    expect(result.enemyVitals.initialPoise).toBe(result.enemyVitals.maxPoise);
    // 普攻只写生命不写失衡，失衡快照保持满值。
    expect(result.enemyVitals.finalPoise).toBe(result.enemyVitals.initialPoise);
  });

  it('applies a selected supported Contingency Contract tag to real skill damage', () => {
    const createScenario = (withContract: boolean) => {
      let nextCastId = 0;
      const scenario = placeSkillGroup({
        scenario: createPerlicaScenario(),
        trackIndex: 0,
        operator: perlica,
        skillGroupKey: 'basicAttack',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:contract:${++nextCastId}` },
      }).scenario;
      if (withContract) {
        scenario.mechanics.selections.push({
          id: 'selection:contract:100803',
          mechanicId: `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}100803`,
          enabled: true,
          parameters: {},
        });
      }
      return scenario;
    };
    const run = (withContract: boolean) => {
      const base = standardOptions();
      return runStandardPlayerDamageScenarioSimulation({
        scenario: createScenario(withContract),
        endFrame: 90,
        criticalSamples: { nextCriticalSample: () => 1 },
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          ...base,
          index: {
            ...base.index,
            getCommonBuffDefinitions: gameDataRepository.getCommonBuffDefinitions,
            getMechanic: gameDataRepository.getMechanic,
          },
          mechanicAdapters: new MechanicAdapterRegistry([contingencyContractMechanicAdapter]),
        },
      });
    };

    const baseline = run(false);
    const contracted = run(true);
    const baselineDamage = baseline.enemyVitals.initialHealth - baseline.finalEnemyHealth;
    const contractedDamage = contracted.enemyVitals.initialHealth - contracted.finalEnemyHealth;
    expect(baselineDamage).toBeGreaterThan(0);
    expect(contractedDamage).toBeCloseTo(baselineDamage * 0.3);
  });

  it('applies an enemy maximum-health contract before creating the shared vitals ledger', () => {
    const scenario = createPerlicaScenario();
    scenario.mechanics.selections.push({
      id: 'selection:contract:900101',
      mechanicId: `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}900101`,
      enabled: true,
      parameters: {},
    });
    const base = standardOptions();
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario,
      endFrame: 0,
      criticalSamples: { nextCriticalSample: () => 1 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        ...base,
        index: {
          ...base.index,
          getMechanic: gameDataRepository.getMechanic,
        },
        mechanicAdapters: new MechanicAdapterRegistry([contingencyContractMechanicAdapter]),
      },
    });

    expect(result.enemy.health).toBe(result.enemyVitals.maxHealth);
    expect(result.enemyVitals.initialHealth).toBe(result.enemyVitals.maxHealth);
    expect(result.enemyVitals.maxHealth).toBeCloseTo(scenario.enemy.editable.hp * 1.5);
  });

  it('uses the selected combo cooldown contract when each cast reserves its cooldown', () => {
    const createScenario = (withContract: boolean) => {
      let scenario = createPerlicaScenario();
      let nextId = 0;
      const ids = { allocate: (kind: string) => `${kind}:combo-contract:${++nextId}` };
      for (const startFrame of [1, 260]) {
        scenario = placeSkillGroup({
          scenario,
          trackIndex: 0,
          operator: perlicaGeneratedOperator,
          skillGroupKey: 'comboSkill',
          startFrame,
          ids,
        }).scenario;
      }
      if (withContract) {
        scenario.mechanics.selections.push({
          id: 'selection:contract:100003',
          mechanicId: `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}100003`,
          enabled: true,
          parameters: {},
        });
      }
      return scenario;
    };
    const run = (withContract: boolean) => {
      const base = standardOptions();
      return runStandardPlayerDamageScenarioSimulation({
        scenario: createScenario(withContract),
        endFrame: 261,
        criticalSamples: { nextCriticalSample: () => 1 },
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          ...base,
          index: {
            ...base.index,
            getOperator: slug =>
              slug === perlicaGeneratedOperator.slug ? perlicaGeneratedOperator : null,
            getCommonBuffDefinitions: gameDataRepository.getCommonBuffDefinitions,
            getMechanic: gameDataRepository.getMechanic,
          },
          mechanicAdapters: new MechanicAdapterRegistry([contingencyContractMechanicAdapter]),
        },
      });
    };

    const baseline = run(false);
    const contracted = run(true);
    expect(
      baseline.receiptEntries.filter(entry => entry.event === 'SkillCooldownUnavailableAtStart'),
    ).toHaveLength(1);
    expect(
      contracted.receiptEntries.filter(entry => entry.event === 'SkillCooldownUnavailableAtStart'),
    ).toHaveLength(0);
  });

  it('stops natural shared-SP recovery after the Queue: Burden countdown expires', () => {
    const createScenario = (withContract: boolean, withPowerAttack = false) => {
      let scenario = createPerlicaScenario();
      scenario.battle.resourceRules.initialSp = 0;
      scenario.battle.resourceRules.spRecoveryPerSecond = 10;
      if (withPowerAttack) {
        scenario = placeSkillGroup({
          scenario,
          trackIndex: 0,
          operator: perlica,
          skillGroupKey: 'finisher',
          startFrame: 390,
          ids: { allocate: kind => `${kind}:contract:power-attack` },
        }).scenario;
      }
      if (withContract) {
        scenario.mechanics.selections.push({
          id: 'selection:contract:103401',
          mechanicId: `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}103401`,
          enabled: true,
          parameters: {},
        });
      }
      return scenario;
    };
    const run = (withContract: boolean, withPowerAttack = false) => {
      const base = standardOptions();
      return runStandardPlayerDamageScenarioSimulation({
        scenario: createScenario(withContract, withPowerAttack),
        endFrame: 450,
        criticalSamples: { nextCriticalSample: () => 1 },
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          ...base,
          index: {
            ...base.index,
            getCommonBuffDefinitions: gameDataRepository.getCommonBuffDefinitions,
            getMechanic: gameDataRepository.getMechanic,
          },
          mechanicAdapters: new MechanicAdapterRegistry([contingencyContractMechanicAdapter]),
        },
      });
    };

    const baseline = run(false);
    const contracted = run(true);
    const resetByPowerAttack = run(true, true);
    const finalSp = (result: typeof baseline) =>
      result.receiptEntries
        .filter(entry => entry.event === 'SpChanged' && entry.data?.source === 'autoRecovery')
        .at(-1)?.data?.currentValue;

    expect(finalSp(baseline)).toBeCloseTo(150);
    expect(finalSp(contracted)).toBeCloseTo(120);
    expect(
      resetByPowerAttack.receiptEntries.some(
        entry =>
          entry.event === 'SpChanged' &&
          entry.frame > 390 &&
          entry.data?.source === 'autoRecovery' &&
          typeof entry.data.actualValue === 'number' &&
          entry.data.actualValue > 0,
      ),
    ).toBe(true);
    expect(
      contracted.receiptEntries.some(
        entry =>
          entry.event === 'BuffApplied' &&
          entry.data?.buffId === 'buff_cc_chr_atb_recoverspeed_down_icon' &&
          entry.data?.sourceActionId ===
            'upgrade-initialization:mechanic:selection:contract:103401:0',
      ),
    ).toBe(true);
  });

  it('does not expose battle-sourced GlobalBuff output as a character combo event', () => {
    const scenario = createGeneratedTeamScenario();
    for (const track of scenario.tracks) {
      if (track !== null) track.skillCasts = [];
    }
    scenario.mechanics.selections.push({
      id: 'selection:contract:100803',
      mechanicId: `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}100803`,
      enabled: true,
      parameters: {},
    });
    const definitions = [arclightGeneratedOperator, perlicaGeneratedOperator];
    const base = standardOptions();

    expect(() =>
      runStandardPlayerDamageScenarioSimulation({
        scenario,
        endFrame: 0,
        criticalSamples: { nextCriticalSample: () => 1 },
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          ...base,
          index: {
            ...base.index,
            getCommonBuffDefinitions: gameDataRepository.getCommonBuffDefinitions,
            getMechanic: gameDataRepository.getMechanic,
            getOperator: slug => definitions.find(operator => operator.slug === slug) ?? null,
          },
          mechanicAdapters: new MechanicAdapterRegistry([contingencyContractMechanicAdapter]),
        },
      }),
    ).not.toThrow();
  });

  it('rejects an unsupported scheduled skill before consuming runtime dependencies', () => {
    const placed = placeSkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:1` },
    }).scenario;
    let criticalSampleCalls = 0;
    let runtimeSnapshotCalls = 0;

    expect(() =>
      runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 60,
        criticalSamples: {
          nextCriticalSample: () => {
            criticalSampleCalls += 1;
            return 1;
          },
        },
        resolveNonRandomRuntimeSnapshot: () => {
          runtimeSnapshotCalls += 1;
          return {
            runtimeExtensionMultiplier: 1,
            appliesIgniteDamageMultiplier: false,
            appliesPhysicalInflictionDamageMultiplier: false,
          };
        },
        options: standardOptions(),
      }),
    ).toThrow(StandardPlayerDamageCompatibilityError);
    expect(criticalSampleCalls).toBe(0);
    expect(runtimeSnapshotCalls).toBe(0);
  });

  it('executes a battle skill with the installed elemental infliction and poise runtimes', () => {
    const placed = placeSkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:1` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 60,
      criticalSamples: new ExplicitCriticalSampleSource([1]),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      elementalInflictionDocument: elementalAttachments,
      options: standardOptions(),
    });

    expect(result.receiptEntries.some(entry => entry.event === 'DamageApplied')).toBe(true);
    const infliction = result.receiptEntries.find(
      entry => entry.event === 'ElementalInflictionApplied',
    );
    expect(infliction?.data?.requestedElement).toBe('electric');
    expect(infliction?.data?.outcomeKind).toBe('attachmentOnly');
    const poise = result.receiptEntries.find(entry => entry.event === 'PoiseApplied');
    expect(poise?.data?.currentPoise).toBe(290);
  });
});
