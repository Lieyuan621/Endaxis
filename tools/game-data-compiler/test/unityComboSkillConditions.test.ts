import { fixtureGameplayTagRegistry } from './gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';
import { unityComboConditionFixture } from './unityComboConditionFixture.ts';
import { parseUnityComboSkillConditionsSource } from '../src/source/unityComboSkillConditions.ts';
import { compilePendingComboConditionSource } from '../src/compiler/conditions/comboSkillConditions.ts';
import { parseObjectTypeMask } from '../src/source/objectType.ts';
import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
const projection = {
  gameplayTagRegistry: fixtureGameplayTagRegistry,
  actionOwnerTarget: 'caster',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'eventTarget',
} as const;
function parse(fixture = unityComboConditionFixture()) {
  return parseUnityComboSkillConditionsSource(
    fixture.conditions,
    fixture.references,
    'character.combo',
  );
}

describe('Unity RID 条件适配', () => {
  it('待释放连携检查规范化 Owner 和空 finder RID，再进入公共条件投影', () => {
    const fixture = unityComboConditionFixture();
    const rid = '2708501211437859822';
    const reference = fixture.references[rid]!;
    const owner = { ...(reference.data.target as object), targetSource: 4, targetGroupKey: '' };
    reference.class = 'CheckComboSkillPending/Data';
    reference.namespace = 'Beyond.Gameplay.Core';
    reference.data = {
      isEnable: true,
      priorityLevel: 0,
      priorityOffset: 0,
      serverActionIndex: 1004,
      owner,
    };
    fixture.conditions[0]!.comboSkillCheckAction.actionData = [rid];
    const source = parse(fixture).conditions[0]!;
    expect(compilePendingComboConditionSource(source, projection).sequence.steps[0]).toMatchObject({
      parameters: { condition: { kind: 'casterComboPending' } },
    });
  });
  it('新增四类 RID 叶子只规范化序列化形状，并统一进入公共 Condition 编译', () => {
    const target = structuredClone(
      unityComboConditionFixture().references['2708501211437859822']!.data.target,
    ) as Record<string, unknown>;
    target.targetSource = 1; // Source；公共编译器根据事件上下文投影为 caster。
    target.targetGroupKey = '';
    const tagQuery = {
      queryType: { value: 0, name: 'HasAny' },
      tags: [{ tagId: { value: 2025186574, hex: '0x78b5e50e' } }],
    };
    const header = {
      isEnable: true,
      priorityLevel: 0,
      priorityOffset: 0,
      serverActionIndex: 1000,
    };
    const reference = (
      rid: string,
      name: string,
      data: Record<string, unknown>,
      namespace = 'Beyond.Gameplay.Core.Conditions',
    ) => ({
      rid,
      class: `${name}/Data`,
      namespace,
      assembly: 'Gameplay.Beyond',
      decodeStatus: 'complete',
      data: { ...header, ...data },
    });
    const row = (actionData: readonly string[]) => ({
      comboSkillEvent: 9,
      comboSkillConditionImmediately: false,
      comboSkillCheckAction: {
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
        actionData,
      },
    });
    const references = {
      '1': reference('1', 'CheckBuffIdInContext', {
        checkType: 0,
        buffIdList: [{ buffId: 'buff_combo_gate' }],
        query: tagQuery,
        blackboardKey: 'matched_buff',
      }),
      '2': reference('2', 'CheckTagMatch', { checkTarget: target, query: tagQuery }),
      '3': reference('3', 'CheckMainCharacterCondition', { checkTarget: target }),
      '4': reference('4', 'NotNextCheckAction', {}, 'Beyond.Gameplay.Core'),
    };
    const source = parseUnityComboSkillConditionsSource(
      [row(['1']), row(['2']), row(['3']), row(['4', '3'])],
      references,
      'character.combo',
    );

    expect(
      source.conditions.map(condition => condition.sequence.actions.map(action => action.body)),
    ).toMatchObject([
      [{ value: { action: { kind: 'contextBuff' } } }],
      [{ value: { action: { kind: 'entityTag' } } }],
      [{ value: { action: { kind: 'mainOperator' } } }],
      [{ kind: 'negateNextResult' }, { value: { action: { kind: 'mainOperator' } } }],
    ]);
    const compiled = source.conditions.map(condition =>
      compilePendingComboConditionSource(condition, projection),
    );
    expect(compiled[0]!.sequence.steps[0]).toMatchObject({
      parameters: {
        condition: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_combo_gate'],
          buffIdOutputKey: 'matched_buff',
        },
      },
    });
    expect(compiled[1]!.sequence.steps[0]).toMatchObject({
      parameters: {
        condition: {
          kind: 'entityTagMatch',
          target: 'caster',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/Common/SpellBurst'],
        },
      },
    });
    expect(compiled[2]!.sequence.steps[0]).toMatchObject({
      parameters: { condition: { kind: 'casterControlled' } },
    });
    expect(compiled[3]!.sequence.steps[0]).toMatchObject({
      parameters: {
        condition: { kind: 'not', condition: { kind: 'casterControlled' } },
      },
    });
  });

  it('Advanced 事件 Buff 条件只做 Unity 字段规范化，随后进入公共条件读取器', () => {
    const rid = '2708501211437859624';
    const source = parseUnityComboSkillConditionsSource(
      [
        {
          comboSkillEvent: 9,
          comboSkillConditionImmediately: false,
          comboSkillCheckAction: {
            onlyExecuteWhenSourceIsMainChar: false,
            onlyExecuteWhenSourceIsGuard: false,
            actionData: [rid],
          },
        },
      ],
      {
        [rid]: {
          rid,
          class: 'CheckBuffIdInContextAdvanced/Data',
          namespace: 'Beyond.Gameplay.Core.Conditions',
          assembly: 'Gameplay.Beyond',
          decodeStatus: 'complete',
          data: {
            isEnable: true,
            priorityLevel: 0,
            priorityOffset: 0,
            serverActionIndex: 1003,
            checkType: 1,
            buffIdList: [],
            query: {
              queryType: { value: 0, name: 'HasAny' },
              tags: [{ tagId: { value: 2025186574, hex: '0x78b5e50e' } }],
            },
            blackboardKey: '',
          },
        },
      },
      'character.combo',
    );

    expect(source.conditions[0]).toMatchObject({
      nativeEvent: 9,
      sequence: {
        actions: [
          {
            body: {
              value: {
                action: {
                  kind: 'contextBuff',
                  matcher: {
                    kind: 'tag',
                    queryType: 'hasAny',
                    buffTagIds: [2025186574],
                  },
                },
              },
            },
          },
        ],
      },
    });
    expect(
      compilePendingComboConditionSource(source.conditions[0]!, {
        ...projection,
        gameplayTagRegistry: new GameplayTagRegistry(['Skill/Character/Common/SpellBurst']),
      }),
    ).toMatchObject({
      event: 'addedBuff',
      sequence: {
        steps: [
          {
            parameters: {
              condition: {
                kind: 'eventBuffTagsMatch',
                match: 'hasAny',
                buffTags: ['Skill/Character/Common/SpellBurst'],
              },
            },
          },
        ],
      },
    });
  });

  it.each([0, 2])('零载荷 selector RID 进入公共目标语义，TargetSource=%s', targetSource => {
    const leafRid = '2708501211437858912';
    const finderRid = '2708501211437858915';
    const validatorRid = '2708501211437858916';
    const target = (targetSource: number, targetGroupKey: string, selectorData: object) => ({
      targetSource,
      targetGroupKey,
      selectorOwner: 1,
      ownerContextKey: '',
      centerType: 0,
      centerContextKey: '',
      centerToGround: false,
      selectorData,
      enableAdvancedDirection: false,
      advancedDirection: {
        directionType: 0,
        source: '-2',
        target: '-2',
        sourceMountPoint: 0,
        targetMountPoint: 0,
        customSourceAndTarget: false,
        clampToXZ: true,
        invertDirection: false,
      },
      selectorDirection: 0,
      target: 0,
      targetContextKey: '',
    });
    const source = parseUnityComboSkillConditionsSource(
      [
        {
          comboSkillEvent: 101,
          comboSkillConditionImmediately: false,
          comboSkillCheckAction: {
            onlyExecuteWhenSourceIsMainChar: false,
            onlyExecuteWhenSourceIsGuard: false,
            actionData: [leafRid],
          },
        },
      ],
      {
        [leafRid]: {
          rid: leafRid,
          class: 'CheckTargetsEqual/Data',
          namespace: 'Beyond.Gameplay.Core.Conditions',
          assembly: 'Gameplay.Beyond',
          decodeStatus: 'complete',
          data: {
            isEnable: true,
            priorityLevel: 0,
            priorityOffset: 0,
            serverActionIndex: 1001,
            firstTargetSettings: target(targetSource, 'trigger', {
              finderData: '-2',
              validatorData: [],
              postProcessorData: [],
            }),
            secondTargetSettings: target(3, '', {
              finderData: finderRid,
              validatorData: [validatorRid],
              postProcessorData: [],
            }),
          },
        },
        [finderRid]: {
          rid: finderRid,
          class: 'Selector/CharacterTeamFinder/Data',
          namespace: 'Beyond.Gameplay.Core',
          assembly: 'Gameplay.Beyond',
          decodeStatus: 'raw',
          length: 0,
          rawBase64: '',
        },
        [validatorRid]: {
          rid: validatorRid,
          class: 'Selector/MainCharacterValidator/Data',
          namespace: 'Beyond.Gameplay.Core',
          assembly: 'Gameplay.Beyond',
          decodeStatus: 'raw',
          length: 0,
          rawBase64: '',
        },
      },
      'character.combo',
    );

    expect(source.referenceSources.map(reference => reference.rid)).toEqual([
      leafRid,
      finderRid,
      validatorRid,
    ]);
    expect(source.conditions[0]).toMatchObject({
      nativeEvent: 101,
      sequence: {
        actions: [
          {
            body: {
              value: {
                action: {
                  kind: 'targetIdentity',
                  first: {
                    targetSource: targetSource === 0 ? 'Target' : 'Context',
                    targetGroupKey: 'trigger',
                  },
                  second: {
                    targetSource: 'InstantSearch',
                    finderType: 'CharacterTeamFinder',
                    validatorTypes: ['MainCharacterValidator'],
                  },
                },
              },
            },
          },
        ],
      },
    });
    const boundProjection = {
      ...projection,
      contextTargetGroupTargets: new Map([['trigger', 'eventTarget'] as const]),
    };
    if (targetSource === 2)
      expect(() => compilePendingComboConditionSource(source.conditions[0]!, projection)).toThrow(
        'target identity sources',
      );
    expect(
      compilePendingComboConditionSource(source.conditions[0]!, boundProjection),
    ).toMatchObject({
      event: 'beforeTakeDamage',
      sequence: {
        steps: [
          {
            parameters: {
              condition:
                targetSource === 0
                  ? { kind: 'eventSourceControlled' }
                  : {
                      kind: 'contextTargetIdentityMatch',
                      contextKey: 'trigger',
                      other: 'controlledOperator',
                      operator: 'equal',
                    },
            },
          },
        ],
      },
    });
  });

  it('真实五条最小切片的 14 个叶子进入同一公共编译入口并保留来源', () => {
    const fixture = unityComboConditionFixture();
    const source = parse(fixture);
    expect(source.referenceSources).toHaveLength(14);
    expect(source.referenceSources[0]).toMatchObject({ rid: '2708501211437859822' });
    expect(source.referenceSources[0]!.source).toBe(fixture.references['2708501211437859822']);
    const compiled = source.conditions.map(c => compilePendingComboConditionSource(c, projection));
    expect(compiled.map(c => c.event)).toEqual(Array(5).fill('beforeTakeInfliction'));
    expect(compiled[1]!.sequence).toMatchObject({
      steps: [
        {
          parameters: {
            condition: {
              kind: 'contextTargetObjectTypeMatch',
              contextKey: 'trigger',
              objectTypes: ['enemy'],
            },
          },
        },
      ],
    });
    expect(compiled[4]!.sequence.steps).toHaveLength(1);
    // 原生 DebugPrint 的 Target 不被读取；纯查询之前的 Debug no-op 不阻塞条件。
    expect(compiled[4]!.sequence.steps[0]).toMatchObject({
      kind: 'conditional',
      parameters: {
        condition: { kind: 'actionValueCompare' },
      },
    });
  });
  it.each([
    'missing',
    'rid',
    'partial',
    'assembly',
    'type',
    'priority',
    'extra',
    'selector',
    'query',
  ] as const)('%s 来源损坏必须失败', fault => {
    const f = unityComboConditionFixture();
    const r = f.references['2708501211437859822']!;
    if (fault === 'missing') delete f.references[r.rid];
    if (fault === 'rid') r.rid = '1';
    if (fault === 'partial') r.decodeStatus = 'partial';
    if (fault === 'assembly') r.assembly = 'Other';
    if (fault === 'type') r.class = 'Unknown/Data';
    if (fault === 'priority') r.data.priorityLevel = 123;
    if (fault === 'extra') r.data.futureField = 1;
    if (fault === 'selector')
      (r.data.target as { selectorData: { finderData: string } }).selectorData.finderData = '123';
    if (fault === 'query') {
      const query = f.references['2708501211437859826']!.data.tagQuery as {
        queryType: { name: string };
      };
      query.queryType.name = 'HasAll';
    }
    expect(() => parse(f)).toThrow('character.combo');
  });
  it('对象 Target 编译为公共 InputTarget 查询；关闭节点不造成假阻塞', () => {
    const f = unityComboConditionFixture();
    const data = f.references['2708501211437859822']!.data;
    const target = data.target as { targetSource: number; targetGroupKey: string };
    target.targetSource = 0;
    target.targetGroupKey = '';
    expect(
      JSON.stringify(compilePendingComboConditionSource(parse(f).conditions[0]!, projection)),
    ).toContain('actionInputTargetObjectTypeMatch');
    data.isEnable = false;
    expect(() =>
      compilePendingComboConditionSource(parse(f).conditions[0]!, projection),
    ).not.toThrow();
  });
  it('BuffIdCount 保留来源但不错误降级成实例数或增强层数', () => {
    const f = unityComboConditionFixture();
    f.references['2708501211437859826']!.data.buffStackNumType = 1;
    expect(() => compilePendingComboConditionSource(parse(f).conditions[1]!, projection)).toThrow(
      'unsupported',
    );
  });
  it.each([
    [16, 16],
    ['Enemy', 16],
    ['Enemy, Character', 24],
    ['All', -1],
    ['0', 0],
    ['EnemyAll', 16400],
  ] as const)('ObjectType %s → %s', (value, mask) => {
    expect(parseObjectTypeMask(value, 'mask')).toBe(mask);
  });
  it.each([null, true, '', 'Unknown', 'Enemy,', 0.5, 2147483648, -2147483649])(
    '非法 ObjectType %j 拒绝',
    value => {
      expect(() => parseObjectTypeMask(value, 'mask')).toThrow('mask');
    },
  );
});
