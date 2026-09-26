import { expect, it } from 'vitest';
import { ScenarioEditorSession } from '../editor/scenarioEditorSession';
import { editSkillCastGraph } from '../editor/skillGraphCommands';
import { projectTimelineEditor } from '../../ui/timeline/timelineEditorViewModel';
import { listSkillGroupDefinitionBindings } from '../../core/game-data/operatorSkillDefinitions';
import { gameDataRepository } from '../../data/gameDataRepository';
import { createEmptyProject } from '../../core/project/createProject';
import { parseProjectDocument, serializeProjectDocument } from '../../core/project/serialization';
import { createScenarioSimulationService } from './createScenarioSimulationService';
import {
  captureScenarioSimulationGameData,
  restoreScenarioSimulationGameData,
} from './scenarioSimulationGameData';

it('方案自定义局部图保存重开、Worker 传输和执行中切面恢复保持相同结果', () => {
  const project = createEmptyProject({ createdWith: 'graph-round-trip' });
  const scenario = project.scenarios[0]!;
  scenario.battle.durationFrames = 120;
  scenario.globalConfig.customBuffs = [
    {
      id: 'scenario:custom-global:delayed',
      name: 'Delayed graph Buff',
      enabled: true,
      definition: {
        stackingType: 'unlimited',
        scheduledSequences: [{ startFrame: 75, sequence: { $sequence: 'hit' } }],
        actionGraph: {
          main: {
            nodes: {
              hit: {
                action: {
                  kind: 'dealFixedDamage',
                  parameters: { damageType: 'physical', value: 7, tags: [] },
                },
                next: null,
              },
            },
          },
          macros: {},
        },
      },
    },
  ];
  const operator = gameDataRepository.getOperator('perlica')!;
  const skill = listSkillGroupDefinitionBindings(
    operator.skillGroups.find(group => group.key === 'battleSkill')!,
  )[0]!.skill;
  scenario.tracks[0] = {
    id: 'track:0',
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
        id: 'custom-cast',
        source: { kind: 'operatorSkill', skillGroupKey: 'battleSkill', skillKey: skill.key },
        placement: { startFrame: 0 },
        customDefinition: {
          ...skill,
          timelineBlockFrames: 100,
          scheduledSequences: [
            { startFrame: 0, sequence: { $sequence: 'call' } },
            { startFrame: 90, sequence: { $sequence: 'call' } },
          ],
          actionGraph: {
            main: {
              nodes: { call: { action: { kind: 'callMacro', macroId: 'damage' }, next: null } },
            },
            macros: {
              damage: {
                entry: { $sequence: 'hit' },
                graph: {
                  nodes: {
                    hit: {
                      action: {
                        kind: 'dealFixedDamage',
                        parameters: { damageType: 'physical', value: 123, tags: ['normalSkill'] },
                      },
                      next: null,
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  };
  const session = new ScenarioEditorSession(scenario);
  session.commit(
    'edit-damage-macro',
    editSkillCastGraph(
      gameDataRepository,
      'custom-cast',
      { kind: 'macro', macroId: 'damage' },
      graph => ({
        ...graph,
        nodes: {
          ...graph.nodes,
          hit: {
            action: {
              kind: 'dealFixedDamage',
              parameters: { damageType: 'physical', value: 456, tags: ['normalSkill'] },
            },
            next: null,
          },
        },
      }),
    ),
  );
  project.scenarios[0] = session.snapshot.scenario;
  const loaded = parseProjectDocument(serializeProjectDocument(project));
  expect(loaded.ok).toBe(true);
  if (!loaded.ok) throw new Error(JSON.stringify(loaded));
  const restoredScenario = loaded.value.scenarios[0]!;
  expect(projectTimelineEditor(restoredScenario, gameDataRepository).tracks[0]!.issues).toEqual([]);
  const direct =
    createScenarioSimulationService(gameDataRepository).createCombatSession(restoredScenario);
  direct.advanceToFrame(60);
  const fork = direct.fork(direct.runtime.save());
  direct.advanceToFrame(120);
  fork.advanceToFrame(120);
  const expected = direct.collectResult();
  expect(
    expected.receiptEntries
      .filter(entry => entry.event === 'DamageApplied')
      .map(entry => entry.frame),
  ).toEqual([0, 75, 90]);
  expect(fork.collectResult()).toEqual(expected);

  const packet = structuredClone(
    captureScenarioSimulationGameData(restoredScenario, gameDataRepository),
  );
  const worker = createScenarioSimulationService(
    restoreScenarioSimulationGameData(packet),
  ).createCombatSession(restoredScenario);
  worker.advanceToFrame(120);
  expect(worker.collectResult()).toEqual(expected);
});
