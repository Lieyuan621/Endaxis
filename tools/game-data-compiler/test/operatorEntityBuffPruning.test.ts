import { describe, expect, it } from 'vitest';
import {
  assembleOperatorDefinition,
  type OperatorDefinitionAssemblyInput,
} from '../src/domains/operator/definition.ts';
import { compileAbilityEntityTemplateCatalogSource } from '../src/compiler/abilities/abilityEntityCatalog.ts';
import { collectCompiledBuffApplications } from '../src/compiler/references/compiledReferences.ts';
import { compilePassiveSkillRequestBatch } from '../src/compiler/skills/passiveSkillBatch.ts';
import type { PassiveSkillCompileRequestSource } from '../src/compiler/skills/passiveSkillRequest.ts';
import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
import {
  abilityEntityFixture,
  activeSkillFixture,
  buffFixture,
  iconFixture,
  scalarFixture,
  targetFixture,
} from './sourceFixtures.ts';

const meta = {
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 0,
};
const sequence = (actionData: unknown[]) => ({
  actionData,
  onlyExecuteWhenSourceIsMainChar: false,
  onlyExecuteWhenSourceIsGuard: false,
});
const emptyBuff = (id: string, overrides: Record<string, unknown> = {}) =>
  buffFixture({
    id,
    applyTags: [],
    iconConfig: { ...iconFixture(), _spritePath: '' },
    ...overrides,
  });
const createBuff = (buffId: string) => ({
  ...meta,
  $type: 'Beyond.Gameplay.Core.CreateBuffAction+Data, Gameplay.Beyond',
  buffs: [
    {
      buffId,
      assignBlackboard: false,
      assignItems: [],
      readIdFromBlackboard: false,
      buffIdKey: '',
    },
  ],
  count: scalarFixture(1),
  targetSettings: targetFixture('Source'),
  buffSource: 'ActionSource',
  contextKey: '',
  autoFinishByAction: false,
  inheritSkillIdList: [],
  finishWithNextSkillIfNotInherited: false,
  asChildBuff: false,
  inheritSourceSkillCastId: true,
  inheritSourceSkillCastInfo: true,
  isExtra: false,
  passTargetGroupsToBuff: false,
  overrideBuffIconDuration: false,
  buffIconDurationSource: { durationSourceType: 'AbilityEntity', timedMarkerId: '' },
});

