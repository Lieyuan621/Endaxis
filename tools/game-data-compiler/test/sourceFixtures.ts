/** 构造装备解析所需的最小表行，不依赖游戏快照或无关资源。 */
export function equipmentFixture() {
  const equipmentId = 'item_equip_t0_parts_tundra01_body_01';
  const attributes = [
    [3, 8, 5],
    [39, 15, 5],
    [40, 10, 5],
    [1, 46.3273721859878, 7],
  ] as const;
  const display = (attrIndex: number) => ({
    attrIndex,
    attrType: attributes[attrIndex]![0],
    attrValue: attributes[attrIndex]![1],
    compositeAttr: '',
    enhanceGuaranteeTimesRuleId: '',
    enhancedAttrIndex: attrIndex,
    enhancedAttrValues: [],
    modifierType: attributes[attrIndex]![2],
  });
  return {
    equipmentId,
    equipTableEntry: {
      itemId: equipmentId,
      domainId: 'domain_1',
      suitID: '',
      minWearLv: 10,
      partType: 0,
      displayBaseAttrModifier: display(0),
      displayAttrModifiers: [1, 2, 3].map(display),
      equipAttrModifiers: attributes.map(([attrType, value, modifierType], attrIndex) => ({
        attrIndex,
        attrType,
        attrValues: [value, value, value, value],
        modifierType,
        modifyAttributeType: 0,
      })),
    },
    itemTableEntry: {
      id: equipmentId,
      iconId: equipmentId,
      iconCompositeId: '',
      rarity: 1,
      type: 6,
      backpackCanDiscard: true,
      decoDesc: {},
      desc: {},
      name: {},
      noObtainWayHint: {},
      maxBackpackStackCount: 1,
      maxStackCount: 1,
      modelKey: '',
      noObtainWayConditionId: [],
      noObtainWayId: [],
      notObtainShow: true,
      notObtainShowTimeId: '',
      obtainWayIds: [],
      outcomeItemIds: [],
      showAllDepotCount: false,
      showingType: 9,
      sortId1: -50,
      sortId2: 1,
      valuableDepotRedDot: false,
      valuableTabType: 3,
    },
  };
}

export function buffFixture(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    abilityEventAction: [],
    addingCooldown: scalarFixture(0),
    applyTags: [{ tagId: -1757502026 }],
    attributeModifier: { isConvertedAttribute: false, attributeModifiers: [] },
    blackboard: [],
    buffEventAction: [],
    damageModifier: [],
    dispelConfig: { canBeDispelled: false, dispelledLevel: 'Default' },
    duration: scalarFixture(0),
    finishOnRepatriate: false,
    globalModifier: [],
    hasAddingCooldown: false,
    hasIcon: false,
    healModifier: [],
    iconConfig: iconFixture(),
    id: 'buff_fixture',
    igniteEventAction: [],
    ignoreCooldownWhenAdding: false,
    ignoreTagImmune: false,
    lifeType: 'Infinity',
    maxTriggerCnt: scalarFixture(1),
    onlyUseSelfTimeDilation: false,
    poiseModifier: [],
    shieldConfigs: [],
    stackingSettings: stackingFixture(),
    tagsAfterTriggerExtendBuffAction: [],
    timelineActions: [],
    triggerInterval: scalarFixture(0),
    useTimeDilationDt: false,
    waitFirstTriggerInterval: true,
    ...overrides,
  };
}

export function iconFixture(): Record<string, unknown> {
  return {
    _spritePath: 'icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: false,
    useWeakProgressInNormalSkillButton: false,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: false,
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    _orderPriorityConfig: {
      useDirectoryValue: false,
      priorityValue: 0,
      priorityEnum: 'CommonCharBuff',
    },
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
  };
}

export function stackingFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    identifierType: 'Id',
    stackingType: 'Refresh',
    stackingKey: '',
    usePriorityKey: false,
    priorityKey: '',
    negatePriority: false,
    priority: 0,
    useMaxStackCntKey: false,
    maxStackCntKey: '',
    maxStackCnt: 0,
    isNeedStackEffect: false,
    stackEffects: [],
    ...overrides,
  };
}

export function targetFixture(
  targetSource: string,
  selectorData: Record<string, unknown> = {
    validatorData: [],
    postProcessorData: [],
  },
  targetGroupKey = '',
): Record<string, unknown> {
  return {
    targetSource,
    targetGroupKey,
    selectorOwner: 'ActionOwner',
    ownerContextKey: '',
    centerType: 'ActionSource',
    centerContextKey: '',
    centerToGround: false,
    selectorData,
    enableAdvancedDirection: false,
    advancedDirection: {},
    selectorDirection: 'SourceForward',
    target: 'ActionSource',
    targetContextKey: '',
  };
}

