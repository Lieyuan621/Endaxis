import type { ScenarioData } from "../types";

// Native optimizer scenario fixture converted from the historical Endaxis share.
export const scenario = {
  "tracks": [
    {
      "id": "CHENQIANYU",
      "actions": [
        {
          "id": "CHENQIANYU_attack",
          "type": "basicAttack",
          "name": "重击",
          "element": "physical",
          "duration": 3.2,
          "cooldown": 0,
          "icon": "",
          "spCost": 0,
          "gaugeCost": 0,
          "gaugeGain": 0,
          "teamGaugeGain": 0,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_83xf30r",
          "logicalStartTime": 0,
          "startTime": 0,
          "skillId": "CHENQIANYU_attack",
          "hits": [
            {
              "offset": 3.2,
              "stagger": 16,
              "spRecovery": 18,
              "spReturn": 0,
              "effects": []
            }
          ]
        },
        {
          "id": "CHENQIANYU_skill",
          "type": "battleSkill",
          "name": "战技",
          "element": "physical",
          "duration": 0.8,
          "cooldown": 0,
          "icon": "/avatars/CHENQIANYU/icon_skill_chen_01.png",
          "spCost": 100,
          "gaugeCost": 0,
          "gaugeGain": 6.5,
          "teamGaugeGain": 6.5,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_6wgpfl3",
          "logicalStartTime": 3.2,
          "startTime": 3.2,
          "skillId": "CHENQIANYU_skill",
          "hits": [
            {
              "offset": 0.4,
              "stagger": 10,
              "spRecovery": 0,
              "spReturn": 0,
              "effects": [
                {
                  "type": "break",
                  "stacks": 1,
                  "duration": 0,
                  "offset": 0.4,
                  "_id": "7380ey5",
                  "kind": "physicalStatus",
                  "physicalType": "break",
                  "displayType": "break"
                }
              ]
            }
          ]
        },
        {
          "id": "CHENQIANYU_link",
          "type": "comboSkill",
          "name": "连携",
          "element": "physical",
          "duration": 0.9,
          "cooldown": 16,
          "icon": "/avatars/CHENQIANYU/icon_combo_skill_chen_01.png",
          "spCost": 0,
          "gaugeCost": 0,
          "gaugeGain": 10,
          "teamGaugeGain": 0,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_m4jt0hp",
          "logicalStartTime": 4.4,
          "startTime": 4.4,
          "skillId": "CHENQIANYU_link",
          "hits": [
            {
              "offset": 0.56,
              "stagger": 10,
              "spRecovery": 0,
              "spReturn": 0,
              "effects": [
                {
                  "type": "knockup",
                  "stacks": 2,
                  "duration": 0,
                  "offset": 0.56,
                  "_id": "y1byw3x",
                  "kind": "physicalStatus",
                  "physicalType": "knockup",
                  "displayType": "knockup"
                }
              ]
            }
          ]
        },
        {
          "id": "CHENQIANYU_attack",
          "type": "basicAttack",
          "name": "重击",
          "element": "physical",
          "duration": 3.2,
          "cooldown": 0,
          "icon": "",
          "spCost": 0,
          "gaugeCost": 0,
          "gaugeGain": 0,
          "teamGaugeGain": 0,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_nxhwtu6",
          "logicalStartTime": 5.9,
          "startTime": 5.9,
          "skillId": "CHENQIANYU_attack",
          "hits": [
            {
              "offset": 3.2,
              "stagger": 16,
              "spRecovery": 18,
              "spReturn": 0,
              "effects": []
            }
          ]
        },
        {
          "id": "CHENQIANYU_attack",
          "type": "basicAttack",
          "name": "重击",
          "element": "physical",
          "duration": 3.2,
          "cooldown": 0,
          "icon": "",
          "spCost": 0,
          "gaugeCost": 0,
          "gaugeGain": 0,
          "teamGaugeGain": 0,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_95ddgxo",
          "logicalStartTime": 10.1,
          "startTime": 10.1,
          "skillId": "CHENQIANYU_attack",
          "hits": [
            {
              "offset": 3.2,
              "stagger": 16,
              "spRecovery": 18,
              "spReturn": 0,
              "effects": []
            }
          ]
        },
        {
          "id": "CHENQIANYU_attack",
          "type": "basicAttack",
          "name": "重击",
          "element": "physical",
          "duration": 3.2,
          "cooldown": 0,
          "icon": "",
          "spCost": 0,
          "gaugeCost": 0,
          "gaugeGain": 0,
          "teamGaugeGain": 0,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_9u3lc19",
          "logicalStartTime": 13.9,
          "startTime": 13.9,
          "skillId": "CHENQIANYU_attack",
          "hits": [
            {
              "offset": 3.2,
              "stagger": 16,
              "spRecovery": 18,
              "spReturn": 0,
              "effects": []
            }
          ]
        },
        {
          "id": "CHENQIANYU_attack",
          "type": "basicAttack",
          "name": "重击",
          "element": "physical",
          "duration": 3.2,
          "cooldown": 0,
          "icon": "",
          "spCost": 0,
          "gaugeCost": 0,
          "gaugeGain": 0,
          "teamGaugeGain": 0,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_7d7vbcy",
          "logicalStartTime": 17.8,
          "startTime": 17.8,
          "skillId": "CHENQIANYU_attack",
          "hits": [
            {
              "offset": 3.2,
              "stagger": 16,
              "spRecovery": 18,
              "spReturn": 0,
              "effects": []
            }
          ]
        },
        {
          "id": "CHENQIANYU_link",
          "type": "comboSkill",
          "name": "连携",
          "librarySource": "character",
          "element": "physical",
          "duration": 0.9,
          "cooldown": 16,
          "icon": "/avatars/CHENQIANYU/icon_combo_skill_chen_01.webp",
          "spCost": 0,
          "gaugeCost": 0,
          "gaugeGain": 10,
          "teamGaugeGain": 0,
          "enhancementTime": 0,
          "animationTime": 0,
          "weaponId": null,
          "instanceId": "inst_nejrrla",
          "sourceWeaponId": null,
          "logicalStartTime": 21.8,
          "startTime": 21.8,
          "skillId": "CHENQIANYU_link",
          "hits": [
            {
              "offset": 0.56,
              "stagger": 10,
              "spRecovery": 0,
              "spReturn": 0,
              "effects": [
                {
                  "type": "knockup",
                  "stacks": 4,
                  "duration": 0,
                  "offset": 0.56,
                  "_id": "ebf42r1",
                  "kind": "physicalStatus",
                  "physicalType": "knockup",
                  "displayType": "knockup"
                }
              ]
            }
          ]
        },
        {
          "id": "CHENQIANYU_execution",
          "type": "finisher",
          "name": "处决",
          "element": "physical",
          "duration": 2.5,
          "cooldown": 0,
          "icon": "",
          "spCost": 0,
          "gaugeCost": 0,
          "gaugeGain": 0,
          "teamGaugeGain": 0,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_ai1qx5h",
          "logicalStartTime": 23.4,
          "startTime": 23.4,
          "skillId": "CHENQIANYU_execution",
          "hits": []
        }
      ],
      "initialGauge": 0,
      "maxGaugeOverride": null,
      "gaugeEfficiency": 100,
      "originiumArtsPower": 0,
      "weaponId": "wpn_sword_0011",
      "weaponCommon1Tier": 1,
      "weaponCommon2Tier": 1,
      "weaponBuffTier": 1,
      "weaponAppliedDeltas": {},
      "stats": {
        "primary_ability": 0,
        "secondary_ability": 0,
        "strength": 0,
        "agility": 0,
        "intellect": 0,
        "will": 0,
        "attack": 0,
        "hp": 0,
        "crit_rate": 0,
        "blaze_dmg": 0,
        "emag_dmg": 0,
        "cold_dmg": 0,
        "nature_dmg": 0,
        "healing_effect": 0,
        "physical_dmg": 0,
        "arts_dmg": 0,
        "originium_arts_power": 0,
        "ult_charge_eff": 100,
        "link_cd_reduction": 0
      },
      "equipArmorId": null,
      "equipGlovesId": null,
      "equipAccessory1Id": null,
      "equipAccessory2Id": null,
      "linkCdReduction": 0
    },
    {
      "id": "ENDMINISTRATOR",
      "actions": [
        {
          "id": "ENDMINISTRATOR_link",
          "type": "comboSkill",
          "name": "连携",
          "element": "physical",
          "duration": 1.2,
          "cooldown": 16,
          "icon": "/avatars/ENDMINISTRATOR/icon_combo_skill_endmin_01.png",
          "spCost": 0,
          "gaugeCost": 0,
          "gaugeGain": 10,
          "teamGaugeGain": 0,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_kvvfl49",
          "logicalStartTime": 8,
          "startTime": 8,
          "triggerWindow": 0,
          "skillId": "ENDMINISTRATOR_link",
          "hits": [
            {
              "offset": 0.8,
              "stagger": 10,
              "spRecovery": 0,
              "spReturn": 0,
              "effects": [
                {
                  "type": "endmin_debuff",
                  "stacks": 1,
                  "duration": 4,
                  "offset": 0.8,
                  "_id": "dsk6uom",
                  "kind": "status",
                  "id": "endmin_debuff",
                  "name": "endmin_debuff",
                  "displayType": "endmin_debuff"
                }
              ]
            }
          ]
        },
        {
          "id": "ENDMINISTRATOR_link",
          "type": "comboSkill",
          "name": "连携",
          "librarySource": "character",
          "element": "physical",
          "duration": 1.2,
          "cooldown": 16,
          "icon": "/avatars/ENDMINISTRATOR/icon_combo_skill_endmin_01.webp",
          "spCost": 0,
          "gaugeCost": 0,
          "gaugeGain": 10,
          "teamGaugeGain": 0,
          "enhancementTime": 0,
          "animationTime": 0,
          "weaponId": null,
          "instanceId": "inst_74qhclh",
          "sourceWeaponId": "wpn_sword_0021",
          "logicalStartTime": 24.5,
          "startTime": 24.5,
          "skillId": "ENDMINISTRATOR_link",
          "hits": [
            {
              "offset": 0.8,
              "stagger": 10,
              "spRecovery": 0,
              "spReturn": 0,
              "effects": [
                {
                  "type": "endmin_debuff",
                  "stacks": 1,
                  "duration": 4,
                  "offset": 0.8,
                  "_id": "1mc98na",
                  "kind": "status",
                  "id": "endmin_debuff",
                  "name": "endmin_debuff",
                  "displayType": "endmin_debuff"
                }
              ]
            }
          ]
        },
        {
          "id": "ENDMINISTRATOR_skill",
          "type": "battleSkill",
          "name": "战技",
          "element": "physical",
          "duration": 0.8,
          "cooldown": 0,
          "icon": "/avatars/ENDMINISTRATOR/icon_skill_endmin_01.png",
          "spCost": 100,
          "gaugeCost": 0,
          "gaugeGain": 6.5,
          "teamGaugeGain": 6.5,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_8ka0n5b",
          "logicalStartTime": 26.5,
          "startTime": 26.5,
          "skillId": "ENDMINISTRATOR_skill",
          "hits": [
            {
              "offset": 0.4,
              "stagger": 10,
              "spRecovery": 0,
              "spReturn": 0,
              "effects": [
                {
                  "type": "stagger",
                  "stacks": 4,
                  "duration": 0,
                  "offset": 0.4,
                  "_id": "eqty05n",
                  "kind": "physicalStatus",
                  "physicalType": "stagger",
                  "displayType": "stagger"
                }
              ]
            }
          ]
        }
      ],
      "initialGauge": 0,
      "maxGaugeOverride": null,
      "gaugeEfficiency": 100,
      "originiumArtsPower": 0,
      "weaponId": "wpn_sword_0021",
      "weaponCommon1Tier": 1,
      "weaponCommon2Tier": 1,
      "weaponBuffTier": 1,
      "weaponAppliedDeltas": {},
      "stats": {
        "primary_ability": 0,
        "secondary_ability": 0,
        "strength": 0,
        "agility": 0,
        "intellect": 0,
        "will": 0,
        "attack": 0,
        "hp": 0,
        "crit_rate": 0,
        "blaze_dmg": 0,
        "emag_dmg": 0,
        "cold_dmg": 0,
        "nature_dmg": 0,
        "healing_effect": 0,
        "physical_dmg": 0,
        "arts_dmg": 0,
        "originium_arts_power": 0,
        "ult_charge_eff": 100,
        "link_cd_reduction": 0
      },
      "equipArmorId": null,
      "equipGlovesId": null,
      "equipAccessory1Id": null,
      "equipAccessory2Id": null,
      "linkCdReduction": 0
    },
    {
      "id": "ESTELLA",
      "actions": [
        {
          "id": "ESTELLA_skill",
          "type": "battleSkill",
          "name": "战技",
          "element": "cold",
          "duration": 2,
          "cooldown": 0,
          "icon": "/avatars/ESTELLA/icon_skill_whiten_01.png",
          "spCost": 100,
          "gaugeCost": 0,
          "gaugeGain": 6.5,
          "teamGaugeGain": 6.5,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_wi5a1dj",
          "logicalStartTime": 13.3,
          "startTime": 13.3,
          "skillId": "ESTELLA_skill",
          "hits": [
            {
              "offset": 1,
              "stagger": 10,
              "spRecovery": 0,
              "spReturn": 0,
              "effects": [
                {
                  "_id": "csi188w",
                  "type": "frozen",
                  "stacks": 1,
                  "duration": 5,
                  "offset": 1,
                  "sp": 0,
                  "stagger": 0,
                  "kind": "status",
                  "id": "frozen",
                  "name": "frozen",
                  "displayType": "frozen"
                },
                {
                  "type": "cold_attach",
                  "stacks": 1,
                  "duration": 0,
                  "offset": 1,
                  "_id": "8y2460i",
                  "kind": "infliction",
                  "element": "cold",
                  "displayType": "cold_attach"
                }
              ]
            }
          ]
        },
        {
          "id": "ESTELLA_link",
          "type": "comboSkill",
          "name": "连携",
          "element": "cold",
          "duration": 2,
          "cooldown": 15,
          "icon": "/avatars/ESTELLA/icon_combo_skill_whiten_01.png",
          "spCost": 0,
          "gaugeCost": 0,
          "gaugeGain": 10,
          "teamGaugeGain": 0,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_xywmm49",
          "logicalStartTime": 18.5,
          "startTime": 18.5,
          "skillId": "ESTELLA_link",
          "hits": [
            {
              "offset": 1,
              "stagger": 10,
              "spRecovery": 0,
              "spReturn": 0,
              "effects": [
                {
                  "type": "ice_shatter",
                  "stacks": 1,
                  "duration": 0,
                  "offset": 1,
                  "_id": "eayh788",
                  "kind": "physicalStatus",
                  "physicalType": "ice_shatter",
                  "displayType": "ice_shatter"
                },
                {
                  "type": "knockup",
                  "stacks": 3,
                  "duration": 0,
                  "offset": 1,
                  "_id": "v62886u",
                  "kind": "physicalStatus",
                  "physicalType": "knockup",
                  "displayType": "knockup"
                }
              ]
            }
          ]
        }
      ],
      "initialGauge": 0,
      "maxGaugeOverride": null,
      "gaugeEfficiency": 100,
      "originiumArtsPower": 0,
      "weaponId": null,
      "weaponCommon1Tier": 1,
      "weaponCommon2Tier": 1,
      "weaponBuffTier": 1,
      "weaponAppliedDeltas": {},
      "stats": {
        "primary_ability": 0,
        "secondary_ability": 0,
        "strength": 0,
        "agility": 0,
        "intellect": 0,
        "will": 0,
        "attack": 0,
        "hp": 0,
        "crit_rate": 0,
        "blaze_dmg": 0,
        "emag_dmg": 0,
        "cold_dmg": 0,
        "nature_dmg": 0,
        "healing_effect": 0,
        "physical_dmg": 0,
        "arts_dmg": 0,
        "originium_arts_power": 0,
        "ult_charge_eff": 100,
        "link_cd_reduction": 0
      },
      "equipArmorId": null,
      "equipGlovesId": null,
      "equipAccessory1Id": null,
      "equipAccessory2Id": null,
      "linkCdReduction": 0
    },
    {
      "id": "AKEKURI",
      "actions": [
        {
          "id": "AKEKURI_skill",
          "type": "battleSkill",
          "name": "战技",
          "element": "blaze",
          "duration": 2,
          "cooldown": 0,
          "icon": "/avatars/AKEKURI/icon_skill_karin_01.png",
          "spCost": 100,
          "gaugeCost": 0,
          "gaugeGain": 6.5,
          "teamGaugeGain": 6.5,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_hkc1ibd",
          "logicalStartTime": 0,
          "startTime": 0,
          "skillId": "AKEKURI_skill",
          "hits": [
            {
              "offset": 1.5,
              "stagger": 10,
              "spRecovery": 0,
              "spReturn": 0,
              "effects": [
                {
                  "type": "blaze_attach",
                  "stacks": 1,
                  "duration": 0,
                  "offset": 1.5,
                  "_id": "4bp7z9w",
                  "kind": "infliction",
                  "element": "blaze",
                  "displayType": "blaze_attach"
                }
              ]
            }
          ]
        },
        {
          "id": "AKEKURI_link",
          "type": "comboSkill",
          "name": "连携",
          "element": "blaze",
          "duration": 2,
          "cooldown": 15,
          "icon": "/avatars/AKEKURI/icon_combo_skill_karin_01.png",
          "spCost": 0,
          "gaugeCost": 0,
          "gaugeGain": 10,
          "teamGaugeGain": 0,
          "enhancementTime": 0,
          "animationTime": 0,
          "instanceId": "inst_ssjghlj",
          "logicalStartTime": 21.5,
          "startTime": 21.5,
          "skillId": "AKEKURI_link",
          "hits": [
            {
              "offset": 1,
              "stagger": 10,
              "spRecovery": 0,
              "spReturn": 0,
              "effects": []
            }
          ]
        }
      ],
      "initialGauge": 0,
      "maxGaugeOverride": null,
      "gaugeEfficiency": 100,
      "originiumArtsPower": 0,
      "weaponId": null,
      "weaponCommon1Tier": 1,
      "weaponCommon2Tier": 1,
      "weaponBuffTier": 1,
      "weaponAppliedDeltas": {},
      "stats": {
        "primary_ability": 0,
        "secondary_ability": 0,
        "strength": 0,
        "agility": 0,
        "intellect": 0,
        "will": 0,
        "attack": 0,
        "hp": 0,
        "crit_rate": 0,
        "blaze_dmg": 0,
        "emag_dmg": 0,
        "cold_dmg": 0,
        "nature_dmg": 0,
        "healing_effect": 0,
        "physical_dmg": 0,
        "arts_dmg": 0,
        "originium_arts_power": 0,
        "ult_charge_eff": 100,
        "link_cd_reduction": 0
      },
      "equipArmorId": null,
      "equipGlovesId": null,
      "equipAccessory1Id": null,
      "equipAccessory2Id": null,
      "linkCdReduction": 0
    }
  ],
  "connections": [
    {
      "id": "conn_y6tuuz7",
      "isConsumption": false,
      "sourcePort": "right",
      "targetPort": "left",
      "from": "inst_6wgpfl3",
      "to": "inst_m4jt0hp",
      "fromEffectIndex": 0,
      "toEffectIndex": null,
      "fromEffectId": "7380ey5",
      "toEffectId": null
    },
    {
      "id": "conn_idoc2xd",
      "isConsumption": false,
      "sourcePort": "bottom-right",
      "targetPort": "left",
      "from": "inst_m4jt0hp",
      "to": "inst_kvvfl49",
      "fromEffectIndex": null,
      "toEffectIndex": null,
      "fromEffectId": null,
      "toEffectId": null
    },
    {
      "id": "conn_w6ktlh2",
      "isConsumption": false,
      "sourcePort": "right",
      "targetPort": "left",
      "from": "inst_hkc1ibd",
      "to": "inst_wi5a1dj",
      "fromEffectIndex": 0,
      "toEffectIndex": 0,
      "fromEffectId": "4bp7z9w",
      "toEffectId": "8y2460i"
    },
    {
      "id": "conn_i2whgic",
      "isConsumption": false,
      "sourcePort": "right",
      "targetPort": "left",
      "from": "inst_wi5a1dj",
      "to": "inst_xywmm49",
      "fromEffectIndex": 1,
      "toEffectIndex": null,
      "fromEffectId": "csi188w",
      "toEffectId": null
    },
    {
      "id": "conn_lfbf55e",
      "isConsumption": false,
      "sourcePort": "bottom",
      "targetPort": "top",
      "from": "inst_wi5a1dj",
      "to": "inst_wi5a1dj",
      "fromEffectIndex": 1,
      "toEffectIndex": 0,
      "fromEffectId": "8y2460i",
      "toEffectId": "csi188w"
    },
    {
      "id": "conn_98nir0m",
      "isConsumption": false,
      "sourcePort": "right",
      "targetPort": "bottom-left",
      "from": "inst_xywmm49",
      "to": "inst_nejrrla",
      "fromEffectIndex": 1,
      "toEffectIndex": null,
      "fromEffectId": "v62886u",
      "toEffectId": null
    },
    {
      "id": "conn_iwjx9dr",
      "isConsumption": false,
      "sourcePort": "bottom-right",
      "targetPort": "left",
      "from": "inst_nejrrla",
      "to": "inst_74qhclh",
      "fromEffectIndex": null,
      "toEffectIndex": null,
      "fromEffectId": null,
      "toEffectId": null
    }
  ],
  "characterOverrides": {},
  "weaponOverrides": {},
  "equipmentCategoryOverrides": {},
  "activeEnemyId": "custom",
  "customEnemyParams": {
    "maxStagger": 125,
    "staggerNodeCount": 0,
    "staggerNodeDuration": 2,
    "staggerBreakDuration": 10,
    "executionRecovery": 25
  },
  "cycleBoundaries": [],
  "switchEvents": []
} as unknown as ScenarioData;
