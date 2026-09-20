import { describe, expect, it } from 'vitest';
import { renderOperatorDefinitionSource } from '../src/domains/operator/definitionSourceRenderer.ts';
import { instantiateActionSequence } from '../../../src/data/operators/definitionHelpers.ts';

describe('complete operator definition source renderer', () => {
  it('uses the established definition helpers and named skill references', () => {
    const source = renderOperatorDefinitionSource({
      operator: {
        slug: 'sample-operator',
        skillGroups: [
          {
            key: 'battleSkill',
            skillType: 'battleSkill',
            levelSource: 'battleSkill',
            skills: {
              key: 'battleSkill',
              blackboard: { scale: [0.2, 0.3] },
              timelineBlockFrames: 10,
              scheduledSequences: [
                {
                  startFrame: 3,
                  sequence: {
                    steps: [
                      {
                        kind: 'dealDamage',
                        parameters: {
                          damageType: 'physical',
                          attackScale: [0.2, 0.3],
                          tags: ['normalSkill'],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    });

    expect(source).toContain("from './definitionHelpers'");
    expect(source).toContain('export const sampleOperatorBattleSkill: SkillDefinition');
    expect(source).toContain('withSkillBlackboard(');
    expect(source).toContain('scheduled(3, sequence(step(');
    expect(source).toContain('percentages([20, 30])');
    expect(source).toContain('"skills": sampleOperatorBattleSkill');
    expect(source).not.toContain('prettier-ignore');
    expect(source).not.toContain('commonBuffDefinitions');
  });

  it('shares byte-for-byte equal large action sequences', () => {
    const repeatedSequence = {
      steps: [
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'large-callback',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { payload: 'x'.repeat(1_200) },
          },
        },
      ],
    };
    const source = renderOperatorDefinitionSource({
      operator: {
        slug: 'shared-sample',
        skillGroups: [
          {
            key: 'battleSkill',
            skillType: 'battleSkill',
            levelSource: 'battleSkill',
            skills: {
              key: 'battleSkill',
              timelineBlockFrames: 1,
              scheduledSequences: [
                { startFrame: 0, sequence: repeatedSequence },
                { startFrame: 1, sequence: structuredClone(repeatedSequence) },
              ],
            },
          },
        ],
      },
    });

    expect(source).toContain('const sharedActionSequence1: ActionSequenceDefinition = sequence(');
    expect(source.match(/scheduled\([01], sharedActionSequence1\)/g)).toHaveLength(2);
    expect(source.match(/"large-callback"/g)).toHaveLength(1);
  });

  it('parameterizes generated identities while sharing otherwise equal large sequences', () => {
    const makeSequence = (key: string) => ({
      steps: [
        {
          kind: 'applyBuff',
          key,
          parameters: {
            buffId: 'identity-callback',
            target: 'enemy',
            blackboardAssignments: { payload: 'x'.repeat(1_200) },
          },
        },
      ],
    });
    const source = renderOperatorDefinitionSource({
      operator: {
        slug: 'identity-shared-sample',
        skillGroups: [
          {
            key: 'battleSkill',
            skillType: 'battleSkill',
            levelSource: 'battleSkill',
            skills: {
              key: 'battleSkill',
              timelineBlockFrames: 1,
              scheduledSequences: [
                {
                  startFrame: 0,
                  sequence: makeSequence('SkillData.one:/scheduledSequences/0'),
                },
                {
                  startFrame: 1,
                  sequence: makeSequence('SkillData.two:/scheduledSequences/0'),
                },
              ],
            },
          },
        ],
      },
    });

    expect(source).toContain('instantiateActionSequence');
    expect(source.match(/"identity-callback"/g)).toHaveLength(1);
    expect(source.match(/SkillData\.one:\/scheduledSequences\/0/g)).toHaveLength(1);
    expect(source.match(/SkillData\.two:\/scheduledSequences\/0/g)).toHaveLength(1);
    expect(source).toContain('\\u0000endaxis-generated-identity:0');
  });

  it('instantiates every generated identity placeholder without changing the template', () => {
    const template = {
      steps: [
        {
          kind: 'finishTimeline',
          parameters: {},
          key: '\u0000endaxis-generated-identity:0',
        },
      ],
    } as const;
    const instantiated = instantiateActionSequence(template, [
      'SkillData.real:/scheduledSequences/0',
    ]);

    expect(instantiated.steps[0]?.key).toBe('SkillData.real:/scheduledSequences/0');
    expect(template.steps[0].key).toBe('\u0000endaxis-generated-identity:0');
  });
});
