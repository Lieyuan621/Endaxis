import type { ProjectileCallbackSchedule } from '../../../packages/game-data-contract/src/projectileSchedule.ts';

export interface ProjectileSchedulePreset {
  readonly endFrame: number;
  readonly callbacks: Partial<Record<ProjectileCallbackSchedule['event'], readonly number[]>>;
}

/** 木桩场景的固定近似值，生成时复制到各发射节点，运行时不模拟弹道。
 * 普通直射采用3米有效路程，不代表敌人中心坐标；其他场景独立定义端点。上下文目标、实体、固定点及局部偏移必须按发射动作分别解析。
 * 固定落点、落地和返回路径不得套用直射有效路程。
 * 注释中的技能名取自中文技能描述；发射来源按资源关联核对。 */
export const projectileSchedulePresets: Readonly<Record<string, ProjectileSchedulePreset>> = {
  // 佩丽卡｜连携技「即时协议·闪链」：释放积蓄的电磁能量轰击目标；对应命中及导电效果。
  // 发射来源：chr_0004_pelica_combo_skill。
  // 取值依据：原生有主目标时，将 MainTargetFinder 结果存入 tar；只有无目标分支才取前方固定点。木桩模型始终有敌人，按 Owner 到 tar 的 3 米同高端点估算。无碰撞形状，原生 _CalculateReachDistance（1.6.3 RVA 0x0576C140）取到达阈值 0.5 米；hitOnReach=true，匀速 40 米/秒，ceil((3 - 0.5) / 40 × 30) = 2 帧，忽略骨骼挂点。
  projectile_chr_0004_pelica_combo_skill: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 佩丽卡｜普攻第 1 段「协议α·突破」：直线飞行的攻击弹体。
  // 发射来源：chr_0004_pelica_attack1。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度40米/秒且速度曲线恒1，ceil(3 / 40 × 30) = 3帧。
  projectile_chr_0004_pelica_normal_attack1: {
    endFrame: 3,
    callbacks: {
      hit: [3],
    },
  },
  // 佩丽卡｜普攻第 2 段「协议α·突破」：直线飞行的攻击弹体。
  // 发射来源：chr_0004_pelica_attack2。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度52米/秒且速度曲线恒1，ceil(3 / 52 × 30) = 2帧。
  projectile_chr_0004_pelica_normal_attack2: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 佩丽卡｜普攻第 3 段「协议α·突破」：直线飞行的攻击弹体。
  // 发射来源：chr_0004_pelica_attack3。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度50米/秒且速度曲线恒1，ceil(3 / 50 × 30) = 2帧。
  projectile_chr_0004_pelica_normal_attack3: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 佩丽卡｜普攻第 4 段「协议α·突破」：直线飞行的攻击弹体。
  // 发射来源：chr_0004_pelica_attack4。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度70米/秒且速度曲线恒1，ceil(3 / 70 × 30) = 2帧。
  projectile_chr_0004_pelica_normal_attack4: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 佩丽卡｜普攻（下落攻击）「协议α·突破」：下落攻击落地时向周围发出的短程碎片，本配置不触发其命中。
  // 发射来源：chr_0004_pelica_plunging_attack_end。
  // 取值依据：入口14~17的Target为Source，终点是施放者局部偏移，不是敌人；偏移长度分别1.457944/1.057805/1.317504/1.113239米。采用有限射程模型，敌人有效接触距离3米；最长路径加投射物半径0.2米仍小于3米，不引入挂点或胶囊判定。原生finishOnReach=true、hitOnReach=false，到达局部位置就结束，不向前无限延长；因此四入口hit均为空。速度50、曲线恒1，到达阈值0.2米，(偏移长度-0.2)/50分别0.025159/0.017156/0.022350/0.018265秒，均在1帧内结束。独立落地伤害不属于这些碎片，保持原技能执行。
  projectile_chr_0004_pelica_plunging_attack: {
    endFrame: 1,
    callbacks: { hit: [] },
  },
  // 狼卫｜连携技「爆裂手雷·β型」：向敌人投掷的爆裂手雷。
  // 发射来源：chr_0006_wolfgd_combo_skill。
  // 取值依据：原生从 Source+[0,1,0] 飞向 smart_target 在 SourceForward 上偏移-0.2米的固定点；敌我3米时水平航程2.8米、落差1米。顶点偏移0.7、时长0.3秒反算初速度和重力，无距离倍率。 无碰撞形状且 hitOnReach=true，按0.5米到达阈值触发命中；抛物线首次进入终点球，再积分各自速度曲线，需0.275009秒，取9帧。固定点目标、忽略挂点与地形。
  projectile_chr_0006_wolfgd_combo_skill: {
    endFrame: 9,
    callbacks: {
      hit: [9],
    },
  },
  // 狼卫｜普攻第 1 段「多重连射」：直线飞行的攻击弹体。
  // 发射来源：chr_0006_wolfgd_attack1。
  // 取值依据：原生 Context 固定发射点、SourceForward 朝向 3 米点目标，忽略目标挂点。匀速 40，球半径 0.2；ceil((端点距离-0.2)/40×30)。本段各入口为 2 帧，第一段第二枪单独覆盖为 3 帧。
  projectile_chr_0006_wolfgd_normal_attack: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 狼卫｜普攻第 2 段「多重连射」：直线飞行的攻击弹体。
  // 发射来源：chr_0006_wolfgd_attack2。
  // 取值依据：原生 Context 固定发射点、SourceForward 朝向 3 米点目标，忽略目标挂点。匀速 40，球半径 0.2；ceil((端点距离-0.2)/40×30)。本段各入口为 2 帧，第一段第二枪单独覆盖为 3 帧。
  projectile_chr_0006_wolfgd_normal_attack_2: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 狼卫｜普攻第 3 段「多重连射」：直线飞行的攻击弹体。
  // 发射来源：chr_0006_wolfgd_attack3。
  // 取值依据：原生 Context 固定发射点、SourceForward 朝向 3 米点目标，忽略目标挂点。匀速 40，球半径 0.2；ceil((端点距离-0.2)/40×30)。本段各入口为 2 帧，第一段第二枪单独覆盖为 3 帧。
  projectile_chr_0006_wolfgd_normal_attack_3: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 狼卫｜普攻第 4 段「多重连射」：直线飞行的攻击弹体。
  // 发射来源：chr_0006_wolfgd_attack4。
  // 取值依据：原生 FindTargetAction 以 ActionSource 为中心、SourceForward 为方向缓存发射点，局部偏移 [0,1.3,0.3]；发射动作读取该上下文，目标为 Target，后续固定偏移为零。敌我中心相距 3 米时，两端距离为 2.996665 米。原生匀速 40 米/秒。点目标碰撞半径 0.2 米，候选时延 0.069917 秒，取 3 帧；忽略骨骼挂点。
  projectile_chr_0006_wolfgd_normal_attack_4: {
    endFrame: 3,
    callbacks: {
      hit: [3],
    },
  },
  // 狼卫｜战技「灼热弹痕」：直线飞行的攻击弹体。
  // 发射来源：chr_0006_wolfgd_normal_skill。
  // 取值依据：逐发射核对：起点查询为 Owner，target1/target2 字符串不是当前查询分支的来源；终点为 Context[smart_target]，不是动作中的冗余 MainTargetFinder 字段。技能配置 SelectByTag，木桩模型按智能目标选中唯一敌人的分支取值，忽略无敌人的 dummy 固定点分支及骨骼挂点。起终点固定偏移均为零；原始字节重读确认匀速 40 米/秒、曲线恒为 1、无碰撞形状、hitOnReach=true、finishOnReach=true。按原生 0.5 米到达阈值，3 米参考距离得到 (3-0.5)/40=0.0625 秒，取 2 帧。
  projectile_chr_0006_wolfgd_normal_skill: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 狼卫｜战技「灼热弹痕」：直线飞行的攻击弹体。
  // 发射来源：chr_0006_wolfgd_normal_skill。
  // 取值依据：逐发射核对：起点查询为 Owner，target1/target2 字符串不是当前查询分支的来源；终点为 Context[smart_target]，不是动作中的冗余 MainTargetFinder 字段。技能配置 SelectByTag，木桩模型按智能目标选中唯一敌人的分支取值，忽略无敌人的 dummy 固定点分支及骨骼挂点。起终点固定偏移均为零；原始字节重读确认匀速 40 米/秒、曲线恒为 1、无碰撞形状、hitOnReach=true、finishOnReach=true。按原生 0.5 米到达阈值，3 米参考距离得到 (3-0.5)/40=0.0625 秒，取 2 帧。
  projectile_chr_0006_wolfgd_normal_skill_plus: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 赛希｜连携技「压力测试」：直线飞行的攻击弹体。
  // 发射来源：chr_0011_seraph_combo_skill。
  // 取值依据：main 由 MainTargetFinder 写入，是敌方主目标；ball 由 OwnerSpawnedEntityFinder+标签 -380421959 找到。节点 17 从 ball 发射，节点 21 无球时从 Source 发射。球有环绕运动，本配置仅取 spawnball 的初始偏移 [0,1,-1] 为固定代表位置，忽略环绕相位与其他重新生成位置：干员 [-3,0,0]、球 [-4,1,0]、敌人原点。原生速度 45×C(t/5)，无碰撞形状，到达阈值 0.5 米；两入口分别积分 sqrt(17)-0.5、3-0.5 米，得到 0.100632 秒（4 帧）和 0.069441 秒（3 帧）。预设取有球入口 4 帧，无球入口在 projectileSchedules 中单独覆盖，不能把实体位置一律当作干员位置。
  projectile_chr_0011_seraph_combo_skill: {
    endFrame: 4,
    callbacks: {
      hit: [4],
    },
  },
  // 赛希｜普攻第 1 段「冷却」：曲线路径的攻击弹体。
  // 发射来源：chr_0011_seraph_attack1。
  // 取值依据：原生来源到目标，固定偏移为零；敌我参考距离 3 米，忽略骨骼挂点。贝塞尔控制点取原生各随机区间中点，作为代表构型，不按路径长度追加倍率。基准时长为 3 / 22 秒，进度由 C(t/5) 的时间积分确定；对点目标做半径 0.2 米的首次接触计算，候选时延 0.132659 秒，向上取整 4 帧。
  projectile_chr_0011_seraph_normal_attack: {
    endFrame: 4,
    callbacks: {
      hit: [4],
    },
  },
  // 赛希｜普攻第 2 段「冷却」：曲线路径的攻击弹体。
  // 发射来源：chr_0011_seraph_attack2。
  // 取值依据：原生来源到目标，固定偏移为零；敌我参考距离 3 米，忽略骨骼挂点。贝塞尔控制点取原生各随机区间中点，作为代表构型，不按路径长度追加倍率。基准时长为 3 / 24 秒，进度由 C(t/5) 的时间积分确定；对点目标做半径 0.2 米的首次接触计算，候选时延 0.118689 秒，向上取整 4 帧。
  projectile_chr_0011_seraph_normal_attack2: {
    endFrame: 4,
    callbacks: {
      hit: [4],
    },
  },
  // 赛希｜普攻第 4 段「冷却」：曲线路径的攻击弹体。
  // 发射来源：chr_0011_seraph_attack4。
  // 取值依据：原生来源到目标，固定偏移为零；敌我参考距离 3 米，忽略骨骼挂点。贝塞尔控制点取原生各随机区间中点，作为代表构型，不按路径长度追加倍率。基准时长为 3 / 36 秒，进度由 C(t/5) 的时间积分确定；对点目标做半径 0.2 米的首次接触计算，候选时延 0.080402 秒，向上取整 3 帧。
  projectile_chr_0011_seraph_normal_attack3: {
    endFrame: 3,
    callbacks: {
      hit: [3],
    },
  },
  // 赛希｜普攻第 4 段「冷却」：曲线路径的攻击弹体。
  // 发射来源：chr_0011_seraph_attack4。
  // 取值依据：原生来源到目标，固定偏移为零；敌我参考距离 3 米，忽略骨骼挂点。贝塞尔控制点取原生各随机区间中点，作为代表构型，不按路径长度追加倍率。基准时长为 3 / 36 秒，进度由 C(t/5) 的时间积分确定；对点目标做半径 0.2 米的首次接触计算，候选时延 0.081277 秒，向上取整 3 帧。
  projectile_chr_0011_seraph_normal_attack3_02: {
    endFrame: 3,
    callbacks: {
      hit: [3],
    },
  },
  // 赛希｜普攻第 3 段「冷却」：曲线路径的攻击弹体。
  // 发射来源：chr_0011_seraph_attack3。
  // 取值依据：原生来源到目标，固定偏移为零；敌我参考距离 3 米，忽略骨骼挂点。贝塞尔控制点取原生各随机区间中点，作为代表构型，不按路径长度追加倍率。基准时长为 3 / 22 秒，进度由 C(t/5) 的时间积分确定；对点目标做半径 0.2 米的首次接触计算，候选时延 0.129479 秒，向上取整 4 帧。
  projectile_chr_0011_seraph_normal_attack3_true: {
    endFrame: 4,
    callbacks: {
      hit: [4],
    },
  },
  // 艾维文娜｜战技「雷枪·截回」：战技召回连携技留下的雷枪，穿过敌人时命中，随后返回。
  // 发射来源：chr_0012_avywen_normal_skill。
  // 取值依据：返回路径采用一维径向模型，不使用敌人胶囊或挂点高度。普通雷枪取6米固定落点再向外4米，即10米起点；强雷枪8+4=12米。保留原生35米/秒及距离倍率，分别得35、43.764米/秒；经过距干员3米位置视为有效命中，ceil((D-3)/v×30)为6/7帧，到达原生0.5米阈值为9/8帧。共享普通雷枪取中路代表，不展开路径。
  projectile_chr_0012_avywen_combo_skill_lance_back: {
    endFrame: 9,
    callbacks: { hit: [6], reach: [9] },
  },
  // 艾维文娜｜连携技「雷枪·掣击」：投向目标区域的三支雷枪之一，此处配置去程落地时延。
  // 发射来源：chr_0012_avywen_combo_skill。
  // 取值依据：原生连携节点 24～26 生成相对 SourceForward 的固定落点 [3,0,5]、[0,0,6]、[-3,0,5]，节点 28 从 Owner 的 WepR 挂点发射，偏移为零。忽略挂点水平偏移，以离地 1 米近似；水平距离分别 sqrt(34)、6、sqrt(34) 米，不是敌我距离。原生水平速度 50、重力 250，曲线恒 1，无距离倍率；T=L/50、vy=-h/T+250T/2，球半径 0.01 米触地均在第 4 帧。高度 0.5～2 米取值均不改变帧数；平地且无沿途墙体近似，触发 block 后结束。
  projectile_chr_0012_avywen_combo_skill_lance_out: {
    endFrame: 4,
    callbacks: {
      block: [4],
    },
  },
  // 艾维文娜｜战技「雷枪·截回」：战技召回强雷枪，穿过敌人时命中，随后返回。
  // 发射来源：chr_0012_avywen_normal_skill。
  // 取值依据：返回路径采用一维径向模型，不使用敌人胶囊或挂点高度。普通雷枪取6米固定落点再向外4米，即10米起点；强雷枪8+4=12米。保留原生35米/秒及距离倍率，分别得35、43.764米/秒；经过距干员3米位置视为有效命中，ceil((D-3)/v×30)为6/7帧，到达原生0.5米阈值为9/8帧。共享普通雷枪取中路代表，不展开路径。
  projectile_chr_0012_avywen_ultimate_skill_lance_back: {
    endFrame: 8,
    callbacks: {
      hit: [7],
      reach: [8],
    },
  },
  // 艾维文娜｜终结技「雷枪·决颤」：投向目标区域的强雷枪，此处配置去程落地时延。
  // 发射来源：chr_0012_avywen_ultimate_skill。
  // 取值依据：原生终结技节点 23 从 Owner 的 VBHit 挂点发射到 SourceForward 前方 8 米固定落点，发射偏移为零；水平速度 70、重力 250、速度曲线恒为 1，无距离倍率。T=8/70，vy=-h/T+250T/2；平地、挂点高度 h=1 米近似，球半径 0.01 米触地约 0.11385 秒，取 4 帧。h=0.5～2 米敏感性计算均为 4 帧；不表示已取得真实骨骼高度。WallAndGround 阻挡后触发 block 并结束，忽略沿途墙体。
  projectile_chr_0012_avywen_ultimate_skill_lance_out: {
    endFrame: 4,
    callbacks: {
      block: [4],
    },
  },
  // 洁尔佩塔｜普攻第 1 段「秘杖·束能技艺」：曲线路径的攻击弹体。
  // 发射来源：chr_0013_aglina_attack1。
  // 取值依据：原生 FindTargetAction 以 ActionSource 为中心、SourceForward 为方向缓存发射点，局部偏移 [0.4,1.56,0.35]；发射动作读取该上下文，目标为 Target，后续固定偏移为零。敌我中心相距 3 米时，两端距离为 3.100984 米。贝塞尔控制点取原生随机区间中点，以 C(t/3) 推进。点目标碰撞半径 0.2 米，候选时延 0.108292 秒，取 4 帧；忽略骨骼挂点。
  projectile_chr_0013_aglina_normal_attack1: {
    endFrame: 4,
    callbacks: {
      hit: [4],
    },
  },
  // 洁尔佩塔｜普攻第 2 段「秘杖·束能技艺」：直线飞行的攻击弹体。
  // 发射来源：chr_0013_aglina_attack2。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度70米/秒且速度曲线恒1，ceil(3 / 70 × 30) = 2帧。
  projectile_chr_0013_aglina_normal_attack2: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 洁尔佩塔｜普攻第 3 段「秘杖·束能技艺」：直线飞行的攻击弹体。
  // 发射来源：chr_0013_aglina_attack3。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度50米/秒且速度曲线恒1，ceil(3 / 50 × 30) = 2帧。
  projectile_chr_0013_aglina_normal_attack3: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 洁尔佩塔｜普攻第 4 段「秘杖·束能技艺」：曲线路径的攻击弹体。
  // 发射来源：chr_0013_aglina_attack4。
  // 取值依据：原生来源到目标，固定偏移为零；敌我参考距离 3 米，忽略骨骼挂点。贝塞尔控制点取原生各随机区间中点，作为代表构型，不按路径长度追加倍率。基准时长为 3 / 220 秒，进度由 C(t/5) 的时间积分确定；对点目标做半径 0.2 米的首次接触计算，候选时延 0.118132 秒，向上取整 4 帧。
  projectile_chr_0013_aglina_normal_attack4: {
    endFrame: 4,
    callbacks: {
      hit: [4],
    },
  },
  // 洁尔佩塔｜普攻第 4 段「秘杖·束能技艺」：曲线路径的攻击弹体。
  // 发射来源：chr_0013_aglina_attack4。
  // 取值依据：原生来源到目标，固定偏移为零；敌我参考距离 3 米，忽略骨骼挂点。贝塞尔控制点取原生各随机区间中点，作为代表构型，不按路径长度追加倍率。基准时长为 3 / 220 秒，进度由 C(t/5) 的时间积分确定；对点目标做半径 0.2 米的首次接触计算，候选时延 0.118132 秒，向上取整 4 帧。
  projectile_chr_0013_aglina_normal_attack4_1: {
    endFrame: 4,
    callbacks: {
      hit: [4],
    },
  },
  // 洁尔佩塔｜普攻第 4 段「秘杖·束能技艺」：曲线路径的攻击弹体。
  // 发射来源：chr_0013_aglina_attack4。
  // 取值依据：原生来源到目标，固定偏移为零；敌我参考距离 3 米，忽略骨骼挂点。贝塞尔控制点取原生各随机区间中点，作为代表构型，不按路径长度追加倍率。基准时长为 3 / 220 秒，进度由 C(t/5) 的时间积分确定；对点目标做半径 0.2 米的首次接触计算，候选时延 0.118132 秒，向上取整 4 帧。
  projectile_chr_0013_aglina_normal_attack4_2: {
    endFrame: 4,
    callbacks: {
      hit: [4],
    },
  },
  // 昼雪｜连携技「极地救援」：丢向主控干员的雪地救援助理，接触后触发治疗。
  // 发射来源：chr_0014_aurora_combo_skill。
  // 取值依据：主控分支节点 17 的 BearPos 为自身+[0,2,2]，不是敌方；忽略 WepL 挂点后弦长 sqrt(8)。原生二阶曲线随机区间取中点，速度9、球形到达阈值0.3，首次进入终点球需0.288952秒，取9帧。非主控节点21飞向 MainCharacter，队友同站位近似时起终点重合，单独配置首帧到达。
  projectile_chr_0014_aurora_combo_skill_bear_out: {
    endFrame: 9,
    callbacks: {
      reach: [9],
    },
  },
  // 莱万汀｜灼热附着吸收机制：吸收灼热附着的回收弹体；属于吸收机制，不是单独的一次攻击。
  // 发射来源：buff_chr_0016_laevat_passive_teammate。
  // 取值依据：原生从受击敌人 Target 回到吸收者 Source，固定偏移均为零。Buff 的 SaveTargetDistance(7) 读取敌人与莱万汀的距离，CurveEvaluateFloat(8/9) 求 curve_rate、speed，再由四个发射入口的 assignPairs 传入 EntityBB_curve_rate、EntityBB_speed；不能用资源默认值 5。3 米下分别得到弯曲倍率 3.188519、基础速度 9.460913。原生 Bezier2D 为二阶曲线，仅用第一个控制点；随机区间取中点、横向半径随弦长缩放，以原生弦长/速度推进参数并积分 C(t/5)，到 Source 的 0.5 米阈值约需 0.696397 秒，取 21 帧触发 hitOnReach 并结束。忽略挂点，沿途不做敌方命中。
  projectile_chr_0016_laevat_absorb: {
    endFrame: 21,
    callbacks: {
      hit: [21],
    },
  },
  // 莱万汀｜普攻第 4 段「燃烬」：直线飞行的攻击弹体。
  // 发射来源：chr_0016_laevat_attack4。
  // 取值依据：命中采用3米有效路程，积分原生速度30×C(t/2)，0.102788秒取4帧；不扣碰撞半径，不使用敌人高度和挂点偏差。地面阻挡为独立事件，保留原生固定终点前方10/11米且低1米的落地模型（发射高1米、箱体半高0.25米），两者均第4帧；命中与阻挡均保留。
  projectile_chr_0016_laevat_attack_4_2: {
    endFrame: 4,
    callbacks: { hit: [4], block: [4] },
  },
  // 莱万汀｜普攻第 4 段「燃烬」：直线飞行的攻击弹体。
  // 发射来源：chr_0016_laevat_attack4。
  // 取值依据：命中采用3米有效路程，积分原生速度30×C(t/2)，0.102788秒取4帧；不扣碰撞半径，不使用敌人高度和挂点偏差。地面阻挡为独立事件，保留原生固定终点前方10/11米且低1米的落地模型（发射高1米、箱体半高0.25米），两者均第4帧；命中与阻挡均保留。
  projectile_chr_0016_laevat_attack_5: {
    endFrame: 4,
    callbacks: { hit: [4], block: [4] },
  },
  // 莱万汀｜连携技「沸腾」：直线飞行的攻击弹体。
  // 发射来源：chr_0016_laevat_combo_skill。
  // 取值依据：发射节点读取 Source 到 Context[tar]，不是 smart_target 或连携触发者。原生先查询敌方候选；发射前 IfElse(3) 检查 tar，空结果通过 MergeTarget(5) 将 MainTargetFinder 写回 tar。单敌人场景目标为敌人，固定偏移均为零，忽略挂点；原始字节确认无碰撞形状、速度 27 米/秒、速度曲线恒为 1、hitOnReach=true、最大命中数 1。按原生 0.5 米到达阈值，ceil((3-0.5)/27×30)=3 帧。
  projectile_chr_0016_laevat_combo_skill_indicator: {
    endFrame: 3,
    callbacks: {
      hit: [3],
    },
  },
  // 伊冯｜普攻第 1 段「雀跃扳机」：直线飞行的攻击弹体。
  // 发射来源：chr_0017_yvonne_attack1、chr_0017_yvonne_attack2。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度70米/秒且速度曲线恒1，ceil(3 / 70 × 30) = 2帧。
  projectile_chr_0017_yvonne_attack1: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 伊冯｜普攻第 2 段「雀跃扳机」：直线飞行的攻击弹体。
  // 发射来源：chr_0017_yvonne_attack2。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度45米/秒且速度曲线恒1，ceil(3 / 45 × 30) = 2帧。
  projectile_chr_0017_yvonne_attack2_robot: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 伊冯｜普攻第 3 段「雀跃扳机」：曲线路径的攻击弹体。
  // 发射来源：chr_0017_yvonne_attack3。
  // 取值依据：Owner 到 Target，忽略挂点；目标局部固定偏移为 [-0.2,-0.2,0]，随机偏移取中值零。敌我参考距离 3 米，实际弦长 sqrt(9+0.04+0.04)=3.013304 米。以瞄准点代理受击位置（未重建敌人碰撞体），原生三次贝塞尔控制点与 0.2 米球形半径求首次覆盖参数，再积分原生 30×C(t/5) 速度曲线，得 0.334348 秒，取 11 帧；不以曲线弧长除速度。
  projectile_chr_0017_yvonne_attack3: {
    endFrame: 11,
    callbacks: {
      hit: [11],
    },
  },
  // 伊冯｜普攻第 3 段「雀跃扳机」：曲线路径的攻击弹体。
  // 发射来源：chr_0017_yvonne_attack3。
  // 取值依据：原生 Owner 到 Target，固定偏移为零；参考距离 3 米，贝塞尔随机控制点取区间中点。速度曲线在归一化时间 0.05～0.06 之间使用正无穷切线，按阶梯段保持 0.2 倍速度，不能将该切线替换为零。按 C(t/5) 积分、基准时长 3/30 秒及 0.2 米点目标接触计算，代表构型候选时延 0.333953 秒，取 11 帧；忽略骨骼挂点。
  projectile_chr_0017_yvonne_attack3_2: {
    endFrame: 11,
    callbacks: {
      hit: [11],
    },
  },
  // 伊冯｜普攻第 3 段「雀跃扳机」：曲线路径的攻击弹体。
  // 发射来源：chr_0017_yvonne_attack3。
  // 取值依据：Owner 到 Target，忽略挂点；目标局部固定偏移为 [0.2,0.2,0]，随机偏移取中值零。敌我参考距离 3 米，实际弦长 sqrt(9+0.04+0.04)=3.013304 米。以瞄准点代理受击位置（未重建敌人碰撞体），原生三次贝塞尔控制点与 0.2 米球形半径求首次覆盖参数，再积分原生 30×C(t/5) 速度曲线，得 0.334344 秒，取 11 帧；不以曲线弧长除速度。
  projectile_chr_0017_yvonne_attack3_3: {
    endFrame: 11,
    callbacks: {
      hit: [11],
    },
  },
  // 伊冯｜普攻第 4 段「雀跃扳机」：直线飞行的攻击弹体。
  // 发射来源：chr_0017_yvonne_attack4。
  // 取值依据：命中采用3米有效路程，积分原生速度50×C(t/5)，0.046176秒取2帧；不扣碰撞半径，不使用敌人高度和挂点偏差。
  // 无障碍命中场景：原生 maxHitCount=1，首次命中后结束；不再触发后续地面或墙体阻挡回调。
  projectile_chr_0017_yvonne_attack4: {
    endFrame: 2,
    callbacks: {
      hit: [2],
      block: [],
    },
  },
  // 伊冯｜战技「冰冰弹·β型」：向前发射的制冷弹，碰到敌人后爆炸。
  // 发射来源：buff_chr_0017_yvonne_normal_skill_projectile。
  // 取值依据：有目标分支：技能 CreateBuffAction:10 将 Buff 挂在伊冯身上，来源设为 smart_target；Buff ConvertToTargetContext:3 读取来源位置，绕来源自身旋转不改变位置。故 Owner 到该位置为 3 米，而非空放分支的前方 6 米。等高、忽略挂点且无遮挡近似：原生顶点高 1.7 米、参数时长 1 秒，x=3t、y=6.8t−6.8t²；半径 0.2 米首次覆盖点目标在 t=0.972457。距离速度倍率 C(3)=3.125，实际 0.311186 秒，取 10 帧。命中上限 1，命中后结束，不追加阻挡回调。
  projectile_chr_0017_yvonne_normal_skill: {
    endFrame: 10,
    callbacks: {
      hit: [10],
      block: [],
    },
  },
  // 伊冯｜普攻（重击）「雀跃扳机」：抛物线飞行的攻击弹体。
  // 发射来源：chr_0017_yvonne_power_attack。
  // 取值依据：原生 Owner→Target，忽略挂点采用同高3米；顶点偏移0.5、配置时长1秒，反算水平速度3、竖直速度2、重力4，距离倍率C(3)=3.125。 无碰撞形状且 hitOnReach=true，按0.5米到达阈值触发命中；抛物线首次进入终点球，再积分各自速度曲线，需0.273668秒，取9帧。固定点目标、忽略挂点与地形。
  projectile_chr_0017_yvonne_power_attack: {
    endFrame: 9,
    callbacks: {
      hit: [9],
    },
  },
  // 伊冯｜终结技「冷冻射手」：直线飞行的攻击弹体。
  // 发射来源：chr_0017_yvonne_ult_attack1_1、chr_0017_yvonne_ult_attack2_1、chr_0017_yvonne_ult_attack2_2、chr_0017_yvonne_ult_attack3_1、chr_0017_yvonne_ult_attack3_2。
  // 取值依据：原生 maintar 由 MainTargetFinder 写入，与 Target 分支均指向敌人；不是任意缓存位置。参考敌我距离 3 米，原生匀速 70 米/秒、碰撞半径 0.2 米。对终点横向偏移 -0.2、0、0.2 米分别计算直线首次接触点目标，均取 2 帧；不把偏移点直接当作敌人中心，忽略骨骼挂点。
  projectile_chr_0017_yvonne_ult_attack1: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 伊冯｜终结技「冷冻射手」：直线飞行的攻击弹体。
  // 发射来源：chr_0017_yvonne_ult_attack2_1、chr_0017_yvonne_ult_attack3_1、chr_0017_yvonne_ult_attack3_2。
  // 取值依据：原生 maintar 由 MainTargetFinder 写入，与 Target 分支均指向敌人；不是任意缓存位置。参考敌我距离 3 米，原生匀速 70 米/秒、碰撞半径 0.2 米。对终点横向偏移 -0.2、0、0.2 米分别计算直线首次接触点目标，均取 2 帧；不把偏移点直接当作敌人中心，忽略骨骼挂点。
  projectile_chr_0017_yvonne_ult_attack2: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 埃特拉｜战技「凝声」：刺枪激发出的直线制冷声波。
  // 发射来源：chr_0021_whiten_normal_skill。
  // 取值依据：原生黑板 distance=8；FindTargetAction:64/66 的终点为 Source 前方 8 米、上方 1 米，不是敌人位置。盒体局部中心 (0,0.5,1.5)、extent=(1.6,2.1,3)，速度约 58 米/秒。3 米点目标在首个 1/30 秒更新已被盒体覆盖，取 1 帧；原生 _CastShape 将 extent 乘0.5，因此半尺寸为(0.8,1.05,1.5)；首帧局部偏差约 (0,-0.872,-0.455) 在半尺寸内。忽略挂点、按面向敌人和无遮挡近似；不按到达 8 米终点计时。
  projectile_chr_0021_whiten_normal_skill: {
    endFrame: 1,
    callbacks: {
      hit: [1],
    },
  },
  // 萤石｜普攻第 1 段「独门射击法」：直线飞行的攻击弹体。
  // 发射来源：chr_0022_bounda_attack1、chr_0022_bounda_attack2、chr_0022_bounda_attack3。
  // 取值依据：三个入口均读取 emit_pos，原生固定发射偏移分别为 [0,1.4,0.95]、[-0.1,1.4,0.5]、[0,1.3,0.5]。敌我距离 3 米，忽略挂点、敌人面向干员；后两段目标偏移 [0.2,-0.1,0] 按 TargetForward 转为世界 [-0.2,-0.1,0]。以瞄准点代理受击位置，距离分别 2.482438、2.917190、2.872281 米；匀速 70 米/秒、碰撞半径 0.2 米，ceil((D−0.2)/70×30) 分别为 1、2、2 帧。默认 2 帧，第一段按发射入口覆盖为 1 帧。
  projectile_chr_0022_bounda_attack1: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 萤石｜普攻第 4 段「独门射击法」：直线飞行的攻击弹体。
  // 发射来源：chr_0022_bounda_attack4、chr_0022_bounda_attack4_1。
  // 取值依据：原生 FindTargetAction 以 ActionSource 为中心、SourceForward 为方向缓存发射点，局部偏移 [-0.1,1.3,0.5]；发射动作读取该上下文，目标为 Target，后续固定偏移为零。敌我中心相距 3 米时，两端距离为 2.819574 米。原生匀速 70 米/秒。点目标碰撞半径 0.2 米，候选时延 0.037422 秒，取 2 帧；忽略骨骼挂点。
  // 无障碍命中场景：原生 maxHitCount=1，首次命中后结束；不再触发后续地面或墙体阻挡回调。
  projectile_chr_0022_bounda_attack4: {
    endFrame: 2,
    callbacks: {
      hit: [2],
      block: [],
    },
  },
  // 萤石｜战技「小惊喜」：踢出并黏附在目标身上的自制炸弹。
  // 发射来源：chr_0022_bounda_normal_skill。
  // 取值依据：原生两段：first为3.8米/秒三次贝塞尔，从[-0.2,2,0.4]飞向预设点[0,1.25,0.7]；0.4米到达阈值在0.157844秒达到。1.6.3切段代码0x0741E437读取curPos初始化后段，故后段起点约[-0.044862,1.641739,0.632707]，不是预设点。第二段水平速度38、重力100，目标地面点[0,0,3]；半径0.4米首次触地再需0.048404秒，总0.206249秒取7帧。此地面点目标近似下先Block而非Hit；二者调用同一子技能，明确hit=[]、block=[7]，不重复执行。
  projectile_chr_0022_bounda_normal_skill: {
    endFrame: 7,
    callbacks: { hit: [], block: [7] },
  },
  // 萤石｜终结技「巅峰闹剧」：直线飞行的攻击弹体。
  // 发射来源：chr_0022_bounda_ultimate_skill。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度70米/秒且速度曲线恒1，ceil(3 / 70 × 30) = 2帧。
  projectile_chr_0022_bounda_ultimate_skill_1: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 安塔尔｜普攻第 1 段「交换电流」：直线飞行的攻击弹体。
  // 发射来源：chr_0023_antal_attack1。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度50米/秒且速度曲线恒1，ceil(3 / 50 × 30) = 2帧。
  projectile_chr_0023_antal_normal_attack1: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 安塔尔｜普攻第 2 段「交换电流」：直线飞行的攻击弹体。
  // 发射来源：chr_0023_antal_attack2。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度50米/秒且速度曲线恒1，ceil(3 / 50 × 30) = 2帧。
  projectile_chr_0023_antal_normal_attack2: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 安塔尔｜普攻第 3 段「交换电流」：直线飞行的攻击弹体。
  // 发射来源：chr_0023_antal_attack3。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度50米/秒且速度曲线恒1，ceil(3 / 50 × 30) = 2帧。
  projectile_chr_0023_antal_normal_attack3: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 安塔尔｜普攻第 4 段「交换电流」：直线飞行的攻击弹体。
  // 发射来源：chr_0023_antal_attack4。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度50米/秒且速度曲线恒1，ceil(3 / 50 × 30) = 2帧。
  projectile_chr_0023_antal_normal_attack4: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 安塔尔｜普攻（重击）「交换电流」：直线飞行的攻击弹体。
  // 发射来源：chr_0023_antal_power_attack。
  // 取值依据：命中采用3米有效路程，积分原生速度50×C(t/1)，0.114075秒取4帧；不扣碰撞半径，不使用敌人高度和挂点偏差。
  projectile_chr_0023_antal_power_attack: {
    endFrame: 4,
    callbacks: {
      hit: [4],
    },
  },
  // 安塔尔｜普攻（重击）「交换电流」：直线飞行的攻击弹体。
  // 发射来源：chr_0023_antal_power_attack。
  // 取值依据：原生发射 Owner 到 Target，固定偏移均为零，匀速 50 米/秒、速度曲线恒为 1。无碰撞形状，原生 _CalculateReachDistance（1.6.3 RVA 0x0576C140）取到达阈值 0.5 米；hitOnReach=true，参考距离 3 米，ceil((3 - 0.5) / 50 × 30) = 2 帧，忽略骨骼挂点。
  projectile_chr_0023_antal_power_attack02: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 艾尔黛拉｜连携技「火山蘑菇云」：抛向敌人的火山云，到达后跟随目标并延迟爆炸。
  // 发射来源：chr_0025_ardelia_combo_skill。
  // 取值依据：两个发射入口（20、22）均从 Owner 发射到 Context[smart_target]+[0,1,0]；SelectComboSkillTarget 在单敌人场景取连携目标。忽略骨骼挂点，敌我水平距离 3 米，终点高 1 米，实际弦长 sqrt(3²+1²)。无碰撞形状，hitOnReach=true，使用原生 0.5 米到达阈值；速度为 15×C(t/5)，按减速曲线积分 2.662278 米，得到 0.184304 秒，取 6 帧。这里是到达触发回调，不要求弹体与地面敌人点碰撞。
  projectile_chr_0025_ardelia_combo_skill: {
    endFrame: 6,
    callbacks: {
      hit: [6],
    },
  },
  // 艾尔黛拉｜普攻第 1 段「岩石的轻语」：曲线路径的攻击弹体。
  // 发射来源：chr_0025_ardelia_attack1。
  // 取值依据：原生 InstantSearch/FixedPointFinder 以 SourceForward 偏移 [0.1,2.1,0.6] 发射，终点是 Target；敌我相距 3 米时实际弦长 sqrt(0.1²+2.1²+(3-0.6)²)，不能按 3 米航程计算。 原生二阶曲线，横向控制半径区间取中点；按弦长/基础速度推进参数及 C(t/5) 积分，得 0.129539 秒，取 4 帧命中。采用无沿途地形阻挡、忽略挂点及敌人体积的固定近似；不据此声称原生地面阻挡无效。
  projectile_chr_0025_ardelia_normal_attack1: {
    endFrame: 4,
    callbacks: {
      hit: [4],
    },
  },
  // 艾尔黛拉｜普攻第 2 段「岩石的轻语」：曲线路径的攻击弹体。
  // 发射来源：chr_0025_ardelia_attack2。
  // 取值依据：原生发射采用 TargetForward 偏移，目标固定偏移为零。敌我中心相距 3 米、敌人面向干员；发射横向偏移绝对值 0.2 米、高度 1 米，因此两端距离 sqrt(3²+0.2²+1²)=3.168596 米，不直接用 3 米作航程。贝塞尔随机区间取中点，按原生速度曲线 C(t/5) 推进，对点目标取碰撞半径 0.2 米；代表构型时延 0.136963 秒，候选 5 帧。忽略骨骼挂点。
  projectile_chr_0025_ardelia_normal_attack2: {
    endFrame: 5,
    callbacks: {
      hit: [5],
    },
  },
  // 艾尔黛拉｜普攻第 2 段「岩石的轻语」：曲线路径的攻击弹体。
  // 发射来源：chr_0025_ardelia_attack2。
  // 取值依据：原生发射采用 TargetForward 偏移，目标固定偏移为零。敌我中心相距 3 米、敌人面向干员；发射横向偏移绝对值 0.2 米、高度 1 米，因此两端距离 sqrt(3²+0.2²+1²)=3.168596 米，不直接用 3 米作航程。贝塞尔随机区间取中点，按原生速度曲线 C(t/5) 推进，对点目标取碰撞半径 0.2 米；代表构型时延 0.136963 秒，候选 5 帧。忽略骨骼挂点。
  projectile_chr_0025_ardelia_normal_attack2_1: {
    endFrame: 5,
    callbacks: {
      hit: [5],
    },
  },
  // 艾尔黛拉｜普攻第 3 段「岩石的轻语」：曲线路径的攻击弹体。
  // 发射来源：chr_0025_ardelia_attack3。
  // 取值依据：15个入口的发射点查询相同：Source+[0,0.6,0.3] 为扇形中心，半径0.4～1.6米、平面绕X轴−90度。采用半径中值1米、扇形中心方向，得到起点[0,1.6,0.3]；目标[0,0,3]，随机命中偏移取零，弦长3.138471米。原生三次贝塞尔控制点取范围中值，半径0.1米，以首次覆盖目标求参数，再积分27×C(t/finishDuration)，得0.186573秒，取6帧；忽略挂点，不将随机采样视为实战固定结果。
  projectile_chr_0025_ardelia_normal_attack3: {
    endFrame: 6,
    callbacks: { hit: [6] },
  },
  // 艾尔黛拉｜战技「奔腾的多利」：骑乘多利冲撞对应的弹体。
  // 发射来源：chr_0025_ardelia_normal_skill。
  // 取值依据：原生 Source 发射偏移[0,1.5,1]，投向自身周围3～6米扇区内的随机地面点；顶点偏移2、配置时长1秒，速度曲线加速。 按顶点公式反算竖直速度与重力，球半径0.2首次触地，再积分速度曲线，得0.833847秒，取26帧 block。原生无距离倍率，平地时竖直轨迹与水平距离无关，不将随机落点强行当作敌方；忽略途中墙体，finishOnBlock=true。
  projectile_chr_0025_ardelia_normal_skill: {
    endFrame: 26,
    callbacks: {
      block: [26],
    },
  },
  // 艾尔黛拉｜终结技「毛茸茸派对」：向四周散射的多利先生分身。
  // 发射来源：chr_0025_ardelia_ultimate_skill。
  // 取值依据：原生从 Source 上方3.5米固定点，投向周围随机地面点；顶点偏移1.5、配置时长0.7秒，速度曲线恒1。 按顶点公式反算竖直速度与重力，球半径0.2首次触地，再积分速度曲线，得0.690862秒，取21帧 block。原生无距离倍率，平地时竖直轨迹与水平距离无关，不将随机落点强行当作敌方；忽略途中墙体，finishOnBlock=true。
  projectile_chr_0025_ardelia_ultimate_skill: {
    endFrame: 21,
    callbacks: {
      block: [21],
    },
  },
  // 别礼｜战技「塞什卡的秘传」：低温灌注技能内的投射物。
  // 发射来源：chr_0026_lastrite_normal_skill。
  // 取值依据：原生终点是 CharacterTeamFinder 经 MainCharacterValidator 和 ConvertToSlot 得到的主控干员，不是敌人；触发的是 reach 回调。采用所有干员在敌人同侧 3 米参考站位、忽略骨骼挂点的固定近似，Owner 与主控位置重合，发射时已在无碰撞形状的 0.5 米到达阈值内，记首次更新第 1 帧到达并结束。此处不使用敌我 3 米作为航程；实际队友站位分散时需要另行配置，不能声称是原生固定时延。
  projectile_chr_0026_lastrite_normal_skill: {
    endFrame: 1,
    callbacks: {
      reach: [1],
    },
  },
  // 汤汤｜普攻第 1 段「崩你脑壳！」：直线飞行的攻击弹体。
  // 发射来源：chr_0027_tangtang_attack1。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度55米/秒且速度曲线恒1，ceil(3 / 55 × 30) = 2帧。
  projectile_chr_0027_tangtang_attack1: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 汤汤｜普攻第 2 段「崩你脑壳！」：直线飞行的攻击弹体。
  // 发射来源：chr_0027_tangtang_attack2。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度70米/秒且速度曲线恒1，ceil(3 / 70 × 30) = 2帧。
  projectile_chr_0027_tangtang_attack2: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 汤汤｜普攻第 2 段「崩你脑壳！」：直线飞行的攻击弹体。
  // 发射来源：chr_0027_tangtang_attack2。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度70米/秒且速度曲线恒1，ceil(3 / 70 × 30) = 2帧。
  projectile_chr_0027_tangtang_attack2_2: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 汤汤｜普攻第 3 段「崩你脑壳！」：直线飞行的攻击弹体。
  // 发射来源：chr_0027_tangtang_attack3。
  // 取值依据：散射采用对目标有效的直射路径，3米有效路程；不引入挂点高度、敌人胶囊和散射横向脱靶判定。原生速度40米/秒、曲线恒1，ceil(3/40×30)=3帧；保留一次命中。
  projectile_chr_0027_tangtang_attack3: {
    endFrame: 3,
    callbacks: { hit: [3] },
  },
  // 汤汤｜普攻第 5 段「崩你脑壳！」：直线飞行的攻击弹体。
  // 发射来源：chr_0027_tangtang_attack5。
  // 取值依据：原生从 Owner+[0,1,0] 飞向施放者前方 [0,1,12] 固定点，航程 12 米；不是向敌人中心发射。忽略挂点，木桩位于正前方 3 米的地面，球半径 1.5 米、恒速 50 米/秒，首次覆盖需飞行 3-sqrt(1.5²-1²) 米，约 0.037639 秒，取 2 帧。阻挡层为 Nothing，不因球底低于地面而结束；不重复命中且无命中次数上限。继续飞至原生 min(0.5,1.5)=0.5 米到达阈值，ceil((12-0.5)/50×30)=7 帧结束。
  projectile_chr_0027_tangtang_attack5: {
    endFrame: 7,
    callbacks: {
      hit: [2],
    },
  },
  // 汤汤｜连携技「河水，助我！」：强力水流迸射出的涡流落点弹体；落地后形成可被战技消耗的涡流。
  // 发射来源：chr_0027_tangtang_combo_skill。
  // 取值依据：原生顶点模式时长1.7秒不是实际落地时延：速度曲线初值2，且开启距离倍率。连携从 tar01 的 VBHit 发射，目标为其地面点+[±2.5,0.1,4]；挂点高1米近似、球半径0.3，顶点公式求首次触地再积分时钟，距离倍率1.785973，需0.580211秒，取18帧。挂点高0.5～2米均为18帧。Buff入口高度和偏移不同，单独覆盖20帧；平地无墙，finishOnBlock=true，触地后不执行超时兜底 finish。
  projectile_chr_0027_tangtang_water: {
    endFrame: 18,
    callbacks: {
      block: [18],
      finish: [],
    },
  },
  // 洛茜｜战技「血红之影」：目标已有破防时额外释放、冲向目标的狼之珀；此项为其中一个发射资源。
  // 发射来源：chr_0028_wulfa_normal_skill。
  // 取值依据：发射节点从 Owner 到 Context[smart_target]；以智能目标为唯一敌人、干员面向敌人的场景计算。起点 SourceForward 偏移 [-0.43,1.6,0.48]，终点无偏移，所以 3 米敌我距离对应实际弦长 sqrt((3-0.48)²+1.6²+0.43²)=3.015842 米，忽略骨骼挂点。原生二阶贝塞尔控制参数全部为常量，距离倍率恒为 1，基础速度 18×C(t/5)；曲线先减速再加速，不能直接除以基础速度。按无碰撞形状的 0.5 米到达阈值求参数并积分，得到 0.500277 秒，取 16 帧触发 hitOnReach 并结束。
  projectile_chr_0028_wulfa_normalskill_2: {
    endFrame: 16,
    callbacks: {
      hit: [16],
    },
  },
  // 洛茜｜战技「血红之影」：目标已有破防时额外释放、冲向目标的狼之珀；此项为其中一个发射资源。
  // 发射来源：chr_0028_wulfa_normal_skill。
  // 取值依据：发射节点从 Owner 到 Context[smart_target]；以智能目标为唯一敌人、干员面向敌人的场景计算。起点 SourceForward 偏移 [-0.43,1.6,0.48]，终点无偏移，所以 3 米敌我距离对应实际弦长 sqrt((3-0.48)²+1.6²+0.43²)=3.015842 米，忽略骨骼挂点。原生二阶贝塞尔控制参数全部为常量，距离倍率恒为 1，基础速度 26×C(t/5)；曲线先减速再加速，不能直接除以基础速度。按无碰撞形状的 0.5 米到达阈值求参数并积分，得到 0.423425 秒，取 13 帧触发 hitOnReach 并结束。
  projectile_chr_0028_wulfa_normalskill_3: {
    endFrame: 13,
    callbacks: {
      hit: [13],
    },
  },
  // 洛茜｜战技「血红之影」：目标已有破防时额外释放、冲向目标的狼之珀；此项为其中一个发射资源。
  // 发射来源：chr_0028_wulfa_normal_skill。
  // 取值依据：发射节点从 Owner 到 Context[smart_target]；以智能目标为唯一敌人、干员面向敌人的场景计算。起点 SourceForward 偏移 [-0.43,1.6,0.48]，终点无偏移，所以 3 米敌我距离对应实际弦长 sqrt((3-0.48)²+1.6²+0.43²)=3.015842 米，忽略骨骼挂点。原生二阶贝塞尔控制参数全部为常量，距离倍率恒为 1，基础速度 22×C(t/5)；曲线先减速再加速，不能直接除以基础速度。按无碰撞形状的 0.5 米到达阈值求参数并积分，得到 0.462175 秒，取 14 帧触发 hitOnReach 并结束。
  projectile_chr_0028_wulfa_normalskill_4: {
    endFrame: 14,
    callbacks: {
      hit: [14],
    },
  },
  // 洛茜｜战技「血红之影」：目标已有破防时额外释放、冲向目标的狼之珀；此项为其中一个发射资源。
  // 发射来源：chr_0028_wulfa_normal_skill。
  // 取值依据：发射节点从 Owner 到 Context[smart_target]；以智能目标为唯一敌人、干员面向敌人的场景计算。起点 SourceForward 偏移 [-0.43,1.6,0.48]，终点无偏移，所以 3 米敌我距离对应实际弦长 sqrt((3-0.48)²+1.6²+0.43²)=3.015842 米，忽略骨骼挂点。原生二阶贝塞尔控制参数全部为常量，距离倍率恒为 1，基础速度 30×C(t/5)；曲线先减速再加速，不能直接除以基础速度。按无碰撞形状的 0.5 米到达阈值求参数并积分，得到 0.391205 秒，取 12 帧触发 hitOnReach 并结束。
  projectile_chr_0028_wulfa_normalskill_5: {
    endFrame: 12,
    callbacks: {
      hit: [12],
    },
  },
  // 庄方宜｜普攻第 2 段「疾电法」：直线飞行的攻击弹体。
  // 发射来源：chr_0030_zhuangfy_attack2、chr_0030_zhuangfy_attack3。
  // 取值依据：原生速度曲线在归一化时间 0.35 处由 0 阶跃为 1，finishDuration=2 秒，因此先静止约 0.7 秒再以 100 米/秒前进。按敌我 3 米、原生 SwordCenter 和发射偏移，六入口弦长为 4.582576、5.477226 或 6.123724 米；球半径 0.3，t=0.7+(D-0.3)/100，均向上取整为 23 帧。固定面向点目标、忽略受击挂点及地形；Context 查询中未启用的 RandomPointFinder 不参与计算。
  projectile_chr_0030_zhuangfy_attack_sword_1: {
    endFrame: 23,
    callbacks: {
      hit: [23],
    },
  },
  // 庄方宜｜普攻第 2 段「疾电法」：直线飞行的攻击弹体。
  // 发射来源：chr_0030_zhuangfy_attack2、chr_0030_zhuangfy_attack3。
  // 取值依据：原生速度曲线在归一化时间 0.35 处由 0 阶跃为 1，finishDuration=2 秒，因此先静止约 0.7 秒再以 100 米/秒前进。按敌我 3 米、原生 SwordCenter 和发射偏移，六入口弦长为 4.582576、5.477226 或 6.123724 米；球半径 0.3，t=0.7+(D-0.3)/100，均向上取整为 23 帧。固定面向点目标、忽略受击挂点及地形；Context 查询中未启用的 RandomPointFinder 不参与计算。
  projectile_chr_0030_zhuangfy_attack_sword_2: {
    endFrame: 23,
    callbacks: {
      hit: [23],
    },
  },
  // 庄方宜｜普攻第 1 段「疾电法」：直线飞行的攻击弹体。
  // 发射来源：chr_0030_zhuangfy_attack1。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度40米/秒且速度曲线恒1，ceil(3 / 40 × 30) = 3帧。
  projectile_chr_0030_zhuangfy_attack1: {
    endFrame: 3,
    callbacks: {
      hit: [3],
    },
  },
  // 庄方宜｜终结技「万钧风雷」：直线飞行的攻击弹体。
  // 发射来源：chr_0030_zhuangfy_combo_skill_ult。
  // 取值依据：圆环生成在smart_target或目标标记Buff宿主上方1米，当前单敌人就在圆心；以位于高度范围内的敌人体表近似。原生1.6.3 _ProcessScale(0x04FE9E50)冷分支0x0741DA46读取旧innerRadius(+0xb8)，0x0741DA59存入preMoveInnerRadius(+0xc0)，然后才增长内外半径；_CheckOverlap在0x0552E410读取该旧内半径传入_OverlapShape。初始内半径0，第一帧扩张区间包含圆心，取hit1。allowHitSameTarget=false，不重复命中。
  projectile_chr_0030_zhuangfy_combo_skill_ring: {
    endFrame: 1,
    callbacks: { hit: [1] },
  },
  // 庄方宜｜战技「惊霆诀」：生成青霆剑的中间弹体，回调生成剑；不是青霆剑刺向敌人的伤害弹体。
  // 发射来源：chr_0030_zhuangfy_normal_skill、chr_0030_zhuangfy_normal_skill_ult。
  // 取值依据：LaunchProjectile 从 smart_target 发射；FindTargetAction 在 InputTarget 周围5～8米扇形生成 swordPos。单目标时二者以同一敌人为中心，非干员到敌人的3米。取半径中值6.5米，忽略挂点和地形；原生二次贝塞尔控制点比例x=0.4、径向范围0.6～0.8取中值0.7，球形到达阈值0.1米，速度50乘距离倍率2且时间曲线恒1。求首次进入终点阈值得0.064455秒，取2帧；半径5～8米的候选范围为2～3帧，配置采用中值近似。
  projectile_chr_0030_zhuangfy_normal_skill_gene_sword: {
    endFrame: 2,
    callbacks: { reach: [2] },
  },
  // 卡缪｜普攻第 4 段「歃血涤罪」：自身附近触发到达命中的弹体。
  // 发射来源：chr_0033_camille_attack4。
  // 取值依据：原生起终点均查询 Owner、采用 SourceForward，偏移分别为 [0,1,2] 和 [0,1,2.01]，两端只差 0.01 米。速度为 0，无碰撞形状且 hitOnReach=true，已落在原生 0.5 米到达阈值内，候选命中帧为首个更新帧 1；与敌我 3 米距离无关。finishOnReach=false，持续 0.5 秒，保留 15 帧生命周期。
  projectile_chr_0033_camille_attack4: {
    endFrame: 15,
    callbacks: {
      hit: [1],
    },
  },
  // 卡缪｜战技「驱火焚影」：飞向敌人并在目标周围盘桓的衔火血翼。
  // 发射来源：chr_0033_camille_normal_skill。
  // 取值依据：原生 SourceForward 发射偏移 [0,1.5,0.5]，TargetToSource 终点偏移 [0,1.3,0.3]。敌人在原点、干员在 [-3,0,0] 且面向敌人时，两端为 [-2.5,1.5,0] 与 [-0.3,1.3,0]，并非相距 3 米。无碰撞形状，hitOnReach=true，到达阈值 0.5 米。按原生速度 50 × C(t/5) 积分至 sqrt(2.2²+0.2²)-0.5 米，候选时延约 0.034024 秒，取 2 帧；忽略骨骼挂点。
  projectile_chr_0033_camille_normal_skill: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 卡缪｜普攻（重击）「歃血涤罪」：曲线路径的攻击弹体。
  // 发射来源：chr_0033_camille_power_attack。
  // 取值依据：原生仅使用T1、T3两段二次贝塞尔，未启用资源中的Default/T2。敌我3米，保留发射固定偏移；MidPoint1按目标为中心、TargetToSource方向转换。控制点随机角取中值，忽略挂点；Shape=None且hitOnReach=true，以0.5米阈值切段，并从实际切段位置初始化后段。两段原生速度曲线分别积分 0.370614 + 0.147560 秒，总计0.518174秒，取16帧触发Hit，不按直线3米航程估算。
  projectile_chr_0033_camille_power_attack: {
    endFrame: 16,
    callbacks: { hit: [16] },
  },
  // 卡缪｜普攻（重击）「歃血涤罪」：曲线路径的攻击弹体。
  // 发射来源：chr_0033_camille_power_attack。
  // 取值依据：原生仅使用T1、T3两段二次贝塞尔，未启用资源中的Default/T2。敌我3米，保留发射固定偏移；MidPoint1按目标为中心、TargetToSource方向转换。控制点随机角取中值，忽略挂点；Shape=None且hitOnReach=true，以0.5米阈值切段，并从实际切段位置初始化后段。两段原生速度曲线分别积分 0.473829 + 0.237032 秒，总计0.710861秒，取22帧触发Hit，不按直线3米航程估算。
  projectile_chr_0033_camille_power_attack_L_blue: {
    endFrame: 22,
    callbacks: { hit: [22] },
  },
  // 卡缪｜普攻（重击）「歃血涤罪」：曲线路径的攻击弹体。
  // 发射来源：chr_0033_camille_power_attack。
  // 取值依据：原生仅使用T1、T3两段二次贝塞尔，未启用资源中的Default/T2。敌我3米，保留发射固定偏移；MidPoint1按目标为中心、TargetToSource方向转换。控制点随机角取中值，忽略挂点；Shape=None且hitOnReach=true，以0.5米阈值切段，并从实际切段位置初始化后段。两段原生速度曲线分别积分 0.362506 + 0.164484 秒，总计0.526991秒，取16帧触发Hit，不按直线3米航程估算。
  projectile_chr_0033_camille_power_attack_L_red: {
    endFrame: 16,
    callbacks: { hit: [16] },
  },
  // 卡缪｜普攻（重击）「歃血涤罪」：曲线路径的攻击弹体。
  // 发射来源：chr_0033_camille_power_attack。
  // 取值依据：原生仅使用T1、T3两段二次贝塞尔，未启用资源中的Default/T2。敌我3米，保留发射固定偏移；MidPoint1按目标为中心、TargetToSource方向转换。控制点随机角取中值，忽略挂点；Shape=None且hitOnReach=true，以0.5米阈值切段，并从实际切段位置初始化后段。两段原生速度曲线分别积分 0.371593 + 0.169740 秒，总计0.541333秒，取17帧触发Hit，不按直线3米航程估算。
  projectile_chr_0033_camille_power_attack_R_blue: {
    endFrame: 17,
    callbacks: { hit: [17] },
  },
  // 卡缪｜普攻（重击）「歃血涤罪」：曲线路径的攻击弹体。
  // 发射来源：chr_0033_camille_power_attack。
  // 取值依据：原生仅使用T1、T3两段二次贝塞尔，未启用资源中的Default/T2。敌我3米，保留发射固定偏移；MidPoint1按目标为中心、TargetToSource方向转换。控制点随机角取中值，忽略挂点；Shape=None且hitOnReach=true，以0.5米阈值切段，并从实际切段位置初始化后段。两段原生速度曲线分别积分 0.495457 + 0.180648 秒，总计0.676105秒，取21帧触发Hit，不按直线3米航程估算。
  projectile_chr_0033_camille_power_attack_R_red: {
    endFrame: 21,
    callbacks: { hit: [21] },
  },
  // 提弗洛斯｜普攻第 1 段「追猎荒原」：弓箭攻击发射的箭矢。
  // 发射来源：chr_0034_typhoea_attack1、chr_0034_typhoea_attack2。
  // 取值依据：原生 Owner 到 Target，固定偏移为零；参考距离 3 米，碰撞半径 0.3 米。速度为 38 × C(t/5)，C 为资源中的速度曲线。积分至 2.7 米，候选时延约 0.071054 秒，取 3 帧；忽略骨骼挂点，敌人按点处理。
  projectile_chr_0034_typhoea_archery_attack_01: {
    endFrame: 3,
    callbacks: {
      hit: [3],
    },
  },
  // 提弗洛斯｜普攻第 3 段「追猎荒原」：弓箭攻击发射的箭矢。
  // 发射来源：chr_0034_typhoea_attack3。
  // 取值依据：散射采用对目标有效的直射路径，3米有效路程；不引入挂点高度、敌人胶囊和散射横向脱靶判定。原生速度45米/秒、曲线恒1，ceil(3/45×30)=2帧；保留一次命中。
  projectile_chr_0034_typhoea_archery_attack_03: {
    endFrame: 2,
    callbacks: { hit: [2] },
  },
  // 提弗洛斯｜普攻第 4 段「追猎荒原」：弓箭攻击发射的箭矢。
  // 发射来源：chr_0034_typhoea_attack4。
  // 取值依据：五个入口均从 Owner 到 Target，偏移为零。EntityBB_Degree_Low/High 从 proj_degree 赋值，只改变控制点绕弦轴的角度；对以终点为球心的点目标，绕轴旋转不改变首次覆盖参数，不必给五个角度展开五套时延。 原生二阶曲线，横向控制半径区间取中点；按弦长/基础速度推进参数及 C(t/5) 积分，得 0.141160 秒，取 5 帧命中。采用无沿途地形阻挡、忽略挂点及敌人体积的固定近似；不据此声称原生地面阻挡无效。
  projectile_chr_0034_typhoea_archery_attack_04_01: {
    endFrame: 5,
    callbacks: {
      hit: [5],
    },
  },
  // 提弗洛斯｜普攻第 4 段「追猎荒原」：弓箭攻击发射的箭矢。
  // 发射来源：chr_0034_typhoea_attack4。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度50米/秒且速度曲线恒1，ceil(3 / 50 × 30) = 2帧。
  projectile_chr_0034_typhoea_archery_attack_04_02: {
    endFrame: 2,
    callbacks: {
      hit: [2],
    },
  },
  // 提弗洛斯｜普攻第 5 段「追猎荒原」：弓箭攻击发射的箭矢。
  // 发射来源：chr_0034_typhoea_attack5。
  // 取值依据：attack5入口7瞄准FindTarget(6)生成的Source前方13米固定点，并非敌人。发射武器挂点用离地1米近似；敌人作为3米地面点。直线速度72，5秒归一化速度曲线从0.8到1.2，命中球半径1.2；按扫掠球首次包含敌人距离2.144949米，积分得0.037238秒取2帧。独立阻挡Box的extent=[0.05,0.05,0]，不是命中球；平地无墙，原生extent乘0.5，半尺寸为[0.025,0.025,0]；沿飞行方向旋转后垂直支撑半径为0.025*13/sqrt(170)，飞行sqrt(170)-0.325米触地，积分约0.220509秒取7帧。maxHitCount=-1且不在到达时结束，命中后继续至阻挡；Hit和Block分别调用不同子技能，保留hit2/block7。该高度是时延配置近似，不声称还原武器挂点。
  projectile_chr_0034_typhoea_archery_attack_05: {
    endFrame: 7,
    callbacks: { hit: [2], block: [7] },
  },
  // 提弗洛斯｜普攻（下落攻击）「追猎荒原」：弓箭攻击发射的箭矢。
  // 发射来源：chr_0034_typhoea_plunging_attack_start。
  // 取值依据：终点不是敌人：起手PhysicsCastAction(5)从施放者+[0.2,0,0.2]向下查询地面，FindTarget(6~9)再生成四个落点。地面0、立即输入下落攻击，MovementSetting跳高2.1/重力40/最低起手高度0.6，30FPS第二帧达到约0.775210米；第1帧发射时Start段保持高度，忽略武器挂点。入口14/15/16/17的相对终点依次为[1.4,-h,2.4]/[-1,-h,0]/[-1,-h,2.4]/[1.4,-h,0]。直线速度70，Sphere到达阈值0.2，ceil((距离-0.2)/70*30)依次2/1/2/1帧，短程入口单独覆盖。BlockLayerDef=Nothing，不以提前触地取消到达；无地面的-150米查询失败分支不用于固定地面模型。
  projectile_chr_0034_typhoea_archery_attack_pluging_01: {
    endFrame: 2,
    callbacks: { reach: [2] },
  },
  // 提弗洛斯｜普攻（重击）「追猎荒原」：弓箭攻击发射的箭矢。
  // 发射来源：chr_0034_typhoea_power_attack。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度50米/秒且速度曲线恒1，ceil(3 / 50 × 30) = 2帧。
  projectile_chr_0034_typhoea_archery_attack_power: {
    endFrame: 2,
    callbacks: {
      reach: [2],
    },
  },
  // 提弗洛斯｜连携技「野棘丛生」：向目标齐射的箭矢，落点形成箭阵；此项为其中一个路径资源。
  // 发射来源：chr_0034_typhoea_combo_skill、chr_0034_typhoea_combo_skillfloating。
  // 取值依据：抛物线模式0、重力25、Shape=None按0.5米到达阈值触发hitOnReach。忽略发射挂点；正常入口瞄准3米敌人，显式实体黑板速度42；按原生速度曲线(0,0.8)到(1,1.2)、5秒归一化时钟积分，0.074132秒取3帧。地面固定前方10米入口95为9帧。浮空入口107不覆盖实体黑板，使用投射物自身EntityBB_arrow_speed=60，保留目标向上1米偏移，0.052455秒取2帧；入口112显式速度32、前方10米，0.364578秒取11帧。三项差异分别配置于具体发射入口；无敌人时tar的12米回退不作为单敌人默认场景。
  projectile_chr_0034_typhoea_archery_combo_1: {
    endFrame: 3,
    callbacks: { hit: [3] },
  },
  // 提弗洛斯｜连携技「野棘丛生」：向目标齐射的箭矢，落点形成箭阵；此项为其中一个路径资源。
  // 发射来源：chr_0034_typhoea_combo_skill、chr_0034_typhoea_combo_skillfloating。
  // 取值依据：发射assignPairs显式写入EntityBB_arrow_speed=42，资源中的40为未使用占位值。原生抛物线模式0，水平速度42、重力25、时间倍率恒1。当前有敌人的单目标模型中tar为3米敌人，忽略挂点、等高，按Shape=None的0.5米到达阈值触发hitOnReach：0.059526秒取2帧。InstantSearch固定前方10米的入口为0.226217秒取7帧，单独覆盖。无敌人时tar还可能退化为12米位置，不作为当前单敌人默认场景。
  projectile_chr_0034_typhoea_archery_combo_2: {
    endFrame: 2,
    callbacks: { hit: [2] },
  },
  // 提弗洛斯｜战技「风矢穿林」：浮空攻击链的箭矢；目标、无目标等资源变体分别配置。
  // 发射来源：chr_0034_typhoea_normal_skill_floating_start。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度50米/秒且速度曲线恒1，ceil(3 / 50 × 30) = 2帧。散射以对目标有效的攻击路径标定，不用假定的小胶囊裁掉命中；原生固定终点仍是路径方向依据，不改写为敌人坐标。
  projectile_chr_0034_typhoea_archery_floating_attack_00: {
    endFrame: 2,
    callbacks: { hit: [2] },
  },
  // 提弗洛斯｜战技「风矢穿林」：浮空攻击链的箭矢；目标、无目标等资源变体分别配置。
  // 发射来源：chr_0034_typhoea_floating_attack1、chr_0034_typhoea_floating_attack2、chr_0034_typhoea_floating_attack3、chr_0034_typhoea_floating_attack4、chr_0034_typhoea_floating_attack5。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度200米/秒且速度曲线恒1，ceil(3 / 200 × 30) = 1帧。
  projectile_chr_0034_typhoea_archery_floating_attack_01: {
    endFrame: 1,
    callbacks: {
      hit: [1],
    },
  },
  // 提弗洛斯｜战技「风矢穿林」：浮空攻击链的箭矢（强化射击资源）；目标、无目标等资源变体分别配置。
  // 发射来源：chr_0034_typhoea_floating_attack1、chr_0034_typhoea_floating_attack2、chr_0034_typhoea_floating_attack3、chr_0034_typhoea_floating_attack4、chr_0034_typhoea_floating_attack5。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度200米/秒且速度曲线恒1，ceil(3 / 200 × 30) = 1帧。
  projectile_chr_0034_typhoea_archery_floating_attack_01_enhence: {
    endFrame: 1,
    callbacks: {
      hit: [1],
    },
  },
  // 提弗洛斯｜战技「风矢穿林」：浮空攻击链的箭矢；目标、无目标等资源变体分别配置。
  // 发射来源：chr_0034_typhoea_floating_attack5。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度200米/秒且速度曲线恒1，ceil(3 / 200 × 30) = 1帧。
  projectile_chr_0034_typhoea_archery_floating_attack_05: {
    endFrame: 1,
    callbacks: {
      hit: [1],
    },
  },
  // 提弗洛斯｜战技「风矢穿林」：浮空攻击链的箭矢（强化射击资源）；目标、无目标等资源变体分别配置。
  // 发射来源：chr_0034_typhoea_floating_attack5。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度200米/秒且速度曲线恒1，ceil(3 / 200 × 30) = 1帧。
  projectile_chr_0034_typhoea_archery_floating_attack_05_enhence: {
    endFrame: 1,
    callbacks: {
      hit: [1],
    },
  },
  // 提弗洛斯｜战技「风矢穿林」：浮空攻击链的箭矢（强化射击资源）；目标、无目标等资源变体分别配置。
  // 发射来源：chr_0034_typhoea_floating_attack1、chr_0034_typhoea_floating_attack2、chr_0034_typhoea_floating_attack3、chr_0034_typhoea_floating_attack4、chr_0034_typhoea_floating_attack5。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度200米/秒且速度曲线恒1，ceil(3 / 200 × 30) = 1帧。散射以对目标有效的攻击路径标定，不用假定的小胶囊裁掉命中；原生固定终点仍是路径方向依据，不改写为敌人坐标。
  projectile_chr_0034_typhoea_archery_floating_attack_enhence_ontarget: {
    endFrame: 1,
    callbacks: { hit: [1] },
  },
  // 提弗洛斯｜战技「风矢穿林」：浮空攻击链的箭矢；目标、无目标等资源变体分别配置。
  // 发射来源：chr_0034_typhoea_floating_attack1、chr_0034_typhoea_floating_attack2、chr_0034_typhoea_floating_attack3、chr_0034_typhoea_floating_attack4、chr_0034_typhoea_floating_attack5。
  // 取值依据：采用直射有效路程模型，3米直接表示到命中的有效路程，不再扣投射物半径或引入敌人体型/挂点高度；原生速度200米/秒且速度曲线恒1，ceil(3 / 200 × 30) = 1帧。散射以对目标有效的攻击路径标定，不用假定的小胶囊裁掉命中；原生固定终点仍是路径方向依据，不改写为敌人坐标。
  projectile_chr_0034_typhoea_archery_floating_attack_notarget: {
    endFrame: 1,
    callbacks: { hit: [1] },
  },
  // 梨诺｜普攻第 3 段「怦然星动」：曲线路径的攻击弹体。
  // 发射来源：chr_0035_liino_attack3。
  // 取值依据：普攻第三段21～25号入口均为Owner到Target，固定偏移按SourceForward；敌我3米、忽略挂点，以瞄准点代理受击位置。五组相对偏移(dx,dy)为(-0.5,0)、(-0.3,0.1)、(-0.5,-0.2)、(-0.8,-0.2)、(-0.4,0)。原生三次贝塞尔随机控制点取中值，半径0.2，距离倍率恒1，积分20×C(t/finishDuration)，分别0.165793/0.164555/0.166122/0.169288/0.165051秒，即5/5/5/6/5帧；入口24独立覆盖6帧。
  projectile_chr_0035_liino_attack3_l_02: {
    endFrame: 5,
    callbacks: { hit: [5] },
  },
  // 梨诺｜普攻第 4 段「怦然星动」：曲线路径的攻击弹体。
  // 发射来源：chr_0035_liino_attack4。
  // 取值依据：Owner 到 Target；不同发射入口的起点偏移分别为 [0.5,0,0]、[0.5,0.2,0]，终点偏移均为零。敌我相距 3 米、忽略挂点时，实际弦长分别 3.041381、3.047950 米。原生距离倍率虽开启，但曲线恒为 1；基础速度 45×C(t/3)。贝塞尔随机区间取中点，按原生弦长/速度推进参数，求半径 0.2 米球首次覆盖点目标，得到 0.125490、0.125768 秒，两个入口均取 4 帧。
  projectile_chr_0035_liino_attack4_l: {
    endFrame: 4,
    callbacks: {
      hit: [4],
    },
  },
  // 梨诺｜普攻第 4 段「怦然星动」：曲线路径的攻击弹体。
  // 发射来源：chr_0035_liino_attack4。
  // 取值依据：原生发射采用 TargetForward 偏移，目标固定偏移为零。敌我中心相距 3 米、敌人面向干员；发射横向偏移绝对值 0.5 米、高度 0 米，因此两端距离 sqrt(3²+0.5²+0²)=3.041381 米，不直接用 3 米作航程。贝塞尔随机区间取中点，按原生速度曲线 C(t/5) 推进，对点目标取碰撞半径 0.2 米；代表构型时延 0.127780 秒，候选 4 帧。忽略骨骼挂点。
  projectile_chr_0035_liino_attack4_r: {
    endFrame: 4,
    callbacks: {
      hit: [4],
    },
  },
  // 梨诺｜战技「闪耀焦点」：演唱姿态相关的攻击弹体；资源含左右及 VFX 变体。
  // 发射来源：chr_0035_liino_normal_skill_projhit_start。
  // 取值依据：原生起终点查询同一位置，起点额外加 [0,5,0]；有目标时用 smart_target，无目标分支使用同一个前方固定点，两种分支都是从该点上方下落 5 米，与敌我 3 米距离无关。采用地面 Y=0、目标位置在地面上的近似；阻挡共用半径 0.5 米球，中心降至 0.5 米触地。距离速度曲线在 5 米处取 1.796801 倍，按原生 C(t/3) 积分；贝塞尔纵向控制比例取随机区间中点，候选落地时延 0.136686 秒，取 5 帧。
  projectile_chr_0035_liino_normal_attack: {
    endFrame: 5,
    callbacks: {
      block: [5],
    },
  },
  // 梨诺｜战技「闪耀焦点」：演唱姿态相关的攻击弹体；资源含左右及 VFX 变体。
  // 发射来源：chr_0035_liino_normal_skill。
  // 取值依据：这是朝自身上空 FixedPointFinder 固定点发射的中转阶段，不以敌人为终点。起点 Owner 偏移 [0.5,0,0]，各终点高度 7 米，实际弦长与敌我距离无关；三阶曲线随机参数取区间中点，按原生速度曲线及距离倍率积分，球形到达阈值为 0.2 米。节点 19 的终点 [1,7,0.5]，弦长 7.035624 米，0.438720 秒取 14 帧。 节点 20 的终点 [-1,7,-0.5]，弦长 7.176350 米，0.447697 秒取 14 帧。 节点 21 的终点 [2,7,-1.5]，弦长 7.314369 米，0.456523 秒取 14 帧。 节点 22 的终点 [-2,7,-1.5]，弦长 7.582875 米，0.473751 秒取 15 帧。节点 22 单独覆盖为 15 帧，其余取预设 14 帧。 采用固定朝向、忽略挂点和沿途地形阻挡的上射近似。
  projectile_chr_0035_liino_normal_attack_02: {
    endFrame: 14,
    callbacks: {
      reach: [14],
    },
  },
  // 梨诺｜战技「闪耀焦点」：演唱姿态相关的攻击弹体；资源含左右及 VFX 变体。
  // 发射来源：chr_0035_liino_normal_skill。
  // 取值依据：这是朝自身上空 FixedPointFinder 固定点发射的中转阶段，不以敌人为终点。起点 Owner 偏移 [0.5,0,0]，各终点高度 7 米，实际弦长与敌我距离无关；三阶曲线随机参数取区间中点，按原生速度曲线及距离倍率积分，球形到达阈值为 0.2 米。节点 17 的终点 [3,7,1.5]，弦长 7.582875 米，0.567652 秒取 18 帧。 节点 18 的终点 [-3,7,1.5]，弦长 7.968689 米，0.593390 秒取 18 帧。两个入口共用 18 帧。 采用固定朝向、忽略挂点和沿途地形阻挡的上射近似。
  projectile_chr_0035_liino_normal_attack_03: {
    endFrame: 18,
    callbacks: {
      reach: [18],
    },
  },
  // 梨诺｜战技「闪耀焦点」：演唱姿态相关的攻击弹体；资源含左右及 VFX 变体。
  // 发射来源：buff_chr_0035_liino_normalskill_music_animation_hitl。
  // 取值依据：原生从 Owner+[0.5,0,0] 到 Context[smart_target]，终点无偏移；以单敌人智能目标、固定同高站位且忽略挂点计算，敌我 3 米对应弦长 sqrt(3²+0.5²)=3.041381 米。三阶曲线分别使用各自原生控制点，随机区间取中点；左变体开启的距离倍率曲线恒为 1，速度曲线横轴归一化时间为 t/3。球半径 0.4 米，以曲线首次覆盖终点的参数积分，得到 0.208633 秒，取 7 帧命中。仅在无沿途地形阻挡的点目标近似下取值，不能因为最终帧数相同而混用两套曲线。
  projectile_chr_0035_liino_normal_attack_l: {
    endFrame: 7,
    callbacks: {
      block: [7],
    },
  },
  // 梨诺｜战技「闪耀焦点」：演唱姿态相关的攻击弹体；资源含左右及 VFX 变体。
  // 发射来源：buff_chr_0035_liino_normalskill_music_animation_hitl。
  // 取值依据：原生仅启用Block：WallAndGround且阻挡后结束；autoSetTargetFaction=false、targetFactionType=0，TargetFilter.Filter(1.6.3 RVA 0x05504EA0)按掩码检查必不接受战斗目标，故不会因maxHitCount提前结束。敌我水平距3米，采用发射挂点高1米、目标基点地面近似，并保留各入口固定偏移。三次贝塞尔随机控制点取中值；模板径向上方分量为sin(angle)。求球半径0.4米首次触地参数，再积分原生速度曲线，得0.195990秒，取6帧。高度0.5～2米敏感性结果为6～8帧，不作为挂点实测值。
  projectile_chr_0035_liino_normal_attack_l_vfx01: {
    endFrame: 6,
    callbacks: { block: [6] },
  },
  // 梨诺｜战技「闪耀焦点」：演唱姿态相关的攻击弹体；资源含左右及 VFX 变体。
  // 发射来源：buff_chr_0035_liino_normalskill_music_animation_hitl。
  // 取值依据：原生仅启用Block：WallAndGround且阻挡后结束；autoSetTargetFaction=false、targetFactionType=0，TargetFilter.Filter(1.6.3 RVA 0x05504EA0)按掩码检查必不接受战斗目标，故不会因maxHitCount提前结束。敌我水平距3米，采用发射挂点高1米、目标基点地面近似，并保留各入口固定偏移。三次贝塞尔随机控制点取中值；模板径向上方分量为sin(angle)。求球半径0.4米首次触地参数，再积分原生速度曲线，得0.203611秒，取7帧。高度0.5～2米敏感性结果为6～8帧，不作为挂点实测值。
  projectile_chr_0035_liino_normal_attack_l_vfx02: {
    endFrame: 7,
    callbacks: { block: [7] },
  },
  // 梨诺｜战技「闪耀焦点」：演唱姿态相关的攻击弹体；资源含左右及 VFX 变体。
  // 发射来源：buff_chr_0035_liino_normalskill_music_animation_hitl。
  // 取值依据：原生从 Owner+[0.5,0,0] 到 Context[smart_target]，终点无偏移；以单敌人智能目标、固定同高站位且忽略挂点计算，敌我 3 米对应弦长 sqrt(3²+0.5²)=3.041381 米。三阶曲线分别使用各自原生控制点，随机区间取中点；右变体不启用距离倍率，速度曲线横轴归一化时间为 t/5。球半径 0.4 米，以曲线首次覆盖终点的参数积分，得到 0.216782 秒，取 7 帧命中。仅在无沿途地形阻挡的点目标近似下取值，不能因为最终帧数相同而混用两套曲线。
  projectile_chr_0035_liino_normal_attack_r: {
    endFrame: 7,
    callbacks: {
      block: [7],
    },
  },
  // 梨诺｜战技「闪耀焦点」：演唱姿态相关的攻击弹体；资源含左右及 VFX 变体。
  // 发射来源：buff_chr_0035_liino_normalskill_music_animation_hitl。
  // 取值依据：原生仅启用Block：WallAndGround且阻挡后结束；autoSetTargetFaction=false、targetFactionType=0，TargetFilter.Filter(1.6.3 RVA 0x05504EA0)按掩码检查必不接受战斗目标，故不会因maxHitCount提前结束。敌我水平距3米，采用发射挂点高1米、目标基点地面近似，并保留各入口固定偏移。三次贝塞尔随机控制点取中值；模板径向上方分量为sin(angle)。求球半径0.4米首次触地参数，再积分原生速度曲线，得0.201152秒，取7帧。高度0.5～2米敏感性结果为6～8帧，不作为挂点实测值。
  projectile_chr_0035_liino_normal_attack_r_vfx01: {
    endFrame: 7,
    callbacks: { block: [7] },
  },
  // 梨诺｜战技「闪耀焦点」：演唱姿态相关的攻击弹体；资源含左右及 VFX 变体。
  // 发射来源：buff_chr_0035_liino_normalskill_music_animation_hitl。
  // 取值依据：原生仅启用Block：WallAndGround且阻挡后结束；autoSetTargetFaction=false、targetFactionType=0，TargetFilter.Filter(1.6.3 RVA 0x05504EA0)按掩码检查必不接受战斗目标，故不会因maxHitCount提前结束。敌我水平距3米，采用发射挂点高1米、目标基点地面近似，并保留各入口固定偏移。三次贝塞尔随机控制点取中值；模板径向上方分量为sin(angle)。求球半径0.4米首次触地参数，再积分原生速度曲线，得0.217180秒，取7帧。高度0.5～2米敏感性结果为6～8帧，不作为挂点实测值。
  projectile_chr_0035_liino_normal_attack_r_vfx02: {
    endFrame: 7,
    callbacks: { block: [7] },
  },
  // 梨诺｜战技「闪耀焦点」：姿态相关的扩散声波；对应歌声范围效果，非普通飞行子弹。
  // 发射来源：buff_chr_0035_liino_normalskill_music_damage。
  // 取值依据：由战技给施放者自身添加的 music_damage Buff 发射；起终点均为 Source+[0,1.5,0]，本体速度为 0，命中来自环形碰撞范围扩张，不能按飞行距离计算。地面点目标距干员 3 米，外半径从 1.5 米以 10 米/秒扩张，首次覆盖需 (3-1.5)/10=0.15 秒，即第 5 帧；此时内半径为 1.5 米，目标仍在环内。高度 3 米覆盖地面，禁止重复命中；自然寿命 0.45 秒取 14 帧。
  projectile_chr_0035_liino_normal_attack_soundwave: {
    endFrame: 14,
    callbacks: {
      hit: [5],
    },
  },
  // 梨诺｜战技「闪耀焦点」：姿态相关的扩散声波；对应歌声范围效果，非普通飞行子弹。
  // 发射来源：buff_chr_0035_liino_normalskill_music_damage。
  // 取值依据：由战技给施放者自身添加的 music_damage Buff 发射；起终点均为 Source+[0,1.5,0]，本体速度为 0，命中来自环形碰撞范围扩张，不能按飞行距离计算。地面点目标距干员 3 米，外半径从 1.5 米以 10 米/秒扩张，首次覆盖需 (3-1.5)/10=0.15 秒，即第 5 帧；此时内半径为 1.5 米，目标仍在环内。高度 3 米覆盖地面，禁止重复命中；自然寿命 0.45 秒取 14 帧。
  projectile_chr_0035_liino_normal_attack_soundwave_chrdung: {
    endFrame: 14,
    callbacks: {
      hit: [5],
    },
  },
  // 梨诺｜战技「闪耀焦点」：演唱姿态相关的攻击弹体；资源含左右及 VFX 变体。
  // 发射来源：chr_0035_liino_normal_skill_projhit_start_vfx、chr_0035_liino_normal_skill_projhit_start_vfx02。
  // 取值依据：原生起终点查询同一位置，起点额外加 [0,5,0]；有目标时用 smart_target，无目标分支使用同一个前方固定点，两种分支都是从该点上方下落 5 米，与敌我 3 米距离无关。采用地面 Y=0、目标位置在地面上的近似；阻挡共用半径 0.5 米球，中心降至 0.5 米触地。距离速度曲线在 5 米处取 1.796801 倍，按原生 C(t/3) 积分；贝塞尔纵向控制比例取随机区间中点，候选落地时延 0.136686 秒，取 5 帧。
  projectile_chr_0035_liino_normal_attack_vfx: {
    endFrame: 5,
    callbacks: {
      block: [5],
    },
  },
  // 梨诺｜战技「闪耀焦点」：演唱姿态相关的攻击弹体；资源含左右及 VFX 变体。
  // 发射来源：chr_0035_liino_normal_skill_projhit_start_vfx03。
  // 取值依据：原生起终点查询同一位置，起点额外加 [0,5,0]；有目标时用 smart_target，无目标分支使用同一个前方固定点，两种分支都是从该点上方下落 5 米，与敌我 3 米距离无关。采用地面 Y=0、目标位置在地面上的近似；阻挡共用半径 0.5 米球，中心降至 0.5 米触地。距离速度曲线在 5 米处取 1.796801 倍，按原生 C(t/3) 积分；贝塞尔纵向控制比例取随机区间中点，候选落地时延 0.136686 秒，取 5 帧。
  projectile_chr_0035_liino_normal_attack_vfx_03: {
    endFrame: 5,
    callbacks: {
      block: [5],
    },
  },
  // 梨诺｜战技「闪耀焦点」：演唱姿态相关的攻击弹体；资源含左右及 VFX 变体。
  // 发射来源：chr_0035_liino_normal_skill_projhit_start_vfx04。
  // 取值依据：原生起终点查询同一位置，起点额外加 [0,5,0]；有目标时用 smart_target，无目标分支使用同一个前方固定点，两种分支都是从该点上方下落 5 米，与敌我 3 米距离无关。采用地面 Y=0、目标位置在地面上的近似；阻挡共用半径 0.5 米球，中心降至 0.5 米触地。距离速度曲线在 5 米处取 1.796801 倍，按原生 C(t/3) 积分；贝塞尔纵向控制比例取随机区间中点，候选落地时延 0.103811 秒，取 4 帧。
  projectile_chr_0035_liino_normal_attack_vfx_04: {
    endFrame: 4,
    callbacks: {
      block: [4],
    },
  },
  // 梨诺｜普攻（下落攻击）「怦然星动」：曲线路径的攻击弹体。
  // 发射来源：chr_0035_liino_plunging_attack_end。
  // 取值依据：实际六个发射中只有 chr_0035_liino_plunging_attack_end:13 启用 reach 回调；其余五个无回调入口按显式裁剪配置省略，不能把整个资源删掉。有效入口从 Owner+[0,1.3,0] 到 Owner+[-0.9,0,0.9]，弦长 sqrt(0.9²+1.3²+0.9²)=1.819341 米，与敌我距离无关。二阶控制点已核准，距离倍率 1.440868、基础速度 6 米/秒、时间曲线恒为 1；球形到达阈值 min(0.5,0.15)=0.15 米，计算 0.204329 秒，取 7 帧到达并结束。阻挡类型 Nothing，故不额外推导地面碰撞；忽略挂点。
  projectile_chr_0035_liino_plunging_attack: {
    endFrame: 7,
    callbacks: {
      reach: [7],
    },
  },
  // 梨诺｜终结技「晨星的协奏曲」：终结技舞台焰火链中的爆点弹体。
  // 取值依据：能力实体在施放者位置生成；发射偏移 [0,6,-6]，有目标分支终点 [0,0,3]、空目标分支 [0,0,6]，弦长分别 sqrt(117) 与 sqrt(180) 米。原生三次贝塞尔（随机控制点取中值）、速度100×C(t/finishDuration)，距离倍率恒1；Shape=None，以0.5米到达阈值求参数并积分时钟，分别 0.204034秒/7帧、0.249819秒/8帧。默认7帧，入口46覆盖为8帧；忽略挂点。
  projectile_chr_0035_liino_ultskill_bomb: {
    endFrame: 7,
    callbacks: { reach: [7] },
  },
  // 梨诺｜终结技「晨星的协奏曲」：高歌姿态释放的舞台焰火；左右及编号资源分别配置。
  // 取值依据：正式来源为施放者位置生成的能力实体子技能，起终点均计入 SourceForward 固定偏移；目标分支取敌我3米，空目标分支取前方6米。原生三次贝塞尔，随机控制点取中值；无碰撞形状，按0.5米到达阈值求参数，再积分40×C(t/finishDuration)，距离倍率恒为1。各入口取值见 projectileSchedules.ts；此处采用首个正式入口 49 的 10 帧作为默认值。旧 bullet_hit Buff 无当前调用者，不将其10米分支混入正式入口。
  projectile_chr_0035_liino_ultskill_l_01: {
    endFrame: 10,
    callbacks: { reach: [10] },
  },
  // 梨诺｜终结技「晨星的协奏曲」：高歌姿态释放的舞台焰火；左右及编号资源分别配置。
  // 取值依据：正式来源为施放者位置生成的能力实体子技能，起终点均计入 SourceForward 固定偏移；目标分支取敌我3米，空目标分支取前方6米。原生三次贝塞尔，随机控制点取中值；无碰撞形状，按0.5米到达阈值求参数，再积分40×C(t/finishDuration)，距离倍率恒为1。各入口取值见 projectileSchedules.ts；此处采用首个正式入口 21 的 17 帧作为默认值。旧 bullet_hit Buff 无当前调用者，不将其10米分支混入正式入口。
  projectile_chr_0035_liino_ultskill_l_02: {
    endFrame: 17,
    callbacks: { reach: [17] },
  },
  // 梨诺｜终结技「晨星的协奏曲」：高歌姿态释放的舞台焰火；左右及编号资源分别配置。
  // 取值依据：正式来源为施放者位置生成的能力实体子技能，起终点均计入 SourceForward 固定偏移；目标分支取敌我3米，空目标分支取前方6米。原生三次贝塞尔，随机控制点取中值；无碰撞形状，按0.5米到达阈值求参数，再积分40×C(t/finishDuration)，距离倍率恒为1。各入口取值见 projectileSchedules.ts；此处采用首个正式入口 3 的 16 帧作为默认值。旧 bullet_hit Buff 无当前调用者，不将其10米分支混入正式入口。
  projectile_chr_0035_liino_ultskill_l_03: {
    endFrame: 16,
    callbacks: { reach: [16] },
  },
  // 梨诺｜终结技「晨星的协奏曲」：高歌姿态释放的舞台焰火；左右及编号资源分别配置。
  // 取值依据：正式来源为施放者位置生成的能力实体子技能，起终点均计入 SourceForward 固定偏移；目标分支取敌我3米，空目标分支取前方6米。原生三次贝塞尔，随机控制点取中值；无碰撞形状，按0.5米到达阈值求参数，再积分40×C(t/finishDuration)，距离倍率恒为1。各入口取值见 projectileSchedules.ts；此处采用首个正式入口 50 的 10 帧作为默认值。旧 bullet_hit Buff 无当前调用者，不将其10米分支混入正式入口。
  projectile_chr_0035_liino_ultskill_r_01: {
    endFrame: 10,
    callbacks: { reach: [10] },
  },
  // 梨诺｜终结技「晨星的协奏曲」：高歌姿态释放的舞台焰火；左右及编号资源分别配置。
  // 取值依据：正式来源为施放者位置生成的能力实体子技能，起终点均计入 SourceForward 固定偏移；目标分支取敌我3米，空目标分支取前方6米。原生三次贝塞尔，随机控制点取中值；无碰撞形状，按0.5米到达阈值求参数，再积分40×C(t/finishDuration)，距离倍率恒为1。各入口取值见 projectileSchedules.ts；此处采用首个正式入口 22 的 17 帧作为默认值。旧 bullet_hit Buff 无当前调用者，不将其10米分支混入正式入口。
  projectile_chr_0035_liino_ultskill_r_02: {
    endFrame: 17,
    callbacks: { reach: [17] },
  },
  // 梨诺｜终结技「晨星的协奏曲」：高歌姿态释放的舞台焰火；左右及编号资源分别配置。
  // 取值依据：正式来源为施放者位置生成的能力实体子技能，起终点均计入 SourceForward 固定偏移；目标分支取敌我3米，空目标分支取前方6米。原生三次贝塞尔，随机控制点取中值；无碰撞形状，按0.5米到达阈值求参数，再积分40×C(t/finishDuration)，距离倍率恒为1。各入口取值见 projectileSchedules.ts；此处采用首个正式入口 4 的 16 帧作为默认值。旧 bullet_hit Buff 无当前调用者，不将其10米分支混入正式入口。
  projectile_chr_0035_liino_ultskill_r_03: {
    endFrame: 16,
    callbacks: { reach: [16] },
  },
  // 梨诺｜终结技「晨星的协奏曲」：姿态相关的扩散声波；对应歌声范围效果，非普通飞行子弹。
  // 发射来源：buff_chr_0035_liino_ultskill_music_damage。
  // 取值依据：原生终结技节点 59 将周期 Buff 施加给 Source；1.6.3 Buff.OnTrigger(0x06858C00) 传 null target，_ExecuteBuffAction(0x05BFFE30) 默认使用 Buff owner。因此 Source 与 Target 均为梨诺，起终点同为自身+[0,1.5,0]，圆心不平移。Ring 外半径=2+10t、内半径=10t、高度3；3米点目标在 t=(3-2)/10=0.1 秒进入，取3帧。寿命0.4秒取12帧；finishOnReach=false、阻挡Nothing。忽略目标挂点，在高度边界包含点目标的近似下计算。
  projectile_chr_0035_liino_ultskill_soundwave: {
    endFrame: 12,
    callbacks: {
      hit: [3],
    },
  },
  // 梨诺｜终结技「晨星的协奏曲」：姿态相关的扩散声波；对应歌声范围效果，非普通飞行子弹。
  // 发射来源：chr_0035_liino_ultimate_skill。
  // 取值依据：原生发射起终点均为 Source，加 [0,1.5,0]，移动速度为 0；命中由圆环扩张触发，不按 3 米飞行计算。
  // 原生外半径从 2 米以 10 米/秒扩张；敌人参考水平距离 3 米，命中候选帧 ceil((3 - 2) / 10 × 30) = 3。假定目标处于圆环高度范围内；固定点模型，不是实测时延。
  // 原生持续 0.4 秒、finishOnReach=false、同目标不可重复命中；结束帧保留 12，不在首次命中时提前回收。
  projectile_chr_0035_liino_ultskill_soundwave_02: {
    endFrame: 12,
    callbacks: {
      hit: [3],
    },
  },
  // 梨诺｜终结技「晨星的协奏曲」：高歌姿态向队友扩散的治疗声波。
  // 发射来源：buff_chr_0035_liino_ultskill_music_damage。
  // 取值依据：治疗圆环从音乐Buff的Source干员上方1.5米生成，只筛选友方角色，不是敌人。队友与施放者同处一个平面位置、角色体表在环高度范围内的近似下，第一帧覆盖友方；不能沿用伤害波到3米敌人的3帧。原生1.6.3 _ProcessScale(0x04FE9E50)冷分支0x0741DA46读取旧innerRadius(+0xb8)，0x0741DA59存入preMoveInnerRadius(+0xc0)，然后才增长内外半径；_CheckOverlap在0x0552E410读取该旧内半径传入_OverlapShape。初始内半径0，第一帧扩张区间包含圆心，取hit1。allowHitSameTarget=false，不重复命中。
  projectile_chr_0035_liino_ultskill_soundwave_heal: {
    endFrame: 12,
    callbacks: { hit: [1] },
  },
  // 祀｜战技「河山共影」：墨魂消失后朝原目标回归并爆发的弹体，对应战技收笔及笔意爆发链。
  // 发射来源：buff_chr_0036_jsspsi_xianjing_inkboom。
  // 取值依据：实例创建时执行发射回调。
  projectile_chr_0036_jsspsi_normal_skill_inkboom: {
    endFrame: 0,
    callbacks: {
      launch: [0],
    },
  },
  // 噗切娜｜连携技「点心还是“礼物”」：礼盒开出的子投射物。
  // 取值依据：礼盒由combo_skill_gene的FindTarget(0)/SpawnAbilityEntity(1)生成在主控Head上方0.6米；忽略骨骼高度，保留全部出生/发射/目标偏移。二次Bezier控制点轴向0.2、上偏0.35，按原生距离倍率和5秒归一化速度曲线积分。旧buff_chr_0038_purrche_combo_giftbox仅在自身文件出现，在当前SkillData/BuffData及生成定义无外部引用，不混入该旧命中路径。入口20/30发射高度1.8、终点敌人前0.2米且上偏0.1米，水平2.8米；22/32与24/34发射高度1.6、终点前方10/7米且高0.1米。速度30、到达阈值0.1，先到达后触地，分别0.226033/0.409411/0.373272秒取7/13/12帧，固定点入口单独覆盖。
  projectile_chr_0038_purrche_combo_skill_1: {
    endFrame: 7,
    callbacks: { block: [], reach: [7] },
  },
  // 噗切娜｜连携技「点心还是“礼物”」：礼盒开出的子投射物。
  // 取值依据：礼盒由combo_skill_gene的FindTarget(0)/SpawnAbilityEntity(1)生成在主控Head上方0.6米；忽略骨骼高度，保留全部出生/发射/目标偏移。二次Bezier控制点轴向0.2、上偏0.35，按原生距离倍率和5秒归一化速度曲线积分。旧buff_chr_0038_purrche_combo_giftbox仅在自身文件出现，在当前SkillData/BuffData及生成定义无外部引用，不混入该旧命中路径。入口42发射高度0.8、终点3米敌人脚下，速度35，球半径0.1先触地，0.209954秒取7帧；44/46前方10/7米且高1米，先到达，0.303973/0.327429秒均取10帧，分别覆盖。
  projectile_chr_0038_purrche_combo_skill_3: {
    endFrame: 7,
    callbacks: { block: [7], reach: [] },
  },
  // 噗切娜｜连携技「点心还是“礼物”」：礼盒开出的子投射物。
  // 取值依据：正式入口giftbox_abilityrange:37在ForEach(team)中发射，Target是当前队友而非敌人。近似队友与主控同位置、忽略Head等挂点高度；保留礼盒出生+0.6米、发射+0.2米，中间点相对礼盒[-1,0.5,1]，目标相对队友[0,1,0]。先用模式2抛物线(水平速度10/重力10)从[0,0.8,0]到[-1,1.1,1]，Shape=None到达阈值0.5米，0.092097秒于[-0.651224,1.018080,0.651224]切换；不吸附中间点。再用Default抛物线模式1(时长0.3秒/弧顶+0.1米)到[0,1,0]，0.141734秒到达，合计0.233831秒取8帧。两段速度曲线恒1且不启用距离倍率，hitOnReach调用Hit。旧combo_giftbox Buff无外部引用，不混入旧入口。
  projectile_chr_0038_purrche_combo_skill_4: {
    endFrame: 8,
    callbacks: { hit: [8] },
  },
  // 噗切娜｜连携技「点心还是“礼物”」：扔给主控干员的礼物匣子。
  // 发射来源：chr_0038_purrche_combo_skill。
  // 取值依据：原生终点查询 MainCharacter，box_pos 和嵌入的 MainTargetFinder 不是当前分支使用的目标；起点 FixedPointFinder 先加 [0,1,0]，随后叠加 emitPosFixedOffset。按队友同侧同站位、忽略挂点的近似，常规入口起终点差为 [0.65,1.45,0]，而非敌我 3 米。启用原生距离速度倍率后，节点 221/315/409 到达 0.5 米阈值需 0.108280 秒，取 4 帧；节点 314/408 的额外偏移为 [0,0.6,0]，实际航程只有 1 米，需 0.050787 秒、2 帧，在 projectileSchedules 中分别覆盖。 队友真实位置分散时会变化，此值不是实战固定时延。
  projectile_chr_0038_purrche_combo_skill_giftbox: {
    endFrame: 4,
    callbacks: {
      hit: [4],
    },
  },
  // 噗切娜｜连携技「点心还是“礼物”」：扔给主控干员的礼物匣子（自身目标变体）。
  // 发射来源：chr_0038_purrche_combo_skill。
  // 取值依据：原生终点查询 MainCharacter，box_pos 和嵌入的 MainTargetFinder 不是当前分支使用的目标；起点 FixedPointFinder 先加 [0,1,0]，随后叠加 emitPosFixedOffset。按队友同侧同站位、忽略挂点的近似，常规入口起终点差为 [0.65,1.45,0]，而非敌我 3 米。自用变体不启用距离速度倍率，二阶曲线按原生速度 50 米/秒推进，到达 0.5 米阈值需 0.022582 秒，取 1 帧。 队友真实位置分散时会变化，此值不是实战固定时延。
  projectile_chr_0038_purrche_combo_skill_giftbox_self: {
    endFrame: 1,
    callbacks: {
      hit: [1],
    },
  },
  // 噗切娜｜终结技「不许干坏事！」：礼盒开出的子投射物。
  // 发射来源：chr_0038_purrche_ultimate_skill。
  // 取值依据：原生抛物线模式1：弧顶max(y0,y1)+0.5，参数总时长0.2秒，反推竖直初速和重力；发射时EntityBB_speed虽赋值13/15，但本模式不使用速度构造轨迹。按敌人中心3米、主控和镜头面向敌人，忽略骨骼挂点，保留每个入口的发射及终点偏移；上下文固定点取相应FindTarget位置，不替换成敌人。球半径0.1与地面0首次接触后触发Block，WallAndGround阻挡结束，不再Reach。时间参数再用原生距离倍率与5秒归一化速度曲线积分换算，入口全部单独配置，默认采用首个入口101的17帧。
  projectile_chr_0038_purrche_ult_skill_1: {
    endFrame: 17,
    callbacks: { block: [17], reach: [] },
  },
  // 噗切娜｜终结技「不许干坏事！」：礼盒开出的子投射物。
  // 发射来源：chr_0038_purrche_ultimate_skill。
  // 取值依据：原生抛物线模式1，弧顶max(y0,y1)+0.5、参数总时长0.2秒；不以EntityBB_speed构造该模式轨迹。按3米敌人、朝向和镜头面向敌人、忽略挂点，保留各入口发射和目标偏移，用距离倍率及5秒归一化速度曲线换算时刻。原生Custom掩码193=Default(0)|Walkable(6)|Climbable(7)，层表证据见combat-spec launch-projectile-skill-routing.md的2026-09-25记录；本近似平地明确采用Walkable，而非未包含的Terrain(20)。球半径0.2，取首次到达/触地；36个入口单独配置。首入口106瞄准带偏移目标，12帧到达。
  projectile_chr_0038_purrche_ult_skill_2: {
    endFrame: 12,
    callbacks: { block: [], reach: [12] },
  },
  // 噗切娜｜终结技「不许干坏事！」：礼盒开出的子投射物。
  // 发射来源：chr_0038_purrche_ultimate_skill。
  // 取值依据：原生抛物线模式1：弧顶max(y0,y1)+0.5，参数总时长0.2秒，反推竖直初速和重力；发射时EntityBB_speed虽赋值13/15，但本模式不使用速度构造轨迹。按敌人中心3米、主控和镜头面向敌人，忽略骨骼挂点，保留每个入口的发射及终点偏移；上下文固定点取相应FindTarget位置，不替换成敌人。球半径0.1与地面0首次接触后触发Block，WallAndGround阻挡结束，不再Reach。时间参数再用原生距离倍率与5秒归一化速度曲线积分换算，入口全部单独配置，默认采用首个入口110的13帧。
  projectile_chr_0038_purrche_ult_skill_3: {
    endFrame: 13,
    callbacks: { block: [13], reach: [] },
  },
};

