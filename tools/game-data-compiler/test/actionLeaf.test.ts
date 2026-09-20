import { describe, expect, it } from 'vitest';

import {
  parseKnownNativeActionLeafSource,
  parseKnownNativeActionSequenceSource,
} from '../src/index.ts';
import { compileCombatActionSequenceSource } from '../src/compiler/buffs/buffRuntimeProjection.ts';
import { isStaticExplicitBadFactionEnemyTargetGroup } from '../src/compiler/combatProjectionCommon.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const META = {
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 1,
} as const;

function rayCastEffectFixture(overrides: Record<string, unknown> = {}) {
  return {
    ...META,
    $type: 'Beyond.Gameplay.Core.RayCastEffectAction+RayCastEffectActionData, Gameplay.Beyond',
    targetGroupKey: 'ray_targets',
    saveAllHitTargets: true,
    hitPosGroupKey: 'ray_hit_positions',
    moveType: 'PointToPoint',
    targetSettings: targetFixture('Owner', {
      finderData: {
        $type: 'Beyond.Gameplay.Core.Selector+FixedPointFinder+Data, Gameplay.Beyond',
        positionOffset: { x: 0, y: 0, z: 6 },
        rotationOffset: { x: 0, y: 0, z: 0, w: 1 },
        snapToNavmesh: false,
        sampleRadius: scalarFixture(0),
      },
      validatorData: [],
      postProcessorData: [],
    }),
    sourceSettings: targetFixture('Owner'),
    rayEffect: {},
    rayHitEffect: {},
    hitEffectDirectionType: 'LookAtNextEndPos',
    hitEffectLayers: {},
    hitLoopSoundEvent: { _id: 0 },
    hitEndSoundEvent: { _id: 0 },
    sourcePosType: 'Follow',
    startPosMountPoint: 'None',
    startPosOffset: { x: 0, y: 0, z: 0 },
    raycastDataList: [],
    mountPointRayData: {},
    curveRayData: {},
    pointToPointRayData: {},
    useFaction: false,
    autoSetTargetFaction: true,
    containsUnMarkable: false,
    factionTarget: 'Anti',
    targetFactionType: 0,
    touchingLayers: {},
    rayMaxLength: 16,
    rayRadius: 2,
    useRealHitLength: false,
    useLastHitForEffect: false,
    ...overrides,
  };
}

