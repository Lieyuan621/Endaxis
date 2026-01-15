export const CORE_STATS = [
  { id: 'primary_ability', label: '主能力', unit: 'flat', default: 0 },
  { id: 'secondary_ability', label: '副能力', unit: 'percent', default: 0 },

  { id: 'strength', label: '力量', unit: 'flat', default: 0 },
  { id: 'agility', label: '敏捷', unit: 'flat', default: 0 },
  { id: 'intellect', label: '智识', unit: 'flat', default: 0 },
  { id: 'will', label: '意志', unit: 'flat', default: 0 },

  { id: 'attack', label: '攻击', unit: 'percent', default: 0 },
  { id: 'hp', label: '生命', unit: 'percent', default: 0 },
  { id: 'crit_rate', label: '暴击率', unit: 'percent', default: 0 },

  { id: 'blaze_dmg', label: '灼热伤害', unit: 'percent', default: 0 },
  { id: 'emag_dmg', label: '电磁伤害', unit: 'percent', default: 0 },
  { id: 'cold_dmg', label: '寒冷伤害', unit: 'percent', default: 0 },
  { id: 'nature_dmg', label: '自然伤害', unit: 'percent', default: 0 },

  { id: 'healing_effect', label: '治疗效果', unit: 'percent', default: 0 },
  { id: 'physical_dmg', label: '物理伤害', unit: 'percent', default: 0 },
  { id: 'arts_dmg', label: '法术伤害', unit: 'percent', default: 0 },

  { id: 'originium_arts_power', label: '源石技艺强度', unit: 'flat', default: 0 },
  { id: 'ult_charge_eff', label: '终结技充能效率', unit: 'percent', default: 100 },
  { id: 'link_cd_reduction', label: '连携冷却缩减', unit: 'percent', default: 0 },
]

export function createDefaultStats() {
  const stats = {}
  for (const stat of CORE_STATS) {
    stats[stat.id] = stat.default
  }
  return stats
}