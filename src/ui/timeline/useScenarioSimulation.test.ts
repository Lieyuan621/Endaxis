import { effectScope, nextTick, shallowRef } from 'vue';
import { describe, expect, it } from 'vitest';
import type { ScenarioDocument } from '../../core/project/schema';
import { ScenarioEditorSession } from '../../application/editor/scenarioEditorSession';
import { createEmptyScenario } from '../../core/project/createProject';
import { arclight, perlica, zhuangFangyi } from '../../data/operators';
import { gameDataRepository } from '../../data/gameDataRepository';
import { skillSettings } from '../../data/combat/skillSettings';
import { placeSkillGroup } from './interaction/placeSkillGroup';
import { projectSkillCastActualDurationFrames } from '../../core/projection/timelineDisplayTime';
import { ScenarioSimulationService } from '../../application/simulation/scenarioSimulationService';
import { useScenarioSimulation, type UseScenarioSimulationResult } from './useScenarioSimulation';
import {
  CombatReceiptCollector,
  type CombatReceiptEntry,
} from '../../core/combat/receipt/combatReceipt';
import { ActionGraphDefinitionRepository } from '../../core/compiler/actionGraphDefinitionRepository';

function historyOf(entries: readonly CombatReceiptEntry[]) {
  const receipt = new CombatReceiptCollector();
  for (const { sequence: _sequence, ...entry } of entries) receipt.record(entry);
  return receipt.history.snapshot();
}

const service = new ScenarioSimulationService({
  index: {
    getOperator: (slug: string) =>
      slug === perlica.slug ? perlica : slug === zhuangFangyi.slug ? zhuangFangyi : null,
    getWeapon: () => null,
    getGear: () => null,
    getGearSet: () => null,
    actionPrograms: new ActionGraphDefinitionRepository(),
    getCommonDefinitionSources: () => [],
  },
  resources: {
    sharedSpGain: { baseGainEfficiency: 1 },
    spRecoveryPauseDuration: 1.5,
    ultimateEnergySystemUnlocked: true,
    normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
  },
});

async function waitFor(predicate: () => boolean, timeoutMs = 1000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('waitFor timed out');
    await new Promise(resolve => setTimeout(resolve, 1));
  }
}

function createHarness(initial: ScenarioDocument, simulationService = service) {
  const session = new ScenarioEditorSession(initial);
  const scenario = shallowRef<ScenarioDocument>(initial);
  session.subscribe(snapshot => {
    scenario.value = snapshot.scenario;
  });
  let result!: UseScenarioSimulationResult;
  const scope = effectScope();
  scope.run(() => {
    result = useScenarioSimulation({ scenario, service: simulationService, debounceMs: 0 });
  });
  return { session, scenario, result, stop: () => scope.stop() };
}

