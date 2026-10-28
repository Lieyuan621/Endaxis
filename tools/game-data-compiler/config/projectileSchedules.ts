import type { ProjectileScheduleConfiguration } from '../src/compiler/abilities/projectileScheduleConfiguration.ts';

/** 按当前原生资源定位发射动作，配置其回调时间表。 */
// 终结技弹体1/3：抛物线模式1，弧顶高于两端较高点0.5米、参数总时长0.2秒；EntityBB_speed不参与此模式的轨迹构造。
// 保留各发射入口的出生及目标偏移，敌人中心3米，干员/镜头面向敌人，忽略挂点。
// 对首个球体触地时间积分原生距离倍率与5秒归一化速度曲线；WallAndGround先阻挡，取消到达回调。
// 终结技弹体2：Custom掩码193包含Default(0)、Walkable(6)、Climbable(7)，不含Terrain(20)。
// 固定平地近似采用Walkable；沿用模式1的弧顶/时长公式及原生速度曲线，取到达或地面阻挡中先发生者。
// 浮空起手的两侧散射：采用对目标有效的直射模型，3米有效路程、速度50米/秒，2帧命中；不根据任意选取的敌人胶囊裁掉两侧伤害。
const purrchenaUltimateSchedules: readonly {
  indices: readonly number[];
  schedule: ProjectileScheduleConfiguration['schedule'];
}[] = [
  {
    indices: [101, 103],
    schedule: {
      endFrame: 17,
      callbacks: [
        { event: 'block', triggerFrames: [17] },
        { event: 'reach', triggerFrames: [] },
      ],
    },
  },
  {
    indices: [110, 119, 191, 195, 197, 259, 268, 277],
    schedule: {
      endFrame: 13,
      callbacks: [
        { event: 'block', triggerFrames: [13] },
        { event: 'reach', triggerFrames: [] },
      ],
    },
  },
  {
    indices: [124, 144, 147, 167, 204, 215, 217, 220, 231, 233, 282, 312],
    schedule: {
      endFrame: 7,
      callbacks: [
        { event: 'block', triggerFrames: [7] },
        { event: 'reach', triggerFrames: [] },
      ],
    },
  },
  {
    indices: [131, 140, 154, 163, 207, 213, 223, 229, 289, 298, 307, 319, 328, 337],
    schedule: {
      endFrame: 9,
      callbacks: [
        { event: 'block', triggerFrames: [9] },
        { event: 'reach', triggerFrames: [] },
      ],
    },
  },
  {
    indices: [188, 199, 201],
    schedule: {
      endFrame: 16,
      callbacks: [
        { event: 'block', triggerFrames: [16] },
        { event: 'reach', triggerFrames: [] },
      ],
    },
  },
  {
    indices: [211, 227],
    schedule: {
      endFrame: 10,
      callbacks: [
        { event: 'block', triggerFrames: [10] },
        { event: 'reach', triggerFrames: [] },
      ],
    },
  },
  {
    indices: [252],
    schedule: {
      endFrame: 18,
      callbacks: [
        { event: 'block', triggerFrames: [18] },
        { event: 'reach', triggerFrames: [] },
      ],
    },
  },
  {
    indices: [106, 112, 115, 121, 255, 261, 264, 270, 273, 279],
    schedule: {
      endFrame: 12,
      callbacks: [
        { event: 'block', triggerFrames: [] },
        { event: 'reach', triggerFrames: [12] },
      ],
    },
  },
  {
    indices: [
      127, 133, 136, 142, 150, 156, 159, 165, 285, 291, 294, 300, 303, 309, 315, 321, 324, 330, 333,
      339,
    ],
    schedule: {
      endFrame: 9,
      callbacks: [
        { event: 'block', triggerFrames: [] },
        { event: 'reach', triggerFrames: [9] },
      ],
    },
  },
];

