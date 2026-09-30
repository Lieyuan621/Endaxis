/** 由 tools/editor/generateDefinitionSchemas.ts 从正式契约生成，请勿手改。 */
import type { DefinitionSchemaCatalog } from './fieldSchema';
const definitionSchemaPart_e5c24599909bd2cf = {
  kind: 'object',
  fields: {
    burstType: { kind: 'string', description: '选择这组爆发参数的原生爆发类型。' },
    damageType: {
      kind: 'enum',
      options: ['physical', 'heat', 'cryo', 'electric', 'nature', 'true', 'lifeDrain', 'ether'],
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
const definitionSchemaPart_b22ea6704cd9bf42 = {
  kind: 'union',
  variants: [
    { kind: 'number' },
    {
      kind: 'object',
      fields: { blackboardKey: { kind: 'string', description: '读取持续秒数的 Buff 黑板键。' } },
    },
    {
      kind: 'object',
      fields: {
        attributeSource: {
          kind: 'enum',
          options: ['buffOwner', 'buffSource'],
          optional: true,
          description: '读取 Buff 持有者还是 Buff 来源；省略时使用运行时默认对象。',
        },
        attribute: { kind: 'string', description: '要读取的原生属性名称。' },
        multiplier: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '属性值的乘数。',
        },
        addition: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '乘算后再加入的固定值。',
        },
      },
    },
  ],
  description: '固定护盾值、黑板数值或按属性计算的护盾值。',
} as const;
const definitionSchemaPart_18c516b8c11fc280 = {
  triggerBuffIds: {
    kind: 'array',
    element: { kind: 'string' },
    description: '其中任一 Buff 加入时触发关键词强化。',
  },
  operation: {
    kind: 'enum',
    options: ['assign', 'add', 'multiply'],
    description: '对关键词数值执行赋值、加算或乘算。',
  },
  targetKey: { kind: 'string', description: '要修改的关键词数值名称。' },
  initialValue: {
    kind: 'union',
    variants: [
      { kind: 'number' },
      {
        kind: 'object',
        fields: { blackboardKey: { kind: 'string', description: '读取持续秒数的 Buff 黑板键。' } },
      },
    ],
    description: '尚未触发强化时的关键词初始值。',
  },
  value: {
    kind: 'union',
    variants: [
      { kind: 'number' },
      {
        kind: 'object',
        fields: { blackboardKey: { kind: 'string', description: '读取持续秒数的 Buff 黑板键。' } },
      },
    ],
    description: '每次触发时写入或参与运算的值。',
  },
} as const;
const definitionSchemaPart_0d23fc44562e81e5 = {
  kind: 'object',
  fields: definitionSchemaPart_18c516b8c11fc280,
} as const;
const definitionSchemaPart_7a0160662e73f537 = {
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
        skillSlotKey: { kind: 'string', description: '要读取的技能槽。' },
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
          element: { kind: 'string' },
          description: '原生 normalAttackList、处决和下落等路径能够请求的技能全集。',
        },
        normalAttackSkillKeys: {
          kind: 'array',
          element: { kind: 'string' },
          optional: true,
          description:
            'CharacterData.normalAttackList 给出的默认有序普攻连段，不包含处决和下落攻击。',
        },
        defaultSkillKey: {
          kind: 'string',
          optional: true,
          description: '只有 SkillDataBundle/default mode 的命令映射已导入时才允许设置。',
        },
      },
    },
  ],
  optional: true,
} as const;
const definitionSchemaPart_26fdca1c2b9df509 = {
  key: { kind: 'string', description: '响应在同一装备定义中的唯一名称。' },
  priority: {
    kind: 'number',
    optional: true,
    description: '原生数据动作优先级；同级按定义中的注册顺序执行。',
  },
  condition: { kind: 'condition', optional: true, description: '事件发生后还需满足的条件。' },
  sequence: { kind: 'opaque', description: '条件成立时执行的动作序列。' },
  event: {
    kind: 'opaque',
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
    description: '直接监听的一项原生能力事件。',
  },
} as const;
const definitionSchemaPart_e81aca98dabb0556 = {
  kind: 'object',
  fields: {
    currentSkillTypes: {
      kind: 'array',
      element: {
        kind: 'enum',
        options: [
          'comboSkill',
          'plungingAttack',
          'basicAttack',
          'battleSkill',
          'ultimate',
          'finisher',
          'dodge',
        ],
      },
      optional: true,
      description: '只在当前技能属于这些分类时启用旁路。',
    },
    requiresCurrentSkillNotInterruptible: {
      kind: 'boolean',
      optional: true,
      description: '是否要求当前技能仍处于不可中断阶段。',
    },
    condition: { kind: 'condition', optional: true, description: '候选技能自身需要满足的条件。' },
    asSkillCast: { kind: 'boolean', optional: true, description: '是否仍发布完整的技能施放事件。' },
    sequence: { kind: 'opaque', description: '命中旁路后直接执行的动作序列。' },
  },
  optional: true,
  description:
    '原生 SwitchToAddBuff 的施放前旁路；命中时不启动或中断普通技能时间轴。\n`currentSkillTypes` 表达依赖上一技能身份的结束技路径；`condition` 表达候选技能自身的\n普通条件路径。两者同时存在时均须成立。`asSkillCast` 保留原生是否发布完整施法事件。',
} as const;
const definitionSchemaPart_8f021ae528e82f26 = {
  kind: 'array',
  element: definitionSchemaPart_0d23fc44562e81e5,
  optional: true,
  description:
    '指定的其他 Buff 成功加入同一持有者时，对当前 Buff 的关键词倍率执行赋值、加法或乘法。',
} as const;
const definitionSchemaPart_f9f52945e019f978 = {
  kind: 'object',
  fields: definitionSchemaPart_26fdca1c2b9df509,
} as const;
const definitionSchemaPart_c5622df5b42d5107 = {
  placementPolicy: {
    kind: 'object',
    fields: {
      kind: {
        kind: 'enum',
        options: ['recursiveInput'],
        description: '当前策略通过递归读取输入窗口展开技能链。',
      },
      firstSkillKey: { kind: 'string', description: '技能链的第一段。' },
      terminalSkillKey: { kind: 'string', description: '到达此技能后停止展开。' },
      maxSegments: { kind: 'number', description: '最多放置的技能段数。' },
      fallback: {
        kind: 'enum',
        options: ['sequence'],
        description: '推测失败时按技能组声明顺序放置。',
      },
    },
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
      { kind: 'opaque' },
      { kind: 'opaque' },
      {
        kind: 'array',
        element: { kind: 'union', variants: [{ kind: 'opaque' }, { kind: 'opaque' }] },
      },
    ],
    description: '此形态包含的单个技能或有序技能链。',
  },
} as const;
const definitionSchemaPart_996102063edc91c3 = {
  kind: 'object',
  fields: definitionSchemaPart_c5622df5b42d5107,
} as const;
const definitionSchemaPart_c5617055abca6818 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['elementalAttachment'], description: '语义角色判别值。' },
        element: {
          kind: 'enum',
          options: ['heat', 'cryo', 'electric', 'nature'],
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
          description: '被消耗的已有附着元素。',
        },
        incomingElement: {
          kind: 'enum',
          options: ['heat', 'cryo', 'electric', 'nature'],
          description: '本次新加入的元素。',
        },
      },
    },
  ],
  optional: true,
  description: '标记该 Buff 的特殊战斗身份，供元素附着、元素爆发等专用规则识别。',
} as const;
const definitionSchemaPart_41a7b554b3d33769 = {
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
            description: '相对属性选择方式。',
          },
        },
      },
    ],
    description: '指定属性名称，或在应用时按持有者选择主属性、副属性或全部四维。',
  },
  slot: {
    kind: 'enum',
    options: [
      'addition',
      'multiplier',
      'finalAddition',
      'finalMultiplier',
      'baseAddition',
      'baseMultiplier',
      'baseFinalAddition',
      'baseFinalMultiplier',
    ],
    description: '要写入的原生属性公式槽。',
  },
  value: {
    kind: 'union',
    variants: [
      { kind: 'number' },
      {
        kind: 'object',
        fields: { blackboardKey: { kind: 'string', description: '读取修正值的 Buff 黑板键。' } },
      },
    ],
    description: '固定修正值或从 Buff 黑板读取的值。',
  },
  target: {
    kind: 'enum',
    options: ['buffSource', 'owner'],
    optional: true,
    description: '修正 Buff 持有者还是 Buff 来源；省略时修正持有者。',
  },
  source: {
    kind: 'enum',
    options: ['converted'],
    optional: true,
    description: '以换算属性来源写入，避免再次参与属性换算。',
  },
} as const;
const definitionSchemaPart_3940f945d7f18ccf = {
  kind: 'object',
  fields: definitionSchemaPart_41a7b554b3d33769,
} as const;
const definitionSchemaPart_6294ade70f2eba04 = {
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
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '每次乘算使用的基础倍率。',
        },
        multiplierCount: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
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
          description: '修改治疗者的输出加成或受治疗者的承疗加成。',
        },
        addition: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '加入对应治疗加成区的数值。',
        },
      },
    },
  ],
} as const;
const definitionSchemaPart_c7b83581a705b403 = {
  kind: { kind: 'enum', options: ['damageBonus'], description: '修正种类判别值。' },
  damageTypes: {
    kind: 'union',
    variants: [
      {
        kind: 'enum',
        options: ['physical', 'heat', 'cryo', 'electric', 'nature', 'true', 'lifeDrain', 'ether'],
      },
      {
        kind: 'array',
        element: {
          kind: 'enum',
          options: ['physical', 'heat', 'cryo', 'electric', 'nature', 'true', 'lifeDrain', 'ether'],
        },
      },
    ],
    description: '此加成覆盖的伤害类型。',
  },
  skillTypes: {
    kind: 'union',
    variants: [
      {
        kind: 'enum',
        options: [
          'comboSkill',
          'plungingAttack',
          'basicAttack',
          'battleSkill',
          'ultimate',
          'finisher',
          'dodge',
        ],
      },
      {
        kind: 'array',
        element: {
          kind: 'enum',
          options: [
            'comboSkill',
            'plungingAttack',
            'basicAttack',
            'battleSkill',
            'ultimate',
            'finisher',
            'dodge',
          ],
        },
      },
    ],
    optional: true,
    description: '进一步限制此加成覆盖的技能类型；省略时不按技能类型筛选。',
  },
  value: {
    kind: 'union',
    variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
    description: '单个加成值或按等级排列的加成值。',
  },
} as const;
const definitionSchemaPart_188e6e7c3b717b29 = {
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
          variants: [{ kind: 'null' }, { kind: 'string' }],
          description: '空值是原生的“该窗口没有直接技能路由”，不得回退为基础技能。',
        },
      },
    },
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
          element: { kind: 'string' },
          description: '此窗口允许请求的原生技能 ID。',
        },
      },
    },
    optional: true,
    description: '在指定帧段内允许提前接续的技能。',
  },
  hasConditionalActions: {
    kind: 'boolean',
    optional: true,
    description: '存在条件或嵌套输入 Action；当前输入状态不足时必须返回未知而不是猜测。',
  },
} as const;
const definitionSchemaPart_86687ed84be6472b = {
  kind: 'object',
  fields: definitionSchemaPart_c7b83581a705b403,
} as const;
const definitionSchemaPart_92fb3d2a1801587e = {
  kind: 'array',
  element: definitionSchemaPart_6294ade70f2eba04,
  description: '按顺序执行的治疗处理器。',
} as const;
const definitionSchemaPart_04fae3bbd1433b0b = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['damageScale'], description: '处理器种类判别值。' },
        side: {
          kind: 'enum',
          options: ['defender', 'attacker'],
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
          description: '写入的伤害倍率区间。',
        },
        addition: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
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
          description: '要修改攻击方还是防御方的属性。',
        },
        values: {
          kind: 'union',
          variants: [{ kind: 'opaque' }, { kind: 'opaque' }],
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
} as const;
const definitionSchemaPart_598035322a30cf7e = {
  kind: 'array',
  element: definitionSchemaPart_3940f945d7f18ccf,
  optional: true,
  description: 'Buff 启用期间注册到目标或来源身上的属性修正。',
} as const;
const definitionSchemaPart_a810f0ea1d42edc1 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['casterControlled'], description: '条件种类判别值。' },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventDamageTagsMatch'],
          description: '检查本次伤害携带的标签。',
        },
        match: {
          kind: 'enum',
          options: ['hasAny', 'hasAll'],
          description: '匹配任一标签或全部标签。',
        },
        tags: {
          kind: 'array',
          element: {
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
          },
          description: '参与匹配的伤害标签。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['all'], description: '所有子条件都成立时返回真。' },
        conditions: {
          kind: 'array',
          element: {
            kind: 'union',
            variants: [{ kind: 'opaque' }, { kind: 'opaque' }, { kind: 'opaque' }],
          },
          description: '需要同时成立的条件。',
        },
      },
    },
  ],
  optional: true,
  description: '启用处理器前必须满足的条件。',
} as const;
const definitionSchemaPart_4a5a5441066de403 = {
  kind: 'array',
  element: definitionSchemaPart_04fae3bbd1433b0b,
  description: '条件成立时按顺序执行的伤害处理器。',
} as const;
const definitionSchemaPart_821736a8a96da82e = {
  kind: 'object',
  fields: definitionSchemaPart_188e6e7c3b717b29,
  optional: true,
  description:
    '从原生顶层直连输入 Action 保留的操作解析证据。两类窗口职责不同：\ncommandMappings 选择该操作当前指向的技能，allowedNextSkills 只决定能否提前中断。',
} as const;
const definitionSchemaPart_7ca2dcc8b8f414d8 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['targetHealthCompare'],
          description: '比较受治疗者的当前生命值或生命比例。',
        },
        valueType: {
          kind: 'enum',
          options: ['current', 'ratio'],
          description: '比较当前生命值还是当前生命比例。',
        },
        operator: {
          kind: 'enum',
          options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
          description: '数值比较符。',
        },
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '与生命值或比例比较的值。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffBlackboardCompare'],
          description: '比较同一 Buff 黑板中的两个动态值或常量。',
        },
        left: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '左操作数。',
        },
        operator: {
          kind: 'enum',
          options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
          description: '数值比较符。',
        },
        right: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '右操作数。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['healTagsMatch'], description: '检查本次治疗携带的标签。' },
        match: {
          kind: 'enum',
          options: ['hasAny', 'hasAll'],
          description: '匹配任一标签或全部标签。',
        },
        tags: { kind: 'array', element: { kind: 'string' }, description: '参与匹配的治疗标签。' },
      },
    },
  ],
  optional: true,
  description: '启用处理器前必须满足的条件。',
} as const;
const definitionSchemaPart_ef3dab407e79d31a = {
  enabledSide: {
    kind: 'enum',
    options: ['defender', 'attacker'],
    description: '只有此修正安装在指定一方时才启用。',
  },
  condition: definitionSchemaPart_a810f0ea1d42edc1,
  processors: {
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
          description: '修改攻击方还是目标方的倍率。',
        },
        addition: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '加入对应倍率区的数值。',
        },
      },
    },
    description: '按顺序执行的失衡伤害处理器。',
  },
} as const;
const definitionSchemaPart_43d125d476ed48f7 = {
  kind: 'object',
  fields: definitionSchemaPart_ef3dab407e79d31a,
} as const;
const definitionSchemaPart_79a547f12b220e64 = {
  kind: 'array',
  element: definitionSchemaPart_43d125d476ed48f7,
  optional: true,
  description: 'Buff 启用期间参与失衡伤害计算的条件和数值处理器。',
} as const;
const definitionSchemaPart_4c63278d33e4ab8f = {
  infinityValue: { kind: 'boolean', description: '是否使用不会耗尽的无限护盾值。' },
  value: definitionSchemaPart_b22ea6704cd9bf42,
  damageAbsorptions: {
    kind: 'array',
    element: {
      kind: 'object',
      fields: {
        damageType: {
          kind: 'enum',
          options: ['physical', 'heat', 'cryo', 'electric', 'nature', 'true', 'lifeDrain', 'ether'],
          description: '适用的伤害类型。',
        },
        ratio: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '本次伤害由护盾吸收的比例。',
        },
        scale: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '吸收伤害时消耗护盾值的倍率。',
        },
      },
    },
    description: '针对不同伤害类型的吸收规则。',
  },
  absorbCount: {
    kind: 'union',
    variants: [
      { kind: 'number' },
      {
        kind: 'object',
        fields: { blackboardKey: { kind: 'string', description: '读取触发次数的 Buff 黑板键。' } },
      },
    ],
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
    description: '与其他护盾竞争时的消耗优先级。',
  },
  replaceHitEffect: {
    kind: 'boolean',
    description: '只保留原生表现选择位；后端不解释 EffectActionCfg。',
  },
} as const;
const definitionSchemaPart_a9c0806317520e29 = {
  kind: 'object',
  fields: definitionSchemaPart_4c63278d33e4ab8f,
} as const;
const definitionSchemaPart_9c22bcefe527200c = {
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
    kind: 'opaque',
    optional: true,
    description: '多个 Buff 图标同时出现时的排序设置。',
  },
} as const;
const definitionSchemaPart_ed86128ce2e14542 = {
  kind: 'array',
  element: definitionSchemaPart_a9c0806317520e29,
  optional: true,
  description: 'Buff 启用时创建的护盾；护盾的数值、吸收范围、次数和销毁行为由条目配置。',
} as const;
const definitionSchemaPart_316b95a84fa3d088 = {
  kind: 'object',
  fields: definitionSchemaPart_9c22bcefe527200c,
  description: '子 Buff 的显示规则。',
} as const;
const definitionSchemaPart_b4dd272f42b97be7 = {
  buffId: { kind: 'string', description: '子 Buff ID。' },
  presentation: definitionSchemaPart_316b95a84fa3d088,
} as const;
const definitionSchemaPart_6c768c193a129d39 = {
  kind: 'object',
  fields: definitionSchemaPart_b4dd272f42b97be7,
} as const;
const definitionSchemaPart_7622c8ab71ae32a4 = {
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
const definitionSchemaPart_6ab46a59cb9ce424 = {
  kind: 'array',
  element: definitionSchemaPart_6c768c193a129d39,
  optional: true,
  description: '跟随本体同时出现和消失的额外显示图标；它们没有独立战斗效果和生命周期。',
} as const;
const definitionSchemaPart_0907a88302c1c530 = {
  kind: 'object',
  fields: definitionSchemaPart_7622c8ab71ae32a4,
  optional: true,
  description: 'Buff 自身的图标、颜色、排序位置和进度条等显示设置。\n不参与战斗计算的显示信息。',
} as const;
const definitionSchemaPart_128822589608fa54 = {
  enabledSide: {
    kind: 'enum',
    options: ['healer', 'receiver'],
    description: '只有此修正安装在指定一方时才启用。',
  },
  condition: definitionSchemaPart_7ca2dcc8b8f414d8,
  processors: definitionSchemaPart_92fb3d2a1801587e,
} as const;
const definitionSchemaPart_db0299e70d51236e = {
  kind: 'object',
  fields: definitionSchemaPart_128822589608fa54,
} as const;
const definitionSchemaPart_355b6a0fa82de5f1 = {
  kind: 'array',
  element: definitionSchemaPart_db0299e70d51236e,
  optional: true,
  description: 'Buff 启用期间参与治疗计算的条件和数值处理器。',
} as const;
const definitionSchemaPart_dbcf78b3ec1054b8 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['abilityEvent'], description: '直接监听能力系统事件。' },
        event: {
          kind: 'enum',
          options: ['beforeAddedBuff', 'outputBuff', 'addedBuff'],
          description: '允许直接订阅的能力事件。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['operatorHit'], description: '触发器种类判别值。' },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['operatorHealed'], description: '触发器种类判别值。' },
        role: {
          kind: 'enum',
          options: ['source', 'target'],
          optional: true,
          description: '只监听治疗来源或受治疗者；省略时两者都可触发。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['buffApplied'], description: '触发器种类判别值。' },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['buffOutput'], description: '触发器种类判别值。' },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['buffConsumed'], description: '触发器种类判别值。' },
        buffIds: {
          kind: 'array',
          element: { kind: 'string' },
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
          optional: true,
          description: '只监听指定的技力来源。',
        },
        gainKind: {
          kind: 'enum',
          options: ['gain', 'refund'],
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
          description: '要匹配的伤害标签。',
        },
        scope: {
          kind: 'enum',
          options: ['team', 'operator'],
          description: '检查当前干员还是全队来源。',
        },
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
            { kind: 'enum', options: ['physical', 'heat', 'cryo', 'electric', 'nature'] },
            {
              kind: 'array',
              element: {
                kind: 'enum',
                options: ['physical', 'heat', 'cryo', 'electric', 'nature'],
              },
            },
          ],
          description: '任一匹配即可成立的元素。',
        },
        scope: {
          kind: 'enum',
          options: ['team', 'operator'],
          description: '检查当前干员还是全队来源。',
        },
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
            { kind: 'enum', options: ['crush', 'airborne', 'knockDown', 'fracture'] },
            {
              kind: 'array',
              element: { kind: 'enum', options: ['crush', 'airborne', 'knockDown', 'fracture'] },
            },
          ],
          description: '任一匹配即可成立的物理异常。',
        },
        scope: {
          kind: 'enum',
          options: ['team', 'operator'],
          description: '检查当前干员还是全队来源。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['skillHit'], description: '触发器种类判别值。' },
        skillKey: { kind: 'string', description: '要匹配的执行技能。' },
        scope: {
          kind: 'enum',
          options: ['team', 'operator'],
          description: '检查当前干员还是全队来源。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['enemyDefeated'], description: '触发器种类判别值。' },
        scope: {
          kind: 'enum',
          options: ['team', 'operator'],
          description: '检查当前干员还是全队来源。',
        },
      },
    },
  ],
  description: '监听一项语义战斗事件。',
} as const;
const definitionSchemaPart_da4a171338fb35b1 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['abilityEvent'], description: '直接监听能力系统事件。' },
        event: {
          kind: 'enum',
          options: ['beforeAddedBuff', 'outputBuff', 'addedBuff'],
          description: '允许直接订阅的能力事件。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['operatorHit'], description: '触发器种类判别值。' },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['operatorHealed'], description: '触发器种类判别值。' },
        role: {
          kind: 'enum',
          options: ['source', 'target'],
          optional: true,
          description: '只监听治疗来源或受治疗者；省略时两者都可触发。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['buffApplied'], description: '触发器种类判别值。' },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['buffOutput'], description: '触发器种类判别值。' },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['buffConsumed'], description: '触发器种类判别值。' },
        buffIds: {
          kind: 'array',
          element: { kind: 'string' },
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
          optional: true,
          description: '只监听指定的技力来源。',
        },
        gainKind: {
          kind: 'enum',
          options: ['gain', 'refund'],
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
          description: '要匹配的伤害标签。',
        },
        scope: {
          kind: 'enum',
          options: ['team', 'operator'],
          description: '检查当前干员还是全队来源。',
        },
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
            { kind: 'enum', options: ['physical', 'heat', 'cryo', 'electric', 'nature'] },
            {
              kind: 'array',
              element: {
                kind: 'enum',
                options: ['physical', 'heat', 'cryo', 'electric', 'nature'],
              },
            },
          ],
          description: '任一匹配即可成立的元素。',
        },
        scope: {
          kind: 'enum',
          options: ['team', 'operator'],
          description: '检查当前干员还是全队来源。',
        },
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
            { kind: 'enum', options: ['crush', 'airborne', 'knockDown', 'fracture'] },
            {
              kind: 'array',
              element: { kind: 'enum', options: ['crush', 'airborne', 'knockDown', 'fracture'] },
            },
          ],
          description: '任一匹配即可成立的物理异常。',
        },
        scope: {
          kind: 'enum',
          options: ['team', 'operator'],
          description: '检查当前干员还是全队来源。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['skillHit'], description: '触发器种类判别值。' },
        skillKey: { kind: 'string', description: '要匹配的执行技能。' },
        scope: {
          kind: 'enum',
          options: ['team', 'operator'],
          description: '检查当前干员还是全队来源。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['enemyDefeated'], description: '触发器种类判别值。' },
        scope: {
          kind: 'enum',
          options: ['team', 'operator'],
          description: '检查当前干员还是全队来源。',
        },
      },
    },
  ],
  description: '要监听的战斗事件及其筛选参数。',
} as const;
const definitionSchemaPart_33c4116cce186bdd = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['attribute'], description: '修正种类判别值。' },
        attribute: {
          kind: 'enum',
          options: ['strength', 'agility', 'intellect', 'will', 'main', 'secondary'],
          description: '要修改的属性。',
        },
        operation: {
          kind: 'enum',
          options: ['flat', 'percent'],
          description: '`flat` 为固定加值，`percent` 为百分比加值。',
        },
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
          description: '单个数值或按等级排列的数值。',
        },
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
          description: '要修改的面板属性。',
        },
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
          description: '单个数值或按等级排列的数值。',
        },
      },
    },
    definitionSchemaPart_86687ed84be6472b,
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
          description: '要修改的伤害倍率项。',
        },
        slot: {
          kind: 'enum',
          options: ['addition', 'baseAddition'],
          optional: true,
          description: '写入基础加算槽还是普通加算槽；旧数据省略时使用基础加算槽。',
        },
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
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
          description: '`output` 修改治疗输出，`taken` 修改受到的治疗。',
        },
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
          description: '单个加成值或按等级排列的加成值。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['skillCooldownMultiplier'],
          description: '修正种类判别值。',
        },
        skillTypes: {
          kind: 'union',
          variants: [
            {
              kind: 'enum',
              options: [
                'comboSkill',
                'plungingAttack',
                'basicAttack',
                'battleSkill',
                'ultimate',
                'finisher',
                'dodge',
              ],
            },
            {
              kind: 'array',
              element: {
                kind: 'enum',
                options: [
                  'comboSkill',
                  'plungingAttack',
                  'basicAttack',
                  'battleSkill',
                  'ultimate',
                  'finisher',
                  'dodge',
                ],
              },
            },
          ],
          description: '此倍率覆盖的技能类型。',
        },
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
          description: '冷却时长倍率；例如 `0.9` 表示原时长的 90%。',
        },
      },
    },
  ],
} as const;
const definitionSchemaPart_f7d4b88afad9a3f2 = {
  kind: 'array',
  element: definitionSchemaPart_33c4116cce186bdd,
  optional: true,
  description: '构筑阶段持续生效的属性修正。',
} as const;
const definitionSchemaPart_99162e862bbe1672 = {
  key: { kind: 'string', description: '响应在同一装备定义中的唯一名称。' },
  priority: {
    kind: 'number',
    optional: true,
    description: '原生数据动作优先级；同级按定义中的注册顺序执行。',
  },
  condition: { kind: 'condition', optional: true, description: '事件发生后还需满足的条件。' },
  sequence: { kind: 'opaque', description: '条件成立时执行的动作序列。' },
  event: definitionSchemaPart_dbcf78b3ec1054b8,
  abilityEvent: {
    kind: 'opaque',
    optional: true,
    description: '使用语义战斗事件时不能同时监听能力事件。',
  },
} as const;
const definitionSchemaPart_8f70651688025f54 = {
  kind: 'object',
  fields: definitionSchemaPart_99162e862bbe1672,
} as const;
const definitionSchemaPart_718024227f3f5e76 = {
  key: { kind: 'string', description: '事件响应在当前技能中的唯一名称。' },
  event: definitionSchemaPart_da4a171338fb35b1,
  condition: { kind: 'condition', optional: true, description: '事件发生后还需满足的条件。' },
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
        sequence: { kind: 'opaque', description: '到达起始帧时执行或启动的动作序列。' },
      },
    },
    description: '相对事件时刻调度的动作序列。',
  },
} as const;
const definitionSchemaPart_726d375d82e99555 = {
  kind: 'object',
  fields: definitionSchemaPart_718024227f3f5e76,
} as const;
const definitionSchemaPart_3763bd013ef12fa6 = {
  kind: 'array',
  element: definitionSchemaPart_726d375d82e99555,
  optional: true,
  description: '技能启用期间注册的战斗事件响应。',
} as const;
const definitionSchemaPart_b8863ed743da886f = {
  kind: 'union',
  variants: [definitionSchemaPart_8f70651688025f54, definitionSchemaPart_f9f52945e019f978],
} as const;
const definitionSchemaPart_66170672031a6e9c = {
  kind: 'array',
  element: definitionSchemaPart_b8863ed743da886f,
  optional: true,
  description: '装备能力注册的战斗事件响应。',
} as const;
const definitionSchemaPart_f9c92aded72ca8cc = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['entityTagMatch'],
          description: '检查来源方或目标方的 GameplayTag。',
        },
        target: { kind: 'enum', options: ['enemy', 'caster'], description: '要检查的对象。' },
        tagQueryType: {
          kind: 'enum',
          options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
          description: '标签集合的匹配方式。',
        },
        tags: { kind: 'array', element: { kind: 'string' }, description: '参与匹配的标签。' },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['casterControlled'], description: '条件种类判别值。' },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffIdCountCompare'],
          description: '比较指定对象身上若干 Buff 的实例总数。',
        },
        target: { kind: 'enum', options: ['enemy', 'caster'], description: '要统计 Buff 的对象。' },
        buffIds: {
          kind: 'array',
          element: { kind: 'string' },
          description: '计入统计的 Buff ID。',
        },
        operator: {
          kind: 'enum',
          options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
          description: '计数比较符。',
        },
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '与实例总数比较的值。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventDamageTagsMatch'],
          description: '检查本次伤害携带的伤害标签。',
        },
        match: {
          kind: 'enum',
          options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll', 'exact'],
          description: '标签集合的匹配方式。',
        },
        tags: {
          kind: 'array',
          element: {
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
          },
          description: '参与匹配的伤害标签。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventDamageFeaturesMatch'],
          description: '检查本次伤害携带的特征。',
        },
        match: {
          kind: 'enum',
          options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll', 'exact'],
          description: '特征集合的匹配方式。',
        },
        features: {
          kind: 'array',
          element: {
            kind: 'enum',
            options: [
              'canBreakWeakness',
              'crush',
              'airborne',
              'knockDown',
              'shatter',
              'dot',
              'remainArea',
              'talentDamage',
              'physicalInfliction',
            ],
          },
          description: '参与匹配的伤害特征。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventDamageTypesMatch'],
          description: '检查本次伤害的伤害类型。',
        },
        damageTypes: {
          kind: 'array',
          element: {
            kind: 'enum',
            options: [
              'physical',
              'heat',
              'cryo',
              'electric',
              'nature',
              'true',
              'lifeDrain',
              'ether',
            ],
          },
          description: '任一匹配即可成立的伤害类型。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['targetHealthCompare'],
          description: '比较敌人的当前生命或生命比例。',
        },
        target: { kind: 'enum', options: ['enemy'], description: '当前只支持伤害目标。' },
        valueType: {
          kind: 'enum',
          options: ['current', 'ratio'],
          description: '比较生命数值还是生命比例。',
        },
        operator: {
          kind: 'enum',
          options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
          description: '数值比较符。',
        },
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '与目标生命比较的值。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['targetPoiseCompare'],
          description: '比较敌人的当前失衡值。',
        },
        target: { kind: 'enum', options: ['enemy'], description: '当前只支持伤害目标。' },
        returnValueIfMissing: {
          kind: 'boolean',
          description: '目标没有失衡条时直接采用的判断结果。',
        },
        operator: {
          kind: 'enum',
          options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
          description: '数值比较符。',
        },
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '与目标失衡值比较的值。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['sourceSkillCastMatch'], description: '条件种类判别值。' },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffBlackboardCompare'],
          description: '比较同一 Buff 黑板中的两个动态值或常量。',
        },
        left: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '左操作数。',
        },
        operator: {
          kind: 'enum',
          options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
          description: '数值比较符。',
        },
        right: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'opaque' }],
          description: '右操作数。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['not'], description: '对一个子条件取反。' },
        condition: {
          kind: 'union',
          variants: [
            { kind: 'opaque' },
            { kind: 'opaque' },
            { kind: 'opaque' },
            { kind: 'opaque' },
            { kind: 'opaque' },
            { kind: 'opaque' },
            { kind: 'opaque' },
            { kind: 'opaque' },
            { kind: 'opaque' },
            { kind: 'opaque' },
            { kind: 'opaque' },
            { kind: 'opaque' },
            { kind: 'opaque' },
          ],
          description: '要取反的条件。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['all'], description: '所有子条件都成立时返回真。' },
        conditions: {
          kind: 'array',
          element: {
            kind: 'union',
            variants: [
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
            ],
          },
          description: '需要同时成立的条件。',
        },
      },
    },
    {
      kind: 'object',
      fields: {
        kind: { kind: 'enum', options: ['any'], description: '任一子条件成立时返回真。' },
        conditions: {
          kind: 'array',
          element: {
            kind: 'union',
            variants: [
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
              { kind: 'opaque' },
            ],
          },
          description: '只需其中一项成立的条件。',
        },
      },
    },
  ],
  optional: true,
  description: '启用处理器前检查的条件。',
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
      rarity: { kind: 'enum', options: [4, 5, 6], description: '干员星级。' },
      defaultPotential: {
        kind: 'number',
        optional: true,
        description: '编辑器选择和“拉满”时使用的产品默认潜能；省略时沿用旧版星级策略。',
      },
      weaponType: {
        kind: 'enum',
        options: ['sword', 'greatsword', 'polearm', 'handcannon', 'arts-unit'],
        description: '干员可以装备的武器类型。',
      },
      element: {
        kind: 'enum',
        options: ['physical', 'heat', 'cryo', 'electric', 'nature'],
        description: '干员元素。',
      },
      role: {
        kind: 'enum',
        options: ['guard', 'caster', 'defender', 'vanguard', 'supporter', 'striker'],
        description: '干员战斗定位。',
      },
      mainAttribute: {
        kind: 'enum',
        options: ['strength', 'agility', 'intellect', 'will'],
        description: '干员主属性。',
      },
      secondaryAttribute: {
        kind: 'enum',
        options: ['strength', 'agility', 'intellect', 'will'],
        description: '干员副属性。',
      },
      attributes: {
        kind: 'object',
        fields: {
          strength: { kind: 'array', element: { kind: 'number' } },
          agility: { kind: 'array', element: { kind: 'number' } },
          intellect: { kind: 'array', element: { kind: 'number' } },
          will: { kind: 'array', element: { kind: 'number' } },
          baseAttack: {
            kind: 'array',
            element: { kind: 'number' },
            description: '各等级的基础攻击力。',
          },
          baseHealth: {
            kind: 'array',
            element: { kind: 'number' },
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
            description: '各信赖节点提供的属性值。',
          },
          attributes: {
            kind: 'array',
            element: {
              kind: 'enum',
              options: ['strength', 'agility', 'intellect', 'will', 'main', 'secondary'],
            },
            description: '每个节点增加的具体属性或相对主副属性。',
          },
        },
        optional: true,
        description: '仅记录偏离全局 `[10, 15, 15, 20]` 主属性规则的干员。',
      },
      skillGroups: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            placementPolicy: {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['recursiveInput'],
                  description: '当前策略通过递归读取输入窗口展开技能链。',
                },
                firstSkillKey: { kind: 'string', description: '技能链的第一段。' },
                terminalSkillKey: { kind: 'string', description: '到达此技能后停止展开。' },
                maxSegments: { kind: 'number', description: '最多放置的技能段数。' },
                fallback: {
                  kind: 'enum',
                  options: ['sequence'],
                  description: '推测失败时按技能组声明顺序放置。',
                },
              },
              optional: true,
              description: '编辑器一次放置整个技能组时采用的展开规则。',
            },
            key: { kind: 'string', description: '技能组在干员定义中的唯一名称。' },
            operationType: {
              kind: 'enum',
              options: [
                'comboSkill',
                'plungingAttack',
                'basicAttack',
                'battleSkill',
                'ultimate',
                'finisher',
                'dodge',
              ],
              description:
                '玩家操作类别；技能库与轴上技能块均据此展示，实际执行读取具体技能的 skillType。',
            },
            skills: {
              kind: 'union',
              variants: [
                { kind: 'opaque' },
                { kind: 'opaque' },
                {
                  kind: 'array',
                  element: { kind: 'union', variants: [{ kind: 'opaque' }, { kind: 'opaque' }] },
                },
              ],
              description: '单个可放置技能，或作为一个技能库条目放置的有序技能链。',
            },
            nameKey: {
              kind: 'string',
              optional: true,
              description:
                '操作名称模板的 i18n 键，含 name/shortName；{baseName} 为操作名称（轴上含段号）。',
            },
            placementSequenceSkillKeys: {
              kind: 'array',
              element: { kind: 'string' },
              optional: true,
              description:
                '运行时虽以换槽形态注册、但编辑器放置时具有明确先后关系的完整技能键序列。\n独立替换操作必须直接声明独立技能组，不由 UI 从 replacement 拆出卡片。',
            },
            variants: {
              kind: 'array',
              element: {
                kind: 'object',
                fields: {
                  placementPolicy: {
                    kind: 'opaque',
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
                      { kind: 'opaque' },
                      { kind: 'opaque' },
                      {
                        kind: 'array',
                        element: {
                          kind: 'union',
                          variants: [{ kind: 'opaque' }, { kind: 'opaque' }],
                        },
                      },
                    ],
                    description: '此形态包含的单个技能或有序技能链。',
                  },
                },
              },
              optional: true,
              description:
                '同一稳定输入类型下的具名形态链。形态不是新的技能类型；它可以使用不同的养成等级来源，\n例如终结技状态下的强化普攻仍属于普攻，但倍率取终结技等级。',
            },
            replacementSkills: {
              kind: 'array',
              element: { kind: 'union', variants: [{ kind: 'opaque' }, { kind: 'opaque' }] },
              optional: true,
              description:
                '与 `skills` 共用一个稳定放置身份、仅由运行时换槽动作选中的技能形态。\n这里只保存本组连续段或内部执行技能；独立可放置的替换操作应放在独立组的 skills 中。',
            },
            replacementSkillPlacements: {
              kind: 'record',
              value: { kind: 'enum', options: ['internal'] },
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
                    variants: [{ kind: 'opaque' }, { kind: 'opaque' }],
                    description: '已合并输入包装器资源规则、且拥有独立稳定 key 的执行定义。',
                  },
                  executionSkillKey: {
                    kind: 'string',
                    description: '执行体在原生养成定义中的稳定技能身份。',
                  },
                },
              },
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
                    kind: 'opaque',
                    description: '最终构筑满足此条件时选用该展示形态。',
                  },
                },
              },
              optional: true,
              description: '同一稳定技能组的 UI 变体，不会产生独立的释放身份。',
            },
          },
        },
        description: '干员技能库的操作组集合；不包含切人、闪避、跳跃。组成员配置操作段的目标技能。',
      },
      dodgeSkill: {
        kind: 'union',
        variants: [{ kind: 'opaque' }, { kind: 'opaque' }],
        optional: true,
        description: '完美闪避成功后由中心状态机施放的隐藏技能；不作为普通技能块出现在技能库。',
      },
      dashBuffs: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            buffId: { kind: 'string' },
            blackboard: {
              kind: 'record',
              value: { kind: 'union', variants: [{ kind: 'string' }, { kind: 'number' }] },
            },
          },
        },
        optional: true,
        description: '进入原生 Dash 状态时附着到当前干员的 Buff，以及创建实例时写入的字面黑板。',
      },
      skillSlots: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            key: { kind: 'string', description: '技能槽在干员定义中的唯一名称。' },
            baseSkillKey: { kind: 'string', description: '战斗开始时装入槽位的技能。' },
            stableSkillKeys: {
              kind: 'array',
              element: { kind: 'string' },
              optional: true,
              description: '未发生槽位替换时仍可由同一语义动作明确请求的技能。',
            },
            replacementSkillKeys: {
              kind: 'array',
              element: { kind: 'string' },
              description: 'Buff 或模式可以换入该槽位的技能。',
            },
          },
        },
        optional: true,
        description: '战斗时可被 Buff/Mode 改写的技能槽；独立于技能库分组。',
      },
      playerActionRoutes: {
        kind: 'object',
        fields: {
          comboSkill: definitionSchemaPart_7a0160662e73f537,
          basicAttack: definitionSchemaPart_7a0160662e73f537,
          battleSkill: definitionSchemaPart_7a0160662e73f537,
          ultimate: definitionSchemaPart_7a0160662e73f537,
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
              element: { kind: 'string' },
              optional: true,
              description: '此模式下普通攻击序列允许请求的技能。',
            },
            commandMappings: {
              kind: 'object',
              fields: {
                comboSkill: { kind: 'opaque', optional: true },
                basicAttack: { kind: 'opaque', optional: true },
                battleSkill: { kind: 'opaque', optional: true },
                ultimate: { kind: 'opaque', optional: true },
              },
              optional: true,
              description: '此模式对四类玩家操作的技能请求覆盖。',
            },
          },
        },
        optional: true,
        description: 'CharacterData 中会覆盖普攻序列或命令映射的模式；独立于技能库分组。',
      },
      skillAliases: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            from: {
              kind: 'array',
              element: { kind: 'string' },
              description: '旧项目中的技能组和技能键。',
            },
            to: {
              kind: 'array',
              element: { kind: 'string' },
              description: '当前对应的技能组和技能键。',
            },
          },
        },
        optional: true,
        description: '旧项目技能身份到当前规范身份的只读兼容映射；不得作为技能库中的额外入口展示。',
      },
      buffDefinitions: {
        kind: 'record',
        value: { kind: 'union', variants: [{ kind: 'opaque' }, { kind: 'opaque' }] },
        optional: true,
        description: '干员级附属对象；编辑器后续可在干员层级创建和修改，技能不得复制其完整定义。',
      },
      buffDisplayNameKeys: {
        kind: 'record',
        value: { kind: 'string' },
        optional: true,
        description: '此干员附属 Buff 的名称翻译键；仅用于展示，不进入战斗回执。',
      },
      abilityEntityDefinitions: {
        kind: 'record',
        value: {
          kind: 'object',
          fields: {
            bornTags: {
              kind: 'array',
              element: { kind: 'string' },
              optional: true,
              description:
                'AbilityEntityTemplateData.bornTags；实体创建时立即成为其 AbilitySystem 自身标签。',
            },
            blackboard: {
              kind: 'record',
              value: { kind: 'union', variants: [{ kind: 'string' }, { kind: 'number' }] },
              optional: true,
              description:
                'AbilitySystemData.entityBlackboard 的模板初值；生成动作的显式赋值可覆盖同名键。',
            },
            lifetime: {
              kind: 'union',
              variants: [{ kind: 'opaque' }, { kind: 'opaque' }],
              description: '能力实体的寿命：限定秒数或无限持续。',
            },
            deathReleaseDelaySeconds: {
              kind: 'number',
              optional: true,
              description: '实体死亡后仍留在 owner children / finder 目录中的控制器回收延迟。',
            },
            maxStackingCount: {
              kind: 'union',
              variants: [{ kind: 'number' }, { kind: 'opaque' }],
              optional: true,
              description: '正数时，同模板新实例会按原生 Group.Add 语义同步释放最早实例。',
            },
            childSkill: {
              kind: 'opaque',
              optional: true,
              description: '该模板只使用一个子技能时的简写定义。',
            },
            childSkills: {
              kind: 'record',
              value: { kind: 'opaque' },
              optional: true,
              description: '同一原生实体模板可由不同 Spawn 动作绑定不同子技能；键为原生技能 ID。',
            },
            passiveSkills: {
              kind: 'array',
              element: { kind: 'opaque' },
              optional: true,
              description: '能力实体启用期间安装的被动技能。',
            },
          },
        },
        optional: true,
        description: '干员级能力实体蓝图；子技能按引用它的技能等级编译。',
      },
      comboSkillConditions: {
        kind: 'array',
        element: { kind: 'opaque' },
        optional: true,
        description: '原生角色常驻连携条件；多段连携的后续窗口仍由技能序列中的步骤开启。',
      },
      comboSkillPriority: {
        kind: 'enum',
        options: ['default', 'firstBlackboard', 'enemyRank'],
        optional: true,
        description: 'SkillDataBundle.comboSkillPriorityType；单敌人运行时不评分，但转换不得丢失。',
      },
      entityBlackboard: {
        kind: 'record',
        value: { kind: 'union', variants: [{ kind: 'string' }, { kind: 'number' }] },
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
              normalBuffId: { kind: 'string', description: '普通状态读取的 Buff ID。' },
              ultimateBuffId: { kind: 'string', description: '终结技状态读取的 Buff ID。' },
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
              reserveArrowBuffId: { kind: 'string', description: '后备箭层数对应的 Buff ID。' },
              battleArrowBuffId: { kind: 'string', description: '战斗箭层数对应的 Buff ID。' },
              pointBuffId: { kind: 'string', description: '点数层数对应的 Buff ID。' },
              maximumArrows: { kind: 'number', description: '箭数量显示上限。' },
              maximumPoints: { kind: 'number', description: '点数显示上限。' },
            },
          },
          {
            kind: 'object',
            fields: {
              kind: { kind: 'enum', options: ['abilityEntityCount'] },
              abilityEntityId: { kind: 'string' },
              icon: { kind: 'string', description: '图标资源路径。' },
              nameKey: { kind: 'string', description: '实体显示名称的 i18n 键。' },
            },
          },
        ],
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
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['deckAttributeCompare'],
                  description: '在构筑阶段比较两项干员四维。',
                },
                left: {
                  kind: 'enum',
                  options: ['strength', 'agility', 'intellect', 'will'],
                  description: '左侧属性。',
                },
                operator: {
                  kind: 'enum',
                  options: [
                    'equal',
                    'notEqual',
                    'greater',
                    'greaterOrEqual',
                    'less',
                    'lessOrEqual',
                  ],
                  description: '数值比较符。',
                },
                right: {
                  kind: 'enum',
                  options: ['strength', 'agility', 'intellect', 'will'],
                  description: '右侧属性。',
                },
              },
              description: '根据最终构筑判断写入哪个值。',
            },
            trueValue: { kind: 'number', description: '条件成立时写入的值。' },
            falseValue: { kind: 'number', description: '条件不成立时写入的值。' },
          },
        },
        optional: true,
        description: '技能间共享的实体黑板初值；条件只读取已解析的静态构筑。',
      },
      passiveSkills: {
        kind: 'array',
        element: { kind: 'opaque' },
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
            sequence: { kind: 'opaque', description: '事件发生后执行的动作序列。' },
          },
        },
        optional: true,
        description: '构筑属性变化时执行的干员级响应。',
      },
      talents: {
        kind: 'array',
        element: { kind: 'opaque' },
        description: '固定两个按顺序排列的天赋槽；只修改槽内内容，不改变槽位数量。',
      },
      potentials: {
        kind: 'array',
        element: { kind: 'opaque' },
        description: '固定五个按顺序排列的潜能槽；校验器会报告数量不正确的草稿。',
      },
      conversionSupport: {
        kind: 'object',
        fields: {
          completeness: {
            kind: 'enum',
            options: ['complete', 'partial'],
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
                  description: '缺失能力的类别。',
                },
                skillGroupKeys: {
                  kind: 'array',
                  element: { kind: 'string' },
                  optional: true,
                  description: '仅当缺失能力能明确归到某个技能组时，给出该技能组的稳定键。',
                },
              },
            },
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
      iconPath: {
        kind: 'string',
        optional: true,
        description: '与语言无关的展示资源；名称和描述仍由 locale family 按需解析。',
      },
      rarity: { kind: 'enum', options: [4, 5, 6, 3], description: '武器星级。' },
      weaponType: {
        kind: 'enum',
        options: ['sword', 'greatsword', 'polearm', 'handcannon', 'arts-unit'],
        description: '可装备这把武器的干员武器类型。',
      },
      baseAttackAtLevelNodes: {
        kind: 'array',
        element: { kind: 'number' },
        description:
          '依次对应 1、20、40、60、80、90 级节点；其他等级必须由有证据的成长规则解析，不能擅自插值。',
      },
      traits: {
        kind: 'array',
        element: { kind: 'opaque' },
        description: '按武器词条槽顺序保存的被动能力。',
      },
      buffDefinitions: {
        kind: 'record',
        value: { kind: 'union', variants: [{ kind: 'opaque' }, { kind: 'opaque' }] },
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
      iconPath: {
        kind: 'string',
        optional: true,
        description: '与语言无关的展示资源；名称和描述仍由 locale family 按需解析。',
      },
      slotType: {
        kind: 'enum',
        options: ['armor', 'gloves', 'accessory'],
        description: '这件装备占用的槽位。',
      },
      levelRequirement: { kind: 'number', description: '可以穿戴这件装备的最低干员等级。' },
      baseDefense: { kind: 'number', description: '装备提供的基础防御力。' },
      traits: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            key: { kind: 'string', description: '词条在该装备中的唯一名称。' },
            levelCount: { kind: 'number', description: '这条词条可以解析的精锻等级数量。' },
            modifiers: definitionSchemaPart_f7d4b88afad9a3f2,
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
                      variants: [
                        { kind: 'opaque' },
                        { kind: 'opaque' },
                        { kind: 'opaque' },
                        { kind: 'opaque' },
                        { kind: 'opaque' },
                        { kind: 'opaque' },
                      ],
                      description: '用于显示的修正定义。',
                    },
                  },
                },
                {
                  kind: 'object',
                  fields: {
                    kind: {
                      kind: 'enum',
                      options: ['composite'],
                      description: '使用预设的复合词条文字。',
                    },
                    composite: {
                      kind: 'enum',
                      options: [
                        'cryoAndElectricDamageIncrease',
                        'heatAndNatureDamageIncrease',
                        'allSkillDamageIncrease',
                        'allDamageReduction',
                        'spellDamageIncrease',
                      ],
                      description: '复合词条的类型。',
                    },
                    value: {
                      kind: 'union',
                      variants: [
                        { kind: 'number' },
                        { kind: 'array', element: { kind: 'number' } },
                      ],
                      description: '显示的单个数值或各等级数值。',
                    },
                  },
                },
              ],
              description: '每条原生装备词条都有且只有一份 displayAttrModifiers 展示定义。',
            },
          },
        },
        description: '按词条槽顺序保存的装备能力。',
      },
      gearSetSlug: {
        kind: 'string',
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
        value: { kind: 'union', variants: [{ kind: 'opaque' }, { kind: 'opaque' }] },
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
      actionGraph: {
        kind: 'graph',
        optional: true,
        description: '当前武器词条或套装效果自己的程序图；不按原生 ID 跨对象共享。',
      },
      modifiers: definitionSchemaPart_f7d4b88afad9a3f2,
      eventHandlers: definitionSchemaPart_66170672031a6e9c,
      blackboard: {
        kind: 'record',
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
        },
        optional: true,
        description: '配装能力的初始黑板，按词条等级解析；初始化与全部事件响应共享同一实例。',
      },
      enableSequence: {
        kind: 'opaque',
        optional: true,
        description: '能力启用前执行一次；期间自身事件响应关闭，典型用途为原生普通启动 Buff。',
      },
      initializationSequence: {
        kind: 'opaque',
        optional: true,
        description: '能力启用后在帧 0 执行一次；Toggle 初次安装及固定构筑刷新程序使用此入口。',
      },
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
            buffId: { kind: 'string' },
            blackboardValues: { kind: 'record', value: { kind: 'number' } },
          },
        },
      },
    },
  },
  enemy: {
    kind: 'object',
    fields: {
      id: { kind: 'string' },
      iconPath: { kind: 'string', optional: true },
      tier: { kind: 'enum', options: ['elite', 'boss', 'normal', 'advanced', 'leader'] },
      rank: {
        kind: 'enum',
        options: ['mob', 'elite', 'boss'],
        description: '原生战斗等级；独立于五档展示 tier，供 CheckEnemyRank 等战斗规则读取。',
      },
      levelHp: {
        kind: 'array',
        element: { kind: 'number' },
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
      buff: { kind: 'union', variants: [{ kind: 'opaque' }, { kind: 'opaque' }] },
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
      lockIds: { kind: 'array', element: { kind: 'string' } },
      romanNumSuffix: { kind: 'string' },
      iconPath: { kind: 'string' },
      blackboard: { kind: 'record', value: { kind: 'number' } },
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
          key: {
            kind: 'string',
            description: '原生 SkillData.skillId，也是干员定义和时间轴引用此技能时使用的唯一 ID。',
          },
          nativeSkillType: {
            kind: 'enum',
            options: [
              'normalSkill',
              'comboSkill',
              'ultimateSkill',
              'dodge',
              'breakingAttack',
              'passiveSkill',
              'attack',
              'attachSkill',
              'extraActiveSkill',
            ],
            description: '`_InitSkills` 创建实例时得到的原生初值；之后可由 ChangeSkillType 改写。',
          },
          enhancementStateBuffId: {
            kind: 'string',
            optional: true,
            description:
              '该次释放所创建的强化状态 Buff 身份。时间轴只按实际 Buff 回执投影生命周期；\n省略表示没有已取证的强化状态，不能把任意自身 Buff 猜成强化条。',
          },
          smartTarget: {
            kind: 'enum',
            options: ['enemy', 'input', 'trigger'],
            optional: true,
            description:
              '零距离木桩下 StoreSmartTarget 的归约结果；省略表示原技能不执行智能目标存储。',
          },
          timelineBlockFrames: {
            kind: 'number',
            description: '时间轴技能块的显示宽度；由可操作边界推导，不对应原生 `durationFrame`。',
          },
          timelineContinuationSkillId: {
            kind: 'string',
            optional: true,
            description:
              '基础攻击有序连段中建议的下一技能原生 Skill ID，供技能库递归放置、预览选择，并标记\n已保留实际 AllowNext 动作的定义。正式块宽读取实际动作候选或 canInterrupt，不按该 ID\n预选未来输入。',
          },
          timelineBlockFollowUpSkillId: {
            kind: 'string',
            optional: true,
            description: '块宽的接续参照技能；覆盖默认接续目标，仅影响显示，不执行该技能。',
          },
          naturalDurationFrames: {
            kind: 'number',
            description:
              '原生 `SkillData.durationFrame` 的运行时自然结束周期，已按原生 getter 钳制为至少 1 帧。\n它不决定技能块宽度，也不能用 `exclusiveFrame` 或最后一个可见战斗动作代替。',
          },
          exclusiveFrame: {
            kind: 'number',
            description:
              '原生 SkillData.exclusiveFrame；只在需要读取当前技能可中断状态时参与运行时判断。',
          },
          offsetRecordFrame: {
            kind: 'number',
            description: '原生 SkillData.offsetRecordFrame；到达时把下一段普攻提交为连段偏移目标。',
          },
          inputWindows: definitionSchemaPart_821736a8a96da82e,
          availability: {
            kind: 'condition',
            optional: true,
            description:
              '技能释放条件只生成合法性诊断；不成立也不会阻止技能进入模拟。\n模拟层将用户排入时间轴的动作视为已经成功释放，不得改写或跳过。',
          },
          cooldownFrames: {
            kind: 'union',
            variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
            optional: true,
            description: '技能冷却帧数，可按技能等级变化。',
          },
          costs: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                resource: {
                  kind: 'enum',
                  options: ['sp', 'ultimateEnergy'],
                  description: '要消耗的战斗资源。',
                },
                value: {
                  kind: 'union',
                  variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
                  description: '单个费用或按技能等级排列的费用。',
                },
              },
            },
            optional: true,
            description: '技能释放时消耗的资源。',
          },
          costFrame: {
            kind: 'number',
            optional: true,
            description: '原生 `CastData.startCdFrame`；配置消耗时编译器要求此字段存在。',
          },
          switchToBuffCast: definitionSchemaPart_e81aca98dabb0556,
          eventHandlers: definitionSchemaPart_3763bd013ef12fa6,
          blackboard: {
            kind: 'record',
            value: {
              kind: 'union',
              variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
            },
            optional: true,
            description: '创建时按技能等级解析的动作黑板默认值。',
          },
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
                sequence: { kind: 'opaque', description: '到达起始帧时执行或启动的动作序列。' },
              },
            },
            description: '按技能局部帧安排的动作序列。',
          },
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
            description: '技能的战斗分类，不由技能库分组推测。',
          },
          levelSource: {
            kind: 'enum',
            options: ['comboSkill', 'basicAttack', 'battleSkill', 'ultimate'],
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
          key: {
            kind: 'string',
            description: '原生 SkillData.skillId，也是干员定义和时间轴引用此技能时使用的唯一 ID。',
          },
          nativeSkillType: {
            kind: 'enum',
            options: [
              'normalSkill',
              'comboSkill',
              'ultimateSkill',
              'dodge',
              'breakingAttack',
              'passiveSkill',
              'attack',
              'attachSkill',
              'extraActiveSkill',
            ],
            description: '`_InitSkills` 创建实例时得到的原生初值；之后可由 ChangeSkillType 改写。',
          },
          enhancementStateBuffId: {
            kind: 'string',
            optional: true,
            description:
              '该次释放所创建的强化状态 Buff 身份。时间轴只按实际 Buff 回执投影生命周期；\n省略表示没有已取证的强化状态，不能把任意自身 Buff 猜成强化条。',
          },
          smartTarget: {
            kind: 'enum',
            options: ['enemy', 'input', 'trigger'],
            optional: true,
            description:
              '零距离木桩下 StoreSmartTarget 的归约结果；省略表示原技能不执行智能目标存储。',
          },
          timelineBlockFrames: {
            kind: 'number',
            description: '时间轴技能块的显示宽度；由可操作边界推导，不对应原生 `durationFrame`。',
          },
          timelineContinuationSkillId: {
            kind: 'string',
            optional: true,
            description:
              '基础攻击有序连段中建议的下一技能原生 Skill ID，供技能库递归放置、预览选择，并标记\n已保留实际 AllowNext 动作的定义。正式块宽读取实际动作候选或 canInterrupt，不按该 ID\n预选未来输入。',
          },
          timelineBlockFollowUpSkillId: {
            kind: 'string',
            optional: true,
            description: '块宽的接续参照技能；覆盖默认接续目标，仅影响显示，不执行该技能。',
          },
          naturalDurationFrames: {
            kind: 'number',
            description:
              '原生 `SkillData.durationFrame` 的运行时自然结束周期，已按原生 getter 钳制为至少 1 帧。\n它不决定技能块宽度，也不能用 `exclusiveFrame` 或最后一个可见战斗动作代替。',
          },
          exclusiveFrame: {
            kind: 'number',
            description:
              '原生 SkillData.exclusiveFrame；只在需要读取当前技能可中断状态时参与运行时判断。',
          },
          offsetRecordFrame: {
            kind: 'number',
            description: '原生 SkillData.offsetRecordFrame；到达时把下一段普攻提交为连段偏移目标。',
          },
          inputWindows: definitionSchemaPart_821736a8a96da82e,
          availability: {
            kind: 'condition',
            optional: true,
            description:
              '技能释放条件只生成合法性诊断；不成立也不会阻止技能进入模拟。\n模拟层将用户排入时间轴的动作视为已经成功释放，不得改写或跳过。',
          },
          cooldownFrames: {
            kind: 'union',
            variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
            optional: true,
            description: '技能冷却帧数，可按技能等级变化。',
          },
          costs: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                resource: {
                  kind: 'enum',
                  options: ['sp', 'ultimateEnergy'],
                  description: '要消耗的战斗资源。',
                },
                value: {
                  kind: 'union',
                  variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
                  description: '单个费用或按技能等级排列的费用。',
                },
              },
            },
            optional: true,
            description: '技能释放时消耗的资源。',
          },
          costFrame: {
            kind: 'number',
            optional: true,
            description: '原生 `CastData.startCdFrame`；配置消耗时编译器要求此字段存在。',
          },
          switchToBuffCast: definitionSchemaPart_e81aca98dabb0556,
          eventHandlers: definitionSchemaPart_3763bd013ef12fa6,
          blackboard: {
            kind: 'record',
            value: {
              kind: 'union',
              variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
            },
            optional: true,
            description: '创建时按技能等级解析的动作黑板默认值。',
          },
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
                sequence: { kind: 'opaque', description: '到达起始帧时执行或启动的动作序列。' },
              },
            },
            description: '按技能局部帧安排的动作序列。',
          },
          skillType: { kind: 'enum', options: ['dodge'] },
          levelSource: { kind: 'opaque', optional: true },
        },
      },
    ],
  },
  skillGroup: {
    kind: 'object',
    fields: {
      placementPolicy: {
        kind: 'object',
        fields: {
          kind: {
            kind: 'enum',
            options: ['recursiveInput'],
            description: '当前策略通过递归读取输入窗口展开技能链。',
          },
          firstSkillKey: { kind: 'string', description: '技能链的第一段。' },
          terminalSkillKey: { kind: 'string', description: '到达此技能后停止展开。' },
          maxSegments: { kind: 'number', description: '最多放置的技能段数。' },
          fallback: {
            kind: 'enum',
            options: ['sequence'],
            description: '推测失败时按技能组声明顺序放置。',
          },
        },
        optional: true,
        description: '编辑器一次放置整个技能组时采用的展开规则。',
      },
      key: { kind: 'string', description: '技能组在干员定义中的唯一名称。' },
      operationType: {
        kind: 'enum',
        options: [
          'comboSkill',
          'plungingAttack',
          'basicAttack',
          'battleSkill',
          'ultimate',
          'finisher',
          'dodge',
        ],
        description:
          '玩家操作类别；技能库与轴上技能块均据此展示，实际执行读取具体技能的 skillType。',
      },
      skills: {
        kind: 'union',
        variants: [
          { kind: 'opaque' },
          { kind: 'opaque' },
          {
            kind: 'array',
            element: { kind: 'union', variants: [{ kind: 'opaque' }, { kind: 'opaque' }] },
          },
        ],
        description: '单个可放置技能，或作为一个技能库条目放置的有序技能链。',
      },
      nameKey: {
        kind: 'string',
        optional: true,
        description:
          '操作名称模板的 i18n 键，含 name/shortName；{baseName} 为操作名称（轴上含段号）。',
      },
      placementSequenceSkillKeys: {
        kind: 'array',
        element: { kind: 'string' },
        optional: true,
        description:
          '运行时虽以换槽形态注册、但编辑器放置时具有明确先后关系的完整技能键序列。\n独立替换操作必须直接声明独立技能组，不由 UI 从 replacement 拆出卡片。',
      },
      variants: {
        kind: 'array',
        element: definitionSchemaPart_996102063edc91c3,
        optional: true,
        description:
          '同一稳定输入类型下的具名形态链。形态不是新的技能类型；它可以使用不同的养成等级来源，\n例如终结技状态下的强化普攻仍属于普攻，但倍率取终结技等级。',
      },
      replacementSkills: {
        kind: 'array',
        element: { kind: 'union', variants: [{ kind: 'opaque' }, { kind: 'opaque' }] },
        optional: true,
        description:
          '与 `skills` 共用一个稳定放置身份、仅由运行时换槽动作选中的技能形态。\n这里只保存本组连续段或内部执行技能；独立可放置的替换操作应放在独立组的 skills 中。',
      },
      replacementSkillPlacements: {
        kind: 'record',
        value: { kind: 'enum', options: ['internal'] },
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
              variants: [{ kind: 'opaque' }, { kind: 'opaque' }],
              description: '已合并输入包装器资源规则、且拥有独立稳定 key 的执行定义。',
            },
            executionSkillKey: {
              kind: 'string',
              description: '执行体在原生养成定义中的稳定技能身份。',
            },
          },
        },
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
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['deckAttributeCompare'],
                  description: '在构筑阶段比较两项干员四维。',
                },
                left: {
                  kind: 'enum',
                  options: ['strength', 'agility', 'intellect', 'will'],
                  description: '左侧属性。',
                },
                operator: {
                  kind: 'enum',
                  options: [
                    'equal',
                    'notEqual',
                    'greater',
                    'greaterOrEqual',
                    'less',
                    'lessOrEqual',
                  ],
                  description: '数值比较符。',
                },
                right: {
                  kind: 'enum',
                  options: ['strength', 'agility', 'intellect', 'will'],
                  description: '右侧属性。',
                },
              },
              description: '最终构筑满足此条件时选用该展示形态。',
            },
          },
        },
        optional: true,
        description: '同一稳定技能组的 UI 变体，不会产生独立的释放身份。',
      },
    },
  },
  skillGroupVariant: definitionSchemaPart_996102063edc91c3,
  buff: {
    kind: 'union',
    variants: [
      {
        kind: 'object',
        fields: {
          blackboard: {
            kind: 'record',
            value: {
              kind: 'union',
              variants: [{ kind: 'null' }, { kind: 'string' }, { kind: 'number' }],
            },
            optional: true,
            description:
              '每个 Buff 实例的初始黑板值；施加动作可以覆盖这些值，其他字段也可从中取数。',
          },
          affixSkillCastIdentity: {
            kind: 'enum',
            options: ['sourceSkillCast'],
            optional: true,
            description: '启用时记录创建该 Buff 的技能施放编号，供 SkillAffix 条件匹配同一次施放。',
          },
          presentation: definitionSchemaPart_0907a88302c1c530,
          childPresentations: definitionSchemaPart_6ab46a59cb9ce424,
          timeClock: {
            kind: 'enum',
            options: ['default', 'global', 'self'],
            optional: true,
            description: '计算持续时间和触发间隔所用的时钟；不填时随全局时间缩放。',
          },
          applyTags: {
            kind: 'array',
            element: { kind: 'string' },
            optional: true,
            description:
              'Buff 的分类标签；启用时同时挂到所属实体，并用于按标签查找、计数和结束 Buff。',
          },
          extendTags: {
            kind: 'array',
            element: { kind: 'string' },
            optional: true,
            description: 'Buff 到期但被延长逻辑暂时阻止结束时，临时挂到所属实体的标签。',
          },
          stackingType: {
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
            description: '再次施加同一叠加组的 Buff 时，决定新建实例、加层、刷新时长或拒绝施加。',
          },
          stackingKey: {
            kind: 'string',
            optional: true,
            description: 'Buff 所属的叠加组；不填时使用 Buff ID，同一组必须使用相同的叠加方式。',
          },
          priority: {
            kind: 'union',
            variants: [
              { kind: 'number' },
              {
                kind: 'object',
                fields: {
                  blackboardKey: { kind: 'string', description: '读取优先级的 Buff 黑板键。' },
                  negate: {
                    kind: 'boolean',
                    optional: true,
                    description: '是否对读到的数值取负。',
                  },
                },
              },
            ],
            optional: true,
            description: '高优先级模式的启用顺序，以及 Stack 满层时选择被替换实例的顺序。',
          },
          durationSeconds: {
            kind: 'union',
            variants: [
              { kind: 'number' },
              {
                kind: 'object',
                fields: {
                  blackboardKey: { kind: 'string', description: '读取持续秒数的 Buff 黑板键。' },
                },
              },
            ],
            optional: true,
            description:
              '普通 Buff 的持续秒数；不填表示无限持续。定时成长型 Buff 用它表示自动加层周期。',
          },
          addingCooldownSeconds: {
            kind: 'union',
            variants: [
              { kind: 'number' },
              {
                kind: 'object',
                fields: {
                  blackboardKey: { kind: 'string', description: '读取持续秒数的 Buff 黑板键。' },
                },
              },
            ],
            optional: true,
            description: '成功添加后在接收者上创建的同 ID 再次添加冷却；使用普通战斗时间计时。',
          },
          ignoreAddingCooldown: {
            kind: 'boolean',
            optional: true,
            description: '是否跳过已有添加冷却的拦截；成功添加后仍会创建新的添加冷却。',
          },
          triggerIntervalSeconds: {
            kind: 'union',
            variants: [
              { kind: 'number' },
              {
                kind: 'object',
                fields: {
                  blackboardKey: { kind: 'string', description: '读取持续秒数的 Buff 黑板键。' },
                },
              },
            ],
            optional: true,
            description: 'Buff 启用期间执行 trigger 生命周期动作的时间间隔。',
          },
          waitFirstTriggerInterval: {
            kind: 'boolean',
            optional: true,
            description: '是否等满一个触发间隔后再首次触发；为 false 时启用后的首次更新即可触发。',
          },
          maxTriggerCount: {
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
            optional: true,
            description: 'trigger 生命周期动作最多执行的次数；0 表示不触发，负数表示不限制次数。',
          },
          attributeModifiers: definitionSchemaPart_598035322a30cf7e,
          keywordEnhancements: definitionSchemaPart_8f021ae528e82f26,
          healModifiers: definitionSchemaPart_355b6a0fa82de5f1,
          poiseModifiers: definitionSchemaPart_79a547f12b220e64,
          shields: definitionSchemaPart_ed86128ce2e14542,
          sustainedProtection: {
            kind: 'object',
            fields: {
              target: {
                kind: 'enum',
                options: ['buffSource', 'owner'],
                description: '效果作用于 Buff 持有者还是来源。',
              },
              superArmor: {
                kind: 'union',
                variants: [
                  { kind: 'number' },
                  {
                    kind: 'object',
                    fields: {
                      blackboardKey: {
                        kind: 'string',
                        description: '读取持续秒数的 Buff 黑板键。',
                      },
                    },
                  },
                ],
                description: '霸体值。',
              },
              impactResistance: {
                kind: 'union',
                variants: [
                  { kind: 'number' },
                  {
                    kind: 'object',
                    fields: {
                      blackboardKey: {
                        kind: 'string',
                        description: '读取持续秒数的 Buff 黑板键。',
                      },
                    },
                  },
                ],
                description: '冲击抗性值。',
              },
            },
            optional: true,
            description: 'Buff 启用期间提供的霸体值和抗冲击值，可作用于持有者或 Buff 来源。',
          },
          role: definitionSchemaPart_c5617055abca6818,
          spellBurst: definitionSchemaPart_e5c24599909bd2cf,
          maxStackCount: {
            kind: 'union',
            variants: [
              { kind: 'number' },
              {
                kind: 'object',
                fields: {
                  blackboardKey: { kind: 'string', description: '读取最大层数的 Buff 黑板键。' },
                },
              },
            ],
            optional: true,
            description: '可在施加时从该 Buff 已合并的实例黑板解析。',
          },
          skillSlotReplacements: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                skillSlotKey: {
                  kind: 'string',
                  description: '要修改的原生技能槽，与技能库分组无关。',
                },
                targetSkillKey: { kind: 'string', description: 'Buff 启用期间换入的技能。' },
                revertedSkillKey: { kind: 'string', description: 'Buff 停用或结束时恢复的技能。' },
                inheritOriginSkillCooldownProgress: {
                  kind: 'boolean',
                  description: '已保留证据位；运行时尚未接入 true 的双向冷却进度复制。',
                },
              },
            },
            optional: true,
            description: '每次启用时换入、停用或结束时还原；生命周期归当前 Buff 实例所有。',
          },
          actionGraph: { kind: 'graph', optional: true },
          scheduledSequences: { kind: 'opaque', optional: true },
          lifecycleSequences: { kind: 'opaque', optional: true },
          abilityEventResponses: { kind: 'opaque', optional: true },
          igniteEventResponses: { kind: 'opaque', optional: true },
          damageModifiers: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                enabledSide: {
                  kind: 'enum',
                  options: ['defender', 'attacker'],
                  description: '修正安装在攻击方还是防御方时启用。',
                },
                condition: definitionSchemaPart_f9c92aded72ca8cc,
                processors: definitionSchemaPart_4a5a5441066de403,
                conditionProgram: { kind: 'opaque', optional: true },
              },
            },
            optional: true,
          },
        },
      },
      {
        kind: 'object',
        fields: {
          blackboard: {
            kind: 'record',
            value: {
              kind: 'union',
              variants: [{ kind: 'null' }, { kind: 'string' }, { kind: 'number' }],
            },
            optional: true,
            description:
              '每个 Buff 实例的初始黑板值；施加动作可以覆盖这些值，其他字段也可从中取数。',
          },
          affixSkillCastIdentity: {
            kind: 'enum',
            options: ['sourceSkillCast'],
            optional: true,
            description: '启用时记录创建该 Buff 的技能施放编号，供 SkillAffix 条件匹配同一次施放。',
          },
          presentation: definitionSchemaPart_0907a88302c1c530,
          childPresentations: definitionSchemaPart_6ab46a59cb9ce424,
          timeClock: {
            kind: 'enum',
            options: ['default', 'global', 'self'],
            optional: true,
            description: '计算持续时间和触发间隔所用的时钟；不填时随全局时间缩放。',
          },
          applyTags: {
            kind: 'array',
            element: { kind: 'string' },
            optional: true,
            description:
              'Buff 的分类标签；启用时同时挂到所属实体，并用于按标签查找、计数和结束 Buff。',
          },
          extendTags: {
            kind: 'array',
            element: { kind: 'string' },
            optional: true,
            description: 'Buff 到期但被延长逻辑暂时阻止结束时，临时挂到所属实体的标签。',
          },
          stackingType: {
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
            description: '再次施加同一叠加组的 Buff 时，决定新建实例、加层、刷新时长或拒绝施加。',
          },
          stackingKey: {
            kind: 'string',
            optional: true,
            description: 'Buff 所属的叠加组；不填时使用 Buff ID，同一组必须使用相同的叠加方式。',
          },
          priority: {
            kind: 'union',
            variants: [
              { kind: 'number' },
              {
                kind: 'object',
                fields: {
                  blackboardKey: { kind: 'string', description: '读取优先级的 Buff 黑板键。' },
                  negate: {
                    kind: 'boolean',
                    optional: true,
                    description: '是否对读到的数值取负。',
                  },
                },
              },
            ],
            optional: true,
            description: '高优先级模式的启用顺序，以及 Stack 满层时选择被替换实例的顺序。',
          },
          durationSeconds: {
            kind: 'union',
            variants: [
              { kind: 'number' },
              {
                kind: 'object',
                fields: {
                  blackboardKey: { kind: 'string', description: '读取持续秒数的 Buff 黑板键。' },
                },
              },
            ],
            optional: true,
            description:
              '普通 Buff 的持续秒数；不填表示无限持续。定时成长型 Buff 用它表示自动加层周期。',
          },
          addingCooldownSeconds: {
            kind: 'union',
            variants: [
              { kind: 'number' },
              {
                kind: 'object',
                fields: {
                  blackboardKey: { kind: 'string', description: '读取持续秒数的 Buff 黑板键。' },
                },
              },
            ],
            optional: true,
            description: '成功添加后在接收者上创建的同 ID 再次添加冷却；使用普通战斗时间计时。',
          },
          ignoreAddingCooldown: {
            kind: 'boolean',
            optional: true,
            description: '是否跳过已有添加冷却的拦截；成功添加后仍会创建新的添加冷却。',
          },
          triggerIntervalSeconds: {
            kind: 'union',
            variants: [
              { kind: 'number' },
              {
                kind: 'object',
                fields: {
                  blackboardKey: { kind: 'string', description: '读取持续秒数的 Buff 黑板键。' },
                },
              },
            ],
            optional: true,
            description: 'Buff 启用期间执行 trigger 生命周期动作的时间间隔。',
          },
          waitFirstTriggerInterval: {
            kind: 'boolean',
            optional: true,
            description: '是否等满一个触发间隔后再首次触发；为 false 时启用后的首次更新即可触发。',
          },
          maxTriggerCount: {
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
            optional: true,
            description: 'trigger 生命周期动作最多执行的次数；0 表示不触发，负数表示不限制次数。',
          },
          attributeModifiers: definitionSchemaPart_598035322a30cf7e,
          keywordEnhancements: definitionSchemaPart_8f021ae528e82f26,
          healModifiers: definitionSchemaPart_355b6a0fa82de5f1,
          poiseModifiers: definitionSchemaPart_79a547f12b220e64,
          shields: definitionSchemaPart_ed86128ce2e14542,
          sustainedProtection: {
            kind: 'object',
            fields: {
              target: {
                kind: 'enum',
                options: ['buffSource', 'owner'],
                description: '效果作用于 Buff 持有者还是来源。',
              },
              superArmor: {
                kind: 'union',
                variants: [
                  { kind: 'number' },
                  {
                    kind: 'object',
                    fields: {
                      blackboardKey: {
                        kind: 'string',
                        description: '读取持续秒数的 Buff 黑板键。',
                      },
                    },
                  },
                ],
                description: '霸体值。',
              },
              impactResistance: {
                kind: 'union',
                variants: [
                  { kind: 'number' },
                  {
                    kind: 'object',
                    fields: {
                      blackboardKey: {
                        kind: 'string',
                        description: '读取持续秒数的 Buff 黑板键。',
                      },
                    },
                  },
                ],
                description: '冲击抗性值。',
              },
            },
            optional: true,
            description: 'Buff 启用期间提供的霸体值和抗冲击值，可作用于持有者或 Buff 来源。',
          },
          role: definitionSchemaPart_c5617055abca6818,
          spellBurst: definitionSchemaPart_e5c24599909bd2cf,
          actionGraph: {
            kind: 'graph',
            description: '有动作入口的 Buff 保存自己的图；纯数值 Buff 可以省略。',
          },
          damageModifiers: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                enabledSide: {
                  kind: 'enum',
                  options: ['defender', 'attacker'],
                  description: '修正安装在攻击方还是防御方时启用。',
                },
                condition: definitionSchemaPart_f9c92aded72ca8cc,
                processors: definitionSchemaPart_4a5a5441066de403,
                conditionProgram: {
                  kind: 'opaque',
                  optional: true,
                  description:
                    '以动作序列的最终结果决定是否启用处理器；不能与 `condition` 同时填写。',
                },
              },
            },
            optional: true,
            description: 'Buff 启用期间参与伤害计算的条件和数值处理器。',
          },
          maxStackCount: {
            kind: 'union',
            variants: [
              { kind: 'number' },
              {
                kind: 'object',
                fields: {
                  blackboardKey: { kind: 'string', description: '读取最大层数的 Buff 黑板键。' },
                },
              },
            ],
            optional: true,
            description: '可在施加时从该 Buff 已合并的实例黑板解析。',
          },
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
                sequence: { kind: 'opaque', description: '到达起始帧时执行或启动的动作序列。' },
              },
            },
            optional: true,
            description: 'Buff 启用期间按实例局部时钟执行的相对帧时间线。',
          },
          lifecycleSequences: {
            kind: 'object',
            fields: {
              start: {
                kind: 'opaque',
                optional: true,
                description: 'Buff 第一次启用时执行一次，早于修正注册。',
              },
              enable: {
                kind: 'opaque',
                optional: true,
                description: 'Buff 每次由停用转为启用后执行，晚于修正注册。',
              },
              disable: {
                kind: 'opaque',
                optional: true,
                description: 'Buff 暂停生效、准备注销修正前执行。',
              },
              beforeEnhance: {
                kind: 'opaque',
                optional: true,
                description: '同组 Buff 即将增加强化层数前执行。',
              },
              trigger: {
                kind: 'opaque',
                optional: true,
                description: 'Buff 启用期间按触发间隔到点时执行。',
              },
              enhanceChanged: {
                kind: 'opaque',
                optional: true,
                description: 'Buff 叠层数发生变化时执行。',
              },
              afterEnhance: {
                kind: 'opaque',
                optional: true,
                description: '一次叠层流程完成后执行。',
              },
              finish: {
                kind: 'opaque',
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
                  description: '要监听的事件。',
                },
                priority: { kind: 'number', description: '同一事件有多项响应时的执行优先级。' },
                sequence: { kind: 'opaque', description: '事件触发后执行的动作序列。' },
              },
            },
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
                sequence: { kind: 'opaque', description: '点燃时执行的动作序列。' },
              },
            },
            optional: true,
            description: '每个实例独立持有的点燃响应；处理后是否结束由来源数据显式决定。',
          },
          skillSlotReplacements: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                skillSlotKey: {
                  kind: 'string',
                  description: '要修改的原生技能槽，与技能库分组无关。',
                },
                targetSkillKey: { kind: 'string', description: 'Buff 启用期间换入的技能。' },
                revertedSkillKey: { kind: 'string', description: 'Buff 停用或结束时恢复的技能。' },
                inheritOriginSkillCooldownProgress: {
                  kind: 'boolean',
                  description: '已保留证据位；运行时尚未接入 true 的双向冷却进度复制。',
                },
              },
            },
            optional: true,
            description: '每次启用时换入、停用或结束时还原；生命周期归当前 Buff 实例所有。',
          },
        },
      },
    ],
  },
  abilityEntity: {
    kind: 'object',
    fields: {
      bornTags: {
        kind: 'array',
        element: { kind: 'string' },
        optional: true,
        description:
          'AbilityEntityTemplateData.bornTags；实体创建时立即成为其 AbilitySystem 自身标签。',
      },
      blackboard: {
        kind: 'record',
        value: { kind: 'union', variants: [{ kind: 'string' }, { kind: 'number' }] },
        optional: true,
        description:
          'AbilitySystemData.entityBlackboard 的模板初值；生成动作的显式赋值可覆盖同名键。',
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
                        description: '生成实体时读取的实体黑板键。',
                      },
                      fallback: { kind: 'number', description: '黑板没有该键时使用的模板默认值。' },
                    },
                  },
                ],
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
              blackboardKey: { kind: 'string', description: '生成实体时读取的实体黑板键。' },
              fallback: { kind: 'number', description: '黑板没有该键时使用的模板默认值。' },
            },
          },
        ],
        optional: true,
        description: '正数时，同模板新实例会按原生 Group.Add 语义同步释放最早实例。',
      },
      childSkill: {
        kind: 'opaque',
        optional: true,
        description: '该模板只使用一个子技能时的简写定义。',
      },
      childSkills: {
        kind: 'record',
        value: { kind: 'opaque' },
        optional: true,
        description: '同一原生实体模板可由不同 Spawn 动作绑定不同子技能；键为原生技能 ID。',
      },
      passiveSkills: {
        kind: 'array',
        element: { kind: 'opaque' },
        optional: true,
        description: '能力实体启用期间安装的被动技能。',
      },
    },
  },
  abilityEntityChildSkill: {
    kind: 'object',
    fields: {
      actionGraph: { kind: 'graph', description: '子技能自己的节点和宏，不与能力实体模板合图。' },
      skillId: { kind: 'string', description: '子技能的原生 ID。' },
      nativeSkillType: {
        kind: 'enum',
        options: [
          'normalSkill',
          'comboSkill',
          'ultimateSkill',
          'dodge',
          'breakingAttack',
          'passiveSkill',
          'attack',
          'attachSkill',
          'extraActiveSkill',
        ],
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
              resource: {
                kind: 'enum',
                options: ['sp', 'ultimateEnergy'],
                description: '要消耗的战斗资源。',
              },
              value: {
                kind: 'union',
                variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
                description: '单个费用或按技能等级排列的费用。',
              },
              availabilityThreshold: {
                kind: 'union',
                variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
                description: 'ATB 可释放门槛，独立于实际 cost.value。',
              },
            },
            description: '这次施放消耗的资源及可用门槛。',
          },
        },
        description: '该技能自己的扣费和冷却设置。',
      },
      blackboard: {
        kind: 'record',
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
        },
        optional: true,
        description: '创建时按技能等级解析的动作黑板默认值。',
      },
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
            sequence: { kind: 'opaque', description: '到达起始帧时执行或启动的动作序列。' },
          },
        },
        description: '按技能局部帧安排的动作序列。',
      },
    },
  },
  abilityEntityPassiveSkill: {
    kind: 'object',
    fields: {
      actionGraph: { kind: 'graph', description: '原生被动 SkillData 自己的图。' },
      key: { kind: 'string', description: '被动技能在能力实体定义中的唯一名称。' },
      blackboard: {
        kind: 'record',
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
        },
        optional: true,
        description: '创建时按引用技能等级解析的初始黑板。',
      },
      enableSequence: { kind: 'opaque', description: '能力实体启用时执行一次的动作序列。' },
      abilityEventResponses: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            event: { kind: 'enum', options: ['addedBuff'], description: '要监听的事件。' },
            priority: { kind: 'number', description: '同一事件有多项响应时的执行优先级。' },
            sequence: { kind: 'opaque', description: '事件触发后执行的动作序列。' },
          },
        },
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
        optional: true,
        description: '角色基础被动跟随其所属原生技能组；养成附加被动不设置该字段。',
      },
      blackboard: {
        kind: 'record',
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
        },
        optional: true,
        description: '被动启用序列读取的初始黑板；数组按所属技能或当前养成等级解析。',
      },
      enableSequence: { kind: 'opaque', description: '原生被动 Skill.Enable 时执行的有序行为。' },
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
              description: '要监听的事件。',
            },
            priority: { kind: 'number', description: '同一事件有多项响应时的执行优先级。' },
            sequence: { kind: 'opaque', description: '事件触发后执行的动作序列。' },
          },
        },
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
                condition: { kind: 'condition', description: '增伤生效条件。' },
                values: {
                  kind: 'union',
                  variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
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
                skillKey: {
                  kind: 'string',
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
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
                skillKey: {
                  kind: 'string',
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
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
                skillKey: {
                  kind: 'string',
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
                resource: {
                  kind: 'enum',
                  options: ['sp', 'ultimateEnergy'],
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
                skillKey: {
                  kind: 'string',
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
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
                skillKey: {
                  kind: 'string',
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
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
                skillKey: {
                  kind: 'string',
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
                blackboardKey: { kind: 'string', description: '要修改的技能黑板键。' },
                operation: {
                  kind: 'enum',
                  options: ['assign', 'add', 'multiply'],
                  description: '对原值执行加算、乘算或直接赋值。',
                },
                value: {
                  kind: 'union',
                  variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
                  description: '单个数值或按养成等级排列的数值。',
                },
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
                  fields: {
                    kind: {
                      kind: 'enum',
                      options: ['deckAttributeCompare'],
                      description: '在构筑阶段比较两项干员四维。',
                    },
                    left: {
                      kind: 'enum',
                      options: ['strength', 'agility', 'intellect', 'will'],
                      description: '左侧属性。',
                    },
                    operator: {
                      kind: 'enum',
                      options: [
                        'equal',
                        'notEqual',
                        'greater',
                        'greaterOrEqual',
                        'less',
                        'lessOrEqual',
                      ],
                      description: '数值比较符。',
                    },
                    right: {
                      kind: 'enum',
                      options: ['strength', 'agility', 'intellect', 'will'],
                      description: '右侧属性。',
                    },
                  },
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
                operation: {
                  kind: 'enum',
                  options: ['assign', 'add', 'multiply'],
                  description: '对原值执行加算、乘算或直接赋值。',
                },
                value: {
                  kind: 'union',
                  variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
                  description: '单个数值或按养成等级排列的数值。',
                },
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
                skillKey: {
                  kind: 'string',
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
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
                skillKey: {
                  kind: 'string',
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
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
                skillKey: {
                  kind: 'string',
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
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
                skillKey: {
                  kind: 'string',
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
                frames: { kind: 'number', description: '增加的冷却帧数。' },
                condition: {
                  kind: 'object',
                  fields: {
                    kind: {
                      kind: 'enum',
                      options: ['deckAttributeCompare'],
                      description: '在构筑阶段比较两项干员四维。',
                    },
                    left: {
                      kind: 'enum',
                      options: ['strength', 'agility', 'intellect', 'will'],
                      description: '左侧属性。',
                    },
                    operator: {
                      kind: 'enum',
                      options: [
                        'equal',
                        'notEqual',
                        'greater',
                        'greaterOrEqual',
                        'less',
                        'lessOrEqual',
                      ],
                      description: '数值比较符。',
                    },
                    right: {
                      kind: 'enum',
                      options: ['strength', 'agility', 'intellect', 'will'],
                      description: '右侧属性。',
                    },
                  },
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
                  element: { kind: 'enum', options: ['strength', 'agility', 'intellect', 'will'] },
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
                  description: '要修改的基础面板属性。',
                },
                operation: {
                  kind: 'enum',
                  options: ['flat', 'percent'],
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
                reaction: {
                  kind: 'enum',
                  options: ['electrification', 'corrosion'],
                  description: '目标元素反应。',
                },
                seconds: {
                  kind: 'union',
                  variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
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
                reaction: {
                  kind: 'enum',
                  options: ['electrification', 'corrosion'],
                  description: '目标元素反应。',
                },
                value: {
                  kind: 'union',
                  variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
                  description: '单个加值或按养成等级排列的加值。',
                },
              },
            },
          ],
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
                      optional: true,
                      description: '只监听指定的技力来源。',
                    },
                    gainKind: {
                      kind: 'enum',
                      options: ['gain', 'refund'],
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
                    skillKey: { kind: 'string', description: '要匹配的执行技能。' },
                    scope: {
                      kind: 'enum',
                      options: ['team', 'operator'],
                      description: '检查当前干员还是全队来源。',
                    },
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
                      element: { kind: 'string' },
                      description: '任一匹配即可触发的 Buff ID。',
                    },
                  },
                },
              ],
              description: '要监听的事件及其筛选参数。',
            },
            blackboard: {
              kind: 'record',
              value: {
                kind: 'union',
                variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
              },
              optional: true,
              description: '监听器实例的原生常量黑板；数组按当前养成等级解析。',
            },
            sequence: { kind: 'opaque', description: '事件触发后执行的动作序列。' },
          },
        },
        optional: true,
        description: '启用后注册的战斗事件响应。',
      },
      initializationSequence: {
        kind: 'opaque',
        optional: true,
        description: '养成启用后直接安装的初始化行为；不是技能，也不进入可释放技能集合。',
      },
      attachedBuffs: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            buffId: { kind: 'string' },
            blackboardAssignments: {
              kind: 'record',
              value: {
                kind: 'union',
                variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
              },
              optional: true,
            },
          },
        },
        optional: true,
        description: '原生 CharMiscFeature 直接附着的 Buff；数值按这一天赋或潜能的等级解析。',
      },
      passiveSkills: {
        kind: 'array',
        element: { kind: 'opaque' },
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
      actionGraph: {
        kind: 'graph',
        optional: true,
        description: '当前武器词条或套装效果自己的程序图；不按原生 ID 跨对象共享。',
      },
      modifiers: definitionSchemaPart_f7d4b88afad9a3f2,
      eventHandlers: definitionSchemaPart_66170672031a6e9c,
      blackboard: {
        kind: 'record',
        value: {
          kind: 'union',
          variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
        },
        optional: true,
        description: '配装能力的初始黑板，按词条等级解析；初始化与全部事件响应共享同一实例。',
      },
      enableSequence: {
        kind: 'opaque',
        optional: true,
        description: '能力启用前执行一次；期间自身事件响应关闭，典型用途为原生普通启动 Buff。',
      },
      initializationSequence: {
        kind: 'opaque',
        optional: true,
        description: '能力启用后在帧 0 执行一次；Toggle 初次安装及固定构筑刷新程序使用此入口。',
      },
    },
  },
  gearTrait: {
    kind: 'object',
    fields: {
      key: { kind: 'string', description: '词条在该装备中的唯一名称。' },
      levelCount: { kind: 'number', description: '这条词条可以解析的精锻等级数量。' },
      modifiers: definitionSchemaPart_f7d4b88afad9a3f2,
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
                variants: [
                  {
                    kind: 'object',
                    fields: {
                      kind: {
                        kind: 'enum',
                        options: ['attribute'],
                        description: '修正种类判别值。',
                      },
                      attribute: {
                        kind: 'enum',
                        options: ['strength', 'agility', 'intellect', 'will', 'main', 'secondary'],
                        description: '要修改的属性。',
                      },
                      operation: {
                        kind: 'enum',
                        options: ['flat', 'percent'],
                        description: '`flat` 为固定加值，`percent` 为百分比加值。',
                      },
                      value: {
                        kind: 'union',
                        variants: [
                          { kind: 'number' },
                          { kind: 'array', element: { kind: 'number' } },
                        ],
                        description: '单个数值或按等级排列的数值。',
                      },
                    },
                  },
                  {
                    kind: 'object',
                    fields: {
                      kind: {
                        kind: 'enum',
                        options: ['panelStat'],
                        description: '修正种类判别值。',
                      },
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
                        description: '要修改的面板属性。',
                      },
                      value: {
                        kind: 'union',
                        variants: [
                          { kind: 'number' },
                          { kind: 'array', element: { kind: 'number' } },
                        ],
                        description: '单个数值或按等级排列的数值。',
                      },
                    },
                  },
                  definitionSchemaPart_86687ed84be6472b,
                  {
                    kind: 'object',
                    fields: {
                      kind: {
                        kind: 'enum',
                        options: ['damageScale'],
                        description: '修正种类判别值。',
                      },
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
                        description: '要修改的伤害倍率项。',
                      },
                      slot: {
                        kind: 'enum',
                        options: ['addition', 'baseAddition'],
                        optional: true,
                        description: '写入基础加算槽还是普通加算槽；旧数据省略时使用基础加算槽。',
                      },
                      value: {
                        kind: 'union',
                        variants: [
                          { kind: 'number' },
                          { kind: 'array', element: { kind: 'number' } },
                        ],
                        description: '单个倍率或按等级排列的倍率。',
                      },
                    },
                  },
                  {
                    kind: 'object',
                    fields: {
                      kind: {
                        kind: 'enum',
                        options: ['staticHealingIncrease'],
                        description: '修正种类判别值。',
                      },
                      target: {
                        kind: 'enum',
                        options: ['output', 'taken'],
                        description: '`output` 修改治疗输出，`taken` 修改受到的治疗。',
                      },
                      value: {
                        kind: 'union',
                        variants: [
                          { kind: 'number' },
                          { kind: 'array', element: { kind: 'number' } },
                        ],
                        description: '单个加成值或按等级排列的加成值。',
                      },
                    },
                  },
                  {
                    kind: 'object',
                    fields: {
                      kind: {
                        kind: 'enum',
                        options: ['skillCooldownMultiplier'],
                        description: '修正种类判别值。',
                      },
                      skillTypes: {
                        kind: 'union',
                        variants: [
                          {
                            kind: 'enum',
                            options: [
                              'comboSkill',
                              'plungingAttack',
                              'basicAttack',
                              'battleSkill',
                              'ultimate',
                              'finisher',
                              'dodge',
                            ],
                          },
                          {
                            kind: 'array',
                            element: {
                              kind: 'enum',
                              options: [
                                'comboSkill',
                                'plungingAttack',
                                'basicAttack',
                                'battleSkill',
                                'ultimate',
                                'finisher',
                                'dodge',
                              ],
                            },
                          },
                        ],
                        description: '此倍率覆盖的技能类型。',
                      },
                      value: {
                        kind: 'union',
                        variants: [
                          { kind: 'number' },
                          { kind: 'array', element: { kind: 'number' } },
                        ],
                        description: '冷却时长倍率；例如 `0.9` 表示原时长的 90%。',
                      },
                    },
                  },
                ],
                description: '用于显示的修正定义。',
              },
            },
          },
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['composite'],
                description: '使用预设的复合词条文字。',
              },
              composite: {
                kind: 'enum',
                options: [
                  'cryoAndElectricDamageIncrease',
                  'heatAndNatureDamageIncrease',
                  'allSkillDamageIncrease',
                  'allDamageReduction',
                  'spellDamageIncrease',
                ],
                description: '复合词条的类型。',
              },
              value: {
                kind: 'union',
                variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
                description: '显示的单个数值或各等级数值。',
              },
            },
          },
        ],
        description: '每条原生装备词条都有且只有一份 displayAttrModifiers 展示定义。',
      },
    },
  },
} as const satisfies DefinitionSchemaCatalog;
