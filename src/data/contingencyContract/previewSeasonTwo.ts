import type {
  ActionGraphNode,
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import type { OperatorBuffDefinitions } from '../../../packages/game-data-contract/src/buffs';
import type { ContingencyContractTagDefinition } from '../../../packages/game-data-contract/src/mechanics';
import type { ContractVariableConstraints } from './initialVariables';

/** 前瞻手填值，非正式游戏数据。行为使用原生 Buff，词条组合和默认参数仍待正式表确认。 */
export const seasonTwoPreviewValues = {
  comboDamageBonus: 0.5,
  comboCount: 2,
  lockSeconds: 9,
  spRecoveryBonus: 1,
  spGainBonus: 0.5,
  healDelaySeconds: 5,
  healRatioPerSecond: 0.02,
} as const;

/** 仅预览期需要的输入边界；初始值仍从初始化图读取。 */
export const seasonTwoVariableMetadata: Readonly<
  Record<number, Readonly<Record<string, ContractVariableConstraints>>>
> = {
  200001: {
    comboDamageBonus: {
      min: 0,
    },
    comboCount: {
      min: 1,
      max: 999,
      integer: true,
    },
    lockSeconds: { min: 0 },
  },
  200002: {
    spRecoveryBonus: {
      min: -1,
    },
    spGainBonus: { min: -1 },
  },
  200004: {
    healDelaySeconds: {
      min: 0,
    },
    healRatioPerSecond: {
      min: 0,
    },
  },
};

export function seasonTwoDisplayValues(values: Readonly<Record<string, number>>) {
  const result = { ...values };
  for (const [key, percent] of [
    ['comboDamageBonus', 'comboDamagePercent'],
    ['spRecoveryBonus', 'spRecoveryPercent'],
    ['spGainBonus', 'spGainPercent'],
    ['healRatioPerSecond', 'healPercent'],
  ] as const)
    if (result[key] !== undefined) result[percent] = result[key]! * 100;
  return result;
}

const number = (value: number) => ({ kind: 'constant' as const, value });
const ref = (id: string) => ({ $sequence: id });
const icon = (name: string): `endaxis:${string}` => `endaxis:contingency_contract/2/${name}`;
const node = (action: ActionGraphStep): ActionGraphNode => ({ action, next: null });
function graph(
  nodes: Record<string, ActionGraphNode>,
  variables: readonly string[] = [],
): ActionGraphResourceDefinition {
  return {
    main: {
      nodes,
      dataNodes: Object.fromEntries(
        variables.map(key => [
          key + 'Value',
          { type: 'number' as const, expression: { kind: 'blackboard' as const, key } },
        ]),
      ),
    },
    macros: {},
  };
}
// 仅翻译旧存档的入口参数；计时、状态检测和回血全部由原生 Buff 执行。
const healEntryId = 'buff_endaxis_cc2_heal';
export const seasonTwoEntryBuffs: OperatorBuffDefinitions = {
  [healEntryId]: {
    stackingType: 'unique',
    presentation: { visible: false },
    lifecycleSequences: { enable: [ref('initialize')] },
    actionGraph: graph({
      initialize: node({
        kind: 'applyBuff',
        parameters: {
          targets: { kind: 'owner' },
          buffs: [
            {
              buffId: 'buff_cc_eny_heal_no_inflict',
              copiedBlackboardAssignments: {
                countdown: 'healDelaySeconds',
                hp_ratio: 'healRatioPerSecond',
              },
            },
          ],
        },
      }),
    }),
  },
};
export const seasonTwoPreviewTags: readonly ContingencyContractTagDefinition[] = [
  200001, 200002, 200003, 200004,
].map((tagId, index) => ({
  tagId,
  columnId: `preview-${index}`,
  conflictId: '',
  score: 1,
  keyId: '',
  lockIds: [],
  romanNumSuffix: '',
  icon: icon(['lockdown', 'silence', 'dissipation', 'engorgement'][index]!),
  blackboard: {
    ...seasonTwoPreviewValues,
    comboDamagePercent: seasonTwoPreviewValues.comboDamageBonus * 100,
    spRecoveryPercent: seasonTwoPreviewValues.spRecoveryBonus * 100,
    spGainPercent: seasonTwoPreviewValues.spGainBonus * 100,
    healPercent: seasonTwoPreviewValues.healRatioPerSecond * 100,
  },
}));

const entryDefaults: readonly Readonly<Record<string, number>>[] = [
  {
    comboDamageBonus: seasonTwoPreviewValues.comboDamageBonus,
    comboCount: seasonTwoPreviewValues.comboCount,
    lockSeconds: seasonTwoPreviewValues.lockSeconds,
  },
  {
    spRecoveryBonus: seasonTwoPreviewValues.spRecoveryBonus,
    spGainBonus: seasonTwoPreviewValues.spGainBonus,
  },
  {},
  {
    healDelaySeconds: seasonTwoPreviewValues.healDelaySeconds,
    healRatioPerSecond: seasonTwoPreviewValues.healRatioPerSecond,
  },
];

const children = [
  [
    {
      buffId: 'buff_cc_chr_combo_lock',
      keys: { duration: 'lockSeconds', max_stack: 'comboCount' },
    },
    { buffId: 'buff_cc_chr_combo_skill_dmg_up', keys: { dmg_add: 'comboDamageBonus' } },
  ],
  [
    { buffId: 'buff_cc_chr_disable_same_normal_skill', keys: {} },
    { buffId: 'buff_cc_chr_set_skill_atb_recover_ratio', keys: { skill_ratio: 'spGainBonus' } },
  ],
  [{ buffId: 'buff_cc_chr_ult_skill_usp_clear', keys: {} }],
] satisfies readonly (readonly { buffId: string; keys: Record<string, string> }[])[];
export const seasonTwoPreviewPlans = seasonTwoPreviewTags.map((tag, index) => ({
  tagId: tag.tagId,
  sequence: ref('initialize'),
  actionGraph: graph(
    {
      initialize: node(
        index === 3
          ? {
              kind: 'applyBuff',
              parameters: {
                targets: { kind: 'fixed', target: 'enemy' },
                buffs: [
                  {
                    buffId: healEntryId,
                    blackboardAssignments: Object.fromEntries(
                      Object.entries(entryDefaults[index]!).map(([key, value]) => [
                        key,
                        number(value),
                      ]),
                    ),
                  },
                ],
              },
            }
          : {
              kind: 'createGlobalBuff',
              parameters: {
                globalBuffId: 'global_endaxis_cc2_' + tag.tagId,
                source: 'battle',
                blackboardAssignments: Object.fromEntries(
                  Object.entries(entryDefaults[index]!).map(([key, value]) => [key, number(value)]),
                ),
                definition: {
                  stackingType: 'unlimited',
                  blackboard: entryDefaults[index]!,
                  children: children[index]!.map(child => ({
                    buffId: child.buffId,
                    blackboardAssignments: Object.fromEntries(
                      Object.entries(child.keys).map(([key, source]) => [
                        key,
                        { kind: 'valueNode' as const, nodeId: source + 'Value' },
                      ]),
                    ),
                  })),
                  // 自然恢复倍率尚未核准原生入口，独立保留；技能恢复由原生事件 Buff 处理。
                  ...(index === 1
                    ? {
                        sharedSpModifiers: [
                          {
                            attribute: 'spRecovery' as const,
                            operation: 'multiplier' as const,
                            value: { kind: 'valueNode' as const, nodeId: 'spRecoveryBonusValue' },
                            applyToReturnSpGain: true,
                          },
                        ],
                      }
                    : {}),
                },
              },
            },
      ),
    },
    Object.keys(entryDefaults[index]!),
  ),
}));
