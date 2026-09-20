/** 由危机合约原生词条、GlobalBuff 与 BuffData 闭包生成；不要手工编辑。 */
import type {
  ActionSequenceDefinition,
  OperatorBuffDefinitions,
  ContingencyContractTagDefinition,
} from '../../../../packages/game-data-contract/src/index.ts';

export const contingencyContractBuffDefinitions = Object.freeze({
  buff_cc_chr_combo_special_cc0: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      cd_scale: 0.4,
      dmg_scale: -0.6,
    },
    attributeModifiers: [
      {
        attribute: 'ComboSkillCooldownScalar',
        slot: 'finalMultiplier',
        value: {
          blackboardKey: 'cd_scale',
        },
      },
    ],
    damageModifiers: [
      {
        enabledSide: 'attacker',
        condition: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAll',
          tags: ['normalSkill'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'attacker',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_chr_normal_skill_cryst_inflict: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      cd: 3,
      d_times: 0,
      times: 1,
    },
    attributeModifiers: [],
    abilityEventResponses: [
      {
        event: 'afterSkillApplyCost',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventSkillTypeIn',
                  skillTypes: ['battleSkill'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'not',
                        condition: {
                          kind: 'timedMarkerPresent',
                          target: 'buffOwner',
                          markerId: 'buff_cc_chr_normal_skill_cryst_inflict',
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'd_times',
                            operation: 'add',
                            left: {
                              kind: 'blackboard',
                              key: 'times',
                            },
                            right: {
                              kind: 'constant',
                              value: -1,
                            },
                          },
                        },
                        {
                          kind: 'conditional',
                          parameters: {
                            condition: {
                              kind: 'buffIdStackCompare',
                              target: 'controlledOperator',
                              buffIds: ['buff_cc_chr_normal_skill_cryst_inflict_stack'],
                              operator: 'greaterOrEqual',
                              value: {
                                kind: 'blackboard',
                                key: 'd_times',
                              },
                            },
                            alwaysNext: true,
                          },
                          whenTrue: {
                            steps: [
                              {
                                kind: 'createTimedMarker',
                                parameters: {
                                  target: 'buffOwner',
                                  markerId: 'buff_cc_chr_normal_skill_cryst_inflict',
                                  durationSeconds: {
                                    kind: 'blackboard',
                                    key: 'cd',
                                  },
                                  autoFinishByAction: false,
                                },
                              },
                              {
                                kind: 'finishBuffsById',
                                parameters: {
                                  target: 'caster',
                                  buffIds: ['buff_cc_chr_normal_skill_cryst_inflict_stack'],
                                  reason: 'other',
                                },
                              },
                            ],
                          },
                          whenFalse: {
                            steps: [
                              {
                                kind: 'applyBuff',
                                parameters: {
                                  buffId: 'buff_cc_chr_normal_skill_cryst_inflict_stack',
                                  target: 'controlledOperator',
                                  inheritSourceSkillCastInfo: true,
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
            },
          ],
        },
      },
    ],
  },
  buff_cc_chr_normal_skill_cryst_inflict_stack: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {},
    attributeModifiers: [],
  },
  buff_cc_chr_combo_skill_cryst_inflict: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      cd: 3,
      d_times: 0,
      times: 1,
    },
    attributeModifiers: [],
    abilityEventResponses: [
      {
        event: 'afterSkillApplyCost',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventSkillTypeIn',
                  skillTypes: ['comboSkill'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'not',
                        condition: {
                          kind: 'timedMarkerPresent',
                          target: 'buffOwner',
                          markerId: 'buff_cc_chr_combo_skill_cryst_inflict',
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'd_times',
                            operation: 'add',
                            left: {
                              kind: 'blackboard',
                              key: 'times',
                            },
                            right: {
                              kind: 'constant',
                              value: -1,
                            },
                          },
                        },
                        {
                          kind: 'conditional',
                          parameters: {
                            condition: {
                              kind: 'buffIdStackCompare',
                              target: 'controlledOperator',
                              buffIds: ['buff_cc_chr_combo_skill_cryst_inflict_stack'],
                              operator: 'greaterOrEqual',
                              value: {
                                kind: 'blackboard',
                                key: 'd_times',
                              },
                            },
                            alwaysNext: true,
                          },
                          whenTrue: {
                            steps: [
                              {
                                kind: 'createTimedMarker',
                                parameters: {
                                  target: 'buffOwner',
                                  markerId: 'buff_cc_chr_combo_skill_cryst_inflict',
                                  durationSeconds: {
                                    kind: 'blackboard',
                                    key: 'cd',
                                  },
                                  autoFinishByAction: false,
                                },
                              },
                              {
                                kind: 'finishBuffsById',
                                parameters: {
                                  target: 'caster',
                                  buffIds: ['buff_cc_chr_combo_skill_cryst_inflict_stack'],
                                  reason: 'other',
                                },
                              },
                            ],
                          },
                          whenFalse: {
                            steps: [
                              {
                                kind: 'applyBuff',
                                parameters: {
                                  buffId: 'buff_cc_chr_combo_skill_cryst_inflict_stack',
                                  target: 'controlledOperator',
                                  inheritSourceSkillCastInfo: true,
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
            },
          ],
        },
      },
    ],
  },
  buff_cc_chr_combo_skill_cryst_inflict_stack: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {},
    attributeModifiers: [],
  },
  buff_cc_chr_ult_dmg_down_gradual: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {},
    attributeModifiers: [],
    abilityEventResponses: [
      {
        event: 'beforeCastSkill',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'currentSkillTypeIn',
                  target: 'buffOwner',
                  skillTypes: ['ultimate'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_chr_ult_dmg_down_gradual_stack',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      asChildBuff: true,
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
  buff_cc_chr_ult_dmg_down_gradual_instance: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 2,
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: 0,
      dmg_scale_per_layer: -0.5,
      layer: 0,
    },
    attributeModifiers: [],
    damageModifiers: [
      {
        enabledSide: 'attacker',
        conditionProgram: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventDamageTagsMatch',
                  match: 'hasAll',
                  tags: ['ultimateSkill'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'readBuffStackCount',
                    parameters: {
                      target: 'buffOwner',
                      outputKey: 'layer',
                      query: {
                        kind: 'id',
                        buffIds: ['buff_cc_chr_ult_dmg_down_gradual_stack'],
                      },
                    },
                  },
                  {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'layer',
                      operation: 'add',
                      value: {
                        kind: 'constant',
                        value: -1,
                      },
                    },
                  },
                  {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'dmg_scale',
                      operation: 'multiply',
                      left: {
                        kind: 'blackboard',
                        key: 'dmg_scale_per_layer',
                      },
                      right: {
                        kind: 'blackboard',
                        key: 'layer',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'attacker',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_chr_ult_dmg_down_gradual_stack: {
    stackingType: 'stack',
    priority: 0,
    maxStackCount: 3,
    applyTags: [],
    extendTags: [],
    blackboard: {},
    attributeModifiers: [],
  },
  buff_cc_chr_normal_attack_dmg_down: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.6,
    },
    attributeModifiers: [],
    damageModifiers: [
      {
        enabledSide: 'attacker',
        condition: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAll',
          tags: ['normalAttack'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'attacker',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_chr_cryst_dmg_down: {
    stackingType: 'refresh',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: {
      blackboardKey: 'duration',
    },
    presentation: {
      visible: true,
      iconId: 'icon_battle_cryst_dmg_down',
      iconPath: '/icons/icon_battle_cryst_dmg_down.webp',
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
      showWarningBackground: true,
      playStrongInAnimation: false,
      hasCharHpBarVfxType: false,
      charHpBarVfxType: 'Fire',
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderPriority: {
        useDirectoryValue: false,
        value: 0,
        category: 'AttentionBuff',
      },
    },
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.1,
      duration: 10,
    },
    attributeModifiers: [],
    damageModifiers: [
      {
        enabledSide: 'attacker',
        condition: {
          kind: 'eventDamageTypesMatch',
          damageTypes: ['cryo'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'attacker',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_chr_dmg_down_after_inflict: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.1,
      duration: 10,
    },
    attributeModifiers: [],
    abilityEventResponses: [
      {
        event: 'outputBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/NoGuard'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_chr_phy_dmg_down',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        dmg_scale: 'dmg_scale',
                        duration: 'duration',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'outputBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_chr_fire_dmg_down',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        dmg_scale: 'dmg_scale',
                        duration: 'duration',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'outputBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_chr_pulse_dmg_down',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        dmg_scale: 'dmg_scale',
                        duration: 'duration',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'outputBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_chr_cryst_dmg_down',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        dmg_scale: 'dmg_scale',
                        duration: 'duration',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'outputBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_chr_natural_dmg_down',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        dmg_scale: 'dmg_scale',
                        duration: 'duration',
                      },
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
  buff_cc_chr_fire_dmg_down: {
    stackingType: 'refresh',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: {
      blackboardKey: 'duration',
    },
    presentation: {
      visible: true,
      iconId: 'icon_battle_fire_dmg_down',
      iconPath: '/icons/icon_battle_fire_dmg_down.webp',
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
      showWarningBackground: true,
      playStrongInAnimation: false,
      hasCharHpBarVfxType: false,
      charHpBarVfxType: 'Fire',
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderPriority: {
        useDirectoryValue: false,
        value: 0,
        category: 'AttentionBuff',
      },
    },
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.1,
      duration: 10,
    },
    attributeModifiers: [],
    damageModifiers: [
      {
        enabledSide: 'attacker',
        condition: {
          kind: 'eventDamageTypesMatch',
          damageTypes: ['heat'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'attacker',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_chr_natural_dmg_down: {
    stackingType: 'refresh',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: {
      blackboardKey: 'duration',
    },
    presentation: {
      visible: true,
      iconId: 'icon_battle_natural_dmg_down',
      iconPath: '/icons/icon_battle_natural_dmg_down.webp',
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
      showWarningBackground: true,
      playStrongInAnimation: false,
      hasCharHpBarVfxType: false,
      charHpBarVfxType: 'Fire',
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderPriority: {
        useDirectoryValue: false,
        value: 0,
        category: 'AttentionBuff',
      },
    },
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.1,
      duration: 10,
    },
    attributeModifiers: [],
    damageModifiers: [
      {
        enabledSide: 'attacker',
        condition: {
          kind: 'eventDamageTypesMatch',
          damageTypes: ['nature'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'attacker',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_chr_phy_dmg_down: {
    stackingType: 'refresh',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: {
      blackboardKey: 'duration',
    },
    presentation: {
      visible: true,
      iconId: 'icon_battle_physical_dmg_down',
      iconPath: '/icons/icon_battle_physical_dmg_down.webp',
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
      showWarningBackground: true,
      playStrongInAnimation: false,
      hasCharHpBarVfxType: false,
      charHpBarVfxType: 'Fire',
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderPriority: {
        useDirectoryValue: false,
        value: 0,
        category: 'AttentionBuff',
      },
    },
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.1,
      duration: 10,
    },
    attributeModifiers: [],
    damageModifiers: [
      {
        enabledSide: 'attacker',
        condition: {
          kind: 'eventDamageTypesMatch',
          damageTypes: ['physical'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'attacker',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_chr_pulse_dmg_down: {
    stackingType: 'refresh',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: {
      blackboardKey: 'duration',
    },
    presentation: {
      visible: true,
      iconId: 'icon_battle_pulse_dmg_down',
      iconPath: '/icons/icon_battle_pulse_dmg_down.webp',
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
      showWarningBackground: true,
      playStrongInAnimation: false,
      hasCharHpBarVfxType: false,
      charHpBarVfxType: 'Fire',
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderPriority: {
        useDirectoryValue: false,
        value: 0,
        category: 'AttentionBuff',
      },
    },
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.1,
      duration: 10,
    },
    attributeModifiers: [],
    damageModifiers: [
      {
        enabledSide: 'attacker',
        condition: {
          kind: 'eventDamageTypesMatch',
          damageTypes: ['electric'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'attacker',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_enemy_periodic_inflict_resist: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      duration: 5,
    },
    attributeModifiers: [],
    abilityEventResponses: [
      {
        event: 'afterTakeInfliction',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventInflictionElementIn',
                  elements: ['heat'],
                },
                alwaysNext: true,
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_periodic_inflict_resist_fire',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        duration: 'duration',
                      },
                    },
                  },
                ],
              },
            },
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventInflictionElementIn',
                  elements: ['electric'],
                },
                alwaysNext: true,
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_periodic_inflict_resist_pulse',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        duration: 'duration',
                      },
                    },
                  },
                ],
              },
            },
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventInflictionElementIn',
                  elements: ['cryo'],
                },
                alwaysNext: true,
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_periodic_inflict_resist_cryst',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        duration: 'duration',
                      },
                    },
                  },
                ],
              },
            },
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventInflictionElementIn',
                  elements: ['nature'],
                },
                alwaysNext: true,
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_periodic_inflict_resist_natural',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        duration: 'duration',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'addedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/NoGuard'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_periodic_inflict_resist_phy',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        duration: 'duration',
                      },
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
  buff_cc_enemy_periodic_inflict_resist_cryst: {
    stackingType: 'unique',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: {
      blackboardKey: 'duration',
    },
    presentation: {
      visible: true,
      iconId: 'icon_battle_eny_resist_inflict_cryst',
      iconPath: '/icons/icon_battle_eny_resist_inflict_cryst.webp',
      showInHeadBarCommon: true,
      showInHeadBarAttached: false,
      showInSquadIcon: false,
      onlyShowForMainCharacter: false,
      blinkInMainCharHpBar: false,
      showProgressInHpBar: false,
      showProgressInNormalSkillButton: false,
      useWeakProgressInNormalSkillButton: false,
      showProgressInUltimateSkillButton: false,
      forceRaiseIconEvent: false,
      showWarningBackground: true,
      playStrongInAnimation: true,
      hasCharHpBarVfxType: false,
      charHpBarVfxType: 'Fire',
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderPriority: {
        useDirectoryValue: false,
        value: 0,
        category: 'AttentionBuff',
      },
    },
    applyTags: ['Immune/ImmuneSpellInflict/ImmuneCrystInflict'],
    extendTags: [],
    blackboard: {
      duration: 5,
    },
    attributeModifiers: [],
  },
  buff_cc_enemy_periodic_inflict_resist_fire: {
    stackingType: 'unique',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: {
      blackboardKey: 'duration',
    },
    presentation: {
      visible: true,
      iconId: 'icon_battle_eny_resist_inflict_fire',
      iconPath: '/icons/icon_battle_eny_resist_inflict_fire.webp',
      showInHeadBarCommon: true,
      showInHeadBarAttached: false,
      showInSquadIcon: false,
      onlyShowForMainCharacter: false,
      blinkInMainCharHpBar: false,
      showProgressInHpBar: false,
      showProgressInNormalSkillButton: false,
      useWeakProgressInNormalSkillButton: false,
      showProgressInUltimateSkillButton: false,
      forceRaiseIconEvent: false,
      showWarningBackground: true,
      playStrongInAnimation: true,
      hasCharHpBarVfxType: false,
      charHpBarVfxType: 'Fire',
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderPriority: {
        useDirectoryValue: false,
        value: 0,
        category: 'AttentionBuff',
      },
    },
    applyTags: ['Immune/ImmuneSpellInflict/ImmuneFireInflict'],
    extendTags: [],
    blackboard: {
      duration: 5,
    },
    attributeModifiers: [],
  },
  buff_cc_enemy_periodic_inflict_resist_natural: {
    stackingType: 'unique',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: {
      blackboardKey: 'duration',
    },
    presentation: {
      visible: true,
      iconId: 'icon_battle_eny_resist_inflict_natural',
      iconPath: '/icons/icon_battle_eny_resist_inflict_natural.webp',
      showInHeadBarCommon: true,
      showInHeadBarAttached: false,
      showInSquadIcon: false,
      onlyShowForMainCharacter: false,
      blinkInMainCharHpBar: false,
      showProgressInHpBar: false,
      showProgressInNormalSkillButton: false,
      useWeakProgressInNormalSkillButton: false,
      showProgressInUltimateSkillButton: false,
      forceRaiseIconEvent: false,
      showWarningBackground: true,
      playStrongInAnimation: true,
      hasCharHpBarVfxType: false,
      charHpBarVfxType: 'Fire',
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderPriority: {
        useDirectoryValue: false,
        value: 0,
        category: 'AttentionBuff',
      },
    },
    applyTags: ['Immune/ImmuneSpellInflict/ImmuneNaturalInflict'],
    extendTags: [],
    blackboard: {
      duration: 5,
    },
    attributeModifiers: [],
  },
  buff_cc_enemy_periodic_inflict_resist_phy: {
    stackingType: 'unique',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: {
      blackboardKey: 'duration',
    },
    presentation: {
      visible: true,
      iconId: 'icon_battle_eny_resist_inflict_phy',
      iconPath: '/icons/icon_battle_eny_resist_inflict_phy.webp',
      showInHeadBarCommon: true,
      showInHeadBarAttached: false,
      showInSquadIcon: false,
      onlyShowForMainCharacter: false,
      blinkInMainCharHpBar: false,
      showProgressInHpBar: false,
      showProgressInNormalSkillButton: false,
      useWeakProgressInNormalSkillButton: false,
      showProgressInUltimateSkillButton: false,
      forceRaiseIconEvent: false,
      showWarningBackground: true,
      playStrongInAnimation: true,
      hasCharHpBarVfxType: false,
      charHpBarVfxType: 'Fire',
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderPriority: {
        useDirectoryValue: false,
        value: 0,
        category: 'AttentionBuff',
      },
    },
    applyTags: ['Immune/ImmuneNoGuard'],
    extendTags: [],
    blackboard: {
      duration: 5,
    },
    attributeModifiers: [],
  },
  buff_cc_enemy_periodic_inflict_resist_pulse: {
    stackingType: 'unique',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: {
      blackboardKey: 'duration',
    },
    presentation: {
      visible: true,
      iconId: 'icon_battle_eny_resist_inflict_pulse',
      iconPath: '/icons/icon_battle_eny_resist_inflict_pulse.webp',
      showInHeadBarCommon: true,
      showInHeadBarAttached: false,
      showInSquadIcon: false,
      onlyShowForMainCharacter: false,
      blinkInMainCharHpBar: false,
      showProgressInHpBar: false,
      showProgressInNormalSkillButton: false,
      useWeakProgressInNormalSkillButton: false,
      showProgressInUltimateSkillButton: false,
      forceRaiseIconEvent: false,
      showWarningBackground: true,
      playStrongInAnimation: true,
      hasCharHpBarVfxType: false,
      charHpBarVfxType: 'Fire',
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderPriority: {
        useDirectoryValue: false,
        value: 0,
        category: 'AttentionBuff',
      },
    },
    applyTags: ['Immune/ImmuneSpellInflict/ImmunePulseInflict'],
    extendTags: [],
    blackboard: {
      duration: 5,
    },
    attributeModifiers: [],
  },
  buff_cc_enemy_heal_under_control: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      hp_ratio: 0.05,
      stack: 0,
    },
    attributeModifiers: [],
    abilityEventResponses: [
      {
        event: 'addedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'enemySuperArmorCompare',
                        operator: 'lessOrEqual',
                        value: {
                          kind: 'constant',
                          value: 20,
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_cc_enemy_heal_under_control_stack',
                            target: 'buffOwner',
                            source: 'buffOwner',
                            inheritSourceSkillCastInfo: true,
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
      },
      {
        event: 'addedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: [
                    'Skill/Character/Common/PhysicalStatus/AirborneStatus',
                    'Skill/Character/Common/PhysicalStatus/KnockdownStatus',
                  ],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'enemySuperArmorCompare',
                        operator: 'less',
                        value: {
                          kind: 'constant',
                          value: 30,
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_cc_enemy_heal_under_control_stack',
                            target: 'buffOwner',
                            source: 'buffOwner',
                            inheritSourceSkillCastInfo: true,
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
      },
      {
        event: 'addedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffIdMatch',
                  buffIds: ['buff_common_originum_frozen'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'enemySuperArmorCompare',
                        operator: 'lessOrEqual',
                        value: {
                          kind: 'constant',
                          value: 20,
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_cc_enemy_heal_under_control_stack',
                            target: 'buffOwner',
                            source: 'buffOwner',
                            inheritSourceSkillCastInfo: true,
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
      },
      {
        event: 'addedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffIdMatch',
                  buffIds: ['buff_chr_0027_tangtang_ultskill_debuff'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_heal_under_control_stack',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'finishedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'enemySuperArmorCompare',
                        operator: 'lessOrEqual',
                        value: {
                          kind: 'constant',
                          value: 20,
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'finishBuffsById',
                          parameters: {
                            target: 'buffOwner',
                            buffIds: ['buff_cc_enemy_heal_under_control_stack'],
                            reason: 'other',
                            count: {
                              kind: 'constant',
                              value: 1,
                            },
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
      },
      {
        event: 'finishedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: [
                    'Skill/Character/Common/PhysicalStatus/AirborneStatus',
                    'Skill/Character/Common/PhysicalStatus/KnockdownStatus',
                  ],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'enemySuperArmorCompare',
                        operator: 'less',
                        value: {
                          kind: 'constant',
                          value: 30,
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'finishBuffsById',
                          parameters: {
                            target: 'buffOwner',
                            buffIds: ['buff_cc_enemy_heal_under_control_stack'],
                            reason: 'other',
                            count: {
                              kind: 'constant',
                              value: 1,
                            },
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
      },
      {
        event: 'finishedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffIdMatch',
                  buffIds: ['buff_common_originum_frozen'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'enemySuperArmorCompare',
                        operator: 'lessOrEqual',
                        value: {
                          kind: 'constant',
                          value: 20,
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'finishBuffsById',
                          parameters: {
                            target: 'buffOwner',
                            buffIds: ['buff_cc_enemy_heal_under_control_stack'],
                            reason: 'other',
                            count: {
                              kind: 'constant',
                              value: 1,
                            },
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
      },
      {
        event: 'finishedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffIdMatch',
                  buffIds: ['buff_chr_0027_tangtang_ultskill_debuff'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'buffOwner',
                      buffIds: ['buff_cc_enemy_heal_under_control_stack'],
                      reason: 'other',
                      count: {
                        kind: 'constant',
                        value: 1,
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'beforeAddedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffIdMatch',
                  buffIds: ['buff_cc_enemy_heal_under_control_stack'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'buffIdStackCompare',
                        target: 'buffOwner',
                        buffIds: ['buff_cc_enemy_heal_under_control_stack'],
                        operator: 'equal',
                        value: {
                          kind: 'constant',
                          value: 0,
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_cc_enemy_heal_under_control_instance',
                            target: 'buffOwner',
                            source: 'buffOwner',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: {
                              hp_ratio: 'hp_ratio',
                            },
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
      },
      {
        event: 'finishedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffIdMatch',
                  buffIds: ['buff_cc_enemy_heal_under_control_stack'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'buffIdStackCompare',
                        target: 'buffOwner',
                        buffIds: ['buff_cc_enemy_heal_under_control_stack'],
                        operator: 'equal',
                        value: {
                          kind: 'constant',
                          value: 0,
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'finishBuffsById',
                          parameters: {
                            target: 'buffOwner',
                            buffIds: ['buff_cc_enemy_heal_under_control_instance'],
                            reason: 'other',
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
      },
    ],
  },
  buff_cc_enemy_heal_under_control_instance: {
    stackingType: 'unique',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      hp_ratio: 0.01,
    },
    attributeModifiers: [],
    lifecycleSequences: {
      enable: {
        steps: [
          {
            kind: 'conditional',
            parameters: {
              condition: {
                kind: 'buffIdStackCompare',
                target: 'buffOwner',
                buffIds: ['buff_cc_enemy_heal_under_control_timer'],
                operator: 'equal',
                value: {
                  kind: 'constant',
                  value: 0,
                },
              },
            },
            whenTrue: {
              steps: [
                {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_cc_enemy_heal_under_control_timer',
                    target: 'buffOwner',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: {
                      hp_ratio: 'hp_ratio',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  },
  buff_cc_enemy_heal_under_control_stack: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {},
    attributeModifiers: [],
  },
  buff_cc_enemy_heal_under_control_timer: {
    stackingType: 'unique',
    priority: 0,
    maxStackCount: 1,
    triggerIntervalSeconds: 1,
    waitFirstTriggerInterval: true,
    maxTriggerCount: -1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      hp_ratio: 0.01,
    },
    attributeModifiers: [],
    lifecycleSequences: {
      enable: {
        steps: [
          {
            kind: 'heal',
            parameters: {
              target: 'buffOwner',
              alwaysNext: true,
              tags: [],
              attribute: 'maxHealth',
              multiplier: {
                kind: 'blackboard',
                key: 'hp_ratio',
              },
              addition: {
                kind: 'constant',
                value: 0,
              },
            },
          },
        ],
      },
      trigger: {
        steps: [
          {
            kind: 'conditional',
            parameters: {
              condition: {
                kind: 'buffIdStackCompare',
                target: 'buffOwner',
                buffIds: ['buff_cc_enemy_heal_under_control_instance'],
                operator: 'greaterOrEqual',
                value: {
                  kind: 'constant',
                  value: 1,
                },
              },
              alwaysNext: true,
            },
            whenTrue: {
              steps: [
                {
                  kind: 'heal',
                  parameters: {
                    target: 'buffOwner',
                    alwaysNext: true,
                    tags: [],
                    attribute: 'maxHealth',
                    multiplier: {
                      kind: 'blackboard',
                      key: 'hp_ratio',
                    },
                    addition: {
                      kind: 'constant',
                      value: 0,
                    },
                  },
                },
              ],
            },
            whenFalse: {
              steps: [
                {
                  kind: 'finishBuffsById',
                  parameters: {
                    target: 'buffOwner',
                    buffIds: ['buff_cc_enemy_heal_under_control_timer'],
                    reason: 'other',
                  },
                },
              ],
            },
          },
        ],
      },
    },
  },
  buff_cc_enemy_common_movespeedup: {
    stackingType: 'unique',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: 0.25,
      speedup_scale: 2,
    },
    attributeModifiers: [],
    lifecycleSequences: {
      enable: {
        steps: [
          {
            kind: 'applyBuff',
            parameters: {
              buffId: 'buff_cc_enemy_common_movespeedup_dmg_limit_base',
              target: 'buffOwner',
              source: 'buffOwner',
              inheritSourceSkillCastInfo: true,
              copiedBlackboardAssignments: {
                dmg_scale: 'dmg_scale',
              },
            },
          },
        ],
      },
    },
  },
  buff_cc_enemy_common_movespeedup_dmg_limit_base: {
    stackingType: 'unique',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: 0.25,
      hp_ratio: 0,
      max_hp: 0,
      one_minus_dmg_scale: 0,
    },
    attributeModifiers: [],
    lifecycleSequences: {
      enable: {
        steps: [
          {
            kind: 'calculateActionValue',
            parameters: {
              key: 'one_minus_dmg_scale',
              operation: 'multiply',
              left: {
                kind: 'blackboard',
                key: 'dmg_scale',
              },
              right: {
                kind: 'constant',
                value: -1,
              },
            },
          },
        ],
      },
    },
    abilityEventResponses: [
      {
        event: 'beforeTakeDamage',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'storeEntityPropertyValue',
              parameters: {
                target: 'actionOwner',
                property: 'currentHealth',
                useFloor: false,
                divisor: {
                  kind: 'constant',
                  value: 1,
                },
                multiplier: {
                  kind: 'constant',
                  value: 1,
                },
                base: {
                  kind: 'constant',
                  value: 0,
                },
                targetKey: 'hp_ratio',
              },
            },
            {
              kind: 'storeEntityPropertyValue',
              parameters: {
                target: 'actionOwner',
                property: 'maxHealth',
                useFloor: false,
                divisor: {
                  kind: 'constant',
                  value: 1,
                },
                multiplier: {
                  kind: 'constant',
                  value: 1,
                },
                base: {
                  kind: 'constant',
                  value: 0,
                },
                targetKey: 'max_hp',
              },
            },
            {
              kind: 'modifyActionValue',
              parameters: {
                key: 'hp_ratio',
                operation: 'divide',
                value: {
                  kind: 'blackboard',
                  key: 'max_hp',
                },
              },
            },
            {
              kind: 'modifyActionValue',
              parameters: {
                key: 'hp_ratio',
                operation: 'add',
                value: {
                  kind: 'blackboard',
                  key: 'one_minus_dmg_scale',
                },
              },
            },
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'actionValueCompare',
                  left: {
                    kind: 'blackboard',
                    key: 'hp_ratio',
                    fallback: 0,
                  },
                  operator: 'greater',
                  right: {
                    kind: 'constant',
                    value: 0,
                  },
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'actionValueCompare',
                        left: {
                          kind: 'blackboard',
                          key: 'hp_ratio',
                          fallback: 0,
                        },
                        operator: 'lessOrEqual',
                        right: {
                          kind: 'constant',
                          value: 1,
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_cc_enemy_common_movespeedup_dmg_limit_instance',
                            target: 'buffOwner',
                            source: 'buffOwner',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: {
                              hp_ratio: 'hp_ratio',
                            },
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
      },
    ],
  },
  buff_cc_enemy_common_movespeedup_dmg_limit_instance: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: 0.1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      has_healed: 0,
      hp_heal_ratio: 0,
      hp_ratio: 0.25,
      max_hp: 0,
    },
    attributeModifiers: [],
    lifecycleSequences: {
      enable: {
        steps: [
          {
            kind: 'setHealthFloor',
            parameters: {
              target: 'actionOwner',
              mode: 'maxHealthRatio',
              value: {
                kind: 'blackboard',
                key: 'hp_ratio',
              },
            },
          },
        ],
      },
    },
    abilityEventResponses: [
      {
        event: 'receiveHeal',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'actionValueCompare',
                  left: {
                    kind: 'blackboard',
                    key: 'has_healed',
                    fallback: 0,
                  },
                  operator: 'equal',
                  right: {
                    kind: 'constant',
                    value: 0,
                  },
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'storeEventHealValues',
                    parameters: {
                      realHealOutputKey: 'hp_heal_ratio',
                    },
                  },
                  {
                    kind: 'storeEntityPropertyValue',
                    parameters: {
                      target: 'actionOwner',
                      property: 'maxHealth',
                      useFloor: false,
                      divisor: {
                        kind: 'constant',
                        value: 1,
                      },
                      multiplier: {
                        kind: 'constant',
                        value: 1,
                      },
                      base: {
                        kind: 'constant',
                        value: 0,
                      },
                      targetKey: 'max_hp',
                    },
                  },
                  {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'hp_heal_ratio',
                      operation: 'divide',
                      value: {
                        kind: 'blackboard',
                        key: 'max_hp',
                      },
                    },
                  },
                  {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'hp_ratio',
                      operation: 'add',
                      value: {
                        kind: 'blackboard',
                        key: 'hp_heal_ratio',
                      },
                    },
                  },
                  {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'has_healed',
                      operation: 'assign',
                      value: {
                        kind: 'constant',
                        value: 1,
                      },
                    },
                  },
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_common_movespeedup_dmg_limit_instance',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      asChildBuff: true,
                      copiedBlackboardAssignments: {
                        hp_ratio: 'hp_ratio',
                      },
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
  buff_cc_chr_main_attribute_down: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      attr: 0.9,
    },
    attributeModifiers: [
      {
        attribute: {
          kind: 'main',
        },
        slot: 'finalMultiplier',
        value: {
          blackboardKey: 'attr',
        },
      },
    ],
  },
  buff_cc_enemy_inflict_stack_resist: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.1,
    },
    attributeModifiers: [],
    lifecycleSequences: {
      enable: {
        steps: [
          {
            kind: 'applyBuff',
            parameters: {
              buffId: 'buff_cc_enemy_inflict_stack_resist_add_listener',
              target: 'buffOwner',
              inheritSourceSkillCastInfo: true,
              copiedBlackboardAssignments: {
                dmg_scale: 'dmg_scale',
              },
            },
          },
          {
            kind: 'applyBuff',
            parameters: {
              buffId: 'buff_cc_enemy_inflict_stack_resist_consume_listener',
              target: 'buffOwner',
              inheritSourceSkillCastInfo: true,
            },
          },
        ],
      },
    },
  },
  buff_cc_enemy_inflict_stack_resist_add_listener: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      d_dmg_scale: 0,
      dmg_scale: -0.1,
      stack: 0,
    },
    attributeModifiers: [],
    abilityEventResponses: [
      {
        event: 'addedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'readBuffStackCount',
                    parameters: {
                      target: 'buffOwner',
                      outputKey: 'stack',
                      query: {
                        kind: 'tag',
                        tagQueryType: 'hasAny',
                        buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
                      },
                    },
                  },
                  {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'd_dmg_scale',
                      operation: 'multiply',
                      left: {
                        kind: 'blackboard',
                        key: 'dmg_scale',
                      },
                      right: {
                        kind: 'blackboard',
                        key: 'stack',
                      },
                    },
                  },
                  {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'buffOwner',
                      buffIds: ['buff_cc_enemy_inflict_stack_resist_fire'],
                      reason: 'other',
                    },
                  },
                  {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'buffOwner',
                      buffIds: ['buff_cc_enemy_inflict_stack_resist_consume_delay'],
                      reason: 'other',
                    },
                  },
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_inflict_stack_resist_fire',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        dmg_scale: 'd_dmg_scale',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'addedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'readBuffStackCount',
                    parameters: {
                      target: 'buffOwner',
                      outputKey: 'stack',
                      query: {
                        kind: 'tag',
                        tagQueryType: 'hasAny',
                        buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                      },
                    },
                  },
                  {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'd_dmg_scale',
                      operation: 'multiply',
                      left: {
                        kind: 'blackboard',
                        key: 'dmg_scale',
                      },
                      right: {
                        kind: 'blackboard',
                        key: 'stack',
                      },
                    },
                  },
                  {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'buffOwner',
                      buffIds: ['buff_cc_enemy_inflict_stack_resist_pulse'],
                      reason: 'other',
                    },
                  },
                  {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'buffOwner',
                      buffIds: ['buff_cc_enemy_inflict_stack_resist_consume_delay'],
                      reason: 'other',
                    },
                  },
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_inflict_stack_resist_pulse',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        dmg_scale: 'd_dmg_scale',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'addedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'readBuffStackCount',
                    parameters: {
                      target: 'buffOwner',
                      outputKey: 'stack',
                      query: {
                        kind: 'tag',
                        tagQueryType: 'hasAny',
                        buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
                      },
                    },
                  },
                  {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'd_dmg_scale',
                      operation: 'multiply',
                      left: {
                        kind: 'blackboard',
                        key: 'dmg_scale',
                      },
                      right: {
                        kind: 'blackboard',
                        key: 'stack',
                      },
                    },
                  },
                  {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'buffOwner',
                      buffIds: ['buff_cc_enemy_inflict_stack_resist_cryst'],
                      reason: 'other',
                    },
                  },
                  {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'buffOwner',
                      buffIds: ['buff_cc_enemy_inflict_stack_resist_consume_delay'],
                      reason: 'other',
                    },
                  },
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_inflict_stack_resist_cryst',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        dmg_scale: 'd_dmg_scale',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'addedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'readBuffStackCount',
                    parameters: {
                      target: 'buffOwner',
                      outputKey: 'stack',
                      query: {
                        kind: 'tag',
                        tagQueryType: 'hasAny',
                        buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                      },
                    },
                  },
                  {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'd_dmg_scale',
                      operation: 'multiply',
                      left: {
                        kind: 'blackboard',
                        key: 'dmg_scale',
                      },
                      right: {
                        kind: 'blackboard',
                        key: 'stack',
                      },
                    },
                  },
                  {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'buffOwner',
                      buffIds: ['buff_cc_enemy_inflict_stack_resist_natural'],
                      reason: 'other',
                    },
                  },
                  {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'buffOwner',
                      buffIds: ['buff_cc_enemy_inflict_stack_resist_consume_delay'],
                      reason: 'other',
                    },
                  },
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_inflict_stack_resist_natural',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        dmg_scale: 'd_dmg_scale',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'addedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/NoGuard'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'readBuffStackCount',
                    parameters: {
                      target: 'buffOwner',
                      outputKey: 'stack',
                      query: {
                        kind: 'tag',
                        tagQueryType: 'hasAny',
                        buffTags: ['Skill/Character/Common/NoGuard'],
                      },
                    },
                  },
                  {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'd_dmg_scale',
                      operation: 'multiply',
                      left: {
                        kind: 'blackboard',
                        key: 'dmg_scale',
                      },
                      right: {
                        kind: 'blackboard',
                        key: 'stack',
                      },
                    },
                  },
                  {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'buffOwner',
                      buffIds: ['buff_cc_enemy_inflict_stack_resist_phy'],
                      reason: 'other',
                    },
                  },
                  {
                    kind: 'finishBuffsById',
                    parameters: {
                      target: 'buffOwner',
                      buffIds: ['buff_cc_enemy_inflict_stack_resist_consume_delay'],
                      reason: 'other',
                    },
                  },
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_inflict_stack_resist_phy',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        dmg_scale: 'd_dmg_scale',
                      },
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
  buff_cc_enemy_inflict_stack_resist_consume_delay: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: 0.1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      index: 0,
    },
    attributeModifiers: [],
    lifecycleSequences: {
      finish: {
        steps: [
          {
            kind: 'switch',
            parameters: {
              choice: {
                kind: 'blackboard',
                key: 'index',
              },
              alwaysNext: true,
            },
            options: [
              {
                value: {
                  kind: 'constant',
                  value: 0,
                },
                sequence: {
                  steps: [
                    {
                      kind: 'finishBuffsById',
                      parameters: {
                        target: 'buffOwner',
                        buffIds: ['buff_cc_enemy_inflict_stack_resist_fire'],
                        reason: 'other',
                      },
                    },
                  ],
                },
              },
              {
                value: {
                  kind: 'constant',
                  value: 1,
                },
                sequence: {
                  steps: [
                    {
                      kind: 'finishBuffsById',
                      parameters: {
                        target: 'buffOwner',
                        buffIds: ['buff_cc_enemy_inflict_stack_resist_pulse'],
                        reason: 'other',
                      },
                    },
                  ],
                },
              },
              {
                value: {
                  kind: 'constant',
                  value: 2,
                },
                sequence: {
                  steps: [
                    {
                      kind: 'finishBuffsById',
                      parameters: {
                        target: 'buffOwner',
                        buffIds: ['buff_cc_enemy_inflict_stack_resist_cryst'],
                        reason: 'other',
                      },
                    },
                  ],
                },
              },
              {
                value: {
                  kind: 'constant',
                  value: 3,
                },
                sequence: {
                  steps: [
                    {
                      kind: 'finishBuffsById',
                      parameters: {
                        target: 'buffOwner',
                        buffIds: ['buff_cc_enemy_inflict_stack_resist_natural'],
                        reason: 'other',
                      },
                    },
                  ],
                },
              },
              {
                value: {
                  kind: 'constant',
                  value: 4,
                },
                sequence: {
                  steps: [
                    {
                      kind: 'finishBuffsById',
                      parameters: {
                        target: 'buffOwner',
                        buffIds: ['buff_cc_enemy_inflict_stack_resist_phy'],
                        reason: 'other',
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
  },
  buff_cc_enemy_inflict_stack_resist_consume_listener: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {},
    attributeModifiers: [],
    abilityEventResponses: [
      {
        event: 'finishedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      blackboardAssignments: {
                        index: {
                          kind: 'constant',
                          value: 0,
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'finishedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      blackboardAssignments: {
                        index: {
                          kind: 'constant',
                          value: 1,
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'finishedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      blackboardAssignments: {
                        index: {
                          kind: 'constant',
                          value: 2,
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'finishedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      blackboardAssignments: {
                        index: {
                          kind: 'constant',
                          value: 3,
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        event: 'finishedBuff',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/NoGuard'],
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'applyBuff',
                    parameters: {
                      buffId: 'buff_cc_enemy_inflict_stack_resist_consume_delay',
                      target: 'buffOwner',
                      source: 'buffOwner',
                      inheritSourceSkillCastInfo: true,
                      blackboardAssignments: {
                        index: {
                          kind: 'constant',
                          value: 4,
                        },
                      },
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
  buff_cc_enemy_inflict_stack_resist_cryst: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 4,
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.1,
    },
    attributeModifiers: [],
    damageModifiers: [
      {
        enabledSide: 'defender',
        condition: {
          kind: 'eventDamageTypesMatch',
          damageTypes: ['cryo'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'defender',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_enemy_inflict_stack_resist_fire: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 4,
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.1,
    },
    attributeModifiers: [],
    damageModifiers: [
      {
        enabledSide: 'defender',
        condition: {
          kind: 'eventDamageTypesMatch',
          damageTypes: ['heat'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'defender',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_enemy_inflict_stack_resist_natural: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 4,
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.1,
    },
    attributeModifiers: [],
    damageModifiers: [
      {
        enabledSide: 'defender',
        condition: {
          kind: 'eventDamageTypesMatch',
          damageTypes: ['nature'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'defender',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_enemy_inflict_stack_resist_phy: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 4,
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.1,
    },
    attributeModifiers: [],
    damageModifiers: [
      {
        enabledSide: 'defender',
        condition: {
          kind: 'eventDamageTypesMatch',
          damageTypes: ['physical'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'defender',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_enemy_inflict_stack_resist_pulse: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 4,
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.1,
    },
    attributeModifiers: [],
    damageModifiers: [
      {
        enabledSide: 'defender',
        condition: {
          kind: 'eventDamageTypesMatch',
          damageTypes: ['electric'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'defender',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_chr_physical_and_inflict_enhance_special_cc0: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      dmg_scale: -0.6,
      dmg_up: 2,
    },
    attributeModifiers: [],
    damageModifiers: [
      {
        enabledSide: 'attacker',
        condition: {
          kind: 'eventDamageTagsMatch',
          match: 'exceptAny',
          tags: ['normalAttack', 'normalSkill', 'ultimateSkill', 'comboSkill'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'attacker',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_up',
            },
          },
        ],
      },
      {
        enabledSide: 'attacker',
        condition: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAll',
          tags: ['normalSkill'],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'attacker',
            zone: 'product',
            addition: {
              blackboardKey: 'dmg_scale',
            },
          },
        ],
      },
    ],
  },
  buff_cc_chr_heal_reflect_to_eny: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      chr_heal_ratio: 0.1,
      chr_shield_ratio: 0.2,
      eny_heal_ratio: 0.05,
    },
    attributeModifiers: [],
    lifecycleSequences: {
      enable: {
        steps: [
          {
            kind: 'applyBuff',
            parameters: {
              buffId: 'buff_cc_chr_heal_reflect_to_eny_heal',
              target: 'buffOwner',
              source: 'buffOwner',
              inheritSourceSkillCastInfo: true,
              copiedBlackboardAssignments: {
                chr_heal_ratio: 'chr_heal_ratio',
                eny_heal_ratio: 'eny_heal_ratio',
              },
            },
          },
          {
            kind: 'applyBuff',
            parameters: {
              buffId: 'buff_cc_chr_heal_reflect_to_eny_shield',
              target: 'buffOwner',
              source: 'buffOwner',
              inheritSourceSkillCastInfo: true,
              copiedBlackboardAssignments: {
                chr_heal_ratio: 'chr_shield_ratio',
                eny_heal_ratio: 'eny_heal_ratio',
              },
            },
          },
        ],
      },
    },
  },
  buff_cc_chr_heal_reflect_to_eny_heal: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      can_heal: 0,
      chr_heal_ratio: 0.1,
      eny_heal_ratio: 0.05,
      heal: 0,
      heal_ratio_total: 0,
      heal_times: 0,
    },
    attributeModifiers: [],
    abilityEventResponses: [
      {
        event: 'receiveHeal',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'casterControlled',
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'actionValueCompare',
                        left: {
                          kind: 'blackboard',
                          key: 'can_heal',
                          fallback: 0,
                        },
                        operator: 'greater',
                        right: {
                          kind: 'constant',
                          value: 0,
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'readBuffStackCount',
                          parameters: {
                            target: 'buffOwner',
                            outputKey: 'heal_times',
                            query: {
                              kind: 'id',
                              buffIds: ['buff_cc_chr_heal_reflect_to_eny_stack_heal'],
                            },
                          },
                        },
                        {
                          kind: 'finishBuffsById',
                          parameters: {
                            target: 'buffOwner',
                            buffIds: ['buff_cc_chr_heal_reflect_to_eny_stack_heal'],
                            reason: 'other',
                          },
                        },
                        {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'heal',
                            operation: 'multiply',
                            left: {
                              kind: 'blackboard',
                              key: 'chr_heal_ratio',
                            },
                            right: {
                              kind: 'blackboard',
                              key: 'heal_times',
                            },
                          },
                        },
                        {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'heal',
                            operation: 'multiply',
                            value: {
                              kind: 'constant',
                              value: -1,
                            },
                          },
                        },
                        {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'heal_ratio_total',
                            operation: 'add',
                            value: {
                              kind: 'blackboard',
                              key: 'heal',
                            },
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
      },
      {
        event: 'receiveHeal',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'casterControlled',
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'can_heal',
                      operation: 'assign',
                      value: {
                        kind: 'constant',
                        value: 0,
                      },
                    },
                  },
                  {
                    kind: 'storeEventHealValues',
                    parameters: {
                      realHealOutputKey: 'heal',
                    },
                  },
                  {
                    kind: 'storeSourceAttributeValue',
                    parameters: {
                      attribute: {
                        kind: 'specific',
                        key: 'maxHealth',
                      },
                      stage: 'finalNonConverted',
                      useFloor: false,
                      divisor: {
                        kind: 'constant',
                        value: 1,
                      },
                      multiplier: {
                        kind: 'constant',
                        value: 1,
                      },
                      base: {
                        kind: 'constant',
                        value: 0,
                      },
                      targetKey: 'max_hp',
                    },
                  },
                  {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'heal',
                      operation: 'divide',
                      value: {
                        kind: 'blackboard',
                        key: 'max_hp',
                      },
                    },
                  },
                  {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'heal_ratio_total',
                      operation: 'add',
                      value: {
                        kind: 'blackboard',
                        key: 'heal',
                      },
                    },
                  },
                  {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'heal_times',
                      operation: 'divide',
                      left: {
                        kind: 'blackboard',
                        key: 'heal_ratio_total',
                      },
                      right: {
                        kind: 'blackboard',
                        key: 'chr_heal_ratio',
                      },
                    },
                  },
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'actionValueCompare',
                        left: {
                          kind: 'blackboard',
                          key: 'heal_times',
                          fallback: 0,
                        },
                        operator: 'greater',
                        right: {
                          kind: 'constant',
                          value: 1,
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'heal_times',
                            operation: 'add',
                            value: {
                              kind: 'constant',
                              value: -1,
                            },
                          },
                        },
                        {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_cc_chr_heal_reflect_to_eny_stack_heal',
                            target: 'buffOwner',
                            source: 'buffOwner',
                            count: {
                              kind: 'blackboard',
                              key: 'heal_times',
                            },
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: {
                              eny_heal_ratio: 'eny_heal_ratio',
                            },
                          },
                        },
                        {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'can_heal',
                            operation: 'assign',
                            value: {
                              kind: 'constant',
                              value: 1,
                            },
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
      },
    ],
  },
  buff_cc_chr_heal_reflect_to_eny_shield: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      can_heal: 0,
      chr_heal_ratio: 0.2,
      eny_heal_ratio: 0.05,
      heal: 0,
      heal_ratio_total: 0,
      heal_times: 0,
    },
    attributeModifiers: [],
    abilityEventResponses: [
      {
        event: 'afterAddedShield',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'casterControlled',
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'actionValueCompare',
                        left: {
                          kind: 'blackboard',
                          key: 'can_heal',
                          fallback: 0,
                        },
                        operator: 'greater',
                        right: {
                          kind: 'constant',
                          value: 0,
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'readBuffStackCount',
                          parameters: {
                            target: 'buffOwner',
                            outputKey: 'heal_times',
                            query: {
                              kind: 'id',
                              buffIds: ['buff_cc_chr_heal_reflect_to_eny_stack_shield'],
                            },
                          },
                        },
                        {
                          kind: 'finishBuffsById',
                          parameters: {
                            target: 'buffOwner',
                            buffIds: ['buff_cc_chr_heal_reflect_to_eny_stack_shield'],
                            reason: 'other',
                          },
                        },
                        {
                          kind: 'calculateActionValue',
                          parameters: {
                            key: 'heal',
                            operation: 'multiply',
                            left: {
                              kind: 'blackboard',
                              key: 'chr_heal_ratio',
                            },
                            right: {
                              kind: 'blackboard',
                              key: 'heal_times',
                            },
                          },
                        },
                        {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'heal',
                            operation: 'multiply',
                            value: {
                              kind: 'constant',
                              value: -1,
                            },
                          },
                        },
                        {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'heal_ratio_total',
                            operation: 'add',
                            value: {
                              kind: 'blackboard',
                              key: 'heal',
                            },
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
      },
      {
        event: 'afterAddedShield',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'casterControlled',
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'can_heal',
                      operation: 'assign',
                      value: {
                        kind: 'constant',
                        value: 0,
                      },
                    },
                  },
                  {
                    kind: 'storeShieldValue',
                    parameters: {
                      target: 'actionOwner',
                      value: 'gained',
                      outputKey: 'heal',
                    },
                  },
                  {
                    kind: 'storeSourceAttributeValue',
                    parameters: {
                      attribute: {
                        kind: 'specific',
                        key: 'maxHealth',
                      },
                      stage: 'finalNonConverted',
                      useFloor: false,
                      divisor: {
                        kind: 'constant',
                        value: 1,
                      },
                      multiplier: {
                        kind: 'constant',
                        value: 1,
                      },
                      base: {
                        kind: 'constant',
                        value: 0,
                      },
                      targetKey: 'max_hp',
                    },
                  },
                  {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'heal',
                      operation: 'divide',
                      value: {
                        kind: 'blackboard',
                        key: 'max_hp',
                      },
                    },
                  },
                  {
                    kind: 'modifyActionValue',
                    parameters: {
                      key: 'heal_ratio_total',
                      operation: 'add',
                      value: {
                        kind: 'blackboard',
                        key: 'heal',
                      },
                    },
                  },
                  {
                    kind: 'calculateActionValue',
                    parameters: {
                      key: 'heal_times',
                      operation: 'divide',
                      left: {
                        kind: 'blackboard',
                        key: 'heal_ratio_total',
                      },
                      right: {
                        kind: 'blackboard',
                        key: 'chr_heal_ratio',
                      },
                    },
                  },
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'actionValueCompare',
                        left: {
                          kind: 'blackboard',
                          key: 'heal_times',
                          fallback: 0,
                        },
                        operator: 'greater',
                        right: {
                          kind: 'constant',
                          value: 1,
                        },
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'heal_times',
                            operation: 'add',
                            value: {
                              kind: 'constant',
                              value: -1,
                            },
                          },
                        },
                        {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_cc_chr_heal_reflect_to_eny_stack_shield',
                            target: 'buffOwner',
                            source: 'buffOwner',
                            count: {
                              kind: 'blackboard',
                              key: 'heal_times',
                            },
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: {
                              eny_heal_ratio: 'eny_heal_ratio',
                            },
                          },
                        },
                        {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'can_heal',
                            operation: 'assign',
                            value: {
                              kind: 'constant',
                              value: 1,
                            },
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
      },
    ],
  },
  buff_cc_chr_heal_reflect_to_eny_stack_heal: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 99,
    applyTags: [],
    extendTags: [],
    blackboard: {
      eny_heal_ratio: 0.05,
    },
    attributeModifiers: [],
    lifecycleSequences: {
      enable: {
        steps: [
          {
            kind: 'forEachContextTarget',
            parameters: {
              target: 'enemy',
            },
            body: {
              steps: [
                {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_cc_chr_heal_reflect_to_eny_stack_heal_do',
                    target: 'enemy',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: {
                      eny_heal_ratio: 'eny_heal_ratio',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  },
  buff_cc_chr_heal_reflect_to_eny_stack_heal_do: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: 0.1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      eny_heal_ratio: 0.05,
    },
    attributeModifiers: [],
    lifecycleSequences: {
      enable: {
        steps: [
          {
            kind: 'heal',
            parameters: {
              target: 'enemy',
              source: 'buffOwner',
              alwaysNext: true,
              tags: [],
              attribute: 'maxHealth',
              multiplier: {
                kind: 'blackboard',
                key: 'eny_heal_ratio',
              },
              addition: {
                kind: 'constant',
                value: 0,
              },
              attributeSource: 'target',
            },
          },
        ],
      },
    },
  },
  buff_cc_chr_heal_reflect_to_eny_stack_shield: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 99,
    applyTags: [],
    extendTags: [],
    blackboard: {
      eny_heal_ratio: 0.05,
    },
    attributeModifiers: [],
    lifecycleSequences: {
      enable: {
        steps: [
          {
            kind: 'forEachContextTarget',
            parameters: {
              target: 'enemy',
            },
            body: {
              steps: [
                {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'buff_cc_chr_heal_reflect_to_eny_stack_heal_do',
                    target: 'enemy',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: {
                      eny_heal_ratio: 'eny_heal_ratio',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  },
  buff_cc_chr_atb_recoverspeed_down_icon: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    presentation: {
      visible: true,
      iconId: 'icon_battle_atb_down',
      iconPath: '/icons/icon_battle_atb_down.webp',
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
      showWarningBackground: false,
      playStrongInAnimation: false,
      hasCharHpBarVfxType: false,
      charHpBarVfxType: 'Fire',
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderPriority: {
        useDirectoryValue: false,
        value: 0,
        category: 'CommonCharDebuff',
      },
    },
    applyTags: [],
    extendTags: [],
    blackboard: {},
    attributeModifiers: [],
  },
  buff_cc_chr_no_lastcombo_stop_atb_recover: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      duration: 12,
      ratio: -1,
    },
    attributeModifiers: [],
    lifecycleSequences: {
      start: {
        steps: [
          {
            kind: 'applyBuff',
            parameters: {
              buffId: 'buff_cc_chr_no_lastcombo_stop_atb_recover_countdown',
              target: 'buffOwner',
              source: 'buffOwner',
              inheritSourceSkillCastInfo: true,
              copiedBlackboardAssignments: {
                ratio: 'ratio',
                duration: 'duration',
              },
            },
          },
        ],
      },
    },
    abilityEventResponses: [
      {
        event: 'beforeOutputDamage',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'actionValueCompare',
                  left: {
                    kind: 'constant',
                    value: 1,
                  },
                  operator: 'equal',
                  right: {
                    kind: 'constant',
                    value: 1,
                  },
                },
              },
              whenTrue: {
                steps: [
                  {
                    kind: 'conditional',
                    parameters: {
                      condition: {
                        kind: 'eventDamageTagsMatch',
                        match: 'hasAny',
                        tags: ['powerAttack', 'normalAttackLastCombo'],
                      },
                    },
                    whenTrue: {
                      steps: [
                        {
                          kind: 'finishGlobalBuffsById',
                          parameters: {
                            globalBuffIds: ['global_buff_cc_chr_atb_recoverspeed_down'],
                            reason: 'other',
                          },
                        },
                        {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_cc_chr_no_lastcombo_stop_atb_recover_countdown',
                            target: 'party',
                            source: 'buffOwner',
                            inheritSourceSkillCastInfo: true,
                            asChildBuff: true,
                            copiedBlackboardAssignments: {
                              ratio: 'ratio',
                              duration: 'duration',
                            },
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
      },
    ],
  },
  buff_cc_chr_no_lastcombo_stop_atb_recover_countdown: {
    stackingType: 'refresh',
    priority: 0,
    maxStackCount: 1,
    durationSeconds: {
      blackboardKey: 'duration',
    },
    presentation: {
      visible: true,
      iconId: 'icon_battle_buff_chr_no_lastcombo_stop_atb_recove',
      iconPath: '/icons/icon_battle_buff_chr_no_lastcombo_stop_atb_recove.webp',
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
      showWarningBackground: false,
      playStrongInAnimation: false,
      hasCharHpBarVfxType: false,
      charHpBarVfxType: 'Fire',
      iconStyleInSquad: 'Default',
      abnormalColorType: 'Physical',
      orderPriority: {
        useDirectoryValue: false,
        value: 0,
        category: 'AttentionBuff',
      },
    },
    applyTags: [],
    extendTags: [],
    blackboard: {
      duration: 12,
      ratio: -1,
    },
    attributeModifiers: [],
    lifecycleSequences: {
      finish: {
        steps: [
          {
            kind: 'conditional',
            parameters: {
              condition: {
                kind: 'casterControlled',
              },
            },
            whenTrue: {
              steps: [
                {
                  kind: 'createGlobalBuff',
                  parameters: {
                    globalBuffId: 'global_buff_cc_chr_atb_recoverspeed_down',
                    definition: {
                      stackingType: 'unlimited',
                      blackboard: {
                        ratio: -0.1,
                      },
                      sharedSpModifiers: [
                        {
                          attribute: 'spRecovery',
                          operation: 'multiplier',
                          value: {
                            kind: 'blackboard',
                            key: 'ratio',
                          },
                          applyToReturnSpGain: true,
                        },
                      ],
                      children: [
                        {
                          buffId: 'buff_cc_chr_atb_recoverspeed_down_icon',
                          blackboardAssignments: {},
                        },
                      ],
                    },
                    source: 'battle',
                    blackboardAssignments: {
                      ratio: {
                        kind: 'blackboard',
                        key: 'ratio',
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  },
  buff_cc_chr_no_lastcombo_stop_atb_recover_pre: {
    stackingType: 'unlimited',
    priority: 0,
    maxStackCount: 1,
    applyTags: [],
    extendTags: [],
    blackboard: {
      duration: 12,
      ratio: -1,
    },
    attributeModifiers: [],
    abilityEventResponses: [
      {
        event: 'enterFight',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'buff_cc_chr_no_lastcombo_stop_atb_recover',
                target: 'buffOwner',
                source: 'buffOwner',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: {
                  ratio: 'ratio',
                  duration: 'duration',
                },
              },
            },
          ],
        },
      },
    ],
  },
}) as OperatorBuffDefinitions;
export const contingencyContractTagDefinitions = Object.freeze<
  readonly ContingencyContractTagDefinition[]
>([
  {
    tagId: 102801,
    columnId: '1',
    conflictId: 'c1028',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_302.webp',
    blackboard: {
      attr: 0.9,
    },
  },
  {
    tagId: 102802,
    columnId: '1',
    conflictId: 'c1028',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_303.webp',
    blackboard: {
      attr: 0.8,
    },
  },
  {
    tagId: 102803,
    columnId: '1',
    conflictId: 'c1028',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅲ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_304.webp',
    blackboard: {
      attr: 0.6,
    },
  },
  {
    tagId: 100201,
    columnId: '2',
    conflictId: 'c1002',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_101.webp',
    blackboard: {
      dmg_up: 0.3,
    },
  },
  {
    tagId: 100202,
    columnId: '2',
    conflictId: 'c1002',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_102.webp',
    blackboard: {
      dmg_up: 0.8,
    },
  },
  {
    tagId: 102101,
    columnId: '3',
    conflictId: 'c1021',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_111_2.webp',
    blackboard: {
      time: -100,
    },
  },
  {
    tagId: 102102,
    columnId: '3',
    conflictId: 'c1021',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_112_2.webp',
    blackboard: {
      time: -200,
    },
  },
  {
    tagId: 102103,
    columnId: '3',
    conflictId: 'c1021',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅲ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_301.webp',
    blackboard: {
      time: -300,
    },
  },
  {
    tagId: 900101,
    columnId: '4',
    conflictId: 'c9001',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_114.webp',
    blackboard: {
      hp_up: 1.5,
    },
  },
  {
    tagId: 900102,
    columnId: '4',
    conflictId: 'c9001',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_115.webp',
    blackboard: {
      hp_up: 2,
    },
  },
  {
    tagId: 900103,
    columnId: '4',
    conflictId: 'c9001',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅲ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_116.webp',
    blackboard: {
      hp_up: 3,
    },
  },
  {
    tagId: 100901,
    columnId: '5',
    conflictId: 'c1009',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_122.webp',
    blackboard: {
      dmg_scale: -0.45,
    },
  },
  {
    tagId: 100902,
    columnId: '5',
    conflictId: 'c1009',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_123.webp',
    blackboard: {
      dmg_scale: -0.9,
    },
  },
  {
    tagId: 100601,
    columnId: '6',
    conflictId: 'c1006',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_117.webp',
    blackboard: {
      dmg_scale: 0.5,
    },
  },
  {
    tagId: 100602,
    columnId: '6',
    conflictId: 'c1006',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_118.webp',
    blackboard: {
      dmg_scale: 1,
    },
  },
  {
    tagId: 101301,
    columnId: '7',
    conflictId: 'c1013',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_103.webp',
    blackboard: {
      ratio: -0.5,
    },
  },
  {
    tagId: 101303,
    columnId: '7',
    conflictId: 'c1013',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_104.webp',
    blackboard: {},
  },
  {
    tagId: 102001,
    columnId: '8',
    conflictId: 'c1020',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_107.webp',
    blackboard: {
      num: -2,
    },
  },
  {
    tagId: 102002,
    columnId: '8',
    conflictId: 'c1020',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_108.webp',
    blackboard: {
      num: -3,
    },
  },
  {
    tagId: 100501,
    columnId: '9',
    conflictId: 'c1005',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅰ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_207.webp',
    blackboard: {
      dmg_scale_per_layer: -0.5,
    },
  },
  {
    tagId: 100502,
    columnId: '9',
    conflictId: 'c1005',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: 'Ⅱ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_208.webp',
    blackboard: {
      dmg_scale_per_layer: -1,
    },
  },
  {
    tagId: 101001,
    columnId: '10',
    conflictId: '',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_124.webp',
    blackboard: {
      duration: 5,
    },
  },
  {
    tagId: 102302,
    columnId: '10',
    conflictId: '',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_136.webp',
    blackboard: {
      speedup_scale: 2,
      dmg_scale: 0.25,
    },
  },
  {
    tagId: 100803,
    columnId: '10',
    conflictId: '',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_209.webp',
    blackboard: {
      dmg_scale: -0.7,
    },
  },
  {
    tagId: 103401,
    columnId: '11',
    conflictId: '',
    score: 1,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_312.webp',
    blackboard: {
      ratio: -1,
      duration: 12,
    },
  },
  {
    tagId: 103302,
    columnId: '11',
    conflictId: '',
    score: 2,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_307.webp',
    blackboard: {
      chr_heal_ratio: 0.1,
      eny_heal_ratio: 0.08,
      chr_shield_ratio: 0.2,
    },
  },
  {
    tagId: 101402,
    columnId: '11',
    conflictId: '',
    score: 3,
    keyId: '',
    lockIds: [],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_127.webp',
    blackboard: {
      hp_down_ratio: 0.5,
      hp_down_ratio_melee: 0.3,
    },
  },
  {
    tagId: 100003,
    columnId: '12',
    conflictId: 'c1000c1001',
    score: 3,
    keyId: 'key2',
    lockIds: [],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_201.webp',
    blackboard: {
      cd_scale: 0.4,
      dmg_scale: -0.6,
    },
  },
  {
    tagId: 103203,
    columnId: '13',
    conflictId: 'c1000c1001',
    score: 3,
    keyId: 'key2',
    lockIds: [],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_306.webp',
    blackboard: {
      dmg_up: 1,
      dmg_scale: -0.6,
    },
  },
  {
    tagId: 103102,
    columnId: '14',
    conflictId: '',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_308.webp',
    blackboard: {
      dmg_scale: -0.1,
    },
  },
  {
    tagId: 101201,
    columnId: '14',
    conflictId: '',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_125.webp',
    blackboard: {},
  },
  {
    tagId: 101501,
    columnId: '15',
    conflictId: 'c1015',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅰ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_129.webp',
    blackboard: {
      atk_scale: 0.02,
    },
  },
  {
    tagId: 101502,
    columnId: '15',
    conflictId: 'c1015',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅱ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_130.webp',
    blackboard: {
      atk_scale: 0.05,
    },
  },
  {
    tagId: 100301,
    columnId: '16',
    conflictId: 'c1003',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅰ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_203.webp',
    blackboard: {
      times: 2,
    },
  },
  {
    tagId: 100302,
    columnId: '16',
    conflictId: 'c1003',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅱ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_204.webp',
    blackboard: {
      times: 1,
    },
  },
  {
    tagId: 100401,
    columnId: '17',
    conflictId: 'c1004',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅰ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_205.webp',
    blackboard: {
      times: 2,
    },
  },
  {
    tagId: 100402,
    columnId: '17',
    conflictId: 'c1004',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅱ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_206.webp',
    blackboard: {
      times: 1,
    },
  },
  {
    tagId: 101701,
    columnId: '18',
    conflictId: 'c1017c1019',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_132.webp',
    blackboard: {
      duration: 15,
    },
  },
  {
    tagId: 101603,
    columnId: '18',
    conflictId: '',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_135.webp',
    blackboard: {},
  },
  {
    tagId: 101801,
    columnId: '19',
    conflictId: 'c1017c1019',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_133.webp',
    blackboard: {
      duration: 15,
    },
  },
  {
    tagId: 101901,
    columnId: '20',
    conflictId: 'c1017c1019',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_134.webp',
    blackboard: {
      duration: 15,
    },
  },
  {
    tagId: 102401,
    columnId: '21',
    conflictId: 'c1017c1019',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: '',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_210.webp',
    blackboard: {
      duration: 15,
    },
  },
  {
    tagId: 101101,
    columnId: '22',
    conflictId: 'c1011',
    score: 1,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅰ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_119.webp',
    blackboard: {
      hp_ratio: 0.05,
    },
  },
  {
    tagId: 101102,
    columnId: '22',
    conflictId: 'c1011',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅱ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_120.webp',
    blackboard: {
      hp_ratio: 0.15,
    },
  },
  {
    tagId: 102201,
    columnId: '23',
    conflictId: 'c1022',
    score: 2,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅰ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_310.webp',
    blackboard: {},
  },
  {
    tagId: 102202,
    columnId: '23',
    conflictId: 'c1022',
    score: 3,
    keyId: '',
    lockIds: ['key2'],
    romanNumSuffix: 'Ⅱ',
    iconPath: '/contingency_contract/1/icon_activity_contract_tag_311.webp',
    blackboard: {},
  },
]);
export const contingencyContractInitializationPlans = Object.freeze([
  {
    tagId: 100003,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_combo_special_cc0',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                cd_scale: 0.2,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_combo_special_cc0',
                  blackboardAssignments: {
                    cd_scale: {
                      kind: 'blackboard',
                      key: 'cd_scale',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              cd_scale: {
                kind: 'constant',
                value: 0.4,
              },
              dmg_scale: {
                kind: 'constant',
                value: -0.6,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 100301,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_normal_skill_cryst_inflict',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                times: 2,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_normal_skill_cryst_inflict',
                  blackboardAssignments: {
                    times: {
                      kind: 'blackboard',
                      key: 'times',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              times: {
                kind: 'constant',
                value: 2,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 100302,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_normal_skill_cryst_inflict',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                times: 2,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_normal_skill_cryst_inflict',
                  blackboardAssignments: {
                    times: {
                      kind: 'blackboard',
                      key: 'times',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              times: {
                kind: 'constant',
                value: 1,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 100401,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_combo_skill_cryst_inflict',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                times: 2,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_combo_skill_cryst_inflict',
                  blackboardAssignments: {
                    times: {
                      kind: 'blackboard',
                      key: 'times',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              times: {
                kind: 'constant',
                value: 2,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 100402,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_combo_skill_cryst_inflict',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                times: 2,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_combo_skill_cryst_inflict',
                  blackboardAssignments: {
                    times: {
                      kind: 'blackboard',
                      key: 'times',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              times: {
                kind: 'constant',
                value: 1,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 100501,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_ult_dmg_down_gradual',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                dmg_scale: -0.5,
                dmg_scale_per_layer: -0.5,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_ult_dmg_down_gradual',
                  blackboardAssignments: {},
                },
                {
                  buffId: 'buff_cc_chr_ult_dmg_down_gradual_instance',
                  blackboardAssignments: {
                    dmg_scale_per_layer: {
                      kind: 'blackboard',
                      key: 'dmg_scale_per_layer',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              dmg_scale_per_layer: {
                kind: 'constant',
                value: -0.5,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 100502,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_ult_dmg_down_gradual',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                dmg_scale: -0.5,
                dmg_scale_per_layer: -0.5,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_ult_dmg_down_gradual',
                  blackboardAssignments: {},
                },
                {
                  buffId: 'buff_cc_chr_ult_dmg_down_gradual_instance',
                  blackboardAssignments: {
                    dmg_scale_per_layer: {
                      kind: 'blackboard',
                      key: 'dmg_scale_per_layer',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              dmg_scale_per_layer: {
                kind: 'constant',
                value: -1,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 100803,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_normal_attack_dmg_down',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                dmg_scale: -0.6,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_normal_attack_dmg_down',
                  blackboardAssignments: {
                    dmg_scale: {
                      kind: 'blackboard',
                      key: 'dmg_scale',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              dmg_scale: {
                kind: 'constant',
                value: -0.7,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 100901,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_dmg_down_after_inflict',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                dmg_scale: -0.1,
                duration: 10,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_dmg_down_after_inflict',
                  blackboardAssignments: {
                    dmg_scale: {
                      kind: 'blackboard',
                      key: 'dmg_scale',
                    },
                    duration: {
                      kind: 'blackboard',
                      key: 'duration',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              dmg_scale: {
                kind: 'constant',
                value: -0.45,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 100902,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_dmg_down_after_inflict',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                dmg_scale: -0.1,
                duration: 10,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_dmg_down_after_inflict',
                  blackboardAssignments: {
                    dmg_scale: {
                      kind: 'blackboard',
                      key: 'dmg_scale',
                    },
                    duration: {
                      kind: 'blackboard',
                      key: 'duration',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              dmg_scale: {
                kind: 'constant',
                value: -0.9,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 101001,
    sequence: {
      steps: [
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_periodic_inflict_resist',
            target: 'enemy',
            blackboardAssignments: {
              duration: {
                kind: 'constant',
                value: 5,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 101101,
    sequence: {
      steps: [
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_heal_under_control',
            target: 'enemy',
            blackboardAssignments: {
              hp_ratio: {
                kind: 'constant',
                value: 0.05,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 101102,
    sequence: {
      steps: [
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_heal_under_control',
            target: 'enemy',
            blackboardAssignments: {
              hp_ratio: {
                kind: 'constant',
                value: 0.15,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 102302,
    sequence: {
      steps: [
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_common_movespeedup',
            target: 'enemy',
            blackboardAssignments: {
              speedup_scale: {
                kind: 'constant',
                value: 2,
              },
              dmg_scale: {
                kind: 'constant',
                value: 0.25,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 102801,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_main_attribute_down',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                attr: -200,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_main_attribute_down',
                  blackboardAssignments: {
                    attr: {
                      kind: 'blackboard',
                      key: 'attr',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              attr: {
                kind: 'constant',
                value: 0.9,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 102802,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_main_attribute_down',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                attr: -200,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_main_attribute_down',
                  blackboardAssignments: {
                    attr: {
                      kind: 'blackboard',
                      key: 'attr',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              attr: {
                kind: 'constant',
                value: 0.8,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 102803,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_main_attribute_down',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                attr: -200,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_main_attribute_down',
                  blackboardAssignments: {
                    attr: {
                      kind: 'blackboard',
                      key: 'attr',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              attr: {
                kind: 'constant',
                value: 0.6,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 103102,
    sequence: {
      steps: [
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_cc_enemy_inflict_stack_resist',
            target: 'enemy',
            blackboardAssignments: {
              dmg_scale: {
                kind: 'constant',
                value: -0.1,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 103203,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_physical_and_inflict_enhance_special_cc0',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                dmg_scale: -0.6,
                dmg_up: 2,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_physical_and_inflict_enhance_special_cc0',
                  blackboardAssignments: {
                    dmg_up: {
                      kind: 'blackboard',
                      key: 'dmg_up',
                    },
                    dmg_scale: {
                      kind: 'blackboard',
                      key: 'dmg_scale',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              dmg_up: {
                kind: 'constant',
                value: 1,
              },
              dmg_scale: {
                kind: 'constant',
                value: -0.6,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 103302,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_heal_reflect_to_eny',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                chr_heal_ratio: 0.1,
                chr_shield_ratio: 0.2,
                eny_heal_ratio: 0.05,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_heal_reflect_to_eny',
                  blackboardAssignments: {
                    chr_heal_ratio: {
                      kind: 'blackboard',
                      key: 'chr_heal_ratio',
                    },
                    eny_heal_ratio: {
                      kind: 'blackboard',
                      key: 'eny_heal_ratio',
                    },
                    chr_shield_ratio: {
                      kind: 'blackboard',
                      key: 'chr_shield_ratio',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              chr_heal_ratio: {
                kind: 'constant',
                value: 0.1,
              },
              eny_heal_ratio: {
                kind: 'constant',
                value: 0.08,
              },
              chr_shield_ratio: {
                kind: 'constant',
                value: 0.2,
              },
            },
          },
        },
      ],
    },
  },
  {
    tagId: 103401,
    sequence: {
      steps: [
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_cc_chr_no_lastcombo_stop_atb_recover',
            definition: {
              stackingType: 'unlimited',
              blackboard: {
                duration: 12,
                ratio: -1,
              },
              children: [
                {
                  buffId: 'buff_cc_chr_no_lastcombo_stop_atb_recover_pre',
                  blackboardAssignments: {
                    ratio: {
                      kind: 'blackboard',
                      key: 'ratio',
                    },
                    duration: {
                      kind: 'blackboard',
                      key: 'duration',
                    },
                  },
                },
              ],
            },
            source: 'battle',
            blackboardAssignments: {
              ratio: {
                kind: 'constant',
                value: -1,
              },
              duration: {
                kind: 'constant',
                value: 12,
              },
            },
          },
        },
      ],
    },
  },
]) as readonly { readonly tagId: number; readonly sequence: ActionSequenceDefinition }[];
export const contingencyContractEnemyMaxHealthPlans = Object.freeze([
  {
    tagId: 900101,
    multiplier: 1.5,
  },
  {
    tagId: 900102,
    multiplier: 2,
  },
  {
    tagId: 900103,
    multiplier: 3,
  },
]) as readonly { readonly tagId: number; readonly multiplier: number }[];
export const contingencyContractBlockedTagReasons = Object.freeze({}) as Readonly<
  Record<number, string>
>;
export const contingencyContractOmittedTagReasons = Object.freeze({
  '100201': 'only changes damage dealt by the passive enemy',
  '100202': 'only changes damage dealt by the passive enemy',
  '100601': 'only changes damage received by operators',
  '100602': 'only changes damage received by operators',
  '101201': 'operator switching is forced by the authored timeline',
  '101301': 'stamina and evasion are outside the authored skill timeline',
  '101303': 'stamina and evasion are outside the authored skill timeline',
  '101402': 'depends on operators receiving enemy damage',
  '101501': 'runs after the unique fixed target has been defeated',
  '101502': 'runs after the unique fixed target has been defeated',
  '101603': 'depends on the passive enemy applying an infliction to an operator',
  '101701': 'only changes operator freeze and input behavior',
  '101801': 'only changes operator freeze and input behavior',
  '101901': 'only changes operator freeze and input behavior',
  '102001': 'wave healing pickups do not exist in the fixed-target scenario',
  '102002': 'wave healing pickups do not exist in the fixed-target scenario',
  '102101': 'challenge countdown is not a combat result',
  '102102': 'challenge countdown is not a combat result',
  '102103': 'challenge countdown is not a combat result',
  '102201': 'changes stage wave enemy composition rather than the selected fixed target',
  '102202': 'changes stage wave enemy composition rather than the selected fixed target',
  '102401': 'only changes operator freeze and input behavior',
}) as Readonly<Record<number, string>>;
export const contingencyContractDefinitionRevision = '1.5.3@10024360-6';
