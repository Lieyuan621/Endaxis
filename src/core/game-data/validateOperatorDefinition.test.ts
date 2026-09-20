import { describe, expect, it } from 'vitest';
import { gameDataRepository } from '../../data/gameDataRepository';
import { perlica } from '../../data/operators/perlica.generated';
import { validateOperatorDefinition } from './validateOperatorDefinition';

describe('validateOperatorDefinition', () => {
  it('校验被动能力事件的身份、优先级和动作序列', () => {
    const definition = structuredClone(perlica);
    definition.passiveSkills = [
      {
        key: 'events',
        enableSequence: { steps: [] },
        abilityEventResponses: [
          { event: 'abilityEntityFinished', priority: 0, sequence: { steps: [] } },
        ],
      },
    ];
    expect(validateOperatorDefinition(definition)).toEqual([]);
    definition.passiveSkills[0]!.abilityEventResponses![0]!.priority = 0.5;
    expect(validateOperatorDefinition(definition)).toContainEqual(
      expect.objectContaining({
        path: '$.passiveSkills[0].abilityEventResponses[0].priority',
      }),
    );
  });
  it('validates upgrade blackboard edits without requiring skill keys to already exist or mutating them', () => {
    const definition = structuredClone(perlica);
    definition.talents[0]!.modifiers = [
      {
        kind: 'patchSkillBlackboard',
        skillGroupKey: 'battleSkill',
        blackboardKey: ' ',
        operation: 'assign',
        value: 1,
      },
      {
        kind: 'patchPassiveBlackboard',
        passiveSkillKey: 'custom',
        blackboardKey: '',
        operation: 'add',
        value: NaN,
      },
      {
        kind: 'patchSkillBlackboard',
        skillGroupKey: 'battleSkill',
        blackboardKey: 'new-key',
        operation: 'assign',
        value: [1, 2],
      },
    ];
    const paths = validateOperatorDefinition(definition).map(issue => issue.path);
    expect(paths).toContain('$.talents[0].modifiers[0].blackboardKey');
    expect(paths).toContain('$.talents[0].modifiers[1].blackboardKey');
    expect(paths).toContain('$.talents[0].modifiers[1].value');
    expect(paths.some(path => path.startsWith('$.talents[0].modifiers[2]'))).toBe(false);
    expect(definition.talents[0]!.modifiers[0]).toMatchObject({ blackboardKey: ' ' });
  });
  it('reports missing routed execution identities without inferring them from the display group', () => {
    const definition = {
      ...perlica,
      skillGroups: [
        {
          ...perlica.skillGroups[0]!,
          routedReplacementSkills: [
            {
              skill: { key: 'custom-route', timelineBlockFrames: 0, scheduledSequences: [] },
              skillType: 'basicAttack' as const,
              levelSource: 'basicAttack' as const,
              executionSkillKey: '',
              executionSkillGroupKey: '',
            },
          ],
        },
      ],
    };
    const paths = validateOperatorDefinition(definition).map(issue => issue.path);
    expect(paths).toContain('$.skillGroups[0].routedReplacementSkills[0].executionSkillKey');
    expect(paths).toContain('$.skillGroups[0].routedReplacementSkills[0].executionSkillGroupKey');
  });
  it('reports incomplete status presentation without rewriting the draft', () => {
    const passiveUi = {
      kind: 'buffCounters' as const,
      appearance: 'typhoeaArrows' as const,
      reserveArrowBuffId: '',
      battleArrowBuffId: '  ',
      pointBuffId: 'future-definition',
      maximumArrows: Number.NaN,
      maximumPoints: 3,
    };
    const issues = validateOperatorDefinition({ ...perlica, passiveUi });
    expect(issues.map(issue => issue.path)).toEqual([
      '$.passiveUi.reserveArrowBuffId',
      '$.passiveUi.battleArrowBuffId',
      '$.passiveUi.maximumArrows',
    ]);
    expect(passiveUi.reserveArrowBuffId).toBe('');
    expect(passiveUi.pointBuffId).toBe('future-definition');
  });
  it('requires exactly two talents and five potentials without normalizing invalid drafts', () => {
    for (const [field, count] of [
      ['talents', 2],
      ['potentials', 5],
    ] as const) {
      for (const size of [0, count - 1, count + 1]) {
        const entries = Array.from({ length: size }, () => ({
          levels: 1,
        }));
        const definition = { ...perlica, [field]: entries };
        expect(validateOperatorDefinition(definition)).toContainEqual({
          path: `$.${field}`,
          message: `expected exactly ${count} ${field}`,
        });
        expect(definition[field]).toBe(entries);
        expect(entries).toHaveLength(size);
      }
    }
  });
  it('accepts every registered operator through one complete-definition entry point', () => {
    const issues = gameDataRepository
      .getOperators()
      .flatMap(operator => validateOperatorDefinition(operator, `$.operators['${operator.slug}']`));
    expect(issues).toEqual([]);
  });

  it('validates root programs and combo-to-skill references, not only timeline skills', () => {
    expect(
      validateOperatorDefinition({
        ...perlica,
        passiveSkills: [
          {
            key: 'invalid-passive',
            enableSequence: {
              steps: [
                {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'physical',
                    attackScale: Number.NaN,
                    tags: ['normalAttack'],
                  },
                },
              ],
            },
          },
        ],
      }).some(issue => issue.path.includes('passiveSkills[0].enableSequence')),
    ).toBe(true);

    expect(
      validateOperatorDefinition({
        ...perlica,
        comboSkillConditions: [
          {
            key: 'invalid-combo-reference',
            skillKey: 'missing-combo-skill',
            event: 'enterFight',
            immediately: false,
            initialValues: {},
            sequence: { steps: [] },
          },
        ],
      }),
    ).toContainEqual({
      path: '$.comboSkillConditions[0].skillKey',
      message: "unknown combo skill 'missing-combo-skill'",
    });
  });
});
