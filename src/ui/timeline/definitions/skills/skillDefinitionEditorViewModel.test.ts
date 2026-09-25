import { describe, expect, it } from 'vitest';
import type { SkillDefinition } from '../../../../core/game-data/operatorDefinition';
import {
  appendSkillEditorCost,
  appendSkillEditorSequence,
  appendSkillEditorStep,
  applySkillEditorCost,
  applySkillEditorEnhancementStateBuffId,
  applySkillEditorField,
  applySkillEditorSequenceFrames,
  createSkillEditorDraft,
  createSkillEditorStep,
  EDITABLE_COMBAT_STEP_KINDS,
  createCombatEventResponseDraft,
  createBuffAbilityEventResponseDraft,
  createBuffIgniteEventResponseDraft,
  createSkillEventHandlerDraft,
  duplicateSkillEditorDetachedStep,
  duplicateSkillEditorStep,
  duplicateSkillEditorSequence,
  moveSkillEditorSequence,
  moveSkillEditorStep,
  projectActionValueOperandForEditor,
  projectSkillEditor,
  replaceActionValueOperandForEditor,
  replaceLevelValueForEditor,
  resolveLevelValueForEditor,
  removeSkillEditorStep,
  removeSkillEditorSequence,
  removeSkillEditorCost,
  replaceSkillEditorStep,
  switchActionValueOperandKind,
} from './skillDefinitionEditorViewModel';
import { validateSkillDefinition } from '../../../../core/game-data/validateSkillDefinition';

describe('LevelValues editor helpers', () => {
  it('读取并只替换当前等级的数组项', () => {
    const values = [0.25, 0.4, 0.57] as const;

    expect(resolveLevelValueForEditor(values, 2)).toBe(0.4);
    expect(replaceLevelValueForEditor(values, 2, 0.45)).toEqual([0.25, 0.45, 0.57]);
    expect(values).toEqual([0.25, 0.4, 0.57]);
  });

  it('单值对所有等级生效并保持单值结构', () => {
    expect(resolveLevelValueForEditor(1.2, 12)).toBe(1.2);
    expect(replaceLevelValueForEditor(1.2, 12, 1.5)).toBe(1.5);
  });
});

