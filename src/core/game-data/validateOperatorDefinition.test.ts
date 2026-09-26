import { describe, expect, it } from 'vitest';
import { validateOperatorDefinition } from './validateOperatorDefinition';
import type { OperatorDefinition } from './operatorDefinition';
import type { ActionGraphReference } from '../../../packages/game-data-contract/src/actionGraph';

/**
 * validateOperatorDefinition 只校验图形态干员：程序入口是 {$sequence} 引用，
 * 节点动作在各自定义携带的 actionGraph 资源内校验。夹具直接构造图，不经过树形态。
 */
const emptySequence = { $sequence: null } as const satisfies ActionGraphReference;

function graphOperator(overrides: Partial<OperatorDefinition> = {}): OperatorDefinition {
  return {
    slug: 'fixture-operator',
    gameId: 'chr_fixture',
    rarity: 6,
    weaponType: 'sword',
    element: 'physical',
    role: 'guard',
    mainAttribute: 'strength',
    secondaryAttribute: 'agility',
    attributes: {
      strength: [1],
      agility: [1],
      intellect: [1],
      will: [1],
      baseAttack: [1],
      baseHealth: [1],
    },
    skillGroups: [],
    talents: [{ levels: 1 }, { levels: 1 }],
    potentials: [{ levels: 1 }, { levels: 1 }, { levels: 1 }, { levels: 1 }, { levels: 1 }],
    ...overrides,
  };
}

describe('validateOperatorDefinition', () => {
  it('校验被动能力事件的身份、优先级和入口引用', () => {
    const definition = graphOperator({
      passiveSkills: [
        {
          key: 'events',
          actionGraph: { main: { nodes: {} }, macros: {} },
          enableSequence: emptySequence,
          abilityEventResponses: [
            { event: 'abilityEntityFinished', priority: 0, sequence: emptySequence },
          ],
        },
      ],
    });
    expect(validateOperatorDefinition(definition)).toEqual([]);
    const draft = structuredClone(definition);
    draft.passiveSkills![0]!.abilityEventResponses![0]!.priority = 0.5;
    expect(validateOperatorDefinition(draft)).toContainEqual(
      expect.objectContaining({
        path: '$.passiveSkills[0].abilityEventResponses[0].priority',
      }),
    );
    const dangling = structuredClone(definition);
    dangling.passiveSkills![0]!.enableSequence = {} as ActionGraphReference;
    expect(validateOperatorDefinition(dangling)).toContainEqual(
      expect.objectContaining({ path: '$.passiveSkills[0].enableSequence' }),
    );
  });
  it('validates upgrade blackboard edits without requiring skill keys to already exist or mutating them', () => {
    const definition = graphOperator();
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
  it('validates declarative Buff installations against upgrade levels', () => {
    const definition = graphOperator();
    definition.talents[0]!.levels = 2;
    definition.talents[0]!.attachedBuffs = [
      { buffId: 'native-buff', blackboardAssignments: { power: [1] } },
    ];
    const issues = validateOperatorDefinition(definition);
    expect(issues).toContainEqual(
      expect.objectContaining({
        path: '$.talents[0].attachedBuffs[0].blackboardAssignments.power',
      }),
    );
  });
  it('reports missing routed execution identities without inferring them from the display group', () => {
    const definition = graphOperator({
      skillGroups: [
        {
          key: 'basicAttack',
          skillType: 'basicAttack' as const,
          levelSource: 'basicAttack' as const,
          skills: {
            key: 'basic-route',
            timelineBlockFrames: 0,
            scheduledSequences: [],
            actionGraph: { main: { nodes: {} }, macros: {} },
          },
          routedReplacementSkills: [
            {
              skill: {
                key: 'custom-route',
                timelineBlockFrames: 0,
                scheduledSequences: [],
                actionGraph: { main: { nodes: {} }, macros: {} },
              },
              skillType: 'basicAttack' as const,
              levelSource: 'basicAttack' as const,
              executionSkillKey: '',
              executionSkillGroupKey: '',
            },
          ],
        },
      ],
    });
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
    const issues = validateOperatorDefinition(graphOperator({ passiveUi }));
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
        const definition = graphOperator({ [field]: entries });
        expect(validateOperatorDefinition(definition)).toContainEqual({
          path: `$.${field}`,
          message: `expected exactly ${count} ${field}`,
        });
        expect(definition[field]).toBe(entries);
        expect(entries).toHaveLength(size);
      }
    }
  });

  it('validates graph node actions and combo-to-skill references, not only timeline skills', () => {
    expect(
      validateOperatorDefinition(
        graphOperator({
          passiveSkills: [
            {
              key: 'invalid-passive',
              enableSequence: { $sequence: 'hit' },
              actionGraph: {
                main: {
                  nodes: {
                    hit: {
                      action: {
                        kind: 'dealDamage',
                        parameters: {
                          damageType: 'physical',
                          attackScale: Number.NaN,
                          tags: ['normalAttack'],
                        },
                      },
                      next: null,
                    },
                  },
                },
                macros: {},
              },
            },
          ],
        }),
      ).some(issue => issue.path.includes('passiveSkills[0].actionGraph')),
    ).toBe(true);

    expect(
      validateOperatorDefinition(
        graphOperator({
          comboSkillConditions: [
            {
              key: 'invalid-combo-reference',
              skillKey: 'missing-combo-skill',
              event: 'enterFight',
              immediately: false,
              initialValues: {},
              sequence: emptySequence,
              actionGraph: { main: { nodes: {} }, macros: {} },
            },
          ],
        }),
      ),
    ).toContainEqual({
      path: '$.comboSkillConditions[0].skillKey',
      message: "unknown combo skill 'missing-combo-skill'",
    });
  });
});