describe('公共 Action 叶子分派', () => {
  it('完整保留 StoreEntityProperty 的目标、属性和写回公式', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.StoreEntityProperty+Data, Gameplay.Beyond',
          targetSettings: targetFixture('Owner'),
          propertyType: 'CurHp',
          useFloor: true,
          divisorValue: scalarFixture(2),
          multiplierValue: scalarFixture(3, 'scale'),
          baseValue: scalarFixture(4),
          key: 'hp',
        },
        'fixture.entity-property',
        {},
      ),
    ).toMatchObject({
      family: 'entityPropertySnapshot',
      action: {
        target: { targetSource: 'Owner' },
        property: 'CurHp',
        useFloor: true,
        divisor: { value: 2 },
        multiplier: { blackboardKey: 'scale' },
        baseValue: { value: 4 },
        outputKey: 'hp',
      },
    });
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.RecoverDashEnergy+Data, Gameplay.Beyond',
          energyNum: { useBlackboardKey: false, value: 0.5, blackboardKey: '' },
          canRecoverWhenOverdraft: true,
        },
        'fixture.recoverDashEnergy',
        {},
      ),
    ).toEqual({
      family: 'dashEnergyRecovery',
      action: {
        kind: 'dashEnergyRecovery',
        amount: { value: 0.5, blackboardKey: null, levelValues: null },
        canRecoverWhenOverdraft: true,
      },
    });
  });

  it('保留 RayCastEffectAction 写出的命中目标组与位置组', () => {
    expect(
      parseKnownNativeActionLeafSource(rayCastEffectFixture(), 'fixture.ray', {}),
    ).toMatchObject({
      family: 'rayCastTargetGroup',
      action: {
        kind: 'rayCastTargetGroup',
        targetGroupKey: 'ray_targets',
        hitPosGroupKey: 'ray_hit_positions',
        saveAllHitTargets: true,
        moveType: 'PointToPoint',
        raycastSegmentCount: 0,
      },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        rayCastEffectFixture({ unexpected: true }),
        'fixture.ray.changed',
        {},
      ),
    ).toThrow('unexpected fields');
  });

  it.each([false, true])(
    '零空间唯一木桩把受支持的光线查询写成敌人和空间 Context，阵营过滤=%s',
    useFaction => {
      const sequence = parseKnownNativeActionSequenceSource(
        {
          actionData: [rayCastEffectFixture({ useFaction })],
          onlyExecuteWhenSourceIsMainChar: false,
          onlyExecuteWhenSourceIsGuard: false,
        },
        'fixture.ray.sequence',
        {},
      );
      expect(
        compileCombatActionSequenceSource(sequence, {
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        }),
      ).toEqual({ steps: [] });
      expect(() =>
        compileCombatActionSequenceSource(
          parseKnownNativeActionSequenceSource(
            {
              actionData: [rayCastEffectFixture({ useFaction: true, autoSetTargetFaction: false })],
              onlyExecuteWhenSourceIsMainChar: false,
              onlyExecuteWhenSourceIsGuard: false,
            },
            'fixture.ray.unsupported',
            {},
          ),
          {
            actionOwnerTarget: 'caster',
            actionSourceTarget: 'caster',
            actionTargetTarget: 'enemy',
          },
        ),
      ).toThrow('unsupported RayCastEffectAction stump projection');
    },
  );

  it.each([
    { factionTarget: 'Ally' },
    { autoSetTargetFaction: false },
    { containsUnMarkable: true },
  ])('阵营过滤只开放已证明的自动敌对分支 %j', extra => {
    const source = parseKnownNativeActionSequenceSource(
      {
        actionData: [rayCastEffectFixture({ useFaction: true, ...extra })],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      'ray',
      {},
    );
    expect(() =>
      compileCombatActionSequenceSource(source, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }),
    ).toThrow('unsupported RayCastEffectAction stump projection');
  });

  it('开启阵营过滤的实体宿主不能借用干员阵营证明', () => {
    const source = parseKnownNativeActionSequenceSource(
      {
        actionData: [rayCastEffectFixture({ useFaction: true })],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      'ray',
      {},
    );
    expect(() =>
      compileCombatActionSequenceSource(source, {
        actionOwnerTarget: 'currentAbilityEntity',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }),
    ).toThrow('unsupported RayCastEffectAction stump projection');
  });

  it('能力实体 Context 可作为零空间光线的严格空间锚点', () => {
    const sourceSettings = targetFixture('Context', undefined, 'laser_root');
    const targetSettings = targetFixture(
      'Context',
      {
        finderData: {
          $type: 'Beyond.Gameplay.Core.Selector+FixedPointFinder+Data, Gameplay.Beyond',
          positionOffset: { x: 0, y: 0, z: 6 },
          rotationOffset: { x: 0, y: 0, z: 0, w: 1 },
          snapToNavmesh: false,
          sampleRadius: scalarFixture(0),
        },
        validatorData: [],
        postProcessorData: [],
      },
      'laser_root',
    );
    const sequence = parseKnownNativeActionSequenceSource(
      {
        actionData: [rayCastEffectFixture({ sourceSettings, targetSettings })],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      'fixture.contextRay.sequence',
      {},
    );
    expect(
      compileCombatActionSequenceSource(sequence, {
        actionOwnerTarget: 'buffOwner',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
        fixedBuffOwnerTarget: 'currentAbilityEntity',
        staticAbilityEntityTargetGroupKeys: new Set(['laser_root']),
      }),
    ).toEqual({ steps: [] });
  });

  it('保留显式 Bad 阵营并将该 HitBox 查询证明为唯一敌人', () => {
    const parsed = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.FindTargetAction+FindTargetActionData, Gameplay.Beyond',
        targetGroupKey: 'enemy',
        center: 'ActionOwner',
        centerContextKey: '',
        useCenterEntityMountPoint: false,
        centerMountPoint: 'None',
        centerToGround: false,
        selectorOwner: 'ActionOwner',
        selectorOwnerContextKey: '',
        selectorData: {
          finderData: {
            $type: 'Beyond.Gameplay.Core.Selector+HitBoxFinder+Data, Gameplay.Beyond',
            checkAlive: true,
            autoSetTargetFaction: false,
            containsUnMarkable: false,
            factionTarget: 'Ally',
            targetFactionType: 'Bad',
            targetObjectType: 'Normal',
            checkIntUnSelectableTag: true,
            shapeList: [],
          },
          validatorData: [],
          postProcessorData: [],
        },
        selectorDirection: 'SourceForward',
        target: 'ActionSource',
        contextKey: '',
        useAdvancedDirectionSetting: false,
        advancedSelectorDirection: {},
      },
      'fixture.explicitBad',
      {},
    );
    expect(parsed.family).toBe('targetGroup');
    if (parsed.family !== 'targetGroup') throw new Error('expected target-group action');
    expect(parsed.action).toMatchObject({
      finderAutoSetTargetFaction: false,
      finderTargetFactionType: 'Bad',
    });
    expect(isStaticExplicitBadFactionEnemyTargetGroup(parsed.action)).toBe(true);
  });

  it('只省略不会进入固定木桩结算的瞄准层、队伍传送与冲刺输入窗口', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type:
            'Beyond.Gameplay.Core.AnimatorAimOffsetAction+AnimatorAimOffsetActionData, Gameplay.Beyond',
          aimOffsetType: 'StrafeMovement',
          aimXParam: -403618285,
          aimYParam: -1862895995,
          layerName: 'AimOffset0',
          maxHorizontalAngle: 180,
          maxVerticalAngle: 0,
          smoothSpeed: 5,
          inheritAimParameters: false,
          resetOnEnd: true,
          blendIn: 0.1,
          blendOut: 0.25,
          duration: 4,
        },
        'fixture.aimOffset',
        {},
      ),
    ).toEqual({ family: 'presentation', action: { kind: 'animatorAimOffset' } });

    for (const [$type, kind] of [
      [
        'Beyond.Gameplay.Core.TryToTeleportSquadAction+Data, Gameplay.Beyond',
        'squadTeleportOmitted',
      ],
    ] as const) {
      expect(parseKnownNativeActionLeafSource({ ...META, $type }, `fixture.${kind}`, {})).toEqual({
        family: 'presentation',
        action: { kind },
      });
      expect(() =>
        parseKnownNativeActionLeafSource(
          { ...META, $type, unexpected: true },
          `fixture.${kind}.unsafe`,
          {},
        ),
      ).toThrow('unexpected fields');
    }
    const markCanDashType = 'Beyond.Gameplay.Core.MarkCanDash+Data, Gameplay.Beyond';
    expect(
      parseKnownNativeActionLeafSource(
        { ...META, $type: markCanDashType },
        'fixture.markCanDash',
        {},
      ),
    ).toEqual({ family: 'inputControl', action: { kind: 'markCanDash' } });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...META, $type: markCanDashType, unexpected: true },
        'fixture.markCanDash.unsafe',
        {},
      ),
    ).toThrow('unexpected fields');
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.OverrideMultiDashLimit+Data, Gameplay.Beyond',
          targetSetting: targetFixture('Owner'),
          dashCount: scalarFixture(-1),
        },
        'fixture.overrideMultiDashLimit',
        {},
      ),
    ).toEqual({
      family: 'inputControl',
      action: {
        kind: 'overrideMultiDashLimit',
        target: expect.objectContaining({ targetSource: 'Owner' }),
        dashCount: { value: -1, blackboardKey: null, levelValues: null },
      },
    });
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.PlayPerfectDodgeAnim+Data, Gameplay.Beyond',
          forceFightIdle: false,
          forceFightIdleDuration: 10,
        },
        'fixture.perfectDodgeAnimation',
        {},
      ),
    ).toEqual({
      family: 'presentation',
      action: { kind: 'perfectDodgeAnimationOmitted' },
    });
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.CheckPerfectDodgeDirection+Data, Gameplay.Beyond',
          dirType: 'Forward',
        },
        'fixture.perfectDodgeDirection',
        {},
      ),
    ).toEqual({
      family: 'condition',
      action: {
        kind: 'perfectDodgeDirection',
        sourceType: 'CheckPerfectDodgeDirection',
        direction: 'Forward',
      },
    });
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.CreateDynamicBattleShape+Data, Gameplay.Beyond',
          shapeType: 'SimplifiedBox',
          duration: 0.3,
          interval: 0.07,
        },
        'fixture.dynamicBattleShape',
        {},
      ),
    ).toEqual({
      family: 'spatial',
      action: {
        kind: 'dynamicBattleShape',
        shapeType: 'SimplifiedBox',
        durationSeconds: 0.3,
        intervalSeconds: 0.07,
      },
    });
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.SetSuperArmorAction+Data, Gameplay.Beyond',
          targetSettings: targetFixture('Source'),
          superArmorValue: {
            useBlackboardKey: false,
            value: 35,
            blackboardKey: 'superarmor',
            useCustomValue: false,
          },
          impactResistance: {
            useBlackboardKey: false,
            value: 100,
            blackboardKey: '',
            useCustomValue: false,
          },
        },
        'fixture.staticSuperArmorWithDormantKey',
        {},
      ),
    ).toMatchObject({
      family: 'selfDefense',
      action: { kind: 'setSuperArmor', superArmorValue: 35, impactResistance: 100 },
    });
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type:
            'Beyond.Gameplay.Core.Conditions.CheckDamageIgnoreImmuneLevel+Data, Gameplay.Beyond',
          checkType: 'LE',
          ignoreImmuneLevel: 0,
        },
        'fixture.damageIgnoreImmuneLevel',
        {},
      ),
    ).toEqual({
      family: 'condition',
      action: {
        kind: 'damageIgnoreImmuneLevel',
        sourceType: 'CheckDamageIgnoreImmuneLevel',
        comparison: 'LE',
        level: 0,
      },
    });
  });

  it('严格解析原生职业位集并映射到公共干员定位', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.Conditions.CheckProfession+Data, Gameplay.Beyond',
          checkTarget: targetFixture('Owner'),
          professionCategories: 'Guard, Supporter, Caster',
        },
        'fixture.profession',
        {},
      ),
    ).toMatchObject({
      family: 'condition',
      action: {
        kind: 'profession',
        target: { targetSource: 'Owner', targetGroupKey: '' },
        roles: ['guard', 'supporter', 'caster'],
      },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.Conditions.CheckProfession+Data, Gameplay.Beyond',
          checkTarget: targetFixture('Owner'),
          professionCategories: 'Medic',
        },
        'fixture.profession',
        {},
      ),
    ).toThrow("unknown ProfessionCategory 'Medic'");
  });

  it('区分 OnObtainAtb 的效率结算值与容量截断后的实际入账值', () => {
    const action = {
      ...META,
      $type: 'Beyond.Gameplay.Core.SaveAtbObtainValue+Data, Gameplay.Beyond',
      valueKey: 'atb_contain_temp',
      realDeltaKey: 'atb_real_delta',
    };

    expect(parseKnownNativeActionLeafSource(action, 'fixture.saveAtb', {})).toEqual({
      family: 'eventPayload',
      action: {
        kind: 'saveAtbObtainValue',
        valueKey: 'atb_contain_temp',
        realDeltaKey: 'atb_real_delta',
      },
    });
    expect(
      compileCombatActionSequenceSource(
        parseKnownNativeActionSequenceSource(sequence([action]), 'fixture.saveAtb', {}),
        {
          actionOwnerTarget: 'unavailable',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      ),
    ).toEqual({
      steps: [
        {
          kind: 'storeEventSpGainAmount',
          parameters: {
            outputKey: 'atb_contain_temp',
            realDeltaOutputKey: 'atb_real_delta',
          },
        },
      ],
    });
  });

  it('保留 SaveShieldValueToBB 的原生值选择并投影为统一黑板步骤', () => {
    const action = {
      ...META,
      $type: 'Beyond.Gameplay.Core.SaveShieldValueToBB+Data, Gameplay.Beyond',
      shieldValue: targetFixture('Owner'),
      valueType: 'GainedValue',
      bbKey: 'heal',
    };

    expect(parseKnownNativeActionLeafSource(action, 'fixture.saveShield', {})).toMatchObject({
      family: 'eventPayload',
      action: {
        kind: 'saveShieldValue',
        target: { targetSource: 'Owner' },
        valueType: 'GainedValue',
        outputKey: 'heal',
      },
    });
    expect(
      compileCombatActionSequenceSource(
        parseKnownNativeActionSequenceSource(sequence([action]), 'fixture.saveShield', {}),
        {
          actionOwnerTarget: 'buffOwner',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
          fixedBuffOwnerTarget: 'caster',
        },
      ),
    ).toEqual({
      steps: [
        {
          kind: 'storeShieldValue',
          parameters: { target: 'actionOwner', value: 'gained', outputKey: 'heal' },
        },
      ],
    });
  });

  it('把 ComboAction 识别为创建公共连击 GlobalBuff 的战斗动作', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.ComboAction+Data, Gameplay.Beyond',
          source: targetFixture('Owner'),
          duration: { useBlackboardKey: true, value: 0, blackboardKey: 'duration' },
          count: scalarFixture(1),
        },
        'fixture.comboCounter',
        { duration: [3] },
      ),
    ).toEqual({
      family: 'globalBuff',
      action: {
        kind: 'createComboGlobalBuff',
        source: expect.objectContaining({ targetSource: 'Owner' }),
        duration: expect.objectContaining({ blackboardKey: 'duration' }),
        count: expect.objectContaining({ value: 1, blackboardKey: null }),
      },
    });
  });

  it('严格保留语音打断参数，但不把纯音频状态投射进战斗 IR', () => {
    const action = {
      ...META,
      $type: 'Beyond.Gameplay.Core.VoiceInterruptAction+VoiceInterruptActionData, Gameplay.Beyond',
      _interruptImmediately: false,
      _canInterruptTimeMs: 0,
    };
    expect(parseKnownNativeActionLeafSource(action, 'fixture.voiceInterrupt', {})).toEqual({
      family: 'presentation',
      action: { kind: 'voiceInterrupt' },
    });
    expect(
      compileCombatActionSequenceSource(
        parseKnownNativeActionSequenceSource(sequence([action]), 'fixture.voiceInterrupt', {}),
        {
          actionOwnerTarget: 'unavailable',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      ),
    ).toEqual({ steps: [] });
  });

  it('保留 AI marker 的所有权、标签和动作寿命，供木桩投影显式消去', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.AddAIMarkerAction+Data, Gameplay.Beyond',
          markerOwner: targetFixture('Source'),
          marker: { tagId: 2108198621 },
          removeByAction: true,
          duration: scalarFixture(0),
        },
        'fixture.aiMarker',
        {},
      ),
    ).toMatchObject({
      family: 'aiMarker',
      action: {
        kind: 'addAiMarker',
        owner: { targetSource: 'Source', targetGroupKey: '' },
        markerTagId: 2108198621,
        removeByAction: true,
        duration: { value: 0, blackboardKey: null },
      },
    });
  });

  it('严格保留命名自定义事件的发布者、目标和载荷', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.TriggerCustomAbilityEvent+Data, Gameplay.Beyond',
          eventSource: targetFixture('Source'),
          targets: targetFixture('Source'),
          eventName: { useBlackboardKey: false, value: 'liino_comboskill_end', blackboardKey: '' },
          eventParam: scalarFixture(0),
        },
        'fixture.customEvent',
        {},
      ),
    ).toMatchObject({
      family: 'customAbilityEvent',
      action: {
        kind: 'triggerCustomAbilityEvent',
        eventSource: { targetSource: 'Source', targetGroupKey: '' },
        targets: { targetSource: 'Source', targetGroupKey: '' },
        eventName: { value: 'liino_comboskill_end', blackboardKey: null },
        eventParam: { value: 0, blackboardKey: null },
      },
    });
  });

  it('严格解析自定义事件检查，不把非空参数保存键静默丢弃', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.Conditions.CheckCustomAbilityEvent+Data, Gameplay.Beyond',
          eventName: { useBlackboardKey: false, value: 'liino_comboskill_end', blackboardKey: '' },
          savedParamKey: 'event_param',
        },
        'fixture.customEventCheck',
        {},
      ),
    ).toMatchObject({
      family: 'condition',
      action: {
        kind: 'customAbilityEvent',
        eventName: { value: 'liino_comboskill_end', blackboardKey: null },
        savedParamKey: 'event_param',
      },
    });
  });

  it('ComboCache 保留空技能 ID 占位，不把客户端输入映射误判成非法技能', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.ComboCacheAction+Data, Gameplay.Beyond',
          mappingDataList: [
            {
              cmdType: 'ComboSkill',
              skillId: '',
              cacheEndByAction: false,
              clearOffsetTargetSkillIdOnEnd: false,
              overrideCacheTime: true,
              cacheTime: scalarFixture(0.2),
            },
          ],
        },
        'fixture.comboCache',
        {},
      ),
    ).toMatchObject({
      family: 'inputControl',
      action: {
        kind: 'comboCache',
        mappings: [{ commandType: 'ComboSkill', skillId: '', cacheTime: { value: 0.2 } }],
      },
    });
  });

  it('ComboCache 将 VFS 的原生命令枚举值映射为稳定名称', () => {
    const parsed = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.ComboCacheAction+Data, Gameplay.Beyond',
        mappingDataList: [
          {
            cmdType: 0,
            skillId: 'next',
            cacheEndByAction: true,
            clearOffsetTargetSkillIdOnEnd: false,
            overrideCacheTime: false,
            cacheTime: scalarFixture(0),
          },
        ],
      },
      'fixture.comboCache',
      {},
    );
    expect(parsed).toMatchObject({ action: { mappings: [{ commandType: 'Attack' }] } });
  });

  it('严格识别动作寿命内的移动打断屏蔽，并交给输入控制投影消去', () => {
    const source = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.BlockMoveInterruptSkill+Data, Gameplay.Beyond',
      },
      'fixture.blockMoveInterruptSkill',
      {},
    );

    expect(source).toEqual({
      family: 'inputControl',
      action: { kind: 'blockMoveInterruptSkill' },
    });
    expect(
      compileCombatActionSequenceSource(
        parseKnownNativeActionSequenceSource(
          sequence([
            {
              ...META,
              $type: 'Beyond.Gameplay.Core.BlockMoveInterruptSkill+Data, Gameplay.Beyond',
            },
          ]),
          'fixture.blockMoveInterruptSkill',
          {},
        ),
        {
          actionOwnerTarget: 'unavailable',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      ),
    ).toEqual({ steps: [] });
  });

  it('严格保留 InterruptCurSkillAction 的完整 Owner 来源', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type:
            'Beyond.Gameplay.Core.AbilityActions.InterruptCurSkillAction+Data, Gameplay.Beyond',
          skillOwner: targetFixture('Owner'),
        },
        'fixture.interruptCurrentSkill',
        {},
      ),
    ).toMatchObject({
      family: 'timelineControl',
      action: {
        kind: 'interruptCurrentSkill',
        owner: { targetSource: 'Owner', targetGroupKey: '' },
      },
    });
  });

  it('严格保留 AddTagAction 的区间控制标签，不把它伪装成永久实体属性', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.AddTagAction+Data, Gameplay.Beyond',
          tagOwner: targetFixture('Owner'),
          useBlackboard: false,
          tags: [{ tagId: -1601691447 }, { tagId: 1263537306 }, { tagId: -1895802021 }],
          tag: { useBlackboardKey: false, value: '', blackboardKey: '' },
        },
        'fixture.addTags',
        {},
      ),
    ).toMatchObject({
      family: 'inputControl',
      action: {
        kind: 'addEntityControlTags',
        owner: { targetSource: 'Owner', targetGroupKey: '' },
        useBlackboard: false,
        tagIds: [-1601691447, 1263537306, -1895802021],
        tag: { value: '', blackboardKey: null },
      },
    });
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.AddTagToEntities+Data, Gameplay.Beyond',
          tagOwner: targetFixture('Source'),
          useBlackboard: false,
          tags: [{ tagId: -1486085048 }],
          tag: { useBlackboardKey: false, value: '', blackboardKey: '' },
        },
        'fixture.addTagsToEntities',
        {},
      ),
    ).toMatchObject({
      family: 'inputControl',
      action: {
        kind: 'addEntityControlTags',
        owner: { targetSource: 'Source', targetGroupKey: '' },
        tagIds: [-1486085048],
      },
    });
  });

  it('只把两个空 LayerMask 的 ChangeSpecificLayerAction 识别为原生无操作分支', () => {
    const source = {
      ...META,
      $type: 'Beyond.Gameplay.Core.ChangeSpecificLayerAction+Data, Gameplay.Beyond',
      targetSettings: targetFixture('Context', undefined, 'mirror'),
      originLayerMask: {},
      targetLayerMask: {},
    };
    expect(parseKnownNativeActionLeafSource(source, 'fixture.changeLayer', {})).toEqual({
      family: 'presentation',
      action: { kind: 'specificLayerChangeNoop' },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...source, targetLayerMask: { value: 1 } },
        'fixture.changeLayer',
        {},
      ),
    ).toThrow('targetLayerMask: unexpected fields ["value"]');
  });

  it('只在唯一木桩模型中接纳 Source 攻击者到 Buff Owner 的强制交战动作', () => {
    const source = {
      ...META,
      $type: 'Beyond.Gameplay.Core.ForceTargetInFightAction+Data, Gameplay.Beyond',
      attacker: targetFixture('Source'),
      target: targetFixture('Owner'),
    };
    expect(parseKnownNativeActionLeafSource(source, 'fixture.forceFight', {})).toEqual({
      family: 'presentation',
      action: { kind: 'forceTargetInFightOmitted' },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...source, target: targetFixture('Target') },
        'fixture.forceFight',
        {},
      ),
    ).toThrow('unsupported ForceTargetInFight attacker/target projection');
  });

  it('严格保留 SkillAIMoveAction 的寻位参数，在固定零距离投影前不删除空间证据', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.SkillAIMoveAction+Data, Gameplay.Beyond',
          skillMoveTargetType: 'TargetInOutRange',
          radius: 5.5,
          targetSettings: targetFixture('InstantSearch', {
            finderData: { $type: 'Example.Selector+MainTargetFinder+Data, Example' },
            validatorData: [],
            postProcessorData: [],
          }),
          minRange: 2.5,
          maxRange: 5,
          moveOuterDist: 3.5,
          moveInnerDist: 3.5,
          skillRadius: 5.5,
          otherTargetMinDist: 2,
          mainCharLineBlockHalfAngle: 35,
          targetRefreshInterval: 1.5,
          markerInfo: { invert: false, marker: { tagId: 2108198621 } },
        },
        'fixture.skillAiMove',
        {},
      ),
    ).toMatchObject({
      family: 'spatial',
      action: {
        kind: 'skillAiMove',
        moveTargetType: 'TargetInOutRange',
        radius: 5.5,
        target: { targetSource: 'InstantSearch' },
        minRange: 2.5,
        maxRange: 5,
        marker: { invert: false, tagId: 2108198621 },
      },
    });
  });

  it('严格保留 ChangeSkillAction 的槽位、寿命、还原和冷却继承语义', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.ChangeSkillAction+Data, Gameplay.Beyond',
          skillSource: targetFixture('Source'),
          skillSlot: 'NormalSkill',
          targetSkillId: 'chr_0035_liino_normal_skill_end',
          overrideCacheTime: false,
          cacheTime: scalarFixture(0.1),
          lifeTimeType: 'FinishByAction',
          duration: scalarFixture(10),
          inheritOriginSkillCdProgress: true,
          specificRevertedSkillId: true,
          revertedSkillId: 'chr_0035_liino_normal_skill',
        },
        'fixture.changeSkill',
        {},
      ),
    ).toMatchObject({
      family: 'skillSlotReplacement',
      action: {
        kind: 'skillSlotReplacement',
        skillSlot: 'NormalSkill',
        targetSkillId: 'chr_0035_liino_normal_skill_end',
        overrideCacheTime: false,
        lifetime: 'FinishByAction',
        inheritOriginSkillCooldownProgress: true,
        specificRevertedSkillId: true,
        revertedSkillId: 'chr_0035_liino_normal_skill',
      },
    });
  });

  it('严格保留 SaveCameraAngle 的真实输出键，不在来源层猜测角度值', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.SaveCameraAngle+Data, Gameplay.Beyond',
          target: targetFixture('Source'),
          mountPoint: 'VBHit',
          yawKey: '',
          pitchKey: '',
          eulerPitchKey: 'vertical',
          distanceKey: '',
        },
        'fixture.saveCameraAngle',
        {},
      ),
    ).toMatchObject({
      family: 'presentationCalculation',
      action: {
        kind: 'saveCameraAngle',
        mountPoint: 'VBHit',
        outputKeys: ['vertical'],
      },
    });
  });

  it('ExtendBuffAction 严格保留 Buff 所有者和 ID 查询', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.ExtendBuffAction+Data, Gameplay.Beyond',
          buffOwner: targetFixture('Source'),
          buffSettings: {
            checkType: 'Id',
            buffIdList: ['buff_chr_0030_zhuangfy_ult_base'],
            tagQuery: { queryType: 'HasAny', tags: [] },
          },
        },
        'fixture.extendBuff',
        {},
      ),
    ).toMatchObject({
      family: 'buffHold',
      action: {
        kind: 'buffHold',
        owner: { targetSource: 'Source', targetGroupKey: '' },
        settings: {
          checkType: 'Id',
          buffIds: ['buff_chr_0030_zhuangfy_ult_base'],
          tagQuery: { queryType: 'hasAny', tagIds: [] },
        },
      },
    });
  });

  it('CheckHasMoveInput 严格解析为无黑板副作用的输入条件', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.CheckHasMoveInput+Data, Gameplay.Beyond',
        },
        'fixture.moveInput',
        {},
      ),
    ).toEqual({
      family: 'condition',
      action: { kind: 'moveInput', sourceType: 'CheckHasMoveInput' },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.CheckHasMoveInput+Data, Gameplay.Beyond',
          guessedInput: true,
        },
        'fixture.moveInput',
        {},
      ),
    ).toThrow('unexpected fields');
  });

  it('ConvertToTargetContext 完整保留 None 复制与未启用的空间字段', () => {
    const convertFrom = targetFixture(
      'InstantSearch',
      {
        finderData: { $type: 'Example.Selector+MainTargetFinder+Data, Example' },
        validatorData: [],
        postProcessorData: [],
      },
      'trigger',
    );
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.ConvertToTargetContext+Data, Gameplay.Beyond',
          convertFrom,
          targetGroupKey: 'trigger',
          operationType: 'None',
          translateOperation: 'Rotate180DegAroundRef',
          translationRef: 'ActionSource',
          translationDeg: 0,
          excludeTarget: 'ActionSource',
          blackboardVector3: {
            x: scalarFixture(0),
            y: scalarFixture(0),
            z: scalarFixture(0),
          },
        },
        'fixture.convert',
        {},
      ),
    ).toMatchObject({
      family: 'targetGroup',
      action: {
        producerType: 'ConvertToTargetContext',
        targetGroupKey: 'trigger',
        finderType: 'MainTargetFinder',
        conversionOperation: 'None',
        conversionTransform: {
          translateOperation: 'Rotate180DegAroundRef',
          translationRef: 'ActionSource',
          translationDegrees: 0,
          excludeTarget: 'ActionSource',
          vector: {
            x: { useBlackboardKey: false, value: 0, blackboardKey: '' },
          },
        },
      },
    });
  });

  it('ConvertToTargetContext 接受已闭环的实体转位置与排除目标分支并拒绝未知空间操作', () => {
    const action = {
      ...META,
      $type: 'Beyond.Gameplay.Core.ConvertToTargetContext+Data, Gameplay.Beyond',
      convertFrom: targetFixture('Target'),
      targetGroupKey: 'center',
      operationType: 'ConvertEntityToPosition',
      translateOperation: 'Rotate180DegAroundRef',
      translationRef: 'ActionSource',
      translationDeg: 0,
      excludeTarget: 'ActionSource',
      blackboardVector3: {
        x: scalarFixture(0),
        y: scalarFixture(0),
        z: scalarFixture(0),
      },
    };
    expect(parseKnownNativeActionLeafSource(action, 'fixture.convert', {})).toMatchObject({
      family: 'targetGroup',
      action: {
        producerType: 'ConvertToTargetContext',
        conversionOperation: 'ConvertEntityToPosition',
        inputTargets: [{ targetSource: 'Target' }],
      },
    });
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...action,
          convertFrom: targetFixture('Context', undefined, 'tar'),
          operationType: 'ExcludeTarget',
          excludeTarget: 'InputTarget',
        },
        'fixture.exclude',
        {},
      ),
    ).toMatchObject({
      family: 'targetGroup',
      action: {
        producerType: 'ConvertToTargetContext',
        conversionOperation: 'ExcludeTarget',
        inputTargets: [{ targetSource: 'Context', targetGroupKey: 'tar' }],
        conversionTransform: { excludeTarget: 'InputTarget' },
      },
    });
    expect(
      parseKnownNativeActionLeafSource(
        { ...action, operationType: 'ConvertEntityToSlot' },
        'fixture.camera-slot',
        {},
      ),
    ).toMatchObject({
      family: 'targetGroup',
      action: {
        producerType: 'ConvertToTargetContext',
        conversionOperation: 'ConvertEntityToSlot',
      },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...action, operationType: 'TranslatePosition' },
        'fixture.convert',
        {},
      ),
    ).toThrow('unsupported operation "TranslatePosition"');
  });

  it('CreateBuffAttachingSkill 复用公共 Buff 载荷并保留当前施放技能生命周期', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Example.CreateBuffAttachingSkill+Data, Example',
          buffs: [
            {
              buffId: 'buff.weapon.during-skill',
              assignBlackboard: false,
              assignItems: [],
              readIdFromBlackboard: false,
              buffIdKey: '',
            },
          ],
          count: scalarFixture(1),
          targetSettings: targetFixture('Owner'),
          buffSource: 'ActionSource',
          contextKey: '',
          autoFinishByAction: false,
          inheritSkillIdList: [],
          finishWithNextSkillIfNotInherited: true,
          asChildBuff: false,
          inheritSourceSkillCastId: false,
          inheritSourceSkillCastInfo: true,
          isExtra: false,
          passTargetGroupsToBuff: false,
          overrideBuffIconDuration: false,
          buffIconDurationSource: {
            m_abilityEntityTypeInfo: 'editor hint',
            m_timedMarkerInfo: 'editor hint',
            durationSourceType: 'AbilityEntity',
            timedMarkerId: '',
          },
        },
        'fixture.createBuffAttachingSkill',
        {},
      ),
    ).toMatchObject({
      family: 'buffApplication',
      action: {
        kind: 'buffApplication',
        lifetimeOwner: 'currentCastSkill',
        buffs: [{ buffId: 'buff.weapon.during-skill' }],
      },
    });
  });

  it('InheritCCSAction 只在完整相机状态载荷下作为表现动作省略', () => {
    const action = {
      ...META,
      $type: 'Example.InheritCCSAction+Data, Example',
      ccsOwner: targetFixture('Owner'),
      ccsKey: 'CCS_chen_attack_4',
      overrideBlendOut: true,
      blendOutTime: 0.1,
    };
    expect(parseKnownNativeActionLeafSource(action, 'fixture.inheritCcs', {})).toEqual({
      family: 'presentation',
      action: { kind: 'inheritedCameraControlState' },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...action, ccsOwner: targetFixture('Target') },
        'fixture.inheritCcs',
        {},
      ),
    ).toThrow('expected plain Owner');
  });

  it('IgnoreModelIntervalCheck 只接受纯 ModelManager 分帧开关形状', () => {
    const action = {
      ...META,
      $type: 'Beyond.Gameplay.Core.IgnoreModelIntervalCheck+Data, Gameplay.Beyond',
    };
    expect(parseKnownNativeActionLeafSource(action, 'fixture.modelIntervalCheck', {})).toEqual({
      family: 'presentation',
      action: { kind: 'modelIntervalCheck' },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...action, combatPayload: true },
        'fixture.modelIntervalCheck',
        {},
      ),
    ).toThrow('unexpected fields');
  });

  it('SetAbilityEntityDuration 保留 Context 实体、运算和数值来源', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.SetAbilityEntityDuration+Data, Gameplay.Beyond',
          setMultipleTarget: false,
          targetSettings: targetFixture('Target'),
          actionTargetType: 'ContextTarget',
          targetContextKey: 'bunshin1',
          operation: 'Assign',
          value: scalarFixture(0.5),
        },
        'fixture.abilityEntityDuration',
        {},
      ),
    ).toMatchObject({
      family: 'abilityEntityDuration',
      action: {
        kind: 'abilityEntityDurationMutation',
        targetContextKey: 'bunshin1',
        operation: 'Assign',
        value: { value: 0.5, blackboardKey: null },
      },
    });
  });

  it('SetAbilityEntityDuration 接受 InputTarget 样本的固定紧凑 TargetSettings 外壳', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.SetAbilityEntityDuration+Data, Gameplay.Beyond',
          setMultipleTarget: false,
          targetSettings: {
            targetSource: 'Target',
            selectorOwner: 'ActionOwner',
            centerType: 'ActionSource',
            centerToGround: false,
            enableAdvancedDirection: false,
            advancedDirection: {
              directionType: 'SourceForward',
              sourceMountPoint: 'None',
              targetMountPoint: 'None',
              customSourceAndTarget: false,
              clampToXZ: true,
              invertDirection: false,
            },
            selectorDirection: 'SourceForward',
            target: 'ActionSource',
          },
          actionTargetType: 'InputTarget',
          targetContextKey: '',
          operation: 'Assign',
          value: scalarFixture(3),
        },
        'fixture.abilityEntityDuration.inputTarget',
        {},
      ),
    ).toMatchObject({
      family: 'abilityEntityDuration',
      action: {
        actionTargetType: 'InputTarget',
        targetContextKey: '',
        target: { targetSource: 'Target', targetGroupKey: '', finderType: null },
      },
    });
  });

  it('SaveCharTypeId 进入公共角色表身份读取 IR', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Example.SaveCharTypeId+Data, Example',
          target: targetFixture('Owner'),
          storeKey: 'owner_char_type',
        },
        'fixture.characterTypeId',
        {},
      ),
    ).toMatchObject({
      family: 'characterIdentity',
      action: {
        kind: 'characterTypeIdRead',
        target: { targetSource: 'Owner', targetGroupKey: '' },
        outputKey: 'owner_char_type',
      },
    });
  });

  it('控制流和叶子使用同一入口，不由领域适配器再次解释类型', () => {
    const parsed = parseKnownNativeActionSequenceSource(
      sequence([
        {
          ...META,
          $type: 'Example.IfElseAction+IfElseActionData, Example',
          conditionAction: sequence([
            {
              ...META,
              $type: 'Example.CompareFloat+Data, Example',
              compare: 'Greater',
              valueA: scalarFixture(0, 'talent'),
              valueB: scalarFixture(0.5),
            },
          ]),
          succeedActions: sequence([
            {
              ...META,
              serverActionIndex: 2,
              $type: 'Example.CastSkill+Data, Example',
              caster: targetFixture('Owner'),
              target: targetFixture('Target'),
              skillId: { value: 'fixture_child', useBlackboardKey: false, blackboardKey: '' },
              skipApplyCost: true,
              inheritSourceSkillCastId: true,
            },
          ]),
          failActions: sequence([]),
          alwaysNext: true,
        },
      ]),
      'fixture.sequence',
      { talent: [0, 1] },
    );
    expect(parsed.actions[0]?.body).toMatchObject({
      kind: 'ifElse',
      condition: {
        actions: [
          {
            body: {
              kind: 'leaf',
              value: {
                family: 'condition',
                action: { kind: 'floatCompare', left: { levelValues: [0, 1] } },
              },
            },
          },
        ],
      },
      whenTrue: {
        actions: [
          {
            body: {
              value: { family: 'skillCast', action: { skillId: { value: 'fixture_child' } } },
            },
          },
        ],
      },
    });
  });

  it('只把固定施法者、静态木桩目标和可解析技能 ID 投影为原生延迟施法槽', () => {
    const makeCast = (overrides: Record<string, unknown> = {}) => ({
      ...META,
      $type: 'Example.CastSkill+Data, Example',
      caster: targetFixture('Source'),
      target: targetFixture('Context', undefined, 'tar'),
      skillId: { value: 'fixture_child', useBlackboardKey: false, blackboardKey: '' },
      skipApplyCost: true,
      inheritSourceSkillCastId: true,
      ...overrides,
    });
    const compile = (action: Record<string, unknown>) =>
      compileCombatActionSequenceSource(
        parseKnownNativeActionSequenceSource(sequence([action]), 'fixture.castSkill', {}),
        {
          actionOwnerTarget: 'unavailable',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
          staticEnemyTargetGroupKeys: new Set(['tar']),
        },
      );

    expect(compile(makeCast())).toEqual({
      steps: [
        {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'fixture_child',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
          },
        },
      ],
    });
    expect(compile(makeCast({ interruptCurSkillOnlyWhenTargetCastable: true }))).toEqual({
      steps: [
        {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'fixture_child',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          },
        },
      ],
    });
    expect(
      compile(
        makeCast({
          skillId: { value: '', useBlackboardKey: true, blackboardKey: 'child_skill' },
        }),
      ),
    ).toEqual({
      steps: [
        {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: { blackboardKey: 'child_skill' },
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
          },
        },
      ],
    });
    expect(compile(makeCast({ target: targetFixture('Target', undefined, 'ignored') }))).toEqual({
      steps: [
        {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'fixture_child',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
          },
        },
      ],
    });

    expect(
      compile(
        makeCast({
          target: targetFixture('MainTarget'),
          skipApplyCost: false,
          inheritSourceSkillCastId: false,
        }),
      ),
    ).toEqual({
      steps: [
        {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'fixture_child',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
      ],
    });
  });

  it('未迁移动作携带路径明确阻塞', () => {
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...META, $type: 'Example.UnknownCombatAction+Data, Example' },
        'fixture.unknown',
        {},
      ),
    ).toThrow('fixture.unknown.$type: unsupported native action "UnknownCombatAction"');
  });

  it('TriggerComboSkillAction 保留 Pending 目标、按当前连携槽开窗并拒绝施法黑板', () => {
    const action = {
      ...META,
      $type: 'Beyond.Gameplay.Core.TriggerComboSkillAction+Data, Gameplay.Beyond',
      owner: targetFixture('Context', undefined, 'seraph'),
      target: targetFixture('InstantSearch', {
        finderData: { $type: 'Example.Selector+MainTargetFinder+Data, Example' },
        validatorData: [],
        postProcessorData: [],
      }),
      needTrigger: false,
      trigger: targetFixture('Target'),
      assignItems: [],
    };
    expect(parseKnownNativeActionLeafSource(action, 'fixture.comboPending', {})).toMatchObject({
      family: 'comboPending',
      action: {
        kind: 'comboPending',
        needTrigger: false,
        assignmentCount: 0,
        owner: { targetSource: 'Context', targetGroupKey: 'seraph' },
        target: { targetSource: 'InstantSearch', finderType: 'MainTargetFinder' },
        trigger: { targetSource: 'Target' },
      },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...action, assignItems: [{}] },
        'fixture.comboPending',
        {},
      ),
    ).toThrow('combo Pending blackboard assignments are unsupported');

    expect(
      compileCombatActionSequenceSource(
        parseKnownNativeActionSequenceSource(sequence([action]), 'fixture.contextComboPending', {}),
        { actionOwnerTarget: 'caster', actionSourceTarget: 'caster', actionTargetTarget: 'enemy' },
      ),
    ).toEqual({
      steps: [
        {
          kind: 'openComboWindow',
          parameters: {
            nextSkillKeyFromSlot: 'comboSkill',
            ownerContextKey: 'seraph',
          },
        },
      ],
    });
    const fixedCasterPending = {
      ...action,
      owner: targetFixture('Owner'),
      target: targetFixture('Context', undefined, 'smart_target'),
    };
    expect(
      compileCombatActionSequenceSource(
        parseKnownNativeActionSequenceSource(
          sequence([fixedCasterPending]),
          'fixture.fixedCasterComboPending',
          {},
        ),
        {
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
          staticEnemyTargetGroupKeys: new Set(['smart_target']),
        },
      ),
    ).toEqual({
      steps: [
        {
          kind: 'openComboWindow',
          parameters: { nextSkillKeyFromSlot: 'comboSkill' },
        },
      ],
    });
  });

  it('PauseComboSkillTime 严格保留自动连携候选暂停范围', () => {
    const action = {
      ...META,
      $type: 'Beyond.Gameplay.Core.PauseComboSkillTime+Data, Gameplay.Beyond',
      isAll: false,
      characterSettings: targetFixture('Owner'),
    };
    expect(parseKnownNativeActionLeafSource(action, 'fixture.pauseCombo', {})).toMatchObject({
      family: 'inputControl',
      action: {
        kind: 'pauseComboSkillTime',
        allCharacters: false,
        character: { targetSource: 'Owner', targetGroupKey: '' },
      },
    });
  });

  it('ClearProjectileAction 只在同步投射物模型的无结束回调切片中省略', () => {
    const action = {
      ...META,
      $type: 'Beyond.Gameplay.Core.ClearProjectileAction+Data, Gameplay.Beyond',
      clearSource: targetFixture('Owner'),
      filterClearRange: false,
      rangeCenter: targetFixture('Owner'),
      clearRange: scalarFixture(0),
      filterProjectileId: true,
      projectileIdList: ['projectile_fixture_absorb'],
      playFinishEffect: false,
      finishAction: 'NotCastSkill',
    };
    expect(parseKnownNativeActionLeafSource(action, 'fixture.clearProjectile', {})).toMatchObject({
      family: 'projectileControl',
      action: {
        kind: 'clearProjectile',
        clearSource: { targetSource: 'Owner', targetGroupKey: '' },
        filterProjectileId: true,
        projectileIds: ['projectile_fixture_absorb'],
        playFinishEffect: false,
        finishAction: 'NotCastSkill',
      },
    });
    expect(
      compileCombatActionSequenceSource(
        parseKnownNativeActionSequenceSource(
          sequence([action]),
          'fixture.clearProjectileSequence',
          {},
        ),
        {
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      ),
    ).toEqual({ steps: [] });
    expect(() =>
      compileCombatActionSequenceSource(
        parseKnownNativeActionSequenceSource(
          sequence([{ ...action, finishAction: 'CastSkill' }]),
          'fixture.clearProjectileFinishCallback',
          {},
        ),
        {
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      ),
    ).toThrow('unsupported clear projectile projection');
  });

  it('AnimEventReceiver 保留事件参数和完整回调，但禁用节点不进入运行时', () => {
    const action = {
      ...META,
      $type: 'Beyond.Gameplay.Core.AnimEventReceiver+Data, Gameplay.Beyond',
      isEnable: false,
      eventId: 'attack',
      blackboardKey: 'AnimEventReciver',
      actionOnEvent: sequence([]),
    };
    const parsed = parseKnownNativeActionSequenceSource(
      sequence([action]),
      'fixture.disabledAnimEvent',
      {},
    );
    expect(parsed.actions[0]).toMatchObject({
      metadata: { nativeName: 'AnimEventReceiver', enabled: false },
      body: {
        kind: 'leaf',
        value: {
          family: 'animationEventListener',
          action: {
            kind: 'animationEventListener',
            eventId: 'attack',
            eventParameterBlackboardKey: 'AnimEventReciver',
          },
        },
      },
    });
    expect(
      compileCombatActionSequenceSource(parsed, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }),
    ).toEqual({ steps: [] });
  });

  it('启用的 AnimEventReceiver 只允许省略纯表现回调', () => {
    const presentation = parseKnownNativeActionSequenceSource(
      sequence([
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.AnimEventReceiver+Data, Gameplay.Beyond',
          eventId: 'shoot',
          blackboardKey: 'AnimEventReciver',
          actionOnEvent: sequence([
            {
              ...META,
              $type: 'Beyond.Gameplay.Core.DebugPrintAction+Data, Gameplay.Beyond',
              logType: 'String',
              target: targetFixture('Owner'),
              color: { r: 1, g: 0, b: 0, a: 1 },
              bbKey: '',
              identifier: 'Shoot!',
            },
          ]),
        },
      ]),
      'fixture.presentationAnimEvent',
      {},
    );
    expect(
      compileCombatActionSequenceSource(presentation, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }),
    ).toEqual({ steps: [] });

    const combat = structuredClone(presentation);
    const listener = combat.actions[0]!;
    if (listener.body.kind !== 'leaf' || listener.body.value.family !== 'animationEventListener')
      throw new Error('invalid fixture');
    const combatListener = {
      ...listener,
      body: {
        kind: 'leaf' as const,
        value: {
          ...listener.body.value,
          action: {
            ...listener.body.value.action,
            actionOnEvent: parseKnownNativeActionSequenceSource(
              sequence([
                {
                  ...META,
                  $type: 'Beyond.Gameplay.Core.Conditions.CheckEntityNum+Data, Gameplay.Beyond',
                  checkTarget: targetFixture('Context', undefined, 'enemy'),
                  minNum: 1,
                  containsHittableTarget: false,
                  compareType: 'GE',
                  excludeDeadEntity: false,
                  storeKey: '',
                },
              ]),
              'fixture.combatAnimEvent.callback',
              {},
            ),
          },
        },
      },
    };
    expect(() =>
      compileCombatActionSequenceSource(
        { ...combat, actions: [combatListener] },
        {
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      ),
    ).toThrow('unsupported combat animation-event listener');
  });

  it('ContinuousSetAnimTimeScale 严格保留动态倍率来源', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.ContinuousSetAnimTimeScale+Data, Gameplay.Beyond',
          serverActionIndex: 1497,
          timeScale: {
            useBlackboardKey: true,
            value: 0,
            blackboardKey: 'AnimScale',
          },
        },
        'fixture.continuousAnimationTimeScale',
        { AnimScale: [1] },
      ),
    ).toEqual({
      family: 'animationTiming',
      action: {
        kind: 'continuousAnimationTimeScale',
        timeScale: { value: 0, blackboardKey: 'AnimScale', levelValues: [1] },
      },
    });
  });

  it('ContinuousSetAnimTimeScale 仅在完整技能证明无启用动画事件监听器时省略', () => {
    const parsed = parseKnownNativeActionSequenceSource(
      sequence([
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.ContinuousSetAnimTimeScale+Data, Gameplay.Beyond',
          serverActionIndex: 1497,
          timeScale: {
            useBlackboardKey: true,
            value: 0,
            blackboardKey: 'AnimScale',
          },
        },
      ]),
      'fixture.continuousAnimationTimeScaleSequence',
      { AnimScale: [1] },
    );
    expect(
      compileCombatActionSequenceSource(parsed, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
        enabledAnimationEventListenerPresent: false,
      }),
    ).toEqual({ steps: [] });
    expect(() =>
      compileCombatActionSequenceSource(parsed, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
        enabledAnimationEventListenerPresent: true,
      }),
    ).toThrow('animation time scale may affect enabled animation-event combat callbacks');
  });

  it('SendBattleSignalToLevel 保留关卡信号载荷但不建立木桩战斗消费者', () => {
    const parsed = parseKnownNativeActionSequenceSource(
      sequence([
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.SendBattleSignalToLevel+Data, Gameplay.Beyond',
          signalId: {
            useBlackboardKey: false,
            value: 'tut_level_wulfa_ultimateskill_success',
            blackboardKey: '',
          },
          doubleValue: {
            useBlackboardKey: false,
            value: 0,
            blackboardKey: '',
          },
        },
      ]),
      'fixture.battleLevelSignal',
      {},
    );
    expect(parsed.actions[0]).toMatchObject({
      body: {
        kind: 'leaf',
        value: {
          family: 'levelEvent',
          action: {
            kind: 'battleLevelSignal',
            signalId: { value: 'tut_level_wulfa_ultimateskill_success', blackboardKey: null },
            value: { value: 0, blackboardKey: null },
          },
        },
      },
    });
    expect(
      compileCombatActionSequenceSource(parsed, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }),
    ).toEqual({ steps: [] });
  });

  it('随机值只选择战斗等价分支时省略随机与条件', () => {
    const presentationBranch = (identifier: string) =>
      sequence([
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.DebugPrintAction+Data, Gameplay.Beyond',
          logType: 'String',
          target: targetFixture('Owner'),
          color: { r: 1, g: 0, b: 0, a: 1 },
          bbKey: '',
          identifier,
        },
      ]);
    const parsed = parseKnownNativeActionSequenceSource(
      sequence([
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.RandomAction+Data, Gameplay.Beyond',
          randomType: 'Int',
          minValue: scalarFixture(0),
          maxValue: scalarFixture(100),
          targetBlackboardKey: 'random_hurtanimation',
        },
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.IfElseAction+IfElseActionData, Gameplay.Beyond',
          conditionAction: sequence([
            {
              ...META,
              $type: 'Beyond.Gameplay.Core.CompareFloat+Data, Gameplay.Beyond',
              valueA: scalarFixture(0, 'random_hurtanimation'),
              compare: 'LT',
              valueB: scalarFixture(75),
            },
          ]),
          succeedActions: presentationBranch('left'),
          failActions: presentationBranch('right'),
          alwaysNext: true,
        },
      ]),
      'fixture.randomPresentationVariant',
      {},
    );
    expect(
      compileCombatActionSequenceSource(parsed, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }),
    ).toEqual({ steps: [] });
  });

  it('CustomRootMotionAction 严格保留目标、动画与移动区间载荷', () => {
    const source = {
      ...META,
      $type: 'Beyond.Gameplay.Core.CustomRootMotionAction+Data, Gameplay.Beyond',
      moveTo: targetFixture('Target', undefined, 'MainTar'),
      animKey: 'ComboSkill',
      rootMotionCurveMask: 'PosZ',
      scaleX: scalarFixture(1),
      scaleY: scalarFixture(1),
      enableScaleZWithDistanceCurve: false,
      distance2ScaleZ: [
        {
          time: 0,
          value: 1,
          inTangent: 0,
          outTangent: 0,
          inWeight: 0,
          outWeight: 0,
          weightedMode: 0,
        },
      ],
      scaleZ: scalarFixture(1.5),
      blockRadius: scalarFixture(1),
      useExtraBlockRadiusForInt: false,
      extraRadiusForInt: scalarFixture(1.5),
      enableMaxDistanceCheckWhenMoveBack: false,
      maxDistanceWhenMoveBack: scalarFixture(5),
      updateDir: true,
      startOffsetFrame: 6,
      playbackSpeed: scalarFixture(1),
      stopByCliff: true,
      ignoreAllCollision: false,
      ignoreCollisionLayer: {},
    };
    expect(parseKnownNativeActionLeafSource(source, 'fixture.rootMotion', {})).toMatchObject({
      family: 'spatial',
      action: {
        kind: 'customRootMotion',
        target: { targetSource: 'Target', targetGroupKey: 'MainTar' },
        animationKey: 'ComboSkill',
        rootMotionCurveMask: 'PosZ',
        updateDirection: true,
        startOffsetFrame: 6,
      },
    });
    expect(
      parseKnownNativeActionLeafSource(
        { ...source, rootMotionCurveMask: 5 },
        'fixture.rootMotion',
        {},
      ),
    ).toMatchObject({ action: { rootMotionCurveMask: 5 } });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...source, unknownCombatField: true },
        'fixture.rootMotion',
        {},
      ),
    ).toThrow('fixture.rootMotion: unexpected fields');
  });

  it('BoneAttachAction 保留控制生命周期载荷并仅对已证明木桩省略', () => {
    const source = {
      ...META,
      $type: 'Beyond.Gameplay.BoneAttachAction+Data, Gameplay.Beyond',
      targetSettings: targetFixture('Target', undefined, 'tar'),
      anchorSlot: 'IKWepL',
      subSlot: 'VBHit',
      isAddRotation: false,
      rotateAnchor: 'Owner',
      rotateAngles: { x: 0, y: 0, z: 0 },
      isLerp: true,
      lerpTime: 0.5,
      alwaysFollowRotation: false,
    };
    expect(parseKnownNativeActionLeafSource(source, 'fixture.boneAttach', {})).toMatchObject({
      family: 'spatial',
      action: {
        kind: 'boneAttach',
        target: { targetSource: 'Target', targetGroupKey: 'tar' },
        anchorSlot: 'IKWepL',
        subSlot: 'VBHit',
        isLerp: true,
        lerpTimeSeconds: 0.5,
      },
    });
    const parsed = parseKnownNativeActionSequenceSource(
      sequence([source]),
      'fixture.boneAttach.sequence',
      {},
    );
    expect(
      compileCombatActionSequenceSource(parsed, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
        staticEnemyTargetGroupKeys: new Set(['tar']),
      }),
    ).toEqual({ steps: [] });
    expect(() =>
      compileCombatActionSequenceSource(parsed, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }),
    ).toThrow('unsupported BoneAttach target projection');
  });

  it('DisableRootMotionAction 只接受无额外载荷的原生形状', () => {
    const source = {
      ...META,
      $type: 'Beyond.Gameplay.Core.DisableRootMotionAction+Data, Gameplay.Beyond',
    };
    expect(parseKnownNativeActionLeafSource(source, 'fixture.disableRootMotion', {})).toEqual({
      family: 'spatial',
      action: { kind: 'disableRootMotion' },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...source, guessedDuration: 1 },
        'fixture.disableRootMotion',
        {},
      ),
    ).toThrow('fixture.disableRootMotion: unexpected fields');
  });

  it('SpellInfliction 严格保留来源、目标、元素与额外附着标记', () => {
    const source = {
      ...META,
      $type: 'Beyond.Gameplay.Core.SpellInfliction+Data, Gameplay.Beyond',
      source: targetFixture('Source'),
      target: targetFixture('Context', undefined, 'tar'),
      inflictionType: 'Fire',
      isExtra: false,
    };
    expect(parseKnownNativeActionLeafSource(source, 'fixture.infliction', {})).toMatchObject({
      family: 'elementalInfliction',
      action: {
        kind: 'elementalInfliction',
        source: { targetSource: 'Source', targetGroupKey: '' },
        target: { targetSource: 'Context', targetGroupKey: 'tar' },
        element: 'Fire',
        isExtra: false,
      },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...source, inflictionType: 'Imaginary' },
        'fixture.infliction',
        {},
      ),
    ).toThrow('fixture.infliction.inflictionType: unsupported elemental infliction');
  });

  it('SpellInflictionOnChar 与敌人附着动作分型并严格保留角色异常参数', () => {
    const source = {
      ...META,
      $type: 'Beyond.Gameplay.Core.SpellInflictionOnChar+Data, Gameplay.Beyond',
      source: targetFixture('Owner'),
      target: targetFixture('MainCharacter'),
      inflictionType: 'Cryst',
      directToTriggerred: false,
      inflictionCount: 1,
      inflictionCountBlackboardKey: '',
      useInflictionCountBlackboardKey: false,
      ignoreImmuneLevel: 'IgnoreWeakImmune',
      ignoreAddingCooldown: false,
    };
    expect(parseKnownNativeActionLeafSource(source, 'fixture.charInfliction', {})).toMatchObject({
      family: 'characterSpellInfliction',
      action: {
        kind: 'characterSpellInfliction',
        source: { targetSource: 'Owner', targetGroupKey: '' },
        target: { targetSource: 'MainCharacter', targetGroupKey: '' },
        element: 'Cryst',
        directToTriggered: false,
        count: 1,
        countBlackboardKey: '',
        useCountBlackboardKey: false,
        ignoreImmuneLevel: 'IgnoreWeakImmune',
        ignoreAddingCooldown: false,
      },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...source, ignoreImmuneLevel: 'IgnoreEverything' },
        'fixture.charInfliction',
        {},
      ),
    ).toThrow('fixture.charInfliction.ignoreImmuneLevel: unsupported value');
  });

  it('TeleportPosSelectAction 完整保留选点策略和上下文写入', () => {
    const source = {
      ...META,
      $type: 'Beyond.Gameplay.Core.TeleportPosSelectAction+Data, Gameplay.Beyond',
      targetSettings: targetFixture('Target'),
      teleportType: 'FixedDistance',
      fixDistanceData: {
        excludeCurrentPos: false,
        distance: scalarFixture(3),
        useAddScoreToPrevSide: false,
      },
      rangedData: { forwardDistance: scalarFixture(0) },
      contextKey: 'smartpos',
    };
    expect(parseKnownNativeActionLeafSource(source, 'fixture.teleportPosition', {})).toMatchObject({
      family: 'spatial',
      action: {
        kind: 'teleportPositionSelection',
        target: { targetSource: 'Target' },
        teleportType: 'FixedDistance',
        excludeCurrentPosition: false,
        distance: { value: 3, blackboardKey: null },
        useAddScoreToPreviousSide: false,
        forwardDistance: { value: 0, blackboardKey: null },
        outputContextKey: 'smartpos',
      },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...source, teleportType: 'UnknownMode' },
        'fixture.teleportPosition',
        {},
      ),
    ).toThrow('fixture.teleportPosition.teleportType: unsupported teleport position selection');
  });

  it('SaveTargetDistanceAction 保留真实端点和黑板输出键', () => {
    const source = {
      ...META,
      $type: 'Beyond.Gameplay.Core.SaveTargetDistanceAction+Data, Gameplay.Beyond',
      source: targetFixture('Context', undefined, 'mainchar'),
      target: targetFixture('Owner'),
      bbKey: 'owner_mainchar_distance',
    };
    expect(parseKnownNativeActionLeafSource(source, 'fixture.distance', {})).toMatchObject({
      family: 'spatialMeasurement',
      action: {
        kind: 'saveTargetDistance',
        source: { targetSource: 'Context', targetGroupKey: 'mainchar' },
        target: { targetSource: 'Owner', targetGroupKey: '' },
        outputKey: 'owner_mainchar_distance',
      },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...source, unknownDistanceField: true },
        'fixture.distance',
        {},
      ),
    ).toThrow('fixture.distance: unexpected fields');
  });

  it('PlayAnimationWithStep 保留动画身份并严格读取步进载荷', () => {
    const source = {
      ...META,
      $type:
        'Beyond.Gameplay.Core.PlayAnimationWithStep+PlayAnimationWithStepData, Gameplay.Beyond',
      animName: 'Attack02',
      blendDuration: 0.1,
      blendOut: 1,
      duration: 7.4666667,
      playbackSpeed: 1,
      useStartTimeBlackboardKey: false,
      startTime: 0,
      startTimeBlackboardKey: '',
      exitToIdle: false,
      blendOutNextStateHash: 0,
      onEndAction: {
        actionData: [],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      executeOnNormalEndOnly: false,
      stepTarget: targetFixture('Target'),
      montageName: 'BattleStepR',
      stepDistance: 2.5,
      frameToOriginAnim: 3,
      stepBlendIn: 0.067,
      animBlendInAfterStep: 0.1,
      snapFrame: 6,
      snapDistance: 1.5,
      useFixSpeed: false,
      speed: scalarFixture(15),
      speedCurveKey: '默认近战普攻',
      hideWeapon: false,
      hideWeaponFrame: 6,
      battlePoseWhenStep: false,
    };
    expect(parseKnownNativeActionLeafSource(source, 'fixture.stepAnimation', {})).toMatchObject({
      family: 'presentation',
      action: { kind: 'playAnimation', animationName: 'Attack02', durationSeconds: 7.4666667 },
    });
  });

  it('PushBackAction 与 BreakInteractiveAction 分别保留木桩控制和场景旁路身份', () => {
    const curve = [
      {
        time: 0,
        value: 1,
        inTangent: 0,
        outTangent: 0,
        inWeight: 0,
        outWeight: 0,
        weightedMode: 0,
      },
    ];
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.PushBackAction+Data, Gameplay.Beyond',
          attackerTargetSettings: targetFixture('Source'),
          sourcePointSettings: targetFixture('Source'),
          targetSettings: targetFixture('Target'),
          pushBackDirection: 'SourceToTarget',
          pushBackDistance: scalarFixture(0),
          distanceCurveEnabled: false,
          curveOriginUseSourcePoint: false,
          distanceCurve: curve,
          distanceUseScale: true,
          timeUseScale: true,
          unmovableUseScale: true,
          pushBackTime: scalarFixture(0.2),
          unmovableTime: scalarFixture(1.5),
          useCustomCurve: false,
          customCurve: curve,
          curveTemplate: 'EaseInOut',
        },
        'fixture.pushBack',
        {},
      ),
    ).toMatchObject({
      family: 'stumpControl',
      action: { kind: 'pushBack' },
    });
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.AbilityActions.BreakInteractiveAction+Data, Gameplay.Beyond',
          attacker: 'ActionSource',
          damageType: 'Physical',
          atkCalculation: {
            $type: 'Beyond.Gameplay.Core.DefiniteValueCalculation, Gameplay.Beyond',
            value: scalarFixture(15),
            applyScale: false,
            valueScale: scalarFixture(0),
          },
          damageProcessors: [],
          targetInteractives: targetFixture('Target'),
        },
        'fixture.breakInteractive',
        {},
      ),
    ).toMatchObject({
      family: 'environment',
      action: { kind: 'breakInteractive', damageType: 'Physical' },
    });
  });

  it('LaunchUpwardAction 严格保留独立控制参数与返回策略', () => {
    const action = {
      ...META,
      $type: 'Beyond.Gameplay.Core.LaunchUpwardAction+Data, Gameplay.Beyond',
      source: targetFixture('Owner'),
      target: targetFixture('Context', undefined, 'combo_tar'),
      teammateBigStagger: false,
      floatingDuration: scalarFixture(0.8),
      floatingHeight: scalarFixture(1.6),
      speedFactorMultiplier: 5,
      faceDirection: {
        directionType: 'TargetToSource',
        source: targetFixture('Context', undefined, 'pos'),
        target: targetFixture('Context', undefined, 'combo_tar'),
        sourceMountPoint: 'None',
        targetMountPoint: 'None',
        customSourceAndTarget: true,
        clampToXZ: true,
        invertDirection: false,
      },
      airborneEffect: { moveType: 'Stationary', effectName: '' },
      immobilizedTime: 0,
      deadOption: 'AllValid',
      returnTrueWhen: 'Always',
    };
    expect(parseKnownNativeActionLeafSource(action, 'fixture.launchUpward', {})).toMatchObject({
      family: 'stumpControl',
      action: {
        kind: 'launchUpward',
        teammateBigStagger: false,
        floatingDuration: { value: 0.8 },
        floatingHeight: { value: 1.6 },
        speedFactorMultiplier: 5,
        deadOption: 'AllValid',
        returnTrueWhen: 'Always',
      },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...action, undocumentedFlag: true },
        'fixture.launchUpward',
        {},
      ),
    ).toThrow('undocumentedFlag');
  });

  it('BlowOffEnemyAction 严格保留死亡过滤，ChannelingCastingAction 保留输入限制区间', () => {
    const blowOff = {
      ...META,
      $type: 'Beyond.Gameplay.Core.BlowOffEnemyAction+Data, Gameplay.Beyond',
      attackerTargetSettings: targetFixture('Owner'),
      targetSettings: targetFixture('Context', undefined, 'tar'),
      blowOffDistance: scalarFixture(3.2),
      distanceRandomRange: scalarFixture(0.2),
      overwriteHeight: false,
      blowOffHeight: scalarFixture(0),
      directionSettings: {
        directionType: 'SourceToTarget',
        sourceMountPoint: 'None',
        targetMountPoint: 'None',
        customSourceAndTarget: false,
        clampToXZ: true,
        invertDirection: false,
      },
      totalTime: scalarFixture(0),
      isExtra: false,
      deadOption: 'OnlyDead',
    };
    expect(parseKnownNativeActionLeafSource(blowOff, 'fixture.blowOff', {})).toMatchObject({
      family: 'stumpControl',
      action: { kind: 'blowOffEnemy', deadOption: 'OnlyDead' },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...blowOff, undocumentedFlag: true },
        'fixture.blowOff',
        {},
      ),
    ).toThrow('undocumentedFlag');

    const characterBlowOff = {
      ...META,
      $type: 'Beyond.Gameplay.Core.BlowOffAction+Data, Gameplay.Beyond',
      attackerTargetSettings: targetFixture('Owner'),
      targetSettings: targetFixture('Target'),
      teammateBigStagger: true,
      blowOffDistance: scalarFixture(3.2),
      distanceRandomRange: scalarFixture(0.2),
      overwriteHeight: false,
      blowOffHeight: scalarFixture(0),
      directionSettings: blowOff.directionSettings,
      directionAngleOffset: scalarFixture(0),
      totalTime: scalarFixture(1),
      deadOption: 'AllValid',
      forceMoveColliderToGround: false,
      modelHeightRecoverTime: scalarFixture(0),
    };
    expect(
      parseKnownNativeActionLeafSource(characterBlowOff, 'fixture.characterBlowOff', {}),
    ).toMatchObject({
      family: 'stumpControl',
      action: { kind: 'blowOff', deadOption: 'AllValid' },
    });

    const channeling = {
      ...META,
      $type: 'Beyond.Gameplay.Core.ChannelingCastingAction+Data, Gameplay.Beyond',
      cantSwitchPosition: true,
      cantSwitchToCenter: false,
      duration: scalarFixture(3.7),
      cantCastSkill: true,
    };
    expect(parseKnownNativeActionLeafSource(channeling, 'fixture.channeling', {})).toMatchObject({
      family: 'castingControl',
      action: {
        kind: 'channelingCasting',
        cantSwitchPosition: true,
        cantSwitchToCenter: false,
        cantCastSkill: true,
        duration: { value: 3.7, blackboardKey: null },
      },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...channeling, undocumentedFlag: true },
        'fixture.channeling',
        {},
      ),
    ).toThrow('undocumentedFlag');
  });

  it('SnapToTargetWithRangeAction 严格保留贴近目标的空间载荷', () => {
    const curve = [
      {
        time: 0,
        value: 1,
        inTangent: 0,
        outTangent: 0,
        inWeight: 0,
        outWeight: 0,
        weightedMode: 0,
      },
    ];
    const source = {
      ...META,
      $type: 'Beyond.Gameplay.Core.SnapToTargetWithRangeAction+Data, Gameplay.Beyond',
      moveTo: targetFixture('Target'),
      fixPositionWhenStart: false,
      radius: scalarFixture(1),
      moveType: 'FixedSpeed',
      needRotate: true,
      useFixSpeed: true,
      speed: scalarFixture(20),
      fixedSpeedCurveKey: '默认近战普攻',
      speedCurve: curve,
      positionCurve: curve,
      totalTime: 0.1,
      rootMotionAnimKey: '',
      rootMotionMaxDistance: 0,
      chargePriority: 'Normal',
    };
    expect(parseKnownNativeActionLeafSource(source, 'fixture.snap', {})).toMatchObject({
      family: 'spatial',
      action: {
        kind: 'snapToTargetWithRange',
        target: { targetSource: 'Target' },
        radius: { value: 1, blackboardKey: null },
        moveType: 'FixedSpeed',
        needRotate: true,
        totalTime: 0.1,
      },
    });
    expect(() =>
      parseKnownNativeActionLeafSource(
        { ...source, unknownMovementField: true },
        'fixture.snap',
        {},
      ),
    ).toThrow('fixture.snap: unexpected fields');
    expect(() =>
      parseKnownNativeActionLeafSource(
        {
          ...source,
          speedCurve: [{ ...curve[0], inTangent: 'Infinity' }],
        },
        'fixture.snap.serializedInfinity',
        {},
      ),
    ).not.toThrow();
  });

  it('SaveBuffStackNumAdvanced 进入公共 Buff 查询 IR', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Example.SaveBuffStackNumAdvanced+Data, Example',
          checkTarget: targetFixture('Target'),
          buffSettings: {
            checkType: 'Tag',
            buffIdList: [],
            tagQuery: { queryType: 'HasAny', tags: [{ tagId: 1075718177 }] },
          },
          buffStackNumType: 'BuffCount',
          limitSkillCastId: false,
          key: 'physical_layers',
        },
        'fixture.buffStackRead',
        {},
      ),
    ).toMatchObject({
      family: 'buffQuery',
      action: {
        target: { targetSource: 'Target' },
        checkType: 'Tag',
        buffTagIds: [1075718177],
        countType: 'BuffCount',
        outputKey: 'physical_layers',
      },
    });
  });

  it('简单 SaveBuffStackNum 严格归一为单 ID 增强层数读取', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.SaveBuffStackNum+Data, Gameplay.Beyond',
          checkTarget: targetFixture('Owner'),
          buffId: { buffId: 'buff_chr_0016_laevat_energy' },
          key: 'count',
        },
        'fixture.simpleBuffStackRead',
        {},
      ),
    ).toEqual({
      family: 'buffQuery',
      action: {
        kind: 'buffStackRead',
        sourceType: 'SaveBuffStackNum',
        target: expect.objectContaining({ targetSource: 'Owner' }),
        checkType: 'Id',
        buffIds: ['buff_chr_0016_laevat_energy'],
        tagQueryType: 'hasAny',
        buffTagIds: [],
        countType: 'BuffCount',
        limitSkillCastId: false,
        outputKey: 'count',
      },
    });
  });

  it('SaveBuffLifeTime 严格保留当前 Buff 剩余时长查询', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.SaveBuffLifeTime+Data, Gameplay.Beyond',
          buffOwner: targetFixture('Owner'),
          buffSettings: {
            checkType: 'Environment',
            buffIdList: [],
            tagQuery: { queryType: 'HasAny', tags: [] },
          },
          key: 'duration_dynamic',
        },
        'fixture.buffLifeTimeRead',
        {},
      ),
    ).toMatchObject({
      family: 'buffLifeTimeRead',
      action: {
        owner: { targetSource: 'Owner' },
        settings: { checkType: 'Environment', buffIds: [], tagQuery: { tagIds: [] } },
        outputKey: 'duration_dynamic',
      },
    });
  });

  it('SetBuffDurationAction 严格保留当前 Buff 时长运算', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.SetBuffDurationAction+Data, Gameplay.Beyond',
          targetSettings: targetFixture('Owner'),
          buffSettings: {
            checkType: 'Environment',
            buffIdList: [],
            tagQuery: { queryType: 'HasAny', tags: [] },
          },
          operationType: 'Assign',
          value: scalarFixture(0, 'duration_dynamic'),
          isFinishedEarly: false,
        },
        'fixture.buffDurationMutation',
        { duration_dynamic: [0, 0] },
      ),
    ).toMatchObject({
      family: 'buffDurationMutation',
      action: {
        target: { targetSource: 'Owner' },
        operation: 'Assign',
        value: { blackboardKey: 'duration_dynamic' },
        isFinishedEarly: false,
      },
    });
  });

  it('严格保留 PlaySoundAction 的表现身份和音频时序字段', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.PlaySoundAction+PlaySoundActionData, Gameplay.Beyond',
          _soundEvent: 'au_int_cure_one',
          _stopOnEnd: false,
          _stopFadeDurationMs: 100,
          _canInterruptTimeMs: 0,
          _intrptFadeDurationMs: 100,
          _jumpToWhenPlayMs: 0,
          _useTempEmitter: false,
          targetSettings: targetFixture('Owner'),
          mountPoint: 'None',
          followMountPoint: false,
          useWeaponMountPoint: false,
          weaponIndex: 0,
          weaponMountPoint: 'Root',
          useTimeDilationPauseAndSeek: false,
          timeDilationPauseThreshold: 0.7,
          timeDilationSeekThreshold: 0.4,
          timeDilationFadeOutDurationMs: 500,
          timeDilationFadeInDurationMs: 100,
        },
        'fixture.playSound',
        {},
      ),
    ).toMatchObject({
      family: 'presentation',
      action: {
        kind: 'playSound',
        soundEvent: 'au_int_cure_one',
        target: { targetSource: 'Owner' },
        timeDilationPauseThreshold: 0.7,
      },
    });
  });

  it('严格保留处决目标技力基值的来源、目标和倍率', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.GainBreakingAttackAtb+Data, Gameplay.Beyond',
          source: targetFixture('Source'),
          target: targetFixture('Target'),
          factor: scalarFixture(1),
        },
        'fixture.gainBreakingAttackAtb',
        {},
      ),
    ).toMatchObject({
      family: 'finisherSpGain',
      action: {
        kind: 'finisherSpGain',
        source: { targetSource: 'Source' },
        target: { targetSource: 'Target' },
        factor: { value: 1, blackboardKey: null },
      },
    });
  });

  it('LockCameraAimAction 完整解析镜头读取键后仍只进入表现 IR', () => {
    expect(
      parseKnownNativeActionLeafSource(lockCameraAimFixture(), 'fixture.lockCameraAim', {
        camera_min: [-40, -40],
      }),
    ).toMatchObject({
      family: 'presentation',
      action: { kind: 'lockCameraAim', readBlackboardKeys: ['camera_min'] },
    });
  });

  it('ImmuneTextAction 严格解析文字挂点后只进入表现 IR', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.ImmuneTextAction+Data, Gameplay.Beyond',
          targetSettings: targetFixture('Owner'),
          mountPoint: 'VBHit',
          offset: { x: 0, y: 0 },
          textId: 'ui_bat_immune_damage',
          forceMainBody: false,
        },
        'fixture.immuneText',
        {},
      ),
    ).toEqual({ family: 'presentation', action: { kind: 'immuneText' } });
  });

  it('保留有明确目标和枚举值的原生 SkillType 改写', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.ChangeSkillType+Data, Gameplay.Beyond',
          target: targetFixture('Owner'),
          skillId: {
            useBlackboardKey: false,
            value: 'chr_0030_zhuangfy_ultimate_skill_end',
            blackboardKey: '',
          },
          skillType: 'AttachSkill',
        },
        'fixture.changeSkillType',
        {},
      ),
    ).toEqual({
      family: 'presentation',
      action: {
        kind: 'skillTypeMutation',
        target: expect.objectContaining({ targetSource: 'Owner' }),
        skillId: 'chr_0030_zhuangfy_ultimate_skill_end',
        nativeSkillType: 'attachSkill',
      },
    });

    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.ChangeSkillType+Data, Gameplay.Beyond',
          target: targetFixture('Owner'),
          skillId: {
            useBlackboardKey: false,
            value: 'some_other_skill',
            blackboardKey: '',
          },
          skillType: 'AttachSkill',
        },
        'fixture.changeSkillType',
        {},
      ),
    ).toEqual({
      family: 'presentation',
      action: {
        kind: 'skillTypeMutation',
        target: expect.objectContaining({ targetSource: 'Owner' }),
        skillId: 'some_other_skill',
        nativeSkillType: 'attachSkill',
      },
    });
  });

  it('NotifyCharPassiveUIAction 保留被动 UI 的目标和值', () => {
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.NotifyCharPassiveUIAction+Data, Gameplay.Beyond',
          target: targetFixture('Owner'),
          value: scalarFixture(0, 'swordsNum'),
        },
        'fixture.passiveUi',
        { swordsNum: [0, 3] },
      ),
    ).toEqual({
      family: 'presentation',
      action: {
        kind: 'passiveUiValue',
        target: expect.objectContaining({ targetSource: 'Owner' }),
        value: { value: 0, blackboardKey: 'swordsNum', levelValues: [0, 3] },
        readBlackboardKeys: ['swordsNum'],
      },
    });
  });
});

