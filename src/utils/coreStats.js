export const CORE_STATS = [
  { id: 'primary_ability', labelKey: 'stats.primary_ability', label: '主能力', default: 0 },
  { id: 'secondary_ability', labelKey: 'stats.secondary_ability', label: '副能力', default: 0 },

  { id: 'strength', labelKey: 'stats.strength', label: '力量', default: 0 },
  { id: 'agility', labelKey: 'stats.agility', label: '敏捷', default: 0 },
  { id: 'intellect', labelKey: 'stats.intellect', label: '智识', default: 0 },
  { id: 'will', labelKey: 'stats.will', label: '意志', default: 0 },

  { id: 'attack', labelKey: 'stats.attack', label: '攻击', default: 0 },
  { id: 'hp', labelKey: 'stats.hp', label: '生命', default: 0 },
  { id: 'crit_rate', labelKey: 'stats.crit_rate', label: '暴击率', default: 0 },

  { id: 'blaze_dmg', labelKey: 'stats.blaze_dmg', label: '灼热伤害', default: 0 },
  { id: 'emag_dmg', labelKey: 'stats.emag_dmg', label: '电磁伤害', default: 0 },
  { id: 'cold_dmg', labelKey: 'stats.cold_dmg', label: '寒冷伤害', default: 0 },
  { id: 'nature_dmg', labelKey: 'stats.nature_dmg', label: '自然伤害', default: 0 },

  { id: 'healing_effect', labelKey: 'stats.healing_effect', label: '治疗效果', default: 0 },
  { id: 'physical_dmg', labelKey: 'stats.physical_dmg', label: '物理伤害', default: 0 },
  { id: 'arts_dmg', labelKey: 'stats.arts_dmg', label: '法术伤害', default: 0 },

  { id: 'attack_dmg_bonus', labelKey: 'stats.attack_dmg_bonus', label: '普通攻击伤害加成', default: 0 },
  { id: 'skill_dmg_bonus', labelKey: 'stats.skill_dmg_bonus', label: '战技伤害加成', default: 0 },
  { id: 'link_dmg_bonus', labelKey: 'stats.link_dmg_bonus', label: '连携技伤害加成', default: 0 },
  { id: 'ultimate_dmg_bonus', labelKey: 'stats.ultimate_dmg_bonus', label: '终结技伤害加成', default: 0 },
  { id: 'all_skill_dmg_bonus', labelKey: 'stats.all_skill_dmg_bonus', label: '所有技能伤害加成', default: 0 },
  { id: 'broken_dmg_bonus', labelKey: 'stats.broken_dmg_bonus', label: '对失衡目标伤害加成', default: 0 },

  { id: 'originium_arts_power', labelKey: 'stats.originium_arts_power', label: '源石技艺强度', default: 0 },
  { id: 'ult_charge_eff', labelKey: 'stats.ult_charge_eff', label: '终结技充能效率', default: 100 },
  { id: 'link_cd_reduction', labelKey: 'stats.link_cd_reduction', label: '连携冷却缩减', default: 0 },
]

export function createDefaultStats() {
  const stats = {}
  for (const stat of CORE_STATS) {
    stats[stat.id] = stat.default
  }
  return stats
}