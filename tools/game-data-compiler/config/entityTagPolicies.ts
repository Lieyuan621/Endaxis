/** AddTagAction 的实体标签必须逐项审查；原生存在读取者不等于该读取者属于模拟范围。 */
export interface EntityTagPolicy {
  disposition: 'retain' | 'omit';
  reason: string;
}

export const ENTITY_TAG_POLICIES: Readonly<Record<string, EntityTagPolicy>> = {
  'Status/DisableCastComboSkill': {
    disposition: 'retain',
    reason: 'Skill.CheckTag 查询该标签，阻止连携技施放。',
  },
  'Status/DisableNormalSkill': {
    disposition: 'retain',
    reason: 'Skill.CheckTag 查询该标签，阻止当前主战技施放。',
  },
  'Status/DisableDash': {
    disposition: 'retain',
    reason: 'Skill.CheckTag 通过 InDisableDash 查询限制闪避。',
  },
  'Status/DontInterruptSkillBySwitchIn': {
    disposition: 'retain',
    reason: 'CharacterMainCtrlSystem.OnEnterSystem 查询该标签，决定切入主控时是否保留技能。',
  },
  'Status/Ability/Skill/CantSwitchTocCenter': {
    disposition: 'retain',
    reason: 'AbilitySystem.CheckCanSwitchCenter 查询候选干员，限制切入主控。',
  },
  'Status/CantSwitchOutCenter': {
    disposition: 'retain',
    reason: 'AbilitySystem.CheckCanSwitchCenter 查询当前主控，限制切出主控。',
  },
  'Immune/SpellInflictOnChar': {
    disposition: 'retain',
    reason: 'SpellInflictionOnChar 检查元素弱免疫子标签，父标签通过层级匹配阻止干员元素异常。',
  },
  'Status/Ability/Skill/CantSwitchPosition': {
    disposition: 'omit',
    reason: 'SwitchCenterBySkill 的位置处理分支读取；不模拟干员位置交换，不影响主控身份切换。',
  },
  'AI/Status/CanAIForceTeleport': {
    disposition: 'omit',
    reason: 'CharacterForceTeleportBehavior.OnEnter 读取；不模拟 AI 移动及传送。',
  },
  'Status/DisableRootMotionRotate': {
    disposition: 'omit',
    reason: 'MovePipelineGrounded.RotateInFrameTick 读取；不模拟根运动旋转。',
  },
  'Status/NonAITarget': {
    disposition: 'omit',
    reason:
      'CharacterAIBrain.GetTarget 等 AI 选敌入口读取；不模拟 AI 自主选敌，不能解释为无法受击。',
  },
  'Skill/Character/chr_0035_liino/ComboSkill': {
    disposition: 'omit',
    reason: '实体标签仅被梨诺终结技的武器显示条件读取；不裁剪同名的技能事件标签。',
  },
  'Skill/Enemy/Common/numshield/numshield_zero': {
    disposition: 'omit',
    reason:
      '实体查询用于护盾出生位置选择及敌方主动技能范围筛选；层叠护盾扣层和归零由 Buff 逻辑处理。',
  },
};
