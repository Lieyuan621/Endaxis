import { describe, expect, it } from 'vitest';
import type {
  CombatStepDefinition,
  SkillDefinition,
} from '../../../core/game-data/operatorDefinition';
import type { SkillCastDocument } from '../../../core/project/schema';
import { deriveHitId } from '../../../core/combat/timeline/deriveHitId';
import {
  findCastHitMarker,
  projectCastHitMarkers,
  projectTimelineHitMarkerLeftPx,
  shouldDisplayTimelineHitMarker,
} from './timelineHitProjection';

function fixtureDef(cast: SkillCastDocument): SkillDefinition {
  return cast.customDefinition!;
}

function createCast(steps: CombatStepDefinition[]): SkillCastDocument {
  return {
    id: 'cast:1',
    source: { kind: 'operatorSkill', skillGroupKey: 'battleSkill', skillKey: 'battleSkill' },
    placement: { startFrame: 30 },
    presentation: {
      locked: false,
      disabled: false,
    },
    customDefinition: {
      key: 'battleSkill',
      timelineBlockFrames: 30,
      scheduledSequences: [
        {
          startFrame: 10,
          sequence: { steps },
        },
      ],
    },
  };
}

function damageStep(stepKey: string | undefined, hitKey: string): CombatStepDefinition {
  return {
    kind: 'dealDamage',
    key: stepKey ?? hitKey,
    parameters: { damageType: 'electric', attackScale: 1, tags: [] },
  };
}

