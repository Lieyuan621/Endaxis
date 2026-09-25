import { describe, expect, it, vi } from 'vitest';
import { createEmptyScenario } from '../../core/project/createProject';
import type { ScenarioDocument } from '../../core/project/schema';
import type { OperatorDefinition } from '../../core/game-data/operatorDefinition';
import { perlica } from '../../data/operators/perlica.generated';
import { getSkill } from '../../data/operators/testUtils';

const perlicaBattleSkill = getSkill(perlica, 'chr_0004_pelica_normal_skill');
import { commonBuffDefinitions } from '../../data/buffs/commonDefinitions';
import { CombatAttributeSet } from '../../core/combat/attributes/combatAttributes';
import {
  placeSkillGroup,
  groupPlacedSkillSequence,
} from '../../ui/timeline/interaction/placeSkillGroup';
import { CombatInputSchedule } from './combatInputSchedule';
import type { CombatSkillInputPhase } from '../../core/combat/runtime/combatFrameInput';
import {
  compileFixedCombatInputSchedule,
  compileCombatInputSchedule,
} from './compileFixedCombatInputSchedule';
import {
  createDefaultCriticalSampleSource,
  ScenarioSimulationService,
  type ScenarioSimulationPerformanceSample,
} from './scenarioSimulationService';