function input(consumerActions: unknown[] = []): OperatorDefinitionAssemblyInput {
  const entitySkill = {
    ...activeSkillFixture('entity_skill'),
    castData: {
      startCdFrame: 0,
      cooldownTime: 0,
      maxChargeTime: 1,
      costData: { costType: 'Atb', costValue: 0, atbValueThreshold: 0 },
    },
    actionGroupData: {
      timelineActions: [
        {
          _startFrame: 6,
          _endFrame: 6,
          _sequenceActionData: sequence([createBuff('buff_marker'), createBuff('visual_only')]),
          forceSyncAnimData: {
            forceSync: false,
            montageName: '',
            targetFrame: 0,
            playbackSpeed: 1,
          },
        },
      ],
      passiveEventActions: [],
    },
  };
  const buffs: Record<string, unknown> = {
    external_consumer: emptyBuff('external_consumer', {
      buffEventAction: [{ buffEvent: 'OnBuffEnable', actions: [sequence(consumerActions)] }],
    }),
    buff_marker: emptyBuff('buff_marker'),
    visual_only: emptyBuff('visual_only'),
    buff_common_affixes_shelter: emptyBuff('buff_common_affixes_shelter'),
  };
  return {
    // 最小已编译角色头部；本回归仅覆盖实体动作与外部 Buff 闭包的装配顺序。
    foundation: {
      identity: {
        slug: 'fixture',
        gameId: 'FIXTURE',
        exportName: 'fixture',
        characterId: 'fixture',
      },
      character: {
        sourcePath: 'CharacterTable.fixture',
        characterId: 'fixture',
        characterTypeId: 'Pulse',
        profession: 'CASTER',
        rarity: 6,
        mainAttributeType: 'Wisd',
        secondaryAttributeType: 'Will',
        nativeWeaponType: 'Wand',
        defaultWeaponId: '',
        charPassiveUiPrefabName: '',
        attributeKeyFrames: [],
        mainAttribute: 'intellect',
        secondaryAttribute: 'will',
        weaponType: 'funnel',
        element: 'electric',
        role: 'caster',
        projectedRarity: 6,
      },
      attributeGrowth: {
        strength: [],
        agility: [],
        intellect: [],
        will: [],
        baseAttack: [],
        baseHealth: [],
      },
      skillLibrary: {
        activeSkills: { entries: [], definitions: [] },
        skillGroups: [],
        nativeSkillGroups: [],
      },
      progression: {
        potential: { sourcePath: 'fixture', characterId: 'fixture', firstItemId: '', unlocks: [] },
        talentNodes: [],
        effectBundles: [],
        skillConditions: [],
        compiledSkillConditions: new Map(),
        compiledEffectBundles: [],
        talentPassiveSkillRequests: [],
        potentialPassiveSkillRequests: [],
        trustAttributeBonus: null,
      },
    },
    activeSkills: [],
    dodgeSkill: {
      definition: {
        key: 'dodge',
        timelineBlockFrames: 1,
        naturalDurationFrames: 1,
        blackboard: {},
        costFrame: 0,
        exclusiveFrame: 0,
        offsetRecordFrame: 0,
        allowNextSkillTransitions: [],
        scheduledSequences: [],
        actionGraph: { main: { nodes: {} }, macros: {} },
      },
      runtimeBuffIds: [],
      abilityEntitySpawns: [
        {
          abilityEntityId: 'abilityentity_fixture',
          skillId: 'entity_skill',
          sourcePath: 'fixture',
        },
      ],
    },
    dashBuffs: [{ buffId: 'external_consumer', blackboard: {} }],
    talentBindings: [],
    potentialBindings: [],
    passiveSkills: { requests: [], definitions: [] },
    entityCatalog: compileAbilityEntityTemplateCatalogSource({
      abilityentity_fixture: {
        ...abilityEntityFixture(),
        bornTagIds: [],
        maxStackingCount: -1,
        durationBlackboard: { useBlackboardKey: false, value: 3, blackboardKey: '' },
        maxStackingCountBlackboard: { useBlackboardKey: false, value: 0, blackboardKey: '' },
        skillRegistration: {
          allActiveSkillId: ['entity_skill'],
          normalSkillId: 'entity_skill',
          ultimateSkillId: '',
          comboSkillId: '',
          dodgeSkillId: '',
          activeSkillTypeOverrides: { keys: [], values: [] },
        },
      },
    }),
    gameplayTagRegistry: new GameplayTagRegistry([]),
    loadSkill: id => {
      if (id !== 'entity_skill') throw new Error(`missing ${id}`);
      return entitySkill;
    },
    loadBuff: id => buffs[id],
    globalBuffCatalog: { version: 'fixture', evidence: {}, templates: {} },
    skillSettingCatalog: undefined,
  };
}

const keywordAction = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.ShelterAction+Data, Gameplay.Beyond',
  source: targetFixture('Source'),
  target: targetFixture('Source'),
  duration: scalarFixture(3),
  rate: scalarFixture(0.1),
  overrideChildBuffId: false,
  childBuffId: { useBlackboardKey: false, value: '', blackboardKey: '' },
  asChildBuff: false,
  autoFinishByAction: false,
  enhancingList: [{ buffIds: ['buff_marker'], operationType: 'Add', value: scalarFixture(0.02) }],
};

const checkMarker = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.Conditions.CheckBuffIdInContext+Data, Gameplay.Beyond',
  checkType: 'Id',
  buffIdList: [{ buffId: 'buff_marker' }],
  query: { queryType: 'HasAny', tags: [] },
  blackboardKey: '',
};