describe('projectCastHitMarkers', () => {
  it('Switch 所有候选的命中都标记为条件命中，由模拟回执决定是否展示', () => {
    const cast = createCast([
      {
        kind: 'switch',
        parameters: { choice: { kind: 'constant', value: 0 }, alwaysNext: true },
        options: [0, 1].map(value => ({
          value: { kind: 'constant', value },
          sequence: { steps: [damageStep(`case${value}`, '')] },
        })),
      },
    ]);
    expect(projectCastHitMarkers(cast, fixtureDef(cast))).toEqual(
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
    const cast = createCast([damageStep('step:damage', 'hit:1'), damageStep(undefined, 'hit:2')]);
    const markers = projectCastHitMarkers(cast, fixtureDef(cast));
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
    const cast = createCast([
      {
        kind: 'conditional',
        parameters: { condition: { kind: 'combatActive' } },
        whenTrue: {
          steps: [
            damageStep(undefined, 'hit:true'),
            {
              kind: 'once',
              parameters: { scopeKey: 'nested' },
              body: { steps: [damageStep(undefined, 'hit:once')] },
            },
          ],
        },
        whenFalse: {
          steps: [damageStep(undefined, 'hit:false')],
        },
      },
    ] as CombatStepDefinition[]);
    const markers = projectCastHitMarkers(cast, fixtureDef(cast));
    expect(markers.map(marker => [marker.hitId, marker.conditional])).toEqual([
      [deriveHitId('cast:1', 'hit:true'), true],
      [deriveHitId('cast:1', 'hit:once'), true],
      [deriveHitId('cast:1', 'hit:false'), true],
    ]);
  });

  it('按稳定身份查询命中标记', () => {
    const cast = createCast([damageStep(undefined, 'hit:1')]);
    expect(findCastHitMarker(cast, 'hit:1', fixtureDef(cast))?.frameOffset).toBe(10);
    expect(findCastHitMarker(cast, 'hit:missing', fixtureDef(cast))).toBeNull();
  });

  it('collects ability-entity child hits with a local fallback offset', () => {
    const cast = createCast([
      {
        kind: 'spawnAbilityEntity',
        parameters: {
          abilityEntityId: 'ability:test',
          dieWhenSourceDies: false,
          inheritActionBlackboard: true,
          definition: {
            lifetime: { kind: 'limited', durationSeconds: 1 },
            childSkill: {
              skillId: 'child',
              scheduledSequences: [
                {
                  startFrame: 7,
                  sequence: { steps: [damageStep('child-hit', 'child-hit')] },
                },
              ],
            },
          },
        },
      },
    ]);

    expect(projectCastHitMarkers(cast, fixtureDef(cast))).toContainEqual({
      hitId: deriveHitId('cast:1', 'child-hit'),
      frameOffset: 17,
      stepKey: 'child-hit',
      conditional: false,
    });
  });

  it('空技能释放不产生命中标记', () => {
    const emptyCast = createCast([]);
    expect(projectCastHitMarkers(emptyCast, fixtureDef(emptyCast))).toEqual([]);
  });

  it('collects ID-only ability-entity child hits from the operator definition table', () => {
    const cast = createCast([
      {
        kind: 'spawnAbilityEntity',
        parameters: { abilityEntityId: 'ability:test', dieWhenSourceDies: false },
      },
    ]);

    expect(
      projectCastHitMarkers(cast, fixtureDef(cast), {
        'ability:test': {
          lifetime: { kind: 'infinite' },
          childSkill: {
            skillId: 'child',
            scheduledSequences: [
              { startFrame: 7, sequence: { steps: [damageStep('child-hit', 'child-hit')] } },
            ],
          },
        },
      }),
    ).toContainEqual({
      hitId: deriveHitId('cast:1', 'child-hit'),
      frameOffset: 17,
      stepKey: 'child-hit',
      conditional: false,
    });
  });

  it('collects the named ability-entity child selected by a Spawn action', () => {
    const cast = createCast([
      {
        kind: 'spawnAbilityEntity',
        parameters: {
          abilityEntityId: 'ability:test',
          childSkillId: 'child:second',
          dieWhenSourceDies: false,
        },
      },
    ]);

    const markers = projectCastHitMarkers(cast, fixtureDef(cast), {
      'ability:test': {
        lifetime: { kind: 'infinite' },
        childSkills: {
          'child:first': {
            skillId: 'child:first',
            scheduledSequences: [
              { startFrame: 3, sequence: { steps: [damageStep('first-hit', 'first-hit')] } },
            ],
          },
          'child:second': {
            skillId: 'child:second',
            scheduledSequences: [
              { startFrame: 7, sequence: { steps: [damageStep('second-hit', 'second-hit')] } },
            ],
          },
        },
      },
    });

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
    const cast = createCast([
      {
        kind: 'applyBuff',
        parameters: {
          buffId: 'buff:root',
          target: 'caster',
          inheritSourceSkillCastInfo: true,
          definition: {
            stackingType: 'unique',
            lifecycleSequences: {
              start: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff:damage',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
                      definition: {
                        stackingType: 'unique',
                        lifecycleSequences: {
                          trigger: { steps: [damageStep('buff-hit', 'buff-hit')] },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]);
    expect(projectCastHitMarkers(cast, fixtureDef(cast))).toEqual([
      {
        hitId: deriveHitId('cast:1', 'buff-hit'),
        frameOffset: 10,
        stepKey: 'buff-hit',
        conditional: true,
      },
    ]);
  });

  it('resolves an ID-only Buff applied to an ability entity and collects scheduled damage', () => {
    const cast = createCast([
      {
        kind: 'applyBuff',
        parameters: {
          buffId: 'buff:sword',
          target: 'currentAbilityEntity',
          inheritSourceSkillCastInfo: true,
        },
      },
    ]);

    expect(
      projectCastHitMarkers(cast, fixtureDef(cast), undefined, {
        'buff:sword': {
          stackingType: 'unlimited',
          blackboard: {},
          scheduledSequences: [
            { startFrame: 6, sequence: { steps: [damageStep('sword-hit', 'sword-hit')] } },
          ],
        },
      }),
    ).toEqual([
      {
        hitId: deriveHitId('cast:1', 'sword-hit'),
        frameOffset: 16,
        stepKey: 'sword-hit',
        conditional: true,
      },
    ]);
  });

  it('does not follow Buff work that explicitly drops the source cast identity', () => {
    const cast = createCast([
      {
        kind: 'applyBuff',
        parameters: {
          buffId: 'buff:passive',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          definition: {
            stackingType: 'unique',
            blackboard: {},
            scheduledSequences: [
              { startFrame: 6, sequence: { steps: [damageStep('passive-hit', 'passive-hit')] } },
            ],
          },
        },
      },
    ]);

    expect(projectCastHitMarkers(cast, fixtureDef(cast))).toEqual([]);
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
