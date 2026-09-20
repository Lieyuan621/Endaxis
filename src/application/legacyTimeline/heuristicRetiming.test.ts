import { expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../../core/combat/receipt/combatReceipt';
import type { EndaxisProjectDocument } from '../../core/project/schema';
import { retimeLegacyProjectBySimulation } from './heuristicRetiming';
import {
  AbilitySystemRuntime,
  type AbilitySkillRuntime,
} from '../../core/combat/abilities/abilitySystemRuntime';

function receipt(
  frame: number,
  event: CombatReceiptEntry['event'],
  castId: string,
): CombatReceiptEntry {
  return {
    sequence: frame,
    frame,
    time: frame / 30,
    event,
    sourceId: 'track:test',
    data: { castId },
  } as CombatReceiptEntry;
}

it('把同步切换成 Buff 的输入作为已执行的一帧参与后续全局排序', () => {
  const firstCastId = 'legacy:test:track:0:cast:0';
  const secondCastId = 'legacy:test:track:0:cast:1';
  const project = {
    scenarios: [
      {
        id: 'test',
        battle: { durationFrames: 60, simulationRange: { endFrame: 15 } },
        tracks: [
          {
            skillCasts: [
              { id: firstCastId, placement: { startFrame: 10 } },
              { id: secondCastId, placement: { startFrame: 20 } },
            ],
          },
        ],
      },
    ],
  } as unknown as EndaxisProjectDocument;
  const preparedSource = {
    scenarioList: [
      {
        id: 'test',
        data: {
          tracks: [{ actions: [{ startTime: 10 }, { startTime: 20 }] }],
        },
      },
    ],
  };

  expect(() =>
    retimeLegacyProjectBySimulation(project, preparedSource, scenario => {
      const secondEnabled = scenario.tracks[0]!.skillCasts[1]!.presentation?.disabled !== true;
      return {
        receiptEntries: [
          receipt(10, 'SkillSwitchedToBuff', firstCastId),
          ...(secondEnabled
            ? [
                receipt(20, 'SkillStarted', secondCastId),
                receipt(24, 'SkillOperableBoundaryReached', secondCastId),
              ]
            : []),
        ],
      };
    }),
  ).not.toThrow();
  expect(project.scenarios[0]!.tracks[0]!.skillCasts[1]!.placement.startFrame).toBe(20);
  expect(project.scenarios[0]!.battle.simulationRange?.endFrame).toBe(25);
});

it('技能被中断时以中断帧作为显示结束继续调整后续技能', () => {
  const firstCastId = 'legacy:test:track:0:cast:0';
  const secondCastId = 'legacy:test:track:0:cast:1';
  const project = {
    scenarios: [
      {
        id: 'test',
        battle: { durationFrames: 60 },
        tracks: [
          {
            skillCasts: [
              { id: firstCastId, placement: { startFrame: 10 } },
              { id: secondCastId, placement: { startFrame: 12 } },
            ],
          },
        ],
      },
    ],
  } as unknown as EndaxisProjectDocument;
  const preparedSource = {
    scenarioList: [
      {
        id: 'test',
        data: { tracks: [{ actions: [{ startTime: 10 }, { startTime: 12 }] }] },
      },
    ],
  };

  retimeLegacyProjectBySimulation(project, preparedSource, scenario => {
    const second = scenario.tracks[0]!.skillCasts[1]!;
    const secondEnabled = second.presentation?.disabled !== true;
    const secondStart = second.placement.startFrame!;
    return {
      receiptEntries: [
        receipt(10, 'SkillStarted', firstCastId),
        receipt(18, 'SkillInterrupted', firstCastId),
        ...(secondEnabled
          ? [
              receipt(secondStart, 'SkillStarted', secondCastId),
              receipt(secondStart + 4, 'SkillOperableBoundaryReached', secondCastId),
            ]
          : []),
      ],
    };
  });

  expect(project.scenarios[0]!.tracks[0]!.skillCasts[1]!.placement.startFrame).toBe(18);
});

it('让旧闪避标签随前一技能顺延，同时保留它相对技能的旧时间差', () => {
  const firstCastId = 'legacy:test:track:0:cast:0';
  const secondCastId = 'legacy:test:track:0:cast:1';
  const markerId = 'legacy:test:track:0:dodge:2';
  const project = {
    scenarios: [
      {
        id: 'test',
        battle: {
          durationFrames: 60,
          dodgeMarkers: [
            {
              id: markerId,
              frame: 13,
              trackIndex: 0,
              direction: 'forward',
              mode: { kind: 'dodge' },
            },
          ],
        },
        tracks: [
          {
            skillCasts: [
              { id: firstCastId, placement: { startFrame: 10 } },
              { id: secondCastId, placement: { startFrame: 12 } },
            ],
          },
        ],
      },
    ],
  } as unknown as EndaxisProjectDocument;
  const preparedSource = {
    scenarioList: [
      {
        id: 'test',
        data: {
          tracks: [
            {
              actions: [
                { startTime: 10 },
                { startTime: 12 },
                { startTime: 13, convertedDodge: { direction: 'forward' } },
              ],
            },
          ],
        },
      },
    ],
  };

  const observedDodgeFrames: number[] = [];
  const result = retimeLegacyProjectBySimulation(project, preparedSource, scenario => {
    const second = scenario.tracks[0]!.skillCasts[1]!;
    const secondEnabled = second.presentation?.disabled !== true;
    const secondStart = second.placement.startFrame!;
    if (secondEnabled) observedDodgeFrames.push(scenario.battle.dodgeMarkers![0]!.frame);
    return {
      receiptEntries: [
        receipt(10, 'SkillStarted', firstCastId),
        receipt(18, 'SkillInterrupted', firstCastId),
        ...(secondEnabled
          ? [
              receipt(secondStart, 'SkillStarted', secondCastId),
              receipt(secondStart + 4, 'SkillOperableBoundaryReached', secondCastId),
            ]
          : []),
      ],
    };
  });

  expect(project.scenarios[0]!.tracks[0]!.skillCasts[1]!.placement.startFrame).toBe(18);
  expect(project.scenarios[0]!.battle.dodgeMarkers![0]!.frame).toBe(19);
  expect(observedDodgeFrames).toContain(19);
  expect(result.dodgeMarkerAdjustments).toEqual([
    {
      scenarioId: 'test',
      markerId,
      trackIndex: 0,
      sourceFrame: 13,
      adjustedFrame: 19,
      previousCastId: secondCastId,
    },
  ]);
});

it('在显示边界后寻找下一技能最早允许接续的帧', () => {
  const firstCastId = 'legacy:test:track:0:cast:0';
  const secondCastId = 'legacy:test:track:0:cast:1';
  const project = {
    scenarios: [
      {
        id: 'test',
        battle: { durationFrames: 60 },
        tracks: [
          {
            skillCasts: [
              { id: firstCastId, placement: { startFrame: 10 } },
              { id: secondCastId, placement: { startFrame: 20 } },
            ],
          },
        ],
      },
    ],
  } as unknown as EndaxisProjectDocument;
  const preparedSource = {
    scenarioList: [
      {
        id: 'test',
        data: {
          tracks: [{ actions: [{ startTime: 10 }, { startTime: 20 }] }],
        },
      },
    ],
  };

  const adjustments = retimeLegacyProjectBySimulation(project, preparedSource, scenario => {
    const second = scenario.tracks[0]!.skillCasts[1]!;
    const secondEnabled = second.presentation?.disabled !== true;
    const secondStart = second.placement.startFrame!;
    return {
      receiptEntries: [
        receipt(10, 'SkillStarted', firstCastId),
        receipt(19, 'SkillOperableBoundaryReached', firstCastId),
        ...(secondEnabled
          ? [
              ...(secondStart < 23
                ? [receipt(secondStart, 'SkillInputCannotInterruptCurrentSkill', secondCastId)]
                : []),
              receipt(secondStart, 'SkillStarted', secondCastId),
              receipt(secondStart + 4, 'SkillOperableBoundaryReached', secondCastId),
            ]
          : []),
      ],
    };
  });

  expect(project.scenarios[0]!.tracks[0]!.skillCasts[1]!.placement.startFrame).toBe(23);
  expect(adjustments.timingAdjustments).toContainEqual(
    expect.objectContaining({ castId: secondCastId, inputWindowDelayFrames: 3 }),
  );
});

it('接续窗口探测耗尽时恢复原候选位置并保留报告', () => {
  const firstCastId = 'legacy:test:track:0:cast:0';
  const secondCastId = 'legacy:test:track:0:cast:1';
  const project = {
    scenarios: [
      {
        id: 'test',
        battle: { durationFrames: 60 },
        tracks: [
          {
            skillCasts: [
              { id: firstCastId, placement: { startFrame: 10 } },
              { id: secondCastId, placement: { startFrame: 20 } },
            ],
          },
        ],
      },
    ],
  } as unknown as EndaxisProjectDocument;
  const preparedSource = {
    scenarioList: [
      {
        id: 'test',
        data: { tracks: [{ actions: [{ startTime: 10 }, { startTime: 20 }] }] },
      },
    ],
  };

  const adjustments = retimeLegacyProjectBySimulation(project, preparedSource, scenario => {
    const second = scenario.tracks[0]!.skillCasts[1]!;
    const secondEnabled = second.presentation?.disabled !== true;
    const secondStart = second.placement.startFrame!;
    return {
      receiptEntries: [
        receipt(10, 'SkillStarted', firstCastId),
        receipt(19, 'SkillOperableBoundaryReached', firstCastId),
        ...(secondEnabled
          ? [
              receipt(secondStart, 'SkillInputCannotInterruptCurrentSkill', secondCastId),
              receipt(secondStart, 'SkillStarted', secondCastId),
              receipt(secondStart + 4, 'SkillOperableBoundaryReached', secondCastId),
            ]
          : []),
      ],
    };
  });

  expect(project.scenarios[0]!.tracks[0]!.skillCasts[1]!.placement.startFrame).toBe(20);
  expect(adjustments.timingAdjustments).toContainEqual(
    expect.objectContaining({ castId: secondCastId, inputWindowSearchExhausted: true }),
  );
});

it.each([
  { earlyWindow: false, expectedStart: 260 },
  { earlyWindow: true, expectedStart: 30 },
])('找到最早接续窗口，包含打开后又关闭的窗口（$earlyWindow）', ({ earlyWindow, expectedStart }) => {
  const firstCastId = 'legacy:test:track:0:cast:0';
  const secondCastId = 'legacy:test:track:0:cast:1';
  const project = {
    scenarios: [
      {
        id: 'test',
        battle: { durationFrames: 60 },
        tracks: [
          {
            skillCasts: [
              { id: firstCastId, placement: { startFrame: 10 } },
              { id: secondCastId, placement: { startFrame: 20 } },
            ],
          },
        ],
      },
    ],
  } as unknown as EndaxisProjectDocument;
  const preparedSource = {
    scenarioList: [
      {
        id: 'test',
        data: { tracks: [{ actions: [{ startTime: 10 }, { startTime: 20 }] }] },
      },
    ],
  };
  let simulationRuns = 0;

  const result = retimeLegacyProjectBySimulation(project, preparedSource, scenario => {
    simulationRuns += 1;
    const second = scenario.tracks[0]!.skillCasts[1]!;
    const secondEnabled = second.presentation?.disabled !== true;
    const secondStart = second.placement.startFrame!;
    const currentSkill: AbilitySkillRuntime = {
      skillId: 'current',
      skillType: 'battleSkill',
      state: 'casting',
      currentTimelineFrame: secondStart - 10,
      canInterrupt: secondStart >= 260,
      inputWindows: {
        allowedNextSkills: earlyWindow
          ? [{ startFrame: 20, endFrame: 22, skillIds: ['next'] }]
          : [],
      },
      canStart: () => true,
      tryStart: () => true,
      interrupt: () => {},
      advanceFrame: () => {},
    };
    const ability = new AbilitySystemRuntime({
      skills: [currentSkill, { ...currentSkill, skillId: 'next' }],
    });
    ability.tryStartSkill('current');
    const blocked = ability.evaluatePlayerInputInterruption('next').status === 'blocked';
    return {
      receiptEntries: [
        receipt(10, 'SkillStarted', firstCastId),
        receipt(19, 'SkillOperableBoundaryReached', firstCastId),
        ...(secondEnabled
          ? [
              ...(blocked
                ? [receipt(secondStart, 'SkillInputCannotInterruptCurrentSkill', secondCastId)]
                : []),
              receipt(secondStart, 'SkillStarted', secondCastId),
              receipt(secondStart + 4, 'SkillOperableBoundaryReached', secondCastId),
            ]
          : []),
      ],
    };
  });

  expect(project.scenarios[0]!.tracks[0]!.skillCasts[1]!.placement.startFrame).toBe(expectedStart);
  expect(result.timingAdjustments).toContainEqual(
    expect.objectContaining({ castId: secondCastId, inputWindowDelayFrames: expectedStart - 20 }),
  );
  expect(result.simulationStats).toMatchObject({
    scenarioCount: 1,
    castCount: 2,
    simulationRuns,
  });
});

it('把落在终结技时间膨胀结束回执同帧的输入放到下一帧', () => {
  const firstCastId = 'legacy:test:track:0:cast:0';
  const secondCastId = 'legacy:test:track:1:cast:0';
  const project = {
    scenarios: [
      {
        id: 'test',
        battle: { durationFrames: 60 },
        tracks: [
          { skillCasts: [{ id: firstCastId, placement: { startFrame: 10 } }] },
          { skillCasts: [{ id: secondCastId, placement: { startFrame: 20 } }] },
        ],
      },
    ],
  } as unknown as EndaxisProjectDocument;
  const preparedSource = {
    scenarioList: [
      {
        id: 'test',
        data: {
          tracks: [{ actions: [{ startTime: 10 }] }, { actions: [{ startTime: 20 }] }],
        },
      },
    ],
  };

  const adjustments = retimeLegacyProjectBySimulation(project, preparedSource, scenario => {
    const second = scenario.tracks[1]!.skillCasts[0]!;
    const secondEnabled = second.presentation?.disabled !== true;
    const secondStart = second.placement.startFrame!;
    return {
      receiptEntries: [
        receipt(10, 'SkillStarted', firstCastId),
        {
          ...receipt(10, 'TimeDilationStarted', firstCastId),
          data: { castId: firstCastId, instanceId: 1, kind: 'global', slot: 'ultimate' },
        } as CombatReceiptEntry,
        receipt(11, 'SkillOperableBoundaryReached', firstCastId),
        {
          ...receipt(20, 'TimeDilationEnded', firstCastId),
          data: { castId: firstCastId, instanceId: 1 },
        } as CombatReceiptEntry,
        ...(secondEnabled
          ? [
              receipt(secondStart, 'SkillStarted', secondCastId),
              receipt(secondStart + 1, 'SkillOperableBoundaryReached', secondCastId),
            ]
          : []),
      ],
    };
  });

  expect(project.scenarios[0]!.tracks[1]!.skillCasts[0]!.placement.startFrame).toBe(21);
  expect(adjustments.timingAdjustments).toContainEqual(
    expect.objectContaining({
      castId: secondCastId,
      pushedByUltimateTimeDilation: true,
      ultimateTimeDilationEndFrame: 20,
    }),
  );
});

it('按同组原生技能槽把旧轴基础技能改写为当前替换形态', () => {
  const castId = 'legacy:test:track:0:cast:0';
  const project = {
    scenarios: [
      {
        id: 'test',
        battle: { durationFrames: 1 },
        tracks: [
          {
            skillCasts: [
              {
                id: castId,
                source: {
                  kind: 'operatorSkill',
                  skillGroupKey: 'battleSkill',
                  skillKey: 'battleSkill',
                },
                placement: { startFrame: 10 },
              },
            ],
          },
        ],
      },
    ],
  } as unknown as EndaxisProjectDocument;
  const preparedSource = {
    scenarioList: [{ id: 'test', data: { tracks: [{ actions: [{ startTime: 10 }] }] } }],
  };

  const adjustments = retimeLegacyProjectBySimulation(
    project,
    preparedSource,
    scenario => {
      const cast = scenario.tracks[0]!.skillCasts[0]!;
      const start = cast.placement.startFrame!;
      return {
        receiptEntries: [
          ...(cast.source.kind === 'operatorSkill' && cast.source.skillKey === 'battleSkill'
            ? [
                {
                  ...receipt(start, 'SkillInputResolvedToDifferentSkill', castId),
                  data: {
                    castId,
                    skillId: 'battleSkill',
                    actualSkillId: 'battleSkillDuringUltimate',
                  },
                } as CombatReceiptEntry,
              ]
            : []),
          receipt(start, 'SkillStarted', castId),
          receipt(
            start +
              (cast.source.kind === 'operatorSkill' &&
              cast.source.skillKey === 'battleSkillDuringUltimate'
                ? 8
                : 2),
            'SkillOperableBoundaryReached',
            castId,
          ),
        ],
      };
    },
    ({ skillGroupKey, expectedSkillKey, actualSkillKey }) =>
      skillGroupKey === 'battleSkill' &&
      expectedSkillKey === 'battleSkill' &&
      actualSkillKey === 'battleSkillDuringUltimate'
        ? actualSkillKey
        : null,
  );

  expect(project.scenarios[0]!.tracks[0]!.skillCasts[0]!.source).toMatchObject({
    skillGroupKey: 'battleSkill',
    skillKey: 'battleSkillDuringUltimate',
  });
  expect(project.scenarios[0]!.battle.durationFrames).toBe(19);
  expect(adjustments.skillFormAdjustments).toContainEqual(
    expect.objectContaining({
      castId,
      sourceSkillKey: 'battleSkill',
      resolvedSkillKey: 'battleSkillDuringUltimate',
    }),
  );
});

it('技能顺延后仍把主控切换保留在原来的相邻技能之间', () => {
  const first = 'legacy:test:track:0:cast:0';
  const second = 'legacy:test:track:0:cast:1';
  const third = 'legacy:test:track:1:cast:0';
  const project = {
    scenarios: [
      {
        id: 'test',
        battle: {
          durationFrames: 60,
          controlSwitches: [{ id: 'switch', frame: 18, trackIndex: 1 }],
        },
        tracks: [
          {
            skillCasts: [
              { id: first, placement: { startFrame: 10 } },
              { id: second, placement: { startFrame: 15 } },
            ],
          },
          { skillCasts: [{ id: third, placement: { startFrame: 20 } }] },
        ],
      },
    ],
  } as unknown as EndaxisProjectDocument;
  const preparedSource = {
    scenarioList: [
      {
        id: 'test',
        data: {
          tracks: [
            { actions: [{ startTime: 10 }, { startTime: 15 }] },
            { actions: [{ startTime: 20 }] },
          ],
          switchEvents: [{ id: 'switch', time: 18, trackIndex: 1 }],
        },
      },
    ],
  };

  const result = retimeLegacyProjectBySimulation(project, preparedSource, scenario => ({
    receiptEntries: scenario.tracks.flatMap(track =>
      (track?.skillCasts ?? []).flatMap(cast => {
        if (cast.presentation?.disabled === true) return [];
        const start = cast.placement.startFrame!;
        const duration = cast.id === first ? 20 : 5;
        return [
          receipt(start, 'SkillStarted', cast.id),
          receipt(start + duration, 'SkillOperableBoundaryReached', cast.id),
        ];
      }),
    ),
  }));

  expect(project.scenarios[0]!.tracks[0]!.skillCasts[1]!.placement.startFrame).toBe(31);
  expect(project.scenarios[0]!.tracks[1]!.skillCasts[0]!.placement.startFrame).toBe(36);
  expect(project.scenarios[0]!.battle.controlSwitches[0]!.frame).toBe(34);
  expect(result.controlSwitchAdjustments).toEqual([
    {
      scenarioId: 'test',
      switchId: 'switch',
      trackIndex: 1,
      sourceFrame: 18,
      adjustedFrame: 34,
      previousCastId: second,
      nextCastId: third,
    },
  ]);
});

it('同帧的跨干员主控动作错开一帧，并按实际位置补主控切换', () => {
  const first = 'legacy:test:track:0:cast:0';
  const second = 'legacy:test:track:1:cast:0';
  const project = {
    scenarios: [
      {
        id: 'test',
        battle: { durationFrames: 60, controlSwitches: [] },
        tracks: [
          {
            skillCasts: [
              {
                id: first,
                source: {
                  kind: 'operatorSkill',
                  skillGroupKey: 'basicAttack',
                  skillKey: 'basicAttack1',
                },
                placement: { startFrame: 10 },
              },
            ],
          },
          {
            skillCasts: [
              {
                id: second,
                source: {
                  kind: 'operatorSkill',
                  skillGroupKey: 'finisher',
                  skillKey: 'finisher',
                },
                placement: { startFrame: 10 },
              },
            ],
          },
        ],
      },
    ],
  } as unknown as EndaxisProjectDocument;
  const preparedSource = {
    scenarioList: [
      {
        id: 'test',
        data: {
          tracks: [{ actions: [{ startTime: 10 }] }, { actions: [{ startTime: 10 }] }],
        },
      },
    ],
  };

  const result = retimeLegacyProjectBySimulation(project, preparedSource, scenario => ({
    receiptEntries: scenario.tracks.flatMap(track =>
      (track?.skillCasts ?? []).flatMap(cast => {
        if (cast.presentation?.disabled === true) return [];
        const start = cast.placement.startFrame!;
        return [
          receipt(start, 'SkillStarted', cast.id),
          receipt(start + 2, 'SkillOperableBoundaryReached', cast.id),
        ];
      }),
    ),
  }));

  expect(project.scenarios[0]!.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(10);
  expect(project.scenarios[0]!.tracks[1]!.skillCasts[0]!.placement.startFrame).toBe(11);
  expect(project.scenarios[0]!.battle.controlSwitches).toEqual([
    {
      id: `legacy-inferred-control:${second}`,
      frame: 11,
      trackIndex: 1,
    },
  ]);
  expect(result.timingAdjustments).toContainEqual(
    expect.objectContaining({
      castId: second,
      controlInputSeparationFrames: 1,
    }),
  );
  expect(result.inferredControlSwitches).toEqual([
    {
      scenarioId: 'test',
      switchId: `legacy-inferred-control:${second}`,
      castId: second,
      trackIndex: 1,
      sourceFrame: 10,
      inferredFrame: 11,
    },
  ]);
});