describe('实体 Buff 裁剪使用整名角色的身份读取闭包', () => {
  it('保留外部关键词消费的实体空标记，同时仍裁掉无消费者的表现动作', () => {
    const compiled = assembleOperatorDefinition(input([keywordAction]));
    expect(
      collectCompiledBuffApplications(compiled.operator.abilityEntityDefinitions),
    ).toMatchObject([{ buffId: 'buff_marker', target: 'caster' }]);
    expect(compiled.commonBuffDefinitions.buff_marker).toBeDefined();
    expect(compiled.audit.omittedEntityVisualOnlyBuffIds).toEqual(['visual_only']);

    const unobserved = assembleOperatorDefinition(input());
    expect(collectCompiledBuffApplications(unobserved.operator.abilityEntityDefinitions)).toEqual(
      [],
    );
    expect(unobserved.commonBuffDefinitions.buff_marker).toBeUndefined();
  });

  it('外部 Buff 条件也能保留实体创建的标记', () => {
    const source = input();
    const loadBuff = source.loadBuff;
    const compiled = assembleOperatorDefinition({
      ...source,
      loadBuff: id =>
        id === 'external_consumer'
          ? emptyBuff(id, {
              abilityEventAction: [
                { abilityEvent: 'OnAddedBuff', actions: [sequence([checkMarker])] },
              ],
            })
          : loadBuff(id),
    });
    expect(
      collectCompiledBuffApplications(compiled.operator.abilityEntityDefinitions),
    ).toMatchObject([{ buffId: 'buff_marker' }]);
    expect(compiled.audit.omittedEntityVisualOnlyBuffIds).toEqual(['visual_only']);
  });

  it.each(['skill', 'combo'] as const)('保留实体外已编译 %s 程序的身份读取', reader => {
    const source = input();
    const actionGraph = {
      main: {
        nodes: {
          read_marker: {
            action: {
              kind: 'conditional' as const,
              parameters: {
                condition: { kind: 'eventBuffIdMatch' as const, buffIds: ['buff_marker'] },
              },
              whenTrue: { $sequence: null },
            },
            next: null,
          },
        },
      },
      macros: {},
    };
    const compiled = assembleOperatorDefinition({
      ...source,
      ...(reader === 'skill'
        ? {
            dodgeSkill: {
              ...source.dodgeSkill!,
              definition: {
                ...source.dodgeSkill!.definition,
                actionGraph,
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'read_marker' } },
                ],
              },
            },
          }
        : {
            comboSkillConditions: [
              {
                key: 'condition',
                skillKey: 'combo',
                event: 'addedBuff' as const,
                immediately: false,
                initialValues: {},
                actionGraph,
                sequence: { $sequence: 'read_marker' },
              },
            ],
          }),
    });
    expect(
      collectCompiledBuffApplications(compiled.operator.abilityEntityDefinitions),
    ).toMatchObject([{ buffId: 'buff_marker' }]);
    expect(compiled.commonBuffDefinitions.buff_marker).toBeDefined();
    expect(compiled.audit.omittedEntityVisualOnlyBuffIds).toEqual(['visual_only']);
  });

  it('角色常驻被动的原生 OnAddedBuff 响应同样保留实体通知标记', () => {
    const request: PassiveSkillCompileRequestSource = {
      originKind: 'operatorProgression',
      originId: 'base_passive',
      sourcePath: 'fixture',
      skillId: 'passive_fixture',
      levelSource: { kind: 'nativeDefault' },
      inputBlackboard: {},
    };
    const passive = {
      ...activeSkillFixture(request.skillId, 'Passive'),
      blackboard: [],
      durationFrame: 0,
      exclusiveFrame: 0,
      actionGroupData: {
        timelineActions: [],
        passiveEventActions: [
          {
            abilityEvent: 'OnAddedBuff',
            actions: [sequence([checkMarker, createBuff('passive_result')])],
          },
        ],
      },
    };
    const source = input();
    const compiled = assembleOperatorDefinition({
      ...source,
      loadBuff: id =>
        id === 'passive_result' ? buffFixture({ id, applyTags: [] }) : source.loadBuff(id),
      basePassiveSkillRequests: [request],
      passiveSkills: compilePassiveSkillRequestBatch([request], { [request.skillId]: passive }, {}),
    });
    expect(
      collectCompiledBuffApplications(compiled.operator.abilityEntityDefinitions),
    ).toMatchObject([{ buffId: 'buff_marker' }]);
    expect(compiled.commonBuffDefinitions.buff_marker).toBeDefined();
    expect(compiled.audit.omittedEntityVisualOnlyBuffIds).toEqual(['visual_only']);
  });

  it('外部消费者引用缺失时继续阻断，不能先丢标记再隐藏不完整闭包', () => {
    const source = input([keywordAction]);
    const loadBuff = source.loadBuff;
    expect(() =>
      assembleOperatorDefinition({
        ...source,
        loadBuff: id => (id === 'buff_common_affixes_shelter' ? undefined : loadBuff(id)),
      }),
    ).toThrow('missing Buff definition "buff_common_affixes_shelter"');
  });
});