function sequence(actionData: unknown[]): Record<string, unknown> {
  return {
    actionData,
    onlyExecuteWhenSourceIsMainChar: false,
    onlyExecuteWhenSourceIsGuard: false,
  };
}

function lockCameraAimFixture(): Record<string, unknown> {
  const vector = { x: 0, y: 1, z: 0 };
  return {
    ...META,
    $type: 'Beyond.Gameplay.Core.LockCameraAimAction+LockCameraAimActionData, Gameplay.Beyond',
    ccsPriority: 20,
    overrideLowerParamsToDefault: false,
    angleThreshold: 180,
    forceFollowMainChar: true,
    blendInStyle: 'Linear',
    blendInCustomCurve: [],
    blendInTime: 0.2,
    blendOutStyle: 'EaseInOut',
    blendOutCustomCurve: [],
    blendOutTime: 1,
    horizontalBaseAngleMin: -40,
    horizontalBaseAngleMinBB: scalarFixture(-1000, 'camera_min'),
    horizontalBaseAngleMax: -40,
    horizontalBaseAngleMaxBB: scalarFixture(-1000),
    verticalRelativeToTarget: false,
    verticalBaseValue: 0.35,
    verticalBaseValueBB: scalarFixture(-1000),
    verticalBaseValueMin: 0.3,
    verticalBaseValueMinBB: scalarFixture(-1000),
    verticalBaseValueMax: 0.5,
    verticalBaseValueMaxBB: scalarFixture(-1000),
    dampingTime: 1,
    horizontalSpeedFactor: 0.05,
    verticalSpeedFactor: 0.05,
    horizontalTweenSpeed: 4,
    verticalTweenSpeed: 1,
    allowAimZones: false,
    useExitParam: true,
    exitParamOnlyOnComplete: false,
    exitParam: {
      applyHorizontalAngle: false,
      horizontalAngleRelativeToCharacter: false,
      horizontalAngle: 0,
      applyVerticalValue: true,
      verticalValue: 0.6,
      applyZoomScale: true,
      zoomScale: 0.7,
    },
    disablePlayerInputOnBlendIn: false,
    disablePlayerInputOnBlendOut: false,
    disablePlayerInputInState: false,
    cancelOnDrag: false,
    cancelOnBeHit: false,
    cancelOnMove: false,
    overrideTarget1: true,
    useMainCharYForTarget1: false,
    targetSettings: targetFixture('Source'),
    mountPoint1: 'None',
    overrideLookAtOffset: true,
    lookAtOffset: vector,
    overrideTarget2: true,
    useMainCharYForTarget2: false,
    targetSettings2: targetFixture('Target'),
    mountPoint2: 'None',
    overrideLookAt2Offset: true,
    lookAt2Offset: vector,
    lookAt2OffsetWhenNoOverride: vector,
    targetAlpha: 0.618,
  };
}

