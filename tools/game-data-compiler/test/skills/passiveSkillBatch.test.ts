import { describe, expect, it } from 'vitest';
import { compileOperatorUpgradePassiveSkills } from '../../src/domains/operator/passiveSkillDefinition.ts';
import { compileOperatorPassivePrograms } from '../../../../src/core/compiler/compileOperatorUpgrades';

import {
  compilePassiveSkillRequestBatch,
  type PassiveSkillCompileRequestSource,
} from '../../src/index.ts';

describe('公共被动技能批量编译', () => {
  it.each([
    ['OnObtainAtb', 'skillSpGained'],
    ['OnReceiveHeal', 'receiveHeal'],
  ])('%s 使用公共被动事件程序，不嵌入旧监听步骤', (nativeEvent, event) => {
    const req: PassiveSkillCompileRequestSource = {
      originKind: 'operatorProgression',
      originId: 'effect',
      sourcePath: 'fixture',
      skillId: 'passive_fixture',
      levelSource: { kind: 'nativeDefault' },
      inputBlackboard: {},
    };
    const raw = {
      ...passiveFixture(req.skillId),
      actionGroupData: {
        timelineActions: [],
        passiveEventActions: [
          {
            abilityEvent: nativeEvent,
            actions: [
              {
                actionData: [],
                onlyExecuteWhenSourceIsMainChar: false,
                onlyExecuteWhenSourceIsGuard: false,
              },
            ],
          },
        ],
      },
    };
    const batch = compilePassiveSkillRequestBatch([req], { [req.skillId]: raw }, {});
    const result = compileOperatorUpgradePassiveSkills(['effect'], [req], batch.definitions);
    const listener = result.definitions[0]?.enableSequence.steps.find(
      step => step.kind === 'listenForCombatEvents',
    );
    expect(listener).toBeUndefined();
    expect(result.definitions[0]?.abilityEventResponses).toEqual([
      { event, priority: 0, sequence: { steps: [] } },
    ]);
    expect(
      compileOperatorPassivePrograms([], result.definitions)[0]?.abilityEventResponses?.[0]?.event,
    ).toBe(event);
  });

  it('OnAddedBuff 经公共被动编译后直达原生响应，不再生成旧触发器监听', () => {
    const req: PassiveSkillCompileRequestSource = {
      originKind: 'operatorProgression',
      originId: 'effect',
      sourcePath: 'fixture',
      skillId: 'passive_fixture',
      levelSource: { kind: 'nativeDefault' },
      inputBlackboard: {},
    };
    const raw = {
      ...passiveFixture(req.skillId),
      actionGroupData: {
        timelineActions: [],
        passiveEventActions: [
          {
            abilityEvent: 'OnAddedBuff',
            actions: [
              {
                actionData: [],
                onlyExecuteWhenSourceIsMainChar: false,
                onlyExecuteWhenSourceIsGuard: false,
              },
            ],
          },
        ],
      },
    };
    const batch = compilePassiveSkillRequestBatch([req], { [req.skillId]: raw }, {});
    const compiled = compileOperatorUpgradePassiveSkills(['effect'], [req], batch.definitions);
    expect(compiled.definitions[0]?.abilityEventResponses).toEqual([
      { event: 'addedBuff', priority: 0, sequence: { steps: [] } },
    ]);
    expect(JSON.stringify(compiled.definitions[0]?.enableSequence)).not.toContain(
      'listenForCombatEvents',
    );
    expect(
      compileOperatorPassivePrograms([], compiled.definitions)[0]?.abilityEventResponses?.[0]
        ?.event,
    ).toBe('addedBuff');
    const withStartup = {
      ...raw,
      buffs: [{ buffId: 'startup', assignBlackboard: false, assignItems: [] }],
    };
    const startupBatch = compilePassiveSkillRequestBatch([req], { [req.skillId]: withStartup }, {});
    const preserved = compileOperatorUpgradePassiveSkills(
      ['effect'],
      [req],
      startupBatch.definitions,
    );
    expect(preserved.definitions[0]?.abilityEventResponses).toEqual([
      { event: 'addedBuff', priority: 0, sequence: { steps: [] } },
    ]);
    expect(preserved.definitions[0]?.enableSequence?.steps.map(step => step.kind)).toEqual([
      'applyBuff',
    ]);
  });

  it('保留全部领域请求，但相同 SkillData 只编译一次', () => {
    const requests: PassiveSkillCompileRequestSource[] = [
      request('weapon', 'weapon_a', 'passive_fixture'),
      request('equipmentSuit', 'suit_a', 'passive_fixture'),
    ];
    const batch = compilePassiveSkillRequestBatch(
      requests,
      { passive_fixture: passiveFixture('passive_fixture') },
      { passive_fixture: patchFixture() },
    );

    expect(batch.requests).toEqual(requests);
    expect(batch.definitions).toHaveLength(1);
    expect(batch.definitions[0]).toMatchObject({
      skillId: 'passive_fixture',
      sourcePath: 'SkillData.passive_fixture',
      definition: {
        skill: { skillId: 'passive_fixture' },
        blackboard: {
          definitionLevel: 1,
          declaredDefaults: {},
          levels: [1, 2],
          values: { damage_up: [0.1, 0.2] },
        },
      },
    });
  });

  it('缺失定义时报告提出请求的原始字段路径', () => {
    expect(() =>
      compilePassiveSkillRequestBatch([request('weapon', 'weapon_a', 'missing_skill')], {}, {}),
    ).toThrow(
      'SkillData.missing_skill: missing definition requested by Fixture.weapon_a.skills[0]',
    );
  });
});