function createPerlicaScenario(): ScenarioDocument {
  const scenario = createEmptyScenario('scenario:service', '服务样本');
  scenario.battle.durationFrames = 900;

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

function createTwoOperatorComboScenario(): {
  readonly scenario: ScenarioDocument;
  readonly attacker: OperatorDefinition;
} {
  const scenario = createPerlicaScenario();
  const attacker: OperatorDefinition = {
    ...perlica,
    slug: 'perlica-combo-test-attacker',
    // 该夹具只模拟“另一名角色的末段普攻”。若复制佩丽卡的角色级连携注册，
    // 攻击者也会按原生规则为自己打开窗口，反而不再是单一触发来源。
    comboSkillConditions: undefined,
  };
  scenario.tracks[0]!.operator!.operatorSlug = attacker.slug;
  scenario.tracks[1] = {
    id: 'track:1',
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
  return { scenario, attacker };
}

function createService(
  cacheLimit?: number,
  performanceNow?: () => number,
): ScenarioSimulationService {
  return new ScenarioSimulationService(
    {
      index: testIndex,
      repositoryRevision: 'test-definitions',
      resources: {
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecoveryPauseDuration: 1.5,
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
      },
      ...(performanceNow === undefined ? {} : { performanceNow }),
    },
    cacheLimit,
  );
}

const testIndex = {
  revision: 'test-definitions',
  getOperator: (slug: string) => (slug === perlica.slug ? perlica : null),
  getCommonBuffDefinitions: () => commonBuffDefinitions,
  getWeapon: () => null,
  getGear: () => null,
  getGearSet: () => null,
};

describe('ScenarioSimulationService', () => {
  it('自定义全局 Buff 与预设同时生效，停用保留定义且不影响同组其他 Buff', () => {
    const scenario = createPerlicaScenario();
    scenario.tracks[1] = { ...structuredClone(scenario.tracks[0]!), id: 'track:1' };
    scenario.globalConfig.enabledPresetIds = ['combo-cdr-50'];
    scenario.globalConfig.customBuffs = [true, false].map((enabled, index) => ({
      id: `scenario:custom-global:${index}`,
      name: 'Critical Rate',
      enabled,
      definition: {
        stackingType: 'unlimited',
        attributeModifiers: [{ attribute: 'criticalRate', slot: 'baseAddition', value: 0.2 }],
      },
    }));
    const service = createService();
    const session = service.createInputCombatSession(scenario, -30);
    const check = (runtime: typeof session.runtime, rate: number) => {
      for (const operator of runtime.readState().operators.values()) {
        const attributes = new CombatAttributeSet(operator.buffs!.attributes);
        expect(attributes.get('criticalRate')).toBeCloseTo(rate);
        expect(attributes.get('ComboSkillCooldownScalar')).toBeCloseTo(0.5);
      }
    };
    check(session.runtime, 0.25);
    check(session.fork(session.runtime.save()).runtime, 0.25);
    scenario.globalConfig.customBuffs[0]!.enabled = false;
    check(service.createInputCombatSession(scenario, -30).runtime, 0.05);
  });
  it('全局修正经全队 Buff 生效，负帧输入前已安装，切面恢复不重复施加', () => {
    const scenario = createPerlicaScenario();
    scenario.tracks[1] = { ...structuredClone(scenario.tracks[0]!), id: 'track:1' };
    scenario.globalConfig.modifiers = [
      { id: 'attack', kind: 'operatorStat', modifier: 'attackPercent', value: 0.2 },
      { id: 'crit', kind: 'operatorStat', modifier: 'criticalRate', value: 0.3 },
      { id: 'damage', kind: 'operatorStat', modifier: 'criticalDamage', value: 0.4 },
      { id: 'arts', kind: 'operatorStat', modifier: 'artsIntensity', value: 50 },
      { id: 'energy', kind: 'operatorStat', modifier: 'ultimateEnergyGainEfficiency', value: 0.2 },
      {
        id: 'cd1',
        kind: 'operatorStat',
        modifier: 'skillCooldownReduction',
        skillType: 'comboSkill',
        value: 0.2,
      },
      {
        id: 'cd2',
        kind: 'operatorStat',
        modifier: 'skillCooldownReduction',
        skillType: 'comboSkill',
        value: 0.2,
      },
    ];
    const session = createService().createInputCombatSession(scenario, -30);
    const check = (runtime: typeof session.runtime) => {
      const state = runtime.readState();
      expect(
        state.instances.globalBuffs.groups.get('scenario:global-attribute-modifiers'),
      ).toHaveLength(1);
      for (const [operatorId, operator] of state.operators) {
        const attributes = new CombatAttributeSet(operator.buffs!.attributes);
        expect(attributes.get('criticalRate')).toBeCloseTo(0.35);
        expect(attributes.get('criticalDamageIncrease')).toBeCloseTo(0.9);
        expect(attributes.get('PhysicalAndSpellInflictionEnhance')).toBeCloseTo(50);
        expect(attributes.get('UltimateSpGainScalar')).toBeCloseTo(1.2);
        expect(attributes.get('ComboSkillCooldownScalar')).toBeCloseTo(0.64);
        const panel = session.compiled.operators.find(
          item => item.operatorId === operatorId,
        )!.panel!;
        expect(attributes.getArmed('Atk')).toBeCloseTo(
          panel.attackBase!.rawValue * (1 + panel.attackBase!.baseMultiplier + 0.2) +
            panel.attackBase!.baseFinalAddition,
        );
        expect(
          [...operator.buffs!.instances.values()].filter(
            buff => buff.identity.definitionId === 'scenario:global-attribute-modifiers',
          ),
        ).toHaveLength(1);
      }
    };
    check(session.runtime);
    const saved = session.runtime.save();
    const branch = session.fork(saved);
    const branchSaved = branch.runtime.save();
    new CombatInputSchedule(branch, []).advanceToFrame(10);
    check(branch.runtime);
    branch.runtime.restore(branchSaved);
    check(branch.runtime);
    check(session.runtime);
  });
  it('继承切在 Dash 与成功之间，只重放历史输入，修改成功时刻可以复用同一切面', async () => {
    const base = createPerlicaScenario();
    base.battle.resourceRules.initialSp = 0;
    base.battle.resourceRules.spRecoveryPerSecond = 0;
    base.battle.dodgeMarkers = [
      {
        id: 'split',
        frame: 1,
        trackIndex: 0,
        direction: 'forward',
        mode: { kind: 'perfectDodge', successDelayFrames: 5 },
      },
    ];
    const inherited = structuredClone(base);
    inherited.inheritance = { frame: 3, sourceScenarioId: base.id };
    const service = createService();
    const create = vi.spyOn(service, 'createInputCombatSession');
    for (const delay of [5, 6, undefined]) {
      inherited.battle.dodgeMarkers![0]!.mode =
        delay === undefined
          ? { kind: 'dodge' }
          : { kind: 'perfectDodge', successDelayFrames: delay };
      const ordinary = structuredClone(inherited);
      delete ordinary.inheritance;
      const resumed = await service.simulate(inherited, 30);
      const full = await createService().simulate(ordinary, 30);
      expect(resumed.receiptEntries).toEqual(full.receiptEntries);
      expect(resumed.finalResources).toEqual(full.finalResources);
      expect(resumed.receiptEntries.filter(e => e.event === 'DashInputExecuted')).toHaveLength(1);
      expect(resumed.finalResources.sp).toBe(delay === undefined ? 0 : 7);
    }
    expect(create).toHaveBeenCalledTimes(1);
  });
  it('负帧连续组历史从原初始化帧重放，继承后回执与资源一致', async () => {
    let identity = 0;
    const base = createPerlicaScenario();
    base.battle.prepFrames = 300;
    const placed = placeSkillGroup({
      scenario: base,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'basicAttack',
      startFrame: -180,
      ids: { allocate: kind => `${kind}:negative:${identity++}` },
    });
    const grouped = groupPlacedSkillSequence(placed.scenario, placed.skillCastIds);
    const inherited = structuredClone(grouped);
    inherited.inheritance = { frame: 180, sourceScenarioId: 'missing' };
    const ordinary = await createService().simulate(grouped, 240);
    const replayed = await createService().simulate(inherited, 240);
    expect(
      ordinary.receiptEntries.some(
        entry => entry.event === 'SkillInputProcessed' && entry.frame < 0,
      ),
    ).toBe(true);
    expect(replayed.receiptEntries).toEqual(ordinary.receiptEntries);
    expect(replayed.finalResources).toEqual(ordinary.finalResources);
  });
  it.each(['continuation', 'compact'] as const)(
    '继承后的 %s 规划复用前缀且与普通规划一致',
    async mode => {
      let identity = 0;
      const placed = placeSkillGroup({
        scenario: createPerlicaScenario(),
        trackIndex: 0,
        operator: perlica,
        skillGroupKey: 'basicAttack',
        startFrame: 90,
        ids: { allocate: kind => `${kind}:${identity++}` },
      });
      const inherited = structuredClone(placed.scenario);
      inherited.inheritance = { frame: 60, sourceScenarioId: 'missing' };
      const service = createService();
      const create = vi.spyOn(service, 'createInputCombatSession');
      const ordinary = await createService().planSkillChain(
        placed.scenario,
        placed.skillCastIds,
        600,
        undefined,
        mode,
      );
      const planned = await service.planSkillChain(
        inherited,
        placed.skillCastIds,
        600,
        undefined,
        mode,
      );
      expect(planned.status).toBe('planned');
      expect(ordinary.status).toBe('planned');
      if (planned.status !== 'planned' || ordinary.status !== 'planned')
        throw new Error('planning failed');
      expect(planned.scenario.tracks).toEqual(ordinary.scenario.tracks);
      expect(planned.run.receiptEntries).toEqual(ordinary.run.receiptEntries);
      expect(create).toHaveBeenCalledTimes(1);
    },
  );
  it('继承续跑与完整重放一致，修改后缀只恢复前缀，清空缓存后才重建', async () => {
    const base = createPerlicaScenario();
    const first = placeSkillGroup({
      scenario: base,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:history` },
    });
    const second = placeSkillGroup({
      scenario: first.scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 180,
      ids: { allocate: kind => `${kind}:future` },
    });
    const inherited = structuredClone(second.scenario);
    inherited.inheritance = { frame: 60, sourceScenarioId: 'missing' };
    const service = createService();
    const create = vi.spyOn(service, 'createInputCombatSession');
    const full = await createService().simulate(second.scenario, 240);
    const restored = await service.simulate(inherited, 240);
    expect(restored.receiptEntries).toEqual(full.receiptEntries);
    expect(restored.finalResources).toEqual(full.finalResources);
    expect(create).toHaveBeenCalledTimes(1);
    const changed = structuredClone(inherited);
    changed.tracks[0]!.skillCasts.find(cast => cast.id === second.skillCastIds[0])!.placement = {
      startFrame: 200,
    };
    const next = await service.simulate(changed, 260);
    const ordinary = structuredClone(changed);
    delete ordinary.inheritance;
    expect(next.receiptEntries).toEqual(
      (await createService().simulate(ordinary, 260)).receiptEntries,
    );
    expect(create).toHaveBeenCalledTimes(1);
    const restyled = structuredClone(changed);
    restyled.tracks[0]!.skillCasts.find(cast => cast.id === first.skillCastIds[0])!.presentation = {
      color: '#abcdef',
      locked: true,
    };
    expect((await service.simulate(restyled, 260)).receiptEntries).toEqual(next.receiptEntries);
    expect(create).toHaveBeenCalledTimes(1);
    service.clearCache();
    await service.simulate(changed, 260);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('继承首帧输入不重复、不遗漏，并拒绝跨边界的未提交连续成员', async () => {
    let identity = 0;
    const placed = placeSkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'basicAttack',
      startFrame: 0,
      ids: { allocate: kind => `${kind}:first:${identity++}` },
    });
    const inherited = structuredClone(placed.scenario);
    inherited.inheritance = { frame: 0, sourceScenarioId: 'missing' };
    expect((await createService().simulate(inherited, 120)).receiptEntries).toEqual(
      (await createService().simulate(placed.scenario, 120)).receiptEntries,
    );
    inherited.inheritance.frame = 1;
    const group = groupPlacedSkillSequence(inherited, placed.skillCastIds);
    expect(placed.skillCastIds.length).toBeGreaterThan(1);
    await expect(createService().simulate(group, 120)).rejects.toThrow('crosses');
  });

  it('排程回调只能在当前输入阶段提交，不能保留端口或改写其他帧', () => {
    const session = createService().createInputCombatSession(createPerlicaScenario());
    let retained: CombatSkillInputPhase | undefined;
    session.runtime.applyInitialInput({
      skills: phase => {
        retained = phase;
        expect(() =>
          phase.submit({ frame: 1, operatorId: 'track:0', skillId: 'basicAttack1' }, 1),
        ).toThrow('current frame input phase');
      },
    });
    expect(() =>
      retained!.canContinue({ frame: 0, operatorId: 'track:0', skillId: 'basicAttack1' }),
    ).toThrow('current frame input phase');
    expect(session.runtime.readReceipts(undefined, new Set(['SkillStarted'])).entries).toEqual([]);
  });

  it('逐帧会话不预装后续自定义技能，并在输入提交时按同一释放身份执行', () => {
    const placed = placeSkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:custom` },
    }).scenario;
    const cast = placed.tracks[0]!.skillCasts[0]!;
    cast.customDefinition = {
      ...perlicaBattleSkill,
      timelineBlockFrames: 1,
      naturalDurationFrames: 1,
      scheduledSequences: [],
    };
    const service = createService();
    const session = service.createInputCombatSession(placed);
    const schedule = service.compileInputSchedule(placed);
    expect(() => service.compileFixedInputs(placed)).toThrow(
      'custom skill definitions require a compiled input schedule',
    );
    expect(schedule.customSkillPrograms[0]?.program.timelineBlockFrames).toBe(1);
    expect(session.compiled.operators[0]!.skillCasts).toBeUndefined();

    const driver = new CombatInputSchedule(
      session,
      schedule.inputs,
      schedule.groups,
      schedule.customSkillPrograms,
    );
    driver.advanceToFrame(3);
    expect(
      session.runtime
        .readHistory()
        .toArray()
        .some(entry => entry.event === 'SkillStarted' && entry.data?.castId === cast.id),
    ).toBe(true);
  });

  it('同一保存点可用同一释放 ID 试验不同自定义定义，分支互不污染', () => {
    const base = createPerlicaScenario();
    const first = placeSkillGroup({
      scenario: base,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:candidate` },
    });
    const second = placeSkillGroup({
      scenario: first.scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'plungingAttack',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:after-candidate` },
    });
    const placed = groupPlacedSkillSequence(second.scenario, [
      ...first.skillCastIds,
      ...second.skillCastIds,
    ]);
    const cast = placed.tracks[0]!.skillCasts[0]!;
    const followingCastId = second.skillCastIds[0]!;
    const short = structuredClone(placed);
    short.tracks[0]!.skillCasts[0]!.customDefinition = {
      ...perlicaBattleSkill,
      timelineBlockFrames: 0,
      costs: [],
      scheduledSequences: [],
    };
    const long = structuredClone(placed);
    long.tracks[0]!.skillCasts[0]!.customDefinition = {
      ...perlicaBattleSkill,
      timelineBlockFrames: perlicaBattleSkill.timelineBlockFrames,
      costs: [],
      scheduledSequences: [],
    };
    const service = createService();
    const parent = new CombatInputSchedule(service.createInputCombatSession(base), []);
    const saved = parent.save();
    const shortSchedule = service.compileInputSchedule(short);
    const longSchedule = service.compileInputSchedule(long);
    expect(shortSchedule.inputs[0]!.skills![0]!.castId).toBe(cast.id);
    expect(longSchedule.inputs[0]!.skills![0]!.castId).toBe(cast.id);

    const branch = (schedule: ReturnType<ScenarioSimulationService['compileInputSchedule']>) =>
      parent.forkWithInputsAfterCheckpoint(
        saved,
        schedule.inputs,
        schedule.groups,
        schedule.customSkillPrograms,
      );
    const shortBranch = branch(shortSchedule);
    const longBranch = branch(longSchedule);
    const shortRetry = branch(shortSchedule);
    shortBranch.advanceToFrame(3);
    const afterCustomInput = shortBranch.save();
    const restoredShortBranch = shortBranch.fork(afterCustomInput);
    shortBranch.advanceToFrame(40);
    restoredShortBranch.advanceToFrame(40);
    longBranch.advanceToFrame(40);
    shortRetry.advanceToFrame(40);
    const followingInputFrame = (driver: CombatInputSchedule) =>
      driver.session.runtime
        .readHistory()
        .toArray()
        .find(
          entry => entry.event === 'SkillInputProcessed' && entry.data?.castId === followingCastId,
        )!.frame;
    expect(followingInputFrame(shortBranch)).toBeLessThan(followingInputFrame(longBranch));
    expect(restoredShortBranch.session.runtime.readState()).toEqual(
      shortBranch.session.runtime.readState(),
    );
    expect(shortRetry.session.runtime.readState()).toEqual(shortBranch.session.runtime.readState());
    expect(parent.session.runtime.readState().shared.clock.frame).toBe(0);
    shortBranch.discardCheckpoint(afterCustomInput);
    parent.discardCheckpoint(saved);
  });

  it('外部连续组在截面恢复后沿实际边界接续，与正常排程投影一致', () => {
    let id = 0;
    const placed = placeSkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'basicAttack',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:group:${id++}` },
    });
    const scenario = groupPlacedSkillSequence(placed.scenario, placed.skillCastIds);
    const schedule = compileCombatInputSchedule(scenario, testIndex);
    expect(schedule.groups.length).toBeGreaterThan(0);
    const service = createService();
    const driver = new CombatInputSchedule(
      service.createInputCombatSession(scenario),
      schedule.inputs,
      schedule.groups,
    );
    driver.advanceToFrame(2);
    const saved = driver.save();
    const branch = driver.fork(saved);
    driver.advanceToFrame(300);
    branch.advanceToFrame(300);
    expect(branch.session.runtime.readState()).toEqual(driver.session.runtime.readState());
    const scheduled = service.createCombatSession(scenario, 300);
    scheduled.advanceToFrame(300);
    expect(branch.session.collectResult()).toEqual(scheduled.collectResult());
    expect(
      branch.session.runtime.readReceipts(undefined, new Set(['SkillStarted'])).entries.length,
    ).toBeGreaterThan(1);
    driver.discardCheckpoint(saved);
  });

  it('重新指定保存点后的输入时撤销未开始组，并保留已经启动的组及其游标', () => {
    let id = 0;
    const first = placeSkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'basicAttack',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:active:${id++}` },
    });
    let scenario = groupPlacedSkillSequence(first.scenario, first.skillCastIds);
    const future = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'basicAttack',
      startFrame: 180,
      ids: { allocate: kind => `${kind}:future:${id++}` },
    });
    scenario = groupPlacedSkillSequence(future.scenario, future.skillCastIds);
    const schedule = compileCombatInputSchedule(scenario, testIndex);
    const driver = new CombatInputSchedule(
      createService().createInputCombatSession(scenario),
      schedule.inputs,
      schedule.groups,
    );
    driver.advanceToFrame(2);
    const saved = driver.save();
    const withoutPendingInputs = driver.forkWithInputsAfterCheckpoint(saved, []);

    driver.advanceToFrame(500);
    withoutPendingInputs.advanceToFrame(500);
    const parentStarts = driver.session.runtime
      .readHistory()
      .toArray()
      .filter(entry => entry.event === 'SkillStarted')
      .map(entry => entry.data?.castId);
    const branchStarts = withoutPendingInputs.session.runtime
      .readHistory()
      .toArray()
      .filter(entry => entry.event === 'SkillStarted')
      .map(entry => entry.data?.castId);
    expect(branchStarts).toEqual(expect.arrayContaining([...first.skillCastIds]));
    expect(branchStarts.some(castId => future.skillCastIds.includes(String(castId)))).toBe(false);
    expect(parentStarts.some(castId => future.skillCastIds.includes(String(castId)))).toBe(true);
    driver.discardCheckpoint(saved);
  });

  it('替换尚未提交的固定输入时允许复用原 castId', () => {
    const placed = placeSkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 180,
      ids: { allocate: kind => `${kind}:replace` },
    }).scenario;
    const originalCastId = placed.tracks[0]!.skillCasts[0]!.id;
    const service = createService();
    const schedule = compileCombatInputSchedule(placed, testIndex);
    const driver = new CombatInputSchedule(
      service.createInputCombatSession(placed),
      schedule.inputs,
      schedule.groups,
    );
    const saved = driver.save();
    const replacement = driver.forkWithInputsAfterCheckpoint(saved, [
      {
        frame: 10,
        skills: [
          {
            operatorId: 'track:0',
            skillId: 'chr_0004_pelica_plunging_attack_end',
            castId: originalCastId,
            declarationOrder: 0,
          },
        ],
      },
    ]);
    replacement.advanceToFrame(20);
    expect(
      replacement.session.runtime
        .readHistory()
        .toArray()
        .find(entry => entry.event === 'SkillStarted' && entry.data?.castId === originalCastId)
        ?.data?.skillId,
    ).toBe('chr_0004_pelica_plunging_attack_end');
    expect(driver.session.runtime.readState().shared.clock.frame).toBe(0);
    driver.discardCheckpoint(saved);
  });

  it.each(['empty', 'fixed', 'group'] as const)(
    '截面后新增连续组，保留 %s 进度且候选不污染父分支',
    prefixKind => {
      let id = 0;
      const place = (scenario: ScenarioDocument, startFrame: number) => {
        const placed = placeSkillGroup({
          scenario,
          trackIndex: 0,
          operator: perlica,
          skillGroupKey: 'basicAttack',
          startFrame,
          ids: { allocate: kind => `${kind}:added:${id++}` },
        });
        return groupPlacedSkillSequence(placed.scenario, placed.skillCastIds);
      };
      const prefix =
        prefixKind === 'group' ? place(createPerlicaScenario(), 1) : createPerlicaScenario();
      if (prefixKind === 'fixed') {
        prefix.tracks[0]!.skillCasts = placeSkillGroup({
          scenario: prefix,
          trackIndex: 0,
          operator: perlica,
          skillGroupKey: 'plungingAttack',
          startFrame: 1,
          ids: { allocate: kind => `${kind}:prefix` },
        }).scenario.tracks[0]!.skillCasts;
      }
      const service = createService();
      const schedule = compileCombatInputSchedule(prefix, testIndex);
      const driver = new CombatInputSchedule(
        service.createInputCombatSession(prefix),
        schedule.inputs,
        schedule.groups,
      );
      driver.advanceToFrame(2);
      const saved = driver.save();
      const before = driver.session.runtime.readState();
      const candidate = place(prefix, 180);
      candidate.battle.controlSwitches = [{ id: 'switch', frame: 180, trackIndex: 0 }];
      candidate.battle.externalEventMarkers = [
        {
          id: 'weakness',
          frame: 180,
          target: { scope: 'team' },
          event: { kind: 'comboCooldownControl', mode: 'cooldown' },
        },
      ];
      const planned = compileCombatInputSchedule(candidate, testIndex);
      const additions = planned.inputs.filter(input => input.frame >= 180);
      const groups = planned.groups.slice(schedule.groups.length);
      expect(() => driver.fork(saved, [{ frame: 2 }])).toThrow('saved input boundary');
      const branch = driver.fork(saved, additions, groups);
      branch.advanceToFrame(500);
      const reference = service.createCombatSession(candidate, 500);
      reference.advanceToFrame(500);
      expect(branch.session.collectResult()).toEqual(reference.collectResult());
      expect(driver.session.runtime.readState()).toEqual(before);
      const retry = driver.fork(saved, additions, groups);
      retry.advanceToFrame(500);
      expect(retry.session.runtime.readState()).toEqual(branch.session.runtime.readState());
      driver.discardCheckpoint(saved);
    },
  );

  it('在同一份回执上投影资源、敌人生命、失衡和技能诊断', async () => {
    const scenario = createPerlicaScenario();
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'plungingAttack',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:1` },
    }).scenario;

    const run = await createService().simulate(placed, 4);

    const damage = run.receiptEntries.find(entry => entry.event === 'DamageApplied');
    expect(damage).toBeDefined();
    expect(run.enemyHealthCurve.points.at(-1)?.value).toBe(run.finalEnemyHealth);
    // 单节点失衡账本以敌人帧制失衡规则为初始值。
    expect(run.poiseCurve.maxValue).toBe(300);
    expect(run.poiseCurve.points[0]).toMatchObject({ value: 300 });
    // 下落攻击依赖未建模的腾空状态；显式排轴仍执行，但不再拿 A1 默认路由制造误报。
    expect(run.availabilityDiagnostics).toEqual([]);
    expect(run.executionDiagnostics).toEqual([]);
    expect(run.resourceCurves.sp.points[0]).toMatchObject({ value: run.initialResources.sp });
  });

  it('战技在附着与失衡运行时接入后可以完整执行', async () => {
    const scenario = createPerlicaScenario();
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:1` },
    }).scenario;

    const run = await createService().simulate(placed, 60);

    expect(run.receiptEntries.some(entry => entry.event === 'ElementalInflictionApplied')).toBe(
      true,
    );
    expect(run.receiptEntries.some(entry => entry.event === 'PoiseApplied')).toBe(true);
    expect(run.receiptEntries.some(entry => entry.event === 'DamageApplied')).toBe(true);
  });

  it('连携技按原生公共 Buff 链施加导电并保留完整持续时间', async () => {
    const scenario = createPerlicaScenario();
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'comboSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:1` },
    }).scenario;

    const run = await createService().simulate(placed, 240);

    const conduct = run.receiptEntries.find(
      entry =>
        entry.event === 'BuffApplied' &&
        entry.data?.buffId === 'buff_common_pulse_pulse_conduct_triggered_do',
    );
    expect(conduct).toMatchObject({ targetId: 'enemy', data: { layers: 1 } });
    if (conduct === undefined) throw new Error('expected Perlica conduct Buff receipt');
    const finished = run.receiptEntries.find(
      entry =>
        entry.event === 'BuffFinished' &&
        entry.data?.buffId === 'buff_common_pulse_pulse_conduct_triggered_do',
    );
    expect((finished?.frame ?? 0) - conduct.frame).toBeGreaterThanOrEqual(150);
    expect((finished?.frame ?? 0) - conduct.frame).toBeLessThanOrEqual(152);
    expect(run.receiptEntries.some(entry => entry.event === 'DamageApplied')).toBe(true);
    expect(run.receiptEntries.some(entry => entry.event === 'PoiseApplied')).toBe(true);
    expect(run.comboWindowDiagnostics[0]?.reasons).toEqual(['windowMissing']);
  });

  it('由队友末段普攻开启佩丽卡窗口并在后续输入中消费', async () => {
    const { scenario, attacker } = createTwoOperatorComboScenario();
    let nextId = 0;
    const ids = { allocate: (kind: string) => `${kind}:${++nextId}` };
    const withTrigger = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: attacker,
      skillGroupKey: 'basicAttack',
      skillKey: 'chr_0004_pelica_attack4',
      startFrame: 1,
      ids,
    }).scenario;
    const withCombo = placeSkillGroup({
      scenario: withTrigger,
      trackIndex: 1,
      operator: perlica,
      skillGroupKey: 'comboSkill',
      startFrame: 30,
      ids,
    }).scenario;
    const service = new ScenarioSimulationService({
      index: {
        getOperator: slug =>
          slug === attacker.slug ? attacker : slug === perlica.slug ? perlica : null,
        getWeapon: () => null,
        getGear: () => null,
        getGearSet: () => null,
        getCommonBuffDefinitions: () => commonBuffDefinitions,
      },
      resources: {
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecoveryPauseDuration: 1.5,
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
      },
    });

    const run = await service.simulate(withCombo, 90);
    const opened = run.receiptEntries.find(entry => entry.event === 'ComboWindowOpened');
    const consumed = run.receiptEntries.find(entry => entry.event === 'ComboWindowConsumed');

    // 第28帧发射；Default 投射物 Tick 在下一帧命中后才触发末段普攻事件。
    expect(opened).toMatchObject({ frame: 29, sourceId: 'track:1' });
    expect(consumed).toMatchObject({ frame: 30, sourceId: 'track:1' });
    expect(opened!.sequence).toBeLessThan(consumed!.sequence);
    expect(run.comboWindowDiagnostics).toEqual([]);
    expect(
      run.receiptEntries.some(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:1',
      ),
    ).toBe(true);
  });

  it('重复施加附着时按 SkillSetting 真实打出爆发伤害', async () => {
    const scenario = createPerlicaScenario();
    const ids = { allocate: (kind: string) => `${kind}:${Math.random()}` };
    const first = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids,
    }).scenario;
    const second = placeSkillGroup({
      scenario: first,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 40,
      ids,
    }).scenario;
    const service = new ScenarioSimulationService({
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
      spellInflictionSettings: {
        schemaVersion: 1,
        revision: 'test',
        data: [
          {
            key: '法术爆发伤害倍率',
            values: [1.5, 2, 2.5, 3],
            enhanceFormulaKey: '',
          },
        ],
        enhanceFormulas: [],
      },
    });

    const run = await service.simulate(second, 120);

    const bursts = run.receiptEntries.filter(
      entry => entry.event === 'DamageApplied' && typeof entry.data?.spellBurstType === 'string',
    );
    expect(bursts.length).toBeGreaterThan(0);
    expect(bursts[0]?.data?.spellBurstType).toBe('Pulse');
    expect((bursts[0]?.data?.value ?? 0) as number).toBeGreaterThan(0);
    expect(run.finalEnemyHealth).toBeLessThan(run.enemy.health);
  });

  it('完整生成爆发已携带 SkillSetting 数值，不再需要旧聚合入口的运行时表', async () => {
    const scenario = createPerlicaScenario();
    const ids = { allocate: (kind: string) => `${kind}:${Math.random()}` };
    const first = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids,
    }).scenario;
    const second = placeSkillGroup({
      scenario: first,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 40,
      ids,
    }).scenario;

    const run = await createService().simulate(second, 120);
    const hits = run.receiptEntries.filter(
      entry => entry.event === 'DamageApplied' && entry.data?.spellBurstType === 'Pulse',
    );
    expect(hits).toHaveLength(1);
    expect(Number(hits[0]!.data!.value)).toBeGreaterThan(0);
  });

  it('相同场景内容与目标帧复用已冻结运行结果', async () => {
    const scenario = createPerlicaScenario();
    const service = createService();

    const first = await service.simulate(scenario, 30);
    const second = await service.simulate(scenario, 30);

    expect(second).toBe(first);
    expect(Object.isFrozen(second.receiptEntries)).toBe(true);
  });

  it('发布可堆叠的模拟阶段耗时并区分缓存命中', async () => {
    let now = 0;
    const service = createService(undefined, () => now++);
    const samples: ScenarioSimulationPerformanceSample[] = [];
    const unsubscribe = service.subscribePerformance(sample => samples.push(sample));

    await service.simulate(createPerlicaScenario(), 30);
    await service.simulate(createPerlicaScenario(), 30);
    unsubscribe();

    expect(samples).toHaveLength(2);
    expect(samples[0]).toMatchObject({
      totalMs: 3,
      cacheLookupMs: 1,
      simulationMs: 1,
      projectionMs: 1,
      cacheHit: false,
      outcome: 'completed',
    });
    expect(samples[1]).toMatchObject({
      totalMs: 2,
      cacheLookupMs: 2,
      simulationMs: 0,
      projectionMs: 0,
      cacheHit: true,
      outcome: 'completed',
    });
  });

  it('场景内容变化后不再命中旧缓存', async () => {
    const service = createService();
    const scenario = createPerlicaScenario();
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'plungingAttack',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:1` },
    }).scenario;

    const emptyRun = await service.simulate(scenario, 30);
    const placedRun = await service.simulate(placed, 30);

    expect(placedRun).not.toBe(emptyRun);
    expect(placedRun.receiptEntries.some(entry => entry.event === 'DamageApplied')).toBe(true);
  });

  it('拒绝已中止的请求', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      createService().simulate(createPerlicaScenario(), 30, controller.signal),
    ).rejects.toThrow('aborted');
  });

  it('超过容量时淘汰最早完成的运行结果', async () => {
    const service = createService(1);
    const first = await service.simulate(createPerlicaScenario(), 30);
    const secondScenario = createPerlicaScenario();
    secondScenario.enemy.editable.hp = 200000;
    const second = await service.simulate(secondScenario, 30);

    expect(second).not.toBe(first);
    expect(service.findCached(secondScenario, 30)).toBe(second);
  });

  it('完整会话仅在输入时提交技能种子，未来候选换种子不改父分支', () => {
    const scenario = placeSkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'plungingAttack',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:seeded` },
    }).scenario;
    scenario.battle.random = { mode: 'sampled', globalSeed: 123 };
    const cast = scenario.tracks[0]!.skillCasts[0]!;
    cast.simulationInputs = { randomSeed: 7 };
    const parent = createService().createCombatSession(scenario, 30);
    const saved = parent.runtime.save();
    expect(parent.runtime.readState().environment!.random!.submittedCastSeeds.size).toBe(0);
    const branch = parent.fork(saved, {
      ...parent.compiled,
      inputs: parent.compiled.inputs!.map(input => ({
        ...input,
        simulationInputs: { ...input.simulationInputs, randomSeed: 99 },
      })),
    });
    branch.advanceToFrame(30);
    expect(branch.runtime.readState().environment!.random!.submittedCastSeeds.get(cast.id)).toBe(
      99,
    );
    expect(parent.runtime.readState().environment!.random!.submittedCastSeeds.size).toBe(0);
    parent.advanceToFrame(30);
    expect(parent.runtime.readState().environment!.random!.submittedCastSeeds.get(cast.id)).toBe(7);
    const result = parent.runtime.readState();
    parent.runtime.restore(saved);
    parent.advanceToFrame(30);
    expect(parent.runtime.readState()).toEqual(result);
  });

  it.each(['expected', 'sampled'] as const)(
    '%s 模式下技能块种子隔离同轨前面新增技能的暴击取样',
    async mode => {
      const empty = createPerlicaScenario();
      empty.battle.random = { mode, globalSeed: 123 };
      empty.globalConfig.modifiers = [
        { id: 'global:crit', kind: 'operatorStat', modifier: 'criticalRate', value: 0.3 },
      ];
      const later = placeSkillGroup({
        scenario: empty,
        trackIndex: 0,
        operator: perlica,
        skillGroupKey: 'battleSkill',
        startFrame: 180,
        ids: { allocate: kind => `${kind}:later` },
      }).scenario;
      const laterCast = later.tracks[0]!.skillCasts[0]!;
      laterCast.simulationInputs = { randomSeed: 7 };
      const withEarlier = placeSkillGroup({
        scenario: structuredClone(later),
        trackIndex: 0,
        operator: perlica,
        skillGroupKey: 'battleSkill',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:earlier` },
      }).scenario;
      const service = createService();
      const hits = async (scenario: ScenarioDocument) =>
        (await service.simulate(scenario, 240)).receiptEntries
          .filter(
            entry =>
              entry.event === 'DamageApplied' &&
              entry.data?.castId === laterCast.id &&
              entry.data?.stepKey !== undefined,
          )
          .map(entry => ({
            stepKey: entry.data?.stepKey,
            isCritical: entry.data?.isCritical,
            criticalRate: entry.data?.criticalRate,
          }));
      const baseline = await hits(later);
      expect(baseline.length).toBeGreaterThan(0);
      expect(await hits(withEarlier)).toEqual(baseline);
    },
  );

  it('逐帧应用会话不编译未来放置，新施放及恢复使用正式伤害投影', () => {
    const scenario = placeSkillGroup({
      scenario: createPerlicaScenario(),
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'plungingAttack',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:live` },
    }).scenario;
    scenario.battle.controlSwitches = [
      { id: 'off', frame: 0, trackIndex: 1 },
      { id: 'on', frame: 1, trackIndex: 0 },
    ];
    scenario.battle.externalEventMarkers = [
      {
        id: 'weakness',
        frame: 1,
        target: { scope: 'team' },
        event: { kind: 'comboCooldownControl', mode: 'cooldown' },
      },
    ];
    const service = createService();
    const scheduled = service.createCombatSession(scenario, 30);
    const input = scheduled.compiled.inputs![0]!;
    const live = service.createInputCombatSession(scenario);
    expect(live.compiled.inputs).toEqual([]);
    expect(live.compiled.operators.every(operator => operator.skills.length === 0)).toBe(true);
    const saved = live.runtime.save();
    const initial = live.runtime.readState();
    const branch = live.fork(saved);
    const driver = new CombatInputSchedule(
      branch,
      compileFixedCombatInputSchedule(scenario, testIndex),
    );
    driver.advanceToFrame(input.frame);
    const active = branch.runtime.save();
    driver.advanceToFrame(15);
    const cursor = branch.runtime.readReceipts(undefined, new Set(['SkillStarted']));
    expect(cursor.entries).toHaveLength(1);
    expect(cursor.entries[0]!.data!.castId).toBe(input.castId);
    driver.advanceToFrame(30);
    expect(branch.runtime.readReceipts(cursor.cursor, new Set(['SkillStarted'])).entries).toEqual(
      [],
    );
    scheduled.advanceToFrame(30);
    expect(branch.collectResult()).toEqual(scheduled.collectResult());
    const completed = branch.runtime.readState();
    branch.runtime.restore(active);
    expect(() => driver.advanceToFrame(30)).toThrow('previous combat generation');
    expect(
      () => new CombatInputSchedule(branch, [{ frame: input.frame, skills: [input] }]),
    ).toThrow('after the saved input boundary');
    new CombatInputSchedule(branch, []).advanceToFrame(30);
    expect(branch.runtime.readState()).toEqual(completed);
    expect(live.runtime.readState()).toEqual(initial);
  });

  it('默认暴击策略为每次新建的确定性均匀样本流', () => {
    const samples = createDefaultCriticalSampleSource();
    expect(samples.nextCriticalSample()).toBe(0.5);
    expect(samples.nextCriticalSample()).toBe(0.25);
    expect(createDefaultCriticalSampleSource().nextCriticalSample()).toBe(0.5);
  });
});
