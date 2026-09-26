import { describe, expect, it } from 'vitest';
import { ActionGraphDefinitionRepository } from '../../../core/compiler/actionGraphDefinitionRepository';
import { perlica } from '../../../data/operators/perlica.generated';
import { rossi } from '../../../data/operators/rossi.generated';
import { commonBuffDefinitions } from '../../../data/buffs/commonDefinitions';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { DodgeMarkerDocument, ScenarioDocument } from '../../../core/project/schema';
import { prepareStandardPlayerDamageScenarioRuntime } from '../../../application/simulation/runStandardPlayerDamageScenarioSimulation';
import { createStandardPlayerDamageCombatSession } from '../../../application/simulation/standardPlayerDamageCombatSession';
import { CombatRuntimeAssembly } from '../../../core/combat/runtime/combatRuntimeAssembly';
import { swapTimelineTracks } from '../../../ui/timeline/interaction/timelineDocumentCommands';
import { compileScenarioDodgeInputs } from '../../../core/compiler/compileScenarioRuntimeAssembly';
import { createInheritedScenario } from '../../../application/editor/scenarioInheritance';
import { CombatObjectOrigins } from '../../../core/projection/combatObjectOrigins';
import { projectDodgeMarkerEffects } from '../../../core/projection/dodgeMarkerEffects';

