import type { SkillDefinition } from '../../../../packages/game-data-contract/src/skills.ts';
import { describe, expect, it } from 'vitest';
import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
import type { SkillCastDocument } from '../../../core/project/schema';
import { deriveHitId } from '../../../core/combat/timeline/deriveHitId';
import { perlica } from '../../../data/operators/perlica.generated';
import { prepareActionGraphIdentities } from '../../../../tools/game-data-compiler/src/compiler/optimization/actionGraphProjection';
import {
  projectCastGraphHitMarkers,
  projectTimelineHitMarkerLeftPx,
  shouldDisplayTimelineHitMarker,
  type TimelineHitMarker,
} from './timelineHitProjection';
import type {
  ActionGraphNode,
  ActionGraphReference,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph';

function chainNodes(
  nodes: Record<string, ActionGraphNode>,
  prefix: string,
  steps: readonly ActionGraphStep[],
): ActionGraphReference {
  steps.forEach((action, index) => {
    nodes[`${prefix}-${index}`] = {
      action,
      next: index + 1 < steps.length ? `${prefix}-${index + 1}` : null,
    };
  });
  return { $sequence: steps.length === 0 ? null : `${prefix}-0` };
}

function createCast(
  build: (nodes: Record<string, ActionGraphNode>) => ActionGraphReference,
): SkillCastDocument {
  const nodes: Record<string, ActionGraphNode> = {};
  const sequence = build(nodes);
  const customDefinition: SkillDefinition = {
    key: 'battleSkill',
    timelineBlockFrames: 30,
    scheduledSequences: [{ startFrame: 10, sequence }],
    actionGraph: { main: { nodes }, macros: {} },
  };
  return {
    id: 'cast:1',
    source: { kind: 'operatorSkill', skillGroupKey: 'battleSkill', skillKey: 'battleSkill' },
    placement: { startFrame: 30 },
    presentation: {
      locked: false,
      disabled: false,
    },
    customDefinition,
  };
}

function fixtureDef(cast: SkillCastDocument): SkillDefinition {
  return cast.customDefinition!;
}

function damageStep(stepKey: string | undefined, hitKey: string): ActionGraphStep {
  return {
    kind: 'dealDamage',
    key: stepKey ?? hitKey,
    parameters: { damageType: 'electric', attackScale: 1, tags: [] },
  };
}

function findCastHitMarker(
  markers: readonly TimelineHitMarker[],
  stepKey: string,
): TimelineHitMarker | null {
  return markers.find(marker => marker.stepKey === stepKey) ?? null;
}

describe('projectCastGraphHitMarkers', () => {
  it('图预览直接沿共享节点读取命中，独立资源与干员总图投影一致', () => {
    const cast = createCast(nodes =>
      chainNodes(nodes, 'root', [
        damageStep('direct', 'direct'),
        {
          kind: 'conditional',
          parameters: { condition: { kind: 'combatActive' } },
          whenTrue: chainNodes(nodes, 'cond', [damageStep('conditional', 'conditional')]),
        },
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'preview:entity',
            dieWhenSourceDies: false,
            definition: {
              lifetime: { kind: 'infinite' },
              childSkill: {
                nativeSkillType: 'normalSkill' as const,
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
                },
                skillId: 'preview:child',
                scheduledSequences: [{ startFrame: 7, sequence: { $sequence: 'child-0' } }],
                actionGraph: {
                  main: {
                    nodes: {
                      'child-0': { action: damageStep('child', 'child'), next: null },
                    },
                  },
                  macros: {},
                },
              },
            },
          },
        },
      ]),
    );
    const operator = prepareActionGraphIdentities(perlica);
    const expected: TimelineHitMarker[] = [
      {
        stepKey: 'direct',
        hitId: deriveHitId(cast.id, 'direct'),
        frameOffset: 10,
        conditional: false,
      },
      {
        stepKey: 'conditional',
        hitId: deriveHitId(cast.id, 'conditional'),
        frameOffset: 10,
        conditional: true,
      },
      {
        stepKey: 'child',
        hitId: deriveHitId(cast.id, 'child'),
        frameOffset: 17,
        conditional: false,
      },
    ];
    expect(projectCastGraphHitMarkers(cast, fixtureDef(cast), operator)).toEqual(expected);
    const independentSkill = {
      ...fixtureDef(cast),
      actionGraph: { main: fixtureDef(cast).actionGraph.main, macros: {} },
    };
    expect(projectCastGraphHitMarkers(cast, independentSkill, operator)).toEqual(expected);
  });

  it('独立技能预览读取宏图，同名局部节点不与主图冲突', () => {
    const cast = createCast(() => ({ $sequence: null }));
    const skill: SkillDefinition = {
      key: 'battleSkill',
      timelineBlockFrames: 30,
      scheduledSequences: [{ startFrame: 4, sequence: { $sequence: 'entry' } }],
      actionGraph: {
        main: {
          nodes: {
            entry: { action: { kind: 'callMacro', macroId: 'hit' }, next: null },
          },
        },
        macros: {
          hit: {
            entry: { $sequence: 'entry' },
            graph: {
              nodes: { entry: { action: damageStep('macro:hit', 'macro:hit'), next: null } },
            },
          },
        },
      },
    };
    const operator = prepareActionGraphIdentities(perlica);
    expect(projectCastGraphHitMarkers(cast, skill, operator)).toEqual([
      {
        stepKey: 'macro:hit',
        hitId: deriveHitId(cast.id, 'macro:hit'),
        frameOffset: 4,
        conditional: false,
      },
    ]);
  });

  it('Switch 所有候选的命中都标记为条件命中，由模拟回执决定是否展示', () => {
    const cast = createCast(nodes => {
      nodes['switch-0'] = {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'constant', value: 0 }, alwaysNext: true },
          options: [0, 1].map(value => ({
            value: { kind: 'constant', value },
            sequence: chainNodes(nodes, `case${value}`, [damageStep(`case${value}`, '')]),
          })),
        },
        next: null,
      };
      return { $sequence: 'switch-0' };
    });
    expect(
      projectCastGraphHitMarkers(cast, fixtureDef(cast), prepareActionGraphIdentities(perlica)),
    ).toEqual(
      [0, 1].map(value => ({
        hitId: deriveHitId(cast.id, `case${value}`),
        frameOffset: 10,
        stepKey: `case${value}`,
        conditional: true,
      })),
    );
  });

  it('keeps delayed hits beyond the skill block at their actual horizontal position', () => {
    expect(projectTimelineHitMarkerLeftPx(-3)).toBe(0);
    expect(projectTimelineHitMarkerLeftPx(120)).toBe(120);
  });

  it('把调度帧与放置帧合并为绝对偏移，并保留定义步骤键', () => {
    const cast = createCast(nodes =>
      chainNodes(nodes, 'root', [
        damageStep('step:damage', 'hit:1'),
        damageStep(undefined, 'hit:2'),
      ]),
    );
    const markers = projectCastGraphHitMarkers(
      cast,
      fixtureDef(cast),
      prepareActionGraphIdentities(perlica),
    );
    expect(markers).toEqual([
      {
        hitId: deriveHitId('cast:1', 'step:damage'),
        frameOffset: 10,
        stepKey: 'step:damage',
        conditional: false,
      },
      {
        hitId: deriveHitId('cast:1', 'hit:2'),
        frameOffset: 10,
        stepKey: 'hit:2',
        conditional: false,
      },
    ]);
  });

  it('递归收集条件分支与 once 体内的命中标记并标记条件性', () => {
    const cast = createCast(nodes =>
      chainNodes(nodes, 'root', [
        {
          kind: 'conditional',
          parameters: { condition: { kind: 'combatActive' } },
          whenTrue: chainNodes(nodes, 'true', [
            damageStep(undefined, 'hit:true'),
            {
              kind: 'once',
              parameters: { scopeKey: 'nested' },
              body: chainNodes(nodes, 'once', [damageStep(undefined, 'hit:once')]),
            },
          ]),
          whenFalse: chainNodes(nodes, 'false', [damageStep(undefined, 'hit:false')]),
        },
      ]),
    );
    const markers = projectCastGraphHitMarkers(
      cast,
      fixtureDef(cast),
      prepareActionGraphIdentities(perlica),
    );
    expect(markers.map(marker => [marker.hitId, marker.conditional])).toEqual([
      [deriveHitId('cast:1', 'hit:true'), true],
      [deriveHitId('cast:1', 'hit:once'), true],
      [deriveHitId('cast:1', 'hit:false'), true],
    ]);
  });

  it('按稳定身份查询命中标记', () => {
    const cast = createCast(nodes => chainNodes(nodes, 'root', [damageStep(undefined, 'hit:1')]));
    const markers = projectCastGraphHitMarkers(
      cast,
      fixtureDef(cast),
      prepareActionGraphIdentities(perlica),
    );
    expect(findCastHitMarker(markers, 'hit:1')?.frameOffset).toBe(10);
    expect(findCastHitMarker(markers, 'hit:missing')).toBeNull();
  });

  it('collects ability-entity child hits with a local fallback offset', () => {
    const cast = createCast(nodes =>
      chainNodes(nodes, 'root', [
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'ability:test',
            dieWhenSourceDies: false,
            inheritActionBlackboard: true,
            definition: {
              lifetime: { kind: 'limited', durationSeconds: 1 },
              childSkill: {
                nativeSkillType: 'normalSkill' as const,
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
                },
                skillId: 'child',
                scheduledSequences: [{ startFrame: 7, sequence: { $sequence: 'child-0' } }],
                actionGraph: {
                  main: {
                    nodes: {
                      'child-0': { action: damageStep('child-hit', 'child-hit'), next: null },
                    },
                  },
                  macros: {},
                },
              },
            },
          },
        },
      ]),
    );

    expect(
      projectCastGraphHitMarkers(cast, fixtureDef(cast), prepareActionGraphIdentities(perlica)),
    ).toContainEqual({
      hitId: deriveHitId('cast:1', 'child-hit'),
      frameOffset: 17,
      stepKey: 'child-hit',
      conditional: false,
    });
  });

  it('空技能释放不产生命中标记', () => {
    const emptyCast = createCast(() => ({ $sequence: null }));
    expect(
      projectCastGraphHitMarkers(
        emptyCast,
        fixtureDef(emptyCast),
        prepareActionGraphIdentities(perlica),
      ),
    ).toEqual([]);
  });

  it('collects ID-only ability-entity child hits from the operator definition table', () => {
    const cast = createCast(nodes =>
      chainNodes(nodes, 'root', [
        {
          kind: 'spawnAbilityEntity',
          parameters: { abilityEntityId: 'ability:test', dieWhenSourceDies: false },
        },
      ]),
    );
    const operator: OperatorDefinition = {
      ...prepareActionGraphIdentities(perlica),
      abilityEntityDefinitions: {
        'ability:test': {
          lifetime: { kind: 'infinite' },
          childSkill: {
            nativeSkillType: 'normalSkill' as const,
            naturalDurationFrames: 30,
            castResource: {
              costFrame: 0,
              cooldownSeconds: 0,
              maxChargeTime: 1,
              cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
            },
            skillId: 'child',
            scheduledSequences: [{ startFrame: 7, sequence: { $sequence: 'child-0' } }],
            actionGraph: {
              main: {
                nodes: {
                  'child-0': {
                    action: damageStep('child-hit', 'child-hit'),
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

    expect(projectCastGraphHitMarkers(cast, fixtureDef(cast), operator)).toContainEqual({
      hitId: deriveHitId('cast:1', 'child-hit'),
      frameOffset: 17,
      stepKey: 'child-hit',
      conditional: false,
    });
  });

  it('collects the named ability-entity child selected by a Spawn action', () => {
    const cast = createCast(nodes =>
      chainNodes(nodes, 'root', [
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'ability:test',
            childSkillId: 'child:second',
            dieWhenSourceDies: false,
          },
        },
      ]),
    );

    const operator: OperatorDefinition = {
      ...prepareActionGraphIdentities(perlica),
      abilityEntityDefinitions: {
        'ability:test': {
          lifetime: { kind: 'infinite' },
          childSkills: {
            'child:first': {
              skillId: 'child:first',
              nativeSkillType: 'normalSkill' as const,
              naturalDurationFrames: 30,
              castResource: {
                costFrame: 0,
                cooldownSeconds: 0,
                maxChargeTime: 1,
                cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
              },
              scheduledSequences: [{ startFrame: 3, sequence: { $sequence: 'first-0' } }],
              actionGraph: {
                main: {
                  nodes: {
                    'first-0': { action: damageStep('first-hit', 'first-hit'), next: null },
                  },
                },
                macros: {},
              },
            },
            'child:second': {
              skillId: 'child:second',
              nativeSkillType: 'normalSkill' as const,
              naturalDurationFrames: 30,
              castResource: {
                costFrame: 0,
                cooldownSeconds: 0,
                maxChargeTime: 1,
                cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
              },
              scheduledSequences: [{ startFrame: 7, sequence: { $sequence: 'second-0' } }],
              actionGraph: {
                main: {
                  nodes: {
                    'second-0': { action: damageStep('second-hit', 'second-hit'), next: null },
                  },
                },
                macros: {},
              },
            },
          },
        },
      },
    };

    const markers = projectCastGraphHitMarkers(cast, fixtureDef(cast), operator);
    expect(markers).toEqual([
      {
        hitId: deriveHitId('cast:1', 'second-hit'),
        frameOffset: 17,
        stepKey: 'second-hit',
        conditional: false,
      },
    ]);
  });

  it('collects recursively applied Buff damage as a conditional source-cast hit', () => {
    const cast = createCast(nodes =>
      chainNodes(nodes, 'root', [
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff:root',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
      ]),
    );
    const operator: OperatorDefinition = {
      ...prepareActionGraphIdentities(perlica),
      buffDefinitions: {
        'buff:root': {
          stackingType: 'unique',
          actionGraph: {
            main: {
              nodes: {
                'root-start-0': {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff:damage',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
              },
            },
            macros: {},
          },
          lifecycleSequences: { start: { $sequence: 'root-start-0' } },
        },
        'buff:damage': {
          stackingType: 'unique',
          actionGraph: {
            main: {
              nodes: {
                'damage-trigger-0': {
                  action: damageStep('buff-hit', 'buff-hit'),
                  next: null,
                },
              },
            },
            macros: {},
          },
          lifecycleSequences: { trigger: { $sequence: 'damage-trigger-0' } },
        },
      },
    };
    expect(projectCastGraphHitMarkers(cast, fixtureDef(cast), operator)).toEqual([
      {
        hitId: deriveHitId('cast:1', 'buff-hit'),
        frameOffset: 10,
        stepKey: 'buff-hit',
        conditional: true,
      },
    ]);
  });

  it('resolves an ID-only Buff applied to an ability entity and collects scheduled damage', () => {
    const cast = createCast(nodes =>
      chainNodes(nodes, 'root', [
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff:sword',
            target: 'currentAbilityEntity',
            inheritSourceSkillCastInfo: true,
          },
        },
      ]),
    );
    const operator: OperatorDefinition = {
      ...prepareActionGraphIdentities(perlica),
      buffDefinitions: {
        'buff:sword': {
          stackingType: 'unlimited',
          blackboard: {},
          actionGraph: {
            main: {
              nodes: {
                'sword-0': { action: damageStep('sword-hit', 'sword-hit'), next: null },
              },
            },
            macros: {},
          },
          scheduledSequences: [{ startFrame: 6, sequence: { $sequence: 'sword-0' } }],
        },
      },
    };

    expect(projectCastGraphHitMarkers(cast, fixtureDef(cast), operator)).toEqual([
      {
        hitId: deriveHitId('cast:1', 'sword-hit'),
        frameOffset: 16,
        stepKey: 'sword-hit',
        conditional: true,
      },
    ]);
  });

  it('does not follow Buff work that explicitly drops the source cast identity', () => {
    const cast = createCast(nodes =>
      chainNodes(nodes, 'root', [
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff:passive',
            target: 'caster',
            inheritSourceSkillCastInfo: false,
          },
        },
      ]),
    );
    const operator: OperatorDefinition = {
      ...prepareActionGraphIdentities(perlica),
      buffDefinitions: {
        'buff:passive': {
          stackingType: 'unique',
          blackboard: {},
          actionGraph: {
            main: {
              nodes: {
                'passive-0': { action: damageStep('passive-hit', 'passive-hit'), next: null },
              },
            },
            macros: {},
          },
          scheduledSequences: [{ startFrame: 6, sequence: { $sequence: 'passive-0' } }],
        },
      },
    };

    expect(projectCastGraphHitMarkers(cast, fixtureDef(cast), operator)).toEqual([]);
  });
});

describe('shouldDisplayTimelineHitMarker', () => {
  const directMarker = {
    stepKey: 'direct-hit',
    hitId: 'cast:1:direct-hit',
    frameOffset: 195,
    conditional: false,
  } as const;
  const conditionalMarker = {
    ...directMarker,
    stepKey: 'conditional-hit',
    hitId: 'cast:1:conditional-hit',
    conditional: true,
  } as const;

  it('uses unconditional definition markers only before the first simulation', () => {
    expect(shouldDisplayTimelineHitMarker(directMarker, false, new Map())).toBe(true);
    expect(shouldDisplayTimelineHitMarker(conditionalMarker, false, new Map())).toBe(false);
  });

  it('uses only actual DamageApplied hit identities after simulation', () => {
    const actualFrames = new Map([[conditionalMarker.hitId, 24]]);
    expect(shouldDisplayTimelineHitMarker(directMarker, true, actualFrames)).toBe(false);
    expect(shouldDisplayTimelineHitMarker(conditionalMarker, true, actualFrames)).toBe(true);
  });
});
