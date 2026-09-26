import { describe, expect, it } from 'vitest';
import { createEmptyProject, createEmptyScenario } from './createProject';
import {
  inspectProjectInput,
  parseProjectDocument,
  serializeProjectDocument,
} from './serialization';
import { PROJECT_SCHEMA_VERSION, type TrackDocument } from './schema';
import { validateProjectDocument } from './validation';

function createTrack(): TrackDocument {
  return {
    id: 'track:0',
    operator: {
      operatorSlug: 'perlica',
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: {},
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
}

it('独立技能图的自定义覆盖按自身节点校验，保存时不展开动作树', () => {
  const projectWithEntry = (entry: string) => {
    const project = createEmptyProject({ createdWith: 'test' });
    const track = createTrack();
    track.skillCasts.push({
      id: 'cast:graph',
      source: { kind: 'operatorSkill', skillGroupKey: 'battleSkill', skillKey: 'battleSkill' },
      placement: { startFrame: 30 },
      customDefinition: {
        key: 'battleSkill',
        timelineBlockFrames: 30,
        scheduledSequences: [{ startFrame: 0, sequence: { $sequence: entry } }],
        actionGraph: {
          main: {
            nodes: {
              entry: {
                action: { kind: 'dealStagger', parameters: { value: 1 } },
                next: null,
              },
            },
          },
          macros: {},
        },
      },
    });
    project.scenarios[0]!.tracks[0] = track;
    return project;
  };
  const valid = projectWithEntry('entry');
  expect(validateProjectDocument(valid).ok).toBe(true);
  expect(parseProjectDocument(serializeProjectDocument(valid)).ok).toBe(true);
  const invalid = validateProjectDocument(projectWithEntry('missing'));
  expect(invalid.ok).toBe(false);
  if (!invalid.ok)
    expect(invalid.issues.some(issue => issue.message.includes('missing'))).toBe(true);
});

it('preserves infinite curve tangents through text and parsed JSON without mutating the input', () => {
  const project = createEmptyProject({ createdWith: 'test' });
  const track = createTrack();
  track.skillCasts.push({
    id: 'curve',
    source: { kind: 'operatorSkill', skillGroupKey: 'battleSkill', skillKey: 'battleSkill' },
    placement: { startFrame: 0 },
    customDefinition: {
      key: 'battleSkill',
      timelineBlockFrames: 30,
      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'curve' } }],
      actionGraph: {
        main: {
          nodes: {
            curve: {
              next: null,
              action: {
                kind: 'startTimeDilation',
                parameters: {
                  scope: 'global',
                  durationSeconds: { kind: 'constant', value: 1 },
                  slot: 'Test/TimeSlot1',
                  priority: 2,
                  finishByAction: false,
                  ignoredTargets: ['caster'],
                  curve: {
                    kind: 'inline',
                    keys: [
                      {
                        time: 0,
                        value: 1,
                        inTangent: Infinity,
                        outTangent: -Infinity,
                        weightedMode: 0,
                        inWeight: 0,
                        outWeight: 0,
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        macros: {},
      },
    },
  });
  project.scenarios[0]!.tracks[0] = track;
  const text = serializeProjectDocument(project);
  const encoded: unknown = JSON.parse(text);
  expect(parseProjectDocument(text)).toEqual({ ok: true, value: project });
  expect(parseProjectDocument(encoded)).toEqual({ ok: true, value: project });
  expect(JSON.stringify(encoded)).toBe(text);
});

describe('current project document', () => {
  it('preserves creation time when saving and rejects invalid dates', () => {
    const project = createEmptyProject({
      createdWith: 'test',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(project.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(parseProjectDocument(serializeProjectDocument(project))).toEqual({
      ok: true,
      value: project,
    });
    expect(validateProjectDocument({ ...project, createdAt: 'yesterday' }).ok).toBe(false);
  });
  it('round-trips scenario-owned global Buff definitions and independent selections', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    project.scenarios[0]!.globalConfig = {
      modifiers: [],
      enabledPresetIds: ['combo-cdr-50'],
      customBuffs: [
        {
          id: 'scenario:custom-global:1',
          name: 'Custom Buff',
          enabled: false,
          definition: {
            actionGraph: { main: { nodes: {} }, macros: {} },
            stackingType: 'unlimited',
            attributeModifiers: [{ attribute: 'criticalRate', slot: 'baseAddition', value: 0.1 }],
          },
        },
      ],
    };
    expect(parseProjectDocument(serializeProjectDocument(project))).toEqual({
      ok: true,
      value: project,
    });
  });
  it('round-trips an empty project without adding runtime state', () => {
    const project = createEmptyProject({
      createdWith: 'test',
    });

    const json = serializeProjectDocument(project);
    const parsed = parseProjectDocument(json);

    expect(parsed).toEqual({ ok: true, value: project });
    expect(json).not.toContain('operatorStatus');
    expect(json).not.toContain('triggerEffects');
    expect(json).not.toContain('_expectedDamage');
    expect(json).not.toContain('initialEffects');
    expect(json).not.toContain('initialEnemyState');
  });

  it('round-trips frame-based cycle boundaries and control switches', () => {
    const project = createEmptyProject({
      createdWith: 'test',
    });
    const battle = project.scenarios[0]!.battle;
    battle.cycleBoundaries.push({ id: 'boundary:1', frame: 900 });
    battle.controlSwitches.push({ id: 'switch:1', frame: -120, trackIndex: 2 });

    const parsed = parseProjectDocument(serializeProjectDocument(project));

    expect(parsed).toEqual({ ok: true, value: project });
  });

  it('persists mechanic selections separately from global stat overrides', () => {
    const project = createEmptyProject({
      createdWith: 'test',
    });
    project.scenarios[0]!.mechanics.selections.push({
      id: 'mechanic-selection:1',
      mechanicId: 'season-tower:dungeon:indie_battletower001',
      enabled: true,
      parameters: { dmg_cnt: 20, damage_up: 0.5 },
    });

    const parsed = parseProjectDocument(serializeProjectDocument(project));

    expect(parsed).toEqual({ ok: true, value: project });
    expect(project.scenarios[0]!.globalConfig).toEqual({ modifiers: [] });
  });

  it('rejects malformed and duplicate mechanic selections', () => {
    const project = createEmptyProject({
      createdWith: 'test',
    });
    const scenario = project.scenarios[0]!;
    scenario.mechanics.selections.push(
      { id: 'selection:1', mechanicId: 'mechanic:1', enabled: true, parameters: {} },
      { id: 'selection:1', mechanicId: 'mechanic:2', enabled: true, parameters: {} },
    );
    const malformed = structuredClone(project) as unknown as {
      scenarios: Array<{
        mechanics: {
          selections: Array<{ parameters: Record<string, unknown> }>;
        };
      }>;
    };
    malformed.scenarios[0]!.mechanics.selections[0]!.parameters.invalid = null;

    const result = validateProjectDocument(malformed);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          {
            path: '$.scenarios[0].mechanics.selections[1].id',
            message: 'duplicate mechanic selection id',
          },
          {
            path: '$.scenarios[0].mechanics.selections[0].parameters.invalid',
            message: 'expected a boolean, finite number, or string',
          },
        ]),
      );
    }
  });

  it('persists inheritance time and optional-to-resolve source without a runtime snapshot', () => {
    const project = createEmptyProject({
      createdWith: 'test',
    });
    const source = project.scenarios[0]!;
    source.battle.cycleBoundaries.push({ id: 'boundary:1', frame: 900 });
    const inherited = createEmptyScenario('scenario:2', 'Inherited');
    inherited.inheritance = {
      sourceScenarioId: source.id,
      frame: 900,
    };
    project.scenarios.push(inherited);

    const parsed = parseProjectDocument(serializeProjectDocument(project));

    expect(parsed).toEqual({ ok: true, value: project });
  });

  it('allows dangling and cyclic navigation sources but rejects invalid inheritance frames', () => {
    const project = createEmptyProject({
      createdWith: 'test',
    });
    const first = project.scenarios[0]!;
    first.battle.cycleBoundaries.push({ id: 'boundary:1', frame: 300 });
    const second = createEmptyScenario('scenario:2', 'Second');
    second.battle.cycleBoundaries.push({ id: 'boundary:2', frame: 600 });
    first.inheritance = { sourceScenarioId: second.id, frame: 600 };
    second.inheritance = { sourceScenarioId: first.id, frame: 900 };
    project.scenarios.push(second);

    expect(validateProjectDocument(project).ok).toBe(true);
    second.inheritance.sourceScenarioId = 'missing';
    expect(validateProjectDocument(project).ok).toBe(true);
    second.inheritance.frame = 0.5;
    const result = validateProjectDocument(project);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          {
            path: '$.scenarios[1].inheritance.frame',
            message: expect.any(String),
          },
        ]),
      );
    }
  });

  it('rejects malformed values across loadout instances, battle, enemy, and editor state', () => {
    const project = createEmptyProject({
      createdWith: 'test',
    });
    const scenario = project.scenarios[0]!;
    scenario.tracks[0] = createTrack();

    const malformed = JSON.parse(serializeProjectDocument(project));
    malformed.scenarios[0].tracks[0].operator.promoted = 'yes';
    malformed.scenarios[0].enemy.rank = 'advanced';
    malformed.scenarios[0].enemy.editable.finisherMultiplier = 'one';
    malformed.scenarios[0].battle.controlSwitches.push({
      id: 'switch:invalid',
      frame: 30,
      trackIndex: 4,
    });
    malformed.scenarios[0].battle.dodgeMarkers = [
      {
        id: 'dodge:invalid',
        frame: -181,
        trackIndex: 4,
        direction: 'sideways',
        mode: { kind: 'perfectDodge', successDelayFrames: -1 },
      },
    ];
    malformed.scenarios[0].editor.trackHeightWeights = [1, 1, 1];
    malformed.scenarios[0].globalConfig.modifiers.push({
      id: 'modifier:1',
      kind: 'operatorStat',
      modifier: 'skillCooldownReduction',
      value: 50,
    });

    const result = validateProjectDocument(malformed);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          {
            path: '$.scenarios[0].tracks[0].operator.promoted',
            message: 'expected a boolean',
          },
          {
            path: '$.scenarios[0].enemy.rank',
            message: 'unknown enemy rank',
          },
          {
            path: '$.scenarios[0].enemy.editable.finisherMultiplier',
            message: 'expected a finite number',
          },
          {
            path: '$.scenarios[0].battle.controlSwitches[0].trackIndex',
            message: 'expected a track index from 0 to 3',
          },
          {
            path: '$.scenarios[0].battle.dodgeMarkers[0].frame',
            message: 'expected an integer no earlier than -150',
          },
          {
            path: '$.scenarios[0].battle.dodgeMarkers[0].trackIndex',
            message: 'expected a track index from 0 to 3',
          },
          {
            path: '$.scenarios[0].battle.dodgeMarkers[0].direction',
            message: 'unknown dodge direction',
          },
          {
            path: '$.scenarios[0].battle.dodgeMarkers[0].mode.successDelayFrames',
            message: 'expected a non-negative integer',
          },
          {
            path: '$.scenarios[0].editor.trackHeightWeights',
            message: 'expected exactly four weights',
          },
          {
            path: '$.scenarios[0].globalConfig.modifiers[0].skillType',
            message: 'skill cooldown reduction requires comboSkill',
          },
        ]),
      );
    }
  });

  it('rejects duplicate track ids across tracks', () => {
    const project = createEmptyProject({
      createdWith: 'test',
    });
    project.scenarios[0]!.tracks[0] = createTrack();
    project.scenarios[0]!.tracks[1] = createTrack();

    const result = validateProjectDocument(project);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual({
        path: '$.scenarios[0].tracks[1].id',
        message: 'duplicate track identity',
      });
    }
  });

  it('rejects dangling connection endpoints', () => {
    const project = createEmptyProject({
      createdWith: 'test',
    });
    project.scenarios[0]!.connections.push({
      id: 'connection:1',
      consumption: false,
      from: { kind: 'skillCast', skillCastId: 'missing:1' },
      to: { kind: 'skillCast', skillCastId: 'missing:2' },
    });

    const result = validateProjectDocument(project);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.issues.filter(issue => issue.message === 'unknown skill cast reference'),
      ).toHaveLength(2);
    }
  });

  it('validates the optional semantic player action stored on operator skill casts', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    const track = createTrack();
    track.skillCasts.push({
      id: 'cast:action',
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'battleSkill',
        skillKey: 'battleSkill',
        action: 'battleSkill',
      },
      placement: { startFrame: 0 },
    });
    project.scenarios[0]!.tracks[0] = track;
    expect(validateProjectDocument(project).ok).toBe(true);

    (track.skillCasts[0]!.source as { action?: string }).action = 'slot-1';
    const invalid = validateProjectDocument(project);
    expect(invalid.ok).toBe(false);
    if (invalid.ok) throw new Error('expected invalid project');
    expect(invalid.issues).toContainEqual(
      expect.objectContaining({ path: expect.stringContaining('.source.action') }),
    );
  });

  it('round-trips graph order and validates action parameters in main and macro graphs', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    const track = createTrack();
    track.skillCasts.push({
      id: 'cast:1',
      source: { kind: 'operatorSkill', skillGroupKey: 'battleSkill', skillKey: 'battleSkill' },
      placement: { startFrame: 30 },
      customDefinition: {
        key: 'battleSkill',
        timelineBlockFrames: 30,
        scheduledSequences: [{ startFrame: 8, sequence: { $sequence: 'buff' } }],
        actionGraph: {
          main: {
            nodes: {
              buff: {
                action: {
                  kind: 'applyBuff',
                  parameters: { buffId: 'electric-infliction', target: 'party' },
                },
                next: 'damage',
              },
              damage: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'electric',
                    attackScale: 1.78,
                    tags: ['normalSkill'],
                    stagger: 10,
                  },
                },
                next: 'branch',
              },
              branch: {
                action: {
                  kind: 'conditional',
                  parameters: {
                    condition: {
                      kind: 'deckAttributeCompare',
                      left: 'intellect',
                      operator: 'greaterOrEqual',
                      right: 'will',
                    },
                  },
                  whenTrue: { $sequence: 'call' },
                  whenFalse: { $sequence: null },
                },
                next: null,
              },
              call: { action: { kind: 'callMacro', macroId: 'flag' }, next: null },
            },
          },
          macros: {
            flag: {
              entry: { $sequence: 'flag' },
              graph: {
                nodes: {
                  flag: {
                    action: {
                      kind: 'setContextFlag',
                      parameters: { flag: 'operatorForm', value: 'intellect', target: 'caster' },
                    },
                    next: null,
                  },
                },
              },
            },
          },
        },
      },
    });
    project.scenarios[0]!.tracks[0] = track;
    const serialized = serializeProjectDocument(project);
    expect(parseProjectDocument(serialized)).toEqual({ ok: true, value: project });
    expect(serialized).not.toContain('"steps"');
    const changeAction = (id: string, action: unknown, macro = false) => {
      const copy = JSON.parse(serialized);
      const resource = copy.scenarios[0].tracks[0].skillCasts[0].customDefinition.actionGraph;
      (macro ? resource.macros.flag.graph : resource.main).nodes[id].action = action;
      return copy;
    };
    expect(
      validateProjectDocument(
        changeAction('damage', {
          kind: 'dealFixedDamage',
          parameters: { damageType: 'physical', value: 0.01, tags: ['ultimateSkill'] },
        }),
      ).ok,
    ).toBe(true);
    for (const [id, action, field, macro] of [
      ['buff', { kind: 'unknownStep', parameters: {} }, '.kind'],
      ['damage', { kind: 'dealDamage', parameters: { buffId: 'wrong' } }, '.parameters.damageType'],
      ['damage', { kind: 'dealStagger', parameters: { value: 'invalid' } }, '.parameters.value'],
      [
        'damage',
        {
          kind: 'dealDamage',
          parameters: { damageType: 'electric', attackScale: 1, tags: ['unknown'] },
        },
        '.parameters.tags[0]',
      ],
      [
        'damage',
        {
          kind: 'calculateActionValue',
          parameters: {
            key: 'result',
            operation: 'floor',
            left: { kind: 'constant', value: 1 },
            right: { kind: 'constant', value: 2 },
          },
        },
        '.parameters.operation',
      ],
      [
        'damage',
        {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: 10,
            recipient: 'caster',
            spGainSource: 'normalAttack',
          },
        },
        '.parameters.spGainSource',
      ],
      [
        'damage',
        {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: 10,
            recipient: 'team',
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          },
        },
        '.parameters.ultimateRecoveryTag',
      ],
      [
        'flag',
        { kind: 'dealStagger', parameters: { value: 'invalid' } },
        '.parameters.value',
        true,
      ],
    ] as const) {
      const result = validateProjectDocument(changeAction(id, action, macro));
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.issues).toContainEqual(
          expect.objectContaining({ path: expect.stringContaining(field) }),
        );
    }
    for (const condition of [
      { kind: 'deckAttributeCompare', left: 'intellect', operator: 'approximately', right: 'will' },
      {
        kind: 'healthCompare',
        target: 'enemy',
        valueType: 'percentage',
        operator: 'greater',
        value: { kind: 'constant', value: 0 },
      },
    ]) {
      const invalid = validateProjectDocument(
        changeAction('branch', {
          kind: 'conditional',
          parameters: { condition },
          whenTrue: { $sequence: 'call' },
        }),
      );
      expect(invalid.ok).toBe(false);
      if (!invalid.ok)
        expect(invalid.issues.some(issue => issue.path.includes('.parameters.condition.'))).toBe(
          true,
        );
    }
    const unowned = JSON.parse(serialized);
    unowned.scenarios[0].tracks[0].skillCasts[0].customDefinition.actionGraph = { nodes: {} };
    expect(validateProjectDocument(unowned).ok).toBe(false);
    const tree = JSON.parse(serialized);
    delete tree.scenarios[0].tracks[0].skillCasts[0].customDefinition.actionGraph;
    tree.scenarios[0].tracks[0].skillCasts[0].customDefinition.scheduledSequences[0].sequence = {
      steps: [],
    };
    const invalid = validateProjectDocument(tree);
    expect(invalid.ok).toBe(false);
    if (!invalid.ok)
      expect(invalid.issues).toContainEqual(
        expect.objectContaining({ message: 'custom skill requires its own action graph' }),
      );
  });

  it('validates cast-specific random inputs', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    const track = createTrack();
    track.skillCasts.push({
      id: 'cast:angle',
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'battleSkill',
        skillKey: 'battleSkill',
      },
      placement: { startFrame: 0 },
      simulationInputs: {
        randomSeed: 7,
        criticalOverrides: { 'damage:1': true },
      },
    });
    project.scenarios[0]!.tracks[0] = track;

    expect(validateProjectDocument(project).ok).toBe(true);

    track.skillCasts[0]!.simulationInputs = { randomSeed: -1 };
    const invalidSeed = validateProjectDocument(project);
    expect(invalidSeed.ok).toBe(false);
    if (!invalidSeed.ok)
      expect(invalidSeed.issues).toContainEqual({
        path: '$.scenarios[0].tracks[0].skillCasts[0].simulationInputs.randomSeed',
        message: 'expected a 32-bit unsigned integer',
      });
  });

  it('accepts partial presentation fields', () => {
    const project = createEmptyProject({
      createdWith: 'test',
    });
    const scenario = project.scenarios[0]!;
    const track = createTrack();
    track.skillCasts.push({
      id: 'cast:presentation',
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'battleSkill',
        skillKey: 'battleSkill',
      },
      placement: { startFrame: 0 },
      presentation: {
        locked: true,
      },
    });
    scenario.tracks[0] = track;

    expect(validateProjectDocument(project).ok).toBe(true);
  });

  it('rejects removed per-cast angle input and custom time bars', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    const track = createTrack();
    track.skillCasts.push({
      id: 'cast:removed-fields',
      source: { kind: 'operatorSkill', skillGroupKey: 'battleSkill', skillKey: 'battleSkill' },
      placement: { startFrame: 0 },
    });
    project.scenarios[0]!.tracks[0] = track;

    const withRemovedFields = structuredClone(project) as unknown as {
      scenarios: {
        tracks: ({ skillCasts: { presentation: object; simulationInputs: object }[] } | null)[];
      }[];
    };
    const cast = withRemovedFields.scenarios[0]!.tracks[0]!.skillCasts[0]!;
    cast.presentation = { customBars: [] };
    cast.simulationInputs = { cameraToTargetSignedAngleDegrees: 30 };
    const result = validateProjectDocument(withRemovedFields);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map(issue => issue.path)).toEqual(
        expect.arrayContaining([
          '$.scenarios[0].tracks[0].skillCasts[0].presentation.customBars',
          '$.scenarios[0].tracks[0].skillCasts[0].simulationInputs.cameraToTargetSignedAngleDegrees',
        ]),
      );
    }
  });

  it('recognizes the existing project envelope as legacy input', () => {
    const legacy = {
      version: '1.0.0',
      scenarioList: [{ id: 'default_sc', name: 'Scenario 1', data: null }],
    };

    expect(inspectProjectInput(legacy)).toEqual({ kind: 'legacy' });
    expect(parseProjectDocument(legacy)).toMatchObject({ ok: false, kind: 'legacy' });
  });

  it('rejects other Next schema versions instead of treating them as legacy input', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    const oldNext = { ...project, schemaVersion: PROJECT_SCHEMA_VERSION - 1 };

    expect(inspectProjectInput(oldNext)).toEqual({
      kind: 'unsupported',
      schemaVersion: PROJECT_SCHEMA_VERSION - 1,
    });
    expect(parseProjectDocument(oldNext)).toEqual({
      ok: false,
      kind: 'unsupported-version',
      schemaVersion: PROJECT_SCHEMA_VERSION - 1,
    });
  });
});