export function scalarFixture(value: number, blackboardKey = ''): Record<string, unknown> {
  return {
    value,
    useBlackboardKey: blackboardKey.length > 0,
    blackboardKey,
  };
}

export function abilityEntityFixture(): Record<string, unknown> {
  return {
    gameId: 'abilityentity_fixture',
    factionNativeValue: 2,
    bornTagIds: [-1, 2],
    lifeTypeNativeValue: 0,
    durationSeconds: 45,
    durationBlackboard: {
      useBlackboardKey: true,
      value: 0,
      blackboardKey: 'EntityBB_duration',
    },
    maxDurationForServerSeconds: 60,
    maxStackingCount: 5,
    maxStackingCountBlackboard: {
      useBlackboardKey: true,
      value: 18,
      blackboardKey: 'EntityBB_limit',
    },
    delayToRecycleSeconds: 0,
    delayRecyclePerformSeconds: 0,
    sendDieEvent: false,
    enableBornFadeIn: false,
    fadeInSeconds: 1,
    componentCount: 4,
    managedReferenceCount: 6,
    rootRid: 8194869126427837000,
  };
}

export function activeSkillFixture(
  skillId = 'active_fixture',
  castType = 'Active',
): Record<string, unknown> {
  return {
    actionGroupData: { timelineActions: [], passiveEventActions: [] },
    aiExclusiveFrame: 0,
    attackRangeType: 'Default',
    blackboard: [{ key: 'attack_scale', valueDouble: 1, valueStr: '', isDynamic: false }],
    buffs: [],
    canCastInAir: false,
    canDummyCast: false,
    canMove: false,
    cardAttributeModifier: { attributeModifiers: [], isConvertedAttribute: false },
    castData: {},
    castType,
    characterReturnToIdle: false,
    comboSkillUIBigSpriteName: '',
    comboSkillUISpriteName: '',
    dontInterruptCombo: false,
    dummyPositionOffset: { x: 0, y: 0, z: 0 },
    durationFrame: 30,
    exclusiveFrame: 30,
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
    selectStrategy: 'SelectObject',
    showNotRecommendState: false,
    skillHighlightCondition: {},
    skillId,
    skillName: '',
    skillSpecification: 'Default',
    skillTags: { predefinedTag: [] },
    smartTargetBuffFindSettings: {},
    smartTargetBuffIds: [],
    smartTargetSelectStrategy: 'SelectComboSkillTarget',
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

/** 为公共 SkillData/领域连接测试提供同一份严格目标组动作，避免各测试复制原生字段形状。 */
export function activeSkillWithOwnerSpawnedAbilityEntityQueryFixture(
  skillId = 'active_fixture',
): Record<string, unknown> {
  const skill = activeSkillFixture(skillId);
  skill.actionGroupData = {
    timelineActions: [
      {
        _startFrame: 10,
        _endFrame: 20,
        _sequenceActionData: {
          actionData: [ownerSpawnedAbilityEntityFindTargetActionFixture()],
          onlyExecuteWhenSourceIsMainChar: false,
          onlyExecuteWhenSourceIsGuard: false,
        },
        forceSyncAnimData: {
          forceSync: false,
          montageName: '',
          targetFrame: 0,
          playbackSpeed: 0,
        },
      },
    ],
    passiveEventActions: [],
  };
  return skill;
}

export function ownerSpawnedAbilityEntityFindTargetActionFixture(): Record<string, unknown> {
  return {
    $type: 'Example.FindTargetAction+Data, Example',
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 7,
    targetGroupKey: 'entities',
    center: 'ActionSource',
    centerContextKey: '',
    useCenterEntityMountPoint: false,
    centerMountPoint: 'None',
    centerToGround: false,
    selectorOwner: 'ActionOwner',
    selectorOwnerContextKey: '',
    selectorData: {
      finderData: {
        $type: 'Example.Selector+OwnerSpawnedEntityFinder+Data, Example',
        spawnedObjectType: 'AbilityEntity',
      },
      validatorData: [
        {
          $type: 'Example.Selector+TagValidator+Data, Example',
          query: { queryType: 'HasAny', tags: [{ tagId: 321 }] },
        },
      ],
      postProcessorData: [],
    },
    selectorDirection: 'SourceForward',
    target: 'ActionSource',
    contextKey: '',
    useAdvancedDirectionSetting: false,
    advancedSelectorDirection: {},
  };
}
