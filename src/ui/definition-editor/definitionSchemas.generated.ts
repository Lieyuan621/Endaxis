/** 由 tools/editor/generateDefinitionSchemas.ts 从正式契约生成，请勿手改。 */
import type { DefinitionSchemaCatalog } from './fieldSchema';
const definitionSchemaPart_93f993916234c15f = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buildModifiers.ts:112:5'],
    },
    {
      kind: 'array',
      element: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/buildModifiers.ts:112:5'],
      },
      semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
      source: ['packages/game-data-contract/src/buildModifiers.ts:112:5'],
    },
  ],
  semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
  source: ['packages/game-data-contract/src/buildModifiers.ts:112:5'],
  description: '冷却时长倍率；例如 `0.9` 表示原时长的 90%。',
} as const;
const definitionSchemaPart_e4fed771775926a1 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/skills.ts:335:3'],
    },
    {
      kind: 'array',
      element: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/skills.ts:335:3'],
      },
      semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
      source: ['packages/game-data-contract/src/skills.ts:335:3'],
    },
  ],
  semantics: { type: 'LevelValues | undefined', aliases: ['LevelValues'], optional: true },
  source: ['packages/game-data-contract/src/skills.ts:335:3'],
  optional: true,
  description: '技能冷却帧数，可按技能等级变化。',
} as const;
const definitionSchemaPart_74ceba95c0fd01a6 = {
  type: '"crush" | "airborne" | "knockDown" | "fracture" | readonly ("crush" | "airborne" | "knockDown" | "fracture")[]',
  unionVariants: [
    {
      type: '"crush" | "airborne" | "knockDown" | "fracture"',
      unionVariants: [
        { type: '"crush"' },
        { type: '"airborne"' },
        { type: '"knockDown"' },
        { type: '"fracture"' },
      ],
    },
    {
      type: 'readonly ("crush" | "airborne" | "knockDown" | "fracture")[]',
      arrayElement: {
        type: '"crush" | "airborne" | "knockDown" | "fracture"',
        unionVariants: [
          { type: '"crush"' },
          { type: '"airborne"' },
          { type: '"knockDown"' },
          { type: '"fracture"' },
        ],
      },
    },
  ],
} as const;
const definitionSchemaPart_e908ef8870f5b916 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['enemyDefeated'],
      semantics: { type: '"enemyDefeated"' },
      source: ['packages/game-data-contract/src/actions.ts:1770:7'],
      description: '触发器种类判别值。',
    },
    scope: {
      kind: 'enum',
      options: ['team', 'operator'],
      semantics: {
        type: '"team" | "operator"',
        unionVariants: [{ type: '"team"' }, { type: '"operator"' }],
      },
      source: ['packages/game-data-contract/src/actions.ts:1772:7'],
      description: '检查当前干员还是全队来源。',
    },
  },
  semantics: { type: '{ kind: "enemyDefeated"; scope: "team" | "operator"; }' },
  source: ['packages/game-data-contract/src/actions.ts:1798:3'],
} as const;
const definitionSchemaPart_09c6b1502060c2a5 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['enemyDefeated'],
      semantics: { type: '"enemyDefeated"' },
      source: ['packages/game-data-contract/src/actions.ts:1770:7'],
      description: '触发器种类判别值。',
    },
    scope: {
      kind: 'enum',
      options: ['team', 'operator'],
      semantics: {
        type: '"team" | "operator"',
        unionVariants: [{ type: '"team"' }, { type: '"operator"' }],
      },
      source: ['packages/game-data-contract/src/actions.ts:1772:7'],
      description: '检查当前干员还是全队来源。',
    },
  },
  semantics: { type: '{ kind: "enemyDefeated"; scope: "team" | "operator"; }' },
  source: ['packages/game-data-contract/src/equipment.ts:109:9'],
} as const;
const definitionSchemaPart_c951359d881535e2 = {
  startFrame: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/skills.ts:262:3'],
    description: '可以提前接续的起始帧。',
  },
  endFrame: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/skills.ts:264:3'],
    description: '可以提前接续的结束帧。',
  },
  skillIds: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/skills.ts:266:3'],
    },
    semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
    source: ['packages/game-data-contract/src/skills.ts:266:3'],
    description: '此窗口允许请求的原生技能 ID。',
  },
} as const;
const definitionSchemaPart_59077461a34f2eb2 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['all'],
      semantics: { type: '"all"' },
      source: ['packages/game-data-contract/src/conditions.ts:641:7'],
      description: '所有子条件都成立时返回真。',
    },
    conditions: {
      kind: 'ref',
      ref: 'field_24786945eb90cb9c243d',
      semantics: {
        type: 'readonly CombatCondition[]',
        arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
      },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
      description: '需要同时成立的条件。',
    },
  },
  semantics: { type: '{ kind: "all"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_15ac83d48ab0e3f4 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['all'],
      semantics: { type: '"all"' },
      source: ['packages/game-data-contract/src/conditions.ts:641:7'],
      description: '所有子条件都成立时返回真。',
    },
    conditions: {
      kind: 'ref',
      ref: 'field_24786945eb90cb9c243d',
      semantics: {
        type: 'readonly CombatCondition[]',
        arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
      },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
      description: '需要同时成立的条件。',
    },
  },
  semantics: { type: '{ kind: "all"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_8a0bfc51dc8b8f9e = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['all'],
      semantics: { type: '"all"' },
      source: ['packages/game-data-contract/src/conditions.ts:641:7'],
      description: '所有子条件都成立时返回真。',
    },
    conditions: {
      kind: 'ref',
      ref: 'field_6c7fb35eae35fc749d01',
      semantics: {
        type: 'readonly CombatCondition[]',
        arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
      },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
      description: '需要同时成立的条件。',
    },
  },
  semantics: { type: '{ kind: "all"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_00d53040d647c62a = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['all'],
      semantics: { type: '"all"' },
      source: ['packages/game-data-contract/src/conditions.ts:641:7'],
      description: '所有子条件都成立时返回真。',
    },
    conditions: {
      kind: 'ref',
      ref: 'field_6c7fb35eae35fc749d01',
      semantics: {
        type: 'readonly CombatCondition[]',
        arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
      },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
      description: '需要同时成立的条件。',
    },
  },
  semantics: { type: '{ kind: "all"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_34d589533c5afe26 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['any'],
      semantics: { type: '"any"' },
      source: ['packages/game-data-contract/src/conditions.ts:647:7'],
      description: '任一子条件成立时返回真。',
    },
    conditions: {
      kind: 'ref',
      ref: 'field_4988e909d5bfdb6e29cf',
      semantics: {
        type: 'readonly CombatCondition[]',
        arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
      },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
      description: '只需其中一项成立的条件。',
    },
  },
  semantics: { type: '{ kind: "any"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_a655ba7eebb1b4f8 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['any'],
      semantics: { type: '"any"' },
      source: ['packages/game-data-contract/src/conditions.ts:647:7'],
      description: '任一子条件成立时返回真。',
    },
    conditions: {
      kind: 'ref',
      ref: 'field_d51f3dc9d48dd3217c4a',
      semantics: {
        type: 'readonly CombatCondition[]',
        arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
      },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
      description: '只需其中一项成立的条件。',
    },
  },
  semantics: { type: '{ kind: "any"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_2144add4edcc460a = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventProjectilePerfectDodgeCooldownEquals'],
      semantics: { type: '"eventProjectilePerfectDodgeCooldownEquals"' },
      source: ['packages/game-data-contract/src/conditions.ts:207:7'],
      description: '检查当前命中角色的投射物是否处于完美闪避冷却。',
    },
    value: {
      kind: 'boolean',
      semantics: { type: 'boolean' },
      source: ['packages/game-data-contract/src/conditions.ts:209:7'],
      description: '原生 CheckProjectileInPerfectDodgeCd.isInCd。',
    },
  },
  semantics: { type: '{ kind: "eventProjectilePerfectDodgeCooldownEquals"; value: boolean; }' },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_3adba4cbba1ce118 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventProjectilePerfectDodgeCooldownEquals'],
      semantics: { type: '"eventProjectilePerfectDodgeCooldownEquals"' },
      source: ['packages/game-data-contract/src/conditions.ts:207:7'],
      description: '检查当前命中角色的投射物是否处于完美闪避冷却。',
    },
    value: {
      kind: 'boolean',
      semantics: { type: 'boolean' },
      source: ['packages/game-data-contract/src/conditions.ts:209:7'],
      description: '原生 CheckProjectileInPerfectDodgeCd.isInCd。',
    },
  },
  semantics: { type: '{ kind: "eventProjectilePerfectDodgeCooldownEquals"; value: boolean; }' },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_4606fe329b8280af = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['targetStaggered'],
      semantics: { type: '"targetStaggered"' },
      source: ['packages/game-data-contract/src/conditions.ts:121:7'],
      description: '检查目标当前是否处于失衡状态。',
    },
    target: {
      kind: 'enum',
      options: ['enemy', 'caster'],
      semantics: {
        type: '"enemy" | "caster"',
        unionVariants: [{ type: '"enemy"' }, { type: '"caster"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:123:7'],
      description: '要检查的施法者或敌人。',
    },
  },
  semantics: { type: '{ kind: "targetStaggered"; target: "enemy" | "caster"; }' },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_9131f41f10748a74 = {
  kind: {
    kind: 'enum',
    options: ['eventCustomAbilityNameMatch'],
    semantics: { type: '"eventCustomAbilityNameMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:467:7'],
    description: '精确匹配当前 OnCustomAbilityEvent 的命名载荷。',
  },
  eventName: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:469:7'],
    description: '要匹配的自定义事件名称。',
  },
  outputKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:471:7'],
    optional: true,
    description: '名称匹配后把事件 float 参数写入当前动作黑板；对应原生 savedParamKey。',
  },
} as const;
const definitionSchemaPart_db5f54ae2a57eb4c = {
  startFrame: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/actions.ts:1643:3'],
    description: '相对宿主开始时刻的起始帧。',
  },
  endFrame: {
    kind: 'number',
    semantics: { type: 'number | undefined', optional: true },
    source: ['packages/game-data-contract/src/actions.ts:1645:3'],
    optional: true,
    description: '仅有状态动作需要；到达该帧时对已经开始的序列调用结束生命周期。',
  },
  sequence: {
    kind: 'opaque',
    fallback: { reason: 'graph-reference-boundary' },
    semantics: { type: 'ActionGraphReference', aliases: ['ActionGraphReference'] },
    source: ['packages/game-data-contract/src/actions.ts:1647:3'],
    description: '到达起始帧时执行或启动的动作序列。',
  },
} as const;
const definitionSchemaPart_23e37562453e9c52 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventProjectilePerfectDodgeCooldownEquals'],
      semantics: { type: '"eventProjectilePerfectDodgeCooldownEquals"' },
      source: ['packages/game-data-contract/src/conditions.ts:207:7'],
      description: '检查当前命中角色的投射物是否处于完美闪避冷却。',
    },
    value: {
      kind: 'boolean',
      semantics: { type: 'boolean' },
      source: ['packages/game-data-contract/src/conditions.ts:209:7'],
      description: '原生 CheckProjectileInPerfectDodgeCd.isInCd。',
    },
  },
  semantics: { type: '{ kind: "eventProjectilePerfectDodgeCooldownEquals"; value: boolean; }' },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_e21c32779f30aa39 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventProjectilePerfectDodgeCooldownEquals'],
      semantics: { type: '"eventProjectilePerfectDodgeCooldownEquals"' },
      source: ['packages/game-data-contract/src/conditions.ts:207:7'],
      description: '检查当前命中角色的投射物是否处于完美闪避冷却。',
    },
    value: {
      kind: 'boolean',
      semantics: { type: 'boolean' },
      source: ['packages/game-data-contract/src/conditions.ts:209:7'],
      description: '原生 CheckProjectileInPerfectDodgeCd.isInCd。',
    },
  },
  semantics: { type: '{ kind: "eventProjectilePerfectDodgeCooldownEquals"; value: boolean; }' },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_972a5b6255cda3b8 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventProjectilePerfectDodgeCooldownEquals'],
      semantics: { type: '"eventProjectilePerfectDodgeCooldownEquals"' },
      source: ['packages/game-data-contract/src/conditions.ts:207:7'],
      description: '检查当前命中角色的投射物是否处于完美闪避冷却。',
    },
    value: {
      kind: 'boolean',
      semantics: { type: 'boolean' },
      source: ['packages/game-data-contract/src/conditions.ts:209:7'],
      description: '原生 CheckProjectileInPerfectDodgeCd.isInCd。',
    },
  },
  semantics: { type: '{ kind: "eventProjectilePerfectDodgeCooldownEquals"; value: boolean; }' },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_b69299d0c5a3f9f2 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['targetStaggered'],
      semantics: { type: '"targetStaggered"' },
      source: ['packages/game-data-contract/src/conditions.ts:121:7'],
      description: '检查目标当前是否处于失衡状态。',
    },
    target: {
      kind: 'enum',
      options: ['enemy', 'caster'],
      semantics: {
        type: '"enemy" | "caster"',
        unionVariants: [{ type: '"enemy"' }, { type: '"caster"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:123:7'],
      description: '要检查的施法者或敌人。',
    },
  },
  semantics: { type: '{ kind: "targetStaggered"; target: "enemy" | "caster"; }' },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_17a4638d4c7b1720 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['targetStaggered'],
      semantics: { type: '"targetStaggered"' },
      source: ['packages/game-data-contract/src/conditions.ts:121:7'],
      description: '检查目标当前是否处于失衡状态。',
    },
    target: {
      kind: 'enum',
      options: ['enemy', 'caster'],
      semantics: {
        type: '"enemy" | "caster"',
        unionVariants: [{ type: '"enemy"' }, { type: '"caster"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:123:7'],
      description: '要检查的施法者或敌人。',
    },
  },
  semantics: { type: '{ kind: "targetStaggered"; target: "enemy" | "caster"; }' },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_647ddee0655d2d96 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['targetStaggered'],
      semantics: { type: '"targetStaggered"' },
      source: ['packages/game-data-contract/src/conditions.ts:121:7'],
      description: '检查目标当前是否处于失衡状态。',
    },
    target: {
      kind: 'enum',
      options: ['enemy', 'caster'],
      semantics: {
        type: '"enemy" | "caster"',
        unionVariants: [{ type: '"enemy"' }, { type: '"caster"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:123:7'],
      description: '要检查的施法者或敌人。',
    },
  },
  semantics: { type: '{ kind: "targetStaggered"; target: "enemy" | "caster"; }' },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_19039635b239e2a4 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['targetStaggered'],
      semantics: { type: '"targetStaggered"' },
      source: ['packages/game-data-contract/src/conditions.ts:121:7'],
      description: '检查目标当前是否处于失衡状态。',
    },
    target: {
      kind: 'enum',
      options: ['enemy', 'caster'],
      semantics: {
        type: '"enemy" | "caster"',
        unionVariants: [{ type: '"enemy"' }, { type: '"caster"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:123:7'],
      description: '要检查的施法者或敌人。',
    },
  },
  semantics: { type: '{ kind: "targetStaggered"; target: "enemy" | "caster"; }' },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_673c4dabf5d02e53 = {
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
  semantics: {
    type: '"canBreakWeakness" | "crush" | "airborne" | "knockDown" | "shatter" | "dot" | "remainArea" | "talentDamage" | "physicalInfliction"',
    unionVariants: [
      { type: '"canBreakWeakness"' },
      { type: '"crush"' },
      { type: '"airborne"' },
      { type: '"knockDown"' },
      { type: '"shatter"' },
      { type: '"dot"' },
      { type: '"remainArea"' },
      { type: '"talentDamage"' },
      { type: '"physicalInfliction"' },
    ],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:149:7'],
} as const;
const definitionSchemaPart_254e7077895346b4 = {
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
  semantics: {
    type: '"canBreakWeakness" | "crush" | "airborne" | "knockDown" | "shatter" | "dot" | "remainArea" | "talentDamage" | "physicalInfliction"',
    unionVariants: [
      { type: '"canBreakWeakness"' },
      { type: '"crush"' },
      { type: '"airborne"' },
      { type: '"knockDown"' },
      { type: '"shatter"' },
      { type: '"dot"' },
      { type: '"remainArea"' },
      { type: '"talentDamage"' },
      { type: '"physicalInfliction"' },
    ],
  },
  source: ['packages/game-data-contract/src/conditions.ts:435:7'],
} as const;
const definitionSchemaPart_b43cf586ac1df6ca = {
  kind: 'enum',
  options: [
    'cryoAndElectricDamageIncrease',
    'heatAndNatureDamageIncrease',
    'allSkillDamageIncrease',
    'allDamageReduction',
    'spellDamageIncrease',
  ],
  semantics: {
    type: '"cryoAndElectricDamageIncrease" | "heatAndNatureDamageIncrease" | "allSkillDamageIncrease" | "allDamageReduction" | "spellDamageIncrease"',
    unionVariants: [
      { type: '"cryoAndElectricDamageIncrease"' },
      { type: '"heatAndNatureDamageIncrease"' },
      { type: '"allSkillDamageIncrease"' },
      { type: '"allDamageReduction"' },
      { type: '"spellDamageIncrease"' },
    ],
  },
  source: ['packages/game-data-contract/src/equipment.ts:64:7'],
  description: '复合词条的类型。',
} as const;
const definitionSchemaPart_e7879278d07d8266 = {
  type: '"invalid" | "character" | "enemy" | "interactive" | "projectile" | "factoryRegion" | "npc" | "abilityEntity" | "cinematicEntity" | "remoteFactoryEntity" | "creature" | "godEntity" | "enemyPart" | "socialBuilding"',
  unionVariants: [
    { type: '"invalid"' },
    { type: '"character"' },
    { type: '"enemy"' },
    { type: '"interactive"' },
    { type: '"projectile"' },
    { type: '"factoryRegion"' },
    { type: '"npc"' },
    { type: '"abilityEntity"' },
    { type: '"cinematicEntity"' },
    { type: '"remoteFactoryEntity"' },
    { type: '"creature"' },
    { type: '"godEntity"' },
    { type: '"enemyPart"' },
    { type: '"socialBuilding"' },
  ],
} as const;
const definitionSchemaPart_88c4e8938bd462dc = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:343:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:264:7'],
          description: '读取持续秒数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:343:3'],
    },
  ],
  semantics: {
    type: 'BuffDuration',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:343:3'],
  description: '霸体值。',
} as const;
const definitionSchemaPart_16a55f9383feadb8 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:345:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:264:7'],
          description: '读取持续秒数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:345:3'],
    },
  ],
  semantics: {
    type: 'BuffDuration',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:345:3'],
  description: '冲击抗性值。',
} as const;
const definitionSchemaPart_c849d2a9ab3aec48 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:313:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:264:7'],
          description: '读取持续秒数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:313:3'],
    },
  ],
  semantics: {
    type: 'BuffDuration',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:313:3'],
  description: '属性值的乘数。',
} as const;
const definitionSchemaPart_cba6850ee91f973f = {
  type: '"unlimited" | "stack" | "highPriority" | "enhance" | "refresh" | "extend" | "modify" | "unique" | "enhanceAndRefresh" | "overwriteDuration" | "enhanceAndOverwriteDuration" | "highPriorityWithMaxStack" | "timedGrowingEnhance"',
  unionVariants: [
    { type: '"unlimited"' },
    { type: '"stack"' },
    { type: '"highPriority"' },
    { type: '"enhance"' },
    { type: '"refresh"' },
    { type: '"extend"' },
    { type: '"modify"' },
    { type: '"unique"' },
    { type: '"enhanceAndRefresh"' },
    { type: '"overwriteDuration"' },
    { type: '"enhanceAndOverwriteDuration"' },
    { type: '"highPriorityWithMaxStack"' },
    { type: '"timedGrowingEnhance"' },
  ],
} as const;
const definitionSchemaPart_d4d8546905123255 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:315:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:264:7'],
          description: '读取持续秒数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:315:3'],
    },
  ],
  semantics: {
    type: 'BuffDuration',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:315:3'],
  description: '乘算后再加入的固定值。',
} as const;
const definitionSchemaPart_2952333b1a530d8d = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:301:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:264:7'],
          description: '读取持续秒数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:301:3'],
    },
  ],
  semantics: {
    type: 'BuffDuration',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:301:3'],
  description: '本次伤害由护盾吸收的比例。',
} as const;
const definitionSchemaPart_8b65129dfae5d330 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:303:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:264:7'],
          description: '读取持续秒数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:303:3'],
    },
  ],
  semantics: {
    type: 'BuffDuration',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:303:3'],
  description: '吸收伤害时消耗护盾值的倍率。',
} as const;
const definitionSchemaPart_ed95cd4bd8b19f3c = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['id'],
      semantics: { type: '"id"' },
      source: ['packages/game-data-contract/src/conditions.ts:178:13'],
      description: '按 Buff ID 查找。',
    },
    buffIds: {
      kind: 'array',
      element: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/conditions.ts:180:13'],
      },
      semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
      source: ['packages/game-data-contract/src/conditions.ts:180:13'],
      description: '任一匹配即可选中的 Buff ID。',
    },
  },
  semantics: { type: '{ kind: "id"; buffIds: readonly string[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:175:7'],
} as const;
const definitionSchemaPart_315a387ccb37e437 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:424:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:264:7'],
          description: '读取持续秒数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:424:3'],
    },
  ],
  semantics: {
    type: 'BuffDuration',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:424:3'],
  description: '尚未触发强化时的关键词初始值。',
} as const;
const definitionSchemaPart_ce3d2f408e40ea53 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:426:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:264:7'],
          description: '读取持续秒数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:426:3'],
    },
  ],
  semantics: {
    type: 'BuffDuration',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:426:3'],
  description: '每次触发时写入或参与运算的值。',
} as const;
const definitionSchemaPart_4339358ad9197c59 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:327:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:272:7'],
          description: '读取触发次数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:327:3'],
    },
  ],
  semantics: {
    type: 'BuffTriggerCount',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:327:3'],
  description: '护盾最多可以吸收的命中次数。',
} as const;
const definitionSchemaPart_7bc1a7f48cadb9c8 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventSourceTargetMatch'],
      semantics: { type: '"eventSourceTargetMatch"' },
      source: ['packages/game-data-contract/src/conditions.ts:569:7'],
      description: '比较治疗事件的来源与目标身份。',
    },
    operator: {
      kind: 'enum',
      options: ['equal', 'notEqual'],
      semantics: {
        type: '"equal" | "notEqual"',
        unionVariants: [{ type: '"equal"' }, { type: '"notEqual"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:571:7'],
      description: '判断事件来源与目标相同或不同。',
    },
  },
  semantics: { type: '{ kind: "eventSourceTargetMatch"; operator: "equal" | "notEqual"; }' },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_ccf294bd5b60115f = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventSourceTargetMatch'],
      semantics: { type: '"eventSourceTargetMatch"' },
      source: ['packages/game-data-contract/src/conditions.ts:569:7'],
      description: '比较治疗事件的来源与目标身份。',
    },
    operator: {
      kind: 'enum',
      options: ['equal', 'notEqual'],
      semantics: {
        type: '"equal" | "notEqual"',
        unionVariants: [{ type: '"equal"' }, { type: '"notEqual"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:571:7'],
      description: '判断事件来源与目标相同或不同。',
    },
  },
  semantics: { type: '{ kind: "eventSourceTargetMatch"; operator: "equal" | "notEqual"; }' },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_6b0f25522f2c2aa4 = {
  type: '"attackPercent" | "criticalRate" | "artsIntensity" | "attackFlat" | "healthFlat" | "healthPercent" | "defenseFlat" | "defensePercent" | "criticalDamage" | "ultimateEnergyGainEfficiency" | "skillCooldownReduction" | "staggerDamagePercent"',
  unionVariants: [
    { type: '"attackPercent"' },
    { type: '"criticalRate"' },
    { type: '"artsIntensity"' },
    { type: '"attackFlat"' },
    { type: '"healthFlat"' },
    { type: '"healthPercent"' },
    { type: '"defenseFlat"' },
    { type: '"defensePercent"' },
    { type: '"criticalDamage"' },
    { type: '"ultimateEnergyGainEfficiency"' },
    { type: '"skillCooldownReduction"' },
    { type: '"staggerDamagePercent"' },
  ],
} as const;
const definitionSchemaPart_75a6edab28565d2b = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventSourceTargetMatch'],
      semantics: { type: '"eventSourceTargetMatch"' },
      source: ['packages/game-data-contract/src/conditions.ts:569:7'],
      description: '比较治疗事件的来源与目标身份。',
    },
    operator: {
      kind: 'enum',
      options: ['equal', 'notEqual'],
      semantics: {
        type: '"equal" | "notEqual"',
        unionVariants: [{ type: '"equal"' }, { type: '"notEqual"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:571:7'],
      description: '判断事件来源与目标相同或不同。',
    },
  },
  semantics: { type: '{ kind: "eventSourceTargetMatch"; operator: "equal" | "notEqual"; }' },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_c4439a31d39c3d8c = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventSourceTargetMatch'],
      semantics: { type: '"eventSourceTargetMatch"' },
      source: ['packages/game-data-contract/src/conditions.ts:569:7'],
      description: '比较治疗事件的来源与目标身份。',
    },
    operator: {
      kind: 'enum',
      options: ['equal', 'notEqual'],
      semantics: {
        type: '"equal" | "notEqual"',
        unionVariants: [{ type: '"equal"' }, { type: '"notEqual"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:571:7'],
      description: '判断事件来源与目标相同或不同。',
    },
  },
  semantics: { type: '{ kind: "eventSourceTargetMatch"; operator: "equal" | "notEqual"; }' },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_61d0446690c1da8f = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventSourceTargetMatch'],
      semantics: { type: '"eventSourceTargetMatch"' },
      source: ['packages/game-data-contract/src/conditions.ts:569:7'],
      description: '比较治疗事件的来源与目标身份。',
    },
    operator: {
      kind: 'enum',
      options: ['equal', 'notEqual'],
      semantics: {
        type: '"equal" | "notEqual"',
        unionVariants: [{ type: '"equal"' }, { type: '"notEqual"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:571:7'],
      description: '判断事件来源与目标相同或不同。',
    },
  },
  semantics: { type: '{ kind: "eventSourceTargetMatch"; operator: "equal" | "notEqual"; }' },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_bbc8b9908a6cf331 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:307:7'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:288:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:307:7'],
    },
  ],
  semantics: {
    type: 'HealModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:307:7'],
  description: '左操作数。',
} as const;
const definitionSchemaPart_93707cb7e46faf81 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:311:7'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:288:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:311:7'],
    },
  ],
  semantics: {
    type: 'HealModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:311:7'],
  description: '右操作数。',
} as const;
const definitionSchemaPart_98f68c65ee110b4d = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:194:7'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:103:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:194:7'],
    },
  ],
  semantics: {
    type: 'DamageModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:194:7'],
  description: '左操作数。',
} as const;
const definitionSchemaPart_519d43b34132a9e4 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:198:7'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:103:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:198:7'],
    },
  ],
  semantics: {
    type: 'DamageModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:198:7'],
  description: '右操作数。',
} as const;
const definitionSchemaPart_9a1a70968acdf8fc = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:261:9'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:103:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:261:9'],
    },
  ],
  semantics: {
    type: 'DamageModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:261:9'],
  description: '写入该槽的值。',
} as const;
const definitionSchemaPart_074f251b28a753b2 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:243:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:103:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:243:3'],
    },
  ],
  semantics: {
    type: 'DamageModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:243:3'],
  description: '加入该区间的数值。',
} as const;
const definitionSchemaPart_d18c11d49c3b7694 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:133:7'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:103:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:133:7'],
    },
  ],
  semantics: {
    type: 'DamageModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:133:7'],
  description: '与实例总数比较的值。',
} as const;
const definitionSchemaPart_e7026ddb9b766fd8 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:167:7'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:103:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:167:7'],
    },
  ],
  semantics: {
    type: 'DamageModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:167:7'],
  description: '与目标生命比较的值。',
} as const;
const definitionSchemaPart_560c1bf5cf42f5f1 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:301:7'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:288:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:301:7'],
    },
  ],
  semantics: {
    type: 'HealModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:301:7'],
  description: '与生命值或比例比较的值。',
} as const;
const definitionSchemaPart_b7033a0a6e64c4d0 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:329:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:288:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:329:3'],
    },
  ],
  semantics: {
    type: 'HealModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:329:3'],
  description: '每次乘算使用的基础倍率。',
} as const;
const definitionSchemaPart_97202ce97abb0e79 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:331:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:288:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:331:3'],
    },
  ],
  semantics: {
    type: 'HealModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:331:3'],
  description: '重复应用基础倍率的次数。',
} as const;
const definitionSchemaPart_7231589865d6f2d0 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:403:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:369:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:403:3'],
    },
  ],
  semantics: {
    type: 'PoiseModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:403:3'],
  description: '加入对应倍率区的数值。',
} as const;
const definitionSchemaPart_bfaab7ed3a6735e6 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:179:7'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:103:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:179:7'],
    },
  ],
  semantics: {
    type: 'DamageModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:179:7'],
  description: '与目标失衡值比较的值。',
} as const;
const definitionSchemaPart_ccca3aa8d229e4dd = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/modifiers.ts:343:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/modifiers.ts:288:7'],
          description: '读取数值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:343:3'],
    },
  ],
  semantics: {
    type: 'HealModifierNumber',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:343:3'],
  description: '加入对应治疗加成区的数值。',
} as const;
const definitionSchemaPart_7ae32de862436768 = {
  skillSlotKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/buffs.ts:125:3'],
    description: '要修改的原生技能槽，与技能库分组无关。',
  },
  targetSkillKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/buffs.ts:127:3'],
    description: 'Buff 启用期间换入的技能。',
  },
  revertedSkillKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/buffs.ts:129:3'],
    description: 'Buff 停用或结束时恢复的技能。',
  },
  inheritOriginSkillCooldownProgress: {
    kind: 'boolean',
    semantics: { type: 'boolean' },
    source: ['packages/game-data-contract/src/buffs.ts:131:3'],
    description: '已保留证据位；运行时尚未接入 true 的双向冷却进度复制。',
  },
} as const;
const definitionSchemaPart_f99f134f4dce0caa = {
  kind: 'ref',
  ref: 'field_501dfc83bb24b1942d68',
  semantics: {
    type: 'readonly PoiseModifierCondition[]',
    arrayElement: {
      type: 'PoiseModifierCondition',
      unionVariants: [
        { type: '{ readonly kind: "casterControlled"; }' },
        {
          type: '{ readonly kind: "eventDamageTagsMatch"; readonly match: "hasAny" | "hasAll"; readonly tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | "comboSkill" | ... 10 more ... | "natureAbnormal")[]; }',
        },
        {
          type: '{ readonly kind: "all"; readonly conditions: readonly PoiseModifierCondition[]; }',
        },
      ],
    },
  },
  source: ['packages/game-data-contract/src/modifiers.ts:391:7'],
  description: '需要同时成立的条件。',
} as const;
const definitionSchemaPart_b837dd8537ab8594 = {
  type: '"physical" | "heat" | "cryo" | "electric" | "nature" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]',
  unionVariants: [
    {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
      ],
    },
    {
      type: 'readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]',
      arrayElement: {
        type: '"physical" | "heat" | "cryo" | "electric" | "nature"',
        unionVariants: [
          { type: '"physical"' },
          { type: '"heat"' },
          { type: '"cryo"' },
          { type: '"electric"' },
          { type: '"nature"' },
        ],
      },
    },
  ],
} as const;
const definitionSchemaPart_fa0a13cdc00e31b4 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['operatorHealed'],
      semantics: { type: '"operatorHealed"' },
      source: ['packages/game-data-contract/src/actions.ts:1693:7'],
      description: '触发器种类判别值。',
    },
    role: {
      kind: 'enum',
      options: ['source', 'target'],
      semantics: {
        type: '"source" | "target" | undefined',
        optional: true,
        unionVariants: [{ type: '"source"' }, { type: '"target"' }],
      },
      source: ['packages/game-data-contract/src/actions.ts:1695:7'],
      optional: true,
      description: '只监听治疗来源或受治疗者；省略时两者都可触发。',
    },
  },
  semantics: { type: '{ kind: "operatorHealed"; role?: "source" | "target" | undefined; }' },
  source: ['packages/game-data-contract/src/actions.ts:1798:3'],
} as const;
const definitionSchemaPart_0d9bd98aea23294d = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['operatorHealed'],
      semantics: { type: '"operatorHealed"' },
      source: ['packages/game-data-contract/src/actions.ts:1693:7'],
      description: '触发器种类判别值。',
    },
    role: {
      kind: 'enum',
      options: ['source', 'target'],
      semantics: {
        type: '"source" | "target" | undefined',
        optional: true,
        unionVariants: [{ type: '"source"' }, { type: '"target"' }],
      },
      source: ['packages/game-data-contract/src/actions.ts:1695:7'],
      optional: true,
      description: '只监听治疗来源或受治疗者；省略时两者都可触发。',
    },
  },
  semantics: { type: '{ kind: "operatorHealed"; role?: "source" | "target" | undefined; }' },
  source: ['packages/game-data-contract/src/equipment.ts:109:9'],
} as const;
const definitionSchemaPart_9b8fac2e52673b99 = {
  type: 'HealModifierCondition | undefined',
  optional: true,
  unionVariants: [
    {
      type: '{ readonly kind: "targetHealthCompare"; readonly valueType: "current" | "ratio"; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: HealModifierNumber; }',
    },
    {
      type: '{ readonly kind: "buffBlackboardCompare"; readonly left: HealModifierNumber; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly right: HealModifierNumber; }',
    },
    {
      type: '{ readonly kind: "healTagsMatch"; readonly match: "hasAny" | "hasAll"; readonly tags: readonly string[]; }',
    },
  ],
} as const;
const definitionSchemaPart_e700051f705fef8b = {
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
  semantics: {
    type: '"addition" | "multiplier" | "finalAddition" | "finalMultiplier" | "baseAddition" | "baseMultiplier" | "baseFinalAddition" | "baseFinalMultiplier"',
    unionVariants: [
      { type: '"addition"' },
      { type: '"multiplier"' },
      { type: '"finalAddition"' },
      { type: '"finalMultiplier"' },
      { type: '"baseAddition"' },
      { type: '"baseMultiplier"' },
      { type: '"baseFinalAddition"' },
      { type: '"baseFinalMultiplier"' },
    ],
  },
  source: ['packages/game-data-contract/src/buffs.ts:616:3'],
  description: '要写入的原生属性公式槽。',
} as const;
const definitionSchemaPart_4c35aa9db4035582 = {
  kind: 'array',
  element: {
    kind: 'enum',
    options: ['heat', 'cryo', 'electric', 'nature'],
    semantics: {
      type: '"heat" | "cryo" | "electric" | "nature"',
      unionVariants: [
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:447:7'],
  },
  semantics: {
    type: 'readonly ("heat" | "cryo" | "electric" | "nature")[]',
    arrayElement: {
      type: '"heat" | "cryo" | "electric" | "nature"',
      unionVariants: [
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/conditions.ts:447:7'],
  description: '任一匹配即可成立的元素附着类型。',
} as const;
const definitionSchemaPart_248535706813b39d = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventActionOwnerTargetMatch'],
      semantics: { type: '"eventActionOwnerTargetMatch"' },
      source: ['packages/game-data-contract/src/conditions.ts:575:7'],
      description: '比较当前动作宿主与事件目标，不把宿主身份猜成事件来源。',
    },
    operator: {
      kind: 'enum',
      options: ['equal', 'notEqual'],
      semantics: {
        type: '"equal" | "notEqual"',
        unionVariants: [{ type: '"equal"' }, { type: '"notEqual"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:577:7'],
      description: '判断动作宿主与事件目标相同或不同。',
    },
  },
  semantics: { type: '{ kind: "eventActionOwnerTargetMatch"; operator: "equal" | "notEqual"; }' },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_4ea8f5421314390a = {
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
  semantics: {
    type: '"addition" | "multiplier" | "finalAddition" | "finalMultiplier" | "baseAddition" | "baseMultiplier" | "baseFinalAddition" | "baseFinalMultiplier"',
    unionVariants: [
      { type: '"addition"' },
      { type: '"multiplier"' },
      { type: '"finalAddition"' },
      { type: '"finalMultiplier"' },
      { type: '"baseAddition"' },
      { type: '"baseMultiplier"' },
      { type: '"baseFinalAddition"' },
      { type: '"baseFinalMultiplier"' },
    ],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:259:9'],
  description: '要写入的单个公式槽。',
} as const;
const definitionSchemaPart_9b91a40d0e978282 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventActionOwnerTargetMatch'],
      semantics: { type: '"eventActionOwnerTargetMatch"' },
      source: ['packages/game-data-contract/src/conditions.ts:575:7'],
      description: '比较当前动作宿主与事件目标，不把宿主身份猜成事件来源。',
    },
    operator: {
      kind: 'enum',
      options: ['equal', 'notEqual'],
      semantics: {
        type: '"equal" | "notEqual"',
        unionVariants: [{ type: '"equal"' }, { type: '"notEqual"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:577:7'],
      description: '判断动作宿主与事件目标相同或不同。',
    },
  },
  semantics: { type: '{ kind: "eventActionOwnerTargetMatch"; operator: "equal" | "notEqual"; }' },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_1f8929e2584cbdcf = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:618:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:622:9'],
          description: '读取修正值的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:618:3'],
    },
  ],
  semantics: {
    type: 'number | { readonly blackboardKey: string; }',
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:618:3'],
  description: '固定修正值或从 Buff 黑板读取的值。',
} as const;
const definitionSchemaPart_4248cca6ba943864 = {
  kind: {
    kind: 'enum',
    options: ['globalCooldownPresent'],
    semantics: { type: '"globalCooldownPresent"' },
    source: ['packages/game-data-contract/src/conditions.ts:383:7'],
    description: '查询角色的战斗级冷却；与能力系统上的同名普通标记相互隔离。',
  },
  target: {
    kind: 'enum',
    options: ['caster', 'buffOwner', 'buffSource'],
    semantics: {
      type: '"caster" | "buffOwner" | "buffSource"',
      unionVariants: [{ type: '"caster"' }, { type: '"buffOwner"' }, { type: '"buffSource"' }],
    },
    source: ['packages/game-data-contract/src/conditions.ts:385:7'],
    description: '全局冷却所属对象。',
  },
  markerId: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:387:7'],
    description: '全局冷却标记 ID。',
  },
} as const;
const definitionSchemaPart_a5af4620ec4d25f9 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventActionOwnerTargetMatch'],
      semantics: { type: '"eventActionOwnerTargetMatch"' },
      source: ['packages/game-data-contract/src/conditions.ts:575:7'],
      description: '比较当前动作宿主与事件目标，不把宿主身份猜成事件来源。',
    },
    operator: {
      kind: 'enum',
      options: ['equal', 'notEqual'],
      semantics: {
        type: '"equal" | "notEqual"',
        unionVariants: [{ type: '"equal"' }, { type: '"notEqual"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:577:7'],
      description: '判断动作宿主与事件目标相同或不同。',
    },
  },
  semantics: { type: '{ kind: "eventActionOwnerTargetMatch"; operator: "equal" | "notEqual"; }' },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_d0d3d3764920669a = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventActionOwnerTargetMatch'],
      semantics: { type: '"eventActionOwnerTargetMatch"' },
      source: ['packages/game-data-contract/src/conditions.ts:575:7'],
      description: '比较当前动作宿主与事件目标，不把宿主身份猜成事件来源。',
    },
    operator: {
      kind: 'enum',
      options: ['equal', 'notEqual'],
      semantics: {
        type: '"equal" | "notEqual"',
        unionVariants: [{ type: '"equal"' }, { type: '"notEqual"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:577:7'],
      description: '判断动作宿主与事件目标相同或不同。',
    },
  },
  semantics: { type: '{ kind: "eventActionOwnerTargetMatch"; operator: "equal" | "notEqual"; }' },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_9e3dc0650cb7819e = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventActionOwnerTargetMatch'],
      semantics: { type: '"eventActionOwnerTargetMatch"' },
      source: ['packages/game-data-contract/src/conditions.ts:575:7'],
      description: '比较当前动作宿主与事件目标，不把宿主身份猜成事件来源。',
    },
    operator: {
      kind: 'enum',
      options: ['equal', 'notEqual'],
      semantics: {
        type: '"equal" | "notEqual"',
        unionVariants: [{ type: '"equal"' }, { type: '"notEqual"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:577:7'],
      description: '判断动作宿主与事件目标相同或不同。',
    },
  },
  semantics: { type: '{ kind: "eventActionOwnerTargetMatch"; operator: "equal" | "notEqual"; }' },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_fc8cff68f66bf7ae = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventSkillIdIn'],
      semantics: { type: '"eventSkillIdIn"' },
      source: ['packages/game-data-contract/src/conditions.ts:497:7'],
      description: '匹配触发 Buff 响应的待施放技能稳定身份。',
    },
    skillIds: {
      kind: 'array',
      element: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/conditions.ts:499:7'],
      },
      semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
      source: ['packages/game-data-contract/src/conditions.ts:499:7'],
      description: '任一匹配即可成立的原生技能 ID。',
    },
  },
  semantics: { type: '{ kind: "eventSkillIdIn"; skillIds: readonly string[]; }' },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_09221dd013170ec5 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventSkillIdIn'],
      semantics: { type: '"eventSkillIdIn"' },
      source: ['packages/game-data-contract/src/conditions.ts:497:7'],
      description: '匹配触发 Buff 响应的待施放技能稳定身份。',
    },
    skillIds: {
      kind: 'array',
      element: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/conditions.ts:499:7'],
      },
      semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
      source: ['packages/game-data-contract/src/conditions.ts:499:7'],
      description: '任一匹配即可成立的原生技能 ID。',
    },
  },
  semantics: { type: '{ kind: "eventSkillIdIn"; skillIds: readonly string[]; }' },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_ffb2e1be792124f7 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventSkillIdIn'],
      semantics: { type: '"eventSkillIdIn"' },
      source: ['packages/game-data-contract/src/conditions.ts:497:7'],
      description: '匹配触发 Buff 响应的待施放技能稳定身份。',
    },
    skillIds: {
      kind: 'array',
      element: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/conditions.ts:499:7'],
      },
      semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
      source: ['packages/game-data-contract/src/conditions.ts:499:7'],
      description: '任一匹配即可成立的原生技能 ID。',
    },
  },
  semantics: { type: '{ kind: "eventSkillIdIn"; skillIds: readonly string[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_16ea8542c7ed224a = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventSkillIdIn'],
      semantics: { type: '"eventSkillIdIn"' },
      source: ['packages/game-data-contract/src/conditions.ts:497:7'],
      description: '匹配触发 Buff 响应的待施放技能稳定身份。',
    },
    skillIds: {
      kind: 'array',
      element: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/conditions.ts:499:7'],
      },
      semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
      source: ['packages/game-data-contract/src/conditions.ts:499:7'],
      description: '任一匹配即可成立的原生技能 ID。',
    },
  },
  semantics: { type: '{ kind: "eventSkillIdIn"; skillIds: readonly string[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_42d5166712060500 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['eventSkillIdIn'],
      semantics: { type: '"eventSkillIdIn"' },
      source: ['packages/game-data-contract/src/conditions.ts:497:7'],
      description: '匹配触发 Buff 响应的待施放技能稳定身份。',
    },
    skillIds: {
      kind: 'array',
      element: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/conditions.ts:499:7'],
      },
      semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
      source: ['packages/game-data-contract/src/conditions.ts:499:7'],
      description: '任一匹配即可成立的原生技能 ID。',
    },
  },
  semantics: { type: '{ kind: "eventSkillIdIn"; skillIds: readonly string[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_34d192d0b9e5a680 = {
  kind: 'array',
  element: {
    kind: 'enum',
    options: ['crush', 'airborne', 'knockDown', 'fracture'],
    semantics: {
      type: '"crush" | "airborne" | "knockDown" | "fracture"',
      unionVariants: [
        { type: '"crush"' },
        { type: '"airborne"' },
        { type: '"knockDown"' },
        { type: '"fracture"' },
      ],
    },
    source: ['packages/game-data-contract/src/actions.ts:1754:7'],
  },
  semantics: {
    type: 'readonly ("crush" | "airborne" | "knockDown" | "fracture")[]',
    arrayElement: {
      type: '"crush" | "airborne" | "knockDown" | "fracture"',
      unionVariants: [
        { type: '"crush"' },
        { type: '"airborne"' },
        { type: '"knockDown"' },
        { type: '"fracture"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/actions.ts:1754:7'],
} as const;
const definitionSchemaPart_844722dc286f4c61 = {
  kind: {
    kind: 'enum',
    options: ['elementalReactionActive'],
    semantics: { type: '"elementalReactionActive"' },
    source: ['packages/game-data-contract/src/conditions.ts:627:7'],
    description: '检查指定复合元素反应是否生效。',
  },
  reaction: {
    kind: 'enum',
    options: ['electrification', 'corrosion'],
    semantics: {
      type: '"electrification" | "corrosion"',
      unionVariants: [{ type: '"electrification"' }, { type: '"corrosion"' }],
    },
    source: ['packages/game-data-contract/src/conditions.ts:629:7'],
    description: '要检查的元素反应。',
  },
  minimumLevel: {
    kind: 'number',
    semantics: { type: 'number | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:631:7'],
    optional: true,
    description: '反应至少需要达到的等级。',
  },
} as const;
const definitionSchemaPart_ae1b4b358bbcba44 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:141:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:280:7'],
          description: '读取最大层数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:141:3'],
    },
  ],
  semantics: {
    type: 'BuffMaxStackCount | undefined',
    optional: true,
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:141:3'],
  optional: true,
  description: '可在施加时从该 Buff 已合并的实例黑板解析。',
} as const;
const definitionSchemaPart_1fbfd66386e805e7 = {
  type: '"normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | "comboSkill" | "ultimateSkill" | "plungingAttack" | "dashAttack" | "fireBurst" | "electricBurst" | ... 5 more ... | "natureAbnormal"',
  unionVariants: [
    { type: '"normalAttack"' },
    { type: '"normalAttackLastCombo"' },
    { type: '"powerAttack"' },
    { type: '"normalSkill"' },
    { type: '"comboSkill"' },
    { type: '"ultimateSkill"' },
    { type: '"plungingAttack"' },
    { type: '"dashAttack"' },
    { type: '"fireBurst"' },
    { type: '"electricBurst"' },
    { type: '"cryoBurst"' },
    { type: '"natureBurst"' },
    { type: '"fireAbnormal"' },
    { type: '"electricAbnormal"' },
    { type: '"cryoAbnormal"' },
    { type: '"natureAbnormal"' },
  ],
} as const;
const definitionSchemaPart_c64dba6203828946 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:704:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:264:7'],
          description: '读取持续秒数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:704:3'],
    },
  ],
  semantics: {
    type: 'BuffDuration | undefined',
    optional: true,
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:704:3'],
  optional: true,
  description: 'Buff 启用期间执行 trigger 生命周期动作的时间间隔。',
} as const;
const definitionSchemaPart_f8742e7874f53291 = {
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
  semantics: {
    type: '"physical" | "heat" | "cryo" | "electric" | "nature" | "ether" | "normalAttack" | "comboSkill" | "battleSkill" | "ultimate" | "staggeredEnemy"',
    unionVariants: [
      { type: '"physical"' },
      { type: '"heat"' },
      { type: '"cryo"' },
      { type: '"electric"' },
      { type: '"nature"' },
      { type: '"ether"' },
      { type: '"normalAttack"' },
      { type: '"comboSkill"' },
      { type: '"battleSkill"' },
      { type: '"ultimate"' },
      { type: '"staggeredEnemy"' },
    ],
  },
  source: ['packages/game-data-contract/src/buildModifiers.ts:90:5'],
  description: '要修改的伤害倍率项。',
} as const;
const definitionSchemaPart_6bcf600ee9301e08 = {
  kind: 'union',
  variants: [
    {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:157:7'],
    },
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/conditions.ts:157:7'],
    },
    {
      kind: 'enum',
      options: [false],
      semantics: { type: 'false' },
      source: ['packages/game-data-contract/src/conditions.ts:157:7'],
    },
    {
      kind: 'enum',
      options: [true],
      semantics: { type: 'true' },
      source: ['packages/game-data-contract/src/conditions.ts:157:7'],
    },
  ],
  semantics: {
    type: 'string | number | boolean',
    unionVariants: [{ type: 'boolean' }, { type: 'number' }, { type: 'string' }],
  },
  source: ['packages/game-data-contract/src/conditions.ts:157:7'],
  description: '期望的值。',
} as const;
const definitionSchemaPart_957ab133254a7817 = {
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
  semantics: {
    type: '"normalSkill" | "comboSkill" | "ultimateSkill" | "dodge" | "breakingAttack" | "passiveSkill" | "attack" | "attachSkill" | "extraActiveSkill"',
    unionVariants: [
      { type: '"normalSkill"' },
      { type: '"comboSkill"' },
      { type: '"ultimateSkill"' },
      { type: '"dodge"' },
      { type: '"breakingAttack"' },
      { type: '"passiveSkill"' },
      { type: '"attack"' },
      { type: '"attachSkill"' },
      { type: '"extraActiveSkill"' },
    ],
  },
  source: ['packages/game-data-contract/src/skills.ts:290:3'],
  description: '`_InitSkills` 创建实例时得到的原生初值；之后可由 ChangeSkillType 改写。',
} as const;
const definitionSchemaPart_e786188468846aab = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['elementalBurst'],
      semantics: { type: '"elementalBurst"' },
      source: ['packages/game-data-contract/src/buffs.ts:444:7'],
      description: '语义角色判别值。',
    },
    element: {
      kind: 'enum',
      options: ['heat', 'cryo', 'electric', 'nature'],
      semantics: {
        type: '"heat" | "cryo" | "electric" | "nature"',
        unionVariants: [
          { type: '"heat"' },
          { type: '"cryo"' },
          { type: '"electric"' },
          { type: '"nature"' },
        ],
      },
      source: ['packages/game-data-contract/src/buffs.ts:446:7'],
      description: '爆发元素。',
    },
  },
  semantics: {
    type: '{ readonly kind: "elementalBurst"; readonly element: "heat" | "cryo" | "electric" | "nature"; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:726:3'],
} as const;
const definitionSchemaPart_d6060c97ff0b6b57 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['buffConsumed'],
      semantics: { type: '"buffConsumed"' },
      source: ['packages/game-data-contract/src/actions.ts:1710:7'],
      description: '触发器种类判别值。',
    },
    buffIds: {
      kind: 'array',
      element: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/actions.ts:1712:7'],
      },
      semantics: {
        type: 'readonly string[] | undefined',
        arrayElement: { type: 'string' },
        optional: true,
      },
      source: ['packages/game-data-contract/src/actions.ts:1712:7'],
      optional: true,
      description: '任一匹配即可触发的 Buff ID。',
    },
  },
  semantics: { type: '{ kind: "buffConsumed"; buffIds?: readonly string[] | undefined; }' },
  source: ['packages/game-data-contract/src/actions.ts:1798:3'],
} as const;
const definitionSchemaPart_90855f34ff01a57b = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:700:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:264:7'],
          description: '读取持续秒数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:700:3'],
    },
  ],
  semantics: {
    type: 'BuffDuration | undefined',
    optional: true,
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:700:3'],
  optional: true,
  description: '在创建/叠层前登记的同 ID 添加冷却；后续被叠层策略拒绝也不撤销，使用普通战斗时间。',
} as const;
const definitionSchemaPart_b6b9ebff4ca48ffd = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['buffConsumed'],
      semantics: { type: '"buffConsumed"' },
      source: ['packages/game-data-contract/src/actions.ts:1710:7'],
      description: '触发器种类判别值。',
    },
    buffIds: {
      kind: 'array',
      element: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/actions.ts:1712:7'],
      },
      semantics: {
        type: 'readonly string[] | undefined',
        arrayElement: { type: 'string' },
        optional: true,
      },
      source: ['packages/game-data-contract/src/actions.ts:1712:7'],
      optional: true,
      description: '任一匹配即可触发的 Buff ID。',
    },
  },
  semantics: { type: '{ kind: "buffConsumed"; buffIds?: readonly string[] | undefined; }' },
  source: ['packages/game-data-contract/src/equipment.ts:109:9'],
} as const;
const definitionSchemaPart_a1746dd748a5beac = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:708:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:272:7'],
          description: '读取触发次数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:708:3'],
    },
  ],
  semantics: {
    type: 'BuffTriggerCount | undefined',
    optional: true,
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:708:3'],
  optional: true,
  description: 'trigger 生命周期动作最多执行的次数；0 表示不触发，负数表示不限制次数。',
} as const;
const definitionSchemaPart_d3dd6357b1df4217 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:698:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:264:7'],
          description: '读取持续秒数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:698:3'],
    },
  ],
  semantics: {
    type: 'BuffDuration | undefined',
    optional: true,
    unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
  },
  source: ['packages/game-data-contract/src/buffs.ts:698:3'],
  optional: true,
  description: '普通 Buff 的持续秒数；不填表示无限持续。定时成长型 Buff 用它表示自动加层周期。',
} as const;
const definitionSchemaPart_528d803174d5e9e9 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['abilityEvent'],
      semantics: { type: '"abilityEvent"' },
      source: ['packages/game-data-contract/src/actions.ts:1681:7'],
      description: '直接监听能力系统事件。',
    },
    event: {
      kind: 'enum',
      options: ['beforeAddedBuff', 'outputBuff', 'addedBuff'],
      semantics: {
        type: '"beforeAddedBuff" | "outputBuff" | "addedBuff"',
        unionVariants: [
          { type: '"beforeAddedBuff"' },
          { type: '"outputBuff"' },
          { type: '"addedBuff"' },
        ],
      },
      source: ['packages/game-data-contract/src/actions.ts:1683:7'],
      description: '允许直接订阅的能力事件。',
    },
  },
  semantics: {
    type: '{ kind: "abilityEvent"; event: "beforeAddedBuff" | "outputBuff" | "addedBuff"; }',
  },
  source: ['packages/game-data-contract/src/actions.ts:1798:3'],
} as const;
const definitionSchemaPart_778b335d48e0cb5d = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['abilityEvent'],
      semantics: { type: '"abilityEvent"' },
      source: ['packages/game-data-contract/src/actions.ts:1681:7'],
      description: '直接监听能力系统事件。',
    },
    event: {
      kind: 'enum',
      options: ['beforeAddedBuff', 'outputBuff', 'addedBuff'],
      semantics: {
        type: '"beforeAddedBuff" | "outputBuff" | "addedBuff"',
        unionVariants: [
          { type: '"beforeAddedBuff"' },
          { type: '"outputBuff"' },
          { type: '"addedBuff"' },
        ],
      },
      source: ['packages/game-data-contract/src/actions.ts:1683:7'],
      description: '允许直接订阅的能力事件。',
    },
  },
  semantics: {
    type: '{ kind: "abilityEvent"; event: "beforeAddedBuff" | "outputBuff" | "addedBuff"; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:109:9'],
} as const;
const definitionSchemaPart_2dec103f6560f523 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:103:7'],
} as const;
const definitionSchemaPart_e3e6c3281a767d43 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:111:7'],
} as const;
const definitionSchemaPart_20c9108a64f4295a = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:137:7'],
} as const;
const definitionSchemaPart_f859de2880f31bc3 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:149:7'],
} as const;
const definitionSchemaPart_eca6fd253bfb2a8f = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:163:7'],
} as const;
const definitionSchemaPart_870e5065b71b2997 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:167:7'],
} as const;
const definitionSchemaPart_850fae5c9c81c8ea = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:197:7'],
} as const;
const definitionSchemaPart_8edf618f0f5b210d = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:203:7'],
} as const;
const definitionSchemaPart_6a78142ea9f3fd7d = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:285:7'],
} as const;
const definitionSchemaPart_8e7bc5c68d476242 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:297:7'],
} as const;
const definitionSchemaPart_07c467816ef511ed = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:325:7'],
} as const;
const definitionSchemaPart_e5362a3010f5da02 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:341:7'],
} as const;
const definitionSchemaPart_0141a1228260aec3 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:355:7'],
} as const;
const definitionSchemaPart_7826213e24fc06cb = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:379:7'],
} as const;
const definitionSchemaPart_cff3949652b6e1b1 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:539:7'],
} as const;
const definitionSchemaPart_5ae5dafa25d04e53 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['blackboard'],
      semantics: { type: '"blackboard"' },
      source: ['packages/game-data-contract/src/conditions.ts:751:7'],
      description: '从当前动作黑板读取。',
    },
    key: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:753:7'],
      description: '要读取的黑板键。',
    },
    fallback: {
      kind: 'number',
      semantics: { type: 'number | undefined', optional: true },
      source: ['packages/game-data-contract/src/conditions.ts:755:7'],
      optional: true,
      description: '仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。',
    },
  },
  semantics: { type: '{ kind: "blackboard"; key: string; fallback?: number | undefined; }' },
  source: ['packages/game-data-contract/src/conditions.ts:563:7'],
} as const;
const definitionSchemaPart_6409833c07c1c60d = {
  kind: 'array',
  element: {
    kind: 'enum',
    options: ['crush', 'airborne', 'knockDown', 'fracture'],
    semantics: {
      type: '"crush" | "airborne" | "knockDown" | "fracture"',
      unionVariants: [
        { type: '"airborne"' },
        { type: '"knockDown"' },
        { type: '"fracture"' },
        { type: '"crush"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:455:7'],
  },
  semantics: {
    type: 'readonly ("crush" | "airborne" | "knockDown" | "fracture")[]',
    arrayElement: {
      type: '"crush" | "airborne" | "knockDown" | "fracture"',
      unionVariants: [
        { type: '"airborne"' },
        { type: '"knockDown"' },
        { type: '"fracture"' },
        { type: '"crush"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/conditions.ts:455:7'],
  description: '任一匹配即可成立的物理异常类型。',
} as const;
const definitionSchemaPart_e98ac967d772a17e = {
  kind: 'object',
  fields: {
    useDirectoryValue: {
      kind: 'boolean',
      semantics: { type: 'boolean' },
      source: ['packages/game-data-contract/src/buffs.ts:399:5'],
      description: '是否使用资源目录中配置的排序值。',
    },
    value: {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:401:5'],
      description: '同类图标之间的排序数值。',
    },
    category: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/buffs.ts:403:5'],
      description: '图标所属的排序类别。',
    },
  },
  semantics: {
    type: '{ readonly useDirectoryValue: boolean; readonly value: number; readonly category: string; } | undefined',
    optional: true,
  },
  source: ['packages/game-data-contract/src/buffs.ts:397:3'],
  optional: true,
  description: '多个 Buff 图标同时出现时的排序设置。',
} as const;
const definitionSchemaPart_ac0d9f705a401128 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['elementalAttachment'],
      semantics: { type: '"elementalAttachment"' },
      source: ['packages/game-data-contract/src/buffs.ts:437:7'],
      description: '语义角色判别值。',
    },
    element: {
      kind: 'enum',
      options: ['heat', 'cryo', 'electric', 'nature'],
      semantics: {
        type: '"heat" | "cryo" | "electric" | "nature"',
        unionVariants: [
          { type: '"heat"' },
          { type: '"cryo"' },
          { type: '"electric"' },
          { type: '"nature"' },
        ],
      },
      source: ['packages/game-data-contract/src/buffs.ts:439:7'],
      description: '附着元素。',
    },
  },
  semantics: {
    type: '{ readonly kind: "elementalAttachment"; readonly element: "heat" | "cryo" | "electric" | "nature"; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:726:3'],
} as const;
const definitionSchemaPart_5c80980ab0310678 = {
  kind: {
    kind: 'enum',
    options: ['eventBuffIdMatch'],
    semantics: { type: '"eventBuffIdMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:508:7'],
    description: '匹配触发当前响应的新施加 Buff 身份。',
  },
  buffIds: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:510:7'],
    },
    semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
    source: ['packages/game-data-contract/src/conditions.ts:510:7'],
    description: '任一匹配即可成立的新 Buff ID。',
  },
  buffIdOutputKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:512:7'],
    optional: true,
    description: '条件命中后把事件 Buff ID 写入当前动作黑板。',
  },
} as const;
const definitionSchemaPart_dd2d48f93137078f = {
  kind: 'object',
  fields: definitionSchemaPart_c951359d881535e2,
  semantics: { type: 'SkillAllowedNextWindow' },
  source: ['packages/game-data-contract/src/skills.ts:325:5'],
} as const;
const definitionSchemaPart_90ef36357d8944fa = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['contextTargetContains'],
      semantics: { type: '"contextTargetContains"' },
      source: ['packages/game-data-contract/src/conditions.ts:489:7'],
      description: '当前 Context 目标组是否包含事件目标。',
    },
    parentContextKey: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:491:7'],
      description: '要检查的动作目标组。',
    },
    child: {
      kind: 'enum',
      options: ['eventTarget'],
      semantics: { type: '"eventTarget"' },
      source: ['packages/game-data-contract/src/conditions.ts:493:7'],
      description: '当前只支持检查事件目标。',
    },
  },
  semantics: {
    type: '{ kind: "contextTargetContains"; parentContextKey: string; child: "eventTarget"; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_a93a5de537849245 = {
  kind: 'array',
  element: {
    kind: 'enum',
    options: ['physical', 'heat', 'cryo', 'electric', 'nature'],
    semantics: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
      ],
    },
    source: ['packages/game-data-contract/src/actions.ts:1746:7'],
  },
  semantics: {
    type: 'readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]',
    arrayElement: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/actions.ts:1746:7'],
} as const;
const definitionSchemaPart_28423147e0254f9c = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['contextTargetContains'],
      semantics: { type: '"contextTargetContains"' },
      source: ['packages/game-data-contract/src/conditions.ts:489:7'],
      description: '当前 Context 目标组是否包含事件目标。',
    },
    parentContextKey: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:491:7'],
      description: '要检查的动作目标组。',
    },
    child: {
      kind: 'enum',
      options: ['eventTarget'],
      semantics: { type: '"eventTarget"' },
      source: ['packages/game-data-contract/src/conditions.ts:493:7'],
      description: '当前只支持检查事件目标。',
    },
  },
  semantics: {
    type: '{ kind: "contextTargetContains"; parentContextKey: string; child: "eventTarget"; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_7f9cd384fd747fa0 = {
  kind: {
    kind: 'enum',
    options: ['enemyRankIn'],
    semantics: { type: '"enemyRankIn"' },
    source: ['packages/game-data-contract/src/conditions.ts:93:7'],
    description: '条件种类判别值。',
  },
  ranks: {
    kind: 'array',
    element: {
      kind: 'enum',
      options: ['mob', 'elite', 'boss'],
      semantics: {
        type: '"mob" | "elite" | "boss"',
        unionVariants: [{ type: '"mob"' }, { type: '"elite"' }, { type: '"boss"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:95:7'],
    },
    semantics: {
      type: 'readonly ("mob" | "elite" | "boss")[]',
      arrayElement: {
        type: '"mob" | "elite" | "boss"',
        unionVariants: [{ type: '"mob"' }, { type: '"elite"' }, { type: '"boss"' }],
      },
    },
    source: ['packages/game-data-contract/src/conditions.ts:95:7'],
    description: '任一匹配即可成立的敌人强度分级。',
  },
} as const;
const definitionSchemaPart_b6e3305d3c5055c8 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['contextTargetContains'],
      semantics: { type: '"contextTargetContains"' },
      source: ['packages/game-data-contract/src/conditions.ts:489:7'],
      description: '当前 Context 目标组是否包含事件目标。',
    },
    parentContextKey: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:491:7'],
      description: '要检查的动作目标组。',
    },
    child: {
      kind: 'enum',
      options: ['eventTarget'],
      semantics: { type: '"eventTarget"' },
      source: ['packages/game-data-contract/src/conditions.ts:493:7'],
      description: '当前只支持检查事件目标。',
    },
  },
  semantics: {
    type: '{ kind: "contextTargetContains"; parentContextKey: string; child: "eventTarget"; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_f27e7d41acc5fd16 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['contextTargetContains'],
      semantics: { type: '"contextTargetContains"' },
      source: ['packages/game-data-contract/src/conditions.ts:489:7'],
      description: '当前 Context 目标组是否包含事件目标。',
    },
    parentContextKey: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:491:7'],
      description: '要检查的动作目标组。',
    },
    child: {
      kind: 'enum',
      options: ['eventTarget'],
      semantics: { type: '"eventTarget"' },
      source: ['packages/game-data-contract/src/conditions.ts:493:7'],
      description: '当前只支持检查事件目标。',
    },
  },
  semantics: {
    type: '{ kind: "contextTargetContains"; parentContextKey: string; child: "eventTarget"; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_82aef6e7b1c30272 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['contextTargetContains'],
      semantics: { type: '"contextTargetContains"' },
      source: ['packages/game-data-contract/src/conditions.ts:489:7'],
      description: '当前 Context 目标组是否包含事件目标。',
    },
    parentContextKey: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:491:7'],
      description: '要检查的动作目标组。',
    },
    child: {
      kind: 'enum',
      options: ['eventTarget'],
      semantics: { type: '"eventTarget"' },
      source: ['packages/game-data-contract/src/conditions.ts:493:7'],
      description: '当前只支持检查事件目标。',
    },
  },
  semantics: {
    type: '{ kind: "contextTargetContains"; parentContextKey: string; child: "eventTarget"; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_1e4328f8d9ecbedb = {
  kind: 'array',
  element: {
    kind: 'enum',
    options: ['physical', 'heat', 'cryo', 'electric', 'nature'],
    semantics: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:621:7'],
  },
  semantics: {
    type: 'readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]',
    arrayElement: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/conditions.ts:621:7'],
} as const;
const definitionSchemaPart_a06af490901715f4 = {
  kind: 'object',
  fields: definitionSchemaPart_db5f54ae2a57eb4c,
  semantics: { type: 'ScheduledSequenceDefinition' },
  source: ['packages/game-data-contract/src/skills.ts:44:3'],
} as const;
const definitionSchemaPart_a49205ae3c764ad2 = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['skillHit'],
      semantics: { type: '"skillHit"' },
      source: ['packages/game-data-contract/src/actions.ts:1761:7'],
      description: '触发器种类判别值。',
    },
    skillKey: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/actions.ts:1763:7'],
      description: '要匹配的执行技能。',
    },
    scope: {
      kind: 'enum',
      options: ['team', 'operator'],
      semantics: {
        type: '"team" | "operator"',
        unionVariants: [{ type: '"team"' }, { type: '"operator"' }],
      },
      source: ['packages/game-data-contract/src/actions.ts:1765:7'],
      description: '检查当前干员还是全队来源。',
    },
  },
  semantics: { type: '{ kind: "skillHit"; skillKey: string; scope: "team" | "operator"; }' },
  source: ['packages/game-data-contract/src/actions.ts:1798:3'],
} as const;
const definitionSchemaPart_2615f33168748abe = {
  kind: 'object',
  fields: {
    kind: {
      kind: 'enum',
      options: ['skillHit'],
      semantics: { type: '"skillHit"' },
      source: ['packages/game-data-contract/src/actions.ts:1761:7'],
      description: '触发器种类判别值。',
    },
    skillKey: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/actions.ts:1763:7'],
      description: '要匹配的执行技能。',
    },
    scope: {
      kind: 'enum',
      options: ['team', 'operator'],
      semantics: {
        type: '"team" | "operator"',
        unionVariants: [{ type: '"team"' }, { type: '"operator"' }],
      },
      source: ['packages/game-data-contract/src/actions.ts:1765:7'],
      description: '检查当前干员还是全队来源。',
    },
  },
  semantics: { type: '{ kind: "skillHit"; skillKey: string; scope: "team" | "operator"; }' },
  source: ['packages/game-data-contract/src/equipment.ts:109:9'],
} as const;
const definitionSchemaPart_25d1337c4d94d6ee = {
  kind: 'object',
  fields: definitionSchemaPart_db5f54ae2a57eb4c,
  semantics: { type: 'ScheduledSequenceDefinition' },
  source: ['packages/game-data-contract/src/actions.ts:1802:3'],
} as const;
const definitionSchemaPart_0a9c733c7258e10e = {
  kind: 'record',
  value: {
    kind: 'union',
    variants: [
      {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/skills.ts:105:3'],
      },
      {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/skills.ts:105:3'],
      },
    ],
    semantics: { type: 'string | number', unionVariants: [{ type: 'number' }, { type: 'string' }] },
    source: ['packages/game-data-contract/src/skills.ts:105:3'],
  },
  semantics: {
    type: 'Readonly<Record<string, string | number>> | undefined',
    recordValue: {
      type: 'string | number',
      unionVariants: [{ type: 'number' }, { type: 'string' }],
    },
    optional: true,
  },
  source: ['packages/game-data-contract/src/skills.ts:105:3'],
  optional: true,
  description: 'AbilitySystemData.entityBlackboard 的模板初值；生成动作的显式赋值可覆盖同名键。',
} as const;
const definitionSchemaPart_9a64911eead5a349 = {
  kind: {
    kind: 'enum',
    options: ['statusActive'],
    semantics: { type: '"statusActive"' },
    source: ['packages/game-data-contract/src/conditions.ts:311:7'],
    description: '检查兼容状态是否处于激活状态。',
  },
  statusKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:313:7'],
    description: '状态键。',
  },
  target: {
    kind: 'enum',
    options: ['enemy', 'caster'],
    semantics: {
      type: '"enemy" | "caster"',
      unionVariants: [{ type: '"enemy"' }, { type: '"caster"' }],
    },
    source: ['packages/game-data-contract/src/conditions.ts:315:7'],
    description: '要检查的对象。',
  },
  minimumStacks: {
    kind: 'number',
    semantics: { type: 'number | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:317:7'],
    optional: true,
    description: '状态至少需要达到的层数。',
  },
} as const;
const definitionSchemaPart_c33bd7d5e6b7dd60 = {
  kind: 'array',
  element: {
    kind: 'enum',
    options: ['physical', 'heat', 'cryo', 'electric', 'nature'],
    semantics: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:79:7'],
  },
  semantics: {
    type: 'readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]',
    arrayElement: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/conditions.ts:79:7'],
  description: '任一匹配即可成立的角色元素类型。',
} as const;
const definitionSchemaPart_aa265fa5786d052d = {
  type: '"enterFight" | "beforeOutputDamage" | "beforeOutputPhysicalInfliction" | "afterOutputPhysicalInfliction" | "beforeOutputInfliction" | "beforeOutputSpellBurst" | "outputCriticalDamage" | ... 8 more ... | "skillSpGained"',
  unionVariants: [
    { type: '"enterFight"' },
    { type: '"beforeOutputDamage"' },
    { type: '"beforeOutputPhysicalInfliction"' },
    { type: '"afterOutputPhysicalInfliction"' },
    { type: '"beforeOutputInfliction"' },
    { type: '"beforeOutputSpellBurst"' },
    { type: '"outputCriticalDamage"' },
    { type: '"outputHeal"' },
    { type: '"beforeCastSkill"' },
    { type: '"afterSkillApplyCost"' },
    { type: '"beforeOutputBuff"' },
    { type: '"outputBuff"' },
    { type: '"addedBuff"' },
    { type: '"buffEnhanceChanged"' },
    { type: '"buffConsumed"' },
    { type: '"skillSpGained"' },
  ],
} as const;
const definitionSchemaPart_6d2cd0a66f1df181 = {
  kind: {
    kind: 'enum',
    options: ['healTagsMatch'],
    semantics: { type: '"healTagsMatch"' },
    source: ['packages/game-data-contract/src/modifiers.ts:315:7'],
    description: '检查本次治疗携带的标签。',
  },
  match: {
    kind: 'enum',
    options: ['hasAny', 'hasAll'],
    semantics: {
      type: '"hasAny" | "hasAll"',
      unionVariants: [{ type: '"hasAny"' }, { type: '"hasAll"' }],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:317:7'],
    description: '匹配任一标签或全部标签。',
  },
  tags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/modifiers.ts:319:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/modifiers.ts:319:7'],
    description: '参与匹配的治疗标签。',
  },
} as const;
const definitionSchemaPart_01e8691dbd1dfa72 = {
  kind: 'object',
  fields: definitionSchemaPart_7ae32de862436768,
  semantics: { type: 'SkillBuffSlotReplacement' },
  source: ['packages/game-data-contract/src/buffs.ts:151:3'],
} as const;
const definitionSchemaPart_dcbeef0392c529df = {
  kind: 'array',
  element: {
    kind: 'enum',
    options: ['normalAttack', 'powerAttack', 'default', 'skill'],
    semantics: {
      type: '"normalAttack" | "powerAttack" | "default" | "skill"',
      unionVariants: [
        { type: '"normalAttack"' },
        { type: '"powerAttack"' },
        { type: '"default"' },
        { type: '"skill"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:553:7'],
  },
  semantics: {
    type: 'readonly ("normalAttack" | "powerAttack" | "default" | "skill")[] | undefined',
    arrayElement: {
      type: '"normalAttack" | "powerAttack" | "default" | "skill"',
      unionVariants: [
        { type: '"normalAttack"' },
        { type: '"powerAttack"' },
        { type: '"default"' },
        { type: '"skill"' },
      ],
    },
    optional: true,
  },
  source: ['packages/game-data-contract/src/conditions.ts:553:7'],
  optional: true,
  description: '允许的技力来源；省略时不筛选来源。',
} as const;
const definitionSchemaPart_f4a857f6c7282a2a = {
  kind: 'record',
  value: {
    kind: 'union',
    variants: [
      {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/skills.ts:42:3'],
      },
      {
        kind: 'array',
        element: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/skills.ts:42:3'],
        },
        semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
        source: ['packages/game-data-contract/src/skills.ts:42:3'],
      },
    ],
    semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
    source: ['packages/game-data-contract/src/skills.ts:42:3'],
  },
  semantics: {
    type: 'Readonly<Record<string, LevelValues>> | undefined',
    recordValue: { type: 'LevelValues', aliases: ['LevelValues'] },
    optional: true,
  },
  source: ['packages/game-data-contract/src/skills.ts:42:3'],
  optional: true,
  description: '创建时按技能等级解析的动作黑板默认值。',
} as const;
const definitionSchemaPart_1f421d36bbaebcf3 = {
  kind: {
    kind: 'enum',
    options: ['eventOverheal'],
    semantics: { type: '"eventOverheal"' },
    source: ['packages/game-data-contract/src/conditions.ts:581:7'],
    description: '原生 CheckOverHeal；非空键会在判断前接收对应事件值。',
  },
  overHealKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:583:7'],
    optional: true,
    description: '保存过量治疗值的动作黑板键。',
  },
  finalHealKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:585:7'],
    optional: true,
    description: '保存最终治疗值的动作黑板键。',
  },
  realHealKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:587:7'],
    optional: true,
    description: '保存实际恢复生命值的动作黑板键。',
  },
} as const;
const definitionSchemaPart_adf7820c644c053f = {
  kind: 'object',
  fields: definitionSchemaPart_9131f41f10748a74,
  semantics: {
    type: '{ kind: "eventCustomAbilityNameMatch"; eventName: string; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_bef5843c55abe357 = {
  kind: 'object',
  fields: definitionSchemaPart_9131f41f10748a74,
  semantics: {
    type: '{ kind: "eventCustomAbilityNameMatch"; eventName: string; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_18d2ad679f5e08f0 = {
  kind: {
    kind: 'enum',
    options: ['recursiveInput'],
    semantics: { type: '"recursiveInput"' },
    source: ['packages/game-data-contract/src/skills.ts:376:3'],
    description: '当前策略通过递归读取输入窗口展开技能链。',
  },
  firstSkillKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/skills.ts:378:3'],
    description: '技能链的第一段。',
  },
  terminalSkillKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/skills.ts:380:3'],
    description: '到达此技能后停止展开。',
  },
  maxSegments: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/skills.ts:382:3'],
    description: '最多放置的技能段数。',
  },
  fallback: {
    kind: 'enum',
    options: ['sequence'],
    semantics: { type: '"sequence"' },
    source: ['packages/game-data-contract/src/skills.ts:384:3'],
    description: '推测失败时按技能组声明顺序放置。',
  },
} as const;
const definitionSchemaPart_68a690c2e76ee655 = {
  kind: 'object',
  fields: definitionSchemaPart_9131f41f10748a74,
  semantics: {
    type: '{ kind: "eventCustomAbilityNameMatch"; eventName: string; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_ecaca49213d60b25 = {
  kind: 'object',
  fields: definitionSchemaPart_9131f41f10748a74,
  semantics: {
    type: '{ kind: "eventCustomAbilityNameMatch"; eventName: string; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_d025e87d720dce8f = {
  kind: 'object',
  fields: definitionSchemaPart_9131f41f10748a74,
  semantics: {
    type: '{ kind: "eventCustomAbilityNameMatch"; eventName: string; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_fe90a549f8a18418 = {
  type: 'SkillDefinition | readonly SkillDefinition[]',
  unionVariants: [
    {
      type: 'SkillDefinition',
      unionVariants: [
        {
          type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
        },
        { type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }' },
      ],
    },
    {
      type: 'readonly SkillDefinition[]',
      arrayElement: {
        type: 'SkillDefinition',
        unionVariants: [
          {
            type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
          },
          { type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }' },
        ],
      },
    },
  ],
} as const;
const definitionSchemaPart_ba98ef5e38825c91 = {
  resource: {
    kind: 'enum',
    options: ['sp', 'ultimateEnergy'],
    semantics: {
      type: '"sp" | "ultimateEnergy"',
      unionVariants: [{ type: '"sp"' }, { type: '"ultimateEnergy"' }],
    },
    source: ['packages/game-data-contract/src/skills.ts:137:3'],
    description: '要消耗的战斗资源。',
  },
  value: {
    kind: 'union',
    variants: [
      {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/skills.ts:139:3'],
      },
      {
        kind: 'array',
        element: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/skills.ts:139:3'],
        },
        semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
        source: ['packages/game-data-contract/src/skills.ts:139:3'],
      },
    ],
    semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
    source: ['packages/game-data-contract/src/skills.ts:139:3'],
    description: '单个费用或按技能等级排列的费用。',
  },
} as const;
const definitionSchemaPart_278d3e397df130ba = {
  kind: 'record',
  value: {
    kind: 'union',
    variants: [
      {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/equipment.ts:132:3'],
      },
      {
        kind: 'array',
        element: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/equipment.ts:132:3'],
        },
        semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
        source: ['packages/game-data-contract/src/equipment.ts:132:3'],
      },
    ],
    semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
    source: ['packages/game-data-contract/src/equipment.ts:132:3'],
  },
  semantics: {
    type: 'Readonly<Record<string, LevelValues>> | undefined',
    recordValue: { type: 'LevelValues', aliases: ['LevelValues'] },
    optional: true,
  },
  source: ['packages/game-data-contract/src/equipment.ts:132:3'],
  optional: true,
  description: '配装能力的初始黑板，按词条等级解析；初始化与全部事件响应共享同一实例。',
} as const;
const definitionSchemaPart_be3d2598d1118bbf = {
  kind: {
    kind: 'enum',
    options: ['all'],
    semantics: { type: '"all"' },
    source: ['packages/game-data-contract/src/modifiers.ts:389:7'],
    description: '所有子条件都成立时返回真。',
  },
  conditions: definitionSchemaPart_f99f134f4dce0caa,
} as const;
const definitionSchemaPart_5a278619f689abe6 = {
  kind: 'enum',
  options: [
    'enemy',
    'caster',
    'eventTarget',
    'buffOwner',
    'buffSource',
    'controlledOperator',
    'currentAbilityEntity',
    'eventSource',
    'currentTarget',
    'actionInputTarget',
  ],
  semantics: {
    type: 'BuffConditionTarget',
    unionVariants: [
      {
        type: '"enemy" | "caster" | "eventTarget" | "buffOwner" | "buffSource" | "controlledOperator" | "currentAbilityEntity" | "eventSource" | "currentTarget" | "actionInputTarget"',
        unionVariants: [
          { type: '"enemy"' },
          { type: '"caster"' },
          { type: '"eventTarget"' },
          { type: '"buffOwner"' },
          { type: '"buffSource"' },
          { type: '"controlledOperator"' },
          { type: '"currentAbilityEntity"' },
          { type: '"eventSource"' },
          { type: '"currentTarget"' },
          { type: '"actionInputTarget"' },
        ],
      },
      { type: '"actionInputTarget"' },
    ],
  },
  source: ['packages/game-data-contract/src/conditions.ts:361:7'],
  description: '要检查的对象。',
} as const;
const definitionSchemaPart_4df30fd65f24bee2 = {
  kind: {
    kind: 'enum',
    options: ['ownerSpawnedAbilityEntityPresent'],
    semantics: { type: '"ownerSpawnedAbilityEntityPresent"' },
    source: ['packages/game-data-contract/src/conditions.ts:611:7'],
    description: '当前施术者生成的活动能力实体中是否存在匹配模板（零空间不再做距离裁剪）。',
  },
  abilityEntityIds: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:613:7'],
    },
    semantics: {
      type: 'readonly string[] | undefined',
      arrayElement: { type: 'string' },
      optional: true,
    },
    source: ['packages/game-data-contract/src/conditions.ts:613:7'],
    optional: true,
    description: '只匹配这些能力实体 ID；省略时接受任意 ID。',
  },
  sameSourceSkillCast: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:615:7'],
    optional: true,
    description: '是否只接受和当前 Buff 来自同一次技能施放的实体。',
  },
} as const;
const definitionSchemaPart_72b4a82d356c5cce = {
  kind: 'enum',
  options: [
    'enemy',
    'caster',
    'eventTarget',
    'buffOwner',
    'buffSource',
    'controlledOperator',
    'currentAbilityEntity',
    'eventSource',
    'currentTarget',
    'actionInputTarget',
  ],
  semantics: {
    type: 'BuffConditionTarget',
    unionVariants: [
      {
        type: '"enemy" | "caster" | "eventTarget" | "buffOwner" | "buffSource" | "controlledOperator" | "currentAbilityEntity" | "eventSource" | "currentTarget" | "actionInputTarget"',
        unionVariants: [
          { type: '"enemy"' },
          { type: '"caster"' },
          { type: '"eventTarget"' },
          { type: '"buffOwner"' },
          { type: '"buffSource"' },
          { type: '"controlledOperator"' },
          { type: '"currentAbilityEntity"' },
          { type: '"eventSource"' },
          { type: '"currentTarget"' },
          { type: '"actionInputTarget"' },
        ],
      },
      { type: '"actionInputTarget"' },
    ],
  },
  source: ['packages/game-data-contract/src/conditions.ts:173:7'],
  description: '要查找 Buff 的对象。',
} as const;
const definitionSchemaPart_53905b3548641d57 = {
  kind: 'enum',
  options: [
    'enemy',
    'caster',
    'eventTarget',
    'buffOwner',
    'buffSource',
    'controlledOperator',
    'currentAbilityEntity',
    'eventSource',
    'currentTarget',
    'actionInputTarget',
  ],
  semantics: {
    type: 'BuffConditionTarget',
    unionVariants: [
      {
        type: '"enemy" | "caster" | "eventTarget" | "buffOwner" | "buffSource" | "controlledOperator" | "currentAbilityEntity" | "eventSource" | "currentTarget" | "actionInputTarget"',
        unionVariants: [
          { type: '"enemy"' },
          { type: '"caster"' },
          { type: '"eventTarget"' },
          { type: '"buffOwner"' },
          { type: '"buffSource"' },
          { type: '"controlledOperator"' },
          { type: '"currentAbilityEntity"' },
          { type: '"eventSource"' },
          { type: '"currentTarget"' },
          { type: '"actionInputTarget"' },
        ],
      },
      { type: '"actionInputTarget"' },
    ],
  },
  source: ['packages/game-data-contract/src/conditions.ts:331:7'],
  description: '要统计 Buff 的对象。',
} as const;
const definitionSchemaPart_1a4b8032d6fa885d = {
  kind: 'enum',
  options: [
    'enemy',
    'caster',
    'eventTarget',
    'buffOwner',
    'buffSource',
    'controlledOperator',
    'currentAbilityEntity',
    'eventSource',
    'currentTarget',
    'actionInputTarget',
  ],
  semantics: {
    type: 'BuffConditionTarget',
    unionVariants: [
      {
        type: '"enemy" | "caster" | "eventTarget" | "buffOwner" | "buffSource" | "controlledOperator" | "currentAbilityEntity" | "eventSource" | "currentTarget" | "actionInputTarget"',
        unionVariants: [
          { type: '"enemy"' },
          { type: '"caster"' },
          { type: '"eventTarget"' },
          { type: '"buffOwner"' },
          { type: '"buffSource"' },
          { type: '"controlledOperator"' },
          { type: '"currentAbilityEntity"' },
          { type: '"eventSource"' },
          { type: '"currentTarget"' },
          { type: '"actionInputTarget"' },
        ],
      },
      { type: '"actionInputTarget"' },
    ],
  },
  source: ['packages/game-data-contract/src/conditions.ts:347:7'],
  description: '要统计 Buff 的对象。',
} as const;
const definitionSchemaPart_1bc5a27ee35d9bde = {
  kind: 'enum',
  options: [
    'enemy',
    'caster',
    'eventTarget',
    'buffOwner',
    'buffSource',
    'controlledOperator',
    'currentAbilityEntity',
    'eventSource',
    'currentTarget',
    'actionInputTarget',
  ],
  semantics: {
    type: 'BuffConditionTarget',
    unionVariants: [
      {
        type: '"enemy" | "caster" | "eventTarget" | "buffOwner" | "buffSource" | "controlledOperator" | "currentAbilityEntity" | "eventSource" | "currentTarget" | "actionInputTarget"',
        unionVariants: [
          { type: '"enemy"' },
          { type: '"caster"' },
          { type: '"eventTarget"' },
          { type: '"buffOwner"' },
          { type: '"buffSource"' },
          { type: '"controlledOperator"' },
          { type: '"currentAbilityEntity"' },
          { type: '"eventSource"' },
          { type: '"currentTarget"' },
          { type: '"actionInputTarget"' },
        ],
      },
      { type: '"actionInputTarget"' },
    ],
  },
  source: ['packages/game-data-contract/src/conditions.ts:371:7'],
  description: '要统计 Buff 的对象。',
} as const;
const definitionSchemaPart_8c6e8adb20f556aa = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/skills.ts:112:9'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/skills.ts:95:7'],
          description: '生成实体时读取的实体黑板键。',
        },
        fallback: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/skills.ts:97:7'],
          description: '黑板没有该键时使用的模板默认值。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; readonly fallback: number; }' },
      source: ['packages/game-data-contract/src/skills.ts:112:9'],
    },
  ],
  semantics: {
    type: 'AbilityEntityDefinitionNumber',
    unionVariants: [
      { type: 'number' },
      { type: '{ readonly blackboardKey: string; readonly fallback: number; }' },
    ],
  },
  source: ['packages/game-data-contract/src/skills.ts:112:9'],
  description: '创建后持续的秒数。',
} as const;
const definitionSchemaPart_d56a3cb6d02e1c92 = {
  kind: {
    kind: 'enum',
    options: ['compoundStatus'],
    semantics: { type: '"compoundStatus"' },
    source: ['packages/game-data-contract/src/buffs.ts:450:7'],
    description: '消耗已有元素附着后形成的复合状态。',
  },
  consumedElement: {
    kind: 'enum',
    options: ['heat', 'cryo', 'electric', 'nature'],
    semantics: {
      type: '"heat" | "cryo" | "electric" | "nature"',
      unionVariants: [
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
      ],
    },
    source: ['packages/game-data-contract/src/buffs.ts:452:7'],
    description: '被消耗的已有附着元素。',
  },
  incomingElement: {
    kind: 'enum',
    options: ['heat', 'cryo', 'electric', 'nature'],
    semantics: {
      type: '"heat" | "cryo" | "electric" | "nature"',
      unionVariants: [
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
      ],
    },
    source: ['packages/game-data-contract/src/buffs.ts:454:7'],
    description: '本次新加入的元素。',
  },
} as const;
const definitionSchemaPart_c0d4bb8ae5047bcb = {
  kind: 'union',
  variants: [
    {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/buffs.ts:609:3'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['all', 'main', 'secondary'],
          semantics: {
            type: '"all" | "main" | "secondary"',
            unionVariants: [{ type: '"main"' }, { type: '"secondary"' }, { type: '"all"' }],
          },
          source: ['packages/game-data-contract/src/buffs.ts:613:9'],
          description: '相对属性选择方式。',
        },
      },
      semantics: { type: '{ readonly kind: "all" | "main" | "secondary"; }' },
      source: ['packages/game-data-contract/src/buffs.ts:609:3'],
    },
  ],
  semantics: {
    type: 'string | { readonly kind: "all" | "main" | "secondary"; }',
    unionVariants: [
      { type: 'string' },
      { type: '{ readonly kind: "all" | "main" | "secondary"; }' },
    ],
  },
  source: ['packages/game-data-contract/src/buffs.ts:609:3'],
  description: '指定属性名称，或在应用时按持有者选择主属性、副属性或全部四维。',
} as const;
const definitionSchemaPart_2a78376690f2676a = {
  kind: {
    kind: 'enum',
    options: ['spGained'],
    semantics: { type: '"spGained"' },
    source: ['packages/game-data-contract/src/actions.ts:1727:7'],
    description: '触发器种类判别值。',
  },
  source: {
    kind: 'enum',
    options: ['normalAttack', 'powerAttack', 'default', 'skill'],
    semantics: {
      type: '"normalAttack" | "powerAttack" | "default" | "skill" | undefined',
      optional: true,
      unionVariants: [
        { type: '"normalAttack"' },
        { type: '"powerAttack"' },
        { type: '"default"' },
        { type: '"skill"' },
      ],
    },
    source: ['packages/game-data-contract/src/actions.ts:1729:7'],
    optional: true,
    description: '只监听指定的技力来源。',
  },
  gainKind: {
    kind: 'enum',
    options: ['gain', 'refund'],
    semantics: {
      type: '"gain" | "refund" | undefined',
      optional: true,
      unionVariants: [{ type: '"gain"' }, { type: '"refund"' }],
    },
    source: ['packages/game-data-contract/src/actions.ts:1731:7'],
    optional: true,
    description: '只监听正常获取或返还。',
  },
} as const;
const definitionSchemaPart_08a7754e5a1d221a = {
  kind: 'record',
  value: {
    kind: 'union',
    variants: [
      {
        kind: 'null',
        semantics: { type: 'null' },
        source: ['packages/game-data-contract/src/buffs.ts:710:3'],
      },
      {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/buffs.ts:710:3'],
      },
      {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/buffs.ts:710:3'],
      },
    ],
    semantics: {
      type: 'ActionBlackboardValue',
      unionVariants: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
    },
    source: ['packages/game-data-contract/src/buffs.ts:710:3'],
  },
  semantics: {
    type: 'Readonly<Record<string, ActionBlackboardValue>> | undefined',
    recordValue: {
      type: 'ActionBlackboardValue',
      unionVariants: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
    },
    optional: true,
  },
  source: ['packages/game-data-contract/src/buffs.ts:710:3'],
  optional: true,
  description: '每个 Buff 实例的初始黑板值；施加动作可以覆盖这些值，其他字段也可从中取数。',
} as const;
const definitionSchemaPart_d0762afe328826ec = {
  kind: {
    kind: 'enum',
    options: ['actionInputTargetIdentityMatch'],
    semantics: { type: '"actionInputTargetIdentityMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:247:7'],
    description: '比较原生事件动作 InputTarget 与 ActionSource/ActionOwner/当前主控身份。',
  },
  other: {
    kind: 'enum',
    options: ['controlledOperator', 'actionSource', 'actionOwner'],
    semantics: {
      type: '"controlledOperator" | "actionSource" | "actionOwner"',
      unionVariants: [
        { type: '"actionSource"' },
        { type: '"actionOwner"' },
        { type: '"controlledOperator"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:249:7'],
    description: '与输入目标比较的另一个对象身份。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual'],
    semantics: {
      type: '"equal" | "notEqual"',
      unionVariants: [{ type: '"equal"' }, { type: '"notEqual"' }],
    },
    source: ['packages/game-data-contract/src/conditions.ts:251:7'],
    description: '判断两者相同或不同。',
  },
} as const;
const definitionSchemaPart_c2b1be68fd172949 = {
  kind: 'enum',
  options: [
    'enemy',
    'caster',
    'buffOwner',
    'buffSource',
    'controlledOperator',
    'currentTarget',
    'actionInputTarget',
    'lowestHealthRatioOperator',
    'lowestHealthRatioOperatorExceptControlled',
    'contextTarget',
  ],
  semantics: {
    type: '"enemy" | "caster" | "buffOwner" | "buffSource" | "controlledOperator" | "currentTarget" | "actionInputTarget" | "lowestHealthRatioOperator" | "lowestHealthRatioOperatorExceptControlled" | "contextTarget"',
    unionVariants: [
      { type: '"enemy" | "caster"', unionVariants: [{ type: '"enemy"' }, { type: '"caster"' }] },
      {
        type: '"enemy" | "caster" | "buffOwner" | "buffSource" | "controlledOperator" | "currentTarget" | "actionInputTarget" | "lowestHealthRatioOperator" | "lowestHealthRatioOperatorExceptControlled" | "contextTarget"',
      },
    ],
  },
  source: ['packages/game-data-contract/src/conditions.ts:129:7'],
  description: '要检查的对象。',
} as const;
const definitionSchemaPart_73e4a567edc0f31b = {
  kind: {
    kind: 'enum',
    options: ['eventProjectileIgnoreImmuneLevelCompare'],
    semantics: { type: '"eventProjectileIgnoreImmuneLevelCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:213:7'],
    description: '比较当前命中角色的投射物免疫忽略等级。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:215:7'],
    description: '原生 CheckProjectileIgnoreImmuneLevel.checkType。',
  },
  value: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/conditions.ts:217:7'],
    description: '原生免疫忽略等级枚举的整数值。',
  },
} as const;
const definitionSchemaPart_f2f764024e57216e = {
  kind: 'object',
  fields: definitionSchemaPart_4248cca6ba943864,
  semantics: {
    type: '{ kind: "globalCooldownPresent"; target: "caster" | "buffOwner" | "buffSource"; markerId: string; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_fb8d30ed1187c4c8 = {
  kind: {
    kind: 'enum',
    options: ['tag'],
    semantics: { type: '"tag"' },
    source: ['packages/game-data-contract/src/conditions.ts:184:13'],
    description: '按 Buff 标签查找。',
  },
  tagQueryType: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:186:13'],
    description: '标签集合匹配方式。',
  },
  buffTags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:188:13'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:188:13'],
    description: '参与匹配的 Buff 标签。',
  },
} as const;
const definitionSchemaPart_dee0d83832cbb6cd = {
  kind: 'object',
  fields: definitionSchemaPart_4248cca6ba943864,
  semantics: {
    type: '{ kind: "globalCooldownPresent"; target: "caster" | "buffOwner" | "buffSource"; markerId: string; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_e21f4ca3f156e7ea = {
  kind: 'object',
  fields: definitionSchemaPart_4248cca6ba943864,
  semantics: {
    type: '{ kind: "globalCooldownPresent"; target: "caster" | "buffOwner" | "buffSource"; markerId: string; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_f2b71ea148e2ee3a = {
  kind: 'object',
  fields: definitionSchemaPart_4248cca6ba943864,
  semantics: {
    type: '{ kind: "globalCooldownPresent"; target: "caster" | "buffOwner" | "buffSource"; markerId: string; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_c27555e6a735887b = {
  kind: 'object',
  fields: definitionSchemaPart_4248cca6ba943864,
  semantics: {
    type: '{ kind: "globalCooldownPresent"; target: "caster" | "buffOwner" | "buffSource"; markerId: string; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_7304eeda7e1ab432 = {
  type: 'readonly ("invalid" | "character" | "enemy" | "interactive" | "projectile" | "factoryRegion" | "npc" | "abilityEntity" | "cinematicEntity" | "remoteFactoryEntity" | "creature" | "godEntity" | "enemyPart" | "socialBuilding")[]',
  arrayElement: definitionSchemaPart_e7879278d07d8266,
} as const;
const definitionSchemaPart_10cbe8e610a97f4e = {
  kind: 'array',
  element: {
    kind: 'enum',
    options: ['guard', 'caster', 'defender', 'vanguard', 'supporter', 'striker'],
    semantics: {
      type: '"guard" | "caster" | "defender" | "vanguard" | "supporter" | "striker"',
      unionVariants: [
        { type: '"guard"' },
        { type: '"caster"' },
        { type: '"defender"' },
        { type: '"vanguard"' },
        { type: '"supporter"' },
        { type: '"striker"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:88:7'],
  },
  semantics: {
    type: 'readonly ("guard" | "caster" | "defender" | "vanguard" | "supporter" | "striker")[]',
    arrayElement: {
      type: '"guard" | "caster" | "defender" | "vanguard" | "supporter" | "striker"',
      unionVariants: [
        { type: '"guard"' },
        { type: '"caster"' },
        { type: '"defender"' },
        { type: '"vanguard"' },
        { type: '"supporter"' },
        { type: '"striker"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/conditions.ts:88:7'],
  description: '任一匹配即可成立的职业。',
} as const;
const definitionSchemaPart_dc858d20850053a0 = {
  kind: {
    kind: 'enum',
    options: ['eventHealTagsMatch'],
    semantics: { type: '"eventHealTagsMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:543:7'],
    description: '匹配当前治疗事件携带的原生治疗标签。',
  },
  match: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:545:7'],
    description: '标签集合匹配方式。',
  },
  tags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:547:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:547:7'],
    description: '参与匹配的治疗标签。',
  },
} as const;
const definitionSchemaPart_05dd5523e81ede20 = {
  startFrame: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/skills.ts:250:3'],
    description: '窗口起始帧，包含该帧。',
  },
  endFrame: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/skills.ts:252:3'],
    description: '窗口结束帧。',
  },
  input: {
    kind: 'enum',
    options: ['basicAttack'],
    semantics: { type: '"basicAttack"' },
    source: ['packages/game-data-contract/src/skills.ts:254:3'],
    description: '此窗口覆盖的玩家操作。',
  },
  targetSkillId: {
    kind: 'union',
    variants: [
      {
        kind: 'null',
        semantics: { type: 'null' },
        source: ['packages/game-data-contract/src/skills.ts:256:3'],
      },
      {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/skills.ts:256:3'],
      },
    ],
    semantics: { type: 'string | null', unionVariants: [{ type: 'string' }, { type: 'null' }] },
    source: ['packages/game-data-contract/src/skills.ts:256:3'],
    description: '空值是原生的“该窗口没有直接技能路由”，不得回退为基础技能。',
  },
} as const;
const definitionSchemaPart_11030d46dd898a38 = {
  kind: 'enum',
  options: [
    'invalid',
    'character',
    'enemy',
    'interactive',
    'projectile',
    'factoryRegion',
    'npc',
    'abilityEntity',
    'cinematicEntity',
    'remoteFactoryEntity',
    'creature',
    'godEntity',
    'enemyPart',
    'socialBuilding',
  ],
  semantics: definitionSchemaPart_e7879278d07d8266,
  source: ['packages/game-data-contract/src/conditions.ts:237:7'],
} as const;
const definitionSchemaPart_692797c5ef99e89a = {
  kind: 'enum',
  options: [
    'invalid',
    'character',
    'enemy',
    'interactive',
    'projectile',
    'factoryRegion',
    'npc',
    'abilityEntity',
    'cinematicEntity',
    'remoteFactoryEntity',
    'creature',
    'godEntity',
    'enemyPart',
    'socialBuilding',
  ],
  semantics: definitionSchemaPart_e7879278d07d8266,
  source: ['packages/game-data-contract/src/conditions.ts:243:7'],
} as const;
const definitionSchemaPart_b8a3a0fe97ccf24d = {
  kind: 'object',
  fields: definitionSchemaPart_844722dc286f4c61,
  semantics: {
    type: '{ kind: "elementalReactionActive"; reaction: "electrification" | "corrosion"; minimumLevel?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_63b6f92d67c62db3 = {
  kind: 'object',
  fields: definitionSchemaPart_844722dc286f4c61,
  semantics: {
    type: '{ kind: "elementalReactionActive"; reaction: "electrification" | "corrosion"; minimumLevel?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_87a5396df99c57cb = {
  kind: 'object',
  fields: definitionSchemaPart_844722dc286f4c61,
  semantics: {
    type: '{ kind: "elementalReactionActive"; reaction: "electrification" | "corrosion"; minimumLevel?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_e5c6f48eda975862 = {
  kind: 'object',
  fields: definitionSchemaPart_844722dc286f4c61,
  semantics: {
    type: '{ kind: "elementalReactionActive"; reaction: "electrification" | "corrosion"; minimumLevel?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_fec9f419aafc6b58 = {
  kind: 'object',
  fields: definitionSchemaPart_844722dc286f4c61,
  semantics: {
    type: '{ kind: "elementalReactionActive"; reaction: "electrification" | "corrosion"; minimumLevel?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_fd32199cc4c85205 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/skills.ts:122:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/skills.ts:95:7'],
          description: '生成实体时读取的实体黑板键。',
        },
        fallback: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/skills.ts:97:7'],
          description: '黑板没有该键时使用的模板默认值。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; readonly fallback: number; }' },
      source: ['packages/game-data-contract/src/skills.ts:122:3'],
    },
  ],
  semantics: {
    type: 'AbilityEntityDefinitionNumber | undefined',
    optional: true,
    unionVariants: [
      { type: 'number' },
      { type: '{ readonly blackboardKey: string; readonly fallback: number; }' },
    ],
  },
  source: ['packages/game-data-contract/src/skills.ts:122:3'],
  optional: true,
  description: '正数时，同模板新实例会按原生 Group.Add 语义同步释放最早实例。',
} as const;
const definitionSchemaPart_3c9a29b65f5f7699 = {
  kind: 'object',
  fields: definitionSchemaPart_7f9cd384fd747fa0,
  semantics: { type: '{ kind: "enemyRankIn"; ranks: readonly ("mob" | "elite" | "boss")[]; }' },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_565a919d99ffe6df = {
  kind: 'object',
  fields: definitionSchemaPart_7f9cd384fd747fa0,
  semantics: { type: '{ kind: "enemyRankIn"; ranks: readonly ("mob" | "elite" | "boss")[]; }' },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_64714dce6e9dea33 = {
  kind: 'object',
  fields: definitionSchemaPart_7f9cd384fd747fa0,
  semantics: { type: '{ kind: "enemyRankIn"; ranks: readonly ("mob" | "elite" | "boss")[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_d6c123cf208c03ab = {
  kind: 'object',
  fields: definitionSchemaPart_7f9cd384fd747fa0,
  semantics: { type: '{ kind: "enemyRankIn"; ranks: readonly ("mob" | "elite" | "boss")[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_152c280826449377 = {
  kind: 'object',
  fields: definitionSchemaPart_7f9cd384fd747fa0,
  semantics: { type: '{ kind: "enemyRankIn"; ranks: readonly ("mob" | "elite" | "boss")[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_95b1358b863778a7 = {
  kind: 'object',
  fields: definitionSchemaPart_5c80980ab0310678,
  semantics: {
    type: '{ kind: "eventBuffIdMatch"; buffIds: readonly string[]; buffIdOutputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_49a9c6b38ff16aca = {
  kind: 'object',
  fields: definitionSchemaPart_5c80980ab0310678,
  semantics: {
    type: '{ kind: "eventBuffIdMatch"; buffIds: readonly string[]; buffIdOutputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_0ef0e54d0c17f971 = {
  kind: 'object',
  fields: definitionSchemaPart_5c80980ab0310678,
  semantics: {
    type: '{ kind: "eventBuffIdMatch"; buffIds: readonly string[]; buffIdOutputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_2a63a5498f597e91 = {
  kind: 'object',
  fields: definitionSchemaPart_5c80980ab0310678,
  semantics: {
    type: '{ kind: "eventBuffIdMatch"; buffIds: readonly string[]; buffIdOutputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_f7d949d387e7429c = {
  kind: 'object',
  fields: definitionSchemaPart_5c80980ab0310678,
  semantics: {
    type: '{ kind: "eventBuffIdMatch"; buffIds: readonly string[]; buffIdOutputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_5ac70f0f12c6e08a = {
  kind: 'object',
  fields: definitionSchemaPart_ba98ef5e38825c91,
  semantics: { type: 'SkillCostDefinition' },
  source: ['packages/game-data-contract/src/skills.ts:337:3'],
} as const;
const definitionSchemaPart_696ddc5ee252e88d = {
  type: 'readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | "comboSkill" | "ultimateSkill" | "plungingAttack" | "dashAttack" | "fireBurst" | "electricBurst" | ... 5 more ... | "natureAbnormal")[]',
  arrayElement: definitionSchemaPart_1fbfd66386e805e7,
} as const;
const definitionSchemaPart_f779ba4f5e7ae4b7 = {
  type: 'CombatObjectTypeSelection',
  unionVariants: [definitionSchemaPart_7304eeda7e1ab432, { type: '"all"' }],
} as const;
const definitionSchemaPart_38c022b612b019d6 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:696:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:288:7'],
          description: '读取优先级的 Buff 黑板键。',
        },
        negate: {
          kind: 'boolean',
          semantics: { type: 'boolean | undefined', optional: true },
          source: ['packages/game-data-contract/src/buffs.ts:290:7'],
          optional: true,
          description: '是否对读到的数值取负。',
        },
      },
      semantics: {
        type: '{ readonly blackboardKey: string; readonly negate?: boolean | undefined; }',
      },
      source: ['packages/game-data-contract/src/buffs.ts:696:3'],
    },
  ],
  semantics: {
    type: 'BuffPriority | undefined',
    optional: true,
    unionVariants: [
      { type: 'number' },
      { type: '{ readonly blackboardKey: string; readonly negate?: boolean | undefined; }' },
    ],
  },
  source: ['packages/game-data-contract/src/buffs.ts:696:3'],
  optional: true,
  description: '仅两种高优先级模式读取此值决定启用顺序；Stack 使用剩余寿命与实例编号选择替换项。',
} as const;
const definitionSchemaPart_372daf15f4884d97 = {
  kind: 'array',
  element: definitionSchemaPart_a06af490901715f4,
  semantics: {
    type: 'readonly ScheduledSequenceDefinition[]',
    arrayElement: { type: 'ScheduledSequenceDefinition' },
  },
  source: ['packages/game-data-contract/src/skills.ts:44:3'],
  description: '按技能局部帧安排的动作序列。',
} as const;
const definitionSchemaPart_a9a772ea32598b9c = {
  kind: 'array',
  element: definitionSchemaPart_25d1337c4d94d6ee,
  semantics: {
    type: 'readonly ScheduledSequenceDefinition[]',
    arrayElement: { type: 'ScheduledSequenceDefinition' },
  },
  source: ['packages/game-data-contract/src/actions.ts:1802:3'],
  description: '相对事件时刻调度的动作序列。',
} as const;
const definitionSchemaPart_7a7767ce498ce0b3 = {
  type: '"physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]',
  unionVariants: [
    {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
        { type: '"true"' },
        { type: '"lifeDrain"' },
        { type: '"ether"' },
      ],
    },
    {
      type: 'readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]',
      arrayElement: {
        type: '"physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether"',
        unionVariants: [
          { type: '"physical"' },
          { type: '"heat"' },
          { type: '"cryo"' },
          { type: '"electric"' },
          { type: '"nature"' },
          { type: '"true"' },
          { type: '"lifeDrain"' },
          { type: '"ether"' },
        ],
      },
    },
  ],
} as const;
const definitionSchemaPart_106b373694ee6d14 = {
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
  semantics: definitionSchemaPart_cba6850ee91f973f,
  source: ['packages/game-data-contract/src/buffs.ts:692:3'],
  description: '再次施加同一叠加组的 Buff 时，决定新建实例、加层、刷新时长或拒绝施加。',
} as const;
const definitionSchemaPart_2849ca85eb4e177f = {
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
  semantics: definitionSchemaPart_6b0f25522f2c2aa4,
  source: ['packages/game-data-contract/src/buildModifiers.ts:70:5'],
  description: '要修改的面板属性。',
} as const;
const definitionSchemaPart_5df3dba05d39ed46 = {
  kind: 'object',
  fields: definitionSchemaPart_9a64911eead5a349,
  semantics: {
    type: '{ kind: "statusActive"; statusKey: string; target: "enemy" | "caster"; minimumStacks?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_a7ee1d65fa32bff8 = {
  kind: 'object',
  fields: definitionSchemaPart_9a64911eead5a349,
  semantics: {
    type: '{ kind: "statusActive"; statusKey: string; target: "enemy" | "caster"; minimumStacks?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_03d64d69050b442c = {
  kind: 'object',
  fields: definitionSchemaPart_9a64911eead5a349,
  semantics: {
    type: '{ kind: "statusActive"; statusKey: string; target: "enemy" | "caster"; minimumStacks?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_428b72851e6fc237 = {
  kind: 'object',
  fields: definitionSchemaPart_9a64911eead5a349,
  semantics: {
    type: '{ kind: "statusActive"; statusKey: string; target: "enemy" | "caster"; minimumStacks?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_2867e61eaaa76b88 = {
  kind: 'object',
  fields: definitionSchemaPart_9a64911eead5a349,
  semantics: {
    type: '{ kind: "statusActive"; statusKey: string; target: "enemy" | "caster"; minimumStacks?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_868548306e77bc1b = {
  kind: 'array',
  element: definitionSchemaPart_dd2d48f93137078f,
  semantics: {
    type: 'readonly SkillAllowedNextWindow[] | undefined',
    arrayElement: { type: 'SkillAllowedNextWindow' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/skills.ts:325:5'],
  optional: true,
  description: '在指定帧段内允许提前接续的技能。',
} as const;
const definitionSchemaPart_56699325e6316be7 = {
  kind: {
    kind: 'enum',
    options: ['eventDamageGameplayTagsMatch'],
    semantics: { type: '"eventDamageGameplayTagsMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:423:7'],
    description: '匹配伤害包 DamageUnit.damageTags 的原生 GameplayTag。',
  },
  match: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll', 'exact'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
        { type: '"exact"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:425:7'],
    description: '标签集合匹配方式。',
  },
  tags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:427:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:427:7'],
    description: '参与匹配的原生伤害 GameplayTag。',
  },
} as const;
const definitionSchemaPart_85962b497c97c7e0 = {
  kind: 'object',
  fields: definitionSchemaPart_6d2cd0a66f1df181,
  semantics: {
    type: '{ readonly kind: "healTagsMatch"; readonly match: "hasAny" | "hasAll"; readonly tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:351:3'],
} as const;
const definitionSchemaPart_d43db2ccc8c756ae = {
  kind: {
    kind: 'enum',
    options: ['contextTargetIdentityMatch'],
    semantics: { type: '"contextTargetIdentityMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:255:7'],
    description: '比较命名 Context 中首个目标与动作身份；连携的 trigger 也走同一目标组协议。',
  },
  contextKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:257:7'],
    description: '动作环境中的目标组名称。',
  },
  other: {
    kind: 'enum',
    options: ['controlledOperator', 'actionSource', 'actionOwner'],
    semantics: {
      type: '"controlledOperator" | "actionSource" | "actionOwner"',
      unionVariants: [
        { type: '"actionSource"' },
        { type: '"actionOwner"' },
        { type: '"controlledOperator"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:259:7'],
    description: '与组内首个目标比较的对象身份。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual'],
    semantics: {
      type: '"equal" | "notEqual"',
      unionVariants: [{ type: '"equal"' }, { type: '"notEqual"' }],
    },
    source: ['packages/game-data-contract/src/conditions.ts:261:7'],
    description: '判断两者相同或不同。',
  },
} as const;
const definitionSchemaPart_74a9986f57845bec = {
  kind: 'array',
  element: {
    kind: 'enum',
    options: ['physical', 'heat', 'cryo', 'electric', 'nature', 'true', 'lifeDrain', 'ether'],
    semantics: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
        { type: '"true"' },
        { type: '"lifeDrain"' },
        { type: '"ether"' },
      ],
    },
    source: ['packages/game-data-contract/src/buildModifiers.ts:79:5'],
  },
  semantics: {
    type: 'readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]',
    arrayElement: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
        { type: '"true"' },
        { type: '"lifeDrain"' },
        { type: '"ether"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/buildModifiers.ts:79:5'],
} as const;
const definitionSchemaPart_721b4e37bd155546 = {
  kind: 'object',
  fields: definitionSchemaPart_18d2ad679f5e08f0,
  semantics: { type: 'SkillGroupPlacementPolicy | undefined', optional: true },
  source: ['packages/game-data-contract/src/skills.ts:436:3'],
  optional: true,
  description: '此形态自己的技能链展开规则。',
} as const;
const definitionSchemaPart_5a14d86583466d7b = {
  kind: 'union',
  variants: [
    {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: {
        type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
      },
      source: ['packages/game-data-contract/src/skills.ts:400:3'],
    },
    {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: {
        type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }',
      },
      source: ['packages/game-data-contract/src/skills.ts:400:3'],
    },
  ],
  semantics: {
    type: 'SkillDefinition',
    unionVariants: [
      {
        type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
      },
      { type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }' },
    ],
  },
  source: ['packages/game-data-contract/src/skills.ts:400:3'],
} as const;
const definitionSchemaPart_84e5afb09208bcca = {
  kind: 'union',
  variants: [
    {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: {
        type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
      },
      source: ['packages/game-data-contract/src/skills.ts:417:3'],
    },
    {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: {
        type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }',
      },
      source: ['packages/game-data-contract/src/skills.ts:417:3'],
    },
  ],
  semantics: {
    type: 'SkillDefinition',
    unionVariants: [
      {
        type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
      },
      { type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }' },
    ],
  },
  source: ['packages/game-data-contract/src/skills.ts:417:3'],
} as const;
const definitionSchemaPart_e262f3bd7838bbef = {
  kind: 'union',
  variants: [
    {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: {
        type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
      },
      source: ['packages/game-data-contract/src/skills.ts:442:3'],
    },
    {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: {
        type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }',
      },
      source: ['packages/game-data-contract/src/skills.ts:442:3'],
    },
  ],
  semantics: {
    type: 'SkillDefinition',
    unionVariants: [
      {
        type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
      },
      { type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }' },
    ],
  },
  source: ['packages/game-data-contract/src/skills.ts:442:3'],
} as const;
const definitionSchemaPart_e127e0e571a81a37 = {
  kind: 'object',
  fields: definitionSchemaPart_18d2ad679f5e08f0,
  semantics: { type: 'SkillGroupPlacementPolicy | undefined', optional: true },
  source: ['packages/game-data-contract/src/skills.ts:394:3'],
  optional: true,
  description: '编辑器一次放置整个技能组时采用的展开规则。',
} as const;
const definitionSchemaPart_d9327c6391670d04 = {
  kind: 'object',
  fields: definitionSchemaPart_be3d2598d1118bbf,
  semantics: {
    type: '{ readonly kind: "all"; readonly conditions: readonly PoiseModifierCondition[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:391:7'],
} as const;
const definitionSchemaPart_718eac4caaeb1771 = {
  kind: {
    kind: 'enum',
    options: ['limited'],
    semantics: { type: '"limited"' },
    source: ['packages/game-data-contract/src/skills.ts:110:9'],
    description: '生命周期种类判别值。',
  },
  durationSeconds: definitionSchemaPart_8c6e8adb20f556aa,
} as const;
const definitionSchemaPart_7bbeadd68c18d661 = {
  kind: 'object',
  fields: definitionSchemaPart_1f421d36bbaebcf3,
  semantics: {
    type: '{ kind: "eventOverheal"; overHealKey?: string | undefined; finalHealKey?: string | undefined; realHealKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_b1848ed51895cf33 = {
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
  semantics: definitionSchemaPart_1fbfd66386e805e7,
  source: ['packages/game-data-contract/src/modifiers.ts:141:7'],
} as const;
const definitionSchemaPart_7ae43a42d05eb6fe = {
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
  semantics: definitionSchemaPart_1fbfd66386e805e7,
  source: ['packages/game-data-contract/src/modifiers.ts:385:7'],
} as const;
const definitionSchemaPart_adb97aeec0e7ba16 = {
  kind: 'object',
  fields: definitionSchemaPart_1f421d36bbaebcf3,
  semantics: {
    type: '{ kind: "eventOverheal"; overHealKey?: string | undefined; finalHealKey?: string | undefined; realHealKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_2d7d8c95ede920b5 = {
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
  semantics: definitionSchemaPart_1fbfd66386e805e7,
  source: ['packages/game-data-contract/src/conditions.ts:419:7'],
} as const;
const definitionSchemaPart_a129bb5f74be3317 = {
  kind: 'array',
  element: {
    kind: 'enum',
    options: ['physical', 'heat', 'cryo', 'electric', 'nature', 'true', 'lifeDrain', 'ether'],
    semantics: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
        { type: '"true"' },
        { type: '"lifeDrain"' },
        { type: '"ether"' },
      ],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:155:7'],
  },
  semantics: {
    type: 'readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]',
    arrayElement: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
        { type: '"true"' },
        { type: '"lifeDrain"' },
        { type: '"ether"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/modifiers.ts:155:7'],
  description: '任一匹配即可成立的伤害类型。',
} as const;
const definitionSchemaPart_e28ec883386c5f9a = {
  kind: 'object',
  fields: definitionSchemaPart_1f421d36bbaebcf3,
  semantics: {
    type: '{ kind: "eventOverheal"; overHealKey?: string | undefined; finalHealKey?: string | undefined; realHealKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_c103184483264681 = {
  kind: 'object',
  fields: definitionSchemaPart_1f421d36bbaebcf3,
  semantics: {
    type: '{ kind: "eventOverheal"; overHealKey?: string | undefined; finalHealKey?: string | undefined; realHealKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_013f8d0510474da5 = {
  kind: 'object',
  fields: definitionSchemaPart_1f421d36bbaebcf3,
  semantics: {
    type: '{ kind: "eventOverheal"; overHealKey?: string | undefined; finalHealKey?: string | undefined; realHealKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_8ad39272167a1eea = {
  kind: 'array',
  element: {
    kind: 'enum',
    options: ['physical', 'heat', 'cryo', 'electric', 'nature', 'true', 'lifeDrain', 'ether'],
    semantics: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
        { type: '"true"' },
        { type: '"lifeDrain"' },
        { type: '"ether"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:441:7'],
  },
  semantics: {
    type: 'readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]',
    arrayElement: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
        { type: '"true"' },
        { type: '"lifeDrain"' },
        { type: '"ether"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/conditions.ts:441:7'],
  description: '任一匹配即可成立的伤害类型。',
} as const;
const definitionSchemaPart_e62d253df519fb11 = {
  type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge" | readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]',
  unionVariants: [
    {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
    {
      type: 'readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]',
      arrayElement: {
        type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
        unionVariants: [
          { type: '"comboSkill"' },
          { type: '"plungingAttack"' },
          { type: '"basicAttack"' },
          { type: '"battleSkill"' },
          { type: '"ultimate"' },
          { type: '"finisher"' },
          { type: '"dodge"' },
        ],
      },
    },
  ],
} as const;
const definitionSchemaPart_146f1cb483b49d25 = {
  kind: {
    kind: 'enum',
    options: ['contextFlagEquals'],
    semantics: { type: '"contextFlagEquals"' },
    source: ['packages/game-data-contract/src/conditions.ts:153:7'],
    description: '比较动作环境中的一个标志值。',
  },
  flag: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:155:7'],
    description: '要读取的标志名称。',
  },
  value: definitionSchemaPart_6bcf600ee9301e08,
} as const;
const definitionSchemaPart_011d08ae5a422bae = {
  kind: 'object',
  fields: definitionSchemaPart_05dd5523e81ede20,
  semantics: { type: 'SkillInputCommandMappingWindow' },
  source: ['packages/game-data-contract/src/skills.ts:323:5'],
} as const;
const definitionSchemaPart_0e46df2295fd8cae = {
  kind: {
    kind: 'enum',
    options: ['staticHealingIncrease'],
    semantics: { type: '"staticHealingIncrease"' },
    source: ['packages/game-data-contract/src/buildModifiers.ts:99:5'],
    description: '修正种类判别值。',
  },
  target: {
    kind: 'enum',
    options: ['output', 'taken'],
    semantics: {
      type: '"output" | "taken"',
      unionVariants: [{ type: '"output"' }, { type: '"taken"' }],
    },
    source: ['packages/game-data-contract/src/buildModifiers.ts:101:5'],
    description: '`output` 修改治疗输出，`taken` 修改受到的治疗。',
  },
  value: {
    kind: 'union',
    variants: [
      {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/buildModifiers.ts:103:5'],
      },
      {
        kind: 'array',
        element: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/buildModifiers.ts:103:5'],
        },
        semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
        source: ['packages/game-data-contract/src/buildModifiers.ts:103:5'],
      },
    ],
    semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
    source: ['packages/game-data-contract/src/buildModifiers.ts:103:5'],
    description: '单个加成值或按等级排列的加成值。',
  },
} as const;
const definitionSchemaPart_985f817a124200e4 = {
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
  semantics: definitionSchemaPart_1fbfd66386e805e7,
  source: ['packages/game-data-contract/src/actions.ts:1738:7'],
  description: '要匹配的伤害标签。',
} as const;
const definitionSchemaPart_3c7d15f38886628b = {
  kind: 'union',
  variants: [
    {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: {
        type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
      },
      source: ['packages/game-data-contract/src/skills.ts:448:3'],
    },
    {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: {
        type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }',
      },
      source: ['packages/game-data-contract/src/skills.ts:448:3'],
    },
  ],
  semantics: {
    type: 'SkillDefinition',
    unionVariants: [
      {
        type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
      },
      { type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }' },
    ],
  },
  source: ['packages/game-data-contract/src/skills.ts:448:3'],
  description: '已合并输入包装器资源规则、且拥有独立稳定 key 的执行定义。',
} as const;
const definitionSchemaPart_4bf37a186ec9ee55 = {
  type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge" | readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[] | undefined',
  optional: true,
  unionVariants: [
    {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
    {
      type: 'readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]',
      arrayElement: {
        type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
        unionVariants: [
          { type: '"comboSkill"' },
          { type: '"plungingAttack"' },
          { type: '"basicAttack"' },
          { type: '"battleSkill"' },
          { type: '"ultimate"' },
          { type: '"finisher"' },
          { type: '"dodge"' },
        ],
      },
    },
  ],
} as const;
const definitionSchemaPart_8b162eddac7cdcff = {
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
    semantics: {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
    source: ['packages/game-data-contract/src/buildModifiers.ts:81:5'],
  },
  semantics: {
    type: 'readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]',
    arrayElement: {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/buildModifiers.ts:81:5'],
} as const;
const definitionSchemaPart_a4cddd4d89db3386 = {
  kind: 'array',
  element: definitionSchemaPart_01e8691dbd1dfa72,
  semantics: {
    type: 'readonly SkillBuffSlotReplacement[] | undefined',
    arrayElement: { type: 'SkillBuffSlotReplacement' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/buffs.ts:151:3'],
  optional: true,
  description: '每次启用时换入、停用或结束时还原；生命周期归当前 Buff 实例所有。',
} as const;
const definitionSchemaPart_ecdba3f9c4a783c4 = {
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
    semantics: {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
    source: ['packages/game-data-contract/src/buildModifiers.ts:110:5'],
  },
  semantics: {
    type: 'readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]',
    arrayElement: {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/buildModifiers.ts:110:5'],
} as const;
const definitionSchemaPart_9dc9d3e55bb9aac9 = {
  kind: 'object',
  fields: definitionSchemaPart_4df30fd65f24bee2,
  semantics: {
    type: '{ kind: "ownerSpawnedAbilityEntityPresent"; abilityEntityIds?: readonly string[] | undefined; sameSourceSkillCast?: boolean | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_b19580ba3ee264ac = {
  kind: 'object',
  fields: definitionSchemaPart_4df30fd65f24bee2,
  semantics: {
    type: '{ kind: "ownerSpawnedAbilityEntityPresent"; abilityEntityIds?: readonly string[] | undefined; sameSourceSkillCast?: boolean | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_0846b9b6ffd20793 = {
  kind: 'object',
  fields: definitionSchemaPart_4df30fd65f24bee2,
  semantics: {
    type: '{ kind: "ownerSpawnedAbilityEntityPresent"; abilityEntityIds?: readonly string[] | undefined; sameSourceSkillCast?: boolean | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_39b86d5efce8b9ec = {
  kind: 'object',
  fields: definitionSchemaPart_4df30fd65f24bee2,
  semantics: {
    type: '{ kind: "ownerSpawnedAbilityEntityPresent"; abilityEntityIds?: readonly string[] | undefined; sameSourceSkillCast?: boolean | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_50ee7c7b6cd6e152 = {
  kind: 'object',
  fields: definitionSchemaPart_4df30fd65f24bee2,
  semantics: {
    type: '{ kind: "ownerSpawnedAbilityEntityPresent"; abilityEntityIds?: readonly string[] | undefined; sameSourceSkillCast?: boolean | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_6c28471eb02cbe2f = {
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
    semantics: {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:463:7'],
  },
  semantics: {
    type: 'readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]',
    arrayElement: {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/conditions.ts:463:7'],
  description: '任一匹配即可成立的技能分类。',
} as const;
const definitionSchemaPart_f2a6bac7c63abd7c = {
  kind: 'union',
  variants: [
    {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:403:7'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/primitives.ts:63:7'],
          description: '读取字符串的当前动作黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/conditions.ts:403:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['stringNode'],
          semantics: { type: '"stringNode"' },
          source: ['packages/game-data-contract/src/primitives.ts:67:7'],
          description: '绑定本图字符串表达式；各使用点仍读取各自当前动作上下文。',
        },
        nodeId: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/primitives.ts:68:7'],
        },
      },
      semantics: { type: '{ readonly kind: "stringNode"; readonly nodeId: string; }' },
      source: ['packages/game-data-contract/src/conditions.ts:403:7'],
    },
  ],
  semantics: { type: 'ActionStringOperand', aliases: ['ActionStringOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:403:7'],
  description: '标记 ID 或动作黑板中的标记 ID。',
} as const;
const definitionSchemaPart_cf7c525bed08e108 = {
  kind: 'union',
  variants: [
    {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:409:7'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/primitives.ts:63:7'],
          description: '读取字符串的当前动作黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/conditions.ts:409:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['stringNode'],
          semantics: { type: '"stringNode"' },
          source: ['packages/game-data-contract/src/primitives.ts:67:7'],
          description: '绑定本图字符串表达式；各使用点仍读取各自当前动作上下文。',
        },
        nodeId: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/primitives.ts:68:7'],
        },
      },
      semantics: { type: '{ readonly kind: "stringNode"; readonly nodeId: string; }' },
      source: ['packages/game-data-contract/src/conditions.ts:409:7'],
    },
  ],
  semantics: { type: 'ActionStringOperand', aliases: ['ActionStringOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:409:7'],
  description: '标记 ID 或动作黑板中的标记 ID。',
} as const;
const definitionSchemaPart_8301abcf5edc7867 = {
  kind: {
    kind: 'enum',
    options: ['contextTargetEntityTagMatch'],
    semantics: { type: '"contextTargetEntityTagMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:265:7'],
    description: '查询命名 Context 首个实体当前持有的 GameplayTag。',
  },
  contextKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:267:7'],
    description: '动作环境中的目标组名称。',
  },
  tagQueryType: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:269:7'],
    description: '标签集合匹配方式。',
  },
  tags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:271:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:271:7'],
    description: '参与匹配的实体标签。',
  },
} as const;
const definitionSchemaPart_40706b3285f99d15 = {
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
    semantics: {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:479:7'],
  },
  semantics: {
    type: 'readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]',
    arrayElement: {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/conditions.ts:479:7'],
  description: '任一匹配即可成立的当前技能分类。',
} as const;
const definitionSchemaPart_0c75681f20e34131 = {
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
    semantics: {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:485:7'],
  },
  semantics: {
    type: 'readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]',
    arrayElement: {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/conditions.ts:485:7'],
  description: '任一匹配即可成立的来源技能分类。',
} as const;
const definitionSchemaPart_4ecd3809d0bb8c0e = {
  kind: {
    kind: 'enum',
    options: ['eventInflictionElementIn'],
    semantics: { type: '"eventInflictionElementIn"' },
    source: ['packages/game-data-contract/src/conditions.ts:445:7'],
    description: '匹配触发当前响应的元素附着类型。',
  },
  elements: definitionSchemaPart_4c35aa9db4035582,
  outputKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:449:7'],
    optional: true,
    description: '命中后把原生元素编号写入已声明键；缺键报错，EntityBB_ 写入共享实体板。',
  },
} as const;
const definitionSchemaPart_56558def06a48384 = {
  kind: 'object',
  fields: definitionSchemaPart_fb8d30ed1187c4c8,
  semantics: {
    type: '{ kind: "tag"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:175:7'],
} as const;
const definitionSchemaPart_ff02e5f7f518d655 = {
  kind: 'object',
  fields: definitionSchemaPart_2a78376690f2676a,
  semantics: {
    type: '{ kind: "spGained"; source?: "normalAttack" | "powerAttack" | "default" | "skill" | undefined; gainKind?: "gain" | "refund" | undefined; }',
  },
  source: ['packages/game-data-contract/src/actions.ts:1798:3'],
} as const;
const definitionSchemaPart_cb10ab0155d51dba = {
  kind: 'object',
  fields: definitionSchemaPart_2a78376690f2676a,
  semantics: {
    type: '{ kind: "spGained"; source?: "normalAttack" | "powerAttack" | "default" | "skill" | undefined; gainKind?: "gain" | "refund" | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:109:9'],
} as const;
const definitionSchemaPart_2237302f2385cf2e = {
  kind: 'object',
  fields: definitionSchemaPart_d0762afe328826ec,
  semantics: {
    type: '{ kind: "actionInputTargetIdentityMatch"; other: "controlledOperator" | "actionSource" | "actionOwner"; operator: "equal" | "notEqual"; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_aad9b8bab354d453 = {
  kind: 'object',
  fields: definitionSchemaPart_d0762afe328826ec,
  semantics: {
    type: '{ kind: "actionInputTargetIdentityMatch"; other: "controlledOperator" | "actionSource" | "actionOwner"; operator: "equal" | "notEqual"; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_056300eb7a3f0a9c = {
  kind: 'object',
  fields: definitionSchemaPart_dc858d20850053a0,
  semantics: {
    type: '{ kind: "eventHealTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_1ca96bfc1c038220 = {
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
    semantics: {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
    source: ['packages/game-data-contract/src/skills.ts:347:5'],
  },
  semantics: {
    type: 'readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[] | undefined',
    arrayElement: {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
    optional: true,
  },
  source: ['packages/game-data-contract/src/skills.ts:347:5'],
  optional: true,
  description: '只在当前技能属于这些分类时启用旁路。',
} as const;
const definitionSchemaPart_ecdb54c187a7c946 = {
  kind: 'object',
  fields: definitionSchemaPart_d0762afe328826ec,
  semantics: {
    type: '{ kind: "actionInputTargetIdentityMatch"; other: "controlledOperator" | "actionSource" | "actionOwner"; operator: "equal" | "notEqual"; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_e47e7f9ee97a351e = {
  kind: 'object',
  fields: definitionSchemaPart_d0762afe328826ec,
  semantics: {
    type: '{ kind: "actionInputTargetIdentityMatch"; other: "controlledOperator" | "actionSource" | "actionOwner"; operator: "equal" | "notEqual"; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_4a7eef357a35f813 = {
  kind: 'object',
  fields: definitionSchemaPart_d0762afe328826ec,
  semantics: {
    type: '{ kind: "actionInputTargetIdentityMatch"; other: "controlledOperator" | "actionSource" | "actionOwner"; operator: "equal" | "notEqual"; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_5f5e02e97e78a1ed = {
  kind: 'object',
  fields: definitionSchemaPart_dc858d20850053a0,
  semantics: {
    type: '{ kind: "eventHealTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_33a752b85030eab1 = {
  kind: 'object',
  fields: definitionSchemaPart_dc858d20850053a0,
  semantics: {
    type: '{ kind: "eventHealTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_fe0fcf888628b50e = {
  kind: 'object',
  fields: definitionSchemaPart_dc858d20850053a0,
  semantics: {
    type: '{ kind: "eventHealTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_2bdcf28d4ce0e581 = {
  kind: 'object',
  fields: definitionSchemaPart_dc858d20850053a0,
  semantics: {
    type: '{ kind: "eventHealTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_d15d084e7f7ba5ed = {
  kind: {
    kind: 'enum',
    options: ['basicAttack'],
    semantics: { type: '"basicAttack"' },
    source: ['packages/game-data-contract/src/skills.ts:229:7'],
    description: '从普通攻击序列和当前操作模式中选技能。',
  },
  skillKeys: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/skills.ts:231:7'],
    },
    semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
    source: ['packages/game-data-contract/src/skills.ts:231:7'],
    description: '原生 normalAttackList、处决和下落等路径能够请求的技能全集。',
  },
  normalAttackSkillKeys: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/skills.ts:233:7'],
    },
    semantics: {
      type: 'readonly string[] | undefined',
      arrayElement: { type: 'string' },
      optional: true,
    },
    source: ['packages/game-data-contract/src/skills.ts:233:7'],
    optional: true,
    description: 'CharacterData.normalAttackList 给出的默认有序普攻连段，不包含处决和下落攻击。',
  },
  defaultSkillKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/skills.ts:235:7'],
    optional: true,
    description: '只有 SkillDataBundle/default mode 的命令映射已导入时才允许设置。',
  },
} as const;
const definitionSchemaPart_6c028ac302268150 = {
  kind: {
    kind: 'enum',
    options: ['eventBuffTagsMatch'],
    semantics: { type: '"eventBuffTagsMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:521:7'],
    description: '匹配触发当前响应的新施加 Buff 原生标签。',
  },
  match: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:523:7'],
    description: '标签集合匹配方式。',
  },
  buffTags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:525:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:525:7'],
    description: '参与匹配的新 Buff 标签。',
  },
  buffIdOutputKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:527:7'],
    optional: true,
    description: 'Advanced 条件命中后把事件 Buff ID 写入当前动作黑板。',
  },
} as const;
const definitionSchemaPart_57382ad7008ad10b = {
  kind: 'object',
  fields: definitionSchemaPart_d56a3cb6d02e1c92,
  semantics: {
    type: '{ readonly kind: "compoundStatus"; readonly consumedElement: "heat" | "cryo" | "electric" | "nature"; readonly incomingElement: "heat" | "cryo" | "electric" | "nature"; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:726:3'],
} as const;
const definitionSchemaPart_12bd425687c2e8b7 = {
  kind: {
    kind: 'enum',
    options: ['entityTagMatch'],
    semantics: { type: '"entityTagMatch"' },
    source: ['packages/game-data-contract/src/modifiers.ts:110:7'],
    description: '检查来源方或目标方的 GameplayTag。',
  },
  target: {
    kind: 'enum',
    options: ['enemy', 'caster'],
    semantics: {
      type: '"enemy" | "caster"',
      unionVariants: [{ type: '"enemy"' }, { type: '"caster"' }],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:112:7'],
    description: '要检查的对象。',
  },
  tagQueryType: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:114:7'],
    description: '标签集合的匹配方式。',
  },
  tags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/modifiers.ts:116:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/modifiers.ts:116:7'],
    description: '参与匹配的标签。',
  },
} as const;
const definitionSchemaPart_de1f152d6aed1615 = {
  kind: 'object',
  fields: definitionSchemaPart_73e4a567edc0f31b,
  semantics: {
    type: '{ kind: "eventProjectileIgnoreImmuneLevelCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_2fa7befc176641d7 = {
  kind: 'object',
  fields: definitionSchemaPart_73e4a567edc0f31b,
  semantics: {
    type: '{ kind: "eventProjectileIgnoreImmuneLevelCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_b869624d7946aa42 = {
  kind: 'object',
  fields: definitionSchemaPart_73e4a567edc0f31b,
  semantics: {
    type: '{ kind: "eventProjectileIgnoreImmuneLevelCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_0cc394e9ab6f3f95 = {
  kind: 'object',
  fields: definitionSchemaPart_73e4a567edc0f31b,
  semantics: {
    type: '{ kind: "eventProjectileIgnoreImmuneLevelCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_e52131cf5124b907 = {
  kind: 'object',
  fields: definitionSchemaPart_73e4a567edc0f31b,
  semantics: {
    type: '{ kind: "eventProjectileIgnoreImmuneLevelCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_bbf2083b36cab81b = {
  kind: {
    kind: 'enum',
    options: ['eventPhysicalInflictionTypeIn'],
    semantics: { type: '"eventPhysicalInflictionTypeIn"' },
    source: ['packages/game-data-contract/src/conditions.ts:453:7'],
    description: '匹配来源 AbilitySystem 即将输出的物理异常类型。',
  },
  types: definitionSchemaPart_6409833c07c1c60d,
  outputKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:457:7'],
    optional: true,
    description: '命中后把原生物理异常编号写入已声明键；规则与元素 savedKey 相同。',
  },
} as const;
const definitionSchemaPart_6c03ff0b2a79d4cb = {
  addition: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/modifiers.ts:40:3'],
    description: '普通固定加值。',
  },
  multiplier: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/modifiers.ts:42:3'],
    description: '普通乘数。',
  },
  finalAddition: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/modifiers.ts:44:3'],
    description: '普通最终固定加值。',
  },
  finalMultiplier: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/modifiers.ts:46:3'],
    description: '普通最终乘数。',
  },
  baseAddition: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/modifiers.ts:48:3'],
    description: '基础固定加值。',
  },
  baseMultiplier: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/modifiers.ts:50:3'],
    description: '基础乘数。',
  },
  baseFinalAddition: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/modifiers.ts:52:3'],
    description: '基础最终固定加值。',
  },
  baseFinalMultiplier: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/modifiers.ts:54:3'],
    description: '基础最终乘数。',
  },
} as const;
const definitionSchemaPart_c3da83d673126e84 = {
  kind: {
    kind: 'enum',
    options: ['contextTargetCountCompare'],
    semantics: { type: '"contextTargetCountCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:221:7'],
    description: '比较本次释放 Context 中已查询目标组的实例数量。',
  },
  contextKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:223:7'],
    description: '动作环境中的目标组名称。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:225:7'],
    description: '数量比较符。',
  },
  value: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/conditions.ts:227:7'],
    description: '与实际目标数量比较的值。',
  },
  outputKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:229:7'],
    optional: true,
    description: '原生 CheckEntityNum.storeKey：判断时同步保存实际数量。',
  },
} as const;
const definitionSchemaPart_0d22d9d7b73ee900 = {
  kind: 'array',
  element: definitionSchemaPart_5ac70f0f12c6e08a,
  semantics: {
    type: 'readonly SkillCostDefinition[] | undefined',
    arrayElement: { type: 'SkillCostDefinition' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/skills.ts:337:3'],
  optional: true,
  description: '技能释放时消耗的资源。',
} as const;
const definitionSchemaPart_30f73a97c7db61b3 = {
  burstType: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/buffs.ts:581:3'],
    description: '选择这组爆发参数的原生爆发类型。',
  },
  damageType: {
    kind: 'enum',
    options: ['physical', 'heat', 'cryo', 'electric', 'nature', 'true', 'lifeDrain', 'ether'],
    semantics: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
        { type: '"true"' },
        { type: '"lifeDrain"' },
        { type: '"ether"' },
      ],
    },
    source: ['packages/game-data-contract/src/buffs.ts:583:3'],
    description: '爆发伤害的元素类型（原生 damageType 归一化后的语义枚举）。',
  },
  skillSettingDataKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/buffs.ts:585:3'],
    description: '爆发倍率在 SkillSetting 中的 dataKey。',
  },
  skillSettingColumn: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/buffs.ts:587:3'],
    description: 'SkillSetting 列号（原生 1 基；运行时按列号减一取数组下标）。',
  },
  atkScaleBase: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/buffs.ts:589:3'],
    description: '原生 DamageAction 的基础倍率；被 SkillSetting 倍率覆盖，仅作证据保留。',
  },
} as const;
const definitionSchemaPart_30e779885a60386e = {
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
  semantics: definitionSchemaPart_aa265fa5786d052d,
  source: ['packages/game-data-contract/src/equipment.ts:117:9'],
  description: '直接监听的一项原生能力事件。',
} as const;
const definitionSchemaPart_bd5ac3c22afcbbc1 = {
  kind: 'object',
  fields: definitionSchemaPart_718eac4caaeb1771,
  semantics: {
    type: '{ readonly kind: "limited"; readonly durationSeconds: AbilityEntityDefinitionNumber; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:107:3'],
} as const;
const definitionSchemaPart_eebbbcd20dc6fb35 = {
  kind: 'object',
  fields: definitionSchemaPart_146f1cb483b49d25,
  semantics: {
    type: '{ kind: "contextFlagEquals"; flag: string; value: string | number | boolean; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_95e6725f7695668a = {
  kind: 'object',
  fields: definitionSchemaPart_146f1cb483b49d25,
  semantics: {
    type: '{ kind: "contextFlagEquals"; flag: string; value: string | number | boolean; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_cc3614fd1381df56 = {
  skill: definitionSchemaPart_3c7d15f38886628b,
  executionSkillKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/skills.ts:451:3'],
    description: '执行体在原生养成定义中的稳定技能身份。',
  },
} as const;
const definitionSchemaPart_320a627b2062aa19 = {
  kind: 'object',
  fields: definitionSchemaPart_146f1cb483b49d25,
  semantics: {
    type: '{ kind: "contextFlagEquals"; flag: string; value: string | number | boolean; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_f21ae48f947f1ce0 = {
  kind: 'object',
  fields: definitionSchemaPart_146f1cb483b49d25,
  semantics: {
    type: '{ kind: "contextFlagEquals"; flag: string; value: string | number | boolean; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_ab3f2a6282fb0ed4 = {
  kind: 'object',
  fields: definitionSchemaPart_146f1cb483b49d25,
  semantics: {
    type: '{ kind: "contextFlagEquals"; flag: string; value: string | number | boolean; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_9a41a91e55180928 = {
  kind: {
    kind: 'enum',
    options: ['characterTypeIn'],
    semantics: { type: '"characterTypeIn"' },
    source: ['packages/game-data-contract/src/conditions.ts:75:7'],
    description: '条件种类判别值。',
  },
  target: {
    kind: 'enum',
    options: ['caster', 'buffOwner'],
    semantics: {
      type: '"caster" | "buffOwner"',
      unionVariants: [{ type: '"caster"' }, { type: '"buffOwner"' }],
    },
    source: ['packages/game-data-contract/src/conditions.ts:77:7'],
    description: '检查施法者还是当前 Buff 持有者。',
  },
  characterTypes: definitionSchemaPart_c33bd7d5e6b7dd60,
} as const;
const definitionSchemaPart_7209b73a48c61da0 = {
  kind: {
    kind: 'enum',
    options: ['eventDamageTypesMatch'],
    semantics: { type: '"eventDamageTypesMatch"' },
    source: ['packages/game-data-contract/src/modifiers.ts:153:7'],
    description: '检查本次伤害的伤害类型。',
  },
  damageTypes: definitionSchemaPart_a129bb5f74be3317,
} as const;
const definitionSchemaPart_6bb7c622c898d944 = {
  kind: 'object',
  fields: definitionSchemaPart_56699325e6316be7,
  semantics: {
    type: '{ kind: "eventDamageGameplayTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_6b6bdf9973e23a2f = {
  kind: 'object',
  fields: definitionSchemaPart_56699325e6316be7,
  semantics: {
    type: '{ kind: "eventDamageGameplayTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_a1aa30c2581a32b3 = {
  kind: 'object',
  fields: definitionSchemaPart_56699325e6316be7,
  semantics: {
    type: '{ kind: "eventDamageGameplayTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_638465f6819dd1c7 = {
  kind: 'object',
  fields: definitionSchemaPart_56699325e6316be7,
  semantics: {
    type: '{ kind: "eventDamageGameplayTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_95ef8d78779a9c19 = {
  kind: 'object',
  fields: definitionSchemaPart_56699325e6316be7,
  semantics: {
    type: '{ kind: "eventDamageGameplayTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_37be9610ce98cb01 = {
  kind: {
    kind: 'enum',
    options: ['eventDamageTypeIn'],
    semantics: { type: '"eventDamageTypeIn"' },
    source: ['packages/game-data-contract/src/conditions.ts:439:7'],
    description: '匹配触发当前响应的伤害类型；未声明类型的外部事实不会命中。',
  },
  damageTypes: definitionSchemaPart_8ad39272167a1eea,
} as const;
const definitionSchemaPart_885717c4d445292b = {
  kind: 'object',
  fields: definitionSchemaPart_d43db2ccc8c756ae,
  semantics: {
    type: '{ kind: "contextTargetIdentityMatch"; contextKey: string; other: "controlledOperator" | "actionSource" | "actionOwner"; operator: "equal" | "notEqual"; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_5fb9d9672a3b962a = {
  kind: 'object',
  fields: definitionSchemaPart_d43db2ccc8c756ae,
  semantics: {
    type: '{ kind: "contextTargetIdentityMatch"; contextKey: string; other: "controlledOperator" | "actionSource" | "actionOwner"; operator: "equal" | "notEqual"; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_d68d3b28d4f9c1a5 = {
  kind: 'object',
  fields: definitionSchemaPart_0e46df2295fd8cae,
  semantics: {
    type: '{ readonly kind: "staticHealingIncrease"; readonly target: "output" | "taken"; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:58:7'],
} as const;
const definitionSchemaPart_10270249c690ff09 = {
  kind: 'object',
  fields: definitionSchemaPart_0e46df2295fd8cae,
  semantics: {
    type: '{ readonly kind: "staticHealingIncrease"; readonly target: "output" | "taken"; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:128:3'],
} as const;
const definitionSchemaPart_044443d307581d45 = {
  kind: 'object',
  fields: definitionSchemaPart_0e46df2295fd8cae,
  semantics: {
    type: '{ readonly kind: "staticHealingIncrease"; readonly target: "output" | "taken"; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:184:3'],
} as const;
const definitionSchemaPart_6887c63c427ab746 = {
  kind: 'object',
  fields: definitionSchemaPart_d43db2ccc8c756ae,
  semantics: {
    type: '{ kind: "contextTargetIdentityMatch"; contextKey: string; other: "controlledOperator" | "actionSource" | "actionOwner"; operator: "equal" | "notEqual"; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_5f75297a24c6c61a = {
  kind: 'object',
  fields: definitionSchemaPart_d43db2ccc8c756ae,
  semantics: {
    type: '{ kind: "contextTargetIdentityMatch"; contextKey: string; other: "controlledOperator" | "actionSource" | "actionOwner"; operator: "equal" | "notEqual"; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_6f6a52bd5f281d99 = {
  kind: 'object',
  fields: definitionSchemaPart_d43db2ccc8c756ae,
  semantics: {
    type: '{ kind: "contextTargetIdentityMatch"; contextKey: string; other: "controlledOperator" | "actionSource" | "actionOwner"; operator: "equal" | "notEqual"; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_44dc4033bec5cbf5 = {
  kind: {
    kind: 'enum',
    options: ['eventSkillTypeIn'],
    semantics: { type: '"eventSkillTypeIn"' },
    source: ['packages/game-data-contract/src/conditions.ts:461:7'],
    description: '匹配触发 Buff 响应的待施放技能类型。',
  },
  skillTypes: definitionSchemaPart_6c28471eb02cbe2f,
} as const;
const definitionSchemaPart_d612ae46dbc5d001 = {
  kind: {
    kind: 'enum',
    options: ['modifyHealingIncrease'],
    semantics: { type: '"modifyHealingIncrease"' },
    source: ['packages/game-data-contract/src/modifiers.ts:337:3'],
    description: '处理器种类判别值。',
  },
  timing: {
    kind: 'enum',
    options: ['beforeCalculation'],
    semantics: { type: '"beforeCalculation"' },
    source: ['packages/game-data-contract/src/modifiers.ts:339:3'],
    description: '此处理器固定在治疗计算前执行。',
  },
  side: {
    kind: 'enum',
    options: ['healer', 'receiver'],
    semantics: {
      type: 'HealModifierSide',
      unionVariants: [{ type: '"healer"' }, { type: '"receiver"' }],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:341:3'],
    description: '修改治疗者的输出加成或受治疗者的承疗加成。',
  },
  addition: definitionSchemaPart_ccca3aa8d229e4dd,
} as const;
const definitionSchemaPart_162d2dbdceaa8b86 = {
  kind: {
    kind: 'enum',
    options: ['modifyPoiseScalar'],
    semantics: { type: '"modifyPoiseScalar"' },
    source: ['packages/game-data-contract/src/modifiers.ts:397:3'],
    description: '处理器种类判别值。',
  },
  timing: {
    kind: 'enum',
    options: ['beforeCalculation'],
    semantics: { type: '"beforeCalculation"' },
    source: ['packages/game-data-contract/src/modifiers.ts:399:3'],
    description: '此处理器固定在失衡伤害计算前执行。',
  },
  side: {
    kind: 'enum',
    options: ['defender', 'attacker'],
    semantics: {
      type: '"defender" | "attacker"',
      unionVariants: [{ type: '"defender"' }, { type: '"attacker"' }],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:401:3'],
    description: '修改攻击方还是目标方的倍率。',
  },
  addition: definitionSchemaPart_7231589865d6f2d0,
} as const;
const definitionSchemaPart_f82c8f424a3be468 = {
  kind: 'object',
  fields: definitionSchemaPart_6c03ff0b2a79d4cb,
  semantics: { type: 'AttributeModifierValues' },
  source: ['packages/game-data-contract/src/modifiers.ts:255:3'],
} as const;
const definitionSchemaPart_9a268077c1ce210d = {
  kind: 'array',
  element: definitionSchemaPart_673c4dabf5d02e53,
  semantics: {
    type: 'readonly ("canBreakWeakness" | "crush" | "airborne" | "knockDown" | "shatter" | "dot" | "remainArea" | "talentDamage" | "physicalInfliction")[]',
    arrayElement: {
      type: '"canBreakWeakness" | "crush" | "airborne" | "knockDown" | "shatter" | "dot" | "remainArea" | "talentDamage" | "physicalInfliction"',
      unionVariants: [
        { type: '"canBreakWeakness"' },
        { type: '"crush"' },
        { type: '"airborne"' },
        { type: '"knockDown"' },
        { type: '"shatter"' },
        { type: '"dot"' },
        { type: '"remainArea"' },
        { type: '"talentDamage"' },
        { type: '"physicalInfliction"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/modifiers.ts:149:7'],
  description: '参与匹配的伤害特征。',
} as const;
const definitionSchemaPart_88861fd0940fb61e = {
  kind: 'array',
  element: definitionSchemaPart_254e7077895346b4,
  semantics: {
    type: 'readonly ("canBreakWeakness" | "crush" | "airborne" | "knockDown" | "shatter" | "dot" | "remainArea" | "talentDamage" | "physicalInfliction")[]',
    arrayElement: {
      type: '"canBreakWeakness" | "crush" | "airborne" | "knockDown" | "shatter" | "dot" | "remainArea" | "talentDamage" | "physicalInfliction"',
      unionVariants: [
        { type: '"canBreakWeakness"' },
        { type: '"crush"' },
        { type: '"airborne"' },
        { type: '"knockDown"' },
        { type: '"shatter"' },
        { type: '"dot"' },
        { type: '"remainArea"' },
        { type: '"talentDamage"' },
        { type: '"physicalInfliction"' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/conditions.ts:435:7'],
  description: '参与匹配的伤害特征。',
} as const;
const definitionSchemaPart_cf3fcd16d46d0278 = {
  kind: 'array',
  element: definitionSchemaPart_011d08ae5a422bae,
  semantics: {
    type: 'readonly SkillInputCommandMappingWindow[] | undefined',
    arrayElement: { type: 'SkillInputCommandMappingWindow' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/skills.ts:323:5'],
  optional: true,
  description: '在指定帧段内覆盖普通攻击操作的技能路由。',
} as const;
const definitionSchemaPart_a6c0e084dfc94ab6 = {
  kind: {
    kind: 'enum',
    options: ['originSkillTypeIn'],
    semantics: { type: '"originSkillTypeIn"' },
    source: ['packages/game-data-contract/src/conditions.ts:483:7'],
    description: '匹配当前事件的来源施法类型；按原生载荷类型读取，不回退到监听 Buff 的来源。',
  },
  skillTypes: definitionSchemaPart_0c75681f20e34131,
} as const;
const definitionSchemaPart_9d8aa2834ff90c0d = {
  kind: {
    kind: 'enum',
    options: ['deckAttributeCompare'],
    semantics: { type: '"deckAttributeCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:653:7'],
    description: '在构筑阶段比较两项干员四维。',
  },
  left: {
    kind: 'enum',
    options: ['strength', 'agility', 'intellect', 'will'],
    semantics: {
      type: '"strength" | "agility" | "intellect" | "will"',
      unionVariants: [
        { type: '"strength"' },
        { type: '"agility"' },
        { type: '"intellect"' },
        { type: '"will"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:655:7'],
    description: '左侧属性。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:657:7'],
    description: '数值比较符。',
  },
  right: {
    kind: 'enum',
    options: ['strength', 'agility', 'intellect', 'will'],
    semantics: {
      type: '"strength" | "agility" | "intellect" | "will"',
      unionVariants: [
        { type: '"strength"' },
        { type: '"agility"' },
        { type: '"intellect"' },
        { type: '"will"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:659:7'],
    description: '右侧属性。',
  },
} as const;
const definitionSchemaPart_b1c7276d899f4291 = {
  slot: definitionSchemaPart_4ea8f5421314390a,
  value: definitionSchemaPart_9a1a70968acdf8fc,
} as const;
const definitionSchemaPart_446fe634a3ae09de = {
  kind: 'object',
  fields: definitionSchemaPart_4ecd3809d0bb8c0e,
  semantics: {
    type: '{ kind: "eventInflictionElementIn"; elements: readonly ("heat" | "cryo" | "electric" | "nature")[]; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_fc28ee29347ef135 = {
  kind: 'object',
  fields: definitionSchemaPart_8301abcf5edc7867,
  semantics: {
    type: '{ kind: "contextTargetEntityTagMatch"; contextKey: string; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_83f4898735b381fe = {
  kind: 'object',
  fields: definitionSchemaPart_4ecd3809d0bb8c0e,
  semantics: {
    type: '{ kind: "eventInflictionElementIn"; elements: readonly ("heat" | "cryo" | "electric" | "nature")[]; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_8673add6f23b76ca = {
  kind: 'object',
  fields: definitionSchemaPart_8301abcf5edc7867,
  semantics: {
    type: '{ kind: "contextTargetEntityTagMatch"; contextKey: string; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_0f71d14a197655e1 = {
  kind: 'object',
  fields: definitionSchemaPart_4ecd3809d0bb8c0e,
  semantics: {
    type: '{ kind: "eventInflictionElementIn"; elements: readonly ("heat" | "cryo" | "electric" | "nature")[]; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_f7e3b1e446629aa6 = {
  kind: 'object',
  fields: definitionSchemaPart_4ecd3809d0bb8c0e,
  semantics: {
    type: '{ kind: "eventInflictionElementIn"; elements: readonly ("heat" | "cryo" | "electric" | "nature")[]; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_566d9fd99631f0c0 = {
  kind: 'object',
  fields: definitionSchemaPart_4ecd3809d0bb8c0e,
  semantics: {
    type: '{ kind: "eventInflictionElementIn"; elements: readonly ("heat" | "cryo" | "electric" | "nature")[]; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_e2f87ae53156b76a = {
  kind: {
    kind: 'enum',
    options: ['composite'],
    semantics: { type: '"composite"' },
    source: ['packages/game-data-contract/src/equipment.ts:62:7'],
    description: '使用预设的复合词条文字。',
  },
  composite: definitionSchemaPart_b43cf586ac1df6ca,
  value: {
    kind: 'union',
    variants: [
      {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/equipment.ts:66:7'],
      },
      {
        kind: 'array',
        element: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/equipment.ts:66:7'],
        },
        semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
        source: ['packages/game-data-contract/src/equipment.ts:66:7'],
      },
    ],
    semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
    source: ['packages/game-data-contract/src/equipment.ts:66:7'],
    description: '显示的单个数值或各等级数值。',
  },
} as const;
const definitionSchemaPart_d157a4e4e9bce79c = {
  kind: 'object',
  fields: definitionSchemaPart_8301abcf5edc7867,
  semantics: {
    type: '{ kind: "contextTargetEntityTagMatch"; contextKey: string; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_98ba8181248ba0e4 = {
  kind: 'object',
  fields: definitionSchemaPart_8301abcf5edc7867,
  semantics: {
    type: '{ kind: "contextTargetEntityTagMatch"; contextKey: string; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_64187ddd0b664c1a = {
  kind: 'object',
  fields: definitionSchemaPart_8301abcf5edc7867,
  semantics: {
    type: '{ kind: "contextTargetEntityTagMatch"; contextKey: string; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_a3b8d984a97bcf47 = {
  kind: 'object',
  fields: definitionSchemaPart_cc3614fd1381df56,
  semantics: { type: 'RoutedSkillReplacementDefinition' },
  source: ['packages/game-data-contract/src/skills.ts:428:3'],
} as const;
const definitionSchemaPart_6c44e84626164dee = {
  kind: 'union',
  variants: [
    definitionSchemaPart_eca6fd253bfb2a8f,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:163:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:163:7'],
  inlineCondition: 'equipment',
  description: '比较左值。',
} as const;
const definitionSchemaPart_2ea0cbd396fdeeac = {
  kind: 'union',
  variants: [
    definitionSchemaPart_870e5065b71b2997,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:167:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:167:7'],
  inlineCondition: 'equipment',
  description: '比较右值。',
} as const;
const definitionSchemaPart_d910f44aeb2a4e02 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_eca6fd253bfb2a8f,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:163:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:163:7'],
  inlineCondition: 'skillSwitch',
  description: '比较左值。',
} as const;
const definitionSchemaPart_b6bedc824003c668 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_870e5065b71b2997,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:167:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:167:7'],
  inlineCondition: 'skillSwitch',
  description: '比较右值。',
} as const;
const definitionSchemaPart_1429c7ed04b86024 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_f859de2880f31bc3,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:149:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:149:7'],
  inlineCondition: 'equipment',
  description: '与当前失衡值比较的值。',
} as const;
const definitionSchemaPart_ea4fc301f7e06133 = {
  kind: {
    kind: 'enum',
    options: ['operatorRoleIn'],
    semantics: { type: '"operatorRoleIn"' },
    source: ['packages/game-data-contract/src/conditions.ts:84:7'],
    description: '条件种类判别值。',
  },
  target: {
    kind: 'enum',
    options: ['caster', 'eventTarget', 'buffOwner'],
    semantics: {
      type: '"caster" | "eventTarget" | "buffOwner"',
      unionVariants: [{ type: '"caster"' }, { type: '"buffOwner"' }, { type: '"eventTarget"' }],
    },
    source: ['packages/game-data-contract/src/conditions.ts:86:7'],
    description: '要检查的干员身份。',
  },
  roles: definitionSchemaPart_10cbe8e610a97f4e,
} as const;
const definitionSchemaPart_b14936c0d60cd127 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_2dec103f6560f523,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:103:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:103:7'],
  inlineCondition: 'equipment',
  description: '与敌人超级护甲比较的值。',
} as const;
const definitionSchemaPart_329d6b9fbdd9f3b8 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_e3e6c3281a767d43,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:111:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:111:7'],
  inlineCondition: 'equipment',
  description: '与有符号角度比较的度数。',
} as const;
const definitionSchemaPart_709e49e902655f6b = {
  kind: 'union',
  variants: [
    definitionSchemaPart_20c9108a64f4295a,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:137:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:137:7'],
  inlineCondition: 'equipment',
  description: '与生命值或比例比较的值。',
} as const;
const definitionSchemaPart_8c2034a56c852ba8 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_8edf618f0f5b210d,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:203:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:203:7'],
  inlineCondition: 'equipment',
  description: '0 到 1 的命中概率。',
} as const;
const definitionSchemaPart_5438f6195ecab3fc = {
  kind: 'union',
  variants: [
    definitionSchemaPart_6a78142ea9f3fd7d,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:285:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:285:7'],
  inlineCondition: 'equipment',
  description: '与累计强化层数比较的值。',
} as const;
const definitionSchemaPart_6c4e49ae5d19618d = {
  kind: 'union',
  variants: [
    definitionSchemaPart_8e7bc5c68d476242,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:297:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:297:7'],
  inlineCondition: 'equipment',
  description: '与累计强化层数比较的值。',
} as const;
const definitionSchemaPart_6e0eb94afdbbd257 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_e5362a3010f5da02,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:341:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:341:7'],
  inlineCondition: 'equipment',
  description: '与累计强化层数比较的值。',
} as const;
const definitionSchemaPart_62079a5f902bde54 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_5ae5dafa25d04e53,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:563:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:563:7'],
  inlineCondition: 'equipment',
  description: '与实际消费层数比较的值。',
} as const;
const definitionSchemaPart_d1c8c81379b84025 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_f859de2880f31bc3,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:149:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:149:7'],
  inlineCondition: 'skillSwitch',
  description: '与当前失衡值比较的值。',
} as const;
const definitionSchemaPart_dbfddf083f619cfd = {
  kind: 'union',
  variants: [
    definitionSchemaPart_2dec103f6560f523,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:103:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:103:7'],
  inlineCondition: 'skillSwitch',
  description: '与敌人超级护甲比较的值。',
} as const;
const definitionSchemaPart_ac4b5a621d511e63 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_e3e6c3281a767d43,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:111:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:111:7'],
  inlineCondition: 'skillSwitch',
  description: '与有符号角度比较的度数。',
} as const;
const definitionSchemaPart_3277cea0963daf1d = {
  kind: 'union',
  variants: [
    definitionSchemaPart_20c9108a64f4295a,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:137:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:137:7'],
  inlineCondition: 'skillSwitch',
  description: '与生命值或比例比较的值。',
} as const;
const definitionSchemaPart_866038e979837c3b = {
  kind: 'union',
  variants: [
    definitionSchemaPart_8edf618f0f5b210d,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:203:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:203:7'],
  inlineCondition: 'skillSwitch',
  description: '0 到 1 的命中概率。',
} as const;
const definitionSchemaPart_24121208b47b0531 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_6a78142ea9f3fd7d,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:285:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:285:7'],
  inlineCondition: 'skillSwitch',
  description: '与累计强化层数比较的值。',
} as const;
const definitionSchemaPart_f3441a7dae322066 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_8e7bc5c68d476242,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:297:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:297:7'],
  inlineCondition: 'skillSwitch',
  description: '与累计强化层数比较的值。',
} as const;
const definitionSchemaPart_cb87e5f43e46cf23 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_e5362a3010f5da02,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:341:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:341:7'],
  inlineCondition: 'skillSwitch',
  description: '与累计强化层数比较的值。',
} as const;
const definitionSchemaPart_7cf4e38a45667d29 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_5ae5dafa25d04e53,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:563:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:563:7'],
  inlineCondition: 'skillSwitch',
  description: '与实际消费层数比较的值。',
} as const;
const definitionSchemaPart_2a7c86ff15ba5e92 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_850fae5c9c81c8ea,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:197:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:197:7'],
  inlineCondition: 'equipment',
  description: '与 Buff 黑板值比较的值。',
} as const;
const definitionSchemaPart_68704636e3d250a7 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_cff3949652b6e1b1,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:539:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:539:7'],
  inlineCondition: 'equipment',
  description: '与 Buff 实例数比较的值。',
} as const;
const definitionSchemaPart_36c430d4a74a8941 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_850fae5c9c81c8ea,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:197:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:197:7'],
  inlineCondition: 'skillSwitch',
  description: '与 Buff 黑板值比较的值。',
} as const;
const definitionSchemaPart_a5f327a77525bb3f = {
  kind: 'union',
  variants: [
    definitionSchemaPart_cff3949652b6e1b1,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:539:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:539:7'],
  inlineCondition: 'skillSwitch',
  description: '与 Buff 实例数比较的值。',
} as const;
const definitionSchemaPart_83295db8054a8699 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_07c467816ef511ed,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:325:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:325:7'],
  inlineCondition: 'equipment',
  description: '与当前 Buff 强化层数比较的值。',
} as const;
const definitionSchemaPart_1d4f285edf04f94e = {
  kind: 'union',
  variants: [
    definitionSchemaPart_0141a1228260aec3,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:355:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:355:7'],
  inlineCondition: 'equipment',
  description: '与不同 Buff ID 数量比较的值。',
} as const;
const definitionSchemaPart_5cdd9e7e109a8f97 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_07c467816ef511ed,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:325:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:325:7'],
  inlineCondition: 'skillSwitch',
  description: '与当前 Buff 强化层数比较的值。',
} as const;
const definitionSchemaPart_503c70aa38a27c16 = {
  kind: 'object',
  fields: definitionSchemaPart_6c028ac302268150,
  semantics: {
    type: '{ kind: "eventBuffTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; buffIdOutputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_a537dbeafb5cd491 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_0141a1228260aec3,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:355:7'],
    },
  ],
  semantics: { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
  source: ['packages/game-data-contract/src/conditions.ts:355:7'],
  inlineCondition: 'skillSwitch',
  description: '与不同 Buff ID 数量比较的值。',
} as const;
const definitionSchemaPart_6d0eb99c24079bed = {
  kind: 'object',
  fields: definitionSchemaPart_6c028ac302268150,
  semantics: {
    type: '{ kind: "eventBuffTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; buffIdOutputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_1d43ef999219b4d1 = {
  kind: 'object',
  fields: definitionSchemaPart_6c028ac302268150,
  semantics: {
    type: '{ kind: "eventBuffTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; buffIdOutputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_7f8f1c538b7d3f76 = {
  kind: 'object',
  fields: definitionSchemaPart_6c028ac302268150,
  semantics: {
    type: '{ kind: "eventBuffTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; buffIdOutputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_61d0c4fbd29a93a5 = {
  kind: 'object',
  fields: definitionSchemaPart_6c028ac302268150,
  semantics: {
    type: '{ kind: "eventBuffTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; buffIdOutputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_2381d944f8927353 = {
  kind: 'object',
  fields: definitionSchemaPart_d15d084e7f7ba5ed,
  semantics: {
    type: '{ readonly kind: "basicAttack"; readonly skillKeys: readonly string[]; readonly normalAttackSkillKeys?: readonly string[] | undefined; readonly defaultSkillKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/operators.ts:546:3'],
} as const;
const definitionSchemaPart_70d26d22d734d888 = {
  kind: 'object',
  fields: definitionSchemaPart_bbf2083b36cab81b,
  semantics: {
    type: '{ kind: "eventPhysicalInflictionTypeIn"; types: readonly ("crush" | "airborne" | "knockDown" | "fracture")[]; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_5064aeb0cca737b4 = {
  kind: 'object',
  fields: definitionSchemaPart_bbf2083b36cab81b,
  semantics: {
    type: '{ kind: "eventPhysicalInflictionTypeIn"; types: readonly ("crush" | "airborne" | "knockDown" | "fracture")[]; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_5e05a4441422f9ee = {
  kind: 'object',
  fields: definitionSchemaPart_bbf2083b36cab81b,
  semantics: {
    type: '{ kind: "eventPhysicalInflictionTypeIn"; types: readonly ("crush" | "airborne" | "knockDown" | "fracture")[]; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_52f63ca1173279e3 = {
  kind: 'object',
  fields: definitionSchemaPart_bbf2083b36cab81b,
  semantics: {
    type: '{ kind: "eventPhysicalInflictionTypeIn"; types: readonly ("crush" | "airborne" | "knockDown" | "fracture")[]; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_56d1c65bfba4434a = {
  kind: 'object',
  fields: definitionSchemaPart_bbf2083b36cab81b,
  semantics: {
    type: '{ kind: "eventPhysicalInflictionTypeIn"; types: readonly ("crush" | "airborne" | "knockDown" | "fracture")[]; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_e7ac4a1bec34c764 = {
  kind: 'object',
  fields: definitionSchemaPart_12bd425687c2e8b7,
  semantics: {
    type: '{ readonly kind: "entityTagMatch"; readonly target: "enemy" | "caster"; readonly tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; readonly tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:643:3'],
} as const;
const definitionSchemaPart_e39c10fa09683334 = {
  kind: 'object',
  fields: definitionSchemaPart_30f73a97c7db61b3,
  semantics: { type: 'CombatBuffSpellBurstDefinition | undefined', optional: true },
  source: ['packages/game-data-contract/src/buffs.ts:728:3'],
  optional: true,
  description: '元素爆发 Buff 触发伤害时使用的爆发类型、伤害类型和倍率来源。',
} as const;
const definitionSchemaPart_0ee0a4d68f827d67 = {
  kind: 'object',
  fields: definitionSchemaPart_12bd425687c2e8b7,
  semantics: {
    type: '{ readonly kind: "entityTagMatch"; readonly target: "enemy" | "caster"; readonly tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; readonly tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
} as const;
const definitionSchemaPart_d55be315b5b9e51a = {
  kind: 'object',
  fields: definitionSchemaPart_12bd425687c2e8b7,
  semantics: {
    type: '{ readonly kind: "entityTagMatch"; readonly target: "enemy" | "caster"; readonly tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; readonly tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
} as const;
const definitionSchemaPart_dcd4c5dd14bb1a07 = {
  kind: 'object',
  fields: definitionSchemaPart_12bd425687c2e8b7,
  semantics: {
    type: '{ readonly kind: "entityTagMatch"; readonly target: "enemy" | "caster"; readonly tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; readonly tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
} as const;
const definitionSchemaPart_16a2523ebbebff85 = {
  kind: 'object',
  fields: definitionSchemaPart_162d2dbdceaa8b86,
  semantics: { type: 'ModifyPoiseScalarProcessorDefinition' },
  source: ['packages/game-data-contract/src/modifiers.ts:413:3'],
} as const;
const definitionSchemaPart_0ff650de5bd3ce14 = {
  kind: 'object',
  fields: definitionSchemaPart_d612ae46dbc5d001,
  semantics: { type: 'ModifyHealingIncreaseProcessorDefinition' },
  source: ['packages/game-data-contract/src/modifiers.ts:353:3'],
} as const;
const definitionSchemaPart_80f4f449ae048403 = {
  kind: {
    kind: 'enum',
    options: ['attribute'],
    semantics: { type: '"attribute"' },
    source: ['packages/game-data-contract/src/buildModifiers.ts:57:5'],
    description: '修正种类判别值。',
  },
  attribute: {
    kind: 'enum',
    options: ['strength', 'agility', 'intellect', 'will', 'main', 'secondary'],
    semantics: {
      type: 'BuildAttribute',
      unionVariants: [
        {
          type: '"strength" | "agility" | "intellect" | "will"',
          unionVariants: [
            { type: '"strength"' },
            { type: '"agility"' },
            { type: '"intellect"' },
            { type: '"will"' },
          ],
        },
        { type: '"main"' },
        { type: '"secondary"' },
      ],
    },
    source: ['packages/game-data-contract/src/buildModifiers.ts:59:5'],
    description: '要修改的属性。',
  },
  operation: {
    kind: 'enum',
    options: ['flat', 'percent'],
    semantics: {
      type: '"flat" | "percent"',
      unionVariants: [{ type: '"flat"' }, { type: '"percent"' }],
    },
    source: ['packages/game-data-contract/src/buildModifiers.ts:61:5'],
    description: '`flat` 为固定加值，`percent` 为百分比加值。',
  },
  value: {
    kind: 'union',
    variants: [
      {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/buildModifiers.ts:63:5'],
      },
      {
        kind: 'array',
        element: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/buildModifiers.ts:63:5'],
        },
        semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
        source: ['packages/game-data-contract/src/buildModifiers.ts:63:5'],
      },
    ],
    semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
    source: ['packages/game-data-contract/src/buildModifiers.ts:63:5'],
    description: '单个数值或按等级排列的数值。',
  },
} as const;
const definitionSchemaPart_131dc623d8e7a828 = {
  kind: {
    kind: 'enum',
    options: ['damageTagHit'],
    semantics: { type: '"damageTagHit"' },
    source: ['packages/game-data-contract/src/actions.ts:1736:7'],
    description: '触发器种类判别值。',
  },
  tag: definitionSchemaPart_985f817a124200e4,
  scope: {
    kind: 'enum',
    options: ['team', 'operator'],
    semantics: {
      type: '"team" | "operator"',
      unionVariants: [{ type: '"team"' }, { type: '"operator"' }],
    },
    source: ['packages/game-data-contract/src/actions.ts:1740:7'],
    description: '检查当前干员还是全队来源。',
  },
} as const;
const definitionSchemaPart_9ddeaf4fe10a1786 = {
  kind: 'object',
  fields: definitionSchemaPart_9a41a91e55180928,
  semantics: {
    type: '{ kind: "characterTypeIn"; target: "caster" | "buffOwner"; characterTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_caba4c0a17a18f52 = {
  kind: 'object',
  fields: definitionSchemaPart_9a41a91e55180928,
  semantics: {
    type: '{ kind: "characterTypeIn"; target: "caster" | "buffOwner"; characterTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_f3d3e22b83af6376 = {
  kind: 'object',
  fields: definitionSchemaPart_9a41a91e55180928,
  semantics: {
    type: '{ kind: "characterTypeIn"; target: "caster" | "buffOwner"; characterTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_18e490990e3075bc = {
  kind: 'object',
  fields: definitionSchemaPart_9a41a91e55180928,
  semantics: {
    type: '{ kind: "characterTypeIn"; target: "caster" | "buffOwner"; characterTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_820c1984cd98077b = {
  kind: 'object',
  fields: definitionSchemaPart_9a41a91e55180928,
  semantics: {
    type: '{ kind: "characterTypeIn"; target: "caster" | "buffOwner"; characterTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_19e1b0e3b00695d7 = {
  kind: 'object',
  fields: definitionSchemaPart_c3da83d673126e84,
  semantics: {
    type: '{ kind: "contextTargetCountCompare"; contextKey: string; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_3c2dc8b713fbd06a = {
  kind: 'array',
  element: definitionSchemaPart_5a14d86583466d7b,
  semantics: {
    type: 'readonly SkillDefinition[]',
    arrayElement: {
      type: 'SkillDefinition',
      unionVariants: [
        {
          type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
        },
        { type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/skills.ts:400:3'],
} as const;
const definitionSchemaPart_763725944ac0c7c9 = {
  kind: 'array',
  element: definitionSchemaPart_e262f3bd7838bbef,
  semantics: {
    type: 'readonly SkillDefinition[]',
    arrayElement: {
      type: 'SkillDefinition',
      unionVariants: [
        {
          type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
        },
        { type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/skills.ts:442:3'],
} as const;
const definitionSchemaPart_51c1de754a286004 = {
  kind: 'object',
  fields: definitionSchemaPart_c3da83d673126e84,
  semantics: {
    type: '{ kind: "contextTargetCountCompare"; contextKey: string; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_540dc6942716dea8 = {
  kind: 'object',
  fields: definitionSchemaPart_c3da83d673126e84,
  semantics: {
    type: '{ kind: "contextTargetCountCompare"; contextKey: string; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_b7c657c9941f2562 = {
  kind: 'object',
  fields: definitionSchemaPart_c3da83d673126e84,
  semantics: {
    type: '{ kind: "contextTargetCountCompare"; contextKey: string; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_babe865ff2b188ed = {
  kind: 'object',
  fields: definitionSchemaPart_c3da83d673126e84,
  semantics: {
    type: '{ kind: "contextTargetCountCompare"; contextKey: string; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_f509896dc96d0063 = {
  kind: 'object',
  fields: definitionSchemaPart_37be9610ce98cb01,
  semantics: {
    type: '{ kind: "eventDamageTypeIn"; damageTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_4c14955873fd8aaf = {
  kind: 'object',
  fields: definitionSchemaPart_37be9610ce98cb01,
  semantics: {
    type: '{ kind: "eventDamageTypeIn"; damageTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_05b2da07e173f2b6 = {
  kind: 'object',
  fields: definitionSchemaPart_37be9610ce98cb01,
  semantics: {
    type: '{ kind: "eventDamageTypeIn"; damageTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_4b34ed2b6a5c6e3f = {
  kind: 'object',
  fields: definitionSchemaPart_37be9610ce98cb01,
  semantics: {
    type: '{ kind: "eventDamageTypeIn"; damageTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_b28c45c6baf5f4bb = {
  kind: 'object',
  fields: definitionSchemaPart_37be9610ce98cb01,
  semantics: {
    type: '{ kind: "eventDamageTypeIn"; damageTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_c24c076d22fda201 = {
  type: 'CombatEventTrigger',
  unionVariants: [
    { type: '{ kind: "abilityEvent"; event: "beforeAddedBuff" | "outputBuff" | "addedBuff"; }' },
    { type: '{ kind: "operatorHit"; }' },
    { type: '{ kind: "operatorHealed"; role?: "source" | "target" | undefined; }' },
    { type: '{ kind: "buffApplied"; }' },
    { type: '{ kind: "buffOutput"; }' },
    { type: '{ kind: "buffConsumed"; buffIds?: readonly string[] | undefined; }' },
    { type: '{ kind: "airborneOutput"; }' },
    { type: '{ kind: "knockDownOutput"; }' },
    {
      type: '{ kind: "spGained"; source?: "normalAttack" | "powerAttack" | "default" | "skill" | undefined; gainKind?: "gain" | "refund" | undefined; }',
    },
    {
      type: '{ kind: "damageTagHit"; tag: "normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | "comboSkill" | "ultimateSkill" | "plungingAttack" | "dashAttack" | "fireBurst" | ... 6 more ... | "natureAbnormal"; scope: "team" | "operator"; }',
    },
    {
      type: '{ kind: "elementalInflictionApplied"; elements: "physical" | "heat" | "cryo" | "electric" | "nature" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]; scope: "team" | "operator"; }',
    },
    {
      type: '{ kind: "physicalInflictionApplied"; types: "crush" | "airborne" | "knockDown" | "fracture" | readonly ("crush" | "airborne" | "knockDown" | "fracture")[]; scope: "team" | "operator"; }',
    },
    { type: '{ kind: "skillHit"; skillKey: string; scope: "team" | "operator"; }' },
    { type: '{ kind: "enemyDefeated"; scope: "team" | "operator"; }' },
  ],
} as const;
const definitionSchemaPart_bc493bb2625b2afd = {
  kind: 'object',
  fields: definitionSchemaPart_7209b73a48c61da0,
  semantics: {
    type: '{ readonly kind: "eventDamageTypesMatch"; readonly damageTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:643:3'],
} as const;
const definitionSchemaPart_b7b8c332fab674f2 = {
  kind: 'object',
  fields: definitionSchemaPart_7209b73a48c61da0,
  semantics: {
    type: '{ readonly kind: "eventDamageTypesMatch"; readonly damageTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
} as const;
const definitionSchemaPart_3327ba95d1fe279e = {
  kind: 'object',
  fields: definitionSchemaPart_7209b73a48c61da0,
  semantics: {
    type: '{ readonly kind: "eventDamageTypesMatch"; readonly damageTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
} as const;
const definitionSchemaPart_c024779c4de07b16 = {
  kind: 'object',
  fields: definitionSchemaPart_7209b73a48c61da0,
  semantics: {
    type: '{ readonly kind: "eventDamageTypesMatch"; readonly damageTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
} as const;
const definitionSchemaPart_663a154adcff8e7f = {
  target: {
    kind: 'enum',
    options: ['buffSource', 'owner'],
    semantics: {
      type: '"buffSource" | "owner"',
      unionVariants: [{ type: '"owner"' }, { type: '"buffSource"' }],
    },
    source: ['packages/game-data-contract/src/buffs.ts:341:3'],
    description: '效果作用于 Buff 持有者还是来源。',
  },
  superArmor: definitionSchemaPart_88c4e8938bd462dc,
  impactResistance: definitionSchemaPart_16a55f9383feadb8,
} as const;
const definitionSchemaPart_0e44f362ce4e9b9f = {
  kind: {
    kind: 'enum',
    options: ['eventSpGainMatch'],
    semantics: { type: '"eventSpGainMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:551:7'],
    description: '匹配 OnObtainAtb 事件携带的来源与获得方式。',
  },
  sources: definitionSchemaPart_dcbeef0392c529df,
  gainKinds: {
    kind: 'array',
    element: {
      kind: 'enum',
      options: ['gain', 'refund'],
      semantics: {
        type: '"gain" | "refund"',
        unionVariants: [{ type: '"gain"' }, { type: '"refund"' }],
      },
      source: ['packages/game-data-contract/src/conditions.ts:555:7'],
    },
    semantics: {
      type: 'readonly ("gain" | "refund")[] | undefined',
      arrayElement: {
        type: '"gain" | "refund"',
        unionVariants: [{ type: '"gain"' }, { type: '"refund"' }],
      },
      optional: true,
    },
    source: ['packages/game-data-contract/src/conditions.ts:555:7'],
    optional: true,
    description: '允许的正常获取或返还类型；省略时不筛选类型。',
  },
} as const;
const definitionSchemaPart_772f6a2adaa8b122 = {
  kind: {
    kind: 'enum',
    options: ['abilityEntityTimedMarkerPresent'],
    semantics: { type: '"abilityEntityTimedMarkerPresent"' },
    source: ['packages/game-data-contract/src/conditions.ts:407:7'],
    description: '检查当前能力实体或 Context 能力实体集合中仍有效的定时标记。',
  },
  markerId: definitionSchemaPart_cf7c525bed08e108,
  contextKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:411:7'],
    optional: true,
    description: '指定时检查该动作目标组中的能力实体；省略时检查当前能力实体。',
  },
} as const;
const definitionSchemaPart_7b6569932525aaa7 = {
  kind: {
    kind: 'enum',
    options: ['targetHealthCompare'],
    semantics: { type: '"targetHealthCompare"' },
    source: ['packages/game-data-contract/src/modifiers.ts:295:7'],
    description: '比较受治疗者的当前生命值或生命比例。',
  },
  valueType: {
    kind: 'enum',
    options: ['current', 'ratio'],
    semantics: {
      type: '"current" | "ratio"',
      unionVariants: [{ type: '"current"' }, { type: '"ratio"' }],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:297:7'],
    description: '比较当前生命值还是当前生命比例。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:299:7'],
    description: '数值比较符。',
  },
  value: definitionSchemaPart_560c1bf5cf42f5f1,
} as const;
const definitionSchemaPart_716251358458e793 = {
  kind: 'object',
  fields: definitionSchemaPart_44dc4033bec5cbf5,
  semantics: {
    type: '{ kind: "eventSkillTypeIn"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_a4a23c20dceb723b = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/conditions.ts:379:7'],
    },
    definitionSchemaPart_7826213e24fc06cb,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:379:7'],
    },
  ],
  semantics: {
    type: 'number | ActionValueOperand',
    unionVariants: [
      { type: 'number' },
      { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
    ],
  },
  source: ['packages/game-data-contract/src/conditions.ts:379:7'],
  inlineCondition: 'equipment',
  description: '与累计强化层数比较的值。',
} as const;
const definitionSchemaPart_d4be42c9469da7b2 = {
  kind: 'object',
  fields: definitionSchemaPart_44dc4033bec5cbf5,
  semantics: {
    type: '{ kind: "eventSkillTypeIn"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_217aac9c631065e5 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/conditions.ts:379:7'],
    },
    definitionSchemaPart_7826213e24fc06cb,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:759:7'],
          description: '直接使用固定数值。',
        },
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/conditions.ts:761:7'],
          description: '固定数值。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: number; }' },
      source: ['packages/game-data-contract/src/conditions.ts:379:7'],
    },
  ],
  semantics: {
    type: 'number | ActionValueOperand',
    unionVariants: [
      { type: 'number' },
      { type: 'ActionValueOperand', aliases: ['ActionValueOperand'] },
    ],
  },
  source: ['packages/game-data-contract/src/conditions.ts:379:7'],
  inlineCondition: 'skillSwitch',
  description: '与累计强化层数比较的值。',
} as const;
const definitionSchemaPart_d1aa59fa5029b929 = {
  kind: 'object',
  fields: definitionSchemaPart_44dc4033bec5cbf5,
  semantics: {
    type: '{ kind: "eventSkillTypeIn"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_dac4ee70f9a88636 = {
  kind: 'object',
  fields: definitionSchemaPart_44dc4033bec5cbf5,
  semantics: {
    type: '{ kind: "eventSkillTypeIn"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_d3ee1a899b8eb5fd = {
  kind: 'object',
  fields: definitionSchemaPart_44dc4033bec5cbf5,
  semantics: {
    type: '{ kind: "eventSkillTypeIn"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_b02d4e4cf76f0857 = {
  kind: {
    kind: 'enum',
    options: ['currentSkillTypeIn'],
    semantics: { type: '"currentSkillTypeIn"' },
    source: ['packages/game-data-contract/src/conditions.ts:475:7'],
    description: '查询目标 AbilitySystem 当前仍在施放的技能类型；不读取事件载荷。',
  },
  target: {
    kind: 'enum',
    options: ['caster', 'buffOwner'],
    semantics: {
      type: '"caster" | "buffOwner"',
      unionVariants: [{ type: '"caster"' }, { type: '"buffOwner"' }],
    },
    source: ['packages/game-data-contract/src/conditions.ts:477:7'],
    description: '检查施法者还是当前 Buff 持有者。',
  },
  skillTypes: definitionSchemaPart_40706b3285f99d15,
} as const;
const definitionSchemaPart_fec63550cb21999a = {
  kind: {
    kind: 'enum',
    options: ['damageScale'],
    semantics: { type: '"damageScale"' },
    source: ['packages/game-data-contract/src/modifiers.ts:237:3'],
    description: '处理器种类判别值。',
  },
  side: {
    kind: 'enum',
    options: ['defender', 'attacker'],
    semantics: {
      type: '"defender" | "attacker"',
      unionVariants: [{ type: '"defender"' }, { type: '"attacker"' }],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:239:3'],
    description: '修正属于攻击方还是防御方。',
  },
  zone: {
    kind: 'enum',
    options: ['product', 'normal', 'abnormalAndBurst', 'enhanced', 'combo', 'vulnerable', 'race'],
    semantics: {
      type: '"product" | "normal" | "abnormalAndBurst" | "enhanced" | "combo" | "vulnerable" | "race"',
      unionVariants: [
        { type: '"product"' },
        { type: '"normal"' },
        { type: '"abnormalAndBurst"' },
        { type: '"enhanced"' },
        { type: '"combo"' },
        { type: '"vulnerable"' },
        { type: '"race"' },
      ],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:241:3'],
    description: '写入的伤害倍率区间。',
  },
  addition: definitionSchemaPart_074f251b28a753b2,
} as const;
const definitionSchemaPart_0e8b34e8eb67ad25 = {
  kind: 'object',
  fields: definitionSchemaPart_a6c0e084dfc94ab6,
  semantics: {
    type: '{ kind: "originSkillTypeIn"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_bca61dd655021ad8 = {
  kind: 'object',
  fields: definitionSchemaPart_a6c0e084dfc94ab6,
  semantics: {
    type: '{ kind: "originSkillTypeIn"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_def057e70d633df4 = {
  kind: 'object',
  fields: definitionSchemaPart_a6c0e084dfc94ab6,
  semantics: {
    type: '{ kind: "originSkillTypeIn"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_1561385c78315161 = {
  kind: 'object',
  fields: definitionSchemaPart_a6c0e084dfc94ab6,
  semantics: {
    type: '{ kind: "originSkillTypeIn"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_c3553e7b3595e713 = {
  kind: 'object',
  fields: definitionSchemaPart_a6c0e084dfc94ab6,
  semantics: {
    type: '{ kind: "originSkillTypeIn"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_956d2e0ef56cf605 = {
  type: 'BuildModifierDefinition',
  unionVariants: [
    {
      type: '{ readonly kind: "attribute"; readonly attribute: BuildAttribute; readonly operation: "flat" | "percent"; readonly value: LevelValues; }',
    },
    {
      type: '{ readonly kind: "panelStat"; readonly stat: "attackPercent" | "criticalRate" | "artsIntensity" | "attackFlat" | "healthFlat" | "healthPercent" | "defenseFlat" | "defensePercent" | "criticalDamage" | "ultimateEnergyGainEfficiency" | "skillCooldownReduction" | "staggerDamagePercent"; readonly value: LevelValues; }',
    },
    {
      type: '{ readonly kind: "damageBonus"; readonly damageTypes: "physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; readonly skillTypes?: "comboSkill" | ... 7 more ... | undefined; readonly v...',
    },
    {
      type: '{ readonly kind: "damageScale"; readonly target: "physical" | "heat" | "cryo" | "electric" | "nature" | "ether" | "normalAttack" | "comboSkill" | "battleSkill" | "ultimate" | "staggeredEnemy"; readonly slot?: "addition" | ... 1 more ... | undefined; readonly value: LevelValues; }',
    },
    {
      type: '{ readonly kind: "staticHealingIncrease"; readonly target: "output" | "taken"; readonly value: LevelValues; }',
    },
    {
      type: '{ readonly kind: "skillCooldownMultiplier"; readonly skillTypes: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge" | readonly ("comboSkill" | ... 5 more ... | "dodge")[]; readonly value: LevelValues; }',
    },
  ],
} as const;
const definitionSchemaPart_5404fcca4118ce34 = {
  kind: {
    kind: 'enum',
    options: ['probability'],
    semantics: { type: '"probability"' },
    source: ['packages/game-data-contract/src/conditions.ts:201:7'],
    description: '以原生 RandomUtil.Dice(float) 对动作黑板或常量概率取样。',
  },
  probability: definitionSchemaPart_8c2034a56c852ba8,
} as const;
const definitionSchemaPart_ba85c47fbc5ff8ff = {
  kind: {
    kind: 'enum',
    options: ['probability'],
    semantics: { type: '"probability"' },
    source: ['packages/game-data-contract/src/conditions.ts:201:7'],
    description: '以原生 RandomUtil.Dice(float) 对动作黑板或常量概率取样。',
  },
  probability: definitionSchemaPart_866038e979837c3b,
} as const;
const definitionSchemaPart_b48a76fe82772bd0 = {
  kind: {
    kind: 'enum',
    options: ['targetPoiseCompare'],
    semantics: { type: '"targetPoiseCompare"' },
    source: ['packages/game-data-contract/src/modifiers.ts:171:7'],
    description: '比较敌人的当前失衡值。',
  },
  target: {
    kind: 'enum',
    options: ['enemy'],
    semantics: { type: '"enemy"' },
    source: ['packages/game-data-contract/src/modifiers.ts:173:7'],
    description: '当前只支持伤害目标。',
  },
  returnValueIfMissing: {
    kind: 'boolean',
    semantics: { type: 'boolean' },
    source: ['packages/game-data-contract/src/modifiers.ts:175:7'],
    description: '目标没有失衡条时直接采用的判断结果。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:177:7'],
    description: '数值比较符。',
  },
  value: definitionSchemaPart_bfaab7ed3a6735e6,
} as const;
const definitionSchemaPart_00bca9079bc7e631 = {
  kind: 'array',
  element: definitionSchemaPart_84e5afb09208bcca,
  semantics: {
    type: 'readonly SkillDefinition[] | undefined',
    arrayElement: {
      type: 'SkillDefinition',
      unionVariants: [
        {
          type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
        },
        { type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }' },
      ],
    },
    optional: true,
  },
  source: ['packages/game-data-contract/src/skills.ts:417:3'],
  optional: true,
  description:
    '与 `skills` 共用一个稳定放置身份、仅由运行时换槽动作选中的技能形态。\n这里只保存本组连续段或内部执行技能；独立可放置的替换操作应放在独立组的 skills 中。',
} as const;
const definitionSchemaPart_5c4ed9fd0bcdc3bd = {
  kind: 'object',
  fields: definitionSchemaPart_b1c7276d899f4291,
  semantics: {
    type: '{ readonly slot: "addition" | "multiplier" | "finalAddition" | "finalMultiplier" | "baseAddition" | "baseMultiplier" | "baseFinalAddition" | "baseFinalMultiplier"; readonly value: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:255:3'],
} as const;
const definitionSchemaPart_c84099fda229288d = {
  kind: 'object',
  fields: definitionSchemaPart_9d8aa2834ff90c0d,
  semantics: {
    type: '{ kind: "deckAttributeCompare"; left: "strength" | "agility" | "intellect" | "will"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: "strength" | ... 2 more ... | "will"; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_6da72c005ef05048 = {
  kind: 'object',
  fields: definitionSchemaPart_9d8aa2834ff90c0d,
  semantics: {
    type: '{ kind: "deckAttributeCompare"; left: "strength" | "agility" | "intellect" | "will"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: "strength" | ... 2 more ... | "will"; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_a9969f150a6b04c9 = {
  kind: 'object',
  fields: definitionSchemaPart_9d8aa2834ff90c0d,
  semantics: {
    type: '{ kind: "deckAttributeCompare"; left: "strength" | "agility" | "intellect" | "will"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: "strength" | ... 2 more ... | "will"; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_f85a621bb793bfcd = {
  kind: 'object',
  fields: definitionSchemaPart_9d8aa2834ff90c0d,
  semantics: {
    type: '{ kind: "deckAttributeCompare"; left: "strength" | "agility" | "intellect" | "will"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: "strength" | ... 2 more ... | "will"; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_0aafb31f46f463e8 = {
  kind: 'object',
  fields: definitionSchemaPart_9d8aa2834ff90c0d,
  semantics: {
    type: '{ kind: "deckAttributeCompare"; left: "strength" | "agility" | "intellect" | "will"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: "strength" | ... 2 more ... | "will"; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_5bab5ff16fe5ee40 = {
  kind: 'object',
  fields: definitionSchemaPart_ea4fc301f7e06133,
  semantics: {
    type: '{ kind: "operatorRoleIn"; target: "caster" | "eventTarget" | "buffOwner"; roles: readonly ("guard" | "caster" | "defender" | "vanguard" | "supporter" | "striker")[]; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_323009ce3ff86130 = {
  kind: 'object',
  fields: definitionSchemaPart_ea4fc301f7e06133,
  semantics: {
    type: '{ kind: "operatorRoleIn"; target: "caster" | "eventTarget" | "buffOwner"; roles: readonly ("guard" | "caster" | "defender" | "vanguard" | "supporter" | "striker")[]; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_c347e818f2b24603 = {
  kind: 'object',
  fields: definitionSchemaPart_ea4fc301f7e06133,
  semantics: {
    type: '{ kind: "operatorRoleIn"; target: "caster" | "eventTarget" | "buffOwner"; roles: readonly ("guard" | "caster" | "defender" | "vanguard" | "supporter" | "striker")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_625b0402290cb27a = {
  kind: 'object',
  fields: definitionSchemaPart_ea4fc301f7e06133,
  semantics: {
    type: '{ kind: "operatorRoleIn"; target: "caster" | "eventTarget" | "buffOwner"; roles: readonly ("guard" | "caster" | "defender" | "vanguard" | "supporter" | "striker")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_cd11cac2ebbf412c = {
  kind: 'object',
  fields: definitionSchemaPart_ea4fc301f7e06133,
  semantics: {
    type: '{ kind: "operatorRoleIn"; target: "caster" | "eventTarget" | "buffOwner"; roles: readonly ("guard" | "caster" | "defender" | "vanguard" | "supporter" | "striker")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_d74109a797c08662 = {
  type: 'readonly BuildModifierDefinition[] | undefined',
  arrayElement: definitionSchemaPart_956d2e0ef56cf605,
  optional: true,
} as const;
const definitionSchemaPart_7f6fbe4607f7b0e9 = {
  kind: 'object',
  fields: definitionSchemaPart_e2f87ae53156b76a,
  semantics: {
    type: '{ readonly kind: "composite"; readonly composite: "cryoAndElectricDamageIncrease" | "heatAndNatureDamageIncrease" | "allSkillDamageIncrease" | "allDamageReduction" | "spellDamageIncrease"; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:186:3'],
} as const;
const definitionSchemaPart_e4b6052e8b3cd1fc = {
  kind: 'array',
  element: definitionSchemaPart_16a2523ebbebff85,
  semantics: {
    type: 'readonly ModifyPoiseScalarProcessorDefinition[]',
    arrayElement: { type: 'ModifyPoiseScalarProcessorDefinition' },
  },
  source: ['packages/game-data-contract/src/modifiers.ts:413:3'],
  description: '按顺序执行的失衡伤害处理器。',
} as const;
const definitionSchemaPart_bbcac68e501eafd3 = {
  kind: {
    kind: 'enum',
    options: ['timedMarkerPresent'],
    semantics: { type: '"timedMarkerPresent"' },
    source: ['packages/game-data-contract/src/conditions.ts:399:7'],
    description: '检查目标能力系统中是否存在仍有效的原生定时标记。',
  },
  target: {
    kind: 'enum',
    options: ['enemy', 'caster', 'eventTarget', 'buffOwner', 'buffSource'],
    semantics: {
      type: '"enemy" | "caster" | "eventTarget" | "buffOwner" | "buffSource"',
      unionVariants: [
        { type: '"enemy"' },
        { type: '"caster"' },
        { type: '"eventTarget"' },
        { type: '"buffOwner"' },
        { type: '"buffSource"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:401:7'],
    description: '定时标记所属对象。',
  },
  markerId: definitionSchemaPart_f2a6bac7c63abd7c,
} as const;
const definitionSchemaPart_e193ef53584a19c4 = {
  kind: 'union',
  variants: [
    {
      kind: 'enum',
      options: ['crush', 'airborne', 'knockDown', 'fracture'],
      source: ['packages/game-data-contract/src/actions.ts:1754:7'],
      semantics: {
        type: '"crush" | "airborne" | "knockDown" | "fracture"',
        unionVariants: [
          { type: '"crush"' },
          { type: '"airborne"' },
          { type: '"knockDown"' },
          { type: '"fracture"' },
        ],
      },
    },
    definitionSchemaPart_34d192d0b9e5a680,
  ],
  semantics: definitionSchemaPart_74ceba95c0fd01a6,
  source: ['packages/game-data-contract/src/actions.ts:1754:7'],
  description: '任一匹配即可成立的物理异常。',
} as const;
const definitionSchemaPart_b56fddb972db2ae3 = {
  kind: 'object',
  fields: definitionSchemaPart_80f4f449ae048403,
  semantics: {
    type: '{ readonly kind: "attribute"; readonly attribute: BuildAttribute; readonly operation: "flat" | "percent"; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:58:7'],
} as const;
const definitionSchemaPart_24ca7b74d4fd9138 = {
  kind: {
    kind: 'enum',
    options: ['targetHealthCompare'],
    semantics: { type: '"targetHealthCompare"' },
    source: ['packages/game-data-contract/src/modifiers.ts:159:7'],
    description: '比较敌人的当前生命或生命比例。',
  },
  target: {
    kind: 'enum',
    options: ['enemy'],
    semantics: { type: '"enemy"' },
    source: ['packages/game-data-contract/src/modifiers.ts:161:7'],
    description: '当前只支持伤害目标。',
  },
  valueType: {
    kind: 'enum',
    options: ['current', 'ratio'],
    semantics: {
      type: '"current" | "ratio"',
      unionVariants: [{ type: '"current"' }, { type: '"ratio"' }],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:163:7'],
    description: '比较生命数值还是生命比例。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:165:7'],
    description: '数值比较符。',
  },
  value: definitionSchemaPart_e7026ddb9b766fd8,
} as const;
const definitionSchemaPart_86fa484f5b2cbd2f = {
  kind: 'object',
  fields: definitionSchemaPart_80f4f449ae048403,
  semantics: {
    type: '{ readonly kind: "attribute"; readonly attribute: BuildAttribute; readonly operation: "flat" | "percent"; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:128:3'],
} as const;
const definitionSchemaPart_64a2952b04c6de38 = {
  kind: 'object',
  fields: definitionSchemaPart_80f4f449ae048403,
  semantics: {
    type: '{ readonly kind: "attribute"; readonly attribute: BuildAttribute; readonly operation: "flat" | "percent"; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:184:3'],
} as const;
const definitionSchemaPart_c7bd32b629fdd328 = {
  kind: {
    kind: 'enum',
    options: ['modifyCalculationResult'],
    semantics: { type: '"modifyCalculationResult"' },
    source: ['packages/game-data-contract/src/modifiers.ts:325:3'],
    description: '处理器种类判别值。',
  },
  timing: {
    kind: 'enum',
    options: ['afterCalculation'],
    semantics: { type: '"afterCalculation"' },
    source: ['packages/game-data-contract/src/modifiers.ts:327:3'],
    description: '此处理器固定在基础计算完成后执行。',
  },
  baseMultiplier: definitionSchemaPart_b7033a0a6e64c4d0,
  multiplierCount: definitionSchemaPart_97202ce97abb0e79,
} as const;
const definitionSchemaPart_63e8b5294ce3d248 = {
  kind: 'object',
  fields: definitionSchemaPart_fec63550cb21999a,
  semantics: { type: 'DamageScaleProcessorDefinition' },
  source: ['packages/game-data-contract/src/buffs.ts:645:3'],
} as const;
const definitionSchemaPart_ffc94cc87a595253 = {
  kind: 'object',
  fields: definitionSchemaPart_9d8aa2834ff90c0d,
  semantics: {
    type: '{ kind: "deckAttributeCompare"; left: "strength" | "agility" | "intellect" | "will"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: "strength" | ... 2 more ... | "will"; }',
    aliases: ['BuildCondition'],
  },
  source: ['packages/game-data-contract/src/skills.ts:459:3'],
  description: '最终构筑满足此条件时选用该展示形态。',
} as const;
const definitionSchemaPart_0f7cdcc85f7b49cb = {
  kind: 'array',
  element: definitionSchemaPart_a3b8d984a97bcf47,
  semantics: {
    type: 'readonly RoutedSkillReplacementDefinition[] | undefined',
    arrayElement: { type: 'RoutedSkillReplacementDefinition' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/skills.ts:428:3'],
  optional: true,
  description:
    '本展示组中的转发技能。原生稳定槽位由 skillSlots 定义，与展示组独立；执行使用原生分类与等级源。\n仅用于原生输入旁路（例如战技包装器实际 Cast 连携技）；普通同组换槽继续使用 replacementSkills。',
} as const;
const definitionSchemaPart_3621527ae608567c = {
  kind: {
    kind: 'enum',
    options: ['panelStat'],
    semantics: { type: '"panelStat"' },
    source: ['packages/game-data-contract/src/buildModifiers.ts:68:5'],
    description: '修正种类判别值。',
  },
  stat: definitionSchemaPart_2849ca85eb4e177f,
  value: {
    kind: 'union',
    variants: [
      {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/buildModifiers.ts:72:5'],
      },
      {
        kind: 'array',
        element: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/buildModifiers.ts:72:5'],
        },
        semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
        source: ['packages/game-data-contract/src/buildModifiers.ts:72:5'],
      },
    ],
    semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
    source: ['packages/game-data-contract/src/buildModifiers.ts:72:5'],
    description: '单个数值或按等级排列的数值。',
  },
} as const;
const definitionSchemaPart_722e25f5c8608080 = {
  kind: {
    kind: 'enum',
    options: ['entityTagMatch'],
    semantics: { type: '"entityTagMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:359:7'],
    description: '查询目标实体当前持有的 GameplayTag；它与 Buff 身份、数量和层数无关。',
  },
  target: definitionSchemaPart_5a278619f689abe6,
  tagQueryType: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:363:7'],
    description: '标签集合匹配方式。',
  },
  tags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:365:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:365:7'],
    description: '参与匹配的实体标签。',
  },
} as const;
const definitionSchemaPart_482cdeaaf598c598 = {
  attributeSource: {
    kind: 'enum',
    options: ['buffOwner', 'buffSource'],
    semantics: {
      type: '"buffOwner" | "buffSource" | undefined',
      optional: true,
      unionVariants: [{ type: '"buffOwner"' }, { type: '"buffSource"' }],
    },
    source: ['packages/game-data-contract/src/buffs.ts:309:3'],
    optional: true,
    description: '读取 Buff 持有者还是 Buff 来源；省略时使用运行时默认对象。',
  },
  attribute: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/buffs.ts:311:3'],
    description: '要读取的原生属性名称。',
  },
  multiplier: definitionSchemaPart_c849d2a9ab3aec48,
  addition: definitionSchemaPart_d4d8546905123255,
} as const;
const definitionSchemaPart_62fa1d1f3b9cbc0c = {
  kind: 'object',
  fields: definitionSchemaPart_772f6a2adaa8b122,
  semantics: {
    type: '{ kind: "abilityEntityTimedMarkerPresent"; markerId: ActionStringOperand; contextKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_77c2f4af2a43d0c1 = {
  kind: 'object',
  fields: definitionSchemaPart_772f6a2adaa8b122,
  semantics: {
    type: '{ kind: "abilityEntityTimedMarkerPresent"; markerId: ActionStringOperand; contextKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_9fc068952444ca9c = {
  kind: 'object',
  fields: definitionSchemaPart_772f6a2adaa8b122,
  semantics: {
    type: '{ kind: "abilityEntityTimedMarkerPresent"; markerId: ActionStringOperand; contextKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_87892a7c5309ca3d = {
  kind: 'object',
  fields: definitionSchemaPart_772f6a2adaa8b122,
  semantics: {
    type: '{ kind: "abilityEntityTimedMarkerPresent"; markerId: ActionStringOperand; contextKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_8a5c9f10ef3173ef = {
  kind: 'object',
  fields: definitionSchemaPart_772f6a2adaa8b122,
  semantics: {
    type: '{ kind: "abilityEntityTimedMarkerPresent"; markerId: ActionStringOperand; contextKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_e50510c4b08aa933 = {
  kind: 'object',
  fields: definitionSchemaPart_5404fcca4118ce34,
  semantics: { type: '{ kind: "probability"; probability: ActionValueOperand; }' },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_3e9ad6c058205923 = {
  kind: 'object',
  fields: definitionSchemaPart_ba85c47fbc5ff8ff,
  semantics: { type: '{ kind: "probability"; probability: ActionValueOperand; }' },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_ff63ec594135fc85 = {
  kind: 'object',
  fields: definitionSchemaPart_663a154adcff8e7f,
  semantics: { type: 'BuffSustainedProtectionDefinition | undefined', optional: true },
  source: ['packages/game-data-contract/src/buffs.ts:724:3'],
  optional: true,
  description: 'Buff 启用期间提供的霸体值和抗冲击值，可作用于持有者或 Buff 来源。',
} as const;
const definitionSchemaPart_7574a6b0ba20f84f = {
  kind: 'object',
  fields: definitionSchemaPart_5404fcca4118ce34,
  semantics: { type: '{ kind: "probability"; probability: ActionValueOperand; }' },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_1fcf1b1484c6a655 = {
  kind: 'object',
  fields: definitionSchemaPart_5404fcca4118ce34,
  semantics: { type: '{ kind: "probability"; probability: ActionValueOperand; }' },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_11f38d1719d85ed3 = {
  kind: 'object',
  fields: definitionSchemaPart_5404fcca4118ce34,
  semantics: { type: '{ kind: "probability"; probability: ActionValueOperand; }' },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_e839a7d0a5bf08e1 = {
  kind: 'object',
  fields: definitionSchemaPart_ba85c47fbc5ff8ff,
  semantics: { type: '{ kind: "probability"; probability: ActionValueOperand; }' },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_5b0017e1b1f57e1f = {
  kind: 'object',
  fields: definitionSchemaPart_ba85c47fbc5ff8ff,
  semantics: { type: '{ kind: "probability"; probability: ActionValueOperand; }' },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_b57eb24ae4bfa1ef = {
  kind: 'object',
  fields: definitionSchemaPart_ba85c47fbc5ff8ff,
  semantics: { type: '{ kind: "probability"; probability: ActionValueOperand; }' },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_f3fc4953a0633eba = {
  damageType: {
    kind: 'enum',
    options: ['physical', 'heat', 'cryo', 'electric', 'nature', 'true', 'lifeDrain', 'ether'],
    semantics: {
      type: '"physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether"',
      unionVariants: [
        { type: '"physical"' },
        { type: '"heat"' },
        { type: '"cryo"' },
        { type: '"electric"' },
        { type: '"nature"' },
        { type: '"true"' },
        { type: '"lifeDrain"' },
        { type: '"ether"' },
      ],
    },
    source: ['packages/game-data-contract/src/buffs.ts:299:3'],
    description: '适用的伤害类型。',
  },
  ratio: definitionSchemaPart_2952333b1a530d8d,
  scale: definitionSchemaPart_8b65129dfae5d330,
} as const;
const definitionSchemaPart_fd6b36f6b7ce8bff = {
  kind: {
    kind: 'enum',
    options: ['damageScale'],
    semantics: { type: '"damageScale"' },
    source: ['packages/game-data-contract/src/buildModifiers.ts:88:5'],
    description: '修正种类判别值。',
  },
  target: definitionSchemaPart_f8742e7874f53291,
  slot: {
    kind: 'enum',
    options: ['addition', 'baseAddition'],
    semantics: {
      type: '"addition" | "baseAddition" | undefined',
      optional: true,
      unionVariants: [{ type: '"baseAddition"' }, { type: '"addition"' }],
    },
    source: ['packages/game-data-contract/src/buildModifiers.ts:92:5'],
    optional: true,
    description: '写入基础加算槽还是普通加算槽；旧数据省略时使用基础加算槽。',
  },
  value: {
    kind: 'union',
    variants: [
      {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/buildModifiers.ts:94:5'],
      },
      {
        kind: 'array',
        element: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/buildModifiers.ts:94:5'],
        },
        semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
        source: ['packages/game-data-contract/src/buildModifiers.ts:94:5'],
      },
    ],
    semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
    source: ['packages/game-data-contract/src/buildModifiers.ts:94:5'],
    description: '单个倍率或按等级排列的倍率。',
  },
} as const;
const definitionSchemaPart_e9e2fdda559e9722 = {
  type: 'DamageModifierExternalCondition',
  unionVariants: [
    {
      type: '{ readonly kind: "entityTagMatch"; readonly target: "enemy" | "caster"; readonly tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; readonly tags: readonly string[]; }',
    },
    { type: '{ readonly kind: "casterControlled"; }' },
    {
      type: '{ readonly kind: "buffIdCountCompare"; readonly target: "enemy" | "caster"; readonly buffIds: readonly string[]; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
    },
    {
      type: '{ readonly kind: "eventDamageTagsMatch"; readonly match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; readonly tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | ... 12 more ... | "natureAbnormal")[]; }',
    },
    {
      type: '{ readonly kind: "eventDamageFeaturesMatch"; readonly match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; readonly features: readonly ("canBreakWeakness" | "crush" | "airborne" | "knockDown" | ... 4 more ... | "physicalInfliction")[]; }',
    },
    {
      type: '{ readonly kind: "eventDamageTypesMatch"; readonly damageTypes: readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; }',
    },
    {
      type: '{ readonly kind: "targetHealthCompare"; readonly target: "enemy"; readonly valueType: "current" | "ratio"; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
    },
    {
      type: '{ readonly kind: "targetPoiseCompare"; readonly target: "enemy"; readonly returnValueIfMissing: boolean; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
    },
  ],
} as const;
const definitionSchemaPart_d18691cd422ae105 = {
  kind: 'object',
  fields: definitionSchemaPart_0e44f362ce4e9b9f,
  semantics: {
    type: '{ kind: "eventSpGainMatch"; sources?: readonly ("normalAttack" | "powerAttack" | "default" | "skill")[] | undefined; gainKinds?: readonly ("gain" | "refund")[] | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_3cda66caa074690e = {
  kind: 'object',
  fields: definitionSchemaPart_0e44f362ce4e9b9f,
  semantics: {
    type: '{ kind: "eventSpGainMatch"; sources?: readonly ("normalAttack" | "powerAttack" | "default" | "skill")[] | undefined; gainKinds?: readonly ("gain" | "refund")[] | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_6b9fe018960e22f7 = {
  kind: 'object',
  fields: definitionSchemaPart_0e44f362ce4e9b9f,
  semantics: {
    type: '{ kind: "eventSpGainMatch"; sources?: readonly ("normalAttack" | "powerAttack" | "default" | "skill")[] | undefined; gainKinds?: readonly ("gain" | "refund")[] | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_fef55e2bf38f4f88 = {
  kind: 'object',
  fields: definitionSchemaPart_0e44f362ce4e9b9f,
  semantics: {
    type: '{ kind: "eventSpGainMatch"; sources?: readonly ("normalAttack" | "powerAttack" | "default" | "skill")[] | undefined; gainKinds?: readonly ("gain" | "refund")[] | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_f46683eecce06912 = {
  kind: 'object',
  fields: definitionSchemaPart_0e44f362ce4e9b9f,
  semantics: {
    type: '{ kind: "eventSpGainMatch"; sources?: readonly ("normalAttack" | "powerAttack" | "default" | "skill")[] | undefined; gainKinds?: readonly ("gain" | "refund")[] | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_168b2eab0fd3cf52 = {
  kind: 'union',
  variants: [
    {
      kind: 'enum',
      options: ['physical', 'heat', 'cryo', 'electric', 'nature'],
      source: ['packages/game-data-contract/src/actions.ts:1746:7'],
      semantics: {
        type: '"physical" | "heat" | "cryo" | "electric" | "nature"',
        unionVariants: [
          { type: '"physical"' },
          { type: '"heat"' },
          { type: '"cryo"' },
          { type: '"electric"' },
          { type: '"nature"' },
        ],
      },
    },
    definitionSchemaPart_a93a5de537849245,
  ],
  semantics: definitionSchemaPart_b837dd8537ab8594,
  source: ['packages/game-data-contract/src/actions.ts:1746:7'],
  description: '任一匹配即可成立的元素。',
} as const;
const definitionSchemaPart_b9d44e4279e6133c = {
  kind: 'object',
  fields: definitionSchemaPart_131dc623d8e7a828,
  semantics: {
    type: '{ kind: "damageTagHit"; tag: "normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | "comboSkill" | "ultimateSkill" | "plungingAttack" | "dashAttack" | "fireBurst" | ... 6 more ... | "natureAbnormal"; scope: "team" | "operator"; }',
  },
  source: ['packages/game-data-contract/src/actions.ts:1798:3'],
} as const;
const definitionSchemaPart_45a4a575c30b47af = {
  kind: 'object',
  fields: definitionSchemaPart_131dc623d8e7a828,
  semantics: {
    type: '{ kind: "damageTagHit"; tag: "normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | "comboSkill" | "ultimateSkill" | "plungingAttack" | "dashAttack" | "fireBurst" | ... 6 more ... | "natureAbnormal"; scope: "team" | "operator"; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:109:9'],
} as const;
const definitionSchemaPart_daeb1cd0753b62ea = {
  kind: 'union',
  variants: [
    {
      kind: 'enum',
      options: ['physical', 'heat', 'cryo', 'electric', 'nature'],
      source: ['packages/game-data-contract/src/conditions.ts:621:7'],
      semantics: {
        type: '"physical" | "heat" | "cryo" | "electric" | "nature"',
        unionVariants: [
          { type: '"physical"' },
          { type: '"heat"' },
          { type: '"cryo"' },
          { type: '"electric"' },
          { type: '"nature"' },
        ],
      },
    },
    definitionSchemaPart_1e4328f8d9ecbedb,
  ],
  semantics: definitionSchemaPart_b837dd8537ab8594,
  source: ['packages/game-data-contract/src/conditions.ts:621:7'],
  description: '任一匹配即可成立的元素。',
} as const;
const definitionSchemaPart_c4c3d4c6bbc2377a = {
  kind: {
    kind: 'enum',
    options: ['buffIdCountCompare'],
    semantics: { type: '"buffIdCountCompare"' },
    source: ['packages/game-data-contract/src/modifiers.ts:125:7'],
    description: '比较指定对象身上若干 Buff 的实例总数。',
  },
  target: {
    kind: 'enum',
    options: ['enemy', 'caster'],
    semantics: {
      type: '"enemy" | "caster"',
      unionVariants: [{ type: '"caster"' }, { type: '"enemy"' }],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:127:7'],
    description: '要统计 Buff 的对象。',
  },
  buffIds: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/modifiers.ts:129:7'],
    },
    semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
    source: ['packages/game-data-contract/src/modifiers.ts:129:7'],
    description: '计入统计的 Buff ID。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:131:7'],
    description: '计数比较符。',
  },
  value: definitionSchemaPart_d18c11d49c3b7694,
} as const;
const definitionSchemaPart_8a26dd6691760b20 = {
  kind: 'object',
  fields: definitionSchemaPart_c7bd32b629fdd328,
  semantics: { type: 'ModifyHealCalculationResultProcessorDefinition' },
  source: ['packages/game-data-contract/src/modifiers.ts:353:3'],
} as const;
const definitionSchemaPart_9603253a5f475d3d = {
  key: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/skills.ts:457:3'],
    description: '展示形态在技能组中的唯一名称。',
  },
  condition: definitionSchemaPart_ffc94cc87a595253,
} as const;
const definitionSchemaPart_21a514fa7a12609d = {
  kind: 'array',
  element: definitionSchemaPart_11030d46dd898a38,
  semantics: definitionSchemaPart_7304eeda7e1ab432,
  source: ['packages/game-data-contract/src/conditions.ts:237:7'],
} as const;
const definitionSchemaPart_17cdecfd73695601 = {
  kind: 'array',
  element: definitionSchemaPart_692797c5ef99e89a,
  semantics: definitionSchemaPart_7304eeda7e1ab432,
  source: ['packages/game-data-contract/src/conditions.ts:243:7'],
} as const;
const definitionSchemaPart_5bc139c97723871e = {
  kind: 'object',
  fields: definitionSchemaPart_482cdeaaf598c598,
  semantics: { type: 'BuffShieldAttributeValue' },
  source: ['packages/game-data-contract/src/buffs.ts:323:3'],
} as const;
const definitionSchemaPart_fa6b9d1bf658e283 = {
  kind: 'object',
  fields: definitionSchemaPart_b02d4e4cf76f0857,
  semantics: {
    type: '{ kind: "currentSkillTypeIn"; target: "caster" | "buffOwner"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_2a8e0c8982b89e9b = {
  kind: 'object',
  fields: definitionSchemaPart_b02d4e4cf76f0857,
  semantics: {
    type: '{ kind: "currentSkillTypeIn"; target: "caster" | "buffOwner"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_ed81cd713d5fcdbe = {
  kind: 'object',
  fields: definitionSchemaPart_b02d4e4cf76f0857,
  semantics: {
    type: '{ kind: "currentSkillTypeIn"; target: "caster" | "buffOwner"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_2385b8d31e0aa7b4 = {
  kind: 'object',
  fields: definitionSchemaPart_b02d4e4cf76f0857,
  semantics: {
    type: '{ kind: "currentSkillTypeIn"; target: "caster" | "buffOwner"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_42eb93b4cedb4f6b = {
  kind: 'object',
  fields: definitionSchemaPart_b02d4e4cf76f0857,
  semantics: {
    type: '{ kind: "currentSkillTypeIn"; target: "caster" | "buffOwner"; skillTypes: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_c9e47ef31d4f2d5b = {
  kind: 'object',
  fields: definitionSchemaPart_7b6569932525aaa7,
  semantics: {
    type: '{ readonly kind: "targetHealthCompare"; readonly valueType: "current" | "ratio"; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: HealModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:351:3'],
} as const;
const definitionSchemaPart_9c5b30c6b4bbbeb4 = {
  kind: {
    kind: 'enum',
    options: ['eventDamageFeaturesMatch'],
    semantics: { type: '"eventDamageFeaturesMatch"' },
    source: ['packages/game-data-contract/src/modifiers.ts:145:7'],
    description: '检查本次伤害携带的特征。',
  },
  match: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll', 'exact'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
        { type: '"exact"' },
      ],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:147:7'],
    description: '特征集合的匹配方式。',
  },
  features: definitionSchemaPart_9a268077c1ce210d,
} as const;
const definitionSchemaPart_9e079670224f120f = {
  kind: 'object',
  fields: definitionSchemaPart_f3fc4953a0633eba,
  semantics: { type: 'BuffShieldDamageAbsorptionDefinition' },
  source: ['packages/game-data-contract/src/buffs.ts:325:3'],
} as const;
const definitionSchemaPart_e798c0ecdf73b58f = {
  kind: {
    kind: 'enum',
    options: ['eventDamageFeaturesMatch'],
    semantics: { type: '"eventDamageFeaturesMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:431:7'],
    description: '匹配触发当前响应的伤害行为特征；普通技能步骤没有事件上下文。',
  },
  match: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll', 'exact'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
        { type: '"exact"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:433:7'],
    description: '特征集合匹配方式。',
  },
  features: definitionSchemaPart_88861fd0940fb61e,
} as const;
const definitionSchemaPart_3f4a237a57771ca4 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_bd5ac3c22afcbbc1,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['infinite'],
          semantics: { type: '"infinite"' },
          source: ['packages/game-data-contract/src/skills.ts:117:9'],
          description: '无限生命周期判别值。',
        },
      },
      semantics: { type: '{ readonly kind: "infinite"; }' },
      source: ['packages/game-data-contract/src/skills.ts:107:3'],
    },
  ],
  semantics: {
    type: '{ readonly kind: "limited"; readonly durationSeconds: AbilityEntityDefinitionNumber; } | { readonly kind: "infinite"; }',
    unionVariants: [
      {
        type: '{ readonly kind: "limited"; readonly durationSeconds: AbilityEntityDefinitionNumber; }',
      },
      { type: '{ readonly kind: "infinite"; }' },
    ],
  },
  source: ['packages/game-data-contract/src/skills.ts:107:3'],
  description: '能力实体的寿命：限定秒数或无限持续。',
} as const;
const definitionSchemaPart_46e6262693dc28b8 = {
  kind: 'object',
  fields: definitionSchemaPart_bbcac68e501eafd3,
  semantics: {
    type: '{ kind: "timedMarkerPresent"; target: "enemy" | "caster" | "eventTarget" | "buffOwner" | "buffSource"; markerId: ActionStringOperand; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_008536a97c7d2542 = {
  kind: {
    kind: 'enum',
    options: ['buffBlackboardCompare'],
    semantics: { type: '"buffBlackboardCompare"' },
    source: ['packages/game-data-contract/src/modifiers.ts:305:7'],
    description: '比较同一 Buff 黑板中的两个动态值或常量。',
  },
  left: definitionSchemaPart_bbc8b9908a6cf331,
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:309:7'],
    description: '数值比较符。',
  },
  right: definitionSchemaPart_93707cb7e46faf81,
} as const;
const definitionSchemaPart_d802c3b1d746539e = {
  kind: 'object',
  fields: definitionSchemaPart_bbcac68e501eafd3,
  semantics: {
    type: '{ kind: "timedMarkerPresent"; target: "enemy" | "caster" | "eventTarget" | "buffOwner" | "buffSource"; markerId: ActionStringOperand; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_28ae51a31e1bb521 = {
  kind: 'object',
  fields: definitionSchemaPart_bbcac68e501eafd3,
  semantics: {
    type: '{ kind: "timedMarkerPresent"; target: "enemy" | "caster" | "eventTarget" | "buffOwner" | "buffSource"; markerId: ActionStringOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_e8c2e40dbfc2534d = {
  kind: 'object',
  fields: definitionSchemaPart_bbcac68e501eafd3,
  semantics: {
    type: '{ kind: "timedMarkerPresent"; target: "enemy" | "caster" | "eventTarget" | "buffOwner" | "buffSource"; markerId: ActionStringOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_e30d083bfbf844c8 = {
  kind: 'object',
  fields: definitionSchemaPart_bbcac68e501eafd3,
  semantics: {
    type: '{ kind: "timedMarkerPresent"; target: "enemy" | "caster" | "eventTarget" | "buffOwner" | "buffSource"; markerId: ActionStringOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_78e08ce498d975bf = {
  kind: {
    kind: 'enum',
    options: ['buffBlackboardCompare'],
    semantics: { type: '"buffBlackboardCompare"' },
    source: ['packages/game-data-contract/src/modifiers.ts:192:7'],
    description: '比较同一 Buff 黑板中的两个动态值或常量。',
  },
  left: definitionSchemaPart_98f68c65ee110b4d,
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:196:7'],
    description: '数值比较符。',
  },
  right: definitionSchemaPart_519d43b34132a9e4,
} as const;
const definitionSchemaPart_b950e976a6c4c73f = {
  kind: 'object',
  fields: definitionSchemaPart_b48a76fe82772bd0,
  semantics: {
    type: '{ readonly kind: "targetPoiseCompare"; readonly target: "enemy"; readonly returnValueIfMissing: boolean; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:643:3'],
} as const;
const definitionSchemaPart_789b511a17f0bfd0 = {
  kind: 'object',
  fields: definitionSchemaPart_b48a76fe82772bd0,
  semantics: {
    type: '{ readonly kind: "targetPoiseCompare"; readonly target: "enemy"; readonly returnValueIfMissing: boolean; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
} as const;
const definitionSchemaPart_0ac9d3f5e458b521 = {
  kind: 'object',
  fields: definitionSchemaPart_b48a76fe82772bd0,
  semantics: {
    type: '{ readonly kind: "targetPoiseCompare"; readonly target: "enemy"; readonly returnValueIfMissing: boolean; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
} as const;
const definitionSchemaPart_bd57b9b997825f04 = {
  kind: 'object',
  fields: definitionSchemaPart_b48a76fe82772bd0,
  semantics: {
    type: '{ readonly kind: "targetPoiseCompare"; readonly target: "enemy"; readonly returnValueIfMissing: boolean; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
} as const;
const definitionSchemaPart_172a77c9c4f0e27b = {
  kind: 'object',
  fields: definitionSchemaPart_722e25f5c8608080,
  semantics: {
    type: '{ kind: "entityTagMatch"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_569fd6ebe2d793cd = {
  kind: 'object',
  fields: definitionSchemaPart_722e25f5c8608080,
  semantics: {
    type: '{ kind: "entityTagMatch"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_5093ce3deeda4e4d = {
  kind: 'object',
  fields: definitionSchemaPart_722e25f5c8608080,
  semantics: {
    type: '{ kind: "entityTagMatch"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_66781cf7cffe07d6 = {
  kind: 'object',
  fields: definitionSchemaPart_722e25f5c8608080,
  semantics: {
    type: '{ kind: "entityTagMatch"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_789e422ae597c655 = {
  kind: 'object',
  fields: definitionSchemaPart_722e25f5c8608080,
  semantics: {
    type: '{ kind: "entityTagMatch"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; tags: readonly string[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_0f9bc9c82733739a = {
  kind: 'object',
  fields: definitionSchemaPart_9603253a5f475d3d,
  semantics: { type: 'SkillPresentationVariantDefinition' },
  source: ['packages/game-data-contract/src/skills.ts:430:3'],
} as const;
const definitionSchemaPart_f08212bd34ddfa44 = {
  triggerBuffIds: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/buffs.ts:418:3'],
    },
    semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
    source: ['packages/game-data-contract/src/buffs.ts:418:3'],
    description: '其中任一 Buff 加入时触发关键词强化。',
  },
  operation: {
    kind: 'enum',
    options: ['assign', 'add', 'multiply'],
    semantics: {
      type: '"assign" | "add" | "multiply"',
      unionVariants: [{ type: '"assign"' }, { type: '"add"' }, { type: '"multiply"' }],
    },
    source: ['packages/game-data-contract/src/buffs.ts:420:3'],
    description: '对关键词数值执行赋值、加算或乘算。',
  },
  targetKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/buffs.ts:422:3'],
    description: '要修改的关键词数值名称。',
  },
  initialValue: definitionSchemaPart_315a387ccb37e437,
  value: definitionSchemaPart_ce3d2f408e40ea53,
} as const;
const definitionSchemaPart_b2b5e5aa7f27e67e = {
  kind: {
    kind: 'enum',
    options: ['enemySuperArmorCompare'],
    semantics: { type: '"enemySuperArmorCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:99:7'],
    description: '比较当前单敌人的原生整数超级护甲值。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:101:7'],
    description: '数值比较符。',
  },
  value: definitionSchemaPart_b14936c0d60cd127,
} as const;
const definitionSchemaPart_0359586d735c184d = {
  kind: {
    kind: 'enum',
    options: ['enemySuperArmorCompare'],
    semantics: { type: '"enemySuperArmorCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:99:7'],
    description: '比较当前单敌人的原生整数超级护甲值。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:101:7'],
    description: '数值比较符。',
  },
  value: definitionSchemaPart_dbfddf083f619cfd,
} as const;
const definitionSchemaPart_a3cf0a4b00bf281d = {
  kind: {
    kind: 'enum',
    options: ['cameraToTargetAngleCompare'],
    semantics: { type: '"cameraToTargetAngleCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:107:7'],
    description: '比较镜头前向到施法者→目标方向、绕世界上轴的有符号角度。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:109:7'],
    description: '角度比较符。',
  },
  value: definitionSchemaPart_329d6b9fbdd9f3b8,
} as const;
const definitionSchemaPart_cb44b47142e2dc40 = {
  kind: {
    kind: 'enum',
    options: ['cameraToTargetAngleCompare'],
    semantics: { type: '"cameraToTargetAngleCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:107:7'],
    description: '比较镜头前向到施法者→目标方向、绕世界上轴的有符号角度。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:109:7'],
    description: '角度比较符。',
  },
  value: definitionSchemaPart_ac4b5a621d511e63,
} as const;
const definitionSchemaPart_80da45353908699e = {
  kind: 'object',
  fields: definitionSchemaPart_24ca7b74d4fd9138,
  semantics: {
    type: '{ readonly kind: "targetHealthCompare"; readonly target: "enemy"; readonly valueType: "current" | "ratio"; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:643:3'],
} as const;
const definitionSchemaPart_730128473335a884 = {
  kind: 'object',
  fields: definitionSchemaPart_24ca7b74d4fd9138,
  semantics: {
    type: '{ readonly kind: "targetHealthCompare"; readonly target: "enemy"; readonly valueType: "current" | "ratio"; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
} as const;
const definitionSchemaPart_ef693f37b3d73bbf = {
  kind: 'object',
  fields: definitionSchemaPart_24ca7b74d4fd9138,
  semantics: {
    type: '{ readonly kind: "targetHealthCompare"; readonly target: "enemy"; readonly valueType: "current" | "ratio"; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
} as const;
const definitionSchemaPart_66fb0465a2cde59a = {
  kind: 'object',
  fields: definitionSchemaPart_24ca7b74d4fd9138,
  semantics: {
    type: '{ readonly kind: "targetHealthCompare"; readonly target: "enemy"; readonly valueType: "current" | "ratio"; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
} as const;
const definitionSchemaPart_24a708926014462a = {
  kind: {
    kind: 'enum',
    options: ['currentBuffStackCompare'],
    semantics: { type: '"currentBuffStackCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:321:7'],
    description: 'Environment 查询只读取执行中 Buff 的增强层数，不查询任何目标容器。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:323:7'],
    description: '层数比较符。',
  },
  value: definitionSchemaPart_83295db8054a8699,
} as const;
const definitionSchemaPart_af713676057f0fdc = {
  kind: {
    kind: 'enum',
    options: ['currentBuffStackCompare'],
    semantics: { type: '"currentBuffStackCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:321:7'],
    description: 'Environment 查询只读取执行中 Buff 的增强层数，不查询任何目标容器。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:323:7'],
    description: '层数比较符。',
  },
  value: definitionSchemaPart_5cdd9e7e109a8f97,
} as const;
const definitionSchemaPart_dd1fc483d6f446ca = {
  kind: 'array',
  element: definitionSchemaPart_b1848ed51895cf33,
  semantics: definitionSchemaPart_696ddc5ee252e88d,
  source: ['packages/game-data-contract/src/modifiers.ts:141:7'],
  description: '参与匹配的伤害标签。',
} as const;
const definitionSchemaPart_8b64b9c4d5696e8b = {
  kind: 'array',
  element: definitionSchemaPart_7ae43a42d05eb6fe,
  semantics: definitionSchemaPart_696ddc5ee252e88d,
  source: ['packages/game-data-contract/src/modifiers.ts:385:7'],
  description: '参与匹配的伤害标签。',
} as const;
const definitionSchemaPart_08728fa2a2e66fd3 = {
  kind: 'array',
  element: definitionSchemaPart_2d7d8c95ede920b5,
  semantics: definitionSchemaPart_696ddc5ee252e88d,
  source: ['packages/game-data-contract/src/conditions.ts:419:7'],
  description: '参与匹配的伤害标签。',
} as const;
const definitionSchemaPart_8815a76d72c5eccc = {
  kind: 'array',
  element: definitionSchemaPart_9e079670224f120f,
  semantics: {
    type: 'readonly BuffShieldDamageAbsorptionDefinition[]',
    arrayElement: { type: 'BuffShieldDamageAbsorptionDefinition' },
  },
  source: ['packages/game-data-contract/src/buffs.ts:325:3'],
  description: '针对不同伤害类型的吸收规则。',
} as const;
const definitionSchemaPart_d940d256033a9d70 = {
  kind: {
    kind: 'enum',
    options: ['physicalInflictionApplied'],
    semantics: { type: '"physicalInflictionApplied"' },
    source: ['packages/game-data-contract/src/actions.ts:1752:7'],
    description: '指定范围内成功施加一种物理异常。',
  },
  types: definitionSchemaPart_e193ef53584a19c4,
  scope: {
    kind: 'enum',
    options: ['team', 'operator'],
    semantics: {
      type: '"team" | "operator"',
      unionVariants: [{ type: '"team"' }, { type: '"operator"' }],
    },
    source: ['packages/game-data-contract/src/actions.ts:1756:7'],
    description: '检查当前干员还是全队来源。',
  },
} as const;
const definitionSchemaPart_3f6133453df275c6 = {
  kind: 'object',
  fields: definitionSchemaPart_3621527ae608567c,
  semantics: {
    type: '{ readonly kind: "panelStat"; readonly stat: "attackPercent" | "criticalRate" | "artsIntensity" | "attackFlat" | "healthFlat" | "healthPercent" | "defenseFlat" | "defensePercent" | "criticalDamage" | "ultimateEnergyGainEfficiency" | "skillCooldownReduction" | "staggerDamagePercent"; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:58:7'],
} as const;
const definitionSchemaPart_6d88fb7f2195066f = {
  kind: 'object',
  fields: definitionSchemaPart_3621527ae608567c,
  semantics: {
    type: '{ readonly kind: "panelStat"; readonly stat: "attackPercent" | "criticalRate" | "artsIntensity" | "attackFlat" | "healthFlat" | "healthPercent" | "defenseFlat" | "defensePercent" | "criticalDamage" | "ultimateEnergyGainEfficiency" | "skillCooldownReduction" | "staggerDamagePercent"; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:128:3'],
} as const;
const definitionSchemaPart_8a0a5618637bd468 = {
  kind: 'object',
  fields: definitionSchemaPart_3621527ae608567c,
  semantics: {
    type: '{ readonly kind: "panelStat"; readonly stat: "attackPercent" | "criticalRate" | "artsIntensity" | "attackFlat" | "healthFlat" | "healthPercent" | "defenseFlat" | "defensePercent" | "criticalDamage" | "ultimateEnergyGainEfficiency" | "skillCooldownReduction" | "staggerDamagePercent"; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:184:3'],
} as const;
const definitionSchemaPart_f58bc279c8d2a4a4 = {
  kind: 'object',
  fields: definitionSchemaPart_f08212bd34ddfa44,
  semantics: { type: 'BuffKeywordEnhancementDefinition' },
  source: ['packages/game-data-contract/src/buffs.ts:716:3'],
} as const;
const definitionSchemaPart_caeb6b64b06deea6 = {
  kind: 'object',
  fields: definitionSchemaPart_fd6b36f6b7ce8bff,
  semantics: {
    type: '{ readonly kind: "damageScale"; readonly target: "physical" | "heat" | "cryo" | "electric" | "nature" | "ether" | "normalAttack" | "comboSkill" | "battleSkill" | "ultimate" | "staggeredEnemy"; readonly slot?: "addition" | ... 1 more ... | undefined; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:58:7'],
} as const;
const definitionSchemaPart_40d5166c4f499d36 = {
  kind: 'object',
  fields: definitionSchemaPart_fd6b36f6b7ce8bff,
  semantics: {
    type: '{ readonly kind: "damageScale"; readonly target: "physical" | "heat" | "cryo" | "electric" | "nature" | "ether" | "normalAttack" | "comboSkill" | "battleSkill" | "ultimate" | "staggeredEnemy"; readonly slot?: "addition" | ... 1 more ... | undefined; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:128:3'],
} as const;
const definitionSchemaPart_c75076e556f42d09 = {
  kind: 'object',
  fields: definitionSchemaPart_fd6b36f6b7ce8bff,
  semantics: {
    type: '{ readonly kind: "damageScale"; readonly target: "physical" | "heat" | "cryo" | "electric" | "nature" | "ether" | "normalAttack" | "comboSkill" | "battleSkill" | "ultimate" | "staggeredEnemy"; readonly slot?: "addition" | ... 1 more ... | undefined; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:184:3'],
} as const;
const definitionSchemaPart_0940715d2b972676 = {
  kind: 'object',
  fields: definitionSchemaPart_c4c3d4c6bbc2377a,
  semantics: {
    type: '{ readonly kind: "buffIdCountCompare"; readonly target: "enemy" | "caster"; readonly buffIds: readonly string[]; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:643:3'],
} as const;
const definitionSchemaPart_4ebbdcfe1ab8da96 = {
  kind: 'object',
  fields: definitionSchemaPart_c4c3d4c6bbc2377a,
  semantics: {
    type: '{ readonly kind: "buffIdCountCompare"; readonly target: "enemy" | "caster"; readonly buffIds: readonly string[]; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
} as const;
const definitionSchemaPart_f37ee6189c2b3454 = {
  kind: 'object',
  fields: definitionSchemaPart_c4c3d4c6bbc2377a,
  semantics: {
    type: '{ readonly kind: "buffIdCountCompare"; readonly target: "enemy" | "caster"; readonly buffIds: readonly string[]; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
} as const;
const definitionSchemaPart_282ca731c3016c2e = {
  kind: 'object',
  fields: definitionSchemaPart_c4c3d4c6bbc2377a,
  semantics: {
    type: '{ readonly kind: "buffIdCountCompare"; readonly target: "enemy" | "caster"; readonly buffIds: readonly string[]; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly value: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
} as const;
const definitionSchemaPart_52c097c0ec10ca30 = {
  kind: 'union',
  variants: [definitionSchemaPart_ed95cd4bd8b19f3c, definitionSchemaPart_56558def06a48384],
  semantics: {
    type: '{ kind: "id"; buffIds: readonly string[]; } | { kind: "tag"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; }',
    unionVariants: [
      { type: '{ kind: "id"; buffIds: readonly string[]; }' },
      {
        type: '{ kind: "tag"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; }',
      },
    ],
  },
  source: ['packages/game-data-contract/src/conditions.ts:175:7'],
  description: '按 Buff ID 或 Buff 标签查找。',
} as const;
const definitionSchemaPart_e1302fa47bbc5da1 = {
  kind: {
    kind: 'enum',
    options: ['elementalInflictionPresent'],
    semantics: { type: '"elementalInflictionPresent"' },
    source: ['packages/game-data-contract/src/conditions.ts:619:7'],
    description: '检查敌人身上是否存在指定元素附着。',
  },
  elements: definitionSchemaPart_daeb1cd0753b62ea,
  minimumStacks: {
    kind: 'number',
    semantics: { type: 'number | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:623:7'],
    optional: true,
    description: '至少需要达到的附着层数。',
  },
} as const;
const definitionSchemaPart_0ccacf38a4a210ed = {
  kind: 'object',
  fields: definitionSchemaPart_9c5b30c6b4bbbeb4,
  semantics: {
    type: '{ readonly kind: "eventDamageFeaturesMatch"; readonly match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; readonly features: readonly ("canBreakWeakness" | "crush" | "airborne" | "knockDown" | ... 4 more ... | "physicalInfliction")[]; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:643:3'],
} as const;
const definitionSchemaPart_8eac86513cc1c067 = {
  kind: 'object',
  fields: definitionSchemaPart_9c5b30c6b4bbbeb4,
  semantics: {
    type: '{ readonly kind: "eventDamageFeaturesMatch"; readonly match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; readonly features: readonly ("canBreakWeakness" | "crush" | "airborne" | "knockDown" | ... 4 more ... | "physicalInfliction")[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
} as const;
const definitionSchemaPart_5e650b5f5970e498 = {
  kind: 'object',
  fields: definitionSchemaPart_9c5b30c6b4bbbeb4,
  semantics: {
    type: '{ readonly kind: "eventDamageFeaturesMatch"; readonly match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; readonly features: readonly ("canBreakWeakness" | "crush" | "airborne" | "knockDown" | ... 4 more ... | "physicalInfliction")[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
} as const;
const definitionSchemaPart_27b242c01ccd7bbe = {
  kind: 'object',
  fields: definitionSchemaPart_9c5b30c6b4bbbeb4,
  semantics: {
    type: '{ readonly kind: "eventDamageFeaturesMatch"; readonly match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; readonly features: readonly ("canBreakWeakness" | "crush" | "airborne" | "knockDown" | ... 4 more ... | "physicalInfliction")[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
} as const;
const definitionSchemaPart_a3c0bae873541f33 = {
  kind: 'object',
  fields: definitionSchemaPart_008536a97c7d2542,
  semantics: {
    type: '{ readonly kind: "buffBlackboardCompare"; readonly left: HealModifierNumber; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly right: HealModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:351:3'],
} as const;
const definitionSchemaPart_392558a592e8a022 = {
  kind: {
    kind: 'enum',
    options: ['eventConsumedBuffLayerCompare'],
    semantics: { type: '"eventConsumedBuffLayerCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:559:7'],
    description: '比较 OnConsumeBuff 事件快照中的实际消费层数；命中后可写入动作黑板。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:561:7'],
    description: '层数比较符。',
  },
  value: definitionSchemaPart_62079a5f902bde54,
  outputKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:565:7'],
    optional: true,
    description: '条件命中后保存实际消费层数的动作黑板键。',
  },
} as const;
const definitionSchemaPart_f92085ee005a2923 = {
  kind: 'object',
  fields: definitionSchemaPart_78e08ce498d975bf,
  semantics: {
    type: '{ readonly kind: "buffBlackboardCompare"; readonly left: DamageModifierNumber; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly right: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:643:3'],
} as const;
const definitionSchemaPart_73732e08456db48e = {
  kind: {
    kind: 'enum',
    options: ['eventConsumedBuffLayerCompare'],
    semantics: { type: '"eventConsumedBuffLayerCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:559:7'],
    description: '比较 OnConsumeBuff 事件快照中的实际消费层数；命中后可写入动作黑板。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:561:7'],
    description: '层数比较符。',
  },
  value: definitionSchemaPart_7cf4e38a45667d29,
  outputKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:565:7'],
    optional: true,
    description: '条件命中后保存实际消费层数的动作黑板键。',
  },
} as const;
const definitionSchemaPart_8dc435109fa5665b = {
  kind: 'object',
  fields: definitionSchemaPart_78e08ce498d975bf,
  semantics: {
    type: '{ readonly kind: "buffBlackboardCompare"; readonly left: DamageModifierNumber; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly right: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
} as const;
const definitionSchemaPart_f3440810dcdb9c78 = {
  kind: 'object',
  fields: definitionSchemaPart_78e08ce498d975bf,
  semantics: {
    type: '{ readonly kind: "buffBlackboardCompare"; readonly left: DamageModifierNumber; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly right: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
} as const;
const definitionSchemaPart_651707965d5dd214 = {
  kind: 'object',
  fields: definitionSchemaPart_78e08ce498d975bf,
  semantics: {
    type: '{ readonly kind: "buffBlackboardCompare"; readonly left: DamageModifierNumber; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly right: DamageModifierNumber; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
} as const;
const definitionSchemaPart_ccc4655399bf0c90 = {
  kind: 'object',
  fields: definitionSchemaPart_e798c0ecdf73b58f,
  semantics: {
    type: '{ kind: "eventDamageFeaturesMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; features: readonly ("canBreakWeakness" | "crush" | "airborne" | "knockDown" | "shatter" | "dot" | "remainArea" | "talentDamage" | "physicalInfliction")[]; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_d50b3af05eca555f = {
  kind: {
    kind: 'enum',
    options: ['elementalInflictionApplied'],
    semantics: { type: '"elementalInflictionApplied"' },
    source: ['packages/game-data-contract/src/actions.ts:1744:7'],
    description: '指定范围内成功施加一种元素附着。',
  },
  elements: definitionSchemaPart_168b2eab0fd3cf52,
  scope: {
    kind: 'enum',
    options: ['team', 'operator'],
    semantics: {
      type: '"team" | "operator"',
      unionVariants: [{ type: '"team"' }, { type: '"operator"' }],
    },
    source: ['packages/game-data-contract/src/actions.ts:1748:7'],
    description: '检查当前干员还是全队来源。',
  },
} as const;
const definitionSchemaPart_31b9e38a26303bc9 = {
  kind: 'object',
  fields: definitionSchemaPart_e798c0ecdf73b58f,
  semantics: {
    type: '{ kind: "eventDamageFeaturesMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; features: readonly ("canBreakWeakness" | "crush" | "airborne" | "knockDown" | "shatter" | "dot" | "remainArea" | "talentDamage" | "physicalInfliction")[]; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_a154f62b2daf4cc3 = {
  kind: 'object',
  fields: definitionSchemaPart_b2b5e5aa7f27e67e,
  semantics: {
    type: '{ kind: "enemySuperArmorCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_d90044f141ad6fb2 = {
  kind: 'object',
  fields: definitionSchemaPart_0359586d735c184d,
  semantics: {
    type: '{ kind: "enemySuperArmorCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_1cb5104bda53fd85 = {
  kind: 'object',
  fields: definitionSchemaPart_e798c0ecdf73b58f,
  semantics: {
    type: '{ kind: "eventDamageFeaturesMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; features: readonly ("canBreakWeakness" | "crush" | "airborne" | "knockDown" | "shatter" | "dot" | "remainArea" | "talentDamage" | "physicalInfliction")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_a495d1a2e51c106b = {
  kind: 'object',
  fields: definitionSchemaPart_e798c0ecdf73b58f,
  semantics: {
    type: '{ kind: "eventDamageFeaturesMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; features: readonly ("canBreakWeakness" | "crush" | "airborne" | "knockDown" | "shatter" | "dot" | "remainArea" | "talentDamage" | "physicalInfliction")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_d687d9b459294c6f = {
  kind: 'object',
  fields: definitionSchemaPart_e798c0ecdf73b58f,
  semantics: {
    type: '{ kind: "eventDamageFeaturesMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; features: readonly ("canBreakWeakness" | "crush" | "airborne" | "knockDown" | "shatter" | "dot" | "remainArea" | "talentDamage" | "physicalInfliction")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_5139519e85fdbbac = {
  kind: 'object',
  fields: definitionSchemaPart_b2b5e5aa7f27e67e,
  semantics: {
    type: '{ kind: "enemySuperArmorCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_f42ea4965d36dac7 = {
  kind: 'object',
  fields: definitionSchemaPart_b2b5e5aa7f27e67e,
  semantics: {
    type: '{ kind: "enemySuperArmorCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_40999a8989da4e36 = {
  kind: 'object',
  fields: definitionSchemaPart_b2b5e5aa7f27e67e,
  semantics: {
    type: '{ kind: "enemySuperArmorCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_30065d374da22c72 = {
  kind: 'array',
  element: definitionSchemaPart_0f9bc9c82733739a,
  semantics: {
    type: 'readonly SkillPresentationVariantDefinition[] | undefined',
    arrayElement: { type: 'SkillPresentationVariantDefinition' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/skills.ts:430:3'],
  optional: true,
  description: '同一稳定技能组的 UI 变体，不会产生独立的释放身份。',
} as const;
const definitionSchemaPart_03b432aa4b84d3fd = {
  kind: 'object',
  fields: definitionSchemaPart_0359586d735c184d,
  semantics: {
    type: '{ kind: "enemySuperArmorCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_706b73a345ad7cbe = {
  kind: 'object',
  fields: definitionSchemaPart_0359586d735c184d,
  semantics: {
    type: '{ kind: "enemySuperArmorCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_2266646bb08e7b2d = {
  kind: 'object',
  fields: definitionSchemaPart_0359586d735c184d,
  semantics: {
    type: '{ kind: "enemySuperArmorCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_43e6f0d1e11980ec = {
  kind: 'object',
  fields: definitionSchemaPart_a3cf0a4b00bf281d,
  semantics: {
    type: '{ kind: "cameraToTargetAngleCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_b1c9759c84db869a = {
  kind: 'object',
  fields: definitionSchemaPart_cb44b47142e2dc40,
  semantics: {
    type: '{ kind: "cameraToTargetAngleCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_53cdbdcc69e4e495 = {
  kind: 'object',
  fields: definitionSchemaPart_a3cf0a4b00bf281d,
  semantics: {
    type: '{ kind: "cameraToTargetAngleCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_9cb17fc82b4fc856 = {
  kind: 'object',
  fields: definitionSchemaPart_a3cf0a4b00bf281d,
  semantics: {
    type: '{ kind: "cameraToTargetAngleCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_9fbd3d3cb7af0341 = {
  kind: 'object',
  fields: definitionSchemaPart_a3cf0a4b00bf281d,
  semantics: {
    type: '{ kind: "cameraToTargetAngleCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_e9f06312c4b12587 = {
  kind: 'object',
  fields: definitionSchemaPart_cb44b47142e2dc40,
  semantics: {
    type: '{ kind: "cameraToTargetAngleCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_8d3a111db3eb9b5f = {
  kind: 'object',
  fields: definitionSchemaPart_cb44b47142e2dc40,
  semantics: {
    type: '{ kind: "cameraToTargetAngleCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_bd5940bcc69326d0 = {
  kind: 'object',
  fields: definitionSchemaPart_cb44b47142e2dc40,
  semantics: {
    type: '{ kind: "cameraToTargetAngleCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_a422670d313ea69e = {
  kind: 'object',
  fields: definitionSchemaPart_24a708926014462a,
  semantics: {
    type: '{ kind: "currentBuffStackCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_13355c6469532970 = {
  kind: 'object',
  fields: definitionSchemaPart_af713676057f0fdc,
  semantics: {
    type: '{ kind: "currentBuffStackCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_67b4ff7bf1fff9bd = {
  kind: 'object',
  fields: definitionSchemaPart_24a708926014462a,
  semantics: {
    type: '{ kind: "currentBuffStackCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_80a2746311290620 = {
  kind: 'object',
  fields: definitionSchemaPart_24a708926014462a,
  semantics: {
    type: '{ kind: "currentBuffStackCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_1fc21de6959314f8 = {
  kind: 'object',
  fields: definitionSchemaPart_24a708926014462a,
  semantics: {
    type: '{ kind: "currentBuffStackCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_82f4890ec9815057 = {
  kind: 'object',
  fields: definitionSchemaPart_af713676057f0fdc,
  semantics: {
    type: '{ kind: "currentBuffStackCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_c49f7fdcc6f97ed2 = {
  kind: 'object',
  fields: definitionSchemaPart_af713676057f0fdc,
  semantics: {
    type: '{ kind: "currentBuffStackCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_8f078401d3f65ad2 = {
  kind: 'object',
  fields: definitionSchemaPart_af713676057f0fdc,
  semantics: {
    type: '{ kind: "currentBuffStackCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_115e6d40d5e40862 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['skillSlot'],
          semantics: { type: '"skillSlot"' },
          source: ['packages/game-data-contract/src/skills.ts:223:7'],
          description: '通过一个可被运行时替换的技能槽选技能。',
        },
        skillSlotKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/skills.ts:225:7'],
          description: '要读取的技能槽。',
        },
      },
      semantics: { type: '{ readonly kind: "skillSlot"; readonly skillSlotKey: string; }' },
      source: ['packages/game-data-contract/src/operators.ts:546:3'],
    },
    definitionSchemaPart_2381d944f8927353,
  ],
  semantics: {
    type: 'PlayerActionRouteDefinition | undefined',
    optional: true,
    unionVariants: [
      { type: '{ readonly kind: "skillSlot"; readonly skillSlotKey: string; }' },
      {
        type: '{ readonly kind: "basicAttack"; readonly skillKeys: readonly string[]; readonly normalAttackSkillKeys?: readonly string[] | undefined; readonly defaultSkillKey?: string | undefined; }',
      },
    ],
  },
  source: ['packages/game-data-contract/src/operators.ts:546:3'],
  optional: true,
} as const;
const definitionSchemaPart_8d786ef8bbca3efb = {
  type: 'UpgradeModifierDefinition',
  unionVariants: [
    { type: '{ kind: "addConditionalDamage"; condition: CombatCondition; values: LevelValues; }' },
    { type: '{ kind: "enableSkillBranch"; skillKey: string; branchKey: string; }' },
    {
      type: '{ kind: "multiplyEffectDuration"; skillKey: string; stepKey: string; multiplier: number; }',
    },
    {
      type: '{ kind: "multiplySkillCost"; skillKey: string; resource: "sp" | "ultimateEnergy"; multiplier: number; }',
    },
    { type: '{ kind: "setEffectiveness"; skillKey: string; stepKey: string; value: number; }' },
    {
      type: '{ kind: "addStaticDamageIncrease"; target: "physical" | "cryo" | "electric" | "normalAttack" | "battleSkill"; value: number; }',
    },
    { type: '{ kind: "addStaticHealingIncrease"; target: "output" | "taken"; value: number; }' },
    { type: '{ kind: "addSkillStat"; skillKey: string; stat: "criticalRate"; value: number; }' },
    {
      type: '{ kind: "patchSkillBlackboard"; skillKey: string; blackboardKey: string; operation: "assign" | "add" | "multiply"; value: LevelValues; minimumUpgradeLevel?: number | undefined; maximumUpgradeLevel?: number | undefined; condition?: { ...; } | undefined; }',
    },
    {
      type: '{ kind: "patchPassiveBlackboard"; passiveSkillKey: string; blackboardKey: string; operation: "assign" | "add" | "multiply"; value: LevelValues; }',
    },
    { type: '{ kind: "multiplySkillDamage"; skillKey: string; multiplier: number; }' },
    {
      type: '{ kind: "multiplyStepDamage"; skillKey: string; stepKey: string; multiplier: number; }',
    },
    {
      type: '{ kind: "multiplySkillCooldown"; skillKey: string; branchKey?: string | undefined; multiplier: number; }',
    },
    {
      type: '{ kind: "addSkillCooldownFrames"; skillKey: string; frames: number; condition?: { kind: "deckAttributeCompare"; left: "strength" | "agility" | "intellect" | "will"; operator: "equal" | ... 4 more ... | "lessOrEqual"; right: "strength" | ... 2 more ... | "will"; } | undefined; }',
    },
    {
      type: '{ kind: "addBuildAttribute"; attributes: readonly ("strength" | "agility" | "intellect" | "will")[]; value: number; }',
    },
    {
      type: '{ kind: "modifyBasePanelStat"; stat: "health" | "defense" | "criticalRate" | "artsIntensity"; operation: "flat" | "percent"; value: number; }',
    },
    {
      type: '{ kind: "addReactionDuration"; reaction: "electrification" | "corrosion"; seconds: LevelValues; }',
    },
    {
      type: '{ kind: "addReactionEffectiveness"; reaction: "electrification" | "corrosion"; value: LevelValues; }',
    },
  ],
} as const;
const definitionSchemaPart_14490bd1e3ddf34d = {
  type: 'DamageModifierCondition',
  unionVariants: [
    definitionSchemaPart_e9e2fdda559e9722,
    { type: '{ readonly kind: "sourceSkillCastMatch"; }' },
    {
      type: '{ readonly kind: "buffBlackboardCompare"; readonly left: DamageModifierNumber; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly right: DamageModifierNumber; }',
    },
    { type: '{ readonly kind: "not"; readonly condition: DamageModifierCondition; }' },
    { type: '{ readonly kind: "all"; readonly conditions: readonly DamageModifierCondition[]; }' },
    { type: '{ readonly kind: "any"; readonly conditions: readonly DamageModifierCondition[]; }' },
  ],
} as const;
const definitionSchemaPart_b86a15a28215b62d = {
  kind: {
    kind: 'enum',
    options: ['poiseCompare'],
    semantics: { type: '"poiseCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:141:7'],
    description: '比较目标当前失衡值；目标没有失衡系统时返回原生配置值。',
  },
  target: {
    kind: 'enum',
    options: ['enemy', 'caster'],
    semantics: {
      type: '"enemy" | "caster"',
      unionVariants: [{ type: '"enemy"' }, { type: '"caster"' }],
    },
    source: ['packages/game-data-contract/src/conditions.ts:143:7'],
    description: '要检查的施法者或敌人。',
  },
  returnValueIfMissing: {
    kind: 'boolean',
    semantics: { type: 'boolean' },
    source: ['packages/game-data-contract/src/conditions.ts:145:7'],
    description: '目标没有失衡系统时直接采用的结果。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:147:7'],
    description: '数值比较符。',
  },
  value: definitionSchemaPart_1429c7ed04b86024,
} as const;
const definitionSchemaPart_251c30bf1eaf00ca = {
  kind: {
    kind: 'enum',
    options: ['poiseCompare'],
    semantics: { type: '"poiseCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:141:7'],
    description: '比较目标当前失衡值；目标没有失衡系统时返回原生配置值。',
  },
  target: {
    kind: 'enum',
    options: ['enemy', 'caster'],
    semantics: {
      type: '"enemy" | "caster"',
      unionVariants: [{ type: '"enemy"' }, { type: '"caster"' }],
    },
    source: ['packages/game-data-contract/src/conditions.ts:143:7'],
    description: '要检查的施法者或敌人。',
  },
  returnValueIfMissing: {
    kind: 'boolean',
    semantics: { type: 'boolean' },
    source: ['packages/game-data-contract/src/conditions.ts:145:7'],
    description: '目标没有失衡系统时直接采用的结果。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:147:7'],
    description: '数值比较符。',
  },
  value: definitionSchemaPart_d1c8c81379b84025,
} as const;
const definitionSchemaPart_2bb238d7194f87ab = {
  type: 'DamageModifierCondition | undefined',
  optional: true,
  unionVariants: [
    definitionSchemaPart_e9e2fdda559e9722,
    { type: '{ readonly kind: "sourceSkillCastMatch"; }' },
    {
      type: '{ readonly kind: "buffBlackboardCompare"; readonly left: DamageModifierNumber; readonly operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; readonly right: DamageModifierNumber; }',
    },
    { type: '{ readonly kind: "not"; readonly condition: DamageModifierCondition; }' },
    { type: '{ readonly kind: "all"; readonly conditions: readonly DamageModifierCondition[]; }' },
    { type: '{ readonly kind: "any"; readonly conditions: readonly DamageModifierCondition[]; }' },
  ],
} as const;
const definitionSchemaPart_00276e4cc8821ccb = {
  kind: 'object',
  fields: definitionSchemaPart_d940d256033a9d70,
  semantics: {
    type: '{ kind: "physicalInflictionApplied"; types: "crush" | "airborne" | "knockDown" | "fracture" | readonly ("crush" | "airborne" | "knockDown" | "fracture")[]; scope: "team" | "operator"; }',
  },
  source: ['packages/game-data-contract/src/actions.ts:1798:3'],
} as const;
const definitionSchemaPart_d9fbd4a4aff896b1 = {
  kind: 'object',
  fields: definitionSchemaPart_d940d256033a9d70,
  semantics: {
    type: '{ kind: "physicalInflictionApplied"; types: "crush" | "airborne" | "knockDown" | "fracture" | readonly ("crush" | "airborne" | "knockDown" | "fracture")[]; scope: "team" | "operator"; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:109:9'],
} as const;
const definitionSchemaPart_9a2a01cd9390f812 = {
  kind: 'array',
  element: definitionSchemaPart_f58bc279c8d2a4a4,
  semantics: {
    type: 'readonly BuffKeywordEnhancementDefinition[] | undefined',
    arrayElement: { type: 'BuffKeywordEnhancementDefinition' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/buffs.ts:716:3'],
  optional: true,
  description:
    '指定的其他 Buff 成功加入同一持有者时，对当前 Buff 的关键词倍率执行赋值、加法或乘法。',
} as const;
const definitionSchemaPart_7c3aefbfef91ddf5 = {
  type: 'readonly DamageModifierCondition[]',
  arrayElement: definitionSchemaPart_14490bd1e3ddf34d,
} as const;
const definitionSchemaPart_24f63c03ebda0970 = {
  kind: {
    kind: 'enum',
    options: ['eventDamageTagsMatch'],
    semantics: { type: '"eventDamageTagsMatch"' },
    source: ['packages/game-data-contract/src/modifiers.ts:381:7'],
    description: '检查本次伤害携带的标签。',
  },
  match: {
    kind: 'enum',
    options: ['hasAny', 'hasAll'],
    semantics: {
      type: '"hasAny" | "hasAll"',
      unionVariants: [{ type: '"hasAny"' }, { type: '"hasAll"' }],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:383:7'],
    description: '匹配任一标签或全部标签。',
  },
  tags: definitionSchemaPart_8b64b9c4d5696e8b,
} as const;
const definitionSchemaPart_b4dd6fc9eb91b48d = {
  commandMappings: definitionSchemaPart_cf3fcd16d46d0278,
  allowedNextSkills: definitionSchemaPart_868548306e77bc1b,
  hasConditionalActions: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/skills.ts:327:5'],
    optional: true,
    description: '存在条件或嵌套输入 Action；当前输入状态不足时必须返回未知而不是猜测。',
  },
} as const;
const definitionSchemaPart_8927a6248b9bbaa4 = {
  kind: {
    kind: 'enum',
    options: ['contextTargetBuffIdStackCompare'],
    semantics: { type: '"contextTargetBuffIdStackCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:289:7'],
    description: 'CheckBuffStackNumAdvanced(Id) 的命名组首目标增强层数；空组直接 false。',
  },
  contextKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:291:7'],
    description: '动作环境中的目标组名称。',
  },
  buffIds: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:293:7'],
    },
    semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
    source: ['packages/game-data-contract/src/conditions.ts:293:7'],
    description: '任一匹配即可选中的 Buff ID。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:295:7'],
    description: '层数比较符。',
  },
  value: definitionSchemaPart_6c4e49ae5d19618d,
} as const;
const definitionSchemaPart_7248a1c7dd8c70bf = {
  kind: {
    kind: 'enum',
    options: ['contextTargetBuffIdStackCompare'],
    semantics: { type: '"contextTargetBuffIdStackCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:289:7'],
    description: 'CheckBuffStackNumAdvanced(Id) 的命名组首目标增强层数；空组直接 false。',
  },
  contextKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:291:7'],
    description: '动作环境中的目标组名称。',
  },
  buffIds: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:293:7'],
    },
    semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
    source: ['packages/game-data-contract/src/conditions.ts:293:7'],
    description: '任一匹配即可选中的 Buff ID。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:295:7'],
    description: '层数比较符。',
  },
  value: definitionSchemaPart_f3441a7dae322066,
} as const;
const definitionSchemaPart_9906a72e26f72132 = {
  kind: 'ref',
  ref: 'field_74df3d9546567817b535',
  semantics: definitionSchemaPart_14490bd1e3ddf34d,
  source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
  description: '要取反的条件。',
} as const;
const definitionSchemaPart_d9035991eaa48819 = {
  kind: 'union',
  variants: [
    {
      kind: 'enum',
      options: ['physical', 'heat', 'cryo', 'electric', 'nature', 'true', 'lifeDrain', 'ether'],
      source: ['packages/game-data-contract/src/buildModifiers.ts:79:5'],
      semantics: {
        type: '"physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether"',
        unionVariants: [
          { type: '"physical"' },
          { type: '"heat"' },
          { type: '"cryo"' },
          { type: '"electric"' },
          { type: '"nature"' },
          { type: '"true"' },
          { type: '"lifeDrain"' },
          { type: '"ether"' },
        ],
      },
    },
    definitionSchemaPart_74a9986f57845bec,
  ],
  semantics: definitionSchemaPart_7a7767ce498ce0b3,
  source: ['packages/game-data-contract/src/buildModifiers.ts:79:5'],
  description: '此加成覆盖的伤害类型。',
} as const;
const definitionSchemaPart_c7235ab8a0b4d301 = {
  kind: 'object',
  fields: definitionSchemaPart_392558a592e8a022,
  semantics: {
    type: '{ kind: "eventConsumedBuffLayerCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_fbbcd055ec442051 = {
  kind: 'object',
  fields: definitionSchemaPart_73732e08456db48e,
  semantics: {
    type: '{ kind: "eventConsumedBuffLayerCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_e0bcb7e01876454f = {
  kind: 'object',
  fields: definitionSchemaPart_392558a592e8a022,
  semantics: {
    type: '{ kind: "eventConsumedBuffLayerCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_813d6470048d173b = {
  kind: 'object',
  fields: definitionSchemaPart_392558a592e8a022,
  semantics: {
    type: '{ kind: "eventConsumedBuffLayerCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_2cf713125ca503c5 = {
  kind: 'object',
  fields: definitionSchemaPart_392558a592e8a022,
  semantics: {
    type: '{ kind: "eventConsumedBuffLayerCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_9719873e95f240b2 = {
  kind: 'object',
  fields: definitionSchemaPart_73732e08456db48e,
  semantics: {
    type: '{ kind: "eventConsumedBuffLayerCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_36a4a7cebbc59019 = {
  kind: 'object',
  fields: definitionSchemaPart_73732e08456db48e,
  semantics: {
    type: '{ kind: "eventConsumedBuffLayerCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_896653460e5c5945 = {
  kind: 'object',
  fields: definitionSchemaPart_73732e08456db48e,
  semantics: {
    type: '{ kind: "eventConsumedBuffLayerCompare"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; outputKey?: string | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_731e5b36ad12b09e = {
  kind: 'object',
  fields: definitionSchemaPart_e1302fa47bbc5da1,
  semantics: {
    type: '{ kind: "elementalInflictionPresent"; elements: "physical" | "heat" | "cryo" | "electric" | "nature" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]; minimumStacks?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_49155e7364128b95 = {
  kind: 'object',
  fields: definitionSchemaPart_e1302fa47bbc5da1,
  semantics: {
    type: '{ kind: "elementalInflictionPresent"; elements: "physical" | "heat" | "cryo" | "electric" | "nature" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]; minimumStacks?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_d7d2d35220d27b45 = {
  kind: 'object',
  fields: definitionSchemaPart_e1302fa47bbc5da1,
  semantics: {
    type: '{ kind: "elementalInflictionPresent"; elements: "physical" | "heat" | "cryo" | "electric" | "nature" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]; minimumStacks?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_53b47b91f4806984 = {
  kind: 'object',
  fields: definitionSchemaPart_e1302fa47bbc5da1,
  semantics: {
    type: '{ kind: "elementalInflictionPresent"; elements: "physical" | "heat" | "cryo" | "electric" | "nature" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]; minimumStacks?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_5ce6099668a163c7 = {
  kind: 'object',
  fields: definitionSchemaPart_e1302fa47bbc5da1,
  semantics: {
    type: '{ kind: "elementalInflictionPresent"; elements: "physical" | "heat" | "cryo" | "electric" | "nature" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]; minimumStacks?: number | undefined; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_c88917211142fe57 = {
  kind: 'union',
  variants: [
    {
      kind: 'number',
      semantics: { type: 'number' },
      source: ['packages/game-data-contract/src/buffs.ts:323:3'],
    },
    {
      kind: 'object',
      fields: {
        blackboardKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/buffs.ts:264:7'],
          description: '读取持续秒数的 Buff 黑板键。',
        },
      },
      semantics: { type: '{ readonly blackboardKey: string; }' },
      source: ['packages/game-data-contract/src/buffs.ts:323:3'],
    },
    definitionSchemaPart_5bc139c97723871e,
  ],
  semantics: {
    type: 'BuffDuration | BuffShieldAttributeValue',
    unionVariants: [
      {
        type: 'BuffDuration',
        unionVariants: [{ type: 'number' }, { type: '{ readonly blackboardKey: string; }' }],
      },
      { type: 'BuffShieldAttributeValue' },
    ],
  },
  source: ['packages/game-data-contract/src/buffs.ts:323:3'],
  description: '固定护盾值、黑板数值或按属性计算的护盾值。',
} as const;
const definitionSchemaPart_9ff88c2ecb8fefd0 = {
  kind: 'ref',
  ref: 'field_498d3bc7ee2662b24c3c',
  semantics: definitionSchemaPart_7c3aefbfef91ddf5,
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
  description: '需要同时成立的条件。',
} as const;
const definitionSchemaPart_41280393697147c4 = {
  kind: 'ref',
  ref: 'field_01e39cedc30061b15589',
  semantics: definitionSchemaPart_7c3aefbfef91ddf5,
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
  description: '只需其中一项成立的条件。',
} as const;
const definitionSchemaPart_5cebfe7586a9cc39 = {
  kind: 'object',
  fields: definitionSchemaPart_d50b3af05eca555f,
  semantics: {
    type: '{ kind: "elementalInflictionApplied"; elements: "physical" | "heat" | "cryo" | "electric" | "nature" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]; scope: "team" | "operator"; }',
  },
  source: ['packages/game-data-contract/src/actions.ts:1798:3'],
} as const;
const definitionSchemaPart_a769edf2b424873a = {
  kind: 'object',
  fields: definitionSchemaPart_d50b3af05eca555f,
  semantics: {
    type: '{ kind: "elementalInflictionApplied"; elements: "physical" | "heat" | "cryo" | "electric" | "nature" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature")[]; scope: "team" | "operator"; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:109:9'],
} as const;
const definitionSchemaPart_1474d833e4d26934 = {
  kind: {
    kind: 'enum',
    options: ['eventDamageTagsMatch'],
    semantics: { type: '"eventDamageTagsMatch"' },
    source: ['packages/game-data-contract/src/modifiers.ts:137:7'],
    description: '检查本次伤害携带的伤害标签。',
  },
  match: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll', 'exact'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
        { type: '"exact"' },
      ],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:139:7'],
    description: '标签集合的匹配方式。',
  },
  tags: definitionSchemaPart_dd1fc483d6f446ca,
} as const;
const definitionSchemaPart_f86c2d22b6c48588 = {
  kind: {
    kind: 'enum',
    options: ['eventDamageTagsMatch'],
    semantics: { type: '"eventDamageTagsMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:415:7'],
    description: '匹配触发当前响应的伤害事件标签；普通技能步骤没有事件上下文。',
  },
  match: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll', 'exact'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
        { type: '"exact"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:417:7'],
    description: '标签集合匹配方式。',
  },
  tags: definitionSchemaPart_08728fa2a2e66fd3,
} as const;
const definitionSchemaPart_6e4366feaffeb577 = {
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
      source: ['packages/game-data-contract/src/buildModifiers.ts:110:5'],
      semantics: {
        type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
        unionVariants: [
          { type: '"comboSkill"' },
          { type: '"plungingAttack"' },
          { type: '"basicAttack"' },
          { type: '"battleSkill"' },
          { type: '"ultimate"' },
          { type: '"finisher"' },
          { type: '"dodge"' },
        ],
      },
    },
    definitionSchemaPart_ecdba3f9c4a783c4,
  ],
  semantics: definitionSchemaPart_e62d253df519fb11,
  source: ['packages/game-data-contract/src/buildModifiers.ts:110:5'],
  description: '此倍率覆盖的技能类型。',
} as const;
const definitionSchemaPart_05933cc9471210d2 = {
  kind: {
    kind: 'enum',
    options: ['not'],
    semantics: { type: '"not"' },
    source: ['packages/game-data-contract/src/modifiers.ts:202:7'],
    description: '对一个子条件取反。',
  },
  condition: definitionSchemaPart_9906a72e26f72132,
} as const;
const definitionSchemaPart_b48329a116bb0c03 = {
  attribute: definitionSchemaPart_c0d4bb8ae5047bcb,
  slot: definitionSchemaPart_e700051f705fef8b,
  value: definitionSchemaPart_1f8929e2584cbdcf,
  target: {
    kind: 'enum',
    options: ['buffSource', 'owner'],
    semantics: {
      type: '"buffSource" | "owner" | undefined',
      optional: true,
      unionVariants: [{ type: '"owner"' }, { type: '"buffSource"' }],
    },
    source: ['packages/game-data-contract/src/buffs.ts:625:3'],
    optional: true,
    description: '修正 Buff 持有者还是 Buff 来源；省略时修正持有者。',
  },
  source: {
    kind: 'enum',
    options: ['converted'],
    semantics: { type: '"converted" | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:627:3'],
    optional: true,
    description: '以换算属性来源写入，避免再次参与属性换算。',
  },
} as const;
const definitionSchemaPart_7e1b0ee8c9c5138f = {
  kind: 'object',
  fields: definitionSchemaPart_b86a15a28215b62d,
  semantics: {
    type: '{ kind: "poiseCompare"; target: "enemy" | "caster"; returnValueIfMissing: boolean; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_32a03cd7746d3aa4 = {
  kind: 'object',
  fields: definitionSchemaPart_251c30bf1eaf00ca,
  semantics: {
    type: '{ kind: "poiseCompare"; target: "enemy" | "caster"; returnValueIfMissing: boolean; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_46ee76e8c5756a41 = {
  kind: 'object',
  fields: definitionSchemaPart_b86a15a28215b62d,
  semantics: {
    type: '{ kind: "poiseCompare"; target: "enemy" | "caster"; returnValueIfMissing: boolean; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_4e227d503b6aaf84 = {
  kind: 'object',
  fields: definitionSchemaPart_b86a15a28215b62d,
  semantics: {
    type: '{ kind: "poiseCompare"; target: "enemy" | "caster"; returnValueIfMissing: boolean; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_857ebf01b6ebb9da = {
  kind: 'object',
  fields: definitionSchemaPart_b86a15a28215b62d,
  semantics: {
    type: '{ kind: "poiseCompare"; target: "enemy" | "caster"; returnValueIfMissing: boolean; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_40b2ffc117c21ba3 = {
  kind: 'object',
  fields: definitionSchemaPart_251c30bf1eaf00ca,
  semantics: {
    type: '{ kind: "poiseCompare"; target: "enemy" | "caster"; returnValueIfMissing: boolean; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_0f83c615df092432 = {
  kind: 'object',
  fields: definitionSchemaPart_251c30bf1eaf00ca,
  semantics: {
    type: '{ kind: "poiseCompare"; target: "enemy" | "caster"; returnValueIfMissing: boolean; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_8117ee83396ddce4 = {
  kind: 'object',
  fields: definitionSchemaPart_251c30bf1eaf00ca,
  semantics: {
    type: '{ kind: "poiseCompare"; target: "enemy" | "caster"; returnValueIfMissing: boolean; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_88ccefdbc578ad2e = {
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
      source: ['packages/game-data-contract/src/buildModifiers.ts:81:5'],
      semantics: {
        type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
        unionVariants: [
          { type: '"comboSkill"' },
          { type: '"plungingAttack"' },
          { type: '"basicAttack"' },
          { type: '"battleSkill"' },
          { type: '"ultimate"' },
          { type: '"finisher"' },
          { type: '"dodge"' },
        ],
      },
    },
    definitionSchemaPart_8b162eddac7cdcff,
  ],
  semantics: definitionSchemaPart_4bf37a186ec9ee55,
  source: ['packages/game-data-contract/src/buildModifiers.ts:81:5'],
  optional: true,
  description: '进一步限制此加成覆盖的技能类型；省略时不按技能类型筛选。',
} as const;
const definitionSchemaPart_3a986c894590df41 = {
  kind: {
    kind: 'enum',
    options: ['eventTargetBuffCountCompare'],
    semantics: { type: '"eventTargetBuffCountCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:531:7'],
    description: '按当前事件真实目标统计匹配标签的 Buff 实例数；不累计 Buff 增强层数。',
  },
  tagQueryType: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:533:7'],
    description: '标签集合匹配方式。',
  },
  buffTags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:535:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:535:7'],
    description: '用于查找 Buff 的标签。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:537:7'],
    description: '数量比较符。',
  },
  value: definitionSchemaPart_68704636e3d250a7,
} as const;
const definitionSchemaPart_1e586d51477cb2b1 = {
  kind: {
    kind: 'enum',
    options: ['eventTargetBuffCountCompare'],
    semantics: { type: '"eventTargetBuffCountCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:531:7'],
    description: '按当前事件真实目标统计匹配标签的 Buff 实例数；不累计 Buff 增强层数。',
  },
  tagQueryType: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:533:7'],
    description: '标签集合匹配方式。',
  },
  buffTags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:535:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:535:7'],
    description: '用于查找 Buff 的标签。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:537:7'],
    description: '数量比较符。',
  },
  value: definitionSchemaPart_a5f327a77525bb3f,
} as const;
const definitionSchemaPart_a6677b204b2be62d = {
  kind: {
    kind: 'enum',
    options: ['all'],
    semantics: { type: '"all"' },
    source: ['packages/game-data-contract/src/modifiers.ts:208:7'],
    description: '所有子条件都成立时返回真。',
  },
  conditions: definitionSchemaPart_9ff88c2ecb8fefd0,
} as const;
const definitionSchemaPart_798eed041fb8c9aa = {
  kind: {
    kind: 'enum',
    options: ['any'],
    semantics: { type: '"any"' },
    source: ['packages/game-data-contract/src/modifiers.ts:214:7'],
    description: '任一子条件成立时返回真。',
  },
  conditions: definitionSchemaPart_41280393697147c4,
} as const;
const definitionSchemaPart_2e3bef9079a5e9d1 = {
  kind: 'object',
  fields: definitionSchemaPart_8927a6248b9bbaa4,
  semantics: {
    type: '{ kind: "contextTargetBuffIdStackCompare"; contextKey: string; buffIds: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_882a407badb531c2 = {
  kind: 'object',
  fields: definitionSchemaPart_7248a1c7dd8c70bf,
  semantics: {
    type: '{ kind: "contextTargetBuffIdStackCompare"; contextKey: string; buffIds: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_4b2cdde5e5b4d60e = {
  kind: 'object',
  fields: definitionSchemaPart_8927a6248b9bbaa4,
  semantics: {
    type: '{ kind: "contextTargetBuffIdStackCompare"; contextKey: string; buffIds: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_e23b7eec38fb4d16 = {
  kind: 'object',
  fields: definitionSchemaPart_8927a6248b9bbaa4,
  semantics: {
    type: '{ kind: "contextTargetBuffIdStackCompare"; contextKey: string; buffIds: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_e3aab71b894af59e = {
  kind: 'object',
  fields: definitionSchemaPart_8927a6248b9bbaa4,
  semantics: {
    type: '{ kind: "contextTargetBuffIdStackCompare"; contextKey: string; buffIds: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_ef58209a5c2b2dd9 = {
  kind: 'object',
  fields: definitionSchemaPart_b48329a116bb0c03,
  semantics: { type: 'CombatBuffDefinitionAttributeModifier' },
  source: ['packages/game-data-contract/src/buffs.ts:712:3'],
} as const;
const definitionSchemaPart_812630c526d0b6fa = {
  kind: 'object',
  fields: definitionSchemaPart_7248a1c7dd8c70bf,
  semantics: {
    type: '{ kind: "contextTargetBuffIdStackCompare"; contextKey: string; buffIds: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_6f6afdf31461bd48 = {
  kind: 'object',
  fields: definitionSchemaPart_7248a1c7dd8c70bf,
  semantics: {
    type: '{ kind: "contextTargetBuffIdStackCompare"; contextKey: string; buffIds: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_93c662c7c6502693 = {
  kind: 'object',
  fields: definitionSchemaPart_7248a1c7dd8c70bf,
  semantics: {
    type: '{ kind: "contextTargetBuffIdStackCompare"; contextKey: string; buffIds: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_ed55533764226601 = {
  kind: 'object',
  fields: definitionSchemaPart_24f63c03ebda0970,
  semantics: {
    type: '{ readonly kind: "eventDamageTagsMatch"; readonly match: "hasAny" | "hasAll"; readonly tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | "comboSkill" | ... 10 more ... | "natureAbnormal")[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:391:7'],
} as const;
const definitionSchemaPart_4ec2fddf0a72df9c = {
  kind: 'object',
  fields: definitionSchemaPart_24f63c03ebda0970,
  semantics: {
    type: '{ readonly kind: "eventDamageTagsMatch"; readonly match: "hasAny" | "hasAll"; readonly tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | "comboSkill" | ... 10 more ... | "natureAbnormal")[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:411:3'],
} as const;
const definitionSchemaPart_e595e04cf4e029b1 = {
  kind: 'object',
  fields: definitionSchemaPart_05933cc9471210d2,
  semantics: { type: '{ readonly kind: "not"; readonly condition: DamageModifierCondition; }' },
  source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
} as const;
const definitionSchemaPart_c710d61f557da047 = {
  kind: 'object',
  fields: definitionSchemaPart_05933cc9471210d2,
  semantics: { type: '{ readonly kind: "not"; readonly condition: DamageModifierCondition; }' },
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
} as const;
const definitionSchemaPart_59ea6127bf3998fb = {
  kind: 'object',
  fields: definitionSchemaPart_05933cc9471210d2,
  semantics: { type: '{ readonly kind: "not"; readonly condition: DamageModifierCondition; }' },
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
} as const;
const definitionSchemaPart_d442dc81ed0e484f = {
  kind: {
    kind: 'enum',
    options: ['contextTargetBuffStackCompare'],
    semantics: { type: '"contextTargetBuffStackCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:275:7'],
    description: 'CheckBuffStackNumByTag 的首目标增强层数；空组直接 false，不读取阈值。',
  },
  contextKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:277:7'],
    description: '动作环境中的目标组名称。',
  },
  tagQueryType: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:279:7'],
    description: '标签集合匹配方式。',
  },
  buffTags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:281:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:281:7'],
    description: '用于查找 Buff 的标签。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:283:7'],
    description: '层数比较符。',
  },
  value: definitionSchemaPart_5438f6195ecab3fc,
} as const;
const definitionSchemaPart_b4c6b8e9a130cc2e = {
  kind: {
    kind: 'enum',
    options: ['contextTargetBuffStackCompare'],
    semantics: { type: '"contextTargetBuffStackCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:275:7'],
    description: 'CheckBuffStackNumByTag 的首目标增强层数；空组直接 false，不读取阈值。',
  },
  contextKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:277:7'],
    description: '动作环境中的目标组名称。',
  },
  tagQueryType: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:279:7'],
    description: '标签集合匹配方式。',
  },
  buffTags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:281:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:281:7'],
    description: '用于查找 Buff 的标签。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:283:7'],
    description: '层数比较符。',
  },
  value: definitionSchemaPart_24121208b47b0531,
} as const;
const definitionSchemaPart_00cf25804ec50ac3 = {
  kind: 'union',
  variants: [
    {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: {
        type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
      },
      source: ['packages/game-data-contract/src/skills.ts:442:3'],
    },
    {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: {
        type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }',
      },
      source: ['packages/game-data-contract/src/skills.ts:442:3'],
    },
    definitionSchemaPart_763725944ac0c7c9,
  ],
  semantics: definitionSchemaPart_fe90a549f8a18418,
  source: ['packages/game-data-contract/src/skills.ts:442:3'],
  description: '此形态包含的单个技能或有序技能链。',
} as const;
const definitionSchemaPart_a644d4614b4a596b = {
  kind: 'object',
  fields: definitionSchemaPart_a6677b204b2be62d,
  semantics: {
    type: '{ readonly kind: "all"; readonly conditions: readonly DamageModifierCondition[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
} as const;
const definitionSchemaPart_1d1daf70697cec4f = {
  kind: 'object',
  fields: definitionSchemaPart_a6677b204b2be62d,
  semantics: {
    type: '{ readonly kind: "all"; readonly conditions: readonly DamageModifierCondition[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
} as const;
const definitionSchemaPart_4b226ee6100db9c5 = {
  kind: 'object',
  fields: definitionSchemaPart_798eed041fb8c9aa,
  semantics: {
    type: '{ readonly kind: "any"; readonly conditions: readonly DamageModifierCondition[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
} as const;
const definitionSchemaPart_3e22ab76596e82d5 = {
  kind: 'union',
  variants: [
    {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: {
        type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
      },
      source: ['packages/game-data-contract/src/skills.ts:400:3'],
    },
    {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: {
        type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }',
      },
      source: ['packages/game-data-contract/src/skills.ts:400:3'],
    },
    definitionSchemaPart_3c2dc8b713fbd06a,
  ],
  semantics: definitionSchemaPart_fe90a549f8a18418,
  source: ['packages/game-data-contract/src/skills.ts:400:3'],
  description: '单个可放置技能，或作为一个技能库条目放置的有序技能链。',
} as const;
const definitionSchemaPart_421d9e16e463df02 = {
  kind: 'object',
  fields: definitionSchemaPart_b4dd6fc9eb91b48d,
  semantics: {
    type: '{ readonly commandMappings?: readonly SkillInputCommandMappingWindow[] | undefined; readonly allowedNextSkills?: readonly SkillAllowedNextWindow[] | undefined; readonly hasConditionalActions?: boolean | undefined; } | undefined',
    optional: true,
  },
  source: ['packages/game-data-contract/src/skills.ts:321:3'],
  optional: true,
  description:
    '从原生顶层直连输入 Action 保留的操作解析证据。两类窗口职责不同：\ncommandMappings 选择该操作当前指向的技能，allowedNextSkills 只决定能否提前中断。',
} as const;
const definitionSchemaPart_229390798076d508 = {
  kind: 'object',
  fields: definitionSchemaPart_1474d833e4d26934,
  semantics: {
    type: '{ readonly kind: "eventDamageTagsMatch"; readonly match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; readonly tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | ... 12 more ... | "natureAbnormal")[]; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:643:3'],
} as const;
const definitionSchemaPart_f175b2f8f21035ff = {
  kind: 'object',
  fields: definitionSchemaPart_1474d833e4d26934,
  semantics: {
    type: '{ readonly kind: "eventDamageTagsMatch"; readonly match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; readonly tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | ... 12 more ... | "natureAbnormal")[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
} as const;
const definitionSchemaPart_47ac92f74cc90f0c = {
  kind: 'object',
  fields: definitionSchemaPart_1474d833e4d26934,
  semantics: {
    type: '{ readonly kind: "eventDamageTagsMatch"; readonly match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; readonly tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | ... 12 more ... | "natureAbnormal")[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
} as const;
const definitionSchemaPart_01d106c154114661 = {
  kind: 'object',
  fields: definitionSchemaPart_1474d833e4d26934,
  semantics: {
    type: '{ readonly kind: "eventDamageTagsMatch"; readonly match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; readonly tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | ... 12 more ... | "natureAbnormal")[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
} as const;
const definitionSchemaPart_dbdd46636d538a26 = {
  kind: 'object',
  fields: definitionSchemaPart_f86c2d22b6c48588,
  semantics: {
    type: '{ kind: "eventDamageTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | ... 11 more ... | "natureAbnormal")[]; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_5623d4b506f086c9 = {
  kind: 'object',
  fields: definitionSchemaPart_f86c2d22b6c48588,
  semantics: {
    type: '{ kind: "eventDamageTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | ... 11 more ... | "natureAbnormal")[]; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_7c303b14b561bb06 = {
  kind: 'object',
  fields: definitionSchemaPart_f86c2d22b6c48588,
  semantics: {
    type: '{ kind: "eventDamageTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | ... 11 more ... | "natureAbnormal")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_b0571cc12aa7daaa = {
  kind: 'object',
  fields: definitionSchemaPart_f86c2d22b6c48588,
  semantics: {
    type: '{ kind: "eventDamageTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | ... 11 more ... | "natureAbnormal")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_1d9fb1648d3c79c4 = {
  kind: 'object',
  fields: definitionSchemaPart_f86c2d22b6c48588,
  semantics: {
    type: '{ kind: "eventDamageTagsMatch"; match: "hasAny" | "hasAll" | "exceptAny" | "exceptAll" | "exact"; tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | ... 11 more ... | "natureAbnormal")[]; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_513e921a4685acdb = {
  kind: 'union',
  variants: [
    {
      kind: 'enum',
      options: ['all'],
      source: ['packages/game-data-contract/src/conditions.ts:237:7'],
      semantics: { type: '"all"', unionVariants: [{ type: '"all"' }] },
    },
    definitionSchemaPart_21a514fa7a12609d,
  ],
  semantics: definitionSchemaPart_f779ba4f5e7ae4b7,
  source: ['packages/game-data-contract/src/conditions.ts:237:7'],
  description: '允许匹配的对象类型。',
} as const;
const definitionSchemaPart_54d2513e01b5c450 = {
  kind: 'union',
  variants: [
    {
      kind: 'enum',
      options: ['all'],
      source: ['packages/game-data-contract/src/conditions.ts:243:7'],
      semantics: { type: '"all"', unionVariants: [{ type: '"all"' }] },
    },
    definitionSchemaPart_17cdecfd73695601,
  ],
  semantics: definitionSchemaPart_f779ba4f5e7ae4b7,
  source: ['packages/game-data-contract/src/conditions.ts:243:7'],
  description: '允许匹配的对象类型。',
} as const;
const definitionSchemaPart_28f8f40d7faccd4f = {
  kind: 'object',
  fields: definitionSchemaPart_3a986c894590df41,
  semantics: {
    type: '{ kind: "eventTargetBuffCountCompare"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_675e4a342c7793c2 = {
  kind: 'object',
  fields: definitionSchemaPart_1e586d51477cb2b1,
  semantics: {
    type: '{ kind: "eventTargetBuffCountCompare"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_73acaee0ddfc9b45 = {
  kind: 'object',
  fields: definitionSchemaPart_3a986c894590df41,
  semantics: {
    type: '{ kind: "eventTargetBuffCountCompare"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_21c1bcbf2389b349 = {
  kind: 'object',
  fields: definitionSchemaPart_3a986c894590df41,
  semantics: {
    type: '{ kind: "eventTargetBuffCountCompare"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_6003fa0d20364a07 = {
  kind: 'object',
  fields: definitionSchemaPart_3a986c894590df41,
  semantics: {
    type: '{ kind: "eventTargetBuffCountCompare"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_bb9b36214b3a8a7a = {
  kind: 'object',
  fields: definitionSchemaPart_1e586d51477cb2b1,
  semantics: {
    type: '{ kind: "eventTargetBuffCountCompare"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_27e6be0d71f07b08 = {
  kind: 'object',
  fields: definitionSchemaPart_1e586d51477cb2b1,
  semantics: {
    type: '{ kind: "eventTargetBuffCountCompare"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_1338b05b3f1ba6d0 = {
  kind: 'object',
  fields: definitionSchemaPart_1e586d51477cb2b1,
  semantics: {
    type: '{ kind: "eventTargetBuffCountCompare"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_6ef4a3723a418db7 = {
  kind: 'array',
  element: definitionSchemaPart_ef58209a5c2b2dd9,
  semantics: {
    type: 'readonly CombatBuffDefinitionAttributeModifier[] | undefined',
    arrayElement: { type: 'CombatBuffDefinitionAttributeModifier' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/buffs.ts:712:3'],
  optional: true,
  description: 'Buff 启用期间注册到目标或来源身上的属性修正。',
} as const;
const definitionSchemaPart_9223027ab677169a = {
  kind: 'union',
  variants: [
    definitionSchemaPart_ac0d9f705a401128,
    definitionSchemaPart_e786188468846aab,
    definitionSchemaPart_57382ad7008ad10b,
  ],
  semantics: {
    type: 'CombatBuffSemanticRole | undefined',
    optional: true,
    unionVariants: [
      {
        type: '{ readonly kind: "elementalAttachment"; readonly element: "heat" | "cryo" | "electric" | "nature"; }',
      },
      {
        type: '{ readonly kind: "elementalBurst"; readonly element: "heat" | "cryo" | "electric" | "nature"; }',
      },
      {
        type: '{ readonly kind: "compoundStatus"; readonly consumedElement: "heat" | "cryo" | "electric" | "nature"; readonly incomingElement: "heat" | "cryo" | "electric" | "nature"; }',
      },
    ],
  },
  source: ['packages/game-data-contract/src/buffs.ts:726:3'],
  optional: true,
  description: '标记该 Buff 的特殊战斗身份，供元素附着、元素爆发等专用规则识别。',
} as const;
const definitionSchemaPart_55ef2ce3b9334d82 = {
  kind: 'object',
  fields: definitionSchemaPart_d442dc81ed0e484f,
  semantics: {
    type: '{ kind: "contextTargetBuffStackCompare"; contextKey: string; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_35620f5d957e6251 = {
  kind: 'object',
  fields: definitionSchemaPart_b4c6b8e9a130cc2e,
  semantics: {
    type: '{ kind: "contextTargetBuffStackCompare"; contextKey: string; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_5875284b14776c57 = {
  kind: 'object',
  fields: definitionSchemaPart_d442dc81ed0e484f,
  semantics: {
    type: '{ kind: "contextTargetBuffStackCompare"; contextKey: string; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_04b2bfb7798581bc = {
  kind: 'object',
  fields: definitionSchemaPart_d442dc81ed0e484f,
  semantics: {
    type: '{ kind: "contextTargetBuffStackCompare"; contextKey: string; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_3874556b87a6728c = {
  kind: 'object',
  fields: definitionSchemaPart_d442dc81ed0e484f,
  semantics: {
    type: '{ kind: "contextTargetBuffStackCompare"; contextKey: string; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_2a6248cf0078c48f = {
  kind: 'object',
  fields: definitionSchemaPart_b4c6b8e9a130cc2e,
  semantics: {
    type: '{ kind: "contextTargetBuffStackCompare"; contextKey: string; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_1b33ba474e0a1868 = {
  kind: 'object',
  fields: definitionSchemaPart_b4c6b8e9a130cc2e,
  semantics: {
    type: '{ kind: "contextTargetBuffStackCompare"; contextKey: string; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_0a6824d2cc48cd13 = {
  kind: 'object',
  fields: definitionSchemaPart_b4c6b8e9a130cc2e,
  semantics: {
    type: '{ kind: "contextTargetBuffStackCompare"; contextKey: string; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_3129a276dee5e776 = {
  kind: {
    kind: 'enum',
    options: ['healthCompare'],
    semantics: { type: '"healthCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:127:7'],
    description: '比较目标当前生命值或当前/最大生命比例。',
  },
  target: definitionSchemaPart_c2b1be68fd172949,
  contextKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:131:7'],
    optional: true,
    description: 'target=contextTarget 时读取动作目标组中的唯一干员实例。',
  },
  valueType: {
    kind: 'enum',
    options: ['current', 'ratio'],
    semantics: {
      type: '"current" | "ratio"',
      unionVariants: [{ type: '"current"' }, { type: '"ratio"' }],
    },
    source: ['packages/game-data-contract/src/conditions.ts:133:7'],
    description: '比较当前生命值还是当前生命比例。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:135:7'],
    description: '数值比较符。',
  },
  value: definitionSchemaPart_709e49e902655f6b,
} as const;
const definitionSchemaPart_51dda2d3e8bbe47f = {
  kind: {
    kind: 'enum',
    options: ['healthCompare'],
    semantics: { type: '"healthCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:127:7'],
    description: '比较目标当前生命值或当前/最大生命比例。',
  },
  target: definitionSchemaPart_c2b1be68fd172949,
  contextKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:131:7'],
    optional: true,
    description: 'target=contextTarget 时读取动作目标组中的唯一干员实例。',
  },
  valueType: {
    kind: 'enum',
    options: ['current', 'ratio'],
    semantics: {
      type: '"current" | "ratio"',
      unionVariants: [{ type: '"current"' }, { type: '"ratio"' }],
    },
    source: ['packages/game-data-contract/src/conditions.ts:133:7'],
    description: '比较当前生命值还是当前生命比例。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:135:7'],
    description: '数值比较符。',
  },
  value: definitionSchemaPart_3277cea0963daf1d,
} as const;
const definitionSchemaPart_5b18eebfdef25609 = {
  kind: {
    kind: 'enum',
    options: ['actionInputTargetObjectTypeMatch'],
    semantics: { type: '"actionInputTargetObjectTypeMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:241:7'],
    description: '原生事件动作的 InputTarget 对象类型；与物理 eventTarget 方向可能相反。',
  },
  objectTypes: definitionSchemaPart_54d2513e01b5c450,
} as const;
const definitionSchemaPart_dbad3aa954d80693 = {
  kind: {
    kind: 'enum',
    options: ['actionValueCompare'],
    semantics: { type: '"actionValueCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:161:7'],
    description: '比较同一技能实例动作黑板中的动态值与常量，或比较两个动态值。',
  },
  left: definitionSchemaPart_6c44e84626164dee,
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:165:7'],
    description: '数值比较符。',
  },
  right: definitionSchemaPart_2ea0cbd396fdeeac,
} as const;
const definitionSchemaPart_d8fcdf282fba9271 = {
  kind: {
    kind: 'enum',
    options: ['actionValueCompare'],
    semantics: { type: '"actionValueCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:161:7'],
    description: '比较同一技能实例动作黑板中的动态值与常量，或比较两个动态值。',
  },
  left: definitionSchemaPart_d910f44aeb2a4e02,
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:165:7'],
    description: '数值比较符。',
  },
  right: definitionSchemaPart_b6bedc824003c668,
} as const;
const definitionSchemaPart_3c59c3049c2f33f3 = {
  kind: {
    kind: 'enum',
    options: ['contextTargetObjectTypeMatch'],
    semantics: { type: '"contextTargetObjectTypeMatch"' },
    source: ['packages/game-data-contract/src/conditions.ts:233:7'],
    description: '命名组中任一对象匹配可读类型集合；enemy 同时接受 enemyPart。',
  },
  contextKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:235:7'],
    description: '动作环境中的目标组名称。',
  },
  objectTypes: definitionSchemaPart_513e921a4685acdb,
} as const;
const definitionSchemaPart_9e4a20ff1b1f2ce9 = {
  kind: {
    kind: 'enum',
    options: ['skillCooldownMultiplier'],
    semantics: { type: '"skillCooldownMultiplier"' },
    source: ['packages/game-data-contract/src/buildModifiers.ts:108:5'],
    description: '修正种类判别值。',
  },
  skillTypes: definitionSchemaPart_6e4366feaffeb577,
  value: definitionSchemaPart_93f993916234c15f,
} as const;
const definitionSchemaPart_ea896d2704643bf2 = {
  kind: 'object',
  fields: definitionSchemaPart_5b18eebfdef25609,
  semantics: {
    type: '{ kind: "actionInputTargetObjectTypeMatch"; objectTypes: CombatObjectTypeSelection; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_2930a4a7f7d08489 = {
  kind: 'object',
  fields: definitionSchemaPart_5b18eebfdef25609,
  semantics: {
    type: '{ kind: "actionInputTargetObjectTypeMatch"; objectTypes: CombatObjectTypeSelection; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_27be370aacfa2b0d = {
  kind: 'object',
  fields: definitionSchemaPart_5b18eebfdef25609,
  semantics: {
    type: '{ kind: "actionInputTargetObjectTypeMatch"; objectTypes: CombatObjectTypeSelection; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_196bb180717989ae = {
  kind: 'object',
  fields: definitionSchemaPart_5b18eebfdef25609,
  semantics: {
    type: '{ kind: "actionInputTargetObjectTypeMatch"; objectTypes: CombatObjectTypeSelection; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_b9171679a7134d1f = {
  kind: 'object',
  fields: definitionSchemaPart_5b18eebfdef25609,
  semantics: {
    type: '{ kind: "actionInputTargetObjectTypeMatch"; objectTypes: CombatObjectTypeSelection; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_de3bb0df972429e3 = {
  kind: 'union',
  variants: [definitionSchemaPart_f82c8f424a3be468, definitionSchemaPart_5c4ed9fd0bcdc3bd],
  semantics: {
    type: 'AttributeModifierValues | { readonly slot: "addition" | "multiplier" | "finalAddition" | "finalMultiplier" | "baseAddition" | "baseMultiplier" | "baseFinalAddition" | "baseFinalMultiplier"; readonly value: DamageModifierNumber; }',
    unionVariants: [
      { type: 'AttributeModifierValues' },
      {
        type: '{ readonly slot: "addition" | "multiplier" | "finalAddition" | "finalMultiplier" | "baseAddition" | "baseMultiplier" | "baseFinalAddition" | "baseFinalMultiplier"; readonly value: DamageModifierNumber; }',
      },
    ],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:255:3'],
  description: '八槽完整值，或只写入一个槽的动态值。',
} as const;
const definitionSchemaPart_efcbc846f369ef3a = {
  kind: {
    kind: 'enum',
    options: ['buffIdStackCompare'],
    semantics: { type: '"buffIdStackCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:369:7'],
    description: '按Buff 定义 身份查询累计强化层数；ID 列表按“任一匹配”处理。',
  },
  target: definitionSchemaPart_1bc5a27ee35d9bde,
  buffIds: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:373:7'],
    },
    semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
    source: ['packages/game-data-contract/src/conditions.ts:373:7'],
    description: '任一匹配即可计入的 Buff ID。',
  },
  sameSourceSkillCast: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:375:7'],
    optional: true,
    description: '是否只统计和当前 Buff 来自同一次技能施放的实例。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:377:7'],
    description: '层数比较符。',
  },
  value: definitionSchemaPart_a4a23c20dceb723b,
} as const;
const definitionSchemaPart_c14a8926da18d538 = {
  kind: {
    kind: 'enum',
    options: ['buffIdStackCompare'],
    semantics: { type: '"buffIdStackCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:369:7'],
    description: '按Buff 定义 身份查询累计强化层数；ID 列表按“任一匹配”处理。',
  },
  target: definitionSchemaPart_1bc5a27ee35d9bde,
  buffIds: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/conditions.ts:373:7'],
    },
    semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
    source: ['packages/game-data-contract/src/conditions.ts:373:7'],
    description: '任一匹配即可计入的 Buff ID。',
  },
  sameSourceSkillCast: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:375:7'],
    optional: true,
    description: '是否只统计和当前 Buff 来自同一次技能施放的实例。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:377:7'],
    description: '层数比较符。',
  },
  value: definitionSchemaPart_217aac9c631065e5,
} as const;
const definitionSchemaPart_2491183cde59b989 = {
  kind: {
    kind: 'enum',
    options: ['buffTagIdCountCompare'],
    semantics: { type: '"buffTagIdCountCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:345:7'],
    description: '按原生 Buff 标签查询未结束 Buff 的不同定义 ID 数，不累计实例数或强化层数。',
  },
  target: definitionSchemaPart_1a4b8032d6fa885d,
  tagQueryType: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:349:7'],
    description: '标签集合匹配方式。',
  },
  buffTags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:351:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:351:7'],
    description: '用于查找 Buff 的标签。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:353:7'],
    description: '数量比较符。',
  },
  value: definitionSchemaPart_1d4f285edf04f94e,
} as const;
const definitionSchemaPart_4ab21fff0ec5ba67 = {
  kind: {
    kind: 'enum',
    options: ['buffTagIdCountCompare'],
    semantics: { type: '"buffTagIdCountCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:345:7'],
    description: '按原生 Buff 标签查询未结束 Buff 的不同定义 ID 数，不累计实例数或强化层数。',
  },
  target: definitionSchemaPart_1a4b8032d6fa885d,
  tagQueryType: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:349:7'],
    description: '标签集合匹配方式。',
  },
  buffTags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:351:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:351:7'],
    description: '用于查找 Buff 的标签。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:353:7'],
    description: '数量比较符。',
  },
  value: definitionSchemaPart_a537dbeafb5cd491,
} as const;
const definitionSchemaPart_d6feec75e6095c43 = {
  kind: 'union',
  variants: [definitionSchemaPart_8a26dd6691760b20, definitionSchemaPart_0ff650de5bd3ce14],
  semantics: {
    type: 'ModifyHealCalculationResultProcessorDefinition | ModifyHealingIncreaseProcessorDefinition',
    unionVariants: [
      { type: 'ModifyHealCalculationResultProcessorDefinition' },
      { type: 'ModifyHealingIncreaseProcessorDefinition' },
    ],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:353:3'],
} as const;
const definitionSchemaPart_e33b34858258e325 = {
  kind: 'object',
  fields: definitionSchemaPart_dbad3aa954d80693,
  semantics: {
    type: '{ kind: "actionValueCompare"; left: ActionValueOperand; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_460707439f893ac2 = {
  kind: 'object',
  fields: definitionSchemaPart_dbad3aa954d80693,
  semantics: {
    type: '{ kind: "actionValueCompare"; left: ActionValueOperand; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_8cdeaaf8a703da2c = {
  kind: 'object',
  fields: definitionSchemaPart_dbad3aa954d80693,
  semantics: {
    type: '{ kind: "actionValueCompare"; left: ActionValueOperand; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_de6e3f9c0ce77a2b = {
  kind: 'object',
  fields: definitionSchemaPart_dbad3aa954d80693,
  semantics: {
    type: '{ kind: "actionValueCompare"; left: ActionValueOperand; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_79f946121aa4dfb2 = {
  kind: 'object',
  fields: definitionSchemaPart_d8fcdf282fba9271,
  semantics: {
    type: '{ kind: "actionValueCompare"; left: ActionValueOperand; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_9a6b855afa39ee80 = {
  kind: 'object',
  fields: definitionSchemaPart_d8fcdf282fba9271,
  semantics: {
    type: '{ kind: "actionValueCompare"; left: ActionValueOperand; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_2453df203d8c5f8b = {
  kind: 'object',
  fields: definitionSchemaPart_d8fcdf282fba9271,
  semantics: {
    type: '{ kind: "actionValueCompare"; left: ActionValueOperand; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_191604f683c687ec = {
  kind: 'object',
  fields: definitionSchemaPart_d8fcdf282fba9271,
  semantics: {
    type: '{ kind: "actionValueCompare"; left: ActionValueOperand; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_942ae36952523f5a = {
  kind: 'object',
  fields: definitionSchemaPart_3c59c3049c2f33f3,
  semantics: {
    type: '{ kind: "contextTargetObjectTypeMatch"; contextKey: string; objectTypes: CombatObjectTypeSelection; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_3a47b8cdcbcf094a = {
  kind: 'object',
  fields: definitionSchemaPart_3c59c3049c2f33f3,
  semantics: {
    type: '{ kind: "contextTargetObjectTypeMatch"; contextKey: string; objectTypes: CombatObjectTypeSelection; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_ade0487d8eb165f5 = {
  kind: 'object',
  fields: definitionSchemaPart_3c59c3049c2f33f3,
  semantics: {
    type: '{ kind: "contextTargetObjectTypeMatch"; contextKey: string; objectTypes: CombatObjectTypeSelection; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_155a7195be4ae575 = {
  kind: 'object',
  fields: definitionSchemaPart_3c59c3049c2f33f3,
  semantics: {
    type: '{ kind: "contextTargetObjectTypeMatch"; contextKey: string; objectTypes: CombatObjectTypeSelection; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_955ea7a296c83f6f = {
  kind: 'object',
  fields: definitionSchemaPart_3c59c3049c2f33f3,
  semantics: {
    type: '{ kind: "contextTargetObjectTypeMatch"; contextKey: string; objectTypes: CombatObjectTypeSelection; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_1d78f8d00b22cef3 = {
  kind: {
    kind: 'enum',
    options: ['buffStackCompare'],
    semantics: { type: '"buffStackCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:329:7'],
    description: '按原生 Buff 标签查询累计强化层数，并使用原生容差比较。',
  },
  target: definitionSchemaPart_53905b3548641d57,
  tagQueryType: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:333:7'],
    description: '标签集合匹配方式。',
  },
  buffTags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:335:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:335:7'],
    description: '用于查找 Buff 的标签。',
  },
  sameSourceSkillCast: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:337:7'],
    optional: true,
    description: '是否只统计和当前 Buff 来自同一次技能施放的实例。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:339:7'],
    description: '层数比较符。',
  },
  value: definitionSchemaPart_6e0eb94afdbbd257,
} as const;
const definitionSchemaPart_8b6a97f213e0a09f = {
  kind: {
    kind: 'enum',
    options: ['buffStackCompare'],
    semantics: { type: '"buffStackCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:329:7'],
    description: '按原生 Buff 标签查询累计强化层数，并使用原生容差比较。',
  },
  target: definitionSchemaPart_53905b3548641d57,
  tagQueryType: {
    kind: 'enum',
    options: ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'],
    semantics: {
      type: '"hasAny" | "hasAll" | "exceptAny" | "exceptAll"',
      unionVariants: [
        { type: '"hasAny"' },
        { type: '"hasAll"' },
        { type: '"exceptAny"' },
        { type: '"exceptAll"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:333:7'],
    description: '标签集合匹配方式。',
  },
  buffTags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/conditions.ts:335:7'],
    },
    semantics: {
      type: 'readonly string[]',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
    },
    source: ['packages/game-data-contract/src/conditions.ts:335:7'],
    description: '用于查找 Buff 的标签。',
  },
  sameSourceSkillCast: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/conditions.ts:337:7'],
    optional: true,
    description: '是否只统计和当前 Buff 来自同一次技能施放的实例。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:339:7'],
    description: '层数比较符。',
  },
  value: definitionSchemaPart_cb87e5f43e46cf23,
} as const;
const definitionSchemaPart_d21b72f20c5dd444 = {
  kind: 'object',
  fields: definitionSchemaPart_3129a276dee5e776,
  semantics: {
    type: '{ kind: "healthCompare"; target: "enemy" | "caster" | "buffOwner" | "buffSource" | "controlledOperator" | "currentTarget" | "actionInputTarget" | "lowestHealthRatioOperator" | "lowestHealthRatioOperatorExceptControlled" | "contextTarget"; contextKey?: string | undefined; valueType: "current" | "ratio"; operator: "eq...',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_2d253d12411b3a7d = {
  kind: 'object',
  fields: definitionSchemaPart_51dda2d3e8bbe47f,
  semantics: {
    type: '{ kind: "healthCompare"; target: "enemy" | "caster" | "buffOwner" | "buffSource" | "controlledOperator" | "currentTarget" | "actionInputTarget" | "lowestHealthRatioOperator" | "lowestHealthRatioOperatorExceptControlled" | "contextTarget"; contextKey?: string | undefined; valueType: "current" | "ratio"; operator: "eq...',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_78359c9b5d7d1818 = {
  kind: 'object',
  fields: definitionSchemaPart_3129a276dee5e776,
  semantics: {
    type: '{ kind: "healthCompare"; target: "enemy" | "caster" | "buffOwner" | "buffSource" | "controlledOperator" | "currentTarget" | "actionInputTarget" | "lowestHealthRatioOperator" | "lowestHealthRatioOperatorExceptControlled" | "contextTarget"; contextKey?: string | undefined; valueType: "current" | "ratio"; operator: "eq...',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_9fccc9e766a8c37b = {
  kind: 'object',
  fields: definitionSchemaPart_3129a276dee5e776,
  semantics: {
    type: '{ kind: "healthCompare"; target: "enemy" | "caster" | "buffOwner" | "buffSource" | "controlledOperator" | "currentTarget" | "actionInputTarget" | "lowestHealthRatioOperator" | "lowestHealthRatioOperatorExceptControlled" | "contextTarget"; contextKey?: string | undefined; valueType: "current" | "ratio"; operator: "eq...',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_97aad1c93ad06628 = {
  kind: 'object',
  fields: definitionSchemaPart_3129a276dee5e776,
  semantics: {
    type: '{ kind: "healthCompare"; target: "enemy" | "caster" | "buffOwner" | "buffSource" | "controlledOperator" | "currentTarget" | "actionInputTarget" | "lowestHealthRatioOperator" | "lowestHealthRatioOperatorExceptControlled" | "contextTarget"; contextKey?: string | undefined; valueType: "current" | "ratio"; operator: "eq...',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_3db0d33ee847f1a9 = {
  kind: 'object',
  fields: definitionSchemaPart_51dda2d3e8bbe47f,
  semantics: {
    type: '{ kind: "healthCompare"; target: "enemy" | "caster" | "buffOwner" | "buffSource" | "controlledOperator" | "currentTarget" | "actionInputTarget" | "lowestHealthRatioOperator" | "lowestHealthRatioOperatorExceptControlled" | "contextTarget"; contextKey?: string | undefined; valueType: "current" | "ratio"; operator: "eq...',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_a51b87e9e8fd7360 = {
  kind: 'object',
  fields: definitionSchemaPart_51dda2d3e8bbe47f,
  semantics: {
    type: '{ kind: "healthCompare"; target: "enemy" | "caster" | "buffOwner" | "buffSource" | "controlledOperator" | "currentTarget" | "actionInputTarget" | "lowestHealthRatioOperator" | "lowestHealthRatioOperatorExceptControlled" | "contextTarget"; contextKey?: string | undefined; valueType: "current" | "ratio"; operator: "eq...',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_40f774bdf95e8048 = {
  kind: 'object',
  fields: definitionSchemaPart_51dda2d3e8bbe47f,
  semantics: {
    type: '{ kind: "healthCompare"; target: "enemy" | "caster" | "buffOwner" | "buffSource" | "controlledOperator" | "currentTarget" | "actionInputTarget" | "lowestHealthRatioOperator" | "lowestHealthRatioOperatorExceptControlled" | "contextTarget"; contextKey?: string | undefined; valueType: "current" | "ratio"; operator: "eq...',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_b74c9296ca0205b9 = {
  kind: 'object',
  fields: definitionSchemaPart_9e4a20ff1b1f2ce9,
  semantics: {
    type: '{ readonly kind: "skillCooldownMultiplier"; readonly skillTypes: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge" | readonly ("comboSkill" | ... 5 more ... | "dodge")[]; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:58:7'],
} as const;
const definitionSchemaPart_6fe0b61010182500 = {
  kind: 'object',
  fields: definitionSchemaPart_9e4a20ff1b1f2ce9,
  semantics: {
    type: '{ readonly kind: "skillCooldownMultiplier"; readonly skillTypes: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge" | readonly ("comboSkill" | ... 5 more ... | "dodge")[]; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:128:3'],
} as const;
const definitionSchemaPart_397bcba61e04ecfa = {
  kind: 'object',
  fields: definitionSchemaPart_9e4a20ff1b1f2ce9,
  semantics: {
    type: '{ readonly kind: "skillCooldownMultiplier"; readonly skillTypes: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge" | readonly ("comboSkill" | ... 5 more ... | "dodge")[]; readonly value: LevelValues; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:184:3'],
} as const;
const definitionSchemaPart_d9eda4eff9dfae00 = {
  kind: 'object',
  fields: definitionSchemaPart_efcbc846f369ef3a,
  semantics: {
    type: '{ kind: "buffIdStackCompare"; target: BuffConditionTarget; buffIds: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number | ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_83dd2707c331e73a = {
  kind: 'object',
  fields: definitionSchemaPart_c14a8926da18d538,
  semantics: {
    type: '{ kind: "buffIdStackCompare"; target: BuffConditionTarget; buffIds: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number | ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_e1189d6d5514443d = {
  kind: 'object',
  fields: definitionSchemaPart_efcbc846f369ef3a,
  semantics: {
    type: '{ kind: "buffIdStackCompare"; target: BuffConditionTarget; buffIds: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number | ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_f596bd52e7a1f065 = {
  kind: 'object',
  fields: definitionSchemaPart_efcbc846f369ef3a,
  semantics: {
    type: '{ kind: "buffIdStackCompare"; target: BuffConditionTarget; buffIds: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number | ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_7071bac8a80ab9d1 = {
  kind: 'object',
  fields: definitionSchemaPart_efcbc846f369ef3a,
  semantics: {
    type: '{ kind: "buffIdStackCompare"; target: BuffConditionTarget; buffIds: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number | ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_31b62063343999e9 = {
  kind: 'object',
  fields: definitionSchemaPart_c14a8926da18d538,
  semantics: {
    type: '{ kind: "buffIdStackCompare"; target: BuffConditionTarget; buffIds: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number | ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_d02b95b37b93a829 = {
  kind: 'object',
  fields: definitionSchemaPart_c14a8926da18d538,
  semantics: {
    type: '{ kind: "buffIdStackCompare"; target: BuffConditionTarget; buffIds: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number | ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_b577b8366cd2a79b = {
  kind: 'object',
  fields: definitionSchemaPart_c14a8926da18d538,
  semantics: {
    type: '{ kind: "buffIdStackCompare"; target: BuffConditionTarget; buffIds: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; value: number | ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_42ae7de4a028e406 = {
  kind: 'object',
  fields: definitionSchemaPart_2491183cde59b989,
  semantics: {
    type: '{ kind: "buffTagIdCountCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_5944cbfca8f3d24f = {
  kind: 'object',
  fields: definitionSchemaPart_4ab21fff0ec5ba67,
  semantics: {
    type: '{ kind: "buffTagIdCountCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_c84992fe0caabfc3 = {
  kind: 'object',
  fields: definitionSchemaPart_2491183cde59b989,
  semantics: {
    type: '{ kind: "buffTagIdCountCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_a095b18574bd375c = {
  kind: 'object',
  fields: definitionSchemaPart_2491183cde59b989,
  semantics: {
    type: '{ kind: "buffTagIdCountCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_8fc5253a91a22afe = {
  kind: 'object',
  fields: definitionSchemaPart_2491183cde59b989,
  semantics: {
    type: '{ kind: "buffTagIdCountCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_b8484be0ae2d7658 = {
  kind: 'object',
  fields: definitionSchemaPart_4ab21fff0ec5ba67,
  semantics: {
    type: '{ kind: "buffTagIdCountCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_a11a6ed6723f0568 = {
  kind: 'object',
  fields: definitionSchemaPart_4ab21fff0ec5ba67,
  semantics: {
    type: '{ kind: "buffTagIdCountCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_8f6fa2185db32868 = {
  kind: 'object',
  fields: definitionSchemaPart_4ab21fff0ec5ba67,
  semantics: {
    type: '{ kind: "buffTagIdCountCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_88cc12b2f3d57d2f = {
  kind: 'array',
  element: definitionSchemaPart_d6feec75e6095c43,
  semantics: {
    type: 'readonly (ModifyHealCalculationResultProcessorDefinition | ModifyHealingIncreaseProcessorDefinition)[]',
    arrayElement: {
      type: 'ModifyHealCalculationResultProcessorDefinition | ModifyHealingIncreaseProcessorDefinition',
      unionVariants: [
        { type: 'ModifyHealCalculationResultProcessorDefinition' },
        { type: 'ModifyHealingIncreaseProcessorDefinition' },
      ],
    },
  },
  source: ['packages/game-data-contract/src/modifiers.ts:353:3'],
  description: '按顺序执行的治疗处理器。',
} as const;
const definitionSchemaPart_8b07ce44afd3f756 = {
  kind: 'object',
  fields: definitionSchemaPart_1d78f8d00b22cef3,
  semantics: {
    type: '{ kind: "buffStackCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_40495ad9eafaf760 = {
  kind: 'object',
  fields: definitionSchemaPart_8b6a97f213e0a09f,
  semantics: {
    type: '{ kind: "buffStackCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_d468b7eca9586475 = {
  kind: 'object',
  fields: definitionSchemaPart_1d78f8d00b22cef3,
  semantics: {
    type: '{ kind: "buffStackCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_7de34468308875eb = {
  kind: 'object',
  fields: definitionSchemaPart_1d78f8d00b22cef3,
  semantics: {
    type: '{ kind: "buffStackCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_cfa9392e4535ea43 = {
  kind: 'object',
  fields: definitionSchemaPart_1d78f8d00b22cef3,
  semantics: {
    type: '{ kind: "buffStackCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_1a77aac8f3ba14e5 = {
  kind: 'object',
  fields: definitionSchemaPart_8b6a97f213e0a09f,
  semantics: {
    type: '{ kind: "buffStackCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_dde63430205060a6 = {
  kind: 'object',
  fields: definitionSchemaPart_8b6a97f213e0a09f,
  semantics: {
    type: '{ kind: "buffStackCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_45501655b4cc62c6 = {
  kind: 'object',
  fields: definitionSchemaPart_8b6a97f213e0a09f,
  semantics: {
    type: '{ kind: "buffStackCompare"; target: BuffConditionTarget; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; sameSourceSkillCast?: boolean | undefined; operator: "equal" | ... 4 more ... | "lessOrEqual"; value: ActionValueOperand; }',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_6104d633b9d889b8 = {
  placementPolicy: definitionSchemaPart_721b4e37bd155546,
  key: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/skills.ts:438:3'],
    description: '形态在技能组中的唯一名称。',
  },
  nameKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/skills.ts:440:3'],
    optional: true,
    description: '此放置形态的名称模板覆盖；未提供时继承组的 nameKey。',
  },
  skills: definitionSchemaPart_00cf25804ec50ac3,
} as const;
const definitionSchemaPart_a742064df065e7c8 = {
  attribute: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/modifiers.ts:253:3'],
    description: '原生属性名称。',
  },
  kind: {
    kind: 'enum',
    options: ['instantAttribute'],
    semantics: { type: '"instantAttribute"' },
    source: ['packages/game-data-contract/src/modifiers.ts:249:3'],
    description: '处理器种类判别值。',
  },
  targetSide: {
    kind: 'enum',
    options: ['defender', 'attacker'],
    semantics: {
      type: '"defender" | "attacker"',
      unionVariants: [{ type: '"defender"' }, { type: '"attacker"' }],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:251:3'],
    description: '要修改攻击方还是防御方的属性。',
  },
  values: definitionSchemaPart_de3bb0df972429e3,
  attributeTiming: {
    kind: 'enum',
    options: ['runtime'],
    semantics: { type: '"runtime"' },
    source: ['packages/game-data-contract/src/buffs.ts:635:7'],
    description: 'Buff 伤害处理器始终读取战斗运行时属性。',
  },
} as const;
const definitionSchemaPart_81155d5b7ea2d797 = {
  kind: 'object',
  fields: definitionSchemaPart_6104d633b9d889b8,
  semantics: { type: 'SkillGroupVariantDefinition' },
  source: ['packages/game-data-contract/src/skills.ts:412:3'],
} as const;
const definitionSchemaPart_9f31ea6b636a8544 = {
  iconId: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:359:3'],
    optional: true,
    description: '游戏资源中的图标 ID。',
  },
  iconPath: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:361:3'],
    optional: true,
    description: '已导出图标的资源路径。',
  },
  visible: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:363:3'],
    optional: true,
    description: '是否允许界面显示这个 Buff。',
  },
  showInHeadBarCommon: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:365:3'],
    optional: true,
    description: '是否显示在普通头顶状态栏。',
  },
  showInHeadBarAttached: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:367:3'],
    optional: true,
    description: '是否显示在附着状态头顶栏。',
  },
  showInSquadIcon: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:369:3'],
    optional: true,
    description: '是否显示在队伍头像附近。',
  },
  onlyShowForMainCharacter: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:371:3'],
    optional: true,
    description: '是否只为当前主控干员显示。',
  },
  blinkInMainCharHpBar: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:373:3'],
    optional: true,
    description: '是否在主控干员生命条上播放闪烁。',
  },
  showProgressInHpBar: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:375:3'],
    optional: true,
    description: '是否在生命条上显示剩余进度。',
  },
  showProgressInNormalSkillButton: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:377:3'],
    optional: true,
    description: '是否在普通技能按钮上显示剩余进度。',
  },
  useWeakProgressInNormalSkillButton: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:379:3'],
    optional: true,
    description: '普通技能按钮是否使用弱化样式的进度。',
  },
  showProgressInUltimateSkillButton: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:381:3'],
    optional: true,
    description: '是否在终结技按钮上显示剩余进度。',
  },
  forceRaiseIconEvent: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:383:3'],
    optional: true,
    description: 'Buff 变化时是否强制发送图标刷新事件。',
  },
  showWarningBackground: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:385:3'],
    optional: true,
    description: '是否显示警告背景。',
  },
  playStrongInAnimation: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:387:3'],
    optional: true,
    description: '是否播放强提示进入动画。',
  },
  hasCharHpBarVfxType: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:389:3'],
    optional: true,
    description: '是否配置了干员生命条特效类型。',
  },
  charHpBarVfxType: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:391:3'],
    optional: true,
    description: '干员生命条使用的特效类型。',
  },
  iconStyleInSquad: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:393:3'],
    optional: true,
    description: 'Buff 在队伍头像区域使用的图标样式。',
  },
  abnormalColorType: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/buffs.ts:395:3'],
    optional: true,
    description: '元素异常显示使用的颜色类型。',
  },
  orderPriority: definitionSchemaPart_e98ac967d772a17e,
} as const;
const definitionSchemaPart_d28a7250fa0cc5f5 = {
  kind: 'object',
  fields: definitionSchemaPart_a742064df065e7c8,
  semantics: {
    type: 'Pick<InstantAttributeProcessorDefinition, "attribute" | "kind" | "targetSide" | "values"> & { readonly attributeTiming: "runtime"; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:645:3'],
} as const;
const definitionSchemaPart_3c68a5a6adfd72bc = {
  kind: 'object',
  fields: definitionSchemaPart_9f31ea6b636a8544,
  semantics: { type: 'CombatBuffPresentation' },
  source: ['packages/game-data-contract/src/buffs.ts:412:3'],
  description: '子 Buff 的显示规则。',
} as const;
const definitionSchemaPart_1c749593f7129738 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/modifiers.ts:377:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ readonly kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:391:7'],
    },
    definitionSchemaPart_ed55533764226601,
    definitionSchemaPart_d9327c6391670d04,
  ],
  semantics: {
    type: 'PoiseModifierCondition',
    unionVariants: [
      { type: '{ readonly kind: "casterControlled"; }' },
      {
        type: '{ readonly kind: "eventDamageTagsMatch"; readonly match: "hasAny" | "hasAll"; readonly tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | "comboSkill" | ... 10 more ... | "natureAbnormal")[]; }',
      },
      { type: '{ readonly kind: "all"; readonly conditions: readonly PoiseModifierCondition[]; }' },
    ],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:391:7'],
} as const;
const definitionSchemaPart_50699134b8c284cd = {
  kind: 'object',
  fields: definitionSchemaPart_9f31ea6b636a8544,
  semantics: { type: 'CombatBuffPresentation | undefined', optional: true },
  source: [
    'packages/game-data-contract/src/buffs.ts:682:3',
    'packages/game-data-contract/src/buffs.ts:153:3',
  ],
  optional: true,
  description: 'Buff 自身的图标、颜色、排序位置和进度条等显示设置。\n不参与战斗计算的显示信息。',
} as const;
const definitionSchemaPart_617846e70609372e = {
  kind: 'array',
  element: definitionSchemaPart_81155d5b7ea2d797,
  semantics: {
    type: 'readonly SkillGroupVariantDefinition[] | undefined',
    arrayElement: { type: 'SkillGroupVariantDefinition' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/skills.ts:412:3'],
  optional: true,
  description:
    '同一稳定输入类型下的具名形态链。形态不是新的技能类型；它可以使用不同的养成等级来源，\n例如终结技状态下的强化普攻仍属于普攻，但倍率取终结技等级。',
} as const;
const definitionSchemaPart_097edd904b536d47 = {
  buffId: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/buffs.ts:410:3'],
    description: '子 Buff ID。',
  },
  presentation: definitionSchemaPart_3c68a5a6adfd72bc,
} as const;
const definitionSchemaPart_25c7842035864e98 = {
  kind: 'object',
  fields: definitionSchemaPart_097edd904b536d47,
  semantics: { type: 'CombatBuffChildPresentation' },
  source: ['packages/game-data-contract/src/buffs.ts:684:3'],
} as const;
const definitionSchemaPart_3e827ff09a5598dd = {
  kind: 'array',
  element: definitionSchemaPart_25c7842035864e98,
  semantics: {
    type: 'readonly CombatBuffChildPresentation[] | undefined',
    arrayElement: { type: 'CombatBuffChildPresentation' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/buffs.ts:684:3'],
  optional: true,
  description: '跟随本体同时出现和消失的额外显示图标；它们没有独立战斗效果和生命周期。',
} as const;
const definitionSchemaPart_a23c75a9a8a95254 = {
  kind: 'array',
  element: definitionSchemaPart_1c749593f7129738,
  semantics: {
    type: 'readonly PoiseModifierCondition[]',
    arrayElement: {
      type: 'PoiseModifierCondition',
      unionVariants: [
        { type: '{ readonly kind: "casterControlled"; }' },
        {
          type: '{ readonly kind: "eventDamageTagsMatch"; readonly match: "hasAny" | "hasAll"; readonly tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | "comboSkill" | ... 10 more ... | "natureAbnormal")[]; }',
        },
        {
          type: '{ readonly kind: "all"; readonly conditions: readonly PoiseModifierCondition[]; }',
        },
      ],
    },
  },
  source: ['packages/game-data-contract/src/modifiers.ts:391:7'],
  description: '需要同时成立的条件。',
} as const;
const definitionSchemaPart_6be4051997408abe = {
  kind: {
    kind: 'enum',
    options: ['buffBlackboardValueCompare'],
    semantics: { type: '"buffBlackboardValueCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:171:7'],
    description:
      'GetTargetBuffBBAdvanced + CompareFloat：找不到 Buff 时为 false，找到时先写动作黑板。',
  },
  target: definitionSchemaPart_72b4a82d356c5cce,
  query: definitionSchemaPart_52c097c0ec10ca30,
  desiredKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:191:7'],
    description: '从找到的 Buff 黑板读取的键。',
  },
  outputKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:193:7'],
    description: '把读到的值同步写入当前动作黑板的键。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:195:7'],
    description: '数值比较符。',
  },
  value: definitionSchemaPart_2a7c86ff15ba5e92,
} as const;
const definitionSchemaPart_916b2090c4dc5dc1 = {
  kind: {
    kind: 'enum',
    options: ['buffBlackboardValueCompare'],
    semantics: { type: '"buffBlackboardValueCompare"' },
    source: ['packages/game-data-contract/src/conditions.ts:171:7'],
    description:
      'GetTargetBuffBBAdvanced + CompareFloat：找不到 Buff 时为 false，找到时先写动作黑板。',
  },
  target: definitionSchemaPart_72b4a82d356c5cce,
  query: definitionSchemaPart_52c097c0ec10ca30,
  desiredKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:191:7'],
    description: '从找到的 Buff 黑板读取的键。',
  },
  outputKey: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/conditions.ts:193:7'],
    description: '把读到的值同步写入当前动作黑板的键。',
  },
  operator: {
    kind: 'enum',
    options: ['equal', 'notEqual', 'greater', 'greaterOrEqual', 'less', 'lessOrEqual'],
    semantics: {
      type: '"equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"',
      unionVariants: [
        { type: '"equal"' },
        { type: '"notEqual"' },
        { type: '"greater"' },
        { type: '"greaterOrEqual"' },
        { type: '"less"' },
        { type: '"lessOrEqual"' },
      ],
    },
    source: ['packages/game-data-contract/src/conditions.ts:195:7'],
    description: '数值比较符。',
  },
  value: definitionSchemaPart_36c430d4a74a8941,
} as const;
const definitionSchemaPart_714413a486e79c86 = {
  bornTags: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string', aliases: ['GameplayTag'] },
      source: ['packages/game-data-contract/src/skills.ts:103:3'],
    },
    semantics: {
      type: 'readonly string[] | undefined',
      arrayElement: { type: 'string', aliases: ['GameplayTag'] },
      optional: true,
    },
    source: ['packages/game-data-contract/src/skills.ts:103:3'],
    optional: true,
    description:
      'AbilityEntityTemplateData.bornTags；实体创建时立即成为其 AbilitySystem 自身标签。',
  },
  blackboard: definitionSchemaPart_0a9c733c7258e10e,
  lifetime: definitionSchemaPart_3f4a237a57771ca4,
  deathReleaseDelaySeconds: {
    kind: 'number',
    semantics: { type: 'number | undefined', optional: true },
    source: ['packages/game-data-contract/src/skills.ts:120:3'],
    optional: true,
    description: '实体死亡后仍留在 owner children / finder 目录中的控制器回收延迟。',
  },
  maxStackingCount: definitionSchemaPart_fd32199cc4c85205,
  childSkill: {
    kind: 'opaque',
    fallback: { reason: 'owned-resource-boundary' },
    semantics: { type: 'AbilityEntityChildSkillDefinition | undefined', optional: true },
    source: ['packages/game-data-contract/src/skills.ts:124:3'],
    optional: true,
    description: '该模板只使用一个子技能时的简写定义。',
  },
  childSkills: {
    kind: 'record',
    value: {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: { type: 'AbilityEntityChildSkillDefinition' },
      source: ['packages/game-data-contract/src/skills.ts:126:3'],
    },
    semantics: {
      type: 'Readonly<Record<string, AbilityEntityChildSkillDefinition>> | undefined',
      recordValue: { type: 'AbilityEntityChildSkillDefinition' },
      optional: true,
    },
    source: ['packages/game-data-contract/src/skills.ts:126:3'],
    optional: true,
    description: '同一原生实体模板可由不同 Spawn 动作绑定不同子技能；键为原生技能 ID。',
  },
  passiveSkills: {
    kind: 'array',
    element: {
      kind: 'opaque',
      fallback: { reason: 'owned-resource-boundary' },
      semantics: { type: 'AbilityEntityPassiveSkillDefinition' },
      source: ['packages/game-data-contract/src/skills.ts:128:3'],
    },
    semantics: {
      type: 'readonly AbilityEntityPassiveSkillDefinition[] | undefined',
      arrayElement: { type: 'AbilityEntityPassiveSkillDefinition' },
      optional: true,
    },
    source: ['packages/game-data-contract/src/skills.ts:128:3'],
    optional: true,
    description: '能力实体启用期间安装的被动技能。',
  },
} as const;
const definitionSchemaPart_bb8cae930741404e = {
  kind: {
    kind: 'enum',
    options: ['all'],
    semantics: { type: '"all"' },
    source: ['packages/game-data-contract/src/modifiers.ts:389:7'],
    description: '所有子条件都成立时返回真。',
  },
  conditions: definitionSchemaPart_a23c75a9a8a95254,
} as const;
const definitionSchemaPart_35f5ab18c62b58a2 = {
  kind: 'object',
  fields: definitionSchemaPart_bb8cae930741404e,
  semantics: {
    type: '{ readonly kind: "all"; readonly conditions: readonly PoiseModifierCondition[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:411:3'],
} as const;
const definitionSchemaPart_60d0967a81264d29 = {
  kind: 'object',
  fields: definitionSchemaPart_6be4051997408abe,
  semantics: {
    type: '{ kind: "buffBlackboardValueCompare"; target: BuffConditionTarget; query: { kind: "id"; buffIds: readonly string[]; } | { kind: "tag"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; }; desiredKey: string; outputKey: string; operator: "equal" | ... 4 more ... | "lessOrEqua...',
  },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_7392dc8a72388dd8 = {
  kind: 'object',
  fields: definitionSchemaPart_916b2090c4dc5dc1,
  semantics: {
    type: '{ kind: "buffBlackboardValueCompare"; target: BuffConditionTarget; query: { kind: "id"; buffIds: readonly string[]; } | { kind: "tag"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; }; desiredKey: string; outputKey: string; operator: "equal" | ... 4 more ... | "lessOrEqua...',
  },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_aef8485ab5968353 = {
  kind: 'object',
  fields: definitionSchemaPart_6be4051997408abe,
  semantics: {
    type: '{ kind: "buffBlackboardValueCompare"; target: BuffConditionTarget; query: { kind: "id"; buffIds: readonly string[]; } | { kind: "tag"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; }; desiredKey: string; outputKey: string; operator: "equal" | ... 4 more ... | "lessOrEqua...',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_eb59e2e7ba85ded3 = {
  kind: 'object',
  fields: definitionSchemaPart_6be4051997408abe,
  semantics: {
    type: '{ kind: "buffBlackboardValueCompare"; target: BuffConditionTarget; query: { kind: "id"; buffIds: readonly string[]; } | { kind: "tag"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; }; desiredKey: string; outputKey: string; operator: "equal" | ... 4 more ... | "lessOrEqua...',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_e545224e3a017a63 = {
  kind: 'object',
  fields: definitionSchemaPart_6be4051997408abe,
  semantics: {
    type: '{ kind: "buffBlackboardValueCompare"; target: BuffConditionTarget; query: { kind: "id"; buffIds: readonly string[]; } | { kind: "tag"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; }; desiredKey: string; outputKey: string; operator: "equal" | ... 4 more ... | "lessOrEqua...',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_c8fdebee4f75975a = {
  kind: 'object',
  fields: definitionSchemaPart_916b2090c4dc5dc1,
  semantics: {
    type: '{ kind: "buffBlackboardValueCompare"; target: BuffConditionTarget; query: { kind: "id"; buffIds: readonly string[]; } | { kind: "tag"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; }; desiredKey: string; outputKey: string; operator: "equal" | ... 4 more ... | "lessOrEqua...',
  },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_6f93ca23080138eb = {
  kind: 'object',
  fields: definitionSchemaPart_916b2090c4dc5dc1,
  semantics: {
    type: '{ kind: "buffBlackboardValueCompare"; target: BuffConditionTarget; query: { kind: "id"; buffIds: readonly string[]; } | { kind: "tag"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; }; desiredKey: string; outputKey: string; operator: "equal" | ... 4 more ... | "lessOrEqua...',
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_ddbba549482e18fa = {
  kind: 'object',
  fields: definitionSchemaPart_916b2090c4dc5dc1,
  semantics: {
    type: '{ kind: "buffBlackboardValueCompare"; target: BuffConditionTarget; query: { kind: "id"; buffIds: readonly string[]; } | { kind: "tag"; tagQueryType: "hasAny" | "hasAll" | "exceptAny" | "exceptAll"; buffTags: readonly string[]; }; desiredKey: string; outputKey: string; operator: "equal" | ... 4 more ... | "lessOrEqua...',
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_93544ad8719db563 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_c9e47ef31d4f2d5b,
    definitionSchemaPart_a3c0bae873541f33,
    definitionSchemaPart_85962b497c97c7e0,
  ],
  semantics: definitionSchemaPart_9b8fac2e52673b99,
  source: ['packages/game-data-contract/src/modifiers.ts:351:3'],
  optional: true,
  description: '启用处理器前必须满足的条件。',
} as const;
const definitionSchemaPart_280aaabaa23cc17f = {
  kind: {
    kind: 'enum',
    options: ['damageBonus'],
    semantics: { type: '"damageBonus"' },
    source: ['packages/game-data-contract/src/buildModifiers.ts:77:5'],
    description: '修正种类判别值。',
  },
  damageTypes: definitionSchemaPart_d9035991eaa48819,
  skillTypes: definitionSchemaPart_88ccefdbc578ad2e,
  value: {
    kind: 'union',
    variants: [
      {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/buildModifiers.ts:83:5'],
      },
      {
        kind: 'array',
        element: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/buildModifiers.ts:83:5'],
        },
        semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
        source: ['packages/game-data-contract/src/buildModifiers.ts:83:5'],
      },
    ],
    semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
    source: ['packages/game-data-contract/src/buildModifiers.ts:83:5'],
    description: '单个加成值或按等级排列的加成值。',
  },
} as const;
const definitionSchemaPart_d83f49ec760461b6 = {
  infinityValue: {
    kind: 'boolean',
    semantics: { type: 'boolean' },
    source: ['packages/game-data-contract/src/buffs.ts:321:3'],
    description: '是否使用不会耗尽的无限护盾值。',
  },
  value: definitionSchemaPart_c88917211142fe57,
  damageAbsorptions: definitionSchemaPart_8815a76d72c5eccc,
  absorbCount: definitionSchemaPart_4339358ad9197c59,
  absorbAllDamageWhenConsumed: {
    kind: 'boolean',
    semantics: { type: 'boolean' },
    source: ['packages/game-data-contract/src/buffs.ts:329:3'],
    description: '最后一次消耗护盾时是否仍吸收整次伤害。',
  },
  removeBuffWhenConsumed: {
    kind: 'boolean',
    semantics: { type: 'boolean' },
    source: ['packages/game-data-contract/src/buffs.ts:331:3'],
    description: '护盾耗尽时是否结束所属 Buff。',
  },
  priority: {
    kind: 'enum',
    options: ['normal', 'prioritizeConsume'],
    semantics: {
      type: 'BuffShieldPriority',
      unionVariants: [{ type: '"normal"' }, { type: '"prioritizeConsume"' }],
    },
    source: ['packages/game-data-contract/src/buffs.ts:333:3'],
    description: '与其他护盾竞争时的消耗优先级。',
  },
  replaceHitEffect: {
    kind: 'boolean',
    semantics: { type: 'boolean' },
    source: ['packages/game-data-contract/src/buffs.ts:335:3'],
    description: '只保留原生表现选择位；后端不解释 EffectActionCfg。',
  },
} as const;
const definitionSchemaPart_e6ae736911b9021c = {
  kind: 'object',
  fields: definitionSchemaPart_d83f49ec760461b6,
  semantics: { type: 'BuffShieldDefinition' },
  source: ['packages/game-data-contract/src/buffs.ts:722:3'],
} as const;
const definitionSchemaPart_93e4d0595cea98b5 = {
  kind: 'object',
  fields: definitionSchemaPart_280aaabaa23cc17f,
  semantics: {
    type: '{ readonly kind: "damageBonus"; readonly damageTypes: "physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; readonly skillTypes?: "comboSkill" | ... 7 more ... | undefined; readonly v...',
  },
  source: ['packages/game-data-contract/src/equipment.ts:58:7'],
} as const;
const definitionSchemaPart_68c366cf87612366 = {
  kind: 'object',
  fields: definitionSchemaPart_280aaabaa23cc17f,
  semantics: {
    type: '{ readonly kind: "damageBonus"; readonly damageTypes: "physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; readonly skillTypes?: "comboSkill" | ... 7 more ... | undefined; readonly v...',
  },
  source: ['packages/game-data-contract/src/equipment.ts:128:3'],
} as const;
const definitionSchemaPart_34378ae045ed8e42 = {
  kind: 'object',
  fields: definitionSchemaPart_280aaabaa23cc17f,
  semantics: {
    type: '{ readonly kind: "damageBonus"; readonly damageTypes: "physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether" | readonly ("physical" | "heat" | "cryo" | "electric" | "nature" | "true" | "lifeDrain" | "ether")[]; readonly skillTypes?: "comboSkill" | ... 7 more ... | undefined; readonly v...',
  },
  source: ['packages/game-data-contract/src/equipment.ts:184:3'],
} as const;
const definitionSchemaPart_3ca868972d102395 = {
  kind: 'union',
  variants: [definitionSchemaPart_63e8b5294ce3d248, definitionSchemaPart_d28a7250fa0cc5f5],
  semantics: {
    type: 'CombatBuffDefinitionDamageProcessor',
    unionVariants: [
      { type: 'DamageScaleProcessorDefinition' },
      {
        type: 'Pick<InstantAttributeProcessorDefinition, "attribute" | "kind" | "targetSide" | "values"> & { readonly attributeTiming: "runtime"; }',
      },
    ],
  },
  source: ['packages/game-data-contract/src/buffs.ts:645:3'],
} as const;
const definitionSchemaPart_68d17b9828d0a60f = {
  kind: 'array',
  element: definitionSchemaPart_e6ae736911b9021c,
  semantics: {
    type: 'readonly BuffShieldDefinition[] | undefined',
    arrayElement: { type: 'BuffShieldDefinition' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/buffs.ts:722:3'],
  optional: true,
  description: 'Buff 启用时创建的护盾；护盾的数值、吸收范围、次数和销毁行为由条目配置。',
} as const;
const definitionSchemaPart_88ca6fca7d8b52be = {
  kind: 'array',
  element: definitionSchemaPart_3ca868972d102395,
  semantics: {
    type: 'readonly CombatBuffDefinitionDamageProcessor[]',
    arrayElement: {
      type: 'CombatBuffDefinitionDamageProcessor',
      unionVariants: [
        { type: 'DamageScaleProcessorDefinition' },
        {
          type: 'Pick<InstantAttributeProcessorDefinition, "attribute" | "kind" | "targetSide" | "values"> & { readonly attributeTiming: "runtime"; }',
        },
      ],
    },
  },
  source: ['packages/game-data-contract/src/buffs.ts:645:3'],
  description: '条件成立时按顺序执行的伤害处理器。',
} as const;
const definitionSchemaPart_d6d7469da86beb00 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/modifiers.ts:377:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ readonly kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:411:3'],
    },
    definitionSchemaPart_4ec2fddf0a72df9c,
    definitionSchemaPart_35f5ab18c62b58a2,
  ],
  semantics: {
    type: 'PoiseModifierCondition | undefined',
    optional: true,
    unionVariants: [
      { type: '{ readonly kind: "casterControlled"; }' },
      {
        type: '{ readonly kind: "eventDamageTagsMatch"; readonly match: "hasAny" | "hasAll"; readonly tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | "comboSkill" | ... 10 more ... | "natureAbnormal")[]; }',
      },
      { type: '{ readonly kind: "all"; readonly conditions: readonly PoiseModifierCondition[]; }' },
    ],
  },
  source: ['packages/game-data-contract/src/modifiers.ts:411:3'],
  optional: true,
  description: '启用处理器前必须满足的条件。',
} as const;
const definitionSchemaPart_2027a78bbeffbdba = {
  enabledSide: {
    kind: 'enum',
    options: ['healer', 'receiver'],
    semantics: {
      type: 'HealModifierSide',
      unionVariants: [{ type: '"healer"' }, { type: '"receiver"' }],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:349:3'],
    description: '只有此修正安装在指定一方时才启用。',
  },
  condition: definitionSchemaPart_93544ad8719db563,
  processors: definitionSchemaPart_88cc12b2f3d57d2f,
} as const;
const definitionSchemaPart_f4a1b9395e35fe6e = {
  kind: 'object',
  fields: definitionSchemaPart_2027a78bbeffbdba,
  semantics: { type: 'HealModifierDefinition' },
  source: ['packages/game-data-contract/src/buffs.ts:718:3'],
} as const;
const definitionSchemaPart_ef93b0b898e06dca = {
  kind: 'array',
  element: definitionSchemaPart_f4a1b9395e35fe6e,
  semantics: {
    type: 'readonly HealModifierDefinition[] | undefined',
    arrayElement: { type: 'HealModifierDefinition' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/buffs.ts:718:3'],
  optional: true,
  description: 'Buff 启用期间参与治疗计算的条件和数值处理器。',
} as const;
const definitionSchemaPart_28aee41acd6a787a = {
  enabledSide: {
    kind: 'enum',
    options: ['defender', 'attacker'],
    semantics: {
      type: '"defender" | "attacker"',
      unionVariants: [{ type: '"defender"' }, { type: '"attacker"' }],
    },
    source: ['packages/game-data-contract/src/modifiers.ts:409:3'],
    description: '只有此修正安装在指定一方时才启用。',
  },
  condition: definitionSchemaPart_d6d7469da86beb00,
  processors: definitionSchemaPart_e4b6052e8b3cd1fc,
} as const;
const definitionSchemaPart_e5fe2685d925975a = {
  kind: 'object',
  fields: definitionSchemaPart_28aee41acd6a787a,
  semantics: { type: 'PoiseModifierDefinition' },
  source: ['packages/game-data-contract/src/buffs.ts:720:3'],
} as const;
const definitionSchemaPart_248f3862117f45d7 = {
  kind: 'array',
  element: definitionSchemaPart_e5fe2685d925975a,
  semantics: {
    type: 'readonly PoiseModifierDefinition[] | undefined',
    arrayElement: { type: 'PoiseModifierDefinition' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/buffs.ts:720:3'],
  optional: true,
  description: 'Buff 启用期间参与失衡伤害计算的条件和数值处理器。',
} as const;
const definitionSchemaPart_6d1b615e5d44a4ea = {
  kind: 'union',
  variants: [
    definitionSchemaPart_528d803174d5e9e9,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['operatorHit'],
          semantics: { type: '"operatorHit"' },
          source: ['packages/game-data-contract/src/actions.ts:1688:7'],
          description: '触发器种类判别值。',
        },
      },
      semantics: { type: '{ kind: "operatorHit"; }' },
      source: ['packages/game-data-contract/src/actions.ts:1798:3'],
    },
    definitionSchemaPart_fa0a13cdc00e31b4,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffApplied'],
          semantics: { type: '"buffApplied"' },
          source: ['packages/game-data-contract/src/actions.ts:1700:7'],
          description: '触发器种类判别值。',
        },
      },
      semantics: { type: '{ kind: "buffApplied"; }' },
      source: ['packages/game-data-contract/src/actions.ts:1798:3'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffOutput'],
          semantics: { type: '"buffOutput"' },
          source: ['packages/game-data-contract/src/actions.ts:1705:7'],
          description: '触发器种类判别值。',
        },
      },
      semantics: { type: '{ kind: "buffOutput"; }' },
      source: ['packages/game-data-contract/src/actions.ts:1798:3'],
    },
    definitionSchemaPart_d6060c97ff0b6b57,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['airborneOutput'],
          semantics: { type: '"airborneOutput"' },
          source: ['packages/game-data-contract/src/actions.ts:1717:7'],
          description: '触发器种类判别值。',
        },
      },
      semantics: { type: '{ kind: "airborneOutput"; }' },
      source: ['packages/game-data-contract/src/actions.ts:1798:3'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['knockDownOutput'],
          semantics: { type: '"knockDownOutput"' },
          source: ['packages/game-data-contract/src/actions.ts:1722:7'],
          description: '触发器种类判别值。',
        },
      },
      semantics: { type: '{ kind: "knockDownOutput"; }' },
      source: ['packages/game-data-contract/src/actions.ts:1798:3'],
    },
    definitionSchemaPart_ff02e5f7f518d655,
    definitionSchemaPart_b9d44e4279e6133c,
    definitionSchemaPart_5cebfe7586a9cc39,
    definitionSchemaPart_00276e4cc8821ccb,
    definitionSchemaPart_a49205ae3c764ad2,
    definitionSchemaPart_e908ef8870f5b916,
  ],
  semantics: definitionSchemaPart_c24c076d22fda201,
  source: ['packages/game-data-contract/src/actions.ts:1798:3'],
  description: '要监听的战斗事件及其筛选参数。',
} as const;
const definitionSchemaPart_2c640cab00812569 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_778b335d48e0cb5d,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['operatorHit'],
          semantics: { type: '"operatorHit"' },
          source: ['packages/game-data-contract/src/actions.ts:1688:7'],
          description: '触发器种类判别值。',
        },
      },
      semantics: { type: '{ kind: "operatorHit"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:109:9'],
    },
    definitionSchemaPart_0d9bd98aea23294d,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffApplied'],
          semantics: { type: '"buffApplied"' },
          source: ['packages/game-data-contract/src/actions.ts:1700:7'],
          description: '触发器种类判别值。',
        },
      },
      semantics: { type: '{ kind: "buffApplied"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:109:9'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffOutput'],
          semantics: { type: '"buffOutput"' },
          source: ['packages/game-data-contract/src/actions.ts:1705:7'],
          description: '触发器种类判别值。',
        },
      },
      semantics: { type: '{ kind: "buffOutput"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:109:9'],
    },
    definitionSchemaPart_b6b9ebff4ca48ffd,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['airborneOutput'],
          semantics: { type: '"airborneOutput"' },
          source: ['packages/game-data-contract/src/actions.ts:1717:7'],
          description: '触发器种类判别值。',
        },
      },
      semantics: { type: '{ kind: "airborneOutput"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:109:9'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['knockDownOutput'],
          semantics: { type: '"knockDownOutput"' },
          source: ['packages/game-data-contract/src/actions.ts:1722:7'],
          description: '触发器种类判别值。',
        },
      },
      semantics: { type: '{ kind: "knockDownOutput"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:109:9'],
    },
    definitionSchemaPart_cb10ab0155d51dba,
    definitionSchemaPart_45a4a575c30b47af,
    definitionSchemaPart_a769edf2b424873a,
    definitionSchemaPart_d9fbd4a4aff896b1,
    definitionSchemaPart_2615f33168748abe,
    definitionSchemaPart_09c6b1502060c2a5,
  ],
  semantics: definitionSchemaPart_c24c076d22fda201,
  source: ['packages/game-data-contract/src/equipment.ts:109:9'],
  description: '监听一项语义战斗事件。',
} as const;
const definitionSchemaPart_e479248b5a10b82e = {
  key: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/actions.ts:1796:3'],
    description: '事件响应在当前技能中的唯一名称。',
  },
  event: definitionSchemaPart_6d1b615e5d44a4ea,
  condition: {
    kind: 'condition',
    fallback: { reason: 'condition-editor-pending' },
    semantics: {
      type: 'CombatCondition | undefined',
      aliases: ['CombatCondition'],
      optional: true,
    },
    source: ['packages/game-data-contract/src/actions.ts:1800:3'],
    optional: true,
    description: '事件发生后还需满足的条件。',
  },
  scheduledSequences: definitionSchemaPart_a9a772ea32598b9c,
} as const;
const definitionSchemaPart_fca8b2a637710219 = {
  kind: 'object',
  fields: definitionSchemaPart_e479248b5a10b82e,
  semantics: { type: 'CombatEventHandlerDefinition' },
  source: ['packages/game-data-contract/src/skills.ts:358:3'],
} as const;
const definitionSchemaPart_6baf5250ce182ba6 = {
  kind: 'array',
  element: definitionSchemaPart_fca8b2a637710219,
  semantics: {
    type: 'readonly CombatEventHandlerDefinition[] | undefined',
    arrayElement: { type: 'CombatEventHandlerDefinition' },
    optional: true,
  },
  source: ['packages/game-data-contract/src/skills.ts:358:3'],
  optional: true,
  description: '技能启用期间注册的战斗事件响应。',
} as const;
const definitionSchemaPart_02be736ed6a33cb6 = {
  placementPolicy: definitionSchemaPart_e127e0e571a81a37,
  key: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/skills.ts:396:3'],
    description: '技能组在干员定义中的唯一名称。',
  },
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
    semantics: {
      type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge"',
      unionVariants: [
        { type: '"comboSkill"' },
        { type: '"plungingAttack"' },
        { type: '"basicAttack"' },
        { type: '"battleSkill"' },
        { type: '"ultimate"' },
        { type: '"finisher"' },
        { type: '"dodge"' },
      ],
    },
    source: ['packages/game-data-contract/src/skills.ts:398:3'],
    description: '玩家操作类别；技能库与轴上技能块均据此展示，实际执行读取具体技能的 skillType。',
  },
  skills: definitionSchemaPart_3e22ab76596e82d5,
  nameKey: {
    kind: 'string',
    semantics: { type: 'string | undefined', optional: true },
    source: ['packages/game-data-contract/src/skills.ts:402:3'],
    optional: true,
    description: '操作名称模板的 i18n 键，含 name/shortName；{baseName} 为操作名称（轴上含段号）。',
  },
  placementSequenceSkillKeys: {
    kind: 'array',
    element: {
      kind: 'string',
      semantics: { type: 'string' },
      source: ['packages/game-data-contract/src/skills.ts:407:3'],
    },
    semantics: {
      type: 'readonly string[] | undefined',
      arrayElement: { type: 'string' },
      optional: true,
    },
    source: ['packages/game-data-contract/src/skills.ts:407:3'],
    optional: true,
    description:
      '运行时虽以换槽形态注册、但编辑器放置时具有明确先后关系的完整技能键序列。\n独立替换操作必须直接声明独立技能组，不由 UI 从 replacement 拆出卡片。',
  },
  variants: definitionSchemaPart_617846e70609372e,
  replacementSkills: definitionSchemaPart_00bca9079bc7e631,
  replacementSkillPlacements: {
    kind: 'record',
    value: {
      kind: 'enum',
      options: ['internal'],
      semantics: { type: '"internal"' },
      source: ['packages/game-data-contract/src/skills.ts:423:3'],
    },
    semantics: {
      type: 'Readonly<Record<string, "internal">> | undefined',
      recordValue: { type: '"internal"' },
      optional: true,
    },
    source: ['packages/game-data-contract/src/skills.ts:423:3'],
    optional: true,
    description:
      '每个运行时替换技能在技能库中的显式放置语义。运行时替换关系本身不能推出展示语义：\n`internal` 不接受玩家输入；独立操作由独立技能组表达。\n有序接续技能由 `placementSequenceSkillKeys` 表达，不重复出现在这里。',
  },
  routedReplacementSkills: definitionSchemaPart_0f7cdcc85f7b49cb,
  presentationVariants: definitionSchemaPart_30065d374da22c72,
} as const;
const definitionSchemaPart_2ce399a24fc56a37 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_86fa484f5b2cbd2f,
    definitionSchemaPart_6d88fb7f2195066f,
    definitionSchemaPart_68c366cf87612366,
    definitionSchemaPart_40d5166c4f499d36,
    definitionSchemaPart_10270249c690ff09,
    definitionSchemaPart_6fe0b61010182500,
  ],
  semantics: definitionSchemaPart_956d2e0ef56cf605,
  source: ['packages/game-data-contract/src/equipment.ts:128:3'],
} as const;
const definitionSchemaPart_59523b4e5e07bd03 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_64a2952b04c6de38,
    definitionSchemaPart_8a0a5618637bd468,
    definitionSchemaPart_34378ae045ed8e42,
    definitionSchemaPart_c75076e556f42d09,
    definitionSchemaPart_044443d307581d45,
    definitionSchemaPart_397bcba61e04ecfa,
  ],
  semantics: definitionSchemaPart_956d2e0ef56cf605,
  source: ['packages/game-data-contract/src/equipment.ts:184:3'],
} as const;
const definitionSchemaPart_9f7af17f20b5c439 = {
  kind: 'union',
  variants: [
    definitionSchemaPart_b56fddb972db2ae3,
    definitionSchemaPart_3f6133453df275c6,
    definitionSchemaPart_93e4d0595cea98b5,
    definitionSchemaPart_caeb6b64b06deea6,
    definitionSchemaPart_d68d3b28d4f9c1a5,
    definitionSchemaPart_b74c9296ca0205b9,
  ],
  semantics: definitionSchemaPart_956d2e0ef56cf605,
  source: ['packages/game-data-contract/src/equipment.ts:58:7'],
  description: '用于显示的修正定义。',
} as const;
const definitionSchemaPart_3108dff1163c182a = {
  kind: {
    kind: 'enum',
    options: ['modifier'],
    semantics: { type: '"modifier"' },
    source: ['packages/game-data-contract/src/equipment.ts:56:7'],
    description: '直接按一项实际修正生成显示文字。',
  },
  modifier: definitionSchemaPart_9f7af17f20b5c439,
} as const;
const definitionSchemaPart_e960b2cf03ea8d49 = {
  kind: 'object',
  fields: definitionSchemaPart_3108dff1163c182a,
  semantics: { type: '{ readonly kind: "modifier"; readonly modifier: BuildModifierDefinition; }' },
  source: ['packages/game-data-contract/src/equipment.ts:186:3'],
} as const;
const definitionSchemaPart_58975cbd1d457ed9 = {
  kind: 'array',
  element: definitionSchemaPart_2ce399a24fc56a37,
  semantics: definitionSchemaPart_d74109a797c08662,
  source: ['packages/game-data-contract/src/equipment.ts:128:3'],
  optional: true,
  description: '构筑阶段持续生效的属性修正。',
} as const;
const definitionSchemaPart_725b6312caca9879 = {
  kind: 'array',
  element: definitionSchemaPart_59523b4e5e07bd03,
  semantics: definitionSchemaPart_d74109a797c08662,
  source: ['packages/game-data-contract/src/equipment.ts:184:3'],
  optional: true,
  description: '构筑阶段持续生效的属性修正。',
} as const;
const definitionSchemaPart_1f3c613b2f0c0cb6 = {
  kind: 'union',
  variants: [definitionSchemaPart_e960b2cf03ea8d49, definitionSchemaPart_7f6fbe4607f7b0e9],
  semantics: {
    type: 'EquipmentTraitDisplayDefinition',
    unionVariants: [
      { type: '{ readonly kind: "modifier"; readonly modifier: BuildModifierDefinition; }' },
      {
        type: '{ readonly kind: "composite"; readonly composite: "cryoAndElectricDamageIncrease" | "heatAndNatureDamageIncrease" | "allSkillDamageIncrease" | "allDamageReduction" | "spellDamageIncrease"; readonly value: LevelValues; }',
      },
    ],
  },
  source: ['packages/game-data-contract/src/equipment.ts:186:3'],
  description: '每条原生装备词条都有且只有一份 displayAttrModifiers 展示定义。',
} as const;
const definitionSchemaPart_ca69785fc89610cd = {
  kind: 'union',
  variants: [
    definitionSchemaPart_dcd4c5dd14bb1a07,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/modifiers.ts:121:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ readonly kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
    },
    definitionSchemaPart_282ca731c3016c2e,
    definitionSchemaPart_01d106c154114661,
    definitionSchemaPart_27b242c01ccd7bbe,
    definitionSchemaPart_c024779c4de07b16,
    definitionSchemaPart_66fb0465a2cde59a,
    definitionSchemaPart_bd57b9b997825f04,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['sourceSkillCastMatch'],
          semantics: { type: '"sourceSkillCastMatch"' },
          source: ['packages/game-data-contract/src/modifiers.ts:188:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ readonly kind: "sourceSkillCastMatch"; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
    },
    definitionSchemaPart_651707965d5dd214,
    definitionSchemaPart_59ea6127bf3998fb,
    definitionSchemaPart_1d1daf70697cec4f,
    definitionSchemaPart_4b226ee6100db9c5,
  ],
  semantics: definitionSchemaPart_14490bd1e3ddf34d,
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
} as const;
const definitionSchemaPart_b1dc9686b279d0a8 = {
  kind: 'array',
  element: definitionSchemaPart_ca69785fc89610cd,
  semantics: definitionSchemaPart_7c3aefbfef91ddf5,
  source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
  description: '只需其中一项成立的条件。',
} as const;
const definitionSchemaPart_ec3999f836e77e9a = {
  kind: {
    kind: 'enum',
    options: ['any'],
    semantics: { type: '"any"' },
    source: ['packages/game-data-contract/src/modifiers.ts:214:7'],
    description: '任一子条件成立时返回真。',
  },
  conditions: definitionSchemaPart_b1dc9686b279d0a8,
} as const;
const definitionSchemaPart_ad43989ae102a945 = {
  kind: 'object',
  fields: definitionSchemaPart_ec3999f836e77e9a,
  semantics: {
    type: '{ readonly kind: "any"; readonly conditions: readonly DamageModifierCondition[]; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:643:3'],
} as const;
const definitionSchemaPart_d1f21442d02dbb22 = {
  kind: 'object',
  fields: definitionSchemaPart_ec3999f836e77e9a,
  semantics: {
    type: '{ readonly kind: "any"; readonly conditions: readonly DamageModifierCondition[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
} as const;
const definitionSchemaPart_fc01350246d09c17 = {
  kind: 'object',
  fields: definitionSchemaPart_ec3999f836e77e9a,
  semantics: {
    type: '{ readonly kind: "any"; readonly conditions: readonly DamageModifierCondition[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
} as const;
const definitionSchemaPart_3720f5e4ffb8bd73 = {
  key: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/equipment.ts:180:3'],
    description: '词条在该装备中的唯一名称。',
  },
  levelCount: {
    kind: 'number',
    semantics: { type: 'number' },
    source: ['packages/game-data-contract/src/equipment.ts:182:3'],
    description: '这条词条可以解析的精锻等级数量。',
  },
  modifiers: definitionSchemaPart_725b6312caca9879,
  display: definitionSchemaPart_1f3c613b2f0c0cb6,
} as const;
const definitionSchemaPart_28251f7b6a82415b = {
  kind: 'union',
  variants: [
    definitionSchemaPart_d55be315b5b9e51a,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/modifiers.ts:121:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ readonly kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
    },
    definitionSchemaPart_f37ee6189c2b3454,
    definitionSchemaPart_47ac92f74cc90f0c,
    definitionSchemaPart_5e650b5f5970e498,
    definitionSchemaPart_3327ba95d1fe279e,
    definitionSchemaPart_ef693f37b3d73bbf,
    definitionSchemaPart_0ac9d3f5e458b521,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['sourceSkillCastMatch'],
          semantics: { type: '"sourceSkillCastMatch"' },
          source: ['packages/game-data-contract/src/modifiers.ts:188:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ readonly kind: "sourceSkillCastMatch"; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
    },
    definitionSchemaPart_f3440810dcdb9c78,
    definitionSchemaPart_c710d61f557da047,
    definitionSchemaPart_a644d4614b4a596b,
    definitionSchemaPart_fc01350246d09c17,
  ],
  semantics: definitionSchemaPart_14490bd1e3ddf34d,
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
} as const;
const definitionSchemaPart_ea646da6a5333528 = {
  kind: 'array',
  element: definitionSchemaPart_28251f7b6a82415b,
  semantics: definitionSchemaPart_7c3aefbfef91ddf5,
  source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
  description: '需要同时成立的条件。',
} as const;
const definitionSchemaPart_4eceab37c1814639 = {
  kind: {
    kind: 'enum',
    options: ['all'],
    semantics: { type: '"all"' },
    source: ['packages/game-data-contract/src/modifiers.ts:208:7'],
    description: '所有子条件都成立时返回真。',
  },
  conditions: definitionSchemaPart_ea646da6a5333528,
} as const;
const definitionSchemaPart_f2944265ff0aa3fa = {
  kind: 'object',
  fields: definitionSchemaPart_4eceab37c1814639,
  semantics: {
    type: '{ readonly kind: "all"; readonly conditions: readonly DamageModifierCondition[]; }',
  },
  source: ['packages/game-data-contract/src/buffs.ts:643:3'],
} as const;
const definitionSchemaPart_8a913fa4219e4268 = {
  kind: 'object',
  fields: definitionSchemaPart_4eceab37c1814639,
  semantics: {
    type: '{ readonly kind: "all"; readonly conditions: readonly DamageModifierCondition[]; }',
  },
  source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
} as const;
const definitionSchemaPart_eb1b6899fdc8301c = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:53:7'],
          description: '直接返回固定真假值。',
        },
        value: {
          kind: 'boolean',
          semantics: { type: 'boolean' },
          source: ['packages/game-data-contract/src/conditions.ts:55:7'],
          description: '条件结果。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: boolean; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['combatActive'],
          semantics: { type: '"combatActive"' },
          source: ['packages/game-data-contract/src/conditions.ts:60:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "combatActive"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['singleEnemyPresent'],
          semantics: { type: '"singleEnemyPresent"' },
          source: ['packages/game-data-contract/src/conditions.ts:65:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "singleEnemyPresent"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:70:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_820c1984cd98077b,
    definitionSchemaPart_cd11cac2ebbf412c,
    definitionSchemaPart_152c280826449377,
    definitionSchemaPart_40999a8989da4e36,
    definitionSchemaPart_9fbd3d3cb7af0341,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['skillBranchEnabled'],
          semantics: { type: '"skillBranchEnabled"' },
          source: ['packages/game-data-contract/src/conditions.ts:115:7'],
          description: '检查构筑是否启用了一个技能动作分支。',
        },
        branchKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/conditions.ts:117:7'],
          description: '要检查的分支键。',
        },
      },
      semantics: { type: '{ kind: "skillBranchEnabled"; branchKey: string; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_19039635b239e2a4,
    definitionSchemaPart_97aad1c93ad06628,
    definitionSchemaPart_857ebf01b6ebb9da,
    definitionSchemaPart_ab3f2a6282fb0ed4,
    definitionSchemaPart_de6e3f9c0ce77a2b,
    definitionSchemaPart_e545224e3a017a63,
    definitionSchemaPart_11f38d1719d85ed3,
    definitionSchemaPart_972a5b6255cda3b8,
    definitionSchemaPart_e52131cf5124b907,
    definitionSchemaPart_babe865ff2b188ed,
    definitionSchemaPart_955ea7a296c83f6f,
    definitionSchemaPart_b9171679a7134d1f,
    definitionSchemaPart_4a7eef357a35f813,
    definitionSchemaPart_6f6a52bd5f281d99,
    definitionSchemaPart_64187ddd0b664c1a,
    definitionSchemaPart_3874556b87a6728c,
    definitionSchemaPart_e3aab71b894af59e,
    definitionSchemaPart_2867e61eaaa76b88,
    definitionSchemaPart_1fc21de6959314f8,
    definitionSchemaPart_cfa9392e4535ea43,
    definitionSchemaPart_8fc5253a91a22afe,
    definitionSchemaPart_789e422ae597c655,
    definitionSchemaPart_7071bac8a80ab9d1,
    definitionSchemaPart_c27555e6a735887b,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterComboPending'],
          semantics: { type: '"casterComboPending"' },
          source: ['packages/game-data-contract/src/conditions.ts:391:7'],
          description: '施放者的原生连携候选列表非空；不检查冷却、队首、当前技能或可释放性。',
        },
      },
      semantics: { type: '{ kind: "casterComboPending"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventComboRingQteSucceeded'],
          semantics: { type: '"eventComboRingQteSucceeded"' },
          source: ['packages/game-data-contract/src/conditions.ts:395:7'],
          description: '当前 beforeCastSkill 对应的连携输入命中了 ShowComboRingQte 有效阶段。',
        },
      },
      semantics: { type: '{ kind: "eventComboRingQteSucceeded"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_e30d083bfbf844c8,
    definitionSchemaPart_8a5c9f10ef3173ef,
    definitionSchemaPart_1d9fb1648d3c79c4,
    definitionSchemaPart_95ef8d78779a9c19,
    definitionSchemaPart_d687d9b459294c6f,
    definitionSchemaPart_b28c45c6baf5f4bb,
    definitionSchemaPart_566d9fd99631f0c0,
    definitionSchemaPart_56d1c65bfba4434a,
    definitionSchemaPart_d3ee1a899b8eb5fd,
    definitionSchemaPart_d025e87d720dce8f,
    definitionSchemaPart_42eb93b4cedb4f6b,
    definitionSchemaPart_c3553e7b3595e713,
    definitionSchemaPart_82aef6e7b1c30272,
    definitionSchemaPart_42d5166712060500,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSkillCastMatchesBuffSource'],
          semantics: { type: '"eventSkillCastMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:504:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSkillCastMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_f7d949d387e7429c,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventBuffEndedEarly'],
          semantics: { type: '"eventBuffEndedEarly"' },
          source: ['packages/game-data-contract/src/conditions.ts:517:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventBuffEndedEarly"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_61d0c4fbd29a93a5,
    definitionSchemaPart_6003fa0d20364a07,
    definitionSchemaPart_2bdcf28d4ce0e581,
    definitionSchemaPart_f46683eecce06912,
    definitionSchemaPart_2cf713125ca503c5,
    definitionSchemaPart_61d0446690c1da8f,
    definitionSchemaPart_9e3dc0650cb7819e,
    definitionSchemaPart_013f8d0510474da5,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSource'],
          semantics: { type: '"eventSourceMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:592:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSourceEntitySource'],
          semantics: { type: '"eventSourceMatchesBuffSourceEntitySource"' },
          source: ['packages/game-data-contract/src/conditions.ts:597:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSourceEntitySource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceControlled'],
          semantics: { type: '"eventSourceControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:602:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffSourceMatchesOwner'],
          semantics: { type: '"buffSourceMatchesOwner"' },
          source: ['packages/game-data-contract/src/conditions.ts:607:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "buffSourceMatchesOwner"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_50ee7c7b6cd6e152,
    definitionSchemaPart_5ce6099668a163c7,
    definitionSchemaPart_fec9f419aafc6b58,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['not'],
          semantics: { type: '"not"' },
          source: ['packages/game-data-contract/src/conditions.ts:635:7'],
          description: '对一个子条件的结果取反。',
        },
        condition: {
          kind: 'ref',
          ref: 'field_c3a7d4d96f89e1fc27f5',
          semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
          source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          inlineCondition: 'equipment',
          description: '要取反的条件。',
        },
      },
      semantics: { type: '{ kind: "not"; condition: CombatCondition; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_00d53040d647c62a,
    definitionSchemaPart_34d589533c5afe26,
    definitionSchemaPart_0aafb31f46f463e8,
  ],
  semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
  inlineCondition: 'equipment',
} as const;
const definitionSchemaPart_c7b46650c6e12388 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:53:7'],
          description: '直接返回固定真假值。',
        },
        value: {
          kind: 'boolean',
          semantics: { type: 'boolean' },
          source: ['packages/game-data-contract/src/conditions.ts:55:7'],
          description: '条件结果。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: boolean; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['combatActive'],
          semantics: { type: '"combatActive"' },
          source: ['packages/game-data-contract/src/conditions.ts:60:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "combatActive"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['singleEnemyPresent'],
          semantics: { type: '"singleEnemyPresent"' },
          source: ['packages/game-data-contract/src/conditions.ts:65:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "singleEnemyPresent"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:70:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_820c1984cd98077b,
    definitionSchemaPart_cd11cac2ebbf412c,
    definitionSchemaPart_152c280826449377,
    definitionSchemaPart_2266646bb08e7b2d,
    definitionSchemaPart_bd5940bcc69326d0,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['skillBranchEnabled'],
          semantics: { type: '"skillBranchEnabled"' },
          source: ['packages/game-data-contract/src/conditions.ts:115:7'],
          description: '检查构筑是否启用了一个技能动作分支。',
        },
        branchKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/conditions.ts:117:7'],
          description: '要检查的分支键。',
        },
      },
      semantics: { type: '{ kind: "skillBranchEnabled"; branchKey: string; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_19039635b239e2a4,
    definitionSchemaPart_40f774bdf95e8048,
    definitionSchemaPart_8117ee83396ddce4,
    definitionSchemaPart_ab3f2a6282fb0ed4,
    definitionSchemaPart_191604f683c687ec,
    definitionSchemaPart_ddbba549482e18fa,
    definitionSchemaPart_b57eb24ae4bfa1ef,
    definitionSchemaPart_972a5b6255cda3b8,
    definitionSchemaPart_e52131cf5124b907,
    definitionSchemaPart_babe865ff2b188ed,
    definitionSchemaPart_955ea7a296c83f6f,
    definitionSchemaPart_b9171679a7134d1f,
    definitionSchemaPart_4a7eef357a35f813,
    definitionSchemaPart_6f6a52bd5f281d99,
    definitionSchemaPart_64187ddd0b664c1a,
    definitionSchemaPart_0a6824d2cc48cd13,
    definitionSchemaPart_93c662c7c6502693,
    definitionSchemaPart_2867e61eaaa76b88,
    definitionSchemaPart_8f078401d3f65ad2,
    definitionSchemaPart_45501655b4cc62c6,
    definitionSchemaPart_8f6fa2185db32868,
    definitionSchemaPart_789e422ae597c655,
    definitionSchemaPart_b577b8366cd2a79b,
    definitionSchemaPart_c27555e6a735887b,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterComboPending'],
          semantics: { type: '"casterComboPending"' },
          source: ['packages/game-data-contract/src/conditions.ts:391:7'],
          description: '施放者的原生连携候选列表非空；不检查冷却、队首、当前技能或可释放性。',
        },
      },
      semantics: { type: '{ kind: "casterComboPending"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventComboRingQteSucceeded'],
          semantics: { type: '"eventComboRingQteSucceeded"' },
          source: ['packages/game-data-contract/src/conditions.ts:395:7'],
          description: '当前 beforeCastSkill 对应的连携输入命中了 ShowComboRingQte 有效阶段。',
        },
      },
      semantics: { type: '{ kind: "eventComboRingQteSucceeded"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_e30d083bfbf844c8,
    definitionSchemaPart_8a5c9f10ef3173ef,
    definitionSchemaPart_1d9fb1648d3c79c4,
    definitionSchemaPart_95ef8d78779a9c19,
    definitionSchemaPart_d687d9b459294c6f,
    definitionSchemaPart_b28c45c6baf5f4bb,
    definitionSchemaPart_566d9fd99631f0c0,
    definitionSchemaPart_56d1c65bfba4434a,
    definitionSchemaPart_d3ee1a899b8eb5fd,
    definitionSchemaPart_d025e87d720dce8f,
    definitionSchemaPart_42eb93b4cedb4f6b,
    definitionSchemaPart_c3553e7b3595e713,
    definitionSchemaPart_82aef6e7b1c30272,
    definitionSchemaPart_42d5166712060500,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSkillCastMatchesBuffSource'],
          semantics: { type: '"eventSkillCastMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:504:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSkillCastMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_f7d949d387e7429c,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventBuffEndedEarly'],
          semantics: { type: '"eventBuffEndedEarly"' },
          source: ['packages/game-data-contract/src/conditions.ts:517:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventBuffEndedEarly"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_61d0c4fbd29a93a5,
    definitionSchemaPart_1338b05b3f1ba6d0,
    definitionSchemaPart_2bdcf28d4ce0e581,
    definitionSchemaPart_f46683eecce06912,
    definitionSchemaPart_896653460e5c5945,
    definitionSchemaPart_61d0446690c1da8f,
    definitionSchemaPart_9e3dc0650cb7819e,
    definitionSchemaPart_013f8d0510474da5,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSource'],
          semantics: { type: '"eventSourceMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:592:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSourceEntitySource'],
          semantics: { type: '"eventSourceMatchesBuffSourceEntitySource"' },
          source: ['packages/game-data-contract/src/conditions.ts:597:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSourceEntitySource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceControlled'],
          semantics: { type: '"eventSourceControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:602:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffSourceMatchesOwner'],
          semantics: { type: '"buffSourceMatchesOwner"' },
          source: ['packages/game-data-contract/src/conditions.ts:607:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "buffSourceMatchesOwner"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_50ee7c7b6cd6e152,
    definitionSchemaPart_5ce6099668a163c7,
    definitionSchemaPart_fec9f419aafc6b58,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['not'],
          semantics: { type: '"not"' },
          source: ['packages/game-data-contract/src/conditions.ts:635:7'],
          description: '对一个子条件的结果取反。',
        },
        condition: {
          kind: 'ref',
          ref: 'field_06572a068b9551ab9c57',
          semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
          source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          inlineCondition: 'skillSwitch',
          description: '要取反的条件。',
        },
      },
      semantics: { type: '{ kind: "not"; condition: CombatCondition; }' },
      source: ['packages/game-data-contract/src/conditions.ts:649:7'],
    },
    definitionSchemaPart_15ac83d48ab0e3f4,
    definitionSchemaPart_a655ba7eebb1b4f8,
    definitionSchemaPart_0aafb31f46f463e8,
  ],
  semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
  inlineCondition: 'skillSwitch',
} as const;
const definitionSchemaPart_bbc0f55e5c52a07a = {
  kind: 'union',
  variants: [
    definitionSchemaPart_0ee0a4d68f827d67,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/modifiers.ts:121:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ readonly kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
    },
    definitionSchemaPart_4ebbdcfe1ab8da96,
    definitionSchemaPart_f175b2f8f21035ff,
    definitionSchemaPart_8eac86513cc1c067,
    definitionSchemaPart_b7b8c332fab674f2,
    definitionSchemaPart_730128473335a884,
    definitionSchemaPart_789b511a17f0bfd0,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['sourceSkillCastMatch'],
          semantics: { type: '"sourceSkillCastMatch"' },
          source: ['packages/game-data-contract/src/modifiers.ts:188:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ readonly kind: "sourceSkillCastMatch"; }' },
      source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
    },
    definitionSchemaPart_8dc435109fa5665b,
    definitionSchemaPart_e595e04cf4e029b1,
    definitionSchemaPart_8a913fa4219e4268,
    definitionSchemaPart_d1f21442d02dbb22,
  ],
  semantics: definitionSchemaPart_14490bd1e3ddf34d,
  source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
  description: '要取反的条件。',
} as const;
const definitionSchemaPart_49c9cfe8a1326bed = {
  kind: 'array',
  element: definitionSchemaPart_eb1b6899fdc8301c,
  semantics: {
    type: 'readonly CombatCondition[]',
    arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
} as const;
const definitionSchemaPart_95bb7ab8ac7b39c0 = {
  kind: 'array',
  element: definitionSchemaPart_eb1b6899fdc8301c,
  semantics: {
    type: 'readonly CombatCondition[]',
    arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
  description: '只需其中一项成立的条件。',
} as const;
const definitionSchemaPart_6bb9940e854e1954 = {
  kind: {
    kind: 'enum',
    options: ['not'],
    semantics: { type: '"not"' },
    source: ['packages/game-data-contract/src/modifiers.ts:202:7'],
    description: '对一个子条件取反。',
  },
  condition: definitionSchemaPart_bbc0f55e5c52a07a,
} as const;
const definitionSchemaPart_4ea1db3d6736c7f8 = {
  kind: 'array',
  element: definitionSchemaPart_c7b46650c6e12388,
  semantics: {
    type: 'readonly CombatCondition[]',
    arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
  },
  source: ['packages/game-data-contract/src/conditions.ts:649:7'],
  description: '只需其中一项成立的条件。',
} as const;
const definitionSchemaPart_af3a5575445f63fd = {
  kind: {
    kind: 'enum',
    options: ['any'],
    semantics: { type: '"any"' },
    source: ['packages/game-data-contract/src/conditions.ts:647:7'],
    description: '任一子条件成立时返回真。',
  },
  conditions: definitionSchemaPart_95bb7ab8ac7b39c0,
} as const;
const definitionSchemaPart_5c68d111c62bc54d = {
  kind: 'object',
  fields: definitionSchemaPart_6bb9940e854e1954,
  semantics: { type: '{ readonly kind: "not"; readonly condition: DamageModifierCondition; }' },
  source: ['packages/game-data-contract/src/buffs.ts:643:3'],
} as const;
const definitionSchemaPart_cb742cd850874a06 = {
  kind: {
    kind: 'enum',
    options: ['any'],
    semantics: { type: '"any"' },
    source: ['packages/game-data-contract/src/conditions.ts:647:7'],
    description: '任一子条件成立时返回真。',
  },
  conditions: definitionSchemaPart_4ea1db3d6736c7f8,
} as const;
const definitionSchemaPart_328e0da310fb0a77 = {
  kind: 'object',
  fields: definitionSchemaPart_af3a5575445f63fd,
  semantics: { type: '{ kind: "any"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_e87d42791ca0c5f3 = {
  kind: 'object',
  fields: definitionSchemaPart_af3a5575445f63fd,
  semantics: { type: '{ kind: "any"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_aa650c481a95f04e = {
  kind: 'object',
  fields: definitionSchemaPart_af3a5575445f63fd,
  semantics: { type: '{ kind: "any"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_c6084c9d614649d6 = {
  kind: 'object',
  fields: definitionSchemaPart_cb742cd850874a06,
  semantics: { type: '{ kind: "any"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_02430c2dadaa9b97 = {
  kind: 'object',
  fields: definitionSchemaPart_cb742cd850874a06,
  semantics: { type: '{ kind: "any"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_06336561b70c44b5 = {
  kind: 'object',
  fields: definitionSchemaPart_cb742cd850874a06,
  semantics: { type: '{ kind: "any"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_921258e328dfd16a = {
  kind: 'union',
  variants: [
    definitionSchemaPart_e7ac4a1bec34c764,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/modifiers.ts:121:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ readonly kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/buffs.ts:643:3'],
    },
    definitionSchemaPart_0940715d2b972676,
    definitionSchemaPart_229390798076d508,
    definitionSchemaPart_0ccacf38a4a210ed,
    definitionSchemaPart_bc493bb2625b2afd,
    definitionSchemaPart_80da45353908699e,
    definitionSchemaPart_b950e976a6c4c73f,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['sourceSkillCastMatch'],
          semantics: { type: '"sourceSkillCastMatch"' },
          source: ['packages/game-data-contract/src/modifiers.ts:188:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ readonly kind: "sourceSkillCastMatch"; }' },
      source: ['packages/game-data-contract/src/buffs.ts:643:3'],
    },
    definitionSchemaPart_f92085ee005a2923,
    definitionSchemaPart_5c68d111c62bc54d,
    definitionSchemaPart_f2944265ff0aa3fa,
    definitionSchemaPart_ad43989ae102a945,
  ],
  semantics: definitionSchemaPart_2bb238d7194f87ab,
  source: ['packages/game-data-contract/src/buffs.ts:643:3'],
  optional: true,
  description: '启用处理器前检查的条件。',
} as const;
const definitionSchemaPart_26d962aa020f4813 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:53:7'],
          description: '直接返回固定真假值。',
        },
        value: {
          kind: 'boolean',
          semantics: { type: 'boolean' },
          source: ['packages/game-data-contract/src/conditions.ts:55:7'],
          description: '条件结果。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: boolean; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['combatActive'],
          semantics: { type: '"combatActive"' },
          source: ['packages/game-data-contract/src/conditions.ts:60:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "combatActive"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['singleEnemyPresent'],
          semantics: { type: '"singleEnemyPresent"' },
          source: ['packages/game-data-contract/src/conditions.ts:65:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "singleEnemyPresent"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:70:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_18e490990e3075bc,
    definitionSchemaPart_625b0402290cb27a,
    definitionSchemaPart_d6c123cf208c03ab,
    definitionSchemaPart_f42ea4965d36dac7,
    definitionSchemaPart_9cb17fc82b4fc856,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['skillBranchEnabled'],
          semantics: { type: '"skillBranchEnabled"' },
          source: ['packages/game-data-contract/src/conditions.ts:115:7'],
          description: '检查构筑是否启用了一个技能动作分支。',
        },
        branchKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/conditions.ts:117:7'],
          description: '要检查的分支键。',
        },
      },
      semantics: { type: '{ kind: "skillBranchEnabled"; branchKey: string; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_647ddee0655d2d96,
    definitionSchemaPart_9fccc9e766a8c37b,
    definitionSchemaPart_4e227d503b6aaf84,
    definitionSchemaPart_f21ae48f947f1ce0,
    definitionSchemaPart_8cdeaaf8a703da2c,
    definitionSchemaPart_eb59e2e7ba85ded3,
    definitionSchemaPart_1fcf1b1484c6a655,
    definitionSchemaPart_e21c32779f30aa39,
    definitionSchemaPart_0cc394e9ab6f3f95,
    definitionSchemaPart_b7c657c9941f2562,
    definitionSchemaPart_155a7195be4ae575,
    definitionSchemaPart_196bb180717989ae,
    definitionSchemaPart_e47e7f9ee97a351e,
    definitionSchemaPart_5f75297a24c6c61a,
    definitionSchemaPart_98ba8181248ba0e4,
    definitionSchemaPart_04b2bfb7798581bc,
    definitionSchemaPart_e23b7eec38fb4d16,
    definitionSchemaPart_428b72851e6fc237,
    definitionSchemaPart_80a2746311290620,
    definitionSchemaPart_7de34468308875eb,
    definitionSchemaPart_a095b18574bd375c,
    definitionSchemaPart_66781cf7cffe07d6,
    definitionSchemaPart_f596bd52e7a1f065,
    definitionSchemaPart_f2b71ea148e2ee3a,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterComboPending'],
          semantics: { type: '"casterComboPending"' },
          source: ['packages/game-data-contract/src/conditions.ts:391:7'],
          description: '施放者的原生连携候选列表非空；不检查冷却、队首、当前技能或可释放性。',
        },
      },
      semantics: { type: '{ kind: "casterComboPending"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventComboRingQteSucceeded'],
          semantics: { type: '"eventComboRingQteSucceeded"' },
          source: ['packages/game-data-contract/src/conditions.ts:395:7'],
          description: '当前 beforeCastSkill 对应的连携输入命中了 ShowComboRingQte 有效阶段。',
        },
      },
      semantics: { type: '{ kind: "eventComboRingQteSucceeded"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_e8c2e40dbfc2534d,
    definitionSchemaPart_87892a7c5309ca3d,
    definitionSchemaPart_b0571cc12aa7daaa,
    definitionSchemaPart_638465f6819dd1c7,
    definitionSchemaPart_a495d1a2e51c106b,
    definitionSchemaPart_4b34ed2b6a5c6e3f,
    definitionSchemaPart_f7e3b1e446629aa6,
    definitionSchemaPart_52f63ca1173279e3,
    definitionSchemaPart_dac4ee70f9a88636,
    definitionSchemaPart_ecaca49213d60b25,
    definitionSchemaPart_2385b8d31e0aa7b4,
    definitionSchemaPart_1561385c78315161,
    definitionSchemaPart_f27e7d41acc5fd16,
    definitionSchemaPart_16ea8542c7ed224a,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSkillCastMatchesBuffSource'],
          semantics: { type: '"eventSkillCastMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:504:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSkillCastMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_2a63a5498f597e91,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventBuffEndedEarly'],
          semantics: { type: '"eventBuffEndedEarly"' },
          source: ['packages/game-data-contract/src/conditions.ts:517:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventBuffEndedEarly"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_7f8f1c538b7d3f76,
    definitionSchemaPart_21c1bcbf2389b349,
    definitionSchemaPart_fe0fcf888628b50e,
    definitionSchemaPart_fef55e2bf38f4f88,
    definitionSchemaPart_813d6470048d173b,
    definitionSchemaPart_c4439a31d39c3d8c,
    definitionSchemaPart_d0d3d3764920669a,
    definitionSchemaPart_c103184483264681,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSource'],
          semantics: { type: '"eventSourceMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:592:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSourceEntitySource'],
          semantics: { type: '"eventSourceMatchesBuffSourceEntitySource"' },
          source: ['packages/game-data-contract/src/conditions.ts:597:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSourceEntitySource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceControlled'],
          semantics: { type: '"eventSourceControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:602:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffSourceMatchesOwner'],
          semantics: { type: '"buffSourceMatchesOwner"' },
          source: ['packages/game-data-contract/src/conditions.ts:607:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "buffSourceMatchesOwner"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_39b86d5efce8b9ec,
    definitionSchemaPart_53b47b91f4806984,
    definitionSchemaPart_e5c6f48eda975862,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['not'],
          semantics: { type: '"not"' },
          source: ['packages/game-data-contract/src/conditions.ts:635:7'],
          description: '对一个子条件的结果取反。',
        },
        condition: {
          kind: 'ref',
          ref: 'field_c3a7d4d96f89e1fc27f5',
          semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
          source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          inlineCondition: 'equipment',
          description: '要取反的条件。',
        },
      },
      semantics: { type: '{ kind: "not"; condition: CombatCondition; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_8a0bfc51dc8b8f9e,
    definitionSchemaPart_aa650c481a95f04e,
    definitionSchemaPart_f85a621bb793bfcd,
  ],
  semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
  inlineCondition: 'equipment',
} as const;
const definitionSchemaPart_86c37b6e507abdca = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:53:7'],
          description: '直接返回固定真假值。',
        },
        value: {
          kind: 'boolean',
          semantics: { type: 'boolean' },
          source: ['packages/game-data-contract/src/conditions.ts:55:7'],
          description: '条件结果。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: boolean; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['combatActive'],
          semantics: { type: '"combatActive"' },
          source: ['packages/game-data-contract/src/conditions.ts:60:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "combatActive"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['singleEnemyPresent'],
          semantics: { type: '"singleEnemyPresent"' },
          source: ['packages/game-data-contract/src/conditions.ts:65:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "singleEnemyPresent"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:70:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_18e490990e3075bc,
    definitionSchemaPart_625b0402290cb27a,
    definitionSchemaPart_d6c123cf208c03ab,
    definitionSchemaPart_706b73a345ad7cbe,
    definitionSchemaPart_8d3a111db3eb9b5f,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['skillBranchEnabled'],
          semantics: { type: '"skillBranchEnabled"' },
          source: ['packages/game-data-contract/src/conditions.ts:115:7'],
          description: '检查构筑是否启用了一个技能动作分支。',
        },
        branchKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/conditions.ts:117:7'],
          description: '要检查的分支键。',
        },
      },
      semantics: { type: '{ kind: "skillBranchEnabled"; branchKey: string; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_647ddee0655d2d96,
    definitionSchemaPart_a51b87e9e8fd7360,
    definitionSchemaPart_0f83c615df092432,
    definitionSchemaPart_f21ae48f947f1ce0,
    definitionSchemaPart_2453df203d8c5f8b,
    definitionSchemaPart_6f93ca23080138eb,
    definitionSchemaPart_5b0017e1b1f57e1f,
    definitionSchemaPart_e21c32779f30aa39,
    definitionSchemaPart_0cc394e9ab6f3f95,
    definitionSchemaPart_b7c657c9941f2562,
    definitionSchemaPart_155a7195be4ae575,
    definitionSchemaPart_196bb180717989ae,
    definitionSchemaPart_e47e7f9ee97a351e,
    definitionSchemaPart_5f75297a24c6c61a,
    definitionSchemaPart_98ba8181248ba0e4,
    definitionSchemaPart_1b33ba474e0a1868,
    definitionSchemaPart_6f6afdf31461bd48,
    definitionSchemaPart_428b72851e6fc237,
    definitionSchemaPart_c49f7fdcc6f97ed2,
    definitionSchemaPart_dde63430205060a6,
    definitionSchemaPart_a11a6ed6723f0568,
    definitionSchemaPart_66781cf7cffe07d6,
    definitionSchemaPart_d02b95b37b93a829,
    definitionSchemaPart_f2b71ea148e2ee3a,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterComboPending'],
          semantics: { type: '"casterComboPending"' },
          source: ['packages/game-data-contract/src/conditions.ts:391:7'],
          description: '施放者的原生连携候选列表非空；不检查冷却、队首、当前技能或可释放性。',
        },
      },
      semantics: { type: '{ kind: "casterComboPending"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventComboRingQteSucceeded'],
          semantics: { type: '"eventComboRingQteSucceeded"' },
          source: ['packages/game-data-contract/src/conditions.ts:395:7'],
          description: '当前 beforeCastSkill 对应的连携输入命中了 ShowComboRingQte 有效阶段。',
        },
      },
      semantics: { type: '{ kind: "eventComboRingQteSucceeded"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_e8c2e40dbfc2534d,
    definitionSchemaPart_87892a7c5309ca3d,
    definitionSchemaPart_b0571cc12aa7daaa,
    definitionSchemaPart_638465f6819dd1c7,
    definitionSchemaPart_a495d1a2e51c106b,
    definitionSchemaPart_4b34ed2b6a5c6e3f,
    definitionSchemaPart_f7e3b1e446629aa6,
    definitionSchemaPart_52f63ca1173279e3,
    definitionSchemaPart_dac4ee70f9a88636,
    definitionSchemaPart_ecaca49213d60b25,
    definitionSchemaPart_2385b8d31e0aa7b4,
    definitionSchemaPart_1561385c78315161,
    definitionSchemaPart_f27e7d41acc5fd16,
    definitionSchemaPart_16ea8542c7ed224a,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSkillCastMatchesBuffSource'],
          semantics: { type: '"eventSkillCastMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:504:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSkillCastMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_2a63a5498f597e91,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventBuffEndedEarly'],
          semantics: { type: '"eventBuffEndedEarly"' },
          source: ['packages/game-data-contract/src/conditions.ts:517:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventBuffEndedEarly"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_7f8f1c538b7d3f76,
    definitionSchemaPart_27e6be0d71f07b08,
    definitionSchemaPart_fe0fcf888628b50e,
    definitionSchemaPart_fef55e2bf38f4f88,
    definitionSchemaPart_36a4a7cebbc59019,
    definitionSchemaPart_c4439a31d39c3d8c,
    definitionSchemaPart_d0d3d3764920669a,
    definitionSchemaPart_c103184483264681,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSource'],
          semantics: { type: '"eventSourceMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:592:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSourceEntitySource'],
          semantics: { type: '"eventSourceMatchesBuffSourceEntitySource"' },
          source: ['packages/game-data-contract/src/conditions.ts:597:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSourceEntitySource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceControlled'],
          semantics: { type: '"eventSourceControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:602:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffSourceMatchesOwner'],
          semantics: { type: '"buffSourceMatchesOwner"' },
          source: ['packages/game-data-contract/src/conditions.ts:607:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "buffSourceMatchesOwner"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_39b86d5efce8b9ec,
    definitionSchemaPart_53b47b91f4806984,
    definitionSchemaPart_e5c6f48eda975862,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['not'],
          semantics: { type: '"not"' },
          source: ['packages/game-data-contract/src/conditions.ts:635:7'],
          description: '对一个子条件的结果取反。',
        },
        condition: {
          kind: 'ref',
          ref: 'field_06572a068b9551ab9c57',
          semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
          source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          inlineCondition: 'skillSwitch',
          description: '要取反的条件。',
        },
      },
      semantics: { type: '{ kind: "not"; condition: CombatCondition; }' },
      source: ['packages/game-data-contract/src/conditions.ts:643:7'],
    },
    definitionSchemaPart_59077461a34f2eb2,
    definitionSchemaPart_06336561b70c44b5,
    definitionSchemaPart_f85a621bb793bfcd,
  ],
  semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
  inlineCondition: 'skillSwitch',
} as const;
const definitionSchemaPart_76c36c7b555bce99 = {
  kind: 'array',
  element: definitionSchemaPart_26d962aa020f4813,
  semantics: {
    type: 'readonly CombatCondition[]',
    arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
} as const;
const definitionSchemaPart_5ce6cb4baad36b85 = {
  kind: 'array',
  element: definitionSchemaPart_26d962aa020f4813,
  semantics: {
    type: 'readonly CombatCondition[]',
    arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
  description: '需要同时成立的条件。',
} as const;
const definitionSchemaPart_e2b71c99ced7526f = {
  kind: 'array',
  element: definitionSchemaPart_86c37b6e507abdca,
  semantics: {
    type: 'readonly CombatCondition[]',
    arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
  },
  source: ['packages/game-data-contract/src/conditions.ts:643:7'],
  description: '需要同时成立的条件。',
} as const;
const definitionSchemaPart_98665f4d16f268a3 = {
  kind: {
    kind: 'enum',
    options: ['all'],
    semantics: { type: '"all"' },
    source: ['packages/game-data-contract/src/conditions.ts:641:7'],
    description: '所有子条件都成立时返回真。',
  },
  conditions: definitionSchemaPart_5ce6cb4baad36b85,
} as const;
const definitionSchemaPart_e3fee683de82465a = {
  kind: {
    kind: 'enum',
    options: ['all'],
    semantics: { type: '"all"' },
    source: ['packages/game-data-contract/src/conditions.ts:641:7'],
    description: '所有子条件都成立时返回真。',
  },
  conditions: definitionSchemaPart_e2b71c99ced7526f,
} as const;
const definitionSchemaPart_5b7739f27c7bfac6 = {
  kind: 'object',
  fields: definitionSchemaPart_98665f4d16f268a3,
  semantics: { type: '{ kind: "all"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_6ed69438a41ef220 = {
  kind: 'object',
  fields: definitionSchemaPart_98665f4d16f268a3,
  semantics: { type: '{ kind: "all"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_c43335936baa5f53 = {
  kind: 'object',
  fields: definitionSchemaPart_e3fee683de82465a,
  semantics: { type: '{ kind: "all"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_8709422e1bd0eeef = {
  kind: 'object',
  fields: definitionSchemaPart_e3fee683de82465a,
  semantics: { type: '{ kind: "all"; conditions: readonly CombatCondition[]; }' },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
} as const;
const definitionSchemaPart_cf306d39e7be40aa = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:53:7'],
          description: '直接返回固定真假值。',
        },
        value: {
          kind: 'boolean',
          semantics: { type: 'boolean' },
          source: ['packages/game-data-contract/src/conditions.ts:55:7'],
          description: '条件结果。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: boolean; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['combatActive'],
          semantics: { type: '"combatActive"' },
          source: ['packages/game-data-contract/src/conditions.ts:60:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "combatActive"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['singleEnemyPresent'],
          semantics: { type: '"singleEnemyPresent"' },
          source: ['packages/game-data-contract/src/conditions.ts:65:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "singleEnemyPresent"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:70:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_f3d3e22b83af6376,
    definitionSchemaPart_c347e818f2b24603,
    definitionSchemaPart_64714dce6e9dea33,
    definitionSchemaPart_5139519e85fdbbac,
    definitionSchemaPart_53cdbdcc69e4e495,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['skillBranchEnabled'],
          semantics: { type: '"skillBranchEnabled"' },
          source: ['packages/game-data-contract/src/conditions.ts:115:7'],
          description: '检查构筑是否启用了一个技能动作分支。',
        },
        branchKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/conditions.ts:117:7'],
          description: '要检查的分支键。',
        },
      },
      semantics: { type: '{ kind: "skillBranchEnabled"; branchKey: string; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_17a4638d4c7b1720,
    definitionSchemaPart_78359c9b5d7d1818,
    definitionSchemaPart_46ee76e8c5756a41,
    definitionSchemaPart_320a627b2062aa19,
    definitionSchemaPart_460707439f893ac2,
    definitionSchemaPart_aef8485ab5968353,
    definitionSchemaPart_7574a6b0ba20f84f,
    definitionSchemaPart_23e37562453e9c52,
    definitionSchemaPart_b869624d7946aa42,
    definitionSchemaPart_540dc6942716dea8,
    definitionSchemaPart_ade0487d8eb165f5,
    definitionSchemaPart_27be370aacfa2b0d,
    definitionSchemaPart_ecdb54c187a7c946,
    definitionSchemaPart_6887c63c427ab746,
    definitionSchemaPart_d157a4e4e9bce79c,
    definitionSchemaPart_5875284b14776c57,
    definitionSchemaPart_4b2cdde5e5b4d60e,
    definitionSchemaPart_03d64d69050b442c,
    definitionSchemaPart_67b4ff7bf1fff9bd,
    definitionSchemaPart_d468b7eca9586475,
    definitionSchemaPart_c84992fe0caabfc3,
    definitionSchemaPart_5093ce3deeda4e4d,
    definitionSchemaPart_e1189d6d5514443d,
    definitionSchemaPart_e21f4ca3f156e7ea,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterComboPending'],
          semantics: { type: '"casterComboPending"' },
          source: ['packages/game-data-contract/src/conditions.ts:391:7'],
          description: '施放者的原生连携候选列表非空；不检查冷却、队首、当前技能或可释放性。',
        },
      },
      semantics: { type: '{ kind: "casterComboPending"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventComboRingQteSucceeded'],
          semantics: { type: '"eventComboRingQteSucceeded"' },
          source: ['packages/game-data-contract/src/conditions.ts:395:7'],
          description: '当前 beforeCastSkill 对应的连携输入命中了 ShowComboRingQte 有效阶段。',
        },
      },
      semantics: { type: '{ kind: "eventComboRingQteSucceeded"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_28ae51a31e1bb521,
    definitionSchemaPart_9fc068952444ca9c,
    definitionSchemaPart_7c303b14b561bb06,
    definitionSchemaPart_a1aa30c2581a32b3,
    definitionSchemaPart_1cb5104bda53fd85,
    definitionSchemaPart_05b2da07e173f2b6,
    definitionSchemaPart_0f71d14a197655e1,
    definitionSchemaPart_5e05a4441422f9ee,
    definitionSchemaPart_d1aa59fa5029b929,
    definitionSchemaPart_68a690c2e76ee655,
    definitionSchemaPart_ed81cd713d5fcdbe,
    definitionSchemaPart_def057e70d633df4,
    definitionSchemaPart_b6e3305d3c5055c8,
    definitionSchemaPart_ffb2e1be792124f7,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSkillCastMatchesBuffSource'],
          semantics: { type: '"eventSkillCastMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:504:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSkillCastMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_0ef0e54d0c17f971,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventBuffEndedEarly'],
          semantics: { type: '"eventBuffEndedEarly"' },
          source: ['packages/game-data-contract/src/conditions.ts:517:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventBuffEndedEarly"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_1d43ef999219b4d1,
    definitionSchemaPart_73acaee0ddfc9b45,
    definitionSchemaPart_33a752b85030eab1,
    definitionSchemaPart_6b9fe018960e22f7,
    definitionSchemaPart_e0bcb7e01876454f,
    definitionSchemaPart_75a6edab28565d2b,
    definitionSchemaPart_a5af4620ec4d25f9,
    definitionSchemaPart_e28ec883386c5f9a,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSource'],
          semantics: { type: '"eventSourceMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:592:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSourceEntitySource'],
          semantics: { type: '"eventSourceMatchesBuffSourceEntitySource"' },
          source: ['packages/game-data-contract/src/conditions.ts:597:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSourceEntitySource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceControlled'],
          semantics: { type: '"eventSourceControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:602:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffSourceMatchesOwner'],
          semantics: { type: '"buffSourceMatchesOwner"' },
          source: ['packages/game-data-contract/src/conditions.ts:607:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "buffSourceMatchesOwner"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_0846b9b6ffd20793,
    definitionSchemaPart_d7d2d35220d27b45,
    definitionSchemaPart_87a5396df99c57cb,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['not'],
          semantics: { type: '"not"' },
          source: ['packages/game-data-contract/src/conditions.ts:635:7'],
          description: '对一个子条件的结果取反。',
        },
        condition: {
          kind: 'ref',
          ref: 'field_c3a7d4d96f89e1fc27f5',
          semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
          source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          inlineCondition: 'equipment',
          description: '要取反的条件。',
        },
      },
      semantics: { type: '{ kind: "not"; condition: CombatCondition; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_6ed69438a41ef220,
    definitionSchemaPart_e87d42791ca0c5f3,
    definitionSchemaPart_a9969f150a6b04c9,
  ],
  semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
  inlineCondition: 'equipment',
} as const;
const definitionSchemaPart_a67871934141b9ca = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:53:7'],
          description: '直接返回固定真假值。',
        },
        value: {
          kind: 'boolean',
          semantics: { type: 'boolean' },
          source: ['packages/game-data-contract/src/conditions.ts:55:7'],
          description: '条件结果。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: boolean; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['combatActive'],
          semantics: { type: '"combatActive"' },
          source: ['packages/game-data-contract/src/conditions.ts:60:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "combatActive"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['singleEnemyPresent'],
          semantics: { type: '"singleEnemyPresent"' },
          source: ['packages/game-data-contract/src/conditions.ts:65:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "singleEnemyPresent"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:70:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_f3d3e22b83af6376,
    definitionSchemaPart_c347e818f2b24603,
    definitionSchemaPart_64714dce6e9dea33,
    definitionSchemaPart_5139519e85fdbbac,
    definitionSchemaPart_53cdbdcc69e4e495,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['skillBranchEnabled'],
          semantics: { type: '"skillBranchEnabled"' },
          source: ['packages/game-data-contract/src/conditions.ts:115:7'],
          description: '检查构筑是否启用了一个技能动作分支。',
        },
        branchKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/conditions.ts:117:7'],
          description: '要检查的分支键。',
        },
      },
      semantics: { type: '{ kind: "skillBranchEnabled"; branchKey: string; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_17a4638d4c7b1720,
    definitionSchemaPart_78359c9b5d7d1818,
    definitionSchemaPart_46ee76e8c5756a41,
    definitionSchemaPart_320a627b2062aa19,
    definitionSchemaPart_460707439f893ac2,
    definitionSchemaPart_aef8485ab5968353,
    definitionSchemaPart_7574a6b0ba20f84f,
    definitionSchemaPart_23e37562453e9c52,
    definitionSchemaPart_b869624d7946aa42,
    definitionSchemaPart_540dc6942716dea8,
    definitionSchemaPart_ade0487d8eb165f5,
    definitionSchemaPart_27be370aacfa2b0d,
    definitionSchemaPart_ecdb54c187a7c946,
    definitionSchemaPart_6887c63c427ab746,
    definitionSchemaPart_d157a4e4e9bce79c,
    definitionSchemaPart_5875284b14776c57,
    definitionSchemaPart_4b2cdde5e5b4d60e,
    definitionSchemaPart_03d64d69050b442c,
    definitionSchemaPart_67b4ff7bf1fff9bd,
    definitionSchemaPart_d468b7eca9586475,
    definitionSchemaPart_c84992fe0caabfc3,
    definitionSchemaPart_5093ce3deeda4e4d,
    definitionSchemaPart_e1189d6d5514443d,
    definitionSchemaPart_e21f4ca3f156e7ea,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterComboPending'],
          semantics: { type: '"casterComboPending"' },
          source: ['packages/game-data-contract/src/conditions.ts:391:7'],
          description: '施放者的原生连携候选列表非空；不检查冷却、队首、当前技能或可释放性。',
        },
      },
      semantics: { type: '{ kind: "casterComboPending"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventComboRingQteSucceeded'],
          semantics: { type: '"eventComboRingQteSucceeded"' },
          source: ['packages/game-data-contract/src/conditions.ts:395:7'],
          description: '当前 beforeCastSkill 对应的连携输入命中了 ShowComboRingQte 有效阶段。',
        },
      },
      semantics: { type: '{ kind: "eventComboRingQteSucceeded"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_28ae51a31e1bb521,
    definitionSchemaPart_9fc068952444ca9c,
    definitionSchemaPart_7c303b14b561bb06,
    definitionSchemaPart_a1aa30c2581a32b3,
    definitionSchemaPart_1cb5104bda53fd85,
    definitionSchemaPart_05b2da07e173f2b6,
    definitionSchemaPart_0f71d14a197655e1,
    definitionSchemaPart_5e05a4441422f9ee,
    definitionSchemaPart_d1aa59fa5029b929,
    definitionSchemaPart_68a690c2e76ee655,
    definitionSchemaPart_ed81cd713d5fcdbe,
    definitionSchemaPart_def057e70d633df4,
    definitionSchemaPart_b6e3305d3c5055c8,
    definitionSchemaPart_ffb2e1be792124f7,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSkillCastMatchesBuffSource'],
          semantics: { type: '"eventSkillCastMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:504:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSkillCastMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_0ef0e54d0c17f971,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventBuffEndedEarly'],
          semantics: { type: '"eventBuffEndedEarly"' },
          source: ['packages/game-data-contract/src/conditions.ts:517:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventBuffEndedEarly"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_1d43ef999219b4d1,
    definitionSchemaPart_73acaee0ddfc9b45,
    definitionSchemaPart_33a752b85030eab1,
    definitionSchemaPart_6b9fe018960e22f7,
    definitionSchemaPart_e0bcb7e01876454f,
    definitionSchemaPart_75a6edab28565d2b,
    definitionSchemaPart_a5af4620ec4d25f9,
    definitionSchemaPart_e28ec883386c5f9a,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSource'],
          semantics: { type: '"eventSourceMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:592:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSourceEntitySource'],
          semantics: { type: '"eventSourceMatchesBuffSourceEntitySource"' },
          source: ['packages/game-data-contract/src/conditions.ts:597:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSourceEntitySource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceControlled'],
          semantics: { type: '"eventSourceControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:602:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffSourceMatchesOwner'],
          semantics: { type: '"buffSourceMatchesOwner"' },
          source: ['packages/game-data-contract/src/conditions.ts:607:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "buffSourceMatchesOwner"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_0846b9b6ffd20793,
    definitionSchemaPart_d7d2d35220d27b45,
    definitionSchemaPart_87a5396df99c57cb,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['not'],
          semantics: { type: '"not"' },
          source: ['packages/game-data-contract/src/conditions.ts:635:7'],
          description: '对一个子条件的结果取反。',
        },
        condition: {
          kind: 'ref',
          ref: 'field_c3a7d4d96f89e1fc27f5',
          semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
          source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          inlineCondition: 'equipment',
          description: '要取反的条件。',
        },
      },
      semantics: { type: '{ kind: "not"; condition: CombatCondition; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_6ed69438a41ef220,
    definitionSchemaPart_e87d42791ca0c5f3,
    definitionSchemaPart_a9969f150a6b04c9,
  ],
  semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
  inlineCondition: 'equipment',
  description: '要取反的条件。',
} as const;
const definitionSchemaPart_a153cfcd20422dcf = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:53:7'],
          description: '直接返回固定真假值。',
        },
        value: {
          kind: 'boolean',
          semantics: { type: 'boolean' },
          source: ['packages/game-data-contract/src/conditions.ts:55:7'],
          description: '条件结果。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: boolean; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['combatActive'],
          semantics: { type: '"combatActive"' },
          source: ['packages/game-data-contract/src/conditions.ts:60:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "combatActive"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['singleEnemyPresent'],
          semantics: { type: '"singleEnemyPresent"' },
          source: ['packages/game-data-contract/src/conditions.ts:65:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "singleEnemyPresent"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:70:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_f3d3e22b83af6376,
    definitionSchemaPart_c347e818f2b24603,
    definitionSchemaPart_64714dce6e9dea33,
    definitionSchemaPart_03b432aa4b84d3fd,
    definitionSchemaPart_e9f06312c4b12587,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['skillBranchEnabled'],
          semantics: { type: '"skillBranchEnabled"' },
          source: ['packages/game-data-contract/src/conditions.ts:115:7'],
          description: '检查构筑是否启用了一个技能动作分支。',
        },
        branchKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/conditions.ts:117:7'],
          description: '要检查的分支键。',
        },
      },
      semantics: { type: '{ kind: "skillBranchEnabled"; branchKey: string; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_17a4638d4c7b1720,
    definitionSchemaPart_3db0d33ee847f1a9,
    definitionSchemaPart_40b2ffc117c21ba3,
    definitionSchemaPart_320a627b2062aa19,
    definitionSchemaPart_9a6b855afa39ee80,
    definitionSchemaPart_c8fdebee4f75975a,
    definitionSchemaPart_e839a7d0a5bf08e1,
    definitionSchemaPart_23e37562453e9c52,
    definitionSchemaPart_b869624d7946aa42,
    definitionSchemaPart_540dc6942716dea8,
    definitionSchemaPart_ade0487d8eb165f5,
    definitionSchemaPart_27be370aacfa2b0d,
    definitionSchemaPart_ecdb54c187a7c946,
    definitionSchemaPart_6887c63c427ab746,
    definitionSchemaPart_d157a4e4e9bce79c,
    definitionSchemaPart_2a6248cf0078c48f,
    definitionSchemaPart_812630c526d0b6fa,
    definitionSchemaPart_03d64d69050b442c,
    definitionSchemaPart_82f4890ec9815057,
    definitionSchemaPart_1a77aac8f3ba14e5,
    definitionSchemaPart_b8484be0ae2d7658,
    definitionSchemaPart_5093ce3deeda4e4d,
    definitionSchemaPart_31b62063343999e9,
    definitionSchemaPart_e21f4ca3f156e7ea,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterComboPending'],
          semantics: { type: '"casterComboPending"' },
          source: ['packages/game-data-contract/src/conditions.ts:391:7'],
          description: '施放者的原生连携候选列表非空；不检查冷却、队首、当前技能或可释放性。',
        },
      },
      semantics: { type: '{ kind: "casterComboPending"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventComboRingQteSucceeded'],
          semantics: { type: '"eventComboRingQteSucceeded"' },
          source: ['packages/game-data-contract/src/conditions.ts:395:7'],
          description: '当前 beforeCastSkill 对应的连携输入命中了 ShowComboRingQte 有效阶段。',
        },
      },
      semantics: { type: '{ kind: "eventComboRingQteSucceeded"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_28ae51a31e1bb521,
    definitionSchemaPart_9fc068952444ca9c,
    definitionSchemaPart_7c303b14b561bb06,
    definitionSchemaPart_a1aa30c2581a32b3,
    definitionSchemaPart_1cb5104bda53fd85,
    definitionSchemaPart_05b2da07e173f2b6,
    definitionSchemaPart_0f71d14a197655e1,
    definitionSchemaPart_5e05a4441422f9ee,
    definitionSchemaPart_d1aa59fa5029b929,
    definitionSchemaPart_68a690c2e76ee655,
    definitionSchemaPart_ed81cd713d5fcdbe,
    definitionSchemaPart_def057e70d633df4,
    definitionSchemaPart_b6e3305d3c5055c8,
    definitionSchemaPart_ffb2e1be792124f7,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSkillCastMatchesBuffSource'],
          semantics: { type: '"eventSkillCastMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:504:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSkillCastMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_0ef0e54d0c17f971,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventBuffEndedEarly'],
          semantics: { type: '"eventBuffEndedEarly"' },
          source: ['packages/game-data-contract/src/conditions.ts:517:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventBuffEndedEarly"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_1d43ef999219b4d1,
    definitionSchemaPart_bb9b36214b3a8a7a,
    definitionSchemaPart_33a752b85030eab1,
    definitionSchemaPart_6b9fe018960e22f7,
    definitionSchemaPart_9719873e95f240b2,
    definitionSchemaPart_75a6edab28565d2b,
    definitionSchemaPart_a5af4620ec4d25f9,
    definitionSchemaPart_e28ec883386c5f9a,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSource'],
          semantics: { type: '"eventSourceMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:592:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSourceEntitySource'],
          semantics: { type: '"eventSourceMatchesBuffSourceEntitySource"' },
          source: ['packages/game-data-contract/src/conditions.ts:597:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSourceEntitySource"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceControlled'],
          semantics: { type: '"eventSourceControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:602:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceControlled"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffSourceMatchesOwner'],
          semantics: { type: '"buffSourceMatchesOwner"' },
          source: ['packages/game-data-contract/src/conditions.ts:607:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "buffSourceMatchesOwner"; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_0846b9b6ffd20793,
    definitionSchemaPart_d7d2d35220d27b45,
    definitionSchemaPart_87a5396df99c57cb,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['not'],
          semantics: { type: '"not"' },
          source: ['packages/game-data-contract/src/conditions.ts:635:7'],
          description: '对一个子条件的结果取反。',
        },
        condition: {
          kind: 'ref',
          ref: 'field_06572a068b9551ab9c57',
          semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
          source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          inlineCondition: 'skillSwitch',
          description: '要取反的条件。',
        },
      },
      semantics: { type: '{ kind: "not"; condition: CombatCondition; }' },
      source: ['packages/game-data-contract/src/conditions.ts:637:7'],
    },
    definitionSchemaPart_8709422e1bd0eeef,
    definitionSchemaPart_02430c2dadaa9b97,
    definitionSchemaPart_a9969f150a6b04c9,
  ],
  semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
  source: ['packages/game-data-contract/src/conditions.ts:637:7'],
  inlineCondition: 'skillSwitch',
  description: '要取反的条件。',
} as const;
const definitionSchemaPart_696bdb46c7d7847d = {
  kind: {
    kind: 'enum',
    options: ['not'],
    semantics: { type: '"not"' },
    source: ['packages/game-data-contract/src/conditions.ts:635:7'],
    description: '对一个子条件的结果取反。',
  },
  condition: definitionSchemaPart_a67871934141b9ca,
} as const;
const definitionSchemaPart_bcde611b90e2bb20 = {
  kind: {
    kind: 'enum',
    options: ['not'],
    semantics: { type: '"not"' },
    source: ['packages/game-data-contract/src/conditions.ts:635:7'],
    description: '对一个子条件的结果取反。',
  },
  condition: definitionSchemaPart_a153cfcd20422dcf,
} as const;
const definitionSchemaPart_06e1a67b39e92124 = {
  kind: 'object',
  fields: definitionSchemaPart_696bdb46c7d7847d,
  semantics: { type: '{ kind: "not"; condition: CombatCondition; }' },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
} as const;
const definitionSchemaPart_0ca49c6b2d260895 = {
  kind: 'object',
  fields: definitionSchemaPart_bcde611b90e2bb20,
  semantics: { type: '{ kind: "not"; condition: CombatCondition; }' },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
} as const;
const definitionSchemaPart_d9d6d8826b5e5ff5 = {
  field_4988e909d5bfdb6e29cf: definitionSchemaPart_49c9cfe8a1326bed,
  field_6c7fb35eae35fc749d01: definitionSchemaPart_76c36c7b555bce99,
  field_c3a7d4d96f89e1fc27f5: definitionSchemaPart_cf306d39e7be40aa,
} as const;
const definitionSchemaPart_50964fe034ab11e1 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:53:7'],
          description: '直接返回固定真假值。',
        },
        value: {
          kind: 'boolean',
          semantics: { type: 'boolean' },
          source: ['packages/game-data-contract/src/conditions.ts:55:7'],
          description: '条件结果。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: boolean; }' },
      source: ['packages/game-data-contract/src/equipment.ts:99:3'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['combatActive'],
          semantics: { type: '"combatActive"' },
          source: ['packages/game-data-contract/src/conditions.ts:60:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "combatActive"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:99:3'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['singleEnemyPresent'],
          semantics: { type: '"singleEnemyPresent"' },
          source: ['packages/game-data-contract/src/conditions.ts:65:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "singleEnemyPresent"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:99:3'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:70:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:99:3'],
    },
    definitionSchemaPart_caba4c0a17a18f52,
    definitionSchemaPart_323009ce3ff86130,
    definitionSchemaPart_565a919d99ffe6df,
    definitionSchemaPart_a154f62b2daf4cc3,
    definitionSchemaPart_43e6f0d1e11980ec,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['skillBranchEnabled'],
          semantics: { type: '"skillBranchEnabled"' },
          source: ['packages/game-data-contract/src/conditions.ts:115:7'],
          description: '检查构筑是否启用了一个技能动作分支。',
        },
        branchKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/conditions.ts:117:7'],
          description: '要检查的分支键。',
        },
      },
      semantics: { type: '{ kind: "skillBranchEnabled"; branchKey: string; }' },
      source: ['packages/game-data-contract/src/equipment.ts:99:3'],
    },
    definitionSchemaPart_b69299d0c5a3f9f2,
    definitionSchemaPart_d21b72f20c5dd444,
    definitionSchemaPart_7e1b0ee8c9c5138f,
    definitionSchemaPart_95e6725f7695668a,
    definitionSchemaPart_e33b34858258e325,
    definitionSchemaPart_60d0967a81264d29,
    definitionSchemaPart_e50510c4b08aa933,
    definitionSchemaPart_3adba4cbba1ce118,
    definitionSchemaPart_2fa7befc176641d7,
    definitionSchemaPart_51c1de754a286004,
    definitionSchemaPart_3a47b8cdcbcf094a,
    definitionSchemaPart_2930a4a7f7d08489,
    definitionSchemaPart_aad9b8bab354d453,
    definitionSchemaPart_5fb9d9672a3b962a,
    definitionSchemaPart_8673add6f23b76ca,
    definitionSchemaPart_55ef2ce3b9334d82,
    definitionSchemaPart_2e3bef9079a5e9d1,
    definitionSchemaPart_a7ee1d65fa32bff8,
    definitionSchemaPart_a422670d313ea69e,
    definitionSchemaPart_8b07ce44afd3f756,
    definitionSchemaPart_42ae7de4a028e406,
    definitionSchemaPart_569fd6ebe2d793cd,
    definitionSchemaPart_d9eda4eff9dfae00,
    definitionSchemaPart_dee0d83832cbb6cd,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterComboPending'],
          semantics: { type: '"casterComboPending"' },
          source: ['packages/game-data-contract/src/conditions.ts:391:7'],
          description: '施放者的原生连携候选列表非空；不检查冷却、队首、当前技能或可释放性。',
        },
      },
      semantics: { type: '{ kind: "casterComboPending"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:99:3'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventComboRingQteSucceeded'],
          semantics: { type: '"eventComboRingQteSucceeded"' },
          source: ['packages/game-data-contract/src/conditions.ts:395:7'],
          description: '当前 beforeCastSkill 对应的连携输入命中了 ShowComboRingQte 有效阶段。',
        },
      },
      semantics: { type: '{ kind: "eventComboRingQteSucceeded"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:99:3'],
    },
    definitionSchemaPart_d802c3b1d746539e,
    definitionSchemaPart_77c2f4af2a43d0c1,
    definitionSchemaPart_5623d4b506f086c9,
    definitionSchemaPart_6b6bdf9973e23a2f,
    definitionSchemaPart_31b9e38a26303bc9,
    definitionSchemaPart_4c14955873fd8aaf,
    definitionSchemaPart_83f4898735b381fe,
    definitionSchemaPart_5064aeb0cca737b4,
    definitionSchemaPart_d4be42c9469da7b2,
    definitionSchemaPart_bef5843c55abe357,
    definitionSchemaPart_2a8e0c8982b89e9b,
    definitionSchemaPart_bca61dd655021ad8,
    definitionSchemaPart_28423147e0254f9c,
    definitionSchemaPart_09221dd013170ec5,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSkillCastMatchesBuffSource'],
          semantics: { type: '"eventSkillCastMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:504:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSkillCastMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:99:3'],
    },
    definitionSchemaPart_49a9c6b38ff16aca,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventBuffEndedEarly'],
          semantics: { type: '"eventBuffEndedEarly"' },
          source: ['packages/game-data-contract/src/conditions.ts:517:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventBuffEndedEarly"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:99:3'],
    },
    definitionSchemaPart_6d0eb99c24079bed,
    definitionSchemaPart_28f8f40d7faccd4f,
    definitionSchemaPart_5f5e02e97e78a1ed,
    definitionSchemaPart_3cda66caa074690e,
    definitionSchemaPart_c7235ab8a0b4d301,
    definitionSchemaPart_ccf294bd5b60115f,
    definitionSchemaPart_9b91a40d0e978282,
    definitionSchemaPart_adb97aeec0e7ba16,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSource'],
          semantics: { type: '"eventSourceMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:592:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:99:3'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSourceEntitySource'],
          semantics: { type: '"eventSourceMatchesBuffSourceEntitySource"' },
          source: ['packages/game-data-contract/src/conditions.ts:597:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSourceEntitySource"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:99:3'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceControlled'],
          semantics: { type: '"eventSourceControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:602:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceControlled"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:99:3'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffSourceMatchesOwner'],
          semantics: { type: '"buffSourceMatchesOwner"' },
          source: ['packages/game-data-contract/src/conditions.ts:607:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "buffSourceMatchesOwner"; }' },
      source: ['packages/game-data-contract/src/equipment.ts:99:3'],
    },
    definitionSchemaPart_b19580ba3ee264ac,
    definitionSchemaPart_49155e7364128b95,
    definitionSchemaPart_63b6f92d67c62db3,
    definitionSchemaPart_06e1a67b39e92124,
    definitionSchemaPart_5b7739f27c7bfac6,
    definitionSchemaPart_328e0da310fb0a77,
    definitionSchemaPart_6da72c005ef05048,
  ],
  semantics: { type: 'CombatCondition | undefined', aliases: ['CombatCondition'], optional: true },
  source: ['packages/game-data-contract/src/equipment.ts:99:3'],
  inlineCondition: 'equipment',
  optional: true,
  description: '事件发生后还需满足的条件。',
} as const;
const definitionSchemaPart_c7c88b3d6f395e14 = {
  kind: 'union',
  variants: [
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['constant'],
          semantics: { type: '"constant"' },
          source: ['packages/game-data-contract/src/conditions.ts:53:7'],
          description: '直接返回固定真假值。',
        },
        value: {
          kind: 'boolean',
          semantics: { type: 'boolean' },
          source: ['packages/game-data-contract/src/conditions.ts:55:7'],
          description: '条件结果。',
        },
      },
      semantics: { type: '{ kind: "constant"; value: boolean; }' },
      source: ['packages/game-data-contract/src/skills.ts:351:5'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['combatActive'],
          semantics: { type: '"combatActive"' },
          source: ['packages/game-data-contract/src/conditions.ts:60:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "combatActive"; }' },
      source: ['packages/game-data-contract/src/skills.ts:351:5'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['singleEnemyPresent'],
          semantics: { type: '"singleEnemyPresent"' },
          source: ['packages/game-data-contract/src/conditions.ts:65:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "singleEnemyPresent"; }' },
      source: ['packages/game-data-contract/src/skills.ts:351:5'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterControlled'],
          semantics: { type: '"casterControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:70:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "casterControlled"; }' },
      source: ['packages/game-data-contract/src/skills.ts:351:5'],
    },
    definitionSchemaPart_9ddeaf4fe10a1786,
    definitionSchemaPart_5bab5ff16fe5ee40,
    definitionSchemaPart_3c9a29b65f5f7699,
    definitionSchemaPart_d90044f141ad6fb2,
    definitionSchemaPart_b1c9759c84db869a,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['skillBranchEnabled'],
          semantics: { type: '"skillBranchEnabled"' },
          source: ['packages/game-data-contract/src/conditions.ts:115:7'],
          description: '检查构筑是否启用了一个技能动作分支。',
        },
        branchKey: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/conditions.ts:117:7'],
          description: '要检查的分支键。',
        },
      },
      semantics: { type: '{ kind: "skillBranchEnabled"; branchKey: string; }' },
      source: ['packages/game-data-contract/src/skills.ts:351:5'],
    },
    definitionSchemaPart_4606fe329b8280af,
    definitionSchemaPart_2d253d12411b3a7d,
    definitionSchemaPart_32a03cd7746d3aa4,
    definitionSchemaPart_eebbbcd20dc6fb35,
    definitionSchemaPart_79f946121aa4dfb2,
    definitionSchemaPart_7392dc8a72388dd8,
    definitionSchemaPart_3e9ad6c058205923,
    definitionSchemaPart_2144add4edcc460a,
    definitionSchemaPart_de1f152d6aed1615,
    definitionSchemaPart_19e1b0e3b00695d7,
    definitionSchemaPart_942ae36952523f5a,
    definitionSchemaPart_ea896d2704643bf2,
    definitionSchemaPart_2237302f2385cf2e,
    definitionSchemaPart_885717c4d445292b,
    definitionSchemaPart_fc28ee29347ef135,
    definitionSchemaPart_35620f5d957e6251,
    definitionSchemaPart_882a407badb531c2,
    definitionSchemaPart_5df3dba05d39ed46,
    definitionSchemaPart_13355c6469532970,
    definitionSchemaPart_40495ad9eafaf760,
    definitionSchemaPart_5944cbfca8f3d24f,
    definitionSchemaPart_172a77c9c4f0e27b,
    definitionSchemaPart_83dd2707c331e73a,
    definitionSchemaPart_f2f764024e57216e,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['casterComboPending'],
          semantics: { type: '"casterComboPending"' },
          source: ['packages/game-data-contract/src/conditions.ts:391:7'],
          description: '施放者的原生连携候选列表非空；不检查冷却、队首、当前技能或可释放性。',
        },
      },
      semantics: { type: '{ kind: "casterComboPending"; }' },
      source: ['packages/game-data-contract/src/skills.ts:351:5'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventComboRingQteSucceeded'],
          semantics: { type: '"eventComboRingQteSucceeded"' },
          source: ['packages/game-data-contract/src/conditions.ts:395:7'],
          description: '当前 beforeCastSkill 对应的连携输入命中了 ShowComboRingQte 有效阶段。',
        },
      },
      semantics: { type: '{ kind: "eventComboRingQteSucceeded"; }' },
      source: ['packages/game-data-contract/src/skills.ts:351:5'],
    },
    definitionSchemaPart_46e6262693dc28b8,
    definitionSchemaPart_62fa1d1f3b9cbc0c,
    definitionSchemaPart_dbdd46636d538a26,
    definitionSchemaPart_6bb7c622c898d944,
    definitionSchemaPart_ccc4655399bf0c90,
    definitionSchemaPart_f509896dc96d0063,
    definitionSchemaPart_446fe634a3ae09de,
    definitionSchemaPart_70d26d22d734d888,
    definitionSchemaPart_716251358458e793,
    definitionSchemaPart_adf7820c644c053f,
    definitionSchemaPart_fa6b9d1bf658e283,
    definitionSchemaPart_0e8b34e8eb67ad25,
    definitionSchemaPart_90ef36357d8944fa,
    definitionSchemaPart_fc8cff68f66bf7ae,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSkillCastMatchesBuffSource'],
          semantics: { type: '"eventSkillCastMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:504:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSkillCastMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/skills.ts:351:5'],
    },
    definitionSchemaPart_95b1358b863778a7,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventBuffEndedEarly'],
          semantics: { type: '"eventBuffEndedEarly"' },
          source: ['packages/game-data-contract/src/conditions.ts:517:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventBuffEndedEarly"; }' },
      source: ['packages/game-data-contract/src/skills.ts:351:5'],
    },
    definitionSchemaPart_503c70aa38a27c16,
    definitionSchemaPart_675e4a342c7793c2,
    definitionSchemaPart_056300eb7a3f0a9c,
    definitionSchemaPart_d18691cd422ae105,
    definitionSchemaPart_fbbcd055ec442051,
    definitionSchemaPart_7bc1a7f48cadb9c8,
    definitionSchemaPart_248535706813b39d,
    definitionSchemaPart_7bbeadd68c18d661,
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSource'],
          semantics: { type: '"eventSourceMatchesBuffSource"' },
          source: ['packages/game-data-contract/src/conditions.ts:592:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSource"; }' },
      source: ['packages/game-data-contract/src/skills.ts:351:5'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceMatchesBuffSourceEntitySource'],
          semantics: { type: '"eventSourceMatchesBuffSourceEntitySource"' },
          source: ['packages/game-data-contract/src/conditions.ts:597:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceMatchesBuffSourceEntitySource"; }' },
      source: ['packages/game-data-contract/src/skills.ts:351:5'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['eventSourceControlled'],
          semantics: { type: '"eventSourceControlled"' },
          source: ['packages/game-data-contract/src/conditions.ts:602:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "eventSourceControlled"; }' },
      source: ['packages/game-data-contract/src/skills.ts:351:5'],
    },
    {
      kind: 'object',
      fields: {
        kind: {
          kind: 'enum',
          options: ['buffSourceMatchesOwner'],
          semantics: { type: '"buffSourceMatchesOwner"' },
          source: ['packages/game-data-contract/src/conditions.ts:607:7'],
          description: '条件种类判别值。',
        },
      },
      semantics: { type: '{ kind: "buffSourceMatchesOwner"; }' },
      source: ['packages/game-data-contract/src/skills.ts:351:5'],
    },
    definitionSchemaPart_9dc9d3e55bb9aac9,
    definitionSchemaPart_731e5b36ad12b09e,
    definitionSchemaPart_b8a3a0fe97ccf24d,
    definitionSchemaPart_0ca49c6b2d260895,
    definitionSchemaPart_c43335936baa5f53,
    definitionSchemaPart_c6084c9d614649d6,
    definitionSchemaPart_c84099fda229288d,
  ],
  semantics: { type: 'CombatCondition | undefined', aliases: ['CombatCondition'], optional: true },
  source: ['packages/game-data-contract/src/skills.ts:351:5'],
  inlineCondition: 'skillSwitch',
  optional: true,
  description: '候选技能自身需要满足的条件。',
} as const;
const definitionSchemaPart_cd0121402d6129a3 = {
  currentSkillTypes: definitionSchemaPart_1ca96bfc1c038220,
  requiresCurrentSkillNotInterruptible: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/skills.ts:349:5'],
    optional: true,
    description: '是否要求当前技能仍处于不可中断阶段。',
  },
  condition: definitionSchemaPart_c7c88b3d6f395e14,
  asSkillCast: {
    kind: 'boolean',
    semantics: { type: 'boolean | undefined', optional: true },
    source: ['packages/game-data-contract/src/skills.ts:353:5'],
    optional: true,
    description: '是否仍发布完整的技能施放事件。',
  },
  sequence: {
    kind: 'opaque',
    fallback: { reason: 'graph-reference-boundary' },
    semantics: { type: 'ActionGraphReference', aliases: ['ActionGraphReference'] },
    source: ['packages/game-data-contract/src/skills.ts:355:5'],
    description: '命中旁路后直接执行的动作序列。',
  },
} as const;
const definitionSchemaPart_eb921d544537e068 = {
  key: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/equipment.ts:95:3'],
    description: '响应在同一装备定义中的唯一名称。',
  },
  priority: {
    kind: 'number',
    semantics: { type: 'number | undefined', optional: true },
    source: ['packages/game-data-contract/src/equipment.ts:97:3'],
    optional: true,
    description: '原生数据动作优先级；同级按定义中的注册顺序执行。',
  },
  condition: definitionSchemaPart_50964fe034ab11e1,
  sequence: {
    kind: 'opaque',
    fallback: { reason: 'graph-reference-boundary' },
    semantics: { type: 'ActionGraphReference', aliases: ['ActionGraphReference'] },
    source: ['packages/game-data-contract/src/equipment.ts:101:3'],
    description: '条件成立时执行的动作序列。',
  },
  event: {
    kind: 'opaque',
    fallback: { reason: 'no-present-type' },
    semantics: { type: 'undefined' },
    source: ['packages/game-data-contract/src/equipment.ts:115:9'],
    optional: true,
    description: '使用能力事件时不能同时监听语义战斗事件。',
  },
  abilityEvent: definitionSchemaPart_30e779885a60386e,
} as const;
const definitionSchemaPart_52f9076101546f18 = {
  kind: 'object',
  fields: definitionSchemaPart_eb921d544537e068,
  semantics: {
    type: 'EquipmentEventHandlerDefinitionBase & { readonly event?: undefined; readonly abilityEvent: "enterFight" | "beforeOutputDamage" | "beforeOutputPhysicalInfliction" | ... 12 more ... | "skillSpGained"; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:130:3'],
} as const;
const definitionSchemaPart_e74deb4f5fb767d5 = {
  kind: 'object',
  fields: definitionSchemaPart_cd0121402d6129a3,
  semantics: {
    type: '{ readonly currentSkillTypes?: readonly ("comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher" | "dodge")[] | undefined; readonly requiresCurrentSkillNotInterruptible?: boolean | undefined; readonly condition?: CombatCondition | undefined; readonly asSkillCast?: boolean | undefine...',
    optional: true,
  },
  source: ['packages/game-data-contract/src/skills.ts:345:3'],
  optional: true,
  description:
    '原生 SwitchToAddBuff 的施放前旁路；命中时不启动或中断普通技能时间轴。\n`currentSkillTypes` 表达依赖上一技能身份的结束技路径；`condition` 表达候选技能自身的\n普通条件路径。两者同时存在时均须成立。`asSkillCast` 保留原生是否发布完整施法事件。',
} as const;
const definitionSchemaPart_fac53510f108474a = {
  key: {
    kind: 'string',
    semantics: { type: 'string' },
    source: ['packages/game-data-contract/src/equipment.ts:95:3'],
    description: '响应在同一装备定义中的唯一名称。',
  },
  priority: {
    kind: 'number',
    semantics: { type: 'number | undefined', optional: true },
    source: ['packages/game-data-contract/src/equipment.ts:97:3'],
    optional: true,
    description: '原生数据动作优先级；同级按定义中的注册顺序执行。',
  },
  condition: definitionSchemaPart_50964fe034ab11e1,
  sequence: {
    kind: 'opaque',
    fallback: { reason: 'graph-reference-boundary' },
    semantics: { type: 'ActionGraphReference', aliases: ['ActionGraphReference'] },
    source: ['packages/game-data-contract/src/equipment.ts:101:3'],
    description: '条件成立时执行的动作序列。',
  },
  event: definitionSchemaPart_2c640cab00812569,
  abilityEvent: {
    kind: 'opaque',
    fallback: { reason: 'no-present-type' },
    semantics: { type: 'undefined' },
    source: ['packages/game-data-contract/src/equipment.ts:111:9'],
    optional: true,
    description: '使用语义战斗事件时不能同时监听能力事件。',
  },
} as const;
const definitionSchemaPart_4ea18a8d2ad2f244 = {
  kind: 'object',
  fields: definitionSchemaPart_fac53510f108474a,
  semantics: {
    type: 'EquipmentEventHandlerDefinitionBase & { readonly event: CombatEventTrigger; readonly abilityEvent?: undefined; }',
  },
  source: ['packages/game-data-contract/src/equipment.ts:130:3'],
} as const;
const definitionSchemaPart_b95ca22734bddf01 = {
  kind: 'union',
  variants: [definitionSchemaPart_4ea18a8d2ad2f244, definitionSchemaPart_52f9076101546f18],
  semantics: {
    type: 'EquipmentEventHandlerDefinition',
    unionVariants: [
      {
        type: 'EquipmentEventHandlerDefinitionBase & { readonly event: CombatEventTrigger; readonly abilityEvent?: undefined; }',
      },
      {
        type: 'EquipmentEventHandlerDefinitionBase & { readonly event?: undefined; readonly abilityEvent: "enterFight" | "beforeOutputDamage" | "beforeOutputPhysicalInfliction" | ... 12 more ... | "skillSpGained"; }',
      },
    ],
  },
  source: ['packages/game-data-contract/src/equipment.ts:130:3'],
} as const;
const definitionSchemaPart_f7274e9e44e89733 = {
  kind: 'array',
  element: definitionSchemaPart_b95ca22734bddf01,
  semantics: {
    type: 'readonly EquipmentEventHandlerDefinition[] | undefined',
    arrayElement: {
      type: 'EquipmentEventHandlerDefinition',
      unionVariants: [
        {
          type: 'EquipmentEventHandlerDefinitionBase & { readonly event: CombatEventTrigger; readonly abilityEvent?: undefined; }',
        },
        {
          type: 'EquipmentEventHandlerDefinitionBase & { readonly event?: undefined; readonly abilityEvent: "enterFight" | "beforeOutputDamage" | "beforeOutputPhysicalInfliction" | ... 12 more ... | "skillSpGained"; }',
        },
      ],
    },
    optional: true,
  },
  source: ['packages/game-data-contract/src/equipment.ts:130:3'],
  optional: true,
  description: '装备能力注册的战斗事件响应。',
} as const;
export const definitionSchemas = {
  operator: {
    kind: 'object',
    fields: {
      slug: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/operators.ts:509:3'],
        description: '稳定英文名；项目引用与实例关联使用此身份。',
      },
      displayName: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['packages/game-data-contract/src/operators.ts:511:3'],
        optional: true,
        description: '项目模板可提供独立展示名；内置定义继续使用本地化文本。',
      },
      assetSlug: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['packages/game-data-contract/src/operators.ts:513:3'],
        optional: true,
        description:
          '项目模板继承头像、技能图标和本地化回退时使用的内置资源 slug；不参与对象身份。',
      },
      gameId: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/operators.ts:515:3'],
        description: '游戏原生角色 ID。',
      },
      rarity: {
        kind: 'enum',
        options: [4, 5, 6],
        semantics: {
          type: '4 | 5 | 6',
          unionVariants: [{ type: '4' }, { type: '5' }, { type: '6' }],
        },
        source: ['packages/game-data-contract/src/operators.ts:517:3'],
        description: '干员星级。',
      },
      defaultPotential: {
        kind: 'number',
        semantics: { type: 'number | undefined', optional: true },
        source: ['packages/game-data-contract/src/operators.ts:519:3'],
        optional: true,
        description: '编辑器选择和“拉满”时使用的产品默认潜能；省略时沿用旧版星级策略。',
      },
      weaponType: {
        kind: 'enum',
        options: ['sword', 'greatsword', 'polearm', 'handcannon', 'arts-unit'],
        semantics: {
          type: '"sword" | "greatsword" | "polearm" | "handcannon" | "arts-unit"',
          unionVariants: [
            { type: '"sword"' },
            { type: '"greatsword"' },
            { type: '"polearm"' },
            { type: '"handcannon"' },
            { type: '"arts-unit"' },
          ],
        },
        source: ['packages/game-data-contract/src/operators.ts:521:3'],
        description: '干员可以装备的武器类型。',
      },
      element: {
        kind: 'enum',
        options: ['physical', 'heat', 'cryo', 'electric', 'nature'],
        semantics: {
          type: '"physical" | "heat" | "cryo" | "electric" | "nature"',
          unionVariants: [
            { type: '"physical"' },
            { type: '"heat"' },
            { type: '"cryo"' },
            { type: '"electric"' },
            { type: '"nature"' },
          ],
        },
        source: ['packages/game-data-contract/src/operators.ts:523:3'],
        description: '干员元素。',
      },
      role: {
        kind: 'enum',
        options: ['guard', 'caster', 'defender', 'vanguard', 'supporter', 'striker'],
        semantics: {
          type: '"guard" | "caster" | "defender" | "vanguard" | "supporter" | "striker"',
          unionVariants: [
            { type: '"guard"' },
            { type: '"caster"' },
            { type: '"defender"' },
            { type: '"vanguard"' },
            { type: '"supporter"' },
            { type: '"striker"' },
          ],
        },
        source: ['packages/game-data-contract/src/operators.ts:525:3'],
        description: '干员战斗定位。',
      },
      mainAttribute: {
        kind: 'enum',
        options: ['strength', 'agility', 'intellect', 'will'],
        semantics: {
          type: '"strength" | "agility" | "intellect" | "will"',
          unionVariants: [
            { type: '"strength"' },
            { type: '"agility"' },
            { type: '"intellect"' },
            { type: '"will"' },
          ],
        },
        source: ['packages/game-data-contract/src/operators.ts:527:3'],
        description: '干员主属性。',
      },
      secondaryAttribute: {
        kind: 'enum',
        options: ['strength', 'agility', 'intellect', 'will'],
        semantics: {
          type: '"strength" | "agility" | "intellect" | "will"',
          unionVariants: [
            { type: '"strength"' },
            { type: '"agility"' },
            { type: '"intellect"' },
            { type: '"will"' },
          ],
        },
        source: ['packages/game-data-contract/src/operators.ts:529:3'],
        description: '干员副属性。',
      },
      attributes: {
        kind: 'object',
        fields: {
          strength: {
            kind: 'array',
            element: {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/operators.ts:531:3'],
            },
            semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
            source: ['packages/game-data-contract/src/operators.ts:531:3'],
          },
          agility: {
            kind: 'array',
            element: {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/operators.ts:531:3'],
            },
            semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
            source: ['packages/game-data-contract/src/operators.ts:531:3'],
          },
          intellect: {
            kind: 'array',
            element: {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/operators.ts:531:3'],
            },
            semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
            source: ['packages/game-data-contract/src/operators.ts:531:3'],
          },
          will: {
            kind: 'array',
            element: {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/operators.ts:531:3'],
            },
            semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
            source: ['packages/game-data-contract/src/operators.ts:531:3'],
          },
          baseAttack: {
            kind: 'array',
            element: {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/operators.ts:44:3'],
            },
            semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
            source: ['packages/game-data-contract/src/operators.ts:44:3'],
            description: '各等级的基础攻击力。',
          },
          baseHealth: {
            kind: 'array',
            element: {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/operators.ts:46:3'],
            },
            semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
            source: ['packages/game-data-contract/src/operators.ts:46:3'],
            description: '各等级的基础生命值。',
          },
        },
        semantics: { type: 'AttributeGrowthDefinition' },
        source: ['packages/game-data-contract/src/operators.ts:531:3'],
        description: '各等级四维、攻击和生命成长。',
      },
      trustAttributeBonus: {
        kind: 'object',
        fields: {
          values: {
            kind: 'array',
            element: {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/operators.ts:52:3'],
            },
            semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
            source: ['packages/game-data-contract/src/operators.ts:52:3'],
            description: '各信赖节点提供的属性值。',
          },
          attributes: {
            kind: 'array',
            element: {
              kind: 'enum',
              options: ['strength', 'agility', 'intellect', 'will', 'main', 'secondary'],
              semantics: {
                type: '"strength" | "agility" | "intellect" | "will" | "main" | "secondary"',
                unionVariants: [
                  {
                    type: '"strength" | "agility" | "intellect" | "will"',
                    unionVariants: [
                      { type: '"strength"' },
                      { type: '"agility"' },
                      { type: '"intellect"' },
                      { type: '"will"' },
                    ],
                  },
                  { type: '"main"' },
                  { type: '"secondary"' },
                ],
              },
              source: ['packages/game-data-contract/src/operators.ts:54:3'],
            },
            semantics: {
              type: 'readonly ("strength" | "agility" | "intellect" | "will" | "main" | "secondary")[]',
              arrayElement: {
                type: '"strength" | "agility" | "intellect" | "will" | "main" | "secondary"',
                unionVariants: [
                  {
                    type: '"strength" | "agility" | "intellect" | "will"',
                    unionVariants: [
                      { type: '"strength"' },
                      { type: '"agility"' },
                      { type: '"intellect"' },
                      { type: '"will"' },
                    ],
                  },
                  { type: '"main"' },
                  { type: '"secondary"' },
                ],
              },
            },
            source: ['packages/game-data-contract/src/operators.ts:54:3'],
            description: '每个节点增加的具体属性或相对主副属性。',
          },
        },
        semantics: { type: 'TrustAttributeBonusDefinition | undefined', optional: true },
        source: ['packages/game-data-contract/src/operators.ts:533:3'],
        optional: true,
        description: '仅记录偏离全局 `[10, 15, 15, 20]` 主属性规则的干员。',
      },
      skillGroups: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: definitionSchemaPart_02be736ed6a33cb6,
          semantics: { type: 'SkillGroupDefinition' },
          source: ['packages/game-data-contract/src/operators.ts:535:3'],
        },
        semantics: {
          type: 'readonly SkillGroupDefinition[]',
          arrayElement: { type: 'SkillGroupDefinition' },
        },
        source: ['packages/game-data-contract/src/operators.ts:535:3'],
        description: '干员技能库的操作组集合；不包含切人、闪避、跳跃。组成员配置操作段的目标技能。',
      },
      dodgeSkill: {
        kind: 'union',
        variants: [
          {
            kind: 'opaque',
            fallback: { reason: 'owned-resource-boundary' },
            semantics: {
              type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
            },
            source: ['packages/game-data-contract/src/operators.ts:537:3'],
          },
          {
            kind: 'opaque',
            fallback: { reason: 'owned-resource-boundary' },
            semantics: {
              type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }',
            },
            source: ['packages/game-data-contract/src/operators.ts:537:3'],
          },
        ],
        semantics: {
          type: 'SkillDefinition | undefined',
          optional: true,
          unionVariants: [
            {
              type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
            },
            {
              type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }',
            },
          ],
        },
        source: ['packages/game-data-contract/src/operators.ts:537:3'],
        optional: true,
        description: '完美闪避成功后由中心状态机施放的隐藏技能；不作为普通技能块出现在技能库。',
      },
      dashBuffs: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            buffId: {
              kind: 'string',
              semantics: { type: 'string' },
              source: ['packages/game-data-contract/src/operators.ts:540:5'],
            },
            blackboard: {
              kind: 'record',
              value: {
                kind: 'union',
                variants: [
                  {
                    kind: 'string',
                    semantics: { type: 'string' },
                    source: ['packages/game-data-contract/src/operators.ts:541:5'],
                  },
                  {
                    kind: 'number',
                    semantics: { type: 'number' },
                    source: ['packages/game-data-contract/src/operators.ts:541:5'],
                  },
                ],
                semantics: {
                  type: 'string | number',
                  unionVariants: [{ type: 'number' }, { type: 'string' }],
                },
                source: ['packages/game-data-contract/src/operators.ts:541:5'],
              },
              semantics: {
                type: 'Readonly<Record<string, string | number>>',
                recordValue: {
                  type: 'string | number',
                  unionVariants: [{ type: 'number' }, { type: 'string' }],
                },
              },
              source: ['packages/game-data-contract/src/operators.ts:541:5'],
            },
          },
          semantics: {
            type: '{ readonly buffId: string; readonly blackboard: Readonly<Record<string, string | number>>; }',
          },
          source: ['packages/game-data-contract/src/operators.ts:539:3'],
        },
        semantics: {
          type: 'readonly { readonly buffId: string; readonly blackboard: Readonly<Record<string, string | number>>; }[] | undefined',
          arrayElement: {
            type: '{ readonly buffId: string; readonly blackboard: Readonly<Record<string, string | number>>; }',
          },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:539:3'],
        optional: true,
        description: '进入原生 Dash 状态时附着到当前干员的 Buff，以及创建实例时写入的字面黑板。',
      },
      skillSlots: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            key: {
              kind: 'string',
              semantics: { type: 'string' },
              source: ['packages/game-data-contract/src/skills.ts:210:3'],
              description: '技能槽在干员定义中的唯一名称。',
            },
            baseSkillKey: {
              kind: 'string',
              semantics: { type: 'string' },
              source: ['packages/game-data-contract/src/skills.ts:212:3'],
              description: '战斗开始时装入槽位的技能。',
            },
            stableSkillKeys: {
              kind: 'array',
              element: {
                kind: 'string',
                semantics: { type: 'string' },
                source: ['packages/game-data-contract/src/skills.ts:214:3'],
              },
              semantics: {
                type: 'readonly string[] | undefined',
                arrayElement: { type: 'string' },
                optional: true,
              },
              source: ['packages/game-data-contract/src/skills.ts:214:3'],
              optional: true,
              description: '未发生槽位替换时仍可由同一语义动作明确请求的技能。',
            },
            replacementSkillKeys: {
              kind: 'array',
              element: {
                kind: 'string',
                semantics: { type: 'string' },
                source: ['packages/game-data-contract/src/skills.ts:216:3'],
              },
              semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
              source: ['packages/game-data-contract/src/skills.ts:216:3'],
              description: 'Buff 或模式可以换入该槽位的技能。',
            },
          },
          semantics: { type: 'OperatorSkillSlotDefinition' },
          source: ['packages/game-data-contract/src/operators.ts:544:3'],
        },
        semantics: {
          type: 'readonly OperatorSkillSlotDefinition[] | undefined',
          arrayElement: { type: 'OperatorSkillSlotDefinition' },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:544:3'],
        optional: true,
        description: '战斗时可被 Buff/Mode 改写的技能槽；独立于技能库分组。',
      },
      playerActionRoutes: {
        kind: 'object',
        fields: {
          comboSkill: definitionSchemaPart_115e6d40d5e40862,
          basicAttack: definitionSchemaPart_115e6d40d5e40862,
          battleSkill: definitionSchemaPart_115e6d40d5e40862,
          ultimate: definitionSchemaPart_115e6d40d5e40862,
        },
        semantics: {
          type: 'Readonly<Partial<Record<"comboSkill" | "basicAttack" | "battleSkill" | "ultimate", PlayerActionRouteDefinition>>> | undefined',
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:546:3'],
        optional: true,
        description: '四类玩家语义动作的原生路由；缺失边必须诊断为 unknown。',
      },
      playerActionModes: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            modeId: {
              kind: 'string',
              semantics: { type: 'string' },
              source: ['packages/game-data-contract/src/skills.ts:183:3'],
              description: '游戏中的模式 ID。',
            },
            modeLayer: {
              kind: 'string',
              semantics: { type: 'string' },
              source: ['packages/game-data-contract/src/skills.ts:185:3'],
              description: '多个模式同时存在时所属的互斥或叠加层。',
            },
            defaultEnabled: {
              kind: 'boolean',
              semantics: { type: 'boolean' },
              source: ['packages/game-data-contract/src/skills.ts:187:3'],
              description: '进入战斗时是否默认启用。',
            },
            normalAttackSkillKeys: {
              kind: 'array',
              element: {
                kind: 'string',
                semantics: { type: 'string' },
                source: ['packages/game-data-contract/src/skills.ts:189:3'],
              },
              semantics: {
                type: 'readonly string[] | undefined',
                arrayElement: { type: 'string' },
                optional: true,
              },
              source: ['packages/game-data-contract/src/skills.ts:189:3'],
              optional: true,
              description: '此模式下普通攻击序列允许请求的技能。',
            },
            commandMappings: {
              kind: 'object',
              fields: {
                comboSkill: {
                  kind: 'object',
                  fields: {
                    skillId: {
                      kind: 'string',
                      semantics: { type: 'string' },
                      source: ['packages/game-data-contract/src/skills.ts:197:11'],
                      description: '该操作请求的技能 ID。',
                    },
                  },
                  semantics: { type: '{ readonly skillId: string; } | undefined', optional: true },
                  source: ['packages/game-data-contract/src/skills.ts:191:3'],
                  optional: true,
                },
                basicAttack: {
                  kind: 'object',
                  fields: {
                    skillId: {
                      kind: 'string',
                      semantics: { type: 'string' },
                      source: ['packages/game-data-contract/src/skills.ts:197:11'],
                      description: '该操作请求的技能 ID。',
                    },
                  },
                  semantics: { type: '{ readonly skillId: string; } | undefined', optional: true },
                  source: ['packages/game-data-contract/src/skills.ts:191:3'],
                  optional: true,
                },
                battleSkill: {
                  kind: 'object',
                  fields: {
                    skillId: {
                      kind: 'string',
                      semantics: { type: 'string' },
                      source: ['packages/game-data-contract/src/skills.ts:197:11'],
                      description: '该操作请求的技能 ID。',
                    },
                  },
                  semantics: { type: '{ readonly skillId: string; } | undefined', optional: true },
                  source: ['packages/game-data-contract/src/skills.ts:191:3'],
                  optional: true,
                },
                ultimate: {
                  kind: 'object',
                  fields: {
                    skillId: {
                      kind: 'string',
                      semantics: { type: 'string' },
                      source: ['packages/game-data-contract/src/skills.ts:197:11'],
                      description: '该操作请求的技能 ID。',
                    },
                  },
                  semantics: { type: '{ readonly skillId: string; } | undefined', optional: true },
                  source: ['packages/game-data-contract/src/skills.ts:191:3'],
                  optional: true,
                },
              },
              semantics: {
                type: 'Readonly<Partial<Record<"comboSkill" | "basicAttack" | "battleSkill" | "ultimate", { readonly skillId: string; }>>> | undefined',
                optional: true,
              },
              source: ['packages/game-data-contract/src/skills.ts:191:3'],
              optional: true,
              description: '此模式对四类玩家操作的技能请求覆盖。',
            },
          },
          semantics: { type: 'OperatorPlayerActionModeDefinition' },
          source: ['packages/game-data-contract/src/operators.ts:548:3'],
        },
        semantics: {
          type: 'readonly OperatorPlayerActionModeDefinition[] | undefined',
          arrayElement: { type: 'OperatorPlayerActionModeDefinition' },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:548:3'],
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
              elements: [
                {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:552:5'],
                },
                {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:552:5'],
                },
              ],
              minLength: 2,
              semantics: {
                type: 'readonly [skillGroupKey: string, skillKey: string]',
                tuple: {
                  elements: [
                    { label: 'skillGroupKey', semantics: { type: 'string' } },
                    { label: 'skillKey', semantics: { type: 'string' } },
                  ],
                  minLength: 2,
                  maxLength: 2,
                },
              },
              source: ['packages/game-data-contract/src/operators.ts:552:5'],
              description: '旧项目中的技能组和技能键。',
            },
            to: {
              kind: 'tuple',
              elements: [
                {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:554:5'],
                },
                {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:554:5'],
                },
              ],
              minLength: 2,
              semantics: {
                type: 'readonly [skillGroupKey: string, skillKey: string]',
                tuple: {
                  elements: [
                    { label: 'skillGroupKey', semantics: { type: 'string' } },
                    { label: 'skillKey', semantics: { type: 'string' } },
                  ],
                  minLength: 2,
                  maxLength: 2,
                },
              },
              source: ['packages/game-data-contract/src/operators.ts:554:5'],
              description: '当前对应的技能组和技能键。',
            },
          },
          semantics: {
            type: '{ readonly from: readonly [skillGroupKey: string, skillKey: string]; readonly to: readonly [skillGroupKey: string, skillKey: string]; }',
          },
          source: ['packages/game-data-contract/src/operators.ts:550:3'],
        },
        semantics: {
          type: 'readonly { readonly from: readonly [skillGroupKey: string, skillKey: string]; readonly to: readonly [skillGroupKey: string, skillKey: string]; }[] | undefined',
          arrayElement: {
            type: '{ readonly from: readonly [skillGroupKey: string, skillKey: string]; readonly to: readonly [skillGroupKey: string, skillKey: string]; }',
          },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:550:3'],
        optional: true,
        description: '旧项目技能身份到当前规范身份的只读兼容映射；不得作为技能库中的额外入口展示。',
      },
      buffDefinitions: {
        kind: 'record',
        value: {
          kind: 'union',
          variants: [
            {
              kind: 'opaque',
              fallback: { reason: 'owned-resource-boundary' },
              semantics: { type: 'StaticBuffDefinition' },
              source: ['packages/game-data-contract/src/operators.ts:557:3'],
            },
            {
              kind: 'opaque',
              fallback: { reason: 'owned-resource-boundary' },
              semantics: {
                type: 'Omit<BuffDefinitionProperties, "damageModifiers"> & { readonly actionGraph?: ActionGraphResourceDefinition | undefined; ... 7 more ...; presentation?: CombatBuffPresentation | undefined; } & { ...; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:557:3'],
            },
          ],
          semantics: {
            type: 'SkillBuffDefinition',
            unionVariants: [
              {
                type: 'Omit<BuffDefinitionProperties, "damageModifiers"> & { readonly actionGraph?: ActionGraphResourceDefinition | undefined; ... 7 more ...; presentation?: CombatBuffPresentation | undefined; } & { ...; }',
              },
              { type: 'StaticBuffDefinition' },
            ],
          },
          source: ['packages/game-data-contract/src/operators.ts:557:3'],
        },
        semantics: {
          type: 'Readonly<Record<string, SkillBuffDefinition>> | undefined',
          recordValue: {
            type: 'SkillBuffDefinition',
            unionVariants: [
              {
                type: 'Omit<BuffDefinitionProperties, "damageModifiers"> & { readonly actionGraph?: ActionGraphResourceDefinition | undefined; ... 7 more ...; presentation?: CombatBuffPresentation | undefined; } & { ...; }',
              },
              { type: 'StaticBuffDefinition' },
            ],
          },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:557:3'],
        optional: true,
        description: '干员级附属对象；编辑器后续可在干员层级创建和修改，技能不得复制其完整定义。',
      },
      buffDisplayNameKeys: {
        kind: 'record',
        value: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/operators.ts:559:3'],
        },
        semantics: {
          type: 'Readonly<Record<string, string>> | undefined',
          recordValue: { type: 'string' },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:559:3'],
        optional: true,
        description: '此干员附属 Buff 的名称翻译键；仅用于展示，不进入战斗回执。',
      },
      abilityEntityDefinitions: {
        kind: 'record',
        value: {
          kind: 'object',
          fields: definitionSchemaPart_714413a486e79c86,
          semantics: { type: 'AbilityEntityDefinition' },
          source: ['packages/game-data-contract/src/operators.ts:561:3'],
        },
        semantics: {
          type: 'Readonly<Record<string, AbilityEntityDefinition>> | undefined',
          recordValue: { type: 'AbilityEntityDefinition' },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:561:3'],
        optional: true,
        description: '干员级能力实体蓝图；子技能按引用它的技能等级编译。',
      },
      comboSkillConditions: {
        kind: 'array',
        element: {
          kind: 'opaque',
          fallback: { reason: 'owned-resource-boundary' },
          semantics: { type: 'ComboSkillConditionDefinition' },
          source: ['packages/game-data-contract/src/operators.ts:563:3'],
        },
        semantics: {
          type: 'readonly ComboSkillConditionDefinition[] | undefined',
          arrayElement: { type: 'ComboSkillConditionDefinition' },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:563:3'],
        optional: true,
        description: '原生角色常驻连携条件；多段连携的后续窗口仍由技能序列中的步骤开启。',
      },
      comboSkillPriority: {
        kind: 'enum',
        options: ['default', 'firstBlackboard', 'enemyRank'],
        semantics: {
          type: '"default" | "firstBlackboard" | "enemyRank" | undefined',
          optional: true,
          unionVariants: [
            { type: '"default"' },
            { type: '"firstBlackboard"' },
            { type: '"enemyRank"' },
          ],
        },
        source: ['packages/game-data-contract/src/operators.ts:565:3'],
        optional: true,
        description: 'SkillDataBundle.comboSkillPriorityType；单敌人运行时不评分，但转换不得丢失。',
      },
      entityBlackboard: {
        kind: 'record',
        value: {
          kind: 'union',
          variants: [
            {
              kind: 'string',
              semantics: { type: 'string' },
              source: ['packages/game-data-contract/src/operators.ts:567:3'],
            },
            {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/operators.ts:567:3'],
            },
          ],
          semantics: {
            type: 'string | number',
            unionVariants: [{ type: 'number' }, { type: 'string' }],
          },
          source: ['packages/game-data-contract/src/operators.ts:567:3'],
        },
        semantics: {
          type: 'Readonly<Record<string, string | number>> | undefined',
          recordValue: {
            type: 'string | number',
            unionVariants: [{ type: 'number' }, { type: 'string' }],
          },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:567:3'],
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
                semantics: { type: '"numeric"' },
                source: ['packages/game-data-contract/src/operators.ts:431:3'],
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
                semantics: {
                  type: '"tangtangDroplets" | "laevatainCounter" | "zhuangFangyiThunder" | "arcaneSigils"',
                  unionVariants: [
                    { type: '"tangtangDroplets"' },
                    { type: '"laevatainCounter"' },
                    { type: '"zhuangFangyiThunder"' },
                    { type: '"arcaneSigils"' },
                  ],
                },
                source: ['packages/game-data-contract/src/operators.ts:433:3'],
                description: '可选择的角色专属外观。',
              },
              maximum: {
                kind: 'number',
                semantics: { type: 'number' },
                source: ['packages/game-data-contract/src/operators.ts:436:3'],
                description: '计数显示的上限。',
              },
              activeAt: {
                kind: 'number',
                semantics: { type: 'number | undefined', optional: true },
                source: ['packages/game-data-contract/src/operators.ts:438:3'],
                optional: true,
                description: '达到该值时原生节点进入满层/强化状态；没有独立满层态时省略。',
              },
            },
            semantics: { type: 'NumericPassiveUiDefinition' },
            source: ['packages/game-data-contract/src/operators.ts:569:3'],
          },
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['buffProgress'],
                semantics: { type: '"buffProgress"' },
                source: ['packages/game-data-contract/src/operators.ts:444:3'],
                description: 'HUD 类型判别值。',
              },
              appearance: {
                kind: 'enum',
                options: ['liinoMusic'],
                semantics: { type: '"liinoMusic"' },
                source: ['packages/game-data-contract/src/operators.ts:446:3'],
                description: '使用的角色专属外观。',
              },
              normalBuffId: {
                kind: 'string',
                semantics: { type: 'string' },
                source: ['packages/game-data-contract/src/operators.ts:448:3'],
                description: '普通状态读取的 Buff ID。',
              },
              ultimateBuffId: {
                kind: 'string',
                semantics: { type: 'string' },
                source: ['packages/game-data-contract/src/operators.ts:450:3'],
                description: '终结技状态读取的 Buff ID。',
              },
            },
            semantics: { type: 'LiinoPassiveUiDefinition' },
            source: ['packages/game-data-contract/src/operators.ts:569:3'],
          },
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['buffCounters'],
                semantics: { type: '"buffCounters"' },
                source: ['packages/game-data-contract/src/operators.ts:456:3'],
                description: 'Typhoea 原生 HUD 同时观察三种 Buff 层数；不复制为独立战斗状态。',
              },
              appearance: {
                kind: 'enum',
                options: ['typhoeaArrows'],
                semantics: { type: '"typhoeaArrows"' },
                source: ['packages/game-data-contract/src/operators.ts:458:3'],
                description: '使用的角色专属外观。',
              },
              reserveArrowBuffId: {
                kind: 'string',
                semantics: { type: 'string' },
                source: ['packages/game-data-contract/src/operators.ts:460:3'],
                description: '后备箭层数对应的 Buff ID。',
              },
              battleArrowBuffId: {
                kind: 'string',
                semantics: { type: 'string' },
                source: ['packages/game-data-contract/src/operators.ts:462:3'],
                description: '战斗箭层数对应的 Buff ID。',
              },
              pointBuffId: {
                kind: 'string',
                semantics: { type: 'string' },
                source: ['packages/game-data-contract/src/operators.ts:464:3'],
                description: '点数层数对应的 Buff ID。',
              },
              maximumArrows: {
                kind: 'number',
                semantics: { type: 'number' },
                source: ['packages/game-data-contract/src/operators.ts:466:3'],
                description: '箭数量显示上限。',
              },
              maximumPoints: {
                kind: 'number',
                semantics: { type: 'number' },
                source: ['packages/game-data-contract/src/operators.ts:468:3'],
                description: '点数显示上限。',
              },
            },
            semantics: { type: 'TyphoeaPassiveUiDefinition' },
            source: ['packages/game-data-contract/src/operators.ts:569:3'],
          },
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['abilityEntityCount'],
                semantics: { type: '"abilityEntityCount"' },
                source: ['packages/game-data-contract/src/operators.ts:473:3'],
              },
              abilityEntityId: {
                kind: 'string',
                semantics: { type: 'string' },
                source: ['packages/game-data-contract/src/operators.ts:474:3'],
              },
              icon: {
                kind: 'string',
                semantics: { type: 'string' },
                source: ['packages/game-data-contract/src/operators.ts:476:3'],
                description: '图标资源路径。',
              },
              nameKey: {
                kind: 'string',
                semantics: { type: 'string' },
                source: ['packages/game-data-contract/src/operators.ts:478:3'],
                description: '实体显示名称的 i18n 键。',
              },
            },
            semantics: { type: 'AbilityEntityCountPassiveUiDefinition' },
            source: ['packages/game-data-contract/src/operators.ts:569:3'],
          },
        ],
        semantics: {
          type: 'OperatorPassiveUiDefinition | undefined',
          optional: true,
          unionVariants: [
            { type: 'NumericPassiveUiDefinition' },
            { type: 'LiinoPassiveUiDefinition' },
            { type: 'TyphoeaPassiveUiDefinition' },
            { type: 'AbilityEntityCountPassiveUiDefinition' },
          ],
        },
        source: ['packages/game-data-contract/src/operators.ts:569:3'],
        optional: true,
        description: 'CharacterTable 明确挂载的角色专属战斗 HUD；不存在时不得从遗留 prefab 猜测。',
      },
      entityBlackboardInitializers: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            key: {
              kind: 'string',
              semantics: { type: '`EntityBB_${string}`' },
              source: ['packages/game-data-contract/src/operators.ts:413:3'],
              description: '要初始化的实体黑板键。',
            },
            condition: {
              kind: 'object',
              fields: definitionSchemaPart_9d8aa2834ff90c0d,
              semantics: {
                type: '{ kind: "deckAttributeCompare"; left: "strength" | "agility" | "intellect" | "will"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: "strength" | ... 2 more ... | "will"; }',
                aliases: ['BuildCondition'],
              },
              source: ['packages/game-data-contract/src/operators.ts:415:3'],
              description: '根据最终构筑判断写入哪个值。',
            },
            trueValue: {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/operators.ts:417:3'],
              description: '条件成立时写入的值。',
            },
            falseValue: {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/operators.ts:419:3'],
              description: '条件不成立时写入的值。',
            },
          },
          semantics: { type: 'OperatorEntityBlackboardInitializerDefinition' },
          source: ['packages/game-data-contract/src/operators.ts:571:3'],
        },
        semantics: {
          type: 'readonly OperatorEntityBlackboardInitializerDefinition[] | undefined',
          arrayElement: { type: 'OperatorEntityBlackboardInitializerDefinition' },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:571:3'],
        optional: true,
        description: '技能间共享的实体黑板初值；条件只读取已解析的静态构筑。',
      },
      passiveSkills: {
        kind: 'array',
        element: {
          kind: 'opaque',
          fallback: { reason: 'owned-resource-boundary' },
          semantics: { type: 'OperatorPassiveSkillDefinition' },
          source: ['packages/game-data-contract/src/operators.ts:573:3'],
        },
        semantics: {
          type: 'readonly OperatorPassiveSkillDefinition[] | undefined',
          arrayElement: { type: 'OperatorPassiveSkillDefinition' },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:573:3'],
        optional: true,
        description: '角色自身始终安装的隐藏基础被动；与受构筑开关控制的天赋/潜能被动分开。',
      },
      eventHandlers: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            key: {
              kind: 'string',
              semantics: { type: 'string' },
              source: ['packages/game-data-contract/src/operators.ts:403:3'],
              description: '响应在此干员定义中的唯一名称。',
            },
            event: {
              kind: 'enum',
              options: ['deckAttributesChanged'],
              semantics: { type: '"deckAttributesChanged"' },
              source: ['packages/game-data-contract/src/operators.ts:405:3'],
              description: '要监听的构筑事件。',
            },
            sequence: {
              kind: 'opaque',
              fallback: { reason: 'graph-reference-boundary' },
              semantics: { type: 'ActionGraphReference', aliases: ['ActionGraphReference'] },
              source: ['packages/game-data-contract/src/operators.ts:407:3'],
              description: '事件发生后执行的动作序列。',
            },
          },
          semantics: { type: 'OperatorEventHandlerDefinition' },
          source: ['packages/game-data-contract/src/operators.ts:575:3'],
        },
        semantics: {
          type: 'readonly OperatorEventHandlerDefinition[] | undefined',
          arrayElement: { type: 'OperatorEventHandlerDefinition' },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:575:3'],
        optional: true,
        description: '构筑属性变化时执行的干员级响应。',
      },
      talents: {
        kind: 'array',
        element: {
          kind: 'opaque',
          fallback: { reason: 'owned-resource-boundary' },
          semantics: { type: 'OperatorUpgradeDefinition' },
          source: ['packages/game-data-contract/src/operators.ts:577:3'],
        },
        semantics: {
          type: 'readonly OperatorUpgradeDefinition[]',
          arrayElement: { type: 'OperatorUpgradeDefinition' },
        },
        source: ['packages/game-data-contract/src/operators.ts:577:3'],
        description: '固定两个按顺序排列的天赋槽；只修改槽内内容，不改变槽位数量。',
      },
      potentials: {
        kind: 'array',
        element: {
          kind: 'opaque',
          fallback: { reason: 'owned-resource-boundary' },
          semantics: { type: 'OperatorUpgradeDefinition' },
          source: ['packages/game-data-contract/src/operators.ts:579:3'],
        },
        semantics: {
          type: 'readonly OperatorUpgradeDefinition[]',
          arrayElement: { type: 'OperatorUpgradeDefinition' },
        },
        source: ['packages/game-data-contract/src/operators.ts:579:3'],
        description: '固定五个按顺序排列的潜能槽；校验器会报告数量不正确的草稿。',
      },
      conversionSupport: {
        kind: 'object',
        fields: {
          completeness: {
            kind: 'enum',
            options: ['complete', 'partial'],
            semantics: {
              type: '"complete" | "partial"',
              unionVariants: [{ type: '"complete"' }, { type: '"partial"' }],
            },
            source: ['packages/game-data-contract/src/primitives.ts:308:3'],
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
                  semantics: {
                    type: '"skillBehavior" | "skillAvailability" | "talentEffects" | "potentialEffects" | "runtimeDependencies"',
                    unionVariants: [
                      { type: '"skillBehavior"' },
                      { type: '"skillAvailability"' },
                      { type: '"talentEffects"' },
                      { type: '"potentialEffects"' },
                      { type: '"runtimeDependencies"' },
                    ],
                  },
                  source: ['packages/game-data-contract/src/primitives.ts:312:5'],
                  description: '缺失能力的类别。',
                },
                skillGroupKeys: {
                  kind: 'array',
                  element: {
                    kind: 'string',
                    semantics: { type: 'string' },
                    source: ['packages/game-data-contract/src/primitives.ts:314:5'],
                  },
                  semantics: {
                    type: 'readonly string[] | undefined',
                    arrayElement: { type: 'string' },
                    optional: true,
                  },
                  source: ['packages/game-data-contract/src/primitives.ts:314:5'],
                  optional: true,
                  description: '仅当缺失能力能明确归到某个技能组时，给出该技能组的稳定键。',
                },
              },
              semantics: {
                type: '{ readonly capability: "skillBehavior" | "skillAvailability" | "talentEffects" | "potentialEffects" | "runtimeDependencies"; readonly skillGroupKeys?: readonly string[] | undefined; }',
              },
              source: ['packages/game-data-contract/src/primitives.ts:310:3'],
            },
            semantics: {
              type: 'readonly { readonly capability: "skillBehavior" | "skillAvailability" | "talentEffects" | "potentialEffects" | "runtimeDependencies"; readonly skillGroupKeys?: readonly string[] | undefined; }[]',
              arrayElement: {
                type: '{ readonly capability: "skillBehavior" | "skillAvailability" | "talentEffects" | "potentialEffects" | "runtimeDependencies"; readonly skillGroupKeys?: readonly string[] | undefined; }',
              },
            },
            source: ['packages/game-data-contract/src/primitives.ts:310:3'],
            description: '宽松转换时未能生成的能力列表。',
          },
        },
        semantics: { type: 'OperatorConversionSupport | undefined', optional: true },
        source: ['packages/game-data-contract/src/operators.ts:581:3'],
        optional: true,
        description: '未提供时视为人工审核完成；宽松转换产物必须显式携带该字段。',
      },
    },
    semantics: { type: 'OperatorDefinition' },
    source: ['packages/game-data-contract/src/operators.ts:507:1'],
  },
  weapon: {
    kind: 'object',
    fields: {
      slug: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/equipment.ts:152:3'],
        description: '游戏原生武器对象 ID（`wpn_*`）；项目引用、实例关联与校验均以它为准。',
      },
      displayName: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['packages/game-data-contract/src/equipment.ts:154:3'],
        optional: true,
        description: '缺少本地化资源时可使用的武器名称。',
      },
      assetSlug: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['packages/game-data-contract/src/equipment.ts:156:3'],
        optional: true,
        description: '仅用于定位图标/本地化等展示资源；资源复用不得改变 slug 身份。',
      },
      iconPath: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['packages/game-data-contract/src/equipment.ts:158:3'],
        optional: true,
        description: '与语言无关的展示资源；名称和描述仍由 locale family 按需解析。',
      },
      rarity: {
        kind: 'enum',
        options: [4, 5, 6, 3],
        semantics: {
          type: '4 | 5 | 6 | 3',
          unionVariants: [{ type: '4' }, { type: '5' }, { type: '6' }, { type: '3' }],
        },
        source: ['packages/game-data-contract/src/equipment.ts:160:3'],
        description: '武器星级。',
      },
      weaponType: {
        kind: 'enum',
        options: ['sword', 'greatsword', 'polearm', 'handcannon', 'arts-unit'],
        semantics: {
          type: '"sword" | "greatsword" | "polearm" | "handcannon" | "arts-unit"',
          unionVariants: [
            { type: '"sword"' },
            { type: '"greatsword"' },
            { type: '"polearm"' },
            { type: '"handcannon"' },
            { type: '"arts-unit"' },
          ],
        },
        source: ['packages/game-data-contract/src/equipment.ts:162:3'],
        description: '可装备这把武器的干员武器类型。',
      },
      baseAttackAtLevelNodes: {
        kind: 'array',
        element: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/equipment.ts:164:3'],
        },
        semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
        source: ['packages/game-data-contract/src/equipment.ts:164:3'],
        description:
          '依次对应 1、20、40、60、80、90 级节点；其他等级必须由有证据的成长规则解析，不能擅自插值。',
      },
      traits: {
        kind: 'array',
        element: {
          kind: 'opaque',
          fallback: { reason: 'owned-resource-boundary' },
          semantics: { type: 'WeaponTraitDefinition' },
          source: ['packages/game-data-contract/src/equipment.ts:166:3'],
        },
        semantics: {
          type: 'readonly WeaponTraitDefinition[]',
          arrayElement: { type: 'WeaponTraitDefinition' },
        },
        source: ['packages/game-data-contract/src/equipment.ts:166:3'],
        description: '按武器词条槽顺序保存的被动能力。',
      },
      buffDefinitions: {
        kind: 'record',
        value: {
          kind: 'union',
          variants: [
            {
              kind: 'opaque',
              fallback: { reason: 'owned-resource-boundary' },
              semantics: { type: 'StaticBuffDefinition' },
              source: ['packages/game-data-contract/src/equipment.ts:168:3'],
            },
            {
              kind: 'opaque',
              fallback: { reason: 'owned-resource-boundary' },
              semantics: {
                type: 'Omit<BuffDefinitionProperties, "damageModifiers"> & { readonly actionGraph?: ActionGraphResourceDefinition | undefined; ... 7 more ...; presentation?: CombatBuffPresentation | undefined; } & { ...; }',
              },
              source: ['packages/game-data-contract/src/equipment.ts:168:3'],
            },
          ],
          semantics: {
            type: 'SkillBuffDefinition',
            unionVariants: [
              {
                type: 'Omit<BuffDefinitionProperties, "damageModifiers"> & { readonly actionGraph?: ActionGraphResourceDefinition | undefined; ... 7 more ...; presentation?: CombatBuffPresentation | undefined; } & { ...; }',
              },
              { type: 'StaticBuffDefinition' },
            ],
          },
          source: ['packages/game-data-contract/src/equipment.ts:168:3'],
        },
        semantics: {
          type: 'Readonly<Record<string, SkillBuffDefinition>> | undefined',
          recordValue: {
            type: 'SkillBuffDefinition',
            unionVariants: [
              {
                type: 'Omit<BuffDefinitionProperties, "damageModifiers"> & { readonly actionGraph?: ActionGraphResourceDefinition | undefined; ... 7 more ...; presentation?: CombatBuffPresentation | undefined; } & { ...; }',
              },
              { type: 'StaticBuffDefinition' },
            ],
          },
          optional: true,
        },
        source: ['packages/game-data-contract/src/equipment.ts:168:3'],
        optional: true,
        description: '整把武器的 Buff 定义闭包；各词条引用它，不由某条技能代持。',
      },
    },
    semantics: { type: 'WeaponDefinition' },
    source: ['packages/game-data-contract/src/equipment.ts:150:1'],
  },
  gear: {
    kind: 'object',
    fields: {
      slug: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/equipment.ts:192:3'],
        description: '游戏原生装备对象 ID（`item_equip_*`）；项目引用、实例关联与校验均以它为准。',
      },
      displayName: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['packages/game-data-contract/src/equipment.ts:194:3'],
        optional: true,
        description: '缺少本地化资源时可使用的装备名称。',
      },
      assetSlug: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['packages/game-data-contract/src/equipment.ts:196:3'],
        optional: true,
        description: '仅用于定位图标/本地化等展示资源；共用 iconId 不得改变 slug 身份。',
      },
      iconPath: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['packages/game-data-contract/src/equipment.ts:198:3'],
        optional: true,
        description: '与语言无关的展示资源；名称和描述仍由 locale family 按需解析。',
      },
      slotType: {
        kind: 'enum',
        options: ['armor', 'gloves', 'accessory'],
        semantics: {
          type: '"armor" | "gloves" | "accessory"',
          unionVariants: [{ type: '"armor"' }, { type: '"gloves"' }, { type: '"accessory"' }],
        },
        source: ['packages/game-data-contract/src/equipment.ts:200:3'],
        description: '这件装备占用的槽位。',
      },
      levelRequirement: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/equipment.ts:202:3'],
        description: '可以穿戴这件装备的最低干员等级。',
      },
      baseDefense: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/equipment.ts:204:3'],
        description: '装备提供的基础防御力。',
      },
      traits: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: definitionSchemaPart_3720f5e4ffb8bd73,
          semantics: { type: 'GearTraitDefinition' },
          source: ['packages/game-data-contract/src/equipment.ts:206:3'],
        },
        semantics: {
          type: 'readonly GearTraitDefinition[]',
          arrayElement: { type: 'GearTraitDefinition' },
        },
        source: ['packages/game-data-contract/src/equipment.ts:206:3'],
        description: '按词条槽顺序保存的装备能力。',
      },
      gearSetSlug: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['packages/game-data-contract/src/equipment.ts:208:3'],
        optional: true,
        description: '所属套装的 ID；省略表示不属于套装。',
      },
    },
    semantics: { type: 'GearDefinition' },
    source: ['packages/game-data-contract/src/equipment.ts:190:1'],
  },
  gearSet: {
    kind: 'object',
    fields: {
      buffDefinitions: {
        kind: 'record',
        value: {
          kind: 'union',
          variants: [
            {
              kind: 'opaque',
              fallback: { reason: 'owned-resource-boundary' },
              semantics: { type: 'StaticBuffDefinition' },
              source: ['packages/game-data-contract/src/equipment.ts:217:3'],
            },
            {
              kind: 'opaque',
              fallback: { reason: 'owned-resource-boundary' },
              semantics: {
                type: 'Omit<BuffDefinitionProperties, "damageModifiers"> & { readonly actionGraph?: ActionGraphResourceDefinition | undefined; ... 7 more ...; presentation?: CombatBuffPresentation | undefined; } & { ...; }',
              },
              source: ['packages/game-data-contract/src/equipment.ts:217:3'],
            },
          ],
          semantics: {
            type: 'SkillBuffDefinition',
            unionVariants: [
              {
                type: 'Omit<BuffDefinitionProperties, "damageModifiers"> & { readonly actionGraph?: ActionGraphResourceDefinition | undefined; ... 7 more ...; presentation?: CombatBuffPresentation | undefined; } & { ...; }',
              },
              { type: 'StaticBuffDefinition' },
            ],
          },
          source: ['packages/game-data-contract/src/equipment.ts:217:3'],
        },
        semantics: {
          type: 'Readonly<Record<string, SkillBuffDefinition>> | undefined',
          recordValue: {
            type: 'SkillBuffDefinition',
            unionVariants: [
              {
                type: 'Omit<BuffDefinitionProperties, "damageModifiers"> & { readonly actionGraph?: ActionGraphResourceDefinition | undefined; ... 7 more ...; presentation?: CombatBuffPresentation | undefined; } & { ...; }',
              },
              { type: 'StaticBuffDefinition' },
            ],
          },
          optional: true,
        },
        source: ['packages/game-data-contract/src/equipment.ts:217:3'],
        optional: true,
        description: '套装对象持有的 Buff 定义，套装效果通过 ID 引用。',
      },
      slug: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/equipment.ts:219:3'],
        description: '游戏原生套装 ID。',
      },
      skillId: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['packages/game-data-contract/src/equipment.ts:221:3'],
        optional: true,
        description: '套装效果的原生 SkillData 身份；不同于套装对象 ID。',
      },
      displayName: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['packages/game-data-contract/src/equipment.ts:223:3'],
        optional: true,
        description: '缺少本地化资源时可使用的套装名称。',
      },
      iconPath: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['packages/game-data-contract/src/equipment.ts:225:3'],
        optional: true,
        description: '套装效果在时间轴上的展示图标；独立于效果自身的原生图标。',
      },
      actionGraph: {
        kind: 'graph',
        semantics: { type: 'ActionGraphResourceDefinition | undefined', optional: true },
        source: ['packages/game-data-contract/src/equipment.ts:124:3'],
        optional: true,
        description: '当前武器词条或套装效果自己的程序图；不按原生 ID 跨对象共享。',
      },
      modifiers: definitionSchemaPart_58975cbd1d457ed9,
      eventHandlers: definitionSchemaPart_f7274e9e44e89733,
      blackboard: definitionSchemaPart_278d3e397df130ba,
      enableSequence: {
        kind: 'opaque',
        fallback: { reason: 'graph-reference-boundary' },
        semantics: {
          type: 'ActionGraphReference | undefined',
          aliases: ['ActionGraphReference'],
          optional: true,
        },
        source: ['packages/game-data-contract/src/equipment.ts:134:3'],
        optional: true,
        description: '能力启用前执行一次；期间自身事件响应关闭，典型用途为原生普通启动 Buff。',
      },
      initializationSequence: {
        kind: 'opaque',
        fallback: { reason: 'graph-reference-boundary' },
        semantics: {
          type: 'ActionGraphReference | undefined',
          aliases: ['ActionGraphReference'],
          optional: true,
        },
        source: ['packages/game-data-contract/src/equipment.ts:136:3'],
        optional: true,
        description: '能力启用后在帧 0 执行一次；Toggle 初次安装及固定构筑刷新程序使用此入口。',
      },
    },
    semantics: { type: 'GearSetDefinition' },
    source: ['packages/game-data-contract/src/equipment.ts:215:1'],
    references: definitionSchemaPart_d9d6d8826b5e5ff5,
  },
  consumable: {
    kind: 'object',
    fields: {
      id: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/consumables.ts:9:3'],
      },
      iconPath: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/consumables.ts:10:3'],
      },
      rarity: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/consumables.ts:11:3'],
      },
      kind: {
        kind: 'enum',
        options: ['operatorBuff'],
        semantics: { type: '"operatorBuff"' },
        source: ['packages/game-data-contract/src/consumables.ts:12:3'],
      },
      durationSeconds: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/consumables.ts:13:3'],
      },
      exclusiveGroup: {
        kind: 'enum',
        options: ['operatorConsumableBuff'],
        semantics: { type: '"operatorConsumableBuff"' },
        source: ['packages/game-data-contract/src/consumables.ts:15:3'],
        description: '同组物品在同一干员身上互斥；使用新物品时结束旧物品的全部 Buff。',
      },
      applications: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            buffId: {
              kind: 'string',
              semantics: { type: 'string' },
              source: ['packages/game-data-contract/src/consumables.ts:3:3'],
            },
            blackboardValues: {
              kind: 'record',
              value: {
                kind: 'number',
                semantics: { type: 'number' },
                source: ['packages/game-data-contract/src/consumables.ts:4:3'],
              },
              semantics: {
                type: 'Readonly<Record<string, number>>',
                recordValue: { type: 'number' },
              },
              source: ['packages/game-data-contract/src/consumables.ts:4:3'],
            },
          },
          semantics: { type: 'ConsumableBuffApplicationDefinition' },
          source: ['packages/game-data-contract/src/consumables.ts:16:3'],
        },
        semantics: {
          type: 'readonly ConsumableBuffApplicationDefinition[]',
          arrayElement: { type: 'ConsumableBuffApplicationDefinition' },
        },
        source: ['packages/game-data-contract/src/consumables.ts:16:3'],
      },
    },
    semantics: { type: 'ConsumableDefinition' },
    source: ['packages/game-data-contract/src/consumables.ts:8:1'],
  },
  enemy: {
    kind: 'object',
    fields: {
      id: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['src/core/game-data/enemyDefinition.ts:30:3'],
      },
      iconPath: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['src/core/game-data/enemyDefinition.ts:31:3'],
        optional: true,
      },
      tier: {
        kind: 'enum',
        options: ['elite', 'boss', 'normal', 'advanced', 'leader'],
        semantics: {
          type: '"elite" | "boss" | "normal" | "advanced" | "leader"',
          unionVariants: [
            { type: '"elite"' },
            { type: '"boss"' },
            { type: '"normal"' },
            { type: '"advanced"' },
            { type: '"leader"' },
          ],
        },
        source: ['src/core/game-data/enemyDefinition.ts:32:3'],
      },
      rank: {
        kind: 'enum',
        options: ['mob', 'elite', 'boss'],
        semantics: {
          type: '"mob" | "elite" | "boss"',
          unionVariants: [{ type: '"mob"' }, { type: '"elite"' }, { type: '"boss"' }],
        },
        source: ['src/core/game-data/enemyDefinition.ts:34:3'],
        description: '原生战斗等级；独立于五档展示 tier，供 CheckEnemyRank 等战斗规则读取。',
      },
      levelHp: {
        kind: 'tuple',
        elements: [
          {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:36:3'],
          },
          {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:36:3'],
          },
          {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:36:3'],
          },
          {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:36:3'],
          },
          {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:36:3'],
          },
          {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:36:3'],
          },
        ],
        minLength: 6,
        semantics: {
          type: 'EnemyLevelHp',
          tuple: {
            elements: [
              { semantics: { type: 'number' } },
              { semantics: { type: 'number' } },
              { semantics: { type: 'number' } },
              { semantics: { type: 'number' } },
              { semantics: { type: 'number' } },
              { semantics: { type: 'number' } },
            ],
            minLength: 6,
            maxLength: 6,
          },
        },
        source: ['src/core/game-data/enemyDefinition.ts:36:3'],
        description: '按 ENEMY_LEVELS 排列的六档生命值。',
      },
      defense: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['src/core/game-data/enemyDefinition.ts:37:3'],
      },
      resistances: {
        kind: 'object',
        fields: {
          physical: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:38:3'],
          },
          heat: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:38:3'],
          },
          cryo: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:38:3'],
          },
          electric: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:38:3'],
          },
          nature: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:38:3'],
          },
        },
        semantics: {
          type: 'Readonly<Record<"physical" | "heat" | "cryo" | "electric" | "nature", number>>',
        },
        source: ['src/core/game-data/enemyDefinition.ts:38:3'],
      },
      superArmor: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['src/core/game-data/enemyDefinition.ts:39:3'],
      },
      stagger: {
        kind: 'object',
        fields: {
          maximum: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:16:3'],
          },
          knotThresholds: {
            kind: 'array',
            element: {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['src/core/game-data/enemyDefinition.ts:18:3'],
            },
            semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
            source: ['src/core/game-data/enemyDefinition.ts:18:3'],
            description: '已损失失衡值占上限的递增阈值；跨越阈值会触发对应节点事件。',
          },
          knotBreakDurationSeconds: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:19:3'],
          },
          brokenDurationSeconds: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:20:3'],
          },
          finisherSpRecovery: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['src/core/game-data/enemyDefinition.ts:22:3'],
            description: '对该敌人施放处决后，玩家获得的技力。',
          },
        },
        semantics: { type: 'EnemyStaggerDefinition' },
        source: ['src/core/game-data/enemyDefinition.ts:40:3'],
      },
      finisherMultiplier: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['src/core/game-data/enemyDefinition.ts:41:3'],
      },
    },
    semantics: { type: 'EnemyDefinition' },
    source: ['src/core/game-data/enemyDefinition.ts:29:1'],
  },
  globalEffect: {
    kind: 'object',
    fields: {
      id: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['src/core/game-data/globalEffectDefinition.ts:5:3'],
      },
      nameKey: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['src/core/game-data/globalEffectDefinition.ts:6:3'],
        optional: true,
      },
      descriptionKey: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['src/core/game-data/globalEffectDefinition.ts:7:3'],
        optional: true,
      },
      buff: {
        kind: 'union',
        variants: [
          {
            kind: 'opaque',
            fallback: { reason: 'owned-resource-boundary' },
            semantics: { type: 'StaticBuffDefinition' },
            source: ['src/core/game-data/globalEffectDefinition.ts:8:3'],
          },
          {
            kind: 'opaque',
            fallback: { reason: 'owned-resource-boundary' },
            semantics: {
              type: 'Omit<BuffDefinitionProperties, "damageModifiers"> & { readonly actionGraph?: ActionGraphResourceDefinition | undefined; ... 7 more ...; presentation?: CombatBuffPresentation | undefined; } & { ...; }',
            },
            source: ['src/core/game-data/globalEffectDefinition.ts:8:3'],
          },
        ],
        semantics: {
          type: 'SkillBuffDefinition',
          unionVariants: [
            {
              type: 'Omit<BuffDefinitionProperties, "damageModifiers"> & { readonly actionGraph?: ActionGraphResourceDefinition | undefined; ... 7 more ...; presentation?: CombatBuffPresentation | undefined; } & { ...; }',
            },
            { type: 'StaticBuffDefinition' },
          ],
        },
        source: ['src/core/game-data/globalEffectDefinition.ts:8:3'],
      },
    },
    semantics: { type: 'GlobalEffectDefinition' },
    source: ['src/core/game-data/globalEffectDefinition.ts:4:1'],
  },
  contract: {
    kind: 'object',
    fields: {
      tagId: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/mechanics.ts:3:3'],
      },
      columnId: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/mechanics.ts:4:3'],
      },
      conflictId: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/mechanics.ts:5:3'],
      },
      score: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/mechanics.ts:6:3'],
      },
      keyId: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/mechanics.ts:7:3'],
      },
      lockIds: {
        kind: 'array',
        element: {
          kind: 'string',
          semantics: { type: 'string' },
          source: ['packages/game-data-contract/src/mechanics.ts:8:3'],
        },
        semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
        source: ['packages/game-data-contract/src/mechanics.ts:8:3'],
      },
      romanNumSuffix: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/mechanics.ts:9:3'],
      },
      iconPath: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/mechanics.ts:10:3'],
      },
      blackboard: {
        kind: 'record',
        value: {
          kind: 'number',
          semantics: { type: 'number' },
          source: ['packages/game-data-contract/src/mechanics.ts:11:3'],
        },
        semantics: { type: 'Readonly<Record<string, number>>', recordValue: { type: 'number' } },
        source: ['packages/game-data-contract/src/mechanics.ts:11:3'],
      },
    },
    semantics: { type: 'ContingencyContractTagDefinition' },
    source: ['packages/game-data-contract/src/mechanics.ts:2:1'],
  },
  skill: {
    kind: 'union',
    variants: [
      {
        kind: 'object',
        fields: {
          actionGraph: {
            kind: 'graph',
            semantics: { type: 'ActionGraphResourceDefinition' },
            source: ['packages/game-data-contract/src/skills.ts:286:3'],
            description: '该技能完整的节点和宏；所有入口均在此图中解析。',
          },
          key: {
            kind: 'string',
            semantics: { type: 'string' },
            source: ['packages/game-data-contract/src/skills.ts:288:3'],
            description: '原生 SkillData.skillId，也是干员定义和时间轴引用此技能时使用的唯一 ID。',
          },
          nativeSkillType: definitionSchemaPart_957ab133254a7817,
          enhancementStateBuffId: {
            kind: 'string',
            semantics: { type: 'string | undefined', optional: true },
            source: ['packages/game-data-contract/src/skills.ts:295:3'],
            optional: true,
            description:
              '该次释放所创建的强化状态 Buff 身份。时间轴只按实际 Buff 回执投影生命周期；\n省略表示没有已取证的强化状态，不能把任意自身 Buff 猜成强化条。',
          },
          smartTarget: {
            kind: 'enum',
            options: ['enemy', 'input', 'trigger'],
            semantics: {
              type: '"enemy" | "input" | "trigger" | undefined',
              optional: true,
              unionVariants: [{ type: '"enemy"' }, { type: '"input"' }, { type: '"trigger"' }],
            },
            source: ['packages/game-data-contract/src/skills.ts:297:3'],
            optional: true,
            description:
              '零距离木桩下 StoreSmartTarget 的归约结果；省略表示原技能不执行智能目标存储。',
          },
          timelineBlockFrames: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['packages/game-data-contract/src/skills.ts:299:3'],
            description: '时间轴技能块的显示宽度；由可操作边界推导，不对应原生 `durationFrame`。',
          },
          timelineContinuationSkillId: {
            kind: 'string',
            semantics: { type: 'string | undefined', optional: true },
            source: ['packages/game-data-contract/src/skills.ts:305:3'],
            optional: true,
            description:
              '基础攻击有序连段中建议的下一技能原生 Skill ID，供技能库递归放置、预览选择，并标记\n已保留实际 AllowNext 动作的定义。正式块宽读取实际动作候选或 canInterrupt，不按该 ID\n预选未来输入。',
          },
          timelineBlockFollowUpSkillId: {
            kind: 'string',
            semantics: { type: 'string | undefined', optional: true },
            source: ['packages/game-data-contract/src/skills.ts:307:3'],
            optional: true,
            description: '块宽的接续参照技能；覆盖默认接续目标，仅影响显示，不执行该技能。',
          },
          naturalDurationFrames: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['packages/game-data-contract/src/skills.ts:312:3'],
            description:
              '原生 `SkillData.durationFrame` 的运行时自然结束周期，已按原生 getter 钳制为至少 1 帧。\n它不决定技能块宽度，也不能用 `exclusiveFrame` 或最后一个可见战斗动作代替。',
          },
          exclusiveFrame: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['packages/game-data-contract/src/skills.ts:314:3'],
            description:
              '原生 SkillData.exclusiveFrame；只在需要读取当前技能可中断状态时参与运行时判断。',
          },
          offsetRecordFrame: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['packages/game-data-contract/src/skills.ts:316:3'],
            description: '原生 SkillData.offsetRecordFrame；到达时把下一段普攻提交为连段偏移目标。',
          },
          inputWindows: definitionSchemaPart_421d9e16e463df02,
          availability: {
            kind: 'condition',
            fallback: { reason: 'condition-editor-pending' },
            semantics: {
              type: 'CombatCondition | undefined',
              aliases: ['CombatCondition'],
              optional: true,
            },
            source: ['packages/game-data-contract/src/skills.ts:333:3'],
            optional: true,
            description:
              '技能释放条件只生成合法性诊断；不成立也不会阻止技能进入模拟。\n模拟层将用户排入时间轴的动作视为已经成功释放，不得改写或跳过。',
          },
          cooldownFrames: definitionSchemaPart_e4fed771775926a1,
          costs: definitionSchemaPart_0d22d9d7b73ee900,
          costFrame: {
            kind: 'number',
            semantics: { type: 'number | undefined', optional: true },
            source: ['packages/game-data-contract/src/skills.ts:339:3'],
            optional: true,
            description: '原生 `CastData.startCdFrame`；配置消耗时编译器要求此字段存在。',
          },
          switchToBuffCast: definitionSchemaPart_e74deb4f5fb767d5,
          eventHandlers: definitionSchemaPart_6baf5250ce182ba6,
          blackboard: definitionSchemaPart_f4a857f6c7282a2a,
          scheduledSequences: definitionSchemaPart_372daf15f4884d97,
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
            semantics: {
              type: '"comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"',
              unionVariants: [
                { type: '"comboSkill"' },
                { type: '"plungingAttack"' },
                { type: '"basicAttack"' },
                { type: '"battleSkill"' },
                { type: '"ultimate"' },
                { type: '"finisher"' },
              ],
            },
            source: ['packages/game-data-contract/src/skills.ts:366:9'],
            description: '技能的战斗分类，不由技能库分组推测。',
          },
          levelSource: {
            kind: 'enum',
            options: ['comboSkill', 'basicAttack', 'battleSkill', 'ultimate'],
            semantics: {
              type: '"comboSkill" | "basicAttack" | "battleSkill" | "ultimate"',
              unionVariants: [
                { type: '"comboSkill"' },
                { type: '"basicAttack"' },
                { type: '"battleSkill"' },
                { type: '"ultimate"' },
              ],
            },
            source: ['packages/game-data-contract/src/skills.ts:368:9'],
            description: '技能使用哪一项养成等级；由原生技能组成员关系确定。',
          },
        },
        semantics: {
          type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
        },
        source: ['packages/game-data-contract/src/skills.ts:362:1'],
      },
      {
        kind: 'object',
        fields: {
          actionGraph: {
            kind: 'graph',
            semantics: { type: 'ActionGraphResourceDefinition' },
            source: ['packages/game-data-contract/src/skills.ts:286:3'],
            description: '该技能完整的节点和宏；所有入口均在此图中解析。',
          },
          key: {
            kind: 'string',
            semantics: { type: 'string' },
            source: ['packages/game-data-contract/src/skills.ts:288:3'],
            description: '原生 SkillData.skillId，也是干员定义和时间轴引用此技能时使用的唯一 ID。',
          },
          nativeSkillType: definitionSchemaPart_957ab133254a7817,
          enhancementStateBuffId: {
            kind: 'string',
            semantics: { type: 'string | undefined', optional: true },
            source: ['packages/game-data-contract/src/skills.ts:295:3'],
            optional: true,
            description:
              '该次释放所创建的强化状态 Buff 身份。时间轴只按实际 Buff 回执投影生命周期；\n省略表示没有已取证的强化状态，不能把任意自身 Buff 猜成强化条。',
          },
          smartTarget: {
            kind: 'enum',
            options: ['enemy', 'input', 'trigger'],
            semantics: {
              type: '"enemy" | "input" | "trigger" | undefined',
              optional: true,
              unionVariants: [{ type: '"enemy"' }, { type: '"input"' }, { type: '"trigger"' }],
            },
            source: ['packages/game-data-contract/src/skills.ts:297:3'],
            optional: true,
            description:
              '零距离木桩下 StoreSmartTarget 的归约结果；省略表示原技能不执行智能目标存储。',
          },
          timelineBlockFrames: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['packages/game-data-contract/src/skills.ts:299:3'],
            description: '时间轴技能块的显示宽度；由可操作边界推导，不对应原生 `durationFrame`。',
          },
          timelineContinuationSkillId: {
            kind: 'string',
            semantics: { type: 'string | undefined', optional: true },
            source: ['packages/game-data-contract/src/skills.ts:305:3'],
            optional: true,
            description:
              '基础攻击有序连段中建议的下一技能原生 Skill ID，供技能库递归放置、预览选择，并标记\n已保留实际 AllowNext 动作的定义。正式块宽读取实际动作候选或 canInterrupt，不按该 ID\n预选未来输入。',
          },
          timelineBlockFollowUpSkillId: {
            kind: 'string',
            semantics: { type: 'string | undefined', optional: true },
            source: ['packages/game-data-contract/src/skills.ts:307:3'],
            optional: true,
            description: '块宽的接续参照技能；覆盖默认接续目标，仅影响显示，不执行该技能。',
          },
          naturalDurationFrames: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['packages/game-data-contract/src/skills.ts:312:3'],
            description:
              '原生 `SkillData.durationFrame` 的运行时自然结束周期，已按原生 getter 钳制为至少 1 帧。\n它不决定技能块宽度，也不能用 `exclusiveFrame` 或最后一个可见战斗动作代替。',
          },
          exclusiveFrame: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['packages/game-data-contract/src/skills.ts:314:3'],
            description:
              '原生 SkillData.exclusiveFrame；只在需要读取当前技能可中断状态时参与运行时判断。',
          },
          offsetRecordFrame: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['packages/game-data-contract/src/skills.ts:316:3'],
            description: '原生 SkillData.offsetRecordFrame；到达时把下一段普攻提交为连段偏移目标。',
          },
          inputWindows: definitionSchemaPart_421d9e16e463df02,
          availability: {
            kind: 'condition',
            fallback: { reason: 'condition-editor-pending' },
            semantics: {
              type: 'CombatCondition | undefined',
              aliases: ['CombatCondition'],
              optional: true,
            },
            source: ['packages/game-data-contract/src/skills.ts:333:3'],
            optional: true,
            description:
              '技能释放条件只生成合法性诊断；不成立也不会阻止技能进入模拟。\n模拟层将用户排入时间轴的动作视为已经成功释放，不得改写或跳过。',
          },
          cooldownFrames: definitionSchemaPart_e4fed771775926a1,
          costs: definitionSchemaPart_0d22d9d7b73ee900,
          costFrame: {
            kind: 'number',
            semantics: { type: 'number | undefined', optional: true },
            source: ['packages/game-data-contract/src/skills.ts:339:3'],
            optional: true,
            description: '原生 `CastData.startCdFrame`；配置消耗时编译器要求此字段存在。',
          },
          switchToBuffCast: definitionSchemaPart_e74deb4f5fb767d5,
          eventHandlers: definitionSchemaPart_6baf5250ce182ba6,
          blackboard: definitionSchemaPart_f4a857f6c7282a2a,
          scheduledSequences: definitionSchemaPart_372daf15f4884d97,
          skillType: {
            kind: 'enum',
            options: ['dodge'],
            semantics: { type: '"dodge"' },
            source: ['packages/game-data-contract/src/skills.ts:370:9'],
          },
          levelSource: {
            kind: 'opaque',
            fallback: { reason: 'no-present-type' },
            semantics: { type: 'undefined' },
            source: ['packages/game-data-contract/src/skills.ts:370:29'],
            optional: true,
          },
        },
        semantics: {
          type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }',
        },
        source: ['packages/game-data-contract/src/skills.ts:362:1'],
      },
    ],
    semantics: {
      type: 'SkillDefinition',
      unionVariants: [
        {
          type: 'SkillDefinitionProperties & { skillType: "comboSkill" | "plungingAttack" | "basicAttack" | "battleSkill" | "ultimate" | "finisher"; levelSource: "comboSkill" | ... 2 more ... | "ultimate"; }',
        },
        { type: 'SkillDefinitionProperties & { skillType: "dodge"; levelSource?: undefined; }' },
      ],
    },
    source: ['packages/game-data-contract/src/skills.ts:362:1'],
    references: {
      field_d51f3dc9d48dd3217c4a: {
        kind: 'array',
        element: definitionSchemaPart_c7b46650c6e12388,
        semantics: {
          type: 'readonly CombatCondition[]',
          arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
        },
        source: ['packages/game-data-contract/src/conditions.ts:649:7'],
      },
      field_24786945eb90cb9c243d: {
        kind: 'array',
        element: definitionSchemaPart_86c37b6e507abdca,
        semantics: {
          type: 'readonly CombatCondition[]',
          arrayElement: { type: 'CombatCondition', aliases: ['CombatCondition'] },
        },
        source: ['packages/game-data-contract/src/conditions.ts:643:7'],
      },
      field_06572a068b9551ab9c57: {
        kind: 'union',
        variants: [
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['constant'],
                semantics: { type: '"constant"' },
                source: ['packages/game-data-contract/src/conditions.ts:53:7'],
                description: '直接返回固定真假值。',
              },
              value: {
                kind: 'boolean',
                semantics: { type: 'boolean' },
                source: ['packages/game-data-contract/src/conditions.ts:55:7'],
                description: '条件结果。',
              },
            },
            semantics: { type: '{ kind: "constant"; value: boolean; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['combatActive'],
                semantics: { type: '"combatActive"' },
                source: ['packages/game-data-contract/src/conditions.ts:60:7'],
                description: '条件种类判别值。',
              },
            },
            semantics: { type: '{ kind: "combatActive"; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['singleEnemyPresent'],
                semantics: { type: '"singleEnemyPresent"' },
                source: ['packages/game-data-contract/src/conditions.ts:65:7'],
                description: '条件种类判别值。',
              },
            },
            semantics: { type: '{ kind: "singleEnemyPresent"; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['casterControlled'],
                semantics: { type: '"casterControlled"' },
                source: ['packages/game-data-contract/src/conditions.ts:70:7'],
                description: '条件种类判别值。',
              },
            },
            semantics: { type: '{ kind: "casterControlled"; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          definitionSchemaPart_f3d3e22b83af6376,
          definitionSchemaPart_c347e818f2b24603,
          definitionSchemaPart_64714dce6e9dea33,
          definitionSchemaPart_03b432aa4b84d3fd,
          definitionSchemaPart_e9f06312c4b12587,
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['skillBranchEnabled'],
                semantics: { type: '"skillBranchEnabled"' },
                source: ['packages/game-data-contract/src/conditions.ts:115:7'],
                description: '检查构筑是否启用了一个技能动作分支。',
              },
              branchKey: {
                kind: 'string',
                semantics: { type: 'string' },
                source: ['packages/game-data-contract/src/conditions.ts:117:7'],
                description: '要检查的分支键。',
              },
            },
            semantics: { type: '{ kind: "skillBranchEnabled"; branchKey: string; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          definitionSchemaPart_17a4638d4c7b1720,
          definitionSchemaPart_3db0d33ee847f1a9,
          definitionSchemaPart_40b2ffc117c21ba3,
          definitionSchemaPart_320a627b2062aa19,
          definitionSchemaPart_9a6b855afa39ee80,
          definitionSchemaPart_c8fdebee4f75975a,
          definitionSchemaPart_e839a7d0a5bf08e1,
          definitionSchemaPart_23e37562453e9c52,
          definitionSchemaPart_b869624d7946aa42,
          definitionSchemaPart_540dc6942716dea8,
          definitionSchemaPart_ade0487d8eb165f5,
          definitionSchemaPart_27be370aacfa2b0d,
          definitionSchemaPart_ecdb54c187a7c946,
          definitionSchemaPart_6887c63c427ab746,
          definitionSchemaPart_d157a4e4e9bce79c,
          definitionSchemaPart_2a6248cf0078c48f,
          definitionSchemaPart_812630c526d0b6fa,
          definitionSchemaPart_03d64d69050b442c,
          definitionSchemaPart_82f4890ec9815057,
          definitionSchemaPart_1a77aac8f3ba14e5,
          definitionSchemaPart_b8484be0ae2d7658,
          definitionSchemaPart_5093ce3deeda4e4d,
          definitionSchemaPart_31b62063343999e9,
          definitionSchemaPart_e21f4ca3f156e7ea,
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['casterComboPending'],
                semantics: { type: '"casterComboPending"' },
                source: ['packages/game-data-contract/src/conditions.ts:391:7'],
                description: '施放者的原生连携候选列表非空；不检查冷却、队首、当前技能或可释放性。',
              },
            },
            semantics: { type: '{ kind: "casterComboPending"; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['eventComboRingQteSucceeded'],
                semantics: { type: '"eventComboRingQteSucceeded"' },
                source: ['packages/game-data-contract/src/conditions.ts:395:7'],
                description:
                  '当前 beforeCastSkill 对应的连携输入命中了 ShowComboRingQte 有效阶段。',
              },
            },
            semantics: { type: '{ kind: "eventComboRingQteSucceeded"; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          definitionSchemaPart_28ae51a31e1bb521,
          definitionSchemaPart_9fc068952444ca9c,
          definitionSchemaPart_7c303b14b561bb06,
          definitionSchemaPart_a1aa30c2581a32b3,
          definitionSchemaPart_1cb5104bda53fd85,
          definitionSchemaPart_05b2da07e173f2b6,
          definitionSchemaPart_0f71d14a197655e1,
          definitionSchemaPart_5e05a4441422f9ee,
          definitionSchemaPart_d1aa59fa5029b929,
          definitionSchemaPart_68a690c2e76ee655,
          definitionSchemaPart_ed81cd713d5fcdbe,
          definitionSchemaPart_def057e70d633df4,
          definitionSchemaPart_b6e3305d3c5055c8,
          definitionSchemaPart_ffb2e1be792124f7,
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['eventSkillCastMatchesBuffSource'],
                semantics: { type: '"eventSkillCastMatchesBuffSource"' },
                source: ['packages/game-data-contract/src/conditions.ts:504:7'],
                description: '条件种类判别值。',
              },
            },
            semantics: { type: '{ kind: "eventSkillCastMatchesBuffSource"; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          definitionSchemaPart_0ef0e54d0c17f971,
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['eventBuffEndedEarly'],
                semantics: { type: '"eventBuffEndedEarly"' },
                source: ['packages/game-data-contract/src/conditions.ts:517:7'],
                description: '条件种类判别值。',
              },
            },
            semantics: { type: '{ kind: "eventBuffEndedEarly"; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          definitionSchemaPart_1d43ef999219b4d1,
          definitionSchemaPart_bb9b36214b3a8a7a,
          definitionSchemaPart_33a752b85030eab1,
          definitionSchemaPart_6b9fe018960e22f7,
          definitionSchemaPart_9719873e95f240b2,
          definitionSchemaPart_75a6edab28565d2b,
          definitionSchemaPart_a5af4620ec4d25f9,
          definitionSchemaPart_e28ec883386c5f9a,
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['eventSourceMatchesBuffSource'],
                semantics: { type: '"eventSourceMatchesBuffSource"' },
                source: ['packages/game-data-contract/src/conditions.ts:592:7'],
                description: '条件种类判别值。',
              },
            },
            semantics: { type: '{ kind: "eventSourceMatchesBuffSource"; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['eventSourceMatchesBuffSourceEntitySource'],
                semantics: { type: '"eventSourceMatchesBuffSourceEntitySource"' },
                source: ['packages/game-data-contract/src/conditions.ts:597:7'],
                description: '条件种类判别值。',
              },
            },
            semantics: { type: '{ kind: "eventSourceMatchesBuffSourceEntitySource"; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['eventSourceControlled'],
                semantics: { type: '"eventSourceControlled"' },
                source: ['packages/game-data-contract/src/conditions.ts:602:7'],
                description: '条件种类判别值。',
              },
            },
            semantics: { type: '{ kind: "eventSourceControlled"; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['buffSourceMatchesOwner'],
                semantics: { type: '"buffSourceMatchesOwner"' },
                source: ['packages/game-data-contract/src/conditions.ts:607:7'],
                description: '条件种类判别值。',
              },
            },
            semantics: { type: '{ kind: "buffSourceMatchesOwner"; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          definitionSchemaPart_0846b9b6ffd20793,
          definitionSchemaPart_d7d2d35220d27b45,
          definitionSchemaPart_87a5396df99c57cb,
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['not'],
                semantics: { type: '"not"' },
                source: ['packages/game-data-contract/src/conditions.ts:635:7'],
                description: '对一个子条件的结果取反。',
              },
              condition: {
                kind: 'ref',
                ref: 'field_06572a068b9551ab9c57',
                semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
                source: ['packages/game-data-contract/src/conditions.ts:637:7'],
                inlineCondition: 'skillSwitch',
                description: '要取反的条件。',
              },
            },
            semantics: { type: '{ kind: "not"; condition: CombatCondition; }' },
            source: ['packages/game-data-contract/src/conditions.ts:637:7'],
          },
          definitionSchemaPart_8709422e1bd0eeef,
          definitionSchemaPart_02430c2dadaa9b97,
          definitionSchemaPart_a9969f150a6b04c9,
        ],
        semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
        source: ['packages/game-data-contract/src/conditions.ts:637:7'],
        inlineCondition: 'skillSwitch',
      },
    },
  },
  skillGroup: {
    kind: 'object',
    fields: definitionSchemaPart_02be736ed6a33cb6,
    semantics: { type: 'SkillGroupDefinition' },
    source: ['packages/game-data-contract/src/skills.ts:392:1'],
  },
  skillGroupVariant: {
    kind: 'object',
    fields: definitionSchemaPart_6104d633b9d889b8,
    semantics: { type: 'SkillGroupVariantDefinition' },
    source: ['packages/game-data-contract/src/skills.ts:434:1'],
  },
  buff: {
    kind: 'union',
    variants: [
      {
        kind: 'object',
        fields: {
          blackboard: definitionSchemaPart_08a7754e5a1d221a,
          affixSkillCastIdentity: {
            kind: 'enum',
            options: ['sourceSkillCast'],
            semantics: { type: '"sourceSkillCast" | undefined', optional: true },
            source: ['packages/game-data-contract/src/buffs.ts:680:3'],
            optional: true,
            description: '启用时记录创建该 Buff 的技能施放编号，供 SkillAffix 条件匹配同一次施放。',
          },
          presentation: definitionSchemaPart_50699134b8c284cd,
          childPresentations: definitionSchemaPart_3e827ff09a5598dd,
          timeClock: {
            kind: 'enum',
            options: ['default', 'global', 'self'],
            semantics: {
              type: 'BuffTimeClock | undefined',
              optional: true,
              unionVariants: [{ type: '"default"' }, { type: '"global"' }, { type: '"self"' }],
            },
            source: ['packages/game-data-contract/src/buffs.ts:686:3'],
            optional: true,
            description: '计算持续时间和触发间隔所用的时钟；不填时随全局时间缩放。',
          },
          applyTags: {
            kind: 'array',
            element: {
              kind: 'string',
              semantics: { type: 'string', aliases: ['GameplayTag'] },
              source: ['packages/game-data-contract/src/buffs.ts:688:3'],
            },
            semantics: {
              type: 'readonly string[] | undefined',
              arrayElement: { type: 'string', aliases: ['GameplayTag'] },
              optional: true,
            },
            source: ['packages/game-data-contract/src/buffs.ts:688:3'],
            optional: true,
            description:
              'Buff 的分类标签；启用时同时挂到所属实体，并用于按标签查找、计数和结束 Buff。',
          },
          extendTags: {
            kind: 'array',
            element: {
              kind: 'string',
              semantics: { type: 'string', aliases: ['GameplayTag'] },
              source: ['packages/game-data-contract/src/buffs.ts:690:3'],
            },
            semantics: {
              type: 'readonly string[] | undefined',
              arrayElement: { type: 'string', aliases: ['GameplayTag'] },
              optional: true,
            },
            source: ['packages/game-data-contract/src/buffs.ts:690:3'],
            optional: true,
            description: 'Buff 到期但被延长逻辑暂时阻止结束时，临时挂到所属实体的标签。',
          },
          stackingType: definitionSchemaPart_106b373694ee6d14,
          stackingKey: {
            kind: 'string',
            semantics: { type: 'string | undefined', optional: true },
            source: ['packages/game-data-contract/src/buffs.ts:694:3'],
            optional: true,
            description: 'Buff 所属的叠加组；不填时使用 Buff ID，同一组必须使用相同的叠加方式。',
          },
          priority: definitionSchemaPart_38c022b612b019d6,
          durationSeconds: definitionSchemaPart_d3dd6357b1df4217,
          addingCooldownSeconds: definitionSchemaPart_90855f34ff01a57b,
          ignoreAddingCooldown: {
            kind: 'boolean',
            semantics: { type: 'boolean | undefined', optional: true },
            source: ['packages/game-data-contract/src/buffs.ts:702:3'],
            optional: true,
            description: '只跳过已有冷却检查，仍在创建/叠层前登记本次冷却。',
          },
          triggerIntervalSeconds: definitionSchemaPart_c64dba6203828946,
          waitFirstTriggerInterval: {
            kind: 'boolean',
            semantics: { type: 'boolean | undefined', optional: true },
            source: ['packages/game-data-contract/src/buffs.ts:706:3'],
            optional: true,
            description: '是否等满一个触发间隔后再首次触发；为 false 时启用后的首次更新即可触发。',
          },
          maxTriggerCount: definitionSchemaPart_a1746dd748a5beac,
          attributeModifiers: definitionSchemaPart_6ef4a3723a418db7,
          keywordEnhancements: definitionSchemaPart_9a2a01cd9390f812,
          healModifiers: definitionSchemaPart_ef93b0b898e06dca,
          poiseModifiers: definitionSchemaPart_248f3862117f45d7,
          shields: definitionSchemaPart_68d17b9828d0a60f,
          sustainedProtection: definitionSchemaPart_ff63ec594135fc85,
          role: definitionSchemaPart_9223027ab677169a,
          spellBurst: definitionSchemaPart_e39c10fa09683334,
          maxStackCount: definitionSchemaPart_ae1b4b358bbcba44,
          skillSlotReplacements: definitionSchemaPart_a4cddd4d89db3386,
          actionGraph: {
            kind: 'opaque',
            fallback: { reason: 'no-present-type' },
            semantics: { type: 'undefined' },
            source: ['packages/game-data-contract/src/buffs.ts:166:3'],
            optional: true,
          },
          scheduledSequences: {
            kind: 'opaque',
            fallback: { reason: 'no-present-type' },
            semantics: { type: 'undefined' },
            source: ['packages/game-data-contract/src/buffs.ts:167:3'],
            optional: true,
          },
          lifecycleSequences: {
            kind: 'opaque',
            fallback: { reason: 'no-present-type' },
            semantics: { type: 'undefined' },
            source: ['packages/game-data-contract/src/buffs.ts:168:3'],
            optional: true,
          },
          abilityEventResponses: {
            kind: 'opaque',
            fallback: { reason: 'no-present-type' },
            semantics: { type: 'undefined' },
            source: ['packages/game-data-contract/src/buffs.ts:169:3'],
            optional: true,
          },
          igniteEventResponses: {
            kind: 'opaque',
            fallback: { reason: 'no-present-type' },
            semantics: { type: 'undefined' },
            source: ['packages/game-data-contract/src/buffs.ts:170:3'],
            optional: true,
          },
          damageModifiers: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                enabledSide: {
                  kind: 'enum',
                  options: ['defender', 'attacker'],
                  semantics: {
                    type: '"defender" | "attacker"',
                    unionVariants: [{ type: '"defender"' }, { type: '"attacker"' }],
                  },
                  source: ['packages/game-data-contract/src/buffs.ts:641:3'],
                  description: '修正安装在攻击方还是防御方时启用。',
                },
                condition: definitionSchemaPart_921258e328dfd16a,
                processors: definitionSchemaPart_88ca6fca7d8b52be,
                conditionProgram: {
                  kind: 'opaque',
                  fallback: { reason: 'no-present-type' },
                  semantics: { type: 'undefined' },
                  source: ['packages/game-data-contract/src/buffs.ts:174:9'],
                  optional: true,
                },
              },
              semantics: {
                type: 'Omit<SkillBuffDefinitionDamageModifier, "conditionProgram"> & { readonly conditionProgram?: undefined; }',
              },
              source: ['packages/game-data-contract/src/buffs.ts:171:3'],
            },
            semantics: {
              type: 'readonly (Omit<SkillBuffDefinitionDamageModifier, "conditionProgram"> & { readonly conditionProgram?: undefined; })[] | undefined',
              arrayElement: {
                type: 'Omit<SkillBuffDefinitionDamageModifier, "conditionProgram"> & { readonly conditionProgram?: undefined; }',
              },
              optional: true,
            },
            source: ['packages/game-data-contract/src/buffs.ts:171:3'],
            optional: true,
          },
        },
        semantics: { type: 'StaticBuffDefinition' },
        source: ['packages/game-data-contract/src/buffs.ts:178:1'],
      },
      {
        kind: 'object',
        fields: {
          blackboard: definitionSchemaPart_08a7754e5a1d221a,
          affixSkillCastIdentity: {
            kind: 'enum',
            options: ['sourceSkillCast'],
            semantics: { type: '"sourceSkillCast" | undefined', optional: true },
            source: ['packages/game-data-contract/src/buffs.ts:680:3'],
            optional: true,
            description: '启用时记录创建该 Buff 的技能施放编号，供 SkillAffix 条件匹配同一次施放。',
          },
          presentation: definitionSchemaPart_50699134b8c284cd,
          childPresentations: definitionSchemaPart_3e827ff09a5598dd,
          timeClock: {
            kind: 'enum',
            options: ['default', 'global', 'self'],
            semantics: {
              type: 'BuffTimeClock | undefined',
              optional: true,
              unionVariants: [{ type: '"default"' }, { type: '"global"' }, { type: '"self"' }],
            },
            source: ['packages/game-data-contract/src/buffs.ts:686:3'],
            optional: true,
            description: '计算持续时间和触发间隔所用的时钟；不填时随全局时间缩放。',
          },
          applyTags: {
            kind: 'array',
            element: {
              kind: 'string',
              semantics: { type: 'string', aliases: ['GameplayTag'] },
              source: ['packages/game-data-contract/src/buffs.ts:688:3'],
            },
            semantics: {
              type: 'readonly string[] | undefined',
              arrayElement: { type: 'string', aliases: ['GameplayTag'] },
              optional: true,
            },
            source: ['packages/game-data-contract/src/buffs.ts:688:3'],
            optional: true,
            description:
              'Buff 的分类标签；启用时同时挂到所属实体，并用于按标签查找、计数和结束 Buff。',
          },
          extendTags: {
            kind: 'array',
            element: {
              kind: 'string',
              semantics: { type: 'string', aliases: ['GameplayTag'] },
              source: ['packages/game-data-contract/src/buffs.ts:690:3'],
            },
            semantics: {
              type: 'readonly string[] | undefined',
              arrayElement: { type: 'string', aliases: ['GameplayTag'] },
              optional: true,
            },
            source: ['packages/game-data-contract/src/buffs.ts:690:3'],
            optional: true,
            description: 'Buff 到期但被延长逻辑暂时阻止结束时，临时挂到所属实体的标签。',
          },
          stackingType: definitionSchemaPart_106b373694ee6d14,
          stackingKey: {
            kind: 'string',
            semantics: { type: 'string | undefined', optional: true },
            source: ['packages/game-data-contract/src/buffs.ts:694:3'],
            optional: true,
            description: 'Buff 所属的叠加组；不填时使用 Buff ID，同一组必须使用相同的叠加方式。',
          },
          priority: definitionSchemaPart_38c022b612b019d6,
          durationSeconds: definitionSchemaPart_d3dd6357b1df4217,
          addingCooldownSeconds: definitionSchemaPart_90855f34ff01a57b,
          ignoreAddingCooldown: {
            kind: 'boolean',
            semantics: { type: 'boolean | undefined', optional: true },
            source: ['packages/game-data-contract/src/buffs.ts:702:3'],
            optional: true,
            description: '只跳过已有冷却检查，仍在创建/叠层前登记本次冷却。',
          },
          triggerIntervalSeconds: definitionSchemaPart_c64dba6203828946,
          waitFirstTriggerInterval: {
            kind: 'boolean',
            semantics: { type: 'boolean | undefined', optional: true },
            source: ['packages/game-data-contract/src/buffs.ts:706:3'],
            optional: true,
            description: '是否等满一个触发间隔后再首次触发；为 false 时启用后的首次更新即可触发。',
          },
          maxTriggerCount: definitionSchemaPart_a1746dd748a5beac,
          attributeModifiers: definitionSchemaPart_6ef4a3723a418db7,
          keywordEnhancements: definitionSchemaPart_9a2a01cd9390f812,
          healModifiers: definitionSchemaPart_ef93b0b898e06dca,
          poiseModifiers: definitionSchemaPart_248f3862117f45d7,
          shields: definitionSchemaPart_68d17b9828d0a60f,
          sustainedProtection: definitionSchemaPart_ff63ec594135fc85,
          role: definitionSchemaPart_9223027ab677169a,
          spellBurst: definitionSchemaPart_e39c10fa09683334,
          actionGraph: {
            kind: 'graph',
            semantics: { type: 'ActionGraphResourceDefinition' },
            source: [
              'packages/game-data-contract/src/buffs.ts:137:3',
              'packages/game-data-contract/src/buffs.ts:179:30',
            ],
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
                  semantics: {
                    type: '"defender" | "attacker"',
                    unionVariants: [{ type: '"defender"' }, { type: '"attacker"' }],
                  },
                  source: ['packages/game-data-contract/src/buffs.ts:641:3'],
                  description: '修正安装在攻击方还是防御方时启用。',
                },
                condition: definitionSchemaPart_921258e328dfd16a,
                processors: definitionSchemaPart_88ca6fca7d8b52be,
                conditionProgram: {
                  kind: 'opaque',
                  fallback: { reason: 'graph-reference-boundary' },
                  semantics: {
                    type: 'ActionGraphReference | undefined',
                    aliases: ['ActionGraphReference'],
                    optional: true,
                  },
                  source: ['packages/game-data-contract/src/buffs.ts:651:3'],
                  optional: true,
                  description:
                    '以动作序列的最终结果决定是否启用处理器；不能与 `condition` 同时填写。',
                },
              },
              semantics: { type: 'SkillBuffDefinitionDamageModifier' },
              source: ['packages/game-data-contract/src/buffs.ts:139:3'],
            },
            semantics: {
              type: 'readonly SkillBuffDefinitionDamageModifier[] | undefined',
              arrayElement: { type: 'SkillBuffDefinitionDamageModifier' },
              optional: true,
            },
            source: ['packages/game-data-contract/src/buffs.ts:139:3'],
            optional: true,
            description: 'Buff 启用期间参与伤害计算的条件和数值处理器。',
          },
          maxStackCount: definitionSchemaPart_ae1b4b358bbcba44,
          scheduledSequences: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: definitionSchemaPart_db5f54ae2a57eb4c,
              semantics: { type: 'ScheduledSequenceDefinition' },
              source: ['packages/game-data-contract/src/buffs.ts:143:3'],
            },
            semantics: {
              type: 'readonly ScheduledSequenceDefinition[] | undefined',
              arrayElement: { type: 'ScheduledSequenceDefinition' },
              optional: true,
            },
            source: ['packages/game-data-contract/src/buffs.ts:143:3'],
            optional: true,
            description: 'Buff 启用期间按实例局部时钟执行的相对帧时间线。',
          },
          lifecycleSequences: {
            kind: 'object',
            fields: {
              start: {
                kind: 'opaque',
                fallback: { reason: 'graph-reference-boundary' },
                semantics: {
                  type: 'ActionGraphReference | undefined',
                  aliases: ['ActionGraphReference'],
                  optional: true,
                },
                source: ['packages/game-data-contract/src/buffs.ts:92:3'],
                optional: true,
                description: 'Buff 第一次启用时执行一次，早于修正注册。',
              },
              enable: {
                kind: 'opaque',
                fallback: { reason: 'graph-reference-boundary' },
                semantics: {
                  type: 'ActionGraphReference | undefined',
                  aliases: ['ActionGraphReference'],
                  optional: true,
                },
                source: ['packages/game-data-contract/src/buffs.ts:94:3'],
                optional: true,
                description: 'Buff 每次由停用转为启用后执行，晚于修正注册。',
              },
              disable: {
                kind: 'opaque',
                fallback: { reason: 'graph-reference-boundary' },
                semantics: {
                  type: 'ActionGraphReference | undefined',
                  aliases: ['ActionGraphReference'],
                  optional: true,
                },
                source: ['packages/game-data-contract/src/buffs.ts:96:3'],
                optional: true,
                description: 'Buff 暂停生效、准备注销修正前执行。',
              },
              beforeEnhance: {
                kind: 'opaque',
                fallback: { reason: 'graph-reference-boundary' },
                semantics: {
                  type: 'ActionGraphReference | undefined',
                  aliases: ['ActionGraphReference'],
                  optional: true,
                },
                source: ['packages/game-data-contract/src/buffs.ts:98:3'],
                optional: true,
                description: '同组 Buff 即将增加强化层数前执行。',
              },
              trigger: {
                kind: 'opaque',
                fallback: { reason: 'graph-reference-boundary' },
                semantics: {
                  type: 'ActionGraphReference | undefined',
                  aliases: ['ActionGraphReference'],
                  optional: true,
                },
                source: ['packages/game-data-contract/src/buffs.ts:100:3'],
                optional: true,
                description: 'Buff 启用期间按触发间隔到点时执行。',
              },
              enhanceChanged: {
                kind: 'opaque',
                fallback: { reason: 'graph-reference-boundary' },
                semantics: {
                  type: 'ActionGraphReference | undefined',
                  aliases: ['ActionGraphReference'],
                  optional: true,
                },
                source: ['packages/game-data-contract/src/buffs.ts:102:3'],
                optional: true,
                description: 'Buff 叠层数发生变化时执行。',
              },
              afterEnhance: {
                kind: 'opaque',
                fallback: { reason: 'graph-reference-boundary' },
                semantics: {
                  type: 'ActionGraphReference | undefined',
                  aliases: ['ActionGraphReference'],
                  optional: true,
                },
                source: ['packages/game-data-contract/src/buffs.ts:104:3'],
                optional: true,
                description: '一次叠层流程完成后执行。',
              },
              finish: {
                kind: 'opaque',
                fallback: { reason: 'graph-reference-boundary' },
                semantics: {
                  type: 'ActionGraphReference | undefined',
                  aliases: ['ActionGraphReference'],
                  optional: true,
                },
                source: ['packages/game-data-contract/src/buffs.ts:106:3'],
                optional: true,
                description: 'Buff 正式结束前执行，结束步骤仍能读取当前实例状态。',
              },
            },
            semantics: { type: 'SkillBuffLifecycleSequences | undefined', optional: true },
            source: ['packages/game-data-contract/src/buffs.ts:145:3'],
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
                    type: '"enterFight" | "ownerSwitchToCenter" | "ownerSwitchToGuard" | "ownerHpZero" | "hpChanged" | "abilityEntitySpawned" | "abilityEntityFinished" | "beforeHitByProjectile" | ... 36 more ... | "skillSpGained"',
                    unionVariants: [
                      { type: '"enterFight"' },
                      { type: '"ownerSwitchToCenter"' },
                      { type: '"ownerSwitchToGuard"' },
                      { type: '"ownerHpZero"' },
                      { type: '"hpChanged"' },
                      { type: '"abilityEntitySpawned"' },
                      { type: '"abilityEntityFinished"' },
                      { type: '"beforeHitByProjectile"' },
                      { type: '"beforeTakeDamage"' },
                      { type: '"beforeCalculateDamage"' },
                      { type: '"beforeDamageAction"' },
                      { type: '"beforeOutputDamage"' },
                      { type: '"beforeTakePhysicalInfliction"' },
                      { type: '"beforeOutputPhysicalInfliction"' },
                      { type: '"afterOutputPhysicalInfliction"' },
                      { type: '"beforeOutputKnockDown"' },
                      { type: '"afterOutputKnockDown"' },
                      { type: '"beforeOutputInfliction"' },
                      { type: '"beforeOutputSpellBurst"' },
                      { type: '"beforeTakeSpellInfliction"' },
                      { type: '"beforeTakeInfliction"' },
                      { type: '"afterTakeInfliction"' },
                      { type: '"takeDamage"' },
                      { type: '"takeCriticalDamage"' },
                      { type: '"outputDamage"' },
                      { type: '"outputCriticalDamage"' },
                      { type: '"outputKnockDown"' },
                      { type: '"outputHeal"' },
                      { type: '"receiveHeal"' },
                      { type: '"afterAddedShield"' },
                      { type: '"poiseZero"' },
                      { type: '"beforeCastSkill"' },
                      { type: '"afterSkillApplyCost"' },
                      { type: '"skillEnd"' },
                      { type: '"beforeOutputBuff"' },
                      { type: '"beforeAddedBuff"' },
                      { type: '"outputBuff"' },
                      { type: '"addedBuff"' },
                      { type: '"finishedBuff"' },
                      { type: '"buffEndsEarly"' },
                      { type: '"afterOutputWeaknessTriggered"' },
                      { type: '"customAbilityEvent"' },
                      { type: '"afterKillEntity"' },
                      { type: '"buffConsumed"' },
                      { type: '"skillSpGained"' },
                    ],
                  },
                  source: ['packages/game-data-contract/src/abilityEvents.ts:12:3'],
                  description: '要监听的事件。',
                },
                priority: {
                  kind: 'number',
                  semantics: { type: 'number' },
                  source: ['packages/game-data-contract/src/abilityEvents.ts:14:3'],
                  description: '同一事件有多项响应时的执行优先级。',
                },
                sequence: {
                  kind: 'opaque',
                  fallback: { reason: 'graph-reference-boundary' },
                  semantics: { type: 'ActionGraphReference', aliases: ['ActionGraphReference'] },
                  source: ['packages/game-data-contract/src/abilityEvents.ts:16:3'],
                  description: '事件触发后执行的动作序列。',
                },
              },
              semantics: { type: 'SkillBuffAbilityEventResponse' },
              source: ['packages/game-data-contract/src/buffs.ts:147:3'],
            },
            semantics: {
              type: 'readonly SkillBuffAbilityEventResponse[] | undefined',
              arrayElement: { type: 'SkillBuffAbilityEventResponse' },
              optional: true,
            },
            source: ['packages/game-data-contract/src/buffs.ts:147:3'],
            optional: true,
            description: '每个 Buff 实例独立注册、停用或结束时注销的 Ability 事件响应。',
          },
          igniteEventResponses: {
            kind: 'array',
            element: {
              kind: 'object',
              fields: {
                igniteType: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/buffs.ts:115:3'],
                  description: '可以触发这项响应的点燃类型。',
                },
                finishAfterIgnited: {
                  kind: 'boolean',
                  semantics: { type: 'boolean' },
                  source: ['packages/game-data-contract/src/buffs.ts:117:3'],
                  description: '响应执行后是否立即结束当前 Buff。',
                },
                sequence: {
                  kind: 'opaque',
                  fallback: { reason: 'graph-reference-boundary' },
                  semantics: { type: 'ActionGraphReference', aliases: ['ActionGraphReference'] },
                  source: ['packages/game-data-contract/src/buffs.ts:119:3'],
                  description: '点燃时执行的动作序列。',
                },
              },
              semantics: { type: 'SkillBuffIgniteEventResponse' },
              source: ['packages/game-data-contract/src/buffs.ts:149:3'],
            },
            semantics: {
              type: 'readonly SkillBuffIgniteEventResponse[] | undefined',
              arrayElement: { type: 'SkillBuffIgniteEventResponse' },
              optional: true,
            },
            source: ['packages/game-data-contract/src/buffs.ts:149:3'],
            optional: true,
            description: '每个实例独立持有的点燃响应；处理后是否结束由来源数据显式决定。',
          },
          skillSlotReplacements: definitionSchemaPart_a4cddd4d89db3386,
        },
        semantics: {
          type: 'Omit<BuffDefinitionProperties, "damageModifiers"> & { readonly actionGraph?: ActionGraphResourceDefinition | undefined; ... 7 more ...; presentation?: CombatBuffPresentation | undefined; } & { ...; }',
        },
        source: ['packages/game-data-contract/src/buffs.ts:178:1'],
      },
    ],
    semantics: {
      type: 'SkillBuffDefinition',
      unionVariants: [
        {
          type: 'Omit<BuffDefinitionProperties, "damageModifiers"> & { readonly actionGraph?: ActionGraphResourceDefinition | undefined; ... 7 more ...; presentation?: CombatBuffPresentation | undefined; } & { ...; }',
        },
        { type: 'StaticBuffDefinition' },
      ],
    },
    source: ['packages/game-data-contract/src/buffs.ts:178:1'],
    references: {
      field_501dfc83bb24b1942d68: {
        kind: 'array',
        element: definitionSchemaPart_1c749593f7129738,
        semantics: {
          type: 'readonly PoiseModifierCondition[]',
          arrayElement: {
            type: 'PoiseModifierCondition',
            unionVariants: [
              { type: '{ readonly kind: "casterControlled"; }' },
              {
                type: '{ readonly kind: "eventDamageTagsMatch"; readonly match: "hasAny" | "hasAll"; readonly tags: readonly ("normalAttack" | "normalAttackLastCombo" | "powerAttack" | "normalSkill" | "comboSkill" | ... 10 more ... | "natureAbnormal")[]; }',
              },
              {
                type: '{ readonly kind: "all"; readonly conditions: readonly PoiseModifierCondition[]; }',
              },
            ],
          },
        },
        source: ['packages/game-data-contract/src/modifiers.ts:391:7'],
      },
      field_01e39cedc30061b15589: {
        kind: 'array',
        element: definitionSchemaPart_ca69785fc89610cd,
        semantics: definitionSchemaPart_7c3aefbfef91ddf5,
        source: ['packages/game-data-contract/src/modifiers.ts:216:7'],
      },
      field_498d3bc7ee2662b24c3c: {
        kind: 'array',
        element: definitionSchemaPart_28251f7b6a82415b,
        semantics: definitionSchemaPart_7c3aefbfef91ddf5,
        source: ['packages/game-data-contract/src/modifiers.ts:210:7'],
      },
      field_74df3d9546567817b535: {
        kind: 'union',
        variants: [
          definitionSchemaPart_0ee0a4d68f827d67,
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['casterControlled'],
                semantics: { type: '"casterControlled"' },
                source: ['packages/game-data-contract/src/modifiers.ts:121:7'],
                description: '条件种类判别值。',
              },
            },
            semantics: { type: '{ readonly kind: "casterControlled"; }' },
            source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
          },
          definitionSchemaPart_4ebbdcfe1ab8da96,
          definitionSchemaPart_f175b2f8f21035ff,
          definitionSchemaPart_8eac86513cc1c067,
          definitionSchemaPart_b7b8c332fab674f2,
          definitionSchemaPart_730128473335a884,
          definitionSchemaPart_789b511a17f0bfd0,
          {
            kind: 'object',
            fields: {
              kind: {
                kind: 'enum',
                options: ['sourceSkillCastMatch'],
                semantics: { type: '"sourceSkillCastMatch"' },
                source: ['packages/game-data-contract/src/modifiers.ts:188:7'],
                description: '条件种类判别值。',
              },
            },
            semantics: { type: '{ readonly kind: "sourceSkillCastMatch"; }' },
            source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
          },
          definitionSchemaPart_8dc435109fa5665b,
          definitionSchemaPart_e595e04cf4e029b1,
          definitionSchemaPart_8a913fa4219e4268,
          definitionSchemaPart_d1f21442d02dbb22,
        ],
        semantics: definitionSchemaPart_14490bd1e3ddf34d,
        source: ['packages/game-data-contract/src/modifiers.ts:204:7'],
      },
    },
  },
  abilityEntity: {
    kind: 'object',
    fields: definitionSchemaPart_714413a486e79c86,
    semantics: { type: 'AbilityEntityDefinition' },
    source: ['packages/game-data-contract/src/skills.ts:101:1'],
  },
  abilityEntityChildSkill: {
    kind: 'object',
    fields: {
      actionGraph: {
        kind: 'graph',
        semantics: { type: 'ActionGraphResourceDefinition' },
        source: ['packages/game-data-contract/src/skills.ts:65:3'],
        description: '子技能自己的节点和宏，不与能力实体模板合图。',
      },
      skillId: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/skills.ts:67:3'],
        description: '子技能的原生 ID。',
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
        semantics: {
          type: '"normalSkill" | "comboSkill" | "ultimateSkill" | "dodge" | "breakingAttack" | "passiveSkill" | "attack" | "attachSkill" | "extraActiveSkill"',
          unionVariants: [
            { type: '"normalSkill"' },
            { type: '"comboSkill"' },
            { type: '"ultimateSkill"' },
            { type: '"dodge"' },
            { type: '"breakingAttack"' },
            { type: '"passiveSkill"' },
            { type: '"attack"' },
            { type: '"attachSkill"' },
            { type: '"extraActiveSkill"' },
          ],
        },
        source: ['packages/game-data-contract/src/skills.ts:69:3'],
        description: '实体注册表确定的原生技能类型。',
      },
      naturalDurationFrames: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/skills.ts:71:3'],
        description: '没有提前结束时的自然持续帧数。',
      },
      castResource: {
        kind: 'object',
        fields: {
          costFrame: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['packages/game-data-contract/src/skills.ts:50:3'],
            description: '从施放开始计数，达到该帧时确认扣费与冷却。',
          },
          cooldownSeconds: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['packages/game-data-contract/src/skills.ts:52:3'],
            description: '保留原生秒值；负值在消费者语义查明前不得改写。',
          },
          maxChargeTime: {
            kind: 'number',
            semantics: { type: 'number' },
            source: ['packages/game-data-contract/src/skills.ts:54:3'],
            description: '原生字段名尚未完成消费者语义核实，当前只保留其整数值。',
          },
          cost: {
            kind: 'object',
            fields: {
              resource: {
                kind: 'enum',
                options: ['sp', 'ultimateEnergy'],
                semantics: {
                  type: '"sp" | "ultimateEnergy"',
                  unionVariants: [{ type: '"sp"' }, { type: '"ultimateEnergy"' }],
                },
                source: ['packages/game-data-contract/src/skills.ts:137:3'],
                description: '要消耗的战斗资源。',
              },
              value: {
                kind: 'union',
                variants: [
                  {
                    kind: 'number',
                    semantics: { type: 'number' },
                    source: ['packages/game-data-contract/src/skills.ts:139:3'],
                  },
                  {
                    kind: 'array',
                    element: {
                      kind: 'number',
                      semantics: { type: 'number' },
                      source: ['packages/game-data-contract/src/skills.ts:139:3'],
                    },
                    semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
                    source: ['packages/game-data-contract/src/skills.ts:139:3'],
                  },
                ],
                semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
                source: ['packages/game-data-contract/src/skills.ts:139:3'],
                description: '单个费用或按技能等级排列的费用。',
              },
              availabilityThreshold: {
                kind: 'union',
                variants: [
                  {
                    kind: 'number',
                    semantics: { type: 'number' },
                    source: ['packages/game-data-contract/src/skills.ts:58:5'],
                  },
                  {
                    kind: 'array',
                    element: {
                      kind: 'number',
                      semantics: { type: 'number' },
                      source: ['packages/game-data-contract/src/skills.ts:58:5'],
                    },
                    semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
                    source: ['packages/game-data-contract/src/skills.ts:58:5'],
                  },
                ],
                semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
                source: ['packages/game-data-contract/src/skills.ts:58:5'],
                description: 'ATB 可释放门槛，独立于实际 cost.value。',
              },
            },
            semantics: {
              type: 'Readonly<SkillCostDefinition> & { readonly availabilityThreshold: LevelValues; }',
            },
            source: ['packages/game-data-contract/src/skills.ts:56:3'],
            description: '这次施放消耗的资源及可用门槛。',
          },
        },
        semantics: { type: 'SkillCastResourceDefinition' },
        source: ['packages/game-data-contract/src/skills.ts:73:3'],
        description: '该技能自己的扣费和冷却设置。',
      },
      blackboard: definitionSchemaPart_f4a857f6c7282a2a,
      scheduledSequences: definitionSchemaPart_372daf15f4884d97,
    },
    semantics: { type: 'AbilityEntityChildSkillDefinition' },
    source: ['packages/game-data-contract/src/skills.ts:63:1'],
  },
  abilityEntityPassiveSkill: {
    kind: 'object',
    fields: {
      actionGraph: {
        kind: 'graph',
        semantics: { type: 'ActionGraphResourceDefinition' },
        source: ['packages/game-data-contract/src/skills.ts:79:3'],
        description: '原生被动 SkillData 自己的图。',
      },
      key: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/skills.ts:81:3'],
        description: '被动技能在能力实体定义中的唯一名称。',
      },
      blackboard: {
        kind: 'record',
        value: {
          kind: 'union',
          variants: [
            {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/skills.ts:83:3'],
            },
            {
              kind: 'array',
              element: {
                kind: 'number',
                semantics: { type: 'number' },
                source: ['packages/game-data-contract/src/skills.ts:83:3'],
              },
              semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
              source: ['packages/game-data-contract/src/skills.ts:83:3'],
            },
          ],
          semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
          source: ['packages/game-data-contract/src/skills.ts:83:3'],
        },
        semantics: {
          type: 'Readonly<Record<string, LevelValues>> | undefined',
          recordValue: { type: 'LevelValues', aliases: ['LevelValues'] },
          optional: true,
        },
        source: ['packages/game-data-contract/src/skills.ts:83:3'],
        optional: true,
        description: '创建时按引用技能等级解析的初始黑板。',
      },
      enableSequence: {
        kind: 'opaque',
        fallback: { reason: 'graph-reference-boundary' },
        semantics: { type: 'ActionGraphReference', aliases: ['ActionGraphReference'] },
        source: ['packages/game-data-contract/src/skills.ts:85:3'],
        description: '能力实体启用时执行一次的动作序列。',
      },
      abilityEventResponses: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            event: {
              kind: 'enum',
              options: ['addedBuff'],
              semantics: { type: '"addedBuff"' },
              source: ['packages/game-data-contract/src/abilityEvents.ts:12:3'],
              description: '要监听的事件。',
            },
            priority: {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/abilityEvents.ts:14:3'],
              description: '同一事件有多项响应时的执行优先级。',
            },
            sequence: {
              kind: 'opaque',
              fallback: { reason: 'graph-reference-boundary' },
              semantics: { type: 'ActionGraphReference', aliases: ['ActionGraphReference'] },
              source: ['packages/game-data-contract/src/abilityEvents.ts:16:3'],
              description: '事件触发后执行的动作序列。',
            },
          },
          semantics: { type: 'AbilityEventResponse<"addedBuff">' },
          source: ['packages/game-data-contract/src/skills.ts:87:3'],
        },
        semantics: {
          type: 'readonly AbilityEventResponse<"addedBuff">[] | undefined',
          arrayElement: { type: 'AbilityEventResponse<"addedBuff">' },
          optional: true,
        },
        source: ['packages/game-data-contract/src/skills.ts:87:3'],
        optional: true,
        description: '实体存活期间监听的 Buff 加入事件响应。',
      },
    },
    semantics: { type: 'AbilityEntityPassiveSkillDefinition' },
    source: ['packages/game-data-contract/src/skills.ts:77:1'],
  },
  operatorPassiveSkill: {
    kind: 'object',
    fields: {
      actionGraph: {
        kind: 'graph',
        semantics: { type: 'ActionGraphResourceDefinition' },
        source: ['packages/game-data-contract/src/operators.ts:352:3'],
        description: '正式被动程序的局部主图与宏；不借用干员总图。',
      },
      key: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/operators.ts:354:3'],
        description: '被动技能在干员定义中的唯一名称。',
      },
      levelSource: {
        kind: 'enum',
        options: ['comboSkill', 'basicAttack', 'battleSkill', 'ultimate'],
        semantics: {
          type: '"comboSkill" | "basicAttack" | "battleSkill" | "ultimate" | undefined',
          optional: true,
          unionVariants: [
            { type: '"comboSkill"' },
            { type: '"basicAttack"' },
            { type: '"battleSkill"' },
            { type: '"ultimate"' },
          ],
        },
        source: ['packages/game-data-contract/src/operators.ts:356:3'],
        optional: true,
        description: '角色基础被动跟随其所属原生技能组；养成附加被动不设置该字段。',
      },
      blackboard: {
        kind: 'record',
        value: {
          kind: 'union',
          variants: [
            {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/operators.ts:358:3'],
            },
            {
              kind: 'array',
              element: {
                kind: 'number',
                semantics: { type: 'number' },
                source: ['packages/game-data-contract/src/operators.ts:358:3'],
              },
              semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
              source: ['packages/game-data-contract/src/operators.ts:358:3'],
            },
          ],
          semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
          source: ['packages/game-data-contract/src/operators.ts:358:3'],
        },
        semantics: {
          type: 'Readonly<Record<string, LevelValues>> | undefined',
          recordValue: { type: 'LevelValues', aliases: ['LevelValues'] },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:358:3'],
        optional: true,
        description: '被动启用序列读取的初始黑板；数组按所属技能或当前养成等级解析。',
      },
      enableSequence: {
        kind: 'opaque',
        fallback: { reason: 'graph-reference-boundary' },
        semantics: { type: 'ActionGraphReference', aliases: ['ActionGraphReference'] },
        source: ['packages/game-data-contract/src/operators.ts:360:3'],
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
              semantics: {
                type: '"abilityEntitySpawned" | "abilityEntityFinished" | "receiveHeal" | "addedBuff" | "skillSpGained"',
                unionVariants: [
                  { type: '"abilityEntitySpawned"' },
                  { type: '"abilityEntityFinished"' },
                  { type: '"receiveHeal"' },
                  { type: '"addedBuff"' },
                  { type: '"skillSpGained"' },
                ],
              },
              source: ['packages/game-data-contract/src/abilityEvents.ts:12:3'],
              description: '要监听的事件。',
            },
            priority: {
              kind: 'number',
              semantics: { type: 'number' },
              source: ['packages/game-data-contract/src/abilityEvents.ts:14:3'],
              description: '同一事件有多项响应时的执行优先级。',
            },
            sequence: {
              kind: 'opaque',
              fallback: { reason: 'graph-reference-boundary' },
              semantics: { type: 'ActionGraphReference', aliases: ['ActionGraphReference'] },
              source: ['packages/game-data-contract/src/abilityEvents.ts:16:3'],
              description: '事件触发后执行的动作序列。',
            },
          },
          semantics: {
            type: 'AbilityEventResponse<"abilityEntitySpawned" | "abilityEntityFinished" | "receiveHeal" | "addedBuff" | "skillSpGained">',
          },
          source: ['packages/game-data-contract/src/operators.ts:362:3'],
        },
        semantics: {
          type: 'readonly AbilityEventResponse<"abilityEntitySpawned" | "abilityEntityFinished" | "receiveHeal" | "addedBuff" | "skillSpGained">[] | undefined',
          arrayElement: {
            type: 'AbilityEventResponse<"abilityEntitySpawned" | "abilityEntityFinished" | "receiveHeal" | "addedBuff" | "skillSpGained">',
          },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:362:3'],
        optional: true,
        description: '被动 Skill 的原生事件响应；与启用程序共享被动黑板。',
      },
    },
    semantics: { type: 'OperatorPassiveSkillDefinition' },
    source: ['packages/game-data-contract/src/operators.ts:350:1'],
  },
  operatorUpgrade: {
    kind: 'object',
    fields: {
      actionGraph: {
        kind: 'graph',
        semantics: { type: 'ActionGraphResourceDefinition | undefined', optional: true },
        source: ['packages/game-data-contract/src/operators.ts:368:3'],
        optional: true,
        description: '初始化及养成事件响应的所属图；纯属性/附着 Buff 配置不需要程序图。',
      },
      levels: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/operators.ts:370:3'],
        description: '这一天赋或潜能可以选择的等级数量。',
      },
      simulationNoEffect: {
        kind: 'enum',
        options: [
          'uniqueEnemyHasNoAlternateTarget',
          'enemyDoesNotDealDamage',
          'enemyDoesNotInflictSpellStatusOnOperators',
        ],
        semantics: {
          type: '"uniqueEnemyHasNoAlternateTarget" | "enemyDoesNotDealDamage" | "enemyDoesNotInflictSpellStatusOnOperators" | undefined',
          optional: true,
          unionVariants: [
            { type: '"uniqueEnemyHasNoAlternateTarget"' },
            { type: '"enemyDoesNotDealDamage"' },
            { type: '"enemyDoesNotInflictSpellStatusOnOperators"' },
          ],
        },
        source: ['packages/game-data-contract/src/operators.ts:375:3'],
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
                  semantics: { type: '"addConditionalDamage"' },
                  source: ['packages/game-data-contract/src/operators.ts:102:7'],
                  description: '满足条件时增加伤害。',
                },
                condition: {
                  kind: 'union',
                  variants: [
                    {
                      kind: 'object',
                      fields: {
                        kind: {
                          kind: 'enum',
                          options: ['targetStaggered'],
                          semantics: { type: '"targetStaggered"' },
                          source: ['packages/game-data-contract/src/conditions.ts:121:7'],
                          description: '检查目标当前是否处于失衡状态。',
                        },
                        target: {
                          kind: 'enum',
                          options: ['enemy'],
                          semantics: {
                            type: '"enemy" | "caster"',
                            unionVariants: [{ type: '"enemy"' }, { type: '"caster"' }],
                          },
                          source: ['packages/game-data-contract/src/conditions.ts:123:7'],
                          description: '要检查的施法者或敌人。',
                        },
                      },
                      semantics: {
                        type: '{ kind: "targetStaggered"; target: "enemy" | "caster"; }',
                      },
                      source: ['packages/game-data-contract/src/operators.ts:104:7'],
                    },
                  ],
                  semantics: { type: 'CombatCondition', aliases: ['CombatCondition'] },
                  source: ['packages/game-data-contract/src/operators.ts:104:7'],
                  inlineCondition: 'enemyStaggered',
                  description: '增伤生效条件。',
                },
                values: {
                  kind: 'union',
                  variants: [
                    {
                      kind: 'number',
                      semantics: { type: 'number' },
                      source: ['packages/game-data-contract/src/operators.ts:106:7'],
                    },
                    {
                      kind: 'array',
                      element: {
                        kind: 'number',
                        semantics: { type: 'number' },
                        source: ['packages/game-data-contract/src/operators.ts:106:7'],
                      },
                      semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
                      source: ['packages/game-data-contract/src/operators.ts:106:7'],
                    },
                  ],
                  semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
                  source: ['packages/game-data-contract/src/operators.ts:106:7'],
                  description: '单个增伤值或按养成等级排列的增伤值。',
                },
              },
              semantics: {
                type: '{ kind: "addConditionalDamage"; condition: CombatCondition; values: LevelValues; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['enableSkillBranch'],
                  semantics: { type: '"enableSkillBranch"' },
                  source: ['packages/game-data-contract/src/operators.ts:110:7'],
                  description: '启用技能中的一个可选动作分支。',
                },
                skillKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:112:7'],
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
                branchKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:114:7'],
                  description: '目标分支。',
                },
              },
              semantics: {
                type: '{ kind: "enableSkillBranch"; skillKey: string; branchKey: string; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['multiplyEffectDuration'],
                  semantics: { type: '"multiplyEffectDuration"' },
                  source: ['packages/game-data-contract/src/operators.ts:118:7'],
                  description: '乘算某个技能步骤产生效果的持续时间。',
                },
                skillKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:120:7'],
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
                stepKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:122:7'],
                  description: '目标步骤。',
                },
                multiplier: {
                  kind: 'number',
                  semantics: { type: 'number' },
                  source: ['packages/game-data-contract/src/operators.ts:124:7'],
                  description: '持续时间乘数。',
                },
              },
              semantics: {
                type: '{ kind: "multiplyEffectDuration"; skillKey: string; stepKey: string; multiplier: number; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['multiplySkillCost'],
                  semantics: { type: '"multiplySkillCost"' },
                  source: ['packages/game-data-contract/src/operators.ts:128:7'],
                  description: '乘算技能的资源费用。',
                },
                skillKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:130:7'],
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
                resource: {
                  kind: 'enum',
                  options: ['sp', 'ultimateEnergy'],
                  semantics: {
                    type: '"sp" | "ultimateEnergy"',
                    unionVariants: [{ type: '"sp"' }, { type: '"ultimateEnergy"' }],
                  },
                  source: ['packages/game-data-contract/src/operators.ts:132:7'],
                  description: '要修改的资源。',
                },
                multiplier: {
                  kind: 'number',
                  semantics: { type: 'number' },
                  source: ['packages/game-data-contract/src/operators.ts:134:7'],
                  description: '费用乘数。',
                },
              },
              semantics: {
                type: '{ kind: "multiplySkillCost"; skillKey: string; resource: "sp" | "ultimateEnergy"; multiplier: number; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['setEffectiveness'],
                  semantics: { type: '"setEffectiveness"' },
                  source: ['packages/game-data-contract/src/operators.ts:138:7'],
                  description: '设置一个技能步骤的效果系数。',
                },
                skillKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:140:7'],
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
                stepKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:142:7'],
                  description: '目标步骤。',
                },
                value: {
                  kind: 'number',
                  semantics: { type: 'number' },
                  source: ['packages/game-data-contract/src/operators.ts:144:7'],
                  description: '新的效果系数。',
                },
              },
              semantics: {
                type: '{ kind: "setEffectiveness"; skillKey: string; stepKey: string; value: number; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addStaticDamageIncrease'],
                  semantics: { type: '"addStaticDamageIncrease"' },
                  source: ['packages/game-data-contract/src/operators.ts:148:7'],
                  description:
                    '将构筑期常驻增伤写入对应伤害属性；数值使用小数，例如 15% 写作 0.15。',
                },
                target: {
                  kind: 'enum',
                  options: ['physical', 'cryo', 'electric', 'normalAttack', 'battleSkill'],
                  semantics: {
                    type: '"physical" | "cryo" | "electric" | "normalAttack" | "battleSkill"',
                    unionVariants: [
                      { type: '"physical"' },
                      { type: '"cryo"' },
                      { type: '"electric"' },
                      { type: '"normalAttack"' },
                      { type: '"battleSkill"' },
                    ],
                  },
                  source: ['packages/game-data-contract/src/operators.ts:150:7'],
                  description: '增伤对应的攻击、元素或目标分类。',
                },
                value: {
                  kind: 'number',
                  semantics: { type: 'number' },
                  source: ['packages/game-data-contract/src/operators.ts:152:7'],
                  description: '加入该分类的增伤值。',
                },
              },
              semantics: {
                type: '{ kind: "addStaticDamageIncrease"; target: "physical" | "cryo" | "electric" | "normalAttack" | "battleSkill"; value: number; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addStaticHealingIncrease'],
                  semantics: { type: '"addStaticHealingIncrease"' },
                  source: ['packages/game-data-contract/src/operators.ts:156:7'],
                  description: '原生 HealOutputIncrease / HealTakenIncrease 的基础加算。',
                },
                target: {
                  kind: 'enum',
                  options: ['output', 'taken'],
                  semantics: {
                    type: '"output" | "taken"',
                    unionVariants: [{ type: '"output"' }, { type: '"taken"' }],
                  },
                  source: ['packages/game-data-contract/src/operators.ts:158:7'],
                  description: '增加治疗输出还是受到治疗。',
                },
                value: {
                  kind: 'number',
                  semantics: { type: 'number' },
                  source: ['packages/game-data-contract/src/operators.ts:160:7'],
                  description: '加入的治疗加成值。',
                },
              },
              semantics: {
                type: '{ kind: "addStaticHealingIncrease"; target: "output" | "taken"; value: number; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addSkillStat'],
                  semantics: { type: '"addSkillStat"' },
                  source: ['packages/game-data-contract/src/operators.ts:164:7'],
                  description: '修改一个技能的独立面板数值。',
                },
                skillKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:166:7'],
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
                stat: {
                  kind: 'enum',
                  options: ['criticalRate'],
                  semantics: { type: '"criticalRate"' },
                  source: ['packages/game-data-contract/src/operators.ts:168:7'],
                  description: '要修改的技能数值。',
                },
                value: {
                  kind: 'number',
                  semantics: { type: 'number' },
                  source: ['packages/game-data-contract/src/operators.ts:170:7'],
                  description: '加入的数值。',
                },
              },
              semantics: {
                type: '{ kind: "addSkillStat"; skillKey: string; stat: "criticalRate"; value: number; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['patchSkillBlackboard'],
                  semantics: { type: '"patchSkillBlackboard"' },
                  source: ['packages/game-data-contract/src/operators.ts:178:7'],
                  description:
                    '养成效果直接修补目标技能编译后的初始动作黑板。\n`operation` 使用与原生 SkillBBModifier 相同的 add/multiply/assign 语义；\n`value` 按天赋/潜能等级解析，而不是按技能等级解析。',
                },
                skillKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:180:7'],
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
                blackboardKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:182:7'],
                  description: '要修改的技能黑板键。',
                },
                operation: {
                  kind: 'enum',
                  options: ['assign', 'add', 'multiply'],
                  semantics: {
                    type: '"assign" | "add" | "multiply"',
                    unionVariants: [
                      { type: '"add"' },
                      { type: '"multiply"' },
                      { type: '"assign"' },
                    ],
                  },
                  source: ['packages/game-data-contract/src/operators.ts:184:7'],
                  description: '对原值执行加算、乘算或直接赋值。',
                },
                value: {
                  kind: 'union',
                  variants: [
                    {
                      kind: 'number',
                      semantics: { type: 'number' },
                      source: ['packages/game-data-contract/src/operators.ts:186:7'],
                    },
                    {
                      kind: 'array',
                      element: {
                        kind: 'number',
                        semantics: { type: 'number' },
                        source: ['packages/game-data-contract/src/operators.ts:186:7'],
                      },
                      semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
                      source: ['packages/game-data-contract/src/operators.ts:186:7'],
                    },
                  ],
                  semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
                  source: ['packages/game-data-contract/src/operators.ts:186:7'],
                  description: '单个数值或按养成等级排列的数值。',
                },
                minimumUpgradeLevel: {
                  kind: 'number',
                  semantics: { type: 'number | undefined', optional: true },
                  source: ['packages/game-data-contract/src/operators.ts:188:7'],
                  optional: true,
                  description: '仅该养成等级区间安装此补丁；用于原生按等级切换不同标志键的结构。',
                },
                maximumUpgradeLevel: {
                  kind: 'number',
                  semantics: { type: 'number | undefined', optional: true },
                  source: ['packages/game-data-contract/src/operators.ts:190:7'],
                  optional: true,
                  description: '超过此养成等级后不再安装此补丁。',
                },
                condition: {
                  kind: 'object',
                  fields: definitionSchemaPart_9d8aa2834ff90c0d,
                  semantics: {
                    type: '{ kind: "deckAttributeCompare"; left: "strength" | "agility" | "intellect" | "will"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: "strength" | ... 2 more ... | "will"; } | undefined',
                    aliases: ['BuildCondition'],
                    optional: true,
                  },
                  source: ['packages/game-data-contract/src/operators.ts:192:7'],
                  optional: true,
                  description: '原生 activeCondition；按最终构筑属性选择是否应用。',
                },
              },
              semantics: {
                type: '{ kind: "patchSkillBlackboard"; skillKey: string; blackboardKey: string; operation: "assign" | "add" | "multiply"; value: LevelValues; minimumUpgradeLevel?: number | undefined; maximumUpgradeLevel?: number | undefined; condition?: { ...; } | undefined; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['patchPassiveBlackboard'],
                  semantics: { type: '"patchPassiveBlackboard"' },
                  source: ['packages/game-data-contract/src/operators.ts:196:7'],
                  description:
                    '修改已启用天赋安装的隐藏被动技能黑板；目标天赋关闭时不产生被动程序。',
                },
                passiveSkillKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:198:7'],
                  description: '目标隐藏被动技能。',
                },
                blackboardKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:200:7'],
                  description: '要修改的被动黑板键。',
                },
                operation: {
                  kind: 'enum',
                  options: ['assign', 'add', 'multiply'],
                  semantics: {
                    type: '"assign" | "add" | "multiply"',
                    unionVariants: [
                      { type: '"add"' },
                      { type: '"multiply"' },
                      { type: '"assign"' },
                    ],
                  },
                  source: ['packages/game-data-contract/src/operators.ts:202:7'],
                  description: '对原值执行加算、乘算或直接赋值。',
                },
                value: {
                  kind: 'union',
                  variants: [
                    {
                      kind: 'number',
                      semantics: { type: 'number' },
                      source: ['packages/game-data-contract/src/operators.ts:204:7'],
                    },
                    {
                      kind: 'array',
                      element: {
                        kind: 'number',
                        semantics: { type: 'number' },
                        source: ['packages/game-data-contract/src/operators.ts:204:7'],
                      },
                      semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
                      source: ['packages/game-data-contract/src/operators.ts:204:7'],
                    },
                  ],
                  semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
                  source: ['packages/game-data-contract/src/operators.ts:204:7'],
                  description: '单个数值或按养成等级排列的数值。',
                },
              },
              semantics: {
                type: '{ kind: "patchPassiveBlackboard"; passiveSkillKey: string; blackboardKey: string; operation: "assign" | "add" | "multiply"; value: LevelValues; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['multiplySkillDamage'],
                  semantics: { type: '"multiplySkillDamage"' },
                  source: ['packages/game-data-contract/src/operators.ts:208:7'],
                  description: '乘算指定技能造成的伤害。',
                },
                skillKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:210:7'],
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
                multiplier: {
                  kind: 'number',
                  semantics: { type: 'number' },
                  source: ['packages/game-data-contract/src/operators.ts:212:7'],
                  description: '伤害乘数。',
                },
              },
              semantics: {
                type: '{ kind: "multiplySkillDamage"; skillKey: string; multiplier: number; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['multiplyStepDamage'],
                  semantics: { type: '"multiplyStepDamage"' },
                  source: ['packages/game-data-contract/src/operators.ts:216:7'],
                  description: '乘算一个具体技能步骤造成的伤害。',
                },
                skillKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:218:7'],
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
                stepKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:220:7'],
                  description: '目标步骤。',
                },
                multiplier: {
                  kind: 'number',
                  semantics: { type: 'number' },
                  source: ['packages/game-data-contract/src/operators.ts:222:7'],
                  description: '伤害乘数。',
                },
              },
              semantics: {
                type: '{ kind: "multiplyStepDamage"; skillKey: string; stepKey: string; multiplier: number; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['multiplySkillCooldown'],
                  semantics: { type: '"multiplySkillCooldown"' },
                  source: ['packages/game-data-contract/src/operators.ts:226:7'],
                  description: '乘算技能冷却时间。',
                },
                skillKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:228:7'],
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
                branchKey: {
                  kind: 'string',
                  semantics: { type: 'string | undefined', optional: true },
                  source: ['packages/game-data-contract/src/operators.ts:230:7'],
                  optional: true,
                  description: '只修改指定分支；省略时修改指定技能。',
                },
                multiplier: {
                  kind: 'number',
                  semantics: { type: 'number' },
                  source: ['packages/game-data-contract/src/operators.ts:232:7'],
                  description: '冷却时间乘数。',
                },
              },
              semantics: {
                type: '{ kind: "multiplySkillCooldown"; skillKey: string; branchKey?: string | undefined; multiplier: number; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addSkillCooldownFrames'],
                  semantics: { type: '"addSkillCooldownFrames"' },
                  source: ['packages/game-data-contract/src/operators.ts:236:7'],
                  description: '为技能冷却时间增加固定帧数。',
                },
                skillKey: {
                  kind: 'string',
                  semantics: { type: 'string' },
                  source: ['packages/game-data-contract/src/operators.ts:238:7'],
                  description: '目标执行技能；身份在所属定义宿主内唯一，与展示组无关。',
                },
                frames: {
                  kind: 'number',
                  semantics: { type: 'number' },
                  source: ['packages/game-data-contract/src/operators.ts:240:7'],
                  description: '增加的冷却帧数。',
                },
                condition: {
                  kind: 'object',
                  fields: definitionSchemaPart_9d8aa2834ff90c0d,
                  semantics: {
                    type: '{ kind: "deckAttributeCompare"; left: "strength" | "agility" | "intellect" | "will"; operator: "equal" | "notEqual" | "greater" | "greaterOrEqual" | "less" | "lessOrEqual"; right: "strength" | ... 2 more ... | "will"; } | undefined',
                    aliases: ['BuildCondition'],
                    optional: true,
                  },
                  source: ['packages/game-data-contract/src/operators.ts:242:7'],
                  optional: true,
                  description: '构筑满足该条件时才应用。',
                },
              },
              semantics: {
                type: '{ kind: "addSkillCooldownFrames"; skillKey: string; frames: number; condition?: { kind: "deckAttributeCompare"; left: "strength" | "agility" | "intellect" | "will"; operator: "equal" | ... 4 more ... | "lessOrEqual"; right: "strength" | ... 2 more ... | "will"; } | undefined; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addBuildAttribute'],
                  semantics: { type: '"addBuildAttribute"' },
                  source: ['packages/game-data-contract/src/operators.ts:246:7'],
                  description: '为一项或多项干员四维增加固定值。',
                },
                attributes: {
                  kind: 'array',
                  element: {
                    kind: 'enum',
                    options: ['strength', 'agility', 'intellect', 'will'],
                    semantics: {
                      type: '"strength" | "agility" | "intellect" | "will"',
                      unionVariants: [
                        { type: '"strength"' },
                        { type: '"agility"' },
                        { type: '"intellect"' },
                        { type: '"will"' },
                      ],
                    },
                    source: ['packages/game-data-contract/src/operators.ts:248:7'],
                  },
                  semantics: {
                    type: 'readonly ("strength" | "agility" | "intellect" | "will")[]',
                    arrayElement: {
                      type: '"strength" | "agility" | "intellect" | "will"',
                      unionVariants: [
                        { type: '"strength"' },
                        { type: '"agility"' },
                        { type: '"intellect"' },
                        { type: '"will"' },
                      ],
                    },
                  },
                  source: ['packages/game-data-contract/src/operators.ts:248:7'],
                  description: '要增加的四维属性。',
                },
                value: {
                  kind: 'number',
                  semantics: { type: 'number' },
                  source: ['packages/game-data-contract/src/operators.ts:250:7'],
                  description: '每项属性增加的数值。',
                },
              },
              semantics: {
                type: '{ kind: "addBuildAttribute"; attributes: readonly ("strength" | "agility" | "intellect" | "will")[]; value: number; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['modifyBasePanelStat'],
                  semantics: { type: '"modifyBasePanelStat"' },
                  source: ['packages/game-data-contract/src/operators.ts:257:7'],
                  description:
                    '修改静态面板属性的基础层。`flat` 在基础倍率前加算，`percent` 以小数累加到基础倍率。\n该边界对应原生八槽公式的基础加算与基础倍率，但名称描述实际运算，避免泄漏原生枚举名。',
                },
                stat: {
                  kind: 'enum',
                  options: ['health', 'defense', 'criticalRate', 'artsIntensity'],
                  semantics: {
                    type: '"health" | "defense" | "criticalRate" | "artsIntensity"',
                    unionVariants: [
                      { type: '"health"' },
                      { type: '"defense"' },
                      { type: '"criticalRate"' },
                      { type: '"artsIntensity"' },
                    ],
                  },
                  source: ['packages/game-data-contract/src/operators.ts:259:7'],
                  description: '要修改的基础面板属性。',
                },
                operation: {
                  kind: 'enum',
                  options: ['flat', 'percent'],
                  semantics: {
                    type: '"flat" | "percent"',
                    unionVariants: [{ type: '"flat"' }, { type: '"percent"' }],
                  },
                  source: ['packages/game-data-contract/src/operators.ts:261:7'],
                  description: '使用固定加值或百分比加值。',
                },
                value: {
                  kind: 'number',
                  semantics: { type: 'number' },
                  source: ['packages/game-data-contract/src/operators.ts:263:7'],
                  description: '加入的数值。',
                },
              },
              semantics: {
                type: '{ kind: "modifyBasePanelStat"; stat: "health" | "defense" | "criticalRate" | "artsIntensity"; operation: "flat" | "percent"; value: number; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addReactionDuration'],
                  semantics: { type: '"addReactionDuration"' },
                  source: ['packages/game-data-contract/src/operators.ts:267:7'],
                  description: '增加指定元素反应的持续时间。',
                },
                reaction: {
                  kind: 'enum',
                  options: ['electrification', 'corrosion'],
                  semantics: {
                    type: '"electrification" | "corrosion"',
                    unionVariants: [{ type: '"electrification"' }, { type: '"corrosion"' }],
                  },
                  source: ['packages/game-data-contract/src/operators.ts:269:7'],
                  description: '目标元素反应。',
                },
                seconds: {
                  kind: 'union',
                  variants: [
                    {
                      kind: 'number',
                      semantics: { type: 'number' },
                      source: ['packages/game-data-contract/src/operators.ts:271:7'],
                    },
                    {
                      kind: 'array',
                      element: {
                        kind: 'number',
                        semantics: { type: 'number' },
                        source: ['packages/game-data-contract/src/operators.ts:271:7'],
                      },
                      semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
                      source: ['packages/game-data-contract/src/operators.ts:271:7'],
                    },
                  ],
                  semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
                  source: ['packages/game-data-contract/src/operators.ts:271:7'],
                  description: '单个秒数或按养成等级排列的秒数。',
                },
              },
              semantics: {
                type: '{ kind: "addReactionDuration"; reaction: "electrification" | "corrosion"; seconds: LevelValues; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
            {
              kind: 'object',
              fields: {
                kind: {
                  kind: 'enum',
                  options: ['addReactionEffectiveness'],
                  semantics: { type: '"addReactionEffectiveness"' },
                  source: ['packages/game-data-contract/src/operators.ts:275:7'],
                  description: '增加指定元素反应的效果系数。',
                },
                reaction: {
                  kind: 'enum',
                  options: ['electrification', 'corrosion'],
                  semantics: {
                    type: '"electrification" | "corrosion"',
                    unionVariants: [{ type: '"electrification"' }, { type: '"corrosion"' }],
                  },
                  source: ['packages/game-data-contract/src/operators.ts:277:7'],
                  description: '目标元素反应。',
                },
                value: {
                  kind: 'union',
                  variants: [
                    {
                      kind: 'number',
                      semantics: { type: 'number' },
                      source: ['packages/game-data-contract/src/operators.ts:279:7'],
                    },
                    {
                      kind: 'array',
                      element: {
                        kind: 'number',
                        semantics: { type: 'number' },
                        source: ['packages/game-data-contract/src/operators.ts:279:7'],
                      },
                      semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
                      source: ['packages/game-data-contract/src/operators.ts:279:7'],
                    },
                  ],
                  semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
                  source: ['packages/game-data-contract/src/operators.ts:279:7'],
                  description: '单个加值或按养成等级排列的加值。',
                },
              },
              semantics: {
                type: '{ kind: "addReactionEffectiveness"; reaction: "electrification" | "corrosion"; value: LevelValues; }',
              },
              source: ['packages/game-data-contract/src/operators.ts:380:3'],
            },
          ],
          semantics: definitionSchemaPart_8d786ef8bbca3efb,
          source: ['packages/game-data-contract/src/operators.ts:380:3'],
        },
        semantics: {
          type: 'readonly UpgradeModifierDefinition[] | undefined',
          arrayElement: definitionSchemaPart_8d786ef8bbca3efb,
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:380:3'],
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
                  fields: definitionSchemaPart_2a78376690f2676a,
                  semantics: {
                    type: '{ kind: "spGained"; source?: "normalAttack" | "powerAttack" | "default" | "skill" | undefined; gainKind?: "gain" | "refund" | undefined; }',
                  },
                  source: ['packages/game-data-contract/src/operators.ts:339:3'],
                },
                {
                  kind: 'object',
                  fields: {
                    kind: {
                      kind: 'enum',
                      options: ['skillHit'],
                      semantics: { type: '"skillHit"' },
                      source: ['packages/game-data-contract/src/actions.ts:1761:7'],
                      description: '触发器种类判别值。',
                    },
                    skillKey: {
                      kind: 'string',
                      semantics: { type: 'string' },
                      source: ['packages/game-data-contract/src/actions.ts:1763:7'],
                      description: '要匹配的执行技能。',
                    },
                    scope: {
                      kind: 'enum',
                      options: ['team', 'operator'],
                      semantics: {
                        type: '"team" | "operator"',
                        unionVariants: [{ type: '"team"' }, { type: '"operator"' }],
                      },
                      source: ['packages/game-data-contract/src/actions.ts:1765:7'],
                      description: '检查当前干员还是全队来源。',
                    },
                  },
                  semantics: {
                    type: '{ kind: "skillHit"; skillKey: string; scope: "team" | "operator"; }',
                  },
                  source: ['packages/game-data-contract/src/operators.ts:339:3'],
                },
                {
                  kind: 'object',
                  fields: {
                    kind: {
                      kind: 'enum',
                      options: ['elementalAttachmentConsumed'],
                      semantics: { type: '"elementalAttachmentConsumed"' },
                      source: ['packages/game-data-contract/src/operators.ts:319:7'],
                      description: '事件种类判别值。',
                    },
                  },
                  semantics: { type: '{ kind: "elementalAttachmentConsumed"; }' },
                  source: ['packages/game-data-contract/src/operators.ts:339:3'],
                },
                {
                  kind: 'object',
                  fields: {
                    kind: {
                      kind: 'enum',
                      options: ['buffConsumed'],
                      semantics: { type: '"buffConsumed"' },
                      source: ['packages/game-data-contract/src/operators.ts:324:7'],
                      description: 'Buff 消费事件。',
                    },
                    buffIds: {
                      kind: 'array',
                      element: {
                        kind: 'string',
                        semantics: { type: 'string' },
                        source: ['packages/game-data-contract/src/operators.ts:326:7'],
                      },
                      semantics: { type: 'readonly string[]', arrayElement: { type: 'string' } },
                      source: ['packages/game-data-contract/src/operators.ts:326:7'],
                      description: '任一匹配即可触发的 Buff ID。',
                    },
                  },
                  semantics: { type: '{ kind: "buffConsumed"; buffIds: readonly string[]; }' },
                  source: ['packages/game-data-contract/src/operators.ts:339:3'],
                },
              ],
              semantics: {
                type: 'UpgradeEvent',
                unionVariants: [
                  {
                    type: '{ kind: "spGained"; source?: "normalAttack" | "powerAttack" | "default" | "skill" | undefined; gainKind?: "gain" | "refund" | undefined; }',
                  },
                  { type: '{ kind: "elementalAttachmentConsumed"; }' },
                  { type: '{ kind: "buffConsumed"; buffIds: readonly string[]; }' },
                  { type: '{ kind: "skillHit"; skillKey: string; scope: "team" | "operator"; }' },
                ],
              },
              source: ['packages/game-data-contract/src/operators.ts:339:3'],
              description: '要监听的事件及其筛选参数。',
            },
            blackboard: {
              kind: 'record',
              value: {
                kind: 'union',
                variants: [
                  {
                    kind: 'number',
                    semantics: { type: 'number' },
                    source: ['packages/game-data-contract/src/operators.ts:341:3'],
                  },
                  {
                    kind: 'array',
                    element: {
                      kind: 'number',
                      semantics: { type: 'number' },
                      source: ['packages/game-data-contract/src/operators.ts:341:3'],
                    },
                    semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
                    source: ['packages/game-data-contract/src/operators.ts:341:3'],
                  },
                ],
                semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
                source: ['packages/game-data-contract/src/operators.ts:341:3'],
              },
              semantics: {
                type: 'Readonly<Record<string, LevelValues>> | undefined',
                recordValue: { type: 'LevelValues', aliases: ['LevelValues'] },
                optional: true,
              },
              source: ['packages/game-data-contract/src/operators.ts:341:3'],
              optional: true,
              description: '监听器实例的原生常量黑板；数组按当前养成等级解析。',
            },
            sequence: {
              kind: 'opaque',
              fallback: { reason: 'graph-reference-boundary' },
              semantics: { type: 'ActionGraphReference', aliases: ['ActionGraphReference'] },
              source: ['packages/game-data-contract/src/operators.ts:343:3'],
              description: '事件触发后执行的动作序列。',
            },
          },
          semantics: { type: 'UpgradeEventHandlerDefinition' },
          source: ['packages/game-data-contract/src/operators.ts:382:3'],
        },
        semantics: {
          type: 'readonly UpgradeEventHandlerDefinition[] | undefined',
          arrayElement: { type: 'UpgradeEventHandlerDefinition' },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:382:3'],
        optional: true,
        description: '启用后注册的战斗事件响应。',
      },
      initializationSequence: {
        kind: 'opaque',
        fallback: { reason: 'graph-reference-boundary' },
        semantics: {
          type: 'ActionGraphReference | undefined',
          aliases: ['ActionGraphReference'],
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:384:3'],
        optional: true,
        description: '养成启用后直接安装的初始化行为；不是技能，也不进入可释放技能集合。',
      },
      attachedBuffs: {
        kind: 'array',
        element: {
          kind: 'object',
          fields: {
            buffId: {
              kind: 'string',
              semantics: { type: 'string' },
              source: ['packages/game-data-contract/src/operators.ts:387:5'],
            },
            blackboardAssignments: {
              kind: 'record',
              value: {
                kind: 'union',
                variants: [
                  {
                    kind: 'number',
                    semantics: { type: 'number' },
                    source: ['packages/game-data-contract/src/operators.ts:388:5'],
                  },
                  {
                    kind: 'array',
                    element: {
                      kind: 'number',
                      semantics: { type: 'number' },
                      source: ['packages/game-data-contract/src/operators.ts:388:5'],
                    },
                    semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
                    source: ['packages/game-data-contract/src/operators.ts:388:5'],
                  },
                ],
                semantics: { type: 'LevelValues', aliases: ['LevelValues'] },
                source: ['packages/game-data-contract/src/operators.ts:388:5'],
              },
              semantics: {
                type: 'Readonly<Record<string, LevelValues>> | undefined',
                recordValue: { type: 'LevelValues', aliases: ['LevelValues'] },
                optional: true,
              },
              source: ['packages/game-data-contract/src/operators.ts:388:5'],
              optional: true,
            },
          },
          semantics: {
            type: '{ readonly buffId: string; readonly blackboardAssignments?: Readonly<Record<string, LevelValues>> | undefined; }',
          },
          source: ['packages/game-data-contract/src/operators.ts:386:3'],
        },
        semantics: {
          type: 'readonly { readonly buffId: string; readonly blackboardAssignments?: Readonly<Record<string, LevelValues>> | undefined; }[] | undefined',
          arrayElement: {
            type: '{ readonly buffId: string; readonly blackboardAssignments?: Readonly<Record<string, LevelValues>> | undefined; }',
          },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:386:3'],
        optional: true,
        description: '原生 CharMiscFeature 直接附着的 Buff；数值按这一天赋或潜能的等级解析。',
      },
      passiveSkills: {
        kind: 'array',
        element: {
          kind: 'opaque',
          fallback: { reason: 'owned-resource-boundary' },
          semantics: { type: 'OperatorPassiveSkillDefinition' },
          source: ['packages/game-data-contract/src/operators.ts:391:3'],
        },
        semantics: {
          type: 'readonly OperatorPassiveSkillDefinition[] | undefined',
          arrayElement: { type: 'OperatorPassiveSkillDefinition' },
          optional: true,
        },
        source: ['packages/game-data-contract/src/operators.ts:391:3'],
        optional: true,
        description: '仅在这个养成项启用时安装；每个被动在一场战斗中只启用一次。',
      },
    },
    semantics: { type: 'OperatorUpgradeDefinition' },
    source: ['packages/game-data-contract/src/operators.ts:366:1'],
  },
  weaponTrait: {
    kind: 'object',
    fields: {
      key: {
        kind: 'string',
        semantics: { type: 'string' },
        source: ['packages/game-data-contract/src/equipment.ts:142:3'],
        description: '词条在该武器中的唯一名称。',
      },
      skillId: {
        kind: 'string',
        semantics: { type: 'string | undefined', optional: true },
        source: ['packages/game-data-contract/src/equipment.ts:144:3'],
        optional: true,
        description: '原生 SkillData 身份，仅用于来源记录；程序始终归属于本武器。',
      },
      levelCount: {
        kind: 'number',
        semantics: { type: 'number' },
        source: ['packages/game-data-contract/src/equipment.ts:146:3'],
        description: '这条词条可以解析的等级数量。',
      },
      actionGraph: {
        kind: 'graph',
        semantics: { type: 'ActionGraphResourceDefinition | undefined', optional: true },
        source: ['packages/game-data-contract/src/equipment.ts:124:3'],
        optional: true,
        description: '当前武器词条或套装效果自己的程序图；不按原生 ID 跨对象共享。',
      },
      modifiers: definitionSchemaPart_58975cbd1d457ed9,
      eventHandlers: definitionSchemaPart_f7274e9e44e89733,
      blackboard: definitionSchemaPart_278d3e397df130ba,
      enableSequence: {
        kind: 'opaque',
        fallback: { reason: 'graph-reference-boundary' },
        semantics: {
          type: 'ActionGraphReference | undefined',
          aliases: ['ActionGraphReference'],
          optional: true,
        },
        source: ['packages/game-data-contract/src/equipment.ts:134:3'],
        optional: true,
        description: '能力启用前执行一次；期间自身事件响应关闭，典型用途为原生普通启动 Buff。',
      },
      initializationSequence: {
        kind: 'opaque',
        fallback: { reason: 'graph-reference-boundary' },
        semantics: {
          type: 'ActionGraphReference | undefined',
          aliases: ['ActionGraphReference'],
          optional: true,
        },
        source: ['packages/game-data-contract/src/equipment.ts:136:3'],
        optional: true,
        description: '能力启用后在帧 0 执行一次；Toggle 初次安装及固定构筑刷新程序使用此入口。',
      },
    },
    semantics: { type: 'WeaponTraitDefinition' },
    source: ['packages/game-data-contract/src/equipment.ts:140:1'],
    references: definitionSchemaPart_d9d6d8826b5e5ff5,
  },
  gearTrait: {
    kind: 'object',
    fields: definitionSchemaPart_3720f5e4ffb8bd73,
    semantics: { type: 'GearTraitDefinition' },
    source: ['packages/game-data-contract/src/equipment.ts:178:1'],
  },
} as const satisfies DefinitionSchemaCatalog;