export const projectileSchedules: ReadonlyMap<string, ProjectileScheduleConfiguration> = new Map([
  ...purrchenaUltimateSchedules.flatMap(({ indices, schedule }) =>
    indices.map((index): [string, ProjectileScheduleConfiguration] => [
      `chr_0038_purrche_ultimate_skill:${index}`,
      { schedule },
    ]),
  ),
  // 汤汤｜Buff 水弹：起点 tar01+[0,1.5,0]，终点 tar01+[2.5,0.3,2.5]；目标基点取地面，原生距离倍率1.706787和速度曲线积分至半径0.3触地，0.635925秒取20帧。
  [
    'buff_chr_0027_tangtang_water_call:0',
    {
      schedule: {
        endFrame: 20,
        callbacks: [{ event: 'block', triggerFrames: [20] }],
      },
    },
  ],
  // 昼雪｜连携非主控分支：原生终点为主控；队友同站位且忽略 WepL 挂点，起点已在0.3米到达范围内，首帧到达。
  [
    'chr_0014_aurora_combo_skill:21',
    {
      schedule: {
        endFrame: 1,
        callbacks: [{ event: 'reach', triggerFrames: [1] }],
      },
    },
  ],
  // 狼卫｜普攻第一段第二枪：原生起点 [-0.185,1.526,0]，3 米点目标；弦长 3.370890 米，速度 40、半径 0.2，取 3 帧。
  [
    'chr_0006_wolfgd_attack1:8',
    {
      schedule: {
        endFrame: 3,
        callbacks: [{ event: 'hit', triggerFrames: [3] }],
      },
    },
  ],
  // 梨诺｜战技「闪耀焦点」：向较远的自身上空固定点上射。
  // 取值依据：起点 [0.5,0,0]，终点 [-2,7,-1.5]，弦长 7.582875 米；原生曲线积分到 0.2 米到达阈值需 0.473751 秒，取 15 帧。
  [
    'chr_0035_liino_normal_skill:22',
    {
      schedule: {
        endFrame: 15,
        callbacks: [{ event: 'reach', triggerFrames: [15] }],
      },
    },
  ],
  // 噗切娜｜连携技「点心还是“礼物”」：较低起点的礼盒入口 408。
  // 取值依据：队友同站位，起点高度 1+0.6 米、主控目标偏移高 0.6 米；二阶曲线及距离倍率计算 0.050787 秒，取 2 帧。
  [
    'chr_0038_purrche_combo_skill:408',
    {
      schedule: {
        endFrame: 2,
        callbacks: [{ event: 'hit', triggerFrames: [2] }],
      },
    },
  ],
  // 噗切娜｜连携技「点心还是“礼物”」：较低起点的礼盒入口 314。
  // 取值依据：队友同站位，起点高度 1+0.6 米、主控目标偏移高 0.6 米；二阶曲线及距离倍率计算 0.050787 秒，取 2 帧。
  [
    'chr_0038_purrche_combo_skill:314',
    {
      schedule: {
        endFrame: 2,
        callbacks: [{ event: 'hit', triggerFrames: [2] }],
      },
    },
  ],
  // 赛希｜连携技「压力测试」：无球分支直接从施放者发射，与节点 17 的能力实体起点分开配置。
  // 取值依据：同高 3 米端点、原生 0.5 米到达阈值，速度 45×C(t/5)；曲线积分 2.5 米得到 0.069441 秒，取 3 帧，忽略挂点。
  [
    'chr_0011_seraph_combo_skill:21',
    {
      schedule: {
        endFrame: 3,
        callbacks: [{ event: 'hit', triggerFrames: [3] }],
      },
    },
  ],
  // 艾维文娜｜连携技「雷枪·掣击」：掷出三支雷枪的去程，配置落地回调。
  // 取值依据：原生连携节点 24～26 生成相对 SourceForward 的固定落点 [3,0,5]、[0,0,6]、[-3,0,5]，节点 28 从 Owner 的 WepR 挂点发射，偏移为零。忽略挂点水平偏移，以离地 1 米近似；水平距离分别 sqrt(34)、6、sqrt(34) 米，不是敌我距离。原生水平速度 50、重力 250，曲线恒 1，无距离倍率；T=L/50、vy=-h/T+250T/2，球半径 0.01 米触地均在第 4 帧。高度 0.5～2 米取值均不改变帧数；平地且无沿途墙体近似，触发 block 后结束。
  [
    'chr_0012_avywen_combo_skill:28',
    {
      schedule: {
        endFrame: 4,
        callbacks: [{ event: 'block', triggerFrames: [4] }],
      },
    },
  ],
  // 艾维文娜｜终结技「雷枪·决颤」：投下强雷枪的去程。
  // 取值依据：原生终结技节点 23 从 Owner 的 VBHit 挂点发射到 SourceForward 前方 8 米固定落点，发射偏移为零；水平速度 70、重力 250、速度曲线恒为 1，无距离倍率。T=8/70，vy=-h/T+250T/2；平地、挂点高度 h=1 米近似，球半径 0.01 米触地约 0.11385 秒，取 4 帧。h=0.5～2 米敏感性计算均为 4 帧；不表示已取得真实骨骼高度。WallAndGround 阻挡后触发 block 并结束，忽略沿途墙体。
  [
    'chr_0012_avywen_ultimate_skill:23',
    {
      schedule: {
        endFrame: 4,
        callbacks: [{ event: 'block', triggerFrames: [4] }],
      },
    },
  ],
  // 艾维文娜｜战技「雷枪·截回」：召回连携技留下的普通雷枪，穿透命中后返回。
  // 取值依据：返回路径采用一维径向模型，不使用敌人胶囊或挂点高度。普通雷枪取6米固定落点再向外4米，即10米起点；强雷枪8+4=12米。保留原生35米/秒及距离倍率，分别得35、43.764米/秒；经过距干员3米位置视为有效命中，ceil((D-3)/v×30)为6/7帧，到达原生0.5米阈值为9/8帧。共享普通雷枪取中路代表，不展开路径。
  [
    'chr_0012_avywen_normal_skill:67',
    {
      schedule: {
        endFrame: 9,
        callbacks: [
          { event: 'hit', triggerFrames: [6] },
          { event: 'reach', triggerFrames: [9] },
        ],
      },
    },
  ],
  // 艾维文娜｜战技「雷枪·截回」：召回终结技留下的强雷枪。
  // 取值依据：返回路径采用一维径向模型，不使用敌人胶囊或挂点高度。普通雷枪取6米固定落点再向外4米，即10米起点；强雷枪8+4=12米。保留原生35米/秒及距离倍率，分别得35、43.764米/秒；经过距干员3米位置视为有效命中，ceil((D-3)/v×30)为6/7帧，到达原生0.5米阈值为9/8帧。共享普通雷枪取中路代表，不展开路径。
  [
    'chr_0012_avywen_normal_skill:75',
    {
      schedule: {
        endFrame: 8,
        callbacks: [
          { event: 'hit', triggerFrames: [7] },
          { event: 'reach', triggerFrames: [8] },
        ],
      },
    },
  ],
  // 汤汤｜普攻「崩你脑壳！」第一段：射向敌人的子弹。
  // 取值依据：有效路程3米，原生匀速55米/秒；ceil(3/55×30)=2帧，不再额外扣碰撞半径。
  [
    'chr_0027_tangtang_attack1:6',
    {
      schedule: {
        endFrame: 2,
        callbacks: [{ event: 'hit', triggerFrames: [2] }],
      },
    },
  ],
  // 汤汤｜普攻「崩你脑壳！」第三段：四个发射动作分别配置，使用相同的命中时延。
  // 取值依据：四个发射共用对目标有效的直射简化模型，3米有效路程、原生40米/秒，ceil(3/40×30)=3帧；不以固定小胶囊判断散射脱靶。
  ...[14, 15, 16, 17].map((index): [string, ProjectileScheduleConfiguration] => [
    `chr_0027_tangtang_attack3:${index}`,
    {
      schedule: {
        endFrame: 8,
        callbacks: [{ event: 'hit', triggerFrames: [3] }],
      },
    },
  ]),
  // 萤石｜普攻第一段：发射点前移 0.95 米，按原生偏移计算，ceil((2.482438−0.2)/70×30)=1；其余共享弹体入口使用默认 2 帧。
  [
    'chr_0022_bounda_attack1:7',
    {
      schedule: {
        endFrame: 1,
        callbacks: [{ event: 'hit', triggerFrames: [1] }],
      },
    },
  ],
  // 梨诺终结技：能力实体在施放者脚下生成；目标分支为敌人3米，空目标分支为前方6米，固定偏移均采用SourceForward。
  // 原生三次贝塞尔，随机控制点取中值；Shape=None 的到达阈值0.5米，按40×C(t/finishDuration)积分参数时钟，距离倍率为1。
  // projectile_chr_0035_liino_ultskill_l_01：起点 [-3,2,-4.5]，终点 [-3,0,2]，弦长 6.800735 米；到达用时 0.331893 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:49',
    {
      schedule: {
        endFrame: 10,
        callbacks: [{ event: 'reach', triggerFrames: [10] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_01：起点 [-3,2,-4.5]，终点 [-3,0,5]，弦长 9.708244 米；到达用时 0.468526 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:51',
    {
      schedule: {
        endFrame: 15,
        callbacks: [{ event: 'reach', triggerFrames: [15] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_02：起点 [-3,6,-6]，终点 [-6,0,3.5]，弦长 11.629703 米；到达用时 0.555751 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:21',
    {
      schedule: {
        endFrame: 17,
        callbacks: [{ event: 'reach', triggerFrames: [17] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_02：起点 [-3,6,-6]，终点 [-6,0,6.5]，弦长 14.186261 米；到达用时 0.668013 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:23',
    {
      schedule: {
        endFrame: 21,
        callbacks: [{ event: 'reach', triggerFrames: [21] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_02：起点 [-3,4.5,-6]，终点 [-4.5,0,5.5]，弦长 12.439855 米；到达用时 0.591820 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:27',
    {
      schedule: {
        endFrame: 18,
        callbacks: [{ event: 'reach', triggerFrames: [18] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_02：起点 [-3,4.5,-6]，终点 [-4.5,0,8.5]，弦长 15.256146 米；到达用时 0.713631 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:29',
    {
      schedule: {
        endFrame: 22,
        callbacks: [{ event: 'reach', triggerFrames: [22] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_02：起点 [-3,4,-6]，终点 [-4,0,3]，弦长 9.899495 米；到达用时 0.477219 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:33',
    {
      schedule: {
        endFrame: 15,
        callbacks: [{ event: 'reach', triggerFrames: [15] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_02：起点 [-3,4,-6]，终点 [-4,0,6]，弦长 12.688578 米；到达用时 0.602802 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:35',
    {
      schedule: {
        endFrame: 19,
        callbacks: [{ event: 'reach', triggerFrames: [19] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_02：起点 [-3,2,-4.5]，终点 [-1,0,0]，弦长 5.315073 米；到达用时 0.260118 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:55',
    {
      schedule: {
        endFrame: 8,
        callbacks: [{ event: 'reach', triggerFrames: [8] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_02：起点 [-3,2,-4.5]，终点 [-1,0,3]，弦长 8.015610 米；到达用时 0.389490 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:57',
    {
      schedule: {
        endFrame: 12,
        callbacks: [{ event: 'reach', triggerFrames: [12] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_02：起点 [-3,3,-4.5]，终点 [-0.2,0,-1]，弦长 5.393515 米；到达用时 0.263929 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:61',
    {
      schedule: {
        endFrame: 8,
        callbacks: [{ event: 'reach', triggerFrames: [8] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_02：起点 [-3,3,-4.5]，终点 [-0.2,0,2]，弦长 7.687002 米；到达用时 0.373963 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:63',
    {
      schedule: {
        endFrame: 12,
        callbacks: [{ event: 'reach', triggerFrames: [12] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_03：起点 [-3,6,-6]，终点 [-0.5,0,3]，弦长 11.101802 米；到达用时 0.529342 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:3',
    {
      schedule: {
        endFrame: 16,
        callbacks: [{ event: 'reach', triggerFrames: [16] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_03：起点 [-3,6,-6]，终点 [-0.5,0,5.8]，弦长 13.471822 米；到达用时 0.634545 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:5',
    {
      schedule: {
        endFrame: 20,
        callbacks: [{ event: 'reach', triggerFrames: [20] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_03：起点 [-3,5,-6]，终点 [-1,0,4]，弦长 11.357817 米；到达用时 0.540893 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:9',
    {
      schedule: {
        endFrame: 17,
        callbacks: [{ event: 'reach', triggerFrames: [17] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_03：起点 [-3,5,-6]，终点 [-1,0,7]，弦长 14.071247 米；到达用时 0.660531 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:11',
    {
      schedule: {
        endFrame: 20,
        callbacks: [{ event: 'reach', triggerFrames: [20] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_03：起点 [-3,4,-6]，终点 [-2.5,0,5]，弦长 11.715375 米；到达用时 0.556951 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:15',
    {
      schedule: {
        endFrame: 17,
        callbacks: [{ event: 'reach', triggerFrames: [17] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_03：起点 [-3,4,-6]，终点 [-2.5,0,8]，弦长 14.568802 米；到达用时 0.681908 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:17',
    {
      schedule: {
        endFrame: 21,
        callbacks: [{ event: 'reach', triggerFrames: [21] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_03：起点 [-3,6,-6]，终点 [-2.5,0,1]，弦长 9.233093 米；到达用时 0.443695 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:39',
    {
      schedule: {
        endFrame: 14,
        callbacks: [{ event: 'reach', triggerFrames: [14] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_l_03：起点 [-3,6,-6]，终点 [-2.5,0,4]，弦长 11.672618 米；到达用时 0.555035 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:41',
    {
      schedule: {
        endFrame: 17,
        callbacks: [{ event: 'reach', triggerFrames: [17] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_01：起点 [3,2,-4.5]，终点 [3,0,2]，弦长 6.800735 米；到达用时 0.332818 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:50',
    {
      schedule: {
        endFrame: 10,
        callbacks: [{ event: 'reach', triggerFrames: [10] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_01：起点 [3,2,-4.5]，终点 [3,0,5]，弦长 9.708244 米；到达用时 0.470891 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:52',
    {
      schedule: {
        endFrame: 15,
        callbacks: [{ event: 'reach', triggerFrames: [15] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_02：起点 [3,6,-6]，终点 [6,0,3.5]，弦长 11.629703 米；到达用时 0.559436 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:22',
    {
      schedule: {
        endFrame: 17,
        callbacks: [{ event: 'reach', triggerFrames: [17] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_02：起点 [3,6,-6]，终点 [6,0,6.5]，弦长 14.186261 米；到达用时 0.673840 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:24',
    {
      schedule: {
        endFrame: 21,
        callbacks: [{ event: 'reach', triggerFrames: [21] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_02：起点 [3,4.5,-6]，终点 [4.5,0,5.5]，弦长 12.439855 米；到达用时 0.596142 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:28',
    {
      schedule: {
        endFrame: 18,
        callbacks: [{ event: 'reach', triggerFrames: [18] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_02：起点 [3,4.5,-6]，终点 [4.5,0,8.5]，弦长 15.256146 米；到达用时 0.720451 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:30',
    {
      schedule: {
        endFrame: 22,
        callbacks: [{ event: 'reach', triggerFrames: [22] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_02：起点 [3,4,-6]，终点 [4,0,3]，弦长 9.899495 米；到达用时 0.479698 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:34',
    {
      schedule: {
        endFrame: 15,
        callbacks: [{ event: 'reach', triggerFrames: [15] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_02：起点 [3,4,-6]，终点 [4,0,6]，弦长 12.688578 米；到达用时 0.607328 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:36',
    {
      schedule: {
        endFrame: 19,
        callbacks: [{ event: 'reach', triggerFrames: [19] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_02：起点 [3,2,-4.5]，终点 [1,0,0]，弦长 5.315073 米；到达用时 0.260576 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:56',
    {
      schedule: {
        endFrame: 8,
        callbacks: [{ event: 'reach', triggerFrames: [8] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_02：起点 [3,2,-4.5]，终点 [1,0,3]，弦长 8.015610 米；到达用时 0.390923 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:58',
    {
      schedule: {
        endFrame: 12,
        callbacks: [{ event: 'reach', triggerFrames: [12] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_02：起点 [3,3,-4.5]，终点 [0.2,0,-1]，弦长 5.393515 米；到达用时 0.264407 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:62',
    {
      schedule: {
        endFrame: 8,
        callbacks: [{ event: 'reach', triggerFrames: [8] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_02：起点 [3,3,-4.5]，终点 [0.2,0,2]，弦长 7.687002 米；到达用时 0.375245 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:64',
    {
      schedule: {
        endFrame: 12,
        callbacks: [{ event: 'reach', triggerFrames: [12] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_03：起点 [3,6,-6]，终点 [0.5,0,3]，弦长 11.101802 米；到达用时 0.528126 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:4',
    {
      schedule: {
        endFrame: 16,
        callbacks: [{ event: 'reach', triggerFrames: [16] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_03：起点 [3,6,-6]，终点 [0.5,0,5.8]，弦长 13.471822 米；到达用时 0.635395 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:6',
    {
      schedule: {
        endFrame: 20,
        callbacks: [{ event: 'reach', triggerFrames: [20] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_03：起点 [3,5,-6]，终点 [1,0,4]，弦长 11.357817 米；到达用时 0.539884 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:10',
    {
      schedule: {
        endFrame: 17,
        callbacks: [{ event: 'reach', triggerFrames: [17] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_03：起点 [3,5,-6]，终点 [1,0,7]，弦长 14.071247 米；到达用时 0.661953 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:12',
    {
      schedule: {
        endFrame: 20,
        callbacks: [{ event: 'reach', triggerFrames: [20] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_03：起点 [3,4,-6]，终点 [2.5,0,5]，弦长 11.715375 米；到达用时 0.556236 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:16',
    {
      schedule: {
        endFrame: 17,
        callbacks: [{ event: 'reach', triggerFrames: [17] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_03：起点 [3,4,-6]，终点 [2.5,0,8]，弦长 14.568802 米；到达用时 0.683819 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:18',
    {
      schedule: {
        endFrame: 21,
        callbacks: [{ event: 'reach', triggerFrames: [21] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_03：起点 [3,6,-6]，终点 [2.5,0,1]，弦长 9.233093 米；到达用时 0.441126 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:40',
    {
      schedule: {
        endFrame: 14,
        callbacks: [{ event: 'reach', triggerFrames: [14] }],
      },
    },
  ],
  // projectile_chr_0035_liino_ultskill_r_03：起点 [3,6,-6]，终点 [2.5,0,4]，弦长 11.672618 米；到达用时 0.554285 秒。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:42',
    {
      schedule: {
        endFrame: 17,
        callbacks: [{ event: 'reach', triggerFrames: [17] }],
      },
    },
  ],
  // 梨诺终结技末次弹体：空目标分支由高处飞往前方6米，独立计算为8帧。
  [
    'chr_0035_liino_ultimate_skill_projhit_abilityentity:46',
    {
      schedule: {
        endFrame: 8,
        callbacks: [{ event: 'reach', triggerFrames: [8] }],
      },
    },
  ],
  // 梨诺普攻第三段第四枚：固定偏移增大弦长至3.111270米，原生曲线积分0.169288秒，取6帧。
  [
    'chr_0035_liino_attack3:24',
    {
      schedule: {
        endFrame: 6,
        callbacks: [{ event: 'hit', triggerFrames: [6] }],
      },
    },
  ],
  // 提弗洛斯连携：固定前方10米入口，按实际黑板速度42、重力25和0.5米到达阈值算得7帧。
  [
    'chr_0034_typhoea_combo_skill:54',
    {
      schedule: {
        endFrame: 7,
        callbacks: [{ event: 'hit', triggerFrames: [7] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_combo_skill:60',
    {
      schedule: {
        endFrame: 7,
        callbacks: [{ event: 'hit', triggerFrames: [7] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_combo_skill:66',
    {
      schedule: {
        endFrame: 7,
        callbacks: [{ event: 'hit', triggerFrames: [7] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_combo_skill:72',
    {
      schedule: {
        endFrame: 7,
        callbacks: [{ event: 'hit', triggerFrames: [7] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_combo_skill:78',
    {
      schedule: {
        endFrame: 7,
        callbacks: [{ event: 'hit', triggerFrames: [7] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_combo_skill:84',
    {
      schedule: {
        endFrame: 7,
        callbacks: [{ event: 'hit', triggerFrames: [7] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_combo_skillfloating:74',
    {
      schedule: {
        endFrame: 7,
        callbacks: [{ event: 'hit', triggerFrames: [7] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_combo_skillfloating:80',
    {
      schedule: {
        endFrame: 7,
        callbacks: [{ event: 'hit', triggerFrames: [7] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_combo_skillfloating:86',
    {
      schedule: {
        endFrame: 7,
        callbacks: [{ event: 'hit', triggerFrames: [7] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_combo_skillfloating:92',
    {
      schedule: {
        endFrame: 7,
        callbacks: [{ event: 'hit', triggerFrames: [7] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_combo_skillfloating:98',
    {
      schedule: {
        endFrame: 7,
        callbacks: [{ event: 'hit', triggerFrames: [7] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_combo_skillfloating:104',
    {
      schedule: {
        endFrame: 7,
        callbacks: [{ event: 'hit', triggerFrames: [7] }],
      },
    },
  ],
  // 提弗洛斯连携主弹体：固定点入口及浮空入口的速度/目标高度差异，见对应预设的公式依据。
  [
    'chr_0034_typhoea_combo_skill:95',
    {
      schedule: {
        endFrame: 9,
        callbacks: [{ event: 'hit', triggerFrames: [9] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_combo_skillfloating:107',
    {
      schedule: {
        endFrame: 2,
        callbacks: [{ event: 'hit', triggerFrames: [2] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_combo_skillfloating:112',
    {
      schedule: {
        endFrame: 11,
        callbacks: [{ event: 'hit', triggerFrames: [11] }],
      },
    },
  ],
  // 提弗洛斯下落攻击的两个近侧地面落点，几何和起跳高度依据见预设。
  [
    'chr_0034_typhoea_plunging_attack_start:15',
    {
      schedule: {
        endFrame: 1,
        callbacks: [{ event: 'reach', triggerFrames: [1] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_plunging_attack_start:17',
    {
      schedule: {
        endFrame: 1,
        callbacks: [{ event: 'reach', triggerFrames: [1] }],
      },
    },
  ],
  // 礼盒弹体combo_skill_3：gene(0/1)在主控Head上方0.6米生成礼盒，发射再加0.2米；忽略骨骼高度，以0.8米为近似起点。
  // 二次Bezier：控制点轴向0.2、上偏0.35；速度35乘原生距离曲线，再积分5秒归一化速度曲线。
  // 入口42瞄准3米敌人脚下，球半径0.1先触地，0.209954秒取7帧；44/46为前方10/7米、高1米固定点，分别0.303973/0.327429秒取10帧。
  [
    'chr_0038_purrche_combo_skill_giftbox_abilityrange:42',
    {
      schedule: {
        endFrame: 7,
        callbacks: [
          { event: 'block', triggerFrames: [7] },
          { event: 'reach', triggerFrames: [] },
        ],
      },
    },
  ],
  [
    'chr_0038_purrche_combo_skill_giftbox_abilityrange:44',
    {
      schedule: {
        endFrame: 10,
        callbacks: [
          { event: 'block', triggerFrames: [] },
          { event: 'reach', triggerFrames: [10] },
        ],
      },
    },
  ],
  [
    'chr_0038_purrche_combo_skill_giftbox_abilityrange:46',
    {
      schedule: {
        endFrame: 10,
        callbacks: [
          { event: 'block', triggerFrames: [] },
          { event: 'reach', triggerFrames: [10] },
        ],
      },
    },
  ],
  // 礼盒combo_skill_1固定前方落点：10米取13帧、7米取12帧，保留0.1米目标高度，先到达而非触地。
  [
    'chr_0038_purrche_combo_skill_giftbox_abilityrange:22',
    {
      schedule: {
        endFrame: 13,
        callbacks: [
          { event: 'block', triggerFrames: [] },
          { event: 'reach', triggerFrames: [13] },
        ],
      },
    },
  ],
  [
    'chr_0038_purrche_combo_skill_giftbox_abilityrange:32',
    {
      schedule: {
        endFrame: 13,
        callbacks: [
          { event: 'block', triggerFrames: [] },
          { event: 'reach', triggerFrames: [13] },
        ],
      },
    },
  ],
  [
    'chr_0038_purrche_combo_skill_giftbox_abilityrange:24',
    {
      schedule: {
        endFrame: 12,
        callbacks: [
          { event: 'block', triggerFrames: [] },
          { event: 'reach', triggerFrames: [12] },
        ],
      },
    },
  ],
  [
    'chr_0038_purrche_combo_skill_giftbox_abilityrange:34',
    {
      schedule: {
        endFrame: 12,
        callbacks: [
          { event: 'block', triggerFrames: [] },
          { event: 'reach', triggerFrames: [12] },
        ],
      },
    },
  ],
  [
    'chr_0034_typhoea_normal_skill_floating_start:38',
    {
      schedule: {
        endFrame: 2,
        callbacks: [{ event: 'hit', triggerFrames: [2] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_normal_skill_floating_start:48',
    {
      schedule: {
        endFrame: 2,
        callbacks: [{ event: 'hit', triggerFrames: [2] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_normal_skill_floating_start:60',
    {
      schedule: {
        endFrame: 2,
        callbacks: [{ event: 'hit', triggerFrames: [2] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_normal_skill_floating_start:70',
    {
      schedule: {
        endFrame: 2,
        callbacks: [{ event: 'hit', triggerFrames: [2] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_normal_skill_floating_start:40',
    {
      schedule: {
        endFrame: 2,
        callbacks: [{ event: 'hit', triggerFrames: [2] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_normal_skill_floating_start:50',
    {
      schedule: {
        endFrame: 2,
        callbacks: [{ event: 'hit', triggerFrames: [2] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_normal_skill_floating_start:62',
    {
      schedule: {
        endFrame: 2,
        callbacks: [{ event: 'hit', triggerFrames: [2] }],
      },
    },
  ],
  [
    'chr_0034_typhoea_normal_skill_floating_start:72',
    {
      schedule: {
        endFrame: 2,
        callbacks: [{ event: 'hit', triggerFrames: [2] }],
      },
    },
  ],
]);
