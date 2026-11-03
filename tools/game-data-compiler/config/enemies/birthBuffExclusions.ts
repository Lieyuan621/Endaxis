/** 仅决定是否导出出生选项，不从通用 Buff 库删除定义，也不递归裁剪消费者。
 * 无有效动作只是初筛依据；每项排除均以当前模拟范围内的实际用途为依据。
 */
export const ENEMY_BIRTH_BUFF_EXCLUSIONS: Readonly<
  Record<
    string,
    {
      readonly category: 'presentation' | 'enemyAttack' | 'enemyMovement' | 'levelInteraction';
      readonly reason: string;
    }
  >
> = {
  buff_common_atkup: {
    category: 'enemyAttack',
    reason: '仅增加敌人攻击力；当前模型不执行敌人主动攻击。',
  },
  buff_common_speedup: {
    category: 'enemyMovement',
    reason: '仅修改地面、空中移速并控制步态、动画和表现；当前模型不模拟敌人移动。',
  },
  buff_dung_atkup: {
    category: 'enemyAttack',
    reason: '仅增加敌人攻击力并播放特效；当前模型不执行敌人主动攻击。',
  },
  buff_dung_atkup_limited: {
    category: 'enemyAttack',
    reason: '限时攻击力加成及特效，不参与当前敌人承伤计算。',
  },
  buff_dung_speedup: {
    category: 'enemyMovement',
    reason: '仅修改地面和空中移速；当前模型不模拟敌人移动。',
  },
  buff_eny_0023_aghornb_hdg001_burst: {
    category: 'enemyAttack',
    reason: 'OnSkillEnd 按生命条件修改敌人技能冷却；当前模型不执行这些技能。',
  },
  buff_eny_0052_palesent_camera: {
    category: 'presentation',
    reason: '相机表现入口，当前配置无属性修正、战斗动作或进入模拟的读取。',
  },
  buff_eny_0082_hsbear_hdg018: {
    category: 'enemyAttack',
    reason: '仅在敌人 OnOutputDamage 后生成能力实体；当前模型不执行触发该分支的敌人攻击。',
  },
  buff_eny_0085_hsrogue_hard_cdreset: {
    category: 'enemyAttack',
    reason: '仅在敌人技能结束后重设冷却；当前模型不执行敌人技能。',
  },
  buff_eny_0130_inkbiter_born_vfx: {
    category: 'enemyAttack',
    reason:
      '常驻分支为表现；施加 buff_eny_inkcommon_mech_new 的分支依赖敌人 OnOutputDamage，不进入当前模拟。',
  },
  buff_eny_0134_jsspsi_trail: {
    category: 'presentation',
    reason: '条件仅控制拖尾特效与实体显隐，不参与当前战斗计算。',
  },
  buff_harddung_atkup_limited: {
    category: 'enemyAttack',
    reason: '定时施加 buff_harddung_atkup，子 Buff 仅增加敌人攻击力；不排除另含回血的监控入口。',
  },

  buff_common_superarmor_behit_agdisk: {
    category: 'presentation',
    reason: '受击条件仅控制闪光特效和 hit_flash_cd；当前导出中该标记没有战斗读取者。',
  },
  buff_common_superarmor_behit_agshield: {
    category: 'presentation',
    reason: '受击条件仅控制闪光特效和 hit_flash_cd；当前导出中该标记没有战斗读取者。',
  },
  buff_common_superarmor_behit_hstiger: {
    category: 'presentation',
    reason: '受击条件仅控制闪光特效和 hit_flash_cd；当前导出中该标记没有战斗读取者。',
  },
  buff_common_superarmor_behit_hstiger2: {
    category: 'presentation',
    reason: '受击条件仅控制闪光特效和 hit_flash_cd；当前导出中该标记没有战斗读取者。',
  },
  buff_common_superarmor_behit_sandb: {
    category: 'presentation',
    reason: '受击条件仅控制闪光特效和 hit_flash_cd；当前导出中该标记没有战斗读取者。',
  },
  buff_common_superarmor_behit_wgshoal: {
    category: 'presentation',
    reason: '受击条件仅控制闪光特效和 hit_flash_cd；当前导出中该标记没有战斗读取者。',
  },
  buff_common_superarmor_behit_wgshoal2: {
    category: 'presentation',
    reason: '受击条件仅控制闪光特效和 hit_flash_cd；当前导出中该标记没有战斗读取者。',
  },
  buff_eny_0046_lbshamman_hdg016_easymode: {
    category: 'enemyAttack',
    reason: '由敌人主动技能 eny_0046_lbshamman_line_hdg016 读取；当前模拟不执行该技能。',
  },
  buff_eny_0046_lbshamman_hdg022_normaltag: {
    category: 'enemyAttack',
    reason: '由敌人主动技能 eny_0046_lbshamman_skill02_hdg022 读取；当前模拟不执行该技能。',
  },
  buff_eny_0082_hsbear_hdg018_normaltag: {
    category: 'enemyAttack',
    reason:
      '由 buff_eny_0082_hsbear_hdg018 的 OnOutputDamage 分支读取，依赖不参与模拟的敌人主动攻击。',
  },
  buff_eny_0089_wgreflect_base_tower010: {
    category: 'enemyAttack',
    reason: '由敌人主动技能 eny_0089_wgreflec_skill01_tower010 读取；当前模拟不执行该技能。',
  },
  buff_eny_0090_wgabyss_normaltag_hdg010: {
    category: 'enemyAttack',
    reason:
      '由 buff_eny_0090_wgabyss_State_Cold_hdg010 的 OnOutputDamage 分支读取；仅排除此标记，不排除消费者其他分支。',
  },
  buff_eny_0113_jzogre_easymode_hdg023: {
    category: 'enemyAttack',
    reason: '由敌人主动技能 eny_0113_jzogre_skill06_hdg023 读取；当前模拟不执行该技能。',
  },
  buff_eny_0114_jzmking_hdg024_normaltag: {
    category: 'enemyAttack',
    reason: '由敌人主动技能 eny_0114_jzmking_skill07_hdg024 读取；当前模拟不执行该技能。',
  },
  buff_eny_0118_klhog_horn_lighting_fx: {
    category: 'presentation',
    reason: '仅播放角部特效并结束自身 Buff；没有进入模拟的外部读取。',
  },
  buff_eny_0119_kltiger_easy_hdg026: {
    category: 'enemyAttack',
    reason: '由敌人主动技能 eny_0119_kltiger_roar_02_hdg026 读取；当前模拟不执行该技能。',
  },
  buff_eny_0119_kltiger_horn_lighting_fx: {
    category: 'levelInteraction',
    reason:
      '用于显隐表现及 int_interact_shurangyi_shockwave 系列关卡交互冲击波判断；当前模拟不执行这些交互。',
  },
};