function scenario(): ScenarioDocument {
  const result = createEmptyScenario('review', '闪避审查');
  result.battle.resourceRules.initialSp = 300;
  result.battle.resourceRules.spRecoveryPerSecond = 0;
  result.tracks[0] = {
    id: 'op',
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
  return result;
}

function marker(id: string, frame: number, delay?: number): DodgeMarkerDocument {
  return {
    id,
    frame,
    trackIndex: 0,
    direction: 'forward',
    mode:
      delay === undefined ? { kind: 'dodge' } : { kind: 'perfectDodge', successDelayFrames: delay },
  };
}

function prepare(value = scenario(), live = false) {
  return prepareStandardPlayerDamageScenarioRuntime({
    scenario: value,
    endFrame: 90,
    criticalSamples: { nextCriticalSample: () => 1 },
    resolveNonRandomRuntimeSnapshot: () => ({
      runtimeExtensionMultiplier: 1,
      appliesIgniteDamageMultiplier: false,
      appliesPhysicalInflictionDamageMultiplier: false,
    }),
    options: {
      ...(live ? { liveInputInitialFrame: 0 } : {}),
      index: {
        actionPrograms: new ActionGraphDefinitionRepository(),
        getCommonDefinitionSources: () => [
          { id: 'shared', buffDefinitions: commonBuffDefinitions },
        ],
        getOperator: slug => (slug === rossi.slug ? rossi : perlica),
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
    },
  });
}

describe('闪避输入、恢复与连续组集成', () => {
  it('全局时间膨胀减缓中心状态的攻击接续窗口', () => {
    const runtime = new CombatRuntimeAssembly(prepare(scenario(), true).compiled);
    runtime.applyInitialInput({});
    expect(runtime.timeDilation).not.toBeNull();
    runtime.timeDilation!.startGlobal({
      durationSeconds: 1,
      slot: 'test/center-window',
      priority: 1,
      curve: () => 0.5,
    });
    runtime.advanceInputFrame({
      dodges: [{ kind: 'dash', dodgeId: 'slowed', operatorId: 'op', direction: 'forward' }],
    });
    const center = runtime.stateGraph.operators.get('op')!.center;
    expect(center.attackAllowRemainingFrames).toBeCloseTo(10.5);
    runtime.advanceInputFrame({});
    expect(center.attackAllowRemainingFrames).toBeCloseTo(10);
    expect(center.attackBlockRemainingFrames).toBeCloseTo(2.5);
    expect(runtime.stateGraph.shared.multiDash.framesSinceLastDash).toBeCloseTo(0.5);
  });

  it('干员局部膨胀只减慢中心窗口，不减慢全队共享闪避间隔', () => {
    const runtime = new CombatRuntimeAssembly(prepare(scenario(), true).compiled);
    runtime.applyInitialInput({});
    runtime.timeDilation!.startEntity({
      entityId: 'op',
      durationSeconds: 1,
      slot: 'test/local-center-window',
      priority: 1,
      curve: () => 0.5,
    });
    runtime.advanceInputFrame({
      dodges: [{ kind: 'dash', dodgeId: 'local-slowed', operatorId: 'op', direction: 'forward' }],
    });
    runtime.advanceInputFrame({});
    expect(runtime.stateGraph.operators.get('op')!.center.attackAllowRemainingFrames).toBeCloseTo(
      10,
    );
    expect(runtime.stateGraph.shared.multiDash.framesSinceLastDash).toBe(1);
  });

  it('洛茜 A1 经过原生记录点后闪避会接 A2', () => {
    const value = scenario();
    value.tracks[0]!.operator!.operatorSlug = rossi.slug;
    const runtime = new CombatRuntimeAssembly(prepare(value, true).compiled);
    runtime.applyInitialInput({
      skills: [
        {
          operatorId: 'op',
          skillId: 'chr_0028_wulfa_attack1',
          action: 'basicAttack',
          castId: 'a1',
        },
      ],
    });
    for (let frame = 1; frame < 9; frame += 1) runtime.advanceInputFrame({});
    runtime.advanceInputFrame({
      dodges: [
        { kind: 'dash', dodgeId: 'rossi-interrupt', operatorId: 'op', direction: 'forward' },
      ],
    });
    expect(
      runtime.receipt.entries.find(entry => entry.event === 'DashInputExecuted')?.data,
    ).toMatchObject({ interruptedCastId: 'a1' });
    expect(runtime.stateGraph.operators.get('op')!.ability.comboOffsetTargetSkillKey).toBe(
      'chr_0028_wulfa_attack2',
    );
  });

  it('极限闪避原生收益保留输入动作的来源路径', () => {
    const value = scenario();
    value.battle.dodgeMarkers = [marker('origin', 1, 0)];
    const runtime = new CombatRuntimeAssembly(prepare(value).compiled);
    runtime.advanceFrames(3);
    const origins = new CombatObjectOrigins(runtime.receipt.entries);
    const dodge = { kind: 'action', ownerId: 'op', actionId: 'dash:origin' } as const;
    for (const event of [
      'DashInputExecuted',
      'BuffApplied',
      'SpChanged',
      'DashEnergyChanged',
      'TimeDilationStarted',
      'PerfectDodgeSucceeded',
      'SkillStarted',
      'PerfectDodgeSkillStarted',
    ]) {
      const facts = runtime.receipt.entries.filter(entry => entry.event === event);
      expect(facts.length, event).toBeGreaterThan(0);
      for (const fact of facts) {
        const trace = origins.findAncestor(
          origins.get({ kind: 'receipt', sequence: fact.sequence }),
          node =>
            node.ref.kind === 'action' &&
            node.ref.ownerId === dodge.ownerId &&
            node.ref.actionId === dodge.actionId,
        );
        expect(trace.status, `${event} #${fact.sequence}`).toBe('found');
      }
    }
    const effects = projectDodgeMarkerEffects(runtime.receipt.entries, 'op', 'origin');
    expect(effects.some(entry => entry.event === 'SpChanged')).toBe(true);
    expect(effects.some(entry => entry.event === 'TimeDilationStarted')).toBe(true);
    expect(effects.some(entry => entry.event === 'BuffApplied')).toBe(true);
    expect(effects.some(entry => entry.event === 'SkillStarted')).toBe(true);
  });

  it.each([
    [1, 'chr_0004_pelica_attack1'],
    [9, 'chr_0004_pelica_attack2'],
  ] as const)('佩丽卡 A1 执行 %i 帧后闪避，保留目标 %s', (frames, expected) => {
    const runtime = new CombatRuntimeAssembly(prepare(scenario(), true).compiled);
    runtime.applyInitialInput({
      skills: [
        {
          operatorId: 'op',
          skillId: 'chr_0004_pelica_attack1',
          action: 'basicAttack',
          castId: 'a1',
        },
      ],
    });
    for (let frame = 1; frame < frames; frame += 1) {
      runtime.advanceInputFrame({});
    }
    runtime.advanceInputFrame({
      dodges: [{ kind: 'dash', dodgeId: 'interrupt', operatorId: 'op', direction: 'forward' }],
    });
    expect(runtime.stateGraph.operators.get('op')!.ability.comboOffsetTargetSkillKey).toBe(
      expected,
    );
    expect(runtime.stateGraph.operators.get('op')!.ability.comboOffsetModifier).not.toBeNull();
  });

  it('同帧先执行全部 Dash，旧标签的零延迟声明也不能借用新监听器', () => {
    const value = scenario();
    value.battle.resourceRules.initialSp = 0;
    value.battle.dodgeMarkers = [marker('old', 1, 0), marker('new', 1)];
    const fixed = new CombatRuntimeAssembly(prepare(value).compiled);
    fixed.advanceFrames(2);
    const live = new CombatRuntimeAssembly(prepare(scenario(), true).compiled);
    live.applyInitialInput({});
    live.advanceInputFrame({
      dodges: [
        { kind: 'dash', dodgeId: 'old', operatorId: 'op', direction: 'forward' },
        { kind: 'perfectDodgeSuccess', dodgeId: 'old', operatorId: 'op' },
        { kind: 'dash', dodgeId: 'new', operatorId: 'op', direction: 'forward' },
      ],
    });
    expect(fixed.resources.sp).toBe(0);
    for (const runtime of [fixed, live]) {
      expect(runtime.receipt.entries.some(e => e.event === 'PerfectDodgeSkillStarted')).toBe(false);
      expect(
        runtime.receipt.entries.find(e => e.event === 'PerfectDodgeDeclarationForced')?.data,
      ).toMatchObject({ dodgeId: 'old', dashNotActive: true });
    }
  });

  it('声明后同帧显式技能接管，也不会丢失隐藏技能的来源标签', () => {
    const runtime = new CombatRuntimeAssembly(prepare(scenario(), true).compiled);
    runtime.applyInitialInput({});
    runtime.advanceInputFrame({
      dodges: [
        { kind: 'dash', dodgeId: 'source', operatorId: 'op', direction: 'forward' },
        { kind: 'perfectDodgeSuccess', dodgeId: 'source', operatorId: 'op' },
      ],
      skills: [
        {
          operatorId: 'op',
          skillId: 'chr_0004_pelica_attack1',
          action: 'basicAttack',
          castId: 'attack',
        },
      ],
    });
    expect(
      runtime.receipt.entries.find(e => e.event === 'PerfectDodgeSkillStarted')?.data?.dodgeId,
    ).toBe('source');
    expect(runtime.stateGraph.operators.get('op')!.center.pendingPerfectDodgeId).toBeNull();
  });

  it('对照：普通闪避无技力奖励，零延迟极限闪避有 7 点奖励', () => {
    for (const delay of [undefined, 0]) {
      const value = scenario();
      value.battle.resourceRules.initialSp = 0;
      value.battle.dodgeMarkers = [marker('baseline', 1, delay)];
      const p = prepare(value);
      const assembly = new CombatRuntimeAssembly(p.compiled);
      assembly.advanceFrames(3);
      expect(assembly.resources.sp).toBe(delay === undefined ? 0 : 7);
    }
  });

  it('固定闪避已发生后，应用会话仍能恢复', () => {
    const value = scenario();
    value.battle.dodgeMarkers = [marker('d1', 1)];
    const p = prepare(value);
    const session = createStandardPlayerDamageCombatSession(p.compiled, p.restoredEnvironment);
    session.advanceToFrame(2);
    expect(() => session.fork(session.runtime.save())).not.toThrow();
  });

  it('逐帧会话恢复后，新闪避保留原生窗口', () => {
    const p = prepare(scenario(), true);
    const parent = createStandardPlayerDamageCombatSession(p.compiled, p.restoredEnvironment);
    parent.runtime.applyInitialInput({});
    const child = parent.fork(parent.runtime.save());
    const input = {
      dodges: [
        { kind: 'dash' as const, dodgeId: 'd1', operatorId: 'op', direction: 'forward' as const },
      ],
    };
    parent.runtime.advanceInputFrame(input);
    child.runtime.advanceInputFrame(input);
    expect(child.runtime.readState().operators.get('op')!.center).toEqual(
      parent.runtime.readState().operators.get('op')!.center,
    );
  });

  it('时间膨胀中的闪避从切面恢复后继续按缩放时间推进窗口', () => {
    const prepared = prepare(scenario(), true);
    const parent = new CombatRuntimeAssembly(prepared.compiled);
    parent.applyInitialInput({});
    parent.timeDilation!.startGlobal({
      durationSeconds: 1,
      slot: 'test/restored-center-window',
      priority: 1,
      curve: () => 0.5,
    });
    parent.advanceInputFrame({
      dodges: [{ kind: 'dash', dodgeId: 'branch-slowed', operatorId: 'op', direction: 'forward' }],
    });
    const child = CombatRuntimeAssembly.restore({
      receiptHistory: parent.receipt.history.snapshot(),
      graph: structuredClone(parent.stateGraph),
      resources: prepared.compiled.resources,
      enemy: prepared.compiled.enemy,
      operators: prepared.compiled.operators,
      dashTiming: prepared.compiled.dashTiming,
      skillAvailabilityTags: prepared.compiled.skillAvailabilityTags,
      environment: prepared.restoredEnvironment,
      abilityEntityChildSkillPrograms: parent.abilityEntityChildSkillPrograms,
      combatOperationPrograms: parent.combatOperationPrograms,
      combatSkillPrograms: parent.combatSkillPrograms.fork(),
      projectileCallbackPrograms: parent.projectileLifetimes.callbackPrograms,
      timeDilation: {
        config: prepared.compiled.timeDilation!.config,
        programs: parent.timeDilation!.programs,
      },
    });
    for (let frame = 0; frame < 3; frame += 1) {
      parent.advanceInputFrame({});
      child.advanceInputFrame({});
    }
    const original = parent.stateGraph.operators.get('op')!.center;
    const restored = child.stateGraph.operators.get('op')!.center;
    expect(restored).toEqual(original);
    expect(restored.attackAllowRemainingFrames).toBeCloseTo(9);
  });

  it('闪避后从同一切面分叉，只有成功分支拥有派生技能及其来源', () => {
    const prepared = prepare(scenario(), true);
    const parent = createStandardPlayerDamageCombatSession(
      prepared.compiled,
      prepared.restoredEnvironment,
    );
    parent.runtime.applyInitialInput({});
    parent.runtime.advanceInputFrame({
      dodges: [{ kind: 'dash', dodgeId: 'branch', operatorId: 'op', direction: 'forward' }],
    });
    const success = parent.fork(parent.runtime.save());
    parent.runtime.advanceInputFrame({});
    success.runtime.advanceInputFrame({
      dodges: [{ kind: 'perfectDodgeSuccess', dodgeId: 'branch', operatorId: 'op' }],
    });
    expect(
      projectDodgeMarkerEffects(parent.runtime.readHistory().toArray(), 'op', 'branch').some(
        entry => entry.event === 'SkillStarted',
      ),
    ).toBe(false);
    const skillStart = projectDodgeMarkerEffects(
      success.runtime.readHistory().toArray(),
      'op',
      'branch',
    ).find(entry => entry.event === 'SkillStarted');
    expect(skillStart?.producedBy?.kind).toBe('buff');
  });

  it('普通战技接管后中心状态必须离开 Dash', () => {
    const p = prepare(scenario(), true);
    const assembly = new CombatRuntimeAssembly(p.compiled);
    assembly.applyInitialInput({});
    assembly.advanceInputFrame({
      dodges: [{ kind: 'dash', dodgeId: 'd1', operatorId: 'op', direction: 'forward' }],
    });
    expect(assembly.tryStartSkill('op', 'chr_0004_pelica_normal_skill')).toBe(true);
    expect(assembly.stateGraph.operators.get('op')!.center.state).toBe('skill');
  });

  it('旧闪避延迟成功不能触发新一轮普通闪避', () => {
    const value = scenario();
    value.battle.resourceRules.initialSp = 0;
    value.battle.dodgeMarkers = [marker('old', 1, 10), marker('new', 10)];
    const p = prepare(value);
    const assembly = new CombatRuntimeAssembly(p.compiled);
    assembly.advanceFrames(12);
    expect(assembly.resources.sp).toBe(0);
    expect(assembly.receipt.entries.some(e => e.event === 'PerfectDodgeSkillStarted')).toBe(false);
    expect(
      assembly.receipt.entries.find(e => e.event === 'PerfectDodgeDeclared')?.data?.dodgeId,
    ).toBe('old');
  });

  it('免疫监听窗口过期后，延迟成功必须有未成功的明确事实', () => {
    const value = scenario();
    value.battle.dodgeMarkers = [marker('expired', 1, 40)];
    const p = prepare(value);
    const assembly = new CombatRuntimeAssembly(p.compiled);
    assembly.advanceFrames(45);
    expect(
      assembly.receipt.entries.some(
        e =>
          (e.event === 'PerfectDodgeDeclarationForced' ||
            e.event === 'PerfectDodgeDeclarationRejected') &&
          e.data?.dodgeId === 'expired',
      ),
    ).toBe(true);
  });

  it('闪避执行回执可按 UI 所用的 dodgeId 找到', () => {
    const value = scenario();
    value.battle.dodgeMarkers = [marker('ui', 1)];
    const p = prepare(value);
    const assembly = new CombatRuntimeAssembly(p.compiled);
    assembly.advanceFrames(2);
    expect(assembly.receipt.entries.find(e => e.event === 'DashInputExecuted')?.data?.dodgeId).toBe(
      'ui',
    );
  });

  it('交换轨道后闪避仍绑定原干员', () => {
    const value = scenario();
    value.battle.dodgeMarkers = [marker('swap', 1)];
    value.tracks[1] = { ...structuredClone(value.tracks[0]!), id: 'other' };
    const swapped = swapTimelineTracks(value, 0, 1);
    expect(compileScenarioDodgeInputs(swapped)[0]!.operatorId).toBe('op');
  });

  it('Dash 已发生且成功事实尚未到达时允许建立继承分支', () => {
    const value = scenario();
    value.battle.dodgeMarkers = [marker('split', 1, 5)];
    expect(() =>
      createInheritedScenario(value, {
        id: 'child',
        name: 'child',
        frame: 3,
        resolveSkillFrame: () => undefined,
      }),
    ).not.toThrow();
  });

  it('Dash 后一帧提交普通攻击应记录输入窗口未开放', () => {
    const p = prepare(scenario(), true);
    const assembly = new CombatRuntimeAssembly(p.compiled);
    assembly.applyInitialInput({});
    assembly.advanceInputFrame({
      dodges: [{ kind: 'dash', dodgeId: 'd1', operatorId: 'op', direction: 'forward' }],
    });
    assembly.advanceInputFrame({
      skills: [
        {
          operatorId: 'op',
          skillId: 'chr_0004_pelica_attack1',
          action: 'basicAttack',
          castId: 'a1',
        },
      ],
    });
    const events = assembly.receipt.entries.filter(e => e.frame === 2);
    expect(events.find(e => e.event === 'SkillInputBlockedByDashWindow')?.data).toMatchObject({
      attackInputBlocked: true,
      attackTransitionBlocked: true,
    });
    expect(events.some(e => e.event === 'SkillStarted')).toBe(true);
  });

  it('即使恢复调用提供了 dashTiming，恢复能力系统也必须能建立新 offset', () => {
    const p = prepare(scenario(), true);
    const parent = new CombatRuntimeAssembly(p.compiled);
    parent.applyInitialInput({});
    const child = CombatRuntimeAssembly.restore({
      receiptHistory: parent.receipt.history.snapshot(),
      graph: structuredClone(parent.stateGraph),
      resources: p.compiled.resources,
      enemy: p.compiled.enemy,
      operators: p.compiled.operators,
      dashTiming: p.compiled.dashTiming,
      skillAvailabilityTags: p.compiled.skillAvailabilityTags,
      environment: p.restoredEnvironment,
      abilityEntityChildSkillPrograms: parent.abilityEntityChildSkillPrograms,
      combatOperationPrograms: parent.combatOperationPrograms,
      combatSkillPrograms: parent.combatSkillPrograms.fork(),
      projectileCallbackPrograms: parent.projectileLifetimes.callbackPrograms,
      timeDilation: {
        config: p.compiled.timeDilation!.config,
        programs: parent.timeDilation!.programs,
      },
    });
    for (const assembly of [parent, child]) {
      assembly.advanceInputFrame({
        skills: [
          {
            operatorId: 'op',
            skillId: 'chr_0004_pelica_attack1',
            action: 'basicAttack',
            castId: 'a1',
          },
        ],
      });
      assembly.advanceInputFrame({
        dodges: [{ kind: 'dash', dodgeId: 'd1', operatorId: 'op', direction: 'forward' }],
      });
    }
    expect(parent.stateGraph.operators.get('op')!.ability.comboOffsetModifier).not.toBeNull();
    expect(child.stateGraph.operators.get('op')!.ability.comboOffsetModifier).toEqual(
      parent.stateGraph.operators.get('op')!.ability.comboOffsetModifier,
    );
  });

  it('连续组前段刚到边界时，Dash 仍应阻止同帧抢放下一段', () => {
    const value = scenario();
    value.tracks[0]!.skillCasts = [
      {
        id: 'a1',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0004_pelica_attack1',
          action: 'basicAttack',
        },
        placement: { startFrame: 1 },
      },
      {
        id: 'a2',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0004_pelica_attack2',
          action: 'basicAttack',
        },
        placement: { afterCastId: 'a1' },
      },
    ];
    const baseline = new CombatRuntimeAssembly(prepare(value).compiled);
    baseline.advanceFrames(40);
    const nextStart = baseline.receipt.entries.find(
      e => e.event === 'SkillStarted' && e.data?.castId === 'a2',
    )!.frame;
    value.battle.dodgeMarkers = [marker('boundary-dash', nextStart)];
    const withDash = new CombatRuntimeAssembly(prepare(value).compiled);
    withDash.advanceFrames(45);
    const actual = withDash.receipt.entries.find(
      e => e.event === 'SkillStarted' && e.data?.castId === 'a2',
    )!.frame;
    expect(actual - nextStart).toBeGreaterThanOrEqual(11);
  });
});