/** Explicit dummy-model omission: also removes the instance from SkillAffix lifetime tracking.
 * Applies only to launches with no enabled native callbacks, not every use of these resources. */
export const omittedCallbacklessProjectileIds: ReadonlySet<string> = new Set([
  // 艾尔黛拉｜「岩石的轻语」重击起始弹体，无启用回调。
  'projectile_chr_0025_ardelia_power_attack_start',
  // 艾尔黛拉｜「岩石的轻语」重击弹体，无启用回调。
  'projectile_chr_0025_ardelia_power_attack',
  // 梨诺｜「怦然星动」普攻第三段 R 侧资源，无启用回调。
  'projectile_chr_0035_liino_attack3_r_02',
  // 梨诺｜「怦然星动」普攻第四段 L 侧资源，无启用回调。
  'projectile_chr_0035_liino_attack4_l_02',
  // 梨诺｜「怦然星动」普攻第四段 R 侧资源，无启用回调。
  'projectile_chr_0035_liino_attack4_r_02',
  // 汤汤｜连携水流后续资源，无启用回调。
  'projectile_chr_0027_tangtang_waterwake01',
  // 狼卫｜终结技资源，无启用回调。
  'projectile_chr_0006_wolfgd_UltimateWolf',
  // 庄方宜｜「疾电法」下落起手资源，无启用回调。
  'projectile_chr_0030_zhuangfy_air_attack',
  // 梨诺｜「怦然星动」下落攻击；仅裁剪无回调发射，有到达回调的发射保留。
  'projectile_chr_0035_liino_plunging_attack',
]);