describe('技能顶层结构默认值', () => {
  it('每种可新增步骤的默认草稿都能通过严格定义校验', () => {
    const template = templateDefinition();
    const currentAbilityEntityKinds = new Set([
      'readAbilityEntityRemainingDuration',
      'setAbilityEntityRemainingDuration',
      'finishCurrentAbilityEntity',
      'finishCurrentAbilityEntityWhenSourceDies',
      'startCurrentAbilityEntityChildSkillById',
      'startCurrentAbilityEntityChildSkill',
    ]);
    for (const kind of EDITABLE_COMBAT_STEP_KINDS) {
      const step = createSkillEditorStep(template, kind);
      const validatedStep = currentAbilityEntityKinds.has(kind)
        ? {
            kind: 'forEachContextTarget' as const,
            parameters: { contextKey: 'entities' },
            body: { steps: [step] },
          }
        : step;
      const draft = {
        ...template,
        scheduledSequences: [{ startFrame: 0, endFrame: 1, sequence: { steps: [validatedStep] } }],
      };
      expect(validateSkillDefinition(draft), kind).toEqual([]);
    }
  });

  it('原生延迟施放允许协议与运行时均支持的施法者目标', () => {
    const template = templateDefinition();
    const step = createSkillEditorStep(template, 'castSkillDuringAction');
    if (step.kind !== 'castSkillDuringAction') throw new Error('expected castSkillDuringAction');
    const draft = {
      ...template,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: { steps: [{ ...step, parameters: { ...step.parameters, target: 'caster' } }] },
        },
      ],
    };
    expect(validateSkillDefinition(draft)).toEqual([]);
  });

  it('队伍目标严格校验接受公共协议的全员快照与当前迭代目标排除项', () => {
    const template = templateDefinition();
    const allOperators = createSkillEditorStep(template, 'findCharacterTeamTargets');
    if (allOperators.kind !== 'findCharacterTeamTargets') throw new Error('expected team query');
    const lowest = {
      ...allOperators,
      parameters: {
        ...allOperators.parameters,
        selection: {
          kind: 'lowestHealthRatioOperator' as const,
          excludeCurrentTarget: true as const,
        },
      },
    };
    const validate = (step: typeof allOperators | typeof lowest) =>
      validateSkillDefinition({
        ...template,
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: {
              steps: [
                step === allOperators
                  ? {
                      ...step,
                      parameters: { ...step.parameters, selection: { kind: 'allOperators' } },
                    }
                  : step,
              ],
            },
          },
        ],
      });
    expect(validate(allOperators)).toEqual([]);
    expect(validate(lowest)).toEqual([]);
  });

  it('投射物结束回调拒绝负延迟并严格校验其独立时间轴', () => {
    const template = templateDefinition();
    const step = createSkillEditorStep(template, 'launchProjectile');
    if (step.kind !== 'launchProjectile') throw new Error('expected callback');
    const draft = {
      ...template,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                ...step,
                parameters: { finish: -1, recycleDelaySeconds: 0 },
                callbacks: [
                  {
                    event: 'finish',
                    skill: {
                      ...step.callbacks[0]!.skill,
                      scheduledSequences: [
                        {
                          startFrame: 0,
                          endFrame: 1,
                          sequence: {
                            steps: [
                              {
                                kind: 'jumpTimeline' as const,
                                parameters: { destinationFrame: -1 },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    };
    expect(validateSkillDefinition(draft).map(issue => issue.path)).toEqual(
      expect.arrayContaining([
        '$.scheduledSequences[0].sequence.steps[0].parameters.finish',
        '$.scheduledSequences[0].sequence.steps[0].callbacks[0].skill.scheduledSequences[0].sequence.steps[0].parameters.destinationFrame',
      ]),
    );
  });

  it('回调必须声明自身原生类型，不从外层技能补全', () => {
    const template = templateDefinition();
    const step = createSkillEditorStep(template, 'launchProjectile');
    if (step.kind !== 'launchProjectile') throw new Error('expected callback');
    Reflect.deleteProperty(step.callbacks[0]!.skill, 'nativeSkillType');
    const issues = validateSkillDefinition({
      ...template,
      scheduledSequences: [{ startFrame: 0, sequence: { steps: [step] } }],
    });
    expect(issues.map(issue => issue.path)).toContain(
      '$.scheduledSequences[0].sequence.steps[0].callbacks[0].skill.nativeSkillType',
    );
  });

  it('Buff 继承白名单允许正式数据使用的空列表', () => {
    const template = templateDefinition();
    const step = createSkillEditorStep(template, 'inheritBuffById');
    if (step.kind !== 'inheritBuffById') throw new Error('expected inheritBuffById');
    const draft = {
      ...template,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [{ ...step, parameters: { ...step.parameters, inheritToNextSkillIds: [] } }],
          },
        },
      ],
    };
    expect(validateSkillDefinition(draft)).toEqual([]);
  });

  it('Switch 默认值可保存，重复伤害 key 与缺失候选序列能被校验器定位', () => {
    const template = templateDefinition();
    const step = createSkillEditorStep(template, 'switch');
    const draft = {
      ...template,
      scheduledSequences: [{ startFrame: 0, sequence: { steps: [step] } }],
    };
    expect(validateSkillDefinition(draft)).toEqual([]);
    if (step.kind !== 'switch') throw new Error('expected switch');
    const damage = template.scheduledSequences[0]!.sequence.steps[0]!;
    const duplicate = {
      ...step,
      options: [0, 1].map(value => ({
        value: { kind: 'constant', value },
        sequence: { steps: [damage] },
      })),
    };
    expect(
      validateSkillDefinition({
        ...draft,
        scheduledSequences: [{ startFrame: 0, sequence: { steps: [duplicate] } }],
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: expect.stringContaining('duplicate damage step key') }),
      ]),
    );
    const invalid = { ...step, options: [{ value: { kind: 'constant', value: 0 } }] };
    expect(
      validateSkillDefinition({
        ...draft,
        scheduledSequences: [{ startFrame: 0, sequence: { steps: [invalid] } }],
      }).map(issue => issue.path),
    ).toContain('$.scheduledSequences[0].sequence.steps[0].options[0].sequence');
  });

  it('复制脱离序列的嵌套步骤时会重建其中的伤害步骤键', () => {
    const draft = templateDefinition();
    const copied = duplicateSkillEditorDetachedStep(draft, {
      kind: 'conditional',
      parameters: {
        condition: { kind: 'combatActive' },
      },
      whenTrue: {
        steps: [
          {
            key: 'damage',
            kind: 'dealDamage',
            parameters: { damageType: 'physical', attackScale: 1, tags: ['normalAttack'] },
          },
        ],
      },
    });

    expect(copied).toMatchObject({
      kind: 'conditional',
      whenTrue: { steps: [{ key: 'damage-copy' }] },
    });
  });
});

describe('ActionValueOperand editor helpers', () => {
  it('投影区分黑板引用与常量', () => {
    expect(projectActionValueOperandForEditor({ kind: 'blackboard', key: 'atk' })).toEqual({
      kind: 'blackboard',
      key: 'atk',
      constant: undefined,
    });
    expect(projectActionValueOperandForEditor({ kind: 'constant', value: 3 })).toEqual({
      kind: 'constant',
      key: undefined,
      constant: 3,
    });
  });

  it('编辑常量或黑板键只替换对应部分', () => {
    expect(
      replaceActionValueOperandForEditor(
        { kind: 'constant', value: 1 },
        { kind: 'constant', constant: 5 },
      ),
    ).toEqual({ kind: 'constant', value: 5 });
    expect(
      replaceActionValueOperandForEditor(
        { kind: 'blackboard', key: 'a' },
        { kind: 'blackboard', key: 'b' },
      ),
    ).toEqual({ kind: 'blackboard', key: 'b' });
    expect(
      replaceActionValueOperandForEditor(
        { kind: 'blackboard', key: 'a', fallback: 0 },
        { kind: 'blackboard', key: 'b' },
      ),
    ).toEqual({ kind: 'blackboard', key: 'b', fallback: 0 });
    expect(
      replaceActionValueOperandForEditor(
        { kind: 'constant', value: 1 },
        { kind: 'blackboard', key: 'k' },
      ),
    ).toEqual({ kind: 'blackboard', key: 'k' });
  });

  it('拒绝非有限常量', () => {
    expect(
      replaceActionValueOperandForEditor(
        { kind: 'constant', value: 1 },
        { kind: 'constant', constant: Number.NaN },
      ),
    ).toEqual({ kind: 'constant', value: 1 });
  });

  it('切换表达形式生成合法的空黑板键或零常量', () => {
    expect(switchActionValueOperandKind({ kind: 'constant', value: 4 }, 'blackboard')).toEqual({
      kind: 'blackboard',
      key: '',
    });
    expect(switchActionValueOperandKind({ kind: 'blackboard', key: 'x' }, 'constant')).toEqual({
      kind: 'constant',
      value: 0,
    });
    expect(switchActionValueOperandKind({ kind: 'constant', value: 4 }, 'constant')).toEqual({
      kind: 'constant',
      value: 4,
    });
  });
});

function templateDefinition(): SkillDefinition {
  return {
    key: 'skill',
    timelineBlockFrames: 30,
    cooldownFrames: 600,
    costs: [{ resource: 'sp', value: 100 }],
    costFrame: 2,
    scheduledSequences: [
      {
        startFrame: 5,
        sequence: {
          steps: [
            {
              key: 'damage',
              kind: 'dealDamage',
              parameters: {
                damageType: 'physical',
                attackScale: 1,
                tags: ['normalAttack'],
              },
            },
            {
              kind: 'applyElementalInfliction',
              parameters: { element: 'electric', isExtra: false },
            },
          ],
        },
      },
      {
        startFrame: 12,
        endFrame: 20,
        sequence: {
          steps: [
            {
              kind: 'changeResource',
              parameters: { resource: 'sp', amount: 10, recipient: 'caster' },
            },
          ],
        },
      },
    ],
  };
}

describe('skillDefinitionEditorViewModel', () => {
  it('creates a structurally valid event response with a unique stable key', () => {
    expect(createCombatEventResponseDraft(['event-response-2', 'event-response-3'])).toEqual({
      key: 'event-response-4',
      event: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
      sequence: { steps: [] },
    });
  });

  it('creates a valid skill event handler with a unique key and required sequence', () => {
    expect(createSkillEventHandlerDraft(['skill-event-handler-2'])).toEqual({
      key: 'skill-event-handler-3',
      event: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
      scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
    });
  });
  it('creates minimal Buff event-response drafts without inventing response steps', () => {
    expect(createBuffAbilityEventResponseDraft()).toEqual({
      event: 'outputDamage',
      priority: 0,
      sequence: { steps: [] },
    });
    expect(createBuffIgniteEventResponseDraft()).toEqual({
      igniteType: 'custom-ignite',
      finishAfterIgnited: false,
      sequence: { steps: [] },
    });
  });
  it('新建能力实体步骤只提供待选择的干员级蓝图引用', () => {
    const draft = createSkillEditorDraft(templateDefinition(), undefined);
    const step = createSkillEditorStep(draft, 'spawnAbilityEntity');
    const withStep = replaceSkillEditorStep(draft, 0, 0, step);

    expect(step).toEqual({
      kind: 'spawnAbilityEntity',
      parameters: {
        abilityEntityId: 'custom-ability-entity',
        dieWhenSourceDies: false,
      },
    });
    expect(validateSkillDefinition(withStep)).toEqual([]);
  });

  it('建立隔离草稿，编辑不影响模板', () => {
    const template = templateDefinition();
    const draft = createSkillEditorDraft(template, undefined);

    const edited = applySkillEditorField(draft, { field: 'timelineBlockFrames', value: 45 });
    expect(edited.timelineBlockFrames).toBe(45);
    expect(template.timelineBlockFrames).toBe(30);
    expect(draft.timelineBlockFrames).toBe(30);
  });

  it('以已有自定义定义为基底而不是模板', () => {
    const template = templateDefinition();
    const custom = createSkillEditorDraft(template, undefined);
    custom.costFrame = 9;

    const draft = createSkillEditorDraft(template, custom);
    expect(draft.costFrame).toBe(9);
  });

  it('投影区分单值可编辑与逐等级数组', () => {
    const template = templateDefinition();
    const draft = createSkillEditorDraft(template, undefined);

    const view = projectSkillEditor(template, draft, true);
    expect(view.cooldownFrames).toEqual({ value: 600, isLevelArray: false, changed: false });

    const arrayDraft = { ...draft, cooldownFrames: [600, 620, 640] };
    const arrayView = projectSkillEditor(template, arrayDraft, true);
    expect(arrayView.cooldownFrames).toEqual({
      value: undefined,
      isLevelArray: true,
      changed: true,
    });
  });

  it('投影输出调度序列的帧与 step 顺序摘要', () => {
    const template = templateDefinition();
    const draft = createSkillEditorDraft(template, undefined);

    const view = projectSkillEditor(template, draft, true);
    expect(view.sequences).toEqual([
      {
        index: 0,
        startFrame: 5,
        endFrame: undefined,
        stepKinds: ['dealDamage', 'applyElementalInfliction'],
        steps: [
          {
            kind: 'dealDamage',
            key: 'damage',
            parameterNames: ['damageType', 'attackScale', 'tags'],
          },
          {
            kind: 'applyElementalInfliction',
            key: undefined,
            parameterNames: ['element', 'isExtra'],
          },
        ],
        startFrameChanged: false,
        endFrameChanged: false,
      },
      {
        index: 1,
        startFrame: 12,
        endFrame: 20,
        stepKinds: ['changeResource'],
        steps: [
          {
            kind: 'changeResource',
            key: undefined,
            parameterNames: ['resource', 'amount', 'recipient'],
          },
        ],
        startFrameChanged: false,
        endFrameChanged: false,
      },
    ]);
  });

  it('未修改的模板草稿差异为零', () => {
    const template = templateDefinition();
    const draft = createSkillEditorDraft(template, undefined);

    const view = projectSkillEditor(template, draft, false);
    expect(view.customized).toBe(false);
    expect(view.diffCount).toBe(0);
  });

  it('首次编辑也显示结构差异，恢复原草稿后归零但不改保存身份', () => {
    const template = templateDefinition();
    const initial = createSkillEditorDraft(template, undefined);
    const edited = { ...initial, scheduledSequences: initial.scheduledSequences.slice(1) };
    expect(projectSkillEditor(template, edited, false).diffCount).toBeGreaterThan(0);
    expect(projectSkillEditor(template, edited, false).customized).toBe(false);
    expect(projectSkillEditor(template, initial, false).diffCount).toBe(0);
    expect(projectSkillEditor(template, initial, true).customized).toBe(true);
    expect(projectSkillEditor(template, initial, true).diffCount).toBe(0);
    expect(template.scheduledSequences).toHaveLength(initial.scheduledSequences.length);
  });

  it('首次修改字段的差异不依赖是否已有自定义定义', () => {
    const template = templateDefinition();
    const edited = applySkillEditorField(createSkillEditorDraft(template, undefined), {
      field: 'costFrame',
      value: 8,
    });
    expect(projectSkillEditor(template, edited, false).diffCount).toBe(1);
  });

  it('自定义后统计草稿相对模板的差异数量', () => {
    const template = templateDefinition();
    const draft = createSkillEditorDraft(template, undefined);

    const edited = applySkillEditorField(draft, { field: 'costFrame', value: 8 });
    const view = projectSkillEditor(template, edited, true);
    expect(view.customized).toBe(true);
    expect(view.diffCount).toBe(1);
  });

  it('拒绝非整数或负数的单值字段更新', () => {
    const template = templateDefinition();
    const draft = createSkillEditorDraft(template, undefined);

    expect(applySkillEditorField(draft, { field: 'timelineBlockFrames', value: 1.5 })).toBe(draft);
    expect(applySkillEditorField(draft, { field: 'timelineBlockFrames', value: -1 })).toBe(draft);
  });

  it('可清空可选顶层帧字段，但不能清空技能块宽度', () => {
    const draft = createSkillEditorDraft(templateDefinition(), undefined);

    expect(applySkillEditorField(draft, { field: 'timelineBlockFrames', value: undefined })).toBe(
      draft,
    );
    expect(
      applySkillEditorField(draft, { field: 'cooldownFrames', value: undefined }),
    ).not.toHaveProperty('cooldownFrames');
    expect(
      applySkillEditorField(draft, { field: 'costFrame', value: undefined }),
    ).not.toHaveProperty('costFrame');
  });

  it('编辑显式强化 Buff 身份并用空值删除绑定', () => {
    const template = templateDefinition();
    const draft = createSkillEditorDraft(template, undefined);
    const edited = applySkillEditorEnhancementStateBuffId(draft, ' buff:enhancement ');

    expect(edited.enhancementStateBuffId).toBe('buff:enhancement');
    expect(projectSkillEditor(template, edited, true)).toMatchObject({
      enhancementStateBuffId: 'buff:enhancement',
      enhancementStateBuffIdChanged: true,
    });
    expect(applySkillEditorEnhancementStateBuffId(edited, ' ')).not.toHaveProperty(
      'enhancementStateBuffId',
    );
    expect(
      validateSkillDefinition({ ...template, enhancementStateBuffId: '' }).map(issue => issue.path),
    ).toContain('$.enhancementStateBuffId');
  });

  it('编辑调度序列 startFrame 与 endFrame，删除 endFrame 合法', () => {
    const template = templateDefinition();
    const draft = createSkillEditorDraft(template, undefined);

    const moved = applySkillEditorSequenceFrames(draft, 1, 'startFrame', 14);
    expect(moved.scheduledSequences[1]!.startFrame).toBe(14);

    const withEnd = applySkillEditorSequenceFrames(draft, 0, 'endFrame', 9);
    expect(withEnd.scheduledSequences[0]!.endFrame).toBe(9);

    const withoutEnd = applySkillEditorSequenceFrames(withEnd, 0, 'endFrame', undefined);
    expect(withoutEnd.scheduledSequences[0]).not.toHaveProperty('endFrame');
  });

  it('拒绝非法的序列帧编辑', () => {
    const template = templateDefinition();
    const draft = createSkillEditorDraft(template, undefined);

    expect(applySkillEditorSequenceFrames(draft, 0, 'startFrame', -1)).toBe(draft);
    expect(applySkillEditorSequenceFrames(draft, 0, 'startFrame', 3.5)).toBe(draft);
  });

  it('编辑单值费用，数组费用保持只读', () => {
    const template = templateDefinition();
    const draft = createSkillEditorDraft(template, undefined);

    const updated = applySkillEditorCost(draft, 0, { value: 150 });
    expect(updated.costs?.[0]?.value).toBe(150);

    const arrayCost: SkillDefinition = {
      ...draft,
      costs: [{ resource: 'sp', value: [100, 120, 140] }],
    };
    expect(applySkillEditorCost(arrayCost, 0, { value: 200 })).toBe(arrayCost);
    expect(applySkillEditorCost(arrayCost, 0, { value: -1 })).toBe(arrayCost);
  });

  it('编辑首个费用时保留其余费用项', () => {
    const template = templateDefinition();
    const draft: SkillDefinition = {
      ...createSkillEditorDraft(template, undefined),
      costs: [
        { resource: 'sp', value: 100 },
        { resource: 'ultimateEnergy', value: 20 },
      ],
    };

    const updated = applySkillEditorCost(draft, 0, { value: 150 });
    expect(updated.costs).toEqual([
      { resource: 'sp', value: 150 },
      { resource: 'ultimateEnergy', value: 20 },
    ]);
  });

  it('可逐项编辑费用资源，无费用时保持原草稿', () => {
    const template: SkillDefinition = {
      ...templateDefinition(),
      costs: undefined,
    };
    const draft = createSkillEditorDraft(template, undefined);

    expect(applySkillEditorCost(draft, 0, { value: 80 })).toBe(draft);

    const withCosts = createSkillEditorDraft(templateDefinition(), undefined);
    const changed = applySkillEditorCost(withCosts, 0, { resource: 'ultimateEnergy' });
    expect(changed.costs?.[0]?.resource).toBe('ultimateEnergy');
  });

  it('可添加和删除费用，最后一项删除后移除可选字段', () => {
    const draft: SkillDefinition = { ...templateDefinition(), costs: undefined };
    const appended = appendSkillEditorCost(draft);
    expect(appended.costs).toEqual([{ resource: 'sp', value: 0 }]);

    const removed = removeSkillEditorCost(appended, 0);
    expect(removed).not.toHaveProperty('costs');
    expect(removeSkillEditorCost(removed, 0)).toBe(removed);
  });

  it('新增的每种专用步骤都能通过严格结构校验', () => {
    let draft = createSkillEditorDraft(templateDefinition(), undefined);
    for (const kind of [
      'startTimeDilation',
      'startUltimateTimeDilation',
      'dealDamage',
      'dealFixedDamage',
      'dealStagger',
      'heal',
      'applyElementalInfliction',
      'applyElementalReaction',
      'consumeElementalReaction',
      'applyBuff',
      'readBuffBlackboard',
      'readBuffStackCount',
      'finishBuffsByTag',
      'finishBuffsById',
      'holdBuffsById',
      'adjustSkillCooldown',
      'conditional',
      'once',
      'modifyActionValue',
      'calculateActionValue',
      'changeResource',
      'changeResourceByActionValue',
      'gainSquadUltimateEnergyFromSkillCost',
      'gainFinisherSp',
      'applyStatus',
      'consumeStatus',
      'createTimedMarker',
      'setContextFlag',
      'openComboWindow',
    ] as const) {
      draft = appendSkillEditorStep(draft, 0, kind);
    }

    expect(validateSkillDefinition(draft)).toEqual([]);
    expect(draft.scheduledSequences[0]!.sequence.steps.slice(-29).map(step => step.kind)).toEqual([
      'startTimeDilation',
      'startUltimateTimeDilation',
      'dealDamage',
      'dealFixedDamage',
      'dealStagger',
      'heal',
      'applyElementalInfliction',
      'applyElementalReaction',
      'consumeElementalReaction',
      'applyBuff',
      'readBuffBlackboard',
      'readBuffStackCount',
      'finishBuffsByTag',
      'finishBuffsById',
      'holdBuffsById',
      'adjustSkillCooldown',
      'conditional',
      'once',
      'modifyActionValue',
      'calculateActionValue',
      'changeResource',
      'changeResourceByActionValue',
      'gainSquadUltimateEnergyFromSkillCost',
      'gainFinisherSp',
      'applyStatus',
      'consumeStatus',
      'createTimedMarker',
      'setContextFlag',
      'openComboWindow',
    ]);
  });

  it('时间膨胀步骤保留可编译的判别联合参数', () => {
    let draft = createSkillEditorDraft(templateDefinition(), undefined);
    draft = appendSkillEditorStep(draft, 0, 'startTimeDilation');
    draft = appendSkillEditorStep(draft, 0, 'startUltimateTimeDilation');

    const ordinary = draft.scheduledSequences[0]!.sequence.steps.at(-2);
    const ultimate = draft.scheduledSequences[0]!.sequence.steps.at(-1);
    expect(ordinary).toEqual({
      kind: 'startTimeDilation',
      parameters: {
        scope: 'global',
        durationSeconds: { kind: 'constant', value: 1 },
        slot: 'unassigned',
        priority: 0,
        curve: { kind: 'named', key: 'RESETto1' },
        finishByAction: false,
        ignoredTargets: ['caster'],
      },
    });
    expect(ultimate).toEqual({
      kind: 'startUltimateTimeDilation',
      parameters: {
        priority: 0,
        targetScale: { kind: 'constant', value: 0 },
        ignoredTargets: [],
      },
    });
    expect(validateSkillDefinition(draft)).toEqual([]);
  });

  it('移动步骤会改变同帧执行顺序且不改其他序列', () => {
    const draft = createSkillEditorDraft(templateDefinition(), undefined);
    const moved = moveSkillEditorStep(draft, 0, 1, -1);

    expect(moved.scheduledSequences[0]!.sequence.steps.map(step => step.kind)).toEqual([
      'applyElementalInfliction',
      'dealDamage',
    ]);
    expect(moved.scheduledSequences[1]).toEqual(draft.scheduledSequences[1]);
    expect(moveSkillEditorStep(draft, 0, 0, -1)).toBe(draft);
  });

  it('复制伤害步骤时重新分配唯一 key', () => {
    const template = templateDefinition();
    const first = template.scheduledSequences[0]!.sequence.steps[0]!;
    if (first.kind !== 'dealDamage') throw new Error('expected damage step');
    const draft = replaceSkillEditorStep(template, 0, 0, { ...first, key: 'damage' });

    const copied = duplicateSkillEditorStep(draft, 0, 0);
    const steps = copied.scheduledSequences[0]!.sequence.steps;
    expect(steps[0]!.key).toBe('damage');
    expect(steps[1]!.key).toBe('damage-copy');
    expect(validateSkillDefinition(copied)).toEqual([]);
  });

  it('删除步骤后允许保留空序列作为编辑占位', () => {
    const draft = createSkillEditorDraft(templateDefinition(), undefined);
    const removed = removeSkillEditorStep(draft, 0, 0);
    expect(removed.scheduledSequences[0]!.sequence.steps).toHaveLength(1);
    const empty = removeSkillEditorStep(removed, 0, 0);
    expect(empty.scheduledSequences[0]!.sequence.steps).toEqual([]);
  });

  it('替换步骤只修改指定位置', () => {
    const draft = createSkillEditorDraft(templateDefinition(), undefined);
    const replacement = {
      kind: 'dealStagger' as const,
      parameters: { value: 25 },
    };
    const changed = replaceSkillEditorStep(draft, 1, 0, replacement);

    expect(changed.scheduledSequences[1]!.sequence.steps[0]).toEqual(replacement);
    expect(changed.scheduledSequences[0]).toEqual(draft.scheduledSequences[0]);
  });

  it('新增、移动和删除调度序列保持结构可编辑', () => {
    const draft = createSkillEditorDraft(templateDefinition(), undefined);
    const appended = appendSkillEditorSequence(draft);
    expect(appended.scheduledSequences).toHaveLength(3);
    expect(appended.scheduledSequences[2]).toEqual({
      startFrame: 12,
      sequence: { steps: [] },
    });

    const moved = moveSkillEditorSequence(appended, 2, -1);
    expect(moved.scheduledSequences[1]!.sequence.steps).toEqual([]);
    expect(removeSkillEditorSequence(moved, 1).scheduledSequences).toHaveLength(2);
  });

  it('复制调度序列时重建嵌套伤害 key', () => {
    const draft = createSkillEditorDraft(templateDefinition(), undefined);
    const copied = duplicateSkillEditorSequence(draft, 0);

    expect(copied.scheduledSequences).toHaveLength(3);
    expect(copied.scheduledSequences[0]!.sequence.steps[0]!.key).toBe('damage');
    expect(copied.scheduledSequences[1]!.sequence.steps[0]!.key).toBe('damage-copy');
    expect(validateSkillDefinition(copied)).toEqual([]);
  });

  it('不允许删除唯一的调度序列', () => {
    const draft: SkillDefinition = {
      ...templateDefinition(),
      scheduledSequences: [templateDefinition().scheduledSequences[0]!],
    };
    expect(removeSkillEditorSequence(draft, 0)).toBe(draft);
  });
});