function createPerlicaScenario(): ScenarioDocument {
  const scenario = createEmptyScenario('scenario:composable', '组合式函数样本');
  scenario.battle.durationFrames = 300;

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

describe('useScenarioSimulation', () => {
  it('运行中或完成后只改节点坐标，不重算也不使结果过期', async () => {
    const initial = createPerlicaScenario();
    initial.tracks[0]!.skillCasts = [
      {
        id: 'layout',
        source: { kind: 'operatorSkill', skillGroupKey: 'basicAttack', skillKey: 'basic' },
        placement: { startFrame: 0 },
      },
    ];
    const scenario = shallowRef(initial);
    let calls = 0;
    let finish!: (value: unknown) => void;
    const fakeService = {
      simulate: () => {
        calls++;
        return new Promise(resolve => {
          finish = resolve;
        });
      },
    } as unknown as ScenarioSimulationService;
    const scope = effectScope();
    let result!: UseScenarioSimulationResult;
    scope.run(() => {
      result = useScenarioSimulation({ scenario, service: fakeService, debounceMs: 10_000 });
    });
    const move = (x: number) => {
      const track = scenario.value.tracks[0]!;
      scenario.value = {
        ...scenario.value,
        tracks: [
          {
            ...track,
            skillCasts: track.skillCasts.map(cast => ({
              ...cast,
              presentation: {
                graph: { main: { nodePositions: { a: { x, y: 0 } }, entryPositions: {} } },
              },
            })),
          },
          null,
          null,
          null,
        ],
      };
    };
    try {
      const pending = result.simulateNow();
      move(100);
      finish({ availabilityDiagnostics: [], executionDiagnostics: [], comboWindowDiagnostics: [] });
      await pending;
      expect(result.stale.value).toBe(false);
      expect(result.published.value?.scenario).toBe(scenario.value);
      const run = result.run.value;
      move(200);
      await nextTick();
      expect(calls).toBe(1);
      expect(result.stale.value).toBe(false);
      expect(result.run.value).toBe(run);
      expect(result.published.value?.scenario).toBe(scenario.value);
    } finally {
      scope.stop();
    }
  });
  it('publishes immediate results without waiting for a timer', async () => {
    const scenario = shallowRef(createPerlicaScenario());
    const names: string[] = [];
    const fakeService = {
      simulate: async (current: ScenarioDocument) => {
        names.push(current.name);
        return {};
      },
    } as unknown as ScenarioSimulationService;
    const scope = effectScope();
    const result = scope.run(() =>
      useScenarioSimulation({
        scenario,
        service: fakeService,
      }),
    )!;
    try {
      await Promise.resolve();
      scenario.value = { ...scenario.value, name: 'first move' };
      expect(names.at(-1)).toBe('first move');
      // 同一事件循环内密集到达的位置也不能在上一轮完成后重新进入定时器。
      scenario.value = { ...scenario.value, name: 'latest move' };
      await Promise.resolve();
      await Promise.resolve();
      expect(result.published.value?.scenario).toBe(scenario.value);
      expect(names.at(-1)).toBe('latest move');
    } finally {
      scope.stop();
    }
  });

  it('starts only the latest queued position immediately after an in-flight run completes', async () => {
    const scenario = shallowRef(createPerlicaScenario());
    const run = {
      availabilityDiagnostics: [],
      executionDiagnostics: [],
      comboWindowDiagnostics: [],
    };
    let resolveFirst!: (value: typeof run) => void;
    const names: string[] = [];
    const fakeService = {
      simulate: (current: ScenarioDocument) => {
        names.push(current.name);
        if (names.length === 1)
          return new Promise<typeof run>(resolve => {
            resolveFirst = resolve;
          });
        return Promise.resolve(run);
      },
    } as unknown as ScenarioSimulationService;
    const scope = effectScope();
    scope.run(() =>
      useScenarioSimulation({
        scenario,
        service: fakeService,
      }),
    );
    try {
      scenario.value = { ...scenario.value, name: 'intermediate' };
      scenario.value = { ...scenario.value, name: 'latest' };
      expect(names).toHaveLength(1);
      resolveFirst(run);
      await Promise.resolve();
      expect(names).toHaveLength(2);
      expect(names[1]).toBe('latest');
    } finally {
      scope.stop();
    }
  });

  it('按回执释放身份定位接续成员诊断，并把停组原因标到尚未执行的后缀', async () => {
    const initial = createPerlicaScenario();
    const source = {
      kind: 'operatorSkill' as const,
      skillGroupKey: 'basicAttack',
      skillKey: 'chr_0004_pelica_attack1',
    };
    initial.tracks[0]!.skillCasts = [
      { id: 'first', source, placement: { startFrame: 55 } },
      { id: 'second', source, placement: { afterCastId: 'first' } },
      { id: 'third', source, placement: { afterCastId: 'second' } },
    ];
    const fakeService = {
      simulate: async () => {
        const receiptEntries: CombatReceiptEntry[] = [
          {
            sequence: 0,
            frame: 55,
            time: 55 / 30,
            event: 'SkillCostUnavailableAtStart',
            sourceId: 'track:0',
            data: { castId: 'second', skillId: 'chr_0004_pelica_attack1' },
          },
          {
            sequence: 1,
            frame: 55,
            time: 55 / 30,
            event: 'SkillInputProcessed',
            sourceId: 'track:0',
            data: { castId: 'second', accepted: false },
          },
          {
            sequence: 2,
            frame: 55,
            time: 55 / 30,
            event: 'SkillInputGroupBlocked',
            sourceId: 'track:0',
            data: {
              anchorCastId: 'first',
              castId: 'third',
              previousCastId: 'second',
              reason: 'inputRejected',
            },
          },
        ];
        return {
          receiptEntries,
          receiptHistory: historyOf(receiptEntries),
          availabilityDiagnostics: [
            {
              frame: 55,
              sourceId: 'track:0',
              skillId: 'chr_0004_pelica_attack1',
              reasons: ['resourceUnavailable'],
              receiptSequences: [0],
            },
          ],
          executionDiagnostics: [],
          comboWindowDiagnostics: [],
        };
      },
    } as unknown as ScenarioSimulationService;
    const harness = createHarness(initial, fakeService);
    try {
      expect(await harness.result.simulateNow()).toBe(true);
      expect(harness.result.diagnosticsByCastId.value.get('first')).toBeUndefined();
      expect(harness.result.diagnosticsByCastId.value.get('second')).toEqual([
        'resourceUnavailable',
      ]);
      expect(harness.result.diagnosticsByCastId.value.get('third')).toEqual([
        'skillGroupInputRejected',
      ]);
    } finally {
      harness.stop();
    }
  });
  it('连续编辑期间发布已经完整算完的快照，重置后禁止旧结果复活', async () => {
    const scenario = shallowRef(createPerlicaScenario());
    const requests: Array<(value: any) => void> = [];
    const fakeService = {
      simulate: () => new Promise(resolve => requests.push(resolve)),
    } as unknown as ScenarioSimulationService;
    const scope = effectScope();
    const result = scope.run(() =>
      useScenarioSimulation({
        scenario,
        service: fakeService,
        debounceMs: 10000,
      }),
    )!;
    const oldScenario = scenario.value;
    const first = result.simulateNow();
    scenario.value = { ...scenario.value, name: 'moving' };
    const latest = result.simulateNow();
    requests[0]!({ frame: 1 });
    expect(await first).toBe(false);
    expect(result.published.value?.scenario).toBe(oldScenario);
    expect(result.stale.value).toBe(true);
    result.resetPublication();
    requests[1]!({ frame: 2 });
    expect(await latest).toBe(false);
    expect(result.published.value).toBeNull();
    scope.stop();
  });
  it('does not retain another scenario result while waiting or after failure', async () => {
    const scenario = shallowRef(createPerlicaScenario());
    let fail = false;
    const fakeService = {
      simulate: async () => {
        if (fail) throw new Error('new scenario failed');
        return {
          availabilityDiagnostics: [],
          executionDiagnostics: [],
          comboWindowDiagnostics: [],
        };
      },
    } as unknown as ScenarioSimulationService;
    const scope = effectScope();
    const result = scope.run(() =>
      useScenarioSimulation({ scenario, service: fakeService, debounceMs: 10000 }),
    )!;
    try {
      await result.simulateNow();
      expect(result.published.value).not.toBeNull();
      const originalId = scenario.value.id;
      result.resetPublication();
      expect(scenario.value.id).toBe(originalId);
      expect(result.published.value).toBeNull();
      await result.simulateNow();
      expect(result.published.value).not.toBeNull();
      scenario.value = { ...scenario.value, id: 'another-scenario' };
      expect(result.published.value).toBeNull();
      expect(result.run.value).toBeNull();
      fail = true;
      await result.simulateNow();
      expect(result.error.value).toBe('new scenario failed');
      expect(result.published.value).toBeNull();
    } finally {
      scope.stop();
    }
  });

  it('不中断已开始的计算，并把连续编辑合并成一次后续计算', async () => {
    const initial = createPerlicaScenario();
    const scenario = shallowRef(initial);
    const run = {
      availabilityDiagnostics: [],
      executionDiagnostics: [],
      comboWindowDiagnostics: [],
    };
    let resolveSecond!: (value: typeof run) => void;
    let calls = 0;
    const fakeService = {
      simulate: async () => {
        calls += 1;
        if (calls === 1 || calls === 3) return run;
        return new Promise<typeof run>(resolve => {
          resolveSecond = resolve;
        });
      },
    } as unknown as ScenarioSimulationService;
    const scope = effectScope();
    const result = scope.run(() =>
      useScenarioSimulation({ scenario, service: fakeService, debounceMs: 10_000 }),
    )!;
    try {
      await result.simulateNow();
      const inFlight = result.simulateNow();
      const finalScenario = { ...initial, name: 'edited twice' };
      scenario.value = { ...initial, name: 'edited once' };
      scenario.value = finalScenario;
      expect(result.running.value).toBe(true);
      expect(result.stale.value).toBe(true);
      expect(calls).toBe(2);

      resolveSecond(run);
      expect(await inFlight).toBe(false);
      await waitFor(() => calls === 3 && result.running.value === false);
      expect(calls).toBe(3);
      expect(result.published.value?.scenario).toBe(finalScenario);
      expect(result.error.value).toBeNull();
    } finally {
      scope.stop();
    }
  });

  it('缓存换代取消当前请求时不显示失败，并发布随后排队的新结果', async () => {
    const initial = createPerlicaScenario();
    const scenario = shallowRef(initial);
    const run = {
      availabilityDiagnostics: [],
      executionDiagnostics: [],
      comboWindowDiagnostics: [],
    };
    let rejectReplaced!: (error: Error) => void;
    let calls = 0;
    const fakeService = {
      simulate: async () => {
        calls += 1;
        if (calls === 1 || calls === 3) return run;
        return new Promise<typeof run>((_resolve, reject) => {
          rejectReplaced = reject;
        });
      },
    } as unknown as ScenarioSimulationService;
    const scope = effectScope();
    const result = scope.run(() => useScenarioSimulation({ scenario, service: fakeService }))!;
    try {
      await waitFor(() => calls === 1 && result.running.value === false);
      const derivedScenario = { ...initial, name: '自定义干员场景' };
      scenario.value = derivedScenario;
      await waitFor(() => calls === 2);
      const refreshed = result.simulateNow();
      const replaced = new Error('模拟请求已被较新位置替代');
      replaced.name = 'AbortError';
      rejectReplaced(replaced);

      expect(await refreshed).toBe(true);
      expect(calls).toBe(3);
      expect(result.error.value).toBeNull();
      expect(result.published.value).toEqual({ scenario: derivedScenario, run });
    } finally {
      scope.stop();
    }
  });

  it('空闲时立即计算新的拖动位置，不额外等待防抖时间', async () => {
    const initial = createPerlicaScenario();
    const scenario = shallowRef(initial);
    let calls = 0;
    const fakeService = {
      simulate: async () => {
        calls += 1;
        return {
          availabilityDiagnostics: [],
          executionDiagnostics: [],
          comboWindowDiagnostics: [],
        };
      },
    } as unknown as ScenarioSimulationService;
    const scope = effectScope();
    const result = scope.run(() => useScenarioSimulation({ scenario, service: fakeService }))!;
    try {
      await waitFor(() => calls === 1 && result.running.value === false);
      scenario.value = { ...initial, name: 'next drag position' };
      expect(calls).toBe(2);
      await waitFor(() => result.running.value === false);
      expect(result.published.value?.scenario).toBe(scenario.value);
    } finally {
      scope.stop();
    }
  });

  it('clears the previous failure as soon as the user edits, without discarding the snapshot', async () => {
    const scenario = shallowRef(createPerlicaScenario());
    let fail = false;
    const fakeService = {
      simulate: async () => {
        if (fail) throw new Error('old failure');
        return {
          availabilityDiagnostics: [],
          executionDiagnostics: [],
          comboWindowDiagnostics: [],
        };
      },
    } as unknown as ScenarioSimulationService;
    const scope = effectScope();
    const result = scope.run(() =>
      useScenarioSimulation({ scenario, service: fakeService, debounceMs: 10_000 }),
    )!;
    try {
      await result.simulateNow();
      const previous = result.published.value;
      fail = true;
      scenario.value = { ...scenario.value, name: 'invalid' };
      await result.simulateNow();
      expect(result.error.value).toBe('old failure');
      scenario.value = { ...scenario.value, name: 'correcting' };
      expect(result.error.value).toBeNull();
      expect(result.stale.value).toBe(true);
      expect(result.running.value).toBe(false);
      expect(result.published.value).toBe(previous);
    } finally {
      scope.stop();
    }
  });

  it.each([-60, 0, 1, 30])(
    'a freshly placed basic attack chain at %s does not diagnose its own default spacing as blocked',
    async startFrame => {
      const initial = createPerlicaScenario();
      const placed = placeSkillGroup({
        scenario: initial,
        trackIndex: 0,
        operator: perlica,
        skillGroupKey: 'basicAttack',
        startFrame,
        ids: {
          allocate: (() => {
            let id = 0;
            return () => `chain:${id++}`;
          })(),
        },
      });
      const harness = createHarness(placed.scenario);
      try {
        expect(await harness.result.simulateNow(), harness.result.error.value ?? '').toBe(true);
        expect(
          harness.result.run.value!.availabilityDiagnostics.filter(d =>
            d.reasons.includes('skillInterruptUnavailable'),
          ),
        ).toEqual([]);
        expect(harness.scenario.value.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(
          startFrame,
        );
        const casts = placed.scenario.tracks[0]!.skillCasts;
        const durations = projectSkillCastActualDurationFrames(
          harness.result.run.value!.receiptEntries,
        );
        for (let index = 0; index < casts.length - 1; index++) {
          expect(casts[index]!.placement.startFrame! + durations.get(casts[index]!.id)!).toBe(
            casts[index + 1]!.placement.startFrame,
          );
        }
        // 修的是新链布局，不是取消校验：作者主动提前一帧仍得到原生中断诊断。
        const early = structuredClone(placed.scenario);
        const earlyCast = early.tracks[0]!.skillCasts[1]!;
        earlyCast.placement = { startFrame: earlyCast.placement.startFrame! - 1 };
        const earlyRun = await service.simulate(early, 300);
        expect(
          earlyRun.availabilityDiagnostics.some(
            d =>
              d.skillId === 'chr_0004_pelica_attack2' &&
              d.reasons.includes('skillInterruptUnavailable') &&
              d.currentCastId === casts[0]!.id,
          ),
        ).toBe(true);
      } finally {
        harness.stop();
      }
    },
  );

  it.each([
    [2, true],
    // Input precedes the update that would end Perlica's HideUI without a second cast.
    [53, true],
    [54, false],
  ] as const)(
    'locates cross-track ultimate presentation diagnostics at authored frame %s (blocked %s)',
    async (secondFrame, blocked) => {
      let initial = createPerlicaScenario();
      const firstTrack = initial.tracks[0]!;
      initial.tracks[1] = {
        ...structuredClone(firstTrack),
        id: 'track:1',
        operator: { ...firstTrack.operator!, operatorSlug: arclight.slug },
      };
      let nextId = 0;
      const ids = { allocate: (kind: string) => `${kind}:presentation:${nextId++}` };
      const first = placeSkillGroup({
        scenario: initial,
        trackIndex: 0,
        operator: perlica,
        skillGroupKey: 'ultimate',
        startFrame: 1,
        ids,
      });
      const second = placeSkillGroup({
        scenario: first.scenario,
        trackIndex: 1,
        operator: arclight,
        skillGroupKey: 'ultimate',
        startFrame: secondFrame,
        ids,
      });
      initial = second.scenario;
      const harness = createHarness(
        initial,
        new ScenarioSimulationService({
          index: gameDataRepository,
          spellInflictionSettings: skillSettings,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            ultimateEnergySystemUnlocked: true,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          },
        }),
      );
      try {
        const succeeded = await harness.result.simulateNow();
        expect(succeeded, String(harness.result.error.value)).toBe(true);
        const diagnostics = harness.result.diagnosticsByCastId.value;
        expect(diagnostics.get(first.skillCastIds[0]!) ?? []).not.toContain(
          'ultimateInputDuringPresentation',
        );
        expect(
          (diagnostics.get(second.skillCastIds[0]!) ?? []).includes(
            'ultimateInputDuringPresentation',
          ),
        ).toBe(blocked);
        const entries = harness.result.run.value!.receiptEntries;
        const firstPresentationEnd = entries.filter(
          entry =>
            entry.event === 'UltimatePresentationChanged' &&
            entry.sourceId === 'track:0' &&
            entry.data?.active === false,
        );
        expect(firstPresentationEnd).toHaveLength(1);
        // A forced overlapping ultimate introduces its own time dilation. Do not
        // turn the isolated 52-local-frame interval into a fixed wall-time lock.
        if (blocked) expect(firstPresentationEnd[0]!.frame).toBeGreaterThanOrEqual(secondFrame);
        else expect(firstPresentationEnd[0]!.frame).toBe(53);
        expect(entries).toContainEqual(
          expect.objectContaining({
            event: 'SkillStarted',
            frame: secondFrame,
            sourceId: 'track:1',
          }),
        );
        expect(entries).toContainEqual(
          expect.objectContaining({
            event: 'DamageApplied',
            sourceId: 'track:1',
          }),
        );
        expect(
          entries.filter(entry => entry.event === 'UltimateInputBlockedByPresentation'),
        ).toHaveLength(blocked ? 1 : 0);
        expect(initial.tracks[1]!.skillCasts[0]!.placement.startFrame).toBe(secondFrame);
      } finally {
        harness.stop();
      }
    },
  );

  it('取消拖动恢复原场景后，不发布迟到的临时模拟结果', async () => {
    const initial = createPerlicaScenario();
    const scenario = shallowRef<ScenarioDocument>(initial);
    const restoredRun = {
      availabilityDiagnostics: [],
      executionDiagnostics: [],
      comboWindowDiagnostics: [],
    };
    const previewRun = { ...restoredRun };
    let resolvePreview!: (value: typeof previewRun) => void;
    const fakeService = {
      simulate: async (current: ScenarioDocument) =>
        current === initial
          ? restoredRun
          : new Promise<typeof previewRun>(resolve => {
              resolvePreview = resolve;
            }),
    } as unknown as ScenarioSimulationService;
    const scope = effectScope();
    let result!: UseScenarioSimulationResult;
    scope.run(() => {
      result = useScenarioSimulation({ scenario, service: fakeService, debounceMs: 10_000 });
    });
    try {
      await result.simulateNow();
      scenario.value = { ...initial, name: '拖动预览' };
      await nextTick();
      const preview = result.simulateNow();
      scenario.value = initial;
      await nextTick();
      const restoredSimulation = result.simulateNow();
      resolvePreview(previewRun);
      expect(await preview).toBe(false);
      expect(await restoredSimulation).toBe(true);
      const restored = result.published.value;
      expect(result.published.value).toBe(restored);
      expect(result.published.value?.scenario).toBe(initial);
      expect(result.run.value).toBe(restoredRun);
      expect(result.stale.value).toBe(false);
      expect(result.running.value).toBe(false);
    } finally {
      scope.stop();
    }
  });

  it('uses the optional simulation end line as the execution boundary', async () => {
    const initial = createPerlicaScenario();
    initial.battle.simulationRange = { startFrame: 30, endFrame: 120 };
    const requestedEndFrames: number[] = [];
    const fakeService = {
      simulate: async (_scenario: ScenarioDocument, endFrame: number) => {
        requestedEndFrames.push(endFrame);
        return {
          availabilityDiagnostics: [],
          executionDiagnostics: [],
          comboWindowDiagnostics: [],
        };
      },
    } as unknown as ScenarioSimulationService;
    const scenario = shallowRef<ScenarioDocument>(initial);
    let result!: UseScenarioSimulationResult;
    const scope = effectScope();
    scope.run(() => {
      result = useScenarioSimulation({ scenario, service: fakeService, debounceMs: 10_000 });
    });
    try {
      await result.simulateNow();
      expect(requestedEndFrames).toEqual([120]);
    } finally {
      scope.stop();
    }
  });

  it('场景变化后立即把旧模拟标记为过期', async () => {
    const initial = createPerlicaScenario();
    const scenario = shallowRef<ScenarioDocument>(initial);
    const fakeRun = {
      availabilityDiagnostics: [],
      executionDiagnostics: [],
      comboWindowDiagnostics: [],
    };
    const fakeService = {
      simulate: async () => fakeRun,
    } as unknown as ScenarioSimulationService;
    let result!: UseScenarioSimulationResult;
    const scope = effectScope();
    scope.run(() => {
      result = useScenarioSimulation({ scenario, service: fakeService, debounceMs: 10_000 });
    });
    try {
      result.simulateNow();
      await waitFor(() => result.run.value !== null);
      expect(result.stale.value).toBe(false);

      scenario.value = { ...initial, name: '拖动预览' };
      await nextTick();

      expect(result.run.value).not.toBeNull();
      expect(result.stale.value).toBe(true);
    } finally {
      scope.stop();
    }
  });

  it('场景 watcher 排队后立即模拟会清除待执行任务，不重复运行', async () => {
    const initial = createPerlicaScenario();
    const scenario = shallowRef<ScenarioDocument>(initial);
    let calls = 0;
    const fakeService = {
      simulate: async () => {
        calls += 1;
        return {
          availabilityDiagnostics: [],
          executionDiagnostics: [],
          comboWindowDiagnostics: [],
        };
      },
    } as unknown as ScenarioSimulationService;
    let result!: UseScenarioSimulationResult;
    const scope = effectScope();
    scope.run(() => {
      result = useScenarioSimulation({ scenario, service: fakeService, debounceMs: 10_000 });
    });
    try {
      await result.simulateNow();
      expect(calls).toBe(1);

      scenario.value = { ...initial, name: '定义与实例已原子替换' };
      await nextTick();
      await result.simulateNow();
      await nextTick();

      expect(calls).toBe(2);
      expect(result.published.value?.scenario).toBe(scenario.value);
    } finally {
      scope.stop();
    }
  });

  it('场景变化后自动运行并保留防竞态的最新结果', async () => {
    const { session, result, stop } = createHarness(createPerlicaScenario());
    try {
      await waitFor(() => result.run.value !== null);
      expect(result.running.value).toBe(false);
      expect(result.stale.value).toBe(false);
      expect(result.error.value).toBeNull();

      session.commit(
        'placeSkillGroup',
        current =>
          placeSkillGroup({
            scenario: current,
            trackIndex: 0,
            operator: perlica,
            skillGroupKey: 'plungingAttack',
            startFrame: 1,
            ids: { allocate: kind => `${kind}:1` },
          }).scenario,
      );
      await waitFor(
        () =>
          result.run.value?.receiptEntries.some(entry => entry.event === 'DamageApplied') ?? false,
      );
      expect(result.stale.value).toBe(false);
    } finally {
      stop();
    }
  });

  it('严格失败时保留上一份完整快照并暴露错误', async () => {
    const { session, result, stop } = createHarness(createPerlicaScenario());
    try {
      await waitFor(() => result.run.value !== null);
      const previous = result.published.value;

      // 不存在的定义必须在构筑解析边界严格失败。
      session.commit('placeUnsupportedOperator', () => {
        const next = createPerlicaScenario();
        const track = next.tracks[0];
        if (track === null || track.operator === null) throw new Error('missing fixture operator');
        track.operator.operatorSlug = 'missing-operator';
        return next;
      });
      await waitFor(() => result.error.value !== null);
      expect(result.published.value).toBe(previous);
      expect(result.run.value).toBe(previous?.run ?? null);
      expect(result.stale.value).toBe(true);
      expect(result.error.value?.length ?? 0).toBeGreaterThan(0);
    } finally {
      stop();
    }
  });

  it('新模拟完成前不改动已发布快照，完成后只替换一次快照引用', async () => {
    const initial = createPerlicaScenario();
    const scenario = shallowRef<ScenarioDocument>(initial);
    const firstRun = {
      availabilityDiagnostics: [],
      executionDiagnostics: [],
      comboWindowDiagnostics: [],
    };
    const secondRun = {
      availabilityDiagnostics: [],
      executionDiagnostics: [],
      comboWindowDiagnostics: [],
    };
    let resolveSecond!: (value: typeof secondRun) => void;
    let calls = 0;
    const fakeService = {
      simulate: async () => {
        calls += 1;
        if (calls === 1) return firstRun;
        return new Promise<typeof secondRun>(resolve => {
          resolveSecond = resolve;
        });
      },
    } as unknown as ScenarioSimulationService;
    let result!: UseScenarioSimulationResult;
    const scope = effectScope();
    scope.run(() => {
      result = useScenarioSimulation({ scenario, service: fakeService, debounceMs: 0 });
    });
    try {
      await waitFor(() => result.published.value !== null);
      const firstSnapshot = result.published.value;

      scenario.value = { ...initial, name: '后台构造的新场景' };
      await waitFor(() => calls === 2);
      expect(result.running.value).toBe(true);
      expect(result.stale.value).toBe(true);
      expect(result.published.value).toBe(firstSnapshot);
      expect(result.run.value).toBe(firstRun);

      resolveSecond(secondRun);
      await waitFor(() => result.published.value !== firstSnapshot);
      expect(result.published.value).toEqual({ scenario: scenario.value, run: secondRun });
      expect(result.run.value).toBe(secondRun);
      expect(result.stale.value).toBe(false);
    } finally {
      scope.stop();
    }
  });

  it('新模拟完成前保留上一份完整诊断，完成后再整体替换', async () => {
    const initial = createPerlicaScenario();
    const fakeRun = {
      receiptEntries: [],
      receiptHistory: historyOf([]),
      availabilityDiagnostics: [
        {
          frame: 1,
          sourceId: 'track:0',
          skillId: 'chr_0004_pelica_plunging_attack_end',
          reasons: ['resourceUnavailable' as const],
          receiptSequences: [0],
        },
      ],
      executionDiagnostics: [],
      comboWindowDiagnostics: [],
    };
    const fakeService = {
      simulate: async () => fakeRun,
    } as unknown as ScenarioSimulationService;
    const session = new ScenarioEditorSession(initial);
    const scenario = shallowRef<ScenarioDocument>(initial);
    session.subscribe(snapshot => {
      scenario.value = snapshot.scenario;
    });
    let result!: UseScenarioSimulationResult;
    const scope = effectScope();
    scope.run(() => {
      result = useScenarioSimulation({ scenario, service: fakeService, debounceMs: 0 });
    });
    try {
      session.commit(
        'placeSkillGroup',
        current =>
          placeSkillGroup({
            scenario: current,
            trackIndex: 0,
            operator: perlica,
            skillGroupKey: 'plungingAttack',
            startFrame: 1,
            ids: { allocate: kind => `${kind}:1` },
          }).scenario,
      );
      await waitFor(() => result.diagnosticsByCastId.value.size > 0);

      const cast = session.snapshot.scenario.tracks[0]?.skillCasts[0];
      const castId = cast?.id ?? 'missing';
      expect(result.diagnosticsByCastId.value.get(castId)).toEqual(['resourceUnavailable']);
      const previous = result.published.value;
      scenario.value = { ...scenario.value, name: 'edited' };
      // 警告与其他模拟组件一起保留，避免等待期间消失后又出现。
      expect(result.stale.value).toBe(true);
      expect(result.diagnosticsByCastId.value.get(castId)).toEqual(['resourceUnavailable']);
      expect(result.published.value).toBe(previous);
    } finally {
      scope.stop();
    }
  });
});