function request(
  originKind: 'weapon' | 'equipmentSuit',
  originId: string,
  skillId: string,
): PassiveSkillCompileRequestSource {
  return {
    originKind,
    originId,
    sourcePath: `Fixture.${originId}.skills[0]`,
    skillId,
    levelSource:
      originKind === 'weapon'
        ? {
            kind: 'weaponProgression',
            slotIndex: 0,
            breakthroughTemplateId: 'breakthrough_fixture',
            talentTemplateId: 'talent_fixture',
          }
        : { kind: 'equipmentSuitThreshold', level: 1, requiredCount: 3 },
    inputBlackboard: {},
  };
}

function patchFixture(): Record<string, unknown> {
  return {
    SkillPatchDataBundle: [
      { level: 1, blackboard: [{ key: 'damage_up', value: 0.1 }] },
      { level: 2, blackboard: [{ key: 'damage_up', value: 0.2 }] },
    ],
  };
}

function passiveFixture(skillId: string): Record<string, unknown> {
  return {
    actionGroupData: { timelineActions: [], passiveEventActions: [] },
    aiExclusiveFrame: 0,
    attackRangeType: 'Default',
    blackboard: [],
    buffs: [],
    canCastInAir: false,
    canDummyCast: false,
    canMove: false,
    cardAttributeModifier: { attributeModifiers: [], isConvertedAttribute: false },
    castData: {},
    castType: 'Passive',
    characterReturnToIdle: false,
    comboSkillUIBigSpriteName: '',
    comboSkillUISpriteName: '',
    dontInterruptCombo: false,
    dummyPositionOffset: {},
    durationFrame: 0,
    exclusiveFrame: 0,
    hittableAttackRange: 0,
    iconBgType: 'Default',
    iconId: '',
    level: 1,
    needEnemyOutOfScreenWarning: false,
    needEnemyOutOfScreenWarningOverrideValue: false,
    offsetRecordFrame: 0,
    overrideHittableObjAttackRange: false,
    overrideNeedEnemyOutOfScreenWarning: false,
    passiveSkillType: 'AddBuff',
    rootMotionCliffCheck: false,
    selectStrategy: {},
    showNotRecommendState: false,
    skillHighlightCondition: {},
    skillId,
    skillName: '',
    skillSpecification: 'Default',
    skillTags: { predefinedTag: [] },
    smartTargetBuffFindSettings: {},
    smartTargetBuffIds: [],
    smartTargetSelectStrategy: {},
    smartTargetTagQuery: {},
    switchToBuffConfig: {
      condition: {},
      buffs: [],
      buffSource: {},
      targets: {},
      asSkillCast: false,
    },
    switchToCenterBeforeCast: false,
    tagDuringAttach: {},
    toggleBuffs: [],
    uiRangeHints: [],
    useAIExclusiveFrame: false,
  };
}