describe('新版施法身份与移动轴动作', () => {
  it('完整保留 Typhoea 弓术选择配置，固定木桩简化留给投影层', () => {
    const source = {
      ...META,
      $type: 'Beyond.Gameplay.Core.TyphoeaArcheryTargetSelect+Data, Gameplay.Beyond',
      markBuff: {
        buffId: 'buff_chr_0034_typhoea_normal_skill_aimmedenemy',
        assignBlackboard: false,
        assignItems: [],
        readIdFromBlackboard: false,
        buffIdKey: '',
      },
      targetNum: { useBlackboardKey: false, value: 2, blackboardKey: '' },
      fullScreen: false,
      lockRegionHalfHeight: { useBlackboardKey: false, value: 0.5, blackboardKey: '' },
      lockRegionRatio: { useBlackboardKey: false, value: 1.777, blackboardKey: '' },
      maxLockDistanceFromCamera: { useBlackboardKey: false, value: 25, blackboardKey: '' },
      smartPrioritySelect: {
        smartTargetSelectStrategy: 'SelectByTag',
        smartTargetBuffIds: [],
        smartTargetTagQuery: { queryType: 'HasAny', tags: [{ tagId: -1411846745 }] },
        smartTargetBuffFindSettings: {
          checkType: 'Id',
          buffIdList: [],
          tagQuery: { queryType: 'HasAny', tags: [] },
        },
      },
    };
    const parsed = parseKnownNativeActionLeafSource(source, 'fixture.typhoeaSelect', {});
    expect(parsed.family).toBe('typhoeaArcherySelection');
    if (parsed.family !== 'typhoeaArcherySelection') throw new Error('unexpected family');
    expect(parsed.action.markBuffId).toBe('buff_chr_0034_typhoea_normal_skill_aimmedenemy');
    expect(parsed.action.targetCount.value).toBe(2);
    expect(parsed.action.smartPrioritySelection.tagQuery.tagIds).toEqual([-1411846745]);
    expect(() =>
      parseKnownNativeActionLeafSource({ ...source, extra: true }, 'fixture.typhoeaSelect', {}),
    ).toThrow('unexpected fields');
  });

  it('严格读取 SaveMoveAxisAngle 的输出键', () => {
    const source = {
      ...META,
      $type: 'Beyond.Gameplay.Core.SaveMoveAxisAngle+Data, Gameplay.Beyond',
      key: 'move_axis_angle',
    };
    expect(parseKnownNativeActionLeafSource(source, 'fixture.moveAxis', {})).toEqual({
      family: 'presentationCalculation',
      action: { kind: 'saveMoveAxisAngle', outputKey: 'move_axis_angle' },
    });
    expect(() =>
      parseKnownNativeActionLeafSource({ ...source, extra: true }, 'fixture.moveAxis', {}),
    ).toThrow('unexpected fields');
  });

  it('严格读取普通攻击施法身份继承动作', () => {
    const source = {
      ...META,
      $type: 'Beyond.Gameplay.Core.MarkInheritSkillCastIdOnNormalAttack+Data, Gameplay.Beyond',
    };
    expect(parseKnownNativeActionLeafSource(source, 'fixture.inheritCast', {})).toEqual({
      family: 'skillCastInheritance',
      action: { kind: 'inheritSkillCastInfoForBasicAttack' },
    });
    expect(() =>
      parseKnownNativeActionLeafSource({ ...source, guessed: false }, 'fixture.inheritCast', {}),
    ).toThrow('unexpected fields');
  });
});
