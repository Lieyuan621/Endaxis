/** 由 tools/editor/generateDefinitionSchemas.ts 从正式契约生成，请勿手改。 */
import type { DefinitionSchemaCatalog } from './fieldSchema';
const schema_4107b248d073 = { unionVariants: [{}, {}] } as const;
const schema_f27fc5f4f63d = { aliases: ['LevelValues'] } as const;
const schema_0027e97043bf = { unionVariants: [{}, {}, {}] } as const;
const schema_36938d66df11 = { unionVariants: [{}, {}, {}, {}] } as const;
const schema_18ab763e1525 = { unionVariants: [{}, {}, {}, {}, {}] } as const;
const schema_6675b27ea82d = { aliases: ['ActionGraphReference'] } as const;
const schema_43d88f577f05 = { unionVariants: [{}, {}, {}, {}, {}, {}] } as const;
const schema_41f65db75420 = { reason: 'graph-reference-boundary' } as const;
const schema_bc6e5aef9dfe = { unionVariants: [{}, {}, {}, {}, {}, {}, {}] } as const;
const schema_d056c7fa0b76 = { kind: 'string', referenceKind: 'buff' } as const;
const schema_c7288b42bef0 = { recordValue: schema_4107b248d073 } as const;
const schema_eb26b72c4713 = { kind: 'string', referenceKind: 'skill' } as const;
const schema_ebe2ee1f84c5 = ['strength', 'agility', 'intellect', 'will'] as const;
const schema_140af2d9bf58 = { arrayElement: schema_4107b248d073 } as const;
const schema_6951f167ae16 = { unionVariants: [{}, {}, {}, {}, {}, {}, {}, {}] } as const;
const schema_3a45612f7fc2 = { recordValue: schema_f27fc5f4f63d } as const;
const schema_bbff0d28079e = { kind: 'number', readonlyDeclaration: true } as const;
const schema_85be103572e6 = {
  kind: 'number',
  description: '同一事件有多项响应时的执行优先级。',
} as const;
const schema_1f21df9328c5 = {
  kind: 'opaque',
  fallback: { reason: 'owned-resource-boundary' },
} as const;
const schema_cb135381615b = {
  kind: 'opaque',
  fallback: { reason: 'no-present-type' },
  optional: true,
} as const;
const schema_51a143c4b9a7 = [
  'physical',
  'heat',
  'cryo',
  'electric',
  'nature',
  'true',
  'lifeDrain',
  'ether',
] as const;
const schema_82e7efa7b3e1 = {
  kind: 'array',
  element: { kind: 'number' },
  semantics: { arrayElement: {} },
} as const;
const schema_28e83f505977 = {
  kind: 'string',
  description: '原生 SkillData.skillId，也是干员定义和时间轴引用此技能时使用的唯一 ID。',
} as const;
const schema_d4e3ff1ae98a = {
  kind: 'graph',
  optional: true,
  description: '当前武器词条或套装效果自己的程序图；不按原生 ID 跨对象共享。',
} as const;
const schema_7e5b67c1428e = {
  kind: 'number',
  description: '原生 SkillData.offsetRecordFrame；到达时把下一段普攻提交为连段偏移目标。',
} as const;
const schema_f8c7f6f975a2 = {
  kind: 'string',
  referenceKind: 'skill',
  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
} as const;
const schema_4d4ef7cf5451 = {
  kind: 'number',
  description: '原生 SkillData.exclusiveFrame；只在需要读取当前技能可中断状态时参与运行时判断。',
} as const;
const schema_04620bcedd77 = {
  kind: 'string',
  optional: true,
  description: '与语言无关的展示资源；名称和描述仍由 locale family 按需解析。',
} as const;
const schema_a7c632da5929 = [
  'comboSkill',
  'plungingAttack',
  'basicAttack',
  'battleSkill',
  'ultimate',
  'finisher',
  'dodge',
] as const;
const schema_d31f7e092524 = {
  kind: 'boolean',
  optional: true,
  description: '是否等满一个触发间隔后再首次触发；为 false 时启用后的首次更新即可触发。',
} as const;
const schema_3b569e7c8969 = {
  kind: 'string',
  optional: true,
  description: 'Buff 所属的叠加组；不填时使用 Buff ID，同一组必须使用相同的叠加方式。',
} as const;
const schema_f5e87a023be7 = {
  kind: 'number',
  optional: true,
  description: '原生 `CastData.startCdFrame`；配置消耗时编译器要求此字段存在。',
} as const;
const schema_1235728272b5 = [{ kind: 'number' }, schema_82e7efa7b3e1] as const;
const schema_09fb5d26cbd4 = {
  kind: 'enum',
  options: ['enemy', 'operator'],
  semantics: schema_4107b248d073,
  optional: true,
} as const;
const schema_9ca14269e3d0 = {
  kind: 'union',
  variants: [{ kind: 'string' }, { kind: 'number' }],
  semantics: schema_4107b248d073,
} as const;
const schema_fd02775f055d = {
  elements: [
    { label: 'skillGroupKey', semantics: {} },
    { label: 'skillKey', semantics: {} },
  ],
  minLength: 2,
} as const;
const schema_d2d610731e8e = {
  kind: 'string',
  referenceKind: 'skill',
  optional: true,
  description: '块宽的接续参照技能；覆盖默认接续目标，仅影响显示，不执行该技能。',
} as const;
const schema_5f503bc75d0e = {
  kind: 'condition',
  semantics: { aliases: ['CombatCondition'] },
  optional: true,
  description: '事件发生后还需满足的条件。',
} as const;
const schema_11661fe69962 =
  '原生 `SkillData.durationFrame` 的运行时自然结束周期，已按原生 getter 钳制为至少 1 帧。\n它不决定技能块宽度，也不能用 `exclusiveFrame` 或最后一个可见战斗动作代替。';
const schema_31987bebd7ba = {
  kind: 'enum',
  options: ['team', 'operator'],
  semantics: schema_4107b248d073,
  description: '检查当前干员还是全队来源。',
} as const;
const schema_531a9457dae3 = {
  kind: 'enum',
  options: ['sp', 'ultimateEnergy'],
  semantics: schema_4107b248d073,
  description: '要消耗的战斗资源。',
} as const;
const schema_e458b6c303c5 = [
  { kind: 'number' },
  {
    kind: 'object',
    fields: { blackboardKey: { kind: 'string', description: '读取数值的 Buff 黑板键。' } },
  },
] as const;
const schema_4589467e4874 = {
  kind: 'enum',
  options: ['healer', 'receiver'],
  semantics: schema_4107b248d073,
  description: '只有此修正安装在指定一方时才启用。',
} as const;
const schema_1a1ced796366 = {
  kind: 'enum',
  options: ['electrification', 'corrosion'],
  semantics: schema_4107b248d073,
  description: '目标元素反应。',
} as const;
const schema_0695876eae6b = {
  kind: 'enum',
  options: ['defender', 'attacker'],
  semantics: schema_4107b248d073,
  description: '只有此修正安装在指定一方时才启用。',
} as const;
const schema_bec9f789392d = {
  kind: 'enum',
  options: ['defender', 'attacker'],
  semantics: schema_4107b248d073,
  description: '修正安装在攻击方还是防御方时启用。',
} as const;
const schema_ceffc9c43558 = {
  kind: 'enum',
  options: ['sourceSkillCast'],
  optional: true,
  description: '启用时记录创建该 Buff 的技能施放编号，供 SkillAffix 条件匹配同一次施放。',
} as const;
const schema_63d51aa6a56e = {
  kind: 'object',
  fields: {
    skillId: { kind: 'string', referenceKind: 'skill', description: '该操作请求的技能 ID。' },
  },
  optional: true,
} as const;
const schema_2c482dec22dd = [
  'normalSkill',
  'comboSkill',
  'ultimateSkill',
  'dodge',
  'breakingAttack',
  'passiveSkill',
  'attack',
  'attachSkill',
  'extraActiveSkill',
] as const;
const schema_719183594cc7 = {
  kind: 'enum',
  options: ['assign', 'add', 'multiply'],
  semantics: schema_0027e97043bf,
  description: '对原值执行加算、乘算或直接赋值。',
} as const;
const schema_9f9a48979ad6 = [
  'addition',
  'multiplier',
  'finalAddition',
  'finalMultiplier',
  'baseAddition',
  'baseMultiplier',
  'baseFinalAddition',
  'baseFinalMultiplier',
] as const;
const schema_b6bff737c6f5 = {
  kind: 'opaque',
  fallback: schema_41f65db75420,
  semantics: schema_6675b27ea82d,
  description: '条件成立时执行的动作序列。',
} as const;
const schema_83c50661d5e5 = {
  kind: 'opaque',
  fallback: schema_41f65db75420,
  semantics: schema_6675b27ea82d,
  description: '事件触发后执行的动作序列。',
} as const;
const schema_040e2b54cd31 = [
  { kind: 'number' },
  {
    kind: 'object',
    fields: {
      blackboardKey: {
        kind: 'string',
        blackboardOrigin: 'globalBuff',
        description: '读取持续秒数的 Buff 黑板键。',
      },
    },
  },
] as const;
const schema_2555d4e0ba1c = {
  kind: 'string',
  referenceKind: 'buff',
  optional: true,
  description:
    '该次释放所创建的强化状态 Buff 身份。时间轴只按实际 Buff 回执投影生命周期；\n省略表示没有已取证的强化状态，不能把任意自身 Buff 猜成强化条。',
} as const;
const schema_dfe7358daaf2 = {
  kind: 'enum',
  options: ['default', 'global', 'self'],
  semantics: schema_0027e97043bf,
  optional: true,
  description: '计算持续时间和触发间隔所用的时钟；不填时随全局时间缩放。',
} as const;
const schema_b05d7d181f20 = {
  kind: 'condition',
  semantics: { aliases: ['CombatCondition'] },
  optional: true,
  description:
    '技能释放条件只生成合法性诊断；不成立也不会阻止技能进入模拟。\n模拟层将用户排入时间轴的动作视为已经成功释放，不得改写或跳过。',
} as const;
const schema_813faccfbcb3 = {
  kind: 'union',
  variants: schema_1235728272b5,
  semantics: schema_f27fc5f4f63d,
} as const;
const schema_6ad6215ba3f7 = {
  kind: 'enum',
  options: schema_a7c632da5929,
  semantics: schema_bc6e5aef9dfe,
} as const;
const schema_72850bb1ad5f = {
  kind: 'enum',
  options: ['enemy', 'input', 'trigger'],
  semantics: schema_0027e97043bf,
  optional: true,
  description: '零距离木桩下 StoreSmartTarget 的归约结果；省略表示原技能不执行智能目标存储。',
} as const;
const schema_40c2917eb344 = {
  kind: 'opaque',
  fallback: schema_41f65db75420,
  semantics: schema_6675b27ea82d,
  optional: true,
  description: '所属 Buff 图中的条件动作入口；序列返回真后才执行处理器。',
} as const;
const schema_fc434466b7ee = {
  kind: 'string',
  referenceKind: 'skill',
  optional: true,
  description:
    '基础攻击有序连段中建议的下一技能原生 Skill ID，供技能库递归放置、预览选择，并标记\n已保留实际 AllowNext 动作的定义。正式块宽读取实际动作候选或 canInterrupt，不按该 ID\n预选未来输入。',
} as const;
const schema_3d1bf8fec70a = {
  kind: 'opaque',
  fallback: schema_41f65db75420,
  semantics: schema_6675b27ea82d,
  optional: true,
  description: '能力启用前执行一次；期间自身事件响应关闭，典型用途为原生普通启动 Buff。',
} as const;
const schema_5721ad030ce6 = {
  kind: 'opaque',
  fallback: schema_41f65db75420,
  semantics: schema_6675b27ea82d,
  optional: true,
  description: '能力启用后在帧 0 执行一次；Toggle 初次安装及固定构筑刷新程序使用此入口。',
} as const;
const schema_8478beafcf8a = {
  kind: 'union',
  variants: schema_1235728272b5,
  semantics: schema_f27fc5f4f63d,
  description: '单个数值或按等级排列的数值。',
} as const;
const schema_f163b2906690 = {
  kind: 'union',
  variants: schema_1235728272b5,
  semantics: schema_f27fc5f4f63d,
  description: '单个费用或按技能等级排列的费用。',
} as const;
const schema_cad6182d3965 = {
  kind: 'union',
  variants: schema_1235728272b5,
  semantics: schema_f27fc5f4f63d,
  description: '单个数值或按养成等级排列的数值。',
} as const;
const schema_a4f938dac096 = {
  kind: 'union',
  variants: schema_1235728272b5,
  semantics: schema_f27fc5f4f63d,
  description: '单个加成值或按等级排列的加成值。',
} as const;
const schema_a361791fb8fc = {
  kind: 'union',
  variants: [schema_1f21df9328c5, schema_1f21df9328c5],
  semantics: schema_4107b248d073,
} as const;
const schema_863b2cb8a77f = {
  kind: 'array',
  element: { kind: 'string', semantics: { aliases: ['GameplayTag'] } },
  semantics: { arrayElement: { aliases: ['GameplayTag'] } },
  optional: true,
  description: 'Buff 到期但被延长逻辑暂时阻止结束时，临时挂到所属实体的标签。',
} as const;
const schema_261fb5fd5774 = {
  kind: 'union',
  variants: schema_1235728272b5,
  semantics: schema_f27fc5f4f63d,
  optional: true,
  description: '技能冷却帧数，可按技能等级变化。',
} as const;
const schema_8b88c642c1c1 = {
  kind: 'array',
  element: { kind: 'string', semantics: { aliases: ['GameplayTag'] } },
  semantics: { arrayElement: { aliases: ['GameplayTag'] } },
  optional: true,
  description: 'Buff 的分类标签；启用时同时挂到所属实体，并用于按标签查找、计数和结束 Buff。',
} as const;
const schema_ed6a823b7734 = {
  kind: 'union',
  variants: [
    { kind: 'number' },
    {
      kind: 'object',
      fields: { blackboardKey: { kind: 'string', description: '读取最大层数的 Buff 黑板键。' } },
    },
  ],
  semantics: schema_4107b248d073,
  optional: true,
  description: '可在施加时从该 Buff 已合并的实例黑板解析。',
} as const;
const schema_7c5ce6c644b5 = {
  kind: 'union',
  variants: [
    { kind: 'number' },
    {
      kind: 'object',
      fields: { blackboardKey: { kind: 'string', description: '读取触发次数的 Buff 黑板键。' } },
    },
  ],
  semantics: schema_4107b248d073,
  optional: true,
  description: 'trigger 生命周期动作最多执行的次数；0 表示不触发，负数表示不限制次数。',
} as const;
const schema_392f51ba723b = {
  kind: 'record',
  value: {
    kind: 'union',
    variants: [{ kind: 'null' }, { kind: 'string' }, { kind: 'number' }],
    semantics: schema_0027e97043bf,
  },
  semantics: { recordValue: schema_0027e97043bf },
  optional: true,
  description: '每个 Buff 实例的初始黑板值；施加动作可以覆盖这些值，其他字段也可从中取数。',
} as const;
const schema_ea1506a43797 = {
  kind: 'union',
  variants: schema_040e2b54cd31,
  semantics: schema_4107b248d073,
  optional: true,
  description: 'Buff 启用期间执行 trigger 生命周期动作的时间间隔。',
} as const;
const schema_d7eeb3cea02e = {
  kind: 'enum',
  options: schema_2c482dec22dd,
  semantics: { unionVariants: [{}, {}, {}, {}, {}, {}, {}, {}, {}] },
  description: '`_InitSkills` 创建实例时得到的原生初值；之后可由 ChangeSkillType 改写。',
} as const;
const schema_766ffb12ccde = {
  kind: 'union',
  variants: schema_040e2b54cd31,
  semantics: schema_4107b248d073,
  optional: true,
  description: '在创建/叠层前登记的同 ID 添加冷却；后续被叠层策略拒绝也不撤销，使用普通战斗时间。',
} as const;
const schema_1646c027f760 = {
  kind: 'union',
  variants: schema_040e2b54cd31,
  semantics: schema_4107b248d073,
  optional: true,
  description: '普通 Buff 的持续秒数；不填表示无限持续。定时成长型 Buff 用它表示自动加层周期。',
} as const;
const schema_dcc3197d8b15 = {
  kind: 'record',
  value: schema_813faccfbcb3,
  semantics: schema_3a45612f7fc2,
  optional: true,
  description: '创建时按技能等级解析的动作黑板默认值。',
} as const;
const schema_e4e214b79007 = {
  kind: 'record',
  value: schema_813faccfbcb3,
  semantics: schema_3a45612f7fc2,
  optional: true,
  description: '配装能力的初始黑板，按词条等级解析；初始化与全部事件响应共享同一实例。',
} as const;
const schema_625761b25948 = {
  kind: 'union',
  variants: [
    { kind: 'number' },
    {
      kind: 'object',
      fields: {
        blackboardKey: { kind: 'string', description: '读取优先级的 Buff 黑板键。' },
        negate: { kind: 'boolean', optional: true, description: '是否对读到的数值取负。' },
      },
    },
  ],
  semantics: schema_4107b248d073,
  optional: true,
  description: '仅两种高优先级模式读取此值决定启用顺序；Stack 使用剩余寿命与实例编号选择替换项。',
} as const;
const schema_ff2061aceb44 = {
  kind: 'enum',
  options: [
    'unlimited',
    'stack',
    'highPriority',
    'enhance',
    'refresh',
    'extend',
    'modify',
    'unique',
    'enhanceAndRefresh',
    'overwriteDuration',
    'enhanceAndOverwriteDuration',
    'highPriorityWithMaxStack',
    'timedGrowingEnhance',
  ],
  semantics: { unionVariants: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}] },
  description: '再次施加同一叠加组的 Buff 时，决定新建实例、加层、刷新时长或拒绝施加。',
} as const;
const schema_f29775915ce0 = {
  kind: {
    kind: 'enum',
    options: ['recursiveInput'],
    description: '当前策略通过递归读取输入窗口展开技能链。',
  },
  firstSkillKey: { kind: 'string', referenceKind: 'skill', description: '技能链的第一段。' },
  terminalSkillKey: {
    kind: 'string',
    referenceKind: 'skill',
    description: '到达此技能后停止展开。',
  },
  maxSegments: { kind: 'number', description: '最多放置的技能段数。' },
  fallback: {
    kind: 'enum',
    options: ['sequence'],
    description: '推测失败时按技能组声明顺序放置。',
  },
} as const;
const schema_3c8414c0c980 = {
  kind: 'array',
  element: {
    kind: 'object',
    fields: {
      startFrame: { kind: 'number', description: '相对宿主开始时刻的起始帧。' },
      endFrame: {
        kind: 'number',
        optional: true,
        description: '仅有状态动作需要；到达该帧时对已经开始的序列调用结束生命周期。',
      },
      sequence: {
        kind: 'opaque',
        fallback: schema_41f65db75420,
        semantics: schema_6675b27ea82d,
        description: '到达起始帧时执行或启动的动作序列。',
      },
    },
  },
  semantics: { arrayElement: {} },
  description: '按技能局部帧安排的动作序列。',
} as const;
const schema_123ad80e4366 = {
  kind: 'array',
  element: {
    kind: 'object',
    fields: { resource: schema_531a9457dae3, value: schema_f163b2906690 },
  },
  semantics: { arrayElement: {} },
  optional: true,
  description: '技能释放时消耗的资源。',
} as const;
const schema_1ff0b8a1d665 = {
  kind: 'array',
  element: {
    kind: 'object',
    fields: {
      skillSlotKey: {
        kind: 'string',
        referenceKind: 'skillSlot',
        description: '要修改的原生技能槽，与技能库分组无关。',
      },
      targetSkillKey: {
        kind: 'string',
        referenceKind: 'skill',
        description: 'Buff 启用期间换入的技能。',
      },
      revertedSkillKey: {
        kind: 'string',
        referenceKind: 'skill',
        description: 'Buff 停用或结束时恢复的技能。',
      },
      inheritOriginSkillCooldownProgress: {
        kind: 'boolean',
        description: '已保留证据位；运行时尚未接入 true 的双向冷却进度复制。',
      },
    },
  },
  semantics: { arrayElement: {} },
  optional: true,
  description: '每次启用时换入、停用或结束时还原；生命周期归当前 Buff 实例所有。',
} as const;
const schema_8b37c2981f22 = {
  kind: {
    kind: 'enum',
    options: ['deckAttributeCompare'],
    description: '在构筑阶段比较两项干员四维。',
  },
  left: {
    kind: 'enum',
    options: schema_ebe2ee1f84c5,
    semantics: schema_36938d66df11,
    description: '左侧属性。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: schema_43d88f577f05,
    description: '数值比较符。',
  },
  right: {
    kind: 'enum',
    options: schema_ebe2ee1f84c5,
    semantics: schema_36938d66df11,
    description: '右侧属性。',
  },
} as const;
const schema_cfeca66fd8de = {
  kind: 'array',
  element: {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['modifyPoiseScalar'], description: '处理器种类判别值。' },
      timing: {
        kind: 'enum',
        options: ['beforeCalculation'],
        description: '此处理器固定在失衡伤害计算前执行。',
      },
      side: {
        kind: 'enum',
        options: ['defender', 'attacker'],
        semantics: schema_4107b248d073,
        description: '修改攻击方还是目标方的倍率。',
      },
      addition: {
        kind: 'union',
        variants: schema_e458b6c303c5,
        semantics: schema_4107b248d073,
        description: '加入对应倍率区的数值。',
      },
    },
  },
  semantics: { arrayElement: {} },
  description: '按顺序执行的失衡伤害处理器。',
} as const;
const schema_83b511d451cd = {
  kind: 'object',
  fields: {
    burstType: { kind: 'string', description: '选择这组爆发参数的原生爆发类型。' },
    damageType: {
      kind: 'enum',
      options: schema_51a143c4b9a7,
      semantics: schema_6951f167ae16,
      description: '爆发伤害的元素类型（原生 damageType 归一化后的语义枚举）。',
    },
    skillSettingDataKey: { kind: 'string', description: '爆发倍率在 SkillSetting 中的 dataKey。' },
    skillSettingColumn: {
      kind: 'number',
      description: 'SkillSetting 列号（原生 1 基；运行时按列号减一取数组下标）。',
    },
    atkScaleBase: {
      kind: 'number',
      description: '原生 DamageAction 的基础倍率；被 SkillSetting 倍率覆盖，仅作证据保留。',
    },
  },
  optional: true,
  description: '元素爆发 Buff 触发伤害时使用的爆发类型、伤害类型和倍率来源。',
} as const;
const schema_741e6ba26ed9 = {
  kind: 'object',
  fields: {
    target: {
      kind: 'enum',
      options: ['buffSource', 'owner'],
      semantics: schema_4107b248d073,
      description: '效果作用于 Buff 持有者还是来源。',
    },
    superArmor: {
      kind: 'union',
      variants: schema_040e2b54cd31,
      semantics: schema_4107b248d073,
      description: '霸体值。',
    },
    impactResistance: {
      kind: 'union',
      variants: schema_040e2b54cd31,
      semantics: schema_4107b248d073,
      description: '冲击抗性值。',
    },
  },
  optional: true,
  description: 'Buff 启用期间提供的霸体值和抗冲击值，可作用于持有者或 Buff 来源。',
} as const;
const schema_0dfab30a4bb5 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['skillSlot'],
          description: '通过一个可被运行时替换的技能槽选技能。',
        },
        skillSlotKey: {
          kind: 'string',
          referenceKind: 'skillSlot',
          description: '要读取的技能槽。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['basicAttack'],
          description: '从普通攻击序列和当前操作模式中选技能。',
        },
        skillKeys: {
          kind: 'array',
          element: schema_eb26b72c4713,
          semantics: { arrayElement: {} },
          referenceKind: 'skill',
          description: '原生 normalAttackList、处决和下落等路径能够请求的技能全集。',
        },
        normalAttackSkillKeys: {
          kind: 'array',
          element: schema_eb26b72c4713,
          semantics: { arrayElement: {} },
          referenceKind: 'skill',
          optional: true,
          description:
            'CharacterData.normalAttackList 给出的默认有序普攻连段，不包含处决和下落攻击。',
        },
        defaultSkillKey: {
          kind: 'string',
          referenceKind: 'skill',
          optional: true,
          description: '只有 SkillDataBundle/default mode 的命令映射已导入时才允许设置。',
        },
      },
    },
  ],
  semantics: schema_4107b248d073,
  optional: true,
} as const;
const schema_e5c0475d6e2a = {
  kind: 'object',
  fields: {
    currentSkillTypes: {
      kind: 'array',
      element: schema_6ad6215ba3f7,
      semantics: { arrayElement: schema_bc6e5aef9dfe },
      optional: true,
      description: '只在当前技能属于这些分类时启用旁路。',
    },
    requiresCurrentSkillNotInterruptible: {
      kind: 'boolean',
      optional: true,
      description: '是否要求当前技能仍处于不可中断阶段。',
    },
    condition: {
      kind: 'condition',
      semantics: { aliases: ['CombatCondition'] },
      optional: true,
      description: '候选技能自身需要满足的条件。',
    },
    asSkillCast: { kind: 'boolean', optional: true, description: '是否仍发布完整的技能施放事件。' },
    sequence: {
      kind: 'opaque',
      fallback: schema_41f65db75420,
      semantics: schema_6675b27ea82d,
      description: '命中旁路后直接执行的动作序列。',
    },
  },
  optional: true,
  description:
    '原生 SwitchToAddBuff 的施放前旁路；命中时不启动或中断普通技能时间轴。\n`currentSkillTypes` 表达依赖上一技能身份的结束技路径；`condition` 表达候选技能自身的\n普通条件路径。两者同时存在时均须成立。`asSkillCast` 保留原生是否发布完整施法事件。',
} as const;
const schema_69a4fde8bf05 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['elementalAttachment'], description: '语义角色判别值。' },
        element: {
          kind: 'enum',
          options: ['heat', 'cryo', 'electric', 'nature'],
          semantics: schema_36938d66df11,
          description: '附着元素。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['elementalBurst'], description: '语义角色判别值。' },
        element: {
          kind: 'enum',
          options: ['heat', 'cryo', 'electric', 'nature'],
          semantics: schema_36938d66df11,
          description: '爆发元素。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['compoundStatus'],
          description: '消耗已有元素附着后形成的复合状态。',
        },
        consumedElement: {
          kind: 'enum',
          options: ['heat', 'cryo', 'electric', 'nature'],
          semantics: schema_36938d66df11,
          description: '被消耗的已有附着元素。',
        },
        incomingElement: {
          kind: 'enum',
          options: ['heat', 'cryo', 'electric', 'nature'],
          semantics: schema_36938d66df11,
          description: '本次新加入的元素。',
        },
      },
    },
  ],
  semantics: schema_0027e97043bf,
  optional: true,
  description: '标记该 Buff 的特殊战斗身份，供元素附着、元素爆发等专用规则识别。',
} as const;
const schema_37edd074d3b3 = {
  kind: 'array',
  element: {
    kind: 'object',
    fields: {
      triggerBuffIds: {
        kind: 'array',
        element: schema_d056c7fa0b76,
        semantics: { arrayElement: {} },
        referenceKind: 'buff',
        description: '其中任一 Buff 加入时触发关键词强化。',
      },
      operation: {
        kind: 'enum',
        options: ['assign', 'add', 'multiply'],
        semantics: schema_0027e97043bf,
        description: '对关键词数值执行赋值、加算或乘算。',
      },
      targetKey: { kind: 'string', description: '要修改的关键词数值名称。' },
      initialValue: {
        kind: 'union',
        variants: schema_040e2b54cd31,
        semantics: schema_4107b248d073,
        description: '尚未触发强化时的关键词初始值。',
      },
      value: {
        kind: 'union',
        variants: schema_040e2b54cd31,
        semantics: schema_4107b248d073,
        description: '每次触发时写入或参与运算的值。',
      },
    },
  },
  semantics: { arrayElement: {} },
  optional: true,
  description:
    '指定的其他 Buff 成功加入同一持有者时，对当前 Buff 的关键词倍率执行赋值、加法或乘法。',
} as const;
const schema_78c333188111 = {
  kind: 'array',
  element: {
    kind: 'object',
    fields: {
      attribute: {
        kind: 'union',
        variants: [
          { kind: 'string' },
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['all', 'main', 'secondary'],
                semantics: schema_0027e97043bf,
                description: '相对属性选择方式。',
              },
            },
          },
        ],
        semantics: schema_4107b248d073,
        description: '指定属性名称，或在应用时按持有者选择主属性、副属性或全部四维。',
      },
      slot: {
        kind: 'enum',
        options: schema_9f9a48979ad6,
        semantics: schema_6951f167ae16,
        description: '要写入的原生属性公式槽。',
      },
      value: {
        kind: 'union',
        variants: [
          { kind: 'number' },
          {
            kind: 'object',
            fields: {
              blackboardKey: { kind: 'string', description: '读取修正值的 Buff 黑板键。' },
            },
          },
        ],
        semantics: schema_4107b248d073,
        description: '固定修正值或从 Buff 黑板读取的值。',
      },
      target: {
        kind: 'enum',
        options: ['buffSource', 'owner'],
        semantics: schema_4107b248d073,
        optional: true,
        description: '修正 Buff 持有者还是 Buff 来源；省略时修正持有者。',
      },
      source: {
        kind: 'enum',
        options: ['converted'],
        optional: true,
        description: '以换算属性来源写入，避免再次参与属性换算。',
      },
    },
  },
  semantics: { arrayElement: {} },
  optional: true,
  description: 'Buff 启用期间注册到目标或来源身上的属性修正。',
} as const;
const schema_59ae2ded5e63 = {
  placementPolicy: {
    kind: 'object',
    fields: schema_f29775915ce0,
    optional: true,
    description: '此形态自己的技能链展开规则。',
  },
  key: { kind: 'string', description: '形态在技能组中的唯一名称。' },
  nameKey: {
    kind: 'string',
    optional: true,
    description: '此放置形态的名称模板覆盖；未提供时继承组的 nameKey。',
  },
  skills: {
    kind: 'union',
    variants: [
      schema_1f21df9328c5,
      schema_1f21df9328c5,
      { kind: 'array', element: schema_a361791fb8fc, semantics: schema_140af2d9bf58 },
    ],
    semantics: { unionVariants: [schema_4107b248d073, schema_140af2d9bf58] },
    description: '此形态包含的单个技能或有序技能链。',
  },
} as const;
const schema_72e7e1b50ca4 = {
  kind: 'object',
  fields: {
    commandMappings: {
      kind: 'array',
      element: {
        kind: 'object',
        fields: {
          startFrame: { kind: 'number', description: '窗口起始帧，包含该帧。' },
          endFrame: { kind: 'number', description: '窗口结束帧。' },
          input: { kind: 'enum', options: ['basicAttack'], description: '此窗口覆盖的玩家操作。' },
          targetSkillId: {
            kind: 'union',
            variants: [{ kind: 'null', referenceKind: 'skill' }, schema_eb26b72c4713],
            semantics: schema_4107b248d073,
            referenceKind: 'skill',
            description: '空值是原生的“该窗口没有直接技能路由”，不得回退为基础技能。',
          },
        },
      },
      semantics: { arrayElement: {} },
      optional: true,
      description: '在指定帧段内覆盖普通攻击操作的技能路由。',
    },
    allowedNextSkills: {
      kind: 'array',
      element: {
        kind: 'object',
        fields: {
          startFrame: { kind: 'number', description: '可以提前接续的起始帧。' },
          endFrame: { kind: 'number', description: '可以提前接续的结束帧。' },
          skillIds: {
            kind: 'array',
            element: schema_eb26b72c4713,
            semantics: { arrayElement: {} },
            referenceKind: 'skill',
            description: '此窗口允许请求的原生技能 ID。',
          },
        },
      },
      semantics: { arrayElement: {} },
      optional: true,
      description: '在指定帧段内允许提前接续的技能。',
    },
    hasConditionalActions: {
      kind: 'boolean',
      optional: true,
      description: '存在条件或嵌套输入 Action；当前输入状态不足时必须返回未知而不是猜测。',
    },
  },
  optional: true,
  description:
    '从原生顶层直连输入 Action 保留的操作解析证据。两类窗口职责不同：\ncommandMappings 选择该操作当前指向的技能，allowedNextSkills 只决定能否提前中断。',
} as const;
const schema_f15fd9ff6614 = {
  kind: 'array',
  element: {
    kind: 'union',
    variants: [
      {
        kind: 'object',
        fields: {
          kind: {
            kind: 'enum',
            options: ['modifyCalculationResult'],
            description: '处理器种类判别值。',
          },
          timing: {
            kind: 'enum',
            options: ['afterCalculation'],
            description: '此处理器固定在基础计算完成后执行。',
          },
          baseMultiplier: {
            kind: 'union',
            variants: schema_e458b6c303c5,
            semantics: schema_4107b248d073,
            description: '每次乘算使用的基础倍率。',
          },
          multiplierCount: {
            kind: 'union',
            variants: schema_e458b6c303c5,
            semantics: schema_4107b248d073,
            description: '重复应用基础倍率的次数。',
          },
        },
      },
      {
        kind: 'object',
        fields: {
          kind: {
            kind: 'enum',
            options: ['modifyHealingIncrease'],
            description: '处理器种类判别值。',
          },
          timing: {
            kind: 'enum',
            options: ['beforeCalculation'],
            description: '此处理器固定在治疗计算前执行。',
          },
          side: {
            kind: 'enum',
            options: ['healer', 'receiver'],
            semantics: schema_4107b248d073,
            description: '修改治疗者的输出加成或受治疗者的承疗加成。',
          },
          addition: {
            kind: 'union',
            variants: schema_e458b6c303c5,
            semantics: schema_4107b248d073,
            description: '加入对应治疗加成区的数值。',
          },
        },
      },
    ],
    semantics: schema_4107b248d073,
  },
  semantics: schema_140af2d9bf58,
  description: '按顺序执行的治疗处理器。',
} as const;
const schema_84f4eaf6ec0e = {
  nameKey: {
    kind: 'string',
    optional: true,
    description: '此 Buff 的显示名称翻译键；仅供界面使用。',
  },
  iconId: { kind: 'string', optional: true, description: '游戏资源中的图标 ID。' },
  iconPath: { kind: 'string', optional: true, description: '已导出图标的资源路径。' },
  visible: { kind: 'boolean', optional: true, description: '是否允许界面显示这个 Buff。' },
  showInHeadBarCommon: {
    kind: 'boolean',
    optional: true,
    description: '是否显示在普通头顶状态栏。',
  },
  showInHeadBarAttached: {
    kind: 'boolean',
    optional: true,
    description: '是否显示在附着状态头顶栏。',
  },
  showInSquadIcon: { kind: 'boolean', optional: true, description: '是否显示在队伍头像附近。' },
  onlyShowForMainCharacter: {
    kind: 'boolean',
    optional: true,
    description: '是否只为当前主控干员显示。',
  },
  blinkInMainCharHpBar: {
    kind: 'boolean',
    optional: true,
    description: '是否在主控干员生命条上播放闪烁。',
  },
  showProgressInHpBar: {
    kind: 'boolean',
    optional: true,
    description: '是否在生命条上显示剩余进度。',
  },
  showProgressInNormalSkillButton: {
    kind: 'boolean',
    optional: true,
    description: '是否在普通技能按钮上显示剩余进度。',
  },
  useWeakProgressInNormalSkillButton: {
    kind: 'boolean',
    optional: true,
    description: '普通技能按钮是否使用弱化样式的进度。',
  },
  showProgressInUltimateSkillButton: {
    kind: 'boolean',
    optional: true,
    description: '是否在终结技按钮上显示剩余进度。',
  },
  forceRaiseIconEvent: {
    kind: 'boolean',
    optional: true,
    description: 'Buff 变化时是否强制发送图标刷新事件。',
  },
  showWarningBackground: { kind: 'boolean', optional: true, description: '是否显示警告背景。' },
  playStrongInAnimation: {
    kind: 'boolean',
    optional: true,
    description: '是否播放强提示进入动画。',
  },
  hasCharHpBarVfxType: {
    kind: 'boolean',
    optional: true,
    description: '是否配置了干员生命条特效类型。',
  },
  charHpBarVfxType: { kind: 'string', optional: true, description: '干员生命条使用的特效类型。' },
  iconStyleInSquad: {
    kind: 'string',
    optional: true,
    description: 'Buff 在队伍头像区域使用的图标样式。',
  },
  abnormalColorType: {
    kind: 'string',
    optional: true,
    description: '元素异常显示使用的颜色类型。',
  },
  orderPriority: {
    kind: 'object',
    fields: {
      useDirectoryValue: { kind: 'boolean', description: '是否使用资源目录中配置的排序值。' },
      value: { kind: 'number', description: '同类图标之间的排序数值。' },
      category: { kind: 'string', description: '图标所属的排序类别。' },
    },
    optional: true,
    description: '多个 Buff 图标同时出现时的排序设置。',
  },
} as const;
const schema_66813ff77e4f = {
  kind: 'object',
  fields: schema_84f4eaf6ec0e,
  optional: true,
  description: 'Buff 自身的图标、颜色、排序位置和进度条等显示设置。\n不参与战斗计算的显示信息。',
} as const;
const schema_a2f7c7d1976f = {
  kind: 'array',
  element: {
    kind: 'union',
    variants: [
      {
        kind: 'object',
        fields: {
          kind: { kind: 'enum', options: ['damageScale'], description: '处理器种类判别值。' },
          side: {
            kind: 'enum',
            options: ['defender', 'attacker'],
            semantics: schema_4107b248d073,
            description: '修正属于攻击方还是防御方。',
          },
          zone: {
            kind: 'enum',
            options: [
              'product',
              'normal',
              'abnormalAndBurst',
              'enhanced',
              'combo',
              'vulnerable',
              'race',
            ],
            semantics: schema_bc6e5aef9dfe,
            description: '写入的伤害倍率区间。',
          },
          addition: {
            kind: 'union',
            variants: schema_e458b6c303c5,
            semantics: schema_4107b248d073,
            description: '加入该区间的数值。',
          },
        },
      },
      {
        kind: 'object',
        fields: {
          attribute: { kind: 'string', description: '原生属性名称。' },
          kind: { kind: 'enum', options: ['instantAttribute'], description: '处理器种类判别值。' },
          targetSide: {
            kind: 'enum',
            options: ['defender', 'attacker'],
            semantics: schema_4107b248d073,
            description: '要修改攻击方还是防御方的属性。',
          },
          values: {
            kind: 'union',
            variants: [
              {
                kind: 'object',
                fields: {
                  addition: { kind: 'number', description: '普通固定加值。' },
                  multiplier: { kind: 'number', description: '普通乘数。' },
                  finalAddition: { kind: 'number', description: '普通最终固定加值。' },
                  finalMultiplier: { kind: 'number', description: '普通最终乘数。' },
                  baseAddition: { kind: 'number', description: '基础固定加值。' },
                  baseMultiplier: { kind: 'number', description: '基础乘数。' },
                  baseFinalAddition: { kind: 'number', description: '基础最终固定加值。' },
                  baseFinalMultiplier: { kind: 'number', description: '基础最终乘数。' },
                },
              },
              {
                kind: 'object',
                fields: {
                  slot: {
                    kind: 'enum',
                    options: schema_9f9a48979ad6,
                    semantics: schema_6951f167ae16,
                    description: '要写入的单个公式槽。',
                  },
                  value: {
                    kind: 'union',
                    variants: schema_e458b6c303c5,
                    semantics: schema_4107b248d073,
                    description: '写入该槽的值。',
                  },
                },
              },
            ],
            semantics: schema_4107b248d073,
            description: '八槽完整值，或只写入一个槽的动态值。',
          },
          attributeTiming: {
            kind: 'enum',
            options: ['runtime'],
            description: 'Buff 伤害处理器始终读取战斗运行时属性。',
          },
        },
      },
    ],
    semantics: schema_4107b248d073,
  },
  semantics: schema_140af2d9bf58,
  description: '条件成立时按顺序执行的伤害处理器。',
} as const;
const schema_33ac911479b6 = {
  kind: 'array',
  element: {
    kind: 'object',
    fields: {
      buffId: { kind: 'string', referenceKind: 'buff', description: '子 Buff ID。' },
      presentation: {
        kind: 'object',
        fields: schema_84f4eaf6ec0e,
        description: '子 Buff 的显示规则。',
      },
    },
  },
  semantics: { arrayElement: {} },
  optional: true,
  description: '跟随本体同时出现和消失的额外显示图标；它们没有独立战斗效果和生命周期。',
} as const;
const schema_72ecafe1082d = {
  kind: 'array',
  element: {
    kind: 'object',
    fields: {
      infinityValue: { kind: 'boolean', description: '是否使用不会耗尽的无限护盾值。' },
      value: {
        kind: 'union',
        variants: [
          { kind: 'number' },
          {
            kind: 'object',
            fields: {
              blackboardKey: {
                kind: 'string',
                blackboardOrigin: 'globalBuff',
                description: '读取持续秒数的 Buff 黑板键。',
              },
            },
          },
          {
            kind: 'object',
            fields: {
              attributeSource: {
                kind: 'enum',
                options: ['buffOwner', 'buffSource'],
                semantics: schema_4107b248d073,
                optional: true,
                description: '读取 Buff 持有者还是 Buff 来源；省略时使用运行时默认对象。',
              },
              attribute: { kind: 'string', description: '要读取的原生属性名称。' },
              multiplier: {
                kind: 'union',
                variants: schema_040e2b54cd31,
                semantics: schema_4107b248d073,
                description: '属性值的乘数。',
              },
              addition: {
                kind: 'union',
                variants: schema_040e2b54cd31,
                semantics: schema_4107b248d073,
                description: '乘算后再加入的固定值。',
              },
            },
          },
        ],
        semantics: { unionVariants: [schema_4107b248d073, {}] },
        description: '固定护盾值、黑板数值或按属性计算的护盾值。',
      },
      damageAbsorptions: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            damageType: {
              kind: 'enum',
              options: schema_51a143c4b9a7,
              semantics: schema_6951f167ae16,
              description: '适用的伤害类型。',
            },
            ratio: {
              kind: 'union',
              variants: schema_040e2b54cd31,
              semantics: schema_4107b248d073,
              description: '本次伤害由护盾吸收的比例。',
            },
            scale: {
              kind: 'union',
              variants: schema_040e2b54cd31,
              semantics: schema_4107b248d073,
              description: '吸收伤害时消耗护盾值的倍率。',
            },
          },
        },
        semantics: { arrayElement: {} },
        description: '针对不同伤害类型的吸收规则。',
      },
      absorbCount: {
        kind: 'union',
        variants: [
          { kind: 'number' },
          {
            kind: 'object',
            fields: {
              blackboardKey: { kind: 'string', description: '读取触发次数的 Buff 黑板键。' },
            },
          },
        ],
        semantics: schema_4107b248d073,
        description: '护盾最多可以吸收的命中次数。',
      },
      absorbAllDamageWhenConsumed: {
        kind: 'boolean',
        description: '最后一次消耗护盾时是否仍吸收整次伤害。',
      },
      removeBuffWhenConsumed: { kind: 'boolean', description: '护盾耗尽时是否结束所属 Buff。' },
      priority: {
        kind: 'enum',
        options: ['normal', 'prioritizeConsume'],
        semantics: schema_4107b248d073,
        description: '与其他护盾竞争时的消耗优先级。',
      },
      replaceHitEffect: {
        kind: 'boolean',
        description: '只保留原生表现选择位；后端不解释 EffectActionCfg。',
      },
    },
  },
  semantics: { arrayElement: {} },
  optional: true,
  description: 'Buff 启用时创建的护盾；护盾的数值、吸收范围、次数和销毁行为由条目配置。',
} as const;
const schema_d8c018e8d611 = {
  presentation: {
    kind: 'object',
    fields: {
      icon: { kind: 'string' },
      nameKey: { kind: 'string' },
      placement: schema_09fb5d26cbd4,
      damageDisplayBuffId: {
        kind: 'string',
        optional: true,
        description: '用本实体施加的 Buff 承载直接伤害展示，不另画实体状态条。',
      },
    },
    optional: true,
    description: '实体存在期间的干员状态图标；直接由该实体造成的伤害显示在状态下方。',
  },
  bornTags: {
    kind: 'array',
    element: { kind: 'string', semantics: { aliases: ['GameplayTag'] } },
    semantics: { arrayElement: { aliases: ['GameplayTag'] } },
    optional: true,
    description:
      'AbilityEntityTemplateData.bornTags；实体创建时立即成为其 AbilitySystem 自身标签。',
  },
  blackboard: {
    kind: 'record',
    value: schema_9ca14269e3d0,
    semantics: schema_c7288b42bef0,
    optional: true,
    description: 'AbilitySystemData.entityBlackboard 的模板初值；生成动作的显式赋值可覆盖同名键。',
  },
  lifetime: {
    kind: 'union',
    variants: [
      {
        kind: 'object',
        fields: {
          kind: { kind: 'enum', options: ['limited'], description: '生命周期种类判别值。' },
          durationSeconds: {
            kind: 'union',
            variants: [
              { kind: 'number' },
              {
                kind: 'object',
                fields: {
                  blackboardKey: {
                    kind: 'string',
                    blackboardOrigin: 'abilityEntity',
                    description: '生成实体时读取的实体黑板键。',
                  },
                  fallback: { kind: 'number', description: '黑板没有该键时使用的模板默认值。' },
                },
              },
            ],
            semantics: schema_4107b248d073,
            description: '创建后持续的秒数。',
          },
        },
      },
      {
        kind: 'object',
        fields: {
          kind: { kind: 'enum', options: ['infinite'], description: '无限生命周期判别值。' },
        },
      },
    ],
    semantics: schema_4107b248d073,
    description: '能力实体的寿命：限定秒数或无限持续。',
  },
  deathReleaseDelaySeconds: {
    kind: 'number',
    optional: true,
    description: '实体死亡后仍留在 owner children / finder 目录中的控制器回收延迟。',
  },
  maxStackingCount: {
    kind: 'union',
    variants: [
      { kind: 'number' },
      {
        kind: 'object',
        fields: {
          blackboardKey: {
            kind: 'string',
            blackboardOrigin: 'abilityEntity',
            description: '生成实体时读取的实体黑板键。',
          },
          fallback: { kind: 'number', description: '黑板没有该键时使用的模板默认值。' },
        },
      },
    ],
    semantics: schema_4107b248d073,
    optional: true,
    description: '正数时，同模板新实例会按原生 Group.Add 语义同步释放最早实例。',
  },
  childSkill: {
    kind: 'opaque',
    fallback: { reason: 'owned-resource-boundary' },
    declaration: 'AbilityEntityDefinition.childSkill',
    optional: true,
    description: '该模板只使用一个子技能时的简写定义。',
  },
  childSkills: {
    kind: 'record',
    value: {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      declaration: 'AbilityEntityDefinition.childSkills',
    },
    semantics: { recordValue: {} },
    declaration: 'AbilityEntityDefinition.childSkills',
    optional: true,
    description: '同一原生实体模板可由不同 Spawn 动作绑定不同子技能；键为原生技能 ID。',
  },
  passiveSkills: {
    kind: 'array',
    element: {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      declaration: 'AbilityEntityDefinition.passiveSkills',
    },
    semantics: { arrayElement: {} },
    declaration: 'AbilityEntityDefinition.passiveSkills',
    optional: true,
    description: '能力实体启用期间安装的被动技能。',
  },
} as const;
const schema_721d75a98ce3 = [
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['abilityEvent'], description: '直接监听能力系统事件。' },
      event: {
        kind: 'enum',
        options: ['beforeAddedBuff', 'outputBuff', 'addedBuff'],
        semantics: schema_0027e97043bf,
        description: '允许直接订阅的能力事件。',
      },
    },
  },
  {
    kind: 'object',
    fields: { kind: { kind: 'enum', options: ['operatorHit'], description: '触发器种类判别值。' } },
  },
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['operatorHealed'], description: '触发器种类判别值。' },
      role: {
        kind: 'enum',
        options: ['source', 'target'],
        semantics: schema_4107b248d073,
        optional: true,
        description: '只监听治疗来源或受治疗者；省略时两者都可触发。',
      },
    },
  },
  {
    kind: 'object',
    fields: { kind: { kind: 'enum', options: ['buffApplied'], description: '触发器种类判别值。' } },
  },
  {
    kind: 'object',
    fields: { kind: { kind: 'enum', options: ['buffOutput'], description: '触发器种类判别值。' } },
  },
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['buffConsumed'], description: '触发器种类判别值。' },
      buffIds: {
        kind: 'array',
        element: schema_d056c7fa0b76,
        semantics: { arrayElement: {} },
        referenceKind: 'buff',
        optional: true,
        description: '任一匹配即可触发的 Buff ID。',
      },
    },
  },
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['airborneOutput'], description: '触发器种类判别值。' },
    },
  },
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['knockDownOutput'], description: '触发器种类判别值。' },
    },
  },
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['spGained'], description: '触发器种类判别值。' },
      source: {
        kind: 'enum',
        options: ['normalAttack', 'powerAttack', 'default', 'skill'],
        semantics: schema_36938d66df11,
        optional: true,
        description: '只监听指定的技力来源。',
      },
      gainKind: {
        kind: 'enum',
        options: ['gain', 'refund'],
        semantics: schema_4107b248d073,
        optional: true,
        description: '只监听正常获取或返还。',
      },
    },
  },
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['damageTagHit'], description: '触发器种类判别值。' },
      tag: {
        kind: 'enum',
        options: [
          'normalAttack',
          'normalAttackLastCombo',
          'powerAttack',
          'normalSkill',
          'comboSkill',
          'ultimateSkill',
          'plungingAttack',
          'dashAttack',
          'fireBurst',
          'electricBurst',
          'cryoBurst',
          'natureBurst',
          'fireAbnormal',
          'electricAbnormal',
          'cryoAbnormal',
          'natureAbnormal',
        ],
        semantics: {
          unionVariants: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
        },
        description: '要匹配的伤害标签。',
      },
      scope: schema_31987bebd7ba,
    },
  },
  {
    kind: 'object',
    fields: {
      kind: {
        kind: 'enum',
        options: ['elementalInflictionApplied'],
        description: '指定范围内成功施加一种元素附着。',
      },
      elements: {
        kind: 'union',
        variants: [
          {
            kind: 'enum',
            options: ['physical', 'heat', 'cryo', 'electric', 'nature'],
            semantics: schema_18ab763e1525,
          },
          {
            kind: 'array',
            element: {
              kind: 'enum',
              options: ['physical', 'heat', 'cryo', 'electric', 'nature'],
              semantics: schema_18ab763e1525,
            },
            semantics: { arrayElement: schema_18ab763e1525 },
          },
        ],
        semantics: { unionVariants: [schema_18ab763e1525, { arrayElement: schema_18ab763e1525 }] },
        description: '任一匹配即可成立的元素。',
      },
      scope: schema_31987bebd7ba,
    },
  },
  {
    kind: 'object',
    fields: {
      kind: {
        kind: 'enum',
        options: ['physicalInflictionApplied'],
        description: '指定范围内成功施加一种物理异常。',
      },
      types: {
        kind: 'union',
        variants: [
          {
            kind: 'enum',
            options: ['crush', 'airborne', 'knockDown', 'fracture'],
            semantics: schema_36938d66df11,
          },
          {
            kind: 'array',
            element: {
              kind: 'enum',
              options: ['crush', 'airborne', 'knockDown', 'fracture'],
              semantics: schema_36938d66df11,
            },
            semantics: { arrayElement: schema_36938d66df11 },
          },
        ],
        semantics: { unionVariants: [schema_36938d66df11, { arrayElement: schema_36938d66df11 }] },
        description: '任一匹配即可成立的物理异常。',
      },
      scope: schema_31987bebd7ba,
    },
  },
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['skillHit'], description: '触发器种类判别值。' },
      skillKey: { kind: 'string', referenceKind: 'skill', description: '要匹配的执行技能。' },
      scope: schema_31987bebd7ba,
    },
  },
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['enemyDefeated'], description: '触发器种类判别值。' },
      scope: schema_31987bebd7ba,
    },
  },
] as const;
const schema_66b09fabca46 = [
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['attribute'], description: '修正种类判别值。' },
      attribute: {
        kind: 'enum',
        options: ['strength', 'agility', 'intellect', 'will', 'main', 'secondary'],
        semantics: { unionVariants: [schema_36938d66df11, {}, {}] },
        description: '要修改的属性。',
      },
      operation: {
        kind: 'enum',
        options: ['flat', 'percent'],
        semantics: schema_4107b248d073,
        description: '`flat` 为固定加值，`percent` 为百分比加值。',
      },
      value: schema_8478beafcf8a,
    },
  },
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['panelStat'], description: '修正种类判别值。' },
      stat: {
        kind: 'enum',
        options: [
          'attackPercent',
          'criticalRate',
          'artsIntensity',
          'attackFlat',
          'healthFlat',
          'healthPercent',
          'defenseFlat',
          'defensePercent',
          'criticalDamage',
          'ultimateEnergyGainEfficiency',
          'skillCooldownReduction',
          'staggerDamagePercent',
        ],
        semantics: { unionVariants: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}] },
        description: '要修改的面板属性。',
      },
      value: schema_8478beafcf8a,
    },
  },
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['damageBonus'], description: '修正种类判别值。' },
      damageTypes: {
        kind: 'union',
        variants: [
          { kind: 'enum', options: schema_51a143c4b9a7, semantics: schema_6951f167ae16 },
          {
            kind: 'array',
            element: { kind: 'enum', options: schema_51a143c4b9a7, semantics: schema_6951f167ae16 },
            semantics: { arrayElement: schema_6951f167ae16 },
          },
        ],
        semantics: { unionVariants: [schema_6951f167ae16, { arrayElement: schema_6951f167ae16 }] },
        description: '此加成覆盖的伤害类型。',
      },
      skillTypes: {
        kind: 'union',
        variants: [
          schema_6ad6215ba3f7,
          {
            kind: 'array',
            element: schema_6ad6215ba3f7,
            semantics: { arrayElement: schema_bc6e5aef9dfe },
          },
        ],
        semantics: { unionVariants: [schema_bc6e5aef9dfe, { arrayElement: schema_bc6e5aef9dfe }] },
        optional: true,
        description: '进一步限制此加成覆盖的技能类型；省略时不按技能类型筛选。',
      },
      value: schema_a4f938dac096,
    },
  },
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['damageScale'], description: '修正种类判别值。' },
      target: {
        kind: 'enum',
        options: [
          'physical',
          'heat',
          'cryo',
          'electric',
          'nature',
          'ether',
          'normalAttack',
          'comboSkill',
          'battleSkill',
          'ultimate',
          'staggeredEnemy',
        ],
        semantics: { unionVariants: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}] },
        description: '要修改的伤害倍率项。',
      },
      slot: {
        kind: 'enum',
        options: ['addition', 'baseAddition'],
        semantics: schema_4107b248d073,
        optional: true,
        description: '写入基础加算槽还是普通加算槽；旧数据省略时使用基础加算槽。',
      },
      value: {
        kind: 'union',
        variants: schema_1235728272b5,
        semantics: schema_f27fc5f4f63d,
        description: '单个倍率或按等级排列的倍率。',
      },
    },
  },
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['staticHealingIncrease'], description: '修正种类判别值。' },
      target: {
        kind: 'enum',
        options: ['output', 'taken'],
        semantics: schema_4107b248d073,
        description: '`output` 修改治疗输出，`taken` 修改受到的治疗。',
      },
      value: schema_a4f938dac096,
    },
  },
  {
    kind: 'object',
    fields: {
      kind: { kind: 'enum', options: ['skillCooldownMultiplier'], description: '修正种类判别值。' },
      skillTypes: {
        kind: 'union',
        variants: [
          schema_6ad6215ba3f7,
          {
            kind: 'array',
            element: schema_6ad6215ba3f7,
            semantics: { arrayElement: schema_bc6e5aef9dfe },
          },
        ],
        semantics: { unionVariants: [schema_bc6e5aef9dfe, { arrayElement: schema_bc6e5aef9dfe }] },
        description: '此倍率覆盖的技能类型。',
      },
      value: {
        kind: 'union',
        variants: schema_1235728272b5,
        semantics: schema_f27fc5f4f63d,
        description: '冷却时长倍率；例如 `0.9` 表示原时长的 90%。',
      },
    },
  },
] as const;
const schema_4e057aa3baa4 = {
  kind: 'array',
  element: { kind: 'union', variants: schema_66b09fabca46, semantics: schema_43d88f577f05 },
  semantics: { arrayElement: schema_43d88f577f05 },
  optional: true,
  description: '构筑阶段持续生效的属性修正。',
} as const;
const schema_191bca465db9 = {
  kind: 'array',
  element: {
    kind: 'object',
    fields: {
      key: { kind: 'string', description: '事件响应在当前技能中的唯一名称。' },
      event: {
        kind: 'union',
        variants: schema_721d75a98ce3,
        semantics: { unionVariants: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}] },
        description: '要监听的战斗事件及其筛选参数。',
      },
      condition: schema_5f503bc75d0e,
      scheduledSequences: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            startFrame: { kind: 'number', description: '相对宿主开始时刻的起始帧。' },
            endFrame: {
              kind: 'number',
              optional: true,
              description: '仅有状态动作需要；到达该帧时对已经开始的序列调用结束生命周期。',
            },
            sequence: {
              kind: 'opaque',
              fallback: schema_41f65db75420,
              semantics: schema_6675b27ea82d,
              description: '到达起始帧时执行或启动的动作序列。',
            },
          },
        },
        semantics: { arrayElement: {} },
        description: '相对事件时刻调度的动作序列。',
      },
    },
  },
  semantics: { arrayElement: {} },
  optional: true,
  description: '技能启用期间注册的战斗事件响应。',
} as const;
const schema_ca850f7fdf79 = {
  placementPolicy: {
    kind: 'object',
    fields: schema_f29775915ce0,
    optional: true,
    description: '编辑器一次放置整个技能组时采用的展开规则。',
  },
  key: { kind: 'string', description: '技能组在干员定义中的唯一名称。' },
  operationType: {
    kind: 'enum',
    options: schema_a7c632da5929,
    semantics: schema_bc6e5aef9dfe,
    description: '玩家操作类别；技能库与轴上技能块均据此展示，实际执行读取具体技能的 skillType。',
  },
  skills: {
    kind: 'union',
    variants: [
      schema_1f21df9328c5,
      schema_1f21df9328c5,
      { kind: 'array', element: schema_a361791fb8fc, semantics: schema_140af2d9bf58 },
    ],
    semantics: { unionVariants: [schema_4107b248d073, schema_140af2d9bf58] },
    description: '单个可放置技能，或作为一个技能库条目放置的有序技能链。',
  },
  nameKey: {
    kind: 'string',
    optional: true,
    description: '操作名称模板的 i18n 键，含 name/shortName；{baseName} 为操作名称（轴上含段号）。',
  },
  placementSequenceSkillKeys: {
    kind: 'array',
    element: schema_eb26b72c4713,
    semantics: { arrayElement: {} },
    referenceKind: 'skill',
    optional: true,
    description:
      '运行时虽以换槽形态注册、但编辑器放置时具有明确先后关系的完整技能键序列。\n独立替换操作必须直接声明独立技能组，不由 UI 从 replacement 拆出卡片。',
  },
  variants: {
    kind: 'array',
    element: { kind: 'object', fields: schema_59ae2ded5e63 },
    semantics: { arrayElement: {} },
    optional: true,
    description:
      '同一稳定输入类型下的具名形态链。形态不是新的技能类型；它可以使用不同的养成等级来源，\n例如终结技状态下的强化普攻仍属于普攻，但倍率取终结技等级。',
  },
  replacementSkills: {
    kind: 'array',
    element: schema_a361791fb8fc,
    semantics: schema_140af2d9bf58,
    optional: true,
    description:
      '与 `skills` 共用一个稳定放置身份、仅由运行时换槽动作选中的技能形态。\n这里只保存本组连续段或内部执行技能；独立可放置的替换操作应放在独立组的 skills 中。',
  },
  replacementSkillPlacements: {
    kind: 'record',
    value: { kind: 'enum', options: ['internal'] },
    semantics: { recordValue: {} },
    optional: true,
    description:
      '每个运行时替换技能在技能库中的显式放置语义。运行时替换关系本身不能推出展示语义：\n`internal` 不接受玩家输入；独立操作由独立技能组表达。\n有序接续技能由 `placementSequenceSkillKeys` 表达，不重复出现在这里。',
  },
  routedReplacementSkills: {
    kind: 'array',
    element: {
      kind: 'object',
      fields: {
        skill: {
          kind: 'union',
          variants: [schema_1f21df9328c5, schema_1f21df9328c5],
          semantics: schema_4107b248d073,
          description: '已合并输入包装器资源规则、且拥有独立稳定 key 的执行定义。',
        },
        executionSkillKey: {
          kind: 'string',
          referenceKind: 'skill',
          description: '执行体在原生养成定义中的稳定技能身份。',
        },
      },
    },
    semantics: { arrayElement: {} },
    optional: true,
    description:
      '本展示组中的转发技能。原生稳定槽位由 skillSlots 定义，与展示组独立；执行使用原生分类与等级源。\n仅用于原生输入旁路（例如战技包装器实际 Cast 连携技）；普通同组换槽继续使用 replacementSkills。',
  },
  presentationVariants: {
    kind: 'array',
    element: {
      kind: 'object',
      fields: {
        key: { kind: 'string', description: '展示形态在技能组中的唯一名称。' },
        condition: {
          kind: 'object',
          fields: schema_8b37c2981f22,
          semantics: { aliases: ['BuildCondition'] },
          description: '最终构筑满足此条件时选用该展示形态。',
        },
      },
    },
    semantics: { arrayElement: {} },
    optional: true,
    description: '同一稳定技能组的 UI 变体，不会产生独立的释放身份。',
  },
} as const;
const schema_b0fdd4672083 = {
  kind: 'array',
  element: {
    kind: 'union',
    variants: [
      {
        kind: 'object',
        fields: {
          key: { kind: 'string', description: '响应在同一装备定义中的唯一名称。' },
          priority: {
            kind: 'number',
            optional: true,
            description: '原生数据动作优先级；同级按定义中的注册顺序执行。',
          },
          condition: schema_5f503bc75d0e,
          sequence: schema_b6bff737c6f5,
          event: {
            kind: 'union',
            variants: schema_721d75a98ce3,
            semantics: { unionVariants: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}] },
            description: '监听一项语义战斗事件。',
          },
          abilityEvent: {
            kind: 'opaque',
            fallback: { reason: 'no-present-type' },
            optional: true,
            description: '使用语义战斗事件时不能同时监听能力事件。',
          },
        },
      },
      {
        kind: 'object',
        fields: {
          key: { kind: 'string', description: '响应在同一装备定义中的唯一名称。' },
          priority: {
            kind: 'number',
            optional: true,
            description: '原生数据动作优先级；同级按定义中的注册顺序执行。',
          },
          condition: schema_5f503bc75d0e,
          sequence: schema_b6bff737c6f5,
          event: {
            kind: 'opaque',
            fallback: { reason: 'no-present-type' },
            optional: true,
            description: '使用能力事件时不能同时监听语义战斗事件。',
          },
          abilityEvent: {
            kind: 'enum',
            options: [
              'enterFight',
              'beforeOutputDamage',
              'beforeOutputPhysicalInfliction',
              'afterOutputPhysicalInfliction',
              'beforeOutputInfliction',
              'beforeOutputSpellBurst',
              'outputCriticalDamage',
              'outputHeal',
              'beforeCastSkill',
              'afterSkillApplyCost',
              'beforeOutputBuff',
              'outputBuff',
              'addedBuff',
              'buffEnhanceChanged',
              'buffConsumed',
              'skillSpGained',
            ],
            semantics: {
              unionVariants: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
            },
            description: '直接监听的一项原生能力事件。',
          },
        },
      },
    ],
    semantics: schema_4107b248d073,
  },
  semantics: schema_140af2d9bf58,
  optional: true,
  description: '装备能力注册的战斗事件响应。',
} as const;
const schema_7377908c39c8 = {
  key: { kind: 'string', description: '词条在该装备中的唯一名称。' },
  levelCount: { kind: 'number', description: '这条词条可以解析的精锻等级数量。' },
  modifiers: schema_4e057aa3baa4,
  display: {
    kind: 'union',
    variants: [
      {
        kind: 'object',
        fields: {
          kind: {
            kind: 'enum',
            options: ['modifier'],
            description: '直接按一项实际修正生成显示文字。',
          },
          modifier: {
            kind: 'union',
            variants: schema_66b09fabca46,
            semantics: schema_43d88f577f05,
            description: '用于显示的修正定义。',
          },
        },
      },
      {
        kind: 'object',
        fields: {
          kind: { kind: 'enum', options: ['composite'], description: '使用预设的复合词条文字。' },
          composite: {
            kind: 'enum',
            options: [
              'cryoAndElectricDamageIncrease',
              'heatAndNatureDamageIncrease',
              'allSkillDamageIncrease',
              'allDamageReduction',
              'spellDamageIncrease',
            ],
            semantics: schema_18ab763e1525,
            description: '复合词条的类型。',
          },
          value: {
            kind: 'union',
            variants: schema_1235728272b5,
            semantics: schema_f27fc5f4f63d,
            description: '显示的单个数值或各等级数值。',
          },
        },
      },
    ],
    semantics: schema_4107b248d073,
    description: '每条原生装备词条都有且只有一份 displayAttrModifiers 展示定义。',
  },
} as const;
export const definitionSchemas = {
  operator: {
    kind: 'object',
    fields: {
      slug: { kind: 'string', description: '稳定英文名；项目引用与实例关联使用此身份。' },
      displayName: {
        kind: 'string',
        optional: true,
        description: '项目模板可提供独立展示名；内置定义继续使用本地化文本。',
      },
      assetSlug: {
        kind: 'string',
        optional: true,
        description:
          '项目模板继承头像、技能图标和本地化回退时使用的内置资源 slug；不参与对象身份。',
      },
      gameId: { kind: 'string', description: '游戏原生角色 ID。' },
      rarity: {
        kind: 'enum',
        options: [4, 5, 6],
        semantics: schema_0027e97043bf,
        description: '干员星级。',
      },
      defaultPotential: {
        kind: 'number',
        optional: true,
        description: '编辑器选择和“拉满”时使用的产品默认潜能；省略时沿用旧版星级策略。',
      },
      weaponType: {
        kind: 'enum',
        options: ['sword', 'greatsword', 'polearm', 'handcannon', 'arts-unit'],
        semantics: schema_18ab763e1525,
        description: '干员可以装备的武器类型。',
      },
      element: {
        kind: 'enum',
        options: ['physical', 'heat', 'cryo', 'electric', 'nature'],
        semantics: schema_18ab763e1525,
        description: '干员元素。',
      },
      role: {
        kind: 'enum',
        options: ['guard', 'caster', 'defender', 'vanguard', 'supporter', 'striker'],
        semantics: schema_43d88f577f05,
        description: '干员战斗定位。',
      },
      mainAttribute: {
        kind: 'enum',
        options: schema_ebe2ee1f84c5,
        semantics: schema_36938d66df11,
        description: '干员主属性。',
      },
      secondaryAttribute: {
        kind: 'enum',
        options: schema_ebe2ee1f84c5,
        semantics: schema_36938d66df11,
        description: '干员副属性。',
      },
      attributes: {
        kind: 'object',
        fields: {
          strength: schema_82e7efa7b3e1,
          agility: schema_82e7efa7b3e1,
          intellect: schema_82e7efa7b3e1,
          will: schema_82e7efa7b3e1,
          baseAttack: {
            kind: 'array',
            element: { kind: 'number' },
            semantics: { arrayElement: {} },
            description: '各等级的基础攻击力。',
          },
          baseHealth: {
            kind: 'array',
            element: { kind: 'number' },
            semantics: { arrayElement: {} },
            description: '各等级的基础生命值。',
          },
        },
        description: '各等级四维、攻击和生命成长。',
      },
      trustAttributeBonus: {
        kind: 'object',
        fields: {
          values: {
            kind: 'array',
            element: { kind: 'number' },
            semantics: { arrayElement: {} },
            description: '各信赖节点提供的属性值。',
          },
          attributes: {
            kind: 'array',
            element: {
              kind: 'enum',
              options: ['strength', 'agility', 'intellect', 'will', 'main', 'secondary'],
              semantics: { unionVariants: [schema_36938d66df11, {}, {}] },
            },
            semantics: { arrayElement: { unionVariants: [schema_36938d66df11, {}, {}] } },
            description: '每个节点增加的具体属性或相对主副属性。',
          },
        },
        optional: true,
        description: '仅记录偏离全局 `[10, 15, 15, 20]` 主属性规则的干员。',
      },
      skillGroups: {
        kind: 'array',
        element: { kind: 'object', fields: schema_ca850f7fdf79 },
        semantics: { arrayElement: {} },
        description: '干员技能库的操作组集合；不包含切人、闪避、跳跃。组成员配置操作段的目标技能。',
      },
      dodgeSkill: {
        kind: 'union',
        variants: [schema_1f21df9328c5, schema_1f21df9328c5],
        semantics: schema_4107b248d073,
        optional: true,
        description: '完美闪避成功后由中心状态机施放的隐藏技能；不作为普通技能块出现在技能库。',
      },
      dashBuffs: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            buffId: schema_d056c7fa0b76,
            blackboard: {
              kind: 'record',
              value: schema_9ca14269e3d0,
              semantics: schema_c7288b42bef0,
            },
          },
        },
        semantics: { arrayElement: {} },
        optional: true,
        description: '进入原生 Dash 状态时附着到当前干员的 Buff，以及创建实例时写入的字面黑板。',
      },
      skillSlots: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            key: { kind: 'string', description: '技能槽在干员定义中的唯一名称。' },
            baseSkillKey: {
              kind: 'string',
              referenceKind: 'skill',
              description: '战斗开始时装入槽位的技能。',
            },
            stableSkillKeys: {
              kind: 'array',
              element: schema_eb26b72c4713,
              semantics: { arrayElement: {} },
              referenceKind: 'skill',
              optional: true,
              description: '未发生槽位替换时仍可由同一语义动作明确请求的技能。',
            },
            replacementSkillKeys: {
              kind: 'array',
              element: schema_eb26b72c4713,
              semantics: { arrayElement: {} },
              referenceKind: 'skill',
              description: 'Buff 或模式可以换入该槽位的技能。',
            },
          },
        },
        semantics: { arrayElement: {} },
        optional: true,
        description: '战斗时可被 Buff/Mode 改写的技能槽；独立于技能库分组。',
      },
      playerActionRoutes: {
        kind: 'object',
        fields: {
          comboSkill: schema_0dfab30a4bb5,
          basicAttack: schema_0dfab30a4bb5,
          battleSkill: schema_0dfab30a4bb5,
          ultimate: schema_0dfab30a4bb5,
        },
        optional: true,
        description: '四类玩家语义动作的原生路由；缺失边必须诊断为 unknown。',
      },
      playerActionModes: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            modeId: { kind: 'string', description: '游戏中的模式 ID。' },
            modeLayer: { kind: 'string', description: '多个模式同时存在时所属的互斥或叠加层。' },
            defaultEnabled: { kind: 'boolean', description: '进入战斗时是否默认启用。' },
            normalAttackSkillKeys: {
              kind: 'array',
              element: schema_eb26b72c4713,
              semantics: { arrayElement: {} },
              referenceKind: 'skill',
              optional: true,
              description: '此模式下普通攻击序列允许请求的技能。',
            },
            commandMappings: {
              kind: 'object',
              fields: {
                comboSkill: schema_63d51aa6a56e,
                basicAttack: schema_63d51aa6a56e,
                battleSkill: schema_63d51aa6a56e,
                ultimate: schema_63d51aa6a56e,
              },
              optional: true,
              description: '此模式对四类玩家操作的技能请求覆盖。',
            },
          },
        },
        semantics: { arrayElement: {} },
        optional: true,
        description: 'CharacterData 中会覆盖普攻序列或命令映射的模式；独立于技能库分组。',
      },
      skillAliases: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            from: {
              kind: 'tuple',
              elements: [{ kind: 'string' }, { kind: 'string' }],
              minLength: 2,
              semantics: { tuple: schema_fd02775f055d },
              description: '旧项目中的技能组和技能键。',
            },
            to: {
              kind: 'tuple',
              elements: [{ kind: 'string' }, { kind: 'string' }],
              minLength: 2,
              semantics: { tuple: schema_fd02775f055d },
              description: '当前对应的技能组和技能键。',
            },
          },
          readonlyDeclaration: true,
        },
        semantics: { arrayElement: {} },
        readonlyDeclaration: true,
        optional: true,
        description: '旧项目技能身份到当前规范身份的只读兼容映射；不得作为技能库中的额外入口展示。',
      },
      buffDefinitions: {
        kind: 'record',
        value: schema_a361791fb8fc,
        semantics: schema_c7288b42bef0,
        optional: true,
        description: '干员级附属对象；编辑器后续可在干员层级创建和修改，技能不得复制其完整定义。',
      },
      abilityEntityDefinitions: {
        kind: 'record',
        value: { kind: 'object', fields: schema_d8c018e8d611 },
        semantics: { recordValue: {} },
        optional: true,
        description: '干员级能力实体蓝图；子技能按引用它的技能等级编译。',
      },
      comboSkillConditions: {
        kind: 'array',
        element: schema_1f21df9328c5,
        semantics: { arrayElement: {} },
        optional: true,
        description: '原生角色常驻连携条件；多段连携的后续窗口仍由技能序列中的步骤开启。',
      },
      comboSkillPriority: {
        kind: 'enum',
        options: ['default', 'firstBlackboard', 'enemyRank'],
        semantics: schema_0027e97043bf,
        optional: true,
        description: 'SkillDataBundle.comboSkillPriorityType；单敌人运行时不评分，但转换不得丢失。',
      },
      entityBlackboard: {
        kind: 'record',
        value: schema_9ca14269e3d0,
        semantics: schema_c7288b42bef0,
        optional: true,
        description: '角色模板的字面实体初值；不是技能初值，动态值也不随每次技能施放重置。',
      },
      passiveUi: {
        kind: 'union',
        variants: [
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['numeric'],
                description:
                  '运行时通过 CharacterPassiveUiValueChanged 回执提供当前干员的显示数值。',
              },
              appearance: {
                kind: 'enum',
                options: [
                  'tangtangDroplets',
                  'laevatainCounter',
                  'zhuangFangyiThunder',
                  'arcaneSigils',
                ],
                semantics: schema_36938d66df11,
                description: '可选择的角色专属外观。',
              },
              maximum: { kind: 'number', description: '计数显示的上限。' },
              activeAt: {
                kind: 'number',
                optional: true,
                description: '达到该值时原生节点进入满层/强化状态；没有独立满层态时省略。',
              },
            },
          },
          {
            kind: 'object',
            fields: {
              kind: { kind: 'enum', options: ['buffProgress'], description: 'HUD 类型判别值。' },
              appearance: {
                kind: 'enum',
                options: ['liinoMusic'],
                description: '使用的角色专属外观。',
              },
              normalBuffId: {
                kind: 'string',
                referenceKind: 'buff',
                description: '普通状态读取的 Buff ID。',
              },
              ultimateBuffId: {
                kind: 'string',
                referenceKind: 'buff',
                description: '终结技状态读取的 Buff ID。',
              },
            },
          },
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['buffCounters'],
                description: 'Typhoea 原生 HUD 同时观察三种 Buff 层数；不复制为独立战斗状态。',
              },
              appearance: {
                kind: 'enum',
                options: ['typhoeaArrows'],
                description: '使用的角色专属外观。',
              },
              reserveArrowBuffId: {
                kind: 'string',
                referenceKind: 'buff',
                description: '后备箭层数对应的 Buff ID。',
              },
              battleArrowBuffId: {
                kind: 'string',
                referenceKind: 'buff',
                description: '战斗箭层数对应的 Buff ID。',
              },
              pointBuffId: {
                kind: 'string',
                referenceKind: 'buff',
                description: '点数层数对应的 Buff ID。',
              },
              maximumArrows: { kind: 'number', description: '箭数量显示上限。' },
              maximumPoints: { kind: 'number', description: '点数显示上限。' },
            },
          },
          {
            kind: 'object',
            fields: {
              placement: schema_09fb5d26cbd4,
              kind: { kind: 'enum', options: ['abilityEntityCount'] },
              abilityEntityId: { kind: 'string', referenceKind: 'abilityEntity' },
              icon: { kind: 'string', description: '图标资源路径。' },
              nameKey: { kind: 'string', description: '实体显示名称的 i18n 键。' },
            },
          },
        ],
        semantics: schema_36938d66df11,
        optional: true,
        description: 'CharacterTable 明确挂载的角色专属战斗 HUD；不存在时不得从遗留 prefab 猜测。',
      },
      entityBlackboardInitializers: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            key: { kind: 'string', description: '要初始化的实体黑板键。' },
            condition: {
              kind: 'object',
              fields: schema_8b37c2981f22,
              semantics: { aliases: ['BuildCondition'] },
              description: '根据最终构筑判断写入哪个值。',
            },
            trueValue: { kind: 'number', description: '条件成立时写入的值。' },
            falseValue: { kind: 'number', description: '条件不成立时写入的值。' },
          },
        },
        semantics: { arrayElement: {} },
        optional: true,
        description: '技能间共享的实体黑板初值；条件只读取已解析的静态构筑。',
      },
      passiveSkills: {
        kind: 'array',
        element: schema_1f21df9328c5,
        semantics: { arrayElement: {} },
        optional: true,
        description: '角色自身始终安装的隐藏基础被动；与受构筑开关控制的天赋/潜能被动分开。',
      },
      eventHandlers: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            key: { kind: 'string', description: '响应在此干员定义中的唯一名称。' },
            event: {
              kind: 'enum',
              options: ['deckAttributesChanged'],
              description: '要监听的构筑事件。',
            },
            sequence: {
              kind: 'opaque',
              fallback: schema_41f65db75420,
              semantics: schema_6675b27ea82d,
              description: '事件发生后执行的动作序列。',
            },
          },
        },
        semantics: { arrayElement: {} },
        optional: true,
        description: '构筑属性变化时执行的干员级响应。',
      },
      talents: {
        kind: 'array',
        element: schema_1f21df9328c5,
        semantics: { arrayElement: {} },
        description: '固定两个按顺序排列的天赋槽；只修改槽内内容，不改变槽位数量。',
      },
      potentials: {
        kind: 'array',
        element: schema_1f21df9328c5,
        semantics: { arrayElement: {} },
        description: '固定五个按顺序排列的潜能槽；校验器会报告数量不正确的草稿。',
      },
      conversionSupport: {
        kind: 'object',
        fields: {
          completeness: {
            kind: 'enum',
            options: ['complete', 'partial'],
            semantics: schema_4107b248d073,
            description: '`complete` 表示已覆盖全部已知能力，`partial` 表示仍有明确缺项。',
          },
          missingCapabilities: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                capability: {
                  kind: 'enum',
                  options: [
                    'skillBehavior',
                    'skillAvailability',
                    'talentEffects',
                    'potentialEffects',
                    'runtimeDependencies',
                  ],
                  semantics: schema_18ab763e1525,
                  description: '缺失能力的类别。',
                },
                skillGroupKeys: {
                  kind: 'array',
                  element: { kind: 'string' },
                  semantics: { arrayElement: {} },
                  optional: true,
                  description: '仅当缺失能力能明确归到某个技能组时，给出该技能组的稳定键。',
                },
              },
            },
            semantics: { arrayElement: {} },
            description: '宽松转换时未能生成的能力列表。',
          },
        },
        optional: true,
        description: '未提供时视为人工审核完成；宽松转换产物必须显式携带该字段。',
      },
    },
  },
  weapon: {
    kind: 'object',
    fields: {
      slug: {
        kind: 'string',
        description: '游戏原生武器对象 ID（`wpn_*`）；项目引用、实例关联与校验均以它为准。',
      },
      displayName: {
        kind: 'string',
        optional: true,
        description: '缺少本地化资源时可使用的武器名称。',
      },
      assetSlug: {
        kind: 'string',
        optional: true,
        description: '仅用于定位图标/本地化等展示资源；资源复用不得改变 slug 身份。',
      },
      iconPath: schema_04620bcedd77,
      rarity: {
        kind: 'enum',
        options: [4, 5, 6, 3],
        semantics: schema_36938d66df11,
        description: '武器星级。',
      },
      weaponType: {
        kind: 'enum',
        options: ['sword', 'greatsword', 'polearm', 'handcannon', 'arts-unit'],
        semantics: schema_18ab763e1525,
        description: '可装备这把武器的干员武器类型。',
      },
      baseAttackAtLevelNodes: {
        kind: 'array',
        element: { kind: 'number' },
        semantics: { arrayElement: {} },
        description:
          '依次对应 1、20、40、60、80、90 级节点；其他等级必须由有证据的成长规则解析，不能擅自插值。',
      },
      traits: {
        kind: 'array',
        element: schema_1f21df9328c5,
        semantics: { arrayElement: {} },
        description: '按武器词条槽顺序保存的被动能力。',
      },
      buffDefinitions: {
        kind: 'record',
        value: schema_a361791fb8fc,
        semantics: schema_c7288b42bef0,
        optional: true,
        description: '整把武器的 Buff 定义闭包；各词条引用它，不由某条技能代持。',
      },
    },
  },
  gear: {
    kind: 'object',
    fields: {
      slug: {
        kind: 'string',
        description: '游戏原生装备对象 ID（`item_equip_*`）；项目引用、实例关联与校验均以它为准。',
      },
      displayName: {
        kind: 'string',
        optional: true,
        description: '缺少本地化资源时可使用的装备名称。',
      },
      assetSlug: {
        kind: 'string',
        optional: true,
        description: '仅用于定位图标/本地化等展示资源；共用 iconId 不得改变 slug 身份。',
      },
      iconPath: schema_04620bcedd77,
      slotType: {
        kind: 'enum',
        options: ['armor', 'gloves', 'accessory'],
        semantics: schema_0027e97043bf,
        description: '这件装备占用的槽位。',
      },
      levelRequirement: { kind: 'number', description: '可以穿戴这件装备的最低干员等级。' },
      baseDefense: { kind: 'number', description: '装备提供的基础防御力。' },
      traits: {
        kind: 'array',
        element: { kind: 'object', fields: schema_7377908c39c8 },
        semantics: { arrayElement: {} },
        description: '按词条槽顺序保存的装备能力。',
      },
      gearSetSlug: {
        kind: 'string',
        referenceKind: 'gearSet',
        optional: true,
        description: '所属套装的 ID；省略表示不属于套装。',
      },
    },
  },
  gearSet: {
    kind: 'object',
    fields: {
      buffDefinitions: {
        kind: 'record',
        value: schema_a361791fb8fc,
        semantics: schema_c7288b42bef0,
        optional: true,
        description: '套装对象持有的 Buff 定义，套装效果通过 ID 引用。',
      },
      slug: { kind: 'string', description: '游戏原生套装 ID。' },
      skillId: {
        kind: 'string',
        optional: true,
        description: '套装效果的原生 SkillData 身份；不同于套装对象 ID。',
      },
      displayName: {
        kind: 'string',
        optional: true,
        description: '缺少本地化资源时可使用的套装名称。',
      },
      iconPath: {
        kind: 'string',
        optional: true,
        description: '套装效果在时间轴上的展示图标；独立于效果自身的原生图标。',
      },
      actionGraph: schema_d4e3ff1ae98a,
      modifiers: schema_4e057aa3baa4,
      eventHandlers: schema_b0fdd4672083,
      blackboard: schema_e4e214b79007,
      enableSequence: schema_3d1bf8fec70a,
      initializationSequence: schema_5721ad030ce6,
    },
  },
  consumable: {
    kind: 'object',
    fields: {
      id: { kind: 'string' },
      iconPath: { kind: 'string' },
      rarity: { kind: 'number' },
      kind: { kind: 'enum', options: ['operatorBuff'] },
      durationSeconds: { kind: 'number' },
      exclusiveGroup: {
        kind: 'enum',
        options: ['operatorConsumableBuff'],
        description: '同组物品在同一干员身上互斥；使用新物品时结束旧物品的全部 Buff。',
      },
      applications: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            buffId: schema_d056c7fa0b76,
            blackboardValues: {
              kind: 'record',
              value: { kind: 'number' },
              semantics: { recordValue: {} },
            },
          },
        },
        semantics: { arrayElement: {} },
      },
    },
  },
  enemy: {
    kind: 'object',
    fields: {
      id: { kind: 'string' },
      iconPath: { kind: 'string', optional: true },
      tier: {
        kind: 'enum',
        options: ['elite', 'boss', 'normal', 'advanced', 'leader'],
        semantics: schema_18ab763e1525,
      },
      rank: {
        kind: 'enum',
        options: ['mob', 'elite', 'boss'],
        semantics: schema_0027e97043bf,
        description: '原生战斗等级；独立于五档展示 tier，供 CheckEnemyRank 等战斗规则读取。',
      },
      levelHp: {
        kind: 'tuple',
        elements: [
          schema_bbff0d28079e,
          schema_bbff0d28079e,
          schema_bbff0d28079e,
          schema_bbff0d28079e,
          schema_bbff0d28079e,
          schema_bbff0d28079e,
        ],
        minLength: 6,
        semantics: {
          tuple: {
            elements: [
              { semantics: {} },
              { semantics: {} },
              { semantics: {} },
              { semantics: {} },
              { semantics: {} },
              { semantics: {} },
            ],
            minLength: 6,
          },
        },
        readonlyDeclaration: true,
        description: '按 ENEMY_LEVELS 排列的六档生命值。',
      },
      defense: { kind: 'number' },
      resistances: {
        kind: 'object',
        fields: {
          physical: { kind: 'number' },
          heat: { kind: 'number' },
          cryo: { kind: 'number' },
          electric: { kind: 'number' },
          nature: { kind: 'number' },
        },
      },
      superArmor: { kind: 'number' },
      stagger: {
        kind: 'object',
        fields: {
          maximum: { kind: 'number' },
          knotThresholds: {
            kind: 'array',
            element: { kind: 'number' },
            semantics: { arrayElement: {} },
            description: '已损失失衡值占上限的递增阈值；跨越阈值会触发对应节点事件。',
          },
          knotBreakDurationSeconds: { kind: 'number' },
          brokenDurationSeconds: { kind: 'number' },
          finisherSpRecovery: {
            kind: 'number',
            description: '对该敌人施放处决后，玩家获得的技力。',
          },
        },
      },
      finisherMultiplier: { kind: 'number' },
    },
  },
  globalEffect: {
    kind: 'object',
    fields: {
      id: { kind: 'string' },
      nameKey: { kind: 'string', optional: true },
      descriptionKey: { kind: 'string', optional: true },
      buff: schema_a361791fb8fc,
    },
  },
  contract: {
    kind: 'object',
    fields: {
      tagId: { kind: 'number' },
      columnId: { kind: 'string' },
      conflictId: { kind: 'string' },
      score: { kind: 'number' },
      keyId: { kind: 'string' },
      lockIds: { kind: 'array', element: { kind: 'string' }, semantics: { arrayElement: {} } },
      romanNumSuffix: { kind: 'string' },
      iconPath: { kind: 'string' },
      blackboard: { kind: 'record', value: { kind: 'number' }, semantics: { recordValue: {} } },
    },
  },
  skill: {
    kind: 'union',
    variants: [
      {
        kind: 'object',
        fields: {
          actionGraph: {
            kind: 'graph',
            description: '该技能完整的节点和宏；所有入口均在此图中解析。',
          },
          key: schema_28e83f505977,
          nativeSkillType: schema_d7eeb3cea02e,
          enhancementStateBuffId: schema_2555d4e0ba1c,
          smartTarget: schema_72850bb1ad5f,
          timelineBlockFrames: {
            kind: 'number',
            description: '时间轴技能块的显示宽度；由可操作边界推导，不对应原生 `durationFrame`。',
          },
          timelineContinuationSkillId: schema_fc434466b7ee,
          timelineBlockFollowUpSkillId: schema_d2d610731e8e,
          naturalDurationFrames: { kind: 'number', description: schema_11661fe69962 },
          exclusiveFrame: schema_4d4ef7cf5451,
          offsetRecordFrame: schema_7e5b67c1428e,
          inputWindows: schema_72e7e1b50ca4,
          availability: schema_b05d7d181f20,
          cooldownFrames: schema_261fb5fd5774,
          costs: schema_123ad80e4366,
          costFrame: schema_f5e87a023be7,
          switchToBuffCast: schema_e5c0475d6e2a,
          eventHandlers: schema_191bca465db9,
          blackboard: schema_dcc3197d8b15,
          scheduledSequences: schema_3c8414c0c980,
          skillType: {
            kind: 'enum',
            options: [
              'comboSkill',
              'plungingAttack',
              'basicAttack',
              'battleSkill',
              'ultimate',
              'finisher',
            ],
            semantics: schema_43d88f577f05,
            description: '技能的战斗分类，不由技能库分组推测。',
          },
          levelSource: {
            kind: 'enum',
            options: ['comboSkill', 'basicAttack', 'battleSkill', 'ultimate'],
            semantics: schema_36938d66df11,
            description: '技能使用哪一项养成等级；由原生技能组成员关系确定。',
          },
        },
      },
      {
        kind: 'object',
        fields: {
          actionGraph: {
            kind: 'graph',
            description: '该技能完整的节点和宏；所有入口均在此图中解析。',
          },
          key: schema_28e83f505977,
          nativeSkillType: schema_d7eeb3cea02e,
          enhancementStateBuffId: schema_2555d4e0ba1c,
          smartTarget: schema_72850bb1ad5f,
          timelineBlockFrames: {
            kind: 'number',
            description: '时间轴技能块的显示宽度；由可操作边界推导，不对应原生 `durationFrame`。',
          },
          timelineContinuationSkillId: schema_fc434466b7ee,
          timelineBlockFollowUpSkillId: schema_d2d610731e8e,
          naturalDurationFrames: { kind: 'number', description: schema_11661fe69962 },
          exclusiveFrame: schema_4d4ef7cf5451,
          offsetRecordFrame: schema_7e5b67c1428e,
          inputWindows: schema_72e7e1b50ca4,
          availability: schema_b05d7d181f20,
          cooldownFrames: schema_261fb5fd5774,
          costs: schema_123ad80e4366,
          costFrame: schema_f5e87a023be7,
          switchToBuffCast: schema_e5c0475d6e2a,
          eventHandlers: schema_191bca465db9,
          blackboard: schema_dcc3197d8b15,
          scheduledSequences: schema_3c8414c0c980,
          skillType: { kind: 'enum', options: ['dodge'] },
          levelSource: schema_cb135381615b,
        },
      },
    ],
    semantics: schema_4107b248d073,
  },
  skillGroup: { kind: 'object', fields: schema_ca850f7fdf79 },
  skillGroupVariant: { kind: 'object', fields: schema_59ae2ded5e63 },
  buff: {
    kind: 'union',
    variants: [
      {
        kind: 'object',
        fields: {
          blackboard: schema_392f51ba723b,
          affixSkillCastIdentity: schema_ceffc9c43558,
          presentation: schema_66813ff77e4f,
          childPresentations: schema_33ac911479b6,
          timeClock: schema_dfe7358daaf2,
          applyTags: schema_8b88c642c1c1,
          extendTags: schema_863b2cb8a77f,
          stackingType: schema_ff2061aceb44,
          stackingKey: schema_3b569e7c8969,
          priority: schema_625761b25948,
          durationSeconds: schema_1646c027f760,
          addingCooldownSeconds: schema_766ffb12ccde,
          ignoreAddingCooldown: {
            kind: 'boolean',
            optional: true,
            description: '只跳过已有冷却检查，仍在创建/叠层前登记本次冷却。',
          },
          triggerIntervalSeconds: schema_ea1506a43797,
          waitFirstTriggerInterval: schema_d31f7e092524,
          maxTriggerCount: schema_7c5ce6c644b5,
          attributeModifiers: schema_78c333188111,
          keywordEnhancements: schema_37edd074d3b3,
          shields: schema_72ecafe1082d,
          sustainedProtection: schema_741e6ba26ed9,
          role: schema_69a4fde8bf05,
          spellBurst: schema_83b511d451cd,
          maxStackCount: schema_ed6a823b7734,
          skillSlotReplacements: schema_1ff0b8a1d665,
          actionGraph: schema_cb135381615b,
          scheduledSequences: schema_cb135381615b,
          lifecycleSequences: schema_cb135381615b,
          abilityEventResponses: schema_cb135381615b,
          igniteEventResponses: schema_cb135381615b,
          damageModifiers: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                enabledSide: schema_bec9f789392d,
                processors: schema_a2f7c7d1976f,
                condition: schema_cb135381615b,
              },
            },
            semantics: { arrayElement: {} },
            optional: true,
          },
          healModifiers: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                enabledSide: schema_4589467e4874,
                processors: schema_f15fd9ff6614,
                condition: schema_cb135381615b,
              },
            },
            semantics: { arrayElement: {} },
            optional: true,
          },
          poiseModifiers: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                enabledSide: schema_0695876eae6b,
                processors: schema_cfeca66fd8de,
                condition: schema_cb135381615b,
              },
            },
            semantics: { arrayElement: {} },
            optional: true,
          },
        },
      },
      {
        kind: 'object',
        fields: {
          blackboard: schema_392f51ba723b,
          affixSkillCastIdentity: schema_ceffc9c43558,
          presentation: schema_66813ff77e4f,
          childPresentations: schema_33ac911479b6,
          timeClock: schema_dfe7358daaf2,
          applyTags: schema_8b88c642c1c1,
          extendTags: schema_863b2cb8a77f,
          stackingType: schema_ff2061aceb44,
          stackingKey: schema_3b569e7c8969,
          priority: schema_625761b25948,
          durationSeconds: schema_1646c027f760,
          addingCooldownSeconds: schema_766ffb12ccde,
          ignoreAddingCooldown: {
            kind: 'boolean',
            optional: true,
            description: '只跳过已有冷却检查，仍在创建/叠层前登记本次冷却。',
          },
          triggerIntervalSeconds: schema_ea1506a43797,
          waitFirstTriggerInterval: schema_d31f7e092524,
          maxTriggerCount: schema_7c5ce6c644b5,
          attributeModifiers: schema_78c333188111,
          keywordEnhancements: schema_37edd074d3b3,
          healModifiers: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                enabledSide: schema_4589467e4874,
                condition: schema_40c2917eb344,
                processors: schema_f15fd9ff6614,
              },
            },
            semantics: { arrayElement: {} },
            optional: true,
            description: 'Buff 启用期间参与治疗计算的条件和数值处理器。',
          },
          poiseModifiers: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                enabledSide: schema_0695876eae6b,
                condition: schema_40c2917eb344,
                processors: schema_cfeca66fd8de,
              },
            },
            semantics: { arrayElement: {} },
            optional: true,
            description: 'Buff 启用期间参与失衡伤害计算的条件和数值处理器。',
          },
          shields: schema_72ecafe1082d,
          sustainedProtection: schema_741e6ba26ed9,
          role: schema_69a4fde8bf05,
          spellBurst: schema_83b511d451cd,
          actionGraph: {
            kind: 'graph',
            description: '有动作入口的 Buff 保存自己的图；纯数值 Buff 可以省略。',
          },
          damageModifiers: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                enabledSide: schema_bec9f789392d,
                condition: {
                  kind: 'opaque',
                  fallback: schema_41f65db75420,
                  semantics: schema_6675b27ea82d,
                  optional: true,
                  description: '启用处理器前检查的条件。',
                },
                processors: schema_a2f7c7d1976f,
              },
            },
            semantics: { arrayElement: {} },
            optional: true,
            description: 'Buff 启用期间参与伤害计算的条件和数值处理器。',
          },
          maxStackCount: schema_ed6a823b7734,
          scheduledSequences: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                startFrame: { kind: 'number', description: '相对宿主开始时刻的起始帧。' },
                endFrame: {
                  kind: 'number',
                  optional: true,
                  description: '仅有状态动作需要；到达该帧时对已经开始的序列调用结束生命周期。',
                },
                sequence: {
                  kind: 'opaque',
                  fallback: schema_41f65db75420,
                  semantics: schema_6675b27ea82d,
                  description: '到达起始帧时执行或启动的动作序列。',
                },
              },
            },
            semantics: { arrayElement: {} },
            optional: true,
            description: 'Buff 启用期间按实例局部时钟执行的相对帧时间线。',
          },
          lifecycleSequences: {
            kind: 'object',
            fields: {
              start: {
                kind: 'opaque',
                fallback: schema_41f65db75420,
                semantics: schema_6675b27ea82d,
                optional: true,
                description: 'Buff 第一次启用时执行一次，早于修正注册。',
              },
              enable: {
                kind: 'opaque',
                fallback: schema_41f65db75420,
                semantics: schema_6675b27ea82d,
                optional: true,
                description: 'Buff 每次由停用转为启用后执行，晚于修正注册。',
              },
              disable: {
                kind: 'opaque',
                fallback: schema_41f65db75420,
                semantics: schema_6675b27ea82d,
                optional: true,
                description: 'Buff 暂停生效、准备注销修正前执行。',
              },
              beforeEnhance: {
                kind: 'opaque',
                fallback: schema_41f65db75420,
                semantics: schema_6675b27ea82d,
                optional: true,
                description: '同组 Buff 即将增加强化层数前执行。',
              },
              trigger: {
                kind: 'opaque',
                fallback: schema_41f65db75420,
                semantics: schema_6675b27ea82d,
                optional: true,
                description: 'Buff 启用期间按触发间隔到点时执行。',
              },
              enhanceChanged: {
                kind: 'opaque',
                fallback: schema_41f65db75420,
                semantics: schema_6675b27ea82d,
                optional: true,
                description: 'Buff 叠层数发生变化时执行。',
              },
              afterEnhance: {
                kind: 'opaque',
                fallback: schema_41f65db75420,
                semantics: schema_6675b27ea82d,
                optional: true,
                description: '一次叠层流程完成后执行。',
              },
              finish: {
                kind: 'opaque',
                fallback: schema_41f65db75420,
                semantics: schema_6675b27ea82d,
                optional: true,
                description: 'Buff 正式结束前执行，结束步骤仍能读取当前实例状态。',
              },
            },
            optional: true,
            description: 'Buff 生命周期各阶段执行的动作序列。',
          },
          abilityEventResponses: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                event: {
                  kind: 'enum',
                  options: [
                    'enterFight',
                    'ownerSwitchToCenter',
                    'ownerSwitchToGuard',
                    'ownerHpZero',
                    'hpChanged',
                    'abilityEntitySpawned',
                    'abilityEntityFinished',
                    'beforeHitByProjectile',
                    'beforeTakeDamage',
                    'beforeCalculateDamage',
                    'beforeDamageAction',
                    'beforeOutputDamage',
                    'beforeTakePhysicalInfliction',
                    'beforeOutputPhysicalInfliction',
                    'afterOutputPhysicalInfliction',
                    'beforeOutputKnockDown',
                    'afterOutputKnockDown',
                    'beforeOutputInfliction',
                    'beforeOutputSpellBurst',
                    'beforeTakeSpellInfliction',
                    'beforeTakeInfliction',
                    'afterTakeInfliction',
                    'takeDamage',
                    'takeCriticalDamage',
                    'outputDamage',
                    'outputCriticalDamage',
                    'outputKnockDown',
                    'outputHeal',
                    'receiveHeal',
                    'afterAddedShield',
                    'poiseZero',
                    'beforeCastSkill',
                    'afterSkillApplyCost',
                    'skillEnd',
                    'beforeOutputBuff',
                    'beforeAddedBuff',
                    'outputBuff',
                    'addedBuff',
                    'finishedBuff',
                    'buffEndsEarly',
                    'afterOutputWeaknessTriggered',
                    'customAbilityEvent',
                    'afterKillEntity',
                    'buffConsumed',
                    'skillSpGained',
                  ],
                  semantics: {
                    unionVariants: [
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                    ],
                  },
                  description: '要监听的事件。',
                },
                priority: schema_85be103572e6,
                sequence: schema_83c50661d5e5,
              },
            },
            semantics: { arrayElement: {} },
            optional: true,
            description: '每个 Buff 实例独立注册、停用或结束时注销的 Ability 事件响应。',
          },
          igniteEventResponses: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                igniteType: { kind: 'string', description: '可以触发这项响应的点燃类型。' },
                finishAfterIgnited: {
                  kind: 'boolean',
                  description: '响应执行后是否立即结束当前 Buff。',
                },
                sequence: {
                  kind: 'opaque',
                  fallback: schema_41f65db75420,
                  semantics: schema_6675b27ea82d,
                  description: '点燃时执行的动作序列。',
                },
              },
            },
            semantics: { arrayElement: {} },
            optional: true,
            description: '每个实例独立持有的点燃响应；处理后是否结束由来源数据显式决定。',
          },
          skillSlotReplacements: schema_1ff0b8a1d665,
        },
      },
    ],
    semantics: schema_4107b248d073,
  },
  abilityEntity: { kind: 'object', fields: schema_d8c018e8d611 },
  abilityEntityChildSkill: {
    kind: 'object',
    fields: {
      actionGraph: { kind: 'graph', description: '子技能自己的节点和宏，不与能力实体模板合图。' },
      skillId: { kind: 'string', referenceKind: 'skill', description: '子技能的原生 ID。' },
      nativeSkillType: {
        kind: 'enum',
        options: schema_2c482dec22dd,
        semantics: { unionVariants: [{}, {}, {}, {}, {}, {}, {}, {}, {}] },
        description: '实体注册表确定的原生技能类型。',
      },
      naturalDurationFrames: { kind: 'number', description: '没有提前结束时的自然持续帧数。' },
      castResource: {
        kind: 'object',
        fields: {
          costFrame: { kind: 'number', description: '从施放开始计数，达到该帧时确认扣费与冷却。' },
          cooldownSeconds: {
            kind: 'number',
            description: '保留原生秒值；负值在消费者语义查明前不得改写。',
          },
          maxChargeTime: {
            kind: 'number',
            description: '原生字段名尚未完成消费者语义核实，当前只保留其整数值。',
          },
          cost: {
            kind: 'object',
            fields: {
              resource: schema_531a9457dae3,
              value: schema_f163b2906690,
              availabilityThreshold: {
                kind: 'union',
                variants: schema_1235728272b5,
                semantics: schema_f27fc5f4f63d,
                description: 'ATB 可释放门槛，独立于实际 cost.value。',
              },
            },
            description: '这次施放消耗的资源及可用门槛。',
          },
        },
        description: '该技能自己的扣费和冷却设置。',
      },
      blackboard: schema_dcc3197d8b15,
      scheduledSequences: schema_3c8414c0c980,
    },
  },
  abilityEntityPassiveSkill: {
    kind: 'object',
    fields: {
      actionGraph: { kind: 'graph', description: '原生被动 SkillData 自己的图。' },
      key: { kind: 'string', description: '被动技能在能力实体定义中的唯一名称。' },
      blackboard: {
        kind: 'record',
        value: schema_813faccfbcb3,
        semantics: schema_3a45612f7fc2,
        optional: true,
        description: '创建时按引用技能等级解析的初始黑板。',
      },
      enableSequence: {
        kind: 'opaque',
        fallback: schema_41f65db75420,
        semantics: schema_6675b27ea82d,
        description: '能力实体启用时执行一次的动作序列。',
      },
      abilityEventResponses: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            event: { kind: 'enum', options: ['addedBuff'], description: '要监听的事件。' },
            priority: schema_85be103572e6,
            sequence: schema_83c50661d5e5,
          },
        },
        semantics: { arrayElement: {} },
        optional: true,
        description: '实体存活期间监听的 Buff 加入事件响应。',
      },
    },
  },
  operatorPassiveSkill: {
    kind: 'object',
    fields: {
      actionGraph: { kind: 'graph', description: '正式被动程序的局部主图与宏；不借用干员总图。' },
      key: { kind: 'string', description: '被动技能在干员定义中的唯一名称。' },
      levelSource: {
        kind: 'enum',
        options: ['comboSkill', 'basicAttack', 'battleSkill', 'ultimate'],
        semantics: schema_36938d66df11,
        optional: true,
        description: '角色基础被动跟随其所属原生技能组；养成附加被动不设置该字段。',
      },
      blackboard: {
        kind: 'record',
        value: schema_813faccfbcb3,
        semantics: schema_3a45612f7fc2,
        optional: true,
        description: '被动启用序列读取的初始黑板；数组按所属技能或当前养成等级解析。',
      },
      enableSequence: {
        kind: 'opaque',
        fallback: schema_41f65db75420,
        semantics: schema_6675b27ea82d,
        description: '原生被动 Skill.Enable 时执行的有序行为。',
      },
      abilityEventResponses: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            event: {
              kind: 'enum',
              options: [
                'abilityEntitySpawned',
                'abilityEntityFinished',
                'receiveHeal',
                'addedBuff',
                'skillSpGained',
              ],
              semantics: schema_18ab763e1525,
              description: '要监听的事件。',
            },
            priority: schema_85be103572e6,
            sequence: schema_83c50661d5e5,
          },
        },
        semantics: { arrayElement: {} },
        optional: true,
        description: '被动 Skill 的原生事件响应；与启用程序共享被动黑板。',
      },
    },
  },
  operatorUpgrade: {
    kind: 'object',
    fields: {
      actionGraph: {
        kind: 'graph',
        optional: true,
        description: '初始化及养成事件响应的所属图；纯属性/附着 Buff 配置不需要程序图。',
      },
      levels: { kind: 'number', description: '这一天赋或潜能可以选择的等级数量。' },
      simulationNoEffect: {
        kind: 'enum',
        options: [
          'uniqueEnemyHasNoAlternateTarget',
          'enemyDoesNotDealDamage',
          'enemyDoesNotInflictSpellStatusOnOperators',
        ],
        semantics: schema_0027e97043bf,
        optional: true,
        description:
          '原生效果已经取证，但在 Endaxis 固定模拟模型中没有可观察结果。\n这是完整转换结论，不是尚未建模；保留原因以便模型边界改变时重新审计。',
      },
      modifiers: {
        kind: 'array',
        element: {
          kind: 'union',
          variants: [
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addConditionalDamage'],
                  description: '满足条件时增加伤害。',
                },
                condition: {
                  kind: 'object',
                  fields: {
                    kind: {
                      kind: 'enum',
                      options: ['targetStaggered'],
                      description: '检查目标当前是否处于失衡状态。',
                    },
                    target: {
                      kind: 'enum',
                      options: ['enemy'],
                      description: '要检查的施法者或敌人。',
                    },
                  },
                  description: '此修正只支持伤害快照中的敌人失衡状态，不执行动作图条件。',
                },
                values: {
                  kind: 'union',
                  variants: schema_1235728272b5,
                  semantics: schema_f27fc5f4f63d,
                  description: '单个增伤值或按养成等级排列的增伤值。',
                },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['enableSkillBranch'],
                  description: '启用技能中的一个可选动作分支。',
                },
                skillKey: schema_f8c7f6f975a2,
                branchKey: { kind: 'string', description: '目标分支。' },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['multiplyEffectDuration'],
                  description: '乘算某个技能步骤产生效果的持续时间。',
                },
                skillKey: schema_f8c7f6f975a2,
                stepKey: { kind: 'string', description: '目标步骤。' },
                multiplier: { kind: 'number', description: '持续时间乘数。' },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['multiplySkillCost'],
                  description: '乘算技能的资源费用。',
                },
                skillKey: schema_f8c7f6f975a2,
                resource: {
                  kind: 'enum',
                  options: ['sp', 'ultimateEnergy'],
                  semantics: schema_4107b248d073,
                  description: '要修改的资源。',
                },
                multiplier: { kind: 'number', description: '费用乘数。' },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['setEffectiveness'],
                  description: '设置一个技能步骤的效果系数。',
                },
                skillKey: schema_f8c7f6f975a2,
                stepKey: { kind: 'string', description: '目标步骤。' },
                value: { kind: 'number', description: '新的效果系数。' },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addStaticDamageIncrease'],
                  description:
                    '将构筑期常驻增伤写入对应伤害属性；数值使用小数，例如 15% 写作 0.15。',
                },
                target: {
                  kind: 'enum',
                  options: ['physical', 'cryo', 'electric', 'normalAttack', 'battleSkill'],
                  semantics: schema_18ab763e1525,
                  description: '增伤对应的攻击、元素或目标分类。',
                },
                value: { kind: 'number', description: '加入该分类的增伤值。' },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addStaticHealingIncrease'],
                  description: '原生 HealOutputIncrease / HealTakenIncrease 的基础加算。',
                },
                target: {
                  kind: 'enum',
                  options: ['output', 'taken'],
                  semantics: schema_4107b248d073,
                  description: '增加治疗输出还是受到治疗。',
                },
                value: { kind: 'number', description: '加入的治疗加成值。' },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addSkillStat'],
                  description: '修改一个技能的独立面板数值。',
                },
                skillKey: schema_f8c7f6f975a2,
                stat: {
                  kind: 'enum',
                  options: ['criticalRate'],
                  description: '要修改的技能数值。',
                },
                value: { kind: 'number', description: '加入的数值。' },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['patchSkillBlackboard'],
                  description:
                    '养成效果直接修补目标技能编译后的初始动作黑板。\n`operation` 使用与原生 SkillBBModifier 相同的 add/multiply/assign 语义；\n`value` 按天赋/潜能等级解析，而不是按技能等级解析。',
                },
                skillKey: schema_f8c7f6f975a2,
                blackboardKey: { kind: 'string', description: '要修改的技能黑板键。' },
                operation: schema_719183594cc7,
                value: schema_cad6182d3965,
                minimumUpgradeLevel: {
                  kind: 'number',
                  optional: true,
                  description: '仅该养成等级区间安装此补丁；用于原生按等级切换不同标志键的结构。',
                },
                maximumUpgradeLevel: {
                  kind: 'number',
                  optional: true,
                  description: '超过此养成等级后不再安装此补丁。',
                },
                condition: {
                  kind: 'object',
                  fields: schema_8b37c2981f22,
                  semantics: { aliases: ['BuildCondition'] },
                  optional: true,
                  description: '原生 activeCondition；按最终构筑属性选择是否应用。',
                },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['patchPassiveBlackboard'],
                  description:
                    '修改已启用天赋安装的隐藏被动技能黑板；目标天赋关闭时不产生被动程序。',
                },
                passiveSkillKey: { kind: 'string', description: '目标隐藏被动技能。' },
                blackboardKey: { kind: 'string', description: '要修改的被动黑板键。' },
                operation: schema_719183594cc7,
                value: schema_cad6182d3965,
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['multiplySkillDamage'],
                  description: '乘算指定技能造成的伤害。',
                },
                skillKey: schema_f8c7f6f975a2,
                multiplier: { kind: 'number', description: '伤害乘数。' },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['multiplyStepDamage'],
                  description: '乘算一个具体技能步骤造成的伤害。',
                },
                skillKey: schema_f8c7f6f975a2,
                stepKey: { kind: 'string', description: '目标步骤。' },
                multiplier: { kind: 'number', description: '伤害乘数。' },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['multiplySkillCooldown'],
                  description: '乘算技能冷却时间。',
                },
                skillKey: schema_f8c7f6f975a2,
                branchKey: {
                  kind: 'string',
                  optional: true,
                  description: '只修改指定分支；省略时修改指定技能。',
                },
                multiplier: { kind: 'number', description: '冷却时间乘数。' },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addSkillCooldownFrames'],
                  description: '为技能冷却时间增加固定帧数。',
                },
                skillKey: schema_f8c7f6f975a2,
                frames: { kind: 'number', description: '增加的冷却帧数。' },
                condition: {
                  kind: 'object',
                  fields: schema_8b37c2981f22,
                  semantics: { aliases: ['BuildCondition'] },
                  optional: true,
                  description: '构筑满足该条件时才应用。',
                },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addBuildAttribute'],
                  description: '为一项或多项干员四维增加固定值。',
                },
                attributes: {
                  kind: 'array',
                  element: {
                    kind: 'enum',
                    options: schema_ebe2ee1f84c5,
                    semantics: schema_36938d66df11,
                  },
                  semantics: { arrayElement: schema_36938d66df11 },
                  description: '要增加的四维属性。',
                },
                value: { kind: 'number', description: '每项属性增加的数值。' },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['modifyBasePanelStat'],
                  description:
                    '修改静态面板属性的基础层。`flat` 在基础倍率前加算，`percent` 以小数累加到基础倍率。\n该边界对应原生八槽公式的基础加算与基础倍率，但名称描述实际运算，避免泄漏原生枚举名。',
                },
                stat: {
                  kind: 'enum',
                  options: ['health', 'defense', 'criticalRate', 'artsIntensity'],
                  semantics: schema_36938d66df11,
                  description: '要修改的基础面板属性。',
                },
                operation: {
                  kind: 'enum',
                  options: ['flat', 'percent'],
                  semantics: schema_4107b248d073,
                  description: '使用固定加值或百分比加值。',
                },
                value: { kind: 'number', description: '加入的数值。' },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addReactionDuration'],
                  description: '增加指定元素反应的持续时间。',
                },
                reaction: schema_1a1ced796366,
                seconds: {
                  kind: 'union',
                  variants: schema_1235728272b5,
                  semantics: schema_f27fc5f4f63d,
                  description: '单个秒数或按养成等级排列的秒数。',
                },
              },
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addReactionEffectiveness'],
                  description: '增加指定元素反应的效果系数。',
                },
                reaction: schema_1a1ced796366,
                value: {
                  kind: 'union',
                  variants: schema_1235728272b5,
                  semantics: schema_f27fc5f4f63d,
                  description: '单个加值或按养成等级排列的加值。',
                },
              },
            },
          ],
          semantics: {
            unionVariants: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
          },
        },
        semantics: {
          arrayElement: {
            unionVariants: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
          },
        },
        optional: true,
        description: '各等级提供的结构化修正。',
      },
      eventHandlers: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            event: {
              kind: 'union',
              variants: [
                {
                  kind: 'object',
                  fields: {
                    kind: {
                      kind: 'enum',
                      options: ['spGained'],
                      description: '触发器种类判别值。',
                    },
                    source: {
                      kind: 'enum',
                      options: ['normalAttack', 'powerAttack', 'default', 'skill'],
                      semantics: schema_36938d66df11,
                      optional: true,
                      description: '只监听指定的技力来源。',
                    },
                    gainKind: {
                      kind: 'enum',
                      options: ['gain', 'refund'],
                      semantics: schema_4107b248d073,
                      optional: true,
                      description: '只监听正常获取或返还。',
                    },
                  },
                },
                {
                  kind: 'object',
                  fields: {
                    kind: {
                      kind: 'enum',
                      options: ['skillHit'],
                      description: '触发器种类判别值。',
                    },
                    skillKey: {
                      kind: 'string',
                      referenceKind: 'skill',
                      description: '要匹配的执行技能。',
                    },
                    scope: schema_31987bebd7ba,
                  },
                },
                {
                  kind: 'object',
                  fields: {
                    kind: {
                      kind: 'enum',
                      options: ['elementalAttachmentConsumed'],
                      description: '事件种类判别值。',
                    },
                  },
                },
                {
                  kind: 'object',
                  fields: {
                    kind: {
                      kind: 'enum',
                      options: ['buffConsumed'],
                      description: 'Buff 消费事件。',
                    },
                    buffIds: {
                      kind: 'array',
                      element: schema_d056c7fa0b76,
                      semantics: { arrayElement: {} },
                      referenceKind: 'buff',
                      description: '任一匹配即可触发的 Buff ID。',
                    },
                  },
                },
              ],
              semantics: schema_36938d66df11,
              description: '要监听的事件及其筛选参数。',
            },
            blackboard: {
              kind: 'record',
              value: schema_813faccfbcb3,
              semantics: schema_3a45612f7fc2,
              optional: true,
              description: '监听器实例的原生常量黑板；数组按当前养成等级解析。',
            },
            sequence: schema_83c50661d5e5,
          },
        },
        semantics: { arrayElement: {} },
        optional: true,
        description: '启用后注册的战斗事件响应。',
      },
      initializationSequence: {
        kind: 'opaque',
        fallback: schema_41f65db75420,
        semantics: schema_6675b27ea82d,
        optional: true,
        description: '养成启用后直接安装的初始化行为；不是技能，也不进入可释放技能集合。',
      },
      attachedBuffs: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            buffId: schema_d056c7fa0b76,
            blackboardAssignments: {
              kind: 'record',
              value: schema_813faccfbcb3,
              semantics: schema_3a45612f7fc2,
              optional: true,
            },
          },
        },
        semantics: { arrayElement: {} },
        optional: true,
        description: '原生 CharMiscFeature 直接附着的 Buff；数值按这一天赋或潜能的等级解析。',
      },
      passiveSkills: {
        kind: 'array',
        element: schema_1f21df9328c5,
        semantics: { arrayElement: {} },
        optional: true,
        description: '仅在这个养成项启用时安装；每个被动在一场战斗中只启用一次。',
      },
    },
  },
  weaponTrait: {
    kind: 'object',
    fields: {
      key: { kind: 'string', description: '词条在该武器中的唯一名称。' },
      skillId: {
        kind: 'string',
        optional: true,
        description: '原生 SkillData 身份，仅用于来源记录；程序始终归属于本武器。',
      },
      levelCount: { kind: 'number', description: '这条词条可以解析的等级数量。' },
      actionGraph: schema_d4e3ff1ae98a,
      modifiers: schema_4e057aa3baa4,
      eventHandlers: schema_b0fdd4672083,
      blackboard: schema_e4e214b79007,
      enableSequence: schema_3d1bf8fec70a,
      initializationSequence: schema_5721ad030ce6,
    },
  },
  gearTrait: { kind: 'object', fields: schema_7377908c39c8 },
} as const satisfies DefinitionSchemaCatalog;
